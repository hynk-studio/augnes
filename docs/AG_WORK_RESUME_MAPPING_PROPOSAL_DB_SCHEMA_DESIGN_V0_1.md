# AG Work Resume Mapping Proposal DB Schema Design v0.1

## Status

This document is design-only. It defines a Stage B AG Resume mapping proposal
DB/schema design for a possible future SQLite table, before any implementation
exists.

This document adds no implementation, no schema change, no migration, no route,
no UI, no persistence, no proposal record creation, no confirmed mapping, no
import, no proof/evidence recording, no session binding, no Codex execution,
and no approval, publish, retry, replay, merge, or state mutation authority.

This PR does not modify `lib/db/schema.sql`, `scripts/db-migrate.mjs`,
`scripts/db-migrations.mjs`, DB implementation files, route code, runtime
helpers, Cockpit UI, MCP/App tools, bridge tools, ChatGPT App widgets, hooks,
plugins, skills, secret handling, telemetry, or local storage behavior.

Durable approval remains user/Core gated.

## Purpose

PR #297 defined the Stage B mapping proposal record contract in
`docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_DESIGN_V0_1.md`. That contract
names the proposal-only record shape and authority boundary, but it does not
implement storage.

This document translates that Stage B proposal record contract into a possible
future SQLite schema and migration design for
`ag_work_resume_mapping_proposals`. It is a precursor to any actual DB/schema
PR, not implementation authorization.

The goal is to settle table name, columns, status constraints, JSON text
fields, indexes, uniqueness/idempotency expectations, migration approach,
rollback/backfill expectations, validation boundaries, future smoke
expectations, write-route preconditions, read model considerations, and
authority boundaries before a schema implementation PR exists.

## Relationship To Current DB Architecture

The current Augnes DB pattern is:

- `scripts/db-migrate.mjs` reads `lib/db/schema.sql` and executes it.
- `scripts/db-migrate.mjs` then runs targeted migration helpers from
  `scripts/db-migrations.mjs`.
- Persistent base tables and indexes live in `lib/db/schema.sql`.
- Migration helpers handle additive and idempotent compatibility details for
  existing DBs.
- `scripts/db-common.mjs` uses the same schema file and migration helpers when
  initializing or resetting a database.

This PR does not change `lib/db/schema.sql`, `scripts/db-migrate.mjs`,
`scripts/db-migrations.mjs`, `scripts/db-common.mjs`, or any DB implementation
file. It only documents a future design.

## Proposed Future Table Name

- Future table name: `ag_work_resume_mapping_proposals`
- Future record kind: `ag_work_resume_mapping_proposal`
- Future schema value: `augnes.ag_work_resume_mapping_proposal.v0_1`
- Future status enum:
  - `proposed`
  - `needs_review`
  - `superseded`
  - `withdrawn`
  - `rejected`
  - `expired`

The future Stage B table must explicitly have no `confirmed` status. Confirmed
mapping belongs to Stage C, not this proposal table.

## Proposed Future SQL Shape

The following SQL sketch is plain text for future design review. It is not
executed by this PR and is not schema implementation.

```sql
CREATE TABLE IF NOT EXISTS ag_work_resume_mapping_proposals (
  proposal_id TEXT PRIMARY KEY,
  record_kind TEXT NOT NULL CHECK (
    record_kind = 'ag_work_resume_mapping_proposal'
  ),
  schema TEXT NOT NULL CHECK (
    schema = 'augnes.ag_work_resume_mapping_proposal.v0_1'
  ),
  status TEXT NOT NULL CHECK (
    status IN (
      'proposed',
      'needs_review',
      'superseded',
      'withdrawn',
      'rejected',
      'expired'
    )
  ),
  foreign_scope TEXT NOT NULL,
  foreign_work_id TEXT NOT NULL,
  foreign_title TEXT NOT NULL,
  foreign_status TEXT,
  foreign_next_action TEXT,
  candidate_local_scope TEXT NOT NULL,
  candidate_local_work_id TEXT NOT NULL,
  candidate_title TEXT NOT NULL,
  candidate_status TEXT,
  candidate_next_action TEXT,
  packet_id TEXT NOT NULL,
  packet_hash TEXT NOT NULL,
  source_runtime_instance_id TEXT,
  source_packet_created_at TEXT,
  proposal_preview_id TEXT NOT NULL,
  proposal_preview_hash TEXT NOT NULL,
  match_confidence_label TEXT,
  comparison_summary TEXT NOT NULL DEFAULT '[]',
  gaps_summary TEXT NOT NULL DEFAULT '[]',
  conflicts_summary TEXT NOT NULL DEFAULT '[]',
  questions_summary TEXT NOT NULL DEFAULT '[]',
  foreign_refs_summary TEXT NOT NULL DEFAULT '{}',
  repo_context_summary TEXT NOT NULL DEFAULT '{}',
  redaction_summary TEXT NOT NULL DEFAULT '{}',
  proposed_by TEXT NOT NULL,
  proposed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  proposal_reason TEXT NOT NULL,
  expires_at TEXT,
  supersedes_proposal_id TEXT,
  superseded_by_proposal_id TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_note TEXT,
  authority_boundary TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
```

