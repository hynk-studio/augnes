# Augnes Post-Build Week Product UX Correction Charter

## 1. Status and authority

> **문서 지위:** C0 canonical product UX authority
> **적용 범위:** post-Build Week user-facing topology, navigation, progressive
> disclosure, GuideBrief product responsibility, UX merge gates, replacement
> discipline
> **비적용 범위:** Core protocol, durable authority, identity, persistence,
> migration, provider 또는 runner semantics

이 문서는 Augnes의 post-Build Week product correction program C0를 정의한다.
user-facing surface topology가 이전 active planning과 충돌하면 이 문서가 해당
범위에서 우선한다. [`01_AUGNES_VNEXT_MASTERPLAN.md`](./01_AUGNES_VNEXT_MASTERPLAN.md)는
제품 정체성과 전략 불변식을, [`02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md`](./02_AUGNES_VNEXT_ARCHITECTURE_AND_PROTOCOL.md)는
Core와 protocol 의미를 계속 소유한다.

현재 code와 runtime은 구현된 behavior의 source of truth다. C0–C4는 merge되었다.
`guide_brief.v0.2`는 Blank State, AI Workplane, ChatGPT/MCP와 Codex가 공유하는 bounded
current-project View다. C4는 exact result, verification, suggested-change, decision과
project-change flow를 보존하면서 current Workbench를 human-facing AI Workplane으로
reproject했다. C5 implementation은 기존 runner ledger와 native-host lifecycle을
durable delegated-work timeline과 explicit resume로 투영한다. C5는 이 PR이 review와
merge된 뒤에만 complete다. C6 이후 correction은 아직 일어났다고 주장하지 않는다.

## 2. Why correction is required

Build Week 구현은 operational continuity Core와 reference operator interface를
입증했다. 그러나 engine의 구조와 evaluation surface가 default user information
architecture로 확장되면서, 사용자가 자신의 의도보다 project-state taxonomy와
protocol sequence를 먼저 해석해야 하는 product drift가 생겼다.

C0의 교정은 engine을 폐기하는 작업이 아니다. 이미 구현된 continuity,
verification, reconciliation, automation, semantic processing, portability와 recovery를
보존하면서 human-facing projection과 surface responsibility를 다시 정한다.

## 3. Current reference implementation versus target product

### Current reference operator implementation

현재 runtime에는 다음 current content가 구현되어 있다.

- canonical Blank State와 project-management/viewed-project compatibility views
- internal Project Home source projection
- human-facing AI Workplane on the compatible semantic-review route
- C5 in this change: bounded delegated Codex progress and explicit resumption
- Shared Inspector
- Portability
- Recovery
- C1 shared shell classification with two primary zones and secondary Project tools
- embedded current-project GuideBrief v0.2 projections

이 surface들은 operational Core를 평가하고 정확한 state, lineage, verification과
recovery behavior를 드러내는 현재 구현이다. C1은 shared ProductShell을 Blank State와
AI Workplane 두 primary zone으로 줄였다. C2는 `/`, `/projects`,
`/projects/[projectId]`를 하나의 Blank State architecture로 통합하고 `/overview`를
`/`로 redirect한다. Project Home은 internal source-model/history 이름으로만 남으며,
Portability와 Recovery는 secondary Project tools context를 유지한다. Inspector route는
AI Workplane zone 아래에서 contextual/direct access를 유지한다. 현재 route content와
behavior는 이후 correction PR이 실제로 변경할 때까지 authoritative runtime truth다.

### Target post-Build Week product topology

목표 제품 topology는 다음과 같다.

```text
Blank State
↕ embedded GuideBrief
AI Workplane
↘ contextual Inspector

Provider / Runner / Tool Layer
= execution power beneath and beside these surfaces
```

C1은 이 topology의 top-level shell slice를 구현했고 C2는 actual Blank State와
Project Home/project-selection absorption을 구현했다. C3는 하나의
current-project GuideBrief source/builder를 Blank State, compact AI Workplane,
ChatGPT/MCP, `codex:read-brief`와 new native Codex task start에 연결했다. C4는 current
result, suggested-change, decision과 confirmed project-change controls를 AI Workplane의
human projection으로 흡수했다. C5 in this change는 existing managed-live ledger를
AI Workplane full timeline과 Blank State compact return status로 투영한다. deeper
Inspector demotion, utility relocation, visual system과 compatibility reduction은 아직
runtime에 구현되지 않았다.

## 4. Target product topology

Augnes의 target user-facing structure는 다섯 가지 책임으로 구성된다.

1. **Blank State** — simple human-facing entry and resumption surface
2. **GuideBrief** — cross-surface interpretation and guidance layer
3. **AI Workplane** — complex AI/operator work layer
4. **Inspector** — contextual, optional, exact read-only drill-down
5. **Provider / Runner / Tool Layer** — execution power without product-IA
   authority

