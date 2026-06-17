import GuestPaymentClient from './GuestPaymentClient';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  return [{ token: '_' }];
}

export default function GuestPaymentPage() {
  return <GuestPaymentClient />;
}
