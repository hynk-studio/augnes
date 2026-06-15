# Codex Handoff Packet Preflight v0.1

## Purpose

`scripts/codex-handoff-preflight.mjs` is a deterministic local helper for
checking copied Codex Handoff Preview packet text before a user pastes it into
a separate Codex session.

The helper validates that the packet carries the current-runtime/work-item
fields, expected scope, authorization language, stop conditions, and authority
boundaries that Codex should see before implementation starts. It is a
preflight aid only. It is not runtime authority, not proof, not evidence, not
approval, and not a Codex launcher.

## Relationship To Work Contract Card

The Work Contract Card renders a read-only Codex Handoff Preview and a
`Copy Codex Handoff` affordance. After copying that packet, a user/operator may
run this helper locally to catch missing or ambiguous fields before using the
packet in a separate Codex session.

The copied packet remains human-readable text and now also includes a
machine-readable JSON block delimited by:

```text
BEGIN_AUGNES_CODEX_HANDOFF_JSON
...
END_AUGNES_CODEX_HANDOFF_JSON
```

The preflight reads the JSON block first when it is present, then reports local
findings. If no JSON block is present, it falls back to the original text
heuristics for existing copied packets. It does not call the widget, the
bridge, the Augnes runtime, or any external service.

## Relationship To Current Runtime Codex Handoff Contract

`docs/CURRENT_RUNTIME_CODEX_HANDOFF_CONTRACT_V0_1.md` defines the
current-runtime handoff contract. This helper checks for the same practical
fields:

- current runtime reference
- `CODEX_SCOPE`
- `CODEX_WORK_ID`
- work title, status, and next action
- expected files and checks
- evidence, proof-only closeout, and browser verification authorization
- forbidden actions
- stop conditions
- authority boundaries

Work title, status, and next action are validated from the `Work item` section
or from explicit top-level `Work title`, `Work status`, and `Work next action`
fields. Readiness-section fields such as `Status: ready` do not satisfy work
item context.

Raw DB paths remain local-dev fallback only and should not become normal
user-facing input. Demo DB refs must not be used as current-runtime refs.

## Structured JSON Block

The structured block uses schema `augnes.codex_handoff_preview.v0_1` and
captures the same conservative values as the readable packet: readiness,
runtime label, work item fields, authorization settings, expected files and
checks, forbidden actions, stop conditions, authority boundaries, and explicit
copy-packet no-execution/no-proof/no-evidence/no-state-mutation/no-merge
booleans.

Users should normally copy the whole packet and should not edit the JSON unless
they intentionally know which field they are changing. The JSON block is a
local validation aid only. It is not runtime proof, not evidence, not approval,
not a state record, and not execution authority.

If JSON delimiters are present but the JSON is malformed, empty, duplicated, or
out of order, the helper fails in both default and strict mode. If the JSON
schema is unknown, default mode warns and strict mode fails. The helper still
scans the whole copied packet for unsafe labels, write commands, secret-like
tokens, raw DB misuse, and demo DB misuse.

## Relationship To `codex:read-brief`

The helper checks that the copied packet contains a start command using:

```bash
npm run codex:read-brief
```

It does not run that command. A future Codex session should run
`codex:read-brief` only after user/Core has confirmed the current runtime and
work item.

## Relationship To Closeout Preflight

`npm run codex:closeout-preflight` checks PR closeout/reporting packets after
Codex work is done. `npm run codex:handoff-preflight` checks the copied handoff
packet before Codex starts work. Both helpers are deterministic and local; both
preserve missing context as explicit gaps instead of reconstructing or
fabricating runtime IDs.

## Inputs

The helper reads packet text from the first available source:

- `CODEX_HANDOFF_PACKET`
- `--file <path>`
- stdin

Supported flags:

- `--strict`
- `--json`
- `--help`
- `--file <path>`

`--json` is accepted for explicit JSON mode. JSON output is already the
default.

## JSON Output

The helper prints one JSON object to stdout:

```json
{
  "ok": true,
  "strict": false,
  "summary": {
    "input_mode": "json_block",
    "schema": "augnes.codex_handoff_preview.v0_1",
    "has_runtime": true,
    "has_scope": true,
    "has_work_id": true,
    "has_start_command": true,
    "readiness_status": "ready",
    "task_profile": "tooling"
  },
  "checks": [
    {
      "id": "work_id",
      "status": "pass",
      "message": "CODEX_WORK_ID is present."
    }
  ],
  "recommended_next_step": "Packet preflight passed. Start the separate Codex session with codex:read-brief only after user/Core confirms the current runtime and work item."
}
```

