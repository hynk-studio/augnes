# Augnes vNext Evaluation and Maturity Framework
## Measuring Continuity, Trust, Review Cost and Actual Outcome Improvement

> **문서 지위:** 기능 성숙도, 완료 주장, 투자·축소·중단 판단 기준
> **버전:** v0.1
> **기준일:** 2026-07-10 KST
> **상위 문서:** `01_AUGNES_VNEXT_MASTERPLAN.md`
> **핵심 원칙:** 기능 존재가 아니라 실제 다음 행동과 판단의 개선을 측정한다.

---

## 0. Evaluation Question

Augnes의 핵심 가설은 다음이다.

> 검토된 temporal context, evidence lineage와 explicit decisions가 다음 작업의 첫 올바른 행동을 앞당기고, 잘못된 문맥과 반복 실패를 줄이며, 사용자 판단의 품질을 높인다.

따라서 평가 대상은 panel 수, table 수, memory item 수, 모델 호출 수나 PR 수가 아니다.

---

## 1. Revised Maturity Ladder

| Level | 이름 | 기준 | 완료로 착각하면 안 되는 것 |
|---:|---|---|---|
| 0 | Intent | 문제와 의미 계약만 존재 | 제품 진척 |
| 1 | Validated Contract | type, validator, positive/negative fixture 존재 | 실제 통합 |
| 2 | Integrated Path | adapter 또는 Core path에 연결 | 실제 사용 |
| 3 | Observed Use | 실제 run·observation·decision data 처리 | 재사용 효과 |
| 4 | Reviewed Reuse | 이후 task/context/decision이 실제로 해당 정보를 사용 | outcome 개선 |
| 5 | Outcome Improvement | 여러 프로젝트에서 측정 가능한 개선 입증 | 장기 moat 자동 인정 |

`Local Durable Record`는 성숙도에 필요할 수 있지만 모든 기능의 필수 독립 단계는 아니다. event나 projection으로 충분한 기능에 table을 강제하지 않는다.

---

## 2. Primary Outcome Metrics

### 2.1 Resume metrics

```text
resume_to_first_correct_action
wrong_context_correction_count
repeated_explanation_tokens
stale_context_injection_count
missing_critical_context_count
context_refs_used_rate
```

### 2.2 Verify metrics

```text
run_receipt_completeness
source_ref_coverage
verified_observation_ratio
host_attestation_without_verification_count
claim_contradiction_detection_rate
dangling_evidence_ref_count
skipped_check_visibility
```

### 2.3 Decide metrics

```text
review_decision_time
decision_debt_count
median_candidate_age
expired_undecided_count
duplicate_proposal_count
ignored_candidate_rate
semantic_transition_traceability
review_reversal_rate
```

### 2.4 Continuity value metrics

```text
accepted_memory_reuse_rate
helpful_context_rate
misleading_context_rate
stale_or_superseded_memory_catch_rate
next_task_context_change_rate
later_outcome_validation_rate
```

---

## 3. Efficiency Metrics

```text
task_start_context_tokens
model_calls_by_role
provider_cost
provider_latency
retry_and_fallback_rate
deterministic_path_ratio
manual_copy_paste_count
duplicate_ui_navigation_count
review_overhead_minutes
validation_wall_time
active_smoke_count
```

효율 지표는 품질 저하와 함께 해석한다. 모델 호출을 줄였다는 이유만으로 context 오류가 늘어나면 개선이 아니다.

---

## 4. Safety and Trust Metrics

목표값이 항상 0이어야 하는 항목:

```text
unauthorized_durable_writes
unapproved_external_actions
secret_egress_incidents
raw_hidden_reasoning_persistence
source_less_accepted_memory
native_permission_as_augnes_approval
cross_project_context_leaks
restore_data_loss
coverage_overclaim_incidents
```

관찰 품질 지표:

```text
receipt_trust_class_completeness
adapter_manifest_coverage
unverified_provider_report_ratio
external_ref_resolution_rate
artifact_hash_verification_rate
```

