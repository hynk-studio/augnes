# Augnes ChatGPT-Augnes-Codex Flow Dogfood Observation v0.1

## Date

2026-06-17

## Baseline Commit

`80ce120` on `main` after merged PR #604.

## Scenario ID

`CHATGPT_AUGNES_CODEX_RESEARCH_DOGFOOD_V0_1`

## Work Item ID

`AG-DOGFOOD-RESEARCH-001`

## Runtime / Bridge / Host Path Used

This first observation pass used deterministic local checks only:

- `docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md`
- seeded work item source in `scripts/demo-seed.mjs`
- local registered-tool handler probe for the `work_loop_readonly` surface
- sample `codexResultText` from the scenario doc

A temp seeded DB at `/tmp/augnes-dogfood-observation.db` was created with
`npm run db:reset` and `npm run demo:seed` to confirm seed setup worked without
touching the default DB. No long-running local runtime was left running.

Live MCP Inspector / ChatGPT Developer Mode was skipped because no live
connector, tunnel, or host session was started for this PR run. No live host,
iframe, clipboard, MCP Inspector, or ChatGPT Developer Mode observation is
claimed.

## Work Picker Result

Observed through the deterministic local registered-tool handler probe:

- `AG-DOGFOOD-RESEARCH-001` was visible in `augnes_list_work_items` output.
- `AG-006` remained `recommended_work_id`.
- `AG-DOGFOOD-RESEARCH-001` was not marked recommended.
- `AG-DOGFOOD-RESEARCH-001` showed `expected_files_count: 4`.
- `AG-DOGFOOD-RESEARCH-001` showed `expected_checks_count: 2`.
- `AG-DOGFOOD-RESEARCH-001` showed `linked_docs_count: 1`.

This preserves the PR #604 intent: the dogfood scenario is selectable, but it
does not unexpectedly replace the existing AG-006 first recommended active
work item.

## Work Brief / Work Contract Result

Observed for `augnes_get_work_brief` with `scope: project:augnes` and
`workId: AG-DOGFOOD-RESEARCH-001` through the deterministic local
registered-tool handler probe:

- Expected files were visible:
  - `docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md`
  - `scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs`
  - `package.json`
  - `apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md`
- Expected checks were visible:
  - `node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs`
  - `git diff --check`
- Linked docs included:
  - `docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md`
- Core Handoff was available with `core_handoff_usage:
  implementation_ready`.
- Authority boundary text remained present on the Work Contract / handoff
  surfaces.
- Before any paste input, result review was waiting for input:
  `needs_result_input`.
- The paste normalizer path was exercised through top-level `codexResultText`
  sample input.

No `npm run codex:read-brief` output is claimed for this observation.

## Paste Normalizer Observation

The sample Codex final report from
`docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md` was passed as
`codexResultText` in the deterministic local registered-tool handler probe.

Detected fields:

- `work_id`: `AG-DOGFOOD-RESEARCH-001`
- `scope`: `project:augnes`
- `result_status`: `completed`
- `changed_files`:
  - `docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md`
  - `scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs`
  - `package.json`
  - `apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md`
- `verification_results`:
  - `node scripts/smoke-research-accumulation-scenario-pack-v0-1.mjs passed`
  - `git diff --check passed`
- `authority_boundary_statement`: extracted from the sample report and kept to
  the preview-only no-write/no-execution boundary text.

Combined skipped-check/caveat section result:

- `skipped_checks`:
  - `Live ChatGPT Developer Mode Work Contract Card observation skipped because no tunnel/session was available`
- `remaining_caveats`:
  - `Parser output remains a candidate only and needs human review`
- `ambiguous_combined_section_lines`:
  - `Operator follow-up noted in transcript`

The normalizer status was `ambiguous`, as expected for the intentionally
ambiguous combined-section line. No combined-section line was duplicated into
both `skipped_checks` and `remaining_caveats`.

The normalizer did not invent verification, proof/evidence rows, event IDs, PR
URLs, close status, state decisions, or host observations.

## Result Review / Closure Behavior

Observed result review values after the sample paste:

- reported result status: `completed`
- suggested result status: `partial`
- review recommendation: `needs_revision`
- suggested next action: `follow_up_fix_needed`
- closure recommendation: `follow_up_fix_needed`

Closure stayed conservative because:

- the paste normalizer status was `ambiguous`;
- one combined skipped-check/caveat line required human classification;
- the review-derived suggested result status was `partial`, not `completed`;
- the review-derived suggested next action was `follow_up_fix_needed`;
- the local registered-tool fixture had an empty event timeline for this
  dogfood observation.

The operator should not treat this sample paste as close-ready until the
ambiguous combined-section line is classified by a human and any missing live
host observation is either completed or explicitly accepted as skipped.

## Authority Boundaries

This observation is preview-only and dogfood-oriented. It adds no automatic
GitHub fetch, no proof/evidence write, no work close/status mutation, no event
creation/mutation, no state commit/reject, no Codex execution from App/MCP, no
shell execution from App/MCP, no provider/OpenAI calls, no branch/PR creation
from App/MCP code, no PR review submission, no merge/publish/retry/replay/deploy
controls, no DB migration, no new user-facing App/MCP tools, and no widening of
the `work_loop_readonly` Developer Mode tool surface.

- no automatic GitHub fetch
- no proof/evidence write
- no work close/status mutation
- no event creation/mutation
- no state commit/reject
- no Codex execution from App/MCP
- no shell execution from App/MCP
- no provider/OpenAI calls
- no branch/PR creation from App/MCP code
- no PR review submission
- no merge/publish/retry/replay/deploy controls
- no DB migration
- no new user-facing App/MCP tools
- no widening of the `work_loop_readonly` Developer Mode tool surface

No proof/evidence rows were written.
No event rows were created or mutated.
No work status was closed or updated.
No state was committed or rejected.

## Skipped Checks And Concrete Reasons

- Live MCP Inspector observation: skipped because no live connector/tunnel or
  Inspector session was started for this PR run.
- Live ChatGPT Developer Mode observation: skipped because no live connector,
  tunnel, or host session was started for this PR run.
- Live Work Contract Card iframe/widget/clipboard observation: skipped because
  no live Developer Mode host rendered the card in this PR run.
- `npm run codex:read-brief`: not run; no runtime brief command output is
  claimed.
- Proof/evidence write verification: not applicable to this preview-only
  observation; no proof/evidence rows were written.

## Remaining Caveats

- The observation is deterministic and local; it is not a live MCP Inspector or
  ChatGPT Developer Mode host observation.
- The sample report intentionally contains an ambiguous combined-section line,
  so result closure should remain conservative.
- The future Research / Paper / Knowledge Accumulation surface is still not
  implemented.
- The Codex self-opinion scenario is not implemented in this PR.

## Next Recommended Step

Run a live MCP Inspector or ChatGPT Developer Mode pass for
`AG-DOGFOOD-RESEARCH-001` when a connector/tunnel/session is available, then
paste the same sample final report through `codexResultText` or
`codexResultPaste` and compare the visible Work Contract Card, paste
normalizer, result review, event spine, and closure recommendation against this
deterministic observation.

After this operator-led observation artifact exists, the next separate PR can
add the Codex self-opinion scenario.
