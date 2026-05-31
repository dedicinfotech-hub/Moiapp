/** @type {import('next').NextConfig} */

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

// next.config.mjs runs before Next.js loads .env files, so read manually.
const prodEnv  = readEnvFile('.env.production');
const localEnv = readEnvFile('.env.local');

// In production build: NEXT_PUBLIC_BASE_PATH=/moiapp is set in .env.production
// In local dev:        NEXT_PUBLIC_BASE_PATH is empty in .env.local
const basePath = prodEnv.NEXT_PUBLIC_BASE_PATH || localEnv.NEXT_PUBLIC_BASE_PATH || '';
const isProd   = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Static export ONLY for production build (npm run build).
  // Local dev (npm run dev) runs as a normal Next.js server with rewrites.
  ...(isProd ? { output: 'export' } : {}),

  basePath,

  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  images: { unoptimized: true },

  trailingSlash: false,

  // Rewrites only work in dev (Next.js server mode).
  // In production static export the browser calls NEXT_PUBLIC_API_URL directly.
  async rewrites() {
    if (isProd) return [];
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8888/MoiApp/api/:path*',
      },
    ];
  },
};

export default nextConfig;
