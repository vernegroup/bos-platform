import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBOSAccess } from "@/lib/bos/access";
import { createPromotionProcess, listPromotionStartOptions } from "@/lib/bos/promotionsRepository";

export const dynamic="force-dynamic";
const text=(fd:FormData,key:string)=>String(fd.get(key)??"").trim();

async function startPromotion(fd:FormData){
  "use server";
  const access=await requireBOSAccess();
  const [standardId,standardVersionId]=text(fd,"standardVersion").split(":");
  const processId=await createPromotionProcess(access,{
    productId:text(fd,"productId"),
    employeeId:text(fd,"employeeId"),
    standardId,standardVersionId,
    fromRole:text(fd,"fromRole"),
    toRole:text(fd,"toRole"),
    changeType:text(fd,"changeType") as "PROMOTION"|"LATERAL_MOVE",
    ownerUserId:text(fd,"ownerUserId"),
    startedOn:text(fd,"startedOn"),
    effectiveOn:text(fd,"effectiveOn")||undefined,
    createdByUserId:access.user.id
  });
  redirect(`/app/promotions/processes/${processId}`);
}

export default async function NewPromotionProcessPage(){
  const access=await requireBOSAccess();
  const options=await listPromotionStartOptions(access);
  const product=options.products.find(p=>p.key.toLowerCase().includes("promotion"))??options.products.find(p=>p.name.toLowerCase().includes("awans"));
  const today=new Date().toISOString().slice(0,10);
  const canStart=Boolean(product&&options.standards.length&&options.members.length&&options.employees.length);

  return <>
    <div className="bos-standard-back"><Link href="/app/promotions/processes">← ZMIANY W TOKU</Link></div>
    <section className="bos-app-intro">
      <div><div className="bos-app-kicker">BOS / PROMOTIONS / NOWA ZMIANA</div>
        <h1>Rozpocznij zmianę roli</h1>
        <p>Proces A → B zostanie przypisany do pracownika i dokładnej opublikowanej wersji Standardu roli docelowej.</p>
      </div>
      <div className="bos-app-build-state"><span>POWIĄZANIE</span><strong>PRACOWNIK / A → B / STANDARD</strong></div>
    </section>

    <section className="bos-process-new">
      {!canStart?<div className="bos-operational-empty"><strong>Nie można utworzyć procesu</strong>
        <p>Potrzebujesz aktywnego pracownika, opublikowanego Standardu roli B, aktywnego członka BOS oraz licencji Promotions.</p></div>:
      <form action={startPromotion} style={{display:"grid",gap:18}}>
        <input type="hidden" name="productId" value={product!.id}/>

        <div className="bos-process-new-field"><span>01 / PRACOWNIK</span><strong>Pracownik</strong>
          <select name="employeeId" required defaultValue="" style={{padding:10}}>
            <option value="" disabled>Wybierz pracownika</option>
            {options.employees.map(e=><option value={e.id} key={e.id}>{e.name}{e.employeeNumber?` · ${e.employeeNumber}`:""}{e.position?` · ${e.position}`:""}</option>)}
          </select>
          <small>Tożsamość pochodzi z Employee Core. Historia procesu pozostanie przypisana do tego samego pracownika.</small>
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

        <div className="bos-process-new-field"><span>03 / STANDARD ROLI B</span><strong>Opublikowana wersja Standardu</strong>
          <select name="standardVersion" required defaultValue="" style={{padding:10}}>
            <option value="" disabled>Wybierz Standard i wersję</option>
            {options.standards.map(s=><option value={`${s.standardId}:${s.versionId}`} key={s.versionId}>{s.name} · {s.version}{s.area?` · ${s.area}`:""}</option>)}
          </select>
          <small>Po utworzeniu procesu Standard i jego wersja są niezmienne. Późniejsza publikacja nowej wersji nie zmieni tego procesu.</small>
        </div>

        <div className="bos-process-new-field"><span>04 / ODPOWIEDZIALNOŚĆ</span><strong>Prowadzący i terminy</strong>
          <label style={{display:"grid",gap:6}}><small>OWNER PROCESU</small>
            <select name="ownerUserId" required defaultValue={access.user.id} style={{padding:10}}>
              {options.members.map(m=><option value={m.id} key={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label style={{display:"grid",gap:6}}><small>START</small><input type="date" name="startedOn" required defaultValue={today} style={{padding:10}}/></label>
          <label style={{display:"grid",gap:6}}><small>PLANOWANE WEJŚCIE W ROLĘ / OPCJONALNIE</small><input type="date" name="effectiveOn" style={{padding:10}}/></label>
        </div>

        <div className="bos-process-new-lock"><span>05</span><div><strong>UTWÓRZ PROCES A → B</strong>
          <p>System zamrozi wersję Standardu roli B, utworzy zestaw jego czynności oraz kryteria Readiness. Następny krok to Entry Assessment.</p>
          <button type="submit" className="bos-standard-primary-action">UTWÓRZ ZMIANĘ</button>
        </div></div>
      </form>}
    </section>
  </>;
}
