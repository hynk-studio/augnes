# Augnes vNext Masterplan
## Provider-Neutral Temporal Project Substrate with an OpenAI-Integrated Default

> **문서 지위:** 활성 제품 북극성 및 전략 기준
> **버전:** v0.1
> **기준일:** 2026-07-10 KST
> **상위 규약:** `SSOT_SCHEMA_BUNDLE`, `SSOT_CANONICAL`, `SSOT_LOGGING_POLICY`
> **하위 문서:** Architecture & Protocol, Transition Roadmap, Evaluation & Maturity
> **대체 범위:** 2026-07-09 이전의 active roadmap 및 surface 중심 planning authority

---

## 0. Executive Decision

Augnes를 독립적인 범용 AI 작업 앱이나 또 하나의 agent shell로 확장하지 않는다.

ChatGPT Work, Codex, Claude Code, Gemini CLI, 로컬 에이전트와 향후 실행 호스트는 각각 작업을 수행하는 실행면이다. Augnes는 이들과 경쟁하여 채팅, 코드 편집, 터미널, 브라우저, diff, PR review, worktree, scheduler를 다시 만들지 않는다.

Augnes가 장기적으로 소유할 것은 다음이다.

```text
무엇이 관찰되었는가
무엇이 근거인가
무엇이 주장인가
무엇이 서로 충돌하는가
무엇이 변경 후보인가
누가 무엇을 어떤 근거로 판단했는가
현재 Perspective가 어떻게 형성되었는가
어떤 과거 문맥이 다음 작업에 실제로 도움이 되었는가
```

따라서 Augnes의 공식 제품 정의는 다음과 같다.

> **Augnes는 여러 AI 모델과 실행 호스트에서 발생한 관찰, 근거, 주장, 실행 결과와 변경 후보를 시간축으로 연결하고, 검토된 Perspective와 지속 가능한 인간의 결정으로 승격시키는 로컬 우선 공급자 중립 프로젝트 기질층이다.**

영문 정의:

> **Augnes is a provider-neutral, local-first temporal project substrate that turns cross-host observations, evidence, claims, run outcomes, and proposed changes into reviewed perspective and durable human decisions.**

제품의 가장 짧은 운영 문장은 다음이다.

```text
호스트와 모델은 실행한다.
Augnes는 의미와 계보를 보존한다.
사용자는 무엇이 프로젝트의 사실이 되는지 결정한다.
```

이 Core 정의 아래의 제품 경험은 다음과 같다.

> **Augnes는 native AI host가 가장 강한 환경에서 실행하게 하면서, 사용자 소유 Project Home과 Semantic Workbench가 cross-host continuity를 보존하고 Evidence와 Claim을 조정하며 제안된 변화를 지속 가능한 인간의 결정으로 바꾼다. Inspector는 두 surface에 공통 drill-down과 lineage 탐색을 제공한다.**

범용 실행 shell을 만들지 않는다는 결정은 Augnes가 자체 Project Home이나
Semantic Workbench를 포기한다는 뜻이 아니다. Augnes는 Resume을 위한 인간
front door, cross-host Verify·Decide를 위한 능동 semantic work surface, 그리고
공통 provenance explorer를 직접 소유한다.

---

## 1. Product Compass: Resume, Verify, Decide

Augnes의 기능 범위는 세 단어로 제한한다.

### 1.1 Resume

Augnes는 다음 작업자가 현재 프로젝트의 좌표를 빠르게 회복하게 해야 한다.

```text
지금 프로젝트가 어디까지 왔는가?
현재 목표와 제약은 무엇인가?
어떤 가정이 accepted, rejected, stale 또는 unresolved인가?
무엇을 반복 설명하지 않아도 되는가?
이번 작업에 어떤 context가 실제로 필요한가?
```

Resume의 품질은 저장량이 아니라 첫 올바른 행동까지의 시간, 잘못된 문맥 수정 횟수, 반복 설명량으로 평가한다.

### 1.2 Verify

Augnes는 관찰, 보고, 해석과 근거를 분리해야 한다.

```text
무엇이 실제로 실행되었는가?
누가 직접 관찰했고 누가 단순 보고했는가?
어떤 artifact와 source가 존재하는가?
어떤 검사가 통과했고 무엇이 생략되었는가?
어떤 Claim이 반박되거나 supersede되었는가?
```

