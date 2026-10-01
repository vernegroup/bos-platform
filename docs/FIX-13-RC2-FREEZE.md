# FIX-13 — RC-2 Freeze

**Data freeze:** 2026-10-01  
**Repo:** `vernegroup/bos-platform`  
**Branch:** `main`  
**RC-2 HEAD:** `efaeb2f4da97423bb2411d6efc071929fb0bc89b`  
**Deployment:** `dpl_DfB32Px4z4iUSzRhZ6Y5iFP8zZ8B`  
**Deployment URL:** `bos-platform-6i7p002qn-vernegroup1.vercel.app`  
**Stan deploymentu:** READY

## 1. Cel freeze

FIX-13 zamraża techniczny punkt odniesienia RC-2 po zakończeniu integracji Core + Wdrożenia + Awanse. Freeze nie jest release approval i nie dodaje funkcjonalności.

## 2. Zakres RC-2

RC-2 obejmuje:
- wspólny Core dla produktów WDROŻENIA i AWANSE,
- wspólny model Standard,
- wspólny Employee,
- przypinanie wersji Standardu do procesu,
- lifecycle Wdrożeń,
- lifecycle Awansów,
- bramki procesowe i readiness,
- decyzje i closure,
- wspólną historię pracownika,
- portability / eksport JSON i CSV,
- wyszukiwarkę oraz routing wyników do właściwego kontekstu procesu.

## 3. Wspólny model Standard

Standard jest współdzielonym kontraktem procesowym. Proces pracuje na przypiętej wersji Standardu, tak aby późniejsza zmiana Standardu nie zmieniała historycznego znaczenia już prowadzonego procesu.

## 4. Wspólny Employee

Wdrożenia i Awanse korzystają ze wspólnej tożsamości Employee. Zamknięty Awans może aktualizować efektywną rolę pracownika bez tworzenia drugiej osoby i bez rozdzielania historii między produkty.

## 5. Lifecycle Wdrożeń

Wdrożenie obejmuje pełną ścieżkę procesu, pięć etapów czynności, K, readiness, decyzję końcową oraz Kartę Zakończenia. Zamknięty proces zachowuje historię i pozostaje osiągalny przez wyszukiwarkę.

## 6. Lifecycle Awansów

Awans korzysta z tej samej osoby i architektury Standardu, prowadzi zmianę roli A→B przez siedem bramek procesowych i kończy się closure zapisanym we wspólnej historii Employee.

## 7. Bramki procesowe

RC-2 zachowuje istniejące gate logic Wdrożeń i Awansów. FIX-13 nie modyfikuje warunków K, readiness, decyzji ani zamknięcia.

## 8. Historia i closure

Closure jest trwałym rekordem zakończenia procesu. Historia pracownika agreguje właściwe zdarzenia obu produktów i zachowuje ciągłość Employee między Wdrożeniem a Awansem.

## 9. Portability

RC-2 zawiera działające eksporty JSON/CSV objęte istniejącymi guardami dostępu. FIX-13 nie zmienia ich kontraktu.

## 10. Search / routing contract

Wynik wyszukiwarki dla zamkniętego Wdrożenia musi prowadzić do istniejącej Karty Zakończenia, a nie do aktywnego routu procesu.

Kontrakt po FIX-12J.1:
- zapytanie zwraca `p.status::text status, p.status::text context`,
- mapper może rozpoznać `CLOSED`,
- zamknięty wynik kieruje do `/app/onboarding/closed/{closureId}`.

## 11. Wynik FIX-12

**FIX-12 = PASS** na podstawie wcześniej wykonanego pełnego scenariusza integracyjnego oraz wąskich retestów błędów po poprawkach.

Potwierdzony zakres obejmuje wspólny Standard i Employee, pełne Wdrożenie, pięć etapów, K, readiness, GOTOWY, Kartę Zakończenia, przejście tej samej osoby przez Awans A→B, siedem bramek Awansów, zamknięcie Awansu, wspólną historię, eksport JSON/CSV, trwałość po reloadzie oraz poprawny routing wyszukiwarki zamkniętego Wdrożenia.

Ostatni retest F12H-02 po FIX-12J.1 zakończył się PASS.

## 12. Build / deployment

Dla HEAD `efaeb2f4da97423bb2411d6efc071929fb0bc89b` istnieje produkcyjny deployment Vercel `dpl_DfB32Px4z4iUSzRhZ6Y5iFP8zZ8B` w stanie READY.

READY oznacza poprawne zbudowanie i wdrożenie artefaktu. Nie jest deklaracją nowego testu przeglądarkowego/E2E.

## 13. Znane ograniczenia

- część ekranów wymaga POLISH-UI: czytelność, typografia, polonizacja i finalizacja treści,
- warstwa sprzedażowa nie tworzy jeszcze kompletnego procesu PUBLIC → COMMERCE → ACCESS → PRODUCT,
- istniejący szkielet Stripe/licensing wymaga osobnego audytu przed rozszerzeniem,
- release/compliance pozostaje osobnym obszarem blokującym publiczną decyzję release.

## 14. Jawnie poza freeze

FIX-13 nie obejmuje i nie zmienia:
- schematu ani danych Neon,
- logiki Wdrożeń,
- logiki Awansów,
- gate logic,
- lifecycle,
- auth,
- Commerce,
- finalnego POLISH-UI,
- finalnych cen/ofert,
- release approval.

## 15. COMPLIANCE-BLOCKER-01

**COMPLIANCE-BLOCKER-01 pozostaje OTWARTY i blokuje release approval.**

Do zamknięcia pozostają m.in. role controller/processor, notices i prawa użytkowników, DPA, retention, incident handling oraz ROPA.

Techniczny RC-2 Freeze nie oznacza gotowości do publicznej sprzedaży produkcyjnej.

## 16. Następny etap

Po FIX-13 kolejność prac:
1. POLISH-UI,
2. build / regression smoke,
3. COMMERCE-00 Audit istniejącego Stripe + licensing,
4. dopiero potem projektowanie i implementacja minimalnego rozszerzenia Commerce.

**Freeze rule:** Commerce ma zostać dołożony wokół zamrożonego Core, bez przebudowy działających Wdrożeń i Awansów.
