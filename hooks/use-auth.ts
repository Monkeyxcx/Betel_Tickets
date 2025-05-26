"use client"

import { useState, useEffect } from "react"
import { getCurrentUser, onAuthStateChange, signOut as authSignOut, checkAuthStatus, type User } from "@/lib/auth"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar estado de autenticación al cargar
    const initAuth = async () => {
      try {
        // Primero verificar localStorage
        const localUser = getCurrentUser()
        if (localUser) {
          setUser(localUser)
        }

        // Luego verificar con Supabase
        const authUser = await checkAuthStatus()
        setUser(authUser)
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await authSignOut()
    setUser(null)
  }

  const updateUser = (newUser: User | null) => {
    setUser(newUser)
  }

  return {
    user,
    loading,
    signOut,
    updateUser,
    isAuthenticated: !!user,
  }
}
