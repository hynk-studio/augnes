# Perspective User Judgment Capture Packet v0.1

## Purpose and Status

This is the pure local manual ChatGPT user judgment capture packet after PR
#466. PR #466 added
`buildChatGptPerspectiveCandidateBriefingPreview(candidate)` so a
non-committed Perspective Candidate can become ChatGPT-facing review material.
This slice adds
`buildManualChatGptUserJudgmentCapturePacket(input)` so a ChatGPT Perspective
Candidate briefing preview plus caller-supplied bounded user judgment can
become non-committed review material.

The builder is deterministic and pure local. It accepts a briefing preview and
caller-supplied bounded user judgment material. It does not read files or
environment variables, does not call network APIs, does not create timestamps
unless `generated_at` is supplied by the caller, and does not import runtime
route, DB, or persistence helpers.

This slice does not implement ChatGPT Apps integration. It also does not
implement a route, UI, DB, persistence, OAuth, provider calls, Codex plugin,
Codex SDK execution, proof/evidence/readiness writes, Core-gated
accept/reject/supersede, merge/publish/approval, or source ingress.

## Input

The builder accepts:

- `briefing_preview`: a
  `chatgpt_perspective_candidate_briefing_preview` from PR #466;
- `user_judgment`: caller-supplied bounded manual judgment material.

Allowed user judgment material is limited to explicit, safe, reviewable
summaries and refs:

- optional caller-supplied `judgment_id`;
- `judgment_summary`;
- answered prompt refs or prompt labels;
- direction alignment: `matches_direction`, `needs_revision`,
  `rejects_candidate`, or `unclear`;
- selected unresolved tension refs;
- blocking tension refs;
- preferred next action: `review_candidate`, `fix_input_gaps`,
  `prepare_codex_handoff`, `ask_user_pm`, or `none`;
- next action rationale;
- user questions;
- assumptions;
- optional caller-supplied `generated_at`.

The builder does not infer user intent from freeform text using a model and
does not classify hidden sentiment. It preserves user judgment as manual review
material, not durable state.

## Output

The output is a `perspective_user_judgment_capture_packet.v0.1` object with:

- `packet_kind: manual_chatgpt_user_judgment_capture`;
- deterministic `packet_id`;
- `capture_mode: manual_chatgpt_review`;
- `manual_review_only: true`;
- source briefing version, kind, target surface, optional briefing id,
  candidate id, candidate version, candidate status, candidate authority, basis
  quality status, and Codex handoff readiness status;
- bounded user judgment fields;
- decision effect;
- next handoff discussion status;
- user/Core decision questions;
- forbidden actions;
- copyable capture text;
- raw payload exclusion and explicit false authority flags.

The packet is not committed state, not proof, not evidence, not readiness, not
approval, and not merge authority. It is also not a Core decision, ChatGPT Apps
integration, or Codex execution.

## Decision Effect

The packet distinguishes three explicit decision-effect states:

- `captured_for_review`: direction alignment is `matches_direction` or
  `needs_revision`, a judgment summary is present, and no blocking tension refs
  are present.
- `needs_clarification`: direction alignment is `unclear`, judgment summary is
  missing, preferred next action is `ask_user_pm`, or user questions are present
  without a clear next action.
- `blocked_by_user_judgment`: direction alignment is `rejects_candidate` or
  blocking tension refs are present.

These states are not approval, readiness, proof, evidence, committed state, or
Core decision.

## Next Handoff Discussion

The packet supports next handoff discussion but does not execute Codex.

It distinguishes:

- `ready_to_draft_handoff`: direction alignment is `matches_direction`, the
  briefing is ready to discuss handoff, preferred next action is
  `prepare_codex_handoff`, and decision effect is `captured_for_review`;
- `needs_revision_first`: preferred next action is `fix_input_gaps`, direction
  alignment is `needs_revision`, or the briefing handoff readiness is
  `review_required`;
- `blocked`: decision effect is `blocked_by_user_judgment` or the briefing
  handoff readiness is `blocked`;
- `none`: preferred next action is `none`, direction alignment is `unclear`, or
  preferred next action is `ask_user_pm`.

`needs_revision` overrides `prepare_codex_handoff` for next handoff discussion.
If the user says the candidate needs revision, the packet must return
`needs_revision_first` unless the packet is already blocked.

## Copyable Capture Text

The copyable capture text is deterministic markdown/plain text. It includes
packet id, source candidate id, judgment summary, direction alignment, selected
and blocking tension refs, preferred next action, handoff discussion status,
user/Core questions, assumptions, and authority boundary.

It does not include raw pasted text, raw source payloads, raw candidate
payloads, private/provider/token/OAuth/API key/billing payloads, hidden
reasoning, raw generated model payloads, or secrets.

It does not claim approval. It does not instruct Codex to run.

## Authority Boundary

The packet has explicit false authority flags for:

- committed state;
- persistence;
- provider/model/API calls;
- proof/evidence/readiness writes;
- Codex execution;
- merge/publish/approval;
- ChatGPT Apps integration;
- Core decision.

This slice does not change Event Rail, graph topology, node ids/types, edge
ids/types, packet section order, Agent Brief read route behavior, local manual
preview route behavior, Perspective runtime route behavior, product UI,
components, CSS, browser-facing behavior, DB schema, migrations, source
ingress, OAuth, provider/model/API services, Codex plugin integration, or
Codex SDK execution.

## Future Next Step

Add pure local Codex next-handoff draft packet from user judgment.
