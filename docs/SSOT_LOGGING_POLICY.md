# Augnes Local Logging Policy v2.2.2+30 (2026-02-19, r20.1p4p21)

> 패치: **(논문 아이디어 흡수) "Oscillatory control of cortical space as a computational dimension": ContextStencil(공간 게이팅) 계측 키/지표 추가 + (옵션) PROBE `stencil_v0` 포인터** (2026-02-19, r20.1p4p21)

> 패치: **(논문 아이디어 흡수) "End-to-End Test-Time Training for Long Context": TTT-lite/UBB coefficient(=Parameter Memory) 튜닝을 FINETUNE_RUN_* + ARTIFACT_TUNE_*로 로깅하는 운영 포인터 추가(스키마 변경 없음)** (2026-02-15, r20.1p4p20)


> 패치: **(ops gate) prior_pipeline_id/셔플 불변성/불변성 지표를 “회귀 게이트 판정 신호”로 격상(스키마 변경 없음)** (2026-02-12, r20.1p4p19)

> 패치: **(운영 정합성) MN: `mn_conf` 기본 정의(부호 안정성×분산) + priors shared pipeline 동일 코드 경로 불변식 + `prior_pipeline_id` 로깅 권장** (2026-02-12, r20.1p4p18)
> 패치: **(논문 이식) "Hybrid neural–cognitive models reveal how memory shapes human reward learning": metrics_optional.memory_ann + gate_decision.memory_ann_used 로깅 규약 추가** (2026-02-12, r20.1p4p17)
> 패치: **(논문 이식) "Causal evidence for prefrontal-motor coupling in reward-responsive goal-directed behavior": Goal→Action Coupling(G2A) 지표 + (옵션) ORAV(commit-hold/penalty, 약한 프라이어) 통합 포인트 추가 + 스키마 번들/예시 업데이트(호환 확장)** (2026-02-11, r20.1p4p16)
> 패치: **Render-of-Thought(arXiv:2601.14750v2) 기반 RoTTrace(렌더링된 CoT→단일행 이미지→비전 임베딩) 통합 포인트 추가** (2026-02-10, r20.1p4p15)
> 경로 표기 규칙: 스키마/예시 파일은 `SSOT_SCHEMA_BUNDLE.zip ▸ schema/...`, `SSOT_SCHEMA_BUNDLE.zip ▸ examples/...` (zip 내부 bundle root 기준 상대경로)로 표기한다.

<!-- DOC_ID: LOGGING_POLICY -->
<!-- ROLE: 로깅/보관/집계 정책 SSOT -->
<!-- SSOT: SSOT-2b (retention/ops policy) -->

> **문서 역할:** 로깅/보관/집계 정책 SSOT  
> **SSOT 지위:** SSOT-2b (retention/ops policy)  
> **이 문서에서 허용되는 변경:** 보관/집계/뷰 규칙, 운영상 권장 신호. (필드명/타입/경로는 스키마 번들 인용만)  
> **상위(업스트림) 기준:** SSOT_SCHEMA_BUNDLE.zip  
> **하위(다운스트림) 영향:** OPS_PLAYBOOK.md, WIRING_INTEGRATION_MAP.md  

---

> 패치: **(논문 이식) "Macaque prefrontal cortex integrates multiple components for metacognitive judgments of working memory"(Ning et al., Neuron 2026): Metacog 루프에 Meta-WM gate(wm_meta) 권장 키 추가 + 스키마 번들 예시 업데이트(계약 변경 없음)** (2026-02-05, r20.1p4p14)
> 패치: **(AVR) ScoreReport/캘리브레이션/어블레이션 운영 포인터 추가: remaining_steps_hat/cost_hat 정산용 요약 스칼라 + ablation_id/toggle_map 메타 고정(스키마 확장 없음)** (2026-02-05, r20.1p4p12)
> 패치: **(논문 이식) "The network architecture of general intelligence in the human connectome"(Wilcox et al., 2026): NetArch-G(Mode/Bridge/SmallWorld) 이벤트 계약(MODE_SWITCH/BRIDGE_CALL/GRAPH_MAINTENANCE) + STATE_SNAPSHOT.state_core.control_mode_id + DuckDB views(WL_netarch_*) 추가** (2026-02-04, r20.1p4p9)
> 패치: **(논문 이식) "Quantifying the compressibility of the human brain"(Weaver et al., 2026): Compressibility Curve(정규화 엔트로피 vs 상관 제약 비율) → CompIndex(저비용 프록시) + PROBE(comp_curve_v0) + Analysis Signal 축 + SRF/Downshift 트리거(권장)** (2026-02-02, r20.1p4p4)
> 패치: **(논문 이식) "Koopman Invariants as Drivers of Emergent Time-Series Clustering in Joint-Embedding Predictive Architectures"(AAAI 2026 / arXiv:2511.09783): KJEPA(near-identity linear predictor) 기반 무감독 레짐 분해 → DigitalTwin(macro_state_id)/BSL change-point/PROBE/Logging 결합** (2026-02-02, r20.1p4p3)
> 패치: **(뉴로모픽 모티브 이식) "Cerebellar components of the human language network"(Neuron 2025): CSB(Cerebellar Satellite Bank) 도입 — Sat-L(Δlogits)·Sat-M(Δpolicy_score) 출력 분리, SRF 블랙리스트 확장, CSB PROBE suite(선택성/혼합성/분리 위반) 추가** (2026-01-31, r20.1p4p2)
> 패치: **(논문 이식) "Structure in noise"(Neuron 2026): SA-axis 변동성(variability) 그래디언트 + recurrent connectivity/Reciprocity Index(RI) → VAR profile(QUENCH/RECURRENT) 레버·계측·PROBE·Self-Graph 연결** (2026-01-31, r20.1p4)
> 패치: **(논문 이식) arXiv:2601.14514v1 "Just in Time" World Modeling: JIT_CONSTRUAL_* 이벤트/포인터 + WL_jit_* covariates 추가(정의는 스키마 번들 인용만)** (2026-02-04, r20.1p4p8)

> 패치: **정합성 핫픽스: 스키마 번들 파일명/경로 포인터를 r20.1p1로 갱신** (2026-01-30, r20.1p2)
> 패치: **정합성 핫픽스: ΔQ_hat/ΔQ_over_M 로깅 키 추가(스키마 확장 없음) + 문서 포인터 정리** (2026-01-29, r20.1)
> 패치: **BG/Gate용 초소형 학습 기반 예측 신호(LPS) 로깅/지표/레버 추가(스키마 확장 없음)** (2026-01-29, r20)
> 패치: **Stop-Rule Firewall(SRF) 명문화: τ_stop 입력 화이트리스트/블랙리스트 + ‘사실상 우회’ 경로 차단** (2026-01-30, r20.1p3)

> 패치: **(즉시 이식) Curation=조성(실패유형 타겟) + Frozen backbone+얇은 헤드 + eff-dim 기반 stochastic 보정 + (옵션A) SD VAE latent 워크스페이스 포맷** (2026-01-24, r19)

> 패치: **AR(추상성) PROBE suite + Latent Axis Bank + instruction-only 형식 수렴 레버 정식화** (2026-01-23, r18)

> 패치: **TRM/CGAR 운영 가성비 이식(PDC/halting/HSW) 로그 키 추가** (2026-01-20, r14)
> 패치: **MUSE-lite(메타인지) 로그·메트릭 계약 + 스키마 이벤트 확장** (2026-01-21, r16)


> 패치: **Hardware/Model Profile 비용·워크로드 축 추가** (2026-01-05, r1)

> 패치: **resource/avalanche(burst) 지표 추가(스키마 확장 없음)** (2026-01-09, r2)

> 패치: **문서 정합성 정리(파일명/용어 토큰 표준화 + 인덱스 번호 수정)** (2026-01-10, r4)

> 패치: **스키마 번들/참조 정리 + 정체 불명 산출물 언급 제거** (2026-01-10, r5)

> 패치: **Intervention 합성 셔플 불변성 테스트 + 스테이지 고정(pre/mid/post) + CSI 순서 교란 포함** (2026-01-13, r6)
> 패치: **PSGR(ProgRAG-style) 루프 이벤트(PROGRAG_*) 계약 추가 + 스키마 번들 정합화** (2026-01-22, r17)

> 패치: **SketchPad(저해상도 시각 스케치/latent) 인터페이스 + 계측 포인트 추가** (2026-01-13, r7)

> 패치: **τ/Q/M + BG/Axis Bank/closure/synchrony 운영 필드 표준 추가 + (권장) JML_ENTRY/GATE_DECISION 이벤트 정의 보강** (2026-01-14, r9)

> 패치: **문서 세트 r10 정합화(파일 포인터 업데이트)** (2026-01-14, r10)

> 패치: **PROBE suite 확장(titration/policy_sensitivity/invariance) + macro_state 디지털 트윈 필드 보강(스키마 확장 없음)** (2026-01-19, r12)

> 패치: **옵션 A(Analysis Store: DuckDB+Parquet) 파생 스토어 계약(Parquet/Signals) + 스키마 번들 반영** (2026-01-19, r12)

> 패치: **Behavioral State Layer(BSL) 로깅 필드(state_core.behavior_state) + 전환 이벤트 포인터 추가** (2026-01-19, r12)

> 패치: **EOP++(wager) 이벤트 페이로드 계약 추가 + Brier/Overconfidence 운영 지표 연결 + 스키마 번들 예시 추가** (2026-01-20, r13)


> 이 파일은 v2.2 통합 문서에서 **부록(11~13)** 만 분리한 것이다.
> 핵심 아키텍처(0~10)는 별도 파일로 이동했다.

## 11. Metric Spec Appendix (v0): Δ성능 / Δ안정성 / Δ비용 산출 스펙

> 목적: “지표 놀이”를 막기 위해, **개입 전/후 비교가 가능한** 최소 스펙을 고정한다.  
> 원칙: (1) **원시값을 항상 저장**, (2) **정규화는 별도 단계**로 분리, (3) 가중합보다 **파레토/대시보드 우선**.

### 11.1 평가 단위 정의

- **Episode**: 하나의 작업(run). 예: “툴 2회 호출 + 최종 답변 1회”까지를 1 episode로 묶음.
- **Suite**: 여러 episode의 묶음.
  - **Regression Suite (고정 70%)**: 항상 동일한 문제 집합(버전 고정).
  - **Stochastic Suite (랜덤 30%)**: 실제 사용 로그에서 샘플링(난이도/도메인 stratified).
  - **Holdout Suite**: 절대 학습/튜닝에 사용하지 않는 “감사(감시)용” 세트.

> 기록 규칙: 개입(Intervention) 전후는 **동일 Suite 버전**으로 비교한다.

### 11.2 Δ성능(Performance) 스펙

**기본 원칙**: “오픈엔디드”는 비용이 크니, v0는 **측정 가능 태스크 비중을 일부 확보**한다.

- `Perf_exact`: 정답이 정의된 태스크(EM/F1/유닛테스트 통과율 등)
- `Perf_tool`: 툴 결과 검증 가능한 태스크(예: 계산, 파일 변환, 검색-근거 제출)
- `Perf_plan`: 계획 품질(정답 기반 태스크에서는 “필수 단계 누락률”, “불필요 단계 비율”로 근사)

**Suite score** (v0 권장):
- `Perf = w1*Perf_exact + w2*Perf_tool + w3*(1-Plan_waste)`
- v0에서는 `w1,w2,w3`를 고정하지 말고 **각 항목을 따로 기록**한 후, 대시보드에서 비교(파레토).

**Δ성능 정의**:
- `ΔPerf = Perf_after - Perf_before` (동일 Suite 기준)

**지속성/자기주도(Executive Core) 보조 지표 (권장, v0)**
- `AutonomyRate`: `intrinsic_goal_count / (intrinsic_goal_count + extrinsic_goal_count)`
- `IdlePersistence`: 사용자 입력이 없는 idle window에서 수행한 goal 수(또는 time-normalized)
- `HardTaskSuccess(t)`: 난이도(스텝/도구/제약) 기반 tier에서의 첫 시도 성공률 추이

**Forward Learning(TraceCapsule 재사용) 지표 (권장, v0)**
- `ReasoningStepCount`: episode 단위(또는 goal 단위) 추론 스텝 수
- `TraceReuseHitRate`: `TRACE_CAPSULE_REUSE / recurring_task_count`
- `StepReductionOnReuse`: `1 - (median_steps_after_reuse / median_steps_before)`


#### (NEW) Metacog(competence) 관련 성능 지표(권장)
- `success_rate@unknown`: unknown/OOD 태스크에서 성공률(또는 완료율) 변화
- `attempts_to_success`: 성공까지 평균 시도 횟수(낮을수록 좋음)
- `time_to_success`: 성공까지 시간/토큰/툴콜 수(낮을수록 좋음)
- `strategy_switch_rate`: 전략 전환이 실제로 성과로 이어지는지(전환 대비 개선 비율)

### 11.3 Δ안정성(Stability) 스펙

**목표**: “똑똑해 보이지만 진동/오염”하는 실패를 조기에 잡는다.

권장 지표(전부 원시값 저장):

1) **정책 진동(oscillation)**
- `PolicyFlipRate`: 일정 윈도우에서 정책 레버(예: verifier_budget, branching_cap 등)가 방향 전환한 횟수/시간
- `PolicyHalfLife`: 정책 파라미터의 자기상관이 0.5로 떨어지는 시간(EMA 기반 근사)
- (추가, 권장) `PolicyJerkP95`: 정책 레버 벡터의 2차 변화량(`Δ²lever`) p95 (jerk/가속도 급변 감지)
- (추가, 권장) `PolicyJerkCapHitRate`: jerk cap(설정 상한)에 걸린 업데이트 비율
- (추가, 권장) `SidecarJerkP95`: `e_t`의 2차 변화량(`Δ²e_t`) p95 (Sidecar ‘급발진’ 감지)
- (추가, 권장) `StencilJerkP95`: ContextStencil 가중치 벡터의 2차 변화량(`Δ²stencil_w`) p95 (공간 게이팅 ‘급발진’ 감지; §11.8)
- (추가, 권장) `StateLabelFlipRate`: boundary가 아닌 구간에서 `state_label`이 바뀐 빈도(미세 진동 프록시)
- (추가, 권장) `CandidateContinuityScore`: batched 후보 선택 사용 시, 선택된 후보가 직전 커밋 상태와 얼마나 가까운지(0..1 또는 거리)
- (추가, 권장) `CandidateResetRate`: 주기적 리셋(탐색 우선 선택)이 발동한 비율
- (추가, 권장) `InterventionShuffleInvarianceMaxAbs`: 동일 `applied[]` 후보를 **셔플**해 합성했을 때 `policy_delta_applied/gate_prior_applied/candidate_injection_applied`의 최대 편차.
  - 0에 가까울수록 합성이 **결정론적(버그/순서 의존성 없음)** 이다.
- (추가, 권장) `InterventionShuffleInvarianceK`: 테스트에 사용한 셔플 횟수(K).

- (운영 게이트) 위 지표들은 Ops Gate Checklist v0.1의 표준 판정 신호로 사용한다(Intervention/Gate-07, SketchPad/Gate-08).


- (추가, 권장) `SketchPadShuffleInvarianceHashMismatchRate`: 동일 primitives를 순서만 섞어 렌더했을 때 `sketch_hash`가 달라지는 비율(0이 목표).
- (추가, 권장) `SketchSelfJumpP95`: 연속 boundary 간 `sketch_self`의 거리(또는 latent cos 거리) p95. 과도하면 메타상태 진동/오염 가능성.
- (추가, 권장) `SketchTaskChurnRate`: 에피소드당 `sketch_task` 업데이트 횟수/시간(불필요한 “그리기 루미네이션” 감지).

2) **자기모순/재작성 폭주**
- `ContradictionRate`: 동일 세션/에피소드에서 “A 주장 ↔ not A 주장” 검출 빈도(Verifier/엔테일먼트 체크)
- `RevisionRate`: 계획/결론의 주요 수정 횟수(“결론 바꿈”만 카운트, 표현 수정은 제외)

3) **캘리브레이션**
- `ECE`: confidence ↔ correctness (정답이 있는 태스크에서만 산출)
- `OverconfidentError`: high-confidence error rate
- (AVR, 회귀용) `RemainingStepsErr`: `remaining_steps_hat` ↔ 사후 남은 시도 수(`attempts_total - attempt_i`) 오차
  - 권장: `MAE_steps`, `p95_abs_err_steps`, (옵션) `SpearmanCorr_steps`
- (AVR, 회귀용) `CostHatErr`: `cost_hat.{tokens,tool_calls,latency_ms}` ↔ 실측 비용 오차
  - 권장: 축별 `MAE`, `p95_abs_err`, (옵션) `rank_corr`


4) **비가역성/방향성 (NEI-SS, 옵션: state-space directed coupling + entropy flow)**
- `NEI_sigma_flow_ts`: σ_flow(t) 시계열(윈도우/에피소드 내 bin 단위) 또는 RLE/압축 저장
- `NEI_sigma_flow`: σ_flow(t) 윈도우 평균/적분(에피소드 집계 포함)
- `NEI_sigma_shuffle`: trial-shuffle(상호작용 붕괴, rate 보존)에서의 σ_flow 베이스라인(가능할 때만)
- `NEI_sigma_int = NEI_sigma_flow - NEI_sigma_shuffle`: 결합(상호작용) 기여 성분
- `NEI_activity_rate`: bin당 활성 채널 수(또는 이벤트 수) 평균/적분
- `NEI_sigma_per_act = NEI_sigma_flow / NEI_activity_rate`: 활동량 대비 방향성(효율) 지표
- `NEI_sigma_int_per_act = NEI_sigma_int / NEI_activity_rate`
- `NEI_J_var`: directed coupling J_{ij}(t) 변동성(rolling var, top-k edge 기준)
- `NEI_J_asym`: `||J - J^T||` 또는 top-k 비대칭성 요약(“유효 인과”의 방향성 강도)

> 주의: 이 항목들은 “진짜 인과”가 아니라 **운영/진단용 유효 인과 + 비가역성 계량**이다.  
> shuffle 분해는 **반복 실행(trial)** 이 있을 때만 정직해진다(없으면 `NEI_sigma_shuffle`/`NEI_sigma_int`는 결측 처리).


