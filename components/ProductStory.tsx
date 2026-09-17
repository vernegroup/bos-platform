"use client";

import { useEffect, useRef, useState } from "react";

import ProductStage from "./ProductStage";
import { bosProducts } from "@/data/products";

export default function ProductStory() {
  const storyRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const story = storyRef.current;

    if (!story) return;

    let frame = 0;

    function updateActiveProduct() {
      frame = 0;

      const rect = story.getBoundingClientRect();
      const scrollableDistance = Math.max(
        story.offsetHeight - window.innerHeight,
        1
      );
      const progress = Math.min(
        1,
        Math.max(0, -rect.top / scrollableDistance)
      );

      setActiveIndex(progress >= 0.5 ? 1 : 0);
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

  return (
    <div ref={storyRef} className="bos-product-story">
      <div className="bos-product-story-sticky">
        <div
          className="bos-product-story-panel"
          data-active-product={bosProducts[activeIndex].id}
        >
          <ProductStage product={bosProducts[activeIndex]} />
        </div>
      </div>
    </div>
  );
}
