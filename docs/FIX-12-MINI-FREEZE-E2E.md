# FIX-12 — MINI-FREEZE / Integrated E2E

**Data:** 2026-09-30  
**Bazowy commit:** `406aa1d275b32a7b2316c9ffd20d6556bdc02f6f`  
**Zakres:** Core + Onboarding + Promotions  
**Cel:** zamrożenie punktu wejścia przed pełnym testem regresyjnym FIX-12.

## Zasady mini-freeze

- W czasie E2E nie rozwijamy funkcji ani UI.
- Test wykonujemy w zalogowanym panelu, na jednym koncie i w jednej organizacji.
- Używamy jednego testowego Employee przez Onboarding i Promotions.
- Błędy zapisujemy z ekranem/ścieżką i krokiem reprodukcji; nie naprawiamy ich w trakcie scenariusza.
- Błąd blokujący oznacza FIX-12 FAIL. Naprawa jest osobnym, wąskim commitem, po którym powtarzamy odpowiedni fragment E2E.
- Nie wykonujemy migracji ani zmian schematu Neon w ramach testu.
- PASS FIX-12 nie oznacza jeszcze release approval; po nim następuje FIX-13 RC-2 Freeze.

## E2E-01 — AppShell i sesja

1. Zaloguj się i wejdź do `/app`.
2. Potwierdź widoczność licencjonowanych WDROŻENIA i AWANSE.
3. Przejdź między produktami.
4. Potwierdź zachowanie sesji i organizacji.
5. Brak 404/500, błędów React i zerwania sesji.

## E2E-02 — Shared Standard Core

1. Utwórz testowy Standard stanowiska B.
2. Uzupełnij minimalny kompletny Standard i opublikuj wersję.
3. Potwierdź dostępność tej samej opublikowanej wersji dla Onboarding i Promotions.
4. Potwierdź przypięcie procesu do konkretnej wersji Standardu.

## E2E-03 — Employee Core + Onboarding

1. Utwórz jednego testowego pracownika.
2. Rozpocznij Onboarding.
3. Przejdź PRZYGOTUJ → PRZEPROWADŹ → ZAMKNIJ.
4. Wykonaj wymagane czynności oraz WYJAŚNIJ → POKAŻ → RAZEM → SAM → SPRAWDŹ.
5. Przejdź K/readiness, potwierdź formalności i zakończ decyzją GOTOWY.
6. Sprawdź Kartę Zakończenia i historię.

## E2E-04 — Onboarding → Promotions

1. Dla tego samego Employee rozpocznij zmianę roli A → B.
2. Nie twórz drugiego rekordu Employee.
3. Potwierdź ciągłość pracownika/kontekstu.
4. Wybierz właściwą opublikowaną wersję Standardu B.

## E2E-05 — Promotions

1. Przejdź Entry Assessment i właściwą gałąź Verification/Deployment.
2. Wykonaj wymagane pięć etapów.
3. Doprowadź do PASS: STANDARD, PROCESS, ENTRY, DEPLOYMENT, K, READINESS, TRANSITION.
4. Potwierdź, że GOTOWY nie jest dostępne przed wymaganym 7/7.
5. Po 7/7 wybierz GOTOWY i zamknij zmianę.

## E2E-06 — Wspólna historia

1. Otwórz `/app/employees/[employeeId]`.
2. Potwierdź jeden Employee i brak duplikatu.
3. Potwierdź historię zakończonego Onboarding i Promotions.
4. Sprawdź role A/B, Standard, wersję, decyzje i daty.
5. Potwierdź, że Promotions nie zmieniło historycznego Onboardingu.

## E2E-07 — Portability i regresja końcowa

1. Sprawdź eksport Onboarding i Promotions.
2. Potwierdź JSON/CSV dla zalogowanej/licencjonowanej organizacji.
3. Wróć do dashboardu i sprawdź statusy/liczniki.
4. Wykonaj reload i ponownie otwórz oba procesy.
5. Potwierdź trwałość danych i stanów.

## Kryterium PASS

FIX-12 = PASS wyłącznie, gdy cały scenariusz przechodzi na jednym koncie, w jednej organizacji i na jednym Employee bez 404/500, blokujących błędów UI, utraty sesji/danych, duplikacji Employee Core, niespójności Shared Standards, obejścia bramek, utraty historii po reloadzie lub błędnego zakresu eksportu.

## Raport Desktop

Każdy etap: **PASS / FAIL**. Przy FAIL zapisz etap i krok, adres/ekran, rezultat oczekiwany i rzeczywisty, komunikat błędu oraz screenshot, jeśli pomaga. Desktop nie naprawia regresji podczas testu; wynik wraca do głównego procesu naprawczego BOS.
