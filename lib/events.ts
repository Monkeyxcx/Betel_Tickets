import { supabase } from "./supabase"

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

// Obtener todos los eventos activos
export async function getActiveEvents(): Promise<{ data: Event[] | null; error: string | null }> {
  try {
    console.log("Fetching active events from Supabase")
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "active")
      .order("event_date", { ascending: true })

    if (error) {
      console.error("Supabase error in getActiveEvents:", error)
      return { data: null, error: error.message }
    }

    console.log("Fetched", data?.length || 0, "active events")
    return { data, error: null }
  } catch (error) {
    console.error("Error in getActiveEvents:", error)
    return { data: null, error: "Error al obtener eventos" }
  }
}

// Obtener eventos destacados
export async function getFeaturedEvents(): Promise<{ data: Event[] | null; error: string | null }> {
  try {
    console.log("Fetching featured events from Supabase")
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "active")
      .eq("featured", true)
      .order("event_date", { ascending: true })
      .limit(6)

    if (error) {
      console.error("Supabase error in getFeaturedEvents:", error)
      return { data: null, error: error.message }
    }

    console.log("Fetched", data?.length || 0, "featured events")
    return { data, error: null }
  } catch (error) {
    console.error("Error in getFeaturedEvents:", error)
    return { data: null, error: "Error al obtener eventos destacados" }
  }
}

// Obtener eventos por categoría
export async function getEventsByCategory(category: string): Promise<{ data: Event[] | null; error: string | null }> {
  try {
    console.log("Fetching events by category from Supabase:", category)
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "active")
      .eq("category", category)
      .order("event_date", { ascending: true })

    if (error) {
      console.error("Supabase error in getEventsByCategory:", error)
      return { data: null, error: error.message }
    }

    console.log("Fetched", data?.length || 0, "events for category", category)
    return { data, error: null }
  } catch (error) {
    console.error("Error in getEventsByCategory:", error)
    return { data: null, error: "Error al obtener eventos por categoría" }
  }
}

// Crear nuevo evento (solo admin)
export async function createEvent(eventData: CreateEventData): Promise<{ data: Event | null; error: string | null }> {
  try {
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
      console.error("Supabase error in createEvent:", error)
      return { data: null, error: error.message }
    }

    console.log("Event created successfully:", data.id)
    return { data, error: null }
  } catch (error) {
    console.error("Error in createEvent:", error)
    return { data: null, error: "Error al crear evento" }
  }
}

// Obtener eventos para panel admin según rol
export async function getAdminEventsForUser(
  userId: string,
  isSuperAdmin: boolean,
): Promise<{ data: Event[] | null; error: string | null }> {
  try {
    console.log("Fetching admin events for user:", userId, "isSuperAdmin:", isSuperAdmin)
    let query = supabase.from("events").select("*").order("event_date", { ascending: true })
    if (!isSuperAdmin) {
      query = query.eq("creator_id", userId)
    }
    const { data, error } = await query
    if (error) {
      console.error("Supabase error in getAdminEventsForUser:", error)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error) {
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
    const { data, error } = await supabase
      .from("events")
      .update({
        ...eventData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select()
      .single()

    if (error) {
      console.error("Supabase error in updateEvent:", error)
      return { data: null, error: error.message }
    }

    console.log("Event updated successfully:", eventId)
    return { data, error: null }
  } catch (error) {
    console.error("Error in updateEvent:", error)
    return { data: null, error: "Error al actualizar evento" }
  }
}

// Eliminar evento
export async function deleteEvent(eventId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    console.log("Deleting event from Supabase:", eventId)
    const { error } = await supabase.from("events").delete().eq("id", eventId)

    if (error) {
      console.error("Supabase error in deleteEvent:", error)
      return { success: false, error: error.message }
    }

    console.log("Event deleted successfully:", eventId)
    return { success: true, error: null }
  } catch (error) {
    console.error("Error in deleteEvent:", error)
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
      console.error("Supabase error in getEventById:", error)
      if (error.code === "PGRST116") {
        return { data: null, error: "Evento no encontrado" }
      }
      return { data: null, error: error.message }
    }

    if (!data) {
      return { data: null, error: "Evento no encontrado" }
    }

    console.log("Event fetched successfully:", data.id)
    return { data, error: null }
  } catch (error) {
    console.error("Error in getEventById:", error)
    return { data: null, error: "Error al obtener evento" }
  }
}