Verify의 품질은 provenance completeness, source-less accepted state의 부재, stale·contradiction 탐지율, receipt 신뢰 유형의 명확성으로 평가한다.

### 1.3 Decide

Augnes는 후보와 durable state 사이의 의미적 경계를 관리해야 한다.

```text
무엇을 accept할 것인가?
무엇을 reject, defer, supersede 또는 retract할 것인가?
어떤 변경이 프로젝트 Perspective에 반영되는가?
어떤 외부 행동이 승인되었는가?
```

Decide의 품질은 review burden, decision debt, 무승인 durable write와 외부 행동의 부재, 결정 계보의 설명 가능성으로 평가한다.

새 기능이 Resume, Verify, Decide 중 어느 것도 실질적으로 개선하지 않으면 Augnes의 핵심 기능이 아닐 가능성이 높다.

---

## 2. 보존하는 설계 유산

vNext는 기존 장기 관점 마스터플랜을 폐기하지 않는다. 다음 원칙은 Augnes의 장기 정체성으로 계속 유지한다.

### 2.1 User-owned, local-first continuity

장기 프로젝트의 상태와 판단 계보는 provider, 채팅창, 모델 세션이나 worker가 소유하지 않는다. 사용자의 로컬 Augnes workspace가 소유한다.

### 2.2 Memory와 continuity의 분리

```text
Evidence / accepted state
= 사실과 Claim의 근거 및 승인된 프로젝트 상태

Reviewed Memory
= 미래 작업에서 재사용할 가치가 검토된 지식

Continuity
= 현재 작업을 이어가기 위해 선택한 좌표와 문맥
```

Native ChatGPT/Codex memory는 편의와 개인화에 사용할 수 있지만 Augnes의 accepted project state나 reviewed memory를 자동 대체하지 않는다.

### 2.3 Candidate-first, reviewed promotion later

모델 출력, provider extraction, 연구 요약, Codex 결과의 해석, retrieved material은 처음에는 candidate다. 직접 관찰된 실행 telemetry는 observation일 수 있지만, 그 의미에 대한 해석은 여전히 candidate다.

### 2.4 Work leaves residue

모든 의미 있는 작업은 최소한 다음을 남긴다.

```text
목표
사용한 context refs
실행 환경과 action
changed artifacts
검증과 skipped checks
남은 불확실성
expected vs observed 차이
제안되는 semantic delta
```

이 residue는 raw transcript나 숨은 reasoning dump가 아니라 bounded refs, hashes, observations와 summaries로 남긴다.

### 2.5 Source anchors over generated views

요약, GuideBrief, Current Working Perspective와 Inspector 화면은 View다. View는 source와 decision lineage로 역추적할 수 있어야 하며 자체 권위를 만들지 않는다.

### 2.6 Context is selected working material, not truth

Task-start context는 가능한 모든 정보를 넣은 dump가 아니라 bounded selection이다. `why_included`, freshness, gaps, excluded refs, reuse boundary와 context budget을 보존한다.

### 2.7 Perspective has a lifecycle

Perspective를 구성하는 Claim, memory, assumption과 tension은 강화·약화·반박·supersede·retire될 수 있다. 현재 Perspective는 과거 기록을 덮어쓰지 않고 revision lineage 위에 형성된다.

### 2.8 User steers semantic formation

자동 관찰과 후보 생성은 허용한다. durable project state, durable Perspective, reviewed memory와 외부 side effect는 명시적인 사용자 또는 권한 있는 Core gate를 거친다.

### 2.9 Projection before actuation

Augnes의 기본 가치는 자동 실행보다 context, evidence, delta와 판단 대상을 명확히 투영하는 데 있다. 자동 실행은 별도 `AutomationPolicy`와 native host 권한 아래 제한적으로 다룬다.

### 2.10 External pressure beats echo

현재 Perspective는 반례, contradiction, source gap, stale memory와 반복 실패에 의해 압박받아야 한다. 다만 이 진단은 Evidence나 approval authority가 아니다.

### 2.11 Improvement must be outcome-backed

문서, 타입, panel, record와 metric의 존재만으로 개선을 주장하지 않는다. 과거 문맥이 다음 작업을 실제로 바꾸고 이후 outcome에서 도움이 되었는지 확인한다.

### 2.12 Boundary is operating envelope, not product center

