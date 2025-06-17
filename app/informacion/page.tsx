"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Shield, Star, Clock, Loader2, TrendingUp, BarChart3 } from "lucide-react"
import {
  getPlatformStatistics,
  getEventCategoryStats,
  getTicketStatusStats,
  formatNumber,
  formatCurrency,
  type PlatformStats,
} from "@/lib/statistics"

export default function InformacionPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [categoryStats, setCategoryStats] = useState<Array<{ category: string; count: number }> | null>(null)
  const [ticketStats, setTicketStats] = useState<{ active: number; used: number; cancelled: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true)

        // Cargar estadísticas principales
        const { data: platformData, error: platformError } = await getPlatformStatistics()
        if (platformError) {
          setError(platformError)
        } else {
          setStats(platformData)
        }

        // Cargar estadísticas por categoría
        const { data: categoryData, error: categoryError } = await getEventCategoryStats()
        if (!categoryError) {
          setCategoryStats(categoryData)
        }

        // Cargar estadísticas de tickets
        const { data: ticketData, error: ticketError } = await getTicketStatusStats()
        if (!ticketError) {
          setTicketStats(ticketData)
        }
      } catch (error) {
        console.error("Error loading statistics:", error)
        setError("Error al cargar las estadísticas")
      } finally {
        setLoading(false)
      }
    }

    loadStatistics()
  }, [])

  const getCategoryDisplayName = (category: string): string => {
    const categoryNames: { [key: string]: string } = {
      musica: "Música",
      teatro: "Teatro",
      deportes: "Deportes",
      conferencia: "Conferencias",
      festival: "Festivales",
      cristiano: "Eventos Cristianos",
      otro: "Otros",
    }
    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1)
  }

  const getCategoryEmoji = (category: string): string => {
    const categoryEmojis: { [key: string]: string } = {
      musica: "🎵",
      teatro: "🎭",
      deportes: "⚽",
      conferencia: "🎓",
      festival: "🎪",
      cristiano: "✝️",
      otro: "🎯",
    }
    return categoryEmojis[category] || "📅"
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Información sobre Betel_Tickets</h1>
          <p className="text-xl text-muted-foreground">
            Tu plataforma confiable para la compra y gestión de tickets de eventos
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                ¿Quiénes somos?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Betel_Tickets es una plataforma moderna y segura diseñada para facilitar la compra, venta y gestión de
                tickets para todo tipo de eventos. Desde conciertos y festivales hasta conferencias y eventos
                deportivos, conectamos a organizadores con su audiencia de manera eficiente y confiable.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Nuestra Misión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Democratizar el acceso a eventos culturales, deportivos y de entretenimiento, proporcionando una
                plataforma tecnológica avanzada que garantice transparencia, seguridad y una experiencia excepcional
                tanto para organizadores como para asistentes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Seguridad y Confianza
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  La seguridad de nuestros usuarios es nuestra prioridad. Implementamos:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Códigos QR únicos e intransferibles para cada ticket</li>
                  <li>Encriptación de extremo a extremo en todas las transacciones</li>
                  <li>Verificación en tiempo real para prevenir fraudes</li>
                  <li>Sistema de respaldo y recuperación de tickets</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Soporte 24/7
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Nuestro equipo de soporte está disponible las 24 horas del día, los 7 días de la semana para ayudarte
                con cualquier consulta o problema. Contáctanos a través de nuestros canales oficiales y recibirás una
                respuesta rápida y profesional.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas en tiempo real */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Estadísticas en Tiempo Real
              </CardTitle>
              <CardDescription>Datos actualizados de nuestra plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Cargando estadísticas...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Error al cargar estadísticas: {error}</p>
                </div>
              ) : stats ? (
                <div className="grid gap-6 md:grid-cols-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">{formatNumber(stats.total_tickets_sold)}</div>
                    <div className="text-sm text-muted-foreground">Tickets vendidos</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">{formatNumber(stats.total_events)}</div>
                    <div className="text-sm text-muted-foreground">Eventos organizados</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">{formatNumber(stats.total_users)}</div>
                    <div className="text-sm text-muted-foreground">Usuarios registrados</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">{stats.system_uptime}%</div>
                    <div className="text-sm text-muted-foreground">Uptime del sistema</div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas adicionales */}
        {stats && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Eventos activos</span>
                    <span className="font-semibold">{stats.active_events}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Próximos eventos</span>
                    <span className="font-semibold">{stats.upcoming_events}</span>
                  </div>
                  {/* <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Ingresos totales</span>
                    <span className="font-semibold">{formatCurrency(stats.total_revenue)}</span>
                  </div> */}
                </div>
              </CardContent>
            </Card>

            {ticketStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tickets activos</span>
                      <span className="font-semibold text-green-600">{formatNumber(ticketStats.active)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tickets utilizados</span>
                      <span className="font-semibold text-blue-600">{formatNumber(ticketStats.used)}</span>
                    </div>
                    {/* <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tickets cancelados</span>
                      <span className="font-semibold text-red-600">{formatNumber(ticketStats.cancelled)}</span>
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tipos de eventos que ofrecemos (estático) */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Tipos de Eventos que Ofrecemos
              </CardTitle>
              <CardDescription>Amplia variedad de categorías para todos los gustos</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">🎵 Música</h3>
                  <p className="text-sm text-muted-foreground">
                    Conciertos, festivales, recitales y eventos musicales de todos los géneros
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">🎭 Teatro y Arte</h3>
                  <p className="text-sm text-muted-foreground">
                    Obras teatrales, espectáculos de danza, exposiciones y eventos culturales
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">⚽ Deportes</h3>
                  <p className="text-sm text-muted-foreground">
                    Partidos de fútbol, básquet, eventos deportivos y competencias
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">🎓 Conferencias</h3>
                  <p className="text-sm text-muted-foreground">
                    Seminarios, workshops, conferencias profesionales y eventos educativos
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">🎪 Entretenimiento</h3>
                  <p className="text-sm text-muted-foreground">
                    Shows, espectáculos familiares, circos y eventos de entretenimiento
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">✝️ Eventos Cristianos</h3>
                  <p className="text-sm text-muted-foreground">
                    Conferencias cristianas, conciertos gospel, retiros espirituales y eventos de fe
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">🍷 Gastronómicos</h3>
                  <p className="text-sm text-muted-foreground">
                    Cenas temáticas, degustaciones, festivales gastronómicos y eventos culinarios
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Eventos activos actualmente (datos reales) */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Eventos Activos Actualmente
              </CardTitle>
              <CardDescription>Eventos disponibles en este momento por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Cargando eventos activos...</span>
                </div>
              ) : categoryStats && categoryStats.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryStats.map((category) => (
                      <div
                        key={category.category}
                        className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-primary/10"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCategoryEmoji(category.category)}</span>
                          <div>
                            <h4 className="font-semibold">{getCategoryDisplayName(category.category)}</h4>
                            <p className="text-sm text-muted-foreground">Eventos disponibles</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{category.count}</div>
                          <div className="text-xs text-muted-foreground">activos</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Total de eventos activos</h4>
                        <p className="text-sm text-muted-foreground">Eventos disponibles para compra</p>
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        {categoryStats.reduce((total, category) => total + category.count, 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay eventos activos</h3>
                  <p className="text-muted-foreground">
                    Actualmente no hay eventos disponibles. ¡Pronto tendremos nuevos eventos emocionantes!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
