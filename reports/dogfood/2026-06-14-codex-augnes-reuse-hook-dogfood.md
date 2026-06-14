# Dogfood Codex Augnes Reuse Hook v0.1

## Summary

Result: PASS with trust-flow limitation and no-match friction.

PR #568 was merged into `main` as merge commit `8ee1769`. After pulling latest
`main`, the project-local `.codex/hooks.json` and
`.codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs` were present, and
`AGENTS.md` included Codex Augnes Reuse Hook guidance.

This environment did not expose Codex's interactive `/hooks` trust UI, so real
Codex session hook execution could not be observed or trusted here. The dogfood
therefore used direct `UserPromptSubmit` hook fixture execution with stdin JSON.
That fallback proved the hook command injects `Codex Augnes Reuse Context` from
both repo root and nested cwd, skips opt-out/casual/duplicate prompts, triggers
for the Korean development prompt `Augnes reuse hook dogfood 보고서 추가해줘`, and
continues fail-open with a concise warning when intake execution fails.

The default local store read succeeded but returned zero persisted
perspective-memory items, so no selected memory IDs were available. The injected
context still contained a generated Codex Memory Brief shell, no-match guidance,
`why_selected`, `reuse_boundary`, `quality_review_preview_summary`, warnings,
authority boundary, and closeout expectations.

Next recommended PR: hook trust/copy/filter dogfood polish only after a real
Codex `/hooks` trust session can be observed. Korean filtering did not fail in
this fixture because the prompt included English Augnes reuse hook terms. Do not
add storage or persistence.

## Environment

- Repository: `hynk-studio/augnes`
- Local path: `/Users/hynk/Documents/augnes`
- Branch: `codex/augnes-reuse-hook-dogfood`
- Base: updated `main` at `8ee1769`
- Hook config: `.codex/hooks.json`
- Hook command: `.codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs`
- Hook event: `UserPromptSubmit`
- Intake command used by hook: `npm run --silent perspective:memory-reuse-intake -- --task "..." --json`
- Direct fallback command shape:
  `echo '<UserPromptSubmit JSON>' | node .codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs`
- Default hook context limit: `additionalContext` max `12000` characters

Dogfood task prompt:

```text
Review whether Codex Augnes Reuse Hook v0.1 automatically injects Augnes reuse context for this task, and identify any hook trust, filter, Korean prompt, nested cwd, no-match, or context-size friction.
```

## Prerequisite / PR #568 merge check

Confirmed.

- `git fetch --prune origin` updated `origin/main` from `f637419` to `8ee1769`.
- `origin/main` contains `Merge pull request #568 from hynk-studio/codex/augnes-reuse-hook-v0-1`.
- `git merge-base --is-ancestor a63d4c7 origin/main` returned success.
- Local `main` was fast-forwarded to `8ee1769`.
- `.codex/hooks.json` exists.
- `.codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs` exists.
- `AGENTS.md` includes `## Codex Augnes Reuse Hook v0.1`.
- Package script `smoke:codex-augnes-reuse-hook` exists.
- Package script `perspective:memory-reuse-intake` exists.

## Hook trust review

Interactive trust could not be completed in this environment.

- Did `/hooks` show the project-local `UserPromptSubmit` hook? Not observed in
  the real Codex UI. Static config confirms `.codex/hooks.json` exposes a
  project-local `UserPromptSubmit` command hook.
- Was the hook trusted for this session? Not confirmed. This session did not
  provide an interactive `/hooks` trust review surface.
- Trust conclusion: blocked for real-session proof. Fallback direct hook fixture
  execution was used and is labeled as fallback, not real Codex session
  validation.

## Real Codex session result

Real Codex hook execution was not observed.

This run started from a pasted request in the Codex desktop context, not from a
fresh Augnes repo task prompt after an interactive `/hooks` trust review. I did
not see a task-start injected `Codex Augnes Reuse Context` in the conversation
context before acting. Therefore, this report does not claim that a trusted real
Codex session automatically displayed or consumed the injected context.

## Fallback fixture execution result, if used

Fallback was used.

The direct fixture execution used the actual project-local hook script and
`UserPromptSubmit` stdin JSON payloads. Results:

- Root cwd development prompt: status `0`, injected `additionalContext`, context
  size `4548` characters.
- Nested cwd development prompt from `apps/augnes_apps`: status `0`, injected
  `additionalContext`, context size `4548` characters.
- Opt-out prompt containing `skip augnes reuse`: status `0`, no stdout, no
  additional Augnes reuse context injected.
- Casual prompt `thanks`: status `0`, no stdout, no additional Augnes reuse
  context injected.
- Duplicate-context prompt containing `Codex Augnes Reuse Context`: status `0`,
  no stdout, no duplicate context injected.
- Korean development prompt `Augnes reuse hook dogfood 보고서 추가해줘`: status `0`,
  injected `additionalContext`, context size `4068` characters.
