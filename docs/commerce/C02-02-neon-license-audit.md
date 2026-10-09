# COMMERCE-02 / C02-02 — Audyt licencji i schematu Neon

Data: 2026-10-09
Status: AUDYT ODCZYTOWY WYKONANY / PROJEKT MIGRACJI DO C02-03
Źródła: repozytorium GitHub main, Neon BOS Platform / production (wyłącznie SELECT), Stripe LIVE zweryfikowany wcześniej.
Nie wykonano migracji, UPDATE, INSERT ani DELETE w Neon.

## 1. Wyniki produkcyjnej inwentaryzacji (stan w chwili odczytu)

- Projekt Neon: soft-boat-53453963; gałąź production: br-delicate-wind-b4mawn4c.
- Istniejąca gałąź backup: backup-bos-ui-2-1-stable-2026-10-09 (br-dawn-cake-b44hgd21); snapshot nie jest bieżącą kopią wszystkich zmian po jego utworzeniu.
- Licencje: onboarding PERPETUAL ACTIVE = 2; promotions PERPETUAL ACTIVE = 1. Wszystkie 3 bez valid_until.
- Oferty DB: onboarding-annual, promotions-annual; obie ACTIVE, billing_interval=YEAR. Nazwy i schemat nie odpowiadają przyjętej polityce bezterminowej.
- Standardy: 13 łącznie; 9 ACTIVE, 4 DRAFT.
  - Przypisane do onboarding: 7 ACTIVE (wszystkie z wersją PUBLISHED), 2 DRAFT.
  - Bez product_id: 2 ACTIVE (obie opublikowane), 2 DRAFT.
  - Brak Standardów przypisanych do promotions w bieżących danych.
- Obecne liczniki **nie mogą** zostać wyprowadzone wyłącznie z ACTIVE ani z liczby wersji: archiwizacja nie zwalnia miejsca, a wiele wersji jednego Standardu to jedno miejsce.
- Nie pobierano danych osobowych ani nazw organizacji.

## 2. Schemat i integralność

- standards: id, organization_id, product_id NULLABLE (FK products), status, current_version_id, created_by_user_id. Brak trwałego znacznika „pierwsza publikacja zużyła miejsce”.
- standard_versions: standard_id, organization_id, status, published_at; UNIQUE(standard_id,version_number).
- licenses: UNIQUE(organization_id,product_id), license_type domyślnie PERPETUAL, valid_until nullable.
- purchases: UNIQUE(stripe_checkout_session_id), offer_id FK commerce_offers.
- onboarding_processes / promotion_processes: osobne tabele procesów; obie przechowują standard_id i standard_version_id.
- stripe_events: istnieje mechanizm deduplikacji zdarzeń, lecz dodatek wymaga odrębnej sesyjnej idempotencji i powiązania z produktem/organizacją.

## 3. Wykryta niespójność handlowa / kodowa

- `lib/bos/commerceCatalog.ts`: annualOffer używa STRIPE_PRICE_ID_ANNUAL_ONBOARDING / _PROMOTIONS.
- `lib/bos/annualCheckout.ts`: mode=payment (jednorazowy Checkout), ale wywołuje annualOffer.
- `lib/bos/purchaseRepository.ts`: przy opłaceniu checkout tworzy lub wydłuża licencję ANNUAL o rok; gdy istnieje PERPETUAL, kod nie przekształca jej, lecz później wymaga ANNUAL i może zgłosić błąd.
- `lib/bos/licenseRepository.ts`: akceptuje zarówno PERPETUAL, jak i ważne ANNUAL.
- `app/api/stripe/webhook/route.ts`: nadal obsługuje zdarzenia subskrypcyjne oraz roczny fulfillment.
- Stripe LIVE: jednorazowe ceny główne 990 i 690 PLN, ale istnieją także aktywne historyczne ceny roczne; produkt dodatku +10 ma cenę 49 PLN jednorazowo.
- Nie zmieniać aktywnych ofert/cen ani istniejących licencji bez odrębnego, przetestowanego planu kompatybilności.

## 4. Projekt migracji (TYLKO PLAN, NIE URUCHAMIAĆ)

A. Zdefiniować ledger zużycia `standard_capacity_consumptions` z unikalnością `standard_id` i trwałą informacją (organization_id, product_id, first_published_at); nie usuwać rekordu po archiwizacji. Ustalić zachowanie przy fizycznym usunięciu Standardu (FK RESTRICT lub snapshot ID bez FK).
B. Zdefiniować `standard_capacity_grants`: organization_id, product_id, quantity=10, source='BASE'/'STRIPE', stripe_checkout_session_id (UNIQUE dla płatnych grantów), status oraz timestamp. Nie nadawać BASE organizacjom bez właściwej licencji.
C. Backfill wyłącznie po przeglądzie rekordów `standards.product_id IS NULL`: 2 opublikowane + 2 robocze; nie przypisywać automatycznie do onboarding ani promotions.
D. Zasilić ledger dla wszystkich kiedykolwiek opublikowanych Standardów, w tym ARCHIVED, na podstawie historii wersji; zweryfikować zgodność sum przed i po migracji.
E. Gdy historyczne wykorzystanie przekracza bazowe 10, zastosować grandfathering (zachowanie istniejącego dorobku, brak wymuszania zakupu za przeszłość). Szczegóły dodatkowych grantów wymagają akceptacji.
F. Wymusić produkt przy nowych Standardach i autoryzację licencji w API; publikację zabezpieczyć transakcją i blokadą dla pary (organization_id,product_id).
G. Oddzielić zakup główny od dodatku; webhook dodatku ma sprawdzać produkt, organizację, status płatności i session ID, po czym atomowo przyznać +10 tylko raz.
H. Poprawić tworzenie nowej licencji PERPETUAL i migrację ofert annual dopiero po regresji ścieżki checkout, istniejących klientów i webhooków. Nie zmieniać istniejących subskrypcji automatycznie.
I. Migracje wykonać najpierw na świeżej izolowanej gałęzi testowej Neon, po backupie i testach; na production dopiero po akceptacji release.

## 5. Bramy C02-03 / testy wymagane

- Rekordy z NULL product_id rozstrzygnięte na podstawie faktycznej historii i uprawnień; żadnego zgadywania.
- 10+10 niezależnych miejsc dla organizacji z obiema licencjami; nie współdzielić grantów.
- Wersja DRAFT nie zużywa miejsca, pierwsza publikacja +1, kolejne wersje +0, archiwizacja +0 zwolnionych.
- Limit 10/10 blokuje tylko pierwszą publikację nowego Standardu, nie pracę z już istniejącymi.
- Współbieżne publikacje i ponowione webhooki nie przekraczają limitu.
- Refund i cofnięcie grantu bez utraty już zapisanych Standardów; polityka wymaga decyzji.
- Nie uruchamiać release z nowymi zakupami ANNUAL sprzecznymi z polityką PERPETUAL.

## 6. Wynik

C02-02: AUDYT PASS; MIGRACJA NIE WYKONANA.
Blokery implementacyjne do C02-03: 4 Standardy bez produktu, roczna ścieżka zakupu, definicja grandfathering i refundów.
