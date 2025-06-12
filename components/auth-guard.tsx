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
  allowedRoles?: string[]
}

export function AuthGuard({
  children,
  requireAuth = true,
  redirectTo = "/login",
  adminOnly = false,
  staffOnly = false,
  allowedRoles = [],
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const { isAdmin, isStaff, hasAnyRole } = useRole()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push(redirectTo)
        return
      }

      if (adminOnly && !isAdmin) {
        router.push("/")
        return
      }

      if (staffOnly && !isStaff) {
        router.push("/")
        return
      }

      if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
        router.push("/")
        return
      }

      setIsChecking(false)
    }
  }, [user, loading, requireAuth, redirectTo, adminOnly, staffOnly, allowedRoles, isAdmin, isStaff, hasAnyRole, router])

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
    return null
  }

  if (staffOnly && !isStaff) {
    return null
  }

  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return null
  }

  return <>{children}</>
}
