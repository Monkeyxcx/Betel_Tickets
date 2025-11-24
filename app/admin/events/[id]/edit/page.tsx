"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { getEventById, updateEvent, type Event, type CreateEventData } from "@/lib/events"
import Link from "next/link"
import { useRole } from "@/hooks/use-role"
import { useAuth } from "@/hooks/use-auth"
import { EventForm } from "@/components/event-form"

function EditEventContent() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const { isAdmin } = useRole()

  const [event, setEvent] = useState<Event | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")

  const loadEvent = useCallback(async () => {
    setPageLoading(true)
    const { data, error } = await getEventById(eventId)
    if (data) {
      setEvent(data)
      // Restringir acceso si no es el creador y no es admin
      if (!isAdmin && data.creator_id && data.creator_id !== user?.id) {
        alert("No tienes permiso para editar este evento")
        router.push("/admin/events")
        return
      }
    } else if (error) {
      console.error("Error loading event:", error)
    }
    setPageLoading(false)
  }, [eventId, isAdmin, user?.id, router])

  useEffect(() => {
    if (!authLoading && user) {
      loadEvent()
    }
  }, [loadEvent, authLoading, user])

  const handleUpdate = async (formData: Omit<CreateEventData, "creator_id">) => {
    setSuccessMessage("")

    try {
      const { error } = await updateEvent(eventId, formData)
      if (error) {
        throw new Error(error)
      }
      setSuccessMessage("¡Evento actualizado exitosamente!")
      setTimeout(() => {
        router.push("/admin/events")
      }, 2000)
    } catch (error) {
      console.error("Error updating event:", error)
      throw error // Re-throw to let EventForm handle the error state if needed, though EventForm currently catches it.
      // Actually EventForm catches errors in its handleSubmit. 
      // If we want EventForm to show the alert, we should throw.
      // But EventForm's alert is generic. 
      // Let's rely on EventForm's error handling for consistency, or we can add a toast here.
      // For now, throwing ensures EventForm stops "submitting" state.
    }
  }

  if (pageLoading) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando evento...</span>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container py-12">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Evento no encontrado</p>
          <Button asChild className="mt-4">
            <Link href="/admin/events">Volver a Eventos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Editar Evento</h1>
        <Button asChild variant="outline">
          <Link href="/admin/events" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Eventos
          </Link>
        </Button>
      </div>

      {successMessage && (
        <div className="mb-6 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
          {successMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Editar: {event.name}</CardTitle>
          <CardDescription>Modifica los datos del evento y guarda los cambios</CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm
            initialData={{
              name: event.name,
              description: event.description,
              event_date: event.event_date,
              location: event.location,
              image_url: event.image_url,
              category: event.category,
              featured: event.featured,
            }}
            onSubmit={handleUpdate}
            submitButtonText="Guardar Cambios"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function EditEventPage() {
  return (
    <AuthGuard requireAuth={true} allowedRoles={["admin", "coordinator"]}>
      <EditEventContent />
    </AuthGuard>
  )
}
