"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { useRole } from "@/hooks/use-role"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CalendarDays, Users, ScanLine, Loader2, Plus, Trash2, BarChart3 } from "lucide-react"
import {
  getAdminEventsForUser,
  type Event,
} from "@/lib/events"
import {
  getUsers,
  getEventStaff,
  assignStaffToEvent,
  removeStaffFromEvent,
  getEventScanStats,
  getEventScanCountsByStaff,
  type StaffMember,
} from "@/lib/staff"
import type { User as AppUser } from "@/lib/auth"
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from "recharts"

function AdminStaffContent() {
  const { user } = useAuth()
  const { isAdmin } = useRole()

  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [loadingEvents, setLoadingEvents] = useState(true)

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [removingId, setRemovingId] = useState<string>("")

  const [search, setSearch] = useState("")
  const [userResults, setUserResults] = useState<AppUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")

  const [scanStats, setScanStats] = useState<{ total_tickets: number; scanned_tickets: number; pending_tickets: number; scan_rate: number } | null>(null)
  const [scanStatsLoading, setScanStatsLoading] = useState(false)

  const [staffScanCounts, setStaffScanCounts] = useState<Array<{ staff_id: string; success: number; already_used: number; invalid: number; total: number }>>([])
  const [staffScanCountsLoading, setStaffScanCountsLoading] = useState(false)

  // Cargar eventos del admin/coordinador
  useEffect(() => {
    const loadEvents = async () => {
      if (!user?.id) return
      setLoadingEvents(true)
      try {
        const { data, error } = await getAdminEventsForUser(user.id, isAdmin)
        if (error) {
          console.error("Error al cargar eventos:", error)
        }
        setEvents(data || [])
        // Seleccionar primero si existe
        if ((data || []).length > 0) {
          setSelectedEventId((data || [])[0].id)
        }
      } catch (err) {
        console.error("Error al cargar eventos:", err)
      } finally {
        setLoadingEvents(false)
      }
    }
    loadEvents()
  }, [user?.id, isAdmin])

  const selectedEvent = useMemo(() => events.find((e) => e.id === selectedEventId) || null, [events, selectedEventId])
  const selectedEventLabel = useMemo(
    () =>
      selectedEvent
        ? `${selectedEvent.name} · ${new Date(selectedEvent.event_date).toLocaleDateString("es-ES")}`
        : "Selecciona un evento",
    [selectedEvent],
  )

  const loadEventData = useCallback(async (eventId: string) => {
    if (!eventId) return
    setLoadingStaff(true)
    setScanStatsLoading(true)
    setStaffScanCountsLoading(true)
    try {
      const [{ data: staffData }, { data: statsData }, { data: countsData }] = await Promise.all([
        getEventStaff(eventId),
        getEventScanStats(eventId),
        getEventScanCountsByStaff(eventId),
      ])
      setStaff(staffData || [])
      setScanStats(statsData || null)
      setStaffScanCounts(countsData || [])
    } catch (err) {
      console.error("Error al cargar datos del evento:", err)
    } finally {
      setLoadingStaff(false)
      setScanStatsLoading(false)
      setStaffScanCountsLoading(false)
    }
  }, [])

  // Cargar staff y métricas cuando cambie el evento
  useEffect(() => {
    if (selectedEventId) {
      loadEventData(selectedEventId)
    }
  }, [selectedEventId, loadEventData])

  const handleSearchUsers = async () => {
    setUsersLoading(true)
    try {
      const { data } = await getUsers({ search, limit: 10, offset: 0 })
      setUserResults(data || [])
    } catch (err) {
      console.error("Error al buscar usuarios:", err)
    } finally {
      setUsersLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedEventId || !selectedUserId || !user?.id) return
    setAssigning(true)
    try {
      const { error } = await assignStaffToEvent(selectedUserId, selectedEventId, ["scan_tickets"], user.id)
      if (error) {
        alert(error)
        return
      }
      setSelectedUserId("")
      setSearch("")
      setUserResults([])
      await loadEventData(selectedEventId)
    } catch (err) {
      console.error("Error al asignar staff:", err)
    } finally {
      setAssigning(false)
    }
  }

  const handleRemove = async (staffId: string) => {
    setRemovingId(staffId)
    try {
      const { error } = await removeStaffFromEvent(staffId)
      if (error) {
        alert(error)
        return
      }
      await loadEventData(selectedEventId)
    } catch (err) {
      console.error("Error al remover staff:", err)
    } finally {
      setRemovingId("")
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Staff por Evento</h1>
          <p className="text-muted-foreground">Asigna personal y revisa métricas de escaneo por staff.</p>
        </div>
        <Button asChild>
          <Link href="/admin/events">
            <CalendarDays className="h-4 w-4 mr-2" />
            Gestionar Eventos
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seleccionar Evento</CardTitle>
          <CardDescription>Elige el evento para ver y administrar su staff.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEvents ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando eventos...
            </div>
          ) : events.length === 0 ? (
            <Alert>
              <AlertTitle>No hay eventos</AlertTitle>
              <AlertDescription>Crea un evento primero para gestionar su staff.</AlertDescription>
            </Alert>
          ) : (
            <div className="max-w-md">
              <Label className="mb-2 block">Evento</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  {/* Ocultamos el SelectValue para evitar que muestre el ID y renderizamos una etiqueta personalizada */}
                  <SelectValue className="sr-only" placeholder={selectedEventLabel} />
                  <span className="block truncate">{selectedEventLabel}</span>
                </SelectTrigger>
                <SelectContent>
                  {events.map((evt) => (
                    <SelectItem key={evt.id} value={evt.id}>
                      {evt.name} · {new Date(evt.event_date).toLocaleDateString("es-ES")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList>
          <TabsTrigger value="staff">
            <Users className="h-4 w-4 mr-2" /> Staff del Evento
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="assign">
              <Plus className="h-4 w-4 mr-2" /> Asignar Staff
            </TabsTrigger>
          )}
          <TabsTrigger value="metrics">
            <BarChart3 className="h-4 w-4 mr-2" /> Métricas de Escaneo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Personal asignado</CardTitle>
              <CardDescription>Listado del staff asociado al evento seleccionado.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStaff ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando staff...
                </div>
              ) : staff.length === 0 ? (
                <p className="text-muted-foreground">No hay staff asignado a este evento.</p>
              ) : (
                <div className="space-y-4">
                  {staff.map((m) => (
                    <div key={m.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center space-x-4">
                        <Users className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{m.user?.name || m.user_id}</div>
                          <div className="text-sm text-muted-foreground">{m.user?.email || "Sin email"}</div>
                          <div className="text-xs text-muted-foreground mt-1">Permisos: {m.permissions?.join(", ") || "N/A"}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemove(m.id)}
                          disabled={removingId === m.id}
                        >
                          {removingId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assign">
          <Card>
            <CardHeader>
              <CardTitle>Asignar nuevo staff</CardTitle>
              <CardDescription>Busca usuarios y asígnalos al evento actual.</CardDescription>
            </CardHeader>
            <CardContent>
              {isAdmin ? (
                !selectedEvent ? (
                  <Alert>
                    <AlertTitle>Selecciona un evento</AlertTitle>
                    <AlertDescription>Debes seleccionar un evento para poder asignar staff.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <Label className="mb-2 block">Buscar usuarios</Label>
                        <Input
                          placeholder="Nombre o email"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleSearchUsers} disabled={usersLoading}>
                        {usersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4 mr-2" />}
                        Buscar
                      </Button>
                    </div>

                    <div>
                      <Label className="mb-2 block">Seleccionar usuario</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un usuario" />
                        </SelectTrigger>
                        <SelectContent>
                          {userResults.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name || u.email} ({u.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button onClick={handleAssign} disabled={assigning || !selectedUserId}>
                        {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        Asignar al evento
                      </Button>
                      <p className="text-sm text-muted-foreground">Se asigna con permiso por defecto: escanear tickets.</p>
                    </div>
                  </div>
                )
              ) : (
                <Alert>
                  <AlertTitle>Acceso restringido</AlertTitle>
                  <AlertDescription>
                    Solo el administrador puede asignar personal a los eventos. Puedes visualizar el staff y métricas.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de escaneo por staff</CardTitle>
              <CardDescription>Top staff por número de escaneos (éxitos totales).</CardDescription>
            </CardHeader>
            <CardContent>
              {scanStatsLoading || staffScanCountsLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando métricas...
                </div>
              ) : staffScanCounts.length === 0 ? (
                <p className="text-muted-foreground">Aún no hay escaneos registrados para este evento.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Tickets Totales</CardTitle>
                        <CardDescription>{scanStats?.total_tickets ?? 0}</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Escaneados</CardTitle>
                        <CardDescription>{scanStats?.scanned_tickets ?? 0}</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Pendientes</CardTitle>
                        <CardDescription>{scanStats?.pending_tickets ?? 0}</CardDescription>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Tasa de Escaneo</CardTitle>
                        <CardDescription>{(scanStats?.scan_rate ?? 0).toFixed(2)}%</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>

                  <div className="h-64">
                    {/* Datos del gráfico con nombres de staff en lugar de IDs */}
                    {/**/}
                    {/* Construimos los datos combinando staff asignado para mapear staff_id -> nombre */}
                    {/* Si no hay nombre, usamos el ID como fallback */}
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={staffScanCounts.map((c) => ({
                          staff:
                            (staff.find((s) => s.user_id === c.staff_id)?.user?.name || c.staff_id),
                          Escaneos: c.success,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="staff" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="Escaneos" fill="#1e40af" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Nota: Los nombres se muestran en el listado de staff. El gráfico usa el ID del staff para asegurar consistencia.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AdminStaffPage() {
  return (
    <AuthGuard requireAuth={true} allowedRoles={["admin", "coordinator"]}>
      <AdminStaffContent />
    </AuthGuard>
  )
}