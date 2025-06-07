import { supabase } from "./supabase"

export interface User {
  id: string
  email: string
  name: string
  role: "user" | "staff" | "admin"
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
  if (!isSupabaseConfigured()) {
    // Mock successful signup for development
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

    // Registrar usuario en Supabase Auth sin confirmación de email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: undefined, // No requerir confirmación
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      return { user: null, error: authError.message }
    }

    if (authData.user) {
      console.log("User signed up successfully:", authData.user.id)

      // Crear usuario en nuestra tabla personalizada con role por defecto
      const { data: userData, error: userError } = await supabase
        .from("users")
        .upsert([
          {
            id: authData.user.id,
            email: authData.user.email,
            name: name,
            role: "user", // Role por defecto
          },
        ])
        .select()
        .single()

      if (userError) {
        console.error("Error creating user record:", userError)
        // Continuar aunque falle la inserción en la tabla personalizada
      }

      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        name: name,
        role: "user",
      }

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
  // Verificar si Supabase está configurado
  if (!isSupabaseConfigured()) {
    console.log("Using mock authentication - Supabase not configured")

    // Mock successful signin for development
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

  // Solo usar Supabase si está configurado
  try {
    console.log("Attempting to sign in user with Supabase:", email)

    // Intentar login con Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("Auth signin error:", authError)
      // Personalizar mensajes de error
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

      // Obtener datos del usuario de nuestra tabla incluyendo el role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (userError) {
        console.error("Error fetching user data:", userError)
      }

      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        name: userData?.name || authData.user.user_metadata?.name || "Usuario",
        role: userData?.role || "user",
      }

      // Guardar en localStorage
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

    return { user: null, error: null } // El usuario se manejará en el callback
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

// Función para manejar cambios de autenticación
export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!isSupabaseConfigured()) {
    // Return a mock subscription for development
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
      // Obtener datos del usuario incluyendo role
      const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

      if (error) {
        console.error("Error fetching user data on auth change:", error)
      }

      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        name: userData?.name || session.user.user_metadata?.name || "Usuario",
        role: userData?.role || "user",
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user))
      }
      callback(user)
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
    // Check localStorage for mock user
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

    // Obtener datos del usuario de nuestra tabla incluyendo role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
    }

    const user: User = {
      id: session.user.id,
      email: session.user.email!,
      name: userData?.name || session.user.user_metadata?.name || "Usuario",
      role: userData?.role || "user",
    }

    // Actualizar localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user))
    }

    return user
  } catch (error) {
    console.error("Error checking auth status:", error)
    return null
  }
}

// Función para actualizar el role de un usuario (solo admins)
export async function updateUserRole(
  userId: string,
  newRole: "user" | "staff" | "admin",
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Funcionalidad no disponible en modo desarrollo" }
  }

  try {
    console.log("Updating user role:", userId, "to", newRole)

    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId)

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
