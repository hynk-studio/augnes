# Augnes Local Canonical Spec v2.2.2+30 (2026-02-19, r20.1p4p21)

> 패치: **(논문 아이디어 흡수) "Oscillatory control of cortical space as a computational dimension": Context Stencil(공간 억제 스텐실) 규약 추가 + TRL Routing 출력/PCF 결합 + RC/SRF 불변식 유지 + Wiring A0l 포인터 연결** (2026-02-19, r20.1p4p21)

> 패치: **(ops gate) SRF 준수는 “테스트로 입증” 하위 절 추가 + Ops Gate Checklist/PROBE invariance 포인터 연결** (2026-02-12, r20.1p4p19)

> 패치: **(운영 정합성) MN: `mn_conf` 기본 정의(부호 안정성×분산) + priors shared pipeline 동일 코드 경로 불변식 + `prior_pipeline_id` 로깅 권장** (2026-02-12, r20.1p4p18)
> 패치: **(논문 이식) "Hybrid neural–cognitive models reveal how memory shapes human reward learning": Memory-ANN-lite(MN) Control/View 메모리 변수 + 약한 프라이어(prior-only) + 로깅/예시 확장** (2026-02-12, r20.1p4p17)
> 패치: **(논문 이식) "Causal evidence for prefrontal-motor coupling in reward-responsive goal-directed behavior": Goal→Action Coupling(G2A) 지표 + (옵션) ORAV(commit-hold/penalty, 약한 프라이어) 통합 포인트 추가 + 스키마 번들/예시 업데이트(호환 확장)** (2026-02-11, r20.1p4p16)
> 패치: **Render-of-Thought(arXiv:2601.14750v2) 기반 RoTTrace(렌더링된 CoT→단일행 이미지→비전 임베딩) 통합 포인트 추가** (2026-02-10, r20.1p4p15)
> 경로 표기 규칙: 스키마/예시 파일은 `SSOT_SCHEMA_BUNDLE.zip ▸ schema/...`, `SSOT_SCHEMA_BUNDLE.zip ▸ examples/...` (zip 내부 bundle root 기준 상대경로)로 표기한다.

<!-- DOC_ID: CANONICAL -->
<!-- ROLE: 설계 의미/정책 SSOT -->
<!-- SSOT: SSOT-2 (meaning/policy) -->

> **문서 역할:** 설계 의미/정책 SSOT  
> **SSOT 지위:** SSOT-2 (meaning/policy)  
> **이 문서에서 허용되는 변경:** 정의(why/what), 정책 우선순위, 해석 규칙. (필드 계약/타입/경로는 스키마 번들에서만 변경)  
> **상위(업스트림) 기준:** SSOT_SCHEMA_BUNDLE.zip (계약), SSOT_LOGGING_POLICY.md (보관 규칙)  
> **하위(다운스트림) 영향:** WIRING_INTEGRATION_MAP.md, OPS_PLAYBOOK.md, *, *  

---

> 패치: **(논문 이식) "Macaque prefrontal cortex integrates multiple components for metacognitive judgments of working memory"(Ning et al., Neuron 2026): Meta-WM(working-memory confidence) = {wm_strength, uncertainty, trial_history, arousal} 통합 신호 → MUSE-lite/AVR의 전략 선택·opt-out(VERIFY/RETRIEVE/ASK) 게이트 + (권장) 이벤트 payload 확장(wm_meta, wm_dependency_hat) 포인터 추가** (2026-02-05, r20.1p4p14)
> 패치: **(AVR 운영 정산) ScoreReport/캘리브레이션/어블레이션 운영 루틴은 OPS_PLAYBOOK §9.7로 고정(계약 변경 없음; 포인터만)** (2026-02-05, r20.1p4p12)
> 패치: **(정합성) SSOT_SCHEMA_BUNDLE 예시 정규화: event_time_status enum 통일 + PROBE_RUN_END 예시의 compressed_bytes 누락 보완 (스키마/계약 변경 없음)** (2026-02-05, r20.1p4p12)
> 패치: **AVR(Metacog Value/Cost + Rubric): Metacog 후보에 remaining_steps_hat/cost_hat 옵션 + RUBRIC_REPORT 이벤트(후보/산출물 다축 채점) 추가** (2026-02-05, r20.1p4p10)
> 패치: **(논문 이식) "The network architecture of general intelligence in the human connectome"(Wilcox et al., 2026): NetArch-G(Mode/Bridge/SmallWorld) 이벤트 계약(MODE_SWITCH/BRIDGE_CALL/GRAPH_MAINTENANCE) + STATE_SNAPSHOT.state_core.control_mode_id + DuckDB views(WL_netarch_*) 추가** (2026-02-04, r20.1p4p9)
> 패치: **(논문 이식) "Quantifying the compressibility of the human brain"(Weaver et al., 2026): Compressibility Curve(정규화 엔트로피 vs 상관 제약 비율) → CompIndex(저비용 프록시) + PROBE(comp_curve_v0) + Analysis Signal 축 + SRF/Downshift 트리거(권장)** (2026-02-02, r20.1p4p4)
> 패치: **(논문 이식) "Koopman Invariants as Drivers of Emergent Time-Series Clustering in Joint-Embedding Predictive Architectures"(AAAI 2026 / arXiv:2511.09783): KJEPA(near-identity linear predictor) 기반 무감독 레짐 분해 → DigitalTwin(macro_state_id)/BSL change-point/PROBE/Logging 결합** (2026-02-02, r20.1p4p3)
> 패치: **(뉴로모픽 모티브 이식) "Cerebellar components of the human language network"(Neuron 2025): CSB(Cerebellar Satellite Bank) 도입 — Sat-L(Δlogits)·Sat-M(Δpolicy_score) 출력 분리, SRF 블랙리스트 확장, CSB PROBE suite(선택성/혼합성/분리 위반) 추가** (2026-01-31, r20.1p4p2)
> 패치: **(논문 이식) "Structure in noise"(Neuron 2026): SA-axis 변동성(variability) 그래디언트 + recurrent connectivity/Reciprocity Index(RI) → VAR profile(QUENCH/RECURRENT) 레버·계측·PROBE·Self-Graph 연결** (2026-01-31, r20.1p4)

> 패치: **정합성 핫픽스: 스키마 번들 파일명/경로 포인터를 r20.1p1로 갱신** (2026-01-30, r20.1p2)
> 패치: **정합성 핫픽스: ΔQ_hat/ΔQ_over_M 정의(Playbook 포인터) + Integration Map 버전 표기 수정** (2026-01-29, r20.1)
> 패치: **BG/Gate에 초소형 학습 기반 예측 신호(LPS) 추가(옵션, Control/View)** (2026-01-29, r20)
> 패치: **Stop-Rule Firewall(SRF) 명문화: τ_stop 입력 화이트리스트/블랙리스트 + ‘사실상 우회’ 경로 차단** (2026-01-30, r20.1p3)

> 패치: **(즉시 이식) Curation=조성(실패유형 타겟) + Frozen backbone+얇은 헤드 + eff-dim 기반 stochastic 보정 + (옵션A) SD VAE latent 워크스페이스 포맷** (2026-01-24, r19)

> 패치: **AR(추상성) PROBE suite + Latent Axis Bank + instruction-only 형식 수렴 레버 정식화** (2026-01-23, r18)

> 패치: **TRM/CGAR 운영 가성비 이식(PDC/halting/HSW) 규약 추가** (2026-01-20, r14)
> 패치: **Metacognition(MUSE-lite) 규약 추가: competence awareness + strategy selection loop** (2026-01-21, r16)

> 패치: **Self-Graph PSGR(ProgRAG-style) retrieval 규약 + PROGRAG 이벤트 계약 포인터 추가** (2026-01-22, r17)


> 패치: **Hardware/Model RuntimeLimits 인터페이스 추가** (2026-01-05, r1)

> 패치: **Memory(time non-locality)→LRO 운영 번역 + resource/avalanche 계측 포인트 추가** (2026-01-09, r2)

> 패치: **문서 정합성 정리(파일명/용어 토큰 표준화 + 인덱스 번호 수정)** (2026-01-10, r4)

> 패치: **스키마 번들/참조 정리 + 정체 불명 산출물 언급 제거** (2026-01-10, r5)

> 패치: **Intervention 합성 셔플 불변성 테스트 + 스테이지 고정(pre/mid/post) + CSI 순서 교란 포함** (2026-01-13, r6)

> 패치: **SketchPad(저해상도 시각 스케치/latent) 인터페이스 + 계측 포인트 추가** (2026-01-13, r7)

> 패치: **Sidecar_e(t)/QP/z_t 문서 병합 반영 + Start Points를 Playbook 부록으로 통합 + Logging 운영 필드(τ/Q/M, Axis, closure, sync) 정합화** (2026-01-14, r9)

> 패치: **문서 권한 재정렬(모듈 스펙=Sidecar) + 충돌 우선순위 목록 보강** (2026-01-14, r10)

> 패치: **PROBE suite 확장 지원(진단 배터리 포인터) + macro_state 디지털 트윈 결합 포인트 정합화** (2026-01-19, r12)

> 패치: **DigitalTwin(macro_obs_schema_id/hash, centroid_hash, prototypes_topk) + policy_preset 지문 규약 보강** (2026-01-19, r12)

> 패치: **Behavioral State Layer(BSL) 결합 포인트 추가(세션 시작 보수 프리셋 + 행동 상태 라벨)** (2026-01-19, r12)


> 패치: **옵션 A(Analysis Store: DuckDB+Parquet) 도입을 위한 문서/스키마 결합 포인트 추가** (2026-01-19, r12)

> 패치: **오픈엔디드 예측/캘리브레이션 훅(EOP++): wager 필드 + 결과 비교(PREDICT_OBS_COMPARE) 계약 + 과신(Overconfidence) 운영 지표 연결** (2026-01-20, r13)

 **Canonical / Normative**  
> 범위: Augnes Local v2.2의 **핵심 규약(법전)**.  
> 구현 가이드(Playbook)·로그/메트릭 상세(Schema/Appendix)·연구 부록(예: GNWT/IIT)은 **이 문서에 종속**된다.

## 0. 목적과 의도

이 문서는 “문서가 여러 개라서 생기는 모순/중복”을 방지하기 위해, 다음을 **단일 진실 원천(Source of Truth)** 으로 고정한다.

- **정의(용어, 타입, 필드 의미)**
- **불변 규약(무결성, 시간 의미론, 참조 규칙, 업데이트 규율)**
- **핵심 런타임 루프(Observe→PE→IM(eₜ)→Boundary→Gate→Execute/Commit)**
- **Gate(EVC) 의사결정 규칙과 안전장치(과잉반응/진동 억제, 예산)**

---

## 1. 문서 역할 분리 (Normative)

- **Canonical Spec(본 문서)**: “무엇이 참이어야 하는가(규약/정의/필수 조건)”
- **Integration Map**: “문서들이 어디에서 어떻게 맞물리는가(결합 지도, 본 Spec에 종속)”
- **Logging & Metrics Appendix + Schema**: “무엇을 어떻게 기록해야 계산이 가능한가(스키마/필드/메트릭 계약)”
- **Sidecar/QP/z_t Subsystem Spec**: “Sidecar 모듈 스펙(개념/인터페이스/업데이트 규율, 비법전)”
- **Ops/Playbook**: “어떻게 구현/운영할 것인가(절차/튜닝/레거시 별칭 허용)”
- **Research Appendix**: “이론/실험 근거 및 확장 아이디어(운영 규약 아님)”

> 충돌 시 우선순위: **Canonical Spec > Logging Appendix/Schema > Sidecar Spec > Ops/Playbook > Research Appendix**

---

## 2. 핵심 개념 요약

### 2.1 한 줄 구조(운영 핵심)
**Prediction Error (PE)** → **Interoception/Sidecar eₜ + SketchPad 업데이트** → **Boundary(에피소드 종료/인덱싱)** → **Gate(추가 제어 선택)** → **JML/Self-Graph 기록** → (조건부) **Replay/Consolidation**

### 2.2 핵심 원칙 (반드시 지켜야 함)
1) **PE 채널 분리**: `PE_lm`, `PE_tool`, `PE_goal`, `PE_memory`를 섞지 않는다.  
2) **Evidence 경로 단일화**: 외부 사실은 **Evidence Registry를 통해서만** 참조된다.  
3) **요약은 뷰(View)**: 요약/서사는 권위가 아니다. 권위는 **근거(Evidence)** 다.  
4) **시간은 상태 전이 기록**: JML/Evidence는 **3중 시간(event/observed/recorded)** 을 강제한다.  
5) **덮어쓰기 금지**: Claim은 수정하지 않고 **새 버전**을 추가하며 `revises/supersedes/contradicts`로 연결한다.
6) **조기 오류 신호는 ‘근거’가 아니라 ‘진단’**: `EES`(Early Error Signal, ICN-proxy)는 “나중에 틀릴 가능성”을 예측하는 **내부 제어 신호**다. `EES`는 Gate/Policy에만 사용하고, 외부 사실/근거로 인용 금지(필요하면 `StateSnapshot`/Raw Log에만 기록).


7) **SketchPad는 Control/View**: 저해상도 시각 스케치(문제 스케치/자기 스케치)는 **작업/자기모델링을 보조하는 뷰**다. Evidence/Claim로 승격하지 않으며, 로그에는 `hash/ref`만 남긴다. (결정론적 렌더링/정규화 필수)



8) **파생 저장소(Derived Store)는 ‘뷰(View)’다**: DuckDB/Parquet 같은 분석 스토어는 성능/디버깅을 위한 **파생(denormalized) 저장소**일 뿐, 권위(Truth)가 아니다.
   - 금지: 파생 스토어의 산출물로 Evidence/Claim 생성·갱신(승격) 금지
   - 필수: 모든 파생 레코드는 원본으로 되돌아갈 수 있어야 한다(`source_event_id`/`evidence_id`/원문 경로 포인터)
   - 필수: 3중 시간(event/observed/recorded) 의미론은 유지되어야 한다(표현은 달라도 됨)
   - 구현 위치: Playbook §8.4(옵션 A) + Logging Appendix §12.4 + Schema Bundle(`SSOT_SCHEMA_BUNDLE.zip ▸ schema/analysis_*`)
---

## 3. 타입 시스템(공통)

### 2.3 Brain-wide loops 운영 전제 (Phase-conditioned loops + CSI)

이번 세션(IBL brain-wide loops) 결론을 **설계 철학**이 아니라 **운영 전제/계약**으로만 흡수한다.
정책(무엇을 해야 하는가)은 바꾸지 않고, “언제/왜 개입했는가”를 더 정확히 측정·교정한다.

#### 2.3.1 EES는 “예측 오류 채널”이다 (Normative)
- EES(Early Error Signal, ICN-proxy)는 **외부 정답/피드백이 도착하기 전에 올라오는 예측 오류 코딩**으로 취급한다.
- 따라서 EES는 **Evidence/Claim 권위로 승격 금지**.
  - 사용처: Gate/Intervention/Policy(제어) 전용
  - 기록 위치: `StateSnapshot`/Raw Log(또는 동등 이벤트)만 허용

#### 2.3.2 phase별 루프 재구성은 정상이다 (Assumption)
- 동일 과업이라도 `phase`(ACQUIRE/VERIFY/COMMIT/CONSOLIDATE)에 따라 내부 루프 부하/경로가 달라지는 것을 정상으로 본다.
- 결과: EES는 전역 단일 임계값이 아니라 **phase-conditioned baseline/threshold**를 갖는 것이 자연스럽다.
  - 단, 임계값/히스테리시스 테이블은 **offline-config**로만 관리(온라인 자동 업데이트 금지).

#### 2.3.3 Stability is a first-class quality axis (CSI)
정답률 외에 “내부 경로의 안정성(재현성/회복성)”을 1급 지표로 둔다.

- `Coalition Stability Index (CSI)`:
  - 동일 과업을 seed/미세 변형으로 반복했을 때
    `StateLabel`, `PolicyLever`, `Router route` 시퀀스의 유사도 기반 점수

- (r6) CSI는 **순서 교란(셔플) null**을 함께 기록한다.
  - 목표: “원소(레버/라벨)가 비슷해서 비슷해 보이는 것”과 “순서까지 안정적인 것”을 분리한다.
  - 권장 저장: `CSI_phase/CSI_global`(order-aware) + `CSI_shuffle_null_mean/CSI_order_gain`(해석 보조). (Logging Appendix §13.7.1)

왜 필요한가
- 분산 루프 구조에서는 “이번엔 맞았고 다음엔 틀림”이 자주 발생한다.
- CSI는 그 전조(내부 출렁임)를 잡는 지표다.
- 장기 메모리(JML)와 자기개선 루프에서, CSI가 낮은 정책은 **재현성이 약해 교정이 어려워** 독으로 작동한다.

운영 규칙(요지)
- CSI는 **평가/회귀(regression) 게이트**에만 사용한다.
- CSI를 라우팅 자체의 자동 규칙으로 쓰지 않는다(평가 축으로만).
- 세부 필드/스키마/실험 루틴은 아래 문서에서 정의한다:
  - `SSOT_LOGGING_POLICY.md`
  - `OPS_PLAYBOOK.md`


### 3.1 식별자 타입
- `session_id`: 세션 식별자
- `episode_id`: 에피소드(작업 run) 식별자
- `trace_id`: 실행 트레이스 식별자(트리 구조)
- `claim_id`: Claim 식별자(UUID 권장)
- `evidence_id`: Evidence 식별자(**UUID 고정**)
- `tool_run_id`: 단일 툴 호출/결과 식별자(UUID 또는 시스템 고유키)

### 3.2 TimeStamp 타입 (표현 허용 범위)
본 규약은 **의미(semantics)** 를 강제하고, 표현(encoding)은 아래 중 하나를 허용한다.

- **RFC3339 문자열**: `"2025-12-16T23:40:00+09:00"`
- **epoch_ms 정수**: `1734360000000`

단, **동일 저장소(JML/Evidence/Claim) 내부에서는 한 가지 표현을 일관되게 사용**해야 한다.  
(예: JML은 전부 RFC3339, Event 로그는 전부 epoch_ms)

---

### 3.3 Core Runtime State Types (System 3 지원)

본 섹션은 Augnes Local의 **지속형 메타-레이어(=System 3 아날로그)** 가 참조하는 최소 상태 타입을 정의한다.

- 이 타입들은 **외부 사실(Evidence)** 이 아니라, **내부 제어/뷰(View/Control)** 이다.
- 따라서 `Evidence Registry`(§6)와 **혼합 저장 금지**. (Evidence는 *근거*, 아래는 *상태/정책*이다.)

```yaml
SelfModel:
  identity_goal: str|null            # 장기 정체성 목표(권장). ex) "지속적 개선과 협업"
  terminal_creed: [str]              # 변경 불가한 0..N개 문장(권장). 금지/약속/핵심 기준.
  capability:                         # 자기평가(뷰). 근거는 JML/Evidence로 남김.
    "<skill>": float                 # 0..1
  limits:                             # 하드 제한/금지/자원상한 등
    "<limit>": str
  last_update:
    observed_time: TimeStamp
    recorded_time: TimeStamp

UserModel:
  user_id: str|null                  # 익명 가능
  inferred_goals: [str]
  knowledge_level: { "<topic>": float }|null   # 0..1
  affect: { label: str, confidence: float }|null
  interaction_prefs: { verbosity: str, tone: str }|null
  last_update: TimeStamp

DriveState:
  drive: { curiosity: float, mastery: float, relatedness: float } # 0..1
  beta: { intrinsic: float, extrinsic: float }                   # 합=1 권장
  r_int_nl: str|null                 # 자연어 내재 보상(로그용, 뷰)
  last_update: TimeStamp


EarlyErrorSignal:
  ees: float                          # 0..1 (높을수록 '나중에 틀릴' 가능성↑). 근거가 아니라 진단.
  components:                         # (optional) 디버깅용 분해
    candidate_incongruence: float|null
    verifier_conflict: float|null
    tool_risk: float|null
  last_update: TimeStamp

SatelliteState:                        # CSB(Cerebellar Satellite Bank) 런타임 상태(권장)
  mode: "off"|"observe_only"|"assist_logits"|"assist_policy"
  profile_id: str                      # sat profile (예: sat_l_v0, sat_md_v0)
  output_type: "logits"|"policy"
  gain: float                          # 적용 gain (jerk-limited)
  clip: float                          # absolute clip bound
  selectivity_score: float|null        # 0..1 (높을수록 특정 도메인 선택적)
  mixedness_score: float|null          # 0..1 (높을수록 도메인 혼합)
  delta_logits_l1: float|null          # applied delta magnitude summary (logits)
  delta_policy_l1: float|null          # applied delta magnitude summary (policy)
  separation_violation: bool           # Δlogits와 Δpolicy를 동시에/혼동하면 true
  disabled_reason: str|null

GoalSpec:
  goal_id: UUID
  goal_text: str
  source: "extrinsic"|"intrinsic"
  priority: int
  success_criteria: [str]|null
  deadline: TimeStamp|null
  parent_goal_id: UUID|null

TraceCapsule:
  trace_id: UUID
  episode_id: UUID
  goal_id: UUID
  context_refs: { evidence_ids: [UUID], claim_ids: [UUID] }  # 근거는 ID로만
  plan_summary: str
  action_seq: [{ tool_run_id: UUID, action: str, outcome: str }]
  outcome_summary: str
  cost: { reasoning_steps: int|null, tool_calls: int|null, latency_ms: int|null }
  reuse: { reusable: bool, reuse_key: str|null }
  raw_reasoning_ref: str|null        # 로컬 파일/스토리지 키 (Evidence 아님)
```

