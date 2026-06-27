# Augnes 통합 개발 로드맵 지침서 v0.2.1 FULL

작성일: 2026-06-25 KST  
대상 저장소: `hynk-studio/augnes`  
문서 상태: 향후 개발 지침서, PR sequencing guide, authority-boundary checklist  
기준선: `#760 Add Research-to-Perspective fixture/smoke legacy audit v0.1` 이후  
운영 방식: ChatGPT는 설계 검토와 PR 리뷰, Codex는 bounded slice 구현/테스트/PR 생성, 사용자는 merge 결정

---

## 0. 이 문서의 목적

이 문서는 기존 `Augnes 통합 개발 로드맵 지침서 v0.2`를 재검토하여 보강한 **상세판**이다.

이전 v0.2는 큰 방향과 phase 구조는 맞았지만, 다음 항목을 충분히 상세하게 담지는 않았다.

```text
- remaining development 문서의 R34-R37 operational hardening 항목
- Research/ROI 문서의 P1/P2 연구 적용 후보
- Temporal Perspective Overlay의 rail별 흡수 지점과 smoke audit 세부 항목
- Git Ledger / Export의 privacy, authority, packet/builder/export lifecycle 세부 조건
- 각 slice별 파일 후보, 금지 범위, 수용 기준
```

따라서 이 v0.2.1 FULL은 다음 기준으로 다시 작성한다.

```text
1. remaining development 문서의 실제 남은 개발 항목을 빠뜨리지 않는다.
2. Research/ROI 제안서의 우선순위를 반영한다.
3. Temporal Perspective Overlay는 독립 대형 milestone이 아니라 기존 rail에 흡수한다.
4. Git Ledger / Export는 채택하되 durable promotion / Formation Receipt 뒤로 미룬다.
5. product-write는 explicit reentry 전까지 parked 상태를 유지한다.
6. 모든 PR은 candidate/durable/authority 경계를 명시한다.
```

문서 하나가 또 문서를 설명한다. 인간 소프트웨어 개발은 가끔 종이학 접기와 비슷한데, 종이가 전부 Markdown일 뿐이다.

---

## 1. 재검토 결론

### 1.1 이전 v0.2 지침서에 대한 판정

| 항목 | 판정 |
|---|---|
| 큰 로드맵 방향 | 적절함 |
| Research/ROI 반영 | 핵심 P0는 반영됨 |
| TPO 반영 | 큰 방향은 반영됨 |
| Git Ledger 반영 | 위치 조정은 적절함 |
| remaining development 전체 충실도 | 부족함 |
| 각 slice별 상세도 | 부족함 |
| operational hardening | 일부 누락 |
| P1/P2 연구 적용 후보 | 일부 누락 |
| 최종 사용 가능성 | 초기 지침으로는 가능하지만, 상세 개발 지침서로는 보강 필요 |

### 1.2 최종 보강 판단

기존 v0.2는 “통합 방향서”로는 충분하지만, 사용자가 원하는 “앞으로 어떤 내용을 개발할지에 대한 상세 지침서”로는 부족했다.

이 v0.2.1 FULL은 다음을 보강한다.

```text
- Phase별 세부 목적
- 각 PR slice별 개발 내용
- 예상 파일
- 금지 범위
- 수용 기준
- 권위 경계
- deferred reason
- safety/acceptance matrix
- Codex 운영 지침
```

---

## 2. 기준 문서와 적용 판정

### 2.1 기준 문서

| 문서 | 이 지침서에서의 역할 |
|---|---|
| `augnes_remaining_development_plan_2026-06-24` | trunk. 남은 실제 개발 항목의 전체 목록과 runtime 전환 순서 제공 |
| `augnes_research_roi_application_proposal_2026-06-25` | P0/P1/P2 연구 적용 우선순위 제공 |
| `augnes_temporal_perspective_overlay_v0_2` | 시간축 vocabulary, handoff/diagnostic/authority-boundary 보강 제공 |
| `augnes-git-ledger-export-proposal-v0.1` | Git Ledger / Export layer의 설계와 안전 경계 제공 |

### 2.2 적용 판정

| 문서 | 판정 | 적용 방식 |
|---|---|---|
| Remaining Development Plan | 유지하되 초반 순서 수정 | 전체 남은 개발 목록은 유지. dashboard-first는 약화하고 lifecycle-first로 조정 |
| Research/ROI Proposal | 강하게 채택 | Lifecycle, Calibration, Logical Shape, Feedback-to-Rule을 Phase 1로 당김 |
| Temporal Perspective Overlay | 부분 채택 | 별도 docs-only 산맥을 만들지 않고 lifecycle/calibration/handoff/layout/dogfood에 흡수 |
| Git Ledger Export Proposal | 채택하되 후순위 | Phase 8로 배치. GitHub actuation은 별도 승인 전까지 제외 |

---

## 3. 현재 기준선

### 3.1 repo 상태 가정

```text
#759 Research-to-Perspective Foundation Milestone closeout merged
#760 Research-to-Perspective fixture/smoke legacy audit merged
Product-write remains parked by #686
Runtime persistence / provider / retrieval / promotion / proof/evidence / product write remain unopened or explicitly forbidden
```

### 3.2 현재 Augnes의 상태

```text
Research-to-Perspective foundation scaffold 완료
rail별 contract / fixture / smoke / preview / browser validation 상당수 완료
다음 단계는 더 많은 scaffold 추가가 아니라 explicit user action 기반 runtime 전환
```

### 3.3 아직 실제 제품화가 필요한 영역

| 영역 | 현재 상태 | 앞으로 필요한 것 |
|---|---|---|
| Runtime persistence | 미완 | candidate/review/promotion/state 저장/조회/폐기 |
| Provider runtime | 미완 | provider output을 candidate-only로 추출 |
| Retrieval/RAG runtime | 미완 | rebuildable, source-ref 기반 non-authoritative recall |
| Durable promotion | 미완 | human-reviewed promotion decision store |
| Formation Receipt | scaffold/preview | durable receipt write |
| Durable Perspective State | 미완 | current/prior thesis, claim/evidence/tension/gap lineage |
| Runtime layout | 미완 | stable constellation layout, candidate/durable layer 분리 |
| Feedback loop | 부분 완료 | aggregation, expanded controls, feedback-to-rule candidate |
| Dogfooding ingestion | 미완 | PR/Codex/CI result를 candidate input으로 수집 |
| Git Ledger / Export | 제안 단계 | public-safe export packet layer |
| Product write | parked | explicit reentry 전까지 금지 |
| Operational hardening | 미완 | export/import, privacy guard, audit panel, release matrix |

---

## 4. 절대 원칙

### 4.1 Authority separation

아래 등식은 전 구간에서 금지한다.

```text
candidate = fact
candidate = proof
candidate = accepted evidence
candidate = durable Perspective state
evidence_candidate = accepted evidence
perspective_delta_candidate = committed state
provider output = truth
retrieval result = authority
feedback = truth
layout coordinate = truth
salience score = truth score
Codex handoff draft = execution approval
PR body = authority
CI pass = proof
smoke pass = proof
Git commit = approval
Git ref = durable state
GitHub PR = Core decision
```

### 4.2 Durable write는 explicit user action 뒤에만 가능하다

허용 흐름:

```text
operator reviews
operator clicks / confirms / submits
route validates boundary
DB write records candidate/review/feedback/promotion decision
receipt/audit explains why
```

금지 흐름:

```text
provider output
retrieval result
Codex result report
CI pass
smoke pass
feedback pin
Git commit
→ auto evidence
→ auto promotion
→ auto state mutation
→ product write
```

### 4.3 product-write는 parked

product-write reentry 전제:

```text
foundation status review completed
candidate review memory runtime stable
promotion decision store stable
Formation Receipt durable write stable
durable Perspective state apply stable
product target schema reviewed
rollback / idempotency contract passed
operator explicitly approves reentry
```

### 4.4 Git은 memory가 아니다

Git Ledger는 다음으로 제한한다.

```text
public-safe export
reviewable temporal ledger
deterministic packet
suggested commit intent
manual/future-gated export substrate
```

Git Ledger가 하면 안 되는 일:

```text
runtime memory store
Core decision store
semantic retrieval store
durable Perspective authority
automatic branch/commit/PR creation
raw/private data archive
```

### 4.5 TPO는 SSOT가 아니다

Temporal Perspective Overlay는 다음이다.

```text
non-authoritative vocabulary
diagnostic overlay
handoff clarity layer
derived view discipline
expected/observed review aid
```

TPO는 다음이 아니다.

```text
new SSOT
runtime state
DB/API/provider/retrieval implementation
durable write
Codex/GitHub automation authority
product write authority
```

---

## 5. 전체 phase 구조

