# Retained setting revision correction — #1466

This follow-up fixes a fresh-review false refusal in the Increment C candidate
`903a5d3e53abd9eac84b81afe38f5b68c96dc0e4`. Initial retcon adoption and
original-ticket replay worked. A **new** review selecting the same adopted retcon
failed because link validation required its already-superseded basis again, before
the existing no-op comparison. Keeping that retcon selected while adding another
setting failed for the same reason. This was not corruption or an authority bypass.

The shared validator now distinguishes an exact current adopted unit from a newly
introduced adoption. The retained unit must match its content, original review,
source files, scope and recorded adopted disposition. It cannot already be
superseded. Prerequisites remain checked for every selected unit; new interpretations
still need valid reviewed bases at the same fictional positions. The same validator
is used by live scene reviews, incorporation, stored-history reads and reconstruction.
The no-op comparison and source/target, actor, replay and atomic writers are unchanged.

## Runnable walkthrough

Use the [existing C Web flow](../../../apps/web_planning/README.md#alternate-continuation--increment-c-1455)
in disposable storage. This separate synthetic follow-up deliberately takes the
alternate's retcon into primary; it does not change the earlier bell-only example.

1. Create the Korean emperor primary and its alternate through ordinary Save,
   branch preview and explicit confirmation. Review the alternate's retcon of the
   unopened letter and earlier immediate-revelation rejection at event 2 / reveal 1.
2. In primary, **Compare a private branch**, adopt the retcon and bell, leave public
   return undecided, enter a reason and explicitly save the reviewed change.
3. Start another comparison with the same current source, choices and reason.
   Request a **new** preview. It says “This comparison is unchanged.” Confirm it:
   the revision, fingerprint, history and file bodies remain identical.
4. Save an unrelated primary edit. In the alternate, save a new scene and review
   the independent setting “정원의 등불은 푸른 유리로 덮여 있다.” Keep its prose local:

   > 푸른 유리의 등불 아래에 작은 돌이 놓여 있었다.
   >
   > 편지의 문장은 지우지 않았다.

5. Compare the current heads again. Retain the adopted retcon and bell, adopt the
   new setting and leave public return undecided. Preview and confirm: exactly one
   target revision is added, preserving prior decisions, original attribution and
   the independent target edit. A subsequent identical review is again a no-op.
6. **Export both story directions**, reconstruct the downloaded JSON in a separate
   empty store, restart the disposable process/browser, and reopen both scopes.
   The current retcon and new setting, superseded adopted/rejected history, exact
   originals and independent prose remain available. Repeat step 3 after recovery.

## Production-path regression evidence

The new checks extend the existing D1 and browser C owners; they do not replace
the A/B/C journeys or the bell-only no-op, original-ticket replay, unknown-outcome,
stale-response, Unicode or ordinary-project/presentation compatibility suites.

| Check | Reviewed production source | Corrected development source |
|---|---|---|
| New unchanged retcon preview | D1 409 `scene_revision_basis`; browser action absent | New ticket, explicit no-op, exact exported bytes/history unchanged |
| Retain retcon and add setting | Same D1 refusal and absent browser action | One intended target revision; original retcon and independent prose retained |
| Complete D1 suite | New two-case assertion fails | 54 checks pass |
| Complete browser suite | New two-case assertion fails | 28 checks pass; zero script exceptions/external requests |
| Web/root type checks | Not used as reproduction | Both pass |

The refusal controls include stale source/target, altered replay, foreign scope,
real atomic-write fault, invalid/competing reinterpretation, wrong fictional
position, missing prerequisite and refusal to reactivate a subsequently superseded
retcon. Rehashed last-transition forgeries alter content, title, source-file or
original-review provenance, or scope; all refuse with no partial recovery. Changed
source versions, reasons and selections are not widened into no-op equivalence.

[evidence.json](evidence.json) records before/after source hashes, command durations,
cleanup, browser heads, original and target attribution, recovered drafts and actual
product contexts. [recovered-pair.json](recovered-pair.json) is the captured recovery
value from the actual browser download, serialized for review. The downloaded file
itself was consumed through the import picker before cleanup. Embedded source bytes
and complete revision envelopes are unchanged. [artifacts.json](artifacts.json)
records these two report files' byte sizes and SHA-256 values.

Browser lineage: primary `71f1130c-727b-40dc-81d1-9735a4930d0d` has 13 revisions;
retcon adoption is revision 11, unrelated edit 12, additional selection 13. Alternate
`cdc77cb6-c7e6-45a9-ab81-df40092cb179` has six revisions; independent scene draft is
revision 5 and review 6. Each fresh no-op confirmation creates no revision. D1
also exports and reconstructs its separately produced 10+9 revision pair.

These are development observations from the corrected working tree, not a model
conversation or an independent hosted run. Exact final base/head/tree and the new
planner-selected deciding receipt are recorded in [Draft PR #1466](https://github.com/hynk-studio/augnes/pull/1466).
The prior 16/16 and Browser 7/7 receipt remains bound to `903a5d3e`.

The [original C report](../1455-increment-c/README.md), two actual consumer drafts,
delivered contexts, usage, pre-freeze provenance and saved/recovered artifacts stay
unchanged. This correction uses no additional model allocation. Human effort and
comparative burden are unmeasured. Existing quotas and compatibility remain in force;
no migration, endpoint, dependency, client framework or installed runtime changes.
