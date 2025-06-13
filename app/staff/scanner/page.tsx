"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { useRole } from "@/hooks/use-role"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { QrCode, Camera, CheckCircle, XCircle, AlertTriangle, User, Ticket, RefreshCw } from "lucide-react"
import { scanTicket, getScanHistory, type TicketScan } from "@/lib/staff"
import { QRScanner } from "@/components/qr-scanner"

function StaffScannerContent() {
  const { user } = useRole()
  const [ticketCode, setTicketCode] = useState("")
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState<{
    result: TicketScan | null
    ticket: any
    error: string | null
  } | null>(null)
  const [scanHistory, setScanHistory] = useState<TicketScan[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [scanMode, setScanMode] = useState<"manual" | "camera">("manual")
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null)

  // Cargar el ticket al leer el qr
  useEffect(() => {
    if (ticketCode && ticketCode.trim() && !scanning) {
      if (ticketCode === lastScannedCode) {
        // Si es el mismo código, no lo volvemos a procesar
        return;
      }
      setLastScannedCode(ticketCode);
      handleScan();
    }
  }, [ticketCode]);
  

  const loadScanHistory = async () => {
    if (!user) return

    setLoadingHistory(true)
    const { data, error } = await getScanHistory(undefined, user.id, 20)
    if (data) {
      setScanHistory(data)
    }
    setLoadingHistory(false)
  }

  const handleScan = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!ticketCode.trim() || !user) return

    setScanning(true)

    try {
      const result = await scanTicket(
        ticketCode.trim().toUpperCase(),
        user.id,
        "Entrada Principal", // Ubicación por defecto
        navigator.userAgent, // Info del dispositivo
      )

      setLastScan({
        result: result.data,
        ticket: result.ticket,
        error: result.error
      })
      setTicketCode("")

      // Recargar historial
      await loadScanHistory()

      // Auto-focus para el siguiente escaneo
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    } catch (error) {
      console.error("Error scanning ticket:", error)
      setLastScan({
        result: null,
        ticket: null,
        error: "Error al procesar el escaneo",
      })
    } finally {
      setScanning(false)
    }
  }

  const handleQRScan = async (code: string) => {
    if (!code || !user || scanning) return

    setTicketCode(code)

    // Pequeña pausa para mostrar el código antes de procesarlo
    setTimeout(() => {
      handleScan()
    }, 300)
  }

  const handleCameraError = (error: string) => {
    setCameraError(error)
  }

  const getScanResultIcon = (result: string) => {
    switch (result) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "already_used":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "invalid":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <QrCode className="h-5 w-5 text-gray-500" />
    }
  }

  const getScanResultColor = (result: string) => {
    switch (result) {
      case "success":
        return "bg-green-50 border-green-200"
      case "already_used":
        return "bg-yellow-50 border-yellow-200"
      case "invalid":
        return "bg-red-50 border-red-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const formatScanTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Escáner de Tickets</h1>
            <p className="text-muted-foreground">Escanea códigos QR para validar tickets</p>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span className="font-medium">{user?.name}</span>
            <Badge variant="secondary">{user?.role?.toUpperCase()}</Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Panel de Escaneo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Escanear Ticket
              </CardTitle>
              <CardDescription>Ingresa el código del ticket o escanea el código QR</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="manual" onValueChange={(value) => setScanMode(value as "manual" | "camera")}>
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="manual" className="flex-1">
                    <QrCode className="mr-2 h-4 w-4" />
                    Manual
                  </TabsTrigger>
                  <TabsTrigger value="camera" className="flex-1">
                    <Camera className="mr-2 h-4 w-4" />
                    Cámara
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual">
                  <form onSubmit={handleScan} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticketCode">Código del Ticket</Label>
                      <Input
                        ref={inputRef}
                        id="ticketCode"
                        value={ticketCode}
                        onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                        placeholder="Ej: ABC12345"
                        className="font-mono text-lg"
                        disabled={scanning}
                      />
                      <p className="text-xs text-muted-foreground">
                        El código se convertirá automáticamente a mayúsculas
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={scanning || !ticketCode.trim()}>
                      {scanning ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Escaneando...
                        </>
                      ) : (
                        <>
                          <QrCode className="mr-2 h-4 w-4" />
                          Escanear Ticket
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="camera">
                  <div className="space-y-4">
                    <QRScanner onScan={handleQRScan} onError={handleCameraError} />

                    {cameraError && (
                      <Alert variant="destructive">
                        <AlertTitle>Error de cámara</AlertTitle>
                        <AlertDescription>{cameraError}</AlertDescription>
                      </Alert>
                    )}

                    {ticketCode && (
                      <div className="mt-2">
                        <Label htmlFor="scannedCode">Código detectado</Label>
                        <div className="flex gap-2 mt-1">
                          <Input id="scannedCode" value={ticketCode} readOnly className="font-mono text-lg flex-1" />
                          <Button onClick={() => handleScan()} disabled={scanning || !ticketCode.trim()}>
                            {scanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Resultado del último escaneo */}
              {lastScan && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Resultado del Escaneo</h3>

                  {lastScan.error ? (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{lastScan.error}</AlertDescription>
                    </Alert>
                  ) : (
                    lastScan.result && (
                      <Card className={getScanResultColor(lastScan.result.scan_result)}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {getScanResultIcon(lastScan.result.scan_result)}
                            <div className="flex-1">
                              <div className="font-semibold">
                                {lastScan.result.scan_result === "success" && "✅ Ticket Válido"}
                                {lastScan.result.scan_result === "already_used" && "⚠️ Ticket Ya Usado"}
                                {lastScan.result.scan_result === "invalid" && "❌ Ticket Inválido"}
                              </div>

                              {lastScan.ticket && (
                                <div className="mt-2 space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Ticket className="h-4 w-4" />
                                    <span className="font-mono">{lastScan.ticket.ticket_code}</span>
                                  </div>
                                  {lastScan.ticket.user && (
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      <span>
                                        {lastScan.ticket.user.name} ({lastScan.ticket.user.email})
                                      </span>
                                    </div>
                                  )}
                                  {lastScan.ticket.ticket_type?.name && (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {lastScan.ticket.ticket_type.name.toUpperCase()}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="mt-2 text-xs text-muted-foreground">
                                Escaneado: {formatScanTime(lastScan.result.scanned_at)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historial de Escaneos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de Escaneos</CardTitle>
                  <CardDescription>Últimos 20 escaneos realizados</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadScanHistory} disabled={loadingHistory}>
                  {loadingHistory ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay escaneos recientes</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanHistory.map((scan) => (
                    <div key={scan.id} className={`p-3 rounded-lg border ${getScanResultColor(scan.scan_result)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getScanResultIcon(scan.scan_result)}
                          <span className="font-mono text-sm">{scan.ticket?.ticket_code || "N/A"}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatScanTime(scan.scanned_at)}</span>
                      </div>

                      {scan.ticket?.user && (
                        <div className="mt-1 text-xs text-muted-foreground">{scan.ticket.user.name}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instrucciones */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instrucciones de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-800">Ticket Válido</h3>
                <p className="text-sm text-muted-foreground">El ticket es válido y se marca como usado</p>
              </div>

              <div className="text-center">
                <div className="bg-yellow-100 p-3 rounded-full w-fit mx-auto mb-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-yellow-800">Ya Usado</h3>
                <p className="text-sm text-muted-foreground">El ticket ya fue escaneado anteriormente</p>
              </div>

              <div className="text-center">
                <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-2">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-red-800">Inválido</h3>
                <p className="text-sm text-muted-foreground">El ticket no existe o no es válido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function StaffScannerPage() {
  return (
    <AuthGuard requireAuth={true} allowedRoles={["staff", "admin"]}>
      <StaffScannerContent />
    </AuthGuard>
  )
}
