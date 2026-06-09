# Perspective Codex Former Pipeline Dogfood

## Summary

Conclusion: PASS with follow-up

This deterministic local dogfood uses bounded reviewed PR material from PR #477 and PR #476. It exercises the local former pipeline with static model-shaped draft fixtures and does not call Codex or any provider.

## Reviewed PR Material Used

- pr:hynk-studio/augnes#477
- pr:hynk-studio/augnes#476

Material included only source PR refs, changed-file lists, validation command summaries, skipped-check reasons, review/fix summaries, authority boundary summaries, and document/report refs.

## Pipeline Exercised

- buildPerspectiveFormationInputBundle
- buildCodexPerspectiveFormerInputPacket
- static local CodexPerspectiveCandidateDraft fixture
- validateAndNormalizeCodexPerspectiveCandidateDraft
- Perspective Candidate-compatible review material
- buildWorkerFacingPerspectiveGuidanceFromCandidate

## Validation Commands

- npm run typecheck
- npm run dogfood:perspective-codex-former-pipeline
- npm run smoke:perspective-codex-former-pipeline-dogfood
- npm run smoke:perspective-codex-former-pipeline
- npm run smoke:perspective-worker-facing-guidance
- npm run smoke:perspective-candidate-builder-fixture
- git diff --check
- git diff --cached --check

## Usefulness Evaluation

- neutral_perspective_beyond_plain_summary: yes
  The ready draft frames PR #477 around validation boundaries and malformed draft blocking, which is more useful than a plain changed-file summary.
- validation_preserved_useful_candidate_material: yes
  Safe thesis, selected material, pointer-only refs, basis quality, and user/Core questions survived normalization.
- worker_guidance_more_concrete: yes
  Guidance converted the validated candidate into advisory next actions around prompt-contract refinement while preserving false authority.
- distinguished_ready_needs_review_blocked: yes
  PR #477 validated as ready for review, PR #476 remained qualified context, and malformed/authority output blocked.
- model_output_remained_draft_review_material: yes
  The model-shaped fixture never became accepted state, proof, evidence, readiness, approval, merge authority, execution, or Core decision.

## Missing Validation, Redaction, Shape, Or Authority Checks

- No missing shape, unsafe-material, redaction, or authority checks were found in this dogfood.

Useful enough to continue: true

Recommended next implementation PR title: Refine Codex perspective former draft prompt contract from dogfood findings

## Scenario Conclusions

- reviewed_pr_477_ready_draft: PASS
- reviewed_pr_476_context_contrast: PASS with follow-up
- malformed_or_authority_regression_case: PASS

## Reviewed PR #477 Ready Draft

Scenario id: reviewed_pr_477_ready_draft
Conclusion: PASS
Draft fixture: static local model-shaped draft fixture
Validation status: ready_for_review

### Formation Input

- Source PR refs: pr:hynk-studio/augnes#477
- Changed files: 8
- Readiness: ready_for_candidate
- Changed-files summary: Added the pure local Codex perspective former input packet, model-shaped draft validator, candidate-compatible normalization path, docs, report, package script, and malformed-draft runtime-shape review fix.

### Former Input Packet

- Role: codex_perspective_former
- Pointer refs: 7
- Output is draft only: true

### Validation Result

- Status: ready_for_review
- Candidate review material present: true
- Privacy raw payloads included: false
- Authority flags all false: true

Blocked reasons:
- None

Warnings:
- None

### Candidate-Compatible Review Material

- Candidate authority: non_committed
- Basis quality: sufficient_for_review
- Thesis: PR #477 is not just a local scaffold; its useful perspective is that a former draft becomes valuable only when malformed, unsafe, and authority-claiming model-shaped output is blocked before candidate-compatible review material exists.
- Evidence pointer refs: 7
- Unresolved tensions: 0
- User/Core questions: 1
- Authority flags all false: true

Next action candidates:
- review_candidate: Review the non-committed Codex-formed Perspective material.
- prepare_codex_handoff: Use this dogfood finding to refine the future former draft prompt contract before any manual copy packet.

### Worker-Facing Guidance Compatibility

- Guidance status: actionable_advisory
- Advisory only: true
- Authority flags all false: true
- Work goal: Use PR #477 dogfood output to decide the next narrow local prompt-contract refinement.

Next smallest useful actions:
- inspect_source_candidate_refs: Inspect work PR-477-codex-former-pipeline-scaffold and PR pr:hynk-studio/augnes#477 and 8 selected file(s) before proposing work.
- draft_smallest_scoped_plan: Draft the smallest useful scoped plan for Use PR #477 dogfood output to decide the next narrow local prompt-contract refinement. using docs/PERSPECTIVE_CODEX_FORMER_PIPELINE_V0_1.md, lib/perspective-ingest/perspective-codex-candidate-draft-pipeline.ts, lib/perspective-ingest/perspective-codex-former-input-packet.ts, plus 5 more file(s).
- carry_forward_verification_gaps: 3 verification gap(s): skipped_check via check:browser, check:db, check:network-api must stay visible and cannot be converted into proof or readiness.

Dogfood notes:
- The draft adds a neutral usefulness frame around why shape, unsafe-material, and authority validation matter.
- The output remains non-committed review material.

## Reviewed PR #476 Context Contrast

