# Augnes vNext Transition Roadmap
## From the Current Repo to a Provider-Neutral Temporal Core with an OpenAI-Integrated Default

> **문서 지위:** 활성 전환 및 구현 로드맵
> **버전:** v0.1
> **기준일:** 2026-07-11 KST
> **상위 문서:** `01_AUGNES_VNEXT_MASTERPLAN.md`, `02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`
> **변경 성격:** repo 상태와 PR 진행에 따라 자주 갱신
> **중요:** 이 문서는 big-bang rewrite를 승인하지 않는다.

---

## 0. Transition Objective

현재 Augnes 저장소에는 이미 많은 계약, route, writer, readback, panel과 smoke가 존재한다. 문제는 기능이 없어서가 아니라, 공급자·surface·workflow 단계에 따라 의미가 분산되고 실제 다음 작업의 품질을 개선하는 폐쇄루프가 복잡한 중간 레코드에 묻혀 있다는 데 있다.

전환의 목표는 기존 자산을 폐기하는 것이 아니다.

```text
현재 구현과 기록을 보존한다.
→ provider-neutral 계약으로 읽는다.
→ 신규 정상 경로는 vNext 계약을 사용한다.
→ native host UX를 재사용한다.
→ 실제 outcome이 다음 context와 Perspective를 바꾸는 루프를 닫는다.
→ 사용되지 않는 legacy writer와 surface를 순차적으로 freeze한다.
```

---

## 1. Transition Principles

1. Big-bang migration 금지
2. 기존 DB와 ID 삭제 금지
3. dual authoritative write 금지
4. compatibility projection 우선
5. 신규 정상 path는 vNext 계약 사용
6. OpenAI adapter를 reference implementation으로 사용
7. Generic CLI adapter로 중립성 검증
8. native task/diff/terminal/browser/scheduler UX 재구현 금지
9. 실제 vertical slice와 behavior test 우선
10. schema 변경 전 recovery backup과 restore rehearsal 필수

---

## 2. Immediate Freeze

vNext foundation이 생길 때까지 다음 신규 개발을 기본적으로 동결한다.

```text
새 Workplane 패널
새 workflow-stage 전용 table
새 Codex-only Core contract
새 manual handoff/copy UI
새 자체 scheduler
새 passive readback surface
기능별 장문 authority copy 복제
기능별 package smoke command 증식
자동 Model Router
대규모 Autohunt 확장
```

여기서 `새 Workplane 패널` 동결은 workflow-stage별 panel, native execution UI
replica, record가 존재한다는 이유만으로 추가하는 passive readback, 기능별
panel/table/smoke 증식을 금지한다는 뜻이다. Project Home이나 Semantic
Workbench의 개선, Resume·Verify·Decide를 실질적으로 개선하는 공통 interaction,
projection composition 또는 cross-host review experience까지 금지하지 않는다.

새 interaction은 다음을 모두 만족할 때만 허용한다.

- Resume, Verify 또는 Decide를 실질적으로 개선한다.
- 기존 또는 vNext canonical record를 조합한다.
- native host UX를 복제하지 않는다.
- authority boundary가 명확하다.
- UI 편의를 위해 새 workflow-stage canonical concept를 만들지 않는다.

예외는 다음과 같다.

- 심각한 버그·보안·복구 문제
- vNext 전환을 직접 가능하게 하는 compatibility change
- 실제 active invariant를 보존하는 최소 수정

---

## 3. Current Asset Classification

모든 현재 기능과 문서는 다음 중 하나로 분류한다.

```text
active_core
active_projection
reference_adapter
compatibility
historical
lab
retire_candidate
forbidden
```

분류 record는 다음을 포함한다.

```text
capability
current owner
current source of truth
current consumers
write behavior
maturity level
vNext destination
compatibility deadline
removal prerequisites
```

---

## 4. Strategic Workstreams

### Workstream A: Product and Document Authority Reset

#### 목표

- vNext Masterplan을 유일한 active north star로 설정
- 원본 마스터플랜과 repo-aligned v2를 historical/reference로 표시
- README, current status, authority vocabulary와 onboarding을 정렬
- stale Cockpit·Workplane·Codex-only planning language 제거

#### 완료 조건

- 새 작업이 `Native / Adapter / Core / Projection / Lab` 중 하나로 분류됨
- current docs가 OpenAI-first와 provider-neutral Core를 동시에 설명함
- historical docs가 active sequencing authority로 인용되지 않음

