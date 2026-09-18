# BOS product updates and versioning

Status: implemented in point 17.

## Contract

- `products.current_version` is the authoritative current platform version for a BOS product.
- `product_updates` is an append-only publication history. One product can publish a given version only once.
- Product updates are global BOS catalogue data, not tenant-owned business records.
- An organization sees update history only for products for which it has an ACTIVE license.
- A PERPETUAL license is not pinned to the version purchased. It continues to expose the current version and later published updates without a new purchase.
- Operational customer records are not rewritten by a product release. In particular, published StandardVersion content and the StandardVersion selected by an existing OnboardingProcess retain their historical meaning.
- Publishing a product update therefore changes BOS product software/content availability, not historical customer evidence.

## Release flow

A BOS release is published centrally by inserting one ProductUpdate and advancing Product.current_version to the same release version in one controlled database operation/migration. Existing licensed organizations then see the release automatically in /app/updates and /app/products.

Point 17 does not add a customer-side update button because web releases are centrally deployed. It also does not fabricate historical release notes for versions that were never recorded.
