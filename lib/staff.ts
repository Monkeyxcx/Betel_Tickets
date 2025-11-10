import { supabase } from "./supabase"
import type { User } from "./auth"

export interface StaffMember {
  id: string
  user_id: string
  event_id: string
  permissions: string[]
  assigned_by: string
  created_at: string
  user?: User
  event?: {
    id: string
    name: string
    event_date: string
  }
}

export interface TicketScan {
  id: string
  ticket_id: string
  scanned_by: string
  scanned_at: string
  scan_location?: string
  device_info?: string
  scan_result: "success" | "already_used" | "invalid"
  ticket?: {
    ticket_code: string
    status: string
    user?: {
      name: string
      email: string
    }
    event?: {
      name: string
    }
  }
}

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Obtener todos los usuarios para asignar como staff
export async function getAllUsers(): Promise<{ data: User[] | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    const mockUsers: User[] = [
      { id: "user-1", email: "user1@example.com", name: "Usuario 1", role: "user" },
      { id: "user-2", email: "user2@example.com", name: "Usuario 2", role: "user" },
      { id: "staff-1", email: "staff@example.com", name: "Personal del Evento", role: "staff" },
    ]
    return { data: mockUsers, error: null }
  }

  try {
    console.log("Fetching all users")
    const { data, error } = await supabase.from("users").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching users:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error in getAllUsers:", error)
    return { data: null, error: "Error al obtener usuarios" }
  }
}

// Obtener usuarios con paginación y búsqueda
export async function getUsers(options?: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ data: User[] | null; error: string | null; count: number }> {
  const limit = options?.limit ?? 10
  const offset = options?.offset ?? 0
  const search = (options?.search ?? "").trim()

  if (!isSupabaseConfigured()) {
    // Modo desarrollo: usar mock y aplicar filtro + paginación en memoria
    const mockUsers: User[] = [
      { id: "user-1", email: "user1@example.com", name: "Usuario 1", role: "user" },
      { id: "user-2", email: "user2@example.com", name: "Usuario 2", role: "user" },
      { id: "staff-1", email: "staff@example.com", name: "Personal del Evento", role: "staff" },
      { id: "admin-1", email: "admin@example.com", name: "admin", role: "admin" },
      { id: "coord-1", email: "coord@example.com", name: "Coordinador", role: "coordinator" },
      { id: "qa-1", email: "qa@qa.com", name: "QA", role: "user" },
      { id: "qa-2", email: "qa2@qa.com", name: "QA2", role: "user" },
      { id: "qa-3", email: "qa3@qa.com", name: "QA3", role: "user" },
      { id: "user-3", email: "user3@example.com", name: "Usuario 3", role: "user" },
      { id: "user-4", email: "user4@example.com", name: "Usuario 4", role: "user" },
      { id: "user-5", email: "user5@example.com", name: "Usuario 5", role: "user" },
      { id: "user-6", email: "user6@example.com", name: "Usuario 6", role: "user" },
    ]
    const filtered = search
      ? mockUsers.filter(
          (u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()),
        )
      : mockUsers
    const count = filtered.length
    const sliced = filtered.slice(offset, offset + limit)
    return { data: sliced, error: null, count }
  }

  try {
    console.log("Fetching users with pagination", { search, limit, offset })
    let query = supabase
      .from("users")
      .select("*", { count: "exact" })
      .order("name", { ascending: true })

    if (search) {
      const q = `%${search}%`
      // Buscar por nombre o email
      query = query.or(`name.ilike.${q},email.ilike.${q}`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching users (paginated):", error)
      return { data: null, error: error.message, count: 0 }
    }

    return { data: data || [], error: null, count: count ?? (data?.length || 0) }
  } catch (error) {
    console.error("Error in getUsers:", error)
    return { data: null, error: "Error al obtener usuarios", count: 0 }
  }
}

// Asignar staff a un evento
export async function assignStaffToEvent(
  userId: string,
  eventId: string,
  permissions: string[] = ["scan_tickets"],
  assignedBy: string,
): Promise<{ data: StaffMember | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: "Funcionalidad no disponible en modo desarrollo" }
  }

  try {
    console.log("Assigning staff to event:", userId, eventId)

    const { data, error } = await supabase
      .from("staff_members")
      .insert([
        {
          user_id: userId,
          event_id: eventId,
          permissions,
          assigned_by: assignedBy,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error assigning staff:", error)
      return { data: null, error: error.message }
    }

    console.log("Staff assigned successfully")
    return { data, error: null }
  } catch (error) {
    console.error("Error in assignStaffToEvent:", error)
    return { data: null, error: "Error al asignar staff" }
  }
}

// Obtener staff de un evento
export async function getEventStaff(eventId: string): Promise<{ data: StaffMember[] | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null }
  }

  try {
    console.log("Fetching staff for event:", eventId)
    // Evitar joins anidados: traer staff simple y enriquecer con usuarios/evento
    const { data: staffRows, error: staffError } = await supabase
      .from("staff_members")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })

    if (staffError) {
      console.error("Error fetching event staff:", staffError)
      // Devolver lista vacía para no romper la UI
      return { data: [], error: null }
    }

    const userIds = Array.from(new Set((staffRows || []).map((r: any) => r.user_id))).filter(Boolean)

    const [usersRes, eventRes] = await Promise.all([
      userIds.length
        ? supabase.from("users").select("id, name, email").in("id", userIds)
        : Promise.resolve({ data: [], error: null } as any),
      supabase.from("events").select("id, name, event_date").eq("id", eventId).single(),
    ])

    const usersData = (usersRes as any)?.data || []
    const eventData = (eventRes as any)?.data || null
    const userMap = new Map<string, { id: string; name: string; email: string }>()
    usersData.forEach((u: any) => userMap.set(u.id, u))

    const enriched = (staffRows || []).map((r: any) => ({
      ...r,
      user: userMap.get(r.user_id),
      event: eventData ? { id: eventData.id, name: eventData.name, event_date: eventData.event_date } : undefined,
    }))

    return { data: enriched, error: null }
  } catch (error) {
    console.error("Error in getEventStaff:", error)
    return { data: null, error: "Error al obtener staff del evento" }
  }
}

