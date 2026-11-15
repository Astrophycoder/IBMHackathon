/**
 * AI Assistant Service — Member 4
 *
 * Fallback-first design per ALGORITHM_AND_AI_POLICY.md:
 * - If no model is configured (env vars absent), use normal search/form.
 * - Only label a response AI-assisted when a real model is actually invoked.
 * - Model output is a SUGGESTION requiring user confirmation.
 * - No model may make hiring decisions, award points, verify payment or change permissions.
 *
 * To plug in a real model: set OPENAI_API_KEY or WATSONX_API_KEY in .env.
 * The model layer is isolated behind the `callModel` function; the rest of
 * the assistant logic does not change.
 */
import { searchOpportunities, resolveSkillIds } from '../search/searchService';
import { SearchQuery, SearchResult, Opportunity } from '../types/domain';

// ─── Model availability check ─────────────────────────────────────────────────
function isModelConfigured(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.WATSONX_API_KEY);
}

// ─── Model stub / plug-in point ───────────────────────────────────────────────
/**
 * Replace this function with a real model call when credentials are configured.
 * Returns structured intent extraction from a natural-language query.
 */
async function callModel(userMessage: string): Promise<{
  intent: string;
  filters: Partial<SearchQuery>;
  draftListing?: string;
} | null> {
  if (!isModelConfigured()) return null;

  // ── OpenAI plug-in point ──────────────────────────────────────────────────
  if (process.env.OPENAI_API_KEY) {
    // TODO: replace stub with real OpenAI call
    // const { OpenAI } = await import('openai');
    // const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // const completion = await client.chat.completions.create({ ... });
    // return parseModelResponse(completion.choices[0].message.content);
    return null;
  }

  // ── watsonx plug-in point ─────────────────────────────────────────────────
  if (process.env.WATSONX_API_KEY) {
    // TODO: replace stub with real watsonx call
    return null;
  }

  return null;
}

// ─── Main assistant handler ───────────────────────────────────────────────────
export interface AssistantResponse {
  mode: 'ai-assisted' | 'search-fallback';
  message: string;
  results: SearchResult<Opportunity>;
  draftListing?: string;   // only when model drafted a listing
  disclaimer?: string;
}

/**
 * Handle a natural-language request from the assistant UI.
 * Falls back to keyword search if no model is configured.
 */
export async function handleAssistantRequest(
  userMessage: string
): Promise<AssistantResponse> {
  const modelResult = await callModel(userMessage);

  if (modelResult) {
    // Model is configured and returned structured intent
    const results = await searchOpportunities({
      ...modelResult.filters,
      pageSize: 10,
    });

    return {
      mode: 'ai-assisted',
      message: `Showing results for: "${userMessage}"`,
      results,
      draftListing: modelResult.draftListing,
      disclaimer:
        'This is an AI-generated suggestion. Review and confirm before submitting.',
    };
  }

  // ── Fallback: keyword-based search (deterministic, not AI) ───────────────
  const q = userMessage.trim();
  const skillIds = await resolveSkillIds([q]);

  const results = await searchOpportunities({
    q,
    skills: skillIds.length > 0 ? undefined : undefined, // let text search handle it
    pageSize: 10,
  });

  return {
    mode: 'search-fallback',
    message: `Showing search results for: "${q}"`,
    results,
  };
}

/**
 * Natural-language listing draft.
 * Requires model to be configured; otherwise returns null and caller shows the form.
 */
export async function draftListingFromText(
  userRequest: string
): Promise<string | null> {
  if (!isModelConfigured()) return null;
  const result = await callModel(userRequest);
  return result?.draftListing ?? null;
}
