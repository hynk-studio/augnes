# Perspective Ingest Local Pasted Text Dogfood

Date: 2026-06-05

## Environment

- Repo: `/Users/hynk/Documents/augnes`
- Remote: `origin https://github.com/hynk-studio/augnes.git`
- PR state: PR #407 was merged, so this pass used `main`
- Branch: `main`
- Commit SHA: `05441e3b7e00b3b3076000e4b7e41340592bc37c`
- Local URL: `http://127.0.0.1:3210/`
- Dev command: `AUGNES_DB_PATH=/tmp/augnes-codex-dogfood/perspective-ingest-local-pasted-text-dogfood.sqlite npm run dev -- --hostname 127.0.0.1 --port 3210`
- Temp DB init: `AUGNES_DB_PATH=/tmp/augnes-codex-dogfood/perspective-ingest-local-pasted-text-dogfood.sqlite npm run db:init`
- Browser surface: Codex in-app Browser, Cockpit > Perspective > Ingest graph

## Validation Commands

- PASS: `npm run typecheck`
  - Output: `tsc --noEmit`
- PASS: `npm run smoke:perspective-ingest-local-pasted-text-preview`
  - Output: `perspective ingest local pasted text preview smoke passed`
- PASS: `npm run smoke:perspective-ingest-constellation-preview`
  - Output: `perspective ingest constellation preview smoke passed`
- PASS: `git diff --check`
  - Output: no output

## Browser Scenario Table

| Scenario | Result | Observations |
| --- | --- | --- |
| 1. Safe example button | PASS | `Load safe pasted text example` filled 413 chars and source label `Safe manual pasted text example`. `Preview pasted text` succeeded as `manual:pasted_text`, source kind `manual_pasted_text`, 7 nodes, 8 edges. Node click changed selected detail. ChatGPT packet length 2912 and Codex packet length 2422 were selectable in full after copy/select. |
| 2. ChatGPT planning summary | PASS with vocabulary notes | Parsed `Intent`, `Concept`, `Decision`, `Tension`, `Next`, and `Evidence`. Graph preserved planning meaning in summaries. Node labels stayed generic: `User intent`, `Concept`, `Decision`, `Tension`, `Next move`. Packets did not imply persistence or execution. |
| 3. Codex closeout summary | PASS with packet/graph gap | `Changed:` lines correctly populated Codex `Expected changed files` with `lib/perspective-ingest/manual-pasted-text-adapter.ts` and `components/augnes-cockpit.tsx`. `Work` appeared in ChatGPT source summary, but `Work`, `Validation`, and `Report` did not become first-class graph nodes for manual pasted text. |
| 4. No prefixes fallback | PASS with generic defaults | Preview succeeded as 7 nodes/8 edges. Source node held a bounded summary of the pasted paragraph. Intent/concept/decision/tension/next nodes used defaults, which is safe but generic. |
| 5. Prefix synonym pain test | PASS with fallback gap | Unsupported `Goal`, `Idea`, `Choice`, `Risk`, `Todo`, and `Source` prefixes fell back to defaults. The source node preserved the text, but graph semantics were generic. |
| 6. Korean content with English prefixes | PASS | English prefixes with Korean values parsed correctly. Korean text rendered in node list, selected detail, evidence/tension/next lists, and packets. No Korean content overflow was observed in the card/list path. |
| 7. Korean prefix alias pain test | PASS with fallback gap | Korean prefixes were unsupported and fell back to defaults. Source summary preserved the Korean pasted text. This is acceptable for v0.1 but should be next vocabulary work for Korean users. |
| 8. Harmless secret false positives | PASS with two false positives | Four harmless cases were accepted. `Ask-user flow around preview` and `bearer tokenization in a docs sentence...` were rejected as `secret_like_input`. Both rejected cases cleared the textarea and did not echo payload in visible error UI. |
| 9. Obvious secret rejection | PASS | All 10 obvious markers were rejected as `secret_like_input` with status 400. Textarea cleared in every case. No rejected payload was echoed in visible error UI. |
| 10. Empty and whitespace input | PASS | Empty via `Clear pasted text`, spaces-only, and newlines-only failed closed as `missing_input_text` status 400. Previous graph was replaced by the fail-closed empty state with 0 nodes/0 edges. Recovery by entering valid text worked. |
| 11. Overlong input | PASS | 12,100 safe chars failed closed as `input_text_too_large` status 413. UI stayed responsive. Error text did not echo the payload; textarea retained the user's input for clear/edit. Recovery with valid input worked. |
| 12. Existing samples | PASS | `sample:chatgpt` rendered 7 nodes/8 edges with source kind `chatgpt_record_fixture`. `sample:codex` rendered 7 nodes/8 edges with source kind `codex_record_fixture`. Loaded source query matched selected sample path in both cases. |
| 13. Packet usefulness | PASS with clarity notes | ChatGPT packets were understandable as review material. Codex packets clearly said they are preview-only and "not an instruction to execute"; hard constraints included `no Codex execution`. Planning summary Codex packet had `Expected changed files: None supplied`; closeout packet included the two `Changed:` files. |
| 14. Browser console | PASS | Browser console errors: none. Browser console warnings: none. |

## Prefix Vocabulary Findings

