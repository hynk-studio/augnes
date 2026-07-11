# Augnes Personal Perspective R&D Program v0.1
## User-Owned Self-and-World Continuity, Gap Management, and Structured Review

> **문서 지위:** active vNext set 하위의 조건부 R&D program
> **버전:** v0.1
> **기준일:** 2026-07-11 KST
> **상위 권위:** `01_AUGNES_VNEXT_MASTERPLAN.md`, `02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`, `03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`, `04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`, `05_AUGNES_VNEXT_LAB_CHARTER.md`
> **읽기 조건:** Personal Perspective, Personal Vault, Perspective Gap Management, structured multi-perspective review 또는 Perspective Arena 관련 작업
> **핵심 경계:** 이 문서는 제품 Masterplan, schema, persistence 승인, task-context 주입 권한 또는 구현 완료 주장이 아니다.

---

## 0. Program Decision

Augnes는 장기 연구 방향으로 사용자 소유 `Personal Perspective` layer를 연구한다.
Personal Perspective는 preference table이나 decision-rule 목록이 아니라, 사용자가
자신과 세계, 목표와 반복 선택을 이해하는 장기적이고 수정 가능한 self-and-world
model이다.

이 프로그램은 세 R&D track을 하나로 조정한다.

```text
1. Personal Perspective
2. Perspective Gap Management
3. Structured Multi-Perspective Review
```

이 세 track은 candidate, gap, source, counterexample, review와 outcome이라는 공통
규율을 사용한다. Perspective Arena의 persistent actors, evolutionary competition과
automatic population selection은 이 프로그램의 후반 연구 가설이지 승인된 단기
제품 작업이 아니다.

현재 Augnes의 기본 제품은 project-centered provider-neutral temporal substrate로
유지된다. Personal Perspective 연구는 이를 대체하거나 M3 closed loop의 우선순위를
낮추지 않는다.

---

## 1. Design Inputs and Authority

이 프로그램은 다음 초기 제안을 design input으로 종합한다.

- Personal Perspective R&D proposal
- `AUGNES_PERSPECTIVE_GAP_FILLING_PROPOSAL.md`
- `AUGNES_PERSPECTIVE_ARENA_EVOLUTIONARY_COMPETITION_PROPOSAL_2026-07-11.md`

이 제안들은 repository authority가 아니다. 채택·수정·보류된 의미는 본 문서와 상위
active vNext 문서에 다시 명시된 범위에서만 현재 연구 방향이 된다.

채택:

- identity와 personality를 제외하지 않고 revisable self-understanding으로 연구
- 사용자 질문을 통한 perspective gap 보완
- 관점 간 disagreement, minority view와 prediction 비교
- source, counterexample, revision과 outcome lineage

수정하여 채택:

- Arena-specific gap을 만들지 않고 공통 Perspective Gap Management를 사용
- 독립 actor population보다 bounded structured review부터 검증
- fitness보다 사용자 판단과 downstream outcome을 우선

보류:

- persistent Perspective Actors
- mutation, branching와 merging
- real-time competition과 resource bidding
- automatic fitness-based promotion 또는 population selection

---

## 2. Personal Perspective Semantic Scope

Personal Perspective가 다룰 수 있는 범위:

```text
self-concept and identity
personality, disposition and recurring behavioral patterns
values and commitments
world models
aspirational identity
decision principles
relationship models when explicitly in scope
persistent tensions and unresolved conflicts
supporting observations and examples
counterexamples, revisions, exceptions and scope limits
```

### 2.1 Identity and personality posture

Identity와 personality는 제거 대상이 아니다. 장기 선택과 목표 해석에는 “나는 어떤
사람인가”, “어떤 사람이 되고 싶은가”, “어떤 조건에서 평소 패턴이 깨지는가”가 실제로
영향을 준다. 이를 모두 decision rule로 평탄화하면 다음을 잃는다.

- 현재 self-concept와 aspirational identity의 차이
- 같은 value가 상황에 따라 충돌하는 방식
- 관계와 역할에 따른 반복 패턴
- 예외와 counterexample이 기존 해석을 수정하는 과정
- 사용자가 자기 삶을 설명하는 언어와 의미

그러나 personality label, model score나 반복 행동 inference를 고정 essence로 취급하지
않는다. Personal Perspective는 user-owned, revisable, source-backed self-understanding이며
심리 진단이나 숨은 profile authority가 아니다.

