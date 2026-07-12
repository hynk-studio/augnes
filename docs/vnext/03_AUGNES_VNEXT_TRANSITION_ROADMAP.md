# Augnes vNext Transition Roadmap
## From the Current Repo to a Provider-Neutral Temporal Core with an OpenAI-Integrated Default

> **문서 지위:** 활성 전환 및 구현 로드맵
> **버전:** v0.1
> **기준일:** 2026-07-13 KST
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

- 새 작업이 `Native Host / Adapter / Core / Product Surface / Projection /
  Inspector / Lab` 중 하나로 분류됨
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

### Workstream K: Personal Perspective and Perspective Gap R&D

#### 목표

Personal Perspective, shared Perspective Gap Management와 structured
multi-perspective review를 하나의 bounded research program으로 검증한다.
Personal Perspective는 user-owned self-and-world continuity candidate이며 Project
Core truth, hidden profile 또는 모든 task의 기본 context가 아니다.

#### Dependency-based stages

1. semantic model and synthetic casebook
2. deterministic task-gap baseline
3. Personal Perspective review replay
4. bounded relevance and context-selection experiment
5. Personal Vault persistence architecture decision
6. structured multi-perspective review trials
7. lineage 또는 evolutionary research only after repeated outcome evidence

#### Sequencing boundary

offline, synthetic, non-authoritative Lab work는 M3와 병렬로 진행할 수 있다. M3의
실제 closed loop 완성이 현재 mainline priority다. Core integration, durable Personal
Perspective transition, selective cross-project sharing 또는 task-context injection은
다음을 선행 조건으로 한다.

```text
authorized durable transition
→ later TaskContextPacket selection change
→ later RunReceipt outcome validation
```

#### 제한

- Personal Vault persistence, schema, route, UI 또는 TaskContextPacket field 승인 금지
- fake personal project ID 금지
- model-inferred identity의 accepted state 승격 금지
- hidden context injection과 automatic cross-project reuse 금지
- Arena-specific gap ontology 금지
- persistent Perspective Actors, fitness, mutation, branching, resource bidding와
  automatic population selection은 후반 Lab hypothesis로 보류

#### 진행 기준

- Personal Perspective semantic casebook과 negative cases가 replay 가능함
- deterministic task-gap baseline이 false premise와 duplicate question을 거부함
- user review가 endorsement, correction, narrowing, exception과 retraction을 표현함
- supporting example과 counterexample lineage가 함께 보존됨
- bounded context experiment가 actual downstream outcome을 측정함

세부 program은
[`research/AUGNES_PERSONAL_PERSPECTIVE_RND_PROGRAM_V0_1.md`](./research/AUGNES_PERSONAL_PERSPECTIVE_RND_PROGRAM_V0_1.md)를
따르며, 이 Workstream 등록은 구현 또는 maturity 상승 주장이 아니다.

#### Workstream K Stage 1 checkpoint: Personal Perspective Semantic Casebook v0.1

2026-07-13 기준의 bounded Lab checkpoint는 다음과 같다.

- [`research/PERSONAL_PERSPECTIVE_SEMANTIC_CASEBOOK_V0_1.md`](./research/PERSONAL_PERSPECTIVE_SEMANTIC_CASEBOOK_V0_1.md)는
  하나의 synthetic-only casebook envelope, deterministic semantic definitions,
  normalizer, validator와 source/scope/counterexample/status/reuse/privacy/non-authority
  의미를 문서화한다.
- `npm run validate:vnext-personal-perspective-semantic-casebook-v0-1`은 25개 required
  coverage row를 채우는 29개 fictional case, 214개 negative/adversarial fixture,
  9개 re-signed semantic attack, fixed identity/fingerprint anchor, ordering,
  immutability와 zero-call purity를 함께 검증한다.
- invalid fixture가 admitted candidate를 만든 수는 0이다. 이 complete fixture contract는
  Personal Perspective Semantic Casebook capability만 Level 0 Intent에서 Level 1
  Validated Contract로 이동시킨다.
