# Wiring & Integration Map v2.2.2+30 (2026-02-19, r20.1p4p21)

> 패치: **(논문 아이디어 흡수) "Oscillatory control of cortical space as a computational dimension": Context Stencil(A0l) 통합 포인트 추가 + 문서/섹션 포인터 연결** (2026-02-19, r20.1p4p21)

> 패치: **(논문 아이디어 흡수) "End-to-End Test-Time Training for Long Context": Parameter Memory(PM) / TTT-lite Session Adapter(A0n) 통합 포인트 + UBB/롤백/로깅 포인터 추가** (2026-02-15, r20.1p4p20)


> 패치: **(ops gate) “운영 가능성 Gate Checklist v0.1” 포인터 추가 + Invariance suite(회귀/조기탐지) 명문화** (2026-02-12, r20.1p4p19)

> 패치: **(운영 정합성) MN: `mn_conf` 기본 정의(부호 안정성×분산) + priors shared pipeline 동일 코드 경로 불변식 + `prior_pipeline_id` 로깅 권장** (2026-02-12, r20.1p4p18)
> 패치: **(논문 이식) "Hybrid neural–cognitive models reveal how memory shapes human reward learning": Memory-ANN-lite(MN) 통합 포인트(A0m) + 로깅/예시 갱신** (2026-02-12, r20.1p4p17)
> 패치: **(논문 이식) "Causal evidence for prefrontal-motor coupling in reward-responsive goal-directed behavior": Goal→Action Coupling(G2A) 지표 + (옵션) ORAV(commit-hold/penalty, 약한 프라이어) 통합 포인트 추가 + 스키마 번들/예시 업데이트(호환 확장)** (2026-02-11, r20.1p4p16)
> 패치: **Render-of-Thought(arXiv:2601.14750v2) 기반 RoTTrace(렌더링된 CoT→단일행 이미지→비전 임베딩) 통합 포인트 추가** (2026-02-10, r20.1p4p15)
> 경로 표기 규칙: 스키마/예시 파일은 `SSOT_SCHEMA_BUNDLE.zip ▸ schema/...`, `SSOT_SCHEMA_BUNDLE.zip ▸ examples/...` (zip 내부 bundle root 기준 상대경로)로 표기한다.

<!-- DOC_ID: INTEGRATION_MAP -->
<!-- ROLE: 문서/정책 배선도 (Wiring SSOT) -->
<!-- SSOT: W-SSOT (navigation) -->

> **문서 역할:** 문서/정책 배선도 (Wiring SSOT)  
> **SSOT 지위:** W-SSOT (navigation)  
> **이 문서에서 허용되는 변경:** 문서/모듈 연결, 참조 포인터. (정의/정책을 새로 만들지 않음)  
> **상위(업스트림) 기준:** SSOT_CANONICAL.md, SSOT_LOGGING_POLICY.md, SSOT_SCHEMA_BUNDLE.zip  
> **하위(다운스트림) 영향:** 업데이트 시 ‘고칠 곳을 찾는 지도’ 역할  

---

> 패치: **(논문 이식) "Macaque prefrontal cortex integrates multiple components for metacognitive judgments of working memory"(Ning et al., Neuron 2026): Meta-WM(working-memory confidence) = {wm_strength, uncertainty, trial_history, arousal} 통합 신호 → MUSE-lite/AVR의 전략 선택·opt-out(VERIFY/RETRIEVE/ASK) 게이트 + (권장) 이벤트 payload 확장(wm_meta, wm_dependency_hat) 포인터 추가** (2026-02-05, r20.1p4p14)
> 패치: **(AVR) ScoreReport/캘리브레이션/어블레이션 운영 포인터 추가: OPS §9.7 + Logging Policy의 SCORE_REPORT 메타 고정 가이드 연결** (2026-02-05, r20.1p4p12)
> 패치: **(논문 이식) TongGeometry(arXiv:2412.10673v1): AVR 배선 추가 — Metacog에서 Value/Cost 신호 사용 + AuxMove(Intervention candidate_injection) 주입 경로 + RubricScorer(TraceCapsule 게이트) 로깅 포인터(`RUBRIC_REPORT`)** (2026-02-05, r20.1p4p11)
> 패치: **(논문 이식) "The network architecture of general intelligence in the human connectome"(Wilcox et al., 2026): NetArch-G(Mode/Bridge/SmallWorld) 이벤트 계약(MODE_SWITCH/BRIDGE_CALL/GRAPH_MAINTENANCE) + STATE_SNAPSHOT.state_core.control_mode_id + DuckDB views(WL_netarch_*) 추가** (2026-02-04, r20.1p4p9)
> 패치: **(논문 이식) "Quantifying the compressibility of the human brain"(Weaver et al., 2026): Compressibility Curve(정규화 엔트로피 vs 상관 제약 비율) → CompIndex(저비용 프록시) + PROBE(comp_curve_v0) + Analysis Signal 축 + SRF/Downshift 트리거(권장)** (2026-02-02, r20.1p4p4)
> 패치: **(논문 이식) "Koopman Invariants as Drivers of Emergent Time-Series Clustering in Joint-Embedding Predictive Architectures"(AAAI 2026 / arXiv:2511.09783): KJEPA(near-identity linear predictor) 기반 무감독 레짐 분해 → DigitalTwin(macro_state_id)/BSL change-point/PROBE/Logging 결합** (2026-02-02, r20.1p4p3)
> 패치: **(뉴로모픽 모티브 이식) "Cerebellar components of the human language network"(Neuron 2025): CSB(Cerebellar Satellite Bank) 도입 — Sat-L(Δlogits)·Sat-M(Δpolicy_score) 출력 분리, SRF 블랙리스트 확장, CSB PROBE suite(선택성/혼합성/분리 위반) 추가** (2026-01-31, r20.1p4p2)
> 패치: **(논문 이식) "Structure in noise"(Neuron 2026): SA-axis 변동성(variability) 그래디언트 + recurrent connectivity/Reciprocity Index(RI) → VAR profile(QUENCH/RECURRENT) 레버·계측·PROBE·Self-Graph 연결** (2026-01-31, r20.1p4)
> 패치: **(논문 이식) arXiv:2601.14514v1 "Just in Time" World Modeling: JIT Construal Loop(Active Set) 결합 지점 + JIT_CONSTRUAL_* 이벤트 포인터 추가** (2026-02-04, r20.1p4p8)

> 패치: **정합성 핫픽스: 스키마 번들 파일명/경로 포인터를 r20.1p1로 갱신** (2026-01-30, r20.1p2)
> 패치: **정합성 핫픽스: ΔQ_hat/ΔQ_over_M 정의 포인터 추가 + 통합 섹션 버전 표기 수정** (2026-01-29, r20.1)
> 패치: **BG/Gate에 초소형 학습 기반 예측 신호(LPS) 통합 포인트 추가** (2026-01-29, r20)
> 패치: **Stop-Rule Firewall(SRF) 명문화: τ_stop 입력 화이트리스트/블랙리스트 + ‘사실상 우회’ 경로 차단** (2026-01-30, r20.1p3)

> 패치: **(즉시 이식) Curation=조성(실패유형 타겟) + Frozen backbone+얇은 헤드 + eff-dim 기반 stochastic 보정 + (옵션A) SD VAE latent 워크스페이스 포맷** (2026-01-24, r19)

> 패치: **AR(추상성) PROBE suite + Latent Axis Bank + instruction-only 형식 수렴 레버 정식화** (2026-01-23, r18)


> 패치: **Hardware/Model Profile 결합 포인트 추가** (2026-01-05, r1)

> 패치: **resource_state/avalanche(burst) 결합 포인트 추가** (2026-01-09, r2)

