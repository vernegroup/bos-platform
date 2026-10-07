"use client";

import Link from "next/link";
import { useState } from "react";
import { bosProducts } from "@/data/products";

export default function TopBar() {
  const [buyOpen,setBuyOpen]=useState(false); const [checkoutPending,setCheckoutPending]=useState<string|null>(null); const [checkoutError,setCheckoutError]=useState("");

  async function checkout(endpoint:string,id:string){if(checkoutPending)return;setCheckoutPending(id);setCheckoutError("");try{const response=await fetch(endpoint,{method:"POST"});const payload=await response.json().catch(()=>null) as {url?:string}|null;if(!response.ok||!payload?.url)throw new Error("checkout_failed");window.location.assign(payload.url)}catch{setCheckoutError("Nie udało się otworzyć płatności. Spróbuj ponownie.");setCheckoutPending(null)}}

  return (
    <header className="bos-topbar">
      <div className="bos-topbar-container">
        <Link href="/" className="bos-topbar-left" aria-label="BOS — strona główna">
          <span className="bos-logo-bos">BOS</span>
          <span className="bos-logo-divider" aria-hidden="true">|</span>
          <span className="bos-logo-title">STANDARDY OPERACYJNE BIZNESU</span>
        </Link>

        <nav className="bos-topbar-right" aria-label="Główna nawigacja">
          <div className="bos-topbar-primary-links"></div>

          <div className="bos-topbar-auth">
            <div className="bos-topbar-buy">
              <button type="button" className="bos-topbar-buy-trigger" aria-haspopup="true" aria-expanded={buyOpen} onClick={()=>setBuyOpen(v=>!v)}>KUP</button>
              {buyOpen&&<div className="bos-topbar-buy-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setBuyOpen(false)}}>
                <section className="bos-topbar-buy-catalog" role="dialog" aria-modal="true" aria-labelledby="bos-buy-title">
                  <button type="button" className="bos-topbar-buy-close" aria-label="Zamknij" onClick={()=>setBuyOpen(false)}>×</button>
                  <header><span>BOS / CENNIK</span><h2 id="bos-buy-title">Wybierz produkt</h2><p>Każdy produkt działa jako samodzielny moduł BOS. Wybierz rozwiązanie, którego potrzebuje Twoja firma.</p></header>
                  <div className="bos-topbar-buy-products">{bosProducts.map(product=><article key={product.id}>
                    <div className="bos-topbar-buy-product-copy"><span>{product.offer.label}</span><h3>{product.name}</h3><p>{product.offer.description}</p></div>
                    <div className="bos-topbar-buy-price"><strong>{product.offer.price}</strong><small>{product.offer.priceNote}</small></div>
                    <button type="button" onClick={()=>checkout(product.offer.checkoutEndpoint,product.id)} disabled={checkoutPending!==null} aria-label={product.offer.ariaLabel}>{checkoutPending===product.id?"OTWIERAM…":"KUP"} <span>→</span></button>
                  </article>)}</div>
                  <footer><span>Jasne zasady. Bez pakietów i ukrytych poziomów.</span>{checkoutError&&<p role="alert">{checkoutError}</p>}</footer>
                </section>
              </div>}
            </div>
            <Link className="bos-topbar-login" href="/login">Zaloguj się<span aria-hidden="true">→</span></Link>
            <Link className="bos-topbar-register" href="/register">Zarejestruj się</Link>
          </div>

          <div className="bos-topbar-secondary-links">
            <a className="bos-topbar-link" href="#produkty">Produkty</a>
            <a className="bos-topbar-link" href="#kontakt">Kontakt</a>
          </div>
        </nav>
      </div>
      <div className="bos-topbar-line" />
    </header>
  );
}
