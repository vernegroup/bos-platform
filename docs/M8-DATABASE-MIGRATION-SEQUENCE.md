# M8 — Canonical database migration sequence

This file is the migration-order contract for the integrated BOS baseline.

The authoritative executable order lives in `scripts/migrate.mjs` as `MIGRATION_ORDER`.
Do not infer order from lexical filename sorting: the historical repository contains two 013 and two 014 migrations from parallel Onboarding and Promotions development.

Order:
1. 001_bos_core.sql
2. 002_auth_identity_and_tenant_constraints.sql
3. 003_product_licenses.sql
4. 004_stripe_purchases.sql
5. 005_promotions.sql
6. 007_onboarding_web_v1.sql
7. 009_onboarding_standard_publisher.sql
8. 010_onboarding_failsafe.sql
9. 011_onboarding_task_stage_order_guard.sql
10. 012_employee_core.sql
11. 013_onboarding_decision_history_snapshot.sql
12. 013_promotions_employee_core.sql
13. 014_standard_role_description.sql
14. 014_promotions_standard_binding.sql
15. 015_promotions_entry_assessment.sql
16. 016_promotions_verification_branch.sql
17. 017_promotions_five_stage_engine.sql
18. 018_promotions_k_gate.sql
19. 019_promotions_evidence_layer.sql
20. 020_promotions_transition_handover.sql
21. 021_promotions_readiness.sql
22. 022_promotions_final_integrity_gate.sql
23. 023_promotions_decision_model.sql
24. 024_promotions_append_only_closure.sql
25. 025_promotions_security_integrity.sql
26. 026_shared_organization_standards.sql

Historical filename gaps (006 and 008) are not migrations in the integrated repository and must not be filled with invented placeholders.

The ledger key is the full migration filename/name, not the numeric prefix. Therefore the parallel 013 and 014 migrations remain distinct and auditable.

M8 does not apply migrations to the production/default Neon branch. Production promotion remains a separate explicit operation.
