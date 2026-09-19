# BOS Onboarding — Architecture Freeze v1.0

Status: FROZEN for Web v1 database design  
Scope: domain/data architecture only. No UI decisions.

## 1. Core invariants

1. Every customer-owned onboarding record belongs to exactly one `organization_id`.
2. A published `StandardVersion` is immutable. Its tasks, start requirements and readiness criteria cannot be edited in place.
3. An `OnboardingProcess` binds permanently to the `standard_version_id` selected at start.
4. Publishing a new Standard version never changes an active onboarding.
5. Web v1 does not migrate an active onboarding from v1 to v2.
6. One Standard may be reused by many onboarding processes.
7. Progress, K completeness and close readiness are derived from domain facts, not user-editable percentages.
8. A closed decision is historical. Reassessment/reopen creates new history; it does not overwrite the previous decision.
9. Platform membership roles and onboarding operational assignments are separate concepts.
10. Cross-tenant relationships must be rejected by database constraints where practical, not only by application code.

## 2. Standard lifecycle

### Standard
Container representing a position/process standard.

Status:
- DRAFT
- ACTIVE
- ARCHIVED

### StandardVersion
Versioned executable definition of the Standard.

Status:
- DRAFT
- PUBLISHED
- ARCHIVED

Rules:
- DRAFT may be edited.
- PUBLISHED is immutable.
- Only a PUBLISHED version that passes readiness rules may start a new onboarding.
- `standards.current_version_id` points to the current published version.
- ARCHIVED versions remain readable for historical onboarding processes.

## 3. StandardVersion contents

### StandardTask
Maximum 18 ordered activities for Web v1.

Required domain fields:
- position/order
- name/task
- correct execution
- hint/instruction (optional)
- critical flag K
- start condition / ready-when where applicable

The database must enforce unique order within a StandardVersion.

### StartRequirement
Version-owned prerequisites checked before onboarding may start.

Categories inherited from BOS logic:
- tools
- access
- materials
- instructions
- workplace
- other

Each requirement is part of the immutable published version.

### ReadinessCriterion
Version-owned observable/testable readiness criteria.

Web v1 supports 1–3 criteria.

Fields:
- position
- criterion
- verification method

The application/domain layer validates the BOS quality test before publication.

## 4. OnboardingProcess

Required relationships:
- organization
- product
- employee / employee-name snapshot
- Standard
- immutable StandardVersion binding
- trainer
- evaluator
- optional buddy
- creator

Web v1 process states:
- PLANNED
- IN_PROGRESS
- PAUSED
- READY_TO_CLOSE
- CLOSED
- CANCELLED

Flags such as K risk are not lifecycle states.

Rules:
- process cannot start from an unpublished/not-ready StandardVersion;
- `standard_version_id` cannot change after process start;
- new Standard versions affect only new onboarding processes;
- pause/resume preserves progress and history;
- cancellation preserves historical data.

## 5. Training progress

BOS sequence:
WYJAŚNIJ → POKAŻ → RAZEM → SAM → SPRAWDŹ

Web stores factual stage progress instead of only TODO/IN_PROGRESS/DONE.

For each process/task the model must be able to answer:
- which stages are complete;
- who performed/confirmed critical actions;
- when they happened;
- whether the task is passed;
- whether it is K;
- notes.

Minimum audit requirement:
- SPRAWDŹ: actor + timestamp;
- final decision: actor + timestamp;
- reopen/reassessment: actor + timestamp + reason;
- StandardVersion publication: actor + timestamp.

The domain layer may record actor/time for other stages without making each one a separate business audit event.

A task is passed only when required BOS stages, including SAM and SPRAWDŹ, are satisfied.

## 6. Derived process rules

Derived values include:
- total activities;
- passed activities;
- total K activities;
- passed K activities;
- progress percentage;
- readiness to close.

These values are calculated, not manually edited.

Hard fail-safe for Web:
- no process start if StandardVersion is not publishable/published;
- no final READY decision while required activities/K/readiness conditions fail;
- no silent replacement of the process StandardVersion;
- closed history cannot be overwritten.

BHP remains an external/process condition in Web v1; BOS Onboarding does not become a BHP compliance system.

## 7. Closure and reassessment

Web v1 decisions:
- READY
- NOT_YET
- STOP

The existing one-row-per-process closure model is replaced by decision history.

A decision record stores at minimum:
- organization
- onboarding process
- Standard + StandardVersion
- employee snapshot
- decision
- evaluator
- summary
- recommendations/notes
- timestamp
- sequence/revision
- optional relation to the decision being superseded/reassessed

Reopen/reassessment:
- requires a reason;
- preserves all previous decisions;
- reopens the process into an appropriate active state;
- subsequent closure creates another decision record;
- historical READY is never deleted or rewritten.

## 8. Roles and permissions

Platform roles remain:
- OWNER
- ADMIN
- MANAGER
- USER

Operational onboarding assignments are separate:
- trainer
- evaluator
- buddy (optional)

Web v1 authorization must use both organization membership and process assignment. OWNER/ADMIN status does not itself mean that person is the evaluator.

Exact action matrix is implemented in domain authorization, not encoded by inventing additional global membership roles.

## 9. Tenant integrity

Target composite constraints should make cross-organization references impossible for onboarding-domain entities.

Important pairs to support with UNIQUE keys/FKs:
- StandardVersion ↔ Standard + organization
- StandardTask ↔ StandardVersion + organization
- StartRequirement ↔ StandardVersion + organization
- ReadinessCriterion ↔ StandardVersion + organization
- OnboardingProcess ↔ Standard/StandardVersion + organization
- TaskProgress ↔ OnboardingProcess/StandardTask + organization
- DecisionHistory ↔ OnboardingProcess + organization

Application queries must always receive explicit `organizationId`.

Production onboarding repositories must not fall back to a fake/demo organization when a database is configured.

## 10. Immutability

Database migration must add protection for published StandardVersion content.

Forbidden after PUBLISHED:
- changing version-owned Standard fields;
- inserting/updating/deleting its tasks;
- inserting/updating/deleting its start requirements;
- inserting/updating/deleting its readiness criteria.

A correction to published content creates a new StandardVersion.

## 11. Web v1 exclusions

Not required for first release:
- migration of active onboarding v1 → v2;
- automatic diff/migration engine;
- mandatory evidence attachments for every SPRAWDŹ;
- notifications/reminders;
- HRIS/calendar integrations;
- gamification;
- AI-generated Standards;
- BPMN/general workflow engine;
- full audit of every ordinary field edit;
- advanced analytics.

## 12. Migration target

The next implementation step is one cumulative onboarding-domain migration on top of migrations 001–006. It must:

1. extend/replace onboarding enums for the frozen lifecycle;
2. extend StandardTask with BOS fields needed by the method;
3. add start requirements and readiness criteria;
4. add trainer/evaluator assignments;
5. replace coarse task status with five-stage progress facts;
6. replace single immutable closure row with append-only decision history;
7. add composite tenant constraints;
8. add published-version immutability guards;
9. preserve compatibility/migrate existing development data where feasible;
10. avoid UI/demo concerns.

After this migration, repository/domain code is updated separately.