# Augnes Codex Prepare Dogfood

Date: 2026-06-14

## Summary

This report dogfoods the merged PR #544 `Codex, prepare Augnes` entrypoint from
a user and Codex-worker perspective. The local flow is usable as a guided
entrypoint: `npm run augnes:prepare` gives readable status, JSON/report modes
work, guarded setup can be delegated with `--yes`, and doctor passes once the
runtime and MCP bridge are started manually.

The main usability gap is that prepare says setup is not recommended when
dependency directories already exist, even if `/tmp/augnes-demo.db` is absent.
That means the simplest entrypoint can stop one step too early for a fresh temp
DB runtime dogfood.

## Environment

- Repository: `hynk-studio/augnes`
- Local checkout: `/Users/hynk/Documents/augnes`
- Branch: `codex/augnes-codex-prepare-dogfood-report`
- Base state: `main` fast-forwarded through merged PR #544, merge commit
  `f16fb6b32ce5a5cb7c551e6fb9f693c75fb32d61`
- Node: `v25.9.0`
- npm: `11.12.1`
- Runtime URL: `http://localhost:3000`
- MCP bridge URL: `http://localhost:8787/mcp`
- Demo DB policy: the only allowed demo DB path was `/tmp/augnes-demo.db`
- Secret policy: `OPENAI_API_KEY` was unset for runtime startup and no secrets
  were read

## Commands run

- `npm run augnes:prepare`
- `npm run augnes:prepare -- --json`
- `npm run augnes:prepare -- --report`
- `npm run augnes:setup-local-demo`
- `npm run augnes:prepare -- --yes`
- `env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000`
- `AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev`
- `npm run augnes:doctor -- --json`
- `npm run augnes:prepare -- --json`
- `curl -sS 'http://localhost:3000/api/state/brief?scope=project:augnes' | jq '{runtime, scope}'`
- `curl -i 'http://localhost:8787/mcp'`

## Commands skipped with concrete reasons

- Skipped: MCP tool calls. Reason: the task explicitly said not to call MCP
  tools unless separately scoped; bridge validation was limited to HTTP
  endpoint reachability.
- Skipped: provider/model checks. Reason: the task explicitly forbade
  provider/model checks, and the local prepare/setup flow must not require
  `OPENAI_API_KEY`.
- Skipped: default/user DB paths. Reason: the task allowed only
  `/tmp/augnes-demo.db`; setup, runtime startup, reset, migrate, and seed were
  constrained to that temp DB path.
- Skipped: `~/.codex/config.toml` writes. Reason: the task forbade writing
  user-level Codex config, and prepare/bootstrap docs already keep this manual.
- Skipped: perspective-memory items, product persistence boundary records, and
  proof/evidence rows. Reason: the dogfood was report/smoke only and had no
  persistence authority.
- Skipped: Augnes commit/reject state changes. Reason: the dogfood only created
  the explicitly allowed temp demo DB and did not grant state authority.
- Skipped: Codex SDK execution and GitHub API calls from scripts. Reason: the
  task forbade both, and this PR only adds a static report smoke.
- Skipped: browser validation. Reason: this PR changes no route, UI component,
  CSS, browser surface, or clipboard flow.

## Initial prepare result

`npm run augnes:prepare` exited 0. It reported:

- `doctor_status: ACTION_REQUIRED`
- `setup_recommended: no`
- `setup_executed: no`
- Ready checks passed for repository root, Node, npm, root `node_modules`, and
  `apps/augnes_apps/node_modules`
- Next visible terminal actions were runtime startup and MCP bridge startup

`npm run augnes:prepare -- --json` exited 0. The JSON was parseable and showed:

- `before_doctor.overall_state: ACTION_REQUIRED`
- Static setup and package script checks passed
- `runtime_state_brief` warned with `ECONNREFUSED`
- `mcp_bridge_endpoint` warned with `ECONNREFUSED`
- `setup_status.state: SKIPPED_NOT_RECOMMENDED`

`npm run augnes:prepare -- --report` exited 0. It printed Summary, Prepare
result, Before doctor status, Setup recommendation, Setup execution status,
Recommended next actions, Skipped checks, and Boundary sections.

## Setup dry-run result

`npm run augnes:setup-local-demo` exited 0 and stayed in dry-run mode. It
printed the finite commands that would run only after `--yes`:

- `npm install`
- `npm --prefix apps/augnes_apps install`
- `AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:reset`
- `AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:migrate`
- `AUGNES_DB_PATH=/tmp/augnes-demo.db npm run demo:seed`

It also printed the runtime and MCP bridge commands as manual long-running
start commands.

## Setup --yes result or skipped reason

prepare --yes status: run.

`npm run augnes:prepare -- --yes` exited 0. It delegated to
`npm run augnes:setup-local-demo -- --yes`, created `/tmp/augnes-demo.db`, and
reported:

- `doctor_status: ACTION_REQUIRED`
- `setup_recommended: no`
- `setup_executed: yes`
- `after_doctor_status: ACTION_REQUIRED`

Friction observed: the nested `npm --prefix apps/augnes_apps install` rewrote
four `peer: true` markers in `apps/augnes_apps/package-lock.json`. That
lockfile churn was restored and is not part of this PR.

## Runtime startup result or skipped reason

runtime startup status: run.

The runtime was started with:

```bash
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

Next.js reported `Ready in 363ms` and served `http://localhost:3000`.
The startup did not require `OPENAI_API_KEY` and did not use a default/user DB
path.

## MCP bridge startup result or skipped reason

MCP bridge startup status: run.

The bridge was started with:

