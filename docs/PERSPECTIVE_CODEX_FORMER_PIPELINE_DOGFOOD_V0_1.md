# Perspective Codex Former Pipeline Dogfood v0.1

This document describes the first usefulness-oriented deterministic local
dogfood after PR #477 established the Codex perspective former pipeline
scaffold.

The dogfood stays pure local. It uses bounded reviewed PR material and static
local model-shaped draft fixtures. It does not call Codex, execute Codex, call
the Codex SDK, call OpenAI/provider/model APIs, call GitHub APIs from
implementation, use network access in implementation behavior, write DB state,
add runtime routes, add UI, create proof/evidence/readiness records, approve,
merge, publish, retry, replay, deploy, or make Core decisions.

## Pipeline Exercised

The dogfood runs:

1. Perspective Formation Input Bundle
2. CodexPerspectiveFormerInputPacket
3. static local model-shaped draft fixture
4. validateAndNormalizeCodexPerspectiveCandidateDraft(input)
5. Perspective Candidate-compatible review material
6. optional Worker-Facing Perspective Guidance

The model-shaped draft fixture is draft/review material only. It is not accepted
candidate state, proof, evidence, readiness, approval, merge authority, GitHub
mutation, Codex execution, or a Core decision.

## Reviewed PR Material

Primary reviewed material:

- PR #477, which added the pure local former pipeline scaffold and malformed
  model-shaped draft runtime-shape review fix.

Contrast context:

- PR #476, which refined Worker-Facing Perspective Guidance action specificity
  and pivoted the next direction toward the Codex perspective former pipeline.

The dogfood includes only bounded summaries and refs: source PR refs, changed
file lists, validation command summaries, skipped-check reasons, review/fix
summaries, authority boundary summaries, and document/report refs.

## Scenarios

`reviewed_pr_477_ready_draft`

Builds a Formation Input Bundle for reviewed PR #477, constructs a
CodexPerspectiveFormerInputPacket, authors a static local model-shaped draft
fixture, validates/normalizes it into candidate-compatible review material, and
feeds it into Worker-Facing Perspective Guidance.

Expected result: ready for review, pointer-only refs preserved, safe thesis and
selected material preserved, basis quality preserved, user/Core questions
preserved, Worker-Facing Guidance advisory-only, and all authority flags false.

`reviewed_pr_476_context_contrast`

Uses PR #476 as downstream guidance/action-specificity context. The goal is to
show that prior worker-guidance work can inform the former pipeline without
becoming runtime execution, proof, evidence, readiness, or approval authority.

Expected result: qualified needs-review candidate-compatible material that
preserves the context boundary and remains non-committed review material.

`malformed_or_authority_regression_case`

Uses a malformed and authority-claiming local model-shaped draft fixture.

Expected result: blocked validation, no thrown exception, no
candidate-compatible review material, concrete blocked reasons, unsafe output
details omitted, and all authority flags false.

## Evaluation Questions

The dogfood report answers:

- Did the model-shaped draft add neutral perspective beyond a plain PR summary?
- Did validation preserve useful thesis, tensions, basis quality, and next
  action candidates?
- Did Worker-Facing Guidance become more concrete after consuming the validated
  candidate?
- Did the pipeline distinguish ready material from needs-review or blocked
  material?
- Did the process keep model-shaped output as draft/review material, not
  accepted state?

## Conclusion

Expected conclusion: PASS with follow-up.

The likely next implementation PR is:

Refine Codex perspective former draft prompt contract from dogfood findings

## Boundaries

This dogfood does not implement runtime routes, does not implement UI, does not
implement DB schema, does not implement persistence, does not implement
provider/model/API calls, does not implement Codex SDK/plugin integration, does
not execute Codex, does not mutate GitHub from implementation, does not write
proof/evidence/readiness, and does not make Core decisions.
