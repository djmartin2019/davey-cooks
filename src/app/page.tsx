import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RecipeCard } from "@/components/recipe-card";
import { SectionHeading } from "@/components/section-heading";
import { capitalize, site } from "@/lib/format";
import { getRecipeSummaries, isCooked } from "@/lib/recipes";

export async function generateMetadata(): Promise<Metadata> {
  const recipes = await getRecipeSummaries();
  const hero = recipes.find((r) => isCooked(r) && r.image);
  return {
    title: { absolute: `${site.name} — Good food, made at home` },
    description: site.description,
    alternates: { canonical: "/" },
    openGraph: {
      title: site.name,
      description: site.description,
      url: "/",
      images: hero?.image ? [{ url: hero.image, alt: hero.image_alt ?? "" }] : undefined,
    },
  };
}

export default async function HomePage() {
  const recipes = await getRecipeSummaries();
  const cooked = recipes.filter(isCooked);
  const planned = recipes.filter((r) => !isCooked(r));
  // Recipes are already ordered: featured first, then by date, then title.
  const hero = cooked.find((r) => r.image);
  const latest = cooked.slice(0, 3);

  const proteins = Array.from(
    recipes.reduce((map, r) => {
      if (!r.protein) return map;
      const entry = map.get(r.protein) ?? { count: 0, image: null as null | { src: string; alt: string } };
      entry.count += 1;
      if (!entry.image && r.image && r.image_alt) entry.image = { src: r.image, alt: r.image_alt };
      map.set(r.protein, entry);
      return map;
    }, new Map<string, { count: number; image: null | { src: string; alt: string } }>()),
  ).sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));

  return (
    <>
      {/* ---------------------------------------------------------- Hero */}
      <section aria-labelledby="hero-title" className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 md:pt-16">
        <div className="grid items-end gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-6 md:pb-6 lg:col-span-6">
            <p className="label text-olive">A home cooking journal</p>
            <h1
              id="hero-title"
              className="mt-5 font-serif text-[3.1rem] leading-[0.98] tracking-[-0.025em] text-balance sm:text-7xl lg:text-[5.6rem]"
            >
              Good food, <em className="text-terracotta italic">made at home.</em>
            </h1>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-ink-soft md:text-xl">
              A collection of recipes, experiments, and everything I&rsquo;m learning along the way.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/recipes/"
                className="inline-flex items-center gap-2 bg-ink px-6 py-3.5 text-[0.95rem] font-medium text-ivory transition-colors hover:bg-olive"
              >
                Browse the recipes
                <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link href="/about/" className="link-underline text-[0.95rem] font-medium">
                Why this exists
              </Link>
            </div>
          </div>

          {hero?.image && (
            <figure className="md:col-span-6 lg:col-span-5 lg:col-start-8">
              <Link href={`/recipes/${hero.slug}/`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-linen-soft">
                  <Image
                    src={hero.image}
                    alt={hero.image_alt ?? ""}
                    fill
                    priority
                    sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                </div>
                <figcaption className="mt-3 flex items-baseline justify-between gap-4 border-b border-linen pb-3 text-sm">
                  <span className="text-ink-soft">
                    <span className="label mr-2 text-olive">On the plate</span>
                    <span className="font-serif text-base text-ink italic group-hover:underline decoration-terracotta underline-offset-4">
                      {hero.title}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-terracotta">&rarr;</span>
                </figcaption>
              </Link>
            </figure>
          )}
        </div>
      </section>

      {/* ---------------------------------------------- From the kitchen */}
      {latest.length > 0 && (
        <section aria-labelledby="latest-title" className="mx-auto mt-24 max-w-7xl px-5 sm:px-8 md:mt-36">
          <SectionHeading
            id="latest-title"
            eyebrow="Latest from the kitchen"
            title="Cooked, eaten, written down"
            action={{ href: "/recipes/", label: "All recipes" }}
          />
          <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((recipe) => (
              <RecipeCard key={recipe.slug} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- Browse */}
      {proteins.length > 0 && (
        <section aria-labelledby="browse-title" className="mx-auto mt-24 max-w-7xl px-5 sm:px-8 md:mt-36">
          <div className="grid gap-10 border-t border-ink pt-10 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-4">
              <p className="label text-olive">Browse</p>
              <h2 id="browse-title" className="mt-3 font-serif text-4xl leading-tight tracking-[-0.015em]">
                What&rsquo;s in the pan?
              </h2>
              <p className="mt-4 max-w-xs leading-relaxed text-ink-soft">
                Start with the main ingredient, or{" "}
                <Link href="/recipes/" className="link-underline text-ink">
                  see everything
                </Link>
                .
              </p>
            </div>
            <ul className="md:col-span-8">
              {proteins.map(([protein, { count, image }]) => (
                <li key={protein} className="border-b border-linen first:border-t md:first:border-t-0">
                  <Link
                    href={`/recipes/?protein=${encodeURIComponent(protein)}`}
                    className="group flex items-center gap-5 py-5 transition-colors"
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-linen-soft sm:size-16">
                      {image && (
                        <Image src={image.src} alt="" fill sizes="64px" className="object-cover" />
                      )}
                    </span>
                    <span className="font-serif text-3xl tracking-[-0.01em] transition-colors group-hover:text-terracotta sm:text-[2.6rem]">
                      {capitalize(protein)}
                    </span>
                    <span className="ml-auto flex items-center gap-4 text-sm text-ink-soft">
                      {count} {count === 1 ? "recipe" : "recipes"}
                      <span
                        aria-hidden="true"
                        className="text-lg text-terracotta transition-transform group-hover:translate-x-1"
                      >
                        &rarr;
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ------------------------------------------------- On the list */}
      {planned.length > 0 && (
        <section aria-labelledby="planned-title" className="mx-auto mt-24 max-w-7xl px-5 sm:px-8 md:mt-32">
          <div className="border border-dashed border-linen px-6 py-8 sm:px-10 sm:py-10">
            <p className="label text-ink-soft">On the list</p>
            <h2 id="planned-title" className="mt-3 font-serif text-3xl tracking-[-0.01em]">
              Planned, not yet cooked
            </h2>
            <p className="mt-2 max-w-xl text-ink-soft">
              Written up ahead of time. These haven&rsquo;t been tested yet, so treat them as a
              plan rather than a proven recipe.
            </p>
            <ul className="mt-6 divide-y divide-linen">
              {planned.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/recipes/${r.slug}/`}
                    className="group flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <span className="font-serif text-xl group-hover:text-terracotta">{r.title}</span>
                    <span className="text-sm text-ink-soft sm:ml-auto sm:max-w-md">
                      {r.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------ About */}
      <section aria-labelledby="about-title" className="mx-auto mt-24 max-w-7xl px-5 sm:px-8 md:mt-36">
        <div className="mx-auto max-w-3xl text-center">
          <p className="label text-olive">About</p>
          <h2
            id="about-title"
            className="mt-5 font-serif text-[2rem] leading-[1.2] tracking-[-0.015em] text-balance sm:text-[2.6rem]"
          >
            I&rsquo;m not a professional chef. I just like cooking, trying new things, and{" "}
            <em className="text-terracotta italic">figuring out what makes a good meal.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-ink-soft">
            Every recipe here was written down after actually making it, with honest notes on
            what worked and what I&rsquo;d change.
          </p>
          <Link href="/about/" className="link-underline mt-8 inline-block font-medium">
            More about Davey Cooks
          </Link>
        </div>
      </section>
    </>
  );
}
