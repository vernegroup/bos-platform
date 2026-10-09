# BOS — C02-03 + LIB-01: wspólny strumień implementacji

Data: 2026-10-09
Status: PLAN ZINTEGROWANY / NIE WDROŻONO BIBLIOTEKI
Gałąź: feature/commerce-02-standard-capacity

## Decyzja produktowa
Rozwijamy jednocześnie dwa powiązane feature'y: (1) oddzielne pule opublikowanych Standardów dla Wdrożeń i Awansów, (2) centralną bibliotekę gotowych wzorów stanowisk/zawodów. Nie tworzymy osobnego produktu ani osobnej opłaty za katalog.

## Kontrakt wzór vs Standard
- Wzór katalogowy jest zarządzany przez BOS i NIE jest rekordem Standardu klienta; jego przeglądanie i podgląd nie konsumuje puli.
- Skopiowanie wzoru do organizacji tworzy DRAFT w konkretnym produkcie i NIE konsumuje puli.
- Pierwsza publikacja kopii konsumuje dokładnie 1 miejsce w wybranym produkcie; ponowna wersja i użycie przez kolejnych pracowników: 0.
- Wdrożenia i Awanse mogą użyć tego samego wzoru jako źródła dwóch odrębnych Standardów, po jednym w każdej puli.
- Klient ma własną kopię i własne wersje; aktualizacja biblioteki BOS nigdy automatycznie nie nadpisuje danych klienta.
- Każda kopia zapisuje `source_template_id` i numer wersji źródła (snapshot). Brak automatycznej synchronizacji.
- Biblioteka może oferować filtr zawodów/branż i warianty modułu; nie obiecujemy gotowości prawnej ani uniwersalności wzoru bez redakcyjnej walidacji.

## Integracja techniczna
- Istnieje `standards.source_template_id` i tabela `standard_templates` — najpierw audyt rzeczywistego schematu i API, nie tworzyć drugiego katalogu.
- Wymagane: identyfikator szablonu, wersja, nazwa zawodu, branża/tagi, kompatybilność z onboarding/promotions, status publikacji katalogowej, historia zmian.
- Wymagane: serwerowy endpoint `instantiateTemplate(organizationId, productId, templateVersionId)` z autoryzacją aktywnej licencji i członkostwa; tworzy DRAFT, nie wywołuje `consumeStandardCapacity`.
- Wymagane: jawny productId przy tworzeniu Standardu. Ścieżka `createOrganizationDraftStandard` obecnie tworzy NULL — naprawić, nie przypisywać automatycznie istniejących 4 rekordów.
- Limit musi być sprawdzany we wszystkich ścieżkach pierwszej publikacji, w tym bezpośredniej `createStandard`.
- Ledger zużycia musi zachować rekord po archiwizacji/usunięciu. Rozważyć FK lub snapshot ID.
- Dodać grant BASE przy nowej licencji, w tej samej transakcji co nadanie licencji, a nie tylko przy migracji historycznej.
- Checkout add-on +10 i komunikację UX realizować po testach limitów, ale kontrakty API projektować wspólnie.

## Etapy prac równoległych
| Etap | C02 — limity | LIB — katalog |
|---|---|---|
| A | Dokończyć testy izolowanej migracji, integracji, współbieżności | Audyt standard_templates i źródeł wersji |
| B | Naprawić nadawanie BASE i wszystkie ścieżki publikacji | Wersjonowanie szablonów i źródła kopii |
| C | API odczytu used/capacity/remaining, testy dwóch pul | API katalogu, filtrowanie, podgląd |
| D | Testy regresji i E2E, rozstrzygnięcie rekordów legacy NULL | Kopiowanie do DRAFT, integracja modułów |
| E | Checkout add-on i webhook (C02-04), panel (C02-06) | UX biblioteki i testy end-to-end |

## Bramy
1. Brak zmian produkcyjnej bazy bez oddzielnej zgody na release.
2. Testy: przegląd wzoru=0, skopiowanie=0, publikacja=1, ponowna wersja=0, archiwizacja nie oddaje miejsca.
3. Ten sam wzór może dać niezależne Standardy onboarding/promotions (10+10), bez przenoszenia licencji.
4. Równoczesne publikacje przy 9/10: dokładnie jedna sukcesem; druga kontrolowanym błędem.
5. Wzór v2 nie zmienia istniejącej kopii klienta v1.
6. Legacy NULL i ANNUAL/PERPETUAL pozostają jawnie blokującymi release do rozstrzygnięcia.
