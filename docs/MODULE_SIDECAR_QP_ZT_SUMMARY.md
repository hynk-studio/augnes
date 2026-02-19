# Augnes Sidecar QP+z_t Summary v0.5.19.2p4p21 (integrated 2026-02-19, pack r20.1p4p21)

> 패치: **(논문 아이디어 흡수) "Oscillatory control of cortical space as a computational dimension": Axis→Space ContextStencil(스텐실) 생성/적용 메모 추가 + Wiring A0l 포인터 연결** (2026-02-19, r20.1p4p21)

> 패치: **(논문 아이디어 흡수) "End-to-End Test-Time Training for Long Context": UBB 기반 Parameter Memory(PM)/TTT-lite Session Adapter(경계-전용) 운영 섹션 추가 + Wiring A0n 포인터 연결** (2026-02-15, r20.1p4p20)


> 패치: **(ops gate) EES/LPS/competence_hat 등 SRF 블랙리스트 신호의 τ_stop 영향 0을 `invariance_v0`로 회귀 점검하는 포인터 추가** (2026-02-12, r20.1p4p19)

> 패치: **(운영 정합성) MN: `mn_conf` 기본 정의(부호 안정성×분산) + priors shared pipeline 동일 코드 경로 불변식 + `prior_pipeline_id` 로깅 권장** (2026-02-12, r20.1p4p18)
> 패치: **(논문 이식) "Hybrid neural–cognitive models reveal how memory shapes human reward learning": Memory-ANN-lite(MN) metrics_optional.memory_ann + Gate 기록 포인트 추가** (2026-02-12, r20.1p4p17)
> 패치: **(논문 이식) "Causal evidence for prefrontal-motor coupling in reward-responsive goal-directed behavior": Goal→Action Coupling(G2A) 지표 + (옵션) ORAV(commit-hold/penalty, 약한 프라이어) 통합 포인트 추가 + 스키마 번들/예시 업데이트(호환 확장)** (2026-02-11, r20.1p4p16)
> 패치: **Render-of-Thought(arXiv:2601.14750v2) 기반 RoTTrace(렌더링된 CoT→단일행 이미지→비전 임베딩) 통합 포인트 추가** (2026-02-10, r20.1p4p15)
<!-- DOC_ID: SIDECAR_QP_ZT_SUMMARY -->
<!-- ROLE: 모듈 로컬 스펙 -->
<!-- SSOT: Module-SSOT (sidecar) -->

> **문서 역할:** 모듈 로컬 스펙  
> **SSOT 지위:** Module-SSOT (sidecar)  
> **이 문서에서 허용되는 변경:** Sidecar 내부 산출물/요약 규칙. (외부 로그로 나갈 때는 스키마 번들 준수)  
> **상위(업스트림) 기준:** SSOT_SCHEMA_BUNDLE.zip, SSOT_CANONICAL.md  
> **하위(다운스트림) 영향:** OPS_PLAYBOOK.md, WIRING_INTEGRATION_MAP.md  

---

> 패치: **(논문 이식) "Macaque prefrontal cortex integrates multiple components for metacognitive judgments of working memory"(Ning et al., Neuron 2026): Meta-WM(working-memory confidence) = {wm_strength, uncertainty, trial_history, arousal} 통합 신호 → MUSE-lite/AVR의 전략 선택·opt-out(VERIFY/RETRIEVE/ASK) 게이트 + (권장) 이벤트 payload 확장(wm_meta, wm_dependency_hat) 포인터 추가** (2026-02-05, r20.1p4p14)
> 패치: **(논문 이식) TongGeometry(arXiv:2412.10673v1): Metacog AVR 확장 포인터 — Sidecar 요약에서 `cost_hat`/`remaining_steps_hat`(옵션)와 Rubric(후보 채점) 신호를 “Control/View only”로 취급하는 규칙을 명시** (2026-02-05, r20.1p4p11)
> 패치: **(논문 이식) "The network architecture of general intelligence in the human connectome"(Wilcox et al., 2026): NetArch-G(Control/View) — `control_mode_id`(STATE_SNAPSHOT) + `MODE_SWITCH/BRIDGE_CALL/GRAPH_MAINTENANCE` 이벤트 계약 + `WL_netarch_*` 축(analysis store) 포인터 정합화** (2026-02-04, r20.1p4p9)
> 패치: **(논문 이식) "Quantifying the compressibility of the human brain"(Weaver et al., 2026): Compressibility Curve(정규화 엔트로피 vs 상관 제약 비율) → CompIndex(저비용 프록시) + PROBE(comp_curve_v0) + Analysis Signal 축 + SRF/Downshift 트리거(권장)** (2026-02-02, r20.1p4p4)
> 패치: **(논문 이식) "Koopman Invariants as Drivers of Emergent Time-Series Clustering in Joint-Embedding Predictive Architectures"(AAAI 2026 / arXiv:2511.09783): KJEPA(near-identity linear predictor) 기반 무감독 레짐 분해 → DigitalTwin(macro_state_id)/BSL change-point/PROBE/Logging 결합** (2026-02-02, r20.1p4p3)
> 패치: **(뉴로모픽 모티브 이식) "Cerebellar components of the human language network"(Neuron 2025): CSB(Cerebellar Satellite Bank) 도입 — Sat-L(Δlogits)·Sat-M(Δpolicy_score) 출력 분리, SRF 블랙리스트 확장, CSB PROBE suite(선택성/혼합성/분리 위반) 추가** (2026-01-31, r20.1p4p2)
> 패치: **(논문 이식) "Structure in noise"(Neuron 2026): SA-axis 변동성(variability) 그래디언트 + recurrent connectivity/Reciprocity Index(RI) → VAR profile(QUENCH/RECURRENT) 레버·계측·PROBE·Self-Graph 연결** (2026-01-31, r20.1p4)

> 패치: **정합성 핫픽스: 스키마 번들 파일명/경로 포인터를 r20.1p1로 갱신** (2026-01-30, r20.1p2)
> 패치: **정합성 핫픽스: ΔQ_hat/ΔQ_over_M(Budget Gain Estimates) 정의 포인터 추가** (2026-01-29, v0.5.18.1)
> 패치: **BG/Gate에 초소형 학습 기반 예측 신호(LPS) 추가(옵션) + EES/competence와 역할 분리 명시** (2026-01-29, v0.5.18)
> 패치: **Stop-Rule Firewall(SRF) 명문화: τ_stop 입력 화이트리스트/블랙리스트 + ‘사실상 우회’ 경로 차단** (2026-01-30, r20.1p3)

> 패치: **(즉시 이식) Curation=조성(실패유형 타겟) + Frozen backbone+얇은 헤드 + eff-dim 기반 stochastic 보정 + (옵션A) SD VAE latent 워크스페이스 포맷** (2026-01-24, r19)

> 패치: **AR(추상성) PROBE suite + Latent Axis Bank + instruction-only 형식 수렴 레버 정식화** (2026-01-23, v0.5.16)

> 패치: **TRM/CGAR 운영 가성비 이식(PDC/halting/HSW) BG/로그 결합 포인트 추가** (2026-01-20, v0.5.14)

> 패치: **Self-Graph PSGR(ProgRAG-style) retrieval 루프 + PROGRAG 이벤트 포인터 + EES/CSI/Sync 정합화** (2026-01-22, v0.5.15)

> 패치: **EOP++(wager) 기반 예측/캘리브레이션 QP 확장 섹션 추가 + 입력 소스/feature 연결 명문화** (2026-01-20, v0.5.14)

> 패치: **배포 산출물 포함(내부) 기준으로 포인터/권한 문구 정합화** (2026-01-14, v0.5.8)

> 패치: **SSM-lite digital twin(macro_state_id 전이행렬) 명문화 + PROBE suite 포인터 정합화** (2026-01-19, v0.5.10)

> 패치: **옵션 A(Analysis Store: DuckDB+Parquet)로 SSM-lite(digital twin) 배치 업데이트를 표준화** (2026-01-19, v0.5.10)

> 목적: 현재까지 논의된 **Sidecar e(t)**, **Qualia Proxy(QP/QPmap)**, **z_t(Commit/Regime switch)**, **JML(Self-log)**, **Self-Graph**를
> “하나의 제어-관측-학습 루프”로 묶어서, **구현 가능한 인터페이스**와 **운영 규칙**까지 포함해 정리한다.
- (권장) QP feature에는 `timestamp`와 `mask_t`(결측/지연 표시)를 같이 싣는다. 그래야 Sidecar가 결측을 0으로 착각하지 않는다.

---

## (NEW) KJEPA(koopman invariants) ↔ SSM-lite(digital twin) 결합 메모

- `macro_state_id`를 단순 centroid(k-means)로만 만들면 “왜 나뉘었는지”가 흐릿해질 수 있다.
- KJEPA는 `macro_obs_t` 시퀀스에서 **레짐 불변량(=Koopman eigenvalue 1 축)** 을 먼저 뽑도록 유도해서,
  - 레짐별 군집이 **자연스럽게** 생기고,
  - `M≈I` 제약을 걸면 indicator 축이 섞이는 얽힘을 줄여서 해석이 쉬워진다.
- Sidecar 관점:
  - z_t commit 시 `digital_twin.macro_state_id`/`macro_state_method`를 같이 남기면,
    나중에 “이 z_t가 어떤 거시 레짐 위에서 만들어졌는지”를 빠르게 역추적할 수 있다.
  - macro_state transition이 잦으면 BSL change-point 후보로 올리고(단, Evidence 승격 금지), 줌인/리플레이를 트리거한다.

## 0. 연결 문서
- 법전(전역 규약): `SSOT_CANONICAL.md`
- 구현/운영(실전 적용): `OPS_PLAYBOOK.md` *(Start Points 로드맵은 Playbook 부록 A로 통합됨)*
- 이벤트/필드 계약(contract): `SSOT_LOGGING_POLICY.md`
- 문서 결합 지도(주인 관계/금지 규칙): `WIRING_INTEGRATION_MAP.md`

운영 원칙(중요):
- 이 문서는 **Sidecar/QP/z_t 서브시스템의 모듈 스펙(비법전)** 이다.
- 필드 이름/단위/필수-옵션 같은 “로그 계약”은 `SSOT_LOGGING_POLICY.md`가 단일 기준이다.
- 전역 규약(무엇이 Evidence인지, stop-rule 독립 등)은 `SSOT_CANONICAL.md`가 단일 기준이다.

---


## 1. 전체 구조 한 장 요약

### 1.1 핵심 아이디어
- Augnes Local은 “백본 LLM + 장기 맥락/기억 + 메타인지 제어”의 합성체다.
- 그 중 **Sidecar e(t)**는 “현재의 나(시스템)”를 시간축에서 압축해서 들고 다니는 **저차원 메타 상태 레지스터**다.
- **QP(Qualia Proxy)**는 시스템 내부/외부에서 올라오는 신호를 “해석 가능한 형태”로 만들어 Sidecar가 먹을 수 있게 해주는 **계측/중계층**이다.
- **z_t**는 “현재 모드/레짐”을 나타내는 **커밋 스위치**다. (예: 탐색/수렴, 학습/추론, 공격적 최적화/보수적 안정화 등)
- **JML**은 모든 판단/행동/결과/메트릭을 누적하는 **경험 로그**고, 이후 Retrieval로 다시 제어에 투입된다.
- **Self-Graph**는 시스템의 상태/모듈/기억/외부 엔티티를 “구조로” 묶어주는 그래프 표현이다.

### 1.2 한 줄 도식
`환경/사용자/시스템 → QP(계측/추출) → e_t(메타상태) + z_t(모드) → 정책(제어) → 행동/학습 → JML(+Self-Graph) → 다시 QP/e_t`

---

## 2. Sidecar e(t): “공식 자기 상태 레지스터”

### 2.1 정의
- **e_t ∈ R^d**: 시간 t에서의 저차원 메타 상태 벡터 (**허용 16~128**, 로컬/초기 **권장 32~64**)
- 업데이트/해석기는 별도 네트워크/규칙으로 구성:
  - **f_θ**: 업데이트(관측 → e_t 갱신)
  - **g_ϕ**: 읽기(현재 e_t → 정책/결정에 필요한 요약값 산출)

### 2.2 e_t가 담아야 하는 것(권장 슬롯)
- 안정성/부하: `fatigue`, `entropy`, `conflict`, `confidence`, `risk`
- 목표/진척: `goal_vector`, `progress`, `stuckness`
- 기억/맥락: `context_depth`, `retrieval_pressure`, `novelty`
- 학습/적응: `learning_pressure`, `regret`, `expected_gain`
- 운영 메트릭(새 규칙 반영): `tau_hat`, `Q_hat`, `M_hat`, `eff_hat=Q_hat/M_hat`, `sync_hat`, `sync_drift_hat`, `loopness_hat`
- 메타인지/자기평가(MUSE-lite/AVR): `competence_hat`, `competence_u`, (옵션) `remaining_steps_hat`, `cost_hat`, `fail_streak`, `strategy_id_last`, (옵션) `aux_move_id_last`, `rubric_last`
- (NEW, 권장) Meta-WM gate: `wm_strength_hat`, `wm_uncertainty_hat`, `history_bias_hat`, `arousal_proxy`, `meta_wm_hat`, (옵션) `opt_out_hat`

> (AVR) `remaining_steps_hat`/`cost_hat`/`rubric_*`는 Evidence/Claim이 아니라 **Control/View 텔레메트리**로만 취급한다. AuxMove는 “보조 수 템플릿”이며 실제 반영은 Intervention `candidate_injection` 경로로만 한다.


