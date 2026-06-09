# Perspective Codex Former Prompt Contract V0.1

Conclusion: PASS with follow-up

Implemented follow-up: Add manual Codex former draft copy packet

Recommended next implementation PR title: Dogfood manual Codex former draft copy packet with a real Codex response transcript

## Summary

This PR adds a pure local prompt-contract layer for the Codex perspective former
pipeline. It refines the contract between `CodexPerspectiveFormerInputPacket`
and future `CodexPerspectiveCandidateDraft` material without calling Codex,
executing Codex, calling provider/model APIs, writing state, adding UI, or
creating authority-bearing records.

## What PR #478 Dogfood Found

PR #478 dogfooded the pipeline on bounded reviewed PR material from PR #477 and
PR #476. It found that the static local model-shaped draft was useful enough to
continue because it added neutral validation-boundary framing beyond a plain PR
summary while remaining draft/review-only material.

The follow-up gap was prompt specificity: a future model needs explicit
instructions to produce neutral perspective, usefulness beyond summary,
pointer-only refs, basis quality, tensions, next actions, user/Core questions,
and false authority.

## Different From A PR Summary Prompt

A PR summary prompt would mainly restate changed files, review fixes, and
validation commands. The former prompt contract instead asks for a neutral
Perspective thesis that explains a validation boundary, unresolved tension,
scope/risk tradeoff, or next smallest useful work.

The contract also requires the draft to say why the perspective is useful
beyond summary or to admit that it cannot provide that usefulness from the
packet.

## Future Model Instructions

A future Codex model must follow:

- role `codex_perspective_former`;
- output one `CodexPerspectiveCandidateDraft` JSON object;
- use only bounded packet summaries and pointer refs;
- preserve pointer-only evidence semantics;
- include `basis_quality_suggestion` with reasons;
- include unresolved tensions when gaps exist;
- include next action candidates;
- include user/Core decision questions when judgment is needed;
- keep all authority flags false;
- keep output as draft/review material only.

## Authority Boundary

The prompt contract forbids proof/evidence/readiness record creation, approval,
merge, publish, retry, replay, deploy, GitHub mutation, Codex execution, Codex
SDK calls, provider/model/API calls, DB writes, runtime routes, UI, and Core
decisions.

It tells the future model not to claim checks passed unless the former input
packet provides check summaries.

## Draft Review Only

The prompt contract does not change the fact that
`CodexPerspectiveCandidateDraft` is model-shaped draft material. It remains
unaccepted until `validateAndNormalizeCodexPerspectiveCandidateDraft` produces
candidate-compatible review material.

The local contract-fit helper can flag prompt-contract weaknesses, but it does
not approve, commit, merge, or convert model output into accepted state.

## Needs Review Or Blocked Input

When the former input packet contains skipped checks, unresolved gaps, weak
verification, omitted unsafe material, or blocked readiness, the prompt directs
the future draft toward `needs_review` or `blocked` basis quality with visible
reasons rather than confident ready material.

If no useful neutral perspective beyond summary can be formed, the draft must
say so in qualification notes.

## Existing Augnes Elements Reused

- `buildCodexPerspectiveFormerInputPacket`
- `CodexPerspectiveFormerInputPacketV0`
- `CodexPerspectiveCandidateDraftV0`
- `validateAndNormalizeCodexPerspectiveCandidateDraft`
- PR #478 dogfood report findings
- Worker-Facing Guidance as downstream context only
- Existing unsafe marker and false-authority patterns

## Existing Augnes Elements Intentionally Not Reused

- Worker-Facing Guidance copy was not reused as the former prompt because it is
  downstream advisory material.
- The draft schema was not expanded with a new usefulness field. Thesis and
  qualification notes carry the usefulness requirement for this narrow PR.
- Runtime routes, UI, persistence, provider/model APIs, Codex SDK integration,
  proof/evidence/readiness writers, and GitHub automation were not reused.

## What Is Validated

The smoke validates:

- ready packet prompt text contains role, output contract, neutral perspective,
  pointer-only refs, basis quality, tensions, user/Core questions, privacy
  constraints, false authority, and draft/review-only language;
- needs-review packet prompt text directs qualified output rather than
  overconfident ready material;
- unsafe packet prompt text omits unsafe input literals while recording omitted
  unsafe material;
- a static prompt-contract-following draft validates through the existing
  pipeline into candidate-compatible review material;
- a plain-summary, overconfident, authority-claiming draft is blocked by the
  existing validator and flagged by the contract-fit helper.

## Out Of Scope

This PR does not call Codex, execute Codex, call the Codex SDK, call
OpenAI/provider/model APIs, call GitHub APIs from implementation, use network
access in implementation behavior, write DB state, add runtime routes, add UI,
create proof/evidence/readiness records, approve, merge, publish, retry, replay,
deploy, or make Core decisions.

## Verification

Validation passed:

- `npm run typecheck`
- `npm run smoke:perspective-codex-former-prompt-contract`
- `npm run smoke:perspective-codex-former-pipeline-dogfood`
- `npm run smoke:perspective-codex-former-pipeline`
- `npm run smoke:perspective-worker-facing-guidance`
- `npm run smoke:perspective-candidate-builder-fixture`
- `git diff --check`
- `git diff --cached --check`

## Skipped Checks With Concrete Reasons

- Browser validation skipped: this PR adds no runtime route, UI, or browser
  surface.
- DB validation skipped: this PR adds no DB schema, persistence path, or state
  writer.
- Provider/model validation skipped: this PR intentionally does not call Codex,
  OpenAI, provider/model APIs, or SDKs.

## Implemented Follow-Up

Add manual Codex former draft copy packet

## Next Implementation PR

Dogfood manual Codex former draft copy packet with a real Codex response transcript
