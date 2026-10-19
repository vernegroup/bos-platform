# BOS UX 3.0 — AUDYT TECHNICZNY 1.0

**ID:** UX3-03  
**Data:** 2026-10-19  
**Repo:** `vernegroup/bos-platform`, `main`  
**Punkt odniesienia:** commit `f8bcc1f0c39c1a2e45b53c98b3da6bab8e329dde`  
**Status:** AUDIT COMPLETE (static source review) / IMPLEMENTATION GATED  
**Dokumenty:** `docs/ux/BOS-UX3-CONTRACT-1.0.md`, `docs/ux/BOS-UX3-FUNCTIONAL-SPEC-1.0.md`

## 1. Zakres i metoda

Odczytano aktualne pliki GitHub na main: Kartę Postępu, formularz decyzji i stronę zamknięcia, repozytorium Wdrożeń, dostęp i fragment procesu Awansów; sprawdzono drzewo repozytorium. **Nie uruchamiano** aplikacji, kompilacji, testów, sesji użytkownika, zapytań Neon ani mutacji produkcyjnych. Obserwacje z wcześniejszego raportu black-box nie są dowodem przyczyny technicznej.

## 2. Mapa rzeczywistego kodu

| Obszar | Ścieżka | Ustalenie |
|---|---|---|
| Karta Postępu | `app/app/onboarding/processes/[processId]/page.tsx` | Server Component; renderuje wszystkie czynności i pięć etapów każdej |
| Zapis etapu | ta sama strona, `confirmStage` | Server Action: `requireBOSAccess` → `confirmTaskStage` → `revalidatePath` → `redirect` |
| Warunki startu | ta sama strona, `confirmStart` | Server Action z redirectem |
| Kryteria | ta sama strona, `confirmReadiness` | Server Action z redirectem |
| Notatki | ta sama strona, `saveNote` | Server Action z redirectem |
| Dane i mutacje | `lib/bos/onboardingRepository.ts` | Neon SQL, filtrowanie `organization_id`, osobne kolumny czasu/autora etapów |
| Tożsamość i organizacja | `lib/bos/access.ts` | `requireBOSAccess` rozwiązuje sesję, członkostwo i organizację |
| Decyzja końcowa | `app/app/onboarding/processes/[processId]/close/page.tsx` | Server Action `closeProcess` |
| Formularz decyzji | `.../close/CloseDecisionForm.tsx` | Klient `useActionState` i `pending` — istniejący wzorzec feedbacku |
| Awanse | `app/app/promotions/processes/[id]/page.tsx` | Odrębny proces i repozytorium, podobne Server Actions z redirectami |
| Wspólny styl | `app/app/app-shell.css` | Istniejąca rozbudowana warstwa klas `bos-*`; zmiany stylu wymagają regresji |

## 3. Wnioski o obecnej implementacji

### 3.1. Pięć etapów już jest w jednym obszarze strony

Dla każdej czynności renderowane są przyciski `EXPLAINED`, `SHOWN`, `TOGETHER`, `SOLO`, `CHECKED` z osobnymi formularzami, etykietami i datami/autorami. Poprzedni etap musi być ukończony; UI blokuje przyciski do czasu potwierdzenia startu. Problem UX dotyczy zatem **języka, hierarchii, zachowania po zapisie i liczby formularzy**, a nie braku widoczności pięciu etapów.

### 3.2. Przebieg potwierdzenia

```text
Kliknięcie przycisku etapu
 → formularz Server Action confirmStage
 → requireBOSAccess (sesja + organizacja)
 → confirmTaskStage (SQL)
 → revalidatePath(process + onboarding)
 → redirect(process#task-id)
 → ponowny render danych na stronie
```

Nie ma w tym fragmencie komponentu klienta pokazującego stany SAVING/SAVED/ERROR dla pojedynczego etapu. **Hipoteza:** nawigacja i brak lokalnego feedbacku przyczyniają się do niepewności stanu. Nie wykazano przyczyny zgłoszonego w raporcie braku aktualizacji — wymaga testu runtime.

### 3.3. Dane wystarczające do panelu

`listProcesses` odczytuje `onboarding_task_progress`, łączy użytkowników i zwraca `explainedAt/shownAt/togetherAt/soloAt/checkedAt` oraz `explainedBy/.../checkedBy`. `getProcess` korzysta z listy procesów ograniczonej organizacją. W obecnym modelu można pokazać pięć odrębnych etapów z autorem i datą. **Nie wymaga to nowej tabeli.**

### 3.4. Ważne ryzyka istniejącego repozytorium

**R1 — ponowienie może nadpisać autora/czas.** `confirmTaskStage` aktualizuje `*_at` i `*_by_user_id` bez warunku, że bieżący etap jest jeszcze niepotwierdzony. UI blokuje `done`, ale przy powtórnym żądaniu lub równoległej sesji backend może nadpisać wcześniejsze poświadczenie. Wymaga osobnej, zatwierdzonej poprawki integralności, zanim obiecamy pełną idempotencję UX3.

**R2 — autoryzacja potwierdzającego etap jest szersza niż opis kontraktu.** `confirmTaskStage` sprawdza członkostwo w organizacji, ale nie filtruje w pokazanym zapytaniu `memberships.status='ACTIVE'` i nie sprawdza przypisanej roli prowadzącego/weryfikującego. `requireBOSAccess` sprawdza aktywne członkostwo przy rozwiązywaniu sesji. Należy oddzielnie zweryfikować politykę uprawnień, zamiast zakładać, że role domenowe są egzekwowane w tej mutacji.

