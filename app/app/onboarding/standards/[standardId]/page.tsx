export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createDraftReadinessCriterion, createDraftStartRequirement, createDraftTask, deleteDraftReadinessCriterion,
  deleteDraftStartRequirement, deleteDraftTask, getStandard, moveDraftReadinessCriterion, moveDraftStartRequirement,
  moveDraftTask, publishDraftStandard, updateDraftReadinessCriterion, updateDraftStandard, updateDraftStartRequirement, updateDraftTask,
  validateStandardCompleteness,
} from "@/lib/bos/onboardingRepository";
import { requireBOSAccess } from "@/lib/bos/access";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "");

async function updateDraft(formData: FormData) {
  "use server";
  const access = await requireBOSAccess();
  const standardId=text(formData,"standardId");
  await updateDraftStandard({organizationId:access.organization.id,standardId,name:text(formData,"name"),area:text(formData,"area")});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}`);
}
async function addTask(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  await createDraftTask({organizationId:access.organization.id,standardId,name:text(formData,"name"),execution:text(formData,"execution"),
    readyWhen:text(formData,"readyWhen"),hint:text(formData,"hint"),isCritical:formData.get("isCritical")==="on"});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}`);
}
async function editTask(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  await updateDraftTask({organizationId:access.organization.id,standardId,taskId:text(formData,"taskId"),name:text(formData,"name"),
    execution:text(formData,"execution"),readyWhen:text(formData,"readyWhen"),hint:text(formData,"hint"),isCritical:formData.get("isCritical")==="on"});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}`);
}
async function removeTask(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  await deleteDraftTask({organizationId:access.organization.id,standardId,taskId:text(formData,"taskId")});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}`);
}
async function reorderTask(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  const direction=text(formData,"direction");
  if(direction!=="UP" && direction!=="DOWN") throw new Error("Nieprawidłowy kierunek zmiany kolejności.");
  await moveDraftTask({organizationId:access.organization.id,standardId,taskId:text(formData,"taskId"),direction});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}`);
}


async function addStartRequirement(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  const category=text(formData,"category") as "TOOLS"|"ACCESS"|"MATERIALS"|"INSTRUCTIONS"|"WORKPLACE"|"OTHER";
  await createDraftStartRequirement({organizationId:access.organization.id,standardId,category,requirement:text(formData,"requirement")});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}#warunki-startu`);
}
async function editStartRequirement(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  const category=text(formData,"category") as "TOOLS"|"ACCESS"|"MATERIALS"|"INSTRUCTIONS"|"WORKPLACE"|"OTHER";
  await updateDraftStartRequirement({organizationId:access.organization.id,standardId,requirementId:text(formData,"requirementId"),category,requirement:text(formData,"requirement")});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}#warunki-startu`);
}
async function removeStartRequirement(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  await deleteDraftStartRequirement({organizationId:access.organization.id,standardId,requirementId:text(formData,"requirementId")});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}#warunki-startu`);
}
async function reorderStartRequirement(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId"); const direction=text(formData,"direction");
  if(direction!=="UP"&&direction!=="DOWN") throw new Error("Nieprawidłowy kierunek zmiany kolejności.");
  await moveDraftStartRequirement({organizationId:access.organization.id,standardId,requirementId:text(formData,"requirementId"),direction});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}#warunki-startu`);
}


async function addReadinessCriterion(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  const verificationMethod=text(formData,"verificationMethod") as "OBSERVATION"|"INDEPENDENT_TASK"|"WORK_SAMPLE"|"CONTROL_QUESTIONS"|"KNOWLEDGE_TEST"|"OTHER";
  await createDraftReadinessCriterion({organizationId:access.organization.id,standardId,criterion:text(formData,"criterion"),verificationMethod,verificationMethodOther:text(formData,"verificationMethodOther")});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}#kryteria-gotowosci`);
}
async function editReadinessCriterion(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  const verificationMethod=text(formData,"verificationMethod") as "OBSERVATION"|"INDEPENDENT_TASK"|"WORK_SAMPLE"|"CONTROL_QUESTIONS"|"KNOWLEDGE_TEST"|"OTHER";
  await updateDraftReadinessCriterion({organizationId:access.organization.id,standardId,criterionId:text(formData,"criterionId"),criterion:text(formData,"criterion"),verificationMethod,verificationMethodOther:text(formData,"verificationMethodOther")});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}#kryteria-gotowosci`);
}
async function removeReadinessCriterion(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  await deleteDraftReadinessCriterion({organizationId:access.organization.id,standardId,criterionId:text(formData,"criterionId")});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}#kryteria-gotowosci`);
}
async function reorderReadinessCriterion(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId"); const direction=text(formData,"direction");
  if(direction!=="UP"&&direction!=="DOWN") throw new Error("Nieprawidłowy kierunek zmiany kolejności.");
  await moveDraftReadinessCriterion({organizationId:access.organization.id,standardId,criterionId:text(formData,"criterionId"),direction});
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}#kryteria-gotowosci`);
}


