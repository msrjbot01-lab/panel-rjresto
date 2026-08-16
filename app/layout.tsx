import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RJRestoDemo',
  description: 'Generate by RJSEO',
  icons: {
    icon: [
      {
        url: '/favicon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/favicon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}