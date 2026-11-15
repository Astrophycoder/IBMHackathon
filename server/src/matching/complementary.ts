/**
 * Complementary Skills Discovery
 * Uses a relational adjacency list (offer/need pairs) to find users whose
 * "offer" skills fill another user's "need" skills and vice-versa.
 * No graph database needed — plain SQL join implemented in the service.
 */
import { query } from '../db/pool';

export interface ComplementaryMatch {
  userId: string;
  displayName: string;
  offersYouNeed: string[];    // skills this person offers that you need
  needsYouOffer: string[];    // skills you offer that this person needs
  complementScore: number;    // 0–100; higher = more complementary
  reasons: string[];
}

/**
 * Find users complementary to targetUserId.
 * Algorithm: relational join on (A.need ∩ B.offer) ∪ (A.offer ∩ B.need).
 * Complexity: O(n) over users sharing at least one skill edge — practical
 * with indexed user_skills table.
 */
export async function findComplementaryUsers(
  targetUserId: string,
  limit = 10
): Promise<ComplementaryMatch[]> {
  // Fetch target user's skills
  const targetSkills = await query<{
    skill_id: number; skill_name: string; direction: string;
  }>(
    `SELECT us.skill_id, s.name AS skill_name, us.direction
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1`,
    [targetUserId]
  );

  if (targetSkills.length === 0) return [];

  const myNeeds  = new Set(targetSkills.filter(s => s.direction === 'need').map(s => s.skill_id));
  const myOffers = new Set(targetSkills.filter(s => s.direction === 'offer').map(s => s.skill_id));

  if (myNeeds.size === 0 && myOffers.size === 0) return [];

  // Find candidate users who share at least one complementary edge
  const candidates = await query<{
    user_id: string; display_name: string;
    skill_id: number; skill_name: string; direction: string;
  }>(
    `SELECT u.id AS user_id, u.display_name, us.skill_id, s.name AS skill_name, us.direction
     FROM users u
     JOIN user_skills us ON us.user_id = u.id
     JOIN skills s ON s.id = us.skill_id
     JOIN profiles p ON p.user_id = u.id
     WHERE u.id <> $1
       AND p.visibility = 'public'
       AND u.is_active = true
       AND us.skill_id = ANY($2::int[])`,
    [targetUserId, [...new Set([...myNeeds, ...myOffers])]]
  );

  // Group by user
  const byUser = new Map<string, typeof candidates>();
  for (const row of candidates) {
    if (!byUser.has(row.user_id)) byUser.set(row.user_id, []);
    byUser.get(row.user_id)!.push(row);
  }

  const results: ComplementaryMatch[] = [];

  for (const [userId, rows] of byUser) {
    const displayName = rows[0].display_name;
    const theirOffers = new Set(rows.filter(r => r.direction === 'offer').map(r => r.skill_id));
    const theirNeeds  = new Set(rows.filter(r => r.direction === 'need').map(r => r.skill_id));

    const offersYouNeedIds = [...myNeeds].filter(id => theirOffers.has(id));
    const needsYouOfferIds = [...myOffers].filter(id => theirNeeds.has(id));

    if (offersYouNeedIds.length === 0 && needsYouOfferIds.length === 0) continue;

    // Skill names
    const skillNameMap = new Map(rows.map(r => [r.skill_id, r.skill_name]));
    const offersYouNeed = offersYouNeedIds.map(id => skillNameMap.get(id) ?? String(id));
    const needsYouOffer = needsYouOfferIds.map(id => {
      const mine = targetSkills.find(s => s.skill_id === id);
      return mine?.skill_name ?? String(id);
    });

    // Score: fraction of your needs they cover + fraction of their needs you cover
    const needCoverage  = myNeeds.size > 0 ? offersYouNeedIds.length / myNeeds.size : 0;
    const offerCoverage = theirNeeds.size > 0 ? needsYouOfferIds.length / theirNeeds.size : 0;
    const complementScore = Math.round(((needCoverage + offerCoverage) / 2) * 100);

    const reasons: string[] = [];
    if (offersYouNeed.length > 0)
      reasons.push(`They offer: ${offersYouNeed.join(', ')} — which you need.`);
    if (needsYouOffer.length > 0)
      reasons.push(`You offer: ${needsYouOffer.join(', ')} — which they need.`);

    results.push({ userId, displayName, offersYouNeed, needsYouOffer, complementScore, reasons });
  }

  results.sort((a, b) => b.complementScore - a.complementScore);
  return results.slice(0, limit);
}
