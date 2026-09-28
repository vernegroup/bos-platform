import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBOSAccess } from "@/lib/bos/access";
import { addPromotionTransitionItem, advancePromotionDeployment, confirmPromotionTransitionItem, finalizePromotionDecision, getPromotionProcess, savePromotionAssessment, savePromotionReadiness, verifyPromotionAssessment } from "@/lib/bos/promotionsRepository";

export const dynamic="force-dynamic";
const text=(fd:FormData,key:string)=>String(fd.get(key)??"").trim();

async function saveAssessment(fd:FormData){
 "use server";
 const access=await requireBOSAccess();
 const processId=text(fd,"processId");
 await savePromotionAssessment(access,{
  processId,processTaskId:text(fd,"processTaskId"),
  assessment:text(fd,"assessment") as "CONFIRMED"|"TO_VERIFY"|"TO_DEPLOY",
  evidenceNote:text(fd,"evidenceNote")||undefined
 });
 revalidatePath(`/app/promotions/processes/${processId}`);
 redirect(`/app/promotions/processes/${processId}`);
}

const label=(v?:string)=>v==="CONFIRMED"?"POTWIERDZONE":v==="TO_VERIFY"?"DO SPRAWDZENIA":v==="TO_DEPLOY"?"DO WDROŻENIA":"BRAK OCENY";

async function verifyAssessment(fd:FormData){
 "use server"; const access=await requireBOSAccess(); const processId=text(fd,"processId");
 await verifyPromotionAssessment(access,{processId,assessmentId:text(fd,"assessmentId"),result:text(fd,"result") as "PASS"|"FAIL",note:text(fd,"verificationNote")||undefined});
 revalidatePath(`/app/promotions/processes/${processId}`); redirect(`/app/promotions/processes/${processId}`);
}
async function advanceStage(fd:FormData){
 "use server"; const access=await requireBOSAccess(); const processId=text(fd,"processId");
 await advancePromotionDeployment(access,{processId,assessmentId:text(fd,"assessmentId"),stage:text(fd,"stage") as "EXPLAINED"|"SHOWN"|"TOGETHER"|"SOLO"|"CHECKED",note:text(fd,"stageNote")||undefined});
 revalidatePath(`/app/promotions/processes/${processId}`); redirect(`/app/promotions/processes/${processId}`);
}
const stages=[["EXPLAINED","WYJAŚNIJ","explained"],["SHOWN","POKAŻ","shown"],["TOGETHER","RAZEM","together"],["SOLO","SAM","solo"],["CHECKED","SPRAWDŹ","checked"]] as const;
async function saveReadiness(fd:FormData){"use server";const access=await requireBOSAccess();const processId=text(fd,"processId");await savePromotionReadiness(access,{processId,checkId:text(fd,"checkId"),result:text(fd,"result") as "PASS"|"FAIL",note:text(fd,"note")||undefined});revalidatePath(`/app/promotions/processes/${processId}`);redirect(`/app/promotions/processes/${processId}`);}
async function addTransition(fd:FormData){"use server";const access=await requireBOSAccess();const processId=text(fd,"processId");await addPromotionTransitionItem(access,{processId,item:text(fd,"item"),disposition:text(fd,"disposition") as "TRANSFER"|"RETAIN"|"CHANGE"|"NOT_APPLICABLE"});revalidatePath(`/app/promotions/processes/${processId}`);redirect(`/app/promotions/processes/${processId}`);}
async function confirmTransition(fd:FormData){"use server";const access=await requireBOSAccess();const processId=text(fd,"processId");await confirmPromotionTransitionItem(access,{processId,itemId:text(fd,"itemId"),confirmation:text(fd,"confirmation") as "DONE"|"NOT_DONE",note:text(fd,"note")||undefined});revalidatePath(`/app/promotions/processes/${processId}`);redirect(`/app/promotions/processes/${processId}`);}
async function decide(fd:FormData){"use server";const access=await requireBOSAccess();const processId=text(fd,"processId");const decision=text(fd,"decision") as "READY"|"NOT_YET"|"STOP";const result=await finalizePromotionDecision(access,{processId,decision,note:text(fd,"note")||undefined});if(result.closureId){redirect(`/app/promotions/closed/${result.closureId}`);}revalidatePath(`/app/promotions/processes/${processId}`);redirect(`/app/promotions/processes/${processId}`);}


