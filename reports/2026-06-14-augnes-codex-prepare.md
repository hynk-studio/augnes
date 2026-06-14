# Augnes Codex Prepare Report

Date: 2026-06-14

## Summary

This report records the Augnes Codex Prepare v0.1 wrapper. The change adds a
single repo-local entrypoint for the user request "Codex, prepare Augnes" so
Codex can run doctor JSON, decide whether guarded local demo setup appears
useful, optionally delegate setup after explicit `--yes`, rerun doctor, and
produce a user/PR-ready report.

## Files changed

- `docs/AUGNES_CODEX_PREPARE_V0_1.md`
- `package.json`
- `reports/2026-06-14-augnes-codex-prepare.md`
- `scripts/augnes-codex-prepare.mjs`
- `scripts/smoke-augnes-codex-prepare.mjs`

## Behavior

Default prepare:

```bash
npm run augnes:prepare
```

Prepare runs doctor JSON, parses the result, reports current status, and
recommends setup only when doctor checks indicate local demo setup appears
useful, such as missing dependency directories.

JSON output:

```bash
npm run augnes:prepare -- --json
```

Report output:

```bash
npm run augnes:prepare -- --report
```

Explicit setup delegation:

```bash
npm run augnes:prepare -- --yes
```

With `--yes`, prepare delegates only to:

```bash
npm run augnes:setup-local-demo -- --yes
```

Prepare never runs finite package or temp DB setup commands directly.

## User-facing flow

1. User says "Codex, prepare Augnes."
2. Codex runs `npm run augnes:prepare`.
3. Prepare prints what is ready, whether setup is recommended, visible terminal
   actions, next commands, skipped checks, and boundaries.
4. If setup is recommended, user or Codex can run
   `npm run augnes:prepare -- --yes`.
5. Prepare delegates setup to the existing guarded setup script, reruns doctor,
   and reports before/after status.
6. Long-running local runtime and MCP bridge start commands remain visible
   terminal actions.

## Boundary

This PR adds a guided prepare wrapper only. It does not add runtime authority,
DB schema changes, direct finite setup commands in prepare, default/user DB
writes, secret handling, token handling, provider/model calls, Codex SDK
execution, GitHub API calls from scripts, GitHub mutation, merge automation,
approval automation, publication automation, retry/replay automation,
auto-merge automation, external posting automation, proof/evidence writes,
perspective-memory persistence, perspective-memory item creation, product
boundary creation, product persistence boundary records, hidden daemon behavior,
"Run Codex from ChatGPT" behavior, local runtime startup, MCP bridge startup,
MCP tool calls, or Augnes state commit/reject authority.

Prepare does not write `~/.codex/config.toml` and does not require
`OPENAI_API_KEY` for basic local setup.

Prepare does not create product boundary creation records or product
persistence boundary records.

## Verification plan

- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-codex-prepare`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## Skipped checks

- `npm run augnes:prepare -- --yes` is not run for PR verification because it
  delegates package installation and temp DB reset/migrate/seed to the guarded
  setup script and should remain explicitly user-authorized.
- Local runtime startup is skipped because `npm run dev` is long-running and
  must remain a visible terminal action.
- Local MCP bridge startup is skipped because bridge dev server startup is
  long-running and must remain visible.
- MCP tool calls are skipped because prepare only consumes doctor output and
  does not call MCP tools.
- Browser validation is skipped because this PR does not change a UI route or
  frontend component.
- Provider/model checks are skipped because basic setup must not require
  `OPENAI_API_KEY`.

## Next recommended PR

Add a read-only local context summary command that combines prepare output with
the current Augnes operating contract, plugin install path, bootstrap doc,
doctor doc, and bridge start commands for easy inclusion in Codex handoffs.
