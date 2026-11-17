import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import { z } from "zod";

/**
 * Recipe content layer.
 *
 * Reads `content/recipes/*.mdx`, validates frontmatter against the contract
 * in docs/CONTENT_GUIDE.md, and returns typed recipe objects. Runs only at
 * build time (static export), so failures surface as build errors.
 */

const RECIPES_DIR = path.join(process.cwd(), "content", "recipes");
const PUBLIC_DIR = path.join(process.cwd(), "public");

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected a quoted YYYY-MM-DD date");
const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const recipeStatuses = ["planned", "cooked", "cooked-needs-refinement"] as const;

export const recipeFrontmatter = z
  .object({
    title: z.string().min(1),
    slug: z.string().regex(kebab),
    description: z.string().min(1),
    category: z.string().min(1),
    protein: z.string().min(1).nullable(),
    status: z.enum(recipeStatuses),
    servings: z.number().int().positive().nullable(),
    estimated_prep_minutes: z.number().int().nonnegative().nullable(),
    estimated_cook_minutes: z.number().int().nonnegative().nullable(),
    image: z.string().startsWith("/images/recipes/").nullable(),
    image_alt: z.string().min(1).nullable(),
    /** Optional process shots shown below the recipe, in cooking order. */
    gallery: z
      .array(
        z.object({
          src: z.string().startsWith("/images/recipes/"),
          alt: z.string().min(1),
          caption: z.string().min(1).optional(),
        }),
      )
      .default([]),
    tags: z.array(z.string().regex(kebab)),
    date_cooked: isoDate.nullable(),
    date_published: isoDate.nullable(),
    featured: z.boolean(),
    source: z.string().optional(),
  })
  .refine((r) => (r.image === null) === (r.image_alt === null), {
    message: "image and image_alt must both be set or both be null",
  })
  .refine((r) => r.status !== "planned" || r.date_cooked === null, {
    message: "planned recipes cannot have a date_cooked",
  });

export type RecipeFrontmatter = z.infer<typeof recipeFrontmatter>;
export type RecipeStatus = RecipeFrontmatter["status"];

/** Metadata only: safe to pass to Client Components. */
export type RecipeSummary = RecipeFrontmatter;

export type Recipe = RecipeFrontmatter & {
  /** MDX body without frontmatter. */
  body: string;
};

function readRecipeFile(fileName: string): Recipe {
  const filePath = path.join(RECIPES_DIR, fileName);
  const { data, content } = matter(fs.readFileSync(filePath, "utf8"));

  const parsed = recipeFrontmatter.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid frontmatter in content/recipes/${fileName}:\n${issues}`);
  }

  const recipe = parsed.data;
  const expectedSlug = fileName.replace(/\.mdx$/, "");
  if (recipe.slug !== expectedSlug) {
    throw new Error(
      `content/recipes/${fileName}: slug "${recipe.slug}" must match the filename ("${expectedSlug}")`,
    );
  }
  if (recipe.image && !fs.existsSync(path.join(PUBLIC_DIR, recipe.image))) {
    throw new Error(`content/recipes/${fileName}: image ${recipe.image} does not exist in public/`);
  }
  for (const photo of recipe.gallery) {
    if (!fs.existsSync(path.join(PUBLIC_DIR, photo.src))) {
      throw new Error(`content/recipes/${fileName}: gallery image ${photo.src} does not exist in public/`);
    }
  }

  return { ...recipe, body: content };
}

/**
 * Most relevant first: featured, then most recently cooked/published,
 * then alphabetical. Recipes without dates are never given invented ones.
 */
function compareRecipes(a: Recipe, b: Recipe): number {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  const dateA = a.date_cooked ?? a.date_published ?? "";
  const dateB = b.date_cooked ?? b.date_published ?? "";
  if (dateA !== dateB) return dateB.localeCompare(dateA);
  return a.title.localeCompare(b.title);
}

/** Memoized per render pass, so multiple components share one read. */
export const getAllRecipes = cache(async (): Promise<Recipe[]> => {
  const files = fs.readdirSync(RECIPES_DIR).filter((f) => f.endsWith(".mdx"));
  const recipes = files.map(readRecipeFile);

  const seen = new Set<string>();
  for (const r of recipes) {
    if (seen.has(r.slug)) throw new Error(`Duplicate recipe slug: ${r.slug}`);
    seen.add(r.slug);
  }

  return recipes.sort(compareRecipes);
});

export async function getRecipeSummaries(): Promise<RecipeSummary[]> {
  const recipes = await getAllRecipes();
  return recipes.map(toSummary);
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | undefined> {
  const recipes = await getAllRecipes();
  return recipes.find((r) => r.slug === slug);
}

export function toSummary(recipe: Recipe): RecipeSummary {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { body, ...summary } = recipe;
  return summary;
}

export function isCooked(recipe: Pick<RecipeFrontmatter, "status">): boolean {
  return recipe.status !== "planned";
}

/**
 * Related recipes: same protein first, then same category, then anything
 * else that has been cooked. Planned recipes come last.
 */
export function getRelatedRecipes(recipe: Recipe, all: Recipe[], limit = 3): RecipeSummary[] {
  const score = (r: Recipe) =>
    (r.protein && r.protein === recipe.protein ? 4 : 0) +
    (r.category === recipe.category ? 1 : 0) +
    (isCooked(r) ? 2 : 0) +
    (r.image ? 1 : 0);

  return all
    .filter((r) => r.slug !== recipe.slug)
    .map((r, index) => ({ r, s: score(r), index }))
    .sort((a, b) => b.s - a.s || a.index - b.index)
    .slice(0, limit)
    .map(({ r }) => toSummary(r));
}
