# Perspective Reviewed Codex Template Mock PR Evaluation

Date: 2026-06-08

## Purpose and Scope

Evaluate the reviewed manual Agent Brief Codex prompt template against a mock PR task without executing Codex, calling GitHub, changing product UI, adding routes, or modifying runtime behavior.
This is a local evaluation/report/dogfood slice.

## Preflight Result

PASS. PR #457 is merged into main and main contains the reviewed Codex prompt template builder, dogfood script, dogfood artifact, validation report, docs, and smoke.

## Mock PR Task

Use the attached reviewed Agent Brief prompt template to prepare a hypothetical minimal docs-only PR plan for improving the readability of the Agent Brief handoff packet copy. Do not edit product code in this evaluation slice. Do not call GitHub. Do not open a real PR. Produce a mock PR plan, expected changed files, test plan, risks, and PR body outline only.

## Dogfood Flow

manual pasted text -> local preview response with ingress_admission -> Agent Brief with ingress_context -> codex_handoff packet -> reviewed Codex prompt template -> mock PR task evaluation artifact

Selected node used for the selected template: node.manual_pasted_text.packet

## Generated Artifacts

- reports/dogfood/2026-06-07-perspective-reviewed-codex-template-mock-pr-task.md
- reports/2026-06-07-perspective-reviewed-codex-template-mock-pr-eval.md

## Evaluation Checklist

- A. Prompt task clarity
- B. PR-centered workflow clarity
- C. Authority and runtime boundaries
- D. Raw-value exclusion
- E. Mock PR usefulness
- F. Recommended changes

## Results Table

| Category | Check | Result |
| --- | --- | --- |
| Prompt task clarity | task says mock evaluation only | PASS |
| Prompt task clarity | task says no real Codex execution | PASS |
| Prompt task clarity | task says no real PR opened | PASS |
| Prompt task clarity | task says no GitHub call | PASS |
| Prompt task clarity | task says produce mock PR plan only | PASS |
| Prompt task clarity | task gives enough context from source packet | PASS |
| PR-centered workflow clarity | Codex may code/test/open PR only in a real user-approved scoped run | PASS |
| PR-centered workflow clarity | ChatGPT reviews PR and user decides merge | PASS |
| PR-centered workflow clarity | no merge/deploy/publish/self-approval | PASS |
| Authority and runtime boundaries | no provider/model/API calls | PASS |
| Authority and runtime boundaries | no persistence or DB/graph/proof/evidence/readiness writes | PASS |
| Authority and runtime boundaries | no Formation authority or raw source inference | PASS |
| Authority and runtime boundaries | no product DOM exposure or route/UI changes | PASS |
| Raw-value exclusion | raw values are absent | PASS |
| Raw-value exclusion | forbidden markers are absent | PASS |
| Mock PR usefulness | mock PR title is clear | PASS |
| Mock PR usefulness | mock branch name is plausible but not executed | PASS |
| Mock PR usefulness | mock changed files are docs/report/test only | PASS |
| Mock PR usefulness | test plan, risk section, and PR body outline are useful | PASS |
| Mock PR usefulness | prompt length is acceptable | PASS |
| Recommended changes | next implementation slice is identified | PASS |

## Judgment

Judgment: PASS

PASS. The reviewed prompt template is ready for a future real user-approved Codex run. The mock PR plan is useful, authority boundaries are explicit, and raw/candidate/private/provider values are excluded.

## Recommended Changes

- Keep: source packet inclusion, Codex may/must-not sections, review chain, manual summary omission, and raw-value exclusions.
- Change: refine prompt copy only if future real-use review finds repeated ambiguity.
- Defer: product UI exposure, routes, provider calls, GitHub calls, Codex execution, persistence, and external source ingress.

## Recommended Next Implementation PR

Refine reviewed Codex prompt template from mock PR findings

## Tests Run

- npm run dogfood:perspective-reviewed-codex-template-mock-pr-task: PASS
- npm run smoke:perspective-reviewed-codex-template-mock-pr-eval: PASS
- npm run typecheck: PASS
- npm run smoke:perspective-reviewed-manual-agent-brief-codex-template: PASS
- npm run smoke:perspective-agent-brief-handoff-copy-refine: PASS
- npm run smoke:perspective-manual-agent-brief-codex-review-loop-eval: PASS
- npm run smoke:perspective-manual-agent-brief-handoff-dogfood: PASS
- npm run smoke:perspective-agent-brief-manual-ingress-context: PASS
- npm run smoke:perspective-agent-brief-read-surface: PASS
- npm run smoke:perspective-local-manual-ingress-admission-preview: PASS
- npm run smoke:perspective-ingress-admission-model: PASS
- npm run smoke:perspective-temporal-spatial-projection-builders: PASS
- npm run smoke:cockpit-perspective-workbench-temporal-underlay: PASS
- npm run smoke:perspective-ingest-constellation-preview: PASS
- npm run build: PASS
- git diff --check: PASS
- git diff --cached --check: PASS

## Skipped Checks

Browser validation skipped because this is a local dogfood/report slice with no UI or route changes.
npm run lint skipped because package.json does not define a lint script.
npm test skipped because package.json does not define a test script.

## Blockers / Risks

No blockers. Risk is limited to prompt interpretation in a future real run; this PR does not execute Codex or add runtime authority.
