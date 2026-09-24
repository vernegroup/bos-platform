"use client";

import { useEffect } from "react";

const lights = [
  ["cyan","near"],["violet","far"],["blue","mid"],["magenta","near"],
  ["amber","far"],["cyan","mid"],["violet","near"],["blue","far"],
] as const;

export default function PublicScene() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let scrollTarget = 0, scrollCurrent = 0;
    let mouseTargetX = 0, mouseTargetY = 0, mouseX = 0, mouseY = 0;
    let active = true;

    const readScroll = () => {
      const max = Math.max(root.scrollHeight - window.innerHeight, 1);
      scrollTarget = Math.min(Math.max(window.scrollY / max, 0), 1);
    };

    const tick = () => {
      if (!active) return;
      if (reduced.matches) {
        root.style.setProperty("--bos-public-scroll", "0");
        root.style.setProperty("--bos-public-mouse-x", "0");
        root.style.setProperty("--bos-public-mouse-y", "0");
        frame = 0;
        return;
      }

      scrollCurrent += (scrollTarget - scrollCurrent) * .075;
      mouseX += (mouseTargetX - mouseX) * .045;
      mouseY += (mouseTargetY - mouseY) * .045;

      root.style.setProperty("--bos-public-scroll", scrollCurrent.toFixed(4));
      root.style.setProperty("--bos-public-mouse-x", mouseX.toFixed(4));
      root.style.setProperty("--bos-public-mouse-y", mouseY.toFixed(4));

      const unsettled =
        Math.abs(scrollTarget - scrollCurrent) > .0001 ||
        Math.abs(mouseTargetX - mouseX) > .0001 ||
        Math.abs(mouseTargetY - mouseY) > .0001;

      frame = unsettled ? window.requestAnimationFrame(tick) : 0;
    };

    const wake = () => { if (!frame) frame = window.requestAnimationFrame(tick); };
    const onScroll = () => { readScroll(); wake(); };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      mouseTargetX = Math.max(-1, Math.min(1, (event.clientX / window.innerWidth - .5) * 2));
      mouseTargetY = Math.max(-1, Math.min(1, (event.clientY / window.innerHeight - .5) * 2));
      wake();
    };
    const onLeave = () => { mouseTargetX = 0; mouseTargetY = 0; wake(); };
    const onVisibility = () => {
      active = !document.hidden;
      if (active) { readScroll(); wake(); }
      else if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
    };
    const onMotionPreference = () => { wake(); };

    readScroll();
    scrollCurrent = scrollTarget;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onMotionPreference);
    wake();

    return () => {
      active = false;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onMotionPreference);
      root.style.removeProperty("--bos-public-scroll");
      root.style.removeProperty("--bos-public-mouse-x");
      root.style.removeProperty("--bos-public-mouse-y");
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
        {lights.map(([tone, depth], index) => (
          <i key={index} className={`bos-public-light bos-public-light--${tone} bos-public-light--${depth} bos-public-light--n${index + 1}`} />
        ))}
      </div>
      <div className="bos-public-scene__vignette" />
      <div className="bos-public-scene__grain" />
    </div>
  );
}