---

### Workstream B: Protocol Foundation

#### 목표

다음 contract의 type, pure builder, validator, fixtures와 negative fixtures를 만든다.

```text
TaskContextPacket
RunReceipt
EpisodeDeltaProposal
ReviewDecision
ExternalRef
CapabilityManifest / CapabilityGrant
```

#### 제한

- 첫 foundation slice에서 DB migration 금지
- provider call 금지
- 새 UI 금지
- durable write 금지

#### 완료 조건

- OpenAI-specific 필수 field 없이 계약을 설명할 수 있음
- 기존 Work Brief/Handoff/Result data를 read-only compatibility adapter로 변환 가능
- protocol conformance test가 존재

---

### Workstream C: Multi-Project Identity and Isolation

#### 목표

`project:augnes` hardcoding을 제거하고 project identity를 Core의 일급 개념으로 만든다.

#### 범위

- WorkspaceIdentity / ProjectIdentity
- ProjectRootRef / RepositoryRef
- project-scoped external refs
- context selection isolation
- project-scoped export/backup tests

#### 완료 조건

- 두 개의 local project fixture가 state, evidence, memory, grant와 run을 교차 누출하지 않음
- 같은 repository ref를 두 project에서 독립적으로 사용할 수 있음
- 기존 `project:augnes` 데이터가 compatibility project로 읽힘

---

### Workstream D: Model Gateway and OpenAI Direct-Call Consolidation

#### 목표

현재 planner, observe compiler, temporal interpretation 등 직접 OpenAI 호출을 공통 Model Gateway 뒤로 옮긴다.

#### 단계

1. direct-call inventory
2. 공통 invocation envelope와 egress policy
3. OpenAI adapter wrapper
4. usage/cost/latency/failure receipt
5. zero-model fallback 유지
6. direct bypass 감지 test

#### 완료 조건

- 모든 신규 remote model call은 Gateway를 통과함
- legacy direct call은 명시적 compatibility warning 또는 제거 상태
- project/data classification/retention/provenance가 기록됨

---

### Workstream E: OpenAI Reference Host Adapter

#### 목표

기존 `apps/augnes_apps`, plugin, MCP와 hooks를 OpenAI host adapter로 재정의한다.

#### 역할

- task-start TaskContextPacket 제공
- native task/session/run refs를 ExternalRef로 정규화
- SessionStart/Stop 및 관찰 가능한 lifecycle에서 bounded receipt 생성
- compact review card 제공
- Core authority를 우회하지 않음

#### 제한

- raw transcript 자동 수집 금지
- native permission을 Augnes approval로 해석 금지
- 모든 native action을 enforce한다고 주장 금지

#### 완료 조건

- 수동 handoff 없이 하나의 실제 task가 context를 받고 receipt를 반환
- coverage matrix가 정확히 표시됨
- unauthorized durable write가 없음

---

### Workstream F: RunReceipt → Delta → Decision Vertical Loop

#### 목표

기존 WorkEpisode/EOD/Reuse/Dogfood 의미를 네 개의 보편 계약으로 압축한 실제 폐쇄루프를 만든다.

```text
TaskContextPacket
→ native execution
→ RunReceipt
→ EpisodeDeltaProposal
→ ReviewDecision
```

#### 기존 자산 재사용

- Codex Result Report Intake
- WorkEpisode residue
- ExpectedObservedDelta
- Reuse Outcome Bridge
- Dogfood metrics
- CWP update scaffolding

#### 중요한 결정

이들을 모두 별도 신규 canonical table로 다시 만들지 않는다. Run, events, deltas, feedback와 projection으로 표현할 수 있는지를 먼저 검토한다.

#### 완료 조건

- real run receipt가 생성됨
- observation과 model interpretation이 분리됨
- delta proposal이 review 가능함
- decision이 transition과 분리됨
- 다음 TaskContextPacket의 선택이 실제로 변함
- later receipt에서 유용성을 확인할 수 있음

---

### Workstream G: Generic CLI Adapter

#### 목표

provider-neutral architecture를 문서가 아니라 두 번째 실제 adapter로 검증한다.

#### 기능

- stdin/stdout JSON
- file inbox/outbox
- HTTP callback optional
- context render
- receipt normalization
- conformance fixtures

#### 완료 조건

- 같은 TaskContextPacket과 RunReceipt contract를 OpenAI adapter와 공유
- Core schema 변경 없이 동작
- provider-specific extension은 optional namespace로 격리

