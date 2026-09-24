"use client";

import { useEffect, useState } from "react";

export default function PublicScene() {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
      setScroll(progress);
      document.documentElement.style.setProperty("--bos-public-scroll", progress.toFixed(4));
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.documentElement.style.removeProperty("--bos-public-scroll");
    };
  }, []);

  return (
    <div className="bos-public-scene" aria-hidden="true">
      <div className="bos-public-scene__base" />
      <div className="bos-public-scene__glow bos-public-scene__glow--left" />
      <div className="bos-public-scene__glow bos-public-scene__glow--right" />
      <div className="bos-public-scene__grid" />
      <div className="bos-public-scene__horizon" />
      <div
        className="bos-public-scene__signal"
        style={{ transform: `translate3d(0, ${scroll * -28}px, 0)` }}
      />
      <div className="bos-public-scene__vignette" />
    </div>
  );
}
