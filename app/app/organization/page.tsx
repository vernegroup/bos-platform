import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listLicensedProducts } from "@/lib/bos/licenseRepository";

export const dynamic = "force-dynamic";

const datePL = (value: string) => new Intl.DateTimeFormat("pl-PL", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
const productHref = { onboarding: "/app/onboarding", promotions: "/app/promotions" } as const;

export default async function OrganizationPage() {
  const access = await requireBOSAccess();
  const licenses = await listLicensedProducts(access);

  return (
    <div className="bos-app-workspace bos-core-workspace">
      <section className="bos-app-intro bos-core-view-head">
        <div>
          <div className="bos-app-kicker">BOS CORE / FIRMA</div>
          <h1>{access.organization.name}</h1>
          <p>Aktywny kontekst organizacji, w którym przechowywane są użytkownicy, licencje oraz dane wszystkich modułów BOS.</p>
        </div>
        <div className="bos-app-build-state"><span>TWOJA ROLA</span><strong>{access.membership.role}</strong></div>
      </section>

      <section className="bos-core-commandbar">
        <div><span>AKTYWNE LICENCJE</span><strong>{licenses.length}</strong></div>
        <div><span>MODEL LICENCJI</span><strong>DOŻYWOTNIA</strong></div>
        <div><span>KONTO BOS</span><strong>AKTYWNE</strong></div>
      </section>

      <section className="bos-organization-record">
        <div className="bos-dashboard-section-head">
          <div><span className="bos-dashboard-section-kicker">ORGANIZACJA</span><h2>Dane środowiska</h2></div>
          <span className="bos-dashboard-count">{access.organization.slug}</span>
        </div>
        <dl>
          <div><dt>Nazwa organizacji</dt><dd>{access.organization.name}</dd></div>
          <div><dt>Identyfikator</dt><dd>{access.organization.id}</dd></div>
          <div><dt>Slug organizacji</dt><dd>{access.organization.slug}</dd></div>
          <div><dt>Użytkownik sesji</dt><dd>{access.user.displayName}</dd></div>
          <div><dt>Adres e-mail</dt><dd>{access.user.email}</dd></div>
          <div><dt>Rola w organizacji</dt><dd>{access.membership.role}</dd></div>
        </dl>
      </section>

      <section className="bos-organization-products">
        <div className="bos-dashboard-section-head">
          <div><span className="bos-dashboard-section-kicker">LICENCJE PRODUKTOWE</span><h2>Aktywne moduły</h2></div>
          <span className="bos-dashboard-count">{licenses.length} produktów</span>
        </div>
        <div>
          {licenses.map((license) => (
            <Link href={productHref[license.key]} key={license.licenseId}>
              <span>{license.key.toUpperCase()}</span>
              <strong>{license.name}</strong>
              <small>Wersja {license.currentVersion ?? "—"}</small>
              <dl><dt>LICENCJA</dt><dd>DOŻYWOTNIA</dd><dt>AKTYWNA OD</dt><dd>{datePL(license.grantedAt)}</dd></dl>
              <b>OTWÓRZ MODUŁ →</b>
            </Link>
          ))}
        </div>
      </section>

      <div className="bos-core-rule-note"><span>SEPARACJA DANYCH</span><p>Wszystkie dane operacyjne są przypisane do identyfikatora tej organizacji. Konto użytkownika może istnieć niezależnie od licencji produktowych.</p></div>
    </div>
  );
}
