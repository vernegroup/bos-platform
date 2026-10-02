# COMMERCE-13 — Commerce 1 Freeze

Status: **FROZEN**  
Date: 2026-10-02  
Branch: `main`

## 1. Frozen application baseline

The Commerce 1 application baseline is frozen at:

- Git commit: `174bb7f14e84f1de78d0db7c47263555cde1382a`
- Commit: `COMMERCE-12D close legacy download path and audit Commerce 1`
- Production deployment: `dpl_i4BWs5AoMYfKF8AxeNQW1q8W1qCA`
- Deployment state at freeze: **READY**
- Canonical production URL: `https://www.standardybiznesu.pl`
- Apex `https://standardybiznesu.pl` remains attached to the production project.

This freeze document is committed after the frozen application baseline. The documentation commit itself does not redefine the frozen functional baseline.

## 2. Commerce 1 scope frozen

Commerce 1 establishes the BOS commercial/access chain:

```
PUBLIC
  -> COMMERCE
  -> ACCESS
  -> PRODUCT
```

and the authorization chain:

```
User
  -> active Membership
  -> Organization
  -> active License
  -> Product
```

Frozen current sellable product keys:
- `onboarding` -> **WDROŻENIA**
- `promotions` -> **AWANSE**

Internal keys remain technical identifiers and are not renamed to UI labels.

## 3. Frozen invariants

1. `ACCOUNT != LICENSE`.
2. Registration without purchase is valid.
3. An Organization with zero licenses is a valid BOS state.
4. Membership and product entitlement are separate.
5. Product entitlement belongs to the Organization.
6. Runtime product authorization is based on BOS database license state, not a Stripe lookup on login.
7. Stripe checkout redirect/session possession does not itself grant product access.
8. A server-verified paid Stripe session/event drives Purchase and License state.
9. Logged-in purchase binds to the current Organization.
10. Anonymous purchase uses secure email claim/activation rather than an emailed random password.
11. Licensed Product Rail item opens the product.
12. Unlicensed Product Rail item opens the shared sales popup.
13. Direct product URLs remain protected server-side.
14. Commerce supports 0, 1 and multiple product licenses without redesigning Account/Membership.
15. The historical offline ZIP delivery endpoint is disabled and returns 410.

## 4. Completed Commerce 1 verification

### COMMERCE-12
Hardening completed for:
- Checkout Session-level fulfillment idempotency in addition to Stripe event idempotency.
- recovery/webhook duplicate protection;
- transactional claim activation/token consumption;
- safe claim resend behavior;
- partial versus full refund handling.

### COMMERCE-12B
Entitlement contract verified for all four states:
- 0 licenses;
- WDROŻENIA only;
- AWANSE only;
- both products.

For each state the expected Product Rail behavior and direct URL ALLOW/BLOCK contract is locked by `test:commerce-entitlements`.

### COMMERCE-12C
Read-only verification of the real post-purchase production account confirmed:
- Purchase PAID;
- WDROŻENIA License ACTIVE;
- buyer User ACTIVE;
- OWNER Membership ACTIVE;
- claim lifecycle completed;
- no active claim token;
- entitlement state WDROŻENIA=true / AWANSE=false.

### COMMERCE-12D
Final technical audit completed. The remaining routable legacy ZIP download path was closed. Production build/deployment reached READY.

## 5. Production/infrastructure state at freeze

- Application: Vercel production.
- Database: Neon production branch `br-delicate-wind-b4mawn4c`.
- Payments: Stripe integration active.
- Transactional email: Resend integration functional with verified BOS sender domain.
- DNS authority remains at nazwa.pl.
- Production application canonical URL is centralized through `bosAppUrl()`.

No production DB mutation is part of COMMERCE-13.

## 6. Evidence boundary

Commerce 1 has:
- a real manually completed payment -> fulfillment -> email -> claim -> login -> licensed HOME path;
- read-only confirmation of the resulting persisted production state;
- structural/contract regression for the four entitlement states;
- successful production builds.

The freeze does **not** claim four independent authenticated browser E2E organizations. That distinction remains explicit.

## 7. Known non-blocking debt / exclusions

The following are intentionally not folded back into Commerce 1:

- Commerce 1 license type is `PERPETUAL`; annual lifecycle belongs to COMMERCE-2.
- Stripe TEST/LIVE separation must be completed before further payment testing. Do not use another live payment as a substitute for test-mode E2E.
- Historical Pricing checkout/success source remains outside the current sellable product contract. Pricing must use the current Commerce architecture when activated.
- Historical unused document/download components may remain in source, but `/api/download` cannot deliver ZIP products.
- Email infrastructure sends successfully; inbox placement/spam reputation remains a separate deliverability concern.
- UI/polish and landing video work are not Commerce 1 architecture.

## 8. Change control after freeze

The baseline `174bb7f14e84f1de78d0db7c47263555cde1382a` is the rollback/reference point for Commerce 1.

After this freeze:
- no feature expansion is to be backported into Commerce 1;
- production defects may be fixed as explicit post-freeze hotfixes;
- commercial model changes start under **COMMERCE-2**;
- COMMERCE-2 must preserve Account / Membership / Organization / Product separation unless an explicit architecture decision supersedes an invariant.

## 9. Next phase

**COMMERCE-2** starts from the frozen Commerce 1 architecture and defines the target recurring commercial lifecycle before implementation.

Its design phase must settle at minimum:
- annual license/subscription lifecycle;
- Offer / Price / Plan representation;
- start/end/current period semantics;
- renewal;
- cancellation;
- failed payment;
- expiry;
- reactivation;
- Stripe TEST/LIVE separation;
- migration/compatibility of existing PERPETUAL Commerce 1 licenses;
- any Standard-capacity/add-on model only after its business rule is explicitly frozen.

Commerce 1 is closed at this point.
