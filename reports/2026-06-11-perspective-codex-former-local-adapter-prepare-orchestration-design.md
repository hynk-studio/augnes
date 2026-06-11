# Perspective Codex Former Local Adapter Prepare Orchestration Design

## Summary

Added a design-only contract for future local Codex adapter prepare orchestration mode.

No prepare orchestration was implemented.

## Why Follows PR #511

PR #511 added local not_ready and waiting snapshots for Session Panel and Capture Review Inbox item states.

The waiting state means source input and local preflight can be ready before the operator runs the existing prepare helper. This design defines how a future adapter mode may wrap that prepare step while preserving the manual separate Codex return and review-only boundary.

## Design Scope

This PR is docs/report/smoke/package only.

It does not add prepare orchestration implementation, CLI prepare behavior, validate orchestration, surface export, UI, routes, browser-visible surfaces, Codex calls, Codex SDK integration, provider/model calls, GitHub API calls, network calls, DB writes, persistence, clipboard automation, accepted state, proof/evidence/readiness records, review decision records, accept/promote/reject actions, approval/merge/deploy/Core decisions, live Codex capture, or runtime fixture mutation.

## Relationship to Existing Adapter Modes

Manifest-to-source-input mode produces helper-compatible source input.

Source-input preflight validates source input locally.

Surface snapshots mode shows not_ready and waiting states.

Prepare orchestration mode would be a future local wrapper around the existing capture helper prepare mode. Validate orchestration, surface integration, and review decisions remain separate future work.

## Prepare Orchestration Stages

The design defines:

- Stage A. Input readiness check
- Stage B. Prepare command construction
- Stage C. Prepare helper execution
- Stage D. Prepare output discovery
- Stage E. Adapter prepare summary
- Stage F. Surface snapshot handoff

## Inputs and Outputs

Future required inputs:

- source input path;
- source input preflight summary path;
- prepare out-dir.

Future optional inputs:

- adapter manifest path;
- generated_at override;
- expected source input hash;
- summary output path.

Future outputs may include helper prepare output directory, adapter prepare summary JSON, optional adapter prepare metadata JSON, optional updated Session Panel snapshot JSON, and optional updated Inbox item snapshot JSON.

## Prepare Summary Contract

The future prepare summary version is:

`codex_former_local_adapter_prepare_summary.v0.1`

The summary should include mode, generated timestamp, source input path/hash, preflight summary path/status, helper command summary, helper output directory, helper exit status, helper output paths, helper output hashes, next safe action, caveats, and false authority flags.

It should prefer paths and hashes over raw content.

## State Mapping to Surfaces

Source input preflight failed:

- Session Panel: not prepared / preflight failed
- Inbox: `not_ready`
- Constellation: no handoff

Preflight passed, prepare not run:

- Session Panel: waiting / prepare ready
- Inbox: waiting
- Constellation: no handoff

Prepare succeeded:

- Session Panel: prepared, waiting for separate Codex return
- Inbox: waiting
- Constellation: no handoff

Prepare failed:

- Session Panel: prepare failed / not_ready or blocked-like local caveat
- Inbox: `not_ready` or `invalid_data`
- Constellation: no handoff

Returned candidate present remains out of scope and belongs to validate orchestration design.

## Validation and Rejection Behavior

Future prepare orchestration should reject missing or invalid source input, missing or invalid preflight summary, preflight status other than passed, preflight source-input hash mismatch, missing out-dir, out-dir file targets, output path collision, unsafe paths, helper command unavailable, non-zero helper exit, missing expected helper metadata, helper output hash mismatch, unsafe bounded inputs, and any attempt to pass Codex SDK/provider/GitHub/DB/network flags.

## CLI Design

Future CLI command, design-only:

```bash
npm run perspective:codex-former:local-adapter:prepare -- --source-input <path> --preflight-summary <path> --out-dir <path> --generated-at <iso>
```

Optional flags may include `--manifest`, `--prepare-summary-out`, `--session-panel-snapshot-out`, `--inbox-item-snapshot-out`, and `--dry-run`.

Dry-run should validate inputs and print the constructed command summary without running the helper. Actual helper execution should come later after dry-run hardening.

## Browser/Computer-Use Validation Plan

Browser/computer-use validation is skipped for this PR because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

Future CLI-only prepare orchestration implementation may also skip browser validation if it does not touch UI/routes/browser-visible surfaces. UI or UI-consumed snapshot changes should consider targeted browser validation.

## Privacy/Redaction Handling

The design prefers paths and hashes over raw content.

Future implementation should use bounded stdout/stderr summaries only and include no raw diffs, raw logs, raw transcripts, provider logs, candidate payloads, credentials, tokens, cookies, private account data, screenshots, or browser dumps.

Public docs/reports do not echo raw unsafe/private marker literals.

## Authority Boundary

The design preserves no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB write, no persistence, no clipboard automation, no accepted Augnes state, no proof/evidence/readiness creation, no review decision records, no accept/promote/reject actions, no approval/merge/deploy/Core decision, no live Codex capture, no validate orchestration, no surface export, and no UI implementation in this PR.

## Verification

Passed:

- `npm run typecheck`
- `npm run smoke:perspective-codex-former-local-adapter-prepare-orchestration-design`
- `git diff --check`
- `git diff --cached --check`

Attempted upstream smokes:

- `npm run smoke:perspective-codex-former-local-adapter-source-input-preflight-hardening` failed only on its historical changed-file boundary: `source-input preflight hardening changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DESIGN_V0_1.md`.
- `npm run smoke:perspective-codex-former-local-adapter-surface-snapshots` failed only on its historical changed-file boundary: `local adapter surface snapshots changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DESIGN_V0_1.md`.

Those older guards were not widened because this PR is a later design-only stage and does not change their implementation scope.

## Skipped Checks With Reasons

Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

Prepare/validate orchestration runtime checks skipped because this PR is design-only and implements no prepare or validate orchestration.

## Recommended Next PR

Add local Codex adapter prepare orchestration dry-run implementation.

## What Codex Did Not Do

Codex did not implement prepare orchestration, add CLI prepare behavior, run the prepare helper from normal adapter code, add validate orchestration, add surface export, add UI/routes/browser surfaces, call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, add accept/promote/reject actions, approve, merge, deploy, make Core decisions, capture live Codex sessions, mutate runtime fixtures, automate clipboard, modify existing capture helper behavior, modify existing UI route/component behavior, or modify fixture JSON from PR #500, PR #501, PR #509, PR #510, or PR #511.
