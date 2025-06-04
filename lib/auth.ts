import { supabase } from "./supabase"

export interface User {
  id: string
  email: string
  name: string
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ user: User | null; error: string | null }> {
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

      // Crear usuario en nuestra tabla personalizada
      const { data: userData, error: userError } = await supabase
        .from("users")
        .upsert([
          {
            id: authData.user.id,
            email: authData.user.email,
            name: name,
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
  try {
    console.log("Attempting to sign in user:", email)

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

      // Obtener datos del usuario de nuestra tabla
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
    await supabase.auth.signOut()
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
  return supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Auth state changed:", event, session?.user?.id)

    if (session?.user) {
      // Obtener datos del usuario
      const { data: userData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

      if (error) {
        console.error("Error fetching user data on auth change:", error)
      }

      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        name: userData?.name || session.user.user_metadata?.name || "Usuario",
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

    // Obtener datos del usuario de nuestra tabla
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
