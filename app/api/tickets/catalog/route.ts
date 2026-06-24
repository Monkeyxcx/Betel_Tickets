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

export async function GET(request: Request) {
  if (!publicClient) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get("event")

  try {
    if (eventId) {
      const { data: event, error: eventError } = await publicClient.from("events").select("*").eq("id", eventId).single()
      if (eventError) {
        const status = eventError.code === "PGRST116" ? 404 : 500
        return NextResponse.json({ error: eventError.message }, { status })
      }

      const { data: ticketTypes, error: ticketError } = await publicClient
        .from("ticket_types")
        .select("*")
        .eq("event_id", eventId)
        .order("price", { ascending: true })

      if (ticketError) {
        return NextResponse.json({ error: ticketError.message }, { status: 500 })
      }

      return NextResponse.json({ data: { event, ticketTypes: ticketTypes ?? [] } }, { status: 200 })
    }

    const { data: ticketTypes, error: ticketError } = await publicClient
      .from("ticket_types")
      .select("*")
      .gt("available_quantity", 0)
      .order("price", { ascending: true })

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 500 })
    }

    return NextResponse.json({ data: { event: null, ticketTypes: ticketTypes ?? [] } }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener tickets"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
