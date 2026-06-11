# Perspective Codex Former Local Adapter Prepare Orchestration Design v0.1

## Purpose

This design defines future local Codex adapter prepare orchestration mode.

This PR is design-only. It adds no prepare orchestration implementation, no CLI prepare behavior, no validate orchestration, no surface export, no UI, no route, no runtime browser surface, no Codex call, no Codex SDK call, no provider/model API call, no GitHub API call, no network call, no DB write, no persistence, no clipboard automation, no accepted Augnes state, no proof/evidence/readiness creation, no review decision records, no accept/promote/reject actions, no approval/merge/deploy/Core decision, no live Codex capture, and no runtime fixture mutation.

## Why Follows PR #511

PR #511 produced local not_ready and waiting snapshots based on manifest/source-input/preflight state.

The waiting state says source input is ready and the operator may now run the existing prepare helper outside the adapter. The next logical design is prepare orchestration: a future local adapter mode that may wrap the existing prepare helper while preserving authority boundaries.

## Product Thesis

Prepare orchestration mode should make the existing prepare helper easier to invoke from the local adapter after source-input preflight passes, while preserving the manual separate Codex return and review-only boundary.

It should:

- consume adapter-emitted source input;
- require preflight passed;
- invoke or wrap the existing capture helper prepare command in a future implementation;
- collect bounded prepare output paths and hashes;
- emit prepare summary metadata;
- update future Session Panel / Inbox snapshots from waiting to prepared / waiting-for-Codex-return state;
- not call Codex;
- not validate returned material;
- not create accepted state.

## Design Scope

This design only defines the future prepare orchestration contract.

It does not implement prepare orchestration, does not add CLI prepare behavior, does not run `scripts/perspective-codex-former-capture-helper.mjs`, and does not change existing helper behavior.

## Relationship To Existing Adapter Modes

This design follows:

- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_CODEX_INTEGRATION_ADAPTER_DESIGN_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_MANIFEST_TO_SOURCE_INPUT_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_SOURCE_INPUT_PREFLIGHT_HARDENING_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_SURFACE_SNAPSHOTS_V0_1.md`

Manifest-to-source-input mode produces helper-compatible source input. Source-input preflight mode validates it locally. Surface snapshots mode shows not_ready and waiting states. Prepare orchestration mode would be the next future local wrapper around existing capture helper prepare mode.

Validate orchestration remains separate future work. Surface integration remains separate future work. The review decision layer remains separate future work.

## Prepare Orchestration Stages

### Stage A. Input Readiness Check

The future mode should:

- require source input path;
- require source input preflight summary path;
- require preflight status passed;
- verify `source_input_hash` matches source input bytes;
- verify source input passes local preflight again;
- reject manifest/source input/preflight mismatch;
- reject unsafe or invalid source input.

### Stage B. Prepare Command Construction

The future mode should construct the existing helper command:

```bash
npm run perspective:codex-former:capture-packet -- --out-dir <prepare-out-dir> --source-input <source-input-path> --generated-at <iso>
```

It should not embed raw source input in command output. It should avoid shell interpolation with unsafe values. Future implementation should prefer execFile-style invocation. The out-dir must be explicit and local.

### Stage C. Prepare Helper Execution

A future implementation may run the existing helper prepare command.

It should capture stdout/stderr in bounded form, avoid printing raw packets into long logs unless already emitted as files by the helper, detect helper success/failure, and not proceed to Codex automatically.

### Stage D. Prepare Output Discovery

The future mode should collect helper-emitted file paths:

- manual copy packet;
- former input packet;
- prompt;
- return envelope template;
- metadata;
- any prepare summary already produced by the helper.

It should compute hashes of bounded files where useful, avoid parsing private/raw material beyond needed metadata, and not alter helper output.

### Stage E. Adapter Prepare Summary

The future mode should write local adapter prepare summary JSON with:

- `prepare_summary_version`
- `mode`
- `generated_at`
- `source_input_path`
- `source_input_hash`
- `preflight_summary_path`
- `helper_command_summary`
- `helper_out_dir`
- `helper_exit_status`
- `helper_output_paths`
- `helper_output_hashes`
- `prompt_hash` if available
- `return_envelope_template_path` if available
- `next_safe_action`
- `authority_flags` all false

The summary is local-only and review-only.

### Stage F. Surface Snapshot Handoff

Future adapter snapshots may move Session Panel from waiting to prepared / waiting for returned Codex candidate.

The Inbox may remain waiting. There is no Constellation Preview handoff yet. There is no PASS/BLOCKED yet. There is no accepted state.

## Inputs

Allowed future inputs:

- source input JSON path;
- source input preflight summary JSON path;
- prepare out-dir;
- generated_at override;
- optional adapter manifest path for provenance;
- optional expected source_input_hash;
- optional summary output path.

Required future implementation inputs:

- source input path;
- preflight summary path;
- prepare out-dir.

Disallowed inputs:

- raw diffs;
- raw logs;
- raw transcripts;
- raw candidate payloads;
- provider/model logs;
- hidden reasoning;
- tokens;
- cookies;
- credentials;
- private account data;
- screenshots/browser dumps;
- GitHub API calls;
- Codex SDK calls;
- network calls;
- DB writes;
- clipboard automation.

## Outputs

Future outputs may include:

- helper prepare output directory;
- adapter prepare summary JSON;
- optional adapter prepare metadata JSON;
- optional updated Session Panel snapshot JSON;
- optional updated Inbox item snapshot JSON.

For this design, outputs are only future contracts. This PR implements none of them.

## Prepare Summary Contract

Future prepare summary shape:

```json
{
  "prepare_summary_version": "codex_former_local_adapter_prepare_summary.v0.1",
  "mode": "prepare-orchestration",
  "generated_at": "2026-06-11T00:00:00.000Z",
  "source_input_path": "path/to/source-input.json",
  "source_input_hash": "sha256",
  "preflight_summary_path": "path/to/preflight-summary.json",
  "preflight_status": "passed",
  "helper_out_dir": "path/to/prepare-output",
  "helper_exit_status": "success",
  "helper_command_kind": "existing_capture_helper_prepare",
  "helper_command_summary": "npm run perspective:codex-former:capture-packet with bounded source input and explicit out-dir",
  "helper_output_paths": {
    "manual_copy_packet_path": "path/to/manual-copy-packet",
    "former_input_packet_path": "path/to/former-input-packet",
    "prompt_path": "path/to/prompt",
    "return_envelope_template_path": "path/to/return-envelope-template",
    "helper_metadata_path": "path/to/helper-metadata"
  },
  "helper_output_hashes": {
    "source_prompt_hash": "optional",
    "manual_copy_packet_hash": "optional",
    "former_input_packet_hash": "optional",
    "return_envelope_template_hash": "optional",
    "helper_metadata_hash": "optional"
  },
  "next_safe_action": "Use the manual copy packet in a separate user-started Codex session.",
  "caveats": [],
  "authority_flags": {
    "accepted_state_created": false,
    "proof_evidence_readiness_created": false,
    "review_decision_created": false,
    "provider_model_calls": false,
    "codex_sdk_calls": false,
    "github_api_calls": false,
    "db_writes": false,
    "clipboard_automation": false,
    "live_codex_capture": false,
    "runtime_fixture_mutation": false,
    "core_decision": false
  }
}
```

The summary must not include raw packet contents unless separately scoped and bounded. Prefer paths and hashes over content.

## State Mapping To Surfaces

### Source input preflight failed

- Session Panel: not prepared / preflight failed.
- Inbox: `not_ready`.
- Constellation: no handoff.

### Preflight passed, prepare not run

- Session Panel: waiting / prepare ready.
- Inbox: waiting.
- Constellation: no handoff.

### Prepare succeeded

- Session Panel: prepared, waiting for separate Codex return.
- Inbox: waiting.
- Constellation: no handoff.
- Next safe action: use manual copy packet in separate user-started Codex session.

### Prepare failed

- Session Panel: prepare failed / not_ready or blocked-like local caveat.
- Inbox: `not_ready` or `invalid_data` depending on failure cause.
- Constellation: no handoff.
- Next safe action: inspect bounded helper error summary and rerun prepare.

### Returned candidate present

Returned candidate handling is out of scope for prepare orchestration design and belongs to validate orchestration design.

## Validation And Rejection Behavior

Future prepare orchestration should reject:

- missing source input;
- invalid source input;
- missing preflight summary;
- invalid preflight summary;
- preflight status not passed;
- preflight source_input_hash mismatch;
- missing out-dir;
- out-dir points to file;
- output path collision;
- unsafe path;
- helper command unavailable;
- helper prepare exits non-zero;
- helper output missing expected metadata;
- helper output hash mismatch;
- unsafe marker in bounded inputs;
- any attempt to pass Codex SDK/provider/GitHub/DB/network flags.

## CLI Design

Future CLI command, design-only:

```bash
npm run perspective:codex-former:local-adapter:prepare -- --source-input <path> --preflight-summary <path> --out-dir <path> --generated-at <iso>
```

Optional flags:

- `--manifest <path>`
- `--prepare-summary-out <path>`
- `--session-panel-snapshot-out <path>`
- `--inbox-item-snapshot-out <path>`
- `--dry-run`

Dry-run validates inputs and prints constructed command summary without running the helper.

Normal mode, in a later PR, would run only the existing helper prepare command. It would not run the validate helper, call Codex, automate clipboard, or call network.

## Browser/Computer-Use Validation Plan

This PR is design-only and adds no UI, so browser validation is skipped.

Future prepare orchestration implementation may be CLI-only and may skip browser validation if it does not touch UI/routes/browser-visible surfaces.

If future implementation updates Session Panel, Inbox, Constellation UI, or writes snapshots consumed by UI, targeted browser validation should be considered.

## Privacy/Redaction

Paths and hashes are preferred over raw content.

Prepare orchestration should use bounded stdout/stderr summaries only. It should include no raw diffs/logs/transcripts/provider logs/candidate payloads, no credentials/tokens/cookies/private account data, and no screenshots/browser dumps.

Public docs/reports must not echo raw unsafe/private marker literals.

## Authority Boundary

Prepare orchestration must preserve:

- no Codex call;
- no Codex SDK;
- no provider/model API;
- no GitHub API;
- no network;
- no DB write;
- no persistence;
- no clipboard automation;
- no accepted Augnes state;
- no proof/evidence/readiness creation;
- no review decision records;
- no accept/promote/reject actions;
- no approval/merge/deploy/Core decision;
- no live Codex capture;
- no validate orchestration;
- no surface export;
- no UI implementation in this PR.

## Future Implementation Sequence

Recommended sequence:

1. Add local Codex adapter prepare orchestration dry-run implementation.
2. Add local Codex adapter prepare orchestration execution implementation after dry-run hardening.
3. Add prepare-output snapshots for Session Panel and Inbox waiting states.
4. Design validate orchestration mode.
5. Add validate-summary modeling for PASS/BLOCKED snapshots.
6. Only later consider live Codex SDK / provider / GitHub / persistence integration with explicit authority gates.

Immediate next PR: Add local Codex adapter prepare orchestration dry-run implementation.

Dry-run should come before execution so the machine first says what it would do before doing it.

## Conclusion

PASS with follow-up
