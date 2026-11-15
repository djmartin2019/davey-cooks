import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/format";
import { getRecipeSummaries, isCooked } from "@/lib/recipes";

const description =
  "Davey Cooks is a home cooking journal: the recipes I make, what works, what doesn't, and what I'll do differently next time.";

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: { canonical: "/about/" },
  openGraph: { title: `About · ${site.name}`, description, url: "/about/" },
};

export default async function AboutPage() {
  const recipes = await getRecipeSummaries();
  // A different photo from the homepage hero, when there is one.
  const withPhotos = recipes.filter((r) => isCooked(r) && r.image);
  const photo = withPhotos[1] ?? withPhotos[0];

  return (
    <div className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 md:pt-20">
      <div className="grid gap-12 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-7 lg:col-span-6">
          <p className="label text-olive">About</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.02] tracking-[-0.025em] text-balance md:text-7xl">
            Cooking, <em className="text-terracotta italic">written down.</em>
          </h1>

          <div className="mt-10 max-w-xl space-y-6 text-lg leading-relaxed">
            <p className="font-serif text-[1.45rem] leading-[1.5]">
              I&rsquo;m not a professional chef. I just enjoy cooking, trying new things, and figuring out what
              makes a good meal.
            </p>
            <p className="text-ink-soft">
              Davey Cooks is where I keep track of the recipes I make: what I actually used, how I cooked it,
              what worked, what didn&rsquo;t, and what I&rsquo;ll do differently next time.
            </p>
            <p className="text-ink-soft">
              It&rsquo;s a personal record first, but if something here looks good to you, please cook it.
            </p>
          </div>

          <div className="mt-14 border-t border-ink pt-8">
            <h2 className="font-serif text-3xl tracking-[-0.015em]">How the recipes work</h2>
            <dl className="mt-6 divide-y divide-linen border-b border-linen">
              <div className="grid gap-1 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="label pt-1 text-olive">Ingredients &amp; steps</dt>
                <dd className="leading-relaxed text-ink-soft">
                  What I actually used and did. If I didn&rsquo;t measure something, the recipe says so rather
                  than guessing.
                </dd>
              </div>
              <div className="grid gap-1 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="label pt-1 text-olive">Kitchen notes</dt>
                <dd className="leading-relaxed text-ink-soft">
                  Honest observations from the actual cook: the good parts and the parts that missed.
                </dd>
              </div>
              <div className="grid gap-1 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="label pt-1 text-terracotta-deep">Next time</dt>
                <dd className="leading-relaxed text-ink-soft">
                  Ideas for the next attempt. These haven&rsquo;t been tested yet, so they&rsquo;re kept
                  separate from the recipe itself.
                </dd>
              </div>
              <div className="grid gap-1 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="label pt-1 text-ink-soft">Planned</dt>
                <dd className="leading-relaxed text-ink-soft">
                  Recipes written up before cooking, or without a recorded result. They&rsquo;re clearly
                  labelled and never presented as tested.
                </dd>
              </div>
            </dl>
          </div>

          <Link
            href="/recipes/"
            className="mt-12 inline-flex items-center gap-2 bg-ink px-6 py-3.5 text-[0.95rem] font-medium text-ivory transition-colors hover:bg-olive"
          >
            Browse the recipes <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {photo?.image && (
          <figure className="md:col-span-5 lg:col-span-5 lg:col-start-8">
            <div className="relative aspect-[4/5] overflow-hidden bg-linen-soft md:sticky md:top-6">
              <Image
                src={photo.image}
                alt={photo.image_alt ?? ""}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm text-ink-soft">
              <Link href={`/recipes/${photo.slug}/`} className="link-underline font-serif text-base italic">
                {photo.title}
              </Link>
            </figcaption>
          </figure>
        )}
      </div>
    </div>
  );
}