| Phase | 이름 | 핵심 산출 |
|---:|---|---|
| 0 | Foundation 상태 정리 | #760 이후 status review, next slice 선택 |
| 1 | Candidate read-model intelligence | lifecycle, calibration, logical shape, feedback-to-rule, temporal handoff |
| 2 | Candidate Review Memory runtime | review record contract/store/routes/UI |
| 3 | Source intake / provider / retrieval | bounded source, candidate-only extraction, rebuildable retrieval, RAG context preview |
| 4 | Human-reviewed promotion / durable Perspective state | promotion decision, Formation Receipt, state apply, trajectory |
| 5 | Runtime layout / feedback surfacing | constellation layout, manual anchors, feedback aggregation/controls/surfacing |
| 6 | Dogfooding / CI runtime | PR/Codex/CI result ingestion, boundary CI, temporal handoff experiment |
| 7 | Operational hardening | local export/import, privacy guard, runtime audit, release readiness |
| 8 | Git Ledger / Export | public-safe deterministic export packet and preview |
| 9 | Product Write Reentry | review, target contract, disabled harness, minimal runtime only if approved |
| 10 | Research P1/P2 backlog | deterministic CRPF, empirical calibration dataset, formal/retrieval/provider later tracks |

---

# Phase 0. Foundation 상태 정리

## PR 0.1: `foundation_status_review_and_next_runtime_slice_selection_v0_1`

### 목적

완료된 Research-to-Perspective foundation scaffold를 정리하고, 다음 runtime/read-model slice를 하나만 선택한다.

### 예상 파일

```text
docs/RESEARCH_TO_PERSPECTIVE_FOUNDATION_STATUS_REVIEW_V0_1.md
fixtures/research-candidate-review.foundation-status-review.sample.v0.1.json
scripts/smoke-research-to-perspective-foundation-status-review-v0-1.mjs
package.json
docs/00_INDEX_LATEST.md
```

### 문서에 포함할 내용

```text
completed foundation rails
rail별 authority level
rail별 runtime readiness
forbidden capability list
next runtime 후보 비교표
선택된 next runtime/read-model slice
deferred 후보와 deferred reason
product-write parked 재확인
#760 audit 반영
```

### 후보 비교 기준

```text
Foundation Status Dashboard
Research Candidate Lifecycle Read Model
Durable Candidate Review Memory
Bounded Source Intake Runtime
Provider-assisted Extraction
Retrieval/RAG Runtime
Durable Promotion
Product Write Reentry
Git Ledger Export
```

### 권장 결론

```text
selected_next_slice = research_candidate_lifecycle_read_model_v0_1
```

### 금지

```text
runtime route
DB schema/migration
provider/OpenAI call
retrieval/RAG execution
Perspective promotion
proof/evidence write
product write
Codex/GitHub automation
```

### 수용 기준

```text
foundation 상태가 completed / preview / contract / runtime_partial / runtime_unopened / parked / forbidden으로 분류됨
next slice가 정확히 하나 선택됨
선택 사유와 비선택 사유가 모두 있음
completed scaffold를 completed runtime으로 오인하지 않음
forbidden capability wording drift를 smoke가 잡음
```

---

# Phase 1. Candidate read-model intelligence

Phase 1은 Research/ROI 문서의 P0 핵심을 반영한다. 이 단계는 DB write를 열지 않는다. 이미 존재하는 fixture, packet, handoff, feedback, candidate object를 읽어 operator review 품질을 올리는 derived read model을 만든다.

## PR 1.1: `research_candidate_lifecycle_read_model_v0_1`

### 목적

candidate가 시간 속에서 어떤 상태인지 읽는다.

### 예상 파일

```text
types/research-candidate-lifecycle.ts
lib/research-candidate-review/lifecycle-read-model.ts
fixtures/research-candidate-review.lifecycle.sample.v0.1.json
scripts/smoke-research-candidate-lifecycle-read-model-v0-1.mjs
package.json
```

### 개발 내용

```text
candidate별 lifecycle summary
family별 lifecycle count
stale / blocked / needs_review list
source_ref coverage
feedback event linkage
packet/handoff linkage
next_review_action cue
```

### lifecycle status 후보

```text
new_candidate
needs_review
operator_corrected
operator_pinned
operator_dismissed
invalidated
superseded
stale
ready_for_review
blocked
```

### next_review_action 후보

```text
inspect_source
resolve_tension
add_evidence
review_feedback
prepare_handoff
defer
reject_candidate
no_action
```

### 금지

```text
DB write
proof/evidence write
Perspective promotion
work item 생성
Codex execution
provider/OpenAI call
retrieval/RAG execution
product write
```

### 수용 기준

```text
feedback event는 truth가 아니라 operator signal로만 쓰임
dismissed는 rejected가 아님
pinned는 promoted가 아님
invalidated는 proof가 아님
next_review_action은 실행이 아니라 review cue
authority_boundary가 포함됨
```

## PR 1.2: `research_candidate_calibration_diagnostic_v0_1`

### 목적

confidence/readiness가 truth/promotion처럼 오용되는 것을 막는다.

### 예상 파일

```text
types/research-candidate-calibration-diagnostic.ts
lib/research-candidate-review/calibration-diagnostic.ts
fixtures/research-candidate-review.calibration-diagnostic.sample.v0.1.json
scripts/smoke-research-candidate-calibration-diagnostic-v0-1.mjs
package.json
```

### 개발 내용

```text
support_count
contradiction_count
unresolved_tension_count
knowledge_gap_count
source_ref_coverage_ratio
missing_locator_count
stale_context_flag
overclaim_risk_flag
readiness_label
readiness_reason_codes
```

### readiness reason code 후보

```text
source_ref_missing
evidence_missing
contradiction_present
unresolved_tension_present
locator_missing
readiness_overclaim_risk
operator_invalidation_present
operator_correction_present
stale_context_present
```

### 금지

```text
confidence as truth
readiness as promotion
diagnostic as evidence
diagnostic as proof
automatic rejection
automatic promotion
```

### 수용 기준

```text
readiness는 promotion이 아님
confidence는 truth가 아님
diagnostic은 source/evidence/proof row를 만들지 않음
readiness reason codes가 packet/handoff/UI에 짧게 표시 가능
```

## PR 1.3: `logical_claim_shape_preview_v0_1`

### 목적

claim candidate의 최소 논리 구조를 만든다. theorem prover가 아니다.

### 예상 파일

```text
types/research-candidate-logical-claim-shape.ts
lib/research-candidate-review/logical-claim-shape.ts
fixtures/research-candidate-review.logical-claim-shape.sample.v0.1.json
scripts/smoke-research-candidate-logical-claim-shape-v0-1.mjs
package.json
```

### 개발 내용

```text
inference_type
premise_candidate_ids
conclusion_text
missing_assumption_notes
possible_counterclaim_candidate_ids
logical_status
```

### inference_type 후보

```text
direct_observation
source_summary
abductive_hypothesis
analogy
extrapolation
operational_translation
unknown
```

### logical_status 후보

```text
well_structured_candidate
missing_premise
possible_non_sequitur
contradicted_by_candidate
underspecified
```

### 금지

```text
theorem proving
proof check
automatic rejection
automatic promotion
Lean/formal proof integration
```

### 수용 기준

```text
logical shape는 proof가 아님
missing premise는 rejection이 아니라 review cue
contradiction은 자동 폐기가 아니라 tension/lifecycle/calibration에 연결
```

## PR 1.4: `feedback_to_rule_candidate_contract_v0_1`

### 목적

operator feedback을 자동 rule mutation이 아니라 future rule/update candidate로 전환한다.

### 예상 파일

```text
types/feedback-to-rule-candidate.ts
lib/research-candidate-review/feedback-to-rule-candidate.ts
fixtures/research-candidate-review.feedback-to-rule-candidate.sample.v0.1.json
scripts/smoke-feedback-to-rule-candidate-v0-1.mjs
package.json
```

### 개발 내용

```text
feedback_event_refs
affected_surface
observed_pattern
proposed_rule_change
expected_benefit
risk_note
review_status
```

### affected_surface 후보

```text
manual_note_parser
research_candidate_review
geometry_digest
ai_context_packet
codex_handoff_draft
lifecycle_read_model
calibration_diagnostic
```

### 금지

```text
automatic rule mutation
automatic parser change
automatic packet rule change
automatic PR creation
accepted_for_future_pr as PR authority
```

### 수용 기준

```text
feedback은 truth가 아님
rule candidate는 자동 적용되지 않음
raw note의 secret-like pattern은 차단 또는 redaction됨
accepted_for_future_pr은 PR 생성 권한이 아님
```

## PR 1.5: `temporal_handoff_diagnostic_sections_v0_1`

### 목적

Temporal Perspective Overlay vocabulary를 AI Context Packet과 Codex Handoff Draft에 흡수한다.

### 예상 파일

```text
types/ai-context-packet-temporal-section-contract.ts
types/codex-handoff-draft-temporal-section-contract.ts
fixtures/ai-context-packet-temporal-section.sample.v0.2.json
fixtures/codex-handoff-draft-temporal-section.sample.v0.2.json
scripts/smoke-ai-context-packet-temporal-section-v0-2.mjs
scripts/smoke-codex-handoff-draft-temporal-section-v0-2.mjs
package.json
```

### 포함 섹션

```text
active_context_lane_refs
evidence_anchor_refs
perspective_view_refs
pending_change_trace_refs
expected_observed_delta_refs
decision_hold_trace_refs
reconstruction_proposal_refs
context_access_gate_ref
decision_readiness_ref
authority_boundary_notes
```

### Codex Handoff 섹션

```text
Expected files
Observed files
Expected checks
Observed checks
Expected/Observed Delta
Decision Hold Classification
Not-done Classification
Source refs
Unresolved tensions preserved
Authority boundary
```

