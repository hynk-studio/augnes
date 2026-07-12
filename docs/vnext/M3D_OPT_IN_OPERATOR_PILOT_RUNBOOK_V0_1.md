# M3D Opt-in Operator Pilot Runbook v0.1

## Purpose and authority boundary

이 runbook은 M3D local operator pilot을 두 절차로 분리한다.

1. automated isolated verification
2. merge 이후 사용자가 선택하여 수행하는 real local pilot

Codex는 두 번째 절차를 실행하지 않았다. 이 문서의 placeholder는 실제 path, workspace,
project, operator, session, token 또는 DB content가 아니다. 실제 credential, session/token material,
private DB content와 local filesystem path는 사용자가 local terminal에만 입력하고 issue, PR, log,
screenshot, fixture, clipboard history 또는 chat에 남기지 않는다. 아래의 bounded packet handoff는 exact
project identity를 의도적으로 포함하므로 사용자가 검토한 뒤 명시적으로 copy할 수 있다.

Local pilot session은 locally issued secret possession만 검증한다. Legal identity, OS-account
ownership, organization membership 또는 external provider identity를 인증하지 않는다. Pilot은
single project, single candidate, single target, absent-state `accept/create`에만 사용한다.

---

## A. Automated isolated verification

이 절차는 disposable temp DB와 local ephemeral server만 사용한다. Product/user DB와 post-merge
manual pilot을 실행하지 않는다.

### A.1 Required checks

```bash
npm run typecheck
npm run test:vnext-protocol
npm run smoke:authority-invariants
npm run smoke:authority-boundary-regression-v0-1
npm run smoke:operator-path-backend-safety-validation-bundle-v0-1
npm run smoke:codex-result-report-ingestion-v0-1
npm run smoke:codex-result-paste-normalizer-preview
npm run smoke:codex-result-import-review-surface
npm run build
git diff --check
```

Durable/operator smokes와 migration rehearsal은 다음처럼 반드시 explicit OS-temporary path를 사용한다.
Default `data/augnes.db`를 implicit하게 사용하지 않는다.

```bash
TMP_DIR="$(mktemp -d)"
export AUGNES_DB_PATH="$TMP_DIR/isolated-pilot.db"
npm run db:reset
npm run db:migrate
npm run smoke:vnext-durable-semantic-loop-v0-1
npm run smoke:vnext-operator-pilot-v0-1
unset AUGNES_DB_PATH
rm -rf "$TMP_DIR"
```

동일 smoke를 새 temp directory에서 한 번 더 실행하여 process/global state leakage를 검사한다.
Automated gate는 다음을 확인해야 한다.

- disabled, loopback, same-origin, cookie, expiry/revocation와 nonce boundary
- authentication-only phase의 semantic record delta 0
- preview zero-write, confirmation gate-only, commit exact state/head/receipt write
- explicit packet compilation, structured result intake와 explicit ContextUseReview
- exact replay, conflict, stale state와 concurrent nonce refusal
- enrolled/foreign project isolation
- refresh/back/resubmit이 duplicate transition을 만들지 않음
- fresh/repeated/legacy upgrade, integrity, close/reopen와 backup/restore
- default DB access 0, legacy authoritative table delta 0
- proof/Evidence, Perspective/memory, work closure와 publication delta 0
- local ephemeral HTTP server 외 external fetch/DNS/socket/provider call 0
- temp DB, WAL/SHM, server, cookie jar, token fixture와 side file cleanup

Automated success는 local mechanics의 evidence다. Actual operator decision, product transition,
packet use, usefulness, Observed Use, Reviewed Reuse 또는 Outcome Improvement가 아니다.

### A.2 Qualification gate before any future autonomous chain

The versioned executable contract is documented in
`docs/vnext/M3D_AUTONOMOUS_EVIDENCE_RUNNER_V0_1.md` and invoked with
`npm run vnext:m3d-autonomous-evidence-runner-v0-1`. Start with `--dry-run`,
then use `--qualify-only` against a new empty absolute run root. Do not invoke
full mode as implementation-PR verification and do not allocate or execute the
real Chain 6 before this runner PR is merged and separately reviewed.

