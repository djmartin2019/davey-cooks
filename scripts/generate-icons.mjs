// Rasterizes assets/brand/app-icon.svg into the PNG icons used for the
// iOS home screen and the web app manifest. Re-run after changing the logo:
//
//   npm run icons
//
// The PNGs are committed, so the VPS build does not need to run this.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const svg = await readFile(`${root}assets/brand/app-icon.svg`);

const outputs = [
  // Next.js file convention: emits <link rel="apple-touch-icon">.
  { file: "src/app/apple-icon.png", size: 180 },
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/icon-512.png", size: 512 },
];

for (const { file, size } of outputs) {
  await sharp(svg, { density: Math.ceil((72 * size) / 64) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(`${root}${file}`);
  console.log(`✓ ${file} (${size}×${size})`);
}
