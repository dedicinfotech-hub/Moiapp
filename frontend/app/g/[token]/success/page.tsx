import PaymentSuccessScreen from './PaymentSuccessScreen';

// Static export requires generateStaticParams in a server component (no 'use client').
// We return a placeholder slug so Next.js generates one shell HTML file.
// The real slug is read at runtime by useParams() inside MoiEntriesListClient.
// dynamic = 'force-static' tells Next.js to treat this as a static route and
// not validate params at runtime (required for output: export in dev mode).
export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ token: '_' }];
}

export default function Page() {
  return <PaymentSuccessScreen />;
}
