export type Rule = {
  negated: boolean
  regex: RegExp
}

const SPECIAL = "\\^$+?.()|{}[]"

function globToRegExp(pattern: string, anchored: boolean): RegExp {
  let source = ""
  for (let index = 0; index < pattern.length; index++) {
    const char = pattern[index]
    if (char === "*") {
      if (pattern[index + 1] === "*") {
        while (pattern[index + 1] === "*") index++
        if (pattern[index + 1] === "/") {
          index++
          source += "(?:.*/)?"
        } else {
          source += ".*"
        }
      } else {
        source += "[^/]*"
      }
      continue
    }
    if (char === "?") {
      source += "[^/]"
      continue
    }
    if (SPECIAL.includes(char)) {
      source += `\\${char}`
      continue
    }
    source += char
  }
  return new RegExp(`${anchored ? "^" : "(?:^|.*/)"}${source}(?:/.*)?$`)
}

export function compileRules(text: string): Rule[] {
  const rules: Rule[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    let negated = false
    if (line.startsWith("!")) {
      negated = true
      line = line.slice(1)
    }
    if (line.startsWith("\\#") || line.startsWith("\\!")) line = line.slice(1)
    if (line.endsWith("/")) line = line.slice(0, -1)
    if (!line) continue
    const anchored = line.startsWith("/") || line.includes("/")
    if (line.startsWith("/")) line = line.slice(1)
    if (!line) continue
    rules.push({ negated, regex: globToRegExp(line, anchored) })
  }
  return rules
}

export function isIgnoredPath(rules: Rule[], relativePath: string): boolean {
  const normalized = relativePath
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "")
  if (!normalized || normalized === ".") return false
  const parts = normalized.split("/").filter(Boolean)
  let ignored = false
  for (let index = 1; index <= parts.length; index++) {
    const candidate = parts.slice(0, index).join("/")
    for (const rule of rules) {
      if (rule.regex.test(candidate)) ignored = !rule.negated
    }
  }
  return ignored
}
