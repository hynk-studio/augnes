# Perspective Candidate Briefing Preview v0.1

## Purpose and Status

This is the pure local ChatGPT-facing briefing preview after PR #465. PR #465
added `buildPerspectiveCandidateFromFormationInputBundle(bundle)` so bounded
Formation Input Bundle material can become a non-committed Perspective
Candidate. This slice adds
`buildChatGptPerspectiveCandidateBriefingPreview(candidate)` so non-committed
Perspective Candidates can become reviewable briefing material for ChatGPT
conversation, user judgment capture, and next handoff discussion.

The briefing preview is deterministic and pure local. It accepts a
`perspective_candidate.v0.1` object, reads no files or environment variables,
does not create timestamps, does not call network APIs, and does not import
runtime route, DB, or persistence helpers.

This slice does not implement ChatGPT Apps integration. It also does not
implement a route, UI, DB, persistence, OAuth, provider calls, Codex plugin,
Codex SDK execution, proof/evidence/readiness writes, Core-gated
accept/reject/supersede, merge/publish/approval, or source ingress.

## Output Model

The builder returns a
`chatgpt_perspective_candidate_briefing_preview` targeted to
`chatgpt_review_surface`.

The preview includes:

- source candidate id, version, status, and authority;
- a deterministic headline based on candidate basis quality and thesis;
- briefing sections for thesis, basis quality, evidence basis, unresolved
  tensions, next action candidates, user/Core decision questions, and authority
  boundary;
- evidence pointer counts, pointer kind counts, and pointer-only refs;
- unresolved tensions copied separately from evidence support;
- next action candidates marked advisory only and discussion only;
- user reply prompts for ChatGPT review conversation;
- Codex handoff readiness for discussion only;
- copyable briefing text for manual ChatGPT review;
- raw payload exclusion and explicit false authority flags.

Preserves evidence pointer refs as pointer-only. Empty pointer refs are omitted
if they somehow reach the briefing builder.

Preserves unresolved tensions separately from support. Failed checks, skipped
check gaps, unresolved gaps, readiness reasons, blocked state, and needs-review
state remain visible and are not treated as supporting evidence.

## Review and Handoff Semantics

For a `sufficient_for_review` candidate, the headline says the candidate is
ready for human review, not approved. Codex handoff readiness becomes
`ready_to_discuss_handoff` only when the candidate includes
`prepare_codex_handoff` as an advisory next action.

For a `needs_review` candidate, the headline says review is needed before
handoff. Tensions and user/Core decision questions remain visible, and Codex
handoff readiness is `review_required`.

For a `blocked` candidate, the headline says formation is blocked by missing or
invalid input, and Codex handoff readiness is `blocked`.

`review_candidate` remains advisory when present. `prepare_codex_handoff`
remains advisory discussion material only and does not execute Codex.

## Copyable Briefing Text

The copyable briefing text is display text only. It includes candidate id,
candidate status and authority, thesis, basis quality, evidence pointer count,
unresolved tension count, advisory next action candidates, user/Core decision
questions, user reply prompts, Codex handoff readiness, and authority boundary.

It does not include raw pasted text, raw source payloads, raw candidate
payloads, private/provider/token/OAuth/API key/billing payloads, hidden
reasoning, raw generated model payloads, or secrets.

It does not claim approval. It does not instruct Codex to run.

## User Judgment Capture

The preview supports user judgment capture by generating user reply prompts.
Those prompts are conversation material only, for example:

- Does this candidate match your intended direction?
- Which unresolved tension should block the next handoff?
- Should the next step be to fix input gaps or prepare a Codex handoff?

The prompts help a ChatGPT review surface ask for user judgment without
creating committed state, proof, evidence, readiness, approval, or merge
authority.

## Authority Boundary

The briefing preview is not committed state, not proof, not evidence, not
readiness, not approval, and not merge authority. It is also not ChatGPT Apps
integration or Codex execution.

The preview has explicit false authority flags for:

- committed state;
- persistence;
- provider/model/API calls;
- proof/evidence/readiness writes;
- Codex execution;
- merge/publish/approval;
- ChatGPT Apps integration.

This slice does not change Event Rail, graph topology, node ids/types, edge
ids/types, packet section order, Agent Brief read route behavior, local manual
preview route behavior, Perspective runtime route behavior, product UI,
components, CSS, browser-facing behavior, DB schema, migrations, source
ingress, OAuth, provider/model/API services, Codex plugin integration, or
Codex SDK execution.

## Future Next Step

Add manual ChatGPT user judgment capture packet.
