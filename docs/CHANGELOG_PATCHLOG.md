# CHANGELOG / PATCHLOG (Consolidated) — r20.1p4p23 (2026-02-19)

<!-- DOC_ID: CHANGELOG_PATCHLOG -->
<!-- ROLE: 변경 이력 (통합) -->
<!-- SSOT: non-SSOT -->

> **문서 역할:** 변경 이력(통합)  
> **SSOT 지위:** non-SSOT  
> **이 문서에서 허용되는 변경:** 변경 요약/포인터. (정의/규약/필드 계약을 새로 만들지 않음)  
> **상위(업스트림) 기준:** SSOT_SCHEMA_BUNDLE.zip, SSOT_CANONICAL.md  
> **하위(다운스트림) 영향:** 없음(참고/감사/회귀용)  

이 파일은 프로젝트 업로드 편의를 위해 기존 패치로그를 **1개로 통합**한 문서다. (원문 내용은 그대로 보존)

---

## 2026-02-19 — r20.1p4p23
- (정합성 핫픽스) Active set 단일화 규칙 강화: 버전 박힌 아카이브 문서/산출물은 프로젝트 폴더에서 제거(또는 /_archive/로 격리). 인덱스(00_INDEX)는 단일 최신본만 유지.
- (정합성 핫픽스) CHANGELOG_PATCHLOG: DOC_ID 메타를 “파일당 1개”로 강제(중복/섹션 DOC_ID 제거 → SECTION_TAG로 치환).
- (정합성 핫픽스) SSOT_SCHEMA_BUNDLE: 문서 팩 태그와 manifest 버전 정합만을 위한 repack(스키마/계약 변경 없음).

## 2026-02-19 — r20.1p4p21
- (논문 아이디어 흡수) "Oscillatory control of cortical space as a computational dimension": **ContextStencil(공간 억제 스텐실)** 개념/규약/계측 추가.
  - Canonical: TRL Routing output optional `context_stencil` + Workspace §9.4a 추가
  - Playbook: SSC(Spatial Stencil Controller) §6.3.1d 추가 + 패턴 인덱스 4a 추가
  - Logging: Metric Spec Appendix §11.8 추가 + `StencilJerkP95`(§11.3) 추가 + (옵션) PROBE `stencil_v0` 포인터
  - Wiring: (A0l) 통합 포인트 추가 + r20.1 요약 업데이트
  - Index: A0 라벨 레지스트리(A0l) 추가
  - Sidecar: Axis→Space gating 메모(§2.8.8) 추가
  - Appendix: inhibitory stencil 모티브를 GNWT×IIT 운영 언어로 번역한 addendum 추가
- (스키마) 변경 없음: 전부 `metrics_optional`/`PROBE`의 **optional dict**로만 확장(로그 계약 유지).

## 2026-02-15 — r20.1p4p20
- (논문 아이디어 흡수) TTT-lite Session Adapter = Parameter Memory(PM): UBB 계수(coefficient)만 경계-전용으로 미세 업데이트하는 운영 패턴 추가.
- (문서) Wiring `(A0n)` 추가 + OPS_PLAYBOOK §4.8.5/§3.2.3f + Sidecar §2.7.7 + Logging Policy(FINETUNE_RUN_* + ARTIFACT_TUNE_*) 포인터 연결.
- (정합성) `00_INDEX_LATEST.md` 라벨 레지스트리에 **A0n** 추가.


## 2026-02-12 — r20.1p4p19
- (ops gate) “운영 가능성 Gate Checklist v0.1(10개 must-pass)”을 OPS_PLAYBOOK에 추가하고, WIRING/INDEX에 포인터를 연결.
- (회귀/불변성) PROBE `invariance_v0`에 SRF 및 shared prior pipeline 관련 test kind를 추가(스키마/계약 변경 없음; 운영 테스트 확장).
- (로깅) `GATE_DECISION.payload.*_used.prior_pipeline_id`를 “회귀 게이트 판정용 사실상 필수”로 격상(스키마 변경 없음).
- (규약) Canonical SRF 섹션에 “운영 준수는 테스트로 입증” 하위 절을 추가(포인터 포함).

