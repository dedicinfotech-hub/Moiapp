import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { FeaturesProvider } from '@/lib/features';
import ConditionalNavbar from '@/components/ConditionalNavbar';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Moi App – Wedding Gift Tracker',
  description: 'Track wedding moi (gift money) easily. Share with family.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FFFDF0]">
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
