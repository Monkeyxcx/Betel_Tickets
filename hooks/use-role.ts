"use client"

import { useAuth } from "@/hooks/use-auth"

export function useRole() {
  const { user } = useAuth()

  const isAdmin = user?.role === "admin"
  const isStaff = user?.role === "staff"
  const isCoordinator = user?.role === "coordinator"
  const role = user?.role

  const hasAnyRole = (roles: Array<"user" | "staff" | "coordinator" | "admin">) => {
    return roles.includes(user?.role || "user")
  }

  return {
    isAdmin,
    isStaff,
    isCoordinator,
    role,
    hasAnyRole,
  }
}
