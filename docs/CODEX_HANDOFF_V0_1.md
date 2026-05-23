# Codex Handoff v0.1

## Status

- handoff-template-only
- non-SSOT
- does not expand Active set
- no runtime behavior
- no schema authority
- no implementation authority
- no diagnostic authority
- no evaluation authority
- no production-readiness claim

## Purpose

Provide a reusable task handoff shape for Codex work.

This template supports ChatGPT review and a PR-centered workflow. It is guidance,
not runtime policy, and it does not create implementation, evaluation, evidence,
or proof authority.

## Handoff Template Fields

- repo
- base branch
- working branch
- PR title
- task goal
- context / prior decisions
- files expected to change
- files forbidden to change
- hard constraints
- public-facing wording requirements when applicable
- implementation notes
- required checks
- PR body requirements
- final report requirements

## Review Aid vs Continuity Anchor

Review aids are useful for reviewer clarity but are not required anchors. They
may include implementation notes, formatting preferences, PR body structure, and
final report formatting.

Continuity anchors should be preserved for later dogfooding review when
available. They may include the repo, base branch, working branch, PR title, task
goal, context / prior decisions, expected changed files, forbidden changed files,
hard constraints, required checks, and final report requirements.

This split is a documentation aid only. It does not create schema authority,
runtime policy, or a required project-state contract.

## PR-Centered Workflow

Codex codes, tests, and opens PRs. ChatGPT reviews. The user decides merge.

This workflow description is a review aid for dogfooding. It does not grant
merge authority, commit/reject authority, or runtime authority.

## Non-Goals

- no autonomous execution claim
- no merge authority
- no production-readiness claim
- no runtime behavior
- no evidence/proof authority
- no commit/reject input
- no Sidecar e_t runtime computation
