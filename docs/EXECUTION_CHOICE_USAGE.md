# Choosing how to do ordinary project work

For [#1443](https://github.com/hynk-studio/augnes/issues/1443), the native Operator
entry is `augnes_prepare_repository_execution_choice`. Ask the native assistant
to compare the present arrangement with relevant alternatives, do the chosen
work, and revisit the arrangement after its result. A broad goal is sufficient;
the user need not invent a team or provide protocol identifiers. The assistant
uses the ordinary Resume and source readers to obtain those bindings.

The current slice supports existing unexecuted ordinary work eligible for source
revision. Managed/executed work retains its existing eligibility and successor
owners. An installed runtime/plugin must separately adopt this source capability;
this implementation does not install it or activate a reviewer.

## Ordinary sequence

1. Resume the repository, then call the execution-choice entry with `action: read`,
   `repositoryRoot` and the returned `expectedSnapshotBinding`. Read the current
   goal, success conditions, full selected excerpts, any existing choice, returned
   contribution, result assessment and next action. Connection information follows
   these work facts. An unavailable read is not an empty history.
2. Compare the present arrangement with one or more relevant alternatives. Use
   `action: choose` with `judgment`: `present`, `alternatives`, `recommended`,
   `chosen`, `expectation`, `uncertainty`, ISO `horizon`, and `reconsider_when`.
   Each alternative has `arrangement`, `benefit`, and qualitative `burden` fields
   for preparation, waiting, execution, coordination, integration and switching.
   Say `unknown` where unobserved. Labels describe arrangements; there is no
   mandatory four-mode enum or implication that roles equal executors.
3. Review the returned ordinary revision preview and explicitly save it with the
   existing work-revision tools. Preparation itself writes nothing. Read fresh
   work after saving. A direct or existing-asset choice can now complete under
   existing host authority without requesting participation. Verify any delivered
   asset bytes with their existing material owner before executing them.
4. For configured review, the chosen option needs a currently configured
   `review_connection` for `action: participate`. Supply the actual consumer's `purpose`, `question`,
   `success`, `checks`, `dependency_order`, `material_refs` and `recheck` conditions.
   Select whole excerpts whose bytes suffice for that bounded review. Inspect the
   returned material and request arguments, then explicitly use the existing
   `augnes_review_repository_work` request action. The reviewer uses
   `augnes_read_review_request` before `augnes_reply_to_review`. No Events activation
   is needed for this supported explicit-call path. Configured access alone is
   neither delivery nor observed competence.
5. Read back the exact returned response. Deliberately use, partly use, retain,
   defer or decline it. Existing `prepare_use` plus ordinary preview/save retain
   the attributed response and interpretation. Actually perform the relevant next
   judgment, input preparation or output-producing work, and retain that material
   with its real source/output identity. A confirming contribution may leave the
   goal and plan unchanged. Neither review text nor this tool authorizes commands.
6. With fresh work, use `action: assess` and `assessment`: `disposition`, exact
   `result_refs`, optional `request_ref`, `compared_with_expectation`, `decision`
   (`continue` or `end_role`), `next_action`, `reconsider_when`, and `unfinished`.
   Review and explicitly save the returned note. A used review needs its existing
   attributed-use record and downstream material beyond the response/use notes.
   The original choice stays unchanged. Fresh reads show both the original
   expectation and subsequent assessment. Logical closure does not revoke a
   credential, cancel a process or settle unknown external effects.

Each profile note remains within the existing 2,000-character, eight-selected-note
budget. A budget refusal requires a deliberate shorter assessment or ordinary
source-selection review; nothing is silently truncated or dropped. One choice and
one linked assessment form a loop. Ordinary source revision, retained lookup and
explicit reselection can compose another loop while preserving earlier packets.
The optional preparation below connects one next arrangement to its assessed
predecessor without a separate manually authored continuity note.

## Manual contribution without a configured reviewer (#1511)

Use the same native entry and eligible unstarted ordinary task. In `choose`,
explicitly set `manual_contribution: true` on the chosen alternative; omit
`review_connection` on that alternative. Direct/asset choices and configured
review retain their existing contracts. The manual route prepares ordinary notes;
it does not use the configured aggregate-service adapter or create native review
requests, status, authenticated participants or material-read witnesses.

1. Read current work and deliberately select the complete permitted excerpts.
   Call `participate` with `participation`: `purpose`, `question`,
   `expected_return`, `checks`, `check_use_owner`, `return_method`,
   `feedback_method`, `recheck`, and their exact `material_refs`. For example,
   ask a declared contributor to check available stock from a selected inventory,
   return arithmetic and limits in a manually exchanged UTF-8 file, and identify
   the origin maintainer who will check and use it. Each text field is bounded
   to 240 characters. The saved request includes the full selected excerpt bytes,
   their source identities, the choice and definition fingerprints.
2. Inspect `delivery`, then preview and explicitly save `revision_arguments` with
   the ordinary writer. Preparation saves and sends nothing. Only `delivery` is
   prepared for manual relay; it excludes source locators, unselected notes and
   repository paths. The local writer arguments contain the repository root and
   are not a transmission payload. Selected text can itself contain private
   content: review its bytes and permissions before any relay. A locator is never
   fetched or counted as delivered source bytes.
3. Explicitly read one received file and call `receive` with `manual_return`:
   `manual_request_ref` and `material_ref` copied from that delivery, exact bounded
   original `content`, `source_revision`, `selection` (whole original or exact
   selected-excerpt identity), declared `actor`, and `assistance`. Inspect the
   preview and explicitly save. The content is retained unchanged as
   `imported_unverified`; identity, revision, assistance and manual receipt are
   declarations, not authentication or proof that the contributor read anything.
   Do not execute commands merely because they occur in a returned file.
4. Read the saved original, check the exact request and current applicability,
   and perform the concrete next judgment/input/output work. Retain that downstream
   material through ordinary preview/save. Call `assess` with `assessment`:
   `manual_request_ref`, `manual_return_ref` (from the saved read), `result_refs`,
   `disposition` (`used`, `partly_used`, `retained`, `deferred`, `declined`),
   `checks`, `applicability`, `reason`, `uncertainty`, `unfinished`, `next_action`,
   and `reconsider_when`. Positive use and evidence-backed RETAIN require new
   downstream material beyond the original support and profile notes. A count
   or PASS assertion alone is not independent correctness evidence. The decision
   saves a separate derived interpretation and exact selected downstream excerpts.
5. If the original definition or material changed, add a deliberate `reassessment`
   explaining current applicability. Changes after saving a decision are exposed
   on read and prevent preparing current feedback. Preserve the previous decision
   and feedback in history by ordinary explicit deselection, then assess fresh;
   no automatic refresh or reassessment occurs. Missing or ambiguous retained
   records refuse. Unknown saves require fresh readback before another decision.
6. Call `feedback` after saving the decision. Preview/save its ordinary note.
   Its separate `delivery` contains exact original/request/decision identities,
   scoped checks, disposition, reason, uncertainty, remaining obligation, next
   instruction and next-check conditions. Read reconstructs the same feedback
   from the saved immutable decision. Explicit manual relay and observed recipient
   readback remain separate evidence; preparation never asserts either event.

The same eight-selected-note and 2,000-character-per-note limits apply, including
serialized identity/metadata and full excerpts. Oversized material refuses; select
a sufficient bounded excerpt with explicit original identity through ordinary
revision or shorten authored fields deliberately. Nothing is silently truncated,
evicted or fetched from a private locator. A feedback pointer can recover exactly
its decision, return and request through bounded retained lookup when those notes
are deselected. Original downstream bytes remain in the decision, with current
selection shown separately. Deselection never means no historical receipt/use.
When all cycle references are deselected, no history absence is inferred; use
ordinary retained lookup and explicit reselection to inspect that history.

The registered deterministic test uses real native proxy/HTTP read, preparation,
preview/save and retained readers with a task-owned database. An inventory of 17
units, 5 reserved and target 20 yields 12 available and 8 to top up. The origin
independently checks those counts, uses them in a restock card and declines order
advice because physical stock is unknown. After the producer exits, a fresh
ordinary reader produces the printable card from saved work; the outer checker
compares exact bytes and saved/manual feedback. Mismatched requests/bases,
incomplete and unavailable material, changed work, atomic/stale saves, disclosure,
history and overflow have separate checks.

```sh
node --import tsx scripts/test-manual-contribution.ts
# Optional new absolute directory retains synthetic original artifacts:
node --import tsx scripts/test-manual-contribution.ts /absolute/new/output
```

All roles and arithmetic are implementer-authored development fixtures. File
selection, manual relay, origin checks and explicit saves remain human/agent work.
The test proves deterministic mechanics and fresh reconstruction, not independent
external participation, semantic understanding, comparative benefit, organic
discovery, installed adoption or full W1/W2. No new consumer/model/provider study
is performed. The fixed workflow-cost distribution and #1493 observation are not
rerun or used as this fixture.

## One result-informed next arrangement (#1498)

After assessing a returned review, use `action: reconsider` with a fresh
`expectedSnapshotBinding`, a new `judgment` in the same format as `choose`, and
a bounded `reason` explaining why the result/current conditions justify retaining
or changing the arrangement. Keeping the same reviewer, doing the work directly
or using an existing asset remain valid choices. Recruitment is optional.

The prior choice and assessment must still be selected, their result references
must be selected, and their original request/response must remain available under
the existing review configuration. This increment requires an unchanged definition
in one eligible unstarted ordinary task segment and the same project, registered
and physical root, and effective direction. It reuses the late-review owner's
original-basis/current reassessment to check these boundaries. A missing,
ambiguous, out-of-budget or unavailable history refuses; it is not absence.

The returned ordinary revision **deselects only the old choice and assessment**
and adds the next choice with exact content-addressed predecessor-note references
and the authored reason. Review the preview and explicitly save it. Other notes,
including checked results and attributed contributions, remain selected. No prior
packet or note is rewritten. A subsequent `read` resolves exactly those two
references through bounded retained lookup and shows their original text, request,
response, current attributed-use reasoning, earlier unfinished obligations and
selection status separately from the current choice. These are provenance links
and authored judgments, not independent verification of a claimed result.

Participation preparation carries the prior assessment reference, reason and
unfinished obligations into the new request. Deliberately select sufficient
current result/input excerpts in `material_refs`; a historical reference alone
does not deliver missing bytes. The replacement still reads and answers its own
request. An earlier participant's late reply uses the existing explicit
`historical_v1` receipt/current reassessment path and cannot answer or assess the
replacement request. Prior unfinished text remains an earlier assessment; only
actual subsequent evidence and a new explicit assessment can settle it.

This is one linked transition, not recursive reconstitution: a second
`reconsider` on a linked choice refuses. Ordinary revision/retained-material
composition remains available. Logical replacement never revokes a credential,
cancels a process, changes project direction or settles unknown external effects.
Reads/preparation write nothing; existing preview/save owns atomic failure,
staleness and replay. Existing single-choice records remain supported.

The disposable packing exercise first demonstrates the existing composition:
explicit deselection, two retained lookups, manual linkage/reason/unfinished
authorship and ordinary save can complete the same task. Its manual link consumes
one selected-note slot, so that case explicitly deselects an earlier use note
(still retained in history). The improvement prepares and validates the link
within the choice note and exposes it in the ordinary reader. No timed human
comparison or reduced total-cost claim is made.

Two synthetic configured reviewers produce a checked partial count, then a
separate-batch tray allocation. The origin retains the first count, uses the
replacement's checked allocation and rejects its unsupported dispatch suggestion.
After the producer exits, a separate consumer program reads persisted material
through normal entry and creates actual printable-label records, preserving the
unknown physical-stock obligation. The consumer imports no producer code,
expected answer or artifact; the outer test independently checks its output.

```sh
node --import tsx scripts/test-execution-choice-transition.ts
# Optional new absolute artifact directory; append "existing" for manual composition:
node --import tsx scripts/test-execution-choice-transition.ts /absolute/new/output existing
```

The existing `test-execution-choice.ts` also runs malformed/ambiguous linkage,
missing result, unavailable basis and read-race controls at the adapter seam.
The two-process exercise runs separately with the existing bounded process/resource
owners; it does not change the Canonical suite's deadlines or inventory.
Evidence is synthetic engineering use. Actual external participation, human/model
semantic use, comparative benefit, installed adoption and broader W1/W2 completion
remain unestablished.

## Changed conditions and failure meaning

Original definition/support changes or an elapsed horizon prevent a fresh request
from being prepared under the old judgment. Retain its original basis, inspect the
change and explicitly prepare the next arrangement. Existing review requests keep
their exact identity: a default first reply on changed material refuses, already saved
work remains historical, and `prepare_use` does not auto-merge it into newer work.

If the selected participant disappears before a request, direct work remains
available. Save the actual availability observation, then deliberately defer or
decline and continue/end the role with a reconsideration condition. If a request
cannot currently be inspected, its state remains unavailable. Ordinary notes can
retain obligations while access is resolved; a missing response is not success.
Request inspection stops after 100 rows and reports an incomplete lookup; it does
not silently report absence. Older ordinary work and readers remain usable.

Failed saves preserve their refusal. Unknown outcomes require explicit fresh
readback before deciding another action. Source notes are derived/imported
material, not accepted semantic state, repository approval or independent outcome
verification. No child project, project-direction grant or permanent coordinator
is needed for a bounded contribution role.

## Explicit late review and current reassessment (#1486)

When B and C have both read the same ordinary work, B's incorporated result may
advance it before C answers. C can explicitly pass `receipt_mode: historical_v1`
to `augnes_reply_to_review`, with its original `request_ref`, `read_binding`,
answer, limitations and original source bindings. The default remains current-only.
The existing validated packet history must prove the exact original definition
and disclosed source bytes. Current connection/authentication/expiry and unchanged
project, registered/physical root and effective direction are required. The
original packet must belong to the current task's eligible unstarted ordinary
revision segment. New tasks, started/managed or semantic work, corrupt, missing,
ambiguous or over-budget history remain unavailable. A first read after the
material changed still refuses. No new snapshot storage or migration is used.

A saved late answer is historical, unverified review material. Receipt does not
apply it. After an uncertain reply outcome, the contributor can use
`augnes_get_review_status` with its exact `request_ref`, or the paginated reviewer
list, before deciding another delivery. The origin uses list/readback. Exact
duplicate replies replay and conflicts refuse.

The authorized origin uses `augnes_review_repository_work`:

1. `readback` the exact answer, then `reassess` with `connection_ref` and
   `request_ref`. Inspect the complete original answer and original/current
   definitions and sources, exact intervening packet references, and the source
   additions/removals. These are factual changes, not a semantic compatibility
   judgment. Source locators retain the ordinary disclosure rules.
2. `prepare_reassessed_use` with the returned `expected_response_ref` (the
   `response_ref`), `expected_reassessment_binding` (the `reassessment_binding`),
   `choice` (`use`, `partial_use`, `revise`, `defer`, or `reject`) and bounded
   `reasoning`. Explain applicable parts, superseded/conflicting parts, relevant
   intervening results and unresolved obligations. Preparation persists nothing.
3. Combine the returned ordinary `revision_arguments` with deliberate current
   edits or result notes. Inspect `augnes_preview_repository_work_revision`, then
   explicitly use `augnes_save_repository_work_revision` with the same arguments
   and returned `previewBinding`. Both the full attributed answer and the authored
   use/non-use reasoning are retained. B's existing sources remain selected unless
   the origin explicitly changes them. Prior packets preserve earlier selections.

Changes between reassessment, preparation, preview and save refuse atomically.
Keep the draft, read fresh material and deliberately reassess; do not automatically
resend or silently replace the basis. The existing eight-note, 2,000-character
per-note and aggregate budgets still apply. Preparation cannot guarantee capacity
for the origin's further edits; the ordinary preview/save owns that check.

`node --import tsx scripts/test-late-review.ts` exercises real private HTTP routes,
native tools and reviewer adapters with a new synthetic water-delivery case.
B replaces a 20 L vehicle with a stipulated 30 L vehicle. C's original response
correctly includes 3 L reserve in the 27 L load, but suggests two trips based on
the old capacity. Explicit partial use yields a checked one-trip current plan,
retains both responses and rejects the old trip count. Road access remains an
unfinished check; no dispatch is authorized. After the producer exits, another
process reads normal authorized persisted material and computes the follow-up;
the supported disposable backup/restore repeats that read in a fresh process.

This is exposed deterministic mechanism evidence. Actual external participation,
human/model semantic consumption and comparative usefulness are `NOT_RUN`. The
trace counts actual requests and elapsed process time, including deliberate fault
injection and checks. Manual retained-note/current-review use would still require
original-material retention, current inspection, selection, preview/save and
follow-up checking. No timed manual comparison, human effort, token/billing cost
or speedup is claimed. Exact-candidate qualification belongs to the PR receipt.

## Contributor status after the origin advances (#1506)

In the scoped reviewer adapter, call `augnes_get_review_status` with only your
known `request_ref`. It directly returns the request's saved answer, attribution,
currentness, origin-readback marker and already-permitted current-use reasoning.
The same item remains available through the paginated reviewer list. Status can
be read by a fresh reviewer process even when an ordinary origin save has made
the original exact-material read refuse `review_material_changed`.

For an unanswered current request, read its exact material before deciding
whether to reply. For an unanswered historical request, a late reply still needs
a valid prior material read and the existing explicit `historical_v1` proof.
Status inspection creates no read witness or first-reply permission. For an
answered request, inspect the saved response and any authored use explanation;
no new request or resubmission follows automatically. Only the origin can prepare
use/reassessment and explicitly preview/save its work.

A useful contribution can be partly used: for example, retain failed attempts
in a cost population while declining advice to rerun them because reruns would
change that population and lack execution authority. The explanation is the
origin's authored interpretation, not independently verified success or model
judgment. If the response or use note is later deselected, status reports
`not_observed_in_current_work`; that does not erase prior packets or establish
permanent rejection or no prior use. Contributor inspection does not mark an
answer `served_to_origin`; genuine origin readback remains a separate action.

The existing request-bound-review and supervised runtime checks exercise this
sequence through HTTP and reviewer MCP, including a fresh process, a target
beyond page one, exact list parity, refusal and all-application-state preservation.
Synthetic deterministic reconstruction establishes supported behavior; external
participation, model understanding and comparative benefit remain unestablished.
See the [exact status/disclosure contract](../apps/augnes_apps/README.md#opt-in-request-bound-review-1433).

## Concrete exercised consumer and evidence

The registered `scripts/test-execution-choice.ts` uses the synthetic v1 build
events and callable owners from #1427/#1431. The originating goal is all unique
attempt cost, including failures. Direct exact rational arithmetic and a verified
delivered normalizer are meaningful alternatives. When selected, a deterministic
population reviewer receives the complete event rows through the real scoped
review reader, deduplicates repeated deliveries and returns its calculated
population, total and failed time. The origin uses the response to select the
normalizer's capacity calculation and checks the generated file independently:
six attempts, total **7,500 ms**, failed time **3,250 ms**. These are synthetic
worker totals, not elapsed completion time or measured savings.

| Issue criterion | Observable evidence |
|---|---|
| Compare arrangements; avoid unnecessary recruitment | Ordinary native comparison and saved choice; direct and asset branches finish with zero review requests. Recommendation and chosen action differ in the direct branch. |
| Deliver usable material; attributable contribution | Real proxy/HTTP production writers and reviewer adapter; exact event excerpts, request read binding, calculated reply and source refs. |
| Actual originating use | Returned population selects the actual delivered CLI mode; returned totals are checked against the output and independent expected fields. Ordinary work retains response, interpretation and output identity. |
| Changed basis / unavailable participant | Pending old-basis request retained and refused after goal change; absent configured reviewer produces explicit deferred/end-role continuation. |
| Result-informed next arrangement | Original expectation retained byte-for-byte; selected output and request feed the end-role note, explicit reconsideration condition and fresh-process readback. |

Coverage also checks wrong project/snapshot/request, duplicate requests and
responses, conflicting responses, insufficient material, failed-save atomicity,
repeated choice/assessment refusal, project selection preservation, and closure
without credential withdrawal. Disposable nonempty stores use the existing
migration owner. No existing Browser scenario, assertion or timeout is weakened.

Run with the supported repository dependencies:

```sh
node --import tsx scripts/test-execution-choice.ts
```

An optional new absolute output directory retains synthetic tool traces, checked
audit files and phase durations. It excludes the disposable DB, access files and
synthetic credentials. The bounded lifecycle owner settles children, closes the
loopback listener and removes temporary state. The deciding Local Canonical run
selects and qualifies the final source separately.

This is exposed deterministic development evidence. Actual model consumption and
comparative usefulness are **NOT_RUN**. A fresh process proves reconstruction,
not a separate task, independent model or blind evaluation. Phase timing groups
setup, direct/asset work, participation preparation/execution, integration/readback
and changed/unavailable preservation; it does not estimate unobserved model or
human effort. Typechecking and exact-candidate verification are separate costs.
Conditional v1 reuse retains its schema/units/population requirements, Node and
file dependencies, observed output and recheck/non-use conditions. Execution
know-how remains distinct from why a review was requested and how it was used.
No public recruitment, provider spending, MASS comparison, #1447 work, installed
adoption or another task's #1433 trial evidence is included.
