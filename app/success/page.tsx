"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Loader2 } from "lucide-react"
import { getUserOrders, type Order } from "@/lib/tickets"
import { useAuth } from "@/hooks/use-auth"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrder = async () => {
      if (user && orderId) {
        const { data: orders } = await getUserOrders(user.id)
        const foundOrder = orders?.find((o) => o.id === orderId)
        setOrder(foundOrder || null)
      }
      setLoading(false)
    }

    loadOrder()
  }, [user, orderId])

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Cargando información de la compra...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">¡Compra Exitosa!</CardTitle>
          <CardDescription>Tu compra de tickets ha sido procesada correctamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">Detalles de la compra:</p>
            <ul className="mt-2 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Número de orden:</span>
                <span>#{order?.id.slice(-8).toUpperCase() || "N/A"}</span>
              </li>
              <li className="flex justify-between mt-1">
                <span className="text-muted-foreground">Fecha:</span>
                <span>{order ? new Date(order.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </li>
              <li className="flex justify-between mt-1">
                <span className="text-muted-foreground">Total:</span>
                <span>${order?.total_amount || "0"}</span>
              </li>
              <li className="flex justify-between mt-1">
                <span className="text-muted-foreground">Estado:</span>
                <span className="text-green-500 font-medium">Confirmado</span>
              </li>
            </ul>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Hemos enviado un correo electrónico con los detalles de tu compra y tus tickets. Por favor, revisa tu
            bandeja de entrada.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/profile">Ver mis tickets</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
