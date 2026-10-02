# COMMERCE-12B — Entitlement matrix regression

Date: 2026-10-02

Scope: four organization license states without production data mutation.

| State | WDROŻENIA rail | WDROŻENIA URL | AWANSE rail | AWANSE URL |
| --- | --- | --- | --- | --- |
| 0 licenses | sales modal | BLOCK | sales modal | BLOCK |
| WDROŻENIA only | DIRECT | ALLOW | sales modal | BLOCK |
| AWANSE only | sales modal | BLOCK | DIRECT | ALLOW |
| both | DIRECT | ALLOW | DIRECT | ALLOW |

Evidence:
- `listProductEntitlements` derives product access from active organization licenses.
- `AppProductRail` renders a direct product link only for `licensed=true`; otherwise it renders the shared sales modal.
- `/app/onboarding/*` and `/app/promotions/*` are protected independently by server-side `requireProductLicense` in their product layouts.
- Direct export routes additionally repeat the corresponding product guard.
- `scripts/check-commerce-entitlements.mjs` locks the 4-state contract without changing production data.

This regression is structural/contract verification plus build verification. It does not claim four separate authenticated browser sessions backed by four production organizations.