### 2.2 내부 다양성

Personal Perspective는 하나의 완벽히 일관된 persona를 강제하지 않는다.

```text
descriptive self-understanding
aspirational identity
stable commitment
contextual role
unresolved tension
known exception
contested interpretation
```

은 서로 다른 상태로 공존할 수 있다. tension과 counterexample은 정리 실패가 아니라
first-class review material이다.

---

## 3. Epistemic and Authority Boundaries

기존 vNext 불변식을 그대로 적용한다.

```text
Candidate ≠ Decision
Decision ≠ Transition
Context ≠ Truth
Lab Diagnostic ≠ Evidence

Model Inference ≠ User Identity
Task Choice ≠ Global Identity Update
Personal Perspective ≠ Project Truth
Lower-Scope Override ≠ Higher-Scope Rewrite
Arena Output ≠ Personal Perspective Mutation
```

### 3.1 Epistemic status

- user declaration은 명시적 source가 될 수 있지만 scope와 revision 가능성을 보존한다.
- model inference는 항상 derived candidate이며 accepted identity가 아니다.
- 행동 관찰은 observation일 수 있지만 그 행동의 personality 의미는 candidate다.
- 한 task 선택은 global identity를 증명하지 않는다.
- supporting example과 counterexample을 모두 연결할 수 있어야 한다.
- contested, stale, inferred 또는 retracted item은 accepted item처럼 표시하지 않는다.

### 3.2 User control

실제 Personal Perspective 기능을 논의하려면 최소한 다음 사용권이 필요하다.

```text
review
edit
narrow scope
add exception
add counterexample
defer
retract
delete
inspect source and revision lineage
control project sharing
control task-context inclusion
```

이 문서는 그 기능의 persistence나 UI를 승인하지 않는다.

---

## 4. Scope and Architecture Boundaries

### 4.1 Project Core

Project Core는 계속 project-scoped state, Evidence, Claims, work/runs, Decisions,
Project Perspective와 reviewed project memory를 소유한다. Personal Perspective를
project state에 숨겨 저장하지 않는다.

### 4.2 Opt-in Personal Vault candidate

Personal Vault는 workspace-level personal continuity를 위한 미래 opt-in 경계 후보다.
Personal Perspective persistence가 필요하다면 이 경계에서 별도 architecture
decision을 거쳐야 한다.

```text
Personal Vault candidate ≠ implemented Personal Vault
Personal Perspective candidate ≠ durable personal state
```

`project:user`, `project:personal`, `project:global` 같은 fake project로 workspace-level
personal continuity를 표현하지 않는다.

### 4.3 Perspective layers

```text
Personal Perspective
= opt-in, cross-project self-and-world continuity candidate

Project Perspective
= one project's accepted claims, goals, tensions and reviewed interpretation

Current Working Perspective
= current project/task-start projection

TaskContextPacket selection
= bounded task-relevant context chosen for one execution
```

Personal Perspective는 Project Perspective나 Current Working Perspective를 자동
덮어쓰지 않는다. Project-specific constraints와 lower-scope choices는 Personal
Perspective에 counterexample, tension 또는 revision candidate를 제안할 수 있지만
higher-scope identity를 자동 변경하지 않는다.

### 4.4 Selective sharing and task relevance

Personal Perspective는 모든 task에 자동 관련되지 않는다. 미래 context selection은
최소한 다음을 검토해야 한다.

- task relevance와 expected utility
- item scope와 freshness
- accepted, contested, inferred, retracted status
- sharing consent와 project boundary
- data classification와 remote egress policy
- why included, excluded refs와 reuse boundary

contested 또는 model-inferred personal material을 task context에 silently inject하지
않는다. accepted item도 relevance와 sharing rule 없이 자동 선택하지 않는다.

### 4.5 Required future architecture decision

Personal Vault productization 전에 별도 decision record가 다음을 결정해야 한다.

```text
workspace-scoped proposal identity
review and authorization semantics
Decision versus Transition boundary
retention, expiry, retraction and deletion
source and counterexample lineage
selective per-project sharing
task-context inclusion and exclusion
remote egress and consent
backup, restore and recovery
cross-project leakage tests
```

