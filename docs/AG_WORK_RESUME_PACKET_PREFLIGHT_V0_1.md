# AG Work Resume Packet Preflight v0.1

## Purpose

`scripts/ag-work-resume-packet-preflight.mjs` is a deterministic local helper
for checking AG Resume Packet JSON before using it as cross-local work context.
It validates the v0.2 packet shape, target runtime policy, redaction facts,
bounds, and obvious unsafe content.

The helper is preflight only. It does not call the Augnes runtime, call
GitHub, call OpenAI, make network requests, execute shell commands from packet
content, mutate files, import or persist resume context, create work events,
bind sessions, record evidence, record proof, approve, publish, retry, replay,
externally post, merge, or mutate committed state.

Implementation note: the CLI delegates packet checks to the side-effect-free
core in `lib/ag-work-resume-packet-preflight-core.mjs`. Route code imports the
typed wrapper in `lib/ag-work-resume-packet-preflight.ts`, so local CLI and
route preflight behavior share one validation implementation.

## Relationship To Cross-Local Resume Design

`docs/CROSS_LOCAL_AG_WORK_RESUME_DIRECT_CODE_V0_2.md` defines the packet-first
direction. The packet is the primary primitive. Direct AG Resume Code is a
future read-only retrieval handle for exactly one packet. This helper validates
packets locally before Local B previews gaps or before any future import or
Codex start.

## Inputs

The helper reads the first available input source:

1. `AG_WORK_RESUME_PACKET`
2. `--file <path>`
3. stdin

`--file` accepts both `--file packet.json` and `--file=packet.json`.

## Flags

- `--strict`: Treat ready-to-use packet gaps as failures.
- `--json`: Accepted for explicit JSON mode. JSON output is already the
  default.
- `--help`: Print usage text.
- `--file <path>`: Read packet JSON from a file if the environment variable is
  not set.

## Default Mode Versus Strict Mode

Default mode is advisory for safe but incomplete packets:

- missing optional expected files or expected checks warn
- missing optional integrity hashes warn
- unknown schema warns
- unknown packet kind warns
- missing core fields warn unless the missing value is also an unsafe
  authority condition

Strict mode is for packets expected to be ready for cross-local preview:

- placeholder or missing scope, work ID, title, status, or next action fails
- missing expected files fails
- missing expected checks fails
- missing Git remote, base branch, or base commit fails
- unknown schema fails
- unknown packet kind fails
- unsafe or ambiguous target policy fails
- redaction flags set true fail

Both modes fail invalid JSON, secret-like tokens, private-key material, tunnel
URLs, raw DB paths, unsafe local absolute paths, unsafe authority language, and
target policies that grant execution, merge, publication/replay,
commit/reject, automatic work item creation, or automatic session binding.

## JSON Output

The helper prints one JSON object to stdout:

```json
{
  "ok": true,
  "strict": false,
  "summary": {
    "input_mode": "json",
    "schema": "augnes.ag_work_resume_packet.v0_2",
    "packet_kind": "ag_work_resume_packet",
    "has_packet_id": true,
    "has_runtime_instance_id": true,
    "has_scope": true,
    "has_work_id": true,
    "has_git_remote": true,
    "has_expected_checks": true,
    "preview_only_by_default": true
  },
  "checks": [
    {
      "id": "schema",
      "status": "pass",
      "message": "Recognized AG resume packet schema."
    }
  ],
  "recommended_next_step": "Packet preflight passed. Use this packet only as read-only resume context until user/Core confirms the local runtime/work mapping."
}
```

Check statuses are `pass`, `warn`, and `fail`. Warnings and failures are also
summarized on stderr. The process exits non-zero for missing input, malformed
arguments, unreadable files, invalid JSON, explicit unsafe content, or strict
failures.

## Checks

The helper reports these checks in deterministic order:

- `input_present`
- `valid_json`
- `schema`
- `packet_kind`
- `packet_id`
- `expires_at`
- `issuer_runtime`
- `issuer_runtime_instance_id`
- `source_work_scope`
- `source_work_id`
- `source_work_title`
- `source_work_status`
- `source_work_next_action`
- `git_remote`
- `git_base_branch`
- `git_base_commit`
- `expected_files`
- `expected_checks`
- `target_preview_only`
- `target_no_create_work_item`
- `target_no_record_evidence_auto`
- `target_no_record_proof_auto`
- `target_no_bind_session`
- `target_no_commit_or_reject`
- `target_no_execute_codex`
- `target_no_merge`
- `target_no_publish_or_replay`
- `redaction_no_raw_db_paths`
- `redaction_no_secrets`
- `redaction_no_tunnel_urls`
- `redaction_no_local_absolute_paths`
- `redaction_no_media`
- `redaction_no_raw_openai_responses`
- `bounds_recent_work_events`
- `bounds_foreign_evidence_refs`
- `bounds_summaries_only`
- `bounds_no_raw_logs`
- `unsafe_secret_like_content`
- `unsafe_tunnel_urls`
- `unsafe_raw_db_paths`
- `unsafe_local_absolute_paths`
- `unsafe_authority_labels`
- `resume_code_semantics_doc_guard`
- `recommended_next_step`

Additional integrity checks may be reported for optional hash fields, and the
helper may report extra authority-boundary checks when they preserve the same
read-only packet semantics.

`expires_at` may be `null` for no expiration. When it is present as a timestamp,
it must be a UTC ISO value such as `2026-05-30T00:00:00.000Z`; malformed or
already-expired packet timestamps fail closed. A missing `expires_at` warns in
default mode and fails in strict mode.

## Examples

Environment variable input:

```bash
AG_WORK_RESUME_PACKET="$(cat packet.json)" npm run ag:resume-preflight
```

File input:

```bash
npm run ag:resume-preflight -- --file packet.json --strict
```

Stdin input:

```bash
cat packet.json | npm run ag:resume-preflight -- --json
```

## Authority Boundary

This helper validates packet content only. It does not execute Codex, create or
map work items, bind sessions, record proof, record evidence, call runtime
routes, call bridge tools, call network resources, mutate files, approve,
publish, retry, replay, externally post, merge, enable auto-merge, or mutate
committed Augnes state.

Resume packets and resume codes are read-only context transfer aids. They are
not approval, not proof/evidence authorization, not local work item creation
authority, not Codex execution authority, not publication authority, and not
merge authority. Durable approval remains user/Core gated.

## Non-Goals

This helper does not add runtime behavior, database/schema changes, API routes,
MCP/App tool schemas, bridge write authority, active MCP config, plugin
behavior, app mappings, hooks, ChatGPT App UI/operator card implementation,
browser automation, screenshot capture, secret handling changes, dependencies,
dogfood reports, browser reports, proof recording, evidence recording,
persistent import, Direct Resume Code routes, relay behavior, external
publishing, GitHub comment posting, merge behavior, or committed-state
mutation.
