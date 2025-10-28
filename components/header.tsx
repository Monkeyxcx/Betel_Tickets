"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, User, Plus, QrCode, Settings, RefreshCw } from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useRole } from "@/hooks/use-role"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, loading, signOut, refreshUser } = useAuth()
  const { isAdmin, isStaff, isCoordinator, role } = useRole()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleRefreshUser = async () => {
    console.log("Refreshing user data...")
    const refreshedUser = await refreshUser()
    console.log("Refreshed user:", refreshedUser)
  }

  const navigation = [
    { name: "Inicio", href: "/" },
    // { name: "Tickets", href: "/tickets" },
    { name: "Información", href: "/informacion" },
    { name: "Contacto", href: "/contacto" },
  ]

  // Agregar enlaces específicos por rol
  if (isStaff) {
    navigation.push({ name: "Escáner", href: "/staff/scanner" })
  }

  if (isCoordinator) {
    navigation.push({ name: "Coordinación", href: "/coordinator" })
  }

  if (isAdmin) {
    navigation.push({ name: "Admin", href: "/admin" })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="font-bold text-xl">
          Betel_Tickets
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {loading ? (
            <div className="text-sm">Cargando...</div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                  {role && role !== "user" && (
                    <Badge variant="secondary" className="text-xs">
                      {role.toUpperCase()}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">Mi Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tickets">Mis Tickets</Link>
                </DropdownMenuItem>

                {/* Debug info */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRefreshUser}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refrescar datos
                </DropdownMenuItem>
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  Role: {user.role} | ID: {user.id.slice(0, 8)}...
                </div>

                {isStaff && (
                  <> 
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/staff/scanner" className="flex items-center">
                        <QrCode className="mr-2 h-4 w-4" />
                        Escáner de Tickets
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/events" className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        Gestionar Eventos
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">Panel de Admin</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/events" className="flex items-center">
                          <Plus className="mr-2 h-4 w-4" />
                          Gestionar Eventos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/staff" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Gestionar Staff
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Cerrar Sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Registrarse</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={toggleMenu} aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="container py-4 space-y-4">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === item.href ? "text-primary" : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col space-y-2">
              {loading ? (
                <div className="text-sm">Cargando...</div>
              ) : user ? (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Hola, {user.name}</span>
                    {role && role !== "user" && (
                      <Badge variant="secondary" className="text-xs">
                        {role.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  <Button asChild variant="outline" size="sm">
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                      Mi Perfil
                    </Link>
                  </Button>

                  {isStaff && (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/staff/scanner" onClick={() => setIsMenuOpen(false)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Escáner de Tickets
                      </Link>
                    </Button>
                  )}

                  {isCoordinator && (
                    <>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/coordinator" onClick={() => setIsMenuOpen(false)}>
                          Panel de Coordinación
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/coordinator/events" onClick={() => setIsMenuOpen(false)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Gestionar Eventos
                        </Link>
                      </Button>
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                          Panel de Admin
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/admin/events" onClick={() => setIsMenuOpen(false)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Gestionar Eventos
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/admin/staff" onClick={() => setIsMenuOpen(false)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Gestionar Staff
                        </Link>
                      </Button>
                    </>
                  )}

                  <Button onClick={handleRefreshUser} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refrescar datos
                  </Button>

                  <Button
                    onClick={() => {
                      setIsMenuOpen(false)
                      signOut()
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cerrar Sesión
                  </Button>
                </div>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      Iniciar Sesión
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      Registrarse
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
