# AGENTS.md

## Codex Operating Contract For Augnes

This repository uses Augnes to keep committed state, pending proposals,
work traces, proof-only action records, and evidence rows distinct. Codex is a
repo implementation and verification worker. Preserve the authority boundaries.

## Active vNext Development Authority

- `docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md` is the active product north star.
- `docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md` defines the target
  technical meaning and provider-neutral exchange contracts.
- `docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md` governs current work
  selection, compatibility handling, and retirement sequencing.
- `docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md` governs completion and
  improvement claims.
- For strategy and PR-sequencing conflicts, the active vNext set takes
  precedence over older roadmap, status, Workplane, handoff, or Autohunt docs.
- For facts about current runtime behavior and implemented capabilities,
  existing code and current runtime docs remain authoritative until that
  behavior is intentionally changed and verified.
- The default profile is ChatGPT Work + Codex + OpenAI API. Core identities,
  state, Evidence, Claims, Perspective, Decisions, and protocol contracts must
  remain provider-neutral.
- Classify new work as Native Host, Adapter, Core, Projection/Inspector, or Lab.
  Do not create an unclassified product surface.
- Prefer the templates under `docs/vnext/templates/` for work slices, PR review,
  and durable architecture decisions.
- Do not expand workflow-stage tables, passive Workplane panels, Codex-only Core
  contracts, manual copy/paste flows, or custom schedulers unless the vNext
  Transition Roadmap explicitly justifies the compatibility cost.

## Start Of Work

- Read current repo instructions and task-relevant docs before editing.
- For Augnes code/docs/scripts implementation tasks, use Perspective Memory
  Reuse Intake before coding so task-start context includes prior Augnes memory.
- If a Core Handoff or Full Handoff is pasted into the task, use that pasted
  handoff as the primary work contract.
- For Augnes workflow tasks, use this context-diet minimum set:
  - `docs/vnext/00_AUGNES_VNEXT_DOCUMENT_INDEX.md`
  - `docs/vnext/01_AUGNES_VNEXT_MASTERPLAN.md`
  - `README.md`
  - `docs/AUTHORITY_MATRIX.md`
  - task-specific instructions
- Read additional documents only when the task requires them:
  - `docs/vnext/02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md` when changing
    Core, protocol, adapter, provider/model, identity, authority, or
    temporal/evidence meaning.
  - `docs/vnext/03_AUGNES_VNEXT_TRANSITION_ROADMAP.md` for work selection,
    compatibility, migration, legacy retirement, or milestone work.
  - `docs/vnext/04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md` for completion
    claims, dogfood, metrics, conformance, or test strategy.
  - Existing Codex session, bootstrap, and result documents only when actually
    using or modifying the current compatibility workflow.
- Inspect `git status` before editing and keep changes scoped to the task.
- If the local Augnes runtime is available, run `npm run codex:read-brief`.
- If `CODEX_WORK_ID` is set, use `npm run codex:read-brief` so the Work Brief
  context is read too.
- If no handoff is pasted, start with:
  `npm run codex:next-work -- --scope project:augnes`.
- If research work is requested, use:
  `npm run codex:next-work -- --scope project:augnes --prefer-research`, or
  `npm run codex:next-work -- --scope project:augnes --work-id AG-RESEARCH-CAPABILITY-LANES-001`
  for the current research capability preparation item, or
  `npm run codex:next-work -- --scope project:augnes --work-id AG-DOGFOOD-RESEARCH-001`
  when that historical dogfood work ID is named.
- Report honestly whether the work source was `runtime_work_brief`,
  `repo_seed_fallback`, `docs_fallback`, or `blocked`. Do not claim a live
  Work Brief, Work Picker, host observation, proof/evidence row, state change,
  work close, or PR URL unless it actually happened.
- Until an adapter-backed `RunReceipt` path replaces it, return Codex results with
  `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md` for manual paste through
  `codexResultText` or `codexResultPaste`. Treat this as a compatibility path,
  not the target vNext result-return architecture.

## Codex Augnes Reuse Hook v0.1

- Before implementing Augnes code/docs/scripts, get task-start memory context
  with Perspective Memory Reuse Intake.