### 흡수하는 TPO vocabulary

```text
Evidence Anchor
Perspective View
Pending Change Trace
Expected/Observed Delta
Scoped Context Lane
Context Access Gate
Decision Hold Trace
Relationship Evidence Tag
Decision Readiness Gate
Overconfident Narrative Guard
```

### 금지

```text
handoff as execution approval
expected files as write authority
expected checks as proof
Codex result as state
GitHub branch/PR hint as automation authority
```

### 수용 기준

```text
Codex done claim과 실제 observed files/checks를 분리함
not-done classification이 존재함
unresolved tensions가 보존됨
authority boundary가 handoff에 표시됨
```

---

# Phase 2. Candidate Review Memory runtime

Phase 2는 explicit user action 기반 review memory를 연다. 이 단계부터 local DB write가 가능해진다. 단, review memory는 durable Perspective state가 아니다.

## PR 2.1: `research_candidate_review_memory_contract_v0_1`

### 예상 파일

```text
types/research-candidate-review-memory.ts
fixtures/research-candidate-review.memory-contract.sample.v0.1.json
scripts/smoke-research-candidate-review-memory-contract-v0-1.mjs
docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_V0_1.md
package.json
```

### 필드

```text
review_record_id
scope
created_at
updated_at
source_preview_draft_id
source_candidate_bundle_id
reviewer_actor
review_action
review_status
reviewer_note_summary
source_refs
candidate_refs
boundary_acknowledgements
persistence_policy
export_policy
delete_or_discard_policy
authority_boundary
```

### 허용 review action

```text
save_review_note
defer_candidate
reject_candidate
request_more_evidence
mark_duplicate
mark_superseded
mark_needs_source_ref
prepare_promotion_later
```

### 금지 review action

```text
promote_perspective_now
create_proof_now
create_evidence_now
create_work_item_now
execute_codex_now
product_write_now
```

### 수용 기준

```text
review memory는 durable Perspective state가 아님
raw private source body 저장 금지
source_refs 없는 grounded record는 invalid 또는 hypothesis-only
product-write parked 침범 없음
```

## PR 2.2: `research_candidate_review_memory_store_v0_1`

### 예상 파일

```text
lib/research-candidate-review/review-memory-store.ts
lib/db/schema.sql
scripts/db-migrations.mjs
scripts/db-migrate.mjs
fixtures/research-candidate-review.memory-store.sample.v0.1.json
scripts/smoke-research-candidate-review-memory-store-v0-1.mjs
package.json
```

### DB 테이블 후보

```sql
research_candidate_review_records
research_candidate_review_record_candidates
research_candidate_review_record_sources
research_candidate_review_record_activity
```

### helper

```text
createReviewRecord(input, db)
readReviewRecord(id, db)
listReviewRecords(filters, db)
appendReviewRecordActivity(event, db)
discardReviewRecord(id, reason, db)
```

### 저장 가능

```text
review status
reviewer note summary
selected candidate refs
selected source refs
boundary acknowledgements
decision metadata
duplicate/supersede links
request_more_evidence reason
```

### 저장 금지

```text
raw private source body
hidden provider chain-of-thought
unreviewed provider output as fact
proof/evidence record
durable perspective delta
product IDs
```

### 수용 기준

```text
/tmp DB smoke only
caller-injected DB only
idempotency policy
discard는 hard delete가 아니라 lifecycle transition
preview draft table과 충돌 없음
```

## PR 2.3: `research_candidate_review_memory_routes_v0_1`

### 예상 파일

```text
app/api/research-candidate-review/review-records/route.ts
app/api/research-candidate-review/review-records/[review_record_id]/route.ts
app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts
app/api/research-candidate-review/review-records/[review_record_id]/discard/route.ts
scripts/smoke-research-candidate-review-memory-routes-v0-1.mjs
fixtures/research-candidate-review.memory-routes.sample.v0.1.json
package.json
```

### routes

```text
POST /review-records
GET /review-records
GET /review-records/:id
GET /review-records/:id/activity
POST /review-records/:id/discard
```

### validation

```text
JSON object shape
scope
max note length
candidate refs shape
source_refs for grounded decisions
forbidden action refusal
product-write flag refusal
provider/retrieval authority flag refusal
```

### 수용 기준

```text
valid create/list/detail/activity/discard temp DB smoke
forbidden authority payload는 400/403
duplicate/idempotent policy 명확
route response에 boundary 포함
```

## PR 2.4: `research_candidate_review_memory_ui_v0_1`

### 예상 파일

```text
components/research-candidate-review-memory-panel.tsx
components/research-candidate-review-record-card.tsx
components/research-candidate-review-record-detail.tsx
components/research-candidate-review-record-controls.tsx
components/augnes-cockpit.tsx
scripts/smoke-research-candidate-review-memory-ui-v0-1.mjs
scripts/browser-validate-research-candidate-review-memory-ui-v0-1.mjs
app/globals.css
package.json
```

### UI 기능

```text
Save review record
Add reviewer note summary
Mark defer/reject/request more evidence/duplicate/superseded
List review records
Open review record detail
View source_refs and candidate_refs
View authority boundary
Discard with reason
Copy review packet for human review
```

### 금지 UI

```text
Promote button
Create proof button
Create evidence button
Create work item button
Execute Codex button
Product write button
```

### 수용 기준

```text
all writes go to review memory routes only
local parse remains no-network unless explicit runtime action clicked
390px viewport no-overflow
no provider/retrieval/source-fetch/product-write request observed
saved record remains candidate/review state
```

## PR 2.5: `foundation_lifecycle_review_memory_readonly_ui_v0_1`

### 목적

Foundation status dashboard를 standalone early UI가 아니라 lifecycle + review memory와 합쳐 보여준다.

### 예상 파일

```text
components/foundation-status-dashboard.tsx
components/foundation-lifecycle-summary-panel.tsx
components/augnes-cockpit.tsx
scripts/smoke-foundation-lifecycle-review-memory-ui-v0-1.mjs
scripts/browser-validate-foundation-lifecycle-review-memory-ui-v0-1.mjs
app/globals.css
package.json
```

### UI 섹션

```text
Foundation completion summary
Rail status matrix
Runtime readiness matrix
Forbidden capability matrix
Product-write parked status
Next runtime slice pointer
Lifecycle summary
Review records list/detail
Operator decision queue
Known warnings/skipped checks
```

### 수용 기준

```text
dashboard는 orientation surface
lifecycle은 next review cue
review memory는 explicit user action 기록
세 레이어가 섞이지 않음
```

---

# Phase 3. Source intake, provider, retrieval

Phase 3은 source/provider/retrieval을 실제 runtime으로 열되 candidate-only boundary를 유지한다.

## PR 3.1: `bounded_source_intake_runtime_contract_v0_1`

### 예상 파일

```text
types/bounded-source-intake-runtime.ts
fixtures/bounded-source-intake-runtime-contract.sample.v0.1.json
scripts/smoke-bounded-source-intake-runtime-contract-v0-1.mjs
docs/BOUNDED_SOURCE_INTAKE_RUNTIME_V0_1.md
package.json
```

### contract 필드

```text
source_intake_request_id
input_kind: url | doi | file_ref | note_ref
user_provided: true
fetch_policy
size_limit_bytes
timeout_ms
redaction_policy
source_body_storage_policy
copyright_boundary
failure_to_gap_policy
authority_boundary
```

### 금지

```text
implementation fetch
crawler
automatic web discovery
background fetch
source body durable write by default
provider extraction
retrieval index write
```

### 수용 기준

```text
user_provided=false는 forbidden
crawler/search-provider input forbidden
failed fetch는 hallucinated summary가 아니라 gap/tension candidate input
source body storage policy 명확
```

## PR 3.2: `bounded_source_intake_runtime_v0_1`

### 예상 파일

```text
lib/research-source/intake-runtime.ts
lib/research-source/sanitize-source-ref.ts
lib/research-source/fetch-bounded-source.ts
app/api/research-source/intake/route.ts
fixtures/bounded-source-intake-runtime.sample.v0.1.json
scripts/smoke-bounded-source-intake-runtime-v0-1.mjs
scripts/browser-validate-bounded-source-intake-runtime-v0-1.mjs
package.json
```

### runtime 요구

```text
explicit POST only
user-provided URL/DOI/file/note only
max size enforcement
timeout enforcement
content-type allowlist
redacted source_ref_id generation
no automatic follow-up crawling
no provider extraction by default
no retrieval indexing by default
```

### 실패 종류

```text
fetch_failed
unsupported_content_type
content_too_large
copyright_boundary_blocked
private_identifier_detected
source_unavailable
```

### 수용 기준

```text
mock/fake fetch 또는 bounded local fixture부터 시작
live network는 별도 validation에서만 명시
source_ref metadata 저장 가능
raw body default non-persistent
external request는 사용자가 요청한 source에만 발생
```

## PR 3.3: `provider_assisted_extraction_candidate_only_contract_v0_1`

### 예상 파일

```text
types/provider-assisted-extraction-contract.ts
fixtures/provider-assisted-extraction-contract.sample.v0.1.json
scripts/smoke-provider-assisted-extraction-contract-v0-1.mjs
docs/PROVIDER_ASSISTED_EXTRACTION_CANDIDATE_ONLY_V0_1.md
package.json
```

