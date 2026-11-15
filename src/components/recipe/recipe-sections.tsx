import clsx from "clsx";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { ReactNode } from "react";
import type { RecipeSection } from "@/lib/recipe-sections";
import type { RecipeStatus } from "@/lib/recipes";
import { ingredientComponents, instructionComponents } from "./mdx-components";

type MDXComponents = Parameters<typeof MDXRemote>[0]["components"];

function Mdx({ source, components }: { source: string; components?: MDXComponents }) {
  if (!source) return null;
  return <MDXRemote source={source} components={components} />;
}

function SectionTitle({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={clsx("font-serif text-3xl leading-tight tracking-[-0.015em] md:text-4xl", className)}>
      {children}
    </h2>
  );
}

/**
 * Renders every `##` section of a recipe, in source order, with a layout
 * suited to its role. Ingredients and Instructions share a two-column
 * cooking layout; unrecognized sections fall back to plain prose so no
 * content is dropped.
 */
export function RecipeSections({ sections, status }: { sections: RecipeSection[]; status: RecipeStatus }) {
  const ingredients = sections.filter((s) => s.kind === "ingredients");
  const instructions = sections.filter((s) => s.kind === "instructions");
  // Ingredients and Instructions render together, where the first of them appears.
  const firstCookingIndex = sections.findIndex((s) => s.kind === "ingredients" || s.kind === "instructions");

  const blocks = sections.map((section, index) => {
    switch (section.kind) {
      case "intro":
      case "overview":
        return <Overview key={section.id} section={section} />;

      case "ingredients":
      case "instructions":
        if (index !== firstCookingIndex) return null;
        return <CookingLayout key="cooking" ingredients={ingredients} instructions={instructions} />;

      case "kitchen-notes":
        return <KitchenNotes key={section.id} section={section} status={status} />;

      case "next-time":
        return <NextTime key={section.id} section={section} />;

      case "food-safety":
        return <FoodSafety key={section.id} section={section} />;

      case "references":
        return <References key={section.id} section={section} />;

      default:
        return <GenericSection key={section.id} section={section} />;
    }
  });

  return <div className="mt-16 md:mt-24">{blocks}</div>;
}

function Overview({ section }: { section: RecipeSection }) {
  return (
    <section aria-labelledby={section.heading ? section.id : undefined} className="mx-auto max-w-3xl px-5 sm:px-8">
      {section.heading && <SectionTitle id={section.id} className="sr-only">{section.heading}</SectionTitle>}
      <div className="recipe-prose overview-prose">
        <Mdx source={section.content} />
      </div>
    </section>
  );
}

function CookingLayout({
  ingredients,
  instructions,
}: {
  ingredients: RecipeSection[];
  instructions: RecipeSection[];
}) {
  return (
    <div className="mx-auto mt-16 grid max-w-7xl gap-14 px-5 sm:px-8 md:mt-20 lg:grid-cols-12 lg:gap-12">
      {ingredients.length > 0 && (
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="lg:sticky lg:top-6">
            {ingredients.map((section) => (
              <section
                key={section.id}
                aria-labelledby={section.id}
                className="border border-linen bg-paper px-5 py-7 sm:px-7 print:border-0 print:bg-transparent print:p-0"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <SectionTitle id={section.id}>{section.heading}</SectionTitle>
                </div>
                <form className="mt-5">
                  <div className="recipe-prose ingredients-prose text-base">
                    <Mdx source={section.content} components={ingredientComponents} />
                  </div>
                  <button
                    type="reset"
                    className="no-print link-underline mt-5 text-sm text-ink-soft hover:text-ink"
                  >
                    Clear checked items
                  </button>
                </form>
              </section>
            ))}
          </div>
        </div>
      )}

      {instructions.length > 0 && (
        <div className={clsx(ingredients.length > 0 ? "lg:col-span-7 xl:col-span-7 xl:col-start-6" : "lg:col-span-8 lg:col-start-3")}>
          {instructions.map((section) => (
            <section key={section.id} aria-labelledby={section.id} className="lg:pt-7">
              <SectionTitle id={section.id}>{section.heading}</SectionTitle>
              <div className="recipe-prose steps-prose mt-6 text-[1.0625rem]">
                <Mdx source={section.content} components={instructionComponents} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function KitchenNotes({ section, status }: { section: RecipeSection; status: RecipeStatus }) {
  const planned = status === "planned";
  return (
    <section aria-labelledby={section.id} className="mx-auto mt-20 max-w-3xl px-5 sm:px-8 md:mt-28">
      <div className="border-l-2 border-olive bg-olive-soft/60 px-6 py-8 sm:px-10 sm:py-10 print:bg-transparent">
        <p className="label text-olive">{planned ? "Notes so far" : "From the kitchen · as cooked"}</p>
        <SectionTitle id={section.id} className="mt-2">
          {section.heading}
        </SectionTitle>
        <div className="recipe-prose recipe-notes mt-6 text-[1.0625rem]">
          <Mdx source={section.content} />
        </div>
      </div>
    </section>
  );
}

function NextTime({ section }: { section: RecipeSection }) {
  return (
    <section aria-labelledby={section.id} className="mx-auto mt-10 max-w-3xl px-5 sm:px-8">
      <div className="border border-dashed border-terracotta/50 px-6 py-8 sm:px-10 sm:py-10">
        <p className="label text-terracotta-deep">Proposed · not yet tested</p>
        <SectionTitle id={section.id} className="mt-2">
          {section.heading}
        </SectionTitle>
        <div className="recipe-prose recipe-notes next-time-prose mt-6 text-[1.0625rem]">
          <Mdx source={section.content} />
        </div>
      </div>
    </section>
  );
}

function FoodSafety({ section }: { section: RecipeSection }) {
  return (
    <section aria-labelledby={section.id} className="mx-auto mt-10 max-w-3xl px-5 sm:px-8">
      <div className="flex gap-4 border-y border-linen py-6">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="mt-1 size-6 shrink-0 text-terracotta"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M10 13.5V4a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z" />
          <path d="M12 9v7" />
        </svg>
        <div>
          <h2 id={section.id} className="label text-ink">
            {section.heading}
          </h2>
          <div className="recipe-prose mt-2 text-[0.97rem] text-ink-soft">
            <Mdx source={section.content} />
          </div>
        </div>
      </div>
    </section>
  );
}

function References({ section }: { section: RecipeSection }) {
  return (
    <section aria-labelledby={section.id} className="mx-auto mt-14 max-w-3xl px-5 sm:px-8">
      <h2 id={section.id} className="label text-ink-soft">
        {section.heading}
      </h2>
      <div className="recipe-prose mt-3 text-[0.95rem] text-ink-soft">
        <Mdx source={section.content} />
      </div>
    </section>
  );
}

function GenericSection({ section }: { section: RecipeSection }) {
  return (
    <section aria-labelledby={section.id} className="mx-auto mt-16 max-w-3xl px-5 sm:px-8">
      <SectionTitle id={section.id}>{section.heading}</SectionTitle>
      <div className="recipe-prose mt-5 text-[1.0625rem]">
        <Mdx source={section.content} />
      </div>
    </section>
  );
}