export default async function PromotionProcessPage({params}:{params:Promise<{id:string}>}){
 const {id:processId}=await params; const access=await requireBOSAccess();
 const p=await getPromotionProcess(access,processId); if(!p) notFound();
 const assessed=p.tasks.filter(t=>t.initialAssessment).length;
 const passed=[p.gates.standard,p.gates.process,p.gates.entry,p.gates.deployment,p.gates.k,p.gates.readiness,p.gates.transition].filter(Boolean).length;
 const readinessPassed=p.readiness.filter(x=>x.result==="PASS").length;
 const transitionDone=p.transition.filter(x=>x.confirmation==="DONE").length;
 return <>
  <div className="bos-standard-back"><Link href="/app/promotions/processes">← ZMIANY W TOKU</Link></div>
  <nav className="bos-guided-flow" aria-label="Etapy BOS Promotions">
   <a href="#assessment" className={!p.gates.entry?"is-active":""}><span>01</span><strong>OCEŃ</strong><small>Stan wejściowy</small></a>
   <a href="#deployment" className={p.gates.entry&&!p.gates.deployment?"is-active":""}><span>02</span><strong>PRZEPROWADŹ</strong><small>Wymagane wdrożenie</small></a>
   <a href="#verification" className={p.gates.deployment&&!p.gates.transition?"is-active":""}><span>03</span><strong>ZWERYFIKUJ</strong><small>Gotowość i przekazanie</small></a>
   <a href="#decision" className={p.gates.readyAllowed?"is-active":""}><span>04</span><strong>ZDECYDUJ</strong><small>Wynik i historia</small></a>
  </nav>

  <section className="bos-app-intro bos-promotions-view-head"><div>
   <div className="bos-app-kicker">BOS / PROMOTIONS / PROCES A → B</div>
   <h1>{p.employee}</h1><p>{p.fromRole} → {p.toRole} · {p.type} · prowadzący: {p.owner}</p>
  </div><div className="bos-app-build-state"><span>STANDARD ROLI B</span><strong>{p.standardName} · {p.standardVersion}</strong></div></section>

  <section className="bos-process-summary">
   <div><span>START</span><strong>{p.startedOn}</strong></div><div><span>WEJŚCIE W ROLĘ B</span><strong>{p.effectiveOn||"—"}</strong></div>
   <div><span>OCENA WEJŚCIOWA</span><strong>{assessed}/{p.tasks.length}</strong></div><div><span>K — KRYTYCZNE</span><strong>{p.tasks.filter(t=>t.isCritical).length}</strong></div>
   <div><span>BRAMKI</span><strong>{passed}/7</strong></div>
  </section>

  <section className="bos-promotion-gate-strip" aria-label="Final Integrity Gate">
   {([["STANDARD",p.gates.standard],["PROCESS",p.gates.process],["ENTRY",p.gates.entry],["DEPLOYMENT",p.gates.deployment],["K",p.gates.k],["READINESS",p.gates.readiness],["TRANSITION",p.gates.transition]] as const).map(([name,ok],i)=><div key={name} data-state={ok?"complete":i===passed?"current":"pending"}><span>{String(i+1).padStart(2,"0")}</span><strong>{name}</strong><b>{ok?"PASS":"—"}</b></div>)}
  </section>

  <section className="bos-process-card" id="assessment">
   <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">01 / OCEŃ</span><h2>Stan wejściowy względem roli B</h2></div><span className="bos-dashboard-count">{assessed} z {p.tasks.length} ocenionych</span></div>
   <aside className="bos-context-guide"><strong>WSKAZÓWKA BOS · OCENA WEJŚCIOWA</strong><p>POTWIERDZONE oznacza wystarczający dowód. DO SPRAWDZENIA wymaga weryfikacji. DO WDROŻENIA uruchamia pełne pięć etapów BOS. Czynność K zawsze przechodzi rzeczywiste wdrożenie.</p></aside>
   <div className="bos-promotion-assessment-list">
   {p.tasks.map(t=><article className="bos-promotion-assessment-row" key={t.id}>
    <div className="bos-promotion-assessment-copy"><span>{String(t.position).padStart(2,"0")}{t.isCritical?" · K":""}</span><strong>{t.name}</strong><small>Stan: {label(t.effectiveAssessment||t.initialAssessment)}</small></div>
    <form action={saveAssessment} className="bos-promotion-assessment-form">
     <input type="hidden" name="processId" value={p.id}/><input type="hidden" name="processTaskId" value={t.id}/>
     <select name="assessment" required defaultValue={t.initialAssessment??""} disabled={Boolean(t.verificationResult)}>
      {!t.initialAssessment&&<option value="" disabled>Wybierz ocenę</option>}<option value="CONFIRMED">POTWIERDZONE</option><option value="TO_VERIFY">DO SPRAWDZENIA</option><option value="TO_DEPLOY">DO WDROŻENIA</option>
     </select>
     <input name="evidenceNote" defaultValue={t.evidenceNote??""} placeholder="Dowód / uwaga" disabled={Boolean(t.verificationResult)}/>
     {!t.verificationResult&&<button type="submit">ZAPISZ</button>}
    </form>
    {t.initialAssessment==="TO_VERIFY"&&!t.verificationResult&&<form action={verifyAssessment} className="bos-promotion-verify-form"><input type="hidden" name="processId" value={p.id}/><input type="hidden" name="assessmentId" value={t.assessmentId}/><input name="verificationNote" placeholder="Co sprawdzono?"/><button name="result" value="PASS">PASS</button><button name="result" value="FAIL">FAIL</button></form>}
   </article>)}
   </div>
  </section>

  <section className="bos-process-card" id="deployment">
   <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">02 / PRZEPROWADŹ</span><h2>Wymagane wdrożenie</h2></div><span className="bos-dashboard-count">WYJAŚNIJ → POKAŻ → RAZEM → SAM → SPRAWDŹ</span></div>
   <aside className="bos-context-guide"><strong>WSKAZÓWKA BOS · 5 ETAPÓW</strong><p>Realizuj tylko czynności oznaczone DO WDROŻENIA. Etapów nie można przeskakiwać. Dla K pełna ścieżka jest obowiązkowa niezależnie od oceny wejściowej.</p></aside>
   <div className="bos-promotion-deployment-list">{p.tasks.filter(t=>t.effectiveAssessment==="TO_DEPLOY"&&t.assessmentId).map(t=><article className="bos-promotion-deployment-row" key={t.id}>
    <div><span>{String(t.position).padStart(2,"0")}{t.isCritical?" · K":""}</span><strong>{t.name}</strong></div>
    <div className="bos-process-stage-flow">{stages.map(([stage,title,key],i)=>{const done=Boolean(t.stages[key]);const previousDone=i===0||Boolean(t.stages[stages[i-1][2]]);return <form action={advanceStage} key={stage} className="bos-process-stage"><input type="hidden" name="processId" value={p.id}/><input type="hidden" name="assessmentId" value={t.assessmentId}/><input type="hidden" name="stage" value={stage}/><button className={done?"is-done":""} disabled={done||!previousDone}>{title}{done?" ✓":""}</button>{!done&&previousDone&&<input name="stageNote" placeholder="Notatka (opcjonalnie)"/>}</form>})}</div>
   </article>)}
   {!p.tasks.some(t=>t.effectiveAssessment==="TO_DEPLOY")&&<div className="bos-operational-empty"><strong>Brak czynności wymagających wdrożenia</strong><p>Po zakończeniu oceny wejściowej pojawią się tutaj wyłącznie czynności wymagające pełnej ścieżki BOS.</p></div>}
   </div>
  </section>

  <section className="bos-process-card" id="verification">
   <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">03 / ZWERYFIKUJ</span><h2>Gotowość i przekazanie roli</h2></div><span className="bos-dashboard-count">{readinessPassed}/{p.readiness.length} kryteriów · {transitionDone}/{p.transition.length} przekazanych</span></div>
   <div className="bos-promotions-verify-grid"><div>
    <h3>Readiness Gate</h3>{p.readiness.map(x=><form action={saveReadiness} className="bos-promotion-readiness-row" key={x.id}><input type="hidden" name="processId" value={p.id}/><input type="hidden" name="checkId" value={x.id}/><div><strong>{x.criterion}</strong><small>{x.method}</small></div>{x.result?<b data-result={x.result}>{x.result}</b>:<><input name="note" placeholder="Fakt z weryfikacji"/><button name="result" value="PASS">PASS</button><button name="result" value="FAIL">FAIL</button></>}</form>)}
   </div><div>
    <h3>Handover A → B</h3>{p.transition.map(x=><form action={confirmTransition} className="bos-promotion-transition-row" key={x.id}><input type="hidden" name="processId" value={p.id}/><input type="hidden" name="itemId" value={x.id}/><div><strong>{x.item}</strong><small>{x.disposition}</small></div>{x.confirmation==="DONE"?<b>DONE ✓</b>:<><input name="note" placeholder="Uwaga"/><button name="confirmation" value="DONE">WYKONANE</button><button name="confirmation" value="NOT_DONE">NIE</button></>}</form>)}
    <form action={addTransition} className="bos-promotion-transition-add"><input type="hidden" name="processId" value={p.id}/><input name="item" required placeholder="Co trzeba przekazać?"/><select name="disposition" defaultValue="TRANSFER"><option value="TRANSFER">PRZEKAŻ</option><option value="RETAIN">POZOSTAW</option><option value="CHANGE">ZMIEŃ</option><option value="NOT_APPLICABLE">N/D</option></select><button>DODAJ</button></form>
   </div></div>
  </section>

  <section className="bos-process-next bos-promotion-next" id="decision">
   <div><span className="bos-dashboard-section-kicker">04 / ZDECYDUJ</span><strong>{p.gates.readyAllowed?"Wszystkie bramki spełnione — możliwa decyzja GOTOWY":"Proces wymaga dalszej pracy"}</strong><p>GOTOWY jest dostępne dopiero przy 7/7. JESZCZE NIE zachowuje proces otwarty. STOP kończy wyłącznie bieżącą próbę A → B.</p></div>
   <div className="bos-promotion-decision-box"><strong>{passed}/7</strong><span>BRAMEK</span><form action={decide}><input type="hidden" name="processId" value={p.id}/><textarea name="note" placeholder="Uzasadnienie / uwaga"/><div><button name="decision" value="READY" disabled={!p.gates.readyAllowed}>GOTOWY</button><button name="decision" value="NOT_YET">JESZCZE NIE</button><button name="decision" value="STOP">STOP</button></div></form></div>
  </section>

  {p.decisions.length>0&&<section className="bos-process-card"><div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">HISTORIA</span><h2>Decyzje w tym procesie</h2></div></div><div className="bos-promotion-decision-history">{p.decisions.map(d=><div key={d.id}><span>#{d.sequence}</span><strong>{d.decision==="READY"?"GOTOWY":d.decision==="NOT_YET"?"JESZCZE NIE":"STOP"}</strong><time>{d.decidedAt}</time><p>{d.note||"—"}</p></div>)}</div></section>}
 </>;
}
