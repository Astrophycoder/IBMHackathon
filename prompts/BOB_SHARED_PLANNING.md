# IBM Bob — Shared Repository Planning Prompt (Plan mode)

We are building MORETOGETHER. Your task is to contribute a genuine, repository-specific implementation plan—not to invent the product or redesign its research.

Read:
- `specs/PRODUCT_AND_SCOPE.md`
- `specs/SHARED_CONTRACTS.md`
- `specs/ALGORITHM_AND_AI_POLICY.md`
- `specs/ACCEPTANCE_CHECKLIST.md`

Then inspect the actual repository: framework, routes, components, data layer, authentication, database schema, existing working features, tests, environment/configuration and build commands.

## Do not modify code in this planning pass.

Create a proposed `docs/BOB_IMPLEMENTATION_PLAN.md` containing:
1. Repository snapshot: actual stack and project structure observed.
2. Existing functionality that should be preserved.
3. Gap analysis mapped to the five workstreams in README.md.
4. Dependency map: which shared contracts must be ready before each module can integrate.
5. A small task breakdown per member, with file/module ownership and suggested order.
6. Integration checkpoints and likely merge-conflict areas.
7. Test/build commands discovered from the repository.
8. Risks, unknowns and decisions requiring human approval.
9. A realistic minimum demo path through the app.

## Boundaries
- Do not rename, remove or merge the ten main navigation sections.
- Do not delete page requirements or simplify the product scope without asking.
- Do not invent an API, database, library or model integration that is not in the repo.
- Do not claim a test has passed unless you actually run it later in an implementation task.
- Do not redesign the DSA/mathematical matching specification. `ALGORITHM_AND_AI_POLICY.md` is approved. You may flag a technical incompatibility or implementation concern, but present it as a question for the team, not an automatic change.
- Do not label deterministic algorithms as AI.
- IBM Bob is the development agent. Do not add a Bob runtime dependency to the application.

Return the proposed plan for team review. Wait for approval before editing any source files.
