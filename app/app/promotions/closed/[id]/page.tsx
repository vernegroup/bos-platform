import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBOSAccess } from "@/lib/bos/access";
import { getPromotionClosure } from "@/lib/bos/promotionsRepository";
export const dynamic="force-dynamic";
export default async function PromotionClosurePage({params}:{params:Promise<{id:string}>}){
 const access=await requireBOSAccess(); const {id}=await params;
 const closure=await getPromotionClosure(access,id); if(!closure) notFound();
 const result=closure.result==="READY"?"GOTOWY":"STOP";
 return <>
  <div className="bos-standard-back"><Link href="/app/promotions/closed">← HISTORIA ZMIAN</Link></div>
  <section className="bos-app-intro bos-promotions-detail-head"><div>
   <div className="bos-app-kicker">BOS / PROMOTIONS / REKORD HISTORYCZNY</div>
   <h1>{closure.employee}</h1><p>{closure.fromRole} → {closure.toRole} · {closure.type}</p>
  </div><div className="bos-app-build-state"><span>WYNIK</span><strong>{result}</strong></div></section>
  <section className="bos-promotion-closure-summary">
   <div><span>TYP ZMIANY</span><strong>{closure.type}</strong></div>
   <div><span>STANDARD</span><strong>{closure.standardName} · {closure.standardVersion}</strong></div>
   <div><span>PROWADZĄCY</span><strong>{closure.owner}</strong></div>
   <div><span>ZAMKNIĘCIE</span><strong>{closure.closedAt}</strong></div>
   <div><span>ZAMKNĄŁ</span><strong>{closure.closer}</strong></div>
   <div><span>DECYZJA</span><strong>#{closure.decisionSequence} · {closure.decidedAt}</strong></div>
  </section>
  <section className="bos-promotion-closure-result"><div>
   <span className="bos-dashboard-section-kicker">DECYZJA</span><h2>Karta zamknięcia zmiany</h2>
   <p>{closure.decisionNote||"Brak dodatkowej notatki."}</p>
  </div><div><span>REZULTAT</span><strong>{result}</strong></div></section>
  <section className="bos-process-new" style={{display:"grid",gap:12}}>
   <span className="bos-dashboard-section-kicker">FINAL INTEGRITY GATE / SNAPSHOT DECYZJI</span>
   <div className="bos-promotions-commandbar">
    {Object.entries({STANDARD:closure.gateSnapshot.standard,PROCES:closure.gateSnapshot.process,"OCENA WEJŚCIOWA":closure.gateSnapshot.entry,WDROŻENIE:closure.gateSnapshot.deployment,K:closure.gateSnapshot.k,GOTOWOŚĆ:closure.gateSnapshot.readiness,PRZEJŚCIE:closure.gateSnapshot.transition}).map(([gate,passed])=><div key={gate}><span>{gate}</span><strong>{passed?"PASS":"—"}</strong></div>)}
   </div>
   <p>To stan siedmiu bramek zapisany w chwili decyzji. Późniejsze zmiany Standardu lub innych procesów nie zmieniają tego rekordu.</p>
  </section>
  <section className="bos-promotion-record"><span className="bos-dashboard-section-kicker">TRWAŁY REKORD</span>
   <strong>{closure.employee} / {closure.fromRole} → {closure.toRole}</strong>
   <p>Rekord zachowuje znaczenie decyzji i wersję Standardu z chwili procesu.</p>
  </section>
 </>;
}