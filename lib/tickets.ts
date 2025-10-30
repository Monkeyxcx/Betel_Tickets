import { supabase } from "./supabase"

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

export interface TicketType {
  id: string
  event_id: string
  name: string
  price: number
  description: string
  max_quantity: number
  available_quantity: number
}

export interface CreateTicketTypeData {
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
    console.log("Fetching available ticket types")
    const { data, error } = await supabase
      .from("ticket_types")
      .select("*")
      .gt("available_quantity", 0)
      .order("price", { ascending: true })

    if (error) {
      if (isAbortError(error)) {
        return { data: [], error: null }
      }
      console.error("Supabase error in getTicketTypes:", error)
      return { data: null, error: error.message }
    }

    console.log("Fetched", data?.length || 0, "ticket types")
    return { data, error: null }
  } catch (error) {
    if (isAbortError(error)) {
      return { data: [], error: null }
    }
    console.error("Error in getTicketTypes:", error)
    return { data: null, error: "Error al obtener tipos de tickets" }
  }
}

// Obtener tipos de tickets por evento específico
export async function getTicketTypesByEvent(
  eventId: string,
): Promise<{ data: TicketType[] | null; error: string | null }> {
  try {
    console.log("Fetching ticket types for event:", eventId)
    const { data, error } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("event_id", eventId)
      .order("price", { ascending: true })

    if (error) {
      if (isAbortError(error)) {
        return { data: [], error: null }
      }
      console.error("Supabase error in getTicketTypesByEvent:", error)
      return { data: null, error: error.message }
    }

    console.log("Fetched", data?.length || 0, "ticket types for event", eventId)
    return { data, error: null }
  } catch (error) {
    if (isAbortError(error)) {
      return { data: [], error: null }
    }
    console.error("Error in getTicketTypesByEvent:", error)
    return { data: null, error: "Error al obtener tipos de tickets del evento" }
  }
}

// Crear nuevo tipo de ticket
export async function createTicketType(
  ticketData: CreateTicketTypeData,
): Promise<{ data: TicketType | null; error: string | null }> {
  try {
    console.log("Creating ticket type:", ticketData.name)
    const { data, error } = await supabase.from("ticket_types").insert([ticketData]).select().single()

    if (error) {
      console.error("Supabase error in createTicketType:", error)
      return { data: null, error: error.message }
    }

    console.log("Ticket type created successfully:", data.id)
    return { data, error: null }
  } catch (error) {
    console.error("Error in createTicketType:", error)
    return { data: null, error: "Error al crear tipo de ticket" }
  }
}

// Actualizar tipo de ticket
export async function updateTicketType(
  ticketId: string,
  ticketData: Partial<CreateTicketTypeData>,
): Promise<{ data: TicketType | null; error: string | null }> {
  try {
    console.log("Updating ticket type:", ticketId)
    const { data, error } = await supabase.from("ticket_types").update(ticketData).eq("id", ticketId).select().single()

    if (error) {
      console.error("Supabase error in updateTicketType:", error)
      return { data: null, error: error.message }
    }

    console.log("Ticket type updated successfully:", ticketId)
    return { data, error: null }
  } catch (error) {
    console.error("Error in updateTicketType:", error)
    return { data: null, error: "Error al actualizar tipo de ticket" }
  }
}

// Eliminar tipo de ticket
export async function deleteTicketType(ticketId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    console.log("Deleting ticket type:", ticketId)
    const { error } = await supabase.from("ticket_types").delete().eq("id", ticketId)

    if (error) {
      console.error("Supabase error in deleteTicketType:", error)
      return { success: false, error: error.message }
    }

    console.log("Ticket type deleted successfully:", ticketId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Error in deleteTicketType:", error)
    return { success: false, error: "Error al eliminar tipo de ticket" }
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
    console.log("Creating order for user:", userId, "ticket type:", ticketTypeId, "quantity:", quantity)

    // Obtener información del tipo de ticket
    const { data: ticketType, error: ticketTypeError } = await supabase
      .from("ticket_types")
      .select("*, events(*)")
      .eq("id", ticketTypeId)
      .single()

    if (ticketTypeError || !ticketType) {
      if (!isAbortError(ticketTypeError)) console.error("Error fetching ticket type:", ticketTypeError)
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
      if (!isAbortError(orderError)) console.error("Error creating order:", orderError)
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
      if (!isAbortError(ticketsError)) console.error("Error creating tickets:", ticketsError)
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
      if (!isAbortError(updateError)) console.error("Error updating ticket quantity:", updateError)
    }

    console.log("Order created successfully:", order.id)
    return { data: order, error: null }
  } catch (error) {
    if (!isAbortError(error)) console.error("Error in createOrder:", error)
    return { data: null, error: "Error al procesar la orden" }
  }
}

// Obtener tickets del usuario
export async function getUserTickets(userId: string): Promise<{ data: Ticket[] | null; error: string | null }> {
  try {
    console.log("Fetching tickets for user:", userId)
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
      if (isAbortError(error)) {
        return { data: [], error: null }
      }
      console.error("Supabase error in getUserTickets:", error)
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

    console.log("Fetched", ticketsWithEvents.length, "tickets for user", userId)
    return { data: ticketsWithEvents, error: null }
  } catch (error) {
    if (isAbortError(error)) {
      return { data: [], error: null }
    }
    console.error("Error in getUserTickets:", error)
    return { data: null, error: "Error al obtener tickets" }
  }
}

// Obtener órdenes del usuario
export async function getUserOrders(userId: string): Promise<{ data: Order[] | null; error: string | null }> {
  try {
    console.log("Fetching orders for user:", userId)
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      if (isAbortError(error)) {
        return { data: [], error: null }
      }
      console.error("Supabase error in getUserOrders:", error)
      return { data: null, error: error.message }
    }

    console.log("Fetched", data?.length || 0, "orders for user", userId)
    return { data, error: null }
  } catch (error) {
    if (isAbortError(error)) {
      return { data: [], error: null }
    }
    console.error("Error in getUserOrders:", error)
    return { data: null, error: "Error al obtener órdenes" }
  }
}

// Validar ticket por código
export async function validateTicket(ticketCode: string): Promise<{ data: Ticket | null; error: string | null }> {
  try {
    console.log("Validating ticket:", ticketCode)
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
      if (!isAbortError(error)) console.error("Supabase error in validateTicket:", error)
      return { data: null, error: "Ticket no encontrado" }
    }

    if (data.status !== "active") {
      return { data: null, error: "Ticket ya utilizado o cancelado" }
    }

    console.log("Ticket validated successfully:", ticketCode)
    return { data, error: null }
  } catch (error) {
    if (!isAbortError(error)) console.error("Error in validateTicket:", error)
    return { data: null, error: "Error al validar ticket" }
  }
}

// Marcar ticket como usado
export async function useTicket(ticketId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    console.log("Marking ticket as used:", ticketId)
    const { error } = await supabase.from("tickets").update({ status: "used" }).eq("id", ticketId)

    if (error) {
      if (!isAbortError(error)) console.error("Supabase error in useTicket:", error)
      return { success: false, error: error.message }
    }

    console.log("Ticket marked as used successfully:", ticketId)
    return { success: true, error: null }
  } catch (error) {
    if (!isAbortError(error)) console.error("Error in useTicket:", error)
    return { success: false, error: "Error al marcar ticket como usado" }
  }
}
