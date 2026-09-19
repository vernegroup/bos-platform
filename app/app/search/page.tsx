import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { searchOrganization, type BOSSearchResult } from "@/lib/bos/searchRepository";

export const dynamic = "force-dynamic";

type SearchPageProps = { searchParams: Promise<{ q?: string }> };
const labels: Record<BOSSearchResult["type"], string> = {
  STANDARD: "STANDARD",
  TASK: "CZYNNOŚĆ",
  ONBOARDING: "WDROŻENIE",
  CLOSURE: "ZAMKNIĘCIE",
  PROMOTION: "ZMIANA ROLI",
  PROMOTION_CLOSURE: "ZAMKNIĘCIE ZMIANY",
  USER: "UŻYTKOWNIK",
  FILE: "PLIK",
  ACTIVITY: "HISTORIA",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const access = await requireBOSAccess();
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = await searchOrganization(access, query);
  const groups = new Set(results.map((result) => result.type)).size;

  return (
    <div className="bos-app-workspace bos-core-workspace">
      <section className="bos-app-intro bos-core-view-head">
        <div>
          <div className="bos-app-kicker">BOS CORE / WYSZUKIWARKA</div>
          <h1>Wyszukiwarka</h1>
          <p>Jedno miejsce do odnajdywania danych zapisanych w bieżącej organizacji — bez dostępu do zasobów innych firm.</p>
        </div>
        <div className="bos-app-build-state"><span>ORGANIZACJA</span><strong>{access.organization.name}</strong></div>
      </section>

      <form className="bos-core-search-form" action="/app/search" method="get">
        <div>
          <span>SZUKAJ W ORGANIZACJI</span>
          <input name="q" defaultValue={q} autoFocus placeholder="Stanowisko, pracownik, czynność, proces…" aria-label="Szukaj w BOS" />
        </div>
        <button type="submit">SZUKAJ →</button>
      </form>

      <section className="bos-core-commandbar">
        <div><span>WYNIKI</span><strong>{query.length >= 2 ? results.length : "—"}</strong></div>
        <div><span>TYPY DANYCH</span><strong>{query.length >= 2 ? groups : "—"}</strong></div>
        <div><span>ZAKRES</span><strong>TYLKO {access.organization.name}</strong></div>
      </section>

      {query.length < 2 ? (
        <section className="bos-core-empty-state">
          <span>MINIMUM 2 ZNAKI</span>
          <strong>Wpisz nazwę stanowiska, osobę albo element procesu.</strong>
          <p>Wyszukiwarka obejmuje Onboarding, Promotions, użytkowników, pliki i historię aktywności organizacji.</p>
        </section>
      ) : (
        <section className="bos-core-results">
          <header><span>LP.</span><span>TYP</span><span>WYNIK</span><span>KONTEKST</span><span /></header>
          {results.length === 0 ? (
            <div className="bos-operational-empty"><strong>Brak wyników dla „{query}”</strong><p>Sprawdź pisownię albo użyj szerszego określenia.</p></div>
          ) : results.map((result, index) => (
            <Link href={result.href} key={`${result.type}:${result.id}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{labels[result.type]}</b>
              <strong>{result.title}</strong>
              <small>{result.context || "—"}</small>
              <i>→</i>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
