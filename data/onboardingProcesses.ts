export type OnboardingProcessTaskStatus = "GOTOWE" | "W TOKU" | "DO WYKONANIA";

export type OnboardingProcessTask = {
  standardTaskId: string;
  status: OnboardingProcessTaskStatus;
  completedAt?: string;
  note?: string;
};

export type OnboardingProcess = {
  id: string;
  employee: string;
  standardId: string;
  standardVersion: string;
  startedAt: string;
  targetDate: string;
  owner: string;
  status: "W TOKU";
  tasks: OnboardingProcessTask[];
};

export const onboardingProcesses: OnboardingProcess[] = [
  {
    id: "anna-nowak-magazynier",
    employee: "Anna Nowak",
    standardId: "magazynier",
    standardVersion: "v1.2",
    startedAt: "09.09.2026",
    targetDate: "30.09.2026",
    owner: "Jan Kowalski",
    status: "W TOKU",
    tasks: [
      { standardTaskId: "m-01", status: "GOTOWE", completedAt: "09.09.2026" },
      { standardTaskId: "m-02", status: "GOTOWE", completedAt: "10.09.2026" },
      { standardTaskId: "m-03", status: "GOTOWE", completedAt: "12.09.2026" },
      { standardTaskId: "m-04", status: "GOTOWE", completedAt: "16.09.2026" },
      { standardTaskId: "m-05", status: "W TOKU", note: "Kontrola wykonywana jeszcze wspólnie z managerem." },
      { standardTaskId: "m-06", status: "DO WYKONANIA" },
    ],
  },
  {
    id: "piotr-kowalski-sprzedawca",
    employee: "Piotr Kowalski",
    standardId: "sprzedawca",
    standardVersion: "v1.0",
    startedAt: "14.09.2026",
    targetDate: "05.10.2026",
    owner: "Anna Wiśniewska",
    status: "W TOKU",
    tasks: [
      { standardTaskId: "s-01", status: "GOTOWE", completedAt: "14.09.2026" },
      { standardTaskId: "s-02", status: "W TOKU" },
      { standardTaskId: "s-03", status: "DO WYKONANIA" },
    ],
  },
  {
    id: "marek-zielinski-produkcja",
    employee: "Marek Zieliński",
    standardId: "produkcja",
    standardVersion: "v1.1",
    startedAt: "11.09.2026",
    targetDate: "02.10.2026",
    owner: "Jan Kowalski",
    status: "W TOKU",
    tasks: [
      { standardTaskId: "p-01", status: "GOTOWE", completedAt: "11.09.2026" },
      { standardTaskId: "p-02", status: "W TOKU" },
      { standardTaskId: "p-03", status: "DO WYKONANIA" },
    ],
  },
];

export function getProcessProgress(process: OnboardingProcess) {
  const completed = process.tasks.filter((task) => task.status === "GOTOWE").length;
  return {
    completed,
    total: process.tasks.length,
    percent: Math.round((completed / process.tasks.length) * 100),
  };
}
