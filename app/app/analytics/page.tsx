import { redirect } from "next/navigation";

import { requireBOSAccess } from "@/lib/bos/access";
import { getDailyVisitCounts, getVisitCounts } from "@/lib/bos/visitCounterRepository";

export const dynamic = "force-dynamic";

function isPlatformOwner(email: string) {
  const allowedEmails = (process.env.BOS_PLATFORM_OWNER_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email.trim().toLowerCase());
}

const datePL = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit" }).format(new Date(value + "T12:00:00Z"));

export default async function AnalyticsPage() {
  const access = await requireBOSAccess();
  if (!isPlatformOwner(access.user.email)) redirect("/app");

  const [visits, daily] = await Promise.all([getVisitCounts(), getDailyVisitCounts(14)]);
  const maxDaily = Math.max(1, ...daily.map((item) => item.visits));

  return (
    <>
      <section className="va-head">
        <div>
          <h1>Analytics BOS</h1>
          <p>Prywatny panel odczytu istniejącej warstwy Analytics.</p>
        </div>
        <span>Tylko właściciel platformy</span>
      </section>

      <section className="va-grid" aria-label="Podsumowanie odwiedzin">
        <article><span>Dzisiaj</span><strong>{visits.today}</strong><small>unikalne sesje</small></article>
        <article><span>Ostatnie 7 dni</span><strong>{visits.last7Days}</strong><small>unikalne sesje</small></article>
        <article><span>Ostatnie 30 dni</span><strong>{visits.last30Days}</strong><small>unikalne sesje</small></article>
        <article><span>Łącznie</span><strong>{visits.total}</strong><small>unikalne sesje</small></article>
      </section>

      <section className="va-history" aria-labelledby="va-history-title">
        <div className="va-section-head">
          <div><span>RUCH</span><h2 id="va-history-title">Ostatnie 14 dni</h2></div>
          <small>Europe/Warsaw</small>
        </div>
        <div className="va-bars" aria-label="Dzienne unikalne sesje">
          {daily.map((item) => (
            <article key={item.day}>
              <div className="va-bar-track" aria-hidden="true"><i style={{height:`${Math.max(item.visits ? 8 : 0, (item.visits / maxDaily) * 100)}%`}} /></div>
              <strong>{item.visits}</strong>
              <time dateTime={item.day}>{datePL(item.day)}</time>
            </article>
          ))}
        </div>
      </section>

      <p className="va-note">Panel jest wyłącznie odczytowy. Jedna sesja przeglądarki jest liczona jako jedna wizyta; odświeżanie strony nie zwiększa licznika, dopóki trwa ta sama sesja.</p>

      <style>{`
        .va-head{padding:18px 0 22px;border-bottom:1px solid #e8e7e2;display:flex;align-items:flex-end;justify-content:space-between;gap:24px}.va-head h1{margin:0;color:#10283b;font-family:Georgia,serif;font-size:27px;font-weight:500}.va-head p{margin:7px 0 0;color:#78828a;font-size:11px}.va-head>span{padding:6px 9px;border-radius:999px;background:#f5efe3;color:#8b672e;font-size:8px;font-weight:700}.va-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:22px 0}.va-grid article{padding:20px;background:#fff;border:1px solid #e5e4df;border-radius:6px}.va-grid span{display:block;color:#8a9298;font-size:8px;font-weight:700;text-transform:uppercase}.va-grid strong{display:block;margin-top:9px;color:#173146;font-family:Georgia,serif;font-size:30px;font-weight:500}.va-grid small{display:block;margin-top:4px;color:#9aa1a6;font-size:8px}.va-history{padding:20px;background:#fff;border:1px solid #e5e4df;border-radius:6px}.va-section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:18px}.va-section-head span{color:#b78a3e;font-size:8px;font-weight:750;letter-spacing:.12em}.va-section-head h2{margin:4px 0 0;color:#173146;font-family:Georgia,serif;font-size:20px;font-weight:500}.va-section-head small{color:#8a9298;font-size:8px}.va-bars{height:190px;display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:8px;align-items:end}.va-bars article{height:100%;min-width:0;display:grid;grid-template-rows:minmax(80px,1fr) auto auto;gap:5px;text-align:center}.va-bar-track{height:100%;display:flex;align-items:flex-end;background:#f4f3ef;border-radius:3px;overflow:hidden}.va-bar-track i{display:block;width:100%;background:#173146;border-radius:3px 3px 0 0}.va-bars strong{color:#173146;font-size:9px}.va-bars time{color:#8a9298;font-size:7px;white-space:nowrap}.va-note{padding:13px 15px;border-left:2px solid #b78a3e;background:#f7f5ef;color:#687781;font-size:9px;line-height:1.5}@media(max-width:800px){.va-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.va-bars{gap:4px}.va-bars time{font-size:6px}}@media(max-width:600px){.va-grid{grid-template-columns:1fr}.va-head{align-items:flex-start;flex-direction:column}.va-history{overflow-x:auto}.va-bars{min-width:620px}}
      `}</style>
    </>
  );
}