- Current supported prefixes are useful for simple planning summaries: `Intent`, `Concept`, `Decision`, `Tension`, `Next`, and `Evidence`.
- Codex closeout input benefits from `Changed:` because those lines reach Codex `Expected changed files`.
- `Work`, `Validation`, and `Report` are accepted vocabulary, but manual pasted text does not currently surface them as distinct graph nodes. They are easier to lose in bounded source summary/packet text.
- Synonym fallback is safe but generic. A user pasting natural planning notes with `Goal`, `Idea`, `Choice`, `Risk`, `Todo`, or `Source` would see a graph, but not a semantically faithful one.
- Korean content parses when English prefixes are used. Korean prefixes currently fall back.

## False-Positive Secret Rejection Findings

| Input | Result | Code | Acceptable? | Suggested refinement |
| --- | --- | --- | --- | --- |
| `Intent: This skeleton flow should not be blocked.` | Accepted | n/a | Yes | No change needed. |
| `Intent: Ask-user flow around preview.` | Rejected | `secret_like_input` | No, false positive | Refine `/sk-/i` to require a token boundary such as `/(^|[^A-Za-z0-9_])sk-[A-Za-z0-9]/i` or `\bsk-[A-Za-z0-9]`. |
| `Intent: The task uses a masked-token placeholder, not a real credential.` | Accepted | n/a | Yes | No change needed. |
| `Intent: bearer tokenization in a docs sentence should be reviewed carefully.` | Rejected | `secret_like_input` | No, false positive | Refine `/bearer\s+token/i` to avoid matching `tokenization`, for example with a word boundary or a credential-value requirement. |
| `Intent: passwordless login is mentioned as a concept, not a password value.` | Accepted | n/a | Yes | No change needed. |
| `Intent: api_keyless design is not a credential.` | Accepted | n/a | Yes | No change needed. |

## True Secret Rejection Findings

All of these inputs were rejected with status 400 and code `secret_like_input`; the textarea was cleared and the rejected payload was not echoed in visible error UI:

- `sk-test-redacted-example`
- `OPENAI_API_KEY=redacted`
- `ghp_redactedexample`
- `github_pat_redactedexample`
- `BEGIN PRIVATE KEY`
- `password=redacted`
- `api_key=redacted`
- `access_token=redacted`
- `AWS_ACCESS_KEY_ID=redacted`
- `SECRET_ACCESS_KEY=redacted`

## Graph UX Findings

- The graph renders and node click updates selected detail.
- The node-list fallback is the most readable graph surface, especially for Korean content and long source summaries.
- SVG labels are understandable but sometimes collide. Observed overlaps included `User intent` with `refines`, and `Copyable packets` with `depends_on`.
- Manual pasted text always renders 7 graph nodes in the current template. That makes the UX stable, but Codex-style `Work`, `Changed`, `Validation`, and `Report` meaning is not visually first-class in the graph.
- In failed input states, the previous graph disappears and metrics reset to fail-closed values. That is safe, though the `source kind` metric reads `Loading`, which is slightly confusing once the error has settled.

## Packet Usefulness Findings

- ChatGPT packet text is directly usable as review material.
- Codex packet text is clearly preview-only and includes strong non-execution boundaries.
- `Changed:` lines are useful: they appear in the Codex packet `Expected changed files`.
- Planning summaries without `Changed:` correctly produce `Expected changed files: None supplied`.
- `Report:` and `Validation:` lines from the Codex closeout input were not prominent in the Codex packet; they are easy to miss compared with changed files and hard constraints.

## Regressions

- No regression found in `sample:chatgpt` or `sample:codex` fixture preview paths.
- No browser console warning/error regression found.

## Recommended Next Vocabulary Changes

- Add English aliases:
  - `Goal` -> `Intent`
  - `Idea` -> `Concept`
  - `Choice` -> `Decision`
  - `Risk` -> `Tension`
  - `Todo` / `To do` -> `Next`
  - `Source` -> `Evidence`
- Consider Korean aliases:
  - `의도` -> `Intent`
  - `개념` -> `Concept`
  - `결정` -> `Decision`
  - `작업` / `일` -> `Work`
  - `변경` -> `Changed`
  - `검증` -> `Validation`
  - `보고` / `결과` -> `Report`
  - `긴장` / `위험` -> `Tension`
  - `다음` / `다음 단계` -> `Next`
  - `근거` / `출처` -> `Evidence`
- Consider surfacing manual `Work`, `Changed`, `Validation`, and `Report` as distinct graph nodes or visible packet sections when present.

## Recommended Next Validation Changes

- Add secret false-positive regression coverage for `Ask-user` and `bearer tokenization` after regex refinement.
- Add parser smoke coverage for English aliases and Korean aliases.
- Add packet assertions that `Changed:` lines populate expected changed files and that no-`Changed:` planning summaries keep `None supplied`.
- Add a browser or DOM smoke for graph label collision risk, or add a node-list-first acceptance check that treats SVG as secondary.
- Add UI error-state checks for empty, whitespace, overlong, and secret-like rejection.

## Blockers

None.

## Non-Blocking Nits

- `Ask-user` and `bearer tokenization` are harmless false positives.
- SVG labels can overlap.
- Failed-state metric `source kind: Loading` is confusing after a settled error.
- Manual Codex closeout semantics are less visible than sample Codex fixture semantics.
- Unsupported aliases produce a safe graph, but the defaults may make users think the parser understood more than it did.

## Next Suggested Goal

Make a narrow vocabulary/UX follow-up PR: refine the two false-positive secret patterns, add English/Korean prefix aliases, and improve manual graph/packet surfacing for `Work`, `Changed`, `Validation`, and `Report` without adding structured JSON, file upload, import parsing, persistence, external calls, or execution authority.
