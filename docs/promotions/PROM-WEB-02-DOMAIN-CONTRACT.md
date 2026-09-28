# PROM-WEB-02 — Domain Contract

Status: FROZEN  
Product: BOS Promotions Web 1.0  
Branch: promotions-1-0  
Depends on: PROM-WEB-01  
Reference: BOS Promotions Offline 1.0 RELEASE  
Date: 2026-09-28

## 1. Contract purpose

This document translates the frozen Promotions Web 1.0 scope into the domain contract that database migrations, repositories, services and UI must obey.

The contract preserves the released Offline 1.0 method:
- role A -> role B;
- target Standard as source of requirements;
- entry assessment POTWIERDZONE / DO SPRAWDZENIA / DO WDROŻENIA;
- verification PASS / FAIL;
- full WYJAŚNIJ -> POKAŻ -> RAZEM -> SAM -> SPRAWDŹ path for deployment;
- K as a hard gate;
- readiness verification;
- transition/handover as a hard gate;
- GOTOWY / JESZCZE NIE / STOP;
- stable historical meaning.

Names below are domain names. Physical SQL layout may differ only if these invariants remain enforceable.

## 2. Aggregate root — PromotionProcess

PromotionProcess is the aggregate root for one controlled transition of one Employee from role A to role B.

Required identity and binding:

PromotionProcess
- id: UUID
- organization_id: UUID, required
- product_id: UUID, required
- employee_id: UUID, required -> shared Employee
- employee_name_snapshot: text, required
- from_role: text, required
- to_role: text, required
- change_type: PROMOTION | LATERAL_MOVE
- target_standard_id: UUID, required -> shared Standard
- target_standard_version_id: UUID, required -> exact published StandardVersion
- owner_user_id: UUID, required
- started_on: date, required
- planned_effective_on: date, optional
- status: PLANNED | IN_PROGRESS | READY_TO_DECIDE | CLOSED | STOPPED
- created_by_user_id: UUID, required
- created_at / updated_at

Rules:
1. Employee, Standard and StandardVersion must belong to organization_id.
2. target_standard_version_id must belong to target_standard_id.
3. A process may start only against a PUBLISHED target StandardVersion.
4. The target StandardVersion binding is immutable after process creation.
5. Employee identity binding is immutable after process creation.
6. employee_name_snapshot, from_role and to_role preserve the historical wording used by this process.
7. Later changes to Employee.position or a new StandardVersion do not rewrite the process.
8. from_role and to_role are domain-significant snapshots, not identity keys.
9. Web 1.0 supports only PROMOTION and LATERAL_MOVE.

## 3. Target requirement snapshot

The authoritative requirement source is the exact target StandardVersion.

At process creation the system must establish the process task set from all active tasks of that version.

Each process task keeps:
- promotion_process_id
- standard_task_id
- task position/order snapshot where needed
- task name snapshot
- execution/ready-when snapshot where needed
- is_critical snapshot

The shared StandardVersion remains the source reference; snapshots protect historical readability and decisions.

No later edit/publication may add, remove or reinterpret requirements inside an already started PromotionProcess.

## 4. PromotionAssessment

One assessment exists for every target Standard task in the process.

PromotionAssessment:
- id
- organization_id
- promotion_process_id
- standard_task_id
- initial_assessment: CONFIRMED | TO_VERIFY | TO_DEPLOY
- evidence_note: optional factual text
- verification_result: PASS | FAIL | null
- effective_status: CONFIRMED | AWAITING_VERIFICATION | TO_DEPLOY
- assessed_by_user_id
- assessed_at
- verification_by_user_id, optional
- verification_at, optional
- verification_note, optional
- created_at / updated_at

Domain mapping:
- POTWIERDZONE = CONFIRMED
- DO SPRAWDZENIA = TO_VERIFY
- DO WDROŻENIA = TO_DEPLOY

