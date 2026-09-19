# BOS Onboarding Web 1.0 — technical architecture freeze

Status: **FROZEN — pre-migration architecture contract**  
Date: 2026-09-19

This document supersedes the earlier product-only freeze from point 9. It freezes the technical domain contract that future database migrations, repositories and UI must implement without silently changing the meaning of an onboarding record.

## 1. Invariant

BOS Onboarding keeps one invariant:

**STANDARD → REALIZATION → VERIFICATION → HISTORICAL DECISION**

In the product UI:

1. **PRZYGOTUJ** — Standard Stanowiska
2. **PRZEPROWADŹ** — concrete onboarding pinned to one StandardVersion
3. **ZAMKNIJ** — verification and historical decision

UI may simplify the presentation, but it must not collapse these into one mutable record.

## 2. Canonical entity chain

The canonical core is:

`Standard → StandardVersion → StandardTask → OnboardingProcess → OnboardingTaskProgress → OnboardingClosure`

A future extension may add supporting records around this chain, but may not bypass it.

### Standard

Reusable organizational definition of a role/work pattern.

Lifecycle:
- DRAFT
- ACTIVE
- ARCHIVED

A Standard is an identity/container. Operational content belongs to its versions.

### StandardVersion

Immutable published snapshot used by an onboarding process.

A published version contains the complete operational definition needed to execute onboarding, including:

- role / position identity,
- organizational area,
- expected duration or timing where applicable,
- ordered tasks,
- what must be done,
- how correct execution looks,
- practical guidance/instructions,
- **K** control/critical flag where used,
- task order,
- conditions required before work may start,
- readiness criterion,
- method of verification.

Publishing v2 never modifies v1.

Starting an onboarding binds the process to exactly one StandardVersion. Web 1.0 does **not** silently migrate an active process from v1 to v2.

### StandardTask

Ordered task inside one immutable StandardVersion.

The task definition describes the expected work. Employee-specific execution state does not belong to StandardTask.

## 3. OnboardingProcess

One concrete onboarding realization for one employee.

It must retain at least:

- organization,
- employee / employee snapshot,
- exact Standard,
- exact StandardVersion,
- responsible manager/owner,
- optional trainer/buddy assignments,
- start/target dates,
- lifecycle status,
- creation/update audit information.

Multiple onboarding processes may exist in one organization. Records must never depend on a singleton/current-process assumption.

### Process lifecycle

Lifecycle is separate from the final readiness decision.

Frozen lifecycle vocabulary:

- NOT_STARTED
- ACTIVE
- PAUSED
- COMPLETED
- CANCELLED

A database implementation may require a compatibility migration from older status names. That migration must preserve meaning and history.

## 4. Five-stage task progress

Each onboarding task is executed as an operational learning/verification sequence:

1. **WYJAŚNIJ** — explanation completed
2. **POKAŻ** — correct execution demonstrated
3. **RAZEM** — task performed together
4. **SAM** — employee performed independently
5. **SPRAWDŹ** — independent performance verified

The persisted progress record must be able to represent the five stages independently.

Minimum technical audit fields for a task progress record:

- `explained_at`
- `shown_at`
- `together_at`
- `independent_at`
- `verified_at`
- `verified_by_user_id`
- `note`
- `updated_by_user_id`

A task is considered operationally passed only after **SAM + SPRAWDŹ** are satisfied. Earlier stages are progress, not proof of readiness.

The implementation may additionally keep derived status/progress values for efficient UI, but a derived value must not replace the five-stage evidence.

## 5. K — control / critical condition

`K` remains part of the onboarding control model.

It is not a decorative UI label. It is a persisted property used by readiness logic.

A task/condition marked K must be satisfied before a process can receive READY.

The exact visual treatment may change without changing this rule.

## 6. Readiness gate

The system must fail safe.

A process may receive **READY** only when all required conditions are true:

- all required tasks are operationally passed,
- every required K condition is satisfied,
- StandardVersion readiness criteria are satisfied,
- required verification exists,
- the decision is made by an authorized user.

Missing evidence must never be interpreted as readiness.

The UI may calculate and explain what remains incomplete, but it must not allow presentation logic to override the gate.

## 7. Decision model

Final readiness is a decision, not the same field as process lifecycle.

Frozen decision vocabulary:

- READY
- NOT_YET
- STOP

The decision record must preserve:

- decision,
- timestamp,
- deciding/verifying user,
- exact process,
- exact StandardVersion,
- supporting summary,
- recommendations/reason where applicable.

A historical decision must not be overwritten in place.

## 8. Closure and history

OnboardingClosure is a historical record of verification and decision.

Once created, its historical meaning is immutable.

Later changes to:
- Standard,
- StandardVersion,
- employee profile,
- current manager,
- product UI

must not rewrite what was verified and decided at closure time.

Snapshots are used where necessary to preserve historical meaning.

