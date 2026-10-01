# COMMERCE-02R — Legacy / Reconciliation Audit

Status: PASS WITH RECONCILIATION ITEMS  
Date: 2026-10-01  
Branch: `main`  
Audited HEAD: `43589ff0504ec3b8ef9f5660afd6796de9a7687b`

## 1. Purpose

Audit all known BOS commerce paths after COMMERCE-02 and classify code as ACTIVE, REUSABLE, LEGACY or DEAD/ISOLATE before COMMERCE-03 joins public and authenticated sales UI.

No runtime behavior, database schema, Stripe configuration or production data is changed by COMMERCE-02R.

## 2. Canonical target path

```
Product catalog
 -> shared sales UI
 -> product checkout endpoint
 -> Stripe Checkout
 -> verified webhook
 -> Purchase
 -> organization License / Entitlement
 -> product authorization
```

Identity/authentication and entitlement remain separate per COMMERCE-01.

## 3. Classification

### ACTIVE / CANONICAL

#### `data/products.ts`
Canonical product/commercial presentation catalog after COMMERCE-02.

Contains stable product keys, UI labels, sales copy and product-specific checkout endpoint under `offer`.

Current sellable keys:
- `onboarding` -> WDROŻENIA
- `promotions` -> AWANSE

Pricing is only planned in the canonical catalog.

#### `components/home/ProductRail.tsx`
ACTIVE public Product Rail. Reads canonical `bosProducts` and `plannedBosProducts`.

#### `components/home/ProductDetailsModal.tsx`
ACTIVE public product-details/sales modal. Reads canonical product sales data.

Its CTA is still registration-first (`/register`) at the audited state. COMMERCE-03/04 may change CTA behavior; COMMERCE-02R does not.

#### `app/api/checkout/route.ts`
ACTIVE checkout endpoint for Onboarding/Wdrożenia.

Carries product metadata and, for an authenticated BOS context, organization/user metadata.

#### `app/api/checkout-promotions/route.ts`
ACTIVE checkout endpoint for Promotions/Awanse with equivalent organization-aware metadata behavior.

#### `app/api/stripe/webhook/route.ts`
ACTIVE payment trust boundary.

Verifies Stripe signature and fulfills only supported paid checkout events.

#### `lib/bos/purchaseRepository.ts`
ACTIVE purchase-to-entitlement fulfillment.

Creates/updates Purchase and organization-level License. Contains anonymous/existing-email reconciliation risks documented below.

#### `lib/bos/licenseRepository.ts`
ACTIVE entitlement layer. Runtime product authorization is based on BOS licenses, not direct Stripe lookup.

### REUSABLE BUT REQUIRES RECONCILIATION

#### `components/app-shell/AppProductRail.tsx`
ACTIVE in the authenticated shell but architecturally PRE-COMMERCE-01.

Current issues:
- defines its own local product list instead of using `data/products.ts`;
- hides unlicensed products completely;
- therefore cannot open the shared sales modal for an unlicensed product;
- duplicates stable product keys and labels.

Required reconciliation in COMMERCE-03/06/07:
- consume canonical product catalog;
- keep sellable unlicensed products visible;
- licensed click -> workspace;
- unlicensed click -> shared sales modal;
- planned products remain non-purchasable.

#### `components/ProductStage.tsx`
Older product-sales presentation. It is still type-checked and was the source of COMMERCE-02 build failure after the catalog contract changed.

It now reads `product.offer`, but it should not become a second canonical sales UI. Keep only if an active page still needs the presentation; otherwise retire after dependency verification.

#### `components/ProductStory.tsx`
Uses `ProductStage` and canonical `bosProducts`. This represents an older/alternate landing product presentation and must not independently define Commerce behavior.

### LEGACY — OFFLINE/DOWNLOAD SALES PATH

#### `app/success/onboarding/page.tsx`
#### `app/success/promotions/page.tsx`
#### `app/success/components/DocumentTable.tsx`
#### `app/api/download/route.ts`
#### `lib/verifyCheckout.ts`

These form a legacy paid-session -> downloadable ZIP flow.

Observed behavior:
- success page verifies Stripe Checkout session directly;
- paid session renders a document/download UI;
- `DocumentTable` posts `sessionId` to `/api/download`;
- download endpoint re-verifies the Stripe session and serves product ZIP from `storage/products`.

This is not the target web-entitlement UX.

Important distinction:
`verifyCheckout` is acceptable for displaying payment confirmation, but Stripe session verification on a success page must not become the entitlement source. Web access remains driven by verified webhook -> License.

Disposition:
KEEP TEMPORARILY / REPLACE during COMMERCE-11. Do not connect new shared sales UI more deeply to the ZIP path.

### LEGACY — DUPLICATE SALES COMPONENTS

#### `components/HeroCard.tsx`
Hard-coded Onboarding checkout and legacy English product naming.

