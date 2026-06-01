# Sidecar e_t Trace-Pack Fixture Boundary Design v0.1

## 1. Status and Scope

Status:

- original-repo docs-only fixture-boundary design
- Strategy C planning refinement only
- non-authoritative
- not fixture import
- not manifest JSON import
- not harness implementation
- not helper import
- not runtime promotion
- not CI policy

This document defines safe fixture input boundaries, validation expectations,
and non-authority rules before any possible future Sidecar e_t trace-pack
fixture adaptation. It does not import lab fixtures, manifest JSON, trace-pack
harness scripts, helper logic, thresholds as runtime policy, package scripts,
runtime computation, schema/API behavior, Cockpit behavior, QP evidence, `z_t`
commits, proof/evidence/readiness writes, AG Resume bridge-table behavior, or
CI enforcement.

Current original-repo snapshot for this design:

| field | value |
| --- | --- |
| repo | `hynk-studio/augnes` |
| remote | `https://github.com/hynk-studio/augnes.git` |
| base branch | `main` |
| original `origin/main` SHA | `3479e728d3670f10ccd14e34a357e42d40e8883f` |
| comparison time | 2026-06-02 01:36 KST |
| target branch | `codex/sidecar-et-fixture-boundary-design` |

Runtime `PerspectiveSnapshot.research_diagnostics.sidecar_e_t` remains a
structured placeholder with `computed=false`.

## 2. Fixture Safety Boundary

Future Sidecar e_t trace-pack fixtures must not contain:

- private user text
- hidden chain-of-thought or raw reasoning
- raw secrets or token-like strings
- raw URLs
- absolute file paths
- arbitrary SQL
- raw DB rows
- real personal data
- pasted PR bodies or conversation text
- production evidence/proof/readiness data
- production action, work, session, delivery, approval, publication, or mailbox
  data
- source material that would make the fixture a durable record of private user
  context

Fixtures must be synthetic, low-cardinality, review-aid-only inputs. They must
not become evidence, proof, readiness state, source of truth, product telemetry,
or runtime policy.

## 3. Allowed Fixture Vocabulary

Future fixtures may use only low-cardinality synthetic vocabulary such as:

- synthetic trace id
- synthetic scope
- synthetic state_key
- event kind
- timestamp
- work/action/evidence/tension/proposal-like low-cardinality statuses
- expected runtime placeholder assertion
- expected allowed low-cardinality regime hint

Allowed fixture vocabulary must not define runtime schema, product API shape,
Cockpit display contract, database schema, proof/evidence payload contract, QP
payload, or `z_t` commit shape.

Any future fixture field must be reviewed as fixture-local vocabulary before
implementation. Unknown fields should fail closed until explicitly accepted.

## 4. Candidate Validation Assertions

Any future fixture import must include validation assertions for:

- v0.1 version check
- unknown event kind rejection
- unknown field rejection
- unsupported enum rejection
- long free-text rejection
- obvious secret-pattern rejection
- undeclared state_key rejection
- non-decreasing timestamp check
- references only to earlier work/action rows where required
- no fetch/network calls
- no DB authority table mutation
- runtime `sidecar_e_t` placeholder preserved
- source_refs subset assertions if reports are later added
- no writes to proof/evidence/readiness/action/bridge-table targets
- no package-script collision with existing Sidecar/Perspective or AG Resume
  smoke names

Validation must be deterministic and local. It must not require network access,
external services, browser state, production DB state, or user private data.

First implementation slice validation:

- `fixtures/sidecar-et-trace-pack.example.json`
- `fixtures/sidecar-et-trace-pack.grounded-quiet-probes-v0.1.json`
- `fixtures/sidecar-et-trace-pack.manifest.json`
- `npm run smoke:sidecar-et-trace-pack-fixture-descriptors`
- `npm run smoke:sidecar-et-trace-pack-manifest`

The smoke validates the approved two-file subset, v0.1 version, allowed
low-cardinality fields/enums, non-decreasing timestamps, earlier-row reference
requirements, unsafe-string absence, runtime placeholder expectations, no
fetch/network calls, no DB writes, no bridge/evidence/action/proof/readiness
outputs, no QP evidence, no `z_t` commits, no AG Resume writer/helper calls or
output dependency, and no `ag:resume-*` / `smoke:ag-work-resume-*` package
script collision. It does not add report, compare, suite, matrix, runtime, or
CI behavior.

The manifest smoke validates exactly two routing entries, expected trace counts
against the imported fixture files, safe relative fixture paths,
`default_compare` only for the example pack, grounded/quiet as `explicit_only`,
no deferred packs, no fetch/network calls, no DB writes, no AG Resume
writer/helper calls, and no proof/evidence/readiness/QP/`z_t` outputs. It does
not add report, compare, suite, matrix, runtime, or CI behavior.

