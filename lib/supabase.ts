import { createClient } from "@supabase/supabase-js"

// Verificar que las variables de entorno estén disponibles
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not defined")
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined")
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Key (first 10 chars):", supabaseAnonKey?.substring(0, 10) + "...")

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Función para verificar la conexión
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("users").select("count").limit(1)
    if (error) {
      console.error("Supabase connection test failed:", error)
      return false
    }
    console.log("Supabase connection test successful")
    return true
  } catch (error) {
    console.error("Supabase connection test error:", error)
    return false
  }
}
