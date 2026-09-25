# BOS Wdrożenia 1.0 — RC-FREEZE-01

Status: **RELEASE CANDIDATE FREEZE**  
Branch: `onboarding-2-2-fix-standard-editor`  
Freeze baseline commit: `151a041b5bc68a31d36f3173080d1535b4f85204`  
Date: 2026-09-25

## Zakres zamrożenia

Od tego punktu BOS Wdrożenia 1.0 jest zamrożone funkcjonalnie i wizualnie.

Dozwolone przed wydaniem:
- poprawki błędów wykrytych w E2E, regresji, bezpieczeństwie i smoke testach;
- poprawki blokujące build, wdrożenie, integralność danych, dostępność procesu lub bezpieczeństwo;
- minimalne korekty konieczne do usunięcia potwierdzonej regresji.

Niedozwolone przed wydaniem:
- nowe funkcje;
- redesign UI;
- zmiany architektury bez błędu blokującego;
- nowe warianty produktu lub rozszerzenia zakresu;
- kosmetyczne poprawki niezwiązane z potwierdzonym defektem.

## Baseline RC

Freeze obejmuje aktualny stan public MAIN, panelu oraz BOS Wdrożenia, w tym:
- polskie nazewnictwo interfejsu;
- public Product Rail z Montserrat i polskimi znakami;
- zabezpieczenie Product Rail przed kolizją z dymkiem wsparcia;
- przypięcie aktywnego wdrożenia do wersji standardu i uruchamianie nowych procesów na najnowszej opublikowanej wersji;
- statyczne guardy REG-01 i SEC-01.

## Bramka wydania

Po freeze wykonujemy wyłącznie:
1. FUNC-02 — happy-path E2E.
2. FUNC-03 — negative-path E2E.
3. końcową regresję runtime.
4. SEC/PEN runtime.
5. test użytkownika bez wcześniejszej znajomości BOS.
6. merge do `main`, production build, smoke test i release — wyłącznie po przejściu bramek.

Każdy błąd znaleziony po freeze powinien być naprawiany możliwie najmniejszą zmianą i osobnym, jednoznacznie opisanym commitem.
