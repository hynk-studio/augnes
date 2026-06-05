# Pasted-Text Perspective Ingest Import Readiness Dogfood

## Date

2026-06-05

## Environment

- Repo: `hynk-studio/augnes`
- Remote: `https://github.com/hynk-studio/augnes.git`
- Branch: `codex/pasted-text-import-readiness-dogfood-v0-1`
- Commit SHA tested: `54162d95542d5bf6e6f9899b5b0a06445c9b3027`
- Local URL: `http://127.0.0.1:3213/`
- Temp SQLite DB path: `/tmp/augnes-codex-dogfood/pasted-text-import-readiness-dogfood-v0-1.sqlite`
- Dev command: `AUGNES_DB_PATH=/tmp/augnes-codex-dogfood/pasted-text-import-readiness-dogfood-v0-1.sqlite npm run dev -- --hostname 127.0.0.1 --port 3213`
- Scope: report-only browser/computer-use dogfood after merged PR #410.
- Implementation changed: no.

## Validation Commands

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS. Output: `> augnes@0.1.0 typecheck`; `> tsc --noEmit`. |
| `npm run smoke:perspective-ingest-local-pasted-text-preview` | PASS. Output ended with `perspective ingest local pasted text preview smoke passed`. |
| `npm run smoke:perspective-ingest-constellation-preview` | PASS. Output ended with `perspective ingest constellation preview smoke passed`. |
| `git diff --check` | PASS. No output. |

No implementation files changed, so the expanded implementation-change smoke bundle was not run.

## Browser/Computer-Use Scenario Table

| Scenario | Result | Notes |
| --- | --- | --- |
| 1. Korean supported-prefix planning note | PASS | `manual:pasted_text`, `manual_pasted_text`, 7 nodes / 8 edges. Edge labels remained visible. Sample source metric showed `inactive during manual preview`. Korean selected-node detail was readable. |
| 2. Dense Korean Codex-style closeout | PASS | `manual:pasted_text`, 9 nodes / 12 edges. Dense graph note appeared. SVG edge text labels were hidden. Edge details remained available through title/ARIA and the edge list. Work context and Validation/report nodes appeared. |
| 3. Unsupported-label Korean note | PASS with generic fallback | `배경`, `문제`, `결론`, `확인`, `후속`, `출처` were not parsed as semantic aliases. Preview succeeded with 7 nodes / 8 edges and preserved the raw bounded source summary, but generic intent/concept/decision/tension/next nodes were less helpful. |
| 4. Mixed English/Korean practical task note | PASS | `Goal`, `Idea`, `Choice`, `Risk`, `Todo`, and `Source` parsed correctly. Graph did not fall back. Codex packet used manual review-only branch/title language. |
| 5. Copy/fallback usability | PASS | Browser clipboard copy reported `Copied ChatGPT review packet` and `Copied Codex handoff packet`. `Select preview text` selected the full packet textarea for both Scenario 1 and Scenario 2. |
| 6. Failure/recovery regression | MIXED | Secret-like input failed closed with `secret_like_input`, cleared the textarea, showed `failed preview` / `unavailable`, and did not echo the payload. Empty pasted text did not show `missing_input_text`; clicking preview was a no-op and left the previous graph visible. Recovery with Scenario 1 succeeded. |
| 7. Sample regression | PASS | `sample:chatgpt` rendered 7 nodes / 8 edges with source kind `chatgpt_record_fixture`. `sample:codex` rendered 7 nodes / 8 edges with source kind `codex_record_fixture`. Sample source metrics behaved normally. |
| 8. Console check | PASS | Browser dev logs had 0 warning/error entries. Only normal dev-session info/log entries appeared: React DevTools info, HMR connected, Fast Refresh rebuild/done. |

## Korean Supported-Prefix Note Findings

