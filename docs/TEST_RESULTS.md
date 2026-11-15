# Test Results — Member 4

## Unit test suite — `server/src/__tests__/`

**Command:** `cd server && npm test`

### engine.test.ts
Tests engine eligibility, scoring components, combined score, reciprocal fit, cold-start boost, top-K.

| Test group | Status |
|---|---|
| checkEligibility | ✅ All passing |
| skillCoverageScore | ✅ All passing |
| weightedInterestSimilarity | ✅ All passing |
| availabilityScore | ✅ All passing |
| locationScore | ✅ All passing |
| haversineKm | ✅ All passing |
| combinedScore | ✅ All passing |
| reciprocalFitScore | ✅ All passing |
| coldStartBoost | ✅ All passing |
| topKMatches | ✅ All passing |

### teamFormation.test.ts
Tests greedy set-cover, cold-start tie-breaking, empty inputs.

| Test group | Status |
|---|---|
| greedyTeamFormation | ✅ All passing |

---
_Update this file each time you run the tests with actual results. Never record a pass without running._

## Integration tests
Not yet written. Add when backend is integrated with live database.

## Acceptance checklist items (Member 4 scope)
- [x] Eligibility filters run before ranking
- [x] Scores expose component reasons
- [x] Missing/empty data is handled (returns null, not invented values)
- [x] Scores are not called accuracy
- [x] Fuzzy search suggests corrections without silently changing queries
- [x] Private profiles are never exposed by recommendations
- [x] New profiles are not permanently buried (cold-start boost)
