# PROM-02 — Standard parity

**Status:** PASS  
**Scope:** `1_STANDARD` only  
**Reference:** frozen BOS Onboarding commit `66569efba58a8572bbe013d7f6f58a86238b8fa9` (read-only)

## Result

The Promotions Standard uses the same functional contract as the finished Onboarding Standard while retaining Promotions wording for the target role.

### Version
- Standard has an explicit version and effective date.
- Published version is treated as immutable.
- New content means a new Standard version.
- A process must later bind to the exact version selected at process start; no automatic migration is introduced here.

### K
- K keeps the BOS meaning: an error may cause serious consequences.
- K is not a generic "important" flag.
- K requires actual **SAM + SPRAWDŹ**.
- Promotions may not weaken the K rule relative to Onboarding.

### 4×TAK
Readiness criterion quality test remains exactly four checks:
1. observable,
2. verifiable in real work,
3. sufficiently unambiguous for different assessors,
4. covers all K tasks.

Formula contract:
- fewer than four answers → no passed result,
- exactly 4×TAK → `TEST ZALICZONY`,
- otherwise → `KRYTERIUM DO POPRAWY`.

### Standard readiness
`STANDARD GOTOWY` requires all of:
- all six approval controls completed,
- all six = TAK,
- criterion quality test = `TEST ZALICZONY`,
- Standard version present,
- effective date present.

Otherwise:
- `STANDARD WYMAGA UZUPEŁNIENIA`.

## Excel implementation

PROM-02 workbook updates only `1_STANDARD`:
- marks the sheet as PROM-02 development state,
- makes version immutability explicit,
- makes K → SAM + SPRAWDŹ explicit,
- labels the readiness criterion consistently,
- makes the 4×TAK requirement explicit in Standard approval.

The existing formulas for the 4×TAK test and Standard readiness already matched the finished Onboarding engine and were retained.

Known `#REF!` errors in `4_ZAMKNIJ` are outside PROM-02 and intentionally remain for the later Excel recovery task; PROM-02 does not conceal or opportunistically repair unrelated process logic.

## Freeze

The Standard contract above is frozen for Promotions 1.0. Later PROM tasks may consume it but must not weaken versioning, K, 4×TAK or readiness semantics.
