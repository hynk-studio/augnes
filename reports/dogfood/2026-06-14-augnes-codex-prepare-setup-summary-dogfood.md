# Augnes Codex Prepare Setup Summary Dogfood

Date: 2026-06-14

## Summary

This report dogfoods the merged PR #547 prepare/setup-summary flow from a user and Codex-worker perspective. The improved output is materially easier to understand: setup step outcomes are visible, setup summary markers are parseable, `prepare --yes` surfaces delegated setup steps, and before/after worktree attribution correctly distinguishes new setup churn from already-dirty lockfile state.

Specific assertions:

- prepare --yes status: run.
- setup-local-demo --yes status: skipped direct command; delegated equivalent ran through `npm run augnes:prepare -- --yes`.
- setup summary markers parseable: yes.
- setup step outcomes visible in human output: yes.
- setup step outcomes visible in report output: yes.
- setup steps present in JSON output: yes.
- worktree dirty before setup: no.
- worktree dirty after setup: yes.
- new dirty entries after setup: yes, `M apps/augnes_apps/package-lock.json`.
- pre-existing dirty entries before setup: no.
- lockfile attribution result: changed after first setup; already dirty before later repeated setup-mode captures.
- setup-generated changes manually restored after inspection: yes, `apps/augnes_apps/package-lock.json`.
- runtime process stopped after dogfood: yes.
- MCP bridge process stopped after dogfood: yes.
- MCP tools were not called unless explicitly scoped: yes, no MCP tools were called.
- provider/model checks were not run: yes.
- `/tmp/augnes-demo.db` was the only allowed demo DB path: yes.
- no default/user DB paths were used: yes.
- no secrets or `~/.codex/config.toml` were read/written: yes.

## Environment

- Repository: `hynk-studio/augnes`
- Local checkout: `/Users/hynk/Documents/augnes`
- Branch used for dogfood PR: `codex/augnes-prepare-setup-summary-dogfood`
- Base state: `main` fast-forwarded through merged PR #547, merge commit `550f05e`
- Node: `v25.9.0`
- npm: `11.12.1`
- Runtime URL: `http://localhost:3000`
- MCP bridge URL: `http://localhost:8787/mcp`
- Demo DB policy: the only allowed demo DB path was `/tmp/augnes-demo.db`
- Secret policy: runtime startup used `env -u OPENAI_API_KEY`; no secrets were read
- Config policy: `~/.codex/config.toml` was not read or written

## Commands run

- `npm run augnes:prepare`
- `npm run augnes:prepare -- --json`
- `npm run augnes:prepare -- --report`
- `npm run augnes:setup-local-demo`
- `npm run augnes:prepare -- --yes`
- `npm run augnes:prepare -- --yes --json`
- `npm run augnes:prepare -- --yes --report`
- `env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000`
- `AUGNES_ENABLE_AGENT_BRIDGE=true AUGNES_API_BASE_URL=http://localhost:3000 npm --prefix apps/augnes_apps run dev`
- `npm run augnes:doctor -- --json`
- `npm run augnes:prepare -- --json`
- `curl -sS 'http://localhost:3000/api/state/brief?scope=project:augnes' | jq '{runtime, scope}'`
- `curl -i 'http://localhost:8787/mcp'`

The `--yes --json` and `--yes --report` modes were rerun sequentially after an initial capture pass because each mode delegates setup. The assertions below use the sequential captures.

## Commands skipped with concrete reasons

- Skipped: `npm run augnes:setup-local-demo -- --yes`. Reason: running it directly would duplicate the guarded setup already delegated by `npm run augnes:prepare -- --yes`; the delegated command was still exercised through prepare.
- Skipped: MCP tool calls. Reason: the task explicitly said not to call MCP tools unless separately scoped; bridge validation was limited to HTTP endpoint reachability.
- Skipped: provider/model checks. Reason: the task explicitly forbade provider/model checks, and the local prepare/setup flow must not require `OPENAI_API_KEY`.
- Skipped: default/user DB paths. Reason: the task allowed only `/tmp/augnes-demo.db`; setup, runtime startup, reset, migrate, and seed were constrained to that temp DB path.
- Skipped: `~/.codex/config.toml` reads/writes. Reason: the task forbade writing it and also forbade reading secrets; this dogfood did not inspect user-level Codex config.
- Skipped: perspective-memory items, product persistence boundary records, and proof/evidence rows. Reason: the dogfood was report/smoke only and had no persistence authority.
- Skipped: Augnes commit/reject state changes. Reason: this dogfood did not create perspective-memory items, product boundary records, proof/evidence rows, or any Augnes state approval/rejection.
- Skipped: Codex SDK execution and GitHub API calls from scripts. Reason: the task forbade both, and this PR only adds a static report smoke.
- Skipped: browser validation. Reason: this PR changes no route, UI component, CSS, browser surface, or clipboard flow.

