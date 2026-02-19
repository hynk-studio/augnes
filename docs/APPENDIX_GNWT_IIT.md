# Augnes Local Appendix: GNWT×IIT Transplantation Remainders v1.2.2+17 (pack r20.1p4p21, last-content r20.1p4p21)

<!-- DOC_ID: GNWT_IIT_APPENDIX -->
<!-- ROLE: 배경/연구 부록 -->
<!-- SSOT: non-SSOT -->

> **문서 역할:** 배경/연구 부록  
> **SSOT 지위:** non-SSOT  
> **이 문서에서 허용되는 변경:** 설명/동기/아이디어. (운영 규칙/필드 계약을 새로 만들지 않음)  
> **상위(업스트림) 기준:** SSOT_CANONICAL.md  
> **하위(다운스트림) 영향:** 없음(참고용)  

---

> 패치: **(논문 이식) "Macaque prefrontal cortex integrates multiple components for metacognitive judgments of working memory"(Ning et al., Neuron 2026): Meta-WM(working-memory confidence) = {wm_strength, uncertainty, trial_history, arousal} 통합 신호 → MUSE-lite/AVR의 전략 선택·opt-out(VERIFY/RETRIEVE/ASK) 게이트 + (권장) 이벤트 payload 확장(wm_meta, wm_dependency_hat) 포인터 추가** (2026-02-05, r20.1p4p14)
> 패치: **(논문 이식) "Quantifying the compressibility of the human brain"(Weaver et al., 2026): Compressibility Curve(정규화 엔트로피 vs 상관 제약 비율) → CompIndex(저비용 프록시) + PROBE(comp_curve_v0) + Analysis Signal 축 + SRF/Downshift 트리거(권장)** (2026-02-02, r20.1p4p4)
> 패치: **(논문 이식) "Koopman Invariants as Drivers of Emergent Time-Series Clustering in Joint-Embedding Predictive Architectures"(AAAI 2026 / arXiv:2511.09783): KJEPA(near-identity linear predictor) 기반 무감독 레짐 분해 → DigitalTwin(macro_state_id)/BSL change-point/PROBE/Logging 결합** (2026-02-02, r20.1p4p3)
> 패치: **(뉴로모픽 모티브 이식) "Cerebellar components of the human language network"(Neuron 2025): CSB(Cerebellar Satellite Bank) 도입 — Sat-L(Δlogits)·Sat-M(Δpolicy_score) 출력 분리, SRF 블랙리스트 확장, CSB PROBE suite(선택성/혼합성/분리 위반) 추가** (2026-01-31, r20.1p4p2)
> 패치: **(논문 이식) "Structure in noise"(Neuron 2026): SA-axis 변동성(variability) 그래디언트 + recurrent connectivity/Reciprocity Index(RI) → VAR profile(QUENCH/RECURRENT) 레버·계측·PROBE·Self-Graph 연결** (2026-01-31, r20.1p4)

> 패치: **정합성 핫픽스: 스키마 번들 파일명/경로 포인터를 r20.1p1로 갱신** (2026-01-30, r20.1p2)
> 패치: **(문서 포인터 갱신) r20.1 파일명/링크 정합화** (2026-01-29, r20.1)
> 패치: **(문서 포인터 갱신) r19 파일명/링크 정합화** (2026-01-24, r19)
> 패치: **Stop-Rule Firewall(SRF) 명문화: τ_stop 입력 화이트리스트/블랙리스트 + ‘사실상 우회’ 경로 차단** (2026-01-30, r20.1p3)

> 패치: **AR(추상성) PROBE suite + Latent Axis Bank + instruction-only 형식 수렴 레버 정식화** (2026-01-23, r18)

> 패치: **TRM/CGAR 운영 가성비 이식(PDC/halting/HSW)은 제어 이식으로만 유지(포인터 추가)** (2026-01-20, r14)


> 패치: **문서 정합성 정리(파일명/용어 토큰 표준화)** (2026-01-10, r4)

> 패치: **스키마 번들/참조 정리 + 정체 불명 산출물 언급 제거** (2026-01-10, r5)

> 패치: **Intervention 합성 셔플 불변성 테스트 + 스테이지 고정(pre/mid/post) + CSI 순서 교란 포함** (2026-01-13, r6)

> 패치: **SketchPad(저해상도 시각 스케치/latent) 인터페이스 + 계측 포인트 추가** (2026-01-13, r7)

> 패치: **문서 세트 병합(r9) 파일명/포인터 정합화** (2026-01-14, r9)

> 패치: **문서 세트 r10 정합화(포인터 업데이트 + Sidecar 포함)** (2026-01-14, r10)

> 패치: **문서 세트 r12 정합화(포인터 업데이트)** (2026-01-19, r12)

> 패치: **옵션 A(Analysis Store) 도입에 따른 문서 포인터(r12) 정합화** (2026-01-19, r12)

> 패치: **세션 시작 변화점(행동 상태) 번역 포인터 추가(BSL: session_start + bstage/bstate)** (2026-01-19, r12)

> 상태: **Research Appendix / Non-normative** (필드/규약을 추가하지 않음. Canonical Spec이 우선: `SSOT_CANONICAL.md`)


이 문서는 **메타인지체 아키텍처 정리 v2.2**에 이미 이식한 두 조각  
- (A) *Workspace Update Pulse* (이벤트 기반 업데이트 펄스)  
- (B) *task-irrelevant 중심 프로빙 배터리*  
를 제외하고, GNWT vs IIT iEEG 연구(본 논문 + 데이터 디스크립터)에서 **남겨둘 만한 내용**을 “부록/보완 자료” 형태로 정리한다.

핵심 목적은 2가지다.
1) 본문을 비대하게 만들지 않고도, “왜 이런 설계/평가를 택했는지” 근거를 보존  
2) 나중에 평가·연구용으로 더 깊게 파고들 때 바로 쓸 수 있게 **실험 스펙/해석 리스크/확장안**을 남김

> v2.2에서 IGL(A 추정)·희소 영향 그래프(A_sparse)를 도입했으므로, 본 부록의 ‘Connectivity’ 번역/확장안은 그 인터페이스에 맞춰 갱신(v1.2.1).
> 추가: NEI-SS(DCGT/IRL: state-space 방향성 결합 J(t) + entropy-flow 기반 비가역성 로그)와의 참조 연결을 최소 수준으로 포함.

---

## 1) 통합 전략(결정 기록): 왜 본문에 더 안 넣었나

### 1.1 본문(아키텍처)에는 ‘규율 + 루프 + 최소 평가’만 남기는 게 최적
- 아키텍처 문서의 역할은 “작동하는 시스템 설계”다.  
- GNWT/IIT 쪽 세부는 “근거 자료 + 추가 평가 스펙” 성격이라, 본문에 섞으면 **길이만 늘고 실행이 느려진다**.

