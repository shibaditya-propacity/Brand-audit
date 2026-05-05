import type { Metadata } from 'next';
import { Sora, DM_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { EmbeddedModeDetector } from '@/components/shared/EmbeddedModeDetector';
import { Suspense } from 'react';

// DM Sans — body text (matches Growth Engine font-sans)
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

// Sora — headings (matches Growth Engine font-heading)
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Propacity Brand Audit',
  description: 'Real estate developer brand audit platform powered by AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${sora.variable} ${dmSans.className}`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            {/* Detects ?embedded=1 and adds .embedded class to body */}
            <Suspense fallback={null}>
              <EmbeddedModeDetector />
            </Suspense>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
