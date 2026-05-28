# Title

Dogfood AI surface episode: {{DOGFOOD_TITLE}}

## Episode Metadata

- Run ID: {{DOGFOOD_RUN_ID}}
- Date: {{DOGFOOD_DATE}}
- Outcome: {{DOGFOOD_OUTCOME}}
- Workflow: ChatGPT -> Codex -> PR -> ChatGPT review -> user merge decision.
- Episode status: pending / completed / partial / failed / blocked / skipped.
- This capture preserves raw anchors before summaries. Summaries are review
  aids, not replacements for raw anchors.

Authority boundaries:

- Dogfood notes are evaluation material, not committed state.
- Proof is not approval.
- PR is not merge authority.
- Durable approval remains user/Core gated.
- No ChatGPT direct Codex execution authority is created.
- No Codex commit/reject or merge authority is created.

## User Request Raw Anchor

Paste the exact user task request when available. Include enough surrounding
context to preserve scope, forbidden changes, expected files, and requested
verification.

```text
Exact user request excerpt:
```

- Missing / partial / skipped anchor reason:

## ChatGPT Planning Prompt Raw Anchor

Paste the exact ChatGPT planning or handoff prompt when available. If the
episode began from Augnes state/work brief output, paste a short exact excerpt
or stable local reference to the raw output.

```text
Exact ChatGPT planning or handoff prompt excerpt:
```

- Missing / partial / skipped anchor reason:

## Codex Prompt Raw Anchor

Paste the exact Codex prompt or implementation handoff used for the session
when available. Preserve explicit allowed files, forbidden changes,
verification commands, PR title, and commit message instructions.

```text
Exact Codex prompt excerpt:
```

- Missing / partial / skipped anchor reason:

## Work ID / Handoff ID / Session ID

- Work ID: {{DOGFOOD_WORK_ID}}
- Handoff ID: {{DOGFOOD_HANDOFF_ID}}
- Session ID: {{DOGFOOD_SESSION_ID}}
- Missing IDs and concrete reasons:
- IDs are trace anchors only; they are not committed state authority.

## Expected Scope

- Expected files:
- Expected behavior or documentation outcome:
- Expected checks:
- Forbidden changes:
- Expected authority boundaries:
- Failed / partial / skipped scope notes:

## Commands Run

Paste exact command output excerpts when available, especially failures,
warnings, skipped-check output, and closeout preflight summaries.

```text
Command output excerpts:
```

- Commands not run and concrete reasons:

## Files Changed

- Expected files changed:
- Actual files changed:
- Diff scope check:
- Unexpected files:
- Generated files intentionally not committed:
- Failed / partial / skipped file-scope notes:

## Tests And Verification

- Typecheck:
- Smoke checks:
- Relevant app smoke checks:
- Closeout preflight summary:
- Failed checks:
- Partial checks:
- Verification not run and concrete reasons:

## Browser / Computer-Use Checks

- Browser/computer-use report refs if relevant:
- Views or surfaces checked:
- UI loads: yes / no / partial / skipped.
- Target view/card renders: yes / no / partial / skipped.
- Missing-data state renders: yes / no / partial / skipped.
- Unauthorized controls visible: yes / no / partial / skipped.
- Skipped reason:

## Skipped Checks And Concrete Reasons

- Check:
- Concrete reason:
- Impact on review:
- Follow-up if needed:

## PR Link

- PR: {{DOGFOOD_PR}}
- Branch:
- Commit:
- Paste exact PR title/body excerpts when relevant:

```text
PR excerpt:
```

## Codex Result Summary

Summaries are review aids, not replacements for raw anchors. Base this section
on the raw request, prompt, PR, diff, and command-output anchors above.

- Result status:
- Summary:
- What Codex completed:
- What Codex skipped:
- What Codex reported as failed, partial, or blocked:

## ChatGPT Review Findings

- Review status: completed / needs_review / partial / blocked / failed.
- Expected scope vs actual:
- Expected checks vs actual:
- Authority boundary review:
- Missing evidence, proof, action, work event, or session refs:
- Findings:

## User Merge / Approval Decision

- User merge decision: merged / not merged / deferred / rejected / unknown.
- User approval decision: approved / not approved / deferred / unknown.
- Durable Core approval recorded separately: yes / no / unknown.
- Decision anchor or exact excerpt if available:

## Evidence / Proof / Action / Work Event / Session Refs

- Evidence IDs:
- Proof/action IDs:
- Work event IDs:
- Session trace refs:
- Browser/computer-use report refs:
- Missing refs and concrete reasons:
- Dogfood notes do not create evidence, proof, action, work event, session, or
  committed state records by themselves.

## Context Preserved

- Request constraints preserved:
- Authority boundaries preserved:
- Verification context preserved:
- Raw anchors preserved:

## Context Lost

- Missing raw anchors:
- Missing commands or outputs:
- Missing IDs:
- Ambiguous user/Core decision state:
- Impact:

## Context Repaired

- Repair action:
- Source used for repair:
- Remaining uncertainty:
- Follow-up needed:

## Remaining Gaps

- Gap:
- Reason:
- Impact:
- Owner or next review surface:

## Follow-Up Backlog

- Follow-up:
- Priority:
- Blocking condition:
- Proposed next PR or work item:

## Final Outcome

- Outcome: {{DOGFOOD_OUTCOME}}
- Successful parts:
- Failed parts:
- Partial parts:
- Skipped parts:
- Final user/Core/GitHub state if known:

## Notes

- Additional raw anchors:
- Additional review notes:
- Secret handling note: do not paste tokens, private keys, local `.env` values,
  tunnel credentials, or hidden provider/debug identifiers.
- Dogfood notes are research/evaluation material unless Augnes Core separately
  records a durable decision.