- Forced fail-open probe with `PATH=""`: status `0`, injected a concise warning:
  `Perspective Memory Reuse Intake failed open: spawnSync npm ENOENT`.

The injected fallback context included:

- `Codex Augnes Reuse Context`
- `Generated Codex Memory Brief`
- `Selected Memory IDs`
- `why_selected`
- `reuse_boundary`
- `quality_review_preview_summary`
- `Warnings`
- `No-Match Guidance`
- `Authority Boundary`
- `Closeout Expectations`

Default store result:

- `candidate_source.read_via: listPerspectiveMemoryItems`
- `candidate_source.total_items_read: 0`
- `candidate_source.total_matched_candidates: 0`
- `selected_item_count: 0`
- `no_match_state: store_read_zero_items`
- `no_match_message: Store read succeeded, but zero persisted perspective-memory items were available; continue without reuse or create/review accepted memory items before rerunning.`

## Root cwd prompt result

PASS in fallback fixture execution.

The root cwd payload used `/Users/hynk/Documents/augnes` as `cwd` and the normal
development dogfood prompt. The hook resolved the Augnes repo, ran
`perspective:memory-reuse-intake`, and emitted `hookSpecificOutput` with
`additionalContext`.

Because the default local store had zero persisted perspective-memory items, the
context did not contain selected memory IDs. It did contain no-match guidance,
`why_selected`, `reuse_boundary`, `quality_review_preview_summary`, warnings,
authority boundary, and closeout expectations.

## Nested cwd prompt result

PASS in fallback fixture execution.

The nested payload used `/Users/hynk/Documents/augnes/apps/augnes_apps` as
`cwd`. The hook still resolved the Augnes repo root through git root detection
and emitted the same 4548-character `additionalContext` shape as the root run.

This validates the nested cwd path in the direct hook execution fallback. It
does not prove that a trusted Codex session running from nested cwd displayed
the context, because the interactive trust flow was unavailable.

## Opt-out prompt result

PASS.

Prompt:

```text
Review whether Codex Augnes Reuse Hook v0.1 injects context, skip augnes reuse
```

The hook exited `0` with no stdout. No `Codex Augnes Reuse Context` or
additional Augnes reuse context was injected.

## Casual prompt result

PASS.

Prompt:

```text
thanks
```

The hook exited `0` with no stdout. The casual prompt skip worked and no
additional Augnes reuse context was injected.

## Duplicate-context prompt result

PASS.

The prompt contained:

```text
# Codex Augnes Reuse Context
```

The hook exited `0` with no stdout. Duplicate brief detection skipped injection,
so duplicate context was not injected.

## Korean prompt result

PASS with caveat.

Prompt:

```text
Augnes reuse hook dogfood 보고서 추가해줘
```

The hook emitted `Codex Augnes Reuse Context` with a 4068-character
`additionalContext`. It included the required no-match guidance and boundary
sections.

Caveat: this Korean prompt included English terms `Augnes reuse hook dogfood`,
which match the current development-task filters. This run does not prove that a
fully Korean development prompt without English Augnes/code terms would trigger.
Korean/non-English prompt filtering remains a concrete follow-up candidate only
if a real prompt misses the hook.

## Fail-open result

PASS.

The fail-open probe ran the hook with the normal development payload and
`PATH=""`, making `npm` unavailable to the hook subprocess. The hook still
exited `0` and emitted a concise `Codex Augnes Reuse Context` warning:

```text
Perspective Memory Reuse Intake did not complete. The hook is fail-open, so continue the task without blocking.
Perspective Memory Reuse Intake failed open: spawnSync npm ENOENT
```

This confirmed Codex should continue and receive at most a concise warning when
intake execution fails. No repair, runtime startup, setup, provider call, DB
schema change, migration, or persistence path was triggered.

## Additional context quality

Useful enough in fallback, with no-match limitation.

- Root and nested fallback contexts were `4548` characters, below the `12000`
  character cap.
- Korean fallback context was `4068` characters, below the cap.
- The context included `additionalContext`, `Codex Augnes Reuse Context`,
  `Generated Codex Memory Brief`, `quality_review_preview_summary`,
  `why_selected`, `reuse_boundary`, warnings, authority boundary, and closeout
  expectations.
- The no-match guidance was clear that the store read succeeded but zero
  persisted items were available.
- No context-size or compaction friction appeared.
- Selected memory IDs were not present because no persisted items existed in the
  default store for this run.
- Did the hook make Codex use Augnes memory by default? In the observable direct
  hook fallback, it would have supplied Augnes no-match reuse context by default
  for development prompts. In a real Codex session, this remains unconfirmed
  until `/hooks` trust can be completed and observed.

## Boundary

This PR is dogfood/report/smoke/package only.

Boundary:

- no provider/model calls
- no OpenAI API calls
- no MCP tool calls
- no Codex SDK execution
- no GitHub mutation from scripts
- no persistence writes
- no DB schema or migration
- no automatic memory creation
- no memory item mutation
- no runtime startup
- no MCP bridge startup
- no reuse packet persistence
- no return binding persistence
- no quality review persistence
- no product boundary creation
- no automatic synthesis
- no default/user DB writes
- no hidden background daemons
- no Augnes state commit/reject authority
- no proof/evidence writes
- no setup/prepare polish
- no hook/product/helper code changes

The only repository changes in this PR are the dogfood report, its smoke, and
the package script wiring.

## Verification

Dogfood fixture commands passed:

- `echo '<UserPromptSubmit JSON>' | node .codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs` from repo root
- `echo '<UserPromptSubmit JSON>' | node .codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs` with `cwd` set to `apps/augnes_apps`
- `echo '<UserPromptSubmit JSON>' | node .codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs` with `skip augnes reuse`
- `echo '<UserPromptSubmit JSON>' | node .codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs` with `thanks`
- `echo '<UserPromptSubmit JSON>' | node .codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs` with `Codex Augnes Reuse Context`
- `echo '<UserPromptSubmit JSON>' | node .codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs` with `Augnes reuse hook dogfood 보고서 추가해줘`
- `PATH="" echo '<UserPromptSubmit JSON>' | node .codex/hooks/augnes-reuse-intake-user-prompt-submit.mjs` equivalent fail-open probe through `spawnSync`

Repository verification for this PR:

- `npm run smoke:codex-augnes-reuse-hook`
- `npm run smoke:codex-augnes-reuse-hook-dogfood-report`
- `npm run smoke:perspective-memory-reuse-intake`
- `npm run smoke:perspective-memory-reuse-intake-dogfood-report`
- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:perspective-memory-reuse-quality-review`
- `npm run smoke:perspective-memory-reuse-quality-review-dogfood-report`
- `npm run smoke:perspective-memory-reuse-return-binding`
- `npm run smoke:perspective-memory-reuse-return-binding-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-seed`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-harness-rerun-report`
- `npm run smoke:perspective-memory-reuse-quality-review-panel-dogfood-report`
- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-codex-prepare`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## Skipped checks with concrete reasons

- Real Codex `/hooks` trust review skipped because this environment did not
  expose an interactive `/hooks` UI.
- Real Codex-session automatic injection skipped because hook trust could not be
  completed and observed here.
- Browser/runtime validation skipped because this change has no browser-visible
  route, UI surface, runtime startup path, or clipboard flow.
- MCP bridge startup skipped because the boundary prohibits MCP startup and the
  hook must not require bridge behavior.
- Provider/model checks skipped because the boundary prohibits provider/model
  calls.
- OpenAI API calls skipped because the boundary prohibits OpenAI API calls.
- Codex SDK execution skipped because the boundary prohibits Codex SDK
  execution.
- GitHub mutation from scripts skipped because scripts must not mutate GitHub.
- Product/helper/hook code changes skipped because dogfood did not reveal a
  blocker requiring code changes.
- Fully Korean prompt without English Augnes/code terms skipped because the
  requested Korean fixture included English terms and adding broader filter
  coverage would be product behavior work.

## Cleanup status

- Pre-edit hook fixture execution left `git status --short` clean.
- No runtime process, browser session, hidden background daemon, MCP bridge, or
  provider/model process was started.
- No temp DB seed setup was created for this dogfood.
- No perspective-memory persistence writes, reuse packet persistence,
  return-binding persistence, quality review persistence, DB schema change, or
  migration was performed.
- The working tree now contains only the expected dogfood report, smoke script,
  and `package.json` script wiring for this PR.

## Remaining friction

- `/hooks` trust flow is still unclear because it could not be completed in this
  environment.
- Real Codex session automatic injection remains unproven until a trusted
  `/hooks` session is run.
- Default local store had zero persisted memory items, so this dogfood only
  proved no-match reuse context, not selected-memory reuse in a real session.
- Korean prompt filtering passed for the requested mixed Korean/English prompt,
  but fully Korean development prompts may still skip without matching English
  development-task terms.
- `additionalContext` was useful and not too large in fallback; no context-size
  friction was found.
- No storage/persistence is needed. There is no concrete product reason from
  this dogfood to add storage.

## Next recommended PR

Run a real Codex session trust dogfood after using `/hooks` to inspect and trust
the project-local `UserPromptSubmit` hook. Keep that PR dogfood/report/smoke
only unless a real blocker appears.

Only consider hook filter/copy/compaction tuning if that real session reveals
concrete friction:

- Korean prompt filtering misses real development prompts.
- `/hooks` trust flow is unclear to the operator.
- `additionalContext` is too long.
- no-match or fail-open warning copy is too noisy.
- duplicate context detection is too aggressive or too weak.

Do not recommend storage/persistence unless a future dogfood produces a concrete
product reason.
