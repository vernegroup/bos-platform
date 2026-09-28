# PROM-WEB-29 — Release Candidate

Status: **RC — CODE + TEST DATABASE FREEZE**

RC branch: `promotions-1-0`
RC baseline: PROM-WEB-28 commit `4056e813b74cb71827e6550220651640dc0781f2`
Database candidate: Neon test branch `br-old-darkness-b48jekbv`
Production/default Neon branch: **NOT MIGRATED**

## Entry criteria

- PROM-WEB-24 Security/Integrity — PASS
- PROM-WEB-25 Functional Tests — PASS
- PROM-WEB-26 Red Team — PASS, 0 BLOCKER / 0 MAJOR
- PROM-WEB-27 Synthetic E2E — PASS
- PROM-WEB-28 Regression — PASS, Onboarding/Core without detected regression
- Promotions migrations 013–025 applied and tested only on the Neon test branch
- both Web 1.0 change types tested: PROMOTION and LATERAL_MOVE
- Final Integrity Gate tested 7/7
- immutable history / decision sequencing tested
- tenant and cross-org protections tested
- Onboarding relational integrity regression checks passed

## Freeze

From this point the Promotions Web 1.0 candidate is frozen.

Allowed before release freeze:
1. BLOCKER fixes required to prevent release, data corruption, tenant/security bypass, broken build, or inability to execute the frozen product contract.
2. Tests and diagnostics that do not change product semantics.
3. Documentation of test results.

Not allowed without explicitly reopening the RC:
- new functionality;
- UX redesign;
- new change types;
- changes to A→B semantics;
- changes to assessment, five-stage execution, K, readiness, handover or decision meanings;
- schema refactors unrelated to a BLOCKER;
- Core or Onboarding redesign;
- cleanup/refactoring that is not required for a BLOCKER.

Any BLOCKER fix invalidates the affected test boundary and requires targeted retest plus regression before the candidate can return to RC.

## Database freeze

The tested schema contract is migrations `013` through `025` as present at the RC baseline. The test branch is the migration candidate. It must not be promoted to the production/default Neon branch until the remaining acceptance/release-freeze decision is explicit.

No migration to main/default database is part of PROM-WEB-29.

## RC rule

After this commit, code changes on `promotions-1-0` are treated as RC violations unless their commit message identifies a BLOCKER fix or the RC is explicitly reopened.

## Result

**PROM-WEB-29 — RELEASE CANDIDATE — RC**

Code frozen.
Test DB schema frozen.
Only BLOCKER corrections permitted.
Production/default Neon untouched.