### 1.2 부록으로 남길 가치가 큰 항목만 보존
다음 항목은 ‘설계를 뒤엎는’ 내용이 아니라, **평가 및 해석의 정확도**를 올려주는 정보다.
- (i) 예측(P1~P3) 원문 수준의 정의(무엇을 테스트했는지)  
- (ii) iEEG 분석 단위(activation / decoding / duration tracking / connectivity)의 구체 형태  
- (iii) 어떤 결과가 “이론 반박”이 아니라 “이 패러다임에서의 미관측”일 수 있는지(해석 리스크)  
- (iv) 데이터셋 재사용을 위한 구조/품질(QC) 포인트
- (v) REM/수면 계열 결과는 “직접 이식”이 아니라, **(국면 분리, 이벤트성 업데이트+잠복 유지, 선택적 리플레이/정리)** 같은 운영 설계 선택을 뒷받침하는 근거로만 사용한다.

---



### 1.3 이 부록의 프로젝트 문서 포인터 (Iteration 3 결합)

- 본 부록은 **Non-normative 연구/해석 저장소**이며, 규약/권한은 Canonical Spec이 우선한다.
- 아래 항목들은 “전략 텍스트”가 아니라, v2.2의 **Intervention/Policy 계층(개입 라이브러리 + 정책 레버)** 로만 흡수한다.
  - **Intervention/Policy Layer Spec**: 개입의 `when/effect/guardrails` 정식 스펙
  - **StateLabel & PolicyLever Catalog**: 상태 라벨과 정책 레버의 단일 어휘
  - **Metrics·Logging·Policy Appendix**: 이벤트/지표로 관측(특히 `STATE_SNAPSHOT`, `POLICY_UPDATE`, `INTERVENTION_*`)
- (현행 문서 세트)
  - Canonical Spec: `SSOT_CANONICAL.md`
  - Implementation Playbook: `OPS_PLAYBOOK.md`
  - Metrics/Logging Appendix: `SSOT_LOGGING_POLICY.md`
  - Sidecar/QP/z_t Spec(모듈 스펙): `MODULE_SIDECAR_QP_ZT_SUMMARY.md`
  - Integration Map: `WIRING_INTEGRATION_MAP.md`
- 이 부록에서 자주 등장하는 번역 예시
  - (추가 참고) ‘세션 시작 변화점/행동 상태’(iHSMM 계열 행동학습 모델) → BSL(session_start + bstage/bstate 라벨)
  - “저대역 방송/inner speech/SRP” → intervention 후보 + Gate prior(override 금지)
  - “안정화 제어(EfficientFlow 류)” → jerk cap/hysteresis/cooldown + intervention caps(주입/롤백/쿨다운)
  - “연결성/방송/메시지 그래프” → 관측 지표(Workload/Sync/EES/HAP proxy) + 대시보드 항목


## 2) GNWT vs IIT ‘예측’의 원형(요약 + Augnes 번역)

### 2.1 Prediction 1: 내용(content)의 위치
- GNWT 강형: 전두(PFC)가 의식 내용 접근성의 핵심이므로, PFC에서 내용 디코딩/표상이 강해야 한다.
- IIT 강형: 후방(posteriors)이 의식 내용의 핵심 “hot zone”이라, 후방에서 내용 디코딩/표상이 강해야 한다.

**Augnes 번역(보존할 만한 형태)**
- “내용 저장소(표상 뱅크)”와 “제어/접근성(워크스페이스/라우터)”를 분리하되,
- 제어 모듈이 ‘내용의 정밀도’를 키우는지(=이상 신호)와 ‘선택/검증/행동’을 키우는지(=정상)를 분리 평가한다.

### 2.2 Prediction 2: 시간 역학(지속 vs 점화 vs 잠복)
- IIT 강형: 자극이 지속되는 동안 후방 표상/활성이 지속되며 duration을 추적한다.
- GNWT 강형: onset/offset의 짧은 업데이트(ignition) + 그 사이 구간은 activity-silent(잠복)일 수 있다.

**Augnes 번역**
- “연속적 상주 컨텍스트” 대신 “이벤트성 업데이트 + 잠복 유지”가 비용·안정성 측면에서 자연스럽다.
- 단, 뇌에서 offset 점화가 미관측이었다고 해서, Augnes에서 ‘오프셋’을 하드코딩할 필요는 없다(이미 본문 v2.2에서 이벤트 기반 트리거로 바꿔 처리).

### 2.3 Prediction 3: 연결성(통합/방송)
- IIT 강형: 후방 피질 내(또는 후방 네트워크)에서 지속적 동기화(특히 고주파 대역)가 나타나야 한다.
- GNWT 강형: 장거리(후방↔전두) 연결/재구성이 업데이트와 결합된다.

**Augnes 번역**
- 상시 고대역 결합(항상 공유 KV, 항상 전역 동기화)은 낭비/오염 가능성이 크다.
- ‘요약+링크’의 저대역 방송 + 필요시만 고대역 재계산이 더 합리적이라는 근거로 보존.

---

## 3) iEEG operationalization 상세(나중에 연구/평가 확장할 때 쓰는 스펙)

이 연구에서 “이론 검정”은 대체로 아래 4축으로 operationalize 된다.

### 3.1 Activation(활성): high-gamma / ERP
- 시간 정렬: onset 정렬(권장), offset 정렬(선택).
- 지표: (a) baseline 대비 high-gamma 증가(전형적), (b) ERP/저주파 유발반응.
- 해석 포인트:
  - 업데이트(점화)를 activation transient로 볼 때는 “짧고, 특정 창에 몰리는지”가 중요하다.
  - 지속 표상을 activation으로 볼 때는 “duration 조건에 비례해서 유지되는지”가 중요하다.

**Augnes로 옮길 때**
- activation = “고비용 추론/검증/재계산이 실제로 수행된 이벤트”로 치환 가능
- latency/비용/추론깊이(test-time compute) 기록을 ‘점화’ 대용 지표로 쓸 수 있다.

### 3.2 Content decoding(표상): 분류/일반화/시간 일반화
- 핵심: “무슨 정보가 어디서 얼마나 오래 디코딩되는가”
- 좋은 축: task-irrelevant 속성(보고/목표 혼입이 적음)

**Augnes로 옮길 때**
- decoding = 내부 상태(Self-Graph 포인터, Sidecar eₜ, Workspace 요약)가 “어떤 속성을 얼마나 안정적으로 재현할 수 있는지”로 대응
- (옵션) cross-temporal generalization을 “컨텍스트 스위치/툴 호출 이후에도 같은 속성을 유지하는가”로 재해석 가능

### 3.3 Duration tracking(지속시간 추적): 조건-의존 지속성
- 목표: 0.5/1.0/1.5s 조작이 실제 신경 신호의 ‘유지 길이’에 반영되는지 본다.
- 해석 주의: ‘지속’은 전체가 깔리는 게 아니라 sparse하게 나올 수 있다.

**Augnes로 옮길 때**
- duration tracking = “핵심 상태는 얼마나 오래 유지해야 하는가”를 정책으로 설계
- 유지가 sparse한 편이 자연스럽다면, ‘핵심만 유지 + 주변은 필요시 복구’ 정책이 타당

### 3.4 Connectivity(연결성): PPC / DFC
- PPC(위상 일치)나 DFC(진폭 기반 정보량/상관 구조)를 쓴다.
- 해석 주의:
  - 위상 동기화는 evoked 성분 영향(자극 유발)을 분리해야 의미가 선다.
  - “콘텐츠-특이 연결성”은 샘플 수/전극 커버리지에 민감하다.

