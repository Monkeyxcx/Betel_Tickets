"use client"

import type React from "react"

import { AuthGuard } from "@/components/auth-guard"
import StaffScannerPage from "@/app/staff/scanner/page"

export default function CoordinatorScannerPage(): React.ReactElement {
  // Reutiliza la misma UI del escáner que usa el staff
  // pero protege la ruta para coordinadores y admins desde el AuthGuard
  return (
    <AuthGuard requireAuth={true} allowedRoles={["coordinator", "admin"]}>
      {/* Importamos y renderizamos el contenido del escáner existente */}
      <StaffScannerPage />
    </AuthGuard>
  )
}