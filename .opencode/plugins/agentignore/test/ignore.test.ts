import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { compileRules, isIgnoredPath } from "../ignore.ts"

const shipped = compileRules(readFileSync(new URL("../../../../.agentignore", import.meta.url), "utf8"))

test("shipped rules ignore dependencies, build output, and lockfiles", () => {
  for (const path of [
    "node_modules/foo/index.js",
    "packages/a/node_modules/x",
    "dist/app.js",
    "build/output/file",
    "pnpm-lock.yaml",
    "docs/pnpm-lock.yaml",
    "src/app.min.js",
    "a/b/c.log",
    ".git/config",
  ]) {
    assert.equal(isIgnoredPath(shipped, path), true, path)
  }
})

test("shipped rules ignore secrets but keep .env.example", () => {
  for (const path of [".env", ".env.local", "secrets/token", "certs/server.pem"]) {
    assert.equal(isIgnoredPath(shipped, path), true, path)
  }
  assert.equal(isIgnoredPath(shipped, ".env.example"), false)
})

test("shipped rules leave ordinary sources alone", () => {
  for (const path of ["src/index.ts", "src/app.js", "src/build-utils.ts", "docs/guide.md", "README.md"]) {
    assert.equal(isIgnoredPath(shipped, path), false, path)
  }
})

test("negation re-includes a path; the last matching rule wins", () => {
  const rules = compileRules("secrets/\n!secrets/public.txt\n")
  assert.equal(isIgnoredPath(rules, "secrets/private.txt"), true)
  assert.equal(isIgnoredPath(rules, "secrets/public.txt"), false)
})

test("** matches across directories", () => {
  const rules = compileRules("**/*.test.ts\n!src/keep.test.ts\n")
  assert.equal(isIgnoredPath(rules, "src/foo.test.ts"), true)
  assert.equal(isIgnoredPath(rules, "a/b/c/foo.test.ts"), true)
  assert.equal(isIgnoredPath(rules, "src/keep.test.ts"), false)
})

test("a pattern with a slash is anchored to the root", () => {
  const rules = compileRules("docs/generated\n")
  assert.equal(isIgnoredPath(rules, "docs/generated/a.md"), true)
  assert.equal(isIgnoredPath(rules, "pkg/docs/generated/a.md"), false)
})

test("comments, blank lines, and CRLF are tolerated", () => {
  const rules = compileRules("# comment\r\n\r\nsecret.txt\r\n")
  assert.equal(isIgnoredPath(rules, "secret.txt"), true)
  assert.equal(isIgnoredPath(rules, "# comment"), false)
})

test("empty and root paths are never ignored", () => {
  assert.equal(isIgnoredPath(shipped, ""), false)
  assert.equal(isIgnoredPath(shipped, "."), false)
})
