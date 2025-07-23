import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se encontró el archivo" }, { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Solo se permiten: JPG, PNG, WebP, GIF" },
        { status: 400 },
      )
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo es demasiado grande. Máximo 5MB permitido." }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "")
    const uniqueFilename = `events/${timestamp}-${randomString}-${cleanName}`

    // Convertir archivo a ArrayBuffer
    const bytes = await file.arrayBuffer()

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from("event-images") // Nombre del bucket
      .upload(uniqueFilename, bytes, {
        contentType: file.type,
        upsert: false, // No sobrescribir si existe
      })

    if (error) {
      console.error("Supabase Storage error:", error)
      return NextResponse.json({ error: `Error al subir archivo: ${error.message}` }, { status: 500 })
    }

    // Obtener URL pública del archivo
    const { data: publicUrlData } = supabase.storage.from("event-images").getPublicUrl(uniqueFilename)

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      filename: uniqueFilename,
      path: data.path,
      size: file.size,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      {
        error: `Error al subir el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
      },
      { status: 500 },
    )
  }
}

// Endpoint para eliminar imágenes
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename")

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 })
    }

    // Eliminar archivo de Supabase Storage
    const { error } = await supabase.storage.from("event-images").remove([filename])

    if (error) {
      console.error("Error deleting file:", error)
      return NextResponse.json({ error: `Error al eliminar archivo: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Error al eliminar el archivo" }, { status: 500 })
  }
}
