import { redirect } from "next/navigation";

import { requireBOSAccess } from "@/lib/bos/access";
import { getVisitCounts } from "@/lib/bos/visitCounterRepository";

export const dynamic = "force-dynamic";

function isPlatformOwner(email: string) {
  const allowedEmails = (process.env.BOS_PLATFORM_OWNER_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email.trim().toLowerCase());
}

export default async function AnalyticsPage() {
  const access = await requireBOSAccess();
  if (!isPlatformOwner(access.user.email)) redirect("/app");

  const visits = await getVisitCounts();

  return (
    <>
      <section className="va-head">
        <div>
          <h1>Odwiedziny BOS</h1>
          <p>Prosty licznik unikalnych sesji z istniejącej warstwy Analytics.</p>
        </div>
        <span>Tylko właściciel platformy</span>
      </section>
      <section className="va-grid" aria-label="Licznik odwiedzin">
        <article><span>Dzisiaj</span><strong>{visits.today}</strong></article>
        <article><span>Ostatnie 7 dni</span><strong>{visits.last7Days}</strong></article>
        <article><span>Łącznie</span><strong>{visits.total}</strong></article>
      </section>
      <p className="va-note">Jedna sesja przeglądarki jest liczona jako jedna wizyta. Odświeżanie strony nie zwiększa licznika, dopóki trwa ta sama sesja.</p>
      <style>{`
        .va-head{padding:18px 0 22px;border-bottom:1px solid #e8e7e2;display:flex;align-items:flex-end;justify-content:space-between;gap:24px}.va-head h1{margin:0;color:#10283b;font-family:Georgia,serif;font-size:27px;font-weight:500}.va-head p{margin:7px 0 0;color:#78828a;font-size:11px}.va-head>span{padding:6px 9px;border-radius:999px;background:#f5efe3;color:#8b672e;font-size:8px;font-weight:700}.va-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:22px 0}.va-grid article{padding:20px;background:#fff;border:1px solid #e5e4df;border-radius:6px}.va-grid span{display:block;color:#8a9298;font-size:8px;font-weight:700;text-transform:uppercase}.va-grid strong{display:block;margin-top:9px;color:#173146;font-family:Georgia,serif;font-size:30px;font-weight:500}.va-note{padding:13px 15px;border-left:2px solid #b78a3e;background:#f7f5ef;color:#687781;font-size:9px;line-height:1.5}@media(max-width:600px){.va-grid{grid-template-columns:1fr}.va-head{align-items:flex-start;flex-direction:column}}
      `}</style>
    </>
  );
}