Default top-level user navigation은 다음 두 destination으로 제한한다.

- Blank State
- AI Workplane

GuideBrief와 Inspector는 peer default navigation destination이 아니다.

## 5. Blank State responsibility

Blank State는 default human-facing entry surface다. internal project-state taxonomy가
아니라 user intent에서 시작한다.

Blank State는 ordinary language로 다음 질문에 답해야 한다.

- 나는 무엇을 하려는가?
- 지금 무슨 일이 진행 중인가?
- 마지막으로 본 뒤 무엇이 달라졌는가?
- 막혔거나 나를 기다리는 것이 있는가?
- 지금 가장 의미 있는 한 가지 다음 행동은 무엇인가?

Blank State는 향후 다음 user-facing 책임을 흡수한다.

- project selection과 recent projects
- project switching과 current-project resumption
- delegated work status
- returned results
- attention requiring user action
- next meaningful decision

“Blank”는 passive empty screen을 뜻하지 않는다. 사용자가 engine의 internal state
model을 이해하지 않고 자신의 의도에서 시작한다는 뜻이다. normal path에서 raw
protocol object를 해석하거나 internal ID를 입력하게 해서는 안 된다.

## 6. GuideBrief responsibility

GuideBrief는 active first-class product responsibility이며 다음을 연결하는
cross-surface interpretation and guidance layer다.

- Browser
- ChatGPT
- Codex
- Blank State
- AI Workplane
- future agent surfaces

GuideBrief는 internal engine state를 다음으로 번역한다.

- current project coordinates
- observed facts
- caveat가 있는 bounded inference
- suggested next actions
- unresolved user judgment
- important risks, gaps와 staleness
- meaningful changes
- relevant source anchors

GuideBrief는 non-authoritative View다. truth를 확정하거나 user judgment를 대신하지
않고, accepted state를 만들거나 execution authority를 부여하지 않는다. semantic
change, external action, automation expansion을 적용하거나 승인할 수 없다.

GuideBrief는 top-level page나 menu destination이 아니다. Blank State, AI Workplane,
ChatGPT와 Codex에 embedded되거나 그 surface가 소비한다. 현재 GuideBrief는 fully
autonomous conversational agent가 아니라 bounded cross-surface guide contract와
current-project implementation이다. C0는 product role을 복원했고 C3는 그 active
v0.2 runtime path를 연결했다. GuideBrief는 action, authority 또는 별도
execution contract가 되지 않는다.

### GuideBrief and TaskContextPacket

- **GuideBrief**는 현재 상황, 그 의미, 주의할 점과 필요한 user judgment를 사람이
  이해할 수 있게 설명한다.
- **TaskContextPacket**은 특정 task 또는 run을 위한 exact bounded execution
  contract다.
- GuideBrief는 왜 특정 packet, context selection 또는 task가 중요한지 설명할 수
  있다.
- TaskContextPacket은 human-readable guidance의 대체재가 아니다.
- GuideBrief는 competing execution protocol 또는 authority protocol이 아니다.

## 7. AI Workplane responsibility

AI Workplane은 complex AI/operator work layer다. historical Agent Workplane과 현재
Semantic Workbench가 implementation ancestry에 포함되지만, runtime rename이나
migration이 이미 완료됐다고 표현해서는 안 된다.

AI Workplane은 다음을 소유하거나 조정한다.

- task and intent interpretation
- context compilation
- native-host and Codex delegation
- active work and run state
- result ingestion and verification
- criterion evaluation
- Evidence and Claim reconciliation
- uncertainty and conflict handling
- proposal generation and candidate review preparation
- automation state
- semantic processing
- decision-consequence preparation
- later-context and feedback preparation

현재 구현된 engine과 reference operator UI의 대부분은 폐기 대상이 아니라 AI
Workplane 아래로 planned absorption되는 기반이다. 그러나 “AI Workplane 안”이라는
이유로 raw engine structure를 default user projection에 노출해서는 안 된다.

Default human projection은 다음만 우선 요약한다.

- requested work
- current meaningful stage
- result
- verification outcome
- remaining uncertainty or risk
- actually needed user decision

Exact protocol detail은 progressive disclosure 또는 Inspector에 둔다.

## 8. Inspector responsibility

Inspector는 contextual, exact, read-only audit and drill-down surface다. 다음과 같은
concrete target에서 연다.

- work item, run 또는 result
- criterion, source, Evidence item 또는 Claim
- proposal, decision 또는 Transition
- warning, automation event 또는 diagnostic failure

Normal user는 Inspector를 열지 않고도 work delegation, progress follow-up, result
review와 important decision을 완료할 수 있어야 한다. Inspector는 audit, research,
regulated review, developer debugging과 advanced provenance inspection을 위해 direct
addressability를 유지할 수 있다.

