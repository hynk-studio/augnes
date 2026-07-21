# Canonical CI break-glass merge policy

## Purpose

`canonical-tests` is the stable required merge check for `main`. This policy
defines a narrow human-operated exception for a pull request whose remaining
Canonical CI state is pending, cancelled, unavailable, or demonstrably
unrelated to the proposed change. It does not weaken the normal merge path,
waive change-relevant verification, or authorize direct pushes to `main`.

The CI workflow must never manufacture a successful `canonical-tests` result
to simulate a bypass. Workflow inputs, labels, commit messages, bot comments,
and actor-controlled repository files cannot grant bypass authority. Bypass
authority belongs only to the repository ruleset and an explicit human merge
action.

## Protection audit and recommended configuration

Audited on 2026-07-22 at base
`eb9a41fc823a5aa858a18f7e7e9fbfb76d76df09`:

- `main` is protected by the active repository ruleset **Protect main**
  (ruleset ID `18997075`), which targets the default branch.
- The ruleset requires a pull request and the GitHub Actions status check
  `canonical-tests`. It also blocks branch deletion and non-fast-forward
  updates.
- Legacy branch protection is not configured for `main`; the ruleset is the
  current required-check protection mechanism.
- The ruleset bypass list is empty and reports
  `current_user_can_bypass: never`. Administrator bypass is therefore not
  currently possible.
- `.github/workflows/ci.yml` runs Canonical CI for pull requests and every push
  to `main`. A push to `main` runs the complete canonical suite.

Recommended manual repository-settings change:

1. Open **Settings → Rules → Rulesets → Protect main → Edit**.
2. In **Bypass list**, select **Add bypass** and add only the
   **Repository administrators** role.
3. Change that role's bypass mode from **Always allow** to
   **For pull requests only**.
4. Leave the ruleset active and leave its default-branch target, pull-request
   requirement, required `canonical-tests` check, deletion restriction, and
   non-fast-forward restriction unchanged.
5. Save the ruleset, then re-audit it. The bypass entry must identify only the
   repository-administrator role with API `bypass_mode: pull_request`; it must
   not contain `bypass_mode: always` or `bypass_mode: exempt`.

This settings change is intentionally not automated by this policy change.
GitHub documents that pull-request-only bypass requires the actor to use a pull
request, preserving its change trail and audit log without allowing direct
pushes. See [Creating rulesets for a repository][github-rulesets].

[github-rulesets]: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository#granting-bypass-permissions-for-your-branch-or-tag-ruleset

## Eligibility

A repository administrator may consider the bypass only when every item below
is true:

- The exact pull-request head SHA is recorded in the pull request.
- The change is documentation-only or otherwise low risk, or every
  change-relevant focused test has passed on that exact head.
- The remaining check is pending because of CI latency, a runner outage, known
  unrelated flakiness, or an erroneous test-plan classification.
- The bypass reason and every incomplete, cancelled, unavailable, or unrelated
  check are recorded in the pull request.
- The full main-branch Canonical CI is configured to run after merge.
- The administrator accepts that a failed post-merge main run requires an
  immediate corrective pull request or revert.

Time pressure, release pressure, or a long test duration does not establish
eligibility by itself.

## Prohibited use

Do not recommend or use the bypass when any item below is true:

- The failure cause is unknown.
- Typecheck or build failed.
- A relevant schema, migration, recovery, package, runtime,
  process-ownership, cleanup, authority, or data-integrity test failed or
  remains unverified.
- The pull-request head changed after the cited verification or evidence was
  collected.
- The only justification is that the tests take too long.

A known failure may be considered unrelated only when the pull request records
concrete evidence for that conclusion. Absence of evidence is not evidence of
unrelatedness.

## Required pull-request evidence

Before merging, add a break-glass record to the pull-request description or a
new administrator comment containing all of the following:

```text
Break-glass merge record
- PR head SHA:
- Administrator and UTC decision time:
- Change-risk classification and rationale:
- Focused checks run on this exact head, with results and links:
- Incomplete checks and their current states:
- Evidence for CI latency, runner outage, unrelated flakiness, or erroneous classification:
- Why each incomplete check is unrelated to this change:
- Bypass reason:
- Confirmation: the PR head has not changed since the cited verification:
- Confirmation: full Canonical CI will run on the resulting main push:
- Corrective owner if the main run fails:
```

Immediately before merge, compare the live pull-request head SHA with the
recorded SHA. If they differ, the evidence is stale and bypass is prohibited
until the new head is verified and recorded.

The administrator must use GitHub's explicit pull-request bypass merge action.
Do not disable the ruleset, remove `canonical-tests`, edit the workflow to
report success, or temporarily grant a broader actor or bypass mode.

## Post-merge verification

1. Record the merge commit SHA and the resulting main-branch Canonical CI run
   URL in the pull request.
2. Confirm that the run is for the merge result currently on `main`, is not
   superseded, and executes the complete canonical suite.
3. Monitor it through terminal completion. A pending or cancelled run is not
   post-merge proof; replace only infrastructure-cancelled evidence with one
   fresh complete run for the same current main state.
4. If the run fails, immediately open a corrective pull request or revert the
   merge through a pull request. Do not conceal the failure or treat the
   original bypass record as verification.

The bypass decision is an emergency merge authorization, not a successful test
result and not evidence that Canonical CI passed.