**Augnes로 옮길 때**
- connectivity(관측) = 모듈 간 메시지 흐름/의존성 그래프(누가 누구를 호출/참조했는가)로 치환 가능
- connectivity(추정) = IGL(Influence Graph Learner)이 산출하는 **운영상 영향도 행렬 A**로 별도 기록  
  - `A_dense`: 윈도우 학습 직후의 밀집 영향도(노이즈 포함)  
  - `A_sparse`: top-prob 스타일 희소화로 “읽을 수 있는 골격”만 남긴 버전(대시보드/알람용)  

- (추가, 옵션: HAG) Influence/Association 레이어를 “구조적 프라이어”로 유지하고 싶다면,
  HAG(Homeostatic Associative Growth) 방식으로 edge grow/prune을 수행해 `W_HAG`(또는 ΔW)를 기록할 수 있다.
  - 주의: `W_HAG`는 Evidence가 아니라 **운영상 구조(prior)** 이며, Claim 승격/사실 판정의 근거로 쓰지 않는다.
  - 권장: Boundary에서만 커밋하고(`shadow|apply`), 업데이트 cap/cooldown을 둬서 구조가 흔들리지 않게 한다.
- connectivity(추정, 고급 옵션: NEI-SS) = DCGT(상태-공간 모델)로 시간가변 **방향성 결합 J(t)** 를 추정하고, IRL로 **σ_flow / σ_int(=orig-shuffle) / σ_per_act** 를 기록해 “방향성 + 비가역성”까지 계량
  - 권장 운용: `A_sparse`는 **온라인/대시보드**(가벼움), `J(t)`·σ 계열은 **오프라인 감사/원인분해**(무거움)로 병행
  - 주의: J(t)·σ도 ‘진짜 인과’ 선언이 아니라 **유효 인과/유효 방향성**으로만 취급
- 주의: 여기서 A는 **인과 그래프가 아니라 운영상 영향도(operational influence)** 프록시다. 관측 누락/숨은 공변량이 있으면 “그럴듯한 상관”이 될 수 있다.
- 저대역 방송(요약+링크)과 고대역 재계산(원문/근거/툴 결과)의 혼합이 안정적일 가능성이 높음


---


### 3.5 Perturbational Complexity(PCI-A) → Augnes A-PCI 이식 메모

- 논문(arXiv:2512.19155v1)에서 **PCI-A proxy**는 다음 ‘섭동-기록-압축’ 절차로 정의된다:
  1) Workspace에 **짧은 노이즈 펄스**를 주입
  2) 이후 `T` step의 workspace 궤적을 수집
  3) 궤적을 이진화(binarize)한 뒤
  4) Lempel-Ziv 계열(예: gzip)로 압축해 `compressed_bytes`를 복잡도 proxy로 사용
- 운영상 핵심은 raw 절대값보다 **대조(contrast)**다:
  - 논문에서도 raw PCI-A가 ‘실패-기인 난수성’으로 과대평가될 수 있음을 경고한다.
  - 그래서 `ΔPCI = mean(correct) - mean(incorrect)` 같은 형태의 contrast를 함께 둔다.
- Augnes 문서에서 쓰는 `A-PCI`는 이 PCI-A proxy를 **운영 계측용**으로 가져온 것이다.
  - 설계 포인트: ‘의식’ 판정이 아니라, **루프 건강/방송-통합/섭동 회복력**의 정량 힌트.
- 로그/스키마 연결:
  - Logging Appendix §11.7(정의) + §12(`PULSE_TRIGGER`/`PROBE_RUN_*`)를 따른다.
  - `PULSE_TRIGGER.pulse_kind = perturbation`로 PCI-A 측정 펄스임을 명시한다.

> 결론: A-PCI는 “멋” 지표가 아니라 **실패 모드 탐지용 계측**이다. raw를 맹신하지 말고(특히 불안정/오프폴리시일 때), ΔPCI 같이 ‘성공 앵커’가 있는 지표로 운영해야 한다.

### 3.x 공학적 훅: iEEG/‘의식 지표’ → AR 프로브 + LAB로 흡수(권장 최소)
이 부록에서 말하는 GNWT/IIT 계열 ‘지표’는, Augnes Local에선 직접 재현하기보다 **표현 진단(AR)과 축 레지스트리(LAB)** 로 흡수하는 게 비용 대비 낫다.

- 번역 원리:
  - (1) “어떤 변수가 분리되어야 하는가”를 먼저 정하고(`C_min/R/O` 최소 이분 라벨부터),
  - (2) 그 다음 “어디서 뽑을 건가”를 고른다(`z_t` vs backbone pooling),
  - (3) 마지막으로 “축으로 승격할 가치가 있는가”를 AR/불변성 회귀로 걸러낸다.
- 실전 결합:
  - GNWT/IIT에서 얻고 싶은 건 대개 “전역 접근성/통합성” 류의 *저차원 요약*이므로,
    후보 축은 LAB에 넣고(`axis_type=probe_linear|pca|sae_feature` 등),
    AR(Decodability/CCGP)로 `R/O` 분리 기여를 확인한 뒤 승격한다.
- 포인터:
  - Canonical: AR 정의 + LAB 권한 분리(§5.1.1.2~§5.1.1.3)
  - Playbook: AR/LAB 운영(§9.1.5~§9.1.6)
  - Logging: `abstractness_ar`, `axis_bank` 확장 키 + signals 축(§12.2(6), §12.4.4)


## 4) 데이터셋 재사용 팁(‘나중에 진짜로 써먹으려면’ 필요한 것)

### 4.1 데이터는 “분석 가능하게” 구성돼 있다
- 멀티모달: iEEG + 행동 + 안구추적 + 전극 재구성(좌표/라벨) + 임상 메타데이터.
- BIDS 구조 제공, 이벤트/채널/전극 좌표 TSV, Laplace 참조용 매핑 포함.

### 4.2 QC/동기화는 신뢰 포인트
- 포토다이오드 기반 이벤트 정렬(프레임 기준), 센터별 동기화 보정 절차를 포함한다.
- 공개데이터에서 흔한 “타이밍 붕괴” 리스크가 상대적으로 낮다.

### 4.3 재사용할 때 최소 체크리스트
- (권장) task-irrelevant 조건부터: confound 최소화
- (권장) 전극 커버리지 편향: 참가자별 ROI 가용성 확인
- (권장) high-gamma + ERP 둘 다 보고, 디코딩/지속/연결성은 단계적으로 확장

---

## 5) 본문 v2.2에 “추가로 넣을 수도 있지만, 일단은 부록으로 남기는” 확장안

### 5.1 Cross-temporal Stability Test (옵션)
- 내부 상태가 시간/컨텍스트 변화에 얼마나 강한지(표상 안정성) 계량화.
- 구현: 컨텍스트 스위치(툴 호출, 다른 태스크, 기억 검색) 전후로 같은 속성 probe.

### 5.2 Event Taxonomy(업데이트 이벤트 분류 체계) 정교화
- v2.2에선 이벤트 기반 트리거를 넣었지만, 세분 분류(모순/목표 변경/근거 유입/실패/위험 신호)에 따른
  펄스 강도·쿨다운·검증 깊이 정책을 더 조밀하게 만들 수 있다.
