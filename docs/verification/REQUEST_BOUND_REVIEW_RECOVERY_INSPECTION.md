# Request-bound review: bounded recovery inspection correction

This is the timeout continuation of #1472 / Draft #1474, after the
[Personal Perspective investigation and compatibility correction](../vnext/research/P5_5_PERSONAL_PERSPECTIVE_LIFECYCLE_REVIEW_V0_1.md).
It changes one recovery inspection operation; the earlier reports and their
results remain historical evidence for their own source candidates.

## Observation and limits

Candidate `c11c132d5c24f6e026a95648447976f96699bc39` failed its one deciding
Full Canonical run: 7 phases passed, integration failed, and 8 were not run.
The request-bound-review child settled at 30,080 ms with `bounded_timeout`
under its registered 30,000 ms deadline. Its last completed checkpoint was
`database_backup` at 18,048 ms. Callback revocation precedes restore, so the
missing restore checkpoint does not establish that restore hung. The receipt
remains failed and its separate validator remains non-deciding.

Two bounded development observations on that implementation completed in
27,945 and 28,087 ms. Neither reproduced the historical timeout. Private,
monotonic function boundaries showed cumulative work rather than a stalled
callback in those observations. The first measured callback revocation at
58.5 ms and restore at 8,502.6 ms. Seventeen recovery inspections performed
34 complete canonical/ordinary-reader passes. Those reader checks accounted
for much of the recovery interval; the preceding request/callback cases also
consumed about 13.6 seconds. Nested durations must not be added together.

The precise cause of the historical deadline overrun remains unknown. Its
missing process/contention observations cannot be reconstructed from the
present host. The compatibility helper has no direct invocation in the
instrumented request-bound-review exercise; indirect resource effects in the
historical integration run remain unmeasured. The historical 28,280 ms pass
does not excuse the failure or justify more time.

## Correction and reuse boundary

`inspectRecoveryDatabaseFile` now binds source validation and serialization
to one read transaction. It still runs the real migrations on its owned
in-memory clone and checks integrity, schema, private-material boundaries,
migration ledger and package identity. Only if the entire migrated serialized
image equals the already validated source image does it reuse that invocation's
canonical/ordinary-reader result. Both images use the existing standalone
SQLite header handling. Any image difference requires the complete second
pass, including ordinary readers.

The captured source transaction fixes the database image across validation
and serialization, including concurrent WAL writes. The synchronous clone is
owned by this inspection; no asynchronous boundary, caller callback or shared
handle can alter it between equality and reuse. This is not a path, process,
file-identity or cross-invocation cache. Every later inspection validates anew.
Backup selection, provenance, permissions, locking, snapshot creation,
publication, post-restore preparation, revocation and cleanup retain their
existing owners and later revalidation.

With the same diagnostic boundaries, the corrected complete child finished
in 23,067 ms under the unchanged deadline. Inspections remained 17, while
complete canonical passes fell from 34 to 17. Backup took 1,802 ms;
restore itself took 4,991.5 ms; callback revocation remained about 59 ms.
This establishes an avoidable-cost mechanism and its removal in the observed
fixture. It does not establish the exact contribution to the historical
timeout or a general latency guarantee. Diagnostic instrumentation is private
and absent from the submitted implementation.

## Regression responsibility

The existing recovery validator owner now asserts one complete pass for an
unchanged semantic-rich image, a fresh pass on the next invocation, and two
passes for the exact supported predecessor schema that migration changes.
It checks source immutability, concurrent WAL snapshot consistency, and a
later refusal after a real reader-incompatible mutation. Existing ordinary
Project Home, Workbench and Inspector round trips, complete lineage,
backup/restore and adversarial refusal cases remain in the same owner.

The new count assertion failed against the preceding implementation. Retained
development failures also include an incomplete predecessor fixture rejected
as unsupported and WAL sidecars left by the new concurrency fixture. The
fixture now matches the complete supported schema and closes its WAL through
SQLite checkpoint/journal operations. Assertions and cleanup requirements
were retained.

Focused owners are `test-request-bound-review.ts` (unchanged 30-second bound),
`test-recovery-canonical-record-validator.ts`, `test-recovery-backup.mjs`,
`test-runtime-database-bootstrap.mjs`, and `test-vnext-project-controls.ts`.
The latter retains all 23 Personal Perspective compatibility cases, including
19 refusals, historical packet preservation and ordinary recovery readers.
Exact candidate qualification and separate receipt validation are reported
on the existing PR; focused timings are not deciding Canonical evidence.

No cases, deadlines, planner selections or scheduling rules were changed.
No schema, authorization, durable recovery meaning or personal lifecycle
contract was added. All mutations use disposable synthetic resources. The
original two-project exercise was not repeated, and no model/provider calls,
personalization benefit or measured human burden are claimed.

## Follow-up: structural statement lifetime

The #1554 continuation found a separate avoidable cost in structural inspection:
the same four parameterized pragma queries were prepared for every schema object.
`buildStructuralSchemaContract` now prepares each query lazily once per
synchronous invocation. It still executes every query with the same object
argument and ordering, normalizes every result, and computes the complete
signature. Statements and results do not survive that invocation. Empty images
do not prepare unused query kinds, and errors retain their original first-use
boundary. This does not change the exact-image recovery reuse described above.

The existing database-access test owner checks the canonical signature, complete
per-query arguments and execution counts, fresh later invocations, a real schema
mutation and refusal, rollback, empty images, and caller ownership after a query
failure. The preparation-count assertion fails on the preceding implementation.
The request-bound-review scenario, its assertions and registered 30-second bound
remain unchanged. Development timings and the historical nested timeout are
separate evidence; reduced preparation work does not reclassify that timeout or
create qualification succession authority.
