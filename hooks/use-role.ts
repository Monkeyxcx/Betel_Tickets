"use client"

import { useAuth } from "@/hooks/use-auth"

export function useRole() {
  const { user } = useAuth()

  const role = user?.role || "user"
  const isAdmin = role === "admin"
  const isStaff = role === "staff" || role === "admin" // Admin también tiene permisos de staff
  const isUser = role === "user"

  return {
    role,
    isAdmin,
    isStaff,
    isUser,
    hasRole: (requiredRole: string) => role === requiredRole,
    hasAnyRole: (roles: string[]) => roles.includes(role),
  }
}
