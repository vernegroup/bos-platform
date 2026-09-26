# PROM-05 — Deployment Path

**Status:** PASS  
**Module:** BOS Promotions 1.0  
**Input:** PROM-04 Verification Branch

## Frozen rule

Only an effective status **DO WDROŻENIA** enters the full BOS deployment path.

This includes:
- initial `DO WDROŻENIA`,
- `DO SPRAWDZENIA → FAIL → DO WDROŻENIA`.

It excludes:
- `POTWIERDZONE`,
- `DO SPRAWDZENIA` awaiting verification,
- `DO SPRAWDZENIA → PASS → POTWIERDZONE`.

## Required path

`DO WDROŻENIA → WYJAŚNIJ → POKAŻ → RAZEM → SAM → SPRAWDŹ`

Meaning:
- **WYJAŚNIJ** — explain the task and correct execution according to the target Standard.
- **POKAŻ** — demonstrate correct execution.
- **RAZEM** — perform with the employee.
- **SAM** — employee performs independently; record the actual date.
- **SPRAWDŹ** — verify independent execution against the target Standard; record the actual date.

A task is complete only after **SAM + SPRAWDŹ**.

## Excel implementation

`3_KARTA_POSTEPU` now:
- pulls only rows whose effective post-PROM-04 status is `DO WDROŻENIA`,
- provides controlled TAK/NIE completion for WYJAŚNIJ / POKAŻ / RAZEM,
- preserves SAM and SPRAWDŹ as factual dates,
- calculates a live path state:
  - `W TOKU`,
  - `OCZEKUJE NA SAM`,
  - `OCZEKUJE NA SPRAWDŹ`,
  - `ZAKOŃCZONE`,
- calculates progress only for tasks actually requiring deployment.

## Boundary

PROM-05 does not define the special K bypass prevention. K remains visible and its hard gate is finalized in PROM-06.

PROM-05 also does not repair historical `4_ZAMKNIJ` references; those remain assigned to PROM-10.
