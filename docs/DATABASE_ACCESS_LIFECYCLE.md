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
allows 512 immutable records per workspace/project, shared by decisions, grants,
proposals, returned proposals/results, packet bindings and revocations. A selected
direction binding consumes a record even without a direction edit. Explicit grant
renewal needs two records, a new grant and the old grant's revocation, in one
[transaction](../lib/vnext/runtime/project-direction.ts). One remaining slot is
insufficient. At 512, `project_direction_history_bound` also refuses revocation;
it does **not** revoke the credential. Existing expiry, mutation and project-scope
checks remain independent. Do not interpret a failed revoke as successful loss of
access or assume another project's available history makes revocation possible.

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

The bounded investigation and next decision belong to
[#1439](https://github.com/hynk-studio/augnes/issues/1439). Its disposable boundary
cases do not establish customer frequency or a project lifespan. Recommend a
bounded follow-up to make issuer revocation usable at exhausted direction history while retaining
the old records, grant attribution, child scope, replay/sequence rules and recovery
suspension. That recommendation does not change current admission or authorize a
general limit increase, retention change or storage redesign.
