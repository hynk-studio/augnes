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

> **Augnes는 native AI host가 가장 강한 환경에서 실행하게 하면서, Blank State가 인간의 의도와 resumption을 단순하게 투영하고, GuideBrief가 cross-surface 상황을 설명하며, AI Workplane이 cross-host continuity·verification·semantic coordination을 수행하게 한다. Inspector는 필요한 순간에만 exact read-only drill-down을 제공한다.**

Target default top-level navigation은 Blank State와 AI Workplane 두 destination으로
제한한다. GuideBrief는 Browser, ChatGPT, Codex, Blank State와 AI Workplane에
embedded되는 non-authoritative interpretation layer이며 peer page가 아니다.
Inspector도 normal peer destination이 아니라 contextual audit surface다.

현재 runtime은 canonical Blank State, GuideBrief v0.2와 human-facing AI Workplane을
통해 operational Core를 투영한다. C5는 기존 managed-live runner ledger와
native-host lifecycle을 durable delegated Codex progress, approval attention, interruption,
explicit resume와 trusted-result boundary로 투영했다. C6는 exact reader를 보존하면서
Shared Inspector presentation을 concrete-target contextual Exact details로 demote했다.
C7은 Portability와 Recovery의 exact engine을 유지하면서 Blank State의
management/safety context와 condition-triggered recovery path 아래로 relocation한다.
C8은 같은 owning surface에 semantic visual hierarchy를 적용했으며 C0–C8은 merge되었다.
RR0는 inventory-and-planning phase일 뿐 C9 또는 runtime cleanup을 authorize하지 않는다.
Post-Build Week correction은 이 engine을
폐기하지 않고 target surface 아래로 reproject, absorb 또는 demote한다. C4는 exact
verification, proposal, decision, confirmation, application과 lineage semantics를 유지한 채
default Workbench projection을 ordinary-language AI Workplane으로 바꿨다. C5는 새
timeline persistence나 execution authority를 만들지 않았고 C6는 새 read authority나
return URL authority를 만들지 않는다. C7은 package, backup, restore 또는 recovery
authority를 새로 만들지 않는다. 이후 correction
PR 전까지 현재 code가 implemented behavior의 source of truth다.

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

Target product에서 Resume은 Blank State와 embedded GuideBrief를 통해 first correct
action까지의 시간을 최소화한다. 사용자가 project taxonomy나 protocol sequence를
먼저 해석하게 해서는 안 된다.

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

Verify의 정밀 작업은 engine과 AI Workplane이 수행하고, default human projection은
결과, verification outcome, remaining uncertainty와 risk를 ordinary language로
요약한다. exact basis와 lineage는 contextual Inspector에서 연다.

### 1.3 Decide

Augnes는 후보와 durable state 사이의 의미적 경계를 관리해야 한다.

```text
무엇을 accept할 것인가?
무엇을 reject, defer, supersede 또는 retract할 것인가?
어떤 변경이 프로젝트 Perspective에 반영되는가?
어떤 외부 행동이 승인되었는가?
```

Decide의 품질은 review burden, decision debt, 무승인 durable write와 외부 행동의 부재, 결정 계보의 설명 가능성으로 평가한다.

Decide는 raw review protocol을 사용자에게 운영하게 하지 않는다. Blank State 또는
AI Workplane은 실제로 필요한 한 가지 human decision과 consequences를 우선
surface하고, exact decision lineage는 Inspector로 progressively disclose한다.

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

GuideBrief는 이 non-authoritative 원칙을 유지하면서 active cross-surface product
responsibility를 맡는다. observed fact, bounded inference와 caveat, suggested next
action, unresolved judgment, risk, gap, staleness와 meaningful change를 Browser,
ChatGPT, Codex, Blank State와 AI Workplane에 일관되게 설명한다. GuideBrief는
`TaskContextPacket`을 대체하지 않는다. 전자는 human-readable interpretation이고,
후자는 specific task/run을 위한 exact bounded execution contract다.

### 2.6 Context is selected working material, not truth

Task-start context는 가능한 모든 정보를 넣은 dump가 아니라 bounded selection이다. `why_included`, freshness, gaps, excluded refs, reuse boundary와 context budget을 보존한다.

### 2.7 Perspective has a lifecycle

