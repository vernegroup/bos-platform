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
          <p>Najważniejsze informacje o pracy w BOS i produktach dostępnych dla {access.organization.name}.</p>
        </div>
      </section>

      <section className="bos-help-grid">
        <article>
          <span>01</span>
          <div>
            <h2>Produkty</h2>
            <p>W sekcji Produkty znajdziesz moduły dostępne dla organizacji. Wdrożenia prowadzą proces wejścia pracownika w rolę, a Awanse — przejście do nowej roli.</p>
            <Link href="/app/products">Otwórz produkty →</Link>
          </div>
        </article>
        <article>
          <span>02</span>
          <div>
            <h2>Wyszukiwanie</h2>
            <p>Wyszukiwarka obejmuje Standardy, procesy Wdrożeń i Awansów, pracowników, pliki oraz historię aktywności organizacji.</p>
            <Link href="/app/search">Otwórz wyszukiwarkę →</Link>
          </div>
        </article>
        <article>
          <span>03</span>
          <div>
            <h2>Konto i organizacja</h2>
            <p>Ustawienia pokazują dane bieżącego konta, organizacji i sesji. Zarządzanie firmą pozostaje oddzielone od konfiguracji poszczególnych produktów.</p>
            <Link href="/app/settings">Otwórz ustawienia →</Link>
          </div>
        </article>
        <article>
          <span>04</span>
          <div>
            <h2>Aktualizacje</h2>
            <p>Historia zmian pokazuje wersje i publikacje dotyczące produktów objętych dostępem Twojej organizacji.</p>
            <Link href="/app/updates">Zobacz aktualizacje →</Link>
          </div>
        </article>
      </section>

      <aside className="bos-help-contact">
        <div><span>WSPARCIE</span><strong>Potrzebujesz pomocy dotyczącej BOS?</strong></div>
        <div><a href="mailto:sop@vp.pl">sop@vp.pl</a><span>0048 889 322 470</span></div>
      </aside>

      <p className="bos-help-back"><Link href="/app">← Wróć do strony głównej</Link></p>

      <style>{`
        .bos-help-grid{margin-top:24px;background:#fff;border:1px solid #e7e3dc;border-radius:6px;overflow:hidden;box-shadow:0 5px 18px rgba(20,38,54,.04)}
        .bos-help-grid article{min-height:126px;padding:22px;display:grid;grid-template-columns:42px 1fr;gap:18px;border-bottom:1px solid #ece9e3}
        .bos-help-grid article:last-child{border-bottom:0}.bos-help-grid article>span{color:#a8792d;font-size:11px;font-weight:800;letter-spacing:.08em}
        .bos-help-grid h2{margin:0;color:#294153;font-family:Georgia,serif;font-size:18px;font-weight:500}.bos-help-grid p{max-width:760px;margin:8px 0 12px;color:#657680;font-size:12px;line-height:1.6}
        .bos-help-grid a,.bos-help-back a{color:#966d2a;font-size:11px;font-weight:700;text-decoration:none}.bos-help-contact{margin-top:20px;padding:18px 20px;border-left:3px solid #b98836;background:#f7f5ef;display:flex;justify-content:space-between;gap:24px}
        .bos-help-contact>div{display:flex;flex-direction:column;gap:5px}.bos-help-contact span{color:#7b858b;font-size:10px}.bos-help-contact strong{color:#294153;font-size:12px}.bos-help-contact a{color:#8e6728;font-size:12px;font-weight:700;text-decoration:none}.bos-help-back{margin-top:24px}
        @media(max-width:600px){.bos-help-grid article{grid-template-columns:30px 1fr;padding:18px 15px}.bos-help-contact{flex-direction:column}}
      `}</style>
    </>
  );
}