---

### Workstream H: Surface Specialization and Inspector Composition

#### 목표

Blank State를 Project Home으로 진화시키고 Agent Workplane을 Semantic
Workbench로 전문화한다. Inspector는 두 surface가 함께 쓰는 drill-down과
lineage explorer로 구성한다. duplicate native execution UX와 passive readback은
projection composition으로 정리하되, replacement parity가 입증될 때까지 현재의
유용한 behavior를 보존한다.

```text
Blank State → Augnes Project Home
Agent Workplane → Augnes Semantic Workbench
Inspector → shared detail, audit and lineage exploration
```

#### 원칙

- native execution UI를 복제하지 않음
- surface specialization이지 surface elimination이 아님
- Home은 인간 front door로 유지
- Workbench는 active cross-host semantic work surface로 유지
- Inspector는 shared detail explorer이며 sole front door가 아님
- 기존 route는 explicit removal gate가 통과할 때까지 compatibility alias로 유지 가능
- 새 workflow-stage panel보다 projection composition과 drill-down 우선
- 긴 authority copy 대신 현재 decision에 필요한 이유 표시
- `absorb`라는 말 아래 useful capability를 제거하지 않음

#### 완료 조건

- Project Home이 Workbench navigation 없이 current state, attention, pending
  decisions와 next moves를 전달함
- Semantic Workbench가 단일 native host가 canonical project semantics로
  소유하지 않는 실제 compare/verify/propose/decide flow 하나 이상을 지원함
- Project Home과 Workbench 모두 source lineage를 보존한 Inspector drill-down을 엶
- duplicate native execution UI를 확장하지 않음
- 기존 Blank State와 Workplane의 useful capability에 문서화된 destination이 있음
- route나 capability retirement 전에 parity, usage와 migration evidence가 존재함
- current route는 transition 동안 compatibility alias로 유지 가능함

---

### Workstream I: Autohunt → AutomationPolicy

#### 목표

Autohunt의 안전성 개념을 유지하되 자체 scheduler·launcher 중심 구조를 정책과 native execution refs로 전환한다.

#### mapping

```text
autonomy_delegation_grants
→ Grant

autohunt_work_queue_candidates
→ WorkProposal / Delta

preflight/readiness
→ PolicyEvaluationEvent / Projection

execution contract
→ RunEnvelope / AutomationPolicy application

daily launcher run
→ Run

result intake
→ RunReceipt + feedback/delta
```

#### 제한

- 기존 Autohunt data 삭제 금지
- 새로운 단계별 table 추가 금지
- semantic commit 자동화 금지

#### 완료 조건

- OpenAI Scheduled Tasks 또는 generic scheduler ref가 ExternalRef로 연결
- 동일 AutomationPolicy가 최소 두 scheduler profile에 mapping 가능
- result receipt가 반드시 돌아옴

---

### Workstream J: Legacy Storage and Migration

#### 목표

기존 table과 record를 보존하면서 신규 write path를 안정적인 aggregate와 event model로 전환한다.

#### 단계

1. schema/version inventory
2. recovery backup
3. row count와 checksum baseline
4. compatibility read projections
5. 신규 writer freeze map
6. optional backfill event/external refs
7. restore rehearsal
8. destructive change는 최소 두 release 지연

#### 금지

- 같은 의미를 old/new store 모두에 authoritative dual-write
- portable export를 backup으로 오인
- 실제 사용자 DB restore 검증 없이 cutover

---

## 5. Feature Disposition

