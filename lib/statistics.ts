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

// Detect browser/network aborted fetches to avoid noisy logging
function isAbortError(err: unknown): boolean {
  if (!err) return false
  const anyErr = err as any
  const msg = typeof anyErr?.message === "string" ? anyErr.message : ""
  const name = typeof anyErr?.name === "string" ? anyErr.name : ""
  return (
    name === "AbortError" ||
    msg.includes("AbortError") ||
    msg.toLowerCase().includes("aborted") ||
    msg.toLowerCase().includes("the operation was aborted")
  )
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
      if (!isAbortError(ticketsError)) console.error("Error fetching tickets count:", ticketsError)
    }

    // Obtener total de eventos
    const { count: totalEvents, error: eventsError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })

    if (eventsError) {
      if (!isAbortError(eventsError)) console.error("Error fetching events count:", eventsError)
    }

    // Obtener total de usuarios
    const { count: totalUsers, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (usersError) {
      if (!isAbortError(usersError)) console.error("Error fetching users count:", usersError)
    }

    // Obtener eventos activos
    const { count: activeEvents, error: activeEventsError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    if (activeEventsError) {
      if (!isAbortError(activeEventsError))
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
      if (!isAbortError(upcomingEventsError))
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
    } else if (ordersError) {
      if (!isAbortError(ordersError)) console.error("Error fetching orders for revenue:", ordersError)
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
    if (!isAbortError(error)) console.error("Error in getPlatformStatistics:", error)
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
      if (isAbortError(ordersError)) {
        // Silent abort: return empty series without error
        return { data: [], error: null }
      }
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
    if (isAbortError(error)) {
      return { data: [], error: null }
    }
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
      if (isAbortError(ticketsError)) {
        return { data: [], error: null }
      }
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
    if (isAbortError(error)) {
      return { data: [], error: null }
    }
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
      if (isAbortError(error)) {
        return { data: [], error: null }
      }
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
    if (isAbortError(error)) {
      return { data: [], error: null }
    }
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
      if (isAbortError(ticketsError)) {
        return { data: { active: 0, used: 0, cancelled: 0 }, error: null }
      }
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
    if (isAbortError(error)) {
      return { data: { active: 0, used: 0, cancelled: 0 }, error: null }
    }
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

// Coordinator-specific statistics functions
export async function getCoordinatorPlatformStatistics(creatorId: string) {
  // Obtener eventos del coordinador
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id")
    .eq("creator_id", creatorId)

  if (eventsError) {
    if (!isAbortError(eventsError)) console.error("Error fetching coordinator events:", eventsError)
    return { totalEvents: 0, totalTickets: 0, totalRevenue: 0, soldTickets: 0, availableTickets: 0 }
  }

  const eventIds = (events || []).map((e) => e.id)

  // Obtener tipos de tickets de esos eventos
  let totalTickets = 0
  let availableTickets = 0

  if (eventIds.length > 0) {
    const { data: types, error: typesError } = await supabase
      .from("ticket_types")
      .select("event_id, max_quantity, available_quantity")
      .in("event_id", eventIds)

    if (!typesError && types) {
      totalTickets = types.reduce((sum, t) => sum + (t.max_quantity || 0), 0)
      availableTickets = types.reduce((sum, t) => sum + (t.available_quantity || 0), 0)
    } else if (typesError) {
      if (!isAbortError(typesError)) console.error("Error fetching ticket types:", typesError)
    }
  }

  const soldTickets = Math.max(totalTickets - availableTickets, 0)

  // Ingresos: sumar órdenes completadas de esos eventos
  let totalRevenue = 0
  if (eventIds.length > 0) {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("total_amount, event_id, status")
      .in("event_id", eventIds)
      .eq("status", "completed")

    if (!ordersError && orders) {
      totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    } else if (ordersError) {
      if (!isAbortError(ordersError)) console.error("Error fetching orders for revenue:", ordersError)
    }
  }

  return {
    totalEvents: events?.length || 0,
    totalTickets,
    totalRevenue,
    soldTickets,
    availableTickets,
  }
}

export async function getCoordinatorDailySalesStatistics(creatorId: string, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id")
    .eq("creator_id", creatorId)

  if (eventsError) {
    if (!isAbortError(eventsError)) console.error("Error fetching coordinator events for sales:", eventsError)
    return []
  }

  const eventIds = (events || []).map((e) => e.id)

  const dailyStats = new Map<string, { date: string; sales: number; revenue: number }>()
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    dailyStats.set(dateStr, { date: dateStr, sales: 0, revenue: 0 })
  }

  if (eventIds.length > 0) {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("created_at, total_amount, event_id, status")
      .in("event_id", eventIds)
      .eq("status", "completed")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    if (!ordersError && orders) {
      orders.forEach((order) => {
        const dateStr = new Date(order.created_at).toISOString().split("T")[0]
        const stat = dailyStats.get(dateStr)
        if (stat) {
          stat.sales += 1
          stat.revenue += order.total_amount || 0
        }
      })
    } else if (ordersError) {
      if (!isAbortError(ordersError)) console.error("Error fetching coordinator orders:", ordersError)
    }
  }

  return Array.from(dailyStats.values()).reverse()
}

export async function getCoordinatorDailyTicketsStatistics(creatorId: string, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id")
    .eq("creator_id", creatorId)

  if (eventsError) {
    if (!isAbortError(eventsError)) console.error("Error fetching events for ticket activity:", eventsError)
    return []
  }

  const eventIds = Array.isArray(events) ? events.map((e) => e.id) : []

  // Inicializar mapa de días
  const dailyStats = new Map<string, { date: string; created: number; sold: number; scanned: number }>()
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    dailyStats.set(dateStr, { date: dateStr, created: 0, sold: 0, scanned: 0 })
  }

  if (eventIds.length > 0) {
    // Obtener tipos de tickets para mapear a tickets
    const { data: types, error: typesError } = await supabase
      .from("ticket_types")
      .select("id, event_id")
      .in("event_id", eventIds)

    if (!typesError && Array.isArray(types) && types.length > 0) {
      const typeIds = types.map((t) => t.id)
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("created_at, status, ticket_type_id")
        .in("ticket_type_id", typeIds)
        .gte("created_at", startDate.toISOString())

      if (!ticketsError && tickets) {
        tickets.forEach((ticket) => {
          const dateStr = new Date(ticket.created_at).toISOString().split("T")[0]
          const stat = dailyStats.get(dateStr)
          if (stat) {
            stat.created += 1
            if (ticket.status === "active") stat.sold += 1
            if (ticket.status === "used") stat.scanned += 1
          }
        })
      } else if (ticketsError) {
        if (!isAbortError(ticketsError)) console.error("Error fetching tickets for activity:", ticketsError)
      }
    } else if (typesError) {
      if (!isAbortError(typesError)) console.error("Error fetching ticket types for activity:", typesError)
    }
  }

  return Array.from(dailyStats.values()).reverse()
}

export async function getCoordinatorEventCategoryStats(creatorId: string) {
  // Obtener eventos con categoría del coordinador
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, category")
    .eq("creator_id", creatorId)

  if (eventsError) {
    if (!isAbortError(eventsError)) console.error("Error fetching events for categories:", eventsError)
    return []
  }

  const categoryStats = new Map<string, { category: string; events: number; tickets: number; sold: number }>()
  const eventIds = Array.isArray(events) ? events.map((e) => e.id) : []

  // Inicializar eventos por categoría
  if (Array.isArray(events)) {
    events.forEach((evt) => {
      const cat = evt.category || "Sin categoría"
      const existing = categoryStats.get(cat) || { category: cat, events: 0, tickets: 0, sold: 0 }
      existing.events += 1
      categoryStats.set(cat, existing)
    })
  }

  // Obtener tipos de tickets y acumular por categoría
  if (eventIds.length > 0) {
    const { data: types, error: typesError } = await supabase
      .from("ticket_types")
      .select("event_id, max_quantity, available_quantity")
      .in("event_id", eventIds)

    if (!typesError && Array.isArray(types)) {
      const eventToCategory = new Map<string, string>()
      if (Array.isArray(events)) {
        events.forEach((e) => eventToCategory.set(e.id, e.category || "Sin categoría"))
      }

      types.forEach((t) => {
        const cat = eventToCategory.get(t.event_id) || "Sin categoría"
        const existing = categoryStats.get(cat) || { category: cat, events: 0, tickets: 0, sold: 0 }
        existing.tickets += t.max_quantity || 0
        existing.sold += Math.max((t.max_quantity || 0) - (t.available_quantity || 0), 0)
        categoryStats.set(cat, existing)
      })
    } else if (typesError) {
      if (!isAbortError(typesError)) console.error("Error fetching ticket types for categories:", typesError)
    }
  }

  return Array.from(categoryStats.values())
}

export async function getCoordinatorTicketStatusStats(creatorId: string) {
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id")
    .eq("creator_id", creatorId)

  if (eventsError) {
    if (!isAbortError(eventsError)) console.error("Error fetching events for status stats:", eventsError)
    return []
  }

  const eventIds = Array.isArray(events) ? events.map((e) => e.id) : []
  if (eventIds.length === 0) return []

  const { data: types, error: typesError } = await supabase
    .from("ticket_types")
    .select("id, event_id")
    .in("event_id", eventIds)

  if (typesError || !Array.isArray(types) || types.length === 0) {
    if (typesError && !isAbortError(typesError)) console.error("Error fetching ticket types for status stats:", typesError)
    return []
  }

  const typeIds = Array.isArray(types) ? types.map((t) => t.id) : []
  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .select("status, ticket_type_id")
    .in("ticket_type_id", typeIds)

  if (ticketsError) {
    if (!isAbortError(ticketsError)) console.error("Error fetching tickets for status stats:", ticketsError)
    return []
  }

  const statusStats = new Map<string, number>();
  (tickets || []).forEach((t) => {
    const s = t.status || "unknown"
    statusStats.set(s, (statusStats.get(s) || 0) + 1)
  })

  return Array.from(statusStats.entries()).map(([status, count]) => ({ status, count }))
}