- 이 checkpoint는 deterministic task-gap baseline, candidate→gap→review replay,
  Personal Perspective review replay, context-selection experiment, persistence,
  Personal Vault, user endorsement, Reviewed Reuse 또는 Outcome Improvement를 구현하거나
  Level 2 이상을 주장하지 않는다.

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
- merged PR #1059는 pure provider-neutral `ReviewDecision v0.1` contract와
  `EpisodeDeltaProposal` relation validation을 추가하여 ReviewDecision을 Level 1
  Validated Contract로 만들었다. Contract validity는 actor authorization verification이나
  실제 사용자 결정, durable transition 적용을 증명하지 않는다.
- merged PR #1059는 기존 `CodexResultReportIngestionRecordV01` → mapped
  `RunReceiptV01` path와 `ExpectedObservedDeltaPreview`를 결합해 review-required
  `EpisodeDeltaProposalV01`을 만드는 첫 repository-native compatibility path를
  Level 2 Integrated Path로 만들었다. Legacy `observed` naming, source validation,
  fingerprint verification, changed files, check claims, PR refs와 confidence는 observation,
  approval, accepted Evidence, work closure 또는 semantic authority로 승격되지 않는다.
- merged PR #1059는 `TaskContextPacket` reference → Codex result ingestion fixture →
  mapped `RunReceipt` → `ExpectedObservedDeltaPreview` → mapped
  `EpisodeDeltaProposal` → explicit synthetic `ReviewDecision`의 deterministic,
  non-durable conformance chain을 추가한다. 이 chain은 두 canonical project fixture의
  same-project relation과 cross-project fail-closed isolation을 검증하지만 실제 사용자
  결정이나 실제 transition을 기록하지 않는다.

#### M3B checkpoint: Semantic Commit Boundary v0.1

2026-07-11 기준의 bounded protocol checkpoint는 다음과 같다.

- merged PR #1061은 pure provider-neutral `StateTransitionReceiptV01` type, builder,
  validator와 positive/negative conformance를 추가하여 해당 capability를 Level 1
  Validated Contract로 만든다. Receipt는 이미 적용된 durable semantic transition을
  표현하지만 builder와 validator는 state를 적용하거나 DB에 기록하지 않는다.
- merged PR #1061은 `EpisodeDeltaProposalV01` + `ReviewDecisionV01` + 모든 target의
  explicit current-state observation + explicit semantic commit gate evaluation을 함께
  검증하는 non-writing eligibility path를 Level 2 Integrated Core Path로 만든다. 이
  evaluator는 gate authorization, current state 또는 실제 사용자 결정을 만들지 않으며
  receipt를 build하거나 persist하지 않는다.
- review follow-up은 gate evaluation이 exact authorized applier, effect operation,
  after-state content fingerprint와 state-ref identity rule을 함께 보존하도록 강화한다.
  Application observation과 durable-record ref는 같은 canonical applied-result fingerprint를
  증명해야 하며, 같은 idempotency key 아래 다른 result는 replay conflict로 남는다. 이
  correction도 writer, retry 또는 replay 실행 authority를 추가하지 않는다.
- applied-lineage follow-up은 `retract`와 `supersede` v0.1을 strict same-target path로
  제한한다. Reference-only binding 대신 independently valid한 complete prior `accept`
  `ReviewDecisionV01`과 그 decision에 exact하게 결합된 applied
  `StateTransitionReceiptV01`이 필요하다. 현재 decision, prior accept와 prior receipt는
  같은 project, source proposal, 현재 decision이 대상으로 삼은 source candidate와 target
  identity를 보존해야 하며, current-state observation은 prior receipt의 present
  after-state와 exact하게 같아야 한다. Canonical prior lineage binding은 eligibility
  precondition fingerprint와 새 receipt/effect source refs에 결합된다.
- merged PR #1061은 synthetic applied receipt에서 explicit later
  `TaskContextPacketV01`로 이어지는 pure relation path를 Level 2 Integrated Core Path로
  만든다. Low-level `validateTaskContextPacketTransitionRelationV01`은 exact receipt
  lineage, present after-state selection, retired before-state exclusion, multi-target
  atomicity와 cross-project fail-closed isolation만 확인하는 postcondition-only
  validator이며 eligibility 또는 receipt authorization proof가 아니다.
