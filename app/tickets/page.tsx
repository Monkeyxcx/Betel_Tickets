"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Loader2, Ticket, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { getTicketTypes, getTicketTypesByEvent, createOrder, type TicketType } from "@/lib/tickets"
import { getEventById, type Event } from "@/lib/events"

export default function TicketsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const eventId = searchParams.get("event")
  const initialTicketType = searchParams.get("type") || ""

  const [event, setEvent] = useState<Event | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null)
  const [ticketTypeId, setTicketTypeId] = useState(initialTicketType)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const [error, setError] = useState("")

  // Cargar evento y tipos de tickets
  useEffect(() => {
    const loadData = async () => {
      try {
        if (eventId) {
          // Cargar información del evento específico
          const { data: eventData, error: eventError } = await getEventById(eventId)
          if (eventError) {
            setError(eventError)
          } else if (eventData) {
            setEvent(eventData)
          }

          // Cargar tipos de tickets del evento específico
          const { data: ticketTypesData, error: ticketTypesError } = await getTicketTypesByEvent(eventId)
          if (ticketTypesError) {
            setError(ticketTypesError)
          } else if (ticketTypesData) {
            setTicketTypes(ticketTypesData)

            // Si hay un tipo inicial, seleccionarlo
            if (initialTicketType) {
              const initialType = ticketTypesData.find((t) => t.name === initialTicketType)
              if (initialType) {
                setTicketTypeId(initialType.id)
                setSelectedTicketType(initialType)
              }
            } else if (ticketTypesData.length > 0) {
              // Seleccionar el primer tipo por defecto
              setTicketTypeId(ticketTypesData[0].id)
              setSelectedTicketType(ticketTypesData[0])
            }
          }
        } else {
          // Cargar todos los tipos de tickets si no hay evento específico
          const { data: allTicketTypes, error: allTicketTypesError } = await getTicketTypes()
          if (allTicketTypesError) {
            setError(allTicketTypesError)
          } else if (allTicketTypes) {
            setTicketTypes(allTicketTypes)
            if (allTicketTypes.length > 0) {
              setTicketTypeId(allTicketTypes[0].id)
              setSelectedTicketType(allTicketTypes[0])
            }
          }
        }
      } catch (error) {
        setError("Error al cargar la información")
      } finally {
        setIsLoadingTypes(false)
      }
    }

    loadData()
  }, [eventId, initialTicketType])

  // Actualizar ticket seleccionado cuando cambia el ID
  useEffect(() => {
    const selected = ticketTypes.find((t) => t.id === ticketTypeId)
    setSelectedTicketType(selected || null)
  }, [ticketTypeId, ticketTypes])

  const calculateTotal = () => {
    return selectedTicketType ? selectedTicketType.price * quantity : 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      router.push("/login")
      return
    }

    if (!selectedTicketType) {
      setError("Por favor selecciona un tipo de ticket")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const { data: order, error: orderError } = await createOrder(user.id, selectedTicketType.id, quantity)

      if (orderError) {
        setError(orderError)
      } else if (order) {
        // Redirigir a página de éxito
        router.push(`/success?order_id=${order.id}`)
      }
    } catch (error) {
      setError("Error al procesar la compra")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingTypes) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Cargando tickets...</p>
          </div>
        </div>
      </div>
    )
  }

  if (ticketTypes.length === 0) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No hay tickets disponibles</h1>
          <p className="text-muted-foreground mb-6">
            {event
              ? `Los tickets para ${event.name} no están disponibles en este momento.`
              : "No hay tickets disponibles en este momento."}
          </p>
          <Button asChild>
            <Link href={event ? `/events/${event.id}` : "/"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href={event ? `/events/${event.id}` : "/"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {event ? `Volver a ${event.name}` : "Volver al inicio"}
            </Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6">{event ? `Comprar Tickets - ${event.name}` : "Comprar Tickets"}</h1>

        {error && <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{error}</div>}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Selecciona tus tickets</CardTitle>
                <CardDescription>Elige el tipo y cantidad de tickets que deseas comprar</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  <RadioGroup value={ticketTypeId} onValueChange={setTicketTypeId} className="space-y-4">
                    {ticketTypes.map((ticketType) => (
                      <div key={ticketType.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={ticketType.id} id={ticketType.id} />
                        <Label htmlFor={ticketType.id} className="flex flex-col flex-1 cursor-pointer">
                          <span className="font-medium">
                            {ticketType.name.charAt(0).toUpperCase() + ticketType.name.slice(1)} - ${ticketType.price}
                          </span>
                          <span className="text-sm text-muted-foreground">{ticketType.description}</span>
                          <span className="text-xs text-muted-foreground">
                            {ticketType.available_quantity} disponibles
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedTicketType?.available_quantity || 10}
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
                    />
                    {selectedTicketType && (
                      <p className="text-xs text-muted-foreground">
                        Máximo {selectedTicketType.available_quantity} tickets disponibles
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading || !selectedTicketType}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Comprar Tickets"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumen de compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event && (
                  <>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                    <Separator />
                  </>
                )}

                {selectedTicketType ? (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium capitalize">{selectedTicketType.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedTicketType.description}</p>
                        </div>
                      </div>
                      <p>
                        ${selectedTicketType.price} x {quantity}
                      </p>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center font-medium">
                      <p>Subtotal</p>
                      <p>${calculateTotal()}</p>
                    </div>

                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <p>Impuestos</p>
                      <p>Incluidos</p>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center text-lg font-bold">
                      <p>Total</p>
                      <p>${calculateTotal()}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Selecciona un tipo de ticket para ver el resumen</p>
                )}
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                <p>
                  Al realizar tu compra, aceptas nuestros términos y condiciones. Los tickets serán enviados a tu correo
                  electrónico.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
