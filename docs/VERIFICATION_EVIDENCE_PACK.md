# Verification Evidence Pack

A Verification Evidence Pack is the small review bundle Codex should leave behind after repo work. It records what was checked across commands, Browser/Chrome, ChatGPT Developer Mode, MCP/widget flows, and artifacts without committing generated outputs.

## Goals

- Make verification reproducible from the PR.
- Separate evidence summaries from generated artifacts.
- Preserve exact failures instead of smoothing them over.
- Show which execution surfaces were used.
- Keep secrets, local DB files, screenshots, tunnel URLs, generated outputs, and local artifacts out of git.

## Evidence Pack v0.1 API

The runtime exposes a narrow derived review bundle at:

```text
GET /api/evidence-pack?scope=project:augnes
```

Optional filters are `work_id`, `publication_id`, `delivery_id`, and
`target_ref`. If no filter is supplied, v0.1 selects deterministically: latest
delivery by `updated_at`, `created_at`, then `delivery_id`; otherwise latest
publication; otherwise the first deterministic work item; otherwise an empty
pack with gaps. If multiple filters are supplied, selection priority is
`delivery_id`, `publication_id`, `work_id`, then `target_ref`.

Evidence Pack v0.1 is read-only derived data. It does not approve, publish,
retry, acknowledge, record proof, commit or reject state, mutate mailbox, call
GitHub, call OpenAI, or create delivery rows. It includes delivery
`external_artifact_id`, `external_artifact_url`, and `external_artifact_type`
when those fields are stored. Missing command/skipped-check structure is shown
as `gaps`; the endpoint must not fabricate verification results to make a pack
look complete.

