"use client"

import { useEffect } from "react"

export function GTranslate() {
  useEffect(() => {
    // Configure GTranslate widget settings
    ;(window as any).gtranslateSettings = {
      default_language: "en",
      detect_browser_language: true,
      wrapper_selector: ".gtranslate_wrapper",
      alt_flags: { en: "usa" },
      native_language_names: true,
      languages: [
        "en", "es", "fr", "de", "it", "pt", "ru", "zh-CN", "ar", "ja", "ko", "nl", "tr", "hi", "vi", "pl"
      ],
      globe_color: "#6366f1",
      flag_size: 24,
      horizontal_position: "right",
      vertical_position: "bottom"
    }

    // Inject GTranslate floating script if not already present
    if (!document.getElementById("gtranslate-script")) {
      const script = document.createElement("script")
      script.id = "gtranslate-script"
      script.src = "https://cdn.gtranslate.net/widgets/latest/float.js"
      script.defer = true
      document.body.appendChild(script)
    }
  }, [])

  return (
    <div className="gtranslate_wrapper relative z-[999]" />
  )
}
