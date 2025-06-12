import { createClient } from "@supabase/supabase-js"

// Variables de entorno de Supabase - REQUERIDAS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
  )
}

// Cliente principal de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Cliente con service role para operaciones administrativas (solo en servidor)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Función para verificar la conexión
export async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase connection...")
    const { data, error } = await supabase.from("events").select("count").limit(1)

    if (error) {
      console.error("Supabase connection test failed:", error)
      return false
    }

    console.log("✅ Supabase connection test successful")
    return true
  } catch (error) {
    console.error("❌ Supabase connection test error:", error)
    return false
  }
}

// Función para verificar el esquema de la base de datos
export async function checkDatabaseSchema() {
  try {
    console.log("Checking database schema...")

    // Verificar tabla events
    const { data: events, error: eventsError } = await supabase.from("events").select("*").limit(1)

    if (eventsError) {
      console.error("Events table error:", eventsError)
    } else {
      console.log("✅ Events table accessible")
    }

    // Verificar tabla users
    const { data: users, error: usersError } = await supabase.from("users").select("*").limit(1)

    if (usersError) {
      console.error("Users table error:", usersError)
    } else {
      console.log("✅ Users table accessible")
    }

    // Verificar tabla ticket_types
    const { data: ticketTypes, error: ticketTypesError } = await supabase.from("ticket_types").select("*").limit(1)

    if (ticketTypesError) {
      console.error("Ticket_types table error:", ticketTypesError)
    } else {
      console.log("✅ Ticket_types table accessible")
    }

    // Verificar tabla orders
    const { data: orders, error: ordersError } = await supabase.from("orders").select("*").limit(1)

    if (ordersError) {
      console.error("Orders table error:", ordersError)
    } else {
      console.log("✅ Orders table accessible")
    }

    // Verificar tabla tickets
    const { data: tickets, error: ticketsError } = await supabase.from("tickets").select("*").limit(1)

    if (ticketsError) {
      console.error("Tickets table error:", ticketsError)
    } else {
      console.log("✅ Tickets table accessible")
    }

    return true
  } catch (error) {
    console.error("Database schema check error:", error)
    return false
  }
}