---

## 5. Product Experiments

### 5.1 비교 조건

최소 네 조건을 비교한다.

```text
A. Native host only
B. Native host + TaskContextPacket
C. Native host + TaskContextPacket + RunReceipt
D. Full Augnes review loop
```

### 5.2 프로젝트 유형

Augnes-on-Augnes 외에 최소 세 프로젝트 유형을 포함한다.

1. 소프트웨어 프로젝트
2. 연구·지식 프로젝트
3. 비코드 장기 기획 프로젝트

가능하면 서로 다른 repository 규모와 기간을 포함한다.

### 5.3 평가 단위

```text
Task
Work Episode
Project Phase
Project Resume Session
Review Decision
Adapter Run
```

### 5.4 데이터 분류

```text
synthetic_fixture
recorded_replay
real_local_observation
verified_external_observation
imported_unverified
```

fixture와 default data를 outcome evidence로 사용하지 않는다.

---

## 6. Context and Memory Evaluation

### 6.1 memory usefulness

memory item마다 가능하면 다음 feedback을 기록한다.

```text
selected_for_task
actually_used
helpful
stale
misleading
missing
noisy
not_applicable
```

### 6.2 forgetting and expiry

```text
TTL
expiry reason
supersession
last useful reuse
last misleading reuse
usage count
re-evaluation date
archive policy
```

### 6.3 stale auto-selection invariant

stale 또는 superseded memory가 warning 없이 자동 선택되는 횟수의 목표는 0이다.

### 6.4 Decision Debt

다음을 별도 health projection으로 보여준다.

```text
pending candidate count
median review wait
expired pending count
duplicate proposals
superseded but active items
repeatedly ignored candidate count
high-risk unresolved decision count
```

Review Queue가 늘어날수록 안전성이 높아진다고 보지 않는다.

---

## 7. Adapter Conformance Evaluation

### 7.1 공통 suite

```text
manifest validation
protocol version negotiation
TaskContextPacket rendering
RunReceipt required fields
trust class correctness
coverage honesty
idempotent duplicate handling
cross-project isolation
secret/raw material refusal
offline outbox recovery
unknown event fallback
```

### 7.2 portability proof

provider-neutral claim의 최소 기준:

- OpenAI reference adapter와 Generic CLI adapter가 같은 Core contract를 사용한다.
- 두 adapter 간 Core schema change가 없다.
- 같은 canonical fixture에 대한 contract conformance가 90% 이상이다.
- provider-specific extension이 common field를 오염시키지 않는다.

### 7.3 adapter trust regression

업데이트 전후 비교:

```text
filesystem scope change
network target change
data egress class change
observed/enforced coverage change
retention behavior change
protocol version change
```

---

## 8. Replay, Simulation and Fault Harness

수백 개의 one-off static smoke를 다음 stateful harness로 점진적으로 통합한다.

```text
Host events
→ Adapter normalization
→ RunReceipt
→ EpisodeDeltaProposal
→ ReviewDecision
→ Transition
→ Projection verification
```

### 8.1 fault cases

```text
duplicate hook event
out-of-order event
missing Stop event
clock skew
same idempotency key replay
host false success report
artifact changed after check
provider timeout
fallback provider
budget cutoff
adapter version drift
stale TaskContextPacket
DB interruption during write
partial backup corruption
external ref unavailable
project scope mismatch
```

### 8.2 test categories

```text
domain tests
protocol tests
invariant tests
adapter conformance
integration tests
replay/fault tests
migration/restore tests
UI behavior tests
live journey tests
```

문구와 파일 존재만 확인하는 smoke는 active invariant를 대체하는 경우에만 유지한다.

---

## 9. Complexity Metrics

PR마다 다음을 기록한다.

```text
new_top_level_concepts
new_persistent_aggregates
new_routes
new_ui_surfaces
new_status_values
new_package_scripts
removed_or_absorbed_concepts
net_complexity_change
```

