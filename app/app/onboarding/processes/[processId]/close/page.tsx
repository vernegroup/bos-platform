export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProcess, getProcessProgress, getStandard } from "@/lib/bos/onboardingRepository";

export default async function CloseProcessPage({ params }: { params: Promise<{ processId: string }> }) {
  const { processId } = await params;
  const process = await getProcess(processId);
  if (!process) notFound();
  const standard = await getStandard(process.standardId);
  if (!standard) notFound();
  const progress = getProcessProgress(process);
  const ready = progress.percent === 100;

  return (
    <>
      <div className="bos-standard-back"><Link href={`/app/onboarding/processes/${process.id}`}>← KARTA POSTĘPU</Link></div>
      <section className="bos-app-intro">
        <div><div className="bos-app-kicker">BOS / ONBOARDING / WERYFIKACJA</div><h1>Zamknij wdrożenie</h1><p>{process.employee} · {standard.name} · Standard {process.standardVersion}</p></div>
        <div className="bos-app-build-state"><span>GOTOWOŚĆ</span><strong>{ready ? "GOTOWE DO WERYFIKACJI" : "NIEGOTOWE"}</strong></div>
      </section>
      <section className="bos-close-gate">
        <div><span>01</span><strong>Karta Postępu</strong><b>{progress.completed}/{progress.total}</b></div>
        <div><span>02</span><strong>Kryteria gotowości</strong><b>{ready ? "POTWIERDZONE" : "NIEPEŁNE"}</b></div>
        <div><span>03</span><strong>Weryfikacja managera</strong><b>{ready ? "DO WYKONANIA" : "ZABLOKOWANA"}</b></div>
        <div><span>04</span><strong>Karta Zakończenia</strong><b>{ready ? "DO UTWORZENIA" : "ZABLOKOWANA"}</b></div>
      </section>
      <section className="bos-process-new-lock">
        <span>WYNIK</span><div><strong>{ready ? "ZAMKNIJ I UTWÓRZ REKORD HISTORYCZNY" : "ZAMKNIĘCIE NIEDOSTĘPNE"}</strong><p>{ready ? "Warstwa persistence potrafi utworzyć Kartę Zakończenia transakcyjnie. Interaktywny formularz zostanie podłączony po wdrożeniu użytkowników i uprawnień." : "Najpierw wszystkie wymagane czynności muszą otrzymać status GOTOWE."}</p></div>
      </section>
    </>
  );
}
