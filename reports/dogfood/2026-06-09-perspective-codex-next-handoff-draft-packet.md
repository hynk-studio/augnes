# Perspective Codex Next-Handoff Draft Packet Dogfood

Fixed generated timestamp: 2026-06-09T00:00:00.000Z

This is dogfood output, not execution authority. It is draft only and does not execute Codex.
No GitHub mutation. No approval. No merge. No Core decision.
PR-centered workflow: Codex codes/tests/opens PR only after a user explicitly starts a Codex task, ChatGPT reviews, and the user decides merge.

## Full Chain Summary

### Formation Input Bundle

- bundle_version: perspective_formation_input_bundle.v0.1
- bundle_kind: formation_input_bundle
- generated_at: 2026-06-09T00:00:00.000Z
- readiness: ready_for_candidate
- work_id: AG-perspective-codex-next-handoff-draft-dogfood
- source_pr_refs: pr:hynk-studio/augnes#468

### Perspective Candidate

- candidate_version: perspective_candidate.v0.1
- candidate_id: perspective-candidate:v0.1:project-augnes-ag-perspective-codex-next-handoff:ufykip
- basis_quality: sufficient_for_review
- next_actions: review_candidate, prepare_codex_handoff

### ChatGPT Briefing Preview

- briefing_version: perspective_candidate_briefing_preview.v0.1
- briefing_kind: chatgpt_perspective_candidate_briefing_preview
- target_surface: chatgpt_review_surface
- codex_handoff_readiness: ready_to_discuss_handoff

### User Judgment Capture Packet

- packet_version: perspective_user_judgment_capture_packet.v0.1
- packet_id: perspective-user-judgment-capture:v0.1:perspective-candidate-v0-1-project-augnes-ag-per:jslyf7
- decision_effect: captured_for_review
- next_handoff_discussion: ready_to_draft_handoff

### Codex Next-Handoff Draft Packet

- draft_version: perspective_codex_next_handoff_draft_packet.v0.1
- draft_kind: codex_next_handoff_draft
- draft_id: perspective-codex-next-handoff-draft:v0.1:perspective-user-judgment-capture-v0-1-perspecti:1elkhpt
- draft_status: ready_to_copy

## Ready-to-copy Draft

