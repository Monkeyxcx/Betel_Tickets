import { supabase } from "./supabase"

export interface User {
  id: string
  email: string
  name: string
  role: "user" | "staff" | "admin" // Cambiar a union type para mejor type safety
}

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const configured = !!(url && key && url !== "" && key !== "")
  console.log("Supabase configured:", configured)

  return configured
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ user: User | null; error: string | null }> {
  // Mock para desarrollo si Supabase no está configurado
  if (!isSupabaseConfigured()) {
    const mockUser: User = {
      id: "mock-user-" + Date.now(),
      email,
      name,
      role: "user",
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(mockUser))
    }

    return { user: mockUser, error: null }
  }

  try {
    console.log("Attempting to sign up user:", email)

    // Registrar usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: undefined, // No requerir confirmación de email
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      return { user: null, error: authError.message }
    }

    if (authData.user) {
      console.log("User signed up successfully:", authData.user.id)

      // Usar la función auxiliar para crear usuario
      const user = await getOrCreateUserFromCustomTable(authData.user)

      // Guardar en localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user))
      }

      return { user, error: null }
    }

    return { user: null, error: "Error al crear la cuenta" }
  } catch (error) {
    console.error("Signup error:", error)
    return { user: null, error: "Error al registrar usuario" }
  }
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  // Mock para desarrollo si Supabase no está configurado
  if (!isSupabaseConfigured()) {
    console.log("Using mock authentication - Supabase not configured")

    const mockUsers = [
      { id: "admin-mock", email: "admin@example.com", name: "Administrador", role: "admin" as const },
      { id: "staff-mock", email: "staff@example.com", name: "Personal del Evento", role: "staff" as const },
      { id: "user-mock", email: "user@example.com", name: "Usuario de Prueba", role: "user" as const },
    ]

    const mockUser = mockUsers.find((u) => u.email === email)

    if (mockUser && password === "password123") {
      console.log("Mock login successful for:", email)
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(mockUser))
      }
      return { user: mockUser, error: null }
    }

    return { user: null, error: "Email o contraseña incorrectos (usa password123)" }
  }

  try {
    console.log("Attempting to sign in user:", email)

    // Intentar login con Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("Auth signin error:", authError)
      let errorMessage = authError.message
      if (authError.message.includes("Invalid login credentials")) {
        errorMessage = "Email o contraseña incorrectos"
      } else if (authError.message.includes("Email not confirmed")) {
        errorMessage = "Por favor confirma tu email"
      }
      return { user: null, error: errorMessage }
    }

    if (authData.user) {
      console.log("User signed in successfully:", authData.user.id)

      // Usar la función auxiliar para obtener/crear usuario
      const user = await getOrCreateUserFromCustomTable(authData.user)

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user))
      }

      return { user, error: null }
    }

    return { user: null, error: "Credenciales inválidas" }
  } catch (error) {
    console.error("Signin error:", error)
    return { user: null, error: "Error al iniciar sesión" }
  }
}

export async function signInWithGoogle(): Promise<{ user: User | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: "Google sign-in no disponible en modo desarrollo" }
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error("Google signin error:", error)
      return { user: null, error: error.message }
    }

    return { user: null, error: null }
  } catch (error) {
    console.error("Google signin error:", error)
    return { user: null, error: "Error al iniciar sesión con Google" }
  }
}

export async function signOut(): Promise<void> {
  try {
    console.log("Signing out user")
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
  } catch (error) {
    console.error("Error signing out:", error)
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
    }
  }
}

export function getCurrentUser(): User | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch {
        return null
      }
    }
  }
  return null
}

