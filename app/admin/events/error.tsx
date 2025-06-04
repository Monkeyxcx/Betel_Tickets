"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Error en la gestión de eventos</h1>
        <p className="text-muted-foreground mb-6">No se pudo cargar la página de gestión de eventos.</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Intentar de nuevo</Button>
          <Button asChild variant="outline">
            <Link href="/admin">Volver al panel de admin</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
