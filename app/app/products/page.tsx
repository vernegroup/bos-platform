import Link from "next/link";

export default function ProductsPage() {
  return (
    <>
      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / PRODUKTY</div>
          <h1>Produkty organizacji</h1>
          <p>Jedno miejsce wejścia do modułów przypisanych do firmy.</p>
        </div>
        <div className="bos-app-build-state"><span>STATUS</span><strong>DEMO / ROUTING</strong></div>
      </section>

      <section className="bos-route-products">
        <Link href="/app/onboarding" className="bos-route-product-row">
          <span>01</span><div><strong>BOS Onboarding</strong><small>System wdrażania nowych pracowników</small></div><b>AKTYWNY</b><em>OTWÓRZ →</em>
        </Link>
        <Link href="/app/promotions" className="bos-route-product-row">
          <span>02</span><div><strong>BOS Promotions</strong><small>System awansów i zmian ról</small></div><b>AKTYWNY</b><em>OTWÓRZ →</em>
        </Link>
      </section>
    </>
  );
}