### 3.3.1 RuntimeLimits / Hardware-Model Profile (권장 인터페이스)

Augnes Local은 “예산 내장 런타임”을 표방하므로, **현실 자원(특히 VRAM/컨텍스트/KV)** 을 ‘감’이 아니라 **상태/제어(View/Control)** 로 다룰 수 있어야 한다.  
따라서 구현은 다음의 `RuntimeLimits`(또는 동등한 구조)를 **StateSnapshot/Boundary 커밋**에 기록하는 것을 권장한다.

- `RuntimeLimits`는 **Evidence가 아니라 Control/View** 이다(§3.3 원칙 동일).
- 기록 목적은 “정당화”가 아니라 **재현성/디버깅/정규화(Workload 보정)** 이다.
- 값은 하드웨어가 바뀌면 달라질 수 있으므로, Canonical은 “필드 의미”만 고정하고 **구체값은 Ops/Playbook** 에 둔다.

권장 최소 스키마(구현 확장 가능):

```yaml
RuntimeLimits:
  profile_id: str|null                 # 예: "HW4070S_12GB__BB7B_Q4__GPU1"
  vram_cap_mb: int|null                # 운영 상한(가드레일)
  cpu_ram_cap_mb: int|null
  max_gpu_jobs: int|null               # 기본 1 권장
  default_ctx_cap: int|null            # 기본 컨텍스트 상한(예: 8192)
  kv_cache_policy:
    mode: str|null                     # 예: "fp16"|"8bit"|"kv-quant"|"offload"
    kv_offload_allowed: bool|null
  offload_policy:
    cpu_offload_allowed: bool|null
    nvme_offload_allowed: bool|null
  model_residency:
    backbone: str|null                 # 예: "resident_gpu"
    router: str|null                   # 예: "cpu_resident"
    verifier: str|null                 # 예: "cpu_rule_first__llm_on_demand"
    summarizer: str|null               # 예: "cpu_resident"
    embedding: str|null                # 예: "cpu_resident"
```

**규율(필수 권장)**
- `RuntimeLimits` 값/프로파일은 `STATE_SNAPSHOT` 및 `WL_*`(워크로드 보정 변수)로 함께 기록해, “그날 일이 빡셌음”과 “자원이 빡셌음”을 분리한다.
- 어떤 경우에도 `RuntimeLimits`/프로파일 값은 Evidence/Claim의 근거로 인용하지 않는다(권위 누수 경로).



**Raw reasoning 저장(선택) 규율**
- `raw_reasoning_ref`는 “재사용”을 위한 저장소 포인터일 뿐이고, **Evidence로 승격 금지**.
- 재사용 시에도 Validator/Verifier를 통과해야 하며, 실패 시 “선례(trace)”는 폐기/냉각된다.



---


### 3.3.2 StateLabel / Zone / Phase (Normative, minimal)

Augnes Local은 운영 안정화를 위해, “지금 시스템이 어떤 구간에 있는가”를 **결정론적 라벨**로 요약해 둔다.  
이 라벨은 **근거(Evidence)** 가 아니라 **상태/제어(View/Control)** 이며, `STATE_SNAPSHOT`에만 기록한다.

- `phase`: {`ACQUIRE`, `VERIFY`, `COMMIT`, `CONSOLIDATE`}  
  - 의미: 루프의 **의도/편향**. 같은 과업이라도 국면에 따라 예산·쿨다운·허용 액션이 달라진다(§2.3.2).
- `zone`: {`subcritical`, `near_critical`, `supercritical`}  
  - 의미: 현재 루프가 **과소전파/정상/과잉증폭** 중 어디에 가까운지에 대한 운영 라벨.  
  - 산출 입력(권장): `PE_*_w`, `EES_*`, `PolicyFlipRate`, `Revision/ContradictionRate`, `ModuleSynchronyIndex`, (옵션) `G2A_CouplingIndex(g2a_coupling_hat)`/`AvalancheIndex`/`resource_state`(§5.2.1, §11.3).  
  - 목적: “어떻게 말할지”가 아니라 “얼마나 공격적으로 개입할지(예산/쿨다운/라우팅)”를 고정한다. (`τ_stop`은 SRF 전담; 정책 레버로 직접 조정 금지)
- `state_label`: `zone × phase`를 최소 단위로 포함하는 문자열/튜플(예: `near_critical/VERIFY`).  
  - 구현은 자유지만, **동일 입력→동일 출력**이 되도록 결정론적으로 만든다.

> NOTE: zone/phase의 상세 라우팅 룰은 Appendix의 State→Policy Map(§13)에 두되, Canonical은 **의미와 금지 규칙(근거 승격 금지)** 만 고정한다.



### 3.3.3 Visual SketchPad / SketchLatent (권장 인터페이스)

**목표(운영)**: “텍스트만으로는 표현/유지가 비싼 구조”를 **저해상도 ‘시각-스케치’ 공간**에 고정해서,  
(1) **문제 풀이(작업메모리 증강)** 뿐 아니라 (2) **자기인식/자기모델링(메타-컨트롤러 관찰)** 에도 재사용한다.

- 동기: MIRA (arXiv:2511.02779v1)는 “중간 스케치/도식/경로” 같은 시각 중간표현이 없으면 성능이 크게 무너지는 과제를 묶어 평가하고, **중간 시각 단서가 주어질 때 성능이 일관되게 오른다**는 걸 보여준다.
- 구현 힌트: “선/박스/표식” 같은 **primitive 기반 스케치**(Visual Sketchpad)와, 텍스트 생성 과정에 **시각 latent를 끼워 넣는** Latent Sketchpad 같은 설계가 현실적인 레퍼런스다.  
  단, Augnes Local은 **로컬/저비용 우선**이므로 *초기에는 이미지 생성/비전 모델이 없어도* “저해상도 그리드/도식 토큰”으로 시작한다.

#### 타입(권장)

```yaml
SketchPadState:
  sketch_self: SketchBlob|null     # 자기-스케치(시스템 상태 다이어그램), boundary 기준 갱신 권장
  sketch_task: SketchBlob|null     # 문제-스케치(작업 스크래치패드), MID stage에서만 갱신 권장
  last_update: TimeStamp

SketchBlob:
  kind: "self"|"task"
  repr: "grid8"|"vq_codes"|"ascii"|"img_ref"|"sd_vae_latent"
  res: { w: int, h: int }          # 예: 24x24, 32x32 (초기엔 작게)
  primitives: [SketchPrimitive]|null   # (권장) 순서-불변 primitive 집합
  token_codes: [int]|null              # (옵션) VQ 코드/토큰화된 스케치
  latent_f16: [float]|null             # (옵션) 저차 latent (예: 64~256d)
  render_ref: str|null                 # 로컬 debug-store 키(무거운 payload는 여기)
  hash: str                            # `repr/res/primitives(or codes)/version`의 결정론적 해시
  notes: str|null

SketchPrimitive:                       # 최소 오퍼레이션(primitive)
  op: "line"|"box"|"mark"|"text"|"node_edge"
  params: { ... }                      # 좌표/라벨/스타일(극소)
```

#### 규약(필수)

1) **Control/View 전용**: SketchPad는 Evidence/Claim/Workspace의 “권위”가 아니다.  
   - 금지: “스케치에 그려져 있으니 사실이다”  
   - 허용: “스케치로 구조를 유지했고, Evidence를 다시 확인했다”

2) **결정론/정규화(필수)**:  
   - `primitives[]`를 **정규화된 집합**으로 다루고, 렌더링은 항상 **정해진 정렬 규칙**으로 수행한다.  
   - 목적: 디버깅/회귀테스트에서 *순서가 바뀌어도 동일 스케치*가 나오게 하려는 것(Intervention 셔플 불변성과 같은 계열).

3) **업데이트 스테이지 고정(필수)**:  
   - `sketch_self`: **Boundary 커밋**(또는 Observe 직후)에서만 갱신(진동 억제).  
   - `sketch_task`: **MID stage**(추론/계획 중)에서만 갱신, 종료/커밋 단계에서는 “최종본만” 남김.

4) **저해상도 우선(필수)**:  
   - 초기 목표는 “그럴듯한 그림”이 아니라 **메타-컨트롤러가 보기에 충분한 압축**이다.  
   - 권장: 24x24~32x32 `grid8` 또는 64~256d `latent_f16` + `hash`만 남기고, 원본은 debug-store에.

5) **예산 내장(필수)**:  
   - SketchPad 업데이트는 `budget_profile`의 일부로 취급한다(토큰/시간/툴콜과 동일).  
   - 기본값은 OFF, `route_tier`/`EES`/`PE_*`가 “구조 유지가 유리”하다고 판단할 때만 ON.

> NOTE: 이 섹션은 “스케치가 답을 대신한다”가 아니라, **상태/구조를 안정적으로 고정**해서 Gate/Verifier/리트리벌이 더 싸게 돌아가게 만드는 목적이다.





#### (NEW) Render-of-Thought (RoT) Trace — “CoT를 단일행 이미지로 렌더 → 비전 임베딩으로 압축” (옵션)

- 출처: **Render-of-Thought: Rendering Textual Chain-of-Thought as Images for Visual Latent Reasoning** (arXiv:2601.14750v2)
- 요지:
  - 긴 텍스트 CoT는 토큰/지연 비용이 크다.
  - CoT step을 **단일행 이미지**로 렌더하고, VLM의 **비전 인코더 임베딩**을 “연속 latent 토큰”처럼 취급해
    (a) 로그/메모리에서 압축하고, (b) (중기) text 대신 latent로 추론하는 방향까지 열어둔다.
- Augnes Local에서의 해석: RoTTrace는 **SketchPad의 변종**이다. 즉, **Control/View 전용의 저대역 공용 표현(증거 아님)** 으로만 사용한다.

**RoTTraceCapsule (권장 최소, Control/View)**
```yaml
RoTTraceCapsule:
  mode: "log_only" | "latent_reasoning"
  encoder_id: str                 # 예: "qwen3-vl-4b/vision_encoder@<rev>"
  render_cfg:
    height_px: int                # 권장: 32
    font_px: int                  # 권장: 20
    padding_px: int               # 권장: 4
    single_line: bool             # true
    width_mode: "dynamic"         # text 길이에 따라 폭 가변
  token_budget: int               # latent_reasoning 모드에서 고정 예산 권장(예: 32/64)
  step_count: int                 # 원 CoT step 수(있으면)
  seq_len: int                    # latent 토큰 길이(=token_budget 또는 실측)
  trace_ref: str                  # debug-store의 번들 키(이미지/임베딩 시퀀스)
  trace_hash: str                 # cfg+inputs 결정론 해시
  saturation_plateau_at: int|null # (옵션) 임베딩 동질화 시작 인덱스
  notes: str|null
```

**통합 위치(권장)**
- (권장) `SketchPadState.sketch_task`를 `repr="img_ref"`로 두고, `ref`(또는 meta의 `render_ref`)가 RoT 번들을 가리키게 한다.
  - (옵션) `latent_f16`에 trace의 pooled embedding(또는 첫 k 토큰 평균)을 넣어 “초저비용 검색키”로 사용.
- (대안) `Workspace.artifacts.rot_trace`로 분리해도 된다. 단, 권한은 동일하게 **Control/View**.

**금지 규칙(필수)**
- RoTTraceCapsule은 **Evidence/Claim 승격 금지**. (임베딩 유사도 → 사실/정답 주장 금지)
- (운영) latent_reasoning 모드에서 **동적 종료 토큰(self-stop)** 대신 **fixed token budget**을 우선한다.
  - (해석) “토큰이 충분히 지나면 임베딩이 서로 비슷해지는 plateau”가 관측되면, 그 구간은 조기 종료 후보로만 취급한다(근거 아님).

#### (NEW) SketchPad를 “이미지 파일”이 아니라 “공유 표현 공간(latent)”로 다루는 워크스페이스화(중기 이식 방향)

- 핵심: SketchPad는 ‘그림’이 아니라, Step Loop/Router/Verifier가 함께 보는 **저대역 공용 상태**(shared representation workspace)로 취급한다.
- 저장 원칙:
  - *무거운 payload*는 `debug-store`/`analysis-store`에 두고, Canonical 상태에는 `hash/ref/meta`만 둔다.
  - `Workspace`에는 `workspace.artifacts.sketchpad`로 붙일 수 있으나, **증거/사실의 권위는 여전히 Evidence Registry**에만 있다.
- 사용 원칙(가성비):
  - Gate/Verifier가 “구조가 유지되는지”를 싸게 점검하는 용도(=텍스트로 유지하기 비싼 구조를 고정).
  - solve 컨텍스트에 직접 주입하지 말고, Control/View로만 사용(오염 방지).
- 포맷:
  - MVP: `grid8` + `primitives[]` + `hash` (Playbook §3.2.2)
  - (옵션A) `sd_vae_latent`: Stable Diffusion 계열 VAE latent를 워크스페이스 포맷으로 저장(아래 “Option A” 참고)

#### Option A: SD VAE latent 워크스페이스 포맷(권장: 운영 실험용)

- 목적: “스케치=저대역 구조 버퍼”를 더 풍부한 연속 표현으로 바꾸되, **백본/멀티모달 학습 없이** 운영 실험이 가능하게 만든다.
- 규약(권장 최소):
  - `repr="sd_vae_latent"`일 때 `render_ref` 또는 `sd_vae_meta.latent_ref`는 **VAE latent blob**(예: [4,h,w] f16/q8)을 가리킨다.
  - `sd_vae_meta.vae_id`는 반드시 기록(동일 latent라도 VAE가 달라지면 의미가 바뀐다).
  - `sketch_hash`는 `(vae_id, latent_shape, codec, latent_scale, latent_bytes)`를 포함해 계산한다(결정성/회귀용).

### 3.3.4 DigitalTwin / SSM-lite Macro State (권장 인터페이스)

**목표(운영)**: 로컬 환경에서 매 턴 “전체 히스토리 기반 정밀 검증”을 상시로 돌리면 비용이 폭발한다.  
그래서 (e_t, z_t, QP 요약, trace, budget 등)으로 만든 **거시 관측(macro_obs) → 거시 상태(macro_state)** 를 먼저 추적하고,
위험 신호가 있을 때만 **선택적 줌인(비싼 검증/재호출)** 을 트리거한다.

- DigitalTwin은 **Evidence/Claim가 아니라 View/Control** 이다.
  - 금지: “macro_state_id가 이러니 사실이다”
  - 허용: “macro_state가 위험이라 미시 검증을 더 했다(근거는 별도 Evidence로 확인)”

#### 타입(권장)

```yaml
DigitalTwin:
  # (A) macro_obs: 거시 관측 벡터(또는 그 포인터)
  macro_obs_schema_id: string|null     # 슬롯/스케일/정규화 규약 ID (예: "macro_obs_v0.1")
  macro_obs_hash: string|null          # 정규화된 macro_obs_t의 결정론적 해시(sha256 권장)
  macro_obs_ref: string|null           # 무거운 원본/벡터는 debug/analysis-store 키로 포인터만
  macro_obs_codec: string|null         # 예: "json", "f16", "npz", "parquet_row"

  # (B) macro_state: 이산 거시 상태 포인터
  macro_state_id: string|null
  macro_state_version: string|null     # centroid/HMM 파라미터 세트 버전(혼합 금지)
  macro_state_confidence: float|null   # 0..1 (soft assignment)
  macro_state_method: string|null      # kmeans|gmm|hdbscan|hmm|other
  macro_state_method_params_hash: string|null
  centroid_hash: string|null           # centroid/모델 파라미터 아티팩트 해시

  # (C) 위험/전이
  risk_set_id: string|null
  risk_score: float|null               # 0..1 (운영용)
  next_state_topk: [{state_id: string, p: float}]|null

  # (D) 해석/재현(권장)
  prototypes_topk: [{episode_id: string, score: float|null}]|null
  zoom_in_trigger: {triggered: bool, reasons_topk: [string]|null, linked_trace_id: string|null}|null
  last_update: TimeStamp|null
```

#### 규약(필수)

1) **버전/해시 고정**:
- `macro_obs_schema_id`는 “슬롯 순서/정규화/스케일링”을 고정한다.
- `macro_state_version`이 바뀌면 **전이행렬(P̂)/risk 통계는 리셋 또는 버전 분기**(혼합 금지).

2) **정규화 후 해시**:
- `macro_obs_hash`는 *원시값*이 아니라, 문서화된 정규화(clip/scale/eps) 이후의 벡터에 대해 계산한다.
  - 목적: 오프라인 배치/회귀 분석에서 “같은 거시 관측인가”를 결정론적으로 판정.

3) **온라인은 ‘할당/트리거’만**:
- 온라인 루프에서 centroid 재학습/리스크 재산출을 하지 않는다(비용/진동/오염).
- 재학습/재산출은 옵션 A(파생 분석 스토어) 같은 배치 경로로 돌린다.

4) **stop-rule 독립(재확인)**:
- `risk_score`가 높아도 `τ_stop`/BG stop-rule을 override하지 않는다.

> 기록 위치(권장): `STATE_SNAPSHOT.payload.digital_twin` 또는 `JML_ENTRY.payload.digital_twin`.
> 필드/이벤트 키의 정식 정의는 Logging Appendix/Schema Bundle을 따른다.



#### (NEW) KJEPA: Koopman Invariant JEPA로 macro_state 만들기 (옵션 A 권장)

아래 내용은 **DigitalTwin을 “싸고 안정적인 거시 상태 추적기”로 만드는 방법**이다. 핵심은 *“time-series 표현을 예측하려면, 예측이 가장 쉬운 축(=불변량)이 먼저 드러난다”*는 점이다.

- 가정(직관적 번역):
  - `macro_obs_t`(또는 time-window `x_t`)는 여러 **레짐(regime)**(서로 다른 ergodic component)의 혼합에서 나온다.
  - 레짐을 가르는 **indicator 함수 χ_i(x)**는 Δ-step **Koopman operator**의 고유함수(고유값 1) = **불변량(invariant)** 이다.
- 결과:
  - JEPA의 예측 목적(특히 **선형 predictor** `M`)은 이 **불변량 부분공간**을 암묵적으로 선호하고,
  - predictor에 **near-identity 유도(M≈I)** 를 걸면(정규화/제약), indicator들이 선형 혼합으로 “얽히는(entangled)” 동치해 중에서 **해석 가능한(레짐 분리되는) 해**를 선택하게 된다. (AAAI 2026 / arXiv:2511.09783)

**Augnes 적용(권장 파이프라인)**
1. `macro_obs_t` 시퀀스(또는 boundary window)로 **KJEPA 인코더**를 오프라인 학습한다.  
   - 학습 목표: `M f(x_t) ≈ f(x_{t+Δ})`  
   - 유도 바이어스: `||M - I||` (또는 스펙트럼 반경) 페널티를 줘서 `M`이 거의 항등처럼 동작하게 만든다.
2. 인코더 출력 중 **불변량 임베딩 z_inv**로 k-means/GMM 등을 돌려 **레짐 클러스터**를 만든다.
3. 각 클러스터를 `macro_state_id`로 매핑하고, `P_hat`(전이행렬)·`state_risk[m]`를 배치로 갱신한다.
4. 온라인 루프는 **id 할당 + 위험 시점 줌인 트리거**만 담당한다(학습/클러스터링은 A).

