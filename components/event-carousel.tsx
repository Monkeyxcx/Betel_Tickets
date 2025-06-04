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
    <div className="relative group">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
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
