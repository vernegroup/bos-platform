"use client";

import ProductDetailsModal from "./ProductDetailsModal";

const products = [
  { id:"onboarding", label:"ONBOARDING", modal:"onboarding", available:true },
  { id:"promotions", label:"PROMOTIONS", modal:"promotions", available:true },
  { id:"work", label:"WORK", available:false },
  { id:"pricing", label:"PRICING", available:false },
  { id:"compliance", label:"COMPLIANCE", available:false },
] as const;

export default function ProductRail(){
  return (
    <section id="produkty" className="bos-product-rail" aria-labelledby="bos-products-title">
      <div className="bos-product-rail__intro">
        <span>PRODUKTY BOS</span>
        <h2 id="bos-products-title">Jeden system.<br/>Wiele obszarów pracy.</h2>
      </div>
      <div className="bos-product-rail__viewport">
        <div className="bos-product-rail__track">
          {products.map(product=>(
            <article className={"bos-product-rail__item"+(product.available?"":" is-planned")} key={product.id}>
              <div className="bos-product-rail__name">{product.label}</div>
              {product.available && product.modal ? (
                <ProductDetailsModal product={product.modal} variant="rail" />
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
