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
  at most one continuation shared between substantiated infrastructure recovery
  and prospective input requalification. Family identity survives wrapper restart and cosmetic commits.
  A genuinely revised candidate uses one immutable predecessor/successor binding,
  retained exact-delta source review and original receipt. Meaningful revision after
  PASS uses identical fail/pass regression evidence. A verifier correction after a
  safety stop additionally binds the original fault and an allowlisted verifier
  owner. A necessary accepted-main integration binds the freshly admitted main,
  exact two parents and independently recomputed tree-entry union. None recasts old
  outcomes as infrastructure, resets an unchanged target or grants permission.
- `local-canonical-evidence-retention.mjs` protects active and explicitly pinned
  evidence. Unsafe aliases and ambiguous ownership refuse cleanup.
- `local-canonical-input-requalification.mjs` owns bounded predecessor/history,
  complete current-input and reviewed adoption inspection. The attempt owner
  supplies the shared atomic claim; the executor supplies normal admission,
  renewed main, freeze/monitor and child ownership. Stock rechecks those bindings.
- `test-local-canonical-classification.mjs`, `test-local-canonical-review-corrections.mjs`
  and `test-local-canonical-input-requalification.mjs` exercise real classification,
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
initial invocation and at most one continuation shared with input requalification. Changed proof,
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

## Prospective input requalification and #1533 adoption

The versioned route is intentionally narrow. An original git-config invalidation
may continue once after complete settlement, full relevant history review and
explicit prospective authority for a safe accounted current input. It does not
repeat #1533's completed whole-workload non-consumption audit, identify its
historical writer, require an original PASS, or fabricate a verifier defect.
The input guard, 16 Full phases, seven dedicated Browser phases, all accepted
children, historical 30-second bound and existing concurrency remain intact.

The local proof (`augnes.local-canonical-input-requalification.v1`) contains:

- `kind`: `unchanged_source` or `accepted_main_adoption`; exact `branch`, `head`,
  `tree`, `accepted_main`.
- `prior`: retained `family_id`, `number: 1`, `attempt_id`, original
  repository-relative `receipt_path`, `receipt_fingerprint`, `input_fingerprint`
  and `fault_fingerprint`, plus exact-byte `receipt_bytes_sha256`,
  `attempt_record_sha256` and `completion_record_sha256`.
- `history_review` and `source_review`: adjacent `{artifact, sha256}` JSON
  descriptors. History v1 binds the receipt/input/fault/events/secondary/phases,
  complete untruncated log paths/byte counts/SHA-256s, review reference/time and
  empty unresolved/independent-failure lists. These lists cannot override an
  observed failure. Source v1 binds the predecessor, target and main identities,
  source review reference/time and every reviewed overlap.
- `input`: `resource: git-config`, `change_kind: additive_branch_tracking`, exact
  `current_observation`, its `current_observation_fingerprint`, and ordered unique
  complete byte `snapshots` as `{artifact, sha256, bytes}`. Artifacts are local,
  regular single-link owner-controlled `.json`/`.bin` files beside the proof.
- `authority`: existing task `reference`, decision
  `authorize_prospective_input_requalification`, scope `one_complete_invocation`,
  exact `head`, `tree`, `base`, `current_input_fingerprint`, `historical_writer:
  UNKNOWN`, empty `unresolved_risks`, and `issued_at` after original settlement.

`digest` in `scripts/local-canonical-inputs.mjs` defines sorted-key JSON hashes
and exact byte hashes. Use `observeInputFile` for observations and
`inputAdoptionInventory` for the read-only merge-base/full-entry inventory,
changed paths and binary-delta digest. Adoption source review additionally binds
`merge_base`, `inventory_fingerprint`, `delta_sha256`, `changed_paths`, all
predecessor-added/changed `task_assets`, and `overlaps`. Each overlap names the
exact full entry (`path/base/predecessor/main/target/divergent`), kind
`reviewed_additive_overlap`, review reference and adjacent preservation witness.
The witness schema `augnes.local-canonical-integration-preservation.v1` binds
`head/tree/delta_sha256/paths/node_version/finished_at` and the real bounded child
`result`. It must demonstrate natural exit 0, no cancellation/timeout, closed
streams, observed exit, complete cleanup and zero remaining owned processes.
A local review or authority field is a binding to an existing decision, not a
signature, independent attestation or permission generator.

