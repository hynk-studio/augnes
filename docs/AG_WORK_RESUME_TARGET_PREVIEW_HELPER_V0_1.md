# AG Work Resume Target Preview Helper v0.1

## Purpose

`scripts/ag-work-resume-target-preview.mjs` is a local read-only helper for
running a Target Local B AG Resume Packet preview from already-built packet
JSON plus explicitly supplied Local B runtime, repo, and mapping context.

The helper is a convenience wrapper over packet preflight and the pure target
preview checker. It prints deterministic JSON for local review. It is not an
import path, not a route, not a runtime bridge, not Codex execution authority,
and not approval.

## Relationship To Existing Pieces

- Packet preflight: `scripts/ag-work-resume-packet-preflight.mjs` validates the
  packet shape, target policy, redaction facts, bounds, and unsafe content. The
  target preview helper runs strict preflight by default before relying on the
  packet.
- Packet builder preview: `lib/ag-work-resume-packet.ts` builds sanitized AG
  Resume Packet previews from explicit Local A context. The helper consumes an
  already-built packet and does not build one itself.
- Target preview pure checker: `lib/ag-work-resume-target-preview.ts` compares
  the validated packet against explicit Local B context. The helper calls this
  pure checker and does not discover local context on its own.

## Inputs

The helper accepts input in this precedence order:

1. `AG_WORK_RESUME_TARGET_PREVIEW_INPUT` containing combined JSON.
2. `--file <path>` containing combined JSON.
3. `--packet-file <path>` plus optional `--local-context-file <path>`.
4. stdin containing combined JSON.

Combined JSON shape:

`{ "packet": { ...AG Resume Packet v0.2... }, "local": { ...Local B context... }, "strict": false }`

Separate local context JSON shape:

`{ "runtime": { ... }, "repo": { ... }, "known_local_work_mappings": [] }`

When no local context is supplied with `--packet-file`, the helper passes
`local: null` and the preview should report `context_only`.

## Flags

- `--strict`: passes `strict: true` to the target preview checker. Packet
  preflight already runs in strict mode by default.
- `--json`: accepted for explicit JSON mode. JSON output is already default.
- `--help`: prints local helper usage.
- `--file <path>`: reads combined JSON from a file.
- `--packet-file <path>`: reads packet JSON from a file.
- `--local-context-file <path>`: reads explicit Local B context JSON from a
  file.
- `--skip-preflight`: skips packet preflight and adds a warning. This is for
  fixtures or operator debugging only and is not recommended for relying on a
  target preview.

## Output Shape

The helper prints one JSON object to stdout:

`{ "ok": true, "strict": false, "input_mode": "env|file|separate-files|stdin", "preflight": { "ran": true, "ok": true, "strict": true, "status": "pass", "warnings": [], "failures": [] }, "preview": { ...AgWorkResumeTargetPreview... }, "recommended_next_step": "User/Core should review target preview before any Codex start." }`

`ok` means the helper completed and produced a non-blocking preview. It does
not mean Codex can execute. `ok` is false for input failures, preflight
failures, `blocked`, and `conflict`.

Warnings, gaps, conflicts, and preflight failures are summarized on stderr.

## Exit Codes

- Missing input: exit 2.
- Malformed args: exit 2.
- Unreadable file: exit 2.
- Invalid JSON: exit 1.
- Preflight failed: exit 1.
- Preview status `blocked`: exit 1.
- Preview status `conflict`: exit 1.
- Preview status `needs_mapping`: exit 0.
- Preview status `context_only`: exit 0.
- Preview status `ready_for_user_core_review`: exit 0.

`needs_mapping` and `context_only` exit zero because they are successful
read-only previews, not implementation-ready states.

## Local B Workflow

1. Obtain or build an AG Resume Packet.
2. Run this helper with explicit Local B runtime, repo, and mapping context.
3. Inspect gaps, conflicts, warnings, and recommendations.
4. User/Core confirms whether the foreign work maps to an existing local work
   item.
5. Only later run `codex:read-brief` against a confirmed local runtime/work
   mapping.

## Examples

Environment combined JSON:

`AG_WORK_RESUME_TARGET_PREVIEW_INPUT="$(cat target-preview-input.json)" npm run ag:resume-target-preview`

Combined file:

`npm run ag:resume-target-preview -- --file target-preview-input.json`

Separate packet and Local B context files:

`npm run ag:resume-target-preview -- --packet-file packet.json --local-context-file local-context.json`

Strict target repo interpretation:

`npm run ag:resume-target-preview -- --strict --file target-preview-input.json`

Fixture/debug mode without packet preflight:

`npm run ag:resume-target-preview -- --skip-preflight --file target-preview-input.json`

## Authority Boundary

- The local helper is read-only.
- No route.
- No DB/schema changes.
- No persistence.
- No import.
- No work item creation.
- No mapping record creation.
- No proof/evidence recording.
- No session binding.
- No Direct Resume Code route.
- No relay.
- No Codex execution.
- No approval, publish, retry, replay, external posting, merge, auto-merge, or
  committed-state mutation.

Target previews are review aids. They are not approval, not proof/evidence
authorization, not Codex execution authority, and not merge/publish authority.
Durable approval remains user/Core gated.

## Non-Goals

This helper does not add runtime routes, API routes, MCP/App tool schema
changes, bridge tools, UI controls, Cockpit panels, ChatGPT App cards,
persistent import, Direct Resume Code create/resolve routes, relay behavior,
proof/evidence recording, work event creation, work item creation, mapping
record creation, session binding, Codex execution controls, or committed-state
mutation.

## Future Note

A later PR may wire this flow into a read-only route, Cockpit panel, or
ChatGPT App read-only bridge only after user/Core scopes that surface and keeps
the same no-import, no-persistence, no-proof/evidence, no-session-binding,
no-Codex-execution, no-merge, and no-state-mutation boundaries.
