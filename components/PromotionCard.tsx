"use client";

export default function PromotionCard() {
  async function handleCheckout() {
    const response = await fetch("/api/checkout-promotions", {
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
      aria-label="Kup BOS Promotions"
    >
      <div className="bos-hero-card-label">
        STANDARD OPERACYJNY
      </div>

      <h2 className="bos-hero-card-title">
        Kup BOS
        <br />
        Promotions
      </h2>

      <div className="bos-hero-card-description">
        Kompletny system wspierający planowanie
        awansów wewnętrznych, przekazywanie obowiązków
        oraz rozwój pracowników w organizacji.
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