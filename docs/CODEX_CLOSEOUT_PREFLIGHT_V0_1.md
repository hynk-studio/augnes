# Codex Closeout Preflight v0.1

## Purpose

`scripts/codex-closeout-preflight.mjs` is a deterministic local review helper
for Codex PR closeout packets. It checks whether closeout fields, skipped-check
reasons, docs-only boundaries, and authority statements are ready for a PR body
or review note.

The helper is a review aid. It is not runtime authority, not approval, not
proof recording, not evidence recording, and not merge authority.

## Inputs

The helper reads environment variables and optional CLI flags only. It does not
read the Augnes runtime, GitHub, OpenAI, or the network.

Supported environment variables:

- `CODEX_SCOPE`
- `CODEX_WORK_ID`
- `CODEX_RESULT_STATUS`
- `CODEX_RESULT_KIND`
- `CODEX_RESULT_SUMMARY`
- `CODEX_FILES_CHANGED`
- `CODEX_RELATED_PR`
- `CODEX_RELATED_STATE_KEYS`
- `CODEX_SKIPPED_CHECKS_JSON`
- `CODEX_AUTHORITY_BOUNDARY_STATEMENT`
- `CODEX_DOCS_ONLY`

`CODEX_FILES_CHANGED` and `CODEX_RELATED_STATE_KEYS` may be JSON arrays or
comma/newline-separated strings. `CODEX_SKIPPED_CHECKS_JSON` must be a JSON
array. Each skipped check should include a check name and a concrete reason,
for example:

```json
[
  {
    "check": "browser verification",
    "reason": "no browser runtime available in this environment"
  }
]
```

Supported flags:

- `--strict`: convert required-field, skipped-check, docs-only, authority, and
  merge-authority warnings into failures where applicable.
- `--json`: accepted for explicit JSON mode; JSON output is already the default.
- `--help`: print usage.

## JSON Output

The helper prints one JSON object to stdout:

```json
{
  "ok": true,
  "strict": false,
  "summary": {
    "scope": "project:augnes",
    "work_id": "AG-123",
    "result_status": "completed",
    "result_kind": "tooling",
    "files_changed": ["scripts/codex-closeout-preflight.mjs"],
    "related_pr": "https://github.com/Aurna-code/augnes/pull/123",
    "related_state_keys": ["coordination.codex_harness"]
  },
  "checks": [
    {
      "id": "authority_boundary",
      "status": "pass",
      "message": "Authority boundary statement is present."
    }
  ],
  "recommended_next_step": "Run npm run codex:record-completion-proof if the local Augnes runtime is available."
}
```

Warnings may also be summarized on stderr. The helper exits non-zero only for
malformed input or explicit `--strict` failures.

## Default Versus Strict

Default mode is advisory. Missing `CODEX_WORK_ID`, missing result fields,
missing authority statements, empty file lists, generic skipped-check reasons,
docs-only boundary findings, legacy completion mentions, and merge-authority
claims are reported as warnings where possible.

`--strict` is intended for pre-PR or pre-closeout checks. It fails on malformed
required closeout packets, absent authority statements, missing proof-work
context, skipped checks without concrete reasons, docs-only forbidden file
classes, and merge-authority claims.

Malformed `CODEX_SKIPPED_CHECKS_JSON` always fails because the helper cannot
reliably inspect skipped-check evidence.

## Examples

Run an advisory preflight:

```bash
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-123 \
CODEX_RESULT_STATUS=completed \
CODEX_RESULT_KIND=tooling \
CODEX_RESULT_SUMMARY="Added a deterministic closeout preflight helper." \
CODEX_FILES_CHANGED='["scripts/codex-closeout-preflight.mjs","package.json"]' \
CODEX_AUTHORITY_BOUNDARY_STATEMENT="This helper is local and non-mutating; proof is not approval and PR is not merge authority." \
npm run codex:closeout-preflight
```

Run a stricter local check:

```bash
npm run codex:closeout-preflight -- --strict
```

Docs-only scope check:

```bash
CODEX_DOCS_ONLY=true \
CODEX_FILES_CHANGED='["docs/example.md","apps/augnes_apps/src/server.ts"]' \
npm run codex:closeout-preflight -- --strict
```

## Authority Boundaries

The helper does not:

- call the Augnes runtime
- call GitHub
- call OpenAI
- call network resources
- create evidence rows
- create proof-only action records
- create work events
- commit or reject Augnes state
- create pending proposals
- approve, publish, retry, replay, externally post, merge, or enable auto-merge
- mutate files or runtime state

Proof is not approval. A PR is not merge authority. Helper output is a review
aid, not a durable Core decision.

## Relationship To AGENTS.md

`AGENTS.md` requires Codex to preserve Augnes authority boundaries, report
concrete skipped reasons, prefer proof-only completion when runtime and
`CODEX_WORK_ID` are available, and include closeout sections in PR bodies. This
helper checks those packet fields locally before Codex writes the final PR body
or review note.

## Relationship To Augnes Skills

- `augnes-closeout-proof`: this helper prepares the closeout packet and
  recommends `npm run codex:record-completion-proof` when work context exists.
  It does not record proof.
- `augnes-record-evidence`: this helper checks skipped-check and verification
  evidence language. It does not record evidence rows or fabricate
  `evidence_id` values.
- `augnes-authority-audit`: this helper provides a deterministic checklist for
  authority boundary claims, docs-only scope, legacy completion mentions, and
  merge-authority overclaims.

## Relationship To Codex Session Adapter

`docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` defines the read-brief,
verification, evidence, proof-only closeout, Evidence Pack, and Session Trace
workflow. This helper is local preflight around that workflow. It preserves
missing runtime, missing work ID, unavailable evidence API, and skipped checks
as explicit gaps instead of reconstructing or fabricating IDs.

## Relationship To Canonical Harness Roadmap

`docs/CODEX_AGENT_HARNESS_ROADMAP_V0_1.md` defines this as PR 3: a Codex
closeout / evidence checklist helper and smoke test. Later roadmap slices cover
plugin scaffold, hooks, MCP/bridge usage docs, Work Contract Card design,
browser/computer-use verification, and dogfood episode capture.

## Non-Goals

- runtime behavior changes
- database or schema changes
- API route changes
- MCP/App tool schema changes
- hook implementation
- plugin implementation
- MCP config
- ChatGPT App UI or operator card implementation
- browser/computer-use runbook implementation
- dogfood episode helper implementation
- secret handling changes
- ChatGPT direct Codex execution
- Codex Augnes commit/reject authority
- Codex merge authority
- approve, publish, retry, replay, or external posting automation
- evidence recording
- proof recording
- PR comment posting

## Forbidden Changes

This helper slice must not add network calls, runtime calls, OpenAI calls,
GitHub calls, file mutation, committed-state mutation, approval automation,
publication automation, merge automation, or secret handling changes.
