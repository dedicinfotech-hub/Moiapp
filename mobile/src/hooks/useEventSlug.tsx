import React, { createContext, useContext } from 'react';

const EventSlugContext = createContext<string>('');

export function EventSlugProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <EventSlugContext.Provider value={slug}>{children}</EventSlugContext.Provider>;
}

export function useEventSlug(): string {
  const slug = useContext(EventSlugContext);
  if (!slug) throw new Error('useEventSlug must be used within EventSlugProvider');
  return slug;
}

export function useEventSlugOptional(): string | null {
  return useContext(EventSlugContext) || null;
}
