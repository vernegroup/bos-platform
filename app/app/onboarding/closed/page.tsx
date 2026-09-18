import AppPlaceholder from "@/components/app-shell/AppPlaceholder";

export default function Page() {
  return (
    <AppPlaceholder
      kicker="BOS / ONBOARDING / ZAMKNIJ"
      title="Zakończone wdrożenia"
      description="Historia zweryfikowanych i zamkniętych procesów wdrożenia w organizacji."
      scope={["Karta Zakończenia","Wynik procesu","Wersja użytego standardu","Historia wdrożeń"]}
    />
  );
}