Rules:
1. Every process task requires an assessment before GOTOWY.
2. TO_VERIFY without PASS/FAIL is unresolved.
3. TO_VERIFY + PASS -> effective CONFIRMED.
4. TO_VERIFY + FAIL -> effective TO_DEPLOY.
5. TO_DEPLOY -> effective TO_DEPLOY.
6. CONFIRMED -> effective CONFIRMED for non-K only.
7. A critical K task always has effective TO_DEPLOY regardless of initial assessment or verification PASS.
8. Evidence may support an assessment but never sets it automatically.
9. Invalid/free-text assessment states are impossible at the domain/API boundary.

## 5. PromotionEvidenceReference

Evidence is optional context used by a manager when assessing a target requirement.

PromotionEvidenceReference:
- id
- organization_id
- promotion_process_id
- promotion_assessment_id, optional
- source_type: ONBOARDING | PROMOTIONS | MANUAL
- source_process_id, optional according to source
- source_closure_id, optional
- source_standard_id, optional
- source_standard_version_id, optional
- source_standard_task_id, optional
- evidence_type / description
- source_result_snapshot, optional
- source_description_snapshot, required when an external historical meaning is relied upon
- observed_at / source_date, optional
- added_by_user_id
- created_at

Rules:
1. Evidence belongs to the same organization as PromotionProcess.
2. ONBOARDING evidence is read-only from the Promotions perspective.
3. Promotions never updates source Onboarding rows.
4. Evidence never directly marks an assessment CONFIRMED.
5. Historical references preserve enough snapshot meaning to remain understandable if current employee/standard data changes.
6. Promotions must function with zero evidence references and without an Onboarding license.
7. Deleting/hiding a current source record must not silently rewrite a completed Promotions decision.

## 6. PromotionDeploymentProgress

Deployment state exists for each assessment whose effective status is TO_DEPLOY.

PromotionDeploymentProgress:
- id
- organization_id
- promotion_process_id
- promotion_assessment_id
- explained_at / explained_by_user_id
- shown_at / shown_by_user_id
- together_at / together_by_user_id
- solo_at / solo_by_user_id
- checked_at / checked_by_user_id
- factual_note, optional
- status: NOT_STARTED | IN_PROGRESS | COMPLETE
- created_at / updated_at

Required order:
EXPLAINED -> SHOWN -> TOGETHER -> SOLO -> CHECKED

Rules:
1. COMPLETE requires all five required stages.
2. A later stage cannot semantically compensate for a missing earlier stage.
3. A task with dates only for SOLO/CHECKED is not COMPLETE.
4. Stage actor/time is audit data and cannot be inferred merely from the current viewer.
5. Normal correction/recovery may repeat work, but the final state must retain auditable facts sufficient to explain completion.
6. Domain logic, not UI percentage, decides completion.

## 7. K Gate

For a process task with is_critical_snapshot = true:
- effective assessment is always TO_DEPLOY;
- full deployment path is mandatory;
- SOLO must be present;
- CHECKED must be present;
- deployment status must be COMPLETE.

K_GATE_PASS is true only when every critical task satisfies all conditions above.

No history/evidence/initial assessment can waive this gate in Web 1.0.

## 8. PromotionReadinessCheck

Readiness criteria come from the exact target StandardVersion.

PromotionReadinessCheck:
- id
- organization_id
- promotion_process_id
- standard_readiness_criterion_id
- criterion snapshot
- verification method snapshot
- result: PASS | FAIL | UNRESOLVED
- checked_at
- checked_by_user_id
- factual_note, optional

Rules:
1. Every applicable target readiness criterion must be resolved before GOTOWY.
2. GOTOWY requires PASS for every applicable criterion.
3. A new StandardVersion cannot replace criteria inside an existing process.
4. These checks are distinct from task-level SPRAWDŹ.

## 9. PromotionTransitionItem

Transition/handover is owned by Promotions.

PromotionTransitionItem:
- id
- organization_id
- promotion_process_id
- position
- description
- disposition: TRANSFER | RETAIN | CHANGE | NOT_APPLICABLE
- confirmation: DONE | NOT_DONE | PENDING
- effective_on / confirmed_at, as applicable
- confirmed_by_user_id, optional
- evidence_note, optional
- created_at / updated_at

PromotionTransitionState is derived:
- INCOMPLETE
- PENDING
- NOT_DONE
- CLOSED