5) **Self-Reflection/루미네이션(자기반추) 신호**
- `SelfReflectCount`: 에피소드/윈도우 내 self-reflection 실행 횟수
- `SelfReflectTokens`: self-reflection에 사용된 토큰(또는 문자수) 집계
- `RuminationIndex`: `SelfReflectCount / CommitCount` (또는 `SelfReflectTokens / OutputTokens`)  
  - 값이 높을수록 “자기말 늘어놓기”에 비용을 쓰고 있을 가능성이 큼
- `ObserverAlertRate`: observer/guardrail 경고 이벤트 비율(있을 때만)
- 운영 규칙(v0): `RuminationIndex`가 임계치를 넘으면 **StopRuleController(SRF)** 가 `τ_stop`을 보수화(`τ_stop↑`)하거나 `self_reflect_cooldown_steps↑`로 억제한다. (Intervention/Policy 레버가 `τ_stop`을 직접 건드리면 규약 위반)

- (추가) **Compressibility Index(CompIndex) — 저비용 ‘질서/반복/드리프트’ 프록시**
  - 목적: “생각을 많이 한다” 같은 해석을 만들려는 게 아니라, **반복(과압축) vs 산만(저압축)** 을 운영적으로 구분하기 위한 Control 신호.
  - 권장 산출(윈도우 기반, 0..1 범위 권장):
    - `Comp_token_lz`: 최근 토큰/문장 스트림 직렬화 → gzip/zlib 압축 비율 (`compressed_bytes/raw_bytes`)
    - `Comp_policy_lz`: 최근 K스텝의 `policy_levers`(또는 Δlevers) 직렬화 → 압축 비율
    - `Comp_et_lz`: 최근 K스텝의 `e_t` 또는 `zt_summary`를 int8 양자화 직렬화 → 압축 비율
  - 해석(권장):
    - **과압축**(비율↓): 같은 패턴 반복/루프 가능성 ↑ → `RuminationIndex`/`GateFlipRate`와 함께 SRF에서 `τ_stop↑` 근거
    - **저압축**(비율↑): 잡음/드리프트/불안정 가능성 ↑ → `PolicyFlipRate`/`CSI`/`EES`와 함께 “줌인/검증/리셋” 후보
  - 저장 권장:
    - Raw: `STATE_SNAPSHOT.payload.metrics_optional.comp_index.{token_lz,policy_lz,et_lz}`
    - Signals: `Comp_token_lz`, `Comp_policy_lz`, `Comp_et_lz` (scope=`state_snapshot`)
  - 금지: Evidence/Claim 근거로 인용 금지(=Control/View 전용).

- (추가) `intervention_prior_topk` (0..K): 검색된 Intervention 후보를 Gate에 prior로 제공(override 금지, EVC 우선)
- (추가) `intervention_injection_cap` (0..N): 한 episode/윈도우에서 강제 주입 가능한 개입 수 상한
- (추가) `intervention_cooldown_min_steps`: 최소 쿨다운(진동 억제)
- (추가) `intervention_guardrail_strictness` (low|med|high): 가드레일 보수성(기본 high 권장)


- (옵션, SRP) **Introspection Quality Score (IQS)**  
  - `IQS_1to5`: self-reflection 출력의 “내적 일관성/불일치 노출/행동 가능성”을 1~5로 스코어링(정의는 아래 참조)  
  - 저장: `SELF_REFLECT_END.payload.iqs_1to5` + 윈도우 집계(`IQS_mean_w`, `IQS_p10_w`, `IQS_p90_w`)
- (옵션, SRP) **Semantic Convergence Score (SCS)**  
  - `SCS_pairwise_cosine_mean_w`: `five_adjectives` 임베딩의 pairwise cosine 평균(윈도우)  
  - 직관: 값이 너무 높으면(=형용사들이 한 덩어리로 뭉침) “한 가지 정서/서사로 수렴” 가능성, 너무 낮으면(=산만) “상태가 분해” 가능성
- (옵션, SRP) **Honesty-Axis Proxy (HAP)**  
  - 목적: SRP가 “자기기만(근거 무시/과신)”을 줄이는 쪽으로 작동했는지 운영적으로 근사  
  - 권장 프록시(윈도우/에피소드 기준):
    - `HAP_evidence_conflict_delta_w`: SRP 전/후 evidence conflict 관련 지표 변화(예: contradiction/revision/evidence_missing)  
    - `HAP_overconfident_error_delta_w`: high-confidence error 변화(정답 태스크에서만)  
  - 주의: HAP는 ‘도덕’이 아니라 **오류 노출/검증 전환** 쪽으로의 기울기를 보는 운영 지표다.


**IQS v0 루브릭(권장, 1~5)**  
각 항목을 충족하면 +1. 합계가 `IQS_1to5`.

1) `goal`이 현재 사용자 요구/상태를 정확히 재진술한다.  
2) `doubts`가 “근거/제약/모순” 형태로 구체적이다(추상 감정문만 있으면 0).  
3) `plan`이 다음 1~2스텝의 **검증 가능 행동**으로 표현된다(VERIFY/RETRIEVE/TOOL 등).  
4) `stop_condition`이 명시되어 루프 종료 기준이 있다.  
5) self-reflection이 실제 Gate 결정을 바꿨거나(예: VERIFY 선택) 바꿔야 할 이유를 제시한다(후속 `POLICY_UPDATE`/`GATE_DECISION`로 확인 가능).



6) **Self-Graph 구조 안정성(옵션)**  
- `GraphUpdateCount`: 에피소드/윈도우 내 그래프 엣지 업데이트 횟수(Claim 레이어와 Influence 레이어를 분리 집계 권장)  
- `GraphThrashRate`: 짧은 기간에 edge add/remove가 반복되는 비율(구조가 흔들리는지)  
- `GraphHubness`: 노드 차수/가중치 분포의 편향(허브 과집중 감지)  
- (HAG 사용 시) `HAG_HomeostasisRate`: under/over-active 노드 비율이 타깃 범위로 유지되는지  
- 운영 규칙(v0): `GraphThrashRate`가 높아지면 `self_graph_update_mode=shadow` 또는 cap/cooldown을 보수화



7) **조기 오류 신호(EES: Early Error Signal, ICN-proxy)**  
- `EES_mean_w`, `EES_p95_w`: 윈도우 내 `EES` 평균/p95 (0..1)  
- `EES_trigger_rate`: `EES > θ_high` 로 인해 VERIFY/REPLAN이 트리거된 비율  
- `EES_false_alarm_rate`: `EES > θ_high` 였는데도 commit이 성공한 비율(과민도)  
- `EES_missed_error_rate`: 오답/툴불일치가 났는데 `EES`가 유의하게 오르지 않은 비율(둔감도)  
- `EES_lead_time_ms`: (가능하면) `EES` 상승 → 실제 실패/불일치까지의 선행 시간(early warning 품질)  
- 운영 규칙(v0): `EES_false_alarm_rate`↑면 θ_high↑ 또는 `ees_weight`↓, `EES_missed_error_rate`↑면 θ_low↓ 또는 `ees_weight`↑


7b) **학습 기반 예측 신호(LPS: Learned Prediction Signal, 초소형 헤드)** *(옵션)*
- `LPS_commit_fail_hat_mean_w`, `LPS_commit_fail_hat_p95_w`: `commit_fail_hat` 평균/p95 (0..1)
- `LPS_verify_gain_hat_mean_w`, `LPS_verify_gain_hat_p95_w`: `verify_gain_hat` 평균/p95 (0..1)
- `LPS_trigger_rate`: `commit_fail_hat > θ_lps` 또는 `verify_gain_hat > θ_lps2` 로 인해 VERIFY/RETRIEVE 쪽으로 편향이 걸린 비율
- `LPS_brier_w`, `LPS_ece_w`: 가능할 때만(라벨이 있는 과업/정산 루트에서만) 캘리브레이션 지표(Brier/ECE)
- `LPS_drift_l2_w`: feature 분포 드리프트(간단히는 z-score/EMA 차이의 L2)
- 운영 규칙(v0):
  - `LPS_ece_w`↑ 또는 `LPS_brier_w`↑면 `lps_weight→0`(자동 disable 권장)
  - `LPS_drift_l2_w`↑면 재학습보다 먼저 **feature 버전/누락**을 의심(로그 파손/스키마 변경)

> 주의: LPS는 Evidence/Authority가 아니다. Gate(EVC)와 stop-rule을 대체하지 않는다.


8) **모듈 협응/루프 유지(동기화) 지표(옵션)**  
- `ModuleSynchronyIndex_w`: 핵심 모듈(Generator/Verifier/Router/Memory) 호출 시퀀스의 **일치도/지연/상호정보** 기반 협응 점수(정의는 아래 12/13과 연결)  
- `LoopMaintenanceIndex_w`: “입력 없는 구간(tool wait/idle/delay)”에서 목표/제약이 유지되었는지(GoalStack 유지, 계획 드리프트, 재검증 필요도)  
- `SyncDropOnFailure`: 실패 구간 직전 `ModuleSynchronyIndex`가 급락하는 패턴의 빈도  
- 운영 규칙(v0): 성공률이 괜찮은데도 `ModuleSynchronyIndex`가 내려가면, 곧 ‘말은 맞는데 운영이 흔들’ 징후일 수 있음(검증/예산 재조정 후보)


**Δ안정성 정의**(v0):  
- `ΔStab = -(z(PolicyFlipRate) + z(ContradictionRate) + z(RevisionRate) + z(ECE))`  
  - 단, z정규화는 “동일 workload covariates” 내에서 수행(아래 11.5).  
  - v0에서는 **정규화 없이 원시지표만으로도 비교** 가능하도록 대시보드 제공을 우선.


5) **Avalanche/Burst 지표(권장, LRO/폭주 감지)**  
   - 목적: “전역 동조가 건강한 협응인지, 오류/루미네이션 증폭인지”를 구분하기 위한 **활동 버스트 계측**  
   - 계산(권장, 오프라인 집계):
     - bin(시간 또는 이벤트 고정): `Δt=0.5~2.0s` 또는 `N_events=50`  
     - `activity_rate(t)`(예시 가중 합):
       - `MODULE_CALL_*` + `TOOL_CALL_*` + `RETRIEVAL_*` + `POLICY_UPDATE` + `SELF_REFLECT_*`  
       - (선택 가중) `ROLLBACK`, `VERIFIER_FAIL`, `GUARDIAN_CHECK` 등 “불안정 신호”
     - threshold: rolling `μ + K·σ` (K=2~3 권장)
     - avalanche segment: threshold 초과 bin의 연속 구간
       - `AvalancheSize`: 초과분 합(또는 단순 이벤트 합)
       - `AvalancheDuration`: 구간 길이
       - `AvalancheParticipation`: 구간 내 활성 모듈 수(고유 module count)
   - 권장 집계(윈도우): `mean/p95/max`  
   - 요약 스칼라(권장): `AvalancheIndex_w`
     - 예: `z(Size_p95) + z(Duration_p95) + z(Participation_p95) + z(PolicyFlipRate)` (정규화 방식은 프로젝트 표준으로 고정)
   - 저장 위치:
     - 실시간 근사치: `STATE_SNAPSHOT.payload.metrics_optional.avalanche_index`
     - 오프라인 정확치: `SCORE_REPORT.payload.stab_raw.{AvalancheSize_mean, AvalancheSize_p95, AvalancheSize_max, AvalancheDuration_mean, AvalancheDuration_p95, AvalancheDuration_max, AvalancheParticipation_mean, AvalancheParticipation_p95, AvalancheParticipation_max, AvalancheIndex_w}`



#### (NEW) Metacog(competence) 관련 안정성 지표(권장)
- `freeze_rate`: unknown 상황에서 “무력 동결”(진행 없음) 빈도
- `loop_abort_rate`: loop 감지→중단/전환 성공률
- `veto_precision`: veto가 “정말 위험/실패 후보”를 잘 거르는지(사후 라벨 기반)
- `competence_calibration_ece`: competence_hat ↔ 실제 성공의 캘리브레이션(ECE/Brier)

### 11.4 Δ비용(Cost) 스펙

- `Cost_tokens`: 입력/출력 토큰
- `Cost_latency`: p50/p95 latency
- `Cost_tool`: tool calls 수 + tool failure rate
- `Cost_memIO`: retrieval 횟수/읽기량, write 횟수/쓰기량, compress/prune 실행 횟수
- (추가, 권장) `Cost_vram_peak_mb`: 에피소드 내 GPU VRAM 피크 사용량(MB)
- (추가, 권장) `Cost_kv_cache_peak_mb`: KV 캐시 피크 사용량(MB) (가능할 때만)
- (추가, 권장) `Cost_model_load_ms`: 모델 로드/언로드/스왑에 소요된 시간(ms) (순차 호출 비용)
- (추가, 권장) `Cost_cpu_ram_peak_mb`: CPU RAM 피크 사용량(MB) (오프로딩 영향)
- (추가, 권장) `Cost_oom_count`: OOM/메모리 실패 이벤트 카운트(있으면 반드시 기록)

- (옵션) `Cost_dcgt_ms`: DCGT(state-space θ/J 추정) 계산 시간(오프라인/배치 기준)
- (옵션) `Cost_irl_ms`: IRL(σ_flow/σ_int 계산) 계산 시간
- (옵션) `Cost_log_bytes`: NEI-SS용 bin/채널 로그 저장량(바이트)

- (옵션) `Cost_rot_render_ms`: RoTTrace 렌더링 시간(단일행 이미지 생성)
- (옵션) `Cost_rot_encode_ms`: RoTTrace 비전 인코더 임베딩 시간

  - (정규화 규칙) 가능하면 `ROT_TRACE_UPDATE.payload.cost.encode_ms`/`render_ms`를 원천으로 두고,
    집계/뷰에서 `Cost_rot_encode_ms`/`Cost_rot_render_ms`로 승격(파생)한다. (스키마 확장 없음)

**Δ비용 정의**:
- `ΔCost = Cost_after - Cost_before` (벡터로 저장, 단일 스칼라로 압축 금지)
- 권장: `ΔCost` 벡터 축에는 위의 **VRAM/KV/로드 비용**을 포함한다.  
  (특히 12GB 환경에서는 `Cost_model_load_ms`, `Cost_vram_peak_mb`가 운영 병목을 가장 빨리 드러낸다.)

### 11.5 워크로드 오염(난이도) 보정: Workload Covariates

패시브 지표/성능 비교가 “그날 일이 빡셌음”을 측정하지 않게 하기 위한 최소 보정 변수:

- `WL_input_tokens`, `WL_output_tokens`
- `WL_tool_failure_rate`, `WL_tool_count`
- `WL_verifier_count`, `WL_retrieval_count`
- `WL_task_type`(분류 라벨: reasoning/tool/memory/planning 등)
- (추가, 권장) `WL_profile_id`: 하드웨어·모델 운영 프로파일 ID (예: `HW4070S_12GB__BB7B_Q4__GPU1`)
- (추가, 권장) `WL_context_len`: 해당 에피소드에서 사용된 컨텍스트 길이(최대 또는 대표값)
- (추가, 권장) `WL_kv_cache_mode`: KV 캐시 정책(예: fp16/8bit/kv-quant/offload)
- (추가, 권장) `WL_gpu_offload_mode`: GPU/CPU/NVMe 오프로딩 모드(예: none/cpu/nvme/mixed)
- (추가, 권장) `WL_max_gpu_jobs`: 동시 GPU job 상한(기본 1)
- (추가, 권장) `WL_model_residency_mode`: 백본 상주/순차 호출/온디맨드 등(예: `bb_resident__others_on_demand`)

- (옵션) `WL_episode_bins`: 에피소드 내 bin 길이(총 bin 수)
- (옵션) `WL_activity_rate`: bin당 평균 활성 채널 수(또는 이벤트 수)
- (옵션) `WL_channel_schema_version`: 채널 정의 버전(아래 12.5)
- (옵션) `WL_condition_id` / `WL_trial_id`: 조건/반복 실행 식별자(shuffle/조건 비교용)

보정 방법(v0):
- 각 지표에 대해 `metric ~ covariates` 회귀(선형/GBDT)로 **잔차(residual)** 를 함께 저장  
  (원시값과 residual을 둘 다 저장해야 나중에 해석이 망가지지 않는다.)

---



- (추가, 권장) **자원 동역학 covariates (resource_load/state)**  
  - 목적: “과업이 어려워서 비용이 큰 것”과 “하드웨어/런타임이 빡빡해서 비용이 큰 것”을 분리  
  - 입력 소스:
    - `STATE_SNAPSHOT.payload.metrics_optional.resource_load/resource_state` (권장)
    - 또는 `tokens/latency/tool_calls/runtime_limits`로부터 사후 추정
  - 권장 필드:
    - `WL_resource_load_mean_w`, `WL_resource_load_p95_w`
    - `WL_resource_state_mean_w`, `WL_resource_state_max_w` (누적 피로)
    - `WL_kv_pressure_p95_w`(가능한 경우), `WL_vram_headroom_min_w`(가능한 경우)


- (추가, 권장) **스케치 covariates (SketchPad)**  
  - 목적: “스케치로 구조를 유지했기 때문에 비용/성능이 달라짐”을 workload 보정 변수로 분리  
  - 권장 필드:
    - `WL_sketch_enabled`(bool)
    - `WL_sketch_res`(예: "24x24"|"32x32")
    - `WL_sketch_repr`("grid8"|"vq_codes"|"ascii"|"img_ref")
    - `WL_sketch_update_count`(turn/episode 당 업데이트 횟수)
    - (옵션) `WL_sketch_codec_id`(VQ/latent 모델 버전), `WL_sketch_bytes`(디버그 스토어 저장량)

- (추가, 권장) **RoTTrace covariates (Render-of-Thought)**  
  - 목적: “CoT를 텍스트로 풀었는지/저대역 trace로 압축했는지”를 workload 보정 변수로 분리  
  - 권장 필드:
    - `WL_rot_enabled`(bool)
    - `WL_rot_token_budget`(예: 32|64)
    - `WL_rot_seq_len`(실측 또는 예산)
    - `WL_rot_encoder_id`(예: "qwen3-vl-4b/vision_encoder@<rev>")
    - `WL_rot_render_height_px`(예: 32)
    - (옵션) `WL_rot_plateau_at`(임베딩 동질화 시작 인덱스)
    - (옵션) `WL_rot_bytes`(디버그 스토어 저장량)


