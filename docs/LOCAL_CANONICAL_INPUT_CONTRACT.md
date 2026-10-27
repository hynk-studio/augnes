# Local Canonical execution-input contract

This is the implemented design/source map for #1530. The Local Canonical policy owns
admission and acceptance. This document records the consumers and regression
obligations; it does not grant execution, provider, lifecycle or merge authority.

## Scope and consumer map

| Boundary | Existing owner and actual consumption | Evidence/control |
| --- | --- | --- |
| Parent/controller | `run-local-canonical-verification.mjs`, `local-canonical-environment.mjs`, Git identity/planner reads, Node/npm selected through PATH | Exact tree, source/lock/executor identities, selected plan, Node/npm and environment bindings; changes invalidate inputs |
| Authenticated base read | `github-main-branch-transport.mjs` invokes `gh api` GET using parent transport credentials | Preserve authenticated read and current-main gate; transport failure is admission refusal, credentials are neither exported nor forwarded to phases |
| Isolated phase | `local-canonical-isolated-resources.mjs` and `canonical-test-environment.mjs` select private HOME, temp, npm cache, database/runtime and filtered environment | Bind selected environment and physical isolation; positive/negative disposable controls prove actual consumption, not HOME assignment alone |
| Suite child/native fixture | `run-canonical-test-suite.mjs`, `canonical-child-runner.mjs`, `test-harness-process-lifecycle.mjs` | Retain bounded process ownership/settlement, two integration lanes, original assertions and deadlines; native/model tests use existing disposable fake adapters |
| Dependency preparation | Root/nested/Web `npm ci`, lockfiles and package lifecycle scripts | Existing clean-install authority retained; private npm configuration/cache; package and lock changes are source inputs, installed trees are not reusable proof |
| Browser | Project-experience, continuity, project-client and Web-planning launchers; shared operator lifecycle including golden and four navigation controls; integration durable/cumulative surfaces | Reuse process owners; record selected executable at actual launch/settlement and agreeing HTTP/CDP runtime versions. Freeze exact consumer counts for every consuming phase, including integration; forward nested evidence and refuse missing records |
| Installed Companion | Supported preservation observer and existing context owner | Coherent before/after identity, no lifecycle in isolated context; observation/ownership failure remains blocking |
| Shared Codex preferences | No selected isolated controller/phase launches the developer Codex client or uses its model selection | Only narrowly recognized top-level model/effort/tier values may be excluded on this audited path; remainder and metadata safety checks remain conservative |
| Hooks and authority | Git reads do not dispatch checkout/commit hooks; canonical suites use private fake clients and runtime roots | No live client/model launch from this contract; source changes introducing a consumer require renewed classification and tests |

The orchestration conversation's running model is outside the deterministic
qualification process. Its effective settings and historical configuration
writers are not established by this contract. A consuming path cannot claim the
isolated path's exclusion. Inherited PATH, explicit paths, transport, package
scripts and descendant launchers remain inputs even with a private HOME.

## Implementation mapping

- The executor uses a frozen, versioned input classification, a latched
  observer and its existing AbortSignal/owned-child cleanup path. Preserve raw
  cancellation/timeout/failure and never admit another phase after a fault.
- The receipt owner supplies separate execution, validity, safety and current
  applicability decisions, strict final conjunction, Browser provenance and a
  sanitized derived review export. Preserve legacy receipt interpretation.
- `local-canonical-attempts.mjs` owns an append-only attempt family: one initial invocation and
  one explicit recovery only with substantiated infrastructure cause and verified
  remedy. Family identity survives wrapper restart and cosmetic commits.
  A genuinely revised candidate uses one immutable predecessor/successor binding,
  retained exact-delta source review and original receipt. Meaningful revision after
  PASS uses identical fail/pass regression evidence. A verifier correction after a
  safety stop additionally binds the original fault and an allowlisted verifier
  owner. A necessary accepted-main integration binds the freshly admitted main,
  exact two parents and independently recomputed tree-entry union. None recasts old
  outcomes as infrastructure, resets an unchanged target or grants permission.
- `local-canonical-evidence-retention.mjs` protects active and explicitly pinned
  evidence. Unsafe aliases and ambiguous ownership refuse cleanup.
- `test-local-canonical-classification.mjs` and `test-local-canonical-review-corrections.mjs` exercise real classification,
  sequencing, child lifecycle and receipt validation. Keep accepted Full phase
  inventory and every existing child bound, including 30 seconds for the
  settled-expired-successor child. Register new controls in authority coverage.

## Required contrasts and limits

Controls cover excluded preferences versus the same values on a consuming path;
mixed unknown/permission/trust changes; relevant input/browser mutation; missing
evidence/coverage; observer failure and first-fault latching; exit-zero after
cancellation/timeout; owner replacement; one repaired infrastructure recovery
versus product/unknown/evasion refusal; stale main versus historical integrity;
export privacy/tamper; pinned versus disposable retention. No synthetic change
is made to protected live configuration.

Polling observes intervals, not every possible transient write. Integer file
timestamps retain their precision but are not exact observed write times.
Cooperative same-user ownership is not a hostile-user sandbox. An excluded
change has unknown authorship unless separately established; exclusion gives the
task no authority to write it. Missing or ambiguous comparison fails closed.

