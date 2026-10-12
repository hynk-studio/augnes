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
4. Only a chosen option with a currently configured `review_connection` can use
   `action: participate`. Supply the actual consumer's `purpose`, `question`,
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
one linked assessment form the first loop. To begin another, explicitly select
the next ordinary context while retaining worthwhile results and obligations in
existing history. Prior notes can be read/reselected through the existing retained
source owner; no automatic history sweep or role reconstitution is added.

## Changed conditions and failure meaning

Original definition/support changes or an elapsed horizon prevent a fresh request
from being prepared under the old judgment. Retain its original basis, inspect the
change and explicitly prepare the next arrangement. Existing review requests keep
their exact identity: a first reply on changed material refuses, already saved
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
