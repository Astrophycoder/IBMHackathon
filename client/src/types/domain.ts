// Shared frontend types — mirror of server domain types

export interface Skill {
  id: number;
  name: string;
  category: string;
  aliases: string[];
}

export interface OpportunitySkill {
  skillId: number;
  skillName: string;
  importance: number;
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
  remoteMode: string | null;
  requiredHoursPw: number | null;
  status: string;
  skills: OpportunitySkill[];
  interests: Array<{ interest: string; weight: number }>;
}

export interface ComponentScores {
  skillCoverage: number | null;
  interestSimilarity: number | null;
  availability: number | null;
  location: number | null;
  reciprocal: number | null;
}

export interface MatchResult {
  entityId: string;
  matchScore: number;
  componentScores: ComponentScores;
  matchedSkills: string[];
  missingRequirements: string[];
  reasons: string[];
  eligibilityStatus: 'eligible' | 'ineligible';
  ineligibilityReasons: string[];
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  suggestion?: string;
}

export interface AssistantResponse {
  mode: 'ai-assisted' | 'search-fallback';
  message: string;
  results: SearchResult<Opportunity>;
  draftListing?: string;
  disclaimer?: string;
}

export interface ComplementaryMatch {
  userId: string;
  displayName: string;
  offersYouNeed: string[];
  needsYouOffer: string[];
  complementScore: number;
  reasons: string[];
}
