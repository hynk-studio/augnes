# Selected Work Handoff Snapshot Dogfood - 2026-05-27

## Summary

This local dogfood reviewed the compact read-only Selected Work Handoff Snapshot added to the Cockpit Work tab after PR #251. The review focused on whether the snapshot is useful as an at-a-glance local work handoff surface using existing Work tab data only.

The represented local selected-work handoff scenarios were Sample A with no selected work or not-yet-loaded work, Sample B with selected work basics loaded but no work brief, Sample C with full selected work handoff material loaded, and Sample D with boundary-only safety review.

This document is local dogfood review material. It is not a benchmark, not a score, not proof, not evidence, not authoritative for readiness, and not a PR quality evaluator.

This dogfood considers both human operator usefulness and delegated agent worker usefulness.

## Scope boundary

- No GitHub call.
- No OpenAI or provider call.
- No Augnes runtime route call.
- No Cockpit UI change.
- No sidecar e_t implementation.
- No posting.
- No review creation.
- No approval.
- No merge automation.
- No publication.
- No evidence or proof creation.
- No Augnes mutation.
- No state commit or reject.
- No new helper.
- No new API route.
- No DB schema or migration.
- No durable perspective state.
- No actuation path.

## Dogfood samples

### Sample A: No selected work or not-yet-loaded work handoff

Local work handoff shape: selected work id is null, selected work item is null, and work brief is null.

Expected snapshot reading: the snapshot can show a safe empty state. The operator knows they need to select a work item before reviewing handoff context.

Human operator usefulness: useful. The empty state keeps the Work tab from implying a selected handoff exists when there is none.

Delegated agent worker usefulness: useful. A handoff consumer can see that no work item is currently selected and that delegation context still needs to be loaded or chosen.

Snapshot friction: mixed. `No selected work` is clear, but it may eventually need a stronger next cue if operators miss that selection is required.

What the snapshot helped preserve: the distinction between an absent selection and loaded local work handoff material.

What the snapshot did not solve: it did not select work, load details, infer the next task, or authorize any execution.

### Sample B: Selected work basics loaded, work brief not loaded

Local work handoff shape: selected work item exists from `workItems`; `workBrief` is not loaded yet.

Expected snapshot reading: the snapshot still shows work id, title, status, priority, user attention, and next action from list data. Codex handoff shows `Not loaded`, and suggested verification count is `0`.

Human operator usefulness: useful. The operator can orient around the selected work before the detailed brief arrives.

Delegated agent worker usefulness: mixed. The worker can identify which work is being discussed, but should wait for deeper context before treating the handoff as complete.

Snapshot friction: mixed. `Not loaded` for Codex handoff is compact but does not distinguish not requested, loading, failed, or unavailable. The selectedWorkItem basics are enough for orientation, but not enough for detailed delegation.

What the snapshot helped preserve: selected work identity and basic triage context while avoiding a new fetch or API route.

What the snapshot did not solve: it did not explain why the brief is absent or replace the detailed WorkFocusSection as the source of truth.

### Sample C: Full selected work handoff loaded

Local work handoff shape: selected work item exists, work brief exists, related state keys are present, recent events are present, `codex_handoff` exists, and suggested verification has one or more commands.

Expected snapshot reading: the human operator can quickly see current work, next action, related state keys, and verification count. The delegated agent worker or Codex handoff consumer can identify that `codex_handoff` and suggested verification are available.

Human operator usefulness: useful. The snapshot compresses work identity, status, priority, attention, next action, related state keys, recent events, handoff availability, and verification prompts into a first-read surface.

Delegated agent worker usefulness: useful. The worker can see which selected work is being handed off, whether handoff material exists, which state keys should anchor the task, and whether suggested verification is present.

Snapshot friction: mixed. Long next actions or titles may become noisy inside metric cards. Related state key chips are helpful for continuity but could become dense if many keys are present.

What the snapshot helped preserve: local handoff continuity across selected work identity, state anchors, recent trace shape, and verification prompts.

What the snapshot did not solve: it did not evaluate the work, run verification, post to GitHub, create reviews, or grant execution permission.

