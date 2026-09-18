import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { searchOrganization } from "@/lib/bos/searchRepository";

export const dynamic = "force-dynamic";
type SearchPageProps={searchParams:Promise<{q?:string}>};
const labels={STANDARD:"STANDARD",TASK:"CZYNNOŚĆ",ONBOARDING:"WDROŻENIE",CLOSURE:"ZAMKNIĘCIE",USER:"UŻYTKOWNIK",FILE:"PLIK",ACTIVITY:"HISTORIA"};

export default async function SearchPage({searchParams}:SearchPageProps){
 const access=await requireBOSAccess();
 const {q=""}=await searchParams;
 const results=await searchOrganization(access,q);
 return <div className="bos-app-workspace">
  <section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / WYSZUKIWARKA</div><h1>Wyszukiwarka</h1><p>Przeszukuje dane zapisane w bieżącej organizacji. Wyniki z innych firm nie są dostępne.</p></div></section>
  <form className="bos-global-search-form" action="/app/search" method="get">
   <input name="q" defaultValue={q} autoFocus placeholder="np. magazynier, Anna, sprzęt, reklamacja…" aria-label="Szukaj w BOS"/>
   <button type="submit">SZUKAJ</button>
  </form>
  {q.trim().length<2?<p className="bos-global-search-note">Wpisz co najmniej 2 znaki.</p>:
   <section className="bos-global-search-results">
    <header><span>WYNIKI</span><strong>{results.length}</strong></header>
    {results.length===0?<p className="bos-global-search-empty">Brak wyników dla „{q}”.</p>:results.map((r,i)=><Link className="bos-global-search-row" href={r.href} key={r.type+":"+r.id}>
      <span className="bos-global-search-index">{String(i+1).padStart(2,"0")}</span>
      <span className="bos-global-search-type">{labels[r.type]}</span>
      <span className="bos-global-search-copy"><strong>{r.title}</strong><small>{r.context||"—"}</small></span>
      <span className="bos-global-search-open">OTWÓRZ →</span>
    </Link>)}
   </section>}
 </div>;
}
