import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listStandards } from "@/lib/bos/onboardingRepository";
export const dynamic="force-dynamic";

export default async function StandardsPage(){
 const access=await requireBOSAccess();
 const standards=await listStandards(access.organization.id);
 const active=standards.filter(s=>s.status==="AKTYWNY").length;
 return <>
  <section className="bos-app-intro bos-onboarding-view-head">
   <div><div className="bos-app-kicker">01 / PRZYGOTUJ</div><h1>Standardy stanowisk</h1><p>Wzorce pracy używane do uruchamiania kolejnych wdrożeń. Opublikowana wersja pozostaje niezmienna dla procesów, które już z niej korzystają.</p></div>
   <Link href="/app/onboarding/standards/new" className="bos-standard-primary-action">+ NOWY STANDARD</Link>
  </section>
  <div className="bos-onboarding-commandbar">
   <div><span>WSZYSTKIE</span><strong>{standards.length}</strong></div>
   <div><span>AKTYWNE</span><strong>{active}</strong></div>
   <div><span>ARCHIWALNE / ROBOCZE</span><strong>{standards.length-active}</strong></div>
  </div>
  <section className="bos-standard-list bos-operational-list">
   <div className="bos-standard-list-head"><span>STANOWISKO</span><span>OBSZAR</span><span>WERSJA</span><span>CZYNNOŚCI</span><span>AKTUALIZACJA</span><span>STATUS</span><span /></div>
   {standards.map(s=><Link href={`/app/onboarding/standards/${s.id}`} className="bos-standard-list-row" key={s.id}><strong>{s.name}</strong><span>{s.area||"—"}</span><b>{s.currentVersion||"DRAFT"}</b><span>{"taskCount" in s ? s.taskCount : (s.versions.find(x=>x.version===s.currentVersion)?.tasks.length??0)}</span><span>{s.updatedAt||"—"}</span><em data-status={s.status}>{s.status}</em><i>→</i></Link>)}
   {!standards.length&&<div className="bos-operational-empty"><strong>Brak standardów</strong><p>Utwórz pierwszy Standard Stanowiska, aby przygotować wzorzec dla wdrożeń.</p></div>}
  </section>
  <div className="bos-onboarding-rule-note"><span>ZASADA WERSJONOWANIA</span><p>Nowa wersja standardu nie zmienia historycznych ani trwających wdrożeń rozpoczętych na wcześniejszej wersji.</p></div>
 </>;
}