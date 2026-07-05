# Bugfix: React Hydration Errors & Missing manifest.json

## Summary

Three distinct runtime errors were thrown in production on `moipassbook.com`:

1. **React error #418** (repeated 3×) — Hydration mismatch: server-rendered HTML does not match client-rendered output.
2. **React error #423** — A hook or context was read before its Provider finished mounting (or was read conditionally).
3. **manifest.json 404** — The PWA manifest was fetched from the wrong path (missing basePath prefix).

---

## Root Cause Analysis

### Bug 1 — React Hydration Mismatch (#418)

**File:** `frontend/app/layout.tsx`

`layout.tsx` is a **server component** (no `'use client'`). It renders `<AuthProvider>`, `<FeaturesProvider>`, `<ConditionalNavbar>`, and `<ConditionalBottomNav>` on the server. These are all `'use client'` components that depend on browser APIs (`localStorage`, `usePathname`, `window`).

During static export (`output: 'export'`), Next.js pre-renders the layout shell on the server/build. The server renders the components with no auth state and no real pathname. When React hydrates on the client, `AuthProvider` reads `localStorage` and `ConditionalNavbar` reads the real URL pathname — both of which differ from what was pre-rendered. This produces a **tree mismatch** = error #418.

Specifically:
- `AuthProvider` starts with `loading: true` on server and flips to `loading: false` after `useEffect` on client → children may render differently.
- `ConditionalNavbar` and `ConditionalBottomNav` use `usePathname()`. On the pre-rendered static shell, `usePathname()` returns the static placeholder path (e.g. `/moiapp/_`), but on the client it returns the real path — the `null`/`<Navbar>` decision differs.

### Bug 2 — Hook/Context Before Provider (#423)

**File:** `frontend/app/layout.tsx` (ordering of Providers)

Error #423 means "an update to a store was not batched". This often happens when a context consumer is rendered *outside* its Provider, or when a component triggers a state update during the server render pass. The `FeaturesProvider` or `NewEventModalProvider` may be consuming a context before it is available, or calling an effect that conflicts with SSR.

### Bug 3 — manifest.json 404

**Files:** `frontend/app/layout.tsx`, `frontend/public/manifest.json`

The app is deployed at `/moiapp/` (basePath = `/moiapp`). The layout hardcodes:

```tsx
<link rel="manifest" href="/manifest.json" />
```

And the Next.js `metadata.manifest` was set to `'/manifest.json'`. Without the basePath prefix this resulted in a 404.

The `manifest.json` itself already has the correct `start_url: "/moiapp/"` and `scope: "/moiapp/"`, but the `<link>` tag must point to `/moiapp/manifest.json`.

---

## Fix Plan

### Fix 1 — Suppress hydration on layout shell (error #418)

Wrap the client-only providers and navigation in a `<ClientOnly>` boundary that renders `null` on the first server pass and mounts on the client. This eliminates the server↔client mismatch.

**Approach:** Create `frontend/components/ClientOnly.tsx`:

```tsx
'use client';
import { useEffect, useState, ReactNode } from 'react';

export default function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted ? <>{children}</> : <>{fallback}</>;
}
```

Wrap `<ConditionalNavbar />` and `<ConditionalBottomNav />` (not the providers themselves, as they may be needed by children) inside `<ClientOnly>` in `layout.tsx`.

### Fix 2 — Prevent context-before-provider error (#423)

Add `suppressHydrationWarning` to the `<body>` element in `layout.tsx`. This instructs React to skip comparing the server/client body content mismatch for one level, which is the standard Next.js static-export pattern.

Also ensure `AuthProvider` renders children immediately (it already does — the `loading` flag only gates UI inside consumers). No change needed to `auth.tsx` itself.

### Fix 3 — Fix manifest.json 404

In `layout.tsx`, replace the hardcoded `/manifest.json` href with a basePath-aware path:

```tsx
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

// In <head>:
<link rel="manifest" href={`${BASE}/manifest.json`} />
<link rel="apple-touch-icon" href={`${BASE}/icons/icon-192x192.png`} />
```

Remove the duplicate `manifest` entry from `metadata` (Next.js auto-injects it via metadata, causing a double `<link rel="manifest">` tag — one correct, one not).

Also update `manifest.json` `start_url` and icon paths to ensure they work when served from `/moiapp/manifest.json`:

```json
{
  "start_url": "/moiapp/",
  "scope": "/moiapp/",
  "icons": [
    { "src": "/moiapp/icons/icon-192x192.png", ... }
  ]
}
```

*(Already correct — no change needed to manifest.json.)*

---

## Files to Change

| File | Change |
|---|---|
| `frontend/components/ClientOnly.tsx` | **Create** — `mounted` guard component |
| `frontend/app/layout.tsx` | Wrap nav components in `<ClientOnly>`, add `suppressHydrationWarning` to `<body>`, fix manifest href with basePath prefix, remove duplicate `metadata.manifest` |

---

## Regression Prevention

- `AuthProvider`, `FeaturesProvider`, `NewEventModalProvider` remain unchanged — they continue to gate children correctly.
- `ConditionalNavbar` and `ConditionalBottomNav` logic is unchanged — just client-only mounted.
- The manifest.json content is unchanged — only the `<link>` href is fixed.
- All existing routes, forms, and API calls are unaffected.