권한 경계와 안전 규칙은 기능을 안전하게 만드는 장치다. 경계 문구, approval gate와 no-write smoke 자체를 제품 가치나 개발 진척으로 계산하지 않는다.

### 2.13 Selective Semantic Codification

Augnes는 knowledge, perspective와 work 자체를 code로 환원하지 않는다. Resume,
Verify 또는 Decide를 개선하는 범위에서만 그 형성, 관계, provenance, 사용, review와
revision을 선택적이고 점진적으로 구조화한다. 원문과 source anchor는 generated
structure로 대체하지 않는다.

Derived semantic object와 relation은 source, project/scope, temporal validity 또는
recorded time, epistemic basis와 revision lineage로 역추적할 수 있어야 한다.
구조적 형식성, epistemic authority와 execution/actuation authority는 서로 독립이다.
따라서 structured result는 그 자체로 truth, approved Evidence, accepted state,
reviewed memory, Perspective authority, Decision 또는 Transition을 만들지 않는다.

Formalization은 maximal schema가 아니라 reviewable progression을 따른다. unknown과
insufficiently supported state를 보존하며, object·relation·schema·panel 수가 아니라
실제 outcome 개선으로 제품 가치를 판단한다.

---

## 3. 핵심 불변식

```text
Structure ≠ Authority
Summary ≠ Authority
Projection ≠ Source of Truth
Context ≠ Truth
Receipt ≠ Evidence Approval
Host Completion ≠ Task Success
Assessment ≠ Decision
Evidence ≠ Claim
Claim ≠ State
Relation Assertion ≠ Verified Relation
Proof ≠ Project State
Decision ≠ Transition
Task Completion ≠ Work Closure
PR Creation ≠ Merge Authority
PR Merge ≠ Semantic Commit
Native Permission ≠ Augnes Approval
Native Memory ≠ Reviewed Perspective Memory
Model Confidence ≠ Claim Confidence
Model Agreement ≠ Verification
Lab Diagnostic ≠ Evidence
Model Inference ≠ User Identity
Task Choice ≠ Global Identity Update
Personal Perspective ≠ Project Truth
```

이 불변식은 특정 UI나 provider보다 우선한다.

---

## 4. Augnes가 소유하는 것과 소유하지 않는 것

### 4.1 Augnes Core가 소유하는 것

- project와 workspace identity
- accepted temporal state와 transition history
- Evidence Registry와 source lineage
- Claim과 `revises`, `supersedes`, `contradicts`, `supports` 관계
- Work와 Run의 시간축
- AugnesDelta와 proposal
- 사용자 ReviewDecision
- grant, policy, budget, stop conditions
- durable Perspective와 reviewed Memory
- tension, risk, knowledge gap
- semantic commit과 audit projection
- provider-neutral identifiers와 external refs

### 4.2 Augnes가 소유하지 않는 것

- 일반 채팅 UI
- 코드 에디터와 diff editor
- 터미널과 worktree manager
- 브라우저·Computer Use runtime
- native PR review UX
- generic scheduler
- provider conversation memory
- hidden reasoning
- 외부 시스템의 canonical content
- GitHub merge authority

외부 시스템의 source of truth를 복제하지 않는다.

```text
GitHub
= code와 PR history의 source of truth

원문 저장소
= 문서 원본의 source of truth

Agent Host
= native task와 execution surface

Augnes
= refs, receipts, evidence relation, semantic delta,
  decision과 Perspective의 source of truth
```

---

## 5. 목표 제품 구조

```text
┌──────────────────────────────────────────────────────────┐
│ Native Agent and Execution Homes                         │
│ ChatGPT Work · Codex · Claude/Cowork/Claude Code         │
│ Gemini/Gemini CLI · Local/IDE/CI Agents · Pipelines      │
└──────────────────────────↕───────────────────────────────┘
                TaskContextPacket / RunReceipt
┌──────────────────────────↕───────────────────────────────┐
│ Augnes Integration Kit and Protocol                      │
│ Adapters · Model Gateway · MCP/Hooks/HTTP/File transport │
│ TaskContextPacket · RunReceipt · Proposal · Decision     │
└──────────────────────────↕───────────────────────────────┘
┌──────────────────────────↕───────────────────────────────┐
│ Temporal Evidence · Claim · Work · Run · Delta Core      │
│ Decisions · Grants · Perspective · Memory · Gaps         │
└──────────────────────────↕───────────────────────────────┘
┌──────────────────────────↕───────────────────────────────┐
│ Augnes Project Home + Augnes Semantic Workbench          │
│ Resume and coordination · cross-host Verify and Decide   │
└──────────────────────────↕───────────────────────────────┘
                    shared drill-down
┌──────────────────────────↕───────────────────────────────┐
│ Inspector and shared projections                         │
│ CWP · Attention · Timeline · Evidence · Runs · Lineage   │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Augnes Lab                                              │
│ PE · EES · Sidecar · Meta-WM · BSL · CompIndex          │
│ loopness · Constellation · residual experiments         │
│ 항상 non-authoritative                                 │
└─────────────────────────────────────────────────────────┘
```

