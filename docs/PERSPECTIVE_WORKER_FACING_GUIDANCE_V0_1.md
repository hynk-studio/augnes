# Perspective Worker-Facing Guidance v0.1

## Purpose and Status

This is the pure local Codex-side worker guidance scaffold after the local
Codex and ChatGPT perspective handoff packet chain. The prior chain produced
Formation Input Bundle, Perspective Candidate, ChatGPT Briefing Preview,
Manual User Judgment Capture Packet, Codex Next-Handoff Draft Packet, and the
dogfood/eval/readability/manual usage note layers. This slice adds
`buildWorkerFacingPerspectiveGuidanceFromCandidate(input)` so a
`perspective_candidate.v0.1` object can become neutral, worker-facing guidance
for planning the next smallest useful work.

The builder is deterministic and pure local. It accepts a Perspective
Candidate plus optional caller-supplied bounded guidance context. It does not
read files or environment variables, does not call network APIs, does not
create timestamps, and does not import runtime route, DB, provider, model,
Codex SDK, ChatGPT Apps, GitHub automation, or persistence helpers.

This guidance is planning material only. It is not committed state, proof,
evidence, readiness, approval, merge authority, GitHub mutation, ChatGPT Apps
integration, Codex execution, provider/model/API behavior, persistence, or a
Core decision.

## Input

The builder accepts:

- `candidate`: a `perspective_candidate.v0.1` object;
- optional `guidance_context.work_goal`: explicit bounded worker-facing goal
  text;
- optional `guidance_context.bounded_summary`: explicit bounded summary text
  for neutral observations.

The builder may use explicit, reviewable summaries from the source candidate,
such as `selected_material.changed_files_summary` or `thesis`, when they do
not look like unsafe source material. It does not carry raw/private/provider
payloads, token payloads, hidden reasoning, raw source payloads, raw candidate
payloads, generated model payloads, API keys, OAuth payloads, billing
payloads, or secrets.

Unsafe source-like text is omitted from the guidance. The output records the
field names omitted in `privacy.omitted_unsafe_fields` without echoing the
unsafe material.

## Output

The output is a `worker_facing_perspective_guidance.v0.1` object with:

- `guidance_version`;
- `guidance_kind`;
- `guidance_status`;
- `source_candidate` refs, including candidate id, candidate version/status,
  candidate authority, basis quality status, work id, PR refs,
  pointer-only evidence refs, and selected changed-file material;
- `work_goal`;
- `neutral_observations`;
- `scope_alignment`;
- `verification_gaps`;
- preserved `unresolved_tensions`;
- `next_smallest_useful_actions`;
- `stop_or_defer_actions`;
- `user_decision_questions`;
- `worker_instructions`;
- `authority_boundary`;
- raw payload exclusion and explicit false authority flags.

The output intentionally avoids full raw candidate payload copies. It carries
safe refs, counts, bounded summaries, and neutral instructions only.

## Candidate Status Mapping

The builder maps `candidate.basis_quality.status` into worker guidance:

- `sufficient_for_review` becomes `actionable_advisory`;
- `needs_review` becomes `resolve_gaps_first`;
- `blocked` becomes `stop_or_defer`.

`actionable_advisory` means a future worker can use the guidance to draft a
small scoped plan after the user starts a Codex task. It still cannot execute
Codex, mutate GitHub, write persistence, claim readiness, or approve/merge.

`resolve_gaps_first` means the worker should prioritize resolving visible
verification gaps, unresolved tensions, and user/Core decision questions
before planning implementation work.

`stop_or_defer` means the worker should stop or defer planning until the
blocked candidate basis is resolved by the user or Core owner.

## Preserved Review Material

The guidance keeps unresolved tensions visible and derives verification gaps
from:

- failed checks;
- skipped checks;
- skipped checks missing concrete reasons;
- unresolved candidate gaps;
- readiness reasons;
- missing verification material.

Skipped checks with concrete reasons remain visible because they may still
matter to the future worker's validation plan. Visibility is not proof,
evidence, readiness, or approval.

## Worker Instructions

The guidance tells the worker to:

- treat it as neutral planning guidance only after a user starts a future
  Codex task;
- verify repo, branch, scope, changed files, and checks independently before
  editing;
- keep unresolved tensions and verification gaps visible;
- avoid persistence, proof/evidence/readiness writes, approvals, provider
  calls, GitHub mutations, and Core decisions.

When the source candidate needs review, the first instruction is to resolve
visible gaps before proposing implementation work. When the source candidate
is blocked, the first instruction is to stop and defer.

## Authority Boundary

The guidance has explicit false authority flags for:

- committed state;
- persistence;
- provider/model/API calls;
- proof/evidence/readiness writes;
- Codex execution;
- GitHub mutation;
- merge/publish/approval;
- ChatGPT Apps integration;
- Core decision.

This slice adds no runtime route, no UI, no `app/api`, no DB schema or
migration, no persistence, no source ingress, no OAuth, no provider/model/API
call, no proof/evidence/readiness write, no ChatGPT Apps integration, no
Codex SDK/plugin integration, no GitHub mutation automation, no actual Codex
execution, no merge, no approval, and no Core decision.

## Validation

The dedicated smoke is
`npm run smoke:perspective-worker-facing-guidance`. It checks:

- package script registration;
- pure local source boundaries;
- sufficient, needs-review, and blocked candidate mappings;
- preserved unresolved tensions and verification gaps;
- raw/private/provider/token/secret-like material omission;
- false authority flags;
- docs/report coverage;
- changed-file boundary.

## Future Next Step

Dogfood this guidance against a real reviewed Perspective Candidate and use
the report to decide whether the worker-facing instructions are specific
enough for a future Codex task prompt.
