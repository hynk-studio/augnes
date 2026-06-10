# Perspective Codex Former Manual Workflow Docs

Generated at: 2026-06-10T00:00:00.000Z
Conclusion: PASS with follow-up
Recommended next implementation PR title: Add operator-facing capture helper or CLI wrapper

## Summary

This docs slice promotes the PR #492 provenance-clean separate-session Codex
former capture path into an operator-readable manual workflow. It documents how
to generate a bounded manual copy packet, paste only the copyable prompt into a
separate user-started Codex session, return the capture envelope, and run local
validation before using candidate-compatible review material.

## Why Follows PR #492

PR #492 proved complete separate-session provenance and safe local validation:
direct validation returned `needs_review` while producing non-committed
candidate-compatible review material, and Worker-Facing Guidance ran
advisory-only. This PR turns that proven path into manual workflow
documentation without capturing a new transcript.

## What Is Promoted To Manual Workflow

- packet generation with recorded packet id, former input packet id, and prompt
  hash;
- separate-session paste of only `COPYABLE_CODEX_PROMPT_TEXT`;
- required return envelope;
- local contract-fit and direct validation;
- alignment as a safety-net comparison only;
- Worker-Facing Guidance only after direct validation produces
  candidate-compatible material;
- operator checklist and when-not-to-use guidance.

## What Remains Needs Review

The workflow does not create accepted Augnes state and does not eliminate human
review. Candidate-compatible material can still remain `needs_review`, and the
operator must review pointer warnings, source mismatches, privacy warnings, and
authority boundaries before downstream use.

## Pointer Warning Note

PR #492 confirmed the path, but contract fit remained `needs_review` because
two evidence pointer refs produced warnings:

- `pointer_ref:draft.evidence_pointer_refs[0]`
- `pointer_ref:draft.evidence_pointer_refs[1]`

Direct validation retained candidate-compatible review material while reporting
`unknown_pointer_ref` warnings. Pointer warnings are review findings, not total
failure, but only retained and known pointer refs should be treated as usable
evidence pointers.

## Authority Boundary

This PR is pure local docs/report/smoke/package work. It does not capture a new
transcript, call Codex from implementation, execute Codex from Augnes, call the
Codex SDK, call OpenAI/provider/model APIs from implementation, call GitHub APIs
from implementation behavior, use implementation network behavior, write DB
state, add runtime routes, add UI, add clipboard automation, create
proof/evidence/readiness records, approve, merge, publish, retry, replay,
deploy, or make Core decisions.

## Privacy/Redaction Policy

The manual workflow returns only bounded candidate JSON or bounded response
text. Public docs and reports preserve the fact that unsafe/private material was
omitted, but if omitted marker names appear, public artifacts use sanitized
summaries instead of echoing the raw marker names.

## Verification

- npm run typecheck
- npm run smoke:perspective-codex-former-manual-workflow-docs
- npm run dogfood:perspective-codex-former-separate-session-provenance-clean-capture
- npm run smoke:perspective-codex-former-separate-session-provenance-clean-capture
- npm run dogfood:perspective-codex-former-separate-session-capture-packet-prep
- npm run smoke:perspective-codex-former-separate-session-capture-packet-prep
- npm run smoke:perspective-codex-former-manual-copy-packet
- git diff --check
- git diff --cached --check

## Skipped Checks With Reasons

- Browser/computer-use validation: not run because this is pure local
  docs/report/smoke/package work and adds no UI, route, browser-visible surface,
  clipboard automation, interactive copy control, or browser/computer-use
  capture.
- DB validation: not run because this PR adds no DB schema, persistence path, or
  state writer.
- Provider/model validation: not run because this PR intentionally does not
  call Codex, OpenAI, provider/model APIs, or SDKs from implementation.

## Recommended Next Implementation PR Title

Add operator-facing capture helper or CLI wrapper

Alternative: Start product-surface design for Augnes Codex former capture
review.
