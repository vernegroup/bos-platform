import Link from "next/link";
import { listStandards } from "@/lib/bos/onboardingRepository";

export const dynamic = "force-dynamic";
export default async function NewProcessPage() {
  const onboardingStandards = await listStandards();
  return (
    <>
      <div className="bos-standard-back"><Link href="/app/onboarding/processes">← WDROŻENIA W TOKU</Link></div>
      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / ONBOARDING / NOWE WDROŻENIE</div>
          <h1>Rozpocznij wdrożenie</h1>
          <p>Najpierw wybierasz pracownika i dokładną wersję Standardu Stanowiska. Po uruchomieniu ta wersja pozostaje przypisana do procesu.</p>
        </div>
        <div className="bos-app-build-state"><span>ZAPIS</span><strong>PERSISTENCE / GOTOWE</strong></div>
      </section>
      <section className="bos-process-new">
        <div className="bos-process-new-field"><span>01 / PRACOWNIK</span><strong>Wybierz lub dodaj pracownika</strong><small>Docelowo źródło: użytkownicy / dane organizacji</small></div>
        <div className="bos-process-new-field"><span>02 / STANDARD</span><strong>Wybierz Standard Stanowiska</strong><div className="bos-process-standard-options">{onboardingStandards.map((s)=><div key={s.id}><b>{s.name}</b><em>{s.currentVersion}</em><small>{s.area}</small></div>)}</div></div>
        <div className="bos-process-new-field"><span>03 / TERMIN I PROWADZĄCY</span><strong>Ustal ramy procesu</strong><small>Data startu, termin docelowy i osoba odpowiedzialna.</small></div>
        <div className="bos-process-new-lock"><span>04</span><div><strong>UTWÓRZ KARTĘ POSTĘPU</strong><p>Warstwa persistence obsługuje utworzenie procesu i jego czynności. Formularz zostanie aktywowany po wdrożeniu tożsamości użytkowników w punkcie 12–13.</p></div></div>
      </section>
    </>
  );
}