## Initial prepare result

`npm run augnes:prepare` exited 0 and reported:

- `doctor_status: ACTION_REQUIRED`
- `setup_recommended: no`
- `setup_executed: no`
- ready checks passed for repository root, Node, npm, root `node_modules`, and `apps/augnes_apps/node_modules`
- next visible terminal actions were runtime startup and MCP bridge startup

`npm run augnes:prepare -- --json` exited 0. The JSON was parseable and showed:

- `before_doctor.overall_state: ACTION_REQUIRED`
- static setup and package script checks passed
- `runtime_state_brief` warned with `ECONNREFUSED`
- `mcp_bridge_endpoint` warned with `ECONNREFUSED`
- `setup_status.state: SKIPPED_NOT_RECOMMENDED`

`npm run augnes:prepare -- --report` exited 0. It printed concise report sections for Summary, Prepare result, Before doctor status, Setup recommendation, Setup execution status, Delegated setup step outcomes, Setup worktree status, Recommended next actions, Skipped checks, and Boundary.

## Setup dry-run summary result

`npm run augnes:setup-local-demo` exited 0 and stayed in dry-run mode. It printed the finite commands that would run only after `--yes`:

- `npm install`
- `npm --prefix apps/augnes_apps install`
- `AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:reset`
- `AUGNES_DB_PATH=/tmp/augnes-demo.db npm run db:migrate`
- `AUGNES_DB_PATH=/tmp/augnes-demo.db npm run demo:seed`

It also printed the runtime and MCP bridge commands as manual long-running start commands.

## Setup --yes result or skipped reason

setup-local-demo --yes status: skipped direct command.

Direct `npm run augnes:setup-local-demo -- --yes` was skipped because `npm run augnes:prepare -- --yes` delegates to the exact guarded command. Running both directly would duplicate package install and temp DB reset/migrate/seed work.

The delegated setup path did run through prepare:

- delegated command: `npm run augnes:setup-local-demo -- --yes`
- delegated setup exit code: 0
- delegated setup summary parse status: PASS
- temp demo DB path: `/tmp/augnes-demo.db`

## Prepare --yes human output result

`npm run augnes:prepare -- --yes` exited 0 and reported:

- `doctor_status: ACTION_REQUIRED`
- `setup_recommended: no`
- `setup_executed: yes`
- `after_doctor_status: ACTION_REQUIRED`

Setup step outcomes were visible in human output:

- root dependencies: PASS (exit 0)
- Augnes Apps dependencies: PASS (exit 0)
- temp demo DB reset: PASS (exit 0)
- temp demo DB migration: PASS (exit 0)
- temp demo DB seed: PASS (exit 0)

The human output also made the first setup attribution clear:

- before: PASS, clean
- after: WARN, 1 dirty entry
- lockfile: lockfile changed after setup
- new after setup: `M apps/augnes_apps/package-lock.json`
- pre-existing before setup: none

## Prepare --yes JSON output result

`npm run augnes:prepare -- --yes --json` exited 0. The JSON included:

- `yes_enabled: true`
- `setup_executed: true`
- `setup_status.state: PASS`
- `setup_status.summary_parse_status: PASS`
- `delegated_setup_summary.mode: execute`
- `delegated_setup_summary.demo_db_path: /tmp/augnes-demo.db`
- `setup_steps` array with five entries

Setup steps were present in JSON output: yes. The steps were:

- `root_dependencies`: PASS
- `apps_dependencies`: PASS
- `temp_demo_db_reset`: PASS
- `temp_demo_db_migrate`: PASS
- `temp_demo_db_seed`: PASS

The sequential JSON capture correctly treated the lockfile as pre-existing dirty because it was run after the first setup-mode capture had already produced the lockfile diff.

## Prepare --yes report output result

`npm run augnes:prepare -- --yes --report` exited 0. Setup step outcomes were visible in report output: yes.

The report output included:

- `setup_executed: true`
- `setup_status: PASS`
- delegated command: `npm run augnes:setup-local-demo -- --yes`
- `summary_parse_status: PASS`
- delegated setup step outcomes for all five setup steps

The sequential report capture also showed accurate repeated-run attribution:

- before: WARN, 1 dirty entry
- after: WARN, 1 dirty entry
- lockfile: lockfile was already dirty before setup
- new after setup: none
- pre-existing before setup: `M apps/augnes_apps/package-lock.json`

This is not misleading: the first setup run produced the dirty lockfile, and later setup-mode runs did not reattribute the same dirty entry as new.

