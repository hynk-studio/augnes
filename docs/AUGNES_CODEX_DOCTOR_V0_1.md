# Augnes Codex Doctor v0.1

User goal:

```text
Codex, prepare Augnes.
```

This doctor/setup path makes that request concrete. Codex can diagnose the
checkout, run only safe finite setup steps when explicitly confirmed, and report
what remains for the user to start manually.

The design is intentionally local, bounded, and understandable for non-expert
users. It does not ask the user to assemble setup instructions from README,
AGENTS.md, bridge docs, plugin docs, and package scripts.

## Commands

Passive bootstrap:

```bash
npm run augnes:codex-bootstrap
```

Read-only doctor:

```bash
npm run augnes:doctor
```

Doctor JSON output:

```bash
npm run augnes:doctor -- --json
```

Doctor PR-ready report output:

```bash
npm run augnes:doctor -- --report
```

Safe local demo setup dry run:

```bash
npm run augnes:setup-local-demo
```

Safe local demo setup execution:

```bash
npm run augnes:setup-local-demo -- --yes
```

## Bootstrap vs Doctor vs Setup

### Bootstrap

`npm run augnes:codex-bootstrap` is passive orientation. It checks basic local
context, generates or validates the repo-local `.codex/config.toml.example`, and
prints recommended setup commands. It does not install packages, mutate the DB,
or start servers.

Use bootstrap when Codex needs to understand how Augnes is wired.

### Doctor

`npm run augnes:doctor` is read-only diagnosis. It checks:

- repository root
- git status
- Node.js version
- npm version
- required files
- root `node_modules`
- `apps/augnes_apps/node_modules`
- required package scripts
- `temp_demo_db` readiness at `/tmp/augnes-demo.db`
- `runtime_state_brief` readiness at
  `http://localhost:3000/api/state/brief?scope=project:augnes`
- local MCP bridge endpoint reachability at `http://localhost:8787/mcp`

Doctor prints recommended next actions and skipped reasons.
`temp_demo_db` checks only `/tmp/augnes-demo.db`. It first warns with
`missing_temp_demo_db` when that file is absent. If the path is a symlink,
doctor warns with `symlink_temp_demo_db` and does not open it, so the check
does not follow `/tmp/augnes-demo.db` to a default or user DB path. When the
file exists as a regular file, doctor uses read-only SQLite inspection to check
for core Augnes tables and seeded demo rows. If the file exists but cannot be
inspected, or readiness cannot be proven, doctor warns with a concrete reason
and says guarded setup may be useful.
`runtime_state_brief` requires HTTP 200 and a successful Augnes state brief response with `runtime: "augnes"` and `scope: "project:augnes"`.
A 404 from an unrelated service on port `3000` is a warning, not a pass.

The MCP bridge check is endpoint reachability only. It may report that
`http://localhost:8787/mcp` answered locally, but MCP tool calls are not tested.

Doctor does not install packages, mutate databases, create, migrate, seed,
delete, chmod, or write `/tmp/augnes-demo.db`, start servers, read secrets,
call providers, call Codex SDK, call GitHub APIs, write
`~/.codex/config.toml`, create proof/evidence rows, or commit/reject Augnes
state.

Use doctor when the user says "Codex, prepare Augnes" and Codex needs to know
what is already ready and what remains.

### Safe Local Demo Setup

`npm run augnes:setup-local-demo` is a dry run by default. It prints the exact
finite setup commands that would run.

`npm run augnes:setup-local-demo -- --yes` executes only:

```bash
npm install
npm --prefix apps/augnes_apps install
AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:reset
AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:migrate
AUGNES_DB_PATH=/tmp/augnes-demo.db npm run demo:seed
```

The setup script uses `/tmp/augnes-demo.db` by default. It does not use the
default production or user DB path.

It does not require `OPENAI_API_KEY`, does not run `npm run dev`, and does not
start the MCP bridge.

After setup, it prints the exact long-running commands for the user or Codex
terminal to start manually:

```bash
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

```bash
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
```

## What Codex Can Do Automatically

When the user asks Codex to prepare Augnes, Codex may:

- run `npm run augnes:codex-bootstrap`
- run `npm run augnes:doctor`
- run `npm run augnes:doctor -- --json`
- run `npm run augnes:doctor -- --report`
- run `npm run augnes:setup-local-demo` as a dry run
- run `npm run augnes:setup-local-demo -- --yes` only when the user explicitly
  authorizes setup execution
- report missing dependencies, missing required files, dirty git state, local
  runtime state brief readiness, MCP bridge endpoint reachability, skipped
  checks, and exact next commands

Codex may run the finite setup command after explicit authorization because it
is limited to package installation and temp demo DB reset/migrate/seed steps.

## What Codex Must Not Do Automatically

Codex must not automatically:

- write `~/.codex/config.toml`
- read secrets
- handle tokens
- require `OPENAI_API_KEY` for basic local setup
- call provider or model APIs
- call Codex SDK
- call GitHub APIs
- mutate GitHub
- change DB schema
- write proof/evidence rows
- commit or reject Augnes state
- create perspective-memory items
- create product persistence boundary records
- expand Core/runtime authority
- merge, approve, publish, retry, replay, or enable auto-merge
- externally post results
- start hidden background daemons
- implement "Run Codex from ChatGPT" behavior
- start long-running servers unless the user explicitly asks for that terminal
  action

## Safe Temp DB Default

The setup script uses:

```text
/tmp/augnes-demo.db
```

This prevents accidental use of a production, durable, or user-specific Augnes
database during the basic local demo path.

Doctor uses the same path for the `temp_demo_db` readiness check. It rejects
symlinks before read-only SQLite inspection and does not inspect the default
production DB path or user-specific DB paths.

The runtime start command repeats the same path:

```bash
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

## Skipped Reason Policy

Doctor and setup output should say exactly what was not run and why.

Expected skipped reasons include:

- local Augnes runtime startup skipped because `npm run dev` is long-running
- local MCP bridge startup skipped because bridge dev server startup is
  long-running
- provider setup skipped because basic local demo setup does not require
  `OPENAI_API_KEY`
- MCP tool calls skipped because this PR checks only MCP endpoint reachability
  and does not call MCP tools

`runtime_state_brief` requires a successful state brief response. Non-200
responses, invalid JSON, or JSON without `runtime: "augnes"` and
`scope: "project:augnes"` are warnings with concrete details.

The MCP bridge check is endpoint reachability only. It does not prove that
Augnes bridge tools are registered, callable, or semantically healthy.

Unreachable local health checks are not proof of failure. They mean the user has
not started the corresponding local server yet, or it is listening somewhere
else.

PR #545 dogfood found that prepare under-recommended setup when dependency
directories existed but `/tmp/augnes-demo.db` was absent. The `temp_demo_db`
check exists so doctor and prepare can recommend the guarded setup path for
fresh temp demo DB readiness, not only missing package directories.

## JSON Output

Use JSON output when Codex needs machine-readable status:

```bash
npm run augnes:doctor -- --json
```

The JSON includes:

- `overall_state`
- `repository_root`
- `checks`
- `recommended_next_actions`
- `skipped_reasons`
- `boundary`

## Report Output

Use report output when Codex needs a PR-ready block:

```bash
npm run augnes:doctor -- --report
```

The report includes:

- overall state
- repository root
- checks
- recommended next actions
- skipped checks
- boundary

## How This Helps Non-expert Users

The user can ask "Codex, prepare Augnes" without knowing which files to read or
which commands are safe. Codex can run doctor mode first, explain what is
missing, ask before finite setup, and leave long-running server startup as an
explicit user-visible action.

This keeps local setup helpful without turning Augnes into an autonomous
runtime, provider, GitHub, approval, memory, or persistence controller.

## Verification

```bash
npm run smoke:augnes-codex-doctor
```

The smoke verifies script wiring, JSON/report support, dry-run setup behavior,
allowed finite setup commands, no dev-server startup, no secret reads, no
provider calls, no Codex SDK calls, no GitHub API calls, no user-level Codex
config writes, and required docs/report boundary statements.