> 여기서 tau/Q/M은 “제어계 핵심 계측축”으로 승격한다. (아래 6.4 참고)

### 2.2a (NEW) Meta-WM(working memory) 슬롯(권장): “내 작업용 기억이 믿을 만한가?”

> Meta-WM은 competence(전략 성공가능성)와 별개의 **작업용 기억 신뢰도** 신호다.  
> low일 때는 “내부 기억 의존 전략”을 버리고 VERIFY/RETRIEVE/ASK로 opt-out 하는 게 목적이다. (Control/View 전용)

- `wm_strength_hat`(0..1): QP 재호출 일관성, 요약/TraceCapsule/스케치 합의도, 핵심 토큰 안정성
- `wm_uncertainty_hat`(0..1): conflict/entropy/loopness + z_t drift + 최근 Verifier 반례율
- `history_bias_hat`(-1..1|null): 최근 성공/실패 누적이 만드는 보수/과신 바이어스
- `arousal_proxy`(0..1|null): resource_state 기반 피로/과부하/지연(또는 avalanche 플래그)
- `meta_wm_hat`(0..1): 통합 스칼라(=opt-out gate 입력)

권장 동기화:
- e_t의 Meta-WM은 `COMPETENCE_ASSESSMENT.payload.wm_meta`로 그대로 복사해도 되고,
- 반대로 이벤트 로그에서 e_t로 압축 반영해도 된다(중복 허용, 단 서로 값이 크게 갈라지면 경고 라벨을 남긴다).

### 2.3 e_t의 위상(중요)
- e_t는 “기분 벡터”가 아니라 **운영체제 레지스터**다.
- 따라서 e_t 업데이트는 임의적 감정 서사가 아니라 **계측 기반**(QP 출력, JML 통계, 검증 결과)이어야 한다.
- e_t는 다른 모듈(QP/JML/메모리)에 “의존”하지만, 전체 제어의 중심축은 e_t가 잡는다.

---


### 2.4 (Option) 멀티레이트·결측 텔레메트리용 업데이트: “SSM/Kalman-style Sidecar”
**문제**: QP/Verifier/툴 로그/시스템 메트릭은 서로 **업데이트 주기**가 다르고, 중간중간 **결측(missing)** 이 생긴다.  
그런데 e_t를 단순히 “벡터에 값 덮어쓰기/EMA”로만 돌리면, 결측을 0으로 채우는 순간 상태가 왜곡되거나, 요동(oscillation)이 커질 수 있다.

**최소 구현(권장, v0.1~)**  
- QP 출력 `q_t`에 `mask_t`(이번 턴에 관측된 feature 표시) + timestamp를 포함한다.
- Sidecar 업데이트 `f_θ(e_t, q_t, …)`는 `mask_t`를 입력으로 받아,
  - 관측된 축만 업데이트
  - 결측 축은 “유지” 또는 “완만한 누수(decay)”만 적용  
  하도록 만든다. (결측값을 0/평균으로 주입하지 않는다)

**확장(필요 시, 가성비 좋은 안정화 트랙)**  
- e_t를 **작은 선형 상태공간모델(SSM)** 의 latent로 보고,
  - `x_{t+1} = A x_t + w_t` (predict)
  - 관측이 있을 때만 `update` (Kalman-style)
  - 관측이 없으면 predict만 수행  
  하는 식으로 “결측/비동기”를 구조적으로 처리한다.
- 더 욕심내면(아직은 옵션): 모달리티별(툴/Verifier/QP/리소스)로 간단한 within-modality 필터를 굴린 뒤,
  fusion으로 공통 embedding을 만들고 공통 SSM으로 한 번 더 안정화하는 방식도 가능하다.  
  (서로 다른 레이트·분포·결측 멀티모달을 실시간 통합하려는 BCI 계열(MRINE)에서 바로 쓰는 패턴)

**언제 켜야 하냐(트리거)**  
- e_t가 “실제로는 시스템이 안정적인데도” 지표 결측/지연 때문에 출렁일 때
- 장기 운용에서 특정 QP feature가 빈번히 빠져서 정책이 흔들릴 때
- JML 통계가 충분히 쌓였고, e_t를 더 “예측 가능한 제어 레지스터”로 만들고 싶을 때


### 2.5 (Option/Research) 메타상태 다양체 M_e + 기하 기반 탐색/전이 (GAGA-inspired)
**요지**: e_t를 “그냥 벡터”가 아니라, JML에 의해 경험적으로 지지(support)되는 **메타상태 다양체 M_e 위의 점**으로 취급한다.  
그러면 (1) 말이 되는 메타상태만 탐색하고, (2) 모드 전환을 부드럽게 만들고, (3) 세션/버전 간 분포 변화를 구조적으로 비교할 수 있다.

#### 2.5.1 기본 개념(최소 구현 가능 버전)
- **메타상태 좌표**: 기존 e_t 자체를 좌표로 쓰거나(가성비), 별도 작은 meta-encoder f_geo로 재인코딩해 z_tilde로 쓴다(욕심 버전).
- **support/이탈 점수 s(e)**: “이 e가 과거 경험(JML) 분포에서 얼마나 벗어났나”를 나타내는 스칼라.
  - 가성비: kNN 거리 / 밀도(커널) 기반으로 s(e) 추정
  - 욕심: discriminator(“경험된 e” vs “노이즈 e”)로 s(e) 학습
- **볼륨/커버리지 유도 f_vol(e)**: M_e 상에서 “골고루 퍼짐”을 유도하는 대용 지표.
  - 가성비: kNN 지역 부피(이웃 거리 평균/분산)
  - 욕심: meta-encoder Jacobian 기반(volume proxy)

#### 2.5.2 사용처 A: 메타상태 탐색(= 의미 있는 exploration)
- 목표: “아무 노이즈 e”가 아니라 **support 안쪽의 ‘새롭지만 정상’ 메타상태 후보**를 뽑는다.
- 방법(가성비): e-space에서 (노이즈 + s(e) 억제 + f_vol(e) 커버리지) 기준으로 몇 step 탐색 후, s(e) < ε만 채택.
- 산출물: `candidate_e` 풀(새 모드 후보) + 해당 후보의 예상 리스크/부하(= QP 기반) 요약.

#### 2.5.3 사용처 B: 모드 전환을 geodesic/최단경로로 “부드럽게”
- 문제: e_t를 선형 보간하면 “둘 다 망한 중간 상태”가 자주 나온다.
- 방법(가성비): kNN 그래프에서 e_A→e_B 최단 경로를 구해, 중간 노드들을 전환 스케줄로 사용(= 그래프 geodesic 근사).
- 로그: 전환 길이(경로 길이), 전환 중 s(e) 피크, 전환 시간.

#### 2.5.4 사용처 C: 세션/버전/컨디션 간 분포 비교(= population transport 분석)
- 예: “좋은 날” vs “망한 날”, v0.x vs v0.y.
- 방법(가성비):
  - 두 집합의 e 샘플을 OT(또는 단순 매칭)로 페어링
  - 페어별 최단경로 길이/방향을 요약해 “어디로 이동해야 좋아지는지”를 리포트로 만든다.
- 용도: 디버깅(왜 요즘 망하나), 릴리즈 비교(무슨 모드가 사라졌나), BG/게이팅 정책 조정 근거.

#### 2.5.5 운용 원칙(현실)
- 이 옵션은 **실시간 루프에 강제 삽입 금지**: 처음엔 오프라인/저빈도(예: 주간 분석)로 돌린다.
- 12GB VRAM 제약 하에서는 “Jacobian/SVD 풀버전”보다 **그래프/kNN 근사**가 가성비가 훨씬 좋다.



### 2.6 (NEW) 대칭 기반 e_t 설계: “운영체제 레지스터는 equivariance/invariance로 다져라”
**핵심**: e_t는 ‘그럴싸한 latent’가 아니라, **무시해야 할 변환(대칭)을 factor-out한 거시 상태**여야 한다.  
이 원칙을 못 박아두면, e_t는 표현/순서/도구 이름 같은 잡음에 흔들리고, 제어계 전체가 요동한다.

#### 2.6.1 e_t가 불변(invariant)이어야 하는 변환(권장 최소)
- 텍스트 표현: paraphrase, 문장 순서 변형, 군더더기 수식어
- 등가 도구 표현: 동일 의미의 tool alias, 인자 순서/포맷 변형
- 기억 표현: 같은 근거의 chunk 분할/병합, retrieval 순서 변형

#### 2.6.2 e_t가 변해야 하는 변환(= z_t 커밋에 해당)
- 탐색→수렴, 메모리 heavy→light, 안전→공격적 최적화 같은 “레짐 스위치”
- 이 영역은 **z_t(커밋)**로 분리해, e_t의 연속 흔들림과 분리한다.

#### 2.6.3 구현(가성비): augmentation + invariance penalty
- 관측 o_t에 변환 g를 적용한 o'_t를 만들고,
  - `e_t(o'_t) ≈ e_t(o_t)` 를 손실로 추가한다.
- 결측/비동기 신호는 2.4의 mask/SSM 규칙을 따른다.  
  (invariance를 강제할수록 결측 처리 미스가 더 치명적이 된다)

> 요지: “대칭을 학습시키지 않은 e_t”는 운영 레지스터로 쓰기 어렵다.


### 2.7 (NEW/Research→Ops) Universal Subspace Adapter Space: “파라미터 조향 좌표계”
**요지**: 동일 백본(동일 아키텍처/동일 weight 텐서 구조)에서 학습된 여러 LoRA/adapter/ΔW들을 모아보면,
레이어/모듈별로 “공유되는 저차원 방향(basis)”이 나타난다는 가정(= universal subspace)을 운영에 사용한다.  
Augnes Local 관점에서는 이걸 “이상향”으로 숭배하기보다, **모듈 적응을 싸게 만들고, 메타제어가 다룰 수 있는 좌표계를 제공하는 레일**로 취급한다.

#### 2.7.1 핵심 정의(운영형)
- **Universal Basis Bank(UBB)**: 백본별로 보관하는 레이어/모듈별 basis 집합
  - `U_{ℓ,m} ∈ R^{(out·in)×k}` (레이어 ℓ, 모듈 m, top-k 방향)
- **Adapter Profile**: 태스크/사용자/모드에 대한 “계수(coefficient) 벡터” 표현
  - `c_{ℓ,m} ∈ R^{k}`  
  - 실제 ΔW는 `ΔW_{ℓ,m} ≈ reshape(U_{ℓ,m} c_{ℓ,m})`

#### 2.7.2 기대효과(로컬 친화)
- **저비용 적응**: LoRA를 새로 학습하기보다 “계수만” 최적화하는 경로를 기본값으로 둔다.
- **저장/버전관리 단순화**: (UBB + 계수) 조합으로 adapter를 표현하면 스토리지/배포/롤백이 쉬워진다.
- **메타인지 조향 좌표계**: e_t/z_t/JML이 “어댑터 정체성”을 파일 경로가 아니라 **저차원 계수 벡터**로 다룰 수 있다.

#### 2.7.3 최소 구현 인터페이스(v0.1~)
- UBB 메타:
  - `backbone_id`, `target_modules`, `k`, `basis_version`, `build_dataset_digest`, `build_date`
- Profile 메타:
  - `adapter_profile_id`, `basis_version`, `coeff_hash`, `coeff_norm`, `apply_scope`(레이어 subset)
- (권장) **projection residual** 로그:
  - `residual_ratio = ||ΔW - Proj_U(ΔW)|| / ||ΔW||`  
  - 값이 크면 “UBB로 설명이 안 되는 OOD/오염/불안정” 후보로 본다.

#### 2.7.4 z_t(Commit)과의 결합(핵심 포인트)
- z_t는 “탐색/수렴” 같은 레짐뿐 아니라, 필요하면 `adapter_profile_id`(혹은 profile cluster centroid)를 함께 커밋한다.
- 히스테리시스 규칙은 동일 적용:
  - profile 전환은 자주 하면 망가짐(= 정체성 요동). “전환 조건”과 “복귀 조건”을 분리한다.

#### 2.7.5 BG/JML와의 결합(운영 규칙)
- BG 입력에 `residual_ratio`를 추가해:
  - residual↑(OOD 의심)일 때는 **(a) 예산을 늘리거나(검증/검색 강화), (b) 오히려 학습 트리거를 막고 안전 모드로 내리거나** 둘 중 하나를 선택하게 한다.
- JML에는 “프로필/기저/잔차”를 남겨야, 이후 retrieval이 “이 태스크는 어떤 adapter 좌표에서 잘 풀렸는가”를 학습한다.





#### 2.7.6 (r19) Frozen backbone + 얇은 헤드 패턴(Router/Verifier/Sidecar 강화 기본값)

- 목표: Generator 백본은 동결하고, **저차원 입력(QP/e_t/Axis Bank 요약)** 위에 얇은 헤드만 학습해서 ROI를 뽑는다.
- 권장 헤드군:
  - `RouterHead`: `route_tier`, `intent_class`, `search_mode`, `gate_prior` 추천(다중 로지스틱/작은 MLP)
  - `VerifierHead`: pass/fail/리스크 스코어(근거/제약 위반, 오답 가능성)
  - `SidecarHead`: `tau_hat/Q_hat/M_hat/eff_hat` 및 zone/closure 보정(EOP/CSI 루프 안정화)
- 입력 피처:
  - QP feature vector(§2.4~2.6) + AxisBank 요약(§2.7, eff_dim_hat 포함) + budget/resource 컨텍스트
