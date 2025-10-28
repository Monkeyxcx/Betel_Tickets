"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Calendar, MapPin, Loader2, ArrowLeft, Ticket } from "lucide-react"
import { getAdminEventsForUser, createEvent, updateEvent, deleteEvent, type Event, type CreateEventData } from "@/lib/events"
import Link from "next/link"
import { ImageUpload } from "@/components/image-upload"
import { useRole } from "@/hooks/use-role"

function AdminEventsContent() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("create")
  const { user, isAdmin } = useRole()

  const [formData, setFormData] = useState<CreateEventData>({
    name: "",
    description: "",
    event_date: "",
    location: "",
    image_url: "",
    category: "",
    featured: false,
  })

  useEffect(() => {
    if (user?.id) {
      loadEvents()
    }
  }, [user?.id, isAdmin])

  const fetchEvents = async () => {
    if (!user?.id) return
    
    try {
      const eventsData = await getAdminEventsForUser(user.id, user.role)
      setEvents(eventsData)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setSuccessMessage("")

    try {
      if (editingEvent) {
        const { data, error } = await updateEvent(editingEvent.id, formData)
        if (error) {
          alert(`Error al actualizar evento: ${error}`)
        } else {
          setSuccessMessage("¡Evento actualizado exitosamente!")
          setEditingEvent(null)
          resetForm()
          loadEvents()
        }
      } else {
        const { data, error } = await createEvent({ ...formData, creator_id: user!.id })
        if (error) {
          alert(`Error al crear evento: ${error}`)
        } else {
          setSuccessMessage("¡Evento creado exitosamente!")
          resetForm()
          loadEvents()
        }
      }
    } catch (error) {
      alert("Error al procesar el evento")
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (event: Event) => {
    // Navegar a la página de edición específica
    window.location.href = `/admin/events/${event.id}/edit`
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este evento?")) return

    const { success, error } = await deleteEvent(eventId)
    if (error) {
      alert(`Error al eliminar evento: ${error}`)
    } else {
      setSuccessMessage("¡Evento eliminado exitosamente!")
      loadEvents()
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      event_date: "",
      location: "",
      image_url: "",
      category: "",
      featured: false,
    })
    setEditingEvent(null)
    setImagePreview(null)
    setActiveTab("list")
  }

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, image_url: url })
    setImagePreview(url)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gestión de Eventos</h1>
        <Button asChild variant="outline">
          <Link href="/admin" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
      </div>

      {successMessage && (
        <div className="mb-6 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
          {successMessage}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="create" data-value="create">
            <Plus className="h-4 w-4 mr-2" />
            {editingEvent ? "Editar Evento" : "Crear Evento"}
          </TabsTrigger>
          <TabsTrigger value="list">
            <Calendar className="h-4 w-4 mr-2" />
            Lista de Eventos ({events.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{editingEvent ? "Editar Evento" : "Crear Nuevo Evento"}</CardTitle>
              <CardDescription>
                {editingEvent ? "Modifica los datos del evento" : "Completa la información para crear un nuevo evento"}
              </CardDescription>
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
                      value={formData.image_url || ''}
                      onChange={(url) => setFormData({ ...formData, image_url: url })}
                      onPreviewChange={setImagePreview}
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
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingEvent ? "Actualizando..." : "Creando..."}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {editingEvent ? "Actualizar Evento" : "Crear Evento"}
                      </>
                    )}
                  </Button>
                  {editingEvent && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Existentes</CardTitle>
              <CardDescription>Gestiona todos los eventos creados</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Cargando eventos...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay eventos creados aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <Card key={event.id} className="border overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {event.image_url && (
                          <div className="w-full md:w-48 h-32 bg-gray-100">
                            <img
                              src={event.image_url || "/placeholder.svg"}
                              alt={event.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = `/placeholder.svg?height=128&width=192&text=${encodeURIComponent(
                                  event.name,
                                )}`
                              }}
                            />
                          </div>
                        )}
                        <CardContent className="p-4 flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{event.name}</h3>
                                {event.featured && (
                                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                    Destacado
                                  </span>
                                )}
                                {event.category && (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    {event.category}
                                  </span>
                                )}
                              </div>
                              <p className="text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(event.event_date)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/admin/events/${event.id}/tickets`}>
                                  <Ticket className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/admin/events/${event.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(event.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AdminEventsPage() {
  return (
    <AuthGuard requireAuth={true} allowedRoles={["admin", "coordinator"]}>
      <AdminEventsContent />
    </AuthGuard>
  )
}
