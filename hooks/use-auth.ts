"use client"

import { useState, useEffect } from "react"
import {
  getCurrentUser,
  onAuthStateChange,
  signOut as authSignOut,
  checkAuthStatus,
  refreshUserData,
  type User,
} from "@/lib/auth"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const cachedUser = getCurrentUser()

    // Mantiene una UI estable mientras se valida la sesión real.
    if (cachedUser) {
      setUser(cachedUser)
    }

    const {
      data: { subscription },
    } = onAuthStateChange((user) => {
      if (!isMounted) return

      setUser(user)
      setLoading(false)
    })

    // Verifica la sesión una vez montado el cliente para evitar falsos positivos
    // basados solo en localStorage y prevenir redirecciones/interrupciones del router.
    void checkAuthStatus().then((resolvedUser) => {
      if (!isMounted) return

      setUser(resolvedUser)
      setLoading(false)
    })

    return () => {
      isMounted = false
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

  const refreshUser = async () => {
    if (user) {
      const refreshedUser = await refreshUserData()
      if (refreshedUser) {
        setUser(refreshedUser)
      }
    }
  }

  return {
    user,
    loading,
    signOut,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
  }
}
