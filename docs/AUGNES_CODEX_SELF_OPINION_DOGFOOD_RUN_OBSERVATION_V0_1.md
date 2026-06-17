# Augnes Codex Self-opinion Dogfood Run Observation v0.1

## Date

2026-06-17

## Baseline Commit

`f43c273`

This baseline is `main` after merged PR #606.

## Source Scenario

`docs/AUGNES_CODEX_SELF_OPINION_DOGFOOD_SCENARIO_V0_1.md`

## Source Inputs

- `docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md`
- `docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_OBSERVATION_V0_1.md`
- `apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md`
- `docs/AUGNES_CODEX_RESULT_PASTE_NORMALIZER_PREVIEW.md`

## Run Mode

Run mode: deterministic sample-run observation.

Actual separate Codex session: not run. No separate user-started Codex
self-opinion output was available in this task context.

The observation below is based only on the sample self-opinion report in
`docs/AUGNES_CODEX_SELF_OPINION_DOGFOOD_SCENARIO_V0_1.md`. It is a static
operator review of that sample report, not live Codex feedback.

## Explicit Statement Of What Was Not Run

- No live Codex self-opinion session was run.
- No live Codex runner was added or invoked.
- No App/MCP tool was added.
- No App/MCP tool executed Codex.
- No live MCP Inspector session was started.
- No ChatGPT Developer Mode session was started.
- No provider/OpenAI call was made.
- No automatic GitHub fetch was performed.
- No proof/evidence rows were written.
- No Augnes state was mutated.
- No GitHub review or comment was submitted.
- No Research / Paper / Knowledge Accumulation surface was implemented.

## Self-opinion Report Used

The following report is copied from the source scenario sample. It is sample
text only and is not live Codex output.

```text
worker_perspective_summary:
The loop gave enough context to understand the operator-led research
accumulation docs/smoke task, and the observation artifact made it clear that
the sample paste should remain conservative. The strongest part was the
explicit expected files/checks plus authority boundary text. The weakest part
was that the worker has to infer which pieces are scenario-contract work versus
future research-product work.

handoff_clarity_rating:
4/5 - the work ID, expected files, expected checks, and no-automation boundaries
were clear, but the Core Handoff would benefit from a shorter "do this now" block.

result_return_friction_rating:
3/5 - codexResultText / codexResultPaste is easy to understand, but the report
template should name the combined skipped-check/caveat behavior directly.

useful_criticisms:
- Criticism: The handoff still mixes scenario-contract tasks with future product direction, which can tempt a worker to start designing ingestion.
- Criticism: The sample report exercises the parser well, but it does not show a compact field-first report format that Codex could reliably follow every time.
- Criticism: The observation artifact records local registered-tool behavior, but a worker may miss that no live Developer Mode host behavior was observed.

over_automation_risks:
- Adding a live Codex runner before the operator has reviewed self-opinion output.
- Treating self-opinion recommendations as close-ready work status.
- Automatically converting suggested PR candidates into issues, branches, PRs, reviews, or proof/evidence records.

non_automation_boundaries_to_preserve:
- Boundary: Keep Codex execution outside App/MCP until a user explicitly starts a separate Codex session.
- Boundary: Keep self-opinion reports out of proof/evidence and committed state unless a later human-approved write path exists.
- Boundary: Keep GitHub review submission, merge, publish, retry, replay, and deploy controls manual and user/Core gated.

handoff_packet_improvements:
- Add a compact "current task only" subsection above broader context.
- Put expected files/checks directly beside skipped-check policy.
- Include a one-line reminder that future product direction is not implementation authority.

result_report_template_improvements:
- Add explicit headings for `skipped_checks`, `remaining_caveats`, and `ambiguous_combined_section_lines`.
- Ask Codex to report "No proof/evidence rows written" as a standalone line when true.
- Include a field for "live host observation: run/skipped with reason".

research_accumulation_surface_recommendations:
- Prioritize a read-only scenario pack for research questions, paper refs, extracted claims, and unresolved gaps.
- Keep ingestion/manual citation capture separate from operator planning until source authority rules are clearer.
- Start with inspection and review packets before any durable research knowledge state.

concrete_next_pr_candidates:
- PR candidate: Add a compact Core Handoff "current task only" subsection for dogfood work items.
- PR candidate: Add a reusable Codex result report template that names skipped_checks, remaining_caveats, and ambiguous_combined_section_lines.
- PR candidate: Add a preview-only Research Accumulation Scenario Pack doc and smoke without ingestion or provider calls.

authority_boundary_statement:
This self-opinion is advisory only. It is not proof/evidence, not a state
commit, not work closure, not a GitHub review, not merge approval, and not
product truth. It adds no automatic Codex execution, no automatic GitHub fetch,
no proof/evidence write, no work close/status mutation, no event
creation/mutation, no state commit/reject, no shell execution from App/MCP, no
provider/OpenAI calls, no branch/PR creation from App/MCP code, no PR review
submission, no merge/publish/retry/replay/deploy controls, no DB migration, no
new user-facing App/MCP tools, and no widening of the work_loop_readonly
Developer Mode tool surface.
```

## Extracted Findings

### Handoff Clarity

Handoff clarity rating: `4/5`.

The sample says the work ID, expected files, expected checks, and
no-automation boundaries were clear. The main clarity gap is that the worker
still has to separate current scenario-contract work from future research
product direction.

### Result Return Friction

Result return friction rating: `3/5`.

The sample says `codexResultText` / `codexResultPaste` is understandable as a
manual return/review path, but a reusable result report template should name
`skipped_checks`, `remaining_caveats`, and
`ambiguous_combined_section_lines` directly.