#### `components/PromotionCard.tsx`
Hard-coded Promotions checkout and legacy English product naming.

#### `components/PricingCard.tsx`
Hard-coded Pricing checkout.

These bypass the canonical catalog and duplicate checkout routing/copy.

Disposition:
DO NOT REUSE for COMMERCE-03. Verify imports before deletion in a later cleanup phase.

### ISOLATE / DEAD CONFIGURATION

#### `lib/stripe-links.ts`
Contains empty constants for Onboarding, Promotions, Pricing and Merchandising. No code references to the exported constants were found in the audit search.

Disposition:
DEAD/ISOLATE. Do not populate or reuse. Candidate for later deletion.

### OUTSIDE CURRENT COMMERCE SCOPE

#### `app/api/checkout-pricing/route.ts`
A functioning-looking historical Pricing checkout endpoint exists even though Pricing is only planned in the canonical BOS catalog and current entitlement fulfillment accepts only `onboarding` and `promotions`.

It does not follow the current organization-aware Commerce contract and has a success route for Pricing outside the current sellable product scope.

Disposition:
ISOLATE. It must not be surfaced by current UI or shared Commerce. Reconcile only when Pricing becomes an active product.

## 4. Confirmed architectural split

The audit confirms four historical layers currently coexist in the repository:

1. current public Product Rail + Product Details modal;
2. older ProductStory/ProductStage sales presentation;
3. authenticated AppProductRail with a separate hard-coded catalog;
4. legacy paid ZIP success/download flow.

Additionally, old hard-coded Hero/Promotion/Pricing cards and empty Stripe link constants remain.

This coexistence is the principal archival-entanglement risk.

## 5. Risks before COMMERCE-03

### R1 — Duplicate product catalogs — HIGH
`AppProductRail` duplicates product keys/labels instead of consuming `data/products.ts`.

Consequence: public and authenticated product availability can drift.

### R2 — Entitlement UX contradicts COMMERCE-01 — HIGH
Authenticated rail hides unlicensed products. Frozen contract requires them to remain visible and open the sales modal.

### R3 — Multiple sales UI implementations — MEDIUM/HIGH
ProductDetailsModal, ProductStage, HeroCard, PromotionCard and PricingCard can encode different copy/routes/behavior.

### R4 — Legacy ZIP success flow can be mistaken for web entitlement — HIGH
A paid Stripe session is enough to show/download the old package, while web authorization is webhook/license based. These are two different delivery models and must not be conflated.

### R5 — Historical Pricing checkout is outside entitlement contract — HIGH if surfaced
Current fulfillment accepts only Onboarding/Promotions. Pricing checkout must remain unreachable from canonical current Commerce.

### R6 — Anonymous purchase organization resolution — HIGH
`purchaseRepository` can attach a purchase without explicit organization metadata to the first active organization found for buyer email. This is ambiguous for a user belonging to multiple organizations.

Must be resolved before purchase-first is declared complete.

### R7 — Anonymous buyer claim gap — HIGH
Webhook may create a synthetic organization plus INVITED user and ACTIVE OWNER membership. Normal registration rejects an existing email. A dedicated secure claim/activation path is therefore required.

### R8 — Success/webhook race — MEDIUM
Stripe session may report paid before webhook fulfillment has completed. Future success UI must not claim entitlement is active solely because `verifyCheckout` returns paid.

### R9 — Refund lifecycle not wired — MEDIUM/HIGH
Purchase schema supports refund state, but audited webhook handles paid completion only. License revocation/retention policy is not yet implemented.

## 6. Reconciliation rules for next phases

COMMERCE-03 and later must follow these constraints:

1. `data/products.ts` remains the canonical UI/commercial product catalog.
2. Do not introduce another hard-coded product array in public or authenticated UI.
3. One shared product sales modal should serve public and authenticated unlicensed-product contexts.
4. Existing checkout endpoints may remain product-specific for now.
5. Webhook -> Purchase -> License remains the entitlement authority.
6. Do not wire new Commerce UI to ZIP download delivery.
7. Pricing checkout remains isolated until Pricing is formally activated.
8. Do not delete legacy components during feature implementation unless their import graph has been verified.
9. Direct product routes remain protected by server-side license authorization.
10. Resolve anonymous claim and multi-organization ambiguity before purchase-first E2E freeze.

## 7. COMMERCE-02R result

PASS WITH RECONCILIATION ITEMS.

No evidence was found that the frozen Onboarding or Promotions process engines themselves are entangled with the legacy sales UI.

The identified entanglement is concentrated in the Commerce/presentation/delivery perimeter and can be reconciled without redesigning BOS Core.

COMMERCE-03 may proceed provided it starts by reusing the canonical catalog and does not reuse the legacy hard-coded sales components or ZIP delivery path.
