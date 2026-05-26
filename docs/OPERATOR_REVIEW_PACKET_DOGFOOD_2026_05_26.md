# Codex Operator Review Packet Dogfood - 2026-05-26

## Summary
This report dogfoods `codex:operator-review-packet` against three recent Track B PR-style cases: a readiness checker, a command preview helper, and the operator review packet helper itself.

This is local dogfood review material. It is not a benchmark, not a numeric rating, not a proof artifact, not an evidence artifact, not authority to declare readiness, and not a PR quality evaluator.

The dogfood pass focused on whether the packet is useful for operator handoff, review continuity, and time-axis perspective preservation before deciding whether any future UI, perspective schema, or actuation-related work is justified.

## Scope boundary
This dogfood report and smoke use local synthetic fixtures only.

Confirmed out of scope:
- no GitHub call
- no OpenAI or provider call
- no Augnes runtime route call
- no Cockpit UI change
- no sidecar `e_t` implementation
- no posting
- no review creation
- no approval
- no merge automation
- no publication
- no evidence or proof creation
- no Augnes mutation
- no state commit or reject

## Dogfood samples
### Sample A - PR #214-like readiness checker
Task summary: add `codex:github-comment-readiness` as a local preflight consistency helper.

Timeline shape: task opened, preflight consistency review, operator decision.

Expected perspective observation: useful for showing local-only preflight boundary and manual no-actuation handling, with no blocking-to-follow-up observation because no blocking event is present.

Packet output usefulness: useful. The packet made the local-only boundary and no-posting decision easy to scan.

Packet output friction: mixed. Missing optional materials were correctly warnings, but they read like a checklist even when absent material was expected.

What the packet helped preserve: task intent, PR identity, local preflight boundary, warning-vs-blocker distinction, and the operator decision.

What the packet did not solve: it did not explain the internal consistency model of the readiness helper. The material summary is deliberately presence-only.

### Sample B - PR #215-like command preview
Task summary: add `codex:github-comment-posting-command-preview` and the helper field `codex:github-comment-command-preview`.

Timeline shape: initial dry-run command preview task, blocking review finding about `target_ref` consistency not being revalidated, follow-up commit resolving target parsing and pull/issue consistency, final merge/manual handoff decision.

Expected perspective observation: blocking review finding followed by explicit resolved follow-up, plus preserved manual handoff and no-actuation decision.

Packet output usefulness: useful. The packet carried the correction arc from review finding to follow-up without needing a live PR lookup.

Packet output friction: mixed. The perspective observation was concise, but the timeline still needs careful reading to understand why the correction mattered.

What the packet helped preserve: time-axis correction, downstream boundary hardening, no-real-posting decision, and the distinction between preflight material and execution authority.

What the packet did not solve: it did not verify the code change itself and did not establish authority for a posting path.

### Sample C - PR #238-like operator review packet
Task summary: add `codex:operator-review-packet`.

Timeline shape: initial packet helper task, blocking review finding that perspective predicates overclaimed resolved follow-up/manual handoff, follow-up commit tightening predicate logic, final merge/dogfood-next decision.

Expected perspective observation: blocking review finding followed by explicit resolved follow-up, plus dogfood-next/manual local-only decision when it is explicitly worded.

Packet output usefulness: useful. The packet can describe its own review correction without needing to claim that the helper is generally good.

Packet output friction: confusing in one place. The phrase "manual handoff/no actuation" is clear to Track B maintainers, but could sound like an operational state to a new reader unless it is displayed with the local-only boundary.

What the packet helped preserve: the predicate-hardening correction, the reason for dogfooding next, and the fact that future UI or sidecar work was intentionally deferred.

What the packet did not solve: it did not replace structured review-event links, and it did not answer whether text predicates are sufficient for future perspective research.

## Cross-sample findings
Useful: the packet consistently preserved task intent, PR metadata, timeline order, local-only boundary, and operator decision in a compact form.

Mixed: the material summary is safe because it is presence-only, but it may be too shallow for a reviewer who needs to know which part of a helper output mattered.

Confusing: warnings for intentionally missing optional material may need a short label explaining whether absence is expected or surprising.

Too verbose: the authority boundary is valuable, but repeated boundary language could become noisy if several packets are shown together.

Missing key info: the packet does not link a follow-up event to the exact blocking finding it resolves. It uses event order and conservative text signals.

Not useful for: code correctness review, permission decisions, publishing, or replacing human judgment.

## Perspective usefulness observations
The packet helped preserve blocking finding to follow-up resolution for Samples B and C when the later event explicitly said it was resolved or addressed.

The packet helped preserve manual handoff and no-actuation decisions when those decisions were explicitly worded. This was useful because the same PR material could otherwise be mistaken for an execution plan.

The local-only boundary remained visible across samples. This matters most for preflight and command preview material because those helpers describe possible command shapes without granting permission to run them.

The packet is useful for next-session onboarding context. A future operator can see what happened, what changed after review, and why dogfooding remained the next step.

The packet also helped keep preflight material separate from execution authority. The output does not convert readiness, payload, or command preview material into permission to post.

## Development feedback
- `operation_mode` fixed to `human_assisted` may be limiting if delegated review packets become a real workflow.
- `review_events.result` may need controlled enums so the packet does not depend on fragile text conventions.
- Follow-up events may need structured links to the blocking event they resolve.
- `material_summary` presence-only is safe but may be too shallow for review handoff.
- `operator_questions` are useful as prompts, but they are generic and may need task-specific templates later.
- Timeline readability may need compression before UI work.
- Missing optional material warnings may need a field that distinguishes expected absence from surprising absence.

## UI/UX implications
This dogfood pass does not design a full UI.

Packet sections that might become UI cards: task summary, PR summary, timeline, perspective observations, warnings, blockers, and recommended next decision.

Fields that are too noisy for a first viewport: full authority boundary, repeated material notes, and generic operator questions.

Labels that could cause execution-readiness confusion: "recommended next decision", "preflight", and "command preview". These should be shown beside explicit local-only and no-actuation language.

Preflight and command preview material should be displayed as review material, not as a runnable command surface. Any future display should avoid buttons or affordances that imply posting.

## Sidecar e_t / perspective research implications
This report does not implement sidecar `e_t`.

Future research questions:
- Which review events are worth becoming perspective signals?
- Are text predicates enough for review continuity, or do they create too many false positives and false negatives?
- Are linked events needed to say which follow-up resolves which blocking finding?
- Are conservative false negatives preferable to false positives when preserving review perspective?
- Should local-only boundary decisions become explicit perspective signals, or remain ordinary operator decisions?

## Recommended next decision
Dogfood the packet on 1-2 more real PRs before implementing UI, sidecar `e_t`, or actuation helpers.

If those packets are already too noisy, tighten the packet schema before UI or research work. The current dogfood pass does not give a grounded reason to move to real GitHub posting or actuation implementation.
