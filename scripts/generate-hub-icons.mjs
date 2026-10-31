/**
 * Regenerate PNG / ICO assets from public/icons/icon.svg
 * Usage: node scripts/generate-hub-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.join(import.meta.dirname, "..");
const svgPath = path.join(root, "public/icons/icon.svg");
const svg = fs.readFileSync(svgPath);

const outDir = path.join(root, "public/icons");
const sizes = [
  { name: "icon-192x192.png", size: 192 },
  { name: "icon-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function main() {
  for (const { name, size } of sizes) {
    await sharp(svg).resize(size, size).png().toFile(path.join(outDir, name));
    console.log("wrote", name);
  }

  const maskable = await sharp(svg)
    .resize(512, 512)
    .extend({
      top: 64,
      bottom: 64,
      left: 64,
      right: 64,
      background: { r: 12, g: 10, b: 31, alpha: 1 },
    })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(outDir, "icon-512x512-maskable.png"), maskable);
  console.log("wrote icon-512x512-maskable.png");

  await sharp(svg).resize(48, 48).png().toFile(path.join(root, "public/favicon.ico"));
  console.log("wrote favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
