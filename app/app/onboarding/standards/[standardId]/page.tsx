export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  createDraftTask, deleteDraftTask, getStandard, moveDraftTask, updateDraftStandard, updateDraftTask,
} from "@/lib/bos/onboardingRepository";
import { requireBOSAccess } from "@/lib/bos/access";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

async function updateDraft(formData: FormData) {
  "use server";
  const access = await requireBOSAccess();
  const standardId=text(formData,"standardId");
  await updateDraftStandard({organizationId:access.organization.id,standardId,name:text(formData,"name"),area:text(formData,"area")});
  redirect(`/app/onboarding/standards/${standardId}`);
}
async function addTask(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  await createDraftTask({organizationId:access.organization.id,standardId,name:text(formData,"name"),execution:text(formData,"execution"),
    readyWhen:text(formData,"readyWhen"),hint:text(formData,"hint"),isCritical:formData.get("isCritical")==="on"});
  redirect(`/app/onboarding/standards/${standardId}`);
}
async function editTask(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  await updateDraftTask({organizationId:access.organization.id,standardId,taskId:text(formData,"taskId"),name:text(formData,"name"),
    execution:text(formData,"execution"),readyWhen:text(formData,"readyWhen"),hint:text(formData,"hint"),isCritical:formData.get("isCritical")==="on"});
  redirect(`/app/onboarding/standards/${standardId}`);
}
async function removeTask(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  await deleteDraftTask({organizationId:access.organization.id,standardId,taskId:text(formData,"taskId")});
  redirect(`/app/onboarding/standards/${standardId}`);
}
async function reorderTask(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  const direction=text(formData,"direction");
  if(direction!=="UP" && direction!=="DOWN") throw new Error("Nieprawidłowy kierunek zmiany kolejności.");
  await moveDraftTask({organizationId:access.organization.id,standardId,taskId:text(formData,"taskId"),direction});
  redirect(`/app/onboarding/standards/${standardId}`);
}

