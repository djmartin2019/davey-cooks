import type { Metadata } from "next";
import { RecipeGallery } from "@/components/recipe-gallery";
import { getRecipeSummaries } from "@/lib/recipes";

const description =
  "Every recipe in the Davey Cooks kitchen journal, with photos, cooking notes, and plans for next time.";

export const metadata: Metadata = {
  title: "Recipes",
  description,
  alternates: { canonical: "/recipes/" },
  openGraph: { title: "Recipes · Davey Cooks", description, url: "/recipes/" },
};

export default async function RecipesPage() {
  const recipes = await getRecipeSummaries();

  return (
    <div className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 md:pt-20">
      <header className="max-w-2xl">
        <p className="label text-olive">The collection</p>
        <h1 className="mt-4 font-serif text-6xl leading-none tracking-[-0.025em] md:text-7xl">Recipes</h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          Everything I&rsquo;ve cooked and written down, plus a few things still on the list.
          Each one comes with notes on how it actually went.
        </p>
      </header>

      <RecipeGallery recipes={recipes} />
    </div>
  );
}
