"use client"

import type React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Loader2, Ticket } from "lucide-react"

export default function TicketsPage() {
  const searchParams = useSearchParams()
  const initialTicketType = searchParams.get("type") || "general"

  const [ticketType, setTicketType] = useState(initialTicketType)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const ticketPrices = {
    general: 50,
    vip: 100,
    premium: 150,
  }

  const ticketDescriptions = {
    general: "Acceso al evento en zona general",
    vip: "Acceso al evento en zona VIP con bebidas incluidas",
    premium: "Acceso al evento en zona Premium con bebidas, comida y Meet & Greet",
  }

  const calculateTotal = () => {
    return ticketPrices[ticketType as keyof typeof ticketPrices] * quantity
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Aquí iría la lógica para procesar el pago con Stripe
    // Por ejemplo:
    // const response = await fetch('/api/create-checkout-session', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     ticketType,
    //     quantity,
    //     amount: calculateTotal()
    //   }),
    // })

    // Simulando un delay para la demo
    setTimeout(() => {
      setIsLoading(false)
      // Redirección a la página de pago
      // window.location.href = data.url
    }, 1500)
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Comprar Tickets</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Selecciona tus tickets</CardTitle>
                <CardDescription>Elige el tipo y cantidad de tickets que deseas comprar</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  <RadioGroup value={ticketType} onValueChange={setTicketType} className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="general" id="general" />
                      <Label htmlFor="general" className="flex flex-col">
                        <span className="font-medium">General - $50</span>
                        <span className="text-sm text-muted-foreground">Acceso al evento</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vip" id="vip" />
                      <Label htmlFor="vip" className="flex flex-col">
                        <span className="font-medium">VIP - $100</span>
                        <span className="text-sm text-muted-foreground">Acceso VIP con bebidas</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="premium" id="premium" />
                      <Label htmlFor="premium" className="flex flex-col">
                        <span className="font-medium">Premium - $150</span>
                        <span className="text-sm text-muted-foreground">Todo incluido + Meet & Greet</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="10"
                      value={quantity}
                      onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Continuar al pago"
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
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium capitalize">{ticketType}</p>
                      <p className="text-sm text-muted-foreground">
                        {ticketDescriptions[ticketType as keyof typeof ticketDescriptions]}
                      </p>
                    </div>
                  </div>
                  <p>
                    ${ticketPrices[ticketType as keyof typeof ticketPrices]} x {quantity}
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
