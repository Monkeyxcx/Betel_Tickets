"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Ticket, Settings, Calendar, MapPin, Loader2, Download, QrCode } from "lucide-react"
import { getUserTickets, getUserOrders, type Ticket as TicketType, type Order } from "@/lib/tickets"
import { generateTicketImage, type TicketPDFData } from "@/lib/pdf-generator"
import { generateQRCodeURL } from "@/lib/qr-generator"
import Link from "next/link"

function ProfileContent() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [downloadingOrder, setDownloadingOrder] = useState<string | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        // Cargar tickets
        const { data: ticketsData, error: ticketsError } = await getUserTickets(user.id)
        if (!ticketsError && ticketsData) {
          setTickets(ticketsData)
        }
        setLoadingTickets(false)

        // Cargar órdenes
        const { data: ordersData, error: ordersError } = await getUserOrders(user.id)
        if (!ordersError && ordersData) {
          setOrders(ordersData)
        }
        setLoadingOrders(false)
      }
    }

    loadUserData()
  }, [user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const downloadOrderPDF = async (orderId: string) => {
    if (!user) return

    setDownloadingOrder(orderId)

    try {
      // Obtener TODOS los tickets de esta orden específica
      const { data: orderTicketsData, error: ticketsError } = await getUserTickets(user.id)

      if (ticketsError || !orderTicketsData) {
        alert("Error al cargar los tickets")
        return
      }

      // Filtrar solo los tickets de esta orden
      const orderTickets = orderTicketsData.filter((ticket) => ticket.order_id === orderId)
      const order = orders.find((o) => o.id === orderId)

      if (!order) {
        alert("No se encontró la orden")
        return
      }

      if (orderTickets.length === 0) {
        alert("No se encontraron tickets para esta orden")
        return
      }

      console.log(`Generando PDF para orden ${orderId} con ${orderTickets.length} tickets`)

      // Preparar datos para el PDF
      const pdfData: TicketPDFData = {
        order: {
          id: order.id,
          total_amount: order.total_amount,
          created_at: order.created_at,
          status: order.status,
        },
        user: {
          name: user.name,
          email: user.email,
        },
        event: {
          name: orderTickets[0].event?.name || "Concierto de Rock 2024",
          description:
            "El evento musical más esperado del año con las mejores bandas",
          event_date: orderTickets[0].event?.event_date || "2024-09-15T18:00:00Z",
          location: orderTickets[0].event?.location || "Centro de Convenciones",
        },
        tickets: orderTickets.map((ticket, index) => ({
          id: ticket.id,
          ticket_code: ticket.ticket_code,
          ticket_type: {
            name: ticket.ticket_type?.name || "General",
            price: ticket.ticket_type?.price || 0,
            description: ticket.ticket_type?.description || "Acceso al evento",
          },
        })),
      }

      console.log(`Datos del PDF:`, pdfData)

      // Generar imagen (simulando PDF)
      const imageDataUrl = await generateTicketImage(pdfData)

      // Crear enlace de descarga
      const link = document.createElement("a")
      link.href = imageDataUrl
      link.download = `tickets-orden-${order.id.slice(-8).toUpperCase()}-${orderTickets.length}-tickets.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log(`PDF generado exitosamente para ${orderTickets.length} tickets`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error al generar el PDF")
    } finally {
      setDownloadingOrder(null)
    }
  }

  const groupTicketsByOrder = () => {
    const grouped: { [orderId: string]: TicketType[] } = {}
    tickets.forEach((ticket) => {
      if (!grouped[ticket.order_id]) {
        grouped[ticket.order_id] = []
      }
      grouped[ticket.order_id].push(ticket)
    })
    return grouped
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Información Personal
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Mis Tickets ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Mis Órdenes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Gestiona tu información de perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input id="name" defaultValue={user?.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" defaultValue={user?.email} disabled />
                </div>
              </div>
              <Button>Guardar cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Mis Tickets</CardTitle>
              <CardDescription>Tickets que has comprado con códigos QR</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTickets ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Cargando tickets...</span>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No tienes tickets aún</p>
                  <Button asChild>
                    <Link href="/tickets">Comprar Tickets</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Ticket className="h-5 w-5 text-purple-600" />
                              <h3 className="font-semibold">{ticket.event?.name || "Evento"}</h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  ticket.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : ticket.status === "used"
                                      ? "bg-gray-100 text-gray-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {ticket.status === "active"
                                  ? "Activo"
                                  : ticket.status === "used"
                                    ? "Usado"
                                    : "Cancelado"}
                              </span>
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {ticket.event?.event_date
                                    ? formatDate(ticket.event.event_date)
                                    : "Fecha por confirmar"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{ticket.event?.location || "Ubicación por confirmar"}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-medium">
                                Tipo: {ticket.ticket_type?.name?.toUpperCase() || "N/A"}
                              </span>
                              <span className="font-medium">Precio: ${ticket.ticket_type?.price || "0"}</span>
                            </div>

                            <div className="font-mono text-lg font-bold text-purple-600">{ticket.ticket_code}</div>
                          </div>

                          <div className="text-center ml-4">
                            <div className="mb-2">
                              <img
                                src={generateQRCodeURL(ticket.ticket_code, 120) || "/placeholder.svg"}
                                alt={`QR Code para ticket ${ticket.ticket_code}`}
                                className="border border-gray-200 rounded"
                                width={120}
                                height={120}
                              />
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <QrCode className="h-3 w-3" />
                              <span>Código QR</span>
                            </div>
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

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Órdenes</CardTitle>
              <CardDescription>Todas tus compras realizadas - Descarga tus tickets en PDF</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Cargando órdenes...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tienes órdenes aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const orderTickets = tickets.filter((t) => t.order_id === order.id)
                    const ticketTypes = orderTickets.reduce(
                      (acc, ticket) => {
                        const typeName = ticket.ticket_type?.name || "General"
                        acc[typeName] = (acc[typeName] || 0) + 1
                        return acc
                      },
                      {} as Record<string, number>,
                    )

                    return (
                      <Card key={order.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold">Orden #{order.id.slice(-8).toUpperCase()}</div>
                              <div className="text-sm text-muted-foreground">{formatDate(order.created_at)}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                <strong>
                                  {orderTickets.length} ticket{orderTickets.length !== 1 ? "s" : ""}
                                </strong>
                                {Object.entries(ticketTypes).length > 0 && (
                                  <div className="mt-1">
                                    {Object.entries(ticketTypes).map(([type, count]) => (
                                      <span
                                        key={type}
                                        className="inline-block mr-2 text-xs bg-gray-100 px-2 py-1 rounded"
                                      >
                                        {count}x {type.toUpperCase()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">${order.total_amount}</div>
                              <div
                                className={`text-sm px-2 py-1 rounded-full mb-2 ${
                                  order.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {order.status === "completed"
                                  ? "Completado"
                                  : order.status === "pending"
                                    ? "Pendiente"
                                    : "Cancelado"}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => downloadOrderPDF(order.id)}
                                disabled={downloadingOrder === order.id || orderTickets.length === 0}
                                className="w-full"
                              >
                                {downloadingOrder === order.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generando...
                                  </>
                                ) : (
                                  <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Descargar {orderTickets.length} Ticket{orderTickets.length !== 1 ? "s" : ""}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard requireAuth={true}>
      <ProfileContent />
    </AuthGuard>
  )
}
