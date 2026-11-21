# Davey Cooks Content Guide

Recipes are plain MDX files in `content/recipes/`, one file per recipe. Each file has YAML frontmatter (metadata) followed by a Markdown body. The site will read these files with `gray-matter`, validate the frontmatter with Zod, render the body with `next-mdx-remote/rsc`, and generate one page per file with `generateStaticParams()`.

These are records of real cooking. Write down what happened; don't polish it into something it wasn't.

## 1. Adding a Recipe

1. Pick a slug (see section 6).
2. Copy `docs/RECIPE_TEMPLATE.mdx` to `content/recipes/<slug>.mdx`.
3. Fill in the frontmatter. Use `null` for anything you don't know.
4. Write the body using the standard sections (below). Delete the template's `{/* ... */}` comments.
5. If you have a photo, add it under `public/images/recipes/` (see section 4), then set `image` and `image_alt`.
6. Run the build (once the site exists) to confirm the file parses and validates.

### Standard body sections

Use these `##` headings in this order, and skip any the source doesn't support:

| Section | Purpose |
|---|---|
| `## Overview` | What the dish is, in a few sentences. |
| `## Ingredients` | What was actually used, with quantities. Add `###` subsections (e.g. `### Sauce`) only when the recipe has distinct components. |
| `## Instructions` | Numbered steps. |
| `## Kitchen Notes` | Real observations from cooking it. Usually `### What Worked` and `### What I'd Change`. Use a different `###` heading (e.g. `### How It Went`) for neutral facts that fit neither. |
| `## Next Time` | Proposed changes. These are untested. |
| `## Food Safety` | Optional. Temperature or handling notes worth calling out. |
| `## References` | Source or inspiration. Say so if there is none. |

### MDX rules

- Don't add an `# H1`. The page renders `title` as the heading.
- Don't use imports or JSX components. Files should read as ordinary Markdown.
- Don't use HTML comments (`<!-- -->`); MDX rejects them. Use `{/* comment */}` if you need a hidden note.
- Avoid bare `<` and `{` in prose. MDX reads them as JSX or expressions. Write "less than" or escape them (`\<`, `\{`).
- Use straight Markdown for emphasis (`**bold**`) and callouts (`> blockquote`).

## 2. Metadata

| Field | Required | Type | Notes |
|---|---|---|---|
| `title` | yes | string | Display title. |
| `slug` | yes | string | Lowercase kebab-case. Must equal the filename without `.mdx`. Unique. |
| `description` | yes | string | One or two sentences, used for cards and meta tags. |
| `category` | yes | string | e.g. `dinner`. Current values: `dinner`. |
| `protein` | yes, nullable | string or `null` | Current values: `chicken`, `pork`, `beef`, `vegetarian`. |
| `status` | yes | enum | See section 3. |
| `servings` | yes, nullable | integer or `null` | |
| `estimated_prep_minutes` | yes, nullable | integer or `null` | Only if recorded. Never estimate after the fact. |
| `estimated_cook_minutes` | yes, nullable | integer or `null` | Same as above. |
| `image` | yes, nullable | string or `null` | Root-relative path, e.g. `/images/recipes/<slug>.webp`. Only set it when the file exists. |
| `image_alt` | yes, nullable | string or `null` | Required when `image` is set. Describe what is actually in the photo. |
| `gallery` | no | list of `{ src, alt, caption? }` | Extra process shots (`<slug>-2.webp`, …), listed in cooking order. Shown under the recipe in an "In the kitchen" section. Each file must exist; write `alt` from what's visible, and keep captions to details the recipe already records. |
| `tags` | yes | list of strings | Lowercase kebab-case. Can be empty (`[]`). |
| `date_cooked` | yes, nullable | `"YYYY-MM-DD"` or `null` | Most recent real cook. Must be `null` for `planned`. Quote the date so YAML keeps it a string. |
| `date_published` | yes, nullable | `"YYYY-MM-DD"` or `null` | When the page went live. Quoted. |
| `featured` | yes | boolean | Defaults to `false`. |
| `source` | optional | string | Provenance: cookbook, URL, or "home-cooking discussion". |

