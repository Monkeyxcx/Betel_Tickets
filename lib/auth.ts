import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

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
      return { user: null, error: authError.message }
    }

    if (authData.user) {
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
    return { user: null, error: "Error al registrar usuario" }
  }
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // Intentar login con Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
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
      // Obtener datos del usuario de nuestra tabla
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()

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
      return { user: null, error: error.message }
    }

    return { user: null, error: null } // El usuario se manejará en el callback
  } catch (error) {
    return { user: null, error: "Error al iniciar sesión con Google" }
  }
}

export async function signOut(): Promise<void> {
  try {
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
    if (session?.user) {
      // Obtener datos del usuario
      const { data: userData } = await supabase.from("users").select("*").eq("id", session.user.id).single()

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
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return null
    }

    // Obtener datos del usuario de nuestra tabla
    const { data: userData } = await supabase.from("users").select("*").eq("id", session.user.id).single()

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
