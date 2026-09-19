import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listLicensedProducts } from "@/lib/bos/licenseRepository";
import { listStandards, listProcesses, listClosures, getProcessProgress } from "@/lib/bos/onboardingRepository";
import { listProductUpdates } from "@/lib/bos/productUpdateRepository";

const productMeta = {
  onboarding: {
    eyebrow: "PRZYGOTUJ · PRZEPROWADŹ · ZAMKNIJ",
    description: "Standardy stanowisk, aktywne wdrożenia i historia zakończonych procesów.",
    href: "/app/onboarding",
  },
  promotions: {
    eyebrow: "AWANSE · ZMIANY RÓL",
    description: "Kontrolowany proces awansu i przesunięcia poziomego w organizacji.",
    href: "/app/promotions",
  },
} as const;

const datePL = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));

export const dynamic = "force-dynamic";

export default async function BOSAppPage() {
  const access = await requireBOSAccess();
  const products = await listLicensedProducts(access);
  const hasOnboarding = products.some((product) => product.key === "onboarding");

  const [standards, processes, closures, updates] = await Promise.all([
    hasOnboarding ? listStandards(access.organization.id) : Promise.resolve([]),
    hasOnboarding ? listProcesses(access.organization.id) : Promise.resolve([]),
    hasOnboarding ? listClosures(access.organization.id) : Promise.resolve([]),
    listProductUpdates(access),
  ]);

  const onboardingTasks = processes.reduce(
    (sum, process) => sum + getProcessProgress(process).total,
    0,
  );
  const onboardingDone = processes.reduce(
    (sum, process) => sum + getProcessProgress(process).completed,
    0,
  );

  return (
    <>
      <section className="bos-app-intro bos-dashboard-intro">
        <div>
          <div className="bos-app-kicker">BOS / CENTRUM OPERACYJNE</div>
          <h1>{access.organization.name}</h1>
          <p>Produkty, procesy i bieżący stan organizacji w jednym miejscu.</p>
        </div>
        <div className="bos-dashboard-role">
          <span>TWOJA ROLA</span>
          <strong>{access.membership.role}</strong>
        </div>
      </section>

      <section className="bos-dashboard-overview" aria-label="Podsumowanie organizacji">
        <div>
          <span>AKTYWNE PRODUKTY</span>
          <strong>{products.length}</strong>
          <small>licencje organizacji</small>
        </div>
        <div>
          <span>STANDARDY</span>
          <strong>{standards.length}</strong>
          <small>aktywny katalog Onboarding</small>
        </div>
        <div>
          <span>WDROŻENIA W TOKU</span>
          <strong>{processes.length}</strong>
          <small>{onboardingDone}/{onboardingTasks} zadań wykonanych</small>
        </div>
        <div>
          <span>ZAMKNIĘTE WDROŻENIA</span>
          <strong>{closures.length}</strong>
          <small>rekordy historii</small>
        </div>
      </section>

      <section className="bos-dashboard-section" aria-labelledby="products-title">
        <div className="bos-dashboard-section-head">
          <div>
            <span className="bos-dashboard-section-kicker">TWOJE PRODUKTY</span>
            <h2 id="products-title">Aktywne moduły BOS</h2>
          </div>
          <Link href="/app/products" className="bos-dashboard-text-link">Wszystkie produkty →</Link>
        </div>

        <div className="bos-dashboard-products bos-dashboard-products-v1">
          {products.map((product) => {
            const meta = productMeta[product.key];
            if (!meta) return null;
            return (
              <article className="bos-dashboard-product-v1" key={product.key}>
                <div className="bos-dashboard-product-main">
                  <span className="bos-dashboard-product-eyebrow">{meta.eyebrow}</span>
                  <div className="bos-dashboard-product-title">
                    <h3>{product.name}</h3>
                    <span className="bos-ui-status bos-ui-status--success">AKTYWNY</span>
                  </div>
                  <p>{meta.description}</p>
                </div>
                <div className="bos-dashboard-product-data">
                  <div><span>LICENCJA</span><strong>DOŻYWOTNIA</strong></div>
                  <div><span>WERSJA</span><strong>{product.currentVersion || "—"}</strong></div>
                </div>
                <Link className="bos-dashboard-open-v1" href={meta.href}>Otwórz produkt <span aria-hidden="true">→</span></Link>
              </article>
            );
          })}
          {!products.length && (
            <div className="bos-dashboard-empty">
              <strong>Brak aktywnych produktów</strong>
              <p>Produkty pojawią się tutaj po przyznaniu licencji organizacji.</p>
            </div>
          )}
        </div>
      </section>

      <div className="bos-dashboard-lower">
        <section className="bos-dashboard-section bos-dashboard-current" aria-labelledby="current-title">
          <div className="bos-dashboard-section-head">
            <div>
              <span className="bos-dashboard-section-kicker">TERAZ</span>
              <h2 id="current-title">Aktywne wdrożenia</h2>
            </div>
            {hasOnboarding && <Link href="/app/onboarding/processes" className="bos-dashboard-text-link">Zobacz wszystkie →</Link>}
          </div>

          <div className="bos-dashboard-processes">
            {processes.slice(0, 4).map((process) => {
              const progress = getProcessProgress(process);
              return (
                <Link href={`/app/onboarding/processes/${process.id}`} className="bos-dashboard-process-row" key={process.id}>
                  <div className="bos-dashboard-process-person">
                    <strong>{process.employee}</strong>
                    <span>Onboarding · standard v{process.standardVersion}</span>
                  </div>
                  <div className="bos-dashboard-process-owner"><span>ODPOWIEDZIALNY</span><strong>{process.owner}</strong></div>
                  <div className="bos-dashboard-process-progress" role="progressbar" aria-label={`Postęp wdrożenia ${process.employee}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}>
                    <div><i style={{ width: `${progress.percent}%` }} /></div>
                    <strong>{progress.percent}%</strong>
                  </div>
                  <span aria-hidden="true">→</span>
                </Link>
              );
            })}
            {!processes.length && <div className="bos-dashboard-empty-inline">Brak aktywnych wdrożeń.</div>}
          </div>
        </section>

        <aside className="bos-dashboard-news" aria-labelledby="updates-title">
          <div className="bos-dashboard-section-head">
            <div>
              <span className="bos-dashboard-section-kicker">BOS</span>
              <h2 id="updates-title">Aktualizacje</h2>
            </div>
          </div>
          <div className="bos-dashboard-update-list">
            {updates.slice(0, 3).map((update) => (
              <article key={update.id}>
                <div><span>{update.productName}</span><time dateTime={update.publishedAt}>{datePL(update.publishedAt)}</time></div>
                <strong>{update.title}</strong>
                <p>{update.description}</p>
              </article>
            ))}
            {!updates.length && <div className="bos-dashboard-empty-inline">Brak nowych aktualizacji.</div>}
          </div>
          <Link href="/app/updates" className="bos-dashboard-text-link bos-dashboard-updates-link">Historia aktualizacji →</Link>
        </aside>
      </div>

      <section className="bos-dashboard-actions" aria-label="Szybkie przejścia">
        <span>SZYBKIE PRZEJŚCIA</span>
        <Link href="/app/search">Wyszukaj w BOS →</Link>
        <Link href="/app/users">Użytkownicy →</Link>
        <Link href="/app/organization">Firma →</Link>
      </section>
    </>
  );
}
