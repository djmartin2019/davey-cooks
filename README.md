# Davey Cooks

A personal cooking journal and recipe site: *Good food. Some experiments. A few lessons learned.*

Each recipe is a record of something actually cooked at home. It has the ingredients and steps as made, honest notes on what worked and what didn't, and ideas for next time.

To be hosted at **https://davey-cooks.djm-apps.com** (not deployed yet). It's a fully static site, served by Apache on a VPS.

## How it works

There's no database, CMS, or backend. Recipes are Markdown (MDX) files in the repo, and the site is generated from them at build time.

```
content/recipes/*.mdx  ──►  build (Next.js)  ──►  out/  ──►  Apache
   one file per recipe       validate + render     static HTML, CSS, JS, images
```

1. **Write a recipe** as `content/recipes/<slug>.mdx`. YAML frontmatter holds the metadata (title, status, times, photo, dates, and so on), and the body uses standard sections: Overview, Ingredients, Instructions, Kitchen Notes, Next Time, Food Safety, References.
2. **Build.** Each file's frontmatter is parsed with `gray-matter` and validated with Zod. A missing field, a slug that doesn't match the filename, or a photo that doesn't exist stops the build with a clear error. Each recipe becomes a page at `/recipes/<slug>/`.
3. **Deploy** by uploading the `out/` folder to the web server.

### Pages

| URL | What's there |
|---|---|
| `/` | Hero photo, latest cooked recipes, browse by main ingredient, About intro |
| `/recipes/` | All recipes, with filters for main ingredient and status |
| `/recipes/<slug>/` | The full recipe: tickable ingredient checklist, numbered steps, kitchen notes, next-time plans, a print view, and a "keep screen on" button for cooking from a phone |
| `/about/` | What the site is and how to read the recipes |

### Honest by design

The site is built to keep what was actually cooked separate from what's only planned:

- **Status:** every recipe is `planned`, `cooked`, or `cooked-needs-refinement`, and the site labels each one clearly.
- **Ingredients and Instructions** describe the version as actually cooked.
- **Kitchen Notes** are real observations from cooking it.
- **Next Time** holds untested ideas, styled and labelled separately.
- **Nothing is made up:** no ratings, nutrition, or dates. Missing information stays missing.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev      # dev server at http://localhost:3000
```

| Command | Does |
|---|---|
| `npm run dev` | Local dev server with hot reload |
| `npm run build` | Clean production build: static site in `out/` |
| `npm run clean` | Delete `.next/` and `out/` |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |

To preview the built site the way Apache will serve it:

```bash
npm run build
cd out && python3 -m http.server 4173   # http://localhost:4173
```

## Adding a recipe

1. Copy `docs/RECIPE_TEMPLATE.mdx` to `content/recipes/<slug>.mdx`. The slug must match the filename.
2. Fill in the frontmatter. Use `null` for anything you don't know.
3. Add a photo as `public/images/recipes/<slug>.webp` and set `image` and `image_alt`.
4. Run `npm run build` to check that it validates.

See [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md) for every field and writing convention.

## Project structure

```
content/recipes/        Recipe MDX files (the content)
public/images/recipes/  Recipe photos used by the site (WebP)
assets/originals/       Full-size original photos, kept out of the build
src/app/                Pages and layout (Next.js App Router)
src/components/         UI components (header, recipe cards, recipe sections…)
src/lib/recipes.ts      Loads and validates recipes
src/lib/recipe-sections.ts  Splits a recipe into its sections for layout
src/app/globals.css     Design tokens, recipe typography, print styles
docs/                   Content guide, recipe template, site implementation notes
```

## Tech

- **Framework:** Next.js 16 (App Router), built as a static HTML export.
- **Languages and styling:** TypeScript, Tailwind CSS 4.
- **Content:** MDX via `next-mdx-remote`, frontmatter via `gray-matter`, validation with Zod.
- **Fonts:** Newsreader and DM Sans, via `next/font`.

Implementation details are in [docs/SITE.md](docs/SITE.md): configuration choices, section rendering, SEO, and known follow-ups. Deployment goes through the VPS development skill in `.claude/skills/`.
