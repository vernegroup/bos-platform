"use client";

import { signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 15 * 1000;
const LAST_ACTIVITY_KEY = "bos:last-activity";

export default function SessionIdleGuard() {
  const signingOutRef = useRef(false);
  const lastWriteRef = useRef(0);

  useEffect(() => {
    const now = Date.now();

    function readLastActivity() {
      try {
        const value = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY));
        return Number.isFinite(value) && value > 0 ? value : now;
      } catch {
        return now;
      }
    }

    function writeActivity(force = false) {
      const current = Date.now();
      if (!force && current - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return;
      lastWriteRef.current = current;
      try {
        window.localStorage.setItem(LAST_ACTIVITY_KEY, String(current));
      } catch {
        // Storage may be unavailable in privacy modes. The in-page timer still works.
      }
    }

    async function expireIfIdle() {
      if (signingOutRef.current) return;
      const lastActivity = readLastActivity();
      if (Date.now() - lastActivity < IDLE_TIMEOUT_MS) return;

      signingOutRef.current = true;
      try {
        window.localStorage.removeItem(LAST_ACTIVITY_KEY);
      } catch {}
      await signOut({ callbackUrl: "/login?reason=idle" });
    }

    function onActivity() {
      if (document.visibilityState === "visible") writeActivity();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void expireIfIdle();
    }

    function onFocus() {
      void expireIfIdle();
    }

    writeActivity(true);

    const activityEvents: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, onActivity, { passive: true })
    );
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    const interval = window.setInterval(() => {
      void expireIfIdle();
    }, CHECK_INTERVAL_MS);

    return () => {
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, onActivity)
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
