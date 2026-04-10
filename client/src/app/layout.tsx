import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Podwires Community',
  description: 'Connect podcast producers with brands and businesses. Find talent, collaborate, and grow your podcast network.',
  keywords: ['podcast', 'community', 'producer', 'podcast production', 'brand partnerships'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
