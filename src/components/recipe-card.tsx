import clsx from "clsx";
import Link from "next/link";
import { capitalize, formatMinutes, totalMinutes } from "@/lib/format";
import type { RecipeSummary } from "@/lib/recipes";
import { RecipePhoto } from "./recipe-photo";
import { StatusTag } from "./status-tag";

type Props = {
  recipe: RecipeSummary;
  sizes?: string;
  priority?: boolean;
  /** Heading level for the title, so cards fit the surrounding outline. */
  headingLevel?: "h2" | "h3";
  className?: string;
};

/**
 * Editorial recipe teaser: photo, small metadata line, serif title, short
 * description. The whole card is one link; the title carries the link text.
 */
export function RecipeCard({
  recipe,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority,
  headingLevel: Heading = "h3",
  className,
}: Props) {
  const total = totalMinutes(recipe);
  const time = total ?? recipe.estimated_cook_minutes;
  const planned = recipe.status === "planned";

  return (
    <article className={clsx("group relative flex flex-col", className)}>
      <div className="aspect-[4/5] overflow-hidden">
        <RecipePhoto
          src={recipe.image}
          alt={recipe.image_alt}
          title={recipe.title}
          sizes={sizes}
          priority={priority}
          className={clsx(
            "transition-transform duration-500 ease-out group-hover:scale-[1.025]",
            planned && recipe.image && "opacity-90",
          )}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft">
        {recipe.protein && <span className="label">{capitalize(recipe.protein)}</span>}
        {recipe.protein && <span aria-hidden="true" className="text-linen">/</span>}
        <StatusTag status={recipe.status} />
      </div>

      <Heading className="mt-2 font-serif text-[1.55rem] leading-[1.15] tracking-[-0.01em] text-balance">
        <Link
          href={`/recipes/${recipe.slug}/`}
          className="decoration-terracotta decoration-1 underline-offset-[0.18em] group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-terracotta"
        >
          {recipe.title}
        </Link>
      </Heading>

      <p className="mt-2 line-clamp-3 text-[0.95rem] leading-relaxed text-ink-soft">
        {recipe.description}
      </p>

      {time !== null && (
        <p className="mt-3 text-sm text-ink-soft">
          <span className="sr-only">{total !== null ? "Total time: " : "Cook time: "}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="mr-1.5 inline size-3.5 -translate-y-px"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          >
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 4.5V8l2.25 1.5" strokeLinecap="round" />
          </svg>
          {formatMinutes(time)}
          {total === null && " cook"}
        </p>
      )}
    </article>
  );
}