> 패치: **문서 정합성 정리(파일명/용어 토큰 표준화 + 인덱스 번호 수정)** (2026-01-10, r4)

> 패치: **스키마 번들/참조 정리 + 정체 불명 산출물 언급 제거** (2026-01-10, r5)

> 패치: **Intervention 합성 셔플 불변성 테스트 + 스테이지 고정(pre/mid/post) + CSI 순서 교란 포함** (2026-01-13, r6)


> 패치: **SketchPad(저해상도 시각 스케치/latent) 결합 포인트 추가 + 스케치 정규화(순서-불변) 테스트 추가** (2026-01-13, r7)

> 패치: **SC(Sidecar/QP/z_t) 문서 추가 + Start Points를 Playbook 부록으로 흡수한 문서 세트(r9) 반영** (2026-01-14, r9)

> 패치: **배포 산출물에 Sidecar 포함 + 문서 권한(모듈 스펙) 범위 고정** (2026-01-14, r10)

> 패치: **PROBE suite(Noise titration/Policy sensitivity/Invariance) 결합 포인트 명문화 + macro_state 디지털 트윈 포인터 추가** (2026-01-19, r12)

> 패치: **옵션 A(Analysis Store: DuckDB+Parquet) 파생 분석 스토어를 문서 결합 지도에 추가** (2026-01-19, r12)

> 패치: **Behavioral State Layer(BSL) 결합 포인트(A0d) 추가 + 로깅/라벨 입력 연결** (2026-01-19, r12)

> 패치: **오픈엔디드 예측/정산(EOP++) 결합 포인트(A0e) 추가 + 이벤트/스키마/파생 스토어 연결 명문화** (2026-01-20, r13)

> 패치: **TRM/CGAR 운영 가성비 이식(PDC/halting/HSW) 결합 포인트 명문화** (2026-01-20, r14)

> 패치: **Self-evolution(Artifact Self-Tuning) 결합 포인트/이벤트 포인터 추가 + StateSnapshot EES/Sync 타입 유연화(스키마) 반영** (2026-01-21, r15)

이 문서는 **프로젝트 폴더 문서들(법전/구현/로그/연구/스키마)** 이 서로 어떻게 맞물려야 하는지 “한 장의 지도”로 고정한다.  
즉, 새 규약을 만드는 문서가 아니라 **Canonical Spec을 기준으로 붙이는 방법**을 기록한다.

---


## r20.1 통합 포인트(요약)

- **Curation=조성(실패유형 타겟 데이터)**  
  - 정의/운영: Playbook §4.x, §6.4 / Logging Appendix §12.2(데이터셋 이벤트 필드)  
- **Frozen backbone + 얇은 헤드(Router/Verifier/Sidecar)**  
  - 운영/실험: Playbook §0.3.2, §6.4.x / Sidecar §2.7.6 / Logging Appendix `FINETUNE_RUN_*`
- **Parameter Memory(PM) / TTT-lite Session Adapter(UBB coefficient update)**  
  - 운영/실험: Playbook §4.8.5 + §3.2.3f / Sidecar §2.7.7 / Wiring (A0n) / Logging Appendix `FINETUNE_RUN_*` + `ARTIFACT_TUNE_*`
- **Context Stencil (OSC-inspired)**
  - 규약: Canonical §9.4a (Context Stencil) + TRL Routing(§4.1.0) optional `context_stencil`
  - 운영: Playbook §6.3.1d(SSC) + HCM/PCF(§6.3.1a)
  - 계측: Logging Policy §11.8 + (옵션) PROBE `stencil_v0`
  - 배선: Wiring (A0l)

- **eff_dim_hat 기반 stochastic 보정**  
  - 규칙: Playbook §5.x / Sidecar §2.9.5 / Logging Appendix §12.2.x(B)
- **SketchPad 워크스페이스화 + Option A(SD VAE latent)**  
  - Canonical §3.3.3 / Playbook §3.2.2 / Logging Appendix §12.2.z


## 0. 목표

- 문서 세트가 따로 놀지 않게 **결합 포인트를 고정**한다.
- (라벨 충돌 방지) A0 라벨 예약표는 `00_INDEX_LATEST.md`의 **WIRING 라벨 레지스트리(A0 예약표)** 를 기준으로 한다.
- Intervention/Policy가 Evidence/Claim 권위를 침범하지 않도록 **금지 규칙**을 명문화한다.
- (최근 연구 반영) 워크스페이스/방송(broadcast)이 **오류를 증폭**할 수 있다는 리스크를 전제로, **guard rail + 진단 배터리**를 문서 수준에서 연결한다.

---

## 1. 현재 문서 세트(현행 파일명)

### 1.1 프로젝트 폴더 문서

- Canonical Spec(법전):  
  `SSOT_CANONICAL.md`
- Implementation Playbook(구현/운영):  
  `OPS_PLAYBOOK.md`
  - *(통합)* Start Points(SP) 로드맵: **Playbook 부록 A** 로 흡수됨(별도 파일 없음).
- Metrics/Logging Appendix(이벤트/지표):  
  `SSOT_LOGGING_POLICY.md`
- Sidecar/QP/z_t Subsystem Spec(모듈 스펙, 비법전):  
  `MODULE_SIDECAR_QP_ZT_SUMMARY.md`
- Research Appendix(GNWT/IIT 등):  
  `APPENDIX_GNWT_IIT.md`
- 본 문서(Integration Map):  
  `WIRING_INTEGRATION_MAP.md`

### 1.2 배포 산출물(Intervention/Policy 계층)

아래는 **이 저장소에서 실제로 함께 배포되는 문서/스키마 세트**다.

- `SSOT_CANONICAL.md` (법전)
- `SSOT_LOGGING_POLICY.md` (로그/메트릭)
- `OPS_PLAYBOOK.md` (구현/운영)
- `MODULE_SIDECAR_QP_ZT_SUMMARY.md` (Sidecar/QP/z_t 모듈 스펙, 비법전)
- `APPENDIX_GNWT_IIT.md` (연구 부록)
- `WIRING_INTEGRATION_MAP.md` (결합 지도, 본 문서)
- `SSOT_SCHEMA_BUNDLE.zip` (스키마+예시: `/schema`, `/examples`)

- (NEW) 파생 분석 스토어(옵션 A: DuckDB+Parquet)
  - 역할: Raw Event Log/JML 위에 얹는 **분석용 뷰 저장소**(권위 아님)
  - 근거 문서:
    - Playbook: `OPS_PLAYBOOK.md` §8.4
    - Logging: `SSOT_LOGGING_POLICY.md` §12.4
    - Schema Bundle: `SSOT_SCHEMA_BUNDLE.zip`의 `SSOT_SCHEMA_BUNDLE.zip ▸ schema/analysis_*`


---

## 2. 결합의 기준선(역할 분리)

### 2.1 주인 관계
- **Canonical Spec이 주인**이다(전역 규약/불변 조건).
- Logging Appendix/Schema는 **이벤트/필드 계약의 주인**이다(키/단위/필수-옵션).
- Sidecar/QP/z_t Spec은 **모듈 스펙**이다(개념/인터페이스/업데이트 규율).
  - 단, 로그 필드/이벤트의 “정식 정의”는 Logging Appendix/Schema를 따른다.
- Intervention/Policy는 **Control/View 계층**이다.
  - prior/injection/레버는 “후보 편향”만 제공한다.
  - Evidence/Claim의 권위는 **절대 건드리지 않는다**.

### 2.2 금지 규칙(필수)
- Intervention/Policy가 만든 텍스트/점수/추천은 **Evidence 승격 금지**.
- Workspace(요약/전역 뷰)는 **근거 대체 금지**.
- stop-rule(τ_stop)은 **prior 영향 0**: 항상 독립.
- (SRF) `τ_stop`은 **StopRuleController 전용**이다. Intervention/Policy(검색/프리셋/레버/추천)는 `τ_stop`(또는 `tau_cap`)을 **직접 수정할 수 없다**. (문장/레버로 ‘사실상’ 흔드는 것도 금지)


