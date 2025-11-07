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

export interface Event {
  id: string
  name: string
  description: string
  event_date: string
  location: string
  image_url?: string
  category?: string
  featured: boolean
  status: "active" | "inactive" | "sold_out"
  creator_id?: string
  created_at: string
  updated_at: string
}

export interface CreateEventData {
  name: string
  description: string
  event_date: string
  location: string
  image_url?: string
  category?: string
  featured?: boolean
  creator_id: string
}

// Marcar eventos pasados como inactivos automáticamente
export async function expirePastEvents(): Promise<void> {
  try {
    const nowIso = new Date().toISOString()
    const { error } = await supabase
      .from("events")
      .update({ status: "inactive" })
      .lt("event_date", nowIso)
      .eq("status", "active")

    if (error) {
      if (!isAbortError(error)) console.error("Supabase error in expirePastEvents:", error)
    }
  } catch (error) {
    if (!isAbortError(error)) console.error("Error in expirePastEvents:", error)
  }
}

// Obtener todos los eventos activos
export async function getActiveEvents(): Promise<{ data: Event[] | null; error: string | null }> {
  try {
    // Asegura que eventos vencidos estén inactivos antes de listar
    await expirePastEvents()
    console.log("Fetching active events from Supabase")
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "active")
      .order("event_date", { ascending: true })

    if (error) {
      if (isAbortError(error)) {
        return { data: [], error: null }
      }
      console.error("Supabase error in getActiveEvents:", error)
      return { data: null, error: error.message }
    }

    console.log("Fetched", data?.length || 0, "active events")
    return { data, error: null }
  } catch (error) {
    if (isAbortError(error)) {
      return { data: [], error: null }
    }
    console.error("Error in getActiveEvents:", error)
    return { data: null, error: "Error al obtener eventos" }
  }
}

// Obtener eventos destacados
export async function getFeaturedEvents(): Promise<{ data: Event[] | null; error: string | null }> {
  try {
    // Asegura que eventos vencidos estén inactivos antes de listar
    await expirePastEvents()
    console.log("Fetching featured events from Supabase")
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "active")
      .eq("featured", true)
      .order("event_date", { ascending: true })
      .limit(6)

    if (error) {
      if (isAbortError(error)) {
        return { data: [], error: null }
      }
      console.error("Supabase error in getFeaturedEvents:", error)
      return { data: null, error: error.message }
    }

    console.log("Fetched", data?.length || 0, "featured events")
    return { data, error: null }
  } catch (error) {
    if (isAbortError(error)) {
      return { data: [], error: null }
    }
    console.error("Error in getFeaturedEvents:", error)
    return { data: null, error: "Error al obtener eventos destacados" }
  }
}

// Obtener eventos por categoría
export async function getEventsByCategory(category: string): Promise<{ data: Event[] | null; error: string | null }> {
  try {
    // Asegura que eventos vencidos estén inactivos antes de listar
    await expirePastEvents()
    console.log("Fetching events by category from Supabase:", category)
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "active")
      .eq("category", category)
      .order("event_date", { ascending: true })

    if (error) {
      if (isAbortError(error)) {
        return { data: [], error: null }
      }
      console.error("Supabase error in getEventsByCategory:", error)
      return { data: null, error: error.message }
    }

    console.log("Fetched", data?.length || 0, "events for category", category)
    return { data, error: null }
  } catch (error) {
    if (isAbortError(error)) {
      return { data: [], error: null }
    }
    console.error("Error in getEventsByCategory:", error)
    return { data: null, error: "Error al obtener eventos por categoría" }
  }
}

// Crear nuevo evento (solo admin)
export async function createEvent(eventData: CreateEventData): Promise<{ data: Event | null; error: string | null }> {
  try {
    // Validación server-side: la fecha del evento no puede ser anterior al día actual
    if (!eventData.event_date) {
      return { data: null, error: "La fecha del evento es obligatoria" }
    }
    let selected = new Date(eventData.event_date)
    if (isNaN(selected.getTime())) {
      selected = new Date(`${eventData.event_date}T00:00:00`)
    }
    if (isNaN(selected.getTime())) {
      return { data: null, error: "Formato de fecha inválido" }
    }
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const selectedDay = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate())
    if (selectedDay < today) {
      return { data: null, error: "La fecha del evento no puede ser anterior al día de creación" }
    }

    console.log("Creating new event in Supabase:", eventData.name)
    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          ...eventData,
          status: "active",
          featured: eventData.featured || false,
        },
      ])
      .select()
      .single()

    if (error) {
      if (!isAbortError(error)) console.error("Supabase error in createEvent:", error)
      return { data: null, error: error.message }
    }

    console.log("Event created successfully:", data.id)
    return { data, error: null }
  } catch (error) {
    if (!isAbortError(error)) console.error("Error in createEvent:", error)
    return { data: null, error: "Error al crear evento" }
  }
}

