# Perspective Codex Next-Handoff Draft Packet v0.1

## Purpose and Status

This is the pure local Codex next-handoff draft packet after PR #467. PR #467
added `buildManualChatGptUserJudgmentCapturePacket(input)` so a manual ChatGPT
reply can become non-committed user judgment review material. This slice adds
`buildCodexNextHandoffDraftPacketFromUserJudgment(input)` so that user
judgment packet plus caller-supplied bounded handoff context can become a
non-executing Codex handoff draft.

The builder is deterministic and pure local. It accepts a
`perspective_user_judgment_capture_packet.v0.1` packet and caller-supplied
bounded handoff context. It does not read files or environment variables, does
not call network APIs, does not create timestamps unless `generated_at` is
supplied by the caller, and does not import runtime route, DB, or persistence
helpers.

This slice does not implement Codex execution. It does not implement ChatGPT
Apps integration. It also does not implement a route, UI, DB, persistence,
OAuth, provider calls, Codex plugin, Codex SDK, proof/evidence/readiness
writes, GitHub mutation, Core-gated accept/reject/supersede,
merge/publish/approval, or source ingress.

## Input

The builder accepts:

- `user_judgment_packet`: a manual ChatGPT user judgment capture packet from PR
  #467;
- `handoff_context`: caller-supplied bounded handoff context.

Allowed handoff context is limited to explicit, safe, reviewable summaries and
refs:

- optional caller-supplied `draft_id`;
- task goal;
- target repo;
- base branch;
- working branch suggestion;
- expected files;
- forbidden files;
- forbidden surfaces;
- required checks;
- skipped-check policy;
- implementation notes;
- review notes;
- user constraints;
- optional caller-supplied `generated_at`.

The builder never invents expected files or checks. Missing task goal, expected
files, and required checks remain visible scope gaps.

The source user judgment remains manual review material, not durable state.
The packet supports next handoff drafting discussion but does not execute
Codex.

## Output

The output is a `perspective_codex_next_handoff_draft_packet.v0.1` object with:

- `draft_kind: codex_next_handoff_draft`;
- deterministic `draft_id`;
- `draft_status`;
- source user judgment packet id, candidate id, direction alignment, decision
  effect, next handoff discussion status, and preferred next action;
- bounded Codex task fields from the caller-supplied handoff context;
- `expected_file_scope`, a deterministic grouped display representation of the
  canonical expected files;
- readiness status and reasons;
- visible gaps;
- selected and blocking unresolved tension refs;
- user/Core decision questions;
- forbidden actions;
- copyable Codex handoff text;
- raw payload exclusion and explicit false authority flags.

The packet is not committed state, not proof, not evidence, not readiness, not
approval, and not merge authority. It is also not GitHub mutation, Core
decision, ChatGPT Apps integration, or Codex execution.

## Readiness

The packet distinguishes:

- `ready_to_copy`: source user judgment is `ready_to_draft_handoff`, decision
  effect is `captured_for_review`, direction alignment is `matches_direction`,
  preferred next action is `prepare_codex_handoff`, task goal has text,
  expected files have at least one item, required checks have at least one
  item, and no blocking tension refs are present;
- `needs_scope`: source user judgment is ready to draft, but task goal,
  expected files, or required checks are missing;
- `needs_revision_first`: user judgment says revision is needed or input gaps
  should be fixed first;
- `blocked`: user judgment is blocked, handoff discussion is blocked, or
  blocking tension refs are present;
- `none`: user judgment is unclear, asks user/PM, chooses no next action, or
  otherwise does not request handoff drafting.

`ready_to_copy` is still copyable draft readiness only. It is not approval,
execution, proof, evidence, durable readiness, merge authority, or a Core
decision.

The builder requires explicit task goal, expected files, and required checks
before it can return `ready_to_copy`.

## Expected File Scope Display

`codex_task.expected_files` remains the complete canonical flat scope list.
The builder also derives `expected_file_scope` from that list so humans can
scan the copyable draft more quickly without losing coverage.

`expected_file_scope` includes:

- `total_count`;
- grouped display sections with `group_id`, title, and files;
- `ungrouped_files` for files that land in the `Other files` group;
- coverage markers for all expected files listed, duplicates removed from the
  input list, and omitted files.

The grouping is deterministic and path-based. It groups package metadata,
primary builder or dogfood script files, docs/reports, dogfood/report
artifacts, smoke/validation and neighboring allowlist files, and other files
when present.

Expected files are grouped for readability; the full list remains the scope.
Grouping does not remove expected files, hide guardrail files, or reduce the
task boundary.

## Copyable Codex Handoff Text

The copyable Codex handoff text is deterministic markdown/plain text. It
includes draft id, source judgment packet id, source candidate id, task goal,
expected files, forbidden files and surfaces, required checks, skipped-check
policy, constraints, implementation notes, review notes, authority boundary,
and PR-centered workflow.

The expected files section includes expected file count, primary file count,
guardrail/neighboring smoke file count, grouped sections, and coverage markers
showing that the full list remains the scope and no expected files were
omitted.

The text begins by saying it is a draft prompt for a future user-started
Codex task and that the user should review it before pasting into Codex. It
explicitly says it does not execute Codex and does not authorize merge,
approval, GitHub mutation, or background work. It also says Codex may code,
test, and open a PR only when the user explicitly starts a Codex task with
this draft. ChatGPT reviews and the user decides merge.

The text does not include raw pasted text, raw source payloads, raw candidate
payloads, private/provider/token/OAuth/API key/billing payloads, hidden
reasoning, raw generated model payloads, or secrets.

It does not claim approval. It does not execute or instruct background work.

## Dogfooded By

`docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md` and
`reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md`
dogfood the full pure local manual loop and evaluate whether this packet's
copyable text is usable as non-executing draft material.

## Authority Boundary

The draft packet has explicit false authority flags for:

- committed state;
- persistence;
- provider/model/API calls;
- proof/evidence/readiness writes;
- Codex execution;
- GitHub mutation;
- merge/publish/approval;
- ChatGPT Apps integration;
- Core decision.

This slice does not change Event Rail, graph topology, node ids/types, edge
ids/types, packet section order, Agent Brief read route behavior, local manual
preview route behavior, Perspective runtime route behavior, product UI,
components, CSS, browser-facing behavior, DB schema, migrations, source
ingress, OAuth, provider/model/API services, Codex plugin integration, Codex
SDK execution, GitHub mutation, or actual Codex execution.

## Future Next Step

Prepare manual usage note for Codex handoff drafts.
