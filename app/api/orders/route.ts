import { requireAppUser } from "@/app/api/staff/_utils"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function generateTicketCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""

  for (let index = 0; index < 8; index += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

function getAuthenticatedClient(authorizationHeader: string | null) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null
  }

  const accessToken = authorizationHeader.slice("Bearer ".length).trim()
  if (!accessToken) {
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

export async function POST(request: Request) {
  const appUser = await requireAppUser(request.headers.get("authorization"))
  if ("error" in appUser) {
    const status = appUser.error === "Sesion no valida" || appUser.error === "Debes iniciar sesion para continuar" ? 401 : 500
    return NextResponse.json({ error: appUser.error }, { status })
  }

  const supabase = appUser.supabase

  let payload: { ticketTypeId?: string; quantity?: number }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Solicitud no valida" }, { status: 400 })
  }

  const ticketTypeId = payload.ticketTypeId?.trim()
  const quantity = Number(payload.quantity)

  if (!ticketTypeId || !Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Datos de compra no validos" }, { status: 400 })
  }

  try {
    const { data: ticketType, error: ticketTypeError } = await supabase
      .from("ticket_types")
      .select("id, event_id, price, available_quantity, max_quantity")
      .eq("id", ticketTypeId)
      .single()

    if (ticketTypeError || !ticketType) {
      return NextResponse.json({ error: "Tipo de ticket no encontrado" }, { status: 404 })
    }

    const availableQuantity = Number(ticketType.available_quantity ?? 0)
    const maxQuantity = Number(ticketType.max_quantity ?? 0)
    const unitPrice = Number(ticketType.price ?? 0)

    if (maxQuantity > 0 && quantity > maxQuantity) {
      return NextResponse.json({ error: `Solo puedes comprar hasta ${maxQuantity} tickets de este tipo` }, { status: 400 })
    }

    if (availableQuantity < quantity) {
      return NextResponse.json({ error: "No hay suficientes tickets disponibles" }, { status: 400 })
    }

    const totalAmount = unitPrice * quantity

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: appUser.profile.id,
          event_id: ticketType.event_id,
          total_amount: totalAmount,
          status: "completed",
        },
      ])
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Error al crear la orden" }, { status: 500 })
    }

    const ticketsToCreate = Array.from({ length: quantity }, () => ({
      order_id: order.id,
      ticket_type_id: ticketTypeId,
      user_id: appUser.profile.id,
      ticket_code: generateTicketCode(),
      status: "active",
    }))

    const { error: ticketsError } = await supabase.from("tickets").insert(ticketsToCreate)

    if (ticketsError) {
      await supabase.from("orders").delete().eq("id", order.id)
      return NextResponse.json({ error: "Error al crear los tickets" }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from("ticket_types")
      .update({ available_quantity: availableQuantity - quantity })
      .eq("id", ticketTypeId)

    if (updateError) {
      await supabase.from("tickets").delete().eq("order_id", order.id)
      await supabase.from("orders").delete().eq("id", order.id)
      return NextResponse.json({ error: "Error al actualizar la disponibilidad" }, { status: 500 })
    }

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al procesar la compra"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
