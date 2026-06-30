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
const apkEnv   = readEnvFile('.env.apk');

const isProd     = process.env.NODE_ENV === 'production';
const isAPKBuild = process.env.APK_BUILD === 'true';

const basePath = isAPKBuild
  ? (apkEnv.NEXT_PUBLIC_BASE_PATH || '')
  : isProd
  ? (prodEnv.NEXT_PUBLIC_BASE_PATH || '')
  : (localEnv.NEXT_PUBLIC_BASE_PATH || '');

const apiUrl = isAPKBuild
  ? (apkEnv.NEXT_PUBLIC_API_URL || prodEnv.NEXT_PUBLIC_API_URL || '')
  : isProd
  ? (prodEnv.NEXT_PUBLIC_API_URL || '')
  : (localEnv.NEXT_PUBLIC_API_URL || '');

const nextConfig = {
  ...(isProd ? { output: 'export' } : {}),

  basePath,

  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    ...(apiUrl ? { NEXT_PUBLIC_API_URL: apiUrl } : {}),
  },

  images: { unoptimized: true },

  // Keep false for both web and APK.
  // Capacitor 6 handles .html file routing correctly (dashboard.html serves /dashboard).
  // trailingSlash: true would break the existing working pages.
  trailingSlash: false,

  async rewrites() {
    if (isProd) return [];
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8888/MoiApp/api/:path*',
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
