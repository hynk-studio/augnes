# Promotion Readiness Review Hub Cockpit Entrypoint v0.1

Slice name: `promotion_readiness_review_hub_cockpit_entrypoint_v0_1`

Purpose: read/display-only home/cockpit entrypoint to the promotion readiness
review hub.

Current basis: PR #856, PR #857, PR #858, PR #859, PR #860, PR #861, and PR
#862.

Home/cockpit route touched/tested: `/`

Linked route: `/perspective/promotion`

Existing downstream route: `/perspective/promotion/readiness-packet`

## Scope

This entrypoint helps an operator discover the existing read/display-only
promotion readiness review hub from the main Augnes surface. It is static,
read/display-only, and navigation-only.

Explicit statements:

- this entrypoint does not perform human review
- this entrypoint does not claim human signoff
- this entrypoint does not execute promotion
- this entrypoint does not write promotion decisions
- this entrypoint does not create proof/evidence
- this entrypoint does not product-write
- readiness is not promotion
- validation pass is not truth/proof/approval/product readiness
- browser validation is not human review
- the /perspective/promotion link is navigation only, not approval, promotion, write, or release

## UI Sections

The entrypoint documents these read/display sections:

- promotion readiness review entrypoint
- allowed read/display navigation
- basis refs
- status flags
- blocked authority actions
- what this entrypoint cannot do

The visible status flags remain:

- human_signoff_completed: false
- human_review_still_required: true
- promotion_execution: false
- promotion_decision_write: false
- product_write: false
- proof_or_evidence_creation: false
- durable_state_apply: false
- formation_receipt_write: false
- accepted_evidence_ref_write: false
- product_id_allocation: false

## Navigation Affordance Policy

The entrypoint may expose one normal internal anchor link to
`/perspective/promotion` with read/display navigation wording. The link is
navigation only. It is not approval, promotion execution, release execution,
product authority, proof/evidence creation, durable state apply, Formation
Receipt write, accepted evidence ref write, or product ID allocation.

The link must not use approve/promote/publish/release/write/commit/accept/send
wording, must not use `role="button"`, must not include an `onClick` handler,
must not point to an external URL, and must not call an API route.

## No-Action-Controls Policy

The new entrypoint must not render buttons, forms, inputs, role-based action
controls, click handlers, action-like links, promotion decision controls, write
buttons, or action controls for promotion execution, promotion decision write,
proof/evidence creation, product-write, Formation Receipt write, accepted
evidence ref write, product ID allocation, GitHub actuation, release execution,
live provider validation, source fetching/retrieval expansion, broad all-route
audit instrumentation, API write routes, or DB schema/migrations.

Existing unrelated cockpit controls remain outside this slice. Browser
validation scopes no-action-control assertions to the entrypoint container:
`data-testid="promotion-readiness-review-hub-cockpit-entrypoint"`.

Blocked-action explanatory text is allowed only as read/display content inside
boundary summaries or blocked-authority lists. The validation must not treat
blocked-action explanatory text as an action control.

## Network And Request Boundary

The entrypoint is static and read/display-only. It does not call `fetch`, does
not call `/api` routes, does not call POST/PUT/PATCH/DELETE routes, does not
add API write routes, and does not add a new API route. The existing home
cockpit may perform local read-only API calls outside this entrypoint, so
browser validation does not require zero `/api` calls for the entire home page.

Browser validation observes request metadata only and fails on
POST/PUT/PATCH/DELETE requests, non-loopback external requests, promotion
decision routes, product-write routes, proof/evidence routes, Formation Receipt
routes, GitHub routes, release routes, provider routes, source-fetch routes,
and retrieval expansion routes.

## Screenshot And Artifact Policy

Screenshots may be generated locally under a temporary path if useful for
browser validation, but screenshots must not be committed, embedded, or copied
into the repository. If screenshot artifacts are mentioned, use symbolic
placeholders only:
`<PROMOTION_READINESS_COCKPIT_ENTRYPOINT_DESKTOP_SCREENSHOT_ARTIFACT>` and
`<PROMOTION_READINESS_COCKPIT_ENTRYPOINT_MOBILE_SCREENSHOT_ARTIFACT>`.

The browser report is public-safe. It must not include raw artifacts, raw
browser reports, screenshots, terminal logs, browser dumps, raw DB rows, raw
route responses, raw provider output, prompts, retrieval output, source bodies,
secrets, GitHub payloads, release payloads, raw request bodies, raw response
bodies, raw HAR, or private local path inclusion.

## Authority Boundary

This entrypoint denies product authority, promotion execution, promotion
decision write, promotion decision store usage/write, promotion decision
controls, proof/evidence creation, durable Perspective state apply, Formation
Receipt write, product-write, accepted evidence ref write, product ID
allocation, GitHub actuation, release execution, live provider validation,
source fetching/retrieval expansion, broad all-route audit instrumentation,
API write routes, DB schema/migrations, raw artifact copying, screenshot
embedding, private local path inclusion, and release authority.

human_signoff_completed: false

human_review_still_required: true

## Final Recommendation

Run browser/static validation of this cockpit entrypoint. Once browser/static
validation complete, proceed only to the next read/display usability slice or
pause for human spot review. Do not recommend promotion execution,
product-write, or release.
