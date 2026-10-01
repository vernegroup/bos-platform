"use client";

import Link from "next/link";
import { useState } from "react";
import ProductDetailsModal from "@/components/home/ProductDetailsModal";
import { bosProducts } from "@/data/products";

export default function TopBar() {
  const [buyOpen,setBuyOpen]=useState(false);

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
              {buyOpen&&<div className="bos-topbar-buy-menu" role="group" aria-label="Wybierz produkt BOS">
                {bosProducts.map(product=><ProductDetailsModal key={product.id} product={product.id} variant="buyMenu" onOpen={()=>setBuyOpen(false)}/>)}
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
