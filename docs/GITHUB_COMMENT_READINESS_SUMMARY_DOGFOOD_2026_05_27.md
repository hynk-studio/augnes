# GitHub Comment Readiness Summary Dogfood - 2026-05-27

## Summary

This local dogfood reviewed the improved `codex:github-comment-readiness` summary output after PR #247. The focus was the compact `consistency_checks` section and whether its labels let operators understand local GitHub-comment preflight state without parsing the full readiness JSON.

The represented local readiness cases were a full-chain clean case, a payload-only case where full chain was not required, a payload-only case where full chain was required, and a payload blocker visibility case. Optional Sample E was skipped because the existing readiness smoke already covers gate, preview, and grant mismatch labels, and adding another sample here would make this bounded review report noisier without changing the local review question.

This document is local dogfood review material. It is not a benchmark, not a score, not proof, not evidence, not authoritative for readiness, and not a PR quality evaluator.

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
- No readiness JSON shape change.
- No readiness validation semantic change.
- No durable perspective state.

## Dogfood samples

### Sample A: Full-chain happy path

Task/preflight shape: payload, gate, preview, and authority grant were all present for a delegated local GitHub comment preflight.

Provided local materials: explicit JSON fixtures for `codex:github-comment-payload`, `codex:actuation-gate`, `codex:actuation-preview`, and `codex:authority-grant`.

Expected `preflight_status`: `preflight_passed`.

Expected consistency summary labels: `payload_internal`, `gate_consistency`, `preview_consistency`, and `grant_consistency` each showed `checked=true ok=true warnings=none blockers=none`.

Packet output usefulness: useful. The summary gave a compact clean-chain readout without requiring a JSON scan.

Packet output friction: mixed. The summary still includes target and fingerprint fields, so the operator must ignore fields that are useful for audit but not needed for the quick chain-status question.

What summary labels helped preserve: the full-chain distinction and the fact that every local consistency check was actually checked.

What summary labels did not solve: they did not replace the JSON source data or provide a separate authority decision.

### Sample B: Payload-only, full chain not required

Task/preflight shape: only payload material was provided and `CODEX_GITHUB_COMMENT_READINESS_REQUIRE_FULL_CHAIN=false`.

Provided local materials: an explicit local payload JSON fixture only.

Expected `preflight_status`: `preflight_passed`.

Expected consistency summary labels: `payload_internal` showed `checked=true ok=true warnings=none blockers=none`; `gate_consistency`, `preview_consistency`, and `grant_consistency` each showed `checked=false ok=true` with visible missing-input warning labels.

Packet output usefulness: useful. `gate_input_missing`, `preview_input_missing`, and `authority_grant_input_missing` were visible as labels instead of only as warning counts.

Packet output friction: mixed. Operators still need to know that full-chain material was not required for this local preflight.

What summary labels helped preserve: the partial-chain distinction and the difference between a missing optional chain segment and a blocker.

What summary labels did not solve: they did not decide whether a later workflow should require full-chain material.

### Sample C: Payload-only, full chain required

Task/preflight shape: only payload material was provided and `CODEX_GITHUB_COMMENT_READINESS_REQUIRE_FULL_CHAIN=true`.

Provided local materials: an explicit local payload JSON fixture only.

Expected `preflight_status`: `needs_review`.

Expected consistency summary labels: missing gate, preview, and grant warning labels were visible, and the next step said not to post until local preflight warnings or missing chain material are resolved before any separate posting layer.

Packet output usefulness: useful. The summary explained why local review was needed without requiring the operator to inspect the JSON arrays.

Packet output friction: mixed. The operator still needs the task context to know why full chain was required for this run.

What summary labels helped preserve: the distinction between local missing-chain review and any execution authority.

What summary labels did not solve: they did not provide a replacement for operator judgment or create permission to post.

### Sample D: Payload blocker visibility

Task/preflight shape: full-chain local fixtures were provided, but the payload endpoint preview deliberately mismatched the target.

Provided local materials: explicit local payload, gate, preview, and grant JSON fixtures with `endpoint_preview_mismatch` in payload consistency.

Expected `preflight_status`: `blocked`.

Expected consistency summary labels: `payload_internal` showed `checked=true ok=false warnings=none blockers=endpoint_preview_mismatch`.

Packet output usefulness: useful. The operator could identify the specific local blocker from the summary row.

Packet output friction: mixed. If several labels accumulate, the row format may become dense.

What summary labels helped preserve: the blocker source and label without exposing the hidden comment body.

What summary labels did not solve: they did not repair the local material or infer intent beyond the existing validation semantics.

## Cross-sample findings

- Useful: consistency labels made the summary better for quick local preflight review than warning and blocker counts alone.
- Useful: the summary preserved full-chain versus partial-chain context.
- Useful: blocker labels reduced the need to open readiness JSON for the common question of which local check failed.
- Mixed: the summary remains a review surface, so operators still need task context for why full-chain material is or is not required.
- Mixed: the section could become too verbose if future checks add many labels to a single row.
- Not useful for: deciding authority, posting, UI state, sidecar state, product task selection, or PR quality.

## Readiness-summary usefulness observations

The consistency labels helped preserve the full-chain versus partial-chain distinction because `checked=true` and `checked=false` were visible per chain segment. Missing chain material warnings were easier to scan as labels than as aggregate counts.

The payload blocker label was useful because it named `endpoint_preview_mismatch` directly in the `payload_internal` row. That reduced JSON inspection for the local blocker triage question.

The local-only and no-posting boundary remained visible through `dry_run_only=true`, `would_execute=false`, `requires_separate_actuation_helper=true`, the next step, and the authority boundary text.

The summary looks useful for next-session onboarding because it gives a compact state snapshot: local material present, chain segments checked or missing, and blocker or warning labels.

The summary continued to distinguish preflight material from execution authority. `preflight_passed` should remain a local preflight status only and must not be rendered as permission or execution readiness.

## Development feedback

- Consistency labels are more useful than warning and blocker counts alone.
- Payload-only preflight can be clear when full chain is not required.
- Full-chain-required `needs_review` is easier to explain with labels.
- Blocker labels reduce JSON inspection.
- Summary output may become noisy if too many labels accumulate.
- Exact summary assertions downstream may need to tolerate the new section.
- JSON remains the source of truth.

## UI/UX implications

This dogfood does not design a UI.

Consistency checks could become future status rows or cards. Warning and blocker labels should remain local preflight review labels. `preflight_passed` must not be rendered as permission or execution readiness. Command preview and readiness material should remain review-only surfaces.

## Sidecar e_t / perspective research implications

This dogfood does not implement sidecar e_t.

Consistency labels may become candidate perspective signals. The full-chain versus partial-chain distinction may be useful as a temporal handoff signal. Blocker labels may be more useful than free-form summaries for future research. Durable perspective schema remains out of scope.

## Recommended next decision

Dogfood this readiness summary on one more real GitHub-comment helper handoff before UI, sidecar, or actuation work.
