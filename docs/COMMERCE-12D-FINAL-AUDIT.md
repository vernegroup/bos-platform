# COMMERCE-12D — Final Commerce 1 technical audit

Date: 2026-10-02

## Scope
Final technical audit before COMMERCE-13 freeze. No production database or Stripe data mutation.

## PASS
- main starts from COMMERCE-12B commit 835db2e1c3b2d242914267baf797e54bd49e2c08.
- Production canonical URL is centralized through bosAppUrl; no request Origin based checkout URL remains.
- WDROŻENIA and AWANSE checkout routes attach product metadata and authenticated organization/user metadata when available.
- Stripe webhook verifies the Stripe signature before fulfillment.
- Fulfillment accepts paid sessions only and has event-level plus Checkout Session-level idempotency.
- Entitlements are organization-level and derived from ACTIVE licenses; both product trees have independent server-side guards.
- Claim activation updates credentials, user, OWNER membership and token consumption transactionally.
- Resend requires a persisted PAID purchase plus INVITED user/membership and server-verifies the Stripe session.
- BOS_EMAIL_FROM is required; the resend.dev fallback is gone.
- Partial refund no longer revokes a perpetual license; full refund revokes or re-points to another paid purchase.
- COMMERCE-12B contract locks 0 / WDROŻENIA / AWANSE / both license states.
- COMMERCE-12C read-only production audit confirmed the real WDROŻENIA purchase is PAID, its license ACTIVE, user and OWNER membership ACTIVE, and no active claim token remains.

## Blocker fixed in 12D
The historical /api/download endpoint remained routable and could still serve old ZIP products after Stripe-session verification even though the current product model is web-license based. The route is retained only as a 410 Gone compatibility tombstone and no longer reads or returns product ZIP files.

## Non-blocking legacy/debt carried forward
- Historical Pricing checkout/success components remain in the repository but are not part of the canonical sellable catalog and are not linked from the current Product Rail. Pricing must be rebuilt under the current Commerce contract when activated.
- Historical DocumentTable/documents success components remain as unused source; /api/download is disabled, so they cannot deliver ZIPs.
- Commerce 1 license_type is PERPETUAL. COMMERCE-2 will replace/extend this with the agreed annual lifecycle; do not retrofit subscription semantics into the frozen Commerce 1 model.
- Email inbox placement is not guaranteed; sending infrastructure is functional but deliverability/reputation remains a separate release-polish concern.
- Test/live Stripe separation remains required before any further payment testing. Do not perform another live test purchase as a substitute for test-mode E2E.

## Evidence boundary
This audit verifies code contracts, current production state already checked in 12C, and deployment/build status. It does not claim a fresh automated four-account browser E2E.

## Freeze readiness
Commerce 1 is technically ready for COMMERCE-13 freeze after the 12D build/deployment is READY.
