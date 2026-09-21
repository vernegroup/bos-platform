# BOS Shared Core — Architecture Freeze v1.0

Status: FROZEN for Shared Core extraction planning
Baseline: main @ d88424b14ff1896e5510981f236e7f911199fb56 (BOS Onboarding 1.21)
Scope: domain boundaries and migration direction only. This document does not authorize production schema changes.

## 1. Goal

BOS Onboarding is the first consumer of a reusable BOS operational core. Promotions must reuse the same employee identity, Standards, versioning and process facts instead of copying Onboarding data into a second product.

The extraction must preserve Onboarding 1.21 behaviour unless a later explicitly approved product change says otherwise.

## 2. Core invariants

1. Organization remains the tenant boundary for every customer-owned record.
2. Employee and BOS User are different concepts.
3. Employee belongs to one Organization and does not need a BOS account.
4. User/Membership represents access to BOS; Employee represents the person whose operational history BOS records.
5. Onboarding and Promotions reference the same Employee record.
6. Data is not transferred or duplicated from Onboarding to Promotions. Both products read the same Employee and shared history.
7. A published StandardVersion remains immutable.
8. A process remains permanently bound to the StandardVersion selected for that process.
9. New Standard versions never silently change an active process.
10. Progress/readiness are derived from domain facts, not editable percentages.
11. Closed decisions remain append-only history.
12. Cross-tenant references must fail closed.
13. Refactoring to Shared Core must not weaken existing database guards or tenant constraints.
14. BOS Employee Core is operational, not payroll/personnel-file storage.

## 3. Target ownership map

### KEEP AS SHARED CORE

- Organization / tenant boundary.
- Users, memberships, platform roles and authorization primitives.
- Employee identity and Employee history.
- Standard.
- StandardVersion and immutable publication lifecycle.
- StandardTask, K flag, StartRequirement and ReadinessCriterion.
- Version binding between a process and StandardVersion.
- Actor + timestamp facts.
- Stage/progress facts where a product chooses the BOS execution method.
- Derived progress.
- Readiness facts/gates as reusable process primitives.
- Append-only decision/closure history.
- Reassessment/reopen history primitives.
- Import/export canonical data model.
- Audit/history primitives.
- Product/license entitlement checks.

### MOVE FROM ONBOARDING IMPLEMENTATION TO SHARED CORE

Current implementation is concentrated in `lib/bos/onboardingRepository.ts`. Extraction should be incremental, preserving public behaviour while moving neutral logic behind shared repositories/services.

Candidates:
- tenant enforcement helper;
- Standard CRUD/version/publication/completeness;
- Standard task/start-requirement/readiness-criterion operations;
- shared Standard queries;
- process-to-StandardVersion immutable binding;
- stage ordering primitives and actor/timestamp handling;
- progress derivation;
- readiness calculations;
- append-only closure/decision history primitives;
- common employee/history queries;
- canonical import/export serializers.

Do not perform a big-bang rename of every onboarding table/function. First introduce shared domain seams and migrate consumers behind them.

### ONBOARDING ONLY

- Onboarding routes and copy under `/app/onboarding`.
- Product-specific start flow and onboarding terminology.
- Trainer/evaluator/buddy presentation where it is specifically onboarding UX.
- Onboarding-specific contextual guidance.
- Onboarding-specific formalities warning.
- Any product rule that is not proven reusable by Promotions.

### PREPARE FOR PROMOTIONS

Promotions should consume, not duplicate:
- Employee;
- Employee operational history;
- current/prior role context;
- Standards and StandardVersions;
- common process facts;
- actor/timestamp audit facts;
- readiness/decision history;
- import/export.

Promotions adds its own transition semantics:
- existing Employee selection;
- source/current role;
- target role;
- vertical promotion or horizontal move;
- Promotions-specific requirements and UI;
- a new process/decision record linked to the same Employee.

A prior Onboarding result is context/evidence. It does not automatically mark tasks in a Promotion process as passed.

## 4. Employee Core

Introduce a central `employees` entity. Minimum target fields:

- id
- organization_id
- employee_number (optional external/customer identifier)
- first_name
- last_name
- position/role label (optional snapshot/convenience field)
- department/area (optional)
- status: ACTIVE / INACTIVE
- created_at
- updated_at

Excluded from first Shared Core release:
- PESEL/national identifiers;
- home address;
- salary/payroll;
- medical records;
- BHP documents;
- tax/bank data;
- full personnel-file/HRIS scope.

A BOS User may optionally map to an Employee, but the relationship must not be required.

## 5. Existing Onboarding employee model — migration rule

Current Onboarding accepts either:
- a Membership/User as `employee_id`; or
- free-text `employee_name_snapshot`.

This is an Onboarding-era compatibility model and MUST NOT become the Shared Core contract.

Target:
- process references `employees.id`;
- process retains `employee_name_snapshot` for historical readability;
- migration/backfill creates or links Employee records without destroying snapshots;
- existing historical processes remain readable;
- no process is silently reassigned across organizations.

Migration requires explicit design and test before production.

## 6. Employee operational history

Employee history is a projection over process facts, not a manually edited biography.

Target timeline example:

Employee
- Onboarding / Magazynier / Standard v1.3 / READY
- Promotion / Magazynier -> Brygadzista / Standard v2.1 / READY
- Promotion / Brygadzista -> Kierownik / IN_PROGRESS

History should answer:
- which process/product;
- which role/Standard;
- exact StandardVersion;
- start/end dates;
- final/latest decision;
- relevant actor(s);
- process status.

Do not copy closure/progress records into a separate mutable history table unless performance later requires a projection/cache.

## 7. Standards

The domain concept should be BOS Standard, not OnboardingStandard or PromotionStandard.

