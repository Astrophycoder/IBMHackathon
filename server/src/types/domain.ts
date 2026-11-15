// Shared domain types — aligned with SHARED_CONTRACTS.md

export interface Skill {
  id: number;
  name: string;
  category: string;
  aliases: string[];
}

export interface UserSkill {
  skillId: number;
  skillName: string;
  direction: 'offer' | 'need';
  proficiency: string | null;
  weight: number; // 0–1
}

export interface UserProfile {
  userId: string;
  displayName: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  remotePreference: 'remote' | 'onsite' | 'hybrid' | 'flexible' | null;
  availabilityHoursPw: number | null;
  visibility: 'public' | 'private' | 'connections';
  skills: UserSkill[];
  interests: Array<{ interest: string; weight: number }>;
}

export interface OpportunitySkill {
  skillId: number;
  skillName: string;
  importance: number;  // 0–1
  isMandatory: boolean;
}

export interface Opportunity {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  type: string;
  isPaid: boolean;
  amountMin: number | null;
  amountMax: number | null;
  currency: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  remoteMode: 'remote' | 'onsite' | 'hybrid' | 'flexible' | null;
  requiredHoursPw: number | null;
  status: 'open' | 'closed' | 'draft' | 'cancelled';
  skills: OpportunitySkill[];
  interests: Array<{ interest: string; weight: number }>;
}

// ─── Matching result contract (SHARED_CONTRACTS.md) ──────────────────────────
export interface ComponentScores {
  skillCoverage: number | null;    // 0–1, null = unavailable
  interestSimilarity: number | null;
  availability: number | null;
  location: number | null;
  reciprocal: number | null;
}

export interface MatchResult {
  entityId: string;         // opportunity_id
  matchScore: number;       // 0–100 combined
  componentScores: ComponentScores;
  matchedSkills: string[];
  missingRequirements: string[];
  reasons: string[];
  eligibilityStatus: 'eligible' | 'ineligible';
  ineligibilityReasons: string[];
}

export interface SearchQuery {
  q?: string;             // free-text query
  type?: string;
  isPaid?: boolean;
  remoteMode?: string;
  skills?: string[];
  locationCity?: string;
  maxDistanceKm?: number;
  availabilityHoursMin?: number;
  page?: number;
  pageSize?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  suggestion?: string;    // typo correction suggestion
}

export interface TeamFormationRequest {
  roles: Array<{
    roleLabel: string;
    requiredSkillIds: number[];
    importance: number;
  }>;
  candidateIds: string[];
}

export interface TeamFormationResult {
  assignments: Array<{
    roleLabel: string;
    userId: string | null;
    coverageScore: number;
    reasons: string[];
  }>;
  uncoveredRoles: string[];
  algorithm: 'greedy-set-cover' | 'hungarian';
  limitations: string;
}
