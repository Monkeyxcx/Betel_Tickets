import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface TicketType {
  id: string
  event_id: string
  name: string
  price: number
  description: string
  max_quantity: number
  available_quantity: number
}

export interface Order {
  id: string
  user_id: string
  event_id: string
  total_amount: number
  status: string
  created_at: string
}

export interface Ticket {
  id: string
  order_id: string
  ticket_type_id: string
  user_id: string
  ticket_code: string
  status: string
  created_at: string
  ticket_type?: TicketType
  event?: {
    id: string
    name: string
    event_date: string
    location: string
  }
}

// Obtener tipos de tickets disponibles
export async function getTicketTypes(): Promise<{ data: TicketType[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("ticket_types")
      .select("*")
      .gt("available_quantity", 0)
      .order("price", { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: "Error al obtener tipos de tickets" }
  }
}

// Generar código único de ticket
function generateTicketCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Crear orden y tickets
export async function createOrder(
  userId: string,
  ticketTypeId: string,
  quantity: number,
): Promise<{ data: Order | null; error: string | null }> {
  try {
    // Obtener información del tipo de ticket
    const { data: ticketType, error: ticketTypeError } = await supabase
      .from("ticket_types")
      .select("*, events(*)")
      .eq("id", ticketTypeId)
      .single()

    if (ticketTypeError || !ticketType) {
      return { data: null, error: "Tipo de ticket no encontrado" }
    }

    // Verificar disponibilidad
    if (ticketType.available_quantity < quantity) {
      return { data: null, error: "No hay suficientes tickets disponibles" }
    }

    const totalAmount = ticketType.price * quantity

    // Crear la orden
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: userId,
          event_id: ticketType.event_id,
          total_amount: totalAmount,
          status: "completed", // Por ahora marcamos como completado
        },
      ])
      .select()
      .single()

    if (orderError || !order) {
      return { data: null, error: "Error al crear la orden" }
    }

    // Crear los tickets individuales
    const ticketsToCreate = []
    for (let i = 0; i < quantity; i++) {
      ticketsToCreate.push({
        order_id: order.id,
        ticket_type_id: ticketTypeId,
        user_id: userId,
        ticket_code: generateTicketCode(),
        status: "active",
      })
    }

    const { error: ticketsError } = await supabase.from("tickets").insert(ticketsToCreate)

    if (ticketsError) {
      // Si falla la creación de tickets, eliminar la orden
      await supabase.from("orders").delete().eq("id", order.id)
      return { data: null, error: "Error al crear los tickets" }
    }

    // Actualizar cantidad disponible
    const { error: updateError } = await supabase
      .from("ticket_types")
      .update({
        available_quantity: ticketType.available_quantity - quantity,
      })
      .eq("id", ticketTypeId)

    if (updateError) {
      console.error("Error updating ticket quantity:", updateError)
    }

    return { data: order, error: null }
  } catch (error) {
    return { data: null, error: "Error al procesar la orden" }
  }
}

// Obtener tickets del usuario
export async function getUserTickets(userId: string): Promise<{ data: Ticket[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        ticket_type:ticket_types(*),
        order:orders(*)
      `,
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    // Obtener información del evento para cada ticket
    const ticketsWithEvents = await Promise.all(
      (data || []).map(async (ticket) => {
        const { data: event } = await supabase
          .from("events")
          .select("id, name, event_date, location")
          .eq("id", ticket.ticket_type.event_id)
          .single()

        return {
          ...ticket,
          event,
        }
      }),
    )

    return { data: ticketsWithEvents, error: null }
  } catch (error) {
    return { data: null, error: "Error al obtener tickets" }
  }
}

// Obtener órdenes del usuario
export async function getUserOrders(userId: string): Promise<{ data: Order[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: "Error al obtener órdenes" }
  }
}

// Validar ticket por código
export async function validateTicket(ticketCode: string): Promise<{ data: Ticket | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        ticket_type:ticket_types(*),
        user:users(name, email)
      `,
      )
      .eq("ticket_code", ticketCode)
      .single()

    if (error) {
      return { data: null, error: "Ticket no encontrado" }
    }

    if (data.status !== "active") {
      return { data: null, error: "Ticket ya utilizado o cancelado" }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: "Error al validar ticket" }
  }
}

// Marcar ticket como usado
export async function useTicket(ticketId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from("tickets").update({ status: "used" }).eq("id", ticketId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: "Error al marcar ticket como usado" }
  }
}
