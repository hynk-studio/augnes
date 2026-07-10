# Augnes vNext 문서 세트 인덱스

> **문서 지위:** 활성 문서 체계의 진입점
> **버전:** v0.1
> **기준일:** 2026-07-10 KST
> **적용 대상:** `hynk-studio/augnes`의 vNext 개편 및 이후 개발
> **최상위 상위 규약:** `SSOT_SCHEMA_BUNDLE`, `SSOT_CANONICAL`, `SSOT_LOGGING_POLICY`
> **활성 제품 북극성:** [`01_AUGNES_VNEXT_MASTERPLAN.md`](./01_AUGNES_VNEXT_MASTERPLAN.md)

---

## 1. 이 문서 세트의 목적

이 세트는 Augnes의 기존 장기 관점 설계, 2026-07-09 repo-aligned 로드맵, ChatGPT-Codex 통합 환경 변화, 다중 공급자·오픈 모델·API 확장 요구를 하나의 현재 문서 체계로 정리한다.

문서 체계의 목표는 다음 세 가지다.

1. 제품의 장기 정체성과 불변 원칙을 안정적으로 유지한다.
2. 기술 계약과 현재 저장소 전환 계획을 분리하여 Masterplan이 빠르게 낡지 않게 한다.
3. 실제 다음 작업의 품질이 개선되는지를 측정하여 문서·패널·테이블의 존재를 진척으로 오인하지 않게 한다.

이 세트는 기존 문서를 삭제하거나 과거 결정을 재작성하지 않는다. 기존 문서는 설계 계보와 당시 저장소 상태를 보존하고, vNext 문서가 현재의 활성 전략과 구현 기준을 담당한다.

---

## 2. 권장 읽기 순서

### 사람 운영자 및 제품 결정자

1. [`01_AUGNES_VNEXT_MASTERPLAN.md`](./01_AUGNES_VNEXT_MASTERPLAN.md)
2. [`03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`](./03_AUGNES_VNEXT_TRANSITION_ROADMAP.md)
3. [`04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`](./04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md)
4. 필요할 때 [`06_AUGNES_VNEXT_SYNTHESIS_AND_RATIONALE.md`](./06_AUGNES_VNEXT_SYNTHESIS_AND_RATIONALE.md)

### ChatGPT, Codex 및 구현 담당자

1. [`01_AUGNES_VNEXT_MASTERPLAN.md`](./01_AUGNES_VNEXT_MASTERPLAN.md)
2. [`02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`](./02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md)
3. [`03_AUGNES_VNEXT_TRANSITION_ROADMAP.md`](./03_AUGNES_VNEXT_TRANSITION_ROADMAP.md)
4. [`04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`](./04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md)
5. 관련 템플릿

### 연구·진단 기능 담당자

1. [`01_AUGNES_VNEXT_MASTERPLAN.md`](./01_AUGNES_VNEXT_MASTERPLAN.md)
2. [`05_AUGNES_VNEXT_LAB_CHARTER.md`](./05_AUGNES_VNEXT_LAB_CHARTER.md)
3. [`04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md`](./04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md)

---

## 3. 문서 권위와 변경 주기

| 문서 | 역할 | 권위 | 권장 변경 주기 |
|---|---|---:|---|
| `01_AUGNES_VNEXT_MASTERPLAN.md` | 제품 정체성, 북극성, 전략적 불변식 | 활성 전략의 최상위 | 낮음. 중대한 제품 결정 때만 |
| `02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md` | 기술 의미 계약, actor·capability·protocol | Masterplan 하위의 기술 기준 | 중간. 버전 단위 |
| `03_AUGNES_VNEXT_TRANSITION_ROADMAP.md` | 현행 repo를 목표 구조로 옮기는 운영 계획 | 활성 실행 기준 | 높음. PR과 상태 변화에 따라 |
| `04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md` | 성숙도, 실험, 완료·중단 기준 | 완료 주장과 투자 판단의 기준 | 중간 |
| `05_AUGNES_VNEXT_LAB_CHARTER.md` | 비권위 연구·진단 영역의 경계 | Lab 내부 기준 | 중간 |
| `06_AUGNES_VNEXT_SYNTHESIS_AND_RATIONALE.md` | 선택 근거, 대안, 과거 문서 계승 관계 | 비규범 참고 | 낮음 |
| `templates/*` | 작업 분해와 리뷰 형식 | 운영 보조 | 필요 시 |

### 충돌 시 우선순위

```text
SSOT_SCHEMA_BUNDLE
> SSOT_CANONICAL
> SSOT_LOGGING_POLICY
> AUGNES_VNEXT_MASTERPLAN
> AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL
> AUGNES_VNEXT_TRANSITION_ROADMAP
> AUGNES_VNEXT_EVALUATION_AND_MATURITY
> AUGNES_VNEXT_LAB_CHARTER
> ADR / runbook / templates / historical docs
```

상위 문서는 하위 문서가 새 권위를 발명하지 못하게 한다. 하위 문서는 상위 문서의 의미를 실제 저장소와 운영 절차에 적용한다.

---

## 4. 기존 핵심 문서의 새 지위

### 원본 19개 제안 통합 마스터플랜

논리적 문서명:

```text
AUGNES_LONG_TERM_PERSPECTIVE_MASTER_DESIGN_AND_ROADMAP_19_PROPOSALS.md
```

새 지위:

```text
Design Genesis and Long-Term Research North Star
```

계속 참조할 내용:

- user-owned local-first continuity
- memory와 resumability의 구분
- candidate-first
- source anchors
- work leaves residue
- Perspective lifecycle
- context diet
- outcome-backed dogfood
- residual·state-space 연구 방향

