# BOS Homepage — baseline before application work

Status: frozen baseline for the public sales homepage.

## Scope kept stable

The homepage remains:

1. TopBar
2. ProductStory
   - BOS Onboarding
   - BOS Promotions
   - native desktop sticky scroll
   - normal mobile document flow
3. FeatureCards information strip
4. BottomBar
5. BOSSupport

## Product catalogue

The shared catalogue remains in `data/products.ts`.

Current public products:
- `onboarding`
- `promotions`

Each product keeps its existing media, copy and checkout endpoint.

## Checkout boundary

The homepage only starts checkout through the endpoint defined in the product model.

Current endpoints:
- BOS Onboarding: `/api/checkout`
- BOS Promotions: `/api/checkout-promotions`

Application/dashboard work must not move licensing, authentication or account logic into `ProductStage`.

## Visual layers

The current homepage loads these style layers in order:

1. `styles.css`
2. `product-stage.css`
3. `product-flow.css`
4. `navigation.css`
5. `footer.css`
6. `mobile.css`
7. `product-alignment.css`

Do not reorganize these files during the first application-shell iterations unless a concrete regression requires it.

## Responsive contract

Desktop:
- one sticky ProductStory scene
- Onboarding transitions to Promotions
- the sticky scene releases into the information strip and footer

Mobile (<= 800px):
- no sticky storytelling
- Onboarding and Promotions render sequentially
- information strip and footer remain in normal document flow

## Freeze rule

During the initial `/app` prototype:
- do not redesign the public homepage,
- do not change Stripe endpoints,
- do not delete legacy components,
- do not change product copy or media as a side effect of application work.

Public-site changes should be deliberate tasks, separate from BOS application development.

<!-- Production build trigger: BOS Web 1.0 hardening verification. No runtime behavior change. -->
