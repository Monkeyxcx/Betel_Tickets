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
        <h1 className="text-2xl font-bold mb-4">Algo salió mal</h1>
        <p className="text-muted-foreground mb-6">No pudimos cargar la información del evento.</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Intentar de nuevo</Button>
          <Button asChild variant="outline">
            <Link href="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