더 이상 현재 권위가 아닌 내용:

- Workbench 중심 제품 표면
- Codex 전용 handoff topology
- 단계별 별도 record·panel을 전제로 한 로드맵
- 현재 repo 파일과 phase 순서

### 2026-07-09 repo-aligned v2

논리적 문서명:

```text
AUGNES_MASTERPLAN_REPO_ALIGNED_ROADMAP_V2_2026-07-09.md
```

새 지위:

```text
Historical Repo Maturity Snapshot as of 2026-07-09
```

계속 참조할 내용:

- non-empty recursive closure
- fixture와 real record 구분
- preview·record·consumer·outcome 성숙도 구분
- PR 존재와 requirement progress의 구분
- outcome-backed dogfood 기준

더 이상 현재 권위가 아닌 내용:

- 당시 이름과 workflow-stage panel 구성 그대로 Blank State와 Workplane을
  고정하는 구조. 두 surface의 유용한 책임은 Project Home과 Semantic
  Workbench로 전문화하여 보존한다.
- Codex Result Report 중심의 canonical feedback chain
- 단계별 durable table·panel PR 순서
- 2026-07-09 시점의 `[x]`, `[~]` 상태 판정

### Provider-Neutral Redesign Proposal

논리적 문서명:

```text
Augnes vNext Provider-Neutral Redesign Plan v0.1
```

새 지위:

```text
Strategy proposal incorporated into the active vNext set
```

채택한 내용:

- native host UX 재사용
- provider-neutral Core
- ChatGPT-Codex 기본 프로필
- capability 기반 authority
- authority coverage 표시
- Model Gateway
- portable export와 recovery backup 분리
- 성과 기반 go/narrow/stop 기준

수정하여 채택한 내용:

- Integration Gateway가 아니라 Temporal Evidence·Claim·Perspective Core를 중심에 둔다.
- Current Working Perspective는 canonical state가 아니라 기본 task-start projection이다.
- 자동 Model Router는 실제 두 번째 adapter와 성과 데이터가 생긴 뒤로 미룬다.
- Review Center를 또 하나의 범용 작업 shell로 만들지 않는다. 능동 review와
  decision work는 Semantic Workbench에, 공통 detail과 lineage exploration은
  Inspector에 둔다.
- Augnes Lab을 명시적인 non-authoritative 경계로 둔다.

---

## 5. 이 세트의 핵심 결정 요약

```text
기본 사용처:
ChatGPT Work + Codex + OpenAI API

아키텍처:
OpenAI-optimized default, provider-neutral Core

제품 중심:
Temporal Evidence · Claim · Perspective Core

기본 제품 루프:
TaskContextPacket
→ native host / worker 실행
→ RunReceipt
→ EpisodeDeltaProposal
→ ReviewDecision
→ 필요한 경우 semantic transition
→ 다음 TaskContextPacket 변화
→ 이후 결과에서 유용성 평가

기본 제품 UX:
native host의 작업 UI + compact Augnes review card
+ Augnes Project Home + Augnes Semantic Workbench

공통 상세 탐색:
Home과 Workbench가 공유하는 Augnes Inspector

연구 영역:
Augnes Lab, 항상 non-authoritative
```

---

## 6. 개발 시작 전에 확인할 최소 질문

새 기능이나 PR은 다음 질문에 답해야 한다.

1. 이 기능은 `Native Host`, `Adapter`, `Core`, `Projection/Inspector`, `Lab` 중 어디에 속하는가?
2. 특정 provider 이름 없이 Core 의미를 설명할 수 있는가?
3. 결과는 `observed`, `attested`, `inferred`, `proposed` 중 무엇인가?
4. durable state 또는 외부 side effect를 만드는가?
5. source, currentness, trust class를 추적할 수 있는가?
6. 모델 없이 결정적으로 처리할 부분을 먼저 분리했는가?
7. 새 장기 aggregate가 정말 필요한가, event나 projection으로 충분한가?
8. 다음 작업의 `Resume`, `Verify`, `Decide` 중 무엇을 개선하는가?
9. 실제 성과를 어떻게 평가할 것인가?
10. 기존 개념·테이블·패널을 무엇으로 흡수하거나 종료하는가?

---

## 7. 템플릿

- [`templates/AUGNES_VNEXT_WORK_SLICE_TEMPLATE.md`](./templates/AUGNES_VNEXT_WORK_SLICE_TEMPLATE.md)
- [`templates/AUGNES_VNEXT_PR_REVIEW_TEMPLATE.md`](./templates/AUGNES_VNEXT_PR_REVIEW_TEMPLATE.md)
- [`templates/AUGNES_VNEXT_DECISION_RECORD_TEMPLATE.md`](./templates/AUGNES_VNEXT_DECISION_RECORD_TEMPLATE.md)

---

## 8. 유지 규칙

- 활성 Masterplan은 하나만 둔다.
- 구현 세부가 바뀌어도 Masterplan의 제품 정의와 불변식은 가능한 한 유지한다.
- 현재 repo 상태와 PR 순서는 Transition Roadmap에서 갱신한다.
- 계약 필드는 Architecture 문서 또는 schema bundle에서 관리한다.
- 실험적 개념은 Lab Charter의 경계를 통과하지 않고 Core 권위를 얻지 못한다.
- historical 문서의 원래 의미는 보존하되 현재 planning authority처럼 사용하지 않는다.
- 새 문서가 생기면 이 인덱스에 권위와 역할을 먼저 등록한다.
