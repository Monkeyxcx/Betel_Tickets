import { supabase } from "./supabase"

export interface PlatformStats {
  total_tickets_sold: number
  total_events: number
  total_users: number
  total_revenue: number
  active_events: number
  upcoming_events: number
  system_uptime: number
}

export interface DailySalesData {
  date: string
  revenue: number
  sales: number
}

export interface DailyTicketsData {
  date: string
  tickets: number
}

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Mock data for development
const mockStats: PlatformStats = {
  total_tickets_sold: 0,
  total_events: 0,
  total_users: 0,
  total_revenue: 0,
  active_events: 0,
  upcoming_events: 0,
  system_uptime: 99.9,
}

// Obtener estadísticas generales de la plataforma
export async function getPlatformStatistics(): Promise<{ data: PlatformStats | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    console.log("Using mock statistics data")
    return { data: mockStats, error: null }
  }

  try {
    console.log("Fetching platform statistics")

    // Obtener total de tickets vendidos
    const { count: ticketsSold, error: ticketsError } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })

    if (ticketsError) {
      console.error("Error fetching tickets count:", ticketsError)
    }

    // Obtener total de eventos
    const { count: totalEvents, error: eventsError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })

    if (eventsError) {
      console.error("Error fetching events count:", eventsError)
    }

    // Obtener total de usuarios
    const { count: totalUsers, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (usersError) {
      console.error("Error fetching users count:", usersError)
    }

    // Obtener eventos activos
    const { count: activeEvents, error: activeEventsError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    if (activeEventsError) {
      console.error("Error fetching active events count:", activeEventsError)
    }

    // Obtener eventos próximos (en los próximos 30 días)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { count: upcomingEvents, error: upcomingEventsError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .gte("event_date", new Date().toISOString())
      .lte("event_date", thirtyDaysFromNow.toISOString())

    if (upcomingEventsError) {
      console.error("Error fetching upcoming events count:", upcomingEventsError)
    }

    // Calcular ingresos totales
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "completed")

    let totalRevenue = 0
    if (!ordersError && ordersData) {
      totalRevenue = ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    }

    const stats: PlatformStats = {
      total_tickets_sold: ticketsSold || 0,
      total_events: totalEvents || 0,
      total_users: totalUsers || 0,
      total_revenue: totalRevenue,
      active_events: activeEvents || 0,
      upcoming_events: upcomingEvents || 0,
      system_uptime: 99.9, // Este sería calculado por un sistema de monitoreo externo
    }

    console.log("Platform statistics fetched successfully:", stats)
    return { data: stats, error: null }
  } catch (error) {
    console.error("Error in getPlatformStatistics:", error)
    // Fallback to mock data in case of error
    return { data: mockStats, error: null }
  }
}


// Obtener estadísticas de ventas diarias (últimos 30 días)
export async function getDailySalesStatistics(): Promise<{
  data: DailySalesData[] | null
  error: string | null
}> {
  if (!isSupabaseConfigured()) {
    // Generar datos mock para los últimos 30 días
    const mockData: DailySalesData[] = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      mockData.push({
        date: date.toISOString().split("T")[0],
        revenue: Math.floor(Math.random() * 5000) + 1000,
        sales: Math.floor(Math.random() * 50) + 10,
      })
    }

    return { data: mockData, error: null }
  }

  try {
    console.log("Fetching daily sales statistics")

    // Obtener órdenes de los últimos 30 días
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("created_at, total_amount")
      .eq("status", "completed")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true })

    if (ordersError) {
      console.error("Error fetching daily sales data:", ordersError)
      return { data: null, error: ordersError.message }
    }

    // Agrupar por día
    const dailyStats: { [key: string]: { revenue: number; sales: number } } = {}

    // Inicializar todos los días con 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split("T")[0]
      dailyStats[dateKey] = { revenue: 0, sales: 0 }
    }

    // Llenar con datos reales
    ordersData?.forEach((order) => {
      const date = new Date(order.created_at)
      const dateKey = date.toISOString().split("T")[0]

      if (dailyStats[dateKey]) {
        dailyStats[dateKey].sales += 1
        dailyStats[dateKey].revenue += order.total_amount || 0
      }
    })

    const salesStats = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      revenue: stats.revenue,
      sales: stats.sales,
    }))

    console.log("Daily sales statistics fetched successfully:", salesStats)
    return { data: salesStats, error: null }
  } catch (error) {
    console.error("Error in getDailySalesStatistics:", error)
    return { data: null, error: "Error al obtener estadísticas de ventas diarias" }
  }
}

