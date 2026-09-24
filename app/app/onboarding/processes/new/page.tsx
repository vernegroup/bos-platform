import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBOSAccess } from "@/lib/bos/access";
import { createEmployee } from "@/lib/bos/core/employeeRepository";
import { createProcess, listOnboardingStartOptions } from "@/lib/bos/onboardingRepository";

export const dynamic="force-dynamic";
function text(fd:FormData,key:string){return String(fd.get(key)??"").trim();}

async function startOnboarding(fd:FormData){
  "use server";
  const access=await requireBOSAccess();
  let employeeId=text(fd,"employeeId");
  if(employeeId==="__NEW__"){
    const employee=await createEmployee({organizationId:access.organization.id,firstName:text(fd,"newEmployeeFirstName"),lastName:text(fd,"newEmployeeLastName"),employeeNumber:text(fd,"newEmployeeNumber")||undefined,position:text(fd,"newEmployeePosition")||undefined,department:text(fd,"newEmployeeDepartment")||undefined});
    employeeId=employee.id;
  }
  if(!employeeId) throw new Error("Wybierz istniejącego pracownika albo dodaj nowego.");
  const standardChoice=text(fd,"standardVersion");
  const [standardId,standardVersionId]=standardChoice.split(":");
  const buddyUserId=text(fd,"buddyUserId");
  const processId=await createProcess({
    organizationId:access.organization.id,productId:text(fd,"productId"),
    employeeId,standardId,standardVersionId,
    ownerUserId:text(fd,"ownerUserId"),trainerUserId:text(fd,"trainerUserId"),evaluatorUserId:text(fd,"evaluatorUserId"),
    buddyUserId:buddyUserId||undefined,startedOn:text(fd,"startedOn"),targetOn:text(fd,"targetOn")||undefined,
    createdByUserId:access.user.id
  });
  redirect(`/app/onboarding/processes/${processId}`);
}

export default async function NewProcessPage(){
  const access=await requireBOSAccess(); const options=await listOnboardingStartOptions(access.organization.id);
  const onboardingProduct=options.products.find(p=>p.key.toLowerCase().includes("onboarding"))??options.products[0];
  const today=new Date().toISOString().slice(0,10);
  return <>
    <div className="bos-standard-back"><Link href="/app/onboarding/processes">← WDROŻENIA W TOKU</Link></div>
    <section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / ONBOARDING / NOWE WDROŻENIE</div>
      <h1>Rozpocznij wdrożenie</h1><p>Proces zostanie przypisany do pracownika i dokładnie wybranej opublikowanej wersji Standardu.</p></div>
      <div className="bos-app-build-state"><span>POWIĄZANIE</span><strong>PRACOWNIK / WERSJA STANDARDU</strong></div>
    </section>
    <section className="bos-process-new">
      {!options.standards.length||!options.members.length||!onboardingProduct?<div className="bos-operational-empty"><strong>Nie można utworzyć wdrożenia</strong>
        <p>Potrzebujesz opublikowanego Standardu, aktywnego członka BOS do prowadzenia procesu i aktywnej licencji produktu.</p></div>:
      <form action={startOnboarding} style={{display:"grid",gap:18}}>
        <input type="hidden" name="productId" value={onboardingProduct.id}/>
        <div className="bos-process-new-field"><span>01 / PRACOWNIK</span><strong>Pracownik</strong>
          <select name="employeeId" required defaultValue="" style={{padding:10}}><option value="" disabled>Wybierz pracownika</option>
            {options.employees.map(e=><option value={e.id} key={e.id}>{e.name}{e.employeeNumber?` · ${e.employeeNumber}`:""}{e.position?` · ${e.position}`:""}</option>)}
            <option value="__NEW__">+ Dodaj nowego pracownika</option></select>
          <small>Pracownik nie musi mieć konta BOS. Dla nowej osoby uzupełnij dane poniżej.</small>
          <input name="newEmployeeFirstName" placeholder="Imię nowego pracownika" style={{padding:10}}/>
          <input name="newEmployeeLastName" placeholder="Nazwisko nowego pracownika" style={{padding:10}}/>
          <input name="newEmployeeNumber" placeholder="Numer pracownika / opcjonalnie" style={{padding:10}}/>
          <input name="newEmployeePosition" placeholder="Stanowisko / opcjonalnie" style={{padding:10}}/>
          <input name="newEmployeeDepartment" placeholder="Dział / opcjonalnie" style={{padding:10}}/>
          <small>Nazwa pracownika zostanie zachowana także w historycznym zapisie procesu.</small></div>
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
