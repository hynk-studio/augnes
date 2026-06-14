# Augnes Codex Bootstrap Kit v0.1

This kit helps a Codex implementation agent prepare a fresh local Augnes
development environment from the repository with less manual stitching across
`README.md`, `AGENTS.md`, Codex Session Adapter docs, MCP bridge docs, plugin
docs, and package scripts.

The kit automates discovery and setup guidance only. It does not install
packages, start servers, mutate databases, read secrets, call providers, call
Codex SDK, call GitHub, create proof/evidence rows, approve or reject Augnes
state, merge, publish, retry, replay, or enable auto-merge.

## Files

- `scripts/augnes-codex-bootstrap.mjs`
- `scripts/smoke-augnes-codex-bootstrap.mjs`
- `.codex/config.toml.example`
- `plugins/augnes-operator/INSTALL.md`
- `reports/2026-06-14-augnes-codex-bootstrap.md`

## Run

```bash
npm run augnes:codex-bootstrap
```

The bootstrap command:

- checks Node.js availability
- checks npm availability
- checks the repository root
- checks git status
- verifies required context files
- generates or validates the repo-local `.codex/config.toml.example`
- prints local Augnes setup commands
- prints local MCP bridge setup commands

The command is intentionally passive. The only file it may write is the
repo-local `.codex/config.toml.example` when that example is missing. It never
writes `~/.codex/config.toml`.

## Required Context Files

The bootstrap script verifies that these files exist:

- `README.md`
- `AGENTS.md`
- `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md`
- `plugins/augnes-operator/.codex-plugin/plugin.json`
- `apps/augnes_apps/package.json`

Missing files fail the bootstrap check because a fresh Codex worker would not
have enough local orientation.

## Printed Local Setup Commands

The script prints the recommended deterministic local runtime setup:

```bash
npm install
npm run db:reset
npm run db:migrate
npm run demo:seed
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

These commands are printed for the operator to run. The bootstrap script does
not execute them.

The `env -u OPENAI_API_KEY` shape keeps the basic local demo path independent
from provider credentials.

## Printed MCP Bridge Setup Commands

The script prints the recommended local bridge setup:

```bash
npm --prefix apps/augnes_apps install
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
```

The bridge endpoint is expected at:

```text
http://localhost:8787/mcp
```

These commands are printed for an operator to run in a separate process. The
bootstrap script does not start the bridge.

## Install Mode 1: Repo-native Codex Use

Repo-native Codex use requires no plugin installation and no MCP bridge.

Recommended entry points:

- `AGENTS.md` for the operating contract and authority boundaries
- `README.md` for local runtime setup
- `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` for Codex Session Adapter flow
- `npm run codex:read-brief` when the app-side helper runtime is available
- `npm run codex:record-evidence` and `npm run codex:record-completion-proof`
  only when the user explicitly scopes proof/evidence helper use

This mode is the safest default for ordinary repo implementation work.

## Install Mode 2: Local Codex plus Augnes MCP Bridge

The repo-local `.codex/config.toml.example` shows an example URL-based MCP
server entry for the local Augnes bridge:

```toml
[mcp_servers.augnes_local_bridge]
url = "http://localhost:8787/mcp"
```

This example is inert. It is not loaded automatically and is not copied into a
user-level Codex config by any repo script.

Use this mode only after starting:

1. the Augnes runtime on `http://localhost:3000`
2. the Augnes Apps MCP bridge on `http://localhost:8787/mcp`

Bridge use does not grant Codex commit/reject authority, proof authority,
publication authority, provider authority, GitHub authority, or merge authority.

## Install Mode 3: augnes-operator Plugin, Skills, and Hooks

The `augnes-operator` plugin scaffold lives at:

```text
plugins/augnes-operator
```

Installation guidance is in:

```text
plugins/augnes-operator/INSTALL.md
```

The plugin packages local skills and optional hook guardrails. It does not add
MCP config, app mappings, runtime calls, provider calls, GitHub calls, secrets,
or state authority.

Plugin and hook verification:

```bash
npm run smoke:augnes-operator-plugin-scaffold
npm run smoke:augnes-operator-plugin-hooks
```

## Verification

