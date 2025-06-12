import { supabase } from "./supabase"

export interface User {
  id: string
  email: string
  name: string
  role: string
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ user: User | null; error: string | null }> {
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
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      return { user: null, error: authError.message }
    }

    if (authData.user) {
      console.log("User signed up successfully:", authData.user.id)

      // Crear usuario en nuestra tabla personalizada con rol por defecto
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert([
          {
            id: authData.user.id,
            email: authData.user.email,
            name: name,
            role: "user", // Rol por defecto
          },
        ])
        .select()
        .single()

      if (userError) {
        console.error("Error creating user record:", userError)
        // Si falla la inserción, crear usuario con datos básicos
        const user: User = {
          id: authData.user.id,
          email: authData.user.email!,
          name: name,
          role: "user",
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user))
        }

        return { user, error: null }
      }

      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        name: userData.name,
        role: userData.role,
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

      // Obtener datos del usuario de nuestra tabla personalizada
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (userError) {
        console.error("Error fetching user data from users table:", userError)

        // Si el usuario no existe en nuestra tabla, crearlo
        const { data: newUserData, error: createError } = await supabase
          .from("users")
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              name: authData.user.user_metadata?.name || authData.user.user_metadata?.full_name || "Usuario",
              role: "user",
            },
          ])
          .select()
          .single()

        if (createError) {
          console.error("Error creating user record:", createError)
          // Fallback: usar datos básicos
          const user: User = {
            id: authData.user.id,
            email: authData.user.email!,
            name: authData.user.user_metadata?.name || authData.user.user_metadata?.full_name || "Usuario",
            role: "user",
          }

          if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(user))
          }

          return { user, error: null }
        }

        const user: User = {
          id: authData.user.id,
          email: authData.user.email!,
          name: newUserData.name,
          role: newUserData.role,
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(user))
        }

        return { user, error: null }
      }

      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        name: userData.name,
        role: userData.role,
      }

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

    return { user: null, error: null }
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

// Función auxiliar para crear/obtener usuario de nuestra tabla personalizada
async function getOrCreateUserFromCustomTable(authUser: any): Promise<User> {
  try {
    // Primero intentar obtener el usuario de nuestra tabla
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", authUser.email)
      .single()

    if (!fetchError && userData) {
      // Usuario existe en nuestra tabla
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      }
    }

    console.log("User not found in custom table, creating new record")

    // Si no existe, crear nuevo registro
    const { data: newUserData, error: createError } = await supabase
      .from("users")
      .insert([
        {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || "Usuario",
          role: "user",
        },
      ])
      .select()
      .single()

    if (createError) {
      console.error("Error creating user in custom table:", createError)
      // Log user data from users table before returning fallback
      const { data: existingUserData } = await supabase
        .from("users")
        .select("*")
        .eq("email", authUser.email)
        .single()
      console.log("Existing user data in table:", existingUserData)
      
      // Fallback: retornar usuario con datos básicos
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || "Usuario",
        role: "user",
      }
    }

    return {
      id: newUserData.id,
      email: newUserData.email,
      name: newUserData.name,
      role: newUserData.role,
    }
  } catch (error) {
    console.error("Error in getOrCreateUserFromCustomTable:", error)
    // Log user data from users table before returning fallback
    const { data: existingUserData } = await supabase
      .from("users")
      .select("*")
      .eq("email", authUser.email)
      .single()
    console.log("Existing user data in table:", existingUserData)
    
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
        // Fallback
        const fallbackUser: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || "Usuario",
          role: "user",
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(fallbackUser))
        }

        callback(fallbackUser)
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
      // Fallback
      const fallbackUser: User = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || "Usuario",
        role: "user",
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(fallbackUser))
      }

      return fallbackUser
    }
  } catch (error) {
    console.error("Error checking auth status:", error)
    return null
  }
}

// Función para actualizar los datos del usuario desde la base de datos
export async function refreshUserData(userId: string): Promise<User | null> {
  try {
    console.log("Refreshing user data for:", userId)

    // IMPORTANTE: Obtener datos de nuestra tabla personalizada, NO de auth.users
    const { data: userData, error } = await supabase
      .from("users") // Nuestra tabla personalizada
      .select("*")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error refreshing user data from users table:", error)

      // Si no existe en nuestra tabla, obtener de auth y crear
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        console.error("Error getting auth user:", authError)
        return null
      }

      // Crear usuario en nuestra tabla
      const { data: newUserData, error: createError } = await supabase
        .from("users")
        .insert([
          {
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || "Usuario",
            role: "user",
          },
        ])
        .select()
        .single()

      if (createError) {
        console.error("Error creating user record:", createError)
        return null
      }

      const user: User = {
        id: newUserData.id,
        email: newUserData.email,
        name: newUserData.name,
        role: newUserData.role,
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user))
      }

      return user
    }

    if (!userData) {
      console.log("No user data found for ID:", userId)
      return null
    }

    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    }

    // Actualizar localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user))
    }

    return user
  } catch (error) {
    console.error("Error in refreshUserData:", error)
    return null
  }
}

// Función para verificar si el usuario es admin
export function isAdmin(user: User | null): boolean {
  return user?.role === "admin"
}

// Función para verificar si el usuario tiene un rol específico
export function hasRole(user: User | null, role: string): boolean {
  return user?.role === role
}