다음 autonomous evidence chain ID를 할당하기 전에 runner environment를 product evidence
execution과 분리하여 검증한다.

1. canonical checkout과 overlap하지 않는 no-hardlinks disposable execution clone을 만든다.
2. execution clone의 root dependency를 `npm ci`로 provision한다.
3. execution clone의 nested app dependency를 `npm --prefix apps/augnes_apps ci`로 provision한다.
4. execution clone root의 `better-sqlite3`가 그 clone의 `node_modules` 내부 canonical module로
   resolve되고 exact path load가 가능한지 확인한다. Parent/global module과 `NODE_PATH`는 사용하지 않는다.
5. execution clone의 tracked/untracked Git status가 exact clean인지 확인한다.
6. canonical run root 아래 runtime/evidence sibling을 만들되 execution clone과 양방향으로
   non-overlap인지 확인하고, working DB는 runtime 아래 아직 존재하지 않는 leaf로 지정한다.
7. `vnext_m3d_evidence_runner_qualification.v0.1` portable mode를 실행한다.
8. 같은 clean execution clone과 intended environment에서 local-full mode를 실행한다.
9. execution clone 밖의 evidence root 내부에 exclusive owner-only로 생성된 public-safe
   qualification receipt를 보존한다.
10. application commit, qualification version, Node major, platform, architecture, 두 lockfile
   hash와 local-full browser identity를 독립적으로 확인한다.
11. 두 mode가 qualified이고 identity가 유지될 때에만 다음 chain ID를 할당하고 product
   evidence execution을 시작한다.

Unqualified runner environment는 future wrapper에서 `ABORTED / PHASE:
RUNNER_QUALIFICATION`으로 분류할 수 있다. 이는 product evidence가 아니며, qualification을
통과한 chain 내부의 safety/product stop인 `HOLD`와 구분한다. Qualification gate는 runner를
구현하거나 시작하지 않고, DB를 열지 않으며, Chain 6을 할당하거나 실행하지 않는다.

---

## B. Post-merge user-owned real local pilot

이 절차는 PR merge 이후 사용자가 명시적으로 opt in한 경우에만 수행한다. Codex가 대신 실행하지
않는다. 각 checkpoint에서 값이나 lineage가 예상과 다르면 중단하고 restore 여부를 사용자가 결정한다.

### B.1 Stop runtime and choose exact scope

먼저 Augnes runtime과 DB writer를 모두 중지한다. 실제 값은 아래 placeholder를 local terminal에서만
교체한다.

```bash
export AUGNES_DB_PATH="<ABSOLUTE_PILOT_DB_PATH>"
export AUGNES_VNEXT_PILOT_BACKUP="<ABSOLUTE_BACKUP_PATH>"
export AUGNES_VNEXT_OPERATOR_WORKSPACE_ID="<WORKSPACE_ID>"
export AUGNES_VNEXT_OPERATOR_PROJECT_ID="<PROJECT_ID>"
export AUGNES_VNEXT_OPERATOR_ID="<OPAQUE_LOCAL_OPERATOR_ID>"
```

확인한다.

- `AUGNES_DB_PATH`는 absolute local file path다.
- Default path를 우연히 선택하지 않았다.
- Workspace/project/operator scope가 이번 pilot 하나와 exact하게 맞다.
- 대상 candidate는 one target이고 current semantic state가 absent다.
- Replace, supersede, retract와 multi-target pilot이 아니다.

### B.2 Backup and checksum before migration

DB가 닫힌 상태에서 SQLite backup과 checksum을 만든다.

```bash
sqlite3 "$AUGNES_DB_PATH" ".backup '$AUGNES_VNEXT_PILOT_BACKUP'"
shasum -a 256 "$AUGNES_VNEXT_PILOT_BACKUP"
sqlite3 "$AUGNES_VNEXT_PILOT_BACKUP" "PRAGMA integrity_check;"
```

다음을 별도 local operator note에 기록한다.

- backup checksum
- source DB file metadata
- migration 전 schema/version
- legacy authoritative table row-count/checksum baseline
- restore command와 pilot stop condition

