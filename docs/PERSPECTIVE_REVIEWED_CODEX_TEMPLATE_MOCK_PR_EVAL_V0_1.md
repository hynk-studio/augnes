# Perspective Reviewed Codex Template Mock PR Eval v0.1

## Purpose and Scope

This PR evaluates the reviewed Codex prompt template using a mock PR task.

It follows PR #457, which added `buildPerspectiveAgentBriefCodexPromptTemplate` and a reviewed, copy-ready prompt wrapper around the manual Agent Brief `codex_handoff` packet.

This is dogfood/report-only. It does not execute Codex, call GitHub, add routes, add UI, or persist anything. It does not implement the mock task in product code or modify runtime behavior.

## Evaluated Flow

The evaluated flow is:

`manual pasted text -> local preview response with ingress_admission -> Agent Brief with ingress_context -> codex_handoff packet -> reviewed Codex prompt template -> mock PR task evaluation artifact -> human review`

The mock evaluation answers whether the reviewed prompt template carries enough context for a scoped PR task, keeps Codex may/must-not boundaries clear, preserves the ChatGPT-GitHub-Codex review workflow, excludes raw/candidate/private/provider values, and remains concise enough for human-reviewed copy/paste.

It uses generated artifacts for human review.

## Mock PR Task Design

The mock task scope is intentionally safe and docs/test oriented:

“Use the attached reviewed Agent Brief prompt template to prepare a hypothetical minimal docs-only PR plan for improving the readability of the Agent Brief handoff packet copy. Do not edit product code in this evaluation slice. Do not call GitHub. Do not open a real PR. Produce a mock PR plan, expected changed files, test plan, risks, and PR body outline only.”

This is not a real implementation task. The generated artifact may include a mock PR plan and mock PR body outline. It must not claim real execution or real publication.

## Preserved PR-Centered Workflow

The evaluation preserves the workflow:

- Codex codes/tests/opens PR only in a real user-approved scoped run.
- ChatGPT reviews the PR.
- The user decides whether to merge.

In this PR, Codex is not executed. No GitHub call is made. No real PR is opened by the mock task.

## Evaluation Criteria

The report checks:

- Prompt task clarity.
- PR-centered workflow clarity.
- Authority and runtime boundaries.
- Raw-value exclusion.
- Mock PR usefulness.
- Recommended next changes.

## Raw-Value Exclusions

The generated mock artifact intentionally excludes:

- raw pasted text
- `input_text`
- raw `ingress_admission` JSON
- raw Agent Brief JSON
- candidate id values
- source ref values
- pointer ref values
- actor ref values
- consent ref values
- bounded summary values
- existing Perspective Handoff Packet body
- graph node and edge dumps
- provider/model/API/GitHub/Codex/OAuth/token/billing/private/generated payloads
- repository publication command blocks
- connector command blocks

It may mention that GitHub mutation is forbidden outside a scoped real PR workflow, that Codex should open a PR only in a real user-approved run, and that no real PR was opened.

## What Is Intentionally Not Implemented

- No routes.
- No `app/api` changes.
- No product UI.
- No components changes.
- No `app/globals.css` changes.
- No prompt template exposure in product DOM.
- No handoff packet exposure in product DOM.
- No Agent Brief JSON exposure in product DOM.
- No hidden ingress candidate JSON in product DOM.
- No Codex execution.
- No GitHub calls or mutation.
- No provider/model/API calls.
- No OAuth implementation.
- No ChatGPT Apps integration.
- No Codex plugin integration.
- No DB schema or migrations.
- No persistence.
- No graph DB behavior.
- No proof/evidence/readiness writes.
- No graph topology, node id/type, edge id/type, Event Rail, or existing Perspective packet section-order changes.
- No `perspective_agent_brief_handoff_packet.v0.1` version change.
- No `perspective_agent_brief_codex_prompt_template.v0.1` version change.

## Generated Artifacts

- `reports/dogfood/2026-06-07-perspective-reviewed-codex-template-mock-pr-task.md`
- `reports/2026-06-07-perspective-reviewed-codex-template-mock-pr-eval.md`

## Next Suggested Slice

Refine reviewed Codex prompt template from mock PR findings.