The accepted-base phase inventory is retained separately before implementation.
The redesign's own Full uses the accepted workload, adversarial controls and
separate stock validation; a green self-test is not independent attestation.
Historical #1430/#1524/#1529 failures and exceptions are not promoted or retried.

## Shared executable role and actual consumers

Input contract v2 retains link count and ctime as observations for a declared
read-only shared executable. Its consumed identity still binds content SHA-256,
size, mtime, device/inode and resolved location; its safety identity binds mode,
owner/group, ACL/file-flag fingerprint and executable regular-file resolution. Only an otherwise identical,
complete observation may classify changed link count/ctime as
`incidental_executable_metadata`. It records the event without cancelling.
Missing hashes, replacement, byte changes (including writes through an alias),
unsafe paths and changed permissions/ownership refuse. Metadata changes trigger
a fresh hash and closeout always rehashes. Mutable resources, configuration,
evidence and cleanup retain their single-link protections. No task writes the
installed Browser. This prospective rule does not explain the historical
585-to-586 observation or identify its writer.

Browser-use v2 binds each launch's consumer, selected file and actual runtime
version from both the owned HTTP endpoint and CDP. The frozen Mac workload has
five integration launches (three durable, two cumulative), four project-experience
launches (one main, two project-client, one Web), five review-control launches
(including the four deliberate navigation-failure controls), and one in each
remaining named Browser phase. Counts are checked by executor and stock reader;
wrong executable, differing version, missing/extra records, content mutation or
unsettled cleanup cannot pass. NOT_RUN records never claim Browser use. The
separate development-only web-planning-continuation harness is not in this
selected Full inventory and supplies no qualification evidence here.

Candidate succession v2 remains local cooperative evidence, not a general
approval or scheduling system. A source review binds its authority reference,
exact predecessor/current trees, complete delta and changed-path inventory.
The same deterministic regression must fail before and pass after a source
revision; empty/comment-only changes cannot satisfy behavior-based controls.
A pure accepted-main merge is checked against the stock authenticated base and
the read-only recomputed non-overlapping tree-entry union; overlapping or resolved source requires a substantive
source-correction proof instead. Unsettled, unknown or timeout predecessors do
not acquire a successor through this bounded path. Every family retains one
initial invocation and at most one proved infrastructure recovery. Changed proof,
older attempt selection, wrapper restart, superseded candidate recovery and a
second successor refuse. Legacy v1 records keep their original interpretation.
Source review and fixtures remain inspectable; a local claim is not independent
attestation or permission to run outside the commissioned scope.

The Mac executable permission projection uses fixed read-only `/bin/ls -lde`,
`/usr/bin/stat -f %f` and `/usr/bin/xattr -lx` readers. These OS tools are also
declared read-only shared executable inputs, with the same complete identity
and safety checks. ACL entries, file flags and extended attributes are hashed
in memory, never copied to evidence. Linux disposable controls admit mode-only
files and conservatively refuse an ACL/security-context marker they cannot
resolve. Other admitted hosts retain complete metadata equality and receive no
new incidental-metadata exemption. Polling remains bounded and cannot prove
absence of transient changes between observations; every observed native
permission/flag/attribute difference remains a hard fault.

## Strict task-owned Browser input and replacement route

The version 5 lane is implemented by `local-canonical-browser-input.mjs`,
`local-canonical-browser-bundle.mjs` and
`local-canonical-browser-replacement.mjs`, composed with the existing executor,
input monitor, attempt ledger, Browser-use recorder and stock reader. The policy
above this source map owns admission; implementation does not authorize a run.

| Consumer | Strict behavior | Retained compatibility |
| --- | --- | --- |
| Controller/environment | Exact local binding and replacement proof; no default selection | Legacy explicit/candidate selection outside the versioned lane |
| Isolated phase and nested suite | Contract/path/fingerprint passed through the bounded environment; active checkout sentinel catches stripping | Existing HOME/temp/DB and process owners |
| Project, continuity, operator lifecycle, project-client, Web-planning, durable/cumulative | Shared selector plus actual-launch assertion; whole bundle and CLI/HTTP/CDP identity at launch/settlement | All 19 records; no product harness replacement; strict lane retains OS sandbox |
| Input monitor | Enumerated metadata/security each poll, conservative hash cache, forced final read | Starts before unit/integration; original AbortSignal and stop rules |
| Attempt ledger | One cross-kind immutable edge, latest tip, initial1/recovery0 for replacement | Historical source/recovery records readable; no renewed allowance |
| Stock and private export | Version 5 / export v2, authenticated review and grant re-read, exact live input reconstruction | Legacy receipts v3/v4 and export v1 stay readable |

`test-local-canonical-browser-input.mjs` and
`test-local-canonical-browser-replacement.mjs` add bounded unit controls using
real readers and temporary repositories/anchors. They cover missing/stripped
selection, link/content/permission/root races, all-fault eligibility, exact
review/grant/source/environment/workload, replay, concurrent claims, crash-window
refusal and fresh-process read-only reconstruction. Synthetic fixtures and
about:blank identity probes do not count as product Browser coverage or Full.
The reference inventory includes the app root itself; counts differ by one from
historical inventories which enumerated only descendants.