Run the bootstrap smoke:

```bash
npm run smoke:augnes-codex-bootstrap
```

The smoke verifies that the bootstrap kit exists, package scripts are wired,
the bootstrap command stays passive, the config example is local and secretless,
the docs include the required install modes and proposal analysis, and the PR
report records the same boundary.

## Boundary

This kit does not add runtime authority, DB writes, schema changes, API routes,
secret handling, provider calls, Codex SDK execution, GitHub mutation, proof or
evidence writes, Augnes state commit/reject authority, merge automation,
approval automation, publication automation, retry/replay automation, hidden
background daemons, or "Run Codex from ChatGPT" behavior.

## Codex-access improvement proposals

These proposals come from inspecting the current Augnes repo as a Codex
implementation worker. The ranking is intentionally conservative:

- P0: directly helps Codex install or use Augnes now, with low authority risk
  and no secrets, DB/API/runtime expansion, provider calls, or GitHub mutation
- P1: improves repeated dogfood workflow and may require small scripts or docs,
  but no new authority
- P2: useful, but should wait for product decision or repeated pain evidence
- P3: risky or premature because it touches secrets, runtime authority,
  DB/schema, provider calls, GitHub mutation, approval/merge/publish paths, or
  external posting automation

### P0-1: One-command install / doctor command

- Title: One-command install / doctor command.
- Problem it solves for Codex: Codex must currently infer the correct setup
  path from several docs and package scripts.
- Expected user/operator benefit: Faster first successful local run and clearer
  failure messages when Node, npm, required files, or git state are off.
- Implementation shape: Extend `scripts/augnes-codex-bootstrap.mjs` into a
  richer `doctor` command that still only checks and prints next actions.
- Files likely touched: `scripts/augnes-codex-bootstrap.mjs`, package scripts,
  `docs/AUGNES_CODEX_BOOTSTRAP_V0_1.md`.
- Safe now or deferred: Safe now if it remains passive.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks no; package scripts yes; secret handling no.
- Suggested next PR: Add structured `--json` output and a clearer failure code
  map to the existing bootstrap script.

### P0-2: Bootstrap report output for PR bodies

- Title: Bootstrap report output that Codex can paste into PR bodies.
- Problem it solves for Codex: PR authors need a concise, repeatable account of
  setup checks and skipped checks.
- Expected user/operator benefit: Reviewers get consistent bootstrap evidence
  without reading terminal logs.
- Implementation shape: Add an optional `--report` mode that prints a Markdown
  section with Summary, Boundary, Verification, and Skipped Checks.
- Files likely touched: `scripts/augnes-codex-bootstrap.mjs`,
  `scripts/smoke-augnes-codex-bootstrap.mjs`, PR template docs.
- Safe now or deferred: Safe now if output-only.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks no; package scripts yes; secret handling no.
- Suggested next PR: Add report-only output and assert it in smoke coverage.

### P0-3: Safe setup without OPENAI_API_KEY

- Title: Safe setup without provider credentials.
- Problem it solves for Codex: Fresh workers can accidentally treat provider
  credentials as required for local demo setup.
- Expected user/operator benefit: Deterministic local Augnes demo setup works
  without secret handling.
- Implementation shape: Keep `env -u OPENAI_API_KEY` in bootstrap output and
  add smoke assertions that basic setup guidance does not require provider env.
- Files likely touched: `README.md`, `.codex/config.toml.example`,
  `scripts/augnes-codex-bootstrap.mjs`.
- Safe now or deferred: Safe now.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks no; package scripts yes; secret handling no.
- Suggested next PR: Add a `dev:demo-local` alias that bakes in the temp DB and
  provider-free local command.

### P0-4: Generated .codex config examples

- Title: Generated project-local Codex config examples.
- Problem it solves for Codex: Codex bridge setup currently depends on manually
  discovering MCP endpoint shape and config examples.
- Expected user/operator benefit: A fresh worker has a local example that is
  reviewable and safe to adapt.
- Implementation shape: Keep `.codex/config.toml.example` in the repo and let
  the bootstrap script regenerate it only when missing.
- Files likely touched: `.codex/config.toml.example`,
  `docs/examples/codex-augnes-mcp.example.toml`, bootstrap smoke.