// Función auxiliar mejorada para crear/obtener usuario de nuestra tabla personalizada
async function getOrCreateUserFromCustomTable(authUser: any): Promise<User> {
  try {
    console.log("Getting or creating user from custom table for:", authUser.email)

    // Primero intentar obtener el usuario de nuestra tabla usando email
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", authUser.email)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user data:", fetchError)
      throw fetchError
    }

    // Si el usuario existe, devolverlo
    if (userData) {
      console.log("User found in custom table:", userData)
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || "user",
      }
    }

    // Si no existe, crearlo
    console.log("User not found in custom table, creating new record")
    const { data: newUserData, error: createError } = await supabase
      .from("users")
      .insert([
        {
          email: authUser.email, // Usar email como clave principal
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || "Usuario",
          role: "user",
        },
      ])
      .select()
      .single()

    if (createError) {
      console.error("Error creating user in custom table:", createError)

      // Verificar si ya existe (posible race condition)
      const { data: existingUserData } = await supabase.from("users").select("*").eq("email", authUser.email).single()

      if (existingUserData) {
        console.log("User was created by another process:", existingUserData)
        return {
          id: existingUserData.id,
          email: existingUserData.email,
          name: existingUserData.name,
          role: existingUserData.role || "user",
        }
      }

      // Fallback: retornar usuario con datos básicos
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || "Usuario",
        role: "user",
      }
    }

    console.log("User created successfully:", newUserData)
    return {
      id: newUserData.id,
      email: newUserData.email,
      name: newUserData.name,
      role: newUserData.role || "user",
    }
  } catch (error) {
    console.error("Error in getOrCreateUserFromCustomTable:", error)

    // Fallback: retornar usuario con datos básicos
    return {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || "Usuario",
      role: "user",
    }
  }
}

// Función para manejar cambios de autenticación
export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!isSupabaseConfigured()) {
    return {
      data: {
        subscription: {
          unsubscribe: () => console.log("Mock auth state change unsubscribed"),
        },
      },
    }
  }

  return supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Auth state changed:", event, session?.user?.id)

    if (session?.user) {
      try {
        const user = await getOrCreateUserFromCustomTable(session.user)

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user))
        }

        callback(user)
      } catch (error) {
        console.error("Error in onAuthStateChange:", error)
        callback(null)
      }
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user")
      }
      callback(null)
    }
  })
}

// Función para verificar si el usuario actual está autenticado
export async function checkAuthStatus(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return getCurrentUser()
  }

  try {
    console.log("Checking auth status")

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error checking auth status:", error)
      return null
    }

    if (!session?.user) {
      console.log("No active session found")
      return null
    }

    console.log("Active session found for user:", session.user.id)

    try {
      const user = await getOrCreateUserFromCustomTable(session.user)

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user))
      }

      return user
    } catch (error) {
      console.error("Error getting user from custom table:", error)
      return null
    }
  } catch (error) {
    console.error("Error checking auth status:", error)
    return null
  }
}

// Función mejorada para actualizar los datos del usuario desde la base de datos
export async function refreshUserData(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return getCurrentUser()
  }

  try {
    console.log("Refreshing user data")

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return null
    }

    // Usar la función auxiliar para obtener datos actualizados
    const user = await getOrCreateUserFromCustomTable(session.user)

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user))
    }

    return user
  } catch (error) {
    console.error("Error refreshing user data:", error)
    return null
  }
}

// Función para actualizar el role de un usuario (usando email)
export async function updateUserRole(
  userEmail: string,
  newRole: "user" | "staff" | "admin",
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Funcionalidad no disponible en modo desarrollo" }
  }

  try {
    console.log("Updating user role:", userEmail, "to", newRole)

    const { error } = await supabase.from("users").update({ role: newRole }).eq("email", userEmail)

    if (error) {
      console.error("Error updating user role:", error)
      return { success: false, error: error.message }
    }

    console.log("User role updated successfully")
    return { success: true, error: null }
  } catch (error) {
    console.error("Error in updateUserRole:", error)
    return { success: false, error: "Error al actualizar role del usuario" }
  }
}

// Función para verificar si el usuario es admin
export function isAdmin(user: User | null): boolean {
  return user?.role === "admin"
}

// Función para verificar si el usuario tiene un rol específico
export function hasRole(user: User | null, role: "user" | "staff" | "admin"): boolean {
  return user?.role === role
}

// Función para verificar si el usuario es staff o admin
export function isStaffOrAdmin(user: User | null): boolean {
  return user?.role === "staff" || user?.role === "admin"
}