## 2026-02-12 — r20.1p4p18
- (운영 정합성) MN `mn_conf` v0.1 기본 정의(부호 안정성×EWM 분산) 명문화 (Canonical/Sidecar/Playbook).
- (운영 정합성) MN `prior_clip_mn`이 LPS/G2A와 **동일 shared prior pipeline**을 **같은 코드 경로로** 통과해야 함을 강제 (Canonical/Wiring/Playbook).
- (로깅/회귀) `GATE_DECISION.payload.*_used`에 `prior_pipeline_id`(+ 선택 `applied_rules`) 권장 추가 (Logging Policy) + replay 회귀 테스트 포인터 (Playbook).
- (번들/예시) `event_gate_decision.example.json`에 `prior_pipeline_id` 추가(호환 확장; payload additionalProperties).

## 2026-02-12 — r20.1p4p17
- (논문 이식/운영) Memory-ANN-lite(MN): “선택을 직접 구동하지 않는 기억 변수” 기반 보상학습 프라이어 추가( Control/View only, prior-only, τ_stop 입력 금지 ).
- (문서) Canonical `§5.2.0d`, Ops `3.2.3e`, Wiring `(A0m)`, Sidecar `3.5.7`, Logging Policy( metrics_optional.memory_ann + gate_decision.memory_ann_used ) 반영.
- (스키마/예시) `STATE_SNAPSHOT.payload.metrics_optional.memory_ann` 예시 + `GATE_DECISION.payload.memory_ann_used` 예시 추가(호환 확장; payload는 additionalProperties로 허용).
- (정합성) `00_INDEX_LATEST.md` 라벨 레지스트리에 **A0m** 추가.

## 2026-02-11 — r20.1p4p16
- (논문 이식/운영) Goal→Action Coupling(G2A) 지표 + (옵션) ORAV(commit-hold/penalty) 프라이어 추가 (Canonical/Logging/Playbook/Wiring/Sidecar).
- (스키마) `STATE_SNAPSHOT.payload.metrics_optional.g2a/orav` 권장 키를 스키마 번들(state_snapshot.schema.yaml)과 예시에 반영(호환 확장).
- (정합성) WIRING 라벨 **A0k** 추가 + `00_INDEX_LATEST.md` 라벨 레지스트리 갱신.

## 2026-02-10 — r20.1p4p15
- 문서 패치: Render-of-Thought(arXiv:2601.14750v2) 기반 RoTTrace(렌더링된 CoT→단일행 이미지→비전 임베딩) 통합 포인트 추가 (Canonical/Logging/Playbook/Wiring + Schema 예시)

## 2026-02-10 — Doc Hotfix (label registry)
- (정합성) `00_INDEX_LATEST.md`에 **WIRING 라벨 레지스트리(A0 예약표)** 추가: 라벨/포인터 충돌 재발 방지용.
- (정합성) `WIRING_INTEGRATION_MAP.md`: CSB 결합 포인트 라벨을 **A0i**로 정리(SketchPad=A0g와 중복 제거). 스키마/계약 변경 없음.


## 2026-02-05 — r20.1p4p14
- (정합성) SSOT_SCHEMA_BUNDLE: `SSOT_SCHEMA_BUNDLE.zip ▸ examples/analysis_event_flat.example.json`의 `event_time_status` 값이 enum 밖(`observed`)으로 남아 있던 잔여 1건을 `ASSUMED_OBSERVED`로 보정(스키마/계약 변경 없음).
- (정합성) SSOT_LOGGING_POLICY: `PULSE_TRIGGER.payload` 관례값을 `workspace_refresh` 중심으로 통일하고, `workspace_update`/`boundary_close_sample`/`anomaly_boost`를 legacy alias로 명시(스키마 확장 없음).
- (논문 이식) Meta-WM(working memory) 신호 이식: PFC의 multi-component metacog(기억 강도/불확실성/히스토리/각성) → `wm_meta.meta_wm_hat`로 요약, Metacog(MUSE-lite)에서 opt-out(VERIFY/RETRIEVE/ASK) 게이트로 사용(권장).
- (문서) Canonical §5.7.3b(Meta-WM gate), Playbook §3.2.4(Meta-WM 레시피), Logging §9.1(wm_meta 권장 키), Sidecar §2.2a 슬롯, Wiring A0c 포인터 추가.
- (번들) SSOT_SCHEMA_BUNDLE metacog 예시 3종(event_COMPETENCE_ASSESSMENT/event_STRATEGY_SELECTION/event_METACOG_CYCLE_END)에 optional key(`wm_meta`, `wm_dependency_hat`, `wm_meta_used`) 추가(스키마/계약 변경 없음).

