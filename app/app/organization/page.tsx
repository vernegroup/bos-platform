import { requireBOSAccess } from "@/lib/bos/access";
import { listLicensedProducts } from "@/lib/bos/licenseRepository";
export const dynamic="force-dynamic";
export default async function OrganizationPage(){
 const access=await requireBOSAccess(),licenses=await listLicensedProducts(access);
 return <section><div className="bos-app-page-heading"><span className="bos-app-eyebrow">BOS / FIRMA</span><h1>{access.organization.name}</h1><p>Aktywny kontekst organizacji dla bieżącej sesji BOS.</p></div><div className="bos-app-panel"><div className="bos-app-panel-head"><strong>Organizacja</strong><span>{access.organization.slug}</span></div><dl style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:"12px 20px",margin:0}}><dt>Organization ID</dt><dd>{access.organization.id}</dd><dt>Twoja rola</dt><dd>{access.membership.role}</dd><dt>Użytkownik BOS</dt><dd>{access.user.displayName} · {access.user.email}</dd><dt>Aktywne licencje</dt><dd>{licenses.length}</dd></dl></div></section>
}
