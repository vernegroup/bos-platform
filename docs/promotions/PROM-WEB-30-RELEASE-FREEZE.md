# PROM-WEB-30 — Promotions Web 1.0 Release Freeze

Date: 2026-09-30
Branch: `promotions-1-0`

## Status

**PASS — RELEASE FREEZE**

Promotions Web 1.0 is functionally frozen after the final functional audit.

## Frozen functional contract

The release preserves the accepted Promotions Web 1.0 model:

- controlled role transition `ROLE A -> ROLE B`;
- exactly two change types: `PROMOTION` and `LATERAL_MOVE`;
- target role bound to an exact published organization StandardVersion;
- Entry Assessment: CONFIRMED / TO_VERIFY / TO_DEPLOY;
- TO_VERIFY resolved through verification PASS/FAIL;
- TO_DEPLOY uses WYJAŚNIJ -> POKAŻ -> RAZEM -> SAM -> SPRAWDŹ;
- K is a hard gate and requires actual deployment;
- readiness and structured handover A -> B are required gates;
- Final Integrity Gate contains seven gates: STANDARD, PROCESS, ENTRY, DEPLOYMENT, K, READINESS, TRANSITION;
- final decisions: READY / NOT_YET / STOP;
- READY and STOP closure semantics remain append-only;
- historical process meaning and exact StandardVersion remain stable;
- Shared Standards are organization resources usable by Onboarding and Promotions;
- tenant and product-license boundaries remain fail-closed in the hardened paths.

## Final verification state

Before this freeze:

- synthetic E2E: PASS;
- red-team: PASS, BLOCKER 0 / MAJOR 0;
- regression audit: PASS;
- Desktop happy-path and surgical defect retests: PASS;
- security review completed;
- SEC-FIX-01 direct Promotions export license guards present;
- SEC-FIX-02 / SEC-FIX-02B historical StandardVersion rendering verified by Desktop: PASS;
- final read-only functional audit: PASS, BLOCKER 0 / MAJOR 0.

Test database integrity at final audit:

- orphan Promotions process tasks: 0;
- orphan assessments: 0;
- orphan readiness checks: 0;
- orphan transition items: 0;
- invalid closure-to-decision bindings: 0;
- invalid Standard-to-StandardVersion bindings: 0;
- READY closures with incomplete seven-gate decision snapshot: 0;
- assessment changes after closure: 0.

Two known legacy Promotions processes without current Web 1.0 Standard/StandardVersion binding remain historical data and are intentionally not rewritten.

## Freeze rule

From this commit forward, Promotions Web 1.0 domain behavior is frozen.

Before integration with `main`, perform a read-only `main <-> promotions-1-0` reconciliation audit. Do not mechanically merge the branches.

Allowed before reconciliation/integration:

- release documentation;
- diagnostics that do not mutate production data;
- fixes for confirmed blockers or regressions.

Shared UI polish for Onboarding + Promotions is intentionally deferred until after controlled integration with `main`. UI polish must not change the frozen Promotions domain contract, gates, actions, data semantics, or historical meaning.

Production/default Neon is not part of this Promotions test freeze and must not receive Promotions migrations merely as a consequence of this commit.
