# AG Work Resume Mapping Proposal Preview v0.1

## Purpose

`lib/ag-work-resume-mapping-proposal-preview.ts` provides a pure read-only
mapping proposal preview helper for AG Resume. It compares an already
validated AG Resume Packet's foreign work identity with explicitly supplied
Local B candidate work items and returns deterministic proposal-only review
metadata for user/Core judgment.

The helper does not discover local context. It does not confirm a mapping. It
does not import, persist, record proof/evidence, bind sessions, create work,
start Codex, approve, publish, retry, replay, merge, or mutate committed state.

## Relationship To Existing Pieces

- Mapping/import authority gate design:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` defines future
  gated stages. This helper implements Stage A mapping proposal preview only:
  read-only, no persistence, and no mapping/import authority.
- Local helper:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_HELPER_V0_1.md` documents the
  local `ag:resume-mapping-preview` wrapper around this pure function. It
  remains read-only and proposal-only.
- Read-only route:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_ROUTE_V0_1.md` documents the
  `POST /api/ag-work-resume/mapping-proposal-preview` route. It remains
  read-only and proposal-only.
- Packet preflight: `ag:resume-preflight` remains the validation contract for
  packet shape, redaction, target policy, and unsafe content. Mapping proposal
  preview assumes a packet has already passed preflight, while still blocking
  unsafe target policy values if they reach the helper.
- Target preview: `lib/ag-work-resume-target-preview.ts` checks a packet
  against Local B runtime/repo/mapping context. This helper narrows the next
  question to candidate local work comparison and mapping proposal review.
- Cockpit copied-packet validation: the Cockpit validation flow remains
  packet-only and read-only. It does not create or confirm mapping proposals.

## Inputs

`AgWorkResumeMappingProposalPreviewInput` includes:

- `packet`: an already validated `AgWorkResumePacketV02`.
- `candidates`: explicit Local B candidate work items.
- `selected_candidate_id`: optional candidate id to review.
- `strict`: optional stricter repo interpretation.
- `source`: optional review-surface metadata such as `cockpit`,
  `local_helper`, `route`, `chatgpt_app`, `codex`, or `unknown`.

Candidate work items include explicit local scope/work id, title, status,
next action, related state keys, optional summary/priority/source, optional
work brief availability, optional `codex:read-brief` availability, and optional
repo match facts supplied by the caller.

## Output

`AgWorkResumeMappingProposalPreview` returns:

- `preview_kind` and schema.
- A deterministic `proposal_preview_id` labelled as preview-only, not a record
  id.
- Preview status.
- `ok_for_user_core_review`.
- Packet summary.
- Candidate summaries.
- Selected candidate summary, or `null`.
- Comparison labels for scope, work id, title, status, next action, related
  state keys, and repo context.
- Gaps.
- Conflicts.
- User/Core questions.
- Recommendations.
- Foreign refs summary.
- Authority boundary.
- Next step.

Comparison labels are deterministic: `exact`, `differs`, `missing`,
`overlaps`, `no_overlap`, or `not_supplied`.

The match confidence label is advisory only. It is not a decision, not
mapping confirmation, and not implementation authority.

## Status Semantics

- `needs_candidate`: no candidates were supplied, multiple candidates were
  supplied without a selected candidate id, or the selected candidate id was
  not found.
- `candidate_review`: one selected candidate can be reviewed by user/Core, with
  no blocking conflicts. This does not confirm mapping.
- `conflict`: a selected candidate exists, but identity, work-field, or repo
  comparison has conflicts requiring user/Core resolution.
- `blocked`: unsafe packet target policy or packet shape issue makes proposal
  preview unsafe.

`ok_for_user_core_review` means only that it is okay to review a mapping
proposal. It is not mapping confirmation, not import authorization, not
persistence authority, and not Codex execution authority.

## Candidate Selection

- No candidates produces `needs_candidate` with a gap and recommendation to
  provide explicit Local B candidate work item context.
- One candidate without `selected_candidate_id` is selected deterministically,
  but user/Core still must review it.
- Multiple candidates without `selected_candidate_id` produces
  `needs_candidate` and asks which local work item should be reviewed.
- A missing `selected_candidate_id` match produces `needs_candidate` and a gap
  naming the missing selected candidate id.

## Repo And Identity Comparison

The helper compares:

- packet `source_work.scope` vs candidate `local_scope`
- packet `source_work.work_id` vs candidate `local_work_id`
- title
- status
- next action
- related state key overlap
- optional repo facts supplied by the caller

Repo facts are never discovered by the helper. `remote_matches: false` is a
conflict. `base_commit_reachable: false` is a gap by default and a conflict in
strict mode. `dirty_worktree: true` is a warning gap by default and a conflict
in strict mode. Missing expected files are warning gaps by default and
conflicts in strict mode.

## Foreign Refs

Foreign action, evidence, evidence-pack, proof, and session refs remain
foreign. The helper does not convert them into local proof records, local
evidence rows, local evidence packs, or bound local sessions.
Foreign refs remain foreign.

The output explicitly reports:

- `local_proof_records_created: false`
- `local_evidence_records_created: false`
- `local_sessions_bound: false`

Foreign refs remain context-only until a separate reconciliation authority gate
exists.

## Invalid And Preflight-Failing Packets

Malformed and preflight-failing packets should not reach mapping proposal
review. If an unsafe packet target policy reaches the helper, the helper fails
closed with `blocked`.

Preflight remains the source for packet validation. This helper is an
additional proposal-preview guard, not a replacement for `ag:resume-preflight`.

## Authority Boundary

- Read-only.
- Proposal-only.
- No mapping record.
- No import record.
- No persistence.
- No work item creation.
- No proof/evidence recording.
- No session binding.
- No Direct Resume Code.
- No relay.
- No Codex execution.
- No approval, publish, retry, replay, merge, or committed-state mutation.
- No localStorage, sessionStorage, indexedDB persistence, telemetry, or
  analytics.

Mapping proposal preview is review metadata only. It is not mapping
confirmation, not import, not persistence, not proof/evidence authorization,
not Codex execution authority, and not merge/publish authority. Durable
approval remains user/Core gated.

## Local Helper

`ag:resume-mapping-preview` is the local helper around this pure function. It
reads combined JSON from an environment variable, file, or stdin, assumes
packet preflight already ran, and does not import, persist, create mappings,
record proof/evidence, bind sessions, or start Codex.

Earlier plan: a later PR may add a local helper around this pure function.
This slice is that local helper.

## Future Work

Earlier plan: a later PR may add a read-only route after user/Core scopes that
surface. This slice is that read-only route.

A later PR may add Cockpit or ChatGPT App read-only surfaces after user/Core
scopes that surface.

Only much later, after user/Core approval, may a persistence/schema design be
considered for mapping or imported context records.

Each future stage remains separately gated. No preview status implies mapping
confirmation, import permission, proof/evidence permission, session binding, or
Codex continuation.

## Non-Goals

- No runtime calls.
- No route.
- No DB/schema changes.
- No UI.
- No Cockpit component changes.
- No MCP/App tool schema changes.
- No ChatGPT App card.
- No mapping/import/persistence.
- No mapping records.
- No import records.
- No work item creation.
- No proof/evidence/session behavior.
- No Direct Resume Code.
- No relay.
- No Codex execution controls.
- No approval, publish, retry, replay, external posting, merge, auto-merge, or
  committed-state mutation.

## Verification

Run:

```bash
npm run typecheck
npm run smoke:ag-work-resume-mapping-proposal-preview-helper
npm run smoke:ag-work-resume-mapping-proposal-preview
npm run smoke:ag-work-resume-mapping-import-authority-gate
npm run smoke:ag-work-resume-target-preview
npm run smoke:ag-work-resume-packet-builder-preview
npm run smoke:ag-work-resume-packet-preflight
node --check scripts/ag-work-resume-mapping-proposal-preview.mjs
node --check scripts/smoke-ag-work-resume-mapping-proposal-preview-helper.mjs
node --check scripts/smoke-ag-work-resume-mapping-proposal-preview.mjs
git diff --check
```

Browser verification is skipped for this slice with:

```text
browser verification skipped: no rendered UI/operator surface changed in this pure helper/docs/smoke slice
```
