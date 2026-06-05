# Pasted-Text Perspective Ingest Real Notes Dogfood

Date: 2026-06-05

## Environment

- Repo: `hynk-studio/augnes`
- Remote: `https://github.com/hynk-studio/augnes.git`
- Branch: `codex/pasted-text-real-note-dogfood-v0-1`
- Tested commit SHA: `24d752604b81f8a22571f26b4141d17266dcb219`
- Local URL: `http://127.0.0.1:3211/`
- Temp DB path: `/tmp/augnes-codex-dogfood/pasted-text-real-note-dogfood-v0-1.sqlite`
- OS: `Darwin 25.5.0`
- Node: `v25.9.0`
- npm: `11.12.1`
- Browser surface: Codex in-app Browser
- Implementation changes: none

## Validation Commands

| Command | Result | Exact output |
| --- | --- | --- |
| `npm run typecheck` | PASS | `> augnes@0.1.0 typecheck` / `> tsc --noEmit` |
| `npm run smoke:perspective-ingest-local-pasted-text-preview` | PASS | `perspective ingest local pasted text preview smoke passed` |
| `npm run smoke:perspective-ingest-constellation-preview` | PASS | `perspective ingest constellation preview smoke passed` |
| `git diff --check` | PASS | No output. |

No implementation files changed, so the additional implementation-change validation bundle was not run.

## Browser Scenario Table

| Scenario | Result | Source kind | Nodes | Edges | Notes |
| --- | --- | --- | ---: | ---: | --- |
| Real-ish Korean planning note | PASS | `manual_pasted_text` | 7 | 8 | Korean prefixes parsed into intent, concept, decision, tension, next, and evidence. |
| Real-ish Codex closeout note | PASS | `manual_pasted_text` | 9 | 12 | Work context and Validation/report nodes appeared; Changed files populated the Codex packet. |
| Mixed Korean/English planning note | PASS | `manual_pasted_text` | 7 | 8 | `Goal`, `Idea`, `Choice`, `Risk`, `Todo`, and `Source` aliases parsed without generic fallback. |
| Missing input failure | PASS | `unavailable` | 0 | 0 | `missing_input_text`; loaded source query showed `failed preview`; no graph remained. |
| Secret-like failure | PASS | `unavailable` | 0 | 0 | `secret_like_input`; textarea cleared; rejected payload was not visible in the section text. |
| Recovery after failure | PASS | `manual_pasted_text` | 7 | 8 | Re-pasting the Korean planning note recovered the graph and metrics. |
| `sample:chatgpt` regression | PASS | `chatgpt_record_fixture` | 7 | 8 | Existing fixture preview still rendered. |
| `sample:codex` regression | PASS | `codex_record_fixture` | 7 | 8 | Existing fixture preview still rendered. |
| Console check | PASS | n/a | n/a | n/a | Browser warning/error log list was empty. |

## Korean Planning Note Findings

- Preview succeeded with `manual:pasted_text` as the loaded source query and `manual_pasted_text` as the source kind.
- The graph rendered 7 nodes and 8 edges.
- Korean aliases parsed correctly:
  - `의도` became `User intent`.
  - `개념` became `Concept`.
  - `결정` became `Decision`.
  - `긴장` became `Tension`.
  - `다음` became `Next move`.
  - `근거` became evidence pointer context.
- Selected node detail rendered Korean text correctly:
  - User intent: `ChatGPT와 Codex에서 나온 작업 흐름을 Augnes 관점 그래프로 정리한다.`
  - Concept: `붙여넣은 텍스트는 raw memory가 아니라 로컬 미리보기 재료다.`
  - Tension: `실제 사용자가 너무 긴 원문을 붙여넣으면 관점이 흐려질 수 있다.`
  - Next move: `생성된 노드, 엣지, 텐션, 패킷이 다음 작업 판단에 충분한지 확인한다.`
- Korean rendering in the node detail panel was readable.
- The SVG used compact English node labels with full title/ARIA labels. That kept the visual graph compact, but it means Korean content is mainly inspected through selected node detail and packet text.

## Codex Closeout Note Findings

- Preview succeeded with 9 nodes and 12 edges.
- `작업`, `변경`, `검증`, `보고`, `긴장`, `다음`, and `근거` parsed as intended.
- Work context node appeared and summarized:
  - Work: `PR #408에서 pasted-text ingest vocabulary와 UX를 개선했다.`
  - Changed files: `lib/perspective-ingest/manual-pasted-text-adapter.ts`, `lib/perspective-ingest/manual-pasted-text-validation.ts`, `lib/perspective-ingest/episode-to-constellation-packet.ts`, `components/augnes-cockpit.tsx`.
- Validation/report node appeared and summarized:
  - Validation: `npm run typecheck PASS`, `npm run smoke:perspective-ingest-local-pasted-text-preview PASS`, `browser/computer-use focused pass PASS`.
  - Report: `한국어 prefix와 영어 alias가 정상 동작한다.`, `Work context와 Validation/report 노드가 표시된다.`
- Codex packet included all four Changed files under `Expected changed files`.
- Codex packet included `User-supplied validation context (not rerun by this packet)`.
- Codex packet included `User-supplied report context (review context, not proof)`.
- The graph was useful but visually dense in the 9-node case.