Inspector는 Blank State와 AI Workplane 옆의 peer default destination이 아니며,
mutation 또는 semantic authority를 얻지 않는다.

## 9. Provider / Runner / Tool Layer responsibility

이 layer에는 다음이 포함된다.

- ChatGPT, Codex, OpenAI API와 other native hosts
- MCP/App와 GitHub
- local adapters and bridges
- schedulers and automation runners
- host-native task, terminal, browser, diff, PR와 worktree tools

이들은 execution power와 native interaction environment를 제공한다. Augnes의
default user-facing information architecture를 정의하지 않는다. Augnes는 native
execution surface를 불필요하게 복제하지 않는다.

## 10. Navigation invariant

Navigation은 subsystem ownership이 아니라 user intention을 따른다. target default
top-level navigation은 Blank State와 AI Workplane 두 destination뿐이다.

다른 default destination을 추가하는 것은 명시적 user authorization과 justification이
필요한 product-architecture change다. Portability, Recovery, project switching,
import/export, backup/restore, diagnostics와 settings는 중요하지만 project management,
safety, settings 또는 condition-triggered path에 둔다.

## 11. Merge-blocking product UX invariants

다음은 aspiration이 아니라 repository operating rules이며 위반한 user-facing PR은
merge-blocked다.

1. **Default user information** — default surface는 user goal, current meaningful
   work state, AI result, important uncertainty/risk/blocker와 next meaningful
   decision/action만 우선 노출한다.
2. **Internal complexity ownership** — normal user는 `TaskContextPacket`,
   `RunReceipt`, `CriterionAssessment`, raw Evidence/Claim relations, fingerprints,
   nonces, TTLs, gate records, receipt identities, lineage IDs, internal current-head
   selection, raw `ReviewDecision` 또는 `Transition`을 관리하지 않는다. 내부
   distinction은 truthful하게 유지하고 GuideBrief와 projection이 ordinary language로
   번역한다.
3. **Hiding and translation default** — internal complexity는 기본적으로 숨기고,
   번역하고, 요약하고, progressively disclose한다. raw structure 노출에는 구체적인
   user need와 explicit justification이 필요하다.
4. **No UI entitlement from implementation existence** — Core record, protocol
   stage, schema, capability, subsystem, route, read model 또는 diagnostic의 존재는 새
   page, top-level item, permanent card, dashboard region 또는 user-visible concept를
   정당화하지 않는다.
5. **Navigation follows intent** — default top-level navigation은 Blank State와 AI
   Workplane으로 제한한다.
6. **Replacement, not silent addition** — replacement redesign은 같은 approved
   correction program 안에서 superseded surface를 remove, absorb, redirect, hide 또는
   explicitly demote해야 한다. 새 page나 navigation을 조용히 더하는 것으로 대체할
   수 없다.
7. **One primary action** — 각 default state에는 visually and semantically primary인
   action 하나만 둔다. secondary action은 next step과 경쟁하지 않는다.
8. **Inspector is optional** — normal delegation, progress, result review와 important
   decision path는 Inspector 없이 완료된다.
9. **Protocol vocabulary is zero by default** — unavoidable term은 ordinary language로
   설명되고 consequential decision에 도움이 되며 full protocol model 이해를 요구하지
   않을 때만 default path에 나타날 수 있다. Protocol-vocabulary leakage는
   merge-blocking UX regression이다.
10. **Technical correctness is insufficient** — types, tests, authority correctness와
    source binding이 통과해도 default user complexity를 늘리거나 product purpose를
    가리거나 interpretation work를 사용자에게 넘기면 product regression이다.
11. **UX correctness is a merge gate** — basic UX correctness를 Alpha 또는 broad
    post-Alpha usefulness evaluation로 전부 미룰 수 없다. user-facing PR은 protocol,
    typecheck, build, authority test, E2E가 통과해도 이 invariant 위반으로 block될 수
    있다.
12. **No premature visual polish** — product topology, navigation, information
    hierarchy, surface responsibility와 progressive disclosure 교정 전에 broad visual
    polish를 수행하지 않는다. unresolved IA를 visual polish로 정당화하지 않는다.

## 12. User-facing PR gates

모든 future user-facing PR은 PR body에서 다음에 답해야 한다.

1. What concrete user intention does this change serve?
2. What complexity does the AI or system handle instead of transferring to the user?
3. What is the single primary action in the affected default state?
4. Does this change add a route, top-level destination, permanent card, dashboard region, or user-visible concept?
5. Why can the existing Blank State or AI Workplane not absorb it?
6. What existing surface is replaced, merged, redirected, hidden, or demoted?
7. Which protocol terms appear by default, and why are they unavoidable?
8. How does GuideBrief summarize or translate the underlying engine state?
9. Can a new user explain the current situation and next action within roughly ten seconds?
10. Can the normal path complete without opening Inspector?
11. Does the change preserve current runtime truth while moving toward the target topology?
12. Does this PR increase or reduce the number of concepts the user must understand?