// Obtener estadísticas de tickets vendidos por día (últimos 30 días)
export async function getDailyTicketsStatistics(): Promise<{
  data: DailyTicketsData[] | null
  error: string | null
}> {
  if (!isSupabaseConfigured()) {
    // Generar datos mock para los últimos 30 días
    const mockData: DailyTicketsData[] = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      mockData.push({
        date: date.toISOString().split("T")[0],
        tickets: Math.floor(Math.random() * 100) + 20,
      })
    }

    return { data: mockData, error: null }
  }

  try {
    console.log("Fetching daily tickets statistics")

    // Obtener tickets de los últimos 30 días
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: ticketsData, error: ticketsError } = await supabase
      .from("tickets")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true })

    if (ticketsError) {
      console.error("Error fetching daily tickets data:", ticketsError)
      return { data: null, error: ticketsError.message }
    }

    // Agrupar por día
    const dailyStats: { [key: string]: number } = {}

    // Inicializar todos los días con 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split("T")[0]
      dailyStats[dateKey] = 0
    }

    // Llenar con datos reales
    ticketsData?.forEach((ticket) => {
      const date = new Date(ticket.created_at)
      const dateKey = date.toISOString().split("T")[0]

      if (dailyStats[dateKey] !== undefined) {
        dailyStats[dateKey] += 1
      }
    })

    const ticketsStats = Object.entries(dailyStats).map(([date, tickets]) => ({
      date,
      tickets,
    }))

    console.log("Daily tickets statistics fetched successfully:", ticketsStats)
    return { data: ticketsStats, error: null }
  } catch (error) {
    console.error("Error in getDailyTicketsStatistics:", error)
    return { data: null, error: "Error al obtener estadísticas de tickets diarios" }
  }
}

// Obtener estadísticas por categoría de eventos
export async function getEventCategoryStats(): Promise<{
  data: Array<{ category: string; count: number }> | null
  error: string | null
}> {
  if (!isSupabaseConfigured()) {
    const mockCategoryStats = [
      { category: "musica", count: 0 },
      { category: "teatro", count: 0 },
      { category: "deportes", count: 0 },
      { category: "conferencia", count: 0 },
      { category: "cristiano", count: 0 },
    ]
    return { data: mockCategoryStats, error: null }
  }

  try {
    console.log("Fetching event category statistics")

    const { data, error } = await supabase.from("events").select("category").eq("status", "active")

    if (error) {
      console.error("Error fetching category stats:", error)
      return { data: null, error: error.message }
    }

    // Contar eventos por categoría
    const categoryCount: { [key: string]: number } = {}
    data?.forEach((event) => {
      const category = event.category || "otro"
      categoryCount[category] = (categoryCount[category] || 0) + 1
    })

    const categoryStats = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count,
    }))

    console.log("Category statistics fetched successfully:", categoryStats)
    return { data: categoryStats, error: null }
  } catch (error) {
    console.error("Error in getEventCategoryStats:", error)
    return { data: null, error: "Error al obtener estadísticas por categoría" }
  }
}

// Obtener estadísticas de tickets por estado
export async function getTicketStatusStats(): Promise<{
  data: { active: number; used: number; cancelled: number } | null
  error: string | null
}> {
  if (!isSupabaseConfigured()) {
    const mockTicketStats = {
      active: 0,
      used: 0,
      cancelled: 0,
    }
    return { data: mockTicketStats, error: null }
  }

  try {
    console.log("Fetching ticket status statistics")

    const { data: ticketsData, error: ticketsError } = await supabase.from("tickets").select("status")

    if (ticketsError) {
      console.error("Error fetching ticket status data:", ticketsError)
      return { data: null, error: ticketsError.message }
    }

    const statusCount = {
      active: 0,
      used: 0,
      cancelled: 0,
    }

    ticketsData?.forEach((ticket) => {
      if (ticket.status in statusCount) {
        statusCount[ticket.status as keyof typeof statusCount] += 1
      }
    })

    console.log("Ticket status statistics fetched successfully:", statusCount)
    return { data: statusCount, error: null }
  } catch (error) {
    console.error("Error in getTicketStatusStats:", error)
    return { data: null, error: "Error al obtener estadísticas de tickets" }
  }
}

// Formatear números para mostrar
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

// Formatear moneda
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Formatear fecha para mostrar
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
  })
}
