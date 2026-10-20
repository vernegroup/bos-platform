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
   <p>Tu przygotowujesz i aktualizujesz opis pracy. Procesy Wdrożeń i Awansów korzystają z opublikowanej wersji Standardu; wersja robocza pozostaje do edycji.</p></div>
   <Link href="/app/standards/new" className="bos-standard-primary-action">+ NOWY STANDARD</Link>
  </section>
  <div className="bos-onboarding-commandbar bos-ux3-standard-counters">
   <div><span>WSZYSTKIE</span><strong>{standards.length}</strong></div>
   <div><span>AKTYWNE</span><strong>{active}</strong></div>
   <div><span>POZOSTAŁE STATUSY</span><strong>{standards.length-active}</strong></div>
  </div>
  <aside className="bos-guidance"><div><span className="bos-guidance-eyebrow">JAK PRACOWAĆ ZE STANDARDAMI</span><strong>Najpierw przygotuj, potem opublikuj</strong><p>Otwórz Standard, uzupełnij czynności, warunki rozpoczęcia i kryteria gotowości. Publikacja utrwala wersję do wykorzystania w procesach. Zmiany opublikowanej wersji przygotowuj jako nową wersję roboczą.</p></div><details><summary>? Co oznacza wersja robocza?</summary><p>Wersję roboczą można edytować. Opublikowana wersja pozostaje punktem odniesienia dla rozpoczętych procesów. Nie zmieniaj istniejącej wersji historycznej, aby poprawić nowy proces.</p></details></aside>
  <section className="bos-standard-list bos-operational-list bos-ux3-standard-library">
   <div className="bos-standard-list-head"><span>STANDARD</span><span>OBSZAR</span><span>WERSJA</span><span>CZYNNOŚCI</span><span>AKTUALIZACJA</span><span>STATUS</span><span>NASTĘPNE DZIAŁANIE</span></div>
   {standards.map(s=><Link href={`/app/standards/${s.id}`} className="bos-standard-list-row" key={s.id}>
    <strong>{s.name}</strong><span>{s.area||"—"}</span><b>{s.currentVersion||"ROBOCZA"}</b>
    <span>{String("taskCount" in s?s.taskCount:0)}</span><span>{s.updatedAt||"—"}</span><em data-status={s.status}>{s.status}</em><i className="bos-standard-open-button">{s.currentVersion?"OTWÓRZ STANDARD →":"UZUPEŁNIJ WERSJĘ ROBOCZĄ →"}</i>
   </Link>)}
   {!standards.length&&<div className="bos-operational-empty"><strong>Brak Standardów organizacji</strong><p>Utwórz pierwszy Standard. Będzie dostępny dla procesów BOS, które korzystają ze Standardów.</p></div>}
  </section>
  <div className="bos-onboarding-rule-note"><span>WSPÓLNY ZASÓB</span><p>Standard należy do organizacji. Produkt wykorzystuje jego opublikowaną wersję, ale nie staje się właścicielem Standardu.</p></div>
 </>;
}
