# PROM-WEB-28 — Regression

Status: **PASS — Onboarding/Core without detected regression**

Environment: Neon test branch `br-old-darkness-b48jekbv` and Vercel preview for `promotions-1-0`. Default/main Neon branch was not modified.

## Build regression

Latest branch deployment for PROM-WEB-27 commit `b3448bad9dcd9ef63145f60377001aff6266d0e2` is READY. Next.js production build and TypeScript therefore pass with Promotions + shared Core/Onboarding code present.

## Onboarding data integrity

Existing test-branch state after Promotions migrations:
- 12 Onboarding processes
- 14 Onboarding closures
- 9 Standards
- 12 StandardVersions
- 30 StandardTasks
- 17 readiness criteria
- 12 Employees

Integrity checks:
- orphan Onboarding → StandardVersion: 0
- orphan Onboarding task progress → process: 0
- orphan Onboarding closure → process: 0
- cross-org Onboarding process → StandardVersion: 0
- cross-org Onboarding closure → process: 0
- Onboarding process → Employee missing: 0
- Onboarding employee snapshot/name mismatch: 0
- Onboarding process → Standard missing: 0
- Onboarding process → StandardVersion missing: 0
- task-progress tenant mismatch: 0
- closure tenant mismatch: 0
- broken closure decision sequence: 0

Published Standard immutability guards remain installed for StandardVersion / StandardTask / readiness criteria.

## Core regression

Employee Core remains tenant scoped. Promotions migration did not rewrite Onboarding process employee IDs: every current Onboarding process resolves to an Employee in the same organization.

Shared Core tables for organizations, users/memberships, licenses, Standards and Employee remain populated and relationally consistent on the test branch.

## Shared UI/repository surface

The Promotions branch changes shared surfaces only where intended:
- BOS HOME adds Promotions data;
- global search replaces legacy Promotions closure source with the new immutable closure source;
- Employee operational history adds Promotions alongside Onboarding;
- shared data portability adds Promotions.

No Onboarding process/closure repository or Onboarding engine migration was modified by PROM-WEB-13..25. The latest combined branch deployment is READY.

## Promotions regression after hardening

PROM-WEB-25 Functional Tests: PASS.
PROM-WEB-26 Red Team: PASS.
PROM-WEB-27 Synthetic E2E: PASS.

Both PROMOTION and LATERAL_MOVE remain operational after security hardening.

## Verdict

No BLOCKER or MAJOR regression detected in Onboarding/Core. Existing Onboarding relational history is intact, tenant relationships are intact, published Standard immutability remains present, and the integrated application builds successfully.

PROM-WEB-28: PASS.
