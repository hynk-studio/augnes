# QA serial aggregate consumer: integration specification

This is the #1609 / Draft PR #1611 consumer specification for the shared
orchestration and incident-admission work owned by #1608 / Draft PR #1614.
It records the source inventory and acceptance checks while that dependency is
unpublished. It changes no executable budget, admission rule, allowance or
qualification result. The [Local Canonical policy](../../.github/LOCAL_CANONICAL_VERIFICATION.md)
remains the authority owner.

## Source and dependency boundary

The inspected #1611 implementation is `ac676c7f9992da867cbd15a739f3ca845d27c59f`,
tree `3532ab83be13a4a4ed34a19a8bbf03788485ed50`, against base
`91fbce943d2ba915c3337bd6ad6d655ed99b01a6`. Receiving review accepted that
implementation and its final Browser accounting correction. Qualification
remains HOLD. A1-A4 and H1-H4/H6-H12 are retained; H5 remains outside scope.

On 2026-11-09, remote inspection still found #1614 at
`ce6d0d3d6da8ae91680f16b8ccfa347f4c03f6ca`. Its published source does not contain
the proposed shared serial budget or v2 incident route. Work in its owner's
dirty worktree is not an integration source. Consume one explicitly reviewed,
published shared implementation when available, record its exact commit and
delta, and retain compatible #1613 changes. Do not import unrelated Native
navigation changes or fork a competing timeout/admission owner.

The compatible maintenance candidate to reconcile is #1613 at
`987e102dd3d8bbae9f0d3e933b01a9a805ee35f7`. Its stable protected Git-input route
does not itself admit this timeout incident. It is not adopted by this
specification. #1610/#1612 retains original-receipt reconciliation ownership.

## Committed consumer inventory

The actual owner is
[`run-canonical-test-suite.mjs`](../../scripts/run-canonical-test-suite.mjs).
Each command uses the selected Node executable, repository cwd and
`--import tsx`; every child requires natural exit. Preserve the existing
assertions, requirements, isolated resources and this order.

| Child | Script and arguments after `--import tsx` | Execution limit | Browser-use records |
|---|---|---:|---|
| project-experience | `scripts/browser-validate-project-experience-v1.mjs` | 360000 ms | project-experience: 1 |
| project-client-browser | `scripts/test-project-client-browser.ts` | 60000 ms | project-client: 2 |
| web-planning-browser | `scripts/browser-validate-web-planning.mjs` | 180000 ms | web-planning: 1 |
| web-planning-draft-safety | `scripts/browser-validate-web-planning.mjs --draft-safety` | 60000 ms | web-planning: 1 |

All four require database, migrations, filesystem, process, listener, Browser
profile and CDP-session ownership. Project-experience additionally requires
project-root and immutable-fixture-input ownership. The draft-safety child
inherits the Web requirements and natural-exit flag; its separate disposable
state preserves the original Web child's 180000 ms limit.

The [Browser identity owner](../../scripts/local-canonical-browser-identity.mjs)
requires project-experience: 1, project-client: 2 and web-planning: 2, totaling
five records for this phase. The selected complete workload requires twenty
records, including five in integration. The seven Browser phases are still
seven phases; launch records are not phase counts.

An AST-derived observation of this exact inventory has SHA-256
`b080e4d211a31060dcf94217a688b83f2a8ab0760883f2abc09adadcdc12dad3`.
It binds the accepted source head, phase, ordered children and record counts
in the retained consumer observation. It is a review artifact, not a shared
route's preparation commitment or an execution grant. Future integration must
derive and bind the actual committed shared inventory through that owner's
supported input machinery.

## Disjoint accounting to implement and review

The child execution-limit sum is **660000 ms**. This is already the proposed
total for #1614's different three-child consumer; copying that total would
omit this consumer's settlement and coordinator intervals.

For the inspected accepted no-descendant path,
[`settleOwnedProcessAfterExit`](../../scripts/test-harness-process-lifecycle.mjs)
allows 1000 ms stream drain, two process snapshots bounded at 2000 ms each,
and a 5000 ms close wait: a conservative **10000 ms per child**, or **40000 ms**
for four. This arithmetic describes the named bounded waits. Scheduling and
synchronous overhead still need accounting; it is not a wall-clock guarantee.

With a separately justified and enforced **30000 ms coordinator allowance**,
the arithmetic candidate is **730000 ms**. This is not an approved or currently
implemented cap. The current parent still has its 480000 ms execution limit.
The shared implementation must make each interval exclusive:

- Child Node/tsx startup and execution spend that child's own limit.
- Each child's natural post-exit settlement spends its separate allowance.
- Parent Node startup/imports, suite preparation, between-child work, final
  output and resource settlement spend coordinator time. Enforce this allowance
  independently, including startup before the first child and final work after
  the last child. Early child completion cannot subsidize slow coordination.
- The outer supervisor's post-exit settlement is separate from the parent
  execution envelope. Do not count it twice or claim total observed phase
  duration cannot exceed the envelope.

The current suite calls maintenance acquisition with `joinAncestorLease: true`.
The [service owner](../../plugins/augnes-operator/mcp/companion-service-core.mjs)
can return no lease, join an existing ancestor lease, or acquire its own lease.
The last case can require 30000 ms acquisition and 90000 ms restoration, which
cannot be hidden inside a 30000 ms coordinator allowance. The original isolated
Full records outer maintenance acquisition as false and preserves the same
live Companion identity. It does not supply a completed suite maintenance
summary for the interrupted phase.

The shared route must enforce the supported no-lease/ancestor-joined path
before acquiring an obligation, or propose separately justified accounting for
an owned lease. A joined child must not release its ancestor's lease. A budget
failure must finish required cleanup/restoration and remain a failure. Forced
descendant termination, child assertion failure, individual timeout, incomplete
cleanup and inventory disagreement never become accepted natural completion.

