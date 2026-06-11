# Perspective Codex Former Local Adapter Manifest-to-Source-Input v0.1

## Purpose

This document records the first narrow local Codex adapter implementation mode: Manifest-to-source-input mode.

The mode reads a bounded local adapter manifest JSON and writes a bounded source input JSON compatible with:

`npm run perspective:codex-former:capture-packet -- --source-input <path>`

## Why Follows PR #508

PR #508 defined the local Codex integration adapter design and recommended the next PR: add local Codex adapter manifest-to-source-input implementation.

This implementation follows that design with only the first local mode. It does not implement source-input preflight mode, prepare orchestration mode, validate orchestration mode, surface export mode, live Codex capture, UI, routes, or runtime fixture mutation.

## Implementation Scope

Changed scope:

- pure adapter builder/validator module;
- local CLI script;
- deterministic manifest and expected source input fixtures;
- implementation doc;
- implementation report;
- smoke script;
- package scripts.

No app route, component, CSS, capture helper behavior, fixture JSON from PR #500 or PR #501, preview data adapter behavior, projection builder behavior, DB schema, provider/model integration, Codex SDK integration, or GitHub mutation code was changed.

## Manifest-to-source-input only

This PR implements only Manifest-to-source-input mode.

The mode:

- reads a bounded adapter manifest file;
- validates the manifest shape, statuses, path safety, bounded strings, and unsafe marker categories;
- writes source input JSON for the existing capture helper `--source-input` path;
- writes adapter metadata JSON with hashes, output paths, and authority flags.

It does not run the prepare helper or validate helper as part of normal CLI behavior.

## Manifest Shape

The manifest is versioned:

- `adapter_manifest_version`: `codex_former_local_adapter_manifest.v0.1`
- `adapter_source_kind`: `local_bounded_manifest`

Required fields:

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

Optional fields:

- `operator_notes_bounded`
- `existing_helper_metadata_path`
- `returned_envelope_path`
- `validation_summary_path`

Check statuses accepted by the manifest are `passed`, `failed`, `blocked`, `skipped`, and `not_run`.

The emitted helper-compatible source input keeps `passed` and `failed` check runs under `tests_checks_run`. Other manifest check statuses are converted into bounded `skipped_checks` entries so the existing helper path accepts the output without changing helper behavior.

## Source Input Output

The emitted source input includes:

- `generated_at`
- `scope`
- `work_id`
- `source_pr_refs`
- `changed_files`
- `changed_files_summary`
- `tests_checks_run`
- `skipped_checks`
- `unresolved_gaps`
- `readiness`
- `source_privacy_redaction_notes`
- `authority_boundaries`

The output is deterministic JSON with two-space formatting and a trailing newline.

## Adapter Metadata Output

The adapter writes metadata JSON beside the source input.

Metadata includes:

- `adapter_metadata_version`
- `adapter_source_kind`
- `generated_at`
- `manifest_path`
- `manifest_hash`
- `source_input_path`
- `source_input_hash`
- `manifest_work_id`
- `manifest_scope`
- `source_input_work_id`
- `source_input_scope`
- `omitted_optional_fields`
- `normalized_check_statuses`
- false authority flags

Authority flags explicitly state that accepted state, proof/evidence/readiness creation, review decisions, provider/model calls, Codex SDK calls, GitHub API calls, DB writes, clipboard automation, live Codex capture, runtime fixture mutation, and Core decisions are false.

## CLI Usage

Run:

```bash
npm run perspective:codex-former:local-adapter:source-input -- --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter --generated-at 2026-06-11T00:00:00.000Z
```

Options:

- `--manifest <path>` required
- `--out-dir <path>` required
- `--generated-at <iso>` optional
- `--source-input-out <path>` optional
- `--metadata-out <path>` optional
- `--summary-out <path>` optional

Default output files:

- `codex-former-local-adapter-source-input.json`
- `codex-former-local-adapter-metadata.json`

The CLI prints source input path, metadata path, manifest hash, source input hash, work id, readiness status, and authority boundary.

## generated_at and hash behavior

If `--generated-at` is supplied:

- emitted source input `generated_at` uses the override;
- adapter metadata `generated_at` uses the override;
- `manifest_hash` remains the hash of the manifest bytes as supplied;
- `source_input_hash` hashes the emitted source input bytes with the overridden timestamp.

If `--generated-at` is not supplied:

- emitted source input `generated_at` uses `manifest.generated_at`;
- adapter metadata `generated_at` uses `manifest.generated_at`.

## Validation and Rejection Behavior

The adapter rejects:

- missing manifest file;
- invalid JSON;
- JSON that is not an object;
- unsupported manifest version;
- unsupported source kind;
- missing `generated_at`;
- missing `scope`;
- missing `work_id`;
- missing or empty `source_pr_refs`;
- missing `changed_files`;
- empty `changed_files`;
- missing `changed_files_summary`;
- no verification material;
- malformed check run fields;
- unsupported check status;
- malformed skipped check fields;
- malformed unresolved gap fields;
- malformed readiness fields;
- unsupported readiness status;
- oversized bounded operator notes;
- unsafe changed file paths such as absolute paths or parent traversal;
- unsafe/private/raw/provider/credential marker categories in manifest values.

The adapter allows benign bounded words such as `tokenizer`, `tokenization`, `secretariat`, `check:browser-computer-use`, `no browser-visible surface`, and `local docs report smoke work`.

## Privacy / Redaction Boundary

The adapter emits bounded summaries only.

It does not include raw diffs, raw logs, raw transcripts, raw provider logs, raw candidate payloads outside the returned-envelope path concept, private account material, credentials, screenshots, browser dumps, or omitted unsafe fields.

Public docs and reports use sanitized descriptions rather than echoing raw unsafe/private marker literals.

## Authority Boundary

This implementation does not call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, add accept/promote/reject actions, run prepare or validate helpers as normal CLI behavior, add UI/routes/browser surface, automate clipboard, approve, merge, deploy, make Core decisions, capture live Codex sessions, or mutate runtime fixtures.

## What This Does Not Do

This implementation does not:

- call Codex;
- does not integrate Codex SDK;
- does not call provider/model APIs;
- does not call GitHub APIs;
- call network;
- does not write DB;
- does not persist accepted state;
- does not create review decisions;
- does not run prepare or validate helpers;
- does not add UI/routes/browser surface;
- does not automate clipboard;
- implement source-input preflight mode;
- implement prepare orchestration mode;
- implement validate orchestration mode;
- implement surface export mode.

## Future Work

Future modes remain separate:

- Source-input preflight mode
- Prepare orchestration mode
- Validate orchestration mode
- Surface export mode

## Recommended Next PR

Add local Codex adapter source-input preflight hardening.

## Conclusion

PASS with follow-up