// Obtener eventos para panel admin según rol
export async function getAdminEventsForUser(
  userId: string,
  isSuperAdmin: boolean,
): Promise<{ data: Event[] | null; error: string | null }> {
  try {
    // Asegura que eventos vencidos estén inactivos antes de listar
    await expirePastEvents()
    console.log("Fetching admin events for user:", userId, "isSuperAdmin:", isSuperAdmin)
    let query = supabase.from("events").select("*").order("event_date", { ascending: true })
    if (!isSuperAdmin) {
      query = query.eq("creator_id", userId)
    }
    const { data, error } = await query
    if (error) {
      if (isAbortError(error)) {
        return { data: [], error: null }
      }
      console.error("Supabase error in getAdminEventsForUser:", error)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error) {
    if (isAbortError(error)) {
      return { data: [], error: null }
    }
    console.error("Error in getAdminEventsForUser:", error)
    return { data: null, error: "Error al obtener eventos de admin" }
  }
}

// Actualizar evento
export async function updateEvent(
  eventId: string,
  eventData: Partial<CreateEventData>,
): Promise<{ data: Event | null; error: string | null }> {
  try {
    console.log("Updating event in Supabase:", eventId)
    // Si la fecha proporcionada es pasada, marca como inactivo
    const payload: any = {
      ...eventData,
      updated_at: new Date().toISOString(),
    }
    if (eventData.event_date) {
      let selected = new Date(eventData.event_date)
      if (isNaN(selected.getTime())) selected = new Date(`${eventData.event_date}T00:00:00`)
      if (!isNaN(selected.getTime())) {
        const now = new Date()
        if (selected < now) {
          payload.status = "inactive"
        } else {
          // Si la fecha es futura o de hoy, reactiva el evento
          payload.status = "active"
        }
      }
    }

    const { data, error } = await supabase
      .from("events")
      .update(payload)
      .eq("id", eventId)
      .select()
      .single()

    if (error) {
      if (!isAbortError(error)) console.error("Supabase error in updateEvent:", error)
      return { data: null, error: error.message }
    }

    console.log("Event updated successfully:", eventId)
    return { data, error: null }
  } catch (error) {
    if (!isAbortError(error)) console.error("Error in updateEvent:", error)
    return { data: null, error: "Error al actualizar evento" }
  }
}

// Eliminar evento
export async function deleteEvent(eventId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    console.log("Deleting event from Supabase:", eventId)
    const { error } = await supabase.from("events").delete().eq("id", eventId)

    if (error) {
      if (!isAbortError(error)) console.error("Supabase error in deleteEvent:", error)
      return { success: false, error: error.message }
    }

    console.log("Event deleted successfully:", eventId)
    return { success: true, error: null }
  } catch (error) {
    if (!isAbortError(error)) console.error("Error in deleteEvent:", error)
    return { success: false, error: "Error al eliminar evento" }
  }
}

// Obtener evento por ID
export async function getEventById(eventId: string): Promise<{ data: Event | null; error: string | null }> {
  try {
    console.log("Fetching event with ID:", eventId)

    // Validar que el ID no esté vacío
    if (!eventId || eventId.trim() === "") {
      return { data: null, error: "ID de evento no válido" }
    }

    const { data, error } = await supabase.from("events").select("*").eq("id", eventId).single()

    if (error) {
      if (!isAbortError(error)) console.error("Supabase error in getEventById:", error)
      if (error.code === "PGRST116") {
        return { data: null, error: "Evento no encontrado" }
      }
      if (isAbortError(error)) {
        return { data: null, error: null }
      }
      return { data: null, error: error.message }
    }

    if (!data) {
      return { data: null, error: "Evento no encontrado" }
    }

    console.log("Event fetched successfully:", data.id)
    return { data, error: null }
  } catch (error) {
    if (isAbortError(error)) {
      return { data: null, error: null }
    }
    console.error("Error in getEventById:", error)
    return { data: null, error: "Error al obtener evento" }
  }
}
