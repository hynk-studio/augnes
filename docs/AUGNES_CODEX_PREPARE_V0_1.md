# Augnes Codex Prepare v0.1

User goal:

```text
Codex, prepare Augnes.
```

`npm run augnes:prepare` is the single guided entrypoint for that request. It
diagnoses the checkout, decides whether guarded local demo setup appears useful,
and produces a user/PR-ready report without asking non-expert users to choose
between bootstrap, doctor, setup, and bridge runbooks.

## Commands

Default human output:

```bash
npm run augnes:prepare
```

Machine-readable output:

```bash
npm run augnes:prepare -- --json
```

PR-ready report output:

```bash
npm run augnes:prepare -- --report
```

Explicit finite setup:

```bash
npm run augnes:prepare -- --yes
```

## How Prepare Differs From Bootstrap, Doctor, and Setup

Bootstrap:

- command: `npm run augnes:codex-bootstrap`
- purpose: passive orientation and setup-command printing
- writes only the repo-local `.codex/config.toml.example` when missing
- does not install packages, mutate DB, or start servers

Doctor:

- command: `npm run augnes:doctor`
- purpose: read-only diagnosis
- checks repo root, git status, Node.js, npm, required files, dependency
  directories, package scripts, read-only `/tmp/augnes-demo.db` readiness,
  strict runtime state brief readiness, and MCP endpoint reachability
- does not run setup

Setup:

- command: `npm run augnes:setup-local-demo -- --yes`
- purpose: finite local package and temp demo DB setup
- guarded by explicit `--yes`
- emits a structured setup summary for the wrapper to report
- does not start the runtime or MCP bridge

Prepare:

- command: `npm run augnes:prepare`
- purpose: guided wrapper for the user request "Codex, prepare Augnes"
- runs doctor JSON, parses it, decides whether setup appears useful, optionally
  delegates setup to the guarded setup script, reruns doctor after setup, and
  prints next actions
- prepare --yes now shows delegated setup step outcomes so users can see which
  guarded setup steps were attempted and completed

Setup recommendation includes both dependency readiness and temp demo DB
readiness. PR #545 dogfood found that prepare under-recommended setup when
dependency directories existed but `/tmp/augnes-demo.db` was missing. Prepare
now treats a non-PASS doctor `temp_demo_db` check as a setup reason.

Prepare never runs finite setup commands directly. It delegates setup only by
calling:

```bash
npm run augnes:setup-local-demo -- --yes
```

## Without --yes

Without `--yes`, prepare is safe and mostly read-only. It runs:

```bash
npm run augnes:doctor -- --json
```

Then it prints:

- current doctor status
- whether safe setup is recommended
- the exact approval command, when setup appears useful:
  `npm run augnes:prepare -- --yes`
- visible terminal commands for long-running runtime or MCP bridge startup when
  doctor reports those services are not ready
- skipped reasons and authority boundaries

It does not run setup without `--yes`.

If `/tmp/augnes-demo.db` is missing, cannot be inspected read-only, lacks core
Augnes tables, or lacks seeded demo rows, prepare should recommend setup and
print `npm run augnes:prepare -- --yes`.

## With --yes

With `--yes`, prepare may run only:

```bash
npm run augnes:setup-local-demo -- --yes
```

Prepare still does not run finite setup directly. It does not call `npm
install`, `npm --prefix apps/augnes_apps install`, `db:reset`, `db:migrate`, or
`demo:seed` itself. Those commands remain owned by the guarded local demo setup
script.

After the delegated setup command returns, prepare reruns:

```bash
npm run augnes:doctor -- --json
```

The final output includes before/after doctor status, setup recommendation,
setup execution status, delegated setup step outcomes, dirty worktree status,
recommended next actions, skipped checks, and boundary statements.

The delegated setup step outcomes come from the setup script's structured
summary. Human and report output keep this short, for example:

```text
Setup step outcomes
- root dependencies: PASS
- Augnes Apps dependencies: PASS
- temp demo DB reset: PASS
- temp demo DB migration: PASS
- temp demo DB seed: PASS
```

JSON output includes `delegated_setup_summary`, `setup_steps`,
`setup_worktree_status_before`, `setup_worktree_status_after`, and the combined
`setup_worktree_status`. Prepare collects `git status --short` before delegated
setup and again after delegated setup, then reports the before/after status and
new dirty entries after setup when that delta can be computed.

Dirty worktree after setup is not automatically attributed to setup if the
worktree was already dirty. In that case prepare prints:

```text
Worktree was already dirty before setup; review before/after status before attributing changes to setup.
```

Lockfile reporting distinguishes:

- lockfile changed after setup
- lockfile was already dirty before setup
- lockfile churn unknown because git status failed

A dirty worktree after setup is reported but not modified.

This reporting exists to reduce the user confusion found during dogfood: setup
can succeed while hiding the individual package install, temp DB reset,
migration, and seed outcomes unless the wrapper surfaces them.

## Why Long-running Servers Are Not Auto-started

The local Augnes runtime and MCP bridge are long-running terminal processes.
Prepare prints the exact commands instead of starting them:

```bash
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

```bash
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
```

This keeps server lifecycle visible to the user and avoids hidden background
daemons.

## Why User-level Codex Config Is Not Auto-written

Prepare never writes:

```text
~/.codex/config.toml
```

The repo-local `.codex/config.toml.example` remains an inert example. Users can
review and adapt it manually for their local Codex installation. Prepare does
not assume ownership of user-level Codex configuration and does not add secrets.

## How Non-expert Users Should Use It

Start with:

```bash
npm run augnes:prepare
```

If prepare says setup is recommended, review the reason and run:

```bash
npm run augnes:prepare -- --yes
```

Then run the visible terminal commands that prepare prints for the local runtime
and MCP bridge if those services are needed.

The only demo DB path checked by doctor/prepare is `/tmp/augnes-demo.db`. The
check is read-only and does not create, migrate, seed, write, delete, chmod, or
inspect default/user DB paths.
Doctor rejects `/tmp/augnes-demo.db` symlinks before read-only SQLite
inspection, and prepare treats that non-PASS `temp_demo_db` result as a guarded
setup recommendation.

## How Codex Should Report Skipped Checks

Codex should explicitly report:

- safe local demo setup skipped when `--yes` was not provided
- temp demo DB readiness warning when `/tmp/augnes-demo.db` is missing or not
  ready
- local runtime startup skipped because `npm run dev` is long-running
- local MCP bridge startup skipped because bridge dev server startup is
  long-running
- MCP tool calls skipped because prepare does not call MCP tools
- browser validation skipped when no UI route or frontend component changed
- provider/model checks skipped because basic setup must not require
  `OPENAI_API_KEY`
- prepare does not require `OPENAI_API_KEY` for basic local setup

## Authority Boundary

Prepare preserves Augnes authority boundaries. It does not:

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
- create perspective-memory items
- create product persistence boundary records
- commit or reject Augnes state
- expand Core/runtime authority
- merge, approve, publish, retry, replay, or enable auto-merge
- externally post results
- implement "Run Codex from ChatGPT" behavior
- start hidden background daemons
- start the local runtime or MCP bridge
- call MCP tools

## Verification

```bash
npm run smoke:augnes-codex-prepare
```

The smoke verifies package script wiring, human/JSON/report behavior, no setup
execution without `--yes`, setup delegation through the existing guarded setup
script, no direct finite setup commands, no dev server startup, no MCP bridge
startup, no MCP tool calls, no secret reads, no provider calls, no Codex SDK
calls, no GitHub API calls, no user-level Codex config writes, and docs/report
boundary statements.