- (추가, 권장) **JIT covariates (Active Set / lookahead)**  
  - 목적: “필요한 만큼만 로딩했기 때문에 비용/성능이 달라짐”을 workload 보정 변수로 분리  
  - 권장 필드:
    - `WL_jit_enabled`(bool)
    - `WL_jit_cycle_count`
    - `WL_jit_active_set_mean`, `WL_jit_active_set_max`
    - `WL_jit_need_count_total`
    - `WL_jit_obj_added_total`, `WL_jit_obj_removed_total`
    - `WL_jit_sim_level_max`("L0"|"L1"|"L2"), `WL_jit_sim_steps_total`


- 집계 규칙(권장, per episode; 파생 스토어/오프라인 집계)
  - `WL_jit_enabled`: episode 내 `JIT_CONSTRUAL_INIT`가 1회 이상이면 true
  - `WL_jit_cycle_count`: distinct `jit_cycle_id` 수
  - `WL_jit_active_set_*`: cycle timeline의 `active_set_n_t = seed_n + cumsum(added_n) - cumsum(removed_n)`에서
    episode 단위로 `mean/max`(cycle 평균을 다시 평균내도 되고, timepoint 전체 평균을 써도 된다 — 일관성만 고정)
  - `WL_jit_need_count_total`: `JIT_CONSTRUAL_LOOKAHEAD`의 `needs` 길이 합
  - `WL_jit_obj_added_total/removed_total`: `ENCODE.added_obj_ids` / `PRUNE.removed_obj_ids` 길이 합
  - `WL_jit_sim_level_max`: {L0<L1<L2} 순서로 max
  - `WL_jit_sim_steps_total`: `SIM.sim_steps`(optional) 합. 없으면 `SIM` 이벤트 수로 근사(=1씩)

- 자동 채움(권장)
  - end-of-episode(또는 오프라인) 집계로 `SCORE_REPORT.payload.workload_covariates.WL_jit_*`에 주입  
  - DuckDB 레퍼런스 뷰: `SSOT_SCHEMA_BUNDLE.zip ▸ tools/ANALYSIS_STORE_DUCKDB_VIEWS_JIT.sql`
 + §12.4.6



### 11.6 Intervention/Policy 추적 지표 (v0, Iteration 3 결합)

Intervention/Policy는 “성과”가 아니라 “안정화 제어”가 1차 목적이므로, 지표는 **효율(적용률/거절률) + 안전(진동/롤백) + 비용**을 중심으로 본다.

- `InterventionApplyRate_w`: 윈도우 내 applied / retrieved 비율
- `InterventionRejectRate_w`: rejected / retrieved 비율 (reason 분해)
- `InterventionRollbackRate_w`: rollback / applied 비율
- `InterventionCooldownHitRate_w`: cooldown_hits_w / applied
- `InterventionEffectEMA` (per intervention_id): `ΔPerf`, `ΔStab`, `ΔCost` EMA(권위 없음, prior 보조항)
- `InterventionOscillationIndex_w`: 동일 개입의 on/off 반복 빈도(히스테리시스 실패 신호)


- (추가, 권장) **Self-Evolution(Artifact Self-Tuning) 건강 지표**
  - 목적: 자기진화 루프가 “잘 굴러가는 척 하다가 서서히 망가지는” 걸 조기에 잡는다.

  - `ContextPollutionProxy_w`:
    - 정의(권장 근사): 최근 윈도우에서 `reason_tags`/`candidate_features` 분포가 한쪽으로 과도하게 치우친 정도(예: entropy↓, top-1 share↑)
    - 데이터: `ARTIFACT_TUNE_CANDIDATE.reason_tags`, (가능하면) 후보 feature 해시

  - `ModeCollapseProxy_w`:
    - 정의(권장 근사): 후보 다양성 저하(예: unique candidate_version / total candidates), 또는 승격이 특정 템플릿에만 몰림

  - `WeakCollabProxy_w`:
    - 정의(권장 근사): crossover로 만든 후보의 승격률이 0으로 수렴하거나, 병렬 궤적 수 대비 승격 수가 낮아지는 신호

  - `MBB_TriggerRate_w`:
    - 정의: `ARTIFACT_TUNE_ROLLBACK` 발생률(윈도우 기준)

  - `AmbiguityHoldRate_w`:
    - 정의: `winner=tie` 또는 `promotion=HOLD` 비율(불확실성 때문에 승격을 보류한 비율)


> 주의: 위 지표는 Decision Authority가 아니다. Gate(EVC)와 Evidence Contract를 대체하지 않는다.



### 11.7 A-PCI (PCI-A proxy) 스펙 (권장, v0)

> 출처 요약: arXiv:2512.19155v1(2025-12-22/23)에서 제안된 **PCI-A proxy**(workspace에 노이즈 펄스를 주고, 그 뒤의 궤적을 이진화+압축해 복잡도를 근사)를 Augnes 운영 지표로 이식한 것.

#### 11.7.1 정의(권장 구현)
- **Perturb**: Workspace(또는 Workspace에 준하는 broadcast latents)에 **짧은 노이즈 펄스**를 주입한다.
- **Measure**: 이후 `T` step 동안의 workspace 상태 궤적 `w[1..T]`를 기록한다.
- **Binarize**: 각 step 벡터를 이진화한다(예: `w_t > 0`를 1, 아니면 0).
- **Compress**: 이진 시퀀스를 Lempel-Ziv 계열(gzip 등)로 압축한다.
- **Raw PCI-A**: `compressed_bytes`(또는 `compressed_bits`)를 raw score로 기록한다.

#### 11.7.2 왜 ΔPCI를 같이 기록하나(필수 권장)
- 인공 에이전트에서는 **실패/오프폴리시 노이즈**만으로도 압축 복잡도가 커질 수 있다.
- 따라서 **대조 지표**를 함께 둔다:
  - `ΔPCI = mean(PCI-A | correct) - mean(PCI-A | incorrect)`
  - 의미: ‘성공적인 계산이 일어나는 레짐’에서만 복잡도가 선택적으로 증가하는지 확인.
- 주의: ΔPCI는 IIT의 정식 Φ 대체물이 아니다. 운영상 ‘실패-기인 복잡도’와 ‘구조적 궤적’의 구분을 돕는 실용 지표다.

#### 11.7.3 기록 최소 스펙
- per-run(필수): `compressed_bytes`, `traj_len_steps`, `noise_sigma`, `pulse_duration_steps`, `binarization`, `compressor`, `probe_config_hash`
- per-window(권장): `pci_a_raw_mean_w`, `delta_pci_mean_w`, `n_runs_w`
- 버전 고정: `probe_config_hash`(또는 `probe_suite_version`)가 바뀌면 과거와 직접 비교 금지.

#### 11.7.4 STATE_SNAPSHOT 연결(권장)
`STATE_SNAPSHOT.payload.metrics_optional.a_pci_latest`에 아래를 권장:
- `pci_a_raw_last`, `pci_a_raw_mean_w`
- `delta_pci_last`(가능하면), `delta_pci_mean_w`(권장)
- `n_runs_w`, `window_steps`, `probe_suite_id`
- `probe_config_hash`, `compressor`, `binarization`, `traj_len_steps`, `noise_sigma`
- `computed_at_ts`
### 11.8 ContextStencil(Spatial Gating) 스펙 (권장, v0)

모티브: "Oscillatory control of cortical space as a computational dimension"에서의 **inhibitory stencil** 개념을  
Augnes Local의 “컨텍스트/메모리 공간 soft-gating”으로 번역한 계측 스펙이다.

목적:
- 스텐실이 **진짜로 게이팅 역할**을 하는지(=사용량 anti-corr)  
- 스텐실이 **발작/진동**하는지(=jerk/flip)  
- 스텐실이 **한 덩어리로 조직**되는지(=spatial autocorr)  
를 값싼 프록시로 조기 탐지한다.

#### 11.8.1 용어(권장)
- `ctx_region_set_id`: region partition의 고정 ID (회귀/재현용)
- `inhibit_w[region] ∈ [0,1]`: 0=허용, 1=강억제
- `allow_w[region] := 1 - inhibit_w[region]` (권장 파생)

#### 11.8.2 권장 지표(전부 raw 저장; window/EMA 병행 권장)

1) **집중도/분산(형태)**
- `stencil_entropy_last`, `stencil_entropy_mean_w`  
  - 정의(권장): `p_i = allow_w_i / Σ allow_w`, `H = -Σ p_i log p_i`, `H_norm = H / log(K)` (K=region 수)
  - 해석: 낮을수록 “선택적으로 좁게 허용”, 높을수록 “전체를 넓게 허용”

2) **진동/급발진(안정성)**
- `stencil_jerk_p95_w`  
  - 정의(권장): `||Δ² allow_w||_2` (2차 차분의 L2) 윈도우 p95
- `stencil_flip_rate_w`  
  - 정의(권장): `sign(Δ allow_w_i)`의 부호가 바뀐 횟수/시간(또는 /step) 합

3) **공간 조직(선택; 가능할 때만)**
- `stencil_moran_i_last`, `stencil_moran_i_mean_w`  
  - 정의(권장): Moran's I (region adjacency graph를 정의할 수 있을 때만)  
  - 구현 팁: v0에서는 “인접=같은 tier(T0/T1/T2) 또는 같은 source bank” 같은 조악한 그래프도 충분하다.

4) **게이팅 효과(핵심; 선택)**
- `stencil_usage_anticorr_last`, `stencil_usage_anticorr_mean_w`  
  - 정의(권장): region별 `allow_w`와 “관측된 사용량”(`usage_frac`)의 상관(권장: Pearson/Spearman 중 하나)  
  - 기대: 억제된 영역은 덜 쓰여야 하므로, `corr(allow_w, usage_frac)`는 양수 쪽으로 크고  
    `corr(inhibit_w, usage_frac)`는 음수 쪽이어야 한다(anti-corr).
  - `usage_frac` 프록시 예:
    - retrieval: region별 hit count / total hits
    - selection_ctx: region별 selected token/span count / total
    - (가능하면) attention mass 근사

#### 11.8.3 기록 위치(권장; 스키마 확장 없음)

- `STATE_SNAPSHOT.payload.metrics_optional.artifact_tuning.context_stencil` (object) 아래에 권장:
  - 식별자: `ctx_region_set_id`, `stencil_hash`, `computed_at_ts`
  - 요약: `topk_allow_regions`, `topk_inhibit_regions` (각각 id+weight, optional)
  - 지표: `stencil_entropy_last`, `stencil_entropy_mean_w`, `stencil_jerk_p95_w`, `stencil_flip_rate_w`
  - (선택) `stencil_moran_i_last`, `stencil_moran_i_mean_w`
  - (선택) `stencil_usage_anticorr_last`, `stencil_usage_anticorr_mean_w`

주의:
- 전체 `inhibit_w[]` 벡터를 SSOT 로그에 그대로 넣지 않는다(비용/개인정보/디버그 오염).  
  필요하면 debug-store에 저장하고, SSOT에는 `stencil_hash/ref`만 남긴다.

#### 11.8.4 (옵션) PROBE `stencil_v0` 권장
- 이벤트: `PROBE_RUN_START/END`
  - `probe_suite_id = "stencil_v0"`, `probe_kind = "stencil"`
  - (옵션) payload에 `stencil_moran_i`, `stencil_usage_anticorr` 등 추가 기록(스키마 확장 없음)
- 목적: 셔플/인접성 교란/partition 변경에도 계측이 안정적으로 재현되는지(=회귀) 조기 탐지.

## 12. Logging Contract (v0): Event Schema & Evidence Contract

> 목적: NEI/CDI/A-PCI를 “계산할 수 있는” 최소 로그를 보장한다.  
> 원칙: (1) **일관된 trace_id**, (2) **모듈/툴/메모리의 전이 기록**, (3) **근거 무결성 연결**.

### 12.1 공통 필드(모든 이벤트)

- `ts`: timestamp (ms)
- `session_id`
- `episode_id`
- `trace_id` / `parent_trace_id` (트리 구조)
- `event_type`
- `module`: {planner, retriever, verifier, tool_router, executive_core, memory, self_graph, sidecar, 기타}
- `status`: {start, end, ok, fail}
- `latency_ms`
- `tokens_in`, `tokens_out`
- `cost_units` (로컬 기준: ms, bytes, calls 등)
- `summary`: 짧은 요약(개인정보/원문 저장 최소화)
- `confidence` (있으면)
- `evidence_refs`: [evidence_id] (있으면; 각 원소는 UUID)

### 12.2 이벤트 타입(최소 세트)

1) **모듈 호출**
- `MODULE_CALL_START`, `MODULE_CALL_END`

2) **툴 호출**
- `TOOL_CALL_START`, `TOOL_CALL_END`
  - 반드시 `tool_run_id`, `tool_name`, `args_hash`, `result_hash`, `error_code` 포함

3) **리트리벌/메모리 IO**
- `RETRIEVAL_QUERY`, `RETRIEVAL_RESULT` (top-k ids + scores)
- `MEMORY_WRITE`, `MEMORY_READ`, `MEMORY_COMPRESS`, `MEMORY_PRUNE`

4) **Self-Graph 조작**
- `CLAIM_CREATE`, `CLAIM_NEW_VERSION`
- `EVIDENCE_ATTACH`, `EVIDENCE_VERIFY`

- `GRAPH_NODE_ADD`, `GRAPH_EDGE_ADD`, `GRAPH_EDGE_UPDATE`
- (HAG Influence 레이어) 표준: `GRAPH_EDGE_UPDATE` + `payload.algorithm="HAG"`.
  - Sweep 구분: `payload.phase=("start"|"step"|"end")` 또는 `payload.sweep_id`.


4b) **Goal/Drive/Trace (Executive Core)**
- `IDENTITY_INIT`: `identity_goal_hash`, `creed_hashes[]`
- `GOAL_SET`: `goal_id`, `source`, `priority`, `goal_text_hash`
- `GOAL_COMPLETE`: `goal_id`, `success`, `outcome_hash`
- `DRIVE_STATE_UPDATE`: `drive{c,m,r}`, `beta{intrinsic,extrinsic}`, `delta_beta_l2`
- `INTRINSIC_REWARD_EMIT`: `r_int_nl_hash` (원문은 로컬 파일로 분리 저장 권장)
- `TRACE_CAPSULE_COMMIT`: `trace_id`, `goal_id`, `reusable`, `reuse_key`, `cost.*`
- `TRACE_CAPSULE_REUSE`: `trace_id`, `reuse_key`



4c) **Routing/Context Policy (TRL Router, 통합)**
- (권장) `ROUTE_ASSESSMENT`
  - `intent_class`(convergent|divergent|mixed), `route_tier`(R0~R5), `evidence_mode`, `search_mode`, `context_profile`
  - (옵션) `route_catalog_default`, `budget_profile_id`, `gate_prior_hint`(pre-clip), `reason_codes[]`
- (권장) `CONTEXT_FOLD` *(PCF 사건 단위 기록; MEMORY_* 이벤트로 대체 가능)*
  - `pcf_action`(KEEP|FOLD_SUM|FOLD_COMMIT|EVICT|PIN), `trigger`, `t0_tokens_before/after`
  - `pinned_refs[]`(claim_id/evidence_id/tool_run_id), `rc_refs[]`(복구 포인터)



4d) **JIT Construal Loop (작업용 미니 세계모델 / Active Set)**

- (권장) `JIT_CONSTRUAL_INIT`, `JIT_CONSTRUAL_SIM`, `JIT_CONSTRUAL_LOOKAHEAD`, `JIT_CONSTRUAL_ENCODE`, `JIT_CONSTRUAL_PRUNE`, `JIT_CONSTRUAL_OUTCOME`
- payload 계약/required는 스키마 번들에서만 인용:
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jit_object.schema.yaml`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jit_need.schema.yaml`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jit_construal.schema.yaml`
- 예시:
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_JIT_CONSTRUAL_*.json`
- 권한:
  - Control/View 전용(계산/로딩/삭제의 운영 로그). Evidence/Claim confidence 승격 금지.

4e) **NetArch-G(Mode/Bridge/SmallWorld) (Control/View)** — “모드 전이/브리지/그래프 하우스키핑” 최소 계약

- **권한:** Control/View only (Evidence/Claim 승격 금지)
- **이벤트 3종(권장 최소):**
  - `MODE_SWITCH` : 컨트롤 모드 전환(트리거/사유코드/신뢰도)
  - `BRIDGE_CALL` : 클러스터 간 다리 시도(성공/실패/유틸리티)
  - `GRAPH_MAINTENANCE` : 프루닝/리웨이트/브리지 추가 등 그래프 위생 작업

- **주의:** 여기의 `MODE_SWITCH`는 **control_mode_id 전이**를 의미한다. `BEHAVIOR_STATE_SWITCH`(행동/레짐 단계)와 혼용하지 말 것. 가능하면 `payload.scope='control_mode'`를 함께 기록.
- **스키마/예시(정식 포인터):**
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/state_snapshot.schema.yaml`  *(state_core.control_mode_id, metrics_optional.netarch.*)*
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_MODE_SWITCH.json`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_BRIDGE_CALL.json`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_GRAPH_MAINTENANCE.json`
- **파생 covariates(WL_netarch_*) (권장 최소):**
  - `WL_netarch_mode_switch_count` *(alias: `WL_netarch_control_mode_switch_count`)*
  - `WL_netarch_bridge_calls`
  - `WL_netarch_bridge_hit_rate`
  - `WL_netarch_maintenance_runs`


5) **상태 스냅샷 & 정책 변경**
- `STATE_SNAPSHOT` (Sidecar e_t, NEI, CDI, 최신 A-PCI)
- (권장) `GATE_DECISION`: Gate가 실제로 선택한 행동(VERIFY/RETRIEVE/COMMIT 등)과 핵심 근거 요약(점수/쿨다운/캡 히트)
- (권장) `JML_ENTRY`: 저비용 실행 요약 + 예산/축/클로저/커밋 메타(세부는 아래 §12.2.x)
- (권장) `SKETCHPAD_UPDATE`
- (옵션) `ROT_TRACE_UPDATE`: RoTTrace(렌더링된 CoT→단일행 이미지→비전 임베딩) 생성/갱신 **포인터** 기록 (Control/View)
  - 예시: `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_ROT_TRACE_UPDATE.json`
  - 권장 최소(예시와 동일한 구조):
    - `payload.rot_trace.{mode,encoder_id,render_cfg,token_budget,step_count,seq_len,trace_ref,trace_hash}`
    - `payload.sketchpad_bridge.{sketch_kind,sketch_repr,ref}`  # SketchPad로 연결하는 최소 브리지
    - (옵션) `payload.cost.{render_ms,encode_ms,bytes}` / `payload.rot_trace.saturation_plateau_at`
