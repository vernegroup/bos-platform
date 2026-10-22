# BOS-SAM 1.0 — SAM-01: Versioned architecture map
Date: 2026-10-22
Status: REGISTRY INSTALLED / RUNTIME ENFORCEMENT NOT ENABLED

## Source of truth
`lib/bos/sam/registry.ts` contains declarative metadata. It is **not** an authorization provider, middleware, database or new role system. It cannot grant rights.

## Rules
1. Existing CORE authorization and tenant scoping remain authoritative.
2. Legacy modules are registered as `observe`; no existing policy is replaced.
3. New modules start as `planned` + `enforce`, with no runtime rights.
4. Activation requires explicit lifecycle change to `active`, verification of required controls, and successful registry validation.
5. Registry declarations do not enforce access by themselves. SAM-02 must wire checks into server entry points and CI; do not claim runtime protection before then.
6. The client may not assert organization, roles, licensing, stage completion or permissions.
7. A conflict is a review item. Prefer the new design only when CORE guarantees are preserved and blast radius is proportionate.
8. Legacy license/expired read-export behavior, onboarding retries/status and role-to-process rights remain OPEN from SAM-00.

## Initial module map
- `legacy.identity`: existing access and membership
- `legacy.entitlements`: active license checks
- `legacy.onboarding`: Wdrożenia state and actions
- `legacy.promotions`: Awanse state and actions
- `legacy.stripe-webhook`: Stripe signature boundary
- `ui.product-adapters`: future server read projections
- `ui.process-interpreter`: future presentation logic
- `ui.action-dispatcher`: future explicit allowlist
- `ui.help-context`: future minimized client help context
- `future.ai-assistant`: reserved, inactive

## Acceptance gates for SAM-02
- Run TypeScript build and tests on CI.
- Verify all module dependencies and lifecycle transitions.
- Implement explicit server enforcement for new adapters/actions.
- Prove denial for missing module, unverified control, cross-tenant access and forged client input.
- Do not automatically replace legacy authorization.
- Resolve SAM-00 open policy questions before applying enforcement to legacy paths.

## SAM-01 delivery scope
Additive TypeScript registry and documentation only. No database migrations, no changes to authentication, licensing, product operations, UI routing or Stripe.
