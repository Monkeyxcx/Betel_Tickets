"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { getEventById, updateEvent, type Event, type CreateEventData } from "@/lib/events"
import Link from "next/link"
import { ImageUpload } from "@/components/image-upload"
import { useRole } from "@/hooks/use-role"
import { useAuth } from "@/hooks/use-auth"

function EditEventContent() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const { isAdmin } = useRole()

  const [event, setEvent] = useState<Event | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const [formData, setFormData] = useState<CreateEventData>({
    name: "",
    description: "",
    event_date: "",
    location: "",
    image_url: "",
    category: "",
    featured: false,
  })

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
      setFormData({
        name: data.name,
        description: data.description,
        event_date: data.event_date.slice(0, 16),
        location: data.location,
        image_url: data.image_url || "",
        category: data.category || "",
        featured: data.featured,
      })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMessage("")

    try {
      const { data: _data, error } = await updateEvent(eventId, formData)
      if (error) {
        alert(`Error al actualizar evento: ${error}`)
      } else {
        setSuccessMessage("¡Evento actualizado exitosamente!")
        setTimeout(() => {
          router.push("/admin/events")
        }, 2000)
      }
    } catch (error) {
      alert("Error al actualizar el evento")
    } finally {
      setSaving(false)
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Evento *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Concierto de Rock 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="musica">Música</SelectItem>
                    <SelectItem value="teatro">Teatro</SelectItem>
                    <SelectItem value="deportes">Deportes</SelectItem>
                    <SelectItem value="conferencia">Conferencia</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="cristiano">Eventos Cristianos</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date">Fecha y Hora *</Label>
                <Input
                  id="event_date"
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ej: Centro de Convenciones"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <ImageUpload
                  value={formData.image_url || ""}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el evento..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Evento Destacado</Label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando cambios...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/events">Cancelar</Link>
              </Button>
            </div>
          </form>
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
