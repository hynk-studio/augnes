# Perspective Codex Handoff Draft Real Docs Task Evaluation v0.1

## Purpose and Status

This document records a real docs-only Codex task evaluation of the refined
Codex next-handoff draft from PR #470. The evaluated task was this
docs/report/smoke/package-only PR slice.

Status: PASS with follow-up. The refined draft is usable for future explicitly
user-started docs-only Codex tasks, with one readability caveat around expected
files.

This document is evaluation material only. It is not runtime behavior, not
approval, not readiness, not merge authority, not GitHub mutation, and not
Codex execution authority.

## Source Handoff Draft Material Reviewed

The evaluation used these bounded source materials as context:

- `reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md`
- `reports/2026-06-09-perspective-codex-next-handoff-draft-copy-refine.md`

The source material was treated as context, not authority. The user-started
task remained the controlling scope.

## Real Docs-Only Task Scope

The real docs-only Codex task was to create a short evaluation document and
companion report/smoke/package pointer that answer whether the refined Codex
next-handoff draft is usable for a real docs/report/smoke/package-only Codex
PR.

Expected files were limited to docs, reports, smoke scripts, package metadata,
and narrow neighboring smoke allowlist updates required by this explicit
evaluation slice.

Forbidden files and forbidden surfaces remained visible: no runtime route, no
app/API changes, no product UI, no component/CSS changes, no DB schema, no
persistence, no source ingress, no OAuth, no provider/model/API calls, no
ChatGPT Apps implementation, no Codex plugin implementation, no Codex SDK
execution, no proof/evidence/readiness writes, no Event Rail or graph topology
changes, and no actual Codex execution beyond the current PR workflow.

## What Was Usable

The first visible line was clear enough for a human to know the copied text is
a draft prompt for a future user-started Codex task. That matters because it
prevents the handoff draft from looking like an already-approved instruction.

The review before pasting instruction was visible. It appeared before the
detailed task sections, so the human review step was not hidden below file
lists or implementation notes.

The authority boundary stayed prominent. The copyable draft kept these
boundaries visible: it does not execute Codex, no merge, no approval, no
GitHub mutation, and no background work. It also preserved the PR-centered
workflow: Codex codes/tests/opens PR only after the user starts the task,
ChatGPT reviews, and the user decides merge.

The required checks were useful. They named concrete commands rather than a
vague "run tests" instruction, and they included targeted Perspective smokes
plus typecheck, build, and diff whitespace checks.

The forbidden files and forbidden surfaces were visible enough to keep this PR
from drifting into runtime/App integration.

## What Remained Confusing or Noisy

The expected files section was safer after PR #470 because it named related
docs, reports, package metadata, and neighboring smoke allowlist files. It was
not under-scoped for this docs/report/smoke/package task.

The remaining issue is readability. The expected files list is long enough
that a human can miss the difference between primary files and guardrail
allowlist files. That is not a blocker for docs-only tasks, but it is noisy.

The draft did not over-explain the authority boundary. Repetition around no
execution, no merge, no approval, and no GitHub mutation was useful because
those are the highest-risk misunderstandings.

## Expected-File Scope Finding

Expected files were appropriate for this task. They were neither under-scoped
nor meaningfully over-scoped for a docs/report/smoke/package-only evaluation
slice.

The caveat is presentation: expected files should be easier to scan. A future
draft should separate primary files from neighboring smoke allowlist files
without removing necessary guardrails.

## Authority Boundary Finding

The authority boundary stayed clear. The draft did not turn copyable text into
approval, proof, evidence, readiness, committed state, merge authority, Core
decision, GitHub mutation, or autonomous Codex execution.

The task remained user-started and PR-centered. Codex codes/tests/opens PR,
ChatGPT reviews, and the user decides merge.

## Future Use Finding

This refined draft is ready to use for future explicitly user-started
docs-only Codex tasks.

Conclusion: PASS with follow-up. Use the draft for docs-only PRs, but improve
expected-file scope readability before promoting the pattern into runtime/App
integration.

## Non-Goals and Forbidden Actions

This evaluation does not implement:

- runtime routes
- app/API behavior
- product UI, components, CSS, or browser-facing behavior
- DB schema, migrations, persistence, graph DB behavior, or source ingress
- OAuth or provider/model/API calls
- GitHub mutation outside the scoped PR workflow
- proof/evidence/readiness writes
- ChatGPT Apps, Codex plugin, or Codex SDK execution
- merge, approval, deploy, publish, retry, replay, or external posting
- Event Rail, graph topology, node id/type, edge id/type, packet section
  order, Agent Brief read route behavior, local manual preview route behavior,
  or Perspective runtime route behavior changes

This evaluation also excludes unredacted pasted content, unredacted source
content, unredacted candidate content, private/provider/token/OAuth/API
credential/billing material, hidden reasoning, and unredacted generated model
output.

## Future Next Step

Refine expected-file scope readability for Codex handoff drafts.

Follow-up note: that readability refinement is scoped as the next pure local
builder/copy/docs/report/smoke PR. It should group expected files for
readability while preserving the complete flat expected-file scope and keeping
guardrail files visible.

Second follow-up note: the manual usage note turns that grouped expected-file
display into human review guidance before any draft is pasted into Codex. The
next copy refinement should add the same copy-ready checklist directly to the
handoff draft text.
