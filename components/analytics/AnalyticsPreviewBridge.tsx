"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BrowserCollector } from "@/analytics/browser/browser-collector";

function analyticsEnvironment(): "production" | "preview" | "development" {
  if (process.env.NODE_ENV === "development") return "development";
  return process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "production" : "preview";
}

export function AnalyticsPreviewBridge() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (analyticsEnvironment() !== "preview") return;
    const collector = new BrowserCollector({
      domain: "standardybiznesu.pl",
      appId: "bos-platform",
      environment: "preview",
      path: () => window.location.pathname,
    });

    collector.emit("session_start");

    const click = (event: MouseEvent) => collector.click(event);
    let lastScroll = -1;
    const scroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const depth = max > 0 ? window.scrollY / max : 1;
      const bucket = Math.min(4, Math.floor(Math.max(0, Math.min(1, depth)) * 4));
      if (bucket !== lastScroll) { lastScroll = bucket; collector.scroll(bucket / 4); }
    };

    document.addEventListener("click", click, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });

    return () => {
      document.removeEventListener("click", click);
      window.removeEventListener("scroll", scroll);
      collector.emit("session_end");
      void collector.flush();
    };
  }, []);

  useEffect(() => {
    if (analyticsEnvironment() !== "preview") return;
    const collector = new BrowserCollector({ domain: "standardybiznesu.pl", appId: "bos-platform", environment: "preview", path: () => window.location.pathname });
    const from = previousPath.current;
    if (from && from !== pathname) collector.navigation(from, pathname);
    collector.pageView();
    previousPath.current = pathname;
    void collector.flush();
  }, [pathname]);

  return null;
}
