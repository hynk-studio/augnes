# Perspective Codex Former Pipeline V0.1

This is a pure local Codex perspective former pipeline scaffold. It establishes
a bounded path from existing Augnes Perspective material into model-shaped draft
material, then back into candidate-compatible review material after local
validation.

The scaffold does not call Codex, the Codex SDK, OpenAI APIs, provider/model
APIs, GitHub APIs, network services, DB writers, runtime routes, or UI code.

## Pipeline

The local path is:

1. Perspective Formation Input Bundle
2. CodexPerspectiveFormerInputPacket
3. CodexPerspectiveCandidateDraft
4. validateAndNormalizeCodexPerspectiveCandidateDraft(input)
5. candidate-compatible review material

The model-shaped draft is not accepted candidate state. It is not committed
state, not proof, not evidence, not readiness, not approval, not merge
authority, not GitHub mutation, not Codex execution, and not a Core decision.

## CodexPerspectiveFormerInputPacket

`buildCodexPerspectiveFormerInputPacket(bundle)` consumes the existing
Perspective Formation Input Bundle. It keeps the input packet bounded to:

- source bundle refs and readiness status;
- bounded changed-file summaries and changed-file paths;
- check summaries and skipped-check concrete reasons;
- unresolved gap summaries;
- pointer-only refs for evidence, proof-only actions, work events, session
  traces, and existing Perspective material;
- authority and privacy constraints.

The packet declares role `codex_perspective_former`. Its expected output contract
requires `codex_perspective_candidate_draft.v0.1` and records that the output is
draft-only material.

The packet may include copyable former input text, but that text stays bounded:
it summarizes refs, readiness, pointer counts, privacy, and authority. It does
not contain raw diffs, raw review payloads, raw source payloads, raw candidate
payloads, private/provider/token/billing payloads, credentials, hidden
reasoning, generated model raw payloads, or secret material.

## CodexPerspectiveCandidateDraft

`CodexPerspectiveCandidateDraftV0` is model-output-shaped draft material. It is
not accepted candidate material until local validation succeeds.

The draft shape includes:

- `draft_version` and `draft_kind`;
- `source_former_input_packet` refs;
- `thesis`;
- `selected_material`;
- `evidence_pointer_refs`;
- `unresolved_tensions`;
- `basis_quality_suggestion`;
- `next_action_candidates`;
- `user_core_decision_questions`;
- `qualification_notes`;
- `privacy_flags`;
- `authority_flags`;
- `forbidden_actions`.

The draft must use pointer-only refs from the former input packet. It cannot
invent new raw source material or treat model output as committed state.

## Validation And Normalization

`validateAndNormalizeCodexPerspectiveCandidateDraft(input)` is pure local. It
accepts a former input packet plus a candidate draft and returns either:

- `ready_for_review` with candidate-compatible review material;
- `needs_review` with candidate-compatible review material that preserves gaps
  and qualifications;
- `blocked` with no candidate-compatible review material.

Validation blocks missing required fields, unsupported version/kind values,
source-packet mismatches, unsafe raw/private/provider/token/billing/source
payload markers, raw payload privacy claims, and forbidden authority claims.

Normalization preserves pointer-only refs, skipped-check concrete reasons,
unresolved tensions, selected safe material, safe thesis text, basis quality
qualification, and user/Core decision questions. It returns false authority
flags and non-committed review material only.

## Worker-Facing Perspective Guidance

Worker-Facing Perspective Guidance is a downstream consumer only. This scaffold
does not refine guidance usefulness. The smoke includes a narrow compatibility
fixture that feeds validated candidate-compatible review material into
`buildWorkerFacingPerspectiveGuidanceFromCandidate(input)` and confirms the
guidance remains advisory-only with false authority.

## Reuse Audit

Reused:

- Perspective Formation Input Bundle as the upstream bounded input source.
- Perspective Candidate shape as the normalized candidate-compatible target.
- Worker-Facing Perspective Guidance as an optional downstream compatibility
  consumer.
- Existing strict smoke changed-file allowlist and forbidden-surface patterns.
- Existing worker-guidance unsafe marker rules, mirrored locally.

Intentionally not reused:

- The worker-guidance private unsafe marker helper was not factored or exported.
  Exporting it would change a downstream consumer surface for this scaffold.
- The existing candidate builder was not used as the draft normalizer because it
  builds directly from the Formation Input Bundle. This PR needs a validation
  boundary between model-shaped draft material and candidate-compatible review
  material.
- Runtime routes, UI, DB writers, proof/evidence/readiness writers, Codex SDK
  integration, provider calls, and GitHub automation were not reused because
  they are outside the local scaffold authority boundary.

## Authority Boundary

This scaffold has no Codex call, no Codex SDK, no provider/model/API call, no
GitHub API call, no network access, no DB write, no runtime route, no UI, no
proof/evidence/readiness record, no approval, no merge, no publish, no retry, no
replay, no deploy, and no Core decision.

The next useful PR is to dogfood this local pipeline on reviewed PR material.
