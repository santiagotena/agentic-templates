import { resolve } from "node:path"

// Programs that only remove or create paths; they never expose file contents.
const NON_READING = new Set(["rm", "rmdir", "mkdir"])
// Programs that modify their path arguments.
const MUTATING = new Set(["rm", "mv", "cp", "tee", "truncate", "ln", "dd", "install"])
// Programs whose sources are only read; the last argument is the one written.
const DESTINATION_ONLY = new Set(["cp", "ln", "install"])
const EDITORS = new Set(["sed", "perl", "awk", "ed"])
const WRAPPERS = new Set(["sudo", "command", "exec", "time", "nohup", "env"])

export type Violation = { kind: "ignored" | "ignore-file"; path: string }

export type ShellCheck = {
  cwd: string
  ignored: (absolutePath: string) => boolean
  isIgnoreFile: (absolutePath: string) => boolean
  literalPrefix: (pattern: string) => string | undefined
}

function unquote(token: string): string {
  return token.replace(/^['"]+|['"]+$/g, "")
}

function program(tokens: string[]): string | undefined {
  for (const token of tokens) {
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(token)) continue
    if (WRAPPERS.has(token) || token.startsWith("-")) continue
    return token.split("/").pop()
  }
  return undefined
}

function candidates(token: string): string[] {
  const value = unquote(token)
  if (!value || value.includes("$") || value.startsWith("~")) return []
  const found: string[] = []
  const eq = value.indexOf("=")
  if (value.startsWith("-")) {
    if (eq > 0) found.push(unquote(value.slice(eq + 1)))
  } else {
    found.push(value)
    if (eq > 0) found.push(unquote(value.slice(eq + 1)))
  }
  return found.filter(Boolean)
}

/**
 * Best-effort scan of a shell command for ignored paths. It sees literal
 * path arguments and redirections; it cannot see paths built at runtime
 * (variables, command substitution, `cd dir && cat file`, nested scripts).
 */
export function checkShell(command: string, options: ShellCheck): Violation | undefined {
  const normalized = command.replace(/\d*>&\d*-?/g, " ").replace(/&>/g, ">")
  for (const segment of normalized.split(/[;|&\n]+/)) {
    const tokens = segment.split(/[\s()<>`]+/).filter(Boolean)
    if (tokens.length === 0) continue

    const name = program(tokens)
    const redirect = /(?:^|[^<>])>{1,2}[^>]/.test(segment) || />{1,2}$/.test(segment.trim())
    const mutates =
      redirect ||
      (name !== undefined && MUTATING.has(name)) ||
      (name !== undefined && EDITORS.has(name) && tokens.some((token) => /^-\w*i/.test(token)))
    const reads = name === undefined || !NON_READING.has(name)
    const destinationOnly = !redirect && name !== undefined && DESTINATION_ONLY.has(name)
    const destination = tokens.filter((token) => !token.startsWith("-")).at(-1)

    for (const token of tokens) {
      const writes = mutates && (!destinationOnly || token === destination)
      for (const value of candidates(token)) {
        const targets = [value]
        const prefix = options.literalPrefix(value)
        if (prefix && prefix !== value) targets.push(prefix)

        for (const target of targets) {
          const absolute = resolve(options.cwd, target)
          if (writes && options.isIgnoreFile(absolute)) {
            return { kind: "ignore-file", path: target }
          }
          if (reads && options.ignored(absolute)) {
            return { kind: "ignored", path: target }
          }
        }
      }
    }
  }
  return undefined
}