그 note에도 credential, token, private payload 또는 raw DB content를 넣지 않는다.

### B.3 Explicit migration

Pilot DB path를 다시 확인한 뒤 explicit migrate를 수행한다. Generic runtime open에 migration을
기대하지 않는다.

```bash
AUGNES_DB_PATH="$AUGNES_DB_PATH" npm run db:migrate
AUGNES_DB_PATH="$AUGNES_DB_PATH" npm run db:migrate
sqlite3 "$AUGNES_DB_PATH" "PRAGMA integrity_check;"
```

두 번째 migrate는 no-op이어야 한다. Existing ledger row count/checksum, legacy rows와 immutable
triggers/indexes가 보존되었는지 확인한다. 차이가 설명되지 않으면 pilot을 시작하지 않는다.

### B.4 Enable the exact local pilot

```bash
export AUGNES_VNEXT_OPERATOR_PILOT_ENABLED=1
npm run vnext:operator-pilot -- status --json
```

Status output에서 configured scope와 다음 boundary를 확인한다.

- credential material included: false
- external identity authenticated: false
- semantic authority granted: false

### B.5 Prepare bounded real-source review material

이미 structured contract를 만족하는 local JSON만 사용한다. Raw prompt, transcript, terminal dump,
hidden reasoning, credential, secret 또는 unsupported absolute path를 넣지 않는다.

```bash
npm run vnext:operator-pilot -- prepare-review \
  --input "<ABSOLUTE_STRUCTURED_MAPPER_INPUT_JSON>" \
  --prior-packet "<ABSOLUTE_PRIOR_PACKET_JSON>" \
  --json
```

출력에서 exact workspace/project, mapped RunReceipt, EpisodeDeltaProposal, candidate count와 prior packet
binding을 검사한다. `decision_created: false`, `transition_created: false`여야 한다.

### B.6 Issue and consume one bootstrap token

```bash
npm run vnext:operator-pilot -- issue-session
```

Bootstrap token은 한 번만 표시된다. Token을 local loopback POST form에 직접 입력하고 저장, 복사,
기록, screenshot 또는 log capture하지 않는다. URL query string에 넣지 않는다. Bootstrap replay가
거부되고 HttpOnly SameSite=Strict session cookie가 발급되는지 확인한다.

Local runtime은 같은 explicit environment로 loopback에만 실행한다.

```bash
npm run dev -- --hostname 127.0.0.1
```

Non-loopback exposure, proxy-forwarded host/origin 또는 CORS를 enable하지 않는다.

### B.7 Inspect proposal and create one explicit decision

Loopback browser에서 `/workbench/semantic-review`를 열고 exact proposal detail로 이동한다.

검사 항목:

- workspace/project, proposal ID/fingerprint
- source RunReceipt and packet lineage
- observation, attestation, inference separation
- conflicts, missing information, uncertainty와 current-state knowledge
- selected candidate ID/fingerprint와 exact one-target set
- pilot admission이 absent-state `accept/create`인지

사용자가 실제로 동의할 때만 explicit `accept`를 제출한다. UI selection이나 page view는 decision이
아니다. Rationale은 bounded summary만 사용한다. 생성된 `ReviewDecision`의 actor, candidate,
proposal, basis, target와 transition intent를 검사한다.

### B.8 Preview without writing

Read-only preview를 열고 다음 exact material을 기록·검사한다.

- target and operation = create
- before presence = absent
- authorized after-state content fingerprint
- expected target-head revision
- authorized applier identity
- bounded gate TTL and expiry policy
- confirmation digest

Preview 전후 proposal, decision, gate, state/head와 receipt row count를 비교한다. Preview는 write 0이어야
한다. Digest, applier, TTL 또는 current head가 이해되지 않으면 confirm하지 않는다.

### B.9 Confirm gate, then commit separately

Fresh preview와 one-time action nonce로 exact digest를 명시적으로 confirm한다. Confirmation 뒤에는
immutable semantic gate 하나만 추가되고 semantic state/head/receipt는 아직 바뀌지 않아야 한다.

