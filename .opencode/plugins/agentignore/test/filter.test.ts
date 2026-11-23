import assert from "node:assert/strict"
import { test } from "node:test"
import { filterContent, filterText, inputPaths, inputPatterns, literalPrefix } from "../filter.ts"

const ignored = (path: string) => /(^|\/)(debug\.log|pnpm-lock\.yaml)$/.test(path)

test("grep: drops ignored files with their match lines and fixes the count", () => {
  const output = [
    "Found 3 matches",
    "/p/a.ts:",
    "  Line 1: TOKEN",
    "",
    "/p/debug.log:",
    "  Line 1: TOKEN",
    "  Line 2: TOKEN",
  ].join("\n")
  const result = filterText(output, ignored)
  assert.equal(result.count, 1)
  assert.equal(result.text, "Found 1 matches\n/p/a.ts:\n  Line 1: TOKEN")
})

test("grep: replaces the output when every match is ignored", () => {
  const result = filterText("Found 1 matches\n/p/debug.log:\n  Line 1: x", ignored)
  assert.equal(result.count, 0)
  assert.match(result.text, /ignored by \.agentignore/)
})

test("grep: leaves clean output unchanged", () => {
  const output = "Found 1 matches\n/p/a.ts:\n  Line 3: foo"
  assert.deepEqual(filterText(output, ignored), { text: output, count: 1 })
})

test("grep: keeps match lines that contain a colon", () => {
  const output = "Found 1 matches\n/p/a.ts:\n  Line 3: const x: number = 1"
  assert.equal(filterText(output, ignored).text, output)
})

test("grep: passes through a no-match result", () => {
  assert.equal(filterText("No matches found", ignored).text, "No matches found")
})

test("glob: drops ignored path lines and counts the rest", () => {
  const output = "/p/a.ts\n/p/pnpm-lock.yaml\n/p/src/b.ts"
  const result = filterContent([{ type: "text", text: output }], ignored)
  assert.equal(result.count, 2)
  assert.deepEqual(result.content, [{ type: "text", text: "/p/a.ts\n/p/src/b.ts" }])
})

test("glob: string content is filtered the same way", () => {
  const result = filterContent("/p/a.ts\n/p/debug.log", ignored)
  assert.deepEqual(result, { content: "/p/a.ts", count: 1 })
})

test("file attachments with ignored URIs are removed", () => {
  const result = filterContent(
    [
      { type: "file", uri: "file:///p/debug.log", mime: "text/plain" },
      { type: "file", uri: "file:///p/a.ts", mime: "text/plain" },
    ],
    ignored,
  )
  assert.equal(result.count, 1)
  assert.equal((result.content as { uri: string }[])[0].uri, "file:///p/a.ts")
})

test("inputPaths reads path and every patch target", () => {
  assert.deepEqual(inputPaths("read", { path: "a.ts" }), ["a.ts"])
  const patchText = [
    "*** Begin Patch",
    "*** Add File: new.ts",
    "*** Update File: old.ts",
    "*** Move to: moved.ts",
    "*** Delete File: gone.ts",
    "*** End Patch",
  ].join("\n")
  assert.deepEqual(inputPaths("patch", { patchText }), ["new.ts", "old.ts", "gone.ts", "moved.ts"])
  assert.deepEqual(inputPaths("read", null), [])
})

test("inputPatterns and literalPrefix extract the searchable directory", () => {
  assert.deepEqual(inputPatterns({ pattern: "build/**", include: "*.ts", other: 1 }), ["build/**", "*.ts"])
  assert.equal(literalPrefix("build/**"), "build")
  assert.equal(literalPrefix("src/lib/*.ts"), "src/lib")
  assert.equal(literalPrefix("**/*.ts"), undefined)
  assert.equal(literalPrefix("docs/"), "docs")
})