- Use the resulting Codex Memory Brief as task context.
- Preserve `why_selected` and `reuse_boundary` when applying selected memory.
- Treat quality review warnings as operator-review signals, not semantic truth.
- Treat reuse context as task-start guidance, not as a blanket prohibition on
  useful product work. Storage, persistence, DB schema, API routes, App/MCP
  tools, provider integration, proof/evidence paths, Perspective workflows,
  package scripts, and refactors are allowed when they materially advance
  Augnes and remain reviewable.
- Do not create perspective memory automatically, hide background daemons,
  mutate Augnes committed state, approve/publish/retry/replay, externally post,
  or merge unless a task explicitly grants that irreversible or external
  authority.
- Project-local hooks require Codex hook trust review; if hooks are not trusted
  or enabled, run `npm run perspective:memory-reuse-intake -- --task "..." --brief`
  manually when useful.
- Report changed files, verification, skipped checks with concrete reasons, and
  remaining friction.

## Repository Owner Examples

- Use `hynk-studio/augnes` for new copyable examples, placeholders, templates,
  and future Codex handoff instructions.
- Treat `Aurna-code/augnes` as a historical/migration-era reference unless a
  task explicitly scopes updating a legacy fixture, report, or evidence record.
- Do not rewrite historical PR, issue, screenshot, dogfood, or evidence refs as
  if they originally targeted the current canonical owner.

## Authority Boundaries

- Never commit or reject Augnes state.
- Codex may edit repo files and open PRs through normal GitHub workflow.
- Never merge PRs, enable auto-merge, or claim merge authority.
- Never approve, publish, retry, replay, or externally post unless a future task
  explicitly scopes a Core-gated route and explicit user approval.
- Even when a future Core-gated publish, retry, or replay route is explicitly
  scoped, merge remains a user/GitHub review decision, not Codex authority.
- Do not execute Codex from ChatGPT, add ChatGPT execution controls, or imply
  ChatGPT owns implementation authority.
- Do not treat proof as approval.
- Do not treat a PR as merge authority.
- Do not treat legacy `external.*` marker state as accepted project fact.

## Evidence And IDs

- Do not fabricate work IDs, evidence IDs, action IDs, session IDs, PR refs, or
  skipped check results.
- Record concrete skipped reasons, such as `local runtime unavailable`,
  `missing CODEX_WORK_ID`, `missing CODEX_SESSION_ID`, `evidence API
  unavailable`, `no browser runtime available`, or `external check not
  applicable to this docs-only change`.
- Prefer proof-only completion with `npm run codex:record-completion-proof`
  when the runtime and `CODEX_WORK_ID` are available.
- Treat `npm run codex:record-completion` as legacy compatibility only unless
  explicitly instructed.

## Verification

- Run `npm run typecheck` for behavior changes and for documentation changes
  when requested by the task.
- Run relevant `npm run smoke:*` checks for touched areas.
- If a check is skipped, name the check and give a concrete reason.
- Do not claim a check, evidence row, action record, or proof closeout happened
  unless the command ran and returned the relevant result.

## Default Development Policy

Build the most useful next Augnes capability when the user has not set a
tighter scope fence. Broad categories such as runtime behavior, API routes,
App/MCP tools, DB schema, local persistence, provider integration, retrieval,
research capability implementation, proof/evidence paths, package scripts,
Perspective promotion workflows, UI changes, legacy-surface migration docs, and
substantial refactors are not blanket-forbidden by default.

Required discipline:

- Preserve existing user-facing behavior unless the task intentionally improves
  it.
- Preserve working smoke/typecheck expectations unless the PR explicitly
  updates them for better behavior.
- Preserve data integrity and make durable state changes easy to review.
- For persistence, include migration, rollback, or idempotency reasoning.
- For external calls, keep them explicit, bounded, configurable, and disabled
  by default unless the user requested live behavior.
- Keep irreversible actions under explicit user/operator control.
- Include compatibility notes when replacing existing behavior.
- Do not hide breaking changes as cleanup.

Authority boundaries still apply where they protect irreversible or external
side effects: do not directly commit/reject Augnes state, close work, write
proof/evidence, approve/publish/merge, mutate perspective memory, or externally
post unless the task explicitly scopes that Core-gated authority.

## PR Closeout

Every PR body should include:

- Summary
- Files changed
- Authority boundary statement
- Verification
- Skipped checks
- Proof-only closeout status or skipped reason

For docs-only PRs, explicitly confirm that no runtime, route, schema,
MCP/App tool, hook, plugin, skill, package script, or secret-handling changes
were made.
