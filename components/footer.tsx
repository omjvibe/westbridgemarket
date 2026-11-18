import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#080b11] text-gray-700 dark:text-gray-300 transition-colors">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Westbridge Market Logo"
                className="h-8 w-auto object-contain"
              />
              <span className="text-lg font-bold text-gray-950 dark:text-white tracking-tight">
                Westbridge Market
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
              Your trusted partner in global investment and institutional trading. Access elite tools, copy experts, and grow your wealth with confidence.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                <Facebook className="h-4 w-4" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                <Twitter className="h-4 w-4" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                <Instagram className="h-4 w-4" />
              </Link>
              <Link href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                <Linkedin className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-950 dark:text-white font-bold">Quick Links</h3>
            <ul className="space-y-2 text-xs">
              {["About Us", "Services", "Investment Plans", "Copy Trading", "Signal Providers"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-950 dark:text-white font-bold">Resources</h3>
            <ul className="space-y-2 text-xs">
              {["FAQ", "Blog", "Contact", "Support", "Terms of Service", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-600 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-950 dark:text-white font-bold">Contact Us</h3>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li>Westbridge Market Global Financial Centre</li>
              <li>support@westbridgemarket.app</li>
              <li>+1 (256) 286-7576</li>
              <li className="text-[#f04e23] font-semibold">24/7 Priority Trading Desk</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-gray-500 dark:text-gray-500">
          <p>© {currentYear} Westbridge Market. All rights reserved.</p>
          <p>FCA Regulated & Institutional Partner</p>
        </div>
      </div>
    </footer>
  )
}
