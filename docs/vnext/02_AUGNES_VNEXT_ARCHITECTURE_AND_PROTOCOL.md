# Augnes vNext Architecture and Protocol
## Technical Meaning Contract for Core, Adapters, Receipts, Decisions and Temporal Lineage

> **문서 지위:** Masterplan 하위의 활성 기술 기준
> **버전:** v0.1
> **기준일:** 2026-07-10 KST
> **상위 문서:** `01_AUGNES_VNEXT_MASTERPLAN.md`
> **스키마 권위:** 실제 필드·enum·validation schema는 `SSOT_SCHEMA_BUNDLE` 및 이후 versioned schema 파일이 최종 권위를 가진다.
> **주의:** 이 문서는 의미 계약을 정의하며, 곧바로 DB migration이나 API surface를 승인하지 않는다.

---

## 0. Architectural Goals

vNext 아키텍처는 다음을 동시에 만족해야 한다.

1. ChatGPT Work와 Codex를 기본 사용처로 최적화한다.
2. OpenAI API를 기본 programmatic reasoning backend로 지원한다.
3. 다른 API, 오픈 모델, 로컬 모델과 agent host를 adapter로 추가할 수 있다.
4. Core의 temporal state, evidence, claims와 decisions는 provider에 종속되지 않는다.
5. 모델 없이도 Core read/write/decision/restore 경로가 동작한다.
6. UI 이름이 권한을 결정하지 않는다.
7. 실행 결과와 프로젝트의 의미적 승인을 분리한다.
8. workflow 단계마다 새 table과 panel을 만드는 구조를 피한다.
9. 기존 repo 기록과 ID를 삭제하지 않고 compatibility projection으로 읽는다.
10. 모든 derived view는 source와 time lineage로 역추적 가능하다.

---

## 1. Logical Components

### 1.1 Augnes Core

Core는 다음 bounded contexts를 포함한다.

```text
Project Identity
Temporal State
Evidence Registry
Claim Registry
Work and Runs
Deltas and Proposals
Decisions and Grants
Perspective and Reviewed Memory
Tensions and Knowledge Gaps
Policies and Audit
```

Core는 provider 호출이나 native worker 실행을 직접 소유하지 않는다. adapter와 gateway를 통해 요청하거나 결과를 수신한다.

### 1.2 Augnes Protocol

Protocol은 transport와 provider를 넘어 유지되는 의미 계약이다.

```text
TaskContextPacket
RunReceipt
EpisodeDeltaProposal
ReviewDecision
AutomationPolicy
ExternalRef
CapabilityGrant
StateTransitionReceipt
```

MCP, hooks, HTTP와 file inbox는 이 계약을 운반하는 transport다.

### 1.3 Integration Kit

```text
Host Adapter
Worker Adapter
Model Adapter
Scheduler Adapter
External Actuator Adapter
Model Gateway
Transport Bindings
```

Integration Kit는 Core approval을 우회하지 않는다.

### 1.4 Product Surfaces, Projections and Inspector

```text
Augnes Project Home
Augnes Semantic Workbench
Augnes Inspector
Host-native compact cards
Current Working Perspective
Context Compiler
Attention Queue
Evidence Pack
Run Trace
Project Timeline
Lineage Explorer
Integration Health
```

Project Home은 Resume과 current coordination을 위한 인간 front door다. 현재
Blank State는 이 목표의 predecessor이며, route나 구현이 이미 전환됐다는 뜻은
아니다. Semantic Workbench는 cross-host result comparison, Evidence/Claim
reconciliation, EpisodeDeltaProposal review, ReviewDecision 준비와 next-context
composition을 위한 능동 semantic work surface다. 현재 Agent Workplane은 이
목표의 predecessor다. Workbench의 책임은 provider 제품의 일시적 기능 공백이
아니라 cross-host·cross-time canonical project semantics로 정의한다.

Inspector는 Home과 Workbench가 공유하는 read-heavy provenance, audit와 lineage
drill-down이다. host-native compact card는 bounded context와 review intent를
native UX에 표시한다. compact card와 Inspector 어느 것도 Home과 Workbench를
단독 대체하지 않는다.

모든 surface는 Core record를 소비하는 projection 또는 client다. UI 이름은
authority를 부여하지 않으며, surface가 낸 review/decision intent도 explicit Core
decision/transition path가 적용하기 전에는 durable state가 아니다. Home과
Workbench는 projection을 조합하고 bounded review 또는 decision intent를 Core
gate로 보낼 수 있지만 source of truth가 아니다. workflow-stage마다 전용 table과
panel을 만드는 방식은 계속 금지한다.

Canonical interaction loop:

```text
Project Home frames or resumes work
→ TaskContextPacket
→ native host execution
→ RunReceipt
→ Semantic Workbench review
→ EpisodeDeltaProposal
→ ReviewDecision
→ authorized transition
→ updated Project Home projection
```

Inspector drill-down은 이 loop 전 구간에서 source, artifact, run, decision과
Perspective lineage를 열 수 있어야 한다. 이 loop는 새 protocol type, DB schema,
API, route 또는 UI implementation plan을 승인하지 않는다.

### 1.5 Augnes Lab

Lab의 code와 data는 Core의 Evidence·Claim·Decision authority와 분리한다. 자세한 경계는 `05_AUGNES_VNEXT_LAB_CHARTER.md`를 따른다.

---

## 2. Identity Model

### 2.1 canonical identities

Core가 소유하는 ID:

```text
workspace_id
project_id
work_id
run_id
claim_id
evidence_id
artifact_id
delta_id
proposal_id
decision_id
grant_id
policy_id
perspective_id
memory_item_id
tension_id
```

### 2.2 ExternalRef

공급자나 외부 시스템의 식별자는 canonical state key가 아니다.

```yaml
ExternalRef:
  ref_id: string
  ref_type: string
  provider: string|null
  host: string|null
  external_id: string
  canonical_url_ref: string|null
  observed_at: timestamp|null
  source_event_id: string|null
  trust_class: string
```

예시:

```text
ChatGPT project ID
Codex task/session ID
Claude Code session ID
Gemini run ID
GitHub repository/PR/commit ID
Scheduled Task ID
CI run ID
```

### 2.3 workspace와 project

```text
Workspace
= 사용자가 소유한 Augnes 실행·저장 경계

Project
= state, evidence, claims, decisions와 Perspective의 격리 단위

Repository
= 프로젝트가 참조하는 외부 code history source
```

하나의 project가 여러 repository를 가질 수 있고, 하나의 repository가 다른 project에서 서로 다른 의미로 참조될 수 있다.

### 2.4 project isolation invariants

- 모든 durable record는 명시적 `project_id` 또는 equivalent scope를 가진다.
- context compilation은 같은 project의 record만 기본 선택한다.
- cross-project reuse는 explicit source project와 policy를 기록한다.
- grant와 automation policy는 project 범위를 벗어나지 않는다.
- export, archive, restore와 delete rehearsal은 project별로 검증한다.

---

## 3. Actor, Capability and Coverage Model

### 3.1 actor classes

| Actor | 역할 | durable semantic authority |
|---|---|---:|
| `user_operator` | 목표와 지속 가능한 결정을 승인 | 승인 주체 |
| `augnes_core` | gate 검증과 승인된 record 저장 | scoped store |
| `agent_host` | native task UX, sandbox와 permission | 없음 |
| `reasoning_backend` | bounded candidate 생성 | 없음 |
| `worker_runtime` | 허용된 workspace에서 실행 | 없음 |
| `external_actuator` | 별도 gate 이후 외부 side effect | action-specific |
| `observability_surface` | derived view 표시 | 없음 |

### 3.2 CapabilityManifest

```yaml
CapabilityManifest:
  manifest_version: string
  actor_ref: string
  declared_capabilities: [string]
  configured_capabilities: [string]
  environment_capabilities: [string]
  coverage:
    <capability>:
      level: enforced|observed|advisory|outside_coverage
      notes: [string]
  filesystem_scope: [string]
  network_targets: [string]
  external_side_effects: [string]
  expires_at: timestamp|null
```

### 3.3 CapabilityGrant

CapabilityGrant는 manifest 전체가 아니라 특정 work/run에 허용된 부분집합이다.

```yaml
CapabilityGrant:
  grant_id: string
  project_id: string
  work_id: string|null
  grantee_ref: string
  allowed_capabilities: [string]
  forbidden_capabilities: [string]
  resource_scope: object
  budget: object
  stop_conditions: [object]
  approved_by: string|null
  approved_at: timestamp|null
  expires_at: timestamp|null
```

### 3.4 authority coverage

각 adapter와 host는 capability별로 다음을 선언한다.

```text
enforced
= Augnes 또는 연결된 gate가 실제로 실행을 차단할 수 있음

observed
= 신뢰 가능한 receipt로 실행을 관찰하지만 차단하지 못함

advisory
= context 또는 경고만 제공함

outside_coverage
= 현재 Augnes가 보거나 통제하지 못함
```

coverage를 과장하는 것은 protocol violation으로 취급한다.

---

## 4. Semantic Taxonomy

