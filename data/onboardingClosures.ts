export type OnboardingClosureResult = "GOTOWY" | "JESZCZE NIE" | "STOP";

export type OnboardingClosure = {
  id: string;
  processId: string;
  employee: string;
  standardId: string;
  standardVersion: string;
  startedAt: string;
  closedAt: string;
  owner: string;
  verifiedBy: string;
  result: OnboardingClosureResult;
  completedTasks: number;
  totalTasks: number;
  summary: string;
  recommendations?: string;
};

export const onboardingClosures: OnboardingClosure[] = [
  {
    id: "karolina-wrona-sprzedawca-2026",
    processId: "history-karolina-wrona",
    employee: "Karolina Wrona",
    standardId: "sprzedawca",
    standardVersion: "v1.0",
    startedAt: "03.08.2026",
    closedAt: "24.08.2026",
    owner: "Anna Wiśniewska",
    verifiedBy: "Anna Wiśniewska",
    result: "GOTOWY",
    completedTasks: 3,
    totalTasks: 3,
    summary: "Wszystkie czynności standardu zostały wykonane i zweryfikowane zgodnie z kryteriami gotowości.",
  },
  {
    id: "tomasz-lis-magazynier-2026",
    processId: "history-tomasz-lis",
    employee: "Tomasz Lis",
    standardId: "magazynier",
    standardVersion: "v1.1",
    startedAt: "06.07.2026",
    closedAt: "29.07.2026",
    owner: "Jan Kowalski",
    verifiedBy: "Jan Kowalski",
    result: "JESZCZE NIE",
    completedTasks: 4,
    totalTasks: 4,
    summary: "Proces zakończony po potwierdzeniu wszystkich kryteriów wersji v1.1.",
    recommendations: "Powtórzyć samodzielną kontrolę kompletacji po 30 dniach.",
  },
  {
    id: "ewa-maj-produkcja-2026",
    processId: "history-ewa-maj",
    employee: "Ewa Maj",
    standardId: "produkcja",
    standardVersion: "v1.1",
    startedAt: "15.07.2026",
    closedAt: "05.08.2026",
    owner: "Jan Kowalski",
    verifiedBy: "Marta Nowak",
    result: "GOTOWY",
    completedTasks: 3,
    totalTasks: 3,
    summary: "Rezultat procesu zweryfikowany. Pracownik realizuje pełny zakres czynności stanowiska.",
  },
];

export function getClosureProgress(closure: OnboardingClosure) {
  return Math.round((closure.completedTasks / closure.totalTasks) * 100);
}
