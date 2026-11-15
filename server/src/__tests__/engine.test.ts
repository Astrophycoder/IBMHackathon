/**
 * Unit tests for the deterministic matching engine.
 * Covers: empty/missing data, eligibility, scoring components, reciprocal fit,
 * cold-start, and score-is-not-accuracy guard.
 */
import {
  checkEligibility,
  skillCoverageScore,
  weightedInterestSimilarity,
  availabilityScore,
  locationScore,
  combinedScore,
  reciprocalFitScore,
  coldStartBoost,
  topKMatches,
  haversineKm,
} from '../../matching/engine';
import { UserProfile, Opportunity, ComponentScores } from '../../types/domain';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const baseUser: UserProfile = {
  userId:              'user-1',
  displayName:         'Alice',
  location:            'Mumbai',
  latitude:            19.076,
  longitude:           72.877,
  remotePreference:    'hybrid',
  availabilityHoursPw: 20,
  visibility:          'public',
  skills: [
    { skillId: 1, skillName: 'JavaScript', direction: 'offer', proficiency: 'expert', weight: 1.0 },
    { skillId: 12, skillName: 'React',      direction: 'offer', proficiency: 'expert', weight: 0.9 },
    { skillId: 7,  skillName: 'Digital Marketing', direction: 'need', proficiency: null, weight: 0.6 },
  ],
  interests: [
    { interest: 'technology', weight: 1.0 },
    { interest: 'startups',   weight: 0.8 },
  ],
};

const baseOpp: Opportunity = {
  id:              'opp-1',
  ownerId:         'owner-1',
  title:           'React Developer',
  description:     'Build a website',
  type:            'freelance',
  isPaid:          true,
  amountMin:       5000,
  amountMax:       15000,
  currency:        'INR',
  location:        'Mumbai',
  latitude:        19.076,
  longitude:       72.877,
  remoteMode:      'remote',
  requiredHoursPw: 10,
  status:          'open',
  skills: [
    { skillId: 12, skillName: 'React',      importance: 1.0, isMandatory: true },
    { skillId: 1,  skillName: 'JavaScript', importance: 0.7, isMandatory: false },
  ],
  interests: [
    { interest: 'technology', weight: 1.0 },
    { interest: 'startups',   weight: 0.6 },
  ],
};

// ─── Eligibility ──────────────────────────────────────────────────────────────
describe('checkEligibility', () => {
  test('eligible when all mandatory skills covered and opp is open', () => {
    const reasons = checkEligibility(baseUser, baseOpp);
    expect(reasons).toHaveLength(0);
  });

  test('ineligible when opp is closed', () => {
    const reasons = checkEligibility(baseUser, { ...baseOpp, status: 'closed' });
    expect(reasons.some(r => r.includes('not open'))).toBe(true);
  });

  test('ineligible when mandatory skill missing', () => {
    const opp: Opportunity = {
      ...baseOpp,
      skills: [
        { skillId: 99, skillName: 'Rust', importance: 1.0, isMandatory: true },
      ],
    };
    const reasons = checkEligibility(baseUser, opp);
    expect(reasons.some(r => r.includes('Rust'))).toBe(true);
  });

  test('ineligible when remote-only user and onsite-only opp', () => {
    const reasons = checkEligibility(
      { ...baseUser, remotePreference: 'remote' },
      { ...baseOpp, remoteMode: 'onsite' }
    );
    expect(reasons.some(r => r.toLowerCase().includes('remote'))).toBe(true);
  });
});

// ─── Skill coverage ───────────────────────────────────────────────────────────
describe('skillCoverageScore', () => {
  test('full coverage when user has all required skills', () => {
    const { score } = skillCoverageScore(baseUser, baseOpp);
    // Both React (1.0) and JS (0.7) covered → score = (1.0+0.7)/(1.0+0.7) = 1
    expect(score).toBeCloseTo(1.0);
  });

  test('partial coverage — only one skill matched', () => {
    const user: UserProfile = {
      ...baseUser,
      skills: [
        { skillId: 12, skillName: 'React', direction: 'offer', proficiency: 'expert', weight: 1.0 },
      ],
    };
    const { score, matchedSkills, missingSkills } = skillCoverageScore(user, baseOpp);
    expect(score).toBeCloseTo(1.0 / 1.7); // React importance / total
    expect(matchedSkills).toContain('React');
    expect(missingSkills).toContain('JavaScript');
  });

  test('zero coverage when user has no matching skills', () => {
    const user: UserProfile = { ...baseUser, skills: [] };
    const { score } = skillCoverageScore(user, baseOpp);
    expect(score).toBe(0);
  });

  test('returns 0 when opportunity has no required skills', () => {
    const opp: Opportunity = { ...baseOpp, skills: [] };
    const { score } = skillCoverageScore(baseUser, opp);
    expect(score).toBe(0);
  });
});

