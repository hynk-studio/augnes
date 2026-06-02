# Sidecar e_t Trace-Pack Strategy C First-Slice Closeout v0.1

## 1. Status and Scope

Status:

- original-repo docs-only first-slice closeout
- Strategy C stop/go decision-support packet
- non-authoritative
- not new implementation
- not report/compare/suite/matrix behavior
- not runtime promotion
- not CI policy

This document closes out the approved first Strategy C trace-pack slice in the
original repo. It summarizes what has been imported safely, what local
validation now exists, what remains explicitly forbidden, and what decision is
required before any next Strategy C implementation step.

It does not add fixture files, manifest entries, harness scripts, package
scripts, report output, compare behavior, suite behavior, matrix behavior,
runtime Sidecar e_t computation, helper logic, thresholds as runtime policy,
schema/API behavior, Cockpit action behavior, proof/evidence/readiness writes,
QP evidence, `z_t` commits, CI enforcement, or AG Resume bridge, writer,
helper, or route behavior.

Current original-repo snapshot for this closeout:

| field | value |
| --- | --- |
| repo | `hynk-studio/augnes` |
| remote | `https://github.com/hynk-studio/augnes.git` |
| base branch | `main` |
| original `origin/main` SHA | `7a5d70165297dcc55b944998266950413e48494b` |
| comparison time | 2026-06-02 21:21 KST |
| target branch | `codex/sidecar-et-strategy-c-first-slice-closeout` |

Runtime `PerspectiveSnapshot.research_diagnostics.sidecar_e_t` remains a
structured placeholder with `computed=false`.

## 2. Completed First Slice Inventory

The completed first Strategy C slice in the original repo consists only of the
approved files and local smokes below.

Fixture files:

- `fixtures/sidecar-et-trace-pack.example.json`
- `fixtures/sidecar-et-trace-pack.grounded-quiet-probes-v0.1.json`

Manifest:

- `fixtures/sidecar-et-trace-pack.manifest.json`

Smokes:

- `smoke:sidecar-et-trace-pack-fixture-descriptors`
- `smoke:sidecar-et-trace-pack-manifest`

Docs/planning chain:

- upstream alignment:
  `docs/SIDECAR_ET_LAB_UPSTREAM_ALIGNMENT_V0_1.md`
- lab report reference:
  `docs/SIDECAR_ET_LAB_REPORT_REFERENCE_V0_1.md`
- harness adaptation plan:
  `docs/SIDECAR_ET_TRACE_PACK_HARNESS_ADAPTATION_PLAN_V0_1.md`
- manifest appendix:
  `docs/SIDECAR_ET_TRACE_PACK_MANIFEST_APPENDIX_V0_1.md`
- fixture boundary design:
  `docs/SIDECAR_ET_TRACE_PACK_FIXTURE_BOUNDARY_DESIGN_V0_1.md`
- fixture descriptor validation plan:
  `docs/SIDECAR_ET_TRACE_PACK_FIXTURE_DESCRIPTOR_VALIDATION_PLAN_V0_1.md`
- exact fixture descriptor proposal:
  `docs/SIDECAR_ET_TRACE_PACK_EXACT_FIXTURE_DESCRIPTOR_PROPOSAL_V0_1.md`

This inventory does not imply any additional imported pack, runtime behavior,
coverage claim, readiness gate, product policy, or CI requirement.

## 3. Current Routing Boundary

Current manifest version:

- `sidecar_et_trace_pack_manifest.v0.1`

The manifest contains exactly two packs.

Example pack routing:

- path: `fixtures/sidecar-et-trace-pack.example.json`
- kind: `example`
- `default_compare=true`
- `explicit_only=false`
- `expected_trace_count=1`

Grounded/quiet probe routing:

- path: `fixtures/sidecar-et-trace-pack.grounded-quiet-probes-v0.1.json`
- kind: `probe`
- `default_compare=false`
- `explicit_only=true`
- `expected_trace_count=5`

No deferred packs are imported or routed:

- curated
- surprising probes
- medium-tension probes
- recovery-policy probes
- low-evidence-boundary probes
- stress

The routing slice does not add a report command, compare command, suite command,
matrix smoke, runtime helper, runtime computation, or CI policy.

## 4. Current Validation Boundary

`smoke:sidecar-et-trace-pack-fixture-descriptors` proves the approved fixture
subset remains local and review-aid-only:

- exactly the two approved fixture files are present
- fixture version is `sidecar_et_trace_pack.v0.1`
- expected trace counts match the approved first subset
- fixture fields and event kinds stay within the allowed low-cardinality set
- unsupported event kinds, unknown fields, unsupported enums, unsafe timestamps,
  and bad references are rejected
- timestamps are non-decreasing
- references only point to earlier work/action rows where required
- long free text, secret-like strings, raw URLs, absolute paths, raw SQL, and
  raw DB-row patterns are rejected or absent
- runtime `sidecar_e_t` placeholder expectations remain fixture-local
- no fetch/network calls are made
- no DB writes are made
- no bridge/evidence/action/proof/readiness outputs are created
- no QP evidence is created
- no `z_t` commits are created
- no AG Resume writer/helper is called
- no AG Resume writer/helper output dependency is introduced
- no `ag:resume-*` or `smoke:ag-work-resume-*` package-script collision is
  introduced

`smoke:sidecar-et-trace-pack-manifest` proves the current manifest routing
remains constrained:

- manifest version is `sidecar_et_trace_pack_manifest.v0.1`
- exactly two routing entries are present
- expected trace counts match the imported fixture files
- fixture paths are safe relative JSON paths
- `default_compare` is limited to the example pack
- grounded/quiet remains `explicit_only`
- deferred packs are rejected
- manifest negative cases reject invalid versions, bad pack arrays, duplicate
  paths, raw URL paths, absolute paths, path traversal, backslash paths,
  non-JSON paths, unknown fields, unsupported kinds, invalid routing flags,
  accidental grounded/quiet default-compare routing, expected-count mismatch,
  missing fixtures, and deferred pack references