```bash
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
```

It reported:

```text
Augnes MCP server listening on http://localhost:8787/mcp
```

No MCP tools were called.

## Doctor after setup/runtime result

`npm run augnes:doctor -- --json` exited 0 after setup, runtime startup, and
bridge startup. It reported `overall_state: PASS`.

Notable passing checks:

- `runtime_state_brief`: `http://localhost:3000/api/state/brief?scope=project:augnes`
  returned HTTP 200 Augnes state brief for `project:augnes`
- `mcp_bridge_endpoint`: `http://localhost:8787/mcp` was reachable with HTTP
  406; this was endpoint reachability only and MCP tool calls were not tested

## Prepare after setup/runtime result

`npm run augnes:prepare -- --json` exited 0 after setup, runtime startup, and
bridge startup. It reported:

- `before_doctor.overall_state: PASS`
- `setup_recommended.recommended: false`
- `setup_executed: false`
- `recommended_next_actions: ["No setup action required by doctor checks."]`
- skipped reasons still explicitly said prepare never starts the runtime or MCP
  bridge and does not call MCP tools or provider/model checks

## State brief check result

The state brief check passed:

```json
{
  "runtime": "augnes",
  "scope": "project:augnes"
}
```

## MCP bridge reachability result

`curl -i 'http://localhost:8787/mcp'` exited 0 and returned:

- `HTTP/1.1 406 Not Acceptable`
- JSON body: `Not Acceptable: Client must accept text/event-stream`

This confirms the bridge endpoint was reachable. It was not an MCP tool call.

## User-facing friction

- The default prepare path is readable and safe, but it says setup is not
  recommended when dependency directories exist even if `/tmp/augnes-demo.db`
  is absent.
- `prepare --yes` hides most delegated setup output in human mode, so the user
  sees `setup_executed: yes` but not a clear "temp DB reset/migrated/seeded"
  completion line.
- `curl -i` against `/mcp` returns HTTP 406, which is expected for reachability
  but looks like an error without explanatory context.
- The runtime and bridge commands are long and env-var heavy; they are correct,
  but not simple to type from memory.
- npm printed a global npm update notice during the first prepare run, which is
  unrelated to Augnes readiness and adds noise.

## Codex-worker friction

- Codex has to infer that `/tmp/augnes-demo.db` setup is still useful even when
  prepare says setup is not recommended.
- `prepare --yes` can leave generated package-lock churn from nested npm
  install, so a worker must inspect and clean the worktree before committing.
- The prepare JSON is strong for parsing, but the human report does not expose
  enough delegated setup detail to cite setup proof without rerunning or using
  extra commands.
- Long-running runtime and bridge processes require manual lifecycle handling
  outside prepare; the boundary is correct, but the worker has to remember to
  stop processes started during dogfood.
- The MCP bridge GET response is intentionally not a protocol session, so the
  worker must describe it as reachability only and avoid overclaiming MCP
  readiness.

## What worked well

- `npm run augnes:prepare` is a useful first command for a non-expert user.
- JSON mode is machine-readable and includes doctor checks, recommended next
  actions, skipped reasons, and boundaries.
- Report mode is concise enough for PR body material.
- The setup dry-run clearly lists the finite commands and uses only
  `/tmp/augnes-demo.db`.
- Runtime startup worked with `OPENAI_API_KEY` unset.
- Doctor reached PASS after the runtime and bridge were started manually.
- Boundary text repeatedly says no MCP tools, no provider calls, no Codex SDK,
  no GitHub API calls, no proof/evidence writes, no perspective-memory items,
  no product boundary records, and no Augnes state commit/reject authority.

## What confused or slowed setup

- The setup recommendation logic is dependency-directory based and does not
  treat missing temp DB setup as a setup reason.
- The default prepare command can therefore under-recommend setup for the exact
  local runtime path the docs tell the user to use.
- Setup stdout is captured by prepare, so human mode omits useful setup details.
- The nested app install can rewrite lockfile metadata under this npm version.
- Endpoint reachability for `/mcp` depends on understanding that HTTP 406 is
  acceptable for a plain GET probe.

## Suggested improvements ranked P0/P1/P2

### P0

Add a read-only temp demo DB readiness check to doctor/prepare. If
`/tmp/augnes-demo.db` is missing or not migrated/seeded, prepare should
recommend the guarded setup path even when `node_modules` already exists.

### P1

Make `prepare --yes` report delegated setup step outcomes in human/report mode,
including temp DB reset, migrate, seed, and any generated lockfile churn. Keep
the setup delegated and finite.

### P2

Add a shorter local start alias or printed copy block for runtime plus bridge,
and label the `/mcp` HTTP 406 result as expected reachability behavior when the
client does not request `text/event-stream`.

## Authority boundary

This PR adds a dogfood report and smoke only.

It does not add runtime authority, DB schema changes, secret handling,
provider calls, provider/model checks, Codex SDK execution, GitHub API calls
from scripts, GitHub mutation, merge automation, approval automation, publish
automation, retry/replay automation, auto-merge automation, proof/evidence
writes, perspective-memory persistence, perspective-memory item creation,
product boundary creation, product persistence boundary records,
default/user DB writes, `~/.codex/config.toml` writes, MCP tool calls, or
Augnes state commit/reject authority.

The only DB mutation performed during dogfood was the explicitly allowed local
demo setup against `/tmp/augnes-demo.db`.

## Next recommended PR

Add temp demo DB readiness to the Augnes Codex doctor/prepare flow and harden
the guarded setup command so package install does not leave lockfile churn when
the repository is already installed.
