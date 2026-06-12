import GuestPaymentClient from './GuestPaymentClient';

export function generateStaticParams() {
  return [{ token: '_' }];
}

export default function GuestPaymentPage() {
  return <GuestPaymentClient />;
}
