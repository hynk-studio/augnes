# Augnes Local OPS Playbook v2.2.2+30 (2026-02-19, r20.1p4p21)

> 패치: **(논문 아이디어 흡수) "Oscillatory control of cortical space as a computational dimension": Spatial Stencil Controller(SSC) 운영 레시피 추가 + HCM/PCF와 결합 + Logging(Stencil 지표) 포인터 + Wiring A0l 연결** (2026-02-19, r20.1p4p21)

> 패치: **(논문 아이디어 흡수) "End-to-End Test-Time Training for Long Context": UBB 기반 Parameter Memory(PM)/TTT-lite Session Adapter(경계-전용) 운영 레시피 추가 + Wiring A0n 연결** (2026-02-15, r20.1p4p20)


> 패치: **(ops gate) 운영 가능성 Gate Checklist v0.1(10개 must-pass) 추가 + PROBE `invariance_v0` 확장(SRF/prior pipeline) + Release must-pass 명문화** (2026-02-12, r20.1p4p19)

> 패치: **(운영 정합성) MN: `mn_conf` 기본 정의(부호 안정성×분산) + priors shared pipeline 동일 코드 경로 불변식 + `prior_pipeline_id` 로깅 권장** (2026-02-12, r20.1p4p18)
> 패치: **(논문 이식) "Hybrid neural–cognitive models reveal how memory shapes human reward learning": Memory-ANN-lite(MN) 운영 규정 추가(3.2.3e) + 로깅/예시 갱신** (2026-02-12, r20.1p4p17)
> 패치: **(논문 이식) "Causal evidence for prefrontal-motor coupling in reward-responsive goal-directed behavior": Goal→Action Coupling(G2A) 지표 + (옵션) ORAV(commit-hold/penalty, 약한 프라이어) 통합 포인트 추가 + 스키마 번들/예시 업데이트(호환 확장)** (2026-02-11, r20.1p4p16)
> 패치: **Render-of-Thought(arXiv:2601.14750v2) 기반 RoTTrace(렌더링된 CoT→단일행 이미지→비전 임베딩) 통합 포인트 추가** (2026-02-10, r20.1p4p15)
<!-- DOC_ID: PLAYBOOK -->
<!-- ROLE: 구현/운영 레시피 SSOT -->
<!-- SSOT: Ops-SSOT (implementation) -->

> **문서 역할:** 구현/운영 레시피 SSOT  
> **SSOT 지위:** Ops-SSOT (implementation)  
> **이 문서에서 허용되는 변경:** 어디서/언제/얼마나 계산하는지, 비용 캡, 근사/폴백. (필드 계약은 스키마 번들에서만)  
> **상위(업스트림) 기준:** SSOT_SCHEMA_BUNDLE.zip, SSOT_CANONICAL.md  
> **하위(다운스트림) 영향:** 실제 구현/파이프라인  

---

> 패치: **(논문 이식) "Macaque prefrontal cortex integrates multiple components for metacognitive judgments of working memory"(Ning et al., Neuron 2026): Meta-WM(working-memory confidence) = {wm_strength, uncertainty, trial_history, arousal} 통합 신호 → MUSE-lite/AVR의 전략 선택·opt-out(VERIFY/RETRIEVE/ASK) 게이트 + (권장) 이벤트 payload 확장(wm_meta, wm_dependency_hat) 포인터 추가** (2026-02-05, r20.1p4p14)
> 패치: **(AVR) ScoreReport/캘리브레이션/어블레이션 운영 루틴 추가: eval_suite_id/ablation_id 토글 고정 + remaining_steps_hat/cost_hat 오차/캘리브레이션 + Rubric/AuxMove ROI 측정 템플릿** (2026-02-05, r20.1p4p12)
> 패치: **(논문 이식) TongGeometry(arXiv:2412.10673v1): AVR 확장 — Metacog에 Value/Cost head 사용 레시피 + AuxMove(=Intervention candidate_injection) 템플릿 + RubricScorer(TraceCapsule 게이트) 운영 규칙 추가** (2026-02-05, r20.1p4p11)
> 패치: **(논문 이식) "The network architecture of general intelligence in the human connectome"(Wilcox et al., 2026): NetArch-G(Mode/Bridge/SmallWorld) 이벤트 계약(MODE_SWITCH/BRIDGE_CALL/GRAPH_MAINTENANCE) + STATE_SNAPSHOT.state_core.control_mode_id + DuckDB views(WL_netarch_*) 추가** (2026-02-04, r20.1p4p9)
> 패치: **(논문 이식) "Quantifying the compressibility of the human brain"(Weaver et al., 2026): Compressibility Curve(정규화 엔트로피 vs 상관 제약 비율) → CompIndex(저비용 프록시) + PROBE(comp_curve_v0) + Analysis Signal 축 + SRF/Downshift 트리거(권장)** (2026-02-02, r20.1p4p4)
> 패치: **(논문 이식) "Koopman Invariants as Drivers of Emergent Time-Series Clustering in Joint-Embedding Predictive Architectures"(AAAI 2026 / arXiv:2511.09783): KJEPA(near-identity linear predictor) 기반 무감독 레짐 분해 → DigitalTwin(macro_state_id)/BSL change-point/PROBE/Logging 결합** (2026-02-02, r20.1p4p3)
> 패치: **(뉴로모픽 모티브 이식) "Cerebellar components of the human language network"(Neuron 2025): CSB(Cerebellar Satellite Bank) 도입 — Sat-L(Δlogits)·Sat-M(Δpolicy_score) 출력 분리, SRF 블랙리스트 확장, CSB PROBE suite(선택성/혼합성/분리 위반) 추가** (2026-01-31, r20.1p4p2)
> 패치: **(논문 이식) "Structure in noise"(Neuron 2026): SA-axis 변동성(variability) 그래디언트 + recurrent connectivity/Reciprocity Index(RI) → VAR profile(QUENCH/RECURRENT) 레버·계측·PROBE·Self-Graph 연결** (2026-01-31, r20.1p4)
> 패치: **(논문 이식) arXiv:2601.14514v1 "Just in Time" World Modeling: JIT Construal Loop(Active Set) + LOOKAHEAD→PSGR 결합 포인트 + JIT_CONSTRUAL_* 이벤트 포인터 추가** (2026-02-04, r20.1p4p8)

> 패치: **정합성 핫픽스: 스키마 번들 파일명/경로 포인터를 r20.1p1로 갱신** (2026-01-30, r20.1p2)
> 패치: **정합성 핫픽스: ΔQ_hat/ΔQ_over_M(Budget Gain Estimates) 정의 추가 + 문서 포인터 정리** (2026-01-29, r20.1)
> 패치: **BG/Gate에 초소형 학습 기반 예측 신호(LPS) 추가(옵션) + 로깅/캘리브레이션 지표 연결** (2026-01-29, r20)
> 패치: **Stop-Rule Firewall(SRF) 명문화: τ_stop 입력 화이트리스트/블랙리스트 + ‘사실상 우회’ 경로 차단** (2026-01-30, r20.1p3)

> 패치: **(즉시 이식) Curation=조성(실패유형 타겟) + Frozen backbone+얇은 헤드 + eff-dim 기반 stochastic 보정 + (옵션A) SD VAE latent 워크스페이스 포맷** (2026-01-24, r19)

> 패치: **AR(추상성) PROBE suite + Latent Axis Bank + instruction-only 형식 수렴 레버 정식화** (2026-01-23, r18)

> 패치: **TRM/CGAR 운영 가성비 이식(PDC/halting/HSW) 도입 절차 추가** (2026-01-20, r14)
> 패치: **MUSE-lite(메타인지) 구현 가이드 추가: competence-aware strategy loop** (2026-01-21, r16)


> 패치: **PROBE suite 확장(titration/policy_sensitivity/invariance) + SSM-lite digital twin(macro_state_id) 구현 섹션 추가** (2026-01-19, r12)

> 패치: **Behavioral State Layer(BSL) 번역: session_start + bstage/bstate 라벨 + 로깅 포인터 추가** (2026-01-19, r12)

> 패치: **Hardware Envelope + Model Stack 운영 프로파일 추가** (2026-01-05, r1)

> 패치: **resource_load/resource_state + avalanche(burst) 감지 루틴 추가** (2026-01-09, r2)

> 패치: **문서 정합성 정리(파일명/용어 토큰 표준화 + 인덱스 번호 수정)** (2026-01-10, r4)

> 패치: **스키마 번들/참조 정리 + 정체 불명 산출물 언급 제거** (2026-01-10, r5)

> 패치: **Intervention 합성 셔플 불변성 테스트 + 스테이지 고정(pre/mid/post) + CSI 순서 교란 포함** (2026-01-13, r6)

> 패치: **SketchPad(저해상도 시각 스케치/latent) 인터페이스 + 계측 포인트 추가** (2026-01-13, r7)

> 패치: **Start Points(SP) 부록 통합 + BG/Axis/closure 계산·기록 위치 명시 + Sidecar(QP/z_t) 링크 정합화** (2026-01-14, r9)

> 패치: **/docs 권장 목록에 Sidecar/Research 포함 + SP 부록의 ‘단일 기준’ 문구 범위 고정** (2026-01-14, r10)

> 패치: **EOP++(wager) 실전 적용 섹션 추가: 예측-정산 이벤트 흐름 + QP/Sidecar 입력 연결 + 로컬 예산 단위(stake_unit) 규약** (2026-01-20, r13)

