# Perspective Codex Former Refined Findings Contract v0.1

## Summary

This follow-up to PR #486 refines the Codex former prompt contract and
deterministic contract-fit evaluator around the two remaining refined transcript
findings:

- the PR #486 thesis was useful but still warned `plain_summary`;
- unresolved_tensions used canonical object shape but non-local `tension_kind`
  values.

Conclusion: PASS with follow-up.

## What PR #486 Found

PR #486 showed that the old PR #483 alias drift was largely fixed. The refined
post-PR #485 transcript emitted canonical selected material, evidence pointers,
authority and privacy flags, user/Core questions, and next-action shape.

Direct local validation produced candidate-compatible review material without
PR #484 schema alignment, and Worker-Facing Guidance ran advisory-only on the
direct candidate.

## Refined Findings Addressed

The prompt now says that the thesis must name the validation boundary,
unresolved tension, scope/risk tradeoff, remaining gap, or next smallest useful
work first. It also says not to merely list PR chronology, and that PR facts
must support the boundary rather than replace it.

The evaluator now recognizes a boundary-focused thesis even when it mentions PR
refs. It still warns `plain_summary` for a thesis that only narrates PR
chronology.

## Tension-Kind Contract

Future Codex former drafts should emit only these local
`unresolved_tensions[].tension_kind` values:

- `unresolved_gap`
- `readiness_reason`
- `failed_check`
- `skipped_check_missing_reason`

Discouraged PR #486 drift values are mapped conceptually as:

- `validation_gap` -> `unresolved_gap`
- `schema_drift_risk` -> `unresolved_gap` or `readiness_reason`
- `readiness_boundary` -> `readiness_reason`

Missing validation/check results should use `skipped_check_missing_reason` when
tied to a skipped check with a missing or weak reason. Failed validation/check
results should use `failed_check`.

## PR #486 Replay

PR #486 replay now improves at contract-fit level: the useful thesis no longer
warns `plain_summary`.

The replay still records `tension_kind` semantic drift for the historical values
`validation_gap`, `schema_drift_risk`, and `readiness_boundary`. Direct
validation still produces candidate-compatible review material, and alignment
is not required for that candidate material.

PR #484 alignment remains available as a safety net. This work does not remove
alignment, make it the main success path, or weaken strict validation.

## Browser/Computer-Use Validation

Not run: this PR is pure local prompt-contract/evaluator/docs/report/smoke/
package work and adds no UI, route, browser-visible surface, clipboard
automation, interactive copy control, or transcript capture.

## Authority Boundary

This PR is a pure local prompt-contract/evaluator/docs/report/smoke slice. It
does not capture a new transcript, call Codex from implementation, execute
Codex from Augnes, call the Codex SDK, call OpenAI/provider/model APIs from
implementation, call GitHub APIs from implementation, use network access in
implementation behavior, write DB state, add runtime routes, add UI, add
clipboard automation, create proof/evidence/readiness records, approve, merge,
publish, retry, replay, deploy, or make Core decisions.

## Verification

- npm run typecheck
- npm run dogfood:perspective-codex-former-refined-findings-contract
- npm run smoke:perspective-codex-former-refined-findings-contract
- npm run dogfood:perspective-codex-former-refined-prompt-real-transcript
- npm run smoke:perspective-codex-former-refined-prompt-real-transcript
- npm run smoke:perspective-codex-former-prompt-contract
- npm run smoke:perspective-codex-former-manual-copy-packet
- npm run dogfood:perspective-codex-former-prompt-contract-canonical-schema
- npm run smoke:perspective-codex-former-prompt-contract-canonical-schema
- npm run dogfood:perspective-codex-former-draft-schema-alignment
- npm run smoke:perspective-codex-former-draft-schema-alignment
- npm run dogfood:perspective-codex-former-manual-copy-real-transcript
- npm run smoke:perspective-codex-former-manual-copy-real-transcript
- npm run smoke:perspective-codex-former-real-transcript-capture-instructions
- npm run dogfood:perspective-codex-former-manual-copy-transcript
- npm run smoke:perspective-codex-former-manual-copy-transcript
- npm run smoke:perspective-codex-former-pipeline
- npm run smoke:perspective-worker-facing-guidance
- npm run smoke:perspective-candidate-builder-fixture
- npm run smoke:perspective-codex-former-pipeline-dogfood
- git diff --check
- git diff --cached --check

## Follow-Up

Dogfood refined Codex former prompt contract with a second captured transcript.
