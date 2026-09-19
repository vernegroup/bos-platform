import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listLicensedProducts } from "@/lib/bos/licenseRepository";
import { listOrganizationMembers } from "@/lib/bos/organizationRepository";

export const dynamic="force-dynamic";

const datePL=(value:string)=>new Intl.DateTimeFormat("pl-PL",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
const productHref={onboarding:"/app/onboarding",promotions:"/app/promotions"} as const;
const roleLabels={OWNER:"Właściciel",ADMIN:"Administrator",MANAGER:"Manager",USER:"Użytkownik"} as const;

export default async function OrganizationPage(){
 const access=await requireBOSAccess();
 const [licenses,members]=await Promise.all([listLicensedProducts(access),listOrganizationMembers(access)]);
 const activeMembers=members.filter(member=>member.status==="ACTIVE").length;
 return <>
  <section className="p8-head"><div><h1>Firma</h1><p>Dane organizacji i licencje przypisane do konta BOS.</p></div><span>Aktywna organizacja</span></section>

  <section className="p8-summary" aria-label="Podsumowanie organizacji">
   <article><span>Użytkownicy</span><strong>{activeMembers}</strong></article>
   <article><span>Aktywne produkty</span><strong>{licenses.length}</strong></article>
   <article><span>Model licencji</span><strong className="text">Dożywotnia</strong></article>
   <article><span>Twoja rola</span><strong className="text">{roleLabels[access.membership.role]}</strong></article>
  </section>

  <section className="p8-company">
   <div className="p8-title"><div><h2>{access.organization.name}</h2><p>Podstawowe dane środowiska organizacji w BOS.</p></div><span>{access.organization.slug}</span></div>
   <dl>
    <div><dt>Nazwa organizacji</dt><dd>{access.organization.name}</dd></div>
    <div><dt>Slug organizacji</dt><dd>{access.organization.slug}</dd></div>
    <div><dt>Identyfikator organizacji</dt><dd className="mono">{access.organization.id}</dd></div>
    <div><dt>Użytkownik sesji</dt><dd>{access.user.displayName}</dd></div>
    <div><dt>Adres e-mail</dt><dd>{access.user.email}</dd></div>
    <div><dt>Rola w organizacji</dt><dd>{roleLabels[access.membership.role]}</dd></div>
   </dl>
  </section>

  <section className="p8-licenses">
   <div className="p8-title"><div><h2>Licencje produktowe</h2><p>Produkty dostępne dla tej organizacji.</p></div><span>{licenses.length} aktywnych</span></div>
   <div className="p8-license-grid">
    {licenses.map(license=><article key={license.licenseId}>
     <div className="top"><span>BOS</span><b>Aktywna</b></div>
     <h3>{license.name}</h3><small>Wersja {license.currentVersion??"—"}</small>
     <dl><div><dt>Licencja</dt><dd>Dożywotnia</dd></div><div><dt>Aktywna od</dt><dd>{datePL(license.grantedAt)}</dd></div></dl>
     <Link href={productHref[license.key]}>Otwórz produkt →</Link>
    </article>)}
    {!licenses.length&&<div className="p8-empty">Brak aktywnych licencji produktowych.</div>}
   </div>
  </section>

  <aside className="p8-note"><strong>Separacja danych organizacji</strong><p>Dane operacyjne, członkostwa i licencje są przypisane do bieżącej organizacji. Konto użytkownika pozostaje odrębnym elementem platformy.</p></aside>

  <style>{`
   .p8-head{padding:18px 0 22px;border-bottom:1px solid #e8e7e2;display:flex;align-items:flex-end;justify-content:space-between;gap:24px}.p8-head h1{margin:0;color:#10283b;font-family:Georgia,serif;font-size:27px;font-weight:500}.p8-head p{margin:7px 0 0;color:#78828a;font-size:11px}.p8-head>span{padding:6px 9px;border-radius:999px;background:#edf6ef;color:#3f7650;font-size:8px;font-weight:700}
   .p8-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:22px 0 31px}.p8-summary article{padding:15px 17px;background:#fff;border:1px solid #e5e4df;border-radius:5px}.p8-summary span{display:block;color:#8a9298;font-size:7px;font-weight:700;text-transform:uppercase}.p8-summary strong{display:block;margin-top:7px;color:#173146;font-family:Georgia,serif;font-size:20px;font-weight:500}.p8-summary strong.text{font-family:inherit;font-size:10px;font-weight:700}
   .p8-company,.p8-licenses{margin-bottom:28px}.p8-title{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:12px}.p8-title h2{margin:0;color:#183146;font-family:Georgia,serif;font-size:17px;font-weight:500}.p8-title p{margin:5px 0 0;color:#7b858c;font-size:9px}.p8-title>span{color:#8b744e;font-size:8px;font-weight:700}
   .p8-company>dl{margin:0;background:#fff;border:1px solid #e3e2dd;border-radius:6px;display:grid;grid-template-columns:repeat(3,1fr);overflow:hidden}.p8-company>dl>div{min-height:78px;padding:16px;border-right:1px solid #ecebe7;border-bottom:1px solid #ecebe7}.p8-company>dl>div:nth-child(3n){border-right:0}.p8-company>dl>div:nth-last-child(-n+3){border-bottom:0}.p8-company dt,.p8-license-grid dt{color:#8a9298;font-size:7px;font-weight:700;text-transform:uppercase}.p8-company dd{margin:7px 0 0;color:#30495a;font-size:10px;font-weight:600;overflow-wrap:anywhere}.p8-company dd.mono{font-family:monospace;font-size:8px;font-weight:500}
   .p8-license-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.p8-license-grid>article{padding:18px;background:#fff;border:1px solid #e3e2dd;border-radius:6px}.p8-license-grid .top{display:flex;justify-content:space-between;align-items:center}.p8-license-grid .top>span{color:#b18439;font-family:Georgia,serif;font-size:10px;font-weight:700;letter-spacing:.1em}.p8-license-grid .top>b{padding:5px 7px;border-radius:999px;background:#edf6ef;color:#3f7650;font-size:7px}.p8-license-grid h3{margin:20px 0 4px;color:#173146;font-family:Georgia,serif;font-size:18px}.p8-license-grid small{color:#818a90;font-size:8px}.p8-license-grid dl{margin:17px 0;display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #ecebe7;border-bottom:1px solid #ecebe7}.p8-license-grid dl>div{padding:11px 0}.p8-license-grid dl>div+div{padding-left:15px;border-left:1px solid #ecebe7}.p8-license-grid dd{margin:4px 0 0;color:#3a5060;font-size:9px;font-weight:700}.p8-license-grid a{display:flex;height:34px;align-items:center;justify-content:center;background:#b78a3e;color:#fff;text-decoration:none;font-size:8px;font-weight:700}.p8-empty{grid-column:1/-1;padding:25px;background:#fff;border:1px solid #e3e2dd;color:#7b858c;font-size:9px;text-align:center}
   .p8-note{padding:14px 16px;border-left:2px solid #b78a3e;background:#f7f5ef}.p8-note strong{color:#72572a;font-size:9px}.p8-note p{margin:5px 0 0;color:#687781;font-size:9px;line-height:1.5}
   @media(max-width:800px){.p8-summary{grid-template-columns:repeat(2,1fr)}.p8-company>dl{grid-template-columns:repeat(2,1fr)}.p8-company>dl>div,.p8-company>dl>div:nth-child(3n),.p8-company>dl>div:nth-last-child(-n+3){border-right:1px solid #ecebe7;border-bottom:1px solid #ecebe7}.p8-company>dl>div:nth-child(2n){border-right:0}.p8-company>dl>div:nth-last-child(-n+2){border-bottom:0}}
   @media(max-width:600px){.p8-license-grid,.p8-company>dl{grid-template-columns:1fr}.p8-company>dl>div{border-right:0!important;border-bottom:1px solid #ecebe7!important}.p8-company>dl>div:last-child{border-bottom:0!important}.p8-head{align-items:flex-start}}
   @media(max-width:480px){.p8-head{display:block}.p8-head>span{display:inline-block;margin-top:13px}.p8-title{align-items:flex-start;flex-direction:column}.p8-summary{gap:8px}}
  `}</style>
 </>;
}