Perspective를 구성하는 Claim, memory, assumption과 tension은 강화·약화·반박·supersede·retire될 수 있다. 현재 Perspective는 과거 기록을 덮어쓰지 않고 revision lineage 위에 형성된다.

### 2.8 User steers semantic formation

자동 관찰과 후보 생성은 허용한다. durable project state, durable Perspective, reviewed memory와 외부 side effect는 명시적인 사용자 또는 권한 있는 Core gate를 거친다.

### 2.9 Projection before actuation

Augnes의 기본 가치는 자동 실행보다 context, evidence, delta와 판단 대상을 명확히 투영하는 데 있다. 자동 실행은 별도 `AutomationPolicy`와 native host 권한 아래 제한적으로 다룬다.

### 2.10 External pressure beats echo

현재 Perspective와 strategy는 반례, contradiction, source gap, stale memory와 반복
실패에 의해 압박받아야 한다. 이 pressure는 비판에 그치지 않고 source-linked local
advantage, applicability condition, transfer cost, falsifier와 regression을 갖춘 reviewable
strategy patch candidate를 만들 수 있다. 다만 이 진단과 patch는 Evidence나 approval
authority가 아니다.

### 2.11 Strategic inheritance over winner selection

Augnes는 rival strategy 중 global winner를 기본 선택하거나 consensus를 만들지 않는다.
source-bound base strategy에 대해 condition-bound local advantage를 추출하고, 무엇이 왜
전달됐는지, cost, rejected transfer, regression과 남은 disagreement를 기록한다.
within-frame strategy review와 goal/frame 자체의 review를 구분하며 최종 판단은 사용자와
Core transition gate에 남긴다.

### 2.12 Improvement must be outcome-backed

문서, 타입, panel, record와 metric의 존재만으로 개선을 주장하지 않는다. 과거 문맥이 다음 작업을 실제로 바꾸고 이후 outcome에서 도움이 되었는지 확인한다.

### 2.13 Boundary is operating envelope, not product center

권한 경계와 안전 규칙은 기능을 안전하게 만드는 장치다. 경계 문구, approval gate와 no-write smoke 자체를 제품 가치나 개발 진척으로 계산하지 않는다.

### 2.14 Selective Semantic Codification

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
Strategic Lens ≠ Perspective
Strategic Challenger ≠ Perspective Actor
Strategy Candidate ≠ Accepted Strategy
Advantage Claim ≠ Verified Benefit
Strategy Patch ≠ ReviewDecision
Regression Finding ≠ Verification
Competition Result ≠ Automatic Promotion
Model Diversity ≠ Evidence Diversity
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
Default human navigation
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ Blank State                  │  │ AI Workplane                 │
│ intent · resume · attention  │↔ │ execute · verify · prepare   │
│ result · next decision       │  │ reconcile · automate         │
└──────────────↕───────────────┘  └──────────────↕───────────────┘
               embedded GuideBrief
      observed · inferred · suggested · judgment · risk
                              ↘ contextual exact drill-down
                         ┌──────────────────────────────┐
                         │ Inspector                    │
                         │ source · lineage · audit     │
                         └──────────────────────────────┘

Provider / Runner / Tool Layer
ChatGPT · Codex · OpenAI API · MCP/App · GitHub · native hosts
local bridges · schedulers · runners · terminal/browser/diff/PR tools

Augnes Core and Integration Kit
Temporal Evidence · Claim · Work · Run · Delta · Decisions · Grants
Perspective · Memory · Gaps · adapters · gateway · protocol transports
```

Blank State와 AI Workplane만 target default top-level destination이다. GuideBrief는
embedded interpretation layer이고 Inspector는 contextual read-only surface다.
Provider, runner와 native tool은 execution power를 제공하지만 user-facing IA를
정의하지 않는다. 물리적으로 처음부터 별도 서비스로 나눌 필요는 없지만 surface,
Core, execution과 authority 책임은 이 경계를 따라야 한다.

현재 Project Home, Semantic Workbench와 Shared Inspector topology는 Build Week
reference operator implementation의 runtime truth다. 위 diagram은 planned target이며
existing route rename이나 migration 완료를 주장하지 않는다.

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
default_review_ui    = Blank State result/decision projection
                     + AI Workplane verification and preparation
                     + embedded GuideBrief interpretation
                     + contextual Inspector drill-down
```

