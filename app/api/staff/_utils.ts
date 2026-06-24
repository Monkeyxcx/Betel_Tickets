import { createClient, type User as AuthUser } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const allowedScannerRoles = new Set(["staff", "coordinator", "admin"])

type AppUserProfile = {
  id: string
  email: string
  name: string
  role: string
}

export function createAuthenticatedClient(authorizationHeader: string | null) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null
  }

  const accessToken = authorizationHeader.slice("Bearer ".length).trim()
  if (!accessToken) {
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })

  return { supabase, accessToken }
}

async function getOrCreateAppUserProfile(
  supabase: ReturnType<typeof createClient>,
  authUser: AuthUser,
): Promise<AppUserProfile | null> {
  const email = authUser.email?.trim().toLowerCase()
  if (!email) {
    return null
  }

  const { data: existingProfile, error: fetchError } = await supabase
    .from("users")
    .select("id, email, name, role")
    .eq("email", email)
    .single()

  if (!fetchError && existingProfile) {
    return existingProfile
  }

  const { data: createdProfile, error: createError } = await supabase
    .from("users")
    .insert([
      {
        email,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || "Usuario",
        role: "user",
      },
    ])
    .select("id, email, name, role")
    .single()

  if (!createError && createdProfile) {
    return createdProfile
  }

  const { data: recoveredProfile, error: recoveredError } = await supabase
    .from("users")
    .select("id, email, name, role")
    .eq("email", email)
    .single()

  if (!recoveredError && recoveredProfile) {
    return recoveredProfile
  }

  return null
}

export async function requireAppUser(authorizationHeader: string | null) {
  const authClient = createAuthenticatedClient(authorizationHeader)
  if (!authClient) {
    return { error: "Sesion no valida" as const }
  }

  const {
    data: { user },
    error: authError,
  } = await authClient.supabase.auth.getUser(authClient.accessToken)

  if (authError || !user) {
    return { error: "Debes iniciar sesion para continuar" as const }
  }

  const profile = await getOrCreateAppUserProfile(authClient.supabase, user)
  if (!profile) {
    return { error: "No se pudo resolver el perfil del usuario" as const }
  }

  return {
    supabase: authClient.supabase,
    authUser: user,
    profile,
  }
}

export async function requireScannerUser(authorizationHeader: string | null) {
  const appUser = await requireAppUser(authorizationHeader)
  if ("error" in appUser) {
    return {
      error:
        appUser.error === "Debes iniciar sesion para continuar"
          ? ("Debes iniciar sesion para usar el escaner" as const)
          : appUser.error,
    }
  }

  if (!allowedScannerRoles.has(appUser.profile.role)) {
    return { error: "No tienes permisos para usar el escaner" as const }
  }

  return {
    supabase: appUser.supabase,
    authUser: appUser.authUser,
    profile: appUser.profile,
    role: appUser.profile.role,
  }
}