**R3 — blokady procesu.** `confirmTaskStage` odrzuca `PLANNED`, ale w pokazanym kodzie nie ogranicza innych statusów do jawnej listy. Widok procesu jest pobierany z listy statusów aktywnych. Należy sprawdzić przypadki równoległe, zamknięcie i odświeżenie formularza.

**R4 — wyścig stanu.** UI liczy `previousDone` na renderze, a SQL sprawdza poprzedni etap; brak widocznej transakcyjnej blokady/idempotency key dla równoległych kliknięć. Nie wolno pokazywać trwałego sukcesu przed potwierdzeniem serwera.

**R5 — semantyka „dowodu”.** Strona decyzji używa zwrotów „dowód samodzielnego wykonania” i „zweryfikowane w rzeczywistej pracy”, mimo że baza zapisuje deklarację użytkownika. To potwierdzony w kodzie problem językowy, bez konieczności zmiany rdzenia.

**R6 — Awanse są oddzielne.** `app/app/promotions/processes/[id]/page.tsx` ma osobne akcje `advancePromotionDeployment`, `savePromotionReadiness` itd. Nie wolno zakładać współdzielenia mutacji onboardingowych. Wspólne mogą być wyłącznie prezentacyjne wzorce UI po odrębnym audycie domenowym.

## 4. Klasyfikacja zmian

| Zmiana | Klasa | Rekomendacja |
|---|---|---|
| Słownik działań pięciu etapów | UI ONLY | Wdrożyć |
| Jeden czytelny panel na czynność | UI ONLY / UI + STATE | Wdrożyć |
| Wyświetlanie autorów i dat | UI ONLY | Istnieją dane |
| Wskaźnik aktualnego kroku | UI ONLY | Wdrożyć |
| SAVING / SAVED / ERROR | UI + STATE | Wymaga Client Component i kontraktu wyniku akcji |
| Aktualizacja bez redirectu | UI + STATE / API REQUIRED | Preferować Server Action zwracającą wynik, z odświeżeniem danych |
| Rozpoznanie wyniku nieznanego | API REQUIRED | Odczyt stanu autorytatywnego |
| Gwarancja braku duplikatów/nadpisania | CORE RISK | Osobna poprawka repozytorium po zatwierdzeniu |
| Zmiana reguł potwierdzeń/bramek | CORE RISK | Niedozwolona w UX3 |
| Podgląd wzoru | UI + STATE | Osobna iteracja po MVP |
| Link „Rozpocznij wdrożenie” | UI ONLY / routing | Zweryfikować przekazywanie kontekstu |
| Awanse — nowa prezentacja | UI + STATE | Oddzielny pakiet po Wdrożeniach |

## 5. Docelowa architektura MVP

```text
Server page (auth, process, Standard, wersja, bramki)
  └─ OperationalTaskPanel (Client Component)
      ├─ ActionPanel + ProgressSequence
      ├─ SaveFeedback (pending, saved, error, unknown)
      └─ AuditDetails (autorzy, daty, historia)
          ↓
      Server Action adapter (typowany wynik, brak redirect przy sukcesie)
          ↓
      istniejące confirmTaskStage + autoryzacja
          ↓
      odczyt aktualnego stanu procesu i revalidation
```

Zachować `organizationId` z sesji, nie z danych klienta. Preferować jedną akcję na jeden etap, bez zbiorczego zaliczania. Stanu `done` nie aktualizować na trwałe przed odpowiedzią serwera. Nie zmieniać `onboarding_task_progress` ani Standardów w MVP.

**Warunek:** przed wdrożeniem pełnego mechanizmu retries należy zdecydować, czy R1/R3 poprawiamy w osobnym, minimalnym kontrakcie integralności. Bez tego UX3-04 nie może obiecywać idempotencji.

## 6. Testy wymagane przed publikacją

1. Sekwencja 5/5, osobny autor i czas każdego zapisu.
2. Brak możliwości pominięcia etapu.
3. Ponowne żądanie tego samego etapu nie może zmienić pierwotnego poświadczenia (wymaga usunięcia R1).
4. Dwie sesje równoległe, odświeżenie i konflikt.
5. Utrata sieci, timeout i odczyt stanu po wyniku nieznanym.
6. Brak fałszywego sukcesu po błędzie SQL.
7. Odrzucenie nieuprawnionej organizacji/użytkownika.
8. Wstrzymany i zamknięty proces.
9. Brak automatycznego zaliczenia kryteriów po 5/5.
10. Zachowanie decyzji GOTOWY / JESZCZE NIE / STOP.
11. Desktop + mały viewport, klawiatura i czytnik ekranu.
12. Regresja Awansów, Standardów i historii.

## 7. Decyzja audytowa

**PASS — mapa techniczna i wykonalność MVP.** Dane i operacje domenowe istnieją; można wdrożyć nową warstwę prezentacji bez migracji Neon.

**OPEN GATE — bezpieczeństwo zapisu i integralność.** R1/R3 wymagają zatwierdzenia minimalnej korekty repozytorium lub świadomego ograniczenia zakresu pierwszej wersji. Nie oznaczać pełnej gotowości do produkcji bez testów runtime.

**Następny krok:** UX3-04A (wspólne komponenty i adapter interakcji), następnie UX3-04B (Karta Postępu). Przed produkcyjnym UX3-04B rozstrzygnąć R1/R3. Nie wykonano żadnej mutacji bazy ani kodu aplikacji podczas audytu.
