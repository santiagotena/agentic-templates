import { Plugin } from "@opencode/plugin"
import { readFile, stat } from "node:fs/promises"
import { isAbsolute, join, relative, resolve, sep } from "node:path"
import { filterContent, inputPaths, inputPatterns, literalPrefix } from "./filter"
import { compileRules, isIgnoredPath, type Rule } from "./ignore"

const IGNORE_FILE = ".agentignore"
const GUARDED = new Set(["read", "edit", "write", "patch", "glob", "grep"])
const MUTATING = new Set(["edit", "write", "patch"])

export default Plugin.define({
  id: "agentignore",
  async setup(ctx) {
    const root = ctx.location.directory
    const ignorePath = join(root, IGNORE_FILE)
    let cache: { mtimeMs: number; rules: Rule[] } | undefined

    async function loadRules(): Promise<Rule[]> {
      try {
        const info = await stat(ignorePath)
        if (cache?.mtimeMs === info.mtimeMs) return cache.rules
        const rules = compileRules(await readFile(ignorePath, "utf8"))
        cache = { mtimeMs: info.mtimeMs, rules }
        return rules
      } catch {
        cache = undefined
        return []
      }
    }

    function relativePath(path: string): string | undefined {
      const absolute = resolve(root, path)
      const rel = relative(root, absolute)
      if (!rel || rel.startsWith("..") || isAbsolute(rel)) return undefined
      return rel.split(sep).join("/")
    }

    function matcher(rules: Rule[]): (path: string) => boolean {
      return (path) => {
        const rel = relativePath(path)
        return rel ? isIgnoredPath(rules, rel) : false
      }
    }

    await ctx.tool.hook("execute.before", async (event) => {
      if (!GUARDED.has(event.tool)) return
      const ignored = matcher(await loadRules())
      const paths = inputPaths(event.tool, event.input)
      if (MUTATING.has(event.tool) && paths.some((path) => relativePath(path) === IGNORE_FILE)) {
        throw new Error(`${IGNORE_FILE} is maintained by the user; ask before changing it`)
      }
      for (const path of paths) {
        if (ignored(path)) {
          throw new Error(`${IGNORE_FILE}: refusing to ${event.tool} ignored path "${path}"`)
        }
      }
      if (event.tool === "glob" || event.tool === "grep") {
        for (const pattern of inputPatterns(event.input)) {
          const prefix = literalPrefix(pattern)
          if (prefix && ignored(prefix)) {
            throw new Error(`${IGNORE_FILE}: refusing to search ignored path "${prefix}"`)
          }
        }
      }
    })

    await ctx.tool.hook("execute.after", async (event) => {
      if (event.status !== "completed") return
      if (event.tool !== "glob" && event.tool !== "grep") return
      if (event.result.content === undefined) return

      const ignored = matcher(await loadRules())
      const filtered = filterContent(event.result.content, ignored)
      const metadata =
        event.tool === "glob"
          ? { ...event.result.metadata, count: filtered.count }
          : { ...event.result.metadata, matches: filtered.count }
      event.result = {
        ...event.result,
        content: filtered.content as typeof event.result.content,
        metadata,
      }
    })
  },
})
