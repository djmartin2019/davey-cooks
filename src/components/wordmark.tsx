import clsx from "clsx";

/**
 * Typographic wordmark. The small terracotta mark is three rising lines of
 * steam over a pan rim — a quiet culinary detail rather than a logo.
 */
export function Wordmark({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <span className={clsx("inline-flex items-end gap-2 font-serif leading-none", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={clsx("shrink-0 text-terracotta", size === "lg" ? "mb-1.5 size-7" : "mb-1 size-5")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M8 3.5c-1.2 1.4 1.2 2.6 0 4.2" />
        <path d="M12 2.5c-1.2 1.4 1.2 2.6 0 4.2s1.2 2.6 0 4.2" />
        <path d="M16 3.5c-1.2 1.4 1.2 2.6 0 4.2" />
        <path d="M3 14.5h18" />
        <path d="M4.5 14.5c.6 3.6 3.6 6 7.5 6s6.9-2.4 7.5-6" />
      </svg>
      <span className={clsx("tracking-[-0.01em]", size === "lg" ? "text-4xl" : "text-[1.6rem]")}>
        Davey <em className="font-normal text-terracotta italic">Cooks</em>
      </span>
    </span>
  );
}
