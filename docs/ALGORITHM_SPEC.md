# Algorithm Specification — MORETOGETHER Member 4
_Copied from `specs/ALGORITHM_AND_AI_POLICY.md` with implementation mapping._

## Implementation Mapping

| Algorithm | Spec Reference | Implementation File | Notes |
|---|---|---|---|
| Eligibility filter | §Eligibility | `engine.ts → checkEligibility()` | Runs before ranking; hard constraints |
| Weighted skill coverage | §Weighted skill coverage | `engine.ts → skillCoverageScore()` | S_skill = Σ(w_i * indicator) / Σ(w_i) |
| Weighted Jaccard interest similarity | §Weighted interest similarity | `engine.ts → weightedInterestSimilarity()` | J_w(A,B) = Σmin/Σmax; null if either set empty |
| Availability score | §Availability | `engine.ts → availabilityScore()` | min(1, overlap/required); null if unknown |
| Location decay | §Location | `engine.ts → locationScore()` | exp(-dist/τ); τ=50km; remote=1.0, no penalty |
| Combined score | §Combined score | `engine.ts → combinedScore()` | S = 100 * Σα_k * f_k; missing components renormalised |
| Reciprocal fit | §Reciprocal fit | `engine.ts → reciprocalFitScore()` | R = λ*A + (1-λ)*B; λ=0.6 |
| Fair exposure / cold-start | §Fair exposure | `engine.ts → coldStartBoost()` | Additive; capped; not AI |
| Fuzzy search + typo suggestions | §Search | `searchService.ts` | pg_trgm + Fuse.js; never silently rewrites |
| Skill aliases | §Search | `searchService.ts → resolveSkillIds()` | Fuse.js over name + aliases |
| Complementary skills | §Complementary skills | `complementary.ts` | Relational join adjacency list; no graph DB |
| Team formation | §Team formation | `teamFormation.ts → greedyTeamFormation()` | Greedy set-cover; O(r·c) per iteration |
| Top-K ranking | §Search | `engine.ts → topKMatches()` | Sort-based; eligible first |

## Evaluation Metrics (not yet measured — labels needed)
- Precision@K, Recall@K, NDCG@K (when relevance labels exist)
- Search success rate, application conversion, exposure distribution
- Cold-start coverage, accessibility task completion
- **Score is never called accuracy.**

## Complexity Notes
- `skillCoverageScore`: O(S) where S = required skills per opportunity.
- `weightedInterestSimilarity`: O(|A ∪ B|).
- `combinedScore`: O(1).
- `topKMatches`: O(n) scoring + O(n log n) sort; practical up to ~10,000 opportunities.
- `findComplementaryUsers`: O(n) over users sharing a skill edge — indexed.
- `greedyTeamFormation`: O(R × C) per greedy step, O(R² × C) total.

## Limitations
- Greedy set-cover is within ln(n)+1 of optimal — not globally optimal.
- Location decay constant τ=50km is an initial hypothesis; needs calibration.
- Component weights (0.45/0.20/0.20/0.15) are initial hypotheses; not validated against outcome data.
- No feedback loop yet — scores are not updated based on application outcomes.
- Skill index is in-memory; needs persistent cache for multi-process deployment.