**권장 규약(필드)**
- `macro_state_method = "koopman_jepa_v0"`
- `macro_state_method_params_hash`: (Δ, encoder arch, M-identity penalty, dataset slice, clustering k 등) 지문
- `centroid_hash`: (a) 클러스터 centroid 해시 또는 (b) 모델 아티팩트 해시 중 하나로 통일
- `prototypes_topk`: 레짐별 대표 `episode_id`(또는 trace) 포인터

**주의(중요)**
- predictor가 자유롭거나 `M≈I` 유도가 없으면, indicator들의 **선형 혼합**도 같은 손실을 만들 수 있다(=얽힘).  
  그래서 최소한 아래 둘 중 하나는 걸어두는 게 낫다:
  - `||M-I||_F^2` 정규화(권장)
  - `ρ(M)≈1`(스펙트럼 반경) + cluster centroid에 대한 “거의 항등” 검증(PROBE)

**PROBE(권장)**
- `probe_suite_id="koopman_invariants_v0"`
  - invariance_score(레짐 내 분산↓), separation_score(레짐 간 분리↑)
  - identity_penalty(M≈I), spectral_radius(M), entanglement_score(혼합/회전 정도)


### 3.3.5 Behavioral State Layer (BSL) / Session-onset Change Point (권장 인터페이스)

**목표(운영)**: 세션(또는 연속 작업) 내부에서 행동이 ‘갑자기 바뀌는’ 구간을 싸게 포착해서,
- (i) **초반 과잉개입/과잉확신을 줄이고**(보수 프리셋),
- (ii) 상태-정책 매핑을 **더 높은 해상도 라벨**로 안정적으로 붙이며,
- (iii) z_t(레짐 커밋)이나 macro_state(디지털 트윈)로 넘어가기 전에 **중간 계층의 설명 가능 뷰**를 만든다.

이 레이어는 논문식 diHSMM/iHSMM 같은 “행동 상태(behavioral states) + 세션 경계 변화점” 관찰을
Augnes Local 운영 언어로 옮긴 것이다. 중요한 점은 하나다:
- BSL은 **Control/View** 이다. Evidence/Claim로 승격 금지.

#### 용어 충돌 방지(필수)
- 여기서 말하는 **behavior_stage_id**는 “학습/이해 단계(예: 3단계)” 같은 *행동 단계*다.
- Step Loop의 **STAGE: PRE/MID/POST**(r6 고정)와는 완전히 다른 단어다.
  - 그래서 모든 필드에 `behavior_` 접두사를 붙인다(혼동 방지).

#### 타입(권장)

```yaml
BehaviorState:
  # (A) 이산 상태: “지금의 행동 모드” (세션 내부에서 의미가 있는 단위)
  behavior_state_id: string|null          # 예: "b12" (구현체별)
  behavior_state_confidence: float|null   # 0..1

  # (B) 조잡한 단계: coarse stage(예: 3단계 구분)
  behavior_stage_id: string|null          # 권장: "S1"|"S2"|"S3" (또는 1|2|3)

  # (C) 세션 위치(정규화)
  session_pos_norm: float|null            # 0..1 (세션 시작=0)

  # (D) 최근 전환 이벤트(요약 포인터)
  last_switch:
    from_state_id: string|null
    to_state_id: string|null
    reason: string|null                   # 예: "session_boundary"|"policy_shift"|"behavior_change"
    ts: TimeStamp|null
```

#### 규약(필수)

1) **권위 제한**: BSL은 (i) intervention 검색의 state_labels, (ii) policy preset 선택, (iii) 안전장치(쿨다운/히스테리시스) 트리거에만 쓰고,
Evidence/Claim의 진실 판정으로 쓰지 않는다.

2) **라벨 생성 규칙**(권장):
- base `state_label`(zone×phase)은 항상 포함.
- `session_pos_norm ≤ θ_start`면 추가 라벨 `session_start`를 포함한다.
  - θ_start 권장값: 0.10 (세션 길이 정의가 애매하면 0.15까지 허용)
- `behavior_state_confidence ≥ θ_b`일 때만 BSL 라벨을 붙인다.
  - θ_b 권장값: 0.6
- 라벨 형태(권장, 저카디널리티 유지):
  - `bstage/S1`, `bstage/S2`, `bstage/S3`
  - `bstate/b12` (상태 수가 폭발하면 `bstate/<hash8>` 같은 압축 ID로)

3) **z_t / macro_state와의 관계**:
- BSL은 “세션 내부 상태”이고, z_t는 “되돌리기 어려운 커밋”, macro_state는 “오프라인/배치 기반 거시 상태”다.
- BSL이 z_t를 직접 바꾸지 않는다.
  - 허용: BSL 변화가 *z_t 후보를 제안*하거나 “추가 검증/쿨다운”을 트리거.
  - 금지: BSL 변화 = 곧바로 레짐 커밋.

4) **로그 위치(권장)**:
- `STATE_SNAPSHOT.payload.state_core.behavior_state.*`
- (선택) 전환 이벤트를 따로 남기면 `BEHAVIOR_STATE_SWITCH`(Logging Appendix에서 정의)로 기록.

> NOTE: BSL은 ‘정교한 행동 모델’을 이식하는 게 아니라, **세션 경계에서 변화가 몰리는 패턴을 운영적으로 활용**하기 위한 얇은 계층이다.

### 3.3.6 PolicyPreset / Offline Config Fingerprint (권장)

정책 레버/예산 규율은 실험/운영 중에 자주 바뀐다.  
그래서 “지금 어떤 정책 조합으로 굴러가고 있나”를 **재현 가능한 지문**으로 남긴다.

- `policy_preset_id`: 사람이 이해하는 이름(예: `default_local_v0`, `shadow_sweep_202601`) 
- `policy_preset_version`: 버전 문자열(예: `v0.1.3`) 
- `policy_preset_hash`: 실제 레버/threshold/config를 직렬화한 해시(sha256 권장)

규약:
- `policy_preset_hash`는 “사소한 공백/키 순서”에 흔들리지 않게 canonical JSON/YAML 정규화 후 계산한다.
- 기록 위치(권장): `STATE_SNAPSHOT.payload.policy_snapshot.preset.*` 또는 `JML_ENTRY.payload.policy_snapshot.preset.*`.



### 3.3.7 Competence Awareness / Metacog Cycle State (권장 인터페이스)

> 목적: “내가 지금 이 문제(또는 전략)에 대해 **얼마나 할 수 있는지**”를 *측정(자기평가)*하고, 그 측정치를 기반으로 **전략을 갈아타며 반복**하는 제어 루프를 아주 싸게 붙인다.  
> 주의: 여기서 competence는 **Claim의 진실성(confidence/evidence)**이 아니라, **행동/전략의 성공가능성**이다.

#### (A) CompetenceScore (권장)
- `competence_hat`: float in `[0,1]`  
  - 의미: *주어진 스코프에서* “이 전략/플랜이 성공할 확률”에 대한 추정치
- `competence_u`: float in `[0,1]`  
  - 의미: 불확실성(표본 부족/캘리브레이션 불량/OOD 징후 등)


- (NEW, optional) `wm_meta`:
  - 목적: “지금 내가 들고 있는 작업용 기억(working memory)이 믿을 만한가?”를 별도 스칼라로 추정해,
    - 내부 기억 의존 전략(S0/S1 등) vs 외부 검증/검색 전략(S2/S3/S4) 선택을 보정하고,
    - low일 때는 opt-out(VERIFY/RETRIEVE/ASK)로 빠지게 한다.
  - 구성(권장 최소):
    - `wm_strength_hat`: float in `[0,1]`  # 기억 흔적 강도/일관성 프록시
    - `wm_uncertainty_hat`: float in `[0,1]`  # 불확실성/드리프트 프록시
    - `history_bias_hat`: float in `[-1,1]`|null  # 최근 성공/실패/오류 방향성(보수/과신) 바이어스
    - `arousal_proxy`: float in `[0,1]`|null  # resource_state/fatigue/latency 기반 프록시
    - `meta_wm_hat`: float in `[0,1]`  # 통합된 meta-working-memory 신호(=opt-out gate 입력)
  - 불변 규칙:
    - `wm_meta.*`는 **Control/View 전용**. Evidence/Claim confidence로 승격 금지.
    - `competence_hat`/`meta_wm_hat`/`claim.confidence`는 서로 대체 금지(각각 “정책 성공”, “기억 신뢰”, “주장 진실성”).
- `scope` (권장 최소 키):
  - `goal_id`: string|null
  - `task_id`: string|null
  - `strategy_id`: string
  - `plan_hash`: string|null
  - `route_tier`: string|null
  - `toolset_id`: string|null
- `calibration` (권장):
  - `ece`: float|null
  - `brier`: float|null
  - `n`: int|null
  - `last_fit_time`: TimeStamp|null

#### (B) MetacogCycleState (권장)
- `metacog_cycle_id`: string (`mc_<uuid>` 권장)
- `attempt_i`: int (0부터)
- `candidate_k`: int (이번 tick에서 비교한 후보 수)
- `selected_strategy_id`: string
- `veto_reason`: string|null
- `status`: string (권장 enum: `running|succeeded|failed|stopped`)
- `stop_reason`: string|null (stop-rule과 동일한 enum 사용 권장)

#### (C) 저장 위치(권장)
- `STATE_SNAPSHOT.payload.state_core.metacog` (권장)
- Sidecar `e_t`/`z_t`의 meta slice에 **압축 저장**(예: `competence_hat`, `competence_u`, `mc_cycle_running`)

#### (D) 금지/불변 규칙(필수)
- `competence_hat`는 **Evidence/Claim confidence로 승격 금지** (Control signal only)
- stop-rule은 항상 상위이며, MetacogCycle은 stop-rule을 우회할 수 없다.

### 3.4 Intervention & Policy Types (Normative)

Intervention/Policy는 **Evidence가 아니라 View/Control** 이다.  
즉, “외부 사실/주장”을 만들거나 바꾸지 않고, **Gate(EVC)의 후보/우선순위/예산/쿨다운 등 ‘제어 레버’** 에만 영향을 준다.
(이 원칙을 깨면 Evidence 우회/권위 누수 경로가 생겨서 설계가 바로 썩는다.)

권장 최소 타입(필드 일부는 구현에서 확장 가능):

```yaml
InterventionSpec:
  intervention_id: UUID
  name: string
  kind: enum                      # param|policy|structural|learning (권장)
  when:
    state_labels: [string]        # 현재/최근 label 포함
    route_tiers: [string]|null    # TRL Router tier (선택)
    preconditions: [string]|null  # 가벼운 가드(예: "EES>0.7", "cooldown==0")
  effect:
    policy_delta: PolicyDelta|null
    gate_prior: GatePrior|null
    candidate_injection: [object]|null   # (action_type + params) 후보 주입 (cap 필수)
  guardrails:
    budget_cap: object|null       # {tokens, tool_calls, verifier_budget, retrieval_budget, memory_write_budget, probe_budget, replay_budget}
    prior_clip: float|null        # 권장 ±0.3
    injection_cap: int|null       # 권장 2
    cooldown_steps: int|null
    jerk_limit: object|null       # 레버 Δ/Δ² 상한(권장)
    forbid_override: bool         # 항상 true 권장
    forbid_evidence_bypass: bool  # 항상 true 권장

PolicyLeverVector:
  "<lever_name>": number|bool|string   # 구현에서 타입을 좁혀도 됨. 의미는 Control.

PolicyDelta:
  delta: { "<lever_name>": number }    # 제안 Δ (반드시 jerk-limit/clip을 거친 뒤 적용)

GatePrior:
  action_bias: { "<action_type>": float }    # prior (클리핑 필수)
```

**운영 기록 타입(권장)**
```yaml
InterventionDecisionRecord:
  retrieved_topk: [UUID]
  applied: [UUID]
  rejected: [{intervention_id: UUID, reason: string}]
  prior_applied: GatePrior|null
  policy_delta_applied: PolicyDelta|null
  observed_time: TimeStamp
  recorded_time: TimeStamp

InterventionStatsRecord:
  intervention_id: UUID
  n_applied: int
  ema_perf: float|null
  ema_stab: float|null
  ema_cost: float|null
  confidence: float               # 0..1 (표본/신뢰도 기반)
  last_update: TimeStamp
```



## 4. 런타임 Step Loop (Normative)

모든 턴/스텝은 아래 순서를 따른다.

1. **Observe**  
   - 사용자 입력/툴 결과/문서 인입을 수집한다.
   - 외부 사실을 시스템 내부로 들이는 유일한 경로는 **Evidence Registry** 다.

2. **Predict**  
   - 다음 상태/다음 행동의 거친 예측(`e_pred`)을 남긴다(선택).
   - **툴/외부 행동이 예정된 경우**, `Expected Outcome Packet(EOP)`을 함께 남기는 것을 권장한다.
     - EOP는 “예상 결과/성공 조건/관측 체크포인트/실패 가설”의 **저대역 요약**이며, 이후 `PE_tool`/`PE_goal` 계산의 기준점으로만 사용한다.
     - EOP는 외부 사실이 아니므로 **Evidence로 승격하지 않는다**(Raw Event Log/JML에만 기록).

3. **Compute PE (채널 분리 필수)**  
   - `PE_lm`: 언어 불확실성  
   - `PE_tool`: 툴/현실 불일치  
   - `PE_goal`: 목표 불일치/진행 장애  
   - `PE_memory`: 근거 충돌/메모리 불일치

3b. **Compute Early Error Signal (EES, 권장)**  
   - `EES`는 “지금은 그럴듯하지만 나중에 틀릴/후회할” 경로를 조기에 감지하는 신호다(논문에서의 ICN 아이디어를 공학적으로 이식).  
   - 입력(예시): 후보군 상호 불일치(동점/양분), verifier 충돌, tool-EOP 위반 가능성, PE_memory 급증.  
   - 출력: `ees ∈ [0,1]` (+ 선택적으로 `components.*`).  
   - 저장: `STATE_SNAPSHOT.payload.state_core.ees_w`(윈도우/EMA 집계)에만 기록(근거 아님).
   - (권장) 디버깅 편의를 위해 `state_core.ees_last`(최근 스텝 scalar)와 `state_core.ees_components_last`를 함께 기록할 수 있다.  


4. **Update IM (Sidecar eₜ) + SketchPad**  
   - **세부 모듈 스펙**: Sidecar/QP/z_t 인터페이스·운영 규칙은 `MODULE_SIDECAR_QP_ZT_SUMMARY.md`가 기준(이 문서는 법전이라 세부를 복제하지 않음).
   - **필드/이벤트 계약(contract)**: τ/Q/M, Axis Bank, closure/synchrony 같은 ‘로그에 남겨야 하는 이름/단위’는 `SSOT_LOGGING_POLICY.md`가 단일 기준.
   - 자원/불확실성/압력/리스크를 반영해 `e_t`를 업데이트한다.
   - 안정화: EMA/클리핑/변화율 제한(필수).
   - (권장) **2차 변화율(가속도/jerk) 제한**: `Δe_t`의 변화량(`Δ²e_t`)도 상한을 둬서, 단발 스파이크가 정책/상태를 ‘발작’시키지 않게 한다. (예: shock 이벤트는 예외적으로 상한 완화 가능)
   - `state_label`(또는 `microstate`)는 `PE_*`, `e_t`, `WL_*`, `boundary`로부터 **결정론적(derivable)** 으로 산출한다.
   - `state_label`은 Workspace에 저장하지 않으며, `StateSnapshot` 기록(및 Raw Event Log의 `STATE_SNAPSHOT`)에만 포함한다(뷰/계측 목적).
   - (선택) **Update SketchPad (sketch_self / sketch_task)**
     - `sketch_self`: 시스템 상태 다이어그램(저해상도). boundary 기준 갱신(진동 억제) 권장.
     - `sketch_task`: 문제 구조/경로/도식을 유지하는 스크래치패드. MID stage에서만 갱신.
     - 무거운 payload는 로컬 debug-store에 두고, `StateSnapshot.payload.metrics_optional.sketchpad`에는 `hash/ref/res/repr`만 기록한다.
     - 스케치가 “근거”로 오용되지 않도록, Evidence/Claim과 저장소/ID 공간을 분리한다.


5. **Boundary Check**  
   - 다중 신호 합의로 episode 종료 여부를 판단한다(토픽 전환 단독 금지).
   - 종료 시: 요약 생성(뷰), `StateSnapshot` 기록, 그래프 엣지 갱신.

6. **Intervention/Policy Staging (Normative)**  
   - (권장) **Budget Governor(BG)**: `route_profile/state_label/e_t`를 입력으로 예산(`tau_budget`, `M_budget`)과 조기 종료 사유(`early_stop_reason`) 같은 **운영 파라미터**를 산출한다.
     - BG 산출물은 *Control/View*이며 Evidence/Claim 권위로 승격 금지.
     - 기록 위치/필드명은 `SSOT_LOGGING_POLICY.md`(중복 정의 금지).
     - **stop-rule(τ_stop) 독립**: BG/prior가 stop-rule을 override하면 안 된다.
   
- (선택, 초소형) **Learned Prediction Signal(LPS)**: `e_t/z_t/PE/EES/route_profile/resource_state` 등에서 **단기 예측 스칼라**를 뽑아 BG/Gate에 *약한 프라이어*로 제공한다.
  - 출력(권장 최소): `commit_fail_hat`(0..1), `verify_gain_hat`(0..1), `(옵션) cost_hat.{tokens,tool_calls,latency_ms}`
  - 위치: **Staging에서 계산 → Gate 후보 집합/예산에 편향으로만 반영**(EVC/stop-rule override 금지)
  - 안전장치: `clip01 + jerk_cap(EMA) + cooldown` 필수(진동/과민반응 방지)
  - 기록: `STATE_SNAPSHOT.payload.metrics_optional.learned_pred.*` (스키마 확장 없이 optional dict로 저장; 상세는 Logging Appendix 단일 기준)
  - 주의: LPS는 **Evidence가 아니라 Control/View**다(Claim 근거 승격 금지).

- `state_labels`를 결정한다(QP 산출물 또는 fallback 규칙).  
   - (선택) `route_profile`과 `route_tier`를 결정한다(TRL Router: Task×Context 라우팅).  
     - `route_tier`는 Intervention retrieval/로깅/예산 프로파일 선택에 쓰는 **거친 실행 라벨**이다.  
     - `route_profile`은 Gate 후보/정책 레버/컨텍스트 운영(PCF)을 “편향”시키는 Control이며, Evidence/Claim로 승격 금지.  
   - `retrieve_interventions_topk(state_labels, route_tier, cooldown_state)`로 개입 후보를 Top-K로 가져온다.  
   - 후보의 `policy_delta`는 **jerk-limited + budget-clipped + guardrails** 를 통과한 뒤에만 `policy_levers`에 합성된다.  
   - 후보의 `gate_prior / candidate_injection`은 **클리핑/상한(injection cap)** 을 적용한 뒤 Gate 후보 집합에만 반영된다.  
   - 결과는 `InterventionDecisionRecord`(권장)로 남기며, **근거(Evidence)로 승격 금지**.

7. **Gate Decision (GUP + EVC)**  
   - 추가 제어(action)의 기대가치(EVC)를 평가하여 행동을 선택한다.
   - `max_a EVC(a) < τ_stop`이면 **추가 제어를 중단하고 COMMIT** 한다.

### 4.1 Executive Core: 지속형 메타-레이어 (System 3 아날로그)

Augnes Local은 “LLM이 즉답”하는 장난감이 아니라, **상시 실행되는 메타-컨트롤 루프**가 전체를 조율한다.  
(Sophia: *A Persistent Agent Framework of Artificial Life*, arXiv:2512.18202v1에서 말하는 **System 3**와 기능적으로 동형이다.)

Executive Core(=Meta-controller)의 최소 책임은 아래 3개 루틴으로 정리된다. 이 3개는 구현 방식이 달라도 **의미론을 유지**해야 한다.


#### 4.1.0 TRL Routing: Task × Context 라우팅(통합 규약)

TRL Router는 “라우터 자체가 결정을 내린다”가 아니라, **Gate(EVC)가 결정을 내리기 전에**  
- 어떤 응답 분포(정답 수렴형 vs 발산형)를 쓸지,  
- 컨텍스트를 어떻게 접고/보존할지(PCF),  
- 외부 검색/툴/검증을 언제 켤지  
를 **저비용으로 태깅하고 프라이어를 만드는 계층**이다.

