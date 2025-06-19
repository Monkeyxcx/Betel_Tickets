import { supabase } from "./supabase"

export interface UploadResult {
  url: string
  filename: string
  path: string
  size: number
}

export interface StorageError {
  message: string
  statusCode?: number
}

// Función para subir imagen
export async function uploadEventImage(file: File): Promise<{ data: UploadResult | null; error: StorageError | null }> {
  try {
    // Validaciones
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return {
        data: null,
        error: { message: "Tipo de archivo no permitido. Solo se permiten: JPG, PNG, WebP, GIF" },
      }
    }

    if (file.size > 5 * 1024 * 1024) {
      return {
        data: null,
        error: { message: "El archivo es demasiado grande. Máximo 5MB permitido." },
      }
    }

    // Generar nombre único
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split(".").pop()
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "")
    const uniqueFilename = `events/${timestamp}-${randomString}-${cleanName}`

    // Convertir a ArrayBuffer
    const bytes = await file.arrayBuffer()

    // Subir archivo
    const { data, error } = await supabase.storage.from("event-images").upload(uniqueFilename, bytes, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      return {
        data: null,
        error: { message: error.message, statusCode: 500 },
      }
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage.from("event-images").getPublicUrl(uniqueFilename)

    return {
      data: {
        url: publicUrlData.publicUrl,
        filename: uniqueFilename,
        path: data.path,
        size: file.size,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Error desconocido al subir archivo",
        statusCode: 500,
      },
    }
  }
}

// Función para eliminar imagen
export async function deleteEventImage(filename: string): Promise<{ success: boolean; error: StorageError | null }> {
  try {
    const { error } = await supabase.storage.from("event-images").remove([filename])

    if (error) {
      return {
        success: false,
        error: { message: error.message, statusCode: 500 },
      }
    }

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Error desconocido al eliminar archivo",
        statusCode: 500,
      },
    }
  }
}

// Función para obtener URL pública de una imagen
export function getEventImageUrl(filename: string): string {
  const { data } = supabase.storage.from("event-images").getPublicUrl(filename)
  return data.publicUrl
}

// Función para listar todas las imágenes
export async function listEventImages(): Promise<{
  data: Array<{ name: string; url: string; size?: number; created_at?: string }> | null
  error: StorageError | null
}> {
  try {
    const { data, error } = await supabase.storage.from("event-images").list("events", {
      limit: 100,
      offset: 0,
    })

    if (error) {
      return {
        data: null,
        error: { message: error.message, statusCode: 500 },
      }
    }

    const imagesWithUrls = data.map((file) => ({
      name: file.name,
      url: getEventImageUrl(`events/${file.name}`),
      size: file.metadata?.size,
      created_at: file.created_at,
    }))

    return { data: imagesWithUrls, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Error al listar imágenes",
        statusCode: 500,
      },
    }
  }
}
