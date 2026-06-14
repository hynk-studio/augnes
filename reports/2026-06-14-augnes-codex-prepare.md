# Augnes Codex Prepare Report

Date: 2026-06-14

## Summary

This report records the Augnes Codex Prepare v0.1 wrapper and its delegated
setup reporting update. Prepare remains the single repo-local entrypoint for
the user request "Codex, prepare Augnes": it runs doctor JSON, decides whether
guarded local demo setup appears useful, optionally delegates setup after
explicit `--yes`, reruns doctor, and produces a user/PR-ready report.

The usability update makes `prepare --yes` show delegated setup step outcomes
without adding any direct setup authority to prepare. This follow-up also makes
setup-executing output modes explicit so `--yes --json` and `--yes --report`
are not mistaken for output-format-only commands.

## Files changed

- `docs/AUGNES_CODEX_PREPARE_V0_1.md`
- `reports/2026-06-14-augnes-codex-prepare.md`
- `scripts/augnes-codex-local-demo-setup.mjs`
- `scripts/augnes-codex-prepare.mjs`
- `scripts/smoke-augnes-codex-prepare.mjs`

## Behavior

Default prepare:

```bash
npm run augnes:prepare
```

Prepare runs doctor JSON, parses the result, reports current status, and
recommends setup when doctor checks indicate local demo setup appears useful,
such as missing dependency directories or non-PASS temp demo DB readiness at
`/tmp/augnes-demo.db`.

This addresses the PR #545 dogfood finding that prepare under-recommended setup
when dependency directories existed but `/tmp/augnes-demo.db` was missing or not
ready.

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

## Execution mode behavior

Diagnostic-only commands:

- `npm run augnes:prepare`
- `npm run augnes:prepare -- --json`
- `npm run augnes:prepare -- --report`

Setup-executing commands:

- `npm run augnes:prepare -- --yes`
- `npm run augnes:prepare -- --yes --json`
- `npm run augnes:prepare -- --yes --report`

`--json` and `--report` do not cancel `--yes`. If `--yes` is present,
prepare delegates guarded setup and may run package install plus
reset/migrate/seed of `/tmp/augnes-demo.db` through
`npm run augnes:setup-local-demo -- --yes`.

Prepare JSON includes:

- `execution_mode: "diagnostic-only"` when `--yes` is absent
- `execution_mode: "setup-executing"` when `--yes` is present
- `setup_execution_warning` when `--yes` is present

Human and report output include an "Execution mode" section near the top, before
setup execution status or setup step outcomes.

Behavior update: `prepare --yes` now parses the guarded setup script's
structured summary and surfaces delegated setup step outcomes in human, report,
and JSON output. The visible outcomes cover root package install, Augnes Apps
package install, temp demo DB reset, temp demo DB migration, and temp demo DB
seed. Prepare also reports whether delegated setup left the worktree dirty or
introduced new dirty status lines or lockfile churn.

Prepare consumes doctor `temp_demo_db` status only. It does not inspect
default/user DB paths and does not create, migrate, seed, write, delete, chmod,
or directly inspect DB contents itself.
Doctor rejects `/tmp/augnes-demo.db` symlinks before read-only SQLite
inspection, and prepare keeps the same behavior as any other non-PASS
`temp_demo_db` result: recommend guarded setup without directly running DB
commands.

## Delegated setup summary shape

The guarded setup script emits a delimited JSON summary after dry-run,
successful execution, or failed execution:

```text
AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_BEGIN
{ ... }
AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_END
```

Summary fields:

- `tool`: `augnes-codex-local-demo-setup`
- `mode`: `dry-run` or `execute`
- `demo_db_path`: `/tmp/augnes-demo.db`
- `steps`: finite setup step objects
- `start_commands`: manual local runtime and MCP bridge commands
- `skipped_reasons`: concrete skipped reasons for non-setup actions
- `boundary`: authority boundary statements

Each step includes `id`, `label`, `display_command`, `attempted`, `completed`,
`status`, and `exit_code` when run. Dry-run steps are `SKIPPED` with
`dry_run_requires_yes`.

Prepare copies the parsed summary into JSON as `delegated_setup_summary`, exposes
the step list as `setup_steps`, and renders the same delegated setup step
outcomes in human and report output. If summary parsing fails, prepare falls
back to the delegated setup stdout/stderr tail and warns the user to inspect the
raw output.

Prepare reads `git status --short` before delegated setup and after delegated
setup. The combined `setup_worktree_status` includes:

- `before`: worktree status before delegated setup
- `after`: worktree status after delegated setup
- `new_dirty_entries`: status lines present after setup that were not present
  before setup
- `preexisting_dirty_entries`: status lines already present before setup
- `lockfile_churn_detected`: whether a lockfile status line appeared newly
  after setup, or `null` when git status failed
- `attribution_warning`: a warning when before/after status limits attribution

Dirty worktree after setup is not automatically attributed to setup if the
worktree was already dirty. In that case prepare reports:

```text
Worktree was already dirty before setup; review before/after status before attributing changes to setup.
```

Lockfile reporting distinguishes:

- lockfile changed after setup
- lockfile was already dirty before setup
- lockfile churn unknown because git status failed

Dirty worktree or lockfile churn is a warning/action item only; dirty worktree
reporting does not grant prepare authority to modify files. Prepare does not
revert files, delete files, or modify worktree changes.

## Lockfile churn guidance

Setup can dirty `apps/augnes_apps/package-lock.json` under some npm versions by
changing npm metadata. Users and Codex workers should inspect `apps/augnes_apps/package-lock.json`,
do not assume npm metadata churn is intended, and restore unrelated npm metadata churn after inspection as normal
repo hygiene.

If prepare reports "lockfile was already dirty before setup", do not attribute
the lockfile to the current setup run without diff review.

prepare does not auto-revert files, run `git checkout`, run `git reset`, or
otherwise restore files automatically.

## User-facing flow

1. User says "Codex, prepare Augnes."
2. Codex runs `npm run augnes:prepare`.
3. Prepare prints what is ready, whether setup is recommended, visible terminal
   actions, next commands, skipped checks, and boundaries.
4. If setup is recommended, user or Codex can run
   `npm run augnes:prepare -- --yes`.
5. Prepare delegates setup to the existing guarded setup script, reruns doctor,
   and reports before/after status plus delegated setup step outcomes.
6. Long-running local runtime and MCP bridge start commands remain visible
   terminal actions.

## Boundary

This PR keeps prepare as a guided prepare wrapper only and adds delegated setup
reporting only. It does not add runtime authority, DB schema changes, direct
finite setup commands in prepare, default/user DB writes, DB writes in prepare,
secret handling, token handling, provider/model calls, Codex SDK execution,
GitHub API calls from scripts, GitHub mutation, merge automation, approval
automation, publication automation, retry/replay automation, auto-merge
automation, external posting automation, proof/evidence writes,
perspective-memory persistence, perspective-memory item creation, product
boundary creation, product persistence boundary records, hidden daemon behavior,
"Run Codex from ChatGPT" behavior, local runtime startup, MCP bridge startup,
MCP tool calls, or Augnes state commit/reject authority.

Boundary phrase anchors: provider/model calls; proof/evidence writes; perspective-memory persistence; product boundary creation; Augnes state commit/reject authority.

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

Dogfood the updated `prepare --yes` output in a fresh isolated checkout where
package install and `/tmp/augnes-demo.db` setup are explicitly authorized, then
record whether the new delegated setup step outcomes reduce setup confusion.