| 용어 | 의미 |
|---|---|
| `Observation` | 직접 또는 간접으로 관찰된 사건 |
| `Attestation` | actor가 사건이 발생했다고 보고한 기록 |
| `Evidence` | 특정 Claim이나 판단의 근거로 검토 가능한 자료 |
| `Claim` | 참·거짓 또는 프로젝트 유효성을 검토할 수 있는 명제 |
| `Artifact` | 파일, 문서, diff, 보고서, dataset 등 산출물 |
| `Delta` | 의미적으로 무엇이 달라질 수 있는지 표현 |
| `Proposal` | 검토를 요청하는 변경 후보 |
| `Decision` | 후보에 대한 권한 있는 판단 |
| `Transition` | 결정에 따라 durable state가 실제로 바뀐 사건 |
| `Perspective` | accepted state·claims·gaps 위의 현재 해석 projection 또는 reviewed state |
| `Memory` | 향후 재사용 가치가 검토된 프로젝트 지식 |
| `Diagnostic` | review와 실험을 돕는 비권위적 신호 |

공통 lifecycle은 가능한 범위에서 다음을 사용한다.

```text
draft
pending_review
accepted
rejected
deferred
superseded
retracted
applied
archived
```

도메인별 status가 필요하면 이 lifecycle과의 mapping을 문서화한다.

---

## 5. Protocol Contract Summaries

### 5.1 TaskContextPacket

#### 목적

작업 시작 전에 필요한 최소 reviewed context를 제공한다.

#### 의미 구조

```yaml
TaskContextPacket:
  packet_version: string
  packet_id: string
  workspace_id: string
  project_id: string
  work_ref: string|null
  generated_at: timestamp
  expires_at: timestamp|null
  task:
    goal: string
    success_criteria: [string]
    non_goals: [string]
  current_projection:
    perspective_ref: string|null
    bounded_summary: string
  selected_context:
    accepted_state_refs: [string]
    memory_refs: [string]
    evidence_refs: [string]
    claim_refs: [string]
    artifact_refs: [string]
  exclusions:
    excluded_refs: [object]
  tensions_and_gaps: [object]
  constraints:
    required_checks: [string]
    forbidden_actions: [string]
    data_classification: string
    context_budget: object
  capability_grant: object|null
  return_contract: object
  authority_summary: object
  source_status: object
```

#### 불변식

- Current Working Perspective를 canonical state로 표현하지 않는다.
- selected context마다 inclusion rationale과 freshness를 보존한다.
- missing source를 추측하여 채우지 않는다.
- packet은 durable transition을 수행하지 않는다.
- provider-specific rendering은 adapter가 담당한다.

#### 기존 compatibility inputs

```text
Work Brief
Core/Full Handoff
Handoff Capsule
Codex Launch Card
Codex Memory Brief
Perspective Memory Reuse Packet
GuideBrief
```

---

### 5.2 RunReceipt

#### 목적

서로 다른 host, worker와 model의 실제 실행과 결과를 공통 provenance로 기록한다.

#### 의미 구조

```yaml
RunReceipt:
  receipt_version: string
  receipt_id: string
  workspace_id: string
  project_id: string
  run_id: string
  work_ref: string|null
  reporter_ref: string
  observer_ref: string|null
  host_ref: object|null
  worker_ref: object|null
  model_invocations: [object]
  execution_environment: object
  started_at: timestamp|null
  finished_at: timestamp|null
  observations: [object]
  attestations: [object]
  changed_artifacts: [object]
  commands: [object]
  checks: [object]
  skipped_checks: [object]
  external_refs: [object]
  bounded_result_summary: string
  blockers: [object]
  privacy_and_egress: object
  cost_and_usage: object
  coverage: object
  trust_classification: object
  source_refs: [string]
  artifact_refs: [string]
  idempotency_key: string
```

#### 직접 관찰과 해석 분리

```text
명령 실행과 exit code
= observation 가능

파일 hash 변화
= observation 가능

GitHub merge event 조회
= verified external observation 가능

"이 설계가 안전하다"
= candidate Claim

"프로젝트 방향이 바뀌었다"
= inferred delta candidate
```

#### 불변식

- hidden reasoning과 raw prompt를 기본 저장하지 않는다.
- skipped check를 pass로 계산하지 않는다.
- changed file을 requirement completion으로 자동 해석하지 않는다.
- provider report와 직접 관찰을 같은 trust level로 두지 않는다.
- receipt 기록은 semantic state commit이 아니다.

#### 기존 compatibility inputs

```text
Codex Result Report
Return Binding
Runner DeltaBatch
Autohunt Result Intake
action/work/evidence proof records
CI/GitHub receipts
```

---

### 5.3 EpisodeDeltaProposal

#### 목적

작업 결과가 프로젝트 의미에 제안하는 변화를 reviewable하게 표현한다.

