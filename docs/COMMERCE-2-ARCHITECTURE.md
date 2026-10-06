# COMMERCE-2 — Annual Commerce architecture

Status: IMPLEMENTATION CONTRACT
Date: 2026-10-02
Base: COMMERCE-13 frozen Commerce 1

## Model
Product != Offer != Subscription != License != Payment.

- Product: operational BOS module.
- Offer: commercial terms for one product; initial offers are annual flat-rate.
- Subscription: renewable commercial relationship between Organization and Product.
- License: runtime entitlement projection used by BOS authorization.
- Purchase: acquisition/checkout transaction.
- SubscriptionPayment: renewal/payment history after acquisition.

## Annual lifecycle
Checkout uses Stripe Billing subscription mode and payment up front. Successful verified checkout creates/binds Organization, Purchase, Subscription and ANNUAL License. The license is valid only through current_period_end.

Stripe subscription/invoice webhooks synchronize BOS state:
- active/trialing -> ACTIVE subscription; license active through period end.
- cancel_at_period_end -> CANCEL_AT_PERIOD_END but access remains through current period end.
- invoice.payment_failed / past_due -> PAST_DUE; access is not extended beyond the already-paid current period.
- invoice.paid -> payment recorded and license valid_until advanced to the new current period end.
- canceled/deleted or period ended without paid renewal -> license revoked/expired.
- reactivation/new paid subscription -> subscription/license become active again.

No arbitrary grace period is introduced in COMMERCE-2.

## Compatibility
Existing PERPETUAL Commerce 1 licenses are grandfathered and remain valid. They are not silently converted into subscriptions. New Commerce-2 sales create ANNUAL licenses.

## Stripe environments
TEST and LIVE price identifiers are separate configuration. No further LIVE payment is required for implementation testing. Commerce-2 cannot be released until test-mode Checkout + webhook regression passes.

## Deferred business configuration
Price amount and Standard-capacity/add-on rules are not architecture invariants. They may be attached to Offer later without changing Product/Subscription/License.
