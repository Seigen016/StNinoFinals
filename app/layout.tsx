import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'St. Nino de Praga Academy',
  description: 'Official website of St. Nino de Praga Academy',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <Providers>
        <body suppressHydrationWarning className={GeistSans.className}>{children}</body>
      </Providers>
    </html>
  )
}
