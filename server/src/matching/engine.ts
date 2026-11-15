/**
 * MORETOGETHER — Deterministic Matching Engine
 * Member 4 / ALGORITHM_AND_AI_POLICY.md implementation
 *
 * ALL scoring here is deterministic (weighted sums, set operations, exponential
 * decay). Nothing here is "AI". Only label a feature AI-assisted when an actual
 * configured model is invoked upstream.
 *
 * Score contract: entity_id, match_score (0–100), component_scores, matched_skills,
 * missing_requirements, explanation/reasons, eligibility_status.
 */

import {
  UserProfile,
  Opportunity,
  MatchResult,
  ComponentScores,
} from '../types/domain';

// ─── Configurable weights (alpha_k) — sum must equal 1.0 ─────────────────────
// These are initial hypotheses. Teams can tune via config in future.
export const DEFAULT_WEIGHTS = {
  skillCoverage: 0.45,
  interestSimilarity: 0.20,
  availability: 0.20,
  location: 0.15,
};

// Distance decay constant τ (km). Tune as needed.
const LOCATION_TAU_KM = 50;

/**
 * Haversine great-circle distance in km.
 */
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Step 1: Eligibility filter ──────────────────────────────────────────────
/**
 * Runs BEFORE any ranking.
 * Returns ineligibilityReasons list; empty = eligible.
 */
export function checkEligibility(
  user: UserProfile,
  opp: Opportunity
): string[] {
  const reasons: string[] = [];

  // Opportunity must be open
  if (opp.status !== 'open') {
    reasons.push('Opportunity is not open.');
  }

  // Mandatory skills: user must offer all mandatory skills
  const userOfferIds = new Set(
    user.skills.filter(s => s.direction === 'offer').map(s => s.skillId)
  );
  for (const os of opp.skills) {
    if (os.isMandatory && !userOfferIds.has(os.skillId)) {
      reasons.push(`Missing mandatory skill: ${os.skillName}`);
    }
  }

  // Remote feasibility: if opp is onsite and user is remote-only
  if (
    opp.remoteMode === 'onsite' &&
    user.remotePreference === 'remote'
  ) {
    reasons.push('Location/remote mismatch (user is remote-only, role is onsite).');
  }

  return reasons;
}

// ─── Step 2: Weighted skill coverage ─────────────────────────────────────────
/**
 * S_skill = Σ(w_i * indicator(skill i offered)) / Σ(w_i)
 * Returns 0 if opportunity has no required skills.
 */
export function skillCoverageScore(
  user: UserProfile,
  opp: Opportunity
): { score: number; matchedSkills: string[]; missingSkills: string[] } {
  const userOfferIds = new Set(
    user.skills.filter(s => s.direction === 'offer').map(s => s.skillId)
  );

  if (opp.skills.length === 0) {
    return { score: 0, matchedSkills: [], missingSkills: [] };
  }

  let numerator = 0;
  let denominator = 0;
  const matched: string[] = [];
  const missing: string[] = [];

  for (const os of opp.skills) {
    denominator += os.importance;
    if (userOfferIds.has(os.skillId)) {
      numerator += os.importance;
      matched.push(os.skillName);
    } else {
      missing.push(os.skillName);
    }
  }

  const score = denominator === 0 ? 0 : numerator / denominator;
  return { score, matchedSkills: matched, missingSkills: missing };
}

// ─── Step 3: Weighted interest similarity (Weighted Jaccard) ─────────────────
/**
 * J_w(A,B) = Σ min(w_Ai, w_Bi) / Σ max(w_Ai, w_Bi)
 * Empty-set behaviour: returns null (unavailable) if either set is empty.
 */
export function weightedInterestSimilarity(
  userInterests: Array<{ interest: string; weight: number }>,
  oppInterests: Array<{ interest: string; weight: number }>
): number | null {
  if (userInterests.length === 0 || oppInterests.length === 0) return null;

  const userMap = new Map(userInterests.map(i => [i.interest.toLowerCase(), i.weight]));
  const oppMap  = new Map(oppInterests.map(i => [i.interest.toLowerCase(), i.weight]));

  const allKeys = new Set([...userMap.keys(), ...oppMap.keys()]);

  let sumMin = 0;
  let sumMax = 0;

  for (const key of allKeys) {
    const wu = userMap.get(key) ?? 0;
    const wo = oppMap.get(key) ?? 0;
    sumMin += Math.min(wu, wo);
    sumMax += Math.max(wu, wo);
  }

  return sumMax === 0 ? null : sumMin / sumMax;
}