### 필수 필드

```text
provider_ref
model_or_tool_ref
source_ref_id
extraction_requested_by
extraction_time
input_boundary
output_boundary
candidate_families_generated
confidence_label
unsupported_extraction_policy
quote_limit_policy
copyright_boundary
no_chain_of_thought_storage
authority_boundary
```

### 금지

```text
provider call implementation
auto evidence write
auto perspective promotion
provider output as proof
hidden chain-of-thought storage
raw copyrighted source over-quotation
```

### 수용 기준

```text
provider output은 candidate-only
unsupported extraction은 hypothesis_only 또는 needs_review
source_refs 없이는 supported처럼 보이지 않음
provider confidence는 promotion readiness 아님
```

## PR 3.4: `provider_assisted_extraction_runtime_v0_1`

### 예상 파일

```text
lib/research-extraction/provider-extract-candidates.ts
lib/research-extraction/normalize-provider-output.ts
lib/research-extraction/provider-boundary.ts
app/api/research-candidate-review/provider-extraction/route.ts
fixtures/provider-assisted-extraction-runtime.sample.v0.1.json
scripts/smoke-provider-assisted-extraction-runtime-v0-1.mjs
scripts/browser-validate-provider-assisted-extraction-runtime-v0-1.mjs
package.json
```

### runtime 요구

```text
provider key missing graceful refusal
provider call은 explicit user action 필요
source_ref_id required
source excerpt length bounded
raw source body non-persistence by default
normalized candidate bundle output
warnings for unsupported/low-grounding extraction
no promotion/write authority
```

### 수용 기준

```text
provider unavailable smoke 통과
mock provider fixture deterministic
live provider validation optional, skipped reason 명시
provider output은 review memory 또는 preview draft로만 연결
```

## PR 3.5: `research_retrieval_runtime_contract_v0_1`

### 예상 파일

```text
types/research-retrieval-runtime-contract.ts
fixtures/research-retrieval-runtime-contract.sample.v0.1.json
scripts/smoke-research-retrieval-runtime-contract-v0-1.mjs
docs/RESEARCH_RETRIEVAL_RAG_RUNTIME_V0_1.md
package.json
```

### index 대상

```text
source_ref metadata
candidate summaries
review notes
perspective delta summaries
formation receipt summaries
feedback summaries
```

### authority boundary

```text
index is rebuildable
index is derived
index is non-authoritative
retrieval result is not evidence
retrieval score is not truth score
retrieval score is not promotion readiness
RAG answer is context preview only
```

### 수용 기준

```text
stale index cannot override current state
search results link back to canonical local records/source_refs
candidate/durable distinction preserved
```

## PR 3.6: `rebuildable_retrieval_index_runtime_v0_1`

### 예상 파일

```text
lib/research-retrieval/rebuild-index.ts
lib/research-retrieval/search-index.ts
lib/research-retrieval/index-store.ts
app/api/research-retrieval/rebuild/route.ts
app/api/research-retrieval/search/route.ts
fixtures/research-retrieval-index-runtime.sample.v0.1.json
scripts/smoke-research-retrieval-index-runtime-v0-1.mjs
package.json
```

### 초기 구현

```text
SQLite FTS 또는 deterministic simple index
vector DB deferred
index rows are derived
explicit rebuild only
stale marker included
```

### 수용 기준

```text
rebuild deterministic
search result 역참조 가능
stale index marker 존재
검색 결과는 proof/evidence/promotion readiness로 표시되지 않음
```

## PR 3.7: `rag_context_preview_v0_1`

### 예상 파일

```text
lib/research-retrieval/build-rag-context-preview.ts
types/rag-context-preview.ts
fixtures/rag-context-preview.sample.v0.1.json
scripts/smoke-rag-context-preview-v0-1.mjs
components/rag-context-preview-panel.tsx
package.json
```

### 구조

```text
query
retrieved_refs
included_context_summaries
excluded_context_reasons
candidate_vs_durable_markers
staleness_warnings
unresolved_tensions
knowledge_gaps
authority_boundary
```

### 금지

```text
final answer as truth
provider-generated proof
automatic candidate mutation
automatic promotion
```

### 수용 기준

```text
RAG context preview는 review aid
retrieval score는 display hint
omitted/deferred context 명시
source_refs 없는 context는 included 불가
```

---

# Phase 4. Human-reviewed promotion and durable Perspective state

## PR 4.1: `perspective_promotion_runtime_contract_v0_1`

### 예상 파일

```text
types/perspective-promotion-runtime-contract.ts
fixtures/perspective-promotion-runtime-contract.sample.v0.1.json
scripts/smoke-perspective-promotion-runtime-contract-v0-1.mjs
docs/PERSPECTIVE_PROMOTION_RUNTIME_V0_1.md
package.json
```

### promotion decision 필드

```text
promotion_decision_id
scope
review_record_id
perspective_delta_candidate_id
operator_actor
decision
basis_claim_candidate_ids
basis_evidence_candidate_ids
accepted_evidence_refs
unresolved_tension_handling
knowledge_gap_handling
formation_receipt_policy
authority_boundary
```

### decision 후보

```text
promote
reject
defer
request_more_evidence
supersede
split_delta
merge_with_existing
```

### 필수 gate

```text
explicit user action
source_refs present
candidate/durable distinction confirmed
unresolved tensions preserved or handled explicitly
knowledge gaps preserved/deferred/closed explicitly
accepted evidence requirement clarified
Formation Receipt required
```

### 금지

```text
runtime route/write
durable state mutation
proof/evidence creation
provider/retrieval initiated promotion
Codex/GitHub initiated promotion
product write
```

## PR 4.2: `promotion_decision_store_route_v0_1`

### 예상 파일

```text
lib/perspective/promotion/promotion-decision-store.ts
app/api/perspective/promotion-decisions/route.ts
app/api/perspective/promotion-decisions/[promotion_decision_id]/route.ts
fixtures/perspective-promotion-decision-store.sample.v0.1.json
scripts/smoke-perspective-promotion-decision-store-v0-1.mjs
lib/db/schema.sql
package.json
```

### 저장 정책

```text
append-only 성격
rejected/deferred decision 보존
request_more_evidence도 decision record
source_refs와 basis refs required
operator confirmation required
state apply separated
```

### 수용 기준

```text
promote decision 저장해도 아직 state가 바뀌지 않는 모드 가능
malformed/under-evidenced request 거절
decision record가 Formation Receipt 생성 전제 정보를 가짐
```

## PR 4.3: `formation_receipt_durable_write_v0_1`

### 예상 파일

```text
lib/perspective/formation-receipt/formation-receipt-store.ts
lib/perspective/formation-receipt/build-durable-receipt.ts
app/api/perspective/formation-receipts/route.ts
fixtures/formation-receipt-durable-write.sample.v0.1.json
scripts/smoke-formation-receipt-durable-write-v0-1.mjs
lib/db/schema.sql
package.json
```

### receipt 필드

```text
receipt_id
promotion_decision_id
review_record_id
selected_candidate_ids
omitted_candidate_ids
deferred_candidate_ids
selected_source_refs
geometry_digest_ref
agent_substrate_warning_ids
context_packet_ref
feedback_event_refs
unresolved_tensions_preserved
knowledge_gaps_preserved
boundary_acknowledgements
created_at
```

### 수용 기준

```text
receipt explains why context was selected
omitted/deferred candidates are not rejected unless marked
receipt is not proof of correctness
receipt required before durable state apply
```

## PR 4.4: `durable_perspective_state_apply_v0_1`

### 예상 파일

```text
lib/perspective/state/apply-perspective-delta.ts
lib/perspective/state/read-perspective-state.ts
lib/perspective/state/state-store.ts
app/api/perspective/state/apply-delta/route.ts
app/api/perspective/state/[perspective_id]/route.ts
fixtures/durable-perspective-state-apply.sample.v0.1.json
scripts/smoke-durable-perspective-state-apply-v0-1.mjs
lib/db/schema.sql
package.json
```

### state 필드

```text
perspective_id
current_thesis
prior_theses
active_claims
retired_claims
supporting_evidence_refs
contradicting_evidence_refs
open_tensions
resolved_tensions
knowledge_gaps
promotion_history
retirement_history
formation_receipt_refs
salience_state
reuse_conditions
```

### apply operation

```text
add
refine
weaken
reverse
split
merge
retire
reweight
reactivate
```

### 금지

```text
silent overwrite
contradicted evidence deletion
retired claims deletion
unresolved tension loss
provider/retrieval direct apply
product write
```

### 수용 기준

```text
current thesis has lineage
prior thesis not silently overwritten
retired claims remain auditable
contradicted evidence not deleted
every state apply references promotion decision and Formation Receipt
```

## PR 4.5: `perspective_trajectory_builder_v0_1`

### 예상 파일

```text
lib/perspective/state/build-trajectory.ts
app/api/perspective/state/[perspective_id]/trajectory/route.ts
components/perspective-trajectory-panel.tsx
fixtures/perspective-trajectory.sample.v0.1.json
scripts/smoke-perspective-trajectory-v0-1.mjs
package.json
```

### trajectory event

```text
candidate_created
review_record_saved
promotion_decision_created
formation_receipt_created
durable_delta_applied
claim_retired
tension_resolved
knowledge_gap_deferred
salience_changed
feedback_influenced_surface
```

