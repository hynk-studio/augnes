# Augnes Research Work User Happy Path Observation v0.1

## Date

2026-06-17

## Baseline Commit

`da683ce` (`main` after merged PR #617).

## Scenario Purpose

Document the user-facing happy path for the preview-only research work loop:
Work Picker / Work Brief -> Core Handoff -> Codex worker bootstrap -> result
report -> Augnes preview review.

This observation uses `AG-DOGFOOD-RESEARCH-001` as the primary research work
item. It connects these existing repo-backed contracts:

- `docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md`
- `docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md`
- `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`

## User Role

The user is a human Augnes operator who wants to pick the current research work
item, hand it to Codex without granting extra authority, receive a field-first
Codex result report, and paste that report back for Augnes preview review.

## Run Mode

Run mode: deterministic observation.

Live Work Picker / Work Brief was skipped. No `AUGNES_API_BASE_URL` was
configured, no local Augnes runtime was started for this PR, and no MCP
Inspector or ChatGPT Developer Mode session was opened. The repo-backed Codex
worker bootstrap was actually run with:

```sh
npm run codex:next-work -- --scope project:augnes --work-id AG-DOGFOOD-RESEARCH-001
```

Observed bootstrap result:

- `source`: `repo_seed_fallback`
- `runtime_attempted`: `false`
- `runtime_available`: `false`
- `fallback_reason`: `runtime_not_configured`
- `work_id`: `AG-DOGFOOD-RESEARCH-001`
- `scope`: `project:augnes`
- `title`: `Research accumulation scenario pack for ChatGPT-Augnes-Codex dogfood`
- `result_report_template`: `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`
- `next_return_path`: paste the field-first report through `codexResultText` or
  `codexResultPaste` for Augnes preview review.

## Explicit Statement Of What Was Not Run

- No live Work Picker was run.
- No live Work Brief was retrieved.
- No live Work Contract Card was opened.
- No Core Handoff was copied from a live UI.
- No Codex worker was automatically executed by Augnes.
- No paper ingestion was run.
- No paper fetching was run.
- No provider/OpenAI calls were made.
- No embeddings/RAG/vector search was run.
- No crawlers or indexing were run.
- No DB migration was run.
- No durable research state write happened.
- No proof/evidence write happened.
- No work close/status mutation happened.
- No event creation/mutation happened.
- No state commit/reject happened.
- No App/MCP tools were added or called for this observation.
- No `work_loop_readonly` Developer Mode tool surface widening happened.
- No automatic GitHub fetch/review/merge/publish controls were added or run
  from Augnes.

## User-Facing Happy Path

### Step 1: User finds research work

The user should be able to find research work by looking for
`AG-DOGFOOD-RESEARCH-001`, scope `project:augnes`, and the title
`Research accumulation scenario pack for ChatGPT-Augnes-Codex dogfood`.

In the deterministic observation, the user can tell which research work item to
pick from `scripts/demo-seed.mjs`,
`docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md`, and the
`npm run codex:next-work` output. The live Work Picker question remains
unobserved in this PR.

### Step 2: User opens Work Brief / Work Contract Card

The expected live path is for the user to open Work Brief / Work Contract Card
for `AG-DOGFOOD-RESEARCH-001` and inspect the current task, expected files,
expected checks, stop conditions, and manual result-return path.

In this deterministic observation, the equivalent repo-backed sources are the
seeded work item, the scenario pack, and
`docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md`. The user can tell what the next
action is: keep the work preview-only and return a field-first Codex report
through `codexResultText` or `codexResultPaste`.

### Step 3: User copies Core Handoff or uses Codex bootstrap

If the live Work Contract Card is available, the user should copy Core Handoff
as the primary handoff packet. If the live UI or pasted handoff is unavailable,
the user can use Codex bootstrap through:

```sh
npm run codex:next-work -- --scope project:augnes --work-id AG-DOGFOOD-RESEARCH-001
```

The user can tell whether Codex should use Core Handoff or `codex:next-work`:
Core Handoff is preferred when the live card or pasted packet exists;
`codex:next-work` is the deterministic discovery fallback when no live handoff
or runtime Work Brief is available.

Short user instruction: copy Core Handoff or use Codex bootstrap.

### Step 4: Codex identifies AG-DOGFOOD-RESEARCH-001 through codex:next-work

Codex can identify `AG-DOGFOOD-RESEARCH-001` through
`npm run codex:next-work`. The actual run in this PR returned
`repo_seed_fallback`, `runtime_not_configured`, and the expected result report
template path.

This is enough for Codex to proceed with bounded docs/smoke observation work,
but it is not a claim that the live Work Picker or live Work Brief was
observed.

### Step 5: Codex produces and returns result report

Codex should produce the final result using
`docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`. The report should include
changed files, verification commands and results, skipped checks with concrete
reasons, remaining caveats, authority boundaries, and the next recommended
step.

Codex returns result report text to the user for manual paste-back; Augnes does
not automatically generate, collect, or approve it.

The result report must not claim a PR URL, live host observation, proof/evidence
rows, event rows, state decisions, work closure, provider calls, or product
runtime behavior unless those facts actually happened.

### Step 6: User pastes result through codexResultText / codexResultPaste

The user should paste result for Augnes preview review through
`codexResultText` or `codexResultPaste`. The happy path is manual result return:
Codex reports, the user pastes, and Augnes previews the candidate result
without treating it as proof, evidence, state, approval, or closure authority.

### Step 7: Augnes preview review expectation

Augnes preview review should show a conservative result-review interpretation.
The expected review is preview-only: it can help the user inspect the returned
Codex report, but it must not mutate work status, create or change events,
write proof/evidence rows, commit/reject state, publish externally, or dispatch
new automation.

The user can understand that review is preview-only when the UI and report both
keep the manual paste path and authority boundary visible.

## User-Facing Questions Answered

- Can the user tell which research work item to pick? Yes for the deterministic
  repo-backed path: `AG-DOGFOOD-RESEARCH-001` is named by the seed, scenario
  pack, bootstrap doc, and actual `codex:next-work` output. Live Work Picker
  visibility was not observed.
- Can the user tell what the next action is? Mostly yes: use Core Handoff when
  available, otherwise use `npm run codex:next-work`, then return a field-first
  result report.
- Can the user tell whether Codex should use Core Handoff or `codex:next-work`?
  Yes in the docs path: Core Handoff is primary when available; bootstrap is
  fallback when runtime or pasted handoff is unavailable.
- Can the user tell where Codex result output should be pasted? Yes:
  `codexResultText` or `codexResultPaste`.
- Can the user understand that the review is preview-only? Yes in the docs and
  report contract; live UI confirmation remains skipped.
- Can the user tell what is not implemented yet? Yes: ingestion, fetching,
  providers, embeddings, persistence, proof/evidence writes, work mutation, and
  automation are all explicitly out of scope.

## User Friction Assessment

The deterministic path is understandable once the user already knows the work
ID or reads the bootstrap output. The remaining user friction is first-screen
discoverability: without a live Work Picker observation, this PR cannot prove
that a non-technical operator would immediately see why
`AG-DOGFOOD-RESEARCH-001` is the research item to select.

The Core Handoff versus bootstrap choice is clear in text, but it still depends
on the user recognizing whether they have a live card or only repo access.

## Codex Worker Friction Assessment

Codex worker friction is low for deterministic discovery. The command
`npm run codex:next-work -- --scope project:augnes --work-id
AG-DOGFOOD-RESEARCH-001` gives the work ID, scope, title, expected files,
expected checks, stop conditions, authority boundary summary, result report
template, and manual return path.

The confusing point is that the seeded work item still points at the scenario
pack slice from PR #616. This observation PR is supplied by the human prompt,
not selected as a new seeded work item by the bootstrap helper.

## Result Return Friction Assessment

The result return path is clear: Codex should use
`docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`, then the user pastes the
field-first report into `codexResultText` or `codexResultPaste`.

The friction is that the paste destination is described in docs and bootstrap
output, but this PR does not verify a live result paste surface. A live preview
pass would need to confirm the visible label, empty state, pasted state, and
conservative review language.

## What Became Clear

- `AG-DOGFOOD-RESEARCH-001` is discoverable from deterministic repo-backed
  sources.
- `docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md` gives Codex an honest fallback
  when no live Work Brief is configured.
- `npm run codex:next-work` reports runtime fallback status explicitly.
- `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md` is the right return shape
  for manual preview review.
- `codexResultText` and `codexResultPaste` are the named result-return targets.
- Preview review must remain separate from proof/evidence, state, events, work
  closure, and publish controls.

## What Remains Confusing

- The actual live Work Picker / Work Brief first screen was not observed.
- It is not yet proven that the live Work Contract Card labels make
  `AG-DOGFOOD-RESEARCH-001` obvious to a user who has not read the docs.
- It is not yet proven that the live UI makes the Core Handoff versus
  `codex:next-work` choice obvious.
- It is not yet proven that the live paste surface makes preview-only review
  unmistakable before and after a Codex report is pasted.
- The bootstrap helper identifies the existing seeded research work item; it
  does not independently select this observation PR as product work.

## Candidate Next PR Selection

Selected next PR candidate: live Work Picker / Work Brief observation for
`AG-DOGFOOD-RESEARCH-001` with a local temp runtime and no product-surface
expansion.

## Why Selected

The biggest remaining uncertainty is user-facing, not architectural. The
deterministic path answers the repo-backed happy path, but the live first screen
still needs a separate observation to confirm that a user can select the
research item, open the Work Brief / Work Contract Card, choose Core Handoff or
bootstrap appropriately, and recognize the manual preview result-return path.

## Why Other Candidates Are Deferred

- Paper ingestion is deferred because this PR only observes the work loop and
  has no authority to implement research ingestion.
- Paper fetching is deferred because the scenario remains manual and
  preview-only.
- Provider/OpenAI calls are deferred because no provider-backed research
  behavior is authorized.
- Embeddings/RAG/vector search are deferred because no search or retrieval
  implementation is authorized.
- DB migration and durable research state are deferred because this observation
  must not persist research data.
- Proof/evidence writes, event mutation, work close/status mutation, and state
  commit/reject are deferred because result review remains preview-only.
- App/MCP tools and `work_loop_readonly` widening are deferred because this PR
  must not change the Developer Mode tool surface.
- Automatic Codex execution and automatic GitHub fetch/review/merge/publish
  controls are deferred because the loop remains manual and operator-led.

## Authority Boundaries

This PR documents a preview-only user happy path observation for the Research
Accumulation work loop. It adds no paper ingestion, no paper fetching, no
provider/OpenAI calls, no embeddings/RAG/vector search, no DB migration, no
durable research state write, no proof/evidence write, no work close/status
mutation, no event creation/mutation, no state commit/reject, no automatic
Codex execution, no automatic GitHub fetch, no PR review submission, no
merge/publish/retry/replay/deploy controls, no App/MCP tools, and no widening
of the `work_loop_readonly` Developer Mode tool surface.

Additional explicit boundaries:

- no paper ingestion
- no paper fetching
- no provider/OpenAI calls
- no embeddings/RAG/vector search
- no DB migration
- no durable research state write
- no proof/evidence write
- no work close/status mutation
- no event creation/mutation
- no state commit/reject
- no automatic Codex execution
- no automatic GitHub fetch/review/merge/publish
- no App/MCP tools
- no work_loop_readonly widening

## Skipped Checks And Concrete Reasons

- Live Work Picker / Work Brief: skipped because no `AUGNES_API_BASE_URL` was
  configured, no local runtime was started for this docs/smoke observation, and
  the bootstrap helper reported `runtime_not_configured`.
- Live Work Contract Card: skipped because this PR did not start an Augnes
  runtime or open MCP Inspector / ChatGPT Developer Mode.
- Live Core Handoff copy: skipped because no live Work Contract Card was opened.
- Live result paste through `codexResultText` / `codexResultPaste`: skipped
  because this PR documents the happy path and does not run the live App UI.
- Paper ingestion and paper fetching: skipped because the research product
  surface is not implemented or authorized in this PR.
- Provider/OpenAI calls: skipped because no provider access is needed for this
  observation and the authority boundary forbids it.
- Persistence, proof/evidence, event, work status, and state mutation checks:
  skipped because this PR intentionally adds no runtime writes or durable
  research state.

## Remaining Caveats

- This is a deterministic repo-backed observation, not a live UI observation.
- The live Work Picker / Work Brief path may still expose copy or layout
  friction that repo-backed docs cannot detect.
- The live paste surface and preview review state were not observed in this PR.
- The bootstrap helper can identify `AG-DOGFOOD-RESEARCH-001`, but it does not
  replace a live Work Brief when runtime access is available.

## Next Recommended Step

Run a separate live Work Picker / Work Brief observation for
`AG-DOGFOOD-RESEARCH-001` with a local temp runtime, still preview-only, and
record whether the visible UI makes the research work selection, Core Handoff
choice, result paste target, and non-implemented boundaries clear.
