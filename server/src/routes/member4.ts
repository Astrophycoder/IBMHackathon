import { Router, Request, Response } from 'express';
import { searchOpportunities, loadUserProfile } from '../search/searchService';
import { searchSkills } from '../search/searchService';
import { topKMatches } from '../matching/engine';
import { findComplementaryUsers } from '../matching/complementary';
import { greedyTeamFormation } from '../matching/teamFormation';
import { handleAssistantRequest, draftListingFromText } from '../assistant/assistantService';
import { query, queryOne } from '../db/pool';

const router = Router();

// ─── GET /api/search/opportunities ───────────────────────────────────────────
// Free-text + filtered search with typo suggestions
router.get('/search/opportunities', async (req: Request, res: Response) => {
  try {
    const q = {
      q:                    req.query.q as string | undefined,
      type:                 req.query.type as string | undefined,
      isPaid:               req.query.isPaid !== undefined ? req.query.isPaid === 'true' : undefined,
      remoteMode:           req.query.remoteMode as string | undefined,
      skills:               req.query.skills ? (req.query.skills as string).split(',') : undefined,
      locationCity:         req.query.locationCity as string | undefined,
      availabilityHoursMin: req.query.availabilityHoursMin ? parseInt(req.query.availabilityHoursMin as string) : undefined,
      page:                 req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize:             req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
    };
    const result = await searchOpportunities(q);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed.' });
  }
});

// ─── GET /api/search/skills?q=term ───────────────────────────────────────────
// Skill name + alias fuzzy search with typo suggestion
router.get('/search/skills', async (req: Request, res: Response) => {
  const term = (req.query.q as string | undefined) ?? '';
  if (!term.trim()) return res.json({ skills: [], suggestion: undefined });
  try {
    const result = await searchSkills(term);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Skill search failed.' });
  }
});