Scenario id: reviewed_pr_476_context_contrast
Conclusion: PASS with follow-up
Draft fixture: static local model-shaped draft fixture
Validation status: needs_review

### Formation Input

- Source PR refs: pr:hynk-studio/augnes#476
- Changed files: 10
- Readiness: ready_for_candidate
- Changed-files summary: Refined worker-facing guidance action specificity and pivoted the next direction toward the Codex perspective former pipeline.

### Former Input Packet

- Role: codex_perspective_former
- Pointer refs: 6
- Output is draft only: true

### Validation Result

- Status: needs_review
- Candidate review material present: true
- Privacy raw payloads included: false
- Authority flags all false: true

Blocked reasons:
- None

Warnings:
- None

### Candidate-Compatible Review Material

- Candidate authority: non_committed
- Basis quality: needs_review
- Thesis: PR #476 is useful as contrast context because worker-guidance action specificity exposed a downstream planning need; it should inform the former pipeline without becoming runtime execution or readiness authority.
- Evidence pointer refs: 4
- Unresolved tensions: 2
- User/Core questions: 1
- Authority flags all false: true

Next action candidates:
- review_candidate: Review the non-committed Codex-formed Perspective material.
- fix_input_gaps: Keep PR #476 as bounded downstream context while evaluating PR #477 former output separately.

### Worker-Facing Guidance Compatibility

- Guidance status: resolve_gaps_first
- Advisory only: true
- Authority flags all false: true
- Work goal: Use PR #476 only as downstream guidance/action-specificity context for the former pipeline dogfood.

Next smallest useful actions:
- resolve_verification_gaps: Resolve or qualify 3 verification gap(s): skipped_check, readiness_reason via check:browser, pr:hynk-studio/augnes#476, codex-draft:qualification-note before planning implementation work for docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_DOGFOOD_V0_1.md, docs/PERSPECTIVE_WORKER_FACING_GUIDANCE_V0_1.md, lib/perspective-ingest/perspective-worker-facing-guidance.ts, plus 7 more file(s).
- preserve_unresolved_tensions: 2 unresolved tension(s): readiness_reason must remain visible in any revised candidate or later handoff.
- ask_user_decision_questions: Ask the preserved user/Core decision questions before treating work PR-476-worker-guidance-action-specificity and PR pr:hynk-studio/augnes#476 as ready for worker planning.

Dogfood notes:
- The candidate keeps PR #476 as context rather than proof or execution.
- The needs-review status is useful because it prevents context from being overpromoted.

## Malformed Or Authority Regression Case

Scenario id: malformed_or_authority_regression_case
Conclusion: PASS
Draft fixture: static local malformed model-shaped draft fixture
Validation status: blocked

### Formation Input

- Source PR refs: pr:hynk-studio/augnes#477
- Changed files: 8
- Readiness: ready_for_candidate
- Changed-files summary: Regression fixture for malformed, unsafe, and authority-claiming model-shaped draft material.

### Former Input Packet

- Role: codex_perspective_former
- Pointer refs: 5
- Output is draft only: true

### Validation Result

- Status: blocked
- Candidate review material present: false
- Privacy raw payloads included: false
- Authority flags all false: true

Blocked reasons:
- invalid draft field shape: evidence_pointer_refs must be an array
- invalid draft field shape: unresolved_tensions must be an array
- draft includes unsafe raw/private/provider/token material
- draft includes forbidden authority claims

Warnings:
- normalization (draft.evidence_pointer_refs): invalid draft field shape: evidence_pointer_refs must be an array
- normalization (draft.unresolved_tensions): invalid draft field shape: unresolved_tensions must be an array
- omitted_unsafe_material (draft): Unsafe draft details were omitted from normalization and block candidate-compatible material.
- authority_claim (draft.authority_flags.committed_state): Draft attempted to grant forbidden authority; validation forced the authority flag false.
- authority_claim (draft.authority_flags.persistence): Draft attempted to grant forbidden authority; validation forced the authority flag false.
- authority_claim (draft.authority_flags.provider_model_api_calls): Draft attempted to grant forbidden authority; validation forced the authority flag false.
- authority_claim (draft.authority_flags.proof_evidence_readiness_writes): Draft attempted to grant forbidden authority; validation forced the authority flag false.
- authority_claim (draft.authority_flags.codex_execution): Draft attempted to grant forbidden authority; validation forced the authority flag false.
- authority_claim (draft.authority_flags.github_mutation): Draft attempted to grant forbidden authority; validation forced the authority flag false.
- authority_claim (draft.authority_flags.merge_publish_approval): Draft attempted to grant forbidden authority; validation forced the authority flag false.
- authority_claim (draft.authority_flags.core_decision): Draft attempted to grant forbidden authority; validation forced the authority flag false.
- authority_claim (draft.next_action_candidates[0].summary): Draft attempted to claim forbidden approval, write, execution, mutation, or Core-decision authority.

Dogfood notes:
- The invalid draft is blocked before candidate-compatible material exists.
- The output omits unsafe draft details and preserves false authority flags.

## Authority Boundary

This dogfood is pure local only. It does not call Codex, execute Codex, call the Codex SDK, call OpenAI/provider/model APIs, call GitHub APIs from implementation, use network access in implementation behavior, write DB state, add runtime routes, add UI, create proof/evidence/readiness records, approve, merge, publish, retry, replay, deploy, or make Core decisions.
