"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { AuthGuard } from "@/components/auth-guard"
import { getAdminEventsForUser, createEvent, type Event, type CreateEventData } from "@/lib/events"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, Plus, Edit, Ticket } from "lucide-react"
import Link from "next/link"
import { EventForm } from "@/components/event-form"

export default function CoordinatorEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const fetchEvents = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await getAdminEventsForUser(user.id, false)
      if (error) {
        console.error("Error fetching events:", error)
      }
      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [user])

  const handleCreateEvent = async (eventData: Omit<CreateEventData, "creator_id">) => {
    if (!user?.id) return

    try {
      const { error } = await createEvent({
        ...eventData,
        creator_id: user.id,
      })
      if (error) {
        throw new Error(error)
      }
      setIsCreateDialogOpen(false)
      fetchEvents() // Refresh the events list
    } catch (error) {
      console.error("Error creating event:", error)
      throw error
    }
  }

  if (loading) {
    return (
      <AuthGuard coordinatorOnly>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard coordinatorOnly>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Eventos</h1>
            <p className="text-gray-600 mt-2">Gestiona tus eventos como coordinador</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen((v) => !v)}>
            <Plus className="h-4 w-4 mr-2" />
            {isCreateDialogOpen ? "Cerrar" : "Crear Evento"}
          </Button>
        </div>

        {isCreateDialogOpen && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Crear Nuevo Evento</CardTitle>
              <CardDescription>
                Completa la información para crear un nuevo evento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventForm onSubmit={handleCreateEvent} submitButtonText="Crear Evento" />
            </CardContent>
          </Card>
        )}

        {events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarDays className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes eventos</h3>
              <p className="text-gray-600 text-center mb-4">
                Comienza creando tu primer evento como coordinador.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">{event.name}</CardTitle>
                    <Badge variant={new Date(event.event_date) > new Date() ? "default" : "secondary"}>
                      {new Date(event.event_date) > new Date() ? "Próximo" : "Pasado"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      {new Date(event.event_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                    {event.category && (
                      <Badge variant="outline" className="text-xs">
                        {event.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/coordinator/events/${event.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/coordinator/events/${event.id}/tickets`}>
                        <Ticket className="h-4 w-4 mr-1" />
                        Tickets
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}