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

The #1448 correction permits only an issuer's first explicit withdrawal of an
existing grant beyond this limit. At most 512 grants can occupy the original
budget, each with at most one additional revocation, so the absolute bound is
1,024 records. Complete reads observe at most 1,025 rows to detect overflow,
validate every observed row and its immutable reference, and refuse an ordinary
record or duplicate revocation after the first 512 insertions. Historical views
then select their original timestamp cutoff. No tail is ignored. Existing
per-record size/shape limits remain unchanged; no table, format or schema migration
is introduced. Legitimate earlier duplicate revocations within the first 512
records retain their bytes and interpretation. A newly authenticated duplicate
revoke returns the original attributed revocation without appending; a replayed
session nonce remains refused.

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

There is currently no supported capacity-releasing continuation for an exhausted
native project that transparently retains its complete history and authority
semantics. A genuinely separate project is separately scoped work; copying a
summary, changing an identity, removing history or resetting a counter is not
continuation of the original. Retain the original store and verified preservation
material when another revision cannot fit. Restore is recovery, not expansion.
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