- composed `validateSemanticTransitionFullChainV01`은 proposal, decision, current state,
  gate와 prior applied lineage에서 eligibility를 다시 계산하고 receipt를 검증한 뒤
  low-level packet postcondition을 검증한다. 새 receipt 검증에는 앞서 정의한 authorized
  outcome, application-result와 durable-record proof binding도 그대로 적용된다. 이 path도
  packet을 자동 생성하거나 mutation하는 runtime path는 추가하지 않는다.
- gate, current-state, application, durable-record, prior decision/receipt lineage, current
  receipt와 later-packet fixtures는 모두 synthetic conformance material이다. 특히 이
  follow-up의 prior lineage는 synthetic prior accept와 그 applied receipt를 먼저 구성하며,
  그 prior receipt의 later packet을 다음 same-target transition의 prior context로 사용한다.
  기존 fabricated present state를 applied lineage로 재표시하지 않는다. 이 checkpoint는
  실제 authorization, 실제 durable transition 또는 observed use를 증명하지 않는다.

#### M3C checkpoint: Durable Local Closed Loop v0.1

2026-07-11 기준의 bounded local Core checkpoint는 다음 세 phase로 구성한다.

##### M3C-A: isolated SQLite pilot

- 이 macro-slice는 explicit OS-temporary SQLite database 안에서만 proposal과 synthetic
  `ReviewDecision`, read-only commit preview, exact confirmation digest, persisted semantic gate,
  absent current state의 accept/create, immutable semantic-state version과
  `StateTransitionReceipt` readback을 실행한다.
- Actual SQLite transaction, reopen, rollback, integrity, backup/restore와 exact replay는
  `real_local_observation`이다. Proposal, decision, operator actor, project task와 confirmation은
  `synthetic_fixture`이며 실제 사용자 identity 인증이나 authorization을 의미하지 않는다.
- Pilot은 default product database에 접근하지 않으며 temp database의 legacy sentinel/canonical
  baseline row를 변경하지 않는다. 실행 후 temp database와 side file을 제거한다. Network,
  provider, model, route, UI와 external actuator도 호출하지 않는다.

##### M3C-B: local Core persistence and writer

- Additive `vnext_core_records` immutable ledger와
  `vnext_semantic_state_entries` current-state projection, 그리고 absence를 통과해 revision과
  latest receipt lineage를 보존하는 `vnext_semantic_target_heads`는 persisted semantic-state
  aggregate를
  Level 1 contract + Level 2 local-store integration으로 만든다. Fresh, legacy-only upgrade와
  repeated migration은 explicit temporary DB에서만 검증하며 backfill, destructive migration,
  legacy authoritative dual-write는 없다.
- Generic DB open은 vNext schema를 더 이상 설치하지 않는다. Durable runtime은 explicit init/migrate가
  없으면 clear schema-uninitialized error로 fail closed한다. Production build wrapper는 isolated
  temporary DB만 initialize하고 seeded state의 static bake를 거부하며, injected existing/absent default
  DB guard가 byte/schema/row 변화 또는 file creation 없이 유지되는지 검증한다.
- Read-only preview는 exact proposal/decision relation, current projection, candidate-derived
  semantic content, expected revision, authorized applier identity와 bounded gate TTL을 confirmation
  digest에 결합한다. Explicit confirmation path는 decision actor와 digest, derived expiry, local
  observation, authorized applier를 검증하여 gate
  record만 남긴다. 이는 실제 사람 identity를 authenticate하지 않는다.
- Transactional writer는 store 안에서 current state와 applied lineage를 다시 읽고 M3B
  eligibility를 재계산한다. Accept/create, accept/replace, same-target supersede, retract와
  multi-target all-or-nothing apply를 target-head revision + latest-receipt lineage +
  content-fingerprint CAS로 처리한다. Retract는 present projection row를 제거하되 absent target
  head를 남기므로 old create gate나 old retract replay가 ABA 뒤에 다시 유효해지지 않는다. Exact replay,
  conflicting result, stale state, projection-to-ledger drift, project isolation과 bounded test-only failure injection을
  Level 2 integrated local Core path로 검증한다. Caller-provided current-state observation이나
  arbitrary after-state JSON은 authority input이 아니다.
