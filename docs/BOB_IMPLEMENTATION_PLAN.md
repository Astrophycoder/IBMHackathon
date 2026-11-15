# Bob Implementation Plan — MORETOGETHER
_Produced by IBM Bob after repository inspection. For team review before any source edits._

## 1. Repository Snapshot

**State at planning time:** Repository contained only specs and prompts — no source code.

**Stack chosen (Member 4 lead):**
- Frontend: React 18 + Vite + TypeScript, React Router v6, Axios, CSS Modules
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL with `pg_trgm` and `unaccent` extensions
- Fuzzy search: `fuse.js` (in-memory skill alias matching)
- Tests: Jest + ts-jest
- Monorepo: npm workspaces (`client/`, `server/`)

## 2. Existing Functionality (at planning time)
None. This is a greenfield build.

## 3. Gap Analysis — Five Workstreams

| Member | Gap status |
|---|---|
| 1 | Opportunity/application CRUD APIs not built — stubs in schema only |
| 2 | Talent hub, products/services — not built |
| 3 | Community hub — not built |
| 4 | **Built in this session** — search, matching engine, radar, complementary, team formation, assistant |
| 5 | Shared app shell, auth, profile — not built; temporary scaffold created for Member 4 |

## 4. Dependency Map

```
Member 5 (auth, shell)   ──► all other members (navigation, user identity)
Member 1 (opportunities) ──► Member 4 (radar, search need real opportunities)
Member 2 (talent)        ──► Member 4 (complementary skills need talent listings)
Member 4 (matching APIs) ──► Member 1 (AI shortlist results integration)
                         ──► Member 3 (community initiative matching)
```

**Critical path:** Member 5's auth context must be real before demo. Member 1's opportunity data must be seeded before radar is meaningful.

## 5. Task Breakdown — Member 4

| Task | File(s) | Status |
|---|---|---|
| DB schema + seed | `server/src/db/schema.sql`, `seed.sql` | ✅ Done |
| Shared types | `server/src/types/domain.ts` | ✅ Done |
| Matching engine | `server/src/matching/engine.ts` | ✅ Done |
| Complementary discovery | `server/src/matching/complementary.ts` | ✅ Done |
| Team formation | `server/src/matching/teamFormation.ts` | ✅ Done |
| Search service | `server/src/search/searchService.ts` | ✅ Done |
| AI Assistant service | `server/src/assistant/assistantService.ts` | ✅ Done |
| API routes | `server/src/routes/member4.ts` | ✅ Done |
| Unit tests | `server/src/__tests__/engine.test.ts` | ✅ Done |
| React frontend | `client/src/pages/*` | ✅ Done |
| Docs | `docs/BOB_IMPLEMENTATION_PLAN.md` | ✅ Done |

## 6. Integration Checkpoints

1. **Member 5 → 4:** Replace `client/src/context/AuthContext.tsx` (labeled `MOCK_AUTH_SCAFFOLD`) with real auth.
2. **Member 1 → 4:** When real opportunities exist, remove seed data dependency. Radar will auto-use live data.
3. **Member 2 → 4:** Talent listing visibility query in `complementary.ts` already joins `profiles.visibility` — works when Member 2 populates talent listings.
4. **All → 4:** Search endpoints are open (`/api/search/opportunities`) — Members 1–3 can feed their UIs through the same API.

**Likely merge-conflict areas:**
- `server/src/db/schema.sql` — all members will add tables; use separate migration files, not one shared SQL file.
- `server/src/index.ts` — each member should add their own router file; merge via `app.use('/api', memberNRoutes)`.

## 7. Test/Build Commands

```bash
# Install
npm install       # root
cd server && npm install
cd client && npm install

# Database
cp server/.env.example server/.env
# Edit DATABASE_URL in server/.env
npx ts-node server/src/db/migrate.ts
npx ts-node server/src/db/seed.ts

# Development (both servers)
npm run dev       # from root (uses concurrently)
# OR individually:
cd server && npm run dev    # Express on :4000
cd client && npm run dev    # Vite on :5173

# Tests
cd server && npm test

# Build
npm run build     # from root
```

## 8. Risks and Decisions Requiring Team Approval

| Risk | Status |
|---|---|
| PostgreSQL `pg_trgm` extension requires superuser to install | Needs DBA/DevOps action on hosted DB |
| Mock auth (MOCK_AUTH_SCAFFOLD) uses hardcoded demo user | Replace before demo — depends on Member 5 |
| No real AI model wired yet | Fallback-first is intentional per spec; add credentials to `.env` to activate |
| Seed data uses fixed UUIDs | Fine for dev; production should generate real users via registration |
| No rate limiting or auth middleware on matching endpoints | Add before production; out of scope for Member 4's slice |
| `fuse.js` skill index is loaded lazily and cached in memory | Works for single-process dev; add Redis or DB-backed cache for multi-process production |

## 9. Minimum Demo Path

1. Start PostgreSQL, run migrations and seed.
2. Start server (`npm run dev --workspace=server`).
3. Start client (`npm run dev --workspace=client`).
4. Open `http://localhost:5173`.
5. Demo user (Alice) is pre-logged in (mock auth).
6. Home → Search → type "React" → see results with typo suggestions.
7. Home → Radar → see ranked opportunity cards with component scores.
8. Home → Complementary → see users with matching offer/need skill pairs.
9. Home → AI Assistant → type "I want to volunteer" → see search fallback results.