Every recipe includes every field, using `null` instead of leaving it out. That keeps the files consistent and makes gaps easy to spot.

### Reference Zod schema

This is a suggested contract for the future loader. It isn't in the codebase yet.

```ts
import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const recipeFrontmatter = z
  .object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().min(1),
    category: z.string().min(1),
    protein: z.string().min(1).nullable(),
    status: z.enum(["planned", "cooked", "cooked-needs-refinement"]),
    servings: z.number().int().positive().nullable(),
    estimated_prep_minutes: z.number().int().nonnegative().nullable(),
    estimated_cook_minutes: z.number().int().nonnegative().nullable(),
    image: z.string().startsWith("/images/recipes/").nullable(),
    image_alt: z.string().min(1).nullable(),
    tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
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
```

## 3. Statuses

| Status | Meaning | How the site should treat it |
|---|---|---|
| `planned` | Written up but not cooked, or the result wasn't recorded. | Label clearly as planned. Never present as tested, rated, or "cooked". No `What Worked` section. |
| `cooked` | Cooked and the result was good enough to make again as written. | Normal recipe. |
| `cooked-needs-refinement` | Cooked, but notable problems remain. | Show the as-cooked recipe plus the refinement notes. |

Only change a status after actually cooking the dish.

## 4. Images

- Store photos in `public/images/recipes/`.
- Name the main photo `<slug>.webp`. Name extra shots `<slug>-2.webp`, `<slug>-3.webp`, and so on.
- Prefer WebP. To convert: `cwebp -q 82 input.png -o <slug>.webp`.
- Keep original full-size files in `assets/originals/recipes/`, not in `public/`. Everything in `public/` is copied into the built site and served publicly. Never reference originals from frontmatter.
- In frontmatter, the path starts at `/images/...`, without `public`.
- Write `image_alt` from what's actually visible in the photo: the food, sides, and plate. Don't describe things that aren't there.
- If no photo exists, set both `image` and `image_alt` to `null`.
- The build crops the main photo into the recipe's 1200×630 link preview. Without a photo, the link uses the branded card.

## 5. Tested vs. Proposed

This is the most important convention on the site.

- `## Ingredients` and `## Instructions` describe the version **as actually cooked**. For `planned` recipes, they describe the intended preparation, and the Overview says so in a `> **Planned recipe.**` callout.
- `## Kitchen Notes` contains only real observations. Don't add ratings, outcomes, or adjectives that weren't actually said or observed.
- `## Next Time` holds ideas. When it contains changed quantities or techniques, start it with:

  ```md
  > **Not yet tested.** These are proposed changes for the next attempt.
  ```

- Never put proposed quantities into `## Ingredients` before they've been cooked.
- If a quantity, time, or temperature wasn't recorded, say "not recorded". Don't fill in a plausible number.

## 6. Slugs and URLs

- Slug = filename without `.mdx` = the `slug` field. All three must match.
- URL: `content/recipes/chicken-piccata.mdx` → `/recipes/chicken-piccata`.
- Lowercase letters, digits, and single hyphens only. Drop accents (`sautéed` → `sauteed`).
- Slugs must be unique.
- Treat slugs as permanent once published. If one has to change, note the reason in the commit message and add a redirect from the old URL.

## 7. Revising a Recipe

When you cook a recipe again:

1. If you used the "Next Time" changes and they worked, move them into `## Ingredients` / `## Instructions`. Then remove them from `## Next Time`.
2. Rewrite `## Kitchen Notes` to reflect the latest cook. If the earlier cook is still worth keeping, add a dated subsection (e.g. `### First Cook (2026-10-02)`) instead of deleting it.
3. Update `date_cooked` and, if warranted, `status` (e.g. `cooked-needs-refinement` → `cooked`).
4. Keep the slug the same. A significantly different dish gets its own new file and slug.
5. Git history is the full revision log. Use commit messages that say what changed and why (e.g. "Pork chops: switch to rib chops after second cook").
