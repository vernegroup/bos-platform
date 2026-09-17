"use client";

export default function PricingCard() {
  async function handleCheckout() {
    const response = await fetch("/api/checkout-pricing", {
      method: "POST",
    });

    if (!response.ok) {
      alert("Checkout error");
      return;
    }

    const data = await response.json();

    window.location.href = data.url;
  }

  return (
    <button
      type="button"
      onClick={handleCheckout}
      className="bos-hero-card"
      aria-label="Kup BOS Pricing"
    >
      <div className="bos-hero-card-label">
        STANDARD OPERACYJNY
      </div>

      <h2 className="bos-hero-card-title">
        Kup BOS
        <br />
        Pricing
      </h2>

      <div className="bos-hero-card-description">
        Kompletny system wspierający analizę kosztów,
        kontrolę marży oraz podejmowanie świadomych
        decyzji cenowych.
      </div>

      <div className="bos-hero-card-button">
        <span>ZAMÓW ROZWIĄZANIE DLA SWOJEJ FIRMY</span>

        <span className="bos-arrow">
          →
        </span>
      </div>
    </button>
  );
}