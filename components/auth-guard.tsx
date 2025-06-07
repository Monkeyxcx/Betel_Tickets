"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useRole } from "@/hooks/use-role"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  adminOnly?: boolean
  staffOnly?: boolean
  allowedRoles?: ("user" | "staff" | "admin")[]
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/login",
  adminOnly = false,
  staffOnly = false,
  allowedRoles,
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const { isAdmin, isStaff, role } = useRole()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!loading) {
      // Verificar autenticación básica
      if (requireAuth && !user) {
        router.push(redirectTo)
        return
      }

      // Verificar role específico
      if (adminOnly && !isAdmin) {
        router.push("/")
        return
      }

      if (staffOnly && !isStaff) {
        router.push("/")
        return
      }

      // Verificar roles permitidos
      if (allowedRoles && role && !allowedRoles.includes(role)) {
        router.push("/")
        return
      }

      setIsChecking(false)
    }
  }, [user, loading, requireAuth, redirectTo, adminOnly, staffOnly, allowedRoles, isAdmin, isStaff, role, router])

  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground">No tienes permisos de administrador.</p>
        </div>
      </div>
    )
  }

  if (staffOnly && !isStaff) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground">No tienes permisos de staff.</p>
        </div>
      </div>
    )
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground">No tienes los permisos necesarios.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
