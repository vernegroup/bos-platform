# FIX-01 — Landing Reconciliation

Date: 2026-09-30
Approved HOME source: `71f4d6fcaeabfc499117d7694bc25c0cef9cab8e`.
Integrated restore baseline: `3c7b8225f31d786212400439a6cee626818a367f`.

## Verification
Blob SHA equality PASS for ten files: `app/page.tsx`, `app/public-scene.css`, `app/public-hero.css`, `app/public-products.css`, `components/home/PublicScene.tsx`, `components/home/PublicHero.tsx`, `components/home/ProductRail.tsx`, `components/TopBar.tsx`, `app/navigation.css`, `app/footer.css`.

Verified in integrated tree: `public/images/HOME 2 MOBILE.png`, `public/images/HOME 2.jpg`, `public/images/home.jpg`, plus scene/hero/rail components and CSS exist.

Vercel deployment `dpl_6MDUUgjzCrW6Neardz1wCm3NQTQK` for restore SHA: READY.

Result: FIX-01 PASS for source parity, assets presence and integrated build. No code correction necessary. Authenticated/browser visual rendering, actual scroll behavior, mobile viewport and loading performance are **not** asserted PASS; continue these checks in FIX-02 and FIX-03. No product engine, migration or Neon change.
