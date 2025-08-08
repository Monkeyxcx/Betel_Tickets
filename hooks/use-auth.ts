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
    // 1. Carga optimista desde localStorage para una carga inicial rápida.
    setUser(getCurrentUser());
    setLoading(false); // Permite que la UI se renderice inmediatamente.

    // 2. onAuthStateChange es la fuente de verdad.
    // Se ejecutará en la carga inicial y en cualquier evento de autenticación,
    // corrigiendo el estado optimista si estaba desactualizado.
    const {
      data: { subscription },
    } = onAuthStateChange((user) => {
      setUser(user);
    });

    // 3. Se llama a checkAuthStatus para verificar proactivamente la sesión
    // en la carga, lo que puede ayudar a refrescar un token expirado.
    checkAuthStatus();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await authSignOut()
    setUser(null)
  }

  const updateUser = (newUser: User | null) => {
    setUser(newUser)
  }

  const refreshUser = async () => {
    if (user) {
      const refreshedUser = await refreshUserData(user.id)
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