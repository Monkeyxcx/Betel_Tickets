import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabaseAdmin } from "@/lib/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const publicEventsClient =
  supabaseAdmin ||
  (supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null)

export async function GET() {
  if (!publicEventsClient) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 })
  }

  try {
    const nowIso = new Date().toISOString()
    const { data, error } = await publicEventsClient
      .from("events")
      .select("*")
      .eq("status", "active")
      .gte("event_date", nowIso)
      .order("event_date", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener eventos"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
