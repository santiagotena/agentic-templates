import { isAbsolute } from "node:path"

// Result text formats produced by the built-in search tools.
const GREP_SUMMARY = /^Found \d+ matches?/
const GREP_MATCH_LINE = /^\s+Line \d+:/
const GREP_NO_MATCHES = /^No matches found$/
const EMPTY = "No results (all matches are ignored by .agentignore)."

export type Content =
  | { type: "text"; text: string }
  | { type: "file"; uri: string; mime: string; name?: string }

export type Filtered = { content: string | Content[]; count: number }

export function inputPaths(tool: string, input: unknown): string[] {
  if (typeof input !== "object" || input === null) return []
  const value = input as Record<string, unknown>
  const paths: string[] = []
  if (typeof value.path === "string") paths.push(value.path)
  if (tool === "patch" && typeof value.patchText === "string") {
    for (const match of value.patchText.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)) {
      paths.push(match[1].trim())
    }
    for (const match of value.patchText.matchAll(/^\*\*\* Move to: (.+)$/gm)) {
      paths.push(match[1].trim())
    }
  }
  return paths
}

export function inputPatterns(input: unknown): string[] {
  if (typeof input !== "object" || input === null) return []
  const value = input as Record<string, unknown>
  return ["pattern", "include"]
    .map((key) => value[key])
    .filter((pattern): pattern is string => typeof pattern === "string")
}

/** The literal directory prefix of a glob pattern, when it has one. */
export function literalPrefix(pattern: string): string | undefined {
  const index = pattern.search(/[*?[]/)
  const prefix = (index === -1 ? pattern : pattern.slice(0, index)).replace(/\/+$/, "")
  return prefix || undefined
}

/** A grep result groups matches under a `path:` header line. */
function headerPath(line: string): string | undefined {
  const trimmed = line.trim()
  if (!trimmed.endsWith(":") || GREP_MATCH_LINE.test(line)) return undefined
  const candidate = trimmed.slice(0, -1)
  if (!candidate || candidate.includes(":") || /\s/.test(candidate)) return undefined
  if (!isAbsolute(candidate) && !/^[\w.@+-]/.test(candidate)) return undefined
  return candidate
}

export function filterText(
  text: string,
  ignored: (path: string) => boolean,
): { text: string; count: number } {
  const kept: string[] = []
  let dropping = false
  let dropped = false
  let count = 0
  let summary = false

  for (const line of text.split("\n")) {
    const header = headerPath(line)
    if (header !== undefined) {
      dropping = ignored(header)
      if (dropping) {
        dropped = true
        continue
      }
      kept.push(line)
      continue
    }
    if (GREP_MATCH_LINE.test(line)) {
      if (dropping) {
        dropped = true
        continue
      }
      count++
      kept.push(line)
      continue
    }
    if (dropping) {
      dropped = true
      continue
    }

    const trimmed = line.trim()
    if (GREP_SUMMARY.test(trimmed)) {
      summary = true
      kept.push(line)
      continue
    }
    if (GREP_NO_MATCHES.test(trimmed)) {
      kept.push(line)
      continue
    }
    if (trimmed && !/\s/.test(trimmed)) {
      // A bare path line, as returned by glob.
      if (ignored(trimmed)) {
        dropped = true
        continue
      }
      count++
    }
    kept.push(line)
  }

  const result = kept.join("\n").trim()
  if (!dropped) return { text: result, count }
  if (count === 0) return { text: EMPTY, count: 0 }
  if (summary) return { text: result.replace(GREP_SUMMARY, `Found ${count} matches`), count }
  return { text: result, count }
}

export function filterContent(
  content: string | readonly Content[],
  ignored: (path: string) => boolean,
): Filtered {
  if (typeof content === "string") {
    const filtered = filterText(content, ignored)
    return { content: filtered.text, count: filtered.count }
  }

  const kept: Content[] = []
  let count = 0
  for (const item of content) {
    if (item.type === "file") {
      let path: string | undefined
      if (item.uri.startsWith("file://")) {
        const raw = item.uri.slice("file://".length)
        try {
          path = decodeURIComponent(raw)
        } catch {
          path = raw
        }
      }
      if (!path || !ignored(path)) {
        kept.push(item)
        count++
      }
      continue
    }
    const filtered = filterText(item.text, ignored)
    count += filtered.count
    if (filtered.text) kept.push({ ...item, text: filtered.text })
  }
  return { content: kept, count }
}
