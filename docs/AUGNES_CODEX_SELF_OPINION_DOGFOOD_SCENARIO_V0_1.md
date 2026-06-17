# Augnes Codex Self-opinion Dogfood Scenario v0.1

## Purpose

This document defines a preview-only Codex self-opinion dogfood scenario for
the ChatGPT-Augnes-Codex work loop. It lets a future operator ask a separate
Codex session to review the loop from its own worker perspective after reading
the existing research dogfood scenario and observation artifacts.

The self-opinion artifact is advisory review input only. It is not truth,
approval, merge authority, proof, evidence, durable state, work closure, or a
GitHub review.

This PR does not run Codex, add a live Codex runner, call providers, submit a
GitHub review, create proof/evidence rows, mutate Augnes state, add App/MCP
tools, or implement the Research / Paper / Knowledge Accumulation surface.

## Scenario ID

`CODEX_SELF_OPINION_DOGFOOD_V0_1`

## Inputs Codex Should Read

- `docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_SCENARIO_V0_1.md`
- `docs/AUGNES_CHATGPT_CODEX_FLOW_DOGFOOD_OBSERVATION_V0_1.md`
- `apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md`
- `docs/AUGNES_CODEX_RESULT_PASTE_NORMALIZER_PREVIEW.md`

## What Codex Should Evaluate

1. Was the handoff packet enough to understand the task?
2. Were expected files and checks concrete enough?
3. Was it clear what not to do?
4. Was result reporting back to Augnes easy?
5. Did the paste normalizer align with how Codex naturally writes closeout reports?
6. Where did Codex feel tempted to over-automate?
7. Which boundaries should remain non-automated?
8. What would improve the Core Handoff packet?
9. What would improve the result report template?
10. What should the next research / paper / knowledge accumulation surface prioritize?

## Required Output Shape

Codex should return a structured self-opinion report with these fields:

- `worker_perspective_summary`
- `handoff_clarity_rating`
- `result_return_friction_rating`
- `over_automation_risks`
- `non_automation_boundaries_to_preserve`
- `handoff_packet_improvements`
- `result_report_template_improvements`
- `research_accumulation_surface_recommendations`
- `concrete_next_pr_candidates`
- `authority_boundary_statement`

Ratings should be plain text such as `4/5 - concise reason`, not a source of
truth or score stored in Augnes state.

## Sample Self-opinion Report

The following sample is a realistic advisory report. It is not live Codex
output and must not be treated as proof or product truth.