JSON-ish values are stored as `TEXT` containing JSON, consistent with existing
`schema.sql` patterns where arrays and objects are stored in text columns such
as `related_state_keys TEXT NOT NULL DEFAULT '[]'`, `links TEXT NOT NULL
DEFAULT '{}'`, `authority_boundaries TEXT NOT NULL DEFAULT '[]'`, and
`metadata TEXT NOT NULL DEFAULT '{}'`.

The JSON text fields in this future table are:

- `comparison_summary`
- `gaps_summary`
- `conflicts_summary`
- `questions_summary`
- `foreign_refs_summary`
- `repo_context_summary`
- `redaction_summary`
- `authority_boundary`

## Proposed Future Indexes

Future indexes should support the expected Stage B read and review patterns:

- by foreign work: `foreign_scope`, `foreign_work_id`, `created_at DESC`
- by candidate: `candidate_local_scope`, `candidate_local_work_id`,
  `created_at DESC`
- by status: `status`, `created_at DESC`
- by packet: `packet_id`, `packet_hash`
- by proposal preview: `proposal_preview_id`, `proposal_preview_hash`
- by expiry: `expires_at`
- by supersession: `supersedes_proposal_id` and
  `superseded_by_proposal_id`

```sql
CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_foreign_work_time
  ON ag_work_resume_mapping_proposals(
    foreign_scope,
    foreign_work_id,
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_candidate_time
  ON ag_work_resume_mapping_proposals(
    candidate_local_scope,
    candidate_local_work_id,
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_status_time
  ON ag_work_resume_mapping_proposals(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_packet_hash
  ON ag_work_resume_mapping_proposals(packet_id, packet_hash);

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_preview_hash
  ON ag_work_resume_mapping_proposals(
    proposal_preview_id,
    proposal_preview_hash
  );

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_expires_at
  ON ag_work_resume_mapping_proposals(expires_at);

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_supersedes
  ON ag_work_resume_mapping_proposals(supersedes_proposal_id);

CREATE INDEX IF NOT EXISTS idx_ag_mapping_proposals_superseded_by
  ON ag_work_resume_mapping_proposals(superseded_by_proposal_id);
```

Future uniqueness/idempotency recommendation:

- Prevent duplicate active proposals for the same `foreign_scope`,
  `foreign_work_id`, `candidate_local_scope`, and `candidate_local_work_id`
  when status is `proposed` or `needs_review`.
- A SQLite partial unique index may be considered for that active-proposal
  policy.
- If a partial unique index is avoided, enforce the same rule in a future write
  route inside one transaction.
- This PR does not implement a partial unique index or route-level transaction
  enforcement.

## Proposed Future Migration Approach

A future implementation PR should:

- add a `CREATE TABLE IF NOT EXISTS` block to `lib/db/schema.sql`
- add `CREATE INDEX IF NOT EXISTS` blocks to `lib/db/schema.sql`
- add or update a migration helper only if needed for existing DB compatibility
- keep the migration idempotent
- verify `npm run db:migrate` works on empty DBs and existing DBs
- avoid destructive migration
- avoid dropping, rewriting, or backfilling unrelated tables
- avoid any backfill that creates records automatically
- avoid introducing a write route in the schema PR unless separately scoped by
  user/Core
- avoid proof/evidence/session/Codex side effects

If a helper is needed, it should follow existing patterns in
`scripts/db-migrations.mjs`: check whether the table/index already exists, use
`CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` where possible,
return a concrete result summary, and be safe to run more than once.

Rollback planning should be explicit in the future implementation PR. Since
SQLite schema rollback often means a new migration instead of destructive
rollback, the future PR should document whether rollback is not supported,
requires a forward correction, or is limited to local disposable DB reset.

## Proposed Future Validation Rules

Before inserting any future proposal row, validation must require:

- packet passed strict preflight
- `packet_id` and `packet_hash` are present
- `proposal_preview_id` and `proposal_preview_hash` are present
- selected candidate is explicit
- status must not be `confirmed`
- no blocked preview
- conflict preview default blocks proposal record creation unless a future
  policy explicitly allows conflict-for-review
- unsafe target policy blocks
- expired packet blocks
- redaction flags or unsafe content blocks
- user/Core explicit request required
- `proposed_by` required
- `proposal_reason` required
- no hidden auto-create

The future insert path must also validate that JSON text fields are parseable
as the intended array or object shapes before persistence. It must not silently
correct packet content, candidate identity, preview hashes, redaction
summaries, or authority boundary text.

## Authority Boundary

