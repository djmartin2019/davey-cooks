"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { capitalize } from "@/lib/format";
import type { RecipeSummary } from "@/lib/recipes";
import { RecipeCard } from "./recipe-card";

type Filters = { protein: string | null; category: string | null; status: "all" | "cooked" | "planned" };

const initialFilters: Filters = { protein: null, category: null, status: "all" };

function unique(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort();
}

/**
 * Client-side filtering of the static recipe list. Filters are mirrored in
 * the query string (e.g. /recipes/?protein=beef) so they can be linked to.
 */
export function RecipeGallery({ recipes }: { recipes: RecipeSummary[] }) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const proteins = useMemo(() => unique(recipes.map((r) => r.protein)), [recipes]);
  const categories = useMemo(() => unique(recipes.map((r) => r.category)), [recipes]);
  const hasPlanned = recipes.some((r) => r.status === "planned");
  const hasCooked = recipes.some((r) => r.status !== "planned");

  // Read filters from the URL after hydration (static export: no server params).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const protein = params.get("protein");
    const category = params.get("category");
    const status = params.get("status");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from the URL once on mount
    setFilters({
      protein: protein && proteins.includes(protein) ? protein : null,
      category: category && categories.includes(category) ? category : null,
      status: status === "cooked" || status === "planned" ? status : "all",
    });
  }, [proteins, categories]);

  const update = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    const params = new URLSearchParams();
    if (merged.protein) params.set("protein", merged.protein);
    if (merged.category) params.set("category", merged.category);
    if (merged.status !== "all") params.set("status", merged.status);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

  const visible = recipes.filter(
    (r) =>
      (!filters.protein || r.protein === filters.protein) &&
      (!filters.category || r.category === filters.category) &&
      (filters.status === "all" ||
        (filters.status === "planned" ? r.status === "planned" : r.status !== "planned")),
  );

  const isFiltered = filters.protein || filters.category || filters.status !== "all";

  return (
    <>
      <div className="mt-12 flex flex-col gap-5 border-y border-linen py-5 md:mt-16 md:flex-row md:flex-wrap md:items-center md:gap-x-10">
        {proteins.length > 1 && (
          <FilterGroup
            label="Main ingredient"
            options={proteins.map((p) => ({ value: p, label: capitalize(p) }))}
            value={filters.protein}
            onChange={(protein) => update({ protein })}
          />
        )}
        {categories.length > 1 && (
          <FilterGroup
            label="Meal"
            options={categories.map((c) => ({ value: c, label: capitalize(c) }))}
            value={filters.category}
            onChange={(category) => update({ category })}
          />
        )}
        {hasPlanned && hasCooked && (
          <FilterGroup
            label="Status"
            options={[
              { value: "cooked", label: "Cooked" },
              { value: "planned", label: "Planned" },
            ]}
            value={filters.status === "all" ? null : filters.status}
            onChange={(status) => update({ status: (status ?? "all") as Filters["status"] })}
          />
        )}
        <p className="text-sm text-ink-soft md:ml-auto" aria-live="polite">
          {visible.length} of {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
        </p>
      </div>

      {visible.length > 0 ? (
        <ul className="mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((recipe, i) => (
            <li key={recipe.slug} className="flex">
              <RecipeCard recipe={recipe} headingLevel="h2" priority={i < 3} className="w-full" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-16 max-w-md">
          <p className="font-serif text-2xl">Nothing here yet.</p>
          <p className="mt-2 text-ink-soft">No recipes match those filters.</p>
          {isFiltered && (
            <button
              type="button"
              onClick={() => update(initialFilters)}
              className="link-underline mt-4 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const all = [{ value: null as string | null, label: "All" }, ...options];
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-x-1 gap-y-2">
      <span aria-hidden="true" className="label mr-3 w-full text-ink-soft sm:w-auto">
        {label}
      </span>
      {all.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(option.value)}
            className={clsx(
              "border px-3.5 py-1.5 text-sm transition-colors",
              pressed
                ? "border-ink bg-ink text-ivory"
                : "border-linen text-ink hover:border-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