| 현재 기능 | vNext 처분 | 비고 |
|---|---|---|
| Blank State | Augnes Project Home으로 진화 | 인간 front door 책임을 유지하고 Now, Attention, Perspective, work portfolio, pending decisions, next moves를 조합. migration과 parity 입증 전 current route 유지 |
| Agent Workplane | Augnes Semantic Workbench로 전문화 | cross-host compare, verify, delta, decision, Perspective review와 context composition 유지. native execution replica와 workflow-stage panel 확장 중단. migration과 parity 입증 전 current route 유지 |
| Inspector | Home과 Workbench의 공통 drill-down·lineage explorer | sole front door나 active semantic review/decision work의 대체재가 아님 |
| GuideBrief | Context Compiler output | 의미 분리 유지 |
| Current Working Perspective | 기본 task-start projection | canonical state가 아님 |
| Perspective Timeline | Inspector 핵심 | 유지 |
| Perspective Memory | reviewed project memory | 실제 유용성 검증 필요 |
| Work Brief | TaskContextPacket compatibility view | 유지 |
| Handoff Capsule | TaskContextPacket adapter | visible UI 강등 |
| Codex Launch Card | OpenAI adapter rendering | Core contract 아님 |
| manual result paste | emergency/compatibility | 정상 경로에서 제거 |
| Codex Result Report | RunReceipt compatibility input | 유지 |
| WorkEpisode | Run/events/artifacts episode projection | 독립 canonical table 재검토 |
| ExpectedObservedDelta | EpisodeDeltaProposal comparison projection | 유지 |
| Reuse Outcome | feedback event/projection | 유지 |
| Dogfood Metric Snapshot | evaluation projection | source of truth 아님 |
| State Proposal Review | Semantic Workbench ReviewDecision flow + Inspector basis/lineage drill-down | active proposal review와 ReviewDecision 준비는 Workbench 책임. Inspector는 source, Evidence, basis와 decision lineage를 탐색하고 host-native compact card는 bounded intent entry가 될 수 있음. transition 동안 current behavior 유지; target flow 구현 완료를 의미하지 않음 |
| Autonomy Contract | AutomationPolicy | 통합 |
| Autohunt launcher | Scheduler adapter | 자체 UI 확장 중단 |
| Project Constellation | Inspector/Lab explanation | front door 아님 |
| Sidecar/Meta-WM/BSL | Lab | Core 권위 없음 |
| publication/delivery ledger | actuator audit | 유지 |
| generic search/fetch | connector capability | 제품 정체성 아님 |
| diff/terminal/browser/PR/worktree replicas | 제거/중단 | native host 사용 |

### 5.1 Surface removal and retirement gates

Blank State나 Workplane capability는 target destination의 이름이 생겼다는 이유만으로
제거하지 않는다. capability 또는 route retirement 전에 다음을 요구한다.

1. current capability inventory
2. target destination mapping
3. parity definition
4. behavior 또는 usability verification
5. source와 decision lineage preservation
6. compatibility period
7. usage 또는 migration evidence
8. explicit PR scope
9. 필요한 경우 recovery 또는 rollback path

full parity 전에 단순화할 수 있는 것은 native host capability를 중복하고, unique
Augnes semantic responsibility가 없으며, current project continuity나 decision
capability를 지우지 않는 기능뿐이다. 이 단순화도 별도 review를 거친다.

---

## 6. Recommended Milestones

정확한 일정 대신 dependency 기반 milestone을 사용한다.

### M0. Authority Reset and Freeze

- active document set 승인
- 신규 micro-contract/panel/table freeze
- current asset inventory
- backup/restore baseline

### M1. Protocol and Project Foundation

- provider-neutral types/validators
- multi-project identity
- ExternalRef
- Generic CLI fixture adapter

### M2. OpenAI Reference Path

- Model Gateway
- OpenAI direct-call consolidation
- OpenAI host adapter context/receipt path

### M3. First Real Closed Loop

- TaskContextPacket
- real RunReceipt
- EpisodeDeltaProposal
- ReviewDecision
- later context change

#### M3A checkpoint: Reviewable Semantic Loop v0.1

2026-07-11 기준의 bounded protocol checkpoint는 다음과 같다.

- merged PR #1058은 pure provider-neutral `EpisodeDeltaProposal v0.1` type,
  builder, validator와 positive/negative conformance를 추가하여 해당 capability를
  Level 1 Validated Contract로 만들었다.
- 현재 macro-slice는 pure provider-neutral `ReviewDecision v0.1` contract와
  `EpisodeDeltaProposal` relation validation을 추가하여 ReviewDecision을 Level 1
  Validated Contract로 만든다. Contract validity는 actor authorization verification이나
  실제 사용자 결정, durable transition 적용을 증명하지 않는다.
- 현재 macro-slice는 기존 `CodexResultReportIngestionRecordV01` → mapped
  `RunReceiptV01` path와 `ExpectedObservedDeltaPreview`를 결합해 review-required
  `EpisodeDeltaProposalV01`을 만드는 첫 repository-native compatibility path를
  Level 2 Integrated Path로 만든다. Legacy `observed` naming, source validation,
  fingerprint verification, changed files, check claims, PR refs와 confidence는 observation,
  approval, accepted Evidence, work closure 또는 semantic authority로 승격되지 않는다.
