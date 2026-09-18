import AppPlaceholder from "@/components/app-shell/AppPlaceholder";

export default function Page() {
  return (
    <AppPlaceholder
      kicker="BOS / ONBOARDING / PRZYGOTUJ"
      title="Standardy stanowisk"
      description="Tutaj powstanie właściwa warstwa tworzenia i wersjonowania Standardu Stanowiska."
      scope={["Lista standardów","Wersje standardu","Czynności i kryteria","Utworzenie nowego standardu"]}
    />
  );
}