Current Standard architecture is reusable:
Standard -> StandardVersion -> tasks/start requirements/readiness criteria.

Freeze:
- PUBLISHED remains immutable;
- active processes remain pinned to exact version;
- Promotions may use the same Standard infrastructure;
- sharing infrastructure does not mean every Standard is automatically appropriate for every product.

Future product applicability metadata may be added only if real Promotions requirements need it.

## 8. Process architecture

Do NOT immediately replace all onboarding tables with a generic BPM/workflow engine.

Shared Core v1 extracts reusable primitives while keeping product process records explicit.

Reason:
- Onboarding semantics are proven;
- Promotions requirements are not yet implemented;
- premature generic `processes` abstraction could encode false commonality.

Preferred direction:

Shared primitives
- Employee
- Standard/Version
- stage/progress facts
- readiness facts
- decision history
- audit actors/timestamps

Product processes
- onboarding_processes
- promotion_processes (or a later proven common process model)

A later unification into a generic `bos_processes` table requires evidence that both products have stable identical lifecycle semantics.

## 9. Five-stage BOS method

Current sequence:
WYJAŚNIJ -> POKAŻ -> RAZEM -> SAM -> SPRAWDŹ

Architecture decision:
- preserve current Onboarding 1.21 behaviour during Shared Core extraction;
- stage representation/order guard can become reusable infrastructure;
- do not yet decide that Promotions must use exactly the same required stage policy for every task;
- do not implement Claude-review suggestions (e.g. lighter non-K path) as part of this refactor.

Those are product-policy decisions for post-smoke validation, not architecture-cleanup changes.

## 10. Readiness and closure

Shared concepts:
- completion facts do not equal readiness;
- readiness facts do not automatically equal a human decision;
- decisions are append-only;
- reassessment preserves prior decisions.

Product policy remains configurable at product/domain level.

Important unresolved Onboarding issue to test separately:
current close UI appears to require the full READY gate before enabling READY, NOT_YET and STOP. Product semantics may require NOT_YET/STOP to remain possible when readiness fails. Shared Core extraction MUST NOT silently change this.

## 11. Import/export and ERP boundary

Shared Core owns a canonical BOS data representation.

First interoperability layer:
- CSV
- XLSX
- JSON

Initial datasets:
- Employees
- Standards + versions
- process/history exports
- closure/decision history
- organization backup manifest

Import priority:
- Employee CSV/XLSX import with column mapping and preview.

ERP/HR adapters are later integrations:
canonical BOS data -> adapter -> specific external system.

Do not claim generic ERP compatibility from CSV/XLSX alone. Specific ERP profiles require mapping against real target systems.

## 12. Data/privacy boundary

Employee Core increases the importance of data governance.

Before commercial release define:
- retention;
- role/access rules;
- export;
- deletion/anonymisation rules where legally applicable;
- note guidance and moderation/validation strategy;
- audit access.

Shared Core must minimize employee data. Operational history should not become a general employee dossier.

## 13. Repository target

Avoid one growing `onboardingRepository.ts`.

Target direction (names may change during implementation):

`lib/bos/core/employeeRepository.ts`
`lib/bos/core/standardRepository.ts`
`lib/bos/core/processPrimitives.ts`
`lib/bos/core/decisionRepository.ts`
`lib/bos/core/dataPortability.ts`

Onboarding-specific orchestration remains under an onboarding module and calls Shared Core.

Compatibility wrappers are acceptable during migration so routes can be moved incrementally and tested after each logical batch.

## 14. Database migration strategy

No production DB mutation in 1.22.0.

Implementation sequence:
1. inspect actual production migration ledger/schema before writing migration;
2. add Employee schema with tenant constraints;
3. backfill/link historical Onboarding employee references safely;
4. add process -> Employee FK while retaining name snapshots;
5. migrate application reads/writes;
6. only then remove/deprecate Membership-as-Employee assumptions;
7. add import/export after canonical Employee/Standard/process reads are stable.

Never infer production migration state solely from repository filenames.

## 15. Compatibility contract for Onboarding 1.21

Shared Core extraction must preserve:
- Standard version immutability;
- max 18 task rule;
- 1–3 readiness criteria;
- 4xTAK publication gate;
- optional `readyWhen`;
- start requirements;
- five ordered stages;
- K semantics;
- factual notes;
- handover continuity;
- readiness gate;
- human closure decision/history;
- formalities-outside-BOS confirmation;
- organization isolation.

Any behavioural change is a separate product change with its own test.

## 16. Build order after this freeze

1.22.1 Employee Core
1.22.2 Employee History
1.22.3 Shared Standards extraction
1.22.4 Shared Process primitives extraction
1.22.5 Data Portability
2.1 Production/user-flow smoke on target architecture
2.2 Product-policy corrections from smoke
3.0 Promotions implementation on Shared Core

## 17. Explicit non-goals of 1.22

- building Promotions now;
- turning BOS into HRIS;
- storing formal HR/BHP/medical/payroll records;
- generic BPM engine;
- live ERP API integrations;
- automatic task credit transfer from Onboarding to Promotions;
- active-process StandardVersion migration;
- changing five-stage policy before smoke evidence;
- rewriting Onboarding UI merely to match new internal module names.

## 18. Freeze decision

BOS Shared Core is the common operational substrate.
Onboarding and Promotions are product processes on top of it.

The primary shared identity is:
Organization -> Employee -> operational process history.

The primary shared definition chain is:
Standard -> immutable StandardVersion -> process binding.

Promotions reads the same Employee/history created during Onboarding. It does not receive a copied handoff payload.

This architecture is frozen as the implementation target for 1.22.x. Changes to these invariants require an explicit architecture decision before coding.
