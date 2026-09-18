"use client";

import { useEffect, useRef, useState } from "react";

import ProductStage from "./ProductStage";
import { bosProducts } from "@/data/products";

export default function ProductStory() {
  const storyRef = useRef<HTMLDivElement>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const story = storyRef.current;

    if (!story) return;

    let frame = 0;

    function updateActiveProduct() {
      frame = 0;

      if (window.matchMedia("(max-width: 800px)").matches) return;

      const rect = story.getBoundingClientRect();
      const scrollableDistance = Math.max(
        story.offsetHeight - window.innerHeight,
        1
      );
      const progress = Math.min(
        1,
        Math.max(0, -rect.top / scrollableDistance)
      );

      setActiveIndex(progress >= 0.46 ? 1 : 0);
    }

    function handleScroll() {
      if (frame) return;

      frame = window.requestAnimationFrame(updateActiveProduct);
    }

    updateActiveProduct();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  useEffect(() => {
    if (activeIndex === displayIndex) return;

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }

    setIsTransitioning(true);

    transitionTimerRef.current = setTimeout(() => {
      setDisplayIndex(activeIndex);
      setIsTransitioning(false);
      transitionTimerRef.current = null;
    }, 180);

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [activeIndex, displayIndex]);

  return (
    <section id="produkty" className="bos-product-story-root" aria-label="Produkty BOS">
      <div ref={storyRef} className="bos-product-story bos-product-story-desktop">
        <div className="bos-product-story-sticky">
          <div
            className={`bos-product-story-panel${isTransitioning ? " is-transitioning" : ""}`}
            data-active-product={bosProducts[displayIndex].id}
          >
            <ProductStage
              product={bosProducts[displayIndex]}
              instanceId="desktop"
            />
          </div>
        </div>
      </div>

      <div className="bos-product-story-mobile">
        {bosProducts.map((product) => (
          <ProductStage
            key={product.id}
            product={product}
            instanceId={`mobile-${product.id}`}
          />
        ))}
      </div>
    </section>
  );
}
