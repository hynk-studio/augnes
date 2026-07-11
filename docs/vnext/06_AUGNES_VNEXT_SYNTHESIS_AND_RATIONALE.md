# Augnes vNext Synthesis and Rationale
## Why the New Direction Was Chosen and How Previous Plans Are Preserved

> **문서 지위:** 비규범 설계 종합 및 결정 근거
> **버전:** v0.1
> **기준일:** 2026-07-10 KST
> **활성 전략:** `01_AUGNES_VNEXT_MASTERPLAN.md`
> **용도:** 과거 문서와 현재 결정의 계보, 대안과 기각 이유를 설명한다.

---

## 0. Background

Augnes는 2026년 상반기 동안 다음 방향으로 발전했다.

- local-first operator-led runtime
- Current Working Perspective
- AugnesDelta
- GuideBrief
- Blank State와 Agent Workplane
- Perspective Memory와 reuse
- Handoff Capsule과 Codex Launch Card
- Codex Result Report와 result intake
- ExpectedObservedDelta, reuse outcome, dogfood metrics
- supervised Autohunt scaffolding
- extensive authority boundaries와 smoke tests

원본 장기 마스터플랜은 이 자산을 work-perspective continuity runtime으로 연결하려 했다. 2026-07-09 repo-aligned v2는 많은 preview·writer·panel이 이미 생겼으며, 실제 기록이 다음 context와 Perspective를 바꾸는 non-empty closed loop가 부족하다고 진단했다.

동시에 ChatGPT Work와 Codex의 통합으로 task, code editing, terminal, browser, diff, PR review, worktree와 scheduling이 native host에 결합되었다. 기존의 ChatGPT→Codex 수동 전달 UI와 별도 작업 shell의 제품 가치는 낮아졌다.

이 변화는 Augnes의 존재 이유를 없애지 않았다. 오히려 실행 UI와 의미적 continuity를 분리할 필요를 분명하게 만들었다.

---

## 1. Adopted from the Original Masterplan

원본에서 그대로 계승한 핵심:

```text
User-owned local-first continuity
Memory와 resumability 구분
Candidate-first
Work leaves residue
Source anchors over summaries
Context diet
Perspective lifecycle
User-steered promotion
Projection before actuation
External pressure and residual diagnostics
Outcome-backed dogfood
Boundary is not product center
```

원본의 가장 중요한 통찰은 다음이다.

> Augnes의 장기성은 기억이 남는 것이 아니라, 이전 작업 때문에 다음 작업의 좌표계가 실제로 좋아지는 것이다.

이 원칙은 vNext closed loop의 핵심으로 유지된다.

---

## 2. Adopted from the Repo-Aligned v2

v2에서 계승한 운영 규율:

- vocabulary보다 non-empty closure 우선
- fixture/default/empty data를 outcome evidence로 사용하지 않음
- panel, record와 smoke 존재를 시스템 완성으로 오인하지 않음
- 실제 결과가 다음 context를 바꾸고 later result가 효과를 확인해야 함
- single sample을 trend로 부르지 않음
- PR 존재와 requirement progress 분리
- docs-only, boundary-only, smoke-only 작업을 기본값으로 삼지 않음

v2의 가장 중요한 통찰은 다음이다.

> 실제 결과가 다음 handoff와 Perspective를 바꾸고 이후 outcome에서 개선이 확인되기 전까지 폐쇄루프는 완성된 것이 아니다.

vNext는 이 규율을 유지하지만 WorkEpisode→EOD→Reuse Ledger→Metric Snapshot을 각각 별도 canonical table·panel로 만드는 구체적 순서는 계승하지 않는다.

---

## 3. Adopted from the Provider-Neutral Proposal

채택한 방향:

- Core independent, adapters replaceable
- native host UX 재사용
- ChatGPT-Codex를 첫 번째이자 기본 adapter로 지원
- capability-based authority
- `enforced / observed / advisory / outside_coverage`
- Model Gateway와 egress/retention/cost 통제
- provider/model/worker/actuator 역할 분리
- portable export와 recovery backup 분리
- 성과 기반 go/narrow/stop 기준

수정한 방향:

- Integration Gateway가 제품 중심이 아니라 Temporal Evidence·Claim·Perspective Core가 중심이다.
- Current Working Perspective는 canonical context가 아니라 reviewed task-start projection이다.
- Review Center는 별도 범용 작업 shell로 만들지 않는다. active cross-host
  semantic review와 decision은 Semantic Workbench에 두고, Inspector는 Home과
  Workbench의 공통 detail·lineage explorer로 둔다.
