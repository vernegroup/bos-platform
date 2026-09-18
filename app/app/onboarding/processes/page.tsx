import AppPlaceholder from "@/components/app-shell/AppPlaceholder";

export default function Page() {
  return (
    <AppPlaceholder
      kicker="BOS / ONBOARDING / PRZEPROWADŹ"
      title="Wdrożenia w toku"
      description="Miejsce prowadzenia konkretnych wdrożeń na podstawie wybranej wersji Standardu Stanowiska."
      scope={["Nowe wdrożenie","Karta Postępu","Kontrola czynności","Powiązanie z wersją standardu"]}
    />
  );
}