Gate ID/fingerprint, operator actor, digest, effect, applier와 expiry를 다시 검사한다. 그다음 별도 action
nonce와 exact gate ID/fingerprint로 commit한다. Caller timestamp, current-state observation 또는
after-state JSON을 제출하지 않는다.

Commit 뒤 검사한다.

- exact `StateTransitionReceipt` ID/idempotency/fingerprint
- source proposal/decision/candidate/intent/gate binding
- create before absent → after present
- application-result observation and durable-record proof binding
- semantic-state immutable record
- target head revision/presence/latest receipt lineage
- current projection exact state fingerprint
- legacy authoritative row-count/checksum unchanged

같은 commit resubmit은 exact replay이고 새 revision/receipt를 만들지 않아야 한다.

### B.10 Compile later packet explicitly

Receipt review 뒤 사용자가 별도 compile action을 실행한다. Commit 성공만으로 packet이 생성되어서는
안 된다.

생성된 later `TaskContextPacket`에서 확인한다.

- exact prior packet and transition receipt lineage
- new accepted-state ref and fingerprint
- unrelated context, constraints와 return contract preservation
- generated/expiry timestamp and packet fingerprint
- replaced/retracted state invention 없음

Packet compilation은 semantic transition이 아니며 자동 native-host launch를 하지 않는다.

### B.11 Perform one manual later task

Exact packet handoff를 bounded text 또는 JSON으로 copy/download한다. Handoff에 token, session secret,
private DB payload 또는 hidden prompt가 없는지 확인한다.

사용자가 선택한 native host에서 one bounded later task를 수동 실행한다. Provider/model invocation은
이 local operator path가 자동 수행하지 않는다. Task 결과는 exact later packet ID/fingerprint와
selected-state refs를 필요한 만큼 참조하는 structured Codex result report로 반환한다.

Packet을 단순 첨부했는지, payload를 실제로 사용했는지, 어떤 accepted-state refs를 사용했는지는
구분하여 기록한다. Raw transcript, prompt, terminal output, hidden reasoning 또는 credentials를
반환하지 않는다.

### B.12 Intake result and review usefulness

Semantic Workbench의 later-result intake에서 structured JSON만 선택한다. Exact packet/transition
binding, reported payload use와 cited selected-state refs를 검사한 뒤 제출한다. Persisted RunReceipt의
Codex claims가 imported/attested이고 local direct observations가 packet/transition/intake validation에만
한정되는지 확인한다.

그 다음 사용자가 explicit `ContextUseReview`를 작성한다.

- packet presented: yes/no/unknown
- actually used: yes/partial/no/unknown
- assessment: helpful/stale/misleading/missing/noisy/not applicable
- bounded correction summaries
- wrong-context, repeated-explanation, missing-critical-context와 refs-used metrics 또는 unknown
- bounded notes

Review ID/fingerprint, prior/later packet, transition, later RunReceipt, reviewer와 session basis를 검사한다.
Negative review는 state를 자동 retract하지 않고 correction proposal을 만들지 않아야 한다. Helpful
review 하나도 Outcome Improvement를 증명하지 않는다.

### B.13 Close and revoke

Project Home의 read-only continuity card에서 latest transition, head, packet, result와 review status가
exact project에만 보이는지 확인한다. Home에서 mutation action을 수행하지 않는다.

Session ID를 local status에서 확인한 뒤 revoke한다.

```bash
npm run vnext:operator-pilot -- status --json
npm run vnext:operator-pilot -- revoke --session-id "<SESSION_ID>" --json
```

Revoked session으로 private GET/POST와 nonce reuse가 거부되는지 확인한다. Runtime을 중지하고 pilot을
disable한다.

```bash
unset AUGNES_VNEXT_OPERATOR_PILOT_ENABLED
unset AUGNES_VNEXT_OPERATOR_WORKSPACE_ID
unset AUGNES_VNEXT_OPERATOR_PROJECT_ID
unset AUGNES_VNEXT_OPERATOR_ID
```

### B.14 Restore or retain by explicit user decision

