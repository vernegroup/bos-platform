# PROM-04 — Verification Branch

**Status:** PASS  
**Scope:** dedicated verification path for `DO SPRAWDZENIA`  
**Input:** PROM-03 Entry Assessment

## Frozen rule

`DO SPRAWDZENIA` is not a synonym for `DO WDROŻENIA`.

It means the employee plausibly performs the target-Standard requirement, but the manager does not yet have sufficient evidence to confirm it.

Canonical branch:

```
DO SPRAWDZENIA
      ↓
   SPRAWDŹ
   ┌──────┴──────┐
 PASS           FAIL
   ↓              ↓
POTWIERDZONE   DO WDROŻENIA
                  ↓
      WYJAŚNIJ → POKAŻ → RAZEM → SAM → SPRAWDŹ
```

## Excel implementation

In `2_ZMIANA`:
- added `Wynik SPRAWDŹ` with controlled values `PASS / FAIL`,
- added calculated `Status po weryfikacji`,
- no result for a `DO SPRAWDZENIA` item produces `OCZEKUJE NA SPRAWDZENIE`,
- PASS produces `POTWIERDZONE`,
- FAIL produces `DO WDROŻENIA`,
- only initial `DO WDROŻENIA` and failed `DO SPRAWDZENIA` receive `Do wdrożenia = TAK`,
- therefore only those items flow into the existing five-stage work sheet,
- summary counters now reflect effective post-verification state rather than only initial assessment.

`POTWIERDZONE` and initial `DO WDROŻENIA` do not require a PASS/FAIL entry.

## Boundary

PROM-04 does not yet implement the special K safety gate. The fact that K cannot be accepted merely by ordinary prior evidence and requires actual SAM + SPRAWDŹ is enforced in PROM-06.

PROM-04 also does not repair known legacy `4_ZAMKNIJ` references; those remain scheduled for Excel Recovery.

## Freeze

The PASS/FAIL transition above is the Promotions 1.0 verification contract. Later tasks may add safety/readiness constraints but may not route FAIL anywhere other than `DO WDROŻENIA` or treat unresolved `DO SPRAWDZENIA` as confirmed.