이 PR은 canonical persistence contract, DB table, API, state-transition protocol 또는
TaskContextPacket field를 승인하지 않는다.

---

## 5. Track A: Personal Perspective

### Research questions

1. 사용자가 candidate를 자기 이해로 endorse, correct, narrow 또는 reject할 수 있는가?
2. identity, disposition, values와 aspiration을 fixed profile 없이 표현할 수 있는가?
3. supporting evidence와 counterexample이 함께 있을 때 review 품질이 좋아지는가?
4. lower-scope exception이 higher-scope rewrite 없이 보존되는가?
5. 선택된 personal context가 반복 설명을 줄이고 다음 행동을 개선하는가?

### Initial method

- synthetic casebook으로 descriptive/aspirational/tension/exception 사례를 정의
- source와 counterexample이 없는 candidate를 거부
- candidate review를 recorded replay로 비교
- 실제 사용자 material은 명시적 opt-in 전까지 사용하지 않음
- persistence 없이 bounded relevance와 context-selection 효과를 먼저 측정

---

## 6. Track B: Perspective Gap Management

Perspective Gap Management는 다음 범위가 공유하는 하나의 gap mechanism 연구다.

```text
Personal Perspective
Project Perspective
task perspective and context selection
Structured Multi-Perspective Review
future Arena experiments
```

Arena evidence gap이나 unresolved question이 별도 canonical ontology를 만들지 않는다.
기존 tension, knowledge gap, contradiction와 missing semantics를 우선 재사용한다.

### 6.1 Gap candidates

연구 대상 예시:

- claim을 지지하거나 반박할 source 부족
- supporting example만 있고 counterexample 탐색이 없음
- descriptive identity와 aspirational identity 충돌
- scope가 global인지 project/role/task-specific인지 불명확
- stale item 또는 retraction 이후의 빈자리
- task 성공에 필요한 전제와 현재 context 사이의 deterministic gap
- structured review에서 드러난 unresolved disagreement

이들은 gap candidate 또는 question projection이지 truth나 mandatory question이 아니다.

### 6.2 Question policy

좋은 gap question은 다음을 만족한다.

```text
actionable
scope-specific
source-linked
non-duplicative
answerable without leading the user
likely to change review or context selection
easy to defer, suppress or retire
```

질문 생성량이 진척이 아니다. false premise를 거부하고, 이미 답한 질문을 반복하지
않으며, 답이 실제 candidate revision이나 context change로 이어지는지를 측정한다.

### 6.3 Deterministic baseline first

모델 기반 gap discovery 전에 deterministic task-gap baseline을 만든다.

```text
required task premise
versus selected context/source
→ missing, stale, contradictory or scope-mismatched candidate
```

이 baseline은 Personal Perspective를 읽거나 저장할 권한을 만들지 않는다.

---

## 7. Track C: Structured Multi-Perspective Review

초기 목표는 여러 persistent agent persona를 운영하는 것이 아니라 하나의 문제에 대한
구조적 차이를 reviewable하게 만드는 것이다.

허용되는 초기 연구 output:

```text
prediction_contract_candidate
disagreement_matrix
minority_opinion
contribution_ledger
perspective_gap_candidate
```

각 output은 source, assumptions, scope, limitations와 non-authority boundary를 가져야
한다. 모델 agreement는 verification이 아니고 minority opinion도 truth가 아니다.

### 7.1 Initial trials

- 동일 source packet에 대한 서로 다른 decomposition 또는 value-axis review
- 예상 결과를 먼저 명시한 prediction contract candidate
- disagreement가 Evidence, Claim, scope 또는 value 차이 중 어디서 생기는지 분해
- 단일 강한 review 대비 structural diversity와 compute-adjusted gain 비교
- useful minority view가 다음 check나 decision을 실제로 바꾸는지 추적

### 7.2 Arena hypotheses deferred

다음은 repeated outcome evidence 이후에만 검토한다.

```text
persistent Perspective Actors
long-lived actor identity and memory
evolutionary fitness
mutation, branching and merging
real-time competition
resource bidding
automatic population selection
automatic actor promotion
```

Arena output은 Personal Perspective candidate나 gap을 제안할 수 있지만 직접
Personal Perspective를 mutate, apply, promote 또는 task context에 inject할 수 없다.

---

## 8. Dependency-Based Research Sequence