Warnings and failures are summarized on stderr. The helper exits non-zero for
missing input, malformed arguments, unreadable files, explicit unsafe packet
content, or strict failures.

## Default Versus `--strict`

Default mode is advisory for incomplete copied packets:

- placeholder runtime, scope, or work ID values warn
- missing expected files/checks warn
- evidence/proof/browser settings that need user/Core confirmation warn
- missing optional work-context fields warn
- unknown JSON schema warns

Strict mode is for a packet that is expected to be ready before Codex starts:

- placeholder or missing runtime, scope, or work ID values fail
- missing expected files/checks fail
- ambiguous evidence/proof/browser authorization fails
- missing authority boundaries or stop conditions fail
- unknown JSON schema fails

Both modes fail obvious unsafe content such as execution labels, merge/approval
labels, write shell commands, demo DB refs used as current runtime refs, raw DB
paths not labeled as local-dev fallback, or secret-like token values.

Read-only verification checks are allowed only through a narrow classifier.
The helper does not execute them; it only classifies copied packet text. Local
GET/default `curl` checks to `localhost`, `127.0.0.1`, or `::1` may appear in
expected checks, with an optional pipe to `jq`. Mutating or file-writing forms
remain failures, including `curl -X POST`, `PUT`, `PATCH`, `DELETE`,
`--data`, `-d`, `-F`, upload/output flags, shell redirection, `tee`, non-`jq`
pipes, `git push`, `npm publish`, and other destructive shell commands.

## Examples

Environment variable input:

```bash
CODEX_HANDOFF_PACKET="$(cat copied-handoff.txt)" npm run codex:handoff-preflight
```

File input:

```bash
npm run codex:handoff-preflight -- --file copied-handoff.txt --strict
```

Stdin input:

```bash
cat copied-handoff.txt | npm run codex:handoff-preflight -- --json
```

Structured JSON block excerpt:

```text
BEGIN_AUGNES_CODEX_HANDOFF_JSON
{
  "schema": "augnes.codex_handoff_preview.v0_1",
  "packet_kind": "codex_handoff_preview",
  "runtime": {
    "endpoint_label": "provided by current Augnes runtime",
    "requires_user_core_confirmation": true
  },
  "work": {
    "scope": "project:augnes",
    "work_id": "AG-123",
    "title": "Example work",
    "status": "ready",
    "next_action": "Run local preflight before Codex starts.",
    "related_state_keys": []
  },
  "copy_packet": {
    "preview_only": true,
    "does_not_execute_codex": true,
    "does_not_record_evidence": true,
    "does_not_record_proof": true,
    "does_not_mutate_state": true,
    "does_not_merge": true
  }
}
END_AUGNES_CODEX_HANDOFF_JSON
```

Text-only fallback remains supported for previously copied packets that do not
include the delimiters. In fallback mode the helper sets
`summary.input_mode` to `text` and uses the existing section and field
heuristics.

## Authority Boundaries

This helper does not:

- execute Codex
- call the Augnes runtime
- call GitHub
- call OpenAI
- call network resources
- run shell commands from the packet
- record evidence
- record proof
- create work events
- create or edit runtime state
- commit or reject Augnes state
- approve, publish, retry, replay, externally post, merge, or enable auto-merge
- mutate files

Proof is not approval. Evidence is not approval. A PR is not merge authority.
Durable approval remains user/Core gated.

## Non-Goals

This helper does not add runtime behavior, database/schema changes, API routes,
MCP/App tool schemas, bridge write authority, active MCP config, plugin MCP
config, app mappings, hooks, ChatGPT App UI/operator card implementation,
browser automation, screenshot capture, secret handling, dependencies, dogfood
reports, browser reports, proof recording, evidence recording, external
publishing, GitHub comment posting, merge behavior, or state mutation.

## UX Value

The intended flow is:

1. A normal user copies the handoff packet from the Work Contract Card.
2. The user/operator runs `npm run codex:handoff-preflight` locally.
3. The helper catches missing runtime/work fields, missing expected scope,
   missing stop conditions, missing authority boundaries, unsafe labels, raw DB
   path misuse, demo DB misuse, and proof/evidence/browser ambiguity before
   Codex starts implementation.
4. A separate Codex session starts only after user/Core resolves the reported
   gaps and confirms the current runtime/work item.
