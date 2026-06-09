# Perspective Codex Former Prompt Contract v0.1

This document describes the pure local prompt-contract refinement that follows
PR #478, which dogfooded the Codex perspective former pipeline on reviewed PR
material.

The contract does not call Codex, execute Codex, call the Codex SDK, call
OpenAI/provider/model APIs, call GitHub APIs, use implementation network
access, write DB state, add runtime routes, add UI, create
proof/evidence/readiness records, approve, merge, publish, retry, replay,
deploy, or make Core decisions.

Boundary shorthand:

- no Codex call, no Codex SDK, no provider/model/API call;
- no GitHub API call, no DB state, no runtime routes, no UI;
- no proof/evidence/readiness records, and no Core decisions.

## Purpose

PR #478 found that a model-shaped draft was useful enough to continue when it
added neutral validation-boundary framing beyond a plain PR summary. The prompt
contract makes that behavior explicit for the future path:

1. CodexPerspectiveFormerInputPacket
2. local prompt contract text
3. future CodexPerspectiveCandidateDraft
4. local validation/normalization
5. candidate-compatible review material

The prompt contract is local copy/instruction material only. It is not model
execution and it does not create accepted Perspective state.

## Builder

`buildCodexPerspectiveFormerDraftPromptFromInputPacket(input)` returns copyable
prompt text from a sanitized `CodexPerspectiveFormerInputPacket`.

`buildCodexPerspectiveFormerDraftPromptContractFromInputPacket(input)` returns
the structured contract plus the same copyable prompt text.

`evaluateCodexPerspectiveCandidateDraftPromptContractFit(input)` is a local
review helper for static fixtures. It can identify prompt-contract weaknesses
such as plain-summary thesis text, missing usefulness qualification,
overconfident basis quality, non-pointer refs, missing user/Core questions,
unsafe material, or authority claims. It does not replace
`validateAndNormalizeCodexPerspectiveCandidateDraft`.

## Contract Behavior

The prompt names role `codex_perspective_former` and instructs a future model to
produce one `CodexPerspectiveCandidateDraft` JSON object.

The prompt requires:

- neutral perspective, not a plain PR summary;
- a thesis focused on validation boundary, unresolved tension, scope, risk, or
  next smallest useful work;
- an explicit usefulness statement in the thesis or qualification notes;
- pointer-only refs from the former input packet;
- bounded selected material only;
- `basis_quality_suggestion` with concrete reasons;
- useful unresolved tensions when gaps exist;
- useful next action candidates;
- user/Core decision questions when judgment is needed;
- all authority flags false;
- output as draft/review material only.

The prompt distinguishes plain PR summary from neutral perspective thesis,
unresolved tensions, validation gaps, next smallest useful work, user/Core
decision questions, and blocked/needs_review/ready basis quality.

## Privacy And Authority

The prompt permits only bounded summaries and pointer refs from the former input
packet. It forbids inventing raw diffs, raw review data, raw source data,
hidden reasoning, private material, provider material, token material, billing
material, credentials, or sensitive values.

The prompt forbids proof/evidence/readiness record creation, approval, merge,
publish, retry, replay, deploy, GitHub mutation, Codex execution, Codex SDK
calls, provider/model/API calls, and Core decisions.

If the input packet is insufficient, the prompt directs the future draft toward
`needs_review` or `blocked` material with visible reasons instead of confident
ready material. If no useful neutral perspective beyond summary can be formed,
the draft must say so in qualification notes and set basis quality accordingly.

## Reuse

Reused:

- `buildCodexPerspectiveFormerInputPacket`
- `CodexPerspectiveFormerInputPacketV0`
- `CodexPerspectiveCandidateDraftV0`
- `validateAndNormalizeCodexPerspectiveCandidateDraft`
- PR #478 dogfood findings
- Worker-Facing Guidance only as downstream context
- existing unsafe marker and false-authority boundary patterns

Intentionally not reused:

- Worker-Facing Guidance prompt/copy was not reused as former instructions
  because it is a downstream consumer, not the model-shaped draft contract.
- `CodexPerspectiveCandidateDraftV0` was not expanded with a new
  usefulness-claim field in this PR. The contract uses thesis and
  qualification notes to keep the v0.1 schema stable.
- Runtime routes, UI, DB writers, provider/model calls, Codex SDK integration,
  proof/evidence/readiness writers, and GitHub automation are outside scope.

## Conclusion

Expected conclusion: PASS with follow-up.

Implemented follow-up:

Add manual Codex former draft copy packet

Recommended next implementation PR title:

Dogfood manual Codex former draft copy packet with a real Codex response transcript
