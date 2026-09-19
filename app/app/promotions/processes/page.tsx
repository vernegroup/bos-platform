import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listPromotionProcesses } from "@/lib/bos/promotionsRepository";

export const dynamic = "force-dynamic";

export default async function PromotionProcessesPage() {
  const access = await requireBOSAccess();
  const rows = await listPromotionProcesses(access);
  const promotions = rows.filter((row) => row.type === "AWANS").length;
  const ready = rows.filter((row) => row.total > 0 && row.done === row.total).length;

  return (
    <>
      <section className="bos-app-intro bos-promotions-view-head">
        <div>
          <div className="bos-app-kicker">01 / PRZEPROWADŹ</div>
          <h1>Zmiany w toku</h1>
          <p>Każdy awans lub przesunięcie poziome pozostaje osobnym procesem z właścicielem, datą wejścia i kontrolą kryteriów gotowości.</p>
        </div>
      </section>

      <div className="bos-promotions-commandbar">
        <div><span>W TOKU</span><strong>{rows.length}</strong></div>
        <div><span>AWANSE</span><strong>{promotions}</strong></div>
        <div><span>PRZESUNIĘCIA</span><strong>{rows.length - promotions}</strong></div>
        <div><span>GOTOWE DO ZAMKNIĘCIA</span><strong>{ready}</strong></div>
      </div>

      <section className="bos-promotion-list bos-promotions-operational-list">
        <header><span>PRACOWNIK</span><span>ZMIANA</span><span>TYP</span><span>WEJŚCIE</span><span>PROWADZĄCY</span><span>KONTROLA</span><span /></header>
        {rows.map((row) => {
          const percent = row.total ? Math.round((row.done / row.total) * 100) : 0;
          return (
            <Link href={`/app/promotions/processes/${row.id}`} className="bos-promotion-row" key={row.id}>
              <strong>{row.employee}</strong>
              <span>{row.fromRole} → {row.toRole}</span>
              <b>{row.type}</b>
              <span>{row.effectiveOn}</span>
              <span>{row.owner}</span>
              <div className="bos-promotion-row-progress"><i style={{ width: `${percent}%` }} /><em>{row.done}/{row.total} · {percent}%</em></div>
              <i>→</i>
            </Link>
          );
        })}
        {!rows.length && <div className="bos-operational-empty"><strong>Brak aktywnych zmian</strong><p>Procesy awansu i przesunięcia poziomego pojawią się tutaj po ich uruchomieniu.</p></div>}
      </section>

      <div className="bos-promotions-rule-note"><span>ZASADA PROCESU</span><p>Zmiana stanowiska zostaje zamknięta dopiero po potwierdzeniu wszystkich kryteriów i zapisaniu wyniku w historii organizacji.</p></div>
    </>
  );
}