```yaml
EpisodeDeltaProposal:
  proposal_version: string
  proposal_id: string
  project_id: string
  run_receipt_refs: [string]
  observed: [object]
  attested: [object]
  inferred: [object]
  proposed_deltas: [object]
  contradicted_claim_refs: [object]
  missing: [object]
  validation_summary: object
  authority_boundary: object
  created_at: timestamp
  status: draft|pending_review|accepted|rejected|deferred|superseded|retracted
```

`AugnesDelta`를 공통 의미적 변화 단위로 사용한다.

```text
perspective_delta
memory_delta
artifact_delta
code_delta
research_delta
world_state_delta
agent_plan_delta
validation_delta
user_decision_delta
coordination_delta
```

#### 불변식

- proposal status 자체가 state commit을 의미하지 않는다.
- expected-vs-observed 비교는 learning signal이며 validation approval이 아니다.
- 모델 confidence는 delta scoring authority가 아니다.
- stale source에 의존하면 fresh review requirement를 표시한다.

---

### 5.4 ReviewDecision

#### 목적

사용자 또는 명시적으로 권한 있는 actor의 판단을 candidate lifecycle과 연결한다.

```yaml
ReviewDecision:
  decision_version: string
  decision_id: string
  project_id: string
  candidate_ref: string
  decision: accept|reject|defer|supersede|retract
  target_class: string
  actor_ref: string
  basis_refs: [string]
  rationale: string|null
  decided_at: timestamp
  expiry_or_revisit: object|null
  requested_transition: object|null
```

#### StateTransitionReceipt

`StateTransitionReceiptV01`은 이미 적용되어 durable record로 관찰된 semantic state
transition을 표현한다. 이 contract의 builder와 validator는 transition을 적용하거나
DB에 기록하지 않으며, ExternalRef의 authenticity를 스스로 증명하지 않는다.

```yaml
StateTransitionReceiptV01:
  transition_receipt_version: state_transition_receipt.v0.1
  transition_receipt_id: deterministic string
  idempotency_key: deterministic sha256
  workspace_id: string
  project_id: string
  source_proposal: { proposal_id, proposal_fingerprint }
  source_decision: { decision_id, decision_fingerprint }
  source_candidate: { candidate_id, candidate_fingerprint }
  requested_transition_intent:
    { intent_id, transition_kind, target_refs }
  transition_scope: semantic_state
  receipt_status: applied
  atomicity:
    { mode: all_or_nothing, all_effects_applied: true, partial_application: false }
  effects:
    - effect_id: deterministic string
      target_ref: ExternalRefV01
      operation: create|replace|supersede|retract
      before_state: { presence: absent|present, state_ref, state_fingerprint }
      after_state: { presence: absent|present, state_ref, state_fingerprint }
      before_state_observation_ref: ExternalRefV01
      after_application_observation_ref: ExternalRefV01
      durable_record_ref: ExternalRefV01
      source_refs: [ExternalRefV01]
  applied_at: timestamp
  recorded_at: timestamp
  applied_by_ref: ExternalRefV01
  semantic_commit_gate:
    { status: authorized, evaluation_ref, evaluated_at, expires_at }
  eligibility_precondition_fingerprint: sha256
  source_refs: [ExternalRefV01]
  compatibility: object
  material_boundary: object
  authority_summary: object
  integrity: object
```

`absent` snapshot은 `state_ref`와 `state_fingerprint`가 모두 null이고, `present`
snapshot은 둘 다 명시한다. `create`는 absent → present, `replace`와 `supersede`는
서로 다른 present → present, `retract`는 present → absent다. before-state observation,
after-application observation, durable-record와 semantic commit gate evaluation ref는
`direct_local_observation` 또는 `verified_external_observation`이어야 한다.

Idempotency key는 exact decision fingerprint, requested intent ID와 kind, canonical target
set, workspace/project identity에 결합한다. eventual after-state 결과는 key에 포함하지
않으므로 같은 authorized intent의 retry identity는 유지되고, receipt ID와 integrity
fingerprint는 실제 effect와 after-state 결과를 포함한다.

Pure transition eligibility evaluator는 proposal, decision, exact relation, 모든 target의
current-state observation, semantic commit gate evaluation을 함께 검증한다. denied,
unknown, expired gate와 missing/unknown current state는 receipt가 아니라 ineligible 또는
blocked eligibility result다. relation validator는 eligibility를 다시 계산해 receipt의
intent, target set, operation, before snapshot, gate ref와 precondition fingerprint를
검증하지만 receipt를 만들거나 state를 적용하지 않는다.

