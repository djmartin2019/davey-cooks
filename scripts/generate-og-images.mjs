// Builds a 1200×630 JPEG link preview for each recipe with a photo. Recipe
// photos are WebP, which some messaging apps won't show in previews.
//
//   npm run og
//
// Runs as part of `npm run build`. The output is git-ignored.
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const recipesDir = path.join(root, "content/recipes");
const outputDir = path.join(root, "public/og/recipes");
const WIDTH = 1200;
const HEIGHT = 630;

// Where to center the crop (0 = top, 1 = bottom) for portrait photos that the
// automatic crop frames badly.
const verticalFocus = {
  "pork-chops-with-apple-dijon-pan-sauce": 0.45,
  "ribeye-with-sauteed-mushrooms": 0.51,
};

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const files = (await readdir(recipesDir)).filter((f) => f.endsWith(".mdx"));
let count = 0;

for (const file of files) {
  const { data } = matter(await readFile(path.join(recipesDir, file), "utf8"));
  if (!data.image) continue;

  const slug = file.replace(/\.mdx$/, "");
  // Throws on a missing source image, which fails the build.
  const image = sharp(path.join(root, "public", data.image));
  const focus = verticalFocus[slug];

  if (focus === undefined) {
    image.resize(WIDTH, HEIGHT, { fit: "cover", position: sharp.strategy.attention });
  } else {
    const { width, height } = await image.metadata();
    const scaledHeight = Math.round((height * WIDTH) / width);
    const top = Math.round(focus * scaledHeight - HEIGHT / 2);
    image
      .resize({ width: WIDTH })
      .extract({ left: 0, top: Math.max(0, Math.min(top, scaledHeight - HEIGHT)), width: WIDTH, height: HEIGHT });
  }

  await image
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(outputDir, `${slug}.jpg`));
  count += 1;
}

console.log(`✓ ${count} recipe link previews in public/og/recipes/`);