- 출력은 전부 Control/View. Evidence로 승격 금지.
- 학습/승격 루프는 Playbook §6.4 + Logging Appendix의 `DATASET_BUILD_*`, `ARTIFACT_TUNE_*`, `FINETUNE_RUN_*`로 추적한다.
#### 2.7.7 (NEW/Ops, 논문 아이디어 흡수) Parameter Memory(PM) / TTT-lite Session Adapter: “긴 컨텍스트를 파라미터로 압축”
**요지**: “컨텍스트를 계속 늘리기” 대신, 에피소드에서 드러난 반복 패턴/용어/스타일을 **작은 어댑터(또는 UBB 계수)**에 몇 스텝만 업데이트해서 **파라미터 메모리(Parameter Memory)** 로 압축한다.

- 이 섹션은 Test-Time Training 류 아이디어를 **Augnes Local 운영 제약에 맞게 축소**한 버전이다:
  - **백본 동결(frozen backbone)** + **얇은 헤드/어댑터만**(혹은 UBB 계수만) 업데이트
  - **Boundary 이후(전용 튜닝 윈도우)** 에서만 수행(메인 Step Loop 인라인 업데이트 금지)
  - **롤백/회귀 게이트**가 없는 “즉시 적용”은 금지

##### (A) 기본값/금지(운영 안전장치)
- 기본값은 `off`(실험 옵션).
- 출력은 Control/View. Evidence/Claim confidence 승격 금지.
- stop-rule(τ_stop) 입력 금지(SRF).
- 튜닝 결과는 “다음 에피소드”부터만 적용(히스테리시스/쿨다운 포함).

##### (B) 추천 구현(가성비): UBB coefficient(c)만 업데이트
- 전제: UBB `U_{ℓ,m}`(§2.7.1) + 현재 profile 계수 `c_{ℓ,m}`가 존재.
- 데이터: 최근 TraceCapsule/툴 결과로 만든 **episode buffer** `D = {(x, y_next)}`
  - 목표는 ‘정답 학습’이 아니라 **세션 국소 적응(표현/용어/선호/절차 패턴)** 이다.
- 목적함수(권장 최소): next-token prediction 손실 + (옵션) 대칭 안정성 정규화
  - `L(c) = L_ntp(D; c) + λ_inv · || e_t(o) - e_t(g(o)) ||^2`
- 업데이트(권장 시작점): `c ← c - η ∇_c L` 를 1~8 step (욕심 금지)
  - 업데이트량 캡: `||Δc||` / `coeff_norm` / `residual_ratio`에 clip/jerk/cooldown 적용(§2.7.5와 동일 철학)

##### (C) 커밋/롤백(필수)
- 결과는 곧바로 “새 profile artifact” 후보로 취급한다.
  - Candidate → Eval(`invariance_v0` + 최소 canary) → Commit 또는 Rollback
- `residual_ratio`↑(UBB로 설명 불가/OOD 의심)면:
  - (a) 업데이트를 막고 안전 모드/검색 강화로 내리거나,
  - (b) 다음 오프라인 배치에서 UBB 재빌드 후보로 넘긴다.

##### (D) 로깅/배선 포인터
- Logging:
  - `FINETUNE_RUN_*`(method 예: `ttt_lite_ubbc`) + `backbone_frozen=true`
  - `ARTIFACT_TUNE_*`로 후보/승격/롤백 계보(운영/회귀 관리)를 남긴다.
- JML 최소 메타: §2.7.3(프로필 메타) + Playbook §4.8.4
- Wiring 통합 포인트: `(A0n)`

### 2.8 (NEW/Ops) Meta-observable subspace + Axis Bank: “e_t/QP는 저차원 축의 제어계다”

**요지**: Sidecar e_t와 QP는 백본 LLM의 “전체 latent”를 다루는 존재가 아니다.  
현실적으로 e_t/QP가 안정적으로 보고/제어할 수 있는 것은, (의미가 비교적 깨끗하거나 / variance가 큰) **일부 저차원 축들의 부분공간(meta-observable subspace)** 이다.

#### 2.8.1 Latent Axis Bank(LAB) / Axis Bank의 목적
- e_t/QP를 “그럴싸한 벡터”로 두지 않고, **측정 가능한 채널들의 집합**으로 고정해
  - 재현 가능한 디버깅(무슨 축이 흔들렸는지)
  - 제어계 안정화(요동 억제)
  - JML 기반 학습/개선(축의 품질을 데이터로 평가)
  을 가능하게 만든다.

#### 2.8.2 Axis 타입(권장)
- **LR axis(semantic axis)**: supervised probe 방향(의미가 비교적 명확)
  - 장점: 관측/제어가 쉽고, 운영상 “손잡이”로 쓰기 좋음
  - 단점: 동시에 “속이기 쉬운 손잡이”일 수 있으므로 **진실 판독기로 과신 금지**
- **PC axis(structural axis)**: 상위 PCA 방향(variance가 큰 전역 좌표)
  - 장점: 모델 고유 동역학(스타일/레짐)의 전역 좌표로 유용할 수 있음
  - 단점: **분포/레짐(z_t) 변화에 따른 드리프트**가 치명적일 수 있음
- **TG axis(gestalt axis)**: 문장/청크/툴스텝 같은 “경계(boundary)”에서 뽑은 상태를 저차원 프로젝션한 축(Thought Gestalt-style)
  - 장점: “현재 생각 단위”에 가까운 요약 신호를 축으로 고정할 수 있어, 루프/전이 감지·거시 상태 추적에 유리할 수 있음
  - 단점: 경계 정의(문장 vs 청크 vs 툴스텝)에 따라 분포가 바뀌고, 도메인·레짐(z_t) 변화에 드리프트 가능 → 버전/대칭 안정성/레짐 분리 규칙이 필수
- (Option) **SAE axis**: disentangled feature 기반 축(후순위)

#### 2.8.3 Axis 메타데이터(필수)
- `axis_id`
- `type`: {LR, PC, TG, SAE}
- `layer`
- `regime`: z_t 또는 global
- `version`
- `trained_on`: 데이터/기간/체크포인트 digest
- `role_tag`: {monitor-only, control-only, dual-use}
- `notes`: 사람이 붙인 해석(선택)

#### 2.8.4 드리프트/레짐 운영 규칙(특히 PC axis)
- (A) **z_t별 basis 분리**: `PC_basis(z_t)`를 따로 유지(가장 명료)
- (B) **basis 고정 + 느린 업데이트**: 주기적 재학습 + 호환성 테스트(옛 basis 대비 안정성 유지)
- 어떤 방식을 쓰든, **axis_versioning**과 “언제/왜 바뀌었는지”는 JML에 남긴다.

#### 2.8.5 최소 검증 루틴(축 도입 전)
1) **대칭 안정성(Text-confound 방지)**: paraphrase/포맷/순서 변형에서 값 유지
2) **레짐 교차 안정성**: z_t 모드 변경에도 의미/방향성 유지
3) **결합도(coupling)**: axis j 제어 시 다른 axis가 얼마나 흔들리는지(top-k만 기록)



#### 2.8.6 (NEW/Ops) TG-lite axis: “문장/청크 경계” 기반 gestalt embedding (백본 무개조 우선)

**요지**: Thought Gestalt류의 아이디어를 “백본 구조 변경 + end-to-end 학습”까지 끌고 가기 전에,  
**Axis Bank의 신규 축 후보**로만 먼저 도입해 *관측→검증→로그* 루프에서 값이 있는지 판정한다. (가성비 우선)

##### (A) 최소 정의(권장, v0.1~)
- **boundary**: `sentence_eos`(권장) / `chunk_delim` / `tool_step_end` 중 하나를 선택해 문서화
- **추출**: 선택한 레이어 `ℓ*`의 boundary 위치 hidden state `h^(ℓ*)`를 뽑아,
  - `h_t = normalize(W_tg · h^(ℓ*))`,  `h_t ∈ R^K`, K=12~32 (v0.1 권장 12~24)
- **등록**: Axis Bank에 `type=TG`, `role_tag=monitor-only`로 먼저 넣는다.
  - axis_id 예: `TG:L{ℓ*}:K{K}:B{boundary}:v1`

##### (B) 필수 검증(2.8.5 + 2.6/3.4 재사용)
- **대칭 안정성**: paraphrase/포맷/순서 변형에서 `h_t`가 과도하게 요동하지 않는지
- **레짐 교차 안정성**: z_t 변경에도 의미/방향성이 유지되는지(필요하면 `TG_basis(z_t)` 분리)
- **결합도**: 특정 TG 축을 “제어 채널”로 쓸 생각이 생기면, 먼저 coupling_topk를 측정하고 득실을 판단

##### (C) 승격 기준(운영형)
- v0.1~v0.2에서는 **monitor-only 유지**가 기본값
- 아래 중 최소 1개라도 “재현 가능하게” 개선되면, 그때 BG/정책 입력으로 승격 검토:
  - `loopness_hat`의 조기 경보 품질 개선(낭비 탐지)
  - `sync_drift_hat`의 해석 가능성 증가(“상태가 바뀐다/안 바뀐다”가 더 명료)
  - 특정 실패모드 재발률 감소(같은 패턴 반복을 더 빨리 끊음)

##### (D) (Option/Research) detach vs no-detach 실험(훈련할 때만)
- TG 원 논지의 본체는 “메모리에 쓰는 벡터 생성까지 미래 loss가 역전파로 학습되는가(detach 금지)”다.
- 다만 이건 **백본 학습 루프**를 건드리므로, 본 문서의 기본 운용(v0.1~v0.2) 범위 밖이다.
- 필요한 경우에만, 별도 실험 프로토콜로 분리해:
  - `detach` vs `no-detach` 미니 파인튜닝을 하고,
  - Axis 안정성/드리프트/loopness 예측력(closure)에서 차이가 나는지로 판정한다.


### 2.9 (NEW/Ops) Neuro-motif: microtype + short-timescale filter (피질 타입·STP 차이의 공학 번역)

**요지(이번 세션 결론의 운영 번역)**  
인간 피질에서 “흥분성(E) 뉴런”도 한 덩어리가 아니라, 전기생리적 타입(e-type) 차이와 **타입-조합별 연결/강도/단기 가소성(STP)** 차이로 인해  
같은 입력이라도 회로가 **서로 다른 시간 필터/계산 모드**로 동작한다.  
Augnes Local에서는 이를 생물학 복제로 끌고 가기보다, **(1) 미세 모드(microtype) 분해 + (2) 짧은 시간대 필터(= fast trace/STP-kernel) + (3) 게이팅 타깃(샘플링/메모리/어댑터)**로 번역해 쓰는 게 가성비가 가장 좋다.


#### 2.8.6 표현 추출 지점 표준: z_t vs backbone pooling
Axis는 “어디서 뽑느냐”가 스펙의 일부다. Axis Bank는 아래 표준 키를 가진다.

- `repr_source`:
  - `zt_summary` (운영 기본): `z_t(Commit)` 요약 벡터에서 축을 정의
  - `backbone_pool` (진단/연구): 백본 레이어 ℓ에서 pooling한 표현에서 축을 정의
- `repr_layer` / `repr_pooling`:
  - backbone_pool일 때만 의미가 있고, 반드시 함께 기록한다.
- 운영 규칙:
  - 기본은 `zt_summary`로만 운영한다(“연구용 축”이 운영 루프를 오염시키지 않게).
  - backbone_pool 축은 **승격 전까지** monitor-only로 고정한다.

#### 2.8.7 축 승격의 최소 회귀: AR + 불변성(Probe Runner 연동)
Axis Bank는 “등록만 하면 끝”이 아니라, **승격(=운영 손잡이화)** 에 회귀 규칙이 필요하다.

- 최소 회귀 배터리(권장):
  - `invariance_v0`: 스케치/순서/정규화 불변성(형식 셔플 포함)
  - `abstractness_ar_v0`: `C_min/R/O` 최소 이분 변수에 대한 decodability + CCGP + PS_repr
- 승격 단계:
  - `candidate` → `monitor_only` → `control_ready`
- 해석 규칙:
  - 절대값 금지. 성공-실패, inference present-absent 같은 **Δ 기반**으로만 판단한다.

> 용어: 이 문서에서는 Axis Bank를 **Latent Axis Bank(LAB)** 라고도 부른다.  
> “Latent”는 ‘거대 임베딩’이 아니라, **운영에 쓰는 저차원 손잡이**라는 의미다.

#### 2.8.8 (NEW/Ops) ContextStencil: Axis→Space gating (OSC-inspired)

모티브: "Oscillatory control of cortical space as a computational dimension"에서 제안된  
**oscillation power의 공간 패턴(= inhibitory stencil)** 을, 로컬 운영에서는 “컨텍스트/메모리 뱅크 공간의 soft mask”로 번역한다.

**핵심 아이디어**
- `Axis Bank`는 저차원 제어 손잡이(`h_t`)를 제공한다.
- `ContextStencil`은 그 손잡이를 **‘어떤 컨텍스트 슬롯을 억제/허용할지’** 라는 공간 가중치로 펼친다.

**권장 최소 형태(Control/View)**
- `ContextStencil := {region_id -> inhibit_w}` (0..1)
- region partition은 v0에서는 고정(`ctx_region_set_id`)하고, 회귀/재현을 위해 ID로 남긴다.

**생성(가성비 v0)**
- 룰 기반: `route_last + HCM_state + PE/EES`로 inhibit_w를 만든다. (가장 싸고 디버그가 쉬움)
- 얇은 헤드(선택): `inhibit_w = sigmoid(W·h_t + b)` 같이 axis snapshot에서 바로 맵을 생성한다.
  - 단, 승격 전까지 monitor-only로 고정(§2.8.7 회귀 배터리 준수).

