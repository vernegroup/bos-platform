import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listStandards } from "@/lib/bos/core/standardRepository";
export const dynamic="force-dynamic";

export default async function OrganizationStandardsPage(){
 const access=await requireBOSAccess();
 const standards=await listStandards(access.organization.id);
 const active=standards.filter(s=>s.status==="AKTYWNY").length;
 return <>
  <section className="bos-app-intro">
   <div><div className="bos-app-kicker">BOS / ZASOBY ORGANIZACJI</div><h1>Standardy organizacji</h1>
   <p>Jedno repozytorium definicji pracy dla produktów BOS. Standard utworzony tutaj może być używany przez Onboarding i Promotions bez kopiowania danych.</p></div>
   <Link href="/app/standards/new" className="bos-standard-primary-action">+ NOWY STANDARD</Link>
  </section>
  <div className="bos-onboarding-commandbar">
   <div><span>WSZYSTKIE</span><strong>{standards.length}</strong></div>
   <div><span>AKTYWNE</span><strong>{active}</strong></div>
   <div><span>ROBOCZE / ARCHIWALNE</span><strong>{standards.length-active}</strong></div>
  </div>
  <section className="bos-standard-list bos-operational-list">
   <div className="bos-standard-list-head"><span>STANDARD</span><span>OBSZAR</span><span>WERSJA</span><span>CZYNNOŚCI</span><span>AKTUALIZACJA</span><span>STATUS</span><span /></div>
   {standards.map(s=><Link href={`/app/onboarding/standards/${s.id}`} className="bos-standard-list-row" key={s.id}>
    <strong>{s.name}</strong><span>{s.area||"—"}</span><b>{s.currentVersion||"DRAFT"}</b>
    <span>{String("taskCount" in s?s.taskCount:0)}</span><span>{s.updatedAt||"—"}</span><em data-status={s.status}>{s.status}</em><i>→</i>
   </Link>)}
   {!standards.length&&<div className="bos-operational-empty"><strong>Brak Standardów organizacji</strong><p>Utwórz pierwszy Standard. Będzie dostępny dla procesów BOS, które korzystają ze Standardów.</p></div>}
  </section>
  <div className="bos-onboarding-rule-note"><span>WSPÓLNY ZASÓB</span><p>Standard należy do organizacji. Produkt wykorzystuje jego opublikowaną wersję, ale nie staje się właścicielem Standardu.</p></div>
 </>;
}