물리적으로 처음부터 저장소나 서비스 다섯 개로 나눌 필요는 없다. 그러나 코드, 데이터, 권한과 의존성은 이 경계를 따라야 한다.

---

## 6. Default Profile: OpenAI-Integrated, Provider-Neutral Core

### 6.1 기본 사용자 경험

Augnes의 기본 배포와 문서는 다음을 우선한다.

```text
default_host         = ChatGPT Work
default_worker       = Codex
default_reasoning    = OpenAI API
default_plugin       = Augnes OpenAI Integration
default_scheduler    = ChatGPT Scheduled Tasks when applicable
default_review_ui    = host-native compact review card
                     + Augnes Semantic Workbench
                     + Inspector drill-down
                     + Project Home attention/decision entry points
```

이 기본값은 사용자 경험과 reference implementation을 정한다. Core의 의미와 schema를 OpenAI 전용으로 만들지는 않는다.

### 6.2 provider-neutral 약속

- Core contract에 ChatGPT project ID, Codex task ID나 OpenAI model ID를 필수 canonical field로 두지 않는다.
- host, provider, model, session, task와 PR ID는 `ExternalRef`로 저장한다.
- provider 교체가 Core migration을 요구하지 않게 한다.
- 최소 한 개의 Generic CLI adapter를 중립성 검증용 reference로 유지한다.
- 다른 provider 지원은 실제 수요와 conformance를 기준으로 추가한다.

### 6.3 OpenAI API의 독립 역할

OpenAI API는 ChatGPT-Codex와 중복되는 두 번째 채팅 엔진이 아니다. vNext에서 다음 역할을 맡는 기본 programmatic reasoning backend다.

- bounded claim extraction
- RunReceipt의 의미 분석
- EpisodeDeltaProposal 후보 생성
- contradiction candidate 생성
- Perspective synthesis candidate
- research source extraction과 요약 후보
- headless·server·batch 분석
- 구조화된 JSON schema output
- 평가와 provider 비교의 reference lane

OpenAI API 호출은 Core 파일 곳곳에서 직접 수행하지 않는다.

```text
Augnes Core / workflow
→ Model Gateway
→ OpenAI API Adapter
```

Model Gateway는 egress, 개인정보, retention, 비용, timeout, provenance와 usage receipt를 통제한다.

### 6.4 Model Router의 지위

자동 Model Router는 초기 핵심이 아니다. 처음에는 사용자가 provider/model을 선택하거나 policy가 단일 provider를 지정한다.

자동 routing은 다음이 확인된 뒤에만 도입한다.

- 두 개 이상의 실제 adapter가 같은 계약을 만족한다.
- 품질·비용·지연 데이터가 존재한다.
- fallback의 의미 변화가 측정 가능하다.
- privacy 등급별 경로가 검증됐다.
- specialist model의 실제 이점이 확인됐다.

---

## 7. Canonical Exchange Contracts

### 7.1 보편 계약

#### `TaskContextPacket`

작업 시작 전에 host 또는 worker에 제공하는 bounded reviewed context다.

```text
목표와 성공 조건
현재 Perspective projection
관련 accepted state와 memory refs
open tensions, risks, gaps
source와 freshness
required checks
forbidden actions
budget와 expiry
capability grant
return expectations
```

명령이나 source of truth가 아니다.

#### `RunReceipt`

실제 실행과 결과를 공급자 중립적으로 기록한다.

```text
host/worker/provider refs
실행 환경
changed artifacts
commands와 checks
skipped reasons
external refs
privacy/egress outcome
cost·latency·retry
bounded output summary
coverage와 provenance trust
```

실행 telemetry와 모델 해석을 분리한다.

#### `EpisodeDeltaProposal`