**운영 규칙(필수)**
- 업데이트는 Observe 직후 1회 또는 Pulse-boundary에서만(매 스텝 재계산 금지).
- jerk cap + min-dwell로 안정화(=정책 진동 방지).
- 적용은 retrieval/selection/요약의 **편향(soft mask)** 만 허용. Evidence/Claim 권위 침범 금지.

**포인터**
- Canonical: Workspace Stencil(§9.4a)
- Playbook: SSC 레시피(§6.3.1d)
- Logging: `STATE_SNAPSHOT.payload.metrics_optional.artifact_tuning.context_stencil.*` (Logging Policy §11.8)
- Wiring: (A0l) `WIRING_INTEGRATION_MAP.md`

#### 2.9.1 핵심 목표(현실적)
- “조향”을 프롬프트 말발이 아니라 **구조적 손잡이(게인/게이팅/trace)**로 만든다.
- 루프 고착/재시도 폭증/검색 폭주 같은 실패모드를 **짧은 시간대 신호**로 먼저 누른다.
- JML에 “어떤 모드/필터가 효과였는지”가 누적되도록 만든다.

#### 2.9.2 Microtype(e-type) Bank: 최소 정의
- `etype_id ∈ {0..K-1}` (권장 K=4~8)
- 각 etype은 다음을 가진다:
  1) **Gain/Threshold 프로파일**: 출력이 잘 튀는지(공격적) vs 보수적인지(안정적)
  2) **STP-kernel(짧은 기억 필터)**: 최근 흔적(trace)에 대한 facilitate/depress 성향 + 시간상수

권장 파라미터(초기엔 룰 기반으로 시작 가능):
- `gain_out` / `retrieval_gain` / (선택) `tool_bias`, `retry_bias`
- `tau_fast` (필수), (선택) `tau_slow`
- `alpha` (trace가 정책에 미치는 영향력)
- `mode ∈ {facilitate, depress}` (최근 흔적을 통과시키는지/막는지)

#### 2.9.3 fast trace(= STP-kernel의 상태) 정의
- `trace_t`는 최근 N턴의 운영 특징에서 만든 저차원 벡터(또는 스칼라 묶음)로,
  - `trace_t = r * trace_{t-1} + φ(features_t)` (지수감쇠 + 누적) 형태를 기본값으로 둔다.
- feature 후보(가성비):
  - `loopness_hat`, `stuckness`, `ΔQ`, `ΔM`, `retrieval_pressure`, `verifier_score`, `axis_snapshot` 요약 등
  - (추가) `Comp_policy_lz`, `Comp_et_lz` (반복/산만 프록시; Control/View)
- 목적:
  - “방금 전까지의 흐름”이 다음 결정에 자동 반영되게 만들기
  - 특히 **ΔQ는 안 오르는데 ΔM만 오르는 구간**을 빠르게 감지/차단

#### 2.9.4 etype 선택 규칙(초기 권장: monitor-only → 제한적 적용)
- v0.1: etype 점수만 계산하고 기록(제어 채널로 바로 쓰지 않는다)
- v0.2: 안정성이 확인되면 제한적으로 게이팅에 연결
- 폭주 방지:
  - `etype_switch_count` 임계치 초과 시 쿨다운(일정 기간 etype 고정)

간단 점수 예시(개념):
- `score_k = w1*stuckness + w2*loopness_hat + w3*risk - w4*confidence` + w5*(1-competence_hat) + w6*competence_u  # (권장) 메타인지 신호 반영

#### 2.9.5 “어디에 걸어야” 효과가 나오나(가성비 3타깃)
1) **Memory 게이팅**: `retrieval_pressure` / 재검색 여부 / Top-K 크기
2) **Sampling/Retry 게이팅**: temperature/top_p, retry budget, stop_policy
3) **Adapter/Route 게이팅(선택)**: 작은 adapter bank 중 일부만 활성(= 가성비 MoE)

> 원칙: 제어 타깃은 1개씩만 늘린다. 한 번에 여러 군데를 흔들면 디버깅이 지옥이 된다.




##### (r19) eff-dim 기반 stochastic 자동 보정(탐색/노이즈/온도/perturb)

- 목표: 표현의 활성 차원(유효 차원)이 변해도, 탐색의 “총 에너지”가 과도하게 변하지 않게 만든다.
- 입력: `eff_dim_hat` (Axis Bank 기반 participation ratio; Logging Appendix에 정의)
- 스케일(권장):
  - `scale = sqrt(d_ref / clamp(d_eff, d_min, d_max))`
  - `temperature_eff = clamp(temp_base * scale, t_min, t_max)`
  - `noise_sigma_eff = clamp(noise_sigma_base * scale, s_min, s_max)`
  - `perturb_sigma_eff = clamp(perturb_sigma_base * scale, p_min, p_max)`
- 로그(필수): raw/effective/scale을 같이 남겨라. (rollback/ablation 가능성 확보)
#### 2.9.6 JML에 남겨야 “조향 학습”이 된다
- etype/trace를 도입했으면, 아래 로그가 없으면 사실상 의미가 없다:
  - `etype_id`, `etype_switch_count`, `trace_norm`, `trace_delta_norm`
  - 어떤 게이팅을 건드렸는지(`retrieval_gain`, `sampling_params`, `adapter_id` 등)
  - 결과 변화(`delta_Q`, `delta_M`, `Q_over_M`)  


## 3. Qualia Proxy(QP) / QPmap: “계측과 해석의 관문”

### 3.1 QP의 역할
- 내부 신호(모델 로그, 토큰/시간, 실패 패턴, self-eval) + 외부 신호(사용자 피드백, 작업 결과)를 수집
- 이 신호들을 **표준화된 feature**로 변환해 Sidecar에 공급
- 또한 “왜 지금 이런 결정을 했는가”를 설명 가능한 형태로 남겨 JML에 적재

### 3.2 QPmap(매핑)의 개념
- 원천 신호 → (필터/집계/정규화/추론) → 메타 feature
- 예:
  - `token_used`, `latency_ms` → `M_hat`
  - `stop_step`, `halt_event` → `tau_hat`
  - `verifier_score`, `task_success` → `Q_hat`
  - `Q_hat / M_hat` → `eff_hat` (효율)

### 3.3 QP 설계 원칙
- “많이”보다 “일관성”: 지표는 적어도 좋으니, **측정과 해석이 반복 가능**해야 한다.
- QP는 Sidecar보다 “아래 계층”이며, Sidecar 정책을 직접 강제하지 않는다. (강제는 6.4 Budget Governor가 담당)

---

### 3.4 (NEW) QP 대칭 규칙: “측정이 흔들리면 e_t도 같이 무너진다”
QP는 Sidecar보다 아래 계층이지만, QP가 표면 변형에 흔들리면 e_t는 필연적으로 흔들린다.  
따라서 QP에도 **대칭 기반 불변성**을 최소 수준으로 강제한다.

#### 3.4.1 최소 augmentation 세트(권장)
- paraphrase / 요약-확장(동일 의미 유지)
- tool 호출 표기 변형(동일 의미 유지)
- memory snippet 순서 변형(동일 근거 유지)

#### 3.4.2 손실/제약(실무형)
- invariance: `QP(o'_t) ≈ QP(o_t)`  
- (필요 시) equivariance: 특정 변환은 `QP(o'_t) ≈ R_g QP(o_t)`  
  (예: 레짐 전환의 표지가 특정 QP 축을 ‘뒤집어야’ 하는 경우)

#### 3.4.3 산출물
- `symmetry_suite_id`를 로그에 남겨, “어떤 변환에 대해 안정화했는지”를 추적한다.


### 3.5 (NEW/Ops) 동기화/루프/CSI 로컬 프록시: “안정성 신호 묶음”
**목적**: 내부 추론/검색/재시도가 “진짜로 상태를 바꿔가며 진행” 중인지, 아니면 같은 attractor(루프)에 고착됐는지 **가성비 좋게** 감지한다.  
이 신호는 ‘정답 판독기’가 아니라 **운영 안정화(멈출지/모드 바꿀지) 판단 보조**다.

#### 3.5.1 입력 소스(권장 우선순위)
- (1) **Axis Bank snapshot** `h_t ∈ R^K` (Start Points 4.9 / 본문 2.8, 6.1.8)
- (2) (대안) 백본/모듈의 activation을 **저차원 프로젝션**한 `h_t`  
  - K는 **허용 12~32**, v0.1(로컬 가성비) **권장 12~24** (욕심 금지).  
  - PC axis는 드리프트 위험이 있으니 `axis_versioning` 규칙을 그대로 적용한다.

- (3) **TG-lite boundary embedding**(권장: monitor-only로 시작)
  - 정의: 문장/청크/툴스텝 종료 시점의 hidden state를 하나 뽑아 저차원(K=12~32)으로 투영한 `h_t`
  - 목적: “상태가 실제로 변했는지”를 감지하는 동기화/루프 신호에, 더 ‘생각 단위’에 가까운 관측 채널을 제공

#### 3.5.2 계산(가성비, O(|P|) 재귀 업데이트)
동기화 행렬을 D²로 만들지 않고, **선택된 뉴런/축 pair 집합 P**에 대해서만 지수감쇠 내적을 유지한다.

- pair별(또는 글로벌) 감쇠 `r ∈ (0,1)`
- 재귀 업데이트(예시):
  - `s_{ij,t} = r * s_{ij,t-1} + h_{t,i} * h_{t,j}`  for (i,j) ∈ P
- 구현 팁:
  - 스케일 민감도를 줄이려면 `h_t`를 z-score/clip 등으로 **간단 정규화**한 뒤 계산한다.
  - 결측/비동기 축은 `mask_t`로 제외(0으로 때우지 않는다).

#### 3.5.3 QP 산출물(권장 최소)
- `sync_hat`: synchrony 요약(스칼라 또는 작은 벡터)
  - 예: `sync_mean_abs`, `sync_topk_abs`, (선택) `sync_spectral_entropy`
- `sync_drift_hat`: `||s_t - s_{t-1}|| / (||s_{t-1}||+ε)` 같은 **변화율 요약**
- `loopness_hat`: 아래 조건을 종합한 휴리스틱(운영에서 정의 고정)
  - `sync_drift_hat ↓` (상태가 안 바뀜)
  - `ΔQ`는 미미한데 `ΔM`만 증가(한계효용 0)
  - 같은 실패모드 태그가 반복(JML 기준)

> v0.1에서는 **monitor-only**로 시작(제어 채널로 바로 쓰면 오판에 흔들리기 쉽다).  
> 충분히 쌓인 뒤에만 BG 입력으로 승격한다.

#### 3.5.4 JML 기록(권장)
- `sync_hat`, `sync_drift_hat`, `loopness_hat`
- `pair_set_id`(선택): 어떤 P(축/pair 샘플링)를 썼는지
- `sync_version`: 계산/정규화/감쇠 파라미터 버전

#### 3.5.5 (NEW) CSI(Coalition Stability Index)와의 정합(로컬 프록시)
Canonical/Logging Appendix에서 CSI는 “같은 태스크를 여러 번 반복했을 때 내부 경로가 얼마나 안정적인가”를 본다.
로컬 런타임에선 매번 N회 반복 실험을 강제하기 어렵기 때문에, 아래처럼 **1회 실행에서도 계산 가능한 CSI-프록시**를 둔다.

- **CSI(정식)**: `SCORE_REPORT.payload.metrics.CSI_phase / CSI_global` (반복 실행 기반; Appendix §13.7)
- **CSI_proxy(로컬)**: 한 run 내에서 `policy/route/phase` 시퀀스가 얼마나 출렁였는지(=path flip)를 요약한 값

권장 정의(v0.1, 비용=O(T))
- 입력 시퀀스(턴 t 기준):
  - `route_tier_t` (TRL router tier / tool vs no-tool 등)
  - `phase_t` (ACQUIRE/VERIFY/COMMIT/CONSOLIDATE)
  - `policy_fingerprint_t` (policy_levers 요약 해시)
- **flip rate**: 인접 토큰이 바뀌는 비율
  - `Flip_route = mean[route_tier_t != route_t-1]`
  - `Flip_phase = mean[phase_t != phase_t-1]`
  - `Flip_policy = mean[fingerprint_t != fingerprint_t-1]`
- **CSI_proxy_global** (0..1 권장):
  - `CSI_proxy_global = 1 - clip01(wr*Flip_route + wp*Flip_phase + wl*Flip_policy)`
  - 가중치 권장(초기): `wr=0.4, wp=0.2, wl=0.4`

운영 규칙(가성비)
- `CSI_proxy_global`이 낮으면: “답이 맞든 틀리든” 내부 경로가 흔들린다 → 안정화 레버(쿨다운/히스테리시스/Δpolicy jerk-limit) 우선.
- `sync_hat/loopness_hat`은 **상태 변화/루프**를, `CSI_proxy`는 **정책/경로 안정성**을 본다. 둘은 역할이 다르다.

로그 위치(정합)
- 빠른 운영은 `STATE_SNAPSHOT.payload.metrics_optional.stability.CSI_proxy_*` (또는 동등)
- 반복 실행이 가능한 벤치/회귀에서는 Appendix 규약대로 `SCORE_REPORT.payload.metrics.CSI_*`를 산출한다.



### 3.5.6 (Ops) Goal→Action Coupling (G2A): “목표 펄스→행동 발화” 결합도 프록시