`retract`와 `supersede`의 v0.1 eligibility는 strict same-target applied-lineage path로
제한한다. ID/fingerprint reference만으로는 충분하지 않으며, input은 independently
valid한 complete prior `accept` `ReviewDecisionV01` payload와 그 decision에 exact하게
결합된 `receipt_status: applied` `StateTransitionReceiptV01` payload를 함께 제공해야 한다.
현재 decision, prior accept와 prior receipt는 같은 project와 source proposal
ID/fingerprint를 보존하고, 현재 decision이 대상으로 삼은 source candidate
ID/fingerprint와 각 target ExternalRef도 일치해야 한다. `supersede`의 superseding
candidate는 별도 candidate일 수 있지만, v0.1에서는 prior applied target과 exact same
target set일 때만 eligible하다. 각 current-state observation은 대응 prior receipt effect의
`presence: present` after-state ref/fingerprint와 exact하게 같아야 한다. missing,
cross-target, non-applied 또는 honestly drifted lineage는 새 receipt eligibility로
승격되지 않는다.

Canonical prior decision `{ decision_id, decision_fingerprint }`와 prior receipt
`{ transition_receipt_id, fingerprint, idempotency_key }` binding은 eligibility
precondition fingerprint에 포함된다. Resolved prior receipt의 exact lineage ref는 expected
effect와 새 receipt/effect의 `source_refs`에도 보존되어야 한다. 이 lineage 검증은 prior
payload나 현재 상태를 조회하거나 transition을 실행하는 authority가 아니다.

Semantic commit gate evaluation은 target과 transition kind만 승인하지 않는다.
`authorized_applier_ref`와 canonical `authorized_effects`를 함께 명시하고, 각 effect는
operation과 exact after-state content fingerprint를 승인한다. Present after-state ref는
관찰 provenance를 미리 꾸미지 않는 exact ExternalRef identity template 또는 provider-free
writer-allocation rule로 제한한다. Retract는 exact absent after-state만 승인할 수 있다.
이 outcome material은 eligibility precondition fingerprint와 expected effects에 포함되며,
receipt relation은 actual after-state와 `applied_by_ref`를 다시 exact하게 검증한다.

각 applied effect의 application-result fingerprint는 canonical target, operation,
before/after snapshot과 `applied_at`을 결합한다. After-application observation과
durable-record ref는 모두 이 exact fingerprint를 `source_ref`로 보존해야 한다. Pure replay
compatibility helper는 같은 idempotency key와 같은 normalized applied result를 exact
replay로, 같은 key와 다른 result를 conflicting result로 분류하며 retry나 replay를
실행하지 않는다.

Low-level `validateTaskContextPacketTransitionRelationV01`은 applied receipt와 later
`TaskContextPacket` 사이의 postcondition-only relation을 검증한다. Exact receipt lineage,
present after-state selection, retired before-state exclusion과 project isolation은
검증하지만 transition eligibility를 다시 계산하거나 receipt가 decision과 gate에 따라
적용되었다고 증명하지 않는다. Composed `validateSemanticTransitionFullChainV01`은 먼저
proposal, decision, current state, gate와 prior applied lineage에서 eligibility를 다시
계산하고 receipt를 그 eligibility에 대해 검증한 뒤 packet postcondition을 검증해야 한다.
어느 validation도 packet을 자동 생성하거나 mutation하는 runtime Context Compiler
path가 아니다.

#### 불변식

- Decision과 Transition을 한 레코드로 뭉개지 않는다.
- `accept`가 모든 target에 동일한 write를 의미하지 않는다.
- failed, denied 또는 planned attempt를 applied receipt로 기록하지 않는다.
- gate가 승인하지 않은 after-state, result proof 또는 applier를 receipt로 채택하지 않는다.
- 같은 idempotency key 아래 서로 다른 applied result를 독립 성공으로 취급하지 않는다.
- retract와 supersede는 ref-only history나 non-applied receipt를 prior state로 채택하지 않는다.
- low-level packet relation 성공을 authorized full-chain transition proof로 취급하지 않는다.
- receipt가 represented fact를 담더라도 future transition authority를 부여하지 않는다.
- external publish와 semantic state apply는 별도 transition이다.

---

### 5.5 AutomationPolicy

#### 목적

반복·자율 작업의 범위와 중단 조건을 provider-neutral하게 표현한다.

```yaml
AutomationPolicy:
  policy_version: string
  policy_id: string
  project_id: string
  trigger_conditions: [object]
  allowed_work_classes: [string]
  allowed_actions: [string]
  forbidden_actions: [string]
  provider_constraints: object
  filesystem_scope: [string]
  network_scope: [string]
  budget: object
  approval_checkpoints: [object]
  stop_conditions: [object]
  result_contract: object
  retry_policy: object
  external_actuation_policy: object
```

#### 불변식

- scheduler ID는 ExternalRef다.
- policy는 execution 자체가 아니다.
- result return과 RunReceipt를 필수로 한다.
- semantic commit을 자동 포함하지 않는다.

