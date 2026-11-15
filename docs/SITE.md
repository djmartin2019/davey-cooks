# Davey Cooks — Site Implementation

How the website is built, and what to know when changing it. For writing recipes, see [CONTENT_GUIDE.md](CONTENT_GUIDE.md).

## Commands

```bash
npm run dev     # local dev server at http://localhost:3000
npm run lint
npx tsc --noEmit
npm run build   # clean static export to out/ (wipes .next/ and out/ first)
npm run clean   # remove .next/ and out/
npm run icons   # re-render home-screen/PWA icons from assets/brand/app-icon.svg
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

## Deployment

The site runs on the shared VPS as static files served by Apache. There's no Node process or port.

```
/var/www/apps/davey-cooks/
├── repo/                      git checkout; builds happen here
├── releases/<timestamp>-<sha>/ one copy of out/ per deploy
└── current -> releases/...    Apache DocumentRoot
```

`scripts/deploy.sh`, run as `david` from `repo/` after `git pull`:

1. Refuses to run as root, checks Node ≥ 20.9, and checks that the files are owned by the current user.
2. Runs `npm ci` and `npm run build` (a clean build).
3. Checks the output: the key pages exist, and there's one page per `.mdx` recipe.
4. Copies `out/` into `releases/<timestamp>-<sha>/` and switches `current` to it in a single atomic step. Apache doesn't need a reload.
5. Keeps the newest 3 releases (`KEEP_RELEASES`) and never deletes the live one.
6. Smoke-tests the local Apache directly, bypassing Cloudflare: `/`, `/recipes/`, `/about/`, `/og-image.png`, `/manifest.webmanifest`, `/version.json`, `/app-icons/icon-192.png` (200) and a missing page (404). If anything fails, it prints the rollback command.

`./scripts/deploy.sh --rollback` points `current` at the release before the live one. Overrides: `APP_DIR`, `KEEP_RELEASES`, `SITE_HOST`, `SKIP_SMOKE=1`.

Apache vhosts: `/etc/apache2/sites-available/davey-cooks.djm-apps.com.conf` and the Certbot-generated `davey-cooks.djm-apps.com-le-ssl.conf`.

## Routes

| Route | Source |
|---|---|
| `/` | `src/app/page.tsx` |
| `/recipes/` | `src/app/recipes/page.tsx` (+ client filter `src/components/recipe-gallery.tsx`) |
| `/recipes/<slug>/` | `src/app/recipes/[slug]/page.tsx`, one page per MDX file via `generateStaticParams()` |
| `/about/` | `src/app/about/page.tsx` |
| `/install/` | `src/app/install/page.tsx`: how to add the site to a phone's home screen (linked from the footer) |
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

- Per-page titles, descriptions, canonical URLs, and Open Graph/Twitter metadata.
- **Link previews:** the home, Recipes, About, and 404 pages use the branded card `public/og-image.png` (1200×630). Recipe pages use the recipe photo, falling back to the branded card when there's no photo.
- To change the card, edit `assets/brand/og-image.html` and re-render it at 1200×630, e.g. `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=8000 --screenshot=public/og-image.png "file://$PWD/assets/brand/og-image.html"`. The page loads its fonts from Google Fonts, so it needs a network connection.
- Cooked recipes emit schema.org `Recipe` JSON-LD built only from the source: ingredients and steps from the MDX lists, plus times, servings, and category when recorded. No ratings, nutrition, or dates are invented.

## Home screen app (PWA)

- `src/app/manifest.ts` emits `/manifest.webmanifest` (standalone display, ivory theme). `appleWebApp` metadata in `src/app/layout.tsx` sets the iOS title and status bar.
- Icons come from `assets/brand/app-icon.svg`: the site's steam-over-pan mark, full-bleed with no rounded corners because iOS and Android apply their own mask. `npm run icons` renders `src/app/apple-icon.png` (180, the iOS home-screen icon) and `public/app-icons/icon-{192,512}.png` (the manifest icons; the 512 one is also the maskable icon). They live in `app-icons/`, not `icons/`: Apache on Ubuntu aliases `/icons/` to its own icon directory by default, so files there 404 (or 403) on the live site. The PNGs are committed, so the VPS build does not run this.
- `/install/` explains installing on iPhone (Safari) and Android (Chrome). The footer's "Get the app" card links to it. Both use a `standalone:` Tailwind variant (`@media (display-mode: standalone)`, defined in `globals.css`): the footer card hides, and the install page says it's already installed, when the site is opened from the home screen.
- **Updates:** iOS resumes a saved copy of the home-screen app instead of reloading it, and Apache sends no `Cache-Control` on HTML, so Safari can keep showing an old build. Each build writes a unique ID (`NEXT_PUBLIC_BUILD_ID`, set in `next.config.ts`) into the page and into `/version.json` (`src/app/version.json/route.ts`). `src/components/update-check.tsx` fetches `/version.json` uncached when the page opens or returns to the foreground (at most once a minute). If the ID differs, it reloads the page once at `?v=<id>`, a URL no cache can answer, then strips the parameter. A sessionStorage guard limits it to one reload per page per build, so it can't loop.
- Recommended server follow-up (not applied): send `Cache-Control: no-cache` for `.html`, `.txt`, `.json`, and `.webmanifest`, and a long `immutable` cache for `/_next/static/`, in the site's vhost.
- No service worker: the site needs a connection, but iOS "Add to Home Screen" works without one.

## Design tokens

Defined in `src/app/globals.css` under `@theme`: `ivory`, `paper`, `ink`, `ink-soft`, `olive`, `terracotta`, `linen`. Fonts are Newsreader (serif headings) and DM Sans (body), loaded with `next/font`. Recipe prose styles are plain CSS (`.recipe-prose` and friends). They're unlayered, so they override Tailwind utilities; set font sizes on the element with utilities rather than inside those rules.

## Known follow-ups

- **Original photos** live in `assets/originals/recipes/`, outside `public/`, so they aren't copied into `out/` or served. `Caramelized Pork Chop with Stone Fruit-3.png` looks like a second pork-chop shot that could become `pork-chops-with-apple-dijon-pan-sauce-2.webp` if a gallery is added.
- **The burger has no photo.** The page shows a "No photo yet" placeholder.
- **`date_published` is unset** on every recipe. Fill it in when the site goes live.
- Possible enhancements: remember ingredient checks per recipe in `localStorage`; a small photo gallery for extra shots.
- Deferred: RSS feed.