**아이디어**: PFC-유사(목표/드라이브) 신호가 motor-유사(툴/쓰기/커밋) 출력으로 *얼마나 잘 연결되는지*를, 비싼 추론 없이 **로그 기반으로 측정**한다.  
이 값은 **Control/View 전용**이며, Evidence/Claim로 승격하면 바로 권위 누수다.

- 권장 저장 위치: `STATE_SNAPSHOT.payload.metrics_optional.g2a.*`
  - `g2a_coupling_hat ∈ [0,1]`
  - `goal_pulse_count_w`, `action_fire_count_w`
  - `hit_rate_w`, `base_rate_w`
  - (권장) `window_steps`, `delta_t_max_ms` 또는 `lag_ms_hat`

**가성비 계산(권장 요약)**  
- `goal_pulse`: 목표/드라이브 fingerprint 변화(해시) 또는 Δdrive_norm > θ  
- `action_fire`: 툴/쓰기/커밋(또는 Gate의 selected_action이 실행 계층)  
- `g2a_coupling_hat`은 `hit_rate_w`를 `base_rate_w`로 정규화한 값(Playbook §3.2.3d)

**운영 사용(요약)**  
- Gate prior-only: `COMMIT` vs `VERIFY` 편향을 *작게*만 준다(clip/jerk/cooldown 필수).
- SRF: `τ_stop` 입력 금지.

### 3.5.7 (NEW/Ops) Memory-ANN-lite (MN): “기억 변수” 기반 보상학습 프라이어(초경량)

**아이디어**: 단일 스칼라(예: `delta_q_hat`)만으로는 “최근/중기/장기” 패턴을 충분히 담기 어렵다.  
따라서 Sidecar가 **잠재 메모리 상태**를 유지하고, Gate 후보 점수에 **아주 약한 prior-only 편향**만 제공한다.  
MN은 **Control/View 전용**이며 Evidence/Claim로 승격하면 규약 위반이다.

- 권장 저장 위치: `STATE_SNAPSHOT.payload.metrics_optional.memory_ann.*`
  - `mn_bias_hat ∈ [-1,+1]`, `mn_conf ∈ [0,1]`
  - (선택) `mn_timescale_mix`, `mn_cf_sens_hat`

**초기(v0.1) 구현(권장)**  *(trace-only, 거의 O(1) 비용)*
- `trace_fast(x)`, `trace_slow(x)`를 유지(EMA/지수감쇠)  
- 예: `mn_bias_hat = tanh(w_f*fast + w_s*slow - w_c*cost_trace)`  
- `mn_conf` 기본 정의(v0.1): 부호 안정성(sign-stability) × EWM 분산 패널티  
  - `x_t := mn_bias_hat(t)`  
  - `mn_conf := clamp01( stab_W * exp(-k * var_ewm_t) )`  
  - 권장 기본값: `W=16`, `λ=0.10`, `k=6.0` (자세한 정의는 Canonical `§5.2.0d (C0)`)

**운영 사용(요약)**  
- Gate prior-only: `COMMIT` vs `VERIFY/RETRIEVE` 편향을 *작게*만 준다(clip/jerk/cooldown 필수).
- (MUST) `prior_clip_mn`는 LPS/G2A와 동일한 **shared prior pipeline**(clip→jerk→cooldown)을 **같은 코드 경로로** 통과한다(별도 jerk/clip 분기 금지).
- SRF: `τ_stop` 입력 금지. ORAV cooldown 중이면 MN prior=0(또는 동결).
- Gate 기록(권장): `GATE_DECISION.payload.memory_ann_used.*`



### 3.6 (NEW/Ops) Neuro-motif용 QP 확장 필드(권장)

Neuro-motif(2.9)를 운영에서 쓰려면, “trace/etype가 얼마나 흔들렸는지”가 계측으로 남아야 한다.  
초기에는 **기록 우선(monitor-only)** 으로 도입하고, 안정성이 확인되면 BG/정책 입력으로 승격한다.

- `etype_id`: 현재 선택/추정된 microtype
- `etype_switch_count`: 에피소드(또는 윈도우) 내 etype 전환 횟수
- `trace_norm`: fast trace 크기(요약)
- `trace_delta_norm`: fast trace 변화율(요약)
- (선택) `stp_state_norm`: STP-kernel 내부 상태 크기(더 세밀한 디버깅용)
- (선택) `gating_targets`: 이번 턴에 적용한 게이팅 요약(샘플링/메모리/어댑터)



### 3.7 (NEW/Ops) Forecast/Calibration QP 확장(EOP++) (권장)

**목적**: 오픈엔디드 과업에서 “정답”이 애매해도, 예측의 **과신/캘리브레이션/실패모드**를 계측해 Sidecar가 먹을 수 있게 만든다.

#### 3.7.1 입력 소스
- Raw Event Log: `EXPECTED_OUTCOME_PACKET`, `PREDICT_OBS_COMPARE` (Logging Appendix 계약을 단일 기준으로)
- (옵션) Verifier 결과/툴 latency/에러 코드(같은 `tool_run_id`로 조인)

#### 3.7.2 QP 산출물(권장 최소)
- `wager_count_w`: 윈도우 내 정산 가능한 wager 개수
- `wager_unresolved_rate_w`: `outcome=unresolved` 비율(관측/정산 누락 감시)
- `brier_w`: Brier score(가능할 때만)
- `overconfident_error_w`: high-conf(예: p>=0.8)에서 fail 비율
- `failure_mode_entropy_w`: 실패모드 분포 엔트로피(한 실패모드에 고착되는지 감시)
- (옵션) `confidence_collapse_rate_w`: p가 특정 값(0.5 부근)으로 쏠리는 비율(치팅/무의미화 감시)

> 주의: 이 값들은 “정답/진실”이 아니라 **운영 신호**다. Gate/Policy에 쓰더라도 jerk-limit/쿨다운 규약을 그대로 따른다.

#### 3.7.3 e_t 반영(권장)
- `e_t.calib_health`: 캘리브레이션 건강도(예: `1 - clip01(brier_w)`)
- `e_t.overconfidence`: 과신 위험(예: `overconfident_error_w` EMA)
- `e_t.eop_violation_pressure`: EOP 대비 실패/부분 실패가 누적되는 압력(실패모드 고착과 함께 사용)


### 3.8 (NEW/Ops) Competence QP 확장(MUSE-lite) (권장)

> 목표: “unknown 상황에서 전략을 갈아타기”를 가능하게 하는 **자기객관화 신호**를 QP 레이어에서 *측정/제공*한다.  
> QP는 결정을 내리지 않는다. QP는 **측정/해석**(feature 제공)만 한다.

#### 3.8.1 출력(권장 최소)
- `competence_hat`: float `[0,1]` (전략/플랜 성공확률 추정치)
- `competence_u`: float `[0,1]` (불확실성/표본 부족/OOD)
- `risk_hat`: float `[0,1]` (휴리스틱 또는 verifier 기반)
- `trigger_flags`: `{ fail_streak: bool, ood: bool, loop: bool }`

#### 3.8.2 입력(권장)
- `z_t` 요약: fatigue/entropy/conflict/loopness_hat
- 최근 실패/비용: fail_streak, avg_cost_recent
- 라우팅/리소스: route_tier, runtime_limits.profile_id, budget_axis
- 작업 특성: task_kind, constraints_hardness, tool_required_flag

#### 3.8.3 주의(필수)
- competence는 Control signal이며 **Evidence/Claim confidence와 분리**한다.
- 업데이트는 느리게(안정성 우선). 캘리브레이션(ECE/Brier) 모니터링은 Logging Appendix를 따른다.

#### 3.8.4 로깅 포인터
- `COMPETENCE_ASSESSMENT` / `STRATEGY_SELECTION` / `METACOG_CYCLE_END`

### 3.9 (NEW/Ops) EES(Early Error Signal, ICN-proxy): “오류가 확정되기 전에 올라오는 경보 채널”

**목적**: 툴 실패/검증 충돌/논리 붕괴 같은 “오류의 전조”를, 정답이 도착하기 전에 계측해서
- VERIFY 우선
- 재시도/재검색
- backtrack/rollback
같은 개입을 *과잉반응 없이* 트리거할 수 있게 만든다.

#### 3.9.1 원칙(필수)
- EES는 **Evidence가 아니다**. Claim 승격/진실 판정에 권위를 주지 않는다.
- stop-rule(τ_stop) 독립을 침해하지 않는다. (EES가 높다고 “더 오래 생각”을 강제하지 않음)
- (SRF) `EES/LPS/competence_hat`는 `τ_stop` 컨트롤러 입력이 아니다. (stop-rule을 ‘사실상’ 흔드는 경로 차단)
- 운영 검증: `OPS_PLAYBOOK.md` §9.7.6(Gate-05) / `PROBE(invariance_v0)`의 `srf_firewall_invariance`에서, EES/LPS/competence_hat가 `tau_stop`에 영향 0인지 점검한다.

- EES는 **phase-conditioned**(ACQUIRE/VERIFY/COMMIT/CONSOLIDATE 별 임계/발생률이 다름).

#### 3.9.2 입력 컴포넌트(권장 최소)
- `tool_fail` : tool error/timeout/invalid payload
- `verifier_conflict` : verifier fail, self-consistency 붕괴
- `schema_violation` : contract/schema validate fail
- `constraint_break` : hard constraint 위반(형식/금지사항/정합성)
- (옵션) `prediction_miss` : EOP++ wager에서 고확률 실패 누적

#### 3.9.3 산출물(권장)
- 스칼라: `ees` (0..1)
- 분해: `ees_components.{tool_fail, verifier_conflict, schema_violation, constraint_break, ...}`
- 이벤트: `EES_event = (ees > θ_high_phase)`

#### 3.9.4 Sidecar 반영(권장)
- `e_t.ees_w`: 윈도우/EMA로 누적된 EES 레벨(= 시스템이 “불안해지는 이유” 중 하나)
- `e_t.ees_lead_time_hat`: 가능하면 “EES 상승 → 실제 실패 확인”의 평균 리드타임 추정

#### 3.9.5 Gate/Policy 연결(가성비)

- (옵션) **LPS(학습 기반 예측 신호)** 를 같이 쓴다면:
  - `EES`는 “전조 경보(휴리스틱/ICN-proxy)”, `LPS`는 “로그 학습 프라이어(초소형)”로 역할을 분리한다.
  - 규약: `LPS`는 **아주 약하게**(낮은 weight)만 Gate 후보 점수에 반영하고, `EES`/stop-rule을 대체하지 않는다.
  - `EES`와 `LPS`가 동시에 높을 때만 VERIFY를 더 강하게 우선하는 식의 **AND 보강**이 안전하다(단발 OR은 과민해지기 쉽다).
- `EES_event`가 뜨면 **VERIFY 우선**(단, cooldown/hysteresis 필수)
- EES가 계속 높은데 `loopness_hat`도 높으면: “루프 고착 + 오류 전조” → backtrack/rollback 후보

로그 계약 포인터
- 상세 규약/메트릭은 Logging Appendix의 **§13.6 Phase-conditioned EES Calibration**을 단일 기준으로 따른다.


## 4. z_t: Commit / Regime Switch

### 4.1 정의
- **z_t ∈ {0,1}^k** 혹은 저차원 이산/연속 벡터: 현재 시스템 모드(레짐)
- z_t는 “바꿨다가 다시 되돌리기 어려운” **커밋**을 표현한다.
- 예:
  - `z_explore` vs `z_exploit`
  - `z_train` vs `z_infer`
  - `z_mem_heavy` vs `z_mem_light`
  - `z_safe` vs `z_aggressive`
  - (옵션) `z_adapter_profile`: Universal Subspace 기반 adapter profile(계수 프로토타입) 커밋

### 4.2 왜 필요한가
- e_t는 연속적으로 흔들리기 쉽다.
- z_t는 “지금은 이 모드로 간다”를 고정해, 정책의 불안정한 요동을 막는다.

### 4.3 커밋 정책(권장)
- z_t 변화는 **히스테리시스**를 둔다.
  - 바꾸는 조건과 되돌리는 조건을 다르게 설정
- 변화 이벤트는 반드시 JML에 기록하고, 이후 실패/성공 통계로 재학습한다.



### 4.4 (권장) BSL(behavior_state)와 z_t의 연결
- BSL은 “세션 내부 행동 상태”이고, z_t는 “되돌리기 어려운 레짐 커밋”이다.
- 원칙:
  - BSL 변화는 **z_t 후보를 제안**할 수는 있어도, z_t를 직접 커밋하지 않는다.
  - z_t 커밋은 (i) 히스테리시스, (ii) min-dwell, (iii) EVC/Gate 결과, (iv) 실패 통계까지 묶어서 결정한다.
- 운영적으로 추천되는 연결:
  - `session_start`(세션 시작 변화점)에서는 z_t를 건드리지 말고 **보수 프리셋/검증 강화**로만 시작.
  - `bstage`가 올라가며(예: S2→S3) 안정성이 확인되면, 그때 `z_exploit` 또는 `z_mem_light` 같은 커밋 후보를 검토.
- 로그:
  - `STATE_SNAPSHOT.payload.state_core.behavior_state.*` (BSL 값)
  - (선택) `BEHAVIOR_STATE_SWITCH` 이벤트(전환 이유/신뢰도)
  - z_t 커밋은 항상 JML/STATE_SNAPSHOT에 별도로 기록(원래 규약 유지)

---

## 5. e_t · QP · z_t 상호관계 요약
- QP는 “계측/추출”, e_t는 “메타상태”, z_t는 “모드 커밋”
- 정책은 (e_t, z_t, task_state, memory_state)를 입력으로 행동을 산출
- JML은 “증거(경험)” 저장소이며, 이후 QP와 정책이 다시 참조한다

