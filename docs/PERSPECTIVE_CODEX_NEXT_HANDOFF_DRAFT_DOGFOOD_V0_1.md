# Perspective Codex Next-Handoff Draft Dogfood v0.1

## Purpose and Status

This is the local dogfood report after PR #468. PR #468 added
`buildCodexNextHandoffDraftPacketFromUserJudgment(input)` so a manual
ChatGPT user judgment packet can become a non-executing Codex next-handoff
draft packet.

This slice exercises the full pure local manual loop:

- Formation Input Bundle;
- Perspective Candidate;
- ChatGPT Perspective Candidate briefing preview;
- manual ChatGPT user judgment capture packet;
- Codex next-handoff draft packet.

The dogfood script produces deterministic dogfood output, not runtime
behavior. It evaluates whether the copyable handoff text is human-usable for
deciding a future user-started Codex task.

## Boundaries

This dogfood slice does not execute Codex and does not mutate GitHub.

It does not implement routes, does not implement UI, does not implement DB,
does not implement persistence, does not implement OAuth, does not implement
provider calls, does not implement ChatGPT Apps, does not implement Codex
plugin integration, does not implement Codex SDK execution, does not implement
proof/evidence/readiness writes, and does not implement Core-gated
accept/reject/supersede.

The dogfood artifact is not committed state, proof, evidence, readiness,
approval, merge authority, GitHub mutation, Core decision, ChatGPT Apps
integration, or Codex execution.

## Dogfood Coverage

The dogfood script builds:

- a fully scoped `ready_to_copy` sample;
- a `needs_scope` contrast with missing expected files and checks;
- a `needs_revision_first` contrast where user revision must win before
  handoff drafting;
- a `blocked` contrast with a blocking tension;
- a `none` contrast where user/PM clarification is needed.

The dogfood keeps ready_to_copy separate from execution. `ready_to_copy`
means copyable draft material only, not authority to run Codex.

The dogfood keeps contrast cases visible so non-ready states cannot look like
a copy-ready handoff.

## Evaluation

The dogfood evaluation passes only when:

- `ready_to_copy` appears only for the fully scoped, `matches_direction`,
  `captured_for_review`, `prepare_codex_handoff` path;
- the ready draft includes task goal, expected files, required checks,
  forbidden files and surfaces, skipped-check policy, and PR-centered
  workflow;
- the copyable text says draft only and does not execute Codex;
- the copyable text says the user must explicitly start a Codex task;
- contrast cases do not look copy-ready;
- no raw/private/provider/token markers appear;
- no wording implies approval, merge, GitHub mutation, Core decision, or Codex
  execution.

## Follow-Up Corrections

PR #469 dogfood found that the copyable text was safe, but its first visible
line needed more direct human-facing wording. This follow-up updates the
copyable handoff text so it begins as a draft prompt for a future
user-started Codex task and tells the user to review it before pasting into
Codex.

Automated review also found an under-scoped expected_files issue in the PR
#469 `ready_to_copy` dogfood output. Because that list is the future Codex
task's file scope, this follow-up expands it to include the related packet
docs, formation/user-judgment docs, and neighboring smoke allowlist files
needed by an equivalent dogfood/report/copy refinement slice.

## Dogfood Output

The deterministic dogfood artifact is written to:

`reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md`

The dogfood script writes that artifact only. It does not call runtime APIs or
external services.

## Follow-Up Evaluation

The next real docs-only Codex task evaluates the refined draft as source
context for a docs/report/smoke/package-only PR. That follow-up checks whether
the draft prompt opening, review-before-pasting instruction, expected files,
required checks, forbidden files, forbidden surfaces, and PR-centered workflow
are usable in an actual user-started Codex task.

## Expected-File Readability Follow-Up

The next pure local refinement improved expected-file readability by grouping
the copyable draft's expected files while preserving the complete flat
`expected_files` scope.

The dogfood now verifies that expected files remain fully scoped, expected
files are grouped for readability, the full list remains the scope, guardrail
and neighboring smoke allowlist files remain visible, and no expected files
are omitted.

## Manual Usage Note

`docs/PERSPECTIVE_CODEX_HANDOFF_DRAFT_MANUAL_USAGE_NOTE_V0_1.md` turns the
dogfood and expected-file readability findings into a practical human review
path. It explains when to paste only a `ready_to_copy` draft, how to read
`expected_file_scope`, and why grouped display does not reduce scope.

## Future Next Step

Add copy-ready checklist to Codex handoff draft text.