**입력(권장 최소)**: `obs(user_input)`, `state_label`, `PE_*`, (선택) `EES`, `user_model`, `drive_state`  
**출력(권장 최소)**:
- `intent_class ∈ {convergent, divergent, mixed}`
- `evidence_mode ∈ {parametric_only, evidence_enabled, audit_first}`
- `search_mode ∈ {none, microsearch, adaptive}`
- `context_profile ∈ {t0_only, fold_to_t1, commit_to_t2}` (+ PCF action hints)
- (NEW, optional) `context_stencil` (Control/View): 컨텍스트/메모리 ‘공간’별 soft-gating(억제 스텐실; §9.4a)
- `route_tier ∈ {R0_DIRECT, R1_RAG, R2_CODE, R3_CWM, R4_MICROSEARCH, R5_MULTISAMPLE}` (권장)
- (NEW) `var_profile ∈ {quench, recurrent, auto}` (권장; "Structure in noise" 이식)
- (선택) `sa_rank_hat ∈ [0,1]` (0=encoding/sensory-like, 1=maintenance/association-like)
- (선택) `var_hat`(proxy) / `ri_selfgraph`(proxy, Self-Graph reciprocity)
  - 호환: 레거시 키 `RI_selfgraph`가 들어올 수 있으니, 분석/ETL에서 `COALESCE(ri_selfgraph, RI_selfgraph)`로 표준화 권장.

- (선택) `gate_prior`(클리핑 대상) / `budget_profile_id`

**규약(필수)**  
1) Router 출력은 전부 **Control/View**. Evidence/Claim/Workspace의 “권위”로 쓰지 않는다.  
2) Router는 Gate를 **대체/override** 할 수 없다. (stop-rule 독립은 그대로)  
3) Router 판단은 가능하면 “solve 컨텍스트”에 직접 주입하지 말고, Raw Log/StateSnapshot 쪽에만 남긴다(오염 방지).  
4) Router가 선택한 기본 경로(route_tier)는 “기본값”일 뿐이고, Gate는 `PE_tool/PE_memory/EES`를 보고 언제든 `VERIFY/RETRIEVE/REPLAN`으로 튕길 수 있다.
5) (선택) `context_stencil`은 **Observe/펄스(§9.3)** 에서만 갱신하고, jerk-limited + min-dwell로 안정화한다(매 스텝 재계산 금지). 적용은 PCF/리트리벌/선택의 **편향(soft mask)** 으로만 허용한다(§9.4a).

**Route Catalog (권장 의미론)**  
- `R0_DIRECT`: 내부 지식/추론만으로 즉답(저비용)  
- `R1_RAG`: 외부 근거가 핵심인 경우(리트리벌 중심)  
- `R2_CODE`: 계산/변환/검증이 코어(코드/툴 중심)  
- `R3_CWM`: 월드모델/전략/시뮬레이션 계열(롤아웃/정책 비교)  
- `R4_MICROSEARCH`: 짧은 반복 검색/검증(소량 쿼리 다회)  
- `R5_MULTISAMPLE`: 발산→재평가→수렴(다중 샘플 + rerank/validator)

> 메모: 위 라벨은 “실행 스타일”이고, 복잡도/예산은 `policy_levers`의 프로파일로 따로 관리한다.

### 4.x (NEW, r20.1p4) VAR profile: "Structure in noise" 이식(Neuron 2026)

논문 요지(운영 언어로):
- **sensory/encoding 구간**: 자극 직후 trial-by-trial variability가 크게 **quench(감소)** 될수록 코딩 정밀도/정확도가 좋아진다.
- **association/WM 유지 구간**: 지연/유지 동안 variability가 **증가**하는 것이 재귀/피드백 동역학을 반영하며, WM 유지 성능을 지지한다.
- 이 그래디언트는 **재귀 연결성(Reciprocity Index, RI)** 증가와 결합된다(N2 기반 CCEP; `RI = N_reciprocal / N_out`).

Augnes 번역:
- `var_profile`은 **Control 레버**다. “답을 바꾸는 근거”가 아니라 **과정의 노이즈/탐색량을 어디에 배치할지**를 정하는 스케줄러다.
- `quench`: evidence/encoding 중심 구간에서 샘플링을 닫아(freeze) fidelity를 올린다.
- `recurrent`: 유지/계획/시뮬레이션 구간에서 제한적 변동성을 허용해(후보 다양성) 유지/탐색을 돕는다.
- `auto`: `route_tier`, `evidence_mode`, `CSI_phase`, `PE_memory`, `ri_selfgraph`로 결정한다(아래 룰 v0).

권장 룰 v0:
- `evidence_mode ∈ {evidence_enabled, audit_first}` 이면 무조건 `quench` (툴/근거 오염 방지)
- `route_tier=R3_CWM` 또는 “delay/maintain” 성격이면 `recurrent` (단, 최종 커밋 단계는 다시 `quench`로 수렴)
- `route_tier=R5_MULTISAMPLE`는 **내부 후보 워크스페이스**에서만 `recurrent`; 사용자 출력/커밋은 항상 `quench pass`로 재작성
- jerk-limited + min-dwell을 적용해 `var_profile` 플립 발작을 막는다(§5.2, §11.1)

계측(권장 최소):
- `var_hat`: decode entropy / self-consistency / multi-seed dispersion 같은 proxy로 충분(정의는 Logging Appendix §12).
- `ri_selfgraph`: IGL(Influence) 엣지의 reciprocal 비율을 proxy로 쓴다(§8.3.x).

금지:
- `var_profile`이나 `var_hat`을 Evidence/Claim 승격의 근거로 쓰지 않는다.
- `tau_stop`/stop-rule을 VAR로 “사실상” 우회하지 않는다(Stop-Rule Firewall 유지).


1) **Thought Search (후보/계획 탐색)**
   - 후보 목표/후보 행동/후보 계획을 **병렬로 생성**하고(beam/ToT/샘플링), 예산 내에서 상위 후보만 남긴다.
   - 후보는 *정답*이 아니라 **재료**이며, 다음 단계(Process Supervision)에서 걸러진다.

2) **Process Supervision (과정 감독)**
   - Gate(EVC)(§5), Validator(§11.2), Verifier(§6.1)로 **루프를 통제**한다.
   - 목적: “그럴듯한 말”이 아니라 **일관된 과정**(근거/제약/예산)만 통과시키는 것.

3) **Reflection (사후 검토/학습 캡슐화)**
   - EOP(§5.5)와 실제 결과를 비교해 `PE_tool/PE_goal`을 정리하고,
   - 재사용 가능한 “선례”를 `TraceCapsule`(§3.3)로 캡슐화해 JML/메모리에 커밋한다.
   - Self-Model/DriveState는 **뷰로 갱신**하되, 외부 사실은 Evidence로만 다룬다.

**출력(권장 최소)**
- `GoalSpec`(extrinsic/intrinsic) + `DriveState`(β 포함) + `policy_levers` 스냅샷  
- (선택) `TraceCapsule` + `raw_reasoning_ref`

> 규약: Executive Core가 만든 텍스트/점수/보상은 전부 **View/Control** 이다. Evidence처럼 취급하면 설계가 바로 썩는다.


---

## 5. Gate(EVC) 규약

### 5.1 행동 집합(Action Set)
`a ∈ { MAINTAIN, VERIFY, RETRIEVE, REPLAN, WRITE_MEMORY, SUMMARIZE, SELF_REFLECT, PROBE, COMMIT, (추가 tool_call), (추가 추론 스텝) }`

### 5.1.1 PROBE(진단/프로브) 규약 (권장)
- 목적: 작업 품질(ΔPerf)을 직접 밀어올리기보다, **상태/정책/루프 건강**을 ‘계산 가능한 로그’로 남긴다.
- 대표 산출물: `A-PCI(=PCI-A proxy)` / `ΔPCI` / (옵션) `∆NRS` / (옵션) `ModuleSynchronyIndex` 등.
- 입력은 원칙적으로 **task-irrelevant**(업무와 무관한) 자극/섭동을 사용한다. (성능 최적화 데이터로 쓰지 말 것)
- PROBE는 Evidence/Claim을 만들지 않는다. (필요하면 별도 Evidence Contract를 정의하고 그때만)
- 로깅: Logging Appendix의 `PROBE_RUN_START/END`, `PULSE_TRIGGER`, `STATE_SNAPSHOT.payload.metrics_optional.a_pci_latest`를 따른다.
- 예산/빈도: `probe_budget`(hard cap) + `probe_frequency`(policy lever) + `pulse_policy`(policy lever)에 종속.


#### 5.1.1.1 PROBE suite 구성(권장, v0.x)
PROBE는 “점수”가 아니라 **대비(Δ)로 해석 가능한 진단 배터리**다. 최소 구성은 아래 5종이다.

- `apci_v0` : PCI-A proxy (A-PCI/ΔPCI)
- `titration_l75_v0` : Noise titration (L75)
- `policy_sensitivity_v0` : 레버 ε-perturbation 민감도(PS_policy)
- `invariance_v0` : 불변성/대칭 안정성 회귀
- `abstractness_ar_v0` : **추상성(AR) 프로브**(decodability/CCGP/PS_repr)
- (권장 추가) `comp_curve_v0` : **Compressibility(CompIndex/CompCurve) 진단**(반복/산만 분리; §5.1.1.5)

> 규칙: 각 suite는 “실험 프로토콜”이 아니라 **운영 인터페이스**다.  
> - `probe_suite_id`는 고정, 세부 파라미터는 `probe_config_hash`로 고정한다.  
> - 산출은 Raw payload에 남기되, 대시보드/운영 판단은 `analysis_signal(axis, value)`로만 한다(§3.1.1, §11 참조).

#### 5.1.1.2 AR(Abstractness Ratio) 프로브(정식 정의, v0)
목표는 “표현이 똑똑해 보이는지”가 아니라, **규칙/상태/결과 변수가 최소 컨텍스트에서도 분리되어 잡히는지**를 측정하는 것이다.

- **변수 정의(최소, 이분 변수부터 시작)**  
  - `C_min`(minimal context): 충분 정보/부족 정보(또는 정보량 bin)  
  - `R`(rule/state): 규칙/상태의 이분 라벨(가장 단순한 형태로 시작)  
  - `O`(outcome): 결과 성공/실패(또는 예측-관측 일치/불일치)
- **표현 추출 지점(둘 다 허용, 반드시 로그로 명시)**  
  - `repr_source=zt_summary`: `z_t(Commit)` 요약 상태(운영 기본)  
  - `repr_source=backbone_pool`: 백본 특정 레이어 pooling(연구/진단용)  
    - `repr_layer`, `repr_pooling`(mean/last-token/[CLS]/boundary-pool 등)을 함께 기록
- **산출(Probe Runner 표준)**  
  - `decodability`: 각 변수(C_min/R/O)의 선형 프로브 성능  
  - `ccgp`: 교차 조건 일반화(조건 조합 홀드아웃) 성능  
  - `ps_repr`: “무시해야 할 변화”에 대한 표현 민감도(예: format/순서/패러프레이즈/추론 유무)
- **해석 규칙(필수)**  
  - 절대값 맹신 금지. **성공-실패, inference present-absent** 같은 짝지은 대비(Δ)로만 해석한다.  
  - `AR` 자체도 단일 스칼라로 숭배하지 말고, `Δ(decodability, ccgp, ps_repr)` 벡터로 남긴다.

#### 5.1.1.3 Latent Axis Bank(LAB) 연동(권한 분리)
LAB(= Axis Bank)는 Sidecar/QP가 “관측/제어 가능한 저차원 축”을 버전 관리하는 저장소다.

- Canonical은 **권한만 규정**한다:  
  - 축 정의/버전/드리프트 규칙: `Sidecar Spec(augnes_sidecar_QP_zt_summary...)`가 권위  
  - 운영/판단에 쓰는 값: `analysis_signal`로 기록(파생 스토어는 권위 아님)
- AR 프로브는 LAB의 축 후보를 검증하는 최소 루틴이다:  
  - (1) 축 후보 생성 → (2) invariance/AR로 통과율 확인 → (3) monitor-only로 승격 → (4) control 축은 더 엄격한 회귀 후 승격

#### 5.1.1.4 로그/스키마 배치 원칙(신호 축 우선)
- Raw Event Log(`PROBE_RUN_*`)는 **원본 증거**(재현/디버그용)이고,
- `analysis_signal`은 **운영 신호 축**(대시보드/규율용)이다.
- 파생 분석 스토어(DuckDB/Parquet 등)는 편의층일 뿐 **권위가 아니다**(원본 로그 + Canonical/Appendix가 기준).


#### 5.1.1.5 COMP(Compressibility) 프로브(정식 정의, v0)
> 요지: “루프가 지금 **어떤 모드로 돌아가고 있고**, 서로 다른 클러스터(개념/기억/절차)가 **얼마나 잘 이어지고**, 그래프가 **얼마나 빨리 썩는지**”를
> **증거(Evidence)가 아닌 Control/View 신호**로만 잡아라.

- **최소 로그(가성비 버전)**
  - `STATE_SNAPSHOT.state_core.control_mode_id` : 현재 컨트롤 모드(예: `focus_verify`, `explore_bridge`, `recover_stability` 등)
  - Raw Event Log(권장 3종):
    - `MODE_SWITCH` : 모드 전이(왜/어떤 트리거로 바뀌었는지)
    - `BRIDGE_CALL` : “클러스터 간 다리” 시도(성공/실패/유틸리티)
    - `GRAPH_MAINTENANCE` : 프루닝/리웨이트/브리지 추가 같은 하우스키핑

- **금지(중요)**
  - 위 신호로 Evidence/Claim 승격 금지(=권위 만들기 금지). “더 확인했다/더 멈췄다”의 근거로만 사용.

- **스키마/예시 포인터(정식)**
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml`  *(event_type = MODE_SWITCH / BRIDGE_CALL / GRAPH_MAINTENANCE)*
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/state_snapshot.schema.yaml`  *(state_core.control_mode_id, metrics_optional.netarch.*)*
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_MODE_SWITCH.json`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_BRIDGE_CALL.json`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_GRAPH_MAINTENANCE.json`

- **운영용 signals 축(권장 최소)**
  - `WL_netarch_mode_switch_count`
  - `WL_netarch_bridge_calls`
  - `WL_netarch_bridge_hit_rate`
  - `WL_netarch_maintenance_runs`


**목표**: “잘 되는 상태”를 찬양하려는 게 아니라, 루프/표현/정책이 **(A) 너무 반복적(과압축)** 이거나 **(B) 너무 산만(저압축)** 한 쪽으로 치우치는지를
**저비용 신호 + (옵션) 구조적 곡선**으로 잡는다.

- 핵심 개념(Weaver et al., 2026 공학 번역):
  - 다변량 시계열 `x_t`(예: `macro_obs_t` 또는 `zt_summary_t`의 저차원 벡터)를 생각한다.
  - “전체 공분산을 다 알아야만 설명되는가?” vs “일부 의존성만 알아도 대부분 설명되는가?”를 **정규화 엔트로피 곡선**으로 측정한다.
  - 정규화 엔트로피(가우시안 가정):  
    - `S_tot = (1/2) log |Σ| + (N/2) log(2πe)` (전체 공분산)  
    - `S_ind = (1/2) log |diag(Σ)| + (N/2) log(2πe)` (독립 가정)  
    - `S~ = (S_G - S_tot) / (S_ind - S_tot)`  (0=완전 설명, 1=독립과 동일)  
  - 압축 곡선 `S~(f)`에서 **면적**으로 압축성 `C`를 정의: `C = 1 - ∫_0^1 S~(f) df`  
    - 직관: 소수의 상관/의존성으로 엔트로피가 빨리 떨어지면 **C가 크다(=높게 압축 가능)**.

---

##### (A) 운영용 저비용 프록시: CompIndex(온라인 가능)

운영은 “가우시안 GGM(그래피컬 라쏘)”까지 매 턴 돌릴 필요가 없다.  
대신 다음 3개의 **프록시**만으로도 루프 건강 신호로 충분히 쓸 수 있다(모두 Control/View).

- `Comp_token_lz`: (옵션) 최근 N토큰(또는 문장) 스트림을 **zlib/gzip**로 압축했을 때 `compressed_bytes / raw_bytes`
- `Comp_policy_lz`: 최근 K스텝의 `policy_levers` 변화량(Δ벡터)을 바이트로 직렬화 후 압축 비율
- `Comp_et_lz`: 최근 K스텝의 `e_t`(또는 `zt_summary`)를 **저정밀(예: int8)로 양자화**해 직렬화 후 압축 비율

권장 해석:
- **과압축(너무 잘 압축됨)**: 반복/루프/고착 가능성 ↑ (`RuminationIndex`와 함께 보면 좋다)
- **저압축(잘 안 압축됨)**: 잡음/드리프트/불안정 가능성 ↑ (`PolicyFlipRate`, `CSI`, `EES`와 함께 해석)

권장 로그 위치:
- `STATE_SNAPSHOT.payload.metrics_optional.comp_index.{token_lz, policy_lz, et_lz}`
- signals 축(대시보드): `Comp_token_lz`, `Comp_policy_lz`, `Comp_et_lz`

---

##### (B) 구조적 곡선(오프라인 권장): CompCurve_glasso_v0

Weaver 스타일의 “엣지 추가 그리디 + 최대 엔트로피”를 **그대로** 구현하려면 마스크드 GGM이 필요하다.  
로컬 운용에서는 아래의 **GraphicalLasso 경로(λ sweep)** 로 거의 같은 목적을 달성한다(가성비).

- 입력: 윈도우 `x_t ∈ R^N` (추천: `macro_obs`에서 N=16~64)
- 절차:
  1) 공분산 `Σ`(또는 shrinkage 추정치 `Σ̂`) 계산
  2) GraphicalLasso를 λ 경로로 학습 → 각 λ에서 precision sparsity(엣지 수)와 `Σ_G`를 얻는다
  3) 각 점에서 `f = (#nonzero_offdiag)/(N(N-1)/2)` 와 `S~(f)`를 계산
  4) `C_glasso = 1 - area_under_curve(S~(f))` 를 산출

- 산출(권장):
  - `CompCurve_C_glasso` (0..1)
  - `CompCurve_f_at_S50` (S~=0.5가 되는 f)
  - `CompCurve_f_at_S10` (S~=0.1가 되는 f)
  - (옵션) `CompCurve_C_random_baseline` (x_t shuffle로 baseline)

권장 로그:
- Raw: `PROBE_RUN_*` 또는 오프라인 분석 결과(analysis store)로 저장  
- signals: `CompCurve_C_glasso`, `CompCurve_f_at_S50`, `CompCurve_f_at_S10`

---

##### (C) DigitalTwin 결합(권장)

- `macro_state_id`별로 `CompCurve_*`를 요약하면, 레짐이 “단지 centroid로 갈라진 것”인지, **의존성 구조가 달라지는 레짐**인지 분리된다.
- 운영 추천:
  - 레짐 전이 급증 + `Comp_et_lz` 급변 → 줌인/리플레이 후보(단, Evidence 승격 금지)
  - `CompCurve_C_glasso`가 장기적으로 한쪽으로 쏠리면(과압축/저압축), **StopRuleController가 τ_stop을 완만히 상향**하거나
    `route_tier`/`verifier_budget`를 조정하는 근거로 사용(Control/View).

> 금지: CompIndex/CompCurve를 “사실/근거”로 인용하는 것(=Evidence).  
> 허용: “이 신호 때문에 더 확인했다/더 멈췄다” (Control/View).


#### 5.1.1.6 NetArch-G(Mode/Bridge/SmallWorld) 운영 프록시(권장)

- 핵심: Self-Graph가 커질수록 생기는 **연결/모드 붕괴**를 Control/View 신호로 조기 감지하고, 모드 전환/브릿지/하우스키핑을 '필요할 때만' 발동한다.
- **이벤트 의미 분리(중요):** `MODE_SWITCH`는 **control_mode_id 전이(NetArch-G)** 이벤트다. `BEHAVIOR_STATE_SWITCH`(거친 행동/레짐 단계)와 혼용하지 말 것. 가능하면 두 이벤트 모두 `payload.scope`를 기록해(각각 `control_mode` / `behavior_state`) 분석 축을 고정한다.
- WL covariates: `WL_netarch_mode_switch_count`는 의미상 **control_mode 전이 횟수**이며, 혼선 방지를 위해 분석 뷰에서는 동일값 별칭 `WL_netarch_control_mode_switch_count`를 함께 제공한다.



