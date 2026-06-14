# Augnes Codex Doctor Report

Date: 2026-06-14

## Summary

This report records the Augnes Codex Doctor v0.1 and safe local demo setup path.
The change makes "Codex, prepare Augnes" actionable: Codex can diagnose the
repo, report what remains, and run a finite temp-DB setup only when explicitly
authorized with `--yes`.

## Files changed

- `docs/AUGNES_CODEX_DOCTOR_V0_1.md`
- `package.json`
- `reports/2026-06-14-augnes-codex-doctor.md`
- `scripts/augnes-codex-doctor.mjs`
- `scripts/augnes-codex-local-demo-setup.mjs`
- `scripts/smoke-augnes-codex-doctor.mjs`

## Behavior

Doctor mode is read-only by default:

```bash
npm run augnes:doctor
```

It checks repository root, git status, Node.js version, npm version, required
files, root `node_modules`, `apps/augnes_apps/node_modules`, required package
scripts, read-only `temp_demo_db` readiness at `/tmp/augnes-demo.db`, strict
`runtime_state_brief` readiness, and local MCP endpoint reachability.

The `temp_demo_db` check warns with `missing_temp_demo_db` when
`/tmp/augnes-demo.db` is absent. If the path is a symlink, doctor warns with
`symlink_temp_demo_db` and does not open it, so the check cannot follow
`/tmp/augnes-demo.db` to a default or user DB path. When the file exists as a
regular file, doctor inspects it as SQLite in read-only mode, checks for core
Augnes tables and seeded rows, and warns with concrete details if readiness
cannot be proven. This addresses the PR #545 dogfood finding that prepare
under-recommended setup when dependency directories existed but the temp demo DB
was absent or not ready.

`runtime_state_brief` requires HTTP 200 plus a successful Augnes state brief
response with `runtime: "augnes"` and `scope: "project:augnes"`. Non-200
responses, invalid JSON, or JSON without that minimal Augnes shape are warnings
with concrete details.

The local MCP bridge check is endpoint reachability only. It does not call MCP
tools and does not prove tool registration or tool semantics.

Doctor supports machine-readable and PR-ready output:

```bash
npm run augnes:doctor -- --json
npm run augnes:doctor -- --report
```

Safe local demo setup is dry-run by default:

```bash
npm run augnes:setup-local-demo
```

Execution requires:

```bash
npm run augnes:setup-local-demo -- --yes
```

The setup script executes only:

```bash
npm install
npm --prefix apps/augnes_apps install
AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-demo.db npm run demo:seed
```

After setup it prints explicit start commands for the local Augnes runtime and
local Augnes MCP bridge, and explains that those long-running servers were not
started.

## Boundary

This change improves local setup and doctor behavior only. It does not add
runtime authority, DB schema changes, DB writes in doctor, default/user DB
writes, secret handling, provider calls, model calls, Codex SDK execution,
GitHub API calls, GitHub mutation, merge automation, approval automation,
publication automation, retry/replay automation, auto-merge automation,
proof/evidence writes, perspective-memory item creation, product persistence
boundary records, hidden daemon behavior, "Run Codex from ChatGPT" behavior, or
Augnes state commit/reject authority.

The doctor `temp_demo_db` check inspects only `/tmp/augnes-demo.db`, does not
inspect default/user DB paths, rejects symlinks before read-only SQLite
inspection, and does not create, migrate, seed, write, delete, or chmod the DB.
The safe setup path uses `/tmp/augnes-demo.db` and does not require
`OPENAI_API_KEY`.

## Verification plan

- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## Skipped checks

- Local Augnes runtime startup is skipped because `npm run dev` is long-running
  and should remain an explicit user-visible terminal action.
- Local Augnes MCP bridge startup is skipped because bridge dev server startup
  is long-running and should remain explicit.
- MCP tool calls are skipped because this PR only performs endpoint reachability
  checks for the MCP bridge and does not call MCP tools.
- Provider/model checks are skipped because basic local setup must not require
  `OPENAI_API_KEY` or provider access.
- Browser validation is not required because this PR does not change a UI route
  or browser-visible component.

## Next recommended PR

Add an output-only `codex:read-local-context` command that summarizes the
current Augnes operating contract, doctor result, bootstrap pointers, plugin
install path, and local bridge start commands without calling runtime, DB,
providers, GitHub, Codex SDK, or MCP tools.