### Read-only retained predecessor example

From the reviewed infrastructure source, the following only reads #1533's
registered original checkout, receipt, Git objects and anchor family:

```sh
node scripts/inspect-local-canonical-input-predecessor.mjs \
  --checkout /Users/hynk/code/augnes-1527-method-composition \
  --receipt .augnes-local-verification/receipts/2026-10-24T10-29-34-934Z-changed-506d6d098c9c-41c3e9de7f6bfc9c.json
```

The retained v1 family is
`ec8ce827525cc6a4b0e2cecee952f26bcf9b3df33a4eaaa4891a7b2e01dc4e0b`;
original head `506d6d098c9c8a3ddf91e4e0d99281fbfe9ba8c5`, tree
`99f4c51e0b7915794fa92f29ffe343d4282817ec`, and original base
`9244241b2ac39d6cf0f1b8f0a74b99a307deb2cf`. This example expects attempt 1,
`input_invalidation`, seven passing phases, cancelled integration and eight
NOT_RUN phases. Its remaining allowance is an observed local fact, never a
reservation. The command explicitly reports `invocation_eligible: false` and
lists the remaining review, input, source, authority and capacity requirements.
Any later record or changed source/evidence must be inspected afresh.

### Later adoption procedure (not executed by #1535)

1. After independent review and user acceptance/merge of this infrastructure,
   obtain a separately concrete #1533 target and one-invocation authority. Refresh
   authenticated main, exact retained predecessor and actual owners/capacity.
   Coordinate every worktree/fetch/branch/publication mutation before any other
   owner's deciding freeze. Do not infer free local leases from remote status.
2. Preserve the registered predecessor checkout and every original receipt,
   input freeze, fault, attempt/completion and raw log byte. If a different target
   checkout is needed, copy the required original receipt/logs byte-for-byte into
   the same repository-relative artifact paths; retain SHA-256 readback. Keep
   the original physical checkout registered for ownership inspection.
3. Create an exact ordered two-parent integration of the retained predecessor
   and freshly authenticated accepted main. Enumerate the entire entry/delta/path
   inventory. Preserve the #1527 research sources/observations, and review both
   branches' additions in `run-canonical-test-suite.mjs` and
   `test-local-canonical-verification-contract.mjs`. Review each divergent overlap
   and run focused bounded preservation controls. Do not add unrelated edits or
   claim this integration repaired a fictitious verifier defect.
4. Retain complete Git-config before/observed-after/current bytes with hashes
   matching every original/current observation. A reconstructed historical byte
   file must be labelled as reconstructed and match the original retained digest;
   it is not a newly observed historical writer. Do not restore shared config.
   Review every byte, phase, event, secondary fault and complete raw phase log.
   Unknown relevant remainder or unresolved current safety/authority risk blocks.
5. Bind the explicit current-input authority and actual source/history reviews
   in the local proof above. Use the ordinary read-only intake before requesting
   an admission; no local file grants authority. Record the exact current Node,
   clean target, main, planner-selected coverage and frozen proof identity.
6. With that separate invocation authority, run the normal executor once using
   exact `--base` and `--head`, `--checkout-context isolated-worktree`, and
   `--input-requalification-proof`. The executor admits attempt 2 in the original
   family, re-authenticates main, freezes current inputs, claims the shared slot
   and executes the whole selected workload. Any new admitted drift spends it.
7. After complete cleanup, run the ordinary separate `node scripts/run-local-canonical-verification.mjs validate` command
   with its repository-relative receipt path and isolated context. Retain both
   receipts independently; export only permitted derivatives with byte/hash
   readback. A failed or stale new result leaves the original unchanged. Do not
   retry, mark Ready, merge or broaden authority from a receipt.

The infrastructure candidate itself uses its ordinary initial invocation. Its
integrated suite uses disposable Git histories and real admission/monitor/phase
executor/owned-child/stock readers, including fresh-process inspection, legacy
records, reviewed overlaps, source/input/recovery competition and quota refusal.
The v1 compatibility fixture constructs the old writer shape once before its
real workload; it never migrates a real original. Fixed fixture host metadata
and a disposable main transport are test context, not Mac qualification or
independent review. Failed development controls remain in private evidence with
the actual source or fixture correction identified.
