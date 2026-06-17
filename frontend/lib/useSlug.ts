'use client';

import { useEffect, useState } from 'react';

/**
 * In a static export (output: 'export'), useParams() always returns the
 * placeholder value used in generateStaticParams (e.g. { slug: '_' }).
 * This hook reads the real value from window.location.pathname instead,
 * returning '' until the component mounts (safe for SSR/pre-render).
 *
 * Usage:
 *   const slug = useSlug();   // /events/my-event → 'my-event'
 *   const token = useSlug();  // /g/abc123/form  → 'abc123'
 *
 * The hook extracts the LAST path segment that is not the placeholder '_'.
 * For sub-routes like /events/[slug]/moi-entry, it walks back past the
 * sub-route name to find the slug segment.
 *
 * @param segmentOffset - how many segments from the end to skip (default 0).
 *   e.g. /events/my-slug/moi-entry → offset=1 → 'my-slug'
 */
export function useSlug(segmentOffset = 0): string {
  const [slug, setSlug] = useState('');

  useEffect(() => {
    let path = window.location.pathname.split('?')[0].split('#')[0];
    path = path.replace(/\/(index\.html?)$/i, '').replace(/\/$/, '');
    const parts = path.split('/').filter(Boolean);
    // Walk back by the offset to skip sub-route segments
    const idx = parts.length - 1 - segmentOffset;
    const s = idx >= 0 ? parts[idx] : '';
    setSlug(s === '_' ? '' : s);
  }, [segmentOffset]);

  return slug;
}