async function publishStandard(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const standardId=text(formData,"standardId");
  const qualityCheckPassed=["observable","realWork","repeatable","coversCritical"].every(key=>formData.get(key)==="on");
  if(!qualityCheckPassed) redirect(`/app/onboarding/standards/${standardId}?publishError=${encodeURIComponent("Zaznacz wszystkie cztery odpowiedzi TAK w teście jakości.")}#gotowosc-publikacji`);
  try { await publishDraftStandard({organizationId:access.organization.id,standardId,publishedByUserId:access.user.id,qualityCheckPassed}); }
  catch(error) { const message=error instanceof Error?error.message:"Standard nie spełnia warunków publikacji."; redirect(`/app/onboarding/standards/${standardId}?publishError=${encodeURIComponent(message)}#gotowosc-publikacji`); }
  revalidatePath(`/app/onboarding/standards/${standardId}`);
  revalidatePath("/app/onboarding");
  redirect(`/app/onboarding/standards/${standardId}`);
}

export default async function StandardDetailPage({params,searchParams}:{params:Promise<{standardId:string}>,searchParams:Promise<{publishError?:string}>}) {
  const access=await requireBOSAccess(); const {standardId}=await params; const {publishError}=await searchParams;
  const standard=await getStandard(standardId,access.organization.id); if(!standard) notFound();
  const current=standard.versions.find(v=>v.version===standard.currentVersion)??standard.versions[0]; if(!current) notFound();
  const isDraft=current.status==="DRAFT", canAdd=isDraft&&current.tasks.length<18, canAddCriterion=isDraft&&current.readinessCriteria.length<3;
  const completeness=validateStandardCompleteness({name:standard.name,tasks:current.tasks,startRequirements:current.startRequirements,readinessCriteria:current.readinessCriteria});
  return <>
    <div className="bos-standard-back"><Link href="/app/onboarding/standards">← STANDARDY STANOWISK</Link></div>
    <nav className="bos-guided-flow" aria-label="Etapy BOS Onboarding">
      <Link href="/app/onboarding/standards" className="is-active"><span>01</span><strong>PRZYGOTUJ</strong><small>Standard Stanowiska</small></Link>
      <Link href="/app/onboarding/processes"><span>02</span><strong>PRZEPROWADŹ</strong><small>Karta Postępu</small></Link>
      <Link href="/app/onboarding/closed"><span>03</span><strong>ZAMKNIJ</strong><small>Karta Zakończenia</small></Link>
    </nav>
    <section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / ONBOARDING / STANDARD</div><h1>{standard.name}</h1>
      <p>{standard.area} · aktywna wersja {standard.currentVersion} · aktualizacja {standard.updatedAt}</p></div>
      <div className="bos-app-build-state"><span>STATUS</span><strong>{standard.status}</strong></div></section>
    <aside className="bos-guidance bos-guidance-primary">
      <div><span className="bos-guidance-eyebrow">TERAZ · PRZYGOTUJ</span><strong>Zbuduj wzorzec stanowiska</strong>
      <p>Po tej części Standard ma odpowiadać na trzy pytania: czego nauczyć, na co szczególnie uważać i po czym poznać gotowość.</p></div>
      <details><summary>? Jak pracować z tą częścią</summary><p>Opisuj rzeczywistą pracę własnymi słowami. Czynności zapisuj tak, aby można je było pokazać, wykonać i sprawdzić. Nie musisz wykorzystać wszystkich 18 pozycji.</p></details>
    </aside>

    {isDraft&&<form action={updateDraft} className="bos-standard-detail-head"><input type="hidden" name="standardId" value={standard.id}/>
      <div style={{display:"grid",gap:10,width:"100%",maxWidth:720}}><span className="bos-dashboard-section-kicker">WERSJA ROBOCZA — DANE PODSTAWOWE</span>
      <input name="name" required maxLength={160} defaultValue={standard.name} style={{padding:10}}/>
      <input name="area" maxLength={160} defaultValue={standard.area} placeholder="Obszar" style={{padding:10}}/>
      <div><button type="submit" className="bos-standard-primary-action">ZAPISZ DRAFT</button></div></div></form>}

    <nav className="bos-standard-tabs" aria-label="Sekcje standardu"><a href="#czynnosci" className="is-active">1. CZYNNOŚCI</a><a href="#warunki-startu">2. WARUNKI STARTU</a><a href="#kryteria-gotowosci">3. GOTOWOŚĆ</a><a href="#gotowosc-publikacji">4. PUBLIKACJA</a><a href="#historia">HISTORIA</a></nav>
    <section className="bos-standard-detail-head"><div><span className="bos-dashboard-section-kicker">{isDraft?"WERSJA ROBOCZA":"AKTYWNA WERSJA"}</span>
      <h2>{current.version}</h2><p>{isDraft?"Zdefiniuj maksymalnie 18 czynności. K oznacza czynność krytyczną.":current.note}</p>
      {!isDraft&&current.publishedBy&&<p>Opublikował: {current.publishedBy} · {current.date}</p>}</div>
      <div><span>CZYNNOŚCI</span><strong>{current.tasks.length}/18</strong></div>
      {!isDraft&&<Link href={`/app/onboarding/standards/${standard.id}/new-version`} className="bos-standard-primary-action">UTWÓRZ NOWĄ WERSJĘ</Link>}</section>

    <section id="czynnosci" className="bos-standard-editor-section">
      <div className="bos-editor-step-head"><span>1</span><div><strong>Zdefiniuj czynności stanowiska</strong><p>Zacznij od realnej pracy. Każda pozycja ma mówić, co pracownik robi i jaki rezultat oznacza prawidłowe wykonanie.</p></div></div>
    {isDraft&&<section className="bos-standard-detail-head" aria-label="Dodaj czynność"><form action={addTask} style={{display:"grid",gap:10,width:"100%"}}>
      <input type="hidden" name="standardId" value={standard.id}/><span className="bos-dashboard-section-kicker">NOWA CZYNNOŚĆ</span>
      <label className="bos-guided-field"><strong>Co pracownik ma zrobić?</strong><span>Wpisz czynność, którą można wykonać i zobaczyć jej rezultat.</span>
      <input name="name" required maxLength={240} placeholder="np. Sprawdza dostawę przed przyjęciem" disabled={!canAdd} style={{padding:10}}/></label>
      <details className="bos-guidance-inline"><summary>? Co tu wpisać</summary><p>Nie wpisuj szerokiego obszaru, np. „obsługa magazynu”. Rozbij go na realne czynności: „przyjmuje dostawę”, „sprawdza ilość”, „odkłada towar”. Test: czy możesz powiedzieć „teraz zrób to”, a potem zobaczyć rezultat?</p></details>
      <label className="bos-guided-field"><strong>Po czym poznasz, że zrobił to prawidłowo?</strong><span>Prawidłowe wykonanie opisuje rezultat, nie powtarza nazwy czynności.</span>
      <textarea name="execution" required placeholder="np. Ilość i stan zgadzają się z dokumentem, a niezgodność została zgłoszona" disabled={!canAdd} rows={3} style={{padding:10}}/></label>
      <textarea name="readyWhen" placeholder="Co dodatkowo sprawdzić przy SPRAWDŹ? (opcjonalnie)" disabled={!canAdd} rows={2} style={{padding:10}}/>
      <textarea name="hint" placeholder="Podpowiedź / wskazówka (opcjonalnie)" disabled={!canAdd} rows={2} style={{padding:10}}/>
      <label className="bos-guided-check"><input type="checkbox" name="isCritical" disabled={!canAdd}/><span><strong>K — błąd może mieć poważne konsekwencje</strong><small>K nie oznacza „ważne”.</small></span></label><details className="bos-guidance-inline"><summary>? Kiedy oznaczyć K</summary><p>Zapytaj: co się stanie, jeśli pracownik zrobi tę czynność źle? K stosuj przy realnym ryzyku zagrożenia, istotnej straty, uszkodzenia, naruszenia danych, poważnego problemu z klientem albo zatrzymania pracy.</p></details>
      <div><button type="submit" className="bos-standard-primary-action" disabled={!canAdd}>{canAdd?"DODAJ CZYNNOŚĆ":"OSIĄGNIĘTO LIMIT 18"}</button></div>
    </form></section>}

    {current.tasks.length===0?<section className="bos-standard-detail-head"><div><span className="bos-dashboard-section-kicker">BRAK CZYNNOŚCI</span>
      <h2>Standard nie ma jeszcze zdefiniowanych czynności.</h2><p>{isDraft?"Dodaj pierwszą czynność powyżej.":"Ta wersja nie zawiera czynności."}</p></div></section>:
    <section className="bos-standard-task-table" aria-label="Czynności Standardu Stanowiska">
      <div className="bos-standard-task-head"><span>LP.</span><span>CZYNNOŚĆ</span><span>PRAWIDŁOWE WYKONANIE</span><span>CO SPRAWDZIĆ PRZY SPRAWDŹ</span></div>
      {current.tasks.map((task,index)=><details className="bos-task-editor-card" key={task.id}>
        <summary className="bos-standard-task-row bos-task-editor-summary"><span>{String(index+1).padStart(2,"0")}{task.isCritical?" · K":""}</span><strong>{task.name}</strong><p>{task.execution}</p><p>{task.readyWhen||"—"}</p>{isDraft&&<b className="bos-task-edit-label">EDYTUJ</b>}</summary>
        {task.hint&&<div className="bos-standard-detail-head" style={{paddingTop:10,paddingBottom:10}}><p><strong>Podpowiedź:</strong> {task.hint}</p></div>}
        {isDraft&&<div className="bos-standard-detail-head bos-editor-action-layout" style={{paddingTop:12,paddingBottom:18}}>
          <form action={editTask} style={{display:"grid",gap:8,width:"100%"}}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="taskId" value={task.id}/>
            <input name="name" required maxLength={240} defaultValue={task.name} style={{padding:8}}/><textarea name="execution" required defaultValue={task.execution} rows={2} style={{padding:8}}/>
            <textarea name="readyWhen" defaultValue={task.readyWhen} placeholder="Co dodatkowo sprawdzić przy SPRAWDŹ? (opcjonalnie)" rows={2} style={{padding:8}}/><textarea name="hint" defaultValue={task.hint} rows={2} style={{padding:8}}/>
            <label><input type="checkbox" name="isCritical" defaultChecked={task.isCritical}/> K — czynność krytyczna</label><div><button className="bos-standard-primary-action" type="submit">ZAPISZ CZYNNOŚĆ</button></div>
          </form>
          <div style={{display:"flex",gap:8,alignItems:"flex-start",flexWrap:"wrap"}}>
            <form action={reorderTask}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="taskId" value={task.id}/><input type="hidden" name="direction" value="UP"/><button type="submit" disabled={index===0}>↑ W GÓRĘ</button></form>
            <form action={reorderTask}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="taskId" value={task.id}/><input type="hidden" name="direction" value="DOWN"/><button type="submit" disabled={index===current.tasks.length-1}>↓ W DÓŁ</button></form>
            <form action={removeTask}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="taskId" value={task.id}/><button type="submit">USUŃ</button></form>
          </div>
        </div>}
      </details>)}
    </section>}
    </section>

    <section id="warunki-startu" className="bos-standard-history bos-standard-editor-section">
      <div className="bos-editor-step-head"><span>2</span><div><strong>Przygotuj warunki startu</strong><p>Sprawdź, co musi być gotowe zanim rozpoczniesz właściwe wdrożenie. Dzięki temu brak dostępu lub narzędzia nie zatrzyma nauki w połowie.</p></div></div>
      <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">PRZED STARTEM</span><h2>Warunki rozpoczęcia</h2>
        <p>Dodaj tylko to, co rzeczywiście musi być przygotowane, aby pracownik mógł rozpocząć naukę lub daną czynność.</p><details className="bos-guidance-inline"><summary>? Co zalicza się do warunków</summary><p>Narzędzia i urządzenia, dostępy i systemy, materiały i dokumenty, instrukcje firmy oraz miejsce i wyposażenie. BOS nie zastępuje wymaganych badań, BHP, uprawnień ani formalnych dopuszczeń.</p></details></div>
        <span className="bos-dashboard-count">{current.startRequirements.length} warunki</span></div>
      {isDraft&&<div className="bos-standard-detail-head"><form action={addStartRequirement} style={{display:"grid",gap:10,width:"100%"}}>
        <input type="hidden" name="standardId" value={standard.id}/><span className="bos-dashboard-section-kicker">NOWY WARUNEK</span>
        <select name="category" defaultValue="TOOLS" style={{padding:10}}>
          <option value="TOOLS">NARZĘDZIA</option><option value="ACCESS">DOSTĘPY</option><option value="MATERIALS">MATERIAŁY</option>
          <option value="INSTRUCTIONS">INSTRUKCJE</option><option value="WORKPLACE">STANOWISKO PRACY</option><option value="OTHER">INNE</option>
        </select>
        <textarea name="requirement" required rows={2} placeholder="Co musi być gotowe przed rozpoczęciem?" style={{padding:10}}/>
        <div><button type="submit" className="bos-standard-primary-action">DODAJ WARUNEK</button></div>
      </form></div>}
      {current.startRequirements.length===0?<div className="bos-standard-detail-head"><p>{isDraft?"Nie zdefiniowano jeszcze warunków rozpoczęcia.":"Ta wersja nie zawiera warunków rozpoczęcia."}</p></div>:
      current.startRequirements.map((requirement,index)=><details className="bos-saved-editor-card" key={requirement.id}>
        <summary className="bos-saved-editor-summary"><span className="bos-dashboard-section-kicker">{String(index+1).padStart(2,"0")} · {requirement.category}</span><strong>{requirement.requirement}</strong>{isDraft&&<b className="bos-saved-edit-label">EDYTUJ</b>}</summary>
        <div className="bos-standard-editor-row bos-editor-action-layout">
        {isDraft&&<form action={editStartRequirement} style={{display:"grid",gap:8,width:"100%"}}>
          <input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="requirementId" value={requirement.id}/>
          <select name="category" defaultValue={requirement.category} style={{padding:8}}>
            <option value="TOOLS">NARZĘDZIA</option><option value="ACCESS">DOSTĘPY</option><option value="MATERIALS">MATERIAŁY</option>
            <option value="INSTRUCTIONS">INSTRUKCJE</option><option value="WORKPLACE">STANOWISKO PRACY</option><option value="OTHER">INNE</option>
          </select>
          <textarea name="requirement" required rows={2} defaultValue={requirement.requirement} style={{padding:8}}/>
          <div><button type="submit" className="bos-standard-primary-action">ZAPISZ WARUNEK</button></div>
        </form>}
        {isDraft&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <form action={reorderStartRequirement}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="requirementId" value={requirement.id}/><input type="hidden" name="direction" value="UP"/><button type="submit" disabled={index===0}>↑ W GÓRĘ</button></form>
          <form action={reorderStartRequirement}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="requirementId" value={requirement.id}/><input type="hidden" name="direction" value="DOWN"/><button type="submit" disabled={index===current.startRequirements.length-1}>↓ W DÓŁ</button></form>
          <form action={removeStartRequirement}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="requirementId" value={requirement.id}/><button type="submit">USUŃ</button></form>
        </div>}
      </div></details>)}
    </section>

    <section id="kryteria-gotowosci" className="bos-standard-history bos-standard-editor-section">
      <div className="bos-editor-step-head"><span>3</span><div><strong>Ustal kryterium gotowości</strong><p>To końcowy test roli. Nie oceniaj „wrażenia” — zapisz wynik albo zachowanie, które można rzeczywiście sprawdzić.</p></div></div>
      <aside className="bos-guidance"><div><span className="bos-guidance-eyebrow">KRYTERIUM GOTOWOŚCI</span><strong>Po czym poznasz, że możesz przestać prowadzić tę osobę krok po kroku?</strong><p>Dokończ myśl: „Pozwolę tej osobie pracować bez prowadzenia krok po kroku, kiedy będzie potrafiła…” Zapisz zachowanie albo wynik możliwy do sprawdzenia.</p></div><details><summary>? Pokaż przykład</summary><p><b>Za ogólnie:</b> „Jest samodzielny.” <b>Lepiej:</b> „Samodzielnie kompletuje standardowe zamówienie zgodnie ze Standardem i przekazuje je bez braków.”</p></details></aside>
      <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">SPRAWDŹ</span><h2>Kryteria gotowości</h2>
        <p>Od 1 do 3 kryteriów końcowych określających, jak potwierdzić gotowość pracownika.</p></div>
        <span className="bos-dashboard-count">{current.readinessCriteria.length}/3</span></div>
      {isDraft&&<div className="bos-standard-detail-head"><form action={addReadinessCriterion} style={{display:"grid",gap:10,width:"100%"}}>
        <input type="hidden" name="standardId" value={standard.id}/><span className="bos-dashboard-section-kicker">NOWE KRYTERIUM</span>
        <textarea name="criterion" required rows={2} placeholder="Co musi potrafić lub wykonać pracownik?" disabled={!canAddCriterion} style={{padding:10}}/>
        <select name="verificationMethod" defaultValue="OBSERVATION" disabled={!canAddCriterion} style={{padding:10}}>
          <option value="OBSERVATION">OBSERWACJA</option><option value="INDEPENDENT_TASK">SAMODZIELNE ZADANIE</option><option value="WORK_SAMPLE">PRÓBKA PRACY</option>
          <option value="CONTROL_QUESTIONS">PYTANIA KONTROLNE</option><option value="KNOWLEDGE_TEST">TEST WIEDZY</option><option value="OTHER">INNA</option>
        </select>
        <input name="verificationMethodOther" placeholder="Jeśli INNA — opisz metodę weryfikacji" disabled={!canAddCriterion} style={{padding:10}}/>
        <div><button type="submit" className="bos-standard-primary-action" disabled={!canAddCriterion}>{canAddCriterion?"DODAJ KRYTERIUM":"OSIĄGNIĘTO LIMIT 3"}</button></div>
      </form></div>}
      {current.readinessCriteria.length===0?<div className="bos-standard-detail-head"><p>{isDraft?"Nie zdefiniowano jeszcze kryteriów gotowości.":"Ta wersja nie zawiera kryteriów gotowości."}</p></div>:
      current.readinessCriteria.map((criterion,index)=><details className="bos-saved-editor-card" key={criterion.id}>
        <summary className="bos-saved-editor-summary"><span className="bos-dashboard-section-kicker">{String(index+1).padStart(2,"0")} · {criterion.verificationMethod}</span><strong>{criterion.criterion}</strong>{criterion.verificationMethodOther&&<small>{criterion.verificationMethodOther}</small>}{isDraft&&<b className="bos-saved-edit-label">EDYTUJ</b>}</summary>
        <div className="bos-standard-editor-row bos-editor-action-layout">
        {isDraft&&<form action={editReadinessCriterion} style={{display:"grid",gap:8,width:"100%"}}>
          <input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="criterionId" value={criterion.id}/>
          <textarea name="criterion" required rows={2} defaultValue={criterion.criterion} style={{padding:8}}/>
          <select name="verificationMethod" defaultValue={criterion.verificationMethod} style={{padding:8}}>
            <option value="OBSERVATION">OBSERWACJA</option><option value="INDEPENDENT_TASK">SAMODZIELNE ZADANIE</option><option value="WORK_SAMPLE">PRÓBKA PRACY</option>
            <option value="CONTROL_QUESTIONS">PYTANIA KONTROLNE</option><option value="KNOWLEDGE_TEST">TEST WIEDZY</option><option value="OTHER">INNA</option>
          </select>
          <input name="verificationMethodOther" defaultValue={criterion.verificationMethodOther??""} placeholder="Wymagane tylko dla metody INNA" style={{padding:8}}/>
          <div><button type="submit" className="bos-standard-primary-action">ZAPISZ KRYTERIUM</button></div>
        </form>}
        {isDraft&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <form action={reorderReadinessCriterion}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="criterionId" value={criterion.id}/><input type="hidden" name="direction" value="UP"/><button type="submit" disabled={index===0}>↑ W GÓRĘ</button></form>
          <form action={reorderReadinessCriterion}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="criterionId" value={criterion.id}/><input type="hidden" name="direction" value="DOWN"/><button type="submit" disabled={index===current.readinessCriteria.length-1}>↓ W DÓŁ</button></form>
          <form action={removeReadinessCriterion}><input type="hidden" name="standardId" value={standard.id}/><input type="hidden" name="criterionId" value={criterion.id}/><button type="submit">USUŃ</button></form>
        </div>}
      </div></details>)}
    </section>

    {isDraft&&<section id="gotowosc-publikacji" className="bos-standard-history bos-standard-editor-section">
      <div className="bos-editor-step-head"><span>4</span><div><strong>Sprawdź i opublikuj Standard</strong><p>Publikacja zamraża tę wersję Standardu. Aktywne wdrożenie zawsze pozostaje przypisane do wersji, z którą zostało rozpoczęte.</p></div></div>
      <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">KONTROLA KOMPLETNOŚCI</span><h2>Gotowość do publikacji</h2>
        <p>System sprawdza dane Standardu przed udostępnieniem go do użycia w onboardingu.</p></div>
        <span className="bos-dashboard-count">{completeness.complete?"GOTOWY":"BLOKADA"}</span></div>
      <div className="bos-standard-detail-head">
        {publishError&&<div className="bos-publish-error" role="alert"><strong>Nie można opublikować Standardu</strong><p>{publishError}</p><span>Popraw wskazany element i spróbuj ponownie.</span></div>}
        {completeness.complete
          ? <div style={{display:"grid",gap:12}}><div><strong>Standard jest kompletny.</strong><p>Walidacja nie wykryła powodów blokujących publikację.</p></div>
              <form action={publishStandard} style={{display:"grid",gap:8}}><input type="hidden" name="standardId" value={standard.id}/>
                <aside className="bos-guidance bos-guidance-test"><div><span className="bos-guidance-eyebrow">TEST 4×TAK</span><strong>Sprawdź jakość definicji, nie pracownika</strong><p>Każde TAK potwierdza, że kryterium nadaje się do użycia przez managera podczas realnego wdrożenia.</p></div><details><summary>? Dlaczego 4 pytania</summary><p>Kryterium ma być obserwowalne, możliwe do sprawdzenia w realnej pracy, wystarczająco jednoznaczne dla różnych osób oraz obejmować czynności K istotne dla gotowości do roli.</p></details></aside>
                <label><input type="checkbox" name="observable" required/> TAK — kryterium opisuje zachowanie lub wynik, który można zaobserwować.</label>
                <label><input type="checkbox" name="realWork" required/> TAK — kryterium można sprawdzić w rzeczywistej pracy.</label>
                <label><input type="checkbox" name="repeatable" required/> TAK — dwie osoby powinny dojść do podobnej oceny.</label>
                <label><input type="checkbox" name="coversCritical" required/> TAK — kryterium obejmuje czynności K istotne dla gotowości do roli.</label>
                <button type="submit" className="bos-standard-primary-action">OPUBLIKUJ STANDARD</button>
              </form>
              <p>Publikacja zamknie edycję tej wersji. Dalsze zmiany będą wymagały utworzenia nowej wersji.</p>
            </div>
          : <div style={{width:"100%"}}><strong>Standard nie jest jeszcze gotowy do publikacji.</strong>
              <ul style={{margin:"12px 0 0",paddingLeft:22,display:"grid",gap:6}}>
                {completeness.reasons.map(reason=><li key={reason}>{reason}</li>)}
              </ul>
            </div>}
      </div>
    </section>}

    <section id="historia" className="bos-standard-history"><div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">WERSJONOWANIE</span><h2>Historia wersji</h2></div>
      <span className="bos-dashboard-count">{standard.versions.length} wersje</span></div>
      {standard.versions.map(version=><div className="bos-standard-version-row" key={version.version}><strong>{version.version}</strong><time>{version.date}</time><p>{version.note}</p>
        <span>{version.tasks.length} czynności</span><b>{version.version===standard.currentVersion?"AKTYWNA":"ARCHIWALNA"}</b></div>)}</section>
  </>;
}