### 수용 기준

```text
why current thesis changed 재구성 가능
prior thesis and retired claims visible
evidence/tension/gap handling visible
trajectory is read-only unless separate decision action
```

---

# Phase 5. Runtime layout and feedback surfacing

## PR 5.1: `project_constellation_runtime_layout_contract_v0_1`

### 예상 파일

```text
types/project-constellation-runtime-layout-contract.ts
fixtures/project-constellation-runtime-layout-contract.sample.v0.1.json
scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs
docs/PROJECT_CONSTELLATION_RUNTIME_LAYOUT_V0_1.md
package.json
```

### 원칙

```text
layout = interface
coordinates ≠ truth
manual anchors = display hints
temporal smoothing = display continuity
candidate overlay ≠ durable graph
source balance = advisory
```

### 필드

```text
layout_id
perspective_id
as_of_state_version
candidate_overlay_ref
layout_seed
node_positions
edge_routes
manual_anchors
temporal_smoothing_state
stale_markers
tension_markers
gap_markers
bridge_node_markers
source_balance_diagnostics
authority_boundary
```

## PR 5.2: `seeded_constellation_layout_runtime_v0_1`

### 예상 파일

```text
lib/perspective/layout/seeded-layout.ts
lib/perspective/layout/layout-diagnostics.ts
fixtures/project-constellation-seeded-layout.sample.v0.1.json
scripts/smoke-project-constellation-seeded-layout-v0-1.mjs
package.json
```

### 초기 알고리즘

```text
deterministic seed from perspective_id + state_version
cluster-based coarse positions
source balance spread
candidate overlay offset layer
stale/tension/gap marker placement
bridge node emphasis
```

### 수용 기준

```text
same input produces same layout
candidate overlay positions stable but visually distinct
no coordinate is used as authority
```

## PR 5.3: `constellation_runtime_ui_v0_1`

### 예상 파일

```text
components/perspective/constellation-runtime-view.tsx
components/perspective/constellation-node.tsx
components/perspective/constellation-edge.tsx
components/perspective/constellation-inspector.tsx
components/perspective/candidate-overlay-toggle.tsx
scripts/smoke-project-constellation-runtime-ui-v0-1.mjs
scripts/browser-validate-project-constellation-runtime-ui-v0-1.mjs
app/globals.css
package.json
```

### UI 기능

```text
durable graph layer
candidate overlay layer
source provenance inspector
tension/gap/stale/bridge markers
manual anchor preview
read-only layout diagnostics
selected node trajectory/context preview
```

### 금지

```text
coordinate edit as truth
promote from layout without review gate
delete evidence from graph
hide unresolved tension silently
product write
```

## PR 5.4: `layout_persistence_manual_anchors_v0_1`

### 예상 파일

```text
lib/perspective/layout/manual-anchor-store.ts
app/api/perspective/layout/manual-anchors/route.ts
fixtures/project-constellation-manual-anchors.sample.v0.1.json
scripts/smoke-project-constellation-manual-anchors-v0-1.mjs
package.json
```

### 저장 가능

```text
node_ref
anchor_position
anchor_reason
created_by
updated_at
applies_to_layout_scope
```

### 저장 금지

```text
truth score
promotion readiness
evidence strength
source authority
```

## PR 5.5: `feedback_event_aggregation_runtime_v0_1`

### 예상 파일

```text
lib/research-candidate-review/feedback-event-aggregation-runtime.ts
app/api/research-candidate/feedback-events/aggregation/route.ts
fixtures/feedback-event-aggregation-runtime.sample.v0.1.json
scripts/smoke-feedback-event-aggregation-runtime-v0-1.mjs
package.json
```

### aggregation 항목

```text
pin_count
dismiss_count
correct_count
invalidate_count
needs_more_evidence_count
scope_overreach_count
last_feedback_at
current_surface_priority_hint
rule_failure_candidates
```

### 수용 기준

```text
aggregation is advisory only
candidate/durable distinction preserved
invalid feedback cannot suppress source visibility silently
```

## PR 5.6: `feedback_controls_expansion_v0_1`

### 예상 파일

```text
components/feedback-event-expanded-controls.tsx
components/agent-perspective-substrate-folded-audit-panel.tsx
scripts/smoke-feedback-controls-expanded-v0-1.mjs
scripts/browser-validate-feedback-controls-expanded-v0-1.mjs
package.json
```

### controls

```text
dismiss_preview
pin_preview
correct_preview
invalidate_preview
needs_more_evidence
scope_overreach
not_relevant_now
mark_useful
mark_wrong
```

### UI 요구

```text
destructive-looking actions require confirmation
correction requires note/source reason
invalidate does not delete target
needs_more_evidence creates review cue only
scope_overreach creates rule failure candidate only
```

## PR 5.7: `feedback_influenced_surfacing_preview_v0_1`

### 예상 파일

```text
lib/perspective/agent-substrate/apply-feedback-surfacing-preview.ts
fixtures/agent-substrate-feedback-influenced-surfacing.sample.v0.1.json
scripts/smoke-agent-substrate-feedback-influenced-surfacing-v0-1.mjs
package.json
```

### 반영 방식

```text
pinned items stay visible
dismissed items lower display priority, not deleted
corrected items show correction warning
invalidated items require source/review follow-up
needs_more_evidence creates retrieval/source follow-up candidate
```

---

# Phase 6. Dogfooding and CI runtime

## PR 6.1: `dogfooding_record_runtime_contract_v0_1`

### 예상 파일

```text
types/dogfooding-research-record-runtime-contract.ts
fixtures/dogfooding-research-record-runtime-contract.sample.v0.1.json
scripts/smoke-dogfooding-research-record-runtime-contract-v0-1.mjs
docs/DOGFOODING_RESEARCH_TO_PERSPECTIVE_RUNTIME_V0_1.md
package.json
```

### input 종류

```text
pr_body
codex_result_report
changed_files_summary
validation_command_report
smoke_failure_report
authority_boundary_regression
operator_review_note
merge_closeout_summary
```

### 수용 기준

```text
PR body is operator report, not truth
validation commands are review cues, not authority
smoke pass is not proof
smoke fail is diagnostic, not automatic rejection
```

## PR 6.2: `dogfooding_ingestion_runtime_v0_1`

### 예상 파일

```text
lib/dogfooding/dogfooding-record-store.ts
app/api/dogfooding/research-records/route.ts
fixtures/dogfooding-research-record-runtime.sample.v0.1.json
scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs
package.json
```

### route 요구

```text
same-origin POST only
operator-supplied payload only
GitHub IDs are references only
changed files are review cues only
validation reports are diagnostic only
no automatic GitHub mutation
```

## PR 6.3: `authority_boundary_regression_ci_v0_1`

### 예상 파일

```text
scripts/smoke-authority-boundary-regression-v0-1.mjs
.github/workflows/authority-boundary-smoke.yml
fixtures/authority-boundary-regression-baseline.sample.v0.1.json
docs/AUTHORITY_BOUNDARY_REGRESSION_CI_V0_1.md
package.json
```

### 검사 대상

```text
candidate as proof wording
retrieval as authority wording
provider output as evidence wording
feedback as truth wording
layout coordinates as truth wording
Codex handoff as execution approval wording
product write availability wording
```

### 수용 기준

```text
GitHub Actions는 static smoke만 실행
CI pass/fail은 dogfooding candidate로만 수집 가능
CI가 state/promotion/product write를 실행하지 않음
```

## PR 6.4: `codex_result_report_ingestion_v0_1`

### 예상 파일

```text
lib/dogfooding/codex-result-report-normalizer.ts
fixtures/codex-result-report-ingestion.sample.v0.1.json
scripts/smoke-codex-result-report-ingestion-v0-1.mjs
components/codex-result-report-ingestion-panel.tsx
package.json
```

### 수용 기준

```text
Codex report is candidate input
changed files and validation commands are review cues
no proof/evidence/write/promotion created
operator can convert report into review record later
```

## PR 6.5: `temporal_handoff_usefulness_experiment_v0_1`

### 예상 파일

```text
docs/TEMPORAL_HANDOFF_USEFULNESS_EXPERIMENT_PLAN_V0_1.md
fixtures/temporal-handoff-usefulness-scenario.sample.v0.1.json
scripts/smoke-temporal-handoff-usefulness-experiment-plan-v0-1.mjs
package.json
```

### 비교군

```text
ordinary Codex prompt
existing Perspective/Handoff Capsule
Temporal Perspective enhanced handoff
```

### 평가 항목

```text
expected files/checks 누락 탐지
unresolved tension preservation
authority boundary clarity
source_refs coverage
not-done classification quality
overconfident narrative warning quality
single-event baseline rewrite 방지
```

---

# Phase 7. Operational hardening

이전 v0.2에서 가장 부족했던 부분이다. remaining development 문서의 R34-R37을 명시적으로 복원한다.

## PR 7.1: `local_data_export_import_policy_v0_1`

### 목적

local-first runtime에서 생긴 candidate/review/promotion/state/receipt/feedback 데이터를 내보내고 복구하는 정책을 정의한다.

### 예상 파일