## Delegated setup step outcomes

Delegated setup step outcomes were visible in human output: yes.

Delegated setup step outcomes were visible in report output: yes.

Setup steps were present in JSON output: yes.

All delegated setup steps passed:

- root dependencies: PASS (exit 0)
- Augnes Apps dependencies: PASS (exit 0)
- temp demo DB reset: PASS (exit 0)
- temp demo DB migration: PASS (exit 0)
- temp demo DB seed: PASS (exit 0)

## Setup summary marker parse result

Setup summary markers were present and parseable.

- dry-run start marker: `AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_BEGIN`
- dry-run end marker: `AUGNES_LOCAL_DEMO_SETUP_SUMMARY_JSON_END`
- dry-run summary parse result: PASS
- delegated setup summary parse result from prepare --yes: PASS
- parsed dry-run mode: `dry-run`
- parsed delegated mode: `execute`
- parsed demo DB path: `/tmp/augnes-demo.db`
- parsed setup step count: 5

## Worktree status before setup

Worktree dirty before setup: no.

`git status --short` before guarded setup was empty.

Pre-existing dirty entries before setup: none.

## Worktree status after setup

Worktree dirty after setup: yes.

`git status --short` after the first guarded setup showed:

```text
 M apps/augnes_apps/package-lock.json
```

Runtime and bridge cleanup did not add more dirty entries.

## New dirty entries after setup

New dirty entries after setup: yes.

New dirty entries:

- `M apps/augnes_apps/package-lock.json`

The diff removed `peer: true` lines from four entries in `apps/augnes_apps/package-lock.json`:

- `@modelcontextprotocol/sdk`
- `express`
- `hono`
- `zod`

## Pre-existing dirty entries before setup

Pre-existing dirty entries before setup: no.

Before the first guarded setup run, the worktree was clean.

Later repeated `prepare --yes --json` and `prepare --yes --report` captures correctly reported `apps/augnes_apps/package-lock.json` as pre-existing dirty rather than new setup churn.

## Lockfile attribution result

Lockfile changed after setup, was already dirty before later repeated setup-mode captures, and churn was not unknown.

Attribution result:

- first `prepare --yes` run: lockfile changed after setup
- sequential `prepare --yes --json` run: lockfile was already dirty before setup
- sequential `prepare --yes --report` run: lockfile was already dirty before setup

This attribution was accurate and not misleading. It made lockfile churn visible without auto-reverting it.

## Runtime startup result or skipped reason

runtime startup status: run.

The runtime was started with:

```bash
env -u OPENAI_API_KEY AUGNES_DB_PATH=/tmp/augnes-demo.db npm run dev -- --port 3000
```

Next.js reported readiness on `http://localhost:3000`. The startup did not require `OPENAI_API_KEY` and did not use a default/user DB path.

Runtime process stopped after dogfood: yes. Port `3000` had no listener after cleanup.

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

MCP bridge process stopped after dogfood: yes. Port `8787` had no listener after cleanup.

## Doctor after setup/runtime result

`npm run augnes:doctor -- --json` exited 0 after setup, runtime startup, and bridge startup.

Overall result:

- `overall_state: ACTION_REQUIRED`

The only observed reason for ACTION_REQUIRED was dirty git status from setup-generated lockfile churn. Runtime and bridge checks passed:

- `runtime_state_brief`: HTTP 200 Augnes state brief for `project:augnes`
- `mcp_bridge_endpoint`: HTTP 406 endpoint reachability only; MCP tool calls not tested

## Prepare after setup/runtime result

`npm run augnes:prepare -- --json` exited 0 after setup, runtime startup, and bridge startup.

Observed result:

- `before_doctor.overall_state: ACTION_REQUIRED`
- `setup_recommended.recommended: false`
- `setup_executed: false`
- `setup_status.state: SKIPPED_NOT_RECOMMENDED`
- `runtime_state_brief`: PASS
- `mcp_bridge_endpoint`: PASS

The ACTION_REQUIRED state was from dirty git status, not runtime or bridge readiness.

## State brief check result

The state brief check passed:

```json
{
  "runtime": "augnes",
  "scope": "project:augnes"
}
```

No default/user DB paths were used. The runtime used only `/tmp/augnes-demo.db`.

## MCP bridge reachability result

`curl -i 'http://localhost:8787/mcp'` exited 0 and returned:

- `HTTP/1.1 406 Not Acceptable`
- JSON body: `Not Acceptable: Client must accept text/event-stream`

This confirms endpoint reachability only. It was not an MCP tool call.

## User-facing friction

