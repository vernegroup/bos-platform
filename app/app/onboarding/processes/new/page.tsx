import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBOSAccess } from "@/lib/bos/access";
import { createProcess, listOnboardingStartOptions } from "@/lib/bos/onboardingRepository";

export const dynamic="force-dynamic";
function text(fd:FormData,key:string){return String(fd.get(key)??"").trim();}

async function startOnboarding(fd:FormData){
  "use server";
  const access=await requireBOSAccess();
  const employeeId=text(fd,"employeeId"); const employeeName=text(fd,"employeeName");
  const standardChoice=text(fd,"standardVersion");
  const [standardId,standardVersionId]=standardChoice.split(":");
  const buddyUserId=text(fd,"buddyUserId");
  await createProcess({
    organizationId:access.organization.id,
    employeeId:employeeId||undefined,employeeName,standardId,standardVersionId,
    ownerUserId:text(fd,"ownerUserId"),trainerUserId:text(fd,"trainerUserId"),evaluatorUserId:text(fd,"evaluatorUserId"),
    buddyUserId:buddyUserId||undefined,startedOn:text(fd,"startedOn"),targetOn:text(fd,"targetOn")||undefined,
    createdByUserId:access.user.id
  });
  redirect("/app/onboarding/processes");
}

export default async function NewProcessPage(){
  const access=await requireBOSAccess(); const options=await listOnboardingStartOptions(access.organization.id);
  const today=new Date().toISOString().slice(0,10);
  return <>
    <div className="bos-standard-back"><Link href="/app/onboarding/processes">← WDROŻENIA W TOKU</Link></div>
    <section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / ONBOARDING / NOWE WDROŻENIE</div>
      <h1>Rozpocznij wdrożenie</h1><p>Proces zostanie trwale przypisany do wybranej opublikowanej wersji Standardu.</p></div>
      <div className="bos-app-build-state"><span>POWIĄZANIE</span><strong>STANDARDVERSION / TRWAŁE</strong></div>
    </section>
    <section className="bos-process-new">
      {!options.standards.length||!options.members.length?<div className="bos-operational-empty"><strong>Nie można utworzyć wdrożenia</strong>
        <p>Potrzebujesz opublikowanego Standardu, aktywnych członków organizacji i aktywnej licencji produktu.</p></div>:
      <form action={startOnboarding} style={{display:"grid",gap:18}}>
        <div className="bos-process-new-field"><span>01 / PRACOWNIK</span><strong>Pracownik</strong>
          <select name="employeeId" defaultValue="" style={{padding:10}}><option value="">Osoba spoza kont BOS / wpisz nazwę poniżej</option>
            {options.members.map(m=><option value={m.id} key={m.id}>{m.name} · {m.email}</option>)}</select>
          <input name="employeeName" required placeholder="Imię i nazwisko pracownika" style={{padding:10}}/>
          <small>Snapshot nazwy pozostaje w historii procesu niezależnie od późniejszych zmian konta.</small></div>
        <div className="bos-process-new-field"><span>02 / STANDARD</span><strong>Opublikowana wersja Standardu</strong>
          <select name="standardVersion" required defaultValue="" style={{padding:10}}><option value="" disabled>Wybierz Standard i wersję</option>
            {options.standards.map(s=><option value={`${s.standardId}:${s.versionId}`} key={s.versionId}>{s.name} · {s.version}{s.area?` · ${s.area}`:""}</option>)}</select></div>
        <div className="bos-process-new-field"><span>03 / ROLE OPERACYJNE</span><strong>Owner, trener, evaluator i opcjonalny buddy</strong>
          {(["ownerUserId","trainerUserId","evaluatorUserId"] as const).map((name,i)=><label key={name} style={{display:"grid",gap:6}}>
            <small>{["OWNER PROCESU","TRENER","EVALUATOR"][i]}</small><select name={name} required defaultValue={access.user.id} style={{padding:10}}>
              {options.members.map(m=><option value={m.id} key={m.id}>{m.name}</option>)}</select></label>)}
          <label style={{display:"grid",gap:6}}><small>BUDDY / OPCJONALNIE</small><select name="buddyUserId" defaultValue="" style={{padding:10}}>
            <option value="">Brak</option>{options.members.map(m=><option value={m.id} key={m.id}>{m.name}</option>)}</select></label></div>
        <div className="bos-process-new-field"><span>04 / TERMIN</span><strong>Ramy procesu</strong>
          <label style={{display:"grid",gap:6}}><small>START</small><input type="date" name="startedOn" required defaultValue={today} style={{padding:10}}/></label>
          <label style={{display:"grid",gap:6}}><small>CEL / OPCJONALNIE</small><input type="date" name="targetOn" style={{padding:10}}/></label></div>
        <div className="bos-process-new-lock"><span>05</span><div><strong>UTWÓRZ KARTĘ WDROŻENIA</strong>
          <p>System utworzy postęp dla czynności, checklistę warunków startu i kryteria końcowej gotowości z dokładnie tej wersji Standardu.</p>
          <button type="submit" className="bos-standard-primary-action">UTWÓRZ WDROŻENIE</button></div></div>
      </form>}
    </section>
  </>;
}