- Preview, confirmation, gate, commit, compiler와 probe의 direct-local timestamp는 explicit
  injected runtime clock에서 생성한다. Writer는 immediate transaction 안에서 current time을 읽고
  expired gate의 새 apply를 차단한다. Exact persisted replay는 expiry 뒤에도 write 없이 반환할 수
  있지만 conflicting result는 항상 conflict다. 최대 gate TTL과 preview-to-confirmation age는 bounded
  policy로 검증하며 caller timestamp backdating은 허용하지 않는다.

##### M3C-C: persisted later context and local observation receipt

- Explicit `compileTaskContextPacketFromPersistedSemanticStateV01` call은 exact persisted receipt와
  current project projection을 읽고 기존 packet builder 및 complete M3B relation을 통과한 뒤에만
  later `TaskContextPacket`을 immutable ledger에 기록한다. Receipt 존재만으로 자동 실행되는
  Context Compiler, scheduler, background mutation 또는 runtime route는 없다.
- Bounded `runLocalContextUseProbeV01` adapter는 persisted later packet read, exact receipt lineage,
  accepted-state resolution, state fingerprint와 retracted-state absence를 local store에서 직접
  관찰하고 기존 `RunReceiptV01`로 기록한다. 이 Level 2 path는 context resolution과 selection
  change만 보여 주며 helpfulness, outcome improvement, Reviewed Reuse, approval, Evidence acceptance
  또는 work closure를 주장하지 않는다.
- 같은 workspace의 두 synthetic project chain은 lookup과 record isolation을 fail-closed로
  검증한다. 이는 multi-project product use나 Level 3 Observed Use가 아니다. Product Home,
  Semantic Workbench, Inspector와 UI도 구현하지 않는다.

M3는 여전히 완료되지 않았다. Explicit real user/operator decision을 opted-in real local
project에 persist하고 적용한 기록, product/user database의 real `StateTransitionReceipt`, 실제
later task의 packet consumption, 그 context usefulness에 대한 후속 review와 outcome validation이
없기 때문이다. M3C의 isolated temporary-DB observation은 production semantic commit gate,
product-wide Context Compiler 또는 Level 3 product use가 아니다.

#### M3D checkpoint: Opt-in Operator Pilot and Reviewed Reuse v0.1

2026-07-11 기준 merged PR #1062는 M3C durable local boundary를 완료했다. 이 M3D
macro-slice는 post-merge real local pilot을 사용자가 선택해 실행할 수 있도록 product/Core path를
준비하지만, PR 구현과 isolated verification 자체는 real pilot 또는 M3 completion이 아니다.

##### M3D-A: local possession session and opt-in admission

- Disabled-by-default local operator session은 explicit non-default DB path와 one exact
  workspace/project/operator enrollment를 요구한다. One-time bootstrap, rotated opaque session,
  HttpOnly SameSite=Strict cookie, expiry/revocation, loopback/same-origin boundary와 per-action nonce
  CAS를 Level 2 local integrated path로 검증한다.
- Session은 locally issued secret possession만 검증한다. Legal/external identity, OS account,
  organization membership, remote user 또는 actual semantic authorization을 증명하지 않는다.
- Automated gate는 disposable temp DB와 local ephemeral server만 사용하고 semantic proposal,
  decision, gate, state, receipt, packet과 result row를 authentication-only phase에서 만들지 않는다.

##### M3D-B: Semantic Workbench review and explicit commit flow

- Existing Codex ingestion → mapped `RunReceipt` + ExpectedObservedDelta →
  `EpisodeDeltaProposal` path가 structured local preparation에 재사용된다. Caller report는 imported/
  attested trust를 유지하고 Workbench는 proposal, lineage, candidate, conflicts, missing material과
  uncertainty를 표시한다.
- Authenticated operator는 exact candidate에 `accept`, `reject` 또는 `defer`
  `ReviewDecisionV01`을 명시적으로 만들 수 있다. Initial real-pilot admission은 one candidate,
  one target, absent-state `accept/create`만 허용하며 UI와 route 모두 replace, supersede, retract와
  multi-target apply를 차단한다.