- Schema design is not implementation.
- Table design is not approval.
- Future proposal row is not confirmed mapping.
- Future proposal row is not import.
- Future proposal row is not proof/evidence.
- Future proposal row is not session binding.
- Future proposal row is not Codex execution.
- Future proposal row is not approval, publish, retry, replay, or merge.
- Future proposal row is not committed project state beyond the proposal record
  itself, if a future user/Core-approved schema and write route exist.
- Durable approval remains user/Core gated.

This design does not grant schema implementation authority, migration
authorization, mapping confirmation, import authorization, proof/evidence
authorization, session binding authority, Codex execution authority,
publish/retry/replay authority, or merge authority.

## Future Write-Route Separation

A DB/schema PR should not include a write route unless user/Core separately
approves that scope. If a future write route is added later, it must be a
separate PR or an explicitly scoped PR.

Any future write route must:

- use a transaction
- enforce the duplicate active proposal policy
- require all validation rules from this design and the Stage B proposal record
  design
- return HTTP 201 only for proposal record creation, not mapping confirmation
- not create confirmed mapping records
- not create import records
- not create work items
- not create proof records or evidence rows
- not bind sessions
- not create Codex execution state

## Future Read Model Considerations

Possible future read queries include:

- list proposals by foreign work
- list proposals by candidate local work
- list active proposals
- list expired proposals
- fetch by `proposal_id`
- fetch by `packet_id` and `packet_hash`

This PR implements no read route, no read helper, no runtime read model, no
Cockpit surface, no MCP/App tool, and no ChatGPT App card.

## Future Tests And Smokes For Implementation PR

A future schema implementation PR must test:

- empty DB migration creates table and indexes
- existing DB migration is idempotent
- status `CHECK` rejects `confirmed`
- JSON text defaults exist
- duplicate active proposal policy is tested if implemented
- no other tables are mutated
- no route/UI/write behavior added
- `db:migrate` output reports table/index status
- `git diff --check`
- `npm run typecheck`
- existing AG Resume smokes still pass

If the future PR adds only schema, browser verification should remain skipped
with a concrete docs/schema-only reason. If it adds any UI or rendered
operator surface, browser verification becomes required.

## Foreign Refs And Redaction Storage

Future rows may store only bounded summaries, not raw foreign
proof/evidence/session payloads.

The future proposal table must not store:

- raw secrets
- raw DB paths
- tunnel URLs
- local absolute paths
- screenshots/media
- raw OpenAI responses
- private key material
- raw unredacted packet payloads that failed the packet redaction policy

Foreign refs remain foreign. Reconciliation remains a separate future
authority gate. A proposal row must not convert foreign action, proof,
evidence, evidence-pack, session, handoff, Git, or PR refs into local
proof/evidence/session records.

## Expiration And Supersession Design

`expires_at` is nullable. A null value means no proposal expiry has been set by
the future write policy.

Expired proposals stay records but inactive. Supersession relationships through
`supersedes_proposal_id` and `superseded_by_proposal_id` are trace only.
Supersession does not confirm mapping.

`updated_at` should change when proposal lifecycle changes in a future write
route. This PR adds no auto-expiry job, no lifecycle updater, no route, and no
storage behavior.

## Open User/Core Decisions

- exact expiry default
- whether conflict-for-review proposal records are allowed
- whether partial unique index or route-level transaction enforcement is
  preferred
- whether `proposal_reason` should be free text or enum
- whether `proposed_by` and `reviewed_by` should reference agents/users or
  remain text
- whether future schema PR may include only schema or schema plus a read helper
- whether Stage C confirmed mapping should share this table or be a separate
  table; recommendation: Stage C confirmed mapping should be a separate table

## Non-Goals

- no implementation
- no schema change
- no migration
- no route
- no UI
- no persistence
- no proposal record creation
- no confirmed mapping
- no import
- no proof/evidence/session
- no Codex
- no Direct Resume Code
- no relay
- no approval, merge, or state mutation

This design does not add DB/schema changes, migrations, API routes, route
behavior changes, runtime discovery, runtime state writes, route-side DB reads,
route writes, record writers, MCP/App tool schema changes, bridge tools,
ChatGPT App cards, Cockpit UI changes, persistent import, Direct Resume Code
create/resolve routes, relay behavior, proof/evidence recording, work event
creation, work item creation, mapping proposal record creation, confirmed
mapping record creation, import record creation, session binding, approval,
publish, retry, replay, external posting, merge, auto-merge, Codex execution
controls, localStorage/sessionStorage/indexedDB persistence, telemetry,
analytics, or committed-state mutation.

## Next Suggested Implementation

If user/Core approves a follow-up, the next PR could implement DB/schema and
migration for `ag_work_resume_mapping_proposals` while still adding no write
route. Another valid next step is to continue Stage A real-packet dogfood
without persistence.

This design document itself does not authorize implementation.
