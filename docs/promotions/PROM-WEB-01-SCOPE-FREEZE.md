# PROM-WEB-01 — Scope Freeze

Status: FROZEN  
Product: BOS Promotions Web 1.0  
Branch: promotions-1-0  
Date: 2026-09-28

## 1. Purpose

BOS Promotions Web 1.0 controls an employee's transition from role A to role B. It is not a generic HRIS, talent-management system, checklist, LMS, or extension of Onboarding.

The product answers one operational question:

> Has this employee completed a controlled transition from the current role to the target role according to the target role Standard, and is there sufficient basis for the manager's decision?

## 2. Change types — frozen

Web 1.0 supports exactly two change types:

- PROMOTION — AWANS
- LATERAL_MOVE — PRZESUNIĘCIE POZIOME

No third change type may be introduced implicitly. In particular, "rozszerzenie odpowiedzialności" and "zmiana specjalizacji" are not separate Web 1.0 types. Their future addition requires an explicit product decision and a new scope/version.

## 3. Fundamental event

The fundamental domain event is:

ROLE A -> ROLE B

Every PromotionProcess represents one concrete employee transition from a source role to a target role.

The target role is evaluated against a concrete published StandardVersion. The target Standard is the source of requirements. Employee history is only a source of evidence.

A PromotionProcess must not reinterpret an old Onboarding process as an earlier stage of the same workflow.

## 4. Product flow

Manager-facing flow:

DECISION -> PREPARATION -> TRANSITION -> VERIFICATION -> HISTORY

Operationally the engine must support:

1. identify employee and A -> B change;
2. bind the target published StandardVersion;
3. assess every target Standard task;
4. resolve items requiring verification;
5. execute required deployment work;
6. enforce critical-task K requirements;
7. verify target-role readiness;
8. close the operational handover/transition;
9. allow a human decision;
10. preserve the result as history.

## 5. Entry assessment

Each active target Standard task receives an entry assessment:

- POTWIERDZONE
- DO SPRAWDZENIA
- DO WDROŻENIA

Meaning:

POTWIERDZONE — sufficient current evidence exists that the employee performs the target requirement according to the target Standard.

DO SPRAWDZENIA — capability may already exist but requires actual verification.

DO WDROŻENIA — the requirement is new, missing, or not performed according to the target Standard and requires the BOS deployment path.

Resolution:

DO SPRAWDZENIA -> SPRAWDŹ
- PASS -> POTWIERDZONE
- FAIL -> DO WDROŻENIA

Evidence never makes this decision automatically.

## 6. BOS execution path

DO WDROŻENIA uses the shared BOS operational method:

WYJAŚNIJ -> POKAŻ -> RAZEM -> SAM -> SPRAWDŹ

The sequence is substantive, not decorative. A task that requires deployment is not complete merely because SAM and SPRAWDŹ contain values.

## 7. Critical tasks K

K is a hard gate.

A target Standard task marked K cannot be bypassed by POTWIERDZONE or a verification PASS. It must reach actual deployment and include independent execution (SAM) and verification (SPRAWDŹ), in addition to the required complete execution path.

A positive final decision is impossible while any required K gate remains incomplete.

## 8. Transition / handover

The transition from role A to role B includes operational handover/closure of the previous-role state.

This is part of the process, not informational metadata.

The transition layer may include transferred responsibilities, retained responsibilities, access changes, resources and other concrete handover items.

GOTOWY requires the transition/handover gate to be closed.

## 9. Final decisions

Web 1.0 supports exactly:

- READY — user-facing GOTOWY
- NOT_YET — user-facing JESZCZE NIE
- STOP — user-facing STOP

GOTOWY means the transition to the target role has been positively completed.

JESZCZE NIE means the A -> B transition remains incomplete/open; the employee is not yet ready for the target role.

STOP means this specific A -> B transition is stopped/closed without a positive target-role result.

JESZCZE NIE and STOP must remain possible without artificially completing all requirements needed for GOTOWY, subject to minimum process identity and decision-record requirements.

## 10. Historical semantics

A Promotions decision cannot rewrite the semantic meaning of an earlier process or decision.

Example:

Onboarding -> Magazynier -> GOTOWY
later Promotions -> Magazynier -> Brygadzista -> STOP

The employee remains historically verified as Magazynier. STOP means only that the later transition to Brygadzista did not complete positively.

Closures/decisions are historical records. Reassessment or later decisions preserve prior decisions rather than replacing them.

## 11. Boundary with Onboarding

Onboarding and Promotions are separate product domains.

Onboarding owns entry into a role through an onboarding process.