- (NEW) PDC/halting/HSW는 **운영/제어 레버**다.
  - PDC stage/예산/라운드 정보는 Evidence가 아니라 “얼마나 더 굴릴지”에 대한 운영 로그다.
  - halting margin/reason도 Control/View 신호이며 Evidence 승격 금지.
  - HSW는 **정산(학습 신호)** 에만 적용하며, 결정 경로를 감쇠하면 규약 위반이다.

---

## 3. 문서가 실제로 상호작용하는 지점(핵심 4군데)

Canonical Step Loop(§4) 기준으로 네 군데만 정확히 맞춘다.



### (A0) TRL Routing(통합): Observe 직후 “route_tier/컨텍스트 정책” 태깅
- 위치: **observe() 직후**, Evidence ingest 이전(오염 최소 + 비용 최소)
- 출력: `route_tier`(권장: R0~R5) + `intent_class/evidence_mode/search_mode/context_profile`
- 역할: Gate를 대체하지 않고, (i) Staging에서 개입 라이브러리 선택을 돕고, (ii) policy_levers를 “편향”시키고, (iii) PCF(컨텍스트 폴딩) 후보를 제안한다.
- 문서 연결:
  - Canonical: Step Loop §4(6단계의 route_profile/route_tier) + Exec Core 내부 TRL Routing(§4.1.0) + Workspace PCF/RC(§9.4~9.5)
  - Playbook: Step loop 구현(3.2) + TRL Router 통합 메모(3.2.1)
  - Logging: `ROUTE_ASSESSMENT` / (옵션) `CONTEXT_FOLD` + `STATE_SNAPSHOT.payload.state_core.route_last`

### (A0l) Context Stencil(통합, 옵션): Observe 직후 “공간적 억제 스텐실” 계산 → Retrieval/PCF에 soft-gating 적용

- 위치: (A0) TRL Routing 직후 ~ Staging 전(=prior/편향을 줄 수 있는 가장 싼 구간)
- 출력(권장 최소):
  - `ctx_region_set_id` + `stencil_hash` (그리고 필요하면 top-k만)
  - `ContextStencil := {region_id -> inhibit_w}` (0..1; Control/View)
- 역할:
  - 컨텍스트/메모리 “공간”에서 오염/혼선/과잉회상을 **부분 억제(soft mask)** 로 누른다.
  - Gate(EVC)를 대체/override 하지 않는다(=prior-only). stop-rule(SRF) 우회 금지.
  - Evidence/Claim 권위 침범 금지(스텐실은 선택/편향만).

- 문서 연결:
  - Canonical: TRL Routing(§4.1.0) output + Workspace Stencil(§9.4a)
  - Playbook: SSC 레시피(§6.3.1d) + HCM/PCF(§6.3.1a)
  - Sidecar: Axis→Space gating 메모(§2.8.8)
  - Logging: `STATE_SNAPSHOT.payload.metrics_optional.artifact_tuning.context_stencil.*` + (옵션) PROBE `stencil_v0` (Logging Policy §11.8)

### (A0b) Hardware/Model Profile(통합): Observe 직후 “runtime_limits/profile_id” 스냅샷

- 위치: (A0)와 동일하게 **observe() 직후**, 비용 최소 구간
- 목적: “왜 느렸는지/왜 터졌는지”를 **Workload 보정 변수 + Cost 벡터 축**으로 남기기 위함
- 내용(권장):
  - `runtime_limits.profile_id` (예: 12GB 기본 프로파일)
  - `runtime_limits.vram_cap_mb`, `max_gpu_jobs`, `default_ctx_cap`, `kv_cache_policy`, `offload_policy`
- 문서 연결:
  - Canonical: `RuntimeLimits`(권장) 인터페이스(§3.3.1) + Control/View 원칙
  - Playbook: Hardware Envelope + Model Stack 프로파일(§0.3)
  - Logging: `STATE_SNAPSHOT` + `WL_profile_id`, `WL_context_len`, `WL_kv_cache_mode`, `WL_gpu_offload_mode`, `WL_model_residency_mode` + `Cost_vram_peak_mb`, `Cost_kv_cache_peak_mb`, `Cost_model_load_ms`, `Cost_cpu_ram_peak_mb`, `Cost_oom_count`

> 주의: 프로파일은 “정답/권위”가 아니라 운영 조건이다. Evidence/Claim 근거로 승격 금지.



### (A0g) SketchPad(통합): Observe/Boundary에서 “저해상도 스케치 포인터” 남기기 (권장)

- 위치:
  - Observe 직후: `sketch_enabled/codec/res` 같은 **스위치/프로파일 태깅**(Workload 보정용)
  - Boundary 커밋: `sketch_self_hash/ref`, `sketch_task_hash/ref` 같은 **최소 포인터** 기록
- 목적:
  - “메타-컨트롤러가 볼 수 있는 저대역 구조”를 확보해, 텍스트 요약이 놓치는 **공간/구조적 불일치**를 조기에 잡는다.
  - 스케치가 잘 먹히는 과업(공간/경로/도식)은 물론, **자기모델링(시스템 상태 다이어그램)** 도 같은 채널로 묶어 계측한다.
- 내용(권장):
  - `SketchPadState`(Canonical §3.3.3)에서 정의한 `hash/ref/res/repr`만 남김(무거운 payload는 debug-store)
  - `WL_sketch_enabled`, `WL_sketch_res`, `WL_sketch_update_count`(Logging §11.5) 같이 난이도/비용 보정 변수로도 사용
- 문서 연결:
  - Canonical: SketchPadState(§3.3.3) + Step Loop의 Update IM + SketchPad(§4)
  - Playbook: SketchPad 통합 메모(§3.2.2)
  - Logging: `STATE_SNAPSHOT`/`SKETCHPAD_UPDATE` + WL_sketch_* covariates

### (A0j) Render-of-Thought Trace(RoT)(옵션): 긴 CoT를 “단일행 이미지/비전 임베딩”으로 압축해 TraceCapsule로 남기기

- 위치(권장):
  - MID stage 종료 직후(=Gate 직전) 또는 Boundary 커밋 시점에 **포인터만** 남긴다.
- 목적:
  - 긴 CoT를 “텍스트 그대로” 저장하지 않고, **재사용/검색/진단 가능한 저대역 trace** 로 남겨
    메모리/분석 비용을 줄인다.
- 내용(권장 최소):
  - `rot_trace.trace_hash/trace_ref`, `rot_trace.encoder_id`, `rot_trace.token_budget`, `rot_trace.seq_len`
  - (옵션) `rot_trace.saturation_plateau_at`, `payload.cost.render_ms`, `payload.cost.encode_ms` (and optional `payload.cost.bytes`)
- 문서 연결:
  - Canonical: SketchPadState(§3.3.3) + (NEW) RoTTraceCapsule
  - Playbook: SketchPad 통합 메모(§3.2.2) 내 RoT 레시피
  - Logging: `ROT_TRACE_UPDATE` + `WL_rot_*` covariates

### (A0e) Forecast/Calibration(EOP++)(통합): Predict 직후 “EOP(예상)” 기록 + 툴 결과 시점에 정산(compare) 이벤트 남기기 (권장)

- 위치:
  - Predict 직후(툴 실행 전): `EXPECTED_OUTCOME_PACKET` (EOP, 선택적으로 wager 포함)
  - 툴/외부 관측 확정 후: `PREDICT_OBS_COMPARE` (EOP 대비 결과 정산)