Rules:
1. Transition items describe concrete responsibilities/access/resources/other handover facts.
2. GOTOWY requires transition state CLOSED.
3. NOT_DONE or PENDING blocks GOTOWY.
4. Transition is not merely a note or recommendation.
5. NOT_YET and STOP may be recorded without a CLOSED transition when their own minimum decision requirements are met.

## 10. Final Integrity Gate

Final Integrity Gate is a domain computation, not a manually editable field.

It returns individual gate results plus aggregate readiness.

Gate set:

STANDARD
- target StandardVersion exists;
- is the version bound to the process;
- was valid/published at process creation;
- process has at least one target task;
- required Standard readiness content exists.

PROCESS
- employee binding valid;
- from_role present;
- to_role present;
- change_type valid;
- owner present;
- started_on present;
- required decision metadata present when deciding.

ENTRY
- every process task has a valid assessment;
- no TO_VERIFY remains unresolved.

DEPLOYMENT
- every effective TO_DEPLOY task has COMPLETE five-stage progress.

K
- every critical task satisfies the K Gate.

READINESS
- every applicable target readiness criterion is PASS;
- any additional frozen final controls required by the product are satisfied.

TRANSITION
- handover state is CLOSED.

Aggregate:
READY_TO_DECIDE_FOR_GOTOWY = all applicable gates PASS.

The UI may explain gate failures but cannot override them.

## 11. PromotionClosure / decision history

PromotionClosure is an append-only decision record.

PromotionClosure:
- id
- organization_id
- promotion_process_id
- decision_sequence: positive integer
- decision: READY | NOT_YET | STOP
- verified_by_user_id
- verified_at
- summary / factual decision note, optional according to UI contract
- recommendation / next action, optional
- employee_name_snapshot
- from_role_snapshot
- to_role_snapshot
- change_type_snapshot
- target_standard_id_snapshot/reference
- target_standard_version_id_snapshot/reference
- target_standard_version_label_snapshot
- transition_state_snapshot
- gate_result_snapshot
- created_at

Rules:
1. Existing closures are never overwritten to express a later decision.
2. decision_sequence is unique per process and strictly increasing.
3. READY may be created only when Final Integrity Gate passes.
4. NOT_YET may be created when minimum process identity + decision actor/time are valid; it does not falsely complete missing gates.
5. STOP may be created under the same minimum historical identity requirements; it closes/stops this transition only.
6. A NOT_YET record may be followed by further work and a later decision.
7. STOP does not alter the employee's prior role history or earlier Onboarding/Promotions closures.
8. READY does not rewrite older NOT_YET records.
9. Closure snapshots make historical meaning independent of later display-name, role or Standard changes.

## 12. Process lifecycle

Initial:
PLANNED

After substantive work begins:
IN_PROGRESS

When the complete Final Integrity Gate passes:
READY_TO_DECIDE

After READY:
CLOSED

After STOP:
STOPPED

NOT_YET:
- creates an append-only closure/decision record;
- process remains capable of continued work;
- lifecycle returns/remains IN_PROGRESS unless a later explicit product rule says otherwise.

The derived gate state is authoritative; status cannot be used to bypass it.

## 13. Human decision rule

The system determines whether the basis for READY/GOTOWY is complete.

The manager makes the final human decision.

The system must not:
- automatically promote the employee;
- infer READY from percentage completion;
- turn historical evidence into a decision;
- automatically choose READY because all gates pass.

Passing all gates means "READY TO DECIDE", not an automatic positive decision.

## 14. Shared Core ownership

Shared Core owns:
- Organization;
- tenant context;
- User/Membership/access primitives;
- Product License;
- Employee;
- Standard;
- StandardVersion;
- StandardTask/K definition;
- Standard readiness criteria;
- reusable neutral BOS stage primitives;
- shared audit/history/search/export infrastructure where appropriate.

Promotions references these objects. It does not clone them.

## 15. Onboarding ownership

Onboarding owns:
- OnboardingProcess;
- Onboarding task/progress records;
- Onboarding closure/decision records;
- its own start/closure semantics.

Promotions may query Onboarding history through controlled same-tenant Core/read models.

Promotions cannot:
- edit Onboarding records;
- reopen Onboarding;
- mutate Onboarding Closure;
- use Onboarding READY as an automatic Promotions PASS;
- require purchase of Onboarding.

