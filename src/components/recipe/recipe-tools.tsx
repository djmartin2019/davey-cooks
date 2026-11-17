"use client";

import { useEffect, useRef, useState } from "react";

const buttonClass =
  "inline-flex items-center gap-2 border border-linen px-3.5 py-2 text-sm font-medium transition-colors hover:border-ink aria-pressed:border-olive aria-pressed:bg-olive aria-pressed:text-ivory";

/**
 * Opens the native share sheet where there is one (phones, and the
 * home-screen app, which has no browser share button of its own).
 * Elsewhere it copies the link to the clipboard.
 */
export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers / non-secure contexts: copy via a temporary textarea.
      const field = document.createElement("textarea");
      field.value = url;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2500);
  };

  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // The person closed the share sheet: nothing to do.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copy();
  };

  return (
    <button type="button" onClick={share} className={buttonClass}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.3">
        {copied ? (
          <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <path d="M8 10V1.75M5 4.5l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.5 7H3.5v7.5h9V7h-2" />
          </>
        )}
      </svg>
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}

/**
 * Desktop only. Phones rarely print, and iOS ignores window.print() in a
 * home-screen app, so the button would silently do nothing there.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`${buttonClass} max-md:hidden standalone:hidden`}
    >
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