Evidence Pack and structured evidence records must not include raw GitHub
tokens, token fingerprints, GitHub App private keys, installation tokens, or
request-supplied token payloads. GitHub token provider verification belongs in
bounded command evidence, such as `npm run smoke:github-token-provider`, with
secret values omitted from output. GitHub App installation-token config-boundary
verification belongs in bounded command evidence, such as
`npm run smoke:github-app-token-config-boundary`, and must record only
public-safe design facts. GitHub App config reader/validator verification
belongs in bounded command evidence, such as
`npm run smoke:github-app-config-validator`; it must not record raw private key
contents, private key paths, base64 private keys, installation IDs, JWTs, or
raw token material.
Offline GitHub App JWT fixture verification belongs in bounded command
evidence, such as `npm run smoke:github-app-jwt-fixture`; it must record only
public-safe result categories and must not record raw JWTs, fake or real
private key material, signatures, or secret-bearing config.
GitHub App target/allowlist policy verification belongs in bounded command
evidence, such as `npm run smoke:github-app-target-policy`; it may record
public-safe result categories such as allowlisted target allowed or
non-allowlisted target blocked, but must not record installation IDs, private
key material, raw allowlist config strings, raw JWTs, or token material.
GitHub App installation-token exchange boundary verification belongs in
bounded command evidence, such as
`npm run smoke:github-app-installation-token-exchange`; it may record
public-safe result categories such as request shape, fake-fetch count, disabled
network behavior, and redaction checks, but must not record raw JWTs, raw
installation tokens, authorization headers, raw exchange payloads, private key
material, or secret-bearing config.
GitHub App/token management v0.1 closeout verification belongs in bounded
command evidence, such as `npm run smoke:github-token-management-v01-closeout`.
It must record only closeout status and docs-smoke facts, not raw token, JWT,
private key, or exchange payload material.
Provider-neutral execution lane verification belongs in bounded command
evidence, such as `npm run smoke:execution-lanes`. It must record lane-registry
facts only and must not promote provider/session/workspace/thread/run ids to
canonical committed state.
Authority invariant verification belongs in bounded command evidence, such as
`npm run smoke:authority-invariants`. It must record that selected routes and
helpers preserve Core-only commit/reject authority; it is not a new authority
source and does not replace future full HTTP integration coverage.
PerspectiveSnapshot read-model verification belongs in bounded command
evidence, such as `npm run smoke:perspective-snapshot`. It must record
derived-view-only read-model facts and must not treat PerspectiveSnapshot as
source of truth, proof, readiness, Gate/SRF input, Claim confidence, Evidence
status, publication readiness, proposal scoring, commit/reject input, or
Cockpit action input.
Cockpit PerspectiveSnapshot wiring verification belongs in bounded command
evidence, such as `npm run smoke:cockpit-perspective-snapshot`. It must record
GET-only Cockpit read wiring and forbidden-control absence without adding
snapshot write routes, action controls, or authority.
Perspective quality verification belongs in bounded command evidence, such as
`npm run smoke:perspective-quality`. It must record bounded,
source-ref-oriented, derived-view-only behavior: `loopness_hint` is the only
bounded `log_only` diagnostic object; `sidecar_e_t`, `meta_wm_hint`,
`bsl_hint`, and `comp_index_hint` are structured placeholders; `sidecar_e_t`
is not computed, not actual Sidecar state, not QP output, and not a z_t regime
commit.
Research diagnostics boundary fixture verification belongs in bounded command
evidence, such as `npm run smoke:research-diagnostics-boundaries`. It must
record fixture boundary facts only: `research_diagnostics` remains `log_only`
and non-authoritative, placeholder diagnostics are not computed, Sidecar/QP/z_t
logic is not run, clean and repeated trace-pressure behavior is bounded, and
Core rows are not mutated.
Sidecar e_t fixture boundary verification belongs in bounded command evidence,
such as `npm run smoke:sidecar-et-fixture-boundaries`. It must record skeleton
fixture facts only: clean/minimal, repeated/noisy, missing-context,
conflicting-context, invalid-input, and source-ref boundary scopes preserve the
runtime structured placeholder, do not compute runtime Sidecar/e_t/QP/z_t
values, do not create QP output, do not treat QP output as evidence, do not
commit `z_t`, do not mutate authority tables, and make no external calls. It
may also record helper skeleton facts only: the default offline helper returns
placeholder fallback for valid, missing, malformed, ambiguous, unsupported,
empty, non-object, non-read, and out-of-boundary validation cases; the
validation result is not authority or diagnostic output; and the separate
fixture-only candidate helper remains smoke-only, runtime-disabled,
known-fixture-category-only, already-read-ref bounded, non-authoritative, not
QP evidence, and not a `z_t` commit. Unknown or unsupported fixture categories
must return placeholder fallback and must not permit runtime computation.
Fixture-only output wording review in this smoke is bounded command evidence
only. It is not runtime proof, schema authority, evidence status, readiness,
QP output, `z_t` commit, or permission to use the helper outside fixture
context.
Sidecar e_t diagnostic design review belongs in PR body/docs evidence only.
`docs/SIDECAR_ET_DIAGNOSTIC_DESIGN_V0_1.md` is design-only and must not be
recorded as runtime proof, schema authority, readiness, QP output, z_t commit,
or permission to compute Sidecar diagnostics.
Sidecar e_t offline fixture design review also belongs in PR body/docs
evidence only. `docs/SIDECAR_ET_OFFLINE_FIXTURE_DESIGN_V0_1.md` is
fixture-design-only and must not be recorded as runtime computation, fixture
execution, schema authority, or permission to compute Sidecar diagnostics.
Sidecar e_t offline helper design review belongs in PR body/docs evidence
only. `docs/SIDECAR_ET_OFFLINE_HELPER_DESIGN_V0_1.md` is helper-design-only
and must not be recorded as helper implementation, runtime computation, schema
authority, fixture execution, or permission to compute Sidecar diagnostics.
Sidecar e_t offline computation design review belongs in PR body/docs evidence
only. `docs/SIDECAR_ET_OFFLINE_COMPUTATION_DESIGN_V0_1.md` is
computation-design-only and must not be recorded as runtime computation,
fixture execution, helper implementation, schema authority, evidence/proof,
readiness, QP output, z_t commit, or permission to compute outside a separately
gated future implementation PR.
Sidecar e_t runtime log-only design review belongs in PR body/docs evidence
only. `docs/SIDECAR_ET_RUNTIME_LOG_ONLY_DESIGN_V0_1.md` is
runtime-log-only-design-only and must not be recorded as runtime computation,
schema authority, evidence/proof, readiness, QP output, z_t commit, or
permission to wire Sidecar e_t computation into `PerspectiveSnapshot`, routes,
Cockpit, OpenAI, GitHub, commit/reject, or Core writes.
Cockpit six-tab functional map verification belongs in bounded command
evidence, such as `npm run smoke:cockpit-six-tab-functional-map`. It must
record docs-smoke facts only: the functional map exists, all six tabs and
low-fi wireframes are present, reference images are non-authority visual
direction, no runtime files changed, and no dependencies were added.
Cockpit demo readiness verification belongs in bounded command and browser
evidence, such as `npm run smoke:cockpit-demo-readiness` plus screenshot review
of Overview, Work, Ledger, Proof, Bridge, and Operator. It must record visual
readability, horizontal overflow, console errors, text-only identity, and
forbidden-control absence without adding backend behavior or new authority.
Cockpit visual tone refresh verification belongs in bounded command and browser
evidence, such as `npm run smoke:cockpit-visual-tone-refresh` plus before/after
screenshot review. It must record that the pale green background, white or
near-white cards, green-gray borders, and system font stack are present while no
remote fonts, font files, logo artwork, backend behavior, or new controls were
added.

