import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBOSAccess } from "@/lib/bos/access";
import { getPromotionProcess } from "@/lib/bos/promotionsRepository";

export const dynamic = "force-dynamic";

export default async function PromotionProcessPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireBOSAccess();
  const { id } = await params;
  const process = await getPromotionProcess(access, id);
  if (!process) notFound();

  const done = process.checks.filter((check) => check.status === "DONE").length;
  const percent = process.checks.length ? Math.round((done / process.checks.length) * 100) : 0;
  const ready = process.checks.length > 0 && done === process.checks.length;

  return (
    <>
      <div className="bos-standard-back"><Link href="/app/promotions/processes">← ZMIANY W TOKU</Link></div>

      <section className="bos-app-intro bos-promotions-detail-head">
        <div>
          <div className="bos-app-kicker">BOS / PROMOTIONS / KARTA ZMIANY</div>
          <h1>{process.employee}</h1>
          <p>{process.fromRole} → {process.toRole} · {process.type}</p>
        </div>
        <div className="bos-app-build-state"><span>STATUS</span><strong>{ready ? "GOTOWE DO ZAMKNIĘCIA" : "W REALIZACJI"}</strong></div>
      </section>

      <section className="bos-promotion-process-summary">
        <div><span>TYP ZMIANY</span><strong>{process.type}</strong></div>
        <div><span>START</span><strong>{process.startedOn}</strong></div>
        <div><span>WEJŚCIE</span><strong>{process.effectiveOn}</strong></div>
        <div><span>PROWADZĄCY</span><strong>{process.owner}</strong></div>
        <div><span>KONTROLA</span><strong>{done}/{process.checks.length}</strong></div>
        <div className="bos-promotion-summary-progress"><i style={{ width: `${percent}%` }} /></div>
      </section>

      <section className="bos-promotion-gate-strip" aria-label="Etapy procesu zmiany stanowiska">
        {["Decyzja", "Przygotowanie", "Przejście", "Weryfikacja", "Zapis"].map((stage, index) => (
          <div key={stage} data-state={index < 3 ? "complete" : index === 3 ? "current" : "pending"}>
            <span>{String(index + 1).padStart(2, "0")}</span><strong>{stage}</strong>
          </div>
        ))}
      </section>

      <section className="bos-promotion-checks bos-promotions-check-workspace">
        <header><span>LP.</span><span>KROK KONTROLNY</span><span>KRYTERIUM GOTOWOŚCI</span><span>STATUS</span><span>DATA</span></header>
        {process.checks.map((check) => (
          <div key={check.id}>
            <span>{String(check.position).padStart(2, "0")}</span>
            <strong>{check.name}</strong>
            <p>{check.criterion}</p>
            <b data-status={check.status}>{check.status === "DONE" ? "GOTOWE" : "DO WYKONANIA"}</b>
            <time>{check.status === "DONE" ? check.completedAt : "—"}</time>
          </div>
        ))}
      </section>

      <section className="bos-promotion-next">
        <div>
          <span className="bos-dashboard-section-kicker">NASTĘPNY KROK</span>
          <strong>{ready ? "Proces gotowy do końcowej weryfikacji" : "Potwierdź pozostałe kryteria gotowości"}</strong>
          <p>Rekord historyczny powstaje dopiero po zakończeniu kontroli i zapisaniu wyniku zmiany stanowiska.</p>
        </div>
        <div><strong>{percent}%</strong><span>{ready ? "GOTOWE" : "W REALIZACJI"}</span></div>
      </section>
    </>
  );
}
