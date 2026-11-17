import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeCard } from "@/components/recipe-card";
import { RecipePhoto } from "@/components/recipe-photo";
import { ProcessPhotos } from "@/components/recipe/process-photos";
import { RecipeSections } from "@/components/recipe/recipe-sections";
import { KeepAwakeToggle, PrintButton } from "@/components/recipe/recipe-tools";
import { StatusTag } from "@/components/status-tag";
import { capitalize, formatDate, formatMinutes, isoDuration, site, totalMinutes } from "@/lib/format";
import { listItems, splitSections } from "@/lib/recipe-sections";
import { getAllRecipes, getRecipeBySlug, getRelatedRecipes, isCooked, type Recipe } from "@/lib/recipes";

export async function generateStaticParams() {
  const recipes = await getAllRecipes();
  return recipes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/recipes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) return {};

  const url = `/recipes/${recipe.slug}/`;
  return {
    title: recipe.title,
    description: recipe.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: recipe.title,
      description: recipe.description,
      url,
      images: recipe.image ? [{ url: recipe.image, alt: recipe.image_alt ?? "" }] : [site.ogImage],
      tags: recipe.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: recipe.title,
      description: recipe.description,
    },
  };
}

export default async function RecipePage({ params }: PageProps<"/recipes/[slug]">) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) notFound();

  const all = await getAllRecipes();
  const related = getRelatedRecipes(recipe, all);
  const sections = splitSections(recipe.body);
  const has = (kind: string) => sections.some((s) => s.kind === kind);
  const total = totalMinutes(recipe);

  const facts = [
    recipe.estimated_prep_minutes !== null && { label: "Prep", value: formatMinutes(recipe.estimated_prep_minutes) },
    recipe.estimated_cook_minutes !== null && { label: "Cook", value: formatMinutes(recipe.estimated_cook_minutes) },
    total !== null && { label: "Total", value: formatMinutes(total) },
    recipe.servings !== null && { label: "Serves", value: String(recipe.servings) },
  ].filter((f): f is { label: string; value: string } => Boolean(f));

  return (
    <>
      <RecipeJsonLd recipe={recipe} />

      <article>
        {/* ------------------------------------------------------ Header */}
        <header className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 md:pt-12">
          <Link
            href="/recipes/"
            className="no-print group inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink"
          >
            <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">
              &larr;
            </span>
            All recipes
          </Link>

          <div className="mt-8 grid gap-10 md:grid-cols-12 md:gap-10 lg:gap-16">
            <div className="flex flex-col md:col-span-7 md:py-4 lg:col-span-6">
              <p className="label flex flex-wrap items-center gap-x-3 gap-y-1 text-olive">
                <span>{capitalize(recipe.category)}</span>
                {recipe.protein && (
                  <>
                    <span aria-hidden="true" className="text-linen">/</span>
                    <span>{capitalize(recipe.protein)}</span>
                  </>
                )}
              </p>
              <h1 className="mt-4 font-serif text-[2.75rem] leading-[1.02] tracking-[-0.025em] text-balance sm:text-6xl lg:text-[4.25rem]">
                {recipe.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft md:text-xl">
                {recipe.description}
              </p>

              <div className="mt-6">
                <StatusTag status={recipe.status} long />
                {recipe.status === "cooked-needs-refinement" && (
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                    This is the version as cooked. It worked, but not perfectly. The kitchen notes and next-time
                    plans below cover what I&rsquo;d change.
                  </p>
                )}
                {recipe.status === "planned" && (
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
                    I haven&rsquo;t recorded a cook of this one yet, so it&rsquo;s untested. Treat it as a plan
                    rather than a proven recipe.
                  </p>
                )}
              </div>

              {facts.length > 0 && (
                <dl className="mt-8 grid grid-cols-2 border-y border-linen sm:grid-cols-4 md:mt-auto md:translate-y-0">
                  {facts.map((fact, i) => (
                    <div
                      key={fact.label}
                      className={`py-4 ${i % 2 === 1 ? "pl-5 sm:pl-0" : ""} ${i > 0 ? "sm:border-l sm:border-linen sm:pl-5" : ""} ${i > 1 ? "border-t border-linen sm:border-t-0" : ""}`}
                    >
                      <dt className="label text-ink-soft">{fact.label}</dt>
                      <dd className="mt-1 font-serif text-2xl">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="no-print mt-6 flex flex-wrap items-center gap-3">
                {has("ingredients") && (
                  <a href="#ingredients" className="link-underline mr-3 text-sm font-medium">
                    Jump to ingredients
                  </a>
                )}
                <PrintButton />
                <KeepAwakeToggle />
              </div>
            </div>

            {/* Hidden in print as a whole, so the photo frame leaves no blank gap. */}
            <figure className="no-print md:col-span-5 lg:col-span-6">
              <div className="aspect-[4/5] md:sticky md:top-6 lg:aspect-[5/6]">
                <RecipePhoto
                  src={recipe.image}
                  alt={recipe.image_alt}
                  title={recipe.title}
                  priority
                  sizes="(min-width: 1024px) 45vw, (min-width: 768px) 42vw, 100vw"
                />
              </div>
            </figure>
          </div>
        </header>

        {/* -------------------------------------------------------- Body */}
        <RecipeSections sections={sections} status={recipe.status} />

        <ProcessPhotos photos={recipe.gallery} />

        {/* ----------------------------------------------- Provenance */}
        {(recipe.source || recipe.date_cooked || recipe.tags.length > 0) && (
          <footer className="mx-auto mt-16 max-w-3xl px-5 sm:px-8">
            <dl className="grid gap-4 border-t border-linen pt-6 text-sm text-ink-soft sm:grid-cols-[8rem_1fr]">
              {recipe.date_cooked && (
                <>
                  <dt className="label pt-0.5">Last cooked</dt>
                  <dd>{formatDate(recipe.date_cooked)}</dd>
                </>
              )}
              {recipe.source && (
                <>
                  <dt className="label pt-0.5">Source</dt>
                  <dd>{recipe.source}</dd>
                </>
              )}
              {recipe.tags.length > 0 && (
                <>
                  <dt className="label pt-0.5">Tags</dt>
                  <dd>
                    <ul className="flex flex-wrap gap-x-3 gap-y-1">
                      {recipe.tags.map((tag) => (
                        <li key={tag}>#{tag}</li>
                      ))}
                    </ul>
                  </dd>
                </>
              )}
            </dl>
            <p className="print-only mt-4 text-xs">
              {site.name} · {new URL(`/recipes/${recipe.slug}/`, site.url).toString()}
            </p>
          </footer>
        )}
      </article>

      {/* ------------------------------------------------------ Related */}
      {related.length > 0 && (
        <aside aria-labelledby="related-title" className="no-print mx-auto mt-24 max-w-7xl px-5 sm:px-8 md:mt-32">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-ink pt-6">
            <div>
              <p className="label text-olive">Keep cooking</p>
              <h2 id="related-title" className="mt-3 font-serif text-4xl tracking-[-0.015em]">
                More from the kitchen
              </h2>
            </div>
            <Link href="/recipes/" className="link-underline mb-1 text-[0.95rem] font-medium">
              All recipes <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <RecipeCard key={r.slug} recipe={r} />
            ))}
          </div>
        </aside>
      )}
    </>
  );
}

/**
 * schema.org Recipe data. Only emitted for recipes that have actually been
 * cooked, and only with fields that exist in the source — no ratings,
 * nutrition, or invented dates.
 */
function RecipeJsonLd({ recipe }: { recipe: Recipe }) {
  if (!isCooked(recipe)) return null;

  const sections = splitSections(recipe.body);
  const ingredients = sections.filter((s) => s.kind === "ingredients").flatMap((s) => listItems(s.content, false));
  const steps = sections.filter((s) => s.kind === "instructions").flatMap((s) => listItems(s.content, true));
  if (ingredients.length === 0 || steps.length === 0) return null;

  const total = totalMinutes(recipe);
  const data = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    url: new URL(`/recipes/${recipe.slug}/`, site.url).toString(),
    ...(recipe.image && { image: [new URL(recipe.image, site.url).toString()] }),
    author: { "@type": "Organization", name: site.name, url: site.url },
    recipeCategory: capitalize(recipe.category),
    ...(recipe.tags.length && { keywords: recipe.tags.join(", ") }),
    ...(recipe.servings !== null && { recipeYield: `${recipe.servings} servings` }),
    ...(recipe.estimated_prep_minutes !== null && { prepTime: isoDuration(recipe.estimated_prep_minutes) }),
    ...(recipe.estimated_cook_minutes !== null && { cookTime: isoDuration(recipe.estimated_cook_minutes) }),
    ...(total !== null && { totalTime: isoDuration(total) }),
    ...(recipe.date_published && { datePublished: recipe.date_published }),
    recipeIngredient: ingredients,
    recipeInstructions: steps.map((text) => ({ "@type": "HowToStep", text })),
  };

  return (
    <script
      type="application/ld+json"
      // Escape "<" so recipe text can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
