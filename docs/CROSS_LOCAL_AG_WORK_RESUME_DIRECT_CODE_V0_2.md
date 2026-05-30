# Cross-Local AG Work Resume Packet And Direct Code v0.2

## Status

This is an implementation-slice design doc, not runtime authority. It documents
the first bounded direction for cross-local AG work resume packets and direct
resume codes. This slice adds documentation, a deterministic local packet
preflight helper, smoke coverage, and package script wiring only.

It does not add runtime routes, database or schema changes, API routes,
MCP/App tool schema changes, bridge write tools, UI controls, persistent
import, Direct Resume Code create or resolve routes, relay behavior, proof or
evidence recording, work event creation, session binding, approval, publish,
retry, replay, external posting, merge, auto-merge, or committed-state
mutation.

## Purpose

Augnes is local-first. A Git branch or pull request can move code between two
computers, but it does not move one local runtime's work item, recent work
events, handoff expectations, evidence gaps, proof refs, or session refs. The
AG Resume Packet is a bounded, redacted context artifact for resuming one AG
work unit on another local computer without syncing a whole database or
granting authority.

Direct AG Resume Code is a near-MVP convenience transport for retrieving
exactly one packet. The packet remains the primary primitive. The code is a
read-only packet retrieval handle, not an approval or execution token.

## Design Goals

- Resume one AG work unit, not a whole local database.
- Keep GitHub responsible for code refs and Augnes responsible for bounded
  work context.
- Preserve foreign refs as foreign refs until local B explicitly maps them.
- Validate and preview before any future import or Codex start.
- Exclude secrets, raw local runtime paths, raw local artifacts, tunnel URLs,
  screenshots, raw OpenAI responses, and token material.
- Make missing context, stale refs, unsafe redaction flags, and authority
  conflicts visible as gaps.
- Keep packet transfer separate from approval, proof, evidence, execution,
  publication, and merge authority.

## Non-Goals

- No DB sync.
- No runtime route in this PR.
- No Direct Resume Code create or resolve endpoint in this PR.
- No relay-backed code in this PR.
- No persistent import in this PR.
- No automatic local work item creation.
- No automatic session binding.
- No proof or evidence recording from packet validation or code resolution.
- No ChatGPT App or MCP tool schema changes.
- No UI controls.
- No Codex execution from ChatGPT, Cockpit, a packet, or a resume code.
- No approval, publish, retry, replay, external posting, merge, auto-merge, or
  committed-state mutation authority.

## AG Resume Packet v0.2 Schema Shape

The normative v0.2 packet shape is:

```json
{
  "schema": "augnes.ag_work_resume_packet.v0_2",
  "packet_kind": "ag_work_resume_packet",
  "packet_id": "resume-packet:example",
  "created_at": "2026-05-30T00:00:00.000Z",
  "expires_at": null,
  "issuer": {
    "runtime": "augnes",
    "runtime_instance_id": "runtime-instance:example",
    "source_local_label": "operator-provided label",
    "created_by_surface": "cockpit",
    "export_event_id": null
  },
  "integrity": {
    "canonicalization": "augnes-json-c14n-v0_1",
    "payload_hash": "sha256:example",
    "redaction_report_hash": "sha256:example",
    "signature": null
  },
  "source_work": {
    "scope": "project:augnes",
    "work_id": "AG-123",
    "title": "Example work",
    "status": "in_progress",
    "priority": "now",
    "summary": "Example bounded summary.",
    "next_action": "Continue with a validated local preview.",
    "related_state_keys": []
  },
  "git": {
    "remote": "https://github.com/hynk-studio/augnes.git",
    "base_branch": "main",
    "base_commit": "c6f0e9b",
    "working_branch": "codex/example",
    "head_commit": "abc123",
    "related_pr": null,
    "dirty_worktree": false
  },
  "handoff": {
    "handoff_id": "handoff:example",
    "status": "ready",
    "expected_files": [],
    "expected_checks": [],
    "expected_execution_surfaces": [],
    "forbidden_surfaces": [],
    "stop_conditions": [],
    "safety_boundaries": []
  },
  "continuity": {
    "recent_work_events": [],
    "foreign_action_refs": [],
    "foreign_evidence_refs": [],
    "foreign_session_refs": [],
    "foreign_evidence_pack_ref": null,
    "proof_marker_note": "state_key:null action records are proof-only"
  },
  "target_runtime_policy": {
    "preview_only_by_default": true,
    "may_map_to_existing_local_work_item": "requires explicit user/Core approval",
    "may_create_local_work_item": false,
    "may_record_evidence": "requires explicit user/Core approval and known local work_id",
    "may_record_proof": "requires explicit user/Core approval and known local work_id",
    "may_bind_session": false,
    "may_commit_or_reject_state": false,
    "may_execute_codex": false,
    "may_merge": false,
    "may_publish_or_replay": false
  },
  "redaction": {
    "raw_db_paths_included": false,
    "secrets_included": false,
    "tunnel_urls_included": false,
    "local_absolute_paths_included": false,
    "screenshots_or_media_included": false,
    "raw_openai_responses_included": false,
    "notes": []
  },
  "bounds": {
    "max_recent_work_events": 10,
    "max_foreign_evidence_refs": 20,
    "summaries_only": true,
    "raw_logs_included": false
  }
}
```

`integrity.payload_hash` and `integrity.redaction_report_hash` are optional in
this first validation slice. Missing hashes warn in default and strict mode.
Malformed hashes fail. A future builder can make hash generation canonical
after the packet builder and import-preview behavior are stable.

## Direct AG Resume Code Semantics

