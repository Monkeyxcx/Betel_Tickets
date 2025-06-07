"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { EventCard } from "./event-card"
import type { Event } from "@/lib/events"

interface EventCarouselProps {
  title: string
  events: Event[]
  featured?: boolean
}

export function EventCarousel({ title, events, featured = false }: EventCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (!carouselRef.current) return

    const scrollAmount = 320 // Ancho de una tarjeta + gap
    const newPosition =
      direction === "left"
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(carouselRef.current.scrollWidth - carouselRef.current.clientWidth, scrollPosition + scrollAmount)

    carouselRef.current.scrollTo({
      left: newPosition,
      behavior: "smooth",
    })
    setScrollPosition(newPosition)
  }

  const canScrollLeft = scrollPosition > 0
  const canScrollRight = carouselRef.current
    ? scrollPosition < carouselRef.current.scrollWidth - carouselRef.current.clientWidth
    : true

  if (events.length === 0) return null

  return (
    <div className="relative group px-4 py-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
      >
        {events.map((event) => (
          <div key={event.id} className="flex-none w-80">
            <EventCard event={event} featured={featured} />
          </div>
        ))}
      </div>
    </div>
  )
}