- 목적:
  - 오픈엔디드에서도 **과신/캘리브레이션**을 운영 신호로 만들기
  - 실패모드 라벨링을 통해 Intervention 효과를 ‘정답 없는 과업’에서도 비교 가능하게 만들기
- 주의:
  - EOP/compare는 Evidence가 아니다(뷰/제어). Claim 근거로 승격 금지.
- 문서 연결:
  - Canonical: EOP 규약(§5.5) + EOP++ 부가 규약(§5.5.1)
  - Playbook: Step loop(EOP 기록/정산) + EOP++ 훅(§3.2.2a)
  - Logging: 이벤트 페이로드 계약(§12.2의 9번 항목 아래) + `Brier/OverconfidentError` 정의
  - Schema Bundle: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml`(조건부 required) + `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_expected_outcome_packet.example.json`, `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_predict_obs_compare.example.json`



### (A0f) Learned Prediction Signal(LPS)(통합): Staging 직전 “약한 프라이어(학습 기반)” 스냅샷 남기기 *(옵션, 초소형)*

- 위치: `update_sidecar()` 직후 ~ `Intervention/Policy Staging` 직전(= Gate 후보 점수/예산 편향을 주기 가장 좋은 지점)
- 출력(권장 최소): `commit_fail_hat`, `verify_gain_hat`, `(optional) cost_hat.{tokens,tool_calls,latency_ms}`
- 역할:
  - Gate(EVC)를 대체하지 않고 **초기 편향(prior)** 만 제공(override 금지)
  - BG 예산을 폭으로 흔들지 말고, `verifier_budget/retrieval_budget/intervention_topk` 같은 레버를 **1~2** 수준에서만 미세 조정
- 안전장치(필수): `clip01 + jerk_cap(EMA) + cooldown` + 캘리브레이션(ECE/Brier) 악화 시 자동 disable
- 기록(필수): `STATE_SNAPSHOT.payload.metrics_optional.learned_pred.*` + (권장) `GATE_DECISION.payload.learned_pred_used.*`

- 문서 연결:
  - Canonical: Step Loop §4(Policy Staging) + EVC §5.2.0(LPS 프라이어 규약)
  - Playbook: §3.2.3a(LPS 헤드 구현/학습/롤백)
  - Sidecar/QP: §6.4.7(LPS 역할/원칙)
  - Logging: §11(지표) + §12(필드 위치) + §13(레버)

### (A0k) Goal→Action Coupling(G2A)(통합): “목표 펄스→행동 발화” 결합도 계측 + 커밋 보조 프라이어 *(옵션, 가성비)*

- **위치:** `update_sidecar()` 직후 ~ `Intervention/Policy Staging` 직전  
  - 즉, LPS와 같은 레이어(“prior-only”)에 둔다.
- **역할:** 목표/드라이브 갱신이 실제 행동(툴/쓰기/커밋)으로 *잘 이어지는지*를 **저비용 지표**로 추정해, Gate 후보 점수에 아주 약한 편향을 준다.
- **불변 규칙(필수):**
  - Control/View 전용. Evidence/Claim confidence 승격 금지.
  - stop-rule(τ_stop) 입력 금지(SRF).
  - override 금지: EVC_raw를 대체하지 않는다(prior-only + clip/jerk/cooldown).
- **권장 상태 키(요약):**
  - `STATE_SNAPSHOT.payload.metrics_optional.g2a.*`
  - (옵션) `STATE_SNAPSHOT.payload.metrics_optional.orav.*` (Outcome-responsive hold/penalty)
- **문서 포인터:**
  - Canonical: `§5.2.0c` (G2A/ORAV 규약)
  - Playbook: `§3.2.3d` (가성비 구현 레시피)
  - Logging: `§12.2`(STATE_SNAPSHOT metrics_optional.g2a/orav) + `§13`(State→Policy map 입력/레버)
  - Schema Bundle: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/state_snapshot.schema.yaml` + `SSOT_SCHEMA_BUNDLE.zip ▸ examples/state_snapshot_with_*`

### (A0m) Memory-ANN-lite (MN) Update (Control/View): “기억 변수” 기반 보상학습 프라이어 *(옵션, 초경량)*

- **위치:** `update_sidecar()` 직후 ~ `Intervention/Policy Staging` 직전  
  - 즉, LPS/G2A와 같은 레이어(“prior-only”)에 둔다.
- **역할:** “최근/중기/장기” 패턴을 담는 잠재 메모리 상태를 유지하고, Gate 후보 점수에 **아주 약한 편향**만 제공한다.
- **저장(권장):** `STATE_SNAPSHOT.payload.metrics_optional.memory_ann.*`
  - `mn_bias_hat`, `mn_conf` (+ 옵션 `mn_timescale_mix`, `mn_cf_sens_hat`)
- **불변 규칙(필수):**
  - Control/View 전용. Evidence/Claim confidence 승격 금지.
  - stop-rule(τ_stop) 입력 금지(SRF).
  - 런타임 반영은 prior-only: `clip + jerk-limit(EMA) + cooldown` 강제.
  - (MUST) MN도 LPS/G2A와 동일한 **shared prior pipeline**을 사용한다(같은 코드 경로; 별도 jerk/clip 분기 금지).
  - ORAV cooldown 동안 MN prior=0(또는 동결).
- **Gate 기록(권장):** `GATE_DECISION.payload.memory_ann_used.{prior_clip_mn,mn_bias_hat,mn_conf,mn_weight,reason_codes}`


### (A0n) Parameter Memory(PM) / TTT-lite Session Adapter Update (Control/View): “긴 컨텍스트를 파라미터로 압축” *(옵션, 경계-전용)*

- **위치:** `Boundary close_episode()` 직후, 다음 에피소드가 시작되기 전에 “튜닝 윈도우”로 0~1회 실행
  - 원칙: Step Loop 인라인에서 가중치/계수 업데이트 금지(법전 오프라인/경계 원칙 준수).
- **역할:** 긴 세션에서 “더 많은 컨텍스트” 대신, 에피소드의 반복 패턴/용어/스타일을 **작은 어댑터(UBB 계수)**에 압축해 다음 턴의 비용(토큰/검색/검증)을 줄인다.
- **출력(권장):** `adapter_profile_id`(후보), `basis_version`, `coeff_hash`, `coeff_norm`, `residual_ratio`, `rollback_token`
- **불변 규칙(필수):**
  - Control/View 전용. Evidence/Claim confidence 승격 금지.
  - stop-rule(τ_stop) 입력 금지(SRF).
  - “즉시 적용” 금지: 커밋은 Boundary 이후(다음 에피소드부터) + 히스테리시스/쿨다운.
  - 회귀 게이트: `invariance_v0` + (최소) canary suite 통과 전에는 `promotion=HOLD`.
- **로깅(권장):**
  - `FINETUNE_RUN_START/END` (예: `method=ttt_lite_ubbc`) + `ARTIFACT_TUNE_*`로 후보/승격/롤백 계보를 남긴다.
  - JML 필수: Playbook §4.8.4의 필드(`backbone_id`, `basis_version`, `adapter_profile_id`, `coeff_hash`, `coeff_norm`, `proj_dim_k`, `residual_ratio`).
