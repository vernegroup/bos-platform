import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBOSAccess } from "@/lib/bos/access";
import { createPromotionProcess, listPromotionStartOptions } from "@/lib/bos/promotionsRepository";

export const dynamic="force-dynamic";
const text=(fd:FormData,key:string)=>String(fd.get(key)??"").trim();

async function startPromotion(fd:FormData){
  "use server";
  const access=await requireBOSAccess();
  const [standardId,standardVersionId]=text(fd,"standardVersion").split(":");
  const fromRole=text(fd,"fromRole");
  const toRole=text(fd,"toRole");
  if(fromRole.localeCompare(toRole,"pl",{sensitivity:"base"})===0){redirect("/app/promotions/processes/new?error=roles");}
  const processId=await createPromotionProcess(access,{
    productId:text(fd,"productId"),
    employeeId:text(fd,"employeeId"),
    standardId,standardVersionId,
    fromRole,
    toRole,
    changeType:text(fd,"changeType") as "PROMOTION"|"LATERAL_MOVE",
    ownerUserId:text(fd,"ownerUserId"),
    startedOn:text(fd,"startedOn"),
    effectiveOn:text(fd,"effectiveOn")||undefined,
    createdByUserId:access.user.id
  });
  redirect(`/app/promotions/processes/${processId}`);
}

export default async function NewPromotionProcessPage({searchParams}:{searchParams:Promise<{standardId?:string;error?:string}>}){
  const access=await requireBOSAccess();
  const options=await listPromotionStartOptions(access);
  const {standardId:selectedStandardId,error}=await searchParams;
  const product=options.products.find(p=>p.key.toLowerCase().includes("promotion"))??options.products.find(p=>p.name.toLowerCase().includes("awans"));
  const today=new Date().toISOString().slice(0,10);
  const selectedStandard=selectedStandardId?options.standards.find(s=>s.standardId===selectedStandardId):undefined;
  const canStart=Boolean(product&&options.standards.length&&options.members.length&&options.employees.length);

  return <>
    <div className="bos-standard-back"><Link href="/app/promotions/processes">← ZMIANY W TOKU</Link></div>
    <section className="bos-app-intro">
      <div><div className="bos-app-kicker">BOS / AWANSE / NOWA ZMIANA</div>
        <h1>Rozpocznij zmianę roli</h1>
        <p>Proces A → B zostanie przypisany do pracownika i dokładnej opublikowanej wersji Standardu roli docelowej.</p>
      </div>
      <div className="bos-app-build-state"><span>POWIĄZANIE</span><strong>PRACOWNIK / A → B / STANDARD</strong></div>
    </section>

    <section className="bos-process-new">
      {!canStart?<div className="bos-operational-empty"><strong>Nie można utworzyć procesu</strong>
        <p>Potrzebujesz aktywnego pracownika, opublikowanego Standardu roli B, aktywnego członka BOS oraz licencji Awanse.</p>
        {!options.standards.length&&<div style={{marginTop:14}}><Link href="/app/standards/new?returnTo=promotions" className="bos-standard-primary-action">+ UTWÓRZ STANDARD ROLI B</Link></div>}</div>:
      <form action={startPromotion} style={{display:"grid",gap:18}}>{error==="roles"&&<div className="bos-onboarding-rule-note"><span>NIE MOŻNA UTWORZYĆ ZMIANY</span><p>Rola A i rola B muszą być różne.</p></div>}
        <input type="hidden" name="productId" value={product!.id}/>

        <div className="bos-process-new-field"><span>01 / PRACOWNIK</span><strong>Pracownik</strong>
          <select name="employeeId" required defaultValue="" style={{padding:10}}>
            <option value="" disabled>Wybierz pracownika</option>
            {options.employees.map(e=><option value={e.id} key={e.id}>{e.name}{e.employeeNumber&&!e.employeeNumber.startsWith("legacy-")?` · ${e.employeeNumber}`:""}{e.position?` · ${e.position}`:""}</option>)}
          </select>
          <small>Historia procesu pozostanie przypisana do tego samego pracownika.</small>
        </div>

        <div className="bos-process-new-field"><span>02 / ZMIANA</span><strong>Rola A → rola B</strong>
          <label style={{display:"grid",gap:6}}><small>ROLA A / OBECNA</small><input name="fromRole" required placeholder="np. Sprzedawca" style={{padding:10}}/></label>
          <label style={{display:"grid",gap:6}}><small>ROLA B / DOCELOWA</small><input name="toRole" required placeholder="np. Kierownik zmiany" style={{padding:10}}/></label>
          <label style={{display:"grid",gap:6}}><small>TYP ZMIANY</small>
            <select name="changeType" required defaultValue="PROMOTION" style={{padding:10}}>
              <option value="PROMOTION">AWANS</option>
              <option value="LATERAL_MOVE">PRZESUNIĘCIE POZIOME</option>
            </select>
          </label>
        </div>

        <div className="bos-process-new-field"><span>03 / STANDARD ROLI B</span><strong>Standard docelowej roli</strong>
          <div className="bos-promotion-standard-choice">
            <label style={{display:"grid",gap:6,flex:"1 1 360px"}}><small>WYBIERZ Z REPOZYTORIUM ORGANIZACJI</small>
              <select name="standardVersion" required defaultValue={selectedStandard?`${selectedStandard.standardId}:${selectedStandard.versionId}`:""} style={{padding:10}}>
                <option value="" disabled>Wybierz opublikowany Standard</option>
                {options.standards.map(s=><option value={`${s.standardId}:${s.versionId}`} key={s.versionId}>{s.name} · {s.version}{s.area?` · ${s.area}`:""}</option>)}
              </select>
            </label>
            <div className="bos-promotion-standard-or"><span>LUB</span></div>
            <Link href="/app/standards/new?returnTo=promotions" className="bos-standard-primary-action">+ UTWÓRZ NOWY STANDARD B</Link>
          </div>
          {selectedStandard&&<div className="bos-onboarding-rule-note"><span>STANDARD GOTOWY</span><p>{selectedStandard.name} · {selectedStandard.version} został wybrany z repozytorium organizacji.</p></div>}
          <small>Awanse korzystają ze wspólnego repozytorium Standardów organizacji. Proces zamrozi dokładną opublikowaną wersję Standardu B; późniejsze wersje nie zmienią historii procesu.</small>
        </div>

        <div className="bos-process-new-field"><span>04 / ODPOWIEDZIALNOŚĆ</span><strong>Prowadzący i terminy</strong>
          <label style={{display:"grid",gap:6}}><small>OWNER PROCESU</small>
            <select name="ownerUserId" required defaultValue={access.user.id} style={{padding:10}}>
              {options.members.map(m=><option value={m.id} key={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label style={{display:"grid",gap:6}}><small>START</small><input type="date" name="startedOn" required defaultValue={today} style={{padding:10}}/></label>
          <label style={{display:"grid",gap:6}}><small>WEJŚCIE W ROLĘ B</small><input type="date" name="effectiveOn" style={{padding:10}}/><small>Może pozostać puste podczas przygotowania procesu, ale GOTOWY wymaga zapisanej daty faktycznego wejścia w rolę B.</small></label>
        </div>

        <div className="bos-process-new-lock"><span>05</span><div><strong>UTWÓRZ PROCES A → B</strong>
          <p>System zamrozi wersję Standardu roli B, utworzy zestaw jego czynności oraz kryteria gotowości. Następny krok to ocena wejściowa.</p>
          <button type="submit" className="bos-standard-primary-action">UTWÓRZ ZMIANĘ</button>
        </div></div>
      </form>}
    </section>
  </>;
}
