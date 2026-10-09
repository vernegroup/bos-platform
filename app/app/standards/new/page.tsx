import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBOSAccess } from "@/lib/bos/access";
import { listLicensedProducts } from "@/lib/bos/licenseRepository";
import { db } from "@/lib/db";
import { createOrganizationDraftStandard } from "@/lib/bos/core/standardRepository";
import { createStandardFromTemplate,listStandardTemplates } from "@/lib/bos/core/standardTemplateRepository";
export const dynamic="force-dynamic";

function target(id:string,returnTo:string){
 return returnTo==="promotions"?`/app/standards/${id}?returnTo=promotions`:returnTo==="onboarding"?`/app/standards/${id}?returnTo=onboarding`:`/app/standards/${id}`;
}
async function createDraft(formData:FormData){
 "use server";
 const access=await requireBOSAccess();
 const name=String(formData.get("name")??"").trim(),area=String(formData.get("area")??"").trim(),returnTo=String(formData.get("returnTo")??"").trim();
 if(!name) redirect(`/app/standards/new?mode=own&error=name&returnTo=${encodeURIComponent(returnTo)}`);
 const id=await createOrganizationDraftStandard({organizationId:access.organization.id,name,area,productId:String(formData.get("productId")??""),createdByUserId:access.user.id});
 redirect(target(id,returnTo));
}
async function useTemplate(formData:FormData){
 "use server";
 const access=await requireBOSAccess();
 const templateId=String(formData.get("templateId")??""),returnTo=String(formData.get("returnTo")??"").trim();
 if(!templateId)redirect(`/app/standards/new?error=template&returnTo=${encodeURIComponent(returnTo)}`);
 const id=await createStandardFromTemplate({organizationId:access.organization.id,templateId,productId:String(formData.get("productId")??""),createdByUserId:access.user.id});
 redirect(target(id,returnTo));
}

export default async function NewOrganizationStandardPage({searchParams}:{searchParams:Promise<{error?:string;returnTo?:"promotions"|"onboarding";mode?:"own"}>}){
 const access=await requireBOSAccess(); const {error,returnTo,mode}=await searchParams;
 const templates=await listStandardTemplates();
 const licensed=await listLicensedProducts(access);
 const productRows=await db().unsafe("SELECT id,key FROM products WHERE key IN ('onboarding','promotions') AND status='ACTIVE'");
 const availableProducts=productRows.filter(p=>licensed.some(l=>l.key===p.key));
 const defaultProduct=availableProducts.find(p=>p.key===returnTo)??availableProducts[0];
 return <>
  <div className="bos-standard-back"><Link href="/app/standards">← STANDARDY ORGANIZACJI</Link></div>
  <section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / STANDARDY ORGANIZACJI / NOWY</div><h1>Nowy Standard</h1>
   <p>Skorzystaj z gotowego wzoru BOS i użyj go bez zmian lub dostosuj do swojej firmy. Możesz też zacząć od pustego Standardu.</p></div>
   <div className="bos-app-build-state"><span>ORGANIZACJA</span><strong>{access.organization.name}</strong></div>
  </section>

  {mode!=="own"&&<section className="bos-template-catalog">
   <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">GOTOWE WZORY BOS</span><h2>Wybierz punkt wyjścia</h2></div>
    <Link href={`/app/standards/new?mode=own${returnTo?`&returnTo=${returnTo}`:""}`} className="bos-standard-secondary-action">STWÓRZ WŁASNY →</Link></div>
   <p className="bos-template-intro">Wzór zostanie skopiowany do Twojej organizacji jako wersja robocza. Możesz go od razu opublikować albo dowolnie zmienić.</p>
   {error==="template"&&<p role="alert">Wybierz dostępny wzór BOS.</p>}
   <div className="bos-template-grid">{templates.map(t=><article className="bos-template-card" key={t.id}>
    <div><span className="bos-dashboard-section-kicker">WZÓR BOS · {t.area}</span><h3>{t.name}</h3><p>{t.description}</p></div>
    <div className="bos-template-meta"><span>{t.taskCount} czynności</span><span>{t.requirementCount} warunki</span><span>{t.criterionCount} kryteria</span><span>v{t.version}</span></div>
    <form action={useTemplate}><input type="hidden" name="templateId" value={t.id}/><input type="hidden" name="returnTo" value={returnTo??""}/>
     <label>Produkt <select name="productId" required defaultValue={defaultProduct?.id??""}>{availableProducts.map(p=><option key={p.id} value={p.id}>{p.key==="onboarding"?"Wdrożenia":"Awanse"}</option>)}</select></label><button type="submit" className="bos-standard-primary-action">UŻYJ WZORU →</button>
    </form>
   </article>)}</div>
  </section>}

  {mode==="own"&&<><section className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">WŁASNY STANDARD</span><h2>Zacznij od pustej wersji</h2></div>
   <Link href={`/app/standards/new${returnTo?`?returnTo=${returnTo}`:""}`} className="bos-standard-secondary-action">← GOTOWE WZORY</Link></section>
  <form action={createDraft} className="bos-standard-detail-head"><input type="hidden" name="returnTo" value={returnTo??""}/><div style={{display:"grid",gap:12,width:"100%",maxWidth:720}}>
   <label>Produkt <select name="productId" required defaultValue={defaultProduct?.id??""}>{availableProducts.map(p=><option key={p.id} value={p.id}>{p.key==="onboarding"?"Wdrożenia":"Awanse"}</option>)}</select></label><label><span className="bos-dashboard-section-kicker">NAZWA STANDARDU</span><input name="name" required maxLength={160} autoFocus placeholder="np. Kierownik zmiany" style={{width:"100%",marginTop:6,padding:12}}/></label>
   <label><span className="bos-dashboard-section-kicker">OBSZAR</span><input name="area" maxLength={160} placeholder="np. Operacje / Sprzedaż" style={{width:"100%",marginTop:6,padding:12}}/></label>
   {error==="name"&&<p role="alert">Podaj nazwę Standardu.</p>}
   <div><button type="submit" className="bos-standard-primary-action">UTWÓRZ WERSJĘ ROBOCZĄ</button></div>
  </div></form></>}

  <div className="bos-onboarding-rule-note"><span>STANDARD ORGANIZACJI</span><p>Gotowy wzór jest kopiowany do organizacji. Późniejsze zmiany katalogu BOS nie zmienią Twojego Standardu ani procesów, które z niego korzystają.</p></div>
 </>;
}
