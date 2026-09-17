"use client";

import ProductVideo from "./ProductVideo";
import type { BOSProduct } from "@/data/products";

type ProductStageProps = {
  product: BOSProduct;
};

export default function ProductStage({ product }: ProductStageProps) {
  async function handleCheckout() {
    const response = await fetch(product.purchase.checkoutEndpoint, {
      method: "POST",
    });

    if (!response.ok) {
      alert("Checkout error");
      return;
    }

    const data = await response.json();

    if (!data?.url) {
      alert("Checkout error");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <section
      className="bos-product-stage"
      data-product={product.id}
      aria-labelledby={`bos-product-stage-title-${product.id}`}
    >
      <div className="bos-page-width">
        <div className="bos-product-stage-grid">
          <div className="bos-product-stage-copy">
            <div className="bos-product-stage-eyebrow">
              {product.eyebrow}
            </div>

            <h1
              id={`bos-product-stage-title-${product.id}`}
              className="bos-product-stage-title"
            >
              {product.title}
            </h1>

            {product.subtitle && (
              <div className="bos-product-stage-subtitle">
                {product.subtitle}
              </div>
            )}

            <p className="bos-product-stage-description">
              {product.description}
            </p>

            <div className="bos-product-stage-reference">
              <span className="bos-product-stage-reference-line" />
              <span>{product.reference}</span>
            </div>
          </div>

          <div className="bos-product-stage-showcase">
            <div className="bos-product-stage-demo">
              <ProductVideo
                src={product.video.src}
                label={product.video.label}
              />
            </div>

            <div className="bos-product-stage-photo-wrap">
              <img
                src={product.image.src}
                alt={product.image.alt}
                className="bos-product-stage-photo"
              />

              <div className="bos-product-stage-index" aria-hidden="true">
                <span>{product.index}</span>
                <span className="bos-product-stage-index-divider">/</span>
                <span>02</span>
              </div>
            </div>

            <button
              type="button"
              className="bos-product-stage-purchase"
              onClick={handleCheckout}
              aria-label={product.purchase.ariaLabel}
            >
              <span className="bos-product-stage-purchase-label">
                {product.purchase.label}
              </span>

              <span className="bos-product-stage-purchase-title">
                {product.purchase.title}
              </span>

              <span className="bos-product-stage-purchase-description">
                {product.purchase.description}
              </span>

              <span className="bos-product-stage-purchase-action">
                <span>ZAMÓW ROZWIĄZANIE DLA SWOJEJ FIRMY</span>
                <span aria-hidden="true">→</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