```text
1. semantic model and synthetic casebook
2. deterministic task-gap baseline
3. Personal Perspective review replay
4. bounded relevance and context-selection experiment
5. Personal Vault persistence architecture decision
6. structured multi-perspective review trials
7. lineage/evolutionary research after repeated outcome evidence
```

offline Lab work는 M3와 병렬로 진행할 수 있다. 그러나 Core integration, durable
Personal Perspective transition과 task-context injection은 다음이 검증되기 전에는
진행하지 않는다.

```text
actual authorized transition
→ later TaskContextPacket selection change
→ later RunReceipt outcome validation
```

---

## 9. Program Maturity

기존 vNext Level 0~5 ladder를 다음처럼 적용한다.

| Level | Program evidence | 완료로 오인하지 않을 것 |
|---:|---|---|
| 0 Intent | 의미 경계와 research questions | Personal Perspective 존재 |
| 1 Validated Contract | synthetic casebook, deterministic definitions, negative cases | persistence 또는 user endorsement |
| 2 Integrated Path | offline replay에서 candidate→gap→review 연결 | production context use |
| 3 Observed Use | 명시적 opt-in 사용자 review와 correction 관찰 | cross-project usefulness |
| 4 Reviewed Reuse | 선택된 item이 later context/decision을 바꾸고 user가 검토 | outcome improvement |
| 5 Outcome Improvement | 여러 project에서 반복 설명·오판 감소와 decision 개선 | automatic productization |

구체 metric, zero-tolerance failure와 go/narrow/stop 기준은
`../04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`가 최종 평가 권위를 가진다.

---

## 10. Privacy, Retention, and Deletion

- 실제 personal material은 명시적 opt-in 없이 수집하지 않는다.
- raw transcript를 personality extraction source로 자동 수집하지 않는다.
- restricted material은 required policy와 consent 없이 remote provider에 보내지 않는다.
- local model도 privacy가 검증되기 전에는 private로 간주하지 않는다.
- deletion과 retraction은 reuse와 derived projection에서 함께 집행되어야 한다.
- project sharing은 item/scope 단위로 선택 가능해야 한다.
- source를 잃거나 철회하면 dependent candidate를 stale 또는 invalid로 다뤄야 한다.
- hidden personal profile, undeclared embedding index 또는 background inference store를 만들지 않는다.

---

## 11. Productization Gates

어떤 track도 다음을 통과하기 전에는 Core 또는 default product behavior가 아니다.

1. reproducible synthetic와 replay evidence
2. user endorsement/correction workflow의 usability
3. counterexample와 scope narrowing 보존
4. low misleading-context와 acceptable review burden
5. explicit architecture decision for persistence and deletion
6. cross-project isolation와 selective sharing tests
7. bounded context inclusion with visible rationale
8. later outcome evidence
9. separate implementation PR와 user/operator decision

Arena 계열은 위 조건에 더해 structural diversity와 compute-adjusted gain이 단순
prompt ensemble보다 반복적으로 높아야 한다.

---

## 12. Explicit Non-Goals

본 프로그램 등록 PR은 다음을 추가하거나 승인하지 않는다.

- runtime code 또는 production TypeScript contract
- DB schema, migration, table 또는 durable record
- API route, MCP/App tool, UI, panel 또는 package smoke command
- TaskContextPacket runtime field
- automatic extraction, persistence 또는 context injection
- model/provider call
- Personal Vault implementation
- Perspective Arena implementation
- automatic semantic transition
- identity/personality truth assignment
- automatic cross-project reuse
- current M3 priority 변경
- provider-neutral Core authority 변경

---

## 13. Immediate Next Bounded Research Slice

다음 권장 slice는 `Personal Perspective Semantic Casebook v0.1`이다.

범위:

- synthetic 사례만 사용
- self-concept, aspiration, tension, exception, supporting example과 counterexample 포함
- false-premise, over-globalization, hidden inference와 deleted/retracted reuse negative case
- deterministic gap baseline의 expected input/output 의미 정의
- user review replay protocol과 metric baseline

비범위:

- persistence
- 실제 사용자 profile ingestion
- provider/model call
- Core contract 또는 TaskContextPacket 변경
- UI와 Arena actor

이 slice는 Lab Level 1 evidence를 준비할 뿐 Personal Perspective product maturity를
올렸다고 주장하지 않는다.