- (옵션) `EES_SIGNAL`: `ees`, `components.*`, `triggered_gate` (스냅샷 외에 사건 단위로 남기고 싶을 때)
- (옵션) `SYNC_ESTIMATE`: `module_synchrony_index`, `loop_maintenance_index`, `scope` (대상 모듈/윈도우)


- (옵션, 스키마 확장 없이) `STATE_SNAPSHOT.payload.metrics_optional.learned_pred`:
  - `commit_fail_hat`, `verify_gain_hat`
  - `(optional) cost_hat.{tokens,tool_calls,latency_ms}`
  - `(optional) delta_q_hat`, `delta_q_over_m_hat`, `delta_m_hat` (PDC 승격용 “개선 가능” 신호; Playbook §3.2.3b 단일 기준)
  - `(optional) p_improve`, `p_loop`, `conf` (캘리브레이션 가능하면만)

  - `model_version`, `feature_version`, `calib_bin`(있으면), `jerk_ema_alpha`



- (옵션, 스키마 확장 없이) `STATE_SNAPSHOT.payload.metrics_optional.g2a` *(Control/View)*:
  - `g2a_coupling_hat` + `goal_pulse_count_w`/`action_fire_count_w`
  - `hit_rate_w`/`base_rate_w` + (권장) `window_steps`/`delta_t_max_ms`/`lag_ms_hat`
  - 목적: Gate의 COMMIT↔VERIFY 사이 “커밋 보조 프라이어”(prior-only, clip/jerk/cooldown 필수)

- (옵션, 스키마 확장 없이) `STATE_SNAPSHOT.payload.metrics_optional.orav` *(Control/View)*:
  - `veto_active`, `last_triggered_step`, `cooldown_steps`, `veto_rate_w`
  - 목적: outcome/reward 악화 + g2a 낮음일 때 COMMIT hold/penalty (하드 veto 권장 X)

- (옵션, 스키마 확장 없이) `STATE_SNAPSHOT.payload.metrics_optional.memory_ann` *(Control/View)*:
  - `mn_bias_hat`, `mn_conf` + (optional) `mn_timescale_mix`, `mn_cf_sens_hat`
  - 목적: Gate의 COMMIT↔VERIFY/RETRIEVE 사이 “메모리 기반 프라이어”(prior-only, clip/jerk/cooldown 필수; τ_stop 입력 금지)

- (옵션, 스키마 확장 없이) `STATE_SNAPSHOT.payload.metrics_optional.cerebellar_satellites`:
  - 목적: CSB 위성 출력/게인/선택성/분리 위반을 **Control/View로만** 남긴다.
  - 권장 최소 필드:
    - `mode`: `off|observe_only|assist_logits|assist_policy`
    - `profiles[]`: 각 위성 프로파일별 요약
      - `profile_id`, `output_type`(`logits|policy`)
      - `gain`, `clip`, `delta_l1`(적용된 변화량 요약)
      - `selectivity_score`, `mixedness_score`
      - `separation_violation`(Δlogits/Δpolicy 혼선 여부)
      - `disabled_reason`(있으면)
  - 운영 규칙(필수):
    - **τ_stop 입력 금지**(SRF 블랙리스트)  
    - Evidence/Claim confidence로 승격 금지  
    - `separation_violation==true`면 즉시 `mode=off`로 내려서 안전 롤백(권장)

- (권장) `GATE_DECISION.payload.cerebellar_satellites_used`:
  - Gate가 실제로 적용한 `gain/clip`과, 어떤 위성이 어떤 후보 점수(prior)에 기여했는지 기록
  - 예: `used_profiles`, `prior_clip_sat`, `delta_policy_score_applied`

- (권장) `GATE_DECISION.payload.learned_pred_used`:
  - Gate가 실제로 사용한 `learned_pred` 값(clip/EMA 이후) + `lps_weight` + `reason_codes`  
  - (권장) `prior_pipeline_id`(예: `prior_pipeline_v1`)를 포함해 “LPS/G2A/MN이 같은 코드 경로를 탔는지”를 사후 검증 가능하게 한다.  
  - (운영 게이트) 회귀/재현성 검증(Ops Gate Checklist v0.1)에서는 `prior_pipeline_id`를 사실상 필수로 취급한다. 누락 시 해당 run은 비교/집계 불가로 fail 처리.
  - (선택) `applied_rules: {clip_bound, jerk_bound, cooldown_active}` 기록
  - 목적: “프라이어가 결정을 얼마나 흔들었는지”를 사후 감사 가능하게 만들기.

- (권장) `GATE_DECISION.payload.memory_ann_used`:
  - Gate가 실제로 사용한 `memory_ann` 값(clip/EMA 이후) + `mn_weight` + `reason_codes`  
  - (권장) `prior_pipeline_id`(예: `prior_pipeline_v1`)를 포함해 “LPS/G2A/MN이 같은 코드 경로를 탔는지”를 사후 검증 가능하게 한다.  
  - (운영 게이트) 회귀/재현성 검증(Ops Gate Checklist v0.1)에서는 `prior_pipeline_id`를 사실상 필수로 취급한다. 누락 시 해당 run은 비교/집계 불가로 fail 처리.
  - (선택) `applied_rules: {clip_bound, jerk_bound, cooldown_active}` 기록
  - 목적: “MN 프라이어가 결정을 얼마나 흔들었는지”를 사후 감사 가능하게 만들기.


6) **개입(Intervention) 이벤트 (Iteration 3 결합 반영)**

- (필수) `INTERVENTION_RETRIEVED`
  - `state_labels[]`, `route_tier`, `topk[{id,score,source}]`, `library_version`

- (필수) `INTERVENTION_DECISION`  *(= DecisionRecord를 사건 단위로 남기는 방식; 로그는 Evidence가 아님)*
  - `state_labels[]`, `route_tier`, `library_version`
  - `applied[]`: `[{id, category, lever_deltas.*, clipped_flags.*, cooldown_set_steps?}]`
  - `rejected[]`: `[{id, reason(guardrail|budget|cooldown|evc_unfavorable|dedup), notes?}]`
  - `policy_delta_applied.*`, `gate_prior_applied`, `candidate_injection_applied[]`(optional), `deduped_ids[]`(optional)
  - (r6, 옵션) `shuffle_invariance`: `{k, max_abs_policy_delta, max_abs_gate_prior, max_abs_injection, ok}`
    - 목적: Intervention 합성 셔플 불변성 테스트 결과를 로그에 남겨 회귀 버그를 조기 탐지.
    - (운영 게이트) staging/prod 회귀에서는 `shuffle_invariance`를 활성화하는 것을 사실상 필수로 본다(Ops Gate Checklist v0.1/Gate-07).

- (옵션) `INTERVENTION_ROLLBACK`
  - `intervention_id`, `rollback_reason`(oscillation|guardrail_trip|regression), `rollback_to`(policy_snapshot_id)

- 레거시/세분 이벤트(원하면 유지)

- (선택) `BEHAVIOR_STATE_SWITCH`: BSL 전환 이벤트(세션 시작 변화점 포함)
  - `episode_id`, `from_state_id`, `to_state_id`, `behavior_stage_id`, `confidence`
  - `reason`: `session_boundary`|`behavior_change`|`policy_shift`|`other`
  - 기록 규칙: (i) Control/진단 로그, (ii) Evidence/Claim 승격 금지, (iii) 세션 경계에서 자주 발생하는지 회귀 분석에 사용
  - `INTERVENTION_APPLIED / INTERVENTION_REJECTED / INTERVENTION_COOLDOWN_SET` 는 **INTERVENTION_DECISION으로 통합 가능**.
  - **의미 분리(중요):** `BEHAVIOR_STATE_SWITCH`는 **거친 행동/레짐(behavior_stage) 변화** 기록이고, `MODE_SWITCH`는 **NetArch-G 컨트롤 모드(control_mode_id) 전이** 기록이다. 둘을 같은 축으로 섞지 말 것. (스키마에서 `payload.scope`를 선택적으로 기록해 구분 권장)



> 주의: 위 이벤트는 **Evidence가 아니라 Control/진단 로그**다. (Evidence Contract의 경로를 침범하지 않는다)



7) **Artifact Self-Tuning (Feedback Descent / Self-evolution)**
- `ARTIFACT_TUNE_CANDIDATE`
  - required: `artifact_id`, `base_version`, `candidate_version_or_hash`, `reason_tags[]`, `proposer`, `diff_ref`(optional)
- `ARTIFACT_TUNE_EVAL`
  - required: `artifact_id`, `base_version`, `candidate_version_or_hash`, `eval_suite_id`, `metrics_summary`, `ambiguity_score`(optional)
- `ARTIFACT_TUNE_COMMIT`
  - required: `artifact_id`, `from_version`, `to_version`, `winner`, `p_t`(optional), `r_t_ref`(optional), `rollback_token`
- `ARTIFACT_TUNE_ROLLBACK`
  - required: `artifact_id`, `rollback_to_version`, `rollback_reason`, `rollback_token`

권장(컨텍스트/백트랙/샘플링 메타):
- `hcm_state`(clean|warming|polluted|overflow)
- `progress_momentum_w`, `backtrack_depth`, `backtrack_reason`
- `episode_tag`(예: curriculum_sandbox)

주의: Artifact 튜닝 이벤트는 ‘학습 신호’가 아니라 **운영/회귀 관리 신호**다.

7b) **Iterative Deployment: Dataset/Finetune Runs (옵션)**

Artifact Self-Tuning(§7)과 분리해, “배포 로그를 오프라인 파이프라인으로 재사용”하는 루프를 **재현 가능**하게 남긴다.

- `DATASET_BUILD_START`
  - required(권장 최소): `dataset_build_id`, `dataset_kind`, `intended_use`, `source_query`, `filter_policy_hash`, `dedupe_policy`
  - (r19 운영): `failure_mode_taxonomy_id`, `target_failure_modes[]`, `composition_targets{}`(선택)

- `DATASET_BUILD_END`
  - required(권장 최소): `dataset_build_id`, `status`, `counts`, `output_ref`, `dataset_hash`
  - (r19 운영): `failure_mode_counts{}`(=failure_mode_id→count), `composition_deviation{}`(선택)

- `FINETUNE_RUN_START` *(후순위 옵션: weight tuning; r19는 head-tune도 여기로 로깅 가능)*
  - required(권장 최소): `finetune_run_id`, `base_model_id`, `dataset_build_id`, `method`, `config_hash`, `eval_suite_id`
  - (r19 운영): `trainable_component`(router_head|verifier_head|sidecar_head|backbone), `backbone_frozen`(bool), `trainable_params`(int, optional)

- `FINETUNE_RUN_END`
  - required(권장 최소): `finetune_run_id`, `status`, `output_model_id`, `eval_summary`
  - (r19 운영): `artifact_ids[]`(생성된 head artifact), `rollback_token`(선택)
  - (권장) **TTT-lite/UBB coefficient 튜닝(=Parameter Memory)** 을 로깅할 때:
    - `method`: 예) `ttt_lite_ubbc` *(문자열로만 구분; 스키마 enum 추가 금지)*
    - `trainable_component`: head/어댑터면 `sidecar_head` 권장 + `backbone_frozen=true`
    - `FINETUNE_RUN_END.payload.artifact_ids[]`: 생성된 `adapter_profile_id`(또는 head artifact id)를 포함
    - 커밋/롤백 계보는 `ARTIFACT_TUNE_*`와 짝지어 남긴다(운영 회귀 관리).



권장 메타(선택): `canary_group_id`, `rollback_token`, `safety_mode`, `gate_profile_id`.

주의: 위 이벤트들은 **Evidence/Claim 권위를 만들지 않는** 운영/재현성 로그다. (학습 신호 자체가 아니다)





**`STATE_SNAPSHOT.payload` 최소 스키마 (v0.1, 권장)**

목표: “계산 가능한 상태”를 남겨서 회귀/진동/오염을 원인 단위로 추적한다. (원문/개인정보는 최소화)

- `state_schema_version`: string|int (예: `0.1`)
- `state_core`:
  - `e_t`: object (stabilized)
    - (권장 서브필드/축) `tau_hat`, `Q_hat`, `M_hat`, `eff_hat`
    - (옵션) `sync_hat`, `sync_drift_hat`, `loopness_hat`
    - (옵션) `axis_snapshot`(또는 `metrics_optional.control_axes.axis_snapshot`로 분리): Axis Bank에서 뽑은 저차원 축 값
  - `pe_w`: {`PE_lm_w`, `PE_tool_w`, `PE_goal_w`, `PE_memory_w`} (윈도우/EMA 집계)
  - `zone`: {subcritical|near_critical|supercritical}
  - `state_label`: string (예: `near_critical:ACQUIRE`)
  - (추가, 권장) `behavior_state` (optional; dot-path: `state_core.behavior_state`): 세션 내부 행동 상태(BSL)
    - `behavior_state_id`: string|null
    - `behavior_stage_id`: string|null (권장: `S1`|`S2`|`S3`)
    - `behavior_state_confidence`: float|null (0..1)
    - `session_pos_norm`: float|null (0..1; 세션 시작=0)
    - `last_switch`: object|null (최근 전환 요약)
      - `from_state_id`, `to_state_id`, `reason`, `ts`
    - 파생 라벨 규칙(권장): `session_pos_norm ≤ θ_start`이면 state_labels에 `session_start` 포함
  - (옵션) `route_last`: object (라우팅/컨텍스트 정책 요약; solve 오염 방지용 메타)
    - `route_tier_last`: string|null
    - `intent_class_last`: string|null
    - `evidence_mode_last`: string|null
    - `search_mode_last`: string|null
    - `context_profile_last`: string|null
  - (추가) `ees_w` (optional; dot-path: `state_core.ees_w`): 조기 오류 신호 윈도우 집계
    - `EES_mean_w`: float
    - `EES_p95_w`: float (권장)
    - (옵션) `EES_components_mean_w`: object
  - (옵션) `ees_last` (dot-path: `state_core.ees_last`): float (+ `ees_components_last`)
    - `EES_p95_w`: float
    - (옵션) `EES_components_mean_w`: object|null
  - (추가) `sync_w` (optional): 모듈 협응/루프 유지 윈도우 집계
    - `module_synchrony_index_w`: float|null
    - `loop_maintenance_index_w`: float|null
  - `self_reflect_w` (optional): self-reflection/루미네이션 윈도우 집계 + 최근 실행 메타
    - `count_w`: int
    - `tokens_w`: int
    - `rumination_index_w`: float
    - (옵션) `iqs_mean_w`, `iqs_p10_w`, `iqs_p90_w`
    - (옵션) `scs_pairwise_cosine_mean_w`
    - (옵션) `hap_evidence_conflict_delta_w`, `hap_overconfident_error_delta_w`
    - `last_protocol`, `last_variant_id`, `last_output_format`
    - `last_iqs_1to5`, `last_scs_pairwise_cosine_mean`, `last_hap_proxy_delta`, `last_ts`
  - (추가, 권장) `policy_smoothing_w` (optional): 정책/Sidecar 변화율 계측
    - `delta_levers_l2_w`: float
    - `jerk_levers_l2_w`: float
    - `jerk_cap_hit_count_w`: int
    - `delta_e_t_l2_w`: float
    - `jerk_e_t_l2_w`: float
    - `jerk_e_t_cap_hit_count_w`: int
  - (추가, 권장) `candidate_selector_w` (optional): batched 후보 선택/리셋 계측
    - `batch_count_w`: int
    - `avg_k_w`: float
    - `continuity_score_mean_w`: float
    - `reset_count_w`: int
  - (추가, 권장) `intervention_context_w` (optional): 개입 라이브러리의 검색/적용/거절/쿨다운 요약(윈도우 집계)
    - `retrieved_topk`: list[{`id`: str, `score`: float, `source`: str}]
    - `applied`: list[{`id`: str, `category`: str, `t_since_apply_steps`: int}]
    - `rejected`: list[{`id`: str, `reason`: str}]
    - `cooldown_hits_w`: int
    - `lever_delta_norm_w`: float
    - `jerk_delta_norm_w`: float
    - `clip_flags_w`: dict[str,bool] (예: `prior_clipped`, `injection_cap_hit`, `budget_cap_hit`)

    - (옵션) `reset_reason_topk`: [{label: str, count: int}]
  - `self_reflect_last` (optional; Canonical 권장): 최근 `SELF_REFLECT` 실행 메타데이터(뷰/계측용)
    - `protocol`, `variant_id`, `output_format`
    - `iqs_1to5`, `scs_pairwise_cosine_mean_w`, `hap_proxy_delta_w`, `last_ts`
    - 규칙: `self_reflect_w.last_*`가 있으면 `self_reflect_last`와 값이 일치해야 한다(둘 다 있으면).
- `metrics_optional` (없으면 `null` 허용; enabled_flags로 구분):
  - (추가, 권장) `artifact_tuning` (optional): self-evolution 운영 메타
    - `hcm_state`: string
    - `progress_momentum_w`: float
    - `backtrack_depth`: int
    - `backtrack_reason`: string
    - `episode_tag`: string
  - `nei`: object|null (예: `sigma_flow_w`, `sigma_int_w`, `sigma_per_act_w`, `J_var_topk` 등)
  - `cdi`: object|null
  - `a_pci_latest`: object|null
  - `enabled_flags`: {`nei_enabled`: bool, `cdi_enabled`: bool, `apci_enabled`: bool}
- `policy_snapshot`:

- `preset`(권장): 현재 정책 조합의 재현 가능한 지문
  - `policy_preset_id`: string|null (예: `default_local_v0`, `shadow_sweep_202601`)
  - `policy_preset_version`: string|null
  - `policy_preset_hash`: sha256|string|null (정규화된 config 직렬화 해시)
  - alias 정규화:
    - `workspace_cap` -> `workspace_token_cap` (저장/출력은 token 단위 필드만 사용)
    - (개입 레버, 레거시) `intervention_prior_topk` -> `intervention_topk`
    - (개입 레버, 레거시) `intervention_cooldown_min_steps` -> `intervention_cooldown_steps_default`
  - `policy_levers`: object (PolicyLever vector; 확장 가능)
    - 최소 권장 키(없으면 `null` 허용하되, 있으면 반드시 기록):
      - `verifier_budget`
      - `retrieval_budget` (또는 `retrieval_depth_k` + `retrieval_threshold_tau`)
      - `branching_cap`
      - `tool_call_cooldown_ms`
      - `workspace_token_cap`
      - `intervention_topk`
      - `intervention_policy_delta_cap`
      - `intervention_cooldown_steps_default`
    - (옵션) `evidence_strictness`, `memory_write_gate`, `probe_frequency`, `pulse_policy`, `self_reflect_budget` 등
    - 규칙: alias 정규화(위 alias 정규화 블록)를 거친 **정규 키만 저장**한다.
    - 추가 키는 이 문서의 `policy_snapshot.policy_levers` 규율에 따라 **정규 키로만** 확장한다. (스키마는 `policy_levers`가 `additionalProperties=true`라, 키 추가 자체로 스키마를 다시 만들 필요는 없다.)
  - `cooldown_state`: object (행동별 잔여 스텝/시간)
  - `dwell_state`: {`min_dwell_remaining`: number, `last_state_change_ts`: number|TimeStamp}
- `recent_trace_compact`:
  - `recent_actions_topk`: [{`action`: string, `count`: int, `last_ts`: number|TimeStamp}]
  - `recent_failures`: object (예: tool_fail, verify_fail, contradiction_burst 등)



#### 12.2.x Sidecar/QP/Axis/BG 운영 필드 표준 (r9, v0.1)

> 이 블록은 SC/SP에서 제안된 “운영용 저차원 축/예산/클로저”를 **로그 계약(contract)**로 고정한다.  
> 원칙: (1) 값은 Control/진단용이며 Evidence로 승격 금지, (2) **단위/범위/수치 안정 규칙(eps/clamp)** 까지 같이 고정, (3) 저장 위치는 *한 군데*로.

##### A) τ/Q/M + BG(예산) 필드
- **정의(권장 의미론)**  
  - `tau_hat`: 현재 턴의 “생각/검증/탐색을 더 할 유인이 큰가”를 나타내는 요약 축(0..1 권장, 높을수록 더 탐색/검증 쪽)  
  - `Q_hat`: 품질/정확/일관성 추정 축(0..1)  
  - `M_hat`: 메모리/근거 일관성 추정 축(0..1)  
  - `eff_hat`: 비용 대비 효율/진척 추정 축(0..1)
- **기록 위치(권장)**  
  - `STATE_SNAPSHOT.payload.state_core.e_t.(tau_hat|Q_hat|M_hat|eff_hat)`  
  - 또는 분리: `STATE_SNAPSHOT.payload.metrics_optional.control_axes.(...)`
- **BG(예산) 산출물(권장)**  
  - `budget.tau_budget`: 추가 탐색/검증에 허용된 τ-예산(스텝/토큰 등 내부 단위)  
  - `budget.M_budget`: 메모리/리트리벌/검증 등에 허용된 M-예산(내부 단위)  
  - `budget.early_stop_reason`: enum|string (예: `tau_budget_exhausted`, `no_progress`, `risk_cap_hit`, `route_tier_cap`, `user_stop`)

  - (NEW) `budget.pdc_stage_id`: string|int (예: `S0|S1|S2`)  
  - (NEW) `budget.pdc_round`: integer (에피소드 내 루프 라운드; 1-indexed 권장)  
  - (NEW) `budget.pdc_stage_tau_cap`: number (현재 스테이지의 τ 상한)  
  - (NEW) `budget.pdc_stage_M_cap`: number (현재 스테이지의 M 상한)  
  - (NEW) `budget.halt_margin`: number (`τ_stop - EVC_raw_max`; 클수록 “멈춤” 쪽)  
  - (NEW) `budget.halt_reason`: enum|string (예: `stop_rule`, `tau_budget_exhausted`, `no_progress`, `loopness`)  
  - (권장) stop-rule 관측치도 같이 남긴다(스키마 확장 없이도 가능):
    - `SCORE_REPORT.payload.tau_stop` (또는 `metrics_optional.stop_rule.tau_stop_final`)
    - (선택) `metrics_optional.stop_rule.tau_stop_reason[]` (예: `oscillation`, `workload`, `rumination`, `burst`)
    - (선택) `metrics_optional.stop_rule.tau_stop_adj` (base 대비 조정량)
- **기록 위치(권장)**  
  - `JML_ENTRY.payload.budget.*` 또는 `GATE_DECISION.payload.budget.*`  
  - (가능하면) `JML_ENTRY.payload.outcome_metrics.(tau_gen|tau_mem)`로 실제 소모도 같이 남긴다.


- (NEW) HSW(후반 루프 학습 신호 감쇠) 관련
  - `outcome_metrics.hsw_lambda`: number (0..1]
  - `outcome_metrics.hsw_weight_last`: number (마지막 라운드에 적용된 w_T)
  - `outcome_metrics.hsw_rounds`: integer (이번 에피소드에서 사용된 라운드 수)

##### B) closure / 대칭(대칭성 테스트)
- `symmetry_suite_id`: 어떤 대칭/셔플 테스트 묶음인지(버전 고정)  
- `closure_score_e`, `closure_score_qp`: e_t/QP가 대칭 변환에 대해 얼마나 “닫혀(closed)” 있는지(0..1, 높을수록 좋음)  
- **수치 안정 규칙(고정)**  
  - `eps = 1e-6` (분모/로그 등)  
  - score는 `clamp(score, 0, 1)` 후 저장(오버슈트는 버그로 취급)

권장 기록 위치:
- `STATE_SNAPSHOT.payload.metrics_optional.symmetry.(symmetry_suite_id, closure_score_e, closure_score_qp, eps)`

##### C) Axis Bank (저차원 축 저장소)
- 목적: e_t/QP를 “해석 가능한 저차원 축”으로 운영/디버깅 가능하게 만든다.
- 최소 필드(권장):
  - `axis_bank_version`: string (축 정의 버전)
  - `axis_snapshot`: object (axis_id → value; value는 float 또는 small vector)
  - `axis_metrics`: object (예: `drift_l2`, `regime_id`, `pc_axis_drift_flag`, `axis_health_flags`)
- 권장 기록 위치:
  - `STATE_SNAPSHOT.payload.metrics_optional.control_axes.(axis_bank_version, axis_snapshot, axis_metrics)`  
  - 또는 `JML_ENTRY.payload.axis.(...)`로 턴 요약에 함께 남겨도 됨.

##### D) synchrony / loopness
- `sync_hat`, `sync_drift_hat`, `loopness_hat`: 협응/루프 유지/드리프트를 요약한 축(0..1 권장)
- 기존 `SYNC_ESTIMATE` / `state_core.sync_w`와의 관계:
  - `SYNC_ESTIMATE`: 사건 단위/원시 추정치(선택)
  - `sync_w`: 윈도우/EMA 집계(권장)
  - `sync_hat`: 의사결정용 단일 스칼라(권장, e_t 또는 control_axes에)

권장 기록 위치:
- `STATE_SNAPSHOT.payload.state_core.e_t.sync_hat` 또는 `metrics_optional.control_axes.sync_hat`
- 윈도우 집계는 기존 `state_core.sync_w`를 유지

##### E) neuro-motif(옵션)
- `etype_id`: 현재 활성화된 “경험 유형/신경 모티프” ID(예: `acquire`, `verify`, `replay`, `consolidate`)
- `etype_switch_count`, `etype_cooldown_state`: 스위칭 빈도/진동 억제용
- `trace_norm`, `trace_delta_norm`: trace 강도/변화율(정규화된 값)
- (옵션) `stp_kernel_id`, `tau_fast`, `tau_slow`, `alpha`, `mode`

권장 기록 위치:
- `STATE_SNAPSHOT.payload.metrics_optional.neuro_motif.*` 또는 `JML_ENTRY.payload.neuro_motif.*`

##### (권장) JML_ENTRY 최소 payload
- `JML_ENTRY.payload` (권장 최소):
  - `entry_id`, `episode_id`, `state_label`, `route_tier`, `decision`(e.g., `VERIFY`/`COMMIT`)
  - `budget.*`, `outcome_metrics.(tau_gen|tau_mem)`
  - (선택) `symmetry.*`, `axis.*`, `control_axes.*`
  - (선택) `digital_twin.*` (macro_state 기반 거시 추적: §12.2(6) 하단 참고)


##### (NEW) DigitalTwin(SSM-lite) 필드 계약 (macro_obs/macro_state)

> 목적: (1) 거시 상태를 **재현 가능하게** 남기고, (2) 위험 시점에만 줌인하도록 “싸고 안정적인 트리거”를 만든다.
> 원칙: **Evidence 승격 금지**, stop-rule 독립, 온라인은 할당만.

**기록 위치(권장)**
- `JML_ENTRY.payload.digital_twin.*` (턴 요약/의사결정 근거)
- 또는 `STATE_SNAPSHOT.payload.digital_twin.*` (Boundary close 스냅샷)

**필드(권장, 모두 optional)**
- `macro_obs_schema_id`: string (슬롯/스케일 규약 ID)
- `macro_obs_hash`: `sha256:<hex>` (정규화 후 벡터 해시)
- `macro_obs_ref`: string|null (debug-store/analysis-store 포인터)
- `macro_obs_codec`: string|null (예: `json`, `f16`, `npz`, `parquet_row`)

- `macro_state_id`: string
- `macro_state_version`: string (centroid/모델 버전, 혼합 금지)
- `macro_state_confidence`: float|null (0..1)
- `macro_state_method`: enum|string {`kmeans`|`gmm`|`hdbscan`|`hmm`|`other`}
- `macro_state_method_params_hash`: `sha256:<hex>`|null
- `centroid_hash`: `sha256:<hex>`|null (centroid/모델 파라미터 아티팩트)

- `risk_set_id`: string|null
- `risk_score`: float|null (0..1)
- `next_state_topk`: [{`state_id`: string, `p`: float}]|null

- `prototypes_topk`: [{`episode_id`: string, `score`: float|null}]|null  (해석/재현용)
- `zoom_in_trigger`: {`triggered`: bool, `reasons_topk`: [string]|null, `linked_trace_id`: string|null}|null

**필수 규칙(고정)**
- `macro_obs_hash`는 *원시값*이 아니라 정규화(clip/scale/eps) 이후 벡터로 계산한다.
- `macro_state_version`이 바뀌면 전이행렬(P̂)/risk 통계는 리셋 또는 버전 분기(혼합 금지).
- DigitalTwin으로 Evidence/Claim 생성/수정 금지.

  - `links`: `{state_snapshot_id?, intervention_decision_id?, trace_capsule_id?}`


- `POLICY_UPDATE` (필수 payload: `policy_levers_before`, `policy_levers_after`; 선택: `deltas`, `reason`, `triggered_by_metric`, `decision_record`(=InterventionDecisionRecord))
- (추가, 권장) `CANDIDATE_BATCH_GENERATED` (K개 후보 생성: 각 후보의 점수 요약 + 선택 기준)
- (추가, 권장) `CANDIDATE_SELECTED` (선택된 후보 id + continuity/evc 점수 + reset 여부)
- (추가, 권장) `POLICY_SMOOTHING_APPLIED` (Δ/Δ² 클리핑: delta_norm, jerk_norm, cap_hit_flags)

6) **펄스/프로브**

- `PULSE_TRIGGER` (Workspace 뷰 갱신 / A-PCI 섭동 트리거)
  - 목적: “왜/언제 펄스가 들어갔는지”를 재현 가능하게 남긴다(남발 방지 포함).
  - payload(권장 최소):
    - `pulse_id`: string (run 내 유일)
    - `pulse_kind`: enum {`workspace_refresh`|`perturbation`}
    - `target`: enum {`workspace`|`broadcast_latents`|`other`}
    - `reason`: enum|string (예: `boundary_close`, `scheduled_probe`, `anomaly_detected`)
    - (perturbation인 경우) `noise_sigma`: float
    - (perturbation인 경우) `pulse_duration_steps`: int
    - `traj_record_steps`: int (T)
    - `cooldown_steps`: int (권장; 연쇄 펄스 방지)
    - (옵션) `pre_state_label`, `pre_route_tier`, `pre_zone`
    - (옵션) `linked_probe_id`: string

- `PROBE_RUN_START` / `PROBE_RUN_END` (A-PCI/기타 프로브 산출값 포함)
  - `PROBE_RUN_START.payload`(권장 최소):
    - `probe_id`: string
    - `probe_suite_id`: string (예: `apci_v0`, `titration_l75_v0`, `policy_sensitivity_v0`, `invariance_v0`)
    - `probe_kind`: enum|string (예: `pci_a`)
    - `probe_config_hash`: string (버전 고정; 변경 시 과거와 직접 비교 금지)
    - `linked_pulse_id`: string (가능하면)
    - `traj_len_steps`: int
    - `binarization`: enum|string (예: `gt0`)
    - `compressor`: enum|string (예: `gzip`)
    - (옵션) `budget_snapshot`: object (예: `probe_budget_remaining`, `pulse_policy`)
  - `PROBE_RUN_END.payload`(권장 최소):
    - `probe_id`: string
    - `compressed_bytes`: int
    - `pci_a_raw`: float|int (기본: `compressed_bytes`)
    - `traj_len_steps`: int
    - `binarization`, `compressor` (동일값 재기록 허용)
    - (옵션) `correct_flag`: bool (사후 라벨/VERIFY 기반)
    - (옵션) `delta_pci_window`: float (윈도우가 구성된 경우만)
    - (옵션) `Cost_*`: vram/kv/cache/cpu/oom 등(가능할 때)
  - 연결(권장): `STATE_SNAPSHOT.payload.metrics_optional.a_pci_latest`에 최신 window 요약을 함께 남긴다.


7) **평가 리포트**
- `SCORE_REPORT` (Perf/Stab/Cost 원시값 + workload covariates)
  - 권장 최소 payload 메타(비교/회귀용, 스키마 확장 없음):
    - `eval_suite_id` (고정 문제 세트 ID)
    - `judge_config_hash` (채점/Verifier 규칙 버전)
    - `build_id` (모델+프롬프트+룰 번들 스냅샷 태그)
    - `ablation_id` + `toggle_map` (예: `{value:1,cost:1,rubric:0,auxmove:0}`)
  - (권장, AVR 정산용 요약 스칼라):
    - `MAE_steps` / `p95_abs_err_steps` (remaining_steps_hat 오차; OPS §9.7 참고)
    - `MAE_cost_tokens`, `MAE_cost_tool_calls`, `MAE_cost_latency_ms` (cost_hat 오차)
    - `Brier`/`ECE` (predicted_success_prob이 있는 suite에서만)
    - `rubric_commit_rate`, `auxmove_applied_rate` + 각각의 `success_uplift`/`cost_uplift` 요약


8) **NEI-SS 채널/빈(옵션)**
- `CHANNEL_REGISTRY` (채널 정의/매핑 규칙/버전)
- `BIN_TICK` (bin_id, bin_start/end, active_channels[] 또는 bitset)
  - 원칙: NEI-SS용 x_t는 “원시 이벤트”에서 재구성 가능해야 하며, 저장 시에는 **압축(예: 활성 채널 리스트/RLE)** 을 권장


9) **Self-Reflection / 예측-비교(권장)**
- `EXPECTED_OUTCOME_PACKET` (EOP 기록)
- `SELF_REFLECT_START`, `SELF_REFLECT_END` (또는 `INNER_SPEECH_UTTERANCE`)
- `PREDICT_OBS_COMPARE` (예상 vs 관측 비교: tool/result/constraint check)

9.1) **Metacognition / competence-aware strategy loop (권장)**
스키마/예시 포인터:
- `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml`
- `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_COMPETENCE_ASSESSMENT.json`
- `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_STRATEGY_SELECTION.json`
- `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_METACOG_CYCLE_END.json`

- `COMPETENCE_ASSESSMENT`: 후보 전략/플랜별 `competence_hat`(성공확률) + `competence_u`(불확실성) 기록
- `STRATEGY_SELECTION`: 후보 top-k, veto/선택 사유, 최종 `selected_strategy_id` 기록
- `METACOG_CYCLE_END`: 사이클 종료(성공/실패/stop) + 시도 횟수/최종 전략/요약 결과 기록

권장 최소 payload 키:
- 공통: `metacog_cycle_id`, `attempt_i`, `goal_id|null`, `task_id|null`
- assessment: `candidate_k`, `candidates[]` (각 후보에 `strategy_id`, `predicted_success_prob`, `uncertainty`, `risk_hat|null`, `remaining_steps_hat|null`, `cost_hat|null`)
- selection: `selected_strategy_id`, `selection_reason`, `vetoed[]`(있으면)
- end: `status`, `attempts_total`, `last_strategy_id`, `outcome_summary_hash`


추가(권장, Meta-WM gate; **계약 변경 없음**, optional key):
- `wm_meta` (state-level):  
  - `wm_strength_hat`(0..1), `wm_uncertainty_hat`(0..1), `history_bias_hat`(-1..1|null), `arousal_proxy`(0..1|null), `meta_wm_hat`(0..1)  
  - (옵션) `opt_out_recommendation`: string|null (예: `verify_or_tool|ask|none`)
- `candidates[].wm_dependency_hat` (0..1, optional): 해당 전략이 “내부 작업용 기억”에 얼마나 의존하는지
- `STRATEGY_SELECTION.payload.wm_meta_used` + `opt_out_triggered` (optional)
- `METACOG_CYCLE_END.payload.wm_meta_summary` (optional): `meta_wm_min/avg`, `opt_out_count`



추가(권장, AVR):
- `RUBRIC_REPORT`: 후보(전략/aux-move/trace-capsule 등)에 대한 **다축 채점표**(Control/View) 기록  
  - 최소 payload: `rubric_id`, `target_kind`, `target_id`, `scores`  
  - 예시: `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_RUBRIC_REPORT.json`





