"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, MapPin, Ticket, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { EventCarousel } from "@/components/event-carousel"
import { getActiveEvents, getFeaturedEvents, getEventsByCategory, type Event } from "@/lib/events"

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [musicEvents, setMusicEvents] = useState<Event[]>([])
  const [theaterEvents, setTheaterEvents] = useState<Event[]>([])
  const [sportsEvents, setSportsEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Cargar eventos destacados
        const { data: featured } = await getFeaturedEvents()
        if (featured) setFeaturedEvents(featured)

        // Cargar todos los eventos
        const { data: all } = await getActiveEvents()
        if (all) setAllEvents(all)

        // Cargar eventos por categoría
        const { data: music } = await getEventsByCategory("musica")
        if (music) setMusicEvents(music)

        const { data: theater } = await getEventsByCategory("teatro")
        if (theater) setTheaterEvents(theater)

        const { data: sports } = await getEventsByCategory("deportes")
        if (sports) setSportsEvents(sports)
      } catch (error) {
        console.error("Error loading events:", error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  const filteredEvents = allEvents.filter(
    (event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const heroEvent = featuredEvents[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Cargando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      {heroEvent && (
        <section className="relative w-full h-[70vh] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={
                heroEvent.image_url ||
                `/placeholder.svg?height=600&width=1200&text=${encodeURIComponent(heroEvent.name)}`
              }
              alt={heroEvent.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          </div>

          <div className="relative container h-full flex items-center">
            <div className="max-w-2xl text-white">
              <h1 className="text-5xl md:text-6xl font-bold mb-4">{heroEvent.name}</h1>
           
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-6 w-6" />
                  <span>
                    {new Date(heroEvent.event_date).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <Clock className="h-6 w-6" />
                  <span>
                    {new Date(heroEvent.event_date).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-lg">
                  <MapPin className="h-6 w-6" />
                  <span>{heroEvent.location}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8">
                  <Link href={`/events/${heroEvent.id}`}>
                    <Ticket className="mr-2 h-5 w-5" />
                    Comprar Tickets
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="dark border-white text-white hover:bg-white/10 text-lg px-8"
                >
                  <Link href={`/events/${heroEvent.id}`}>Más Información</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search Section */}
      <section className="w-full py-8 bg-gray-50 dark:bg-gray-900">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos por nombre, descripción o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Events Sections */}
      <section className="w-full py-12">
        <div className="container space-y-12">
          {/* Eventos Destacados */}
          {featuredEvents.length > 0 && (
            <EventCarousel title="🌟 Eventos Destacados" events={featuredEvents} featured={true} />
          )}

          {/* Resultados de búsqueda o todos los eventos */}
          {searchTerm ? (
            <EventCarousel title={`Resultados de búsqueda (${filteredEvents.length})`} events={filteredEvents} />
          ) : (
            <>
              {/* Eventos de Música */}
              {musicEvents.length > 0 && <EventCarousel title="🎵 Música" events={musicEvents} />}

              {/* Eventos de Teatro */}
              {theaterEvents.length > 0 && <EventCarousel title="🎭 Teatro" events={theaterEvents} />}

              {/* Eventos de Deportes */}
              {sportsEvents.length > 0 && <EventCarousel title="⚽ Deportes" events={sportsEvents} />}

              {/* Todos los eventos */}
              {allEvents.length > 0 && <EventCarousel title="📅 Todos los Eventos" events={allEvents} />}
            </>
          )}

          {/* Mensaje si no hay eventos */}
          {allEvents.length === 0 && !loading && (
            <div className="text-center py-12">
              <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No hay eventos disponibles</h3>
              <p className="text-muted-foreground">Vuelve pronto para ver nuevos eventos emocionantes.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
