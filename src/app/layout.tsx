import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Propacity Brand Audit',
  description: 'Real estate developer brand audit platform powered by AI',
};

const clerkAppearance = {
  variables: {
    colorPrimary: '#6366f1',
    colorPrimaryForeground: '#ffffff',
    colorBackground: '#ffffff',
    colorInputBackground: '#f8fafc',
    colorInputText: '#0f172a',
    colorText: '#0f172a',
    colorTextSecondary: '#64748b',
    colorDanger: '#ef4444',
    colorSuccess: '#16a34a',
    borderRadius: '0.75rem',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
  },
  elements: {
    // Modal overlay
    modalBackdrop: 'backdrop-blur-sm bg-black/40',
    // Card / floating box
    card: 'shadow-2xl shadow-indigo-500/10 border border-slate-200 rounded-2xl',
    // Header
    headerTitle: 'text-xl font-black text-slate-900',
    headerSubtitle: 'text-sm text-slate-500',
    // Logo container
    logoBox: 'hidden',
    // Divider
    dividerLine: 'bg-slate-200',
    dividerText: 'text-slate-400 text-xs',
    // Social buttons (Google, etc.)
    socialButtonsBlockButton: 'border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all',
    socialButtonsBlockButtonText: 'text-slate-700 font-semibold text-sm',
    // Form fields
    formFieldLabel: 'text-sm font-semibold text-slate-700',
    formFieldInput: 'rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 placeholder:text-slate-400 transition-all',
    formFieldInputShowPasswordButton: 'text-slate-400 hover:text-slate-600',
    // Primary action button
    formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all',
    // Footer links
    footerActionLink: 'text-indigo-600 hover:text-indigo-700 font-semibold',
    footerActionText: 'text-slate-500',
    // Internal navigation (sign-in / sign-up switch)
    identityPreviewText: 'text-slate-700',
    identityPreviewEditButton: 'text-indigo-600 hover:text-indigo-700',
    // Alert / error
    formFieldErrorText: 'text-red-500 text-xs',
    alertText: 'text-red-600 text-sm',
    // User button popup
    userButtonPopoverCard: 'shadow-xl border border-slate-200 rounded-2xl',
    userButtonPopoverActionButton: 'hover:bg-slate-50 rounded-xl text-slate-700',
    userButtonPopoverActionButtonText: 'text-slate-700 font-medium text-sm',
    userButtonPopoverFooter: 'hidden',
    // Avatar
    avatarBox: 'rounded-xl ring-2 ring-indigo-500/20',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
