"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, MapPin, Ticket, Loader2 } from "lucide-react"
import { getEventById, type Event } from "@/lib/events"
import { getTicketTypesByEvent, type TicketType } from "@/lib/tickets"

export default function EventDetailsPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId) {
        setError("ID de evento no válido")
        setLoading(false)
        return
      }

      console.log("Loading event with ID:", eventId) // Debug

      try {
        // Cargar información del evento
        const { data: eventData, error: eventError } = await getEventById(eventId)

        console.log("Event data:", eventData, "Error:", eventError) // Debug

        if (eventError) {
          setError(eventError)
          setLoading(false)
          return
        }

        if (!eventData) {
          setError("Evento no encontrado")
          setLoading(false)
          return
        }

        setEvent(eventData)

        // Cargar tipos de tickets para este evento
        const { data: ticketTypesData, error: ticketTypesError } = await getTicketTypesByEvent(eventId)

        console.log("Ticket types data:", ticketTypesData, "Error:", ticketTypesError) // Debug

        if (ticketTypesError) {
          console.error("Error loading ticket types:", ticketTypesError)
        } else if (ticketTypesData) {
          setTicketTypes(ticketTypesData)
        }
      } catch (error) {
        console.error("Error in loadEventData:", error) // Debug
        setError("Error al cargar el evento")
      } finally {
        setLoading(false)
      }
    }

    loadEventData()
  }, [eventId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Cargando evento...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Evento no encontrado</h1>
          <p className="text-muted-foreground mb-6">{error || "El evento que buscas no existe."}</p>
          <p className="text-sm text-gray-500 mb-4">ID buscado: {eventId}</p>
          <Button asChild>
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-pink-500 to-purple-600 text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">{event.name}</h1>
              <p className="mx-auto max-w-[700px] text-lg md:text-xl">{event.description}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                <Link href={`/tickets?event=${eventId}`}>Comprar Tickets</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                <Link href="#info">Más Información</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Event Info */}
      <section id="info" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-purple-100 p-4 rounded-full">
                <CalendarDays className="h-10 w-10 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Fecha</h3>
                <p className="text-gray-500 dark:text-gray-400">{formatDate(event.event_date)}</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-purple-100 p-4 rounded-full">
                <Clock className="h-10 w-10 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Horario</h3>
                <p className="text-gray-500 dark:text-gray-400">{formatTime(event.event_date)}</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-purple-100 p-4 rounded-full">
                <MapPin className="h-10 w-10 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Ubicación</h3>
                <p className="text-gray-500 dark:text-gray-400">{event.location}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket Types */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Tipos de Tickets</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Elige el ticket que mejor se adapte a tus necesidades
              </p>
            </div>
          </div>

          {ticketTypes.length === 0 ? (
            <div className="text-center mt-8">
              <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Tickets no disponibles</h3>
              <p className="text-muted-foreground">Los tickets para este evento aún no están disponibles.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
              {ticketTypes.map((ticketType, index) => (
                <div
                  key={ticketType.id}
                  className={`flex flex-col p-6 bg-white shadow-lg rounded-lg dark:bg-gray-800 ${
                    index === 1 ? "border-2 border-purple-600" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold capitalize">{ticketType.name}</h3>
                      {index === 1 && (
                        <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <Ticket className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="mt-4">
                    <p className="text-4xl font-bold">${ticketType.price}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">por persona</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{ticketType.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {ticketType.available_quantity} disponibles
                    </p>
                  </div>
                  <Button className="mt-6 bg-purple-600 hover:bg-purple-700" asChild>
                    <Link href={`/tickets?event=${eventId}&type=${ticketType.name}`}>Comprar Ahora</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Event Image Section */}
      {event.image_url && (
        <section className="w-full py-12">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <img
                src={event.image_url || "/placeholder.svg"}
                alt={event.name}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
