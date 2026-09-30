# M11–M12 — BOS two-product integrated checkpoint

Date: 2026-09-30
Code baseline before this checkpoint: `fab7c5a83e0541f54df6ceb7b0c7e9e4d4a4d452`.
Deployment: `dpl_6YfnsWESHbzNr8G81Hg1hXCpK8cd` — production READY on that exact SHA.

## Integration ancestry
- Frozen Promotions: `17df0e578c2b4406eb65d965b35f2e753fd3bc86` (ancestor of integrated main; GitHub compare: main ahead 38, behind 0 at code baseline).
- Archived pre-integration main: `71f4d6fcaeabfc499117d7694bc25c0cef9cab8e` retained separately. Do not mechanically merge its history.
- M8 canonical migration order: `docs/M8-DATABASE-MIGRATION-SEQUENCE.md`, 26 files; clean migration audit PASS on isolated non-production Neon test branch. No production/default Neon migration performed.

## M11 regression work
Post-M9 fixes:
- `33f4bab2` — Onboarding links to Shared Standards.
- `66cfa330` — Onboarding close flow to Shared Standards.
- `90f38439` — historical Standard link via Core, preserving `?version=`.
- `ff8b7f0b` — remove invalid nested link in Promotions process list.
- `fab7c5a8` — backend Onboarding READY gate fails closed when tasks or readiness checks are empty, and counts non-true readiness values as missing.

Verified by current-source inspection: process creation pins a published StandardVersion; Onboarding READY requires formalities and server-side gate; decision snapshots/sequence and reopen events are persisted; Shared Employee operational history includes both domains; Promotions repository exposes seven final gates, entry/deployment/readiness/transition and decision history; Promotions layout and CSV route independently enforce Promotions license; search indexes both products and Shared Standards; Portability schemaVersion 1.1 includes both domains; canonical migration runner lists all 26 files.

Scope: **structural/source regression review + integrated Vercel build READY**. This is not a claim of authenticated interactive browser E2E, nor a live production DB migration or penetration test. Earlier frozen product functional/red-team results remain historical evidence, not a substitute for fresh browser verification.

## Integrated freeze
Core + Onboarding + Promotions + Shared Standards + Employee Core + Search + Portability + Shell: integrated build READY. No further product or visual scope is included in this checkpoint. The commit containing this document is the named **BOS two-product integrated baseline (structural/build freeze)**, conditional on its own Vercel deployment being READY.

Before customer release: explicitly authorize and execute production migration plan, verify runtime tenant/license checks and authenticated cross-product smoke on migrated environment. Do not modify Neon default/main without explicit owner approval.
