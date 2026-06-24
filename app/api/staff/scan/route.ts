import { requireScannerUser } from "@/app/api/staff/_utils"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const auth = await requireScannerUser(request.headers.get("authorization"))
  if ("error" in auth) {
    const status = auth.error === "No tienes permisos para usar el escaner" ? 403 : 401
    return NextResponse.json({ error: auth.error }, { status })
  }

  let payload: { ticketCode?: string; scanLocation?: string; deviceInfo?: string }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Solicitud no valida" }, { status: 400 })
  }

  const ticketCode = payload.ticketCode?.trim().toUpperCase()
  const scanLocation = payload.scanLocation?.trim() || "Entrada Principal"
  const deviceInfo = payload.deviceInfo?.trim() || undefined

  if (!ticketCode) {
    return NextResponse.json({ error: "Codigo de ticket no valido" }, { status: 400 })
  }

  try {
    const { data: ticket, error: ticketError } = await auth.supabase
      .from("tickets")
      .select(
        `
        *,
        ticket_type:ticket_types(name),
        user:users(name, email),
        order:orders(id)
      `,
      )
      .eq("ticket_code", ticketCode)
      .single()

    if (ticketError || !ticket) {
      const { data: scanRecord } = await auth.supabase
        .from("ticket_scans")
        .insert([
          {
            ticket_id: null,
            scanned_by: auth.profile.id,
            scan_location: scanLocation,
            device_info: deviceInfo,
            scan_result: "invalid",
          },
        ])
        .select()
        .single()

      return NextResponse.json(
        {
          data: scanRecord ?? null,
          error: "Ticket no encontrado o invalido",
          ticket: null,
        },
        { status: 200 },
      )
    }

    if (ticket.status === "used") {
      const { data: scanRecord } = await auth.supabase
        .from("ticket_scans")
        .insert([
          {
            ticket_id: ticket.id,
            scanned_by: auth.profile.id,
            scan_location: scanLocation,
            device_info: deviceInfo,
            scan_result: "already_used",
          },
        ])
        .select()
        .single()

      return NextResponse.json(
        {
          data: scanRecord ?? null,
          error: "Ticket ya fue utilizado",
          ticket,
        },
        { status: 200 },
      )
    }

    if (ticket.status !== "active") {
      const { data: scanRecord } = await auth.supabase
        .from("ticket_scans")
        .insert([
          {
            ticket_id: ticket.id,
            scanned_by: auth.profile.id,
            scan_location: scanLocation,
            device_info: deviceInfo,
            scan_result: "invalid",
          },
        ])
        .select()
        .single()

      return NextResponse.json(
        {
          data: scanRecord ?? null,
          error: "Ticket no esta activo",
          ticket,
        },
        { status: 200 },
      )
    }

    const { data: updatedTicketRows, error: updateError } = await auth.supabase
      .from("tickets")
      .update({ status: "used" })
      .eq("id", ticket.id)
      .eq("status", "active")
      .select("id")

    if (updateError) {
      return NextResponse.json({ error: "Error al procesar ticket" }, { status: 500 })
    }

    if (!updatedTicketRows || updatedTicketRows.length === 0) {
      const { data: scanRecord } = await auth.supabase
        .from("ticket_scans")
        .insert([
          {
            ticket_id: ticket.id,
            scanned_by: auth.profile.id,
            scan_location: scanLocation,
            device_info: deviceInfo,
            scan_result: "already_used",
          },
        ])
        .select()
        .single()

      return NextResponse.json(
        {
          data: scanRecord ?? null,
          error: "Ticket ya fue utilizado",
          ticket: {
            ...ticket,
            status: "used",
          },
        },
        { status: 200 },
      )
    }

    const { data: scanRecord } = await auth.supabase
      .from("ticket_scans")
      .insert([
        {
          ticket_id: ticket.id,
          scanned_by: auth.profile.id,
          scan_location: scanLocation,
          device_info: deviceInfo,
          scan_result: "success",
        },
      ])
      .select()
      .single()

    return NextResponse.json(
      {
        data: scanRecord ?? null,
        error: null,
        ticket: {
          ...ticket,
          status: "used",
        },
      },
      { status: 200 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al escanear ticket"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
