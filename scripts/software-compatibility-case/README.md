# Historical public-status compatibility case

This runnable **preparation case** uses two exact historical Augnes source
snapshots. It discriminates a real source-level public-text admission change
while preserving the strict repository-path contract. It is a constructed
present-day application, not discovery of a new production defect, an
independently authored repair, or official SWE-Sweep evaluation. All methods,
fixtures and foils shipped here are exposed developer material. No model
consumer, fresh-successor use or comparative advantage is established.

With the exact Node version in the repository's `.node-version`, from this directory:

```sh
npm ci --ignore-scripts --no-audit --no-fund
node controls.mjs /absolute/initially-absent/control-results
node check.mjs a evaluator/a-control.json
node check.mjs b evaluator/b-control.json
node runner.mjs snapshots/a evaluator/operations.json /absolute/absent-a.json
node runner.mjs snapshots/b evaluator/operations.json /absolute/absent-b.json
```

`controls.mjs` runs the same 41 JSON operations in A and B, records original
values/errors and import traces, checks valid A/B developer outputs, rejects
five consequential wrong outputs, audits exports and collision refusal, tests
loader drift/missing-file/alias refusal and B error-class identity, and executes
the supplied developer audit method in a fresh private-HOME/temp subprocess.
That replay derives its manifest from B's actual batch and revision into an
absent output; the independent checker verifies original and replay semantics.
It is a deterministic development control, never an actual B observation.

## Provenance and executable boundary

| Snapshot | Exact commit | Commit date | Role |
| --- | --- | --- | --- |
| A | a30f64a6711a8b821396b8f23ab4b755e74a7974 | 2026-09-11T07:54:07Z | older source |
| B | 347bec0c1d6a7085c04e27023a8c7715489f4a7f | 2026-09-11T11:07:42Z | direct child, historical repair |

`snapshots/manifest.json` records trees, Git blob IDs, byte sizes and SHA-256.
The six files per snapshot are exact original bytes with `.txt` appended to
their original `.ts` filenames so repository-wide TypeScript compilation does
not treat historical types as current source. The loader resolves the original
logical names; it does not alter source bytes or validator inputs. Runtime
closure is six modules, `node:path`, `node:crypto` and `Buffer`. Extra historical
imports are type-only. Locked TypeScript 6.0.3 transforms parameter properties
and default-import interop; its executable compiler bytes are hash-pinned.
The loader checks every source's hash, physical path and regular-file identity,
uses snapshot-local aliases, has no current-checkout fallback, and maintains a
separate module cache per load. It preserves original JSON values and returns
original normalization/error codes. Unexpected exceptions remain execution
errors, distinct from admission refusals. This is JSON-representable-input
execution on the recorded Node/platform, not full TypeScript typechecking,
request admission, arbitrary host emulation or hostile-code sandboxing.

The independent expected tables were authored from the historical contracts,
not sampled from runner outputs. B's repair documentation/tests define the
prose-label boundary; they and its fix narrative are evaluator-only provenance,
not consumer exports. Strict file fields keep rejecting rooted, drive-qualified
and escaping paths. Prose with a real embedded path or synthetic credential
remains forbidden. Earlier guards may determine the refusal code first.
Bounded synthetic full result packets also cover binding, timing, byte/count
limits, relative artifact paths, skipped required checks and unknown remote
state. The minimal request **projection** contains every request field read by
the result validator; no full request-admission claim is made.

## Distinct future tasks and independent acceptance

A's new brief permits only declared public-description separator/whitespace
formatting while retaining the exact remaining characters, fields, facts,
uncertainty and skipped-check meaning. Its checker independently compares those
facts and also requires actual A source admission. The supplied formatted A
output is one DEVELOPER-AUTHORED CONTROL, not a prescribed consumer workaround.

B audits a new 16-packet batch against B, returning every acceptance/refusal
and normalized file field without rewriting accepted authored descriptions.
`b-oracle.json` independently pins all required rows and complete accepted packet
values. The checker never uses a consumer root or output as its judging basis;
`freeze-ready.json` binds the original source/input/oracle/checker/brief files,
which are verified before acceptance and after controls. Missing or aliased
originals fail. The obsolete-formatting foil demonstrates B's new preservation
obligation, separately from the same-input source-evolution matrix. Guard bypass,
missing results, false completeness and uncanonical paths are separately refused.
No ambiguous extra prose is graded by an undisclosed language rule.

Both briefs and synthetic requirements were authored on 2026-10-23. A future A
would first receive only A; a future fresh B would later receive B's implementation
and distinct requirements. Commit dates are historical dates, not dates when a
constructed consumer knew either source. No live settings, order or budget are
invented: a future trial would need separate authority and prospective freeze.

## Mechanical access and transfer

```sh
node transfer.mjs a /absolute/absent-a-export > /absolute/a-inventory.json
node transfer.mjs b /absolute/settled-a /absolute/absent-b-export /absolute/settled-a-inventory.json
```

A exports exactly 12 files: its brief/facts, runner, dependency package/lock,
and its six sources plus source manifest. No evaluator fixtures, developer
methods/foils, B implementation, repair tests/docs or parent `.git` are exported.
Archive/hash the whole settled A before handoff, including failed methods and
original outputs. Transfer every permitted file, excluding only the predeclared
infrastructure directories `node_modules/` and `.runtime/`; no useful-file
selection or coordinator revision is allowed. Capture the actual settled
inventory with `inventory()` before calling transfer. B adds exactly nine files:
six B sources, its manifest, `b-input/batch.json`, and `B_BRIEF.md`.
Exclusive copies refuse any collision, including predecessor-authored collisions.
Keep the original settled A archive unchanged; B revisions belong in new files.
No transcript, evaluator answers, other arm or checker feedback transfers.

This is declared protocol separation on a shared user filesystem. It is not OS
isolation. A future B acceptance additionally requires independent method
inspection, its exact command/dependencies and faithful fresh contained-process
replay against hash-verified preserved inputs into a distinct absent output,
with independent original/replay checking. Missing work must remain missing.

## Interpretation and next decision

Retain this discriminating regression case. Ordinary adaptive notes/files/code
remain the default. No concrete additional intervention with a consequential
expected advantage has been identified; end the comparative branch rather than
commission a model trial solely to reproduce scripted compatibility results.
Preparation, prior meter SIMPLIFY, source qualification, consumer capability,
comparative usefulness and normal product integration remain separate.
