# BOS Onboarding Web 1.0 — model freeze

Status: **FROZEN after architecture review (point 9)**  
Date: 2026-09-18

This document freezes the product model built in points 5–8 before BOS Core/database work begins.

## 1. Core process

BOS Onboarding Web 1.0 uses one invariant operational path:

**STANDARD → REALIZATION → VERIFICATION**

In the product UI this is:

1. **PRZYGOTUJ** → Standard Stanowiska
2. **PRZEPROWADŹ** → Karta Postępu
3. **ZAMKNIJ** → Karta Zakończenia

The application must not collapse these into one mutable record.

## 2. Core records

### Standard Stanowiska
Reusable role/work pattern owned by an organization.

Required concepts:
- role/name
- organizational area
- status
- versions
- ordered tasks
- correct execution description
- readiness criterion

### StandardVersion
Published snapshot of a Standard Stanowiska.

Rule: a new version never overwrites a version already referenced by an onboarding process.

### OnboardingProcess / Karta Postępu
A concrete realization for one employee.

Required concepts:
- employee
- exact standard ID
- exact standard version
- start date
- target date
- responsible manager
- task progress
- task state
- completion date / operational note

### OnboardingClosure / Karta Zakończenia
Immutable historical outcome created after verification.

Required concepts:
- employee
- exact standard and version
- process dates
- responsible manager
- verifier
- result
- summary
- recommendations
- verified task/readiness result

## 3. Version invariant

Starting an onboarding process binds it to the selected StandardVersion.

Example:

Magazynier v1.2 → Anna Nowak onboarding

Publishing Magazynier v1.3 later must not silently migrate Anna's process and must not rewrite its historical result.

## 4. Supporting Onboarding 0.x material mapping

The previous PDF/XLSX package contained more material than the new core workflow. The review does **not** treat those files as separate core process stages.

| Previous material | Web 1.0 destination |
| --- | --- |
| Master Control | product/dashboard overview + process status; not a separate business record |
| Instrukcja Managera | contextual guidance attached to Onboarding/product stages |
| Preboarding i Sprzęt | optional preparation task group before/inside process start |
| Karta Stanowiska | absorbed into Standard Stanowiska |
| Plan 30/60/90 | optional schedule/milestones attached to OnboardingProcess |
| Księga Firmy | organization-level reference/resource, not copied into every process |
| Checklista D1/T1 | reusable task/template group attached to a StandardVersion/process |
| Rola Buddy | optional process assignment/responsibility |
| SOP Template | supporting resource linked from a Standard/task |
| Formularz 1:1 Review | optional checkpoint/evidence attached to a process |
| Test Wiedzy | optional verification/evidence attached to task/process/closure |
| Ankieta Ewaluacji | optional post-process evaluation attached after closure |
| welcome emails | communication template/automation, not core record |
| stanowiskowe tests | verification/evidence extension |
| Skill Matrix | future capability extension; not required for Onboarding Core 1.0 |
| Tooling Guide | resource attached to Standard/organization |
| Handover Plan | optional process template/checklist |
| presentation | resource |
| gamification | out of core |
| Weekly Journal | optional process evidence/log |
| Offboarding | separate future process/product, not Onboarding stage |

## 5. Review finding

The current points 5–8 model preserves the essential operational architecture of the former product:

- reusable definition of expected work,
- ordered execution,
- criteria for correct/readied work,
- concrete employee realization,
- control of progress,
- verification,
- immutable historical outcome.

The old package's supporting documents are **not yet implemented in UI/data**. They have now been assigned explicit destinations so they are not lost when the database model is designed.

## 6. Freeze boundary

Before database implementation, the following are frozen as Onboarding Core 1.0:

- Standard
- StandardVersion
- StandardTask
- OnboardingProcess
- OnboardingTaskProgress
- OnboardingClosure

Supporting concepts that the BOS Core schema must leave room for:

- resources/files
- reusable task/template groups
- milestones/checkpoints
- process assignments (manager/buddy)
- evidence/reviews/tests
- process notes/activity
- post-process evaluation

These supporting concepts may be implemented incrementally. They must not force a redesign of the three-stage core.

## 7. Explicit non-goals of the freeze

This freeze does not define:
- authentication,
- organizations/tenant security,
- database technology,
- Stripe licensing,
- permissions,
- file storage provider,
- notification delivery,
- final UI copy,
- legal/compliance rules.

Those belong to later BOS Core/platform points.

## 8. Change rule after freeze

A future change to Onboarding Core should answer one question:

**Does this require changing the Standard → Realization → Verification invariant?**

If no, implement it as supporting data/functionality around the frozen records.

If yes, treat it as a deliberate product-model migration rather than an incidental UI/database change.
