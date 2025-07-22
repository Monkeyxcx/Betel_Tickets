"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const router = useRouter()

  // Verificar si hay una sesión activa al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      console.log("Current session:", data.session ? "Active" : "None")
    }

    checkSession()
  }, [])

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validaciones
      const passwordError = validatePassword(password)
      if (passwordError) {
        setError(passwordError)
        setIsLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden")
        setIsLoading(false)
        return
      }

      console.log("Attempting to update password...")

      // Verificar si hay una sesión activa
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        console.error("No active session found")
        setError("No hay una sesión activa. Por favor, solicita un nuevo enlace de recuperación.")
        setIsLoading(false)
        return
      }

      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error("Password update error:", updateError)
        let errorMessage = updateError.message
        if (updateError.message.includes("Password should be at least")) {
          errorMessage = "La contraseña debe tener al menos 6 caracteres"
        } else if (updateError.message.includes("Auth session missing")) {
          errorMessage = "Enlace de recuperación inválido o expirado. Por favor solicita un nuevo enlace."
        } else if (updateError.message.includes("same as the old password")) {
          errorMessage = "La nueva contraseña debe ser diferente a la anterior"
        }
        setError(errorMessage)
        setIsLoading(false)
        return
      }

      console.log("Password updated successfully")
      setIsSuccess(true)

      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error) {
      console.error("Password reset error:", error)
      setError("Error al restablecer la contraseña. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">¡Contraseña Actualizada!</CardTitle>
            <CardDescription>Tu contraseña ha sido restablecida exitosamente</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Serás redirigido al inicio de sesión en unos segundos...</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/login">Ir al inicio de sesión</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Nueva Contraseña</CardTitle>
          <CardDescription>Ingresa tu nueva contraseña para completar la recuperación</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirma tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Actualizar contraseña
                </>
              )}
            </Button>

            <div className="text-center text-sm">
              <Link href="/recuperar-password" className="text-primary hover:underline">
                Solicitar nuevo enlace
              </Link>
              <span className="mx-2">•</span>
              <Link href="/login" className="text-primary hover:underline">
                Volver al inicio de sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
