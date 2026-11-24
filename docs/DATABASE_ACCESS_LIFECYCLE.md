# Database access and lifecycle ownership

An ordinary main-store operation uses `lib/db.ts::openDatabase()` (or the
shared `lib/db/prepared-database.mjs::openPreparedDatabase(path)`). It connects
to the intended existing file, enables foreign keys for that connection, and
validates readiness in a read transaction. It never creates a directory or file,
runs migrations, or repairs schema. The returned connection remains writable;
its caller owns closure. Failed acquisition closes the constructed connection
before propagating the primary error. If closure also fails, both failures are
retained in an `AggregateError` with the primary failure as its cause.

Readiness uses the existing structural-schema inspector, migration ledger and
package-identity guard. The checked-in expected structural signature is compared
with canonical migration output by `scripts/test-database-access.ts`, registered
through the existing continuity-pins integration check. A schema change must
update that source signature and pass the parity regression. No path-level or
process-level readiness result is cached: each new connection checks its own
image, including after path changes and restore/replacement. This is connection
admission, not a substitute for recovery's full record/invariant validation.

| Consumer | Preparation owner and access boundary |
| --- | --- |
| UI/API reads and writes; CLI consumers of `lib/db.ts` | Ordinary access only. Canonical-store autonomy/research readers and writers, runner-ledger helpers, onboarding and native run helpers no longer prepare schema transitively. |
| Normal source startup and installed Companion | The existing supervisor calls `prepareRuntimeDatabase` before starting its application children. No additional user setup command is required. |
| Distributable installation, upgrade and restart | Existing launcher/supervisor and bootstrap owners retain staged migration, package identity, verification and publication/rollback. Shared inspection/ownership modules are included in package support files. |
| Backup, restore and interrupted recovery | Existing recovery and runtime-bootstrap owners retain exact schema admission, record validation, lock/journal ownership, selection invalidation and restart verification. Ordinary access never initiates recovery. |
| Explicit `db:init`, `db:migrate`, reset/demo and build fixtures | `db-common.mjs` owns explicit creation/configuration; `applyCanonicalDatabaseMigrations` remains the migration orchestrator. `initializeDatabase()` owns an internally opened handle until return; a supplied handle remains owned by its caller, including on failure. |
| Disposable test and dogfood fixtures | Their explicit builders prepare through the canonical migration/bootstrap owner before ordinary access, including runner-ledger path overrides. Tests needing an intentionally partial schema use their own raw, explicitly owned connection. |
| Separate temp-only research/prototype stores | Their explicit store-specific fixture/preparation functions remain separate. They are not accepted as prepared main stores and do not expand bootstrap recovery admission. |

Both explicit CLI initialization and supervised startup use
`scripts/canonical-database-migrations.mjs`. Its complete output already covers
the tables/indexes previously prepared by ordinary main-store access; the
duplicate lazy migrators have been removed. Startup adds staged publication,
record validation and recovery admission around that same orchestrator.
`scripts/augnes-runtime-supervisor-core.mjs` chooses preparation or restore
before launching children. Backup/restore continues through
`scripts/recovery-backup.mjs` and `scripts/runtime-database-bootstrap.mjs`.

## Canonical migration ownership

`scripts/canonical-database-migrations.mjs` remains the synchronous public
preparation entry. It loads the canonical schema, invokes the fixed
`scripts/database-migrations/canonical-compatibility.mjs` composition, normalizes
recovery private material and writes the migration ledger last. The composition
always includes every supported family; it has no selectable profile or registry.
`scripts/db-migrations.mjs` remains a compatibility facade for the existing
migration functions and SQL/constants.

The implementation owners under `scripts/database-migrations/` contain each
family's SQL, necessary helpers, ordered calls and public result assembly:

| Owner | Responsibility |
| --- | --- |
| `historical-compatibility.mjs` | Proposal scoring before and after schema preparation, mailbox rebuilding, session bindings and delivery artifacts. |
| `native-product.mjs` | Durable semantic records, local operator sessions, project identity, repository execution, lifecycle, controls and continuity pins. |
| `review-evidence.mjs` | Verification evidence and temporal review artifacts/idempotency. |
| `research-candidate.mjs` | Manual note previews, result records and global dogfood research migrations. |
| `autonomy-autohunt.mjs` | Delegation grants and historical Autohunt preparation. |
| `perspective-memory.mjs` | Perspective persistence boundaries and items. |

