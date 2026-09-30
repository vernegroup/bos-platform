import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
export const dynamic="force-dynamic";
const csv=["promotion_processes.csv","promotion_process_tasks.csv","promotion_assessments.csv","promotion_evidence_references.csv","promotion_deployment_progress.csv","promotion_readiness_checks.csv","promotion_transition_items.csv","promotion_decisions.csv","promotion_closure_events.csv"];
export default async function PromotionsDataPortabilityPage(){await requireBOSAccess();return <>
<section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / AWANSE / EKSPORT</div><h1>Eksport danych awansów</h1><p>Eksport zachowuje relacje procesu A → B, ocenę wejściową, wykonanie, gotowość, przekazanie, decyzje i trwałe rekordy zamknięcia.</p></div></section>
<section className="bos-onboarding-work"><div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">PEŁNY MODEL BOS</span><h2>JSON</h2></div><a className="bos-onboarding-stage-open" href="/app/promotions/data-portability/json">POBIERZ JSON →</a></div><p>Jeden eksport organizacji obejmuje wspólne dane pracowników i Standardów, Wdrożenia oraz Awanse. Relacje pozostają oparte o stabilne identyfikatory.</p></section>
<section className="bos-onboarding-work"><div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">AWANSE / ARKUSZE / ERP</span><h2>CSV</h2></div></div><div className="bos-onboarding-table">{csv.map(name=><div className="bos-onboarding-table-row" key={name}><strong>{name}</strong><span>UTF-8</span><span>CSV</span><a href={`/app/promotions/data-portability/csv?file=${encodeURIComponent(name)}`}>POBIERZ →</a></div>)}</div></section>
<p><Link href="/app/promotions">← BOS Awanse</Link></p></>;}
