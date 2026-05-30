/** @type {import('next').NextConfig} */

// next.config.mjs is evaluated before .env files are loaded by Next.js,
// so we read them manually to decide basePath at config time.
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readEnvFile(filename) {
  const p = resolve(__dirname, filename);
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx === -1) continue;
    const key = t.slice(0, idx).trim();
    const val = t.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    out[key] = val;
  }
  return out;
}

const prodEnv  = readEnvFile('.env.production');
const localEnv = readEnvFile('.env.local');
const basePath = prodEnv.NEXT_PUBLIC_BASE_PATH || localEnv.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  // Static export — works on any shared host (Hostinger, cPanel, etc.)
  output: 'export',

  // Subpath: /moiapp in production, empty in local dev
  basePath,

  // Image optimisation requires a Node server — disable for static export
  images: { unoptimized: true },

  // No trailing slash — .htaccess maps /path → /path.html
  trailingSlash: false,
};

export default nextConfig;
