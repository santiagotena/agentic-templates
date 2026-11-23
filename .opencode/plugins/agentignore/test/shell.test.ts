import assert from "node:assert/strict"
import { relative } from "node:path"
import { test } from "node:test"
import { literalPrefix } from "../filter.ts"
import { compileRules, isIgnoredPath } from "../ignore.ts"
import { checkShell } from "../shell.ts"

const root = "/repo"
const rules = compileRules(".env\n.env.*\n!.env.example\nbuild/\nnode_modules/\n*.pem\nsecrets/\n")

function run(command: string, cwd = root) {
  return checkShell(command, {
    cwd,
    ignored: (path) => {
      const rel = relative(root, path)
      return !rel.startsWith("..") && isIgnoredPath(rules, rel)
    },
    isIgnoreFile: (path) => relative(root, path) === ".agentignore",
    literalPrefix,
  })
}

test("blocks commands that read ignored files", () => {
  for (const command of [
    "cat .env",
    "head -n 5 .env.local",
    "grep KEY .env",
    "cat < .env",
    "cat secrets/token",
    "ls -la build",
    "cat 'certs/server.pem'",
    "cat secrets/*",
    "cat ./.env",
    "FOO=1 cat .env",
    "sudo cat .env",
    "echo hi && cat .env",
    "echo hi | tee .env",
    "tar -czf out.tgz --files-from=.env",
  ]) {
    assert.equal(run(command)?.kind, "ignored", command)
  }
})

test("resolves paths against the working directory", () => {
  assert.equal(run("cat token", "/repo/secrets")?.kind, "ignored")
  assert.equal(run("cat token", "/repo/src"), undefined)
  assert.equal(run("cat ../.env", "/repo/src")?.kind, "ignored")
  assert.equal(run("cat ../secrets/token", "/repo/src")?.kind, "ignored")
})

test("allows ordinary commands", () => {
  for (const command of [
    "make check",
    "git status --short",
    "go test ./...",
    "pnpm install --frozen-lockfile",
    "cat .env.example",
    "cat src/index.ts",
    "echo $HOME/.env",
    "ls ~/.config",
    "make check 2>&1 | tail -5",
    "node --test src/",
  ]) {
    assert.equal(run(command), undefined, command)
  }
})

test("allows removing or creating ignored directories", () => {
  for (const command of ["rm -rf build", "rm -rf node_modules", "mkdir -p build", "rmdir build"]) {
    assert.equal(run(command), undefined, command)
  }
})

test("blocks changing .agentignore but not reading it", () => {
  for (const command of [
    "echo '*' >> .agentignore",
    "echo x > .agentignore",
    "sed -i '' 's/a/b/' .agentignore",
    "rm .agentignore",
    "mv .agentignore old",
    "tee .agentignore",
    "cp other .agentignore",
  ]) {
    assert.equal(run(command)?.kind, "ignore-file", command)
  }
  assert.equal(run("cp .agentignore backup"), undefined)
  assert.equal(run("cp -R .opencode .agentignore scripts /tmp/copy"), undefined)
  assert.equal(run("cat .agentignore"), undefined)
  assert.equal(run("grep node .agentignore"), undefined)
})

test("known limits: paths built or read indirectly are not detected", () => {
  assert.equal(run('cat "$(echo .e)nv"'), undefined)
  assert.equal(run("sh ./read-secrets.sh"), undefined)
  assert.equal(run('cat ".en""v"'), undefined)
})
