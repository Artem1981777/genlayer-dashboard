import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Sidebar } from "@/components/nav"
import { Toaster } from "sonner"
const fontStyle = { "--font-inter": "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" } as React.CSSProperties
export const metadata: Metadata = { title: "GenLayer Builder Dashboard", description: "Unified dashboard for GenLayer Intelligent Contracts." }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={fontStyle}>
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
