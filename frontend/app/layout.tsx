import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { FeaturesProvider } from '@/lib/features';
import { LanguageProvider } from '@/lib/i18n';
import ConditionalNavbar, { ConditionalBottomNav } from '@/components/ConditionalNavbar';
import { NewEventModalProvider } from '@/lib/new-event-modal';
import GlobalNewEventModal from '@/components/GlobalNewEventModal';
import { Toaster } from 'react-hot-toast';
import { assetUrl } from '@/lib/assetUrl';

export const metadata: Metadata = {
  title: 'Moi App – Wedding Gift Tracker',
  description: 'Track wedding moi (gift money) easily. Share with family.',
  // manifest href is injected manually in <head> below with basePath prefix
  icons: {
    icon: assetUrl('/favicon.png'),
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MoiApp',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FFC107',
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Use BASE_PATH prefix so manifest resolves correctly on subpath deployments */}
        <link rel="manifest" href={assetUrl('/manifest.json')} />
        <meta name="theme-color" content="#FFC107" />
        <link rel="apple-touch-icon" href={assetUrl('/favicon.png')} />
      </head>
      <body className="min-h-screen bg-tn-light" suppressHydrationWarning>
        <AuthProvider>
          <LanguageProvider>
          <FeaturesProvider>
            <NewEventModalProvider>
              {/* ConditionalNavbar uses usePathname() which differs between
                  static pre-render and client — suppress hydration for this subtree */}
              <ConditionalNavbar />
              <main>{children}</main>
              <ConditionalBottomNav />
              <GlobalNewEventModal />
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
            </NewEventModalProvider>
          </FeaturesProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