- (Iteration 3 결합) 위 이벤트 분류는 **Metrics·Logging·Policy Appendix §12(Event Schema)** 를 단일 기준으로 삼고, 개입은 `INTERVENTION_*` 이벤트로 별도 기록한다.


### 5.3 Connectivity를 “메시지 그래프 + 영향 그래프(A)”로 계측하는 메타 대시보드

### 5.4 Broadcast distance(거리감) = 저대역 방송의 공학적 구현 후보(옵션)
- 이 부록에서 반복해서 나오는 ‘저대역 방송(요약+링크)’을, Augnes에서는 **Self-Reflection(Inner Speech)** 같은 저비용 제어로 구현할 수 있다.
  - 핵심은 “추론을 더 하는 것”이 아니라, **결정 직전의 상태를 한 번 더 ‘다른 표기법’으로 재기술**해서 불일치를 드러내는 것.
- 운영상 지위:
  - Self-Reflection 산출물은 **뷰(view)** 이며, 외부 사실의 Evidence가 아니다.
  - 허용 용도는 Gate 보조(오류/근거 부족/목표 이탈 노출)와 디버깅이다.
- 구현/로그/예산 규율은 Canonical/Appendix에 둔다(본 부록은 근거/해석 맥락만 제공).

- 목적: “누가 누구를 많이 불렀나(관측)”와 “누가 누구를 상태적으로 흔드나(추정)”를 분리해서 본다.
- 입력(관측): 모듈 호출/참조 그래프(콜그래프/메시지 그래프)
- 입력(추정): IGL이 산출한 `A_sparse`(top-prob 희소화된 영향 골격)

- (옵션, 구조 프라이어) `W_HAG`(HAG 업데이트로 유지되는 Influence 골격)도 함께 올리면
  “관측 콜그래프(누가 누구를 불렀나)” vs “추정 영향(A_sparse/J(t))” vs “구조 프라이어(W_HAG)”를 분리해서 볼 수 있다.
- (옵션, 추정 고급화) 입력(추정): DCGT의 `J(t)` + IRL의 `σ_int`, `σ_per_act` (NEI-SS)로 **방향성/비가역성/효율**까지 같이 대시보드에 올림
  - 이 조합은 ‘과도 결합’과 ‘루프 폭주’를 **방향성/비가역성 관점**에서 더 빨리 구분하는 데 유리(단, 오프라인 권장)

자동 감지(최소 규칙) 예시:
- **과도 결합(over-coupling)**  
  - 관측: 특정 모듈이 전체 호출의 대부분을 흡수(허브 과대)  
  - 추정: `A_sparse`에서 특정 노드의 out-strength / in-strength가 지속적으로 상위권
- **루프 폭주(runaway loops)**  
  - 관측: 재귀 호출/리트리벌 과잉(짧은 주기 반복)  
  - 추정: `A_sparse`에서 짧은 cycle이 늘어나거나, 특정 feedback edge가 급증
- **저대역 방송 실패(low-band broadcast failure)**  
  - 관측: 요약만으로 유지 실패(재계산/재조회 급증)  
  - 추정: broadcast 관련 엣지(Workspace→모듈/모듈→Workspace)의 영향도가 비정상적으로 커지거나, 반대로 끊겨 있음


---


### 5.4.1 (추가 메모) SRP: Strange-Loop 기반 저대역 방송 + “Honesty-Axis” 운영 가설 (Non-normative)

여기서 말하는 SRP(Self-Referential Processing)는 “의식 주장”이 아니라, **운영 제어 설계**로서의 가설이다.

- 가설 1) **Strange-Loop self-reflection은 broadcast distance(거리감)를 키운다.**  
  - 같은 상태를 ‘한 번 더 다른 표기법’으로 재기술하면, 근거 부족/자기모순/목표 이탈이 더 잘 드러난다.  
  - Augnes 번역: `SELF_REFLECT`를 `VERIFY` 국면의 저비용 개입으로 쓰되, 예산/쿨다운으로 루미네이션만 억제.

- 가설 2) SRP는 “정직/자기기만”을 직접 측정하지 못해도, **운영상 프록시(HAP)** 로는 방향성을 볼 수 있다.  
  - 예: evidence conflict 관련 지표(contradiction/revision/evidence_missing)가 SRP 후에 줄어드는지,  
    또는 VERIFY 전환이 빨라지는지(=근거를 더 요구하는지).

- 가설 3) `five_adjectives` 같은 초저대역 출력은 “요약+링크” 방송의 극단 버전이다.  
  - 비용이 매우 낮고, 상태 수렴/산만(SCS) 같은 운영 지표를 만들기 쉽다.  
  - 단, 이것은 **근거가 아니라 상태 압축**이므로, Claim/Evidence 권위와는 분리한다.

**추천 실험(가벼운 것부터)**
1) 동일 태스크에서 `srp_strange_loop` vs 컨트롤(`history`, `third_person`) 비교:  
   - ΔRuminationIndex, ΔIQS, ΔHAP(프록시) + Gate 선택 변화(VERIFY 비율, COMMIT 속도)  
2) “근거 충돌이 있는 입력” 버킷에서만 SRP를 켰을 때 성능/비용 파레토가 개선되는지  
3) SRP를 ACQUIRE/COMMIT에 넣었을 때 악화되는지(루미네이션/지연) 확인 후, VERIFY-only 편향 고정

> 이 섹션은 Research Appendix 메모이며, Canonical/Appendix에 이미 반영된 운영 규약(뷰/근거 분리, 예산, 쿨다운)을 넘어서는 규약을 추가하지 않는다.



## 5.5 (추가 메모) EfficientFlow-style “안정화 제어”가 여기서 왜 자연스러운가 (Non-normative)

이 부록의 GNWT/IIT 논쟁은 “어디에 내용이 있냐”보다, **업데이트가 이벤트성인지(점화) vs 상주인지** 같은 *시간 역학* 관측으로 실험을 설계했다.  
Augnes Local에 남는 공학적 교훈은 결국 이거다:

- **상시 고대역 결합/상시 재계산은 낭비**고, 시스템은 쉽게 오염된다.  
- 그래서 운영은 “짧은 업데이트 + 잠복 유지 + 필요 시 재계산” 쪽이 더 자연스럽다.

여기서 EfficientFlow-style로 제안된 두 패턴:

- (A) **Batched 후보 선택 + 주기적 리셋**  
  → “한 번 튄 결정을 그대로 연쇄 증폭시키지 말고”, 후보를 작게 여러 개 만든 뒤 **연속성 기준으로 고르는 방식**은  
  뇌의 ‘점화 이벤트’가 시스템 전체를 마구 뒤흔들지 않도록 하는 공학적 대응과 결이 같다.

- (B) **가속도(2차 변화량) 패널티(= jerk-limited update)**  
  → 업데이트를 이벤트로 만들더라도, 그 이벤트가 너무 날카로우면(Δ² 급등) Gate/정책이 발작처럼 반응한다.  
  `Δ`뿐 아니라 `Δ²`를 제한하는 건 “점화는 허용하되, 급발진은 억제”하는 안정화 수단이다.

> 지위: 이건 GNWT/IIT의 ‘신경과학 주장’이 아니라, 그 관측 프레임을 **운영 제어 설계로 번역한 메모**다.  
> Canonical 규약(근거/뷰 분리, 예산/쿨다운, Evidence 경로)은 그대로 유지한다.