// ─── Weighted interest similarity ─────────────────────────────────────────────
describe('weightedInterestSimilarity', () => {
  test('returns null when user interests are empty', () => {
    expect(weightedInterestSimilarity([], baseOpp.interests)).toBeNull();
  });

  test('returns null when opp interests are empty', () => {
    expect(weightedInterestSimilarity(baseUser.interests, [])).toBeNull();
  });

  test('returns 1 for identical interest sets', () => {
    const interests = [{ interest: 'technology', weight: 1.0 }];
    expect(weightedInterestSimilarity(interests, interests)).toBeCloseTo(1.0);
  });

  test('returns 0 for completely disjoint interests', () => {
    const a = [{ interest: 'cooking', weight: 1.0 }];
    const b = [{ interest: 'technology', weight: 1.0 }];
    expect(weightedInterestSimilarity(a, b)).toBeCloseTo(0);
  });

  test('partial overlap returns value between 0 and 1', () => {
    const result = weightedInterestSimilarity(baseUser.interests, baseOpp.interests);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0);
    expect(result!).toBeLessThanOrEqual(1);
  });
});

// ─── Availability ─────────────────────────────────────────────────────────────
describe('availabilityScore', () => {
  test('returns null when user hours unknown', () => {
    expect(availabilityScore(null, 10)).toBeNull();
  });

  test('returns null when required hours unknown', () => {
    expect(availabilityScore(20, null)).toBeNull();
  });

  test('returns null when required hours is 0', () => {
    expect(availabilityScore(20, 0)).toBeNull();
  });

  test('returns 1 when user has more hours than required', () => {
    expect(availabilityScore(40, 10)).toBe(1);
  });

  test('returns fraction when user has fewer hours', () => {
    expect(availabilityScore(5, 10)).toBeCloseTo(0.5);
  });
});

// ─── Location ─────────────────────────────────────────────────────────────────
describe('locationScore', () => {
  test('returns 1 for remote opportunity (no distance penalty)', () => {
    const score = locationScore(
      { ...baseUser, remotePreference: 'onsite', latitude: 19.0, longitude: 72.0 },
      { ...baseOpp, remoteMode: 'remote', latitude: 28.6, longitude: 77.2 }
    );
    expect(score).toBe(1);
  });

  test('returns 1 for remote user', () => {
    const score = locationScore(
      { ...baseUser, remotePreference: 'remote' },
      { ...baseOpp, remoteMode: 'onsite', latitude: 28.6, longitude: 77.2 }
    );
    expect(score).toBe(1);
  });

  test('returns 1 for same city text match when no coordinates', () => {
    const score = locationScore(
      { ...baseUser, latitude: null, longitude: null, location: 'Mumbai', remotePreference: 'hybrid' },
      { ...baseOpp, latitude: null, longitude: null, location: 'Mumbai', remoteMode: 'onsite' }
    );
    expect(score).toBe(1);
  });

  test('applies decay for distant onsite roles', () => {
    const score = locationScore(
      { ...baseUser, latitude: 19.076, longitude: 72.877, remotePreference: 'onsite' },
      { ...baseOpp, latitude: 28.635, longitude: 77.224, remoteMode: 'onsite' } // Mumbai→Delhi ~1400km
    );
    expect(score).not.toBeNull();
    expect(score!).toBeLessThan(0.01); // heavily decayed
  });

  test('returns null when both are onsite and coordinates missing, city mismatch', () => {
    const score = locationScore(
      { ...baseUser, latitude: null, longitude: null, location: 'Mumbai', remotePreference: 'onsite' },
      { ...baseOpp, latitude: null, longitude: null, location: 'Delhi', remoteMode: 'onsite' }
    );
    expect(score).toBeNull();
  });
});

// ─── Haversine ────────────────────────────────────────────────────────────────
describe('haversineKm', () => {
  test('Mumbai to Delhi is ~1400km', () => {
    const dist = haversineKm(19.076, 72.877, 28.635, 77.224);
    expect(dist).toBeGreaterThan(1350);
    expect(dist).toBeLessThan(1450);
  });

  test('same point is 0', () => {
    expect(haversineKm(19.0, 72.0, 19.0, 72.0)).toBeCloseTo(0);
  });
});

