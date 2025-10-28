"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import type { CreateEventData } from "@/lib/events"
import { ImageUpload } from "@/components/image-upload"

type EventFormData = Omit<CreateEventData, "creator_id">

interface EventFormProps {
  initialData?: Partial<EventFormData>
  submitButtonText?: string
  onSubmit: (data: EventFormData) => Promise<void> | void
}

export function EventForm({ initialData, submitButtonText, onSubmit }: EventFormProps) {
  const [form, setForm] = useState<EventFormData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    event_date: initialData?.event_date ? initialData.event_date.slice(0, 16) : "",
    location: initialData?.location ?? "",
    image_url: initialData?.image_url ?? "",
    category: initialData?.category ?? "",
    featured: initialData?.featured ?? false,
  })

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Evento *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ej: Concierto de Rock 2024"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select value={form.category ?? ""} onValueChange={(value) => setForm({ ...form, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="musica">Música</SelectItem>
              <SelectItem value="teatro">Teatro</SelectItem>
              <SelectItem value="deportes">Deportes</SelectItem>
              <SelectItem value="conferencia">Conferencia</SelectItem>
              <SelectItem value="festival">Festival</SelectItem>
              <SelectItem value="cristiano">Eventos Cristianos</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event_date">Fecha y Hora *</Label>
          <Input
            id="event_date"
            type="datetime-local"
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ubicación *</Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Ej: Centro de Convenciones"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <ImageUpload value={form.image_url || ""} onChange={(url) => setForm({ ...form, image_url: url })} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descripción *</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe el evento..."
            rows={4}
            required
          />
        </div>

        <div className="flex items-center space-x-2 md:col-span-2">
          <Switch
            id="featured"
            checked={!!form.featured}
            onCheckedChange={(checked) => setForm({ ...form, featured: checked })}
          />
          <Label htmlFor="featured">Evento Destacado</Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : submitButtonText ?? "Crear Evento"}
        </Button>
      </div>
    </form>
  )
}