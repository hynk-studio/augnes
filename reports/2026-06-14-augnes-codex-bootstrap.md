# Augnes Codex Bootstrap Kit Report

Date: 2026-06-14

## Summary

This report records the repo-local Augnes Codex Bootstrap Kit v0.1. The kit
helps Codex orient, verify prerequisites, and print local setup commands without
requiring an operator to manually stitch together README, AGENTS.md, Codex
Session Adapter docs, MCP bridge docs, plugin docs, and package scripts.

## Files changed

- `docs/AUGNES_CODEX_BOOTSTRAP_V0_1.md`
- `scripts/augnes-codex-bootstrap.mjs`
- `scripts/smoke-augnes-codex-bootstrap.mjs`
- `.codex/config.toml.example`
- `plugins/augnes-operator/INSTALL.md`
- `package.json`
- `reports/2026-06-14-augnes-codex-bootstrap.md`

## Bootstrap behavior

The bootstrap command checks Node.js, npm, repository root, git status, and
required context files. It prints recommended local Augnes setup commands and
recommended MCP bridge setup commands. It generates or validates the repo-local
`.codex/config.toml.example` and never writes user-level Codex configuration.

The printed local setup commands are:

```bash
npm install
npm run db:reset
npm run db:migrate
npm run demo:seed
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

The printed MCP bridge setup commands are:

```bash
npm --prefix apps/augnes_apps install
AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev
```

## Codex-access improvement proposals

The proposals below are ranked from Codex's perspective as a repo
implementation worker. Each proposal is advisory unless a future PR explicitly
scopes it.

| Rank | Title | Problem it solves for Codex | Expected user/operator benefit | Implementation shape | Files likely touched | Safe now or deferred | Authority risk level | Requires | Suggested next PR |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | One-command install / doctor command | Codex must infer setup from several docs and scripts. | Faster first local run and clearer failure messages. | Extend bootstrap into a passive doctor command. | `scripts/augnes-codex-bootstrap.mjs`, package scripts, bootstrap docs. | Safe now if passive. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks no; package scripts yes; secrets no. | Add structured `--json` and failure code output. |
| P0 | Bootstrap report output for PR bodies | PR authors need repeatable setup and skipped-check summaries. | Reviewers get consistent evidence without raw terminal logs. | Add output-only Markdown report mode. | bootstrap script, bootstrap smoke, PR template docs. | Safe now if output-only. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks no; package scripts yes; secrets no. | Add `--report` mode and smoke assertions. |
| P0 | Safe setup without provider credentials | Fresh workers may assume provider credentials are required. | Deterministic local demo setup without secret handling. | Keep provider-free setup commands and smoke assertions. | `README.md`, `.codex/config.toml.example`, bootstrap script. | Safe now. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks no; package scripts yes; secrets no. | Add `dev:demo-local` alias. |
| P0 | Generated .codex config examples | MCP endpoint/config shape is otherwise scattered. | Reviewable local bridge config example. | Keep repo-local example and regenerate only if missing. | `.codex/config.toml.example`, `docs/examples/`, bootstrap smoke. | Safe now. | Low. | runtime no; DB/schema no; API no; MCP config example-only; plugin hooks no; package scripts no; secrets no. | Align all example MCP snippets. |
| P0 | Better skipped-check and missing-runtime diagnostics | Skipped runtime, Browser, MCP, and bridge checks can be reported inconsistently. | PR bodies name exact skipped reasons. | Add output-only skipped-check formatter. | `scripts/`, verification docs, PR template. | Safe now if output-only. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks no; package scripts yes; secrets no. | Add `codex:skipped-check-report`. |
| P0 | Explicit what Codex can do / cannot do card | Authority boundaries are thorough but spread across files. | New agents see a compact boundary card early. | Add a static card that points to `AGENTS.md`. | `docs/`, `AGENTS.md` pointer. | Safe now. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks no; package scripts no; secrets no. | Add `docs/CODEX_WORK_AUTHORITY_CARD.md`. |
| P0 | Simplified read context command for Codex | Runtime-backed brief helpers are unavailable in some fresh setups. | Codex can gather static repo context quickly. | Add read-only context summary script. | `scripts/`, package scripts, bootstrap docs. | Safe now if read-only. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks no; package scripts yes; secrets no. | Add `codex:read-local-context`. |
| P1 | Local runtime health check endpoint or CLI check | Starting a dev server does not prove local runtime readiness. | Faster diagnosis of wrong port, missing DB, or missing seeded state. | Prefer CLI around existing routes; defer endpoint. | `scripts/`, maybe API docs if endpoint approved. | CLI safe later; endpoint deferred. | Low for CLI, medium for endpoint. | runtime maybe; DB/schema no; API maybe; MCP config no; plugin hooks no; package scripts yes; secrets no. | Add CLI check against existing routes. |
| P1 | MCP bridge readiness check | `/healthz` does not prove runtime connectivity or bridge mode. | Operators can distinguish bridge, bridge mode, and runtime failures. | Read-only bridge doctor script. | bridge runbook, `scripts/`, package scripts. | Safe after confirming health-only behavior. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks no; package scripts yes; secrets no. | Add `augnes:mcp-bridge-doctor`. |
| P1 | Codex-friendly Work Contract Card or task card | Task scope, verification, and boundaries are often embedded in prose. | Less scope drift and easier handoff review. | Add Markdown or JSON task card template. | `docs/templates/`, PR template. | Safe as template-only. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks no; package scripts no; secrets no. | Add `docs/templates/codex-work-contract-card.md`. |
| P1 | Machine-readable Augnes capability manifest | Codex cannot easily discover commands, docs, routes, bridge surfaces, and skills. | Safer command selection and faster orientation. | Draft JSON manifest with capabilities and boundaries. | `docs/`, `scripts/`, maybe `.codex/`. | Deferred until schema review. | Medium. | runtime no; DB/schema no; API no; MCP config maybe pointers; plugin hooks no; package scripts maybe; secrets no. | Draft docs-only manifest schema. |
| P1 | Plugin install guide hardening | Local Codex plugin installation varies by build. | Clear local path and authority boundary. | Keep install doc narrow and smoke no MCP/app/secret/external config. | plugin install guide, plugin smokes. | Safe now. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks docs only; package scripts no; secrets no. | Extend scaffold smoke with guide checks. |
| P1 | Codex hook improvements | Hooks can prevent risky tool use, but should stay conservative. | Fewer accidental attempts at provider, GitHub, DB, approval, or merge surfaces. | Add deny-only policy tests and clearer messages. | plugin hooks, hook smoke, hook docs. | Safe if deny-only. | Medium. | runtime no; DB/schema no; API no; MCP config no; plugin hooks yes; package scripts maybe; secrets no. | Add deny-only tests for setup and bootstrap scopes. |
| P1 | Browser/computer-use verification runbook | UI work needs consistent desktop and narrow viewport validation. | More consistent screenshots and skipped reasons. | Add compact runbook referencing existing verification docs. | `docs/`, `docs/templates/`. | Safe as docs-only. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks no; package scripts no; secrets no. | Add browser validation checklist. |
| P1 | PR body template for Augnes Codex tasks | PR bodies need consistent Summary, Boundary, Verification, and skipped-check sections. | Faster review and fewer missing authority statements. | Add task-specific template or generated block. | PR template, `docs/templates/`, maybe bootstrap script. | Safe if template-only. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks no; package scripts maybe; secrets no. | Add Augnes Codex PR body appendix. |
| P1 | Command aliases that reduce long env var boilerplate | Long local commands are easy to mistype. | Faster local startup and repeatable smokes. | Add package aliases that expand to existing local commands. | `package.json`, maybe app package and README. | Safe if aliases only. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks no; package scripts yes; secrets no. | Add `dev:demo-local` and `dev:mcp-bridge-local`. |
| P1 | Returned-envelope intake automation follow-up | Returned-envelope intake exists but needs easier discovery in bootstrap context. | Operators find local-only validation without reading recent PRs. | Add doc/context-output pointers only. | bootstrap docs, context script, perspective docs. | Safe as docs/context output. | Low. | runtime no; DB/schema no; API no; MCP config no; plugin hooks no; package scripts maybe; secrets no. | Add returned-envelope pointers to read-context command. |
| P2 | Devcontainer or reproducible environment option | Host setup can drift. | More reproducible local and remote development. | Add `.devcontainer/` after environment choices are agreed. | `.devcontainer/`, README, bootstrap docs. | Deferred. | Medium. | runtime no; DB/schema no; API no; MCP config maybe; plugin hooks no; package scripts maybe; secrets maybe later. | Draft no-secret devcontainer. |
| P2 | GitHub Codespaces / remote environment option | Remote setup needs local bridge, local DB, and no-secret demo decisions. | Easier onboarding when local setup is unavailable. | Document no-secret remote path first; defer tunnels and hosted bridge automation. | `.devcontainer/`, README, docs, maybe package aliases. | Deferred. | Medium to high. | runtime maybe; DB/schema no; API no; MCP config maybe; plugin hooks no; package scripts maybe; secrets maybe. | Design note separating no-secret remote setup from secret-backed paths. |
| P3 | Secret-backed remote bootstrap automation | Could automate remote provider, tunnel, or GitHub setup, but crosses sensitive boundaries. | Less manual remote setup only if explicitly approved later. | Do not implement now; would need authority gates and audited confirmation. | Unknown; likely config, CI, deployment, docs. | Deferred. | High. | runtime maybe; DB/schema maybe; API maybe; MCP config yes; plugin hooks maybe; package scripts yes; secrets yes. | None until explicit product authority and secret-handling policy exist. |

## Boundary

This PR adds bootstrap docs/scripts only. It does not add runtime authority, DB
writes, schema changes, secret handling, provider calls, Codex SDK execution,
GitHub mutation, merge automation, approval automation, publication automation,
retry/replay automation, auto-merge automation, proof/evidence writes, hidden
background daemon behavior, "Run Codex from ChatGPT" behavior, or Augnes state
commit/reject authority.

## Verification plan

- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## Skipped checks

No browser validation is expected for this PR because the changed surface is
docs, scripts, package wiring, plugin install guidance, and a static config
example. No UI route or browser-visible component changed.
