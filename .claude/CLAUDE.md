# Davey Cooks
Personal recipe website built with Next.js App Router,
TypeScript, Tailwind CSS, and MDX.

## Architecture
- Static export using `output: "export"`.
- No database or backend services.
- Recipes live in `content/recipes/*.mdx`.
- YAML frontmatter contains recipe metadata.
- Use gray-matter to parse metadata.
- Use next-mdx-remote/rsc to render MDX.
- Validate frontmatter with Zod.
- Generate recipe pages using generateStaticParams.

## Content
- One file per recipe.
- Preserve actual cooking notes and planned adjustments.
- Do not invent missing ingredients or cooking details.
- Planned recipes must not appear as completed.
- Recipe images live under `public/images/recipes`.

## Design
- Warm editorial cookbook aesthetic.
- Mobile-first and photography-focused.
- Avoid generic dashboard styling.
- Keep the cooking experience simple and accessible.

## Documentation
- Project documentation belongs in `docs/`.
- Consult the VPS development skill before deployment.
- Do not modify production infrastructure without approval.