Structured verification evidence records are now stored separately from
approval, publication, readiness, delivery, mailbox, and committed state rows.
The local runtime exposes:

```text
GET /api/evidence/records?scope=project:augnes
POST /api/evidence/records
```

`POST /api/evidence/records` records bounded observation evidence only. It can
store `command_run`, `check_passed`, `check_failed`, `check_skipped`,
`replay_observed`, and `duplicate_block_observed` records. It does not approve,
publish, replay, retry, commit or reject state, mutate mailbox, call GitHub,
call OpenAI, or require `GITHUB_TOKEN` / `OPENAI_API_KEY`.

Evidence Pack reads matching records for the selected work, publication,
delivery, or target. Matching `command_run` records populate
`verification_trace.commands_run`; matching `check_passed` records populate
`verification_trace.checks_passed`; matching `check_skipped` records populate
`verification_trace.skipped_checks`; matching `replay_observed` and
`duplicate_block_observed` records set the corresponding replay observation
fields. Gaps are reduced only when matching records exist. Unrelated evidence
records must not make a selected pack appear complete.

Codex should use the npm helper when recording these observations after repo
work:

```bash
AUGNES_API_BASE_URL=http://localhost:3000 \
CODEX_SCOPE=project:augnes \
CODEX_WORK_ID=AG-004 \
CODEX_EVIDENCE_KIND=command_run \
CODEX_EVIDENCE_STATUS=passed \
CODEX_EVIDENCE_LABEL="Root typecheck" \
CODEX_COMMAND="npm run typecheck" \
CODEX_RESULT_SUMMARY="Typecheck passed." \
npm run codex:record-evidence
```

The helper is env-only, validates required fields before POST, validates
`CODEX_METADATA_JSON` as a JSON object string when provided, and calls only
`POST /api/evidence/records`. It does not call GitHub or OpenAI, execute replay,
attempt duplicate publish, or mutate publication, approval, readiness, delivery,
mailbox, or committed state rows directly. It also supports
`CODEX_EVIDENCE_BATCH_JSON` as a JSON array of evidence record inputs; batch
mode still records observation rows one at a time through the same local API.

## Structured Records And PR Evidence

PR body text remains useful for human review: it explains context, failures,
environment limits, screenshots, and artifacts. `verification_evidence_records`
are the machine-readable Core evidence layer for the same bounded observations.
Future Codex PRs should include both when a local runtime is available.

Evidence Pack can read matching structured records for the selected work,
publication, delivery, or target and reduce gaps in `verification_trace` and
`replay_trace`. Missing rows must remain visible as gaps. Do not fabricate
commands, skipped checks, replay observations, or duplicate-block observations
in the PR body or in Core just to make a pack look complete.

Evidence Pack v0.1 also includes a small `session_trace.session_refs` list when
stored session bindings match the selected work or target ref. These are string
and metadata refs only. Evidence Pack does not create sessions, bind sessions,
expand full session traces, execute Codex, call GitHub/OpenAI, or mutate Core
records. Use `GET /api/sessions/trace?scope=project:augnes` for the full
bounded session trace view.

Evidence Pack v0.1 now includes a read-only
`temporal_review_artifact_trace` for
`work_id=AG-TEMPORAL-INTERPRETATION`. It reads bounded
`TemporalPreviewReviewArtifact` rows through the review-artifact read/list/count
helpers and summarizes the latest artifact plus the matching count,
including reviewer verdict, guardrail status, capture mode, generator/model,
linked evidence IDs, linked session ID, linked PR URL, and manual review report
path when present. If no matching artifacts exist, the trace reports
`available=false`, `artifact_count=0`, and a clear gap. This trace is
non-authoritative: it does not call the capture route, create/update/delete
artifacts, call OpenAI/GitHub, publish, replay, approve, commit state, admit
memory, or create `PerspectiveSnapshot` / `RawEpisodeBundle` runtime authority.
The Cockpit `Temporal Review Artifacts` browser is a separate read-only review
surface over the same bounded review artifact records. It loads artifacts
through GET routes only, keeps selection as local UI state, surfaces gaps and
boundaries, and must not create/capture/update/delete artifacts or treat
reviewer verdicts, guardrail output, or DOM state as authority.