// ─── Step 4: Availability score ───────────────────────────────────────────────
/**
 * S_availability = min(1, overlapping_hours / required_hours)
 * Returns null if either value is unknown.
 */
export function availabilityScore(
  userHoursPw: number | null,
  requiredHoursPw: number | null
): number | null {
  if (userHoursPw === null || requiredHoursPw === null || requiredHoursPw === 0) {
    return null; // unknown — do not invent a value
  }
  return Math.min(1, userHoursPw / requiredHoursPw);
}

// ─── Step 5: Location score ───────────────────────────────────────────────────
/**
 * Remote work: score = 1 (no distance penalty).
 * Onsite/hybrid: exponential decay exp(-distance/tau).
 * Returns null if coordinates are unavailable for onsite matching.
 */
export function locationScore(
  user: UserProfile,
  opp: Opportunity
): number | null {
  // Remote on either side: no penalty
  if (
    opp.remoteMode === 'remote' ||
    user.remotePreference === 'remote'
  ) {
    return 1;
  }

  // Both have coordinates: apply distance decay
  if (
    user.latitude !== null && user.longitude !== null &&
    opp.latitude !== null && opp.longitude !== null
  ) {
    const dist = haversineKm(user.latitude, user.longitude, opp.latitude, opp.longitude);
    return Math.exp(-dist / LOCATION_TAU_KM);
  }

  // Same city text match (fallback when coordinates absent)
  if (
    user.location && opp.location &&
    user.location.toLowerCase().trim() === opp.location.toLowerCase().trim()
  ) {
    return 1;
  }

  // Flexible: neutral, do not penalise without data
  if (opp.remoteMode === 'flexible' || user.remotePreference === 'flexible') {
    return 0.5;
  }

  return null; // truly unknown
}

// ─── Step 6: Combined score S(u,o) ───────────────────────────────────────────
/**
 * S(u,o) = 100 * Σ_k(alpha_k * f_k(u,o))
 * Missing components are excluded and remaining weights re-normalised.
 * This is NOT accuracy — it is a match fit indicator.
 */
export function combinedScore(
  components: ComponentScores,
  weights = DEFAULT_WEIGHTS
): number {
  const pairs: Array<{ key: keyof typeof weights; value: number | null }> = [
    { key: 'skillCoverage',      value: components.skillCoverage },
    { key: 'interestSimilarity', value: components.interestSimilarity },
    { key: 'availability',       value: components.availability },
    { key: 'location',           value: components.location },
  ];

  let weightedSum = 0;
  let activeWeight = 0;

  for (const p of pairs) {
    if (p.value !== null) {
      weightedSum += weights[p.key] * p.value;
      activeWeight += weights[p.key];
    }
  }

  if (activeWeight === 0) return 0;
  return Math.round((weightedSum / activeWeight) * 100 * 100) / 100;
}

// ─── Step 7: Reciprocal fit ───────────────────────────────────────────────────
/**
 * R = λ*candidateToOpp + (1-λ)*oppToCandidate
 * candidateToOpp: how well the user covers the opportunity's needs.
 * oppToCandidate: how well the opportunity covers the user's needs
 *   (simple proxy: fraction of user's "need" skills that the opp requires).
 * λ = 0.6 by default (candidate fit weighted slightly higher).
 */
export function reciprocalFitScore(
  user: UserProfile,
  opp: Opportunity,
  candidateScore: number,  // 0–100 from combinedScore
  lambda = 0.6
): number {
  const userNeedIds = new Set(
    user.skills.filter(s => s.direction === 'need').map(s => s.skillId)
  );
  const oppSkillIds = new Set(opp.skills.map(s => s.skillId));

  if (userNeedIds.size === 0) {
    // No expressed needs: reciprocal component unavailable, return candidate score
    return candidateScore;
  }

  let covered = 0;
  for (const id of userNeedIds) {
    if (oppSkillIds.has(id)) covered++;
  }
  const oppToCandidate = covered / userNeedIds.size;
  const oppToCandidateScore = oppToCandidate * 100;

  return Math.round((lambda * candidateScore + (1 - lambda) * oppToCandidateScore) * 100) / 100;
}

