/**
 * Search Service — Member 4
 * Uses PostgreSQL trigram indexing (pg_trgm) for fuzzy matching.
 * Fuse.js is used for skill-alias fuzzy matching in-memory.
 * Typo suggestions are offered but queries are NEVER silently rewritten.
 */
import Fuse from 'fuse.js';
import { query } from '../db/pool';
import { SearchQuery, SearchResult, Opportunity, Skill } from '../types/domain';

// ─── Skill fuzzy search with alias support ────────────────────────────────────
let skillIndex: Fuse<Skill> | null = null;
let cachedSkills: Skill[] = [];

async function getSkillIndex(): Promise<Fuse<Skill>> {
  if (skillIndex) return skillIndex;
  const rows = await query<{ id: number; name: string; category: string; aliases: string[] }>(
    `SELECT id, name, category, aliases FROM skills ORDER BY name`
  );
  cachedSkills = rows as Skill[];
  skillIndex = new Fuse(cachedSkills, {
    keys: ['name', 'aliases'],
    threshold: 0.35, // 0 = exact, 1 = match anything
    includeScore: true,
  });
  return skillIndex;
}

export async function searchSkills(term: string): Promise<{ skills: Skill[]; suggestion?: string }> {
  const index = await getSkillIndex();
  const results = index.search(term);
  const skills = results.map(r => r.item);
  // If no exact match but fuzzy results exist, surface a suggestion
  const exactMatch = cachedSkills.find(
    s => s.name.toLowerCase() === term.toLowerCase()
  );
  const suggestion =
    !exactMatch && skills.length > 0 ? skills[0].name : undefined;
  return { skills, suggestion };
}

export async function resolveSkillIds(terms: string[]): Promise<number[]> {
  const ids: Set<number> = new Set();
  const index = await getSkillIndex();
  for (const term of terms) {
    const results = index.search(term);
    if (results.length > 0) ids.add(results[0].item.id);
  }
  return [...ids];
}