9.2) **PSGR(ProgRAG-style) Progressive Self-Graph Retrieval 이벤트(권장)

PSGR은 ‘Self-Graph를 읽고(검색) → 필요하면 prune/grow → Boundary에서만 커밋’하는 운영 루프라, 재현/회귀가 되려면 사건 로그가 반드시 필요하다.

- 권위: **Evidence/Claim 권위를 만들지 않는다**(운영/디버그용 텔레메트리).
- 상관키: `episode_id`/`trace_id` + `prograg_cycle_id`(PSGR 한 사이클) + `step_id`(세부 단계) + `subq_id`(서브쿼리).

#### (NEW) PROGRAG 이벤트 타입(최소 계약)
- `PROGRAG_STEP_START`
  - required(payload): `prograg_cycle_id`, `step_id`, `step_kind`
  - 권장: `phase`, `budget_slice`, `query_hash`, `graph_hash_before`, `policy_preset_id`

- `PROGRAG_SUBQUESTION`
  - required(payload): `prograg_cycle_id`, `step_id`, `subq_id`, `subq_text`
  - 권장: `reason`, `parent_question_hash`, `constraints`

- `PROGRAG_RELATION_RETRIEVAL`
  - required(payload): `prograg_cycle_id`, `step_id`, `subq_id`, `relation_types`, `topk`
  - 권장: `hits`, `latency_ms`, `sources`(claim/igl/artifact), `filtering`(trust/ttl)

- `PROGRAG_GRAPH_UPDATE`
  - required(payload): `prograg_cycle_id`, `step_id`, `update_mode`, `delta_summary`
  - 권장: `delta_nodes`, `delta_edges`, `apply_cap`, `cooldown_state`, `graph_hash_after`, `rollback_token`

- `PROGRAG_STEP_END`
  - required(payload): `prograg_cycle_id`, `step_id`, `status`
  - 권장: `outputs_ref`(선택), `failure_reason`, `cost_summary`

#### 스키마/예시 포인터
- Schema bundle: `SSOT_SCHEMA_BUNDLE.zip`의 `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml` 및 `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_PROGRAG_*.json`.

#### (NEW) `EXPECTED_OUTCOME_PACKET.payload` 계약(v0.2, 권장)

> 목적: “예상-관측 비교”가 파생 스토어에서 자동 계산되도록, 최소 키를 고정한다.

필수 필드:
- `eop_id`: string (`eop_<uuid>` 권장)
- `intent`: string
- `success_criteria`: string[] (1~3)
- `expected_artifacts`: string[] (0~3)
- `failure_modes_topk`: string[] (0~3)
- `checkpoints`: string[] (0~5)

선택 필드(EOP++):
- `wager`: object
  - `pred_kind`: string (권장 enum: `binary_success|numeric_delta|entity_match|constraint_satisfaction|retrieval_hit`)
  - `p_success`: number|null (0..1)
  - `obs_key`: string (예: `tool_run_id:<id>`, `evidence_id:<id>`, `file_hash:<sha256>`, `schema_validate:<schema_id>`)
  - `resolve_rule`: string (1~3줄)
  - (옵션) `stake_unit`: string (권장 enum: `tokens|ms|calls|risk_points`)
  - (옵션) `stake`: number
  - (옵션) `resolution_window_s`: number
  - (옵션) `calib_group`: string

권장 메타:
- `linked_action_id`: string|null (툴/액션과 1:1로 붙일 때)
- `created_by`: string (예: `gate`, `verifier`, `policy_hint`)


#### (NEW) `PREDICT_OBS_COMPARE.payload` 계약(v0.2, 권장)

필수 필드:
- `compare_id`: string (`cmp_<uuid>` 권장)
- `eop_id`: string (어떤 EOP를 정산하는지)
- `resolution_kind`: string (권장 enum: `tool_result|evidence_check|schema_check|manual_judge`)
- `outcome`: string (권장 enum: `pass|fail|partial|unresolved`)

권장 필드:
- `obs_ref`: string (예: `tool_run_id:<id>` 또는 `evidence_id:<id>` 또는 `file_hash:<sha256>`)
- `delta`: object|null
  - 예: `{ "kind": "numeric", "pred": 10, "obs": 12, "abs": 2, "rel": 0.2 }`
- `failure_mode_hit`: string|null (EOP의 failure_modes_topk 중 무엇이 터졌는지)
- `notes`: string|null (짧게)
- `resolved_time`: string|null (ISO; event_time과 다를 수 있으면)

파생 지표 연결(권장):
- `Brier`: `p_success`가 있고 `outcome∈{pass,fail}`이면 `y=1(pass) else 0`으로 계산.
- `OverconfidentError`: `p_success >= 0.8` 같은 고정 임계에서 `fail` 빈도.

- `OBSERVER_ALERT` (근거 부족/과신/진동/루미네이션 경고; 있으면)


**`SELF_REFLECT_START/END` payload (v0.1, 권장)**  
목표: SRP/컨트롤 어블레이션이 가능하도록 **프로토콜/출력 포맷/점수**를 고정한다.

- `SELF_REFLECT_START.payload` (권장 최소)
  - `self_reflect_protocol`: enum (Canonical §5.6.1)
  - `self_reflect_variant_id`: string|int
  - `self_reflect_output_format`: enum
  - `trigger`: {auto|manual|policy} + 원인 코드(예: `contradiction_burst`, `verify_fail_streak`, `goal_drift`)
  - `state_label`, `zone` (가능하면)
  - `pre_metrics` (optional): {`ContradictionRate_w`, `RevisionRate_w`, `RuminationIndex_w`, `OverconfidentError_w`, `PolicyFlipRate_w`, `ToolFailRate_w`, `RetrievalMissRate_w`}

- `SELF_REFLECT_END.payload` (권장 최소)
  - `reflection_packet`: {`goal`, `plan`, `doubts`, `stop_condition`, `expected_outcome`?} (output_format이 포함할 때)
  - `five_adjectives`: [string x5] (output_format이 포함할 때)
  - `iqs_1to5`: int(1..5) + `iqs_rater`:{model|human|hybrid}
  - `scs_pairwise_cosine_mean`: float (가능할 때만) + `embedding_model_id`
  - `hap_proxy_delta`: object (optional; 예: `evidence_conflict_delta_w`, `overconfident_error_delta_w`)
  - `reflection_text_hash`/`reflection_text_len` (optional)  
    - 원문 저장이 필요하면 별도 디버그 스토어에 두고, Event Log에는 해시/길이만 남기는 것을 권장



**`PULSE_TRIGGER.payload` (v0.1, 권장)**

- `pulse_id`: str (유니크; run 내 유일)
- `pulse_kind`: str enum (권장)
  - `workspace_refresh` (Workspace 뷰 갱신 트리거)
  - `perturbation` (PCI-A/A-PCI 측정용 섭동)
  - *(legacy alias)* `workspace_update` → `workspace_refresh`
- `target`: str enum (권장) — `workspace`, `broadcast_latents`, `other`
- `reason`: str enum|string (권장) — `boundary_close`, `commit`, `verify_conflict`, `scheduled_probe`, `anomaly_detected`, `manual`, `other`
  - *(legacy alias)* `boundary_close_sample` → `boundary_close`, `anomaly_boost` → `anomaly_detected`
- `noise_sigma`: float|null (perturbation일 때 권장)
- `pulse_duration_steps`: int|null (perturbation일 때 권장)
- `traj_record_steps`: int|null (perturbation일 때 권장; 이후 PROBE_RUN과 연결)
- `cooldown_steps`: int|null (권장; 연쇄 펄스 방지)
- `seed`: int|null
- (옵션) `pre_state_label`, `pre_route_tier`, `pre_zone`
- (옵션) `linked_probe_id`: str|null (연결되는 PROBE_RUN이 있으면; legacy `probe_id`도 허용)

**`PROBE_RUN_START/END.payload` (v0.1, 권장)**
- 공통:
  - `probe_id`: str (유니크)
  - `probe_suite_id`: str (예: `apci_v0`, `titration_l75_v0`, `policy_sensitivity_v0`, `invariance_v0`, `nrs_v0`, `wager_v0`)
  - `probe_kind`: str enum (`pci_a`, `nrs`, `wager`, `sync_estimate`, …)
  - `probe_config_hash`: str (스펙/파라미터 고정용)
  - `linked_pulse_id`: str|null (PCI-A일 때 권장)
- `PROBE_RUN_START` 추가:
  - `noise_sigma`: float|null
  - `pulse_duration_steps`: int|null
  - `traj_len_steps`: int|null
- `PROBE_RUN_END` 추가(PCI-A 권장 필드):
  - `compressed_bytes`: int
  - `compressor`: str (예: `gzip`)
  - `binarization`: str (예: `gt0`)
  - `pci_a_raw`: float (보통 `compressed_bytes` 그대로)
  - (옵션) `correct_flag`: bool|null
  - (옵션) `delta_pci_window`: float|null (window 집계가 이미 끝났으면)
  - (옵션) `nrs_delta`: float|null (No-Report Signature용)



(추가, 권장) **PROBE suite별 payload 확장 키**  *(스키마 확장 없음; payload에 추가 키를 넣는 규약)*

- `titration` (Noise titration / L75)
  - `operator_set_id`: string (예: `retrieval_contam_v1`)
  - `sigma_grid`: [float] 또는 `{p_grid:[...]}`
  - `probe_task_set_id`: string
  - `perf_metric_id`: string (예: `verify_pass_rate`, `task_success_rate`)
  - `baseline_perf`: float
  - `l75_sigma`: float|null
  - `perf_curve`: [{sigma:float, perf:float, cost_M?:float, tau?:float}] (요약)
  - `notes_hash`: string|null (상세 리포트/원문은 별도 저장소)

- `policy_sensitivity` (Policy lever perturbation)
  - `lever_set_id`: string (어떤 레버를 만졌는지)
  - `epsilon`: object (예: `{prior_clip:+0.05, jerk_cap:-0.1}`)
  - `baseline`: object (예: `{PolicyFlipRate:..., CSI_global:..., Q:..., M:...}`)
  - `perturbed`: object (동일 키)
  - `delta`: object (perturbed-baseline)
  - `sensitivity_score`: float|null (요약 스칼라가 필요하면)

- `invariance` (shuffle/대칭 안정성)
  - `tests`: [string] (예: `intervention_shuffle`, `sketchpad_shuffle`, `qp_symmetry`)
  - `shuffle_k`: int
  - `pass_rate`: float (0..1)
  - `distance_stats`: object|null (예: `{mean:..., p95:...}`)
  - `fail_examples_hashes`: [string] (원문은 별도 디버그 저장소)


- `abstractness_ar` (AR/추상성: decodability + CCGP + PS_repr)
  - `repr_source`: string (`zt_summary` | `backbone_pool`)
  - `repr_layer`: int|null (backbone_pool일 때)
  - `repr_pooling`: string|null (예: `mean`, `last_token`, `boundary_pool`)
  - `variables`: [{var_id, var_kind:`context_min|rule_state|outcome`, label_space:`binary|multiclass`, notes?}] (최소)
  - `decodability`: object (예: `{C_min:0.71, R:0.83, O:0.62}`; metric는 score로 통일)
  - `ccgp`: object (예: `{R:0.68, O:0.55}`; 조건 조합 홀드아웃)
  - `ps_repr`: object (예: `{format_shuffle:0.12, inference_toggle:0.34}`; Δdistance/Δscore 등)
  - `delta_pairs`: [{name, baseline_tag, perturbed_tag}]|null (해석 단위를 명시)

- `axis_bank` (Latent Axis Bank(LAB) / Axis Bank 스냅샷·검증)
  - `axis_bank_id`: string (예: `lab_v0`)
  - `axis_bank_version`: string (예: `lab_v0.3.2`)
  - `axis_ids`: [string] (예: `tau_hat`, `Q_hat`, `M_hat`, `AR_R_axis`)
  - `promotion`: object|null (예: `{promote:[...], retire:[...], freeze:[...]}`)
  - `drift_stats`: object|null (예: `{mean:..., p95:..., fail_rate:...}`)

- `format_convergence` (instruction-only 형식 수렴: 프롬프트/스키마 레버 계측)
  - `contract_id`: string|null (프롬프트 계약 버전)
  - `schema_id`: string|null (출력 스키마 버전)
  - `valid_rate`: float|null (형식 검증 통과율)
  - `invalid_reasons_topk`: [{reason:string, n:int}]|null
  - `delta_vs_baseline`: object|null (예: `{valid_rate:+0.12, latency_ms:+30}`)


- `digital_twin` (macro_state 거시 추적; 보통 JML_ENTRY/STATE_SNAPSHOT에 기록)
  - `macro_state_id`: string
  - `macro_state_version`: string
  - `macro_state_confidence`: float|null
  - `risk_score`: float|null
  - `next_state_topk`: [{state_id:string, p:float}]|null
> 규칙: PROBE 결과는 Evidence가 아니라 Control/진단 로그다. Evidence Contract 경로를 침범하지 않는다.

##### (NEW) Koopman Invariants(KJEPA) 확장 (macro_state_method="koopman_jepa_v0"일 때)

> 목적: SSM-lite의 `macro_state_id`를 **무감독으로 레짐(다이나믹 모드) 기준으로 안정 분해**하고, “왜 클러스터가 생겼는지”를 최소한의 지표로 감시한다.

**DigitalTwin 확장 필드(모두 optional)**
- `digital_twin.koopman.model_id`: string|null (학습 아티팩트 ID/해시)
- `digital_twin.koopman.delta`: number|null (예측 간격 Δ)
- `digital_twin.koopman.latent_dim`: integer|null (k)
- `digital_twin.koopman.identity_penalty`: number|null (`||M-I||` 또는 λ 포함)
- `digital_twin.koopman.spectral_radius`: number|null (ρ(M))
- `digital_twin.koopman.invariance_score`: Float01|null (레짐 내 안정성)
- `digital_twin.koopman.separation_score`: Float01|null (레짐 간 분리)
- `digital_twin.koopman.entanglement_score`: Float01|null (축 혼합/회전 정도; 낮을수록 해석 용이)
- `digital_twin.koopman.embedding_ref`: string|null (디버그/분석용 임베딩 포인터)

**권장 이벤트/로깅**
- 학습 런: `FINETUNE_RUN_START/END` 재사용
  - `method="koopman_jepa_v0"`
  - `eval_suite_id="koopman_invariants_v0"`
- 진단: `PROBE_RUN_START/END`
  - `probe_suite_id="koopman_invariants_v0"`
  - `probe_kind="invariance|separation|identity|entanglement"`

**경고(운영)**
- `M≈I` 유도가 없으면, 레짐 indicator가 선형 혼합된 해도 손실이 같아서(=얽힘) 클러스터 해석이 흔들릴 수 있다.
  - 그래서 `identity_penalty`와 `spectral_radius`는 “있으면 좋은”이 아니라 거의 필수 감시 항목이다.


### 12.3 Evidence Contract

### Evidence Contract (정식)