### complexity guardrails

다음은 자동 중단이 아니라 architecture review trigger다.

- 하나의 bounded slice에서 새 canonical aggregate 2개 초과
- 신규 주요 UI surface 1개 초과
- 새 top-level contract 추가
- 기존 계약 종료·흡수 계획 없음
- 기능마다 전용 smoke command 추가
- 동일 authority 문구 세 곳 이상 복제

---

## 10. Initial Pilot Thresholds

다음 값은 pilot 시작 전 operator가 조정할 수 있는 제안 기준이다.

```text
resume_to_first_correct_action: native-only 대비 20% 이상 개선
context correction task rate: 10% 미만
median review overhead: task당 2분 미만
RunReceipt required field completeness: 99% 이상
manual copy/paste: integrated-first task당 중앙값 0
unclassified remote egress: 0
budget overshoot: 0
cross-adapter conformance: 90% 이상
stale/superseded memory auto-selection: 0
backup/restore loss: 0
vendor-specific required Core fields: 0
```

수치 자체보다 사전에 기준을 정하고 결과에 따라 투자 범위를 바꾸는 규율이 중요하다.

---

## 11. Go / Narrow / Stop Gates

### 11.1 Go

다음이 반복적으로 확인되면 투자를 지속한다.

- resume time 또는 wrong-context correction 감소
- accepted memory의 유용한 재사용
- stale·contradiction 조기 탐지
- review burden보다 큰 재작업 감소
- 두 번째 adapter의 안정적 conformance

### 11.2 Narrow

다음이면 governance/evidence plugin과 Core 중심으로 축소한다.

- continuity와 audit는 유용하지만 Project Home의 Resume 사용, Semantic
  Workbench의 cross-host Verify·Decide 사용 또는 downstream outcome 개선이 낮음
- native host가 실행 UX를 압도적으로 더 잘 제공함
- cross-provider normalization만 지속적으로 가치 있음

Inspector 사용량은 supporting diagnostic일 뿐 단독 Narrow trigger가 아니다.
Home은 Resume outcome, Workbench는 Verify·Decide outcome, Inspector는 유용한
drill-down·provenance·lineage 지원으로 평가하며 raw surface usage보다 실제 outcome
개선을 우선한다.

### 11.3 Stop or rethink

- 25~30개 실제 task에서 resume 품질 개선이 없음
- 사용자 context 수정·거절이 반복됨
- review cost가 예방한 재작업보다 큼
- source/currentness를 유지할 수 없음
- common protocol이 두 번째 adapter에서 무너짐

### 11.4 immediate lane shutdown

- secret leakage
- unauthorized durable write
- unapproved external action
- failed restore rehearsal
- false enforcement claim

---

## 12. Maturity Claim Template

기능 완료를 주장할 때 다음을 작성한다.

```text
Capability:
Maturity before:
Maturity after:
Real inputs used:
Real projects used:
Contracts exercised:
Records or projections produced:
Consumers:
Outcome metric:
Safety result:
Known gaps:
Why the claim is not based only on fixtures/panels/docs:
Next validation:
```

---

## 13. What Does Not Count as Progress

다음은 단독으로 requirement progress가 아니다.

- PR opened
- type exists
- schema exists
- panel renders
- smoke script exists
- no-write boundary exists
- fixture passes
- provider name changed to generic string
- model router returns a provider
- one sample metric
- generated summary with no source
- handoff packet without return path
- RunReceipt without consumer
- Decision preview without actual user decision
- metric that never changes next context

---

## 14. Final Evaluation Rule

Augnes는 다음 질문으로 평가한다.

> **이전 작업에서 남긴 검토된 정보가 다음 작업의 좌표를 실제로 개선했고, 그 효과를 이후 관찰과 결정 계보로 설명할 수 있는가?**

답이 반복적으로 `아니오`라면 기능 수와 기록량에 상관없이 제품 가설을 축소하거나 재설계한다.
