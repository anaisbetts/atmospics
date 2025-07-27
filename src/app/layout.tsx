import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { ThemeProvider } from '@/components/ui/theme-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Atmospics',
  description: 'Photos and videos',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storageKey = 'atmospics-theme';
                  var theme = localStorage.getItem(storageKey);
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var resolvedTheme = theme === 'system' || !theme ? systemTheme : theme;
                  document.documentElement.classList.add(resolvedTheme);
                } catch (e) {
                  // Fallback to system theme if localStorage fails
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  document.documentElement.classList.add(systemTheme);
                }
              })();
            `,
          }}
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Atmospics RSS Feed"
          href="/api/rss"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="system">
          <div className="absolute top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