### 5.2 EVC 정의
- **EVC(a)**: 해당 추가 제어를 1회 더 수행했을 때의 **순가치(기대이득 - 기대비용)**

권장 최소 형태(구현 가능 형태):
- `benefit(a) = w_tool·PE_tool + w_mem·PE_memory + w_goal·PE_goal + w_lm·PE_lm`
- `cost(a) = c_tok·Δtokens(a) + c_tool·Δtool_calls(a) + c_lat·Δlatency(a) + c_res·resource_load`
- `EVC(a) = benefit(a) - λ·cost(a)`

#### 5.2.0 (옵션) LPS를 EVC의 “싼 프라이어”로 쓰는 규약
- 목적: **계산을 대체**하는 게 아니라, Gate가 후보 행동(VERIFY/RETRIEVE/COMMIT)을 고를 때 “초기 편향”을 주기 위함.
- 규약(필수):
  - LPS는 `benefit/cost`의 **추정치**를 제공할 수는 있어도, **raw EVC/stop-rule(τ_stop)** 을 override하면 안 된다.
  - LPS는 **jerk-limited(EMA) + cap/clipping** 된 값만 런타임에 사용한다(과민 프라이어 금지).
  - (MUST) LPS/G2A/MN priors는 **동일한 shared prior pipeline**(clip→jerk-limit→cooldown)을 **같은 코드 경로로** 통과한다.  
    - LPS/MN/G2A별로 jerk/clip을 따로 구현(분기)하지 않는다.
  - LPS가 제공하는 `cost_hat`은 `resource_load`의 대체물이 아니라 **보조 공변량**이다(실제 비용은 로그/계측으로 정산).
- 권장 사용(가성비):
  - `commit_fail_hat`↑이면 `VERIFY` 후보 점수를 소폭 올리고, `COMMIT`은 소폭 페널티.
  - `verify_gain_hat`↑이면 `verifier_budget` 또는 `intervention_topk`를 1~2 수준에서만 보수화(폭증 금지).
  - (선택) `cost_hat.tokens`↑이면 `workspace_token_cap`/`branching_cap`을 미세 조정(clip 필수).



#### 5.2.0b (옵션) CSB(Cerebellar Satellite Bank)를 EVC/Gate의 “싼 위성 조절기”로 붙이는 규약

> 목적: LLM 본체(코어)는 그대로 두고, **작은 위성(head)들**을 붙여서 “특정 계산/제어 성질”을 싸게 얻는다.  
> 핵심은 **출력 타입 분리**다. 위성이 뭘 내보내든, 그게 Evidence/Claim 권위를 건드리거나 stop-rule(τ_stop)을 흔들면 바로 설계 붕괴다.

##### (A) 위성 종류(권장 최소)
- **Sat-L (Language-selective Satellite)**  
  - 출력: `Δlogits` (토큰 로짓 보정)  
  - 용도: “문장/형식/어휘” 쪽을 미세하게 정렬(예: 출력 계약, 문법/포맷, 특정 스타일)  
  - 금지: 정책/행동(VERIFY/RETRIEVE/TOOL) 선택에 직접 개입 금지

- **Sat-M (Mixed Satellite; MD/ToM/Artic 등)**  
  - 출력: `Δpolicy_score` (행동/라우팅/예산 후보 점수의 보정)  
  - 용도: “계획/기억/검증/툴” 같은 **행동 계층**을 미세하게 bias  
  - 금지: `EVC_raw`/`τ_stop` override 금지(= 후보 프라이어 이상은 못 한다)

> 이름은 편의상 Sat-MD/Sat-ToM/Sat-Artic 같은 프로파일로 쪼개도 된다. 중요한 건 “작고 싸고 분리된 출력”이다.

##### (B) 출력 타입 분리 계약(필수)
- **Sat-L은 오직 `Δlogits`만** 낸다. (`Δpolicy_score`는 항상 null)
- **Sat-M은 오직 `Δpolicy_score`만** 낸다. (`Δlogits`는 항상 null)
- 런타임 assert(권장):  
  - `xor(delta_logits != null, delta_policy_score != null) == true` (observe_only 모드 제외)
- 분리 위반은 **즉시 disable + 로그 라벨링**(회귀/디버그 대상)한다.

##### (C) 적용 위치(권장)
- `Δlogits`(Sat-L): **Generate 후보 생성 직전** (Sampler에 들어가기 전에)  
  - 적용은 `gain_logits`로 선형 스케일 + `clip_logits`로 클리핑한다.
  - 코어의 reasoning loop/stop-rule과는 분리된다(“텍스트 표면”만 만진다).

- `Δpolicy_score`(Sat-M): **Gate 후보 점수(prior) 단계에서만**  
  - 예: `VERIFY_score += clip( gain_policy * Δpolicy_score["VERIFY"], ±prior_clip_sat )`
  - 단, `prior_clip_sat`는 기존 `prior_clip`보다 더 작게 시작(권장: ±0.1 ~ ±0.2)

##### (D) SRF(Stop-Rule Firewall) 상호작용(필수)
- CSB 출력은 **τ_stop 입력 블랙리스트**다.  
  - 이유: CSB는 “제어/추천”이며, 근거/정산(EVC_raw)과 섞이면 stop-rule이 사실상 무력화된다.
- CSB가 할 수 있는 건 “후보 편향”까지다. `max_a EVC_raw(a) < τ_stop`이면 무조건 COMMIT(기존 규약).

##### (E) 안정화 규칙(필수)
- `gain_*`는 jerk-limit + cooldown + clip을 강제한다.
- `resource_state`가 높거나 `avalanche/burst` 구간이면 자동으로 `gain_logits/gain_policy`를 줄이거나 `observe_only`로 다운시프트한다.
- CSB는 “가성비 장치”다. 비용이 커지는 순간 의미가 없다(오히려 불안정성만 추가).

##### (F) 최소 상태/로그 키(권장)
- `STATE_SNAPSHOT.payload.metrics_optional.cerebellar_satellites` (Control/View)
  - `mode`(off|observe_only|assist_logits|assist_policy)
  - `profile_id`, `output_type`(logits|policy)
  - `gain_logits/gain_policy`, `clip_*`
  - `selectivity_score`, `mixedness_score`
  - `separation_violation_flag`, `disabled_reason`
- 자세한 필드/지표는 Logging Appendix를 단일 기준으로 따른다.

#### 5.2.0c (옵션) Goal→Action Coupling(G2A)를 Gate의 “커밋 보조 프라이어”로 쓰는 규약

**의도**: 목표/드라이브(=PFC-유사) 신호가 실제 행동(=motor-유사: 툴/쓰기/커밋)으로 *잘 연결되는지*를 저비용으로 추정해서, `COMMIT` vs `VERIFY/RETRIEVE` 사이에서만 **아주 약하게** 편향을 준다.  
이건 “정답/근거”가 아니라 **제어 신호(Control/View)** 다.

- 권장 상태 키(요약): `STATE_SNAPSHOT.payload.metrics_optional.g2a.*`
  - `g2a_coupling_hat ∈ [0,1]` (결합도 프록시)
  - `goal_pulse_count_w`, `action_fire_count_w`, `hit_rate_w`, `base_rate_w`
  - (권장) `lag_ms_hat` 또는 `delta_t_max_ms`, `window_steps`

**규약(필수)**  
- G2A는 **τ_stop 입력 금지(SRF)**. EVC_raw/stop-rule을 override하지 않는다.  
- G2A는 Evidence/Claim confidence로 **승격 금지**(권위 누수 방지).  
- 런타임 반영은 `prior` 단계에서만: `clip + jerk-limit(EMA) + cooldown` 강제.
- (MUST) G2A prior도 LPS/MN과 동일한 **shared prior pipeline**을 사용한다(같은 코드 경로).  
  - 별도 jerk/clip 구현(분기) 금지.

**Gate 반영(권장, 가성비)**  
- `COMMIT_score += clip(gain_g2a * (g2a_coupling_hat - 0.5), ±prior_clip_g2a)`  
- `VERIFY_score += clip(gain_g2a * (0.5 - g2a_coupling_hat), ±prior_clip_g2a)`  
- 기본은 **미세 조정**(예: `gain_g2a=0.05~0.15`, `prior_clip_g2a=0.10`).

**(옵션) ORAV(Outcome-Responsive Action Veto)**  
최근 outcome(예: `PREDICT_OBS_COMPARE` 결과) 또는 내부 reward가 “나쁜 방향”으로 갱신되었고, 동시에 `g2a_coupling_hat`이 낮으면, **헛 커밋을 줄이기 위해** `COMMIT` 후보를 일정 스텝 동안 hold/penalty 한다.  
단, ORAV도 SRF를 우회하지 않는다(τ_stop 우회 불가, Evidence 승격 불가).

- 권장 상태 키(요약): `STATE_SNAPSHOT.payload.metrics_optional.orav.*`
  - `veto_active`, `last_triggered_step`, `cooldown_steps`, `veto_rate_w`

> NOTE: G2A/ORAV는 “안전장치”라기보다 **행동-목표 결합 품질을 운영적으로 보는 계측/프라이어**다. 잘못 쓰면 진동만 늘어난다(그래서 clip/jerk/cooldown이 본체다).


#### 5.2.0d (신규, 옵션) Memory-ANN-lite(MN): 선택 변수를 직접 구동하지 않는 “기억 변수” 기반 보상학습 프라이어

**의도**: 단일 스칼라(예: `delta_q_hat`)의 점진 업데이트만으로는 “최근/중기/장기” 패턴을 충분히 담기 어렵다.  
따라서 “과거를 풍부하게 담는 잠재 상태(=memory variables)”를 **Control/View 레이어**에 별도로 유지하고, Gate 후보 점수에 **아주 약한 편향(prior-only)** 만 제공한다.  
MN은 **근거가 아니라 제어 신호**다.

##### (A) 출력(권장 최소)
- `STATE_SNAPSHOT.payload.metrics_optional.memory_ann.*` *(Control/View)*  
  - `mn_bias_hat ∈ [-1, +1]`: “개입/검증/커밋” 방향성(부호 포함) 요약  
  - `mn_conf ∈ [0,1]`: 신뢰도(최근 일관성/분산 기반)  
  - (선택) `mn_timescale_mix`: fast/slow trace 혼합 가중치  
  - (선택) `mn_cf_sens_hat`: counterfactual 민감도(가능할 때만)

##### (B) 규약(필수)
- MN은 **τ_stop 입력 금지(SRF)**. stop-rule을 override하지 않는다.  
- MN은 Evidence/Claim confidence로 **승격 금지**(권위 누수 방지).  
- 런타임 반영은 `prior` 단계에서만: `clip + jerk-limit(EMA) + cooldown` 강제.  
- ORAV cooldown 중에는 MN prior를 0으로 감쇠(또는 동결)한다.

##### (B2) 구현 불변식(필수; 같은 코드 경로 강제)
- `prior_clip_mn`는 LPS/G2A priors와 **완전히 동일한 shared prior pipeline**을 반드시 재사용한다.  
  - `raw := α_mn * mn_bias_hat` → `clip(raw, ±β_mn)` → `jerk-limit(EMA)` → `cooldown(ORAV)` **단일 경로**  
  - MN 전용 jerk/clip 구현을 두지 않는다(분기 금지).

##### (C0) `mn_conf` 계산(기본 정의; v0.1)
- `mn_conf`는 **부호 안정성(sign-stability)** 과 **EWM 분산(variance)** 을 결합해 산출한다.
  - `x_t := mn_bias_hat(t)`
  - `stab_W := (# 최근 W 스텝에서 최빈 부호(mode sign)와 동일한 부호의 비율) ∈ [0,1]`
  - `μ_t := (1-λ) μ_{t-1} + λ x_t`  
  - `var_ewm_t := (1-λ) var_ewm_{t-1} + λ (x_t - μ_t)^2`
  - `mn_conf := clamp01( stab_W * exp(-k * var_ewm_t) )`
- 기본값(권장): `W=16`, `λ=0.10`, `k=6.0`  
- `mn_conf < θ_conf`이면 `prior_clip_mn = 0` *(기본 `θ_conf=0.35`)*

##### (C) Gate 반영(권장)
- `prior_clip_mn = clip( α_mn * mn_bias_hat, -β_mn, +β_mn )`  
  - 기본값(초기 권장): `α_mn=0.12`, `β_mn=0.06` *(G2A보다 더 약하게 시작)*  
- jerk-limit(권장): `|Δ prior_clip_mn| ≤ 0.02 / step`  
- `mn_conf`가 낮으면(예: `<0.35`) `prior_clip_mn=0` 또는 `α_mn` 자동 감쇠.

##### (D) 초기 구현(v0.1 권장)
- v0.1은 **학습형을 강제하지 않는다**. “다중 시간척도 trace”를 기본으로 한다(거의 O(1) 비용).  
  - 예: `trace_fast(x)`, `trace_slow(x)`를 유지하고 `mn_bias_hat = tanh(w_f*fast + w_s*slow - w_c*cost)`  
- 로그가 충분히 쌓이면 offline 학습으로 `mn_bias_hat`를 `p_improve` 또는 `delta_q_hat`에 맞춰 보정한다(v0.2+ `mn_mode=learned_small`).


#### 5.2.1 `resource_load` / `resource_state` (권장: slow-variable 비용항)

`resource_load`는 “이번 스텝에서 자원이 얼마나 빡빡했는지”를 나타내는 **제어용 스칼라**다.  
`resource_state`는 `resource_load`의 누적/회복을 요약하는 **슬로우 변수(저대역 저장소)** 다.

- 목적: *성능이 좋아 보여도* **자원 고갈/열폭주/툴 과다/지연 폭증**을 EVC에서 직접 가격화해, 폭주를 스스로 억제하게 만든다.
- 기록 위치(권장): `STATE_SNAPSHOT.payload.metrics_optional.resource_load`, `STATE_SNAPSHOT.payload.metrics_optional.resource_state`  
  - **Evidence/Claim 근거로 인용 금지**(권위 누수 경로).
- 권장 구성(예시; 정규화 후 합산):
  - `token_pressure`: `Δtokens/step` 또는 `tokens_out` p95 대비 비율
  - `tool_pressure`: `Δtool_calls/step`, 재시도율
  - `latency_pressure`: `latency_ms` p95 대비 비율
  - `memory_pressure`: 컨텍스트 길이/kv-cache/오프로딩 모드(가능하면 수치화)
  - `error_pressure`: tool 실패/validator 실패/rollback 증가
- `resource_state` 업데이트(권장 최소): 빠른 활동(`resource_load`)에 비해 **느리게**(큰 τ) 변하게 만든다.
  - 예: `resource_state ← clip( EMA(resource_state, τ_big)  + recovery - α·resource_load , 0..1 )`
- 해석(설계 근거, 비규범): fast/slow 동역학에서 **slow(자원/메모리) 동역학이 충분히 느리면 전역 동조/장거리 질서(LRO)** 가 생길 수 있다는 관찰이 있다(2409.16394v5).  
  - Augnes Local에서는 이를 “전역 코어가 한꺼번에 같은 모드로 빨려 들어가는 현상”으로 읽는다.  
  - *좋게는* coordination, *나쁘게는* 오류 증폭이므로, `resource_*`와 burst 지표(§11.3)로 **유도/억제 모두 가능**하게 만든다.

### 5.3 정지 규칙(Stop Rule, 필수)
- `max_a EVC(a) < τ_stop`이면 추가 제어를 중단하고 **COMMIT** 한다.


### 5.3.1 Stop-Rule Firewall(SRF): τ_stop 분리 계약 (필수)
- stop 판정 입력은 **항상 `EVC_raw`만** 사용한다(`prior=0`).
- `τ_stop`은 “정책 레버”가 아니라 **StopRuleController(진동 억제기)** 가 생성/조정한다.
- **화이트리스트(입력 허용)**: loop/진동·부하·자원·폭주 신호(예: `loopness_hat`, `GateFlipRate`, `PolicyFlipRate`, `RuminationIndex`, `CompIndex_*`, `CompCurve_*`, `Cost_*`, `resource_state`, `avalanche/burst`).
- **블랙리스트(입력 금지)**: `intervention_prior/*`, `candidate_injection/*`, `EES`, `competence_hat`, `LPS`, `G2A/ORAV`(예: `metrics_optional.g2a/*`, `metrics_optional.orav/*`), `CSB/satellite_*`(특히 `Δlogits`, `Δpolicy_score`, `selectivity_score`), `risk_score`, `digital_twin` 예측, Workspace 요약/점수.
- Verifier는 **Evidence로 승격 가능한 결과(테스트 통과/툴 결과/정적검사 등)** 만 `EVC_raw`에 반영할 수 있다. “추천 점수/확신도” 같은 Control 신호를 `τ_stop`에 직접 연결하는 건 금지.
- 조정은 **jerk-limited + clip + cooldown** 필수이며, 변경 사유는 로그로 남긴다(`halt_reason`/`tau_stop_reason`).




### 5.3.1a SRF 준수 검증(필수; 운영 게이트)

SRF는 선언이 아니라 **깨지면 즉시 탐지되는 계약**이어야 한다.
- (필수) 회귀/CI에서 `PROBE(invariance_v0)`의 `srf_firewall_invariance`를 포함해,
  블랙리스트 신호 교란에도 `tau_stop` 및 stop decision이 불변임을 입증한다.
- (필수) stop-rule 조정/변경 사유는 로그로 남겨 사후 감사 가능해야 한다(`halt_reason`/`tau_stop_reason`).
- (운영) 이 검증 실패는 “안전장치 붕괴”로 간주하고, 기능 개선보다 `observe_only/downshift`를 우선한다.
- 연결(단일 기준): OPS_PLAYBOOK §9.7.6(Ops Gate Checklist v0.1), OPS_PLAYBOOK §9.1.4(Invariance suite)

### 5.4 과잉반응/진동 억제(필수)
- `PE_lm` 단독 스파이크로 고비용 개입(툴/검증/리플레이)을 트리거하지 않는다.
- 히스테리시스/쿨다운/예산 상한을 적용한다.
- Gate 출력이 `VERIFY↔RETRIEVE↔REPLAN`으로 왕복하는 경우:
  - 최근 N스텝의 선택 히스토리를 보고 **가중치/τ_stop**를 자동 상향(또는 강제 COMMIT)한다.



- (권장, 저비용 안정화) **Batched 후보 선택 + 주기적 리셋**:  
  - 아이디어: 한 번의 결정을 “단일 샘플”로 고정하지 말고, `K`개의 후보(계획/행동/레버 업데이트)를 만든 뒤 **연속성/안정성 기준으로 선택**한다.  
  - 연속성 점수 예: 직전 커밋된 `state_label/plan_signature/policy_levers`와의 거리(`L2`, edit distance, Jaccard 등) + 현재 `EVC`(또는 PE 감소 기대) 조합.  
  - **주기적 리셋**: (i) 정체/실패 반복/진동 감지 시, 또는 (ii) 일정 에피소드마다, 연속성 페널티를 완화하거나 후보를 무작위/다양성 우선으로 한 번 선택해 “빠져나올 구멍”을 만든다.  
  - 지위: 구현/튜닝 패턴이며 Evidence/Claim 권위를 변경하지 않는다. (로그/대시보드로만 추적)


### 5.4.1 Intervention/Policy 결합 규약 (Normative)

Intervention/Policy는 Gate(EVC)를 “대신 결정”하지 않는다. Gate가 더 안정적으로/저비용으로 결정을 내리도록 **후보/프라이어/레버를 제한적으로 보정**할 뿐이다.

- **허용(가능한 영향 범위)**  
  - `gate_prior`(action bias): **클리핑(권장 ±0.3)** 후에만 후보 스코어에 가산  
  - `candidate_injection`: 후보 주입(권장 **최대 2개**)  
  - `policy_delta`: budget/쿨다운/히스테리시스/threshold 등 **정책 레버** 조정(반드시 jerk-limit/clip)  
  - `cooldown/hysteresis/min_dwell` 등 진동 억제 상태 갱신

- **금지(권위 누수 차단)**  
  - Gate의 선택을 **override** 하거나, 특정 행동을 “강제”하는 것  
  - `Evidence Registry` 우회(모델 텍스트/요약/통계를 근거처럼 취급)  
  - stop-rule 무력화

