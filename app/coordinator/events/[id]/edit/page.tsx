"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AuthGuard } from "@/components/auth-guard"
import { getEventById, updateEvent, type Event, type CreateEventData } from "@/lib/events"
import { EventForm } from "@/components/event-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function CoordinatorEditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const eventId = params.id as string

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data, error } = await getEventById(eventId)
        if (error) {
          setError("Error al cargar el evento")
          return
        }
        if (!data) {
          setError("Evento no encontrado")
          return
        }

        // Check if user is the creator or an admin
        if (user?.role !== "admin" && data.creator_id !== user?.id) {
          setError("No tienes permisos para editar este evento")
          return
        }

        setEvent(data)
      } catch (error) {
        console.error("Error fetching event:", error)
        setError("Error al cargar el evento")
      } finally {
        setLoading(false)
      }
    }

    if (user && eventId) {
      fetchEvent()
    }
  }, [eventId, user])

  const handleUpdateEvent = async (eventData: Omit<CreateEventData, "creator_id">) => {
    if (!event) return

    try {
      const { error } = await updateEvent(event.id, eventData)
      if (error) {
        throw new Error(error)
      }
      router.push("/coordinator/events")
    } catch (error) {
      console.error("Error updating event:", error)
      throw error
    }
  }

  if (loading) {
    return (
      <AuthGuard coordinatorOnly>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2 text-muted-foreground">Cargando evento...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard coordinatorOnly>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
              <p className="text-gray-600 text-center mb-4">{error}</p>
              <Button asChild>
                <Link href="/coordinator/events">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Eventos
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  if (!event) {
    return (
      <AuthGuard coordinatorOnly>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Evento no encontrado</h3>
              <p className="text-gray-600 text-center mb-4">
                El evento que buscas no existe o no tienes permisos para verlo.
              </p>
              <Button asChild>
                <Link href="/coordinator/events">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Eventos
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard coordinatorOnly>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/coordinator/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Eventos
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Editar Evento</h1>
          <p className="text-gray-600 mt-2">Modifica la información del evento</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Evento</CardTitle>
            <CardDescription>
              Actualiza los detalles de tu evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm 
              initialData={{
                name: event.name,
                description: event.description,
                event_date: event.event_date,
                location: event.location,
                image_url: event.image_url || "",
                category: event.category || "",
                featured: event.featured,
              }}
              onSubmit={handleUpdateEvent}
              submitButtonText="Actualizar Evento"
            />
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}