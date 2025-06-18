"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from "lucide-react"

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    asunto: "",
    categoria: "",
    mensaje: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simular envío del formulario
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setSubmitted(true)
    setIsSubmitting(false)

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        nombre: "",
        email: "",
        asunto: "",
        categoria: "",
        mensaje: "",
      })
    }, 3000)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contáctanos</h1>
          <p className="text-xl text-muted-foreground">
            Estamos aquí para ayudarte. Ponte en contacto con nosotros a través de cualquiera de estos medios.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Información de contacto */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Información de Contacto
                </CardTitle>
                <CardDescription>Múltiples formas de comunicarte con nuestro equipo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-muted-foreground">soporte@Betel_Tickets.com</p>
                    <p className="text-muted-foreground">ventas@Betel_Tickets.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Teléfono</h3>
                    <p className="text-muted-foreground">por confirmar</p>
                    <p className="text-sm text-muted-foreground">Lunes a Viernes: 9:00 AM - 6:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Oficina Principal</h3>
                    <p className="text-muted-foreground">
                      por confirmar
                      <br />
                      por confirmar
                      <br />
                      Colombia
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Horarios de Atención</h3>
                    <div className="text-muted-foreground space-y-1">
                      <p>Lunes - Viernes: 9:00 AM - 6:00 PM</p>
                      <p>Sábados: 10:00 AM - 2:00 PM</p>
                      <p>Domingos: Cerrado</p>
                      <p className="text-sm font-medium text-primary">Soporte de emergencia 24/7 disponible</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preguntas Frecuentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">¿Cómo puedo recuperar mi ticket?</h4>
                  <p className="text-sm text-muted-foreground">
                    Puedes acceder a tus tickets desde tu perfil de usuario o revisar el email de confirmación que
                    recibiste al momento de la compra.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">¿Puedo cancelar mi compra?</h4>
                  <p className="text-sm text-muted-foreground">
                    Las cancelaciones dependen de la política del evento. Contacta a nuestro equipo de soporte para más
                    información.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">¿Los tickets son transferibles?</h4>
                  <p className="text-sm text-muted-foreground">
                    Por seguridad, nuestros tickets no son transferibles. Cada ticket está vinculado al comprador
                    original.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulario de contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Envíanos un Mensaje
              </CardTitle>
              <CardDescription>Completa el formulario y te responderemos lo antes posible</CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">¡Mensaje enviado!</h3>
                  <p className="text-muted-foreground">
                    Gracias por contactarnos. Te responderemos dentro de las próximas 24 horas.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre completo *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => handleInputChange("nombre", e.target.value)}
                        placeholder="Tu nombre"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select value={formData.categoria} onValueChange={(value) => handleInputChange("categoria", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soporte">Soporte Técnico</SelectItem>
                        <SelectItem value="ventas">Consultas de Ventas</SelectItem>
                        <SelectItem value="eventos">Organización de Eventos</SelectItem>
                        <SelectItem value="facturacion">Facturación</SelectItem>
                        <SelectItem value="sugerencias">Sugerencias</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="asunto">Asunto *</Label>
                    <Input
                      id="asunto"
                      value={formData.asunto}
                      onChange={(e) => handleInputChange("asunto", e.target.value)}
                      placeholder="Breve descripción del tema"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensaje">Mensaje *</Label>
                    <Textarea
                      id="mensaje"
                      value={formData.mensaje}
                      onChange={(e) => handleInputChange("mensaje", e.target.value)}
                      placeholder="Describe tu consulta o problema en detalle..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Mensaje
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