// ─── Step 8: Fair-exposure boost for cold-start profiles ─────────────────────
/**
 * If a profile is new (few applications or new account) add a small exploration
 * bonus to prevent permanent burial. Capped so it cannot override a strong match.
 * This is a simple additive boost — not a model, not AI.
 */
export function coldStartBoost(
  score: number,
  profileAgeInDays: number,
  applicationCount: number,
  maxBoost = 5
): number {
  if (profileAgeInDays > 30 || applicationCount > 5) return score;
  const boost = maxBoost * Math.max(0, 1 - profileAgeInDays / 30);
  return Math.min(100, Math.round((score + boost) * 100) / 100);
}

// ─── Main entry point: score one user against one opportunity ─────────────────
export function scoreUserOpportunity(
  user: UserProfile,
  opp: Opportunity
): MatchResult {
  // 1. Eligibility — must run first
  const ineligibilityReasons = checkEligibility(user, opp);
  const isEligible = ineligibilityReasons.length === 0;

  // 2. Component scores (compute even when ineligible, for transparency)
  const { score: skillScore, matchedSkills, missingSkills } = skillCoverageScore(user, opp);
  const interestSim = weightedInterestSimilarity(user.interests, opp.interests);
  const availSc     = availabilityScore(user.availabilityHoursPw, opp.requiredHoursPw);
  const locSc       = locationScore(user, opp);

  const components: ComponentScores = {
    skillCoverage:      skillScore,
    interestSimilarity: interestSim,
    availability:       availSc,
    location:           locSc,
    reciprocal:         null, // filled below
  };

  // 3. Combined score
  let score = combinedScore(components);

  // 4. Reciprocal fit (updates score in-place)
  score = reciprocalFitScore(user, opp, score);
  components.reciprocal = score;

  // 5. Build human-readable reasons
  const reasons: string[] = [];
  if (skillScore > 0)
    reasons.push(`Covers ${matchedSkills.length} of ${opp.skills.length} required skill(s): ${matchedSkills.join(', ')}.`);
  if (interestSim !== null)
    reasons.push(`Interest alignment: ${(interestSim * 100).toFixed(0)}%.`);
  if (availSc !== null)
    reasons.push(`Availability: ${(availSc * 100).toFixed(0)}% of required hours.`);
  if (locSc !== null && locSc < 1)
    reasons.push(`Location fit: ${(locSc * 100).toFixed(0)}%.`);
  if (missingSkills.length > 0)
    reasons.push(`Missing skills: ${missingSkills.join(', ')}.`);

  return {
    entityId:            opp.id,
    matchScore:          score,
    componentScores:     components,
    matchedSkills,
    missingRequirements: missingSkills,
    reasons,
    eligibilityStatus:   isEligible ? 'eligible' : 'ineligible',
    ineligibilityReasons,
  };
}

// ─── Top-K results (Opportunity Radar) ───────────────────────────────────────
/**
 * Rank all eligible opportunities for a user, return top-K.
 * Uses a max-heap insertion to get top-K in O(n log K).
 * Ineligible results are still returned but after eligible ones (for transparency).
 */
export function topKMatches(
  user: UserProfile,
  opportunities: Opportunity[],
  k = 20,
  profileAgeInDays = 999,
  applicationCount = 999
): MatchResult[] {
  const results = opportunities.map(opp => {
    const r = scoreUserOpportunity(user, opp);
    if (r.eligibilityStatus === 'eligible') {
      r.matchScore = coldStartBoost(r.matchScore, profileAgeInDays, applicationCount);
    }
    return r;
  });

  // Sort: eligible first, then by score descending
  results.sort((a, b) => {
    if (a.eligibilityStatus !== b.eligibilityStatus) {
      return a.eligibilityStatus === 'eligible' ? -1 : 1;
    }
    return b.matchScore - a.matchScore;
  });

  return results.slice(0, k);
}