- **문서 포인터:**
  - Sidecar: `§2.7.7` (Parameter Memory / TTT-lite Session Adapter)
  - Playbook: `§4.8.5`, `§3.2.3f`
  - Logging: `§7`(ARTIFACT_TUNE_*) + `7b)`(FINETUNE_RUN_*)
  - Schema Bundle: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml` *(FINETUNE_RUN_*, ARTIFACT_TUNE_*)*

### (A0h) JIT Construal Loop(통합): Observe~Staging 구간의 “작업용 미니 세계모델(Active Set) 증분 로딩” *(권장)*

- **위치:** (A0) TRL routing/labels + `update_sidecar()` 직후, **Intervention Staging의 retrieval 전에** 1회(또는 0~N회)  
- **역할:** “전체 세계모델”이 아니라, 이번 턴 의사결정에 필요한 **Active Set(construal)** 만 증분 구축/정리  
- **불변 규칙:**
  - Control/View 전용. Evidence/Claim confidence 승격 금지(근거는 ptr로만).
  - stop-rule(τ_stop) 입력 금지(SRF)  
- **문서 포인터:**
  - Playbook: `§3.2.2b JIT Construal Loop(JIT-WM) 통합 메모` + `§5.1.2 PSGR`(needs → SUBQ 연결)
  - Logging: `§12.2 이벤트 타입`의 `JIT_CONSTRUAL_*` + `§11.5 WL_jit_* covariates`
  - Runtime/집계: Playbook §3.2.2b의 Runtime gating + Logging §12.4.6 + `SSOT_SCHEMA_BUNDLE.zip ▸ tools/ANALYSIS_STORE_DUCKDB_VIEWS_JIT.sql` (WL_jit_* 자동 집계/조회)
  - Schema Bundle:
    - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jit_object.schema.yaml`
    - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jit_need.schema.yaml`
    - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jit_construal.schema.yaml`
    - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml` *(event_type=`JIT_CONSTRUAL_*`)*

### (A0i) CSB(Cerebellar Satellite Bank)(통합): 위성(head) 출력 타입 분리 + SRF 준수

- 위치:
  - Sat-L(Δlogits): Generate 직전(샘플러 입력 직전)
  - Sat-M(Δpolicy_score): Gate 후보 점수 prior 단계(EVC_raw 계산과 분리)
- 계약(필수): Sat-L은 `Δlogits`만, Sat-M은 `Δpolicy_score`만(분리 위반 즉시 disable)
- SRF: CSB 출력/점수/선택성은 **τ_stop 입력 금지** + Evidence 승격 금지
- 기록(필수): `STATE_SNAPSHOT.payload.metrics_optional.cerebellar_satellites`
- (권장) Gate 기록: `GATE_DECISION.payload.cerebellar_satellites_used`
- PROBE: `probe_suite_id=csb_satellite_v0` (Playbook §9.1.7)

(A0d) Behavioral State Layer(BSL)(통합): Observe~Boundary 구간에서 “session_start / bstage / bstate” 라벨 생성 (권장)

- 위치: **Observe 이후~Boundary 이전(PRE stage)**
- 목적:
  - 세션 시작에서 행동 전환이 몰리는 패턴을 운영적으로 활용해 **초반 과잉개입을 줄이고**,
  - Intervention 검색/정책 매핑에 쓸 **저카디널리티 라벨**을 추가한다.
- 출력(권장):
  - `state_labels`에 다음을 추가(조건부):
    - `session_start` (예: `session_pos_norm ≤ θ_start`)
    - `bstage/S1|S2|S3` (confidence ≥ θ_b)
    - `bstate/<id>` (confidence ≥ θ_b, 카디널리티 폭발 시 압축)
- 문서 연결:
  - Canonical: Behavioral State Layer(BSL) (새 섹션) + Control/View 원칙
  - Playbook: Step loop 의사코드(3.2) + BSL 구현 메모
  - Logging: `STATE_SNAPSHOT.payload.state_core.behavior_state.*` + (선택) `BEHAVIOR_STATE_SWITCH`

> 주의: BSL은 Evidence/Claim 권위를 침범하지 않는다. “라벨”은 검색/편향 입력일 뿐이다.



### (A0c) (NEW) Metacog Cycle(MUSE-lite): Observe 직후 “competence_hat 기반 전략 선택” 오버레이

- **위치**: (A0)/(A0b) 직후, (A) Staging으로 들어가기 전에 한 번  
- **역할(AVR)**: unknown/OOD/연속 실패/loop 감지 시,
  - `StrategyBank` 후보를 점수화(`competence_hat`)해 **다음 전략을 선택**하고,
  - (옵션) **AuxMove 후보**(=Intervention `candidate_injection` 템플릿)를 같이 올려서 “막힘”을 푼다.
- **출력(권장)**:
  - `competence_hat`, `competence_u`
  - (옵션) `remaining_steps_hat`(남은 단계/남은 시도 프록시), `cost_hat.{tokens, tool_calls, latency_ms}`
  - (NEW, 옵션) `wm_meta.meta_wm_hat`(Meta-WM gate), `opt_out_triggered`
- **불변 규칙**:
  - competence/value/cost는 **제어 신호(Control/View)** 이며 Evidence/Claim confidence로 승격 금지
  - stop-rule은 항상 상위(메타인지 루프가 우회 불가, `τ_stop` prior 영향 0)
  - AuxMove는 “새 이벤트/필드”를 만들지 않고, **Staging(MID)에서 `candidate_injection`으로만** 반영한다(Intervention 합성/셔플 불변성 테스트 적용)
- **로그/스키마**: `COMPETENCE_ASSESSMENT` / `STRATEGY_SELECTION` / `METACOG_CYCLE_END` + (권장) `RUBRIC_REPORT`
- **문서 포인터**:
  - Canonical Spec §3.3.7, §5.7
  - (NEW) Canonical Spec §5.7.3b(Meta-WM gate)
  - Logging Appendix §12.2(9.1) + `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_RUBRIC_REPORT.json`
  - Playbook §3.2.4(AVR 확장), §6.4(TraceCapsule 커밋 게이트)
  - (NEW) Sidecar/QP/z_t §2.2a(Meta-WM 슬롯) + Logging §9.1(wm_meta)
  - (NEW) Schema Bundle 예시: `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_COMPETENCE_ASSESSMENT.json`(wm_meta, wm_dependency_hat)
  - (추가) Playbook §9.7(AVR ScoreReport/캘리브레이션/어블레이션 운영)


### (A) Step Loop 내 위치: Boundary 이후, Gate 이전 “Staging”
- (r6) **스테이지 고정(pre/mid/post)**: PRE(Observe~Boundary)=tagging/스냅샷만, MID(본 Staging)=Intervention 합성/클리핑, POST(Execute/Commit)=결과 반영만.
- (r6) **Intervention 합성 셔플 불변성 테스트**: `applied[]` 후보를 셔플해도 합성 결과가 동일해야 하며, 회귀 테스트로 로그에 남긴다(`INTERVENTION_DECISION.shuffle_invariance`).
- 입력: `state_labels`, `route_tier`, `cooldown_state`, budgets, current `policy_levers`
- 출력: jerk-limited `policy_delta` + clipped `gate_prior` + capped `candidate_injection`
- 문서 연결:
  - Canonical: Step Loop §4(6단계)
  - Playbook: step loop 구현 섹션
  - Logging: `INTERVENTION_RETRIEVED`, `INTERVENTION_DECISION`, `POLICY_UPDATE`

### (B) Gate 후보 편향과 stop-rule 분리
- prior/injection은 후보 집합 편향만.
- `τ_stop`은 prior 영향 0(override 금지).
- 문서 연결:
  - Canonical: Gate §5, Stop Rule §5.3, 결합 규약 §5.4.1
  - Playbook: gate 후보 구성 + stop 분기
  - Logging: `GATE_DECISION`(decision=COMMIT, decision_reason=stop_rule)
  - 필요 시 stop-rule 관련 스칼라(EVC_max, tau_stop 등)는 `SCORE_REPORT`에 함께 기록

### (C) Boundary에서 Outcome/Stats 커밋
- 적용된 intervention만 perf/stab/cost 업데이트(EMA/윈도우).

- (NEW) 반복 루프가 길어질수록, Boundary rollup에서 **HSW 가중치**로 학습 신호만 감쇠한다.
  - 결정/출력 텍스트는 감쇠 금지(결정 경로 보존).
- 낮은 신뢰에서는 다음 prior 반영 제한(guard rail).
- 문서 연결:
  - Canonical: Boundary §10, 종료 커밋 §10.2
  - Playbook: boundary close → stats update → snapshot
  - Logging: `STATE_SNAPSHOT`, `SCORE_REPORT`, `POLICY_UPDATE(update_reason=intervention_stats_rollup)` 또는 `STATE_SNAPSHOT`

### (D) Logging/Schema: 적용/거부/결과가 남아야 한다
없으면 그냥 감으로 운영한다.

- (추가, 권장) **policy_preset 지문**을 같이 남긴다(재현성)
  - `STATE_SNAPSHOT.payload.policy_snapshot.preset.{policy_preset_id, policy_preset_version, policy_preset_hash}`

- 필수 이벤트(요지)
- (추가, 권장) 하드웨어·모델 프로파일/자원 소모도 함께 남긴다
  - `STATE_SNAPSHOT.payload.runtime_limits`(또는 동등 구조)
  - Workload covariates: `WL_profile_id`, `WL_context_len`, `WL_kv_cache_mode`, `WL_gpu_offload_mode`, `WL_max_gpu_jobs`
  - Cost axes: `Cost_vram_peak_mb`, `Cost_kv_cache_peak_mb`, `Cost_model_load_ms`, `Cost_cpu_ram_peak_mb`, `Cost_oom_count`
- (추가, 이번 세션 반영) phase-conditioned EES + 안정성(CSI) 신호도 누락 없이 남긴다

- (NEW) PDC/Halting/HSW 로그(운영 가성비 이식)
  - `budget.pdc_stage_id`, `budget.pdc_round`, `budget.pdc_stage_tau_cap`, `budget.pdc_stage_M_cap`
  - `budget.halt_margin`, `budget.halt_reason`
  - `outcome_metrics.hsw_lambda`, `outcome_metrics.hsw_weight_last`, `outcome_metrics.hsw_rounds`
  - `EES_SIGNAL`: `EES_level(=state_core.ees_w)`, `EES_phase(ACQUIRE/VERIFY/COMMIT/CONSOLIDATE)`, `triggered_gate`, `resolution_action`(가능하면)
  - `SCORE_REPORT`(또는 동등 summary): `CSI_phase`, `CSI_global` (회귀 게이트용 지표, 자동 라우팅 규칙으로 직접 쓰지 않음)

- `INTERVENTION_RETRIEVED`: 후보를 언제/왜 가져왔나
  - `INTERVENTION_DECISION`: 왜 채택/거부했나(guard rail 포함)
  - `POLICY_UPDATE`: policy_levers 변화(Δ/Δ²/clip 기록)
  - `PULSE_TRIGGER` / `PROBE_RUN`: 워크스페이스 갱신·프로브 실행 근거/결과

- (NEW) **policy preset 지문**: 같은 규칙/예산이었는지를 재현 가능하게 남긴다.
  - `policy_snapshot.preset.(policy_preset_id, policy_preset_version, policy_preset_hash, source)`
  - preset은 Evidence/Claim 권위가 아니라 “운영 설정”이다(승격 금지).

- (NEW) **digital_twin(SSM-lite) 보강 포인터**: macro_state만 남기면 시간이 지나면 해석이 안 된다.
  - `digital_twin.(macro_obs_schema_id, macro_obs_hash, macro_state_method, centroid_hash, prototypes_topk, risk_set_id, zoom_in_trigger)`
  - 자세한 필드 계약은 Logging Appendix의 DigitalTwin 절을 따른다.



### (D2) (NEW) 파생 분석 스토어(옵션 A): “로그는 유지하고, 쿼리만 빨라지게”
- 위치: Raw Event Log/JML/Evidence를 만든 **이후**
- 역할: (i) 회귀/원인분해 SQL, (ii) SSM-lite(digital twin) 배치 업데이트, (iii) cost/WL 보정 통계 산출
- 규칙:
  - 파생 스토어 산출물로 Evidence/Claim 권위 생성 금지(항상 포인터로만 연결)
  - 3중 시간 의미론 유지(event/observed/recorded)
  - tags/라벨은 low-cardinality만(카디널리티 폭발 금지)
- 문서 연결:
  - Playbook: `OPS_PLAYBOOK.md` §8.4
  - Logging: `SSOT_LOGGING_POLICY.md` §12.4
  - Schema: `SSOT_SCHEMA_BUNDLE.zip`(`SSOT_SCHEMA_BUNDLE.zip ▸ schema/analysis_event_flat.schema.yaml`, `SSOT_SCHEMA_BUNDLE.zip ▸ schema/analysis_signal.schema.yaml`)

- (권장 추가 산출물) `macro_state_catalog`(Parquet/JSON): `macro_state_version`별 centroid 해시/방법/프로토타입 샘플(top-k)을 모아 둔 카탈로그
  - 목적: macro_state_id가 “라벨”로만 남는 걸 방지하고, 디버깅/회귀 분석에서 바로 열어볼 수 있게 한다.


---

### (E) (옵션) Iterative Deployment Loop: TraceCapsule → Dataset → Tune

배포(실사용)에서 나온 “성공/실패 경로”를 **반복 개선 루프**로 쓰되, Augnes Local 기본값은 **아티팩트(Self-Tuning) 중심**이다.

- Canonical Spec: §11.1.3(Artifact Self-Tuning + Iterative Deployment 매핑), §11.2(Validator), §3.3(TraceCapsule)
- Playbook: §6.4(Deployment→Curation→Tune 운영 루프)
- Logging Appendix: §12.2( `DATASET_BUILD_START/END`, `FINETUNE_RUN_START/END`, `ARTIFACT_TUNE_CANDIDATE/EVAL/COMMIT/ROLLBACK` 이벤트 계약)
- Schema Bundle: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml` 조건부 required + `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_dataset_build_*.example.json`, `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_finetune_run_*.example.json`

