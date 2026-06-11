# Perspective Codex Former Local Adapter Source Input Preflight Hardening v0.1

## Purpose

This document defines the local Codex adapter source-input preflight hardening added after the first Manifest-to-source-input adapter mode.

The hardening keeps the adapter local-only, deterministic, review-only, and non-authorizing while making CLI parsing, manifest validation, source-input preflight validation, diagnostics, path handling, and preflight summary output stricter.

## Why Follows PR #509

PR #509 implemented the first narrow local adapter mode: Manifest-to-source-input.

That mode converted a bounded adapter manifest into helper-compatible source input. This follow-up hardens the path around option handling and adds local source-input preflight validation before an operator runs the existing capture helper.

## Hardening Scope

This PR changes only:

- the local adapter pure module;
- the existing local adapter CLI script;
- smoke coverage;
- this hardening doc;
- the hardening report;
- package script registration.

It does not modify app routes, components, CSS, existing capture helper behavior, Session Panel behavior, Capture Review Inbox behavior, Constellation Preview behavior, preview data adapter behavior, projection builder behavior, DB schema, provider/model integration, Codex SDK integration, or GitHub mutation code.

## CLI Option Value Hardening

The CLI now treats these options as value-required flags:

- `--manifest`
- `--out-dir`
- `--generated-at`
- `--source-input-out`
- `--metadata-out`
- `--summary-out`
- `--preflight-source-input`

The parser rejects:

- missing option values;
- empty option values;
- unknown options;
- unexpected positional arguments;
- duplicate singleton options.

Diagnostics name the option and avoid printing unsafe raw values.

## Unknown Manifest Field Policy

The v0.1 manifest policy is strict.

Unknown top-level manifest fields are rejected. Unknown fields inside `tests_checks_run`, `skipped_checks`, `unresolved_gaps`, and `readiness` are also rejected.

Allowed top-level fields remain:

- `adapter_manifest_version`
- `adapter_source_kind`
- `generated_at`
- `scope`
- `work_id`
- `work_session_label`
- `codex_surface_label`
- `source_pr_refs`
- `changed_files`
- `changed_files_summary`
- `tests_checks_run`
- `skipped_checks`
- `unresolved_gaps`
- `readiness`
- `operator_notes_bounded`
- `existing_helper_metadata_path`
- `returned_envelope_path`
- `validation_summary_path`

The strict policy prevents the v0.1 adapter from becoming an unbounded manifest passthrough.

## Source Input Preflight Validation

The adapter now exports a pure source-input preflight validator:

- `validateCodexFormerLocalAdapterSourceInput`
- `assertCodexFormerLocalAdapterSourceInput`
- `buildCodexFormerLocalAdapterSourceInputPreflightSummary`

Preflight validates the adapter-emitted helper-compatible subset:

- JSON object shape;
- `generated_at`, `scope`, and `work_id`;
- non-empty `source_pr_refs`;
- non-empty safe relative `changed_files`;
- bounded `changed_files_summary`;
- `tests_checks_run` with only `passed` or `failed` statuses;
- `skipped_checks`;
- `unresolved_gaps`;
- `readiness`;
- optional `source_privacy_redaction_notes`;
- optional `authority_boundaries`;
- strict unknown top-level field rejection;
- unsafe/private/raw/provider/credential marker category rejection.

The preflight validator does not call the prepare helper.

## Preflight CLI Usage

The existing local adapter CLI supports a preflight-only mode:

```bash
npm run perspective:codex-former:local-adapter:source-input -- --preflight-source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --summary-out /tmp/augnes-codex-former-local-adapter-preflight-summary.json
```

Preflight-only mode:

- does not require `--manifest`;
- does not require `--out-dir`;
- does not write source input JSON;
- does not write adapter metadata JSON;
- may write a deterministic preflight summary when `--summary-out` is supplied.

The CLI prints:

- `mode=source-input-preflight`
- `source_input_path`
- `source_input_hash`
- `preflight_status`
- `authority_boundary=review-only local-only non-authorizing`

## Preflight Summary

When `--summary-out` is supplied, preflight writes deterministic JSON with:

- `preflight_summary_version`
- `mode`
- `generated_at`
- `source_input_path`
- `source_input_hash`
- `status`
- `errors`
- `warning_count`
- false authority flags

If validation fails and writing the summary is safe, the summary records `status: failed` and bounded error strings without unsafe raw values.

## Diagnostics

Diagnostics now include field paths and remain deterministic.

Examples:

- `manifest.tests_checks_run[0].status is unsupported`
- `manifest.changed_files[1] must be a safe relative file path`
- `manifest.extra_field is not allowed in v0.1`
- `source_input.tests_checks_run[0].status must be passed or failed`
- `source_input.extra_field is not allowed in v0.1`
- `unsafe marker category found at manifest.operator_notes_bounded`

Diagnostics group multiple errors where practical and do not print full unsafe values.

## Path Handling

Path handling now rejects ambiguous or unsafe output targets:

- `--out-dir` may create a directory;
- explicit output paths may create parent directories;
- explicit output paths must not point to directories;
- `--source-input-out` and `--metadata-out` must be distinct;
- `--summary-out` must be distinct from source input and metadata outputs;
- preflight summary output must be distinct from the preflight source input file.

Default generated file names remain fixed and do not include path traversal.

## generated_at / Hash Behavior

Manifest conversion keeps PR #509 hash behavior:

- `manifest_hash` hashes original manifest file bytes;
- `source_input_hash` hashes emitted source input bytes;
- `--generated-at` changes emitted source input and therefore `source_input_hash`;
- `--generated-at` does not change `manifest_hash`.

Source-input preflight hashes the preflighted source input file bytes exactly as supplied.

## Fixture Impact

The existing valid manifest and expected source input fixtures remain stable.

No fixture JSON from PR #500 or PR #501 was changed.

## Capture Helper Compatibility

The smoke continues to run the existing capture helper in prepare mode against adapter-emitted source input to prove compatibility.

That smoke invocation is verification only. The normal local adapter CLI does not run prepare or validate helpers as normal CLI behavior.

## Privacy / Redaction Boundary

The adapter remains bounded-summary only.

It does not emit raw diffs, raw logs, raw transcripts, raw provider logs, raw candidate payloads outside the returned-envelope path concept, private account material, credentials, screenshots, browser dumps, or omitted unsafe fields.

Public docs and reports use sanitized descriptions rather than echoing raw unsafe/private marker literals.

## Authority Boundary

This implementation does not call Codex, does not integrate Codex SDK, does not call provider/model APIs, does not call GitHub APIs, does not write DB records, does not persist accepted state, does not create proof/evidence/readiness records, does not create review decisions, does not add accept/promote/reject actions, does not run prepare or validate helpers as normal CLI behavior, does not add UI/routes/browser surface, does not automate clipboard, does not add prepare orchestration, does not add validate orchestration, does not add surface export, does not approve, merge, deploy, make Core decisions, capture live Codex sessions, or mutate runtime fixtures.

## What This Does Not Do

This implementation does not:

- call Codex;
- integrate Codex SDK;
- call provider/model APIs;
- call GitHub APIs;
- call network;
- write DB records;
- persist accepted state;
- create proof/evidence/readiness records;
- create review decisions;
- add accept/promote/reject actions;
- run prepare or validate helpers as normal CLI behavior;
- add UI/routes/browser surface;
- automate clipboard;
- add prepare orchestration;
- add validate orchestration;
- add surface export.

## Future Work

Future work remains separate:

- Adapter fixture snapshots for Session Panel and Inbox states
- Prepare orchestration mode
- Validate orchestration mode
- Surface export mode

## Recommended Next PR

Add local Codex adapter fixture snapshots for Session Panel and Inbox states.

## Conclusion

PASS with follow-up
