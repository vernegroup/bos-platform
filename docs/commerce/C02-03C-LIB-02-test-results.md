# C02-03C / LIB-02 — test report (2026-10-09)

Environment: isolated Neon branch `br-cold-breeze-b4bllw0d` (parent production; production untouched).
GitHub: `feature/commerce-02-standard-capacity`.

## Confirmed
- Historical migration previously PASS: 7 uniquely published and attributed standards consumed; 3 BASE grants.
- SQL integration smoke: all 3 ACTIVE templates can be cloned into standards DRAFT + version + tasks + start requirements + readiness criteria. SQL used nested exception block to roll back test inserts. Query after test: 13 standards, 7 consumptions, 3 grants, unchanged. PASS at database level, **not** Next.js runtime E2E.
- Add-on ledger: transaction smoke added +10 for a test checkout session, retried same session with ON CONFLICT DO NOTHING and asserted capacity 20 (baseline 10); rolled back changes. PASS at SQL level only.
- Published capacity boundary arithmetic tested earlier: 9/10 allowed; 10/10 denied; 20/20 denied. Arithmetic only.

## Not proven / blockers
- No build/typecheck or browser E2E run; GitHub file operations do not execute Next.js.
- Two concurrent application publish requests at 9/10 have NOT been tested. Earlier advisory lock attempt was inconclusive. NOT PASS.
- No real app execution of new license BASE grant, template copying or publish guard.
- Product assignment for 4 legacy NULL records remains unresolved.
- Annual-vs-perpetual license business decision remains unresolved.
- Publication guard currently relies on migration having run, and must be reviewed against all publishing routes.
- SQL-level test did not verify role-specific template suitability for Promotions.

## Status
C02-03C = PARTIAL; database smoke PASS, full integration and concurrency NOT PASS. Do not merge/deploy yet.

## Pre-merge hardening follow-up
- Commit bb68b9a9: publication now checks active license and exact tenant/product ownership inside transaction.
- Commit ad8a0755: direct published Standard creation now requires active membership.
- Commit b10b2282: migration backfills historical published_at even for archived versions; grants BASE for active valid ANNUAL or PERPETUAL licenses.
- Read-only verification on isolated Neon branch: 7 historical published, 7 ledger consumptions; 3 valid licenses, 3 BASE grants. PASS.
- These latest source changes were **not** built or deployed. Migration revision not reapplied to test branch; verification checked data equivalence only.
- Remaining pre-merge risks: no real two-session concurrency test, no Next.js build/typecheck, no full authenticated app integration; product suitability of existing onboarding templates for Promotions not assessed.
- Merge to main explicitly deferred by owner until after maximal isolated testing. Production unchanged.
