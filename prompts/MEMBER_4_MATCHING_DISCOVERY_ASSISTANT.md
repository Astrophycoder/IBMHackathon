# Member 4 — Matching, Discovery and Assistant (end-to-end)

Use IBM Bob. Inspect the actual repository and domain contracts. Work on a separate branch. Own the matching/search services, their API/UI integration and tests. Read `specs/ALGORITHM_AND_AI_POLICY.md` carefully.

## Own
Search results and relevance; deterministic matching engine; Opportunity Radar; complementary skill discovery; team formation where needed; match explanations; AI Assistant interface and optional genuine model-backed functions.

## Non-negotiable DSA boundary
The mathematics and algorithm families in `ALGORITHM_AND_AI_POLICY.md` are the approved research baseline. Do not replace them, remove them, or simplify them because another algorithm is fashionable or easier to generate. Do not allow Bob to change the DSA aspect. If the existing stack makes an element infeasible, document the exact incompatibility and propose an implementation adaptation that preserves the mathematical intent. Any change to the approved algorithm design requires explicit team approval and a recorded decision.

## Implement
Eligibility filtering before ranking; weighted skill coverage; weighted interest similarity; availability/location only when relevant and known; configurable combined scoring; reciprocal fit; top-K results; explainable component scores; complementary offers/needs; fair exposure/cold-start handling; typo suggestions/fuzzy search. Add team assignment/set-cover only for a real workflow requiring it.

## AI naming
Scoring, filtering, fuzzy search, graph matching, ranking and optimisation are not AI. Only call a feature AI-assisted when an actual configured model is invoked, e.g. natural-language request-to-listing draft, translation or speech recognition. Model output is a user-confirmed suggestion. If no model config exists, show normal search/form fallback. No model may make hiring decisions, award points, verify payment or change permissions.

## Evaluation
Unit tests for empty/missing data, eligibility, scoring components, reciprocal fit, typo suggestions, privacy and cold-start. Where labelled examples exist, report Precision@K/Recall@K/NDCG@K. Never call match score accuracy or invent metrics.

## Required
Document algorithm implementation mapping, complexity notes, API contract, test commands/results, sample outputs and limitations. Preserve the approved DSA design.