Run과 source material이 프로젝트 의미에 제안하는 변화를 표현한다.

```text
Observed
Attested
Inferred
Proposed
Contradicted
Missing
Authority
```

state를 직접 변경하지 않는다.

#### `ReviewDecision`

candidate를 사용자가 어떻게 처리했는지 기록한다.

```text
accept
reject
defer
supersede
retract
```

실제 durable transition과 구분한다.

### 7.2 선택 계약

#### `AutomationPolicy`

native scheduler, CI, server worker 또는 다른 반복 실행기가 사용할 범위와 중단 조건을 정의한다.

모든 수동 작업에 강제하지 않는다.

---

## 8. Authority, Capability and Coverage

### 8.1 actor classes

```text
user_operator
augnes_core
agent_host
reasoning_backend
worker_runtime
external_actuator
observability_surface
```

UI 이름은 authority identity가 아니다. 같은 통합앱에 Chat, Work와 Codex가 있어도 권한은 역할과 capability로 구분한다.

### 8.2 capability examples

```text
read_context
propose_candidate
execute_filesystem
execute_shell
use_network
use_browser
create_branch
open_pull_request
record_receipt
publish_external
commit_semantic_state
```

유효 capability는 다음의 교집합이다.

```text
declared
∩ configured
∩ authorized
∩ environment_available
```

### 8.3 coverage levels

```text
enforced
observed
advisory
outside_coverage
```

관찰 가능하다는 사실을 강제 가능하다고 표현하지 않는다. native permission과 Augnes semantic approval도 분리한다.

### 8.4 세 개의 gate

```text
Host Execution Gate
= 파일·shell·network·browser 사용

External Effect Gate
= PR, publish, message, deployment, 외부 시스템 변경

Semantic Commit Gate
= state, Perspective, durable memory와 work closure
```

각 gate는 별도의 질문과 receipt를 가진다.

---

## 9. Temporal, Evidence and Claim Commitments

### 9.1 triple-time semantics

모든 중요한 event와 Claim은 다음 시간을 구분한다.

```text
event_time
observed_time
recorded_time
```

vNext는 다음 질의 의미를 제공해야 한다.

```text
valid_at(t)
known_at(t)
recorded_at(t)
```

### 9.2 Claim은 덮어쓰지 않는다

기존 Claim을 수정하여 과거를 지우지 않는다.

```text
revises
supersedes
contradicts
supports
narrows
```

관계로 새 Claim을 연결한다.

### 9.3 provenance trust

동일한 receipt 안에서도 신뢰 유형을 구분한다.

```text
direct_local_observation
verified_external_observation
host_attestation
provider_report
user_declaration
imported_unverified
derived_interpretation
```

### 9.4 projection은 재구축 가능해야 한다

Current Working Perspective, Attention Queue, Evidence Pack, Timeline, metrics와 Constellation은 원본 aggregate와 event에서 재생성할 수 있어야 한다.

---

## 10. Multi-Project and Zero-Model Commitments

### 10.1 multi-project isolation

Augnes는 `project:augnes` 한 프로젝트만을 위한 시스템이 아니다.

- workspace와 project identity를 분리한다.
- state, evidence, memory, grants, runs와 decisions는 project scope를 가진다.
- cross-project reuse는 명시적 policy와 source 표시를 요구한다.
- 한 프로젝트의 context가 다른 프로젝트에 암묵적으로 주입되지 않는다.
- archive, export, restore와 deletion 경계도 project별로 검증한다.

### 10.2 zero-model Core

모델 호출 없이도 다음 기능은 완전하게 동작해야 한다.

```text
project 열기
accepted state와 Perspective 읽기
Evidence와 Claim lineage 조회
RunReceipt 기록
proposal과 decision
state transition
Inspector timeline
portable export
recovery backup과 restore
```

모델은 extraction, synthesis, contradiction과 recommendation을 보조한다. Core의 생명유지장치가 아니다.

### 10.3 Personal Perspective long-term research direction

Augnes의 현재 기본 제품은 project-centered provider-neutral temporal substrate다.
그 위에서 사용자 소유의 opt-in Personal Perspective layer를 장기 연구 방향으로 둔다.
Personal Perspective는 self-concept, identity, personality, values, world models,
aspiration, decision principles와 persistent tensions를 fixed model-assigned essence가
아니라 revisable, source-backed self-understanding으로 다룬다.

