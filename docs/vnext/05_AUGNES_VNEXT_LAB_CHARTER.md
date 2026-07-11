# Augnes vNext Lab Charter
## Non-Authoritative Research, Diagnostics and Experimental Control/View Systems

> **문서 지위:** Augnes Lab 영역의 활성 경계와 연구 규율
> **버전:** v0.1
> **기준일:** 2026-07-10 KST
> **상위 문서:** `01_AUGNES_VNEXT_MASTERPLAN.md`
> **핵심 규칙:** Lab output은 Evidence, Claim truth, approval 또는 semantic commit authority가 아니다.

---

## 0. Purpose

Augnes의 원래 설계에는 Prediction Error, EES, Sidecar, Meta-WM, BSL, CompIndex, loopness, Project Constellation, residual diagnostic와 state-space folding 같은 연구적 요소가 포함돼 있다.

이 요소들은 Augnes의 장기 연구 가치가 될 수 있지만 제품 Core와 섞이면 다음 문제가 생긴다.

- 진단 신호가 Evidence로 오해됨
- 모델 score가 proposal authority로 오해됨
- 실험적 ontology가 DB와 UI를 비대화함
- threshold가 사용자 승인 없이 state를 변경함
- 연구 문서가 active product roadmap을 지배함

Lab Charter는 연구 방향을 보존하면서도 Core의 사실·판단 체계를 오염시키지 않게 한다.

---

## 1. Lab Scope

현재 Lab 범위 후보:

```text
Prediction Error channels
Early Error Signal (EES)
Sidecar e(t)
Meta-WM
Behavioral State Layer (BSL)
Compressibility / CompIndex
loopness / trace pressure
Coalition Stability / regime diagnostics
Project Constellation
Perspective pressure / adversarial critique
Residual Diagnostic
State-space folding hypotheses
Candidate world-model and multimodal experiments
```

이 목록은 연구 backlog이며 모든 항목의 구현을 승인하지 않는다.

---

## 2. Allowed Lab Outputs

Lab은 다음 output을 만들 수 있다.

```text
attention_hint
risk_hint
staleness_hint
review_priority_hint
contradiction_candidate
missing_verification_candidate
personal_perspective_candidate
perspective_gap_candidate
gap_question_projection
prediction_contract_candidate
disagreement_matrix
minority_opinion
contribution_ledger
experiment_metric
regression_metric
next_experiment_suggestion
visualization projection
```

모든 output은 다음 metadata를 가진다.

```text
lab_output_version
experiment_id
project_id when genuinely project-scoped; do not invent a personal project ID
input refs
method/version
computed_at
limitations
non_authority_boundary
```

---

## 3. Prohibited Authority

Lab output은 다음으로 사용하지 않는다.

```text
Evidence creation
Claim truth assignment
accepted memory creation
automatic proposal scoring authority
automatic ReviewDecision
semantic state commit
Perspective apply
publication readiness
work closure
external actuation
GitHub merge decision
identity or personality truth assignment
automatic Personal Perspective application
automatic cross-project reuse
hidden task-context injection
automatic Perspective Actor promotion
evolutionary fitness-based selection
```

Lab output을 Core decision basis로 참고할 수는 있지만, 반드시 별도 source·evidence·user judgment와 함께 review한다.

---

## 4. Core Interface

### 4.1 Lab reads

Lab은 명시적 bounded projection을 통해 다음을 읽을 수 있다.

```text
already-read event refs
RunReceipt summaries
Claim relations
open tensions/gaps
Perspective projection
selected artifacts
approved experiment fixtures
```

raw private content, hidden reasoning와 secret은 기본 input이 아니다.

### 4.2 Lab writes

Lab은 Core canonical tables에 직접 쓰지 않는다.

허용되는 저장 방식:

```text
lab experiment record
lab metric record
lab artifact ref
non-authoritative diagnostic event
rebuildable projection
```

### 4.3 promotion boundary

Lab 발견을 제품 기능으로 승격하려면 다음 절차를 거친다.

```text
repeated experiment result
→ source and failure analysis
→ deterministic definition
→ product hypothesis
→ architecture review
→ bounded implementation
→ external-project evaluation
→ separate user/operator decision
```

---

## 5. Experimental Method

각 experiment는 다음을 정의한다.

```text
Question
Hypothesis
Inputs
Excluded inputs
Method
Baseline
Counterexample
Expected signal
Failure criteria
Authority boundary
Retention
Reproduction steps
Productization gate
```

한 번의 모델 실패나 흥미로운 시각화만으로 residual bottleneck이나 state-space structure를 주장하지 않는다.

---

## 6. Specific Domain Boundaries

### 6.1 Prediction Error

PE 채널은 가능하면 분리한다.

```text
PE_lm
PE_tool
PE_goal
PE_memory
```

PE는 internal control/diagnostic이며 Evidence가 아니다.

