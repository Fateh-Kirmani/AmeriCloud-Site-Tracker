import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AmeriCloud Site Tracker',
  description: 'Internal project tracking tool for AmeriCloud Telecom Solutions',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0B1929] min-h-screen`}>
        <Header />
        <main className="pt-20 pb-16">
          {children}
        </main>
      </body>
    </html>
  )
}
