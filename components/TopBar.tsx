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
              <button type="button" className="bos-topbar-buy-trigger" aria-haspopup="true" aria-expanded={buyOpen} onClick={()=>setBuyOpen(v=>!v)}>OFERTA</button>
              {buyOpen&&<div className="bos-topbar-buy-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setBuyOpen(false)}}>
                <section className="bos-topbar-buy-catalog" role="dialog" aria-modal="true" aria-labelledby="bos-buy-title">
                  <button type="button" className="bos-topbar-buy-close" aria-label="Zamknij" onClick={()=>setBuyOpen(false)}>×</button>
                  <header><span>BOS / OFERTA</span><h2 id="bos-buy-title">Wybierz proces dla swojej firmy.</h2><p>Dwa niezależne standardy operacyjne. Porównaj ich zastosowanie i wybierz rozwiązanie odpowiadające potrzebom organizacji.</p></header>
                  <div className="bos-topbar-buy-products">{bosProducts.map(product=><article key={product.id}>
                    <div className="bos-topbar-buy-product-copy"><span>{product.offer.label}</span><h3>{product.name}</h3><p>{product.offer.description}</p></div>
                    <div className="bos-topbar-buy-price"><strong>{product.offer.price}</strong><small>{product.offer.priceNote}</small></div>
                    <button type="button" onClick={()=>checkout(product.offer.checkoutEndpoint,product.id)} disabled={checkoutPending!==null} aria-label={product.offer.ariaLabel}>{checkoutPending===product.id?"OTWIERAM…":"WYBIERZ PRODUKT"} <span>→</span></button>
                  </article>)}</div>
                  <div className="bos-offer-comparison" aria-label="Porównanie produktów BOS"><div className="bos-offer-comparison__heading"><span>PORÓWNANIE</span><h3>Co porządkuje każdy standard?</h3></div><div className="bos-offer-comparison__scroll"><table><thead><tr><th scope="col">OBSZAR</th><th scope="col">WDROŻENIA</th><th scope="col">AWANSE</th></tr></thead><tbody><tr><th scope="row">Główny proces</th><td>Przygotowanie nowego pracownika do samodzielnej pracy</td><td>Przejście pracownika do nowej roli w organizacji</td></tr><tr><th scope="row">Punkt rozpoczęcia</th><td>Nowe stanowisko i plan wdrożenia</td><td>Nowa rola i wymagany standard</td></tr><tr><th scope="row">Przebieg</th><td>Przygotuj → Przeprowadź → Zamknij</td><td>Przygotuj zmianę → Przeprowadź → Zweryfikuj</td></tr><tr><th scope="row">Weryfikacja</th><td>Gotowość do samodzielnej pracy</td><td>Gotowość do wykonywania nowej roli</td></tr><tr><th scope="row">Sposób zakupu</th><td>Samodzielny produkt</td><td>Samodzielny produkt</td></tr></tbody></table></div></div>
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