- (AVR 권장) TraceCapsule 후보는 RubricScorer로 채점하고 `RUBRIC_REPORT`를 남긴 뒤, 커밋 조건(τ_v, τ_e 등)으로 게이트한다.


주의:
- Dataset/파생 분석/튜닝 로그는 Evidence/Claim 권위를 만들지 않는다(§2.2 금지 규칙 준수).
- 메인 Step Loop stop-rule(EVC_raw) 판정과 Evidence Contract는 인라인에서 교란하지 않는다(오프라인 윈도우 원칙).

## 4. 최근 연구(2512.19155v1) 반영: Broadcast-Amplification 방지 + 진단 배터리

### 4.1 리스크 모델: 전역 공유는 오류도 전파한다
워크스페이스/전역 공유(broadcast)는 성능 레버지만, 오염되면 오류 증폭기가 된다.  
그래서 아래 4개는 “옵션”이 아니라 문서 수준에서 **필수 생존장치**로 취급한다.

- jerk-limited(Δ² cap) + hysteresis/cooldown
- candidate_injection cap
- prior clipping
- stop-rule 독립(τ_stop prior 영향 0)

- 운영 판정: OPS_PLAYBOOK §9.7.6 (Gate Checklist v0.1)에서 위 4개 생존장치를 must-pass 게이트로 점검한다.

### 4.2 진단 배터리(권장 최소)
Intervention/Policy를 “개선”이라고 주장하려면 최소 아래 실험을 고정한다.

