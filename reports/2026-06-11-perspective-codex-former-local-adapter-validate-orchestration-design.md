# Perspective Codex Former Local Adapter Validate Orchestration Design

## Summary

This PR adds a design-only contract for future local Codex adapter validate orchestration mode.

Validate orchestration is defined as one local review-only operation: consume exactly one returned Codex candidate envelope from the prepared prompt/manual copy packet flow, verify provenance and schema against source input plus prepare execution summary metadata, and emit a bounded local validation summary contract.

It does not implement validate execution, add UI, create accepted state, create review decisions, persist state, call Codex, call provider/model APIs, call GitHub, use DB/network behavior, mutate runtime fixtures, export surfaces, automate clipboard, or promote anything automatically.

Local validation is not a review decision.

## Why Follows PR #521

PR #521 completed the read-only local Codex adapter snapshot fixture surface hardening. With prepared/waiting surface inspection complete, the next major feature axis is the validate orchestration contract that sits after prepare execution and before any future read-only validate result snapshots.

## Design Scope

The scope is docs/report/smoke/package only.

The design covers:

- returned candidate envelope input contract;
- `candidate_count` exactly one rule;
- candidate envelope JSON shape;
- source_manual_copy_packet_id, former_input_packet_id, and prompt_hash checks;
- metadata/provenance matching against source input and prepare execution summary;
- validate dry-run command plan;
- validate execution command plan;
- validation summary schema;
- PASS, PASS with follow-up, and BLOCKED semantics;
- warning and pointer-warning handling;
- candidate-compatible review material;
- Worker-Facing Guidance connection;
- future validate result snapshots;
- future read-only validate UI;
- authority boundaries.

This PR does not run or implement validate helper execution.

## Contract Highlights

The returned envelope must come from a human after a separate user-started Codex session and must include the existing manual-copy provenance fields:

- `source_manual_copy_packet_id`;
- `source_former_input_packet_id`, checked as former_input_packet_id by the adapter;
- `source_prompt_hash`, checked as prompt_hash by the adapter.

The returned response may be a JSON object or bounded prose containing JSON, but extraction must produce exactly one `CodexPerspectiveCandidateDraft` object. `candidate_count` of zero, more than one, unknown, or unparsable is `BLOCKED`.

The future adapter must match the envelope and extracted candidate against source input, helper metadata, and prepare execution summary. Candidate text alone is never enough provenance.

## Result State Semantics

`PASS` means local provenance, schema, direct validation, candidate compatibility, authority flags, unsafe-material checks, and guidance checks passed with no warnings. `PASS` is not approval, acceptance, mergeability, product readiness, Core decision, review decision, persistence permission, surface export permission, or automatic promotion.

`PASS with follow-up` means candidate-compatible review material exists, but warnings, pointer warnings, needs-review basis quality, or minor review work remains. It remains review material only.

`BLOCKED` means validation could not safely produce candidate-compatible review material or a hard provenance/schema/privacy/authority check failed. It is a validation result with useful findings, not an automated product decision.

## Validation Summary Contract

The future summary version is `codex_former_local_adapter_validate_summary.v0.1`.

The future mode is `validate-orchestration`.

The summary records source input hash, prepare execution summary hash, helper metadata hash, returned envelope hash, candidate_count, result state, provenance status, metadata match status, source_manual_copy_packet_id match, former_input_packet_id match, prompt_hash match, contract-fit status, direct-validation status, candidate-compatible review material status, alignment safety-net status, Worker-Facing Guidance status, warnings, pointer warnings, blocked reasons, next safe action, and authority flags.

The validation summary is review-only. Returned candidate content must not be treated as trusted runtime state.

Local validation is not a review decision, and validation output must not create review decision records.

## Dry-Run and Execution Boundaries

Future dry-run should load local files, compute hashes, verify provenance fields, check whether exactly one candidate would be extracted, report planned validation steps, and report Worker-Facing Guidance eligibility. It should not run validate execution or call external systems.

Future execution should repeat dry-run checks from current files, extract exactly one candidate, run existing local contract-fit and direct validation routines, run schema alignment only as a safety-net comparison, run Worker-Facing Guidance only after candidate-compatible review material exists, and write a bounded validation summary.

`--dry-run` and `--execute` must be distinct and mutually exclusive. Neither mode may call Codex, provider/model APIs, GitHub, network, DB, browser capture, clipboard, or Core systems.

## Warning And Pointer-Warning Handling

Warnings remain first-class review material. Non-blocking warnings can produce `PASS with follow-up`; blocking warnings produce `BLOCKED`.

Pointer warnings must preserve pointer-only semantics. Pointer targets are not trusted, loaded as authority, converted into proof, or used to create acceptance/readiness records. Pointer warnings can remain visible in `PASS with follow-up` or block validation when they break reviewability or safety.

## Worker-Facing Guidance Connection

Worker-Facing Guidance may run only after direct validation produces candidate-compatible review material.

It remains advisory-only. If candidate-compatible review material is absent, guidance is skipped with an explicit skipped reason.

## Future Snapshot And UI Path

Future validate result snapshots may adapt validation summary fields into read-only Session Panel, Capture Review Inbox, or Constellation-style inspection states. Snapshot inputs must remain bounded summary metadata and hashes, not raw returned candidate content as trusted runtime state.

Future read-only validate UI may show provenance checks, candidate count, warnings, pointer warnings, Worker-Facing Guidance status, and authority flags. The UI must remain read-only until a later accepted-state/persistence design exists.

## Authority Boundary

The design preserves:

- no accepted state;
- no review decision;
- no DB;
- no network;
- no provider/model API;
- no Codex call;
- no Codex SDK;
- no GitHub mutation;
- no Core decision;
- no proof/evidence/readiness records;
- no persistence;
- no surface export;
- no clipboard automation;
- no runtime fixture mutation;
- no automatic promotion.

## Verification

Passed:

- `npm run typecheck`
- `npm run smoke:perspective-codex-former-local-adapter-validate-orchestration-design`
- `git diff --check`
- `git diff --cached --check`

## Skipped Checks With Reasons

Browser/computer-use validation is skipped because this PR adds no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture.

Validate helper execution is skipped because this PR is design/docs/report/smoke/package only and must not implement or run validate helper execution.

Codex/provider/model/GitHub/network/DB behavior checks are skipped because no app code for those surfaces is added and those behaviors are explicitly denied by the design.

## Recommended Next PR

Implement local Codex adapter validate orchestration dry-run only.

## What Codex Did Not Do

Codex did not implement validate execution, run validate helper execution, add UI/routes/browser-visible surfaces, call Codex, use Codex SDK, call provider/model APIs, call GitHub APIs, use network behavior, write DB state, create accepted state, create review decision records, create proof/evidence/readiness records, persist validation state, export surfaces, automate clipboard, mutate runtime fixtures, automatically promote material, approve, merge, deploy, or make Core decisions.
