BEGIN;

CREATE TABLE standard_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  area text NOT NULL,
  description text NOT NULL,
  role_description text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK(version > 0),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','HIDDEN','RETIRED')),
  tasks_json jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(tasks_json)='array'),
  start_requirements_json jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(start_requirements_json)='array'),
  readiness_criteria_json jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(readiness_criteria_json)='array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE standards
  ADD COLUMN source_template_id uuid REFERENCES standard_templates(id),
  ADD COLUMN source_template_version integer;

CREATE INDEX standards_source_template_idx ON standards(source_template_id)
  WHERE source_template_id IS NOT NULL;

INSERT INTO standard_templates(key,name,area,description,role_description,tasks_json,start_requirements_json,readiness_criteria_json)
VALUES
('customer-order-service','Obsługa zamówienia klienta','Obsługa klienta / Sprzedaż',
 'Gotowy punkt wyjścia dla osoby przyjmującej, realizującej i zamykającej zamówienie klienta.',
 'Osoba obsługuje zamówienie od przyjęcia potrzeby klienta do potwierdzenia prawidłowej realizacji i zamknięcia sprawy.',
 '[{"name":"Przyjmij zamówienie","execution":"Zapisz komplet danych klienta, zakres zamówienia, ilość, termin i uzgodniony sposób realizacji.","readyWhen":"Dane zamówienia są kompletne i jednoznaczne.","hint":"","isCritical":true},{"name":"Potwierdź warunki realizacji","execution":"Zweryfikuj dostępność, cenę, termin i sposób odbioru lub dostawy przed przekazaniem potwierdzenia klientowi.","readyWhen":"Klient otrzymał potwierdzone warunki zgodne z możliwościami firmy.","hint":"","isCritical":true},{"name":"Przekaż zamówienie do realizacji","execution":"Przekaż komplet informacji do właściwej osoby lub etapu realizacji i upewnij się, że zamówienie zostało przyjęte.","readyWhen":"Osoba realizująca ma wszystkie dane potrzebne do wykonania zamówienia.","hint":"","isCritical":false},{"name":"Zamknij zamówienie","execution":"Potwierdź wykonanie, odnotuj odbiór lub wysyłkę i uzupełnij wymagany status zamówienia.","readyWhen":"Realizacja i status zamówienia są zgodne ze stanem faktycznym.","hint":"","isCritical":true}]'::jsonb,
 '[{"category":"ACCESS","requirement":"Dostęp do systemu lub rejestru zamówień"},{"category":"INSTRUCTIONS","requirement":"Aktualny cennik, zasady realizacji i terminy"}]'::jsonb,
 '[{"criterion":"Samodzielnie przyjmuje kompletne zamówienie bez pominięcia danych krytycznych.","verificationMethod":"OBSERVATION"},{"criterion":"Prawidłowo przekazuje zamówienie do realizacji i aktualizuje jego status.","verificationMethod":"INDEPENDENT_TASK"}]'::jsonb),
('retail-customer-service','Sprzedawca — obsługa klienta','Sprzedaż',
 'Bazowy standard bezpośredniej obsługi klienta w punkcie sprzedaży.',
 'Osoba rozpoznaje potrzebę klienta, przedstawia właściwe rozwiązanie, finalizuje sprzedaż i pozostawia stanowisko gotowe dla kolejnego klienta.',
 '[{"name":"Rozpoznaj potrzebę klienta","execution":"Zadaj pytania pozwalające ustalić czego klient potrzebuje, w jakim terminie i jakie ma ograniczenia.","readyWhen":"Potrzeba klienta jest zrozumiała przed przedstawieniem rozwiązania.","hint":"","isCritical":true},{"name":"Przedstaw rozwiązanie","execution":"Przedstaw produkt lub usługę odpowiadającą ustalonej potrzebie i wyjaśnij kluczowe warunki zakupu.","readyWhen":"Klient zna produkt, cenę i istotne warunki.","hint":"","isCritical":false},{"name":"Sfinalizuj sprzedaż","execution":"Potwierdź wybór, poprawnie zarejestruj sprzedaż i przekaż klientowi wymagane dokumenty lub informacje.","readyWhen":"Transakcja jest poprawnie zarejestrowana i zakończona.","hint":"","isCritical":true}]'::jsonb,
 '[{"category":"ACCESS","requirement":"Dostęp do systemu sprzedażowego"},{"category":"MATERIALS","requirement":"Aktualna oferta i cennik"}]'::jsonb,
 '[{"criterion":"Samodzielnie prowadzi obsługę klienta od rozpoznania potrzeby do zakończenia sprzedaży.","verificationMethod":"OBSERVATION"},{"criterion":"Poprawnie rejestruje przykładową transakcję.","verificationMethod":"INDEPENDENT_TASK"}]'::jsonb),
('warehouse-goods-receipt','Magazynier — przyjęcie dostawy','Magazyn',
 'Gotowy standard podstawowego przyjęcia dostawy do magazynu.',
 'Osoba przyjmuje dostawę, porównuje stan faktyczny z dokumentacją, reaguje na niezgodności i odkłada towar zgodnie z zasadami magazynu.',
 '[{"name":"Zweryfikuj dostawę","execution":"Porównaj dostawcę, dokument dostawy i oznaczenia przesyłki przed rozpoczęciem przyjęcia.","readyWhen":"Dostawa została przypisana do właściwego dokumentu.","hint":"","isCritical":true},{"name":"Sprawdź ilość i stan","execution":"Policz przyjmowany towar i sprawdź widoczne uszkodzenia oraz zgodność z dokumentem.","readyWhen":"Ilość i stan faktyczny są potwierdzone lub niezgodność została oznaczona.","hint":"","isCritical":true},{"name":"Zarejestruj przyjęcie","execution":"Wprowadź przyjęcie do właściwego systemu lub rejestru zgodnie ze stanem faktycznym.","readyWhen":"Stan systemowy odpowiada zaakceptowanej dostawie.","hint":"","isCritical":true},{"name":"Odłóż towar","execution":"Umieść towar we właściwej lokalizacji magazynowej i zachowaj wymagane oznaczenia.","readyWhen":"Towar znajduje się we właściwej lokalizacji i jest możliwy do odnalezienia.","hint":"","isCritical":false}]'::jsonb,
 '[{"category":"ACCESS","requirement":"Dostęp do systemu lub rejestru magazynowego"},{"category":"TOOLS","requirement":"Narzędzia wymagane do identyfikacji i przemieszczenia towaru"}]'::jsonb,
 '[{"criterion":"Samodzielnie przyjmuje zgodną dostawę i poprawnie ją rejestruje.","verificationMethod":"INDEPENDENT_TASK"},{"criterion":"Rozpoznaje niezgodność i stosuje właściwą ścieżkę zgłoszenia.","verificationMethod":"CONTROL_QUESTIONS"}]'::jsonb);

INSERT INTO bos_schema_migrations(name)
VALUES ('031_standard_template_catalog.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
