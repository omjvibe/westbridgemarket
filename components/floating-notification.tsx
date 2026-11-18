"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Notification {
  id: string
  name: string
  amount: string
  action: string
  avatar: string
}

const notifications: Notification[] = [
  { id: "1", name: "Michael Chen", amount: "$25,000", action: "just invested", avatar: "MC" },
  { id: "2", name: "Sarah Johnson", amount: "$50,000", action: "earned from trading", avatar: "SJ" },
  { id: "3", name: "David Martinez", amount: "$15,000", action: "withdrew", avatar: "DM" },
  { id: "4", name: "Emily Williams", amount: "$100,000", action: "just invested", avatar: "EW" },
  { id: "5", name: "James Brown", amount: "$35,000", action: "earned from signals", avatar: "JB" },
  { id: "6", name: "Liam Smith", amount: "$5,500", action: "just invested", avatar: "LS" },
  { id: "7", name: "Emma Watson", amount: "$12,400", action: "earned from copy trading", avatar: "EW" },
  { id: "8", name: "Noah Garcia", amount: "$8,200", action: "withdrew", avatar: "NG" },
  { id: "9", name: "Olivia Rodriguez", amount: "$22,000", action: "earned from signals", avatar: "OR" },
  { id: "10", name: "William Muller", amount: "$45,000", action: "just invested", avatar: "WM" },
  { id: "11", name: "Sophia Dubois", amount: "$18,900", action: "earned from copy trading", avatar: "SD" },
  { id: "12", name: "James Wilson", amount: "$3,400", action: "withdrew", avatar: "JW" },
  { id: "13", name: "Isabella Rossi", amount: "$30,500", action: "earned from copy trading", avatar: "IR" },
  { id: "14", name: "Benjamin Schmidt", amount: "$14,000", action: "just invested", avatar: "BS" },
  { id: "15", name: "Mia Tanaka", amount: "$62,000", action: "earned from signals", avatar: "MT" },
  { id: "16", name: "Lucas Martin", amount: "$27,500", action: "just invested", avatar: "LM" },
  { id: "17", name: "Charlotte Roy", amount: "$9,800", action: "withdrew", avatar: "CR" },
  { id: "18", name: "Henry Smith", amount: "$50,000", action: "earned from signals", avatar: "HS" },
  { id: "19", name: "Amelie Laurent", amount: "$8,500", action: "just invested", avatar: "AL" },
  { id: "20", name: "Alexander Kozlov", amount: "$41,200", action: "earned from copy trading", avatar: "AK" },
  { id: "21", name: "Sofia Santos", amount: "$19,500", action: "withdrew", avatar: "SS" },
  { id: "22", name: "Daniel Peterson", amount: "$11,300", action: "just invested", avatar: "DP" },
  { id: "23", name: "Evelyn Fischer", amount: "$35,600", action: "earned from trading", avatar: "EF" },
  { id: "24", name: "Matthew Taylor", amount: "$7,800", action: "withdrew", avatar: "MT" },
  { id: "25", name: "Harper Jensen", amount: "$52,000", action: "earned from signals", avatar: "HJ" },
  { id: "26", name: "Joseph Ali", amount: "$16,400", action: "just invested", avatar: "JA" },
  { id: "27", name: "Chloe Kelly", amount: "$29,000", action: "earned from copy trading", avatar: "CK" },
  { id: "28", name: "Samuel Wright", amount: "$10,500", action: "withdrew", avatar: "SW" },
  { id: "29", name: "Emily Bennett", amount: "$88,000", action: "just invested", avatar: "EB" },
  { id: "30", name: "Sebastian Novak", amount: "$33,500", action: "earned from signals", avatar: "SN" },
  { id: "31", name: "Zoe Diaz", amount: "$15,200", action: "earned from copy trading", avatar: "ZD" },
  { id: "32", name: "David Kim", amount: "$75,000", action: "just invested", avatar: "DK" },
  { id: "33", name: "Natalie Vance", amount: "$21,000", action: "withdrew", avatar: "NV" },
  { id: "34", name: "Andrew Cole", amount: "$6,200", action: "earned from trading", avatar: "AC" },
  { id: "35", name: "Grace Sterling", amount: "$95,000", action: "just invested", avatar: "GS" },
  { id: "36", name: "Ryan Howard", amount: "$13,400", action: "withdrew", avatar: "RH" },
  { id: "37", name: "Lily Vance", amount: "$26,700", action: "earned from signals", avatar: "LV" },
  { id: "38", name: "Gabriel Silva", amount: "$38,000", action: "just invested", avatar: "GS" },
  { id: "39", name: "Hannah Abbot", amount: "$17,500", action: "earned from copy trading", avatar: "HA" },
  { id: "40", name: "Christian Grey", amount: "$120,000", action: "just invested", avatar: "CG" },
  { id: "41", name: "Victoria Cruz", amount: "$48,500", action: "earned from signals", avatar: "VC" },
  { id: "42", name: "Jack Sheppard", amount: "$9,200", action: "withdrew", avatar: "JS" },
  { id: "43", name: "Stella Moon", amount: "$31,000", action: "earned from copy trading", avatar: "SM" },
  { id: "44", name: "Owen Hayes", amount: "$5,800", action: "just invested", avatar: "OH" },
  { id: "45", name: "Elena Popova", amount: "$55,000", action: "earned from copy trading", avatar: "EP" },
  { id: "46", name: "Christopher Ward", amount: "$23,400", action: "withdrew", avatar: "CW" },
  { id: "47", name: "Alice Morgan", amount: "$64,000", action: "just invested", avatar: "AM" },
  { id: "48", name: "Tyler Pierce", amount: "$14,500", action: "earned from signals", avatar: "TP" },
  { id: "49", name: "Penelope Cruz", amount: "$37,800", action: "withdrew", avatar: "PC" },
  { id: "50", name: "Julian Alvarez", amount: "$42,000", action: "just invested", avatar: "JA" },
  { id: "51", name: "Nora Roberts", amount: "$18,000", action: "earned from copy trading", avatar: "NR" },
  { id: "52", name: "Leo Messi", amount: "$150,000", action: "just invested", avatar: "LM" },
  { id: "53", name: "Maya Angelou", amount: "$29,500", action: "earned from signals", avatar: "MA" },
  { id: "54", name: "Jonathan Joestar", amount: "$8,900", action: "withdrew", avatar: "JJ" },
  { id: "55", name: "Diane Prince", amount: "$70,000", action: "just invested", avatar: "DP" },
  { id: "56", name: "Arthur Pendragon", amount: "$11,000", action: "earned from copy trading", avatar: "AP" },
]

export function FloatingNotification() {
  const [visible, setVisible] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null)

  useEffect(() => {
    const showNotification = () => {
      const randomNotification = notifications[Math.floor(Math.random() * notifications.length)]
      setCurrentNotification(randomNotification)
      setVisible(true)

      setTimeout(() => {
        setVisible(false)
      }, 5000)
    }

    const interval = setInterval(showNotification, 10000)
    showNotification()

    return () => clearInterval(interval)
  }, [])

  if (!visible || !currentNotification) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-slide-in-left">
      <div className="flex items-center gap-3 border border-border bg-card p-4 shadow-lg backdrop-blur-md">
        <div className="flex h-10 w-10 items-center justify-center bg-primary text-sm font-bold text-primary-foreground">
          {currentNotification.avatar}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{currentNotification.name}</p>
          <p className="text-xs text-muted-foreground">
            {currentNotification.action} <span className="font-semibold text-accent">{currentNotification.amount}</span>
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setVisible(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
