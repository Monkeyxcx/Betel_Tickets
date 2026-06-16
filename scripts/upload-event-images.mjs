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
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
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

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg"
  if (ext === ".png") return "image/png"
  if (ext === ".webp") return "image/webp"
  if (ext === ".gif") return "image/gif"
  if (ext === ".svg") return "image/svg+xml"
  return "application/octet-stream"
}

async function listFilesRecursive(dir) {
  const out = []
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) await walk(full)
      else if (entry.isFile()) out.push(full)
    }
  }
  await walk(dir)
  return out
}

function toPosix(p) {
  return p.split(path.sep).join("/")
}

async function main() {
  await loadDotEnvLocal()

  const baseDirArg = process.argv[2]
  const bucket = process.argv[3] ?? "event-images"

  if (!baseDirArg) {
    console.error("Missing argument: baseDir")
    process.exit(2)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const keyToUse = serviceRoleKey || anonKey
  if (!supabaseUrl || !keyToUse) {
    console.error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).")
    process.exit(2)
  }

  const supabase = createClient(supabaseUrl, keyToUse)
  const baseDir = path.resolve(baseDirArg)
  const files = await listFilesRecursive(baseDir)
  files.sort((a, b) => a.localeCompare(b))

  let ok = 0
  let failed = 0
  const failures = []

  for (const filePath of files) {
    const rel = path.relative(baseDir, filePath)
    const objectKey = toPosix(rel)
    const contentType = contentTypeFor(filePath)
    const body = await fs.readFile(filePath)
    const { error } = await supabase.storage
      .from(bucket)
      .upload(objectKey, body, { upsert: true, contentType })

    if (error) {
      failed++
      failures.push({ objectKey, message: error.message })
      continue
    }

    ok++
  }

  console.log(JSON.stringify({ bucket, baseDir, total: files.length, ok, failed }, null, 2))

  if (failures.length) {
    for (const f of failures.slice(0, 50)) {
      console.log(`FAILED ${f.objectKey} :: ${f.message}`)
    }
    if (failures.length > 50) console.log(`...and ${failures.length - 50} more`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err?.stack || String(err))
  process.exit(1)
})