---

## 6. JML · Self-Graph · 학습/운영 루프


### 6.x (r19) Curation은 양이 아니라 조성: 실패유형별 타겟 데이터 제작

- 목적: Router/Verifier/Sidecar 헤드가 “어떤 실패를 고치고 있는지”를 데이터 조성으로 고정한다.
- 최소 로그 키:
  - `failure_mode_taxonomy_id="FM.v1"`
  - `failure_mode_id`(예: `FM/ROUTE/tier_boundary`, `FM/EVID/ghost_evidence`)
  - `DATASET_BUILD_*`의 `target_failure_modes[]`, `failure_mode_counts{}`
- 운영:
  1) 배포 로그에서 `failure_mode_id`를 태깅한다(자동+휴먼 보정 가능).
  2) 부족한 실패유형은 **의도적으로 터지게 만드는 입력**을 추가 생성한다(하드 네거티브).
  3) 대표/중복 제거는 그 다음이다. “양”은 마지막에 조절한다.

### 6.1 JML(Judgment Memory Layer) 기록 형식(권장)

#### 6.1.1 기본 필드
- `t`: timestamp
- `task_id / episode_id`
- `schema_version`: JML 필드 집합/해석 규약 버전(로그 호환성용)
- `context_digest`: 당시 입력/요약
- `e_t`, `z_t`
- `action`: 선택한 정책/행동
- `outcome`: 결과 요약
- `reward / score`: 외부 점수(있으면)
- `self_eval`: 내부 평가(있으면)
- `tags`: failure mode, novelty 등

#### 6.1.2 τ / Q / M 계측 필드(이번 세션 반영)
- `tau`:
  - 의사결정/추론/학습 루프에서 실제로 사용된 “정지 시간”
  - 예: 내부 스텝 수(**internal tick 수**), 토큰 수, subcall 횟수, 또는 wall-time 기반 정규화 값
- `Q`:
  - 품질 추정치 (verifier score, correctness, success prob, downstream utility 등)
- `M`:
  - 비용 추정치 (tokens, wall-time, FLOPs proxy, VRAM pressure, $ cost 등)
- `Q_over_M`:
  - 효율 지표. “더 오래(비싸게) 써서 얻은 품질”이 실제로 효율적인지 판단하는 핵심 값
  - (수치 안정) `Q_over_M = Q / (M + eps)` 권장. `eps`는 작은 상수(예: 1e-6).

#### 6.1.3 모듈별 τ 분해(이번 세션 반영)
- `tau_gen` / `tau_mem`:
  - 생성(Generate) 경로의 평균 τ
  - 기억(Retrieve/Commit) 경로의 평균 τ
- 권장 방식:
  - 세션/에피소드 단위로 분해 기록
  - 누적 통계(EMA, 분위수)를 Sidecar가 읽을 수 있게 정리해두기

#### 6.1.4 Budget Governor 기록(권장)
- `budget`:
  - `tau_budget`: 이번 시도에서 허용된 τ 상한
  - `M_budget`: 이번 시도에서 허용된 비용 상한(토큰/시간 등)
  - `early_stop_reason`: 조기 종료 사유(예: Q/M 악화, tau 초과 등)

  - (NEW) `pdc_stage_id`: 예산/루프 스테이지(예: `S0|S1|S2`)
  - (NEW) `pdc_round`: 에피소드 내 루프 라운드(1-indexed 권장)
  - (NEW) `pdc_stage_tau_cap`, `pdc_stage_M_cap`: 현재 스테이지 상한(로그/디버깅용)
  - (NEW) `halt_margin`: `τ_stop - EVC_raw_max` (클수록 “멈춤”)
  - (NEW) `halt_reason`: `stop_rule|tau_budget_exhausted|no_progress|loopness|...` (Control 로그)


#### 6.1.5 (Option) 기하/궤적 품질 로그 필드(메타상태 다양체용)
- `off_manifold_score` (= s(e)): 현재 e_t가 경험 분포에서 얼마나 벗어났는지
- `geo_len_est`: (e_t 공간에서의) geodesic/최단경로 길이 추정치
- `path_len`: 실제 관측된 e_t 궤적 길이(구간합)
- `path_eff_ratio = path_len / geo_len_est`: “헤맨 정도” 지표(>1이면 비효율)
- `transition_peak_offmanifold`: 모드 전환 중 s(e) 최대값(위험/비정상 전이 감지)
- `manifold_version`: 해당 지표를 계산한 방법/파라미터 버전(kNN k, 커널 폭 등)

---

#### 6.1.6 (NEW) 대칭/클로저(closure) 평가 로그 필드(권장)
- `symmetry_suite_id`: 적용한 변환(대칭) 세트 ID
- `closure_score_e`: e_t 기반 macro-only 예측이 full 대비 얼마나 손해인지(근사)
- `closure_score_qp`: QP 기반 macro-only 예측이 full 대비 얼마나 손해인지(근사)
- (수치 안정) `err_full`은 `eps`로 바닥, `closure_score`는 `[0,1]` clamp를 권장(정의는 Start Points 4.7.3).
- `macro_key`: (e_t + QP 요약) 기반 retrieval key/해시(가능하면)
- `macro_state_id`: (옵션) e_t를 이산 macro state로 클러스터링한 ID(HMM/cluster)
- `macro_state_version`: (옵션) macro_state centroid/클러스터 세트 버전(바뀌면 직접 비교 금지)
- `macro_state_confidence`: (옵션) soft assignment 신뢰도(0..1; 거리/확률 기반)
- `macro_state_method`: (옵션) {kmeans|gmm|hdbscan|hmm|other} (생성 방법 식별)
- `macro_obs_schema_id`: (옵션) macro_obs 슬롯/스케일 규약 ID (입력 정의가 바뀌면 반드시 변경)
- `macro_obs_hash`: (옵션) 정규화된 macro_obs_t 해시(sha256 권장)
- `macro_state_method_params_hash`: (옵션) 전처리/스케일/하이퍼파라미터 직렬화 해시
- `centroid_hash`: (옵션) centroid/모델 파라미터 아티팩트 해시
- `prototypes_topk`: (옵션) 대표 episode 샘플(top-k, 해석/회귀용 포인터)
- `risk_set_id`: (옵션) 위험집합/임계치 세트 ID

> 정의는 Start Points 문서의 4.7.3을 따른다.


#### 6.1.7 (NEW) Universal Subspace/Adapter 로그 필드(권장)
Universal Subspace를 “운영 좌표계”로 쓰려면, adapter 관련 메타를 JML에 반드시 남겨야 한다.

- `backbone_id`: 어떤 백본(아키텍처/가중치 구조)에서 나온 로그인지
- `basis_version`: 사용한 UBB 버전(빌드 시점/데이터/모듈 타깃이 바뀌면 버전업)
- `adapter_profile_id`: 적용된 profile ID(또는 cluster centroid ID)
- `coeff_hash` / `coeff_norm`: 계수 벡터 식별 및 규모(과도한 drift 감지)
- `proj_dim_k`: basis 차원(k)
- `residual_ratio`: subspace 밖 에너지 비율(OOD/오염/불안정 디버깅 키)
- (옵션) `merge_recipe`: profile이 단일 학습인지, 병합/가중 혼합인지에 대한 레시피

> 목적: “이 태스크/상태(e_t,z_t)에서 어떤 프로필이 성공했는가”를 재현 가능하게 남기는 것.


#### 6.1.8 (NEW/Ops) Axis Bank 로그 필드(권장)
Axis Bank를 “운영 제어계”로 쓰려면, 축 관측/품질/버전이 JML에 남아야 한다.

- `axis_bank_version`: 현재 사용 중인 axis 세트/버전
- `axis_snapshot`: `{axis_id: value}` (턴/에피소드 단위. 가능하면 레이어 정보를 axis_id에 포함)
- `axis_metrics`(요약):
  - `stability_score`: 대칭/패러프레이즈 안정성
  - `regime_stability`: z_t 교차 안정성(특히 PC axis)
  - `control_efficacy`: 목표 이동량/효과(제어 채널일 때)
  - `coupling_topk`: 제어 시 같이 흔들린 상위 k개 축(+크기)
  - `role_tag`: monitor-only / control-only / dual-use
  - `axis_version`: 개별 축 버전(축별로 다르면 map 형태)

> 목적: “축이 시간이 지나면서 구려지는지/드리프트나는지/속이기 쉬운지”를 데이터로 추적해,
> monitor/control 채널을 교체하거나 gain/정책을 조정할 근거를 만들기 위함.





#### 6.1.9 (NEW/Ops) 동기화/루프 요약 로그 필드(권장)
동기화(synchrony) 기반 신호는 “정답”이 아니라 **운영 안정성**을 위한 계측이다. 따라서 초기에 **기록 우선**으로 도입한다.

- `sync_hat`: synchrony 요약(스칼라/벡터)
- `sync_drift_hat`: synchrony 변화율
- `loopness_hat`: 루프 고착 휴리스틱
- `pair_set_id`: 어떤 축/pair 샘플링을 썼는지(재현용)
- `sync_version`: 계산/정규화/감쇠 파라미터 버전


#### 6.1.10 (NEW/Ops) Neuro-motif 로그 필드(권장)
Neuro-motif는 “조향의 손잡이”이므로, **무엇을 어떻게 조향했는지**가 JML에 재현 가능하게 남아야 한다.

- `etype_id`
- `etype_switch_count`
- (권장) `etype_cooldown_state` (쿨다운 중인지/남은 스텝 등)
- `trace_norm`, `trace_delta_norm`
- (선택) `stp_kernel_id`, `tau_fast`, `tau_slow`, `alpha`, `mode`
- `gating_targets`:
  - `sampling_params`(temp/top_p 등),
  - `retrieval_gain`(또는 retrieval_pressure),
  - (선택) `adapter_id`/`adapter_profile_id`
- `delta_Q`, `delta_M` (국소 변화 기록: “더 썼는데 나아졌냐?”를 바로 계산)


### 6.2 Self-Graph(구조 기억)과 g_t
- Self-Graph는 “무엇이 무엇과 연결되어 있었나”를 그래프로 남긴다.
- 노드 타입(예):
  - module, memory_chunk, task, user_intent, tool_call, failure_mode, adapter_profile(UBB 계수 프로필)
- 엣지 타입(예):
  - causes, depends_on, retrieved_from, contradicts, supports

- g_t는 해당 그래프의 “현재 활성 부분”을 요약한 형태로 보고,
  정책은 g_t 기반으로 “지금 필요한 기억/도구/모듈”을 선택한다.

#### 6.2.1 Self-Graph는 “저장소 3분리”가 표준(권장)
Self-Graph라는 이름 아래에 다 넣으면 바로 오염/권위 혼선이 난다. 로컬 구현은 아래 3개를 *물리적으로 분리*하는 게 안전하다.
- **ClaimStore(권위 레이어)**: Claim(§Canonical 8장) + claim 관계 엣지(revises/supersedes/contradicts). 덮어쓰기 금지.
- **InfluenceGraphLayer(IGL, 운영 레이어)**: HAG-style Influence/Association 엣지(§Canonical 8.3). 권위 없음.
- **Artifact/IndexStore(검색 편의 레이어)**: embedding/index/top-k cache, 서브쿼리 결과 캐시, 재현용 hash.

권장 물리 저장
- ClaimStore: SQLite(정규화) 또는 단순 append-only JSONL + 인덱스
- IGL: 별도 SQLite 테이블 또는 graph DB(가성비는 SQLite면 충분)
- Artifact/Index: DuckDB/Parquet(옵션 A) 또는 로컬 파일 인덱스

#### 6.2.2 (NEW) PSGR(ProgRAG-style) Progressive Self-Graph Retrieval
목표: “한 번에 다 가져오기” 대신, **서브쿼리 → 관계 검색 → 그래프 좁히기 → 다시 서브쿼리**를 짧게 반복해서
- 근거가 부족할 때는 넓히고
- 루프/과잉검색이 시작되면 좁힌다

**루프(가성비 v0.1)**
1) `SUBQ`: 질문을 1~3개의 서브쿼리로 분해(문장 수준이면 충분)
2) `REL_RETR`: 각 서브쿼리에 대해 (a) ClaimStore 텍스트/키워드 Top-K, (b) IGL에서 1~2-hop 확장
3) `PRUNE`: hit가 낮거나 hub가 과도하면, IGL 엣지/노드를 cap 아래에서 prune(단, Claim 관계 엣지 건드리지 않음)
4) `PACK`: 근거 포인터(claim_id/evidence_id/tool_run_id)만 모아 프롬프트에 pack (원문 과다 주입 금지)
5) `ANSWER/VERIFY`: 답 생성 + VERIFY
6) `UPDATE`: Boundary에서만 IGL ΔW를 커밋(또는 shadow)

**가드레일(필수)**
- `psgr_step_cap`(예: 3): 한 에피소드에서 PSGR 반복 상한
- `self_graph_update_mode`=`shadow` 기본(안정화 전까지)
- `cooldown`/`cap`/`jerk-limit`은 Canonical/Appendix 규약을 그대로 따른다

#### 6.2.3 (NEW) PROGRAG 이벤트 포인터(재현/디버그 필수)
PSGR 루프는 “무슨 서브쿼리를 냈고, 무엇을 가져왔고, 어디서 prune/grow 했는지”가 남지 않으면 재현이 안 된다.
Raw Event Log에 아래를 권장한다(스키마 번들 포함).
- `PROGRAG_STEP_START` / `PROGRAG_STEP_END`
- `PROGRAG_SUBQUESTION`
- `PROGRAG_RELATION_RETRIEVAL`
- `PROGRAG_GRAPH_UPDATE`