// ─── Opportunity search ───────────────────────────────────────────────────────
export async function searchOpportunities(
  q: SearchQuery
): Promise<SearchResult<Opportunity>> {
  const page     = Math.max(1, q.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, q.pageSize ?? 20));
  const offset   = (page - 1) * pageSize;

  const params: any[] = [];
  const conditions: string[] = [`o.status = 'open'`];

  // Free-text: trigram similarity search on title + description
  let suggestion: string | undefined;
  if (q.q && q.q.trim().length > 0) {
    const term = q.q.trim();
    params.push(term);
    conditions.push(
      `(o.title ILIKE '%' || $${params.length} || '%'
        OR o.description ILIKE '%' || $${params.length} || '%'
        OR similarity(o.title, $${params.length}) > 0.1)`
    );
    // Typo suggestion via skills
    const { suggestion: skillSugg } = await searchSkills(term);
    if (skillSugg) suggestion = skillSugg;
  }

  if (q.type) {
    params.push(q.type);
    conditions.push(`o.type = $${params.length}`);
  }

  if (q.isPaid !== undefined) {
    params.push(q.isPaid);
    conditions.push(`o.is_paid = $${params.length}`);
  }

  if (q.remoteMode) {
    params.push(q.remoteMode);
    conditions.push(`o.remote_mode = $${params.length}`);
  }

  if (q.locationCity) {
    params.push(q.locationCity);
    conditions.push(`o.location ILIKE '%' || $${params.length} || '%'`);
  }

  if (q.availabilityHoursMin !== undefined) {
    params.push(q.availabilityHoursMin);
    conditions.push(
      `(o.required_hours_pw IS NULL OR o.required_hours_pw <= $${params.length})`
    );
  }

  // Skill filter: match opportunities that require any of the given skill IDs
  if (q.skills && q.skills.length > 0) {
    const resolvedIds = await resolveSkillIds(q.skills);
    if (resolvedIds.length > 0) {
      params.push(resolvedIds);
      conditions.push(
        `EXISTS (
           SELECT 1 FROM opportunity_skills os
           WHERE os.opportunity_id = o.id AND os.skill_id = ANY($${params.length}::int[])
         )`
      );
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count
  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM opportunities o ${where}`,
    params
  );
  const total = parseInt(countRows[0]?.count ?? '0', 10);

  // Fetch
  params.push(pageSize, offset);
  const rows = await query<any>(
    `SELECT o.*
     FROM opportunities o
     ${where}
     ORDER BY o.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  // Fetch skills per opportunity
  const oppIds = rows.map((r: any) => r.id);
  const skillRows: any[] = oppIds.length > 0
    ? await query<any>(
        `SELECT os.opportunity_id, os.skill_id, s.name AS skill_name, os.importance, os.is_mandatory
         FROM opportunity_skills os
         JOIN skills s ON s.id = os.skill_id
         WHERE os.opportunity_id = ANY($1::uuid[])`,
        [oppIds]
      )
    : [];

  const skillsByOpp = new Map<string, typeof skillRows>();
  for (const sr of skillRows) {
    if (!skillsByOpp.has(sr.opportunity_id)) skillsByOpp.set(sr.opportunity_id, []);
    skillsByOpp.get(sr.opportunity_id)!.push(sr);
  }

  // Fetch interests per opportunity
  const interestRows: any[] = oppIds.length > 0
    ? await query<any>(
        `SELECT opportunity_id, interest, weight
         FROM opportunity_interests
         WHERE opportunity_id = ANY($1::uuid[])`,
        [oppIds]
      )
    : [];

  const interestsByOpp = new Map<string, typeof interestRows>();
  for (const ir of interestRows) {
    if (!interestsByOpp.has(ir.opportunity_id)) interestsByOpp.set(ir.opportunity_id, []);
    interestsByOpp.get(ir.opportunity_id)!.push(ir);
  }

  const items: Opportunity[] = rows.map((r: any) => ({
    id:               r.id,
    ownerId:          r.owner_id,
    title:            r.title,
    description:      r.description,
    type:             r.type,
    isPaid:           r.is_paid,
    amountMin:        r.amount_min ? parseFloat(r.amount_min) : null,
    amountMax:        r.amount_max ? parseFloat(r.amount_max) : null,
    currency:         r.currency,
    location:         r.location,
    latitude:         r.latitude ? parseFloat(r.latitude) : null,
    longitude:        r.longitude ? parseFloat(r.longitude) : null,
    remoteMode:       r.remote_mode,
    requiredHoursPw:  r.required_hours_pw,
    status:           r.status,
    skills: (skillsByOpp.get(r.id) ?? []).map((s: any) => ({
      skillId:     s.skill_id,
      skillName:   s.skill_name,
      importance:  parseFloat(s.importance),
      isMandatory: s.is_mandatory,
    })),
    interests: (interestsByOpp.get(r.id) ?? []).map((i: any) => ({
      interest: i.interest,
      weight:   parseFloat(i.weight),
    })),
  }));

  return { items, total, page, pageSize, suggestion };
}

// ─── User profile loader (for matching) ──────────────────────────────────────
export async function loadUserProfile(userId: string) {
  const userRow = await query<any>(
    `SELECT u.id, u.display_name, p.location, p.latitude, p.longitude,
            p.remote_preference, p.availability_hours_pw, p.visibility
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = $1 AND u.is_active = true`,
    [userId]
  );
  if (!userRow[0]) return null;
  const r = userRow[0];

  const skillRows = await query<any>(
    `SELECT us.skill_id, s.name AS skill_name, us.direction, us.proficiency, us.weight
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1`,
    [userId]
  );

  const interestRows = await query<any>(
    `SELECT interest, weight FROM user_interests WHERE user_id = $1`,
    [userId]
  );

  return {
    userId:              r.id,
    displayName:         r.display_name,
    location:            r.location,
    latitude:            r.latitude ? parseFloat(r.latitude) : null,
    longitude:           r.longitude ? parseFloat(r.longitude) : null,
    remotePreference:    r.remote_preference,
    availabilityHoursPw: r.availability_hours_pw,
    visibility:          r.visibility,
    skills: skillRows.map((s: any) => ({
      skillId:        s.skill_id,
      skillName:      s.skill_name,
      direction:      s.direction,
      proficiency:    s.proficiency,
      weight:         parseFloat(s.weight),
    })),
    interests: interestRows.map((i: any) => ({
      interest: i.interest,
      weight:   parseFloat(i.weight),
    })),
  };
}