### 6.2 EES

EES는 “나중에 틀릴 가능성”을 예측하는 early signal이다.

허용:

```text
review priority
VERIFY/RETRIEVE/ASK recommendation
experiment logging
```

금지:

```text
Claim confidence
Evidence status
automatic rejection
```

### 6.3 Sidecar / Meta-WM / BSL / CompIndex

이들은 runtime control/view 또는 Lab diagnostic이다. 값이 계산되더라도 Core state나 proposal authority를 얻지 않는다.

### 6.4 loopness

loopness는 trace pressure hint다. 반복 작업이 존재한다는 사실을 보여줄 수 있지만, 나쁜 loop인지 좋은 learning loop인지 자동 결정하지 않는다.

### 6.5 Project Constellation

Constellation은 explanation과 navigation view다. graph layout과 node salience는 source of truth가 아니다.

### 6.6 Residual Diagnostic

Residual candidate가 유효하려면 최소한 다음이 필요하다.

```text
repeated evidence
false-leap contrast
ignored or missing evidence analysis
minimum verification candidate
next experiment count reduction hypothesis
```

한 번 실패한 강한 모델을 “frontier bottleneck”으로 부르지 않는다.

### 6.7 State-space Folding

state-space folding은 장기 연구 가설이다.

제품화 조건:

- 실제 반복 사례
- coordinate change가 다음 실험을 줄임
- deterministic 또는 reproducible representation
- 사용자 판단을 돕는 명확한 output
- graph/ontology 비용보다 큰 실용 가치

### 6.8 Personal Perspective, Gap, and Structured Review R&D

Personal Perspective Lab output은 user identity나 personality truth가 아니라 candidate다.
Gap output은 Personal, Project, task와 structured review가 공유하는 기존 tension/gap
semantics를 사용하며 Arena-specific canonical gap ontology를 만들지 않는다.

초기 structured review는 disagreement, prediction과 minority contribution을 replay하는
bounded experiment다. persistent Perspective Actors, mutation, branching, merging,
resource bidding와 automatic population selection은 repeated outcome evidence 이후의
후반 가설이다. Arena output은 Personal Perspective를 직접 mutate하거나 task context에
inject하지 않는다.

---

## 7. Data and Privacy

- Lab data는 project scope를 기본으로 한다. 실제 workspace-level personal experiment는
  explicit opt-in과 별도 retention boundary가 필요하며 fake project ID를 사용하지 않는다.
- personal identity·affect·personality·preference 추론은 Personal Vault candidate 또는
  ephemeral Lab record로 분리하고 accepted user identity로 취급하지 않는다.
- raw transcript 자동 수집 금지
- multimodal raw artifact bulk storage 금지
- model provider 호출은 Model Gateway를 통과
- experiment artifact에는 retention과 deletion policy 필요
- local model도 privacy 특성을 검증하기 전에는 private로 표시하지 않음

---

## 8. Evaluation

Lab은 accuracy보다 다음을 우선 평가한다.

```text
재현성
source traceability
false positive rate
review burden
next experiment reduction
stale/contradiction detection
Core outcome improvement
```

좋은 Lab feature는 설명을 멋지게 만드는 것이 아니라 다음 행동과 검증을 더 작고 정확하게 만든다.

---

## 9. Productization Gates

Lab 기능이 Core, Product Surface, Inspector 또는 Personal Vault의 기본 기능이 되려면
다음을 모두 만족해야 한다.

1. 최소 두 project에서 반복적으로 유용함
2. output 의미를 deterministic하게 정의 가능
3. source refs와 limitations가 명시됨
4. false positive와 review cost가 허용 범위
5. Core authority를 요구하지 않음
6. user/operator가 output을 이해하고 행동을 바꿀 수 있음
7. 기존 projection에 흡수 가능하거나 새 surface의 필요성이 입증됨
8. rollback과 disable switch 존재

---

## 10. Kill and Archive Criteria

다음이면 experiment를 종료하거나 archive한다.

- 결과 재현 실패
- source 없는 해석 반복
- 실제 행동 개선 없음
- review burden 과다
- 기존 metric과 중복
- Core authority 침범 요구
- privacy risk가 가치보다 큼
- ontology/visualization 유지비가 실험 가치보다 큼

종료한 experiment의 기록은 historical Lab artifact로 보존할 수 있지만 active roadmap에서 제거한다.

---

## 11. Lab Roadmap Posture

우선순위:

```text
1. 기존 placeholder와 authority boundary 정리
2. replay 가능한 offline fixtures
3. Personal Perspective semantic casebook과 deterministic gap baseline
4. 실제 RunReceipt 기반 diagnostics
5. external-project evaluation
6. productization candidate review
```

후순위:

```text
world-model graph
multimodal state model
multi-agent perspective federation
automatic routing/control
```

Lab이 Core의 제품 완성을 지연시키지 않게 한다.