---

## 6. Provenance and Trust Model

### 6.1 trust classes

| Trust class | 의미 | 기본 사용 |
|---|---|---|
| `direct_local_observation` | Augnes-controlled adapter가 로컬 결과를 직접 관찰 | 높은 실행 telemetry 신뢰 |
| `verified_external_observation` | GitHub/CI 등 외부 source API에서 검증 | 외부 사건 observation |
| `host_attestation` | native host가 실행 결과를 보고 | 추가 검증 필요 가능 |
| `provider_report` | 모델/provider가 자기 결과를 보고 | candidate basis |
| `user_declaration` | 사용자가 직접 선언 | 명시적 source, 별도 사실 검증 가능 |
| `imported_unverified` | 외부에서 가져왔으나 검증되지 않음 | review 필요 |
| `derived_interpretation` | 규칙·모델·projection이 도출 | Evidence 아님 |

### 6.2 observer와 reporter

모든 receipt는 가능한 한 다음을 분리한다.

```text
reporter
= 사건이 발생했다고 말한 actor

observer
= 사건 또는 artifact를 직접 확인한 actor/adapter

verifier
= 독립 check 또는 source로 확인한 actor
```

### 6.3 tamper evidence

초기에는 blockchain 같은 분산 합의가 필요하지 않다. 다음이면 충분하다.

- content hash
- adapter version과 code hash
- idempotency key
- optional local HMAC 또는 signing key
- append-only event hash linkage
- backup checksum과 restore rehearsal

---

## 7. Temporal Model

### 7.1 time dimensions

```text
event_time
= 실제 사건이 발생한 시각

observed_time
= Augnes 또는 source가 사건을 관찰한 시각

recorded_time
= Augnes에 기록된 시각

valid_from / valid_until
= Claim 또는 state가 의미상 유효한 기간
```

### 7.2 required queries

```text
current(project)
valid_at(project, t)
known_at(project, t)
recorded_between(project, t1, t2)
lineage_of(entity)
superseded_by(claim)
contradictions_for(claim)
perspective_basis_at(project, t)
```

### 7.3 bitemporal/tri-temporal posture

초기 구현은 모든 aggregate를 완전한 temporal DB로 재작성하지 않아도 된다. 그러나 API와 event envelope는 시간 차원을 잃지 않아야 하며, projection은 과거 snapshot과 lineage를 재구성할 수 있어야 한다.

---

## 8. Claim and Evidence Model

### 8.1 Claim

```yaml
Claim:
  claim_id: string
  project_id: string
  proposition: string
  claim_kind: string
  status: string
  valid_from: timestamp|null
  valid_until: timestamp|null
  created_at: timestamp
  source_refs: [string]
  evidence_relations: [object]
  relation_refs: [object]
```

### 8.2 Claim relations

```text
supports
contradicts
revises
supersedes
narrows
broadens
depends_on
```

### 8.3 Evidence relation

Evidence는 단독으로 truth가 아니다. 특정 Claim과의 관계를 가진다.

```yaml
EvidenceRelation:
  evidence_ref: string
  claim_ref: string
  relation: supports|contradicts|contextualizes|tests|insufficient
  strength: string|null
  reviewer_ref: string|null
  reviewed_at: timestamp|null
```

### 8.4 generated views

요약과 모델 해석은 `generated_view=true` 또는 equivalent metadata를 가져야 한다. source refs가 없으면 durable Evidence나 accepted memory로 승격할 수 없다.

---

## 9. Storage Model

### 9.1 세 층

```text
Common Event Envelope
+
Stable Domain Aggregates
+
Rebuildable Projections
```

### 9.2 common event envelope

```yaml
EventEnvelope:
  event_id: string
  workspace_id: string
  project_id: string
  entity_type: string
  entity_id: string
  event_type: string
  schema_version: string
  actor_ref: string|null
  host_ref: string|null
  provider_ref: string|null
  external_refs: [object]
  event_time: timestamp|null
  observed_time: timestamp|null
  recorded_time: timestamp
  source_refs: [string]
  artifact_refs: [string]
  payload: object
  fingerprint: string
  idempotency_key: string|null
```

### 9.3 stable aggregates

초기 목표 집합:

```text
projects
work_items
runs
claims
evidence_records
artifacts
deltas
proposals
decisions
grants
policies
perspectives
memory_items
tensions
external_refs
```

### 9.4 projections

```text
current_working_perspective
attention_queue
evidence_pack
run_trace
project_timeline
delta_projection
integration_health
constellation
continuity_metrics
```

### 9.5 table 생성 기준

새 table 또는 aggregate는 다음을 모두 만족할 때만 고려한다.