이 기본값은 target post-Build Week 사용자 경험을 정한다. 현재 reference operator
runtime의 Project Home과 Semantic Workbench route가 이미 변경됐다는 뜻은 아니며,
Core의 의미와 schema를 OpenAI 전용으로 만들지도 않는다.

### 6.2 provider-neutral 약속

- Core contract에 ChatGPT project ID, Codex task ID나 OpenAI model ID를 필수 canonical field로 두지 않는다.
- host, provider, model, session, task와 PR ID는 `ExternalRef`로 저장한다.
- provider 교체가 Core migration을 요구하지 않게 한다.
- 최소 한 개의 Generic CLI adapter를 중립성 검증용 reference로 유지한다.
- 다른 provider 지원은 실제 수요와 conformance를 기준으로 추가한다.

### 6.3 OpenAI API의 독립 역할

OpenAI API는 ChatGPT-Codex와 중복되는 두 번째 채팅 엔진이 아니다. vNext에서 다음 역할을 맡는 기본 programmatic reasoning backend다.

- bounded claim extraction
- source-linked criterion-assessment enrichment
- bounded challenger strategy/lens generation
- local advantage extraction
- applicability, expected effect, cost, falsifier, uncertainty와 risk candidate 생성
- source-linked strategy patch와 regression candidate 생성
- EpisodeDeltaProposal 후보 생성
- contradiction candidate 생성
- Perspective synthesis candidate
- research source extraction과 요약 후보
- headless·server·batch 분석
- 구조화된 JSON schema output
- 평가와 provider 비교의 reference lane

이 reasoning role은 candidate generation/enrichment만 수행한다. provider는
criterion success, verified benefit, accepted strategy, ReviewDecision, Transition 또는
later-context selection을 결정하지 않는다.

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
Augnes의 human entry나 semantic coordination을 대체하지 않는다. target product에서는
GuideBrief와 함께 Blank State 또는 AI Workplane projection으로 연결하고, exact
detail이 필요할 때만 Inspector를 연다.

### 11.2 Blank State

Blank State는 target default human-facing entry와 resumption surface다. internal
project-state taxonomy가 아니라 user intent에서 시작하고 ordinary language로 다음을
보여 준다.

```text
What am I trying to do?
What is happening now?
What changed since I last looked?
Is anything blocked or waiting for me?
What is the one most meaningful next action?
```

Blank State는 project selection, recent projects, project switching, current-project
resumption, delegated-work status, returned results, attention과 next meaningful
decision을 흡수한다. “Blank”는 passive empty screen이 아니라 사용자가 engine의
internal model을 배우지 않고 intent에서 시작한다는 뜻이다. default state에는 한
가지 primary action만 둔다.

현재 Project Home은 이 책임의 일부를 구현한 reference operator surface다. Project
Home capability의 Blank State absorption은 planned correction이며 아직 runtime에
적용되지 않았다.

### 11.3 GuideBrief

GuideBrief는 Browser, ChatGPT, Codex, Blank State, AI Workplane과 future agent
surface를 연결하는 active cross-surface interpretation and guidance layer다.

```text
current project coordinates
observed facts
bounded inferences with caveats
suggested next actions
unresolved user judgment
risks · gaps · staleness · meaningful changes
relevant source anchors
```

GuideBrief는 non-authoritative View이며 action, truth, accepted state, semantic
change, external approval 또는 automation expansion을 만들지 않는다. top-level page가
아니라 surface에 embedded되거나 소비된다. fully autonomous conversational agent로
주장하지 않는다.

GuideBrief는 현재 상황과 그 의미를 human-readable하게 설명한다.

C3에서 merge된 active contract는
[`GUIDEBRIEF_CONTRACT_V0_2.md`](../GUIDEBRIEF_CONTRACT_V0_2.md)다. 하나의
current-project source/builder가 Browser, AI Workplane, ChatGPT/MCP와 Codex
projection을 만들며, exact `TaskContextPacket`은 별도 execution contract로 유지된다.
legacy v0.1 contract와 fixture는 historical/compatibility-only다.
`TaskContextPacket`은 specific task/run의 exact bounded execution contract다. 서로
대체하거나 competing authority protocol이 되어서는 안 된다.

