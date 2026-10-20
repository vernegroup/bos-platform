import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listPromotionProcesses } from "@/lib/bos/promotionsRepository";

export const dynamic = "force-dynamic";

export default async function PromotionProcessesPage() {
  const access = await requireBOSAccess();
  const rows = await listPromotionProcesses(access);
  const promotions = rows.filter((row) => row.type === "AWANS").length;
  const ready = rows.filter((row) => row.gates.readyAllowed).length;

  return (
    <>
      <section className="bos-app-intro bos-promotions-view-head">
        <div>
          <div className="bos-app-kicker">01 / PRZEPROWADŹ</div>
          <h1>Przygotowanie do nowej roli</h1>
          <p>Otwórz proces, aby sprawdzić wymagania nowej roli, brakujące potwierdzenia i następne działania przed decyzją. Każda zmiana ma własnego prowadzącego i historię.</p>
        </div>
          <Link href="/app/promotions/processes/new" className="bos-standard-primary-action">+ NOWA ZMIANA</Link>
      </section>

      <div className="bos-promotions-commandbar">
        <div><span>W TOKU</span><strong>{rows.length}</strong></div>
        <div><span>AWANSE</span><strong>{promotions}</strong></div>
        <div><span>PRZESUNIĘCIA</span><strong>{rows.length - promotions}</strong></div>
        <div><span>GOTOWE DO DECYZJI</span><strong>{ready}</strong></div>
      </div>

      <section className="bos-promotion-list bos-promotions-operational-list">
        <header><span>PRACOWNIK</span><span>ZMIANA</span><span>TYP</span><span>WEJŚCIE</span><span>PROWADZĄCY</span><span>PRZED DECYZJĄ</span><span /></header>
        {rows.map((row) => {
          return (
            <Link href={`/app/promotions/processes/${row.id}`} className="bos-promotion-row" key={row.id}>
              <strong>{row.employee}</strong>
              <span>{row.fromRole} → {row.toRole}</span>
              <b>{row.type}</b>
              <span>{row.effectiveOn}</span>
              <span>{row.owner}</span>
              <span>{row.gates.readyAllowed?"7/7 · GOTOWY DO DECYZJI":`${7-[row.gates.standard,row.gates.process,row.gates.entry,row.gates.deployment,row.gates.k,row.gates.readiness,row.gates.transition].filter(Boolean).length} DO SPEŁNIENIA`}</span>
              <i>→</i>
            </Link>
          );
        })}
        {!rows.length && <div className="bos-operational-empty"><strong>Brak aktywnych zmian</strong><p>Procesy awansu i przesunięcia poziomego pojawią się tutaj po ich uruchomieniu.</p></div>}
      </section>

      <div className="bos-promotions-rule-note"><span>ZASADA PROCESU</span><p>Spełnienie bramek umożliwia podjęcie decyzji, ale nie zastępuje oceny człowieka. BOS zapisuje potwierdzenia i historię zmiany roli.</p></div>
    </>
  );
}
