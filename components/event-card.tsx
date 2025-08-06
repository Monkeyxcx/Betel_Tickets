"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Clock, Star } from "lucide-react"
import type { Event } from "@/lib/events"

interface EventCardProps {
  event: Event
  featured?: boolean
}

export function EventCard({ event, featured = false }: EventCardProps) {
  const [imageError, setImageError] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card
      className={`group overflow-hidden transition-all duration-300 hover:scale-90 hover:shadow-xl ${featured ? "border-2 border-yellow-400" : ""}`}
    >
      <div className="relative">
        {/* Imagen del evento */}
        <div className="aspect-video overflow-hidden relative">
          <img
            src={
              imageError || !event.image_url
                ? `/placeholder.svg?height=300&width=500&text=${encodeURIComponent(event.name)}`
                : event.image_url
            }
            alt={event.name}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-30"
            onError={() => setImageError(true)}
          />
        </div>

        {/* Badge de destacado */}
        {event.featured && (
          <div className="absolute top-3 left-3 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            Destacado
          </div>
        )}

        {/* Overlay con información */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="font-bold text-lg mb-2 line-clamp-2">{event.name}</h3>

            <div className="flex flex-col gap-1 text-xs text-gray-300 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(event.event_date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTime(event.event_date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            </div>

            <Button asChild size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
            <Link href={`/tickets?event=${event.id}`}>Comprar Tickets</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Información básica visible */}
      <CardContent className="p-2">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.name}</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-10 w-4" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>
        <Button asChild className="w-full" variant="outline">
          <Link href={`/events/${event.id}`}>Ver Detalles</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
