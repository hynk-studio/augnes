# Promotion Readiness Copy IA Clarity v0.1

Slice name: `promotion_readiness_copy_ia_clarity_v0_1`

Purpose: copy/IA clarity fix after human spot review `pass_with_copy_risk`.

Current basis: PR #856, PR #857, PR #858, PR #859, PR #860, PR #861, PR #862,
and PR #863.

Human spot review classification: `pass_with_copy_risk`

Routes touched/validated:

- `/`
- `/perspective/promotion`
- `/perspective/promotion/readiness-packet`

## Observed Issues

- Home entrypoint discoverability FAIL.
- Hub hierarchy/blocked authority visibility RISK.
- Static/symbolic preview meaning RISK.
- Validation warning density RISK.

Main risk observed: static/symbolic/read-display meaning and URL-free
discoverability were weaker than the safety boundary itself; operators may skip
dense boundary copy or fail to find the chain naturally.

## Changes Made

- home entrypoint clarity
- hub first-judgment hierarchy
- readiness packet static/symbolic preview clarity
- dense boundary copy kept but summarized

The home entrypoint now foregrounds `Promotion readiness review`, `Human review
prep`, `Read/display-only`, `Not promotion approval`, the read/display
navigation link, and the required human-review status flags.

The promotion review hub now answers the first-judgment questions near the top:
what this is, what is safe to do, what cannot happen here, and why no
approval/promotion button is present.

The readiness packet now foregrounds `Static/symbolic read-display preview`,
`This is not live promotion readiness`, and `Use this to prepare human review,
not to approve promotion`.

## Explicit Scope

This PR is copy/IA only.

This PR does not perform human review.

This PR does not claim human signoff.

This PR does not execute promotion.

This PR does not write promotion decisions.

This PR does not create proof/evidence.

This PR does not product-write.

This PR does not add action controls.

This PR does not add API routes.

Readiness is not promotion.

Static/symbolic preview is not live promotion readiness.

Validation pass is not truth/proof/approval/product readiness.

Browser validation is not human review.

human_signoff_completed: false

human_review_still_required: true

## Navigation And Controls

The existing navigation affordances remain normal internal anchor links:

- `Open read/display promotion review hub`
- `Open read/display readiness packet`

The links are navigation only. They are not approval, promotion execution,
promotion decision write, proof/evidence creation, durable state apply,
Formation Receipt write, product-write, accepted evidence ref write, product ID
allocation, GitHub actuation, release execution, live provider validation,
source fetching/retrieval expansion, or API write authority.

The promotion readiness scopes must not render buttons, forms, inputs,
`role="button"`, click handlers, write controls, action-like links, promotion
decision controls, approve/promote/publish/release/write/commit/accept/send
controls, or API calls.

## Authority Boundary

This copy/IA slice denies product authority, promotion execution, promotion
decision write, promotion decision store usage/write, promotion decision
controls, proof/evidence creation, durable Perspective state apply, Formation
Receipt write, product-write, accepted evidence ref write, product ID
allocation, GitHub actuation, release execution, live provider validation,
source fetching/retrieval expansion, broad all-route audit instrumentation, API
write routes, DB schema/migrations, raw artifact copying, screenshot embedding,
private local path inclusion, and release authority.

## Artifact Policy

The browser report is public-safe. It must not include raw artifacts, raw
browser reports, screenshots, terminal logs, browser dumps, raw DB rows, raw
route responses, raw provider output, prompts, retrieval output, source bodies,
secrets, GitHub payloads, release payloads, raw request bodies, raw response
bodies, raw HAR, or private local path inclusion.

Screenshots may be generated locally for operator inspection, but screenshots
must not be committed, embedded, or copied into the repository.

## Static Smoke Compatibility

Existing downstream smoke scripts that enforce changed-file scope were updated
only to allow this copy/IA slice's expected files and the corresponding
allowlist compatibility files. Their runtime, source, artifact, privacy, and
authority assertions were not weakened.

## Final Recommendation

Rerun human spot review on copy clarity.

Do not recommend promotion execution, product-write, or release.