Structured records should use exact labels and summaries:

- Commands: include the exact command in `command`, such as
  `npm run typecheck`.
- Passed checks: use concrete labels, such as `Evidence Pack smoke`, and include
  important result facts like `fetch_calls: 0`.
- Failed checks: preserve the exact failure or blocker in `result_summary`.
- Skipped checks: record `check_skipped` with a specific `skipped_reason`, not a
  generic note.
- Replay or duplicate-block observations: record only when actually observed
  elsewhere; recording the row must not execute replay or attempt duplicate
  publish.

Every PR should report the returned `evidence_id` values in the Structured
Evidence Records section. If records were not created, state the exact reason:
local runtime unavailable, evidence API unavailable, docs-only PR, external
check not applicable, or another concrete reason.

## Codex Session Adapter v0.2 Closeout Review

Evidence Pack is part of the Codex Session Adapter v0.2 closeout review. Use it
with structured evidence rows and session trace refs to connect work, session,
PR, and evidence context without adding new authority. Matching rows and refs
may reduce review gaps; missing rows or refs must remain visible gaps and must
not be filled in by invented IDs or summaries.

For Temporal Interpretation Preview work, attach or summarize the manual review
using `docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT.md`. The report should
preserve preview input/output, source refs, admission decisions,
counterexamples, residual tensions, summary/evidence separation, authority
boundary checks, safe-next-step review, verdict, notes, and follow-up action.
It is a review artifact, not durable state or approval.
The deterministic mock example at
`docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_MOCK_PREVIEW_V0_1.md` can be
used as a filled reference for the template structure. The route-captured
mock-mode review at
`docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md`
shows the same manual review process against a real
`POST /api/temporal-interpretation/preview` response with `OPENAI_API_KEY`
unset. Cockpit review should also confirm the read-only Temporal Preview panel
renders structured `active_context_admission.decisions` when present.
Browser/Cockpit screenshot validation is tracked in
`docs/TEMPORAL_INTERPRETATION_COCKPIT_SCREENSHOT_VALIDATION.md`; it should
record whether the screenshot was committed or retained only in `/tmp`, the
observed generator, guardrail result, admission decision count, visible
`candidate_id`, `source_authority`, `evidence_refs`, `counterexample_refs`, and
`residual_tension_refs`, plus the no-write-control boundary.
OpenAI-path validation for the strict `active_context_admission` schema is
tracked in
`docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md`; the validation command
is opt-in and must not make normal smoke checks require `OPENAI_API_KEY`.
For the current v0.2 authority boundary, validation matrix, guarded failure
modes, known limitations, and roadmap recommendation, reference
`docs/TEMPORAL_INTERPRETATION_V0_2_STATUS_AND_ROADMAP.md`.
For future Temporal Interpretation persistence boundaries, reference
`docs/TEMPORAL_INTERPRETATION_PERSISTENCE_DESIGN_V0_1.md`. That document is a
design artifact only; it must not be treated as DB schema, API implementation,
runtime persistence, approval authority, durable PerspectiveSnapshot state, or
RawEpisodeBundle runtime.
For Temporal Interpretation work/evidence binding, reference
`docs/TEMPORAL_INTERPRETATION_WORK_AND_EVIDENCE_BINDING.md`. Future Temporal
Interpretation evidence can bind to `work_id=AG-TEMPORAL-INTERPRETATION` when
the demo/runtime seed has been applied. Use the canonical Temporal
Interpretation `target_ref` / `source_ref` strings from that document for
historical rows and unseeded runtimes, and do not attach future Temporal
evidence to `AG-004` or another generic Codex work anchor.
For the closed bounded review artifact chain, reference
`docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_V0_1_CLOSEOUT.md`. It marks
`TemporalPreviewReviewArtifact` v0.1 complete as a bounded
review-artifact capture/read/surface chain and keeps future
PerspectiveSnapshot runtime, RawEpisodeBundle runtime, approval-gated commit,
Cockpit write controls, and ChatGPT App write tools outside v0.1.
The schema design remains documented in
`docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_SCHEMA_DESIGN_V0_1.md`; it defines the
`temporal_preview_review_artifacts` table boundary, forbidden fields, Evidence
Pack integration, and read-only list/get API boundary. Review artifacts must
not be treated as approval authority, durable PerspectiveSnapshot state, or
RawEpisodeBundle runtime.
The read-model slice adds the
`temporal_preview_review_artifacts` table and read-only list/get APIs. Evidence
Pack read-only awareness is complete as `temporal_review_artifact_trace`;
Evidence Pack must not infer approval, publish readiness, replay status,
committed state, memory admission, proof publication, PerspectiveSnapshot
authority, or RawEpisodeBundle authority from review artifact records.
The reusable forbidden-persistence fixture corpus for
`TemporalPreviewReviewArtifact` lives at
`lib/temporal-review-artifact-fixtures.ts`, with smoke coverage in
`smoke:temporal-forbidden-persistence-fixtures`. It is part of the completed
v0.1 validation chain and does not add artifact-derived authority.
The non-public capture helper for `TemporalPreviewReviewArtifact` lives at
`lib/temporal-review-artifact-capture.ts`, with smoke coverage in
`smoke:temporal-review-artifact-capture-helper`. It builds bounded artifact
input from preview responses and manual review metadata only; Evidence Pack
awareness is complete as a read-only trace and must not infer authority from
captured review artifact rows.
The private non-smoke insert helper
`insertTemporalPreviewReviewArtifact` lives at
`lib/temporal-review-artifacts.ts`, with smoke coverage in
`smoke:temporal-private-insert-helper`. It shares validation with the existing
smoke insert helper and remains internal-only. It does not add Evidence Pack
rendering or artifact-derived authority.
The internal idempotency foundation for `TemporalPreviewReviewArtifact` lives
in `temporal_preview_review_artifact_idempotency` plus helper logic in
`lib/temporal-review-artifacts.ts`, with smoke coverage in
`smoke:temporal-artifact-idempotency`. It stores only hashed idempotency keys
and payload hashes; raw keys, raw payloads, and raw request bodies are not
persisted.
The public capture route now lives at
`POST /api/temporal-interpretation/review-artifacts/capture`, with smoke
coverage in `smoke:temporal-capture-route`. It persists only bounded
TemporalPreviewReviewArtifact rows through the idempotent helper and still does
not add Evidence Pack writes, Cockpit write controls, ChatGPT App create
tools, OpenAI calls, GitHub publication adapter calls, replay, publish,
approval, committed state mutation, `PerspectiveSnapshot` runtime,
`RawEpisodeBundle` runtime, or artifact-derived authority.
The Cockpit read-only review artifact browser lives in
`components/augnes-cockpit.tsx`, with smoke coverage in
`smoke:cockpit-temporal-review-artifacts`. It verifies the panel, GET-only list
loading, visible artifact fields, no-artifact gaps, artifact-present behavior,
linked evidence/session/PR visibility, no capture route usage, and no protected
authority row mutation.