## 5. Non-Authority Label Rules

The following labels remain lab review vocabulary only:

- `quiet`
- `grounded`
- `evidence_supported`
- `dense_loop`
- `tension_loaded`
- `history_blocked`
- `uncertain_context`

None of these labels are runtime policy, proof/evidence, readiness,
Gate/SRF input, proposal scoring, Claim confidence, Evidence status,
publication status, QP evidence, `z_t`, Cockpit action input, schema/API
contract, or CI requirement.

Future fixtures may assert that a lab-review label appears in a local fixture
report. They must not assert that runtime `sidecar_e_t.computed=true` or that a
label changes any original-repo authority path.

## 6. AG Resume Bridge Safety Note

PR #341 added `ag_work_resume_proof_evidence_recording_links`. PR #343 added
AG Resume proof/evidence writer/helper gate design docs. This fixture-boundary
design does not touch either the bridge table or the writer/helper gate design
docs.

Future Sidecar fixture or harness work must prove:

- no bridge-table rows
- no `verification_evidence_records` rows
- no `action_records` rows
- no proof/evidence/readiness writes
- no AG Resume reconciliation/import/mapping/proposal/approval/publication/
  delivery mutation
- no package-script collisions with `ag:resume-*`
- no package-script collisions with `smoke:ag-work-resume-*`
- no weakening of AG Resume proof/evidence bridge guard expectations

Sidecar fixtures must not become an input to AG Resume proof/evidence recording
unless a separately approved user/PM-scoped PR explicitly changes that boundary.

## 7. Future Implementation Gate

Before any fixture import:

- user/PM chooses exact pack subset
- explicit-only/default routing is decided
- package script names are reviewed
- validation command list is approved
- browser/computer-use requirements are determined
- AG Resume bridge guard expectations stay green
- runtime placeholder boundary is preserved
- source_refs behavior is reviewed if reports are introduced
- rollback criteria are documented

If any gate is unclear, keep the original repo at docs/reference-only planning
and do not import fixtures, manifest JSON, harness scripts, helper logic, or
runtime computation.

Descriptor/naming plan pointer:

- `docs/SIDECAR_ET_TRACE_PACK_FIXTURE_DESCRIPTOR_VALIDATION_PLAN_V0_1.md`
  records docs-only descriptor candidates, validation naming proposals, future
  changed-file boundaries, and decision gates before any fixture import. It
  does not import fixtures, manifest JSON, harness scripts, helper logic,
  package scripts, thresholds as runtime policy, runtime computation,
  schema/API changes, Cockpit behavior, proof/evidence/readiness writes, QP
  evidence, `z_t` commits, AG Resume bridge-table behavior, or CI enforcement.
- `docs/SIDECAR_ET_TRACE_PACK_EXACT_FIXTURE_DESCRIPTOR_PROPOSAL_V0_1.md`
  records the exact first descriptor subset proposal, deferred descriptor set,
  exact metadata fields, first two-file fixture import slice, first manifest
  routing slice, fixture import gate, and AG Resume writer/helper safety note.
  It imports only the approved `example` and `grounded/quiet probes` fixture
  files, a two-entry routing manifest, and focused local validation smokes; it
  does not add report/compare/suite/matrix behavior, helper logic, package
  scripts beyond the approved smokes, thresholds as runtime policy, runtime
  computation, schema/API changes, Cockpit behavior, proof/evidence/readiness
  writes, QP evidence, `z_t` commits, AG Resume bridge/writer/helper behavior,
  or CI enforcement.

## 8. Browser/Computer-Use Note

Browser/computer-use validation is skipped for this PR because the change is
docs-only. No UI, runtime, API, schema, fixture, manifest JSON, package script,
trace-pack harness, Cockpit action, AG Resume, or browser-facing files are
changed.

Future UI, runtime, or harness PRs must use isolated temp DB checks if they are
browser-facing or runtime-facing, and must confirm:

- Cockpit/Perspective loads when UI is touched.
- Runtime `research_diagnostics.sidecar_e_t.version` remains
  `sidecar_e_t.placeholder.v0.1` unless a separately approved runtime PR
  changes it.
- Runtime `research_diagnostics.sidecar_e_t.status` remains `placeholder` for
  docs/reference/harness planning.
- Runtime `research_diagnostics.sidecar_e_t.computed` remains `false` for
  docs/reference/harness planning.
- Viewing or running diagnostics creates no proof, evidence, readiness, action,
  bridge-table, QP, or `z_t` writes.
- Product wording remains non-authoritative.