답이 불충분한 user-facing PR은 protocol, typecheck, build, CI와 browser checks가
통과해도 blocked다.

## 13. Current-to-target disposition

| Current reference implementation | Target disposition |
|---|---|
| Project Home | C2 absorbed its user-facing capabilities into Blank State; the source projection remains internal |
| Semantic Workbench | C4 replaces its default protocol-first presentation with AI Workplane; internal and compatibility names may remain |
| Shared Inspector | retained as contextual exact read-only drill-down |
| Portability | planned relocation to project management, settings or an explicit transfer path |
| Recovery | planned relocation to safety, settings or a condition-triggered recovery path |
| Projects and Home | must not remain competing peer top-level destinations |

C0는 이 runtime migration을 수행하지 않는다. later correction PR은 current route와
behavior를 보존하면서 replacement parity를 입증하고, superseded surface를 같은
program 안에서 명시적으로 absorb, redirect, hide, demote 또는 remove해야 한다.

C1은 이 disposition의 navigation classification을 수행했다. C2는
Project Home와 standalone onboarding을 하나의 Blank State surface로 대체하고,
`/projects`와 `/projects/[projectId]`를 그 surface의 compatibility views로 유지한다.
current Workbench/result/Inspector route는 AI Workplane primary zone에 남고,
Portability와 Recovery는 primary selection이 없는 secondary Project tools context로
남는다. C3는 이 surface들에 embedded GuideBrief를 연결했다. C4는
Workbench/result/change-review default projection을 AI Workplane으로 대체했다. C5 in
this change는 live Codex controls와 durable progress/resume를 AI Workplane에 흡수하지만
C6, C7의 Inspector/content/final utility relocation은 아직 pending이다.

## 14. C0–C9 correction sequence

- **C0 — Product UX charter and hard invariants:** merged documentation authority
- **C1 — Top-level IA reduction:** merged; shared shell reduced to two primary zones
- **C2 — Blank State restoration and Project Home absorption:** merged
- **C3 — GuideBrief active-path restoration:** merged
- **C4 — AI Workplane reprojection of current Semantic Workbench and engine complexity:**
  merged
- **C5 — Delegated Codex work timeline and resumption:** implemented in this
  change; complete only after user review and merge
- **C6 — Contextual Inspector demotion**
- **C7 — Management and safety relocation for Portability and Recovery**
- **C8 — Visual system after IA correction**
- **C9 — Compatibility and obsolete-surface reduction**

C6–C9는 implemented, complete 또는 runtime-active가 아니다. C5는 이 change에서
implemented되지만 review와 merge 전에는 complete가 아니다. user가 correction
program을 명시적으로 override하지 않는 한 broad visual polish나 unrelated feature
phase가 C6보다 먼저 오지 않는다.

## 15. Non-goals

C0는 다음을 수행하지 않는다.

- route, navigation, ProductShell, component, style 또는 runtime label 변경
- Project Home, Semantic Workbench, Inspector, Portability 또는 Recovery behavior 변경
- Core, protocol, schema, migration, API, persistence 또는 authority 변경
- `TaskContextPacket`, `RunReceipt`, `CriterionAssessment`, Evidence, Claim,
  proposal, `ReviewDecision`, gate, Transition, Perspective, automation,
  portability, recovery 또는 reconciliation semantics 변경
- GuideBrief runtime 2.0, conversational guide agent 또는 autonomous behavior 추가
- screenshot, visual design 또는 submission asset 변경
- C1 implementation 또는 compatibility code 삭제

## 16. Completion boundary for C0

C0의 완료 조건은 다음뿐이다.

- active product documents가 current runtime과 target topology를 구분한다.
- 이 charter가 user-facing topology, GuideBrief responsibility, progressive
  disclosure, UX merge gates와 replacement discipline의 canonical authority로
  index된다.
- repository instructions가 hard UX invariants와 PR questions를 merge gate로
  요구한다.
- Evaluation & Maturity가 basic UX correctness를 Alpha 이후로 미루지 않는다.
- Roadmap이 C1을 다음 runtime step으로 기록하고 C1–C9를 미구현 상태로 유지한다.

C0–C4는 review와 merge를 마쳤다. C5 implementation은 별도 user review와 merge를
기다리며, 그 전에는 C6를 시작하지 않는다. C0 자체가 runtime behavior를 변경하지
않았다는 historical boundary는 그대로 유지된다.
