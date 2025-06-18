"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, CalendarDays, CreditCard, Users, Ticket, Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

import {
  getPlatformStatistics,
  getDailySalesStatistics,
  getDailyTicketsStatistics,
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

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
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setLoading(false)
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
              <CardTitle>Usuarios Registrados</CardTitle>
              <CardDescription>Lista de usuarios registrados en la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Total de usuarios: {formatNumber(stats?.total_users ?? 0)}</h3>
                <p className="text-muted-foreground">
                  {stats?.total_users === null
                    ? "No se pudo obtener información de usuarios"
                    : stats?.total_users === 0
                      ? "Aún no hay usuarios registrados"
                      : "Usuarios activos en la plataforma"}
                </p>
              </div>
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