## 7) Corticostriatal BCP/ICN 논문 이식 메모 (Nat Commun 2025, s41467-025-67076-x)

> 요지: 이 논문은 “거대한 블랙박스 하나”가 아니라, **더 이상 줄일 수 없는 작은 회로(BCP: biomimetic computational primitives)** 들이 조합되면서
> 작업기억/의사결정/학습 같은 거시적 기능이 나온다는 걸 **스파이킹/필드/동기화까지 포함한 멀티스케일 모델**로 보여준다.
> 그리고 그 과정에서 “초반에 이미 틀릴 조짐”을 내는 **ICN(incongruent neurons)** 류 신호를 찾아내고, 실제 영장류 데이터로 검증했다.

### 7.1 모델을 ‘엔지니어링 블록 다이어그램’으로 재구성하면 보이는 것

논문 모델을 공학 블록으로 바꾸면 대략 이렇게 읽힌다:

- **입력/표상(피질 마이크로-어셈블리)**  
  - 핵심 프리미티브: **L-FLIC(Local-Feedback Lateral Inhibition Circuit)**  
  - 기능(논문 서술 기준): *soft WTA(선택)*, *신호 복원*, *쌍안정/다중안정(유지)*

- **루프 기반 유지(Working-memory = loop maintenance)**  
  - “자극이 꺼진(delay) 동안에도 정보가 유지되는 이유”를  
    **cortex → striatum → pallidum → thalamus → cortex** 루프 스파이킹으로 설명한다.

- **행동 선택/게이팅(기저핵)**  
  - striatum(MSN/TAN) 경쟁 + pallidum/thalalamus 릴레이가 선택을 확정한다(공학적으로는 action-gating).

- **학습/강화(도파민/가소성)**  
  - SNc 도파민 신호가 striatum 쪽 가소성을 조절하고, cortex/striatum의 “학습 속도/규칙”이 다르다(멀티-rate).

- **협응 신호(동기화/위상잠금)**  
  - cortico-striatal beta(대략 16Hz 근방) 동기화가 학습/성공 조건에서 커지는 패턴이 나온다.  
  - 공학적으로는 “모듈이 서로 같은 리듬으로 협업하는지”를 보는 건강 신호에 해당.

- **조기 오류 예측(ICN)**  
  - 초반에 ‘잘못된 선택’ 쪽으로 흘러가는 뉴런 집단(ICN)이 있고, 이것이 훗날의 오답을 예측한다.  
  - 이건 “나중에 틀릴 궤적”을 **commit 전에 잡아내는** 조기 경고로 번역 가능.

### 7.2 Augnes Local로 번역(이식)하면 뭐가 남나

1) **BCP = “프리미티브 단위로 기능을 쪼개라”**  
   - Augnes는 이미 Step Loop/Gate/Verifier/Router로 쪼개져 있는데,  
     이 논문은 그걸 더 밀어붙여 “각 블록은 더 이상 줄일 수 없는 테스트 단위”가 되게 설계하라는 힌트를 준다.  
   - 결과: 디버깅이 ‘거대한 파이프라인’이 아니라 **프리미티브의 조합 오류**로 귀결된다.

2) **L-FLIC → 후보 선택/억제(soft-WTA + 안정화)**  
   - 후보 생성이 과잉이면 hallucination/루미네이션이 터지고, 억제가 과하면 탐색이 죽는다.  
   - 그래서 “국소 억제 + 신호 복원 + 다중안정”을 **CBS/PR + jerk-limited + hysteresis**로 대응시키는 게 자연스럽다.

3) **Loop maintenance → ‘장기 컨텍스트’는 저장만이 답이 아니다**  
   - delay 동안 유지되는 건 “기억 블록에 써서”가 아니라 **루프가 계속 돌기 때문**이다.  
   - Augnes로 치면: idle window나 tool-wait 구간에서  
     `Executive Core(DriveState/GoalStack)` 가 **작게 계속 돌면서** 목표/제약을 유지해야 한다(저대역 유지).

4) **동기화(synchrony) → 모듈 협업의 계측 지표로 뽑아라**  
   - 성공 조건에서 협응이 늘어난다는 관측을 그대로 쓰면,  
     Augnes에서는 “모듈 호출 시퀀스/latency/결과 일치도”로 **ModuleSynchronyIndex** 같은 지표를 만들 수 있다.

5) **ICN → EES(조기 오류 신호)로 이식**  
   - Augnes에서는 ‘ICN 뉴런’ 대신, 아래 같은 **불일치 조짐**이 ICN 역할을 한다:
     - 후보군이 양분됨(동점/서로 다른 계획이 비슷한 점수)
     - verifier가 같은 근거에 대해 반복 충돌
     - EOP 대비 tool 결과가 실패 쪽으로 기울기 시작
     - PE_memory 급증(근거 충돌)  
   - 이걸 `EES ∈ [0,1]` 로 합성해서 **(권장) commit 후보가 뜨기 전에 VERIFY/REPLAN 쪽 선택 확률을 올리는 신호로 사용**하는 게 핵심 이식 포인트.
   - 단, Canonical Stop Rule(`max_a EVC(a) < τ_stop`이면 COMMIT)은 **override 금지**: stop-rule이 발동한 순간에는 EES가 높아도 COMMIT이 우선이다.
  - (SRF) EES/competence 같은 Control/View 신호가 `τ_stop` 자체를 조정하거나 우회하는 경로는 문서/구현에서 금지한다.


### 7.3 문서/스키마에 반영된 형태(요약)

- Canonical: `EES` 타입 + Step Loop 권장 단계(Compute EES) 추가(근거가 아니라 진단).  
- Metrics Appendix: `state_core.ees_w` + `EES_*` 지표, (옵션) `ModuleSynchronyIndex`/`LoopMaintenanceIndex`.  
- Playbook: `compute_ees()` 의사코드 삽입 + 실패 모드/게이트 운영에서 commit-전 차단 루틴 추가.



## 6) 개발-운영 관점 한 줄 요약
- 본문(v2.2)은 **작동하는 설계**에 집중하고,
- 이 부록은 “왜 그 설계가 합리적인지”를 뒷받침하는 **근거·실험 스펙·확장안 저장소**로 둔다.

---


## Addendum: Memory in neural activity - LRO without criticality (arXiv:2409.16394v5)

이 논문은 “뇌가 임계점(critical point)에서 동작한다”는 가설(criticality hypothesis)을 정면 부정/대체하려고 들어가기보다,  
**시간 비국소성(time non-locality = memory)** 자체가 **장거리 질서(long-range order, LRO)** 를 만들 수 있음을 보여준다.

### A. 논문 핵심(요약)
- 동일한 코르티컬 동역학 모델에서 **fast(신경 활동)** 와 **slow(자원/메모리)** 두 시간척도가 존재한다.
- slow(자원) 동역학이 충분히 느려지면, 임계점 튜닝 없이도 **LRO phase** 가 나타난다.
- 관찰 포인트: scale-free correlation 같은 현상이 항상 “임계점”의 시그널은 아닐 수 있다.  
  → *메모리(히스토리 의존성)* 가 LRO를 유도하는 별도 메커니즘이 된다.