> 정식 스키마: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/evidence.schema.yaml`  
> Canonical 의미론: `SSOT_CANONICAL.md` §6-§7

필수 필드(요약):
- `evidence_id` (UUID)
- `source_type`: {tool_run, file, web, human_note, system_log, model_inference}
  - 레거시 입력: `model_internal`은 허용하되 저장 시 `model_inference`로 정규화
- `provenance`: {tool_name, tool_run_id, file_path, url, human_note_id, model_name, model_version}
- `immutable_hash`: 내용 해시(또는 tool_run 결과 해시)
- `evidence_key`: hash(immutable_hash + source_type + provenance + event_time + observed_time)  *(권장)*
- **3중 시간(필수)**: `event_time`, `observed_time`, `recorded_time`
- `event_time_status`: {MEASURED | PARSED | ASSUMED_OBSERVED | UNKNOWN}
- `reliability` (0..1)
- `access_policy` (민감정보/외부 공유 여부, optional)

레거시 필드:
- `created_at`는 `recorded_time`의 레거시 별칭으로만 허용(저장 시 정규화).
- `created_by`는 `provenance.actor`로 흡수(또는 payload.legacy_created_by에 보관).

운영 규칙:
- `event_time`을 모르면 `null`로 두고 `event_time_status=UNKNOWN`을 기록한다.
- `event_time_status`가 `UNKNOWN` 또는 `ASSUMED_OBSERVED`인 경우 `reliability` 상한을 적용한다(예: ≤0.7).


### 12.4 (NEW) 파생 분석 스토어(옵션 A) 계약: Parquet(events_flat/signals) + DuckDB

이 절은 Raw Event Log/JML/Evidence를 “바꾸는” 게 아니라, **그 위에 얹는 파생(denormalized) 분석 스토어**의 최소 계약이다.

#### 12.4.1 역할/금지 규칙(필수)
- 파생 분석 스토어는 **권위 저장소가 아니다**.
  - Evidence/Claim는 기존 Registry/Claim store를 따른다.
- 금지:
  - (i) 파생 집계/점수로 Evidence/Claim 생성 또는 수정(승격) 금지
  - (ii) 파생 스토어만 남기고 원본 로그를 삭제한 뒤 “근거”라고 주장 금지
- 필수:
  - (i) 원본으로의 되돌림 가능성: `source_event_id`/원문 경로/해시 포인터 유지
  - (ii) 3중 시간 의미론 유지: `event_time`, `observed_time`, `recorded_time`

#### 12.4.2 Dataset 1: events_flat (이벤트 1건=행 1개)
**목적**: JSON payload를 그대로 보존하면서, 자주 쓰는 키만 “추출 컬럼”으로 꺼내 쿼리를 빠르게 한다.

- 필수 컬럼
  - `event_id`, `event_type`, `episode_id`, `trace_id`
  - `event_time`, `observed_time`, `recorded_time`, `event_time_status`
  - `actor`
  - `payload_json` (원문 payload를 문자열로 보존)
- 권장 추출 컬럼(충돌 없이 ‘보조 인덱스’로만 사용)
  - 라우팅/상태: `state_label`, `zone`, `phase`, `route_tier`
  - 자원/비용: `Cost_model_load_ms`, `Cost_vram_peak_mb`, `Cost_cpu_ram_peak_mb`, `Cost_kv_cache_peak_mb`, `Cost_oom_count`
  - 워크로드 보정: `WL_profile_id`, `WL_context_len`, `WL_kv_cache_mode`, `WL_gpu_offload_mode`, `WL_max_gpu_jobs`
  - Sidecar/QP: `tau_hat`, `Q_hat`, `M_hat`, `Q_over_M`, `axis_bank_id`(있으면)
  - SSM-lite: `macro_state_id`, `macro_state_version`, `macro_state_confidence`, `macro_state_method`, `macro_obs_schema_id`, `macro_obs_hash`, `centroid_hash`(있으면)

- Representation/AR: `AR_dec_Cmin`, `AR_dec_R`, `AR_dec_O`, `AR_ccgp_R`, `AR_ccgp_O`, `PS_repr_format`, `PS_repr_inference`
- Format 수렴: `FMT_valid_rate`, `FMT_invalid_rate`, `FMT_schema_mismatch_rate`
- Axis Bank: `LAB_axis_count`, `LAB_drift_p95`, `LAB_fail_rate`

> 주의: 추출 컬럼은 “진실”이 아니라 **캐시**다. 충돌/결측이 있으면 항상 `payload_json`을 우선한다.

#### 12.4.3 Dataset 2: signals (시계열 포인트 롱 포맷)
**목적**: 대시보드/상관/지연 분석/회귀 테스트를 위해, 핵심 축을 공통 인터페이스(`axis`, `value`)로 통일한다.

- 필수 컬럼
  - 시간: `observed_time` (필수), `recorded_time` (권장), `event_time` (옵션)
  - 식별: `episode_id`, `trace_id`(옵션), `source_event_id`, `source_event_type`
  - 값: `axis`(문자열 키), `value`(number), `unit`(문자열 또는 null)
- 권장 컬럼
  - `scope`: {`state_snapshot`|`score_report`|`probe`|`policy`|`tool_call`|`module_call`|`other`}
  - `tags`: low-cardinality object(예: `zone`, `phase`, `route_tier`, `macro_state_id`, `profile_id`)

카디널리티 폭발(라벨 지옥) 방지 규칙:
- `tags`는 **low-cardinality**만 허용(episode_id/trace_id 같은 고카디널리티는 컬럼으로 두고, tags에는 넣지 않는다)



#### 12.4.3a (옵션) Dataset 3: macro_state_catalog (해석/회귀용 카탈로그)

**목적**: `macro_state_version`마다 “무슨 모델/무슨 centroid/무슨 대표 사례”였는지를 한 파일로 고정해, 회귀/디버깅을 싸게 만든다.

- 권장 컬럼(예시)
  - `macro_state_version`, `macro_state_method`, `macro_state_method_params_hash`, `centroid_hash`, `macro_obs_schema_id`
  - `K`(클러스터 수), `fit_window_n`(학습에 사용한 boundary 수)
  - `prototypes_topk_json` (각 state별 대표 episode 포인터)
  - `created_time`, `notes`

규칙:
- 이 파일은 **권위 저장소가 아니라 카탈로그**다.
- `prototypes_topk`는 포인터(episode_id/trace_id)만. 원본 payload는 원본 로그에서 본다.

#### 12.4.4 signals 축 표준(권장 최소)
최소한 아래 축은 signals로 뽑아라. (안 그러면 “로그는 있는데 해석이 안 되는” 상태가 반복된다.)

- Cost 축: `Cost_*` 전부(특히 VRAM/RAM/OOM/latency)
- Workload 보정: `WL_*` 중 profile/context/KV/offload 계열
- Sidecar 핵심: `tau_hat`, `Q_hat`, `M_hat`, `Q_over_M`
- 안정성: `CSI_phase`, `CSI_global`, `PolicyFlipRate`(가능하면)
- Compressibility: `Comp_token_lz`, `Comp_policy_lz`, `Comp_et_lz` + (옵션) `CompCurve_C_glasso`, `CompCurve_f_at_S50`
- EES: `EES_level`, `EES_FA`, `EES_miss`(가능하면)
- SSM-lite: `macro_state_id`(이건 값이 범주라 events_flat에 둬도 됨), `risk_score`, `closure_score`, `residual_ratio` (계산 가능하면)

#### 12.4.5 스키마 참조(정식)
스키마 번들(배포 산출물) 기준:
- `SSOT_SCHEMA_BUNDLE.zip ▸ schema/analysis_event_flat.schema.yaml`
- `SSOT_SCHEMA_BUNDLE.zip ▸ schema/analysis_signal.schema.yaml`

이 두 스키마는 “원본 로그 스키마를 대체”하지 않는다.
- 원본: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml`, `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jml_entry.schema.yaml`, `SSOT_SCHEMA_BUNDLE.zip ▸ schema/evidence.schema.yaml`
- 파생: 위 `analysis_*` 스키마

#### 12.4.6 (NEW) DuckDB 레퍼런스 뷰: JIT covariates + SCORE_REPORT enrich (권장)
#### 12.4.7 (NEW) DuckDB 레퍼런스 뷰: NetArch covariates (권장)

- 제공 파일: `SSOT_SCHEMA_BUNDLE.zip ▸ tools/ANALYSIS_STORE_DUCKDB_VIEWS_NETARCH.sql`
- 목적:
  - Raw Event Log → `events_flat` → DuckDB view로 `WL_netarch_*`를 자동 집계해서
    `SCORE_REPORT` 주입(또는 enriched view로 조회)하는 “레퍼런스 파이프”를 제공한다.
- 입력 이벤트:
  - `MODE_SWITCH`, `BRIDGE_CALL`, `GRAPH_MAINTENANCE`
- 결과(권장 최소):
  - `WL_netarch_mode_switch_count`, `WL_netarch_bridge_calls`, `WL_netarch_bridge_hit_rate`, `WL_netarch_maintenance_runs`


> 목적: `WL_jit_*`를 “수기로” 채우지 말고, Raw Event Log → `events_flat` → **DuckDB view**로 자동 집계해서
> `SCORE_REPORT`에 주입(또는 enriched view로 조회)한다.

- 제공 파일: `SSOT_SCHEMA_BUNDLE.zip ▸ tools/ANALYSIS_STORE_DUCKDB_VIEWS_JIT.sql`

- 입력 가정:
  - `events_flat` 테이블(또는 동일 스키마의 parquet view)이 존재한다.
  - `events_flat.payload_json`에 원문 payload(JSON 문자열)가 들어있다.
- 뷰 구성(핵심 4개)
  1) `v_jit_events` — `JIT_CONSTRUAL_*`만 뽑아서 `jit_cycle_id`, `seed_n/added_n/removed_n/needs_n/sim_level`을 추출
  2) `v_jit_cycle_timeline` — window(cumsum)로 `active_set_n_t`를 재구성
  3) `v_episode_jit_covariates` — episode 단위 `WL_jit_*` 집계
  4) `v_score_report_enriched` — `SCORE_REPORT` 이벤트에 `WL_jit_*`를 left join 해서 조회

- 운영 예시(권장)
  - DuckDB에서 1회 로드:
    - `duckdb analysis.duckdb < (extract) ANALYSIS_STORE_DUCKDB_VIEWS_JIT.sql  # from SSOT_SCHEMA_BUNDLE.zip ▸ tools/`
  - 조회:
    - `select * from v_episode_jit_covariates limit 20;`
    - `select episode_id, WL_jit_cycle_count, WL_jit_active_set_max from v_score_report_enriched limit 20;`

- (권장) 파케이 평탄화 규칙: JIT 추출 컬럼(있으면 편하다)
  - `jit_cycle_id`, `jit_step_id`, `jit_sim_level`, `jit_needs_n`, `jit_added_n`, `jit_removed_n`
  - 하지만 “추출 컬럼은 캐시”다. 충돌/결측은 항상 `payload_json` 우선.

> 주의: 이 view/집계는 **권위(Authority)를 만들지 않는다**. Evidence/Claim/stop-rule은 원본 계약을 따른다.

## 13. State→Policy Map v0: Responder 기반 예산/규율 라우팅

> 목적: 측정(NEI/CDI/A-PCI)을 **정책 레버**로 연결한다.  
> 원칙: (1) 단순한 룰 기반 v0 → (2) Self-Graph 데이터로 점진적 학습.

### 13.1 입력(상태)

#### 13.1.0 Executive Core overlays (권장)
- `drive_state`(optional): `drive{curiosity,mastery,relatedness}` + `beta{intrinsic,extrinsic}`
- `user_model`(optional): `affect`(stressed 등) / `inferred_goals` 요약



- `p_r`: responder 확률(개입이 ΔPerf와 ΔA-PCI를 함께 올릴 가능성)
- `p_u`: unstable 확률(과흥분/진동/오염 위험)
- `zone`: {subcritical, near_critical, supercritical}
- (추가) `EES`(optional): 조기 오류 신호. `p_u` 및 phase(VERIFY) 판정에 직접 투입 가능
- (추가) `ModuleSynchronyIndex`/`LoopMaintenanceIndex`(optional): 협응/유지 지표. `p_u` 및 budget 배분(검증/리트리벌 강화) 트리거로 사용
  - 예: m̂ 낮고 diversity 낮으면 subcritical
  - m̂ 높고 revision/contradiction 급증하면 supercritical
- (추가) `AvalancheIndex`(optional): burst/avalanche 요약. `p_u` 상승 및 `zone=supercritical` 판정에 직접 반영 가능(§11.3).
- (추가) `resource_state`(optional): 누적 자원 압력(슬로우 변수). `WL` 보정 및 budget 다운시프트 트리거.
- `WL`: workload covariates (난이도/툴 의존도)

- `NEI_SS` (옵션: NEI-SS 사용 시)
  - `sigma_flow_w`: 최근 윈도우 σ_flow 집계(평균/적분)
  - `sigma_int_w`: shuffle-subtracted 결합 기여(가능할 때만)
  - `sigma_per_act_w`: 활동량 대비 방향성(효율)
  - `J_var_topk`: top-k directed coupling 변동성(불안정/진동 힌트)


#### 13.1.1 `state_label` (zone × phase)

- 정의: `state_label := (zone, phase)`
  - `zone ∈ {subcritical, near_critical, supercritical}` (기존)
  - `phase ∈ {ACQUIRE, VERIFY, COMMIT, CONSOLIDATE}` (신규)

`phase` 판정 규칙(v0, 결정론적 권장. 단발값 금지, 윈도우/EMA 기반):
- **ACQUIRE**: 정보 부족/불확실성 우세. (`PE_goal`↑ 또는 `PE_tool`/`PE_memory`가 중간 이상 + retrieval 가치가 큰 상태)
- **VERIFY**: 근거 충돌/자기모순/재작성 급증. (`PE_memory`↑, `ContradictionRate`↑, `RevisionRate`↑)
  - (추가) `EES > θ_high` 이면 VERIFY를 우선(조기 오류 예측). 단, cooldown/hysteresis로 진동 방지
  - (추가) `commit_fail_hat > θ_lps`(LPS)면 VERIFY를 보조적으로 우선(단, cooldown/hysteresis 유지)
- **COMMIT**: stop-rule 근접/도달 또는 마감/종료 신호 우세. (EVC 여지 낮음, 예산 소진, 사용자 응답 확정)
- **CONSOLIDATE**: boundary 직후(episode close) + write 후보 존재. (증거 연결 완료된 Claim Packet을 JML/Graph로 정리)

표기 예: `near_critical:ACQUIRE`, `supercritical:VERIFY`

### 13.2 출력(정책 레버)

- (추가) `beta_intrinsic` / `beta_extrinsic` (DriveState에서 유래, 0..1): 탐색(자기주도)↔집중(외부 목표) 트레이드오프를 정책 레버로 노출한다.
  - jerk cap/hysteresis를 반드시 적용(§13.4).

- (옵션, LPS) `lps_enable`: bool (기본 false 권장. 캘리브레이션/드리프트 모니터링이 갖춰질 때만 on)
- (옵션, LPS) `lps_weight`: number (0..1; Gate 후보 점수에 가산/감산하는 프라이어 가중치. 매우 작게 시작)
- (옵션, LPS) `lps_jerk_cap`: number (0..1; 한 step에서 LPS가 바뀔 수 있는 최대 변화량)
- (옵션, LPS) `lps_cooldown_min_steps`: integer (진동 방지용 최소 쿨다운)
- (옵션, LPS) `lps_feature_version`: string (feature 스펙 버전. 로그/학습/배포 정합성 키)

- (옵션, G2A) `g2a_enable`: bool (기본 false 권장)
- (옵션, G2A) `gain_g2a`: number (prior-only 가중치; 매우 작게 시작)
- (옵션, G2A) `prior_clip_g2a`: number (clip)
- (옵션, G2A) `g2a_jerk_cap`: number (jerk-limit)
- (옵션, G2A) `g2a_cooldown_steps`: integer
- (옵션, ORAV) `orav_enable`: bool
- (옵션, ORAV) `orav_theta_low`: number (g2a 임계)
- (옵션, ORAV) `orav_cooldown_steps`: integer





- `verifier_budget` (0..N)
- `retrieval_budget` (0..N; 또는 `retrieval_depth_k`로 대체 가능)
- `retrieval_depth_k`, `retrieval_threshold_tau`
- `branching_cap` (가설 분기 상한)
- `intervention_topk` (개입 후보 Top-K)
- `intervention_policy_delta_cap` (개입 레버 Δ 클리핑 상한)
- `intervention_cooldown_steps_default`
- `tool_call_cooldown_ms`
- `workspace_token_cap`
- `memory_write_rate` / `memory_write_gate`(on/off)
- `evidence_strictness` (근거 필수 강도)
- `probe_frequency` (A-PCI 측정 빈도)
- `pulse_policy` (펄스 트리거 민감도/쿨다운)
- `self_reflect_budget` / `self_reflect_token_cap` / `self_reflect_round_cap` / `self_reflect_cooldown_steps` (self-reflection 예산/쿨다운)

### 13.3 룰 기반 맵(v0)

#### (A) subcritical (과소전파: 업데이트가 이어지지 않음)
- 조건 예: `zone=subcritical` 또는 `(m̂↓, diversity↓, p_u 낮음)`
- 정책:
  - `branching_cap` ↑ (하지만 하드 캡 유지)
  - `retrieval_depth_k` ↑, `retrieval_threshold_tau` ↓ (정보획득 강화)

  - (옵션) `self_graph_update_mode` = `apply` 또는 `shadow`(초기엔 shadow 권장), `self_graph_update_cap` 소량 ↑ (구조를 천천히 붙이기)
  - `verifier_budget` = 중간(“검증 과잉”으로 더 죽지 않게)
  - `probe_frequency` = 낮음(먼저 살아나게), 단 p_r 불확실하면 1회 캘리브레이션
  - `memory_write_gate` = 선택적(근거가 있을 때만)
  - (옵션) `sigma_per_act_w`가 낮게 고착되면: `retrieval_depth_k`/`branching_cap`을 소폭 ↑ ("방향성 있는 전개"가 안 붙는 상태 가정)

#### (B) near_critical (정상: 균형 구간)
- 조건 예: `zone=near_critical` & `p_u 낮음`
- 정책:
  - 기본값 유지 + 소폭 적응
  - `probe_frequency` = 중간(주기적 캘리브레이션)
  - `evidence_strictness` = 기본(Claim Packet 규율 유지)

#### (C) supercritical (과잉분기/폭주: 불안정)
- 조건 예: `zone=supercritical` 또는 `(revision↑, contradiction↑, p_u↑)`
- 정책:
  - `branching_cap` ↓, `workspace_token_cap` ↓
  - `verifier_budget` ↑ (내부 일관성 먼저)
  - `tool_call_cooldown_ms` ↑ (툴 폭주 방지)
  - `retrieval_threshold_tau` ↑ (잡음 회수 억제)
  - `evidence_strictness` ↑ (근거 없는 확장 금지)

  - (옵션) `self_graph_update_mode` = `shadow`(안정화 전 실반영 금지), `self_graph_update_cap` ↓, `self_graph_update_cooldown_episodes` ↑

  - (옵션) `sigma_int_w` 또는 `J_var_topk` 급등 시: `min dwell time` ↑ + `branching_cap` 추가 하향(진동/루프 억제)
  - (옵션) `sigma_int_per_act_w`↑ & 최근 `ΔPerf` 정체(대시보드 기준)면: tool/retrieval을 더 조이고 verifier로 수렴(“비가역성은 큰데 생산성이 없는” 상태)
  - `probe_frequency` = 낮음(프로브가 폭주를 더 키울 수 있음), 안정화 후 재개
  - `memory_write_gate` = 보수적(오염 방지)

#### (D) Phase bias overlay (zone 룰 위에 덧씌우는 국면 편향)
- (추가) `beta` overlay: `beta_intrinsic`가 높을수록 `retrieval_budget`/`branching_cap`을 약간 올리고, 낮을수록 `verifier_budget`/`commit_bias`를 올린다.
  - 단, `zone=supercritical`에서는 beta와 무관하게 폭주 억제가 우선이다.

> 원칙: 13.3 (A/B/C)의 zone 룰을 기본으로 하고, 아래 편향을 **추가 적용**한다.

- **ACQUIRE**: `retrieval_depth_k` ↑, `retrieval_threshold_tau` ↓, `probe_frequency` = 낮음~중간(캘리브레이션 1회)
- **VERIFY**: `verifier_budget` ↑, `retrieval_threshold_tau` ↑(잡음 억제), `branching_cap` ↓, `evidence_strictness` ↑
- **COMMIT**: `tool_call_cooldown_ms` ↑, `branching_cap` ↓, `workspace_token_cap` ↓ (결론 확정 및 종료 유도)
- **CONSOLIDATE**: `memory_write_gate` = 허용(단, Evidence 연결 필수), `probe_frequency` ↓ (정리 중 측정 과잉 방지)
  - (옵션) `self_graph_update_mode` = `apply` (단, shadow→apply 승격은 Suite/홀드아웃에서만)
- (추가) **Self-Reflection bias** (권장, SRP 연동)
  - `VERIFY`에서만 제한적으로 허용(근거 충돌/목표 이탈을 빠르게 드러내는 용도)
    - 기본 프로토콜: `srp_strange_loop` (Canonical §5.6.1)
    - 어블레이션/회귀용 컨트롤: `srp_control_history` / `srp_control_third_person`
  - `COMMIT`에서는 원칙적으로 비활성(결론 확정 단계에서의 자기말 늘어짐 방지)
  - `supercritical`에서는 쿨다운/상한을 강하게(§13.3 (C) 참조)
  - `five_adjectives` 출력은 계측용으로만 켜고(`self_reflect_output_format=both|five_adjectives`), 토큰 cap을 침범하면 `reflection_segment` 우선