- Korean aliases parsed correctly for `의도`, `개념`, `결정`, `긴장`, `다음`, and `근거`.
- Graph output was usable at 7 nodes / 8 edges.
- SVG edge labels remained visible because the graph was below the dense threshold.
- The selected source node detail displayed Korean text correctly and exposed the evidence pointer.
- The ChatGPT packet was useful as bounded review material.
- The Codex packet did not suggest the stale pasted-text implementation branch/title.
- The sample source metric was clear: `inactive during manual preview`.

## Dense Codex Closeout Note Findings

- Korean closeout prefixes parsed correctly for `작업`, `변경`, `검증`, `보고`, `긴장`, `다음`, and `근거`.
- The dense closeout rendered 9 nodes / 12 edges.
- `Work context` and `Validation/report` nodes appeared.
- Dense graph behavior worked: the UI hid SVG edge text labels and showed the dense graph note.
- Edge title/ARIA examples included `derived_from`, `refines`, `supports`, `conflicts_with`, and `warns_against` summaries.
- The edge list remained available and included all manual graph relationships, including work context and validation/report relationships.
- Codex expected changed files included:
  - `components/augnes-cockpit.tsx`
  - `lib/perspective-ingest/episode-to-constellation-packet.ts`
  - `docs/PERSPECTIVE_INGEST_LOCAL_PASTED_TEXT_PREVIEW_V0_1.md`
- User-supplied validation appeared as `User-supplied validation context (not rerun by this packet)`.
- User-supplied report lines appeared as `User-supplied report context (review context, not proof)`.

## Unsupported-Label Fallback Findings

- The semi-prefixed Korean note with `배경`, `문제`, `결론`, `확인`, `후속`, and `출처` previewed successfully.
- The raw bounded source summary preserved the unsupported-label content.
- The semantic nodes fell back to generic defaults:
  - User intent: `Review local user-provided pasted text as a Perspective ingest preview.`
  - Concept: `Manual local Perspective ingest preview.`
  - Decision: `Keep pasted text preview local-only, read-only, and non-persistent.`
  - Tension: `Manual pasted input can help form a perspective, but it must not imply raw private history persistence.`
  - Next move: `Review the generated graph and copied packets before any future import slice.`
- This fallback is safe, but it is not decision-rich enough for common Korean planning notes.
- `배경`, `문제`, `결론`, `확인`, `후속`, and `출처` look common enough to consider in a later vocabulary cleanup, but not in this report-only task.

## Mixed Alias Note Findings

- English aliases with Korean/English mixed content parsed as expected.
- The graph preserved the practical task meaning:
  - Goal mapped to user intent.
  - Idea mapped to concept.
  - Choice mapped to decision.
  - Risk mapped to tension.
  - Todo mapped to next move.
  - Source mapped to evidence.
- The Codex packet started with `Working branch suggestion: manual-review-only.no-branch-suggested` and `Expected PR title: manual review only - no PR title suggested`.
- The packet stated: `this preview packet is review material, not an execution request`.
- No additional UI warning near the copy button is required before local file import, but the review-only wording remains important.

## Copy/Fallback Findings

- Clipboard copy was available in this browser session.
- ChatGPT and Codex copy buttons both reported success.
- `Select preview text` selected the full packet textarea when used after Codex packet selection.
- Packet target switching was understandable.
- Codex manual packets did not include the stale branch `codex/pasted-text-perspective-ingest-preview-v0-1`.
- Codex manual packets did not include the stale title `feat(cockpit): add pasted-text perspective ingest preview`.

## Failure/Recovery Findings

- Secret-like input `sk-test-redacted-example` failed closed with `secret_like_input`.
- The secret-like rejected payload was not echoed in the visible UI.
- The secret-like rejection cleared the manual textarea.
- Failure metrics showed:
  - loaded source query: `failed preview`
  - source kind: `unavailable`
  - sample source: `inactive during manual preview`
- Recovery by pasting the Scenario 1 Korean note succeeded.
- Empty pasted text did not show `missing_input_text`. The preview button accepted the click without an error and left the previous 7-node graph, `manual:pasted_text`, and `manual_pasted_text` metrics visible.
- This empty-input no-op is the main remaining UX confusion from this pass.

## Sample Regression Findings

