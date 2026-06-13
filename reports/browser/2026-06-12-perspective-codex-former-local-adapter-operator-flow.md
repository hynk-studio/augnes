# Perspective Codex Former Local Adapter Operator Flow Browser Validation

Route: `/cockpit/perspective/codex-former/local-adapter-operator-flow`

## Checks

- route loads successfully
- No console warnings/errors
- No unexpected external traffic
- source/prepare panel visible
- copy-for-Codex panel visible
- returned envelope textarea visible
- Load PASS envelope fixture works
- Load PASS with follow-up envelope fixture works
- Load BLOCKED envelope fixture works
- Validate locally / Preview validation result updates result panel
- candidate actions can be selected
- localStorage draft survives refresh for bounded metadata
- Clear local draft removes saved state
- no automatic clipboard behavior
- no provider/model/Codex SDK/GitHub/DB/network behavior
- no accepted state/review decision/Core decision behavior
- 390px viewport had no horizontal overflow
- 768px viewport had no horizontal overflow
- desktop viewport had no horizontal overflow
- keyboard traversal covers main controls
- no raw private/provider/token/browser/source/candidate material visible outside the returned envelope textarea

## Notes

The route presents the returned envelope text only inside the user-editable returned envelope textarea after fixture load or explicit local draft restore. Candidate review material remains bounded metadata only.

## Automation Evidence

- Console warnings/errors captured: `0`
- Unexpected external refs observed in DOM: `0`
- Focusable main controls observed: `13`
- Horizontal overflow results:
  - `390px`: `0`
  - `768px`: `0`
  - `desktop`: `0`
- Interaction pass covered PASS, PASS with follow-up, and BLOCKED fixture loading; validation preview; all candidate actions; explicit local draft save; refresh restore; local draft clear; and cleared-state refresh.