- AutomationPolicy는 보편 계약이 아니라 자율 실행의 선택 계약이다.
- 자동 Model Router는 초기 기본 경로에서 제외한다.
- Augnes Lab을 별도 non-authoritative boundary로 추가한다.

---

## 4. Key Tradeoffs

### 4.1 OpenAI-first vs provider-neutral

결정:

```text
User experience and reference implementation
= OpenAI-first

Core semantics and data model
= provider-neutral
```

모든 provider를 첫날부터 구현하는 것은 설정 복잡성과 유지비만 늘린다. 반대로 Core를 OpenAI ID와 lifecycle에 묶으면 미래 adapter가 불가능해진다. 기본 profile과 Core meaning을 분리한다.

### 4.2 Native host vs standalone Augnes app

결정:

```text
Native host
= chat, task, execution, diff, PR review

Augnes
= context, receipts, evidence, deltas, decisions, Perspective
```

Augnes는 Project Home과 Semantic Workbench를 직접 소유하되 native execution
UX를 복제하지 않는다. Inspector는 두 surface의 공통 drill-down이다.

### 4.3 Model output vs observation

결정:

- 실제 command, exit code, file hash와 verified external event는 observation이 될 수 있다.
- 모델이 붙인 의미는 candidate다.
- observation도 자동 durable state는 아니다.

### 4.4 automatic capture vs human review

결정:

```text
Automatic:
observations, receipts, reversible projections, candidate claims

Human-reviewed:
durable semantic state, Perspective, reviewed memory, external effects
```

모든 event에 사용자 승인을 요구하지도 않고, 모델이 의미적 승격을 자동 수행하게 하지도 않는다.

### 4.5 event table vs one-table-per-step

결정:

```text
common event envelope
+ stable aggregates
+ rebuildable projections
```

모든 것을 JSON event 하나에 던지는 방식도 피하고, workflow 단계마다 table을 만드는 방식도 피한다.

### 4.6 Model Gateway vs Model Router

결정:

- Gateway는 초기 필수다.
- Router는 후순위다.

Gateway는 privacy·cost·provenance를 통제한다. Router는 여러 provider의 실측 데이터가 생긴 뒤 선택 최적화를 한다.

### 4.7 memory accumulation vs forgetting

결정:

memory volume보다 source, currentness, expiry, supersession와 reuse feedback을 우선한다. Decision Debt와 stale memory를 제품 health로 측정한다.

### 4.8 safety documents vs working capability

결정:

권한 불변식은 코드와 test로 집행하되, boundary-only PR을 기본 개발 형태로 삼지 않는다.

### 4.9 Personal Perspective vs fixed psychological profile

identity와 personality를 제거하고 decision rule만 남기는 대안은 채택하지 않는다.
사용자의 장기 self-understanding에는 현재 self-concept, aspirational identity, values,
role과 relationship pattern, persistent tension과 exception이 포함되며 같은 rule 목록으로
환원되지 않는다.

동시에 fixed psychological profiling도 기각한다. user declaration과 reviewed
self-understanding은 user-owned source인 반면, model inference는 derived candidate다.
반복 선택 하나나 lower-scope project override는 higher-scope identity를 자동
재작성하지 않는다. supporting example뿐 아니라 counterexample와 unresolved tension을
first-class로 보존해야 revision이 정직해진다.

Arena나 structured review output은 Personal Perspective candidate, disagreement 또는
gap을 제안할 수 있지만 직접 mutate하지 않는다. 연구는 persistent evolutionary actor
population보다 candidate review, shared gap management, deterministic baseline과
outcome validation부터 시작한다. 이 순서가 identity authority, ontology growth와 compute
cost를 실제 가치보다 먼저 고정하는 것을 막는다.

---

## 5. Why the Center Is Temporal Evidence · Claim · Perspective Core

멀티모델 routing, plugin과 MCP는 다른 제품도 만들 수 있다. Augnes의 고유한 방어선은 다음이다.

```text
Evidence 경로 단일화
Claim revision과 contradiction 보존
triple-time semantics
Decision과 Transition 분리
Perspective formation lineage
검토된 continuity의 다음 task 재사용
outcome-backed feedback
```

통합앱과 모델 성능이 발전할수록 실행 자체는 commodity가 될 수 있다. 실행 주체가 늘어날수록 어떤 결과를 믿고 어떤 의미를 durable state로 받아들였는지 관리하는 Core의 가치는 커진다.

---

## 6. Why Multi-Project Comes Before Broad Multi-Provider

