import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, MapPin, Ticket } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-pink-500 to-purple-600 text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Nombre del Evento
              </h1>
              <p className="mx-auto max-w-[700px] text-lg md:text-xl">
                ¡Asegura tu lugar en el evento más esperado del año!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                <Link href="/tickets">Comprar Tickets</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                <Link href="#info">Más Información</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Event Info */}
      <section id="info" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-purple-100 p-4 rounded-full">
                <CalendarDays className="h-10 w-10 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Fecha</h3>
                <p className="text-gray-500 dark:text-gray-400">15 de Septiembre, 2024</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-purple-100 p-4 rounded-full">
                <Clock className="h-10 w-10 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Horario</h3>
                <p className="text-gray-500 dark:text-gray-400">18:00 - 23:00</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="bg-purple-100 p-4 rounded-full">
                <MapPin className="h-10 w-10 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Ubicación</h3>
                <p className="text-gray-500 dark:text-gray-400">Centro de Convenciones</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket Types */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Tipos de Tickets</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Elige el ticket que mejor se adapte a tus necesidades
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            {/* General Ticket */}
            <div className="flex flex-col p-6 bg-white shadow-lg rounded-lg dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">General</h3>
                <Ticket className="h-6 w-6 text-purple-600" />
              </div>
              <div className="mt-4">
                <p className="text-4xl font-bold">$50</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">por persona</p>
              </div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Acceso al evento</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Zona general</span>
                </li>
              </ul>
              <Button className="mt-6 bg-purple-600 hover:bg-purple-700">
                <Link href="/tickets?type=general">Comprar Ahora</Link>
              </Button>
            </div>

            {/* VIP Ticket */}
            <div className="flex flex-col p-6 bg-white shadow-lg rounded-lg border-2 border-purple-600 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">VIP</h3>
                  <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
                    Recomendado
                  </span>
                </div>
                <Ticket className="h-6 w-6 text-purple-600" />
              </div>
              <div className="mt-4">
                <p className="text-4xl font-bold">$100</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">por persona</p>
              </div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Acceso al evento</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Zona VIP</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Bebidas incluidas</span>
                </li>
              </ul>
              <Button className="mt-6 bg-purple-600 hover:bg-purple-700">
                <Link href="/tickets?type=vip">Comprar Ahora</Link>
              </Button>
            </div>

            {/* Premium Ticket */}
            <div className="flex flex-col p-6 bg-white shadow-lg rounded-lg dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Premium</h3>
                <Ticket className="h-6 w-6 text-purple-600" />
              </div>
              <div className="mt-4">
                <p className="text-4xl font-bold">$150</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">por persona</p>
              </div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Acceso al evento</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Zona Premium</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Bebidas y comida incluidas</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  <span>Meet & Greet</span>
                </li>
              </ul>
              <Button className="mt-6 bg-purple-600 hover:bg-purple-700">
                <Link href="/tickets?type=premium">Comprar Ahora</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