## 16. Tenant invariants

Every Promotions table carrying customer data has organization_id.

For all child records:
child.organization_id = promotion_process.organization_id.

Employee, Standard, StandardVersion and referenced BOS evidence must be tenant-compatible.

These invariants must be protected in persistence/domain code and, where practical, by composite database constraints. A UI-only tenant check is insufficient.

Missing organization context fails closed.

## 17. Historical invariants

Completed historical meaning must survive:
- Employee rename;
- Employee position change;
- new StandardVersion publication;
- Standard archival;
- later Promotions attempts;
- later Onboarding activity;
- later NOT_YET/READY decisions in the same process.

References provide relational integrity; snapshots provide semantic stability.

## 18. Offline 1.0 parity matrix

Offline: role A -> role B
Web: PromotionProcess.from_role -> to_role
Result: MATCH

Offline: AWANS / PRZESUNIĘCIE POZIOME
Web: PROMOTION / LATERAL_MOVE
Result: MATCH

Offline: target Standard
Web: target Standard + exact published StandardVersion
Result: MATCH / stronger persistence

Offline: POTWIERDZONE / DO SPRAWDZENIA / DO WDROŻENIA
Web: PromotionAssessment CONFIRMED / TO_VERIFY / TO_DEPLOY
Result: MATCH

Offline: DO SPRAWDZENIA + PASS/FAIL
Web: verification_result PASS/FAIL
Result: MATCH

Offline: K forces DO WDROŻENIA
Web: critical task effective status always TO_DEPLOY
Result: MATCH

Offline: WYJAŚNIJ -> POKAŻ -> RAZEM -> SAM -> SPRAWDŹ
Web: PromotionDeploymentProgress five-stage ordered path
Result: MATCH

Offline: K Gate requires full path plus SAM/SPRAWDŹ
Web: K Gate invariant
Result: MATCH

Offline: readiness criterion/final controls
Web: PromotionReadinessCheck + Final Integrity Gate
Result: MATCH

Offline: transition handover must be ZAMKNIĘTE for GOTOWY
Web: PromotionTransitionState CLOSED required for READY
Result: MATCH

Offline: GOTOWY / JESZCZE NIE / STOP
Web: READY / NOT_YET / STOP
Result: MATCH

Offline: JESZCZE NIE/STOP do not require artificial full completion
Web: separate minimum decision requirements
Result: MATCH

Offline: STOP does not rewrite previous role/history
Web: append-only closure + historical invariants
Result: MATCH

Offline: snapshot of final meaning
Web: immutable closure snapshots + references
Result: MATCH / stronger persistence

Offline limitation: workbook has no Employee Core / immutable database versioning
Web: shared Employee + exact immutable StandardVersion
Result: intentional Web strengthening, no semantic conflict

## 19. Legacy migration implications

Legacy main currently uses:
- promotion_processes.employee_id -> users;
- promotion_checks TODO/DONE;
- promotion_closures COMPLETED / COMPLETED_WITH_RECOMMENDATIONS;
- one closure per process.

These structures do not satisfy this contract.

Migration work must therefore:
1. bind Promotions to shared Employee;
2. add exact target Standard/StandardVersion binding;
3. introduce per-target-task assessment;
4. introduce five-stage deployment state;
5. introduce evidence references;
6. introduce readiness checks;
7. introduce transition/handover;
8. replace legacy closure semantics with append-only READY / NOT_YET / STOP;
9. preserve any existing legacy rows until an explicit safe migration policy determines their mapping.

No legacy row may be silently reinterpreted as satisfying a new Web 1.0 gate.

## 20. Non-goals

This contract does not define:
- compensation changes;
- performance scoring;
- talent ranking;
- automatic promotion recommendation;
- generic workflow engine;
- LMS;
- recruitment;
- succession planning;
- full HRIS;
- organization chart management.

## Contract result

PROM-WEB-02 — DOMAIN CONTRACT — PASS

The domain contract contains no semantic conflict with BOS Promotions Offline 1.0 RELEASE.

Next: PROM-WEB-03 — Employee Migration.