Direct AG Resume Code is a short-lived read-only retrieval handle for exactly
one AG Resume Packet. Format guidance:

```text
AGRES-v1.<lookup_id>.<secret>
```

The lookup id identifies one pending packet export. The raw secret authorizes
only retrieval of that one packet. A future implementation must store only a
salted hash of the secret, not the raw secret. It must also enforce TTL,
max-use count, explicit revocation, rate limits, and public-safe retrieval
audit metadata.

Secrets must not travel in URL query parameters. A future route should accept
the secret through a body or local form submission path that avoids browser,
proxy, shell, and server logs. A packet must not include an endpoint or tunnel
URL. Local B should receive a packet, validate it locally, and preview gaps
before any future import or Codex start.

Direct code returns packet data only. It does not import, execute, record
proof, record evidence, create work items, bind sessions, approve, publish,
retry, replay, merge, mutate committed state, or post externally.

## Authority Boundary

- A packet or code is not approval.
- A packet or code is not proof/evidence authorization.
- A packet or code is not local work item creation authority.
- A packet or code is not Codex execution.
- A packet or code is not merge, publish, retry, replay, or external posting
  authority.
- A packet or code is not committed-state mutation authority.
- Foreign proof, evidence, action, and session refs remain foreign refs until a
  future user/Core-gated local mapping explicitly says otherwise.
- Durable approval remains user/Core gated.

## Workflow A: Offline Packet

1. Local A builds or copies an AG Resume Packet for one work unit.
2. The packet includes only bounded summaries, refs, expected files/checks,
   redaction facts, integrity metadata, and authority boundaries.
3. The user moves the packet to local B as text or a JSON file.
4. Local B runs local preflight.
5. Local B previews gaps and conflicts.
6. Codex may start only later through the normal `codex:read-brief` gate after
   user/Core confirms local runtime/work mapping.

## Workflow B: Direct Local-To-Local Resume Code

1. Local A creates a short-lived direct code for one already-built packet.
2. Local A stores only lookup metadata and a hash of the secret.
3. Local B submits the code to retrieve the packet.
4. Local B validates the packet locally.
5. Local B previews gaps and conflicts.
6. Any import, local work mapping, evidence/proof recording, or Codex start
   remains future and user/Core gated.

Direct code is a packet retrieval convenience. It is not a remote-control
channel, not a tunnel pointer, not a DB sync mechanism, and not an authority
grant.

## Workflow C: Relay

Relay-backed resume code is explicitly not v0. A future relay design would
need hosted security review, client-side encryption, public-safe metadata,
delete/expiry behavior, and a clear proof that the relay cannot read packet
contents or grant Augnes authority.

## Local B Validate And Preview Behavior

Local B should:

- validate JSON, schema, packet kind, core work fields, Git refs, redaction
  flags, target policy, bounds, and unsafe content
- preview missing expected files/checks
- preview stale Git refs and dirty worktree concerns when repo checks are later
  added
- show foreign action/evidence/session refs as foreign refs
- avoid auto-creating local work items
- avoid auto-binding sessions
- avoid recording proof or evidence
- avoid mutating committed state
- require user/Core confirmation before mapping a packet to an existing local
  work item

Codex may start only later through normal `codex:read-brief` after the local
runtime and local work mapping are known and approved.

## Conflict And Stop Conditions

Stop or fail closed when:

- input is missing
- JSON is invalid
- schema or packet kind is unknown in strict mode
- core work fields are missing or placeholders in strict mode
- Git remote, base branch, or base commit is missing in strict mode
- expected files or checks are missing in strict mode
- target policy grants execution, merge, publish/replay, commit/reject,
  automatic work creation, or automatic session binding
- redaction flags say secrets, tunnel URLs, raw DB paths, local absolute paths,
  screenshots/media, or raw OpenAI responses are included
- packet text includes secret-like tokens, private keys, tunnel URLs, raw DB
  paths, unsafe local absolute paths, or authority-grant language
- packet implies a resume code is approval, execution authority, proof/evidence
  authorization, import authority, local work item creation authority, merge
  authority, or publication authority
- packet is expired
- `expires_at` is malformed
- local B later detects a conflicting local work item or Git state

## Security And Privacy Rules

Packets and codes must exclude:

- secrets and API tokens
- `.env` values
- raw DB files and raw DB paths
- tunnel URLs
- unsafe local absolute paths
- screenshots or media artifacts
- raw OpenAI responses
- raw GitHub token material
- shell commands derived from packet content

Packet builders should produce a redaction report. Validators should fail on
obvious unsafe content and preserve uncertain context as warnings or preview
gaps.

## Implementation Slices

Current PR:

- Add this design doc.
- Add `docs/AG_WORK_RESUME_PACKET_PREFLIGHT_V0_1.md`.
- Add `scripts/ag-work-resume-packet-preflight.mjs`.
- Add `scripts/smoke-ag-work-resume-packet-preflight.mjs`.
- Wire `ag:resume-preflight` and `smoke:ag-work-resume-packet-preflight`.

Future:

- Packet builder preview from existing work/state/handoff surfaces.
- Direct Resume Code create and resolve routes.
- Target Local B preview for gaps and conflicts.
- Dogfood with real current-runtime work mapping.

Future only:

- Persistent import.
- Relay-backed resume code.

## Review Rule For Future PRs

Every future PR must identify which actor and surface it empowers. If the
change moves durable approval away from the user, committed state away from
Augnes Core, or execution control into ChatGPT Apps, Cockpit, a packet, or a
resume code, it is out of scope unless a new architecture is explicitly
approved.