## Evidence Categories

### Command Checks

Record each command, working directory, result, and important output.

```text
Command: npm run typecheck
Working directory: repo root
Result: passed | failed | unavailable | skipped
Evidence: short summary or exact failure
```

Required commands for Augnes PRs unless unavailable:

```bash
npm run typecheck
npm --prefix apps/augnes_apps run typecheck
npm --prefix apps/augnes_apps run smoke
npm --prefix apps/augnes_apps run invariants
npm run smoke:github-token-provider
npm run smoke:github-app-token-config-boundary
npm run smoke:github-app-config-validator
npm run smoke:github-app-jwt-fixture
npm run smoke:github-app-target-policy
npm run smoke:github-app-installation-token-exchange
npm run smoke:github-token-management-v01-closeout
npm run smoke:execution-lanes
npm run smoke:authority-invariants
npm run smoke:perspective-snapshot
npm run smoke:cockpit-perspective-snapshot
npm run smoke:perspective-quality
npm run smoke:research-diagnostics-boundaries
npm run smoke:sidecar-et-fixture-boundaries
```

After running a command, Codex or another local verifier may record a bounded
`command_run` evidence record. The record says the command was reported as run;
it is not broad proof of correctness beyond that exact command and result
summary.

```bash
CODEX_EVIDENCE_KIND=command_run \
CODEX_EVIDENCE_STATUS=passed \
CODEX_EVIDENCE_LABEL="Root typecheck" \
CODEX_COMMAND="npm run typecheck" \
CODEX_RESULT_SUMMARY="Typecheck passed." \
npm run codex:record-evidence
```

### Browser/Chrome Checks

Use Browser/Chrome when the local runtime or UI is available. Record:

- URL opened
- surface checked, such as Runtime Cockpit, Temporal State Graph, Work Focus, or the read-only Session Trace panel
- expected behavior
- actual behavior
- whether screenshots were produced and where they remained locally

Do not commit screenshots unless the user explicitly asks for committed proof assets.

### ChatGPT Developer Mode Checks

When available, record:

- endpoint used, redacting tunnel details if sensitive
- tool or widget checked
- expected structured content
- actual result
- whether the check used public profile or bridge-enabled mode

A skipped Developer Mode check is acceptable when no tunnel, local runtime, or Developer Mode access is available. State the reason plainly.

Skipped checks should be recorded as `check_skipped` with a concrete
`skipped_reason` when the evidence record API is available.

```bash
CODEX_EVIDENCE_KIND=check_skipped \
CODEX_EVIDENCE_STATUS=skipped \
CODEX_EVIDENCE_LABEL="Browser screenshot check" \
CODEX_RESULT_SUMMARY="Browser screenshot check was not run." \
CODEX_SKIPPED_REASON="No browser runtime was available in this environment." \
npm run codex:record-evidence
```

### MCP / Widget Checks

For MCP Inspector or widget checks, record:

- MCP endpoint
- tools invoked
- result status
- widget URI and profile when relevant
- proof recorded back into Augnes, if any

### Live Publication Adapter Checks

Only include live GitHub publication adapter evidence when the user/PM explicitly
approved one specific target for that PR. Record the target PR, comment id/URL,
`idempotency_key`, dry-run result, actual publish result, replay result, delivery
ledger result, stored `external_artifact_id`/`external_artifact_url`/
`external_artifact_type`, and event-spine result. PR #67 is the baseline
example: one live GitHub PR comment, comment id `4414174258`, one sent delivery,
publication became sent, replay produced no duplicate, and the retained comment
remains evidence. This does not authorize automatic posting in future PRs.

Replay and duplicate-block observations are stored only when explicitly
observed elsewhere. Creating `replay_observed` or `duplicate_block_observed`
records must not itself execute replay or attempt a duplicate publish.

Observation-only examples:

```bash
CODEX_EVIDENCE_KIND=replay_observed \
CODEX_EVIDENCE_STATUS=observed \
CODEX_EVIDENCE_LABEL="Same-key replay observation" \
CODEX_DELIVERY_ID="delivery:..." \
CODEX_RESULT_SUMMARY="Same-key replay was observed outside this helper and returned the stored artifact." \
CODEX_OBSERVED_BEHAVIOR="idempotent_replay=true and posted=false" \
npm run codex:record-evidence
```

```bash
CODEX_EVIDENCE_KIND=duplicate_block_observed \
CODEX_EVIDENCE_STATUS=blocked \
CODEX_EVIDENCE_LABEL="Different-key duplicate block observation" \
CODEX_TARGET_REF="Aurna-code/augnes#..." \
CODEX_RESULT_SUMMARY="Duplicate publish behavior was observed outside this helper and blocked before posting." \
CODEX_OBSERVED_BEHAVIOR="HTTP 409 duplicate block" \
npm run codex:record-evidence
```

### Artifacts

Artifacts include screenshots, local DB files, generated `outputs/`, log captures, and tunnel URLs. The evidence pack should summarize artifacts without committing them.

```text
Artifact: local screenshot
Path: not committed, retained locally at <local path or omitted>
Purpose: browser verification of Work Focus
Committed: no
```

## Minimal PR Evidence Template

```text
Verification Evidence Pack

Commands:
- npm run typecheck: 
- npm --prefix apps/augnes_apps run typecheck: 
- npm --prefix apps/augnes_apps run smoke: 
- npm --prefix apps/augnes_apps run invariants: 
- npm run smoke:cockpit-six-tab-shell:
- npm run smoke:cockpit-demo-readiness:
- npm run smoke:cockpit-visual-tone-refresh:

Browser/Chrome:
- Surface:
- Expected:
- Actual:
- Screenshots:
- Horizontal overflow:
- Console errors:
- Forbidden controls visible:
- Skipped reason, if any:

ChatGPT Developer Mode:
- Surface/tool:
- Expected:
- Actual:
- Skipped reason, if any:

MCP/widget:
- Surface/tool:
- Expected:
- Actual:
- Skipped reason, if any:

Artifacts not committed:
- 
```

## Failure Rule

If a command or surface fails because of environment setup, missing dependencies, missing local runtime, unavailable Developer Mode, or absent Browser/Chrome capability, report the exact failure. Do not mark it as passed and do not hide it under a generic note.
