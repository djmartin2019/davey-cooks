"use client";

import { useEffect, useRef, useState } from "react";

const buttonClass =
  "inline-flex items-center gap-2 border border-linen px-3.5 py-2 text-sm font-medium transition-colors hover:border-ink aria-pressed:border-olive aria-pressed:bg-olive aria-pressed:text-ivory";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M4.5 6V2.5h7V6M4.5 11.5h-2v-5h11v5h-2" />
        <path d="M4.5 9.5h7v4h-7z" />
      </svg>
      Print recipe
    </button>
  );
}

/**
 * Keeps the phone screen on while cooking (Screen Wake Lock API).
 * Renders nothing in browsers that don't support it.
 */
export function KeepAwakeToggle() {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const lock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature detection after hydration
    setSupported("wakeLock" in navigator);
    return () => {
      lock.current?.release().catch(() => {});
    };
  }, []);

  // The browser drops the lock when the tab is hidden; re-acquire on return.
  useEffect(() => {
    if (!active) return;
    const onVisible = async () => {
      if (document.visibilityState === "visible" && !lock.current) {
        try {
          lock.current = await navigator.wakeLock.request("screen");
          lock.current.addEventListener("release", () => (lock.current = null));
        } catch {
          setActive(false);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active]);

  if (!supported) return null;

  const toggle = async () => {
    if (active) {
      await lock.current?.release().catch(() => {});
      lock.current = null;
      setActive(false);
      return;
    }
    try {
      lock.current = await navigator.wakeLock.request("screen");
      lock.current.addEventListener("release", () => (lock.current = null));
      setActive(true);
    } catch {
      setActive(false);
    }
  };

  return (
    <button type="button" aria-pressed={active} onClick={toggle} className={buttonClass}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.3">
        <rect x="4.5" y="1.5" width="7" height="13" rx="1.2" />
        <path d="M7 12.25h2" strokeLinecap="round" />
      </svg>
      {active ? "Screen stays on" : "Keep screen on"}
    </button>
  );
}
