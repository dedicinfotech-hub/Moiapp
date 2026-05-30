import EventPageClient from './EventPageClient';

// Static export requires generateStaticParams in a server component (no 'use client').
// We return a placeholder slug so Next.js generates one shell HTML file.
// The real slug is read at runtime by useParams() inside EventPageClient.
export function generateStaticParams() {
  return [{ slug: '_' }];
}

export default function Page() {
  return <EventPageClient />;
}
