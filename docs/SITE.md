# Davey Cooks — Site Implementation

How the website is built, and what to know when changing it. For writing recipes, see [CONTENT_GUIDE.md](CONTENT_GUIDE.md).

## Commands

```bash
npm run dev     # local dev server at http://localhost:3000
npm run lint
npx tsc --noEmit
npm run build   # clean static export to out/ (wipes .next/ and out/ first)
npm run clean   # remove .next/ and out/
```

Preview the exported site exactly as Apache will serve it:

```bash
cd out && python3 -m http.server 4173   # http://localhost:4173
```

`npm run build` always starts from a clean `.next/`. Turbopack's incremental build cache was seen serving a stale `globals.css`, and a full build of this site only takes a few seconds.

### Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Absolute site URL used for canonical links, Open Graph images, and recipe structured data. Defaults to the production URL `https://davey-cooks.djm-apps.com`. Override it only for a different host, e.g. staging. |

## Routes

| Route | Source |
|---|---|
| `/` | `src/app/page.tsx` |
| `/recipes/` | `src/app/recipes/page.tsx` (+ client filter `src/components/recipe-gallery.tsx`) |
| `/recipes/<slug>/` | `src/app/recipes/[slug]/page.tsx`, one page per MDX file via `generateStaticParams()` |
| `/about/` | `src/app/about/page.tsx` |
| 404 | `src/app/not-found.tsx` (exported as `out/404.html`) |

`trailingSlash: true` emits `recipes/<slug>/index.html`, so Apache serves clean directory URLs. Point Apache's `ErrorDocument 404` at `/404.html`.

## Configuration notes

- `output: "export"` with `images.unoptimized: true`. The Next.js image optimizer needs a server, so recipe photos are served as-is. Keep them as pre-sized WebP files (see the content guide).
- **Cache Components and Partial Prefetching are disabled.** Both enable Partial Prerendering, and Next.js 16 refuses to build with `output: "export"` while PPR is on (`Invariant: PPR cannot be enabled in export mode`). Static export is a project requirement, so these flags were removed. Every page is fully prerendered at build time anyway.

## Content layer

`src/lib/recipes.ts`

- Reads only `content/recipes/*.mdx`. The legacy `.md` duplicates are ignored.
- Validates frontmatter with the Zod schema from the content guide. It also checks that `slug` matches the filename, that slugs are unique, and that `image` exists under `public/`. Any violation fails the build with the file name and field.
- Sort order: `featured: true` first, then most recent `date_cooked`/`date_published`, then title. No dates are invented.
- The homepage hero uses the first cooked recipe with a photo in that order. Set `featured: true` on a recipe to choose the hero.

`src/lib/recipe-sections.ts`

- Splits the MDX body on its `##` headings (the structure the content guide defines). Each section is rendered with `next-mdx-remote/rsc` and a layout suited to its role:

| Heading | Treatment |
|---|---|
| Overview | Large serif lead text |
| Ingredients | Bordered panel with tickable checkboxes, sticky on desktop |
| Instructions (or Method) | Large numbered steps beside the ingredients |
| Kitchen Notes | Olive panel labelled "From the kitchen · as cooked" ("Notes so far" for planned recipes) |
| Next Time | Dashed terracotta panel labelled "Proposed · not yet tested" |
| Food Safety | Thermometer callout |
| References | Small print |
| anything else | Rendered as a plain section in source order; nothing is dropped |

- Ingredient checkboxes are plain HTML (no JavaScript). "Clear checked items" is a native form reset.

## Status handling

- `planned` recipes show "Planned · not yet cooked" with a short explanation. They're listed separately on the homepage ("On the list"), excluded from "Latest from the kitchen", and get **no** schema.org Recipe data.
- `cooked-needs-refinement` recipes are labelled "Cooked · still refining" with a pointer to the notes.

## SEO

- Per-page titles, descriptions, canonical URLs, and Open Graph/Twitter metadata, using the recipe photo when there is one.
- Cooked recipes emit schema.org `Recipe` JSON-LD built only from the source: ingredients and steps from the MDX lists, plus times, servings, and category when recorded. No ratings, nutrition, or dates are invented.

## Design tokens

Defined in `src/app/globals.css` under `@theme`: `ivory`, `paper`, `ink`, `ink-soft`, `olive`, `terracotta`, `linen`. Fonts are Newsreader (serif headings) and DM Sans (body), loaded with `next/font`. Recipe prose styles are plain CSS (`.recipe-prose` and friends). They're unlayered, so they override Tailwind utilities; set font sizes on the element with utilities rather than inside those rules.

## Known follow-ups

- **Unused originals in `public/images/recipes/`.** The five large PNGs (about 13 MB) with spaces in their names aren't referenced, but static export copies everything in `public/` to `out/`. Move them out of `public/` before deploying. `Caramelized Pork Chop with Stone Fruit-3.png` looks like a second pork-chop shot that could become `pork-chops-with-apple-dijon-pan-sauce-2.webp` if a gallery is added.
- **The burger has no photo.** The page shows a "No photo yet" placeholder.
- **`date_published` is unset** on every recipe. Fill it in when the site goes live.
- Possible enhancements: remember ingredient checks per recipe in `localStorage`; a small photo gallery for extra shots.
- Deferred: RSS feed.