공급자 중립성만 강조하고 실제 scope가 `project:augnes` 하나에 묶이면 제품은 자기 개발용 도구를 벗어나지 못한다.

vNext는 먼저 다음을 증명해야 한다.

- project identity와 isolation
- 서로 다른 프로젝트의 state/memory/grant 누출 방지
- repository와 project 의미 분리
- project별 export/restore

그 다음 provider와 host를 확장한다.

---

## 7. Why Zero-Model Mode Is a Product Invariant

모델 장애, 비용 한도, privacy 정책과 provider outage가 있어도 Augnes는 다음을 해야 한다.

```text
state 읽기
Evidence와 Claim lineage
RunReceipt
Decision
Transition
Perspective projection
Timeline
Export/restore
```

모델이 없으면 enrichment가 줄어들 뿐 Core가 멈추면 안 된다. 이 경계가 local-first와 provider-neutral의 실제 의미다.

---

## 8. Alternatives Rejected

### 8.1 Standalone all-in-one AI desktop app

기각 이유:

- native host UX와 중복
- diff/terminal/browser/scheduler 유지비
- provider 변화에 취약
- Augnes 고유 가치가 흐려짐

### 8.2 OpenAI-only Core

기각 이유:

- provider/session ID가 canonical state를 오염
- 다른 host와 local model 연결 어려움
- OpenAI product lifecycle에 Core migration 종속

### 8.3 lowest-common-denominator broker

기각 이유:

- 의미 계약보다 provider routing이 제품 중심이 됨
- 각 provider 강점을 잃음
- 독립적 제품 가치가 약함

대안:

- common semantic envelope
- optional provider extension

### 8.4 모든 workflow 단계의 durable table

기각 이유:

- schema와 migration 폭증
- PR sequence가 data model로 굳음
- panel·writer·smoke 증식

### 8.5 giant generic event JSON store

기각 이유:

- queryability와 integrity 약화
- semantic aggregate가 사라짐
- migration과 debugging 어려움

### 8.6 automatic human-free Perspective promotion

기각 이유:

- 모델 output이 authority가 됨
- stale context가 재귀적으로 강화
- 프로젝트 의미와 실행 permission 혼합

### 8.7 automatic model router at foundation stage

기각 이유:

- 비교 데이터 부재
- provider-neutral claim을 숨기는 facade 위험
- privacy·cost 선택 규칙 미검증

---

## 9. Historical Document Disposition

### Original 19-Proposal Masterplan

```text
Keep:
philosophy, continuity, work residue, context diet,
Perspective lifecycle, dogfood and research hypotheses

Supersede:
surface topology, active phases, Codex-only artifacts,
Workbench-centered implementation sequence
```

### Repo-Aligned v2, 2026-07-09

```text
Keep:
maturity discipline, non-empty closure,
real-vs-fixture distinction, outcome criteria

Supersede:
current status labels, Workbench front door,
record/table/panel PR chain
```

### Provider-Neutral Redesign Proposal

```text
Incorporate:
Core independence, adapters, Model Gateway,
coverage, migration safety, outcome gates

Modify:
Core-centered architecture, surface specialization and Inspector composition,
Router deferral, Lab boundary
```

### Personal Perspective, Gap, and Arena proposals

```text
Incorporate:
user-owned revisable self-and-world model,
identity/personality without fixed essence,
shared gap management, counterexamples,
structured disagreement and prediction review

Defer:
Personal Vault persistence, automatic context injection,
persistent Perspective Actors, evolutionary fitness,
mutation/branching/merging and automatic population selection
```

---

## 10. Final Synthesis

vNext는 과거 작업을 부정하는 재시작이 아니다.

```text
원본 마스터플랜의 철학
+
repo-aligned v2의 성숙도 규율
+
provider-neutral 제안의 운영 현실
+
통합앱 이후 native UX 재사용
+
Temporal Evidence·Claim·Perspective Core 중심성
```

을 하나의 문서 체계로 결합한 것이다.

Personal Perspective R&D는 이 제품 중심을 바꾸지 않는 opt-in 장기 연구 lane이다.
project continuity와 workspace-level personal continuity를 분리한 채, 후보·gap·review가
실제 다음 context와 outcome을 개선하는지 먼저 검증한다.

최종 선택은 다음과 같다.

> **OpenAI를 기본 경험으로 활용하되 Core는 provider-neutral하게 유지하고, 실행 UI 경쟁에서 내려와 temporal evidence, claim revision, reviewed perspective와 durable human decisions에 집중한다.**