The closed composition owns the ordering between these families, including
conditional proposal work before schema application, native preparation, main
schema, review schema, the external-response transaction, review callback
generation and the later families. Mailbox rebuilding still causes conditional
main-schema reapplication before session/delivery preparation. Each migration
retains its own transaction, refusal and failure behavior; there is no enclosing
transaction. A failure can retain the same earlier progress and cannot silently
complete later families or the ledger. Ordinary access still calls none of these
preparation owners.

Portable-project semantic validation and disposable fixture builders call the
same public preparation entry. Bootstrap and recovery retain their staged
publication, validation and rollback ownership. New distributables copy the
fixed migration module closure listed in `DISTRIBUTABLE_DATABASE_MIGRATION_FILES`;
the verified supervisor bundle includes that closure and still embeds
`__AUGNES_BUNDLED_SCHEMA_SQL__`. The package contract, migration IDs/versions and
schema signatures are unchanged. Historical v2 package manifests retain their
original required-file contract; their pre-split source and bundle do not acquire
a dependency on new support files.

`getDatabasePath()` retains the existing environment/default resolution and build
isolation guard. A missing intended store never redirects to a default store.
`database_missing`, `database_unprepared` (empty or recognized predecessor),
`database_incompatible` (unsupported schema or invalid ledger/identity metadata),
and `database_unavailable` (other connection/setup failures) remain distinct.
The continuity-pins boundary returns a safe 503 and an actionable bounded message,
never an empty successful collection, private path, or raw diagnostic cause.
Internal causes remain available for local diagnosis. Existing request/security
validation runs before storage access.

The raw Next.js child entry is not a lifecycle owner; normal use continues through
the supported supervisor/launcher. This change does not alter tables, record
formats, Core meaning, fingerprints, scoring, project isolation or authority.
Source qualification and installed-runtime adoption remain separate.

## Durable local project organization (#1512)

The project lifecycle migration adds `vnext_project_organization` beside recents
and selection, with one row per canonical project and a trigger for future
identities. The admitted exact predecessor receives working classifications
regardless of recency or folder availability. The shared migration orchestrator,
structural signature/parity check and staged bootstrap remain the only preparation
owners. Ordinary readers refuse unprepared stores and do not fill missing rows.

Archive/unarchive rotates a project's organization observation on change. The
ordered change sequence supports bounded list invalidation without changing
workspace selection when another project is current. State is local organization,
not a Core decision or a history budget. Neither operation edits project data,
changes authority or resolves outstanding effects.

Native backup retains these rows. Restore refreshes their live revisions in the
unpublished stage, preserving classifications and change order. Selection
invalidation, credential suspension, canonical reader validation, atomic
publication and rollback keep their existing owners. Repeated restore cannot
revive a held organization request, even if the caller refreshes selection alone.
The original backup is unchanged; failure before publication preserves live state.
Old binaries require a compatible recovery image, not deletion of organization
metadata to downgrade an existing store. Portable v0.1 excludes local organization:
new import starts working, exact replay preserves the destination state, and no
existing export refusal is relaxed.

## Accumulated native history: refusal and preservation (#1439)

These are separate operation budgets, not a single database capacity. The
[packet-history reader](../lib/vnext/runtime/project-work-packet-history.ts)
counts all TaskContextPackets in one workspace/project, up to 4,096 records
and 16,777,216 UTF-8 bytes of `JSON.stringify(record.payload)`. Core envelopes,
portable packages, credentials and process memory have different accounting.
Saving initial work, revisions, prepared new tasks and later packet-producing
operations consumes this history; a new task in the same project does not reset it.
The [revision transaction](../lib/vnext/runtime/project-work-revision.ts)
reconstructs the resulting history before commit. A refused next revision leaves
the preceding packets and auxiliary records intact. This does not establish that
every packet-producing operation has identical admission behavior.

The [direction store](../lib/vnext/persistence/project-direction-store.ts)
retains the 512-record ordinary append limit per workspace/project. Decisions,
grants, proposals, returned proposals/results, bindings and ordinary renewal
revocations all count; revocation never frees an ordinary slot. A selected binding
consumes a record without a direction edit. Renewal still needs two ordinary
slots in one [transaction](../lib/vnext/runtime/project-direction.ts), so one
remaining slot is insufficient.

