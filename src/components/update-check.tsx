"use client";

import { useEffect } from "react";

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID;
const MIN_INTERVAL_MS = 60_000;
const RELOAD_PARAM = "v";

/**
 * Keeps the home-screen app current. iOS resumes a saved copy of the page
 * instead of reloading it, so new recipes would never show up. Whenever the
 * page opens or comes back to the foreground, this fetches /version.json
 * (bypassing every cache) and, if a newer build is live, reloads the page.
 */
export function UpdateCheck() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !BUILD_ID) return;

    // Tidy the cache-busting ?v= left by a previous update reload.
    const url = new URL(window.location.href);
    if (url.searchParams.has(RELOAD_PARAM)) {
      url.searchParams.delete(RELOAD_PARAM);
      window.history.replaceState(window.history.state, "", url);
    }

    let lastCheck = 0;

    async function check() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastCheck < MIN_INTERVAL_MS) return;
      lastCheck = now;

      let latest: unknown;
      try {
        const res = await fetch(`/version.json?t=${now}`, { cache: "no-store" });
        if (!res.ok) return;
        latest = (await res.json())?.version;
      } catch {
        return; // Offline or a network hiccup: keep showing what we have.
      }
      if (typeof latest !== "string" || latest === BUILD_ID) return;

      // Reload at most once per page per new build, so a stubborn cache can
      // never cause a reload loop. Without storage, don't risk it.
      const key = `davey-cooks:update:${latest}:${window.location.pathname}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      } catch {
        return;
      }

      // A new URL can't be answered from the browser's saved copy.
      const next = new URL(window.location.href);
      next.searchParams.set(RELOAD_PARAM, latest);
      window.location.replace(next);
    }

    check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("pageshow", check);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("pageshow", check);
    };
  }, []);

  return null;
}
