# CORE-STD-01 — Standard ownership audit

Status: PASS — ownership contract fixed for cross-product use
Branch: promotions-1-0
Scope: architecture/ownership audit only. No database migration and no product workflow change.

## Decision

A BOS Standard belongs to the Organization / Shared Core, not to Onboarding or Promotions.

Canonical chain:
Organization -> Standard -> immutable StandardVersion -> tasks / start requirements / readiness criteria

Onboarding and Promotions are consumers of the same organization-owned Standard repository.

## Verified current state

- Frozen Shared Core architecture already defines Standard, StandardVersion, StandardTask, StartRequirement and ReadinessCriterion as Shared Core.
- Published StandardVersion is immutable and every process remains pinned to the exact version selected at process start.
- Promotions already selects published StandardVersions from organization data and binds a process to an exact version.
- Standard queries are tenant-scoped by organization_id.

## Application ownership leak

The shared domain is still exposed through Onboarding implementation:
- Standard CRUD and queries remain in lib/bos/onboardingRepository.ts.
- Standard list/editor routes live under /app/onboarding/standards.
- Standard creation resolves products.key='onboarding' and writes that product_id into standards.
- Standard UI copy describes Standards primarily as onboarding templates.
- Promotions can select an existing published Standard, but cannot create one when no Standard exists.

This creates a false dependency: Promotions -> Onboarding -> Standard instead of Onboarding -> Shared Standard <- Promotions.

## Cross-product contract

1. Standard is organization-owned.
2. Creating a Standard must not require an Onboarding license.
3. Creating a Standard from Promotions must not create an Onboarding dependency.
4. A Standard created while only Promotions is licensed remains reusable after later purchase of Onboarding.
5. A Standard created through Onboarding is available to Promotions in the same organization.
6. Products do not copy/import Standards between each other.
7. Both products read the same Standard and StandardVersion records.
8. Historical processes remain pinned to their original StandardVersion.
9. No product silently modifies a published StandardVersion.
10. Product-specific process semantics remain outside the Standard repository.
11. Sharing a Standard does not create automatic evidence/task credit between products.
12. Organization remains the tenant boundary.

## Required seam

Introduce neutral Shared Core Standard service/repository: lib/bos/core/standardRepository.ts.

Move or wrap neutral operations incrementally: list/get/create/update/archive Standard; draft tasks/start requirements/readiness criteria; publication/completeness/version operations. Compatibility wrappers in onboardingRepository.ts are allowed. Do not big-bang refactor the frozen Onboarding engine.

## UI ownership

Canonical future workspace: /app/standards — Standardy organizacji.

It is a BOS organization resource, not a product screen. Minimum entry points: dashboard resource tile STANDARDY ORGANIZACJI; Promotions new A->B can choose existing Standard B or create a new organization Standard; Onboarding uses the same repository. Product routes may temporarily redirect during migration, but must not fork data/editors.

## Schema issue for CORE-STD-02

Current standards.product_id still records product ownership although the target domain says organization ownership. CORE-STD-01 does not mutate DB.

CORE-STD-02 must inspect the test-branch schema/FKs and choose the smallest safe migration: make product_id nullable/deprecate ownership, or replace it with neutral provenance/applicability metadata only if a real use case requires it. Do not invent a synthetic core product to satisfy the old FK. Test branch first; production/default Neon untouched until full acceptance.

## Promotions acceptance consequence

Before Desktop testing, a Promotions-only user must be able to: enter New change; select existing Standard B or Create new Standard; create/publish it without an Onboarding-owned route/workflow; return to A->B; select the published version and create the process.

This is Promotions usability readiness, not a separate repository project.

## Non-goals

No full dashboard build; no Promotions A->B semantic change; no Onboarding process semantic change; no five-stage/K/readiness change; no automatic cross-product completion credit; no production DB migration; no full Standard editor redesign.

## Result

PASS. Shared Core already points to organization-owned Standards, but routing/repository placement and standards.product_id still leak Onboarding ownership. CORE-STD-02 should create the minimal neutral repository/workspace seam required by Promotions; PROM-UI-03 then wires New change -> choose/create Standard B without Onboarding dependency.