## Actual predecessor and evidence mapping

The physical latest tip was reobserved on the authorized Mac through the
existing lineage reader. It is the settled v2 `source_revision` below, not a
consumed reviewed-v7 commission.

| Binding | Retained identity |
|---|---|
| Latest head | `9ec620edeba7ec48cea28ada89dd346299ca469f` |
| Latest family | `f411b1b9aa8d0cc9c5561177fde97c00eb00be735a7c1ac97ad8be0976345ba7` |
| Attempt | `2026-11-09T03-50-50-439Z-changed-9ec620edeba7-6b9182139ee214f5`, number 1 |
| Receipt fingerprint | `2dfd175afca15e4bec4140365941fe6d1e34bf7e65d9039bc91f44cf77fc0fb6` |
| Original root family | `2218574fb2c535455aa68804a3cc5f283eb33ec2b38e7f64bb29df9ca416f395` |

The root's exclusive edge points to the latest family; that family has no
successor edge. Both receipts pass integrity and physical-record inspection.
The original 5 PASS / unit failure / 10 NOT_RUN and subsequent 9 PASS / timeout /
6 NOT_RUN remain unchanged. The latter remains `unclassified_timeout`, Browser
0/7 and false stock. The final accounting-only correction did not explain or
remedy the timeout.

Read-only checks of the actual retained originals establish:

- All ten executed phases have exact environment fingerprints matching their
  input binding. The six following NOT_RUN placeholders lack executed
  environment fields; their planned binding entries remain present.
- All eight present Browser records validate against the original executable
  binding and one actual version: five in integration, and three in the
  interrupted phase (project-experience once, project-client twice).
- The first two serial children completed naturally in 289207 and 14268 ms.
  The original Web child started and remained active when the outer limit
  expired. No result or completed Web-use record was emitted for it. The
  draft-safety child never started. The complete wrapper stdout and the capped,
  explicitly truncated 2097152-byte phase log are separate originals.
- Original cleanup completed with zero owned processes and preserved Companion
  identity. This does not turn an interrupted operation into success.

The future incident reader must independently establish this mapping from
original receipt, source, logs, inputs and physical lineage. Missing Web records
and following NOT_RUN fields may explain these specific gaps only. A different
consumer, binary, version, location, executed environment, unexpected extra
record or unexplained missing record must refuse. Do not waive all errors
named `receipt_browser_identity_invalid` or
`receipt_phase_environment_binding_invalid`. Every original false-stock reason
remains in the historical output.

Use the shared supported v2-to-new-variant transition with this consumer's own
accepted source, inventory and originals. Preserve the original logical root,
exclusive edge and consumed history. Bind the discriminator, predecessor,
accepted target and issued limit through preparation, authenticated authority,
reservation, replay and stock. No #1614 grant transfers to #1611; no new-family
reset or invented reviewed-v7 predecessor is acceptable.

## Focused integration acceptance matrix

Extend the shared production orchestration/admission regression owners when
the reviewed source is available. Do not add a parallel policy harness or
repeat product Browser journeys just to exercise budget mechanics.

| Control | Required result |
|---|---|
| Four children complete under their individual bounds | Natural completion, exact order/commands/assertions, five phase records, complete cleanup; disjoint accounting sums correctly. |
| Old aggregate interruption versus corrected controlled completion | Production orchestration demonstrates the contract difference using controlled durations; this does not classify the old incident. |
| Child assertion failure or individual timeout | Fail and settle resources; later children do not run or borrow unused time. |
| Forced descendant termination or incomplete cleanup | Fail even when the root exited zero; preserve cleanup/restoration obligations. |
| Coordinator exceeds its allowance before/between/after children | Fail independently of unused child time and the outer aggregate timer. |
| Missing/reordered/extra child, changed command/limit/requirement | Inventory disagreement refuses; no environment/CLI override. |
| Missing/extra/misattributed Browser record | Exact five-record phase and twenty-record workload contract refuses. |
| Executed environment or present Browser evidence altered | Incident admission refuses; only the exact interrupted/following-unrun gaps are explainable. |
| Valid actual v2 predecessor with exact accepted consumer | Non-reserving preparation binds its own originals and inventory; creates no attempt, lease, grant or edge. |
| Wrong/older predecessor, another PR's authority, target drift | Refuse before reservation. Reobserve latest physical tip and current publication. |
| Duplicate or interrupted reservation | Existing exclusive lineage and single issued allowance prevent reset/reuse; no automatic second ordinal or recovery. |
| Historical replay versus current publication | Replay uses recorded identities; moved publication refs do not rewrite valid old history. Current admission/applicability still checks current identity. |
| Sanitized export | Structural checks and proof/incident bindings only; deciding=false and independent_attestation=false. Digests cannot establish physical tip or causal history. |

## Preparation status and next boundary

The consumer inventory, original-evidence mapping and integration specification
are available for independent review. **Shared integration and supported
non-reserving preparation are BLOCKED_SHARED_SOURCE_UNPUBLISHED.** No supported
preparation commitment has been produced and no grant or reservation consumed.
The exact dependency is the reviewed, published #1614 implementation covering
the shared budget owner, v2 incident transition and all its consumers/readers,
with a supported four-child integration surface and compatible #1613 changes.

After that dependency arrives, integrate its exact delta, run the matrix above,
obtain independent read-only source/result review, run the unchanged planner
on the exact published candidate and complete supported non-reserving
preparation. Independent acceptance of those concrete materials must precede
a separate authenticated prospective execution grant. Only a later authorized
complete planner-selected Full/Browser and separate fresh-process stock can
close qualification. Keep #1611 Draft, auto-merge off and qualification HOLD.