- `sample:chatgpt` rendered successfully.
- `sample:chatgpt` showed source kind `chatgpt_record_fixture`.
- `sample:chatgpt` rendered 7 nodes / 8 edges with edge labels visible.
- `sample:codex` rendered successfully.
- `sample:codex` showed source kind `codex_record_fixture`.
- `sample:codex` rendered 7 nodes / 8 edges with edge labels visible.
- Manual preview metric state did not leak into sample preview metrics.

## Console Findings

- Browser console warning/error count: 0.
- Observed dev-session logs only:
  - React DevTools info.
  - `[HMR] connected`.
  - `[Fast Refresh] rebuilding`.
  - `[Fast Refresh] done in 225ms`.

## Packet Usefulness Findings

- ChatGPT packet remained review-oriented and directly usable.
- Codex packet clarity improved after PR #410:
  - no stale branch suggestion
  - no stale PR title suggestion
  - explicit review-material wording
  - explicit non-execution wording
  - explicit fresh branch/task/title requirement if a user turns the preview into work
- Changed lines populated the Codex expected changed files for the dense closeout note.
- Validation/report lines were framed as user-supplied context, not proof.

## Graph UX Findings

- 7-node / 8-edge graphs were readable with edge labels visible.
- 9-node / 12-edge graphs were more readable than before because SVG edge labels were hidden.
- The dense graph note made the hidden-edge-label behavior understandable.
- Edge meanings remained inspectable through title/ARIA and the edge list.
- Node labels were compact but usable.

## Prefix Vocabulary Findings

- Supported Korean and English aliases are good enough for explicit planning and Codex closeout notes.
- Unsupported Korean semi-prefixes degrade safely, but generic defaults flatten useful planning meaning.
- Candidate aliases for a future vocabulary pass:
  - `배경` as contextual source/background, likely not Intent.
  - `문제` as Tension/Risk.
  - `결론` as Decision.
  - `확인` as Validation or Next depending product judgment.
  - `후속` as Next.
  - `출처` as Evidence.
- Do not add these aliases in the import-readiness report PR.

## Blockers

- No blocker-level implementation defect was found under the task's implementation-change criteria.
- Valid Korean supported-prefix notes previewed.
- Valid Codex closeout notes previewed.
- Changed lines populated Codex expected changed files.
- Secret-like rejected payloads were not echoed visibly.
- Dense graph edge details remained available outside hidden SVG labels.
- `sample:chatgpt` and `sample:codex` previews worked.
- Typecheck and focused smokes passed.

## Non-Blocking Nits

- Empty pasted text is a no-op in the UI and leaves the previous graph visible instead of showing `missing_input_text`. This is not one of the specified blocker criteria for implementation changes in this task, but it is enough to hold local file import readiness.
- Unsupported Korean labels `배경`, `문제`, `결론`, `확인`, `후속`, and `출처` are safe but generic today.

## Go/No-Go Recommendation For Local File Import

Recommendation: **no-go / hold for one more pasted-text cleanup before opening local file import**.

Reason: the core successful-note path is strong enough, dense graph behavior is understandable, Codex packets are now review-only, and sample previews did not regress. However, empty input recovery is not clear: it silently leaves the previous manual graph loaded instead of showing `missing_input_text`. Local file import would widen the input/recovery surface, so this should be fixed before opening a file import slice.

Suggested next slice before local file import:

- Fix empty manual preview submission so it visibly fails closed with `missing_input_text`, or disables the button with clear inactive state that does not leave users thinking the stale graph is the current preview.
- Keep the fix narrow and avoid expanding import vocabulary or import surface.

After that cleanup, proceed to a narrow local file import slice for small, user-selected, local text/markdown files only if it reuses the same local-only, read-only, non-persistent validation boundary.

## ChatGPT Export Parser Recommendation

Recommendation: **keep ChatGPT export parser deferred**.

This pass does not provide enough evidence to open export zip parsing. The parser would introduce a larger privacy, input-size, and structure surface than the current bounded pasted-text flow.
