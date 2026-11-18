import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/lib/theme-provider"
import { SmartSuppChat } from "@/components/smartsupp-chat"
import { GTranslate } from "@/components/gtranslate"
import "./globals.css"

export const metadata: Metadata = {
  title: "Westbridge Market - Global Investment & Trading Platform",
  description:
    "Trade smarter, invest better. Access global markets with institutional-grade tools, copy trading, and premium signals."
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Analytics />
          <SmartSuppChat />
          <GTranslate />
        </ThemeProvider>
      </body>
    </html>
  )
}