### Sample D: Boundary-only safety review

Local work handoff shape: count values are secondary; this sample focuses on snapshot copy and interaction boundaries.

Expected snapshot reading: the snapshot has no buttons. The read-only, no-Codex-execution, no-GitHub-posting, no-approval, no-merge, no-publication, no-provider, no-mutation, and no-state-commit boundary is visible.

Human operator usefulness: useful. The copy keeps local review material separate from execution authority.

Delegated agent worker usefulness: useful. The handoff consumer can treat the snapshot as context while recognizing that it does not authorize execution.

Snapshot friction: too verbose. Boundary copy is necessary, but it may become repetitive near other Work tab or Operator tab boundary notes.

What the snapshot helped preserve: the local-only/no-actuation boundary and the distinction between handoff context and authority.

What the snapshot did not solve: it did not create a new authority path, write control, provider call, runtime mutation, or durable perspective state.

## Cross-sample findings

- Useful: selected work identity near the top of the Work tab makes the current handoff target easier to confirm.
- Useful: fallback to selectedWorkItem basics keeps the snapshot informative before the full work brief is loaded.
- Useful: related state keys and recent events help orient local handoff context when the brief is loaded.
- Mixed: `Not loaded` is concise but may be ambiguous for Codex handoff availability.
- Mixed: suggested verification count is helpful for delegation planning but must not imply execution permission.
- Too verbose: boundary copy may feel repetitive near other local-only notes.
- Missing key info: the snapshot does not explain why handoff material is not loaded.
- Not useful for: posting, approval, merge, publication, provider calls, runtime mutation, state commit or reject, sidecar e_t, durable perspective state, or PR quality evaluation.

## Human operator usefulness observations

The snapshot helped a human operator see selected work identity, current status, priority, whether attention is needed, next action, related state keys, and whether deeper Work details are needed.

The empty and partial-load samples were useful because they avoided presenting a false full handoff. The full-load sample was useful because it compressed the current work target and surrounding local handoff state into one first-read surface.

The local review boundary remained visible. That helped preserve the distinction between local review material and execution authority.

The detailed WorkFocusSection remains necessary for complete context, event details, proof links, and copyable handoff drafts.

## Delegated agent worker usefulness observations

The snapshot helped an agent worker or Codex handoff consumer see whether a `codex_handoff` is available, whether suggested verification exists, which selected work is being delegated or reviewed, and which related state keys should anchor the task.

The partial-load sample was useful but incomplete. It showed which work item was selected, while also signaling that more context must be loaded before delegation.

The snapshot does not authorize execution. Suggested verification and Codex handoff availability are local handoff cues only; they do not grant permission to run Codex, call providers, post, approve, merge, publish, mutate runtime state, or commit or reject state.

## Development feedback

- Selected work identity is useful at the top of Work tab.
- Fallback to selectedWorkItem basics is useful when workBrief is not loaded.
- Codex handoff availability is useful but may need clearer `Not loaded` semantics later.
- Suggested verification count is useful for delegation planning but must not imply execution permission.
- Next action may need truncation or layout tuning if long.
- Related state key chips may need density tuning.
- Snapshot should remain buttonless and read-only.
- No new fetch or API route was needed.
- Detailed WorkFocusSection remains the source of truth.

## UI/UX implications

This dogfood does not design new UI.

Selected work snapshot rows may later become compact status cards. `Not loaded` could later distinguish not requested, loading, and failed states if needed. Suggested verification count should not imply permission to execute Codex. Related state key chips may help handoff continuity. Boundary copy must not become an execution affordance. No action buttons should be added to this snapshot without a separate decision.

## Sidecar e_t / perspective research implications

This dogfood does not implement sidecar e_t.

Selected work handoff state may become a future perspective signal. Related state keys and recent events may be useful temporal handoff context. `codex_handoff` availability may be a useful delegation-planning signal, but not execution authority. Durable perspective schema remains out of scope.

## Recommended next decision

If the selected-work snapshot is usable, continue with another product/non-helper Cockpit usability gap.
