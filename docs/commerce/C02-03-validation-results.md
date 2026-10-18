# C02-03 — wyniki testów Neon (2026-10-09)

Gałąź Neon: commerce-02-capacity-tests-2026-10-09 (`br-cold-breeze-b4bllw0d`), projekt BOS Platform `soft-boat-53453963`.
Źródło: kopia produkcji, utworzona 2026-10-09; produkcji nie modyfikowano.
Gałąź GitHub: `feature/commerce-02-standard-capacity`.

## Wykonane
- Migracja `db/migrations/commerce-02-standard-capacity.sql` wykonała się transakcyjnie bez błędu: PASS.
- Backfill: 7 przypisanych i opublikowanych Standardów; liczba ledger = liczba unikalnych opublikowanych Standardów z product_id: 7/7 PASS.
- Grants BASE: onboarding 2×10, promotions 1×10, razem 30 miejsc dla trzech licencji (NIE jedna wspólna pula): PASS.
- Historyczne rekordy bez product_id: 4, w tym 2 opublikowane; nie zostały automatycznie przypisane: PASS (wymagają decyzji).
- Scenariusze arytmetyczne: 0/10, 9/10, 10/10, 10/20, 20/20: PASS dla warunku `used < capacity` (to nie test wywołania funkcji aplikacji).
- Test advisory lock: uruchomiono dwa zapytania równolegle, lecz drugie uzyskało lock; nie potwierdzono rzeczywistego nakładania się transakcji. Wynik: INCONCLUSIVE, nie PASS.

## Nieprzetestowane
- Wykonanie `consumeStandardCapacity` z kodu Next.js na gałęzi testowej (brak uruchomionego testowego środowiska aplikacji).
- Równoczesne publikacje dwóch różnych Standardów z poziomu aplikacji i dowód braku przekroczenia limitu.
- Testy ponownej publikacji, archiwizacji, limitu przy realnym zapisie, refundów.
- Nowo kupione licencje: obecna migracja tworzy BASE tylko dla już istniejących licencji. Ścieżka przyznawania BASE przy nowym zakupie musi być dodana przed release.
- Standardy bez product_id: nie mogą być opublikowane przez nowy guard; wymagają przypisania.
- Zakupy: w kodzie wciąż istnieje ścieżka ANNUAL, sprzeczna z docelową PERPETUAL.

## Wniosek
Migracja i dane historyczne: PASS.
Silnik C02-03 jako całość: NOT PASS, testy integracyjne i współbieżności pozostają otwarte.
Żadnych zmian na produkcyjnej bazie Neon ani na produkcyjnej gałęzi GitHub.