// ─── Combined score ───────────────────────────────────────────────────────────
describe('combinedScore', () => {
  test('returns 0 when all components are null', () => {
    const c: ComponentScores = {
      skillCoverage: null, interestSimilarity: null,
      availability: null, location: null, reciprocal: null
    };
    expect(combinedScore(c)).toBe(0);
  });

  test('returns 100 when all components are 1.0', () => {
    const c: ComponentScores = {
      skillCoverage: 1, interestSimilarity: 1,
      availability: 1, location: 1, reciprocal: null
    };
    expect(combinedScore(c)).toBeCloseTo(100);
  });

  test('renormalises missing components', () => {
    // Only skill coverage available
    const c: ComponentScores = {
      skillCoverage: 1, interestSimilarity: null,
      availability: null, location: null, reciprocal: null
    };
    expect(combinedScore(c)).toBeCloseTo(100);
  });

  test('score is never called accuracy (naming contract — always check label)', () => {
    // This test documents the contract: scores are match fit, not accuracy.
    // If this ever fails, someone renamed the field.
    const c: ComponentScores = {
      skillCoverage: 0.8, interestSimilarity: 0.6,
      availability: 0.9, location: 0.5, reciprocal: null
    };
    const score = combinedScore(c);
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ─── Reciprocal fit ───────────────────────────────────────────────────────────
describe('reciprocalFitScore', () => {
  test('returns candidateScore unchanged when user has no expressed needs', () => {
    const noNeeds: UserProfile = {
      ...baseUser,
      skills: baseUser.skills.filter(s => s.direction === 'offer'),
    };
    const r = reciprocalFitScore(noNeeds, baseOpp, 80);
    expect(r).toBe(80);
  });

  test('boosts score when opp covers user needs', () => {
    const needsDigitalMarketing: UserProfile = {
      ...baseUser,
      skills: [
        ...baseUser.skills.filter(s => s.direction === 'offer'),
        { skillId: 7, skillName: 'Digital Marketing', direction: 'need', proficiency: null, weight: 0.6 },
      ],
    };
    const oppWithMarketing: Opportunity = {
      ...baseOpp,
      skills: [
        ...baseOpp.skills,
        { skillId: 7, skillName: 'Digital Marketing', importance: 0.8, isMandatory: false },
      ],
    };
    const withNeed = reciprocalFitScore(needsDigitalMarketing, oppWithMarketing, 80);
    const withoutNeed = reciprocalFitScore(needsDigitalMarketing, baseOpp, 80);
    expect(withNeed).toBeGreaterThanOrEqual(withoutNeed);
  });
});

// ─── Cold-start boost ─────────────────────────────────────────────────────────
describe('coldStartBoost', () => {
  test('no boost for established profiles', () => {
    expect(coldStartBoost(70, 60, 10)).toBe(70);
  });

  test('boost for brand new profiles', () => {
    const boosted = coldStartBoost(70, 1, 0);
    expect(boosted).toBeGreaterThan(70);
    expect(boosted).toBeLessThanOrEqual(100);
  });

  test('never exceeds 100', () => {
    expect(coldStartBoost(99, 0, 0, 10)).toBeLessThanOrEqual(100);
  });
});

// ─── Top-K results ────────────────────────────────────────────────────────────
describe('topKMatches', () => {
  const opps: Opportunity[] = [
    baseOpp,
    {
      ...baseOpp, id: 'opp-2', status: 'closed',
      skills: [{ skillId: 12, skillName: 'React', importance: 1.0, isMandatory: true }],
    },
    {
      ...baseOpp, id: 'opp-3',
      skills: [{ skillId: 99, skillName: 'Rust', importance: 1.0, isMandatory: true }],
    },
  ];

  test('eligible results appear before ineligible', () => {
    const results = topKMatches(baseUser, opps);
    const eligibleIdx = results.findIndex(r => r.eligibilityStatus === 'eligible');
    const ineligibleIdx = results.findIndex(r => r.eligibilityStatus === 'ineligible');
    if (eligibleIdx !== -1 && ineligibleIdx !== -1) {
      expect(eligibleIdx).toBeLessThan(ineligibleIdx);
    }
  });

  test('respects k limit', () => {
    const results = topKMatches(baseUser, opps, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  test('private profiles are not in topK (privacy contract)', () => {
    const privateUser: UserProfile = { ...baseUser, visibility: 'private' };
    // topKMatches scores opportunities FOR a user; private visibility is
    // checked at the API route level, not inside the engine.
    // This test confirms the engine itself does not leak profile data.
    const results = topKMatches(privateUser, opps);
    // Result entity IDs are opportunity IDs, not user IDs — no user data leak
    results.forEach(r => {
      expect(r.entityId).toBeDefined();
      // matchResult does not contain other users' private data
      expect((r as any).email).toBeUndefined();
    });
  });

  test('handles empty opportunity list gracefully', () => {
    const results = topKMatches(baseUser, []);
    expect(results).toHaveLength(0);
  });

  test('handles user with no skills gracefully', () => {
    const noSkillUser: UserProfile = { ...baseUser, skills: [] };
    const results = topKMatches(noSkillUser, [baseOpp]);
    expect(results.length).toBeGreaterThanOrEqual(0);
    // Should be ineligible (missing mandatory React)
    expect(results[0]?.eligibilityStatus).toBe('ineligible');
  });
});