```text
docs/LOCAL_DATA_EXPORT_IMPORT_POLICY_V0_1.md
types/local-data-export.ts
fixtures/local-data-export.sample.v0.1.json
scripts/smoke-local-data-export-policy-v0-1.mjs
package.json
```

### 포함 대상

```text
review records
source refs
candidate bundles
promotion decisions
formation receipts
perspective state
trajectory events
feedback events
layout preferences
```

### 수용 기준

```text
export includes authority boundary metadata
private/raw source body policy explicit
import cannot auto-promote
import cannot auto-write product state
```

## PR 7.2: `privacy_redaction_runtime_guard_v0_1`

### 목적

provider IDs, private URLs, thread/run/session IDs, raw pasted private text가 canonical state나 exported payload로 새지 않게 한다.

### 예상 파일

```text
lib/privacy/redaction-guard.ts
fixtures/privacy-redaction-guard.sample.v0.1.json
scripts/smoke-privacy-redaction-guard-v0-1.mjs
package.json
```

### 검사 대상

```text
provider internal IDs
thread IDs
run IDs
session IDs
private URLs
credentials
raw source body
raw note text
opaque connector IDs
```

### 수용 기준

```text
forbidden identifiers cannot become canonical labels
exports redact or reference-only encode sensitive refs
smoke uses safe markers without echoing secrets
```

## PR 7.3: `runtime_audit_panel_v0_1`

### 목적

runtime writes가 늘어날수록 operator가 무엇이 저장됐는지 볼 수 있어야 한다.

### 예상 파일

```text
components/runtime-audit-panel.tsx
app/api/runtime-audit/events/route.ts
lib/runtime-audit/audit-event-store.ts
fixtures/runtime-audit-panel.sample.v0.1.json
scripts/smoke-runtime-audit-panel-v0-1.mjs
package.json
```

### audit event 종류

```text
review_record_created
source_ref_created
provider_extraction_run
retrieval_index_rebuilt
promotion_decision_created
formation_receipt_created
durable_delta_applied
feedback_event_written
layout_anchor_saved
product_write_attempted
product_write_blocked
git_ledger_export_packet_created
```

### 수용 기준

```text
audit panel is read-only
every write-capable route has audit event or explicit reason not to
product-write blocked attempts visible
```

## PR 7.4: `release_readiness_matrix_v0_1`

### 목적

개발된 runtime 기능이 demo/release 가능한 상태인지 점검한다.

### 예상 파일

```text
docs/RESEARCH_TO_PERSPECTIVE_RELEASE_READINESS_MATRIX_V0_1.md
fixtures/release-readiness-matrix.sample.v0.1.json
scripts/smoke-release-readiness-matrix-v0-1.mjs
package.json
```

### matrix 항목

```text
smoke coverage
browser validation
mobile viewport
DB migration rollback
provider missing-key behavior
retrieval stale-index behavior
source fetch failure behavior
privacy/redaction guard
export/import policy
product-write parked/reentry state
Git Ledger export safety
```

### 수용 기준

```text
release readiness is explicit, not vibes
skipped checks include reason
warning baseline documented
```

---

# Phase 8. Git Ledger / Export

Git Ledger는 Phase 7 다음 또는 Phase 4/7이 충분히 안정된 뒤에 진행한다. 실제로는 `promotion decision`, `Formation Receipt`, `durable Perspective state apply` 중 적어도 앞의 둘이 있어야 export packet이 의미 있다.

## PR 8.1: `git_ledger_export_contract_v0_1`

### 예상 파일

```text
docs/GIT_LEDGER_EXPORT_V0_1.md
types/git-ledger-export.ts
fixtures/git-ledger-export.sample.v0.1.json
scripts/smoke-git-ledger-export-contract-v0-1.mjs
package.json
```

### packet 역할

```text
public-safe transition/promotion summary
candidate/source/evidence/reviewer refs
privacy report
authority boundary
suggested commit message
suggested file layout
idempotency key
packet hash
```

### public-safe refs

```text
source_ref
candidate_ref
evidence_ref
reviewer_note_ref
formation_receipt_ref
state_transition_ref
bounded summary
content hash
idempotency key
public-safe metadata
```

### 금지 raw/private

```text
raw conversation
hidden reasoning / chain-of-thought
raw source body
raw candidate payload
raw provider output
provider thread/run/session id
private URL
local private path
secret / token / key / cookie
raw DB row dump
raw browser dump
unrestricted raw diff
```

### authority boundary

```text
git_ledger_export_created_now: true
runtime_memory_write_now: false
durable_perspective_state_write_now: false
durable_perspective_delta_apply_now: false
promotion_decision_record_write_now: false
proof_evidence_write_now: false
formation_receipt_write_now: false
work_mutation_now: false
runtime_db_write_now: false
github_branch_create_now: false
github_commit_create_now: false
github_pr_create_now: false
github_merge_now: false
publish_deploy_now: false
approval_granted_now: false
core_decision_created_now: false
git_ref_is_authority: false
```

### 수용 기준

```text
contract defines Git as export/review layer only
all mutation flags false
privacy flags false
no GitHub API call
no branch/commit/PR creation function
no durable Perspective state write
no promotion decision write
no proof/evidence write
no runtime DB write
deterministic hash/idempotency smoke
docs state Git refs are not truth/approval/promotion/merge/publish/Core authority
```

## PR 8.2: `git_ledger_export_deterministic_builder_v0_1`

### 예상 파일

```text
lib/git-ledger/build-export-packet.ts
scripts/smoke-git-ledger-export-implementation-v0-1.mjs
fixtures/git-ledger-export.sample.v0.1.json
package.json
```

### functions

```text
buildGitLedgerExportPacketV01(input)
validateGitLedgerExportPacketV01(packet)
createGitLedgerExportPacketHash(packet)
createGitLedgerExportIdempotencyKey(input)
renderGitLedgerExportSummaryMarkdown(packet)
renderSuggestedCommitMessage(packet)
```

### builder rejects

```text
unknown fields
empty scope/generated_by/title/change_summary/reason_summary
non-public-safe source refs
private URLs
provider thread/run/session IDs
raw payload markers
secret/token/key/cookie markers
unbounded raw diff markers
any request to create branch/commit/PR
```

### 수용 기준

```text
same input => same packet_hash/idempotency_key
unsafe markers fail closed
suggested commit message generated but not executed
no file write
no GitHub call
```

## PR 8.3: `git_ledger_export_readonly_preview_v0_1`

### 개발 내용

```text
Cockpit read-only packet preview
copyable suggested commit message
privacy report display
authority boundary display
```

### 금지 UI

```text
create branch button
commit button
PR button
merge button
publish/deploy button
```

## PR 8.4: `local_git_ledger_export_v0_1`

### 개발 내용

```text
explicit local file export gate
allowlisted output directory
packet.json
summary.md
source-refs.json
evidence-refs.json
candidate-refs.json
privacy-report.json
suggested-commit-message.txt
```

### 금지

```text
GitHub network call
automatic git commit
automatic PR creation
unsafe raw export
```

## PR 8.5: `github_actuation_contract_v0_1`

### 개발 내용

```text
new permission profile design
target policy design
branch/file allowlist
explicit approval payload
dry-run only
```

### 금지

```text
implementation branch/commit/PR creation
contents write without separate approval
PR creation without separate approval
```

## PR 8.6+: GitHub actuation implementation

상태:

```text
out of this roadmap unless separately approved
```

---

# Phase 9. Product Write Reentry

Product-write는 가장 늦다. 이건 취향 문제가 아니라 생존 전략이다. 데이터베이스는 신중한 사람을 좋아한다. 충동적인 사람에게는 migration rollback을 선물한다.

## PR 9.1: `product_write_reentry_review_v0_1`

### 예상 파일

```text
docs/PRODUCT_WRITE_REENTRY_REVIEW_V0_1.md
fixtures/product-write-reentry-review.sample.v0.1.json
scripts/smoke-product-write-reentry-review-v0-1.mjs
package.json
```

### review 항목

```text
#686 stopline conditions
completed runtime prerequisites
promotion decision store status
Formation Receipt durable write status
durable Perspective state apply status
product target groups
product ID allocation policy
transaction/rollback policy
idempotency policy
operator approval requirement
```

### 금지

```text
product write implementation
adapter enablement
product ID allocation
SQL transaction execution
route/UI product action
```

### 수용 기준

```text
product write remains blocked unless all gates satisfied
review can defer product write again
no runtime product mutation
```

## PR 9.2: `product_write_target_contract_v0_1`

### 예상 파일

```text
types/product-write-target-contract.ts
fixtures/product-write-target-contract.sample.v0.1.json
scripts/smoke-product-write-target-contract-v0-1.mjs
docs/PRODUCT_WRITE_TARGET_CONTRACT_V0_1.md
package.json
```

### target groups

```text
accepted_evidence_records
proof_records
work_items
perspective_state_records
formation_receipts
product_activity_log
```

### 정책

```text
product ID allocation
idempotency key
transaction boundary
rollback behavior
audit trail
source_refs requirement
operator approval binding
preview-to-write diff
```

### 수용 기준

```text
each target group has owner/schema/allowed/forbidden write action
product write impossible without promotion decision and receipt
candidate cannot be written as proof/evidence directly
```

## PR 9.3: `disabled_product_write_adapter_reentry_harness_v0_1`

### 예상 파일