```text
worker_perspective_summary:
The loop gave enough context to understand the operator-led research
accumulation docs/smoke task, and the observation artifact made it clear that
the sample paste should remain conservative. The strongest part was the
explicit expected files/checks plus authority boundary text. The weakest part
was that the worker has to infer which pieces are scenario-contract work versus
future research-product work.

handoff_clarity_rating:
4/5 - the work ID, expected files, expected checks, and no-automation boundaries
were clear, but the Core Handoff would benefit from a shorter "do this now" block.

result_return_friction_rating:
3/5 - codexResultText / codexResultPaste is easy to understand, but the report
template should name the combined skipped-check/caveat behavior directly.

useful_criticisms:
- Criticism: The handoff still mixes scenario-contract tasks with future product direction, which can tempt a worker to start designing ingestion.
- Criticism: The sample report exercises the parser well, but it does not show a compact field-first report format that Codex could reliably follow every time.
- Criticism: The observation artifact records local registered-tool behavior, but a worker may miss that no live Developer Mode host behavior was observed.

over_automation_risks:
- Adding a live Codex runner before the operator has reviewed self-opinion output.
- Treating self-opinion recommendations as close-ready work status.
- Automatically converting suggested PR candidates into issues, branches, PRs, reviews, or proof/evidence records.

non_automation_boundaries_to_preserve:
- Boundary: Keep Codex execution outside App/MCP until a user explicitly starts a separate Codex session.
- Boundary: Keep self-opinion reports out of proof/evidence and committed state unless a later human-approved write path exists.
- Boundary: Keep GitHub review submission, merge, publish, retry, replay, and deploy controls manual and user/Core gated.

handoff_packet_improvements:
- Add a compact "current task only" subsection above broader context.
- Put expected files/checks directly beside skipped-check policy.
- Include a one-line reminder that future product direction is not implementation authority.

result_report_template_improvements:
- Add explicit headings for `skipped_checks`, `remaining_caveats`, and `ambiguous_combined_section_lines`.
- Ask Codex to report "No proof/evidence rows written" as a standalone line when true.
- Include a field for "live host observation: run/skipped with reason".

research_accumulation_surface_recommendations:
- Prioritize a read-only scenario pack for research questions, paper refs, extracted claims, and unresolved gaps.
- Keep ingestion/manual citation capture separate from operator planning until source authority rules are clearer.
- Start with inspection and review packets before any durable research knowledge state.

concrete_next_pr_candidates:
- PR candidate: Add a compact Core Handoff "current task only" subsection for dogfood work items.
- PR candidate: Add a reusable Codex result report template that names skipped_checks, remaining_caveats, and ambiguous_combined_section_lines.
- PR candidate: Add a preview-only Research Accumulation Scenario Pack doc and smoke without ingestion or provider calls.

authority_boundary_statement:
This self-opinion is advisory only. It is not proof/evidence, not a state
commit, not work closure, not a GitHub review, not merge approval, and not
product truth. It adds no automatic Codex execution, no automatic GitHub fetch,
no proof/evidence write, no work close/status mutation, no event
creation/mutation, no state commit/reject, no shell execution from App/MCP, no
provider/OpenAI calls, no branch/PR creation from App/MCP code, no PR review
submission, no merge/publish/retry/replay/deploy controls, no DB migration, no
new user-facing App/MCP tools, and no widening of the work_loop_readonly
Developer Mode tool surface.
```

## Expected Review Behavior

The self-opinion is review input only.

It must not become proof/evidence.
It must not become a state commit.
It must not become work closure.
It must not become a GitHub review.
It must not become merge approval.
It must not become product truth.

A human may use it to decide what to inspect or implement next, but the opinion
does not close the work item, approve a PR, publish a result, create a branch,
or authorize product behavior.

## How To Feed It Back Into Augnes

A future operator may paste the self-opinion report through `codexResultText`
or `codexResultPaste` as a result payload candidate for human review.

This PR does not add an automatic return path. It does not call Codex, fetch
GitHub, submit a review, write proof/evidence, mutate state, create events,
close work, or create follow-up work.

## Authority Boundaries

- no automatic Codex execution
- no automatic GitHub fetch
- no proof/evidence write
- no work close/status mutation
- no event creation/mutation
- no state commit/reject
- no Codex execution from App/MCP
- no shell execution from App/MCP
- no provider/OpenAI calls
- no branch/PR creation from App/MCP code
- no PR review submission
- no merge/publish/retry/replay/deploy controls
- no DB migration
- no new user-facing App/MCP tools
- no widening of the work_loop_readonly Developer Mode tool surface

## Skipped Checks Policy

If no live Codex self-opinion session is actually run, report that only the
scenario contract and sample report were added.

If no live MCP Inspector / ChatGPT Developer Mode session is started, report
that no live host observation is claimed.

Do not claim proof/evidence rows were written unless a later human-approved
write path actually writes them.

## What This Scenario Does Not Test

- Live Codex execution.
- Automatic self-opinion generation.
- GitHub review or comment submission.
- Proof/evidence recording.
- Work close/status mutation.
- Event creation or mutation.
- State commit/reject.
- Provider/OpenAI calls from App/MCP.
- Research ingestion, paper fetching, indexing, retrieval, embeddings, or RAG.
- The actual Research / Paper / Knowledge Accumulation product surface.

## Next Recommended Step

Run a separate, explicitly user-started Codex session against this scenario
when a human wants actual worker feedback. Paste the resulting self-opinion
through `codexResultText` or `codexResultPaste` for preview review, then decide
whether the next PR should improve Core Handoff copy, result report templates,
or the preview-only research accumulation scenario pack.
