# COMMERCE-01 — Domain Contract Freeze

Status: FROZEN  
Date: 2026-10-01  
Branch: `main`  
Base HEAD: `b26a400b1b0a140a426592957adf6d5212c43e96`

## 1. Purpose

This document freezes the Commerce domain contract before implementation work starts.

Commerce wraps the existing BOS Core and product engines. It must not redefine product lifecycle, onboarding/promotions process logic, organization membership, or product-internal authorization.

Primary rule:

```
ACCOUNT != LICENSE
```

A valid BOS account and organization do not imply ownership of any product.

## 2. Domain boundaries

### Account / User
Represents identity and authentication.

A user may exist and authenticate without purchasing any BOS product.

### Organization
Represents the BOS customer/workspace boundary.

An organization may exist with zero active product licenses.

Valid cardinality:

```
Organization -> 0..N active product entitlements
```

Zero licenses is a normal business state, not an access error.

### Membership
Connects a user to an organization and defines the user's organizational role/access.

Membership answers:

> Can this user act inside this organization?

It does not answer:

> Has this organization purchased this product?

### Product
Represents a BOS operational module/capability.

Current public products:
- internal key `onboarding` -> display label **WDROŻENIA**
- internal key `promotions` -> display label **AWANSE**

Internal stable keys must not be renamed merely to match marketing labels.

Product lifecycle and process logic remain outside Commerce.

### Offer / Price / Plan
Represents the commercial terms under which a Product can be purchased.

Product and commercial offer are separate concepts:

```
Product != Offer/Price/Plan
```

COMMERCE-01 does not require a new database table. The persistence/configuration shape will be chosen in COMMERCE-02 after auditing the minimum required implementation.

### Purchase
Represents a commercial transaction.

A successful purchase is not itself authorization to a product. It is the commercial source from which an entitlement may be granted.

### Entitlement / License
Represents an organization's right to use a Product.

Current implementation uses organization-level product licenses.

Authorization rule:

```
User
  -> active Membership
  -> Organization
  -> active License / Entitlement
  -> Product
```

## 3. Authentication vs entitlement

Authentication and product entitlement remain separate checks.

Authentication answers:
- who is the user?
- which organization may the user access?

Entitlement answers:
- which BOS products may that organization use?

There is no Stripe API lookup required on every login.

The BOS database is the runtime source for current product entitlement. Verified Stripe webhook events are the source of payment events that create/update commercial state and entitlement.

## 4. Organization with zero licenses

An authenticated user with a valid organization and zero product licenses must be allowed to enter the BOS application shell.

The following remain available independently of product ownership where applicable:
- HOME
- account/organization context
- settings
- help
- product catalog / Product Rail
- general BOS navigation not belonging to a licensed product

A zero-license organization must not be redirected globally to `/no-access` or treated as an invalid organization solely because it owns no product.

## 5. Product access behavior

For every visible product, UI behavior depends on the organization's entitlement.

### Licensed product
Clicking the product opens its workspace.

### Unlicensed product
Clicking the product from Product Rail/catalog opens the shared sales Product Details popup.

The popup exposes the product proposition and CTA **KUP**.

The same sales popup/component is to be reused on:
- public landing Product Rail,
- authenticated BOS Product Rail/catalog when the organization lacks the product license.

This reuse is a Commerce requirement to preserve one sales path and avoid duplicate product-sales UI.

### Direct URL protection
The popup is sales UX, not authorization.

Direct navigation to a protected product URL without an active entitlement must remain blocked server-side by the existing product-license guard (currently `requireProductLicense` or its future equivalent).

## 6. Public entry paths

Two independent acquisition paths are required.

### Registration-first
```
Landing
 -> ZAREJESTRUJ SIĘ
 -> Account + Organization
 -> BOS shell (0..N licenses)
 -> Product
 -> sales popup if unlicensed
 -> KUP
 -> Stripe
 -> verified webhook
 -> entitlement
 -> Product
```

Registration must not require buying a product.

### Purchase-first
```
Landing
 -> Product popup / KUP
 -> Stripe
 -> verified webhook
 -> Purchase
 -> entitlement
 -> secure account activation/claim or login
 -> Organization
 -> Product
```

A buyer who is already authenticated should retain the existing organization context during checkout.

An anonymous buyer must not be forced through ordinary registration in a way that duplicates an already-created purchase identity or organization.

## 7. Landing contract

The public landing keeps its sales role.

Required actions:
- **KUP** — direct sales entry; product selection when necessary,
- **Zaloguj się** — authentication,
- **Zarejestruj się** — free account/organization creation without product purchase.

Existing product popups remain part of the sales path and their purchase CTA becomes **KUP**.

## 8. Checkout and payment trust boundary

Checkout success redirect is UX only.

`success_url` and possession of `session_id` must never be treated as proof that BOS access should be granted.

Entitlement creation/update must follow a server-verified payment event.

Target trust chain:

```
Stripe payment
 -> verified webhook
 -> Purchase state
 -> Entitlement/License state
 -> BOS authorization
```

## 9. Existing-user and anonymous-buyer rules

### Logged-in buyer
Checkout must bind the transaction to the authenticated organization. After verified payment, entitlement is granted to that organization.

### Existing email, not logged in
Commerce must not silently choose an arbitrary organization if the identity belongs to multiple organizations. A secure login/claim/organization-resolution path is required.

### New anonymous buyer
Purchase-first may provision pending technical state, but final account ownership must be established through a secure activation/claim flow proving control of the buyer email.

No random password is to be emailed.

## 10. Multi-product scalability

Commerce must work without architectural redesign as BOS grows beyond the current two products.

The model must support:
- one organization with no products,
- one organization with one product,
- one organization with multiple products,
- products added later without changing the Account/Membership/Entitlement relationship.

The Product Rail/catalog is therefore both:
- navigation for owned products,
- sales discovery for unowned products.

## 11. Non-goals of COMMERCE-01

This phase does not:
- modify Neon schema or production data,
- create Offer/Plan tables,
- change Stripe prices,
- change webhook configuration,
- implement activation/claim,
- implement refund policy,
- modify product process engines,
- rename internal product keys,
- declare Commerce E2E complete.

Those belong to subsequent Commerce phases.

## 12. Frozen invariants

The following are frozen for subsequent implementation:

1. `ACCOUNT != LICENSE`.
2. Registration is available without purchase.
3. Organization with zero licenses is valid.
4. Product entitlement belongs to Organization.
5. Membership and product entitlement remain separate.
6. Product and Offer/Price/Plan remain separate concepts.
7. Landing retains direct **KUP** product sales.
8. Product Rail inside BOS remains visible for unlicensed products.
9. Unlicensed Product Rail click opens the shared sales popup.
10. Licensed Product Rail click opens the product.
11. Direct protected URLs remain server-authorized.
12. Stripe redirect never grants access.
13. Verified payment event drives purchase/entitlement state.
14. Purchase-first and registration-first are both supported.
15. Commerce must scale to additional BOS products without redesigning Core.

## 13. Next phase

COMMERCE-02 will define and implement the shared product commercial catalog/configuration used by landing, authenticated Product Rail, sales popup and checkout routing, while preserving the frozen rules above.
