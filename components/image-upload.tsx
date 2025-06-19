"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2, ImageIcon, LinkIcon, AlertCircle, Database } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  onPreviewChange?: (url: string | null) => void
  className?: string
}

export function ImageUpload({ value, onChange, onPreviewChange, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [urlInput, setUrlInput] = useState(value)
  const [activeTab, setActiveTab] = useState("upload")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    setError(null)
    setSuccess(null)

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo es demasiado grande. Máximo 5MB permitido.")
      return
    }

    // Validar tipo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      setError("Tipo de archivo no permitido. Solo se permiten: JPG, PNG, WebP, GIF")
      return
    }

    setUploading(true)

    try {
      // Crear FormData y enviar archivo
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Error al subir el archivo"

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      onChange(data.url)
      if (onPreviewChange) {
        onPreviewChange(data.url)
      }

      setError(null)
      setSuccess("¡Imagen subida exitosamente a Supabase Storage!")

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error uploading file:", error)
      const errorMessage = error instanceof Error ? error.message : "Error al subir el archivo"
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      if (onPreviewChange) {
        onPreviewChange(urlInput.trim())
      }
      setError(null)
      setSuccess(null)
    }
  }

  const clearImage = () => {
    onChange("")
    setUrlInput("")
    setError(null)
    setSuccess(null)
    if (onPreviewChange) {
      onPreviewChange(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={className}>
      <Label className="text-base font-medium">Imagen del Evento</Label>

      {/* Mostrar errores */}
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Mostrar éxito */}
      {success && (
        <Alert className="mt-2 border-green-200 bg-green-50">
          <Database className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Subir a Supabase
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            URL Externa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
            } ${uploading ? "pointer-events-none opacity-50" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />

            <div className="space-y-2">
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Subiendo a Supabase Storage...</p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <Database className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Arrastra una imagen aquí o haz clic para seleccionar</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP, GIF hasta 5MB • Se guardará en Supabase Storage
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Seleccionar Archivo Local
          </Button>
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">URL de la Imagen</Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="flex-1"
              />
              <Button type="button" onClick={handleUrlSubmit}>
                Aplicar
              </Button>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => window.open("https://unsplash.com", "_blank")}
            className="w-full"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Buscar en Unsplash
          </Button>
        </TabsContent>
      </Tabs>

      {/* Vista previa de la imagen */}
      {value && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Vista Previa</Label>
            <Button type="button" variant="outline" size="sm" onClick={clearImage} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border">
            <img
              src={value || "/placeholder.svg"}
              alt="Vista previa"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg?height=192&width=384&text=Error+al+cargar+imagen"
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 break-all">{value}</p>
          {value.includes("supabase") && (
            <p className="text-xs text-green-600 mt-1">📁 Almacenado en Supabase Storage</p>
          )}
        </div>
      )}
    </div>
  )
}