- Safe now or deferred: Safe now.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config yes,
  example-only; plugin hooks no; package scripts no; secret handling no.
- Suggested next PR: Align all example MCP config docs to one canonical snippet.

### P0-5: Better skipped-check and missing-runtime diagnostics

- Title: Better skipped-check and missing-runtime diagnostics.
- Problem it solves for Codex: When runtime, Browser, MCP Inspector, or bridge
  checks are skipped, reasons can be inconsistent.
- Expected user/operator benefit: PR bodies explain exactly what was not run
  and why.
- Implementation shape: Add a small local helper that formats skipped-check
  reasons without recording proof/evidence rows.
- Files likely touched: `scripts/`, `docs/VERIFICATION_EVIDENCE_PACK.md`,
  `.github/pull_request_template.md`.
- Safe now or deferred: Safe now if helper is output-only.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks no; package scripts yes; secret handling no.
- Suggested next PR: Add `npm run codex:skipped-check-report`.

### P0-6: Explicit "what Codex can do / cannot do" card

- Title: Codex capability and boundary card.
- Problem it solves for Codex: Boundaries are thorough but spread across many
  files.
- Expected user/operator benefit: New agents see a compact authority card before
  touching code.
- Implementation shape: Add a short generated or static card that points to
  `AGENTS.md` as authority and lists allowed vs disallowed actions.
- Files likely touched: `docs/`, `AGENTS.md` pointer section, bootstrap doc.
- Safe now or deferred: Safe now.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks no; package scripts no; secret handling no.
- Suggested next PR: Add `docs/CODEX_WORK_AUTHORITY_CARD.md`.

### P0-7: Simplified "read context" command for Codex

- Title: Simplified read context command.
- Problem it solves for Codex: `codex:read-brief` is useful, but a fresh worker
  also needs static context when the app helper runtime is unavailable.
- Expected user/operator benefit: Codex can quickly gather the current repo
  contract and available local helper scripts.
- Implementation shape: Add a deterministic script that prints paths and short
  summaries for `README.md`, `AGENTS.md`, Codex workflow docs, bridge docs, and
  plugin docs without calling runtime.
- Files likely touched: `scripts/`, package scripts, bootstrap docs.
- Safe now or deferred: Safe now if read-only.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks no; package scripts yes; secret handling no.
- Suggested next PR: Add `npm run codex:read-local-context`.

### P1-1: Local runtime health check endpoint or CLI check

- Title: Local runtime health check.
- Problem it solves for Codex: Codex can start the dev server but still need a
  deterministic readiness check before browser or MCP validation.
- Expected user/operator benefit: Faster diagnosis of wrong port, missing DB, or
  unavailable seeded state.
- Implementation shape: Prefer a CLI wrapper around existing routes first; only
  add an endpoint if a product owner wants a runtime contract.
- Files likely touched: `scripts/`, maybe existing API route docs if endpoint is
  later approved.
- Safe now or deferred: Defer endpoint; safe to add CLI-only check later.
- Authority risk level: Low for CLI, medium for new endpoint.
- Requires: runtime behavior maybe; DB/schema no; API routes maybe; MCP config
  no; plugin hooks no; package scripts yes; secret handling no.
- Suggested next PR: Add a CLI check against existing local routes, no new API.

### P1-2: MCP bridge readiness check

- Title: MCP bridge readiness check.
- Problem it solves for Codex: A running bridge `/healthz` does not prove that
  the Augnes runtime is reachable or that bridge tools are enabled.
- Expected user/operator benefit: Operators can distinguish bridge process,
  bridge mode, and runtime connectivity failures.
- Implementation shape: Add a read-only local script that checks the bridge
  health endpoint and reports the expected `/mcp` target and env requirements.
- Files likely touched: `apps/augnes_apps/docs/11_AGENT_BRIDGE_LOCAL_RUNBOOK.md`,
  `scripts/`, package scripts.
- Safe now or deferred: Safe after confirming no tool invocation is needed.
- Authority risk level: Low if health-only.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks no; package scripts yes; secret handling no.
- Suggested next PR: Add `npm run augnes:mcp-bridge-doctor`.