0) **Invariance suite (회귀/조기탐지)**
- 목적: “순서/구현 분기/프라이어 누수” 같은 회귀 버그를 운영에 들어가기 전에 잡는다.
- Playbook: `OPS_PLAYBOOK.md` §9.1.4(`invariance_v0`) + §9.7.6(Gate Checklist)
- 포함(권장): `intervention_shuffle_invariance`, `sketchpad_shuffle_invariance` + (추가) `srf_firewall_invariance`, `prior_pipeline_invariance`
- Logging: `INTERVENTION_DECISION.shuffle_invariance` + `InterventionShuffleInvariance*`/`SketchPadShuffleInvariance*` 축



1) **Type-1 / Type-2 dissociation**
- Type-1(성공률/정답률)이 유지되는 조건에서
- Type-2(과신/오류예측/SRP 품질)가 무너지는지/개선되는지 측정

2) **Noise titration (L75 임계점)**
- 근거 문서:
  - Playbook: L75 루틴(§9.1.2)
  - Logging: PROBE suite payload(titration) 확장(§12.2(6))
- retrieval/요약/정책 후보 오염을 점진적으로 올리고
- 성능이 75%로 꺾이는 임계를 기록(내성 곡선)

3) **복잡도/PCI 계열은 Δ만 사용**
- 절대값 판단 금지
- 성공-실패 차이(Δ) 기반 진단만 허용, 그것도 Ops Marker


4) **A-PCI/ΔPCI(Workspace 섭동 기반 루프 건강 지표)**
- 실행 위치: Boundary close 직후(업무 중 섭동 금지)
- 이벤트: `PULSE_TRIGGER(pulse_kind=perturbation)` + `PROBE_RUN_START/END`
- 해석: raw 절대값 판단 금지, **ΔPCI(성공-실패 대조)** 기반 진단만 허용(Ops Marker)
- 근거 문서:
  - Canonical: PROBE 규약 §5.1.1
  - Logging: A-PCI 스펙 §11.7 + Pulse/Probe 이벤트 §12.2(6)
  - Playbook: A-PCI 측정 루틴 §9.1.1
5) **CSI + Bias-Sensitivity (회복성/재현성 + 목표편향 점검)**
- (추가, 권장) **Policy/Route sensitivity(레버 섭동)**
  - 목적: 작은 레버 변화(ε)가 flip/진동/route를 과도하게 흔드는지 측정
  - Playbook: §9.1.3
  - Logging: PROBE suite payload(policy_sensitivity) 확장(§12.2(6))
- CSI: 동일 task 반복(N=5~10)에서 `StateLabel/PolicyLever/route` 시퀀스 유사도 기반 안정성 지표
  - `CSI_phase`, `CSI_global`은 **회귀 게이트용**(온라인 라우팅 규칙으로 직접 사용 금지)
- Bias-Sensitivity: framing(DriveState/GoalStack) 변화가 EES(FA/Miss)를 흔드는지 상관 점검
- 근거 문서:
  - Canonical: CSI 규칙 §2.3.3 + EES 규칙 §2.3.1~2.3.2
  - Logging: CSI §13.7.1 + Bias-Sensitivity §13.6.4
  - Playbook: CSI 실험 §9.5 + Bias-Sensitivity 점검 §9.6

6) **SketchPad 정규화/안정성 (순서-불변 + 드리프트)**
- (권장) 위 테스트들은 `PROBE_RUN`으로 묶어 `probe_suite_id=invariance_v0`로 회귀 스위치화한다.
  - Playbook: §9.1.4
  - Logging: PROBE suite payload(invariance) 확장(§12.2(6))
- SketchPad는 “그림이 예쁘다”가 아니라, **결정론/재현성/저대역 압축**이 생명이다.
- 최소 실험:
  - `SketchPrimitive` 셔플 불변성: primitives 순서를 섞어도 `sketch_hash`가 동일한지(=정규화/렌더링 결정론)
  - `SketchJumpRate`: 연속 boundary에서 `sketch_self` 해시/거리(또는 latent cos)가 과도하게 튀는지(=메타상태 진동 프록시)
  - (옵션) “스케치 OFF vs ON” A/B: 비용 증가 대비 **Gate/Verifier/리트리벌의 step 감소**가 실제로 생기는지(ΔCost vs ΔPerf/ΔStab)


6a) **AR(Abstractness Ratio) PROBE(추상성)**
- 목적: 최소 컨텍스트에서도 `rule/state(R)`와 `outcome(O)`가 분리되어 잡히는지 계측(“형식이 그럴듯함”과 분리)
- 표현 추출 지점:
  - 운영 기본: `repr_source=zt_summary`(z_t commit)
  - 진단용: `repr_source=backbone_pool`(특정 레이어 pooling)
- 산출: `decodability`, `ccgp`, `ps_repr` (대비 Δ로만 해석)
- 근거 문서:
  - Canonical: AR 정의(§5.1.1.2)
  - Playbook: AR 운영(§9.1.5)
  - Logging: PROBE payload(`abstractness_ar`) + signals 축 `AR_*`, `PS_repr_*`(§12.2(6), §12.4.4)

6b) **Latent Axis Bank(LAB) / Axis Bank**
- 목적: z_t/backbone에서 뽑는 저차원 축을 “버전 관리된 손잡이”로 만들고, 드리프트/회귀로 관리
- 결합 위치:
  - Sidecar가 축 정의/승격을 권위로 가짐
  - PROBE suite(AR/불변성)가 축 검증 루프 역할
- 근거 문서:
  - Sidecar: LAB 정의(§2.8)
  - Playbook: 빌드/승격 루프(§9.1.6)
  - Logging: `axis_bank` 확장 키 + `LAB_*` 신호축(§12.2(6), §12.4.4)

6c) **Instruction-only 형식 수렴(IFC) → 스키마/프롬프트 레버**
- 목적: `TRACE_CAPSULE`/`SELF_REFLECT` 같은 저대역 출력을 “항상 같은 모양”으로 만들고, 내용 검증은 VERIFY로 분리
- 계측: `FMT_*` 신호축(통과율/실패율/불일치율) + (옵션) `format_convergence` PROBE
- 근거 문서:
  - Playbook: IFC 적용(§2.3)
  - Sidecar: Artifact Self-Tuning에서 OUTPUT_CONTRACT 운용(§6.5 보강)
  - Logging: `format_convergence` 확장 키 + `FMT_*` 신호축(§12.2(6), §12.4.4)



6d) **Compressibility(CompIndex/CompCurve) — 반복(과압축) vs 산만(저압축) 분리**
- 목적: 루프/표현/정책이 **너무 반복적(과압축)** 이거나 **너무 산만(저압축)** 한 쪽으로 치우치는지 조기 감지(Ops Marker).
- online(권장 기본): `STATE_SNAPSHOT.payload.metrics_optional.comp_index.{token_lz,policy_lz,et_lz}` + signals 축 `Comp_token_lz/Comp_policy_lz/Comp_et_lz`
- offline(옵션): `CompCurve_*`(GraphicalLasso λ sweep)로 레짐별 의존성 구조 프로파일링(`macro_state_id`별 평균/분산).
- 연결(권장):
  - 과압축 + RuminationIndex↑ + GateFlip↑ ⇒ `τ_stop↑` 또는 `self_reflect_cooldown_steps↑`(Stop-Rule 우회 금지)
  - 저압축 + PolicyFlip↑ + CSI↓ ⇒ VERIFY 비중↑ 또는 “강제 COMMIT + 리셋” 후보
- 근거 문서:
  - Canonical: COMP 정의(§5.1.1.5) + SRF whitelist(§5.3.1)
  - Playbook: 구현(§8.5)
  - Logging: signals 축 표준(§12.4.4) + Raw 필드 위치(§12.4.4/§12.2)
  - Schema bundle: README(확장 키 `comp_index/comp_curve` 안내)
- 금지: CompIndex/CompCurve를 Evidence/Claim의 근거로 인용(=권위 승격) 금지.