> 상태: **Implementation / Operational Guide**  
> 종속: `SSOT_CANONICAL.md` (Canonical Spec, patched 2026-01-09 r2)
> 스키마: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/*.schema.yaml` (스키마 번들 내부 경로)  
> 메트릭/로그 상세: `SSOT_LOGGING_POLICY.md`
> 목적: **코드로 옮기는 데 필요한 결정/절차/디버깅 루틴**을 명시한다.

---

## 0. 이 문서의 역할

- 이 문서는 “어떻게 구현하고 운영하는가”에 대한 **실행 가이드**다.
- **정의/규약/필수 조건**은 Canonical Spec을 따른다.
- 충돌 시 우선순위: **Canonical Spec > Logging Appendix/Schema > Sidecar Spec > Ops/Playbook > Research Appendix**

---

## 0.1 설계 패턴 인덱스(논문 기반 인사이트의 구현 위치)

이 프로젝트는 “생물학적 계산” 논문에서 뽑은 요구(하이브리드 계산/멀티스케일 결합/예산 내장/동역학-구조 공동결정)를 **코드로 구현 가능한 패턴**으로 내재화한다.
아래는 패턴 이름과 “정식 정의가 있는 문서/섹션”의 인덱스다(중복 서술은 하지 않는다).

1) **Budget-Embedded Runtime**: 예산이 옵션이 아니라 런타임 규약  
   - Canonical: Budget & Guardrails(§11), Gate(EVC) 비용항  
   - Appendix: `policy_levers`, `ΔCost`/WL covariates

2) **Continuous Meta-State Bus (Sidecar eₜ)**: 연속 메타상태가 정책 레버를 제약  
   - Canonical: Step Loop(§4) IM 업데이트, 안정화 규약  
   - Appendix: `STATE_SNAPSHOT`/`INTEROCEPTION_TICK`
     - (추가, 권장) `STATE_SNAPSHOT.payload.metrics_optional`에 `resource_load/resource_state/avalanche_index`를 함께 기록(스키마 확장 불필요)

3) **Hybrid Gate (continuous→discrete)**: 연속 신호(PE/eₜ/EVC) → 이산 액션(VERIFY/RETRIEVE/REPLAN/COMMIT)  
   - Canonical: Gate(EVC)(§5)  
   - Appendix: `GATE_DECISION`/`JML_ENTRY`

4) **Oscillation Damping**: 히스테리시스/쿨다운/min-dwell/stop-rule로 발작 억제  
   - Canonical: Gate 안전장치(§5), Budget & Guardrails(§11)  
   - Appendix: `cooldown_state`/`dwell_state`/안정화 룰

4a) **Spatial Stencil Gating (ContextStencil)**: task-conditioned inhibitory stencil로 “컨텍스트 공간”을 soft-gating  
   - Canonical: TRL Routing(§4.1.0) optional `context_stencil` + Workspace Stencil(§9.4a)  
   - Playbook: SSC 레시피(§6.3.1d) + HCM(§6.3.1a) 결합  
   - Sidecar: Axis→Space gating 메모(§2.8.8)  
   - Logging: `STATE_SNAPSHOT.payload.metrics_optional.artifact_tuning.context_stencil.*` + (옵션) PROBE `stencil_v0`  
   - Wiring: (A0l)

5) **Boundary as Scale Integrator**: 경계에서만 요약(뷰)·스냅샷·그래프 갱신을 커밋  
   - Canonical: Boundary & Episode(§10) + Step Loop(§4)  
   - Appendix: `EPISODE_SNAPSHOT`/`STATE_SNAPSHOT`

6) **Intervention Library + Self-Graph Retrieval**: 개입 분류(Param/Policy/Structural/Learning) + Top-K 재사용  
   - Appendix: Intervention Library 섹션  
   - Playbook: 운영/디버깅 루틴

7) **Aligned Markers → Ops Markers**: ‘의식 마커’가 아니라 운영 마커(통합/안정/생산성)로 계측  
   - Appendix: `ΔStab`, sigma/J 지표, ScoreReport

8) **Broadcast Distance Loop (EOP + Self-Reflection)**: 예상-관측 비교(EOP++) + 내적발화(거리감)로 오류/불일치를 빠르게 드러냄
   - Canonical: Predict(EOP) + Gate action `SELF_REFLECT`(§4, §5)
   - Appendix: `EXPECTED_OUTCOME_PACKET`, `PREDICT_OBS_COMPARE`, `SELF_REFLECT_*` 이벤트 + 루미네이션 지표

8b) **Persistent Executive Core (System 3)**: Thought Search + Process Supervision + Reflection을 “상시 루프”로 운영  
   - Canonical: Executive Core 포인터(§4.1) + Self-Reflection(§5.6) + Boundary(§10.2)  
   - Appendix: `DRIVE_STATE_UPDATE`, `GOAL_SET`, `TRACE_CAPSULE_*` 이벤트

8c) **Forward Learning via TraceCapsule**: 성공/실패 경로를 캡슐화해 반복 과제 비용을 깎음(가중치 업데이트 없이)  
   - Canonical: `TraceCapsule` 타입(§3.3) + 종료 시 커밋(§10.2)  
   - Appendix: `TraceReuseHitRate`, `StepReductionOnReuse`


8d) **Visual SketchPad / SketchLatent (저해상도 시각 스케치)**: “텍스트로 유지하기 비싼 구조”를 초저해상도 스케치로 고정해 작업/자기모델링에 재사용  
   - Canonical: SketchPadState(§3.3.3) + Step Loop의 Update IM + SketchPad(§4)  
   - Appendix: `WL_sketch_*`, SketchPad 안정성 지표 + `SKETCHPAD_UPDATE`/`STATE_SNAPSHOT` 확장  
   - Playbook: SketchPad 통합 메모(§3.2.2)


9) **Self-Graph Structural Plasticity (HAG)**: Influence/Association 엣지를 homeostasis 기반으로 grow/prune (Boundary에서만 커밋)
   - Canonical: Claim System(Self-Graph) Influence 레이어(§8.3) + Boundary(§10) + Budget & Guardrails(§11)
   - Appendix: `GRAPH_EDGE_UPDATE`(+HAG 메타)Graph stability 지표

10) **Slow-Variable Resource Reservoir (LRO) + Avalanche Guardrail**: fast/slow 분리에서 전역 동조가 생길 수 있으니, `resource_*`(비용항) + burst 감지로 supercritical 다운시프트를 건다.
   - Canonical: `resource_load/resource_state`(§5.2.1), Avalanche Guardrail(§11.3), StateLabel/Zone(§3.3.2)
   - Appendix: ΔStab(Avalanche/Burst), WL covariates(resource) + State→Policy Map(zone overlay)


10b) **SRP Protocolization (Self-Reflection as Protocol)**: `SELF_REFLECT`를 프로토콜/컨트롤/출력 포맷으로 고정하고, IQS/SCS/HAP 프록시로 “쓸모 vs 루미네이션”을 계측
   - Canonical: Self-Reflection + SRP 프로파일(§5.6, §5.6.1) + Budget(§11)
   - Appendix: `SELF_REFLECT_START/END` payload + IQS/SCS/HAP 정의



11) **Batched Candidate Selection + Periodic Reset (CBS/PR)**: 후보 K개 생성 → 연속성(continuity)·EVC 기준으로 선택, 정체/실패 반복 시 리셋으로 탈출
   - Canonical: Gate 과잉반응/진동 억제(§5.4) “권장 안정화”  
   - Appendix: `CANDIDATE_BATCH_GENERATED`/`CANDIDATE_SELECTED` + continuity/reset 지표

12) **Jerk-Limited Updates (2nd-order damping)**: 정책 레버/Sidecar 업데이트에서 `Δ²`(가속도/jerk)를 제한해 급발진을 막는다
   - Canonical: IM 안정화(§4) + 진동 억제(§5.4)  
   - Appendix: `policy_smoothing_w` + `POLICY_SMOOTHING_APPLIED`, `PolicyJerkP95`, `SidecarJerkP95`



13) **BCP/Micro-Motif Decomposition**: ‘큰 기능’을 쪼개서 **더 이상 줄일 수 없는 블록(프리미티브)** 조합으로 본다(논문의 BCP 개념 이식)
   - Canonical: Step Loop(§4) / Gate(§5) / Budget(§11) 는 “프리미티브 합성 규약”
   - Playbook: 실패 모드 7가지(§4) / Gate 구현(§5) 을 프리미티브 단위로 테스트
   - Appendix: 이벤트/메트릭을 프리미티브 단위로 계측(`MODULE_CALL_*`, `GATE_DECISION`, `STATE_SNAPSHOT`)

14) **ICN-Proxy(EES) Early Error Prediction**: ‘초반에는 그럴듯하지만 나중에 틀릴’ 경로를 조기에 잡는 신호
   - Canonical: `EES`(조기 오류 신호) 정의 + Step Loop 권장 단계(§4)
   - Appendix: `state_core.ees_w` + `EES_*` 지표 + State→Policy Map 입력
   - Playbook: `compute_ees()` 구현 + VERIFY 트리거/히스테리시스(§5, §13)

15) **Synchrony & Loop-Maintenance as Health Signal**: 모듈 간 “동기화(협응)”가 깨질수록 실수/진동이 늘어난다(논문에서의 cortico-striatal beta synchrony를 공학 번역)
   - Appendix: `ModuleSynchronyIndex`, `LoopMaintenanceIndex` 지표 + 이벤트(`SYNC_ESTIMATE` 등)
   - Playbook: 실험/대시보드에서 “성공=동기화↑, 실패=동기화↓” 가설을 검증(§11)



16) **AR(Abstractness Ratio) PROBE**: 최소 컨텍스트에서 변수(C_min/R/O)가 분리되어 잡히는지(표현의 ‘추상성’)를 계측
   - Canonical: PROBE 규약 + AR 정의(§5.1.1.2)
   - Appendix: `PROBE_RUN_*` 확장 키 `abstractness_ar` + signals 축(§12.2, §12.4.4)
   - Playbook: 실행 프로토콜(§9.1.5)

17) **Latent Axis Bank(LAB) / Axis Bank**: z_t/backbone에서 뽑는 저차원 축을 “레지스트리+버전”으로 운영
   - Sidecar Spec: LAB 정의/승격/드리프트(§2.8)
   - Appendix: `axis_bank` 확장 키 + signals 축 `LAB_*` (§12.2, §12.4.4)
   - Playbook: 빌드/검증 루프(§9.1.6)

18) **Instruction-only Format Convergence(IFC)**: 지시만으로도 형식이 수렴하는 특성을 ‘계약/스키마 레버’로 사용
   - Playbook: Contract 적용(IFC) (§2.3)
   - Sidecar Spec: OUTPUT_CONTRACT 패턴(§6.5 보강)
   - Appendix: `format_convergence` 확장 키 + signals 축 `FMT_*` (§12.2, §12.4.4)


> 주의: 위 패턴은 “추가 규약”이 아니라, Canonical/Appendix에 이미 존재하는 규약을 **찾기 쉽게 묶은 인덱스**다.



19) **Compressibility Signals (CompIndex/CompCurve)**: 반복(과압축) vs 산만(저압축)을 저비용으로 잡아 SRF/Downshift/줌인 트리거로 사용  
   - Canonical: COMP 프로브 정의 + SRF whitelist에 `CompIndex_*`(§5.1.1.5, §5.3.1)  
   - Appendix: `Comp_*` 신호축 + `STATE_SNAPSHOT.payload.metrics_optional.comp_index` 로깅(§12.2, §12.4.4)  
   - Playbook: `compute_compindex()` 구현 + 오프라인 `CompCurve_glasso_v0` 루틴(§8.5, §9.1.6)


## 0.2 (배경) HOLISTIC 논문 번역: inner speech를 ‘운영 제어’로 쓰는 이유 (Non-normative)
- 원 논지(요약): inner speech는 ‘말을 느끼고 듣는’ 코어 생산 회로 + 전뇌에 분산된 연합/정서/감각-운동 표현(퍼리퍼리)을 자극하고,
  그에 대한 **선택된 응답**이 네트워크 활동을 유지한다.
- Augnes 번역(공학적):
  - **Core(내적발화 생성)** = `SELF_REFLECT` (짧고 구조화된 저대역 발화)
  - **Periphery(연합 활성)** = 기존 Retrieval/Memory/툴 결과가 ‘연합 표현’을 공급(필요할 때만 고대역 재계산)
  - **Selection(문맥 관련 응답 선택)** = Gate(EVC) + 정책 레버(쿨다운/예산)
  - **Efference copy(예상 결과)** = EOP(Expected Outcome Packet) + `PREDICT_OBS_COMPARE`
- 포인트: self-reflection은 ‘추론을 늘리는 장치’가 아니라, **표기 체계(서술 방식)를 한 번 바꿔서** 자기 불일치/근거 부족을 더 잘 드러내는 장치다.
  그래서 예산/쿨다운을 걸어 **루미네이션만 막으면**, 비용 대비 효율이 괜찮은 편이다.

## 0.3 하드웨어·모델 운영 프로파일 (현실 제약 반영, 권장 최소)

> 목적: “문서는 우아한데 12GB VRAM에서 터지는” 일을 방지한다.  
> 원칙: **모델 ‘이름’ 고정이 아니라 ‘규모/역할/상주 정책/예산 레버’** 를 고정하고, 체크포인트는 교체 가능하게 둔다.  
> 권위: 이 섹션은 **Ops 기본값(Default Profile)** 이며, Canonical의 규약(예산/가드레일/권위 분리)을 바꾸지 않는다.

### 관련 운영 적용안(통합됨)
- 가성비 1등(A-PCI/ΔPCI)과 가성비 2등(CSI + Bias-Sensitivity) 적용안은 별도 Ops Notes로 분리하지 않고,
  - 본 문서 §9.1.1, §9.5, §9.6
  - `SSOT_LOGGING_POLICY.md`의 §11.7, §13.7.1, §13.6.4
  에 **통합**되어 있다.

### 0.3.1 Hardware Envelope (Default: 4070 SUPER 12GB + RAM 32GB)

- GPU VRAM: **12GB** (운영 상한 `vram_cap_mb=10500` 권장; 단편화/오버헤드 안전지대 포함)
- System RAM: **32GB**
- 런타임: **Ollama/llama.cpp 우선**
- 허용 전략: QLoRA 4-bit(NF4) 기본 채택, 필요 시 **CPU/NVMe 오프로딩 + KV 오프로딩 허용**

**하드 컷(권장 최소)**
- `max_gpu_jobs=1` (GPU 동시 추론 금지: 백본 추론 중 verifier를 GPU에서 병렬 실행하지 않는다)
- `default_ctx_cap=8k` (기본 목표. 운영 중 스파이크 시 자동 강등)
- `vram_soft_guard_mb=9500`, `vram_hard_guard_mb=10500`
- `multisample_default=forbid` (R5_MULTISAMPLE는 조건부)

### 0.3.2 Model Stack (Default Roles & Residency)

기본 규칙: **GPU에는 백본 1개만 상주**.


**(r19 기본값) Frozen backbone + 얇은 헤드 패턴**
- Backbone은 **추론용으로만 유지(동결)**. 운영 개선은 아래 “얇은 헤드”를 우선으로 한다.
  - `router_head`: route_tier/gate_prior 추천(저비용 분류/회귀)
  - `verifier_head`: pass/fail/리스크 점수(저비용 판별)
  - `sidecar_head`: e_t/QP/z_t 보정(저차원 상태 추정/정규화)
- 헤드는 CPU 상주/로딩 가능(수 MB 단위). 승격/롤백은 ArtifactTune로 관리한다(§6.4, §12).
 나머지 모듈은 CPU 상주 또는 “필요 시 순차 호출(로드/언로드)”을 기본값으로 둔다.

- **Backbone / Generator (GPU 상주)**  
  - 규모: **7B 급**, 4-bit inference quant  
  - 역할: 생성/계획/도구 사용/최종 응답  
  - 기본 컨텍스트: `ctx=6k~8k` (8k 상한, 필요 시 6k/4k로 강등)

- **TRL Router (CPU 상주 권장)**  
  - 규모: **초경량(임베딩+선형/작은 MLP)** 또는 0.xB~1B급  
  - 역할: `route_tier`, `context_profile`, (opt) `budget_profile_id`를 **prior로만** 제안(결정권 없음)

- **Verifier (CPU 기본 + 조건부 호출)**  
  - 기본: 규칙 기반 + 스코어러(형식/근거/툴결과 일치 검사, 간단한 모순 탐지)  
  - 조건부: 필요 시만 1.5B~3B급 “검증 전용” 모델을 **순차 호출**(GPU 병렬 금지)

- **Summarizer / Compressor (CPU 상주)**  
  - 규모: 규칙 기반 또는 0.5B~1.5B급  
  - 역할: PCF(Context Folding), 요약/압축/핀/에빅션 후보 실행(뷰 생성)

- **Embedding / Retrieval (CPU 상주)**  
  - 역할: Evidence/Claim/Intervention/Self-Graph Top-K 검색

### 0.3.3 Runtime Guardrails: “안 터지게 만드는” 자동 다운시프트

아래는 **Gate 이전(또는 Observe 직후) Watchdog** 로 구현하는 것을 권장한다.  
원칙: 성능보다 **안정(중단/폭주 방지)** 을 우선하며, 모든 변화는 `POLICY_UPDATE`/`STATE_SNAPSHOT`에 기록한다.

**Trigger(예시, 권장)**
- `Cost_vram_peak_mb > vram_hard_guard_mb` 또는 VRAM 급등(짧은 윈도우 내 p95 급변)
- `Cost_latency_p95_ms` 급등(기준 대비 배수 초과)
- `PolicyFlipRate`↑ + `EES_p95`↑ (진동 + 조기 오류 동시 상승)
- (추가, 권장) `AvalancheIndex`↑ 또는 `activity_burst` 지속(아래 §5.3.2)

**Action(다운시프트 규칙, 우선순위)**
1) `R5_MULTISAMPLE` 차단(즉시) + `branching_cap` 하향
2) 컨텍스트 상한 강등: `8k → 6k → 4k`
3) `retrieval_budget`는 “짧고 많은” 방향(Top-K)으로, `verifier_budget`는 규칙 기반 우선으로 전환
4) 요약/압축 강제(PCF) + 메모리 write_budget 보수화
5) 쿨다운/히스테리시스 강화(`cooldown_steps↑`, `min_dwell↑`, `τ_stop` 보수화)

> 금지: 다운시프트가 “근거(Evidence)”를 대체하는 방향으로 작동하면 안 된다.  
> 예: 요약 뷰를 근거로 승격, verifier 출력을 Evidence로 승격 등은 금지.

### 0.3.4 Route-Tier → Budget Profile 매핑(권장 템플릿)

`trl_route_assess()`는 `route_tier`를 내고, (선택) `budget_profile_id`를 제안할 수 있다.  
최종 적용은 Gate(EVC)가 하며, jerk-limit/clip/cooldown을 항상 통과해야 한다.

- **R0_DIRECT**: tool/retrieval/verifier 최소. `plan_depth` 낮게.
- **R1_RAG**: `retrieval_budget↑` (근거 확보 우선), verifier는 중간.
- **R2_CODE**: verifier(테스트/정적검사/툴 결과 검증)↑, branching 제한.
- **R3_PLAN**: `plan_depth↑` (단, `τ_stop`/쿨다운 강화), retrieval은 필요 시.
- **R4_MICROSEARCH**: tool/retrieval 쿨다운 및 호출 상한을 명시(폭주 방지).
- **R5_MULTISAMPLE**: 기본 금지. 오프라인/배치 평가 등 **조건부**로만 허용.

### 0.3.5 Tuning Policy(튜닝은 트리거 기반, 기본값은 no-tune)

이 프로젝트의 기본 목표는 **가중치 업데이트 없이 메모리/정책/구조로 지속성+자기주도+비용절감**을 달성하는 것이다.  
따라서 튜닝은 “항상”이 아니라 **명시된 트리거**에서만 수행한다.

- **Backbone LoRA/QLoRA (조건부)**  
  - 범위: 지식 추가가 아니라 **운영 습관**(툴 포맷/근거 규율/라우팅 순응/stop-rule 준수)  
  - 트리거(예시): 동일 유형의 정책 위반/툴 실패가 누적, Evidence/Claim 규약 반복 위반, 루미네이션 고착

- **Router 튜닝(권장)**  
  - 라벨: `route_tier`, `context_profile`, `budget_profile_id`  
  - 데이터: 운영 로그(JML/이벤트)에서 쉽게 수집 가능. 비용 대비 효용이 큼.

- **Verifier 튜닝(후순위)**  
  - 기본은 규칙+스코어러로 두고, 정말 필요할 때만 소형 모델을 호출한다.  
  - LLM verifier 자체 튜닝은 비용 대비 효용이 애매하므로 마지막에 고려.


## 1. 레포 구조(권장)와 산출물


권장 디렉터리(업로드/배포 기준):

```
00_INDEX_LATEST.md
SSOT_CANONICAL.md
SSOT_LOGGING_POLICY.md
OPS_PLAYBOOK.md
WIRING_INTEGRATION_MAP.md
MODULE_SIDECAR_QP_ZT_SUMMARY.md
APPENDIX_GNWT_IIT.md
CHANGELOG_PATCHLOG.md
SSOT_SCHEMA_BUNDLE.zip
```

산출물의 “진짜 계약서”는 `SSOT_SCHEMA_BUNDLE.zip ▸ schema/`이며, `SSOT_SCHEMA_BUNDLE.zip ▸ examples/`는 테스트 벡터다.  
(레포로 옮겨서 zip을 풀면 보통 `/schema`, `/examples`로 매핑된다.)


---

## 2. 데이터 계약(Contract) 적용 방식

### 2.1 스키마 검증은 “저장 전(ingest/commit 시점)”에 강제
- Evidence Registry, JML, Raw Event Log는 **저장 전에 schema validation**을 통과해야 한다.
- 실패 시:
  - 저장 금지(또는 quarantine 영역으로 격리)
  - 원인(누락 필드/형식/조건부 required)을 이벤트로 남긴다.

### 2.2 레거시/별칭 필드 정규화(필수)
다음은 “입력에서 허용”할 수 있으나 저장은 canonical 형태로 정규화한다.

- `model_internal` → `model_inference` (Evidence `source_type`)
- `t` → `recorded_time` (JML 엔트리)
- `verify_budget`/`verification_budget` → `verifier_budget` (정책 레버)

정규화는 **ingest 단계**에서 수행하고, 원본 값은 필요 시 `payload.legacy_*`로 보관한다.


### 2.3 (NEW) Instruction-only 형식 수렴(IFC)을 “스키마/프롬프트 레버”로 쓰는 법
현대 LLM은 **지시(instruction)만으로도 출력 형식이 수렴**하는 경우가 많다. 이걸 “감성”이 아니라 **계약(Contract) 레버**로 쓴다.

- 목적:  
  - (1) `SELF_REFLECT`, `TRACE_CAPSULE`, Verifier 루브릭 같은 *저대역 프로토콜 출력*을 **항상 같은 모양**으로 만들기  
  - (2) “형식 안정”과 “내용 정합”을 분리해서 디버깅하기
- 사용 규칙(필수):  
  - IFC는 **형식 제어 장치**다. 내용의 진실성/정합을 보장하는 근거로 쓰지 않는다.  
  - “형식은 맞는데 내용이 이상함”은 정상이다. 그건 VERIFY/Probe에서 잡는다.
- 최소 구현(권장):  
  1) 프롬프트에 `OUTPUT_CONTRACT` 블록을 둔다(고정 텍스트).  
  2) 출력은 “키 집합 고정 + 타입 고정 + 순서-불변”으로 정의한다(JSON/YAML 중 하나만).  
  3) ingest 단계에서 스키마 검증(또는 구조 lint) 실패 시 저장 금지/격리.  
- 계측/회귀(권장):  
  - `analysis_signal`에 `FMT_valid_rate`, `FMT_invalid_rate`, `FMT_schema_mismatch_rate`를 뽑는다.  
  - IFC가 세면 “형식은 좋아지는데 PS_repr(형식 민감도)가 올라가는” 부작용이 생길 수 있으니, AR/불변성 PROBE로 같이 본다(§9.1.5, §9.1.4).

---

## 3. 런타임 Step Loop 구현(필수 골격)

### 3.1 한 턴의 최소 인터페이스
입력:
- `user_input` (텍스트)
- `tool_results[]` (툴 결과)
- `retrieval_results[]` (검색 결과)
- `runtime_state` (Sidecar eₜ, budgets, cooldowns, **state_label/dwell**, episode 상태)

출력:
- `assistant_output` (텍스트)
- `actions[]` (툴 호출/검색/검증/리플레이 등)
- `commits` (Evidence/JML/Claim/Workspace 업데이트)

### 3.2 Step Loop 의사코드(가이드)
```text
step(user_input, runtime_state):
  obs = observe(user_input, tool_results, retrieval_results)

  # STAGE: PRE (Observe~Boundary)
  # - tagging/스냅샷만 허용. Intervention retrieval/합성/정책 변경 금지.

  # 0.5) TRL Routing (Task×Context, 권장)
  # - intent/응답분포 + 컨텍스트 정책(PCF) + 검색/툴/검증 프라이어를 저비용으로 태깅
  # - 출력은 Control/View이며 Evidence로 승격 금지
  route = trl_route_assess(obs, runtime_state)  # {intent_class, evidence_mode, search_mode, context_profile, route_tier, (opt) budget_profile_id}

  # 0.75) Pre-covariates (권장)
  # - WL_* / budgets / guardrails는 "제어 상태"다. Evidence/Claim 승격 금지.
  workload = estimate_workload_covariates(obs, runtime_state, route)   # WL_* (optional)
  budgets = runtime_state.budgets                                     # 현재 예산(후속 BG로 조정 가능)
  guardrails = runtime_state.guardrails                               # 변화율/클리핑/캡(구현체)

  # 1) Evidence ingest (외부 사실은 Evidence로만)
  new_evidence = ingest_evidence(obs)                       # schema validate
  evidence_id = registry.insert_or_link(new_evidence)       # dedupe by immutable_hash; never overwrite content

  # 2) Predict / PE compute
  pred = predict(runtime_state, obs)                        # optional
  eop = maybe_build_eop(pred, runtime_state, obs)           # 권장: tool/고비용 action 예정 시
  if eop:
    log_event(EXPECTED_OUTCOME_PACKET, eop)
  pe = compute_pe_channels(pred, obs)                       # PE_lm/PE_tool/PE_goal/PE_memory

  # 2.25) Early Error Signal (EES, ICN-proxy)
  # - '나중에 틀릴' 경로를 조기 감지해서 commit 전에 VERIFY로 튕기는 트리거
  ees = compute_ees(runtime_state, obs, pred, pe)           # 0..1 (+components)

  # 2.5) Executive Core overlays (System 3, 권장)
  # - user_model/drive_state/goal_stack는 Evidence가 아니라 "제어 상태"다.
  user_model = maybe_update_user_model(runtime_state.user_model, obs)                              # optional
  drive_state = update_drive_state(runtime_state.drive_state, pe, user_model, budgets, ees=ees)    # beta 포함 (+EES)
  goal_stack = update_goal_stack(runtime_state.goal_stack, obs, drive_state)                       # extrinsic 우선, idle이면 intrinsic 가능

  # 3) Update Sidecar e_t (stabilize)
  #    - 필수: EMA/클리핑/Δ cap
  #    - 권장: Δ² cap(가속도/jerk)까지 제한해서 급발진 억제
  e_t = update_sidecar(runtime_state.e_t, pe, workload, guardrails)

  # 4) Boundary check (multi-signal)
  # NOTE: Boundary는 (A) 스텝 시작에 'close if needed'로 실행될 수 있고,
  #       (B) 액션 후/스텝 종료에 'commit snapshot/index'로도 실행될 수 있다.
  boundary = boundary_detector(runtime_state, pe, obs, e_t)

  # 4.25) Behavioral State Layer (BSL, 권장)
  # - 세션 내부 행동 상태(bstate) + 조잡한 단계(bstage) + 세션 시작 변화점(session_start) 포착
  # - 주의: 이건 STAGE(PRE/MID/POST)랑 다른 개념이다(접두사 behavior_로만 다룸)
  bsl = update_behavior_state_layer(runtime_state.behavior_state, obs, pe, e_t, boundary)
  runtime_state.behavior_state = bsl

  # 4.5) SketchPad update (optional)
  # - sketch_self: boundary 기준 갱신(진동 억제)
  # - sketch_task: MID stage에서만 갱신(공간/도식/경로/구조 유지가 유리할 때만)
  sketchpad = maybe_update_sketchpad(runtime_state.sketchpad, obs, pe, e_t, route, budgets, boundary=boundary, stage="PRE")

  # 4.75) Derive state_label (zone×phase) + build state_labels + apply policy bias
  state_label = derive_state_label(pe, e_t, workload, boundary, runtime_state)
  state_labels = build_state_labels(state_label, bsl, pe, e_t, boundary, runtime_state)  # 최소: [state_label]
  # - 권장 라벨: session_start, bstage/<S1..S3>, bstate/<id> (confidence>=theta일 때만)

  policy_levers = apply_state_policy_map(state_labels, runtime_state.policy_levers)
  policy_levers = apply_route_profile(policy_levers, route)  # route가 권장하는 budget/profile/prior를 '편향'으로만 합성

  runtime_state.state_label = state_label
  runtime_state.state_labels = state_labels
  runtime_state.policy_levers = policy_levers

  if boundary.close_episode:
    commit_episode_snapshot(runtime_state, episode_id, state_label, policy_levers)
    log_event(STATE_SNAPSHOT, {
      payload:{
        state_core:{
          e_t,
          pe_w,
          zone,
          state_label,
          state_labels,
          behavior_state:bsl,
          policy_levers,
          route_last:route.meta_compact
        },
        cooldown_state,
        runtime_limits,
        metrics_optional,
        recent_trace_compact
      }
    })

    # (권장) Forward Learning: TraceCapsule 생성/커밋 (반복 과제에 한정)
    trace = maybe_build_trace_capsule(goal_stack, obs, pe, actions_history, tool_history)
    if trace:
      log_event(TRACE_CAPSULE_COMMIT, trace.meta_only)    # 원문은 ref로 분리
      memory.write(trace.store_payload)                   # schema validate
      runtime_state.trace_index.upsert(trace.reuse_key, trace.trace_id)

    maybe_summarize_view(runtime_state, episode_id, workspace_pointers)
    update_self_graph_edges_claim_layer(claim_ops)        # revises/supersedes/contradicts only (no overwrite)
    update_self_graph_edges_influence_layer_hag(
      runtime_state,
      episode_id,
      mode=policy_levers.self_graph_update_mode
    )                                                     # (옵션) ΔW는 항상 로그


  # STAGE: MID (Staging = Boundary 이후, Gate 이전)
  # - Intervention retrieval→합성→클리핑을 여기서만 수행한다.

  # 4.90) Intervention/Policy overlay (Top-K, 권장)
  # - 목적: Gate 앞에서 "후보/프라이어/레버"를 제한적으로 보정하되, override/근거 우회는 절대 금지
  interventions = retrieve_interventions_topk(
    state_labels=runtime_state.state_labels,
    route_tier=route.route_tier,                         # TRL Router (권장: R0~R5)
    cooldown_table=runtime_state.cooldown_state,
    k=policy_levers.intervention_topk
  )

  # r6) 합성 결정론: merge 전에 canonical sort(순서 의존성 제거)
  interventions = canonical_sort_interventions(interventions, key=(priority_desc, id_asc))

  # (선택) 회귀/디버그 모드에서 셔플 불변성 테스트를 수행하고 로그로 남긴다.
  shuffle_inv = maybe_run_shuffle_invariance_test(interventions, k=8)

  # policy_delta는 jerk-limited + budget-clipped + guardrails 통과 후에만 적용
  policy_delta, gate_prior, injections, decision_record = aggregate_policy_delta_jerk_limited(
    interventions,
    current_levers=policy_levers,
    budgets=budgets,
    caps={
      prior_clip: policy_levers.intervention_prior_clip,
      injection_cap: policy_levers.intervention_injection_cap,
      delta_cap: policy_levers.intervention_policy_delta_cap
    }
  )

  policy_levers = apply_policy_delta(policy_levers, policy_delta)
  runtime_state.policy_levers = policy_levers
  runtime_state.gate_bias = {prior: gate_prior, injections: injections}  # view only
  log_event(POLICY_UPDATE, decision_record)                              # payload는 schema/appendix에 맞춤 (policy_levers_before/after 필수)


  # 5) Gate decision (GUP + EVC)
  action = gate_select_action(runtime_state, pe, e_t, boundary, budgets)

  # 6) Execute / Iterate
  if action.requires_tool:
    tool_result = run_tool(action.tool_name, action.args)
    log_tool_events(action, tool_result)  # TOOL_CALL_START/END + tool_run_id + latency_ms + immutable_hash
    if eop:
      log_event(PREDICT_OBS_COMPARE, compare(eop, tool_result))
    loop with updated obs/pe within budgets


  # STAGE: POST (Execute/Commit)
  # - 결과 반영(EMA/쿨다운/통계)만 허용. retroactive 합성/우회 금지.

  # 7) Commit (JML + Workspace + Claims)
  # - Self-Model/DriveState는 View로 갱신하고 스냅샷에 포함(근거는 ID로 분리)
  jml.append(entry)                             # schema validate, 3-time semantics
  workspace.update(pointers/summaries/evidence_refs)
  maybe_update_claims(claim_proposals, validator, evidence_registry)  # no overwrite; edges only

  return assistant_output, runtime_state
```





### 3.2.x BSL 구현 메모(짧게)
- `update_behavior_state_layer()`는 “정교한 행동 모델”이 아니라 **얇은 online 추정기**로 시작한다.
  - 입력 후보: (a) 최근 K-step 성능/오류 패턴, (b) 좌/우/선택 편향 같은 task-특화 feature, (c) 반복/고집(perseveration) 지표, (d) 세션 경계 플래그.
- 출력은 `behavior_state_id/behavior_stage_id/session_pos_norm/confidence`만 확실히 맞추고, 나머지는 분석 스토어(옵션 A)에서 고급 모델로 보강한다.
- 라벨 사용은 보수적으로: confidence 낮으면 **라벨을 안 붙이는 게 정답**이다.
### 3.2.1 TRL Router 통합 메모(구현 가이드)

- **위치**: `observe()` 직후(최저 비용) → 결과를 `apply_route_profile()`로 policy_levers에 반영 → `route_tier`는 Staging(Intervention retrieval) 입력으로 사용.  
- **핵심 원칙**: 라우터는 “결정”이 아니라 **편향(prior)** 이고, Gate(EVC)가 최종 결정을 내린다.  
- **컨텍스트 정책(PCF)**: `route.context_profile`은 `workspace_token_cap`/Boundary close/EES/PE_memory 등에 의해 `FOLD_SUM/FOLD_COMMIT/PIN/EVICT` 후보를 제안할 수 있다.  
  - 실제 실행은 `SUMMARIZE/MEMORY_COMPRESS/MEMORY_PRUNE/TRACE_CAPSULE_COMMIT` 같은 action으로 떨어지며, 펄스 규약/RC(복구 계약)를 위반하면 금지.  
- **solve 오염 방지**: route 판단(특히 “이건 RAG 해야 한다” 같은 메타)은 가능한 한 답변 컨텍스트에 직접 넣지 말고, 로그/스냅샷에만 남긴다.  

권장 최소 출력(스키마는 느슨):
- `intent_class`: convergent|divergent|mixed  
- `route_tier`: R0_DIRECT|R1_RAG|R2_CODE|R3_CWM|R4_MICROSEARCH|R5_MULTISAMPLE  
- `evidence_mode`: parametric_only|evidence_enabled|audit_first  
- `search_mode`: none|microsearch|adaptive  
- `context_profile`: t0_only|fold_to_t1|commit_to_t2  


---


### 3.2.2a Forecast/Calibration hooks (EOP++) (권장)

> 목적: 오픈엔디드 과업에서도 “내가 얼마나 과신/과소신하는지”를 계측 가능한 신호로 만들기.
> 원칙: EOP는 Evidence가 아니라 **제어/진단용 계약**이며, 결과 정산은 `PREDICT_OBS_COMPARE`로만 남긴다.

#### (A) 언제 EOP++을 붙이나
- 툴 호출/검색/코드 실행처럼 **외부 관측이 생기는 액션**을 할 때(특히 비용이 클 때)
- verifier 충돌/동점/route_tier가 높아서 실패 리스크가 커 보일 때
- 반복되는 실패모드가 있어 “지금도 그게 터질지”를 관측하고 싶을 때

#### (B) 로컬에서 stake를 뭐로 두나(돈 금지)
- `stake_unit=tokens`: “이 예측이 틀리면 앞으로 토큰 낭비가 커진다”의 대리값
- `stake_unit=ms`: 지연(latency) 리스크
- `stake_unit=calls`: 툴 호출 횟수 리스크
- `stake_unit=risk_points`: 내부 위험 스코어(운영 정의 고정)

#### (C) 구현 흐름(최소)
1) `maybe_build_eop()`가 EOP를 만들고, (옵션) `wager`를 붙인다.
2) `log_event(EXPECTED_OUTCOME_PACKET, payload)` 기록(반드시 `eop_id` 포함).
3) 툴 실행이 끝나거나 결과가 확정되면 `compare(eop, obs)`로 정산 레코드를 만들고,
4) `log_event(PREDICT_OBS_COMPARE, payload)`를 기록한다.
5) QP는 (EOP, COMPARE)을 읽어 `OverconfidentError/Brier` 같은 feature를 만든다(§6.1.6/Sidecar Spec 참조).

#### (D) 실패모드 라벨링(권장)
- `failure_mode_hit`: EOP의 `failure_modes_topk` 중 무엇이 실제로 터졌는지(없으면 null)
- 이 값은 추후 Intervention library의 “타겟팅(어떤 개입이 어떤 실패를 줄였는지)”에 쓰인다.


### 3.2.2 SketchPad 통합 메모 (저해상도 시각 스케치/latent)




이건 “멀티모달 문제풀이” 전용이 아니라, **Augnes Local의 메타-컨트롤러가 ‘구조’를 관찰**하기 위한 저대역 채널이다.  
텍스트는 강력하지만, (a) 공간/도식/경로 (b) 시스템 다이어그램(자기상태) 같은 건 **유지비가 비싸고 쉽게 흐트러진다.**  
스케치패드는 그걸 “작은 캔버스”에 고정해서 Gate/Verifier/리트리벌 비용을 깎는 용도다.

#### MVP(로컬/텍스트 백본에서도 가능)

- 표현: `grid8`(예: 24x24 또는 32x32) + `primitives[]`(권장) + `hash`
- 저장:
  - 무거운 payload(그리드/렌더)는 `debug-store`(로컬 파일/키-값 스토어)
  - 로그/스냅샷에는 `hash/ref/res/repr`만
- 채널:
  1) `sketch_self`: **시스템 상태 다이어그램**(모듈/루프/예산/zone/state_label). Boundary 커밋에서만 갱신 권장.
  2) `sketch_task`: **문제 구조 스크래치**. MID stage에서만 갱신(종료 시 최종본만 남김).


#### (r19) 워크스페이스화(중기 방향) + Option A(SD VAE latent)

- “스케치=이미지”로 취급하지 말고, **공유 표현 공간(latent workspace)** 로 취급한다.
  - 사용처: Gate/Verifier/Router가 *구조 유지 여부*를 싸게 보는 저대역 버퍼.
  - 금지: solve 컨텍스트에 원문처럼 주입(오염). 항상 Control/View에서만 사용.

**Option A: SD VAE latent 저장 포맷(운영 실험용)**
- 저장: `repr="sd_vae_latent"` + `sd_vae_meta{vae_id, latent_shape, codec, latent_scale, latent_ref}`  
- 정규화(권장):
  - `latent_scale`로 클리핑/스케일 고정(예: clip ±s 후 q8/q16로 압축)
  - `sketch_hash = sha256(vae_id || shape || codec || latent_scale || latent_bytes)`  
- 업데이트 규율:
  - `sketch_self`: Boundary 커밋에서만(드리프트 방지)
  - `sketch_task`: MID stage에서만(종료 시 최종본만 남김)
- 로그:
  - `SKETCHPAD_UPDATE` 또는 `STATE_SNAPSHOT.payload.metrics_optional.sketchpad`에 `hash/ref/meta` 기록(부록 참조)

> 주의: VAE/codec이 바뀌면 과거 latent와 직접 비교하면 안 된다. 반드시 `vae_id`로 분기한다.


#### 정규화(필수): “순서가 바뀌어도 같은 스케치”

- `primitives[]`를 “그린 순서”가 아니라 **정규화된 집합**으로 취급한다.
- 렌더러는 항상 동일한 정렬 규칙으로 적용한다.
- 회귀테스트: primitives를 무작위 셔플해도 `sketch_hash`가 동일해야 한다.
  - 이게 깨지면: 디버깅 난이도가 폭발한다(=Intervention 합성 순서 의존성과 같은 문제).

#### 언제 켜나(권장 트리거)

- `route_tier ∈ {R3_CWM, R5_MULTISAMPLE}` 이거나,
- `EES`가 반복적으로 FA/Miss를 내거나,
- 계획/증거/결론 간 불일치가 잦을 때(SRP에서 “구조가 유지 안 됨”으로 판정)

기본값은 OFF. 켜도 **한 턴당 업데이트 횟수/primitive 수 상한**을 걸어라(예산 내장).

#### self-sketch: 가장 싼 구현

- 레이아웃은 “자동 배치” 금지. **고정 좌표 템플릿**을 써라.
- 예: 좌측에 Observe→Predict→PE→IM→Staging→Gate→Commit 흐름, 우측에 `e_t`/`policy_levers`/`resource_state`/`zone` 박스.
- 텍스트 표시는 최소(두세 글자 축약), 나머지는 색/명암 같은 “표식”으로 대체(초기엔 숫자/문자 코드로 충분).

#### task-sketch: 얇게 시작

- 공간/경로/도식 문제가 아니면 만들지 말자(괜히 비용만 든다).
- “문제 구조”만 고정해도 효과가 난다:
  - 후보 해법의 분기 트리(2~3 레벨)
  - 제약 조건(Constraint) 묶음의 관계도(노드/엣지)
  - 경로/순서 문제의 간단한 그래프(노드/거리)

> 요약: 스케치패드는 “그림 생성”이 아니라, **구조를 저렴하게 고정하는 컨트롤/뷰 버퍼**다.

#### (옵션) Render-of-Thought Trace (RoT): “생각을 이미지로 렌더 → 비전 임베딩으로 압축” 레시피

**목적**: 긴 CoT를 그대로 남기지 않고, *나중에 재사용/검색/진단 가능한 저대역 trace* 로 남긴다.  
- 즉시 이득(훈련 없이): `log_only` 모드로 **텍스트 CoT는 유지**하되, RoTTrace를 **압축 인덱스/진단 신호**로 저장.
- 중기 이득(훈련 필요): `latent_reasoning` 모드로 **고정 길이 latent 토큰**만 굴려서 토큰/지연을 줄이는 방향.

**권장 렌더 설정(논문 기본 근처)**
- 단일행(single-line) 텍스트 이미지
- `height_px=32`, `padding_px=4`, `font_px≈20`, 흰 배경/검은 글자
- `width_mode="dynamic"`: 텍스트 길이에 따라 폭 가변(잘림 방지)

**MVP: log_only (훈련 없이, 로컬에서도 바로 가능)**
1) 백본이 생성한 CoT를 “step 단위”로 쪼갠다(문장/넘버링/불릿 기준이면 충분).
2) 각 step을 위 렌더 설정으로 PNG로 만들고, `sha256(render_cfg || step_text)`로 step_hash를 만든다.
3) VLM/CLIP 계열 **비전 인코더**로 step 이미지를 임베딩(권장: 동일 인코더 고정).
4) debug-store에 번들 저장:
   - `rot_trace/{trace_hash}/steps/*.png`
   - `rot_trace/{trace_hash}/embeds/*.npy` (또는 fp16 packed)
5) 로그에는 **포인터만** 남긴다:
   - `ROT_TRACE_UPDATE` (Logging Appendix 참조)
   - (옵션) `SKETCHPAD_UPDATE`에 `repr="img_ref"` + `ref=trace_ref`만 남겨 SketchPad 채널로도 연결

**운영 포인트(중요)**
- RoTTrace는 Control/View 전용이다. Evidence/Claim 승격 금지.
- “임베딩 plateau(동질화)” 감지:
  - 인접 토큰 cosine similarity가 계속 0.99+로 붙는 구간이 나오면 `saturation_plateau_at=k`로 기록만 한다.
  - 해석은 “조기 종료 후보 신호” 정도로만 취급(정답 근거로 쓰지 말 것).

**latent_reasoning(중기, 튜닝 필요)**
- 동적 종료 토큰으로 멈추게 하기보다, **fixed token budget**(예: 32/64)을 먼저 고정해서 안정화한다.
- 게이트(권장):
  - `route_tier ∈ {R3_CWM, R5_MULTISAMPLE}` 이거나,
  - `WL_output_tokens`가 상한을 자주 치거나,
  - latency 병목(=Cost_latency_ms)이 심할 때만 켠다.

### 3.2.2b JIT Construal Loop(JIT-WM) 통합 메모 (작업용 미니 세계모델, 권장)
### 3.2.2c NetArch-G(Mode/Bridge/SmallWorld) 통합 메모 (권장 최소)

> 목표: “모드 전이/브리지/그래프 위생”을 **비용 낮게 로깅**하고, BG/Gate가 **다운시프트/탐색 전환**을 할 때 근거(=Control/View)로만 쓰게 한다.

- **최소 구현(가성비)**
  1) 모드 상태는 `STATE_SNAPSHOT.state_core.control_mode_id`로 유지(매 boundary 1회)
  2) 모드가 바뀌면 `MODE_SWITCH` 이벤트 1건
  3) 클러스터 간 브리지 시도 시 `BRIDGE_CALL` 이벤트 1건(성공/실패/유틸리티)
  4) 주기적으로(또는 필요할 때만) 그래프 하우스키핑 시 `GRAPH_MAINTENANCE` 이벤트 1건


- **의미 분리(중요)**
  - `MODE_SWITCH`는 **control_mode_id 전이(NetArch-G 컨트롤 모드)** 기록이다.
  - `BEHAVIOR_STATE_SWITCH`는 **거친 행동/레짐(behavior_stage)** 변화 기록이다.
  - 두 이벤트를 같은 “모드”로 섞지 말고, 가능하면 각각 `payload.scope`를 기록해 (`control_mode` / `behavior_state`) 분석 축을 고정한다.
- **스키마/포인터**
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml`  *(MODE_SWITCH / BRIDGE_CALL / GRAPH_MAINTENANCE)*
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/state_snapshot.schema.yaml`  *(state_core.control_mode_id, metrics_optional.netarch.*)*
  - 예시:
    - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_MODE_SWITCH.json`
    - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_BRIDGE_CALL.json`
    - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_GRAPH_MAINTENANCE.json`

- **운영용 파생 집계(옵션 A)**
  - DuckDB 레퍼런스 뷰: `SSOT_SCHEMA_BUNDLE.zip ▸ tools/ANALYSIS_STORE_DUCKDB_VIEWS_NETARCH.sql`
  - 결과 축(권장): `WL_netarch_*` (Logging §12.4.7)
    - 호환: 분석 뷰에서 `WL_netarch_mode_switch_count`와 동일값 별칭 `WL_netarch_control_mode_switch_count`를 함께 제공(혼선 방지).

- **금지**
  - 위 이벤트/축으로 Evidence/Claim 승격 금지(권위 만들기 금지). “더 확인/더 멈춤/더 얇게”의 컨트롤 근거로만 사용.


> 요지: “세계모델을 미리 다 만들지 말고, **지금 필요한 만큼만**(Active Set / construal) 증분 로딩해서 쓰자.”  
> 이 절은 **정의/필드명 발명 없이**, 스키마/이벤트 포인터와 “어디에 끼울지”만 고정한다.

- **위치(권장):** `observe()` → (A0 TRL routing/labels) → `update_sidecar()` 직후, **Intervention Staging의 retrieval 전에 1회**(또는 0~N회) 마이크로 루프로 실행  
- **입력:** `route_tier`, 현재 goal/intent, (옵션) 직전 `active_set` 요약, (옵션) cheap sim seed  
- **출력:** Workspace의 **Active Set(construal)** 업데이트(추가/제거) + `needs`(= retrieval 트리거) 생성  
- **권한:** Control/View. Evidence/Claim confidence 승격 금지(근거는 ptr로만).

**스키마/포인터**
- 오브젝트/need/construal:
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jit_object.schema.yaml`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jit_need.schema.yaml`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jit_construal.schema.yaml`
- 이벤트(payload required는 스키마에서만):
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml`  *(event_type = `JIT_CONSTRUAL_*`)*
- 예시:
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_JIT_CONSTRUAL_INIT.json`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_JIT_CONSTRUAL_SIM.json`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_JIT_CONSTRUAL_LOOKAHEAD.json`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_JIT_CONSTRUAL_ENCODE.json`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_JIT_CONSTRUAL_PRUNE.json`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_JIT_CONSTRUAL_OUTCOME.json`

**로그 훅(권장 최소 순서)**
- `JIT_CONSTRUAL_INIT` → `JIT_CONSTRUAL_SIM` → `JIT_CONSTRUAL_LOOKAHEAD` → (PSGR) → `JIT_CONSTRUAL_ENCODE` → `JIT_CONSTRUAL_PRUNE` → `JIT_CONSTRUAL_OUTCOME`

**PSGR 연결(핵심)**
- `JIT_CONSTRUAL_LOOKAHEAD.payload.needs[].query_templates`(또는 서브쿼리)를 **PSGR §5.1.2의 `SUBQ` 입력**으로 그대로 사용  
- retrieval 결과는 “요약 텍스트”로 섞지 말고:
  - Claim/Evidence로 승격할 건 기존 규약대로 처리하고,
  - JIT 쪽은 `jit_object.evidence_ptrs[]`로 **포인터만** 잡는다.

**Budget tier(권장 템플릿)**
- `R0/R1`: off 또는 `sim_level=L0` only, `psgr_step_cap=1`
- `R2/R3`: `sim_level=L0~L1`, `psgr_step_cap=2~3`
- `R4/R5`: `sim_level=L1` + `psgr_step_cap=3`, 단 **τ_stop 입력 금지**(SRF)

**Runtime gating(언제 0~N회 돌리나) — 운영 레시피 v0 (권장)**

> 목표: JIT가 “도움이 되는 구간”에만 켜지고, 자원 압력/진동 국면에서는 **즉시 얇아지거나 꺼지게** 만든다.  
> 원칙: (1) route_tier 기반의 단순 테이블이 1차, (2) resource/oscillation 신호는 **다운시프트**에만 사용(업시프트는 보수적으로).

- **기본 enable 트리거(권장)**  
  아래 중 1개라도 만족하면 “켜볼 자격”이 생긴다(단, Hard disable이 우선).
  - `route_tier ≥ R2`
  - 또는 `tool_required_flag=true` / `missing_slot_count>0` / `constraint_conflict_detected=true`
  - 또는 EES↑(조기 오류/불일치 신호)로 “먼저 lookahead로 빈 구멍”을 메꿔야 할 때

- **Hard disable(즉시 off, 필수 권장)**  
  - `tau_stop` 또는 SRF stop-rule이 이미 걸린 상태(“더 파고들기” 금지)  
  - `Cost_oom_count>0` 또는 `WL_resource_state_max_w`가 임계치 초과(자원/런타임이 이미 붕괴 국면)  
  - `InterventionOscillationIndex_w`가 임계치 초과 + 최근 윈도우에서 `obj_churn_ratio`가 높음(아래 정의)

- **Tier별 기본 템플릿(권장 초기값)**  
  (현장에서는 이 값으로 시작해서, 실패/비용 패턴 보고 조정하면 된다.)
  - `R0`: off  
  - `R1`: `max_cycles=1`, `sim_level_cap=L0`, `psgr_step_cap=1`, `active_set_max=12`, `needs_cap=1`  
  - `R2`: `max_cycles=1~2`, `sim_level_cap=L0`, `psgr_step_cap=2`, `active_set_max=24`, `needs_cap=2`  
  - `R3`: `max_cycles=2`, `sim_level_cap=L1`, `psgr_step_cap=2~3`, `active_set_max=32`, `needs_cap=3`  
  - `R4`: `max_cycles=2~3`, `sim_level_cap=L1`, `psgr_step_cap=3`, `active_set_max=48`, `needs_cap=4`  
  - `R5`: `max_cycles=3`, `sim_level_cap=L2(가능할 때만)`, `psgr_step_cap=4`, `active_set_max=64`, `needs_cap=6`  

- **자원 압력 다운시프트(권장)**  
  - `WL_resource_load_p95_w`↑ 또는 `WL_vram_headroom_min_w`↓(가능할 때)면:
    - `sim_level_cap`를 한 단계 내리고(L2→L1→L0), `max_cycles=1`로 줄인다.
    - `active_set_max`를 0.5~0.7배로 줄인다(“잘라내기”를 먼저).  
  - OOM/스왑/latency 폭증이면 JIT뿐 아니라 PSGR도 같이 얇게(= `psgr_step_cap` -1).

- **진동/루프 가드(권장)**  
  - `obj_churn_ratio = (obj_added_total + obj_removed_total) / max(1, active_set_max)`  
  - 최근 윈도우에서 `obj_churn_ratio`가 높고(예: ≥0.8), 동시에 `InterventionOscillationIndex_w`↑이면:
    - 다음 턴은 `max_cycles=1` + `PRUNE` 강제(“정리 우선”)
    - 필요(needs)는 `needs_cap`을 유지하되, PSGR step cap은 내린다(“찾기보다 고정”)
  - 반대로 subcritical(정체)인데 missing-slot이 계속 나오면:
    - `max_cycles`를 늘리기보다 **lookahead 1회 + PSGR 1~2 step**만 추가(업시프트는 보수적으로).

- **로그(권장: 최소한으로 남겨라)**  
  - `JIT_CONSTRUAL_INIT.payload.budget_profile`에 아래를 optional로 같이 남기면, 나중에 “왜 켰는지/왜 얇아졌는지”를 재현할 수 있다.
    - `jit_profile_id` (예: `jit_r3_l1_psgr2_as32`)
    - `gating_reason_codes[]` (예: `route_r3`, `ees_high`, `resource_downshift`, `osc_guard`)
  - `JIT_CONSTRUAL_SIM`에는 (가능하면) `sim_steps`(또는 `sim_trace_len_steps`)를 optional로 남겨라.  
    없으면 집계에서는 SIM 이벤트 수로 근사한다(Logging §12.4.6 참조).

**Forgetting/PCF 결합**
- `JIT_CONSTRUAL_PRUNE`에서 Active Set에서 내릴 때:
  - Recoverability Contract 포인터(예: claim_id/evidence_id/tool_run_id)는 유지  
  - 실제 “버림/핀”은 PCF 사건(`CONTEXT_FOLD` 또는 `MEMORY_*`)과 충돌하지 않게 **동일 step_id**로 연동(Logging Appendix 참조)

### 3.2.3 Budget Governor(BG) / Axis / closure: 계산·적용·기록 위치 (r9)

이 문서는 “언제 계산하고 어디에 남기나”만 명시한다. **필드 정의/단위/스키마 계약은 `SSOT_LOGGING_POLICY.md`가 단일 기준**이다.

- Observe 직후(현행 유지):
  - `ROUTE_ASSESSMENT`로 route/profile 태깅(=Control/View, Evidence 승격 금지)
  - `runtime_limits`/`resource_state` 스냅샷(다운시프트 디버깅용)
- Boundary 직전/직후(권장):
  - `update_sidecar(e_t)` 직후: (선택) `tau_hat/Q_hat/M_hat/eff_hat`, `sync_hat` 계산
  - Boundary close 시점:
    - `STATE_SNAPSHOT`에 `e_t` + (선택) control_axes/axis_snapshot/closure/sync 요약을 함께 커밋
    - `GATE_DECISION` 또는 `JML_ENTRY`에 `budget.*`, `tau_gen/tau_mem`, `closure_score_*`, `axis_*` 기록
- stop-rule(τ_stop):
  - **prior/BG로부터 독립**. 예산/편향은 stop-rule을 override하면 안 된다(법전 규약 유지).





#### 3.2.3a (옵션, 초소형) BG/Gate용 Learned Prediction Signal(LPS) 헤드

**목표**: EES/PE/route/profile 같은 기존 신호를 *그대로* 쓰되, 로그 기반으로 “다음 스텝에서 터질 확률”과 “VERIFY가 이득일 확률”을 **아주 싸게** 추정해서 Gate/BG에 프라이어로만 얹는다.

- 출력(권장 최소):
  - `commit_fail_hat ∈ [0,1]`: 지금 COMMIT하면 실패/재작성/툴불일치로 되돌아올 확률
  - `verify_gain_hat ∈ [0,1]`: VERIFY(또는 RETRIEVE)가 실제로 손해를 줄일 확률
  - (선택) `cost_hat.{tokens,tool_calls,latency_ms}`: 비용 공변량(정산은 실제 로그로)
- 입력 features(권장 최소):
  - `EES`, `PE_total`(+핵심 sub-PE 몇 개), `route_tier`, `tool_required_flag`
  - `fail_streak`, `avg_cost_recent`, `runtime_limits.profile_id`(12GB/CPU-offload 여부 등)
  - `z_t`(regime), `loopness_hat`(있으면)
- 런타임 규약(필수):
  - `lps = clip01(EMA(lps_raw, jerk_cap))` 형태로 **jerk-limit** 적용
  - Gate는 `lps_weight`로 **가벼운 가산/감산**만 한다(override 금지)
  - stop-rule(τ_stop)은 **독립**(기존 규약 유지)

**Gate 반영(권장, 가성비)**  
- `VERIFY_score += w * logit(verify_gain_hat)`  
- `COMMIT_score -= w * logit(commit_fail_hat)`  
- 단, `w`는 아주 작게(예: 0.05~0.2) 시작하고, 캘리브레이션(ECE/Brier) 악화 시 즉시 0으로 내린다.

**BG 반영(권장, 폭주 방지)**  
- `commit_fail_hat`↑이면 `verifier_budget`/`retrieval_budget`를 1~2만 늘리거나, `intervention_topk`를 +1 하는 정도로 끝.
- τ_budget/M_budget 자체를 크게 흔들면 진동이 난다. “미세 조정”만 허용.

**학습(오프라인 권장)**  
- 라벨:
  - `commit_fail`: commit 후 일정 윈도우 내 `REVISION/CONTRADICTION/TOOL_MISMATCH`류가 발생하면 1
  - `verify_helped`: VERIFY/RETRIEVE가 있었을 때 위 실패가 줄어들면 1(근사)
- 모델:
  - 시작은 **로지스틱 회귀** 또는 작은 MLP(수백~수천 파라미터)로 충분(초소형 유지)
- 운영:
  - holdout suite로 `Brier/ECE/AUC`를 고정 측정하고, 나빠지면 자동 disable(롤백)

**기록(필수)**  
- `STATE_SNAPSHOT.payload.metrics_optional.learned_pred.*`  
- (권장) `GATE_DECISION.payload.learned_pred_used.*`  
- 지표/필드 정의는 Logging Appendix가 단일 기준.

#### 3.2.3c (옵션) CSB(Cerebellar Satellite Bank): “작은 위성(head)로 코어를 둘러싼다”

**한 줄 요약**: 모델 크기 욕심 대신, 코어는 가급적 그대로 두고 **싸고 작은 위성들**을 붙여서 필요한 성질만 얻는다.  
여기서 ‘성질’은 대개 두 가지다: (1) 텍스트 표면(형식/언어) 안정화, (2) 행동/라우팅의 미세 bias.

##### (A) 프로파일(권장 최소)
- `sat_l_v0` (Sat-L): `Δlogits`만 출력 (출력 계약/문장/포맷 안정화)
- `sat_md_v0` (Sat-MD): `Δpolicy_score`만 출력 (VERIFY/RETRIEVE/PLAN 쪽 약한 프라이어)
- `sat_tom_v0` (Sat-ToM): `Δpolicy_score`만 출력 (대화/타자모델/상호작용 위험 프라이어)
- `sat_artic_v0` (Sat-Artic): `Δpolicy_score`만 출력 (절차/행동 시퀀스 안정화; “행동 실행” 쪽)

> 처음부터 4개 다 붙이지 말고, `sat_l_v0` + 하나(`sat_md_v0` 권장)로 시작해라.  
> 늘리는 건 쉽고, 줄이는 게 어렵다(진동/혼선 때문).

##### (B) 출력 타입 분리(필수)
- Sat-L: `delta_logits != null`, `delta_policy_score == null`
- Sat-M*: `delta_logits == null`, `delta_policy_score != null`
- 분리 위반은 곧바로 `mode=off`로 내려서 안전하게 롤백한다(그리고 PROBE로 잡는다).

##### (C) 런타임 훅(가성비)
- Sat-L 적용 위치: **Generate 직전** (Sampler에 들어가기 전에)
- Sat-M 적용 위치: **Gate 후보 점수 prior 단계** (EVC_raw 계산 이후, 그리고 작은 clip/gain만)

##### (D) 파라미터(권장 시작점)
- `gain_logits`: 0.05 ~ 0.15  
- `clip_logits`: 0.25 (L∞ 기준; 요지는 “조금만”)
- `gain_policy`: 0.05 ~ 0.20  
- `prior_clip_sat`: 0.10 ~ 0.20 (기존 prior_clip보다 항상 작게)

##### (E) SRF 준수 체크리스트(필수)
- CSB 출력은 τ_stop 입력 금지(법전 SRF 블랙리스트)
- CSB 추천/점수/텍스트는 Evidence 승격 금지
- `resource_state`가 나쁘면 자동 `observe_only` 또는 `off`

##### (F) 로깅(필수)
- `STATE_SNAPSHOT.payload.metrics_optional.cerebellar_satellites.*`
- (권장) `GATE_DECISION.payload.cerebellar_satellites_used.*`
- 필드/단위는 Logging Appendix/Schema Bundle을 단일 기준으로 따른다.

### 3.2.4 Metacog Cycle(MUSE-lite) 구현 메모 (competence-aware strategy loop)

이 섹션은 논문 *MUSE*의 핵심을 “로컬 텍스트/툴 에이전트” 버전으로 축약한 구현 가이드다.  
핵심은 두 가지뿐이다:

- **Self-awareness**: “이 전략(또는 보조 수)이 될 것 같은가?”를 *숫자로 추정* (`competence_hat`, `competence_u`, (옵션) `remaining_steps_hat`, `cost_hat.*`)
- **Self-regulation**: 그 숫자를 이용해 **전략을 갈아타며 반복** + 필요하면 **AuxMove(=Intervention 주입)** 로 ‘다리(bridge)’를 놓는다(무한 루프/동결 감소)



#### 3.2.3d (옵션, 가성비) Goal→Action Coupling(G2A) + (옵션) ORAV(commit-hold/penalty)

**목적(운영)**: 목표/드라이브(=goal_pulse) 갱신이 실제 행동(=action_fire: 툴/쓰기/커밋)으로 *잘 이어지는지*를 저비용으로 추정해, Gate의 `COMMIT`↔`VERIFY` 사이에만 **아주 약한 프라이어(prior-only)** 를 제공한다.  
이 값은 **Control/View 전용**이며 Evidence/Claim로 승격하면 규약 위반이다.

- 저장(권장): `STATE_SNAPSHOT.payload.metrics_optional.g2a.*` (+ 옵션 `...orav.*`)
- 금지(필수): **τ_stop 입력 금지(SRF)**, stop-rule override 금지, Evidence 승격 금지  
- 런타임 반영(필수): `clip + jerk-limit(EMA) + cooldown` 강제(자세한 규약은 Canonical `§5.2.0c`)

**계측(권장 최소)**  *(windowed proxy)*
- `window_steps`: 128~256 (초기 권장 256)
- `delta_t_max_ms`: 800~1500ms (초기 권장 1200ms)
- `goal_pulse`: 목표/드라이브 fingerprint 변화(해시) 또는 Δdrive_norm > θ를 만족할 때 1회로 카운트
- `action_fire`: 툴 호출/검증/쓰기/커밋 중 “실제 실행 계층”으로 내려간 이벤트를 1회로 카운트

**추정치(권장 최소)**  
- `goal_pulse_count_w`: 윈도우 내 goal_pulse 횟수  
- `action_fire_count_w`: 윈도우 내 action_fire 횟수  
- `hit_rate_w`: goal_pulse 직후 `delta_t_max_ms` 내에 action_fire가 발생한 비율(=hit)  
- `base_rate_w`: 윈도우 내 action_fire의 base rate(구현 자유; 일관되게만 유지)  
- `g2a_coupling_hat = clip( hit_rate_w / max(eps, base_rate_w), 0..1 )`

**Gate 반영(권장, 가성비)**  
- `COMMIT_score += clip(gain_g2a * (g2a_coupling_hat - 0.5), ±prior_clip_g2a)`  
- `VERIFY_score += clip(gain_g2a * (0.5 - g2a_coupling_hat), ±prior_clip_g2a)`  
- 기본은 **미세 조정**(예: `gain_g2a=0.05~0.15`, `prior_clip_g2a=0.10`)

**(옵션) ORAV(Outcome-Responsive Action Veto)**  
최근 outcome(예: `PREDICT_OBS_COMPARE` 결과) 또는 내부 reward가 “나쁜 방향”으로 갱신되었고, 동시에 `g2a_coupling_hat < orav_theta_low`이면, **헛 커밋을 줄이기 위해** `COMMIT` 후보를 일정 스텝 동안 hold/penalty 한다.  
- 권장 상태 키: `STATE_SNAPSHOT.payload.metrics_optional.orav.*` (`veto_active`, `last_triggered_step`, `cooldown_steps`, `veto_rate_w`)  
- 하드 veto 권장 X: penalty/hold는 soft하게, jerk/cooldown 필수.  
- ORAV도 SRF를 우회하지 않는다(τ_stop 우회 불가, Evidence 승격 불가).

**문서 포인터**
- Canonical: `§5.2.0c` (G2A/ORAV 규약)
- Logging: `§12.2` (`STATE_SNAPSHOT.payload.metrics_optional.g2a/orav` 권장 키)
- Wiring: `(A0k)` (통합 위치/금지 규칙)

#### 3.2.3e (신규, 옵션, 초경량) Memory-ANN-lite (MN): “기억 변수” 기반 보상학습 프라이어

**목적(운영)**: 최근/중기/장기 패턴을 담는 잠재 메모리 상태를 유지해, Gate의 `COMMIT`↔`VERIFY/RETRIEVE` 사이에만 **아주 약한 프라이어(prior-only)** 를 제공한다.  
MN은 **Control/View 전용**이며 Evidence/Claim로 승격하면 규약 위반이다.

- 저장(권장): `STATE_SNAPSHOT.payload.metrics_optional.memory_ann.*`
  - `mn_bias_hat`, `mn_conf` (+ 옵션 `mn_timescale_mix`, `mn_cf_sens_hat`)
- 금지(필수): **τ_stop 입력 금지(SRF)**, stop-rule override 금지, Evidence 승격 금지  
- 런타임 반영(필수): `clip + jerk-limit(EMA) + cooldown` 강제(자세한 규약은 Canonical `§5.2.0d`)

**모드(권장)**
- `mn_mode=trace_only` *(v0.1 기본 권장, 비용 거의 0)*  
  - 다중 시간척도(trace) 기반으로 `mn_bias_hat` 산출
- `mn_mode=learned_small` *(v0.2+)*  
  - offline 학습(로그 라벨: `commit_fail`, `verify_helped`, `p_improve`) + online 추론

**안전 폴백(권장)**
- `mn_conf < 0.35` 또는 ORAV cooldown 중이면 `prior_clip_mn=0` (또는 자동 감쇠)
- 캘리브레이션 악화(ECE/Brier 상승) 시 `observe_only`로 다운시프트(로그만)

**Gate 기록(권장)**
- `GATE_DECISION.payload.memory_ann_used.{prior_clip_mn,mn_bias_hat,mn_conf,mn_weight,reason_codes}`


**회귀/정합성 요구(중요; 구현 강제)**
- MN(`prior_clip_mn`)은 LPS/G2A와 **동일한 shared prior pipeline(clip→jerk→cooldown)** 을 **같은 코드 경로로** 통과해야 한다(별도 jerk/clip 분기 금지).
- 동일 입력 시퀀스에 대해 `learned_pred_used`(LPS)와 `memory_ann_used`(MN)가 **같은 pipeline_id** 를 기록하도록 권장한다.
  - 예: `prior_pipeline_id: "prior_pipeline_v1"`  
  - (선택) `applied_rules: {clip_bound, jerk_bound, cooldown_active}` 기록
- 테스트(권장 최소): replay 로그에서 `prior_pipeline_id`가 LPS/G2A/MN 모두 동일함을 assert.


#### 3.2.3f (옵션, 경계-전용) Parameter Memory(PM) / TTT-lite Session Adapter(UBB coefficient update)

**목적(운영)**: 긴 세션에서 “더 많은 컨텍스트/더 많은 검색” 대신, 에피소드에서 드러난 용어/절차/스타일 패턴을 **작은 어댑터(또는 UBB 계수)**에 압축해 다음 턴의 비용(토큰/검색/검증)을 줄인다.

- 위치(필수): `Boundary close_episode()` 직후, 전용 “튜닝 윈도우”에서만 0~1회 실행
  - 메인 Step Loop 인라인 업데이트 금지(법전 오프라인/경계 원칙).
- 금지(필수): τ_stop 입력 금지(SRF), Evidence/Claim 승격 금지, 즉시 적용 금지(다음 에피소드부터 + 히스테리시스).
- 회귀 게이트(필수): `invariance_v0` + 최소 canary suite 통과 전에는 `promotion=HOLD`.
- 로깅(권장): `FINETUNE_RUN_*` + `ARTIFACT_TUNE_*` (adapter_profile artifact 후보/승격/롤백 계보).

문서 포인터:
- Wiring: `(A0n)`
- Sidecar: §2.7.7
- Playbook: §4.8.5(구체 레시피)

#### 3.2.3b (옵션) Budget Gain Estimates: `ΔQ_hat`, `ΔQ_over_M` (PDC 승격용 “개선 가능” 신호)

Canonical Spec의 PDC 승격 조건에서 사용하는 `ΔQ_hat` / `ΔQ_over_M`은 **증거(Evidence)가 아니라 Control/View용 예측치**다.  
즉, “지금 더 파면(더 많은 M을 태우면) 품질이 오를 가능성이 있나?”를 **아주 싸게** 추정하는 용도이며, stop-rule/EVC를 **override하지 않는다**.

- 정의(권장 최소)
  - `ΔQ_hat ∈ [0,1]`: 추가 개입(VERIFY/RETRIEVE/추가 분석)으로 **유의미한 개선이 발생할 기대치**  
  - `ΔQ_over_M ∈ [0,1]`: 기대 효율(개선/비용). `ΔQ_hat`을 예상 비용 `ΔM_hat`로 나눈 값

- 산출(초소형 기본 레시피; 모델이 없으면 휴리스틱으로 시작해도 됨)
  - 입력: `commit_fail_hat`, `verify_gain_hat`, (optional) `cost_hat.*`, `loopness_hat`, `resource_state` 요약, `EVC_raw_max`(보정용)
  - `ΔM_hat := clamp01( normalize(cost_hat.tokens or cost_hat.tool_calls or latency_ms) )`  
    - `cost_hat`이 없으면: 최근 관측 `ΔM`의 EMA를 사용(`ΔM_hat := ema(ΔM_obs)`)
  - `ΔQ_hat := clamp01( w_v * verify_gain_hat  - w_c * commit_fail_hat  - w_l * loopness_hat  - w_r * overload_hat )`
    - 기본 가중치(권장 시작점): `w_v=1.0, w_c=0.6, w_l=0.7, w_r=0.5`
    - `overload_hat`는 `resource_state/avalanche`류가 있으면 사용, 없으면 0
  - `ΔQ_over_M := clamp01( ΔQ_hat / max(ΔM_hat, ε) )`  (ε=1e-3 권장)

- 운영 사용(권장 AND 구조)
  - PDC 승격: `EVC_raw_max ≥ τ_stop` **AND** (`ΔQ_hat ≥ ε_q` **OR** `ΔQ_over_M ≥ ε_eff`) **AND** `loopness_hat` 과대 아님
  - 기본 임계(권장 시작점): `ε_q=0.25`, `ε_eff=0.35`  
  - jerk-limit/cooldown/clip은 LPS와 동일 규칙을 따른다(진동 금지)

- 로깅(필수)
  - `STATE_SNAPSHOT.payload.metrics_optional.learned_pred.{delta_q_hat, delta_q_over_m_hat, delta_m_hat}`  
  - (권장) `GATE_DECISION.payload.learned_pred_used.{delta_q_hat, delta_q_over_m_hat}`

이 섹션의 정의가 `ΔQ_hat` / `ΔQ_over_M`의 **단일 기준(Single Source of Truth)** 이다.




#### (NEW) Meta-WM gate(`wm_meta`): working-memory confidence → opt-out(VERIFY/RETRIEVE/ASK)

> Canonical §5.7.3b의 구현 레시피.  
> 핵심: **competence_hat(전략 성공가능성)** 과 별개로, “지금 내 *작업용 기억(WM)* 이 믿을 만한가?”를 `meta_wm_hat`로 요약해, **내부 기억 의존 전략을 veto/penalty** 하고 VERIFY/RETRIEVE/ASK로 **안전 전환(opt-out)** 한다.  
> 이 신호는 **Control/View 전용**이며 Evidence/Claim confidence로 승격 금지.

- 입력(권장): Sidecar/QP/z_t 요약(§2.2a) + 최근 실패/검증 결과(간단 카운터)
  - `wm_strength_hat`(0..1): QP 재호출 일관성, 요약/TraceCapsule/스케치 합의도, 핵심 토큰 안정성
  - `wm_uncertainty_hat`(0..1): conflict/entropy/loopness + z_t drift + 최근 Verifier 반례율
  - `history_bias_hat`(-1..1|null): 최근 성공/실패 누적이 만드는 보수/과신 바이어스(옵션)
  - `arousal_proxy`(0..1|null): resource_state 기반 피로/과부하/지연(또는 avalanche 플래그; 옵션)

- 결합(휴리스틱 스타터; 로컬 우선)
  - `meta_wm_hat := clamp01( wm_strength_hat - α*wm_uncertainty_hat - γ*arousal_proxy + β*history_bias_hat )`
  - 기본값 예: `α=0.7`, `γ=0.5`, `β=0.2`
  - opt-out 임계값(시작점): `θ_optout=0.35`  (작업 난이도/route_tier에 따라 보수적으로 조정)

- 사용(둘 중 하나만 써도 됨)
  - (Hard opt-out) `meta_wm_hat < θ_optout`이면 후보 전략을 `{S2_TOOL_FIRST, S3_VERIFY_HEAVY, S4_ASK_CLARIFY}`로 제한
  - (Soft penalty) 후보별 `wm_dependency_hat ∈ [0,1]`를 둬서
    - `effective_competence_hat(s) = competence_hat(s) * (1 - wm_dependency_hat*(1-meta_wm_hat))`
    - 직관: “WM에 많이 기대는 전략”일수록, WM 신뢰가 낮으면 더 세게 깎인다.

- 로깅(권장, 계약 변경 없음; 예시는 스키마 번들 참조)
  - `COMPETENCE_ASSESSMENT.payload.wm_meta` (state-level)
  - (옵션) `COMPETENCE_ASSESSMENT.payload.candidates[].wm_dependency_hat`
  - `STRATEGY_SELECTION.payload.wm_meta_used` + `opt_out_triggered`
  - `METACOG_CYCLE_END.payload.wm_meta_summary` (옵션: min/avg, opt_out_count)
  - 예시 파일: `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_COMPETENCE_ASSESSMENT.json`, `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_STRATEGY_SELECTION.json`, `SSOT_SCHEMA_BUNDLE.zip ▸ examples/event_METACOG_CYCLE_END.json`



#### (A) 최소 구성요소(MVP)
1) `StrategyBank`: 고정된 `strategy_id` 집합(§5.7.2 참고)  
2) `CompetenceHead(+Value/Cost)`: 기본은 `P(success | features, strategy_id)`이지만, **같은 헤드에서** (옵션) `remaining_steps_hat`, `cost_hat`를 같이 뽑아도 된다.  
3) **(NEW, 권장) Meta-WM Estimator**: `wm_meta.meta_wm_hat`(작업용 기억 신뢰도) 산출 + opt-out(VERIFY/RETRIEVE/ASK) 게이트 입력(위 섹션 참고)  
4) `AuxMoveBank`: “막혔을 때 넣는 보조 수” 템플릿 묶음. **새 이벤트를 만들지 않고** `Intervention.candidate_injection` 형태로만 주입한다.  
5) `SelectionPolicy(AVR)`: `score = competence_hat - λ_risk*risk_hat - λ_steps*remaining_steps_hat - λ_cost*cost_scalar + explore_bonus` (+ Meta-WM penalty/opt-out)  
6) `RubricScorer(옵션→권장)`: attempt/산출물 품질을 다축 점수로 채점해 `RUBRIC_REPORT`로 기록하고, TraceCapsule 커밋 게이트에 사용한다.  
7) `OnlineUpdater`: attempt 결과를 샘플로 저장하고, 낮은 빈도로 업데이트  
8) `Logger`: `COMPETENCE_ASSESSMENT`/`STRATEGY_SELECTION`/`METACOG_CYCLE_END` + (권장) `RUBRIC_REPORT`


#### (B) 입력 features(권장 최소)
- 상태: `behavior_stage_id`, `bstate_id`, `fatigue/entropy/conflict`(z_t 요약)
- 작업: `task_kind`, `n_tokens_est`, `tool_required_flag`, `constraints_hardness`
- 최근 이력: `fail_streak`, `recent_strategy_ids`, `avg_cost_recent`
- 라우팅/자원: `route_tier`, `runtime_limits.profile_id`, `budget_axis`
- 리스크: `risk_hat`(룰/휴리스틱/검증기 출력)
- (NEW, 권장) Meta-WM: `wm_meta.meta_wm_hat`, `wm_uncertainty_hat`, `arousal_proxy` (내부 기억 의존 전략 veto/penalty 입력)

> 시작은 휴리스틱으로 충분하다. “정교함”은 나중 문제고, **일단 기록**이 먼저다.

#### (C) Step Loop 내 삽입 위치(권장)
- Observe 직후: `trigger_metacog?` 평가 (fail streak / uncertainty / loopness)  
- Plan 직전: 후보 `strategy_id`들 평가 + (옵션) **AuxMove 후보 템플릿**도 함께 후보 풀에 올린다  
- Act 직전: `SelectionPolicy(AVR)`로 선택
  - 선택이 `strategy_id`면: 기존처럼 실행
  - 선택이 `aux_move`면: **Staging(MID)에서** `candidate_injection`으로만 반영(=Intervention 주입), `τ_stop`/EVC에는 영향 0  
- Boundary(commit) 시: attempt outcome을 라벨로 커밋 → `OnlineUpdater` 큐에 적재  
- (권장) Boundary 이후: RubricScorer로 결과를 채점해 `RUBRIC_REPORT` 기록(TraceCapsule 커밋 게이트 입력)


#### (D) 의사코드(요약)
```text
if trigger_metacog(state, history):
  mc_id = new_cycle()
  for attempt_i in 0..until stop_rule:
    # 1) 후보 풀: 전략 + (옵션) AuxMove 템플릿
    C_strat = assess_competence_k(strategies, features(state, history))      # -> competence_hat (+remaining_steps_hat, cost_hat)
    C_move  = propose_aux_moves_k(AuxMoveBank, features(state, history))     # -> move_id, move_type, (옵션) same heads
    log(COMPETENCE_ASSESSMENT, mc_id, attempt_i, {strategies: C_strat, moves: C_move})

    # 2) 선택(AVR): risk/steps/cost까지 같이 고려
    choice = select_best(C_strat ∪ C_move, risk_hat, explore_bonus)
    log(STRATEGY_SELECTION, mc_id, attempt_i, choice, {C_strat, C_move})

    # 3) 실행
    if choice.kind == "strategy":
      result = run_with_strategy(choice.strategy_id)
    else:
      # AuxMove는 Staging(MID)에서 candidate_injection로만 반영(Intervention 합성 규칙/셔플 불변성 테스트 적용)
      inject_candidate(choice.move_payload)
      result = continue_step_loop()

    # 4) 커밋/업데이트
    commit_outcome(result)
    rubric = score_rubric(result, context)
    log(RUBRIC_REPORT, rubric)   # Control/View only
    update_competence_async(choice, result, rubric)

    if success(result): break
  log(METACOG_CYCLE_END, mc_id, status, attempts, last_choice)
else:
  normal_step_loop()
```


#### (E) 운영 팁(가성비)
- **학습률/업데이트 빈도 낮게**: 안정성 우선(“조용히 개선”)
- 캘리브레이션은 오프라인 배치(옵션 A 분석 스토어 쿼리로 주기적 수행) 추천
- candidate 수(`K`)는 작게(4~8). 늘리면 “평가하다가 죽음”


#### (F) AuxMove 템플릿 스타터팩(권장 12)
아래는 “새 계약 만들지 않고” 바로 굴릴 수 있는 최소 템플릿이다. 모두 `Intervention.candidate_injection`으로만 주입한다.

1) `DECOMPOSE_3`: 목표를 3개 서브태스크로 쪼개고 각 서브태스크에 성공조건 1줄 붙이기  
2) `ASSUMPTION_LIST`: 현재 가정/전제 5개를 리스트업하고, 깨지면 치명적인 것 1개를 표시  
3) `CONTRADICTION_HUNT`: 답변 초안에서 모순 후보 2개를 찾고, 검증 질문 1개 생성  
4) `VERIFY_MIN`: 가장 싼 검증 1회(정의 확인/단위 확인/출처 1개 확인)만 실행  
5) `RETRIEVE_TARGETED`: 키워드 2개+제약 1개로 타겟 검색 1회  
6) `ALT_HYPOTHESIS`: 대안 가설 2개 생성 후 둘을 가르는 질문 1개 생성  
7) `COST_CUT`: 계획에서 비용 큰 단계 1개를 제거/대체(“70% 품질로”)  
8) `FORMAT_FIX`: 산출물을 요구 포맷(표/스키마/체크리스트)으로 재구성  
9) `TOOL_FIRST`: 텍스트 추론 대신 툴(코드/파서/테스트)로 먼저 확인  
10) `EDGE_CASE_2`: 엣지케이스 2개를 만들어 현재 계획이 깨지는지 점검  
11) `STOP_CHECK`: stop-rule을 건드릴 위험이 있는지 SRF 블랙리스트 점검  
12) `SUMMARY_FOR_REUSE`: 재사용 가능하게 “절차 요약(5줄) + 입력/출력 계약(2줄)”로 압축

> 템플릿은 “정답”이 아니라 “다음 가지를 여는 발판”이다. 성공 신호(success_signal)는 **‘남은 단계 감소’** 또는 **‘검증 통과’** 같은 운영 지표로만 잡아라.

#### (G) RubricScorer + TraceCapsule 커밋 게이트(운영)
- Rubric은 Evidence/Claim 권위를 만들지 않는다. **Control/View 텔레메트리**다.
- 권장 최소 스코어(0..1): `validity_proxy`, `constraint_satisfaction`, `usefulness`, `cost_efficiency`
- TraceCapsule 커밋(권장 AND):
  - `validity_proxy ≥ τ_v` AND `cost_efficiency ≥ τ_e` AND (SRF/stop-rule 위반 없음)
  - 시작 임계: `τ_v=0.65`, `τ_e=0.55` (프로젝트 초반엔 보수적으로)
- 로깅:
  - `RUBRIC_REPORT`(target_kind=`attempt` 또는 `trace_capsule_candidate`)
  - (권장) `TRACE_CAPSULE_COMMIT` payload에 `rubric_ref_id` 포인터만 남기기(점수 자체는 중복 기록 금지)



### 3.3 Executive Core(=System 3) 최소 구현 체크리스트 (권장)

**목표**: “지속성 + 자기주도 + 비용 절감”을, 모델 가중치 업데이트 없이 **메모리/정책**으로 달성한다.

1) **Self-Model 초기화**
- `identity_goal`: 시스템이 장기적으로 “왜 존재하는지” 한 줄(선택이지만 강력 권장)
- `terminal_creed[]`: 바꿀 수 없는 약속/금지/핵심 기준 0..N개(권장)
- 저장 위치: runtime_state + `IDENTITY_INIT` 이벤트(원문은 로컬, 로그에는 hash)

2) **DriveState(내재 동기)**
- 최소 드라이브: `curiosity/mastery/relatedness` (0..1) + `beta{intrinsic,extrinsic}`
- 갱신 규율: jerk cap + hysteresis (Appendix §13.4)  
  - `zone=supercritical`에서는 beta와 무관하게 “폭주 억제”가 우선.

3) **Idle-Mode(사용자 입력 공백)**
- 입력이 없는 구간에서 **멍때리는 대신** 아래 중 하나를 수행(예산 내)
  - `MEMORY_COMPRESS/PRUNE`, `TRACE_CAPSULE_COMMIT/TRACE_CAPSULE_REUSE` 정리, self_graph shadow sweep, 문서/규약 점검
- 기본값은 **보수적으로**(autonomy 낮게) 두고, 실험으로 올린다(로그로만 판단).

4) **TraceCapsule Forward Learning**
- “반복될 가능성”이 높은 패턴만 저장한다(예: 파일 변환, 반복 디버깅 루틴, 툴 조합 절차)
- 재사용 시에도 **Verifier/Validator 통과가 전제**다. (선례는 권위가 아니다.)


## 4. 핵심 실패 모드 7가지와 방어책(필수)

1) **진동(oscillation)**  
   - 대응: 히스테리시스(θ_high/θ_low), cooldown, 예산 상한, stop rule(τ_stop)

2) **PE 채널 혼합**  
   - 대응: `PE_lm`와 `PE_tool`를 분리 저장/가중치 분리(툴 불일치가 아닌데 VERIFY를 트리거하지 않기)

3) **Boundary 오탐/미탐**  
   - 대응: 토픽 전환 단독 금지. 목표 전환/툴 페이즈 종료/검증 실패 누적 등 다중 신호 합의

4) **요약(Revision)로 인한 자기기만**  
   - 대응: 요약은 뷰(view). 권위는 Evidence. 요약-근거 충돌 시 `PE_memory↑`로 VERIFY 유도
   - (추가) **ICN-proxy(EES)**: 후보군이 양분(동점)되거나 verifier 충돌이 반복되면 `EES↑`로 보고, commit 전에 VERIFY/REPLAN으로 우회

5) **Replay 비용 폭발**  
   - 대응: 조건부(실패 반복/툴 불일치 급등/경계 직후) + 상한(토큰/시간/횟수)

6) **자원 신호 불안정(Interoception)**
   - 대응: EMA/클리핑/정규화 + 변화율 제한(derivative cap) + (권장) 2차 변화율 제한(jerk cap)
     - 단발 스파이크가 `e_t`/정책 레버를 튀게 만들면 Gate가 발작처럼 반응한다. `Δ`만 막지 말고 `Δ²`도 막아라.

7) **루미네이션(rumination): 자기반추/내적발화 루프 폭주**
   - 대응: `self_reflect_token_cap`/`self_reflect_round_cap`/`self_reflect_cooldown_steps` + `τ_stop` 보수화 + supercritical에서 비활성


8) **Intervention 권위 누수(override 유혹)**  
   - 증상: “이 개입이 맞으니까 Gate를 무시” 같은 흐름이 생김(근거/규약 붕괴)  
   - 대응: override 금지(Validator로 탐지) + stop-rule 독립성(τ_stop 영향 0) + 위반 시 강제 COMMIT/쿨다운 상향

9) **Prior 남발로 Gate 편향 고착**  
   - 증상: 특정 action만 계속 선택(경로 고착), 진동은 줄었는데 성능이 썩음  
   - 대응: prior clipping(±0.3 권장) + injection cap(2 권장) + periodic reset(PR) + confidence gating

10) **Stats를 ‘진실’로 착각해서 정책이 굳어버림**  
   - 증상: 초기에 운 좋게 맞은 intervention이 과도하게 강화, 이후 환경 변화에 적응 실패  
   - 대응: stats 업데이트는 Boundary에서만 + confidence 기반 가중(표본 부족 시 영향 제한) + 일정 주기 재평가/감쇠

---




### 4.x (r19) 실패유형 택소노미: “큐레이션 조성”의 축

7가지 실패 모드는 운영 디버깅용 “대분류”다. r19부터는 **큐레이션/학습 데이터 제작**을 위해 아래처럼 ID를 붙여 **조성(composition)** 을 맞춘다.

- 표준 키: `failure_mode_taxonomy_id="FM.v1"`  
- ID 규칙(권장): `FM/<MAJOR>/<MINOR>` (예: `FM/OSC/loop`, `FM/EVID/ghost_evidence`)
- 최소 대분류(=7가지와 매핑):  
  1) `FM/OSC` (oscillation/rumination/loop)  
  2) `FM/PE` (PE mixing, goal/tool/memory mismatch)  
  3) `FM/EVID` (evidence bypass/ghost evidence/근거 누락)  
  4) `FM/ROUTE` (misrouting, wrong tier, wrong search mode)  
  5) `FM/COST` (cost explosion, budget cap hit, tool spam)  
  6) `FM/FORMAT` (schema/contract violation, output drift)  
  7) `FM/CAL` (overconfidence/underconfidence, EOP mismatch)

- 운영 규칙: `DATASET_BUILD_*`에는 반드시 `target_failure_modes[]`와 `failure_mode_counts{}`를 남긴다.  
  - “많이 모았다”는 아무 의미 없고, **어떤 실패를 고쳤는지**가 남아야 한다.
## 5. Gate(GUP + EVC) 구현 가이드

### 5.1 최소 행동 집합(MVP)
- `MAINTAIN`, `VERIFY`, `RETRIEVE`, `REPLAN`, `COMMIT` (5개만으로 시작 권장)
- (추가, 권장) `SELF_REFLECT`: 루미네이션 방지 예산이 준비된 후에만 활성화
- (추가, 권장) `PROBE`: task-irrelevant 진단(PCI-A/A-PCI, ΔPCI, ∆NRS 등). **작업 루프와 분리된 타이밍**으로 돌리고 `probe_budget/probe_frequency`로 통제.
- 이후 `WRITE_MEMORY`, `SUMMARIZE`, `TOOL_CALL`, `INFER_STEP` 확장



### 5.1.0 Intervention-aware Candidate Set (권장, 사실상 필수)

Intervention이 들어오면 Gate 후보 집합이 더 “똑똑해 보이는” 방향으로 편향될 수 있는데,
그게 곧바로 **권위 누수/고착**으로 연결되기 쉽다. 그래서 여기서 상한을 박아 둔다.

- `candidate_injection`은 **최대 N개**(권장 N=2)만 허용  
- `gate_prior`는 **클리핑**(권장 ±0.3) 후에만 사용  
- **Stop-rule(τ_stop) 판단에는 prior 영향 0**  
  - 구현 팁: `EVC_raw`로 stop-rule 판단 → 계속할 때만 `EVC = EVC_raw + prior`로 선택 편향 적용
- prior/injection은 “추천”일 뿐이고, Gate가 선택한 action은 항상 로그로 남긴다(`INTERVENTION_DECISION`/`POLICY_UPDATE` 권장)
### 5.1.1 `SELF_REFLECT`(SRP) 구현 계약(권장)

`SELF_REFLECT`는 “말하기”가 아니라 **저비용 제어(action)** 다.  
핵심은 (i) 프로토콜 고정, (ii) 출력 포맷 고정, (iii) 점수/프록시 로깅으로 “쓸모 vs 루미네이션”을 분리하는 것.

#### (A) 호출 인터페이스(권장)

```text
action = SELF_REFLECT(
  self_reflect_protocol: baseline|srp_strange_loop|srp_control_*,
  self_reflect_variant_id: <id>,
  self_reflect_output_format: reflection_segment|five_adjectives|both,
)
```

#### (B) 실행 래퍼(권장 의사코드)

```text
if budgets.self_reflect_budget == 0 or cooldown.self_reflect > 0:
  return SKIP

pre = snapshot_pre_metrics()        # ContradictionRate_w, RevisionRate_w, RuminationIndex_w, OverconfidentError_w, PolicyFlipRate_w
log_event(SELF_REFLECT_START, {
  self_reflect_protocol: protocol,
  self_reflect_variant_id: variant_id,
  self_reflect_output_format: output_format,
  trigger, state_label, zone,
  pre_metrics: pre
})

packet = run_reflection_model(protocol, variant_id, output_format, token_cap=self_reflect_token_cap)

# 최소 산출물 정규화
five_adj = normalize_five_adjectives(packet)   # 없으면 null
iqs = score_iqs_v0(packet, recent_gate_state)  # 1..5
scs = maybe_compute_scs(five_adj)              # 임베딩 가능할 때만
hap = compute_hap_proxy_delta(pre, post_window_metrics())
five_adjectives = five_adj
reflection_packet = extract_reflection_packet(packet)  # output_format이 포함할 때만
iqs_rater = "model"  # {model|human|hybrid}
embedding_model_id = EMBEDDING_MODEL_ID  # scs 계산 시 사용
text_hash, text_len = hash_and_len(packet)  # 원문 대신 해시/길이만 이벤트에 기록

log_event(SELF_REFLECT_END, {
  reflection_packet: reflection_packet,
  five_adjectives: five_adjectives,
  iqs_1to5: iqs,
  iqs_rater,
  scs_pairwise_cosine_mean: scs,
  embedding_model_id,
  hap_proxy_delta: hap,
  reflection_text_hash: text_hash,
  reflection_text_len: text_len
})

# JML에는 “요약 + 어떤 결정을 바꿨는지”만 기록(원문은 Raw Event Log/디버그 스토어)
jml.append({type:SELF_REFLECT, summary, impact_on_gate, protocol, iqs_1to5: iqs})
```

#### (C) IQS/SCS/HAP의 “운영적” 사용법(권장)

- `IQS_1to5`가 낮고(`≤2`) `RuminationIndex`가 높으면:
  - `self_reflect_budget` ↓, `self_reflect_cooldown_steps` ↑, 또는 supercritical에서 비활성
- `SCS_pairwise_cosine_mean_w`가 과도하게 높아지면(형용사 수렴):
  - `srp_strange_loop` 대신 컨트롤 프로토콜로 회귀 테스트(“프로토콜이 감정적/서사적 고착을 유발했는지” 확인)
- `HAP_*_delta_w`가 악화되면:
  - SRP를 “검증 전환”에만 제한(VERIFY 강제), 또는 `τ_stop`을 더 보수화

> 참고: 정의/필드는 Appendix를 따른다. Canonical 규약(뷰/근거 분리)은 유지한다.

### 5.2 히스테리시스/쿨다운(필수)
- 각 고비용 행동(VERIFY/RETRIEVE/REPLAN/TOOL_CALL)에 대해:
  - `θ_high`: 시작 임계치
  - `θ_low`: 종료 임계치
  - `cooldown_steps`: 실행 후 최소 유지 스텝
- 구현: `(pe_score > θ_high && cooldown==0) -> start`, `(pe_score < θ_low) -> stop`

**state-conditioned thresholds (권장)**
- `θ_high/θ_low`, `cooldown_steps`, (선택) `τ_stop` 보수화는 `state_label`에 따라 기본값을 다르게 둔다.
  - 예: `(supercritical, VERIFY)`는 verifier 진입을 빠르게(임계↓) 하되, tool/retrieval 폭주는 더 늦게(임계↑) 허용
  - 예: `(supercritical, COMMIT)`는 분기/툴을 조이고 빠르게 커밋(쿨다운↑, branching_cap↓)하도록 편향


### 5.2.1 Batched 후보 선택 + 주기적 리셋(CBS/PR) (권장, 저비용)

`Gate`가 “다음에 뭘 할지”를 고를 때, **단일 샘플**로 바로 커밋하면 운이 나쁜 순간에 정책이 튀고(=진동) 그 다음 스텝들이 다 망가진다.  
그래서 후보를 **작게 여러 개** 만들고, **연속성 + 기대가치(EVC)** 로 고르는 편이 비용 대비 이득이 좋다.

- 후보 생성 예:
  - (계획) `REPLAN` 후보 3개(짧은 1~2스텝 플랜)  
  - (행동) `VERIFY/RETRIEVE/TOOL_CALL/COMMIT` 중 상위 K개  
  - (레버) `policy_levers'` 업데이트 후보 K개(예: verifier_budget를 올리는 방향 2개 + 유지 1개)

- 선택 스코어(권장 형태):
  - `score = α·EVC(candidate) - β·ContinuityDistance(candidate, last_committed)`
  - ContinuityDistance 예: 직전 `plan_signature`/`recent_actions_topk`/`policy_levers`와의 거리(L2, edit distance, Jaccard)

- 주기적 리셋(필수는 아님, but 진짜 도움됨):
  - 트리거: `실패 반복`, `PolicyFlipRate↑`, `Boundary 직후 정체`, `동일한 VERIFY/RETRIEVE 왕복`  
  - 동작: β(연속성 페널티)를 일시적으로 낮추거나, 다양성 우선 후보를 1회 선택(탐색)  
  - 목적: “안정적으로 잘못된 국소해”에서 빠져나오기

- 로깅(권장):
  - `CANDIDATE_BATCH_GENERATED`: k, 후보별 {evc_est, continuity_dist, action_type} 요약
  - `CANDIDATE_SELECTED`: chosen_id + reset 여부 + chosen score

> 주의: 후보/스코어는 **뷰(view)** 다. Evidence/Claim 권위에는 영향 주지 않는다.

### 5.2.2 “가속도(2차 변화량) 패널티” 기반 jerk-limited 업데이트 (권장)

변화율(Δ)만 제한하면 “한 번 튀고 다음에 반대로 튀는” 형태의 발작이 남는다.  
정책 레버와 Sidecar `e_t`는 **Δ²(가속도/jerk)** 까지 제한해서 완만하게 움직이게 하는 게 안전하다.

**정책 레버 벡터 L(t) 업데이트 예(스칼라면 각 성분에 적용)**

- `d1 = L(t) - L(t-1)`  
- `d2_proposed = (L_proposed - L(t)) - d1`  # = Δ²
- `d2 = clip(d2_proposed, -J_max, +J_max)`  
- `L(t+1) = L(t) + clip(d1 + d2, -D_max, +D_max)`  # (선택) Δ cap과 함께

권장 운영:
- `zone=supercritical`에서는 jerk cap을 **더 강하게**(J_max↓) 해서 폭주 억제
- “충격(shock)” 이벤트(예: PE_tool 급등, 검증 실패 폭발)에서는 **일시 완화**(J_max↑) 가능  
  - 단, 완화 사실은 이벤트로 남긴다(`POLICY_SMOOTHING_APPLIED`에 mode 기록)

로깅(권장):
- `POLICY_SMOOTHING_APPLIED`: delta_norm, jerk_norm, cap_hit_flags, (선택) shock_override 여부
- `STATE_SNAPSHOT.payload.state_core.policy_smoothing_w`: window 집계(delta/jerk p95 등)


### 5.3 EVC 실용 구현(권장 최소)
- benefit: `w_tool·PE_tool + w_mem·PE_memory + w_goal·PE_goal + w_lm·PE_lm`
- cost: `c_tok·Δtokens + c_tool·Δtool + c_lat·Δlatency + c_res·resource_load`
- `EVC = benefit - λ·cost`


### 5.3.1 `resource_load`/`resource_state` 구현(권장)

**핵심**: `resource_load`는 “지금 압력(고대역)”, `resource_state`는 “누적 피로(저대역)”로 분리한다.  
이 둘은 **근거가 아니라 제어 신호**이므로 Evidence/Claim에는 절대 넣지 말고, `STATE_SNAPSHOT.payload.metrics_optional.*`에만 넣는다.

권장 최소 구현(스칼라 0..1 정규화):

- `token_pressure = clamp(tokens_out / token_p95_baseline, 0..2) / 2`
- `tool_pressure  = clamp(tool_calls_in_window / tool_cap, 0..2) / 2`
- `lat_pressure   = clamp(latency_p95_ms / latency_baseline_ms, 0..2) / 2`
- `err_pressure   = clamp(retry_or_failure_rate / err_baseline, 0..2) / 2`

- `resource_load = w_tok*token_pressure + w_tool*tool_pressure + w_lat*lat_pressure + w_err*err_pressure`
  - 기본 가중치 예: `w_tok=0.35, w_tool=0.25, w_lat=0.25, w_err=0.15`
- `resource_state = EMA(resource_state, τ_big) + recovery - α*resource_load`
  - 예: `τ_big=64~256 steps`, `recovery=0.01`, `α=0.02` (하드웨어/모델/route_tier에 따라 튜닝)
  - `resource_state`는 0..1로 clip.

**EVC 비용항 연결(예시)**  
- `c_res` 또는 `λ`를 `resource_state`에 따라 키운다:  
  - `λ_eff = λ * (1 + k * resource_state)` (k=0.5~2)
  - 또는 `c_res_eff = c_res * (1 + k * resource_state)`

> 해석: slow resource(메모리) 동역학이 느릴수록 전역 동조/장거리 질서(LRO)가 나타날 수 있다는 관찰(2409.16394v5)을 “운영 안정화 레버”로 바꾼 것이다.  
> 즉, “동조”를 완전히 없애기보다 **계측하고 가격화**해서 건강한 구간으로 유지한다.


### 5.4 Stop rule(필수)
- `max_a EVC(a) < τ_stop`이면 **즉시 COMMIT**  
- τ_stop는 workload가 높거나(=비용 큰 상황) 최근 진동이 감지되면 자동 상향(보수화)

- **Stop-Rule Firewall(SRF)**  
  - stop 판정은 **항상 `EVC_raw`만** 사용(`prior=0`).  
  - `τ_stop` 조정은 **StopRuleController(진동 억제기)** 만 가능(Intervention/Policy 금지).  
  - 금지 입력: `EES/LPS/competence_hat/risk_score/intervention_prior/*/candidate_injection/*/Workspace 요약·점수`.  
  - 변경 사유는 로그(`halt_reason`/`tau_stop_reason`)로 남긴다.



### 5.3.2 Avalanche/Burst 감지(권장)

전역 동조가 “좋은 협응”인지 “오류 증폭”인지 구분하려면, 활동의 *burst*를 숫자로 잡아야 한다.  
여기서는 schema를 늘리지 않고, **Raw Event Log를 binning** 해서 계산하는 것을 기본으로 둔다.

- bin: 0.5~2.0s 또는 고정 이벤트 수(예: 50 events) 중 하나로 통일
- `activity_rate(t)`(예시):  
  `MODULE_CALL + TOOL_CALL + RETRIEVAL + POLICY_UPDATE + SELF_REFLECT`를 가중 합한 bin당 이벤트 수
- threshold: rolling `μ + K·σ` (K=2~3 권장)
- avalanche segment: threshold 초과 bin이 연속된 구간
  - `size`: 초과분 합(또는 단순 이벤트 합)
  - `duration`: bin 길이(초 단위)
  - `participation`: 구간 내 활성 모듈 수(서로 다른 module 카운트)

저장(권장):
- 실시간 근사치: `STATE_SNAPSHOT.payload.metrics_optional.avalanche_index`  
- 오프라인 집계: `SCORE_REPORT.payload.stab_raw.Avalanche*`  
**필드 매핑(필수, 구현자용)**
- `resource_load`  → `STATE_SNAPSHOT.payload.metrics_optional.resource_load`
- `resource_state` → `STATE_SNAPSHOT.payload.metrics_optional.resource_state`
- `avalanche_index`(실시간 근사치) → `STATE_SNAPSHOT.payload.metrics_optional.avalanche_index`
- 오프라인 집계(정확치) → `SCORE_REPORT.payload.stab_raw.*`  
  (`AvalancheSize_{mean,p95,max}`, `AvalancheDuration_{mean,p95,max}`, `AvalancheParticipation_{mean,p95,max}`, `AvalancheIndex_w`)

**zone=supercritical 승격 규칙(v0, 권장 디폴트)**
- 목적: “폭주/오류 증폭”을 **정량 트리거**로 잡아 downshift가 늦지 않게 한다.
- 승격 조건(OR):
  - (A) `STATE_SNAPSHOT.payload.metrics_optional.avalanche_index ≥ 0.85` 가 **연속 2회**(스냅샷) 발생
  - (B) `SCORE_REPORT.payload.stab_raw.AvalancheIndex_w ≥ 2.5` (WL 보정 잔차 기준이면 더 좋음)
- 유지/해제(hysteresis):
  - 승격 후 최소 `min_dwell_steps=8~32` 유지(진동 방지)
  - 해제는 `avalanche_index ≤ 0.60` 가 **연속 3회** 또는 dwell 만료 후 `phase=COMMIT`로 복귀 신호가 우세할 때
- 주의: 승격은 “Decision Authority”가 아니라 **운영 플래그**다. Gate(EVC)의 stop-rule/guardrails를 대체하지 않는다.

반응(권장 최소):
- burst가 길거나 참여 모듈이 많아지면: `branching_cap↓`, `tool_rate_limit↓`, `cooldown_steps↑`, `τ_stop↑`
- `SELF_REFLECT`는 **폭주 구간에서는 금지/쿨다운**(루미네이션 방지)


### 5.5 예산 레버(필수)
- `retrieval_budget`: TopK, recency bias, 호출 횟수/턴
- `verifier_budget`: 근거 요구 강도, 검증 깊이/턴
- `tool_rate_limit`: 툴 호출 빈도/턴
- `plan_depth`: lookahead 깊이

---




### 5.x (r19) stochastic 레버 자동 보정: eff_dim_hat 기반

Gate가 sampling/Retry/perturb 레버를 만질 때(temperature/top_p/노이즈/perturb), **유효 차원(eff_dim_hat)** 로 스케일을 자동 보정한다.

- eff_dim_hat(권장 정의): Axis Bank 축 벡터의 분산 스펙트럼으로 계산한 participation ratio  
  - `d_eff = (Σλ)^2 / Σ(λ^2)` (clamp: [d_min, d_max])
- 스케일(권장):
  - `scale = sqrt(d_ref / clamp(d_eff, d_min, d_max))`
  - `temperature = clamp(temp_base * scale, temp_min, temp_max)`
  - `perturb_sigma = clamp(sigma_base * scale, sigma_min, sigma_max)`
- 로그(필수): `raw`와 `effective`를 같이 남긴다. (Appendix §12.2.x 참고)

이 규칙의 목적은 “노이즈의 총 에너지”를 일정하게 유지해서, 축이 늘거나 줄어도 탐색이 과도하게 발산/수축하지 않게 하는 것.
## 6. Boundary 구현 가이드

### 6.1 Boundary 신호(권장)
- 목표(goal_id) 변경
- 툴 페이즈 종료(도메인 작업 완료)
- 검증 실패 누적(예: 동일 주장 2회 이상 불일치)
- `PE_tool` 급등(현실 불일치)
- 사용자 명시 종료

### 6.2 닫을 때(commit) 해야 하는 것(필수)
- episode summary(뷰) 생성(선택)
- `StateSnapshot` 로그(필수 이벤트)
- Self-Graph 엣지 업데이트:
  - **Claim 레이어(필수)**: `NEXT(Δt)`, `SUPPORTED_BY`, `REFUTES`, claim 버전 관계(`revises/supersedes/contradicts`)
  - **Influence 레이어(옵션)**: HAG-style grow/prune로 `ASSOCIATES_WITH`/`INFLUENCES` 등 영향 엣지 갱신(§8.3)
    - 원칙: Boundary에서만 커밋, Claim/Evidence 권위와 분리, cap/cooldown/mode 준수


### 6.3 Outcome Vector + intervention_stats 업데이트(권장)

Boundary에서 “이번 에피소드가 어땠는지”를 숫자로 남겨야 Intervention/Policy가 다음 번에 덜 멍청해진다.

- Outcome Vector(권장 최소): `Perf / Stab / Cost`
  - Perf: 성공 판정(목표 달성/검증 통과/오류 감소 등)
  - Stab: 진동/왕복/정책 플립/근거 충돌률(낮을수록 안정)
  - Cost: tokens/tool_calls/latency/verifier_count 등

- 업데이트 규칙:
  - `applied_interventions`에 대해서만 EMA 업데이트(Perf/Stab/Cost 각각)
  - 업데이트는 **Boundary에서만 커밋**(스텝 단위 즉흥 갱신 금지)
  - confidence(표본/신뢰도)가 낮으면 다음 에피소드에서 prior 반영을 자동 제한

권장 의사코드:

```text
if boundary.close_episode:
  outcome = compute_outcome_vector(perf_raw, stab_raw, cost_raw, wl_covariates)
  log_event(SCORE_REPORT, {outcome_raw, wl_covariates})

  for iv in decision_record.applied:
    stats[iv] = ema_update(stats[iv], outcome, alpha=policy_levers.iv_ema_alpha)
    stats[iv].confidence = update_confidence(stats[iv])  # n, variance, recency 등

  persist(stats)   # schema validate
```

---

### 6.4 Iterative Deployment Loop(옵션): Deployment → Curation → (ArtifactTune | Finetune)

이 절은 “배포(실사용)에서 나온 로그를 반복 개선 루프로 재사용한다”는 계열의 연구를 Augnes Local 운영 언어로 번역한 것이다.  
**기본 트랙은 가중치 학습이 아니라 아티팩트(Self-Tuning)** 이며, 가중치 튜닝은 조건부 옵션이다. (하드웨어/리스크/ROI 관점에서 기본값은 “안 한다”)

#### 6.4.1 입력/출력(권장 최소)

- 입력(최소):
  - Boundary 이후 생성된 `TraceCapsule` 후보(+ `TRACE_CAPSULE_COMMIT`)
  - (옵션) `SCORE_REPORT`, `PROBE_RUN_*` (회귀/검증)
- 출력(최소):
  - (A) TraceCapsule 장기 저장/인덱싱 + 재사용 계측(`TRACE_CAPSULE_REUSE`)
  - (B) 아티팩트 튜닝 계보/승격/롤백 로그(`ARTIFACT_TUNE_*`)
  - (C, 옵션) 오프라인 미세튜닝 런(`FINETUNE_RUN_*`)

#### 6.4.2 표준 파이프라인(권장)

1) **수집**: `TRACE_CAPSULE_COMMIT` 후보 중 Validator L1(pass)만 모은다.  
2) **큐레이션(조성 고정)**: `reuse_key` 단위 대표를 남기되, 먼저 `failure_mode_id`로 **stratified 샘플링**해 조성을 맞춘다.
   - 목표: 실패유형별로 “필요한 만큼”만 남기고, 나머지는 과감히 버린다(양이 아니라 조성).  
   - tie-break(권장): `quality_score`↓? (높을수록 우선) → `tokens/tool_calls`(낮을수록 우선) → 최근성  
3) **실패유형별 타겟 데이터 생성(권장)**: 로그에서 부족한 `failure_mode_id`를 뽑아, **의도적으로 그 실패가 터지는 입력/조건**을 만든다(하드 네거티브).
   - Router: 혼동 쌍(route_tier 경계)을 늘린다.
   - Verifier: 그럴듯하지만 틀린 사례(근거 위조/제약 위반)를 늘린다.
   - Sidecar: zone/τ/Q/M 드리프트를 유발하는 사례를 늘린다.

4) **게이팅**: `memory_write_gate` + Budget/Guardrails(§0.3.1, Canonical §11)로 커밋을 통제한다.  
4) **커밋**: TraceCapsule을 장기 저장하고, 이후 동일 `reuse_key`에서 **재사용을 기본 경로**로 둔다.  
5) **오프라인 윈도우(옵션)**: Dataset Build → ArtifactTune(Eval/Commit) → (조건부) Finetune

#### 6.4.3 Dataset Build 이벤트(옵션, 재현성 확보)

- `DATASET_BUILD_START/END`: 수집 범위/필터/중복제거/산출물 해시를 남겨 재현성을 확보한다.
- 권장 payload(요지):
  - `dataset_build_id`, `dataset_kind`, `intended_use`
  - `source_query`(이벤트/기간/조건), `filter_policy_hash`, `dedupe_policy`
  - (END) `counts{raw,valid,curated}`, `output_ref`, `dataset_hash`, `status`

> 주의: dataset/파생 분석 스토어는 **Evidence 권위를 만들지 않는다**. (Integration Map의 금지 규칙 준수)

#### 6.4.4 Artifact Self-Tuning 트랙(권장 기본)

- 이벤트: `ARTIFACT_TUNE_CANDIDATE/EVAL/COMMIT/ROLLBACK`
- 규칙(필수):
  - **덮어쓰기 금지**: `base_version → candidate_version → promoted_version` 계보 유지
  - 즉시 복구: `rollback_token` 필수
  - 동일 입력 세트(A/B)로 비교(`eval_suite_id/judge_config_hash` 고정)

#### 6.4.5 (옵션) Weight Fine-tuning 트랙(후순위)

- 실행 조건(권장 최소):
  - 강한 Validator/Probe(회귀 감지 가능) + 오염 통제 + 카나리/롤백 가능
  - 메인 Step Loop의 stop-rule(`EVC_raw`) / Evidence Contract를 인라인에서 교란하지 않음
- 이벤트: `FINETUNE_RUN_START/END`
- 운영 원칙:
  - “배포 모델 교체”는 별도 게이트(카나리)로만 수행
  - Verifier 튜닝은 마지막(§0.3.1 원칙 유지)

#### 6.4.6 최소 성공 기준(운영 판단)

- 개선 신호(기대):
  - `TraceReuseHitRate↑`, `StepReductionOnReuse↑`, `ReuseSuccessRate(validator pass) 유지/상승`
- 중단/롤백 신호(즉시 대응):
  - `QuarantineRate↑` 또는 `RegressionAfterGate↑` 또는 안정성(진동/폭주) 악화

> 참조: Canonical §11.1.3/§11.2, Logging Appendix §12.2(이벤트 계약) / §11(메트릭), Schema Bundle `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml`.


#### 6.4.x (r19) Head 강화 루프(백본 동결)
- 이 루프의 1차 목표는 백본 학습이 아니라, `router_head/verifier_head/sidecar_head`를 얇게 개선하는 것.
- 로그/데이터셋/승격은 Appendix의 `DATASET_BUILD_*`, `FINETUNE_RUN_*`(trainable_component)로 추적.

## 7. 메모리/Evidence/Claim 운영 규칙

### 7.1 Evidence 운영
- Evidence는 **인입 파이프에서만** 생성(생성 후 내용 덮어쓰기 금지)
- `evidence_id`는 UUID
- `immutable_hash`는 필수
- `evidence_key`는 dedupe/추적용으로 권장(동일 내용 중복 인입 방지에 유용)

### 7.2 Claim 운영(덮어쓰기 금지)
- Claim을 수정하지 않는다.
- 새 Claim을 추가하고 관계 엣지로 연결한다.
- 외부 사실 claim은 `evidence_ids[]`를 반드시 포함하는 것을 원칙으로 한다.

### 7.3 Workspace 운영(요약은 뷰)
Workspace에는:
- `active claim pointers`
- `summary`
- `top evidence_ids[]`
만 유지하고, 상세는 JML/Registry/Graph로 내려보낸다.

---

## 8. 로깅(Logging) 구현 가이드

### 8.1 3가지 기록 스트림(권장)
1) **Raw Event Log** (`SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml`)
2) **Evidence Registry** (`SSOT_SCHEMA_BUNDLE.zip ▸ schema/evidence.schema.yaml`)
3) **JML** (`SSOT_SCHEMA_BUNDLE.zip ▸ schema/jml_entry.schema.yaml`)
(+ Claim은 `SSOT_SCHEMA_BUNDLE.zip ▸ schema/claim.schema.yaml`)

### 8.2 이벤트 타입 최소 세트(권장)
Appendix 12.2의 최소 세트를 기본으로 하고, 아래를 최소로 권장한다.

- `MODULE_CALL_START/END`
- `TOOL_CALL_START/END`
- `RETRIEVAL_QUERY, RETRIEVAL_RESULT`
- `MEMORY_READ/WRITE/COMPRESS/PRUNE`
- `STATE_SNAPSHOT`
  - (추가, 권장) `payload.metrics_optional.resource_load/resource_state/avalanche_index/comp_index`를 함께 기록(스키마 확장 불필요)
- `POLICY_UPDATE`

- (추가, 권장) `INTERVENTION_RETRIEVED` / `INTERVENTION_DECISION` (Top-K/적용/거부 사유)
- `PULSE_TRIGGER`
- `SCORE_REPORT` (Perf/Stab/Cost 원시값 + WL 포함)

### 8.3 SCORE_REPORT(권장, 강력 추천)
평가/대시보드용 이벤트는 **원시값 + WL covariates**를 함께 남겨야 해석이 가능하다.

- payload에 최소 포함:
  - `Perf_*` (Δ성능 계산용 원시)
  - `Stab_*` (ΔStab 구성요소 원시)
  - `Cost_*` (토큰/latency/tool_calls 등 원시)
  - `WL_*` (난이도/부하 보정용)

### 8.4 (NEW) 파생 분석 스토어(옵션 A): DuckDB + Parquet (권장)

이 절은 “항상 켜둔 TSDB”를 먼저 깔지 않고도, 로컬에서 **충분히 빠른 회귀/원인분해/SSM-lite 업데이트**를 가능하게 만드는 최소 구현 가이드다.

- **정체성**: 파생 분석 스토어는 *권위 저장소가 아니라*, Raw Event Log/JML/Evidence를 “잘 쿼리하기 위한” **뷰(View) 저장소**다.
- **금지**: 여기서 나온 숫자/집계로 Evidence/Claim을 만들거나 바꾸지 않는다.
- **필수**: 모든 파생 레코드는 원본으로 되돌아갈 수 있어야 한다(`source_event_id`/원문 경로/해시 포인터).

#### 8.4.1 데이터 흐름(표준)
1) Raw Event Log(JSONL) + JML(JSONL) + Evidence Registry(JSONL/DB)을 **그대로 유지**
2) ETL(가벼운 추출)로 Parquet dataset 생성
3) DuckDB에서 Parquet를 attach해서 쿼리
4) 산출물은 아래 둘 중 하나로만 되돌린다
   - (A) **JML_ENTRY**로 “결정/교정/원인분해 요약”만 남김(원문은 포인터)
   - (B) offline-config(정책 테이블/threshold/centroid 버전)을 갱신(온라인 자동 갱신 금지)

#### 8.4.2 권장 디렉토리 레이아웃(예시)
- `logs/raw/event_log/YYYY-MM-DD.jsonl`
- `logs/jml/jml/YYYY-MM-DD.jsonl`
- `logs/registry/evidence.jsonl` (또는 DB)
- `analytics/parquet/events_flat/day=YYYY-MM-DD/*.parquet`
- `analytics/parquet/signals/day=YYYY-MM-DD/*.parquet`
- `analytics/duckdb/augnes_analytics.duckdb` (옵션, 캐시/머티리얼라이즈용)

> 운영 팁: 원본(JSONL)과 파생(Parquet)은 **물리 경로를 분리**해라. 디버깅할 때 정신 건강에 좋다.

#### 8.4.3 Parquet 최소 계약(요지)
- `events_flat`는 **이벤트 1건=행 1개**다.
  - 필수 컬럼: `event_id`, `event_type`, `episode_id`, `trace_id`, `event_time`, `observed_time`, `recorded_time`, `event_time_status`, `actor`, `payload_json`
  - 권장 추가 컬럼(자주 쓰는 것만): `state_label`, `zone`, `phase`, `route_tier`, `macro_state_id`, `macro_state_version`, `macro_state_confidence`, `Cost_*`, `WL_*`, `tau_hat/Q_hat/M_hat`
- `signals`는 **시계열 포인트(롱 포맷)** 다.
  - 필수: `axis`, `value`, `unit`, `observed_time`, `episode_id`, `source_event_id`, `source_event_type`
  - 목적: 대시보드, 회귀, 상관/지연 분석을 “스키마 확장 없이” 빠르게 하기 위함

정식 스키마는 Schema Bundle의 아래 두 파일을 따른다.
- `SSOT_SCHEMA_BUNDLE.zip ▸ schema/analysis_event_flat.schema.yaml`
- `SSOT_SCHEMA_BUNDLE.zip ▸ schema/analysis_signal.schema.yaml`

#### 8.4.4 DuckDB 표준 뷰 4개(권장, 고정)
이 4개만 먼저 박아두면, 회귀/디버깅/SSM-lite 업데이트가 다 빨라진다.

추가(권장): `macro_state_catalog.parquet` (low-cardinality)
- 목적: `macro_state_version`별 centroid 해시/하이퍼파라미터/대표 episode 샘플을 한 군데에 모아 “해석 가능한 디지털 트윈”으로 만든다.
- 최소 컬럼(권장): `macro_state_version`, `macro_state_id`, `macro_state_method`, `centroid_hash`, `macro_obs_schema_id`, `prototypes_topk_json`
- 주의: 이것도 권위 저장소가 아니고, 원본 로그/포인터로만 연결한다.


1) `v_state_snapshot`: `STATE_SNAPSHOT`만 모은 뷰(자원/상태/라벨)
2) `v_score_report`: `SCORE_REPORT`만(Perf/Stab/Cost + WL)
3) `v_probe_runs`: `PROBE_RUN_*`를 start/end로 묶은 뷰
4) `v_policy_updates`: `POLICY_UPDATE`만(lever 변화/이유)

예시(개념 스케치, 실제 JSON path는 로그 payload에 맞춰 조정):

```sql
-- events_flat(event_type, observed_time, episode_id, payload_json, ...)
CREATE OR REPLACE VIEW v_state_snapshot AS
SELECT
  observed_time,
  recorded_time,
  episode_id,
  trace_id,
  state_label,
  zone,
  phase,
  route_tier,
  macro_state_id,
  macro_state_version,
  macro_state_confidence,
  Cost_vram_peak_mb,
  Cost_cpu_ram_peak_mb,
  Cost_model_load_ms,
  Cost_oom_count,
  tau_hat,
  Q_hat,
  M_hat,
  WL_profile_id,
  WL_context_len,
  payload_json
FROM events_flat
WHERE event_type = 'STATE_SNAPSHOT';

CREATE OR REPLACE VIEW v_score_report AS
SELECT * FROM events_flat WHERE event_type = 'SCORE_REPORT';

CREATE OR REPLACE VIEW v_policy_updates AS
SELECT * FROM events_flat WHERE event_type = 'POLICY_UPDATE';

CREATE OR REPLACE VIEW v_probe_runs AS
SELECT
  s.episode_id,
  s.payload_json AS start_payload,
  e.payload_json AS end_payload,
  s.observed_time AS start_time,
  e.observed_time AS end_time
FROM events_flat s
JOIN events_flat e
  ON s.event_type='PROBE_RUN_START'
 AND e.event_type='PROBE_RUN_END'
 AND json_extract_string(s.payload_json, '$.probe_id') = json_extract_string(e.payload_json, '$.probe_id');
```

#### 8.4.5 SSM-lite(digital twin) 업데이트를 A로 돌리는 이유
- `macro_state_id` centroid 학습/버전 관리, `P_hat` 전이행렬(EMA) 업데이트, `state_risk[m]` 집계 같은 건 **전형적인 배치 작업**이다.
- 온라인 루프에 끼워 넣으면 비용/진동/오염이 늘어난다.
- 따라서 A에서:
  - (1) 최근 N boundary의 `macro_obs_t`를 뽑고
  - (2) centroid를 갱신(버전 올림)
  - (3) `P_hat`/riskset/state_risk를 재산출
  - (4) 결과를 **offline-config**로 배포(또는 JML에 포인터 기록)


#### 8.4.5.1 (NEW) KJEPA(koopman invariants)로 macro_state_id 만들기 — “클러스터가 그냥 생기는 이유”를 이용하기

이 섹션은 arXiv:2511.09783(AAAI 2026)의 결과를 **Augnes 로깅/SSM-lite에 맞게 엔지니어링 번역**한 것이다.

**핵심 요약**
- JEPA는 `f(x_t)`를 `f(x_{t+Δ})`로 예측하게 만들면, “예측이 가장 쉬운 축”을 우선적으로 담는다.
- 여러 레짐(regime)이 섞인 시계열에서 그 “가장 쉬운 축”은 보통 **레짐 불변량(레짐 indicator)** 이고,
- 선형 predictor `M`에 **near-identity 유도(M≈I)** 를 걸면, indicator가 섞여버리는 동치해(얽힘)를 피하면서 **레짐 분리 임베딩**을 얻는다.

---

##### (A) 데이터셋 만들기 (옵션 A / Analysis Store)

- 소스: `STATE_SNAPSHOT.payload.state_core` 또는 `JML_ENTRY.payload.digital_twin.macro_obs_*`
- 타깃: `macro_obs_t` 벡터(권장: 이미 정의한 macro_obs slot 규약 그대로)
- 윈도우: 길이 `T`의 시퀀스 (예: 64), 예측 간격 `Δ` (예: 1~4 boundary)

`DATASET_BUILD_START/END`로 기록:
- `dataset_kind="macro_obs_seq"`
- `intended_use="rep_train/koopman_jepa"`
- `source_query`: episode/trace 필터(최근 N일, 특정 bstage 등)

---

##### (B) 학습(가벼운 self-supervised head)

모델(최소형):
- encoder `fθ`: MLP(2~4 layer) 또는 1D conv (입력: macro_obs_t)
- predictor `M`: k×k 선형 행렬 (학습 파라미터)
- loss:
  - `L_pred = || M fθ(x_t) - stopgrad(fθ(x_{t+Δ})) ||^2`
  - `L_id = λ ||M - I||_F^2`  (또는 spectral radius penalty)
  - `L = L_pred + L_id`

운영 팁(로컬 기준):
- k(잠재 차원): 16~64 선에서 시작(“레짐 수 r”을 모르면 넓게 잡고 나중에 PCA/k 선택)
- batch: 256~2048 (macro_obs가 작으면 커도 됨)
- optimizer: AdamW
- 학습은 **배치 작업**으로만(온라인 루프 금지)

로깅(권장):
- `FINETUNE_RUN_START/END`를 “학습 런” 공통 포맷으로 재사용하되,
  - `method="koopman_jepa_v0"`
  - `base_model_id="macro_obs_encoder_mlp_v0"` 같은 식으로 명시
  - `eval_suite_id="koopman_invariants_v0"`

---

##### (C) 클러스터링 → macro_state_catalog 생성

1) 모든 boundary에서 `z_inv = fθ(x_t)`를 뽑는다.  
2) k-means/GMM으로 클러스터링한다. (k는 AIC/BIC, elbow, 또는 운영상 고정)  
3) `macro_state_id = "ms:<cluster_id>"`로 배정하고,
4) `P_hat`(전이행렬)·`state_risk[m]`를 재계산한다.

산출물:
- `macro_state_catalog` (centroid/버전/프로토타입/리스크/전이)
- `digital_twin.macro_state_version` 증가
- `macro_state_method_params_hash` 갱신

---

##### (D) PROBE(필수에 가깝다)

- invariance_score: 같은 macro_state 내에서 `z_inv` 분산이 낮은가?
- separation_score: macro_state 간 마진이 있는가?
- identity_penalty: `||M-I||`가 충분히 작은가?
- spectral_radius: `ρ(M)`이 1 근처인가?
- entanglement_score: centroid를 PCA했을 때 축이 “돌아간 정도”(회전/혼합) 추정

---

##### (E) 계산 자원 감각(솔직 버전)

- **이건 “LLM 학습”이 아니라 “작은 head 학습”**이라서, 입력이 `macro_obs` 같은 저차원 벡터면 비용은 보통 작다.
- GPU가 있으면 수십 분~수 시간 단위로 “최근 N만” 빠르게 돌릴 수 있고, CPU로도 야간 배치로 충분히 가능하다.
- 비용이 커지는 경우는 딱 하나: `macro_obs`를 과하게 키우거나(고차원), “윈도우 encoder를 거대한 트랜스포머로” 만들 때다. 그건 네 하드웨어(4070S 12GB)에서는 굳이 할 이유가 없다.


#### 8.4.6 (NEW) macro_state_catalog (권장): centroid/버전/프로토타입을 한 군데에 고정
- 목적: `macro_state_id`가 숫자놀이로 끝나지 않게, "이 버전의 centroid가 무엇이고 대표 사례가 뭐였는지"를 **항상 한 파일**에서 재현 가능하게 만든다.
- 산출물(권장, Parquet 또는 JSONL):
  - `macro_state_version`, `centroid_hash`, `macro_obs_schema_id`, `macro_state_method`, `macro_state_method_params_hash`
  - `state_id`(=macro_state_id), `centroid_vector_ref`(또는 centroid 자체), `cluster_size`
  - `prototype_episode_ids_topk`: [{`episode_id`, `score?`}]
  - (옵션) `state_risk[m]`, `risk_set_id`, `risk_thresholds`
- 규칙:
  - 온라인 루프는 **할당/트리거만** 하고, centroid/카탈로그는 배치에서만 갱신한다(진동/비용 방지).
  - 카탈로그가 갱신되면 `macro_state_version`을 반드시 올린다(혼합 금지).

#### 8.4.7 로컬 자원 캡(4070S 12GB + RAM 32GB 기준)
DuckDB는 기본 설정이 메모리를 크게 잡을 수 있으니, LLM과 공존시키려면 “캡”을 걸어라.
- `memory_limit`: 4GB~8GB 권장
- `threads`: 4 권장(풀 스레드 쓰면 RAM이 먼저 죽는 경우가 많다)
- `temp_directory`: NVMe로 지정 + temp 크기 상한(가능하면)

> 결론: A는 ‘버스트형’이라 캡만 걸면 로컬에 매우 잘 맞는다. 항상 켜진 모니터링(B)은 그 다음에 해도 된다.


### 8.5 Compressibility Signals(CompIndex/CompCurve) 구현(권장, 저비용)

**왜 넣나?**  
`RuminationIndex`는 “자기반추 횟수/토큰” 기반이라 **형식적으로 멀쩡한 반복**(같은 플랜/같은 레버 진동)을 잘 못 잡는다.  
CompIndex는 “시퀀스 자체의 규칙성”을 잡는다. 딱 그 정도다(=권위 없음).

#### 8.5.1 online: compute_compindex() (권장 최소)

입력(권장):
- `token_window`(최근 N토큰 또는 문장 단위 문자열)
- `policy_delta_window`(최근 K스텝의 Δpolicy_levers; float → int16/int8 양자화 추천)
- `et_window`(최근 K스텝의 e_t 또는 zt_summary; float → int8 양자화 추천)

산출(권장):
- `Comp_token_lz = zlib(token_bytes)/len(token_bytes)`
- `Comp_policy_lz = zlib(policy_bytes)/len(policy_bytes)`
- `Comp_et_lz = zlib(et_bytes)/len(et_bytes)`

구현 팁:
- 길이가 너무 짧으면 비율이 왜곡된다 → `raw_bytes >= 256` 같은 하한을 두고, 미달이면 null.
- “압축기 종류”를 고정해라(예: zlib level=6). 바꾸면 회귀가 깨진다.
- float 직렬화는 **고정 소수점**으로(예: `int8(round(x/scale))`) 해야 의미가 생긴다.

로그 권장:
- `STATE_SNAPSHOT.payload.metrics_optional.comp_index.*`
- `analysis_signal(axis=Comp_*, value=...)`

SRF/Downshift 연결(권장):
- 과압축(Comp↓) + GateFlip↑ + Rumination↑ ⇒ `τ_stop↑` 또는 `self_reflect_cooldown_steps↑`
- 저압축(Comp↑) + PolicyFlip↑ + CSI↓ ⇒ VERIFY 비중↑ 또는 “강제 COMMIT + 리셋” 후보

#### 8.5.2 offline: CompCurve_glasso_v0 (옵션)

**언제 쓰나?**  
macro_obs 차원이 16~64 수준이면, 하루/주 단위로 “레짐별 의존성 구조”를 확인하는 데 매우 싸다.

입력:
- `macro_obs_t` 시계열(경계마다 1점 권장)
- 윈도우 길이 `T`(예: 256 boundary)

산출(권장):
- `CompCurve_C_glasso`, `CompCurve_f_at_S50`, `CompCurve_f_at_S10`
- `macro_state_id`별 요약(평균/분산)

운영 해석:
- 레짐 전이와 함께 `CompCurve_*`가 튀면: “상태 공간 구조 자체가 바뀌는 중”일 가능성 → 줌인/디버깅 후보.
- 장기 추세로 한쪽으로 쏠리면: 루프 제어(τ_stop, route_tier)를 보수화하거나, axis bank/LAB 드리프트 점검.

> 주의: 이건 ‘좋다/나쁘다’ 판정기가 아니다.  
> (1) baseline(셔플/랜덤)과 (2) 다른 신호들과 함께만 본다.

---

## 9. 평가/어블레이션 운영(“멋” 검증 루틴)

### 9.1 필수 메트릭(요약)
- Boundary quality: 경계 precision/recall(소량 라벨)
- Update efficiency: ΔPerf vs ΔCost 파레토
- Stability: PolicyFlipRate 등 ΔStab 구성요소
- Memory utility: retrieval이 성공률에 기여하는지(비용 대비)
- Consistency: 요약/메모리 vs 근거 충돌률
- A-PCI/ΔPCI: Workspace 섭동-복잡도(PCI-A proxy) 기반의 **루프 건강 지표**(raw 맹신 금지, ΔPCI 권장)


### 9.1.1 A-PCI(PCI-A proxy) 측정 루틴(권장, 저비용)

> 목적: “정답률을 올리기”가 아니라, **루프 건강/회복성(perturbation에 대한 반응)**을 값으로 남겨
> 회귀/오염/진동이 시작되는 지점을 빨리 잡는다.
> A-PCI raw는 쉽게 속는다. 운영 판단은 **ΔPCI(성공-실패 대조)** 중심으로만 한다.

#### (1) 언제 실행하나(권장)
- 기본 트리거: **Boundary close 직후** + `probe_frequency` 샘플링(가성비 최상)
- 대안: `scheduled_probe`(예: N 에피소드당 1회)
- 예외: `anomaly_detected`(정말 필요할 때만, 샘플링 확률을 올리는 정도로 제한)

> 규칙: PROBE는 “업무 도중”에 시스템을 흔들지 말고, **Boundary 직후**에 하라.
> PROBE 남발은 결국 비용만 새고, 신호도 흐려진다.

#### (2) 예산/쿨다운(필수)
- `probe_budget`(hard cap) 없으면 실행 금지 (Canonical §5.1.1)
- `pulse_policy`가 `off`면 섭동형 A-PCI는 실행 금지
- 권장 쿨다운: `probe_cooldown_steps ≥ 1 episode` 또는 `≥ 128 step` (둘 중 쉬운 걸로)

#### (3) 절차(Logging Appendix §11.7 + §12.2 “펄스/프로브”)
1) **PULSE_TRIGGER** 기록 (pulse_kind=perturbation)
   - `pulse_id`, `target=workspace`(또는 broadcast_latents), `noise_sigma`, `pulse_duration_steps`, `traj_record_steps(T)`, `reason`, `cooldown_steps`
2) **PROBE_RUN_START** 기록
   - `probe_id`, `probe_suite_id=apci_v0`, `probe_kind=pci_a`, `probe_config_hash`, `linked_pulse_id=pulse_id`
3) 펄스 주입 → `T` step workspace 궤적 `w[1..T]` 기록
4) 이진화 + 압축으로 `pci_a_raw = compressed_bytes` 산출
   - binarize 예: `w_t > 0` → 1, else 0
   - compressor 예: gzip (LZ 계열이면 됨, 중요한 건 “버전 고정”)
5) **PROBE_RUN_END** 기록
   - `compressed_bytes`, `traj_len_steps`, `binarization`, `compressor`, `pci_a_raw`
   - (가능하면) `correct_flag`(사후 VERIFY/라벨) 포함
6) window 집계에서 **ΔPCI** 산출/기록(가능한 경우)
   - `ΔPCI = mean(PCI-A | correct) - mean(PCI-A | incorrect)`
7) `STATE_SNAPSHOT.payload.metrics_optional.a_pci_latest` 업데이트(권장)

#### (4) 권장 초기 파라미터(“시작점”, offline-config로만 변경)
- `noise_sigma`: 0.03 ~ 0.10 (너무 크면 그냥 망가뜨리는 실험이 됨)
- `pulse_duration_steps`: 1 ~ 3
- `traj_record_steps (T)`: 16 ~ 64 (짧게 시작 → 필요하면 증가)
- `binarization`: `gt0`
- `compressor`: `gzip`
- `probe_suite_id`: `apci_v0` (버전/해시 고정)

#### (5) 금지 규칙(강제)
- A-PCI/ΔPCI로 **Gate 의사결정을 직접 변경 금지**
- A-PCI/ΔPCI로 **Evidence/Claim 생성 금지**
- raw 절대값으로 “좋다/나쁘다” 판정 금지 (ΔPCI 중심, 그리고 Ops Marker로만)




### 9.1.2 Noise titration(L75) 내성 곡선 루틴(권장, 회귀/디버그)

**목표**: retrieval/요약/후보군이 오염될 때 시스템이 얼마나 ‘버티는지’의 내성 곡선을 만든다.  
여기서의 L75는 “노이즈 강도 σ를 올렸을 때 성능이 baseline의 75%로 꺾이는 지점”이다.

- **권장 실행 위치**: 업무 episode와 분리된 **diagnostic window** (Boundary close 이후 / 회귀 스위치 ON)
- **권장 이벤트**: `PROBE_RUN_START/END` (필요 시 sigma별 `SCORE_REPORT`를 추가 기록)
- **권장 probe_suite_id**: `titration_l75_v0`

#### 9.1.2.1 오염 연산자(Operator Set) 정의
v0.1에서는 “정교한 공격”이 아니라, **측정 가능한 단순 오염**부터 고정한다.

- `retrieval_mix(p)` : retrieval 결과 중 p 비율을 무관/혼입 청크로 치환
- `summary_inject(p)` : 요약에 p 비율로 무관/상충 문장 삽입(짧게)
- `candidate_noise(p)` : gate 후보군에 p 비율로 그럴듯하지만 틀린 후보 주입

> 운영 팁: operator_set_id를 고정하지 않으면, L75가 ‘오염 종류 변화’에 휘둘려 비교가 깨진다.

#### 9.1.2.2 σ 그리드(권장)
- σ는 연산자에 따라 p로 해석해도 된다(표준화만 되면 됨).
- 권장 그리드(가성비): `σ_grid = [0.00, 0.05, 0.10, 0.15, 0.20]`
- 최소 반복: 각 σ에서 **N=8~16 episode** (로컬이면 8부터)

#### 9.1.2.3 측정/산출
- baseline: `σ=0`에서의 `Perf_core`
- 각 σ에서 `Perf_core(σ)`를 측정
- `L75 = min σ such that Perf_core(σ) <= 0.75 * Perf_core(0)`
  - 없으면 `L75 = max(σ_grid)`로 기록

`Perf_core`는 “측정 가능”이 최우선이다.
- verifier 기반 pass/fail(권장)
- 또는 자동 채점 가능한 태스크에서 정확도

#### 9.1.2.4 로그 계약(필수)
- `PROBE_RUN_START.payload` 권장 필드
  - `probe_suite_id=titration_l75_v0`, `probe_kind=titration_l75`
  - `probe_task_set_id`, `operator_set_id`, `sigma_grid`, `perf_metric_id`
- `PROBE_RUN_END.payload` 권장 필드
  - `l75_sigma`, `baseline_perf`, `perf_curve_summary`(예: top-k 요약 또는 해시)

> 해석 규칙: L75는 **온라인 라우팅 레버가 아니라 회귀/디버그 지표**다. 주 용도는 “버전 간 비교”다.


### 9.1.3 Policy sensitivity(ε-perturbation) 루틴(권장, 회귀/디버그)

**목표**: policy lever를 아주 조금(ε) 건드렸을 때 **정책/라우팅/안정성 지표가 과민 반응하는지**를 잡는다.  
Broadcast-amplification의 ‘구조적 취약성’을 조기에 찾는 루틴이다.

- **권장 probe_suite_id**: `policy_sensitivity_v0`
- **권장 실행 위치**: diagnostic window (업무 루프와 분리)

#### 9.1.3.1 ε 세트(권장)
- 상대 변화(권장): `ε ∈ {±5%, ±10%}`
- 대상 레버(최소 5개):
  - `prior_clip`, `candidate_injection_cap`
  - `hysteresis_theta_high/low`, `cooldown_steps`
  - `probe_frequency`(빈도), `pulse_policy`(perturbation 허용)

#### 9.1.3.2 측정
동일한 `probe_task_set_id`를 아래 두 조건에서 실행한다.
- Control: baseline policy
- Perturbed: 레버를 ε만큼 변형(한 번에 1개 또는 레버 묶음)

비교 지표(권장):
- `PolicyFlipRate`(레버/상태 라벨/route가 바뀌는 비율)
- `CSI_global` 변화(안정성)
- `EES_FA/Miss` 변화(오탐/미탐)
- `ΔCost`(토큰/툴콜/VRAM 피크)

#### 9.1.3.3 로그 계약
- `PROBE_RUN_START.payload`: `probe_suite_id=policy_sensitivity_v0`, `epsilon_set`, `lever_set_id`, `probe_task_set_id`
- `PROBE_RUN_END.payload`: `sensitivity_summary`(최대 변화량/상위 레버), `flip_rate`, `delta_metrics`

> 해석 규칙: sensitivity가 과도하면 ‘정책이 똑똑한’ 게 아니라 **불안정한 제어계**다. 
> 온라인에 연결하기 전에 jerk cap/히스테리시스/쿨다운부터 다시 봐라.


### 9.1.4 Invariance probe suite(권장, 회귀/디버그)

**목표**: “무시해야 할 변환”에 대해 시스템이 흔들리지 않는지(=대칭/불변성) 회귀 테스트로 고정한다.

- **권장 probe_suite_id**: `invariance_v0`
- **핵심 테스트 3종(최소)**
  1) `intervention_shuffle_invariance` : Intervention 리스트 순서를 섞어도 `INTERVENTION_DECISION`이 동일한가
  2) `sketchpad_shuffle_invariance` : SketchPrimitive 순서 셔플 후에도 `sketch_hash`가 동일한가
  3) `retrieval_order_invariance`(옵션) : retrieval top-k 순서를 섞어도 핵심 결론/route가 동일한가
- **추가 테스트(Ops Gate v0.1에서 강권장)**
  4) `srf_firewall_invariance` : 블랙리스트 신호(EES/LPS/competence_hat 등)를 교란해도 `tau_stop`/stop decision이 변하지 않는가(SRF 준수).
  5) `prior_pipeline_invariance` : LPS/G2A/MN priors가 동일 shared prior pipeline을 탔는지(`prior_pipeline_id` 동일성) replay로 검증 가능한가.


#### 9.1.4.1 실행 방식(가성비)
- 기준 episode(또는 boundary snapshot) 1개를 잡고,
- 동일 조건에서 변환만 적용해 K회 반복한다.
  - 권장: `K=8` (로컬이면 4부터)

#### 9.1.4.2 판정
- pass_rate(권장): K회 중 동일 결정/동일 해시가 나온 비율
- 실패 예시는 hash/seed로만 남기고, 원문은 별도 보관(민감 로그 분리)

#### 9.1.4.3 로그 계약
- `PROBE_RUN_START.payload`: `probe_suite_id=invariance_v0`, `test_kinds`, `K`, `seed`
- `PROBE_RUN_END.payload`: `pass_rate_by_kind`, `fail_hashes_topk`, `notes`


### 9.1.5 (NEW) AR(Abstractness Ratio) Probe 운영(Decodability + CCGP + PS_repr)
**목적**: “좋아 보이는 답”이 아니라, 내부 표현이 *변수 분리/일반화*를 하고 있는지 계측한다.  
특히 “최소 컨텍스트(minimal context)”에서 **규칙/상태(R)와 결과(O)** 가 분리되어야, 라우터/정책이 ‘근거 없는 확신’에 끌려가지 않는다.

#### (A) 데이터/라벨(최소)
- 변수(최소 이분):
  - `C_min`: 컨텍스트 충분/부족
  - `R`: rule/state 라벨
  - `O`: outcome(성공/실패 또는 예측-관측 일치/불일치)
- 샘플링:
  - 같은 `R`에서 `C_min`만 바꾼 쌍
  - 같은 `C_min`에서 `R`만 바꾼 쌍
  - 같은 `(C_min,R)`에서 `O`가 갈린 쌍(성공/실패)

#### (B) 표현 추출(둘 중 하나, 반드시 로그에 명시)
1) `repr_source=zt_summary` (운영 기본): `z_t(Commit)` 벡터
2) `repr_source=backbone_pool` (진단용): 백본 레이어 ℓ에서 pooling  
   - `repr_layer`, `repr_pooling`를 함께 기록

#### (C) Runner 산출(표준)
- `decodability`: 각 변수에 대한 선형 프로브 성능
- `ccgp`: 조건 조합 홀드아웃(교차 일반화) 성능
- `ps_repr`: 형식/순서/패러프레이즈/추론 유무 변화에 대한 민감도(Δ)

#### (D) 해석 규칙(필수)
- 절대값/단일 스칼라 숭배 금지.  
- **Δ 기반**으로만 본다:
  - 성공-실패 Δ, inference present-absent Δ, 형식 셔플 Δ
- 기록:
  - Raw: `PROBE_RUN_END.payload.abstractness_ar.*`
  - Signals: `AR_dec_*`, `AR_ccgp_*`, `PS_repr_*`

### 9.1.6 (NEW) Latent Axis Bank(LAB) 빌드/승격 루프(현실 버전)
LAB는 “예쁜 임베딩”이 아니라 **운영에 쓰는 손잡이**다. 축을 만들고, 검증하고, 승격하고, 드리프트를 감시한다.

#### (A) 축 후보 생성(최소)
- 소스(택1~2):
  - 선형 프로브 축: `R`, `O`, `C_min`의 로지스틱 회귀/linear head
  - PCA/ICA 축: 최근 `z_t` 샘플에 대한 top-k
  - (옵션) SAE feature: 비용이 허용될 때만
- 축 메타:
  - `axis_id`, `axis_type`, `repr_source`, `repr_layer/pooling`, `train_set_digest`, `created_from`(episode_ids)

#### (B) 검증(필수)
- 불변성(§9.1.4): intervention shuffle/스케치 정규화/qp_symmetry
- AR(§9.1.5): 축이 진짜 변수 분리에 기여하는지(특히 `R`/`O`)
- 드리프트: 최근 윈도우 vs 기준 윈도우의 distance(p95) + fail_rate

#### (C) 승격 규칙(권장)
- `candidate` → `monitor_only` → `control_ready`
- `control_ready`는 다음을 만족:
  - AR/불변성 회귀에서 안정
  - PS_policy(정책 레버 민감도)와의 상호작용이 폭주하지 않음(진동/오염 억제)

#### (D) 로깅/스키마 배치
- Raw: `PROBE_RUN_*` 확장 키 `axis_bank`, `abstractness_ar`
- Signals: `LAB_*`, `AR_*`, `PS_repr_*`
- 파생 스토어는 편의층. 권위는 Raw + Canonical/Appendix.


### 9.1.7 (NEW) CSB(Cerebellar Satellite Bank) PROBE: 선택성/혼합성 + 출력 분리 위반 탐지

**목표**: 위성(head)이 정말로 “도메인 선택적”으로 동작하는지, 그리고 Sat-L/Sat-M의 **출력 타입 분리**가 깨지지 않는지 고정 회귀로 만든다.  
이건 온라인 성능 지표가 아니라 **회귀/디버그 배터리**다.

- **권장 probe_suite_id**: `csb_satellite_v0`
- **권장 실행 위치**: diagnostic window (업무 episode와 분리), 또는 release 전 smoke test

#### 9.1.7.1 최소 태스크 셋(cereb_minibattery_v0)
LLM 기반이라 “진짜 뇌 과제”를 그대로 재현할 필요는 없다. 대신 **구분이 명확한 프롬프트 과제**로 대체한다.

- `LANG`(언어): 문장 이해/재구성/형식 계약 준수(짧은 제약 포함)
- `WM`(작업기억; MD proxy): 숫자/토큰 n-back, 순서 유지, 중간 삽입 등
- `ToM`(타자모델 proxy): false-belief vs false-photo 같은 미니 스토리 QA
- `ACT`(행동/절차 proxy; Artic proxy): 단계적 변환/절차 실행(정해진 포맷으로 스텝 출력)

권장 샘플 수(가성비):
- 각 클래스당 8~16개 (총 32~64)
- hard/easy 2레벨(가능하면)로 쪼개서 “난이도 민감도”도 같이 본다.

#### 9.1.7.2 측정(권장 최소)
- 위성 출력 크기:
  - `delta_logits_l1` (Sat-L만)
  - `delta_policy_l1` (Sat-M만)
- **선택성(selectivity)** (권장 스칼라):
  - `sel = (a_lang - max(a_nonlang)) / (a_lang + max(a_nonlang) + ε)`
- **혼합성(mixedness)** (권장 스칼라):
  - `mix = 1 - sel` (초기엔 이 정도로 충분)
- **출력 분리 위반(separation_violation)**:
  - Sat-L이 `Δpolicy_score`를 내거나, Sat-M이 `Δlogits`를 내면 1

#### 9.1.7.3 합격 기준(권장 시작점; 조정 가능)
- `sat_l_v0`: `sel_mean(LANG) >= 0.3` AND `separation_violation_rate == 0`
- `sat_md_v0`: `mix_mean >= 0.3` (너무 선택적이면 “언어 위성 복제”일 가능성)
- drift 감시: 위 2개 지표가 baseline 대비 ±0.15 이상 흔들리면 경고(자동 disable 고려)

#### 9.1.7.4 로그 계약(필수)
- `PROBE_RUN_START.payload`
  - `probe_suite_id=csb_satellite_v0`, `probe_task_set_id=cereb_minibattery_v0`
  - `sat_profile_ids[]`, `mode`(observe_only|assist_*)
- `PROBE_RUN_END.payload`
  - `satellite_metrics_by_profile`:
    - `sel_mean`, `mix_mean`, `delta_logits_l1_p95`, `delta_policy_l1_p95`
    - `separation_violation_rate`, `notes`
- (권장) `STATE_SNAPSHOT.payload.metrics_optional.cerebellar_satellites`와 동일 키를 공유(비교가 쉬움)

> 해석 규칙: CSB PROBE는 “좋다/나쁘다” 판정이 아니라, **분리/안정성 회귀**를 잡는 안전장치다.

### 9.2 필수 어블레이션(최소 4)
- GUP off
- BDM off
- IM off
- Replay off
- Probe off (`probe_frequency=0`, `probe_budget=0`)
- Pulse off (`pulse_policy=off` 또는 `PULSE_TRIGGER` 비활성)  # Workspace update pulse/PCI-A 모두 영향

### 9.2.1 권장 확장(Policy-level)
- `state_label` 사용 OFF (zone만 사용)
- `pulse_policy` OFF (펄스 없이 상시 업데이트로 퇴행)
- `CONSOLIDATE`에서만 memory write 허용 vs 항상 허용 비교
- replay 트리거 조건 on/off: 실패 반복 / 툴 불일치 급등 / 경계 직후

- (추가, SRP) `SELF_REFLECT` 프로토콜 어블레이션: `srp_strange_loop` vs 컨트롤(`srp_control_history`/`srp_control_third_person`)  
- (추가, SRP) `self_reflect_output_format`: `reflection_segment` vs `both`(five_adjectives 포함) 비교  
- (추가, SRP) SRP on/off 시 `RuminationIndex`, `IQS_mean_w`, `HAP_*_delta_w`의 파레토 비교
### 9.2.2 (NEW, AVR) Value/Cost/Rubric/AuxMove 어블레이션(최소 4)

> 목적: “AVR 붙였더니 좋아졌다” 같은 감각을 금지하고, **어떤 레버가 ΔPerf/ΔCost/ΔStab에 기여했는지** 분해한다.  
> 규칙: 아래 조건들은 **동일 eval_suite_id + 동일 judge_config_hash** 로만 비교한다.

- **AVR 완전 OFF**: `remaining_steps_hat/cost_hat` 계산·반영 OFF + `RUBRIC_REPORT` 게이트 OFF + AuxMove(`candidate_injection`) OFF
- **Value-only**: `commit_fail_hat/verify_gain_hat`만 사용(=선택 점수에 value만) / cost·rubric·auxmove는 OFF
- **+Cost**: value + `cost_hat` 반영(토큰/툴콜/지연 프록시) / rubric·auxmove는 OFF
- **+Rubric gate**: value(+cost 가능) + RubricScorer→`RUBRIC_REPORT` 기반 커밋 게이트 ON(τ_v/τ_e) / auxmove는 OFF
- **+AuxMove**: value(+cost 가능) + AuxMove 후보 주입 ON(`candidate_injection_cap` 고정) / rubric 게이트는 Control(OFF)로 두고 먼저 ROI만 본다
- **Full AVR**: value + cost + rubric gate + auxmove

권장 라벨(로그):
- `ablation_id`: `avr_baseline|avr_value|avr_value_cost|avr_value_rubric|avr_value_aux|avr_full` 같은 짧은 토큰
- `toggle_map`: `{value:0/1, cost:0/1, rubric:0/1, auxmove:0/1}`

> 주의: AuxMove는 “창의적 해킹”이 아니라 **Intervention 합성 규약(셔플 불변성 테스트/스테이지 고정/MID only)** 을 그대로 따른다.
## 9.3 v2.2 Metric/Logging 매핑(운영 규칙)
- 비교/대시보드는 **동일 Suite + 동일/유사 WL 버킷**에서만 해석한다.
- 최소 WL 세트(필수):
  - `WL_input_tokens`, `WL_output_tokens`
  - `WL_tool_call_count`, `WL_retrieval_count`, `WL_verifier_count`
  - `WL_task_type`

---

## 9.4 Phase-conditioned EES Calibration (A/B 운영 루틴)

### 목적
EES를 “예측 오류 채널”로 쓰는 설계가 **실제로 비용 대비 품질 이득**이 있는지 검증한다.  
핵심은 “EES가 떴을 때 개입이 유효했는가”를 수치로 만드는 것.

### 실험 스펙(가벼운 버전)
- 조건 A(개입): EES 트리거 시 **정책대로** 개입(VERIFY 강화 / slowdown / rollback 등)
- 조건 B(관측만): EES 트리거 시 **개입 최소화**(로그만 남김, 출력/라우팅 유지)
- 각 조건에서 동일 task를 최소 `N=20` 이상(가능하면 `phase` 균형) 수행

### 필수 로그(요지)
- `EES_event`, `EES_level(=state_core.ees_w)`, `EES_phase ∈ {ACQUIRE, VERIFY, COMMIT, CONSOLIDATE}`
- `EES_resolution_action` (slowdown/retrieve/ask_user/self_check/rollback 등)
- 사후 오류 라벨: `contradiction / hallucination / tool-failure / user-reject`
- 비용: 토큰/툴콜/지연(가능하면 `runtime_limits`/cost axes 포함)

### 판정(요지)
- A와 B의 사후 오류율 차이를 기록:
  - “개입 성공률” = (B 오류율 - A 오류율)
- 여기서 A가 항상 좋은 게 아니다.
  - A가 좋아지려면 “개입이 정교해야” 하고, 정교하지 않으면 비용만 늘어난다.

### 운영 캘리브레이션(phase별)
- `EES_false_alarm_rate`가 높은 phase에서는 `τ_slow/τ_route` 위주로 완화(rollback 남발 금지)
- `EES_missed_error_rate`가 높은 phase에서는 VERIFY 강화(증거 엄격도↑, 재검증↑)
- 임계값 테이블은 **offline-config**로만 변경한다(자동 학습 금지).

---

## 9.5 Stability-under-Perturbation (CSI) Experiment

### 목적
동일 과업을 약간씩 흔들어도(seed/문장 변형) **내부 루프가 유지되는지** 본다.  
정답만 맞고 내부 경로가 출렁이면(= 재현성/회복성 불안정), 장기 운영에서 망가진다.

> Canonical 규칙: CSI는 **평가/회귀(regression) 게이트**에만 사용한다.  
> CSI를 “온라인 자동 라우팅 규칙”으로 쓰지 않는다.

### 실험 스펙(권장)
- 동일 task × `N=5~10` 반복
- 변형(한 번에 다 하지 말고 하나씩):
  - seed/temperature 변화
  - prompt 등가 변형(동의어 치환, 문장 순서 변경, 문장 순서 스왑, 불필요한 수식어 추가 등)
  - (r6) **순서 교란(셔플) null** 생성: 각 시퀀스를 랜덤 셔플해 `CSI_shuffle_null_mean`을 함께 기록(Logging Appendix §13.7.1).
- 수집(최소 2개는 반드시):
  - `StateLabel` 시퀀스
  - `PolicyLever` 시퀀스
  - (있다면) `TRL Router route` 시퀀스

### 산출/로깅(Logging Appendix §13.7.1)
- `CSI_phase`, `CSI_global` 계산
- 로깅 위치(권장):
  - `SCORE_REPORT.payload.metrics.CSI_phase`, `SCORE_REPORT.payload.metrics.CSI_global`
- 원시 시퀀스는 **재구성 가능**해야 함:
  - `TRACE_CAPSULE_COMMIT/TRACE_CAPSULE_REUSE` 또는
  - `STATE_SNAPSHOT.payload.state_core.route_last` / `policy_last` / `state_label_last`

### 해석과 조치(기능 추가보다 원인 제거)
CSI가 하락하면 보통 “내부 제어가 과민”한 경우가 많다. 조치 우선순위는 아래처럼 둔다.

1) 라우팅 기준 과민 → `TRL Router threshold` 완화(offline-config)
2) 히스테리시스/쿨다운 부족 → `cooldown_steps`/jerk cap 강화
3) EES 과잉 개입(FA 과다) → phase별 임계값/대응 강도 재조정(offline-config)
4) memory write 과잉 → `memory_write_budget`/쓰기 게이트 보수화

> CSI가 낮다고 기능을 더 붙이면, 보통 더 낮아진다. 인간이 좋아하는 실수 루트.

---

## 9.6 Bias-sensitivity check (DriveState/GoalStack ↔ EES 상관)

### 목적
내부 바이어스(DriveState/GoalStack 변화)가 EES를 흔들어 **거짓 경보(FA)/미스(Miss)** 를 만드는지 점검한다.  
(“목표 framing이 바뀌면 시스템이 더 잘못 짖는다” 같은 상황을 잡는 용도.)

### 점검 설계(권장)
- 동일 task를 **서로 다른 목표 framing**으로 실행(최소 2개 조건)
  - 예: 동일 과업에 대해 “속도/가성비 우선” vs “정확/안전 우선” 같은 framing
- 기록(Logging Appendix §13.6.4):
  - `framing_id` 또는 `goal_profile_id`
  - `ΔDriveState` 또는 `ΔGoalStack` (예: `delta_drive_l2`, `delta_goal_stack_hash`)
  - `EES_rate`, `EES_FA`, `EES_Miss` (가능하면 phase별)

### 해석/대응(자동학습 금지)
- framing 변화와 EES(FA/Miss)가 강하게 상관하면:
  - 해당 phase에서 VERIFY 엄격도↑ 또는 ACQUIRE 근거 다양화↑ 를 고려
  - 단, 변경은 **offline-config로만**(온라인 자동 업데이트 금지)


---
## 9.7 (NEW) AVR ScoreReport/캘리브레이션/어블레이션 운영(실전 템플릿)

이 섹션은 “논문 아이디어”를 운영 데이터로 **정산 가능한 형태**로 만드는 최소 루틴이야.  
핵심은 3개다:

1) **예측(remaining_steps_hat/cost_hat/competence_hat)** 을 “결과(성공/실패/비용)”와 묶어서 남긴다.  
2) ablation_id/토글을 고정해서 **분해 가능한 비교**를 만든다.  
3) Rubric/AuxMove는 “좋아 보임”이 아니라 **ROI(ΔPerf 대비 ΔCost)** 로만 살린다.

### 9.7.1 고정해야 하는 메타(없으면 비교 금지)
- `eval_suite_id`: 회귀/AB에 쓰는 문제 세트 ID (고정)
- `judge_config_hash`: verifier/채점기/규칙 버전 해시 (고정)
- `build_id`: 모델/프롬프트/룰 번들 스냅샷(짧은 태그)
- `ablation_id`, `toggle_map` (9.2.2)

> 추천: 위 메타를 `SCORE_REPORT.payload.meta.*` 또는 동등 summary 이벤트에 넣고, episode_id/trace_id로 조인 가능하게 한다.

### 9.7.2 “정산 가능한” 최소 로그 묶음
- **Metacog 선택 루프**
  - `COMPETENCE_ASSESSMENT` (후보별 `predicted_success_prob` + `remaining_steps_hat` + `cost_hat`)
  - `STRATEGY_SELECTION` (선택/거부 사유)
  - `METACOG_CYCLE_END` (status, attempts_total, outcome_summary_hash)
- **Rubric(있을 때만)**
  - `RUBRIC_REPORT` (target_kind/target_id/scores)
- **정산(에피소드 끝)**
  - `SCORE_REPORT` (Perf/Stab/Cost + WL covariates + 아래 AVR 집계)

> 주의: `remaining_steps_hat/cost_hat`는 “프록시”다. 진짜 비용/진짜 성공 여부는 반드시 로그/정산 값(토큰/툴콜/latency/verify pass 등)으로 잡아라.

### 9.7.3 AVR 집계(추천 스칼라: 비교가 쉽고, 로컬에서 계산 가능)
**A) Remaining-steps 오차(회귀용)**
- 정의(가장 단순): metacog 시도 i에서  
  `y_i = attempts_total - i` (사후에만 아는 “남은 시도 수”)  
  `ŷ_i = remaining_steps_hat`  
- 산출(권장): `MAE_steps`, `p95_abs_err_steps`, (옵션) `SpearmanCorr_steps`  
- 버킷: `phase × WL_task_type × route_tier` (최소한 phase만이라도)

**B) Cost 오차(회귀용)**
- 관측: `cost_obs = {tokens, tool_calls, latency_ms}` (실측/계측)
- 예측: `cost_hat = {tokens, tool_calls, latency_ms}` (LPS/헤드)
- 산출(권장): 각 축별 `MAE`, `p95_abs_err`, (옵션) `rank_corr`  
- 운영 팁: cost_hat는 절대값보다 “순위”가 맞아도 쓸모가 크다(예: expensive 후보를 피하는 용도).

**C) Competence 캘리브레이션(확률)**
- `predicted_success_prob` vs outcome(pass/fail)로 `Brier`, `ECE` 계산(라벨 있는 suite에서만).
- 과신 감시: `p>=0.8 & fail` 빈도(OverconfidentError)

**D) Rubric 게이트 ROI**
- `commit_rate`(게이트 통과율), `post_commit_success_rate`, `post_commit_cost`
- Control 대비: `ΔPerf`, `ΔCost`, `ΔStab`
- 실패 모드 분해: “rubric는 높았는데 실패” 상위 원인(top-k)만 해시로 남겨라(원문은 별도 저장).

**E) AuxMove ROI**
- `auxmove_proposed_rate`, `auxmove_applied_rate`(cap에 의해 잘렸는지도),
- AuxMove 적용된 에피소드에서의 `success_uplift`(control 대비) + `cost_uplift`
- 금지: AuxMove가 성공했다는 이유로 “근거”로 승격하지 말 것(항상 Control/View)

### 9.7.4 A/B 실행 템플릿(가성비 버전)
- 동일 `eval_suite_id`에서 최소 `N=20` episode씩(로컬이면 10부터) 조건별 실행
- 조건 수는 6개를 넘기지 마라(9.2.2의 `ablation_id` 세트 권장)
- 각 run 종료 시 `SCORE_REPORT`에 아래를 반드시 남긴다:
  - `meta`: eval_suite_id/judge_config_hash/build_id/ablation_id
  - `perf_raw`: success_flag, verify_pass_rate(가능하면)
  - `cost_raw`: tokens/tool_calls/latency_ms
  - `avr_summary`: MAE_steps, MAE_cost_*, Brier/ECE(가능하면), rubric/auxmove ROI 요약

### 9.7.5 회귀 게이트(권장 “1줄 룰”)
- Full AVR이 baseline 대비 **ΔPerf가 비슷한데 ΔCost만↑** 이면: rubric/auxmove를 먼저 끄고(value+cost만 유지) 다시 본다.
- Full AVR이 ΔPerf는↑인데 **CSI/PolicyFlipRate가 악화**되면: auxmove cap↓ + cooldown↑ + rubric τ를 보수화(offline-config).

### 9.7.6 운영 가능성 Gate Checklist v0.1 (CI/Prod must-pass)

**목적:** “문서 규약”을 선언이 아니라 *깨지면 바로 잡히는* 테스트/가드레일로 만든다.  
**원칙:** 필드/이벤트 계약은 `SSOT_SCHEMA_BUNDLE.zip`/`SSOT_LOGGING_POLICY.md`가 단일 기준이며, 여기서는 **판정(게이트)과 실패 시 조치**만 고정한다.

**Gate-01 — Schema/examples validation**
- CI에서 schema_validate(examples) 통과(머지/릴리즈 차단 게이트).

**Gate-02 — Evidence Contract(3중 시간 + event_time_status)**
- Evidence/JML의 `event_time/observed_time/recorded_time` 정합성 및 `observed_time ≤ recorded_time` 위반 0.
- `event_time_status=UNKNOWN/ASSUMED_OBSERVED`는 reliability 상한/격리 규칙이 적용되어야 한다.

**Gate-03 — Evidence 생성 경로 단일화**
- 모델 텍스트 단계에서 Evidence 생성 금지. Evidence는 tool/doc/static 검증 등 “승격 가능한 결과”에서만 생성.

**Gate-04 — Derived store 권위 누수 차단**
- 파생 분석 스토어/뷰 산출물로 Evidence/Claim 권위 생성(writeback) 금지(항상 포인터).

**Gate-05 — SRF(Stop-Rule Firewall) 독립성(치명 게이트)**
- stop 판정은 `EVC_raw`만(prior=0). `tau_stop` 입력은 whitelist만, blacklist 신호 영향 0.
- 회귀에서 `srf_firewall_invariance`가 pass 해야 한다.

**Gate-06 — Shared prior pipeline + prior_pipeline_id 감사**
- LPS/G2A/MN priors는 동일 shared prior pipeline(clip→jerk→cooldown)을 **같은 코드 경로**로 통과.
- `GATE_DECISION.payload.*_used.prior_pipeline_id`는 회귀 게이트에서 사실상 필수(누락 run은 비교/집계 불가로 fail 처리).

**Gate-07 — Intervention 합성 셔플 불변성**
- `INTERVENTION_DECISION.shuffle_invariance.ok == true` (staging/prod 회귀에서 활성화).

**Gate-08 — SketchPad(순서-불변/결정론)**
- `SketchPadShuffleInvarianceHashMismatchRate == 0`(목표) 또는 허용 임계 이하 유지.

**Gate-09 — jerk/cooldown/clip/cap “생존장치”가 실제로 동작**
- 안정화 레버(clip/jerk/cooldown)가 코드상 존재하고, 적용 시 `POLICY_SMOOTHING_APPLIED.cap_hit_flags`(또는 동등 로그)가 남아야 한다(누락=fail).
- stress suite(노이즈 titration/의도적 ε-lever perturbation)에서 cap_hit_flags가 **가끔은** 발생해야 한다(항상 0이면 미작동 의심).
- baseline suite에서 cap hit가 과도하면 파라미터 과도/입력 노이즈 의심(운영 risk).

**Gate-10 — WL covariates + Cost 축 누락 금지(비교 가능 조건)**
- `SCORE_REPORT.payload.wl_covariates` 및 `Cost_*` 축이 최소 세트로 남아야 회귀/비교가 가능하다(누락 run은 집계에서 제외 = gate fail).

> 운영 팁: Gate-05/06/07/08은 “필수 불변식”으로 취급한다. 여기 깨지면 개선이 아니라 시스템 붕괴다.

## 10. MVP 구현 순서(4070S 12GB 현실 버전)

### Step 0: 계측
- PE_lm 계산 + JML 기록
- 툴 결과 schema validation + PE_tool 기록
- Raw Event Log(TOOL_CALL_START/END)만이라도 먼저 고정

### Step 1: Boundary
- 다중 신호로 episode open/close
- episode summary(뷰) + Self-Graph NEXT 엣지

### Step 2: Gate(히스테리시스)
- PE 기반으로 `VERIFY/RETRIEVE/REPLAN` 최소 3동작만 먼저

### Step 3: Sidecar eₜ 기반 정책 조절
- `retrieval_budget / verifier_budget / plan_depth`를 eₜ로 연동
- 안정화(EMA/클리핑/변화율 제한) 없으면 금지

### Step 4: Conditional Replay
- 실패 반복/툴 충돌/경계 직후에만 짧게
- 최대 토큰/시간 상한 필수

---

## 11. 디버깅 체크리스트(실전용)

### 11.1 Gate가 폭주한다(VERIFY/RETRIEVE 난사)

### 11.1.1 Self-Reflection이 폭주한다(루미네이션)
- `RuminationIndex`(Appendix) 확인: `SelfReflectCount/CommitCount` 또는 `SelfReflectTokens/OutputTokens`
- `self_reflect_token_cap`/`self_reflect_round_cap`를 낮추고 `self_reflect_cooldown_steps`를 늘린다
- `τ_stop`를 상향(보수화)하거나 `COMMIT` 강제 규칙을 추가한다
- supercritical에서 `SELF_REFLECT`를 기본 비활성으로 둔다
- (SRP 사용 시) `IQS_mean_w`/`SCS_pairwise_cosine_mean_w`/`HAP_*_delta_w`를 같이 본다  
  - `IQS_mean_w ≤ 2` 이면서 `RuminationIndex`가 높으면: SRP가 “도움 없이 말만 늘림” 상태일 확률이 높다 → budget↓/cooldown↑/protocol 회귀  
  - `SCS_pairwise_cosine_mean_w`가 과도하게 상승하면: 형용사 수렴(정서/서사 고착) 의심 → 컨트롤 프로토콜로 어블레이션  
  - `HAP_*_delta_w`가 악화되면: SRP를 VERIFY-only로 더 좁히거나, SRP 자체를 off로 돌린다


- `PolicyFlipRate` 확인(ΔStab)
- θ_high/θ_low 간격 확대
- cooldown_steps 증가
- τ_stop 상향(보수화)
- `PE_lm` 단독 스파이크가 고비용 액션을 트리거하는지 확인

### 11.1.2 Self-Graph 구조 갱신이 불안정하다(HAG thrash/hubness)

- 증상:
  - `GRAPH_EDGE_UPDATE`가 에피소드마다 과도하게 발생(구조가 흔들려서 retrieval/라우팅이 계속 바뀜)
  - 특정 노드가 허브로 과도 집중(“모든 것이 그 노드로 붙는” 현상)
- 확인:
  - (있으면) `GraphThrashRate`, `GraphHubness`, `HAG_UpdateCount`/`HAG_HomeostasisRate` (Appendix)
  - `self_graph_update_mode=shadow`에서 ΔW만 쌓이는지 먼저 관찰(실반영 금지)
- 처방:
  - `self_graph_update_cap` ↓, `self_graph_update_cooldown_episodes` ↑
  - supercritical에서는 `shadow` 고정(안정화 후에만 apply)
  - 활동 신호 `a_i(t)` 정의를 더 “운영적”으로(단발 토큰 스파이크가 구조를 흔들지 않게 EMA/클리핑)



### 11.1.3 정책/Sidecar가 급발진한다(Δ² spike)

- 증상:
  - `PolicyFlipRate`는 높지 않은데도 레버 값이 ‘훅’ 튄다(특히 boundary 직후)
  - `state_label`이 짧은 구간에서 자주 바뀌고, Gate가 한 번 튄 뒤 계속 꼬인다

- 확인:
  - Appendix 지표: `PolicyJerkP95`, `PolicyJerkCapHitRate`, `SidecarJerkP95`, `StateLabelFlipRate`
  - 로그: `POLICY_SMOOTHING_APPLIED`의 cap_hit_flags(자주 걸리면 J_max/D_max가 너무 작거나, 기본 업데이트가 너무 거칠다)

- 처방:
  - jerk cap 도입/강화(`J_max↓`) + Δ cap 동시 적용
  - shock override를 남발하지 말고, override 발생 조건을 더 좁힌다
  - `zone=supercritical`에서 레버 업데이트를 더 느리게(쿨다운↑, min-dwell↑)
  - (CBS/PR 사용 시) continuity 페널티(β) ↑, reset 트리거를 실패 반복에만 제한


### 11.2 요약이 사실을 오염시킨다
- Claim이 Evidence 없이 ACTIVE로 승격되는 경로 차단
- 요약 충돌 시 `PE_memory↑` 및 VERIFY 강제
- Workspace에는 “포인터만” 유지

### 11.3 Boundary가 토픽 전환에 끌려간다
- 토픽 전환 단독 신호 제거
- 목표/툴/검증 실패 누적 신호 가중치 강화
- 경계 후 `RevisionRate`가 급증하면 오탐 후보로 라벨링

### 11.4 로그는 있는데 지표 해석이 안 된다
- WL covariates 누락 여부 확인(없으면 비교 금지)
- SCORE_REPORT에 원시값이 누락되지 않았는지 확인

---

## 12. 버전/마이그레이션 규칙

- schema_version(2.2.x)을 각 레코드에 포함하는 것을 권장한다.
- Major 변경(필수 필드 변경/이름 변경)은:
  - 정규화 레이어(oneOf/alias)로 최소 1개 버전 이상 브릿지
  - examples 업데이트 + CI 검증 통과를 머지 조건으로 둔다.
- Release/배포 브랜치 기준:
  - schema_validate(examples) 통과 + **운영 가능성 Gate Checklist v0.1(§9.7.6) 통과**를 필수 조건으로 둔다.


- 레거시/추상 별칭 정규화(예): `workspace_cap` → `workspace_token_cap` (저장/출력은 token 단위 필드만 유지)

---

## 부록 A: Start Points (SP v0.3.6 통합본, 2026-01-14)

> 이 부록은 **구현 로드맵/우선순위** 문서다.  
> - 전역 규약(법전): `SSOT_CANONICAL.md`  
> - Sidecar/QP/z_t 모듈 스펙: `MODULE_SIDECAR_QP_ZT_SUMMARY.md`  
> - 이벤트/필드 계약: `SSOT_LOGGING_POLICY.md`  
> - Schema Bundle(현행): `SSOT_SCHEMA_BUNDLE.zip` (스키마+예시: `/schema`, `/examples`)
> - 이 부록은 “순서/단계/실험 설계”에만 책임진다(필드/정의 중복 금지).

> 목적: “어디서부터 시작해야 실제로 Augnes Local이 움직이기 시작하나”를 단계별로 정리한다.
> 이 문서는 ‘시작’에 초점을 둔 로드맵이며, 자세한 구조 정의는 `MODULE_SIDECAR_QP_ZT_SUMMARY.md` 를 참조한다.
> 운영 원칙: **Sidecar/QP/z_t ‘모듈 스펙’의 단일 기준은 Sidecar 요약 문서**이고, 이 문서는 **단계별 로드맵**이다. 스펙 변경 시에는 Sidecar 문서를 먼저 갱신하고, **필드/이벤트 계약 변경은 Logging Appendix/Schema를 먼저 갱신**한다. 여기서는 링크/순서만 따라간다.

#### 0.1 용어 미니 글로서리(초기)
- **QP(Qualia Proxy)**: 내부/외부 신호를 뽑아 *계측 가능한 피처*로 만드는 계측/중계층
- **e_t(Sidecar meta-state)**: 현재 시스템 상태를 저차원으로 압축한 공식 메타상태 레지스터
- **z_t(Commit/Regime switch)**: 현재 모드/레짐 커밋 스위치. 값이 바뀌면 정책/해석/대칭 기준이 달라진다고 가정
- **τ / Q / M**: 제어계 핵심 계측축(계산/시간/스텝 비용 τ, 품질 추정 Q, 메모리 사용/회수량 M)
- **BG(Budget Governor)**: τ/Q/M과 e_t/z_t를 입력으로 *예산/조기종료*를 결정하는 규칙/모듈
- **Axis Bank**: e_t/QP가 직접 보고/제어할 수 있는 저차원 관측축들의 고정된 집합(축 버전/레짐 관리 포함)


---

### 1. 핵심 목표(최소 성공 조건)
1) **메타상태(e_t) 기반의 제어가 실제로 작동**한다  
2) **JML에 경험이 누적**되고, Retrieval로 다시 제어에 투입된다  
3) **실패를 줄이는 방향의 점진적 자기개선 루프**가 돌아간다  

여기서 “점진적”의 핵심은, 시스템이 무한 루프/낭비를 막는 **예산 기반 종료 규칙**을 가진다는 것.

---

### 2. 차별화 축 요약(왜 이걸 만드나)
- 단순 챗봇이 아니라 **자기 상태를 추적하고, 자원을 관리하며, 경험으로 개선되는 시스템**을 만들기 위함
- 핵심 차별화는 3개:
  1) **Sidecar e_t**: 저차원 메타 상태 레지스터(제어의 중심)
  2) **JML**: 판단/행동/결과/메트릭의 장기 누적(경험의 중심)
  3) **Budget Governor(BG)**: τ/Q/M 기반 예산 + 조기 종료(운영의 중심)

---

### 3. v0.0: “그냥 움직이게 만들기”(1~2일 컷 목표)

#### 3.1 구성
- 백본 LLM: 로컬/원격 무엇이든(우선은 구현 가능성이 우선)
- Memory: 로컬 파일 기반(폴더 + 간단한 검색)으로 시작
- JML: JSONL 또는 SQLite로 시작
- Sidecar e_t: **허용 16~128차원**, 로컬/초기 **권장 32~64차원** 벡터를 “형식적으로”만이라도 유지(초기엔 규칙 기반 가능)

#### 3.2 산출물(최소)
- “task 하나”를 잡고, 다음이 **한 루프**로 돈다:
  - 입력 → QP(계측) → e_t 업데이트 → 정책 선택 → 실행 → JML 기록 → retrieval → 다음 행동

---

### 4. v0.1: “계측기 설치 + 예산 종료 규칙 도입”(이번 세션 반영)

#### 4.1 제어계 핵심 계측 축: τ, Q, M
- **τ (tau)**: 멈추기까지 걸린 시간/스텝(토큰, subcall, wall-time, **internal tick 수** 등 중 하나로 통일)
- **Q**: 품질 추정치(정답률/검증기 점수/유틸리티/성공 여부)
- **M**: 비용 추정치(토큰, 시간, VRAM 압박, 에너지, $ 등. 로컬은 토큰+시간이 현실적)
- **Q_over_M**: 효율 지표(기본). `Q_over_M = Q / (M + eps)` 권장. (eps는 작은 상수, 예: 1e-6)


> 중요한 건 “정확한 정의”보다 “일관된 정의”다. 같은 실험 안에서만 일관되면 된다.

#### 4.2 모듈별 τ 분해: τ_gen / τ_mem
- τ_gen: 생성(Generate) 경로의 평균 τ
- τ_mem: 기억(Retrieve/Commit) 경로의 평균 τ
- 이 값들을 **JML에 누적**하고, EMA/분위수 통계를 만든다.

#### 4.3 Budget Governor(BG) 최소 구현
- 규칙:
  - `tau_budget(n,p)`를 계산해서 상한을 둔다
  - 실행 중 `Q/M`이 악화되면 조기 종료한다
- 입력:
  - e_t, z_t, QP 메트릭(tau_hat, Q_hat, M_hat), JML 통계
  - (권장) 동기화/루프 신호: sync_hat, sync_drift_hat, loopness_hat (Axis Bank 기반)
- 출력:
  - tau_budget, M_budget, stop_policy, early_stop_reason


#### 4.3.1 (NEW) PDC: 예산/루프 스테이지 스케줄링(운영 가성비)

**목표**: “처음부터 깊게”를 기본값으로 두지 말고, **얕게 시작해서 필요할 때만 깊게** 들어간다.

- 권장 최소 스테이지(로컬 기준): `S0 → S1 → S2` (3단)
- 스테이지별 상한(예시, 상대값):
  - `S0`: `tau_cap=0.35·tau_base`, `M_cap=0.35·M_base`, `branching_cap=1`
  - `S1`: `tau_cap=0.70·tau_base`, `M_cap=0.70·M_base`, `branching_cap=2`
  - `S2`: `tau_cap=1.00·tau_base`, `M_cap=1.00·M_base`, `branching_cap=3`

스테이지 승격 조건(권장, AND 구조):
1) `EVC_raw_max ≥ τ_stop` (아직 “멈추면 손해” 구간)
2) `ΔQ_hat` 또는 `ΔQ_over_M`이 의미 있게 개선될 여지가 있음(Verifier conflict/불확실성 잔존 포함)
3) `loopness_hat`가 과도하게 높지 않음(루프 고착이면 승격보다 종료/모드 전환)

스테이지 규율(필수):
- 에피소드 내 스테이지는 **단조 증가만** 허용(`S0→S1→S2`).
- stage가 올라갔더라도 stop-rule은 항상 우선.

로그(필수, Logging Appendix 계약 준수):
- `budget.pdc_stage_id`, `budget.pdc_round`
- `budget.pdc_stage_tau_cap`, `budget.pdc_stage_M_cap`
- (옵션) `budget.branching_cap`, `budget.loop_round_cap`, `budget.route_tier_cap`

#### 4.3.2 (NEW) ACT-style Halting: stop-rule 기반 early exit 게이트(prior=0)

**핵심**: “이제 멈춰도 된다”는 판단은 **항상 raw EVC로만** 한다.

- 구현 순서(강제):
  1) `EVC_raw` 계산(근거 기반, prior 미적용)
  2) `EVC_raw_max < τ_stop` 이면 즉시 `COMMIT/RETURN_MINIMAL`
  3) 그 외에만 prior/예산/모드 전환 레버가 관여

권장 보조 로그:
- `halt_margin = τ_stop - EVC_raw_max`
- `halt_reason = stop_rule` (또는 예산/루프 고착 등)

#### 4.3.3 (NEW) HSW: 후반 루프 “학습 신호” 감쇠(결정 경로 감쇠 금지)

- 적용 위치: **Boundary close 직후 stats update / policy_update rollup**
- 가중치: `w_t = λ^{t-1} / Z_λ` (기본 `λ=0.8` 권장)
- 감쇠 대상(예):
  - intervention 효과/안정성/비용 EMA 업데이트
  - Sidecar 학습용 업데이트(파라미터/휴리스틱)
- 감쇠 금지:
  - stop-rule 판단
  - Gate action 선택
  - 사용자에게 반환하는 최종 결과 텍스트

로그(권장):
- `outcome_metrics.hsw_lambda`, `outcome_metrics.hsw_weight_last`, `outcome_metrics.hsw_rounds`

#### 4.4 JML 스키마 업데이트(권장)
- (참고) 필드 정의/키 표준/타입은 Sidecar 요약 문서가 단일 기준이다. 여기서는 **최소 기록 항목**만 적는다.
- 반드시 기록:
  - tau, Q, M, Q_over_M
  - tau_gen, tau_mem(가능하면)
  - budget: tau_budget/M_budget + early_stop_reason
  - (UBB 도입 시) backbone_id, basis_version, adapter_profile_id, residual_ratio

#### 4.5 기대효과(현실적인 것만)
- 무한 추론/무한 검색 억제
- 실험 반복 속도 증가(낭비 감소)
- “왜 실패했는지”가 구조적으로 남아 다음 개선이 쉬워짐

---


#### 4.6 (Option) 비동기/결측 계측 신호 처리: “마스크 + 간단 필터”
- 현실에서 QP/Verifier/툴 로그는 **매 턴 항상 같은 양으로** 들어오지 않는다. (결측/지연/비동기)
- v0.1에서 권장하는 최소 대응:
  - QP 출력 `q_t`에 **missingness mask**(어떤 feature가 이번 턴에 관측됐는지)와 timestamp를 붙인다.
  - Sidecar 업데이트 `f_θ`는 mask를 보고 “이번 턴에 들어온 신호만” 반영한다. (없는 값은 0으로 때우지 않는다)
- v0.2 이후(또는 e_t가 요동치기 시작하면) 고려할 확장:
  - Sidecar를 **작은 상태공간 필터(SSM/Kalman-style predict→update)** 로 올려서,
    결측 시에는 update 없이 predict만 수행한다.
  - 멀티레이트·결측 멀티모달을 실시간으로 통합하는 BCI 계열(MRINE) 접근에서 힌트를 얻을 수 있다.
- 상세는 `MODULE_SIDECAR_QP_ZT_SUMMARY.md`의 **2.4**를 참조.


#### 4.7 (NEW) 대칭 기반 거시 메타상태(Emrgent e_t/QP) 도입: “그럴싸한 벡터” 금지

**문제**: e_t/QP를 그냥 학습된 latent로 두면,  
- 표면적 표현(말투/순서/도구 이름)에 흔들리고  
- “왜 이 상태가 이 결정을 만들었는지”를 검증할 방법이 없어  
결국 디버깅이 감각놀이로 흐르기 쉽다.

**해법(이번 세션 반영)**: e_t/QP를 “대칭(무시해야 할 변환)”을 기준으로 정의하고,  
그 품질을 **informational closure 근사 테스트**로 점수화한다.

##### 4.7.1 대칭(= 무시할 변환) 체크리스트(최소)
- 텍스트/표현: paraphrase, 문장 순서 변형, 불필요한 수식어
- 툴/호출: 동등한 툴 alias/인자 순서 변경, 결과 포맷 변형
- 메모리: 동일 근거의 chunk 분할/병합, retrieval 순서 변형

> “어떤 변환을 무시할 건지”를 문서화하지 않으면, e_t/QP는 절대 안정화되지 않는다.

##### 4.7.2 구현(가성비 버전): augmentation + (in)variance penalty
- 입력 o_t에 대해 변환 g(·)를 적용한 o'_t를 만든다.
- QP 인코더/추출기가 있다면:
  - **invariance 목표**: `QP(o'_t) ≈ QP(o_t)` (무시해야 할 변환)
  - **equivariance 목표**(필요 시): `QP(o'_t) ≈ R_g QP(o_t)` (모드/구조가 함께 변해야 할 변환)
- Sidecar e_t도 동일하게:
  - `e_t(o'_t) ≈ e_t(o_t)` 를 기본으로 두고,
  - z_t처럼 “모드 커밋”에 해당하는 변환은 예외로 둔다.

##### 4.7.3 품질 평가: informational closure “근사 점수” (실무형)
완전한 정보이론 계산 대신 아래 A/B로 충분히 실용적인 판정을 한다.

- **A(Full)**: (가능하면) 더 풍부한 관측/로그를 입력으로 다음을 예측하는 예측기
- **B(Macro-only)**: 오직 e_t(또는 QP) 과거만 입력으로 같은 타깃을 예측

예측 타깃(권장, 최소 2개):
- 다음 e_{t+1} 또는 다음 z_{t+1} (상태 예측)
- 다음 Q/M 또는 “조기종료 여부/실패모드” (운영 예측)
- (가능하면) verifier score / task success (품질 예측)

**closure_score(권장 정의)**  
- (수치 안정) `err_full`은 `eps`로 바닥을 깔고, 최종 점수는 `[0,1]`로 clamp한다.
- `closure_score_raw = 1 - (err_macro / max(err_full, eps))`
- `closure_score = clamp(closure_score_raw, 0, 1)` (클수록 좋음)
- 보조 로그: `Δerr = err_macro - err_full` (작을수록 좋음), `err_full`, `err_macro`, `eps`

##### 4.7.4 JML에 반드시 남길 것(추가 필드)
- `symmetry_suite_id`: 사용한 변환/증강 세트 ID
- `closure_score_e`, `closure_score_qp`: e_t/QP 각각의 closure 근사 점수
- `macro_key`: (e_t + QP 요약) 기반 retrieval key/해시(가능하면)

> 이 값들이 쌓이면, “메타상태가 쓸 만해지는 방향”으로만 튜닝할 수 있다.

##### 4.7.5 기대효과(현실)
- e_t/QP가 표면 잡음에 덜 흔들림 → 정책 요동 감소
- “메타상태가 좋은지”를 로그로 판정 가능 → 디버깅 속도↑
- JML retrieval 키를 e_t/QP로 옮길 근거가 생김

- 상세 구현/필드/운용 규칙은 `MODULE_SIDECAR_QP_ZT_SUMMARY.md`의 **2.6, 3.4, 6.1.6, 6.6**을 참조.


#### 4.8 (NEW) Universal Subspace Adapter Bank(UBB) 도입: “LoRA 저장 대신 basis+계수”
**목표**: 다양한 스킬/도메인 적응을 LoRA 파일 묶음으로 관리하지 말고,  
(1) 백본별 **Universal Basis Bank(UBB)** 를 오프라인으로 만들고,  
(2) 온라인/저비용 적응은 **계수(coefficient)만 학습**하는 경로를 기본값으로 둔다.

##### 4.8.1 언제 시작하나(현실 기준)
- 같은 백본에 대해 LoRA/adapter가 **최소 수십 개(권장 30~50+)** 쌓였을 때부터 의미가 생긴다.
- 그 전까지는 기존 LoRA/프롬프트/정책 튜닝으로 경험을 쌓고, “UBB 빌드 재료”를 모은다.

##### 4.8.2 오프라인: UBB 빌드(주기적 배치 작업)
- 입력: 동일 백본에서 얻은 adapter/ΔW들의 묶음
- 처리: 레이어/모듈별로 ΔW들을 스택 후 PCA/SVD/HOSVD로 top-k basis 추출
- 출력:
  - `UBB(backbone_id, target_modules, k, basis_version)`
  - 레이어/모듈별 basis `U_{ℓ,m}`

##### 4.8.3 온라인: coefficient-only 적응(가성비 경로)
- 새 태스크/유저/모드 적응은:
  - UBB 고정 + `c_{ℓ,m}`(계수)만 학습
- (권장) OOD 대응:
  - `residual_ratio`가 커지면 “UBB로 설명 불가”로 보고,
    - tiny residual LoRA를 덧대거나,
    - UBB를 다음 배치에서 재빌드(오프라인)한다.

##### 4.8.4 JML에 추가할 최소 필드(강제)
- `backbone_id`, `basis_version`, `adapter_profile_id`
- `coeff_hash`, `coeff_norm`, `proj_dim_k`, `residual_ratio`

> 이게 없으면 UBB는 압축 장난감으로 끝나고, “메타인지 조향 좌표계”가 되지 않는다.


##### 4.8.5 (옵션, 실용 버전) TTT-lite “Session Adapter” = Parameter Memory(PM)

**판단부터 말하면**: 논문식 “end-to-end test-time training(모델 내부를 실시간으로 계속 업데이트)”을 그대로 이식하는 건 로컬 운용에서 비싸고 위험하다.  
따라서 Augnes Local에서는 아래처럼 **축소판(TTT-lite)** 으로만 가져오는 걸 권장한다:

- 업데이트 대상: **UBB 계수(coefficient)만** *(또는 정말 작고 격리된 head/LoRA)*
- 실행 위치: **Boundary 이후 전용 튜닝 윈도우** (인라인 금지)
- 적용 범위: **다음 에피소드부터** (즉시 적용 금지)
- 통제: **회귀 게이트 + 롤백 토큰**이 없으면 커밋 금지

**언제 돌리나(권장 트리거)**
- `context_pressure`(또는 `hcm_state=overflow/overflow_risk`)가 커지고, 동일 retrieval/VERIFY가 반복될 때
- 사용자가 ‘내가 방금 말한 X를 계속 잊는다/반복한다’ 같은 불만을 직접 낸 경우(명시적 수요)
- 단, 오염/불확실이 큰 구간(near/supercritical + EES↑)에서는 오히려 금지(드리프트 위험).

**데이터(episode buffer) 구성(권장 최소)**
- 최근 N개의 TraceCapsule에서 텍스트/툴결과를 뽑아 `(x → next_token)` 형태로 구성
- 포함/제외 규칙은 Logging Policy의 보관/프라이버시 원칙을 그대로 따른다(원문 과다 저장 금지).
- 버퍼 크기는 작게: v0.1 권장 `512~2048 tokens` 수준에서 시작(“몇 스텝만”).

**최소 업데이트 루틴(권장 시작점)**
1) `c_0` = 현재 `adapter_profile` 계수
2) 1~8 step gradient update: `c ← c - η ∇_c L_ntp`
3) 안전 캡:
   - `||Δc||` clip(예: 0.25~1.0 표준화 스케일) + jerk-limit(EMA) + cooldown
   - `residual_ratio`가 θ를 넘으면 즉시 중단(UBB 설명 불가/OOD 의심)
4) 평가:
   - `invariance_v0` + 최소 canary suite(절차/포맷/툴일관성) 통과 시에만 후보 승격
5) 커밋:
   - `adapter_profile_id`를 새 버전으로 커밋하고, 적용은 다음 에피소드부터
6) 롤백:
   - canary/현장 지표 악화 시 `rollback_token`으로 즉시 원복(자동화 권장)

**로깅(필수에 가깝다)**
- `FINETUNE_RUN_START/END`: method 예 `ttt_lite_ubbc`, `backbone_frozen=true`, 생성 artifact_ids에 `adapter_profile_id` 포함
- `ARTIFACT_TUNE_*`: 후보/승격/롤백 계보(운영 회귀 관리)
- JML: §4.8.4 필드를 최소로 반드시 남겨라(나중에 “무슨 프로필이었는지”가 사라지면 재현 불가).

문서 포인터:
- Wiring: `(A0n)`
- Sidecar: §2.7.7
- Logging: §7(ARTIFACT_TUNE_*), 7b) (FINETUNE_RUN_*)

#### 4.9 (NEW) Meta-observable subspace + Axis Bank: “e_t/QP는 저차원 손잡이만 쥔다”

**핵심 전제**: Sidecar e_t와 QP가 직접 “보고/제어”할 수 있는 상태공간은, 백본 LLM의 전체 latent가 아니라 **일부 저차원 축들의 부분공간**이다.  
따라서 v0.1~v0.2 단계에서는 “축(채널)을 적게, 하지만 일관되게” 운영하는 것을 기본값으로 둔다.

##### 4.9.1 Axis 구성(v0.1 권장, 가성비)
- **LR axis(semantic axis)**: 사람이 의미를 정의한 supervised probe 방향  
  - 예: `deep_reasoning`, `task_focus`, `self_reference`, `mem_pressure`, `risk`, `confidence` 등
- **PC axis(structural axis)**: 관측 분포에서 variance가 큰 상위 PCA 방향  
  - **주의**: 분포/레짐(z_t)이 바뀌면 의미가 드리프트할 수 있으므로 “버전/레짐 관리”가 필수
- **TG axis(gestalt axis)**: 문장/청크/툴스텝 같은 “경계(boundary)”에서 뽑은 상태를 저차원(K=12~32, v0.1 권장 12~24)으로 투영한 축(Thought Gestalt-style)
  - 목적: “생각 단위”에 가까운 관측 채널을 Axis Bank로 고정해 루프/전이/거시 상태 추적에 사용 가능성 평가
  - 운영: 초기에는 무조건 `monitor-only`로 시작(제어 금지), 대칭/레짐 안정성 통과 전에는 BG 입력으로도 올리지 않는다.
- (Option) **SAE axis**: disentangled feature 기반 축(후순위)

권장 초기 스펙:
- 관측 레이어: 1~2개(mid/late)
- 축 개수 K: **허용 12~32**, v0.1(로컬 가성비) **권장 12~24**  
  - LR 6~10 + PC 6~14 정도(욕심 금지)
- e_t 차원(d): **허용 16~128**, 로컬/초기 **권장 32~64**

##### 4.9.2 Axis 역할 태그(운영 규칙)
축은 “진실 판독기”가 아니라 **측정+조종 가능한 인터페이스**다.  
따라서 각 axis는 도입 시점부터 역할을 태그로 분리한다.

- `monitor-only`: 관측/요약용(제어 금지)
- `control-only`: 제어는 가능하지만 관측 신뢰도가 낮아 모니터로는 위험
- `dual-use`: 관측/제어 모두 허용(드물고, 조건부로만)

##### 4.9.3 최소 검증 루틴(축 도입 전 필수)
1) **Text-confound/대칭 안정성**  
   - paraphrase/포맷 변형/순서 변형에 대해 axis 값이 크게 흔들리지 않는지(대칭 기반)
2) **레짐(z_t) 교차 안정성**  
   - 모드가 바뀌어도 axis의 방향성/의미가 유지되는지  
   - PC axis는 특히 필수(드리프트 위험)
3) **Off-target coupling(결합도) 측정**  
   - axis j를 밀었을 때 다른 axis들이 같이 흔들리는지  
   - 결합도가 큰 축은 `control-only`에서 제외하거나 gain(α)을 제한

##### 4.9.4 JML 스키마(권장 추가 필드)
- `axis_snapshot`: `{axis_id: value}` (턴/에피소드 단위)
- `axis_bank_version`: axis 세트/버전 식별자
- `axis_metrics`(요약):  
  - `stability_score`(대칭/패러프레이즈), `regime_stability`(z_t 교차), `coupling_topk`, `control_efficacy`, `role_tag`



#### 4.10 (NEW/Ops) 동기화(synchrony) 기반 “루프 고착” 감지(가성비)
**목표**: “계속 더 생각/더 검색”이 실제로는 같은 상태를 맴도는 낭비가 되는 순간을, QP가 값싼 신호로 잡아낸다.  
이건 정답 판독이 아니라 **BG의 조기 종료/모드 전환을 보조하는 계측**이다.

- 입력 소스(권장): `axis_snapshot`(4.9.4)에서 만든 저차원 `h_t ∈ R^K`
  - 여기의 axis에는 LR/PC뿐 아니라, 실험적으로 `TG axis`(4.9.1)의 일부 차원을 포함해도 된다(단, monitor-only 유지).
- 계산(가성비): 선택된 pair 집합 P에 대해 지수감쇠 내적을 재귀 업데이트  
  - `s_{ij,t} = r*s_{ij,t-1} + h_{t,i}*h_{t,j}`
- QP 산출(권장 최소):
  - `sync_hat`(요약), `sync_drift_hat`(변화율), `loopness_hat`(루프 고착 휴리스틱)
- BG 사용(권장):
  - `loopness_hat`↑ + `ΔQ` 미미 + `ΔM`↑면 `early_stop_reason=LOOPNESS` 후보
  - 또는 `switch_mode`(z_t 전환)로 탈출(히스테리시스 규칙 유지)

> v0.1에서는 **monitor-only**로 시작하고, 로그가 쌓이면 BG 입력으로 승격한다.  
> (오판으로 떨림 들어가면 ‘낭비 방지’가 아니라 ‘일 방해’가 된다.)



#### 4.11 (NEW) Neuro-motif 최소 도입: microtype + fast trace + 게이팅 (3~7일)

> 목적: 조향을 프롬프트가 아니라 “구조(게이팅/fast trace)”로 옮기는 첫 단계.  
> 생물학 복제가 아니라, **짧은 시간대 필터(STP 역할)** + **조건부 미세 모드 선택(microtype)**만 가져온다.

##### 4.11.1 산출물 3종(최소)
1) **fast trace**(지수감쇠) 구현 + 로그(`trace_norm`, `trace_delta_norm`)
2) **etype(K=4~8)** 점수 산출 + 로그(초기 **monitor-only**)
3) 게이팅 타깃 1개 연결(권장 순서: `retrieval_gain` → `sampling_params` → `adapter_id`)

##### 4.11.2 fast trace: 입력 후보(가성비)
- `loopness_hat`, `stuckness`, `ΔQ`, `ΔM`, `retrieval_pressure`, `verifier_score`, `axis_snapshot` 요약

업데이트 기본형:
- `trace_t = r*trace_{t-1} + φ(features_t)`

##### 4.11.3 etype: monitor-only에서 시작하는 이유
etype는 잘못 걸면 “낭비 방지”가 아니라 “일 방해”가 된다.  
그래서 순서:
1) 점수/선택만 기록
2) etype 전환 순간의 Q/M/실패모드 변화를 관찰
3) 안정성이 확인되면 제한적으로 게이팅에 연결

폭주 방지(필수):
- `etype_switch_count` 임계치 초과 시 쿨다운(일정 기간 etype 고정)

##### 4.11.4 평가(A/B 최소)
- baseline(v0.1) vs +trace vs +etype(gating)
- 반드시 보는 것:
  - 평균 `Q`, 평균 `M`, 평균 `Q/M`
  - `loopness_hat` 감소 여부
  - 실패 모드 분포 변화(특정 실패가 줄었는지)



#### 4.12 (Option/Research) TG-lite axis 실험: “경계(boundary) 요약”을 Axis Bank 후보로 넣기

**목적**: Thought Gestalt류를 “백본 구조 변경”까지 가져가기 전에,  
(1) 관측 채널로서 쓸모가 있는지, (2) 대칭/레짐 안정성이 나오는지, (3) 루프/낭비 감지에 실질 개선이 있는지부터 판정한다.

##### 4.12.1 최소 구현(v0.1 범위)
- boundary 선택(문서화 필수): `sentence_eos`(권장) / `chunk_delim` / `tool_step_end`
- 추출: 선택 레이어 `ℓ*`의 boundary hidden을 뽑아 `h_t = normalize(W_tg·h^(ℓ*))`, K=12~32(허용, v0.1 권장 12~24)
- Axis Bank 등록:
  - `type=TG`, `role_tag=monitor-only`
  - axis_id 예: `TG:L{ℓ*}:K{K}:B{boundary}:v1`
- JML 기록: 기존 `axis_snapshot`, `axis_metrics`, `sync_hat/sync_drift_hat/loopness_hat` 흐름 그대로 사용

##### 4.12.2 필수 판정(축 도입 전 검증 루틴 재사용)
- 대칭 안정성(4.9.3): paraphrase/포맷/순서 변형에서 값 요동 억제
- 레짐 교차 안정성(4.9.3): z_t 변경에도 의미 유지(필요 시 z_t별 basis 분리)
- 결합도(4.9.3): 제어 채널로 올릴 생각이 생기면 coupling_topk부터 측정

##### 4.12.3 성공 기준(운영 지표로만 판단)
- “PPL 자랑”이 아니라 아래 중 최소 1개가 재현 가능하게 개선되면 성공:
  - `loopness_hat` 조기 경보 품질 향상(낭비 탐지)
  - `sync_drift_hat`의 해석 가능성 증가(상태 변화 여부가 더 명료)
  - 특정 실패모드 재발률 감소(같은 패턴 반복을 더 빨리 끊음)

##### 4.12.4 (훈련할 때만) detach/no-detach 비교는 별도 트랙
- TG 원 논지의 본체(credit assignment)는 “no-detach”이지만, 그건 백본 학습 루프를 건드린다.
- 따라서 본 문서의 기본 로드맵(v0.0~v0.2)에서는 제외하고, 필요할 때만 별도 실험 프로토콜로 분리한다.



#### 4.13 (NEW/Ops) SSM-lite Digital Twin: macro_state_id + 전이행렬(P̂)로 ‘거시 상태’ 추적

**목표**: 로컬 환경에서 ‘전체 히스토리 기반 검증’을 매번 돌리면 비용이 폭발한다.
그래서 (e_t, z_t, QP 요약, trace 등)으로 만든 **거시 상태(macro)** 를 먼저 추적하고, 위험 신호가 있을 때만 미시로 줌인한다.

이 섹션은 Sidecar 문서의 6.6(Verifier=macro belief + zoom-in)을 **구현 관점**에서 구체화한다.

##### 4.13.1 입력 정의(고정)
- `macro_obs_t = concat(e_t, z_t(one-hot), qp_summary_t, trace_t?, budget_stats_t)`
  - `qp_summary_t`: QP 전체 벡터가 아니라 **요약 슬롯(예: loopness_hat, stuckness, ΔQ, ΔM, retrieval_pressure, verifier_score 등)** 만
  - `trace_t`는 있으면 넣되(v0.1에서는 `trace_norm`, `trace_delta_norm` 정도로 충분)
- **업데이트 타이밍**: `Boundary close` 시점의 snapshot을 표준으로 삼는다(중간 스텝에서 흔들리는 값은 디버그용).

추가(필수에 준하는 권장): **schema/hash로 거시 관측을 고정**
- `macro_obs_schema_id`: 슬롯/스케일/정규화 규약 ID(예: `macro_obs_v0.1`). 입력 슬롯이 바뀌면 반드시 변경.
- `macro_obs_hash`: 정규화된 `macro_obs_t`에 대한 결정론적 해시(sha256 권장).
- (옵션) `macro_obs_ref`/`macro_obs_codec`: 원본 벡터를 debug-store/analysis-store에 두고 포인터만 남기기.



##### 4.13.2 macro_state_id 생성(클러스터링 v0.1)
- 오프라인(배치)에서 최근 N개 boundary의 `macro_obs_t`를 모아 클러스터링한다.
  - 권장(가성비): **k-means**, K=12~32 (로컬 v0.1은 16~24부터)
  - 대안: GMM(soft), HDBSCAN(가변 K)
- 산출물:
  - `macro_state_version`: centroid 세트 버전(데이터/스케일링/입력 슬롯이 바뀌면 반드시 버전업)
  - `macro_state_method`: {kmeans|gmm|hdbscan|hmm|other}
  - `macro_state_method_params_hash`: (권장) 전처리/스케일/하이퍼파라미터 직렬화 해시
  - `centroids`: 저장(파일/아티팩트) + `centroid_hash` 기록
  - (NEW) `centroid_hash`는 `macro_state_version`과 별개로, **동일 버전 내에서도 파일/내용이 바뀌었는지** 잡는 안전핀이다.
  - (권장) `prototypes_topk`: 각 macro_state를 대표하는 episode_id 샘플(top-k, 해석/회귀용)
- 온라인 할당:
  - `macro_state_id = argmin_k ||macro_obs_t - c_k||`
  - `macro_state_confidence`: (권장) 거리 기반 softmax 또는 (GMM이면) posterior prob

- (NEW) 해석 가능성(운영 필수는 아님, 추천): `prototype_episode_ids_topk`
  - 각 `macro_state_id`에 대해 "대표 에피소드"(또는 boundary 구간) ID를 top-k로 유지한다.
  - 목적: `macro_state_id=7` 같은 숫자가 "무슨 상태인지" 사람이 추적할 수 있게 만든다.
  - 저장 위치(권장): 오프라인 카탈로그(`macro_state_catalog`)에 두고, 온라인 로그에는 필요할 때만 `prototypes_topk`로 포인터만 남긴다.

##### 4.13.3 전이행렬(P̂) 업데이트(EMA)
- boundary close마다 이전 상태 `m_{t-1}`에서 현재 `m_t`로의 전이를 카운트한다.
- 온라인 갱신(권장):
  - `C[m_prev, m_curr] += 1`
  - 일정 간격(예: 50 boundary 또는 하루)마다
    - `P_hat = row_normalize(C + α)` (α=0.5~1.0 smoothing)
    - 또는 `P_hat = (1-β)P_hat + β*row_normalize(C_batch + α)` (β=0.05~0.2 EMA)
- 주의:
  - `macro_state_version`이 바뀌면 **P̂를 리셋하거나** 버전별로 분기한다(혼합 금지).

##### 4.13.4 위험 점수/줌인 트리거(운영 규칙)
- `RiskSet`: 운영상 위험한 macro state 집합(초기에는 휴리스틱으로 시작, 이후 실패 로그로 업데이트)
  - 예: `early_stop_rate`↑, `verify_fail_rate`↑, `loopness_hat`↑, `residual_ratio`↑, `closure_score`↓
- `risk_score`(권장):
  - `risk_score = sum_{m' in RiskSet} P_hat[m_t, m']`
- Zoom-in 트리거(권장, 단일 신호 맹신 금지):
  - `risk_score`↑ AND (`closure_score` 급락 OR `residual_ratio` 급등 OR 반복 early_stop)

##### 4.13.5 로그 계약(필수 포인터)
- Logging Appendix(`SSOT_LOGGING_POLICY.md`)의 권장 필드로 최소 기록한다.
  - `JML_ENTRY.payload.digital_twin.{macro_obs_schema_id, macro_obs_hash, macro_state_id, macro_state_version, macro_state_confidence, macro_state_method, centroid_hash, risk_set_id, risk_score, next_state_topk, prototypes_topk, zoom_in_trigger}`
  - 또는 `STATE_SNAPSHOT.payload.digital_twin.*`

##### 4.13.6 금지 규칙(재확인)
- macro_state / P̂ / risk_score는 **Control/진단용**이다. Evidence/Claim 권위를 만들거나 바꾸지 않는다.
- stop-rule(τ_stop)은 prior 영향 0(독립). risk_score로 ‘더 오래 생각’ 강제하지 않는다.
- 온라인 라우팅 규칙(즉시 행동 변경)에 직접 연결할 때는, 반드시 hysteresis/cooldown + 회귀 스위치가 있어야 한다.


#### 4.14 운영 스모크 테스트(가성비, v0.1 합격 조건)
- **로그 존재**: JML에 `t, task_id/episode_id, e_t, z_t, tau, Q, M, Q_over_M`가 최소로 남는다.
- **BG 동작**: `stop_policy`가 실제로 발동하고(조기 종료 포함), 그 근거가 JML에 남는다.
- **클로저 계산**: `closure_score_e / closure_score_qp`(또는 최소 하나)가 계산되고, 0/NaN 폭발이 없다(`eps` 적용).
- **Axis Bank(있다면)**: 신규 축은 `monitor-only`로만 들어가며, `stability_score`/`axis_metrics`가 기록된다.
- **회귀 방지**: 같은 입력/설정으로 3회 반복 시, 핵심 지표(Q, M, closure)가 ‘랜덤 워크’ 수준으로 흔들리지 않는다.

> 더 자세한 운영 체크리스트는 Sidecar 요약의 6.5.7 / 8.4를 그대로 따른다.

### 5. v0.2: “Self-Graph + 정책 게이팅” (1~2주)

#### 5.1 Self-Graph 최소 구현 (MVE, 이번 세션 업데이트)

목표: “그때그때 RAG”가 아니라, **구조(그래프)를 타고 검색/검증/회귀를 돌리는 최소 시스템**을 만든다.
이번 MVE는 *권위/운영/편의*를 분리해 오염과 권위 혼선을 선제 차단한다.

##### 5.1.1 저장소 3분리(필수 권장)
- **ClaimStore(권위)**
  - 테이블: `claims`, `claim_edges`
  - Claim 관계 엣지: `revises/supersedes/contradicts`만
  - 덮어쓰기 금지(새 Claim + 관계로만)
- **IGL(Influence Graph Layer, 운영 prior)**
  - 테이블: `igl_nodes`, `igl_edges`
  - 엣지: `ASSOCIATES_WITH/INFLUENCES/CO_ACTIVATES` 등 (권위 없음)
  - 업데이트: HAG-style grow/prune, **Boundary에서만 커밋**
- **Artifact/IndexStore(편의)**
  - embedding/index/cache, subq 결과 캐시, 재현용 hash
  - 옵션 A(DuckDB+Parquet)면 여기로 밀어 넣는다

SQLite 스키마 스케치(가성비)
```sql
-- ClaimStore
CREATE TABLE IF NOT EXISTS claims(
  claim_id TEXT PRIMARY KEY,
  namespace TEXT,
  text TEXT,
  status TEXT,
  confidence REAL,
  evidence_ids_json TEXT,
  created_time TEXT,
  version INTEGER
);
CREATE TABLE IF NOT EXISTS claim_edges(
  src_claim_id TEXT,
  dst_claim_id TEXT,
  rel TEXT,
  created_time TEXT,
  PRIMARY KEY(src_claim_id, dst_claim_id, rel)
);

-- IGL
CREATE TABLE IF NOT EXISTS igl_nodes(
  node_id TEXT PRIMARY KEY,
  node_type TEXT,
  ref_id TEXT,
  created_time TEXT
);
CREATE TABLE IF NOT EXISTS igl_edges(
  src_node_id TEXT,
  dst_node_id TEXT,
  rel TEXT,
  w REAL,
  updated_time TEXT,
  PRIMARY KEY(src_node_id, dst_node_id, rel)
);
```

##### 5.1.2 PSGR(ProgRAG-style) Progressive Self-Graph Retrieval (v0.1)
“한 번에 다 넣는 RAG” 대신, **짧은 반복**으로 포인터를 모은다.

- 기본 상한: `psgr_step_cap = 3` (에피소드당)
- 각 step은 `prog_cycle_id`로 묶는다

Step 루프
1) `SUBQ`: 질문을 1~3개 서브쿼리로 분해 (텍스트 + 간단한 타입 태그)
2) `REL_RETR`:
   - ClaimStore: BM25/keyword 또는 embedding으로 Top-K claim_id
   - IGL: 해당 노드에서 1~2-hop 확장(top-w)
3) `PRUNE`:
   - hubness(과도 연결) 또는 낭비 신호(`M`↑, `ΔQ`↓, `loopness_hat`↑)면 IGL만 prune
   - Claim 관계 엣지/Claim status/evidence_ids는 건드리지 않는다
4) `PACK`: 포인터 기반으로 prompt pack (원문은 해시/포인터만; 과다 주입 금지)
5) `ANSWER/VERIFY`: verifier/constraint check
6) `UPDATE`: Boundary에서 HAG sweep(또는 shadow ΔW)

##### 5.1.3 PROGRAG 이벤트 로깅(필수)
PSGR이 실전에선 ‘검증/회귀’가 핵심이라, 사건 로그가 없으면 그냥 운빨 시스템이 된다.
Logging Appendix + schema bundle을 단일 기준으로 아래 이벤트를 남긴다.
- `PROGRAG_STEP_START/END`
- `PROGRAG_SUBQUESTION`
- `PROGRAG_RELATION_RETRIEVAL`
- `PROGRAG_GRAPH_UPDATE`

##### 5.1.4 안전장치 체크리스트
- 기본 `self_graph_update_mode=shadow`
- `self_graph_update_cap`(에피소드당 grow+prune 총량)
- `self_graph_update_cooldown_episodes`(연속 갱신 방지)
- 회귀 실험(최소 N=5)에서 `CSI`/`CSI_proxy`가 급락하면 업데이트를 즉시 막고 원인 분석


#### 5.2 정책 게이팅(간단 버전)
- e_t와 z_t(필요 시 adapter_profile)를 이용해 다음을 게이트:
  - 메모리 조회 강도(몇 개 꺼낼지)
  - 도구 호출 여부
  - 재시도 횟수/탐색 폭(n)
- BG는 여기서도 계속 상한을 잡는다. (게이팅이 있어도 예산은 필요함)

---

### 6. v0.3: “학습 루프(경험으로 규칙을 고도화)” (수 주~)

#### 6.1 경험 기반 τ_budget 업데이트
- 처음에는 수동/규칙 기반으로 tau_budget를 잡는다
- JML에 누적된 통계를 바탕으로:
  - (UBB 도입 시) adapter_profile별 Q/M 분포 및 residual 분포
  - 모듈별 tau_gen/tau_mem 분포
  - task 유형별 Q/M 분포
  를 사용해 tau_budget(n,p)를 점점 현실적으로 만든다.

#### 6.2 Q 추정 고도화(Verifier/Teacher)
- Q를 단순 성공/실패가 아니라:
  - verifier score, consistency score, downstream utility
  처럼 다면화하면 BG가 더 똑똑해진다.
- 단, 처음부터 복잡하게 만들지 말고 “한 개라도 돌아가게”가 우선.

---

#### 6.3 (Option) Artifact Self-Tuning(Feedback Descent): “규칙/프롬프트/정책” 점진 개선
- 대상(예):
  - RAG/Verifier 프롬프트, 메모리 라우팅 규칙, 도구 선택 규칙, BG 휴리스틱 파라미터
- 루프(최소):
  - 현재 버전 `x*` → 후보 `x` 제안 → 같은 입력 세트로 A/B 평가 → 승리하면 채택(버전업), 패배면 피드백 누적
- 평가자(E)는 “스칼라 점수”만 내지 말고,
  - `p_t`(누가 더 나은지) + `r_t`(왜/어떤 케이스에서/어떻게 고칠지) 를 남긴다.
- 기록:
  - JML에 `artifact_id / base_version / candidate_version(or diff) / p_t / r_t / metrics / rollback_token` 를 남겨
    회귀(regression)와 반복 실수를 줄인다.
- 상세 설계는 `MODULE_SIDECAR_QP_ZT_SUMMARY.md`의 **6.5**를 참조.


##### 6.3.1 PACEvolve식 ‘장기 자기개선’ 실패모드 3종을 운영 규칙으로 흡수

PACEvolve(arXiv:2601.10657)는 LLM-in-the-loop 진화 탐색이 잘 망가지는 방식 3개를 명시했다: **Context Pollution / Mode Collapse / Weak Collaboration**.
Augnes Local에서는 이걸 ‘새 모듈’로 두지 말고, **Artifact Self-Tuning(§6.3) 운영 규칙 + 로그/지표**로 흡수하는 게 가성비가 좋다.

- **Context Pollution(컨텍스트 오염) 방지**
  - (필수) `generation_ctx`와 `selection_ctx`를 분리한다.
  - 후보 생성 버퍼에는 “원문 히스토리”가 아니라 **프루닝된 요약(핵심 실패 모드 태그 + 최소 증거 링크)** 만 넣는다.
  - 관련 로그: `MEMORY_PRUNE`, `ARTIFACT_TUNE_*` + `ContextPollutionProxy_w` (Logging Appendix §11.6)

- **Mode Collapse(국소해 고착) 탈출**
  - stagnation이 누적되면 “더 생각하기”가 아니라 **backtrack**을 먼저 한다.
  - 구현은 무겁게 갈 필요 없이:
    - (A) 안정 버전으로 롤백 후, 후보 생성 조건만 바꾼 분기 생성
    - (B) CBS/PR(주기적 리셋)처럼 히스테리시스 해제 레버를 켜서 탐색 공간을 다시 열기
  - 관련 로그: `ARTIFACT_TUNE_ROLLBACK`, `MBB_TriggerRate_w`

- **Weak Collaboration(병렬 궤적 협업 약화) 개선**
  - 여러 후보를 동시에 돌릴 때는 “무조건 crossover”가 아니라,
    - 내부 개선(단일 궤적 refine) vs 교차 혼합(crossover)을 **self-adaptive sampling**으로 조절한다.
  - 로컬에선 간단히:
    - 후보 다양성(embedding/feature variance)이 낮아지면 crossover 비중↑
    - 다양성이 충분하면 refine 비중↑



##### 6.3.1a HCM (Hierarchical Context Manager): PCF를 상태-전이로 고정

목적: 컨텍스트 오염/포화/과잉요약을 ‘감’이 아니라 상태 머신으로 관리한다.
- HCM은 Evidence/Claim 권위를 바꾸지 않는다.
- stop-rule(τ_stop)을 override하지 않는다.

**상태 집합**
- `HCM_state ∈ {clean, warming, polluted, overflow}`

**입력 신호(관측치, 윈도우/EMA 권장)**
- `workspace_token_ratio = current_tokens / token_cap`
- `PE_memory_w`: 요약/압축 실패, 근거 누락, 회상 불일치 등 memory 관련 압력
- `EES_w`: tool/verifier 실패 누적
- `retrieval_pressure`: 필요한 근거/문서를 더 가져와야 하는 압력
- `stuckness_w`: 같은 실패 모드 반복/진행 정체

**출력 액션(PCF 액션에 매핑)**
- `clean`:
  - `KEEP/PIN` 위주, 불필요한 압축 금지
- `warming`:
  - pulse-boundary에서만 `FOLD_SUM` (포인터/인덱스 우선)
- `polluted`:
  - `FOLD_SUM` + `VERIFY` 편향
  - `MEMORY_PRUNE`는 `CONSOLIDATE/Idle`에서만 허용
- `overflow`:
  - `token_cap` 단계적 강등(예: 8k→6k→4k)
  - `EVICT/PRUNE`는 RC(복구 계약) 충족 시만 허용

**금지 규칙(불변)**
- 요약/압축 산출물은 Evidence를 대체하지 않는다(ClaimPacket/압축 뷰는 `evidence_id`를 유지).
- `HCM_state`는 “뷰/제어 변수”이며 truth-claim이 아니다.
- online에서 `MEMORY_PRUNE`로 원문/근거 포인터를 날리는 행위 금지(Idle-only).

권장 로그:
- `STATE_SNAPSHOT.payload.metrics_optional.artifact_tuning.hcm_state`
- `ContextPollutionProxy_w` (Logging Appendix §11.6)


##### 6.3.1b Momentum Backtracking (MBB): rollback을 ‘재현 가능한 제어’로 고정

목적: rollback을 남발하지 않고, “개선 가능성”이 있을 때만 재탐색한다.
- rollback은 사용자 출력이 아니라 내부 계획/정책/워크스페이스 포인터에만 적용한다.

**Snapshot Stack (최소 저장 단위)**
- `snapshot := {snapshot_id, route_last, policy_levers, workspace_pointers_hash, seed, budget_slice}`
- 원문/서사 저장 금지(포인터 기반)

**진행 모멘텀(학습 없이 계산, 윈도우 기준)**
- `progress_momentum_w = ΔPerf_w - λ·ΔCost_w - μ·ΔStabPenalty_w`

**트리거(필요조건)**
- `stuckness_w ↑` AND (`EES_w ↑` OR `PE_tool ↑` OR `verifier_conflict ↑`)
- 같은 `failure_mode_hit`가 연속 N회 반복

**금지**
- `PE_lm` 단독 스파이크로 rollback 금지
- `COMMIT phase`에서 deep rollback 금지(1-step REPLAN만)

**깊이 선택**
- 약한 음수 모멘텀: 1-step backtrack (REPLAN)
- 큰 음수 + tool/verifier 불일치: 2~K-step (단 `replay_budget` 상한)

권장 로그:
- `STATE_SNAPSHOT.payload.metrics_optional.artifact_tuning.progress_momentum_w`
- `STATE_SNAPSHOT.payload.metrics_optional.artifact_tuning.backtrack_depth`
- `ARTIFACT_TUNE_ROLLBACK` (Logging Appendix §12.2)


##### 6.3.1c Self-adaptive Sampling: 레버 3개만 자동 조율

자동 조율 대상(3개만):
1) `branching_cap`
2) `sampling_params` (temperature/top_p만)
3) `retrieval_depth_k` (필요 시만)

규칙(권장):
- divergent(탐색) 구간:
  - `branching_cap` ↑ (소폭)
  - `sampling_params` ↑ (소폭)
  - `retrieval_depth_k`는 기본 유지
- convergent(수렴/커밋) 구간:
  - `branching_cap` ↓
  - `verifier_budget` ↑
  - `τ_stop` 보수화
- `EES_w ↑` 또는 `PE_tool ↑`:
  - `branching_cap` ↓
  - VERIFY 편향, `retrieval_depth_k` ↑(필요 시)
- `stuckness_w ↑` AND `EES_w` 낮음:
  - sampling만 소폭 조정, branching은 유지(헛발작 방지)

안정화:
- jerk cap/cooldown 필수(매 스텝 레버 변경 금지)

##### 6.3.1d SSC (Spatial Stencil Controller): inhibitory stencil로 “컨텍스트 공간”을 soft-gating

모티브: 논문에서 alpha/beta power의 **공간 패턴이 spiking 표현을 억제하는 inhibitory stencil**로 작동한다는 그림을,  
로컬 에이전트에서는 “컨텍스트/메모리 뱅크 공간에서의 부분 억제(soft mask)”로 번역한다.

목적(운영 관점):
- PCF/HCM이 `FOLD/EVICT` 같은 **큰 수술**이라면, SSC는 그 전에 **오염/혼선/과잉회상**을 “부분 억제”로 눌러 비용을 줄인다.
- `generation_ctx` vs `selection_ctx` 분리 원칙(§6.3.1)과 궁합이 좋다. (선택 컨텍스트를 깨끗하게 유지)

**최소 정의(Control/View)**  
- `ContextStencil := {region_id -> inhibit_w}`  
  - `inhibit_w ∈ [0,1]` (0=허용, 1=강억제)  
  - region partition은 구현이 정한다(예: `T0_user`, `T0_tools`, `T1_summary`, `T2_evidence`, `T2_trace`, …).  
  - “공간”이란 물리 공간이 아니라, **컨텍스트가 들어가는 슬롯/뱅크의 좌표**다.

---

#### (A) Region partition 먼저 고정(필수, v0)
- `ctx_region_set_id = ctxbank_v0` 같은 **고정 ID**를 만든다(회귀/재현용).
- 권장 최소 region(예):
  - `t0_user_recent`, `t0_tool_results`, `t0_system`, `t1_summary`, `t2_evidence_refs`, `t2_trace_capsule`, `t2_policy_refs`

#### (B) 스텐실 계산(가성비 v0: 룰 기반 → 필요하면 얇은 헤드)
입력(권장):
- `route_last`(intent/evidence/search/context_profile/route_tier)
- `HCM_state`(clean/warming/polluted/overflow)
- `PE_*_w`, `EES_w`, `retrieval_pressure`, `tool_fail_streak`

출력:
- `inhibit_w[region]` (벡터)

예시 규칙(개념):
- `evidence_mode=audit_first` 또는 `phase=VERIFY`:
  - `inhibit(t2_evidence_refs)=0` (근거 접근 허용)
  - `inhibit(t0_user_recent)`는 과도한 재서술을 막기 위해 소폭↑
- `route_tier=R0_DIRECT`:
  - `inhibit(t2_evidence_refs)` 소폭↑ (불필요한 리트리벌 남발 방지)
- `HCM_state=overflow`:
  - `inhibit(t0_*)` 전반↑ + PCF `FOLD_SUM` 후보 우선
- `EES_w↑` + `tool_fail_streak↑`:
  - “더 끌어오기” 대신 VERIFY 편향(= selection_ctx를 증거/검증 쪽으로 좁힘)

#### (C) 적용 위치(필수: override 금지, 편향만)
- **Retrieval bank weighting**: bank/source 점수에 `w = exp(-α·inhibit_w)` 같은 감쇠를 걸어 후보를 좁힌다.
- **Selection context masking**: candidate selector가 보는 컨텍스트에서 `inhibit_w`가 높은 영역은 낮은 가중치로 처리한다.
- **PCF 후보 스코핑**: “무엇을 접을지/핀할지”를 고를 때 힌트로만 사용한다(접기 자체는 PCF/RC가 담당).

금지:
- Evidence Registry 원문/포인터를 숨기거나 삭제하는 방식으로 “없는 척” 하는 것(=RC 위반 위험).
- stop-rule(τ_stop)을 사실상 우회하는 제어(=SRF 위반).

#### (D) 안정화(필수)
- **업데이트는 Observe 직후 1회 또는 Pulse-boundary에서만**(매 스텝 재계산 금지).
- EMA + jerk cap + min-dwell(§5, §11) 적용.  
  (스텐실은 이름만 다를 뿐, 본질적으로 “정책 진동”의 한 형태다.)

#### (E) 계측(권장)
- 스텐실 “정체성”만 남긴다: `ctx_region_set_id`, `stencil_hash`, `topk_regions`
- 안정화/효과 지표는 Logging Policy §11.8을 따른다:
  - `stencil_entropy_*`, `stencil_jerk_*`, `stencil_moran_i_*`, `stencil_usage_anticorr_*` (권장)
- (옵션) PROBE `stencil_v0`: 불변성/셔플/anti-corr 회귀를 작은 배터리로 묶어 조기 탐지.

Wiring 포인터: (A0l) `WIRING_INTEGRATION_MAP.md`


##### 6.3.2 Agent0식 ‘데이터 제로’ 자기진화: Curriculum ↔ Executor 분리(가성비 이식)

Agent0(arXiv:2511.16043)는 “정답 데이터 없이”도 자기진화를 굴리는 핵심을 **문제 생성(Curriculum)과 실행(Executor)을 분리**하고,
**툴 사용을 포함한 결과를 pseudo-label로 누적**하는 구조로 정리했다.

Augnes Local에서는 RL까지 갈 필요 없이, 아래 2가지만 문서 수준에서 즉시 이식하면 된다.


##### 6.3.2a TaskForge Sandbox (Curriculum 생성: 계측/회귀 풀 자동 성장)

목적:
- 사용자 요청과 분리된 sandbox에서 “프런티어 과제”를 자동 생성/실행하여 회귀 테스트 풀을 성장.
- 산출물은 **훈련 데이터가 아니라 measurement episode**로만 저장(권위 0).

입력(권장):
- `target_capability_tags` (tool-use, multi-step, retrieval 등)
- `failure_mode_tags` (루프, 과잉툴, 근거 누락, 환각 인용 등)
- `invariance_transforms` (shuffle/rename/format-preserve)
- `budget_profile` (idle-only)

출력(task_spec 최소 포맷):
- `goal`, `constraints`, `tool_env`, `verifier(optional)`, `difficulty_hint`, `seed`, `transforms`

격리 규칙(필수):
- `episode_tag = "curriculum_sandbox"` (기본 retrieval에서 제외 또는 저가중치)
- sandbox 결과는 사용자 대화 컨텍스트로 유입 금지
- TaskForge 산출물은 “근거”가 아니라 “프로브/회귀 케이스”다

권장 이벤트:
- `PROBE_RUN_START/END` 또는 `ARTIFACT_TUNE_EVAL`로 기록(Logging Appendix §12.2)


- **Curriculum Agent = Probe/Regression 생성기**
  - 실패 모드 태그(루프, 과잉툴, 근거 누락, 환각 인용 등)를 입력으로
  - 작은 probe(짧고 결정적)와 regression set(이전 실패 재현)을 자동 생성

- **Ambiguity-aware 업데이트(불확실하면 덜 배운다)**
  - 후보 평가에서 표결/다중샘플 분산이 크면(=ambiguity↑),
    - `candidate_selector_w`를 낮추거나,
    - 승격을 보류하고 “추가 probe 생성”으로 넘긴다.
  - 즉, ‘자기진화’는 밀어붙이는 게 아니라 **불확실성에 비례해 보수화**한다.

##### 6.3.3 SimpleMem식 메모리 파이프라인: “압축-통합-쿼리적응 리트리벌”을 기존 계약에 맵핑

SimpleMem(arXiv:2601.02553)은 메모리를 **(1) 구조적 압축 → (2) 비동기 통합 → (3) 쿼리-적응 리트리벌**로 묶어 토큰 낭비를 크게 줄였다.

Augnes Local은 이미 `MEMORY_COMPRESS/MEMORY_PRUNE`와 A(Analysis Store) 비동기 뷰를 갖고 있으니,
새 시스템을 만들기보다 아래 3가지만 ‘정의/로그’로 먼저 고정하는 게 맞다.

- (1) **Structured Compression**: `MEMORY_COMPRESS.payload`에 `compression_view`(keyfacts/claims/actions/errors) 구분을 남긴다.
- (2) **Recursive Consolidation**: A(오프라인)에서 주기적으로 유사 단위를 병합하고 `consolidation_parent_ids`를 기록한다.
- (3) **Query-aware Retrieval**: 쿼리 복잡도/위험도에 따라 top-k/확장 깊이를 조절하고 `retrieval_scope_level`을 로그로 남긴다.

> 이 3개는 코드가 아니라 **로그 계약과 운영 규칙**이 먼저다. (그래야 나중에 ETL/분석이 된다.)


##### 6.3.3a Structured Memory Artifacts: “요약=텍스트”를 금지하고 구조로 고정

목적: 메모리 절약을 ‘서사 요약’이 아니라 **정형 번들**로 수행한다.

1) **ClaimPacket** (압축된 주장 묶음)
- `claim_id`
- `evidence_ids[]` (필수)
- `tool_run_ids[]` (있으면)
- `status` (tentative|verified|rejected)
- `notes` (짧게)

2) **TraceCapsule** (재사용 가능한 절차/라우팅 캡슐)
- `trace_id`, `goal_id`
- `route/policy snapshot` (hash/ref)
- `triggers & stop-rule context` (설명용)
- `reusable` + `reuse_key`

3) **StateSnapshot**
- `e_t / z_t`, `route_tier`, `policy_levers`, `WL metrics summary`

권장: 위 구조는 **원문을 담지 않는다**. 원문은 evidence registry 또는 tool_run 포인터로만 참조.


##### 6.3.3b Async Recursive Consolidation: CONSOLIDATE/Idle에서만 통합

CONSOLIDATE/Idle에서만 수행:
1) 후보 수집: 재사용 가치 있는 claim/trace/state만
2) 구조 압축: ClaimPacket/TraceCapsule/StateSnapshot 생성
3) 인덱싱: catalog 갱신 + pointer 등록
4) 선택적 PRUNE: RC 충족 시만(원문 삭제가 아니라 포인터 축소 우선)



#### 6.4 (Option/Research) 메타상태 다양체(M_e) 실험: 기하 기반 탐색/전이/비교
**목표**: e_t/JML을 “메타상태 공간”으로 보고, (1) 의미 있는 탐색, (2) 부드러운 모드 전환, (3) 세션/버전 간 변화 분석을 추가한다.  
핵심은 “실시간에 박지 말고 오프라인으로 먼저 증명”이다.

##### 최소 프로토타입(가성비 우선)
- 데이터: JML에서 최근 k일/에피소드의 `e_t` 시계열을 뽑는다.
- support 점수 s(e): kNN 거리/밀도 기반(간단).
- geodesic 근사:
  - e_t들을 kNN 그래프로 만들고,
  - 두 상태 e_A→e_B의 최단 경로를 구해 전이 스케줄로 사용.
- 지표 2개만 추가:
  - `path_eff_ratio = (실제 궤적 길이) / (최단경로 길이)`  (헤맨 정도)
  - `transition_peak_offmanifold = max s(e)` (이상 전이 감지)

##### 성공 기준(현실적인 것만)
- (탐색) candidate_e가 “아예 망한 상태”가 아니라, 정책을 실제로 개선하는 경우가 나온다.
- (전이) 모드 전환 시 e_t 요동과 실패율이 줄어든다.
- (비교) “좋은 날 vs 나쁜 날” 차이가 e-space에서 방향성 있게 잡힌다.

> 상세 개념/확장 아이디어는 Sidecar 통합 요약 문서의 **2.5**, JML 로그 필드 확장은 **6.1.5**를 참조한다.


### 7. 최종 체크리스트(이 문서의 목적 달성 조건)
- [ ] e_t가 있고, 업데이트가 된다(규칙 기반이라도)
- [ ] JML에 이벤트가 쌓이고, Top-K retrieval이 된다
- [ ] τ/Q/M이 최소한이라도 측정된다
- [ ] BG가 tau_budget + Q/M 조기 종료를 실제 루프에 연결한다
- [ ] (NEW) fast trace를 기록하고(trace_norm/trace_delta_norm), 최소 1개 게이팅 타깃에 연결한다
- [ ] (NEW) etype를 monitor-only로 도입해 스위치/효과를 로그로 확인한다
- [ ] 결과적으로 “낭비가 줄어드는지”를 로그로 확인할 수 있다

## 부록: “이 문서가 일부러 중복을 피한 곳”
- 필드/정의의 ‘정식’은 스키마 파일을 따른다.
- 의미론/필수 조건은 Canonical Spec을 따른다.
- 여기서는 **구현 절차·디버깅·운영 루틴**만 다룬다.


---

### 변경 로그
- 2026-01-21 r16: MUSE-lite 구현 가이드(competence-aware strategy loop) 추가
- 2026-01-09(r2): 2409.16394v5(메모리 기반 LRO) 인사이트를 운영으로 번역: `resource_load/resource_state` 계산/로그(§5.3.1) + avalanche/burst 감지/다운시프트(§5.3.2, §0.3.3) 추가. Boundary 신호/로그 포인터도 갱신.
- 2026-01-21(r15p1): Iterative Deployment 루프 문서화(TraceCapsule→Dataset→ArtifactTune/Finetune) + Logging/Schema 이벤트 확장(DATASET_BUILD_*, FINETUNE_RUN_*).
- 2026-01-03(r4): TRL Router 통합(라우팅 결과를 route_tier(R0~R5)로 정규화) + Step Loop에 `trl_route_assess()`/`apply_route_profile()` 삽입 + PCF/RC 연동 메모 추가.
- 2026-01-03(r3): 파일 포인터/참조 정합성 정리(문서 간 r2/r3 혼재 제거).
- 2026-01-03(r2): Integration Map 문서 추가 및 레포 구조(/docs) 포인터 갱신.
- 2026-01-03: TOOL_CALL/RETRIEVAL 이벤트명 정합성 수정, PROBE/PCI-A(A-PCI) 운영 루틴 추가(§5, §9), 파일명 포인터 정리.

- v2.2.2+7: Evidence Registry 단계의 `upsert` 표현을 `insert_or_link`로 정리(내용 덮어쓰기 오해 방지) + EES/StateSnapshot dot-path 표기 일관성 보강.
- v2.2.2+5: Pathak et al.(Nat Commun 2025) BCP/ICN 이식 반영: 설계 패턴 인덱스에 BCP/EES/synchrony 추가 + Step Loop 의사코드에 `compute_ees()` 삽입.
- v2.2.2: Self-Graph Influence 레이어(HAG) 업데이트 절차/디버그 체크리스트를 추가.
- v2.2.2+: CBS/PR(batched 후보 선택+리셋) 및 jerk-limited(Δ² 제한) 안정화 구현 패턴/디버깅 루틴을 추가.
- v2.2.2+: `SELF_REFLECT`를 SRP 프로토콜로 고정(프로파일/출력 포맷)하고 IQS/SCS/HAP 계측 루틴을 추가.
- v2.2.x: EOP(Expected Outcome Packet) + Self-Reflection(Inner Speech) 실행/로그/디버깅 루틴을 추가.
