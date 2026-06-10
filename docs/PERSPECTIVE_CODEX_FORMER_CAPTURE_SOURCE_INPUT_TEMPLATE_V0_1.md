# Perspective Codex Former Capture Source Input Template v0.1

## Purpose

This template gives an operator a bounded local JSON shape for
`npm run perspective:codex-former:capture-packet -- --source-input <path>`.
The helper adapts the JSON into the local Formation Input Bundle path, builds a
CodexPerspectiveFormerInputPacket, and writes a Manual Codex Former Draft Copy
Packet for a separate user-started Codex session.

The source input remains local review material. It is not accepted Augnes
state, proof, evidence, readiness, approval, merge authority, provider/model
behavior, Codex SDK behavior, GitHub mutation, or a Core decision.

## JSON Shape

Required fields:

- `scope`: bounded scope label, for example `project:augnes`.
- `changed_files`: non-empty list of local files relevant to the bounded work.
- Work anchor: either `work_id` or `source_pr_refs` must be present.
- Verification material: at least one of `tests_checks_run`, `skipped_checks`,
  `evidence_row_refs`, or `proof_only_action_refs`.

Recommended fields:

- `generated_at`: source-input timestamp. See the override note below.
- `work_id`: stable bounded work id.
- `source_pr_refs`: compact PR refs when relevant.
- `changed_files_summary`: short summary of what changed.
- `unresolved_gaps`: review gaps that remain open.
- `source_privacy_redaction_notes`: sanitized statement of what was omitted.
- `authority_boundaries`: statement that the material is review-only.

Optional pointer/ref fields:

- `evidence_row_refs`
- `proof_only_action_refs`
- `work_event_refs`
- `session_trace_refs`
- `existing_perspective_refs`

Refs should be pointer-oriented labels only. Do not put raw source material,
provider output, browser capture payloads, credentials, or private account
material into this JSON file.

## Example Bounded Source Input

```json
{
  "generated_at": "2026-06-09T00:00:00.000Z",
  "scope": "project:augnes",
  "work_id": "AG-example-codex-former-source-input",
  "source_pr_refs": ["pr:hynk-studio/augnes#495"],
  "changed_files": [
    "scripts/perspective-codex-former-capture-helper.mjs",
    "scripts/smoke-perspective-codex-former-capture-helper.mjs"
  ],
  "changed_files_summary": "Bounded local source input for helper validation. Benign terms such as tokenizer, tokenization, and secretariat are allowed.",
  "tests_checks_run": [
    {
      "check_id": "check:source-input-smoke",
      "command": "npm run smoke:perspective-codex-former-capture-helper",
      "status": "passed",
      "result_summary": "Source-input helper smoke passed."
    }
  ],
  "skipped_checks": [
    {
      "check_id": "check:browser-computer-use",
      "skipped_reason": "Screenshot validation skipped because no UI; no browser-visible surface was added.",
      "result_summary": "Local docs/report/smoke work only."
    }
  ],
  "evidence_row_refs": ["evidence:row:source-input-template-example"],
  "unresolved_gaps": [
    {
      "gap_id": "gap:pointer-review",
      "summary": "Pointer warnings remain review work, not product readiness."
    }
  ],
  "source_privacy_redaction_notes": [
    "Only bounded local summary material is included."
  ],
  "authority_boundaries": [
    "Review-only input; no accepted state or Core decision."
  ]
}
```

## Unsafe Material Prohibition

The source input file must stay bounded and sanitized. It must not include
credential-like fields, provider-side logs, raw browser/source/review payloads,
private account/session material, non-visible reasoning traces, approval or
merge authority, or unrelated private chat text.

The helper blocks obvious unsafe markers with exact or token-boundary matching
so benign bounded words such as `tokenizer`, `tokenization`, `secretariat`,
`check:browser-computer-use`, and `no browser-visible surface` do not block
prepare mode.

## Timestamp And Hash Behavior

When `--generated-at` is supplied, that timestamp is used for helper metadata
and for the generated Formation Input Bundle path. This override affects the
generated former input packet.

`source_input_hash` remains the deterministic hash of the source input file as
supplied on disk. It is not recomputed from the post-override builder input.

## Output Metadata

Parameterized prepare metadata records:

- `capture_source_kind: bounded_source_input_file`
- `source_input_path`
- `source_input_hash`
- source input scope and work id when supplied
- generated `source_former_input_packet`
- `source_manual_copy_packet_id`
- `source_former_input_packet_id`
- `source_prompt_hash`
- output file paths
- authority boundary flags, all non-authorizing

Default prepare mode keeps
`capture_source_kind: separate_session_capture_packet_prep_builder` and does
not invent a source input hash.

## Return And Validation Invariants

The separate-session return must contain exactly one
CodexPerspectiveCandidateDraft JSON object, either as a direct JSON object or as
bounded prose with one balanced candidate object. Multiple candidate objects
must block.

Validation still runs contract-fit first, direct validation/normalization
second, schema alignment only as a safety-net comparison, and Worker-Facing
Guidance only after direct validation returns candidate-compatible material.

Pointer warnings and `needs_review` basis quality are not hidden. They are
review work. Candidate-compatible material remains `non_committed` unless local
validation explicitly says otherwise.
