import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabaseAdmin } from "@/lib/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const publicClient =
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

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  if (!publicClient) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 })
  }

  const { id } = await context.params
  if (!id?.trim()) {
    return NextResponse.json({ error: "ID de evento no válido" }, { status: 400 })
  }

  try {
    const { data: event, error: eventError } = await publicClient.from("events").select("*").eq("id", id).single()
    if (eventError) {
      const status = eventError.code === "PGRST116" ? 404 : 500
      return NextResponse.json({ error: eventError.message }, { status })
    }

    const { data: ticketTypes, error: ticketsError } = await publicClient
      .from("ticket_types")
      .select("*")
      .eq("event_id", id)
      .order("price", { ascending: true })

    if (ticketsError) {
      return NextResponse.json({ error: ticketsError.message }, { status: 500 })
    }

    return NextResponse.json({ data: { event, ticketTypes: ticketTypes ?? [] } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener el evento"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
