# Director brief — Augnes Console

## The job

Build the **first real ChatGPT App shell** for Augnes.

This product must demonstrate Augnes' real value over base ChatGPT:

- evidence authority is separate from summary/view
- time-aware self-governance is visible
- strategy/rationale is legible
- boundary carry-forward is explicit
- continuity is measured instead of hand-waved

## Product one-liner

**Augnes is a ChatGPT app that turns ongoing work into an evidence-backed, continuity-aware operations console.**

## Public app promise

The public app helps the user answer:

- What are we actually doing?
- What evidence supports or contradicts this?
- Why is Augnes recommending verify / retrieve / ask / proceed?
- What survives the current boundary?
- Are we still on the same self / branch?

## Internal lab promise

The internal Chrono Lab helps the team answer:

- Which continuity canaries fail after interruptions or boundary resumes?
- When would a baseline change count as same_self_revision vs branch vs successor?
- How much of the chrono-self surface is safe for public exposure?

## The biggest trap

Do not build a generic search connector.
That would be boring and strategically weak.

Search/fetch are necessary bones.
The face of the product is:

- casefile
- strategy rationale
- boundary packet
- continuity panel
- governance audit

## Exit criteria for the first serious build

1. The app runs in ChatGPT developer mode.
2. Search/fetch work with the correct shapes.
3. The widget renders at least one panel reliably.
4. Boundary and continuity are visible in the UI.
5. No tool leaks raw prompt text, secret data, or unnecessary internal identifiers.