// Remover staff de un evento
export async function removeStaffFromEvent(staffId: string): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Funcionalidad no disponible en modo desarrollo" }
  }

  try {
    console.log("Removing staff:", staffId)

    const { error } = await supabase.from("staff_members").delete().eq("id", staffId)

    if (error) {
      console.error("Error removing staff:", error)
      return { success: false, error: error.message }
    }

    console.log("Staff removed successfully")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error in removeStaffFromEvent:", error)
    return { success: false, error: "Error al remover staff" }
  }
}

// Escanear ticket (función principal para staff)
export async function scanTicket(
  ticketCode: string,
  scannedBy: string,
  scanLocation?: string,
  deviceInfo?: string,
): Promise<{ data: TicketScan | null; error: string | null; ticket?: any }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: "Funcionalidad no disponible en modo desarrollo" }
  }

  try {
    console.log("Scanning ticket:", ticketCode)

    // Primero verificar que el ticket existe y está activo
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        *,
        ticket_type:ticket_types(*),
        user:users(name, email),
        order:orders(*)
      `)
      .eq("ticket_code", ticketCode)
      .single()

    if (ticketError || !ticket) {
      console.error("Ticket not found:", ticketError)

      // Registrar intento fallido
      const { data: scanRecord } = await supabase
        .from("ticket_scans")
        .insert([
          {
            ticket_id: null,
            scanned_by: scannedBy,
            scan_location: scanLocation,
            device_info: deviceInfo,
            scan_result: "invalid",
          },
        ])
        .select()
        .single()

      return {
        data: scanRecord,
        error: "Ticket no encontrado o inválido",
        ticket: null,
      }
    }

    // Verificar si el ticket ya fue usado
    if (ticket.status === "used") {
      // Registrar intento de re-escaneo
      const { data: scanRecord } = await supabase
        .from("ticket_scans")
        .insert([
          {
            ticket_id: ticket.id,
            scanned_by: scannedBy,
            scan_location: scanLocation,
            device_info: deviceInfo,
            scan_result: "already_used",
          },
        ])
        .select()
        .single()

      return {
        data: scanRecord,
        error: "Ticket ya fue utilizado",
        ticket,
      }
    }

    // Verificar si el ticket está activo
    if (ticket.status !== "active") {
      const { data: scanRecord } = await supabase
        .from("ticket_scans")
        .insert([
          {
            ticket_id: ticket.id,
            scanned_by: scannedBy,
            scan_location: scanLocation,
            device_info: deviceInfo,
            scan_result: "invalid",
          },
        ])
        .select()
        .single()

      return {
        data: scanRecord,
        error: "Ticket no está activo",
        ticket,
      }
    }

    // Marcar ticket como usado
    const { error: updateError } = await supabase.from("tickets").update({ status: "used" }).eq("id", ticket.id)

    if (updateError) {
      console.error("Error updating ticket status:", updateError)
      return { data: null, error: "Error al procesar ticket" }
    }

    // Registrar escaneo exitoso
    const { data: scanRecord, error: scanError } = await supabase
      .from("ticket_scans")
      .insert([
        {
          ticket_id: ticket.id,
          scanned_by: scannedBy,
          scan_location: scanLocation,
          device_info: deviceInfo,
          scan_result: "success",
        },
      ])
      .select()
      .single()

    if (scanError) {
      console.error("Error recording scan:", scanError)
    }

    console.log("Ticket scanned successfully:", ticketCode)
    return {
      data: scanRecord,
      error: null,
      ticket: {
        ...ticket,
        status: "used",
      },
    }
  } catch (error) {
    console.error("Error in scanTicket:", error)
    return { data: null, error: "Error al escanear ticket" }
  }
}

// Obtener historial de escaneos
export async function getScanHistory(
  eventId?: string,
  scannedBy?: string,
  limit = 50,
): Promise<{ data: TicketScan[] | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null }
  }

  try {
    console.log("Fetching scan history")

    let query = supabase
      .from("ticket_scans")
      .select(`
        *,
        ticket:tickets(
          ticket_code,
          status,
          user:users(name, email),
          ticket_type:ticket_types(
            event:events(name)
          )
        )
      `)
      .order("scanned_at", { ascending: false })
      .limit(limit)

    if (scannedBy) {
      query = query.eq("scanned_by", scannedBy)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching scan history:", error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error("Error in getScanHistory:", error)
    return { data: null, error: "Error al obtener historial de escaneos" }
  }
}

// Obtener conteo de escaneos por staff para un evento
export async function getEventScanCountsByStaff(eventId: string): Promise<{
  data:
    | Array<{
        staff_id: string
        success: number
        already_used: number
        invalid: number
        total: number
      }>
    | null
  error: string | null
}> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null }
  }

  try {
    console.log("Fetching scan counts by staff for event:", eventId)
    // Obtener IDs de tipos de tickets del evento
    const { data: types, error: typesError } = await supabase
      .from("ticket_types")
      .select("id")
      .eq("event_id", eventId)

    if (typesError) {
      console.error("Error fetching ticket types (counts):", typesError)
      return { data: null, error: typesError.message }
    }

    const typeIds = (types || []).map((t: any) => t.id)
    if (typeIds.length === 0) {
      return { data: [], error: null }
    }

    // Obtener IDs de tickets del evento
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("id")
      .in("ticket_type_id", typeIds)

    if (ticketsError) {
      console.error("Error fetching tickets (counts):", ticketsError)
      return { data: null, error: ticketsError.message }
    }

    const ticketIds = (tickets || []).map((t: any) => t.id)
    if (ticketIds.length === 0) {
      return { data: [], error: null }
    }

    // Traer escaneos para esos tickets
    const { data: scans, error: scansError } = await supabase
      .from("ticket_scans")
      .select("scanned_by, scan_result, ticket_id")
      .in("ticket_id", ticketIds)

    if (scansError) {
      console.error("Error fetching scans (counts):", scansError)
      return { data: null, error: scansError.message }
    }

    // Agregar por staff_id y tipo de resultado
    const counts = new Map<
      string,
      { staff_id: string; success: number; already_used: number; invalid: number; total: number }
    >();

    (scans || []).forEach((scan: any) => {
      const staffId = scan.scanned_by as string
      const result = scan.scan_result as "success" | "already_used" | "invalid"
      const current =
        counts.get(staffId) || { staff_id: staffId, success: 0, already_used: 0, invalid: 0, total: 0 }

      if (result === "success") current.success += 1
      else if (result === "already_used") current.already_used += 1
      else if (result === "invalid") current.invalid += 1
      current.total += 1

      counts.set(staffId, current)
    })

    return { data: Array.from(counts.values()), error: null }
  } catch (error) {
    console.error("Error in getEventScanCountsByStaff:", error)
    return { data: null, error: "Error al obtener métricas por staff" }
  }
}

// Obtener estadísticas de escaneos para un evento
export async function getEventScanStats(eventId: string): Promise<{
  data: {
    total_tickets: number
    scanned_tickets: number
    pending_tickets: number
    scan_rate: number
  } | null
  error: string | null
}> {
  if (!isSupabaseConfigured()) {
    return {
      data: {
        total_tickets: 0,
        scanned_tickets: 0,
        pending_tickets: 0,
        scan_rate: 0,
      },
      error: null,
    }
  }

  try {
    console.log("Fetching scan stats for event:", eventId)
    // Obtener IDs de tipos de tickets del evento
    const { data: types, error: typesError } = await supabase
      .from("ticket_types")
      .select("id")
      .eq("event_id", eventId)

    if (typesError) {
      console.error("Error fetching ticket types:", typesError)
      return { data: null, error: typesError.message }
    }

    const typeIds = (types || []).map((t: any) => t.id)

    let total = 0
    let scanned = 0

    if (typeIds.length > 0) {
      // Total de tickets del evento
      const { data: totalTickets, error: totalError } = await supabase
        .from("tickets")
        .select("id")
        .in("ticket_type_id", typeIds)

      if (totalError) {
        console.error("Error fetching total tickets:", totalError)
        return { data: null, error: totalError.message }
      }

      // Tickets escaneados (status used)
      const { data: scannedTickets, error: scannedError } = await supabase
        .from("tickets")
        .select("id")
        .in("ticket_type_id", typeIds)
        .eq("status", "used")

      if (scannedError) {
        console.error("Error fetching scanned tickets:", scannedError)
        return { data: null, error: scannedError.message }
      }

      total = totalTickets?.length || 0
      scanned = scannedTickets?.length || 0
    }

    const pending = total - scanned
    const scanRate = total > 0 ? (scanned / total) * 100 : 0

    return {
      data: {
        total_tickets: total,
        scanned_tickets: scanned,
        pending_tickets: pending,
        scan_rate: Math.round(scanRate * 100) / 100,
      },
      error: null,
    }
  } catch (error) {
    console.error("Error in getEventScanStats:", error)
    return { data: null, error: "Error al obtener estadísticas" }
  }
}
