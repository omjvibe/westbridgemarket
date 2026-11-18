"use client"

import { useState } from "react"

interface TickerItem {
  symbol: string
  price: string
  change: number
  changePercent: string
}

export function Ticker() {
  const [tickerData] = useState<TickerItem[]>([
    { symbol: "EUR/USD", price: "1.0875", change: 0.0023, changePercent: "+0.21%" },
    { symbol: "GBP/USD", price: "1.2634", change: -0.0012, changePercent: "-0.09%" },
    { symbol: "BTC/USD", price: "43,250", change: 1250, changePercent: "+2.98%" },
    { symbol: "ETH/USD", price: "2,285", change: 45, changePercent: "+2.01%" },
    { symbol: "USD/JPY", price: "149.82", change: 0.35, changePercent: "+0.23%" },
    { symbol: "AUD/USD", price: "0.6545", change: -0.0008, changePercent: "-0.12%" },
    { symbol: "SOL/USD", price: "98.45", change: 3.21, changePercent: "+3.37%" },
    { symbol: "XAU/USD", price: "2,045", change: 12, changePercent: "+0.59%" },
  ])

  return (
    <div className="w-full overflow-hidden border-b border-white/10 bg-[#080b11]">
      <div className="flex animate-ticker gap-8 py-2.5 font-mono text-xs">
        {[...tickerData, ...tickerData].map((item, index) => (
          <div key={`${item.symbol}-${index}`} className="flex items-center gap-2 whitespace-nowrap px-4 border-r border-white/5">
            <span className="font-semibold text-gray-200">{item.symbol}</span>
            <span className="text-gray-400">{item.price}</span>
            <span className={`text-[11px] font-bold ${item.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {item.changePercent}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
