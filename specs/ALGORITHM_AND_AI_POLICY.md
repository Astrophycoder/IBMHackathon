# Approved Algorithm and AI Policy — do not silently redesign

This file is the research/DSA baseline agreed by the team. IBM Bob may suggest implementation details or identify a concrete incompatibility with the existing stack, but it must not replace the mathematical model, algorithm family or scope without an explicit team decision recorded in TEAM_DECISIONS.md.

## Deterministic features — not AI
Weighted scoring, filtering, fuzzy search, retrieval, ranking, graph matching and combinatorial optimisation are ordinary algorithms. Label them accurately.

### Eligibility
Apply mandatory constraints before ranking: paid-only, availability, listing status, location/remote feasibility, genuine mandatory qualifications and user-selected accessibility constraints. Do not hide hard constraints inside a weighted score.

### Weighted skill coverage
For required skills i with importance weights w_i:
S_skill = sum(w_i * indicator(skill i is met)) / sum(w_i)

### Weighted interest similarity
J_w(A,B) = sum(min(w_Ai,w_Bi)) / sum(max(w_Ai,w_Bi))
Define empty-set behaviour explicitly.

### Availability
S_availability = min(1, overlapping_available_hours / required_hours)
If hours are unknown, mark the component unavailable rather than inventing a value.

### Location
For location-sensitive work, a decay such as exp(-distance/tau) may be used. Remote work should not be penalised by physical distance. Never expose exact home addresses.

### Combined score
S(u,o) = 100 * sum_k(alpha_k * f_k(u,o)), with non-negative weights summing to 1. Weights are configurable initial hypotheses, not validated truths. Handle missing components explicitly and normalise consistently.

### Reciprocal fit
Where both sides have preferences, combine candidate-to-opportunity and opportunity-to-candidate fit, e.g. R = lambda*A + (1-lambda)*B. Non-negotiable pay/availability conditions remain hard filters.

### Search
Use indexed database filters and the existing search facilities first. Exact matching plus trigram/edit-distance fuzzy matching and skill aliases are suitable. Offer typo suggestions; do not silently rewrite queries. Use language-aware normalisation where supported.

### Complementary skills
Represent people, organisations, opportunities and needs/offers as graph-like entities. An edge represents a plausible complement (one offers what the other needs). Start with relational joins/adjacency lists; do not introduce a graph database without demonstrated need.

### Team formation
Use weighted bipartite assignment only where there is a genuine role-to-person assignment problem. Hungarian algorithm for one-to-one assignment where appropriate. For multi-skill coverage, a greedy set-cover heuristic may be practical. Document limitations.

### Fair exposure
Avoid popularity-only ranking; consider modest exploration for new profiles. Never use protected/sensitive characteristics to suppress visibility. Accessibility preferences help find suitable work; they must not reduce user visibility.

## Evaluation
Use Precision@K, Recall@K and NDCG@K when relevance labels exist. Also assess search success, mutual acceptance, application conversion, exposure distribution, cold-start coverage and accessibility task completion. Never claim a match score is accuracy or invent performance metrics.

## Optional AI-assisted features
Call a feature AI-assisted only when a real model is configured and invoked: natural-language request-to-listing draft, translation, conversational interpretation, speech recognition/synthesis, or natural-language explanation of deterministic match factors. Model outputs are suggestions requiring user confirmation. Validate structured output server-side. No model may make hiring decisions, award points, verify payments or alter permissions. If model access is unavailable, provide a normal search/form fallback.
