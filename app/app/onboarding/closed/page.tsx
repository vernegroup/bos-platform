import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listClosures,listStandards } from "@/lib/bos/onboardingRepository";
export const dynamic="force-dynamic";

export default async function ClosedPage(){
 const access=await requireBOSAccess();const org=access.organization.id;
 const [closures,standards]=await Promise.all([listClosures(org),listStandards(org)]);
 const ready=closures.filter(c=>c.result==="GOTOWY").length; const notYet=closures.filter(c=>c.result==="JESZCZE NIE").length; const stopped=closures.filter(c=>c.result==="STOP").length;
 return <>
  <section className="bos-app-intro bos-onboarding-view-head">
   <div><div className="bos-app-kicker">03 / ZAMKNIJ</div><h1>Historia decyzji i zakończeń</h1><p>Trwałe decyzje procesu wraz z pracownikiem, wersją Standardu Stanowiska i rezultatem weryfikacji. JESZCZE NIE jest decyzją pośrednią, nie zakończeniem wdrożenia.</p></div>
   <Link href="/app/onboarding/processes" className="bos-dashboard-text-link">WDROŻENIA W TOKU →</Link>
  </section>
  <div className="bos-onboarding-commandbar">
   <div><span>REKORDY DECYZJI</span><strong>{closures.length}</strong></div>
   <div><span>GOTOWY</span><strong>{ready}</strong></div><div><span>JESZCZE NIE</span><strong>{notYet}</strong></div><div><span>STOP</span><strong>{stopped}</strong></div>
  </div>
  <section className="bos-closure-list bos-operational-list">
   <div className="bos-closure-list-head"><span>PRACOWNIK</span><span>STANDARD</span><span>WERSJA</span><span>START</span><span>DECYZJA</span><span>WYNIK</span><span /></div>
   {closures.map(c=>{const s=standards.find(x=>x.id===c.standardId);return <Link href={`/app/onboarding/closed/${c.id}`} className="bos-closure-list-row" key={c.id}><strong>{c.employee}</strong><span>{s?.name??"Standard"}</span><b>{c.standardVersion}</b><span>{c.startedAt}</span><span>{c.closedAt}</span><em data-result={c.result}>{c.result}</em><i>→</i></Link>})}
   {!closures.length&&<div className="bos-operational-empty"><strong>Brak historii</strong><p>Zamknięte wdrożenia pojawią się tutaj jako trwałe rekordy procesu.</p></div>}
  </section>
  <div className="bos-onboarding-rule-note"><span>REKORD HISTORYCZNY</span><p>Każda nowa decyzja zachowuje niezmienny stan procesu z chwili jej podjęcia. GOTOWY i STOP kończą wdrożenie; JESZCZE NIE zachowuje postęp i pozwala kontynuować.</p></div>
 </>;
}