## 2026-02-05 — r20.1p4p12
- (AVR) 평가/정산 루틴 추가: OPS_PLAYBOOK §9.7에 remaining_steps_hat/cost_hat 오차(회귀) + competence 확률 캘리브레이션(Brier/ECE) + Rubric/AuxMove ROI 템플릿을 고정.
- (AVR) 최소 어블레이션 세트 명문화: avr_baseline/value/value_cost/value_rubric/value_aux/full + ablation_id/toggle_map 메타 고정(비교/회귀용).
- (Logging) SCORE_REPORT에 eval_suite_id/judge_config_hash/build_id/ablation_id/toggle_map 및 AVR 요약 스칼라를 넣는 운영 포인터 추가(스키마 확장 없음).
- (정합성) SSOT_SCHEMA_BUNDLE 예시 정규화: event_time_status enum(ASSUMED_OBSERVED/UNKNOWN)으로 통일 + PROBE_RUN_END 예시의 payload.compressed_bytes 누락 보완. 스키마/계약 변경 없음.

## 2026-02-05 — r20.1p4p11
- (AVR) OPS_PLAYBOOK/WIRING/MODULE 문서에 “실제 운용 레시피” 추가: Metacog에서 `remaining_steps_hat`/`cost_hat`를 SelectionPolicy에 반영하는 식, AuxMove(=Intervention `candidate_injection`) 템플릿 스타터팩, RubricScorer→`RUBRIC_REPORT`→TraceCapsule 커밋 게이트(τ_v/τ_e) 포인터.
- (정합성) `τ_stop`/EVC 독립, SRF 블랙리스트, Intervention 셔플 불변성 테스트가 AuxMove에도 그대로 적용됨을 명문화.

## 2026-02-05 — r20.1p4p10
- (AVR) Metacog 후보 로깅 확장: `remaining_steps_hat`, `cost_hat.{tokens,tool_calls,latency_ms}` 옵션 키 추가
- (AVR) `RUBRIC_REPORT` 이벤트 계약 + 예시 추가(후보/산출물 다축 채점, Control/View)
- (정합성) metacog 예시 3종(event_COMPETENCE_ASSESSMENT/event_STRATEGY_SELECTION/event_METACOG_CYCLE_END)을 event_log.schema.yaml 형식(3중 시간 등)으로 갱신
- (번들) SSOT_SCHEMA_BUNDLE 갱신: bundle_id=20260205, version=r20.1p4p10
- (문서) SSOT_CANONICAL/SSOT_LOGGING_POLICY 헤더 및 패치 노트 업데이트
## 2026-02-04 — r20.1p4p9
- NetArch-G(Control/View): MODE_SWITCH/BRIDGE_CALL/GRAPH_MAINTENANCE 이벤트 계약 추가 + STATE_SNAPSHOT.state_core.control_mode_id 추가 + DuckDB netarch views 추가 + 예시 JSON 추가.
- 마감 정합성: SSOT_SCHEMA_BUNDLE 메타(README/manifest) 버전 통일(r20.1p4p9) + STATE_SNAPSHOT.metrics_optional.var 필드 명시(var_profile/sa_rank_hat/var_hat/ri_selfgraph) + 문서 키 표기 `ri_selfgraph`로 통일.
- 호환/미래충돌 방지: (i) MODE_SWITCH ↔ BEHAVIOR_STATE_SWITCH 의미 분리 문서화 + payload.scope(옵션) 추가, (ii) STATE_SNAPSHOT.metrics_optional.var에 `RI_selfgraph` 레거시 별칭 허용 + DuckDB 레퍼런스에서 COALESCE 표준화.

## 0) Doc Hotfix — Schema-bundle pointer normalization (2026-02-03)

