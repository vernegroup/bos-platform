# UI5-02 — CSS selector inventory and safe-cleanup gate

Date: 2026-10-09. Source: `main`. Scope: read-only inspection of existing CSS; no runtime behavior changes.

## Verified entry points
- `app/layout.tsx` imports `app/globals.css`.
- `app/app/layout.tsx` imports `app/app/app-shell.css`, `app/app/product-modal.css`, `app/public-products.css`, and renders `AppShell`.
- The HELP-03 shortcut has a base floating style in `app-shell.css` and a desktop-only override near the end of the file. **Both are live**; do not delete either.

## Inventory (approximate textual counts, not AST-validated)
| File | Lines | !important occurrences | @media occurrences |
|---|---:|---:|---:|
| app/app/app-shell.css | 4383 | 418 | 107 |
| app/globals.css | 349 | 3 | 1 |
| app/styles.css | 2423 | 0 | 28 |
| app/navigation.css | 349 | 0 | 18 |
| app/mobile.css | 70 | 0 | 4 |
| app/login/login.css | 70 | 0 | 2 |
| app/public-products.css | 189 | 0 | 6 |

## High-frequency selector candidates (do not delete without usage/cascade validation)
- `.bos-app-workspace`: 23 textual selector occurrences.
- `.bos-app-search`: 11 occurrences.
- `.bos-app-sidebar`: 9 occurrences.
- `.bos-app-topbar`: 9 occurrences.
- `.bos-promotion-gate-strip`: 6 occurrences, including 7-column and responsive configurations.
- `.bos-app-chat-fab`: intentional base style + responsive overrides.

## Findings and safeguards
1. Identical declaration bodies can recur in **different media query scopes**, so simple textual deduplication is unsafe.
2. The existing scroll fix and AppShell layout are sensitive to overflow, width, and breakpoint rules. Preserve them unless verified with browser computed styles.
3. No CSS declaration repeated verbatim *within the same simple rule block* was found by the initial scan.
4. The inventory is **not** proof of dead selectors. No deletions are authorized from this evidence alone.

## Before deleting or merging any rule
- Record source file, exact line/rule, media/supports/layer context, specificity and source order.
- Search for selector usage across TSX/JSX/HTML, including conditional class names and dynamic class composition.
- Compare computed styles on desktop (>=1440px), intermediate (901–1439px), tablet (<=900px) and mobile (<=520px).
- Exercise dashboard, onboarding standards/process/history, promotions list/process, HELP open/closed, forms and modal states.
- Only remove a rule when equivalent computed behavior is demonstrated in all affected states.
- Run build/type checks and visual regression before merging.

## UI5-02 status
**Inventory baseline completed; CSS deletion/consolidation pending browser-backed usage and cascade verification.** No speculative removal was made. Do not mark full UI5-02 PASS until those checks are completed.
