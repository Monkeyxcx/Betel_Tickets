"use client"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Ticket, Loader2, ArrowLeft } from "lucide-react"
import { getEventById, type Event } from "@/lib/events"
import {
  getTicketTypesByEvent,
  createTicketType,
  updateTicketType,
  deleteTicketType,
  type TicketType,
  type CreateTicketTypeData,
} from "@/lib/tickets"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRole } from "@/hooks/use-role"
import { useAuth } from "@/hooks/use-auth"

function AdminEventTicketsContent() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const { isAdmin } = useRole()

  const [event, setEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null)
  const [successMessage, setSuccessMessage] = useState("")

  const [formData, setFormData] = useState<CreateTicketTypeData>({
    event_id: eventId,
    name: "",
    price: 0,
    description: "",
    max_quantity: 100,
    available_quantity: 100,
  })

const loadData = useCallback(async () => {
    setPageLoading(true)
    try {
      // Cargar información del evento
      const { data: eventData, error: eventError } = await getEventById(eventId)
      if (eventError) {
        alert(`Error al cargar evento: ${eventError}`)
        router.push("/admin/events")
        return
      }
      // Restringir acceso si no es el creador y no es admin
      if (!isAdmin && eventData?.creator_id && eventData.creator_id !== user?.id) {
        alert("No tienes permiso para gestionar tickets de este evento")
        router.push("/admin/events")
        return
      }
      setEvent(eventData)

      // Cargar tipos de tickets
      const { data: ticketTypesData, error: ticketTypesError } = await getTicketTypesByEvent(eventId)
      if (ticketTypesError) {
        alert(`Error al cargar tipos de tickets: ${ticketTypesError}`)
      } else {
        setTicketTypes(ticketTypesData || [])
      }
    } catch (error) {
      alert("Error al cargar datos")
    } finally {
      setPageLoading(false)
    }
  }, [eventId, router, isAdmin, user?.id])

  useEffect(() => {
    if (!authLoading && user) {
      loadData()
    }
  }, [loadData, authLoading, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setSuccessMessage("")

    try {
      if (editingTicket) {
        const { data: _data, error } = await updateTicketType(editingTicket.id, formData)
        if (error) {
          alert(`Error al actualizar tipo de ticket: ${error}`)
        } else {
          setSuccessMessage("¡Tipo de ticket actualizado exitosamente!")
          setEditingTicket(null)
          resetForm()
          loadData()
        }
      } else {
        const { data: _data, error } = await createTicketType(formData)
        if (error) {
          alert(`Error al crear tipo de ticket: ${error}`)
        } else {
          setSuccessMessage("¡Tipo de ticket creado exitosamente!")
          resetForm()
          loadData()
        }
      }
    } catch (error) {
      alert("Error al procesar el tipo de ticket")
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (ticket: TicketType) => {
    setEditingTicket(ticket)
    setFormData({
      event_id: ticket.event_id,
      name: ticket.name,
      price: ticket.price,
      description: ticket.description,
      max_quantity: ticket.max_quantity,
      available_quantity: ticket.available_quantity,
    })
  }

  const handleDelete = async (ticketId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este tipo de ticket?")) return

    const { success: _success, error } = await deleteTicketType(ticketId)
    if (error) {
      alert(`Error al eliminar tipo de ticket: ${error}`)
    } else {
      setSuccessMessage("¡Tipo de ticket eliminado exitosamente!")
      loadData()
    }
  }

  const resetForm = () => {
    setFormData({
      event_id: eventId,
      name: "",
      price: 0,
      description: "",
      max_quantity: 100,
      available_quantity: 100,
    })
    setEditingTicket(null)
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Evento no encontrado</h1>
          <p className="text-muted-foreground mb-6">No se pudo cargar la información del evento.</p>
          <Button asChild>
            <Link href="/admin/events">Volver a Eventos</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button asChild variant="outline" className="mb-2">
            <Link href="/admin/events" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Eventos
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Tickets para: {event.name}</h1>
          <p className="text-muted-foreground">
            {new Date(event.event_date).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" - "}
            {event.location}
          </p>
        </div>
      </div>

      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">¡Éxito!</AlertTitle>
          <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">
            <Plus className="h-4 w-4 mr-2" />
            {editingTicket ? "Editar Tipo de Ticket" : "Crear Tipo de Ticket"}
          </TabsTrigger>
          <TabsTrigger value="list">
            <Ticket className="h-4 w-4 mr-2" />
            Tipos de Tickets ({ticketTypes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{editingTicket ? "Editar Tipo de Ticket" : "Crear Nuevo Tipo de Ticket"}</CardTitle>
              <CardDescription>
                {editingTicket
                  ? "Modifica los datos del tipo de ticket"
                  : "Completa la información para crear un nuevo tipo de ticket"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: General, VIP, Premium"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Precio *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={e =>
                        setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_quantity">Cantidad Máxima *</Label>
                    <Input
                      id="max_quantity"
                      type="number"
                      min="1"
                      value={formData.max_quantity}
                      onChange={e =>
                        setFormData({ ...formData, max_quantity: Number.parseInt(e.target.value) || 1 })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="available_quantity">Cantidad Disponible *</Label>
                    <Input
                      id="available_quantity"
                      type="number"
                      min="0"
                      max={formData.max_quantity}
                      value={formData.available_quantity}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          available_quantity: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Descripción *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe los beneficios de este tipo de ticket..."
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingTicket ? "Actualizando..." : "Creando..."}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {editingTicket ? "Actualizar Tipo de Ticket" : "Crear Tipo de Ticket"}
                      </>
                    )}
                  </Button>
                  {editingTicket && (
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
              <CardTitle>Tipos de Tickets Existentes</CardTitle>
              <CardDescription>Gestiona todos los tipos de tickets para este evento</CardDescription>
            </CardHeader>
            <CardContent>
              {ticketTypes.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay tipos de tickets creados aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ticketTypes.map((ticket) => (
                    <Card key={ticket.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg capitalize">{ticket.name}</h3>
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                ${ticket.price}
                              </span>
                            </div>
                            <p className="text-muted-foreground mb-2">{ticket.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Ticket className="h-4 w-4" />
                                <span>
                                  {ticket.available_quantity} disponibles / {ticket.max_quantity} total
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(ticket)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(ticket.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
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

export default function AdminEventTicketsPage() {
  return (
    <AuthGuard requireAuth={true} allowedRoles={["admin", "coordinator"]}>
      <AdminEventTicketsContent />
    </AuthGuard>
  )
}
