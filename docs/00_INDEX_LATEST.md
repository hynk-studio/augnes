# Augnes Local Project Upload Pack — SSOT Layout (r20.1p4p23)

이 세트는 **ChatGPT 프로젝트 폴더에 바로 업로드**하기 좋게, 핵심 문서들을 **폴더 없이(플랫)** 정리한 묶음이야.

---

## 이 세트의 “진짜 기준(권위)” 구조

### 1) 핵심 SSOT (정의/계약의 권위)
- **SSOT-1 (계약: 필드/타입/enum/경로/예시 검증):** `SSOT_SCHEMA_BUNDLE.zip`
- **SSOT-2 (의미/정책: 우선순위/금지 규칙/해석):** `SSOT_CANONICAL.md`

### 2) 준-SSOT (운영상 강제되는 보관/집계 규칙)
- **SSOT-2b (보관/집계 정책):** `SSOT_LOGGING_POLICY.md`
  - 단, **payload 필드/타입/enum/경로의 ‘정의’는 금지**(스키마 번들을 **인용만** 한다).
  - 이벤트 *이름 목록/분류(택소노미)* 는 허용하되, **payload 계약(필수/enum/경로)은 스키마 번들에서만** 만든다.
  - 하는 일: 보관/집계/뷰 규칙, 운영 지표 산출 스펙, “파생 저장소는 View” 같은 운영 금지 규칙.

### 3) 하위 문서들 (권위를 만들지 않고 “붙이는 문서”)
- `OPS_PLAYBOOK.md`: 구현/운영 레시피(절차/튜닝/디버깅). 정의 발명 금지.
- `WIRING_INTEGRATION_MAP.md`: 문서/모듈 결합 지도. 정의 재서술 금지.
- `MODULE_SIDECAR_QP_ZT_SUMMARY.md`: Sidecar/QP/z_t 모듈 로컬 스펙(전역 규약 아님).
- `APPENDIX_GNWT_IIT.md`: 연구/배경 부록(운영 계약 금지).
- `CHANGELOG_PATCHLOG.md`: 변경 이력(권위 아님).
- `00_INDEX_LATEST.md`: 업로드 레이아웃 + 유지보수 체크리스트(권위 아님).

### 최근 Perspective diagnostics hardening 포인터 (repo-local, non-SSOT)

이 포인터들은 Active set을 늘리거나 새 권위를 만들지 않는다. 최근
Perspective diagnostics hardening 작업을 찾기 위한 repo-local 색인이다.

### Post-#868 development posture pointer (repo-local, non-SSOT)

PR #868 is merged. Current route planning starts from:

```text
/ = public Augnes surface
/perspective = Perspective detail
/workbench = cockpit/workbench
```

- `docs/POST_868_DEVELOPMENT_POSTURE.md`: short non-authority posture /
  guardrail note. It is not a roadmap, not SSOT, and not PR sequencing
  authority. New slices must come from explicit operator task prompts, not from
  mining old or new roadmap docs. Current posture is Core first, Handoff first,
  Conversation first, Web last.
- `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`: superseded
  historical roadmap content preserved with a prominent live compatibility
  banner. v0.2.1 FULL is superseded for current PR sequencing and must not be
  used for new slice selection.
- `docs/archive/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL_SUPERSEDED_2026_06_30.md`:
  archived historical v0.2.1 FULL content for older slice provenance only.
- `scripts/smoke-post-868-roadmap-supersession-cleanup-v0-1.mjs`
  (`npm run smoke:post-868-roadmap-supersession-cleanup-v0-1`): focused static
  smoke for the superseded live roadmap banner, archived roadmap,
  post-#868 posture note, latest-index preference, and current-planning
  authority boundary.
- `docs/POST_868_NON_UI_RUNTIME_GAP_RECONCILIATION_V0_1.md`: repo-grounded
  post-#868 non-UI runtime gap reconciliation. It treats PR #868 as the frozen
  web baseline, keeps `/`, `/perspective`, and `/workbench` as the route model
  baseline, classifies v0.2.1 slice anchors into done, done_but_ui_excluded,
  still_valid, blocked, and superseded, moves UI/Cockpit/browser/public-surface
  work to Web last backlog, records completed runtime/store/helper no-repeat
  surfaces, keeps forbidden capabilities blocked, and selects exactly one next
  non-UI implementation slice: `dogfooding_record_runtime_store_route_v0_1`.
- `fixtures/post-868-non-ui-runtime-gap-reconciliation.sample.v0.1.json`:
  deterministic public-safe fixture mirroring the post-#868 reconciliation
  classifications, blocked capabilities, Web last backlog, no-repeat surfaces,
  authority boundary, and selected next slice.
- `scripts/smoke-post-868-non-ui-runtime-gap-reconciliation-v0-1.mjs`
  (`npm run smoke:post-868-non-ui-runtime-gap-reconciliation-v0-1`): focused
  static smoke for required classification categories, blocked capabilities,
  selected next slice, Web last boundary, no web-priority inversion wording,
  no opened product-write/GitHub/live-provider/release capability, and exact
  changed-file scope.
- `docs/AUGNES_DELTA_CONTRACT_V0_1.md`: repo-local contract/design pointer for
  AugnesDelta, the common semantic change unit across Perspective, memory,
  artifact, code, research, handoff, world-state, and agent-plan changes. It
  is contract/type/fixture/smoke-only in v0.1 and adds no UI, route, DB,
  MCP/App tool, persistence, Codex execution, GitHub/provider call,
  proof/evidence write, durable state apply, product-write, or autonomy runner
  behavior.
- `docs/AUGNES_DELTA_PROJECTION_READ_MODEL_V0_1.md`: read-only Augnes Delta
  projection read-model contract for projecting existing Augnes source records
  into AugnesDelta[] and DeltaBatch[] with source refs, source counts, gaps,
  authority boundary, and conservative merge policies. Phase 2A adds
  docs/type/helper/fixture/smoke/package-pointer/index-pointer only and adds no
  UI, route, DB schema/migration, DB write, MCP/App tool, provider/OpenAI
  call, GitHub actuation, Codex execution, proof/evidence write, durable
  Perspective apply, memory mutation, product-write, scheduler/autonomy
  runner, merge/publish/retry/replay/deploy behavior, or external side effect.
  Phase 2B adds a GET-only read-only Delta Projection route and thin source
  collector for projecting existing Augnes records into
  AugnesDeltaProjectionReadModel. It adds no UI, DB schema/migration, DB write,
  persistence, MCP/App tool, provider/OpenAI call, GitHub actuation, Codex
  execution, proof/evidence write, durable Perspective apply, memory mutation,
  product-write, scheduler/autonomy runner, merge/publish/retry/replay/deploy
  behavior, or external side effect.
- `docs/AUGNES_CURRENT_WORKING_PERSPECTIVE_V0_1.md`: read-only Current
  Working Perspective read model for synthesizing `PerspectiveSnapshot` and
  `AugnesDeltaProjectionReadModel` into a stable packet with current frame,
  thesis, goals, assumptions, questions, risks, research pressure, next
  candidates, last major delta refs, review hints, source refs, staleness,
  gaps, authority boundary, and next-phase notes. Phase 3A adds
  docs/type/helper/fixture/smoke/package-pointer/index-pointer only and adds no
  UI, route, DB schema/migration, DB write, MCP/App tool, provider/OpenAI
  call, GitHub actuation, Codex execution, proof/evidence write, durable
  Perspective apply, memory mutation, product-write, scheduler/autonomy
  runner, merge/publish/retry/replay/deploy behavior, or external side effect.
  Phase 3B adds a GET-only read-only Current Working Perspective route and
  thin runtime source/composition helper for returning
  CurrentWorkingPerspective from PerspectiveSnapshot and
  AugnesDeltaProjectionReadModel inputs. It adds no UI, DB schema/migration,
  DB write, persistence, MCP/App tool, provider/OpenAI call, GitHub actuation,
  Codex execution, proof/evidence write, durable Perspective apply, memory
  mutation, product-write, scheduler/autonomy runner, Human Surface,
  GuideBrief, merge/publish/retry/replay/deploy behavior, or external side
  effect.
- `docs/HUMAN_SURFACE_V0_1.md`: Phase 4A read-only Human Surface Home pointer
  for updating `/` into a guided Blank State and Current Working Perspective
  entry with display-only mode presets, current thesis/goals/questions/risks,
  next candidates, recent important deltas, review queue hints, source status,
  fallback disclosure, and links to `/perspective` and `/workbench`. Phase 4A
  adds read-only Human Surface UI only and adds no DB schema/migration, DB
  write, MCP/App tool, provider/OpenAI call, GitHub actuation, Codex execution,
  proof/evidence write, durable Perspective apply, memory mutation,
  product-write, scheduler/autonomy runner, Perspective timeline, workbench
  behavior change, merge/publish/retry/replay/deploy behavior, or external
  side effect.

- `AUTHORITY_MATRIX.md`: provider-neutral execution lane registry와
  authority invariant smoke suite의 권위 경계를 설명한다.
- `PERSPECTIVE_SNAPSHOT_V0_1.md`: `PerspectiveSnapshot` v0.1 read model,
  Cockpit wiring, Perspective quality smoke, research diagnostics boundary
  fixture smoke, Sidecar e_t fixture smoke skeleton을 한 곳에서 연결한다.
- `SIDECAR_ET_DIAGNOSTIC_DESIGN_V0_1.md`: future Sidecar e_t diagnostic
  design-only pointer다. non-SSOT이며 runtime/schema/computation authority가
  아니다.
- `SIDECAR_ET_OFFLINE_FIXTURE_DESIGN_V0_1.md`: future Sidecar e_t offline
  fixture-design-only pointer다. non-SSOT이며 runtime/schema/computation
  authority가 아니다.
- `SIDECAR_ET_OFFLINE_HELPER_DESIGN_V0_1.md`: future Sidecar e_t offline
  helper-design-only pointer다. non-SSOT이며 runtime/schema/computation
  authority가 아니다.
- `SIDECAR_ET_OFFLINE_COMPUTATION_DESIGN_V0_1.md`: future Sidecar e_t offline
  computation-design-only pointer다. non-SSOT이며 runtime/schema/implementation
  authority가 아니고 computation을 구현하지 않는다.
- `SIDECAR_ET_RUNTIME_LOG_ONLY_DESIGN_V0_1.md`: future Sidecar e_t runtime
  log-only-design-only pointer다. non-SSOT이며 runtime/schema/implementation
  authority가 아니고 runtime computation을 구현하지 않는다.
- `SIDECAR_ET_RUNTIME_SMOKE_DESIGN_V0_1.md`: future Sidecar e_t runtime
  smoke-design-only pointer다. non-SSOT이며 runtime/schema/implementation
  authority가 아니고 runtime computation을 구현하지 않는다. 관련 skeleton
  smoke는 `npm run smoke:sidecar-et-runtime-boundaries`다.
- `SIDECAR_ET_RUNTIME_IMPLEMENTATION_CHECKLIST_V0_1.md`: future Sidecar e_t
  runtime implementation checklist-only pointer다. non-SSOT이며
  runtime/schema/implementation authority가 아니고 runtime computation을
  구현하지 않는다.
- `SIDECAR_ET_LAB_UPSTREAM_ALIGNMENT_V0_1.md`: original repo docs-only
  Sidecar e_t lab upstream alignment pointer다. lab evidence baseline,
  original-repo authority boundary, future strategy ladder, drift checklist,
  and browser/computer-use skip/future scenario를 정리하며 helper logic,
  fixtures, thresholds, runtime computation, schema/API, Cockpit action,
  proof/evidence/readiness, or CI authority를 만들지 않는다.
- `SIDECAR_ET_LAB_REPORT_REFERENCE_V0_1.md`: original repo docs-only Sidecar
  e_t lab-report reference pointer다. merged lab PRs, reference baseline,
  findings summary, reviewer use/must-not-infer boundary, drift refresh note,
  and browser/computer-use skip/future scenario를 정리하며 helper/harness import,
  runtime computation, threshold policy, schema/API, Cockpit action,
  proof/evidence/readiness, or CI authority를 만들지 않는다.
- `SIDECAR_ET_TRACE_PACK_HARNESS_ADAPTATION_PLAN_V0_1.md`: original repo
  docs-only Strategy C trace-pack/report harness adaptation planning pointer다.
  candidate harness components, explicit non-port list, original repo seams,
  minimal future adaptation options, validation plan, browser/computer-use
  plan, and implementation decision gate를 정리하며 helper import, fixtures,
  harness scripts, package scripts, runtime computation, schema/API, Cockpit
  action, proof/evidence/readiness, or CI authority를 만들지 않는다.
- `SIDECAR_ET_TRACE_PACK_MANIFEST_APPENDIX_V0_1.md`: original repo docs-only
  Strategy C manifest appendix planning pointer다. lab trace-pack inventory,
  pack classes, label behavior, future adaptation checklist, AG Resume bridge
  safety note, and browser/computer-use skip/future scenario를 정리하며
  fixtures, manifest JSON, helper logic, harness scripts, package scripts,
  thresholds as runtime policy, runtime computation, schema/API, Cockpit
  action, proof/evidence/readiness, or CI authority를 만들지 않는다.
- `SIDECAR_ET_TRACE_PACK_FIXTURE_BOUNDARY_DESIGN_V0_1.md`: original repo
  docs-only Strategy C fixture-boundary design pointer다. safe fixture input
  boundaries, allowed low-cardinality vocabulary, validation expectations,
  non-authority label rules, AG Resume bridge safety note, implementation gate,
  and browser/computer-use skip/future scenario를 정리하며 fixtures, manifest
  JSON, helper logic, harness scripts, package scripts, thresholds as runtime
  policy, runtime computation, schema/API, Cockpit action,
  proof/evidence/readiness, AG Resume bridge behavior, or CI authority를
  만들지 않는다.
- `SIDECAR_ET_TRACE_PACK_FIXTURE_DESCRIPTOR_VALIDATION_PLAN_V0_1.md`: original
  repo docs-only Strategy C descriptor/naming plan pointer다. descriptor-only
  pack candidates, safest first subset, validation command names, future
  changed-file boundaries, AG Resume bridge safety note, browser/computer-use
  skip/future scenario, and decision gate를 정리하며 fixtures, manifest JSON,
  helper logic, harness scripts, package scripts, thresholds as runtime policy,
  runtime computation, schema/API, Cockpit action, proof/evidence/readiness,
  AG Resume bridge behavior, or CI authority를 만들지 않는다.
- `SIDECAR_ET_TRACE_PACK_EXACT_FIXTURE_DESCRIPTOR_PROPOSAL_V0_1.md`: original
  repo docs-only Strategy C exact fixture descriptor proposal pointer다. first
  proposed descriptor subset, deferred descriptor set, exact docs-only
  descriptor metadata fields, first two-file fixture import slice, focused
  descriptor validation smoke, first two-entry manifest routing slice, focused
  manifest smoke, future fixture import gate, AG Resume writer/helper safety
  note, and browser/computer-use skip/future scenario를 정리한다. Current first
  slices는 `example` 및 `grounded/quiet probes` fixture 두 개,
  `fixtures/sidecar-et-trace-pack.manifest.json`,
  `smoke:sidecar-et-trace-pack-fixture-descriptors`, 및
  `smoke:sidecar-et-trace-pack-manifest`만 추가하며
  report/compare/suite/matrix behavior, helper logic, thresholds as runtime
  policy, runtime computation, schema/API, Cockpit action,
  proof/evidence/readiness, AG Resume bridge/writer/helper behavior, or CI
  authority를 만들지 않는다.
- `SIDECAR_ET_TRACE_PACK_STRATEGY_C_FIRST_SLICE_CLOSEOUT_V0_1.md`: original
  repo docs-only Strategy C first-slice closeout / stop-go decision packet이다.
  Imported first-slice fixture/manifest inventory, current routing boundary,
  fixture/manifest validation boundary, explicit still-forbidden list, AG
  Resume isolation note, stop/go decision matrix, future implementation gate,
  and browser/computer-use skip/future scenario를 정리하며 additional fixtures,
  manifest entries, harness scripts, package scripts, report/compare/suite/
  matrix behavior, runtime computation, helper logic, schema/API/Cockpit
  behavior, proof/evidence/readiness writes, QP evidence, `z_t` commits, CI
  enforcement, or AG Resume bridge/writer/helper/route behavior를 만들지
  않는다.
- `PROJECT_CONSTELLATION_IA_V0_1.md`: Project Constellation의 repo-local,
  docs-only, non-SSOT, read-only, non-authoritative Perspective IA/design
  pointer다. This is not an Active-set expansion. Scattered projects, work
  units, PRs, documents, concepts, decisions, tensions, evidence pointers,
  validation results, and next moves를 symbolic node/typed-edge/cluster map으로
  표현하고 Perspective Capsule 및 agent-handoff preview vocabulary를 정리한다.
  `npm run smoke:project-constellation-ia-boundaries`는 이 문서의 focused
  document/IA boundary guard다. Runtime code, UI components, graph engine,
  graph DB, API routes, DB schema/migrations, package scripts, fixtures,
  smokes, persistence, save/rollback buttons, automatic agent routing,
  external calls, Cockpit action behavior, Codex execution behavior, ChatGPT
  Apps/MCP tool changes, proof/evidence/readiness writes, QP evidence, `z_t`
  commits, or AG Resume behavior를 만들지 않는다.
- `fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json`: first
  public-safe Project Constellation sample fixture for the Sidecar e_t Strategy
  C first slice다. `npm run smoke:project-constellation-sample-fixture`는
  fixture shape, Perspective Capsule preview, Codex execution authority preview,
  docs pointers, and package script pointer를 정적으로 확인한다. This fixture
  and smoke add no Project Constellation runtime behavior, no graph DB, no
  persistence, no proof/evidence write, no Codex SDK execution, and no AG Resume
  writer/helper/route behavior.
- `components/augnes-cockpit.tsx`: Project Constellation read-only Cockpit
  preview를 existing Perspective surface 안에 표시한다. Static source는
  `fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json`이며
  `sample_fixture_only`, `read_only_non_authoritative`,
  `work_unit_constellation` fixture shape의 nodes, edges, evidence pointers,
  unresolved tensions, next action candidates, Perspective Capsule preview,
  Codex handoff packet summary, and Codex execution authority preview만
  inspection한다. `npm run smoke:project-constellation-cockpit-preview`는
  package script pointer, docs/index pointers, fixture alignment, no action
  controls, no Project Constellation runtime behavior, no graph DB, no
  persistence, no proof/evidence write, no Codex SDK execution, and no AG Resume
  writer/helper/route behavior를 정적으로 확인한다.
- `components/augnes-cockpit.tsx`: Perspective Capsule / Handoff Capsule
  copyable handoff preview도 같은 Project Constellation read-only Cockpit
  preview 안에 표시한다. It renders readonly selectable `codex_handoff` text
  for manual review from the static capsule/handoff sample. `npm run
  smoke:perspective-capsule-copyable-handoff-preview`는 package script pointer,
  docs/index pointers, readonly/selectable text surface, no action controls, no
  live SDK call, no provider implementation, no runtime execution, no
  proof/evidence write, no graph DB, no persistence, and no AG Resume
  writer/helper/route behavior를 정적으로 확인한다.
- `PROJECT_CONSTELLATION_USER_INTENT_VALIDATION_V0_1.md`: Project Constellation
  user-intent validation pointer다. It defines browser/computer-use scenarios
  for first-entry orientation, node/edge/cluster meaning, evidence pointer
  comprehension, unresolved tension visibility, boundary and next-action
  clarity, Perspective Capsule / Handoff Capsule comprehension,
  authority-misread prevention, and user question answerability. The paired
  browser report is
  `reports/browser/2026-06-03-project-constellation-user-intent-validation.md`.
  `npm run smoke:project-constellation-user-intent-validation` checks required
  sections, scenario names, report fields, authority clarity, false-affordance
  findings, package/index pointers, scoped changed files, and no forbidden
  positive authority grants. This validation adds no UI implementation change,
  no API route implementation, no runtime behavior, no graph DB, no
  persistence, no proof/evidence write, no Codex SDK execution, no AG Resume
  behavior, and no merge/publish/approval/retry/replay/deploy authority.
- `docs/PERSPECTIVE_HANDOFF_USEFULNESS_EXPERIMENT_PLAN_V0_1.md`: Perspective
  handoff usefulness experiment plan이다. It defines Baseline A ordinary Codex
  prompt comparison, Baseline B Perspective/Handoff Capsule comparison,
  optional ChatGPT human-review baseline, docs/smoke/package-pointer and
  planned implementation-fix/read-only preview scenarios, rubric fields,
  review-note outcome labels, not-done classification guidance, decision gates,
  browser/computer-use and proof-only skipped reasons, and forbidden scope
  boundaries. This pointer is docs/smoke/package-pointer/skill-guidance only,
  non-SSOT, and non-authoritative, with no runtime behavior, no
  UI/API/DB/MCP/App/proof/evidence/Codex SDK authority, no route/auth/consumer
  planning loop, no real auth, no App/MCP consumer, no route response
  expansion, no graph UI, no capsule display expansion, and no
  merge/publish/approval/retry/replay/deploy authority. `npm run
  smoke:perspective-handoff-usefulness-experiment-plan` checks the plan,
  package/index pointer, not-done classification terms, skill instruction-only
  guidance, scoped/content-only boundary behavior, and no forbidden positive
  authority grants.
- `scripts/smoke-boundary-common.mjs`: Project Constellation boundary smokes
  share `project_constellation_boundary_scope_v0_1` scope profile semantics.
  The profile keeps scoped mode as the strict direct-edit gate while explicitly
  allowing only bounded adjacent docs, fixture, smoke, read-only Cockpit preview,
  browser-report, and package-pointer surfaces. It does not add runtime
  behavior, UI action behavior, API/DB/MCP/App tools, graph DB, persistence,
  proof/evidence writes, AG Resume behavior, Codex SDK provider behavior, or
  execution authority.
- `VERIFICATION_EVIDENCE_PACK.md`: 관련 smoke command 색인과 검증 기록
  포인터를 둔다.
- `COCKPIT_PERSPECTIVE_IA_V0_1.md`: Cockpit Perspective IA의 read-only
  surface boundary를 설명한다.
- `CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md`: Augnes Operator Codex plugin v0.2
  docs/metadata/skill/smoke/package-pointer alignment pointer다. ChatGPT Apps
  and Codex Plugins are adjacent OpenAI extension surfaces, not a single
  confirmed product surface, and the shared-substrate framing is strategic
  positioning, not repo authority. The common exchange unit is Perspective
  Capsule / Handoff Capsule. `npm run smoke:augnes-operator-plugin-v2`는 이
  v0.2 boundary를 정적으로 확인한다. This pointer does not add runtime
  behavior, does not add MCP/App tool changes, does not add proof/evidence
  writes, and does not add merge/publish authority.
- `plugins/augnes-operator/skills/augnes-capsule-handoff/SKILL.md`: Augnes
  Operator plugin의 instruction-only Perspective Capsule / Handoff Capsule
  consumption skill이다. It turns copied capsule/handoff material into bounded
  Codex PR workflow discipline while preserving expected files, forbidden
  files, hard constraints, checks, skipped reasons, evidence pointers,
  unresolved tensions, PR body requirements, and final report requirements.
  Dogfood-derived wording refinement adds a short checklist example, concrete
  skipped-reason examples, smoke-only content-only diagnostic guidance, and
  explicit empty-field reporting such as `Blockers: none.`,
  `Repo/task mismatches: none.`, and `Questions requiring user/PM judgment:
  none.` A narrow not-done classification section now tells final reports and
  PR bodies to use `closed`, `implementation_fix`, `impossible_now`,
  `rejected_for_current_goal`, `rejected_for_next_session`,
  `waiting_for_concrete_trigger`, or `manual_next_step` rather than
  deferred/later/나중에 as status values. This remains instruction-only and
  non-authoritative.
  `npm run smoke:augnes-capsule-handoff-skill`는 skill frontmatter, required
  sections, plugin metadata compatibility, docs pointers, package pointer, no
  runtime behavior, no GitHub/OpenAI/Augnes runtime calls, no MCP/App tool
  calls, no proof/evidence writes, no branch/PR creation authority by itself,
  and no merge/publish/approval/retry/replay/deploy authority를 정적으로
  확인한다.
- `types/project-constellation-fixture.ts`: type-only Project Constellation
  fixture/schema boundary for the static public-safe sample fixture and
  read-only preview loop이다. It is non-SSOT and has no runtime schema, no DB
  schema, no API route, no MCP/App tool, no graph DB, no persistence, no
  proof/evidence write, and no Codex SDK execution. `npm run
  smoke:project-constellation-fixture-schema-boundary`는 exported type names,
  fixture literal values, node/edge literals, execution authority preview
  fields, docs/index pointers, package pointer, and type-only non-authority
  wording을 정적으로 확인한다.
- `types/codex-execution-record.ts`: type-only Codex execution record boundary
  for future execution intent, permission profile, approval record, execution
  result, evidence link, resume pointer, risk/check records, host provenance,
  and provider-boundary vocabulary다. It is non-SSOT and has no runtime schema,
  no DB schema, no API route, no MCP/App tool, no proof/evidence write, no AG
  Resume behavior, and no Codex SDK execution/provider implementation. `npm run
  smoke:codex-execution-record-boundary`는 exported type names, permission
  profile/status literals, conceptual fields, evidence pointer semantics,
  docs/index pointers, package pointer, and type-only non-authority wording을
  정적으로 확인한다.
- `docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md`: ChatGPT App/MCP
  read-only surface boundary planning note다. It describes future user-facing
  decision support for Whole Perspective, Project Constellation, Perspective
  Capsule / Handoff Capsule preview, evidence pointers, unresolved tensions,
  boundary / next review, and copyable handoff text. It is
  docs/smoke/package-pointer only, read-only, and non-authoritative, with no
  ChatGPT App tool implementation, no MCP tool implementation, no runtime
  behavior, and no UI/API/DB/MCP/App/proof/evidence/Codex SDK authority. `npm run
  smoke:chatgpt-app-mcp-readonly-surface-boundary`는 planning sections,
  read-only surface terms, authority boundaries, package/index pointers, scoped
  and content-only boundary behavior, and non-goal wording을 정적으로 확인한다.
- `docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md`: read-only API route
  planning boundary for future ChatGPT App/MCP support surfaces다. It is
  docs/smoke/package-pointer only, non-SSOT, and defines route-family,
  response-concept, forbidden-response, auth/security/privacy, browser, and
  implementation-gate vocabulary only. It has no API route, no runtime
  behavior, no UI, no DB, no MCP/App tool, no proof/evidence write, and no
  Codex SDK execution. `npm run smoke:readonly-api-route-planning-boundary`는
  planning sections, read-only route concepts, forbidden response concepts,
  implementation gates, package/index pointers, scoped/content-only boundary
  behavior, and non-authority wording을 정적으로 확인한다.
- `docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md`: read-only API route
  review checklist for future route implementation PRs다. It is
  docs/smoke/package-pointer only, non-SSOT, and defines auth/session, privacy,
  prompt-injection, provenance, response minimization, evidence pointer,
  capsule, Project Constellation, logging/telemetry, browser, and authority
  matrix review items only. It has no API route, no auth implementation, no
  runtime behavior, no UI, no DB, no MCP/App tool, no proof/evidence write, and
  no Codex SDK execution. `npm run smoke:readonly-api-route-review-checklist`는
  checklist sections, review concepts, planning/index pointers,
  package pointer, scoped/content-only boundary behavior, and non-authority
  wording을 정적으로 확인한다.
- `types/readonly-api-route-response.ts`: read-only API route response shape
  boundary다. It is type-only, non-SSOT, and defines future read-only response
  envelope, meta, source refs, Whole Perspective, Project Constellation,
  Perspective Capsule preview, copyable handoff, boundary/next review, and
  forbidden-field vocabulary only. Normal read-only display sections use compact
  `boundary_class` values, while detailed `authority_boundary` and
  `forbidden_fields_removed` lists stay in diagnostics/debug paths. It has no
  API route, no runtime behavior, no auth implementation, no DB, no MCP/App
  tool, no proof/evidence write, and no Codex SDK execution. `npm run
  smoke:readonly-api-route-response-shape-boundary`는 exported type names,
  response concepts, boundary class vocabulary, forbidden-field vocabulary,
  package/index pointers, scoped/content-only boundary behavior, and
  non-authority wording을 정적으로 확인한다.
- `docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md`: first
  read-only API route implementation design packet for candidate
  `GET /api/augnes/read/constellation-preview` vocabulary다. It applies the
  planning boundary, review checklist, type-only response shape boundary, and
  PR #381 Project Constellation user-intent validation baseline before any
  future route implementation. It is docs/smoke/package-pointer only and has
  no route, no API contract, no runtime behavior, no UI, no auth
  implementation, no DB, no MCP/App tool, no proof/evidence write, no Codex SDK
  execution, no provider implementation, no graph DB, no persistence, no AG
  Resume behavior, and no merge/publish/approval/retry/replay/deploy authority.
  `npm run smoke:readonly-api-route-implementation-design-packet`는 required
  sections, placeholder/non-contract route wording, response shape mapping,
  forbidden fields, auth/session, workspace/project scope, fail-closed,
  prompt-injection, privacy/minimization, evidence pointer, capsule,
  Project Constellation, browser/computer-use, package/index pointers,
  scoped/content-only boundary behavior, and no forbidden positive authority
  grants를 정적으로 확인한다.
- `docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md`: read-only API route
  implementation plan for candidate `GET /api/augnes/read/constellation-preview`
  vocabulary다. It answers the PR #382 authenticated workspace/project scope,
  bounded summary/minimization, and first consumer surface questions as a
  planning-only docs/smoke/package-pointer artifact before any route file is
  created. The planned default scope is `project:augnes`, the planned first
  consumer decision is no consumer yet / route-first local validation, and the
  planned response profile maps to `types/readonly-api-route-response.ts`.
  This pointer has no route, no API contract, no runtime behavior, no UI, no
  auth implementation, no DB, no MCP/App tool, no proof/evidence write, no
  Codex SDK execution, no provider implementation, no graph DB, no persistence,
  no AG Resume behavior, and no merge/publish/approval/retry/replay/deploy
  authority. `npm run smoke:readonly-api-route-implementation-plan`는 required
  sections, placeholder/non-contract route wording, design/checklist/planning
  pointers, `types/readonly-api-route-response.ts` mapping, authenticated scope
  decision, fail-closed/no-public-endpoint wording, first consumer decision,
  response minimization, bounded field plan, forbidden fields, prompt-injection,
  privacy, logging/telemetry, browser/computer-use, authority matrix,
  implementation slices, future validation plan, scoped/content-only boundary
  behavior, package pointer, and no forbidden positive authority grants를
  정적으로 확인한다.
- `docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md`: first route-only
  local validation implementation for
  `GET /api/augnes/read/constellation-preview`다. The route is GET/read-only,
  explicitly local-authorized, fail-closed, scoped to `project:augnes`, backed
  only by `fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json`,
  and aligned with `types/readonly-api-route-response.ts`. The default response
  uses boundary class `read_only_local_static_preview` and keeps detailed
  boundary lists in `diagnostics=authority`. It adds no DB query, no MCP/App
  tool, no proof/evidence write, no Codex SDK execution, no graph DB, no
  persistence, and no merge/publish/approval/retry/replay/deploy authority. `npm run
  smoke:readonly-api-route-constellation-preview`는 route/helper existence,
  GET-only route exports, nodejs/force-dynamic route flags, local authorization,
  fail-closed scope behavior, static fixture provenance, minimized response,
  forbidden fields, pointer-only evidence, advisory next actions, authority
  matrix/index pointers, scoped/content-only boundary behavior, and no
  forbidden positive authority grants를 정적으로 확인한다.
- `docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md`: shared read-only local
  access/scope guard for route-only local validation이다. It extracts local URL
  host, `Host`, `X-Forwarded-Host`, GET method, marker header, and
  `project:augnes` scope validation into `lib/readonly-api/access-guard.ts`.
  This is not production auth and adds no hosted/session/OAuth/multi-user auth,
  no secrets/env handling, no consumer surface, no DB query, no UI, no MCP/App
  tool, no proof/evidence write, no Codex SDK execution, no graph DB, no
  persistence, and no merge/publish/approval/retry/replay/deploy authority.
  `npm run smoke:readonly-api-route-access-guard`는 guard exports,
  runtime/import boundaries, local authorization, fail-closed scope,
  forwarded-host hardening, method handling, route compatibility,
  docs/index/authority pointers, scoped/content-only boundary behavior, and no
  forbidden positive authority grants를 정적으로 확인한다.
- `docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md`: real
  authenticated workspace/project scope integration planning pointer for
  `GET /api/augnes/read/constellation-preview`다. It is
  docs/smoke/package-pointer only and recommends keeping the route local-only
  until a concrete auth/session/workspace source is selected. It adds no
  production auth, no hosted/session/OAuth/multi-user auth, no route behavior
  change, no consumer surface, no DB query, no UI, no MCP/App tool, no
  proof/evidence write, no Codex SDK execution, no graph DB, no persistence,
  and no merge/publish/approval/retry/replay/deploy authority. `npm run
  smoke:readonly-api-route-auth-scope-integration-plan`는 required sections,
  current local guard baseline, candidate auth/scope source options, safe
  defer-default decision, fail-closed behavior plan, future slices,
  package/index/authority pointers, scoped/content-only boundary behavior, and
  no forbidden positive authority grants를 정적으로 확인한다.
- `docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md`: read-only
  constellation preview route auth source selection packet이다. It inspects
  repo-local session/workspace/auth-adjacent surfaces and recommends keeping
  the route local-only because no concrete source was found that proves both
  identity and workspace/project membership for this route line. It is
  docs/smoke/package-pointer only and adds no production auth, no route
  behavior change, no consumer surface, no DB query, no UI, no MCP/App tool, no
  proof/evidence write, no Codex SDK execution, no graph DB, no persistence,
  and no merge/publish/approval/retry/replay/deploy authority. `npm run
  smoke:readonly-api-route-auth-source-selection`는 required sections,
  candidates A-E, source selection criteria, comparison matrix, recommended
  Candidate E decision, docs/index/authority pointers, scoped/content-only
  boundary behavior, package pointer, and no forbidden positive authority
  grants를 정적으로 확인한다.
- `docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md` and
  `types/readonly-api-auth-scope.ts`: type-only read-only route auth/scope
  adapter boundary다. It defines request, decision, success, failure,
  error-code, identity, workspace, project, source-kind, forbidden-field, and
  authority-boundary vocabulary for a future fail-closed adapter. It is
  type/docs/smoke/package-pointer only and adds no auth implementation, no
  route behavior change, no consumer surface, no DB query, no UI, no MCP/App
  tool, no proof/evidence write, no Codex SDK execution, no graph DB, no
  persistence, and no merge/publish/approval/retry/replay/deploy authority.
  `npm run smoke:readonly-api-route-auth-scope-adapter-boundary`는 exported
  type names, error codes, source kinds, forbidden fields, type comments,
  docs/index/authority pointers, scoped/content-only boundary behavior,
  package pointer, and no forbidden positive authority grants를 정적으로
  확인한다.
- `docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md`: Candidate D
  explicit local development auth adapter plan이다. It maps Candidate D to
  `types/readonly-api-auth-scope.ts` and
  `docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md` at planning
  level only. It is docs/smoke/package-pointer only and adds no auth
  implementation, no production auth, no route behavior change, no consumer
  surface, no DB query, no UI, no MCP/App tool, no proof/evidence write, no
  Codex SDK execution, no graph DB, no persistence, and no
  merge/publish/approval/retry/replay/deploy authority. `npm run
  smoke:readonly-api-route-local-dev-auth-adapter-plan`는 required sections,
  Candidate D local-only semantics, type-boundary mapping, local guard
  composition plan, fail-closed behavior plan, forbidden fields, future
  slices/tests, docs/index/authority pointers, scoped/content-only boundary
  behavior, package pointer, and no forbidden positive authority grants를
  정적으로 확인한다.
- `docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md`: Candidate D
  explicit local development auth adapter implementation boundary다. It
  documents the optional strict debug route validation adapter in
  `lib/readonly-api/local-dev-auth-adapter.ts` for
  `GET /api/augnes/read/constellation-preview`. It is not required for the
  default local Cockpit preview and adds no production auth, no hosted auth, no
  OAuth, no session identity, no workspace membership, no route consumer, no DB
  query, no UI, no MCP/App tool, no proof/evidence write, no Codex SDK
  execution, no graph DB, no persistence, and no
  merge/publish/approval/retry/replay/deploy authority. `npm run
  smoke:readonly-api-route-local-dev-auth-adapter`는 helper existence, type-only
  boundary import, local guard composition, strict Candidate D declaration
  headers, fail-closed behavior, minimized route response, forbidden fields,
  docs/index/authority pointers, package pointer, scoped/content-only boundary
  behavior, and no forbidden positive authority grants를 확인한다.
- `docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md`: read-only
  constellation preview route의 future real auth/scope implementation gate
  plan이다. It is docs/smoke/package-pointer only and adds no real auth
  implementation, no production auth, no hosted auth, no route behavior change,
  no consumer, no DB query, no UI, no MCP/App tool, no proof/evidence write, no
  Codex SDK execution, no graph DB, no persistence, and no
  merge/publish/approval/retry/replay/deploy authority. `npm run
  smoke:readonly-api-route-real-auth-gate-plan`는 current local-only baseline,
  Candidate D transition boundary, required source evidence, identity and
  workspace/project membership gates, fail-closed cases, forbidden fields,
  future file/smoke candidates, docs/index/authority pointers,
  scoped/content-only boundary behavior, package pointer, and no forbidden
  positive authority grants를 확인한다.
- `docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md`:
  read-only constellation preview route의 local-only consumer scope decision
  packet이다. It is docs/smoke/package-pointer only and recommends Option A by
  default: keep the route route-only with no consumer until real auth exists or
  PM explicitly selects a local-only consumer surface in a separate
  implementation PR. It adds no consumer implementation, no route behavior
  change, no real auth implementation, no DB query, no UI, no MCP/App tool, no
  proof/evidence write, no Codex SDK execution, no graph DB, no persistence,
  and no merge/publish/approval/retry/replay/deploy authority. `npm run
  smoke:readonly-api-route-local-only-consumer-scope-decision`는 candidate
  consumer surfaces, Option A default decision, mandatory future consumer
  gates, false-affordance review, browser/computer-use requirements,
  docs/index/authority pointers, package pointer, scoped/content-only boundary
  behavior, and no forbidden positive authority grants를 확인한다.
- `docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md`: Cockpit
  local-only constellation route preview implementation plan이다. It is
  docs/smoke/package-pointer only and defines future placement, local-only
  copy, false-affordance gates, response minimization, browser/computer-use
  validation, future file candidates, and smoke expectations before any
  Cockpit consumer code changes. It adds no Cockpit implementation, no consumer
  implementation, no route behavior change, no real auth implementation, no DB
  query, no UI, no MCP/App tool, no proof/evidence write, no Codex SDK
  execution, no graph DB, no persistence, and no
  merge/publish/approval/retry/replay/deploy authority. `npm run
  smoke:cockpit-local-only-constellation-route-preview-plan`는 required
  sections, current local-only route/auth baseline, ChatGPT App/MCP deferral,
  local-only copy, forbidden controls, response field and minimization plan,
  browser/computer-use plan, future implementation file candidates,
  docs/index/authority pointers, package pointer, scoped/content-only boundary
  behavior, and no forbidden positive authority grants를 확인한다.
- `docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md`: Cockpit
  local-only constellation route preview implementation이다. It is a local-only
  Cockpit implementation for
  `GET /api/augnes/read/constellation-preview?scope=project:augnes` and sends
  only the local read-only marker header by default. It displays boundary class
  `read_only_local_static_preview` instead of long boundary lists and now has a
  `Copy Codex handoff` action that copies a concise Codex-ready prompt from the
  loaded Project Constellation preview. Users can select which advisory next
  action drives the copied handoff, and the copied prompt prioritizes evidence
  pointers for that selected action. The copy card shows the top
  selected-action evidence refs beside the copy action and has a read-only
  expanded handoff preview that uses the same generated handoff text as the copy
  action for manual fallback when clipboard is unavailable. A `Select preview
  text` action selects the read-only preview text without adding another
  clipboard writer. The copy action writes only to the local clipboard. It adds
  no App/MCP, no production auth, no hosted auth, no DB query, no proof/evidence
  write, no Codex SDK execution, no graph DB, no persistence, and no
  merge/publish/approval/retry/replay/deploy authority. The browser/
  computer-use report is
  `reports/browser/2026-06-04-cockpit-local-only-constellation-route-preview.md`.
  `npm run smoke:cockpit-local-only-constellation-route-preview`는 stable
  Cockpit section id, visible local-only copy, copy handoff action, required
  route headers, displayed and omitted response field families,
  forbidden-control absence, docs/index/authority/report pointers, package
  pointer, scoped/content-only boundary behavior, and no forbidden positive
  authority grants를 확인한다.
- `docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md`: read-only
  Project Constellation local-only route and Cockpit consumer loop closeout
  packet이다. It is closeout-only, marks the local-only route/Cockpit consumer
  milestone closed, references PR #394 browser/computer-use validation, and
  states no route/UI/auth/DB/App/MCP/proof/Codex/graph/persistence behavior
  changes. `npm run smoke:readonly-constellation-local-only-consumer-closeout`
  는 completed PR chain, closed milestone, deferred real auth and ChatGPT
  App/MCP status, next allowed/forbidden PR types, docs/index/authority
  pointers, package pointer, scoped/content-only boundary behavior, and no
  forbidden positive authority grants를 확인한다.
- `PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md`: Perspective Capsule / Handoff
  Capsule의 repo-local, non-SSOT, docs-only, read-only/non-authoritative,
  contract/design-only pointer다. `npm run smoke:perspective-capsule-contract`
  는 이 contract boundary를 정적으로 확인한다. This pointer does not add
  runtime schema, API route, MCP/App tool, persistence, graph DB,
  proof/evidence write, Codex task launch, or plugin runtime action.
- `docs/PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_V0_1.md`: Perspective ingest
  constellation preview v0.1 local-only implementation boundary다. It records
  the first graph-first preview loop from synthetic public-safe ChatGPT/Codex
  record fixtures to SessionEpisode-like normalized inputs, a
  `PerspectiveIngestConstellationPreviewResponse`, a guarded local-only read
  route, Cockpit SVG nodes/edges, selected-node details, and copyable ChatGPT
  review and Codex handoff packets. The route is
  `GET /api/augnes/read/perspective-ingest-constellation-preview?scope=project:augnes&source=sample:chatgpt`
  or `source=sample:codex` with
  `x-augnes-local-readonly: perspective-ingest-constellation-preview-v0.1`.
  The preview has no raw private history persistence, no automatic ChatGPT
  account scraping, no OAuth, no external calls, no OpenAI calls, no GitHub
  calls, no DB writes, no graph DB, no proof/evidence/readiness writes, no
  Codex execution, and no branch/PR/merge/publish/approval/deploy authority.
  `npm run smoke:perspective-ingest-constellation-preview` confirms fixture
  safety fields, type exports, exact helper and route file pointers, Cockpit
  copy button text and section id, CSS hooks, package pointer, graph packet
  fields, and route/helper network-call absence.
- `docs/PERSPECTIVE_INGEST_LOCAL_PASTED_TEXT_PREVIEW_V0_1.md`: manual
  pasted-text Perspective ingest preview v0.1 local-only implementation
  boundary다. It records the first real user-provided local input loop from
  `manual:pasted_text` to deterministic pasted-text parsing, a
  `PerspectiveIngestSessionEpisode`, the existing
  `PerspectiveIngestConstellationPreviewResponse` style packet, a POST-only
  local preview guard, Cockpit SVG nodes/edges, selected-node details, and
  copyable ChatGPT review and Codex handoff packets. The route is
  `POST /api/augnes/read/perspective-ingest-local-preview?scope=project:augnes`
  with `x-augnes-local-readonly: perspective-ingest-local-preview-v0.1`. The
  preview rejects empty, too-large, unsupported, invalid JSON, and obvious
  secret-like input without raw payload echo. The preview has no raw private
  history persistence, no automatic ChatGPT account scraping, no OAuth, no
  export zip parser, no real Codex thread import, no file upload, no external
  calls, no OpenAI calls, no GitHub calls, no DB query, no DB writes, no graph
  DB, no proof/evidence/readiness writes, no Codex execution, and no
  branch/PR/merge/publish/approval/deploy authority. `npm run
  smoke:perspective-ingest-local-pasted-text-preview` confirms the POST route,
  guard, validation helper, manual adapter, packet-builder support, Cockpit
  labels/buttons, docs boundaries, package pointer, and forbidden external
  call/write patterns. The browser/computer-use dogfood report for the
  pasted-text UX is
  `reports/browser/2026-06-05-perspective-ingest-local-pasted-text-dogfood.md`.
- `CODEX_SDK_EXECUTION_AUTHORITY_DESIGN_V0_1.md`: Codex SDK execution
  authority design v0.1의 repo-local, non-SSOT, docs/smoke/package-pointer
  only, design-only pointer다. It maps official Codex SDK thread/run/resume,
  sandbox, permission profile, and approval concepts into future Augnes
  execution-record vocabulary. `npm run smoke:codex-sdk-execution-authority-design`
  는 이 boundary를 정적으로 확인한다. This pointer has no live SDK call, no
  SDK import, no runtime execution, no credentials/auth/env changes, no
  proof/evidence writes, no AG Resume writer/helper/route changes, and no
  Project Constellation runtime/UI behavior.
- Boundary smokes support explicit cross-PR content-only diagnostics with
  `AUGNES_BOUNDARY_SMOKE_MODE=content-only`. This mode is non-SSOT,
  read-only, and non-authoritative; it skips changed-file allowlists only by
  explicit opt-in and does not replace scoped profile validation for direct
  edits.

Boundary 요약:

- `PerspectiveSnapshot`은 derived-view-only read model이다.
- `research_diagnostics`는 `log_only`이고 non-authoritative다.
- `loopness_hint`는 유일한 bounded `log_only` diagnostic object다.
- `sidecar_e_t`, `meta_wm_hint`, `bsl_hint`, `comp_index_hint`는 structured
  placeholder다.
- `sidecar_e_t`는 실제 Sidecar state, QP output, z_t regime commit이 아니다.
- 위 항목들은 authority, proof, readiness, source of truth, Gate/SRF input,
  Claim confidence, Evidence status, publication readiness, proposal scoring,
  commit/reject input, Cockpit action input이 아니다.

### 최근 dogfooding research 포인터 (repo-local, non-SSOT)

이 포인터들은 Active set을 늘리거나 새 권위를 만들지 않는다. Augnes
development dogfooding과 Perspective continuity 연구 방향을 찾기 위한
repo-local 색인이다.

- `AUGNES_DOGFOODING_RESEARCH_DIRECTION_V0_1.md`: Augnes 개발 작업을 첫
  dogfooding/evaluation context로 다루는 non-SSOT research direction이다.
- `AUGNES_PERSPECTIVE_CONTINUITY_RESEARCH_NOTE_V0_1.md`: project context가
  시간에 따라 어떻게 유지, 수정, 수리, 전환, 은퇴, 또는 boundary-block
  되는지 논의하기 위한 non-authoritative research vocabulary note다.

이 문서들은 Active set을 확장하지 않고 runtime/schema/implementation/
diagnostic/evaluation authority를 만들지 않는다. production-readiness 또는
autonomous capability를 의미하지 않는다.

Boundary 요약: 이 문서들은 `PerspectiveSnapshot` behavior, diagnostics,
schema, routes, Cockpit controls, 또는 Augnes Core authority를 변경하지
않는다.

### 최근 Research candidate review surface 포인터 (repo-local, non-SSOT)

이 포인터는 Active set을 늘리거나 새 권위를 만들지 않는다. 현재
Research capability lane의 첫 product-facing contract를 찾기 위한
repo-local 색인이다.

- `docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md`: manually supplied
  source/reference/notes를 candidate-only, non-authoritative review bundle로
  정리하는 docs contract다.
- `fixtures/research-candidate-review.sample.v0.1.json`: public-safe sample
  fixture for source provenance, claims, evidence, tensions, knowledge gaps,
  perspective delta candidates, and follow-up work candidates.
- `types/research-candidate-review.ts`: type-only, non-authoritative preview
  contract for the fixture shape. It is not a DB schema, not an API route, and
  not runtime behavior.
- `npm run smoke:research-candidate-review-surface-v0-1`: doc headings,
  fixture shape/counts, candidate boundaries, source grounding, package/index
  pointers, and forbidden implementation-pattern absence를 정적으로 확인한다.
- `npm run smoke:research-candidate-review-types-v0-1`: type literals,
  fixture alignment, source ref integrity, count consistency, cross-reference
  integrity, and non-authority pointers를 정적으로 확인한다.
- `components/augnes-cockpit.tsx`: Research Candidate Review read-only
  Cockpit/Perspective static fixture preview. It renders
  `fixtures/research-candidate-review.sample.v0.1.json` through
  `types/research-candidate-review.ts` as static fixture only,
  non-authoritative review material, with no runtime/API/DB/provider/retrieval/promotion behavior in this slice.
- `lib/research-candidate-review/manual-note-parser.ts`: preview-only deterministic parser
  for bounded manual pasted notes. It produces Research
  Candidate Review preview data with no provider calls, no retrieval, no DB writes, no runtime/API route, no UI input behavior, no proof/evidence write, no work item creation, and no promotion behavior. The parser itself is still a deterministic local library, not a route or storage layer.
- `fixtures/research-candidate-review.manual-note.sample.v0.1.txt`:
  public-safe manual note parser input fixture.
- `fixtures/research-candidate-review.manual-note-preview.sample.v0.1.json`:
  expected public-safe parser output fixture.
- `docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md`: static audit only,
  non-authoritative gate that prevents raw source titles, URLs, provider
  IDs, raw thread/run/session IDs, arbitrary user strings, episode IDs, and
  demo refs from becoming canonical state labels or operational tags. It adds
  no runtime/API/DB/provider/retrieval/promotion behavior.
- `fixtures/research-candidate-canonical-promotion-gates.sample.v0.1.json`:
  public-safe gate samples for blocked promotion targets, allowed pointer
  uses, and allowed low-cardinality vocabulary.
- `npm run smoke:research-candidate-canonical-promotion-gates-v0-1`: gate
  doc/fixture shape, blocked raw-string promotions, allowed pointer uses,
  allowed low-cardinality vocabulary, type alignment, existing fixture
  `target_perspective_key` safety, and non-authority boundaries를 정적으로
  확인한다.
- `npm run smoke:research-candidate-review-cockpit-preview-v0-1`: Cockpit
  fixture wiring, read-only section markers, candidate family rendering,
  docs/index pointers, no parser behavior, no work item creation, no
  proof/evidence write, and non-authority boundaries를 정적으로 확인한다.
- `npm run smoke:research-candidate-review-manual-parser-v0-1`: parser
  purity, prefix grammar, input/output fixture alignment, parser execution,
  source ref integrity, count consistency, cross-reference integrity,
  canonical gate preservation, and non-authority boundaries를 정적으로 확인한다.
- parser output Cockpit/Perspective static preview panel:
  `components/augnes-cockpit.tsx` renders
  `fixtures/research-candidate-review.manual-note-preview.sample.v0.1.json`
  beside the original static fixture and displays
  `fixtures/research-candidate-review.manual-note.sample.v0.1.txt` as
  reference text only. This is a read-only static parser output fixture panel
  with no runtime UI input, no live parser execution, no provider calls, no retrieval, no DB writes, no proof/evidence write, no work item creation, no promotion behavior, and no runtime/API route.
- `npm run smoke:research-candidate-review-parser-output-cockpit-preview-v0-1`:
  parser output fixture wiring, runtime parser guard, read-only section
  markers, parser output fixture integrity, docs/index pointers, and
  non-authority boundaries를 정적으로 확인한다.
- Cockpit manual pasted note preview UI shell:
  `components/research-candidate-manual-note-preview-panel.tsx` is rendered
  from `components/augnes-cockpit.tsx` in the Perspective tab. It lets an
  operator paste manual note text, trigger local-only deterministic parsing via
  `lib/research-candidate-review/manual-note-parser.ts`, or explicitly create
  a bounded runtime preview draft through the
  `app/api/research-candidate-review/manual-note-preview` route file, and inspect
  read-only Research Candidate Review preview output. Runtime preview drafts
  use that bounded runtime preview route plus
  `lib/research-candidate-review/manual-note-runtime-preview.ts` for the
  response boundary contract and
  `lib/research-candidate-review/manual-note-preview-draft-store.ts` for a
  scoped preview-draft database write to
  `research_candidate_manual_note_preview_drafts`; raw pasted note text is not
  persisted. The lane adds no durable candidate/review/receipt storage, no
  canonical Perspective storage, no promotion/reject/defer workflow, no
  proof/evidence writes, no work item creation, no provider/OpenAI calls, no
  retrieval/RAG/source fetching, no Codex execution, and no external handoff
  sending.
- `npm run smoke:research-candidate-manual-note-preview-ui-v0-1`:
  `scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs` checks the
  dedicated component, Cockpit import/render wiring, existing parser reuse,
  retained local parser execution, bounded same-origin runtime draft action,
  rendered parser output fields, visible authority boundary copy, docs/index
  pointer, package script, and forbidden implementation-pattern absence.
- `npm run smoke:research-candidate-runtime-preview-draft-v0-1`:
  `scripts/smoke-research-candidate-runtime-preview-draft-v0-1.mjs` checks the
  bounded route, existing parser reuse, non-empty/max input guards,
  runtime_boundary and no_side_effects response metadata, preview-draft table
  and migration wiring, UI runtime action, package/index pointers, no raw note
  text persistence, and absence of provider/retrieval/Codex/proof/evidence/work
  creation or promotion patterns.
- Manual note preview draft read/list/discard lane:
  `app/api/research-candidate-review/manual-note-preview-drafts` provides
  bounded same-origin read/list access for stored parsed preview JSON, plus a
  discard marker action for preview-draft lifecycle hygiene. The lane derives
  `active_preview_draft` versus `discarded_preview_draft` from
  `research_candidate_manual_note_preview_draft_discards`, keeps raw note text
  unavailable, and does not create promotion/reject/defer workflow authority,
  canonical Perspective state, proof/evidence rows, work items, provider calls,
  retrieval/RAG/source fetching, Codex execution, or external handoffs.
- `npm run smoke:research-candidate-preview-draft-read-discard-v0-1`:
  `scripts/smoke-research-candidate-preview-draft-read-discard-v0-1.mjs`
  checks the list/detail/discard route files, preview draft store reader,
  limit/include-discarded/id/reason validation, runtime_boundary and
  no_side_effects response metadata, additive discard marker table, Recent
  runtime preview drafts UI affordances, package/index pointers, no browser
  persistence, no raw note text fields, and no forbidden proof/evidence/work
  item/state/Perspective writes.
- Manual note preview draft list sorting/filtering lane:
  `app/api/research-candidate-review/manual-note-preview-drafts` now accepts
  bounded list query controls for lifecycle, created-at sort order, warning
  state, candidate count state, and limit while preserving `include_discarded`
  compatibility. Cockpit/Perspective renders compact operator-facing controls
  for those filters inside Recent runtime preview drafts. This is a no-schema
  refinement over stored parsed preview JSON and discard markers only; it adds
  no raw note text persistence, full-text search, provider/retrieval/source
  fetching, proof/evidence rows, work items, canonical Perspective writes,
  Codex execution, browser persistence, or promotion/reject/defer workflow.
- `npm run smoke:research-candidate-preview-draft-list-filters-v0-1`:
  `scripts/smoke-research-candidate-preview-draft-list-filters-v0-1.mjs`
  checks the list route lifecycle/sort/warnings/candidates/limit query
  contract, `include_discarded` compatibility, response shape, bounded
  store-side lifecycle/sort handling, TypeScript warning/candidate filtering,
  UI controls and filter summary copy, package/index pointers, no browser
  persistence, and forbidden provider/retrieval/proof/evidence/work/state
  write-pattern absence.
- Manual note preview draft label refinement lane:
  `app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/label`
  provides a bounded same-origin `PATCH` route for operator-facing preview
  label metadata. Cockpit/Perspective lets operators provide an optional
  `operator_note_label` before creating a runtime preview draft, shows labels
  prominently in Recent runtime preview drafts with an `Untitled preview draft`
  fallback, and allows compact inline label edits after creation. The lane
  updates only `operator_note_label` and `updated_at` on
  `research_candidate_manual_note_preview_drafts`; raw note text remains
  unavailable and unpersisted, labels do not promote/classify/canonize drafts,
  and the lane adds no provider/OpenAI calls, retrieval/RAG/source fetching,
  proof/evidence rows, work items, canonical Perspective writes, Codex
  execution, browser persistence, or promotion/reject/defer workflow.
- `npm run smoke:research-candidate-preview-draft-label-v0-1`:
  `scripts/smoke-research-candidate-preview-draft-label-v0-1.mjs` checks the
  label route `PATCH` contract and validation, label-specific runtime boundary
  and no-side-effect response metadata, preview-draft store label update shape,
  UI label input/display/edit affordances, preserved list filters/open/discard
  behavior, package/index pointers, no browser persistence, and forbidden
  provider/retrieval/proof/evidence/work/state write-pattern absence.
- Manual note preview draft activity/readout lane:
  `app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/activity`
  provides a bounded same-origin `GET` route for operator-facing preview draft
  lifecycle metadata. Create, label update/clear, and discard paths write
  metadata-only activity rows to
  `research_candidate_manual_note_preview_draft_activities`; Cockpit/Perspective
  exposes a compact manual Load activity readout for opened stored drafts. The
  activity table does not store raw note text or preview JSON snapshots, older
  drafts may have no historical activity rows, and activity remains non-canonical
  preview metadata only: no approval/reject/defer/promote workflow, proof/evidence
  rows, work items, canonical Perspective writes, provider/OpenAI calls,
  retrieval/RAG/source fetching, Codex execution, browser persistence, or
  external handoff sending.
- `npm run smoke:research-candidate-preview-draft-activity-v0-1`:
  `scripts/smoke-research-candidate-preview-draft-activity-v0-1.mjs` checks the
  activity table schema and migrations, activity `GET` route validation and
  response boundary, store activity hooks for create/label/discard, UI readout
  copy/action, preserved create/list/filter/open/label/discard behavior,
  package/index pointers, no browser persistence, no raw note text or preview
  JSON activity storage, and forbidden provider/retrieval/proof/evidence/work/state
  write-pattern absence.
- Manual note preview draft lifecycle summary lane:
  `app/api/research-candidate-review/manual-note-preview-drafts` returns
  bounded returned-list lifecycle summary counts plus per-draft
  `lifecycle_summary` metadata for label state, discard state, activity count,
  and latest activity. Cockpit/Perspective renders compact list counts and
  per-draft badges so operators can scan active/discarded/activity status
  without opening every draft. Counts are computed over the returned bounded
  list window, are preview-list metadata only, and do not create approval,
  reject/defer/promote, proof/evidence, work item, canonical Perspective,
  provider/OpenAI, retrieval/RAG/source fetching, Codex execution, browser
  persistence, or external handoff behavior.
- `npm run smoke:research-candidate-preview-draft-lifecycle-summary-v0-1`:
  `scripts/smoke-research-candidate-preview-draft-lifecycle-summary-v0-1.mjs`
  checks the list response summary contract, per-draft lifecycle summary
  contract, store read-only summary computation from preview/discard/activity
  tables, UI summary counts and badges, preserved create/list/filter/open/label
  activity/discard behavior, package/index pointers, no browser persistence,
  and forbidden provider/retrieval/proof/evidence/work/state write-pattern
  absence.
- Cockpit empty-runtime startup fallback lane:
  `GET /api/state/brief`, `GET /api/state/snapshot`,
  `GET /api/state/trajectory`, `GET /api/work`, and `GET /api/proposals`
  return controlled empty envelopes when a fresh local runtime DB is missing
  the optional startup tables `state_entries`, `work_items`,
  `state_transitions`, or `state_delta_proposals`. The fallback uses
  `fallback_reason: "missing_optional_runtime_table"`, keeps route-compatible
  empty arrays/default objects, and adds `runtime_boundary` plus
  `no_side_effects` metadata. It does not create fake seed data, mutate schema,
  write state/work/proof/evidence/Perspective rows, call providers, perform
  retrieval/source fetching, execute Codex, use browser persistence, or hide
  unexpected DB errors.
- `npm run smoke:cockpit-empty-runtime-startup-fallback-v0-1`:
  `scripts/smoke-cockpit-empty-runtime-startup-fallback-v0-1.mjs` checks the
  startup route fallback contract, recognized optional runtime table set,
  route-compatible empty response fields, unexpected-error rethrow guard,
  package/index pointers, and forbidden write/provider/retrieval/proof/evidence/
  work/promotion/browser-persistence pattern absence.
- Approval/publication empty-runtime startup fallback lane:
  `GET /api/publications/summary` and
  `GET /api/approval-gate-state/summary` return controlled empty envelopes
  when a fresh local runtime DB is missing recognized optional publication or
  approval gate tables: `publication_drafts`, `delivery_ledger`,
  `publication_approval_requests`, `publication_approval_decisions`, and
  `publication_readiness_checks`. The fallback preserves route-compatible empty
  summary/count/limit shapes and adds `empty_runtime`, `fallback_reason:
  "missing_optional_runtime_table"`, `missing_tables`, `runtime_boundary`, and
  `no_side_effects` metadata. It does not approve, publish, retry, create
  approval/publication workflows, seed rows, mutate schema from read routes,
  write proof/evidence/Perspective/work/state rows, call providers, perform
  retrieval/source fetching, execute Codex, use browser persistence, or hide
  unexpected DB errors.
- `npm run smoke:approval-publication-empty-runtime-startup-fallback-v0-1`:
  `scripts/smoke-approval-publication-empty-runtime-startup-fallback-v0-1.mjs`
  checks the approval/publication optional table allowlist, route fallback
  wiring, route-compatible empty summary/count shapes, preserved invalid-query
  behavior, unexpected-error rethrow guard, package/index pointers, and
  forbidden write/provider/retrieval/proof/evidence/work/promotion/browser-
  persistence pattern absence.
- Cockpit startup readiness readout lane:
  `components/cockpit-startup-readiness-readout.tsx` renders a read-only
  Startup readiness panel in Cockpit/Perspective near the manual note preview
  lane. It checks the state brief/snapshot/trajectory, work, proposal,
  publication summary, approval gate summary, and manual note preview draft
  list routes with same-origin `GET` requests only, then classifies each surface
  as `initialized`, `empty_runtime`, `validation_bounded`, or `unavailable`.
  The panel shows counts, `last_checked_at`, per-surface route/status/HTTP
  status, `fallback_reason`, `missing_tables`, and concise notes. Readiness is informational only.
  Controlled empty-runtime means the local DB may not be initialized for that surface.
  The panel does not run setup, migration, seed,
  proof/evidence, work item, promotion, provider/OpenAI, retrieval/source
  fetching, Codex execution, external handoff, browser persistence, or
  canonical Perspective actions.
- `npm run smoke:cockpit-startup-readiness-readout-v0-1`:
  `scripts/smoke-cockpit-startup-readiness-readout-v0-1.mjs` checks the
  readiness component route list, classification logic, fallback metadata
  display, counts/copy, same-origin GET-only boundary, absence of setup/migrate/
  seed/fix/promote action buttons, render hook placement, responsive CSS,
  package/index pointers, and preservation of the prior startup fallback and
  manual note preview smoke scripts.
- Manual note preview draft promotion readiness preflight lane:
  `GET /api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/promotion-readiness`
  runs a read-only Promotion readiness preflight for an opened stored manual
  note preview draft. It reads the existing preview draft, discard marker, and
  activity metadata, then returns `readiness_status` (`blocked`,
  `needs_operator_review`, or `ready_for_promotion_discussion`),
  `readiness_score`, gate results, blockers, warnings, next review steps,
  source summary, candidate summary, lifecycle summary, runtime boundary, and
  no-side-effects metadata. Gates cover lifecycle, storage boundary, authority,
  parser warnings, source refs, claim/evidence candidates, tensions/gaps,
  follow-up work, labels, activity, and canonical link guards. Ready for promotion discussion is not promotion authority.
  The preflight does not
  promote, approve, reject, defer, write proof/evidence, create work items,
  mutate Perspective/canonical state, fetch sources, run retrieval/RAG, call
  providers/OpenAI, execute Codex, send handoffs, store raw note text, use
  browser persistence, or change schema.
- `npm run smoke:research-candidate-preview-draft-promotion-readiness-v0-1`:
  `scripts/smoke-research-candidate-preview-draft-promotion-readiness-v0-1.mjs`
  checks the promotion readiness route, pure helper, readiness status values,
  gate coverage, response boundary/no-side-effects contract, read-only route
  and helper behavior, UI panel copy/actions, preserved startup/manual note
  flows, CSS, package/index pointers, no browser persistence, and forbidden
  provider/retrieval/proof/evidence/work/Codex/promotion action pattern absence.
- Manual note promotion boundary audit artifact:
  `lib/research-candidate-review/manual-note-promotion-boundary-audit.ts`,
  `fixtures/research-candidate-review.manual-note-promotion-boundary-audit.sample.v0.1.json`,
  and `npm run smoke:research-candidate-promotion-boundary-audit-v0-1`
  maps current readiness gates to future dry-run/write authority boundaries.
  This adds no CI authority, no product approval authority, no promotion
  authority, no route, no UI, no write authority, no proof/evidence, no
  Perspective/canonical graph write, no provider/retrieval/source fetch, no
  work item, no schema/migration code, and no dependency.
- Manual note no-write promotion dry-run plan lane:
  `lib/research-candidate-review/manual-note-preview-draft-promotion-dry-run-plan.ts`,
  `GET /api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/promotion-dry-run-plan`,
  `components/research-candidate-promotion-dry-run-plan-readout.tsx`,
  `fixtures/research-candidate-review.manual-note-promotion-dry-run-plan.sample.v0.1.json`,
  and `npm run smoke:research-candidate-promotion-dry-run-plan-v0-1`
  add selected preview draft -> no-write promotion plan coverage with an
  operator-visible Cockpit readout and local clipboard only Markdown/JSON copy.
  The route reads the selected stored preview draft, activity metadata,
  promotion readiness preflight, and boundary audit to produce hypothetical
  targets, proposed canonical deltas marked hypothetical only, required future
  write authorities, blocked side effects, runtime boundary, and no-side-effect
  metadata. It adds no actual promotion, no proof/evidence write, no
  Perspective/canonical graph write, no work item, no provider/retrieval/source
  fetch, no external handoff, no dry-run plan persistence, no schema/migration
  code, and no dependency.
- Manual note dry-run candidate review and authority design packets:
  `lib/research-candidate-review/manual-note-dry-run-candidate-review-and-authority-design.ts`,
  `components/research-candidate-dry-run-candidate-review-design-panel.tsx`,
  `fixtures/research-candidate-review.manual-note-dry-run-candidate-review-packet.sample.v0.1.json`,
  `fixtures/research-candidate-review.manual-note-authority-gated-promotion-design-packet.sample.v0.1.json`,
  and `npm run smoke:research-candidate-dry-run-candidate-review-design-v0-1`
  add local-only dry-run candidate review, operator-visible selections,
  local clipboard only selected-review copy, and an authority-gated actual
  promotion design packet. This adds no route, no write authority, no
  persistence, no actual promotion, no proof/evidence write, no
  Perspective/canonical graph write, no work item, no provider/retrieval/source
  fetch, no external handoff, no schema/migration code, and no dependency.
- Manual note disabled-by-default actual promotion write adapter skeleton:
  `lib/research-candidate-review/manual-note-disabled-promotion-write-adapter.ts`,
  `POST /api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/disabled-promotion-write-adapter-readiness`,
  `components/research-candidate-disabled-promotion-write-adapter-readout.tsx`,
  `fixtures/research-candidate-review.manual-note-disabled-promotion-write-adapter-readiness.sample.v0.1.json`,
  and `npm run smoke:research-candidate-disabled-promotion-write-adapter-v0-1`
  add a disabled readiness route, disabled adapter helper/types,
  operator-visible disabled adapter readiness readout, and local disabled
  readiness copy packet. This is a disabled skeleton only: no normal product
  write, no actual promotion, no proof/evidence write, no Perspective/canonical
  graph write, no work item, no provider/retrieval/source fetch, no external
  handoff, no adapter readiness persistence, no schema/migration code, and no
  dependency. Browser-backed validation uses the best available method in the
  environment, not a Playwright-only assumption.
- Manual note disabled adapter contract review and temp harness:
  `lib/research-candidate-review/manual-note-disabled-adapter-contract-review-and-temp-harness.ts`,
  `components/research-candidate-disabled-adapter-temp-harness-readout.tsx`,
  `fixtures/research-candidate-review.manual-note-disabled-adapter-contract-review.sample.v0.1.json`,
  `fixtures/research-candidate-review.manual-note-disabled-adapter-temp-harness.sample.v0.1.json`,
  `npm run smoke:research-candidate-disabled-adapter-temp-harness-v0-1`,
  and `npm run harness:research-candidate-disabled-adapter-temp-harness-v0-1`
  add local-only disabled adapter contract review, a temp/non-product execution
  harness, operator-visible temp harness readout, local clipboard only copy,
  and optional `/tmp/augnes-disabled-adapter-temp-harness-v0-1` artifacts.
  This adds no new route, no normal product write, no actual promotion, no
  proof/evidence write, no Perspective/canonical graph write, no work item, no
  provider/retrieval/source fetch, no external handoff, no durable persistence,
  no schema/migration code, and no dependency. Browser-backed validation uses
  the best available method in the environment, not a Playwright-only
  assumption.
- Manual note fixture-only disabled write adapter contract tests:
  `lib/research-candidate-review/manual-note-disabled-write-adapter-contract-tests.ts`,
  `fixtures/research-candidate-review.manual-note-disabled-write-adapter-contract-test-cases.v0.1.json`,
  `npm run smoke:research-candidate-disabled-write-adapter-contract-tests-v0-1`,
  and `npm run contracts:research-candidate-disabled-write-adapter-contract-tests-v0-1`
  add a positive fixture chain, negative mutation matrix, invariant checker,
  and `/tmp contract-test report runner` for disabled write adapter contracts.
  This is fixture-only validation with no new route, no UI behavior change, no
  normal product write, no actual promotion, no proof/evidence write, no
  Perspective/canonical graph write, no work item, no provider/retrieval/source
  fetch, no external handoff, no durable persistence, no schema/migration/dependency.
  Browser-backed validation uses the best available method and may record the
  local `/tmp` contract-test report if present.
- Manual note disabled write adapter in-memory transaction plan:
  `lib/research-candidate-review/manual-note-disabled-write-adapter-transaction-plan.ts`,
  `fixtures/research-candidate-review.manual-note-disabled-write-adapter-transaction-plan.sample.v0.1.json`,
  `fixtures/research-candidate-review.manual-note-disabled-write-adapter-abort-result.sample.v0.1.json`,
  `npm run smoke:research-candidate-disabled-write-adapter-transaction-plan-v0-1`,
  and `npm run plan:research-candidate-disabled-write-adapter-transaction-plan-v0-1`
  add a disabled write adapter in-memory transaction plan, abort-only non-product
  execution harness, and `/tmp transaction-plan report runner`. This adds no
  new route, no UI behavior change, no normal product write, no actual
  promotion, no proof/evidence write, no Perspective/canonical graph write, no
  work item, no provider/retrieval/source fetch, no external handoff, no
  durable persistence, and no schema/migration/dependency. Browser-backed
  validation uses the best available method and may record the local `/tmp`
  transaction-plan report if present.
- Manual note first product-write design review:
  `lib/research-candidate-review/manual-note-product-write-design-review.ts`,
  `fixtures/research-candidate-review.manual-note-product-write-design-review.sample.v0.1.json`,
  `npm run smoke:research-candidate-product-write-design-review-v0-1`,
  and `npm run design:research-candidate-product-write-design-review-v0-1`
  add a product-write design review artifact, static repo inventory, candidate
  product write target groups, smallest safe future write prototype proposal,
  and `/tmp design review report runner`. This adds no new route, no UI
  behavior change, no normal product write, no actual promotion, no
  proof/evidence write, no Perspective/canonical graph write, no work item, no
  provider/retrieval/source fetch, no external handoff, no durable persistence,
  and no schema/migration/dependency. Browser-backed validation uses the best
  available method and may record the local `/tmp` design-review report if
  present.
- Manual note temp DB single-claim write prototype design:
  `lib/research-candidate-review/manual-note-temp-db-single-claim-prototype-design.ts`,
  `fixtures/research-candidate-review.manual-note-temp-db-single-claim-prototype-design.sample.v0.1.json`,
  `npm run smoke:research-candidate-temp-db-single-claim-prototype-design-v0-1`,
  and `npm run design:research-candidate-temp-db-single-claim-prototype-design-v0-1`
  add a temp DB single-claim prototype design artifact that selects the first
  claim operation from the disabled transaction plan, defines structured temp
  schema design objects, idempotency/rollback/audit/source-authority gates, a
  future temp DB execution harness spec, and a `/tmp design report runner`.
  This adds no temp DB execution yet, no DB file creation, no SQL execution, no
  executable SQL strings, no new route, no UI behavior change, no normal
  product write, no actual promotion, no proof/evidence write, no
  Perspective/canonical graph write, no work item, no provider/retrieval/source
  fetch, no external handoff, no durable persistence, and no
  schema/migration/dependency. Browser-backed validation uses the best
  available method and may record the local `/tmp` single-claim prototype
  design report if present.
- Manual note temp DB single-claim write prototype harness:
  `lib/research-candidate-review/manual-note-temp-db-single-claim-write-prototype-harness.ts`,
  `fixtures/research-candidate-review.manual-note-temp-db-single-claim-write-prototype-harness.sample.v0.1.json`,
  `npm run smoke:research-candidate-temp-db-single-claim-write-prototype-v0-1`,
  and `npm run harness:research-candidate-temp-db-single-claim-write-prototype-v0-1`
  add a fixture-backed temp DB harness that creates one `/tmp` DB file,
  creates temp-only schema objects, inserts exactly one temp claim, exactly one
  temp idempotency, exactly one temp rollback, and exactly one temp review audit
  record, then verifies row counts and no product IDs. This uses temp-only SQL
  under `/tmp/augnes-single-claim-write-prototype-v0-1` and still adds no
  product DB write, no actual promotion, no proof/evidence write, no
  Perspective/canonical graph write, no work item, no provider/retrieval/source
  fetch, no external handoff, and no repo schema/migration/dependency.
  Browser-backed validation uses the best available method and may record the
  local `/tmp` harness report if present.
- Manual note temp DB single-claim write prototype result review:
  `lib/research-candidate-review/manual-note-temp-db-single-claim-result-review.ts`,
  `fixtures/research-candidate-review.manual-note-temp-db-single-claim-result-review.sample.v0.1.json`,
  `npm run smoke:research-candidate-temp-db-single-claim-result-review-v0-1`,
  and `npm run review:research-candidate-temp-db-single-claim-result-review-v0-1`
  add a fixture-backed and `/tmp` report-backed result review artifact that
  reviews the committed harness fixture and the local `/tmp` harness report
  when present. It does not open DB, does not execute SQL, and verifies
  row-count evidence, path containment, product DB boundary, product ID
  absence, raw note absence, and remaining product-write blockers. This adds no
  product DB write, no actual promotion, no proof/evidence write, no
  Perspective/canonical graph write, no work item, no provider/retrieval/source
  fetch, no external handoff, and no repo schema/migration/dependency.
  Browser-backed validation uses the best available method and may record the
  local `/tmp` result-review report if present.
- Manual note temp DB single-claim result contract tests:
  `lib/research-candidate-review/manual-note-temp-db-single-claim-result-contract-tests.ts`,
  `fixtures/research-candidate-review.manual-note-temp-db-single-claim-result-contract-test-cases.v0.1.json`,
  `npm run smoke:research-candidate-temp-db-single-claim-result-contract-tests-v0-1`,
  and `npm run contracts:research-candidate-temp-db-single-claim-result-contract-tests-v0-1`
  add fixture-only result contract tests for the temp DB single-claim result
  review. The suite covers a positive needs_attention baseline, an optional
  live all-pass report case, and a negative mutation matrix for row counts,
  path containment, product IDs, raw note evidence, product DB boundary,
  browser external/forbidden requests, and review status semantics. The
  `/tmp` contract-test report runner does not open DB, does not execute SQL,
  and adds no product DB write, no actual promotion, no proof/evidence write,
  no Perspective/canonical graph write, no work item, no provider/retrieval/source
  fetch, no external handoff, and no repo schema/migration/dependency.
  Browser-backed validation uses the best available method and may record the
  local `/tmp` result contract-test report if present.
- Manual note single-claim product write gate design:
  `lib/research-candidate-review/manual-note-single-claim-product-write-gate-design.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-product-write-gate-design.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-product-write-gate-design-v0-1`,
  and `npm run design:research-candidate-single-claim-product-write-gate-design-v0-1`
  add a design-only gate artifact that consumes temp DB result contract
  evidence, defines product-write authority gates, and keeps product authority
  gates intentionally block product write. It recommends the next
  single-claim temp-to-product bridge design only when temp evidence gates
  pass or warn and the product boundary is preserved. The runner does not open
  DB, does not execute SQL, and adds no product DB write, no actual promotion,
  no proof/evidence write, no Perspective/canonical graph write, no work item,
  no provider/retrieval/source fetch, no external handoff, and no repo
  schema/migration/dependency. Browser-backed validation uses the best
  available method and may record the local `/tmp` gate-design report if
  present.
- Manual note single-claim temp-to-product bridge design:
  `lib/research-candidate-review/manual-note-single-claim-temp-to-product-bridge-design.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-bridge-design.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-temp-to-product-bridge-design-v0-1`,
  and `npm run design:research-candidate-single-claim-temp-to-product-bridge-design-v0-1`
  add a design-only bridge artifact that maps the existing temp DB
  single-claim evidence chain into a future product claim draft, idempotency
  mapping, rollback mapping, audit mapping, and operator decision placeholder.
  It remains blocked at `ready_for_disabled_bridge_skeleton` and recommends
  `single_claim_temp_to_product_disabled_bridge_skeleton` as the next slice,
  not product write. The runner does not open DB, does not execute SQL, and
  adds no product DB write, no product ID allocation, no proof/evidence write,
  no Perspective/canonical graph write, no work item, no provider/retrieval/source
  fetch, no external handoff, no route, no UI write action, no enabled adapter,
  and no repo schema/migration/dependency. Browser-backed validation uses the
  best available method and may record the local `/tmp` bridge-design report
  if present.
- Manual note single-claim temp-to-product disabled bridge skeleton:
  `lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-skeleton.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1`,
  and `npm run design:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-v0-1`
  add a disabled bridge skeleton only. It consumes the existing single-claim
  temp-to-product bridge design artifact and advances to
  `ready_for_disabled_bridge_skeleton_contract_tests` only when that upstream
  bridge design recommends `ready_for_disabled_bridge_skeleton`; blocked or
  missing upstream bridge readiness reports blocked and does not advance. The
  next recommended slice is
  `single_claim_temp_to_product_disabled_bridge_skeleton_contract_tests`, not
  product write. The runner does not implement product write, does not enable
  an adapter, does not open DB, does not execute SQL, and adds no product DB
  write, no product ID allocation, no proof/evidence write, no
  Perspective/canonical graph write, no work item, no provider/retrieval/source
  fetch, no external handoff, no route, no UI write action, and no repo
  schema/migration/dependency. Browser-backed validation uses the best
  available method and may record the local `/tmp` disabled bridge skeleton
  report if present.
- Manual note single-claim temp-to-product disabled bridge skeleton contract tests:
  `lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-test-cases.v0.1.json`,
  `fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1`,
  and `npm run contracts:research-candidate-single-claim-temp-to-product-disabled-bridge-skeleton-contract-tests-v0-1`
  add a deterministic fixture-only contract-test suite for the disabled bridge
  skeleton. This is a contract-test suite for the disabled bridge skeleton; it
  does not implement product write, does not enable an adapter, does not
  allocate product IDs, does not open DB, and does not execute SQL. It adds no
  route or UI write action and adds no schema/migration/dependency. Product
  write remains blocked. The report status is
  `disabled_bridge_skeleton_contract_tests_passed`, the recommendation status
  is `ready_for_disabled_bridge_dry_run_transaction_plan`, and the next
  recommended slice is
  `single_claim_temp_to_product_disabled_bridge_dry_run_transaction_plan`, not
  product write. The runner writes only `/tmp` report artifacts and keeps no
  product DB write, no product ID allocation, no proof/evidence write, no
  Perspective/canonical graph write, no work item, no provider/retrieval/source
  fetch, no external handoff, no browser persistence, and no local runtime
  requirement.
- Manual note single-claim temp-to-product disabled bridge dry-run transaction plan:
  `lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1`,
  and `npm run plan:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-plan-v0-1`
  add a deterministic disabled dry-run transaction plan only. It consumes the
  disabled bridge skeleton contract-test report, disabled bridge skeleton,
  temp-to-product bridge design, and product write gate design fixtures or
  passing `/tmp` reports; failed optional reports block and do not fall back to
  committed fixtures. This slice does not implement product write, does not
  execute a transaction, does not enable an adapter, does not allocate product
  IDs, does not open DB, and does not execute SQL. It adds no route, no UI
  write action, and no schema/migration/dependency. Product write remains
  blocked. The plan status is `disabled_dry_run_transaction_plan_only`, the
  recommendation status is `ready_for_disabled_dry_run_transaction_harness`,
  and the next recommended slice is
  `single_claim_temp_to_product_disabled_bridge_dry_run_transaction_harness`,
  not product write. The runner writes only `/tmp` report artifacts and keeps
  no product DB write, no product ID allocation, no proof/evidence write, no
  Perspective/canonical graph write, no work item, no provider/retrieval/source
  fetch, no external handoff, no browser persistence, and no local runtime
  requirement.
- Manual note single-claim temp-to-product disabled bridge dry-run transaction harness:
  `lib/research-candidate-review/manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1`,
  and `npm run harness:research-candidate-single-claim-temp-to-product-disabled-bridge-dry-run-transaction-harness-v0-1`
  add a deterministic disabled dry-run transaction harness only. It consumes
  the disabled dry-run transaction plan, disabled bridge skeleton contract-test
  report, disabled bridge skeleton, temp-to-product bridge design, and product
  write gate design fixtures or passing `/tmp` reports; failed optional
  reports block and do not fall back to committed fixtures. This slice does
  not implement product write, does not execute a DB transaction, does not
  enable an adapter, does not allocate product IDs, does not open DB, and does
  not execute SQL. It adds no route, no UI write action, and no
  schema/migration/dependency. Product write remains blocked. The harness
  status is `disabled_dry_run_transaction_harness_only`, the recommendation
  status is `ready_for_product_write_authority_contract_bundle`, and the next
  recommended slice is `single_claim_product_write_authority_contract_bundle`,
  not product write implementation. The runner writes only `/tmp` report
  artifacts and keeps no product DB write, no product ID allocation, no
  proof/evidence write, no Perspective/canonical graph write, no work item, no
  provider/OpenAI call, no retrieval/RAG/source fetch, no external handoff, no
  browser persistence, no transaction execution, and no local runtime
  requirement.
- Manual note single-claim product write authority contract bundle:
  `lib/research-candidate-review/manual-note-single-claim-product-write-authority-contract-bundle.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-product-write-authority-contract-bundle.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1`,
  and `npm run authority:research-candidate-single-claim-product-write-authority-contract-bundle-v0-1`
  add a deterministic product-write authority contract bundle only. It consumes
  the disabled dry-run transaction harness, disabled dry-run transaction plan,
  disabled bridge skeleton contract-test report, disabled bridge skeleton,
  temp-to-product bridge design, and product write gate design fixtures or
  passing `/tmp` reports; failed optional reports block and do not fall back to
  committed fixtures. This product-write authority contract bundle only
  defines required authority contracts but does not satisfy or grant them. It
  does not implement product write, does not execute a DB transaction, does not
  enable an adapter, does not allocate product IDs, does not open DB, and does
  not execute SQL. It adds no route, no UI write action, and no
  schema/migration/dependency. Product write remains blocked. The bundle status
  is `product_write_authority_contracts_defined_only`, the recommendation
  status is `ready_for_single_claim_product_write_disabled_adapter_skeleton`,
  and the next recommended slice is
  `single_claim_product_write_disabled_adapter_skeleton`, not product write
  implementation. The runner writes only `/tmp` report artifacts and keeps no
  product DB write, no product ID allocation, no proof/evidence write, no
  Perspective/canonical graph write, no work item, no provider/OpenAI call, no
  retrieval/RAG/source fetch, no external handoff, no browser persistence, no
  transaction execution, and no local runtime requirement.
- Manual note single-claim product write disabled adapter skeleton:
  `lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-skeleton.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-skeleton.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1`,
  and `npm run adapter:research-candidate-single-claim-product-write-disabled-adapter-skeleton-v0-1`
  add a deterministic disabled product-write adapter skeleton only. It consumes
  the product-write authority contract bundle and upstream lane summaries from
  fixtures or passing `/tmp` reports; failed optional reports block and do not
  fall back to committed fixtures. This disabled product-write adapter skeleton
  only normalizes a local input preview, defines a disabled output contract,
  returns a rejected disabled invocation result, and previews a future command
  that is not executable. It does not implement product write, does not enable
  an adapter, does not invoke an adapter, does not execute a DB transaction,
  does not allocate product IDs, does not open DB, and does not execute SQL. It
  adds no route, no UI write action, and no schema/migration/dependency. Product
  write remains blocked. The disabled adapter skeleton status is
  `product_write_disabled_adapter_skeleton_only`, the recommendation status is
  `ready_for_single_claim_product_write_disabled_adapter_contract_tests`, and
  the next recommended slice is
  `single_claim_product_write_disabled_adapter_contract_tests`, not product
  write implementation. The runner writes only `/tmp` report artifacts and keeps
  no product DB write, no product ID allocation, no proof/evidence write, no
  Perspective/canonical graph write, no work item, no provider/OpenAI call, no
  retrieval/RAG/source fetch, no external handoff, no browser persistence, no
  transaction execution, no adapter invocation, no enabled adapter transition,
  and no local runtime requirement.
- Manual note single-claim product write disabled adapter contract tests:
  `lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-contract-tests.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-contract-test-cases.v0.1.json`,
  `fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-contract-tests.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1`,
  and
  `npm run contracts:research-candidate-single-claim-product-write-disabled-adapter-contract-tests-v0-1`
  add a deterministic fixture-only contract-test suite for the disabled
  product-write adapter skeleton. The suite verifies the helper, runner,
  committed fixture, optional upstream report handling, source evidence
  contamination handling, disabled adapter boundary, no-product-write boundary,
  and static repo boundary. It does not implement product write, does not enable
  or invoke an adapter, does not execute a DB transaction, does not allocate
  product IDs, does not open DB, and does not execute SQL. It adds no route, no
  UI write action, and no schema/migration/dependency. Product write remains
  blocked. The contract suite status is
  `product_write_disabled_adapter_contract_tests_passed`, the recommendation
  status is
  `ready_for_single_claim_product_write_disabled_adapter_dry_run_invocation_harness`,
  and the next recommended slice is
  `single_claim_product_write_disabled_adapter_dry_run_invocation_harness`, not
  product write implementation.
- Manual note single-claim product write disabled adapter dry-run invocation
  harness:
  `lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-dry-run-invocation-harness.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-dry-run-invocation-harness.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1`,
  and
  `npm run harness:research-candidate-single-claim-product-write-disabled-adapter-dry-run-invocation-harness-v0-1`
  add a deterministic, fixture-only, pure in-memory disabled-adapter dry-run
  invocation harness. The helper normalizes an invocation-shaped input, applies
  disabled adapter refusal rules, returns a rejected/no-op result, records trace
  rows and mutation probes, and proves no product write occurred. It does not
  implement product write, does not enable an adapter, does not invoke a runtime
  adapter, does not execute a DB transaction, does not allocate product IDs,
  does not open DB, and does not execute SQL. It adds no route, no UI action,
  and no schema/migration/dependency. Product write remains blocked. The harness
  status is
  `product_write_disabled_adapter_dry_run_invocation_harness_only`, the
  recommendation status is
  `ready_for_single_claim_product_write_disabled_adapter_noop_invocation_report`,
  and the next recommended slice is
  `single_claim_product_write_disabled_adapter_noop_invocation_report`, not
  product write implementation.
- Manual note single-claim product write disabled adapter no-op invocation
  report:
  `lib/research-candidate-review/manual-note-single-claim-product-write-disabled-adapter-noop-invocation-report.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-product-write-disabled-adapter-noop-invocation-report.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1`,
  and
  `npm run report:research-candidate-single-claim-product-write-disabled-adapter-noop-invocation-report-v0-1`
  add a deterministic report-only artifact over the disabled adapter dry-run
  invocation harness. It reports the pure in-memory rejected/no-op invocation
  from the disabled harness, captures operator review and no-write closeout
  evidence, and previews the next preflight command envelope without making it
  executable or durable. It does not implement product write, does not enable
  an adapter, does not invoke a runtime adapter, does not execute a DB
  transaction, does not allocate product IDs, does not open DB, and does not
  execute SQL. It adds no route, no UI action, and no
  schema/migration/dependency. Product write remains blocked. The no-op report
  status is
  `product_write_disabled_adapter_noop_invocation_report_only`, the
  recommendation status is
  `ready_for_single_claim_product_write_preflight_command_envelope`, and the
  next recommended slice is
  `single_claim_product_write_preflight_command_envelope`, not product write
  implementation.
- Manual note single-claim product write preflight command envelope:
  `lib/research-candidate-review/manual-note-single-claim-product-write-preflight-command-envelope.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-command-envelope.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-product-write-preflight-command-envelope-v0-1`,
  and
  `npm run envelope:research-candidate-single-claim-product-write-preflight-command-envelope-v0-1`
  add a deterministic product write preflight command envelope only. The
  envelope consumes the disabled adapter no-op invocation report and builds a
  non-persisted, non-executing command shape with product claim draft,
  idempotency, rollback, audit, and observability previews. It does not
  implement product write, does not persist a command envelope, does not enable
  an adapter, does not allocate product IDs, does not open DB, does not execute
  SQL, and does not execute a DB transaction. It adds no route, no UI action,
  and no schema/migration/dependency. Product write remains blocked. The
  preflight command envelope status is
  `product_write_preflight_command_envelope_only`, the recommendation status
  is
  `ready_for_single_claim_product_write_preflight_command_envelope_contract_tests`,
  and the next recommended slice is
  `single_claim_product_write_preflight_command_envelope_contract_tests`, not
  product write implementation. After this envelope and its contract tests, the
  broader roadmap should return to PerspectiveGeometryDigest and Agent
  Perspective Substrate work before any durable Perspective promotion or
  product write implementation.
- Manual note single-claim product write preflight command envelope contract
  tests:
  `lib/research-candidate-review/manual-note-single-claim-product-write-preflight-command-envelope-contract-tests.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-command-envelope-contract-test-cases.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1`,
  and
  `npm run contracts:research-candidate-single-claim-product-write-preflight-command-envelope-contract-tests-v0-1`
  add deterministic fixture-only contract-test coverage for the #684 preflight
  command envelope. The suite validates the helper, runner, committed fixture,
  optional upstream report traceability handling, no-write boundary, no-ID
  boundary, static boundary, and next-slice discipline. It does not implement
  product write, does not persist a command envelope, does not allocate product
  IDs, does not open DB, does not execute SQL, does not execute a transaction,
  does not enable an adapter, and adds no route, UI action,
  schema/migration, or dependency. Product write remains blocked. The contract
  suite status is
  `product_write_preflight_command_envelope_contract_tests_passed`, the
  recommendation status is `ready_for_product_write_preflight_stopline`, and
  the next recommended slice is
  `single_claim_product_write_preflight_stopline`, not product write
  implementation. After the stopline, return to PerspectiveGeometryDigest and
  Agent Perspective Substrate work before any durable Perspective promotion or
  product write implementation.
- Manual note single-claim product write preflight stopline:
  `lib/research-candidate-review/manual-note-single-claim-product-write-preflight-stopline.ts`,
  `fixtures/research-candidate-review.manual-note-single-claim-product-write-preflight-stopline.sample.v0.1.json`,
  `npm run smoke:research-candidate-single-claim-product-write-preflight-stopline-v0-1`,
  and
  `npm run stopline:research-candidate-single-claim-product-write-preflight-stopline-v0-1`
  add a deterministic stopline artifact for the #684/#685 preflight command
  envelope chain. The stopline parks the product-write preparation lane,
  preserves the evidence trail, and does not implement product write, persist a
  command envelope, allocate product IDs, open DB, execute SQL, execute a
  transaction, enable an adapter, add route/UI behavior, add
  schema/migration/dependency, or add provider/retrieval/external/browser
  behavior. Product write remains blocked. The stopline status is
  `product_write_preflight_stopline_reached`, the recommendation status is
  `ready_for_perspective_geometry_digest`, the next recommended slice is
  PerspectiveGeometryDigest Builder v0.1
  (`perspective_geometry_digest_builder_v0_1`), and the secondary next
  recommended slice is
  `agent_perspective_substrate_docs_type_fixture_v0_1`. Any future product
  write implementation requires explicit reentry conditions and operator
  decision after PerspectiveGeometryDigest, Agent Perspective Substrate
  boundary work, and durable promotion review.
- Manual note preview draft gate explanations lane:
  the promotion readiness preflight gate results now include structured
  operator-facing explanation metadata for every lifecycle, storage, authority,
  parser warning, source reference, claim/evidence, tension/gap, follow-up work,
  label, activity, and canonical link guard gate. Gate explanations are operator guidance only.
  They show why a block/warn/pass signal matters,
  current signal text, suggested safe actions, related preview UI surfaces,
  related evidence fields, whether the issue can be handled in the current
  preview lane, and resolution boundary flags. No explanation here grants promotion authority.
  Suggested actions use existing preview-only surfaces or
  require a separate future lane, and they do not write proof/evidence, update
  Perspective, create work items, fetch sources, run retrieval/RAG, call
  providers/OpenAI, execute Codex, send handoffs, store raw note text, use
  browser persistence, mutate schema, or repair DB rows.
- `npm run smoke:research-candidate-preview-draft-gate-explanations-v0-1`:
  `scripts/smoke-research-candidate-preview-draft-gate-explanations-v0-1.mjs`
  checks the gate explanation type/shape, every gate explanation case, route
  response wiring, helper purity, UI explanation panel/copy, forbidden action
  button absence, CSS, docs/index pointers, package script, and no provider/
  retrieval/proof/evidence/work/Codex/browser-persistence/schema mutation
  patterns.
- Manual note preview draft readiness copy packet lane:
  `lib/research-candidate-review/manual-note-preview-draft-readiness-copy-packet.ts`
  builds a deterministic local clipboard packet for an opened stored manual
  note preview draft with a loaded promotion readiness preflight. The
  Readiness copy packet supports a human-readable Markdown packet and a stable
  pretty JSON packet containing the draft metadata, readiness status/score,
  blockers, warnings, next review steps, source/candidate/lifecycle summaries,
  gate results, gate explanations, runtime boundary, no-side-effects metadata,
  authority metadata, and copy packet boundary. It is local clipboard only:
  `local_clipboard_only true`, `external_handoff_sent false`, and
  `raw_manual_note_text_included false`. It does not send, share, email,
  submit, create handoffs, execute Codex, write proof/evidence, create work
  items, promote Perspective, mutate canonical graph state, call providers,
  run retrieval/RAG, fetch sources, use browser persistence, store raw note
  text, change schema, or grant promotion authority.
- `npm run smoke:research-candidate-preview-draft-readiness-copy-packet-v0-1`:
  `scripts/smoke-research-candidate-preview-draft-readiness-copy-packet-v0-1.mjs`
  checks the copy packet builder, packet kind/version, packet content,
  copy-packet boundary flags, builder purity, local clipboard UI, manual
  fallback copy, preserved preflight/gate explanation/startup/manual note
  flows, no browser persistence, package/index pointers, and forbidden
  provider/retrieval/proof/evidence/work/Codex/share/schema mutation patterns.
- Manual note preview draft readiness copy packet staleness lane:
  `lib/research-candidate-review/manual-note-preview-draft-readiness-copy-packet.ts`
  now adds a deterministic `packet_fingerprint` using
  `fnv1a32_canonical_json_v0_1`, a `packet_input_summary`, and read-only
  freshness metadata for the local readiness copy packet. The fingerprint
  excludes `generated_at`/`packet_generated_at` so a copied packet does not
  become stale solely because a timestamp changed. The Cockpit/Perspective
  Readiness copy packet panel shows Current packet fingerprint, Last copied
  packet fingerprint, Packet freshness status, and the four readout states:
  No packet copied yet, Current, Stale, and Unavailable. The boundary remains
  local and preview-only: `packet_fingerprint_is_security_authority false`,
  `packet_fingerprint_persisted false`, no packet history persistence, no
  browser persistence, no external handoff sending, no proof/evidence write,
  no Perspective promotion, no work item creation, no provider/retrieval/source
  fetching, no schema change, and no raw manual note text.
- `npm run smoke:research-candidate-preview-draft-readiness-copy-packet-staleness-v0-1`:
  `scripts/smoke-research-candidate-preview-draft-readiness-copy-packet-staleness-v0-1.mjs`
  checks the packet fingerprint contract, deterministic local hash helper,
  generated_at exclusion, packet_input_summary fields, boundary flags, builder
  purity, UI freshness states, in-memory last-copied state, preserved copy
  packet/preflight/gate/startup/manual flows, docs/package pointers, and no
  browser persistence or forbidden action buttons.
- Manual note preview draft readiness packet review workspace lane:
  `lib/research-candidate-review/manual-note-preview-draft-readiness-copy-packet.ts`
  now includes a pure readiness packet review workspace helper that derives
  local read-only preview text from the current packet without fetching,
  persisting, or changing the full copy packet. The Cockpit/Perspective
  Readiness copy packet panel includes Packet review workspace controls for
  Markdown / JSON format, Summary / Full detail, All / Block / Warning / Pass
  gate filtering, section visibility, visible section/gate counts, and
  preview character count. Review controls are local UI state only, and
  filtering review preview does not change the full packet, and no packet is stored, sent, shared, or persisted. The lane adds no download/file export, browser
  persistence, packet history persistence, proof/evidence write, Perspective
  promotion, work item creation, provider/retrieval/source fetching, Codex
  execution, external handoff, schema change, or raw manual note text storage.
- `npm run smoke:research-candidate-preview-draft-readiness-packet-review-workspace-v0-1`:
  `scripts/smoke-research-candidate-preview-draft-readiness-packet-review-workspace-v0-1.mjs`
  checks the review preview helper, Packet review workspace UI, Markdown/JSON
  controls, Summary/Full controls, All/Block/Warning/Pass filter controls,
  section visibility controls, visible section/gate counts, preview character
  count, read-only preview area, local-only boundary copy, preserved copy/
  freshness/preflight/gate/startup flows, docs/package pointers, no browser
  persistence, no download/file export, and no forbidden action buttons.
- Manual note preview draft local packet review checklist and extraction lane:
  `components/research-candidate-readiness-copy-packet-panel.tsx`,
  `components/research-candidate-readiness-packet-review-workspace.tsx`,
  `components/research-candidate-promotion-readiness-gate-explanations.tsx`,
  and `components/research-candidate-local-packet-review-checklist.tsx`
  now hold the readiness copy packet, packet review workspace, gate
  explanations, and Local packet review checklist UI that previously bloated
  `components/research-candidate-manual-note-preview-panel.tsx`. Checklist state is local to this screen only. Checklist completion is not approval or promotion authority. Checklist notes are not stored, sent, shared, or persisted. The checklist tracks source refs, parser warnings, block/warning
  gates, gate explanations, packet freshness, full packet/manual fallback
  review, raw note absence, boundary/no-side-effect metadata, and whether a
  separate future lane may be needed. It exposes local-only `checklist_status`,
  checked/total counts, packet fingerprint context, local notes character
  count, stale-for-current-packet copy, and a Reset local checklist action. The
  lane adds no schema change, DB write, browser persistence, packet/checklist
  history, proof/evidence write, Perspective promotion, work item creation,
  provider/retrieval/source fetching, Codex execution, external handoff,
  download/file export, or raw manual note persistence.
- `npm run smoke:research-candidate-preview-draft-local-checklist-and-extract-v0-1`:
  `scripts/smoke-research-candidate-preview-draft-local-checklist-and-extract-v0-1.mjs`
  checks the extracted readiness components, manual panel render/import wiring,
  absence of inline readiness component definitions in the manual panel, Local
  packet review checklist title/items/notes/status/counts/reset copy, local-only
  boundary copy, preserved copy/freshness/review workspace/gate/preflight/
  startup flows, CSS, docs/package pointers, no DB/store/server route imports in
  extracted UI components, no browser persistence, no download/file export, and
  forbidden action button absence.
- Manual note preview draft UI extraction:
  `components/research-candidate-preview-draft-list-panel.tsx`,
  `components/research-candidate-preview-draft-card.tsx`,
  `components/research-candidate-preview-draft-label-controls.tsx`,
  `components/research-candidate-preview-draft-activity-readout.tsx`, and
  `components/research-candidate-preview-draft-metadata-readout.tsx` now hold
  the Recent runtime preview drafts list, draft cards, label edit controls,
  preview-draft activity readout, and runtime/stored metadata readouts while the
  manual note panel keeps parser/runtime/list/open/label/activity orchestration.
- `npm run smoke:research-candidate-manual-note-draft-ui-extract-v0-1`:
  `scripts/smoke-research-candidate-manual-note-draft-ui-extract-v0-1.mjs`
  checks extracted draft-list/card/label/activity/metadata components, manual
  panel render/import wiring, absence of inline extracted definitions, preserved
  startup/preflight/gate/copy/review/checklist UI, docs/package pointers, no
  browser persistence, no storage/schema/seed behavior, and forbidden action
  button absence.
- Manual note candidate-family display extraction:
  `components/research-candidate-manual-note-format-hint.tsx`,
  `components/research-candidate-manual-note-result-summary.tsx`,
  `components/research-candidate-manual-note-warning-display.tsx`,
  `components/research-candidate-manual-note-source-reference-list.tsx`,
  `components/research-candidate-manual-note-candidate-family-lists.tsx`, and
  `components/research-candidate-manual-note-authority-flags.tsx` now hold the
  format hint, parse/session summaries, parser warning displays, source refs,
  candidate-family lists, and authority flag grids while the manual note panel
  keeps active-result selection and runtime orchestration.
- `npm run smoke:research-candidate-manual-note-candidate-display-extract-v0-1`:
  `scripts/smoke-research-candidate-manual-note-candidate-display-extract-v0-1.mjs`
  checks extracted candidate display components, manual panel import/render
  wiring, absence of inline candidate display definitions, preserved draft/
  readiness/copy/checklist UI, docs/package pointers, no browser persistence,
  no storage/schema/seed behavior, and forbidden action button absence.
- Manual note promotion readiness preflight readout extraction:
  `components/research-candidate-promotion-readiness-preflight-readout.tsx`
  now holds the read-only preflight display, readiness status/score/lifecycle
  summary, blocker/warning/next-step rendering, gate grouping, gate explanation
  hook, readiness copy packet hook, and runtime boundary/no-side-effect display
  while the manual note panel keeps route/state orchestration.
- `npm run smoke:research-candidate-promotion-readiness-readout-extract-v0-1`:
  `scripts/smoke-research-candidate-promotion-readiness-readout-extract-v0-1.mjs`
  checks the extracted preflight readout component, manual panel render/import
  wiring, absence of inline preflight definitions, preserved candidate/list/
  readiness/copy/checklist UI, docs/package pointers, no browser persistence,
  no storage/schema/seed behavior, and forbidden action button absence.
- Manual note runtime route orchestration hook extraction:
  `components/use-research-candidate-manual-note-preview-runtime.ts` now owns
  same-origin manual note preview draft create/list/open/label/activity/discard
  and promotion-readiness preflight route state/actions while
  `components/research-candidate-manual-note-preview-panel.tsx` keeps local
  parser/input state, active preview display selection, and authority boundary
  placement.
- `npm run smoke:research-candidate-manual-note-runtime-hook-extract-v0-1`:
  `scripts/smoke-research-candidate-manual-note-runtime-hook-extract-v0-1.mjs`
  checks the parent-local runtime hook export, manual panel hook wiring, local
  parser ownership, absence of inline bulk route handlers in the panel,
  same-origin route constants/builders in the hook, preserved extracted UI
  surfaces, docs/package pointers, no browser persistence, no DB/server/provider
  imports, no schema/seed behavior, and no new reducer/state-machine lane.
- Manual note runtime hook stale-state transition smoke:
  `scripts/smoke-research-candidate-manual-note-runtime-hook-transitions-v0-1.mjs`
  checks the extracted runtime hook's stale-state clearing contracts around
  local parse/reset, runtime create, stored draft open, label save/clear,
  activity/preflight refresh, discard, draft list refresh, grouped hook return
  state/actions, docs/package pointers, and no browser persistence,
  DB/server/provider/retrieval/proof/evidence/work/Perspective imports,
  schema/seed behavior, external URLs, or new reducer/state-machine lane.
- `npm run smoke:research-candidate-manual-note-runtime-hook-transitions-v0-1`:
  runs the focused stale-state transition guard for
  `components/use-research-candidate-manual-note-preview-runtime.ts`.
- `npm run browser:research-candidate-manual-note-lane-v0-1`:
  `scripts/browser-validate-research-candidate-manual-note-lane-v0-1.mjs`
  starts a temp-DB local app with the provider API key env unset and writes
  `/tmp/augnes-manual-note-lane-validation-v0-1/report.json`,
  `desktop.png`, and `mobile-390.png`. It is a reusable validation/reporting
  artifact for the manual-note preview lane only: browser-observed
  network/console/pageerror observation, local-parse/runtime-route assertions,
  two-draft transition checks, storage-boundary inspection, and 390px overflow
  checks. The temp DB may be initialized only by existing app runtime schema
  bootstrap. It adds no CI authority, product approval, promotion authority,
  proof/evidence write, Perspective/canonical graph write,
  provider/retrieval/source fetch, repo schema or migration code change,
  migration script invocation, packet history persistence, checklist
  persistence, browser persistence, or external handoff sending.
- Candidate Constellation Overlay preview:
  `types/research-candidate-constellation-overlay.ts`,
  `lib/research-candidate-review/constellation-overlay.ts`,
  `fixtures/research-candidate-review.constellation-overlay.sample.v0.1.json`,
  `fixtures/research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json`,
  `components/research-candidate-constellation-overlay-preview.tsx`, and
  `components/augnes-cockpit.tsx` define and render read-only candidate nodes
  and typed edges for the original Research Candidate Review fixture and the
  manual parser output fixture, with no graph DB, no layout algorithm, no embeddings, no runtime/API/DB/provider/retrieval/promotion behavior, no
  proof/evidence write, and no work item creation.
- `npm run smoke:research-candidate-review-constellation-overlay-v0-1`:
  overlay type contract, deterministic builder output, fixture integrity,
  Cockpit read-only wiring, docs/index pointers, and non-authority boundaries를
  정적으로 확인한다.
- PerspectiveGeometryDigest Builder v0.1:
  `types/perspective-geometry-digest.ts`,
  `lib/research-candidate-review/perspective-geometry-digest.ts`,
  `fixtures/research-candidate-review.perspective-geometry-digest.sample.v0.1.json`,
  `fixtures/research-candidate-review.perspective-geometry-digest.manual-parser.sample.v0.1.json`,
  and
  `npm run smoke:research-candidate-review-perspective-geometry-digest-v0-1`
  add a deterministic read-only digest builder for the original Candidate
  Constellation Overlay fixture
  (`fixtures/research-candidate-review.constellation-overlay.sample.v0.1.json`)
  and the manual parser overlay fixture
  (`fixtures/research-candidate-review.manual-note-constellation-overlay.sample.v0.1.json`).
  The digest groups candidate families, bridge nodes, unresolved tensions,
  source coverage gaps, and advisory retrieval expansion hints without treating
  layout coordinates as truth. It is advisory-only: no source of truth, no
  proof/evidence write, no durable Perspective state, no work item creation,
  no provider/OpenAI call, no source fetch, no retrieval or indexing execution,
  no route/UI behavior, no DB/SQL/transaction behavior, and no
  product write. Product-write remains parked by the #686 stopline. The next
  recommended slice is `agent_perspective_substrate_docs_type_fixture_v0_1`.
- Agent Perspective Substrate v0.1:
  `docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md`,
  `types/agent-perspective-substrate.ts`,
  `fixtures/agent-perspective-substrate.sample.v0.1.json`, and
  `npm run smoke:agent-perspective-substrate-v0-1` define the M10
  docs/type/fixture/smoke substrate slice. It is an AI-native folded advisory
  layer that consumes #687 PerspectiveGeometryDigest only as advisory input,
  along with Research Candidate Review, Candidate Constellation Overlay, AI
  Context Packet, and Formation Receipt fixture references. It is advisory-only,
  non-SSOT, non-authoritative, and not source of truth, proof/evidence,
  durable Perspective state, execution authority, agent routing, or
  product-write authority. Surfaced warnings, suggestions, blockers, and
  handoff improvements require `source_refs` or an explicit source coverage
  boundary note, `why_now`, epistemic/review status, and
  `authority_boundary_notes`. This slice adds no runtime route/UI behavior, no
  DB/SQL/transaction behavior, no provider/OpenAI call, no source fetch, no
  retrieval execution or indexing implementation,
  no proof/evidence/work/Perspective durable write, no agent execution/routing,
  no MCP/App tool widening, and no product write. Product-write remains parked
  by #686. The next recommended slice is
  `agent_perspective_substrate_preview_builder_v0_1`.
- Agent Perspective Substrate Preview Builder v0.1:
  `types/agent-perspective-substrate-preview.ts`,
  `lib/research-candidate-review/agent-perspective-substrate-preview.ts`,
  `fixtures/agent-perspective-substrate-preview.sample.v0.1.json`, and
  `scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs`
  (`npm run smoke:agent-perspective-substrate-preview-builder-v0-1`) define the
  M11 folded-by-default advisory audit preview. The builder consumes the #688
  Agent Perspective Substrate fixture as advisory input and produces folded
  sections, surfacing cards, rule groups, source coverage preview,
  diagnostics, and an advisory-only authority boundary. Every surfacing card
  preserves `source_refs` or an explicit source coverage boundary note,
  `epistemic_status`, `review_status`, `why_now`, and
  `authority_boundary_notes`. This slice adds no runtime route/UI yet, no
  API route, no UI/component change, no DB/SQL/transaction behavior, no
  provider/OpenAI call, no source fetch, no retrieval execution or indexing
  implementation, no proof/evidence/work/Perspective durable write, no agent
  execution/routing, no MCP/App tool widening, and no product write.
  Product-write remains parked by #686. The next recommended slice is
  `cockpit_agent_perspective_substrate_folded_audit_panel_v0_1`.
- Cockpit Agent Perspective Substrate folded audit panel v0.1:
  `components/agent-perspective-substrate-folded-audit-panel.tsx`,
  `components/augnes-cockpit.tsx`, and
  `scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs`
  (`npm run smoke:agent-perspective-substrate-folded-audit-panel-v0-1`)
  add a preview-only folded audit panel over the committed #689 preview
  fixture. The panel renders folded sections, surfacing cards, rule groups,
  source coverage preview, diagnostics, and the advisory authority boundary
  from static fixture data. It uses local-only folded state, requires
  `source_refs` or a source coverage boundary note, `epistemic_status`,
  `review_status`, `why_now`, and `authority_boundary_notes`, and renders
  suggested actions as preview labels only. This slice adds no persistence, no route/API,
  no server action, no DB/SQL/transaction behavior, no provider or
  OpenAI call, no source fetch, no retrieval execution, no agent execution or
  routing, no durable feedback persistence, no proof/evidence/work/Perspective
  durable write, and no product write. Product-write remains parked by #686.
  The next recommended slice is
  `ai_context_packet_compiler_geometry_substrate_upgrade_v0_1`.
- AI Context Packet compiler GeometryDigest/Substrate upgrade v0.1:
  `types/research-candidate-ai-context-packet.ts`,
  `lib/research-candidate-review/ai-context-packet.ts`,
  `fixtures/research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1.json`,
  and
  `scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs`
  (`npm run smoke:research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1`)
  upgrade the existing Research Candidate AI Context Packet compiler with
  #687 PerspectiveGeometryDigest, #688 Agent Perspective Substrate, #689 Agent
  Perspective Substrate Preview, and #690 folded audit panel lineage as
  advisory inputs. The upgraded packet adds `geometry_context`,
  `agent_substrate_context`, `folded_audit_context`, `target_agent_context`,
  `authority_boundary`, `lineage`, validation, and a deterministic fingerprint
  while preserving the base packet fields. Manual-note AI Context Packet and
  manual-note Formation Receipt fixtures are included in the upgraded packet
  lineage so the next handoff draft can preserve both static/base and
  manual-note context chains. It adds no provider/OpenAI call, no
  source fetch, no retrieval execution, no Codex execution, no GitHub
  automation, no external handoff sending, no route/UI behavior, no DB/proof/evidence/work/Perspective durable write, and no product write.
  Product-write remains parked by #686. The next recommended slice is
  `candidate_to_codex_handoff_draft_geometry_substrate_v0_1`.
- Candidate-to-Codex handoff draft Geometry/Substrate v0.1:
  `types/candidate-to-codex-handoff-draft.ts`,
  `lib/research-candidate-review/candidate-to-codex-handoff-draft.ts`,
  `fixtures/research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1.json`,
  and
  `scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs`
  (`npm run smoke:research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1`)
  add a deterministic, fixture-backed, copyable preview text only draft that
  consumes #691 upgraded AI Context Packet as advisory input. It preserves base/static and manual-note lineage, including the upgraded packet lineage,
  static/base packet refs, manual-note packet refs, manual-note Formation
  Receipt refs, GeometryDigest refs, Agent Substrate refs, folded audit panel
  refs, and the #686 product-write stopline ref.

  The draft is not execution approval and not source of truth. It grants no
  Codex execution, no branch/PR/GitHub automation, no external handoff sending,
  no provider/OpenAI/source-fetch/retrieval/RAG execution, no DB/proof/evidence/work/Perspective durable write, no route/UI behavior, no agent routing or execution, and no product write. Product-write remains parked by #686. The next recommended slice is
  `candidate_to_codex_handoff_draft_review_v0_1`.
- Candidate-to-Codex handoff draft review v0.1:
  `types/candidate-to-codex-handoff-draft-review.ts`,
  `lib/research-candidate-review/candidate-to-codex-handoff-draft-review.ts`,
  `fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json`,
  and
  `scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs`
  (`npm run smoke:research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1`)
  add a deterministic, fixture-backed, preview-only and review-only artifact
  that consumes #692 handoff draft as advisory preview input. It reviews
  prompt completeness, manual lineage, unresolved tensions, source refs,
  authority boundary, expected checks, and stop conditions before any human
  operator handoff decision.

  The review artifact is not execution approval and not source of truth. It
  grants no Codex execution, no branch/PR/GitHub automation, no external
  handoff sending, no provider/OpenAI/source-fetch/retrieval/RAG execution, no
  DB/proof/evidence/work/Perspective durable write, no route/UI behavior, no
  agent routing or execution, and no product write. Product-write remains
  parked by #686. The next recommended slice is
  `candidate_to_codex_handoff_operator_decision_v0_1`.
- Candidate-to-Codex handoff operator decision preview v0.1:
  `types/candidate-to-codex-handoff-operator-decision.ts`,
  `lib/research-candidate-review/candidate-to-codex-handoff-operator-decision.ts`,
  `fixtures/research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1.json`,
  and
  `scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs`
  (`npm run smoke:research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1`)
  add a deterministic, fixture-backed, preview-only and review-only artifact
  that consumes #693 handoff draft review as advisory input. The operator decision required but not satisfied boundary is explicit, and the preview does not record or satisfy a human decision.

  The operator decision preview is not execution approval and not source of
  truth. It grants no Codex execution, no branch/PR/GitHub automation, no
  external handoff sending, no provider/OpenAI/source-fetch/retrieval/RAG
  execution, no DB/proof/evidence/work/Perspective durable write, no route/UI
  behavior, no agent routing or execution, and no product write. Product-write
  remains parked by #686. The next recommended slice is
  `feedback_event_store_minimal_v0_1`.
- Feedback Event Store minimal v0.1:
  `types/feedback-event-store.ts`,
  `lib/research-candidate-review/feedback-event-store.ts`,
  `fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-store-minimal-v0-1.mjs`
  (`npm run smoke:feedback-event-store-minimal-v0-1`) start M15 with a
  minimal durable feedback event store for Research-to-Perspective preview
  surfaces. Supported event types are `dismiss_preview`, `pin_preview`,
  `correct_preview`, and `invalidate_preview`; future review-control events
  such as downgrade/add-to-capsule/exclude-from-capsule remain docs-only.

  Feedback events are durable operator input only. They are not
  proof/evidence records, not Perspective promotion decisions, not work
  mutation, not execution authority, and not product-write authority. The
  slice adds no Codex/GitHub automation/external handoff, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, no proof/evidence/Perspective promotion/work mutation, and no product write/product IDs.
  Product-write remains parked by #686. The next recommended slice is
  `feedback_event_store_review_controls_preview_v0_1`.
- Feedback Event Store review controls preview v0.1:
  `types/feedback-event-store-review-controls-preview.ts`,
  `lib/research-candidate-review/feedback-event-store-review-controls-preview.ts`,
  `fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs`
  (`npm run smoke:feedback-event-store-review-controls-preview-v0-1`) add a
  deterministic, fixture-backed review controls preview for Feedback Event
  Store minimal v0.1. The preview maps existing review surfaces and surfacing
  cards to preview-only controls for `dismiss_preview`, `pin_preview`,
  `correct_preview`, and `invalidate_preview`.

  Review controls preview is non-persisting: it shows which feedback event
  shape would be produced by future operator action, but it adds no route/server action/DB write yet and persists no feedback from controls.
  It adds no proof/evidence/Perspective promotion/work mutation, no
  Codex/GitHub automation/external handoff, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, and no product
  write/product IDs. Product-write remains parked by #686. The next
  recommended slice is `feedback_event_write_route_contract_v0_1`.
- Feedback Event write route contract v0.1:
  `types/feedback-event-write-route-contract.ts`,
  `lib/research-candidate-review/feedback-event-write-route-contract.ts`,
  `fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-write-route-contract-v0-1.mjs`
  (`npm run smoke:feedback-event-write-route-contract-v0-1`) add a
  deterministic, fixture-backed contract for a future feedback event write
  route. The route path documented but not implemented is
  `POST /api/research-candidate/feedback-events`.

  The route path is contract text only: there is no app/api route yet, no
  route handler, no server action, no DB open/write yet, no SQL execution, no
  schema/migration change, and no UI/component change. The contract grants no
  proof/evidence/Perspective promotion/work mutation, no Codex/GitHub
  automation/external handoff, no provider/OpenAI/source-fetch/retrieval/RAG
  execution, and no product write/product IDs. Product-write remains parked by
  #686. The next recommended slice is
  `feedback_event_write_route_implementation_v0_1`.
- Feedback Event write route implementation v0.1:
  `app/api/research-candidate/feedback-events/route.ts`,
  `fixtures/research-candidate-review.feedback-event-write-route-implementation.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs`
  (`npm run smoke:feedback-event-write-route-implementation-v0-1`) implement
  `POST /api/research-candidate/feedback-events` for Feedback Event Store
  v0.1 feedback events only. The route validates the #697 request contract,
  required authority acknowledgements, idempotency, refusal cases, and feedback
  event shape before writing through the feedback event store helper.

  The route implemented for feedback events only adds no UI/component change,
  no proof/evidence/Perspective promotion/work mutation, no Codex/GitHub
  automation/external handoff, no provider/OpenAI/source-fetch/retrieval/RAG
  execution, and no product write/product IDs. Product-write remains parked by
  #686. The next recommended slice is
  `feedback_event_write_route_browser_validation_v0_1`.
- Feedback Event write route browser validation v0.1:
  `fixtures/research-candidate-review.feedback-event-write-route-browser-validation.sample.v0.1.json`
  and `scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs`
  (`npm run smoke:feedback-event-write-route-browser-validation-v0-1`) validate
  the #698 `POST /api/research-candidate/feedback-events` implementation
  through route handler temp-DB validation. The smoke uses a temp DB under
  `/tmp`, observes valid insert and duplicate idempotency behavior, and checks
  required refusal paths for missing acknowledgements, forbidden authority
  requests, canonical authority-boundary flags, and capability/status flags.

  This browser-validation slice starts no app server and uses no browser UI:
  `app_server_started_now: false`, `browser_ui_used_now: false`, and
  `production_db_used_now: false` because route handler temp-DB validation is
  sufficient before UI integration. It adds no UI/component change, no new API
  route, no production DB write, no proof/evidence/Perspective promotion/work
  mutation, no Codex/GitHub automation/external handoff, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, and no product
  write/product IDs. Product-write remains parked by #686. The next recommended
  slice is `feedback_event_controls_ui_contract_v0_1`.
- Feedback Event controls UI contract v0.1:
  `types/feedback-event-controls-ui-contract.ts`,
  `lib/research-candidate-review/feedback-event-controls-ui-contract.ts`,
  `fixtures/research-candidate-review.feedback-event-controls-ui-contract.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs`
  (`npm run smoke:feedback-event-controls-ui-contract-v0-1`) define how future
  UI controls will map preview-only feedback controls to
  `POST /api/research-candidate/feedback-events` request previews.

  This is a UI contract only: no component change yet, no browser request yet,
  no feedback persisted now, no app/api route change, no server action, no DB
  open/write, and no SQL execution. It grants no
  proof/evidence/Perspective promotion/work mutation, no Codex/GitHub
  automation/external handoff, no provider/OpenAI/source-fetch/retrieval/RAG
  execution, and no product write/product IDs. Product-write remains parked by
  #686. The next recommended slice is
  `feedback_event_controls_ui_implementation_v0_1`.
- Feedback Event controls UI implementation v0.1:
  `components/feedback-event-controls.tsx`,
  `components/agent-perspective-substrate-folded-audit-panel.tsx`,
  `fixtures/research-candidate-review.feedback-event-controls-ui-implementation.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs`
  (`npm run smoke:feedback-event-controls-ui-implementation-v0-1`) enables only dismiss/pin controls in folded audit panel surfaces. `dismiss_preview` is
  available for Agent Perspective Substrate surfacing cards, `pin_preview` is
  available for the source coverage folded section, and correct/invalidate remain disabled for later stable surfaces.

  The implementation writes durable feedback event only through existing route `POST /api/research-candidate/feedback-events`. This slice adds no new API
  route, no schema/migration change, no browser persistence, no
  proof/evidence/Perspective promotion/work mutation, no Codex/GitHub
  automation/external handoff, no provider/OpenAI/source-fetch/retrieval/RAG
  execution, and no product write/product IDs. Product-write remains parked by
  #686. The next recommended slice is
  `feedback_event_controls_ui_browser_validation_v0_1`.
- Feedback Event controls UI browser validation v0.1:
  `fixtures/research-candidate-review.feedback-event-controls-ui-browser-validation.sample.v0.1.json`
  and `scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs`
  (`npm run smoke:feedback-event-controls-ui-browser-validation-v0-1`) provide
  static component validation for the #701 feedback controls UI. The validation
  checks card-specific dismiss target validation, source coverage pin validation,
  and correct/invalidate disabled validation without starting the app server,
  using production DB, or sending browser requests.

  This validation slice adds no component change, no route change, no
  schema/migration change, no browser persistence, no production DB, no
  proof/evidence/Perspective promotion/work mutation, no Codex/GitHub
  automation/external handoff, no provider/OpenAI/source-fetch/retrieval/RAG
  execution, and no product write/product IDs. Product-write remains parked by
  #686. The next recommended slice is
  `feedback_event_store_list_route_contract_v0_1`.
- Feedback Event Store list route contract v0.1:
  `types/feedback-event-store-list-route-contract.ts`,
  `lib/research-candidate-review/feedback-event-store-list-route-contract.ts`,
  `fixtures/research-candidate-review.feedback-event-store-list-route-contract.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs`
  (`npm run smoke:feedback-event-store-list-route-contract-v0-1`) document the
  future `GET /api/research-candidate/feedback-events` list/read route contract
  without implementing it.

  The route path is documented but not implemented. This contract adds no app/api route change yet, no GET export, no server action, no DB open/read/write yet,
  no SQL execution, no schema/migration change, no
  component/UI change, no browser request, no proof/evidence/Perspective
  promotion/work mutation, no Codex/GitHub automation/external handoff, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, and no product
  write/product IDs. Product-write remains parked by #686. The next recommended
  slice is `feedback_event_store_list_route_implementation_v0_1`.
- Feedback Event Store list route implementation v0.1:
  `app/api/research-candidate/feedback-events/route.ts`,
  `fixtures/research-candidate-review.feedback-event-store-list-route-implementation.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs`
  (`npm run smoke:feedback-event-store-list-route-implementation-v0-1`)
  implement `GET /api/research-candidate/feedback-events` for bounded Feedback
  Event Store reads.

  The route reads durable feedback events only. GET does not write feedback,
  does not create proof/evidence, does not promote Perspective state, does not
  mutate work, and does not implement UI controls. This slice adds no
  UI/component change, no schema/migration change, no product DB write, no
  Codex/GitHub automation/external handoff, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, and no product
  write/product IDs. Product-write remains parked by #686. The next recommended
  slice is `feedback_event_store_list_route_browser_validation_v0_1`.
- Feedback Event Store list route browser validation v0.1:
  `fixtures/research-candidate-review.feedback-event-store-list-route-browser-validation.sample.v0.1.json`
  and `scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs`
  (`npm run smoke:feedback-event-store-list-route-browser-validation-v0-1`)
  validate `GET /api/research-candidate/feedback-events` through route handler
  temp-DB validation.

  The validation confirms GET route read-only behavior validation for durable
  feedback events only. It reads durable feedback events only, checks valid
  list/filter/refusal behavior, uses a temp DB under `/tmp`, and starts no app
  server or browser UI. GET does not write feedback. This slice adds no
  UI/component change, no app/api route change, no route handler change, no
  schema/migration change, no production DB read/write, no feedback write, no
  proof/evidence/Perspective promotion/work mutation, no Codex/GitHub
  automation/external handoff, no provider/OpenAI/source-fetch/retrieval/RAG
  execution, and no product write/product IDs. Product-write remains parked by
  #686. The next recommended slice is
  `feedback_event_store_list_ui_contract_v0_1`.
- Feedback Event Store list UI contract v0.1:
  `types/feedback-event-store-list-ui-contract.ts`,
  `lib/research-candidate-review/feedback-event-store-list-ui-contract.ts`,
  `fixtures/research-candidate-review.feedback-event-store-list-ui-contract.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs`
  (`npm run smoke:feedback-event-store-list-ui-contract-v0-1`) define the
  fixture-backed contract for a future Feedback Event Store list panel.

  This slice is UI contract only. It defines future GET request previews for
  `GET /api/research-candidate/feedback-events`, display policy, local state
  policy, error display policy, and authority acknowledgements before any UI
  list panel implementation. It has no component change yet, no browser request
  yet, no feedback event read/write now, no production DB open/read/write, no
  app/api route change, no route handler change, no server action, no SQL
  execution, no schema/migration change, no package dependency addition, no
  browser persistence, no proof/evidence/Perspective promotion/work mutation,
  no Codex/GitHub automation/external handoff, no provider/OpenAI/source-fetch/retrieval/RAG execution, and no product write/product IDs. Product-write remains parked by #686. The next recommended slice is
  `feedback_event_store_list_ui_implementation_v0_1`.
- Feedback Event Store list UI implementation v0.1:
  `components/feedback-event-store-list-panel.tsx`,
  `components/agent-perspective-substrate-folded-audit-panel.tsx`,
  `fixtures/research-candidate-review.feedback-event-store-list-ui-implementation.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs`
  (`npm run smoke:feedback-event-store-list-ui-implementation-v0-1`) implement
  a read-only feedback event history panel in the folded audit surface.

  The panel can issue a GET-only browser request to feedback event list route
  `GET /api/research-candidate/feedback-events` with the list UI contract
  acknowledgements and allowed filters. It adds no feedback write from list UI,
  no app/api route change, no route handler change, no server action, no
  schema/migration change, no package dependency addition, no browser
  persistence, no auto refresh, no proof/evidence/Perspective promotion/work
  mutation, no Codex/GitHub automation/external handoff, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, and no product
  write/product IDs. Product-write remains parked by #686. The next recommended
  slice is `feedback_event_store_list_ui_browser_validation_v0_1`.
- Feedback Event Store list UI browser validation v0.1:
  `fixtures/research-candidate-review.feedback-event-store-list-ui-browser-validation.sample.v0.1.json`
  and `scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs`
  (`npm run smoke:feedback-event-store-list-ui-browser-validation-v0-1`)
  validate the #707 read-only Feedback event history panel in the folded audit
  surface.

  The validation confirms that the panel renders in the Agent Perspective
  Substrate folded audit panel, defaults to all feedback events with limit 50 only,
  has no target_kind or target_id default scope, exposes only the allowed
  filters, sends only `GET /api/research-candidate/feedback-events` requests,
  includes `feedback_event_store_list_route_request.v0.1`,
  `include_event_json=true`, required read authority acknowledgements, local
  React state only, loading/empty/success/refusal/validation failure displays,
  operator input only labels, not proof/evidence, not Perspective state, not
  work status, not retrieval/RAG result, not product write labels, and duplicate
  feedback indication without mutation. It performs static validation only: no
  runtime browser request execution, no feedback write from list UI, no POST,
  no mutation controls, no app/api route change, no route handler change, no
  schema/migration change, no package dependency addition, no browser
  persistence, no auto refresh, no proof/evidence/Perspective promotion/work
  mutation, no Codex/GitHub automation/external handoff, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, and no product
  write/product IDs. Product-write remains parked by #686. The next recommended
  slice is `feedback_event_aggregation_read_model_contract_v0_1`.
- Feedback Event aggregation read model contract v0.1:
  `types/feedback-event-aggregation-read-model-contract.ts`,
  `fixtures/research-candidate-review.feedback-event-aggregation-read-model-contract.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs`
  (`npm run smoke:feedback-event-aggregation-read-model-contract-v0-1`)
  define read-model-only aggregation over durable feedback events.

  This is a contract/fixture/smoke/docs slice only. It adds no runtime implementation,
  no DB query, no browser request, no feedback write/mutation,
  no app/api route change, no route handler change, no server action, no
  schema/migration change, no package dependency addition, no browser
  persistence, no proof/evidence/Perspective promotion/work mutation, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, no salience authority,
  and no product write/product IDs. The aggregation views are advisory/read-only
  and not proof/evidence, not Perspective state, not work status, not promotion
  authority, not retrieval/RAG result, and not product write. product-write remains parked by #686.
  The next recommended slice is
  `feedback_event_aggregation_read_model_implementation_v0_1`.
- Feedback Event aggregation read model implementation v0.1:
  `lib/research-candidate-review/feedback-event-aggregation-read-model.ts`,
  `fixtures/research-candidate-review.feedback-event-aggregation-read-model-implementation.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs`
  (`npm run smoke:feedback-event-aggregation-read-model-implementation-v0-1`)
  add a deterministic fixture-backed implementation over the #709 aggregation
  read model contract.

  This implementation reads committed fixture data only and builds read-model-only
  aggregation views over durable feedback events. It adds no runtime DB query,
  no production DB read, no route or UI, no browser request, no feedback
  write/mutation, no app/api route change, no route handler change, no server
  action, no schema/migration change, no package dependency addition, no browser
  persistence, no proof/evidence/Perspective promotion/work mutation, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, no salience authority,
  and no product write/product IDs. product-write remains parked by #686. The
  next recommended slice is
  `feedback_event_aggregation_read_model_browser_validation_v0_1`.
- Feedback Event aggregation read model browser validation v0.1:
  `fixtures/research-candidate-review.feedback-event-aggregation-read-model-browser-validation.sample.v0.1.json`
  and `scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs`
  (`npm run smoke:feedback-event-aggregation-read-model-browser-validation-v0-1`)
  validates deterministic fixture-backed implementation behavior from #710.

  This validation is static and fixture-backed only. It adds no runtime DB query,
  no production DB read, no route or UI, no browser request, no feedback
  write/mutation, no app/api route change, no route handler change, no server
  action, no schema/migration change, no package dependency addition, no browser
  persistence, no proof/evidence/Perspective promotion/work mutation, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, no salience authority,
  and no product write/product IDs. product-write remains parked by #686. The
  next recommended slice is
  `formation_receipt_durable_event_contract_v0_1`.
- Formation Receipt durable event contract v0.1:
  `types/formation-receipt-durable-event-contract.ts`,
  `fixtures/research-candidate-review.formation-receipt-durable-event-contract.sample.v0.1.json`,
  and `scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs`
  (`npm run smoke:formation-receipt-durable-event-contract-v0-1`)
  define a contract-only durable event shape for Formation Receipt provenance.

  The contract records provenance/selection/exclusion/tension preservation for
  selected context, excluded context with reasons, unresolved tensions, digest
  refs, handoff refs, decision refs, result refs, source refs, and candidate
  refs. Selected context is provenance only, not proof/evidence and not source
  of truth. Excluded context is audit/provenance only and does not delete
  source/candidate/feedback records or suppress future review. Decision links
  are references only.

  This is a type/fixture/static-smoke/docs slice only. It adds no runtime DB write,
  no production DB read, no route or UI, no browser request, no browser
  persistence, no durable event write implementation, no feedback write/mutation,
  no app/api route change, no route handler change, no server action, no
  component/UI implementation, no schema/migration change, no package dependency
  addition, no proof/evidence/Perspective promotion/work mutation, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, no salience authority,
  and no product write/product IDs. product-write remains parked by #686. The
  next recommended slice is
  `formation_receipt_durable_event_implementation_v0_1`.
- Formation Receipt durable event implementation v0.1:
  `lib/research-candidate-review/formation-receipt-durable-event.ts`,
  `fixtures/research-candidate-review.formation-receipt-durable-event-implementation.sample.v0.1.json`,
  and `scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs`
  (`npm run smoke:formation-receipt-durable-event-implementation-v0-1`)
  add a deterministic fixture-backed implementation for the #712 Formation
  Receipt durable event contract.

  The builder uses committed fixture data only and records the generated receipt event shape from #712 contract fields. The implementation fixture includes
  selected/excluded context summary, unresolved tension preservation, and
  reference-only decision/handoff/result links. It keeps selected context as
  provenance only, excluded context as audit/provenance only, unresolved
  tensions unresolved, and linked decisions/results as references only.

  This has no runtime persistence. It adds no runtime DB write/query, no
  production DB read, no schema/migration, no route or UI, no browser request,
  no browser persistence, no feedback write/mutation, no proof/evidence/Perspective promotion/work mutation, no provider/OpenAI/source-fetch/retrieval/RAG execution,
  no salience authority, and no product write/product IDs. product-write remains
  parked by #686. The next recommended slice is
  `formation_receipt_durable_event_browser_validation_v0_1`.
- Formation Receipt durable event browser validation v0.1:
  `fixtures/research-candidate-review.formation-receipt-durable-event-browser-validation.sample.v0.1.json`
  and `scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs`
  (`npm run smoke:formation-receipt-durable-event-browser-validation-v0-1`)
  validate the #713 deterministic fixture-backed Formation Receipt durable
  event implementation.

  The validation validates deterministic fixture-backed implementation output,
  validates generated receipt event shape from #712 contract fields, validates selected/excluded context summaries, validates invalid override summary/validation consistency,
  validates unresolved tension preservation, and validates reference-only decision/handoff/result links.

  This has no runtime persistence. It adds no runtime DB write/query, no
  production DB read, no schema/migration, no route or UI, no browser request,
  no browser persistence, no feedback write/mutation, no proof/evidence/Perspective promotion/work mutation, no provider/OpenAI/source-fetch/retrieval/RAG execution,
  no salience authority, and no product write/product IDs. product-write remains
  parked by #686. The next recommended slice is
  `recent_rehearsal_buffer_contract_v0_1`.
- Recent Rehearsal Buffer contract v0.1:
  `types/recent-rehearsal-buffer-contract.ts`,
  `fixtures/research-candidate-review.recent-rehearsal-buffer-contract.sample.v0.1.json`,
  and `scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs`
  (`npm run smoke:recent-rehearsal-buffer-contract-v0-1`)
  define the contract-only non-durable working memory adapter for recent work resume context.

  The contract records compact resume inputs only: the last active research
  question, optional active perspective/candidate context, open tensions, a
  recent failed check, the last user decision, recent context refs with
  source_refs, excluded context refs with reasons, and decay states fresh/warm/cool/archive.
  It is non-durable and not a promotion basis, source of truth, proof/evidence,
  Perspective state, work status, salience authority, retrieval/RAG result, or
  product write.

  This has no runtime persistence. It adds no durable memory write, no runtime
  DB write/query, no production DB read, no schema/migration, no route or UI,
  no browser request, no browser persistence, no formation receipt write, no
  feedback write/mutation, no proof/evidence/Perspective promotion/work
  mutation, no provider/OpenAI/source-fetch/retrieval/RAG execution, no salience
  authority, and no product write/product IDs. product-write remains parked by
  #686. The next recommended slice is
  `recent_rehearsal_buffer_implementation_v0_1`.
- Recent Rehearsal Buffer implementation v0.1:
  `lib/research-candidate-review/recent-rehearsal-buffer.ts`,
  `fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json`,
  and `scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs`
  (`npm run smoke:recent-rehearsal-buffer-implementation-v0-1`)
  add a deterministic fixture-backed implementation for the #715 Recent
  Rehearsal Buffer contract.

  The builder uses committed fixture data only and records the generated non-durable buffer shape from #715 contract fields. The implementation fixture includes
  resume context summary, decay summary, non-durable summary, invalid override summary/validation consistency,
  and authority-boundary validation. It keeps recent context as resume context
  only, excluded context as reasoned audit context, decay as display context
  only, and the buffer as non-durable.

  This has no runtime persistence. It adds no durable memory write, no runtime
  DB write/query, no production DB read, no schema/migration, no route or UI,
  no browser request, no browser persistence, no formation receipt write, no
  feedback write/mutation, no proof/evidence/Perspective promotion/work
  mutation, no provider/OpenAI/source-fetch/retrieval/RAG execution, no salience
  authority, and no product write/product IDs. product-write remains parked by
  #686. The next recommended slice is
  `recent_rehearsal_buffer_browser_validation_v0_1`.
- Recent Rehearsal Buffer browser validation v0.1:
  `fixtures/research-candidate-review.recent-rehearsal-buffer-browser-validation.sample.v0.1.json`
  and `scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs`
  (`npm run smoke:recent-rehearsal-buffer-browser-validation-v0-1`)
  validate the deterministic fixture-backed implementation from #716.

  The validation fixture validates generated non-durable buffer shape from #715 contract.
  It validates generated buffer contract authority boundary.
  It validates top-level implementation boundary separation.
  It validates resume context summary.
  It validates decay summary.
  It validates invalid override summary/validation consistency. It confirms recent context
  keeps source refs, excluded context keeps reasons, decay remains display
  context only, and the buffer remains compact, non-durable resume context.

  This has no runtime persistence. It adds no durable memory write, no runtime
  DB write/query, no production DB read, no schema/migration, no route or UI,
  no browser request, no browser persistence, no formation receipt write, no
  feedback write/mutation, no proof/evidence/Perspective promotion/work
  mutation, no provider/OpenAI/source-fetch/retrieval/RAG execution, no salience
  authority, and no product write/product IDs. product-write remains parked by
  #686. The next recommended slice is `salience_governor_contract_v0_1`.
- Salience Governor contract v0.1:
  `types/salience-governor-contract.ts`,
  `fixtures/research-candidate-review.salience-governor-contract.sample.v0.1.json`,
  and `scripts/smoke-salience-governor-contract-v0-1.mjs`
  (`npm run smoke:salience-governor-contract-v0-1`) define a contract-only display/reuse priority adapter for
  candidate overload reduction.

  The contract defines salience components, inhibition components, and
  hint-only pin/watch/defer/boost/suppress/reactivate/inspect/keep_visible/cool_down
  action policy. The priority view is display-only and reuse-priority-only:
  suppression and reactivation are display hints only, salience score previews
  are bounded to `0_to_1`, and salience score is not promotion readiness,
  durable approval, evidence strength, proof/evidence, Perspective state, work
  status, retrieval/RAG result, source of truth, or product write authority.

  This has no runtime salience scoring and no salience score authority. It adds
  no runtime persistence, no durable memory write, no runtime DB write/query, no
  production DB read, no schema/migration, no route or UI, no browser request,
  no browser persistence, no recent rehearsal buffer write, no formation receipt
  write, no feedback write/mutation, no candidate/work mutation, no
  proof/evidence/Perspective promotion/work mutation, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, and no product
  write/product IDs. product-write remains parked by #686. The next recommended
  slice is `salience_governor_implementation_v0_1`.
- Salience Governor implementation v0.1:
  `lib/research-candidate-review/salience-governor.ts`,
  `fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json`,
  and `scripts/smoke-salience-governor-implementation-v0-1.mjs`
  (`npm run smoke:salience-governor-implementation-v0-1`) define a
  deterministic fixture-backed implementation for the #718 contract.

  The builder records a generated display/reuse priority view from #718 contract
  data only and records salience component summary, inhibition component summary,
  action hint summary, and priority view summary. It keeps the generated
  priority view contract authority boundary separate from the top-level
  implementation authority boundary. Action hints remain hint-only, suppression
  and reactivation remain display hints only, and salience score previews remain
  bounded display/reuse priority data.

  This has no runtime salience scoring and no salience score authority. It adds
  no runtime persistence, no durable salience write, no durable memory write, no
  runtime DB write/query, no production DB read, no schema/migration, no route
  or UI, no browser request, no browser persistence, no recent rehearsal buffer
  write, no formation receipt write, no feedback write/mutation, no proof/evidence/Perspective promotion/candidate mutation/work mutation, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, and no product
  write/product IDs. product-write remains parked by #686. The next recommended
  slice is `salience_governor_browser_validation_v0_1`.
- Salience Governor browser validation v0.1:
  `fixtures/research-candidate-review.salience-governor-browser-validation.sample.v0.1.json`
  and `scripts/smoke-salience-governor-browser-validation-v0-1.mjs`
  (`npm run smoke:salience-governor-browser-validation-v0-1`) validate the
  deterministic fixture-backed implementation from #719.

  Smoke coverage validates deterministic fixture-backed implementation, validates generated display/reuse priority view from #718 contract, validates generated priority view contract authority boundary, validates top-level implementation boundary separation, validates salience component summary, validates inhibition component summary, validates action hint summary, validates priority view summary, validates salience score preview as display/reuse priority only, and validates synthetic top_k override behavior.

  The validation fixture validates generated display/reuse priority view from #718 contract data. It validates generated priority view contract authority
  boundary, top-level implementation boundary separation, salience component
  summary, inhibition component summary, action hint summary, and priority view
  summary. It validates salience score preview as display/reuse priority only
  and validates synthetic top_k override behavior, including deterministic
  score-first and candidate-ref tie-break ordering.

  This has no runtime salience scoring and no salience score authority. It adds
  no runtime persistence, no durable salience write, no durable memory write, no
  runtime DB write/query, no production DB read, no schema/migration, no route
  or UI, no browser request, no browser persistence, no recent rehearsal buffer
  write, no formation receipt write, no feedback write/mutation, no proof/evidence/Perspective promotion/candidate mutation/work mutation, no
  provider/OpenAI/source-fetch/retrieval/RAG execution, and no product
  write/product IDs. product-write remains parked by #686. The next recommended
  slice is `bounded_external_source_intake_contract_v0_1`.
- Bounded External Source Intake contract v0.1:
  `types/bounded-external-source-intake-contract.ts`,
  `fixtures/research-candidate-review.bounded-external-source-intake-contract.sample.v0.1.json`,
  and `scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs`
  (`npm run smoke:bounded-external-source-intake-contract-v0-1`) define a
  contract-only operator-provided source intake reference policy.

  The contract defines allowed reference-only source input kinds for
  operator-provided URL references, uploaded PDF metadata, uploaded notes
  references, browser capture references, OAuth document pointers,
  repo-backed document refs, and manual bibliographic references. It also
  defines disallowed crawler/search/provider/raw private ID inputs, including
  crawler seeds, unbounded domain crawls, automatic web search,
  provider-generated sources without operator references, raw private URLs as
  canonical IDs, raw OAuth tokens, raw thread/run IDs, and arbitrary user
  strings as stable IDs.

  This has no runtime source fetch and no crawler. It adds no provider/OpenAI call, no retrieval/RAG execution, no source index write, no durable source record write, no runtime persistence, no durable memory write, no runtime DB write/query, no production DB read, no schema/migration, no route or UI, no browser request, no browser persistence, no feedback write/mutation, no proof/evidence/Perspective promotion/candidate mutation/work mutation, and no product write/product IDs. product-write remains parked by #686. The next
  recommended slice is
  `bounded_external_source_intake_implementation_v0_1`.
- Bounded External Source Intake implementation v0.1:
  `lib/research-candidate-review/bounded-external-source-intake.ts`,
  `fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json`,
  and `scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs`
  (`npm run smoke:bounded-external-source-intake-implementation-v0-1`)
  implement a deterministic fixture-backed implementation with a generated reference-only source intake bundle from #721 contract data.

  The implementation emits allowed source input summary, disallowed source input summary, source reference summary, candidate generation summary, provenance summary, privacy summary, and non-authority summary. The generated bundle keeps the #721 contract authority boundary and validation policy, while implementation-added flags stay only on the top-level implementation object.

  This has no runtime source fetch, no crawler behavior, no provider/OpenAI
  call, no retrieval/RAG execution, no source index write, no durable source
  record write, no runtime persistence, no durable memory write, no runtime DB
  write/query, no production DB read, no schema/migration, no route or UI, no
  browser request, no browser persistence, no durable salience write, no recent
  rehearsal buffer write, no formation receipt write, no feedback
  write/mutation, no proof/evidence/Perspective promotion/candidate
  mutation/work mutation, and no product write/product IDs. product-write
  remains parked by #686. The next recommended slice is
  `bounded_external_source_intake_browser_validation_v0_1`.
- Bounded External Source Intake browser validation v0.1:
  `fixtures/research-candidate-review.bounded-external-source-intake-browser-validation.sample.v0.1.json`
  and `scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs`
  (`npm run smoke:bounded-external-source-intake-browser-validation-v0-1`)
  validate the #722 deterministic fixture-backed implementation.

  Smoke coverage validates deterministic fixture-backed implementation,
  validates generated reference-only source intake bundle from #721 contract,
  validates contract boundary / top-level implementation boundary separation,
  validates invalid source_refs override rejection, validates disallowed source input rejection, and validates no source fetch / crawler / provider extraction / retrieval/RAG / source index / durable source record write.

  The validation fixture keeps the generated bundle authority boundary matched
  to the #721 contract while confirming the top-level implementation boundary
  is separate. It validates invalid source_refs overrides for disallowed and
  unknown source input kinds, source fetch enabled, provider extraction enabled,
  candidate generation now, missing source refs, missing operator context,
  non-public-safe refs, and invalid source status.

  This has no runtime source fetch, no crawler behavior, no provider/OpenAI
  call, no retrieval/RAG execution, no source index write, no durable source
  record write, no runtime persistence, no durable memory write, no runtime DB
  write/query, no production DB read, no schema/migration, no route or UI, no
  browser request, no browser persistence, no durable salience write, no recent
  rehearsal buffer write, no formation receipt write, no feedback
  write/mutation, no proof/evidence/Perspective promotion/candidate
  mutation/work mutation, and no product write/product IDs. product-write
  remains parked by #686. The next recommended slice is
  `operator_source_candidate_generation_contract_v0_1`.
- Operator Source Candidate Generation contract v0.1:
  `types/operator-source-candidate-generation-contract.ts`,
  `fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json`,
  and `scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs`
  (`npm run smoke:operator-source-candidate-generation-contract-v0-1`)
  define a contract-only candidate-generation preview policy from bounded source intake.

  The contract defines candidate preview families for claim candidate previews,
  evidence candidate previews, tension candidate previews, knowledge gap
  candidate previews, perspective delta candidate previews, and follow-up work
  candidate previews. It also defines generated candidate policy and
  provenance/review/privacy/non-authority policies for keeping generated
  candidates candidate-only, preview-only, source-ref-backed,
  operator-context-backed, and later-review-only.

  This has no runtime candidate generation, no source fetch, no crawler
  behavior, no provider/OpenAI call, no retrieval/RAG execution, no source
  index write, no durable source record write, no candidate record write, no
  runtime persistence, no durable memory write, no runtime DB write/query, no
  production DB read, no schema/migration, no route or UI, no browser request,
  no browser persistence, no durable salience write, no recent rehearsal buffer
  write, no formation receipt write, no feedback write/mutation, no
  proof/evidence/Perspective promotion/candidate mutation/work mutation, and no
  product write/product IDs. product-write remains parked by #686. The next
  recommended slice is
  `operator_source_candidate_generation_implementation_v0_1`.
- Operator Source Candidate Generation implementation v0.1:
  `lib/research-candidate-review/operator-source-candidate-generation.ts`,
  `fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json`,
  and `scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs`
  (`npm run smoke:operator-source-candidate-generation-implementation-v0-1`)
  implement a deterministic fixture-backed implementation.

  The generated candidate generation preview bundle from #724 contract remains
  deterministic and fixture-backed, with a candidate preview family summary,
  generated candidate summary, source reference summary, and
  provenance/review/privacy/non-authority summaries. The invalid generated
  candidate preview override rejection keeps generated candidates
  candidate-only, preview-only,
  source-ref-backed, operator-context-backed, review-required-later, and
  durable_write_now false.
  It validates invalid generated candidate preview override rejection.

  This has no runtime candidate generation, no source fetch, no crawler
  behavior, no provider/OpenAI call, no retrieval/RAG execution, no source
  index write, no durable source record write, no candidate record write, no
  runtime persistence, no durable memory write, no runtime DB write/query, no
  production DB read, no schema/migration, no route or UI, no browser request,
  no browser persistence, no durable salience write, no recent rehearsal buffer
  write, no formation receipt write, no feedback write/mutation, no
  proof/evidence/Perspective promotion/candidate mutation/work mutation, and no
  product write/product IDs. product-write remains parked by #686. The next
  recommended slice is
  `operator_source_candidate_generation_browser_validation_v0_1`.
- Operator Source Candidate Generation browser validation v0.1:
  `fixtures/research-candidate-review.operator-source-candidate-generation-browser-validation.sample.v0.1.json`
  and `scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs`
  (`npm run smoke:operator-source-candidate-generation-browser-validation-v0-1`)
  validate the #725 deterministic fixture-backed implementation.

  Smoke coverage validates deterministic fixture-backed implementation,
  validates generated candidate generation preview bundle from #724 contract,
  validates candidate preview family summary, validates generated candidate summary,
  validates source reference summary, validates invalid generated
  candidate preview override rejection, and validates invalid source_refs
  override rejection.

  This has no runtime candidate generation, no source fetch, no crawler
  behavior, no provider/OpenAI call, no retrieval/RAG execution, no source
  index write, no durable source record write, no candidate record write, no
  runtime persistence, no durable memory write, no runtime DB write/query, no
  production DB read, no schema/migration, no route or UI, no browser request,
  no browser persistence, no durable salience write, no recent rehearsal buffer
  write, no formation receipt write, no feedback write/mutation, no
  proof/evidence/Perspective promotion/candidate mutation/work mutation, and no
  product write/product IDs. product-write remains parked by #686. The next
  recommended slice is `non_authoritative_retrieval_rag_contract_v0_1`.
- Non-authoritative Retrieval/RAG contract v0.1:
  `types/non-authoritative-retrieval-rag-contract.ts`,
  `fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json`,
  and `scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs`
  (`npm run smoke:non-authoritative-retrieval-rag-contract-v0-1`)
  define a contract-only, fixture-only Retrieval/RAG recall layer.

  The retrieval result is recall, not authority. The RAG answer is context preview, not evidence/proof.
  The embedding similarity is not truth, salience authority, or promotion readiness.
  The index is rebuildable, derived, and non-authoritative.
  The retrieval score is not truth score, promotion score, or evidence strength.
  A stale index cannot override current state. The vector DB is not source of truth,
  and there is no hidden permanent memory.

  This has no runtime retrieval/RAG execution, no runtime index build, no index
  write, no source index write, no embedding generation, no vector DB, no FTS,
  no provider/OpenAI call, no source fetch, no crawler, no DB write/query, no
  production DB read, no schema/migration, no route or UI, no browser request,
  no browser persistence, no durable source record write, no candidate record
  write, no durable memory write, no proof/evidence/Perspective
  promotion/candidate mutation/work mutation, and no product write/product
  IDs. product-write remains parked by #686. The next recommended slice is
  `non_authoritative_retrieval_rag_implementation_v0_1`.
  Boundary phrases: no runtime retrieval/RAG execution; no runtime index build;
  no index write; no embedding generation; no vector DB; no provider/OpenAI
  call; no source fetch; no crawler; no DB write/query; no schema/migration; no
  route or UI; no browser request; no proof/evidence/Perspective
  promotion/candidate mutation/work mutation; no product write/product IDs.
- Non-authoritative Retrieval/RAG implementation v0.1:
  `lib/research-candidate-review/non-authoritative-retrieval-rag.ts`,
  `fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json`,
  and `scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs`
  (`npm run smoke:non-authoritative-retrieval-rag-implementation-v0-1`)
  add a deterministic fixture-backed implementation only.

  This validates and materializes #727 contract preview bundle output into a
  public-safe recall/context preview fixture. The retrieval result is recall,
  not authority. The RAG answer is context preview, not evidence/proof. The
  embedding similarity is not truth, salience authority, or promotion
  readiness. The retrieval score is not truth score, promotion score, or
  evidence strength. The index is rebuildable, derived, and non-authoritative.
  A stale index cannot override current state. The vector DB is not source of
  truth, and there is no hidden permanent memory.

  This has no runtime retrieval/RAG execution, no runtime index build, no index
  write, no source index write, no embedding generation, no vector DB, no FTS,
  no provider/OpenAI call, no provider extraction, no source fetch, no crawler,
  no DB write/query, no production DB read, no durable memory write, no
  schema/migration, no route or UI, no browser request, no browser persistence,
  no durable source record write, no candidate record write, no
  proof/evidence/Perspective promotion/candidate mutation/work mutation, and no
  product write/product IDs. product-write remains parked by #686. The next
  recommended slice is
  `non_authoritative_retrieval_rag_browser_validation_v0_1`.
- Non-authoritative Retrieval/RAG browser validation v0.1:
  `fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json`
  and `scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs`
  (`npm run smoke:non-authoritative-retrieval-rag-browser-validation-v0-1`)
  validates deterministic fixture-backed implementation from #728.

  This validates #727 contract boundary and #728 top-level implementation
  boundary separation. It validates built preview bundle output, validates
  retrieval result family summary, validates source reference summary,
  validates invalid retrieval result override rejection, validates invalid RAG
  context preview override rejection, validates invalid source_refs override
  rejection, and validates invalid authority boundary override
  rejection.

  Validation phrases: validates #727 contract boundary and #728 top-level implementation boundary separation; validates built preview bundle; validates retrieval result family summary; validates source reference summary; validates invalid retrieval result override rejection; validates invalid RAG context preview override rejection; validates invalid source_refs override rejection; validates invalid authority boundary override rejection.

  Retrieval result is recall, not authority. RAG answer is context preview,
  not evidence/proof. Embedding similarity is not truth, salience authority, or
  promotion readiness. Retrieval score is not truth score, promotion score, or
  evidence strength. The index is rebuildable, derived, and non-authoritative.
  A stale index cannot override current state. The vector DB is not source of
  truth, and there is no hidden permanent memory.

  Boundary phrases: retrieval result is recall, not authority; RAG answer is context preview, not evidence/proof; embedding similarity is not truth, salience authority, or promotion readiness; retrieval score is not truth score, promotion score, or evidence strength; index is rebuildable, derived, and non-authoritative; stale index cannot override current state; vector DB is not source of truth; no hidden permanent memory.

  This has no runtime retrieval/RAG execution, no runtime index build, no index
  write, no source index write, no embedding generation, no vector DB, no FTS,
  no provider/OpenAI call, no provider extraction, no source fetch, no crawler,
  no DB write/query, no production DB read, no durable memory write, no
  schema/migration, no route or UI, no browser request, no browser persistence,
  no durable source record write, no candidate record write, no
  proof/evidence/Perspective promotion/candidate mutation/work mutation, and no
  product write/product IDs. product-write remains parked by #686. The next
  recommended slice is
  `human_reviewed_durable_perspective_promotion_contract_v0_1`.
- Human-reviewed Durable Perspective Promotion contract v0.1:
  `types/human-reviewed-durable-perspective-promotion-contract.ts`,
  `fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json`,
  and `scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs`
  (`npm run smoke:human-reviewed-durable-perspective-promotion-contract-v0-1`)
  define a contract-only, fixture-only, smoke-only future promotion gate.

  This contract requires explicit human review required and source_refs
  required before any future durable Perspective promotion. Claim candidate is
  not fact. Evidence candidate is not accepted evidence. Retrieval result is
  not promotion authority. RAG answer is not proof/evidence. Embedding
  similarity is not promotion readiness. Salience score is not promotion
  authority. Provider/OpenAI output cannot initiate promotion. Codex/GitHub
  automation cannot initiate promotion. Agent substrate cannot initiate
  promotion. Unresolved tensions must be preserved or explicitly resolved.
  Knowledge gaps must be preserved or explicitly deferred.

  Future promotion decision record required later. Future Formation Receipt
  required later. Future durable Perspective delta apply required later. This
  contract has no runtime promotion execution, no durable Perspective state
  write, no promotion decision record write, no proof/evidence write, no
  Formation Receipt write, no work mutation, no DB write/query, no
  schema/migration, no route or UI, no browser request, no provider/OpenAI
  call, no retrieval/RAG execution, and no product write/product IDs.
  Product-write remains parked by #686. The next recommended slice is
  `human_reviewed_durable_perspective_promotion_implementation_v0_1`.

  Boundary phrases: explicit human review required; source_refs required; claim candidate is not fact; evidence candidate is not accepted evidence; retrieval result is not promotion authority; RAG answer is not proof/evidence; embedding similarity is not promotion readiness; salience score is not promotion authority; provider/OpenAI output cannot initiate promotion; Codex/GitHub automation cannot initiate promotion; agent substrate cannot initiate promotion; unresolved tensions must be preserved or explicitly resolved; knowledge gaps must be preserved or explicitly deferred; future promotion decision record required later; future Formation Receipt required later; future durable Perspective delta apply required later; no runtime promotion execution; no durable Perspective state write; no promotion decision record write; no proof/evidence write; no Formation Receipt write; no work mutation; no DB write/query; no schema/migration; no route or UI; no browser request; no provider/OpenAI call; no retrieval/RAG execution; no product write/product IDs.
- Human-reviewed Durable Perspective Promotion implementation v0.1:
  `lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts`,
  `fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json`,
  and `scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs`
  (`npm run smoke:human-reviewed-durable-perspective-promotion-implementation-v0-1`)
  add a deterministic fixture-backed implementation only. It validates and
  materializes #730 promotion contract preview bundle output without adding
  runtime promotion authority.

  This implementation keeps explicit human review required, source_refs
  required, reviewer_note_ref required later, candidate/durable distinction
  preserved, claim candidate is not fact, evidence candidate is not accepted
  evidence, and accepted evidence distinction required. Retrieval result is
  not promotion authority. RAG answer is not proof/evidence. Embedding
  similarity is not promotion readiness. Salience score is not promotion
  authority. Provider/OpenAI output cannot initiate promotion. Codex/GitHub
  automation cannot initiate promotion. Agent Substrate cannot initiate
  promotion.

  Future promotion decision record required later. Future Formation Receipt
  required later. Future durable Perspective delta apply required later. This
  implementation has no runtime promotion execution, no durable Perspective
  state write, no promotion decision record write, no proof/evidence write, no
  Formation Receipt write, no work mutation, no DB write/query, no
  schema/migration, no route or UI, no browser request, no provider/OpenAI
  call, no retrieval/RAG execution, and no product write/product IDs.
  Product-write remains parked by #686. The next recommended slice is
  `human_reviewed_durable_perspective_promotion_browser_validation_v0_1`.

  Boundary phrases: deterministic fixture-backed implementation only; validates and materializes #730 promotion contract preview bundle; explicit human review required; source_refs required; reviewer_note_ref required later; candidate/durable distinction preserved; claim candidate is not fact; evidence candidate is not accepted evidence; accepted evidence distinction required; retrieval result is not promotion authority; RAG answer is not proof/evidence; embedding similarity is not promotion readiness; salience score is not promotion authority; provider/OpenAI output cannot initiate promotion; Codex/GitHub automation cannot initiate promotion; Agent Substrate cannot initiate promotion; future promotion decision record required later; future Formation Receipt required later; future durable Perspective delta apply required later; no runtime promotion execution; no durable Perspective state write; no promotion decision record write; no proof/evidence write; no Formation Receipt write; no work mutation; no DB write/query; no schema/migration; no route or UI; no browser request; no provider/OpenAI call; no retrieval/RAG execution; no product write/product IDs.
- Human-reviewed Durable Perspective Promotion browser validation v0.1:
  `fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json`
  and
  `scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs`
  (`npm run smoke:human-reviewed-durable-perspective-promotion-browser-validation-v0-1`)
  validate deterministic fixture-backed implementation from #731. The smoke
  validates #730 contract boundary and #731 top-level implementation boundary
  separation, validates built promotion preview bundle output, validates
  promotion decision family summary, validates source reference summary,
  validates candidate reference summary, validates invalid promotion decision
  override rejection, validates invalid promotion gate override rejection,
  validates invalid authority boundary override rejection, and validates
  invalid refs override rejection.

  This validation keeps explicit human review required, source_refs required,
  reviewer_note_ref required later, candidate/durable distinction preserved,
  claim candidate is not fact, and evidence candidate is not accepted evidence.
  Retrieval result is not promotion authority. RAG answer is not
  proof/evidence. Embedding similarity is not promotion readiness. Salience
  score is not promotion authority. Provider/OpenAI output cannot initiate
  promotion. Codex/GitHub automation cannot initiate promotion. Agent
  Substrate cannot initiate promotion.

  Future promotion decision record required later. Future Formation Receipt
  required later. Future durable Perspective delta apply required later. This
  validation has no runtime promotion execution, no durable Perspective state
  write, no promotion decision record write, no proof/evidence write, no
  Formation Receipt write, no work mutation, no DB write/query, no
  schema/migration, no route or UI, no browser request, no provider/OpenAI
  call, no retrieval/RAG execution, and no product write/product IDs.
  Product-write remains parked by #686. The next recommended slice is
  `durable_perspective_state_trajectory_contract_v0_1`.

  Boundary phrases: validates deterministic fixture-backed implementation from #731; validates #730 contract boundary and #731 top-level implementation boundary separation; validates built promotion preview bundle; validates promotion decision family summary; validates source reference summary; validates candidate reference summary; validates invalid promotion decision override rejection; validates invalid promotion gate override rejection; validates invalid authority boundary override rejection; validates invalid refs override rejection; explicit human review required; source_refs required; reviewer_note_ref required later; candidate/durable distinction preserved; claim candidate is not fact; evidence candidate is not accepted evidence; retrieval result is not promotion authority; RAG answer is not proof/evidence; embedding similarity is not promotion readiness; salience score is not promotion authority; provider/OpenAI output cannot initiate promotion; Codex/GitHub automation cannot initiate promotion; Agent Substrate cannot initiate promotion; future promotion decision record required later; future Formation Receipt required later; future durable Perspective delta apply required later; no runtime promotion execution; no durable Perspective state write; no promotion decision record write; no proof/evidence write; no Formation Receipt write; no work mutation; no DB write/query; no schema/migration; no route or UI; no browser request; no provider/OpenAI call; no retrieval/RAG execution; no product write/product IDs.
- Durable Perspective State / Trajectory contract v0.1:
  `types/durable-perspective-state-trajectory-contract.ts`,
  `fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json`,
  and
  `scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs`
  (`npm run smoke:durable-perspective-state-trajectory-contract-v0-1`)
  add a contract-only, fixture-only, smoke-only specification that defines
  future durable Perspective state shape and trajectory grammar.

  Current thesis has lineage. Prior thesis is not overwritten silently. Prior
  theses are preserved. Retired claims remain auditable. Contradicted evidence
  is not deleted. Open tensions are preserved or explicitly resolved.
  Knowledge gaps are preserved, explicitly deferred, or closed. Supporting
  evidence refs and contradicting evidence refs are distinct. Candidate
  evidence is not accepted evidence. Accepted evidence refs required for
  accepted evidence claims. Promotion history append-only later. Retirement
  history append-only later. PerspectiveSnapshot shape defined only.
  PerspectiveSnapshot is derived view, not independent source of truth.
  Salience state is display/reuse context only. Salience state is not
  authority.

  This contract has no runtime state read/write, no durable Perspective delta
  apply, no PerspectiveSnapshot runtime, no trajectory runtime build, no
  proof/evidence write, no accepted evidence write, no Formation Receipt
  write, no work mutation, no DB write/query, no schema/migration, no route or
  UI, no browser request, no provider/OpenAI call, no retrieval/RAG execution,
  and no product write/product IDs. Product-write remains parked by #686. The
  next recommended slice is
  `durable_perspective_state_trajectory_implementation_v0_1`.

  Boundary phrases: contract-only, fixture-only, smoke-only; defines future durable Perspective state shape and trajectory grammar; current thesis has lineage; prior thesis is not overwritten silently; prior theses are preserved; retired claims remain auditable; contradicted evidence is not deleted; open tensions are preserved or explicitly resolved; knowledge gaps are preserved, explicitly deferred, or closed; supporting evidence refs and contradicting evidence refs are distinct; candidate evidence is not accepted evidence; accepted evidence refs required for accepted evidence claims; promotion history append-only later; retirement history append-only later; PerspectiveSnapshot shape defined only; PerspectiveSnapshot is derived view, not independent source of truth; salience state is display/reuse context only; salience state is not authority; no runtime state read/write; no durable Perspective delta apply; no PerspectiveSnapshot runtime; no trajectory runtime build; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no DB write/query; no schema/migration; no route or UI; no browser request; no provider/OpenAI call; no retrieval/RAG execution; no product write/product IDs; product-write remains parked by #686.
- Durable Perspective State / Trajectory implementation v0.1:
  `lib/research-candidate-review/durable-perspective-state-trajectory.ts`,
  `fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json`,
  and
  `scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs`
  (`npm run smoke:durable-perspective-state-trajectory-implementation-v0-1`)
  add a deterministic fixture-backed implementation only. It validates and
  materializes #733 durable state/trajectory preview bundle output without
  adding runtime durable Perspective state authority.

  Current thesis has lineage. Prior thesis is not overwritten silently. Prior
  theses are preserved. Retired claims remain auditable. Contradicted evidence
  is not deleted. Open tensions are preserved or explicitly resolved.
  Knowledge gaps are preserved, explicitly deferred, or closed. Supporting
  evidence refs and contradicting evidence refs are distinct. Candidate
  evidence is not accepted evidence. Accepted evidence refs required for
  accepted evidence claims. Promotion history append-only later. Retirement
  history append-only later. PerspectiveSnapshot is derived view, not
  independent source of truth. PerspectiveSnapshot runtime not implemented.
  Salience state is display/reuse context only. Salience state is not
  authority.

  This implementation has no runtime state read/write, no durable Perspective
  delta apply, no PerspectiveSnapshot runtime, no trajectory runtime build, no
  proof/evidence write, no accepted evidence write, no Formation Receipt
  write, no work mutation, no DB write/query, no schema/migration, no route or
  UI, no browser request, no provider/OpenAI call, no retrieval/RAG execution,
  and no product write/product IDs. Product-write remains parked by #686. The
  next recommended slice is
  `durable_perspective_state_trajectory_browser_validation_v0_1`.

  Boundary phrases: deterministic fixture-backed implementation only; validates and materializes #733 durable state/trajectory preview bundle; current thesis has lineage; prior thesis is not overwritten silently; prior theses are preserved; retired claims remain auditable; Contradicted evidence is not deleted; open tensions are preserved or explicitly resolved; knowledge gaps are preserved, explicitly deferred, or closed; supporting evidence refs and contradicting evidence refs are distinct; candidate evidence is not accepted evidence; accepted evidence refs required for accepted evidence claims; promotion history append-only later; retirement history append-only later; PerspectiveSnapshot is derived view, not independent source of truth; PerspectiveSnapshot runtime not implemented; salience state is display/reuse context only; salience state is not authority; no runtime state read/write; no durable Perspective delta apply; no PerspectiveSnapshot runtime; no trajectory runtime build; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no DB write/query; no schema/migration; no route or UI; no browser request; no provider/OpenAI call; no retrieval/RAG execution; no product write/product IDs; product-write remains parked by #686.
- Durable Perspective State / Trajectory browser validation v0.1:
  `fixtures/research-candidate-review.durable-perspective-state-trajectory-browser-validation.sample.v0.1.json`
  and
  `scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs`
  (`npm run smoke:durable-perspective-state-trajectory-browser-validation-v0-1`)
  validate the deterministic fixture-backed implementation from #734. This
  validation checks the #733 contract boundary and #734 top-level
  implementation boundary separation, validates built durable state/trajectory
  preview bundle output, validates state field summary, validates trajectory
  event family summary, validates lineage summary, validates evidence summary,
  validates snapshot summary, validates salience summary, validates reference
  summary, validates invalid state preview override rejection, validates invalid
  trajectory event override rejection, validates invalid snapshot override
  rejection, validates invalid authority boundary override rejection, and
  validates invalid refs override rejection.

  Current thesis has lineage. Prior thesis is not overwritten silently. Prior
  theses are preserved. Retired claims remain auditable. contradicted evidence
  is not deleted. Open tensions are preserved or explicitly resolved.
  Knowledge gaps are preserved, explicitly deferred, or closed. Supporting
  evidence refs and contradicting evidence refs are distinct. Candidate
  evidence is not accepted evidence. Accepted evidence refs required for
  accepted evidence claims. Promotion history append-only later. Retirement
  history append-only later. PerspectiveSnapshot is derived view, not
  independent source of truth. PerspectiveSnapshot runtime not implemented.
  Salience state is display/reuse context only. Salience state is not
  authority.

  This validation has no runtime state read/write, no durable Perspective delta
  apply, no PerspectiveSnapshot runtime, no trajectory runtime build, no
  proof/evidence write, no accepted evidence write, no Formation Receipt
  write, no work mutation, no DB write/query, no schema/migration, no route or
  UI, no browser request, no provider/OpenAI call, no retrieval/RAG execution,
  and no product write/product IDs. Product-write remains parked by #686. The
  next recommended slice is
  `project_constellation_runtime_layout_contract_v0_1`.

  Boundary phrases: validates deterministic fixture-backed implementation from #734; validates #733 contract boundary and #734 top-level implementation boundary separation; validates built durable state/trajectory preview bundle; validates state field summary; validates trajectory event family summary; validates lineage summary; validates evidence summary; validates snapshot summary; validates salience summary; validates reference summary; validates invalid state preview override rejection; validates invalid trajectory event override rejection; validates invalid snapshot override rejection; validates invalid authority boundary override rejection; validates invalid refs override rejection; current thesis has lineage; prior thesis is not overwritten silently; prior theses are preserved; retired claims remain auditable; contradicted evidence is not deleted; open tensions are preserved or explicitly resolved; knowledge gaps are preserved, explicitly deferred, or closed; supporting evidence refs and contradicting evidence refs are distinct; candidate evidence is not accepted evidence; accepted evidence refs required for accepted evidence claims; promotion history append-only later; retirement history append-only later; PerspectiveSnapshot is derived view, not independent source of truth; PerspectiveSnapshot runtime not implemented; salience state is display/reuse context only; salience state is not authority; no runtime state read/write; no durable Perspective delta apply; no PerspectiveSnapshot runtime; no trajectory runtime build; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no DB write/query; no schema/migration; no route or UI; no browser request; no provider/OpenAI call; no retrieval/RAG execution; no product write/product IDs; product-write remains parked by #686.
- Project Constellation Runtime Layout contract v0.1:
  `types/project-constellation-runtime-layout-contract.ts`,
  `fixtures/research-candidate-review.project-constellation-runtime-layout-contract.sample.v0.1.json`,
  and
  `scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs`
  (`npm run smoke:project-constellation-runtime-layout-contract-v0-1`)
  add a contract-only, fixture-only, smoke-only specification that defines
  future stable Project Constellation layout grammar without adding layout
  runtime behavior.

  Layout is interface, not truth. Coordinates are display hints, not source of
  truth. Stable layout across refreshes required later. Deterministic seeded 2D
  layout required later. Manual anchors are display hints only. Temporal
  smoothing is display continuity only. Source balance required. Candidate
  overlay and durable graph remain distinct. Stale high-gravity nodes are
  marked. Bridge nodes are visible. Tension markers are visible. Knowledge gap
  markers are visible. Evidence rays are refs, not proof/evidence writes.
  PerspectiveSnapshot remains derived view. Salience state is display/reuse
  context only. Salience state is not authority.

  This contract has no runtime layout execution, no seeded layout runtime, no
  force-directed layout runtime, no temporal smoothing runtime, no layout
  persistence, no graph DB, no graph mutation, no runtime state read/write, no
  durable Perspective delta apply, no PerspectiveSnapshot runtime, no
  proof/evidence write, no accepted evidence write, no Formation Receipt write,
  no work mutation, no DB write/query, no schema/migration, no route or UI, no
  browser request, no provider/OpenAI call, no retrieval/RAG execution, and no
  product write/product IDs. Product-write remains parked by #686. The next
  recommended slice is
  `project_constellation_runtime_layout_implementation_v0_1`.

  Boundary phrases: Project Constellation Runtime Layout contract v0.1; contract-only, fixture-only, smoke-only; defines future stable Project Constellation layout grammar; layout is interface, not truth; coordinates are display hints, not source of truth; stable layout across refreshes required later; deterministic seeded 2D layout required later; manual anchors are display hints only; temporal smoothing is display continuity only; source balance required; candidate overlay and durable graph remain distinct; stale high-gravity nodes are marked; bridge nodes are visible; tension markers are visible; knowledge gap markers are visible; evidence rays are refs, not proof/evidence writes; PerspectiveSnapshot remains derived view; salience state is display/reuse context only; salience state is not authority; no runtime layout execution; no seeded layout runtime; no force-directed layout runtime; no temporal smoothing runtime; no layout persistence; no graph DB; no graph mutation; no runtime state read/write; no durable Perspective delta apply; no PerspectiveSnapshot runtime; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no DB write/query; no schema/migration; no route or UI; no browser request; no provider/OpenAI call; no retrieval/RAG execution; no product write/product IDs; product-write remains parked by #686.
- Project Constellation Runtime Layout implementation v0.1:
  `lib/research-candidate-review/project-constellation-runtime-layout.ts`,
  `fixtures/research-candidate-review.project-constellation-runtime-layout-implementation.sample.v0.1.json`,
  and
  `scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs`
  (`npm run smoke:project-constellation-runtime-layout-implementation-v0-1`)
  add a deterministic fixture-backed implementation only. It validates and
  materializes #736 Project Constellation layout preview bundle output without
  adding layout runtime behavior.

  Layout is interface, not truth. Coordinates are display hints, not source of
  truth. Stable layout across refreshes required later. Deterministic seeded 2D
  layout required later. Manual anchors are display hints only. Temporal
  smoothing is display continuity only. Source balance required and
  advisory-only. Candidate overlay and durable graph remain distinct. Stale
  high-gravity nodes are marked. Bridge nodes are visible. Tension markers are
  visible. Knowledge gap markers are visible. Evidence rays are refs, not
  proof/evidence writes. PerspectiveSnapshot remains derived view. Salience
  state is display/reuse context only. Salience state is not authority. Layout
  coordinates, manual anchors, and cluster positions are not authority.

  This implementation has no runtime layout execution, no seeded layout
  runtime, no force-directed layout runtime, no temporal smoothing runtime, no
  layout persistence, no graph DB, no graph mutation, no UI rendering, no
  browser request, no runtime state read/write, no durable Perspective delta
  apply, no PerspectiveSnapshot runtime, no proof/evidence write, no accepted
  evidence write, no Formation Receipt write, no work mutation, no DB
  write/query, no schema/migration, no route or UI, no provider/OpenAI call, no
  retrieval/RAG execution, and no product write/product IDs. Product-write
  remains parked by #686. The next recommended slice is
  `project_constellation_runtime_layout_browser_validation_v0_1`.

  Boundary phrases: Project Constellation Runtime Layout implementation v0.1; deterministic fixture-backed implementation only; validates and materializes #736 Project Constellation layout preview bundle; layout is interface, not truth; coordinates are display hints, not source of truth; stable layout across refreshes required later; deterministic seeded 2D layout required later; manual anchors are display hints only; temporal smoothing is display continuity only; source balance required and advisory-only; candidate overlay and durable graph remain distinct; stale high-gravity nodes are marked; bridge nodes are visible; tension markers are visible; knowledge gap markers are visible; evidence rays are refs, not proof/evidence writes; PerspectiveSnapshot remains derived view; salience state is display/reuse context only; salience state is not authority; layout coordinates, manual anchors, and cluster positions are not authority; no runtime layout execution; no seeded layout runtime; no force-directed layout runtime; no temporal smoothing runtime; no layout persistence; no graph DB; no graph mutation; no UI rendering; no browser request; no runtime state read/write; no durable Perspective delta apply; no PerspectiveSnapshot runtime; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no DB write/query; no schema/migration; no route or UI; no provider/OpenAI call; no retrieval/RAG execution; no product write/product IDs; product-write remains parked by #686.
- Project Constellation Runtime Layout browser validation v0.1:
  `fixtures/research-candidate-review.project-constellation-runtime-layout-browser-validation.sample.v0.1.json`
  and
  `scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs`
  (`npm run smoke:project-constellation-runtime-layout-browser-validation-v0-1`)
  validate deterministic fixture-backed implementation from #737. This
  validation-only slice validates #736 contract boundary and #737 top-level
  implementation boundary separation, validates built Project Constellation
  layout preview bundle output, validates layout principle summary, validates
  node family summary, validates edge family summary, validates stability
  summary, validates source balance summary, validates candidate overlay
  summary, validates snapshot summary, validates salience summary, validates
  reference summary, validates invalid layout preview override rejection,
  validates invalid node override rejection, validates invalid edge override
  rejection, validates invalid authority boundary override rejection, and
  validates invalid refs override rejection.

  Layout is interface, not truth. Coordinates are display hints, not source of
  truth. Stable layout across refreshes required later. Deterministic seeded 2D
  layout required later. Manual anchors are display hints only. Temporal
  smoothing is display continuity only. Source balance required and
  advisory-only. Candidate overlay and durable graph remain distinct. Stale
  high-gravity nodes are marked. Bridge nodes are visible. Tension markers are
  visible. Knowledge gap markers are visible. Evidence rays are refs, not
  proof/evidence writes. PerspectiveSnapshot remains derived view. Salience
  state is display/reuse context only. Salience state is not authority. Layout
  coordinates, manual anchors, and cluster positions are not authority.

  This validation has no runtime layout execution, no seeded layout runtime, no
  force-directed layout runtime, no temporal smoothing runtime, no layout
  persistence, no graph DB, no graph mutation, no UI rendering, no browser
  request, no runtime state read/write, no durable Perspective delta apply, no
  PerspectiveSnapshot runtime, no proof/evidence write, no accepted evidence
  write, no Formation Receipt write, no work mutation, no DB write/query, no
  schema/migration, no route or UI, no provider/OpenAI call, no retrieval/RAG
  execution, and no product write/product IDs. Product-write remains parked by
  #686. The next recommended slice is
  `perspective_geometry_digest_contract_v0_1`.

  Boundary phrases: Project Constellation Runtime Layout browser validation v0.1; validates deterministic fixture-backed implementation from #737; validates #736 contract boundary and #737 top-level implementation boundary separation; validates built Project Constellation layout preview bundle; validates layout principle summary; validates node family summary; validates edge family summary; validates stability summary; validates source balance summary; validates candidate overlay summary; validates snapshot summary; validates salience summary; validates reference summary; validates invalid layout preview override rejection; validates invalid node override rejection; validates invalid edge override rejection; validates invalid authority boundary override rejection; validates invalid refs override rejection; layout is interface, not truth; coordinates are display hints, not source of truth; stable layout across refreshes required later; deterministic seeded 2D layout required later; manual anchors are display hints only; temporal smoothing is display continuity only; source balance required and advisory-only; candidate overlay and durable graph remain distinct; stale high-gravity nodes are marked; bridge nodes are visible; tension markers are visible; knowledge gap markers are visible; evidence rays are refs, not proof/evidence writes; PerspectiveSnapshot remains derived view; salience state is display/reuse context only; salience state is not authority; layout coordinates, manual anchors, and cluster positions are not authority; no runtime layout execution; no seeded layout runtime; no force-directed layout runtime; no temporal smoothing runtime; no layout persistence; no graph DB; no graph mutation; no UI rendering; no browser request; no runtime state read/write; no durable Perspective delta apply; no PerspectiveSnapshot runtime; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no DB write/query; no schema/migration; no route or UI; no provider/OpenAI call; no retrieval/RAG execution; no product write/product IDs; product-write remains parked by #686.
- Perspective Geometry Digest contract v0.1:
  `types/perspective-geometry-digest-contract.ts`,
  `fixtures/research-candidate-review.perspective-geometry-digest-contract.sample.v0.1.json`,
  and `scripts/smoke-perspective-geometry-digest-contract-v0-1.mjs`
  (`npm run smoke:perspective-geometry-digest-contract-v0-1`) add a
  contract-only, fixture-only, smoke-only specification that defines future
  AI-readable interpretation layer over Project Constellation layout without
  adding digest runtime behavior.

  PerspectiveGeometryDigest is interpretation, not truth. Raw coordinates are
  not enough. Raw coordinates are display hints only. Digest is derived view,
  not independent source of truth. Diagnostics are advisory-only. Cluster
  balance is not truth. Source dominance warning is not promotion authority.
  Manual gravity distribution is not authority. Coverage gaps are not inferred
  facts. Bridge nodes are visible. Stale high-gravity nodes are visible.
  Contradiction pairs are explicit and source-ref-backed. Evidence chains are
  refs, not proof/evidence writes. Recommended retrieval expansion is advisory
  and does not execute retrieval. Candidate overlay and durable graph remain
  distinct. PerspectiveSnapshot remains derived view. Salience state is
  display/reuse context only.

  This contract has no runtime geometry digest build, no geometry digest
  write, no raw-coordinate-only digest, no runtime layout execution, no layout
  persistence, no graph DB, no graph mutation, no UI rendering, no browser
  request, no runtime state read/write, no durable Perspective delta apply, no
  PerspectiveSnapshot runtime, no AI context packet implementation, no Codex
  handoff implementation, no proof/evidence write, no accepted evidence write,
  no Formation Receipt write, no work mutation, no DB write/query, no
  schema/migration, no route or UI, no provider/OpenAI call, no retrieval/RAG
  execution, and no product write/product IDs. Product-write remains parked by
  #686. The next recommended slice is
  `perspective_geometry_digest_implementation_v0_1`.

  Boundary phrases: Perspective Geometry Digest contract v0.1; contract-only, fixture-only, smoke-only; defines future AI-readable interpretation layer over Project Constellation layout; PerspectiveGeometryDigest is interpretation, not truth; raw coordinates are not enough; raw coordinates are display hints only; digest is derived view, not independent source of truth; diagnostics are advisory-only; cluster balance is not truth; source dominance warning is not promotion authority; manual gravity distribution is not authority; coverage gaps are not inferred facts; bridge nodes are visible; stale high-gravity nodes are visible; contradiction pairs are explicit and source-ref-backed; evidence chains are refs, not proof/evidence writes; recommended retrieval expansion is advisory and does not execute retrieval; candidate overlay and durable graph remain distinct; PerspectiveSnapshot remains derived view; salience state is display/reuse context only; no runtime geometry digest build; no geometry digest write; no raw-coordinate-only digest; no runtime layout execution; no layout persistence; no graph DB; no graph mutation; no UI rendering; no browser request; no runtime state read/write; no durable Perspective delta apply; no PerspectiveSnapshot runtime; no AI context packet implementation; no Codex handoff implementation; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no DB write/query; no schema/migration; no route or UI; no provider/OpenAI call; no retrieval/RAG execution; no product write/product IDs; product-write remains parked by #686.
- Perspective Geometry Digest implementation v0.1:
  `lib/research-candidate-review/perspective-geometry-digest.ts`,
  `fixtures/research-candidate-review.perspective-geometry-digest-implementation.sample.v0.1.json`,
  and `scripts/smoke-perspective-geometry-digest-implementation-v0-1.mjs`
  (`npm run smoke:perspective-geometry-digest-implementation-v0-1`) add a
  deterministic fixture-backed implementation only. It validates and
  materializes #739 Perspective Geometry Digest preview bundle output without
  adding runtime digest behavior.

  PerspectiveGeometryDigest is interpretation, not truth. Raw coordinates are
  not enough. Raw coordinates are display hints only and not source of truth.
  Digest is derived view, not independent source of truth. Diagnostics are
  advisory-only. Cluster balance is not truth. Source dominance warning is not
  promotion authority. Manual gravity distribution is not authority. Coverage
  gaps are not inferred facts. Bridge nodes are visible. Stale high-gravity
  nodes are visible. Contradiction pairs are explicit and source-ref-backed.
  Evidence chains are refs, not proof/evidence writes. Recommended retrieval
  expansion is advisory and does not execute retrieval. Candidate overlay and
  durable graph remain distinct. PerspectiveSnapshot remains derived view.
  Salience state is display/reuse context only.

  This implementation has no runtime geometry digest build, no geometry digest
  write, no geometry calculation runtime, no raw-coordinate-only digest, no
  runtime layout execution, no layout persistence, no graph DB, no graph
  mutation, no UI rendering, no browser request, no AI Context Packet
  implementation, no Codex handoff implementation, no runtime state
  read/write, no durable Perspective delta apply, no PerspectiveSnapshot
  runtime, no proof/evidence write, no accepted evidence write, no Formation
  Receipt write, no work mutation, no DB write/query, no schema/migration, no
  route or UI, no provider/OpenAI call, no retrieval/RAG execution, and no
  product write/product IDs. Product-write remains parked by #686. The next
  recommended slice is `perspective_geometry_digest_browser_validation_v0_1`.

  Boundary phrases: Perspective Geometry Digest implementation v0.1; deterministic fixture-backed implementation only; validates and materializes #739 Perspective Geometry Digest preview bundle; PerspectiveGeometryDigest is interpretation, not truth; raw coordinates are not enough; raw coordinates are display hints only and not source of truth; digest is derived view, not independent source of truth; diagnostics are advisory-only; cluster balance is not truth; source dominance warning is not promotion authority; manual gravity distribution is not authority; coverage gaps are not inferred facts; bridge nodes are visible; stale high-gravity nodes are visible; contradiction pairs are explicit and source-ref-backed; evidence chains are refs, not proof/evidence writes; recommended retrieval expansion is advisory and does not execute retrieval; candidate overlay and durable graph remain distinct; PerspectiveSnapshot remains derived view; salience state is display/reuse context only; no runtime geometry digest build; no geometry digest write; no geometry calculation runtime; no raw-coordinate-only digest; no runtime layout execution; no layout persistence; no graph DB; no graph mutation; no UI rendering; no browser request; no AI Context Packet implementation; no Codex handoff implementation; no runtime state read/write; no durable Perspective delta apply; no PerspectiveSnapshot runtime; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no DB write/query; no schema/migration; no route or UI; no provider/OpenAI call; no retrieval/RAG execution; no product write/product IDs; product-write remains parked by #686.
- Perspective Geometry Digest browser validation v0.1:
  `fixtures/research-candidate-review.perspective-geometry-digest-browser-validation.sample.v0.1.json`
  and `scripts/smoke-perspective-geometry-digest-browser-validation-v0-1.mjs`
  (`npm run smoke:perspective-geometry-digest-browser-validation-v0-1`)
  validate deterministic fixture-backed implementation from #740 without
  adding runtime digest behavior. It validates #739 contract boundary and #740
  top-level implementation boundary separation, validates built Perspective
  Geometry Digest preview bundle, validates digest principle summary, validates
  cluster digest family summary, validates node digest family summary,
  validates relationship digest family summary, validates diagnostic family
  summary, validates recommendation summary, validates reference summary,
  validates invalid digest preview override rejection, validates invalid
  cluster digest override rejection, validates invalid node digest override
  rejection, validates invalid relationship digest override rejection,
  validates invalid diagnostic override rejection, validates invalid authority
  boundary override rejection, and validates invalid refs override rejection.

  PerspectiveGeometryDigest is interpretation, not truth. Raw coordinates are
  not enough. Raw coordinates are display hints only and not source of truth.
  Digest is derived view, not independent source of truth. Diagnostics are
  advisory-only. Cluster balance is not truth. Source dominance warning is not
  promotion authority. Manual gravity distribution is not authority. Coverage
  gaps are not inferred facts. Bridge nodes are visible. Stale high-gravity
  nodes are visible. Contradiction pairs are explicit and source-ref-backed.
  Evidence chains are refs, not proof/evidence writes. Recommended retrieval
  expansion is advisory and does not execute retrieval. Candidate overlay and
  durable graph remain distinct. PerspectiveSnapshot remains derived view.
  Salience state is display/reuse context only.

  This validation has no runtime geometry digest build, no geometry digest
  write, no geometry calculation runtime, no raw-coordinate-only digest, no
  runtime layout execution, no layout persistence, no graph DB, no graph
  mutation, no UI rendering, no browser request, no AI Context Packet
  implementation, no Codex handoff implementation, no runtime state
  read/write, no durable Perspective delta apply, no PerspectiveSnapshot
  runtime, no proof/evidence write, no accepted evidence write, no Formation
  Receipt write, no work mutation, no DB write/query, no schema/migration, no
  route or UI, no provider/OpenAI call, no retrieval/RAG execution, and no
  product write/product IDs. Product-write remains parked by #686. The next
  recommended slice is `ai_context_packet_contract_v0_1`.

  Boundary phrases: Perspective Geometry Digest browser validation v0.1; validates deterministic fixture-backed implementation from #740; validates #739 contract boundary and #740 top-level implementation boundary separation; validates built Perspective Geometry Digest preview bundle; validates digest principle summary; validates cluster digest family summary; validates node digest family summary; validates relationship digest family summary; validates diagnostic family summary; validates recommendation summary; validates reference summary; validates invalid digest preview override rejection; validates invalid cluster digest override rejection; validates invalid node digest override rejection; validates invalid relationship digest override rejection; validates invalid diagnostic override rejection; validates invalid authority boundary override rejection; validates invalid refs override rejection; PerspectiveGeometryDigest is interpretation, not truth; raw coordinates are not enough; raw coordinates are display hints only and not source of truth; digest is derived view, not independent source of truth; diagnostics are advisory-only; cluster balance is not truth; source dominance warning is not promotion authority; manual gravity distribution is not authority; coverage gaps are not inferred facts; bridge nodes are visible; stale high-gravity nodes are visible; contradiction pairs are explicit and source-ref-backed; evidence chains are refs, not proof/evidence writes; recommended retrieval expansion is advisory and does not execute retrieval; candidate overlay and durable graph remain distinct; PerspectiveSnapshot remains derived view; salience state is display/reuse context only; no runtime geometry digest build; no geometry digest write; no geometry calculation runtime; no raw-coordinate-only digest; no runtime layout execution; no layout persistence; no graph DB; no graph mutation; no UI rendering; no browser request; no AI Context Packet implementation; no Codex handoff implementation; no runtime state read/write; no durable Perspective delta apply; no PerspectiveSnapshot runtime; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no DB write/query; no schema/migration; no route or UI; no provider/OpenAI call; no retrieval/RAG execution; no product write/product IDs; product-write remains parked by #686; ai_context_packet_contract_v0_1.
- AI Context Packet contract v0.1:
  `types/ai-context-packet-contract.ts`,
  `fixtures/research-candidate-review.ai-context-packet-contract.sample.v0.1.json`,
  and `scripts/smoke-ai-context-packet-contract-v0-1.mjs`
  (`npm run smoke:ai-context-packet-contract-v0-1`) define the future folded
  AI/Codex context packet grammar only. This is contract-only, fixture-only,
  smoke-only.

  AI Context Packet is context, not execution authority. The packet is folded,
  derived, advisory-only. The packet is not source of truth, not
  proof/evidence, not durable Perspective state, not work status, and not
  product write. `source_refs` are required. Unresolved tensions are preserved.
  Knowledge gaps are preserved. Candidate/durable distinction is preserved.
  `authority_boundary` is required. `forbidden_actions` required.
  `stop_conditions` required. Final critical facts are review cues, not
  authority. `target_agent_mode` is scope, not authority. Codex handoff draft is
  not execution approval. GitHub/Codex automation cannot execute from this
  packet. Expected files are hints only, not write authority. Expected checks
  are validation hints only, not execution authority. Perspective Geometry
  Digest remains interpretation, not truth.

  This contract has no runtime packet build, no AI context packet write, no
  Codex handoff implementation, no Codex execution, no GitHub automation, no
  external handoff sending, no agent routing/execution, no provider/OpenAI call,
  no retrieval/RAG execution, no DB write/query, no durable memory write, no
  perspective promotion, no proof/evidence write, no accepted evidence write,
  no Formation Receipt write, no work mutation, no schema/migration, no route
  or UI, no browser request, and no product write/product IDs. Product-write
  remains parked by #686. The next recommended slice is
  `ai_context_packet_implementation_v0_1`.

  Boundary phrases: AI Context Packet contract v0.1; contract-only, fixture-only, smoke-only; defines future folded AI/Codex context packet grammar; AI Context Packet is context, not execution authority; packet is folded, derived, advisory-only; packet is not source of truth; packet is not proof/evidence; packet is not durable Perspective state; packet is not work status; packet is not product write; source_refs required; unresolved tensions preserved; knowledge gaps preserved; candidate/durable distinction preserved; authority_boundary required; forbidden_actions required; stop_conditions required; final critical facts are review cues, not authority; target_agent_mode is scope, not authority; Codex handoff draft is not execution approval; GitHub/Codex automation cannot execute from this packet; expected files are hints only, not write authority; expected checks are validation hints only, not execution authority; Perspective Geometry Digest remains interpretation, not truth; no runtime packet build; no AI context packet write; no Codex handoff implementation; no Codex execution; no GitHub automation; no external handoff sending; no agent routing/execution; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no durable memory write; no perspective promotion; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no schema/migration; no route or UI; no browser request; no product write/product IDs; product-write remains parked by #686; ai_context_packet_implementation_v0_1.
- AI Context Packet implementation v0.1:
  `lib/research-candidate-review/ai-context-packet.ts`,
  `fixtures/research-candidate-review.ai-context-packet-implementation.sample.v0.1.json`,
  and `scripts/smoke-ai-context-packet-implementation-v0-1.mjs`
  (`npm run smoke:ai-context-packet-implementation-v0-1`) add a deterministic
  fixture-backed implementation only. The helper validates and materializes the
  #742 AI Context Packet preview bundle without adding runtime packet build or
  execution behavior.

  AI Context Packet is context, not execution authority. The packet is folded,
  derived, advisory-only. The packet is not source of truth, not
  proof/evidence, not durable Perspective state, not work status, and not
  product write. `source_refs` are required. Unresolved tensions are preserved.
  Knowledge gaps are preserved. Candidate/durable distinction is preserved.
  `authority_boundary` is required. `forbidden_actions` required.
  `stop_conditions` required. Final critical facts are review cues, not
  authority. `target_agent_mode` is scope, not authority. Codex handoff draft is
  not execution approval. GitHub/Codex automation cannot execute from packet.
  Expected files are hints only, not write authority. Expected checks are
  validation hints only, not execution authority. Perspective Geometry Digest
  remains interpretation, not truth.

  This implementation has no runtime packet build, no AI context packet write,
  no Codex handoff implementation, no Codex execution, no GitHub automation, no
  external handoff sending, no agent routing/execution, no provider/OpenAI call,
  no retrieval/RAG execution, no DB write/query, no durable memory write, no
  perspective promotion, no proof/evidence write, no accepted evidence write,
  no Formation Receipt write, no work mutation, no schema/migration, no route
  or UI, no browser request, and no product write/product IDs. Product-write
  remains parked by #686. The next recommended slice is
  `ai_context_packet_browser_validation_v0_1`.

  Boundary phrases: AI Context Packet implementation v0.1; deterministic fixture-backed implementation only; validates and materializes #742 AI Context Packet preview bundle; AI Context Packet is context, not execution authority; packet is folded, derived, advisory-only; packet is not source of truth; packet is not proof/evidence; packet is not durable Perspective state; packet is not work status; packet is not product write; source_refs required; unresolved tensions preserved; knowledge gaps preserved; candidate/durable distinction preserved; authority_boundary required; forbidden_actions required; stop_conditions required; final critical facts are review cues, not authority; target_agent_mode is scope, not authority; Codex handoff draft is not execution approval; GitHub/Codex automation cannot execute from packet; expected files are hints only, not write authority; expected checks are validation hints only, not execution authority; Perspective Geometry Digest remains interpretation, not truth; no runtime packet build; no AI context packet write; no Codex handoff implementation; no Codex execution; no GitHub automation; no external handoff sending; no agent routing/execution; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no durable memory write; no perspective promotion; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no schema/migration; no route or UI; no browser request; no product write/product IDs; product-write remains parked by #686; ai_context_packet_browser_validation_v0_1.
- AI Context Packet browser validation v0.1:
  `fixtures/research-candidate-review.ai-context-packet-browser-validation.sample.v0.1.json`
  and `scripts/smoke-ai-context-packet-browser-validation-v0-1.mjs`
  (`npm run smoke:ai-context-packet-browser-validation-v0-1`) validate the
  deterministic fixture-backed implementation from #743. This validates the
  #742 contract boundary and #743 top-level implementation boundary separation,
  validates the built AI Context Packet preview bundle, validates packet
  principle summary, validates target agent mode summary, validates packet
  section family summary, validates forbidden actions summary, validates
  reference summary, validates invalid packet preview override rejection,
  validates invalid target agent mode override rejection, validates invalid
  packet section override rejection, validates invalid forbidden actions
  override rejection, validates invalid authority boundary override rejection,
  and validates invalid refs override rejection.

  AI Context Packet is context, not execution authority. The packet is folded,
  derived, advisory-only. The packet is not source of truth, not
  proof/evidence, not durable Perspective state, not work status, and not
  product write. `source_refs` are required. Unresolved tensions are preserved.
  Knowledge gaps are preserved. Candidate/durable distinction is preserved.
  `authority_boundary` is required. `forbidden_actions` required.
  `stop_conditions` required. Final critical facts are review cues, not
  authority. `target_agent_mode` is scope, not authority. Codex handoff draft is
  not execution approval. GitHub/Codex automation cannot execute from packet.
  Expected files are hints only, not write authority. Expected checks are
  validation hints only, not execution authority. Perspective Geometry Digest
  remains interpretation, not truth.

  This browser validation has no runtime packet build, no AI context packet
  write, no Codex handoff implementation, no Codex execution, no GitHub
  automation, no external handoff sending, no agent routing/execution, no
  provider/OpenAI call, no retrieval/RAG execution, no DB write/query, no
  durable memory write, no perspective promotion, no proof/evidence write, no
  accepted evidence write, no Formation Receipt write, no work mutation, no
  schema/migration, no route or UI, no browser request, and no product
  write/product IDs. Product-write remains parked by #686. The next
  recommended slice is `codex_handoff_draft_contract_v0_1`.

  Boundary phrases: AI Context Packet browser validation v0.1; validates deterministic fixture-backed implementation from #743; validates #742 contract boundary and #743 top-level implementation boundary separation; validates built AI Context Packet preview bundle; validates packet principle summary; validates target agent mode summary; validates packet section family summary; validates forbidden actions summary; validates reference summary; validates invalid packet preview override rejection; validates invalid target agent mode override rejection; validates invalid packet section override rejection; validates invalid forbidden actions override rejection; validates invalid authority boundary override rejection; validates invalid refs override rejection; AI Context Packet is context, not execution authority; packet is folded, derived, advisory-only; packet is not source of truth; packet is not proof/evidence; packet is not durable Perspective state; packet is not work status; packet is not product write; source_refs required; unresolved tensions preserved; knowledge gaps preserved; candidate/durable distinction preserved; authority_boundary required; forbidden_actions required; stop_conditions required; final critical facts are review cues, not authority; target_agent_mode is scope, not authority; Codex handoff draft is not execution approval; GitHub/Codex automation cannot execute from packet; expected files are hints only, not write authority; expected checks are validation hints only, not execution authority; Perspective Geometry Digest remains interpretation, not truth; no runtime packet build; no AI context packet write; no Codex handoff implementation; no Codex execution; no GitHub automation; no external handoff sending; no agent routing/execution; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no durable memory write; no perspective promotion; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no schema/migration; no route or UI; no browser request; no product write/product IDs; product-write remains parked by #686; codex_handoff_draft_contract_v0_1.
- Codex Handoff Draft contract v0.1:
  `types/codex-handoff-draft-contract.ts`,
  `fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json`,
  and `scripts/smoke-codex-handoff-draft-contract-v0-1.mjs`
  (`npm run smoke:codex-handoff-draft-contract-v0-1`) define the future Codex
  handoff draft grammar only. This is contract-only, fixture-only, smoke-only.

  Codex Handoff Draft is draft, not execution approval. The draft is
  operator-reviewed context, not automation authority. The draft is not Codex
  execution, not GitHub automation, not branch creation authority, not commit
  authority, not PR creation authority, not external handoff sending
  authority, not source of truth, not proof/evidence, not durable Perspective
  state, not work status, and not product write. `source_refs` required.
  `authority_boundary` required. `forbidden_actions` required.
  `stop_conditions` required. Expected files are hints only, not write
  authority. Expected checks are validation hints only, not execution authority.
  `branch_name` is a suggestion only, not git authority. PR title/body are
  suggestions only, not GitHub authority. `final_report_template` is not
  completion proof. AI Context Packet remains context, not execution authority.
  Perspective Geometry Digest remains interpretation, not truth. Unresolved
  tensions and knowledge gaps preserved. Candidate/durable distinction
  preserved.

  This contract has no runtime handoff draft build, no Codex handoff draft
  write, no Codex execution, no GitHub automation, no GitHub PR creation, no
  git branch/commit creation, no external handoff sending, no agent
  routing/execution, no provider/OpenAI call, no retrieval/RAG execution, no DB
  write/query, no durable memory write, no perspective promotion, no
  proof/evidence write, no accepted evidence write, no Formation Receipt write,
  no work mutation, no schema/migration, no route or UI, no browser request,
  and no product write/product IDs. Product-write remains parked by #686. The
  next recommended slice is `codex_handoff_draft_implementation_v0_1`.

  Boundary phrases: Codex Handoff Draft contract v0.1; contract-only, fixture-only, smoke-only; defines future Codex handoff draft grammar; Codex Handoff Draft is draft, not execution approval; draft is operator-reviewed context, not automation authority; draft is not Codex execution; draft is not GitHub automation; draft is not branch creation authority; draft is not commit authority; draft is not PR creation authority; draft is not external handoff sending authority; draft is not source of truth; draft is not proof/evidence; draft is not durable Perspective state; draft is not work status; draft is not product write; source_refs required; authority_boundary required; forbidden_actions required; stop_conditions required; expected_files are hints only, not write authority; expected_checks are validation hints only, not execution authority; branch_name is a suggestion only, not git authority; PR title/body are suggestions only, not GitHub authority; final_report_template is not completion proof; AI Context Packet remains context, not execution authority; Perspective Geometry Digest remains interpretation, not truth; unresolved tensions and knowledge gaps preserved; candidate/durable distinction preserved; no runtime handoff draft build; no Codex handoff draft write; no Codex execution; no GitHub automation; no GitHub PR creation; no git branch/commit creation; no external handoff sending; no agent routing/execution; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no durable memory write; no perspective promotion; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no schema/migration; no route or UI; no browser request; no product write/product IDs; product-write remains parked by #686; codex_handoff_draft_implementation_v0_1.
- Codex Handoff Draft implementation v0.1:
  `lib/research-candidate-review/codex-handoff-draft.ts`,
  `fixtures/research-candidate-review.codex-handoff-draft-implementation.sample.v0.1.json`,
  and `scripts/smoke-codex-handoff-draft-implementation-v0-1.mjs`
  (`npm run smoke:codex-handoff-draft-implementation-v0-1`) add a
  deterministic fixture-backed implementation only. It validates and
  materializes #745 Codex Handoff Draft preview bundle output without runtime
  authority.

  Codex Handoff Draft is draft, not execution approval. The draft is
  operator-reviewed context, not automation authority. The draft is not Codex
  execution, not GitHub automation, not branch creation authority, not commit
  authority, not PR creation authority, not external handoff sending
  authority, not source of truth, not proof/evidence, not durable Perspective
  state, not work status, and not product write. `source_refs` required.
  `authority_boundary` required. `forbidden_actions` required.
  `stop_conditions` required. Expected files are hints only, not write
  authority. Expected checks are validation hints only, not execution authority.
  `branch_name` is a suggestion only, not git authority. PR title/body are
  suggestions only, not GitHub authority. `final_report_template` is not
  completion proof. AI Context Packet remains context, not execution authority.
  Perspective Geometry Digest remains interpretation, not truth. Unresolved
  tensions and knowledge gaps preserved. Candidate/durable distinction
  preserved.

  This implementation has no runtime handoff draft build, no Codex handoff
  draft write, no Codex execution, no GitHub automation, no GitHub PR creation,
  no git branch/commit creation, no external handoff sending, no agent
  routing/execution, no provider/OpenAI call, no retrieval/RAG execution, no DB
  write/query, no durable memory write, no perspective promotion, no
  proof/evidence write, no accepted evidence write, no Formation Receipt write,
  no work mutation, no schema/migration, no route or UI, no browser request,
  and no product write/product IDs. Product-write remains parked by #686. The
  next recommended slice is `codex_handoff_draft_browser_validation_v0_1`.

  Boundary phrases: Codex Handoff Draft implementation v0.1; deterministic fixture-backed implementation only; validates and materializes #745 Codex Handoff Draft preview bundle; Codex Handoff Draft is draft, not execution approval; draft is operator-reviewed context, not automation authority; draft is not Codex execution; draft is not GitHub automation; draft is not branch creation authority; draft is not commit authority; draft is not PR creation authority; draft is not external handoff sending authority; draft is not source of truth; draft is not proof/evidence; draft is not durable Perspective state; draft is not work status; draft is not product write; source_refs required; authority_boundary required; forbidden_actions required; stop_conditions required; expected_files are hints only, not write authority; expected_checks are validation hints only, not execution authority; branch_name is a suggestion only, not git authority; PR title/body are suggestions only, not GitHub authority; final_report_template is not completion proof; AI Context Packet remains context, not execution authority; Perspective Geometry Digest remains interpretation, not truth; unresolved tensions and knowledge gaps preserved; candidate/durable distinction preserved; no runtime handoff draft build; no Codex handoff draft write; no Codex execution; no GitHub automation; no GitHub PR creation; no git branch/commit creation; no external handoff sending; no agent routing/execution; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no durable memory write; no perspective promotion; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no schema/migration; no route or UI; no browser request; no product write/product IDs; product-write remains parked by #686; codex_handoff_draft_browser_validation_v0_1.
- Codex Handoff Draft browser validation v0.1:
  `fixtures/research-candidate-review.codex-handoff-draft-browser-validation.sample.v0.1.json`
  and `scripts/smoke-codex-handoff-draft-browser-validation-v0-1.mjs`
  (`npm run smoke:codex-handoff-draft-browser-validation-v0-1`) validate the
  deterministic fixture-backed implementation from #746. This validates the
  #745 contract boundary and #746 top-level implementation boundary separation,
  validates the built Codex Handoff Draft preview bundle, validates draft
  principle summary, validates draft section family summary, validates
  forbidden actions summary, validates reference summary, validates invalid
  draft preview override rejection, validates invalid draft section override
  rejection, validates invalid forbidden actions override rejection, validates
  invalid authority boundary override rejection, and validates invalid refs
  override rejection.

  Codex Handoff Draft is draft, not execution approval. The draft is
  operator-reviewed context, not automation authority. The draft is not Codex
  execution, not GitHub automation, not branch creation authority, not commit
  authority, not PR creation authority, not external handoff sending
  authority, not source of truth, not proof/evidence, not durable Perspective
  state, not work status, and not product write. `source_refs` required.
  `authority_boundary` required. `forbidden_actions` required.
  `stop_conditions` required. Expected files are hints only, not write
  authority. Expected checks are validation hints only, not execution authority.
  `branch_name` is a suggestion only, not git authority. PR title/body are
  suggestions only, not GitHub authority. `final_report_template` is not
  completion proof. AI Context Packet remains context, not execution authority.
  Perspective Geometry Digest remains interpretation, not truth. Unresolved
  tensions and knowledge gaps preserved. Candidate/durable distinction
  preserved.

  This browser validation has no runtime handoff draft build, no Codex handoff
  draft write, no Codex execution, no GitHub automation, no GitHub PR creation,
  no git branch/commit creation, no external handoff sending, no agent
  routing/execution, no provider/OpenAI call, no retrieval/RAG execution, no DB
  write/query, no durable memory write, no perspective promotion, no
  proof/evidence write, no accepted evidence write, no Formation Receipt write,
  no work mutation, no schema/migration, no route or UI, no browser request,
  and no product write/product IDs. Product-write remains parked by #686. The
  next recommended slice is
  `perspective_packet_receipt_linkage_contract_v0_1`.

  Boundary phrases: Codex Handoff Draft browser validation v0.1; validates deterministic fixture-backed implementation from #746; validates #745 contract boundary and #746 top-level implementation boundary separation; validates built Codex Handoff Draft preview bundle; validates draft principle summary; validates draft section family summary; validates forbidden actions summary; validates reference summary; validates invalid draft preview override rejection; validates invalid draft section override rejection; validates invalid forbidden actions override rejection; validates invalid authority boundary override rejection; validates invalid refs override rejection; Codex Handoff Draft is draft, not execution approval; draft is operator-reviewed context, not automation authority; draft is not Codex execution; draft is not GitHub automation; draft is not branch creation authority; draft is not commit authority; draft is not PR creation authority; draft is not external handoff sending authority; draft is not source of truth; draft is not proof/evidence; draft is not durable Perspective state; draft is not work status; draft is not product write; source_refs required; authority_boundary required; forbidden_actions required; stop_conditions required; expected_files are hints only, not write authority; expected_checks are validation hints only, not execution authority; branch_name is a suggestion only, not git authority; PR title/body are suggestions only, not GitHub authority; final_report_template is not completion proof; AI Context Packet remains context, not execution authority; Perspective Geometry Digest remains interpretation, not truth; unresolved tensions and knowledge gaps preserved; candidate/durable distinction preserved; no runtime handoff draft build; no Codex handoff draft write; no Codex execution; no GitHub automation; no GitHub PR creation; no git branch/commit creation; no external handoff sending; no agent routing/execution; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no durable memory write; no perspective promotion; no proof/evidence write; no accepted evidence write; no Formation Receipt write; no work mutation; no schema/migration; no route or UI; no browser request; no product write/product IDs; product-write remains parked by #686; perspective_packet_receipt_linkage_contract_v0_1.
- Perspective Packet Receipt Linkage contract v0.1:
  `types/perspective-packet-receipt-linkage-contract.ts`,
  `fixtures/research-candidate-review.perspective-packet-receipt-linkage-contract.sample.v0.1.json`,
  and `scripts/smoke-perspective-packet-receipt-linkage-contract-v0-1.mjs`
  (`npm run smoke:perspective-packet-receipt-linkage-contract-v0-1`) define a
  contract-only, fixture-only, smoke-only future provenance linkage grammar
  connecting AI Context Packet, Codex Handoff Draft, Geometry Digest,
  candidates, `source_refs`, `stop_conditions`, and future Formation Receipt
  refs.

  Linkage is provenance, not execution authority. Linkage is derived,
  public-safe, advisory-only. Linkage is not source of truth, not
  proof/evidence, not completion proof, not durable Perspective state, not work
  status, and not product write. Linkage does not prove Codex ran, does not
  prove PR created, does not prove validation passed, and does not create
  Formation Receipt now. Future Formation Receipt ref only. Future
  decision/handoff ref only. Selected candidates remain candidates. Omitted
  candidates remain visible and omission is not rejection. Deferred candidates
  remain visible and deferral is not rejection. Unresolved tensions preserved.
  Knowledge gaps preserved. Candidate/durable distinction preserved. AI Context
  Packet remains context, not execution authority. Codex Handoff Draft remains
  draft, not execution approval. Perspective Geometry Digest remains
  interpretation, not truth. `expected_files` are hints only, not write
  authority. `expected_checks` are validation hints only, not execution
  authority. `final_report_template` is not completion proof.

  This contract has no runtime linkage build, no linkage record write, no
  durable audit log write, no Formation Receipt write, no Codex execution, no
  GitHub automation, no GitHub PR creation, no git branch/commit creation, no
  external handoff sending, no agent routing/execution, no provider/OpenAI
  call, no retrieval/RAG execution, no DB write/query, no durable memory write,
  no perspective promotion, no proof/evidence write, no accepted evidence
  write, no work mutation, no schema/migration, no route or UI, no browser
  request, and no product write/product IDs. Product-write remains parked by
  #686. The next recommended slice is
  `perspective_packet_receipt_linkage_implementation_v0_1`.

  Boundary phrases: Perspective Packet Receipt Linkage contract v0.1; contract-only, fixture-only, smoke-only; defines future provenance linkage grammar connecting AI Context Packet, Codex Handoff Draft, Geometry Digest, candidates, source_refs, stop_conditions, and future Formation Receipt refs; linkage is provenance, not execution authority; linkage is derived, public-safe, advisory-only; linkage is not source of truth; linkage is not proof/evidence; linkage is not completion proof; linkage is not durable Perspective state; linkage is not work status; linkage is not product write; linkage does not prove Codex ran; linkage does not prove PR created; linkage does not prove validation passed; linkage does not create Formation Receipt now; future Formation Receipt ref only; future decision/handoff ref only; selected candidates remain candidates; omitted candidates remain visible and omission is not rejection; deferred candidates remain visible and deferral is not rejection; unresolved tensions preserved; knowledge gaps preserved; candidate/durable distinction preserved; AI Context Packet remains context, not execution authority; Codex Handoff Draft remains draft, not execution approval; Perspective Geometry Digest remains interpretation, not truth; expected_files are hints only, not write authority; expected_checks are validation hints only, not execution authority; final_report_template is not completion proof; no runtime linkage build; no linkage record write; no durable audit log write; no Formation Receipt write; no Codex execution; no GitHub automation; no GitHub PR creation; no git branch/commit creation; no external handoff sending; no agent routing/execution; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no durable memory write; no perspective promotion; no proof/evidence write; no accepted evidence write; no work mutation; no schema/migration; no route or UI; no browser request; no product write/product IDs; product-write remains parked by #686; perspective_packet_receipt_linkage_implementation_v0_1.
- Perspective Packet Receipt Linkage implementation v0.1:
  `lib/research-candidate-review/perspective-packet-receipt-linkage.ts`,
  `fixtures/research-candidate-review.perspective-packet-receipt-linkage-implementation.sample.v0.1.json`,
  and `scripts/smoke-perspective-packet-receipt-linkage-implementation-v0-1.mjs`
  (`npm run smoke:perspective-packet-receipt-linkage-implementation-v0-1`)
  define a deterministic fixture-backed implementation only. It validates and
  materializes #748 Perspective Packet Receipt Linkage preview bundle output.

  Linkage is provenance, not execution authority. Linkage is derived,
  public-safe, advisory-only. Linkage is not source of truth, not
  proof/evidence, not completion proof, not durable Perspective state, not work
  status, and not product write. Linkage does not prove Codex ran, does not
  prove PR created, does not prove validation passed, and does not create
  Formation Receipt now. Future Formation Receipt ref only. Future
  decision/handoff ref only. Selected candidates remain candidates. Omitted
  candidates remain visible and omission is not rejection. Deferred candidates
  remain visible and deferral is not rejection. Unresolved tensions preserved.
  Knowledge gaps preserved. Candidate/durable distinction preserved. AI Context
  Packet remains context, not execution authority. Codex Handoff Draft remains
  draft, not execution approval. Perspective Geometry Digest remains
  interpretation, not truth. `expected_files` are hints only, not write
  authority. `expected_checks` are validation hints only, not execution
  authority. `final_report_template` is not completion proof.

  This implementation has no runtime linkage build, no linkage record write, no
  durable audit log write, no Formation Receipt write, no Codex execution, no
  GitHub automation, no GitHub PR creation, no git branch/commit creation, no
  external handoff sending, no agent routing/execution, no provider/OpenAI
  call, no retrieval/RAG execution, no DB write/query, no durable memory write,
  no perspective promotion, no proof/evidence write, no accepted evidence
  write, no work mutation, no schema/migration, no route or UI, no browser
  request, and no product write/product IDs. Product-write remains parked by
  #686. The next recommended slice is
  `perspective_packet_receipt_linkage_browser_validation_v0_1`.

  Boundary phrases: Perspective Packet Receipt Linkage implementation v0.1; deterministic fixture-backed implementation only; validates and materializes #748 Perspective Packet Receipt Linkage preview bundle; linkage is provenance, not execution authority; linkage is derived, public-safe, advisory-only; linkage is not source of truth; linkage is not proof/evidence; linkage is not completion proof; linkage is not durable Perspective state; linkage is not work status; linkage is not product write; linkage does not prove Codex ran; linkage does not prove PR created; linkage does not prove validation passed; linkage does not create Formation Receipt now; future Formation Receipt ref only; future decision/handoff ref only; selected candidates remain candidates; omitted candidates remain visible and omission is not rejection; deferred candidates remain visible and deferral is not rejection; unresolved tensions preserved; knowledge gaps preserved; candidate/durable distinction preserved; AI Context Packet remains context, not execution authority; Codex Handoff Draft remains draft, not execution approval; Perspective Geometry Digest remains interpretation, not truth; expected_files are hints only, not write authority; expected_checks are validation hints only, not execution authority; final_report_template is not completion proof; no runtime linkage build; no linkage record write; no durable audit log write; no Formation Receipt write; no Codex execution; no GitHub automation; no GitHub PR creation; no git branch/commit creation; no external handoff sending; no agent routing/execution; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no durable memory write; no perspective promotion; no proof/evidence write; no accepted evidence write; no work mutation; no schema/migration; no route or UI; no browser request; no product write/product IDs; product-write remains parked by #686; perspective_packet_receipt_linkage_browser_validation_v0_1.
- Perspective Packet Receipt Linkage browser validation v0.1:
  `fixtures/research-candidate-review.perspective-packet-receipt-linkage-browser-validation.sample.v0.1.json`
  and
  `scripts/smoke-perspective-packet-receipt-linkage-browser-validation-v0-1.mjs`
  (`npm run smoke:perspective-packet-receipt-linkage-browser-validation-v0-1`)
  validate the deterministic fixture-backed implementation from #749.

  This validates #748 contract boundary and #749 top-level implementation
  boundary separation. It validates built Perspective Packet Receipt Linkage
  preview bundle output, validates linkage principle summary, validates linkage
  section family summary, validates forbidden actions summary, validates
  reference summary, validates invalid linkage preview override rejection,
  validates invalid linkage section override rejection, validates invalid
  forbidden actions override rejection, validates invalid authority boundary
  override rejection, and validates invalid refs override rejection.

  Linkage is provenance, not execution authority. Linkage is derived,
  public-safe, advisory-only. Linkage is not source of truth, not
  proof/evidence, not completion proof, not durable Perspective state, not work
  status, and not product write. Linkage does not prove Codex ran, does not
  prove PR created, does not prove validation passed, and does not create
  Formation Receipt now. Future Formation Receipt ref only. Future
  decision/handoff ref only. Selected candidates remain candidates. Omitted
  candidates remain visible and omission is not rejection. Deferred candidates
  remain visible and deferral is not rejection. Unresolved tensions preserved.
  Knowledge gaps preserved. Candidate/durable distinction preserved. AI Context
  Packet remains context, not execution authority. Codex Handoff Draft remains
  draft, not execution approval. Perspective Geometry Digest remains
  interpretation, not truth. `expected_files` are hints only, not write
  authority. `expected_checks` are validation hints only, not execution
  authority. `final_report_template` is not completion proof.

  This validation has no runtime linkage build, no linkage record write, no
  durable audit log write, no Formation Receipt write, no Codex execution, no
  GitHub automation, no GitHub PR creation, no git branch/commit creation, no
  external handoff sending, no agent routing/execution, no provider/OpenAI
  call, no retrieval/RAG execution, no DB write/query, no durable memory write,
  no perspective promotion, no proof/evidence write, no accepted evidence
  write, no work mutation, no schema/migration, no route or UI, no browser
  request, and no product write/product IDs. Product-write remains parked by
  #686. The next recommended slice is
  `agent_perspective_substrate_feedback_loop_contract_v0_1`.

  Boundary phrases: Perspective Packet Receipt Linkage browser validation v0.1; validates deterministic fixture-backed implementation from #749; validates #748 contract boundary and #749 top-level implementation boundary separation; validates built Perspective Packet Receipt Linkage preview bundle; validates linkage principle summary; validates linkage section family summary; validates forbidden actions summary; validates reference summary; validates invalid linkage preview override rejection; validates invalid linkage section override rejection; validates invalid forbidden actions override rejection; validates invalid authority boundary override rejection; validates invalid refs override rejection; linkage is provenance, not execution authority; linkage is derived, public-safe, advisory-only; linkage is not source of truth; linkage is not proof/evidence; linkage is not completion proof; linkage is not durable Perspective state; linkage is not work status; linkage is not product write; linkage does not prove Codex ran; linkage does not prove PR created; linkage does not prove validation passed; linkage does not create Formation Receipt now; future Formation Receipt ref only; future decision/handoff ref only; selected candidates remain candidates; omitted candidates remain visible and omission is not rejection; deferred candidates remain visible and deferral is not rejection; unresolved tensions preserved; knowledge gaps preserved; candidate/durable distinction preserved; AI Context Packet remains context, not execution authority; Codex Handoff Draft remains draft, not execution approval; Perspective Geometry Digest remains interpretation, not truth; expected_files are hints only, not write authority; expected_checks are validation hints only, not execution authority; final_report_template is not completion proof; no runtime linkage build; no linkage record write; no durable audit log write; no Formation Receipt write; no Codex execution; no GitHub automation; no GitHub PR creation; no git branch/commit creation; no external handoff sending; no agent routing/execution; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no durable memory write; no perspective promotion; no proof/evidence write; no accepted evidence write; no work mutation; no schema/migration; no route or UI; no browser request; no product write/product IDs; product-write remains parked by #686; agent_perspective_substrate_feedback_loop_contract_v0_1.
- Agent Perspective Substrate Feedback Loop contract v0.1:
  `types/agent-perspective-substrate-feedback-loop-contract.ts`,
  `fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json`,
  and `scripts/smoke-agent-perspective-substrate-feedback-loop-contract-v0-1.mjs`
  (`npm run smoke:agent-perspective-substrate-feedback-loop-contract-v0-1`)
  are contract-only, fixture-only, smoke-only. This defines future feedback
  grammar for operator responses to Agent Substrate surfaced
  warnings/suggestions/context packets/digests/linkages/handoff drafts.

  Feedback is operator signal, not truth. Feedback is advisory input, not
  execution authority. Feedback is not proof/evidence, not durable Perspective
  state, not work status, and not product write. Feedback does not
  automatically promote candidates and does not automatically suppress or
  delete candidates. Dismiss is not deletion. Pin is not promotion.
  `mark_useful` is not truth. `mark_wrong` is not proof of falsity.
  `needs_more_evidence` is review cue, not retrieval execution.
  `scope_overreach` is constraint signal, not state mutation.
  `not_relevant_now` is temporal context, not rejection. User correction does
  not mutate Core state now. `source_refs` required for grounded targets.
  Target refs public-safe. Target kind preserves candidate/durable distinction.
  Unresolved tensions preserved. Knowledge gaps preserved. Future surfacing
  effect preview is display-priority only. Rule failure candidate preview is
  candidate-only. Follow-up candidate preview is candidate-only, not work item
  or retrieval execution.

  This contract has no runtime feedback loop build, no feedback event write, no
  feedback event mutation, no Agent Substrate mutation/execution, no salience
  write, no durable salience write, no recent rehearsal buffer write, no
  durable memory write, no linkage record write, no Formation Receipt write, no
  Codex/GitHub automation, no agent routing/execution, no provider/OpenAI
  call, no retrieval/RAG execution, no DB write/query, no perspective
  promotion, no proof/evidence write, no accepted evidence write, no work
  mutation, no schema/migration, no route or UI, no browser request, and no
  product write/product IDs. Product-write remains parked by #686. The next
  recommended slice is
  `agent_perspective_substrate_feedback_loop_implementation_v0_1`.

  Boundary phrases: Agent Perspective Substrate Feedback Loop contract v0.1; contract-only, fixture-only, smoke-only; defines future feedback grammar for operator responses to Agent Substrate surfaced warnings/suggestions/context packets/digests/linkages/handoff drafts; feedback is operator signal, not truth; feedback is advisory input, not execution authority; feedback is not proof/evidence; feedback is not durable Perspective state; feedback is not work status; feedback is not product write; feedback does not automatically promote candidates; feedback does not automatically suppress or delete candidates; dismiss is not deletion; pin is not promotion; mark_useful is not truth; mark_wrong is not proof of falsity; needs_more_evidence is review cue, not retrieval execution; scope_overreach is constraint signal, not state mutation; not_relevant_now is temporal context, not rejection; user correction does not mutate Core state now; source_refs required for grounded targets; target refs public-safe; target kind preserves candidate/durable distinction; unresolved tensions preserved; knowledge gaps preserved; future surfacing effect preview is display-priority only; rule failure candidate preview is candidate-only; follow-up candidate preview is candidate-only, not work item or retrieval execution; no runtime feedback loop build; no feedback event write; no feedback event mutation; no Agent Substrate mutation/execution; no salience write; no durable salience write; no recent rehearsal buffer write; no durable memory write; no linkage record write; no Formation Receipt write; no Codex/GitHub automation; no agent routing/execution; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no perspective promotion; no proof/evidence write; no accepted evidence write; no work mutation; no schema/migration; no route or UI; no browser request; no product write/product IDs; product-write remains parked by #686; agent_perspective_substrate_feedback_loop_implementation_v0_1.
- Agent Perspective Substrate Feedback Loop implementation v0.1:
  `lib/research-candidate-review/agent-perspective-substrate-feedback-loop.ts`,
  `fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-implementation.sample.v0.1.json`,
  and `scripts/smoke-agent-perspective-substrate-feedback-loop-implementation-v0-1.mjs`
  (`npm run smoke:agent-perspective-substrate-feedback-loop-implementation-v0-1`)
  are deterministic fixture-backed implementation only. This validates and
  materializes #751 Agent Perspective Substrate Feedback Loop preview bundle.

  Feedback is operator signal, not truth. Feedback is advisory input, not
  execution authority. Feedback is not proof/evidence, not durable Perspective
  state, not work status, and not product write. Feedback does not
  automatically promote candidates and does not automatically suppress or
  delete candidates. Dismiss is not deletion. Pin is not promotion.
  `mark_useful` is not truth. `mark_wrong` is not proof of falsity.
  `needs_more_evidence` is review cue, not retrieval execution.
  `scope_overreach` is constraint signal, not state mutation.
  `not_relevant_now` is temporal context, not rejection. User correction does
  not mutate Core state now. `source_refs` required for grounded targets.
  Target refs public-safe. Target kind preserves candidate/durable distinction.
  Unresolved tensions preserved. Knowledge gaps preserved. Future surfacing
  effect preview is display-priority only. Rule failure candidate preview is
  candidate-only. Follow-up candidate preview is candidate-only, not work item
  or retrieval execution.

  This implementation has no runtime feedback loop build, no feedback event
  write, no feedback event mutation, no Agent Substrate mutation/execution, no
  salience write, no durable salience write, no recent rehearsal buffer write,
  no durable memory write, no linkage record write, no Formation Receipt write,
  no Codex/GitHub automation, no agent routing/execution, no provider/OpenAI
  call, no retrieval/RAG execution, no DB write/query, no perspective
  promotion, no proof/evidence write, no accepted evidence write, no work
  mutation, no schema/migration, no route or UI, no browser request, and no
  product write/product IDs. Product-write remains parked by #686. The next
  recommended slice is
  `agent_perspective_substrate_feedback_loop_browser_validation_v0_1`.

  Boundary phrases: Agent Perspective Substrate Feedback Loop implementation v0.1; builder/fixture/smoke paths; deterministic fixture-backed implementation only; validates and materializes #751 Agent Perspective Substrate Feedback Loop preview bundle; feedback is operator signal, not truth; feedback is advisory input, not execution authority; feedback is not proof/evidence; feedback is not durable Perspective state; feedback is not work status; feedback is not product write; feedback does not automatically promote candidates; feedback does not automatically suppress or delete candidates; dismiss is not deletion; pin is not promotion; mark_useful is not truth; mark_wrong is not proof of falsity; needs_more_evidence is review cue, not retrieval execution; scope_overreach is constraint signal, not state mutation; not_relevant_now is temporal context, not rejection; user correction does not mutate Core state now; source_refs required for grounded targets; target refs public-safe; target kind preserves candidate/durable distinction; unresolved tensions preserved; knowledge gaps preserved; future surfacing effect preview is display-priority only; rule failure candidate preview is candidate-only; follow-up candidate preview is candidate-only, not work item or retrieval execution; no runtime feedback loop build; no feedback event write; no feedback event mutation; no Agent Substrate mutation/execution; no salience write; no durable salience write; no recent rehearsal buffer write; no durable memory write; no linkage record write; no Formation Receipt write; no Codex/GitHub automation; no agent routing/execution; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no perspective promotion; no proof/evidence write; no accepted evidence write; no work mutation; no schema/migration; no route or UI; no browser request; no product write/product IDs; product-write remains parked by #686; agent_perspective_substrate_feedback_loop_browser_validation_v0_1.
- Agent Perspective Substrate Feedback Loop browser validation v0.1:
  `fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-browser-validation.sample.v0.1.json`
  and `scripts/smoke-agent-perspective-substrate-feedback-loop-browser-validation-v0-1.mjs`
  (`npm run smoke:agent-perspective-substrate-feedback-loop-browser-validation-v0-1`)
  validate deterministic fixture-backed implementation from #752. This validates
  #751 contract boundary and #752 top-level implementation boundary separation,
  validates built Agent Perspective Substrate Feedback Loop preview bundle,
  validates feedback principle summary, validates feedback kind summary,
  validates feedback target kind summary, validates feedback section family
  summary, validates forbidden actions summary, validates reference summary,
  validates invalid feedback preview override rejection, validates invalid
  feedback kind override rejection, validates invalid feedback target override
  rejection, validates invalid feedback section override rejection, validates
  invalid forbidden actions override rejection, validates invalid authority
  boundary override rejection, and validates invalid refs override rejection.

  Feedback is operator signal, not truth. Feedback is advisory input, not
  execution authority. Feedback is not proof/evidence, not durable Perspective
  state, not work status, and not product write. Feedback does not
  automatically promote candidates and does not automatically suppress or
  delete candidates. Dismiss is not deletion. Pin is not promotion.
  `mark_useful` is not truth. `mark_wrong` is not proof of falsity.
  `needs_more_evidence` is review cue, not retrieval execution.
  `scope_overreach` is constraint signal, not state mutation.
  `not_relevant_now` is temporal context, not rejection. User correction does
  not mutate Core state now. `source_refs` required for grounded targets.
  Target refs public-safe. Target kind preserves candidate/durable distinction.
  Unresolved tensions preserved. Knowledge gaps preserved. Future surfacing
  effect preview is display-priority only. Rule failure candidate preview is
  candidate-only. Follow-up candidate preview is candidate-only, not work item
  or retrieval execution.

  This validation has no runtime feedback loop build, no feedback event write,
  no feedback event mutation, no Agent Substrate mutation/execution, no
  salience write, no durable salience write, no recent rehearsal buffer write,
  no durable memory write, no linkage record write, no Formation Receipt write,
  no Codex/GitHub automation, no agent routing/execution, no provider/OpenAI
  call, no retrieval/RAG execution, no DB write/query, no perspective
  promotion, no proof/evidence write, no accepted evidence write, no work
  mutation, no schema/migration, no route or UI, no browser request, and no
  product write/product IDs. Product-write remains parked by #686. The next
  recommended slice is
  `agent_perspective_substrate_feedback_loop_closeout_v0_1`.

	  Boundary phrases: Agent Perspective Substrate Feedback Loop browser validation v0.1; validation fixture/smoke paths; validates deterministic fixture-backed implementation from #752; validates #751 contract boundary and #752 top-level implementation boundary separation; validates built Agent Perspective Substrate Feedback Loop preview bundle; validates feedback principle summary; validates feedback kind summary; validates feedback target kind summary; validates feedback section family summary; validates forbidden actions summary; validates reference summary; validates invalid feedback preview override rejection; validates invalid feedback kind override rejection; validates invalid feedback target override rejection; validates invalid feedback section override rejection; validates invalid forbidden actions override rejection; validates invalid authority boundary override rejection; validates invalid refs override rejection; feedback is operator signal, not truth; feedback is advisory input, not execution authority; feedback is not proof/evidence; feedback is not durable Perspective state; feedback is not work status; feedback is not product write; feedback does not automatically promote candidates; feedback does not automatically suppress or delete candidates; dismiss is not deletion; pin is not promotion; mark_useful is not truth; mark_wrong is not proof of falsity; needs_more_evidence is review cue, not retrieval execution; scope_overreach is constraint signal, not state mutation; not_relevant_now is temporal context, not rejection; user correction does not mutate Core state now; source_refs required for grounded targets; target refs public-safe; target kind preserves candidate/durable distinction; unresolved tensions preserved; knowledge gaps preserved; future surfacing effect preview is display-priority only; rule failure candidate preview is candidate-only; follow-up candidate preview is candidate-only, not work item or retrieval execution; no runtime feedback loop build; no feedback event write; no feedback event mutation; no Agent Substrate mutation/execution; no salience write; no durable salience write; no recent rehearsal buffer write; no durable memory write; no linkage record write; no Formation Receipt write; no Codex/GitHub automation; no agent routing/execution; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no perspective promotion; no proof/evidence write; no accepted evidence write; no work mutation; no schema/migration; no route or UI; no browser request; no product write/product IDs; product-write remains parked by #686; agent_perspective_substrate_feedback_loop_closeout_v0_1.
- Agent Perspective Substrate Feedback Loop closeout v0.1:
  `fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-closeout.sample.v0.1.json`
  and `scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs`
  close the #751 contract, #752 implementation, and #753 browser validation rail.
  The contract -> implementation -> browser validation rail complete summary is
  closeout is summary only, not runtime. Feedback remains operator signal, not
  truth. Feedback remains advisory input, not execution authority. Dismiss is
  not deletion. Pin is not promotion. `mark_useful` is not truth. `mark_wrong`
  is not proof of falsity. `needs_more_evidence` is review cue, not retrieval
  execution. `scope_overreach` is constraint signal, not state mutation.

  This closeout has no runtime feedback loop build, no feedback event
  write/mutation/store, no Agent Substrate mutation/execution, no salience
  write, no durable salience write, no recent rehearsal buffer write, no durable
  memory write, no linkage record write, no Formation Receipt write, no
  provider/OpenAI call, no retrieval/RAG execution, no DB write/query, no
  perspective promotion, no proof/evidence write, no work mutation, no
  route/UI/schema/browser request, and no product write/product IDs.
  Product-write remains parked by #686. The next recommended slice is
  `dogfooding_research_to_perspective_ci_expansion_contract_v0_1`.

  Boundary phrases: Agent Perspective Substrate Feedback Loop closeout v0.1; fixture/smoke paths; contract -> implementation -> browser validation rail complete; closeout is summary only, not runtime; feedback remains operator signal, not truth; feedback remains advisory input, not execution authority; dismiss is not deletion; pin is not promotion; mark_useful is not truth; mark_wrong is not proof of falsity; needs_more_evidence is review cue, not retrieval execution; scope_overreach is constraint signal, not state mutation; no runtime feedback loop build; no feedback event write/mutation/store; no Agent Substrate mutation/execution; no salience write; no durable salience write; no recent rehearsal buffer write; no durable memory write; no linkage record write; no Formation Receipt write; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no perspective promotion; no proof/evidence write; no work mutation; no route/UI/schema/browser request; no product write/product IDs; product-write remains parked by #686; dogfooding_research_to_perspective_ci_expansion_contract_v0_1.
- Dogfooding Research-to-Perspective CI Expansion contract v0.1:
  `types/dogfooding-research-to-perspective-ci-expansion-contract.ts`,
  `fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json`,
  and
  `scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs`
  define the future dogfooding grammar for applying Research-to-Perspective
  rails to Augnes repo development. This is contract-only, fixture-only,
  smoke-only. It does not add GitHub Actions, change CI runtime, execute CI,
  or implement runtime dogfooding ingestion.

  Boundary phrases: Dogfooding Research-to-Perspective CI Expansion contract v0.1; contract-only, fixture-only, smoke-only; defines future dogfooding grammar for applying Research-to-Perspective rails to Augnes repo development; dogfooding record is candidate/review context, not source of truth; CI expansion contract is not runtime CI implementation; CI signal is validation signal, not proof/evidence; smoke pass is not truth; smoke fail is diagnostic signal, not automatic rejection; Codex result report is candidate input, not execution proof; PR body is operator report, not authority; merge status is repo event context, not product write; changed files are review cues, not proof of correctness; validation command list is review cue, not execution authority; warning is diagnostic, not failure unless policy says so; skipped checks must be explicit and justified; authority boundary regression is candidate alert, not automatic mutation; dogfooding candidate remains candidate until future gate; product decision can create perspective delta candidate later, not durable state now; no GitHub Actions addition; no CI runtime change; no CI execution; no runtime dogfooding ingestion; no dogfooding record write; no Codex execution; no GitHub automation; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no perspective promotion; no proof/evidence write; no work mutation; no route/UI/schema/browser request; no product write/product IDs; product-write remains parked by #686; dogfooding_research_to_perspective_ci_expansion_implementation_v0_1.
- Dogfooding Research-to-Perspective CI Expansion implementation v0.1:
  `lib/research-candidate-review/dogfooding-research-to-perspective-ci-expansion.ts`,
  `fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-implementation.sample.v0.1.json`,
  and
  `scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs`
  define the deterministic fixture-backed implementation only. It validates and
  materializes #755 Dogfooding Research-to-Perspective CI Expansion preview
  bundle outputs from public-safe fixture input. It does not add GitHub Actions,
  change CI runtime, execute CI, or implement runtime dogfooding ingestion.

  Boundary phrases: Dogfooding Research-to-Perspective CI Expansion implementation v0.1; deterministic fixture-backed implementation only; validates and materializes #755 Dogfooding Research-to-Perspective CI Expansion preview bundle; dogfooding record is candidate/review context, not source of truth; CI signal is validation signal, not proof/evidence; smoke pass is not truth; smoke fail is diagnostic signal, not automatic rejection; Codex result report is candidate input, not execution proof; PR body is operator report, not authority; changed files are review cues, not proof of correctness; validation command list is review cue, not execution authority; warning is diagnostic, not failure unless policy says so; skipped checks must be explicit and justified; authority boundary regression is candidate alert, not automatic mutation; dogfooding candidate remains candidate until future gate; product decision can create perspective delta candidate later, not durable state now; no GitHub Actions addition; no CI runtime change; no CI execution; no runtime dogfooding ingestion; no dogfooding record write; no Codex execution; no GitHub automation; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no perspective promotion; no proof/evidence write; no work mutation; no route/UI/schema/browser request; no product write/product IDs; product-write remains parked by #686; dogfooding_research_to_perspective_ci_expansion_browser_validation_v0_1.
- Dogfooding Research-to-Perspective CI Expansion browser validation v0.1:
  `fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-browser-validation.sample.v0.1.json`
  and
  `scripts/smoke-dogfooding-research-to-perspective-ci-expansion-browser-validation-v0-1.mjs`
  validate deterministic fixture-backed implementation from #756. The validation
  checks the #755 contract boundary and #756 top-level implementation boundary
  separation, validates the built Dogfooding Research-to-Perspective CI
  Expansion preview bundle, validates dogfooding principle summary, validates
  dogfooding section family summary, validates forbidden actions summary,
  validates reference summary, validates invalid dogfooding preview override
  rejection, validates invalid dogfooding section override rejection, validates
  invalid forbidden actions override rejection, validates invalid authority
  boundary override rejection, and validates invalid refs override rejection.

  Boundary phrases: Dogfooding Research-to-Perspective CI Expansion browser validation v0.1; validates deterministic fixture-backed implementation from #756; validates #755 contract boundary and #756 top-level implementation boundary separation; validates built Dogfooding Research-to-Perspective CI Expansion preview bundle; validates dogfooding principle summary; validates dogfooding section family summary; validates forbidden actions summary; validates reference summary; validates invalid dogfooding preview override rejection; validates invalid dogfooding section override rejection; validates invalid forbidden actions override rejection; validates invalid authority boundary override rejection; validates invalid refs override rejection; dogfooding record is candidate/review context, not source of truth; CI signal is validation signal, not proof/evidence; smoke pass is not truth; smoke fail is diagnostic signal, not automatic rejection; Codex result report is candidate input, not execution proof; PR body is operator report, not authority; changed files are review cues, not proof of correctness; validation command list is review cue, not execution authority; warning is diagnostic, not failure unless policy says so; skipped checks must be explicit and justified; authority boundary regression is candidate alert, not automatic mutation; dogfooding candidate remains candidate until future gate; product decision can create perspective delta candidate later, not durable state now; no GitHub Actions addition; no CI runtime change; no CI execution; no runtime dogfooding ingestion; no dogfooding record write; no Codex execution; no GitHub automation; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no perspective promotion; no proof/evidence write; no work mutation; no route/UI/schema/browser request; no product write/product IDs; product-write remains parked by #686; dogfooding_research_to_perspective_ci_expansion_closeout_v0_1.
- Dogfooding Research-to-Perspective CI Expansion closeout v0.1:
  `fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-closeout.sample.v0.1.json`
  and
  `scripts/smoke-dogfooding-research-to-perspective-ci-expansion-closeout-v0-1.mjs`
  summarize the completed contract -> implementation -> browser validation rail.
  The closeout is summary only, not runtime, and confirms the Dogfooding
  Research-to-Perspective CI Expansion contract, implementation, and browser
  validation slices are complete without adding product behavior.

  Boundary phrases: Dogfooding Research-to-Perspective CI Expansion closeout v0.1; contract -> implementation -> browser validation rail complete; closeout is summary only, not runtime; dogfooding record remains candidate/review context, not source of truth; CI signal remains validation signal, not proof/evidence; smoke pass remains not truth; smoke fail remains diagnostic, not automatic rejection; Codex result report remains candidate input, not execution proof; PR body remains operator report, not authority; changed files remain review cues, not proof of correctness; validation commands remain review cues, not execution authority; warnings remain diagnostic, not failure unless policy says so; skipped checks must remain explicit and justified; authority boundary regression remains candidate alert, not automatic mutation; no GitHub Actions addition; no CI runtime change; no CI execution; no runtime dogfooding ingestion; no dogfooding record write; no Codex execution; no GitHub automation; no provider/OpenAI call; no retrieval/RAG execution; no DB write/query; no perspective promotion; no proof/evidence write; no work mutation; no route/UI/schema/browser request; no product write/product IDs; product-write remains parked by #686; research_to_perspective_foundation_milestone_closeout_v0_1.
- Research-to-Perspective Foundation Milestone closeout v0.1:
  `fixtures/research-candidate-review.research-to-perspective-foundation-milestone-closeout.sample.v0.1.json`
  and
  `scripts/smoke-research-to-perspective-foundation-milestone-closeout-v0-1.mjs`
  summarize the completed Research-to-Perspective Foundation scaffold. The
  foundation scaffold complete through Dogfooding Research-to-Perspective CI
  Expansion closeout, and this closeout is summary only, not runtime.

  Boundary phrases: Research-to-Perspective Foundation Milestone closeout v0.1; foundation scaffold complete through Dogfooding Research-to-Perspective CI Expansion closeout; closeout is summary only, not runtime; candidate remains candidate; evidence candidate is not proof/evidence record; perspective delta candidate is not durable state; retrieval/RAG remains recall, not authority; provider/OpenAI output remains non-authoritative; Agent Substrate remains folded, derived, advisory-only; AI Context Packet remains context, not execution authority; Codex Handoff Draft remains draft, not execution approval; Packet Receipt Linkage remains provenance, not completion proof; Dogfooding record remains candidate/review context, not truth; CI signal remains validation signal, not proof/evidence; smoke pass remains not truth; smoke fail remains diagnostic, not automatic rejection; no runtime persistence opened; no provider runtime opened; no retrieval/RAG runtime opened; no product write/product IDs; product-write remains parked by #686; foundation_status_review_and_next_runtime_slice_selection_v0_1.
- Research-to-Perspective Fixture Smoke Legacy Audit v0.1:
  `docs/RESEARCH_TO_PERSPECTIVE_FIXTURE_SMOKE_LEGACY_AUDIT_V0_1.md`,
  `fixtures/research-candidate-review.fixture-smoke-legacy-audit.sample.v0.1.json`,
  and
  `scripts/smoke-research-to-perspective-fixture-smoke-legacy-audit-v0-1.mjs`
  (`npm run smoke:research-to-perspective-fixture-smoke-legacy-audit-v0-1`)
  classify active foundation, active runtime, closeout, historical,
  warning-debt, disabled-adapter, temp DB harness, and parked product-write
  validation artifacts after #759 without deleting active validation coverage.
  Product-write remains parked by #686. This audit adds no runtime persistence,
  provider/OpenAI calls, retrieval/RAG, Perspective promotion, proof/evidence
  writes, product write, product DB writes, GitHub Actions, or CI runtime
  changes.

  Boundary phrases: Research-to-Perspective Fixture Smoke Legacy Audit v0.1; no runtime persistence, provider/OpenAI calls, retrieval/RAG, Perspective promotion, proof/evidence writes, product write, product DB writes, GitHub Actions, or CI runtime changes; explicit non-deletion policy; next recommended slice parked_lane_registry_and_smoke_catalog_plan_v0_1.
- Research-to-Perspective Foundation Status Review v0.1:
  `docs/RESEARCH_TO_PERSPECTIVE_FOUNDATION_STATUS_REVIEW_V0_1.md`,
  `fixtures/research-candidate-review.foundation-status-review.sample.v0.1.json`,
  and
  `scripts/smoke-research-to-perspective-foundation-status-review-v0-1.mjs`
  (`npm run smoke:research-to-perspective-foundation-status-review-v0-1`)
  classify the current Research-to-Perspective foundation after #759 and #760
  and select `research_candidate_lifecycle_read_model_v0_1` as the next
  runtime/read-model slice. This pointer is bounded documentation metadata, not
  SSOT, not runtime behavior, and not implementation of the selected next
  slice. Product-write remains parked by #686.

  Boundary phrases: Research-to-Perspective Foundation Status Review v0.1; classification and next-slice selection only; selected next slice is not implemented here; Foundation Status Dashboard is deferred; Durable Candidate Review Memory is deferred; Bounded Source Intake, Provider Extraction, Retrieval/RAG, Human-reviewed Promotion, Durable State Apply, Git Ledger, and Product Write are deferred; no runtime persistence, provider/OpenAI calls, source fetch, retrieval/RAG execution, DB query/write, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex/GitHub automation inside Augnes runtime, GitHub Actions, CI runtime change, Git Ledger export, product write, or product ID allocation; smoke pass is validation signal, not proof/evidence; PR body is an operator report, not authority; CI signal is validation signal, not proof/evidence; product-write remains parked by #686.
- Research Candidate Lifecycle Read Model v0.1:
  `docs/RESEARCH_CANDIDATE_LIFECYCLE_READ_MODEL_V0_1.md`,
  `types/research-candidate-lifecycle.ts`,
  `lib/research-candidate-review/lifecycle-read-model.ts`,
  `fixtures/research-candidate-review.lifecycle.sample.v0.1.json`,
  and `scripts/smoke-research-candidate-lifecycle-read-model-v0-1.mjs`
  (`npm run smoke:research-candidate-lifecycle-read-model-v0-1`) implement the
  selected next runtime/read-model slice from the Foundation Status Review as a
  derived read model only. It combines caller-provided candidate, feedback,
  packet, handoff, tension, gap, and source coverage inputs into deterministic
  lifecycle summaries and review queues. This pointer is repo-local
  documentation metadata, not SSOT, and adds no runtime route, UI, DB query or
  write, provider/OpenAI call, source fetch, retrieval/RAG execution,
  Perspective promotion, durable Perspective state write, proof/evidence write,
  work mutation, Git Ledger export, product write, or product ID allocation.
  Product-write remains parked by #686.

  Boundary phrases: Research Candidate Lifecycle Read Model v0.1; candidate lifecycle is a derived read model only; feedback is operator signal, not truth; dismissed is not rejected; pinned is not promoted; invalidated is not proof; ready for review is not promotion; next_review_action is a review cue, not execution authority; no runtime route, UI, DB query/write, provider/OpenAI call, source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Calibration Diagnostic, Logical Claim Shape Preview, Feedback-to-Rule Candidate Contract, Cockpit lifecycle preview read-only UI, and Research Candidate Review Memory contract.
- Research Candidate Calibration Diagnostic v0.1:
  `docs/RESEARCH_CANDIDATE_CALIBRATION_DIAGNOSTIC_V0_1.md`,
  `types/research-candidate-calibration-diagnostic.ts`,
  `lib/research-candidate-review/calibration-diagnostic.ts`,
  `fixtures/research-candidate-review.calibration-diagnostic.sample.v0.1.json`,
  and `scripts/smoke-research-candidate-calibration-diagnostic-v0-1.mjs`
  (`npm run smoke:research-candidate-calibration-diagnostic-v0-1`) implement
  Phase 1.2 after the Lifecycle Read Model, following the integrated roadmap
  guide v0.2 as diagnostic-only. It derives readiness labels, reason codes,
  risk flags, and diagnostic queues from caller-provided candidate, lifecycle,
  feedback, source, evidence, tension, and gap inputs. This pointer is
  repo-local documentation metadata, not SSOT, and adds no runtime route, UI,
  DB query or write, provider/OpenAI call, source fetch, retrieval/RAG
  execution, Perspective promotion, durable Perspective state write,
  proof/evidence write, work mutation, Git Ledger export, product write, or
  product ID allocation. It does not implement empirical calibration,
  promotion, proof/evidence, provider, retrieval, Git Ledger, or product write.
  Product-write remains parked by #686.

  Boundary phrases: Research Candidate Calibration Diagnostic v0.1; calibration diagnostic is diagnostic-only; follows the integrated roadmap guide v0.2 after the Lifecycle Read Model; confidence is not truth; readiness is not promotion; ready means ready for review, not ready to promote; feedback is operator signal, not truth; diagnostic_summary is explanation, not authority; older proposal documents are background inputs already integrated into the roadmap guide; no empirical calibration model, runtime route, UI, DB query/write, provider/OpenAI call, source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Logical Claim Shape Preview, Feedback-to-Rule Candidate Contract, temporal handoff diagnostics, Cockpit lifecycle/calibration preview read-only UI, Research Candidate Review Memory contract, and Empirical Calibration Dataset plan.
- Research Candidate Logical Claim Shape Preview v0.1:
  `docs/RESEARCH_CANDIDATE_LOGICAL_CLAIM_SHAPE_V0_1.md`,
  `types/research-candidate-logical-claim-shape.ts`,
  `lib/research-candidate-review/logical-claim-shape.ts`,
  `fixtures/research-candidate-review.logical-claim-shape.sample.v0.1.json`,
  and `scripts/smoke-research-candidate-logical-claim-shape-v0-1.mjs`
  (`npm run smoke:research-candidate-logical-claim-shape-v0-1`) implement
  Phase 1.3 after Calibration Diagnostic, following the integrated roadmap
  guide v0.2 as structure-preview-only. It derives premise, conclusion,
  missing-assumption, counterclaim, contradiction, tension, gap, and review cue
  structure from caller-provided claim, evidence, tension, gap, and calibration
  inputs. This pointer is repo-local documentation metadata, not SSOT, and adds
  no runtime route, UI, DB query or write, provider/OpenAI call, source fetch,
  retrieval/RAG execution, proof/evidence write, Perspective promotion, durable
  Perspective state write, work mutation, theorem proving, formal verification,
  Git Ledger export, product write, or product ID allocation. It does not
  implement proof, theorem proving, formal verification, empirical calibration,
  promotion, proof/evidence, provider, retrieval, Git Ledger, or product write.
  Product-write remains parked by #686.

  Boundary phrases: Research Candidate Logical Claim Shape Preview v0.1; logical claim shape preview is structure-preview-only; follows the integrated roadmap guide v0.2 after Calibration Diagnostic; calibration diagnostic is input signal, not truth; missing premise is a review cue, not rejection; contradiction is preserved as tension, not deletion; logical status is not proof status; review cues are not execution authority; shape summary is explanation, not authority; older proposal documents are background inputs already integrated into the roadmap guide; no proof checking, theorem proving, formal verification, runtime route, UI, DB query/write, provider/OpenAI call, source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Feedback-to-Rule Candidate Contract, temporal handoff diagnostics, Cockpit lifecycle/calibration/logical preview read-only UI, Research Candidate Review Memory contract, and Empirical Calibration Dataset plan.
- Feedback-to-Rule Candidate Contract v0.1:
  `docs/FEEDBACK_TO_RULE_CANDIDATE_CONTRACT_V0_1.md`,
  `types/feedback-to-rule-candidate.ts`,
  `fixtures/research-candidate-review.feedback-to-rule-candidate-contract.sample.v0.1.json`,
  and `scripts/smoke-feedback-to-rule-candidate-contract-v0-1.mjs`
  (`npm run smoke:feedback-to-rule-candidate-contract-v0-1`) define Phase
  1.4 after Logical Claim Shape Preview, following the integrated roadmap guide
  v0.2 as candidate-contract-only. It defines candidate-only rule/update
  suggestion vocabulary from durable operator feedback signals. This pointer is
  repo-local documentation metadata, not SSOT, and adds no runtime route, UI,
  DB query or write, provider/OpenAI call, source fetch, retrieval/RAG
  execution, proof/evidence write, Perspective promotion, durable Perspective
  state write, work mutation, rule mutation, parser behavior change, builder
  behavior change, Codex execution, GitHub automation, Git Ledger export,
  product write, or product ID allocation. It does not implement rule mutation,
  builder behavior, parser behavior changes, proof/evidence, promotion,
  provider, retrieval, Codex execution, GitHub automation, Git Ledger, or
  product write. Product-write remains parked by #686.

  Boundary phrases: Feedback-to-Rule Candidate Contract v0.1; feedback-to-rule candidate is candidate-contract-only; follows the integrated roadmap guide v0.2 after Logical Claim Shape Preview; feedback is operator signal, not truth; rule candidate is not rule mutation; accepted_for_future_pr is not PR creation authority; proposed_rule_change is review text, not execution; secret-like operator notes must be blocked or redacted; older proposal documents are background inputs already integrated into the roadmap guide; no rule mutation, future PR creation from candidate, runtime route, UI, DB query/write, provider/OpenAI call, source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Feedback-to-Rule builder, temporal handoff diagnostics, Cockpit lifecycle/calibration/logical preview read-only UI, Research Candidate Review Memory contract, and Empirical Calibration Dataset plan.
- Feedback-to-Rule Candidate Builder v0.1:
  `docs/FEEDBACK_TO_RULE_CANDIDATE_BUILDER_V0_1.md`,
  `types/feedback-to-rule-candidate.ts`,
  `lib/research-candidate-review/feedback-to-rule-candidate.ts`,
  `fixtures/research-candidate-review.feedback-to-rule-candidate-builder.sample.v0.1.json`,
  and `scripts/smoke-feedback-to-rule-candidate-builder-v0-1.mjs`
  (`npm run smoke:feedback-to-rule-candidate-builder-v0-1`) implement the
  builder follow-up after the Feedback-to-Rule Candidate Contract, following
  the integrated roadmap guide v0.2 as candidate-only deterministic builder.
  It groups caller-provided public-safe feedback events into candidate-only
  rule/update suggestions with deterministic redaction, repeated-pattern
  checks, reason codes, risk labels, review statuses, and a contract
  fingerprint. This pointer is repo-local documentation metadata, not SSOT,
  and adds no runtime route, UI, DB query or write, provider/OpenAI call,
  source fetch, retrieval/RAG execution, proof/evidence write, Perspective
  promotion, durable Perspective state write, work mutation, rule mutation,
  parser behavior change, Codex execution, GitHub automation, Git Ledger
  export, product write, or product ID allocation. It does not implement rule
  mutation, parser behavior changes, proof/evidence, promotion, provider,
  retrieval, Codex execution, GitHub automation, Git Ledger, or product write.
  Product-write remains parked by #686.

  Boundary phrases: Feedback-to-Rule Candidate Builder v0.1; candidate-only deterministic builder; follows the integrated roadmap guide v0.2 after the Feedback-to-Rule Candidate Contract; feedback is operator signal, not truth; rule candidate is not rule mutation; accepted_for_future_pr is not PR creation authority; proposed_rule_change is review text, not execution; secret-like operator notes must be blocked or redacted; repeated_* patterns require at least two distinct feedback events; older proposal documents are background inputs already integrated into the roadmap guide; no rule mutation, future PR creation from candidate, runtime route, UI, DB query/write, provider/OpenAI call, source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are temporal handoff diagnostics, Cockpit lifecycle/calibration/logical preview read-only UI, Research Candidate Review Memory contract, Empirical Calibration Dataset plan, and Feedback Event Aggregation Runtime.
- Temporal Handoff Diagnostic Sections v0.1:
  `docs/TEMPORAL_HANDOFF_DIAGNOSTIC_SECTIONS_V0_1.md`,
  `types/temporal-handoff-diagnostic-sections.ts`,
  `lib/research-candidate-review/temporal-handoff-diagnostic-sections.ts`,
  `fixtures/research-candidate-review.temporal-handoff-diagnostic-sections.sample.v0.1.json`,
  and `scripts/smoke-temporal-handoff-diagnostic-sections-v0-1.mjs`
  (`npm run smoke:temporal-handoff-diagnostic-sections-v0-1`) implement the
  next roadmap slice after the Feedback-to-Rule Candidate Builder, following
  the integrated roadmap guide v0.2 as diagnostic-preview-only. It builds
  expected/observed delta, decision hold, not-done classification, source
  coverage, tension/gap, review cue, and authority boundary sections from
  caller-provided handoff preview inputs. This pointer is repo-local
  documentation metadata, not SSOT, and adds no runtime route, UI, DB query or
  write, provider/OpenAI call, source fetch, retrieval/RAG execution,
  proof/evidence write, Perspective promotion, durable Perspective state write,
  work mutation, Codex execution, GitHub automation, branch/PR creation, Git
  Ledger export, product write, or product ID allocation. It does not implement
  execution approval, Codex execution, GitHub automation, branch/PR creation,
  proof/evidence, promotion, provider, retrieval, Git Ledger, or product write.
  Product-write remains parked by #686.

  Boundary phrases: Temporal Handoff Diagnostic Sections v0.1; diagnostic-preview-only; follows the integrated roadmap guide v0.2 after Feedback-to-Rule Candidate Builder; Expected/Observed delta is diagnostic, not authority; Decision hold is review context, not rejection; Not-done classification is review context, not automatic failure; Source refs are coverage signals, not proof; older proposal documents are background inputs already integrated into the roadmap guide; no execution approval, Codex execution, GitHub automation, branch/PR creation, runtime route, UI, DB query/write, provider/OpenAI call, source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Cockpit lifecycle/calibration/logical preview read-only UI, Research Candidate Review Memory contract, Empirical Calibration Dataset plan, Feedback Event Aggregation Runtime, and Dogfooding Record Runtime Contract.
- Target-Agent AI Context Packet Profiles v0.1:
  `docs/TARGET_AGENT_AI_CONTEXT_PACKET_PROFILES_V0_1.md`,
  `types/target-agent-ai-context-packet-profiles.ts`,
  `lib/research-candidate-review/target-agent-ai-context-packet-profiles.ts`,
  `fixtures/research-candidate-review.target-agent-ai-context-packet-profiles.sample.v0.1.json`,
  and `scripts/smoke-target-agent-ai-context-packet-profiles-v0-1.mjs`
  (`npm run smoke:target-agent-ai-context-packet-profiles-v0-1`)
  implement Phase 1.6 from the integrated roadmap guide v0.2 as
  profile-preview-only. It builds target-specific advisory profile sections
  for human review, ChatGPT review, Codex handoff review, dogfooding review,
  and unknown targets from caller-provided lifecycle, calibration, logical
  shape, Feedback-to-Rule, and temporal handoff diagnostic inputs. This pointer
  is repo-local documentation metadata, not SSOT, and adds no runtime route,
  UI, DB query or write, provider/OpenAI call, source fetch, retrieval/RAG
  execution, prompt execution, proof/evidence write, Perspective promotion,
  durable Perspective state write, work mutation, Codex execution, GitHub
  automation, branch/PR creation, Git Ledger export, product write, or product
  ID allocation. It does not implement prompt execution, provider calls, Codex
  execution, GitHub automation, branch/PR creation, proof/evidence, promotion,
  retrieval, Git Ledger, or product write. Product-write remains parked by
  #686.

  Boundary phrases: Target-Agent AI Context Packet Profiles v0.1; Phase 1.6; profile-preview-only; follows the integrated roadmap guide v0.2; context packet profile is advisory, not source of truth; Codex handoff profile is not execution approval; calibration context is diagnostic, not readiness authority; logical shape context is structure-only, not proof; Feedback-to-Rule context is candidate-only, not rule mutation; temporal handoff context is diagnostic, not authority; older proposal documents are background inputs already integrated into the roadmap guide; no prompt execution, provider/OpenAI call, Codex execution, GitHub automation, branch/PR creation, runtime route, UI, DB query/write, source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Research Candidate Review Memory contract, Research Candidate Review Memory store, Research Candidate Review Memory routes, Research Candidate Review Memory UI, and Foundation/Lifecycle/Memory read-only UI.
- Research Candidate Review Memory Contract v0.1:
  `docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_CONTRACT_V0_1.md`,
  `types/research-candidate-review-memory-contract.ts`,
  `fixtures/research-candidate-review.memory-contract.sample.v0.1.json`,
  and `scripts/smoke-research-candidate-review-memory-contract-v0-1.mjs`
  (`npm run smoke:research-candidate-review-memory-contract-v0-1`) begins Phase 2 from the integrated roadmap guide v0.2 as contract-only. It defines
  future review memory record shapes, lifecycle states, decisions, privacy
  reports, source refs, discard/supersede semantics, and authority boundaries
  for bounded public-safe Research Candidate review memory. This pointer is
  repo-local documentation metadata, not SSOT, and adds no runtime route, UI,
  DB query or write, provider/OpenAI call, source fetch, retrieval/RAG
  execution, proof/evidence write, Perspective promotion, durable Perspective
  state write, work mutation, Codex execution, GitHub automation, Git Ledger
  export, product write, or product ID allocation. It does not implement runtime memory storage, DB query/write, routes, UI, provider calls, source
  fetch, retrieval, proof/evidence, promotion, GitHub automation, Git Ledger,
  or product write. Product-write remains parked by #686.

  Boundary phrases: Research Candidate Review Memory Contract v0.1; Phase 2; contract-only; follows the integrated roadmap guide v0.2; review memory is not truth; candidate memory is not Perspective state; discard is not deletion; supersede preserves lineage; blocked raw payloads must not be stored; source refs are lineage pointers, not proof; older proposal documents are background inputs already integrated into the roadmap guide; no runtime memory write, runtime route, UI, DB query/write, provider/OpenAI call, source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Research Candidate Review Memory store, Research Candidate Review Memory routes, Research Candidate Review Memory UI, Foundation/Lifecycle/Memory read-only UI, and Bounded Source Intake Runtime Contract.
- Research Candidate Review Memory Store v0.1:
  `docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_STORE_V0_1.md`,
  `types/research-candidate-review-memory-contract.ts`,
  `lib/research-candidate-review/review-memory-store.ts`,
  `fixtures/research-candidate-review.memory-store.sample.v0.1.json`,
  and `scripts/smoke-research-candidate-review-memory-store-v0-1.mjs`
  (`npm run smoke:research-candidate-review-memory-store-v0-1`) implements
  Phase 2.2 from the integrated roadmap guide v0.2 as local-store-only. It adds
  a deterministic caller-controlled local JSON store helper for validated
  Research Candidate Review Memory records, including snapshot validation,
  idempotent upsert, discard, supersede, deterministic fingerprinting, and
  caller-provided file read/write helpers. This pointer is repo-local
  documentation metadata, not SSOT, and adds no runtime route, UI, DB migration,
  provider/OpenAI call, source fetch, retrieval/RAG execution, proof/evidence
  write, Perspective promotion, durable Perspective state write, work mutation,
  Codex execution, GitHub automation, Git Ledger export, product write, or
  product ID allocation. It does not implement routes, UI, DB migrations,
  provider calls, source fetch, retrieval, proof/evidence, promotion, GitHub
  automation, Git Ledger, or product write. Product-write remains parked by
  #686.

  Boundary phrases: Research Candidate Review Memory Store v0.1; Phase 2.2; local-store-only; follows the integrated roadmap guide v0.2; follows the #769 Review Memory Contract; explicit caller-provided file write only; review memory is not truth; candidate memory is not Perspective state; discard is not deletion; supersede preserves lineage; source refs are lineage pointers, not proof; source refs must be public-safe symbolic refs; older proposal documents are background inputs already integrated into the roadmap guide; no runtime route, UI, DB migration, DB query/write, provider/OpenAI call, source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Research Candidate Review Memory routes, Research Candidate Review Memory UI, Foundation/Lifecycle/Memory read-only UI, Bounded Source Intake Runtime Contract, and Bounded Source Intake Runtime.
- Research Candidate Review Memory DB Store Runtime Completion v0.1:
  `docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md`,
  `lib/research-candidate-review/review-memory-db-store.ts`,
  `lib/db/schema.sql`,
  `fixtures/research-candidate-review.memory-db-store-runtime.sample.v0.1.json`,
  and `scripts/smoke-research-candidate-review-memory-db-store-runtime-v0-1.mjs`
  (`npm run smoke:research-candidate-review-memory-db-store-runtime-v0-1`)
  implement `research_candidate_review_memory_db_store_runtime_completion_v0_1`
  as a runtime completion for the original Phase 2.2 DB-backed review memory
  store requirements. It closes the gap left by the earlier local-store-only
  JSON helper implementation with caller-injected SQLite helpers, schema,
  public-safe fixture, temp DB smoke, and create/read/list/activity/discard/
  supersede behavior. This pointer is repo-local documentation metadata, not
  SSOT, and adds no routes or UI. Product-write remains parked by #686.

  Boundary phrases: Research Candidate Review Memory DB Store Runtime Completion v0.1; research_candidate_review_memory_db_store_runtime_completion_v0_1; original Phase 2.2 DB-backed store gap closed; caller-injected DB only; temp DB smoke only; DB writes allowed only for review memory records, candidate link rows, source link rows, and activity rows; local-store-only JSON helper remains valid but insufficient for the DB-backed acceptance criteria; review memory is not truth; review memory is not proof; review memory is not accepted evidence; review memory is not durable Perspective state; candidate refs are not facts; source refs are lineage pointers, not proof; discard is lifecycle transition, not delete; supersede preserves lineage; smoke/CI pass is not truth; roadmap guide is not SSOT; no routes, UI, provider/OpenAI call, prompt sent, source fetch, retrieval/RAG execution, proof/evidence write, claim/evidence write, Perspective promotion, durable Perspective state write/apply, Formation Receipt write, Git Ledger export runtime, Git/GitHub execution, Codex execution, file export/import, product write, product persistence, product runtime write, product-write authority, or product ID allocation; product-write remains parked by #686; follow-up route/UI completion should bind to this DB-backed store rather than only the JSON local-store helper.
- Research Candidate Review Memory DB Routes Runtime Completion v0.1:
  `docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md`,
  `lib/research-candidate-review/review-memory-db-route-contract.ts`,
  `app/api/research-candidate-review/review-records/route.ts`,
  `app/api/research-candidate-review/review-records/[review_record_id]/route.ts`,
  `app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts`,
  `app/api/research-candidate-review/review-records/[review_record_id]/discard/route.ts`,
  `fixtures/research-candidate-review.memory-db-routes-runtime.sample.v0.1.json`,
  and `scripts/smoke-research-candidate-review-memory-db-routes-runtime-v0-1.mjs`
  (`npm run smoke:research-candidate-review-memory-db-routes-runtime-v0-1`)
  implement `research_candidate_review_memory_db_routes_runtime_completion_v0_1`
  as a runtime completion for the original Phase 2.3 DB-backed review memory
  route requirements. It closes the gap left by the earlier route-boundary-only
  JSON local-store route with same-origin DB-backed create/list/detail/activity/
  discard routes over allowlisted local SQLite DB paths. GET routes do not
  create DB files or schema. POST routes may ensure schema and write only review
  memory records, activity rows, and discard lifecycle transitions. This pointer
  is repo-local documentation metadata, not SSOT, and adds no UI. Product-write
  remains parked by #686.

  Boundary phrases: Research Candidate Review Memory DB Routes Runtime Completion v0.1; research_candidate_review_memory_db_routes_runtime_completion_v0_1; original Phase 2.3 DB-backed route gap closed; earlier route-boundary-only JSON local-store route remains legacy/compatible but is not DB-backed route completion; same-origin required; allowlisted local SQLite DB path only; GET routes do not create DB files or schema; POST routes may ensure schema and write only review memory records, activity rows, and discard lifecycle transitions; DB-backed review memory routes now; review memory is not truth; review memory is not proof; review memory is not accepted evidence; review memory is not durable Perspective state; candidate refs are not facts; source refs are lineage pointers, not proof; discard is lifecycle transition, not delete; smoke/CI pass is not truth; roadmap guide is not SSOT; no UI, provider/OpenAI call, prompt sent, source fetch, retrieval/RAG execution, proof/evidence write, claim/evidence write, Perspective promotion, durable Perspective state write/apply, Formation Receipt write, Git Ledger export runtime, Git/GitHub execution, Codex execution, file export/import, product write, product persistence, product runtime write, product-write authority, or product ID allocation; product-write remains parked by #686; follow-up UI completion should bind to these DB-backed routes rather than only the JSON local-store helper.
- Research Candidate Review Memory Routes v0.1:
  `docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_ROUTES_V0_1.md`,
  `app/api/research-candidate/review-memory/route.ts`,
  `lib/research-candidate-review/review-memory-route-contract.ts`,
  `lib/research-candidate-review/review-memory-store.ts`,
  `fixtures/research-candidate-review.memory-routes.sample.v0.1.json`,
  and `scripts/smoke-research-candidate-review-memory-routes-v0-1.mjs`
  (`npm run smoke:research-candidate-review-memory-routes-v0-1`) implements
  Phase 2.3 from the integrated roadmap guide v0.2 as route-boundary-only. It
  adds same-origin route handlers and a route contract over the #770 local store
  helper for explicit create empty snapshot, upsert, discard, and supersede
  actions. This pointer is repo-local documentation metadata, not SSOT, and adds
  no UI, DB migration, DB query/write, provider/OpenAI call, source fetch,
  retrieval/RAG execution, proof/evidence write, Perspective promotion, durable
  Perspective state write, work mutation, Codex execution, GitHub automation,
  Git Ledger export, product write, or product ID allocation. It does not implement UI,
  DB migrations, provider calls, source fetch, retrieval,
  proof/evidence, promotion, GitHub automation, Git Ledger, or product write.
  Product-write remains parked by #686.

  Boundary phrases: Research Candidate Review Memory Routes v0.1; Phase 2.3; route-boundary-only; follows the integrated roadmap guide v0.2; follows the #769 Review Memory Contract and #770 Review Memory Store; same-origin required; local store helper only; review memory is not truth; candidate memory is not Perspective state; discard is not deletion; supersede preserves lineage; source refs are lineage pointers, not proof; source refs must be public-safe symbolic refs; older proposal documents are background inputs already integrated into the roadmap guide; no UI, DB migration, DB query/write, provider/OpenAI call, source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Research Candidate Review Memory UI, Foundation/Lifecycle/Memory read-only UI, Bounded Source Intake Runtime Contract, Bounded Source Intake Runtime, and Provider-Assisted Extraction candidate-only contract.
- Research Candidate Review Memory UI v0.1:
  `docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_UI_V0_1.md`,
  `app/research-candidate/review-memory/page.tsx`,
  `app/research-candidate/review-memory/review-memory-client.tsx`,
  `lib/research-candidate-review/review-memory-ui-contract.ts`,
  `fixtures/research-candidate-review.memory-ui.sample.v0.1.json`,
  `app/api/research-candidate/review-memory/route.ts`,
  and `scripts/smoke-research-candidate-review-memory-ui-v0-1.mjs`
  (`npm run smoke:research-candidate-review-memory-ui-v0-1`) implements Phase 2.4 from the integrated roadmap guide v0.2 as ui-route-client-only. It uses #771 routes for explicit load, create empty snapshot, upsert, discard, and supersede actions over review metadata. This pointer is repo-local documentation metadata, not SSOT, and does not implement new routes, DB migrations, DB query/write, provider calls, source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation. It adds no direct file writes from UI components and no direct store helper writes from UI components. Product-write remains parked by #686.

  Boundary phrases: Research Candidate Review Memory UI v0.1; Phase 2.4; ui-route-client-only; uses #771 routes; follows the integrated roadmap guide v0.2; follows the #769 Review Memory Contract, #770 Review Memory Store, and #771 Review Memory Routes; Review memory is not truth; Candidate memory is not Perspective state; Discard is not deletion; Supersede preserves lineage; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; Store paths remain constrained by the #771 route allowlist; UI actions are explicit operator actions, not automatic background writes; older proposal documents are background inputs already integrated into the roadmap guide; no new routes, DB migration, DB query/write, provider/OpenAI call, external source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Foundation/Lifecycle/Memory read-only UI, Bounded Source Intake Runtime Contract, Bounded Source Intake Runtime, Provider-Assisted Extraction candidate-only contract, and Provider-Assisted Extraction runtime.
- Research Candidate Review Memory DB UI Runtime Completion v0.1:
  `docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_UI_RUNTIME_COMPLETION_V0_1.md`,
  `fixtures/research-candidate-review.memory-db-ui-runtime.sample.v0.1.json`,
  `components/research-candidate-review-memory-db-panel.tsx`,
  `app/research-candidate/review-memory/page.tsx`,
  and `scripts/smoke-research-candidate-review-memory-db-ui-runtime-v0-1.mjs`
  (`npm run smoke:research-candidate-review-memory-db-ui-runtime-v0-1`)
  implements `research_candidate_review_memory_db_ui_runtime_completion_v0_1`
  as a runtime completion for the original Phase 2.4 DB-backed Review Memory UI
  requirements. It binds the operator UI to DB-backed same-origin routes under
  `/api/research-candidate-review/review-records` for save, list, detail,
  activity, and discard flows. The earlier JSON/local-store-backed UI remains
  legacy/compatible but is not the DB-backed UI completion. This pointer is
  repo-local documentation metadata, not SSOT, and adds no new app/api routes,
  DB schema/helper changes, provider calls, source fetch, retrieval/RAG
  execution, proof/evidence write, claim/evidence write, Perspective promotion,
  durable state write/apply, Formation Receipt write, Git Ledger export runtime,
  Git/GitHub execution inside Augnes runtime, Codex execution, file
  export/import, product write, product persistence, product runtime write,
  product-write authority, or product ID allocation. Product-write remains
  parked by #686.

  Boundary phrases: Research Candidate Review Memory DB UI Runtime Completion v0.1; research_candidate_review_memory_db_ui_runtime_completion_v0_1; original Phase 2.4 DB-backed UI gap closed; DB-backed same-origin routes are primary; all persistence goes through DB-backed review memory routes; UI does not directly write DB; UI does not directly write files; legacy JSON route is not primary persistence; explicit operator UI action only; review memory is not truth; review memory is not proof; review memory is not accepted evidence; review memory is not durable Perspective state; candidate refs are not facts; source refs are lineage pointers, not proof; discard is lifecycle transition, not delete; smoke/CI pass is not truth; roadmap guide is not SSOT; no provider/OpenAI call, prompt sent, source fetch, retrieval/RAG execution, proof/evidence write, claim/evidence write, work item write, Perspective promotion, durable Perspective state write/apply, Formation Receipt write, Git Ledger export runtime, Git/GitHub execution, Codex execution, file export/import, product write, product persistence, product runtime write, product-write authority, or product ID allocation; product-write remains parked by #686; follow-up foundation/lifecycle/review memory consolidated UI should use this DB-backed UI or route binding.
- Foundation/Lifecycle/Review Memory Read-only UI v0.1:
  `docs/FOUNDATION_LIFECYCLE_REVIEW_MEMORY_READONLY_UI_V0_1.md`,
  `app/research-candidate/foundation-lifecycle-review-memory/page.tsx`,
  `app/research-candidate/foundation-lifecycle-review-memory/foundation-lifecycle-review-memory-client.tsx`,
  `lib/research-candidate-review/foundation-lifecycle-review-memory-ui-contract.ts`,
  `fixtures/research-candidate-review.foundation-lifecycle-review-memory-readonly-ui.sample.v0.1.json`,
  `app/api/research-candidate/review-memory/route.ts`,
  and `scripts/smoke-foundation-lifecycle-review-memory-readonly-ui-v0-1.mjs`
  (`npm run smoke:foundation-lifecycle-review-memory-readonly-ui-v0-1`) follows the integrated roadmap guide v0.2 as readonly-ui-only. It displays bounded read-only foundation status, lifecycle, calibration, logical shape, feedback-to-rule, temporal handoff, target-agent profile, and review memory summaries, with optional GET-only use of the #771 route for loading review-memory snapshot rows. This pointer is repo-local documentation metadata, not SSOT, and does not implement new routes, POST, write actions, DB migrations, DB query/write, provider calls, source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Foundation/Lifecycle/Review Memory Read-only UI v0.1; readonly-ui-only; follows the integrated roadmap guide v0.2; follows #762 Lifecycle, #763 Calibration, #764 Logical Shape, #765/#766 Feedback-to-Rule, #767 Temporal Handoff, #768 Target-Agent Packet Profiles, #769 Contract, #770 Store, #771 Routes, and #772 Review Memory UI; Read-only UI; Review memory is not truth; Candidate memory is not Perspective state; Lifecycle status is derived review context, not source of truth; Calibration context is diagnostic, not readiness authority; Logical shape context is structure-only, not proof; Feedback-to-Rule context is candidate-only, not rule mutation; Temporal handoff context is diagnostic, not authority; Target-agent packet profile is advisory, not prompt execution; Discard is not deletion; Supersede preserves lineage; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; Store paths remain constrained by the #771 route allowlist; UI is read-only and does not perform automatic background writes; older proposal documents are background inputs already integrated into the roadmap guide; no new routes, POST, write actions, DB migration, DB query/write, provider/OpenAI call, external source fetch, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Bounded Source Intake Runtime Contract, Bounded Source Intake Runtime, Provider-Assisted Extraction candidate-only contract, Provider-Assisted Extraction runtime, and Retrieval/RAG Runtime Contract.
- Foundation/Lifecycle/Review Memory DB Readonly UI Completion v0.1:
  `docs/FOUNDATION_LIFECYCLE_REVIEW_MEMORY_DB_READONLY_UI_COMPLETION_V0_1.md`,
  `fixtures/foundation-lifecycle-review-memory.db-readonly-ui-completion.sample.v0.1.json`,
  `components/foundation-lifecycle-review-memory-db-readonly-panel.tsx`,
  `app/research-candidate/foundation-lifecycle-review-memory/page.tsx`,
  and `scripts/smoke-foundation-lifecycle-review-memory-db-readonly-ui-completion-v0-1.mjs`
  (`npm run smoke:foundation-lifecycle-review-memory-db-readonly-ui-completion-v0-1`)
  implements `foundation_lifecycle_review_memory_db_readonly_ui_completion_v0_1`
  as a runtime completion for original Phase 2.5 DB-backed read-only UI
  requirements. It binds review memory visibility to DB-backed same-origin GET
  routes under `/api/research-candidate-review/review-records` for list, detail,
  and activity history while rendering Foundation completion summary, rail
  status matrix, runtime readiness matrix, forbidden capability matrix,
  product-write parked status, next runtime slice pointer, lifecycle summary,
  operator decision queue, known warnings/skipped checks, and authority
  boundary. This pointer is repo-local documentation metadata, not SSOT, and
  adds no app/api routes, POST calls, review-memory writes, DB schema/helper
  changes, direct DB/file writes from UI, provider calls, prompt sending,
  source fetch, retrieval/RAG execution, proof/evidence write,
  claim/evidence write, work item write, Perspective promotion, durable state
  write/apply, Formation Receipt write, Git Ledger export runtime,
  Git/GitHub execution inside Augnes runtime, Codex execution, file
  export/import, product write, product persistence, product runtime write,
  product-write authority, or product ID allocation. Product-write remains
  parked by #686.

  Boundary phrases: Foundation/Lifecycle/Review Memory DB Readonly UI Completion v0.1; foundation_lifecycle_review_memory_db_readonly_ui_completion_v0_1; original Phase 2.5 DB-backed read-only UI gap closed; DB-backed same-origin GET routes are primary for review memory visibility; UI is read-only; no POST routes; no review memory create/update/discard/supersede; no direct DB access from UI; no direct file write from UI; legacy JSON route is not primary review memory source; foundation status is orientation, not runtime completion; lifecycle is next review cue, not execution authority; review memory is explicit user-action record, not truth/proof/accepted evidence/durable state; candidate refs are not facts; source refs are lineage pointers, not proof; smoke/CI pass is not truth; roadmap guide is not SSOT; no provider/OpenAI call, prompt sent, source fetch, retrieval/RAG execution, proof/evidence write, claim/evidence write, work item write, Perspective promotion, durable Perspective state write/apply, Formation Receipt write, Git Ledger export runtime, Git/GitHub execution, Codex execution, file export/import, product write, product persistence, product runtime write, product-write authority, or product ID allocation; product-write remains parked by #686.
- Bounded Source Intake Runtime Contract v0.1:
  `docs/BOUNDED_SOURCE_INTAKE_RUNTIME_CONTRACT_V0_1.md`,
  `types/bounded-source-intake-runtime-contract.ts`,
  `fixtures/bounded-source-intake-runtime-contract.sample.v0.1.json`,
  and `scripts/smoke-bounded-source-intake-runtime-contract-v0-1.mjs`
  (`npm run smoke:bounded-source-intake-runtime-contract-v0-1`) follows the integrated roadmap guide v0.2 as contract-only. It defines future source intake request, source descriptor, result envelope, privacy/redaction, source ref, and authority boundary shapes. This pointer is repo-local documentation metadata, not SSOT, and does not implement source intake runtime, source fetch, local file read, raw source storage, DB query/write, provider/OpenAI calls, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Bounded Source Intake Runtime Contract v0.1; contract-only; follows the integrated roadmap guide v0.2; follows #769 Review Memory Contract, #770 Review Memory Store, #771 Review Memory Routes, #772 Review Memory UI, and #773 Foundation/Lifecycle/Review Memory Read-only UI; Bounded Source Intake Runtime Contract is contract-only; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; A public URL ref is not fetched in this contract; A repository file ref is not read in this contract; An uploaded file ref is not read in this contract; Raw source bodies must not be stored; accepted_for_future_runtime is not runtime execution; older proposal documents are background inputs already integrated into the roadmap guide; no source fetch, local file read, raw source storage, DB query/write, provider/OpenAI call, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Bounded Source Intake Runtime, Provider-Assisted Extraction candidate-only contract, Provider-Assisted Extraction runtime, Retrieval/RAG Runtime Contract, and Retrieval/RAG Runtime.
- Bounded Source Intake Runtime v0.1:
  `docs/BOUNDED_SOURCE_INTAKE_RUNTIME_V0_1.md`,
  `lib/research-candidate-review/bounded-source-intake-runtime.ts`,
  `types/bounded-source-intake-runtime-contract.ts`,
  `fixtures/bounded-source-intake-runtime.sample.v0.1.json`,
  `scripts/smoke-bounded-source-intake-runtime-v0-1.mjs`,
  and `scripts/smoke-bounded-source-intake-runtime-contract-v0-1.mjs`
  (`npm run smoke:bounded-source-intake-runtime-v0-1`) follows the integrated roadmap guide v0.2 as bounded-runtime-only. It processes caller-provided descriptors and bounded summaries only, validates #774 source intake requests, and emits deterministic contract-shaped result envelopes and a runtime report. This pointer is repo-local documentation metadata, not SSOT, and does not imply source fetch, local file read, repository file read, uploaded file read, raw source storage, route, UI, provider/OpenAI calls, retrieval/RAG execution, DB query/write, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Bounded Source Intake Runtime v0.1; bounded-runtime-only; caller-provided input only; follows the integrated roadmap guide v0.2; runtime follow-up to #774; processes caller-provided descriptors and bounded summaries only; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; accepted_bounded_summary is not truth; accepted_bounded_summary is not proof/evidence; candidate_only is not runtime execution approval; A public URL ref is not fetched by this runtime; A repository file ref is not read by this runtime; An uploaded file ref is not read by this runtime; Raw source bodies must not be stored; older proposal documents are background inputs already integrated into the roadmap guide; no source fetch, local file read, repository file read, uploaded file read, raw source storage, route, UI, DB query/write, provider/OpenAI call, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Provider-Assisted Extraction candidate-only contract, Provider-Assisted Extraction runtime, Retrieval/RAG Runtime Contract, Retrieval/RAG Runtime, and Dogfooding Ingestion Route Contract.
- Bounded Source Intake Runtime Completion v0.1:
  `docs/BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_V0_1.md`,
  `lib/research-source/intake-runtime.ts`,
  `lib/research-source/sanitize-source-ref.ts`,
  `lib/research-source/fetch-bounded-source.ts`,
  `app/api/research-source/intake/route.ts`,
  `fixtures/bounded-source-intake-runtime-completion.sample.v0.1.json`,
  and `scripts/smoke-bounded-source-intake-runtime-completion-v0-1.mjs`
  (`npm run smoke:bounded-source-intake-runtime-completion-v0-1`) follows the integrated roadmap guide v0.2.1 FULL as the runtime completion for original Phase 3.2 bounded source intake requirements. It closes the gap left by the earlier bounded-runtime-only deterministic envelope helper by adding explicit same-origin POST runtime, bounded source intake helpers, source locator sanitization, bounded fetch abstraction, public-safe fixture, smoke, docs, package script, and this latest-index pointer. It supports user-provided URL/manual_text_summary/file_ref/note_ref inputs with strict limits and symbolic-only file/note ref behavior. Smoke uses mock fetch and requires no live network. Raw source body is non-persistent by default. Failed fetch creates gap metadata, not hallucinated summary. Product-write remains parked by #686.

  Boundary phrases: Bounded Source Intake Runtime Completion v0.1; bounded_source_intake_runtime_completion_v0_1; original Phase 3.2 bounded source intake runtime gap closed; earlier bounded-runtime-only deterministic envelope helper remains compatible but was not full runtime completion; explicit same-origin POST runtime only; user_provided sources only; bounded fetch abstraction now; mock fetch in smoke; live fetch does not follow redirects automatically; missing content type fails closed; content-length is checked before body read; stream byte limits stop oversized bodies; source ref metadata now; raw body non-persistent by default; source refs are lineage pointers, not proof; bounded source summary is not truth; failure gap is not fact; failed fetch creates gap metadata, not hallucinated summary; no automatic crawling, background fetch, automatic web discovery, provider extraction, retrieval index write, proof/evidence write, claim/evidence write, Perspective promotion, durable Perspective state write/apply, Formation Receipt write, Git Ledger export runtime, Git/GitHub execution, Codex execution, raw source body persistence, raw private payload persistence, raw provider output storage, raw retrieval output storage, product write, product persistence, product runtime write, product-write authority, or product ID allocation; smoke/CI pass is not truth; roadmap guide is not SSOT; product-write remains parked by #686.
- Provider-Assisted Extraction Candidate-Only Contract v0.1:
  `docs/PROVIDER_ASSISTED_EXTRACTION_CANDIDATE_ONLY_CONTRACT_V0_1.md`,
  `types/provider-assisted-extraction-candidate-only-contract.ts`,
  `fixtures/provider-assisted-extraction-candidate-only-contract.sample.v0.1.json`,
  and `scripts/smoke-provider-assisted-extraction-candidate-only-contract-v0-1.mjs`
  (`npm run smoke:provider-assisted-extraction-candidate-only-contract-v0-1`) follows the integrated roadmap guide v0.2 as candidate-contract-only and follows #774 and #775. It defines future provider-assisted extraction request, prompt descriptor, candidate output, privacy/redaction, bounded input lineage, and authority boundary shapes. This pointer is repo-local documentation metadata, not SSOT, and does not implement prompt sending, provider calls, provider output storage, source fetch, local/repository/uploaded file reads, raw source storage, route, UI, retrieval, DB query/write, proof/evidence, claim/evidence writes, promotion, GitHub automation, Git Ledger, or product write. Product-write remains parked by #686.

  Boundary phrases: Provider-Assisted Extraction Candidate-Only Contract v0.1; candidate-contract-only; follows the integrated roadmap guide v0.2; follows #774 and #775; Provider-Assisted Extraction Candidate-Only Contract is candidate-contract-only; Candidate output is not truth; Candidate output is not proof/evidence; accepted_for_future_provider_run is not provider execution; accepted_for_future_runtime is not runtime execution; bounded prompt summary is not prompt execution; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; Bounded summary refs are lineage metadata, not proof; Raw provider outputs must not be stored; older proposal documents are background inputs already integrated into the roadmap guide; no provider/OpenAI call, prompt sent, provider output stored, source fetch, local file read, repository file read, uploaded file read, raw source storage, route, UI, retrieval/RAG execution, DB query/write, proof/evidence write, claim/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Provider-Assisted Extraction Runtime, Retrieval/RAG Runtime Contract, Retrieval/RAG Runtime, Dogfooding Ingestion Route Contract, and Dogfooding Ingestion Route.
- Provider-Assisted Extraction Runtime v0.1:
  `docs/PROVIDER_ASSISTED_EXTRACTION_RUNTIME_V0_1.md`,
  `lib/research-candidate-review/provider-assisted-extraction-runtime.ts`,
  `types/provider-assisted-extraction-candidate-only-contract.ts`,
  `fixtures/provider-assisted-extraction-runtime.sample.v0.1.json`,
  and `scripts/smoke-provider-assisted-extraction-runtime-v0-1.mjs`
  (`npm run smoke:provider-assisted-extraction-runtime-v0-1`) follows the integrated roadmap guide v0.2 as bounded-runtime-only, follows #776, and processes caller-provided candidate previews only. It validates #776 candidate requests and emits deterministic candidate outputs, runtime decisions, counts, validation notes, and a report fingerprint from bounded public-safe inputs. This pointer is repo-local documentation metadata, not SSOT, and does not imply provider calls, prompt sending, provider output storage, source fetch, local/repository/uploaded file reads, raw source storage, route, UI, retrieval, DB query/write, proof/evidence, claim/evidence writes, promotion, GitHub automation, Git Ledger, or product write. Product-write remains parked by #686.

  Boundary phrases: Provider-Assisted Extraction Runtime v0.1; bounded-runtime-only; caller-provided input only; follows the integrated roadmap guide v0.2; runtime follow-up to #776; processes caller-provided candidate previews only; Candidate output is not truth; Candidate output is not proof/evidence; accepted_for_future_provider_run is not provider execution; accepted_for_future_runtime is not runtime execution; bounded prompt summary is not prompt execution; prompt descriptor is not prompt text; candidate preview is caller-provided bounded input, not provider output; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; Bounded summary refs are lineage metadata, not proof; Raw provider outputs must not be stored; older proposal documents are background inputs already integrated into the roadmap guide; no provider/OpenAI call, prompt sent, provider output stored, source fetch, local file read, repository file read, uploaded file read, raw source storage, route, UI, retrieval/RAG execution, DB query/write, proof/evidence write, claim/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Retrieval/RAG Runtime Contract, Retrieval/RAG Runtime, Dogfooding Ingestion Route Contract, Dogfooding Ingestion Route, and Provider Output Redaction Contract.
- Provider-Assisted Extraction Runtime Completion v0.1:
  `docs/PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_V0_1.md`,
  `lib/research-extraction/provider-extract-candidates.ts`,
  `lib/research-extraction/normalize-provider-output.ts`,
  `lib/research-extraction/provider-boundary.ts`,
  `app/api/research-candidate-review/provider-extraction/route.ts`,
  `fixtures/provider-assisted-extraction-runtime-completion.sample.v0.1.json`,
  and `scripts/smoke-provider-assisted-extraction-runtime-completion-v0-1.mjs`
  (`npm run smoke:provider-assisted-extraction-runtime-completion-v0-1`) follows the integrated roadmap guide v0.2.1 FULL as the runtime completion for original Phase 3.4 provider-assisted extraction requirements. It closes the gap left by the earlier deterministic/bounded provider runtime helper by adding explicit same-origin POST provider extraction runtime, provider adapter boundary, deterministic mock provider adapter, configured-provider missing-key refusal, output normalization, public-safe fixture, smoke, docs, package script, and this latest-index pointer. It supports explicit operator-triggered provider extraction over bounded source refs/excerpts and produces normalized candidate-only bundles. Provider output is not truth/proof/evidence, and provider confidence is not promotion readiness. Product-write remains parked by #686.

  Boundary phrases: Provider-Assisted Extraction Runtime Completion v0.1; provider_assisted_extraction_runtime_completion_v0_1; original Phase 3.4 provider-assisted extraction runtime gap closed; earlier deterministic/bounded provider runtime helper remains compatible but was not full runtime completion; explicit same-origin POST provider extraction runtime; provider adapter boundary; deterministic mock provider adapter; configured-provider missing-key refusal; mock provider smoke requires no live provider; live provider validation optional and skipped when no safe key/config is available; source_ref_id required; bounded source excerpt or bounded source summary required; raw source body non-persistent by default; raw provider output non-persistent by default; no chain-of-thought or hidden reasoning stored; normalized provider output is candidate-only; provider output is not truth; provider output is not proof/evidence; provider confidence is not promotion readiness; no automatic review memory write, retrieval index write, proof/evidence write, claim/evidence write, Perspective promotion, durable Perspective state write/apply, Formation Receipt write, Git/GitHub execution, Codex execution, product write, product persistence, product runtime write, product-write authority, or product ID allocation; smoke/CI pass is not truth; roadmap guide is not SSOT; product-write remains parked by #686.
- Research Retrieval/RAG Runtime Contract v0.1:
  `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`,
  `docs/RESEARCH_RETRIEVAL_RAG_RUNTIME_V0_1.md`,
  `types/research-retrieval-runtime-contract.ts`,
  `fixtures/research-retrieval-runtime-contract.sample.v0.1.json`,
  and `scripts/smoke-research-retrieval-runtime-contract-v0-1.mjs`
  (`npm run smoke:research-retrieval-runtime-contract-v0-1`) follows the integrated roadmap guide v0.2.1 FULL as contract-only and follows #774, #775, #776, #777, and #778. It defines future retrieval request, corpus descriptor, query descriptor, retrieval candidate, result envelope, privacy/redaction, lineage, scoring preview, rebuildability, and authority boundary shapes. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT, and this contract is SSOT only for its own slice type contract in `types/research-retrieval-runtime-contract.ts`. It does not implement retrieval/RAG execution, query execution, embeddings, vector search, index read/write, corpus scan, provider calls, prompt sending, provider output storage, retrieval output storage, source fetch, local/repository/uploaded file reads, raw source storage, route, UI, DB query/write, proof/evidence, claim/evidence writes, promotion, GitHub automation, Git Ledger, product write, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Research Retrieval/RAG Runtime Contract v0.1; contract-only; follows the integrated roadmap guide v0.2.1 FULL; follows #774, #775, #776, #777, and #778; Research Retrieval/RAG Runtime Contract is contract-only; roadmap guide is not SSOT; actual field/type/enum authority is `types/research-retrieval-runtime-contract.ts`; older proposal documents are background inputs already integrated into the roadmap guide; Retrieval candidates are not truth; Retrieval candidates are not proof/evidence; Retrieval result is not evidence; Retrieval score is not truth score; Retrieval score is not promotion readiness; RAG answer is context preview only; accepted_for_future_runtime is not runtime execution; bounded query summary is not query execution; retrieval mode is planning metadata, not retrieval execution; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; Candidate summary refs are lineage metadata, not proof; Durable summary refs are lineage metadata, not proof; Provider candidate refs are lineage metadata, not proof; Raw retrieval outputs must not be stored; no retrieval/RAG execution, query execution, embeddings, vector search, index read/write, corpus scan, provider calls, prompt sending, provider output storage, retrieval output storage, source fetch, local/repository/uploaded file reads, raw source storage, route, UI, DB query/write, proof/evidence, claim/evidence writes, promotion, GitHub automation, Git Ledger, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Rebuildable Retrieval Index Runtime, RAG Context Preview, Perspective Promotion Runtime Contract, Dogfooding Record Runtime Contract, and Provider Output Redaction Contract.
- Rebuildable Retrieval Index Runtime v0.1:
  `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`,
  `docs/RESEARCH_RETRIEVAL_RAG_RUNTIME_V0_1.md`,
  `docs/REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_V0_1.md`,
  `lib/research-retrieval/rebuild-index.ts`,
  `lib/research-retrieval/search-index.ts`,
  `lib/research-retrieval/index-store.ts`,
  `app/api/research-retrieval/rebuild/route.ts`,
  `app/api/research-retrieval/search/route.ts`,
  `fixtures/research-retrieval-index-runtime.sample.v0.1.json`,
  and `scripts/smoke-research-retrieval-index-runtime-v0-1.mjs`
  (`npm run smoke:research-retrieval-index-runtime-v0-1`) follows the integrated roadmap guide v0.2.1 FULL and follows PR #779 Research Retrieval/RAG Runtime Contract. It provides a derived, rebuildable, non-authoritative local index runtime bounded to caller-provided public-safe summaries and symbolic refs, deterministic local metadata/lexical/hybrid/no-retrieval search helpers, an in-memory derived cache, and explicit same-origin POST-only rebuild/search routes. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT, and PR #779 remains the Research Retrieval/RAG contract boundary in `types/research-retrieval-runtime-contract.ts`. It does not implement RAG answer generation, embeddings, vector search, semantic embedding search, external retrieval providers, rerank runtime, source fetch, crawler behavior, local/repository/uploaded file reads as source input, raw source body storage, raw provider output storage, raw retrieval output storage, provider/OpenAI calls, prompt sending, DB migration, production DB read/write, proof/evidence writes, claim/evidence writes, Perspective promotion, durable Perspective state writes, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Rebuildable Retrieval Index Runtime v0.1; bounded derived runtime; derived, rebuildable, non-authoritative; caller-provided public-safe summaries and symbolic refs only; follows PR #779 Research Retrieval/RAG Runtime Contract; roadmap guide is not SSOT; index is not canonical state; index is not source of truth; Search results are not evidence; Retrieval result is not evidence; Retrieval score is not truth score; Retrieval score is not promotion readiness; Stale index cannot override current state; In-memory derived cache is not durable state; Discarding an index cache is not candidate rejection; Discarding an index cache is not proof/evidence deletion; RAG answer generation remains deferred; Embeddings remain deferred; Vector search remains deferred; Semantic embedding search remains deferred; Provider/OpenAI calls remain forbidden; Source fetch remains forbidden; Product-write remains parked by #686; no RAG answer generation, embeddings, vector search, semantic embedding search, external retrieval provider, rerank runtime, source fetch, crawler, local file read as source input, repository file read as source input, uploaded file read, raw source body storage, raw provider output storage, raw retrieval output storage, provider/OpenAI call, prompt sending, DB migration, production DB read/write, proof/evidence write, claim/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation.
- Rebuildable Retrieval Index Runtime Completion v0.1:
  `docs/REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_COMPLETION_V0_1.md`,
  `lib/research-retrieval/index-store.ts`,
  `lib/research-retrieval/rebuild-index.ts`,
  `lib/research-retrieval/search-index.ts`,
  `app/api/research-retrieval/rebuild/route.ts`,
  `app/api/research-retrieval/search/route.ts`,
  `fixtures/research-retrieval-index-runtime-completion.sample.v0.1.json`,
  and `scripts/smoke-research-retrieval-index-runtime-completion-v0-1.mjs`
  (`npm run smoke:research-retrieval-index-runtime-completion-v0-1`) implements `rebuildable_retrieval_index_runtime_completion_v0_1` as the original Phase 3.6 DB-backed rebuild/search runtime completion for derived retrieval index rows. It adds caller-injected SQLite schema helpers, deterministic rebuild helpers, DB-backed search helpers, same-origin completion route bodies, a public-safe fixture, smoke coverage, package script, and this latest-index pointer. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. Search results are review aids only; they are not evidence, truth, or promotion readiness. This slice writes derived retrieval index rows only and does not call providers, send prompts, fetch sources, crawl, create embeddings, use vector search, generate RAG answers, create proof/evidence, write claim/evidence, promote Perspective, write/apply durable state, write Formation Receipts, execute Git/GitHub, execute Codex, product-write, allocate product IDs, or grant product-write authority. Product-write remains parked by #686.

  Boundary phrases: Rebuildable Retrieval Index Runtime Completion v0.1; `rebuildable_retrieval_index_runtime_completion_v0_1`; original Phase 3.6 rebuildable retrieval index runtime completion; DB-backed rebuild/search runtime; caller-injected SQLite DB only; derived retrieval index rows only; explicit operator rebuild only; explicit operator search only; public-safe derived entries only; stale marker visible; backrefs visible; index is derived and rebuildable; Search result is not evidence; Retrieval score is not truth score; Retrieval score is not promotion readiness; Source refs are lineage pointers, not proof; Smoke/CI pass is not truth; roadmap guide is not SSOT; Product-write remains parked by #686; no provider call, prompt sending, source fetch, live crawling, embedding creation, vector search, RAG answer generation, raw source body indexing, raw provider output indexing, raw retrieval output storage, hidden reasoning storage, proof/evidence write, claim/evidence write, Perspective promotion, durable Perspective state write/apply, Formation Receipt write, Git/GitHub execution, Codex execution, product write, or product ID allocation.
- RAG Context Preview v0.1:
  `docs/RAG_CONTEXT_PREVIEW_V0_1.md`,
  `types/rag-context-preview.ts`,
  `lib/research-retrieval/build-rag-context-preview.ts`,
  `fixtures/rag-context-preview.sample.v0.1.json`,
  `scripts/smoke-rag-context-preview-v0-1.mjs`,
  and `components/rag-context-preview-panel.tsx`
  (`npm run smoke:rag-context-preview-v0-1`) follows the integrated roadmap guide v0.2.1 FULL, PR #779 Research Retrieval/RAG Runtime Contract, and PR #780 Rebuildable Retrieval Index Runtime. It is preview-only, no-answer, provider-free, prompt-free, source-fetch-free, and candidate-only. It builds deterministic context preview packets over caller-provided retrieval results, bounded summaries, symbolic refs, staleness warnings, unresolved tensions, and knowledge gaps. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT, and actual field/type/enum authority for this slice is `types/rag-context-preview.ts`. It does not add answer generation, provider calls, prompt sending, embeddings, vector search, semantic embedding search, external retrieval providers, source fetch, crawler behavior, local/repository/uploaded file reads as source input, raw source body storage, raw provider output storage, raw retrieval output storage, DB query/write, proof/evidence writes, claim/evidence writes, Perspective promotion, durable Perspective state writes, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: RAG Context Preview v0.1; preview-only; no answer generated; follows PR #779 and PR #780; RAG Context Preview does not generate answers; RAG Context Preview is not a final answer; RAG Context Preview is not truth; Context items are not evidence; Context items are not proof; Retrieval result is not evidence; Retrieval score is not truth score; Retrieval score is not promotion readiness; Bounded query summary is not query execution; No prompt is sent; No provider/OpenAI call is made; No embedding is created; No vector search is executed; No source fetch is executed; Raw RAG context payloads must not be stored; Raw retrieval outputs must not be stored; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; Stale context cannot override current state; Unresolved tensions must be preserved; Knowledge gaps must be preserved; product-write remains parked by #686; no answer generation, provider call, prompt sending, embedding creation, vector search, semantic embedding search, source fetch, proof/evidence write, claim/evidence write, Perspective promotion, durable Perspective state write, Git Ledger export, product write, or product ID allocation.
- RAG Context Preview Runtime Completion v0.1:
  `docs/RAG_CONTEXT_PREVIEW_RUNTIME_COMPLETION_V0_1.md`,
  `lib/research-retrieval/build-rag-context-preview.ts`,
  `app/api/research-retrieval/rag-context-preview/route.ts`,
  `components/rag-context-preview-panel.tsx`,
  `fixtures/rag-context-preview-runtime-completion.sample.v0.1.json`,
  and `scripts/smoke-rag-context-preview-runtime-completion-v0-1.mjs`
  (`npm run smoke:rag-context-preview-runtime-completion-v0-1`) implements `rag_context_preview_runtime_completion_v0_1` as the original Phase 3.7 DB-backed RAG context preview runtime completion. It closes the gap left by the earlier caller-provided retrieval-results preview by using the DB-backed retrieval search runtime from `rebuildable_retrieval_index_runtime_completion_v0_1`. It adds a read-only context preview builder, same-origin POST route, public-safe fixture, smoke coverage, package script, and this latest-index pointer. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. It builds context previews only and does not generate final answers. RAG context is not truth, proof, accepted evidence, or promotion readiness. Retrieval result is not evidence; retrieval score is not truth or promotion readiness. This slice does not call providers, send prompts, fetch sources, crawl, create embeddings, use vector search, write retrieval indexes, write DB, create proof/evidence, write claim/evidence, mutate candidates, write review memory, promote Perspective, write/apply durable state, write Formation Receipts, execute Git/GitHub, execute Codex, product-write, allocate product IDs, or grant product-write authority. Product-write remains parked by #686.

  Boundary phrases: RAG Context Preview Runtime Completion v0.1; `rag_context_preview_runtime_completion_v0_1`; original Phase 3.7 RAG context preview runtime completion; DB-backed retrieval search runtime; read-only DB search; context preview only; no final answer generation; same-origin POST route only; candidate-vs-durable markers visible; staleness warnings visible; unresolved tension markers visible; knowledge gap markers visible; RAG context is not truth; RAG context is not proof; RAG context is not accepted evidence; RAG context is not promotion readiness; Retrieval result is not evidence; Retrieval score is not truth score; Retrieval score is not promotion readiness; Source refs are lineage pointers, not proof; Smoke/CI pass is not truth; roadmap guide is not SSOT; Product-write remains parked by #686; no provider call, prompt sending, source fetch, live crawling, embedding creation, vector search, retrieval index write, DB write, raw source body inclusion, raw provider output inclusion, raw retrieval output storage, hidden reasoning storage, proof/evidence write, claim/evidence write, candidate mutation, review memory write, Perspective promotion, durable Perspective state write/apply, Formation Receipt write, Git/GitHub execution, Codex execution, product write, or product ID allocation.
- Final RAG Answer Generation Candidate Review v0.1:
  `docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md`,
  `types/final-rag-answer-candidate-review.ts`,
  `lib/research-retrieval/build-final-rag-answer-candidate.ts`,
  `lib/research-retrieval/final-rag-answer-provider-boundary.ts`,
  `app/api/research-retrieval/final-rag-answer/route.ts`,
  `fixtures/final-rag-answer-generation-candidate-review.sample.v0.1.json`,
  and `scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs`
  (`npm run smoke:final-rag-answer-generation-candidate-review-v0-1`) implements `final_rag_answer_generation_candidate_review_v0_1` as the explicitly approved final RAG answer candidate/review layer. It uses existing DB-backed RAG context preview results, builds a bounded prompt descriptor, invokes only a bounded answer-provider adapter under explicit operator action, supports deterministic mock-provider smoke behavior, and returns a candidate-only final answer artifact for operator review. This pointer is repo-local documentation metadata, not SSOT. The slice does not create proof/evidence records, claim/evidence writes, Review Memory, durable Perspective state, Formation Receipts, accepted evidence refs, product-write, product IDs, retrieval index writes, source fetches, crawling, Git/GitHub actuation, release work, or automatic answer-to-product conversion. RAG context remains a review aid; retrieval result is not evidence; retrieval score is not truth or promotion readiness; provider output is candidate-only; Smoke/CI pass is not truth.

  Boundary phrases: Final RAG Answer Generation Candidate Review v0.1; `final_rag_answer_generation_candidate_review_v0_1`; explicitly approved final RAG answer candidate/review slice; same-origin POST route only; no GET provider execution route; bounded prompt descriptor; raw prompt non-persistent; raw provider output non-persistent; no chain-of-thought storage; deterministic mock provider; configured provider missing-key refusal; answer review state candidate-only; final answer candidate is not truth; final answer candidate is not proof; final answer candidate is not accepted evidence; final answer candidate is not promotion readiness; final answer candidate is not product; retrieval result is not evidence; retrieval score is not truth score; retrieval score is not promotion readiness; source refs are lineage pointers, not proof; product-write remains limited to the already merged accepted evidence ref runtime from #842; no product-write, accepted evidence ref write, product ID allocation, broad product persistence, proof/evidence record creation, claim/evidence write, Review Memory write, durable Perspective state write/apply, Formation Receipt write, retrieval index write, source fetch, crawling, background provider call, provider call on load, hidden provider call, Git/GitHub execution, release execution, or automatic product generation.
- Final RAG Answer Review Memory Binding v0.1:
  `docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md`,
  `types/final-rag-answer-review-memory-binding.ts`,
  `lib/research-retrieval/final-rag-answer-review-memory-binding.ts`,
  `app/api/research-retrieval/final-rag-answer/review-memory/route.ts`,
  `fixtures/final-rag-answer-review-memory-binding.sample.v0.1.json`,
  and `scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs`
  (`npm run smoke:final-rag-answer-review-memory-binding-v0-1`) implements
  `final_rag_answer_candidate_review_memory_binding_v0_1` as the explicitly
  approved final RAG answer candidate to Review Memory binding slice only. It
  binds already generated bounded final answer candidates into bounded Review
  Memory DB records for operator review by using the existing Review Memory DB
  store helper. This pointer is repo-local documentation metadata, not SSOT.
  This slice does not generate final answers, call providers, send prompts,
  execute retrieval, fetch sources, write retrieval indexes, create
  proof/evidence, write claim/evidence records outside Review Memory, promote
  Perspective, write/apply durable Perspective state, write Formation
  Receipts, product-write, write accepted evidence refs, allocate product IDs,
  enable a product-write adapter, execute Git/GitHub/release work, or perform
  automatic answer-to-product conversion. Review Memory is not truth, proof,
  accepted evidence, durable Perspective state, promotion, Formation Receipt,
  product-write, or product authority. Final answer candidate remains
  candidate-only. Source refs are lineage pointers, not proof. Smoke/CI pass
  is not truth.
- Final Answer Candidate Review UI Binding v0.1:
  `docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md`,
  `components/final-rag-answer-review-memory-panel.tsx`,
  `app/research-retrieval/final-rag-answer/review-memory/page.tsx`,
  `fixtures/final-answer-candidate-review-ui-binding.sample.v0.1.json`,
  and `scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs`
  (`npm run smoke:final-answer-candidate-review-ui-binding-v0-1`) implements
  `final_answer_candidate_review_ui_binding_v0_1` as the explicitly approved
  read/display-only UI binding for final RAG answer candidate Review Memory
  records created by `final_rag_answer_candidate_review_memory_binding_v0_1`.
  It reads only from existing Review Memory DB GET routes, displays bounded
  record/detail/activity projections, candidate refs, source refs, lifecycle
  state, review decision, boundary acknowledgements, and non-authority notes,
  and can copy a bounded read-only review packet. This pointer is repo-local
  documentation metadata, not SSOT. This slice does not write Review Memory,
  generate final answers, call providers, send prompts, execute retrieval,
  fetch sources, write retrieval indexes, create proof/evidence, write
  claim/evidence records, promote Perspective, write/apply durable state,
  write Formation Receipts, product-write, write accepted evidence refs,
  allocate product IDs, enable a product-write adapter, add broad product
  persistence, execute Git/GitHub/release work, or perform automatic
  answer-to-product conversion. Review Memory is not truth, proof, accepted
  evidence, or durable Perspective state. Final answer candidate remains
  candidate-only. Source refs are lineage pointers, not proof. Operator review
  note is review memory, not promotion or product-write authority. Smoke/CI
  pass is not truth.
- Perspective Promotion Runtime Contract v0.1:
  `docs/PERSPECTIVE_PROMOTION_RUNTIME_V0_1.md`,
  `types/perspective-promotion-runtime-contract.ts`,
  `fixtures/perspective-promotion-runtime-contract.sample.v0.1.json`,
  and `scripts/smoke-perspective-promotion-runtime-contract-v0-1.mjs`
  (`npm run smoke:perspective-promotion-runtime-contract-v0-1`) follows the integrated roadmap guide v0.2.1 FULL, PR #779 Research Retrieval/RAG Runtime Contract, PR #780 Rebuildable Retrieval Index Runtime, and PR #781 RAG Context Preview. It is contract-only and future human-reviewed promotion only. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT, and actual field/type/enum authority for this slice is `types/perspective-promotion-runtime-contract.ts`. It defines future human-reviewed promotion decision, basis ref, gate report, unresolved tension policy, knowledge gap policy, Formation Receipt policy, and authority boundary shapes. It adds no promotion runtime, decision store, route, Formation Receipt write, durable Perspective state apply, proof/evidence write, product write, Git Ledger export, or GitHub automation. Product-write remains parked by #686.

  Boundary phrases: Perspective Promotion Runtime Contract v0.1; contract-only; future human-reviewed promotion; follows PR #779, PR #780, and PR #781; Perspective Promotion Runtime Contract is contract-only; Explicit user action is required for any future promotion; Provider output cannot promote Perspective; Retrieval result cannot promote Perspective; RAG Context Preview cannot promote Perspective; Feedback cannot promote Perspective; Codex result cannot promote Perspective; CI pass is not proof; Smoke pass is not proof; PR body is not authority; Git ref is not authority; Candidate is not fact; Candidate is not proof; Candidate is not accepted evidence; Review memory is not durable Perspective state; Formation Receipt is required before durable state apply; Durable state apply is deferred; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; Unresolved tensions must be preserved or handled explicitly; Knowledge gaps must be preserved, deferred, or closed explicitly; product-write remains parked by #686; no promotion runtime, promotion route, promotion store, promotion decision record write, Formation Receipt write, durable Perspective state apply, proof/evidence write, claim/evidence write, product write, product ID allocation, work mutation, DB query/write, source fetch, file reads, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, embedding creation, vector search, Git Ledger export, Codex execution, or GitHub automation.
- Promotion Decision Store/Routes v0.1:
  `docs/PROMOTION_DECISION_STORE_ROUTE_V0_1.md`,
  `lib/perspective/promotion/promotion-decision-store.ts`,
  `app/api/perspective/promotion-decisions/route.ts`,
  `app/api/perspective/promotion-decisions/[promotion_decision_id]/route.ts`,
  `fixtures/perspective-promotion-decision-store.sample.v0.1.json`,
  and `scripts/smoke-perspective-promotion-decision-store-v0-1.mjs`
  (`npm run smoke:perspective-promotion-decision-store-v0-1`) follows PR #782 Perspective Promotion Runtime Contract and records explicit operator decision records only. It adds a bounded store helper, same-origin routes, DB schema additions, public-safe fixture, smoke, docs, package script, and index pointer for promotion decisions. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. It does not add promotion execution, Formation Receipt write, durable state apply, proof/evidence write, product-write, Git Ledger export, UI, provider calls, retrieval/RAG execution, source fetch, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Promotion Decision Store/Routes v0.1; explicit operator decision records; follows PR #782 Perspective Promotion Runtime Contract; storing a promotion decision is not promotion execution; storing a promote decision is not durable Perspective state apply; storing a promote decision is not proof; storing a promote decision is not accepted evidence by itself; Formation Receipt is required before durable state apply; Formation Receipt write is deferred; Durable Perspective state apply is deferred; Proof/evidence creation is deferred; Claim/evidence writes are deferred; Explicit user action is required; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; Review memory is not durable Perspective state; Discarding a decision record is not hard deletion of proof/evidence; product-write remains parked by #686; no promotion execution, Formation Receipt write, durable Perspective state apply, proof/evidence write, claim/evidence write, product write, product ID allocation, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file read as source input, Git Ledger export, Codex execution, GitHub automation, or UI.
- Formation Receipt Durable Write v0.1:
  `docs/FORMATION_RECEIPT_DURABLE_WRITE_V0_1.md`,
  `lib/perspective/formation-receipt/build-durable-receipt.ts`,
  `lib/perspective/formation-receipt/formation-receipt-store.ts`,
  `app/api/perspective/formation-receipts/route.ts`,
  `fixtures/formation-receipt-durable-write.sample.v0.1.json`,
  and `scripts/smoke-formation-receipt-durable-write-v0-1.mjs`
  (`npm run smoke:formation-receipt-durable-write-v0-1`) follows PR #782 Perspective Promotion Runtime Contract and PR #783/#784 Promotion Decision Store/Routes. It writes Formation Receipt records only, using caller-injected/local test DB behavior and same-origin bounded routes. Formation Receipt is required before durable state apply. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. It does not add durable state apply, promotion execution, proof/evidence write, claim/evidence write, product-write, Git Ledger export, UI, provider calls, retrieval/RAG execution, source fetch, local/repository/uploaded file read as source input, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Formation Receipt Durable Write v0.1; Formation Receipt record write only; follows PR #782, PR #783, and PR #784; Formation Receipt is required before durable state apply; Formation Receipt write is not durable Perspective state apply; Formation Receipt is not proof of correctness; Formation Receipt is not evidence by itself; Durable Perspective state apply is deferred; Promotion execution is deferred; Proof/evidence creation is deferred; Claim/evidence writes are deferred; Selected candidates are preserved; Omitted candidates are preserved; Deferred candidates are preserved; Unresolved tensions are preserved; Knowledge gaps are preserved; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; product-write remains parked by #686; no durable Perspective state apply, promotion execution, proof/evidence write, claim/evidence write, product write, product ID allocation, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file read as source input, Git Ledger export, Codex execution, GitHub automation, or UI.
- Durable Perspective State Apply v0.1:
  `docs/DURABLE_PERSPECTIVE_STATE_APPLY_V0_1.md`,
  `lib/perspective/state/apply-perspective-delta.ts`,
  `lib/perspective/state/read-perspective-state.ts`,
  `lib/perspective/state/state-store.ts`,
  `app/api/perspective/state/apply-delta/route.ts`,
  `app/api/perspective/state/[perspective_id]/route.ts`,
  `fixtures/durable-perspective-state-apply.sample.v0.1.json`,
  and `scripts/smoke-durable-perspective-state-apply-v0-1.mjs`
  (`npm run smoke:durable-perspective-state-apply-v0-1`) follows PR #782 Perspective Promotion Runtime Contract, PR #783/#784 Promotion Decision Store/Routes, and PR #785 Formation Receipt Durable Write. It writes durable Perspective state only after Formation Receipt. Formation Receipt is required before durable state apply. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. It does not add product-write, proof/evidence row writes, claim/evidence row writes outside durable Perspective state references, Git Ledger export, UI, provider calls, retrieval/RAG execution, source fetch, local/repository/uploaded file read as source input, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Durable Perspective State Apply v0.1; writes durable Perspective state only after Formation Receipt; follows PR #782, PR #783/#784, and PR #785; Formation Receipt is required before durable state apply; Durable Perspective State Apply does not product-write; Durable Perspective State Apply does not create proof/evidence records; Prior thesis must not be silently overwritten; Retired claims must remain auditable; Contradicted evidence must not be deleted; Unresolved tensions must be preserved or explicitly resolved; Knowledge gaps must be preserved, deferred, or explicitly closed; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; product-write remains parked by #686; no product write, product ID allocation, proof/evidence row write, claim/evidence row write outside durable Perspective state references, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file read as source input, Git Ledger export, Codex execution, GitHub automation, or UI.
- Perspective Trajectory Builder v0.1:
  `docs/PERSPECTIVE_TRAJECTORY_BUILDER_V0_1.md`,
  `lib/perspective/state/build-trajectory.ts`,
  `app/api/perspective/state/[perspective_id]/trajectory/route.ts`,
  `components/perspective-trajectory-panel.tsx`,
  `fixtures/perspective-trajectory.sample.v0.1.json`,
  and `scripts/smoke-perspective-trajectory-v0-1.mjs`
  (`npm run smoke:perspective-trajectory-v0-1`) follows PR #782 through PR #786. It is a read-only derived trajectory view over promotion decisions, Formation Receipts, durable state apply events, prior theses, retired claims, tensions, knowledge gaps, feedback refs, and source refs. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. It does not add durable state mutation, promotion, Formation Receipt write, proof/evidence write, product-write, Git Ledger export, provider calls, retrieval/RAG execution, source fetch, local/repository/uploaded file read as source input, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Perspective Trajectory Builder v0.1; read-only derived trajectory view; follows PR #782 through PR #786; Perspective Trajectory Builder is read-only; Perspective Trajectory Builder is a derived view, not source of truth; no durable state apply, durable state write, Formation Receipt write, promotion execution, promotion decision write, proof/evidence write, claim/evidence write, product write, product ID allocation, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file read as source input, Git Ledger export, Codex execution, GitHub automation, or UI action behavior; product-write remains parked by #686.
- Project Constellation Runtime Layout Contract v0.1:
  `docs/PROJECT_CONSTELLATION_RUNTIME_LAYOUT_V0_1.md`,
  `types/project-constellation-runtime-layout-contract.ts`,
  `fixtures/project-constellation-runtime-layout-contract.sample.v0.1.json`,
  and `scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs`
  (`npm run smoke:project-constellation-runtime-layout-contract-v0-1`) follows PR #786 Durable Perspective State Apply and PR #787 Perspective Trajectory Builder. It is contract-only. Layout is interface. Coordinates are not truth. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. It does not add layout runtime, seeded layout algorithm, route, UI, layout persistence, DB write, state mutation, proof/evidence writes, product-write, Git Ledger export, provider calls, retrieval/RAG execution, source fetch, local/repository/uploaded file read as source input, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Project Constellation Runtime Layout Contract v0.1; contract-only; layout is interface; coordinates are not truth; coordinates are not proof; coordinates are not evidence strength; coordinates are not promotion readiness; manual anchors are display hints; manual anchors are not authority; temporal smoothing is display continuity; temporal smoothing is not durable state; candidate overlay is not durable graph; source balance is advisory; stale markers are display warnings only; tension markers are review aids only; gap markers are review aids only; bridge markers are review aids only; no layout runtime, layout algorithm, seeded layout, layout persistence, manual anchor persistence, route, UI, graph rendering, graph database, DB query/write, durable state mutation, Formation Receipt write, promotion execution, proof/evidence write, claim/evidence write, product write, product ID allocation, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file read as source input, Git Ledger export, Codex execution, or GitHub automation; product-write remains parked by #686.
- Project Constellation Seeded Layout Runtime v0.1:
  `docs/PROJECT_CONSTELLATION_SEEDED_LAYOUT_RUNTIME_V0_1.md`,
  `lib/perspective/layout/seeded-layout.ts`,
  `lib/perspective/layout/layout-diagnostics.ts`,
  `fixtures/project-constellation-seeded-layout.sample.v0.1.json`,
  and `scripts/smoke-project-constellation-seeded-layout-v0-1.mjs`
  (`npm run smoke:project-constellation-seeded-layout-v0-1`) follows PR #788 Project Constellation Runtime Layout Contract. It is deterministic and display-only. Coordinates are not truth. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. It does not add route, UI, layout persistence, manual anchor persistence, DB write, state mutation, proof/evidence writes, product-write, Git Ledger export, provider calls, retrieval/RAG execution, source fetch, local/repository/uploaded file read as source input, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Project Constellation Seeded Layout Runtime v0.1; deterministic; display-only; same input and same seed produce the same output; coordinates are display hints; coordinates are not truth; coordinates are not proof; coordinates are not evidence strength; coordinates are not promotion readiness; candidate overlay is visually distinct from durable graph; candidate overlay is not durable graph; source balance is advisory; stale markers are display warnings only; tension markers are review aids only; gap markers are review aids only; bridge markers are review aids only; no route, UI, layout persistence, manual anchor persistence, graph database, DB read/write, durable state mutation, Formation Receipt write, promotion execution, proof/evidence write, claim/evidence write, product write, product ID allocation, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file read as source input, Git Ledger export, Codex execution, or GitHub automation; product-write remains parked by #686.
- Project Constellation Runtime UI v0.1:
  `docs/PROJECT_CONSTELLATION_RUNTIME_UI_V0_1.md`,
  `components/perspective/constellation-runtime-view.tsx`,
  `components/perspective/constellation-node.tsx`,
  `components/perspective/constellation-edge.tsx`,
  `components/perspective/constellation-inspector.tsx`,
  `components/perspective/candidate-overlay-toggle.tsx`,
  `fixtures/project-constellation-runtime-ui.sample.v0.1.json`,
  `scripts/smoke-project-constellation-runtime-ui-v0-1.mjs`,
  and `scripts/browser-validate-project-constellation-runtime-ui-v0-1.mjs`
  (`npm run smoke:project-constellation-runtime-ui-v0-1`; `npm run browser:project-constellation-runtime-ui-v0-1`) follows PR #788 Project Constellation Runtime Layout Contract and PR #789 Seeded Constellation Layout Runtime. It is a read-only UI over caller-provided public-safe layout data with no state mutation. Coordinates are display hints. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. It does not add route, fetch, layout persistence, manual anchor persistence, DB write, state mutation, proof/evidence writes, product-write, Git Ledger export, provider calls, retrieval/RAG execution, source fetch, local/repository/uploaded file read as source input, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Project Constellation Runtime UI v0.1; read-only UI; props-only layout data; local display state only; coordinates are display hints; coordinates are not truth; coordinates are not proof; coordinates are not evidence strength; coordinates are not promotion readiness; candidate overlay is not durable graph; source balance is advisory; stale markers are display warnings only; tension markers are review aids only; gap markers are review aids only; bridge markers are review aids only; missing edge endpoints render bounded warnings rather than crashing or inventing nodes; no route, fetch, API call, server action, form POST, layout persistence, manual anchor persistence, graph database, DB read/write, durable state mutation, Formation Receipt write, promotion execution, proof/evidence write, claim/evidence write, product write, product ID allocation, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file read as source input, Git Ledger export, Codex execution, or GitHub automation; product-write remains parked by #686.
- Project Constellation Runtime UI Completion v0.1:
  `docs/PROJECT_CONSTELLATION_RUNTIME_UI_COMPLETION_V0_1.md`,
  `components/perspective/constellation-runtime-view.tsx`,
  `components/perspective/constellation-inspector.tsx`,
  `components/perspective/constellation-runtime-data-panel.tsx`,
  `components/augnes-cockpit.tsx`,
  `lib/perspective/layout/build-runtime-constellation-view-model.ts`,
  `fixtures/project-constellation-runtime-ui-completion.sample.v0.1.json`,
  and `scripts/smoke-project-constellation-runtime-ui-completion-v0-1.mjs`
  (`npm run smoke:project-constellation-runtime-ui-completion-v0-1`) implements `constellation_runtime_ui_runtime_completion_v0_1` as the original Phase 5.3 runtime UI completion. It closes the gap left by the earlier caller-provided layout inspection UI by binding to bounded runtime read/preview sources where available: durable Perspective state read, trajectory read, manual anchor GET, and RAG context preview runtime. The mounted cockpit surface receives an existing public-safe seeded layout so the durable graph and candidate overlay are initially visible, and the view-model builder supports a no-layout runtime-response fallback with display/read-model-only nodes. It renders durable graph layer, candidate overlay layer, source provenance inspector, tension/gap/stale/bridge markers, manual anchor preview, layout diagnostics, selected node trajectory preview, selected node context preview, bounded route errors, and authority boundary. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. The UI is read-only and does not edit coordinates, write anchors, directly write DB/files, call providers, send prompts, fetch sources, write retrieval indexes, generate RAG answers, create proof/evidence, create work items, promote Perspective, write/apply durable state, write Formation Receipts, execute Git/GitHub, execute Codex, product-write, allocate product IDs, or grant product-write authority. Product-write remains parked by #686.

  Boundary phrases: Project Constellation Runtime UI Completion v0.1; `constellation_runtime_ui_runtime_completion_v0_1`; bounded runtime read/preview sources; read-only runtime UI; durable graph layer visible; candidate overlay layer visible; source provenance inspector visible; tension/gap/stale/bridge markers visible; manual anchor preview visible; layout diagnostics visible; selected node trajectory preview visible; selected node context preview visible; same-origin runtime reads only; Layout coordinates are display hints, not truth; Manual anchors are display hints, not truth; Salience score is not truth; Candidate overlay is not durable state; RAG context is not truth; Retrieval result is not evidence; Source refs are lineage pointers, not proof; Smoke/CI pass is not truth; Product-write remains parked by #686; no coordinate edit/write, manual anchor write, direct DB access from UI, direct file write from UI, provider call, prompt sending, source fetch, retrieval index write, RAG answer generation, proof/evidence write, claim/evidence write, work item write, Perspective promotion, durable state write/apply, Formation Receipt write, Git/GitHub execution, Codex execution, product write, or product ID allocation.
- Project Constellation Manual Anchors v0.1:
  `docs/PROJECT_CONSTELLATION_MANUAL_ANCHORS_V0_1.md`,
  `lib/perspective/layout/manual-anchor-store.ts`,
  `app/api/perspective/layout/manual-anchors/route.ts`,
  `fixtures/project-constellation-manual-anchors.sample.v0.1.json`,
  and `scripts/smoke-project-constellation-manual-anchors-v0-1.mjs`
  (`npm run smoke:project-constellation-manual-anchors-v0-1`) follows PR #788 Project Constellation Runtime Layout Contract, PR #789 Seeded Constellation Layout Runtime, and PR #790 Constellation Runtime UI. This slice persists explicit operator manual anchors only. Manual anchors are display hints. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. It does not add UI drag/save, route integration into UI, durable state mutation, proof/evidence writes, product-write, Git Ledger export, provider calls, retrieval/RAG execution, source fetch, local/repository/uploaded file read as source input, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Project Constellation Manual Anchors v0.1; explicit operator manual anchors only; manual anchors are display hints; manual anchors are not authority; manual anchors are not truth; manual anchors are not proof; manual anchors are not evidence strength; manual anchors are not promotion readiness; explicit operator action required; same-origin bounded route only; read-only GET; bounded local DB path only; no UI drag/save, route integration into UI, layout algorithm mutation, seeded layout mutation, graph rendering change, durable state mutation, Formation Receipt write, promotion execution, proof/evidence write, claim/evidence write, product write, product ID allocation, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file read as source input, Git Ledger export, Codex execution, or GitHub automation; product-write remains parked by #686.
- Project Constellation Manual Anchors Runtime Completion v0.1:
  `docs/PROJECT_CONSTELLATION_MANUAL_ANCHORS_RUNTIME_COMPLETION_V0_1.md`,
  `lib/perspective/layout/manual-anchor-store.ts`,
  `app/api/perspective/layout/manual-anchors/route.ts`,
  `fixtures/project-constellation-manual-anchors-runtime-completion.sample.v0.1.json`,
  and `scripts/smoke-project-constellation-manual-anchors-runtime-completion-v0-1.mjs`
  (`npm run smoke:project-constellation-manual-anchors-runtime-completion-v0-1`) implements `layout_persistence_manual_anchors_runtime_completion_v0_1` as the original Phase 5.4 manual anchor persistence runtime completion. It adds explicit caller-injected SQLite helper aliases, `upsert_anchor` and `discard_anchor` same-origin route actions, idempotent upsert/update/discard lifecycle behavior, public-safe fixture coverage, and runtime completion docs/smoke while preserving the earlier manual-anchor helper compatibility. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. This slice may write only manual anchor records and lifecycle/discard metadata. Manual anchors are display hints only; coordinates are not truth; anchors are not promotion readiness, evidence strength, or source authority. It does not create proof/evidence, write claim/evidence, create work items, promote Perspective, write/apply durable state, write Formation Receipts, call providers, send prompts, fetch sources, execute retrieval/RAG, write retrieval indexes, generate RAG answers, execute Git/GitHub, execute Codex, product-write, allocate product IDs, or grant product-write authority. Product-write remains parked by #686. Smoke/CI pass is not truth.

  Boundary phrases: Project Constellation Manual Anchors Runtime Completion v0.1; `layout_persistence_manual_anchors_runtime_completion_v0_1`; explicit operator anchor action only; caller-injected DB only; same-origin route now; manual anchors are display hints only; coordinates are not truth; manual anchors are not truth; anchors are not promotion readiness; anchors are not evidence strength; anchors are not source authority; discard is lifecycle transition, not hard delete; no proof/evidence write, claim/evidence write, work item write, Perspective promotion, durable state write/apply, Formation Receipt write, provider call, prompt sending, source fetch, retrieval/RAG execution, retrieval index write, RAG answer generation, Git/GitHub execution, Codex execution, product write, product ID allocation, or product-write authority; Product-write remains parked by #686; Smoke/CI pass is not truth.
- Feedback Event Aggregation Runtime v0.1:
  `docs/FEEDBACK_EVENT_AGGREGATION_RUNTIME_V0_1.md`,
  `lib/research-candidate-review/feedback-event-aggregation-runtime.ts`,
  `app/api/research-candidate/feedback-events/aggregation/route.ts`,
  `fixtures/feedback-event-aggregation-runtime.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-aggregation-runtime-v0-1.mjs`
  (`npm run smoke:feedback-event-aggregation-runtime-v0-1`) follows PR #791 Manual Anchors and prior feedback-to-rule slices. This slice is advisory aggregation only. Feedback is not truth. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. It does not add feedback write route, UI controls, DB write, state mutation, proof/evidence writes, product-write, Git Ledger export, provider calls, retrieval/RAG execution, source fetch, local/repository/uploaded file read as source input, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Feedback Event Aggregation Runtime v0.1; advisory aggregation only; feedback is not truth; feedback is not proof; feedback is not evidence; feedback is not promotion readiness; aggregation is not authority; pinned items stay visible but are not promoted; dismissed items lower display priority but are not deleted; corrected items show correction warning but do not mutate parser/rules; invalidated items require source/review follow-up and are not hard-deleted; needs-more-evidence creates review cue only; scope-overreach creates rule failure candidate only; same-origin POST aggregation route only; caller-provided public-safe feedback events only; no feedback write route, UI controls, DB write, candidate mutation, rule mutation, parser mutation, durable state mutation, Formation Receipt write, promotion execution, proof/evidence write, claim/evidence write, product write, product ID allocation, provider/OpenAI call, prompt sending, retrieval execution, RAG answer generation, source fetch, local/repository/uploaded file read as source input, Git Ledger export, Codex execution, or GitHub automation; product-write remains parked by #686.
- Feedback Event Aggregation Runtime Completion v0.1:
  `docs/FEEDBACK_EVENT_AGGREGATION_RUNTIME_COMPLETION_V0_1.md`,
  `lib/research-candidate-review/feedback-event-aggregation-runtime.ts`,
  `app/api/research-candidate/feedback-events/aggregation/route.ts`,
  `fixtures/feedback-event-aggregation-runtime-completion.sample.v0.1.json`,
  and `scripts/smoke-feedback-event-aggregation-runtime-completion-v0-1.mjs`
  (`npm run smoke:feedback-event-aggregation-runtime-completion-v0-1`) implements `feedback_event_aggregation_runtime_completion_v0_1` as the original Phase 5.5 feedback aggregation runtime completion. It adds bounded aggregation over persisted/caller-injected feedback event records in the existing feedback event store table, completion route handling, public-safe fixture coverage, docs, smoke, and package script while preserving the earlier caller-provided aggregation helper. Runtime validation blocks private/raw payloads, forbidden authority claims, and invalid input before DB/schema missing statuses, and forbidden authority scanning is recursive across full request/event payloads. This pointer is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. Aggregation is advisory only. Feedback is not truth. Pin is not promotion. Dismiss is not delete. Invalidate is not source suppression. Rule failure candidate is not rule mutation. Priority hint is not durable state. Candidate/durable distinction is preserved. Invalid feedback cannot suppress source visibility silently. This slice does not mutate rules, parsers, prompts, ranking, or surfacing; suppress sources; delete candidates; create proof/evidence; write claim/evidence; create work items; promote Perspective; write/apply durable state; write Formation Receipts; call providers; send prompts; fetch sources; execute retrieval/RAG; write retrieval indexes; generate RAG answers; execute Git/GitHub; execute Codex; product-write; allocate product IDs; or grant product-write authority. Product-write remains parked by #686. Smoke/CI pass is not truth.

  Boundary phrases: Feedback Event Aggregation Runtime Completion v0.1; `feedback_event_aggregation_runtime_completion_v0_1`; advisory aggregation only; persisted feedback event read; caller-injected DB only; explicit operator aggregation only; feedback is not truth; pin is not promotion; dismiss is not delete; invalidate is not source suppression; rule failure candidate is not rule mutation; priority hint is not durable state; candidate/durable boundary visible; source visibility warning visible; no rule mutation, parser mutation, prompt mutation, ranking mutation, surfacing mutation, source suppression, candidate deletion, proof/evidence write, claim/evidence write, work item write, Perspective promotion, durable state write/apply, Formation Receipt write, provider call, prompt sending, source fetch, retrieval/RAG execution, retrieval index write, RAG answer generation, Git/GitHub execution, Codex execution, product write, product ID allocation, or product-write authority; Product-write remains parked by #686; Smoke/CI pass is not truth.
- Feedback Controls Expansion v0.1:
  `docs/FEEDBACK_CONTROLS_EXPANSION_V0_1.md`,
  `components/feedback-event-expanded-controls.tsx`,
  `components/feedback-controls-expanded-audit-panel.tsx`,
  `components/agent-perspective-substrate-folded-audit-panel.tsx`,
  `fixtures/feedback-controls-expanded.sample.v0.1.json`,
  `scripts/smoke-feedback-controls-expanded-v0-1.mjs`,
  and `scripts/browser-validate-feedback-controls-expanded-v0-1.mjs`
  (`npm run smoke:feedback-controls-expanded-v0-1`,
  `npm run browser:feedback-controls-expanded-v0-1`) follows PR #792
  Feedback Event Aggregation Runtime. This slice is local UI intent only.
  Feedback is not truth. It preserves the existing Agent Perspective Substrate
  folded audit panel contract and does not replace existing folded preview
  fixture behavior; the existing Cockpit default panel remains fixture-backed.
  This pointer is repo-local documentation metadata, not SSOT. The roadmap
  guide is not SSOT. It does not add feedback write route, feedback
  persistence, DB write, candidate mutation, rule mutation, parser mutation,
  durable state mutation, proof/evidence writes, product-write, Git Ledger
  export, provider calls, retrieval/RAG execution, source fetch,
  local/repository/uploaded file read as source input, or product ID
  allocation. Product-write remains parked by #686.

  Boundary phrases: Feedback Controls Expansion v0.1; local UI intent only;
  feedback is not truth; feedback is not proof; feedback is not evidence;
  feedback is not promotion readiness; callback-only feedback intent emission;
  no feedback write route; no feedback persistence; no DB read/write; no
  candidate mutation; no candidate deletion; no promotion; no rule mutation;
  no parser mutation; no durable state mutation; no Formation Receipt write; no
  proof/evidence write; no claim/evidence write; no product write; no product
  ID allocation; no provider/OpenAI call; no prompt sending; no retrieval
  execution; no RAG answer generation; no source fetch; no
  local/repository/uploaded file read as source input; no Git Ledger export; no
  Codex execution; no GitHub automation; product-write remains parked by #686.
- Feedback Controls Expansion Runtime Completion v0.1:
  `docs/FEEDBACK_CONTROLS_EXPANSION_RUNTIME_COMPLETION_V0_1.md`,
  `lib/research-candidate-review/feedback-event-write-runtime.ts`,
  `app/api/research-candidate/feedback-events/route.ts`,
  `components/feedback-event-expanded-controls.tsx`,
  `fixtures/feedback-controls-expansion-runtime-completion.sample.v0.1.json`,
  and `scripts/smoke-feedback-controls-expansion-runtime-completion-v0-1.mjs`
  (`npm run smoke:feedback-controls-expansion-runtime-completion-v0-1`)
  implements `feedback_controls_expansion_runtime_completion_v0_1` as the
  original Phase 5.6 feedback controls runtime completion. It closes the gap
  left by callback-only controls by adding route-backed feedback event
  persistence through same-origin `POST /api/research-candidate/feedback-events`
  with an allowlisted caller-injected SQLite DB path. Callback-only mode remains
  compatible. Feedback controls write bounded feedback events only after
  explicit operator action. Feedback is not truth. Pin is not promotion. Dismiss
  is not delete. Invalidate is not source suppression. Correct does not mutate
  parser/rules. Scope-overreach and needs-more-evidence create review signals
  only. This slice does not mutate rules, parsers, prompts, ranking, or
  surfacing; suppress sources; delete candidates; create proof/evidence; write
  claim/evidence; create work items; promote Perspective; write/apply durable
  state; write Formation Receipts; call providers; send prompts; fetch sources;
  execute retrieval/RAG; write retrieval indexes; generate RAG answers; execute
  Git/GitHub; execute Codex; product-write; allocate product IDs; or grant
  product-write authority. Product-write remains parked by #686. Smoke/CI pass
  is not truth.

  Boundary phrases: Feedback Controls Expansion Runtime Completion v0.1;
  `feedback_controls_expansion_runtime_completion_v0_1`; route-backed feedback
  event persistence; same-origin POST only; explicit operator feedback action
  only; caller-injected DB only; callback compatibility preserved; advisory
  signal only; feedback is not truth; pin is not promotion; dismiss is not
  delete; invalidate is not source suppression; correct does not mutate parser
  or rules; no rule mutation, parser mutation, prompt mutation, ranking
  mutation, surfacing mutation, source suppression, candidate deletion,
  proof/evidence write, claim/evidence write, work item write, Perspective
  promotion, durable state write/apply, Formation Receipt write, provider call,
  prompt sending, source fetch, retrieval/RAG execution, retrieval index write,
  RAG answer generation, Git/GitHub execution, Codex execution, product write,
  product ID allocation, or product-write authority; Product-write remains
  parked by #686; Smoke/CI pass is not truth.
- Feedback Influenced Surfacing Preview v0.1:
  `docs/FEEDBACK_INFLUENCED_SURFACING_PREVIEW_V0_1.md`,
  `lib/research-candidate-review/feedback-influenced-surfacing-preview.ts`,
  `components/feedback-influenced-surfacing-preview-panel.tsx`,
  `fixtures/feedback-influenced-surfacing-preview.sample.v0.1.json`,
  `scripts/smoke-feedback-influenced-surfacing-preview-v0-1.mjs`,
  and `scripts/browser-validate-feedback-influenced-surfacing-preview-v0-1.mjs`
  (`npm run smoke:feedback-influenced-surfacing-preview-v0-1`,
  `npm run browser:feedback-influenced-surfacing-preview-v0-1`) follows PR
  #792 Feedback Event Aggregation Runtime and PR #793 Feedback Controls
  Expansion. This slice is preview-only and advisory only. Feedback is not
  truth. Feedback is not proof, evidence, or promotion readiness. This pointer
  is repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT.
  It does not add feedback write route, feedback persistence, DB write,
  candidate mutation, candidate deletion, candidate auto-hide, promotion, rule
  mutation, parser mutation, durable state mutation, proof/evidence writes,
  product-write, Git Ledger export, provider calls, retrieval/RAG execution,
  source fetch, local/repository/uploaded file read as source input, or product
  ID allocation. Product-write remains parked by #686.

  Boundary phrases: Feedback Influenced Surfacing Preview v0.1; preview-only;
  advisory only; feedback is not truth; feedback is not proof; feedback is not
  evidence; feedback is not promotion readiness; surfacing preview is not
  authority; pin/useful feedback can elevate display hint but cannot promote;
  dismiss/wrong feedback can lower display hint but cannot delete;
  correction/invalidation feedback creates review warning only;
  needs-more-evidence creates review cue only; scope-overreach creates rule
  review cue only; rule failure candidates are review aids; candidate overlay
  hints are display hints only; source refs are lineage pointers, not proof;
  source refs must be public-safe symbolic refs; no feedback write route; no
  feedback persistence; no DB read/write; no candidate mutation; no candidate
  deletion; no candidate auto-hide; no promotion; no rule mutation; no parser
  mutation; no durable state mutation; no Formation Receipt write; no
  proof/evidence write; no claim/evidence write; no product write; no product
  ID allocation; no provider/OpenAI call; no prompt sending; no retrieval
  execution; no RAG answer generation; no source fetch; no
  local/repository/uploaded file read as source input; no Git Ledger export; no
  Codex execution; no GitHub automation; product-write remains parked by #686.
- Feedback Influenced Surfacing Preview Runtime Completion v0.1:
  `docs/FEEDBACK_INFLUENCED_SURFACING_PREVIEW_RUNTIME_COMPLETION_V0_1.md`,
  `lib/research-candidate-review/feedback-influenced-surfacing-preview.ts`,
  `app/api/research-candidate/feedback-events/surfacing-preview/route.ts`,
  `components/feedback-influenced-surfacing-preview-panel.tsx`,
  `fixtures/feedback-influenced-surfacing-preview-runtime-completion.sample.v0.1.json`,
  and
  `scripts/smoke-feedback-influenced-surfacing-preview-runtime-completion-v0-1.mjs`
  (`npm run smoke:feedback-influenced-surfacing-preview-runtime-completion-v0-1`)
  implements `feedback_influenced_surfacing_preview_runtime_completion_v0_1`
  as the runtime completion for original Phase 5.7. It closes the earlier
  non-DB-backed surfacing preview gap by reading DB-backed feedback aggregation
  output and producing advisory surfacing previews only. Feedback is not truth.
  Priority hint is not ranking mutation. Surfacing preview is not surfacing
  mutation. Pin is not promotion. Dismiss is not delete. Invalidate is not
  source suppression. Rule failure candidate is review-only and not rule
  mutation. It does not mutate rules, parsers, prompts, ranking, surfacing,
  suppress sources, delete candidates, create proof/evidence, write
  claim/evidence, create work items, promote Perspective, write/apply durable
  state, write Formation Receipts, call providers, send prompts, fetch sources,
  execute retrieval/RAG, write retrieval indexes, generate RAG answers, execute
  Git/GitHub, execute Codex, product-write, allocate product IDs, or grant
  product-write authority. Product-write remains parked by #686. Smoke/CI pass
  is not truth. The roadmap guide is not SSOT.
- Dogfooding Record Runtime Contract v0.1:
  `docs/DOGFOODING_RECORD_RUNTIME_CONTRACT_V0_1.md`,
  `types/dogfooding-record-runtime-contract.ts`,
  `fixtures/dogfooding-record-runtime-contract.sample.v0.1.json`,
  and `scripts/smoke-dogfooding-record-runtime-contract-v0-1.mjs`
  (`npm run smoke:dogfooding-record-runtime-contract-v0-1`) follows PR #792
  through PR #794 feedback and surfacing slices. This slice is contract-only.
  Dogfooding records are bounded review records. This pointer is repo-local
  documentation metadata, not SSOT. The roadmap guide is not SSOT. It does not
  add dogfooding ingestion runtime, dogfooding write route, dogfooding read
  route, DB read/write, browser log ingestion, session log ingestion, raw
  conversation ingestion, telemetry ingestion, durable state mutation, Formation
  Receipt write, promotion execution, proof/evidence writes, claim/evidence
  writes, product-write, Git Ledger export, provider calls, retrieval/RAG
  execution, source fetch, local/repository/uploaded file read as source input,
  Codex execution, GitHub automation, or product ID allocation. Product-write
  remains parked by #686.

  Boundary phrases: Dogfooding Record Runtime Contract v0.1; contract-only;
  bounded review records; dogfooding records are not raw conversation logs;
  dogfooding records are not hidden reasoning; dogfooding records are not
  telemetry dumps; dogfooding records are not truth; dogfooding records are not
  proof; dogfooding records are not promotion readiness; product-write requests
  are review cues only; product-write requests do not execute product-write; no
  dogfooding ingestion runtime; no dogfooding write route; no dogfooding read
  route; no DB read/write; no browser log ingestion; no session log ingestion;
  no raw conversation ingestion; no telemetry ingestion; no durable state
  mutation; no Formation Receipt write; no promotion execution; no
  proof/evidence write; no claim/evidence write; no product write; no product
  ID allocation; no provider/OpenAI call; no prompt sending; no retrieval
  execution; no RAG answer generation; no source fetch; no
  local/repository/uploaded file read as source input; no Git Ledger export; no
  Codex execution; no GitHub automation; product-write remains parked by #686.
- Dogfooding Ingestion Runtime v0.1:
  `docs/DOGFOODING_INGESTION_RUNTIME_V0_1.md`,
  `lib/dogfooding/dogfooding-ingestion-runtime.ts`,
  `lib/dogfooding/dogfooding-record-store.ts`,
  `app/api/dogfooding/records/route.ts`,
  `fixtures/dogfooding-ingestion-runtime.sample.v0.1.json`, and
  `scripts/smoke-dogfooding-ingestion-runtime-v0-1.mjs`
  (`npm run smoke:dogfooding-ingestion-runtime-v0-1`) follows PR #795
  Dogfooding Record Runtime Contract. This slice ingests bounded summaries only
  after explicit operator action. This pointer is repo-local documentation
  metadata, not SSOT. The roadmap guide is not SSOT. It does not ingest raw
  conversations, hidden reasoning, telemetry dumps, browser logs, session logs,
  private files, external analytics, raw source bodies, raw provider output, raw
  retrieval output, raw feedback payloads, raw surfacing payloads, or raw
  dogfooding payloads. It does not mutate durable Perspective state, write
  Formation Receipts, execute promotion, create proof/evidence, write
  claim/evidence records, execute product-write, allocate product IDs, call
  providers, send prompts, execute retrieval/RAG, fetch sources, export Git
  Ledger data, execute Codex, or automate GitHub. Product-write remains parked
  by #686.

  Boundary phrases: Dogfooding Ingestion Runtime v0.1; bounded summaries only;
  explicit operator action required; dogfooding records are not truth;
  dogfooding records are not proof; dogfooding records are not promotion
  readiness; product-write requests are review cues only; product-write
  requests do not execute product-write; no raw conversation ingestion; no
  hidden reasoning ingestion; no telemetry ingestion; no browser log ingestion;
  no session log ingestion; no private file read; no source fetch; no durable
  state mutation; no Formation Receipt write; no promotion execution; no
  proof/evidence write; no claim/evidence write; no product write; no product
  ID allocation; no provider/OpenAI call; no prompt sending; no retrieval
  execution; no RAG answer generation; no Git Ledger export; no Codex
  execution; no GitHub automation; product-write remains parked by #686.
- Dogfooding Research Record Runtime v0.1:
  `docs/DOGFOODING_RESEARCH_RECORD_RUNTIME_V0_1.md`,
  `types/dogfooding-research-record-runtime-contract.ts`,
  `lib/dogfooding/dogfooding-record-store.ts`,
  `app/api/dogfooding/research-records/route.ts`,
  `fixtures/dogfooding-research-record-runtime.sample.v0.1.json`, and
  `scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs`
  (`npm run smoke:dogfooding-research-record-runtime-v0-1`) implements the
  post-#870 selected non-UI slice
  `dogfooding_record_runtime_store_route_v0_1`. PR #868 remains the frozen web
  baseline for `/`, `/perspective`, and `/workbench`. This slice adds no UI.
  Dogfooding research records are candidate-only review material. PR body is
  not truth. Changed files are not proof. Validation pass is not approval.
  Validation failure is not automatic rejection. Smoke pass is not evidence.
  Smoke failure is diagnostic, not automatic rejection. CI pass is not
  authority. CI failure is diagnostic, not automatic rejection. Codex result is
  not execution approval. Git refs and GitHub PR refs are references only.
  Product-write remains parked by #686.

  Boundary phrases: same-origin POST only; caller-injected local test DB only;
  GET is read-only; no UI; no components; no Cockpit change; no public-surface
  change; no route model change for `/`, `/perspective`, or `/workbench`; no
  browser-validation-only work; no provider/OpenAI call; no prompt sent; no
  source fetch; no retrieval execution; no retrieval index write; no
  proof/evidence creation; no claim/evidence write; no promotion execution; no
  Formation Receipt write; no durable Perspective state apply; no
  product-write; no product ID allocation; no Codex execution from Augnes
  runtime; no GitHub API call from Augnes runtime; no Git/GitHub actuation from
  Augnes runtime; no release, deploy, or publish behavior. Next recommended
  slice: `codex_result_report_to_dogfooding_record_binding_v0_1`.
- Codex Result To Dogfooding Record Binding v0.1:
  `docs/CODEX_RESULT_TO_DOGFOODING_RECORD_BINDING_V0_1.md`,
  `lib/dogfooding/codex-result-to-dogfooding-record.ts`,
  `fixtures/codex-result-to-dogfooding-record.sample.v0.1.json`, and
  `scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs`
  (`npm run smoke:codex-result-to-dogfooding-record-v0-1`) implements
  `codex_result_report_to_dogfooding_record_binding_v0_1`. PR #868 remains the
  frozen web baseline for `/`, `/perspective`, and `/workbench`. PR #871
  provides the dogfooding research record runtime used by this binding. This
  slice adds no UI. Codex reports become candidate-only dogfooding research
  record input. Codex report to dogfooding record is not proof. Codex report to
  dogfooding record is not accepted evidence. Codex report to dogfooding record
  is not Review Memory write. Codex report to dogfooding record is not
  promotion, Formation Receipt, durable Perspective state, or product-write.
  Codex report is not execution approval. PR body is not truth. Changed files
  are not proof. Validation pass is not approval. Validation failure is not
  automatic rejection. Smoke pass is not evidence. Smoke failure is diagnostic,
  not automatic rejection. CI pass is not authority. CI failure is diagnostic,
  not automatic rejection. Git refs and GitHub PR refs are references only.
  Product-write remains parked by #686.

  Boundary phrases: binding/conversion helper only; existing Codex result
  normalizer first for raw caller input; existing dogfooding research record
  input contract reused; no UI; no components; no Cockpit change; no
  public-surface change; no route model change for `/`, `/perspective`, or
  `/workbench`; no browser-validation-only work; no new API route; no DB
  migration; no provider/OpenAI call; no prompt sent; no source fetch; no
  retrieval execution; no retrieval index write; no proof/evidence creation; no
  claim/evidence write; no Review Memory write; no promotion execution; no
  Formation Receipt write; no durable Perspective state apply; no product-write;
  no product ID allocation; no Codex execution from Augnes runtime; no GitHub API
  call from Augnes runtime; no Git/GitHub actuation from Augnes runtime; no
  release, deploy, or publish behavior. Next recommended slice:
  `conversation_handoff_packet_builder_v0_2`.
- Conversation Handoff Packet Builder v0.2:
  `docs/CONVERSATION_HANDOFF_PACKET_BUILDER_V0_2.md`,
  `types/conversation-handoff-packet.ts`,
  `lib/handoff/build-conversation-handoff-packet.ts`,
  `fixtures/conversation-handoff-packet.sample.v0.2.json`, and
  `scripts/smoke-conversation-handoff-packet-v0-2.mjs`
  (`npm run smoke:conversation-handoff-packet-v0-2`) implements
  `conversation_handoff_packet_builder_v0_2`. PR #868 remains the frozen web
  baseline for `/`, `/perspective`, and `/workbench`. PR #872 provides Codex
  result to dogfooding record binding context for handoff. This slice adds no
  UI. Handoff packets are candidate-only conversation/workflow guidance, not
  execution approval. Handoff packet is not truth, proof, or accepted evidence.
  Expected files are not write authority. Observed files are not proof. Expected
  checks are not proof. Observed checks are not approval. Validation pass is not
  approval. Validation failure is not automatic rejection. Smoke pass is not
  evidence. Smoke failure is diagnostic, not automatic rejection. CI pass is not
  authority. CI failure is diagnostic, not automatic rejection. PR body is not
  authority. Codex report is not execution approval. Dogfooding record is
  candidate-only review material. Review Memory refs, Promotion/Receipt/State
  refs, Git refs, and GitHub PR refs are references only. Next recommended slice
  is not execution approval. Product-write remains parked by #686.

  Boundary phrases: helper-only packet builder; caller-provided public-safe
  summaries only; no raw source bodies; no raw provider output; no raw retrieval
  output; no raw DB rows; no raw conversations; no hidden reasoning; no UI; no
  components; no Cockpit change; no public-surface change; no route model change
  for `/`, `/perspective`, or `/workbench`; no browser-validation-only work; no
  new API route; no DB migration; no provider/OpenAI call; no prompt sent; no
  source fetch; no retrieval execution; no retrieval index write; no
  proof/evidence creation; no claim/evidence write; no Review Memory write; no
  promotion execution; no Formation Receipt write; no durable Perspective state
  apply; no product-write; no product ID allocation; no Codex execution from
  Augnes runtime; no GitHub API call from Augnes runtime; no Git/GitHub
  actuation from Augnes runtime; no release, deploy, or publish behavior. Next
  recommended slice:
  `conversation_handoff_packet_from_dogfooding_record_v0_1`.
- Conversation Handoff From Dogfooding Record v0.1:
  `docs/CONVERSATION_HANDOFF_FROM_DOGFOODING_RECORD_V0_1.md`,
  `lib/handoff/build-handoff-from-dogfooding-record.ts`,
  `fixtures/conversation-handoff-from-dogfooding-record.sample.v0.1.json`, and
  `scripts/smoke-conversation-handoff-from-dogfooding-record-v0-1.mjs`
  (`npm run smoke:conversation-handoff-from-dogfooding-record-v0-1`) implements
  `conversation_handoff_packet_from_dogfooding_record_v0_1`. PR #868 remains
  the frozen web baseline for `/`, `/perspective`, and `/workbench`. PR #873
  provides the conversation handoff packet builder used by this slice. This
  slice adds no UI. Dogfooding records become candidate-only handoff packet
  input, not execution approval. Dogfooding record to handoff packet is not
  truth, proof, accepted evidence, Review Memory write, promotion, Formation
  Receipt, durable Perspective state, or product-write. Handoff packet is
  candidate-only conversation/workflow guidance. PR body is not truth. Changed
  files are not proof. Observed files are not proof. Validation pass is not
  approval. Validation failure is not automatic rejection. Smoke pass is not
  evidence. Smoke failure is diagnostic, not automatic rejection. CI pass is not
  authority. CI failure is diagnostic, not automatic rejection. Skipped checks
  are review context, not failure by themselves. Known warnings are review
  context, not automatic rejection. Not-done items are next-task cues, not
  automatic task creation. Expected/observed delta is reconciliation context,
  not approval or rejection. Review Memory refs, Promotion/Receipt/State refs,
  Git refs, and GitHub PR refs are references only. Next recommended slice is
  not execution approval. Product-write remains parked by #686.

  Boundary phrases: helper-only dogfooding-record-to-packet conversion;
  caller-provided public-safe dogfooding summaries only; no raw DB rows; no raw
  source bodies; no raw provider output; no raw retrieval output; no raw
  conversations; no hidden reasoning; no UI; no components; no Cockpit change;
  no public-surface change; no route model change for `/`, `/perspective`, or
  `/workbench`; no browser-validation-only work; no new API route; no DB
  migration; no DB write; no direct DB read; no provider/OpenAI call; no prompt
  sent; no source fetch; no retrieval execution; no retrieval index write; no
  proof/evidence creation; no claim/evidence write; no Review Memory write; no
  promotion execution; no Formation Receipt write; no durable Perspective state
  apply; no product-write; no product ID allocation; no Codex execution from
  Augnes runtime; no GitHub API call from Augnes runtime; no Git/GitHub
  actuation from Augnes runtime; no release, deploy, or publish behavior. Next
  recommended slice: `dogfooding_record_to_review_memory_proposal_v0_1`.
- Dogfooding To Review Memory Proposal v0.1:
  `docs/DOGFOODING_TO_REVIEW_MEMORY_PROPOSAL_V0_1.md`,
  `types/dogfooding-to-review-memory-proposal.ts`,
  `lib/dogfooding/build-review-memory-proposal.ts`,
  `fixtures/dogfooding-to-review-memory-proposal.sample.v0.1.json`, and
  `scripts/smoke-dogfooding-to-review-memory-proposal-v0-1.mjs`
  (`npm run smoke:dogfooding-to-review-memory-proposal-v0-1`) implements
  `dogfooding_record_to_review_memory_proposal_v0_1`. PR #868 remains the
  frozen web baseline for `/`, `/perspective`, and `/workbench`. PR #874
  provides dogfooding record to handoff packet binding context. This slice adds
  no UI. Dogfooding records become candidate-only Review Memory proposal
  candidates, not Review Memory writes. Dogfooding record to Review Memory
  proposal is not truth, proof, accepted evidence, Review Memory write,
  execution approval, promotion, Formation Receipt, durable Perspective state,
  or product-write. Review Memory proposal is candidate-only and is not saved
  Review Memory. Operator confirmation is required before any Review Memory
  write. Proposed review actions are not executed actions. Changed files are
  not proof. Observed files are not proof. Validation pass is not approval.
  Validation failure is not automatic rejection. Smoke pass is not evidence.
  Smoke failure is diagnostic, not automatic rejection. CI pass is not
  authority. CI failure is diagnostic, not automatic rejection. Skipped checks
  are review context, not failure by themselves. Known warnings are review
  context, not automatic rejection. Not-done items are next-task cues, not
  automatic task creation. Expected/observed delta is reconciliation context,
  not approval or rejection. Review Memory refs, Promotion/Receipt/State refs,
  Git refs, and GitHub PR refs are references only. Product-write remains
  parked by #686.

  Boundary phrases: helper-only dogfooding-record-to-proposal conversion;
  caller-provided public-safe dogfooding summaries only; preview-only Review
  Memory write shape; operator confirmation required; no raw DB rows; no raw
  source bodies; no raw provider output; no raw retrieval output; no raw
  conversations; no hidden reasoning; no UI; no components; no Cockpit change;
  no public-surface change; no route model change for `/`, `/perspective`, or
  `/workbench`; no browser-validation-only work; no new API route; no DB
  migration; no DB write; no direct DB read; no provider/OpenAI call; no prompt
  sent; no source fetch; no retrieval execution; no retrieval index write; no
  proof/evidence creation; no claim/evidence write; no Review Memory write; no
  promotion execution; no Formation Receipt write; no durable Perspective state
  apply; no product-write; no product ID allocation; no Codex execution from
  Augnes runtime; no GitHub API call from Augnes runtime; no Git/GitHub
  actuation from Augnes runtime; no release, deploy, or publish behavior. Next
  recommended slice: `local_data_export_manifest_builder_v0_1`.
- Local Data Export Manifest Builder v0.1:
  `docs/LOCAL_DATA_EXPORT_MANIFEST_BUILDER_V0_1.md`,
  `types/local-data-export-manifest.ts`,
  `lib/local-export/build-local-data-export-manifest.ts`,
  `fixtures/local-data-export-manifest.sample.v0.1.json`, and
  `scripts/smoke-local-data-export-manifest-builder-v0-1.mjs`
  (`npm run smoke:local-data-export-manifest-builder-v0-1`) implements
  `local_data_export_manifest_builder_v0_1`. PR #868 remains the frozen web
  baseline for `/`, `/perspective`, and `/workbench`. PR #875 provides
  dogfooding to Review Memory proposal context. This slice adds no UI. Local
  export manifests are candidate-only public-safe summaries, not export files
  or import approval. Local data export manifest is not truth, proof, accepted
  evidence, file write approval, product readiness, or release readiness. Export
  item summaries are not raw data or canonical source bodies. Import preview is
  not import apply. Manifest fingerprint is not proof or approval. Dogfooding
  records remain candidate summaries. Review Memory summaries are references
  only. Review Memory proposals are candidate-only. Promotion decision refs,
  Formation Receipt refs, Git Ledger packet refs, Git refs, and GitHub PR refs
  are references only. Durable state summaries are summaries only. Validation
  pass is not approval. Validation failure is not automatic rejection. Smoke
  pass is not evidence. Smoke failure is diagnostic, not automatic rejection. CI
  pass is not authority. CI failure is diagnostic, not automatic rejection.
  Skipped checks are review context, not failure by themselves. Known warnings
  are review context, not automatic rejection. Not-done items are next-task
  cues, not automatic task creation. Expected/observed delta is reconciliation
  context, not approval or rejection. Product-write remains parked by #686.

  Boundary phrases: helper-only local data export manifest candidate builder;
  caller-provided public-safe summaries only; redacted-with-warnings preserves
  reference-only public-safe summaries without unsafe raw echo; no raw DB rows;
  no raw source bodies; no raw provider output; no raw retrieval output; no raw
  conversations; no hidden reasoning; no UI; no components; no Cockpit change;
  no public-surface change; no route model change for `/`, `/perspective`, or
  `/workbench`; no browser-validation-only work; no new API route; no DB
  migration; no DB write; no direct DB read; no local file write; no local file
  read; no import apply; no provider/OpenAI call; no prompt sent; no source
  fetch; no retrieval execution; no retrieval index write; no proof/evidence
  creation; no claim/evidence write; no Review Memory write; no promotion
  execution; no promotion decision creation from export manifest; no Formation
  Receipt write; no durable Perspective state apply; no product-write; no
  product ID allocation; no Codex execution from Augnes runtime; no GitHub API
  call from Augnes runtime; no Git/GitHub actuation from Augnes runtime; no
  release, deploy, or publish behavior. Next recommended slice:
  `git_ledger_export_manifest_binding_v0_1`.
- Git Ledger Export From Local Manifest v0.1:
  `docs/GIT_LEDGER_EXPORT_FROM_LOCAL_MANIFEST_V0_1.md`,
  `lib/git-ledger/build-export-packet-from-local-manifest.ts`,
  `fixtures/git-ledger-export-from-local-manifest.sample.v0.1.json`, and
  `scripts/smoke-git-ledger-export-from-local-manifest-v0-1.mjs`
  (`npm run smoke:git-ledger-export-from-local-manifest-v0-1`) implements
  `git_ledger_export_manifest_binding_v0_1`. PR #868 remains the frozen web
  baseline for `/`, `/perspective`, and `/workbench`. PR #876 provides local
  export manifest candidate context. This slice adds no UI. Git Ledger packets
  are candidate-only text packets, not Git/GitHub actuation. Suggested commit
  message is not approval. Suggested commit intent is not execution approval.
  Packet hash is not truth, proof, or approval. Idempotency key is not
  approval. Local data export manifest is candidate-only, not an export file,
  and not import approval. Manifest fingerprint is not proof. Manifest status
  is not product/release readiness. Export item summary is not raw data. Import
  preview is not import apply. Git refs and GitHub PR refs are references only.
  Validation pass is not approval. Validation failure is not automatic
  rejection. Smoke pass is not evidence. Smoke failure is diagnostic, not
  automatic rejection. CI pass is not authority. CI failure is diagnostic, not
  automatic rejection. Skipped checks are review context, not failure by
  themselves. Known warnings are review context, not automatic rejection.
  Not-done items are next-task cues, not automatic task creation.
  Expected/observed delta is reconciliation context, not approval or rejection.
  Product-write remains parked by #686.

  Boundary phrases: helper-only Git Ledger export packet candidate binding from
  caller-provided public-safe local data export manifest candidates; no raw DB
  rows; no raw source bodies; no raw provider output; no raw retrieval output;
  no raw conversations; no hidden reasoning; no UI; no components; no Cockpit
  change; no public-surface change; no route model change for `/`,
  `/perspective`, or `/workbench`; no browser-validation-only work; no new API
  route; no DB migration; no DB write; no direct DB read; no local file write;
  no local file read; no import apply; no provider/OpenAI call; no prompt sent;
  no source fetch; no retrieval execution; no retrieval index write; no
  proof/evidence creation; no claim/evidence write; no Review Memory write; no
  promotion execution; no promotion decision creation from Git Ledger packet; no
  Formation Receipt write; no durable Perspective state apply; no product-write;
  no product ID allocation; no Codex execution from Augnes runtime; no GitHub
  API call from Augnes runtime; no Git branch, commit, PR, merge, or tag
  creation from Augnes runtime; no Git/GitHub actuation from Augnes runtime; no
  release, deploy, or publish behavior. Next recommended slice:
  `selected_runtime_audit_event_store_v0_1`.
- Selected Runtime Audit Event Store v0.1:
  `docs/SELECTED_RUNTIME_AUDIT_EVENT_STORE_V0_1.md`,
  `types/runtime-audit-event.ts`,
  `lib/runtime-audit/audit-event-store.ts`,
  `fixtures/selected-runtime-audit-event-store.sample.v0.1.json`, and
  `scripts/smoke-selected-runtime-audit-event-store-v0-1.mjs`
  (`npm run smoke:selected-runtime-audit-event-store-v0-1`) implements
  `selected_runtime_audit_event_store_v0_1`. PR #868 remains the frozen web
  baseline for `/`, `/perspective`, and `/workbench`. PR #877 provides Git
  Ledger packet candidate context. This slice adds no UI. Runtime audit events
  are public-safe records of selected event summaries, not proof, approval,
  product readiness, release readiness, or authority. Audit event fingerprint is
  not proof or approval. Linked refs are references only. Validation pass is
  not approval. Validation failure is not automatic rejection. CI pass is not
  authority. Skipped checks are review context, not failure by themselves.
  Known warnings are review context, not automatic rejection. Expected/observed
  delta is reconciliation context, not approval or rejection.

  Boundary phrases: selected runtime audit event store/helper only;
  caller-injected local test DB only; schema SQL only; no UI; no components; no
  Cockpit change; no public-surface change; no route model change for `/`,
  `/perspective`, or `/workbench`; no browser-validation-only work; no new API
  route; no broad all-route instrumentation; no DB migration; no global DB
  config; no local file write; no local file read; no import apply; no
  provider/OpenAI call; no prompt sent; no source fetch; no retrieval execution;
  no retrieval index write; no raw request body storage; no raw response body
  storage; no raw terminal log storage; no proof/evidence creation; no
  claim/evidence write; no Review Memory write; no promotion execution; no
  Formation Receipt write; no durable Perspective state apply; no
  product-write; no product ID allocation; no Codex execution from Augnes
  runtime; no GitHub API call from Augnes runtime; no Git/GitHub actuation from
  Augnes runtime; no tag creation; no release, deploy, or publish behavior.
  Next recommended slice: `release_readiness_matrix_post_868_non_ui_v0_1`.
- Release Readiness Matrix Post-#868 Non-UI v0.1:
  `docs/RELEASE_READINESS_MATRIX_POST_868_NON_UI_V0_1.md`,
  `fixtures/release-readiness-matrix-post-868-non-ui.sample.v0.1.json`, and
  `scripts/smoke-release-readiness-matrix-post-868-non-ui-v0-1.mjs`
  (`npm run smoke:release-readiness-matrix-post-868-non-ui-v0-1`) implements
  `release_readiness_matrix_post_868_non_ui_v0_1`. PR #868 remains the frozen
  web baseline for `/`, `/perspective`, and `/workbench`. PR #878 provides
  selected runtime audit event store context. This slice adds no UI. The
  release/readiness matrix is review-only and does not approve release, deploy,
  publish, product readiness, proof/evidence readiness, or authority. It
  records the v0.3 non-UI core/handoff/conversation sequence through selected
  runtime audit event store as repo artifacts, pending operator decision.
  Product-write, GitHub/Git actuation, live provider calls, source fetch,
  retrieval expansion, and release/deploy/publish execution remain blocked
  unless separately approved. UI, Cockpit, browser-validation-only,
  public-surface, route IA polish, mobile viewport polish, and read/display-only
  UI expansion remain Web-last backlog. Matrix fingerprint is not proof or
  approval. Readiness classification is not execution approval. Skipped checks
  and known warnings are review context only. Not-done items are next-planning
  cues only.

  Boundary phrases: static matrix document, fixture, and smoke only; repo-
  grounded public-safe summaries only; no UI; no components; no Cockpit change;
  no public-surface change; no route model change for `/`, `/perspective`, or
  `/workbench`; no browser-validation-only work; no new API route; no broad
  route instrumentation; no DB migration; no global DB config; no DB write; no
  direct DB read; no local file write; no local file read; no import apply; no
  provider/OpenAI call; no prompt sent; no source fetch; no retrieval execution;
  no retrieval index write; no raw request body storage; no raw response body
  storage; no raw terminal log storage; no raw source body storage; no raw
  provider output storage; no raw retrieval output storage; no raw DB row
  storage; no raw conversation storage; no hidden reasoning storage; no
  proof/evidence creation; no claim/evidence write; no Review Memory write; no
  promotion execution; no Formation Receipt write; no durable Perspective state
  apply; no product-write; no product ID allocation; no Codex execution from
  Augnes runtime; no GitHub API call from Augnes runtime; no Git/GitHub
  actuation from Augnes runtime; no tag creation; no release, deploy, or publish
  behavior. Next recommended slice:
  `no_next_slice_v0_3_core_sequence_complete_pending_operator_decision`.
- Runtime Audit Panel v0.1:
  `docs/RUNTIME_AUDIT_PANEL_V0_1.md`,
  `lib/runtime-audit/build-runtime-audit-model.ts`,
  `components/runtime-audit-panel.tsx`,
  `fixtures/runtime-audit-panel.sample.v0.1.json`,
  `scripts/smoke-runtime-audit-panel-v0-1.mjs`, and
  `scripts/browser-validate-runtime-audit-panel-v0-1.mjs`
  (`npm run smoke:runtime-audit-panel-v0-1`,
  `npm run browser:runtime-audit-panel-v0-1`) follows PR #786 through PR
  #796. This slice is a read-only audit panel. Audit is review cue not truth.
  This pointer is repo-local documentation metadata, not SSOT. The roadmap
  guide is not SSOT. It does not add audit persistence, audit routes, route
  calls, fetch, DB read/write, durable Perspective state mutation, Formation
  Receipt writes, promotion execution, proof/evidence writes, claim/evidence
  writes, product-write, product ID allocation, provider calls, prompt sending,
  retrieval/RAG execution, source fetch, browser log ingestion, session log
  ingestion, raw conversation ingestion, telemetry ingestion, Git Ledger export,
  Codex execution, or GitHub automation. Product-write remains parked by #686.
- Runtime Audit Panel Runtime Completion v0.1:
  `docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md`,
  `lib/runtime-audit/audit-event-store.ts`,
  `lib/runtime-audit/build-runtime-audit-model.ts`,
  `app/api/runtime-audit/events/route.ts`,
  `components/runtime-audit-panel.tsx`,
  `fixtures/runtime-audit-panel-runtime-completion.sample.v0.1.json`, and
  `scripts/smoke-runtime-audit-panel-runtime-completion-v0-1.mjs`
  (`npm run smoke:runtime-audit-panel-runtime-completion-v0-1`) implements
  `runtime_audit_panel_runtime_completion_v0_1` as DB-backed bounded audit
  event persistence/read plus read-only panel binding. It closes the earlier
  caller-provided audit-items-only gap while keeping audit events as bounded
  review records only. Audit events are not truth, proof, approval, durable
  state, or product-write authority. This slice does not store raw request
  bodies, raw response bodies, terminal logs, browser dumps, hidden reasoning,
  raw provider output, or raw retrieval output. It does not call providers, send
  prompts, fetch sources, execute retrieval/RAG, write retrieval indexes,
  generate RAG answers, create proof/evidence, write claim/evidence records,
  create work items, promote Perspective, write/apply durable Perspective state,
  write Formation Receipts, execute Git/GitHub, execute Codex, product-write, or
  allocate product IDs. Product-write remains parked by #686. Smoke/CI pass is
  not truth. The roadmap guide is not SSOT.
- Runtime Audit Selected Route Instrumentation v0.1:
  `docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_1.md`,
  `lib/runtime-audit/route-audit-instrumentation.ts`,
  `app/api/research-source/intake/route.ts`,
  `app/api/research-candidate-review/provider-extraction/route.ts`,
  `app/api/research-retrieval/rag-context-preview/route.ts`,
  `app/api/research-candidate/feedback-events/route.ts`,
  `app/api/research-candidate/feedback-events/surfacing-preview/route.ts`,
  `fixtures/runtime-audit-selected-route-instrumentation.sample.v0.1.json`,
  and `scripts/smoke-runtime-audit-selected-route-instrumentation-v0-1.mjs`
  (`npm run smoke:runtime-audit-selected-route-instrumentation-v0-1`)
  implements `runtime_audit_selected_route_instrumentation_v0_1` as a narrow
  first instrumentation pass after Runtime Audit Panel Runtime Completion.
  Selected explicit runtime routes optionally emit bounded audit events only
  when top-level `audit_db_path` is supplied. Missing `audit_db_path` leaves
  primary route behavior unchanged. Audit write failure does not fail the
  primary route. Audit events are bounded review records only; they are not
  truth, proof, approval, durable state, or product-write authority. This slice
  does not store raw request/response bodies, terminal logs, browser dumps,
  hidden reasoning, raw provider output, or raw retrieval output. It does not
  create proof/evidence, write claim/evidence records, create work items,
  promote Perspective, write/apply durable Perspective state, write Formation
  Receipts, execute Git/GitHub, execute Codex, product-write, allocate product
  IDs, or grant product-write authority. Product-write remains parked by #686.
  Smoke/CI pass is not truth. The roadmap guide is not SSOT.

  Boundary phrases: Runtime Audit Panel v0.1; read-only audit panel; audit is
  review cue not truth; audit is not proof; audit is not authority;
  verification is not proof; smoke pass is not truth; CI pass is not truth;
  dogfooding records are bounded review records; feedback aggregation is
  advisory only; manual anchors are display hints; durable state apply is not
  product-write; source refs are lineage pointers, not proof; source refs must
  be public-safe symbolic refs; no audit persistence; no audit route; no route
  calls; no fetch; no DB read/write; no durable state mutation; no Formation
  Receipt write; no promotion execution; no proof/evidence write; no
  claim/evidence write; no product write; no product ID allocation; no
  provider/OpenAI call; no prompt sending; no retrieval execution; no RAG answer
  generation; no source fetch; no browser/session/raw conversation/telemetry
  ingestion; no local/repository/uploaded file read as source input; no Git
  Ledger export; no Codex execution; no GitHub automation; product-write
  remains parked by #686.

- Runtime Audit Selected Route Instrumentation v0.2:
  `docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_2.md`,
  `app/api/research-retrieval/rebuild/route.ts`,
  `app/api/research-retrieval/search/route.ts`,
  `app/api/perspective/layout/manual-anchors/route.ts`,
  `app/api/runtime-audit/events/route.ts`,
  `fixtures/runtime-audit-selected-route-instrumentation.v0.2.sample.json`,
  and `scripts/smoke-runtime-audit-selected-route-instrumentation-v0-2.mjs`
  (`npm run smoke:runtime-audit-selected-route-instrumentation-v0-2`)
  implements `runtime_audit_selected_route_instrumentation_v0_2` as a second
  narrow instrumentation pass after v0.1. Retrieval rebuild/search, manual
  anchors, and runtime audit GET list optionally emit bounded audit events when
  `audit_db_path` is supplied. Runtime audit POST create self-audit is deferred
  to prevent recursive audit writes. Missing `audit_db_path` leaves primary
  route behavior unchanged. Audit write failure does not fail the primary route.
  Audit events are bounded review records only; they are not truth, proof,
  approval, durable state, or product-write authority. This slice does not store
  raw request/response bodies, terminal logs, browser dumps, hidden reasoning,
  raw provider output, or raw retrieval output. It does not create
  proof/evidence, write claim/evidence records, create work items, promote
  Perspective, write/apply durable Perspective state, write Formation Receipts,
  execute Git/GitHub, execute Codex, product-write, allocate product IDs, or
  grant product-write authority. Product-write remains parked by #686.
  Smoke/CI pass is not truth. The roadmap guide is not SSOT.
- Runtime Audit Selected Route Instrumentation v0.3:
  `docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_3.md`,
  `app/api/research-candidate-review/review-records/route.ts`,
  `app/api/research-candidate-review/review-records/[review_record_id]/route.ts`,
  `app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts`,
  `app/api/research-candidate-review/review-records/[review_record_id]/discard/route.ts`,
  `fixtures/runtime-audit-selected-route-instrumentation.v0.3.sample.json`,
  and `scripts/smoke-runtime-audit-selected-route-instrumentation-v0-3.mjs`
  (`npm run smoke:runtime-audit-selected-route-instrumentation-v0-3`)
  implements `runtime_audit_selected_route_instrumentation_v0_3` as a third
  narrow instrumentation pass after v0.1 and v0.2. Review Memory DB create,
  list, detail, activity, and discard routes optionally emit bounded audit
  events when `audit_db_path` is supplied. Missing `audit_db_path` leaves
  primary route behavior unchanged. Audit write failure does not fail the
  primary route. Audit events are bounded review records only; they are not
  truth, proof, approval, durable state, or product-write authority. Review
  memory is not truth, proof, accepted evidence, or durable Perspective state.
  Candidate refs are not facts; source refs are lineage pointers, not proof.
  This slice does not store raw request/response bodies, terminal logs, browser
  dumps, hidden reasoning, raw provider output, or raw retrieval output. It
  does not create proof/evidence, write claim/evidence records, create work
  items, promote Perspective, write/apply durable Perspective state, write
  Formation Receipts, execute Git/GitHub, execute Codex, product-write,
  allocate product IDs, or grant product-write authority. Product-write remains
  parked by #686. Smoke/CI pass is not truth. The roadmap guide is not SSOT.
- Release Readiness Runtime Grounding Update v0.1:
  `docs/RELEASE_READINESS_RUNTIME_GROUNDING_UPDATE_V0_1.md`,
  `fixtures/release-readiness-runtime-grounding-update.sample.v0.1.json`, and
  `scripts/smoke-release-readiness-runtime-grounding-update-v0-1.mjs`
  (`npm run smoke:release-readiness-runtime-grounding-update-v0-1`)
  implements `release_readiness_runtime_grounding_update_v0_1` as release
  readiness grounding only after runtime audit selected route instrumentation
  v0.3. It updates release readiness/operator review/freeze surfaces with the
  actual runtime completion and audit instrumentation inventory through
  `runtime_audit_selected_route_instrumentation_v0_3`. This is not roadmap
  completion closeout, release approval, release execution, product-write
  approval, or GitHub actuation approval. It does not create version tags,
  execute Git/GitHub, query/write DB, add routes/UI, call providers, execute
  retrieval/RAG, create proof/evidence, promote Perspective, write/apply
  durable state, write Formation Receipts, execute Codex, product-write,
  allocate product IDs, or grant product-write authority. It does not approve
  `product_write_minimal_runtime_v0_1` or GitHub actuation implementation.
  Future product-write or GitHub actuation work requires separate explicit
  approval. Product-write remains parked by #686. Readiness is not release
  approval. Readiness is not truth. Freeze manifest addendum is not release
  execution. Operator review is not merge authority. Smoke/CI pass is not
  truth. The roadmap guide is not SSOT.
- v0.2.1 Remaining Runtime Gap Audit v0.1:
  `docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_1.md`,
  `fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.1.json`, and
  `scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-1.mjs`
  (`npm run smoke:v0-2-1-remaining-runtime-gap-audit-v0-1`)
  implements `v0_2_1_remaining_runtime_gap_audit_v0_1` as a static
  repo-grounded audit of the original v0.2.1 FULL roadmap after runtime
  completion and selected audit instrumentation through
  `release_readiness_runtime_grounding_update_v0_1`. This is not roadmap
  completion closeout, release approval, or release execution. It does not
  implement runtime behavior, query/write DB, add routes/UI, call providers,
  execute retrieval/RAG, create proof/evidence, promote Perspective, write/apply
  durable state, write Formation Receipts, execute Git/GitHub, execute Codex,
  product-write, allocate product IDs, or grant product-write authority. It
  identifies `runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1`
  as the next ungated implementation slice because Phase 4 promotion/receipt/
  state routes are real runtime surfaces but are not covered by selected audit
  instrumentation v0.1-v0.3. Product-write remains parked by #686. GitHub
  actuation implementation remains gated and contract-only. Smoke/CI pass is not
  truth. The roadmap guide is not SSOT.
- Runtime Audit Selected Route Instrumentation v0.4 Phase 4 Promotion/State:
  `docs/RUNTIME_AUDIT_SELECTED_ROUTE_INSTRUMENTATION_V0_4_PHASE_4_PROMOTION_STATE_V0_1.md`,
  `app/api/perspective/promotion-decisions/route.ts`,
  `app/api/perspective/promotion-decisions/[promotion_decision_id]/route.ts`,
  `app/api/perspective/formation-receipts/route.ts`,
  `app/api/perspective/state/apply-delta/route.ts`,
  `app/api/perspective/state/[perspective_id]/route.ts`,
  `app/api/perspective/state/[perspective_id]/trajectory/route.ts`,
  `lib/runtime-audit/audit-event-store.ts`,
  `fixtures/runtime-audit-selected-route-instrumentation.v0.4.phase-4-promotion-state.sample.json`,
  and
  `scripts/smoke-runtime-audit-selected-route-instrumentation-v0-4-phase-4-promotion-state-v0-1.mjs`
  (`npm run smoke:runtime-audit-selected-route-instrumentation-v0-4-phase-4-promotion-state-v0-1`)
  implements `runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1`
  as the next ungated implementation slice named by the remaining runtime gap
  audit. Selected Phase 4 promotion decision, Formation Receipt, durable
  Perspective state, and trajectory routes optionally emit bounded audit events
  when `audit_db_path` is supplied. Missing `audit_db_path` leaves primary route
  behavior unchanged. Audit write failure does not fail the primary route.
  Audit events are bounded review records only; they are not truth, proof,
  approval, durable state, promotion authority, Formation Receipt authority, or
  product-write authority. This slice does not store raw request/response
  bodies, terminal logs, browser dumps, hidden reasoning, raw provider output,
  or raw retrieval output. It does not create proof/evidence, write
  claim/evidence records, create work items, alter promotion semantics, alter
  Formation Receipt semantics, alter durable state semantics, execute
  Git/GitHub, execute Codex, product-write, allocate product IDs, or grant
  product-write authority. Product-write remains parked by #686. Smoke/CI pass
  is not truth. The roadmap guide is not SSOT.
- v0.2.1 Remaining Runtime Gap Audit v0.2:
  `docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_2.md`,
  `fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.2.json`, and
  `scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-2.mjs`
  (`npm run smoke:v0-2-1-remaining-runtime-gap-audit-v0-2`)
  implements `v0_2_1_remaining_runtime_gap_audit_v0_2` as a static
  repo-grounded audit of the original v0.2.1 FULL roadmap after
  `runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1`.
  It updates the prior v0.1 recommendation now that selected Phase 4
  promotion/state routes have bounded audit instrumentation. This is not
  roadmap completion closeout, release approval, release execution,
  product-write approval, or GitHub actuation approval. It does not implement
  runtime behavior, query/write DB, add routes/UI, call providers, execute
  retrieval/RAG, create proof/evidence, promote Perspective, write/apply
  durable state, write Formation Receipts, execute Git/GitHub, execute Codex,
  product-write, allocate product IDs, or grant product-write authority. It
  names `none_without_explicit_approval` as the next recommended implementation
  slice because the remaining visible work is approval-gated, explicitly
  future/deferred, or contract/fixture/offline-only. Product-write remains
  parked by #686. Smoke/CI pass is not truth. The roadmap guide is not SSOT.
- v0.2.1 Remaining Runtime Gap Audit v0.6:
  `docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_6.md`,
  `fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.6.json`, and
  `scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs`
  (`npm run smoke:v0-2-1-remaining-runtime-gap-audit-v0-6`) implements
  `v0_2_1_remaining_runtime_gap_audit_v0_6` as a static postmerge grounding
  audit after merged PR #848 and
  `final_answer_candidate_review_ui_binding_v0_1`. It confirms #848 as final
  answer candidate Review Memory read/display-only UI binding only: existing Review
  Memory DB GET routes only, no POST calls, no write controls, bounded
  record/detail/activity projection display, bounded copied packet, invalid DB
  path and private/raw filter blocking before fetch, private URL/path/token/
  provider/internal ID variant blocking in input/display/copy surfaces, broad
  private/internal/intranet/corp/.local URL host blocking, public-safe symbolic
  refs display, and no raw JSON blob or route response body wholesale
  rendering. This does not implement new runtime beyond audit/grounding docs,
  fixture, and smoke, and it does not grant Review Memory write, POST, final
  answer generation, provider, retrieval, source fetch, proof/evidence,
  claim/evidence, promotion, durable state, Formation Receipt, product-write,
  accepted evidence ref, GitHub actuation, release, live provider, retrieval
  index write, background job, automatic answer-to-product, or product ID
  authority. Review Memory is not truth, proof, accepted evidence, or durable
  Perspective state. Final answer candidate remains candidate-only. Source
  refs are lineage pointers, not proof. Operator review note is not promotion
  or product-write authority. Read/display UI is not write authority. Copied
  packet is not proof/evidence/promotion/product-write/approval. It names
  `none_without_explicit_approval` as the next recommended implementation
  slice while preserving
  `promotion_readiness_packet_from_review_memory_v0_1` only as a possible
  future separately classified readiness-packet slice. Smoke/CI pass is not
  truth. The roadmap guide is not SSOT.
- v0.2.1 Remaining Runtime Gap Audit v0.5:
  `docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_5.md`,
  `fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.5.json`, and
  `scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-5.mjs`
  (`npm run smoke:v0-2-1-remaining-runtime-gap-audit-v0-5`) implements
  `v0_2_1_remaining_runtime_gap_audit_v0_5` as a static postmerge grounding
  audit after merged PR #846 and
  `final_rag_answer_candidate_review_memory_binding_v0_1`. It confirms #846
  as final RAG answer candidate Review Memory binding only: same-origin POST
  route, no GET route, existing Review Memory DB store helper usage, final
  answer candidate to `candidate_review_snapshot` mapping, schema ensure/write
  only after preflight, DB-free preflight before Review Memory DB open,
  invalid/forbidden/private/missing-prerequisite no-create behavior,
  idempotent replay, material payload conflict rejection, and the
  `final_rag_answer_review_memory_binding_runtime` audit surface. This does
  not implement new runtime beyond audit/grounding docs, fixture, and smoke,
  and it does not grant UI, proof/evidence, claim/evidence outside Review
  Memory, promotion, durable state, Formation Receipt, product-write, accepted
  evidence ref write, product ID, GitHub actuation, release, live provider,
  source-fetching, provider-call, prompt-sending, retrieval-execution, or
  retrieval-index write authority. Review Memory is not truth, proof, accepted
  evidence, or durable Perspective state. Final answer candidates remain
  candidate-only. Source refs are lineage pointers, not proof. Operator review
  notes are review memory, not promotion or product-write authority. Product
  write remains limited to the already merged accepted evidence ref first
  target only. UI binding is not implemented by this audit. It names
  `none_without_explicit_approval` as the next recommended implementation
  slice. Smoke/CI pass is not truth. The roadmap guide is not SSOT.
- v0.2.1 Remaining Runtime Gap Audit v0.4:
  `docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_4.md`,
  `fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.4.json`, and
  `scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-4.mjs`
  (`npm run smoke:v0-2-1-remaining-runtime-gap-audit-v0-4`) implements
  `v0_2_1_remaining_runtime_gap_audit_v0_4` as a static postmerge grounding
  audit after merged PR #844 and
  `final_rag_answer_generation_candidate_review_v0_1`. It confirms #844 as
  final RAG answer candidate/review runtime only: same-origin POST route,
  bounded final-answer builder, final-answer provider boundary, deterministic
  mock-provider path, configured-provider missing-key refusal, optional bounded
  audit emission, context-backed provider citation enforcement, unbacked
  provider citation rejection, private/raw key and value blocking, and the
  `final_rag_answer_candidate_review_runtime` audit surface. This does not
  implement new runtime beyond audit/grounding docs, fixture, and smoke, and
  it does not grant proof/evidence, promotion, durable state, Formation
  Receipt, product-write, accepted evidence ref write, product ID, GitHub
  actuation, release, live provider, source-fetching, or retrieval-index write
  authority. Final answer candidates are not truth, proof, accepted evidence,
  promotion, or product. Provider output remains candidate-only. Retrieval
  result remains non-authoritative. Retrieval score is not truth or promotion
  readiness. Context preview remains a review aid. Product-write remains
  limited to the already merged accepted evidence ref first target only. It
  names `none_without_explicit_approval` as the next recommended
  implementation slice. Smoke/CI pass is not truth. The roadmap guide is not
  SSOT.
- v0.2.1 Remaining Runtime Gap Audit v0.3:
  `docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_3.md`,
  `fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.3.json`, and
  `scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-3.mjs`
  (`npm run smoke:v0-2-1-remaining-runtime-gap-audit-v0-3`) implements
  `v0_2_1_remaining_runtime_gap_audit_v0_3` as a static postmerge grounding
  audit after merged PR #842 and
  `product_write_accepted_evidence_ref_runtime_v0_1`. It confirms #842 as the
  first completed `accepted_evidence_records` product-write target only:
  operator-approved accepted evidence ref write records backed by promotion
  decision, Formation Receipt, review record, public-safe source refs, accepted
  evidence refs, product-write reentry review, product-write target contract,
  preview-to-write diff, rollback or abort plan, stable idempotency key, and
  explicit operator approval payload. This does not implement new runtime
  beyond audit/grounding docs, fixture, and smoke, and it does not grant
  additional product-write authority. Product ID allocation, broad product
  persistence, product object/profile/publication creation, product-write
  adapter enablement, additional product-write target groups, proof records,
  work items, durable Perspective state mutation from product-write, GitHub
  actuation, release execution/publication, final RAG answer generation,
  provider calls, prompt sending, retrieval/RAG execution, source fetching,
  background jobs, and automatic product generation remain gated or deferred.
  It names `none_without_explicit_approval` as the next recommended
  implementation slice. Smoke/CI pass is not truth. The roadmap guide is not
  SSOT.
- Git Ledger Export Contract v0.1:
  `docs/GIT_LEDGER_EXPORT_CONTRACT_V0_1.md`,
  `types/git-ledger-export-contract.ts`,
  `fixtures/git-ledger-export-contract.sample.v0.1.json`, and
  `scripts/smoke-git-ledger-export-contract-v0-1.mjs`
  (`npm run smoke:git-ledger-export-contract-v0-1`) follows PR #797 Runtime
  Audit Panel. This slice is contract-only. Ledger packets are review/export
  candidates, and ledger packets are not commits. This pointer is repo-local
  documentation metadata, not SSOT. The roadmap guide is not SSOT. It does not
  add Git Ledger export runtime, Git writes, commit creation, branch creation,
  tag creation, GitHub API calls, pull request creation, repository file
  writes, DB read/write, routes, UI, durable Perspective state mutation,
  Formation Receipt writes, promotion execution, proof/evidence writes,
  claim/evidence writes, product-write, product ID allocation, provider calls,
  prompt sending, retrieval/RAG execution, source fetch, browser log ingestion,
  session log ingestion, raw conversation ingestion, telemetry ingestion,
  Codex execution, or GitHub automation. Product-write remains parked by #686.

  Boundary phrases: Git Ledger Export Contract v0.1; contract-only; ledger
  packets are review/export candidates; ledger packets are not commits; ledger
  packets are not truth; ledger packets are not proof; ledger packets are not
  accepted evidence; ledger packets are not product-write; Git Ledger export
  requires future explicit operator action; no Git Ledger export runtime; no
  Git write; no commit creation; no branch creation; no tag creation; no
  GitHub API call; no pull request creation; no repository file write; no DB
  read/write; no route; no UI; no durable state mutation; no Formation Receipt
  write; no promotion execution; no proof/evidence write; no claim/evidence
  write; no product write; no product ID allocation; no provider/OpenAI call;
  no prompt sending; no retrieval execution; no RAG answer generation; no
  source fetch; no local/repository/uploaded file read as source input; no raw
  conversation/browser/session/telemetry ingestion; no Codex execution; no
  GitHub automation; product-write remains parked by #686.
- Git Ledger Export Deterministic Builder v0.1:
  `docs/GIT_LEDGER_EXPORT_DETERMINISTIC_BUILDER_V0_1.md`,
  `lib/git-ledger/build-export-packet.ts`,
  `fixtures/git-ledger-export-builder.sample.v0.1.json`, and
  `scripts/smoke-git-ledger-export-builder-v0-1.mjs`
  (`npm run smoke:git-ledger-export-builder-v0-1`) implements
  `git_ledger_export_deterministic_builder_v0_1` from the integrated roadmap
  guide v0.2.1 FULL. This slice builds packet candidates only and renders
  bounded markdown and suggested commit message text only. Suggested commit
  message is not approval. Packet hash is not truth. Idempotency key is not
  authority. Git ref is not authority. This pointer is repo-local documentation
  metadata, not SSOT. The roadmap guide is not SSOT. It does not execute Git,
  create commits, branches, tags, PRs, or merges, call GitHub, write repository
  files, export files locally, import files, query/write DB, add routes/UI, call
  providers, send prompts, fetch sources, execute retrieval/RAG, create
  proof/evidence, write claim/evidence records, promote Perspective, write/apply
  durable Perspective state, write Formation Receipts, execute Codex,
  product-write, or allocate product IDs. Product-write remains parked by #686.

  Boundary phrases: Git Ledger Export Deterministic Builder v0.1; packet
  candidate only; deterministic packet builder; caller-provided input only;
  public-safe packet candidate only; suggested commit message is not approval;
  packet hash is not truth; idempotency key is not authority; Git ref is not
  authority; Git Ledger export packet is not commit, not proof, not accepted
  evidence, not durable state, not promotion, and not product-write; no Git
  Ledger export runtime; no Git write; no commit creation; no branch creation;
  no tag creation; no GitHub API call; no pull request creation; no merge
  execution; no repository file write; no local file export; no local file
  import; no DB query/write; no route; no UI; no provider/OpenAI call; no
  prompt sending; no source fetch; no retrieval execution; no RAG answer
  generation; no proof/evidence write; no claim/evidence write; no promotion
  execution; no durable state write; no durable state apply; no Formation
  Receipt write; no export/import runtime; no Codex execution; no product-write;
  no product ID allocation; smoke pass is not truth; CI pass is not truth;
  product-write remains parked by #686.
- Git Ledger Export Readonly Preview v0.1:
  `docs/GIT_LEDGER_EXPORT_READONLY_PREVIEW_V0_1.md`,
  `components/git-ledger-export-readonly-preview-panel.tsx`,
  `fixtures/git-ledger-export-readonly-preview.sample.v0.1.json`, and
  `scripts/smoke-git-ledger-export-readonly-preview-v0-1.mjs`
  (`npm run smoke:git-ledger-export-readonly-preview-v0-1`) implements
  `git_ledger_export_readonly_preview_v0_1` from the integrated roadmap guide
  v0.2.1 FULL. This slice is read-only preview only. It renders packet
  candidates, markdown summary, privacy/validation report, authority boundary,
  deterministic packet hash, idempotency key, and suggested commit message text
  only. Suggested commit message is not approval. Packet hash is not truth.
  Idempotency key is not authority. Git ref is not authority. This pointer is
  repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT. It
  does not execute Git, execute Git Ledger export, create commits, branches,
  tags, PRs, or merges, call GitHub, write repository files, export files
  locally, import files, query/write DB, add routes, call providers, send
  prompts, fetch sources, execute retrieval/RAG, create proof/evidence, write
  claim/evidence records, promote Perspective, write/apply durable Perspective
  state, write Formation Receipts, execute Codex, product-write, or allocate
  product IDs. Product-write remains parked by #686.

  Boundary phrases: Git Ledger Export Readonly Preview v0.1; read-only preview
  only; packet candidate previewed; caller-provided packet only; public-safe
  render only; suggested commit message text only; summary markdown text only;
  suggested commit message is not approval; packet hash is not truth;
  idempotency key is not authority; Git ref is not authority; Git Ledger export
  packet is not commit, not proof, not accepted evidence, not durable state, not
  promotion, and not product-write; no action controls present; no Git Ledger
  export runtime; no Git Ledger builder mutation; no Git write; no commit
  creation; no branch creation; no tag creation; no GitHub API call; no pull
  request creation; no merge execution; no repository file write; no local file
  export; no local file import; no DB query/write; no route; no provider/OpenAI
  call; no prompt sending; no source fetch; no retrieval execution; no RAG
  answer generation; no proof/evidence write; no claim/evidence write; no
  promotion execution; no durable state write; no durable state apply; no
  Formation Receipt write; no export/import runtime; no Codex execution; no
  product-write; no product ID allocation; smoke pass is not truth; CI pass is
  not truth; product-write remains parked by #686.
- Local Git Ledger Export v0.1:
  `docs/LOCAL_GIT_LEDGER_EXPORT_V0_1.md`,
  `lib/git-ledger/local-export.ts`,
  `fixtures/local-git-ledger-export.sample.v0.1.json`, and
  `scripts/smoke-local-git-ledger-export-v0-1.mjs`
  (`npm run smoke:local-git-ledger-export-v0-1`) implements
  `local_git_ledger_export_v0_1` from the integrated roadmap guide v0.2.1
  FULL. This slice writes local export artifacts only to allowlisted output
  directories under `tmp/git-ledger-export/` or `.tmp/git-ledger-export/` when
  explicitly requested. It supports dry-run manifest mode without file writes
  and writes only `packet.json`, `summary.md`, `source-refs.json`,
  `evidence-refs.json`, `candidate-refs.json`, `privacy-report.json`,
  `suggested-commit-message.txt`, `authority-boundary.json`, and
  `manifest.json` in write mode. Suggested commit message artifact is not
  approval. Manifest hash is not truth. Artifact hash is not authority. Git ref
  is not authority. Exported packet is not commit, not proof, not accepted
  evidence, not durable state, not promotion, and not product-write. This
  pointer is repo-local documentation metadata, not SSOT. The roadmap guide is
  not SSOT. It does not execute Git, create commits, branches, tags, PRs, or
  merges, call GitHub, write repository source files, export outside
  `tmp/git-ledger-export/` or `.tmp/git-ledger-export/`, import files,
  query/write DB, add routes/UI, call providers, send prompts, fetch sources,
  execute retrieval/RAG, create proof/evidence, write claim/evidence records,
  promote Perspective, write/apply durable Perspective state, write Formation
  Receipts, execute Codex, product-write, or allocate product IDs.
  Product-write remains parked by #686.

  Boundary phrases: Local Git Ledger Export v0.1; explicit local file export
  gate; allowlisted output directory; dry-run manifest created; local export
  written; local export helper only; caller-provided packet only; public-safe
  summary only; suggested commit message artifact is not approval; manifest
  hash is not truth; artifact hash is not authority; Git ref is not authority;
  exported packet is not commit, not proof, not accepted evidence, not durable
  state, not promotion, and not product-write; no Git Ledger export runtime
  beyond local artifact writing; no Git write; no commit creation; no branch
  creation; no tag creation; no GitHub API call; no pull request creation; no
  merge execution; no repository source file write; no local file import; no
  DB query/write; no route; no UI; no provider/OpenAI call; no prompt sending;
  no source fetch; no retrieval execution; no RAG answer generation; no
  proof/evidence write; no claim/evidence write; no promotion execution; no
  durable state write; no durable state apply; no Formation Receipt write; no
  Codex execution; no product-write; no product ID allocation; smoke pass is
  not truth; CI pass is not truth; product-write remains parked by #686.
- GitHub Actuation Contract v0.1:
  `docs/GITHUB_ACTUATION_CONTRACT_V0_1.md`,
  `types/github-actuation-contract.ts`,
  `fixtures/github-actuation-contract.sample.v0.1.json`, and
  `scripts/smoke-github-actuation-contract-v0-1.mjs`
  (`npm run smoke:github-actuation-contract-v0-1`) implements
  `github_actuation_contract_v0_1` from the integrated roadmap guide v0.2.1
  FULL. This slice is contract-only and dry-run-only. It defines permission
  profiles, target repo/branch/file policy, explicit approval payload,
  dry-run actuation plan, preview-to-action diff, rollback/abort,
  idempotency, privacy/redaction, and authority boundary for possible future
  operator-approved GitHub actuation. This pointer is repo-local documentation
  metadata, not SSOT. The roadmap guide is not SSOT. It does not call GitHub,
  execute Git, create branches, commits, tags, PRs, reviews, labels, checks,
  releases, or merges, write repository files, grant contents write
  permission, grant actions write permission, grant admin permission, read or
  write secrets, export files locally, import files, query/write DB, add
  routes/UI, call providers, send prompts, fetch sources, execute
  retrieval/RAG, create proof/evidence, write claim/evidence records, promote
  Perspective, write/apply durable Perspective state, write Formation
  Receipts, execute Codex, product-write, or allocate product IDs. Approval
  payload is not merge authority. Approval payload is not product-write.
  Approval payload is not proof. Approval payload is not durable state. Git ref
  is not authority. GitHub PR is not Core decision. Product-write remains
  parked by #686. Any future GitHub actuation implementation requires a
  separate explicitly approved PR.

  Boundary phrases: GitHub Actuation Contract v0.1; contract-only and
  dry-run-only; dry-run plan only; explicit operator approval required;
  caller-provided refs only; no GitHub API call; no Git write; no commit
  creation; no branch creation; no tag creation; no pull request creation; no
  pull request merge; no review submission; no label write; no check write; no
  release creation; no repository file write; no contents write permission; no
  actions write permission; no admin permission; no secrets read/write; no
  local file export; no local file import; no DB query/write; no route; no UI;
  no provider/OpenAI call; no prompt sending; no source fetch; no retrieval
  execution; no RAG answer generation; no proof/evidence write; no
  claim/evidence write; no promotion execution; no durable state write; no
  durable state apply; no Formation Receipt write; no Codex execution; no
  product-write; no product ID allocation; approval payload is not merge
  authority; approval payload is not product-write; approval payload is not
  proof; approval payload is not durable state; Git ref is not authority;
  GitHub PR is not Core decision; smoke pass is not truth; CI pass is not
  truth; product-write remains parked by #686.
- Product Write Reentry Review v0.1:
  `docs/PRODUCT_WRITE_REENTRY_REVIEW_V0_1.md`,
  `lib/product-write/product-write-reentry-review.ts`,
  `fixtures/product-write-reentry-review.sample.v0.1.json`, and
  `scripts/smoke-product-write-reentry-review-v0-1.mjs`
  (`npm run smoke:product-write-reentry-review-v0-1`) follows PR #798 Git
  Ledger Export Contract. This slice is review-only. Product-write remains
  parked by #686, and product-write authority is not granted. This pointer is
  repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT.
  It does not add product-write runtime, product-write adapter enablement,
  product target contract authority, product ID allocation, product persistence,
  DB read/write, routes, UI, durable Perspective state mutation, Formation
  Receipt writes, promotion execution, proof/evidence writes, claim/evidence
  writes, Git Ledger export runtime, Git writes, GitHub API calls, pull request
  creation, repository file writes, provider calls, prompt sending,
  retrieval/RAG execution, source fetch, browser log ingestion, session log
  ingestion, raw conversation ingestion, telemetry ingestion, Codex execution,
  or GitHub automation.

  Boundary phrases: Product Write Reentry Review v0.1; review-only;
  product-write remains parked by #686; product-write authority is not granted;
  product-write runtime is not implemented; product-write adapter is not
  enabled; product IDs are not allocated; runtime audit is review context, not
  authority; Git Ledger packets are review/export candidates, not commits;
  smoke/CI pass is not truth; no product-write runtime; no product-write
  adapter enabled; no product target contract; no product ID allocation; no
  product persistence; no product route; no product UI; no DB read/write; no
  route; no UI; no durable state mutation; no Formation Receipt write; no
  promotion execution; no proof/evidence write; no claim/evidence write; no
  provider/OpenAI call; no prompt sent; no retrieval execution; no RAG answer
  generation; no source fetch; no Git Ledger export runtime; no Git write; no
  GitHub API call; no pull request creation; no repository file write; no
  Codex execution; no GitHub automation.
- Product Write Target Contract v0.1:
  `docs/PRODUCT_WRITE_TARGET_CONTRACT_V0_1.md`,
  `types/product-write-target-contract.ts`,
  `fixtures/product-write-target-contract.sample.v0.1.json`, and
  `scripts/smoke-product-write-target-contract-v0-1.mjs`
  (`npm run smoke:product-write-target-contract-v0-1`) implements
  `product_write_target_contract_v0_1` from the integrated roadmap guide
  v0.2.1 FULL. This slice is contract-only. It defines target groups,
  owner/schema refs, allowed and forbidden future write intents, required
  prerequisites, idempotency policy, transaction boundary, rollback policy,
  audit trail policy, source refs policy, operator approval binding,
  preview-to-write diff policy, and authority boundary. This pointer is
  repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT.
  It does not execute product-write, enable product-write adapter, allocate
  product IDs, persist products, open product routes/UI, execute SQL
  transactions, query/write DB, write proof/evidence records, write
  claim/evidence records, create work items, promote Perspective, write/apply
  durable Perspective state, write Formation Receipts, call providers, send
  prompts, fetch sources, execute retrieval/RAG, execute Git Ledger export
  runtime, execute Git, call GitHub, write repository files, export/import
  files, execute Codex, or grant product-write authority. Product-write remains
  parked by #686. Candidate cannot be written as proof/evidence directly.
  Provider output cannot be written as accepted evidence directly. Retrieval
  result cannot be written as accepted evidence directly. Codex result cannot
  be written as proof/evidence/state. Feedback cannot be written as truth.
  Product write is impossible without promotion decision, Formation Receipt,
  explicit operator approval, source refs, audit trail, idempotency, rollback,
  and preview-to-write diff.

  Boundary phrases: Product Write Target Contract v0.1; contract-only;
  product-write remains parked by #686; product-write denied; product-write
  execution is not implemented; product-write adapter is not enabled; product
  IDs are not allocated; product persistence is not executed; product routes
  are not opened; product UI is not opened; no SQL transaction; no DB
  query/write; no proof/evidence write; no claim/evidence write; no work item
  write; no promotion execution; no durable state write; no durable state
  apply; no Formation Receipt write; no provider/OpenAI call; no prompt
  sending; no source fetch; no retrieval execution; no RAG answer generation;
  no Git Ledger export runtime; no Git write; no GitHub API call; no
  repository file write; no local file export; no local file import; no Codex
  execution; candidate cannot be written as proof/evidence directly; provider
  output cannot be written as accepted evidence directly; retrieval result
  cannot be written as accepted evidence directly; Codex result cannot be
  written as proof/evidence/state; feedback cannot be written as truth;
  preview-to-write diff is not write approval; smoke pass is not truth; CI
  pass is not truth.
- Product Write Accepted Evidence Ref Runtime v0.1:
  `docs/PRODUCT_WRITE_ACCEPTED_EVIDENCE_REF_RUNTIME_V0_1.md`,
  `types/product-write-accepted-evidence-ref.ts`,
  `lib/product-write/accepted-evidence-ref-store.ts`,
  `lib/product-write/accepted-evidence-ref-runtime.ts`,
  `app/api/product-write/accepted-evidence-refs/route.ts`,
  `fixtures/product-write-accepted-evidence-ref-runtime.sample.v0.1.json`, and
  `scripts/smoke-product-write-accepted-evidence-ref-runtime-v0-1.mjs`
  (`npm run smoke:product-write-accepted-evidence-ref-runtime-v0-1`)
  implements `product_write_accepted_evidence_ref_runtime_v0_1` as the first
  explicitly approved gated product-write minimal runtime target only. It
  writes bounded accepted evidence ref records for the
  `accepted_evidence_records` target group after validating promotion decision,
  Formation Receipt, review record, public-safe source refs, accepted evidence
  refs, product-write reentry review, product-write target contract,
  preview-to-write diff, rollback or abort plan, stable idempotency key, and
  explicit operator approval payload. This pointer is repo-local documentation
  metadata, not SSOT. The roadmap guide is not SSOT. This narrow runtime does
  not enable a product-write adapter, allocate product IDs, persist product
  objects/profiles/publications, create proof, write claim/evidence records,
  create work items, promote Perspective, mutate durable Perspective state,
  write Formation Receipts, call providers, send prompts, fetch sources,
  execute retrieval/RAG, generate final RAG answers, execute Git/GitHub, run
  releases, or grant product-write authority beyond this accepted evidence ref
  write path. Missing audit_db_path does not fail the primary route. Audit
  write failure does not fail the primary route.

  Boundary phrases: Product Write Accepted Evidence Ref Runtime v0.1; first
  approved product-write minimal runtime target only; accepted evidence ref
  write is not proof; accepted evidence ref write is not truth; accepted
  evidence ref write is not durable Perspective state; accepted evidence ref
  write is not product ID allocation; accepted evidence ref write is not broad
  product persistence; operator approval is required but is not proof;
  preview-to-write diff is required but is not write approval by itself; source
  refs are lineage pointers, not proof; promotion decision is a prerequisite,
  not an automatic execution command; Formation Receipt is a prerequisite, not
  product-write authority by itself; audit event is not truth, proof, approval,
  state, or product authority; no product-write adapter enabled; no product ID
  allocation; no broad product persistence; no product object/profile creation;
  no product publication; no release execution; no GitHub actuation; no GitHub
  API call; no Git write; no provider/OpenAI call; no prompt sending; no source
  fetch; no retrieval execution; no RAG answer generation; no proof creation;
  no work item creation; no durable Perspective state mutation from
  product-write; no Formation Receipt write; no automatic product generation;
  smoke pass is not truth; CI pass is not truth.
- Deterministic CRPF Variant Review v0.1:
  `docs/DETERMINISTIC_CRPF_VARIANT_REVIEW_V0_1.md`,
  `types/deterministic-crpf-variant-review.ts`,
  `fixtures/deterministic-crpf-variant-review.sample.v0.1.json`, and
  `scripts/smoke-deterministic-crpf-variant-review-v0-1.mjs`
  (`npm run smoke:deterministic-crpf-variant-review-v0-1`) implements
  `deterministic_crpf_variant_review_v0_1` from the integrated roadmap guide
  v0.2.1 FULL. This slice is contract-only and fixture-only. It defines
  deterministic fixed-seed CRPF variant review for evidence-strict,
  tension-preserving, source-coverage-strict, handoff-minimal, and
  operator-review-heavy variants. This pointer is repo-local documentation
  metadata, not SSOT. The roadmap guide is not SSOT. It uses fixed seed refs
  only and does not execute runtime randomness, call providers, send prompts,
  fetch sources, execute retrieval/RAG, query/write DB, add routes/UI, create
  proof/evidence, write claim/evidence records, promote Perspective,
  write/apply durable Perspective state, write Formation Receipts, execute Git
  Ledger export runtime, execute Git or call GitHub, execute Codex,
  export/import files, product-write, allocate product IDs, or grant
  product-write authority. Variants are review aids only; they are not truth,
  proof, accepted evidence, promotion readiness, durable state, or
  product-write. Product-write remains parked by #686.

  Boundary phrases: Deterministic CRPF Variant Review v0.1; contract-only and
  fixture-only; fixed seed refs only; no runtime randomness; no provider call;
  no prompt sending; no source fetch; no retrieval execution; no RAG answer
  generation; no DB query/write; no route; no UI; no proof/evidence write; no
  claim/evidence write; no promotion execution; no durable state write; no
  durable state apply; no Formation Receipt write; no Git Ledger export
  runtime; no Git write; no GitHub API call; no repository file write; no
  local file export; no local file import; no Codex execution; no
  product-write; no product ID allocation; variant is review aid only; variant
  is not truth; variant is not proof; variant is not accepted evidence; variant
  is not promotion readiness; variant is not durable state; variant is not
  product-write; smoke pass is not truth; CI pass is not truth; product-write
  remains parked by #686.
- Empirical Calibration Dataset v0.1:
  `docs/EMPIRICAL_CALIBRATION_DATASET_V0_1.md`,
  `types/empirical-calibration-dataset.ts`,
  `fixtures/empirical-calibration-dataset.sample.v0.1.json`, and
  `scripts/smoke-empirical-calibration-dataset-v0-1.mjs`
  (`npm run smoke:empirical-calibration-dataset-v0-1`) implements
  `empirical_calibration_dataset_v0_1` from the integrated roadmap guide
  v0.2.1 FULL. This slice is contract-only and fixture-only. It defines an
  offline empirical calibration dataset contract for candidate readiness,
  diagnostic reason codes, feedback outcomes, handoff usage/outcomes, Codex
  result review outcomes, not-done classification, validation results, later
  review outcomes, Temporal Handoff experiment refs, and CRPF variant refs.
  This pointer is repo-local documentation metadata, not SSOT. The roadmap
  guide is not SSOT. calibration_training_allowed is false by default. Dataset
  rows are offline diagnostics only; they are not truth, proof, accepted
  evidence, training data, approval, rejection, promotion, durable state, or
  product-write. It does not execute training, automatic learning, rule
  mutation, prompt mutation, parser mutation, ranking mutation, surfacing
  mutation, telemetry ingestion runtime, provider calls, prompt sending,
  source fetch, retrieval/RAG, DB writes, routes/UI, proof/evidence writes,
  Perspective promotion, durable state apply, Formation Receipt writes, Git
  Ledger export runtime, Git/GitHub, Codex execution, export/import,
  product-write, product ID allocation, or grant product-write authority.
  Product-write remains parked by #686.

  Boundary phrases: Empirical Calibration Dataset v0.1; contract-only and
  fixture-only; offline diagnostic only; calibration_training_allowed is false
  by default; no training runtime; no automatic learning; no rule mutation; no
  prompt mutation; no parser mutation; no ranking mutation; no surfacing
  mutation; no telemetry ingestion runtime; no provider call; no prompt
  sending; no source fetch; no retrieval execution; no RAG answer generation;
  no DB query/write; no route; no UI; no proof/evidence write; no
  claim/evidence write; no promotion execution; no durable state write; no
  durable state apply; no Formation Receipt write; no Git Ledger export
  runtime; no Git write; no GitHub API call; no repository file write; no
  local file export; no local file import; no Codex execution; no
  product-write; no product ID allocation; feedback is not truth; readiness
  label is not truth; diagnostic reason code is not truth; validation pass is
  not truth; validation failure is not automatic rejection; Codex result is not
  proof; handoff outcome is not approval; later review outcome is not truth;
  dataset row is not proof; dataset row is not accepted evidence; dataset row
  is not training data unless a future explicit approval changes policy; smoke
  pass is not truth; CI pass is not truth; product-write remains parked by
  #686.
- Formal Invariant Checks Narrow Scope v0.1:
  `docs/FORMAL_INVARIANT_CHECKS_NARROW_SCOPE_V0_1.md`,
  `types/formal-invariant-checks-narrow-scope.ts`,
  `fixtures/formal-invariant-checks-narrow-scope.sample.v0.1.json`, and
  `scripts/smoke-formal-invariant-checks-narrow-scope-v0-1.mjs`
  (`npm run smoke:formal-invariant-checks-narrow-scope-v0-1`) implements
  `formal_invariant_checks_narrow_scope_v0_1` from the integrated roadmap
  guide v0.2.1 FULL. This slice is contract-only, fixture-only, static
  invariant smoke only, and narrow scope only. It covers candidate/proof,
  provider/evidence, retrieval/promotion, Codex/state, dataset/training,
  feedback/truth, layout/authority, Git ref/authority, GitHub PR/Core
  decision, CI/smoke truth, Git Ledger packet authority, product-write gates,
  product ID allocation, and private identifier canonical-label invariants.
  This pointer is repo-local documentation metadata, not SSOT. The roadmap
  guide is not SSOT. It does not add theorem prover runtime, Lean dependency,
  arbitrary natural-language proof, provider calls, prompt sending, source
  fetch, retrieval/RAG, DB writes, routes/UI, proof/evidence writes,
  Perspective promotion, durable state apply, Formation Receipt writes, Git
  Ledger export runtime, Git/GitHub, Codex execution, export/import,
  product-write, product ID allocation, or grant product-write authority.
  Invariant pass is not truth, proof, approval, promotion, durable state,
  product-write authority, or merge authority. Product-write remains parked by
  #686.

  Boundary phrases: Formal Invariant Checks Narrow Scope v0.1; contract-only
  and fixture-only; static invariant smoke only; narrow scope only; no theorem
  prover runtime; no Lean dependency; no arbitrary natural-language proof; no
  provider call; no prompt sending; no source fetch; no retrieval execution;
  no RAG answer generation; no DB query/write; no route; no UI; no
  proof/evidence write; no claim/evidence write; no promotion execution; no
  durable state write; no durable state apply; no Formation Receipt write; no
  Git Ledger export runtime; no Git write; no GitHub API call; no repository
  file write; no local file export; no local file import; no Codex execution;
  no product-write; no product ID allocation; invariant pass is not truth;
  invariant pass is not proof; invariant pass is not approval; invariant pass
  is not promotion; invariant pass is not durable state; invariant pass is not
  product-write authority; invariant pass is not merge authority; smoke pass is
  not truth; CI pass is not truth; product-write remains parked by #686.
- Release Readiness Matrix v0.1:
  `docs/RELEASE_READINESS_MATRIX_V0_1.md`,
  `lib/release-readiness/build-release-readiness-matrix.ts`,
  `fixtures/release-readiness-matrix.sample.v0.1.json`, and
  `scripts/smoke-release-readiness-matrix-v0-1.mjs`
  (`npm run smoke:release-readiness-matrix-v0-1`) follows PR #799 Product
  Write Reentry Review. This slice is review-only. Product-write remains parked
  by #686, and release readiness does not grant authority. This pointer is
  repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT.
  It does not add release execution, release artifact creation, release
  candidate approval, product-write runtime, product-write adapter enablement,
  product target contract authority, product ID allocation, product
  persistence, DB read/write, routes, UI, durable Perspective state mutation,
  Formation Receipt writes, promotion execution, proof/evidence writes,
  claim/evidence writes, Git Ledger export runtime, Git writes, GitHub API
  calls, pull request creation, repository file writes, provider calls, prompt
  sending, retrieval/RAG execution, source fetch, browser log ingestion,
  session log ingestion, raw conversation ingestion, telemetry ingestion,
  Codex execution, or GitHub automation.

  Boundary phrases: Release Readiness Matrix v0.1; review-only; release
  readiness is not truth; release readiness is not proof; release readiness
  does not grant authority; release candidate review is not release; no release
  execution; no release artifacts; no release authority; no release candidate
  approval; product-write remains parked by #686; product-write authority is
  not granted; product-write runtime is not implemented; product-write adapter
  is not enabled; product IDs are not allocated; runtime audit is review
  context, not authority; Git Ledger packets are review/export candidates, not
  commits; smoke/CI pass is not truth; no product-write runtime; no
  product-write adapter enabled; no product target contract; no product ID
  allocation; no product persistence; no product route; no product UI; no DB
  read/write; no route; no UI; no durable state mutation; no Formation Receipt
  write; no promotion execution; no proof/evidence write; no claim/evidence
  write; no provider/OpenAI call; no prompt sent; no retrieval execution; no
  RAG answer generation; no source fetch; no Git Ledger export runtime; no Git
  write; no GitHub API call; no pull request creation; no repository file
  write; no Codex execution; no GitHub automation.
- Disabled Product Write Adapter Reentry Harness v0.1:
  `docs/DISABLED_PRODUCT_WRITE_ADAPTER_REENTRY_HARNESS_V0_1.md`,
  `lib/product-write/disabled-product-write-adapter-reentry-harness.ts`,
  `fixtures/disabled-product-write-adapter-reentry-harness.sample.v0.1.json`, and
  `scripts/smoke-disabled-product-write-adapter-reentry-harness-v0-1.mjs`
  (`npm run smoke:disabled-product-write-adapter-reentry-harness-v0-1`)
  follows PR #800 Release Readiness Matrix. This slice is disabled and
  review-only. Product-write remains parked by #686, and product-write
  authority is not granted. This pointer is repo-local documentation metadata,
  not SSOT. The roadmap guide is not SSOT. It does not add product-write
  runtime, product-write adapter enablement, product-write target contract
  authority, product ID allocation, product persistence, DB read/write, routes,
  UI, durable Perspective state mutation, Formation Receipt writes, promotion
  execution, proof/evidence writes, claim/evidence writes, Git Ledger export
  runtime, Git writes, GitHub API calls, pull request creation, repository file
  writes, provider calls, prompt sending, retrieval/RAG execution, source fetch,
  browser log ingestion, session log ingestion, raw conversation ingestion,
  telemetry ingestion, Codex execution, or GitHub automation.

  Boundary phrases: Disabled Product Write Adapter Reentry Harness v0.1;
  disabled; review-only; not reentry approval; not adapter runtime;
  product-write remains parked by #686; product-write authority is not granted;
  product-write runtime is not implemented; product-write adapter is not
  enabled; product-write target contract is not created; product IDs are not
  allocated; products are not persisted; no product-write runtime; no
  product-write adapter enabled; no product target contract; no product ID
  allocation; no product persistence; no product route; no product UI; no DB
  read/write; no route; no UI; no durable state mutation; no Formation Receipt
  write; no promotion execution; no proof/evidence write; no claim/evidence
  write; no Git Ledger export runtime; no Git write; no GitHub API call; no
  pull request creation; no repository file write; no provider/OpenAI call; no
  prompt sent; no retrieval execution; no RAG answer generation; no source
  fetch; no Codex execution; no GitHub automation.
- Release Candidate Operator Review v0.1:
  `docs/RELEASE_CANDIDATE_OPERATOR_REVIEW_V0_1.md`,
  `lib/release-readiness/release-candidate-operator-review.ts`,
  `fixtures/release-candidate-operator-review.sample.v0.1.json`, and
  `scripts/smoke-release-candidate-operator-review-v0-1.mjs`
  (`npm run smoke:release-candidate-operator-review-v0-1`) follows PR #800
  Release Readiness Matrix and PR #801 Disabled Product Write Adapter Reentry
  Harness. This slice is review-only. Product-write remains parked by #686,
  and release/product-write authority is not granted. This pointer is
  repo-local documentation metadata, not SSOT. The roadmap guide is not SSOT.
  It does not add release execution, release artifact creation, release
  approval automation, product-write runtime, product-write adapter enablement,
  product-write target contract authority, product ID allocation, product
  persistence, DB read/write, routes, UI, durable Perspective state mutation,
  Formation Receipt writes, promotion execution, proof/evidence writes,
  claim/evidence writes, Git Ledger export runtime, Git writes, GitHub API
  calls, pull request creation, repository file writes, provider calls, prompt
  sending, retrieval/RAG execution, source fetch, browser log ingestion,
  session log ingestion, raw conversation ingestion, telemetry ingestion, Codex
  execution, or GitHub automation.

  Boundary phrases: Release Candidate Operator Review v0.1; review-only; not
  release; not release approval; release authority is not granted;
  product-write remains parked by #686; product-write authority is not granted;
  product-write runtime is not implemented; product-write adapter is not
  enabled; product-write target contract is not created; product IDs are not
  allocated; products are not persisted; no release execution; no release
  artifacts; no release authority; no release candidate approval; no
  product-write runtime; no product-write adapter enabled; no product target
  contract; no product ID allocation; no product persistence; no product route;
  no product UI; no DB read/write; no route; no UI; no durable state mutation;
  no Formation Receipt write; no promotion execution; no proof/evidence write;
  no claim/evidence write; no Git Ledger export runtime; no Git write; no
  GitHub API call; no pull request creation; no repository file write; no
  provider/OpenAI call; no prompt sent; no retrieval execution; no RAG answer
  generation; no source fetch; no Codex execution; no GitHub automation.
- Release Notes Public Safe Summary v0.1:
  `docs/RELEASE_NOTES_PUBLIC_SAFE_SUMMARY_V0_1.md`,
  `lib/release-readiness/release-notes-public-safe-summary.ts`,
  `fixtures/release-notes-public-safe-summary.sample.v0.1.json`, and
  `scripts/smoke-release-notes-public-safe-summary-v0-1.mjs`
  (`npm run smoke:release-notes-public-safe-summary-v0-1`) follows PR #802
  Release Candidate Operator Review. This slice is review-only and
  candidate-only. Product-write remains parked by #686, and
  release/product-write authority is not granted. This pointer is repo-local
  documentation metadata, not SSOT. The roadmap guide is not SSOT. It does not
  add release notes publication, release execution, release artifact creation,
  release approval automation, product-write runtime, product-write adapter
  enablement, product-write target contract authority, product ID allocation,
  product persistence, DB read/write, routes, UI, durable Perspective state
  mutation, Formation Receipt writes, promotion execution, proof/evidence
  writes, claim/evidence writes, Git Ledger export runtime, Git writes, GitHub
  API calls, pull request creation, repository file writes, provider calls,
  prompt sending, retrieval/RAG execution, source fetch, browser log ingestion,
  session log ingestion, raw conversation ingestion, telemetry ingestion, Codex
  execution, or GitHub automation.

  Boundary phrases: Release Notes Public Safe Summary v0.1; review-only;
  candidate-only; does not publish release notes; release notes are not
  published; no release notes publication; no release execution; no release
  artifacts; no release authority; no release candidate approval;
  product-write remains parked by #686; product-write authority is not granted;
  product-write runtime is not implemented; product-write adapter is not
  enabled; product-write target contract is not created; product IDs are not
  allocated; products are not persisted; no product-write runtime; no
  product-write adapter enabled; no product target contract; no product ID
  allocation; no product persistence; no product route; no product UI; no DB
  read/write; no route; no UI; no durable state mutation; no Formation Receipt
  write; no promotion execution; no proof/evidence write; no claim/evidence
  write; no Git Ledger export runtime; no Git write; no GitHub API call; no
  pull request creation; no repository file write; no provider/OpenAI call; no
  prompt sent; no retrieval execution; no RAG answer generation; no source
  fetch; no Codex execution; no GitHub automation.
- Release Operator Checklist v0.1:
  `docs/RELEASE_OPERATOR_CHECKLIST_V0_1.md`,
  `lib/release-readiness/release-operator-checklist.ts`,
  `fixtures/release-operator-checklist.sample.v0.1.json`, and
  `scripts/smoke-release-operator-checklist-v0-1.mjs`
  (`npm run smoke:release-operator-checklist-v0-1`) follows PR #803 Release
  Notes Public Safe Summary. This slice is review-only and candidate-only.
  Product-write remains parked by #686, and release/product-write authority is
  not granted. This pointer is repo-local documentation metadata, not SSOT.
  The roadmap guide is not SSOT. It does not add release notes publication,
  release execution, release artifact creation, release approval automation,
  product-write runtime, product-write adapter enablement, product-write target
  contract authority, product ID allocation, product persistence, DB
  read/write, routes, UI, durable Perspective state mutation, Formation Receipt
  writes, promotion execution, proof/evidence writes, claim/evidence writes,
  Git Ledger export runtime, Git writes, GitHub API calls, pull request
  creation, repository file writes, provider calls, prompt sending,
  retrieval/RAG execution, source fetch, browser log ingestion, session log
  ingestion, raw conversation ingestion, telemetry ingestion, Codex execution,
  or GitHub automation.

  Boundary phrases: Release Operator Checklist v0.1; review-only;
  candidate-only; not release approval; does not publish release notes; release
  notes are not published; no release notes publication; no release execution;
  no release artifacts; no release authority; no release candidate approval;
  product-write remains parked by #686; product-write authority is not granted;
  product-write runtime is not implemented; product-write adapter is not
  enabled; product-write target contract is not created; product IDs are not
  allocated; products are not persisted; no product-write runtime; no
  product-write adapter enabled; no product target contract; no product ID
  allocation; no product persistence; no product route; no product UI; no DB
  read/write; no route; no UI; no durable state mutation; no Formation Receipt
  write; no promotion execution; no proof/evidence write; no claim/evidence
  write; no Git Ledger export runtime; no Git write; no GitHub API call; no
  pull request creation; no repository file write; no provider/OpenAI call; no
  prompt sent; no retrieval execution; no RAG answer generation; no source
  fetch; no Codex execution; no GitHub automation.
- Release Candidate Freeze Manifest v0.1:
  `docs/RELEASE_CANDIDATE_FREEZE_MANIFEST_V0_1.md`,
  `lib/release-readiness/release-candidate-freeze-manifest.ts`,
  `fixtures/release-candidate-freeze-manifest.sample.v0.1.json`, and
  `scripts/smoke-release-candidate-freeze-manifest-v0-1.mjs`
  (`npm run smoke:release-candidate-freeze-manifest-v0-1`) follows PR #804
  Release Operator Checklist. This slice is review-only and candidate-only.
  Product-write remains parked by #686, and release/product-write authority is
  not granted. This pointer is repo-local documentation metadata, not SSOT.
  The roadmap guide is not SSOT. It does not add release freeze execution,
  release notes publication, release execution, release artifact creation,
  release approval automation, product-write runtime, product-write adapter
  enablement, product-write target contract authority, product ID allocation,
  product persistence, DB read/write, routes, UI, durable Perspective state
  mutation, Formation Receipt writes, promotion execution, proof/evidence
  writes, claim/evidence writes, Git Ledger export runtime, Git writes, GitHub
  API calls, pull request creation, repository file writes, provider calls,
  prompt sending, retrieval/RAG execution, source fetch, browser log ingestion,
  session log ingestion, raw conversation ingestion, telemetry ingestion,
  Codex execution, or GitHub automation.

  Boundary phrases: Release Candidate Freeze Manifest v0.1; review-only;
  candidate-only; not release freeze; does not freeze a release; does not
  publish release notes; release notes are not published; no release freeze
  execution; no release notes publication; no release execution; no release
  artifacts; no release authority; no release candidate approval; product-write
  remains parked by #686; product-write authority is not granted; product-write
  runtime is not implemented; product-write adapter is not enabled;
  product-write target contract is not created; product IDs are not allocated;
  products are not persisted; no product-write runtime; no product-write
  adapter enabled; no product target contract; no product ID allocation; no
  product persistence; no product route; no product UI; no DB read/write; no
  route; no UI; no durable state mutation; no Formation Receipt write; no
  promotion execution; no proof/evidence write; no claim/evidence write; no Git
  Ledger export runtime; no Git write; no GitHub API call; no pull request
  creation; no repository file write; no provider/OpenAI call; no prompt sent;
  no retrieval execution; no RAG answer generation; no source fetch; no Codex
  execution; no GitHub automation.
- Release Postmerge Observer Notes v0.1:
  `docs/RELEASE_POSTMERGE_OBSERVER_NOTES_V0_1.md`,
  `lib/release-readiness/release-postmerge-observer-notes.ts`,
  `fixtures/release-postmerge-observer-notes.sample.v0.1.json`, and
  `scripts/smoke-release-postmerge-observer-notes-v0-1.mjs`
  (`npm run smoke:release-postmerge-observer-notes-v0-1`) follows PR #805
  Release Candidate Freeze Manifest. This slice is review-only and
  candidate-only. Product-write remains parked by #686, and release/product-write
  authority is not granted. This pointer is repo-local documentation metadata,
  not SSOT. The roadmap guide is not SSOT. It does not add actual postmerge
  observation, merge execution, Git execution, GitHub calls, repository file
  writes, release freeze execution, release notes publication, release
  execution, release artifact creation, release approval automation,
  product-write runtime, product-write adapter enablement, product-write target
  contract authority, product ID allocation, product persistence, DB
  read/write, routes, UI, durable Perspective state mutation, Formation Receipt
  writes, promotion execution, proof/evidence writes, claim/evidence writes,
  Git Ledger export runtime, provider calls, prompt sending, retrieval/RAG
  execution, source fetch, browser log ingestion, session log ingestion, raw
  conversation ingestion, telemetry ingestion, Codex execution, or GitHub
  automation.

  Boundary phrases: Release Postmerge Observer Notes v0.1; review-only;
  candidate-only; not actual postmerge observation; does not perform merge; does
  not execute Git; does not call GitHub; does not write repository files; does
  not freeze a release; does not publish release notes; release notes are not
  published; no actual postmerge observation; no merge execution; no Git
  execution; no GitHub calls; no repository file writes; no release freeze
  execution; no release notes publication; no release execution; no release
  artifacts; no release authority; no release candidate approval; product-write
  remains parked by #686; product-write authority is not granted; product-write
  runtime is not implemented; product-write adapter is not enabled;
  product-write target contract is not created; product IDs are not allocated;
  products are not persisted; no product-write runtime; no product-write
  adapter enabled; no product target contract; no product ID allocation; no
  product persistence; no product route; no product UI; no DB read/write; no
  route; no UI; no durable state mutation; no Formation Receipt write; no
  promotion execution; no proof/evidence write; no claim/evidence write; no Git
  Ledger export runtime; no provider/OpenAI call; no prompt sent; no retrieval
  execution; no RAG answer generation; no source fetch; no Codex execution; no
  GitHub automation.
- Privacy Redaction Runtime Guard v0.1:
  `docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md`,
  `lib/privacy/redaction-guard.ts`,
  `fixtures/privacy-redaction-guard.sample.v0.1.json`, and
  `scripts/smoke-privacy-redaction-guard-v0-1.mjs`
  (`npm run smoke:privacy-redaction-guard-v0-1`) implements
  `privacy_redaction_runtime_guard_v0_1` from the integrated roadmap guide
  v0.2.1 FULL. This slice is a deterministic public-safe redaction/runtime
  guard over caller-provided objects, strings, and arrays only. Product-write
  remains parked by #686. This pointer is repo-local documentation metadata,
  not SSOT. The roadmap guide is not SSOT. It does not implement export/import,
  Git Ledger export runtime, Git Ledger builder, canonical label creation,
  raw/private payload persistence, raw source body storage, provider output
  storage, provider thread/run/session ID canonicalization, private URL
  canonicalization, local private path canonicalization, DB query/write, routes,
  UI, source fetch, local/repository/uploaded-file reads, provider/OpenAI
  calls, prompt sending, retrieval/RAG execution, proof/evidence writes,
  claim/evidence writes, promotion execution, durable Perspective state writes,
  Formation Receipt writes, Git writes, GitHub API calls, repository file
  writes, Codex execution, GitHub automation, product-write, or product ID
  allocation. Smoke/CI pass is not truth.

  Boundary phrases: Privacy Redaction Runtime Guard v0.1; public-safe
  deterministic report; caller-provided input only; no raw unsafe value echo;
  no canonical labels from private identifiers; reference-only opaque connector
  IDs; reference-only uploaded-file opaque IDs; no export/import runtime; no Git
  Ledger export runtime; no Git Ledger builder; no provider/OpenAI call; no
  prompt sent; no source fetch; no local file read; no repository file read; no
  uploaded-file read; no retrieval execution; no RAG answer generation; no DB
  query/write; no route; no UI; no proof/evidence write; no claim/evidence
  write; no promotion execution; no durable state write; no Formation Receipt
  write; no Git write; no GitHub API call; no repository file write; no Codex
  execution; no GitHub automation; product-write remains parked by #686;
  product-write authority is not granted; smoke pass is not truth; CI pass is
  not truth.
- Local Data Export/Import Policy v0.1:
  `docs/LOCAL_DATA_EXPORT_IMPORT_POLICY_V0_1.md`,
  `types/local-data-export.ts`,
  `fixtures/local-data-export.sample.v0.1.json`, and
  `scripts/smoke-local-data-export-policy-v0-1.mjs`
  (`npm run smoke:local-data-export-policy-v0-1`) implements
  `local_data_export_import_policy_v0_1` from the integrated roadmap guide
  v0.2.1 FULL. This slice is policy-only and contract-only. Privacy Redaction
  Runtime Guard v0.1 is required before any future export/import runtime.
  Product-write remains parked by #686. This pointer is repo-local
  documentation metadata, not SSOT. The roadmap guide is not SSOT. It defines a
  public-safe export/import policy only and does not implement export/import
  runtime, file writes, file reads as export/import input, DB query/write,
  routes, UI, provider/OpenAI calls, prompt sending, retrieval/RAG execution,
  proof/evidence writes, claim/evidence writes, promotion execution, durable
  Perspective state writes or apply, Formation Receipt writes, Git Ledger export
  runtime, GitHub API calls, Git execution, Codex execution, product-write, or
  product ID allocation. Imports are preview/validate only unless a future
  explicit operator-gated runtime slice is approved. Smoke/CI pass is not truth.

  Boundary phrases: Local Data Export/Import Policy v0.1; policy-only;
  contract-only; privacy_redaction_runtime_guard_v0_1 dependency; public-safe
  summary only; symbolic refs only; reference-only deferred refs; source refs
  are lineage pointers, not proof; candidates are not facts; review records are
  not durable state; feedback is not truth; retrieval index metadata is derived;
  provider extraction outputs are candidate-only; Git Ledger export refs are
  future/deferred refs only; product-write refs are parked/blocked refs only;
  product-write remains parked by #686; product-write authority is not granted;
  no export/import runtime; no file write; no file read as export/import input;
  no DB query/write; no route; no UI; no provider/OpenAI call; no prompt sent;
  no retrieval execution; no RAG answer generation; no proof/evidence write; no
  claim/evidence write; no promotion execution; no durable state write; no
  durable state apply; no Formation Receipt write; no Git Ledger export runtime;
  no GitHub API call; no Git execution; no Codex execution; no product-write; no
  product ID allocation; no auto-promote; no auto-product-write; no
  auto-proof/evidence write; no auto-durable-state apply; no auto-provider call;
  no auto-retrieval; no auto-Git/GitHub; smoke pass is not truth; CI pass is not
  truth.
- Authority Boundary Regression CI v0.1:
  `docs/AUTHORITY_BOUNDARY_REGRESSION_CI_V0_1.md`,
  `fixtures/authority-boundary-regression-baseline.sample.v0.1.json`,
  `scripts/smoke-authority-boundary-regression-v0-1.mjs`, and
  `.github/workflows/authority-boundary-smoke.yml`
  (`npm run smoke:authority-boundary-regression-v0-1`) implements
  `authority_boundary_regression_ci_v0_1` from the integrated roadmap guide
  v0.2.1 FULL. This slice is static-smoke-only and diagnostic-only. CI runs the
  static smoke only with read-only workflow permissions. Product-write remains
  parked by #686. This pointer is repo-local documentation metadata, not SSOT.
  The roadmap guide is not SSOT. It does not add runtime routes or UI, DB
  query/write, provider/OpenAI calls, prompt sending, source fetch,
  retrieval/RAG execution, export/import runtime, Git Ledger export runtime,
  Git writes, GitHub mutation APIs, Codex execution, proof/evidence writes,
  claim/evidence writes, promotion execution, durable Perspective state writes
  or apply, Formation Receipt writes, product-write, or product ID allocation.
  CI pass is not truth, proof, approval, promotion, merge approval, release
  approval, product-write authority, or durable state. CI failure is diagnostic,
  not automatic rejection. Smoke pass is not truth.

  Boundary phrases: Authority Boundary Regression CI v0.1; static-smoke-only;
  diagnostic-only; read-only GitHub Actions permissions; selected repo text
  scan only; no runtime mutation; no DB query/write; no route; no UI; no
  provider/OpenAI call; no prompt sent; no source fetch; no retrieval execution;
  no RAG answer generation; no export/import runtime; no Git Ledger export
  runtime; no Git write; no GitHub mutation API; no Codex execution; no
  proof/evidence write; no claim/evidence write; no promotion execution; no
  durable state write; no durable state apply; no Formation Receipt write; no
  product-write; no product ID allocation; CI pass is not truth; CI pass is not
  proof; CI pass is not approval; CI failure is diagnostic, not automatic
  rejection; smoke pass is not truth; smoke pass is not proof; PR body is not
  authority; Git ref is not authority; GitHub PR is not Core decision;
  product-write remains parked by #686.
- Codex Result Report Ingestion v0.1:
  `docs/CODEX_RESULT_REPORT_INGESTION_V0_1.md`,
  `lib/dogfooding/codex-result-report-normalizer.ts`,
  `fixtures/codex-result-report-ingestion.sample.v0.1.json`,
  `scripts/smoke-codex-result-report-ingestion-v0-1.mjs`, and
  `components/codex-result-report-ingestion-panel.tsx`
  (`npm run smoke:codex-result-report-ingestion-v0-1`) implements
  `codex_result_report_ingestion_v0_1` from the integrated roadmap guide
  v0.2.1 FULL. This slice normalizes caller-provided Codex result reports into
  deterministic public-safe dogfooding candidate input for later operator
  review. Codex result report is candidate input only. PR body is not
  authority. Changed files are review cues only. Validation commands are
  diagnostic only. CI pass is not truth. Smoke pass is not truth. Validation
  pass is not approval. Validation failure is not automatic rejection.
  Product-write remains parked by #686. This pointer is repo-local documentation
  metadata, not SSOT. The roadmap guide is not SSOT. It does not execute Codex,
  call GitHub, create branches/commits/PRs/merges, run validation commands, read
  or write files, query/write DB, add routes, call providers, execute
  retrieval/RAG, create proof/evidence, promote Perspective, write/apply durable
  Perspective state, write Formation Receipts, execute Git Ledger export,
  product-write, or allocate product IDs.

  Boundary phrases: Codex Result Report Ingestion v0.1; caller-provided input
  only; deterministic normalization; candidate-only; public-safe summary only;
  Privacy Redaction Runtime Guard v0.1 aligned; Authority Boundary Regression
  CI compatible; Local Data Export/Import Policy remains policy-only; Codex
  report is not proof, not evidence, not durable state, and not execution
  approval; GitHub branch/commit/PR refs are references only, not authority; no
  Codex execution; no GitHub API call; no GitHub mutation; no branch creation;
  no commit creation; no PR creation; no merge execution; no Git write; no
  repository file write; no runtime state mutation; no DB query/write; no
  route; no provider/OpenAI call; no prompt sent; no source fetch; no retrieval
  execution; no RAG answer generation; no proof/evidence write; no
  claim/evidence write; no promotion execution; no durable state write; no
  durable state apply; no Formation Receipt write; no Git Ledger export
  runtime; no export/import runtime; no product-write; no product ID
  allocation; product-write remains parked by #686; smoke pass is not truth; CI
  pass is not truth.
- Temporal Handoff Usefulness Experiment Plan v0.1:
  `docs/TEMPORAL_HANDOFF_USEFULNESS_EXPERIMENT_PLAN_V0_1.md`,
  `fixtures/temporal-handoff-usefulness-scenario.sample.v0.1.json`, and
  `scripts/smoke-temporal-handoff-usefulness-experiment-plan-v0-1.mjs`
  (`npm run smoke:temporal-handoff-usefulness-experiment-plan-v0-1`)
  implements `temporal_handoff_usefulness_experiment_v0_1` from the integrated
  roadmap guide v0.2.1 FULL. This slice is experiment-plan-only and
  fixture-only. It defines ordinary Codex prompt vs existing
  Perspective/Handoff Capsule vs Temporal Perspective enhanced handoff
  comparison. It defines a scoring rubric and operator review protocol for
  expected files/checks, unresolved tensions, authority boundary clarity,
  source refs, not-done classification, expected/observed delta, decision hold
  classification, and overconfident narrative guard. Product-write remains
  parked by #686. This pointer is repo-local documentation metadata, not SSOT.
  The roadmap guide is not SSOT. It does not execute experiments, call Codex,
  call GitHub, create branches/commits/PRs/merges, run validation commands,
  read/write files as runtime behavior, query/write DB, add routes/UI, ingest
  telemetry, call providers, execute retrieval/RAG, create proof/evidence,
  promote Perspective, write/apply durable state, write Formation Receipts,
  execute Git Ledger export, product-write, or allocate product IDs.

  Boundary phrases: Temporal Handoff Usefulness Experiment Plan v0.1;
  plan-only; fixture-only; diagnostic-only; future operator experiment only;
  caller-provided scenario only; Codex Result Report Ingestion compatible;
  Authority Boundary Regression CI compatible; Privacy Redaction Runtime Guard
  required before future runtime; Local Data Export/Import Policy remains
  policy-only; Experiment result is not truth; Handoff score is not proof;
  Better score is not approval; Worse score is not rejection; Codex result
  report is candidate input only; PR body is not authority; CI pass is not
  truth; Smoke pass is not truth; GitHub refs are references only, not
  authority; no experiment runtime execution; no telemetry ingestion; no
  analytics DB write; no Codex execution; no GitHub API call; no branch
  creation; no commit creation; no PR creation; no merge execution; no Git
  write; no repository file write as runtime behavior; no runtime state
  mutation; no DB query/write; no route; no UI; no provider/OpenAI call; no
  prompt sent; no source fetch; no retrieval execution; no RAG answer
  generation; no proof/evidence write; no claim/evidence write; no promotion
  execution; no durable state write; no durable state apply; no Formation
  Receipt write; no Git Ledger export runtime; no export/import runtime; no
  product-write; no product ID allocation; product-write remains parked by
  #686; smoke pass is not truth; CI pass is not truth.
- Research Candidate AI Context Packet preview:
  `types/research-candidate-ai-context-packet.ts`,
  `lib/research-candidate-review/ai-context-packet.ts`,
  `fixtures/research-candidate-review.ai-context-packet.sample.v0.1.json`,
  `fixtures/research-candidate-review.manual-note-ai-context-packet.sample.v0.1.json`,
  `components/research-candidate-ai-context-packet-preview.tsx`, and
  `components/augnes-cockpit.tsx` define and render a read-only handoff packet
  preview compiled from static overlay fixtures, with no provider prompt execution, no Codex execution, no retrieval, no durable memory, no
  runtime/API/DB/provider/retrieval/promotion behavior, no proof/evidence write,
  and no work item creation.
- `npm run smoke:research-candidate-review-ai-context-packet-v0-1`:
  packet type contract, deterministic packet builder output, relationship
  summaries, final guardrails, Cockpit read-only wiring, docs/index pointers,
  and non-authority boundaries를 정적으로 확인한다.
Boundary 요약: candidate-only, type-only, static audit only, read-only static
fixture only, preview-only deterministic parser, non-authoritative preview
contract다. The Cockpit manual note panel now has a bounded same-origin runtime
route and optional non-canonical preview-draft persistence, but it still creates
no durable candidate/review/receipt storage, no canonical Perspective state, no
proof/evidence write, no work item, no provider/OpenAI call, no retrieval/source
fetch, no Codex execution, no external handoff, and no promotion/reject/defer
workflow. The Cockpit/Perspective static fixture preview adds no parser
behavior, no work item creation, and no proof/evidence write. The manual parser
itself adds no runtime/API route, no UI input behavior, no provider calls, no
retrieval, no DB writes, no proof/evidence write, no work item creation, and no
promotion behavior. The parser output Cockpit/Perspective static preview panel
is read-only static parser output fixture material with no runtime UI input, no
live parser execution, no provider calls, no retrieval, no DB writes, no
proof/evidence write, no work item creation, no promotion behavior, and no
runtime/API route. The Candidate Constellation Overlay preview uses read-only
candidate nodes and typed edges with no graph DB, no layout algorithm, no
embeddings, no runtime/API/DB/provider/retrieval/promotion behavior, no
proof/evidence write, and no work item creation. The Research Candidate AI
Context Packet preview is a read-only handoff packet with no provider prompt
execution, no Codex execution, no retrieval, no durable memory, no
runtime/API/DB/provider/retrieval/promotion behavior, no proof/evidence write,
and no work item creation. The Formation Receipt preview is a read-only receipt
preview with no durable receipt storage, no event log, no proof/evidence write,
no work item creation, no perspective promotion, and no runtime/API/DB/provider/retrieval behavior.

- Formation Receipt preview:
  `types/research-candidate-formation-receipt.ts`,
  `lib/research-candidate-review/formation-receipt.ts`,
  `fixtures/research-candidate-review.formation-receipt.sample.v0.1.json`,
  `fixtures/research-candidate-review.manual-note-formation-receipt.sample.v0.1.json`,
  `components/research-candidate-formation-receipt-preview.tsx`, and
  `components/augnes-cockpit.tsx` define and render a read-only receipt preview
  compiled from static AI context packet and overlay fixtures, with no durable
  receipt storage, no event log, no proof/evidence write, no work item creation,
  no perspective promotion, and no runtime/API/DB/provider/retrieval behavior.
- `npm run smoke:research-candidate-review-formation-receipt-v0-1`:
  receipt type contract, deterministic receipt builder output, contribution
  mappings, Cockpit read-only wiring, docs/index pointers, and non-authority
  boundaries를 정적으로 확인한다.
- v0.1 preview milestone closeout:
  `docs/RESEARCH_CANDIDATE_REVIEW_V0_1_CLOSEOUT.md` summarizes the Research
  Candidate Review surface, type contract, canonical gates, Cockpit previews,
  manual parser, parser output, Candidate Constellation Overlay, AI context
  packet, and Formation Receipt preview chain. Its next implementation lane is
  the Cockpit manual pasted note preview UI shell, and the closeout adds
  no runtime/durable behavior.
- `npm run smoke:research-candidate-review-v0-1-closeout`: closeout headings,
  preview chain coverage, docs/index/package pointers, next implementation
  lane, and non-authority boundaries를 정적으로 확인한다.

### 최근 front-door start guide 포인터 (repo-local, non-SSOT)

이 포인터는 Active set을 늘리거나 새 권위를 만들지 않는다. Human
operator, ChatGPT / MCP user, and Codex worker가 현재 Augnes 시작 경로를
빠르게 찾기 위한 repo-local 색인이다.

- `AUGNES_START_HERE_FOR_USERS_AND_AI.md`: README front-door companion
  guide다. What Augnes is, what works today, preview-only areas, local human
  quick start, ChatGPT / MCP bridge quick start, Codex quick start,
  `AG-DOGFOOD-RESEARCH-001` research work loop, `codexResultText` /
  `codexResultPaste` return path, and authority boundaries를 한 곳에 모은다.

이 문서는 Active set을 확장하지 않고 runtime/schema/implementation/
diagnostic/evaluation/evidence/proof authority를 만들지 않는다.
production-readiness 또는 autonomous capability를 의미하지 않는다.

Boundary 요약: 이 start guide는 Cockpit behavior, routes, DB schema,
MCP/App tools, research ingestion, provider/OpenAI calls, Codex execution,
GitHub automation, proof/evidence writes, state commit/reject, 또는
work_loop_readonly surface를 변경하지 않는다.

### 최근 dogfooding episode template 포인터 (repo-local, non-SSOT)

이 포인터들은 Active set을 늘리거나 새 권위를 만들지 않는다. raw episode
capture, Codex handoff, dogfooding episode log 형식을 찾기 위한 repo-local
색인이다.

- `RAW_EPISODE_CAPTURE_V0_1.md`: raw episode anchor를 summary보다 먼저
  보존하기 위한 docs-only, non-SSOT research/evaluation guidance다.
- `CODEX_HANDOFF_V0_1.md`: Codex 작업을 scoping, testing, reporting,
  review하기 위한 docs-only handoff template이다.
- `DOGFOODING_EPISODE_LOG_V0_1.md`: raw anchors, handoff quality, review
  outcome, gaps, next-goal selection을 분리해서 기록하기 위한 docs-only
  episode log template이다.

이 문서들은 Active set을 확장하지 않고 runtime/schema/implementation/
diagnostic/evaluation/evidence/proof authority를 만들지 않는다.
production-readiness 또는 autonomous capability를 의미하지 않는다.

Boundary 요약: 이 문서들은 `PerspectiveSnapshot` behavior, diagnostics,
schema, routes, Cockpit controls, Augnes Core authority, 또는 Sidecar e_t
placeholder status를 변경하지 않는다.

### 최근 dogfooding evaluation 포인터 (repo-local, non-SSOT)

이 포인터들은 Active set을 늘리거나 새 권위를 만들지 않는다. dogfooding
episode를 raw-episode-grounded 방식으로 비교하고 negative/partial case를
보존하기 위한 repo-local 색인이다.

- `DOGFOODING_EVALUATION_CRITERIA_V0_1.md`: Augnes dogfooding episode를
  비교하기 위한 docs-only, non-authoritative, case-based review aid다.
- `DOGFOODING_EVALUATION_CASEBOOK_V0_1.md`: negative, partial, ambiguous,
  failed, successful case를 raw anchor와 gap 중심으로 모으기 위한 docs-only
  casebook template이다.

이 문서들은 Active set을 확장하지 않고 runtime/schema/implementation/
diagnostic/evaluation/evidence/proof authority를 만들지 않는다.
production-readiness 또는 autonomous capability를 의미하지 않는다.

Boundary 요약: 이 문서들은 `PerspectiveSnapshot` behavior, diagnostics,
schema, routes, Cockpit controls, Augnes Core authority, 또는 Sidecar e_t
placeholder status를 변경하지 않는다.

### 최근 Perspective continuity smoke design 포인터 (repo-local, non-SSOT)

이 포인터는 Active set을 늘리거나 새 권위를 만들지 않는다. Perspective
continuity sequence fixtures를 future smoke 관점에서 검토하기 위한
smoke-design-only, documentation-boundary-first 색인이다.

- `PERSPECTIVE_CONTINUITY_SMOKE_DESIGN_V0_1.md`: future smoke sequence
  fixture families와 boundary assertions를 정리하는 non-authoritative
  research/evaluation guidance다.
- `npm run smoke:perspective-continuity-boundaries`: focused
  documentation-boundary-only smoke로, public-safe wording, non-authority
  status, raw-anchor summary boundaries, evaluation/scoring boundaries,
  diagnostic placeholder boundaries, index pointer boundaries를 정적으로
  확인한다.
- `npm run smoke:perspective-continuity-sequences`: runtime-disabled sequence
  fixture skeleton으로, in-memory fixture descriptors의 review-aid-only
  boundary와 gap handling을 확인한다.

이 문서는 Active set을 확장하지 않고 runtime/schema/implementation/
diagnostic/evaluation/evidence/proof/scoring/benchmark authority를 만들지
않는다. production-readiness 또는 autonomous capability를 의미하지 않는다.

Boundary 요약: 이 디자인 문서는 runtime sequence fixture behavior를
구현하지 않으며, 새 smoke들은 documentation-boundary-only 정적 확인과
runtime-disabled sequence fixture 확인에 한정된다. 이 포인터들은
`PerspectiveSnapshot` behavior, diagnostics, schema, routes, Cockpit
controls, Augnes Core authority, runtime sequence behavior, 또는 Sidecar e_t
placeholder status를 변경하지 않는다.

### Promotion readiness packet from Review Memory v0.1 포인터 (repo-local, non-SSOT)

이 포인터는 Active set을 늘리거나 새 권위를 만들지 않는다.
`promotion_readiness_packet_from_review_memory_v0_1`은 existing Review
Memory DB records에서 bounded diagnostic readiness packet만 만드는
read-only runtime slice다.

- `docs/PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_V0_1.md`: 승인된
  readiness packet boundary, read-only Review Memory DB access, no promotion
  decision store write, no proof/evidence, no durable state, no Formation
  Receipt, no product-write, no provider/retrieval/source-fetch boundary를
  정리한다.
- `types/promotion-readiness-packet-from-review-memory.ts`: bounded request,
  policy, result, authority boundary contract다.
- `lib/perspective/promotion/promotion-readiness-packet-from-review-memory.ts`:
  DB-free preflight와 caller-injected read-only Review Memory record packet
  builder다.
- `app/api/perspective/promotion/readiness-packet/route.ts`: same-origin POST
  route다. It opens existing Review Memory DB files read-only and does not
  create DB files, directories, schema, Review Memory rows, promotion decision
  records, Formation Receipts, durable state, proof/evidence, accepted evidence
  refs, product state, or product IDs.
- `fixtures/promotion-readiness-packet-from-review-memory.sample.v0.1.json`:
  public-safe fixture for ready, degraded, blocked, missing DB/schema, invalid
  path, audit, forbidden authority, and private/raw-key cases.
- `scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs`:
  focused smoke implementation for this slice.
- `npm run smoke:promotion-readiness-packet-from-review-memory-v0-1`: focused
  smoke for the runtime, docs, fixture, package script, latest pointer, exact
  changed-file scope, and no-promotion/no-write boundaries.
- Audit surface: `promotion_readiness_packet_from_review_memory_runtime`.

### Final RAG answer Review Memory end-to-end operator path v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add product authority.
`final_rag_answer_review_memory_end_to_end_operator_path_v0_1` validates one
bounded operator path across already merged surfaces: final RAG answer
candidate, Review Memory binding, Review Memory read/display surface, and
promotion readiness packet.

- `docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_END_TO_END_OPERATOR_PATH_V0_1.md`:
  documents the E2E operator path, route-handler sequence, no-new-authority
  boundary, Review Memory boundary, UI read/display boundary, and readiness
  packet boundary.
- `fixtures/final-rag-answer-review-memory-end-to-end-operator-path.sample.v0.1.json`:
  public-safe fixture for expected runtime sequence, candidate-only boundary,
  Review Memory boundary, read/display-only UI boundary, readiness boundary,
  no-authority flags, and skipped/degraded route-stage policy.
- `scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs`:
  focused smoke that seeds only temporary fixture DBs, calls existing route
  handlers for the final RAG answer candidate, Review Memory binding, Review
  Memory GET read/display surface, and promotion readiness packet, and asserts
  the path remains candidate/review/readiness-only.
- `npm run smoke:final-rag-answer-review-memory-end-to-end-operator-path-v0-1`:
  focused smoke for docs, fixture, package script, latest pointer, referenced
  merged surfaces, public-safe route-level E2E behavior, exact changed-file
  scope, and no-promotion/no-write boundaries.

Boundary summary: this validation path does not add API routes, UI behavior, DB
schema, proof/evidence, promotion execution, promotion decision writes,
promotion decision store writes, Formation Receipts, durable Perspective state
writes/applies, product-write, accepted evidence ref writes, product IDs, live
provider calls, source fetches, Git/GitHub actuation, release execution, or
automatic answer-to-product conversion. `ready_for_operator_promotion_review`
means future human review readiness only. Smoke/CI pass is not truth.

Boundary 요약: readiness packet은 diagnostic이며 promotion, proof, evidence,
accepted evidence, durable state, Formation Receipt, product-write, product,
approval, or smoke/CI truth가 아니다.

### Final RAG answer Review Memory operator browser validation v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add product authority.
`final_rag_answer_review_memory_operator_browser_validation_v0_1` validates
the browser/operator-facing side of already merged final answer candidate
Review Memory read/display UI behavior against a temporary public-safe Review
Memory DB.

- `docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_BROWSER_VALIDATION_V0_1.md`:
  documents the browser validation target, artifact paths, request
  allow/deny list, no-new-authority boundary, and browser availability policy.
- `fixtures/final-rag-answer-review-memory-operator-browser-validation.sample.v0.1.json`:
  public-safe fixture for the seeded Review Memory record summary, visible
  boundary notes, allowed GET routes, forbidden routes, no-authority flags, and
  `/tmp` artifact paths.
- `scripts/browser-validate-final-rag-answer-review-memory-operator-path-v0-1.mjs`:
  launches the existing local Augnes dev server, seeds temporary Review Memory
  DB data as test setup only, drives the existing UI page through a real
  browser via Chrome DevTools Protocol, captures desktop/mobile screenshots
  under `/tmp`, writes a report under `/tmp`, and fails on forbidden browser
  requests.
- `scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs`:
  static smoke for docs, fixture, browser validation script, package scripts,
  latest pointer, public-safe fixture policy, route allow/deny assertions, and
  exact changed-file scope.
- `npm run browser:validate-final-rag-answer-review-memory-operator-path-v0-1`:
  browser-backed validation command. It must not be marked passed unless a real
  browser launches and screenshots/report are created.
- `npm run smoke:final-rag-answer-review-memory-operator-browser-validation-v0-1`:
  focused static smoke for this validation slice.

Boundary summary: this validation adds no API routes, UI behavior, DB schema,
Review Memory writes from UI, POST calls from UI, final answer generation,
provider calls, prompt sending, retrieval execution, source fetching, retrieval
index writes, promotion execution, promotion decision writes/store usage,
proof/evidence creation, Formation Receipts, durable state mutation,
product-write, accepted evidence ref writes, product IDs, Git/GitHub
actuation, release execution, or automatic answer-to-product conversion.
Browser pass is not truth.

### Final RAG answer Review Memory operator path usability audit v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add product authority.
`final_rag_answer_review_memory_operator_path_usability_audit_v0_1` analyzes
the already merged route-level E2E validation and browser validation for the
final RAG answer candidate -> Review Memory -> UI -> promotion readiness
operator path.

- `docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_PATH_USABILITY_AUDIT_V0_1.md`:
  public-safe usability/friction audit covering the validated path, remaining
  operator friction, UX risks, manual QA readiness, dogfood readiness, authority
  boundaries, privacy/redaction boundaries, and the next recommended slice.
- `fixtures/final-rag-answer-review-memory-operator-path-usability-audit.sample.v0.1.json`:
  public-safe fixture for validated path names, route/browser validation
  summaries, friction points, UX risks, no-authority boundaries, still-forbidden
  capabilities, and the recommended next slice.
- `scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs`:
  static smoke for docs, fixture, package script, latest pointer, referenced
  #851/#852 validation files, public-safe fixture policy, no raw browser
  artifact copying, no embedded screenshots, exact changed-file scope, and
  no-new-authority boundaries.
- `npm run smoke:final-rag-answer-review-memory-operator-path-usability-audit-v0-1`:
  focused static smoke for this audit slice.

Boundary summary: this audit adds no runtime authority, API routes, UI behavior
changes, DB schema, Review Memory writes, POST calls from UI, final answer
generation, provider calls, prompt sending, retrieval execution, source
fetching, retrieval index writes, promotion execution, promotion decision
writes/store usage, proof/evidence creation, durable state mutation, Formation
Receipt writes, product-write, accepted evidence ref writes, product IDs,
GitHub actuation, release execution, or automatic answer-to-product conversion.
Recommended next slice is `operator_path_manual_qa_runbook_v0_1`: a
docs/fixture/smoke manual QA runbook with no new runtime and no UI changes.
Smoke/CI/browser pass is not truth.

### Operator path manual QA runbook v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add product authority.
`operator_path_manual_qa_runbook_v0_1` gives a human operator a public-safe,
repeatable manual QA procedure for the already validated final RAG answer
candidate -> Review Memory -> UI -> promotion readiness path.

- `docs/OPERATOR_PATH_MANUAL_QA_RUNBOOK_V0_1.md`:
  manual QA runbook covering purpose, scope, prerequisites, setup, static
  validation, route-level E2E validation, browser validation, manual UI
  inspection, seeded Review Memory DB path handling, pass/fail criteria,
  evidence policy, troubleshooting, stop conditions, and next recommendation.
- `fixtures/operator-path-manual-qa-runbook.sample.v0.1.json`:
  public-safe fixture for the runbook ref, validated path, required command
  groups, manual page path, symbolic browser artifact paths, boundary notes,
  pass/fail criteria, evidence policy, troubleshooting items, forbidden
  actions, and the next recommendation.
- `scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs`:
  static smoke for docs, fixture, package script, latest pointer, #851/#852/#853
  references, command groups, manual page path, symbolic artifact paths,
  public-safe policy, no embedded screenshots/raw browser artifacts, exact
  changed-file scope, and no-new-authority boundaries.
- `npm run smoke:operator-path-manual-qa-runbook-v0-1`:
  focused static smoke for this runbook slice.

Boundary summary: this runbook adds no runtime authority, API routes, UI
behavior changes, DB schema, Review Memory writes from UI, final answer
generation expansion, live provider calls, prompt sending expansion, retrieval
execution expansion, source fetching, retrieval index writes, promotion
execution, promotion decision writes/store usage, proof/evidence creation,
durable state mutation, Formation Receipt writes, product-write, accepted
evidence ref writes, product IDs, GitHub actuation, release execution, or
automatic answer-to-product conversion. The next recommendation after merge is
`manual_qa_execution_report_v0_1` only after a human actually runs the runbook.
Smoke/CI/browser pass is not truth.

### Operator path assisted manual QA execution report v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add product authority.
`operator_path_assisted_manual_qa_execution_report_v0_1` runs the
machine-checkable portions of `operator_path_manual_qa_runbook_v0_1` with
Codex/CDP/browser assistance and records a public-safe assisted execution report
without claiming human QA signoff.

- `docs/OPERATOR_PATH_ASSISTED_MANUAL_QA_EXECUTION_REPORT_V0_1.md`:
  assisted execution report covering what Codex/CDP executed, what remains human
  judgment, browser validation rerun summary, public-safe artifact policy,
  authority boundaries, known warnings, final assisted status, and next
  recommendation.
- `fixtures/operator-path-assisted-manual-qa-execution-report.sample.v0.1.json`:
  public-safe fixture for expected report refs, symbolic `/tmp` browser artifact
  paths, expected browser summary, command groups, human signoff status,
  preserved authority boundaries, forbidden capabilities, and next
  recommendation.
- `scripts/assisted-execute-operator-path-manual-qa-v0-1.mjs`:
  assisted execution script that reads the runbook, reruns the machine-checkable
  command groups and browser validation, checks `/tmp` report/screenshot
  artifacts, parses only browser validation summary fields, and writes a
  public-safe assisted report under `/tmp`.
- `scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs`:
  static smoke for docs, fixture, package scripts, latest pointer, assisted
  script shape, public-safe policy, human-signoff boundary, no-new-authority
  boundaries, and exact changed-file scope.
- `npm run assisted:operator-path-manual-qa-v0-1`:
  runs the assisted mechanical/browser execution and writes the public-safe
  report under `/tmp`.
- `npm run smoke:operator-path-assisted-manual-qa-execution-report-v0-1`:
  focused static smoke for this assisted execution report slice.

Boundary summary: this assisted execution report adds no runtime authority, API
routes, UI behavior changes, DB schema, Review Memory writes from UI, final
answer generation expansion, live provider calls, prompt sending expansion,
retrieval execution expansion, source fetching, retrieval index writes,
promotion execution, promotion decision writes/store usage, proof/evidence
creation, durable state mutation, Formation Receipt writes, product-write,
accepted evidence ref writes, product IDs, GitHub actuation, release execution,
human signoff, or automatic answer-to-product conversion. It executes
machine-checkable QA only; smoke/CI/browser pass is not truth. The next
recommendation after a passing assisted execution is
`human_spot_review_of_assisted_manual_qa_v0_1`.

### Operator path backend safety validation bundle v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add product authority.
`operator_path_backend_safety_validation_bundle_v0_1` validates the
already-merged final RAG answer operator path for server-side no-external-IO,
backend read-only store/schema/path health, and selected-route audit coverage.

- `docs/OPERATOR_PATH_BACKEND_SAFETY_VALIDATION_BUNDLE_V0_1.md`:
  backend safety validation bundle covering #852 browser-validation limitation,
  #855 assisted manual QA relationship, server-side no-external-IO validation,
  read-only store healthcheck, selected-route audit coverage, audit boundaries,
  authority boundaries, privacy/redaction boundaries, known limitations, and
  next recommendation.
- `fixtures/operator-path-backend-safety-validation-bundle.sample.v0.1.json`:
  public-safe fixture for checked surfaces, expected guarded primitives,
  forbidden/allowed IO, read-only store expectations, selected-route audit
  coverage expectations, no-authority flags, audit boundaries, known
  limitations, and next recommendation.
- `scripts/smoke-operator-path-backend-safety-validation-bundle-v0-1.mjs`:
  smoke that exercises the selected backend route-handler path under a bounded
  Node-process external-IO guard, checks read-only DB path/schema behavior, and
  validates selected-route audit coverage with public-safe JSON output.
- `npm run smoke:operator-path-backend-safety-validation-bundle-v0-1`:
  focused smoke for this backend safety validation bundle.

Boundary summary: this validation bundle adds no product behavior, broad
all-route audit instrumentation, global middleware, raw telemetry capture, new
API routes, UI behavior changes, Review Memory writes from UI, live provider
calls, source fetching, GitHub/release calls, promotion execution, promotion
decision writes/store usage, proof/evidence creation, durable state mutation,
Formation Receipt writes, product-write, accepted evidence ref writes, product
IDs, human signoff, or automatic answer-to-product conversion. It found no
selected-route audit coverage gap and changes no route files. Server-side pass
is not truth and is not full OS-level egress proof. The next recommendation
remains `human_spot_review_of_assisted_manual_qa_v0_1`.

### Operator path human review packet v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add product authority.
`operator_path_human_review_packet_v0_1` is a public-safe one-page review
packet for a later human spot review. It compresses the already merged #851
route-level E2E validation, #852 browser/CDP validation, #855 assisted manual
QA execution report, and #856 backend safety validation bundle.

- `docs/OPERATOR_PATH_HUMAN_REVIEW_PACKET_V0_1.md`:
  public-safe review packet with compressed #851/#852/#855/#856 summaries,
  symbolic artifact and screenshot path lists, artifact freshness caveat,
  remaining human judgment checklist, next authority candidates and risk notes,
  and explicit human-review/no-authority boundaries.
- `fixtures/operator-path-human-review-packet.sample.v0.1.json`:
  public-safe fixture for `source_prs: [851, 852, 855, 856]`, included
  summaries, symbolic artifact/screenshot indexes, forbidden capabilities,
  remaining human judgment checklist, next recommendation, and final status.
- `scripts/smoke-operator-path-human-review-packet-v0-1.mjs`:
  static smoke for docs, fixture, package script, latest pointer, source PR
  summaries, human signoff status, public-safe symbolic-only policy,
  no-authority boundaries, no embedded raw artifacts/screenshots, and exact
  changed-file scope.
- `npm run smoke:operator-path-human-review-packet-v0-1`:
  focused static smoke for this public-safe human review packet.

Boundary summary: this packet performs no human QA and claims no human signoff.
It adds no runtime authority, API routes, UI behavior, DB schema, migrations,
Review Memory writes, final answer generation, live provider validation, source
fetching, retrieval execution expansion, broad all-route audit instrumentation,
promotion execution, promotion decision writes/store usage, proof/evidence
creation, durable Perspective state apply, Formation Receipt writes,
product-write, accepted evidence ref writes, product IDs, GitHub actuation,
release execution, or automatic answer-to-product conversion. It is not
approval, proof, evidence, product readiness, promotion, durable state,
Formation Receipt, product-write, GitHub authority, or release authority.
Smoke/CI/browser/server-side pass is not truth. The next recommendation remains
human review / human spot review of the assisted manual QA artifacts.

### Operator path backend remaining gap inventory v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add product authority.
`operator_path_backend_remaining_gap_inventory_v0_1` is a public-safe backend
remaining gap inventory for the already merged final RAG answer operator path.
It uses #856 backend safety validation and #857 human review packet as its
current basis.

- `docs/OPERATOR_PATH_BACKEND_REMAINING_GAP_INVENTORY_V0_1.md`:
  public-safe backend remaining gap inventory covering the selected operator
  path backend surfaces, backend boundary categories, classified findings,
  machine-safe next slices, human-review-blocked authority transitions, and the
  no-truth/no-proof/no-approval/no-product-readiness stopline.
- `fixtures/operator-path-backend-remaining-gap-inventory.sample.v0.1.json`:
  public-safe fixture for `basis_prs: [856, 857]`, checked surfaces, boundary
  categories, findings, machine-safe next slices, blocked-until-human-review
  items, authority boundaries, forbidden capabilities, and final status.
- `scripts/smoke-operator-path-backend-remaining-gap-inventory-v0-1.mjs`:
  static smoke for docs, fixture, package script, latest pointer, #856/#857
  basis, backend surfaces, boundary categories, finding shape, human-signoff
  status, public-safe policy, authority boundaries, next recommendation, and
  changed-file scope.
- `npm run smoke:operator-path-backend-remaining-gap-inventory-v0-1`:
  focused static smoke for this backend remaining gap inventory.

Boundary summary: this inventory performs no human review and claims no human
signoff. Human review is not a global gate for non-authority backend work, and
human review remains required before authority-increasing transitions. This
inventory adds no runtime behavior, API routes, UI behavior, DB schema,
migrations, live provider validation, source fetching, retrieval execution
expansion, broad all-route audit instrumentation, promotion execution,
promotion decision writes/store usage, proof/evidence creation, durable
Perspective state apply, Formation Receipt writes, product-write, accepted
evidence ref writes, product IDs, GitHub actuation, release execution, or
release authority. Validation pass is not truth, proof, approval, or product
readiness. The final recommendation is
`operator_path_public_safe_artifact_index_v0_1`.

---

### Operator path public-safe artifact index v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add product authority.
`operator_path_public_safe_artifact_index_v0_1` is a public-safe symbolic
artifact index for the already generated operator-path validation artifacts and
screenshots. It uses #856 backend safety validation, #857 human review packet,
and #858 backend remaining gap inventory as its current basis.

- `docs/OPERATOR_PATH_PUBLIC_SAFE_ARTIFACT_INDEX_V0_1.md`:
  public-safe symbolic artifact index covering the assisted manual QA execution
  report artifact, browser validation report artifact, desktop screenshot
  artifact, mobile screenshot artifact, backend safety validation bundle
  summary artifact, human review packet summary artifact, and backend remaining
  gap inventory summary artifact. It includes the raw-copy, screenshot, private
  path, freshness, authority, human-signoff, and no-truth/no-proof boundaries.
- `fixtures/operator-path-public-safe-artifact-index.sample.v0.1.json`:
  public-safe fixture for `basis_prs: [856, 857, 858]`, symbolic artifact
  classes, artifact index entries, raw copy policy, screenshot policy, private
  path policy, freshness caveat, authority boundaries, forbidden capabilities,
  human-review status, and final status.
- `scripts/smoke-operator-path-public-safe-artifact-index-v0-1.mjs`:
  static smoke for docs, fixture, package script, latest pointer, #856/#857/#858
  basis, artifact classes, symbolic-only locations, raw-copy denial,
  screenshot-embedding denial, private-path denial, freshness caveat, public-safe
  policy, authority boundaries, next recommendation, and changed-file scope.
- `npm run smoke:operator-path-public-safe-artifact-index-v0-1`:
  focused static smoke for this public-safe symbolic artifact index.

Boundary summary: this index performs no human review and claims no human
signoff. It copies no raw artifacts, embeds no screenshots, includes no private
local paths, and adds no runtime behavior, API routes, UI behavior, DB schema,
migrations, live provider validation, source fetching, retrieval execution
expansion, broad all-route audit instrumentation, promotion execution,
promotion decision writes/store usage, proof/evidence creation, durable
Perspective state apply, Formation Receipt writes, product-write, accepted
evidence ref writes, product IDs, GitHub actuation, release execution, or
release authority. Validation pass is not truth, proof, approval, or product
readiness. The final recommendation is
`operator_path_known_warning_registry_v0_1` or
`operator_path_docs_fixture_consistency_audit_v0_1`.

---

### Promotion readiness packet UI read/display binding v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add promotion/product/release
authority. `promotion_readiness_packet_ui_read_display_binding_v0_1` is a
read/display-only UI binding for the existing promotion readiness packet
generated from Review Memory. It uses #856 backend safety validation, #857 human
review packet, #858 backend remaining gap inventory, and #859 public-safe
artifact index as its current basis.

- `components/promotion-readiness-packet-panel.tsx`:
  read/display-only panel for public-safe promotion readiness packet preview
  data, including readiness summary, source/basis refs, blocking items, missing
  prerequisites, public-safe evidence summary, boundary summary, next allowed
  non-authority actions, blocked authority actions, status flags, and warnings
  that readiness is not promotion and validation pass is not truth/proof/
  approval/product readiness.
- `app/perspective/promotion/readiness-packet/page.tsx`:
  route page for `/perspective/promotion/readiness-packet`; it renders the
  read/display-only panel and does not call an API route.
- `docs/PROMOTION_READINESS_PACKET_UI_READ_DISPLAY_BINDING_V0_1.md`:
  documentation for the read/display-only UI binding, route/path, rendered
  sections, no-action-controls policy, read/display policy, public-safe
  boundary, authority boundary, human-review status, and final recommendation.
- `fixtures/promotion-readiness-packet-ui-read-display-binding.sample.v0.1.json`:
  public-safe fixture for `basis_prs: [856, 857, 858, 859]`, readiness packet
  symbolic refs, displayed sections, no-action/read-display flags, authority
  boundary, forbidden capabilities, human-review status, and final status.
- `scripts/smoke-promotion-readiness-packet-ui-read-display-binding-v0-1.mjs`:
  static smoke for docs, fixture, component, page, package script, latest
  pointer, #856/#857/#858/#859 basis, required warnings/status flags, no action
  controls, no write route calls, public-safe policy, authority boundary, final
  recommendation, and changed-file scope.
- `npm run smoke:promotion-readiness-packet-ui-read-display-binding-v0-1`:
  focused static smoke for this read/display-only UI binding.

Boundary summary: this UI performs no human review and claims no human signoff.
It has no action controls, does not execute promotion, does not write promotion
decisions or use/write the promotion decision store, does not create
proof/evidence, does not apply durable Perspective state, does not write
Formation Receipts, does not product-write, does not write accepted evidence
refs, does not allocate product IDs, does not add GitHub actuation, does not
execute release work, does not call providers, does not fetch sources, does not
expand retrieval execution, does not add broad all-route audit instrumentation,
does not add API write routes, and does not add DB schema or migrations.
Readiness is not promotion, and validation pass is not truth, proof, approval,
or product readiness. The final recommendation is browser/static smoke
validation of this read/display UI or a narrow usability follow-up.

---

### Promotion readiness packet UI browser static validation v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add promotion/product/release
authority. `promotion_readiness_packet_ui_browser_static_validation_v0_1` is a
browser/CDP static validation slice for the already merged read/display-only
promotion readiness packet UI route
`/perspective/promotion/readiness-packet`. Current basis: #856, #857, #858,
#859, and #860.

- `docs/PROMOTION_READINESS_PACKET_UI_BROWSER_STATIC_VALIDATION_V0_1.md`:
  documentation for the browser/CDP static validation purpose, route tested,
  visible copy assertions, no-action-controls policy, network/request
  boundary, screenshot/artifact policy, public-safe report policy, authority
  boundary, human signoff status, human review status, and final
  recommendation.
- `fixtures/promotion-readiness-packet-ui-browser-static-validation.sample.v0.1.json`:
  public-safe fixture for `basis_prs: [856, 857, 858, 859, 860]`, route tested,
  browser validation metadata, visible assertions, no-action-controls policy,
  network boundary, forbidden methods, forbidden routes, screenshot policy,
  report path, authority boundary, forbidden capabilities, and final status.
- `scripts/browser-validate-promotion-readiness-packet-ui-browser-static-validation-v0-1.mjs`:
  local browser/CDP validator that starts a loopback Next dev server, opens
  `/perspective/promotion/readiness-packet`, verifies required visible copy,
  verifies no action controls or action-like affordances, observes request
  metadata only, fails on forbidden methods, `/api` calls, forbidden routes,
  and non-loopback external requests, emits a public-safe JSON summary, and
  writes the public-safe browser report.
- `scripts/smoke-promotion-readiness-packet-ui-browser-static-validation-v0-1.mjs`:
  static smoke for docs, fixture, browser validator, smoke, package scripts,
  latest index pointers, browser report, #856/#857/#858/#859/#860 basis,
  route references, human signoff/review flags, readiness/validation
  boundaries, public-safe artifact policy, forbidden capabilities, final
  recommendation, and bounded changed-file scope.
- `reports/browser/2026-06-29-promotion-readiness-packet-ui-browser-static-validation.md`:
  public-safe browser validation report for the static read/display-only UI.
- `npm run browser:promotion-readiness-packet-ui-browser-static-validation-v0-1`:
  browser/CDP static validation for this read/display-only UI.
- `npm run smoke:promotion-readiness-packet-ui-browser-static-validation-v0-1`:
  focused static smoke for this browser/static validation slice.

Boundary summary: this validation performs no human review and claims no human
signoff. It does not execute promotion, write promotion decisions, use/write
the promotion decision store, create proof/evidence, apply durable Perspective
state, write Formation Receipts, product-write, write accepted evidence refs,
allocate product IDs, add GitHub actuation, execute release work, call live
providers, fetch sources, expand retrieval execution, add broad all-route audit
instrumentation, add API write routes, add DB schema/migrations, copy raw
artifacts, embed screenshots, or include private local paths. Readiness is not
promotion, and validation pass is not truth/proof/approval/product readiness.
The final recommendation is a narrow usability follow-up only if browser
validation finds readability/comprehension issues; otherwise proceed to the
next read/display usability slice or pause for human spot review.

---

### Promotion readiness packet review hub read/display v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add promotion/product/release
authority. `promotion_readiness_packet_review_hub_read_display_v0_1` is a
read/display-only usability slice for a promotion readiness review hub at
`/perspective/promotion`, with one navigation-only link to the existing
read/display readiness packet route
`/perspective/promotion/readiness-packet`. Current basis: #856, #857, #858,
#859, #860, and #861.

- `app/perspective/promotion/page.tsx`:
  route page for `/perspective/promotion`; it renders the read/display-only
  promotion readiness review hub and does not call an API route.
- `components/promotion-readiness-packet-review-hub.tsx`:
  read/display-only hub component with required status flags, basis refs,
  available read/display surfaces, blocked authority actions, next
  non-authority review steps, what-this-hub-cannot-do content, and one
  navigation-only link to `/perspective/promotion/readiness-packet`.
- `docs/PROMOTION_READINESS_PACKET_REVIEW_HUB_READ_DISPLAY_V0_1.md`:
  documentation for the review hub purpose, route added, linked route,
  UI sections, navigation affordance policy, no-action-controls policy,
  network/request boundary, screenshot/artifact policy, authority boundary,
  human signoff status, human review status, and final recommendation.
- `fixtures/promotion-readiness-packet-review-hub-read-display.sample.v0.1.json`:
  public-safe fixture for `basis_prs: [856, 857, 858, 859, 860, 861]`, route
  added, linked route, hub sections, safe navigation affordance, read/display
  and no-action flags, authority boundary, forbidden capabilities, and final
  status.
- `scripts/browser-validate-promotion-readiness-packet-review-hub-read-display-v0-1.mjs`:
  local browser/CDP validator that starts a loopback Next dev server, opens
  `/perspective/promotion`, verifies required visible copy and sections,
  verifies the single safe read/display navigation link, navigates through it
  to `/perspective/promotion/readiness-packet`, verifies destination
  read/display copy, observes request metadata only, fails on forbidden
  methods, `/api` calls, forbidden routes, and non-loopback external requests,
  emits a public-safe JSON summary, and writes the public-safe browser report.
- `scripts/smoke-promotion-readiness-packet-review-hub-read-display-v0-1.mjs`:
  static smoke for docs, fixture, component, page, browser validator, smoke,
  package scripts, latest index pointers, browser report, #856/#857/#858/
  #859/#860/#861 basis, route references, navigation safety, human
  signoff/review flags, readiness/validation boundaries, public-safe artifact
  policy, forbidden capabilities, final recommendation, and bounded
  changed-file scope.
- `reports/browser/2026-06-29-promotion-readiness-packet-review-hub-read-display.md`:
  public-safe browser validation report for the read/display-only review hub.
- `npm run browser:promotion-readiness-packet-review-hub-read-display-v0-1`:
  browser/CDP static validation for this read/display-only hub.
- `npm run smoke:promotion-readiness-packet-review-hub-read-display-v0-1`:
  focused static smoke for this review hub read/display slice.

Boundary summary: this hub performs no human review and claims no human
signoff. It does not execute promotion, write promotion decisions, use/write
the promotion decision store, create proof/evidence, apply durable Perspective
state, write Formation Receipts, product-write, write accepted evidence refs,
allocate product IDs, add GitHub actuation, execute release work, call live
providers, fetch sources, expand retrieval execution, add broad all-route audit
instrumentation, add API write routes, add DB schema/migrations, copy raw
artifacts, embed screenshots, or include private local paths. Readiness is not
promotion, validation pass is not truth/proof/approval/product readiness, and
browser validation is not human review. The readiness packet link is
navigation only, not approval or promotion. The final recommendation is
browser/static validation of this hub; once browser/static validation complete,
continue only to the next read/display usability slice or a pause for human
spot review. Do not recommend promotion execution, product-write, or release.

---

### Promotion readiness review hub cockpit entrypoint v0.1 pointer (repo-local, non-SSOT)

This pointer does not expand the Active set or add promotion/product/release
authority. `promotion_readiness_review_hub_cockpit_entrypoint_v0_1` is a
read/display-only home/cockpit entrypoint slice for discovering the existing
promotion readiness review hub at `/perspective/promotion` from the main
Augnes home route `/`. The downstream readiness packet route remains
`/perspective/promotion/readiness-packet`. Current basis: #856, #857, #858,
#859, #860, #861, and #862.

- `app/page.tsx`:
  home route page for `/`; it renders the read/display-only cockpit entrypoint
  above the existing Augnes cockpit and does not add a new route.
- `components/promotion-readiness-review-hub-cockpit-entrypoint.tsx`:
  read/display-only scoped entrypoint component with required status flags,
  basis refs, blocked authority actions, what-this-entrypoint-cannot-do
  content, and one navigation-only link to `/perspective/promotion`.
- `docs/PROMOTION_READINESS_REVIEW_HUB_COCKPIT_ENTRYPOINT_V0_1.md`:
  documentation for the cockpit entrypoint purpose, home/cockpit route touched
  and tested, linked route, downstream route, UI sections, navigation
  affordance policy, no-action-controls policy, network/request boundary,
  screenshot/artifact policy, authority boundary, human signoff status, human
  review status, and final recommendation.
- `fixtures/promotion-readiness-review-hub-cockpit-entrypoint.sample.v0.1.json`:
  public-safe fixture for `basis_prs: [856, 857, 858, 859, 860, 861, 862]`,
  home route, linked route, downstream readiness packet route, entrypoint
  sections, safe navigation affordance, read/display and no-action flags,
  authority boundary, forbidden capabilities, and final status.
- `scripts/browser-validate-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs`:
  local browser/CDP validator that starts a loopback Next dev server, opens
  `/`, verifies required visible copy and sections inside the scoped
  entrypoint container, verifies the single safe read/display navigation link,
  navigates through it to `/perspective/promotion`, validates destination
  read/display copy, optionally validates the downstream readiness packet route,
  observes request metadata only, fails on forbidden methods, forbidden route
  families, and non-loopback external requests, emits a public-safe JSON
  summary, and writes the public-safe browser report.
- `scripts/smoke-promotion-readiness-review-hub-cockpit-entrypoint-v0-1.mjs`:
  static smoke for docs, fixture, component, home page integration, browser
  validator, smoke, package scripts, latest index pointers, browser report,
  #856/#857/#858/#859/#860/#861/#862 basis, route references, navigation
  safety, human signoff/review flags, readiness/validation boundaries,
  public-safe artifact policy, forbidden capabilities, final recommendation,
  and bounded changed-file scope.
- `reports/browser/2026-06-29-promotion-readiness-review-hub-cockpit-entrypoint.md`:
  public-safe browser validation report for the read/display-only cockpit
  entrypoint.
- `npm run browser:promotion-readiness-review-hub-cockpit-entrypoint-v0-1`:
  browser/CDP static validation for this read/display-only cockpit entrypoint.
- `npm run smoke:promotion-readiness-review-hub-cockpit-entrypoint-v0-1`:
  focused static smoke for this cockpit entrypoint slice.

Boundary summary: this entrypoint performs no human review and claims no human
signoff. It does not execute promotion, write promotion decisions, use/write
the promotion decision store, create proof/evidence, apply durable Perspective
state, write Formation Receipts, product-write, write accepted evidence refs,
allocate product IDs, add GitHub actuation, execute release work, call live
providers, fetch sources, expand retrieval execution, add broad all-route audit
instrumentation, add API write routes, add new API routes, add DB
schema/migrations, copy raw artifacts, embed screenshots, or include private
local paths. Readiness is not promotion, validation pass is not
truth/proof/approval/product readiness, and browser validation is not human
review. The `/perspective/promotion` link is navigation only, not approval,
promotion, write, or release. The final recommendation is browser/static
validation of this cockpit entrypoint; once browser/static validation complete,
continue only to the next read/display usability slice or a pause for human
spot review. Do not recommend promotion execution, product-write, or release.

## Promotion Readiness Copy IA Clarity v0.1

Non-SSOT pointer for the copy/IA-only clarity follow-up after human spot review
classified the route chain as `pass_with_copy_risk`. Current basis: #856,
#857, #858, #859, #860, #861, #862, and #863. The route chain remains `/` ->
`/perspective/promotion` -> `/perspective/promotion/readiness-packet`.

- `components/promotion-readiness-review-hub-cockpit-entrypoint.tsx`:
  home/cockpit entrypoint copy updated to foreground `Human review prep`,
  `Read/display-only`, `Not promotion approval`, the safe read/display link,
  and the required human review status flags.
- `components/promotion-readiness-packet-review-hub.tsx`:
  promotion review hub copy updated with first-judgment hierarchy for what the
  hub is, what is safe to do, what cannot happen there, and why no
  approval/promotion action control appears.
- `components/promotion-readiness-packet-panel.tsx`:
  readiness packet copy updated to foreground `Static/symbolic read-display
  preview`, `This is not live promotion readiness`, and human-review-prep
  usage before dense boundary text.
- `docs/PROMOTION_READINESS_COPY_IA_CLARITY_V0_1.md`:
  copy/IA-only slice documentation with human spot review basis, observed
  issues, changes made, authority boundary, artifact policy, human signoff
  status, human review status, and final recommendation.
- `fixtures/promotion-readiness-copy-ia-clarity.sample.v0.1.json`:
  public-safe fixture for the copy/IA-only clarity slice, basis PRs, observed
  issues, routes touched/validated, copy changes, false authority flags,
  forbidden capabilities, and final status.
- `scripts/browser-validate-promotion-readiness-copy-ia-clarity-v0-1.mjs`:
  browser/CDP validator for the route chain; it verifies improved copy on the
  home entrypoint, promotion review hub, and readiness packet, checks allowed
  navigation anchors, scopes no-action-controls checks to promotion readiness
  surfaces, observes request metadata only, and writes the public-safe browser
  report.
- `scripts/smoke-promotion-readiness-copy-ia-clarity-v0-1.mjs`:
  static smoke for expected docs, fixture, browser validator, smoke script,
  browser report, package scripts, latest index pointers, UI source copy,
  public-safe artifact policy, no action controls, authority boundary, final
  recommendation, and bounded changed-file scope.
- `reports/browser/2026-06-29-promotion-readiness-copy-ia-clarity.md`:
  public-safe browser validation report for the copy/IA clarity route chain.
- `npm run browser:promotion-readiness-copy-ia-clarity-v0-1`:
  browser/CDP validation for the copy/IA clarity route chain.
- `npm run smoke:promotion-readiness-copy-ia-clarity-v0-1`:
  focused static smoke for this copy/IA-only clarity slice.

Boundary summary: this copy/IA slice performs no human review and claims no
human signoff. It does not execute promotion, write promotion decisions,
use/write the promotion decision store, create proof/evidence, apply durable
Perspective state, write Formation Receipts, product-write, write accepted
evidence refs, allocate product IDs, add GitHub actuation, execute release
work, call live providers, fetch sources, expand retrieval execution, add
broad all-route audit instrumentation, add API write routes, add new API
routes, add DB schema/migrations, copy raw artifacts, embed screenshots, or
include private local path inclusion.

---

## 업로드 권장 파일 목록 (Active set)

1) `SSOT_CANONICAL.md` — 의미/정책 SSOT (SSOT-2)  
2) `SSOT_SCHEMA_BUNDLE.zip` — 계약 SSOT (SSOT-1)  
3) `SSOT_LOGGING_POLICY.md` — 로깅/보관/집계 정책 (SSOT-2b, 정의 발명 금지)  
4) `OPS_PLAYBOOK.md` — 구현/운영 레시피 (정의 발명 금지)  
5) `WIRING_INTEGRATION_MAP.md` — 문서/정책 배선도 (정의 재서술 금지)  
6) `MODULE_SIDECAR_QP_ZT_SUMMARY.md` — Sidecar 로컬 스펙(모듈 SSOT, 하위)  
7) `APPENDIX_GNWT_IIT.md` — 연구/배경 부록 (non-SSOT)  
8) `CHANGELOG_PATCHLOG.md` — 변경 이력 통합본 (non-SSOT)  
9) `00_INDEX_LATEST.md` — 이 인덱스(레이아웃/체크리스트)

## Active set 단일화 규칙 (필수)

- 프로젝트 폴더(및 ChatGPT 프로젝트 업로드)에는 **Active set 9개 파일만** 둔다.  
  - Active set 목록은 이 문서의 “업로드 권장 파일 목록”이 단일 기준이다.
- **동일 “역할 파일명”의 복수 버전 공존 금지**:  
  - 예) `00_INDEX_LATEST.md`가 서로 다른 릴리즈 태그를 가진 채로 동시에 존재하면, **최신 태그만 Active**로 인정하고 나머지는 즉시 격리한다.
- **버전이 박힌 아카이브 문서/산출물은 Active set에 두지 않는다.**
  - 예) `augnes_local_*_r20.1*.md`, `InterventionPolicy_*`, `augnes_schema_bundle_*.zip` 같은 “버전 박힌 파일명”은 프로젝트 폴더에서 제거.
- 보관이 필요하면 아래 중 하나로 강제:
  1) `/_archive/`로 이동 (권장)
  2) 파일명 접두사 `ARCHIVE__<tag>__`를 붙여 Active set에서 자동 배제되게 만들기

---

## 스키마 번들 경로 표기 (정규화)

문서에서 스키마/예시/도구 파일을 가리킬 때는 **버전이 박힌 내부 폴더명(예: `augnes_schema_bundle_...`)을 직접 쓰지 않는다.**
대신 아래 표기법으로 통일한다.

- **스키마:** `SSOT_SCHEMA_BUNDLE.zip ▸ schema/<file>`
- **예시:** `SSOT_SCHEMA_BUNDLE.zip ▸ examples/<file>`
- **번들 메타:** `SSOT_SCHEMA_BUNDLE.zip ▸ manifest.json`, `SSOT_SCHEMA_BUNDLE.zip ▸ README.md`
- **도구/레퍼런스:** `SSOT_SCHEMA_BUNDLE.zip ▸ tools/<file>`

> 해석 규칙: `schema/`와 `examples/`는 **zip 내부의 “bundle root(최상위 단일 폴더)” 기준 상대 경로**다.  
> zip 안의 실제 폴더명은 릴리즈마다 바뀔 수 있으므로, 본문 포인터는 **항상 이 상대 경로 표기만** 사용한다.

### Schema Bundle 버전 정합(Hotfix 규칙)

- `SSOT_SCHEMA_BUNDLE.zip ▸ manifest.json`의 `bundle_version`/`version`은 **현재 Active set 팩 태그와 일치**해야 한다.
- 스키마/예시 내용이 바뀌지 않았더라도, **버전 정합만을 위한 repack(= manifest 메타 갱신)** 은 허용한다. (계약 변경 없음)
- 문서 본문은 내부 폴더명을 계속 쓰지 않되, 사람 디버깅을 위해 zip 내부 최상위 폴더명도 가능하면 태그와 맞춘다.

---

## 업데이트 규칙(실구현 단계 지침용 핵심 5줄)

- 새 **필드/타입/경로/enum** 추가/변경은 **무조건 `SSOT_SCHEMA_BUNDLE.zip`부터**.
- 새 **이벤트 타입**은 (a) *이름만 추가*는 Logging Policy/Playbook에 “권장 이름”으로 둘 수 있지만, (b) **payload 계약(필수/enum/경로/예시 검증)을 동반**하면 무조건 스키마 번들에 먼저 넣는다.
- 의미/정책/해석/우선순위 변경은 **무조건 `SSOT_CANONICAL.md`**.
- `OPS_PLAYBOOK.md`/`SSOT_LOGGING_POLICY.md`/`WIRING_INTEGRATION_MAP.md`는 **정의를 발명하지 않는다**(스키마/캐노니컬을 링크로 끌고 온다).
- 변경하면 `CHANGELOG_PATCHLOG.md`에 한 줄이라도 남긴다.
- 운영 가능성(테스트/가드레일) 기준은 `OPS_PLAYBOOK.md` §9.7.6(Gate Checklist v0.1)로 단일화한다.
- 새 모듈/레버/프라이어를 추가하면: (1) Gate Checklist에 영향 평가를 한 줄 추가하고 (2) CHANGELOG에 포인터를 남긴다.
- “Release zip 스냅샷”은 필요할 때만 만들고, 프로젝트 폴더에는 **Active set**이 우선이다.

---

## Maintenance Notes (병합)

### 금지 규칙 (진짜로 중요한 것)
- `OPS_PLAYBOOK.md`, `WIRING_INTEGRATION_MAP.md`, `SSOT_LOGGING_POLICY.md`에서
  **새 필드/타입/경로/enum, 또는 ‘payload 계약을 수반하는 이벤트 타입’을 '정의'하지 않는다.**
  - 반드시 `SSOT_SCHEMA_BUNDLE.zip`에 먼저 추가하고, 나머지는 “인용/참조”만 한다.
  - 단, *이벤트 이름 목록/분류(택소노미)* 자체는 운영 편의를 위해 Logging Policy에 둘 수 있다(계약/검증은 아님).

### 참조 방식
- 스키마/예시 참조는 **반드시 아래 표기법**으로 통일한다.
  - 스키마: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/<file>`
  - 예시: `SSOT_SCHEMA_BUNDLE.zip ▸ examples/<file>`
  - 메타: `SSOT_SCHEMA_BUNDLE.zip ▸ manifest.json`, `SSOT_SCHEMA_BUNDLE.zip ▸ README.md`
- 문서 본문에 `augnes_schema_bundle_YYYYMMDD_...` 같은 **버전 포함 폴더명/경로를 직접 적지 않는다**(정합성 지뢰).
- 문서 내 파일 참조는 이 폴더의 **안정 경로**(예: `SSOT_CANONICAL.md`)만 사용한다.
- 버전이 들어간 긴 파일명을 다른 문서에 박지 않는다.
  - 버전 파일은 보관/히스토리용으로 별도 관리하고, 배포본은 안정 경로로 유지한다.

### 리라이트가 필요한 때
- 같은 개념 설명이 2곳 이상에 복제되어 있고, 둘이 미세하게 어긋나기 시작하면:
  - (1) Canonical로 정의를 모으고
  - (2) 다른 문서는 “요약 + 링크”로 축약한다.

### WIRING 라벨 레지스트리 (A0 예약표)

목적: 문서/스키마 포인터를 “라벨로 짧게” 참조할 때, 같은 라벨을 두 번 쓰는 바람에 생기는 **라벨/포인터 충돌**을 예방한다.  
규칙: **A0\*** 는 Wiring 결합 포인트 전용 예약 네임스페이스다. 새 결합 포인트를 추가하거나 라벨을 변경하면, **(1) `WIRING_INTEGRATION_MAP.md`와 (2) 아래 표를 함께** 갱신한다.

| 라벨 | 의미(한 줄) | 1차 정의 위치 |
|---|---|---|
| A0 | TRL Routing: observe() 직후 route_tier/context_profile 태깅 | `WIRING_INTEGRATION_MAP.md` |
| A0a | (RESERVED) | — |
| A0b | Hardware/Model Profile: runtime_limits/profile_id 스냅샷 | `WIRING_INTEGRATION_MAP.md` |
| A0c | Metacog Cycle(MUSE-lite): competence_hat 기반 전략 선택/opt-out | `WIRING_INTEGRATION_MAP.md` |
| A0d | Behavioral State Layer(BSL): session_start/bstage/bstate 라벨 | `WIRING_INTEGRATION_MAP.md` |
| A0e | Forecast/Calibration(EOP++): Expected→Compare 정산 이벤트 | `WIRING_INTEGRATION_MAP.md` |
| A0f | Learned Prediction Signal(LPS): Staging 직전 “약한 프라이어” 스냅샷 | `WIRING_INTEGRATION_MAP.md` |
| A0g | SketchPad: 저해상도 스케치 포인터(자기/과업) | `WIRING_INTEGRATION_MAP.md` |
| A0h | JIT Construal Loop: Active Set(world model) 증분 로딩 | `WIRING_INTEGRATION_MAP.md` |
| A0i | CSB: Cerebellar Satellite Bank(Sat-L/ Sat-M 분리) | `WIRING_INTEGRATION_MAP.md` |
| A0j | Render-of-Thought Trace(RoT): 단일행 이미지/비전 임베딩 trace 포인터 | `WIRING_INTEGRATION_MAP.md` |
| A0k | Goal→Action Coupling(G2A): 목표 펄스→행동 발화 결합도 + 커밋 보조 프라이어 | `WIRING_INTEGRATION_MAP.md` |
| A0l | Context Stencil(oscillation-inspired): 컨텍스트/메모리 ‘공간’ soft-gating(억제 스텐실) | `WIRING_INTEGRATION_MAP.md` |
| A0m | Memory-ANN-lite(MN): “기억 변수” 기반 보상학습 프라이어(prior-only) | `WIRING_INTEGRATION_MAP.md` |
| A0n | Parameter Memory(PM): TTT-lite Session Adapter(UBB coefficient update; boundary-only) | `WIRING_INTEGRATION_MAP.md` |