### 11.4 AI Workplane

AI Workplane은 complex AI/operator work layer이며 다음을 소유하거나 조정한다.

```text
task and intent interpretation · context compilation
native-host and Codex delegation · active work/run state
result ingestion · verification · criterion evaluation
Evidence/Claim reconciliation · uncertainty/conflict handling
proposal generation · candidate review preparation
automation state · semantic processing
decision consequence · later-context/feedback preparation
```

historical Agent Workplane과 Semantic Workbench는 implementation ancestry와 internal
compatibility naming으로 남을 수 있다. C4 implementation은
`/workbench/semantic-review`를 current compatible canonical AI Workplane route로
reproject하고 `/workbench`를 그 route로 redirect한다. exact engine structure는 advanced
review와 contextual Inspector에서 유지되며 default user path를 정의하지 않는다.

C5 implementation은 AI Workplane이 current exact `TaskContextPacket`의 live delegation,
bounded progress, operational approval, cancellation, explicit resume와 trusted result
handoff를 소유하게 한다. 이 timeline은 `autonomy_runs`, steps와 events 위의 read-only
View다. page leave/remount는 run 또는 turn을 만들거나 취소하지 않으며, runtime ownership
loss는 자동 completion이 아니라 explicit resume-required로 투영한다.

AI Workplane의 default human projection은 requested work, current meaningful stage,
result, verification outcome, remaining uncertainty/risk와 실제 필요한 user decision을
요약한다. general chat, code editor, terminal, browser, diff/PR, worktree 또는 generic
scheduler를 복제하지 않는다.

### 11.5 Contextual Inspector

Inspector는 concrete work item, run, result, criterion, source, Evidence, Claim,
proposal, decision, Transition, warning, automation event 또는 diagnostic failure에서
여는 exact read-only audit and drill-down surface다.

현재 `/workbench/inspector`와 `shared_project_inspector.v0.1` exact reader는 그대로
유지된다. C6의 `contextual_inspector_view.v0.1`은 authenticated projection 위의
bounded presentation이며 concrete target title, exact status, 최대 네 개의 관련
section, closed additional records, exact identity disclosure와 deterministic related
return context만 만든다. authenticated project scope, read-only projection과
no-authority invariant는 그대로 보존한다. Inspector GET/render는 record, decision,
gate, Transition, packet,
feedback, automation, Perspective 또는 memory를 만들거나 고르지 않고
model/provider/external action도 호출하지 않는다.

Normal delegation, progress, result review와 important decision은 Inspector 없이
완료되어야 한다. Inspector는 audit, research, regulated review, developer debugging과
advanced provenance inspection을 위해 direct addressability를 유지할 수 있지만 Blank
State와 AI Workplane 옆의 peer default destination은 아니다.

### 11.6 Product Compass와 surface 책임

| 책임 | Blank State | GuideBrief | AI Workplane | Inspector | Provider / Runner / Tool |
|---|---|---|---|---|---|
| intent와 Resume | **human front door** | coordinates와 change 설명 | context compile | exact source | native context 소비 |
| work execution | status와 entry | meaningful stage 설명 | coordinate/delegate | run detail | **native execution** |
| Verify | outcome 요약 | basis·risk 번역 | **검증·reconciliation** | exact evidence/lineage | result와 telemetry 생산 |
| Decide | next decision | judgment와 consequence 설명 | **decision preparation** | exact decision lineage | scoped intent entry |
| audit | attention만 요약 | relevant anchor | audit target 생성 | **contextual drill-down** | external refs 제공 |

Resume / Verify / Decide는 full protocol sequence를 human UI에 그대로 나열해야
한다는 뜻이 아니다. Resume은 first correct action까지의 시간을 줄이고, Verify는
engine과 AI Workplane이 수행한 뒤 user에게 요약하며, Decide는 meaningful human
decision과 consequence만 우선 surface한다. Inspector는 exact auditability를
보존하지만 default experience가 아니다.

Current-to-target disposition은 다음과 같다.

- Project Home capability는 Blank State로 planned absorption된다.
- Semantic Workbench와 현재 engine projection 대부분은 AI Workplane 아래로
  planned absorption된다.
- Shared Inspector exact reader와 historical naming은 compatibility residue로
  유지되며 active product는 contextual Exact details로 presentation된다.
