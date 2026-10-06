# COMMERCE 2 — SMALL FREEZE — 2026-10-03

## Freeze point
Branch: `feature/commerce-2`
Validated application HEAD before freeze note: `c291b8a5ce2880d246a8cfcc5582c6dfcdc0d96c`
Commit: `Harden Commerce 2 invoice recovery ordering`

No merge to `main`. No PROD changes.

## Validation status
- PF-03 PAYMENT FAILURE — PASS
  - real Stripe TEST `invoice.payment_failed`
  - BOS subscription -> `PAST_DUE`
  - payment row -> `FAILED`
  - annual license remained `ACTIVE`
  - `valid_until` unchanged
- PF-04 RECOVERY — PASS
  - same failed invoice recovered to `PAID`
  - same payment row updated instead of duplicated
  - subscription -> `ACTIVE`
  - license remained `ACTIVE`
- PF-05 REACTIVATION — PASS
  - `ACTIVE -> CANCEL_AT_PERIOD_END -> ACTIVE`
  - real `customer.subscription.updated` events processed
  - license remained `ACTIVE`
  - `valid_until` unchanged

Actual renewal at period boundary and actual expiry remain DEFERRED; they were not simulated as completed production-equivalent tests.

## Hardening
Commit `c291b8a5ce2880d246a8cfcc5582c6dfcdc0d96c`:
- prevents an out-of-order late payment-failure event from downgrading an already `PAID` payment row;
- invoice synchronization respects current Stripe subscription state;
- scheduled end-of-period cancellation remains normalized without revoking paid annual access.

## Vercel
Current hardening deployment:
- deployment `dpl_DWu1NBLYCvG59Rx6CX4ziLGPr9hd`
- SHA `c291b8a5ce2880d246a8cfcc5582c6dfcdc0d96c`
- state: `READY`
- branch: `feature/commerce-2`

Historical ERROR chain immediately before the stable fix:
- `ebcb3c9` — ERROR
- `38c3e4e` — ERROR
- `63e07e5` — ERROR
- `6377e22` — ERROR
All failed at `npm run build` while iterating scheduled-cancellation helper syntax/normalization.
They are superseded by:
- `ff56c87` — READY
- `c291b8a` — READY

Do not repair/revert the historical ERROR commits individually.

## Neon validation state
Validation project: `soft-boat-53453963`
Validation branch: `br-fancy-hat-b4ykh6sz`

AWANSE:
- Stripe subscription: `sub_1UMScq1ETGwirCfzCK4kNX49`
- BOS status: `ACTIVE`
- `cancel_at_period_end=false`
- annual license: `ACTIVE`
- `valid_until=2027-10-03T13:05:14.000Z`
- payment rows: 2 total / 2 PAID / 0 FAILED
- PF invoice `in_1UMYA11ETGwirCfza0kKOcrl`: `PAID`

ONBOARDING:
- Stripe subscription: `sub_1UMRwO1ETGwirCfzPfBdJmfV`
- BOS status: `CANCEL_AT_PERIOD_END`
- `cancel_at_period_end=true`
- annual license: `ACTIVE`
- `valid_until=2027-10-03T12:21:22.000Z`
- payment rows: 1 total / 1 PAID / 0 FAILED

## Resume point
Next session:
1. read this freeze note;
2. confirm branch HEAD and latest Vercel deployment are green;
3. perform final current-HEAD build/runtime regression check;
4. if clean, close Commerce 2 validation;
5. proceed to final BOS/main preparation and merge only after explicit final review.

Do not reopen PF-03/PF-04/PF-05 unless a later change touches Stripe webhook/subscription/license logic.
