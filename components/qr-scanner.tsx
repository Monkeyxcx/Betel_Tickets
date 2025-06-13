"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, StopCircle, RefreshCw } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

interface QRScannerProps {
  onScan: (code: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [loadingCamera, setLoadingCamera] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Limpiar el escáner cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [])

  const startScanner = async () => {
    setLoadingCamera(true)
    setPermissionError(null)

    try {
      if (!containerRef.current) return

      // Inicializar el escáner si no existe
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader")
      }

      const scanner = scannerRef.current

      // Detener el escáner si ya está escaneando
      if (scanner.isScanning) {
        await scanner.stop()
      }

      // Configuración del escáner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.2,
      }

      // Iniciar el escáner con la cámara trasera por defecto
      await scanner.start(
        { facingMode: "environment" }, // Usar cámara trasera
        config,
        (decodedText) => {
          // Callback cuando se detecta un código QR
          onScan(decodedText)
          // No detener el escáner para permitir múltiples escaneos
        },
        (errorMessage) => {
          // Ignorar mensajes de error durante el escaneo
          console.log("QR scan error:", errorMessage)
        },
      )

      setIsScanning(true)
    } catch (error) {
      console.error("Error starting QR scanner:", error)

      // Manejar errores de permisos
      if (error instanceof Error) {
        if (error.message.includes("Permission")) {
          setPermissionError("Se requiere permiso para acceder a la cámara")
        } else {
          setPermissionError("Error al iniciar la cámara: " + error.message)
        }

        if (onError) {
          onError(error.message)
        }
      }
    } finally {
      setLoadingCamera(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop()
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Contenedor para el escáner */}
      <div
        id="qr-reader"
        ref={containerRef}
        className={`w-full max-w-sm mx-auto overflow-hidden rounded-lg border ${isScanning ? "h-64" : "h-0"}`}
      ></div>

      {/* Mensajes de error */}
      {permissionError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{permissionError}</div>
      )}

      {/* Botones de control */}
      <div className="flex justify-center gap-2">
        {!isScanning ? (
          <Button onClick={startScanner} disabled={loadingCamera} className="flex items-center gap-2">
            {loadingCamera ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Activando cámara...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" />
                Activar cámara
              </>
            )}
          </Button>
        ) : (
          <Button onClick={stopScanner} variant="outline" className="flex items-center gap-2">
            <StopCircle className="h-4 w-4" />
            Detener cámara
          </Button>
        )}
      </div>
    </div>
  )
}
