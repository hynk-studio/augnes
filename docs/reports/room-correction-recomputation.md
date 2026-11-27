# Recomputing the room correction

The Web Planning room-correction fixture changes a proposed event from room A to room B. The owner chooses to replace the old accessibility check. Admission stays free, accessibility is still unknown, and publication stays on hold. Which conclusions can a reader reuse after the correction, and which evidence should a successor see?

## Replay

The Browser fixture emits a `room_correction_browser` record with the original target, the proposed branch and the saved target. Use the original and the branch to compute the expected outcome for the owner's replacement choice. Reserve the saved target for the comparison. The existing fixture also lets the owner keep the old action. [Browser fixture](../../scripts/browser-web-planning-branches.mjs)

1. Rebuild the input envelopes with the Web Planning contract. Check the branch's origin against the original target. Keep the target's scope and publication limit.
2. Evaluate the seven questions below from the branch. For a second pass, reuse parsed notes whose verified source references match the original. Reuse a calculated answer only when the inputs to that question still match. In both passes, resolve the current support and the action's dependency on the corrected event.
3. Compare both projections, including support references. Then validate the original-to-saved target history and compare the selected source references and answers with that saved target. The captured branch head carries its predecessor's fingerprint. The intermediate branch revision is absent from the export. [Revision contract](../../apps/web_planning/src/contract.ts)

| Question | Current answer | Evidence after the correction |
| --- | --- | --- |
| When, where and how many? | 15:30, room B, capacity 12 | Read all three values from the correction. |
| Is admission free? | Yes | The correction confirms the same price. Cite the correction. |
| Is wheelchair access confirmed? | Unknown | The correction explicitly states that access is unknown in B. The original check concerned A. |
| What should the owner check next? | Room B wheelchair access | The adapted action points to the correction for B. |
| May the owner publish now? | Hold | The target excludes publication and the adapted action calls for confirmation. |

## What reuse buys in this example

| Work on the update | Full recomputation | Reuse parsed notes | Reuse parsed notes and answers |
| --- | ---: | ---: | ---: |
| Notes decoded | 3 | 2 | 2 |
| Note text passed to the decoder, UTF-8 bytes | 259 | 190 | 190 |
| Questions evaluated | 7 | 7 | 5 |
| Current material relation rows inspected | 3 | 3 | 3 |

All three methods produce the same seven answers and current support in this fixture. Price and publication can reuse their answer values. Accessibility still requires evaluation, even though the answer remains unknown. Each method reads and validates the input envelopes. The 69-byte difference measures only text decoding.

Two in-memory variations expose errors that an answer-only comparison would miss. Remove the action's dependency on the correction and the current action requires review, with publication still on hold. Change only the corrected price to paid, update its source identity and reconnect the action. Only the price needs a new value, and the action must cite the new source even though its wording stays the same.

The case supports refreshing the evidence for unchanged answers. Its three short notes give little work to save. A workload with repeated expensive interpretation and a measurable end-to-end cost would justify revisiting a general incremental evaluator. This report describes the fixture's explicit replacement choice and closed vocabulary.
