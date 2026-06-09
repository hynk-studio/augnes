# Perspective Codex Handoff Expected-File Scope Readability v0.1

## Purpose and Status

This follows PR #471. PR #471 found that the refined Codex next-handoff draft
was usable for real docs-only Codex tasks, but expected-file scope could become
hard to scan even when it was safer and appropriately scoped.

This PR improves expected-file scope readability by grouping expected files in
the copyable draft text while preserving the complete flat `expected_files`
scope.

Status: pure local builder/copy/docs/report/smoke refinement. This is not
runtime behavior and does not execute Codex.

## Readability Problem

The PR #470 expanded expected files so a future Codex task would not be
under-scoped. PR #471 confirmed that was safer, but the flat list made it too
easy for a human to miss which files were primary task files and which files
were guardrail or neighboring smoke allowlist files.

The problem was scanability, not scope coverage.

## Grouped Display Behavior

The builder preserves `codex_task.expected_files` as the complete canonical
flat list. The grouped display is derived deterministically from that list and
is display material only.

The copyable draft now shows expected-file scope with:

- expected file count;
- primary file count;
- guardrail/neighboring smoke file count;
- grouped sections for primary files, docs/reports, dogfood/report artifacts,
  smoke/validation files, package metadata, and other files when present;
- coverage markers showing that all expected files are listed and no expected
  files were omitted.

Expected files are grouped for readability; the full list remains the scope.

## Consumed By / Used By

`docs/PERSPECTIVE_CODEX_HANDOFF_DRAFT_MANUAL_USAGE_NOTE_V0_1.md` explains how
a human should use this grouped display when reviewing a Codex next-handoff
draft before pasting it into Codex.

The manual usage note consumes `expected_file_scope` as display material only.
Grouping improves readability, but `codex_task.expected_files` remains the
complete canonical scope.

## Scope Safety

Grouping does not reduce scope. It does not hide guardrail files, neighboring
smoke allowlist files, package metadata, dogfood artifacts, docs, reports,
builder files, or validation files.

There is no scope reduction: grouping only changes how the complete list is
displayed for review.

Every file in the canonical expected-files list must appear in exactly one
display group. The builder does not invent files, and it does not classify
forbidden files as expected files.

## Authority Boundary

`ready_to_copy` remains draft-only. It is not approval, proof, evidence,
readiness, committed state, merge authority, Core decision, GitHub mutation,
or a Codex execution command.

The copyable text remains a draft prompt for a future user-started Codex task.
The human still reviews it before pasting into Codex. It does not execute
Codex, grants no merge, grants no approval, grants no GitHub mutation, and
does not start background work.

The PR-centered workflow remains: Codex codes/tests/opens PR, ChatGPT reviews,
and the user decides merge.

## Non-Goals

This refinement does not implement:

- runtime routes;
- app/API behavior;
- product UI, components, CSS, or browser-facing behavior;
- DB schema, migrations, persistence, graph DB behavior, or source ingress;
- OAuth or provider/model/API calls;
- proof/evidence/readiness writes;
- ChatGPT Apps, Codex plugin, or Codex SDK execution;
- merge, approval, deploy, publish, retry, replay, or external posting;
- Event Rail, graph topology, node id/type, edge id/type, packet section
  order, Agent Brief read route behavior, local manual preview route behavior,
  or Perspective runtime route behavior changes.

This refinement also excludes raw pasted text, raw source payloads, raw
candidate payloads, private/provider/token/OAuth/API key/billing payloads,
hidden reasoning, raw generated model payloads, and sensitive credentials.

## Future Next Step

Add copy-ready checklist to Codex handoff draft text.
