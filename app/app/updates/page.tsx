import { requireBOSAccess } from "@/lib/bos/access";
import { getCurrentProductVersions, listProductUpdates } from "@/lib/bos/productUpdateRepository";

export const dynamic = "force-dynamic";
const datePL = (value: string) => new Intl.DateTimeFormat("pl-PL", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
const productLabel = (key: string) => ({ onboarding: "WDROŻENIA", promotions: "AWANSE" }[key.toLowerCase()] ?? key);

const platformUpdates = [
  { date: "06.10.2026", version: "AWANSE 1.0", title: "Proces zmiany roli", description: "Domknięto pełną ścieżkę prowadzenia zmiany roli od rozpoczęcia procesu do decyzji i historii." },
  { date: "06.10.2026", version: "AWANSE 1.0", title: "Data rozpoczęcia nowej roli", description: "Usprawniono obsługę i zachowanie daty wejścia pracownika w nową rolę." },
  { date: "06.10.2026", version: "AWANSE 1.0", title: "Kontrola wyboru ról", description: "Doprecyzowano komunikat przy próbie wskazania tej samej roli jako obecnej i docelowej." },
  { date: "06.10.2026", version: "AWANSE 1.0", title: "Karta zamknięcia", description: "Poprawiono prezentację podsumowania zakończonego procesu i stanu jego bramek." },
  { date: "06.10.2026", version: "AWANSE 1.0", title: "Komunikaty procesu", description: "Ujednolicono polskie nazwy dowodów, kontekstu i wyników weryfikacji." },
  { date: "06.10.2026", version: "PLATFORMA", title: "Zakup i dostęp", description: "Dopracowano produkcyjną obsługę zakupu, licencji i dostępu do produktów BOS." },
  { date: "06.10.2026", version: "PLATFORMA", title: "Dostęp do konta", description: "Zweryfikowano produkcyjną obsługę logowania i dostępu do aplikacji." },
] as const;

export default async function UpdatesPage() {
  const access = await requireBOSAccess();
  const [updates, versions] = await Promise.all([listProductUpdates(access), getCurrentProductVersions(access)]);
  const current = updates.filter((update) => update.isCurrent).length;

  return (
    <>
      <section className="bos-app-intro bos-core-view-head">
        <div><h1>Aktualizacje</h1><p>Historia zmian w produktach BOS dostępnych dla Twojej organizacji.</p></div>
        <div className="bos-app-build-state"><span>ORGANIZACJA</span><strong>{access.organization.name}</strong></div>
      </section>
      <section className="bos-core-commandbar">
        <div><span>PRODUKTY Z LICENCJĄ</span><strong>{versions.length}</strong></div>
        <div><span>AKTUALIZACJE</span><strong>{updates.length}</strong></div>
        <div><span>BIEŻĄCE WPISY</span><strong>{current}</strong></div>
      </section>
      <section className="bos-core-version-strip">
        {versions.map((version) => (
          <article key={version.key}>
            <span>{productLabel(version.key)}</span>
            <strong>{version.currentVersion ?? "—"}</strong>
            <small>{version.latestUpdateAt ? `OSTATNIA PUBLIKACJA ${datePL(version.latestUpdateAt)}` : "BRAK OPUBLIKOWANEJ HISTORII"}</small>
          </article>
        ))}
      </section>
      <section className="bos-platform-release-notes" aria-labelledby="platform-release-notes">
        <div className="bos-dashboard-section-head">
          <div><span className="bos-dashboard-section-kicker">PLATFORMA BOS</span><h2 id="platform-release-notes">Ostatnie zmiany platformy</h2></div>
          <span className="bos-dashboard-count">stan produkcyjny</span>
        </div>
        <div className="bos-platform-release-list">
          {platformUpdates.map((item) => (
            <article key={`${item.date}-${item.version}`}>
              <time>{item.date}</time>
              <b>{item.version}</b>
              <div><strong>{item.title}</strong><p>{item.description}</p></div>
            </article>
          ))}
        </div>
      </section>
      <section className="bos-core-update-history">
        <header><span>DATA</span><span>PRODUKT</span><span>AKTUALIZACJA</span><span>STATUS</span></header>
        {!updates.length ? (
          <div className="bos-operational-empty"><strong>Brak opublikowanych aktualizacji</strong><p>Historia pojawi się po publikacji pierwszej zmiany w licencjonowanym produkcie.</p></div>
        ) : updates.map((update) => (
          <article key={update.id}>
            <time>{datePL(update.publishedAt)}</time><span>{update.productName}</span>
            <div><strong>{update.version} · {update.title}</strong><p>{update.description}</p></div>
            <b data-current={update.isCurrent}>{update.isCurrent ? "BIEŻĄCA" : "HISTORIA"}</b>
          </article>
        ))}
      </section>
      <div className="bos-core-rule-note"><span>AKTUALIZACJE W LICENCJI</span><p>Nowe wersje produktów BOS są udostępniane w aplikacji bez ponownego zakupu modułu.</p></div>
      <style>{`
        .bos-core-version-strip span{font-size:10px!important}.bos-core-version-strip strong{font-size:25px!important}.bos-core-version-strip small{font-size:9px!important;line-height:1.4}
        .bos-core-update-history>header{font-size:9px!important}.bos-core-update-history time,.bos-core-update-history>article>span{font-size:10px!important}.bos-core-update-history article div strong{font-size:12px!important}.bos-core-update-history article div p{font-size:11px!important;line-height:1.55!important}.bos-core-update-history article>b{font-size:9px!important}
      `}</style>
    </>
  );
}
