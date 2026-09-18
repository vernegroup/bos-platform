export type OnboardingStandardTask = {
  id: string;
  order: number;
  name: string;
  execution: string;
  readyWhen: string;
};

export type OnboardingStandardVersion = {
  version: string;
  date: string;
  note: string;
  tasks: OnboardingStandardTask[];
};

export type OnboardingStandard = {
  id: string;
  name: string;
  area: string;
  status: "AKTYWNY" | "ROBOCZY";
  currentVersion: string;
  updatedAt: string;
  versions: OnboardingStandardVersion[];
};

export const onboardingStandards: OnboardingStandard[] = [
  {
    id: "magazynier",
    name: "Magazynier",
    area: "Magazyn",
    status: "AKTYWNY",
    currentVersion: "v1.2",
    updatedAt: "18.09.2026",
    versions: [
      {
        version: "v1.2",
        date: "18.09.2026",
        note: "Doprecyzowano kontrolę kompletacji i przekazanie stanowiska.",
        tasks: [
          { id: "m-01", order: 1, name: "Przyjęcie zmiany", execution: "Sprawdź przekazanie stanowiska, otwarte zadania i stan obszaru.", readyWhen: "Stan obszaru i zadania z poprzedniej zmiany są znane." },
          { id: "m-02", order: 2, name: "Kontrola lokalizacji", execution: "Zweryfikuj oznaczenia lokalizacji i dostępność miejsc odkładczych.", readyWhen: "Lokalizacje są czytelne i możliwe do użycia." },
          { id: "m-03", order: 3, name: "Przyjęcie towaru", execution: "Porównaj dostawę z dokumentem i odłóż towar do właściwej lokalizacji.", readyWhen: "Ilość i lokalizacja są zgodne z przyjęciem." },
          { id: "m-04", order: 4, name: "Kompletacja zamówienia", execution: "Kompletuj według listy i potwierdzaj każdą pobraną pozycję.", readyWhen: "Wszystkie pozycje zamówienia są skompletowane." },
          { id: "m-05", order: 5, name: "Kontrola kompletacji", execution: "Porównaj gotowe zamówienie z listą przed przekazaniem dalej.", readyWhen: "Nie ma różnic ilościowych ani asortymentowych." },
          { id: "m-06", order: 6, name: "Zamknięcie zmiany", execution: "Uporządkuj obszar i przekaż nierozwiązane zadania kolejnej zmianie.", readyWhen: "Obszar jest uporządkowany, a otwarte zadania przekazane." },
        ],
      },
      {
        version: "v1.1",
        date: "02.08.2026",
        note: "Dodano osobny krok kontroli kompletacji.",
        tasks: [
          { id: "m11-01", order: 1, name: "Przyjęcie zmiany", execution: "Sprawdź stan obszaru i zadania.", readyWhen: "Stan początkowy jest znany." },
          { id: "m11-02", order: 2, name: "Przyjęcie towaru", execution: "Zweryfikuj dostawę i odłóż towar.", readyWhen: "Towar znajduje się we właściwych lokalizacjach." },
          { id: "m11-03", order: 3, name: "Kompletacja", execution: "Skompletuj pozycje według listy.", readyWhen: "Lista jest kompletna." },
          { id: "m11-04", order: 4, name: "Kontrola", execution: "Sprawdź kompletność zamówienia.", readyWhen: "Brak różnic." },
        ],
      },
      {
        version: "v1.0",
        date: "12.06.2026",
        note: "Pierwsza opublikowana wersja Standardu Stanowiska.",
        tasks: [
          { id: "m10-01", order: 1, name: "Przyjęcie zmiany", execution: "Sprawdź stan stanowiska.", readyWhen: "Stan jest znany." },
          { id: "m10-02", order: 2, name: "Kompletacja", execution: "Realizuj listę zamówienia.", readyWhen: "Zamówienie jest gotowe." },
        ],
      },
    ],
  },
  {
    id: "sprzedawca",
    name: "Sprzedawca",
    area: "Sprzedaż",
    status: "AKTYWNY",
    currentVersion: "v1.0",
    updatedAt: "05.09.2026",
    versions: [{
      version: "v1.0",
      date: "05.09.2026",
      note: "Pierwsza opublikowana wersja.",
      tasks: [
        { id: "s-01", order: 1, name: "Otwarcie stanowiska", execution: "Przygotuj stanowisko i sprawdź narzędzia sprzedaży.", readyWhen: "Stanowisko jest gotowe do obsługi." },
        { id: "s-02", order: 2, name: "Obsługa klienta", execution: "Rozpoznaj potrzebę, przedstaw rozwiązanie i potwierdź zamówienie.", readyWhen: "Klient zna zakres i warunki zamówienia." },
        { id: "s-03", order: 3, name: "Zamknięcie sprzedaży", execution: "Zapisz zamówienie i przekaż wymagane informacje do realizacji.", readyWhen: "Zamówienie może przejść do realizacji." },
      ],
    }],
  },
  {
    id: "produkcja",
    name: "Produkcja",
    area: "Produkcja",
    status: "AKTYWNY",
    currentVersion: "v1.1",
    updatedAt: "11.09.2026",
    versions: [{
      version: "v1.1",
      date: "11.09.2026",
      note: "Rozdzielono przygotowanie i kontrolę końcową.",
      tasks: [
        { id: "p-01", order: 1, name: "Przygotowanie zlecenia", execution: "Sprawdź specyfikację, materiały i wymagany rezultat.", readyWhen: "Zlecenie jest kompletne i możliwe do rozpoczęcia." },
        { id: "p-02", order: 2, name: "Wykonanie", execution: "Wykonaj produkt zgodnie ze specyfikacją.", readyWhen: "Produkt odpowiada specyfikacji." },
        { id: "p-03", order: 3, name: "Kontrola końcowa", execution: "Porównaj rezultat z wymaganiami zlecenia.", readyWhen: "Produkt spełnia wszystkie kryteria przekazania." },
      ],
    }],
  },
];