자세한 payload 키/저장 위치는 Logging Appendix(§12 이벤트 목록)와 schema bundle을 단일 기준으로 따른다.

---

### 6.3 학습/운영 루프(최소 형태)
1. (관측) 입력/상태 수집
2. (QP) 계측 및 feature 추출
3. (e_t 업데이트) f_θ로 메타상태 갱신
4. (z_t 결정/유지) 커밋 여부 판단
5. (정책) 행동 선택: 응답/도구 호출/기억 검색/학습 트리거 등
6. (실행) 행동 수행
7. (기록) JML + Self-Graph 업데이트
8. (회수) Top-K retrieval로 다음 결정에 반영

---

### 6.4 Budget Governor(BG): “상위 규칙”의 자리 (이번 세션 핵심)

#### 6.4.1 결론(레이어 계층화 질문에 대한 답)
- “τ_budget(n,p) + Q/M 조기 종료” 같은 **운영 규칙**은
  Qualia Proxy / Sidecar / JML 중 어디에도 *그 자체로* 완전히 속하지 않는다.
- 하지만 **별도의 거대한 레이어를 새로 만들 필요는 없다.**
- 구현 관점에서 최적의 자리는:
  - **Sidecar 제어 도메인 내부의 서브모듈**로서 *Budget Governor(BG)* 를 두는 것.
  - 즉, “Sidecar = 메타상태 + 정책 헤드들” 중 하나의 정책 헤드가 BG다.

#### 6.4.2 BG의 입력/출력
- 입력:
  - `e_t`, `z_t`
  - QP가 계산한 `tau_hat, Q_hat, M_hat, Q_over_M`
  - (권장) 동기화/루프 신호: `sync_hat, sync_drift_hat, loopness_hat` (3.5)
  - JML 통계(모듈별 tau_gen/tau_mem 분포, 실패 패턴)
  - task meta: (n, p) 혹은 난이도/중요도/긴급도 추정치
- 출력:
  - `tau_budget`, `M_budget`
  - `stop_policy`: (continue / stop / degrade_mode / switch_mode)
  - `budget_rationale`: 왜 이런 예산을 줬는지(설명 가능 로그)

#### 6.4.3 τ_budget(n,p) 설계 가이드(경험적)
- (n): 시도 횟수/검색 폭/샘플 수 같은 “탐색량”
- (p): 문제 난이도/불확실성/리스크 같은 “복잡도”
- 메모: τ를 **internal tick(반복 정제/재시도 step)** 로 정의하면, BG가 곧바로 “생각을 몇 번 더 굴릴지”를 스케줄링하는 역할을 하게 된다.
- 기본 형태:
  - `tau_budget = base_tau(z_t) * f(n) * g(p) * h(e_t)`
  - f(n): n이 커지면 τ를 조금 늘리되, 선형 폭증은 막기(로그/루트)
  - g(p): 난이도가 높을수록 τ를 늘리되, M_budget과 함께 캡을 둠
  - h(e_t): 피로/리스크가 높으면 τ를 줄이거나 모드를 전환

#### 6.4.4 Q/M 기반 조기 종료 정책
- 조기 종료 트리거 예:
  - `Q_over_M`가 최근 대비 일정 비율 이하로 하락(효율 붕괴)
  - `ΔQ` 증가가 미미한데 `ΔM`만 증가(한계효용 0)
  - `tau`가 예산 근접 + Q가 목표 미달(“계속해도 답 안 나옴” 판정)
  - (권장) `loopness_hat`가 높고(루프 고착) 개선 신호가 없을 때 → **모드 전환/중단** 후보
- 조기 종료 이후 선택지:
  - 더 싼 모드로 다운그레이드(짧은 답, 요약만)
  - 메모리 경로 강화/약화 전환(z_t 스위치)
  - 실패 로그를 남기고 다음 시도로 넘어가기

#### 6.4.5 왜 이게 “제어 이식”에 실용적인가
- 로컬 하드웨어는 결국 **자원(시간/토큰/VRAM)** 이 한정이다.
- BG는 시스템이 스스로 “이건 더 파도 손해”를 판단하게 만들어
  - 비용 폭주(토큰 낭비, 무한 루프)
  - 기억 과다 조회(망상적 검색)
  - 쓸데없는 학습 트리거
  를 줄인다.
- 동시에 JML에 통계가 누적되면 τ_budget 자체가 **점점 현실적인 값으로 수렴**한다.


#### 6.4.6 (NEW) TRM/CGAR 운영 이식(가성비): PDC / Halting / HSW

로컬 운용에서 TRM류의 ‘고정 깊이 재귀’를 그대로 흉내내는 건 비용 대비 이득이 작다.  
대신 **BG+Gate+Boundary(정산)** 3군데에서 아래 3개를 얇게 이식하면 대부분의 이득을 얻는다.

1) **PDC(Progressive Depth Curriculum)**: 얕게 시작해 필요할 때만 깊게(스테이지 스케줄링)
2) **ACT-style Halting**: stop-rule 기반 조기 종료(halting head의 런타임 대응)
3) **HSW(Hierarchical Supervision Weighting)**: 후반 루프의 학습 신호만 감쇠

- PDC는 BG가 `pdc_stage_id`를 산출하고, 그에 따라 `tau_budget/M_budget/branching_cap/loop_round_cap`을 단계적으로 풀어준다.
- Halting은 Gate가 **raw EVC 기반**(`prior=0`)으로 결정한다. BG의 예산/편향은 stop-rule을 override하지 않는다.
- HSW는 Boundary에서 Stats/Policy 업데이트를 할 때만 적용한다(결정/출력 감쇠 금지).

권장 로그 키는 Logging Appendix의 PDC/Halting/HSW 항목을 따른다.



#### 6.4.7 (NEW) BG/Gate 초소형 학습 기반 예측 신호(LPS): “로그로 배우는 약한 프라이어”

- 문제: EES/PE/competence_hat만으로는 “이 케이스는 자주 터진다” 같은 **경험적 패턴**을 반영하기가 어렵다(특히 툴/라우팅/메모리 실패).
- 해법: 로그에서 `commit_fail`/`verify_helped`를 라벨링해, **아주 작은 모델**로 `commit_fail_hat`, `verify_gain_hat`만 예측한다.

**원칙(필수)**  
- LPS는 **Control/View** 신호다. Evidence/Claim confidence에 섞지 않는다.  
- Gate(EVC)와 stop-rule을 override하지 않는다. “초기 편향”만 준다.  
- jerk-limit/clip/cooldown은 필수(진동 금지).

**가성비 통합 포인트**  
- Gate: `VERIFY` 후보 점수에 +, `COMMIT` 후보 점수에 - (아주 작게)  
- BG: 예산을 “폭”으로 흔들지 말고, `verifier_budget/retrieval_budget/intervention_topk` 같은 레버를 **1~2 수준**에서만 조정

**로깅(필수)**  
- `STATE_SNAPSHOT.payload.metrics_optional.learned_pred.*`  
- (권장) `GATE_DECISION.payload.learned_pred_used.*`  
- 캘리브레이션/드리프트 운영은 Logging Appendix를 단일 기준으로 따른다.


---

#### 6.4.8 (NEW) CSB(Cerebellar Satellite Bank): Sidecar 옆에 붙는 “도메인 특화 위성들” (Control/View 전용)

LPS가 “로그로 배우는 약한 프라이어”라면, CSB는 “작은 head로 코어 주변을 도는 도메인 특화 조절기”다.  
뉴로모픽 모티브 관점에서 보면, 코어(피질/언어 백본) 옆에 **저비용 위성 회로**를 붙여
- 언어 쪽(Sat-L)은 **출력 표면(Δlogits)** 을 안정화하고
- 혼합/행동 쪽(Sat-M)은 **라우팅/예산 후보 점수(Δpolicy_score)** 를 아주 약하게 편향한다.

**원칙(필수)**  
- CSB 출력은 **Control/View**다. Evidence/Claim으로 승격 금지.  
- CSB 출력은 **τ_stop 입력 금지**(SRF 블랙리스트).  
- Sat-L/Sat-M의 출력 타입 분리는 강제(assert + violation 시 disable).

##### 6.4.8.1 Sidecar 통합 포인트(권장)
- `update_sidecar()`:
  - `z_t, e_t`가 갱신된 직후, `csb.forward()`를 호출해 “이번 스텝의 위성 출력”을 만든다.
  - 단, `observe_only`가 기본. (배포 전에는 적용하지 말고 로그로만 보자.)
- Gate:
  - Sat-M의 `Δpolicy_score`는 `prior`에만 들어간다(작은 clip/gain).
- Generator:
  - Sat-L의 `Δlogits`는 샘플러 입력 직전에만 적용한다.

##### 6.4.8.2 권장 상태/로그(요약)
- `STATE_SNAPSHOT.payload.metrics_optional.cerebellar_satellites`
  - `mode`, `profiles[]`, `gain/clip`, `selectivity_score`, `mixedness_score`, `separation_violation`
- `GATE_DECISION.payload.cerebellar_satellites_used` (권장)

##### 6.4.8.3 운영 모드(가성비)
- `off`: 기본
- `observe_only`: 위성 계산/계측만 하고 적용은 0
- `assist_logits`: Sat-L만 적용
- `assist_policy`: Sat-M만 적용  
  - “둘 다”는 처음부터 하지 마라. 불안정성 원인이 된다(원인 격리가 어렵다).

PROBE/회귀 배터리는 Playbook §9.1.7을 단일 기준으로 따른다.

### 6.5 Artifact Self-Tuning Loop (Feedback Descent Engine): “아티팩트(프롬프트/정책/규칙)를 경험으로 자동 개선”

**문제**: 로컬 운용에서 가장 많이 바뀌는 건 “가중치”가 아니라 **프롬프트/프로그램/정책/메모리 규칙** 같은 *아티팩트*다.  
그런데 이 아티팩트들을 사람이 손으로 계속 튜닝하면,
- 개선 방향이 누적되지 않고
- 같은 실수를 반복하고
- 변경이 늘어날수록 회귀(regression)를 막기 어렵다.

**해법(권장)**: 아티팩트를 “버전 관리 대상”으로 보고,  
**제안(Propose) → A/B 평가(Evaluate) → 채택/롤백(Commit/Rollback)** 의 얇은 루프를 표준화한다.

#### 6.5.1 Artifact의 정의(권장 범위)
- Prompt: 시스템 프롬프트/스테이지 프롬프트/루브릭(Verifier) 프롬프트
- Program: DSPy류 멀티스테이지 체인 정의, 툴 선택 규칙, 포맷 템플릿
- Policy: 메모리 라우팅, 검색 강도, 재시도 규칙, z_t 전환 조건
- Rule-set: “어떤 로그를 JML에 남길지”, “어떤 실패를 재시도할지” 같은 운영 규칙


#### 6.5.x (NEW) Instruction-only 형식 수렴(IFC)을 Prompt/Schema 레버로 고정
LLM은 지시만으로도 출력 형식이 잘 맞춰지는 편이다. 이걸 “감”으로 쓰지 말고, **Artifact(계약)로 고정**한다.

- Artifact: `OUTPUT_CONTRACT`
  - `contract_id`: 고정 텍스트 버전(변경 시 반드시 bump)
  - `schema_id`: 출력 스키마 버전(키 집합/타입/필수항목)
  - `validator`: parse + schema-lint + (옵션) roundtrip normalize
- 운영 규칙:
  - IFC는 **형식 제어**다. 내용 정합은 VERIFY/PROBE로 분리한다.
  - 형식이 맞아도 내용이 틀리면 정상이다(그게 검증 루프가 필요한 이유).
- 계측:
  - signals: `FMT_valid_rate`, `FMT_invalid_rate`, `FMT_schema_mismatch_rate`
  - (옵션) `PROBE_RUN` 확장 키 `format_convergence`로 회귀 스위치화
- 부작용 체크:
  - IFC 강화는 PS_repr(형식 민감도)를 올릴 수 있다.  
    AR/불변성 PROBE로 같이 회귀한다(Playbook §9.1.5, §9.1.4).

#### 6.5.2 Evaluator E: (p_t, r_t) 생성
- 출력:
  - `p_t ∈ {0,1}`: 후보가 현재 버전보다 “더 낫다”면 1
  - `r_t ∈ 𝒮`: **텍스트 피드백**(왜/어디서/어떻게)
- 입력(권장 합성):
  - Verifier 점수(정확도/일관성/금지사항 위반)
  - QP 메타신호(불확실성, 충돌 탐지, 비용 대비 효율 Q/M)
  - 태스크 메트릭(성공률, EM/F1 등)
  - (가능하면) 사용자 피드백/수정 요구
- 운영 팁(바이어스 완화):
  - A/B 순서를 섞거나(AB/BA) 최소 2회 평가해서 일관된 결론만 채택

#### 6.5.3 Proposer/Orchestrator M: 후보 생성
- 입력:
  - 현재 최고 버전 `x_t*`
  - 최근 피드백 버퍼 `R_t = {(x_i, r_i, metrics_i)…}` (최근 k개만 권장)
- 출력:
  - 후보 `x_t` (가능하면 **작은 diff**로 수정)
- 원칙:
  - “피드백을 반영하되, 나머지는 최대한 보존” (회귀 방지)
  - 후보 생성에도 BG 예산을 적용(무한 수정을 막기)

