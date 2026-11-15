# MORETOGETHER — Team Build Pack (v2)

This pack is designed for five people to work in parallel with IBM Bob while keeping the product and algorithm design stable.

## Working principle: five vertical slices

Each member owns a coherent feature area end-to-end: UI, application logic, data/API work for that area, and tests. No one is merely the "frontend person" or "backend person". Shared contracts and the core DSA design are agreed once, then protected from accidental redesign.

## What was researched vs what Bob plans

- **Product scope and page requirements:** established through team discussion and research; see `specs/PRODUCT_AND_SCOPE.md`.
- **Matching mathematics, DSA choices and AI terminology:** established in `specs/ALGORITHM_AND_AI_POLICY.md`. Treat this as the approved research baseline.
- **IBM Bob's role:** inspect the actual repository, produce a concise repository-specific implementation plan, identify dependencies and risks, and help each owner implement their slice. Bob is used for planning and coding—not to invent or replace the research design.
- **Team's role:** review Bob's plan, make decisions, implement, test and validate the result.

Do not claim Bob performed research or testing it did not perform. The team can truthfully document that Bob was used for repository analysis, implementation planning, task decomposition, code generation and debugging.

## Five equal workstreams

| Member | Owns end-to-end | Primary pages |
|---|---|---|
| 1 | Opportunity and work lifecycle | Opportunity Hub, Post Requirement, Opportunity Details, Applications, AI Shortlist results integration, payment records |
| 2 | Talent and livelihood marketplace | Talent Hub, Talent Details, Products, Services, Collaborations |
| 3 | Community participation | Community Hub, NGO/initiative profiles, campaigns, volunteering, donations, events, human-led learning sessions |
| 4 | Matching, discovery and assistant | Search, deterministic matching engine, Opportunity Radar, complementary skills, team formation, optional AI Assistant functions |
| 5 | User experience and participation account | Home, onboarding, My Profile, accessibility preferences, My Activity, Exchange Hub/TogetherPoints, Messages, Notifications, Settings and shared app shell |

The workload is balanced by complexity and ownership, not by giving everyone the same number of page names. Each member owns the full feature slice, including UI, service/API integration and tests. Member 5's shared-shell responsibility is bounded: it supplies reusable layout/design components, not the business logic of Members 1–4.

## Independence rules

1. Each member starts by auditing their owned area and listing existing working code.
2. Each member creates/uses a separate branch.
3. Shared interfaces in `specs/SHARED_CONTRACTS.md` are the integration boundary.
4. A member may add fields/endpoints inside their own domain, but changes to shared identity, navigation, global styles, or shared contracts require agreement.
5. Do not edit another member's owned modules without coordination.
6. Use adapters/mocks temporarily if another module is not ready; label them clearly and replace them during integration.
7. Integrate through small pull requests and run the acceptance checklist.

## IBM Bob workflow

### One shared planning pass
Use the prompt in `prompts/BOB_SHARED_PLANNING.md` in **Plan mode**. Bob should inspect the real repository and create `docs/BOB_IMPLEMENTATION_PLAN.md`. This is the honest, visible Bob planning contribution.

### Five independent implementation passes
Each owner then uses their own prompt in `prompts/`. Bob must follow the approved product and algorithm specs. It may recommend implementation details, but it must not silently change scope, scoring mathematics, DSA choices or the AI/non-AI boundary.

### Suggested evidence for the project/demo
Keep:
- `docs/BOB_IMPLEMENTATION_PLAN.md` — Bob's repository-specific plan.
- `docs/TEAM_DECISIONS.md` — decisions accepted/rejected by the team.
- `docs/ALGORITHM_SPEC.md` — approved DSA/mathematics baseline, copied or linked from the approved spec.
- PRs/commit history — evidence of implementation and review.
- `docs/TEST_RESULTS.md` — tests actually run and their results.

Do not fabricate these artefacts or claim tests passed without running them.

## Before coding
Read `specs/PRODUCT_AND_SCOPE.md`, `specs/SHARED_CONTRACTS.md`, `specs/ALGORITHM_AND_AI_POLICY.md` and `specs/ACCEPTANCE_CHECKLIST.md`.