export default async function StandardDetailPage({params}:{params:Promise<{standardId:string}>}) {
  const access=await requireBOSAccess(); const {standardId}=await params;
  const standard=await getStandard(standardId,access.organization.id); if(!standard) notFound();
  const current=standard.versions.find(v=>v.version===standard.currentVersion)??standard.versions[0]; if(!current) notFound();
  const isDraft=current.status==="DRAFT", canAdd=isDraft&&current.tasks.length<18;
  return <>
    <div className="bos-standard-back"><Link href="/app/onboarding/standards">← STANDARDY STANOWISK</Link></div>
    <section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / ONBOARDING / STANDARD</div><h1>{standard.name}</h1>
      <p>{standard.area} · aktywna wersja {standard.currentVersion} · aktualizacja {standard.updatedAt}</p></div>
      <div className="bos-app-build-state"><span>STATUS</span><strong>{standard.status}</strong></div></section>

    {isDraft&&<form action={updateDraft} className="bos-standard-detail-head"><input type="hidden" name="standardId" value={standard.id}/>
      <div style={{display:"grid",gap:10,width:"100%",maxWidth:720}}><span className="bos-dashboard-section-kicker">WERSJA ROBOCZA — DANE PODSTAWOWE</span>
      <input name="name" required maxLength={160} defaultValue={standard.name} style={{padding:10}}/>
      <input name="area" maxLength={160} defaultValue={standard.area} placeholder="Obszar" style={{padding:10}}/>
      <div><button type="submit" className="bos-standard-primary-action">ZAPISZ DRAFT</button></div></div></form>}

    <nav className="bos-standard-tabs" aria-label="Sekcje standardu"><span className="is-active">CZYNNOŚCI</span><span>SZCZEGÓŁY</span><span>PLIKI</span><a href="#historia">HISTORIA WERSJI</a></nav>
    <section className="bos-standard-detail-head"><div><span className="bos-dashboard-section-kicker">{isDraft?"WERSJA ROBOCZA":"AKTYWNA WERSJA"}</span>
      <h2>{current.version}</h2><p>{isDraft?"Zdefiniuj maksymalnie 18 czynności. K oznacza czynność krytyczną.":current.note}</p></div>
      <div><span>CZYNNOŚCI</span><strong>{current.tasks.length}/18</strong></div>
      {!isDraft&&<Link href={`/app/onboarding/standards/${standard.id}/new-version`} className="bos-standard-primary-action">UTWÓRZ NOWĄ WERSJĘ</Link>}</section>

    {isDraft&&<section className="bos-standard-detail-head" aria-label="Dodaj czynność"><form action={addTask} style={{display:"grid",gap:10,width:"100%"}}>
      <input type="hidden" name="standardId" value={standard.id}/><span className="bos-dashboard-section-kicker">NOWA CZYNNOŚĆ</span>
      <input name="name" required maxLength={240} placeholder="Nazwa czynności" disabled={!canAdd} style={{padding:10}}/>
      <textarea name="execution" required placeholder="Prawidłowe wykonanie" disabled={!canAdd} rows={3} style={{padding:10}}/>
      <textarea name="readyWhen" required placeholder="Kryterium gotowości — po czym wiadomo, że czynność jest wykonana prawidłowo?" disabled={!canAdd} rows={2} style={{padding:10}}/>
      <textarea name="hint" placeholder="Podpowiedź / wskazówka (opcjonalnie)" disabled={!canAdd} rows={2} style={{padding:10}}/>
      <label><input type="checkbox" name="isCritical" disabled={!canAdd}/> K — czynność krytyczna</label>
      <div><button type="submit" className="bos-standard-primary-action" disabled={!canAdd}>{canAdd?"DODAJ CZYNNOŚĆ":"OSIĄGNIĘTO LIMIT 18"}</button></div>
    </form></section>}

    {current.tasks.length===0?<section className="bos-standard-detail-head"><div><span className="bos-dashboard-section-kicker">BRAK CZYNNOŚCI</span>
      <h2>Standard nie ma jeszcze zdefiniowanych czynności.</h2><p>{isDraft?"Dodaj pierwszą czynność powyżej.":"Ta wersja nie zawiera czynności."}</p></div></section>:
    <section className="bos-standard-task-table" aria-label="Czynności Standardu Stanowiska">
      <div className="bos-standard-task-head"><span>LP.</span><span>CZYNNOŚĆ</span><span>PRAWIDŁOWE WYKONANIE</span><span>KRYTERIUM GOTOWOŚCI</span></div>
      {current.tasks.map((task,index)=><div key={task.id}>
        <div className="bos-standard-task-row"><span>{String(index+1).padStart(2,"0")}{task.isCritical?" · K":""}</span><strong>{task.name}</strong><p>{task.execution}</p><p>{task.readyWhen}</p></div>
        {task.hint&&<div className="bos-standard-detail-head" style={{paddingTop:10,paddingBottom:10}}><p><strong>Podpowiedź:</strong> {task.hint}</p></div>}
        {isDraft&&<div className="bos-standard-detail-head" style={{paddingTop:12,paddingBottom:18}}>
          <form action={editTask} style={{display:"grid",gap:8,width:"100%"}}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="taskId" value={task.id}/>
            <input name="name" required maxLength={240} defaultValue={task.name} style={{padding:8}}/><textarea name="execution" required defaultValue={task.execution} rows={2} style={{padding:8}}/>
            <textarea name="readyWhen" required defaultValue={task.readyWhen} rows={2} style={{padding:8}}/><textarea name="hint" defaultValue={task.hint} rows={2} style={{padding:8}}/>
            <label><input type="checkbox" name="isCritical" defaultChecked={task.isCritical}/> K — czynność krytyczna</label><div><button className="bos-standard-primary-action" type="submit">ZAPISZ CZYNNOŚĆ</button></div>
          </form>
          <div style={{display:"flex",gap:8,alignItems:"flex-start",flexWrap:"wrap"}}>
            <form action={reorderTask}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="taskId" value={task.id}/><input type="hidden" name="direction" value="UP"/><button type="submit" disabled={index===0}>↑ W GÓRĘ</button></form>
            <form action={reorderTask}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="taskId" value={task.id}/><input type="hidden" name="direction" value="DOWN"/><button type="submit" disabled={index===current.tasks.length-1}>↓ W DÓŁ</button></form>
            <form action={removeTask}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="taskId" value={task.id}/><button type="submit">USUŃ</button></form>
          </div>
        </div>}
      </div>)}
    </section>}

    <section id="historia" className="bos-standard-history"><div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">WERSJONOWANIE</span><h2>Historia wersji</h2></div>
      <span className="bos-dashboard-count">{standard.versions.length} wersje</span></div>
      {standard.versions.map(version=><div className="bos-standard-version-row" key={version.version}><strong>{version.version}</strong><time>{version.date}</time><p>{version.note}</p>
        <span>{version.tasks.length} czynności</span><b>{version.version===standard.currentVersion?"AKTYWNA":"ARCHIWALNA"}</b></div>)}</section>
  </>;
}
