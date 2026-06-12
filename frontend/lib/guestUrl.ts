const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function getGuestPaymentUrl(token: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${basePath}/g/${token}`;
  }
  return `${basePath}/g/${token}`;
}

/** Print-ready QR (black & white friendly via qrserver API) */
export function getQrImageUrl(paymentUrl: string, size = 512): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(paymentUrl)}&format=png&margin=12&color=000000&bgcolor=ffffff`;
}

export async function downloadQrPng(paymentUrl: string, filename: string): Promise<void> {
  const imgUrl = getQrImageUrl(paymentUrl, 800);
  const res = await fetch(imgUrl);
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
