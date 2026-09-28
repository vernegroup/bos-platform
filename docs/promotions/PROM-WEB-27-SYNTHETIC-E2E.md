# PROM-WEB-27 — Synthetic E2E

Status: **PASS**

Environment: Neon test branch `br-old-darkness-b48jekbv` only. Default/main Neon branch was not modified.

## Synthetic A→B matrix

| Employee | Type | A → B | Assessment path | Decision history | Closure | Lifecycle |
|---|---|---|---|---|---|---|
| Tomasz Wójcik | PROMOTION | Pracownik pralni → Starszy pracownik pralni | CONFIRMED + K forced TO_DEPLOY + TO_VERIFY→PASS | READY #1 | READY | CLOSED |
| Ewa Lis | LATERAL_MOVE | Obsługa klienta → Doradca serwisu AGD | TO_DEPLOY including K, full five-stage execution | READY #1 | READY | CLOSED |
| Marta Zielińska | PROMOTION | Brygadzista → Koordynator zleceń | CONFIRMED, no K in target Standard | NOT_YET #1 → READY #2 | READY | CLOSED |

Before final READY, every process reached all seven Final Integrity Gates: STANDARD, PROCESS, ENTRY, DEPLOYMENT, K, READINESS, TRANSITION.

## History integrity

For all three closures:
- closure Employee ID equals process Employee ID;
- employee name snapshot equals process snapshot;
- A and B role snapshots equal the closed process;
- change type snapshot equals the process type;
- READY decision snapshot contains 7/7 passed gates;
- exactly one closure exists per completed process.

The NOT_YET case remained open, retained decision #1, then accepted READY as decision #2 and created one READY closure. Earlier decision history was not rewritten.

Both frozen Web 1.0 change types were exercised: PROMOTION and LATERAL_MOVE.

PROM-WEB-27: PASS.