### P1-3: Codex-friendly Work Contract Card or task card

- Title: Work Contract Card for Codex tasks.
- Problem it solves for Codex: Task boundaries, allowed file scope, verification
  commands, and skipped checks are often embedded in prose.
- Expected user/operator benefit: A small task card reduces scope drift and
  makes handoffs easier to review.
- Implementation shape: Add a Markdown or JSON card template that can be copied
  into issues, PRs, or local reports.
- Files likely touched: `docs/templates/`, `.github/pull_request_template.md`.
- Safe now or deferred: Safe as template-only.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks no; package scripts no; secret handling no.
- Suggested next PR: Add `docs/templates/codex-work-contract-card.md`.

### P1-4: Machine-readable Augnes capability manifest

- Title: Machine-readable Augnes capability manifest.
- Problem it solves for Codex: Codex cannot easily know which local commands,
  docs, routes, bridge surfaces, and plugin skills exist without searching.
- Expected user/operator benefit: Better automated orientation and safer
  selection of allowed commands.
- Implementation shape: Add a repo-local JSON manifest that lists capabilities,
  authority boundaries, verification commands, and owner docs.
- Files likely touched: `docs/`, `scripts/`, maybe `.codex/`.
- Safe now or deferred: Defer until schema is reviewed.
- Authority risk level: Medium because consumers may over-trust it.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config maybe
  example pointers; plugin hooks no; package scripts maybe; secret handling no.
- Suggested next PR: Draft schema and smoke it as documentation-only.

### P1-5: Plugin install guide hardening

- Title: Hardened plugin install guide.
- Problem it solves for Codex: Plugin install behavior differs by local Codex
  build, and unsafe examples could imply authority.
- Expected user/operator benefit: Operators get a clear local path and know what
  the plugin does not do.
- Implementation shape: Keep `plugins/augnes-operator/INSTALL.md` narrow and
  add smoke checks for no MCP config, no app mappings, no secrets, and no active
  external call configuration.
- Files likely touched: plugin install guide and existing plugin smokes.
- Safe now or deferred: Safe now.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks maybe docs only; package scripts no; secret handling no.
- Suggested next PR: Extend scaffold smoke with explicit install guide checks.

### P1-6: Codex hook improvements

- Title: Codex hook improvements.
- Problem it solves for Codex: Hooks can remind agents about boundaries before
  risky tool use, but the hook set should stay conservative.
- Expected user/operator benefit: Fewer accidental attempts to touch provider,
  GitHub, DB, approval, or merge surfaces.
- Implementation shape: Add more static policy tests and clearer deny messages;
  avoid adding authority or automatic remediation.
- Files likely touched: `plugins/augnes-operator/hooks/`,
  `scripts/smoke-augnes-operator-plugin-hooks.mjs`,
  `docs/CODEX_AUGNES_OPERATOR_HOOKS_V0_1.md`.
- Safe now or deferred: Safe if deny-only and locally tested.
- Authority risk level: Medium because hooks affect agent behavior.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks yes; package scripts maybe; secret handling no.
- Suggested next PR: Add deny-only tests for bootstrap and setup command scopes.

### P1-7: Browser/computer-use verification runbook

- Title: Browser and computer-use verification runbook.
- Problem it solves for Codex: UI-affecting Augnes work needs desktop and
  narrow viewport validation, but the exact proof shape is spread out.
- Expected user/operator benefit: More consistent screenshots, viewport notes,
  and skipped reasons.
- Implementation shape: Add a short runbook or template that references the
  existing verification evidence pack and browser report template.
- Files likely touched: `docs/`, `docs/templates/`.
- Safe now or deferred: Safe as docs-only.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks no; package scripts no; secret handling no.
- Suggested next PR: Add a compact browser validation checklist for Codex PRs.

### P1-8: PR body template for Augnes Codex tasks

- Title: PR body template for Augnes Codex tasks.
- Problem it solves for Codex: PR bodies need consistent Summary, Boundary,
  Verification, Browser validation, and skipped-check sections.
- Expected user/operator benefit: Faster review and fewer missing authority
  statements.
