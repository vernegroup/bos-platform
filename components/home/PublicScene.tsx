"use client";

import { useEffect } from "react";

const lights = [
  ["cyan","near","left"],
  ["violet","far","left"],
  ["blue","mid","right"],
  ["magenta","near","right"],
  ["amber","far","center"],
  ["cyan","mid","center"],
  ["violet","near","center"],
  ["blue","far","right"],
] as const;

export default function PublicScene() {
  useEffect(() => {
    let frame = 0;
    const root = document.documentElement;

    const update = () => {
      frame = 0;
      const max = Math.max(root.scrollHeight - window.innerHeight, 1);
      root.style.setProperty("--bos-public-scroll", Math.min(Math.max(window.scrollY / max, 0), 1).toFixed(4));
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.style.removeProperty("--bos-public-scroll");
    };
  }, []);

  return (
    <div className="bos-public-scene" aria-hidden="true">
      <div className="bos-public-scene__base" />
      <div className="bos-public-scene__volume bos-public-scene__volume--one" />
      <div className="bos-public-scene__volume bos-public-scene__volume--two" />
      <div className="bos-public-scene__plane bos-public-scene__plane--floor" />
      <div className="bos-public-scene__plane bos-public-scene__plane--ceiling" />
      <div className="bos-public-scene__frame" />
      <div className="bos-public-scene__lights">
        {lights.map(([tone, depth, position], index) => (
          <i
            key={index}
            className={`bos-public-light bos-public-light--${tone} bos-public-light--${depth} bos-public-light--${position} bos-public-light--n${index + 1}`}
          />
        ))}
      </div>
      <div className="bos-public-scene__vignette" />
      <div className="bos-public-scene__grain" />
    </div>
  );
}
