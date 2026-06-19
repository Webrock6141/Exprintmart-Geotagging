import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Footer } from '@/components/footer'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Exprintmart — Free Image Geotagging Tool',
  description:
    'Free, unlimited image EXIF geotagging tool by Exprintmart. Embed GPS coordinates, titles, keywords, author and more directly into JPG/PNG/WebP images — all in your browser, no uploads.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#063A39',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      {/* Added 'flex flex-col min-h-screen' here to make sure 
        the footer stays properly anchored at the bottom of your tool UI page 
      */}
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <main className="flex-1">
          {children}
        </main>
        
        {/* Fixed: Moved safely inside the <body> tag */}
        <Footer />
        
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}