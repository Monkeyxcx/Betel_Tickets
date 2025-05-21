import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background py-6">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col items-center md:items-start">
          <p className="text-sm text-muted-foreground">© 2024 EventoTickets. Todos los derechos reservados.</p>
        </div>
        <nav className="flex gap-4 sm:gap-6">
          <Link href="/terminos" className="text-sm text-muted-foreground hover:underline">
            Términos
          </Link>
          <Link href="/privacidad" className="text-sm text-muted-foreground hover:underline">
            Privacidad
          </Link>
          <Link href="/contacto" className="text-sm text-muted-foreground hover:underline">
            Contacto
          </Link>
        </nav>
      </div>
    </footer>
  )
}
