"use client";

import { bosProducts } from "@/data/products";
import ProductDetailsModal from "./ProductDetailsModal";

export default function ProductRail(){
  return (
    <section id="produkty" className="bos-product-rail" aria-labelledby="bos-products-title">
      <div className="bos-product-rail__intro">
        <span>PRODUKTY BOS</span>
        <h2 id="bos-products-title">Jeden system.<br/>Wiele obszarów pracy.</h2>
      </div>
      <div className="bos-product-rail__viewport">
        <div className="bos-product-rail__track">
          {bosProducts.map(product=>(
            <article className="bos-product-rail__item" key={product.id}>
              <div className="bos-product-rail__name">{product.displayName}</div>
              <ProductDetailsModal product={product.id} variant="rail" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