- Preview, confirmation, persisted gate, durable commit, receipt review와 later packet compilation은
  별도 action이다. Preview는 zero-write, confirmation은 gate-only, commit은 M3C writer를 호출하되
  packet을 자동 compile하지 않고, compiler는 별도 explicit operator action으로만 실행된다.
- 이 path들은 Semantic Workbench proposal/decision과 preview-confirm-commit을 Level 2 product/Core
  path로 준비한다. Isolated fixture decision은 actual operator decision이나 product transition이 아니다.

##### M3D-C: continuity, later result and reviewed reuse record

- Project Home은 enrolled project의 pending review, latest transition, accepted state/head, packet
  currentness, later result와 latest usefulness review를 read-only projection으로 보여 준다. Home에는
  decision, gate, commit, compile 또는 review mutation action이 없다.
- Native-host handoff는 exact later packet과 accepted-state refs, constraints와 return contract를 bounded
  text/JSON으로 제공한다. Copy/download는 execution이나 consumption을 증명하지 않는다.
- Later-result intake는 exact packet/transition lineage가 있는 structured Codex result만 받고 기존
  conservative `RunReceiptV01` mapping을 사용한다. Packet reference, reported payload use와 cited refs를
  구분하며 actual use나 helpfulness를 자동 추론하지 않는다.
- New `ContextUseReviewV01`은 exact prior/later packet, transition와 later-task receipt에 대한
  presented/use declaration, assessment, corrections와 bounded metrics를 기록하는 Level 1 contract다.
  Authenticated local runtime persistence와 Workbench review path는 Level 2다. Review는 Evidence,
  semantic state, decision, transition, work closure, auto-retract, memory promotion 또는 correction
  proposal이 아니다.
- Immutable ledger kind migration은 existing `vnext_core_records` payload와 immutability artifacts를
  losslessly 보존한다. Generic DB open과 build는 migration하지 않으며 legacy authoritative state와
  dual-write하지 않는다.

M3D automated evidence는 real local session/route/SQLite/browser mechanics와 synthetic semantic
fixture를 분리한다. 이 PR은 real pilot runbook을 제공하지만 Codex는 그 runbook을 실행하지 않는다.
후속 Lab / verification infrastructure slice는 PR #1066의 versioned qualification gate를 호출하고
portable/local-full receipt identity를 독립 검증한 뒤에만 opaque chain allocation과 isolated
mechanical rehearsal을 허용하는 `vnext_m3d_autonomous_evidence_runner.v0.1`을 구현한다. 해당
implementation smoke와 dry-run은 synthetic chain ID와 temp fixture만 사용하며 real Chain 6을
할당하거나 실행하지 않는다. `COMPLETE_AUTONOMOUS_REHEARSAL`도 mechanical evidence일 뿐 M3
completion, actual user authorization, Reviewed Reuse 또는 Outcome Improvement가 아니다.
M3는 opted-in real local project에 다음 record가 모두 생기고 사용자가 그 결과를 검토하기 전까지
완료되지 않는다.

- possession-authenticated local operator session
- explicit real `ReviewDecision`
- exact operator-confirmed semantic gate
- product/user local database의 real `StateTransitionReceipt`
- explicit compile로 생성된 actual later `TaskContextPacket`
- 그 packet을 실제 later task가 참조한 actual `RunReceipt`
- usefulness/correction을 기록한 explicit `ContextUseReview`

그 evidence가 생겨도 single review는 Outcome Improvement를 증명하지 않는다. M4 surface
specialization은 real-pilot evidence와 authority audit 뒤의 다음 milestone이며, 이 M3D slice는 broad
Project Home, Semantic Workbench 또는 Inspector redesign을 완료했다고 주장하지 않는다.

Workstream K의 offline Lab 연구는 이 milestone과 병렬로 진행할 수 있지만 M3를
대체하거나 완료를 늦추지 않는다. Personal Vault, Personal Perspective context
injection과 Arena productization은 M3 이후 별도 gate를 요구한다.

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
| personal-context overreach | model inference를 identity로 고정하거나 project 간 누출 | opt-in Vault decision, scope separation, deletion과 leakage tests |

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
