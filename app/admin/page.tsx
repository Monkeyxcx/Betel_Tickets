"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, CalendarDays, CreditCard, Users, Ticket, Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { User } from "@/lib/auth"
import { updateUserRole } from "@/lib/auth"
import { getUsers } from "@/lib/staff"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

import {
  getPlatformStatistics,
  getDailySalesStatistics,
  getDailyTicketsStatistics,
  getEventCategoryStats,
  getTicketStatusStats,
  formatNumber,
  formatCurrency,
  formatDate,
  type PlatformStats,
  type DailySalesData,
  type DailyTicketsData,
} from "@/lib/statistics"

function AdminDashboardContent() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [salesData, setSalesData] = useState<DailySalesData[] | null>(null)
  const [ticketsData, setTicketsData] = useState<DailyTicketsData[] | null>(null)
  const [categoryData, setCategoryData] = useState<Array<{ category: string; count: number }> | null>(null)
  const [ticketStatusData, setTicketStatusData] = useState<Array<{ status: string; count: number }> | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [roleChanges, setRoleChanges] = useState<Record<string, "user" | "staff" | "coordinator" | "admin">>({})
  const [savingEmail, setSavingEmail] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(0)
  const pageSize = 10
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadStatistics()
  }, [])

  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 500)
    return () => clearTimeout(h)
  }, [search])

  useEffect(() => {
    loadUsers()
  }, [debouncedSearch, page])

  const loadStatistics = async () => {
    try {
      setLoading(true)

      // Cargar estadísticas principales
      const { data: platformData } = await getPlatformStatistics()
      setStats(platformData)

      // Cargar estadísticas de ventas diarias
      const { data: salesStatsData } = await getDailySalesStatistics()
      setSalesData(salesStatsData)

      // Cargar estadísticas de tickets diarios
      const { data: ticketsStatsData } = await getDailyTicketsStatistics()
      setTicketsData(ticketsStatsData)

      // Cargar estadísticas globales por categoría de eventos
      const { data: categories } = await getEventCategoryStats()
      setCategoryData(categories)

      // Cargar estadísticas globales por estado de tickets
      const { data: statusObj } = await getTicketStatusStats()
      if (statusObj) {
        const arr = [
          { status: "active", count: statusObj.active || 0 },
          { status: "used", count: statusObj.used || 0 },
          { status: "cancelled", count: statusObj.cancelled || 0 },
        ]
        setTicketStatusData(arr)
      } else {
        setTicketStatusData(null)
      }
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setUsersLoading(true)
      const { data, error, count } = await getUsers({
        search: debouncedSearch,
        limit: pageSize,
        offset: page * pageSize,
      })
      if (error) {
        console.error("Error al cargar usuarios:", error)
        setUsers([])
      } else {
        setUsers(data || [])
        setTotal(count || 0)
      }
    } catch (e) {
      console.error("Error al cargar usuarios:", e)
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  const handleRoleChange = (email: string, newRole: "user" | "staff" | "coordinator" | "admin") => {
    setRoleChanges((prev) => ({ ...prev, [email]: newRole }))
  }

  const handleSaveRole = async (email: string) => {
    const newRole = roleChanges[email]
    if (!newRole) return
    try {
      setSavingEmail(email)
      const { success, error } = await updateUserRole(email, newRole)
      if (!success) {
        alert(error || "No se pudo actualizar el rol")
        return
      }
      // Actualizar en memoria
      setUsers((prev) => prev.map((u) => (u.email === email ? { ...u, role: newRole } : u)))
      // Limpiar cambio aplicado
      setRoleChanges((prev) => {
        const { [email]: _, ...rest } = prev
        return rest
      })
    } catch (e) {
      console.error("Error actualizando rol:", e)
      alert("Error actualizando rol del usuario")
    } finally {
      setSavingEmail(null)
    }
  }

  // Crear gráfico de líneas 
  function createLineChart(data: { date: string; value: number }[], color: string) {
    return (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={formatDate} />
          <YAxis />
          <Tooltip labelFormatter={formatDate} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]
  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <Button asChild>
          <Link href="/admin/events" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Gestionar Eventos
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_revenue ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_revenue === null ? "Sistema de pagos no implementado" : "Ingresos acumulados"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Vendidos</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.total_tickets_sold ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_tickets_sold === null ? "Sistema de tickets no implementado" : "Tickets vendidos"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.total_users ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_users != null && stats?.total_users > 0
                ? "Usuarios en la plataforma"
                : stats?.total_users === null
                  ? "No disponible"
                  : "Sin usuarios registrados"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.active_events ?? 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.upcoming_events !== null
                ? `${formatNumber(stats?.upcoming_events ?? 0)} próximos eventos`
                : "Próximos eventos: N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ventas" className="mt-8">
        <TabsList>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
        </TabsList>
        <TabsContent value="ventas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ingresos Diarios
              </CardTitle>
              <CardDescription>Ganancias de los últimos 30 días</CardDescription>
            </CardHeader>
            <CardContent>
              {salesData && salesData.length > 0 ? (
                <div className="space-y-4">
                  {createLineChart(
                    salesData.map((item) => ({ date: item.date, value: item.revenue })),
                    "#10b981",
                  )}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(salesData.reduce((sum, item) => sum + item.revenue, 0))}
                      </div>
                      <div className="text-sm text-muted-foreground">Total 30 días</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(salesData.reduce((sum, item) => sum + item.revenue, 0) / salesData.length)}
                      </div>
                      <div className="text-sm text-muted-foreground">Promedio diario</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {salesData[salesData.length - 1]
                          ? formatCurrency(salesData[salesData.length - 1].revenue)
                          : "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground">Último día</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {salesData === null
                        ? "No se pudieron cargar las estadísticas de ventas"
                        : "No hay datos de ventas para mostrar"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="usuarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Usuarios
              </CardTitle>
              <CardDescription>Listado de usuarios y edición de roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o email"
                  className="w-full md:w-[320px]"
                />
                <div className="text-sm text-muted-foreground">Mostrando {pageSize} por página</div>
              </div>
              {usersLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No hay usuarios para mostrar.</div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="p-2 font-medium">Nombre</th>
                        <th className="p-2 font-medium">Email</th>
                        <th className="p-2 font-medium">Rol</th>
                        <th className="p-2 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const currentRole = roleChanges[u.email] ?? u.role
                        return (
                          <tr key={u.email} className="border-t">
                            <td className="p-2 truncate">{u.name}</td>
                            <td className="p-2 truncate text-muted-foreground">{u.email}</td>
                            <td className="p-2">
                              <Select value={currentRole} onValueChange={(val) => handleRoleChange(u.email, val as any)}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Selecciona rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Usuario</SelectItem>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="coordinator">Coordinador</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2">
                              <Button
                                variant="default"
                                size="sm"
                                disabled={savingEmail === u.email || currentRole === u.role}
                                onClick={() => handleSaveRole(u.email)}
                              >
                                {savingEmail === u.email ? (
                                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Guardando</span>
                                ) : (
                                  "Guardar"
                                )}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Página {total > 0 ? page + 1 : 0} de {total > 0 ? Math.ceil(total / pageSize) : 0}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={(page + 1) * pageSize >= total}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Tickets Vendidos por Día
              </CardTitle>
              <CardDescription>Tickets vendidos en los últimos 30 días</CardDescription>
            </CardHeader>
            <CardContent>
              {ticketsData && ticketsData.length > 0 ? (
                <div className="space-y-4">
                  {createLineChart(
                    ticketsData.map((item) => ({ date: item.date, value: item.tickets })),
                    "#f59e0b",
                  )}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatNumber(ticketsData.reduce((sum, item) => sum + item.tickets, 0))}
                      </div>
                      <div className="text-sm text-muted-foreground">Total 30 días</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(
                          Math.round(ticketsData.reduce((sum, item) => sum + item.tickets, 0) / ticketsData.length),
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Promedio diario</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {ticketsData[ticketsData.length - 1]
                          ? formatNumber(ticketsData[ticketsData.length - 1].tickets)
                          : "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground">Último día</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {ticketsData === null
                        ? "No se pudieron cargar las estadísticas de tickets"
                        : "No hay datos de tickets para mostrar"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Tickets</CardTitle>
              <CardDescription>Distribución por estado</CardDescription>
            </CardHeader>
            <CardContent>
              {ticketStatusData && ticketStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ticketStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {ticketStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">No hay datos de estados de tickets</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Eventos por Categoría
              </CardTitle>
              <CardDescription>Distribución global de eventos activos por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData && categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Eventos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">No hay datos de categorías de eventos</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <AuthGuard requireAuth={true} adminOnly={true}>
      <AdminDashboardContent />
    </AuthGuard>
  )
}