- Implementation shape: Add a task-specific template or generated report block.
- Files likely touched: `.github/pull_request_template.md`, `docs/templates/`,
  maybe bootstrap report script.
- Safe now or deferred: Safe if template-only.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks no; package scripts maybe; secret handling no.
- Suggested next PR: Add an Augnes Codex PR body appendix template.

### P1-9: Command aliases that reduce long env var boilerplate

- Title: Local command aliases for common safe demo commands.
- Problem it solves for Codex: Long env var commands are easy to mistype.
- Expected user/operator benefit: Faster local startup and more repeatable
  smoke instructions.
- Implementation shape: Add package aliases that expand to existing local
  commands without changing runtime behavior.
- Files likely touched: `package.json`, maybe `apps/augnes_apps/package.json`,
  README.
- Safe now or deferred: Safe if aliases only.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks no; package scripts yes; secret handling no.
- Suggested next PR: Add `dev:demo-local` and `dev:mcp-bridge-local` aliases.

### P1-10: Returned-envelope intake automation follow-up

- Title: Returned-envelope intake automation follow-up.
- Problem it solves for Codex: The returned-envelope intake path now automates
  loading and validation, but Codex still needs clear bootstrap pointers to it.
- Expected user/operator benefit: Operators can discover the local-only
  validation path without reading recent PRs.
- Implementation shape: Add bootstrap report links and context output that
  points to returned-envelope intake docs and smoke commands.
- Files likely touched: bootstrap docs, local context script, perspective docs.
- Safe now or deferred: Safe as docs/context output only.
- Authority risk level: Low.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config no;
  plugin hooks no; package scripts maybe; secret handling no.
- Suggested next PR: Add returned-envelope intake pointers to the read-context
  command.

### P2-1: Devcontainer or reproducible environment option

- Title: Devcontainer for Augnes local development.
- Problem it solves for Codex: Host-specific Node/npm/database setup can drift.
- Expected user/operator benefit: More reproducible local runs for new agents
  and remote development.
- Implementation shape: Add `.devcontainer/` with pinned Node image and
  documented local SQLite path behavior.
- Files likely touched: `.devcontainer/`, README, bootstrap docs.
- Safe now or deferred: Deferred until environment choices are agreed.
- Authority risk level: Medium because it changes how agents execute commands.
- Requires: runtime behavior no; DB/schema no; API routes no; MCP config maybe;
  plugin hooks no; package scripts maybe; secret handling maybe if later added.
- Suggested next PR: Draft devcontainer without secrets and validate local demo.

### P2-2: GitHub Codespaces / remote environment option

- Title: Codespaces or remote development setup.
- Problem it solves for Codex: Some operators may want a remote environment, but
  Augnes has local bridge, local DB, and no-secret demo assumptions.
- Expected user/operator benefit: Easier onboarding when local machine setup is
  unavailable.
- Implementation shape: Document a no-secret remote path first; defer any
  hosted bridge or tunnel automation.
- Files likely touched: `.devcontainer/`, README, docs, maybe package aliases.
- Safe now or deferred: Deferred for product decision.
- Authority risk level: Medium to high depending on networking and secrets.
- Requires: runtime behavior maybe; DB/schema no; API routes no; MCP config
  maybe; plugin hooks no; package scripts maybe; secret handling maybe.
- Suggested next PR: Write a design note that separates no-secret Codespaces
  setup from any secret-backed hosted path.

### P3-1: Secret-backed remote bootstrap automation

- Title: Secret-backed remote bootstrap automation.
- Problem it solves for Codex: It could automate remote provider, tunnel, or
  GitHub setup, but that crosses sensitive boundaries.
- Expected user/operator benefit: Less manual remote setup if approved later.
- Implementation shape: Do not implement now. A future design would need
  explicit secret handling, audit trail, user confirmation, and authority gates.
- Files likely touched: Unknown; likely config, CI, deployment, and docs.
- Safe now or deferred: Deferred.
- Authority risk level: High.
- Requires: runtime behavior maybe; DB/schema maybe; API routes maybe; MCP
  config yes; plugin hooks maybe; package scripts yes; secret handling yes.
- Suggested next PR: None until product authority and secret-handling policy are
  explicitly approved.
