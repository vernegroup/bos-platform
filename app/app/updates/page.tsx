import { requireBOSAccess } from "@/lib/bos/access";
import { getCurrentProductVersions, listProductUpdates } from "@/lib/bos/productUpdateRepository";

export const dynamic = "force-dynamic";
const datePL = (value: string) => new Intl.DateTimeFormat("pl-PL", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));

export default async function UpdatesPage() {
  const access = await requireBOSAccess();
  const [updates, versions] = await Promise.all([
    listProductUpdates(access),
    getCurrentProductVersions(access),
  ]);
  const current = updates.filter((update) => update.isCurrent).length;

  return (
    <div className="bos-app-workspace bos-core-workspace">
      <section className="bos-app-intro bos-core-view-head">
        <div>
          <div className="bos-app-kicker">BOS CORE / AKTUALIZACJE</div>
          <h1>Aktualizacje produktów</h1>
          <p>Zmiany dostarczane centralnie do modułów objętych aktywną, dożywotnią licencją organizacji.</p>
        </div>
        <div className="bos-app-build-state"><span>ORGANIZACJA</span><strong>{access.organization.name}</strong></div>
      </section>

      <section className="bos-core-commandbar">
        <div><span>LICENCJONOWANE PRODUKTY</span><strong>{versions.length}</strong></div>
        <div><span>WPISY AKTUALIZACJI</span><strong>{updates.length}</strong></div>
        <div><span>BIEŻĄCE WERSJE</span><strong>{current}</strong></div>
      </section>

      <section className="bos-core-version-strip">
        {versions.map((version) => (
          <article key={version.key}>
            <span>{version.key.toUpperCase()}</span>
            <strong>{version.currentVersion ?? "—"}</strong>
            <small>{version.latestUpdateAt ? `OSTATNIA PUBLIKACJA ${datePL(version.latestUpdateAt)}` : "BRAK OPUBLIKOWANEJ HISTORII"}</small>
          </article>
        ))}
      </section>

      <section className="bos-core-update-history">
        <header><span>DATA</span><span>PRODUKT</span><span>ZMIANA</span><span>STATUS</span></header>
        {!updates.length ? (
          <div className="bos-operational-empty"><strong>Brak opublikowanych aktualizacji</strong><p>Historia pojawi się po publikacji pierwszej zmiany w licencjonowanym produkcie.</p></div>
        ) : updates.map((update) => (
          <article key={update.id}>
            <time>{datePL(update.publishedAt)}</time>
            <span>{update.productName}</span>
            <div><strong>{update.version} · {update.title}</strong><p>{update.description}</p></div>
            <b data-current={update.isCurrent}>{update.isCurrent ? "BIEŻĄCA" : "HISTORIA"}</b>
          </article>
        ))}
      </section>

      <div className="bos-core-rule-note"><span>AKTUALIZACJE W LICENCJI</span><p>Publikacje są dostępne automatycznie w aplikacji i nie wymagają ponownego zakupu modułu.</p></div>
    </div>
  );
}
