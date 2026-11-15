import axios from 'axios';
import {
  SearchResult, Opportunity, MatchResult, AssistantResponse, ComplementaryMatch, Skill,
} from '../types/domain';

const api = axios.create({ baseURL: '/api' });

// ─── Search ───────────────────────────────────────────────────────────────────
export async function searchOpportunities(params: Record<string, any>): Promise<SearchResult<Opportunity>> {
  const { data } = await api.get('/search/opportunities', { params });
  return data;
}

export async function searchSkills(q: string): Promise<{ skills: Skill[]; suggestion?: string }> {
  const { data } = await api.get('/search/skills', { params: { q } });
  return data;
}

// ─── Opportunity Radar ────────────────────────────────────────────────────────
export async function getRadar(userId: string, k = 20): Promise<{ userId: string; matches: MatchResult[] }> {
  const { data } = await api.get(`/radar/${userId}`, { params: { k } });
  return data;
}

// ─── Single match score ───────────────────────────────────────────────────────
export async function getMatchScore(userId: string, opportunityId: string): Promise<MatchResult> {
  const { data } = await api.get(`/match/${userId}/${opportunityId}`);
  return data;
}

// ─── Complementary skills ─────────────────────────────────────────────────────
export async function getComplementary(
  userId: string,
  limit = 10
): Promise<{ userId: string; matches: ComplementaryMatch[] }> {
  const { data } = await api.get(`/complementary/${userId}`, { params: { limit } });
  return data;
}

// ─── Assistant ────────────────────────────────────────────────────────────────
export async function sendAssistantMessage(message: string): Promise<AssistantResponse> {
  const { data } = await api.post('/assistant', { message });
  return data;
}

export async function draftListing(message: string) {
  const { data } = await api.post('/assistant/draft-listing', { message });
  return data;
}