// ─── GET /api/radar/:userId ───────────────────────────────────────────────────
// Opportunity Radar: top-K matched opportunities for a user
router.get('/radar/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const k = parseInt((req.query.k as string) ?? '20');

  try {
    const profile = await loadUserProfile(userId);
    if (!profile) return res.status(404).json({ error: 'User not found.' });

    // Don't expose private profiles
    if (profile.visibility === 'private') {
      return res.status(403).json({ error: 'Profile is private.' });
    }

    const opps = await searchOpportunities({ pageSize: 200 });

    // Profile age for cold-start
    const ageRow = await queryOne<{ days: number }>(
      `SELECT EXTRACT(EPOCH FROM (NOW() - created_at))/86400 AS days FROM users WHERE id = $1`,
      [userId]
    );
    const profileAgeInDays = Math.round(ageRow?.days ?? 999);

    const appCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM applications WHERE applicant_id = $1`,
      [userId]
    );
    const applicationCount = parseInt(appCount?.count ?? '0', 10);

    const matches = topKMatches(profile, opps.items, k, profileAgeInDays, applicationCount);
    res.json({ userId, matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Radar failed.' });
  }
});

// ─── GET /api/match/:userId/:opportunityId ────────────────────────────────────
// Score one user against one opportunity
router.get('/match/:userId/:opportunityId', async (req: Request, res: Response) => {
  const { userId, opportunityId } = req.params;
  try {
    const profile = await loadUserProfile(userId);
    if (!profile) return res.status(404).json({ error: 'User not found.' });

    const oppRow = await query<any>(
      `SELECT o.*, os.skill_id, s.name AS skill_name, os.importance, os.is_mandatory,
              oi.interest, oi.weight AS interest_weight
       FROM opportunities o
       LEFT JOIN opportunity_skills os ON os.opportunity_id = o.id
       LEFT JOIN skills s ON s.id = os.skill_id
       LEFT JOIN opportunity_interests oi ON oi.opportunity_id = o.id
       WHERE o.id = $1`,
      [opportunityId]
    );
    if (!oppRow.length) return res.status(404).json({ error: 'Opportunity not found.' });

    // Reconstruct opportunity from joined rows
    const base = oppRow[0];
    const opp = {
      id:              base.id,
      ownerId:         base.owner_id,
      title:           base.title,
      description:     base.description,
      type:            base.type,
      isPaid:          base.is_paid,
      amountMin:       base.amount_min ? parseFloat(base.amount_min) : null,
      amountMax:       base.amount_max ? parseFloat(base.amount_max) : null,
      currency:        base.currency,
      location:        base.location,
      latitude:        base.latitude ? parseFloat(base.latitude) : null,
      longitude:       base.longitude ? parseFloat(base.longitude) : null,
      remoteMode:      base.remote_mode,
      requiredHoursPw: base.required_hours_pw,
      status:          base.status,
      skills: oppRow
        .filter((r: any) => r.skill_id !== null)
        .map((r: any) => ({
          skillId:     r.skill_id,
          skillName:   r.skill_name,
          importance:  parseFloat(r.importance),
          isMandatory: r.is_mandatory,
        }))
        .filter((v: any, i: number, a: any[]) => a.findIndex((x: any) => x.skillId === v.skillId) === i),
      interests: oppRow
        .filter((r: any) => r.interest !== null)
        .map((r: any) => ({ interest: r.interest, weight: parseFloat(r.interest_weight) }))
        .filter((v: any, i: number, a: any[]) => a.findIndex((x: any) => x.interest === v.interest) === i),
    };

    const { scoreUserOpportunity } = await import('../matching/engine');
    const result = scoreUserOpportunity(profile, opp);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Match scoring failed.' });
  }
});

// ─── GET /api/complementary/:userId ──────────────────────────────────────────
// Find users with complementary offer/need skill pairs
router.get('/complementary/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = parseInt((req.query.limit as string) ?? '10');
  try {
    const profile = await loadUserProfile(userId);
    if (!profile) return res.status(404).json({ error: 'User not found.' });
    const matches = await findComplementaryUsers(userId, limit);
    res.json({ userId, matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Complementary search failed.' });
  }
});

// ─── POST /api/team-formation ─────────────────────────────────────────────────
// Form a team to cover a set of roles
router.post('/team-formation', async (req: Request, res: Response) => {
  const { roles, candidateIds } = req.body;
  if (!Array.isArray(roles) || !Array.isArray(candidateIds)) {
    return res.status(400).json({ error: 'roles and candidateIds arrays required.' });
  }

  try {
    // Load candidate skills
    const rows = await query<any>(
      `SELECT u.id AS user_id, u.display_name, us.skill_id,
              EXTRACT(EPOCH FROM (NOW() - u.created_at))/86400 AS age_days
       FROM users u
       JOIN user_skills us ON us.user_id = u.id
       WHERE u.id = ANY($1::uuid[]) AND us.direction = 'offer'`,
      [candidateIds]
    );

    const byUser = new Map<string, typeof rows[0][]>();
    for (const r of rows) {
      if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
      byUser.get(r.user_id)!.push(r);
    }

    const candidates = [...byUser.entries()].map(([uid, urows]) => ({
      userId:           uid,
      displayName:      urows[0].display_name,
      offerSkillIds:    urows.map(r => r.skill_id),
      profileAgeInDays: Math.round(parseFloat(urows[0].age_days)),
    }));

    const result = greedyTeamFormation(roles, candidates);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Team formation failed.' });
  }
});

// ─── POST /api/assistant ──────────────────────────────────────────────────────
// Natural-language assistant (fallback-first; AI-assisted only when model configured)
router.post('/assistant', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required.' });
  }
  try {
    const response = await handleAssistantRequest(message);
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Assistant failed.' });
  }
});

// ─── POST /api/assistant/draft-listing ───────────────────────────────────────
// Drafts a listing from natural language (requires model; returns null otherwise)
router.post('/assistant/draft-listing', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required.' });
  }
  try {
    const draft = await draftListingFromText(message);
    if (!draft) {
      return res.json({
        draft: null,
        fallback: true,
        message: 'No AI model configured. Use the posting form instead.',
      });
    }
    res.json({
      draft,
      fallback: false,
      disclaimer: 'AI-generated draft. Review carefully before posting.',
    });
  } catch (err) {
    res.status(500).json({ error: 'Draft listing failed.' });
  }
});

export default router;