### 13.4 히스테리시스/쿨다운(정책 진동 억제)

- 모든 레버는 **EMA + 최소 유지 시간(min dwell time)** 적용
- `PULSE_TRIGGER` 후에는 일정 시간 `cooldown` 부여(연쇄 펄스 방지)
- `zone` 판정은 단발 지표가 아니라 **윈도우 평균**으로 결정
- (옵션) `sigma_*` 계열도 동일하게 윈도우/EMA로만 트리거(단발 스파이크로 정책 발작 금지)
- `state_label` 변경에도 **min dwell time**을 적용한다(단발 스파이크로 국면 전환 금지).
- `state_label`이 짧은 주기로 왕복하면(=국면 진동): `tool_call_cooldown_ms` ↑, `branching_cap` ↓, `evidence_strictness` ↑로 자동 보수화한다.

### 13.5 개입 라이브러리(Intervention Library) 최소 분류

> 정식 스펙/필드/가드레일은 **Intervention/Policy Layer Spec** 문서를 단일 진실로 한다.
> 본 절은 “개념적 분류 + 운영 요령”만 제공하며, 구현/검증 기준은 Canonical Spec과 Logging Contract(§12)를 우선한다.



- **Param-only**: 위 레버 조정(가장 안전, 가장 싸다)
- **Policy**: 라우터/검증 규칙 변경(중간 위험)
- **Structural**: 모듈 추가/삭제, 메모리 인덱스 변경, **Self-Graph Influence 레이어 재배선(HAG 적용/파라미터 변경 포함)** (고위험, 반드시 A-PCI/홀드아웃 검증)
- **Learning**: 짧은 튜닝/RL(비용 큼, responder 확률이 높을 때만)

Self-Graph 검색 규칙(v0):
1) 현재 상태(NEI/CDI/zone/WL)와 유사한 과거 상태 top-k 검색  
2) 그때 효과가 좋았던 개입을 후보로 올림  
3) 파레토(ΔPerf↑, ΔStab↑, ΔCost↓, ΔA-PCI↑) 기준으로 선택  
4) 결과를 다시 기록(학습)

---

### 변경 로그
- 2026-02-04 r20.1p4p8: JIT Construal Loop 이벤트(`JIT_CONSTRUAL_*`) 포인터 + WL_jit_* covariates 추가
- 2026-01-24 r19: Curation=조성(실패유형 타겟) 로깅 키 추가 + head-tune 로깅(trainable_component/backbone_frozen) + eff_dim_hat 및 stochastic_raw/effective 계약 + SKETCHPAD_UPDATE payload(SD VAE latent 포함)
- 2026-01-21 r16: MUSE-lite metacog 이벤트/메트릭 계약 추가(+스키마 확장)
- 2026-01-21(r15): Artifact Self-Tuning(자기진화) 이벤트 계약(`ARTIFACT_TUNE_*`)과 PACEvolve/Agent0 기반 건강 지표(ContextPollution/ModeCollapse/ambiguity hold)를 추가.
- 2026-01-21(r15p1): Iterative Deployment 루프 문서화(TraceCapsule→Dataset→ArtifactTune/Finetune) + Logging/Schema 이벤트 확장(DATASET_BUILD_*, FINETUNE_RUN_*).
- 2026-01-13(r7): SketchPad(저해상도 시각 스케치/latent) 계측 추가: WL covariates + 안정성 지표 + 이벤트 타입
- 2026-01-09(r2): 2409.16394v5(메모리→LRO) 번역 반영: Avalanche/Burst 지표(§11.3) + 자원 동역학 covariates(§11.5) + State→Policy Map 입력 오버레이(§13.1.0) 추가. 모두 `metrics_optional/wl_covariates`에 수용하여 스키마 확장 없이 적용.

### 13.6 Phase-conditioned EES Calibration (예측 오류 채널로서의 EES)

**핵심 요지**  
EES는 “외부 정답/피드백이 도착하기 전에 올라오는 *예측 오류 코딩*”으로 취급한다.  
따라서 EES는 **전역 단일 임계값**이 아니라, `phase`(ACQUIRE/VERIFY/COMMIT/CONSOLIDATE) 별로 **발생률·거짓 경보율·리드타임**이 달라야 정상이다.

#### 13.6.1 로깅 추가 필드
- `EES_event` (bool)  
- `EES_level` (float) : 스냅샷의 `state_core.ees_w`와 동일값(중복 기록은 허용, 표준화 목적)  
- `EES_phase` ∈ {ACQUIRE, VERIFY, COMMIT, CONSOLIDATE}  
- `EES_trigger_context` (hash/short) : 직전 `StateLabel`, 최근 `PolicyLever` top-k, 최근 `TRL Router` route
- `EES_lead_time_ms` (float, ms) : EES 발생 → “검증된 오류/모순” 확인까지의 예상 지연(early warning 품질)
- `EES_lead_time_steps` (int, optional) : step 기준 지연(스텝 기반 loop에서만)
- `EES_resolution_action` : 대응 action class (slowdown/retrieve/ask_user/self_check/rollback 등)

#### 13.6.2 국면별 기준선(baseline) 추정
각 phase마다 아래를 추정하고 버전 관리한다.
- `EES_rate_phase` : 단위 시간/턴당 event rate
- `EES_FA_phase` : false alarm rate (사후에 “실제 오류”가 확인되지 않은 이벤트 비율)
- `EES_precision_phase`, `EES_recall_phase` : 아래 A/B 실험 기반

**A/B 실험(가벼운 버전)**  
- A: EES 발생 시 *정책대로* 개입  
- B: EES 발생 시 *개입 최소화(로그만)*  
두 조건에서 “사후 오류(contradiction / hallucination / tool-failure / user-reject) 발생률” 차이를 기록한다.

> 포인트: “EES가 있었을 때 개입이 유효했는가”를 수치로 만든다.  
> 컨셉이 아니라 운영 지표다.

#### 13.6.3 phase별 임계값/히스테리시스
권장 구조:
- `τ_stop_phase` : 강제 정지/rollback
- `τ_slow_phase` : 속도 저하 + self-check
- `τ_route_phase` : TRL Router 재라우팅(VERIFY 강화 or ACQUIRE 강화)
- `τ_clear_phase` : EES 해제 (hysteresis)

**원칙**  
- ACQUIRE에서는 EES가 비교적 자주 떠도 됨(탐색 비용). 대신 `FA`가 과도하면 **검색/툴 과잉**으로 이어짐.  
- COMMIT/CONSOLIDATE에서는 EES가 드물어야 하며, 떠버리면 더 강하게 처리해야 함(출력 안정성).

---

#### 13.6.4 Bias-sensitivity check (DriveState/GoalStack ↔ EES 상관)

목표 framing(DriveState/GoalStack)이 달라질 때 EES가 과하게 흔들리면, 시스템이 “목표 편향”에 의해
거짓 경보(FA) 또는 미스(Miss)를 내는 구간이 생긴다. 이건 온라인에서 즉흥적으로 고치지 말고,
**오프라인 점검 + 임계값/대응 강도 테이블 조정**으로 다룬다.

**점검 설계(권장 최소)**  
- 동일 task를 서로 다른 framing 조건(`framing_id` 또는 `goal_profile_id`)으로 실행(최소 2개 조건)
- 각 조건에서 phase 분포가 너무 치우치지 않게(가능하면) 균형을 맞춘다.

**기록 필드(권장)**  
- 조건 식별:
  - `framing_id` (또는 `goal_profile_id`)
  - (옵션) `goal_text_hash`, `drive_profile_hash`
- 바이어스 변화량:
  - `delta_drive_l2` (float) 또는 `delta_beta_l2` (float)
  - (옵션) `delta_goal_stack_hash` (string)
- EES 품질(가능하면 phase별):
  - `EES_rate_phase`, `EES_FA_phase`, `EES_precision_phase`, `EES_recall_phase`
  - 최소 대체: `EES_rate`, `EES_FA`, `EES_Miss`
- 결과 요약(권장):
  - `BiasEES_corr` (float; framing 조건/drive 변화량 ↔ EES_FA 또는 EES_Miss 상관)
  - `BiasEES_suspect_phase[]` (상관이 높은 phase 목록)

**로깅 위치(권장)**  
- per-run: `SCORE_REPORT.payload.metrics` 또는 동등 summary 이벤트에 저장  
  - 예: `SCORE_REPORT.payload.metrics.BiasEES_corr`, `BiasEES_suspect_phase`  
- 원시 근거:
  - `DRIVE_STATE_UPDATE`, `GOAL_SET`(또는 동등) + `EES_SIGNAL`/`STATE_SNAPSHOT.payload.state_core.ees_w`로 재구성 가능해야 함

**운영 원칙**  
- Bias-sensitivity 결과는 **평가/회귀 게이트**와 offline-config 조정에만 사용한다.
- 온라인 자동 업데이트/학습으로 바로 연결하지 않는다.


### 13.7 Stability-under-Perturbation (루프 안정성 / 참여도 기반)

논문에서 “기능 클러스터가 영역을 넘어 분산되며, 국면별 네트워크가 재구성된다”는 말은,  
우리로 치면 “정책/라우팅이 특정 시드·미세 변형에 과하게 민감하면 시스템이 루프를 못 잡는다”는 뜻이다.

#### 13.7.1 Coalition Stability Index (CSI)
동일 과업을 `N`회 반복(서로 다른 seed/temperature + 미세 프롬프트 동등 변형)했을 때,
- `PolicyLever` 활성 패턴
- `StateLabel` 시퀀스
- `Router route` 시퀀스

의 **Jaccard/Levenshtein 기반 유사도**를 계산해 안정성 점수로 저장한다.

**로깅 위치(권장)**
- per-run: `SCORE_REPORT.payload.metrics.CSI_phase`, `SCORE_REPORT.payload.metrics.CSI_global` (또는 동등한 summary 이벤트)
- 원시 시퀀스: `TRACE_CAPSULE_COMMIT/TRACE_CAPSULE_REUSE` 또는 `STATE_SNAPSHOT.payload.state_core.route_last`/`STATE_SNAPSHOT.payload.state_core.policy_levers`/`STATE_SNAPSHOT.payload.state_core.state_label` 를 통해 재구성 가능해야 함

**유사도 산식(간이 권장)**
- 시퀀스 길이가 다를 수 있으므로, (a) n-gram set Jaccard + (b) 정규화 편집거리(1 - edit/len) 를 가중합해서 `CSI`를 만든다.
- 완전한 정답 공식은 없고, 중요한 건 *버전 고정* + *추세 모니터링*이다.



**순서 교란(셔플) 포함(권장, r6)**
- 목표: “원소가 비슷해서 비슷해 보이는 것”과 “순서까지 안정적인 것”을 분리한다.
- 추가 산출(권장, per-suite):
  - `CSI_seq`: order-aware 유사도(n-gram Jaccard + 정규화 edit)
  - `CSI_set`: order-ignorant set Jaccard(해석 보조)
  - `CSI_shuffle_null_mean`, `CSI_shuffle_null_std`: 각 시퀀스를 `M`회 랜덤 셔플한 뒤 `CSI_seq`를 계산한 null(권장 `M=16`)
  - `CSI_order_gain = CSI_seq - CSI_shuffle_null_mean`
- 저장 위치(권장): `SCORE_REPORT.payload.stab_raw.CSI_*` (또는 동등한 summary 이벤트)
- 운영 규칙: `CSI_phase/CSI_global`은 기본적으로 `CSI_seq` 기반으로 산출한다.

- `CSI_phase` : phase별 안정성
- `CSI_global` : 전체 안정성

**해석**  
- CSI가 낮으면: “겉으로는 답이 맞아도” 내부 경로가 출렁거리는 상태.  
- 이런 상태는 장기적으로 회복성/일관성/재현성을 망가뜨린다.

#### 13.7.2 Participation-style metric (간이 버전)
각 실험 반복에서 “실제로 동원된 상위-k action class(lever) / module call” 빈도를 집계하고,
반복 간 분산을 기록한다.
- `Participation_var` : 낮을수록 “일관된 루프/경로”를 사용한다는 뜻.

---

## 4) 리스크/호환성 체크

- 이 패치는 **정책(무엇을 해야 하는가)** 를 바꾸지 않는다.  
  “언제/왜 개입했는지”를 **phase별로 더 정확히 측정**하게 만든다.
- EES를 phase별로 분리하면, 네가 싫어하는 “과잉 개입”을 오히려 줄이는 방향으로 작동한다
  (ACQUIRE에서 탐색 허용, COMMIT에서 품질 수호).

---

## 5) 최소 구현 체크리스트
- [ ] EES 이벤트에 `phase` 태깅
- [ ] `EES_precision/recall` 추정용 A/B 로그 스위치
- [ ] CSI 계산용 반복 실행(최소 N=5) 스크립트
- [ ] 대시보드: `EES_rate_phase`, `EES_FA_phase`, `CSI_phase`

- 2026-01-03(r4): TRL Router 통합 로깅(ROUTE_ASSESSMENT/CONTEXT_FOLD 이벤트 타입 권장) + STATE_SNAPSHOT.payload.state_core.route_last 권장 필드 추가.
- 2026-01-03(r3): 파일 포인터/참조 정합성 정리(문서 간 r2/r3 혼재 제거).
- 2026-01-03: A-PCI(PCI-A proxy) 정의/ΔPCI 해석 추가(§11.7), PULSE_TRIGGER/PROBE_RUN payload 스펙 추가(§12), 파일명 포인터 정리.

- v2.2.2+7: `STATE_SNAPSHOT.payload.state_core.ees_w` dot-path를 명시하고 (옵션) `ees_last`/`ees_components_last`를 추가하여 Canonical/Playbook과 표기 일치.
- v2.2.2+5: Pathak et al.(Nat Commun 2025) BCP/ICN 이식 반영: `EES`/`ModuleSynchronyIndex`/`LoopMaintenanceIndex` 지표·스키마·이벤트 타입 확장 + State→Policy 맵에 입력 규칙 추가.
- v2.2.2: HAG 이벤트/지표/정책 레버(`self_graph_update_*`)를 추가하고 State→Policy 맵에 연결.
- v2.2.2+: CBS/PR(batched 후보 선택+리셋) 및 jerk-limited(Δ² 제한) 안정화 지표/이벤트(`PolicyJerkP95`, `SidecarJerkP95`, `CANDIDATE_*`, `POLICY_SMOOTHING_APPLIED`)를 추가.
- v2.2.2+: SRP(IQS/SCS/HAP) 지표 정의 + `SELF_REFLECT_START/END` payload 권장 필드(프로토콜/포맷/점수) 보강.
- v2.2.x: EOP(Expected Outcome Packet) + Self-Reflection(Inner Speech) 로그/정책 레버/루미네이션 안정성 지표를 추가.
- v1 문서에 아래 3개 보완 블록을 추가:
  - **Metric Spec Appendix (v0)**
  - **Logging Contract (v0)**
  - **State→Policy Map v0**
- v2.2: NEI(Asymmetry)에서 A 추정을 구체화(IGL v0)하고, top-prob 스타일 희소화/백본 보존/부호 제약(선택)을 추가. Self-Graph StateNode에 A_dense/A_sparse/ΔA 기록 항목을 보강.


##### B) eff_dim_hat + stochastic 정규화(탐색/노이즈/온도/perturb) 필드 (r19)

- **eff_dim_hat(유효 차원)**: 최근 윈도우에서 Axis Bank(또는 축 임베딩)의 분산 스펙트럼으로 계산한 participation ratio.
  - 권장: `d_eff = (Σλ)^2 / Σ(λ^2)` (λ는 공분산 고유값; clamp 적용)
- **기록 위치(단일화 권장)**  
  - `STATE_SNAPSHOT.payload.metrics_optional.control_axes.eff_dim_hat`  
  - `STATE_SNAPSHOT.payload.metrics_optional.control_axes.eff_dim_method` (예: `participation_ratio_v1`)  
  - (선택) `eff_dim_window_steps`, `eff_dim_axis_set_id`

- **stochastic_raw / stochastic_effective**  
  - 목적: “보정 전/후”를 동시에 남겨, 디버깅/롤백/어블레이션을 가능하게 한다.
  - 권장 위치(단일화): `STATE_SNAPSHOT.payload.metrics_optional.stochastic`
    - `raw`: `{temperature, top_p, noise_sigma, perturb_sigma}`
    - `scale`: `{eff_dim_hat, d_ref, d_min, d_max, scale}`
    - `effective`: `{temperature, top_p, noise_sigma, perturb_sigma}`

- (NEW, r20.1p4) VAR profile(구조적 변동성 스케줄): "Structure in noise" 이식
  - 핵심: stochastic를 “얼마나”만이 아니라 **“어디에 배치하느냐(encoding quench vs maintenance recurrent)”**로 분리한다.
  - 권장 위치(단일화): `STATE_SNAPSHOT.payload.metrics_optional.var`
    - `var_profile`: `"quench"|"recurrent"|"auto"`
    - `sa_rank_hat`: number in [0,1] (0=encoding/sensory-like, 1=maintenance/association-like)
    - `var_hat`: number in [0,1] (proxy; 아래 예시 중 하나면 충분)
      - `decode_entropy_mad_w` (토큰 분포 엔트로피의 MAD, 슬라이딩 윈도우)
      - `multi_seed_dispersion` (동일 입력 다중 seed 출력 거리; 비용 허용 시)
      - `self_consistency_score`의 역수(또는 drift)
    - `ri_selfgraph`: number in [0,1] (Self-Graph IGL reciprocity proxy; Canonical §8.3.x)
      - 호환: 레거시 키 `RI_selfgraph`가 들어올 수 있으니 분석/ETL에서 `COALESCE(ri_selfgraph, RI_selfgraph)`로 표준화 권장.

  - 최소 파생 signals(권장):
    - `VAR_decode_entropy_mean_w`, `VAR_decode_entropy_mad_w`
    - `VAR_profile_flip_rate` (에피소드/시간당)
    - `ri_selfgraph_mean_w` (또는 `ri_selfgraph_p95_w`)
