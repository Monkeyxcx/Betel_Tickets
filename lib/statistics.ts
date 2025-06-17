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

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Mock data for development
const mockStats: PlatformStats = {
  total_tickets_sold: 50000,
  total_events: 1200,
  total_users: 25000,
  total_revenue: 2500000,
  active_events: 5,
  upcoming_events: 15,
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

// Obtener estadísticas por categoría de eventos
export async function getEventCategoryStats(): Promise<{
  data: Array<{ category: string; count: number }> | null
  error: string | null
}> {
  if (!isSupabaseConfigured()) {
    const mockCategoryStats = [
      { category: "musica", count: 450 },
      { category: "teatro", count: 320 },
      { category: "deportes", count: 280 },
      { category: "conferencia", count: 150 },
      { category: "cristiano", count: 180 },
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

// Obtener estadísticas de ventas por mes (últimos 6 meses)
export async function getSalesStatistics(): Promise<{
  data: Array<{ month: string; sales: number; revenue: number }> | null
  error: string | null
}> {
  if (!isSupabaseConfigured()) {
    const mockSalesStats = [
      { month: "Enero", sales: 1200, revenue: 120000 },
      { month: "Febrero", sales: 1500, revenue: 150000 },
      { month: "Marzo", sales: 1800, revenue: 180000 },
      { month: "Abril", sales: 2100, revenue: 210000 },
      { month: "Mayo", sales: 1900, revenue: 190000 },
      { month: "Junio", sales: 2300, revenue: 230000 },
    ]
    return { data: mockSalesStats, error: null }
  }

  try {
    console.log("Fetching sales statistics")

    // Obtener órdenes de los últimos 6 meses
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("created_at, total_amount")
      .eq("status", "completed")
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at", { ascending: true })

    if (ordersError) {
      console.error("Error fetching sales data:", ordersError)
      return { data: null, error: ordersError.message }
    }

    // Agrupar por mes
    const monthlyStats: { [key: string]: { sales: number; revenue: number } } = {}
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]

    ordersData?.forEach((order) => {
      const date = new Date(order.created_at)
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { sales: 0, revenue: 0 }
      }

      monthlyStats[monthKey].sales += 1
      monthlyStats[monthKey].revenue += order.total_amount || 0
    })

    const salesStats = Object.entries(monthlyStats).map(([month, stats]) => ({
      month,
      sales: stats.sales,
      revenue: stats.revenue,
    }))

    console.log("Sales statistics fetched successfully:", salesStats)
    return { data: salesStats, error: null }
  } catch (error) {
    console.error("Error in getSalesStatistics:", error)
    return { data: null, error: "Error al obtener estadísticas de ventas" }
  }
}

// Obtener estadísticas de tickets por estado
export async function getTicketStatusStats(): Promise<{
  data: { active: number; used: number; cancelled: number } | null
  error: string | null
}> {
  if (!isSupabaseConfigured()) {
    const mockTicketStats = {
      active: 15000,
      used: 32000,
      cancelled: 3000,
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
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
