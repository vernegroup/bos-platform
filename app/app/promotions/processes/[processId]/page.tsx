import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBOSAccess } from "@/lib/bos/access";
import { getPromotionProcess, savePromotionAssessment } from "@/lib/bos/promotionsRepository";

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

export default async function PromotionProcessPage({params}:{params:Promise<{processId:string}>}){
 const {processId}=await params; const access=await requireBOSAccess();
 const p=await getPromotionProcess(access,processId); if(!p) notFound();
 const assessed=p.tasks.filter(t=>t.initialAssessment).length;
 return <>
  <div className="bos-standard-back"><Link href="/app/promotions/processes">← ZMIANY W TOKU</Link></div>
  <section className="bos-app-intro bos-promotions-view-head"><div>
   <div className="bos-app-kicker">PROMOTIONS / ENTRY ASSESSMENT</div>
   <h1>{p.employee}</h1><p>{p.fromRole} → {p.toRole} · {p.type}</p>
  </div><div className="bos-app-build-state"><span>STANDARD ROLI B</span><strong>{p.standardName} · {p.standardVersion}</strong></div></section>

  <div className="bos-promotions-commandbar">
   <div><span>CZYNNOŚCI</span><strong>{p.tasks.length}</strong></div>
   <div><span>OCENIONE</span><strong>{assessed}/{p.tasks.length}</strong></div>
   <div><span>K</span><strong>{p.tasks.filter(t=>t.isCritical).length}</strong></div>
   <div><span>ENTRY GATE</span><strong>{p.gates.entry?"PASS":"W TOKU"}</strong></div>
  </div>

  <section className="bos-process-new" style={{display:"grid",gap:14}}>
   <div className="bos-promotions-rule-note"><span>ZASADA</span><p>Oceń stan wejściowy każdej czynności Standardu roli B. POTWIERDZONE oznacza istniejący wystarczający dowód; DO SPRAWDZENIA wymaga osobnej weryfikacji; DO WDROŻENIA uruchamia pełną ścieżkę BOS. Czynność K zawsze pozostaje wymaganiem rzeczywistego wdrożenia.</p></div>
   {p.tasks.map(t=><form action={saveAssessment} className="bos-process-new-field" key={t.id} style={{display:"grid",gap:10}}>
    <input type="hidden" name="processId" value={p.id}/><input type="hidden" name="processTaskId" value={t.id}/>
    <span>{String(t.position).padStart(2,"0")} / CZYNNOŚĆ {t.isCritical?"· K":""}</span>
    <strong>{t.name}</strong>
    <small>Stan bieżący: {label(t.initialAssessment)}{t.isCritical?" · K NIE MOŻE BYĆ ZALICZONE SAMĄ OCENĄ WEJŚCIOWĄ":""}</small>
    <label style={{display:"grid",gap:6}}><small>OCENA WEJŚCIOWA</small>
     <select name="assessment" required defaultValue={t.initialAssessment??""} style={{padding:10}} disabled={Boolean(t.verificationResult)}>
      {!t.initialAssessment&&<option value="" disabled>Wybierz ocenę</option>}
      <option value="CONFIRMED">POTWIERDZONE</option>
      <option value="TO_VERIFY">DO SPRAWDZENIA</option>
      <option value="TO_DEPLOY">DO WDROŻENIA</option>
     </select>
    </label>
    <label style={{display:"grid",gap:6}}><small>DOWÓD / UWAGA</small>
     <textarea name="evidenceNote" defaultValue={t.evidenceNote??""} rows={2} placeholder="Krótko: na jakiej podstawie oceniasz stan wejściowy?" disabled={Boolean(t.verificationResult)} style={{padding:10}}/>
    </label>
    {t.verificationResult?<small>Wynik SPRAWDŹ został już zapisany: {t.verificationResult}. Ocena wejściowa jest zamrożona.</small>:
     <button type="submit" className="bos-standard-primary-action">ZAPISZ OCENĘ</button>}
   </form>)}
   {!p.tasks.length&&<div className="bos-operational-empty"><strong>Brak czynności Standardu</strong><p>Proces nie ma zmaterializowanego zestawu czynności roli B.</p></div>}
  </section>
 </>;
}