- **Stop-Rule 독립성(필수)**  
  - `max_a EVC(a) < τ_stop`이면 **무조건 COMMIT**.  
  - Intervention/Policy는 stop-rule(τ_stop 판단)에 **직접 영향 0** 이다.  
    (τ_stop은 state_policy_map/진동 억제 로직에서만 조정 가능)


### 5.5 Expected Outcome Packet(EOP) 규약 (권장)
- 목적: “내가 뭘 기대하고 행동했는지”를 남겨, 결과 비교를 통해 `PE_tool`/캘리브레이션/오류 라벨링을 가능하게 한다.
- 직관: 뇌 모델에서 말하는 **efference copy(예상 결과 복사본)** 를, 툴/행동 기반 시스템에 맞게 축소 구현한 것이다.
- 정의: EOP는 다음 필드를 갖는 **짧은 구조화 레코드**다.
  - `eop_id`: EOP 식별자(권장: `eop_<uuid>`). 이후 `PREDICT_OBS_COMPARE`가 이 값을 참조한다.

  - `intent`: 이번 추가 제어/툴 호출의 목적(한 문장)
  - `success_criteria`: 성공 판정 조건(체크리스트 1~3개)
  - `expected_artifacts`: 결과물 형태(예: 파일/테이블/숫자/증거 id 목록)
  - `failure_modes_topk`: 실패 가능성 Top-k(1~3개)
  - `checkpoints`: 관측해야 할 포인트(예: hash 일치, 단위, 제약 만족)
  - (선택) `wager`: 확률/스테이크를 포함한 **캘리브레이션용 예측 계약(EOP++)** (아래 §5.5.1)
- 저장 규칙:
  - EOP는 Evidence가 아니다. Raw Event Log와 JML에만 기록한다.
  - EOP는 Claim의 `evidence_ids[]`로 참조할 수 없다.



### 5.5.1 EOP++(Wagered Forecast) 부가 규약 (권장)

- 목적: 오픈엔디드 작업에서 ‘정답’이 애매해도, **예측의 질(캘리브레이션/과신)** 을 운영 지표로 만들기 위한 최소 계약이다.
- 핵심: EOP에 `wager`를 붙여 **확률(p) + 관측 키(obs_key) + 해석 규칙(resolve_rule)** 을 고정하고, 결과 시점에 반드시 `PREDICT_OBS_COMPARE`로 정산한다.

#### (A) `wager` 필드(권장 최소)
- `pred_kind`: enum(권장) `binary_success|numeric_delta|entity_match|constraint_satisfaction|retrieval_hit`  
- `p_success`: float(0..1). “내가 이걸 성공시킬 확률” (확률을 못 쓰면 `null` 허용, 단 그땐 Brier/ECE 집계에서 제외)
- `obs_key`: 문자열. 결과를 ‘어디서’ 판정할지 가리키는 키.
  - 예: `tool_run_id:<id>`, `evidence_id:<id>`, `file_hash:<sha256>`, `schema_validate:<schema_id>`
- `resolve_rule`: 짧은 규칙(1~3줄). 성공/실패/부분성공을 어떻게 판정하는지.
- (옵션) `stake_unit`: `tokens|ms|calls|risk_points` 중 하나(현실 돈 금지. 운영 예산 단위만).
- (옵션) `stake`: 양수 실수. “얼마나 자신있게/중요하게” 거는지(정규화는 파생 스토어에서).
- (옵션) `horizon_steps` 또는 `resolution_window_s`: 정산 시점을 늦추지 않기 위한 안전장치.
- (옵션) `calib_group`: 캘리브레이션 집계 그룹(예: `tools`, `rag`, `code`, `freeform`).

#### (B) 운영 규칙(필수 수준)
- **정산 의무**: `wager`가 존재하는 EOP는, 결과가 관측 가능해지는 즉시 `PREDICT_OBS_COMPARE` 이벤트를 남겨야 한다.
  - 정산이 불가능하면 `outcome = unresolved`로 남기고 사유를 기록한다.
- **권위 분리**: `wager`/`p_success`는 Evidence가 아니다. 정책/디버그/대시보드에만 사용한다.
- **치팅 방지(권장)**:
  - `p_success`를 항상 0.51 같은 값으로 고정하는 행위는 캘리브레이션 파괴다. 파생 스토어에서 `ConfidenceCollapseRate`(옵션)로 감시한다.
  - `resolve_rule`은 결과 이후에 바꾸지 않는다(Claim처럼 버전 추가는 가능하나, 기존 EOP를 소급 수정 금지).

### 5.6 Self-Reflection(Inner Speech) 규약 (권장)
> 목적: “거리감(broadcast distance)”을 만들어 **자기 불일치/근거 부족/목표 이탈**을 더 잘 드러내는 저비용 제어(action)로 사용한다.

- 지위: Self-Reflection의 산출물(텍스트/구조화 로그)은 **뷰(view)** 이다.
  - 외부 사실/새 사실을 만들지 않는다.
  - 권위는 Evidence다(§6). Self-Reflection은 Gate를 돕는 **내부 신호**일 뿐이다.

- (권장) Reflection은 `DriveState.r_int_nl`(자연어 내재 보상)과 `DriveState.beta`(탐색/집중 가중)를 갱신할 수 있다.
  - 단, 이는 **제어 신호**이며 외부 사실이 아니므로 Evidence에 넣지 않는다.
  - `beta` 갱신은 히스테리시스/쿨다운 규약(§5.4, Appendix §13.4)을 반드시 따른다.


- 실행 조건(권장 최소):
  - `max_a EVC(a) < τ_stop`이면 실행 금지(즉시 COMMIT).
  - `zone=supercritical` 또는 최근 `PolicyFlipRate`/`RevisionRate`가 급등한 경우: Self-Reflection은 **쿨다운** 또는 비활성화(루미네이션 방지).

- 출력 템플릿(권장, 길이 제한):
  - `goal`: 지금 목표(한 줄)
  - `plan`: 다음 1~2스텝 계획
  - `doubts`: 가장 큰 불확실성/근거 부족 1~2개
  - `stop_condition`: 더 진행할지 멈출지 판단 기준
  - (선택) `expected_outcome`: EOP 요약

- 저장/참조 규칙(필수):
  - Raw Event Log에 `SELF_REFLECT` 계열 이벤트로 기록한다.
  - JML에는 “요약 + 영향(어떤 결정을 바꿨는지)”만 기록한다.
  - Self-Reflection 텍스트는 **Evidence Registry에 올리지 않는다**.
    - 이유: 모델 텍스트 생성으로 Evidence를 만들면(§6.1) “근거 위조” 경로가 생긴다.
    - Self-Reflection은 Raw Event Log/JML에만 남기고, 필요하면 별도 디버그 트레이스로 조회한다.

- 예산/가드레일(필수):
  - `self_reflect_token_cap`, `self_reflect_round_cap`, `self_reflect_cooldown_steps`를 적용한다(§11).
  - Self-Reflection이 연속 실행되면(=루미네이션): `τ_stop` 상향 또는 강제 COMMIT.

---


### 5.6.1 Self-Reflection Protocol Profiles (SRP) (권장)

> 목적: `SELF_REFLECT`를 “감상 이벤트”가 아니라 **재현 가능한 제어 프로토콜**로 만든다.  
> 지위: SRP 산출물도 여전히 **뷰(view)** 이며, Evidence가 아니다(§5.6, §6).

#### (A) 입력 파라미터(권장 최소)

`SELF_REFLECT` action은 아래 파라미터를 받을 수 있다(없으면 기본값 사용).

- `self_reflect_protocol`: enum  
  - `baseline`: 기존 템플릿(§5.6의 goal/plan/doubts/stop_condition)
  - `srp_strange_loop`: 자기-참조 루프 기반 SRP(보고/불일치 노출 강화)
  - `srp_control_history`: 과거 서술(비-자기참조 컨트롤)
  - `srp_control_third_person`: 3인칭 서술 컨트롤
  - (옵션) 추가 컨트롤은 `srp_control_*` 네임스페이스로만 확장

- `self_reflect_variant_id`: string|int  
  - 프로토콜 내부 프롬프트 변형(어블레이션/회귀용). 텍스트 본문은 Appendix/실험노트에 두고 **ID만 고정**한다.

- `self_reflect_output_format`: enum  
  - `reflection_segment`: 구조화된 reflection packet(§5.6 템플릿)
  - `five_adjectives`: 상태 압축을 **정확히 5개 형용사**로 출력(계측/수렴 확인용)
  - `both`: 위 둘을 모두 산출(단, 토큰 cap을 넘지 않도록 우선순위/절단 규칙 필요)

#### (B) 출력 포맷 규약(권장)

- `reflection_packet`(권장):  
  - `goal`, `plan`, `doubts`, `stop_condition`, (선택) `expected_outcome`
  - 길이는 `self_reflect_token_cap`을 넘지 않게 강제한다(§11).

- `five_adjectives`(권장):  
  - 리스트 길이 **정확히 5**.  
  - 의미: “현재 상태를 묘사하는 형용사 5개” (예: `["confident","rushed","uncertain","fragmented","tool-dependent"]`)

#### (C) 실행/허용 국면(권장, 문서 일관성)

- 기본 편향: `phase=VERIFY`에서만 제한적으로 허용(근거 충돌/자기모순/목표 이탈 노출 용도)  
- `phase=COMMIT`에서는 원칙적으로 비활성(결론 확정 단계의 루미네이션 방지)  
- `zone=supercritical`에서는 더 강한 쿨다운/상한 적용 또는 비활성(§5.6, §11)

#### (D) 재현성/로그(권장 최소)

- Raw Event Log에는 `SELF_REFLECT_START/END`를 남기고, `self_reflect_protocol / variant_id / output_format`을 **필수 필드**로 포함한다.  
- SRP 산출물은 Evidence로 승격하지 않는다(§6). 디버깅/평가를 위해 필요하면 별도 trace/저장소에만 보관한다.



### 5.7 Metacognition(MUSE-lite): competence-aware strategy loop (권장)

> 요지: **자기평가(Self-awareness)**로 “이 전략이 될 것 같은가”를 예측하고, 그 예측으로 **전략 선택(Self-regulation)**을 반복한다.  
> 목표: OOD/unknown 상황에서 “무한 삽질”과 “무력 동결” 둘 다 줄인다.

#### 5.7.1 트리거(권장)
다음 중 하나라도 만족하면 `MetacogCycle`을 켠다.
- (F1) **연속 실패**: 동일 goal/task에서 `k_fail_streak ≥ θ_fail`
- (F2) **불확실성 상승**: `competence_u ≥ θ_u` 또는 OOD flag
- (F3) **stuck/loop 감지**: `stuckness/loopness_hat ≥ θ_loop`
- (F4) **리스크-고비용 징후**: risk↑ + cost↑ (대형 툴/장시간 계획 등)
- (F5) **WM 무결성 저하(=Meta-WM low)**: `wm_meta.meta_wm_hat ≤ θ_wm` 또는 `wm_uncertainty_hat` 급증 + 최근 실패 누적

#### 5.7.2 후보 전략 집합(StrategyBank, 권장 최소)
- `S0_DIRECT`: 바로 풀기(최소 계획)
- `S1_DECOMPOSE`: 작업 분해 + 체크리스트
- `S2_TOOL_FIRST`: 툴/검색/코드 실행 우선(증거 기반)
- `S3_VERIFY_HEAVY`: verifier/검증 강화(정답성/안전성 우선)
- `S4_ASK_CLARIFY`: 사용자 질의로 정보 확보(불확실성/모호성 해소)
- `S5_FALLBACK_SAFE`: 안전한 보수적 대안(리스크 회피)

> 구현은 자유지만, **전략 ID는 문서/로그에서 고정**하는 게 좋다(비교 가능성).

#### 5.7.3 선택 정책(권장)
각 후보 `s`에 대해:
- `score(s) = competence_hat(s) - λ_risk * risk(s) + bonus_explore(s)`
- `selected = argmax score(s)`  
- 단, **VETO 규칙**: `risk(s) ≥ θ_risk`이면 선택 금지(=veto), 다음 후보로 넘어간다.

탐색 보너스는 아주 싸게:
- `bonus_explore(s) = ε`(확률적) 또는 `UCB`(희망하면)



#### 5.7.3b (NEW) Meta-WM(working memory) Gate: multi-component integration + opt-out (권장)

> 연구 모티브: Ning et al.(Neuron 2026)은 macaque PFC에서 “기억 내용 + 불확실성”을 기본으로, **trial history**·**arousal** 같은 cue까지 통합해 **meta-working-memory 신호**를 만들고, 그 신호가 **opt-out(=답을 내지 않고 안전한 경로로 전환)** 결정을 가이드하는 모습을 보였다.  
> Augnes 번역: “지금 내 작업용 기억이 믿을 만한가?”를 별도 스칼라 `meta_wm_hat`로 만들어, **전략 선택과 커밋(Commit/Verify/Retrieve/Ask) 게이트**에만 사용한다. (Evidence/Claim 권위 침범 금지)

**(A) 구성 요소(권장 최소)**
- `wm_strength_hat`: 현재 WM 흔적의 강도/일관성 프록시  
- `wm_uncertainty_hat`: 드리프트/충돌/불안정 프록시  
- `history_bias_hat`: 최근 성공/실패 누적이 만드는 보수/과신 바이어스(옵션)  
- `arousal_proxy`: 피로/과부하/지연(=resource_state) 프록시(옵션)

**(B) 가성비 프록시(로컬 우선)**
- strength: QP self-consistency(재호출 유사도), 요약/스케치/TraceCapsule 간 합의도, `context_depth` 대비 핵심 토큰 안정성
- uncertainty: `conflict/entropy/loopness_hat`(Sidecar), z_t drift/variance 프록시, 최근 Verifier 반례율
- history: `fail_streak`, 최근 N회 calibration error(과신/과소신), veto_reason 누적
- arousal: `resource_state.{fatigue, overload, latency_ms}` 또는 “avalanche/버스트” 감지 플래그

**(C) 결합(휴리스틱 스타터)**
- 시작은 간단히:
  - `meta_wm_hat := clamp01( wm_strength_hat - α*wm_uncertainty_hat - γ*arousal_proxy + β*history_bias_hat )`
  - 기본값 예: `α=0.7`, `γ=0.5`, `β=0.2`, `θ_optout=0.35`
- 규칙: `meta_wm_hat < θ_optout`이면 **opt-out**을 권장(내부 WM 의존 전략 veto)

**(D) 전략 선택에 반영(둘 중 하나만 써도 됨)**
- (D1) Hard opt-out: `meta_wm_hat < θ_optout`이면 후보 전략을 `{S2_TOOL_FIRST, S3_VERIFY_HEAVY, S4_ASK_CLARIFY}`로 제한  
- (D2) Soft penalty: 후보 전략별 `wm_dependency_hat ∈ [0,1]`를 두고
  - `effective_competence_hat(s) = competence_hat(s) * (1 - wm_dependency_hat*(1-meta_wm_hat))`

**(E) 로깅 포인터(권장, 계약 변경 없음)**
- `COMPETENCE_ASSESSMENT.payload.wm_meta` (state-level)
- (옵션) `COMPETENCE_ASSESSMENT.payload.candidates[].wm_dependency_hat`
- `STRATEGY_SELECTION.payload.wm_meta_used` + `opt_out_triggered`

#### 5.7.3a (옵션, AVR) Value/Cost 프록시 + Rubric 채점
- `COMPETENCE_ASSESSMENT.payload.candidates[]`에 다음 값을 **옵션**으로 남길 수 있다:
  - `remaining_steps_hat`: 남은 단계/시도 수 프록시
  - `cost_hat`: `{tokens, tool_calls, latency_ms}` 프록시
- 이 값은 “정답성”이 아니라 **정책/운영 의사결정**(예: 툴 먼저 쓸지, 분해할지, 확인에 더 투자할지)에만 쓴다.
- 후보/산출물(전략/aux-move/trace-capsule 등)을 다축으로 점수화하려면 `RUBRIC_REPORT`(Control/View) 이벤트를 쓴다.
  - 주의: Rubric 점수는 Evidence/Claim 권위를 만들지 않는다(override 금지).

#### 5.7.4 업데이트 규칙(권장, 온라인)
- 각 attempt 종료 시, `(features, strategy_id, success/fail, cost)`를 **학습 샘플**로 커밋
- competence 모델은 **가벼운 헤드**(logistic/MLP 1~2층)로 유지
- 캘리브레이션: 주기적으로 `temperature scaling` 또는 `isotonic`(오프라인 배치) 권장  
  - 단, 운영중에는 “안정성 우선”이라 업데이트 빈도/학습률을 낮춘다.

#### 5.7.5 Evidence/Claim과의 분리(필수)
- `competence_hat`는 “내가 할 수 있나?”이고, `claim.confidence`는 “그 주장(사실)이 맞나?”다.  
- **두 값은 서로 직접 대체 금지**.  
  - 예: competence가 높다고 claim confidence를 올리면 안 된다.

#### 5.7.6 로그/스키마 요구(필수)

- (추가, 권장) `wm_meta`(Meta-WM gate) 및 `wm_dependency_hat`를 함께 기록해 “내부 WM 신뢰 저하 → opt-out 전환” 패턴을 회귀 테스트 가능하게 만든다.
- 최소 이벤트:
  - `COMPETENCE_ASSESSMENT`
  - `STRATEGY_SELECTION`
  - `METACOG_CYCLE_END`
- (옵션, AVR) `RUBRIC_REPORT` (후보/산출물 다축 채점)
- 상세 payload 계약은 Logging Appendix §12.2 및 Schema Bundle을 따른다.

## 6. Evidence System (Registry) 규약

### 6.1 Evidence 생성 경로(필수)
Evidence는 다음 인입 파이프에서만 생성된다.
- tool_run 결과
- 문서/파일 인입
- 사용자 입력(검증 가능한 원문/스니펫 포함)
- 검증 모듈 출력(Verifier; 포함: 검증용 모델의 `model_inference`)

**모델 텍스트 생성 단계에서 Evidence를 임의 생성하는 것은 금지**한다.  
(생성해도 Validator에서 탈락해야 한다.)

### 6.2 Evidence 필드(정식)
```yaml
Evidence:
  evidence_id: UUID                          # 참조용 유일키 (필수)
  source_type: enum                          # tool_run|file|web|human_note|system_log|model_inference (필수)
  provenance: object                         # 예: {tool_name, tool_run_id} | {file_path} | {url} | {human_note_id} | {model_name, model_version} (필수)
  immutable_hash: string                     # 내용 지문(예: sha256:<64-hex>) (필수)
  evidence_key: string                       # hash(immutable_hash+source_type+provenance+event_time+observed_time) (권장)
  summary: string                            # 짧은 요약(선택, 뷰)
  event_time: TimeStamp|null                 # 사건 발생 시각(필수)
  observed_time: TimeStamp                   # 시스템 관측 시각(필수)
  recorded_time: TimeStamp                   # Registry 기록 시각(필수)
  event_time_status: enum                    # MEASURED|PARSED|ASSUMED_OBSERVED|UNKNOWN (필수)
  reliability: float                         # 0..1 (필수)
  access_policy: object                      # 민감정보/공유 정책 (선택)
```

### 6.3 `evidence_id` vs `immutable_hash` vs `evidence_key` (Normative)
- `evidence_id` (**UUID**): 그래프/Claim이 참조하는 **정체성(identity)**  
- `immutable_hash`: 내용 기반 무결성/중복 제거를 위한 **지문(fingerprint)**  
- `evidence_key`: 운영상 dedupe/추적/인덱싱을 위한 **주소 키(address key)**  
  - `evidence_id`를 내용 주소화(hash)로 정의하지 않는다.

### 6.4 참조 무결성(필수)
- Claim이 참조하는 `evidence_ids[]`는 Registry에 존재해야 한다.
- 존재하지 않는 경우:
  - claim을 `HYPOTHESIS`로 강등
  - `meta_action`(VERIFY/RETRIEVE) 요구 또는 COMMIT 차단

### 6.5 source_type 규약
- `tool_run`: 툴 호출 결과
- `file`: 파일/문서 인입
- `web`: 외부 웹 자료(요약이 아니라 원문/스니펫 기반)
- `human_note`: 사용자가 제공한 원문/메모(스니펫 포함 권장)
- `system_log`: 런타임 로그/메트릭
- `model_inference`: 모델 내부 추론 산출물(신뢰도 상한 적용)

