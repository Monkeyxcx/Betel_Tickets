import { rmSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(process.cwd())
const nextDir = resolve(root, ".next")

try {
  rmSync(nextDir, { recursive: true, force: true })
} catch {
  // ignore
}
