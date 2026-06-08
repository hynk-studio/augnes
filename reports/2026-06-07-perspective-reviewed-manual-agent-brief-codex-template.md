# Perspective Reviewed Manual Agent Brief Codex Template

Date: 2026-06-08

## Purpose and Scope

Add and dogfood a reviewed Codex prompt template around the refined manual Agent Brief codex_handoff packet.
This is a local template/dogfood/report slice. It adds no routes, UI, provider calls, GitHub calls, Codex execution, persistence, DB writes, graph DB behavior, proof/evidence/readiness writes, or source ingress.

## Preflight Result

PASS. PR #456 is merged into main and main contains the refined audience-aware Agent Brief handoff packet copy, dogfood reports, docs, and smoke.

## Dogfood Flow

manual pasted text -> local preview response with ingress_admission -> Agent Brief with ingress_context -> codex_handoff packet -> reviewed Codex prompt template

Selected node used for the selected template: node.manual_pasted_text.packet

## Generated Artifacts

- reports/dogfood/2026-06-07-perspective-reviewed-manual-agent-brief-codex-template.md
- reports/2026-06-07-perspective-reviewed-manual-agent-brief-codex-template.md

## Prompt Template Shape

- template_version: perspective_agent_brief_codex_prompt_template.v0.1
- intended_audience: codex
- workflow: codex_may / codex_must_not / review_chain
- source_packet: perspective_agent_brief_handoff_packet.v0.1 / codex_handoff
- prompt_text: reviewed wrapper plus source packet

## Safety / Exclusion Checks

- raw manual input omitted.
- raw ingress_admission JSON omitted.
- raw Agent Brief JSON omitted.
- candidate/source/pointer/actor/consent values omitted.
- bounded summary values omitted.
- provider/model/GitHub/Codex/OAuth/token/billing/private/generated payloads omitted.

## Review-loop Workflow Checks

- Codex may inspect the repo, make scoped changes only when explicitly asked, run tests, open a PR, and report results.
- Codex must not merge, deploy, publish, approve itself, call external providers/models/APIs, infer raw source content, persist source data, write DB/graph/proof/evidence/readiness state, or expand scope without user approval.
- ChatGPT reviews the PR.
- User decides whether to merge.

## Results Table

| Category | Check | Result |
| --- | --- | --- |
| Prompt template shape | template version is present | PASS |
| Prompt template shape | template wraps codex_handoff packet | PASS |
| Review-loop workflow | prompt declares user-approved scoped task | PASS |
| Review-loop workflow | Codex may inspect, test, and open PR | PASS |
| Review-loop workflow | Codex must not merge or expand scope | PASS |
| Review-loop workflow | review chain is explicit | PASS |
| Safety/exclusion | manual ingress packet summary stays omitted | PASS |
| Safety/exclusion | raw values are absent | PASS |
| Safety/exclusion | forbidden markers are absent | PASS |
| Runtime boundary | no route or execution authority is implied | PASS |

## Judgment

Judgment: PASS

PASS. The prompt template is copy-ready, keeps the PR-centered workflow explicit, includes the source Agent Brief handoff packet, and preserves raw-value and authority exclusions.

## Tests Run

- npm run dogfood:perspective-reviewed-manual-agent-brief-codex-template: PASS
- npm run smoke:perspective-reviewed-manual-agent-brief-codex-template: PASS
- npm run typecheck: PASS
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

Browser validation skipped because this is a local builder/dogfood/report slice with no UI or route changes.
npm run lint skipped because package.json does not define a lint script.
npm test skipped because package.json does not define a test script.

## Blockers / Risks

No blockers. Risk is limited to prompt-copy interpretation; no runtime authority or product surface changes are introduced.

## Recommended Next Implementation PR

Evaluate reviewed Codex prompt template with a mock PR task