1. 독립적인 장기 lifecycle이 있다.
2. 고유한 query·integrity 요구가 있다.
3. 둘 이상의 consumer가 있다.
4. event 또는 projection으로 재생성할 수 없는 canonical 의미가 있다.
5. 기존 aggregate에 자연스럽게 포함할 수 없다.

preflight, readiness, metric calculation, relay recommendation 같은 중간 결과는 기본적으로 event, artifact 또는 projection으로 처리한다.

---

## 10. Model Gateway and Reasoning Plane

### 10.1 deterministic first

모델 없이 처리할 것:

```text
hashing
schema validation
source lookup
diff parsing
check result parsing
policy validation
budget validation
freshness
idempotency
```

모델이 맡을 수 있는 것:

```text
bounded extraction
synthesis
trade-off analysis
contradiction candidate
specialist interpretation
```

### 10.2 Model Gateway

모든 remote model call은 공통 Gateway를 통과한다.

```yaml
ModelInvocationEnvelope:
  invocation_id: string
  project_id: string
  role: extract|synthesize|critique|classify|other
  provider: string
  endpoint_ref: string
  model_identifier: string
  model_revision: string|null
  adapter_version: string
  prompt_contract_version: string
  bounded_input_refs: [string]
  data_classification: string
  redaction_result: object
  retention_class: string
  token_budget: object
  cost_budget: object
  timeout_retry_policy: object
```

Gateway는 호출 후 usage, cost, latency, failure와 fallback을 RunReceipt의 model subrecord로 반환한다.

### 10.3 local/private model

로컬 모델도 자동으로 private로 간주하지 않는다. network attempt, telemetry, logs, model provenance와 retention을 검증해야 `local_private_verified` 같은 표시를 사용할 수 있다.

### 10.4 independent critic

critic agreement는 proof가 아니다.

```text
primary model output
→ candidate

critic output
→ contradiction / missing assumption candidate

deterministic checks + source evidence
→ verification basis

user
→ final semantic judgment
```

---

## 11. Adapter Architecture

### 11.1 Adapter interface

모든 adapter는 최소한 다음 기능 중 지원 범위를 선언한다.

```text
negotiate_capabilities
render_task_context
open_run
append_observation
close_run
normalize_receipt
request_decision
map_external_refs
health_check
```

### 11.2 Adapter Trust Manifest

```yaml
AdapterTrustManifest:
  adapter_id: string
  version: string
  code_hash: string|null
  publisher: string|null
  supported_protocol_versions: [string]
  declared_capabilities: [string]
  filesystem_scope: [string]
  network_targets: [string]
  data_egress_classes: [string]
  events_observed: [string]
  events_enforced: [string]
  known_blind_spots: [string]
  retention_behavior: string
```

### 11.3 reference adapters

#### OpenAI Integrated Adapter

- ChatGPT Work plugin/app
- Codex skill
- MCP resources/tools
- lifecycle hooks
- Scheduled Task mapping
- compact context/review card
- RunReceipt collector

#### Generic CLI Adapter

- stdin/stdout JSON
- file inbox/outbox
- HTTP callback
- vendor SDK 없는 conformance reference

Generic CLI adapter가 있어야 provider-neutral claim을 실제로 검증할 수 있다.

### 11.4 conformance

adapter는 versioned fixtures와 negative fixtures를 통과해야 한다.

```text
manifest validation
TaskContextPacket rendering
RunReceipt completeness
trust/coverage honesty
idempotency
cross-project isolation
raw secret refusal
protocol version negotiation
```

---

## 12. Core, Personal and Lab Separation

### 12.1 Project Core

```text
project state
Evidence
Claims
work and run history
Decisions
Perspective
reviewed project memory
```

### 12.2 Perspective scope distinctions

```text
Project Perspective
= one project's accepted claims, goals, tensions and reviewed interpretation

Personal Perspective
= opt-in workspace-level self-and-world continuity candidate

Current Working Perspective
= current project/task-start projection

Task context selection
= bounded material selected for one task
```

Personal Perspective는 identity, personality, values, world models, aspiration,
decision principles와 persistent tensions를 포함할 수 있지만 Project Perspective나
Core project truth가 아니다. Current Working Perspective는 Personal Perspective의
별칭이 아니고, lower-scope project/task choice는 higher-scope personal identity를
자동 수정하지 않는다.

### 12.3 Personal Vault candidate

Personal continuity가 필요하면 별도 opt-in Personal Vault 경계로 둔다.

- local encryption과 explicit retention
- selective per-project sharing decision
- item-level revision, retraction, deletion과 expiry
- source, counterexample와 decision lineage
- project Evidence 또는 accepted state 자동 승격 금지
- identity, affect, personality와 preference 추론의 automatic durable write 금지

