import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { FeaturesProvider } from '@/lib/features';
import ConditionalNavbar from '@/components/ConditionalNavbar';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Moi App – Wedding Gift Tracker',
  description: 'Track wedding moi (gift money) easily. Share with family.',
  manifest: '/manifest.json',
  themeColor: '#FFC107',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MoiApp',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFC107" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-screen bg-tn-light">
        <AuthProvider>
          <FeaturesProvider>
            <ConditionalNavbar />
            <main>{children}</main>
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
          </FeaturesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
