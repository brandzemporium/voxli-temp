import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voxli — AI Receptionist That Never Misses a Call',
  description:
    'Voxli is an AI-powered receptionist that handles calls, books appointments, and recognizes returning callers — 24/7. Join the waitlist.',
  metadataBase: new URL('https://getvoxli.ai'),
  openGraph: {
    title: 'Voxli — AI Receptionist That Never Misses a Call',
    description:
      'AI-powered receptionist that handles calls, books appointments, and recognizes returning callers — 24/7.',
    url: 'https://getvoxli.ai',
    siteName: 'Voxli',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voxli — AI Receptionist That Never Misses a Call',
    description:
      'AI-powered receptionist that handles calls, books appointments, and recognizes returning callers — 24/7.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-void">{children}</body>
    </html>
  );
}
