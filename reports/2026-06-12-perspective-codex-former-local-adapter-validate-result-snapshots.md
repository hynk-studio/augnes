# Local Codex Adapter Validate Result Snapshots Report

Date: 2026-06-12

## Summary

This PR prepares local-only validate result snapshots after merged PR #524. It consumes the committed validate execution summary fixtures for `PASS`, `PASS with follow-up`, and `BLOCKED`, then projects them into deterministic read-only fixtures for future Session Panel, Capture Review Inbox, and read-only validate result UI surfaces.

The generator command is:

```bash
npm run perspective:codex-former:local-adapter:validate-result-snapshots -- --pass-summary reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass.json --pass-with-follow-up-summary reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass-with-follow-up.json --blocked-summary reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-blocked.json --out-dir /tmp/augnes-codex-former-local-adapter-validate-result-snapshots --generated-at 2026-06-12T00:00:00.000Z
```

## What Validate Result Snapshots Are

Validate result snapshots are bounded local JSON fixtures derived from validation summaries. They are review-only snapshot material for later rendering work. The snapshot set includes three Session Panel snapshots, three Capture Review Inbox items, and one snapshot summary.

They expose compact fields such as result state, status label, caveat, counts, validation summary path and hash, source/provenance hashes, worker-facing guidance status, authority tags, safe local refs, and false authority flags.

## What They Are Not

This PR does not add UI, routes, browser-visible surfaces, DB writes, persistence, accepted Augnes state, review decisions, proof/evidence/readiness records, GitHub mutation, provider/model API calls, Codex calls, Codex SDK calls, network calls, clipboard automation, runtime fixture mutation, surface export, automatic promotion, approval, merge, deploy, or Core decisions.

Returned candidate content remains untrusted material already bounded by the PR #524 validation summary. Snapshot generation does not treat returned candidate content as trusted runtime state.

## Snapshot Fixtures

Committed fixtures:

- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-pass-with-follow-up.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-session-panel-snapshot-blocked.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-pass-with-follow-up.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-inbox-item-blocked.json`
- `reports/fixtures/2026-06-12-codex-former-local-adapter-validate-result-snapshot-summary.json`

Session Panel scenario ids include `validation-pass`, `validation-pass-with-follow-up`, and `validation-blocked`.

Inbox item ids include `local-adapter-validation-pass`, `local-adapter-validation-pass-with-follow-up`, and `local-adapter-validation-blocked`.

Status labels are explicit: `PASS, review-only`, `PASS with follow-up, review-only`, and `BLOCKED, review-only finding`.

## Result Semantics

`PASS` is review-only and not approval. It does not mean acceptance, mergeability, product readiness, review decision, persistence permission, surface export permission, runtime mutation permission, Core decision, automatic promotion, or trusted runtime state.

`PASS with follow-up` is review-only and not acceptance. It remains review material only and requires human review of follow-up pressure before any later accepted-state or persistence design could act.

`BLOCKED` is a validation result, not automated rejection. It is not a product decision, rejection record, retry command, regeneration command, promotion, persistence write, runtime mutation, or review decision.

PASS with follow-up is review-only and not acceptance. BLOCKED is a validation result, not automated rejection.

## Reviewability Mapping

The snapshot reviewability mapping is:

- `PASS` -> `reviewable`
- `PASS with follow-up` -> `reviewable_with_follow_up`
- `BLOCKED` -> `blocked`

`reviewable` does not mean accepted, approved, persisted, product-ready, mergeable, or Core-decided.

## Snapshot Summary

The summary fixture includes `summary_version`, `mode: validate-result-snapshots`, `generated_at`, input summary paths and hashes, emitted snapshot paths and hashes, covered result states, covered surfaces, candidate counts, warning counts, blocked reason counts, authority boundary, future UI path, and the browser validation requirement for the later UI PR.

Covered surfaces are Session Panel, Capture Review Inbox, and future read-only validate result UI. The future UI path is declared, but no UI is implemented in this PR.

## Rejection Coverage

The builder and CLI reject unsupported validate summary versions, unsupported modes, missing or invalid JSON, unknown result states, candidate count mismatches, unsafe `PASS` summaries with blocked reasons, missing candidate-compatible review material, `PASS` authority drift, non-advisory Worker-Facing Guidance, `PASS with follow-up` without review material, `BLOCKED` review candidate availability claims, authority flag drift, trusted-runtime-state drift, non-review-only candidate material, direct-success alignment drift, output path collisions, and unsafe private/provider/token/browser/source/candidate markers in public snapshots.

Authority drift includes accepted state, review decision, proof/evidence/readiness, persistence, surface export, DB, network, provider/model, Codex, Codex SDK, GitHub, clipboard, runtime fixture mutation, automatic promotion, validate helper execution, and Core authority.

## Smoke Coverage

The smoke verifies:

- package script registration;
- required docs, report, builder, CLI, smoke, and fixture files;
- deterministic generation to `/tmp/augnes-codex-former-local-adapter-validate-result-snapshots`;
- byte-for-byte comparison between generated outputs and committed fixtures;
- all `PASS`, `PASS with follow-up`, and `BLOCKED` snapshots are generated;
- Session Panel scenario ids, inbox item ids, and explicit status labels;
- reviewability mapping and its authority boundary;
- snapshot summary inputs, outputs, hashes, covered states, covered surfaces, future UI path, and browser validation requirement;
- rejection cases for unsupported versions, unsupported modes, unknown states, candidate count issues, authority drift, trusted-state drift, review-only drift, alignment drift, and output collisions;
- raw unsafe/private/provider/token/browser dump marker absence in public docs/report/fixtures;
- changed-file boundary limited to lib/scripts/docs/report/fixtures/package scope.

## Browser And Computer-Use

Browser/computer-use validation is skipped because this PR adds no UI, route, browser-visible surface, clipboard automation, browser capture, runtime fixture mutation, or product navigation behavior.

## Caveats

These snapshots are deterministic local fixtures, not product state. They are safe as review material only. A later UI PR must remain read-only until a separate accepted-state and persistence design exists.

## Recommended Next PR

Implement the read-only validate result fixture surface, unless this snapshot PR reveals a concrete hardening gap that should be fixed first.