7) **SSM-lite digital twin (macro_state 전이 추적 + 위험 줌인 트리거)**
- 목적: (e_t,z_t,QP 요약, trace) 기반 거시 상태를 먼저 추적하고, 위험 신호에서만 미시로 내려간다(가성비).
- 산출: `macro_state_id`, `macro_state_version`, (선택) `P_hat` 기반 `risk_score`
- 근거 문서:
  - Sidecar: Verifier=macro belief + zoom-in(§6.6.1)
  - Playbook: SSM-lite Digital Twin 구현(§4.13)
  - Logging: `digital_twin.*` 권장 필드(§12.2(6) 및 JML_ENTRY 최소 payload)
- 금지: Evidence/Claim 권위 만들기 금지, stop-rule(τ_stop) 독립 유지

---


### 4.3 추가 연구(2409.16394v5) 반영: slow resource dynamics → LRO/avalanche

이 논문은 “임계점 튜닝” 없이도, **슬로우 변수(자원/메모리)의 히스토리 의존성**만으로 전역 동조(LRO)가 나타날 수 있음을 보여준다.  
Augnes Local에서는 이를 “broadcast-amplification이 특정 임계점 설계 실패가 아니라, **fast/slow 분리만으로도 자연스럽게 생길 수 있는 운영 현상**”으로 받아들인다.

문서 결합 포인트는 2개로 고정한다.

1) **EVC 비용항의 `resource_load` 의미 고정**  
   - Canonical §5.2.1에서 `resource_load/resource_state`(슬로우 변수) 정의  
   - Playbook §5.3.1에서 계산/튜닝/로그 위치(`STATE_SNAPSHOT.payload.metrics_optional`) 명시  
   - Logging Appendix §11.5에서 WL covariates로도 기록(분석/정규화)

2) **burst/avalanche 진단을 `zone=supercritical` 트리거로 연결**  
   - Logging Appendix §11.3에서 `AvalancheIndex` 계산/저장 위치 고정  
   - Playbook §5.3.2에 `zone=supercritical` **승격/해제(hysteresis) 규칙(v0)** 를 명시(정량 트리거 고정).
   - Playbook §5.3.2 + §0.3.3에서 downshift 반응(쿨다운/τ_stop/툴 제한) 고정  
   - Canonical §11.3에서 “스키마 확장 없이 metrics_optional/wl_covariates로만 넣는다”를 강제



## 5. 문서 작업만으로 “완전 부착” 판정하는 체크리스트

### 5.1 Canonical Spec(필수)
- Step Loop에 Staging 단계 존재(§4) + Gate 이전 위치
- stop-rule 독립(§5.3)
- Workspace 뷰/Evidence 대체 금지(§9)
- 결합 규약(override 금지 + injection cap + jerk cap)(§5.4.1)


- `resource_load/resource_state`(§5.2.1)와 Avalanche Guardrail(§11.3)이 **근거가 아니라 제어(View/Control)** 로만 쓰이도록 금지 규칙이 명시돼 있는가
- `zone/phase/state_label` 최소 의미(§3.3.2)가 정의돼 있는가(문서 간 해석 충돌 방지)
### 5.2 Playbook(필수)
- gate 후보에 prior/injection 반영, stop-rule 분리
- boundary close에서 stats update + snapshot 커밋
- 실패 모드에서 guard rail 발동(진동/루미네이션/과신)


- `resource_load/state` 계산(§5.3.1)과 burst 감지(§5.3.2)가 Watchdog/다운시프트(§0.3.3)로 연결돼 있는가
### 5.3 Logging Appendix(필수)
- `STATE_SNAPSHOT`, `POLICY_UPDATE`, `INTERVENTION_*`, `PULSE_TRIGGER`, `PROBE_RUN` 스펙 존재
- 이벤트명/필드명이 Canonical/Playbook과 일치

---


- `STATE_SNAPSHOT.payload.metrics_optional`/`SCORE_REPORT.payload.wl_covariates`에 `WL_resource_*` 및 `Avalanche*`가 들어갈 위치/정의가 있는가

### 5.4 운영 가능성(테스트/가드레일) 완전 부착 조건
- `OPS_PLAYBOOK.md` §9.7.6 Gate Checklist v0.1(10개 must-pass)을 CI/회귀에서 돌릴 수 있어야 한다.
- 최소 요구: Gate-05/06/07/08(SRF/prior pipeline/Intervention/SketchPad)은 “필수 불변식”으로 취급(깨지면 개선이 아니라 붕괴).

### 변경 로그
- 2026-02-04 r20.1p4p8: JIT Construal Loop 결합 지점(A0h) + 이벤트/스키마 포인터 추가
- 2026-02-02 r20.1p4p4: COMP(Compressibility) 진단(6d) 추가 + comp_index 포인터 정합성 핫픽스
- 2026-01-22 r17: PSGR(ProgRAG-style) 결합 포인트 요약 + PROGRAG 이벤트 계약(Logging/Schema) 포인터 추가
- 2026-01-21 r16: Metacog Cycle(MUSE-lite) 결합 지점(A0c) 및 문서 포인터 추가
- 2026-01-21(r15): 자기진화(Artifact Self-Tuning) 가드레일/운영 규칙/로그 계약 포인터를 추가.
- 2026-01-21(r15p1): Iterative Deployment 루프 문서화(TraceCapsule→Dataset→ArtifactTune/Finetune) + Logging/Schema 이벤트 확장(DATASET_BUILD_*, FINETUNE_RUN_*).
- 2026-01-09(r2): 2409.16394v5(메모리→LRO) 반영 결합 포인트(§4.3) 추가. resource_state/avalanche를 Canonical/Playbook/Logging에 ‘스키마 확장 없이’ 연결하도록 체크리스트 갱신.
- 2026-01-03(r3): 파일 포인터/참조 정합성 정리(문서 간 r2/r3 혼재 제거).
- 2026-01-03(r2): 현행 파일명 포인터 정렬 + broadcast-amplification 리스크/진단 배터리 명문화.

---

## r17 추가: PSGR(ProgRAG-style) 결합 포인트 요약
- PSGR 루프는 Self-Graph(ClaimStore/IGL) 위에서 동작하는 “검색/프루닝” 운영 루프다.
- 권위 규약은 Canonical(§8) 우선, 이벤트/필드는 Logging Appendix + Schema bundle 우선.
- 문서 역할: Sidecar(6.2)는 인터페이스/정책 레버 요약, Playbook(5.1)은 구현 절차, Appendix는 이벤트 계약.
- PSGR 재현/회귀를 위해 아래 이벤트를 Raw Event Log에 남긴다(Logging Appendix §9.2, Schema bundle event_log.schema.yaml).
  - `PROGRAG_STEP_START/END`
  - `PROGRAG_SUBQUESTION`
  - `PROGRAG_RELATION_RETRIEVAL`
  - `PROGRAG_GRAPH_UPDATE`

## NetArch-G Wiring Note (r20.1p4p9)
- 이벤트 계약: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml` (MODE_SWITCH/BRIDGE_CALL/GRAPH_MAINTENANCE)
- 상태 필드: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/state_snapshot.schema.yaml` (state_core.control_mode_id)
- 분석 뷰: `SSOT_SCHEMA_BUNDLE.zip ▸ tools/ANALYSIS_STORE_DUCKDB_VIEWS_NETARCH.sql`
- 의미 분리: `MODE_SWITCH`(control_mode) ↔ `BEHAVIOR_STATE_SWITCH`(behavior_stage) 혼용 금지. (가능하면 `payload.scope` 사용)
- 호환: `ri_selfgraph`는 레거시 `RI_selfgraph`가 있을 수 있으니 분석/ETL에서 `COALESCE(ri_selfgraph, RI_selfgraph)`로 표준화.
