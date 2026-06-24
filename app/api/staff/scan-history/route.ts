import { requireScannerUser } from "@/app/api/staff/_utils"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const auth = await requireScannerUser(request.headers.get("authorization"))
  if ("error" in auth) {
    const status = auth.error === "No tienes permisos para usar el escaner" ? 403 : 401
    return NextResponse.json({ error: auth.error }, { status })
  }

  const { searchParams } = new URL(request.url)
  const requestedLimit = Number(searchParams.get("limit") ?? "50")
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50

  try {
    const { data, error } = await auth.supabase
      .from("ticket_scans")
      .select(
        `
        *,
        ticket:tickets(
          ticket_code,
          status,
          user:users(name, email),
          ticket_type:ticket_types(
            event:events(name)
          )
        )
      `,
      )
      .eq("scanned_by", auth.profile.id)
      .order("scanned_at", { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener historial de escaneos"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
