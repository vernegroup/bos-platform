import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBOSAccess } from "@/lib/bos/access";
import { createOrganizationDraftStandard } from "@/lib/bos/core/standardRepository";
export const dynamic="force-dynamic";

async function createDraft(formData:FormData){
 "use server";
 const access=await requireBOSAccess();
 const name=String(formData.get("name")??"").trim();
 const area=String(formData.get("area")??"").trim();
 if(!name) redirect("/app/standards/new?error=name");
 const id=await createOrganizationDraftStandard({organizationId:access.organization.id,name,area,createdByUserId:access.user.id});
 redirect(`/app/standards/${id}`);
}

export default async function NewOrganizationStandardPage({searchParams}:{searchParams:Promise<{error?:string}>}){
 const access=await requireBOSAccess(); const {error}=await searchParams;
 return <>
  <div className="bos-standard-back"><Link href="/app/standards">← STANDARDY ORGANIZACJI</Link></div>
  <section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / STANDARDY ORGANIZACJI / NOWY</div><h1>Nowy Standard</h1>
   <p>Utwórz wspólną definicję roli lub pracy. Po publikacji będzie mogła zostać użyta przez produkty BOS korzystające ze Standardów.</p></div>
   <div className="bos-app-build-state"><span>ORGANIZACJA</span><strong>{access.organization.name}</strong></div>
  </section>
  <form action={createDraft} className="bos-standard-detail-head"><div style={{display:"grid",gap:12,width:"100%",maxWidth:720}}>
   <label><span className="bos-dashboard-section-kicker">NAZWA STANDARDU</span><input name="name" required maxLength={160} autoFocus placeholder="np. Kierownik zmiany" style={{width:"100%",marginTop:6,padding:12}}/></label>
   <label><span className="bos-dashboard-section-kicker">OBSZAR</span><input name="area" maxLength={160} placeholder="np. Operacje / Sprzedaż" style={{width:"100%",marginTop:6,padding:12}}/></label>
   {error==="name"&&<p role="alert">Podaj nazwę Standardu.</p>}
   <div><button type="submit" className="bos-standard-primary-action">UTWÓRZ WERSJĘ ROBOCZĄ</button></div>
  </div></form>
  <div className="bos-onboarding-rule-note"><span>STANDARD ORGANIZACJI</span><p>Wersja robocza nie jest jeszcze dostępna dla procesów. Opublikowana wersja pozostaje niezmienna dla procesów, które ją wybiorą.</p></div>
 </>;
}
