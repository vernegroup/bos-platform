import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const access = await requireBOSAccess();
  return (
    <>
      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / POMOC</div>
          <h1>Pomoc</h1>
          <p>Informacje pomocnicze dotyczące korzystania z platformy i produktów przypisanych do {access.organization.name}.</p>
        </div>
      </section>
      <section className="bos-app-placeholder">
        <div className="bos-app-placeholder-heading"><strong>Centrum pomocy BOS</strong><span>PANEL KLIENTA</span></div>
        <div className="bos-app-placeholder-grid">
          <div className="bos-app-placeholder-line"><span>Produkty</span><span>Pomoc dotycząca modułów dostępnych w organizacji.</span></div>
          <div className="bos-app-placeholder-line"><span>Konto</span><span>Logowanie, użytkownicy i ustawienia organizacji.</span></div>
          <div className="bos-app-placeholder-line"><span>Kontakt</span><span>Kanał wsparcia zostanie podłączony w kolejnych etapach panelu.</span></div>
        </div>
      </section>
      <p style={{marginTop:24}}><Link href="/app">← Wróć do strony głównej</Link></p>
    </>
  );
}
