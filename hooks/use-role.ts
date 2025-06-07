"use client"

import { useAuth } from "./use-auth"

export function useRole() {
  const { user } = useAuth()

  return {
    user,
    isAdmin: user?.role === "admin",
    isStaff: user?.role === "staff" || user?.role === "admin",
    isUser: !!user,
    role: user?.role || null,

    // Funciones de verificación específicas
    canManageEvents: user?.role === "admin",
    canManageUsers: user?.role === "admin",
    canScanTickets: user?.role === "staff" || user?.role === "admin",
    canViewReports: user?.role === "staff" || user?.role === "admin",
  }
}
