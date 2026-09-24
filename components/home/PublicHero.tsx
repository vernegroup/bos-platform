"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function PublicHero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const travel = Math.max(root.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(-rect.top / travel, 0), 1);
      root.style.setProperty("--hero-progress", progress.toFixed(4));
      root.style.setProperty("--hero-shift", Math.min(progress / .72, 1).toFixed(4));
      root.style.setProperty("--hero-reveal", Math.min(Math.max((progress - .58) / .22, 0), 1).toFixed(4));
    };
    const wake = () => { if (!frame) frame = window.requestAnimationFrame(update); };

    update();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    reduced.addEventListener("change", wake);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      reduced.removeEventListener("change", wake);
    };
  }, []);

  return (
    <section ref={rootRef} className="bos-public-hero" aria-labelledby="bos-home-title">
      <div className="bos-public-hero__sticky">
        <div className="bos-public-hero__copy">
          <span className="bos-public-hero__eyebrow">STANDARDY OPERACYJNE BIZNESU</span>
          <h1 id="bos-home-title"><span>Porządek</span><br /><em>ma strukturę.</em></h1>
          <p>BOS porządkuje powtarzalną pracę firmy w system, który można wdrożyć, kontrolować i rozwijać.</p>
          <div className="bos-public-hero__cta">
            <a href="#produkty">POZNAJ BOS <span aria-hidden="true">→</span></a>
            <Link href="/register">UTWÓRZ KONTO</Link>
          </div>
        </div>
        <div className="bos-public-hero__marker" aria-hidden="true">
          <span>SCROLL</span><i />
        </div>
      </div>
    </section>
  );
}