- `prepare --yes` is now much clearer because it shows setup step outcomes and worktree attribution, but the setup command is nested and still reads like a lot of machinery for a first-time user.
- Dry-run setup summary markers are parseable, but they are visually heavy in terminal output.
- The MCP bridge reachability result is expected HTTP 406, which can look like failure unless the report explicitly explains it as endpoint reachability only.
- The runtime and bridge start commands are explicit and correct, but long enough that a user benefits from copy/paste.
- Lockfile churn is visible, which is good, but users need a stronger hint that generated npm lockfile churn may be normal repo hygiene rather than an Augnes behavior change.

## Codex-worker friction

- The worker must keep straight which `--yes` capture is first, because first-run attribution and repeated-run attribution intentionally differ.
- Re-running `prepare --yes --json` or `prepare --yes --report` repeats finite setup and can reset the temp DB again; it is safe here but should be treated as a real action.
- Doctor stays ACTION_REQUIRED while setup-generated lockfile churn is present, even when runtime and bridge checks pass; a worker must explain that distinction.
- The prepare JSON is parseable and useful, but npm script banners mean a parser needs to find the JSON payload rather than assume stdout is raw JSON.
- The bridge curl is reachability only; the worker must not overclaim MCP tool readiness.

## What worked well

- Setup step outcomes are visible in human output.
- Setup step outcomes are visible in report output.
- Setup steps are present in JSON output.
- Dry-run summary markers are present and parseable.
- `prepare --yes` delegates finite setup without starting long-running runtime or bridge processes.
- Before/after worktree attribution correctly identified new lockfile churn on the first run.
- Repeated setup-mode captures correctly treated the lockfile as pre-existing dirty.
- Runtime startup remained explicit and did not require `OPENAI_API_KEY`.
- Bridge startup remained explicit and bridge HTTP reachability was understandable once framed as endpoint reachability only.

## What confused or slowed setup

- Running all requested `--yes` output modes means setup is repeated unless the worker chooses to skip some modes; this is safe with `/tmp/augnes-demo.db` but still non-obvious.
- `setup_recommended: no` can coexist with a deliberate `--yes` dogfood run, because the command still executes setup when explicitly requested.
- The first setup-generated dirty entry made later doctor/prepare status ACTION_REQUIRED, which is correct but easy to misread as runtime failure.
- The lockfile diff is npm metadata churn, not a product change, but it still needs manual inspection.
- The MCP bridge GET result is a 406 by design for this reachability check.

## Suggested improvements ranked P0/P1/P2

### P0

None. The dogfood found no authority boundary break, provider/model check, secret access, default/user DB write, MCP tool call, or Augnes state mutation.

### P1

Add a small prepare/report hint when lockfile churn is detected after setup: "Generated npm lockfile churn detected; inspect before committing and restore if unrelated to the PR."

Add an output-mode note for `prepare --yes --json` and `prepare --yes --report` that these modes still execute delegated setup, including temp DB reset/migrate/seed.

### P2

Consider a shorter "copy next command" block for runtime and bridge startup so users can move from prepare to manual long-running processes faster.

Consider labeling the `/mcp` HTTP 406 check as "expected reachability response" in doctor output to reduce false alarm for users.

## Cleanup performed

- Stopped the MCP bridge process started during dogfood.
- Stopped the local Next runtime process started during dogfood.
- Verified no listeners remained on ports `3000` or `8787`.
- Inspected setup-generated lockfile churn in `apps/augnes_apps/package-lock.json`.
- Manually restored `apps/augnes_apps/package-lock.json` after inspection as repo hygiene because the diff was generated npm metadata churn and not part of this report/smoke PR.
- Left `/tmp/augnes-demo.db` in place because it is the allowed demo DB artifact for this local setup flow.

Any setup-generated changes manually restored after inspection: yes, `apps/augnes_apps/package-lock.json`.

## Authority boundary

This PR adds a dogfood report and smoke only.

It does not add runtime authority, DB schema changes, secret handling, provider calls, provider/model checks, Codex SDK execution, GitHub API calls from scripts, merge automation, approval automation, publish automation, retry/replay automation, proof/evidence writes, perspective-memory persistence, product boundary creation, product persistence boundary records, default/user DB writes, `~/.codex/config.toml` reads or writes, MCP tool calls, or Augnes state commit/reject authority.

No MCP tools were called. No provider/model checks were run. The only allowed demo DB path was `/tmp/augnes-demo.db`. No default/user DB paths were used. No secrets or `~/.codex/config.toml` were read/written.

## Next recommended PR

Add a narrow prepare-output usability follow-up that improves lockfile-churn guidance and labels repeated `prepare --yes --json` / `prepare --yes --report` runs as setup-executing modes. Keep it docs/CLI/smoke only unless a separate task explicitly reopens runtime authority or persistence scope.