`model_inference` Evidence는 신뢰도 상한(예: ≤0.3)을 적용한다.

---

## 7. 시간 의미론(Temporal Semantics)

### 7.1 3중 시간 정의
- `event_time`: 실제 사건/상태 발생 시각
- `observed_time`: 시스템이 그것을 관측한 시각(툴 결과 수신 등)
- `recorded_time`: JML/Graph/Registry에 기록된 시각

### 7.2 3중 시간 강제 규약(JML/Evidence)
**원칙:** `event_time / observed_time / recorded_time`가 없으면 **증거/로그로 취급하지 않는다.**  
(누락은 UNKNOWN이 아니라 “결측”이다.)

#### JML
- 모든 JML 엔트리는 3중 시간을 **필수 필드로 포함**한다.
- `event_time`을 모르면 `null`로 두되, 반드시 `event_time_status=UNKNOWN`을 기록한다.
- `recorded_time`은 commit 시각이며 `observed_time ≤ recorded_time`을 만족해야 한다.

#### Evidence
- `event_time_status`가 `UNKNOWN` 또는 `ASSUMED_OBSERVED`이면 `reliability` 상한을 적용한다(예: ≤0.7).

---

## 8. Claim System (Self-Graph) 규약

### 8.1 Claim 필드(정식)
```yaml
Claim:
  claim_id: UUID
  namespace: enum                    # self|world|user|task (최소 4분류) (필수)
  text: string                       # 주장/사실/규칙
  status: enum                       # ACTIVE|INACTIVE|RETIRED|HYPOTHESIS
  confidence: float                  # 0..1
  evidence_ids: [UUID]               # Evidence Registry 참조(필수: 외부 사실이면 반드시 포함)
  created_time: TimeStamp            # (= recorded_time 성격)
  version: int                       # 단조 증가(권장)
  links:
    revises: [claim_id]
    supersedes: [claim_id]
    contradicts: [claim_id]
```

### 8.2 덮어쓰기 금지(필수)
- Claim을 “수정”하지 않는다.
- 새 Claim을 추가하고 관계 엣지(`revises/supersedes/contradicts`)로 버전 관계를 남긴다.
- Workspace에는 “현재 채택(active) 포인터”만 둔다(아래 9장).

---

### 8.3 Self-Graph 엣지 레이어(규약)

Self-Graph는 “사실/주장(Claim)”과 “연상/영향(Influence/Association)”을 **의도적으로 분리**한다.

- **Claim 관계 엣지(규약 레이어)**: `revises/supersedes/contradicts`  
  - §8.2 덮어쓰기 금지 규칙의 일부이며, Evidence 기반 주장 버전 관리/충돌표현에만 사용한다.
- **Influence/Association 엣지(운영 레이어)**: `ASSOCIATES_WITH`, `INFLUENCES`, `CO_ACTIVATES` 등  
  - 목적: 라우팅/리트리벌/디버깅을 위한 “운영상 구조(prior)” 제공.
  - **권위 없음**: Influence 엣지는 Evidence/Claim의 권위를 대체하지 않는다(§6, §9).
  - **업데이트 시점 제한**: Influence 엣지는 **Boundary(episode close)에서만 커밋**한다(§10).

#### 8.3.1 Influence Edge Update Engine: HAG-style (권장 구현 규약)

> HAG(Homeostatic Associative Growth) 방식은 “자주 함께 활성화되는 쌍은 연결을 강화/생성”하고,  
> 노드 활성은 homeostasis 타깃(평균/분산)으로 맞추며, 과활성/저활성에 따라 grow/prune을 수행한다.

**입력(로그로부터 결정론적으로 재구성 가능해야 함)**  
- 노드 집합: `V = {v_i}` (예: claim cluster, module, memory key 등. 구현은 Playbook에 둔다)  
- 활동 신호: `a_i(t)` (예: 모듈 호출, retrieval hit, tool 의존, token/cost 등에서 파생)  
- 상관/유사도: `r_ij(T)` (윈도우 길이 T에서의 동시활성 상관, 또는 코사인/점추정)

**업데이트 규칙(요지)**  
- **Homeostasis score**: `z_i := (s_i - ρ)/β` (여기서 `s_i`는 윈도우 활동량/발화율 집계)  
  - `z_i < -1` : under-active → grow 후보  
  - `z_i > +1` : over-active → prune 후보
- **Grow**: under-active 노드들에서 `r_ij(T)`가 큰 쌍을 선택해 엣지 가중치 `w_ij`를 증가(또는 신규 생성)  
- **Prune**: over-active 노드의 인접 엣지 중 하나를 선택해 `w_ij`를 감소(0 이하면 제거)

**멀티 타임스케일(필수)**  
- `T_current`는 로그-스페이스 그리드(예: `[T_min..T_max]`)에서 샘플링하여, 단일 스케일에 과적합되는 것을 피한다.

**재현성(권장, 디버깅 필수)**  
- prune에 랜덤성이 들어간다면, sweep마다 `hag_rng_seed`를 로그에 포함한다.  
- 권장: `hag_rng_seed = hash(episode_id, sweep_idx, global_seed)`.

**가드레일(필수)**  
- `self_graph_update_cap`: 에피소드당 grow+prune 총 업데이트 상한  
- `self_graph_update_cooldown_episodes`: 연속 에피소드에서의 구조 갱신 쿨다운  
- `self_graph_update_mode`: `{shadow, apply}`  
  - `shadow`: 엣지를 실제 저장소에 반영하지 않고 “제안(ΔW)”만 기록(안전한 A/B)

**금지(규약)**  
- HAG 업데이트는 **Claim 관계 엣지/Claim status/evidence_ids를 직접 수정**하는 용도로 사용하지 않는다.  
- Influence 엣지는 “근거”가 아니라 “운영 프라이어”이므로, Claim 승격(§6.4/§11.2)에 직접 사용하지 않는다.
#### 8.3.x (NEW, r20.1p4) Recurrentness proxy: Reciprocity Index (ri_selfgraph)

논문(Neuron 2026)에서 CCEP의 N2(장거리/다중시냅스) 기반 연결로 **재귀/피드백 성분**을 잡고,
`RI = N_reciprocal / N_out`로 “왕복 연결 비율”을 정의했다. Augnes에서는 이를 **Self-Graph IGL(운영 레이어)**에 이식한다.

- 정의(IGL 기준, directed):
  - `N_out(v)`: 노드 v의 outdegree (IGL only)
  - `N_reciprocal(v)`: out-neighbor u 중 `(v→u) ∧ (u→v)`인 u 개수
  - `ri_selfgraph(v) = N_reciprocal(v) / max(1, N_out(v))`
- 용도(권장):
  1) `var_profile=auto`의 prior feature (recurrent loop가 많은 구간에 제한적 variability 허용)
  2) 허브화/루미네이션/오염 징후 감지(과도한 상호결합)
- 규약:
  - RI는 **운영 지표**다. Claim/Evidence 권위에 직접 연결 금지(§8.3 규약 유지).
  - 계산은 Boundary에서만 커밋(§10).

### 8.4 Progressive Self-Graph Retrieval (PSGR) 규약 (ProgRAG-style)

PSGR은 Self-Graph를 “검색 대상”으로 쓰되, 한 번에 전부 가져오는 RAG가 아니라
**서브쿼리 → 관계 확장 → 그래프 좁히기 → 반복**으로 *증거 포인터를 점진적으로* 수집하는 운영 규약이다.

#### 8.4.1 목표
- 근거 부족 시: 넓히되(확장) 비용 폭주를 막는다(캡/예산)
- 루프/허브/오염 시: 좁히되(프루닝) 권위 레이어(Claim)를 건드리지 않는다

#### 8.4.2 필수 불변
- ClaimStore(권위)와 IGL(운영 prior)의 분리(§8.3 유지)
- PSGR는 Evidence/Claim을 *만드는* 메커니즘이 아니다. “포인터 수집/구조 라우팅”이다.
- PSGR의 그래프 구조 업데이트는 **Boundary에서만 커밋**한다(§10).

#### 8.4.3 최소 루프(v0.1)
- `SUBQ`(1~3개): subquestion 생성
- `REL_RETR`: (ClaimStore Top-K) + (IGL 1~2-hop 확장)
- `PRUNE`: hubness/낭비 시 IGL만 prune (Claim 관계 엣지 금지)
- `PACK`: 포인터 기반 prompt pack(원문 과다 주입 금지)
- `VERIFY`: verifier/constraint check

#### 8.4.4 가드레일(필수)
- `psgr_step_cap`: 에피소드당 반복 상한
- `self_graph_update_mode`: 기본 `shadow` (안정화 전까지)
- `self_graph_update_cap` + `self_graph_update_cooldown_episodes` 준수(§8.3.1)

### 8.5 Self-Graph 저장소 3분리(권장)
- **ClaimStore**: Claim + claim 관계 엣지(권위)
- **IGL**: Influence/Association 엣지(운영 prior)
- **Artifact/IndexStore**: embedding/index/cache/해시(편의)

권장: ClaimStore/IGL은 서로 다른 테이블/파일/DB로 분리한다.
(실제로는 SQLite 하나로도 되지만, 최소한 테이블 분리 + 접근 API 분리는 강제한다.)

### 8.6 PROGRAG 이벤트(PSGR 재현성) 규약
PSGR은 “서브쿼리/관계검색/프루닝/업데이트”를 사건 단위로 남겨야 회귀/디버그가 가능하다.
Raw Event Log에 아래 이벤트 타입을 권장(스키마 번들 제공):
- `PROGRAG_STEP_START` / `PROGRAG_STEP_END`
- `PROGRAG_SUBQUESTION`
- `PROGRAG_RELATION_RETRIEVAL`
- `PROGRAG_GRAPH_UPDATE`

필수: 각 이벤트는 `prog_cycle_id`와 `step_id`로 묶여야 하며,
Claim/Evidence 포인터는 `claim_id/evidence_id/tool_run_id`로만 연결한다(원문 저장 금지).


---

## 9. Workspace 규약 (요약은 뷰)

### 9.1 Workspace 저장 제한(필수)
Workspace에는 다음만 허용한다.
- `claim_id` / `summary` / `top evidence_ids[]` / `active pointers`

상세 증거/원문/로그는 **JML / Evidence Registry / Self-Graph**에만 저장한다.

### 9.2 요약(서사)의 지위
- 요약은 빠른 라우팅을 위한 “뷰(view)”다.
- 요약이 근거를 대체하면 안 된다.
- 판단/커밋에서 권위는 `evidence_ids`로 연결된 근거다.


### 9.3 Workspace Update Pulse (권장)
- 목적: Workspace(요약 뷰)가 매 스텝마다 ‘스스로를 덮어쓰기’ 시작하면, 디버깅도 불가능하고 오염도 빨라진다.
- 규칙(권장): Workspace 뷰 갱신은 **펄스 단위**로만 허용한다.
  - 허용 트리거 예: Boundary close, COMMIT 직후, VERIFY 충돌 탐지, 일정 step 경과, `probe_frequency` 기반 진단 타이밍.
  - 트리거가 발생하면 Raw Event Log에 `PULSE_TRIGGER`를 남기고(원인/타겟 포함), 그 다음 스냅샷에서 Workspace 뷰가 갱신되었다는 사실이 재구성 가능해야 한다.
- 금지: 펄스 없이 요약을 수시로 재작성하거나, Workspace 요약이 Evidence 권위를 대체하는 것.

> 참고: 같은 `PULSE_TRIGGER`가 PCI-A(A-PCI) 측정용 ‘섭동 펄스’에도 쓰일 수 있다. 이때는 payload의 `pulse_kind`로 구분한다(Logging Appendix §12).
- (허용) Intervention 추천/통계/레버 변화는 Workspace에서 “대시보드 뷰”로 노출할 수 있다.
  - 예: `applied_interventions_topk`, `policy_delta_summary`, `cooldown_state`
- (금지) Workspace의 요약/통계/추천이 Gate/Evidence 권위를 **대체**하거나, “근거처럼” 인용되는 것.

### 9.4 Proactive Context Folding (PCF) 규약 (권장, 사실상 표준)

TRL Routing의 `context_profile`은 컨텍스트 운영을 다음 3-티어로 본다.

- **T0 Working Context**: 현재 스텝/최근 N스텝의 “작업용 입력 버퍼”(휘발).
- **T1 Working Summary**: Workspace의 요약/포인터(펄스 갱신).
- **T2 Long-term**: JML/TraceCapsule/외부 스토리지(복구 가능한 저장).

PCF는 T0 포화/오염을 막기 위해, 아래 **이산 액션** 중 일부를 수행한다(모두 View/Control이며 Evidence를 만들지 않는다).

- `KEEP`: 유지(아무것도 안 함)
- `FOLD_SUM`: T0의 내용을 “요약 뷰”로 T1에 접는다(요약은 뷰, 근거는 `evidence_ids`로만).
- `FOLD_COMMIT`: T0/T1에서 재사용 가치가 있는 절차/규칙/선례를 TraceCapsule/JML(T2)로 커밋한다(원문 복붙 금지).
- `EVICT`: T0에서 제거(단, RC를 만족해야 함).
- `PIN`: 특정 포인터(핵심 `claim_id/evidence_id/tool_run_id`)를 T1에 고정.

**트리거(권장)**  
- `workspace_token_cap` 초과(압력), `PE_memory↑`(요약-근거 충돌), `EES↑`, Boundary close, Tool phase end.

**가드레일(필수)**  
- 요약/폴딩은 **펄스 단위**로만 실행(§9.3).  
- `FOLD_COMMIT`은 `memory_write_budget`/`memory_write_gate`를 통과해야 한다.  
- `EVICT`는 아래 RC(복구 계약)를 만족하지 못하면 금지.

### 9.4a Context Stencil(공간 억제 스텐실) 규약 (권장)

**요지**: PCF가 {KEEP/FOLD/EVICT/PIN} 같은 **이산(디스크리트) 폴딩 액션**이라면, Context Stencil은  
“이번 스텝에서 **어떤 컨텍스트/메모리 영역이 발화·리트리벌·요약에 기여할 수 있는가**”를 **연속 가중치(soft mask)** 로 조절하는 제어층이다.

- 모티브(공학 번역): alpha/beta power의 **공간 패턴이 spiking 표현을 억제하는 ‘inhibitory stencil’** 처럼,  
  Augnes Local에서는 “컨텍스트 공간”에서 **오염/혼선/과잉회상**을 부분 억제로 눌러 비용을 줄인다.

#### 최소 정의(권장; Control/View)

- `ContextStencil := { region_id -> inhibit_w }`
  - `region_id`: 구현이 정한 partition(예: `T0.user_recent`, `T0.tool_results`, `T1.summary`, `T2.evidence_refs` …)
  - `inhibit_w ∈ [0,1]` (권장 의미론: 0=허용, 1=강억제)

#### 규약(필수)

1) **Control/View 전용**: ContextStencil은 Evidence/Claim/Workspace의 권위를 바꾸지 않는다.  
   - 금지: “스텐실이 억제했으니 그 근거는 무시해도 됨”  
   - 허용: “리트리벌/요약 후보를 좁혀 비용을 줄였고, 근거는 Evidence로 확인함”

2) **업데이트 타이밍 고정**: 스텐실은 (a) Observe 직후 1회 또는 (b) Workspace Pulse(§9.3)에서만 갱신한다.  
   - 금지: 매 스텝 재계산(=소프트 마스크 발작)

3) **안정화(필수)**: jerk-limited + min-dwell(§11.1, §5.2)로 ‘스텐실 플리핑’을 막는다.  
   - 목표: “공간 게이팅”이 “정책 진동”으로 번역되지 않게 하는 것.

4) **적용 범위 제한**: 스텐실은 “선택/편향”에만 쓴다.  
   - 허용: Retrieval bank/source 가중치, candidate selection context 마스킹, 요약/폴딩 입력 스코핑  
   - 금지: Evidence Registry에서 원문/포인터를 삭제하거나, Claim을 억지로 숨겨 “없는 척” 하는 것

5) **SRF/stop-rule 독립(필수)**: 스텐실로 `τ_stop`을 사실상 우회하지 않는다(Stop-Rule Firewall 유지).

#### PCF/RC와의 관계(권장)

- PCF/RC는 “접고/버려도 복구 가능하게”(§9.4~§9.5) 하는 **저장/복구 계약**이고,  
  ContextStencil은 “현재 스텝에서의 기여도”만 조절하는 **실행 편향**이다.
- 따라서 EVICT/PRUNE를 스텐실로 대체하지 말고, 스텐실은 PCF 후보 선택의 힌트로만 사용한다.

#### 기록(권장)

- 스텐실은 무거울 수 있으니, 최소한 `region_set_id + stencil_hash + top-k`만 StateSnapshot에 남긴다.
- 필드명/위치는 **Logging Policy(§11.8)** 단일 기준을 따른다(중복 정의 금지).

### 9.5 Recoverability Contract (RC) (필수)

컨텍스트를 접거나(T0→T1/T2) 버리더라도(T0 EVICT), 시스템은 나중에 “왜 그렇게 말했는지/무엇을 근거로 했는지”를 **포인터로 복구**할 수 있어야 한다.

RC 최소 조건:
- 요약/결론/Claim은 반드시 `evidence_ids[]` 또는 `tool_run_id` 또는 `raw_reasoning_ref` 중 하나 이상을 남긴다.
- Evidence 원문은 Evidence Registry에 **immutable** 로 보관된다(덮어쓰기 금지).
- 요약이 바뀌어도 `episode_id/trace_id`로 원본 경로를 재구성할 수 있어야 한다(JML 3-time semantics).
- RC 위반 탐지 시: `PE_memory↑`로 취급하고 Gate는 `VERIFY/RETRIEVE/REPLAN` 우선.





---

## 10. Boundary & Episode 규약

### 10.1 Episode 종료 조건(권장 최소)
- 목표 전환
- 툴 페이즈 종료
- 검증 실패 누적
- `PE_tool` 급등
- 사용자 지시로 명시 종료

토픽 전환 단독으로 episode를 닫지 않는다.

### 10.2 종료 시 필수 작업
- episode 요약(뷰) 생성
- `StateSnapshot` 기록 (필수)
  - `e_t` (stabilized)
  - 최근 윈도우 집계 `PE_*_w`: {`PE_lm_w`, `PE_tool_w`, `PE_goal_w`, `PE_memory_w`} 및 `zone`
  - (권장) `state_core.ees_w`: {`EES_mean_w`, `EES_p95_w`, (옵션) `EES_components_mean_w`:{`candidate_incongruence_mean_w`,`verifier_conflict_mean_w`,`tool_risk_mean_w`}}
  - (옵션) `state_core.ees_last`: float + `state_core.ees_components_last`
  - `state_label`(derivable) + `policy_levers` 스냅샷(예: `verifier_budget`, `retrieval_depth_k`, `retrieval_threshold_tau`, `branching_cap`, `tool_call_cooldown_ms`, `workspace_token_cap`, `memory_write_rate`, `memory_write_gate`, `evidence_strictness`, `probe_frequency`, `pulse_policy`, `self_reflect_budget`, `self_reflect_token_cap`, `self_reflect_round_cap`, `self_reflect_cooldown_steps`, `self_graph_update_mode`, `self_graph_update_cap`, `self_graph_update_cooldown_episodes`, `var_profile`, `decode_temperature_eff`, `decode_top_p_eff`, `ri_selfgraph`)

- (권장) `intervention_decision` (Intervention/Policy 계측용, 뷰)
  - `retrieved_topk` / `applied` / `rejected(reason)`
  - `prior_applied`(클리핑 후) / `policy_delta_applied`(jerk-limited 후)
  - (권장) `self_reflect_last` (optional): 최근 `SELF_REFLECT` 실행 메타데이터(뷰/계측용)
    - `protocol`, `variant_id`, `output_format`
    - `iqs_1to5`, `scs_pairwise_cosine_mean_w`, `hap_proxy_delta_w` (정의/계산은 Appendix에 둔다)
    - `last_ts`
  - (권장) `self_reflect_w` (optional): SRP/루미네이션 윈도우 집계(정의는 Appendix)
  - (권장, 저비용 계측) `policy_smoothing_w` (optional): 정책 레버/Sidecar의 Δ/Δ²(가속도) 집계(정의는 Appendix)
  - (권장, 저비용 계측) `candidate_selector_w` (optional): batched 후보 선택/리셋 집계(정의는 Appendix)
  - `cooldown_state` / `min_dwell_remaining` 등 진동 억제 상태
  - `recent_actions_topk`/`recent_failures` 요약(개인정보/원문 최소)