### B. Augnes Local로 번역(Non-normative, 운영 인사이트)
Augnes Local은 “전역 공유/방송(broadcast)”이 **협응**과 동시에 **오류 증폭**을 만든다는 리스크를 이미 전제로 깔고 있다.  
이 논문은 그 리스크가 “임계점” 같은 섬세한 튜닝 문제가 아니라, **fast/slow 분리 + 슬로우 변수(메모리/자원)의 관성**만으로도 발생할 수 있음을 정당화한다.

운영적으로 건질 포인트는 3개다.

1) **슬로우 변수로서의 resource_state**  
   - `resource_load`(고대역)와 `resource_state`(저대역)를 분리하면, “지금 빡빡함”과 “누적 피로”가 분해된다.  
   - 이 분해는 *전역 동조가 생기는 구간*을 제어(가격화/다운시프트)하는 레버가 된다.  
   - Canonical/Playbook에서 `resource_state`를 EVC 비용항/Watchdog에 연결(§5.2.1, Playbook §5.3.1).

2) **Avalanche/Burst 감지로 ‘오류 증폭’ 구간을 숫자로 잡기**  
   - LRO 자체는 나쁜 게 아니다(협응/일관성). 문제는 LRO가 **잘못된 방향으로 굳는 구간**이다.  
   - activity burst(툴/정책/검증 루프의 동시 폭증)를 avalanche로 정의하고, `AvalancheIndex`로 요약해 `zone=supercritical` 트리거로 쓴다.  
   - Logging Appendix에 계산/저장 위치를 정의(§11.3).

3) **“임계점 튜닝” 집착을 버리고 ‘넓은 안정 구간’을 목표로**  
   - 이식 관점에서 중요한 건 “뇌와 유사”가 아니라, **안정적으로 재현 가능한 전역 협응**이다.  
   - 임계점처럼 좁은 지점에 매달리기보다, slow-variable 기반 LRO처럼 **넓은 파라미터 구간에서 유지되는 안정성**을 선호하는 게 운영적으로 유리하다.

### C. 구현 메모(최소)
- 스키마 확장 없이: `STATE_SNAPSHOT.payload.metrics_optional`와 `SCORE_REPORT.payload.wl_covariates/stab_raw`에만 추가하면 된다.
- 시스템 디자인 레벨: “broadcast를 없애자”가 아니라 **burst를 계측하고 가격화해서 건강한 협응만 남긴다**가 목표.




## Addendum: Metacognition for Unknown Situations and Environments (MUSE) (Non-normative)

> 이 부록에 두는 이유: 운영 규약(법전)에 바로 넣기엔 “재현 조건”이 애매하지만, **자기객관화(자기평가) + 전략 전환 루프**는 Augnes Local에 가성비가 좋다.

### A. 논문 핵심(요약)
- 핵심 구성은 두 덩어리:
  - **Self-awareness**: “내가(에이전트가) 이 상황/전략에서 성공할 확률”을 추정(competence)
  - **Self-regulation**: 그 추정치를 이용해 전략을 선택/전환하며 반복(unknown 상황 대응)
- 일반적 목표: OOD/unknown 환경에서 “틀린 확신”으로 박치기하지 말고, **불확실성을 신호로 써서** 행동을 조절하자.

### B. Augnes Local로 번역(이식)하면 뭐가 남나
- 본문(Canonical Spec)에는 **규약 수준의 최소 계약**만:
  - competence는 Control signal이며 Claim confidence가 아니다.
  - stop-rule 상위, 로그 필수
- 구현(Playbook)에서는 “MUSE-lite”로 축약:
  - StrategyBank + CompetenceHead(가벼운 확률 헤드) + SelectionPolicy + OnlineUpdater
  - 입력 feature는 `z_t/BSL/route_tier/최근 실패` 정도만으로 시작 가능

### C. 재현 조건/한계(현실 체크)
- 논문은 환경/피드백이 명확한 벤치(또는 시뮬)에서 효과가 크다.  
  Augnes Local은 텍스트/툴 기반이므로 “정답 라벨”이 더 희소하고 noisy할 수 있다.
- 그래서 운영에서는 아래가 핵심:
  - **라벨 설계**: success/fail 정의(StopRule과 연결) + partial 처리
  - **캘리브레이션**: ECE/Brier를 꾸준히 보고, 업데이트를 느리게
  - **후보 수(K) 제한**: 비교 비용이 본전을 갉아먹지 않게

### D. 문서/스키마에 반영된 형태(요약)
- Canonical Spec: §3.3.7 / §5.7
- Playbook: §3.2.4
- Logging Appendix: §11.2/11.3 (NEW), §12.2 (9.1)
- Schema Bundle: `COMPETENCE_ASSESSMENT`, `STRATEGY_SELECTION`, `METACOG_CYCLE_END`

### 변경 로그
- 2026-01-29 r20.1: 문서 포인터(파일명) r20.1로 갱신 + 상호 참조 링크 정합화
- 2026-01-24 r19: 문서 포인터(파일명) 갱신
- 2026-01-21 r16: Addendum(MUSE) 추가, 본문 문서 포인터 업데이트
- 2026-01-21(r15): Self-evolution(Agent0/PACEvolve/SimpleMem) 번역 Addendum 추가.
- 2026-01-13(r7): Visual-CoT/SketchPad(저해상도 스케치) 운영 메모 추가 + 문서 포인터 r7 갱신
- 2026-01-09(r2): 2409.16394v5(메모리→LRO) 논문을 Augnes Local 운영 언어로 번역한 Addendum 추가. resource_state/avalanche 계측 포인트를 Canonical/Playbook/Logging과 연결.
- 2026-01-03(r4): r4 문서세트 포인터 정합성 갱신(상단/§2 파일명 목록) + EES 문구에서 ‘강제’ 오해 여지 제거(Stop Rule 우선순위 명시).
- 2026-01-03(r3): 파일 포인터/참조 정합성 정리(문서 간 r2/r3 혼재 제거).
- 2026-01-03(r2): Integration Map 포인터 추가.
- 2026-01-03: PCI-A → A-PCI 이식 메모(§3.5) 추가, 파일명 포인터 정리.

- v1.2.2+7: Research Appendix의 표현을 비-규약(권장/참고) 톤으로 정리(‘필수/금지’ 등 규범 어휘 최소화).
- v1.2.2+5: Pathak et al.(Nat Commun 2025, s41467-025-67076-x) BCP/ICN 이식 메모 추가 + `EES`/synchrony/loop-maintenance 공학 번역 연결.
- v1.2.2: Connectivity 번역 파트에 HAG 기반 Influence 구조 프라이어(`W_HAG`) 옵션을 추가.
- v1.2.2+: EfficientFlow-style 안정화 패턴(CBS/PR, Δ² 제한)을 GNWT/IIT 관측 프레임의 운영 번역 메모로 추가.
- v1.2.2+: SRP(Strange-Loop) 기반 저대역 방송/운영 프록시(HAP) 가설 메모를 추가.

---


## Addendum: Visual-CoT SketchPad as “Externalized Workspace” (MIRA/Sketchpad) (Non-normative)

