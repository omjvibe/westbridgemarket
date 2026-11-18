"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  animation?: "fade-in" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale-up" | "zoom-in"
  delay?: number
  duration?: number
  threshold?: number
  once?: boolean
}

export function ScrollReveal({
  children,
  className,
  animation = "slide-up",
  delay = 0,
  duration = 700,
  threshold = 0.1,
  once = true,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const domRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once && domRef.current) {
            observer.unobserve(domRef.current)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold }
    )

    const currentRef = domRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold, once])

  // Map of animation classes
  const getAnimationClasses = () => {
    switch (animation) {
      case "fade-in":
        return isVisible ? "opacity-100 translate-y-0" : "opacity-0"
      case "slide-up":
        return isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      case "slide-down":
        return isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-12"
      case "slide-left":
        return isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
      case "slide-right":
        return isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
      case "scale-up":
        return isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
      case "zoom-in":
        return isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
      default:
        return isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
    }
  }

  return (
    <div
      ref={domRef}
      className={cn(
        "transition-all ease-out will-change-transform-opacity",
        getAnimationClasses(),
        className
      )}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}