이 layer는 cross-project continuity를 개선할 수 있지만 Personal Vault persistence,
project sharing과 task-context inclusion은 자동이 아니다. model inference는 candidate일
뿐 user identity가 아니며, Personal Perspective는 Project Core truth나 모든 task의
기본 context가 아니다. 세부 연구 경계는
[`research/AUGNES_PERSONAL_PERSPECTIVE_RND_PROGRAM_V0_1.md`](./research/AUGNES_PERSONAL_PERSPECTIVE_RND_PROGRAM_V0_1.md)를
따른다.

---

## 11. UX Strategy

### 11.1 Native Agent and Execution Homes

기본 작업은 native host에서 수행한다.

Native host는 일반 대화와 연구·문서 작성, 코드·테스트·diff·PR 작업,
terminal·browser·computer-use 실행, worktree, provider-native task/session UX,
host-native scheduling과 permission/sandbox를 소유한다. Augnes는 이를 범용
execution shell로 복제하지 않는다.

ChatGPT Work, Codex나 다른 host 안에서는 다음의 compact card만 제공한다.

```text
Now
What changed
Evidence and gaps
Proposed delta
Why judgment is needed
Accept / Reject / Defer / Supersede
```

compact card는 bounded context와 judgment entry를 native UX 안에 제공하지만
Augnes Project Home, Semantic Workbench 또는 상세 Inspector를 대체하지 않는다.

### 11.2 Augnes Project Home

현재 Blank State는 목표 Project Home의 runtime predecessor이며 목표 책임의
일부를 현재 수행한다. Project Home은 Resume을 위한 인간 소유 front door로서
다음을 소유하거나 조합한다. 목표 Project Home이 완전히 구현됐다는 뜻은 아니다.

```text
current project coordinates와 Current Working Perspective
goals, constraints와 active work portfolio
agent/run activity와 current attention
unresolved tensions, risks, gaps와 decision debt
pending proposals와 decisions
recent meaningful changes와 recommended next moves
native host와 Semantic Workbench 진입점
bounded resume context
```

Project Home은 empty start screen, card warehouse, passive readback directory,
workflow-stage panel collection, duplicate execution console 또는 긴 authority
copy page가 아니다. 상세 provenance 탐색은 Inspector에 맡긴다. 전환 중에는
`Blank State` 이름과 `/` route를 유지할 수 있으며, 목표 구현이 이미 완성된
것으로 주장하지 않는다.

### 11.3 Augnes Semantic Workbench

현재 Agent Workplane/Workbench는 목표 Semantic Workbench의 runtime
predecessor이며 목표 책임의 일부를 현재 수행한다. 목표 Semantic Workbench가
완전히 구현됐다는 뜻은 아니다. Workbench는 특정 host가 아직 못 하는 기능의
잔여 집합이 아니라, 어느 단일 provider나 native host도 canonical project
semantics로 소유해서는 안 되는 cross-host·cross-time 책임으로 정의한다.

```text
cross-host result와 plan-versus-result 비교
multiple RunReceipt와 observation-versus-attestation 비교
Evidence/Claim reconciliation, contradiction와 uncertainty review
expected-versus-observed analysis
EpisodeDeltaProposal review/edit와 ReviewDecision 준비·제출
Perspective change와 reviewed-memory promotion 후보 검토
residual work, dependency와 next TaskContextPacket context composition
cross-host handoff, lineage와 user-governed semantic decisions
```

Semantic Workbench는 general chat, code/document editor, terminal, browser,
Git diff/PR review, worktree, generic scheduler 또는 provider-native session
manager를 복제하지 않는다. 목표 진화는 Workplane 제거가 아니라
execution-oriented Agent Workplane에서 cross-host semantic coordination과
decision surface로의 전문화다.

### 11.4 Augnes Inspector

Inspector는 Project Home과 Semantic Workbench가 함께 사용하는 read-heavy
drill-down과 provenance exploration surface다.

```text
Timeline
Evidence & Claims
Work & Runs
Artifacts & Source References
Decisions & Grants
Perspective Lineage
Integration Health & Capability Coverage
Lab diagnostics when explicitly separated
```

Inspector는 상세 explorer, audit/lineage surface, shared drill-down system과
projection composition layer다. 채팅·코드 편집·실행 shell이 아니며, sole
front door, Blank State나 Workplane의 유일한 대체재, source of truth, durable
authority surface 또는 active proposal/decision work의 대체재도 아니다.

