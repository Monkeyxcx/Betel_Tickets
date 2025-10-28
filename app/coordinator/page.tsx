"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CalendarDays, Ticket, DollarSign, Users, TrendingUp, BarChart3, Plus } from "lucide-react"
import { 
  getCoordinatorPlatformStatistics, 
  getCoordinatorDailySalesStatistics, 
  getCoordinatorDailyTicketsStatistics,
  getCoordinatorEventCategoryStats,
  getCoordinatorTicketStatusStats
} from "@/lib/statistics"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"

interface PlatformStats {
  totalEvents: number
  totalTickets: number
  totalRevenue: number
  soldTickets: number
  availableTickets: number
}

interface DailySalesStats {
  date: string
  sales: number
  revenue: number
}

interface DailyTicketsStats {
  date: string
  created: number
  sold: number
  scanned: number
}

interface CategoryStats {
  category: string
  events: number
  tickets: number
  sold: number
}

interface StatusStats {
  status: string
  count: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function CoordinatorDashboard() {
  const { user } = useAuth()
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [dailySalesStats, setDailySalesStats] = useState<DailySalesStats[]>([])
  const [dailyTicketsStats, setDailyTicketsStats] = useState<DailyTicketsStats[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [statusStats, setStatusStats] = useState<StatusStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return

      try {
        const [platform, dailySales, dailyTickets, categories, statuses] = await Promise.all([
          getCoordinatorPlatformStatistics(user.id),
          getCoordinatorDailySalesStatistics(user.id),
          getCoordinatorDailyTicketsStatistics(user.id),
          getCoordinatorEventCategoryStats(user.id),
          getCoordinatorTicketStatusStats(user.id)
        ])

        setPlatformStats(platform)
        setDailySalesStats(dailySales)
        setDailyTicketsStats(dailyTickets)
        setCategoryStats(categories)
        setStatusStats(statuses)
      } catch (error) {
        console.error("Error fetching coordinator statistics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.id])

  if (loading) {
    return (
      <AuthGuard coordinatorOnly>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard coordinatorOnly>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Coordinación</h1>
            <p className="text-gray-600 mt-2">Estadísticas de tus eventos</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/coordinator/events">
                <Plus className="mr-2 h-4 w-4" />
                Crear Evento
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/coordinator/events">
                Gestionar Eventos
              </Link>
            </Button>
          </div>
        </div>

        {/* Platform Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats?.totalEvents || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Vendidos</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats?.soldTickets || 0}</div>
              <p className="text-xs text-muted-foreground">
                de {platformStats?.totalTickets || 0} totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(platformStats?.totalRevenue || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Disponibles</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats?.availableTickets || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ventas Diarias (Últimos 30 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySalesStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `$${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Ingresos' : 'Ventas'
                    ]}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" name="sales" />
                  <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="revenue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Eventos por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="events" fill="#8884d8" name="Eventos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Tickets</CardTitle>
              <CardDescription>Distribución por estado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad de Tickets (30 días)</CardTitle>
              <CardDescription>Creados, vendidos y escaneados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyTicketsStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="created" stroke="#8884d8" name="Creados" />
                  <Line type="monotone" dataKey="sold" stroke="#82ca9d" name="Vendidos" />
                  <Line type="monotone" dataKey="scanned" stroke="#ffc658" name="Escaneados" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}