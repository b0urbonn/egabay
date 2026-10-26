#!/usr/bin/env node
// Bundles assets/map/index.html + local CSS/JS into the single-file page the
// app embeds (assets/marinduque-map.html).
//
// The app loads exactly one asset — everything must be inline — but editing a
// ~1000 line HTML file is painful, so the sources live under assets/map/ and
// this script stitches them together. Run via `npm run build:map` (also runs
// automatically before expo start/android/ios/web).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, 'assets', 'map');
const outFile = join(root, 'assets', 'marinduque-map.html');

const read = (name) => readFileSync(join(srcDir, name), 'utf8');
// `</script>` inside a string literal would close the inline block early.
const safeJs = (code) => code.replace(/<\/script/gi, '<\\/script');

let html = read('index.html');

// Replace <link rel="stylesheet" href="local.css" /> with an inline <style>.
html = html.replace(
  /<link[^>]*rel="stylesheet"[^>]*href="(?!https?:)([^"]+)"[^>]*\/>/g,
  (m, href) => `<style data-src="${href}">\n${read(href)}</style>`,
);

// Replace <script src="local.js"></script> with an inline <script>.
html = html.replace(
  /<script[^>]*src="(?!https?:)([^"]+)"[^>]*>\s*<\/script>/g,
  (m, src) => `<script data-src="${src}">\n${safeJs(read(src))}\n</script>`,
);

const banner = '<!-- GENERATED FILE — do not edit. Sources: assets/map/* · Build: npm run build:map -->\n';
writeFileSync(outFile, banner + html);
console.log(`Wrote ${outFile} (${html.length} chars)`);