이건 GNWT/IIT iEEG 결과를 “그대로” 이식하는 얘기가 아니라, Augnes Local에서 **워크스페이스/방송을 더 싸고 더 관측 가능하게** 만들기 위한 운영 메모다.

### A. 관찰(논문 계열 요지)
- MIRA(arXiv:2511.02779v1)는 **중간 시각표현(스케치/도식/경로)** 이 필요한 문제를 묶어 평가하면서, “텍스트만으로는 버티기 힘든 구조”가 분명히 존재함을 드러낸다.
- Visual Sketchpad/Latent Sketchpad 계열은 “그림을 잘 그린다”가 아니라, **생성 과정에 스케치형 중간표현을 끼워 넣으면 추론이 안정화**될 수 있음을 보여준다(primitive/latent 기반).

### B. GNWT 관점 번역
- GNWT식으로 보면 스케치패드는 **외부화된(하지만 저대역인) 작업공간**이다.
- 중요한 건 ‘공유’가 아니라 ‘통제’다:
  - 스케치가 있으면 broadcast가 쉬워지지만,
  - 동시에 **broadcast-amplification(오류 증폭)** 도 쉬워진다.
- 따라서 스케치패드는 Evidence가 아니라 **Control/View** 로만 다루고,
  - boundary 기준 갱신(진동 억제),
  - 순서-불변 정규화(결정론),
  - 그리고 OFF/ON A/B로 비용 대비 이득을 반드시 검증한다(Integration Map 진단 배터리 참고).

### C. Augnes Local로 남는 구현 포인트(최소)
- `sketch_self`: 시스템 상태 다이어그램(모듈/루프/예산/zone/state_label). “메타-컨트롤러가 보는 저대역 채널”.
- `sketch_task`: 공간/경로/도식 같은 과업에서만 켜는 스크래치.
- 초기에는 이미지/VLM 없이도 충분하다: `grid8` + primitive 집합 + 해시만으로도 **재현성/계측**은 된다.

> 결론: 스케치패드는 GNWT/IIT의 ‘정답’이 아니라, Augnes Local의 **관측 가능성/안정성**을 올리는 실용 채널이다.


## Addendum: Sophia(System 3)와의 접점 (Non-normative)

이 부록(GNWT/IIT)은 신경과학 계열 논쟁의 “관측/해석”을 정리한 것이고, **Sophia(arXiv:2512.18202v1)** 는 소프트웨어 아키텍처 쪽에서 “지속형 에이전트의 실행 코어(System 3)”를 제안한다.

Augnes Local 관점에서의 요점은 단순하다.

- GNWT/IIT가 말하는 “전역 접근/작업공간” 같은 용어를 **직접 모사**하려고 애쓰지 말고,
- 운영적으로 의미 있는 **Executive Core 루틴(Thought Search/Process Supervision/Reflection)** 과
- “가중치 업데이트 없이도” 반복 과제 비용을 줄이는 **TraceCapsule Forward Learning**을 택하면 된다.

이 addendum는 본 부록의 주장/해석을 바꾸지 않는다. 단지 “소프트웨어 설계로 가져갈 때 어디가 실용적인가”를 연결해 둔다.

---

## 부착 후 운영 계측(필수 권장): A-PCI/ΔPCI + CSI

GNWT/IIT류 아이디어를 일부 이식(또는 흉내)낼 때 가장 흔한 실패는 “그럴듯한 구조를 붙였는데, 루프가 더 불안정해지는 것”이다.  
따라서 이식 여부/범위를 결정할 때는 기능 자체보다 **회복성/재현성 지표를 먼저** 본다.

- **A-PCI/ΔPCI(PROBE)**: Workspace에 짧은 섭동을 주고 궤적 복잡도를 측정한다.  
  - raw 절대값 판정 금지, ΔPCI(성공-실패 대조) 기반 진단만 허용(Ops Marker)
  - Canonical: `PROBE` 규약(SSOT_CANONICAL.md §5.1.1)
  - Logging: `PULSE_TRIGGER`/`PROBE_RUN_*` + A-PCI 스펙(SSOT_LOGGING_POLICY.md §11.7, §12.2(6))
  - Playbook: A-PCI 측정 루틴(OPS_PLAYBOOK.md §9.1.1)

- **CSI(회복성/재현성)**: 동일 task를 seed/문장 변형으로 반복했을 때 내부 경로가 얼마나 일관적인지 본다.  
  - (r6) **순서 교란(셔플) null**을 포함해 `CSI_shuffle_null_mean`/`CSI_order_gain`을 같이 기록한다(Logging Appendix §13.7.1).
  - CSI는 회귀(regression) 게이트용 지표이며 온라인 라우팅 규칙으로 직접 쓰지 않는다.
  - Canonical: CSI 규칙(SSOT_CANONICAL.md §2.3.3)
  - Logging: CSI 스펙(SSOT_LOGGING_POLICY.md §13.7.1)
  - Playbook: CSI 실험(OPS_PLAYBOOK.md §9.5)



## Addendum: 2025-11~2026-01 Self-Evolution 계열을 Augnes Local로 번역(Non-normative)

이 구간의 핵심은 “가중치 학습”이 아니라, **도구/규칙/프롬프트/정책을 버전 아티팩트로 다루며 경험으로 개선**하는 방법론이 정리되기 시작했다는 점이다.

### A) Agent0 (arXiv:2511.16043)에서 당장 가져갈 것
- **Curriculum ↔ Executor 분리**: 문제 생성(회귀/프로브)과 실행(툴+추론)을 분리하면 ‘데이터 제로’에서도 개선 루프가 굴러간다.
- **Ambiguity-aware 업데이트**: 불확실하면 덜 배운다(승격 보류 + probe 생성으로 전환).
- Augnes 매핑: Playbook §6.3.2 / Sidecar §6.5.9 / Logging Appendix의 `ARTIFACT_TUNE_*`.

### B) PACEvolve (arXiv:2601.10657)에서 당장 가져갈 것
- 실패모드 3종(컨텍스트 오염/모드 붕괴/협업 약화)을 **로그/지표/운영 규칙**으로 고정하면 장기 자기개선이 덜 터진다.
- Augnes 매핑: Canonical §11.1.3(가드레일) + Playbook §6.3.1 + Sidecar §6.5.8.

### C) SimpleMem (arXiv:2601.02553)에서 당장 가져갈 것
- 메모리는 “그냥 쌓기”가 아니라 **압축-통합-쿼리적응 리트리벌**로 정의를 먼저 고정해야 한다.
- Augnes 매핑: Logging 이벤트(`MEMORY_COMPRESS/PRUNE`)의 payload 최소 스펙을 보강하고, A(오프라인)에서 consolidation 계보를 남긴다.

> 결론: 새 아키텍처를 더 붙이는 게 아니라, 이미 있는 Step Loop/Sidecar/JML/Logging 계약을 ‘자기진화가 망가지지 않게’ 다듬는 게 1순위다.

---