- 현재 macro-slice는 `TaskContextPacket` reference → Codex result ingestion fixture →
  mapped `RunReceipt` → `ExpectedObservedDeltaPreview` → mapped
  `EpisodeDeltaProposal` → explicit synthetic `ReviewDecision`의 deterministic,
  non-durable conformance chain을 추가한다. 이 chain은 두 canonical project fixture의
  same-project relation과 cross-project fail-closed isolation을 검증하지만 실제 사용자
  결정이나 실제 transition을 기록하지 않는다.

M3는 여전히 완료되지 않았다. 실제 observed decision use, durable semantic transition,
그 transition에 따른 later `TaskContextPacket` selection 변화, 이후 `RunReceipt`의
outcome validation이 없기 때문이다. 이 checkpoint는 Project Home, Semantic
Workbench 또는 Inspector 구현 완료도 의미하지 않는다.

### M4. Surface Specialization and Legacy Consolidation

- Project Home target information architecture
- Semantic Workbench target interaction model
- Inspector shared drill-down
- compatibility와 parity mapping
- legacy surface usage와 removal prerequisites
- active/historical test separation

### M5. Second Adapter and Portability Proof

- Generic CLI live path 또는 alternate adapter
- conformance and project isolation
- no Core schema changes

### M6. Outcome-Backed Continuity

- external project dogfood
- memory/context usefulness
- decision debt and stale detection
- go/narrow/stop decision

### M7. AutomationPolicy and Advanced Lanes

- native scheduler mapping
- bounded Autohunt transition
- Lab productization gates

---

## 7. PR-Centered Development Workflow

### 7.1 역할

```text
ChatGPT
= 요구사항 정리, ContextPacket 설계, PR review

Codex
= 구현, 테스트, draft PR, 정확한 result report

사용자
= merge와 제품·semantic decision
```

### 7.2 PR 요구 사항

모든 vNext PR은 다음을 적는다.

```text
Target milestone
Maturity move
User/workflow problem
Architecture classification
Real input
Output and consumer
Source/trust handling
Authority boundary
Tests and replay fixtures
Dogfood signal
Complexity delta
Compatibility and rollback
```

### 7.3 완료로 계산하지 않는 것

- PR 존재
- 타입만 추가
- empty/default panel
- no-side-effect smoke만 통과
- fixture 하나
- 새로운 용어
- provider-neutral이라고 적힌 문서
- single-sample metric

---

## 8. Migration Safety

### 8.1 portable export

```text
provider-neutral
redacted
공유 가능
reconstructable continuity 중심
```

### 8.2 recovery backup

```text
full-fidelity
encrypted
local-only
실제 restore 가능
```

### 8.3 cutover prerequisites

- 실제 DB 복사본 backup
- table row count와 checksum
- schema version과 migration ledger
- copy migration 또는 atomic replacement
- evidence/external ref validation
- 별도 복사본 restore rehearsal
- rollback command와 operator note

---

## 9. Risk Register

| 위험 | 실패 형태 | 대응 |
|---|---|---|
| OpenAI lock-in | Core contract가 host lifecycle을 복제 | Generic CLI adapter와 vendor-neutral IDs |
| lowest-common-denominator | provider 특화 장점 손실 | common envelope + optional extensions |
| contract regrowth | 새 subrecord가 다시 제품이 됨 | 2-adapter 사용·독립 invariant 기준 |
| review overload | 후보가 쌓여 전부 무시 | Decision Debt, expiry, ranking |
| false enforcement | observed action을 enforced라고 주장 | coverage matrix와 conformance |
| schema migration loss | 과거 refs 손실 | compatibility projection과 restore drill |
| native/Augnes memory conflict | 서로 다른 current facts | native memory는 hint, accepted state는 명시적 source |
| direct model bypass | privacy/cost gate 우회 | direct-call inventory와 CI guard |
| UI regrowth | Inspector가 새 Workplane이 됨 | native UX reuse, surface budget |
| dogfood overfitting | Augnes 자기 프로젝트에서만 성공 | 외부 프로젝트 평가 |

---

## 10. Roadmap Update Template

각 갱신 시 다음을 기록한다.

```text
Date:
Current milestone:
Completed real paths:
New real records:
Changed authority or protocol:
Compatibility changes:
Maturity changes:
Metrics observed:
Risks/blockers:
Next bounded slice:
Explicitly deferred:
```
