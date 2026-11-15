# Team Decisions Log
_Record decisions accepted/rejected from Bob's plan here._

## Decision 001 — Stack choice
**Date:** 2026-11-15
**Decided by:** Member 4 lead
**Decision:** React (Vite) + TypeScript frontend, Node.js/Express backend, PostgreSQL. npm workspaces monorepo.
**Rationale:** Agreed with team at project start.
**Status:** Accepted ✅

## Decision 002 — AI Assistant: fallback-first
**Date:** 2026-11-15
**Decided by:** Member 4 lead
**Decision:** AI Assistant shows search results when no model is configured. Plug-in points left for OpenAI/watsonx.
**Rationale:** Per ALGORITHM_AND_AI_POLICY.md — no fake AI responses.
**Status:** Accepted ✅

## Decision 003 — Team formation algorithm
**Date:** 2026-11-15
**Decided by:** Member 4 lead
**Decision:** Greedy set-cover heuristic. Hungarian algorithm deferred until a genuine 1-to-1 assignment workflow is defined.
**Rationale:** Per ALGORITHM_AND_AI_POLICY.md — "greedy set-cover may be practical".
**Status:** Accepted ✅

## Decision 004 — Mock auth scaffold
**Date:** 2026-11-15
**Decided by:** Member 4 lead
**Decision:** Temporary mock auth context (pre-logged-in demo user) created as scaffold. Labeled MOCK_AUTH_SCAFFOLD. Must be replaced by Member 5's real auth before demo.
**Status:** Pending replacement ⏳

---
_Add new decisions below as the team makes them._