### 11.5 Product Compass와 surface 책임

| 책임 | Native Host | Project Home | Semantic Workbench | Inspector |
|---|---|---|---|---|
| 일반 대화와 연구 | 주 실행·작성 | 좌표와 진입점 | cross-host 결과 검토 | source drill-down |
| 코드·테스트·diff·PR | 주 실행·검토 | activity/next move | 결과·receipt 비교 | artifact lineage |
| 현재 project coordinates | context 소비 | **주 책임: Resume** | 작업 context 소비 | 상세 시점·source |
| Perspective·goals·attention | bounded context 소비 | **주 조정 책임** | 변경 후보 검토 | lineage 탐색 |
| native execution | **주 책임** | 실행 진입점 | receipt 소비 | run 상세 |
| result comparison | 결과 생산 | attention 요약 | **주 책임: Verify** | 근거 drill-down |
| Evidence·Claim reconciliation | source 제공 | tension/gap 요약 | **주 책임: Verify** | 상세 관계 탐색 |
| EpisodeDeltaProposal review | compact card 가능 | pending entry | **주 책임: Decide 준비** | basis drill-down |
| ReviewDecision | intent entry 가능 | pending/debt entry | **주 책임: Decide** | decision lineage |
| next-context composition | packet 소비 | resume frame | **주 composition 책임** | source 선택 근거 |
| 장기 lineage와 audit | external refs 제공 | recent change 요약 | active lineage 소비 | **주 drill-down 책임** |

Resume은 Project Home, Context Compiler, Current Working Perspective와
attention/work portfolio projection이 주로 지원한다. Verify는 Semantic
Workbench의 비교·reconciliation과 Inspector의 Evidence, RunReceipt, Timeline,
artifact lineage가 주로 지원한다. Decide는 Semantic Workbench의 proposal,
ReviewDecision, Perspective/reviewed-memory 검토와 명시적 Core gate가 주로
지원한다. Inspector는 세 compass 모두를 drill-down으로 지원하지만 Home이나
Workbench의 능동 interaction을 대체하지 않는다.

현재 Blank State와 Agent Workplane의 유용한 기능은 각각 Project Home과
Semantic Workbench로 전문화한다. 과거 Cockpit과 passive readback 중 중복되는
부분은 shared projection과 Inspector composition으로 정리하되, parity와
migration evidence 없이 유용한 기능을 `흡수`라는 말로 제거하지 않는다.

---

## 12. Canonical Closed Loop

Augnes의 최소 유효 제품 루프는 다음이다.

```text
1. TaskContextPacket
   현재 Perspective, selected refs, constraints와 gaps를 제공

2. Native Host / Worker Execution
   ChatGPT-Codex가 기본, 다른 adapter도 가능

3. RunReceipt
   실제 실행, artifacts, checks, skips와 provenance를 기록

4. Evidence / Claim Processing
   직접 관찰, attestation과 모델 해석을 분리

5. EpisodeDeltaProposal
   observed / inferred / proposed / contradicted / missing 정리

6. ReviewDecision
   사용자가 accept / reject / defer / supersede / retract

7. Optional Semantic Transition
   승인 범위 안에서 state, Perspective 또는 memory 변경

8. Context Compiler Refresh
   다음 TaskContextPacket의 선택과 경고가 변화

9. Later RunReceipt
   변경된 context가 실제로 도움이 되었는지 평가
```

폐쇄루프의 핵심은 중간 레코드 개수가 아니라 인과 계보가 닫히는 것이다.

---

## 13. Development Posture and Complexity Budget

### 13.1 PR-centered workflow

```text
ChatGPT
= 목표, context, 설계와 PR review

Codex 또는 다른 worker
= 코드 수정, 테스트와 PR 생성

사용자
= merge와 semantic decision

Augnes
= receipt, evidence, delta, decision과 Perspective lineage
```

### 13.2 vertical slice 우선

좋은 작업 단위:

```text
real input
→ provider-neutral contract
→ Core normalization
→ 실제 projection 또는 decision
→ behavior test
→ 다음 작업에서 사용할 signal
```

피해야 할 작업 단위:

```text
새 policy 문서
→ 새 table
→ passive panel
→ 존재 여부 smoke
→ 실제 consumer와 outcome 없음
```

### 13.3 complexity budget

