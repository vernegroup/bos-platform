import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBOSAccess } from "@/lib/bos/access";
import { getPromotionClosure } from "@/lib/bos/promotionsRepository";

export const dynamic = "force-dynamic";

export default async function PromotionClosurePage({ params }: { params: Promise<{ id: string }> }) {
  const access = await requireBOSAccess();
  const { id } = await params;
  const closure = await getPromotionClosure(access, id);
  if (!closure) notFound();

  const result = closure.result === "COMPLETED" ? "ZAKOŃCZONE" : "ZAKOŃCZONE Z ZALECENIAMI";

  return (
    <>
      <div className="bos-standard-back"><Link href="/app/promotions/closed">← HISTORIA ZMIAN</Link></div>

      <section className="bos-app-intro bos-promotions-detail-head">
        <div>
          <div className="bos-app-kicker">BOS / AWANSE / REKORD HISTORYCZNY</div>
          <h1>{closure.employee}</h1>
          <p>{closure.fromRole} → {closure.toRole} · {closure.type}</p>
        </div>
        <div className="bos-app-build-state"><span>WYNIK</span><strong>{result}</strong></div>
      </section>

      <section className="bos-promotion-closure-summary">
        <div><span>TYP ZMIANY</span><strong>{closure.type}</strong></div>
        <div><span>START</span><strong>{closure.startedOn}</strong></div>
        <div><span>WEJŚCIE</span><strong>{closure.effectiveOn}</strong></div>
        <div><span>PROWADZĄCY</span><strong>{closure.owner}</strong></div>
        <div><span>WERYFIKACJA</span><strong>{closure.verifiedAt}</strong></div>
        <div><span>WERYFIKUJĄCY</span><strong>{closure.verifier}</strong></div>
      </section>

      <section className="bos-promotion-closure-result">
        <div>
          <span className="bos-dashboard-section-kicker">WYNIK WERYFIKACJI</span>
          <h2>Karta zamknięcia zmiany</h2>
          <p>{closure.summary}</p>
        </div>
        <div><span>REZULTAT</span><strong>{result}</strong></div>
      </section>

      <section className="bos-promotion-closure-path" aria-label="Zakończone etapy procesu">
        {["Decyzja", "Przygotowanie", "Przejście", "Weryfikacja", "Zapis historii"].map((stage, index) => (
          <div key={stage}><span>{String(index + 1).padStart(2, "0")}</span><strong>{stage}</strong><b>POTWIERDZONE</b></div>
        ))}
      </section>

      {closure.recommendations && (
        <section className="bos-promotion-recommendation">
          <span>ZALECENIE PO WERYFIKACJI</span>
          <p>{closure.recommendations}</p>
        </section>
      )}

      <section className="bos-promotion-record">
        <span className="bos-dashboard-section-kicker">TRWAŁY REKORD</span>
        <strong>{closure.employee} / {closure.fromRole} → {closure.toRole}</strong>
        <p>Ten zapis dokumentuje wynik zakończonej zmiany stanowiska i pozostaje częścią historii organizacji.</p>
      </section>
    </>
  );
}
