import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RJRestoDemo',
  description: 'Generate by RJSEO',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
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