workspace-level continuity를 `project:user`, `project:personal`, `project:global` 같은
fake project로 표현하지 않는다. 이 문서는 Personal Vault implementation이나
canonical Personal Perspective persistence를 승인하지 않는다.

### 12.4 Task context selection

Personal Perspective는 모든 task에 자동 관련되지 않는다. accepted item도 task
relevance, scope, freshness, sharing consent, data classification와 `why_included` 없이
TaskContextPacket에 들어가지 않는다. contested, model-inferred, retracted 또는 deleted
personal item을 silently inject하지 않는다. `Context ≠ Truth`를 그대로 적용한다.

### 12.5 Required future architecture decision

Personal Perspective persistence 전에 personal subject/principal identity, ownership,
workspace-scoped proposal, review, authorization, Decision/Transition, retention,
deletion, selective project sharing, context inclusion, remote egress, backup/restore,
cross-project isolation, shared-workspace와 multi-user isolation을 함께 다루는 별도
architecture decision이 필요하다. 이 목록은 runtime identity contract를 도입하지
않는다. 현재 PR은 새 protocol type, production TypeScript contract, DB table, API
route, state-transition path 또는 TaskContextPacket field를 승인하지 않는다.

### 12.6 Lab Diagnostics

SelfModel, DriveState, EES, Sidecar 같은 내부 신호는 Lab 또는 Control/View다. Evidence Registry와 혼합하지 않는다.

---

## 13. Privacy, Egress and Retention

### 13.1 data classification

```text
public_safe
private
local_only
secret
```

### 13.2 retention classes

```text
none
hash_only
bounded_summary
encrypted_local
public_safe_artifact
explicit_exception
```

### 13.3 기본 금지

- raw hidden reasoning 저장
- secret 전송
- raw transcript 자동 수집
- provider response 전체 기본 보관
- native memory 자동 import
- source 없는 accepted memory

### 13.4 artifact posture

원문이 필요하면 semantic DB가 아니라 별도 artifact store를 고려한다.

```text
artifact hash
media type
size
storage ref
encryption class
retention
source ref
```

원본 삭제나 접근 상실은 tombstone과 projection invalidation event를 발생시켜야 한다.

---

## 14. Zero-Model Mode

다음 path는 모델 없이 테스트되고 지원되어야 한다.

```text
project creation/read
state and Claim query
Evidence registration
RunReceipt write
proposal creation
ReviewDecision
StateTransitionReceipt
Current Working Perspective deterministic projection
timeline and lineage
portable export
recovery backup/restore
```

모델 호출 불가 시 candidate enrichment만 비활성화하고 Core continuity는 유지한다.

---

## 15. Compatibility and Versioning

### 15.1 independent versions

```text
Core Protocol vN
DB Schema vN
OpenAI Adapter vN
Generic CLI Adapter vN
Inspector vN
Lab Experiment vN
```

전부 하나의 `Augnes v0.1` 버전으로 묶지 않는다.

### 15.2 compatibility mapping

기존 objects는 다음처럼 mapping할 수 있다.

```text
Work Brief / Handoff Capsule
→ TaskContextPacket compatibility view

Codex Result Report / Runner DeltaBatch
→ RunReceipt compatibility input

ExpectedObservedDelta / Reuse Outcome
→ EpisodeDeltaProposal subrecord 또는 feedback event

Operator Review Decision
→ ReviewDecision

Autonomy Contract / Autohunt grant
→ AutomationPolicy compatibility view
```

### 15.3 fail-closed

- 알 수 없는 protocol version
- capability mismatch
- expired context or grant
- source project mismatch
- unclassified egress
- secret-shaped material
- duplicate conflicting receipt

은 명시적인 blocked result를 반환한다.

---

## 16. Technical Invariant Checklist

- [ ] Core canonical schema에 vendor-specific 필수 field가 없다.
- [ ] 모든 durable record는 project identity를 가진다.
- [ ] ExternalRef는 canonical state key가 아니다.
- [ ] check/read/preview path는 durable write를 하지 않는다.
- [ ] proof 기록은 committed project state를 만들지 않는다.
- [ ] RunReceipt는 approval을 만들지 않는다.
- [ ] Decision과 Transition이 분리된다.
- [ ] projection은 source refs와 time basis를 가진다.
- [ ] adapter는 coverage를 과장하지 않는다.
- [ ] 모델 없이 Core closed loop의 핵심 경로가 동작한다.
- [ ] raw secret, transcript와 hidden reasoning은 기본 저장되지 않는다.
- [ ] duplicate event/receipt가 idempotent하다.
- [ ] backup과 restore가 checksum·refs를 보존한다.
