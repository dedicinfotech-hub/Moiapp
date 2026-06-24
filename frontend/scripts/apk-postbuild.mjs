/**
 * apk-postbuild.mjs
 *
 * After `APK_BUILD=true next build` (trailingSlash: false, static export to /out),
 * Next.js generates flat HTML files:
 *   out/dashboard.html    → works fine, Capacitor serves for /dashboard
 *   out/e/_.html          → only served for /e/_ literally
 *   out/events/_.html     → only served for /events/_ literally
 *
 * Problem: navigating to /e/real-slug or /events/real-slug finds no matching
 * file → Capacitor falls back to 404.html (the error page, not our app shell).
 *
 * Fix: replace 404.html with the e/_ shell. Capacitor serves 404.html for any
 * unknown path, so /e/real-slug loads our shell. useSlug() then reads the real
 * slug from window.location.pathname and loads the correct event from the API.
 */

import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'out');

// The e/_ shell has all the JS needed to render any event page.
// Use it as the universal 404 fallback so Capacitor routes unknown paths through it.
const eShell = join(outDir, 'e', '_.html');
const eventsDetailShell = join(outDir, 'events', '_.html');
const target404 = join(outDir, '404.html');

if (existsSync(eShell)) {
  copyFileSync(eShell, target404);
  console.log('[apk-postbuild] ✓ Replaced 404.html with e/_.html shell');
} else if (existsSync(eventsDetailShell)) {
  copyFileSync(eventsDetailShell, target404);
  console.log('[apk-postbuild] ✓ Replaced 404.html with events/_.html shell');
} else {
  console.warn('[apk-postbuild] ⚠ No event shell found — 404 routing will not work for /e/ and /events/ paths');
}

console.log('[apk-postbuild] Done.');