- Portability와 Recovery compatible routes는 Blank State의 Manage and protect와
  condition-triggered recovery mode 아래로 relocated된다.
- Projects와 Home은 competing peer top-level destination으로 남지 않는다.

이 migration은 C0에서 수행하지 않는다. replacement PR은 parity와 current behavior를
검증하고 superseded surface를 remove, absorb, redirect, hide 또는 explicitly demote해야
하며, silent additive navigation으로 대체해서는 안 된다.

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

4. Required Assessment / Comparison
   criterion status, basis와 residue provenance/trust를 분리하고
   optional strategic advantage transfer를 같은 non-authoritative boundary에서 제한

5. EpisodeDeltaProposal
   criterion assessment과 optional strategy patch/regression material을
   source-linked candidate로 정규화

6. ReviewDecision
   사용자가 accept / reject / defer / supersede / retract

7. Optional Semantic Transition
   승인 범위 안에서 state, Perspective 또는 memory 변경

8. Context Compiler Refresh
   다음 TaskContextPacket의 선택과 경고가 변화

9. Later RunReceipt / ContextUseReview
   변경된 context와 accepted transfer가 실제로 도움, stale 또는
   misleading이었는지 source-linked feedback으로 평가
```

폐쇄루프의 핵심은 중간 레코드 개수가 아니라 인과 계보가 닫히는 것이다.

---

## 13. Development Posture and Complexity Budget

### 13.1 vertical slice 우선

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

### 13.2 complexity budget

- 새 top-level 계약은 기존 계약을 흡수하거나 종료해야 한다.
- 새 장기 table은 독립 lifecycle과 query 무결성이 필요한 aggregate일 때만 허용한다.
- 새 workflow-stage surface보다 Blank State 또는 AI Workplane의 target 책임 안에서
  projection composition을 우선한다. GuideBrief는 cross-surface translation을,
  Inspector는 contextual exact detail을 맡는다.
- 새 상태 enum은 canonical lifecycle로 표현할 수 없는 경우에만 추가한다.
- strategic material은 기존 proposal material lane, `material_kind`,
  `basis_material_ids`, delta type, ReviewDecision, Transition과 feedback을 먼저
  재사용한다. 새 contract는 실제 consumer와 무결성 필요가 증명될
  때만 검토한다.
- durable strategic actor/session/debate-turn aggregate와 Arena page를 만들지
  않는다. 실제 adapter와 error-diversity evidence 없이 model router를 만들지
  않으며 strategic score를 authority로 사용하지 않는다.
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
- strategic profile이 simpler critique와 single-strategy baseline보다 실제
  downstream failure를 더 잘 예방하고, accepted transfer가 이후 outcome을
  개선하며 review burden과 harmful-transfer rate가 수용 가능하다.

### 14.2 governance/evidence plugin으로 축소할 조건

- continuity와 evidence 가치는 있지만 standalone Inspector 사용이 낮다.
- 대부분의 실행 UX는 native host가 더 잘 제공한다.
- cross-provider normalization과 audit만 지속적으로 유용하다.
- criterion assessment 또는 regression review는 유용하지만 full strategic
  transfer가 simpler critique 대비 추가 가치를 만들지 못한다.

이 경우 Core와 Integration Kit는 유지하고 UI 투자를 줄인다.

### 14.3 중단하거나 재설계할 조건

- 여러 실제 task에서 memory와 continuity가 resume 품질을 개선하지 못한다.
- 사용자가 생성된 context를 반복적으로 무시하거나 수정한다.
- review 비용이 방지한 오류보다 크다.
- 두 번째 adapter가 공통 계약을 만족하지 못한다.
- critic·ensemble·router가 품질을 높이지 않고 비용만 늘린다.
- strategic transfer가 자주 harmful regression을 만들거나, user edit/reject와
  review burden이 downstream benefit보다 크고, goal drift를 줄이지 못한다.

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
- multi-agent parliament/senate, persistent strategic persona/actor, actor registry와 debate store
- automatic winner selection, strategy evolution/mutation, fitness 또는 consensus promotion
- unrestricted multi-round debate와 raw strategic reasoning retention
- Perspective Arena를 R6 strategic assessment의 별도 product surface로 도입

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
