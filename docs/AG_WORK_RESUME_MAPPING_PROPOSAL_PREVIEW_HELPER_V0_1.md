# AG Work Resume Mapping Proposal Preview Helper v0.1

## Purpose

`scripts/ag-work-resume-mapping-proposal-preview.mjs` is a local read-only
helper for running the Stage A AG Resume mapping proposal preview over an
already built AG Resume Packet and explicitly supplied Local B candidate work
items.

The helper is proposal-only. It is not mapping confirmation, not import
authorization, not proof/evidence authorization, not Codex execution
authority, and not merge/publish authority.

## Relationship To Existing Pieces

- Authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` defines the
  future gated mapping/import stages. This helper remains Stage A preview-only:
  no persistence, no mapping record creation, no import record creation, and no
  durable approval.
- Pure proposal preview:
  `lib/ag-work-resume-mapping-proposal-preview.ts` produces the deterministic
  `AgWorkResumeMappingProposalPreview` object. The local helper only reads
  input, calls that pure helper, prints JSON, and exits with documented status.
- Packet preflight:
  `ag:resume-preflight` should already have run before this helper is used.
  This helper does not run packet preflight and does not spawn
  `ag:resume-preflight`; unsafe packet policy still fails closed in the pure
  preview.
- Target preview helper:
  `ag:resume-target-preview` compares a packet against broader Local B runtime
  and repo context. This helper narrows the review to explicitly supplied
  candidate local work items.
- Cockpit copied-packet validation:
  Cockpit copied-packet validation remains packet/local-context validation
  only. This helper does not add Cockpit UI, route behavior, persistence, or
  operator controls.

## Inputs

The helper reads the first available input source:

1. `AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT`
2. `--file <path>` or `--file=<path>`
3. stdin

Combined JSON shape:

```json
{
  "packet": { "schema": "augnes.ag_work_resume_packet.v0_2" },
  "candidates": [
    {
      "candidate_id": "local-candidate-1",
      "local_scope": "project:augnes",
      "local_work_id": "AG-LOCAL-1",
      "title": "Local work title",
      "status": "in_progress",
      "next_action": "Review mapping proposal",
      "related_state_keys": []
    }
  ],
  "selected_candidate_id": "local-candidate-1",
  "strict": false,
  "source": {
    "reviewed_by_surface": "local_helper",
    "reviewed_at": "2026-05-31T00:00:00.000Z"
  }
}
```

`candidates` are explicit Local B candidate work items. The helper does not
discover local work, read an Augnes runtime, inspect Git, call `codex:read-brief`,
or infer a mapping.

## Flags

- `--strict`: forces strict repo interpretation. It can make dirty worktrees,
  unreachable base commits, or missing expected files become proposal conflicts.
  It never loosens `strict: true` supplied in JSON.
- `--json`: accepted for explicit JSON mode. JSON output is already the
  default.
- `--help`: prints usage text.
- `--file <path>`: reads combined JSON from a file if the environment variable
  is not set.

## Output

The helper prints one deterministic JSON object to stdout:

```json
{
  "ok": true,
  "helper": "ag_work_resume_mapping_proposal_preview.v0_1",
  "strict": false,
  "input_mode": "env",
  "preview": { "preview_kind": "ag_work_resume_mapping_proposal_preview" },
  "recommended_next_step": "User/Core should review whether the foreign work maps to the selected local work item. Do not create a mapping record or import context from this helper output."
}
```

Warnings, gaps, and conflicts are summarized on stderr. `ok: true` means only
that helper execution completed and produced a non-blocking preview. It does
not mean mapping is confirmed, import is allowed, proof/evidence may be
recorded, a session may be bound, or Codex can execute.

## Exit Codes

- Missing input: exit 2.
- Malformed args: exit 2.
- Unreadable file: exit 2.
- Invalid JSON: exit 1.
- Missing packet object: exit 1.
- Invalid candidates shape: exit 1.
- Preview status `blocked`: exit 1.
- Preview status `conflict`: exit 1.
- Preview status `needs_candidate`: exit 0.
- Preview status `candidate_review`: exit 0.

`needs_candidate` exits zero because the helper successfully produced a
read-only preview saying more explicit Local B candidate context is required.

## Local Workflow

1. Build or receive an AG Resume Packet.
2. Run or confirm `ag:resume-preflight` for the packet.
3. Collect explicit Local B candidate work item facts from a trusted local
   review surface.
4. Run `ag:resume-mapping-preview`.
5. User/Core reviews the candidate comparison, gaps, conflicts, foreign refs,
   and authority boundary.
6. Do not create mapping records, import context, proof/evidence, sessions, or
   Codex execution from this helper output.

## Examples

Environment input:

```bash
AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT="$(cat mapping-proposal-input.json)" npm run ag:resume-mapping-preview
```

File input:

```bash
npm run ag:resume-mapping-preview -- --file mapping-proposal-input.json
```

Stdin input:

```bash
cat mapping-proposal-input.json | npm run ag:resume-mapping-preview -- --json
```

Strict mode:

```bash
npm run ag:resume-mapping-preview -- --strict --file mapping-proposal-input.json
```

## Authority Boundary

- The local helper is read-only.
- Proposal-only.
- No route.
- No DB/schema changes.
- No persistence.
- No import.
- No mapping record creation.
- No import record creation.
- No work item creation.
- No proof/evidence recording.
- No session binding.
- No Direct Resume Code.
- No relay.
- No Codex execution.
- No approval, publish, retry, replay, external posting, merge, auto-merge, or
  committed-state mutation.
- No localStorage, sessionStorage, indexedDB persistence.
- No telemetry or analytics.

Foreign refs remain foreign. The helper does not convert packet action,
evidence, evidence-pack, proof, or session refs into local records.

Durable approval remains user/Core gated.

## Non-Goals

This helper does not add runtime behavior, API routes, route write behavior,
database/schema changes, MCP/App tool schema changes, bridge tools, Cockpit UI,
ChatGPT App cards, persistent import, Direct Resume Code create/resolve routes,
relay behavior, proof/evidence recording, work event creation, session binding,
work item creation, mapping record creation, import record creation, approval,
publish, retry, replay, external posting, merge, auto-merge, Codex execution
controls, local storage persistence, telemetry, analytics, or committed-state
mutation.

## Future Note

A later user/Core-scoped PR may add a read-only route or UI surface for this
same Stage A preview. Any future persistence, mapping confirmation, import,
proof/evidence, session binding, or Codex continuation remains separately
gated and is not authorized by this helper.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-mapping-proposal-preview-helper
npm run smoke:ag-work-resume-mapping-proposal-preview
node --check scripts/ag-work-resume-mapping-proposal-preview.mjs
node --check scripts/smoke-ag-work-resume-mapping-proposal-preview-helper.mjs
git diff --check
```

Browser verification is skipped for this slice with:

```text
browser verification skipped: no rendered UI/operator surface changed in this local helper/docs/smoke slice
```
