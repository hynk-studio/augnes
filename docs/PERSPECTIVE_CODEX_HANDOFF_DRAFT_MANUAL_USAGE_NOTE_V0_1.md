# Perspective Codex Handoff Draft Manual Usage Note v0.1

## Purpose

This manual usage note explains how to review and use a Codex next-handoff
draft by hand. It is for future explicitly user-started Codex tasks.

This note is not automation. It does not execute Codex, does not authorize a
merge, does not grant approval, does not mutate GitHub, and does not start
background work.

## When To Use A Draft

Use a draft only when `draft_status` is `ready_to_copy`.

Do not paste a draft whose `draft_status` is `needs_scope`,
`needs_revision_first`, `blocked`, or `none`.

- If `needs_scope`, fill the missing task goal, expected files, or required
  checks first.
- If `needs_revision_first`, revise the underlying candidate or input before
  any handoff.
- If `blocked`, do not hand off.
- If `none`, ask the user or clarify direction before preparing a handoff.

`ready_to_copy` means the draft can be copied after human review. It is not
approval, not proof, not evidence, not durable readiness, not merge authority,
and not a Core decision.

## What To Check Before Pasting

Before pasting the copyable handoff text into Codex, confirm that:

- the first line says it is a draft prompt for a future user-started Codex
  task;
- it says review before pasting into Codex;
- it says it does not execute Codex;
- it says no merge, no approval, no GitHub mutation, and no background work;
- the PR-centered workflow is visible: Codex codes/tests/opens PR, ChatGPT
  reviews, and the user decides merge;
- the task goal is clear;
- expected files are grouped, and the full list remains the scope;
- expected file coverage says all files are listed and no omitted files remain;
- required checks are concrete commands or concrete validation steps;
- forbidden files and forbidden surfaces are visible;
- the skipped-check policy is visible and says skipped checks need concrete
  reasons.

## How To Read `expected_file_scope`

`codex_task.expected_files` is the canonical full scope. That complete list is
the task boundary.

`expected_file_scope` is display material only. Grouping improves readability
but does not reduce scope.

Primary files are the likely main edit targets. Docs/reports and dogfood
artifacts provide supporting material. Smoke/validation files and neighboring
allowlist files are guardrails. Package metadata appears separately.

If `omitted_files` is not empty, do not use the draft as `ready_to_copy`.
Missing display coverage means the human cannot confirm that the grouped view
still represents the complete expected-file scope.

## How To Start A Codex Task Manually

1. Review the draft text.
2. Confirm `ready_to_copy` and no omitted files.
3. Confirm expected files and checks match the intended task.
4. Paste the copyable handoff text into Codex only as a user-started task.
5. Let Codex code, test, and open a PR only inside that explicitly started
   task.
6. Have ChatGPT review the resulting PR.
7. Let the user decide merge.

## What Not To Do

Do not treat `ready_to_copy` as approval. Do not treat the draft as a Core
decision. Do not let it trigger Codex automatically.

Do not use the draft to merge, publish, deploy, approve, retry, replay, or post
externally. Do not add credentials or private/provider/token data.

## Quick Checklist

- `draft_status` is `ready_to_copy`.
- The first line says this is a draft prompt for a future user-started Codex
  task.
- The draft says review before pasting.
- The draft says it does not execute Codex.
- The draft says no merge, no approval, no GitHub mutation, and no background
  work.
- PR-centered workflow is present: Codex codes/tests/opens PR, ChatGPT
  reviews, user decides merge.
- Task goal is specific enough to act on.
- `codex_task.expected_files` is the full scope.
- `expected_file_scope` groups the same full list for readability.
- `omitted_files` is empty.
- Required checks are concrete.
- Forbidden files and forbidden surfaces are visible.
- Skipped-check policy requires concrete reasons.

## Example Interpretation

Bounded generic example:

- `draft_status: ready_to_copy` means "copyable after review".
- `expected_file_scope.total_count: 17` means "17 files in task scope".
- `omitted_files: []` means "no expected scope omitted from the display".

This example is generic. It does not include raw source payloads, raw candidate
payloads, private/provider/token data, hidden reasoning, generated model
output, or credentials.

## Non-Goals And Forbidden Actions

This usage note does not implement:

- runtime routes;
- app/API behavior;
- product UI, components, CSS, or browser-facing behavior;
- DB schema, migrations, persistence, graph DB behavior, or source ingress;
- OAuth or provider/model/API calls;
- GitHub mutation outside a scoped user-started PR workflow;
- proof/evidence/readiness writes;
- ChatGPT Apps, Codex plugin, or Codex SDK execution;
- merge, approval, deploy, publish, retry, replay, or external posting;
- Event Rail, graph topology, node id/type, edge id/type, packet section
  order, Agent Brief read route behavior, local manual preview route behavior,
  or Perspective runtime route behavior changes.

The draft remains human-reviewed, user-started, and PR-centered. Codex may
code/test/open PR only after the user explicitly starts the Codex task;
ChatGPT reviews; the user decides merge.

## Future Next Step

Add copy-ready checklist to Codex handoff draft text.
