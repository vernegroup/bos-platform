"use client";

import { useState } from "react";

type Product = "onboarding" | "promotions";

export default function CapacityAddonButton({ product }: { product: Product }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/commerce/capacity/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ product }),
      });
      const data: { url?: string; error?: string } = await response.json();
      if (!response.ok || !data.url || !data.url.startsWith("https://checkout.stripe.com/")) {
        throw new Error(data.error ?? "checkout_unavailable");
      }
      window.location.assign(data.url);
    } catch {
      setError("Nie udało się otworzyć płatności. Spróbuj ponownie później.");
      setLoading(false);
    }
  }

  return (
    <div className="capacity-addon-action">
      <button type="button" onClick={checkout} disabled={loading} aria-busy={loading}>
        {loading ? "Przekierowanie do Stripe…" : "Dokup +10 Standardów — 49,99 zł"}
      </button>
      {error && <p role="alert">{error}</p>}
      <style jsx>{`
        .capacity-addon-action{margin-top:9px}
        button{display:flex;align-items:center;justify-content:center;width:100%;min-height:36px;padding:8px 12px;background:#fff;border:1px solid #b78a3e;border-radius:3px;color:#8b672e;font-size:9px;font-weight:700;font-family:inherit;cursor:pointer}
        button:hover:not(:disabled){background:#f7f2e8}
        button:disabled{opacity:.65;cursor:wait}
        p{margin:7px 0 0;color:#a12a2a;font-size:10px}
      `}</style>
    </div>
  );
}
