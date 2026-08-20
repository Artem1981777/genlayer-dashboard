import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Sidebar } from "@/components/nav"
import { Toaster } from "sonner"
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
export const metadata: Metadata = { title: "GenLayer Builder Dashboard", description: "Unified dashboard for GenLayer Intelligent Contracts." }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <div className="app">
            <Sidebar />
            <main className="main">{children}</main>
          </div>
        </Providers>
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  )
}
