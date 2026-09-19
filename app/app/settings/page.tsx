import { requireBOSAccess } from "@/lib/bos/access";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const access = await requireBOSAccess();

  return (
    <div className="bos-app-workspace bos-core-workspace">
      <section className="bos-app-intro bos-core-view-head">
        <div>
          <div className="bos-app-kicker">BOS CORE / USTAWIENIA</div>
          <h1>Ustawienia</h1>
          <p>Parametry konta i środowiska BOS wspólne dla wszystkich produktów przypisanych do organizacji.</p>
        </div>
        <div className="bos-app-build-state"><span>KONTO</span><strong>AKTYWNE</strong></div>
      </section>

      <section className="bos-settings-sections">
        <article>
          <span>01</span>
          <div><strong>Konto użytkownika</strong><p>Dane tożsamości używane podczas logowania i pracy w BOS.</p></div>
          <dl><dt>UŻYTKOWNIK</dt><dd>{access.user.displayName}</dd><dt>E-MAIL</dt><dd>{access.user.email}</dd></dl>
          <b>GOOGLE OAUTH</b>
        </article>
        <article>
          <span>02</span>
          <div><strong>Organizacja</strong><p>Domyślny kontekst danych dla bieżącej sesji aplikacji.</p></div>
          <dl><dt>FIRMA</dt><dd>{access.organization.name}</dd><dt>ROLA</dt><dd>{access.membership.role}</dd></dl>
          <b>AKTYWNA</b>
        </article>
        <article>
          <span>03</span>
          <div><strong>Powiadomienia</strong><p>Komunikaty o aktualizacjach produktów i istotnych zdarzeniach organizacji.</p></div>
          <dl><dt>KANAŁ</dt><dd>W aplikacji</dd><dt>E-MAIL</dt><dd>Nieaktywny</dd></dl>
          <b>USTAWIENIE SYSTEMOWE</b>
        </article>
        <article>
          <span>04</span>
          <div><strong>Bezpieczeństwo konta</strong><p>Logowanie i sesja są obsługiwane przez zewnętrznego dostawcę tożsamości.</p></div>
          <dl><dt>METODA</dt><dd>Google</dd><dt>HASŁO BOS</dt><dd>Nie jest przechowywane</dd></dl>
          <b>ZARZĄDZANE PRZEZ GOOGLE</b>
        </article>
      </section>

      <section className="bos-settings-boundary">
        <span className="bos-dashboard-section-kicker">GRANICA USTAWIEŃ</span>
        <strong>Ustawienia produktów pozostają wewnątrz odpowiednich modułów.</strong>
        <p>Ten ekran obejmuje wyłącznie konto i wspólne środowisko BOS Core. Konfiguracja Onboardingu i Promotions nie jest tutaj duplikowana.</p>
      </section>
    </div>
  );
}