**목적:** ChatGPT 프로젝트 폴더 환경에서 문서 유지보수를 쉽게 하기 위해, 스키마 번들 참조 경로를 “버전 박힌 내부 폴더명”에서 분리했다.

- 변경: `augnes_schema_bundle_YYYYMMDD_.../schema/...` → `SSOT_SCHEMA_BUNDLE.zip ▸ schema/...`
- 변경: `augnes_schema_bundle_YYYYMMDD_.../examples/...` → `SSOT_SCHEMA_BUNDLE.zip ▸ examples/...`
- 문서에 경로 표기 규칙을 추가/강화: `00_INDEX_LATEST.md` (Maintenance Notes 섹션 포함)
- 영향 범위: **문서 포인터 표기만 변경** (스키마 번들 내용/계약은 변경 없음)

## 0.1) JIT Construal Loop — Just-in-Time World Modeling (2026-02-04)

**목적:** “작업용 미니 세계모델(Active Set)”을 턴마다 필요량만 증분 로딩하고, LOOKAHEAD(need) → PSGR(retrieval)로 연결해 비용 대비 의사결정 품질을 올린다.

- 스키마 번들: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jit_object.schema.yaml`, `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jit_need.schema.yaml`, `SSOT_SCHEMA_BUNDLE.zip ▸ schema/jit_construal.schema.yaml`
- 이벤트 계약: `SSOT_SCHEMA_BUNDLE.zip ▸ schema/event_log.schema.yaml`의 `JIT_CONSTRUAL_*`
- 운영 문서 포인터:
  - `OPS_PLAYBOOK.md` §3.2.2b (통합 메모)
  - `SSOT_LOGGING_POLICY.md` §12.2(이벤트) / §11.5(WL_jit_*)

> 주의: JIT는 Control/View이다. Evidence/Claim 근거로 승격 금지(포인터만 연결).

## 0.2) JIT Runtime Gating + Analysis Store Views (2026-02-04)

**목적:** JIT Construal Loop를 “항상 켬”이 아니라, **route_tier/자원 압력/진동 국면**에 따라 가성비 있게 켜고 끄며,
`WL_jit_*`를 `SCORE_REPORT`에 **자동으로 채우는 집계 루틴(옵션 A: DuckDB+Parquet)** 을 고정한다.

- 운영 레시피(런타임 gating): `OPS_PLAYBOOK.md` §3.2.2b (Runtime gating v0)
  - Hard disable: τ_stop 발동 / OOM / resource_state 붕괴 / 진동+churn 과다
  - Downshift: 자원 압력↑이면 sim_level/active_set/cycle을 줄이는 방향으로만(업시프트는 보수적으로)

- 집계/자동 채움:
  - `SSOT_LOGGING_POLICY.md` §11.5 (WL_jit_* 집계 규칙) + §12.4.6 (DuckDB 레퍼런스 뷰)
  - 제공 SQL: `SSOT_SCHEMA_BUNDLE.zip ▸ tools/ANALYSIS_STORE_DUCKDB_VIEWS_JIT.sql`
    - `v_episode_jit_covariates`(WL_jit_* 집계) + `v_score_report_enriched`(SCORE_REPORT join)

- 배선도 업데이트:
  - `WIRING_INTEGRATION_MAP.md` (A0h)에 runtime/집계 포인터 추가

## 0.3) Doc Hotfix — File-count ≤10 + Header normalization (2026-02-04)

**목적:** ChatGPT 프로젝트 폴더의 파일 업로드 제한(≤10)을 만족하면서, JIT 관련 포인터/문서 헤더 버전 불일치를 제거한다.

- 파일 수 최적화:
  - Maintenance Notes를 `00_INDEX_LATEST.md`로 병합(별도 파일 없음)
  - DuckDB 레퍼런스 SQL을 스키마 번들로 이동: `SSOT_SCHEMA_BUNDLE.zip ▸ tools/ANALYSIS_STORE_DUCKDB_VIEWS_JIT.sql` (별도 파일 제거)
- 헤더 정규화:
  - `OPS_PLAYBOOK.md`, `SSOT_LOGGING_POLICY.md`, `WIRING_INTEGRATION_MAP.md`의 릴리즈 태그를 `r20.1p4p8`로 정합화
- 계약/스키마 변경: 없음(스키마 번들 내 도구 파일 추가만)

## 1) Brain Compressibility → CompIndex/CompCurve 통합

<!-- SECTION_TAG: PATCHLOG_COMPRESSIBILITY -->
<!-- ROLE: 변경 이력 -->
<!-- SSOT: non-SSOT (history) -->

> **문서 역할:** 변경 이력  
> **SSOT 지위:** non-SSOT (history)  
> **이 문서에서 허용되는 변경:** 무엇이 바뀌었는지 기록. 정의/계약은 상위 SSOT를 참조  
> **상위(업스트림) 기준:** SSOT_CANONICAL.md, SSOT_SCHEMA_BUNDLE.zip  
> **하위(다운스트림) 영향:** 없음  

---


이 패치는 Weaver et al.(2026) **"Quantifying the compressibility of the human brain"**의 핵심 아이디어를
Augnes Local 운영/계측/정책 루프에 **가성비 있게** 이식한다.

- 논문 포인트(요지): “뇌 활동의 의존성(상관/공분산)은 일부만 알아도 대부분의 구조를 설명할 수 있다(=높은 compressibility).”
- Augnes Local 번역(목적): “정답률 향상”이 아니라, **운영 루프가 (A) 너무 반복적** 혹은 **(B) 너무 산만**해지는 방향을
  **저비용 신호(CompIndex)** + (옵션) **구조 곡선(CompCurve)** 로 잡아서, SRF/Downshift/줌인 비용을 배치한다.

---

## 1) 논문 아이디어의 공학적 핵심(정의)

논문은 다변량 시계열의 의존성 구조를 **정규화 엔트로피 곡선**으로 측정한다.

- `x_t ∈ R^N` (예: N개 영역의 활동)
- 공분산 `Σ`가 주어졌다고 할 때, 가우시안 엔트로피는
  - `S(Σ) = (1/2) log |Σ| + (N/2) log(2πe)`
- 독립(대각) 가정: `Σ_ind = diag(Σ)` → `S_ind = S(Σ_ind)`
- 전체 의존성: `S_tot = S(Σ)`
- 어떤 “부분 의존성 집합”만 제약한 최대 엔트로피 모델(가우시안 그래픽 모델)을 `S_G`라고 하면,
  - `S~ = (S_G - S_tot) / (S_ind - S_tot)`  (0=완전 설명, 1=독립과 동일)
- `f` = 제약한 의존성(엣지) 비율(0..1)에 대해 `S~(f)`를 만들고,
  - **Compressibility** `C = 1 - ∫_0^1 S~(f) df`

직관:
- 작은 `f`에서 `S~`가 빨리 내려가면 “소수 의존성만으로 구조가 잘 설명됨” → `C↑` (압축 가능)

---

## 2) Augnes Local 이식 설계(2계층)

### 2.1 Tier-0 (온라인): CompIndex — 바이트 압축 프록시

운영 루프는 매 턴 GGM을 풀지 않는다. 대신 아래 3개를 “질서/반복/드리프트” 프록시로 쓴다.

- `Comp_token_lz`: 최근 N토큰(또는 문장) → 바이트 직렬화 → zlib/gzip 압축 비율
- `Comp_policy_lz`: 최근 K스텝의 `policy_levers`(또는 Δlevers) → 고정 소수점 직렬화 → 압축 비율
- `Comp_et_lz`: 최근 K스텝의 `e_t`/`zt_summary` → int8 양자화 직렬화 → 압축 비율

해석(권장):
- 과압축(비율↓): 반복/루프/고착 가능성 ↑ (RuminationIndex/GateFlip과 함께)
- 저압축(비율↑): 산만/잡음/드리프트 가능성 ↑ (PolicyFlip/CSI/EES와 함께)

정책 연결:
- **Control/View 전용**. SRF whitelist 신호로 τ_stop·쿨다운·route_tier를 조정할 “트리거”로만 쓴다.
- Evidence/Claim에 “근거”로 사용 금지.

### 2.2 Tier-1 (오프라인): CompCurve_glasso_v0 — 구조 곡선

논문 구현(엣지 그리디 + 마스크드 최대엔트로피 GGM)은 가능하지만 비용/복잡도가 있다.
로컬 운영에선 아래가 가성비 최적:

- 입력: `macro_obs_t`(또는 `zt_summary_t`) 시계열, N=16~64 권장
- 방법: GraphicalLasso를 λ 경로로 돌려 **엣지 수(희소도)** 가 달라지는 모델들을 얻는다.
- 각 모델에서:
  - `f` = 비영(非零) off-diagonal precision 비율(엣지 비율)
  - `S~(f)` 계산 → 면적 → `C_glasso`

권장 산출:
- `CompCurve_C_glasso` (0..1)
- `CompCurve_f_at_S50`, `CompCurve_f_at_S10`
- (옵션) shuffle baseline

DigitalTwin 결합:
- `macro_state_id`별로 `CompCurve_*` 요약 → 레짐이 “단지 centroid만 다른지” vs “의존성 구조가 바뀌는지” 분리.

---

## 3) 문서 반영 요약(이번 업데이트에서 실제 반영)

- Canonical Spec:
  - PROBE suite에 `comp_curve_v0` 권장 추가
  - `COMP(Compressibility) 프로브`를 §5.1.1.5로 정식 정의(CompIndex + CompCurve_glasso)
  - SRF whitelist 예시에 `CompIndex_*`, `CompCurve_*` 추가

- Appendix: Metrics & Logging Policy:
  - Rumination 신호 섹션에 `CompIndex` 정의/저장 위치/해석 규칙 추가
  - signals 축 표준에 `Comp_*` + (옵션) `CompCurve_*` 추가

- Implementation Playbook:
  - 설계 패턴 인덱스에 “Compressibility Signals” 추가
  - 로깅 구현 가이드에 `compute_compindex()` + 오프라인 `CompCurve_glasso_v0` 섹션 추가

- Sidecar(QP+z_t Summary):
  - fast trace feature 후보에 `Comp_policy_lz`, `Comp_et_lz` 추가
  - Sidecar 건강 신호 결합 메모 추가(CompIndex/CompCurve의 ‘권한’ 명확화)

- WIRING_INTEGRATION_MAP.md:
  - 6d)로 Compressibility 항목 추가(SRF/DigitalTwin/Memory 연결)

- GNWT×IIT Appendix:
  - PCI-A와 Weaver Compressibility를 “압축 기반 진단”으로 분업하는 관점 추가

---

## 4) 추가 연결/추천(가성비 높은 것만)

1) **Memory 저장 정책 최적화**
- 과압축 구간(반복)에서는: 원본 로그를 줄이고 “요약/해시/포인터” 위주로 저장
- 저압축 구간(산만/이상)에서는: 원본 보존 우선(회귀/디버깅 가성비)

2) **Self-Graph / Influence 후보 추출(설명용, Evidence 금지)**
- CompCurve(또는 Glasso precision)의 “강한 연결”을 **설명 후보**로만 노출(“이 변수가 저 변수랑 엮여있다” 수준)
- 정책 결정 근거로 직접 인용하지 말고, “확인할 목록”으로만 사용

3) **KJEPA 레짐 품질 체크**
- 레짐 분해가 잘 됐으면, 레짐별 CompCurve 프로필도 달라지는 경우가 많다.
- 레짐은 다른데 CompCurve가 완전히 동일하면 “경계 기준이 피상적”일 가능성이 있으니 점검.

---

## 5) 구현 체크리스트(정말 최소)

- [ ] `STATE_SNAPSHOT.payload.metrics_optional.comp_index.*` 3종을 계산/기록한다(길이 하한 포함)
- [ ] signals 축에 `Comp_token_lz`, `Comp_policy_lz`, `Comp_et_lz`를 뽑는다
- [ ] SRF에서 CompIndex를 “단독”으로 쓰지 않고 Rumination/Flip/CSI/EES와 조합한다
- [ ] (옵션) 하루/주 1회: macro_state별 `CompCurve_glasso_v0`를 오프라인으로 돌려 요약을 남긴다

---

## 2) Koopman Invariant JEPA(KJEPA) → macro_state / DigitalTwin / PROBE / Logging

<!-- SECTION_TAG: PATCHLOG_KJEPA -->
<!-- ROLE: 변경 이력 -->
<!-- SSOT: non-SSOT (history) -->

> **문서 역할:** 변경 이력  
> **SSOT 지위:** non-SSOT (history)  
> **이 문서에서 허용되는 변경:** 무엇이 바뀌었는지 기록. 정의/계약은 상위 SSOT를 참조  
> **상위(업스트림) 기준:** SSOT_CANONICAL.md, SSOT_SCHEMA_BUNDLE.zip  
> **하위(다운스트림) 영향:** 없음  

---

이 패치는 arXiv:2511.09783(AAAI 2026) *"Koopman Invariants as Drivers of Emergent Time-Series Clustering in Joint-Embedding Predictive Architectures"*의 핵심 메커니즘을
Augnes Local의 **SSM-lite(digital twin)** / **macro_state_id** / **BSL change-point** / **PROBE & logging**에 “로컬에서 돌아가는 형태”로 이식한다.

---

## 핵심 추가점(요약)

- **KJEPA(koopman_jepa_v0)**: `macro_obs_t` 시퀀스에서 무감독으로 **레짐(regime) 불변량(=Koopman eigenvalue 1 축)** 을 뽑아,
  자연스럽게 클러스터(=macro_state)가 형성되도록 하는 오프라인 파이프라인.
- **near-identity predictor 유도(M≈I)**: indicator가 선형 혼합으로 얽히는 동치해를 피하고,
  해석 가능한 레짐 분리를 얻기 위한 핵심 인덕티브 바이어스(정규화/제약).
- **PROBE/Logging 결합**: invariance/separation/identity/spectral_radius/entanglement 핵심 지표를 표준화해
  “클러스터가 왜 생겼는지”를 운영 차원에서 감시 가능하게 함.

---

## 변경된 문서

1) `SSOT_CANONICAL.md`
- DigitalTwin 절에 **KJEPA 기반 macro_state 학습 규약/주의/PROBE** 추가.
- `macro_state_method="koopman_jepa_v0"` 사용 규약 명시.

2) `OPS_PLAYBOOK.md`
- (당시 기준) KJEPA 오프라인 업데이트 파이프라인을 운영형으로 상세화.
- `FINETUNE_RUN_START/END` 이벤트를 “학습 런 공통 포맷”으로 재사용하는 방법 명시.

3) `SSOT_LOGGING_POLICY.md`
- DigitalTwin 계약에 `digital_twin.koopman.*` 확장(선택) 및 권장 PROBE/이벤트 사용법 추가.

4) `WIRING_INTEGRATION_MAP.md`
- DigitalTwin/옵션A(파생 분석 스토어) 연결에 **KJEPA 오프라인 업데이트** 포인트 추가.

5) `MODULE_SIDECAR_QP_ZT_SUMMARY.md`
- Sidecar ↔ SSM-lite 연결 메모에 KJEPA 적용 시 남겨야 하는 포인터와 change-point 트리거 해석을 추가.

6) `APPENDIX_GNWT_IIT.md`
- GNWT/IIT 이식과 **레짐 분해(상태공간 분할)** 가 독립 레이어임을 짧게 명시하고, macro_obs에 포함 가능함을 연결 메모로 추가.

---

## 스키마 번들

- `SSOT_SCHEMA_BUNDLE.zip`
  - `SSOT_SCHEMA_BUNDLE.zip ▸ schema/digital_twin.schema.yaml`에 `koopman` 확장 필드(선택) 추가.
  - 예시: `FINETUNE_RUN_START/END`에서 `method="koopman_jepa_v0"` 사용 예제 추가.

---

## 호환성/리스크

- KJEPA는 **오프라인(옵션 A) 전용**으로 규정. 온라인 루프에 끼우지 않는다.
- `M≈I` 유도(정규화/제약) 없으면 레짐 indicator가 섞이는 얽힘이 발생할 수 있으므로,
  `identity_penalty`/`spectral_radius`/`entanglement_score`는 “선택”이 아니라 사실상 필수 감시 항목.