- no fetch/network calls are made
- no DB writes are made
- no AG Resume writer/helper is called
- no proof/evidence/readiness outputs are created
- no QP evidence is created
- no `z_t` commits are created
- no `ag:resume-*` or `smoke:ag-work-resume-*` package-script collision is
  introduced

These smokes validate the local fixture and manifest boundaries only. They do
not validate report output, compare behavior, suite/matrix coverage, runtime
Sidecar e_t computation, product policy, readiness, or CI behavior.

## 5. Explicit Still-Forbidden List

This closeout does not authorize:

- report command
- compare command
- suite command
- matrix smoke
- additional fixtures
- deferred packs
- runtime `sidecar_e_t` computation
- helper import
- threshold runtime policy
- schema/API/Cockpit action changes
- proof/evidence/readiness writes
- QP evidence
- `z_t` commits
- AG Resume bridge/writer/helper/route behavior
- CI enforcement

Any future work that touches these items needs a separate user/PM-approved
scope, changed-file boundary review, validation plan, and rollback criterion.

## 6. AG Resume Isolation Note

AG Resume proof/evidence recording route behavior exists after PR #349. The
Sidecar e_t trace-pack first slice must not call it.

Sidecar fixture and manifest smokes must remain local and non-recording:

- no calls to `createAgWorkResumeProofEvidenceRecordingFromCandidate`
- no wrapping of `npm run ag:resume-proof-evidence-recording-create`
- no dependency on AG Resume proof/evidence recording writer/helper outputs
- no AG Resume proof/evidence recording route calls
- no bridge-table rows
- no `verification_evidence_records`
- no `action_records`
- no proof/evidence/readiness writes
- no QP evidence
- no `z_t` commits

The Sidecar trace-pack first slice remains separate from AG Resume bridge,
writer, helper, route, schema, docs, package-script, and smoke behavior.

## 7. Stop/Go Decision Matrix

| option | status | required approval | required validation | risk | recommended now |
| --- | --- | --- | --- | --- | --- |
| Stop here and observe | Open and safe | No additional approval beyond accepting this closeout | Current fixture and manifest smokes, boundary smokes, diff checks | Low | Yes |
| Add docs-only status/appendix refresh later | Allowed only as docs-only follow-up | User/PM confirms refreshed status scope | Diff checks, relevant docs-boundary smokes, no changed runtime/package/fixture files | Low | Conditional |
| Add report-free descriptor expansion | Blocked until exact pack and descriptor scope are approved | User/PM chooses exact descriptor set and changed-file boundary | Descriptor validation plan, fixture-boundary smoke if fixtures change, AG Resume guard checks | Medium | No |
| Add report command | Blocked | User/PM approves report command name, inputs, output shape, and non-authority wording | Report smoke, fixture/manifest smokes, no DB/write assertions, package script review | Medium to high | No |
| Add compare command | Blocked | User/PM approves default-compare scope and surprising-case handling | Compare smoke, manifest routing smoke, no proof/evidence/readiness/QP/`z_t` assertions | Medium to high | No |
| Add suite/matrix | Blocked | User/PM approves suite/matrix naming, coverage wording, and non-CI boundary | Component smokes first, suite/matrix smoke, boundary smokes, package script review | High | No |
| Add runtime log-only candidate | Blocked | User/PM approves separate runtime decision packet and runtime changed-file boundary | Runtime boundary smokes, AG Resume guard smokes, temp DB checks, browser/computer-use if UI/runtime-facing | Very high | No |

Recommendation:

- stop here, or only add a docs/status refresh if user/PM explicitly approves
  that docs-only scope
- keep report, compare, suite, and matrix behavior blocked for now
- do not start the next Strategy C implementation slice without explicit
  user/PM approval

## 8. Future Implementation Gate

Before any next Strategy C implementation PR:

- user/PM chooses the exact scope
- changed-file boundary is reviewed before editing
- package script names are approved
- browser/computer-use requirement is decided
- AG Resume guard expectations stay green
- runtime placeholder boundary is preserved
- rollback criteria are documented
- original `origin/main` SHA is refreshed
- package-script collision risk is reviewed against `smoke:sidecar-et-*`,
  `ag:resume-*`, and `smoke:ag-work-resume-*`
- Sidecar outputs remain non-recording unless a separate approved PR explicitly
  changes that boundary

If any gate is unclear, keep Strategy C stopped at this first-slice closeout.

## 9. Browser/Computer-Use Note

Browser/computer-use validation is skipped for this closeout PR because the
change is docs-only. It does not touch UI, runtime, API, schema, fixture,
manifest JSON, package script, trace-pack harness, Cockpit action, AG Resume,
or browser-facing files.

Future UI, runtime, browser-facing, or write-capable PRs must use isolated temp
DB checks and confirm:

- Cockpit/Perspective loads when UI is touched
- runtime `research_diagnostics.sidecar_e_t.version` remains
  `sidecar_e_t.placeholder.v0.1` unless a separately approved runtime PR
  changes it
- runtime `research_diagnostics.sidecar_e_t.status` remains `placeholder` for
  docs/reference/harness planning
- runtime `research_diagnostics.sidecar_e_t.computed` remains `false` for
  docs/reference/harness planning
- viewing or running diagnostics creates no proof, evidence, readiness, action,
  bridge-table, QP, or `z_t` writes
- AG Resume proof/evidence recording route, writer, helper, and bridge behavior
  stay isolated from Sidecar trace-pack work
