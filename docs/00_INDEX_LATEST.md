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
  none.` This remains instruction-only and non-authoritative.
  `npm run smoke:augnes-capsule-handoff-skill`는 skill frontmatter, required
  sections, plugin metadata compatibility, docs pointers, package pointer, no
  runtime behavior, no GitHub/OpenAI/Augnes runtime calls, no MCP/App tool
  calls, no proof/evidence writes, no branch/PR creation authority by itself,
  and no merge/publish/approval/retry/replay/deploy authority를 정적으로
  확인한다.
- `docs/CAPSULE_HANDOFF_SKILL_DOGFOOD_REPORT_V0_1.md`: `augnes-capsule-handoff`
  skill을 docs/smoke/package-pointer only workflow에서 conceptually dogfood한
  report다. Perspective Capsule / Handoff Capsule fields, required checks,
  skipped check policy, evidence pointers, unresolved tensions, browser/
  computer-use handling, proof-only closeout handling, PR body/final report
  requirements, blockers, repo/task mismatches, scope risks, assumptions,
  questions requiring user/PM judgment, and next suggested goal preservation을
  기록한다. `npm run smoke:capsule-handoff-skill-dogfood-report`는 report
  sections, package/index pointers, scoped/content-only boundary behavior, and
  no runtime behavior, no UI/API/DB/MCP/App/proof/evidence/Codex SDK authority를
  정적으로 확인한다.
- `docs/PROJECT_CONSTELLATION_CAPSULE_HANDOFF_FIRST_LOOP_CLOSEOUT_V0_1.md`:
  Project Constellation Capsule Handoff first-loop closeout pointer다. Project
  Constellation IA, sample fixture, read-only Cockpit preview, copyable handoff
  preview, Perspective Capsule contract, Augnes Operator Plugin v0.2,
  `augnes-capsule-handoff` skill, dogfood report, wording refinement, boundary
  smoke scope profiles, and Codex SDK execution authority design이 만든
  read-only/non-authoritative loop를 정리한다. Recommended next step:
  Type-only Project Constellation fixture/schema boundary. `npm run
  smoke:project-constellation-capsule-handoff-first-loop-closeout`는 closeout
  sections, inventory, product loop terms, authority boundaries, next safe
  candidates, package/index pointers, and docs/smoke/package-pointer only
  scope를 확인한다. This pointer has no runtime behavior and no
  UI/API/DB/MCP/App/proof/evidence/Codex SDK authority.
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
  forbidden-field vocabulary only. It has no API route, no runtime behavior, no
  auth implementation, no DB, no MCP/App tool, no proof/evidence write, and no
  Codex SDK execution. `npm run smoke:readonly-api-route-response-shape-boundary`는
  exported type names, response concepts, forbidden-field vocabulary,
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
  and aligned with `types/readonly-api-route-response.ts`. It connects no
  consumer surface and adds no DB query, no UI, no MCP/App tool, no
  proof/evidence write, no Codex SDK execution, no graph DB, no persistence,
  and no merge/publish/approval/retry/replay/deploy authority. `npm run
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
- `PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md`: Perspective Capsule / Handoff
  Capsule의 repo-local, non-SSOT, docs-only, read-only/non-authoritative,
  contract/design-only pointer다. `npm run smoke:perspective-capsule-contract`
  는 이 contract boundary를 정적으로 확인한다. This pointer does not add
  runtime schema, API route, MCP/App tool, persistence, graph DB,
  proof/evidence write, Codex task launch, or plugin runtime action.
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
