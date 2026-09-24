import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBOSAccess } from "@/lib/bos/access";
import { getEmployeeOperationalHistory } from "@/lib/bos/core/employeeRepository";

export const dynamic="force-dynamic";
const datePL=(value?:string)=>value?new Intl.DateTimeFormat("pl-PL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(value)):"—";
const statusPL=(value:string)=>value==="PLANNED"?"PLANOWANE":value==="IN_PROGRESS"?"W TOKU":value==="PAUSED"?"WSTRZYMANE":value==="CLOSED"?"ZAMKNIĘTE":value;
const decisionPL=(value?:string)=>value==="READY"?"GOTOWY":value==="NOT_YET"?"JESZCZE NIE":value==="STOP"?"STOP":"—";

export default async function EmployeeHistoryPage({params}:{params:Promise<{employeeId:string}>}){
 const {employeeId}=await params;const access=await requireBOSAccess();
 const history=await getEmployeeOperationalHistory({organizationId:access.organization.id,employeeId});
 if(!history) notFound();
 return <>
  <div className="bos-standard-back"><Link href="/app/onboarding/processes">← WDROŻENIA</Link></div>
  <section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / ONBOARDING / HISTORIA PRACOWNIKA</div>
   <h1>{history.employee.displayName}</h1><p>Historia wdrożeń wynika z zapisanych procesów i decyzji. Nie jest osobnym, ręcznie edytowanym dossier.</p></div>
   <div className="bos-app-build-state"><span>PRACOWNIK</span><strong>{history.employee.status==="ACTIVE"?"AKTYWNY":history.employee.status==="INACTIVE"?"NIEAKTYWNY":history.employee.status}</strong></div>
  </section>
  <div className="bos-onboarding-commandbar">
   <div><span>WDROŻENIA</span><strong>{history.onboarding.length}</strong></div>
   <div><span>STANOWISKO</span><strong>{history.employee.position||"—"}</strong></div>
   <div><span>DZIAŁ</span><strong>{history.employee.department||"—"}</strong></div>
  </div>
  <section className="bos-process-list bos-operational-list">
   <div className="bos-process-list-head"><span>STANDARD</span><span>WERSJA</span><span>START</span><span>STATUS</span><span>DECYZJA</span><span>WERYFIKACJA</span><span /></div>
   {history.onboarding.map(item=>{const href=item.processStatus==="CLOSED"&&item.latestClosureId?`/app/onboarding/closed/${item.latestClosureId}`:`/app/onboarding/processes/${item.processId}`;return <Link href={href} className="bos-process-list-row" key={item.processId}>
    <strong>{item.standardName}</strong><b>{item.standardVersion}</b><span>{datePL(item.startedOn)}</span><span>{statusPL(item.processStatus)}</span>
    <span>{decisionPL(item.latestDecision)}{item.decisionCount>1?` · #${item.decisionCount}`:""}</span><span>{datePL(item.latestDecisionAt)}</span><i aria-hidden="true">→</i>
   </Link>})}
   {!history.onboarding.length&&<div className="bos-operational-empty"><strong>Brak historii wdrożeń</strong><p>Ten pracownik nie ma jeszcze procesu Onboarding w BOS.</p></div>}
  </section>
 </>;
}