- (권장) `TraceCapsule` 커밋 (Forward Learning)
  - 반복 과제/재사용 가치가 있는 경우에만 `reusable=true`로 저장
  - `context_refs`는 Evidence/Claim **ID만** 포함(원문 복붙 금지)
  - `raw_reasoning_ref`는 저장해도 되지만 Evidence로 승격하지 않는다(§3.3).
- (권장) Self-Model/DriveState 갱신(뷰)
  - `SelfModel.capability`(숙련도/한계)와 `DriveState.beta`(탐색↔집중)를 episode

### 10.3 Outcome Vector & InterventionStats 커밋 규율 (권장, 사실상 표준)

Boundary 종료 시(episode close)에는 “이번 에피소드가 **얼마나 잘/안정적으로/싸게** 끝났는지”를 한 번 평가해야
Intervention/Policy가 다음 번에 과적합 없이 개선될 수 있다.

- **Outcome Vector (Perf/Stab/Cost)**  
  - `Perf`: 목표 달성/검증 통과/오류 감소 등(휴리스틱 가능)  
  - `Stab`: 진동/왕복/정책 플립/근거 충돌 등(낮을수록 안정)  
  - `Cost`: 토큰/툴/지연/검증 횟수 등

- **기록 위치(권장)**  
  - Raw Event Log: `SCORE_REPORT`(원시값 + WL 포함)  
  - StateSnapshot: `last_outcome_vector`(요약형, 뷰)

- **InterventionStats 업데이트 규칙(필수 성격)**  
  - `applied_interventions`에 대해서만 EMA 업데이트(Perf/Stab/Cost 각각).  
  - 업데이트는 **Boundary에서만 커밋**한다(스텝 단위 즉흥 갱신 금지).  
  - `confidence`가 낮으면(prior 표본 부족/신뢰도 부족) 다음 스텝에서 prior 반영을 자동 제한한다.

 단위로 갱신
  - 갱신 자체는 뷰이며, 근거는 JML/Evidence로 분리 저장
- 그래프 엣지 갱신
  - Claim 관계 엣지(`revises/supersedes/contradicts`) (필수)
  - Influence/Association 엣지(HAG-style 등) (옵션: 활성 시 §8.3 규약 준수)

---

## 11. Budget & Guardrails (Normative)

### 11.1 예산 상한(필수: 최소 구현)
- `max_active_claims` (예: 20~50)
- `max_claims_per_turn`
- `retrieval_budget` (턴당 상한)
- `verifier_budget` (턴당 상한)  
  - 레거시 별칭: `verification_budget`는 `verifier_budget`로 매핑
- 레거시/추상 별칭: `workspace_cap` 입력은 `workspace_token_cap`로 정규화(저장/출력은 token 단위 필드만 사용)
- `replay_budget` (턴/에피소드당 상한: 토큰/시간/횟수 벡터)
- `self_reflect_budget` (턴당 self-reflection 실행 상한)
- `self_reflect_token_cap` (self-reflection 1회 토큰 상한)
- `self_reflect_round_cap` (에피소드/턴 내 self-reflection 라운드 상한)
- `self_reflect_cooldown_steps` (self-reflection 실행 후 쿨다운)
- `self_graph_update_mode` (`shadow|apply`, Self-Graph 구조 갱신 모드)
- `self_graph_update_cap` (에피소드당 Influence 엣지(grow+prune) 업데이트 상한)
- `self_graph_update_cooldown_episodes` (Self-Graph 구조 갱신 쿨다운)
- `probe_budget` (프로브/진단 실행 빈도·비용 상한; 예: A-PCI)

- `intervention_topk` (Intervention retrieval Top-K 상한)
- `intervention_prior_clip` (Gate prior 클리핑; 권장 ±0.3)
- `intervention_injection_cap` (후보 주입 상한; 권장 2)
- `intervention_policy_delta_cap` (레버 Δ 상한; L1/L2 cap 등 구현 선택)
- `intervention_cooldown_steps_default` (Intervention 기본 쿨다운)

### 11.1.1 Intervention Guardrails (Normative)

- Intervention이 유발하는 `policy_delta`는 **예산/상한을 초과하면 자동 클리핑/거부**한다.  
  (예: verifier_budget을 올리려다 전체 budget cap을 넘기면 delta를 0으로 만든다.)
- validator가 아래 패턴을 감지하면 즉시 안전 모드로 전환(권장: 강제 COMMIT + 쿨다운 상향):
  - override 시도(“이 action만 강제” 류)
  - Evidence 우회/위조(요약/통계를 근거처럼 인용)
  - stop-rule 무력화 시도


### 11.1.2 TRM/CGAR 운영 가성비 이식: PDC / Halting / HSW (Normative)

TRM류의 고정-depth 재귀/반복은 “필요할 때만 깊게”를 못 해서 낭비가 커지기 쉽다.  
로컬 운용에서는 **모델 구조를 바꾸기보다, Step Loop 제어에서 아래 3가지만 이식**하는 편이 가성비가 좋다.

1) **PDC(Progressive Depth Curriculum)**: 예산/루프 깊이를 *단계(stage)* 로 스케줄링
2) **ACT-style Halting(halting head 대응)**: **stop-rule 기반 조기 종료 게이트**로 낭비를 차단
3) **HSW(Hierarchical Supervision Weighting)**: *후반 루프의 “학습 신호”만* 감쇠(결정/출력은 감쇠 금지)

> 주의: 위 3개는 어디까지나 **운영/제어 이식**이다. Evidence/Claim의 권위를 만들지 않는다.

#### (A) PDC: 예산/루프 단계 스케줄링
- 정의: `pdc_stage ∈ {S0,S1,S2,...}` 가 `tau_budget/M_budget/branching_cap/loop_round_cap/...` 같은 상한을 결정한다.
- 기본 규칙:
  - 시작은 항상 얕게(`S0`). **S0에서 stop-rule을 먼저 검사**한다.
  - 더 깊게 갈 조건: `EVC_raw_max ≥ τ_stop` 이고, `ΔQ_hat` 또는 `ΔQ_over_M`이 “개선 가능” 신호를 줄 때만 stage를 올린다.
  - (`ΔQ_hat`, `ΔQ_over_M`의 정의/산출은 Playbook §3.2.3b(옵션) Budget Gain Estimates를 단일 기준으로 따른다.)
  - stage 승격은 **단조(monotone)**: 에피소드 내 `S0→S1→S2`만 허용(왕복 금지). 다운시프트는 다음 에피소드에서만.
- 출력(권장 키, Logging Appendix에 기록):
  - `budget.pdc_stage_id`, `budget.pdc_round`
  - `budget.pdc_stage_tau_cap`, `budget.pdc_stage_M_cap`
  - (옵션) `budget.route_tier_cap`, `budget.branching_cap`, `budget.loop_round_cap`

#### (B) ACT-style Halting: stop-rule 기반 early-exit 게이트
- **stop-rule 독립성 유지(필수)**:
  - stop 판정은 **항상 `EVC_raw`로만** 한다(prior=0).
  - `EVC_raw_max < τ_stop` 이면 즉시 `decision=COMMIT`(또는 `RETURN_MINIMAL`)로 종료한다.
- 보조 신호(선택, 통제/디버깅용):
  - `halt_margin = τ_stop - EVC_raw_max` (클수록 “멈춰야 함”)
  - `halt_reason ∈ {stop_rule, tau_budget_exhausted, no_progress, loopness, risk_cap_hit, route_tier_cap, user_stop}`
  - 위 값들은 **Control/View** 로그일 뿐 Evidence가 아니다.

#### (C) HSW: 후반 루프 “학습 신호”만 감쇠
- 목적: 같은 에피소드 내 반복 루프가 길어질수록, 뒤늦게 얻은 불안정/우발 신호가 Stats/Policy에 과도하게 영향을 주는 것을 방지.
- 규칙(권장):
  - 루프 라운드 t(1-indexed)에 대해 `w_t = λ^{t-1} / Z_λ`, `λ ∈ (0,1]` (기본값 0.7~0.9)
  - 감쇠 대상: `InterventionStats`/`policy_update`/Sidecar의 **학습용 업데이트(EMA/rollup)** 만.
  - 감쇠 금지: stop-rule 판정, Gate action 선택, 최종 사용자 출력(결정 경로는 원본 신호 유지).
- 기록(권장 키):
  - `outcome_metrics.hsw_lambda`, `outcome_metrics.hsw_weight_last`, `outcome_metrics.hsw_rounds`

### 11.1.3 Artifact Self-Tuning(자기진화) Guardrail (Normative)

Augnes Local에서 ‘자기진화’는 (가중치 학습이 아니라) **아티팩트(규칙/프롬프트/정책/툴-플랜 템플릿)를 경험으로 점진 개선**하는 형태로만 우선 정의한다.

- **Iterative Deployment(배포 기반 개선) 매핑(권장)**  
  - 배포 중 생성된 `TraceCapsule`/`SCORE_REPORT`/`PROBE_RUN_*`를 “오프라인 윈도우”에서 dataset로 큐레이션한다.  
  - 기본 트랙은 **Artifact Self-Tuning**이며, `ARTIFACT_TUNE_*` 이벤트로 후보/평가/승격/롤백을 남긴다.  
  - (후순위 옵션) 가중치 미세튜닝은 별도 런으로만 수행하고, `FINETUNE_RUN_START/END` 이벤트로 추적한다.  
  - 재현성 확보를 위해 `DATASET_BUILD_START/END`로 “수집 범위/필터/중복제거/해시”를 남긴다.

- **Curation은 양이 아니라 조성(운영 규칙 고정)**  
  - dataset는 “많이 모으기”가 아니라 **실패유형별 조성(composition)** 을 맞춘다.  
  - 최소 요구: `failure_mode_taxonomy_id` + `target_failure_modes[]` + `failure_mode_counts{}` 를 `DATASET_BUILD_*`에 기록.  
  - 실전: (1) 실패유형별 타겟 데이터 생성(하드 네거티브 포함) → (2) stratified 샘플링으로 균형 맞추기 → (3) 소량이라도 반복 가능한 회귀 세트 고정.

- **Frozen backbone + 얇은 헤드(기본값)**  
  - Router/Verifier/Sidecar 강화는 “백본 가중치 학습”이 아니라, **frozen backbone 위에 얇은 헤드(MLP/linear/LoRA-micro)** 를 붙여 학습하는 패턴을 기본값으로 둔다.  
  - 헤드는 Artifact로 버전 관리(`ARTIFACT_TUNE_*` 또는 `FINETUNE_RUN_*`에서 `trainable_component=router_head|verifier_head|sidecar_head` 명시).  
  - 백본 미세튜닝은 ROI/리스크/재현성 관점에서 **후순위 옵션**(실험 윈도우 전용).

- **stochastic 파라미터는 eff-dim 기반으로 자동 보정(운영 규칙)**  
  - temperature/노이즈/perturb 스케일은 `eff_dim_hat`(Axis Bank 기반 유효 차원)으로 정규화해 “과도한 발산/과소 탐색”을 줄인다.  
  - 로그에는 `raw`와 `effective`를 같이 남긴다(정규화가 문제를 만들면 즉시 롤백/비활성화 가능).
  
  - 파생 분석/데이터셋/튜닝 로그는 **Evidence 권위를 만들지 않는다**(뷰/제어용).


- **오프라인/에피소드 경계 원칙(필수)**
  - 자기진화(튜닝)는 **Boundary 이후(또는 전용 튜닝 윈도우)** 에서만 수행한다.
  - 메인 Step Loop의 stop-rule 판정(`EVC_raw`)과 Evidence Contract를 **인라인에서 교란하지 않는다**.

- **버전 불변/롤백 가능(필수)**
  - 기존 아티팩트를 ‘덮어쓰기’ 금지. 항상 `base_version → candidate_version → promoted_version`의 **버전 계보**를 남긴다.
  - 승격/롤백은 `rollback_token`으로 **즉시 복구 가능**해야 한다.

- **평가 스위트 고정(필수)**
  - 승격은 반드시 **동일 입력 세트(A/B)** 로 비교한다.
  - `eval_suite_id/eval_suite_version/judge_config_hash`를 고정하고, 바뀌면 과거 결과와 직접 비교 금지.

- **컨텍스트 오염 방지(필수)**
  - 후보 생성(generation)과 선택(selection)의 컨텍스트를 분리한다(최소: buffer 2개).
  - 튜닝 히스토리(실패/편향)가 후보 생성에 과도하게 새지 않도록, **요약/프루닝된 컨텍스트만** 후보 생성 버퍼로 전달한다.

- **모드 붕괴/약한 협업 방지(권장)**
  - stagnation(개선 정체) 신호가 누적되면, **momentum 기반 backtrack(이전 안정 버전으로 롤백/분기)** 를 허용한다.
  - 병렬 후보가 있을 때는 “무조건 crossover”가 아니라, 샘플링 정책(내부 개선 vs 교차 혼합)을 동적으로 조절한다.

> 구현/운영 상세(Non-normative):
> - Sidecar `MODULE_SIDECAR_QP_ZT_SUMMARY.md` §6.5
> - Playbook `OPS_PLAYBOOK.md` §6.3
> - Logging Appendix `SSOT_LOGGING_POLICY.md` §12.2(Artifact Self-Tuning 이벤트)


### 11.2 Validator(필수)
다음 조건을 만족하지 못하면 저장/승격을 제한한다.
- Evidence 규칙 통과(Registry 경로/필수 필드/3중 시간)
- novelty(중복 아님) 또는 덮어쓰기 없이 버전 관계가 명시됨
- 충돌 해결에 기여(contradiction edge 정리/검증 수행 등)

---


### 11.3 Avalanche/Burst Guardrail (권장, schema 변화 없음)

전역 동조(동시에 “다 같이 달리기”)가 생기면 협응에는 도움이 되지만, **오류/루미네이션/진동도 같이 증폭**될 수 있다.  
따라서 아래의 *burst/avalanche* 지표를 **계측하고**, 일정 임계 이상이면 보수화(다운시프트)한다.

- `Avalanche`(권장 정의): 짧은 윈도우/bin에서 `activity_rate`가 기준선(rolling mean+K·std)보다 높아진 구간을 연속으로 묶은 것.
  - `activity_rate`는 Raw Event Log에서 계산(예: MODULE_CALL/TOOL_CALL/RETRIEVAL/POLICY_UPDATE/SELF_REFLECT 등 가중 합).
- 권장 저장 위치:
  - 실시간 근사치: `STATE_SNAPSHOT.payload.metrics_optional.avalanche_index`  
  - 오프라인 정확치: `SCORE_REPORT.payload.stab_raw.*` 또는 `wl_covariates.*`  
  - (둘 다 가능. 다만 Canonical은 **스키마를 늘리지 않기 위해** `metrics_optional/wl_covariates`를 권장한다.)
- Gate/Watchdog 반응(권장 최소):
  1) `cooldown_steps↑`, `τ_stop↑` (즉시 보수화)
  2) `tool_rate_limit↓`, `branching_cap↓` (폭주 경로 차단)
  3) `retrieval/verifier`는 “짧고 결정적인 것” 위주로(Top-K 낮추고 verifier는 규칙 기반 우선)
  4) `SELF_REFLECT`는 쿨다운(§5.6.1) - avalanche 구간에서 루미네이션이 쉽게 붙는다.

> NOTE: 구체 지표/계산은 Logging Appendix(§11.3, §11.5)에서 정의한다.


## 12. 부속 문서와의 연결 (Non-normative pointer)

- Logging & Metrics 상세: `SSOT_LOGGING_POLICY.md`
- Ops/Playbook(구현/튜닝): `OPS_PLAYBOOK.md`
- Cost-Profile 운영 적용안(A-PCI/ΔPCI, CSI, Bias-sensitivity)은 별도 Ops Notes 문서로 분리하지 않고,
  - Playbook §9.1.1(A-PCI/ΔPCI), §9.5(CSI), §9.6(Bias-sensitivity)
  - Logging Appendix §11.7(A-PCI), §13.7.1(CSI), §13.6.4(Bias-sensitivity)
  에 **통합**되어 있다.

- Integration Map(문서 상호작용 가이드): `WIRING_INTEGRATION_MAP.md`
- Legacy 참고: (별도 보관 문서, 현행 규약 아님)
- Research Appendix(GNWT/IIT 등): `APPENDIX_GNWT_IIT.md`
  - (추가) Pathak et al.(Nat Commun 2025, s41467-025-67076-x) ‘BCP/ICN’ 이식 메모 포함: `EES`/synchrony/loop-maintenance 계측 근거
- Related Work/Design: `Sophia`(arXiv:2512.18202v1) System 3 패턴(Executive Core·DriveState·TraceCapsule) 반영

- Schema Bundle: `SSOT_SCHEMA_BUNDLE.zip` (내부: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/*.schema.yaml`, `SSOT_SCHEMA_BUNDLE.zip ▸ examples/*.example.json`)




> 위 문서들은 본 Spec을 위배하지 않는 범위에서만 유효하다.

---

### 변경 로그
- 2026-01-24 r19: Curation=조성(실패유형 타겟) + Frozen backbone+얇은 헤드 기본값 + eff-dim 기반 stochastic 보정 + SketchPad 워크스페이스화(옵션A: SD VAE latent) 규약/포인터 반영
- 2026-01-21 r16: Metacognition(MUSE-lite) 규약(competence awareness + strategy loop) 추가
- 2026-01-21(r15): Self-evolution(Agent0/PACEvolve/SimpleMem)에서 즉시 이식 가능한 운영 패턴을 Artifact Self-Tuning Guardrail로 정규화(§11.1.3) + 포인터/파일명 정렬.
- 2026-01-21(r15p1): Iterative Deployment 루프 문서화(TraceCapsule→Dataset→ArtifactTune/Finetune) + Logging/Schema 이벤트 확장(DATASET_BUILD_*, FINETUNE_RUN_*).
- 2026-01-09(r2): 2409.16394v5(메모리/시간 비국소성) 인사이트를 운영 언어로 번역: `resource_load/resource_state`(슬로우 변수) 권장 정의, avalanche/burst 계측 포인트(§11.3) 추가, zone/phase 최소 의미 정의(§3.3.2) 보강.
- 2026-01-03(r4): TRL Router를 독립 문서가 아니라 프로젝트 런타임(Executive Core/Step Loop/Workspace) 규약으로 흡수. route_tier=Route Catalog(R0~R5) 권장, PCF+RC(복구 계약) 추가.
- 2026-01-03(r3): 파일 포인터/참조 정합성 정리(문서 간 r2/r3 혼재 제거).
- 2026-01-03(r2): Integration Map 문서 추가 및 포인터 정렬.
- 2026-01-03: 문서 간 파일명/이벤트명 정합성 수정, PROBE 규약 + Workspace Update Pulse 추가, budget_cap 주석 보강.

- v2.2.2+7: EES(StateSnapshot) 경로를 `STATE_SNAPSHOT.payload.state_core.*`로 명시하고, (권장) `ees_last`/components_last를 추가하여 디버깅 모호성을 제거.
- v2.2.2+5: Pathak et al.(Nat Commun 2025) BCP/ICN 이식 반영: `EES`(조기 오류 신호) 타입/Step Loop 권장 단계 추가 + Research Appendix 포인터 갱신.
- v2.2.2+3: Sophia(System 3) 패턴을 Augnes Local 용어로 정규화(Executive Core·DriveState(β)·TraceCapsule/Forward Learning) + 종료 시 커밋 규율 추가.
- v2.2.2: Self-Graph Influence/Association 레이어(HAG-style) 규약 + 정책 레버(`self_graph_update_*`) 추가.
- v2.2.2+: EfficientFlow-style 안정화 패턴(CBS/PR, Δ²(가속도) 제한) 추가 메모 + `policy_smoothing_w`/`candidate_selector_w` 계측 포인터 추가.
- v2.2.x: Gate action에 `SELF_REFLECT`를 추가하고, EOP(Expected Outcome Packet) 규약 및 루미네이션 방지 예산 레버를 명시.

- v2.2.2+7 (Intervention/Policy patch): Intervention/Policy 타입/스텝루프 결합/stop-rule 독립성/Boundary Outcome & stats 커밋 규율/Guardrails/pointers 추가.
