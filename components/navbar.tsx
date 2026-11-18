"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ]

  const isTransparent = false

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0c1017]/95 backdrop-blur-md shadow-none">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center bg-[#f04e23] text-white font-black text-lg tracking-tighter shrink-0 transition-transform group-hover:scale-105">
              W.
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Westbridge Market</span>
          </Link>

          <a
            href="tel:+12562867576"
            className="hidden xl:inline-flex items-center text-xs font-mono text-gray-400 hover:text-white transition-colors pl-4 border-l border-white/10"
          >
            +1 (256) 286-7576
          </a>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-xs font-semibold tracking-wider uppercase transition-colors hover:text-white py-1 ${
                  isActive ? "text-white" : "text-gray-400"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#f04e23]" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/5 rounded-none"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button
            variant="ghost"
            className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-gray-300 hover:text-white hover:bg-white/5 rounded-none"
            asChild
          >
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button
            className="h-9 px-5 text-xs font-bold uppercase tracking-wider bg-[#f04e23] hover:bg-[#d84018] text-white rounded-none shadow-none"
            asChild
          >
            <Link href="/auth/signup">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-4 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" asChild className="w-full bg-transparent">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
