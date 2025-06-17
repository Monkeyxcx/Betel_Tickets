import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollText, Shield, AlertTriangle, Scale } from "lucide-react"

export default function TerminosPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Términos y Condiciones</h1>
          <p className="text-xl text-muted-foreground">Última actualización: 15 de enero de 2024</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                1. Aceptación de los Términos
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Al acceder y utilizar EventoTickets ("la Plataforma"), usted acepta estar sujeto a estos Términos y
                Condiciones de Uso ("Términos"). Si no está de acuerdo con alguna parte de estos términos, no debe
                utilizar nuestros servicios.
              </p>
              <p>
                Estos términos constituyen un acuerdo legal vinculante entre usted y EventoTickets. Nos reservamos el
                derecho de modificar estos términos en cualquier momento, y dichas modificaciones entrarán en vigor
                inmediatamente después de su publicación en la Plataforma.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                2. Uso de la Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h4>2.1 Elegibilidad</h4>
              <p>
                Para utilizar nuestros servicios, debe ser mayor de 18 años o tener el consentimiento de un padre o
                tutor legal. Al registrarse, declara que toda la información proporcionada es veraz y precisa.
              </p>

              <h4>2.2 Cuenta de Usuario</h4>
              <p>
                Es responsable de mantener la confidencialidad de su cuenta y contraseña. Usted es responsable de todas
                las actividades que ocurran bajo su cuenta.
              </p>

              <h4>2.3 Uso Prohibido</h4>
              <ul>
                <li>Utilizar la plataforma para actividades ilegales o no autorizadas</li>
                <li>Intentar acceder a cuentas de otros usuarios</li>
                <li>Distribuir virus, malware o código malicioso</li>
                <li>Realizar ingeniería inversa de la plataforma</li>
                <li>Revender tickets sin autorización expresa</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                3. Compra y Venta de Tickets
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h4>3.1 Proceso de Compra</h4>
              <p>
                Al realizar una compra, usted acepta pagar el precio total mostrado, incluyendo todos los impuestos y
                tarifas aplicables. Todas las ventas son finales, sujeto a las políticas específicas del evento.
              </p>

              <h4>3.2 Tickets Digitales</h4>
              <p>
                Los tickets se entregan en formato digital con códigos QR únicos. Es su responsabilidad presentar el
                ticket válido en el evento. Los tickets perdidos pueden ser recuperados desde su cuenta de usuario.
              </p>

              <h4>3.3 Cancelaciones y Reembolsos</h4>
              <p>
                Las políticas de cancelación y reembolso varían según el evento. Los reembolsos, cuando apliquen, se
                procesarán al método de pago original dentro de 5-10 días hábiles.
              </p>

              <h4>3.4 Transferencia de Tickets</h4>
              <p>
                Los tickets no son transferibles a menos que se especifique lo contrario. Cada ticket está vinculado al
                comprador original para fines de seguridad y verificación.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                4. Limitación de Responsabilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h4>4.1 Disponibilidad del Servicio</h4>
              <p>
                Aunque nos esforzamos por mantener la plataforma disponible 24/7, no garantizamos que el servicio esté
                libre de interrupciones, errores o defectos.
              </p>

              <h4>4.2 Eventos de Terceros</h4>
              <p>
                EventoTickets actúa como intermediario entre organizadores de eventos y compradores. No somos
                responsables por la calidad, cancelación o modificación de eventos organizados por terceros.
              </p>

              <h4>4.3 Limitación de Daños</h4>
              <p>
                En ningún caso EventoTickets será responsable por daños indirectos, incidentales, especiales o
                consecuentes que resulten del uso o la imposibilidad de usar nuestros servicios.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Propiedad Intelectual</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Todo el contenido de la plataforma, incluyendo pero no limitado a texto, gráficos, logos, iconos,
                imágenes, clips de audio, descargas digitales y software, es propiedad de EventoTickets o sus
                proveedores de contenido y está protegido por las leyes de derechos de autor.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Privacidad</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Su privacidad es importante para nosotros. El uso de nuestros servicios también está sujeto a nuestra
                Política de Privacidad, que describe cómo recopilamos, utilizamos y protegemos su información personal.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Resolución de Disputas</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Cualquier disputa que surja de o esté relacionada con estos términos será resuelta mediante arbitraje
                vinculante de acuerdo con las reglas de arbitraje comercial. El arbitraje se llevará a cabo en
                [Jurisdicción].
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Contacto</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos en:</p>
              <ul>
                <li>Email: legal@eventostickets.com</li>
                <li>Teléfono: +1 (555) 123-4567</li>
                <li>Dirección: Av. Tecnología 123, Piso 15, Ciudad Empresarial</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
