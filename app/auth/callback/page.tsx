"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { useAuth } from "@/hooks/use-auth"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AuthCallback() {
  const router = useRouter()
  const { updateUser } = useAuth()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          router.push("/login?error=auth_error")
          return
        }

        if (data.session?.user) {
          const user = data.session.user

          // Crear o actualizar usuario en nuestra tabla
          const { error: upsertError } = await supabase.from("users").upsert([
            {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || "Usuario",
              role: "user", // Rol por defecto para nuevos usuarios
            },
          ])

          if (upsertError) {
            console.error("Error upserting user:", upsertError)
          }

          // Obtener los datos completos del usuario incluyendo el rol
          const { data: userData, error: userDataError } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single()

          // Actualizar estado de autenticación
          const authUser = {
            id: user.id,
            email: user.email!,
            name: userData?.name || user.user_metadata?.full_name || user.user_metadata?.name || "Usuario",
            role: userData?.role || "user",
          }

          updateUser(authUser)
          router.push("/")
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Error in auth callback:", error)
        router.push("/login?error=callback_error")
      }
    }

    handleAuthCallback()
  }, [router, updateUser])

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Completando autenticación...</p>
      </div>
    </div>
  )
}
