import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listPromotionClosures } from "@/lib/bos/promotionsRepository";

export const dynamic = "force-dynamic";

export default async function PromotionClosedPage() {
  const access = await requireBOSAccess();
  const rows = await listPromotionClosures(access);
  const recommendations = rows.filter((row) => row.result !== "COMPLETED").length;
  const promotions = rows.filter((row) => row.type === "AWANS").length;

  return (
    <>
      <section className="bos-app-intro bos-promotions-view-head">
        <div>
          <div className="bos-app-kicker">02 / ZAMKNIJ</div>
          <h1>Historia zmian</h1>
          <p>Zweryfikowane awanse i przesunięcia poziome zachowane jako trwałe rekordy wykonania procesu.</p>
        </div>
        <Link href="/app/promotions/processes" className="bos-dashboard-text-link">ZMIANY W TOKU →</Link>
      </section>

      <div className="bos-promotions-commandbar">
        <div><span>ZAMKNIĘTE</span><strong>{rows.length}</strong></div>
        <div><span>AWANSE</span><strong>{promotions}</strong></div>
        <div><span>PRZESUNIĘCIA</span><strong>{rows.length - promotions}</strong></div>
        <div><span>Z ZALECENIAMI</span><strong>{recommendations}</strong></div>
      </div>

      <section className="bos-promotion-history bos-promotions-operational-list">
        <header><span>WERYFIKACJA</span><span>PRACOWNIK</span><span>ZMIANA</span><span>TYP</span><span>WYNIK</span><span>WERYFIKUJĄCY</span><span /></header>
        {rows.map((row) => (
          <Link href={`/app/promotions/closed/${row.id}`} key={row.id}>
            <time>{row.verifiedAt}</time>
            <strong>{row.employee}</strong>
            <span>{row.fromRole} → {row.toRole}</span>
            <b>{row.type}</b>
            <em data-result={row.result}>{row.result === "COMPLETED" ? "ZAKOŃCZONE" : "Z ZALECENIAMI"}</em>
            <span>{row.verifier}</span>
            <i>→</i>
          </Link>
        ))}
        {!rows.length && <div className="bos-operational-empty"><strong>Brak historii zmian</strong><p>Zamknięte procesy Promotions pojawią się tutaj po końcowej weryfikacji.</p></div>}
      </section>

      <div className="bos-promotions-rule-note"><span>REKORD HISTORYCZNY</span><p>Zamknięcie zachowuje zakres zmiany, wynik weryfikacji, osobę weryfikującą oraz ewentualne zalecenia.</p></div>
    </>
  );
}