## Mixed Alias Findings

- Preview succeeded with 7 nodes and 8 edges.
- English aliases with Korean content parsed correctly:
  - `Goal` -> `User intent`
  - `Idea` -> `Concept`
  - `Choice` -> `Decision`
  - `Risk` -> `Tension`
  - `Todo` -> `Next move`
  - `Source` -> evidence pointer context
- Selected node detail preserved mixed Korean/English content.
- This scenario did not fall back to generic defaults.
- The aliases felt natural for a short planning note.

## Failure And Recovery Findings

- Empty preview failed closed with:
  - Error: `Fail-closed 400: missing_input_text. Pasted text is required.`
  - Loaded source query: `failed preview`
  - Source kind: `unavailable`
  - Node count: `0`
  - Edge count: `0`
  - Graph SVG count: `0`
- `sk-test-redacted-example` failed closed with:
  - Error: `Fail-closed 400: secret_like_input. Pasted text appears to include a credential-like marker and was rejected.`
  - Loaded source query: `failed preview`
  - Source kind: `unavailable`
  - Node count: `0`
  - Edge count: `0`
  - Graph SVG count: `0`
- The secret-like payload was not present in the visible ingest section text.
- The manual textarea value length was `0` after secret rejection.
- Re-pasting the Korean planning note recovered to `manual:pasted_text`, `manual_pasted_text`, 7 nodes, and 8 edges.
- Recovery was clear enough; the failed state did not show `Loading`.

## Sample Regression Findings

- `sample:chatgpt` loaded successfully:
  - Loaded source query: `sample:chatgpt`
  - Source kind: `chatgpt_record_fixture`
  - Node count: `7`
  - Edge count: `8`
- `sample:codex` loaded successfully:
  - Loaded source query: `sample:codex`
  - Source kind: `codex_record_fixture`
  - Node count: `7`
  - Edge count: `8`
- Manual pasted-text work did not regress existing sample fixture preview paths.

## Console Findings

- Browser warning/error logs after the focused scenario set: `[]`
- No recurring warning or uncaught error was observed from this feature.

## Packet Usefulness Findings

- ChatGPT packet fallback textarea contained full graph nodes and edges, including Korean text. For the Korean planning note, it preserved the intent, concept, decision, tension, next move, and evidence pointer.
- ChatGPT packet for the Codex closeout note included first-class `Work`, `Changed`, `Validation`, and `Report` sections before the graph node listing.
- Codex packet stayed preview-only with the sentence: `this is a preview packet only; it is not an instruction to execute unless a user manually gives it to Codex.`
- Codex packet for the Codex closeout note correctly included all Changed lines under `Expected changed files`.
- Codex packet represented validation as user-supplied context and report lines as review context, not proof.
- Non-blocking packet nit: for planning notes with no Changed lines, the packet says `Expected changed files: None supplied`, but the packet still includes default context anchors such as `components/augnes-cockpit.tsx`. This is understandable as context, but a rushed Codex reader could confuse anchors with expected edits.
- Non-blocking packet nit: the Codex handoff packet still carries the original pasted-text feature branch/title suggestion (`codex/pasted-text-perspective-ingest-preview-v0-1`, `feat(cockpit): add pasted-text perspective ingest preview`). That is preview-only, but it is stale for post-PR #408 dogfood notes and could mislead if copied unedited.

## Graph UX Findings

- The 7-node planning graphs were readable with compact labels and full title/ARIA text.
- Korean content is not shown directly in SVG labels; users inspect it through selected node detail and packet text.
- The 9-node Codex closeout graph was useful but still dense.
- Non-blocking graph nit: in the 9-node graph, several edge labels visually collided or nearly collided with node labels, including `depends` near `Copyable packets`, `warns` near `Next move`, `refines` near `User intent`, and `supports` near `Concept`.
- Full SVG titles/ARIA labels remained available for compact labels such as `Validation/re...`.

## Prefix Vocabulary Findings

- Current Korean aliases are sufficient for these real-ish notes.
- Current English aliases are sufficient for mixed-language short planning notes.
- No missing alias blocked the tested scenarios.
- One more vocabulary pass should be usage-driven, not speculative. Candidate future checks should focus on real notes that use forms like `문제`, `배경`, `결론`, `확인`, or `후속`, but this pass did not require them.

## Blockers

None.

## Non-Blocking Nits

- Dense 9-node SVG layout still has edge-label overlap in the closeout scenario.
- Codex handoff packet default branch/title suggestion is stale for post-PR #408 dogfood and can look implementation-oriented even when the user pasted a review note.
- The manual preview metrics correctly show loaded source query/source kind, but the separate `selected sample source` metric remains the last selected sample radio while a manual preview is loaded. This is distinguishable, but mildly distracting.

## Recommendation

- Proceed to local file import: not yet. The pasted-text path is usable, but the dense graph/packet nits should be addressed or consciously accepted before adding a wider import surface.
- Do one more vocabulary pass: yes, but keep it small and driven by 3-5 additional real notes rather than adding broad synonyms now.
- Keep ChatGPT export parser deferred: yes. The current pasted-text UX is good enough for bounded manual summaries, but export parsing would add larger privacy, volume, and mapping questions that this pass did not exercise.
