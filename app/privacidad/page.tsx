import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Eye, Lock, Database, UserCheck, Globe } from "lucide-react"

export default function PrivacidadPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Política de Privacidad</h1>
          <p className="text-xl text-muted-foreground">Última actualización: 17 de junio de 2025</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                1. Introducción
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                En Betel_Tickets, respetamos su privacidad y nos comprometemos a proteger su información personal. Esta
                Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y protegemos su información
                cuando utiliza nuestros servicios.
              </p>
              <p>
                Al utilizar nuestros servicios, usted acepta las prácticas descritas en esta política. Si no está de
                acuerdo con nuestras prácticas, le recomendamos que no utilice nuestros servicios.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                2. Información que Recopilamos
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h4>2.1 Información Personal</h4>
              <ul>
                <li>
                  <strong>Información de cuenta:</strong> Nombre, dirección de email, contraseña
                </li>
                <li>
                  <strong>Información de pago:</strong> Datos de tarjeta de crédito/débito (procesados de forma segura)
                </li>
                <li>
                  <strong>Información de contacto:</strong> Número de teléfono, dirección postal
                </li>
                <li>
                  <strong>Información del perfil:</strong> Preferencias de eventos, historial de compras
                </li>
              </ul>

              <h4>2.2 Información Técnica</h4>
              <ul>
                <li>
                  <strong>Datos de uso:</strong> Páginas visitadas, tiempo de permanencia, clics
                </li>
                <li>
                  <strong>Información del dispositivo:</strong> Tipo de dispositivo, sistema operativo, navegador
                </li>
                <li>
                  <strong>Datos de ubicación:</strong>ubicación aproximada
                </li>
                <li>
                  <strong>Cookies y tecnologías similares:</strong> Para mejorar la experiencia del usuario
                </li>
              </ul>

              <h4>2.3 Información de Terceros</h4>
              <p>
                Podemos recibir información sobre usted de terceros, como redes sociales cuando se registra usando sus
                credenciales de redes sociales.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                3. Cómo Utilizamos su Información
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h4>3.1 Prestación de Servicios</h4>
              <ul>
                <li>Procesar y gestionar sus compras de tickets</li>
                <li>Crear y mantener su cuenta de usuario</li>
                <li>Enviar confirmaciones de compra y tickets digitales</li>
                <li>Proporcionar soporte al cliente</li>
              </ul>

              <h4>3.2 Comunicación</h4>
              <ul>
                <li>Enviar notificaciones importantes sobre su cuenta</li>
                <li>Informar sobre eventos que puedan interesarle</li>
                <li>Responder a sus consultas y solicitudes</li>
                <li>Enviar newsletters (con su consentimiento)</li>
              </ul>

              <h4>3.3 Mejora de Servicios</h4>
              <ul>
                <li>Analizar el uso de la plataforma para mejorar la experiencia</li>
                <li>Desarrollar nuevas funcionalidades</li>
                <li>Realizar investigación de mercado</li>
                <li>Prevenir fraudes y garantizar la seguridad</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                4. Compartir Información
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h4>4.1 Con Organizadores de Eventos</h4>
              <p>
                Compartimos información necesaria con los organizadores de eventos para facilitar su entrada y
                participación en los eventos que ha comprado.
              </p>

              <h4>4.2 Proveedores de Servicios</h4>
              <p>Trabajamos con terceros de confianza que nos ayudan a operar nuestros servicios, como:</p>
              <ul>
                <li>Procesadores de pagos</li>
                <li>Servicios de email</li>
                <li>Proveedores de análisis</li>
                <li>Servicios de almacenamiento en la nube</li>
              </ul>

              <h4>4.3 Requisitos Legales</h4>
              <p>
                Podemos divulgar su información si es requerido por ley, orden judicial, o para proteger nuestros
                derechos, propiedad o seguridad.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                5. Seguridad de la Información
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h4>5.1 Medidas de Seguridad</h4>
              <ul>
                <li>
                  <strong>Encriptación:</strong> Utilizamos encriptación SSL/TLS para proteger datos en tránsito
                </li>
                <li>
                  <strong>Almacenamiento seguro:</strong> Los datos se almacenan en servidores seguros con acceso
                  restringido
                </li>
                <li>
                  <strong>Autenticación:</strong> Implementamos autenticación de múltiples factores cuando es apropiado
                </li>
                <li>
                  <strong>Monitoreo:</strong> Supervisamos continuamente nuestros sistemas para detectar
                  vulnerabilidades
                </li>
              </ul>

              <h4>5.2 Retención de Datos</h4>
              <p>
                Conservamos su información personal solo durante el tiempo necesario para cumplir con los propósitos
                descritos en esta política, a menos que la ley requiera un período de retención más largo.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                6. Sus Derechos
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>Dependiendo de su ubicación, puede tener los siguientes derechos:</p>

              <h4>6.1 Acceso y Portabilidad</h4>
              <ul>
                <li>Solicitar una copia de la información personal que tenemos sobre usted</li>
                <li>Recibir sus datos en un formato estructurado y legible por máquina</li>
              </ul>

              <h4>6.2 Corrección y Eliminación</h4>
              <ul>
                <li>Corregir información personal inexacta o incompleta</li>
                <li>Solicitar la eliminación de su información personal</li>
              </ul>

              <h4>6.3 Control de Comunicaciones</h4>
              <ul>
                <li>Optar por no recibir comunicaciones de marketing</li>
                <li>Gestionar sus preferencias de notificación</li>
              </ul>

              <h4>6.4 Cómo Ejercer sus Derechos</h4>
              <p>
                Para ejercer cualquiera de estos derechos, contáctenos en privacy@eventostickets.com. Responderemos a su
                solicitud dentro de 30 días.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Cookies y Tecnologías de Seguimiento</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso de nuestros
                servicios y personalizar el contenido. Puede gestionar sus preferencias de cookies a través de la
                configuración de su navegador.
              </p>

              <h4>Tipos de Cookies que Utilizamos:</h4>
              <ul>
                <li>
                  <strong>Esenciales:</strong> Necesarias para el funcionamiento básico del sitio
                </li>
                <li>
                  <strong>Funcionales:</strong> Mejoran la funcionalidad y personalización
                </li>
                <li>
                  <strong>Analíticas:</strong> Nos ayudan a entender cómo se usa nuestro sitio
                </li>
                <li>
                  <strong>Marketing:</strong> Utilizadas para mostrar anuncios relevantes
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Menores de Edad</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Nuestros servicios no están dirigidos a menores de 13 años. No recopilamos conscientemente información
                personal de menores de 13 años. Si descubrimos que hemos recopilado información de un menor de 13 años,
                la eliminaremos inmediatamente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Cambios a esta Política</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre cambios
                significativos publicando la nueva política en nuestro sitio web y actualizando la fecha de "última
                actualización" en la parte superior de esta página.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Contacto</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Si tiene preguntas sobre esta Política de Privacidad o nuestras prácticas de privacidad, puede
                contactarnos en:
              </p>
              <ul>
                <li>
                  <strong>Email:</strong> privacy@Betel_Tickets.com
                </li>
                <li>
                  <strong>Teléfono:</strong> Por confirmar
                </li>
                <li>
                  <strong>Dirección:</strong> Por confirmar
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
