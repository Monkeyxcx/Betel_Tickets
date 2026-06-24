import { createClient } from "@supabase/supabase-js"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")

function parseEnv(content) {
  const out = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

async function loadDotEnvLocal() {
  try {
    const envPath = path.join(projectRoot, ".env.local")
    const content = await fs.readFile(envPath, "utf8")
    const parsed = parseEnv(content)
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === undefined) process.env[k] = v
    }
  } catch {}
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith("--")) continue
    const key = a.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith("--")) out[key] = true
    else {
      out[key] = next
      i++
    }
  }
  return out
}

function asInt(value, fallback) {
  if (value === undefined) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? Math.floor(n) : fallback
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function addDays(base, days) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function normalizeCategoriesArg(value) {
  if (!value || value === "all") return null
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

const CATEGORY_LABELS = {
  musica: "Música",
  teatro: "Teatro",
  deportes: "Deportes",
  conferencia: "Conferencia",
  festival: "Festival",
  cristiano: "Cristiano",
  otro: "Otro",
}

const DEFAULT_CATEGORIES = Object.keys(CATEGORY_LABELS)

async function resolveCreatorId({ supabase, creatorId, creatorEmail }) {
  if (creatorId) return creatorId

  if (creatorEmail) {
    const { data, error } = await supabase.from("users").select("id").eq("email", creatorEmail).single()
    if (error || !data?.id) throw new Error(`No se encontró el usuario por email: ${creatorEmail}`)
    return data.id
  }

  const { data, error } = await supabase.from("users").select("id").eq("role", "admin").limit(1)
  if (error) throw new Error(`No se pudo consultar un admin en la tabla users: ${error.message}`)
  const first = Array.isArray(data) ? data[0] : null
  if (!first?.id) throw new Error("No hay usuarios admin en la tabla users. Pasa --creator-id o --creator-email.")
  return first.id
}

function buildEvent({ prefix, category, index, featured, creatorId, startDays, spreadDays }) {
  const label = CATEGORY_LABELS[category] ?? category
  const baseDate = addDays(new Date(), startDays)
  const offsetDays = Math.max(0, Math.floor(Math.random() * spreadDays))
  const start = addDays(baseDate, offsetDays)
  start.setHours(pickRandom([10, 12, 16, 18, 20, 21]), pickRandom([0, 15, 30, 45]), 0, 0)

  const locations = [
    "Auditorio Principal",
    "Teatro Central",
    "Coliseo",
    "Centro de Convenciones",
    "Plaza Principal",
    "Iglesia Betel",
    "Salón Multiusos",
  ]

  const name = `${prefix} ${label} ${index + 1}`
  const description = `Evento de ${label}. Entrada general disponible.`
  const location = pickRandom(locations)

  return {
    name,
    description,
    event_date: start.toISOString(),
    location,
    image_url: null,
    category,
    featured: Boolean(featured),
    creator_id: creatorId,
    status: "active",
  }
}

async function main() {
  await loadDotEnvLocal()

  const args = parseArgs(process.argv.slice(2))
  const count = Math.max(1, asInt(args.count, 3))
  const startDays = Math.max(0, asInt(args["start-days"], 2))
  const spreadDays = Math.max(1, asInt(args["spread-days"], 90))
  const featuredPerCategory = Math.max(0, asInt(args["featured-per-category"], 1))
  const prefix = String(args.prefix ?? "Seed:")
  const dryRun = Boolean(args["dry-run"])
  const clean = Boolean(args.clean)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Faltan env vars: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY")
    process.exit(2)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const requestedCategories = normalizeCategoriesArg(args.categories)
  const categories = requestedCategories ?? DEFAULT_CATEGORIES
  const unknown = categories.filter((c) => !DEFAULT_CATEGORIES.includes(c))
  if (unknown.length) {
    console.error(`Categorías inválidas: ${unknown.join(", ")}`)
    console.error(`Usa una de: ${DEFAULT_CATEGORIES.join(", ")}`)
    process.exit(2)
  }

  const creatorId = await resolveCreatorId({
    supabase,
    creatorId: args["creator-id"] ? String(args["creator-id"]) : null,
    creatorEmail: args["creator-email"] ? String(args["creator-email"]) : null,
  })

  if (clean && !dryRun) {
    const { error } = await supabase.from("events").delete().ilike("name", `${prefix}%`)
    if (error) {
      console.error(`No se pudo limpiar eventos previos con prefijo "${prefix}": ${error.message}`)
      process.exit(1)
    }
  }

  const rows = []
  for (const category of categories) {
    for (let i = 0; i < count; i++) {
      rows.push(
        buildEvent({
          prefix,
          category,
          index: i,
          featured: i < featuredPerCategory,
          creatorId,
          startDays,
          spreadDays,
        }),
      )
    }
  }

  if (dryRun) {
    console.log(JSON.stringify({ total: rows.length, creatorId, sample: rows.slice(0, Math.min(10, rows.length)) }, null, 2))
    return
  }

  const batchSize = 50
  let inserted = 0

  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize)
    const { error } = await supabase.from("events").insert(chunk)
    if (error) {
      console.error(`Error insertando eventos (batch ${i}-${i + chunk.length - 1}): ${error.message}`)
      process.exit(1)
    }
    inserted += chunk.length
  }

  console.log(JSON.stringify({ ok: true, inserted, categories, countPerCategory: count, prefix }, null, 2))
}

main().catch((err) => {
  console.error(err?.stack || String(err))
  process.exit(1)
})