### Useful Criticisms

- Criticism: The handoff mixes scenario-contract tasks with future product
  direction, which can tempt a worker to start designing ingestion.
- Criticism: The sample exercises parser behavior, but it does not provide a
  compact field-first report format that Codex can follow repeatedly.
- Criticism: The observation artifact records local registered-tool behavior,
  but a worker may miss that no live Developer Mode host behavior was observed.

### Over-automation Risks

- Risk: Adding a live Codex runner before a human has reviewed self-opinion
  output.
- Risk: Treating self-opinion recommendations as close-ready work status.
- Risk: Automatically converting suggested PR candidates into issues,
  branches, PRs, reviews, or proof/evidence records.

### Non-automation Boundaries To Preserve

- Boundary: Keep Codex execution outside App/MCP until a user explicitly starts
  a separate Codex session.
- Boundary: Keep self-opinion reports out of proof/evidence and committed state
  unless a later human-approved write path exists.
- Boundary: Keep GitHub review submission, merge, publish, retry, replay, and
  deploy controls manual and user/Core gated.

### Handoff Packet Improvements

- Add a compact `current task only` subsection above broader context.
- Put expected files and expected checks directly beside skipped-check policy.
- Include a one-line reminder that future product direction is not
  implementation authority.

### Result Report Template Improvements

- Add explicit headings for `skipped_checks`, `remaining_caveats`, and
  `ambiguous_combined_section_lines`.
- Ask Codex to report `No proof/evidence rows written` as a standalone line
  when true.
- Include a field for `live host observation: run/skipped with reason`.

### Research Accumulation Surface Recommendations

- Prioritize a read-only scenario pack for research questions, paper refs,
  extracted claims, and unresolved gaps.
- Keep ingestion and manual citation capture separate from operator planning
  until source authority rules are clearer.
- Start with inspection and review packets before any durable research
  knowledge state.

### Concrete Next PR Candidates

- PR candidate: Add a compact Core Handoff `current task only` subsection for
  dogfood work items.
- PR candidate: Add a reusable Codex result report template that names
  `skipped_checks`, `remaining_caveats`, and
  `ambiguous_combined_section_lines`.
- PR candidate: Add a preview-only Research Accumulation Scenario Pack doc and
  smoke without ingestion or provider calls.

## Advisory-only Interpretation

The self-opinion is advisory review input only.

- It is not proof/evidence.
- It is not product truth.
- It is not a state commit.
- It is not work closure.
- It is not a GitHub review.
- It is not merge approval.
- It is not durable state.

The report may help a human decide what to inspect or implement next. It does
not approve a PR, close a work item, create a branch, publish a result, or
authorize product behavior.

## Candidate Next PR Selection

Selected next PR candidate: Add a reusable Codex result report template that
names `skipped_checks`, `remaining_caveats`, and
`ambiguous_combined_section_lines`.

## Why That Next PR Is Selected

This is the narrowest implementation-adjacent follow-up from the sample
self-opinion. It directly reduces result-return ambiguity in the existing
manual `codexResultText` / `codexResultPaste` path and strengthens the parser
contract introduced by PR #602 and PR #603 without adding runtime authority.

It also gives future dogfood runs a consistent closeout shape before any
larger research accumulation surface exists.

## Why Other Candidates Are Deferred

- Deferred candidate: Add a compact Core Handoff `current task only`
  subsection. This is useful, but it touches handoff packet composition and
  should follow after the result report return shape is made easier to reuse.
- Deferred candidate: Add a preview-only Research Accumulation Scenario Pack
  doc and smoke. This is product-direction work and should wait until the
  reporting template is stable enough for repeated dogfood observations.

## Authority Boundaries

- no automatic Codex execution
- no automatic GitHub fetch
- no proof/evidence write
- no work close/status mutation
- no event creation/mutation
- no state commit/reject
- no shell execution from App/MCP
- no provider/OpenAI calls
- no branch/PR creation from App/MCP code
- no PR review submission
- no merge/publish/retry/replay/deploy controls
- no DB migration
- no new user-facing App/MCP tools
- no widening of the work_loop_readonly Developer Mode tool surface

## Skipped Checks And Concrete Reasons

- Live Codex self-opinion session: skipped because no separate user-started
  Codex session output was available in this task context.
- Live Codex runner: skipped because this PR must not add automatic Codex
  execution or a live runner.
- Live MCP Inspector / ChatGPT Developer Mode observation: skipped because no
  live connector, tunnel, Inspector, or ChatGPT Developer Mode host session was
  started.
- Runtime Work Contract Card observation: skipped because this observation is
  deterministic docs/smoke only.
- Provider/OpenAI calls: skipped because this PR must not call providers.
- GitHub review/comment submission: skipped because this PR must not submit
  GitHub reviews or comments.
- Proof/evidence rows: none were written because this PR has no write path.
- Augnes state mutation: none was performed because this PR is documentation
  and deterministic smoke coverage only.

## Remaining Caveats

- The observation is based on sample text, not live Codex worker feedback.
- The selected next PR candidate is advisory and not automatically scheduled.
- The Research / Paper / Knowledge Accumulation surface is still not
  implemented.
- Manual `codexResultText` / `codexResultPaste` review remains the return path
  for future self-opinion payloads unless a later PR adds a reviewed path.

## Next Recommended Step

In a later PR, add a reusable Codex result report template that explicitly
names `skipped_checks`, `remaining_caveats`, and
`ambiguous_combined_section_lines`, while preserving the same preview-only
authority boundaries and avoiding automatic Codex execution.