사용자가 pilot state를 보존하지 않기로 결정했거나 validation이 실패했다면 runtime과 DB connection을
완전히 중지한 뒤 pre-pilot backup을 restore한다. 먼저 현재 pilot DB를 별도 forensic copy로 보존할지
사용자가 결정한다.

```bash
sqlite3 "$AUGNES_VNEXT_PILOT_BACKUP" "PRAGMA integrity_check;"
shasum -a 256 "$AUGNES_VNEXT_PILOT_BACKUP"
sqlite3 "$AUGNES_DB_PATH" ".restore '$AUGNES_VNEXT_PILOT_BACKUP'"
sqlite3 "$AUGNES_DB_PATH" "PRAGMA integrity_check;"
```

Restore 뒤 pre-pilot checksum/row-count baseline과 비교한다. Pilot을 보존할 경우에도 backup checksum,
receipt/review identifiers, observed limitations와 explicit user decision을 bounded local note로 남긴다.
Credential, token, raw payload 또는 private DB content는 남기지 않는다.

마지막으로 local environment를 정리한다.

```bash
unset AUGNES_DB_PATH
unset AUGNES_VNEXT_PILOT_BACKUP
```

---

## Autonomous rehearsal evidence history

- 첫 번째 autonomous rehearsal은 canonical 23-character `TaskContextPacket`이 24-character
  suffix를 요구하던 handoff route에 도달하지 못해 HOLD로 종료했다. PR #1064가 이 route-length
  mismatch를 수정했다.
- Post-#1064 두 번째 autonomous rehearsal은 packet handoff, later-result `RunReceipt`,
  `ContextUseReview` persistence까지 완료했지만, persisted packet/result/review가 proposal-detail
  Semantic Workbench lineage에 projection되지 않아 별도 HOLD로 종료했다. Project Home과 packet
  handoff surface에는 같은 persisted material이 보였으므로 writer 또는 persistence failure가 아니었다.
- 후속 correction은 proposal-specific durable lineage를 bounded identity, relation, status와 timestamp
  summary로만 보여 주는 read-only projection이다. Protocol, schema, migration, writer, transition 또는
  review contract를 변경하거나 semantic authority를 부여하지 않는다.
- 두 HOLD evidence chain과 retained database/report/backup은 서로 분리된 read-only evidence로 보존한다.
  Correction merge 뒤 검증은 clean baseline backup 또는 fresh canonical fixture에서 bootstrap부터 새
  chain으로 다시 시작해야 하며, earlier runs를 하나의 success chain으로 합치지 않는다.
- 세 번째 rehearsal은 helper agent가 금지된 default-DB read-only checksum을 수행하여 product path를
  평가하지 못한 historical runner/environment failure다.
- 네 번째 rehearsal은 root dependency만 설치되고 nested `apps/augnes_apps` dependency boundary와
  `.bin/tsx`가 없어 product path를 평가하지 못한 historical runner/environment failure다.
- 다섯 번째 rehearsal은 macOS의 `/tmp`와 `/private/tmp` lexical/canonical identity 차이 때문에
  false-positive scope rejection이 발생하여 product path를 평가하지 못한 historical
  runner/environment failure다.

Chains 3~5의 historical failure는 당시 report와 verdict를 다시 쓰지 않는다. 이 failure들은 prompt에
path exception이나 dependency instruction을 더하는 대신 별도 versioned qualification gate를 두어야
한다는 근거이며, product behavior evidence 또는 M3 completion evidence가 아니다.

이 correction과 autonomous synthetic operator material은 M3 completion, Reviewed Reuse 또는 Outcome
Improvement evidence가 아니다.

---

## Completion interpretation

Automated section만 통과하면 M3D code path가 준비된 것이다. User-owned section을 실제 opted-in local
project에서 완료하고 exact real decision, confirmed gate, product/user local transition receipt, later
packet, later-task RunReceipt와 ContextUseReview를 검토해야 M3 completion evidence를 평가할 수 있다.
이 runbook의 존재, PR merge, one fixture 또는 one helpful review는 M3 completion, Reviewed Reuse 또는
Outcome Improvement가 아니다.
