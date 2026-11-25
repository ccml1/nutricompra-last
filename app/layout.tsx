import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NutriCompra',
  description:
    'Organiza una alimentación nutritiva según tu presupuesto semanal: menús, listas de compras y comparación de precios para tu hogar.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2e7d32',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${jakarta.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="bottom-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