Beyond 512 records, the issuer retains one withdrawal per outstanding grant
(#1448), including expired and suspended grants. The complete store holds at
most 1,024 records. Reads observe up to 1,025 to detect overflow. Historical
views validate the entire bounded store before selecting a time. Legacy
duplicate withdrawals within the first 512 retain their original interpretation.
A fresh duplicate request returns its original withdrawal. A replayed session
nonce is refused.

**Save next direction** uses the authenticated human owner's
`continue_decision` operation. It checks the expected decision reference,
the current principal and any proposal being adopted. Each new decision links
to the previous decision and records a SHA-256 fingerprint of the complete
preceding project history in insertion order. A task can explicitly select
that decision as its basis. A new decision or task binding uses one of the
remaining records after reserving all outstanding withdrawals. For example,
512 stored records and one outstanding grant leave 511 records for this work.
At zero available records, the owner can read the saved project and withdraw
outstanding grants. New grants and renewals use the ordinary budget.

Use **Revoke role access** and **Refresh direction** to inspect the saved issuer,
time and reason. Current bearer mutation admission samples trusted time and
rechecks the grant inside its immediate transaction, after any request-body or
database-lock wait. Effects committed before revocation remain historical effects.
The existing inclusive historical cutoff cannot distinguish two events at the
same timestamp. A revoke at or before the grant's last committed use refuses with
`project_direction_revocation_time_conflict` without consuming the session nonce;
refresh and revoke after that recorded time. It does not rewrite or backdate history.
If revocation commits but response readback fails, the route reports
`project_direction_revocation_committed_readback_unavailable`, `committed: true`,
the committed record and the rotated session cookie, without a successful state
projection. A lost acknowledgement may also lose that cookie: establish a fresh
ordinary review session and read the outcome before another mutation. Existing
expiry, sequence/mutation, project/issuer and execution-authority boundaries remain.

Readers predating #1448 retain the same record format and see revocations within
their existing budget. Once the store exceeds 512, their complete reader refuses
it and grant availability fails closed; startup/recovery canonical validation also
refuses it. An older reader cannot silently authorize through an omitted tail.
Use the compatible source for an extended store; rollback does not remove records
to make an older reader accept it.

Readers supporting only #1448 can reopen a legacy withdrawal-only extension.
When a continued decision is present, those readers refuse the unfamiliar
record. Use a compatible reader for that project and its restored checkpoints.
The SQLite schema and all prior record bytes stay intact.

After a refused write, use the ordinary current-work and complete-history readers
to establish what is still available. A current projection, history read, export
and recovery checkpoint are distinct results. Do not treat a failed read as empty
history, or an export from before refusal as proof of current recoverability.
The [portable owner](../lib/vnext/portability/portable-project.ts) has separate
4,096-record and 16 MiB **package** limits: native packet history can remain
readable while its larger portable package is refused. Projects with direction
state explicitly refuse portable export with
`portable_project_direction_not_supported_use_recovery_backup`.

Use the existing **Backups and recovery** workflow to create and explicitly verify
a full database checkpoint, retaining its exact result and any pending/failed
status. A completed restore preserves supported immutable database history and
unresolved obligations, gives selection a fresh observation, and suspends restored
credentials. It does not copy local project files, authenticate imported claims,
renew execution authority, free history capacity, or authorize replay of an
unknown external effect. Retain required local file bodies separately with their
identities. An incomplete backup/restore attempt is not a preserving continuation.

The owner continuation uses room already available within the complete direction
history budget. At that final bound, retain the original store, a verified
checkpoint and required file bodies. Recovery preserves the same used capacity.
A separately created project has its own scope and obligations.
For the separate Web Planning work/history/body limits and supported branching,
see its [continuation guidance](../apps/web_planning/README.md#after-an-accumulated-history-refusal-1439).

The original [#1439](https://github.com/hynk-studio/augnes/issues/1439) observation
and [#1445](https://github.com/hynk-studio/augnes/pull/1445) diagnosis remain history:
at 512 records revocation failed and the unexpired bearer still changed its child.
#1445's original failed qualification, later qualified candidate and diagnostic
evidence are unchanged. [#1448](https://github.com/hynk-studio/augnes/issues/1448)
owns this separate correction and its evidence, not a reinterpretation of those
old results. Neither synthetic boundary tests nor source qualification establish
customer frequency, installed adoption or general history expansion.

A fresh recovery checkpoint preserves the revocations it contains and removes
usable credential secrets under the existing suspension contract. An earlier
checkpoint cannot contain a later withdrawal; restoring it still suspends the old
bearer. Unresolved reconciliation and unknown external effects remain unresolved.
