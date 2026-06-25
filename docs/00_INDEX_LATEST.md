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
- Bounded Source Intake Runtime Contract v0.1:
  `docs/BOUNDED_SOURCE_INTAKE_RUNTIME_CONTRACT_V0_1.md`,
  `types/bounded-source-intake-runtime-contract.ts`,
  `fixtures/bounded-source-intake-runtime-contract.sample.v0.1.json`,
  and `scripts/smoke-bounded-source-intake-runtime-contract-v0-1.mjs`
  (`npm run smoke:bounded-source-intake-runtime-contract-v0-1`) follows the integrated roadmap guide v0.2 as contract-only. It defines future source intake request, source descriptor, result envelope, privacy/redaction, source ref, and authority boundary shapes. This pointer is repo-local documentation metadata, not SSOT, and does not implement source intake runtime, source fetch, local file read, raw source storage, DB query/write, provider/OpenAI calls, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation. Product-write remains parked by #686.

  Boundary phrases: Bounded Source Intake Runtime Contract v0.1; contract-only; follows the integrated roadmap guide v0.2; follows #769 Review Memory Contract, #770 Review Memory Store, #771 Review Memory Routes, #772 Review Memory UI, and #773 Foundation/Lifecycle/Review Memory Read-only UI; Bounded Source Intake Runtime Contract is contract-only; Source refs are lineage pointers, not proof; Source refs must be public-safe symbolic refs; A public URL ref is not fetched in this contract; A repository file ref is not read in this contract; An uploaded file ref is not read in this contract; Raw source bodies must not be stored; accepted_for_future_runtime is not runtime execution; older proposal documents are background inputs already integrated into the roadmap guide; no source fetch, local file read, raw source storage, DB query/write, provider/OpenAI call, retrieval/RAG execution, proof/evidence write, Perspective promotion, durable Perspective state write, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, or product ID allocation; product-write remains parked by #686; next recommended slices are Bounded Source Intake Runtime, Provider-Assisted Extraction candidate-only contract, Provider-Assisted Extraction runtime, Retrieval/RAG Runtime Contract, and Retrieval/RAG Runtime.
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