- draft_id: perspective-codex-next-handoff-draft:v0.1:perspective-user-judgment-capture-v0-1-perspecti:1elkhpt
- draft_status: ready_to_copy
- source judgment packet id: perspective-user-judgment-capture:v0.1:perspective-candidate-v0-1-project-augnes-ag-per:jslyf7
- source candidate id: perspective-candidate:v0.1:project-augnes-ag-perspective-codex-next-handoff:ufykip
- task goal: Add local Codex handoff draft dogfood report for the Perspective manual review loop.
- expected files:
- scripts/dogfood-perspective-codex-next-handoff-draft.mjs
- scripts/smoke-perspective-codex-next-handoff-draft-dogfood.mjs
- docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md
- reports/2026-06-09-perspective-codex-next-handoff-draft-dogfood.md
- reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md
- package.json
- docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md
- docs/PERSPECTIVE_FORMATION_LANE_V0_1.md
- docs/PERSPECTIVE_USER_JUDGMENT_CAPTURE_PACKET_V0_1.md
- scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs
- scripts/smoke-perspective-user-judgment-capture-packet.mjs
- scripts/smoke-perspective-candidate-briefing-preview.mjs
- scripts/smoke-perspective-candidate-builder-fixture.mjs
- scripts/smoke-perspective-formation-input-bundle-builder.mjs
- scripts/smoke-perspective-formation-lane-v0-1.mjs
- scripts/smoke-perspective-agent-brief-read-surface.mjs
- scripts/smoke-perspective-temporal-spatial-projection-builders.mjs
- required checks:
- npm run typecheck
- npm run dogfood:perspective-codex-next-handoff-draft
- npm run smoke:perspective-codex-next-handoff-draft-dogfood
- npm run smoke:perspective-codex-next-handoff-draft-packet
- git diff --check
- forbidden files:
- app/api/**
- components/**
- db/**
- migrations/**
- forbidden surfaces:
- runtime routes
- product UI
- provider/model/API calls
- Codex execution
- GitHub mutation
- skipped-check policy: Report unavailable runtime helpers and absent lint/test scripts with concrete reasons.

### Copyable Codex Handoff Text

```text
# Codex Next-Handoff Draft Packet

This is a draft prompt for a future user-started Codex task.
Review it before pasting into Codex.
It does not execute Codex.
This draft authorizes no merge, no approval, no GitHub mutation, and no background work.
Codex may code, test, and open a PR only when the user explicitly starts a Codex task with this draft.
PR-centered workflow: Codex codes/tests/opens PR, ChatGPT reviews, and the user decides merge.

Draft id: perspective-codex-next-handoff-draft:v0.1:perspective-user-judgment-capture-v0-1-perspecti:1elkhpt
Draft status: ready_to_copy
Source judgment packet id: perspective-user-judgment-capture:v0.1:perspective-candidate-v0-1-project-augnes-ag-per:jslyf7
Source candidate id: perspective-candidate:v0.1:project-augnes-ag-perspective-codex-next-handoff:ufykip

## Task Goal
Add local Codex handoff draft dogfood report for the Perspective manual review loop.

## Repo and Branch
Target repo: hynk-studio/augnes
Base branch: main
Working branch suggestion: codex/perspective-codex-next-handoff-draft-dogfood-v0-1

## Expected Files
- scripts/dogfood-perspective-codex-next-handoff-draft.mjs
- scripts/smoke-perspective-codex-next-handoff-draft-dogfood.mjs
- docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md
- reports/2026-06-09-perspective-codex-next-handoff-draft-dogfood.md
- reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md
- package.json
- docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md
- docs/PERSPECTIVE_FORMATION_LANE_V0_1.md
- docs/PERSPECTIVE_USER_JUDGMENT_CAPTURE_PACKET_V0_1.md
- scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs
- scripts/smoke-perspective-user-judgment-capture-packet.mjs
- scripts/smoke-perspective-candidate-briefing-preview.mjs
- scripts/smoke-perspective-candidate-builder-fixture.mjs
- scripts/smoke-perspective-formation-input-bundle-builder.mjs
- scripts/smoke-perspective-formation-lane-v0-1.mjs
- scripts/smoke-perspective-agent-brief-read-surface.mjs
- scripts/smoke-perspective-temporal-spatial-projection-builders.mjs

## Forbidden Files
- app/api/**
- components/**
- db/**
- migrations/**

## Forbidden Surfaces
- runtime routes
- product UI
- provider/model/API calls
- Codex execution
- GitHub mutation

## Required Checks
- npm run typecheck
- npm run dogfood:perspective-codex-next-handoff-draft
- npm run smoke:perspective-codex-next-handoff-draft-dogfood
- npm run smoke:perspective-codex-next-handoff-draft-packet
- git diff --check

## Skipped-Check Policy
Report unavailable runtime helpers and absent lint/test scripts with concrete reasons.

## User Constraints
- No runtime route
- No UI or browser-facing behavior
- No DB schema or persistence
- No provider/model/API calls
- No GitHub mutation from the dogfood script
- No proof/evidence/readiness writes
- No Codex execution

## Implementation Notes
- Build deterministic public-safe samples only.
- Write a dogfood artifact; do not execute Codex.
- Keep contrast cases visibly separate from the ready-to-copy path.

## Review Notes
- Evaluate whether the copyable handoff text helps a human decide the next Codex task.
- Treat ready_to_copy as copyable draft status only.

## User/Core Decision Questions
- None

## Authority Boundary
Draft only. This is not committed state, proof, evidence, readiness, approval, merge authority, GitHub mutation, a Core decision, ChatGPT Apps integration, or Codex execution.
```

## Contrast Cases

### Contrast: needs_scope

- draft_id: perspective-codex-next-handoff-draft:v0.1:perspective-user-judgment-capture-v0-1-perspecti:1nfl05u
- draft_status: needs_scope
- decision_effect: captured_for_review
- next_handoff_discussion: ready_to_draft_handoff
- note: The human can see that scope is incomplete before copying a handoff.
- reasons:
- expected_files are missing
- required_checks are missing
- gaps:
missing_task_goal: false
missing_expected_files: true
missing_required_checks: true
blocked_by_user_judgment: false
needs_revision_first: false
user_clarification_needed: false

### Contrast: needs_revision_first

- draft_id: perspective-codex-next-handoff-draft:v0.1:perspective-user-judgment-capture-v0-1-perspecti:qhsyaa
- draft_status: needs_revision_first
- decision_effect: captured_for_review
- next_handoff_discussion: needs_revision_first
- note: User revision reason: expected files should be narrowed before any handoff draft is copied.
- reasons:
- user judgment requires revision before handoff drafting
- gaps:
missing_task_goal: false
missing_expected_files: false
missing_required_checks: false
blocked_by_user_judgment: false
needs_revision_first: true
user_clarification_needed: false

### Contrast: blocked

- draft_id: perspective-codex-next-handoff-draft:v0.1:perspective-user-judgment-capture-v0-1-perspecti:1k0vaem
- draft_status: blocked
- decision_effect: blocked_by_user_judgment
- next_handoff_discussion: blocked
- note: Blocking tension: tension:wrong-task-goal.
- reasons:
- user judgment or blocking tension blocks handoff drafting
- gaps:
missing_task_goal: false
missing_expected_files: false
missing_required_checks: false
blocked_by_user_judgment: true
needs_revision_first: false
user_clarification_needed: true

### Contrast: none

- draft_id: perspective-codex-next-handoff-draft:v0.1:perspective-user-judgment-capture-v0-1-perspecti:1qs614a
- draft_status: none
- decision_effect: needs_clarification
- next_handoff_discussion: none
- note: Clarification requested before handoff drafting.
- reasons:
- user judgment requests clarification or no handoff draft
- gaps:
missing_task_goal: false
missing_expected_files: false
missing_required_checks: false
blocked_by_user_judgment: false
needs_revision_first: false
user_clarification_needed: true

## Evaluation

Conclusion: PASS
Whether the draft text is copy-ready for a human-approved Codex task: PASS

### What is usable

- The copyable text now starts by naming itself as a draft prompt for a future user-started Codex task.
- The ready path exposes task goal, files, checks, forbidden surfaces, skipped-check policy, and PR workflow.
- The copyable text is bounded enough for a future user-started Codex task.
- The authority boundary is repeated in both summary fields and the copyable text.

### What remains confusing

- No immediate copy blocker remains after the direct draft-prompt opening.
- Future real-task evaluation should confirm whether the expanded expected files list is still concise enough.

### What should be improved before any runtime/App integration

- Add a shorter first-line human instruction before any future runtime or App surface.
- Keep scope gaps and revision blockers visually adjacent to copyable text.

### Risk notes

- The largest risk is treating copyable draft text as execution authority.
- The contrast cases reduce that risk by making non-ready statuses visible.

### Next recommended improvement

- Evaluate Codex handoff draft in a real docs-only Codex task

## Authority Boundary

- draft only
- does not execute Codex
- no GitHub mutation
- no approval
- no merge
- no Core decision
- ChatGPT reviews and user decides merge
