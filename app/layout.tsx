import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import SidebarProvider from '@/components/SidebarProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AmeriCloud Project Tracker',
  description: 'Internal project tracking tool for AmeriCloud Telecom Solutions',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0B1929] min-h-screen`}>
        <SidebarProvider>
          <Header />
          <Sidebar />
          <main className="pt-20 pb-16">{children}</main>
        </SidebarProvider>
      </body>
    </html>
  )
}