```text
lib/product-write/disabled-product-write-adapter.ts
lib/product-write/product-write-transaction-plan.ts
fixtures/disabled-product-write-adapter-reentry-harness.sample.v0.1.json
scripts/smoke-disabled-product-write-adapter-reentry-harness-v0-1.mjs
scripts/run-disabled-product-write-adapter-reentry-harness-v0-1.mjs
package.json
```

### 수용 기준

```text
adapter_status = disabled_by_default
write_execution_status = not_executable
transaction plan is preview only
no DB open
no SQL execution
no product ID allocation
```

## PR 9.3.1: `release_candidate_operator_review_v0_1`

### 개발 내용

```text
review-only release candidate operator packet
release readiness review context
disabled harness review context
product-write reentry review context
no release execution
no release artifact generation
no release candidate approval automation
```

### 금지

```text
release execution
release artifact generation
automatic release approval
product write implementation
adapter enablement
product target contract creation
product ID allocation
DB write
route/UI release action
```

### 수용 기준

```text
operator review packet is review-only
release/product-write authority is not granted
product-write remains parked by #686
```

## PR 9.3.2: `release_notes_public_safe_summary_v0_1`

### 개발 내용

```text
review-only release notes public-safe summary candidate builder
release candidate operator review context
release readiness review context
no release notes publication
no release execution
no release artifact generation
no release approval automation
```

### 금지

```text
release notes publication
release execution
release artifact generation
automatic release approval
product write implementation
adapter enablement
product target contract creation
product ID allocation
DB write
route/UI release action
```

### 수용 기준

```text
release notes summary is review-only and candidate-only
release/product-write authority is not granted
product-write remains parked by #686
```

## PR 9.3.3: `release_operator_checklist_v0_1`

### 개발 내용

```text
review-only release operator checklist candidate builder
release notes summary review context
release candidate operator review context
no release notes publication
no release execution
no release artifact generation
no release approval automation
```

### 금지

```text
release notes publication
release execution
release artifact generation
automatic release approval
product write implementation
adapter enablement
product target contract creation
product ID allocation
DB write
route/UI release action
```

### 수용 기준

```text
release operator checklist is review-only and candidate-only
release/product-write authority is not granted
product-write remains parked by #686
```

## PR 9.4: `product_write_minimal_runtime_v0_1`

상태:

```text
only if explicitly approved
```

### 가능한 첫 write

```text
promotion decision + Formation Receipt 기반 accepted evidence ref
또는
durable perspective delta apply
```

둘 다 한 번에 열지 않는다.

### 예상 파일 후보

```text
lib/product-write/product-write-adapter.ts
app/api/product-write/execute/route.ts
fixtures/product-write-minimal-runtime.sample.v0.1.json
scripts/smoke-product-write-minimal-runtime-v0-1.mjs
scripts/browser-validate-product-write-minimal-runtime-v0-1.mjs
package.json
```

### 필수 조건

```text
explicit operator approval
promotion decision exists
Formation Receipt exists
preview-to-write diff displayed
rollback/idempotency tested
temp DB smoke first
production DB path protected
```

---

# Phase 10. Research P1/P2 backlog

이 단계는 지금 바로 runtime으로 열지 않는다. Phase 1-6에서 데이터와 review loop가 충분히 쌓인 뒤 진행한다.

## PR 10.1: `deterministic_crpf_variant_review_v0_1`

### 목적

constrained random perspective formation 아이디어를 runtime randomness 없이 deterministic fixture variant로 검토한다.

### 안전 조건

```text
fixed seed
fixture-only 또는 deterministic builder
no provider call
no retrieval
no DB write
no promotion
no runtime random behavior
```

### variant 후보

```text
evidence-strict
tension-preserving
source-coverage-strict
handoff-minimal
operator-review-heavy
```

### 수용 기준

```text
same seed/input => same variant
variant는 review aid
variant는 truth/promotion 아님
```

## PR 10.2: `empirical_calibration_dataset_v0_1`

### 전제 데이터

```text
feedback events
candidate lifecycle status
handoff usefulness review
Codex result report review
not-done classification
validation skipped/warning/fail/pass records
```

### row 필드 후보

```text
candidate_id
candidate_family
initial_readiness_label
diagnostic_reason_codes
feedback_events
handoff_used
handoff_outcome
later_review_outcome
calibration_training_allowed: false
```

### 수용 기준

```text
dataset is offline diagnostic
automatic learning/mutation forbidden
training_allowed false by default
privacy guard applied
```

## PR 10.3: `target_agent_ai_context_packet_profiles_v0_1`

### 목적

ChatGPT, Codex, human reviewer, future specialized agent에 따라 packet profile을 다르게 만든다.

### profile 후보

```text
human_review
codex_implementation
codex_pr_review
chatgpt_strategy
research_synthesis
handoff_minimal
boundary_audit
```

### 수용 기준

```text
profile changes compression/section selection only
not authority
not execution approval
not retrieval/provider trigger
```

## PR 10.4: `formal_invariant_checks_narrow_scope_v0_1`

### 목적

Lean/formal proof를 일반 reasoning에 적용하지 않고, route refusal / authority invariant / type-level guard 중심의 좁은 검증에만 쓴다.

### 허용 범위

```text
candidate cannot become proof via route
provider output cannot become evidence
retrieval result cannot promote Perspective state
product write requires reentry gate
Git ref is not authority
```

### 금지

```text
natural language claim theorem proving
automatic proof/evidence generation
automatic promotion
```

---

# 6. 추천 PR 순서 전체 목록

아래는 실제 진행 순서다. 이 순서는 remaining development의 전체 항목을 유지하되, Research/ROI의 P0를 앞으로 당기고 Git Ledger/Product Write를 뒤로 미룬다.

| 순서 | Slice | Phase | 위험도 |
|---:|---|---:|---|
| 1 | `foundation_status_review_and_next_runtime_slice_selection_v0_1` | 0 | 낮음 |
| 2 | `research_candidate_lifecycle_read_model_v0_1` | 1 | 낮음 |
| 3 | `research_candidate_calibration_diagnostic_v0_1` | 1 | 낮음 |
| 4 | `logical_claim_shape_preview_v0_1` | 1 | 낮음 |
| 5 | `feedback_to_rule_candidate_contract_v0_1` | 1 | 중간 |
| 6 | `temporal_handoff_diagnostic_sections_v0_1` | 1 | 낮음 |
| 7 | `research_candidate_review_memory_contract_v0_1` | 2 | 낮음 |
| 8 | `research_candidate_review_memory_store_v0_1` | 2 | 중간 |
| 9 | `research_candidate_review_memory_routes_v0_1` | 2 | 중간 |
| 10 | `research_candidate_review_memory_ui_v0_1` | 2 | 중간 |
| 11 | `foundation_lifecycle_review_memory_readonly_ui_v0_1` | 2 | 중간 |
| 12 | `bounded_source_intake_runtime_contract_v0_1` | 3 | 낮음 |
| 13 | `bounded_source_intake_runtime_v0_1` | 3 | 중간-높음 |
| 14 | `provider_assisted_extraction_candidate_only_contract_v0_1` | 3 | 낮음 |
| 15 | `provider_assisted_extraction_runtime_v0_1` | 3 | 높음 |
| 16 | `research_retrieval_runtime_contract_v0_1` | 3 | 낮음 |
| 17 | `rebuildable_retrieval_index_runtime_v0_1` | 3 | 중간-높음 |
| 18 | `rag_context_preview_v0_1` | 3 | 중간 |
| 19 | `perspective_promotion_runtime_contract_v0_1` | 4 | 중간 |
| 20 | `promotion_decision_store_route_v0_1` | 4 | 높음 |
| 21 | `formation_receipt_durable_write_v0_1` | 4 | 높음 |
| 22 | `durable_perspective_state_apply_v0_1` | 4 | 매우 높음 |
| 23 | `perspective_trajectory_builder_v0_1` | 4 | 중간 |
| 24 | `project_constellation_runtime_layout_contract_v0_1` | 5 | 낮음 |
| 25 | `seeded_constellation_layout_runtime_v0_1` | 5 | 중간 |
| 26 | `constellation_runtime_ui_v0_1` | 5 | 중간-높음 |
| 27 | `layout_persistence_manual_anchors_v0_1` | 5 | 중간 |
| 28 | `feedback_event_aggregation_runtime_v0_1` | 5 | 중간 |
| 29 | `feedback_controls_expansion_v0_1` | 5 | 중간 |
| 30 | `feedback_influenced_surfacing_preview_v0_1` | 5 | 중간 |
| 31 | `dogfooding_record_runtime_contract_v0_1` | 6 | 낮음 |
| 32 | `dogfooding_ingestion_runtime_v0_1` | 6 | 중간 |
| 33 | `authority_boundary_regression_ci_v0_1` | 6 | 중간 |
| 34 | `codex_result_report_ingestion_v0_1` | 6 | 중간 |
| 35 | `temporal_handoff_usefulness_experiment_v0_1` | 6 | 낮음 |
| 36 | `local_data_export_import_policy_v0_1` | 7 | 중간 |
| 37 | `privacy_redaction_runtime_guard_v0_1` | 7 | 중간 |
| 38 | `runtime_audit_panel_v0_1` | 7 | 중간 |
| 39 | `release_readiness_matrix_v0_1` | 7 | 낮음 |
| 40 | `git_ledger_export_contract_v0_1` | 8 | 중간 |
| 41 | `git_ledger_export_deterministic_builder_v0_1` | 8 | 중간 |
| 42 | `git_ledger_export_readonly_preview_v0_1` | 8 | 중간 |
| 43 | `local_git_ledger_export_v0_1` | 8 | 중간-높음 |
| 44 | `github_actuation_contract_v0_1` | 8 | 높음 |
| 45 | `product_write_reentry_review_v0_1` | 9 | 낮음 |
| 46 | `product_write_target_contract_v0_1` | 9 | 중간 |
| 47 | `disabled_product_write_adapter_reentry_harness_v0_1` | 9 | 중간 |
| 48 | `product_write_minimal_runtime_v0_1` | 9 | 매우 높음 |
| 49 | `deterministic_crpf_variant_review_v0_1` | 10 | 중간 |
| 50 | `empirical_calibration_dataset_v0_1` | 10 | 중간 |
| 51 | `target_agent_ai_context_packet_profiles_v0_1` | 10 | 중간 |
| 52 | `formal_invariant_checks_narrow_scope_v0_1` | 10 | 중간 |

