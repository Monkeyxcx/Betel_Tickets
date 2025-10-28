"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Ticket as TicketIcon, Loader2, ArrowLeft } from "lucide-react"
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
import { useAuth } from "@/hooks/use-auth"

export default function CoordinatorEventTicketsPage() {
  const params = useParams()
  const { user } = useAuth()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null)

  const [formData, setFormData] = useState<CreateTicketTypeData>({
    event_id: eventId,
    name: "",
    price: 0,
    description: "",
    max_quantity: 100,
    available_quantity: 100,
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: evt, error: evtError } = await getEventById(eventId)
    if (evt) {
      // Check permission: only creator or admin
      if (user?.role !== "admin" && evt.creator_id !== user?.id) {
        alert("No tienes permisos para gestionar los tickets de este evento")
        setLoading(false)
        return
      }
      setEvent(evt)
    } else if (evtError) {
      console.error("Error loading event:", evtError)
    }

    const { data: tickets, error: ticketsError } = await getTicketTypesByEvent(eventId)
    if (tickets) setTicketTypes(tickets)
    else if (ticketsError) console.error("Error loading ticket types:", ticketsError)

    setLoading(false)
  }, [eventId, user?.id, user?.role])

  useEffect(() => {
    if (eventId && user) loadData()
  }, [eventId, user, loadData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccessMessage("")
    try {
      if (editingTicket) {
        const { error } = await updateTicketType(editingTicket.id, formData)
        if (error) {
          alert(`Error al actualizar tipo de ticket: ${error}`)
        } else {
          setSuccessMessage("¡Tipo de ticket actualizado!")
          setEditingTicket(null)
          resetForm()
          loadData()
        }
      } else {
        const { error } = await createTicketType(formData)
        if (error) {
          alert(`Error al crear tipo de ticket: ${error}`)
        } else {
          setSuccessMessage("¡Tipo de ticket creado!")
          resetForm()
          loadData()
        }
      }
    } catch (err) {
      alert("Error al procesar el tipo de ticket")
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (ticket: TicketType) => {
    setEditingTicket(ticket)
    setFormData({
      event_id: eventId,
      name: ticket.name,
      price: ticket.price,
      description: ticket.description,
      max_quantity: ticket.max_quantity,
      available_quantity: ticket.available_quantity,
    })
  }

  const handleDelete = async (ticketId: string) => {
    if (!confirm("¿Eliminar este tipo de ticket?")) return
    const { error } = await deleteTicketType(ticketId)
    if (error) alert(`Error al eliminar: ${error}`)
    else loadData()
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

  if (loading) {
    return (
      <AuthGuard coordinatorOnly>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Cargando tickets...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard coordinatorOnly>
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/coordinator/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Eventos
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-2">Gestionar Tipos de Tickets</h1>
        <p className="text-muted-foreground mb-6">Evento: {event?.name}</p>

        {successMessage && (
          <Alert className="mb-4">
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="create" className="space-y-4">
          <TabsList>
            <TabsTrigger value="create">Crear / Editar</TabsTrigger>
            <TabsTrigger value="list">Lista de Tipos</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>{editingTicket ? "Editar Tipo de Ticket" : "Crear Tipo de Ticket"}</CardTitle>
                <CardDescription>
                  Define nombre, precio y cantidad disponible para este evento.
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
                        placeholder="Ej: General, VIP, Preferencial"
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
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        placeholder="Ej: 25.00"
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
                        onChange={(e) => setFormData({ ...formData, max_quantity: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="available_quantity">Cantidad Disponible *</Label>
                      <Input
                        id="available_quantity"
                        type="number"
                        min="0"
                        value={formData.available_quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, available_quantity: parseInt(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detalles del tipo de ticket"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingTicket ? "Actualizando..." : "Creando..."}
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          {editingTicket ? "Actualizar Tipo" : "Crear Tipo"}
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
                <CardTitle>Tipos de Tickets</CardTitle>
                <CardDescription>Lista de tipos creados para este evento</CardDescription>
              </CardHeader>
              <CardContent>
                {ticketTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Aún no hay tipos de tickets</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ticketTypes.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{ticket.name}</p>
                          <p className="text-sm text-muted-foreground">${ticket.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(ticket)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(ticket.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}