## 9. Reopen / reassessment

A closed onboarding may require reassessment.

Reassessment must not delete or mutate the original historical decision.

A reopen/reassessment operation requires:

- reason,
- actor,
- timestamp,
- reference to the previous closure/decision,
- new verification evidence as applicable,
- a new decision/closure record.

History therefore forms an auditable sequence rather than one editable final state.

## 10. Permissions and responsibility

BOS Core roles remain:

- OWNER
- ADMIN
- MANAGER
- USER

Frozen Onboarding authorization principles:

- OWNER / ADMIN / MANAGER may create and manage onboarding work according to organization permissions,
- publishing/changing a Standard requires an authorized management role,
- an assigned manager/trainer may conduct progress steps permitted to that assignment,
- independent execution (**SAM**) and its verification (**SPRAWDŹ**) must remain attributable,
- READY / NOT_YET / STOP must be attributable to an authorized decision maker,
- ordinary USER access must never implicitly grant management/publishing/decision rights.

Exact permission middleware/API implementation may evolve, but these responsibility boundaries may not be weakened accidentally by UI changes.

## 11. Tenant isolation

Every customer-owned onboarding record is scoped by `organization_id`.

This includes, directly or through an enforced parent relation:

- Standards,
- StandardVersions,
- StandardTasks,
- OnboardingProcesses,
- task progress/evidence,
- closures/decisions,
- reassessments,
- linked resources and activity history.

Repository/API operations must resolve the authenticated organization and fail closed when tenant context is missing.

Knowing another record UUID must never be sufficient to access or mutate it.

Active product access additionally requires the organization's active BOS Onboarding license.

## 12. Version and snapshot rules

The following rules are frozen:

1. Standard is versioned.
2. Published StandardVersion is immutable in operational meaning.
3. Starting a process pins the exact version.
4. A later StandardVersion does not migrate an active process automatically.
5. Historical closures retain the version/snapshot needed to interpret the decision.
6. Reassessment creates history; it does not rewrite history.

## 13. Supporting concepts

The architecture must leave room for supporting data without redesigning the core:

- resources/files,
- reusable task/template groups,
- milestones/checkpoints,
- manager/trainer/buddy assignments,
- evidence,
- reviews/tests,
- process notes/activity,
- post-process evaluation,
- communication templates/automation.

These are extensions around the canonical chain, not additional core stages.

## 14. Mapping of Onboarding 0.x material

| Previous material | Web destination |
| --- | --- |
| Master Control | dashboard/process status; not a separate business record |
| Instrukcja Managera | contextual product/stage guidance |
| Preboarding i Sprzęt | preparation tasks/template group |
| Karta Stanowiska | Standard / StandardVersion |
| Plan 30/60/90 | process milestones/schedule |
| Księga Firmy | organization resource |
| Checklista D1/T1 | reusable tasks/template group |
| Rola Buddy | process assignment |
| SOP Template | resource linked to Standard/task |
| Formularz 1:1 Review | checkpoint/evidence |
| Test Wiedzy | verification/evidence |
| Ankieta Ewaluacji | post-process evaluation |
| welcome emails | communication template/automation |
| stanowiskowe tests | verification/evidence |
| Skill Matrix | future capability extension |
| Tooling Guide | Standard/organization resource |
| Handover Plan | process template/checklist |
| presentation | resource |
| gamification | outside core |
| Weekly Journal | process evidence/log |
| Offboarding | separate future process/product |

## 15. Migration boundary

This freeze is intentionally completed **before** changing the production schema.

The current database/repository may still use an older, simpler representation such as aggregate task statuses and older process status names. That is implementation debt to migrate deliberately; it is not permission to reinterpret the frozen model.

Any migration following this document must:

- be additive or explicitly data-preserving,
- preserve existing BOS Test Company records,
- preserve StandardVersion pinning,
- preserve tenant isolation,
- preserve existing historical closures,
- define compatibility/backfill for existing progress,
- be tested on a temporary database branch before production completion.

Production schema migration is a separate step and requires explicit approval.

## 16. Change rule after freeze

For every proposed Onboarding change ask:

**Does this alter Standard → immutable StandardVersion → five-stage realization → verification → historical decision?**

If no, implement it as supporting functionality.

If yes, treat it as a deliberate domain-model migration, document the reason and migration path, and do not introduce it incidentally through UI or repository refactoring.

## 17. Freeze result

The technical model is now frozen for the next implementation phase:

- immutable StandardVersion,
- complete StandardTask operational definition,
- five-stage task progress,
- K as a readiness condition,
- fail-safe READY gate,
- lifecycle separate from decision,
- READY / NOT_YET / STOP decisions,
- immutable history,
- reopen/reassessment without history loss,
- explicit responsibility/audit,
- multi-onboarding,
- strict `organization_id` isolation,
- license-gated module access.

No production database migration is performed by this freeze.