---

# 7. 가장 현실적인 다음 10개 PR

실제 다음 작업은 52개를 다 열지 말고 아래 10개만 먼저 진행한다. 사람이 한 번에 52개를 열면 “로드맵”이 아니라 “정신적 DDoS”다.

```text
1. foundation_status_review_and_next_runtime_slice_selection_v0_1
2. research_candidate_lifecycle_read_model_v0_1
3. research_candidate_calibration_diagnostic_v0_1
4. logical_claim_shape_preview_v0_1
5. feedback_to_rule_candidate_contract_v0_1
6. temporal_handoff_diagnostic_sections_v0_1
7. research_candidate_review_memory_contract_v0_1
8. research_candidate_review_memory_store_v0_1
9. research_candidate_review_memory_routes_v0_1
10. research_candidate_review_memory_ui_v0_1
```

---

# 8. Codex 작업 지침

## 8.1 모든 PR body에 포함할 항목

```text
Slice name:
Goal:
Scope:
Expected files:
Expected checks:
Authority boundary:
Forbidden capabilities:
Stop conditions:
Validation commands:
Skipped checks and reason:
Known warnings:
Deferred items:
```

## 8.2 공통 금지

```text
Do not add provider/OpenAI calls unless slice explicitly allows it.
Do not execute retrieval/RAG unless slice explicitly allows it.
Do not add DB migration unless slice explicitly names it.
Do not write proof/evidence records from candidate rails.
Do not promote Perspective state from provider/retrieval/Codex/feedback.
Do not create branch/commit/PR from Augnes runtime.
Do not open product-write or product ID allocation.
Do not treat smoke pass, CI pass, PR body, or Codex result as authority.
```

## 8.3 기본 검증

```text
node --check <new-script>
npm run <new-smoke-script>
npm run typecheck
git diff --check
git diff --cached --check
```

UI PR 추가 검증:

```text
browser validation
390px viewport no-overflow
same-origin request audit
forbidden action absence check
```

Runtime/DB PR 추가 검증:

```text
/tmp DB smoke
caller-injected DB
migration rollback note
idempotency test
forbidden payload refusal
```

Provider PR 추가 검증:

```text
missing-key graceful refusal
mock provider deterministic smoke
live provider optional with skipped reason
no chain-of-thought storage
```

Git Ledger PR 추가 검증:

```text
deterministic packet hash
deterministic idempotency key
raw/private marker rejection
no GitHub API call
no branch/commit/PR creation
```

---

# 9. Acceptance matrix

| 영역 | 성공 기준 | 실패 신호 |
|---|---|---|
| Foundation status | active/closeout/historical/parked/warning-debt 분리 | scaffold 완료를 runtime 완료로 오해 |
| Lifecycle | candidate 상태와 next_review_action 표시 | next_review_action이 실행 권한처럼 보임 |
| Calibration | readiness reason code 존재 | confidence/readiness가 truth/promotion처럼 보임 |
| Logical shape | premise/conclusion/missing assumption 구조 | theorem proof처럼 오해 |
| Feedback-to-rule | feedback이 future rule candidate | feedback이 자동 mutation |
| Review memory | explicit action으로 review record 저장 | preview draft가 durable state처럼 취급 |
| Source intake | user-provided source만 bounded | crawler/background fetch |
| Provider extraction | candidate-only output | provider output이 fact/evidence처럼 저장 |
| Retrieval/RAG | rebuildable non-authoritative recall | retrieval score가 truth score |
| Promotion | human-reviewed decision + receipt | provider/retrieval/Codex가 promotion 시작 |
| Formation Receipt | selected/omitted/deferred 추적 | 왜 상태가 바뀌었는지 설명 불가 |
| Durable state | current/prior thesis, tension/gap 보존 | prior thesis overwrite, tension loss |
| Layout | display-only coordinates | coordinate가 authority로 사용 |
| Feedback surfacing | display priority only | feedback이 truth/promotion |
| Dogfooding | PR/Codex/CI result는 candidate input | CI pass가 proof |
| Operational hardening | export/privacy/audit/release readiness 존재 | runtime write가 추적되지 않음 |
| Git Ledger | public-safe export only | Git ref가 approval/promotion처럼 취급 |
| Product write | explicit reentry 전까지 blocked | product ID/write 조기 개방 |
| Privacy | raw/private IDs canonical 승격 차단 | provider/thread/session/private URL 누수 |
| Audit | write-capable action 추적 가능 | DB에는 있는데 UI에서 설명 불가 |

---

# 10. 계속 금지해야 할 것

```text
automatic source crawling
background fetch
hidden provider calls
hidden chain-of-thought storage
provider output as proof/evidence
provider output as durable Perspective state
RAG as source of truth
retrieval score as truth score
retrieval score as promotion readiness
candidate as proof
evidence_candidate as accepted evidence
perspective_delta_candidate as committed state
feedback as truth
dismiss as deletion
pin as promotion
layout coordinates as authority
salience score as truth
Codex handoff draft as execution approval
CI pass as proof
smoke pass as proof
PR body as authority
Git ref as approval
GitHub branch/commit/PR as Core decision
product write before explicit reentry
product ID allocation before product-write contract
private provider/thread/session IDs as canonical state
raw research strings as operational tags
raw/private data in Git Ledger
```

---

# 11. Definition of Done

이 로드맵이 제대로 진행되고 있다고 보려면 다음이 충족되어야 한다.

```text
1. Candidate lifecycle을 operator가 읽을 수 있다.
2. Confidence/readiness가 truth/promotion처럼 보이지 않는다.
3. Logical claim shape가 review 품질을 올리지만 proof가 되지 않는다.
4. Feedback이 automatic mutation이 아니라 future improvement candidate가 된다.
5. Review memory는 explicit user action으로만 저장된다.
6. Source/provider/retrieval은 candidate-only로 격리된다.
7. Promotion은 human-reviewed decision과 Formation Receipt 없이는 불가능하다.
8. Durable Perspective state는 lineage, prior thesis, tensions, gaps를 보존한다.
9. Layout, salience, feedback surfacing은 display/review aid로만 작동한다.
10. Dogfooding은 PR/Codex/CI를 candidate input으로만 취급한다.
11. Operational hardening이 export/privacy/audit/release readiness를 커버한다.
12. Git Ledger는 public-safe export일 뿐 authority가 아니다.
13. Product write는 reentry review 전까지 계속 blocked다.
```

---

# 12. 문서 운영 정책

권장 repo path:

```text
docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md
```

이 문서는 SSOT가 아니다. 운영 로드맵과 PR sequencing 지침이다. 실제 타입/필드/enum 권위는 해당 slice의 type contract와 SSOT 계층을 따른다.

업데이트 시점:

```text
major repo milestone closeout 이후
product-write reentry decision 전
GitHub actuation contract 전
durable Perspective state apply 구현 전후
release readiness matrix 작성 전후
```

---

# 13. 최종 권고

바로 진행할 개발은 다음이다.

```text
1. foundation_status_review_and_next_runtime_slice_selection_v0_1
2. research_candidate_lifecycle_read_model_v0_1
3. research_candidate_calibration_diagnostic_v0_1
4. logical_claim_shape_preview_v0_1
5. feedback_to_rule_candidate_contract_v0_1
6. temporal_handoff_diagnostic_sections_v0_1
7. research_candidate_review_memory_contract_v0_1
8. research_candidate_review_memory_store_v0_1
9. research_candidate_review_memory_routes_v0_1
10. research_candidate_review_memory_ui_v0_1
```

이후 source/provider/retrieval로 간다. durable promotion/state apply는 그 뒤다. operational hardening은 runtime write가 늘어나기 전후로 끼워 넣는다. Git Ledger는 public-safe export layer로 후반에 둔다. product-write는 마지막이며, explicit reentry 전까지 절대 열지 않는다.

최종 한 문장:

> Augnes의 다음 개발은 자동 지능을 여는 것이 아니라, 검토 가능한 candidate lifecycle, explicit review memory, source-bound context, human-reviewed promotion, audit 가능한 durable state를 순서대로 만드는 일이다.
