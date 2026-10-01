import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { searchOrganization, type BOSSearchResult } from "@/lib/bos/searchRepository";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ q?: string }> };
const labels: Record<BOSSearchResult["type"], string> = { STANDARD:"Standard", TASK:"Czynność", ONBOARDING:"Wdrożenie", CLOSURE:"Zamknięcie", PROMOTION:"Zmiana roli", PROMOTION_CLOSURE:"Zamknięcie zmiany", USER:"Użytkownik", FILE:"Plik", ACTIVITY:"Historia" };

export default async function SearchPage({ searchParams }: Props) {
  const access = await requireBOSAccess();
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = await searchOrganization(access, query);
  const groups = new Set(results.map((r) => r.type)).size;

  return (
    <>
      <section className="p9-head"><div><h1>Wyszukiwarka</h1><p>Przeszukuj dane zapisane w organizacji {access.organization.name}.</p></div>{query.length >= 2 && <span>{results.length} wyników</span>}</section>
      <form className="p9-search" action="/app/search" method="get"><div><span aria-hidden="true">⌕</span><input name="q" defaultValue={q} autoFocus placeholder="Stanowisko, pracownik, czynność, proces…" aria-label="Szukaj w BOS"/></div><button>Szukaj →</button></form>
      <section className="p9-search-summary"><article><span>Wyniki</span><strong>{query.length >= 2 ? results.length : "—"}</strong></article><article><span>Typy danych</span><strong>{query.length >= 2 ? groups : "—"}</strong></article><article><span>Zakres</span><strong className="text">Bieżąca organizacja</strong></article></section>
      {query.length < 2 ? <div className="p9-empty"><strong>Wpisz co najmniej 2 znaki</strong><p>Wyszukiwarka obejmuje Standardy organizacji, Wdrożenia, Awanse, użytkowników, pliki i historię aktywności.</p></div> : <div className="p9-results">{results.length === 0 ? <div className="p9-empty"><strong>Brak wyników dla „{query}”</strong><p>Sprawdź pisownię albo użyj szerszego określenia.</p></div> : results.map((r) => <Link href={r.href} key={r.type+":"+r.id}><span>{labels[r.type]}</span><div><strong>{r.title}</strong><small>{r.context || "Brak dodatkowego kontekstu"}</small></div><i>→</i></Link>)}</div>}
      <style>{`
        .p9-head{padding:18px 0 22px;border-bottom:1px solid #e8e7e2;display:flex;justify-content:space-between;align-items:flex-end}.p9-head h1{margin:0;color:#10283b;font-family:Georgia,serif;font-size:29px;font-weight:600}.p9-head p{margin:7px 0 0;color:#687781;font-size:12px}.p9-head>span{padding:7px 11px;border-radius:999px;background:#f2f0e9;color:#78633d;font-size:10px;font-weight:700}
        .p9-search{display:grid;grid-template-columns:1fr 112px;gap:10px;margin:22px 0 14px}.p9-search>div{height:48px;padding:0 15px;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #d8d9d5;border-radius:5px;color:#899198}.p9-search input{width:100%;border:0;outline:0;background:transparent;color:#263e50;font-size:13px}.p9-search button{border:0;border-radius:4px;background:#b78a3e;color:#fff;font-size:11px;font-weight:700;cursor:pointer}
        .p9-search-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:26px}.p9-search-summary article{padding:15px 16px;background:#fff;border:1px solid #e5e4df;border-radius:5px}.p9-search-summary span{display:block;color:#7d878e;font-size:9px;font-weight:700;text-transform:uppercase}.p9-search-summary strong{display:block;margin-top:7px;color:#173146;font-family:Georgia,serif;font-size:20px;font-weight:500}.p9-search-summary strong.text{font-family:inherit;font-size:11px;font-weight:700}
        .p9-results{background:#fff;border:1px solid #e3e2dd;border-radius:6px;overflow:hidden}.p9-results>a{min-height:76px;padding:14px 16px;display:grid;grid-template-columns:125px 1fr 20px;gap:16px;align-items:center;border-bottom:1px solid #ecebe7;color:inherit;text-decoration:none}.p9-results>a:last-child{border-bottom:0}.p9-results>a:hover{background:#faf9f6}.p9-results>a>span{color:#946b29;font-size:9px;font-weight:800;text-transform:uppercase}.p9-results>a>div{min-width:0}.p9-results strong{display:block;color:#294153;font-size:12px}.p9-results small{display:block;margin-top:5px;color:#687781;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.p9-results i{color:#9a722f;font-style:normal}
        .p9-empty{padding:34px;background:#fff;border:1px solid #e3e2dd;border-radius:6px;text-align:center}.p9-empty strong{color:#294153;font-size:13px}.p9-empty p{margin:7px 0 0;color:#687781;font-size:11px}
        @media(max-width:600px){.p9-search-summary{grid-template-columns:1fr 1fr}.p9-results>a{grid-template-columns:96px 1fr 16px}}@media(max-width:440px){.p9-search{grid-template-columns:1fr}.p9-search button{height:42px}.p9-results>a{grid-template-columns:1fr 18px}.p9-results>a>span{grid-column:1}.p9-results>a>div{grid-column:1}.p9-results>a>i{grid-column:2;grid-row:1/3}}
      `}</style>
    </>
  );
}
