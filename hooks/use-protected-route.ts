"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface UseProtectedRouteOptions {
  requireAuth?: boolean
  adminOnly?: boolean
  redirectTo?: string
}

export function useProtectedRoute({
  requireAuth = true,
  adminOnly = false,
  redirectTo = "/login",
}: UseProtectedRouteOptions = {}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push(redirectTo)
        return
      }

      if (adminOnly && user?.role !== "admin") {
        router.push("/")
        return
      }
    }
  }, [user, loading, requireAuth, adminOnly, redirectTo, router])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  }
}