## r17 메모: Self-Graph PSGR(ProgRAG-style)와 GNWT/IIT 부록의 접점(운영 관점)
- GNWT/IIT 부록은 “의식/통합”을 곧바로 구현하자는 문서가 아니다.
- 대신 PSGR은 로컬에서 **작업 공간(Workspace) ↔ 장기 구조(Self-Graph)** 사이를 오가는 최소 통로로 쓸 수 있다.
- 해석: (1) 서브쿼리로 작업공간을 쪼개고, (2) 관계 확장으로 전역 구조를 얕게 스캔하고, (3) prune으로 다시 작업공간을 안정화한다.
- 즉, ‘전역 접근성’이라는 개념을 **그래프 기반 검색/프루닝의 운영 루프**로 낮춰서 흡수하는 형태다(권위/의식 주장 금지).

---

## Addendum: CSB(소뇌 모티브 위성)와 GNWT/IIT를 섞지 말 것 (운영 관점)

GNWT/IIT 쪽은 “전역 접근성/통합/작업공간” 같은 논쟁을 다룬다.  
반대로 CSB(소뇌 모티브)는 **(1) 저비용 예측/보정**, **(2) 출력/행동의 미세 조절**, **(3) 안정화** 쪽이다.

Augnes Local에서의 안전한 결론은 이거다.

- CSB는 **Workspace(전역 작업공간) 대체물이 아니다.**
- CSB 출력은 **Control/View**로만 취급한다(Evidence/Claim으로 승격 금지).
- CSB는 “의식/통합”을 흉내내는 장치가 아니라, 코어 주변에서 **작은 델타(Δlogits/Δpolicy_score)** 로 안정화/편향을 주는 장치다.
- 그래서 GNWT/IIT 계측(A-PCI/CSI)과 CSB 계측(selectivity/mixedness/separation_violation)은 **서로 다른 계층의 회귀**로 분리해 운영하는 게 맞다.

즉, GNWT/IIT는 “전체 루프의 구조적 안정성/접근성”을 보려는 계측이고, CSB는 “싸게 붙인 위성들이 설계 계약을 지키는지”를 보려는 계측이다.

## (NEW) 연결 메모: Koopman invariants 기반 레짐 분해는 GNWT×IIT 이식과 “독립 레이어”다

- GNWT/IIT 이식은 “의식/접근성/통합” 같은 기능 모티브를 아키텍처로 옮기는 이야기이고,
- KJEPA(koopman_jepa_v0)는 그와 별개로 **로그 시계열에서 상태공간을 안정적으로 분할**(레짐/모드 클러스터링)하는 도구다.
- 둘의 결합 지점은 단 하나:  
  GNWT/IIT 쪽에서 설계한 신호(예: broadcast/competition proxy, integration proxy 등)를 `macro_obs`에 포함시키면,
  거시 레짐이 더 “의미있는 축”으로 나뉠 수 있다. (단, 이건 Evidence가 아니라 운영용 View다)


---

## (NEW) Addendum: Meta-Working-Memory(메타 WM) — PFC가 “불확실성+히스토리+각성”을 통합해 opt-out을 제어한다

논문: **"Macaque prefrontal cortex integrates multiple components for metacognitive judgments of working memory"** (Ning et al., Neuron 2026)

### 관측(논문 모티브를 ‘공학적 신호’로 번역)
- 메타인지 판단은 “기억 강도” 하나로 끝나지 않고,
  - (a) **기억 내용/강도**, (b) **불확실성**, (c) **trial history**, (d) **arousal(각성/부하)** 같은 cue를 함께 섞어
  - **meta-working-memory 신호**를 만든 뒤,
  - 그 신호로 **opt-out(=답/행동을 내지 않고 더 안전한 경로로 전환)** 결정을 가이드한다.
- 즉, “내가 기억한다고 느끼는 정도”는 **단일 축이 아니라 합성된 제어 신호**일 수 있다.

### Augnes Local 적용(권장, 계약/권위 침범 금지)
- 이 모티브는 GNWT/IIT처럼 ‘의식’ 주장용이 아니라, **운영 루프에서 루프를 끊는 가성비 게이트**로 바로 쓸 수 있다.
- 핵심은 3분리:
  - `claim.confidence` = “주장이 맞을 확률”(Evidence/Claim 쪽)
  - `competence_hat` = “이번 정책/전략이 성공할 확률”(MUSE-lite/AVR, Control/View)
  - `meta_wm_hat` = “내 작업용 기억이 지금 믿을 만한가”(Control/View; opt-out gate 전용)

### 구현 프록시(로컬 우선, Sidecar/QP 기반)
- `wm_strength_hat`: QP 재호출 일관성/합의도(요약·TraceCapsule·스케치)
- `wm_uncertainty_hat`: conflict/entropy/loopness + z_t drift + 최근 Verifier 반례율
- `history_bias_hat`: fail_streak/최근 calibration error(과신/과소신)
- `arousal_proxy`: resource_state(피로/과부하/지연) + avalanche 플래그
- `meta_wm_hat`: 위를 clamp01로 합성(초기엔 휴리스틱, 나중에 캘리브레이션)

### 운영 규칙(짧게)
- `meta_wm_hat < θ_optout`이면 **내부 WM 의존 전략을 제한**하고 `S2/S3/S4`로 opt-out 한다.
- 이 신호는 Evidence가 아니다. “확신이 낮으니 틀렸음” 같은 서사는 금지.  
  단지 **안전한 탐색/검증 경로로 전환**하는 스위치다.

> 포인터: Canonical §5.7.3b / Logging §9.1(wm_meta) / Playbook §3.2.4(Meta-WM gate) / Sidecar §2.2a
---

## (NEW) Addendum: Oscillatory “Inhibitory Stencil” → ContextStencil(컨텍스트 공간 게이팅) 번역

논문 모티브: **"Oscillatory control of cortical space as a computational dimension"**  
요지는 단순히 “리듬이 있다”가 아니라, alpha/beta 같은 저주파 진동의 **공간 패턴 자체가 과업(규칙/문맥) 정보를 담고**  
그 패턴이 spiking 기반 표현이 “어디에서/어떤 형태로” 나타날지를 **억제 스텐실(inhibitory stencil)** 처럼 조절한다는 주장이다.

### Augnes Local로의 안전한 번역(권장)

- 물리적 피질 공간 대신, 로컬 에이전트에서는 “컨텍스트/메모리 뱅크의 슬롯 공간”을 대응시킨다.
- 즉 `ContextStencil := {region_id -> inhibit_w}` 를 만들어,
  - retrieval bank/source 선택,
  - selection context 마스킹,
  - PCF 후보 스코핑
  에만 **편향(soft mask)** 로 적용한다.

### 운영 규칙(계약 침범 방지)
- ContextStencil은 **Control/View 전용**이다. Evidence/Claim 권위 침범 금지.
- 업데이트는 Observe 직후 1회 또는 Pulse/Boundary에서만(매 스텝 재계산 금지).
- jerk cap + min-dwell로 안정화(=oscillation damping의 공간 버전).
- “근거를 안 보게 만들기”가 아니라 “근거/검증 채널을 더 잘 보게 만들기” 쪽으로만 사용한다.

### 포인터(정합성)
- Canonical: TRL Routing output optional `context_stencil`(§4.1.0) + Workspace Stencil(§9.4a)
- Playbook: SSC(Spatial Stencil Controller) 운영 레시피(§6.3.1d)
- Logging: Metric Spec Appendix §11.8 (`metrics_optional.artifact_tuning.context_stencil`)
- Wiring: (A0l) `WIRING_INTEGRATION_MAP.md`