Promotions owns a later controlled transition A -> B.

Promotions may read Onboarding history for the same Employee and organization as evidence/context. It does not own, modify, reopen or reinterpret Onboarding records.

An Onboarding READY/GOTOWY result never automatically sets a Promotions task to POTWIERDZONE.

Promotions must work normally for organizations that own Promotions but do not own Onboarding.

## 12. Shared Core boundary

Promotions MUST reuse Shared Core where the capability already exists:

- Organization and tenant context;
- users, memberships, authorization primitives;
- product licensing;
- Employee identity;
- Standard;
- StandardVersion;
- StandardTask and K designation;
- Standard start requirements and readiness criteria where applicable;
- neutral BOS execution-stage primitives;
- audit actor/timestamp primitives;
- shared search/history/export infrastructure where appropriate.

Promotions MUST NOT create parallel Promotion-specific copies of Employee, Standard or StandardVersion.

Promotions owns:

- PromotionProcess and A -> B semantics;
- entry assessment;
- verification branch;
- Promotions evidence references;
- Promotions deployment state;
- Promotions K policy;
- transition/handover;
- Promotions Final Integrity Gate;
- PromotionClosure/decision semantics.

## 13. Employee identity

A PromotionProcess references the shared Employee scoped to the same organization.

Human-readable employee name is retained as a historical snapshot where needed, but textual names are not the identity key.

Employee operational history is a projection of real product processes. Do not create a separate manually maintained "employee history" truth table.

## 14. Target Standard and versioning

Every PromotionProcess is bound to the target Standard and the exact published StandardVersion used when the process begins.

Later publication of a new StandardVersion must not change the meaning, task set, requirements or historical result of an already started or completed PromotionProcess.

Published StandardVersions remain immutable according to Shared Core rules.

## 15. Evidence

Evidence can originate from previous BOS processes, including Onboarding, or from Promotions-specific verification.

Evidence is context supporting a manager decision. It is not an automatic credit-transfer mechanism.

Where a Promotions decision relies on historical evidence, the reference must preserve enough historical identity/snapshot information for the later record to remain semantically stable even if current records evolve.

## 16. Final Integrity Gate

GOTOWY requires all applicable gates to pass:

1. TARGET STANDARD — valid published target StandardVersion with required content.
2. PROCESS — complete required identity, A -> B change, actors and required dates.
3. ENTRY — every active target task has a valid resolved entry assessment.
4. DEPLOYMENT — every DO WDROŻENIA item completed the required full BOS execution path.
5. K — every target K requirement satisfies the Promotions K policy.
6. READINESS — target Standard readiness criteria and required final controls pass.
7. TRANSITION — operational handover/transition is closed.

The backend/domain layer is authoritative. UI state must not be the security or integrity boundary.

## 17. Tenant and integrity rules

All Promotions customer data belongs to a concrete organization_id.

Production reads and writes fail closed when organization context is absent.

Cross-organization binding between Employee, PromotionProcess, Standard, StandardVersion, tasks, evidence or closures is forbidden and must be protected below the UI layer.

Direct requests must not bypass domain gates.

## 18. Web 1.0 exclusions

The following are outside Promotions Web 1.0 unless separately approved:

- compensation/pay-rise workflow;
- performance appraisal system;
- succession planning;
- talent ranking;
- recruitment;
- generic HRIS;
- LMS/course management;
- organizational chart management;
- automatic promotion recommendation;
- automatic readiness decision by AI;
- new change types beyond PROMOTION and LATERAL_MOVE;
- automatic conversion of Onboarding history into passed Promotions requirements;
- generic universal BOS workflow engine.

## 19. Existing legacy Promotions implementation

The current legacy Promotions structures on main — including TODO/DONE promotion_checks and COMPLETED/COMPLETED_WITH_RECOMMENDATIONS closure semantics — are not the Web 1.0 product contract.

They may be migrated or replaced. They must not constrain the frozen domain semantics above.

Existing production/customer data, if any, must not be silently destroyed or semantically rewritten during migration.

## 20. Change control

This document freezes the product scope for Promotions Web 1.0.

Implementation details may evolve if they preserve this contract.

Any change affecting:
- supported change types;
- A -> B semantics;
- target Standard ownership/versioning;
- Employee identity;
- K policy;
- evidence semantics;
- handover as a hard gate;
- READY / NOT_YET / STOP meaning;
- historical immutability;
- Onboarding/Core ownership boundaries

requires an explicit product-scope decision before implementation.

## Freeze result

PROM-WEB-01 — SCOPE FREEZE — PASS

Next: PROM-WEB-02 — Domain Contract.
