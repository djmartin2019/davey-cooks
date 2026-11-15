import type { RecipeStatus, RecipeSummary } from "./recipes";

export const site = {
  name: "Davey Cooks",
  tagline: "Good food. Some experiments. A few lessons learned.",
  description:
    "A personal cooking journal: recipes made at home, what worked, what didn't, and what I'll do differently next time.",
  /** Production URL. Override with NEXT_PUBLIC_SITE_URL (e.g. for a staging build). */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://davey-cooks.djm-apps.com",
};

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

/** Total time only when both parts were recorded. */
export function totalMinutes(r: Pick<RecipeSummary, "estimated_prep_minutes" | "estimated_cook_minutes">) {
  if (r.estimated_prep_minutes === null || r.estimated_cook_minutes === null) return null;
  return r.estimated_prep_minutes + r.estimated_cook_minutes;
}

export const statusLabel: Record<RecipeStatus, string> = {
  cooked: "Cooked",
  "cooked-needs-refinement": "Cooked · still refining",
  planned: "Planned · not yet cooked",
};

export const statusShortLabel: Record<RecipeStatus, string> = {
  cooked: "Cooked",
  "cooked-needs-refinement": "Refining",
  planned: "Planned",
};

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** ISO 8601 duration for schema.org. */
export function isoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? `${h}H` : ""}${m || !h ? `${m}M` : ""}`;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(Date.UTC(y, m - 1, d));
}