- 새 top-level 계약은 기존 계약을 흡수하거나 종료해야 한다.
- 새 장기 table은 독립 lifecycle과 query 무결성이 필요한 aggregate일 때만 허용한다.
- 새 workflow-stage surface보다 Project Home·Semantic Workbench·Inspector의
  기존 책임 안에서 projection composition을 우선한다.
- 새 상태 enum은 canonical lifecycle로 표현할 수 없는 경우에만 추가한다.
- 기능마다 authority 문구를 복사하지 않고 공통 policy renderer와 invariant를 사용한다.
- active docs에서는 obsolete planning residue를 제거한다.

---

## 14. Product Success and Scope Gates

### 14.1 계속 투자할 조건

- resume-to-first-correct-action이 개선된다.
- wrong-context correction과 반복 설명이 줄어든다.
- stale·contradictory context가 재작업 전에 발견된다.
- accepted memory가 실제 다음 task에서 유용하게 재사용된다.
- review burden이 예방한 재작업 비용보다 낮다.
- 두 개 이상의 adapter가 같은 Core 계약을 사용한다.

### 14.2 governance/evidence plugin으로 축소할 조건

- continuity와 evidence 가치는 있지만 standalone Inspector 사용이 낮다.
- 대부분의 실행 UX는 native host가 더 잘 제공한다.
- cross-provider normalization과 audit만 지속적으로 유용하다.

이 경우 Core와 Integration Kit는 유지하고 UI 투자를 줄인다.

### 14.3 중단하거나 재설계할 조건

- 여러 실제 task에서 memory와 continuity가 resume 품질을 개선하지 못한다.
- 사용자가 생성된 context를 반복적으로 무시하거나 수정한다.
- review 비용이 방지한 오류보다 크다.
- 두 번째 adapter가 공통 계약을 만족하지 못한다.
- critic·ensemble·router가 품질을 높이지 않고 비용만 늘린다.

### 14.4 즉시 lane을 비활성화할 조건

- secret 또는 raw private transcript 외부 유출
- 무승인 durable write
- 무승인 external actuation
- recovery restore rehearsal 실패
- authority coverage 과장

---

## 15. Explicit Non-Goals

vNext는 다음을 목표로 하지 않는다.

- 새 범용 AI 작업 앱
- 새 chatbot
- 범용 multi-model broker
- ChatGPT-Codex 통합앱 복제
- 모든 provider 즉시 지원
- model 합의를 truth로 취급
- hidden reasoning 저장
- raw provider output 기본 보관
- 자동 memory 생성
- 자동 Perspective promotion
- 자동 Personal Perspective persistence 또는 task-context injection
- 무승인 scheduled external action
- Augnes의 GitHub merge authority
- 기존 DB 즉시 폐기
- graph DB first
- raw multimodal bulk storage
- multi-agent senate를 초기 중심 기능으로 도입

---

## 16. Document and Historical Authority

- 본 문서는 현재 활성 제품 전략의 유일한 북극성이다.
- `02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`는 본 문서의 기술 의미를 구현한다.
- `03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`는 current repo를 본 문서로 이동시킨다.
- 원본 19개 제안 마스터플랜은 설계 Genesis와 장기 연구 철학으로 보존한다.
- 2026-07-09 repo-aligned v2는 당시 성숙도 스냅샷과 outcome discipline으로 보존한다.
- provider-neutral redesign proposal은 본 문서에 흡수된 제안 문서로 보존한다.

---

## 17. Final North Star

Augnes의 장기 가치는 더 많은 것을 기록하거나 더 많은 모델을 호출하는 데 있지 않다.

> **여러 모델과 호스트가 번갈아 일해도, 무엇이 실제 관찰이었고 무엇이 주장인지, 어떤 근거가 있었고 무엇이 충돌했는지, 사용자가 어떤 판단으로 현재 Perspective와 프로젝트 상태를 형성했는지를 잃지 않는 것.**

그리고 과거 기록은 다음 작업의 출발 좌표를 실제로 개선해야 한다.

```text
과거 작업이 남는다.
→ 필요한 문맥만 다음 작업에 선택된다.
→ 실행 결과가 검증 가능한 receipt로 돌아온다.
→ 의미 변화가 review된다.
→ 현재 Perspective가 갱신된다.
→ 다음 작업의 첫 올바른 행동이 빨라진다.
```

이 루프가 Augnes vNext의 북극성이다.
