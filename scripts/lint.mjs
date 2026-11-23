#!/usr/bin/env node
// Static checks for the template's own configuration. Dependency-free.
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const errors = []
const fail = (message) => errors.push(message)

// The agentignore plugin is optional; its tests need Node to strip TypeScript.
const hasPlugin = existsSync(".opencode/plugins/agentignore")
const [major, minor] = process.versions.node.split(".").map(Number)
if (hasPlugin && (major < 22 || (major === 22 && minor < 18))) {
  fail(`Node.js 22.18+ is required to run the plugin tests (found ${process.versions.node})`)
}

// Walks JSONC, skipping string contents, and drops comments and trailing commas.
function stripJsonc(text) {
  let out = ""
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      let j = i + 1
      while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1
      out += text.slice(i, j + 1)
      i = j
    } else if (char === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++
      out += "\n"
    } else if (char === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2)
      if (end === -1) throw new Error("unterminated block comment")
      i = end + 1
    } else {
      out += char
    }
  }
  let result = ""
  for (let i = 0; i < out.length; i++) {
    const char = out[i]
    if (char === '"') {
      let j = i + 1
      while (j < out.length && out[j] !== '"') j += out[j] === "\\" ? 2 : 1
      result += out.slice(i, j + 1)
      i = j
    } else if (char === ",") {
      const next = out.slice(i + 1).match(/^\s*(.)/)?.[1]
      if (next !== "}" && next !== "]") result += char
    } else {
      result += char
    }
  }
  return result
}

function frontmatter(path, required) {
  const lines = readFileSync(path, "utf8").split("\n")
  if (lines[0] !== "---") return fail(`${path}: missing frontmatter`)
  const end = lines.indexOf("---", 1)
  if (end === -1) return fail(`${path}: unterminated frontmatter`)
  const keys = new Set(lines.slice(1, end).map((line) => line.match(/^([A-Za-z_-]+):/)?.[1]))
  for (const key of required) {
    if (!keys.has(key)) fail(`${path}: frontmatter is missing "${key}"`)
  }
}

try {
  const config = JSON.parse(stripJsonc(readFileSync("opencode.jsonc", "utf8")))
  if (!Array.isArray(config.permissions)) fail("opencode.jsonc: `permissions` must be an array")
} catch (error) {
  fail(`opencode.jsonc: ${error.message}`)
}

for (const file of existsSync(".opencode/agents") ? readdirSync(".opencode/agents") : []) {
  if (file.endsWith(".md")) frontmatter(join(".opencode/agents", file), ["description", "mode"])
}
for (const file of existsSync(".opencode/commands") ? readdirSync(".opencode/commands") : []) {
  if (!file.endsWith(".md")) continue
  const path = join(".opencode/commands", file)
  const lines = readFileSync(path, "utf8").split("\n")
  const end = lines[0] === "---" ? lines.indexOf("---", 1) : -1
  if (lines[0] === "---" && end === -1) fail(`${path}: unterminated frontmatter`)
  if (lines.slice(1, Math.max(end, 1)).some((line) => line.startsWith("template:"))) {
    fail(`${path}: do not set \`template\` in frontmatter; the body is the prompt`)
  }
  if (!lines.slice(end + 1).join("").trim()) fail(`${path}: empty prompt body`)
}
for (const dir of existsSync(".opencode/skills") ? readdirSync(".opencode/skills") : []) {
  const skill = join(".opencode/skills", dir, "SKILL.md")
  if (!existsSync(skill)) fail(`${join(".opencode/skills", dir)}: missing SKILL.md`)
  else frontmatter(skill, ["name", "description"])
}

if (!existsSync(".githooks/pre-commit")) fail(".githooks/pre-commit: missing")
if (hasPlugin) {
  for (const file of [".agentignore", ".opencode/plugins/agentignore/index.ts"]) {
    if (!existsSync(file)) fail(`${file}: missing (remove the whole plugin or restore this file)`)
  }
}

if (errors.length > 0) {
  for (const message of errors) console.error(`lint: ${message}`)
  process.exit(1)
}
console.log("lint: ok")