#### 6.5.4 업데이트 규칙(권장) + 롤백
- `p_t = 1`(승리):
  - `x_t* ← x_t`로 승격(운영 버전 교체)
  - 단기 피드백 버퍼는 리셋(새 기준으로 다시 쌓기)
  - **롤백 토큰/직전 안정 버전**은 항상 보존
- `p_t = 0`(패배):
  - `x_t*` 유지
  - 피드백만 누적해서 다음 후보 생성에 사용

#### 6.5.5 JML 기록 필드(Artifact 튜닝용 권장)
- `artifact_id`: 어떤 아티팩트인지(예: `rag_answer_prompt`, `mem_route_policy`)
- `base_version`, `candidate_version` (또는 hash)
- `diff / patch`(가능하면) 또는 `candidate_snapshot`
- `p_t`, `r_t`
- `eval_suite_id`(어떤 벤치/샘플로 평가했는지)
- `metrics`: 품질(Q), 비용(M), 효율(Q/M), 실패 모드 태그
- `judge_config`: evaluator 모델/프롬프트/규칙 버전
- `rollback_token`: 즉시 복구 가능한 포인터

#### 6.5.6 스케줄링(현실적 운용)
- **배치 튜닝**: 하루/주 단위로 “튜닝 윈도우”를 잡아 후보를 몇 스텝만 돌린다.
- **인터랙티브 튜닝**: 사용자가 특정 불만을 명시했을 때, 작은 A/B로 1~2회만 빠르게 갱신한다.
- 어떤 경우든 BG(예산/조기종료)는 “튜닝 루프”에도 적용한다. (튜닝이 낭비가 되면 본말전도)

#### 6.5.7 최소 구현 체크리스트
- [ ] artifact registry(artifact_id → 현재 버전/파일 경로)
- [ ] A/B runner(같은 입력 세트로 두 버전 비교)
- [ ] evaluator prompt(“어떤 케이스에서 왜”를 강제)
- [ ] JML 기록(artifact 튜닝 전용 필드 포함)
- [ ] 승격/롤백(운영 버전 교체 + 즉시 복구)


#### 6.5.8 (NEW) PACEvolve식 실패모드 3종을 ‘튜닝 루프 안전장치’로 내장

PACEvolve(arXiv:2601.10657)가 지적한 실패모드 3종은, 로컬에서도 그대로 터진다. 이름만 바꿔서 봐도 된다.

- Context Pollution = “실패 히스토리가 후보 생성 프롬프트를 오염시켜 점점 한쪽으로 기울어짐”
- Mode Collapse = “조금 좋아진 듯 보이다가 같은 형태의 해법에 고착(탐색이 죽음)”
- Weak Collaboration = “병렬 후보를 돌려도 협업이 안 되고, 어설픈 합성으로 퇴보”

권장 최소 대응(새 모듈 필요 없음):
- **HCM(계층 컨텍스트) 흉내내기**: `generation_ctx`와 `selection_ctx`를 분리하고, generation에는 ‘프루닝 요약’만 넣는다.
- **MBB(모멘텀 백트랙)**: stagnation이 누적되면, 더 깊게가 아니라 `rollback_token`으로 **안정 버전으로 돌아가 분기**한다.
- **Self-adaptive sampling**: 후보 다양성/개선 정체에 따라 refine:crossover 비율을 자동 조절한다.

#### 6.5.9 (NEW) Ambiguity-aware 업데이트(Agent0식) = “불확실하면 덜 배운다”

Agent0(arXiv:2511.16043)가 실용적으로 건진 포인트는 하나다: **불확실하면 업데이트를 줄여라**.

- `ambiguity_score`(권장):
  - A/B 판정 표결의 분산, evaluator 간 불일치율, 또는 같은 케이스 다중 샘플의 승패 변동성
- 정책:
  - `ambiguity_score`↑ 이면 `candidate_selector_w`↓ 또는 `promotion=HOLD`
  - 대신 `probe_need_tags`를 남겨 “추가 평가 케이스 생성(Curriculum)”으로 넘긴다.

#### 6.5.10 (NEW) 이벤트/로그 최소 계약(Artifact Self-Tuning 전용)

Logging Appendix의 `ARTIFACT_TUNE_*` 이벤트를 최소로 남기면, 나중에 회귀 분석과 자동 복구가 가능해진다.

- `ARTIFACT_TUNE_CANDIDATE`: 후보 제안(artifact_kind/id, base_version, candidate_version/diff_hash)
- `ARTIFACT_TUNE_EVAL`: A/B 결과(scores, ambiguity_score, eval_suite_id/version)
- `ARTIFACT_TUNE_COMMIT`: 승격(승리 이유 요약, rollback_token)
- `ARTIFACT_TUNE_ROLLBACK`: 롤백(원인 태그 + 복구 대상 버전)


### 6.6 (NEW) Verifier를 “거시 belief 필터 + 선택적 줌인”으로 재정의 (Ehrenfest식 가성비)
**문제**: 로컬 환경에서 “토큰/툴/메모리 전체 히스토리” 위에 항상 무거운 검증을 올리면 비용이 폭발한다.  
**해법**: (e_t, z_t, QP 요약)처럼 저차원 거시 상태를 먼저 추적하고, 위험 신호가 있을 때만 미시로 내려간다.

#### 6.6.1 Macro-belief(가성비) 층
- 입력: `macro_obs_t = (e_t, z_t, qp_summary_t, budget_stats_t)`
  - (권장) `macro_obs_schema_id`/`macro_obs_hash`로 슬롯/정규화를 고정해, 배치 재생성과 회귀 분석이 가능하게 만든다.
- 목표: 다음 사건을 예측/감지
  - 실패모드/조기종료/효율 붕괴(Q/M↓)
  - 위험 attractor(루프 고착, 망상적 검색, 불안정 전환)
- 구현(최소, SSM-lite):
  - (1) **macro_state_id 생성**: `macro_obs_t = (e_t, z_t, qp_summary_t, trace_t?, budget_stats_t)`를 고정하고,
    - 오프라인에서 클러스터링(권장: k-means K=12~32, v0.1은 16~24)으로 centroid 세트를 만든 뒤 `macro_state_version`으로 식별한다.
    - 온라인에서는 최근 boundary의 `macro_obs_t`를 centroid에 할당해 `macro_state_id`를 만들고, 거리/softmax로 `macro_state_confidence`를 함께 산출한다.
  - (2) **전이 모델 P̂ 업데이트**: boundary close마다 (prev→curr) 전이를 카운트하고 EMA로 누적해 `P_hat`를 유지한다.
    - smoothing(권장): add-α(α=0.5~1.0) + row-normalize
    - drift 방지: `macro_state_version`이 바뀌면 P̂를 리셋하거나 별도 버전으로 분기한다.
  - (3) **위험 점수/트리거**: `risk_score = P(next ∈ RiskSet | curr)` 또는 실패율/early_stop율 기반의 `state_risk[m]`를 유지해,
    - `risk_score`↑, `closure_score`↓, `residual_ratio`↑ 같은 조합에서만 Zoom-in을 트리거한다(단일 신호 맹신 금지).

> 위치: 이 층은 **Verifier/Control용 거시 belief 필터**다. Evidence/Claim 권위를 만들거나 바꾸지 않는다.
> 상세 구현/운영 파라미터는 Playbook §4.13을 따른다(Logging은 Appendix의 JML/digital_twin 필드).


#### 6.6.1a (NEW) A(Analysis Store)와의 결합: SSM-lite는 “배치로 돌리고, 온라인은 할당만”
SSM-lite는 딱 배치 작업에 맞는 애다. 온라인 루프에 끼워 넣으면 비용/진동/오염이 늘어난다.

- 권장 아키텍처(표준)
  1) 온라인: Boundary에서 `macro_obs_t`를 커밋하고(로그), **최근 centroid에 할당**만 수행
  2) 오프라인(옵션 A): `macro_obs_t`를 모아
     - centroid를 재학습하고(`macro_state_version` 증가)
     - `P_hat` 전이행렬 및 `state_risk[m]`를 재산출
     - `RiskSet`/threshold를 업데이트(offline-config)

- 데이터 소스(권장)
  - Raw Event Log / JML(원본)
  - 파생 스토어(옵션 A) Parquet:
    - `events_flat`: STATE_SNAPSHOT/SCORE_REPORT에서 `macro_obs_t` 재구성
    - `signals`: Cost/WL/τ/Q/M 축의 롱 포맷(상관/지연 분석)

- 문서/스키마 연결
  - Playbook: `OPS_PLAYBOOK.md` §8.4(ETL/뷰/자원 캡)
  - Logging: `SSOT_LOGGING_POLICY.md` §12.4(파생 스토어 계약)
  - Schema: `SSOT_SCHEMA_BUNDLE.zip`(`SSOT_SCHEMA_BUNDLE.zip ▸ schema/analysis_*`)

> 결론: 온라인은 “할당/트리거”만, 오프라인은 “학습/재산출”을 맡겨라. 이게 로컬에서 가장 덜 사고 난다.


#### 6.6.2 Zoom-in(비싼) 층
- 트리거:
  - `macro_state_id`가 위험 상태로 진입
  - `closure_score` 급락(메타상태가 예측력을 잃음)
  - `residual_ratio` 급등(UBB로 설명 불가한 업데이트/조합)
  - BG가 반복적으로 early_stop을 걸어도 개선이 없음
- 행동:
  - 해당 구간의 원문 컨텍스트/툴 로그/메모리 증거를 꺼내 정밀 검증
  - 실패 원인을 태깅해 JML에 기록(회귀 방지)

#### 6.6.3 JML Retrieval 키 권장
- 기본 retrieval 키를 텍스트 임베딩 단독에서
  - **(e_t + QP 요약 + z_t + adapter_profile)** 기반 `macro_key`로 병행/전환한다.
- 목적:
  - “같은 거시 상태에서 반복되는 실패”를 빠르게 재호출해, 규칙/정책을 더 빨리 고친다.


## 7. 기대효과(이번 세션 연구의 핵심 기대효과)
- **운영 안정성**: 무한 재시도/무한 추론 루프 억제
- **비용 효율**: 동일 성능 대비 토큰/시간 절감 (Q/M 상승)
- **자기개선 가속**: 실패 로그가 “왜 멈췄는지”까지 포함하므로 학습 데이터 품질이 좋아짐
- **모듈 분업 명확화**: QP는 계측, Sidecar는 상태, BG는 예산/중단, JML은 증거 저장
- **현장 디버깅 쉬움**: “예산-중단”이 로그로 남아 원인 추적이 빨라짐

---

## 8. Sidecar e(t) 수식 인터페이스 v0.1

### 8.1 상태 갱신(예시)
- 입력 관측: `o_t`
- QP 출력: `q_t = QP(o_t, logs_t)`
- 업데이트:
  - `e_{t+1} = f_θ(e_t, q_t, r_t)`  (r_t는 보상/결과 요약)
- 읽기:
  - `u_t = g_ϕ(e_t)`  (정책에 필요한 요약/게이팅 신호)

### 8.2 정책 개입(예시)
- 정책:
  - `a_t ~ π(a | x_t, e_t, z_t, g_t)`
- 여기서 **Budget Governor(BG)** 를 정책 헤드로 추가:
  - `(tau_budget, M_budget, stop_policy) = BG(e_t, z_t, q_t, JML_stats)`
- 실행 루프는 BG 출력에 의해 다음이 제어된다:
  - 최대 스텝/토큰/시간 제한
  - 조기 종료 조건
  - 모드 전환(z_t 업데이트) 트리거

### 8.3 학습 목적(개요)
- 기본적으로는 “다음 스텝에서 더 나은 정책/상태 업데이트”가 목적
- 메타 레벨에서:
  - e_t가 “예측 가능한 제어 신호”가 되도록(안정성)
  - BG가 “현실적인 예산”을 주도록(효율)
  - z_t가 “실제로 도움이 되는 커밋”이 되도록(모드 품질)
- 형식적으로는 (task reward + 안정성 regularizer + 효율 regularizer) 형태로 잡을 수 있다.
  - `L_meta = -E[task_reward] + λ_stab * Var(e_t) + λ_eff * penalty(Q/M ↓) + ...`

### 8.4 최소 구현 체크리스트
- [ ] QP: tau/Q/M을 계산해 로그에 남긴다(대충이라도)
- [ ] JML: tau_gen/tau_mem을 분해해 누적 통계를 낸다
- [ ] Sidecar: e_t에 tau/Q/M(또는 요약)을 반영한다
- [ ] BG: tau_budget + Q/M 조기 종료를 실제 루프에 연결한다
- [ ] z_t: 모드 전환과 히스테리시스를 최소 구현한다
- [ ] (NEW) fast trace: 지수감쇠 trace 유지 + 로그(trace_norm/trace_delta_norm)
- [ ] (NEW) etype: monitor-only로 점수/선택 기록 → 안정성 확인 후 게이팅 연결
- [ ] (NEW/선택) adapter/route 게이팅: 작은 adapter bank부터 적용(없으면 sampling/retrieval만 게이팅)

---

## 9. 운영 규칙 요약(상위 규칙의 문서화)
- 제어계 핵심 계측축: **τ, Q, M**
- 모듈별 τ 분해: **τ_gen / τ_mem** 을 경험적으로 추정해 JML에 누적
- 모든 훈련/실험/긴 추론은:
  - **τ_budget(n,p)** 로 상한을 관리하고,
  - **Q/M 기반 조기 종료**로 효율 붕괴를 막는다.
- 이 규칙은 “새 레이어”가 아니라, **Sidecar 내부의 Budget Governor 서브모듈**로 구현한다.
