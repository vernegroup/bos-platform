# PROM-03 — Entry Assessment

**Status:** PASS / FROZEN  
**Scope:** Promotions entry assessment before execution  
**Depends on:** PROM-01, PROM-02

## Canonical states

Every populated requirement/task from the target Standard receives exactly one entry-assessment state:

1. **POTWIERDZONE**
   - There is sufficient evidence that the employee already performs the requirement according to the current target Standard.
   - Tenure, reputation, familiarity with the company or "did it before" are not sufficient by themselves.
   - The requirement is not sent to full BOS deployment solely because it exists in the target Standard.
   - K remains subject to the separate K gate finalized in PROM-06; PROM-03 does not waive K requirements.

2. **DO SPRAWDZENIA**
   - The employee plausibly can perform the requirement, but sufficient evidence is missing.
   - This is not a weaker synonym for POTWIERDZONE.
   - This is not the same as DO WDROŻENIA.
   - It must go through a dedicated verification branch.
   - PASS/FAIL behavior is intentionally finalized in PROM-04.

3. **DO WDROŻENIA**
   - The requirement is new or is not performed according to the target Standard.
   - It goes to the BOS execution method: WYJAŚNIJ → POKAŻ → RAZEM → SAM → SPRAWDŹ.

No fourth state is allowed in Promotions 1.0.

## Evidence rule

Assessment is made against a concrete requirement of the current target Standard, not against the employee in general.

For POTWIERDZONE, the manager must have a sufficient factual basis/evidence. If that basis is absent, choose DO SPRAWDZENIA.

Previous BOS history may be evidence/context, but does not automatically assign POTWIERDZONE.

## Excel contract

In `2_ZMIANA`:
- the user selects exactly one of the three canonical states,
- the existing evidence/note field remains the factual basis for the assessment,
- only DO WDROŻENIA is marked directly as requiring full BOS deployment,
- DO SPRAWDZENIA is no longer silently routed into the same full five-stage path,
- the dedicated DO SPRAWDZENIA PASS/FAIL route is added in PROM-04.

This deliberately removes the 0.1 ambiguity where DO SPRAWDZENIA and DO WDROŻENIA were both treated as the same "Do pracy = TAK" path.

## Scope consistency

The hidden transition list is aligned with PROM-01:
- AWANS
- PRZESUNIĘCIE POZIOME

Legacy separate transition types are not part of the active 1.0 contract.

## Freeze

PROM-03 freezes the meaning and exclusivity of the three entry states. PROM-04 may define the verification outcome of DO SPRAWDZENIA, but may not redefine the three states.
