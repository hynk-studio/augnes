# REA-derived function-transfer review — 2026-10-20

## Status and existing owners

Supporting research reference; proposed Augnes capability and usefulness remain
**UNTESTED**. This note retains the user-requested review, not a new program,
implementation assignment, Current/Next milestone or evaluation gate.
[03's executable-reuse direction](../03_AUGNES_VNEXT_TRANSITION_ROADMAP.md#next-p4p5--executable-capability-reuse-from-experience-1373)
continues to own sequencing; [04's existing evidence distinctions](../04_AUGNES_VNEXT_EVALUATION_AND_MATURITY.md#current-understanding-guided-work-evidence)
continue to own evaluation. Neither owner's body is amended by this note.
Reviewed Augnes main: `a9aa2c69e0cd1bb6133aaf530778c3d9784637ef`.

## Retained option: purpose-conditioned function transfer

For an assigned task with a usable prior asset and an actual next consumer,
consider unchanged reuse, a small adapter, partial reimplementation, direct work
or non-use. The current question, project Perspective and conditions determine
which behavior matters; preserving the original internal implementation is not
itself the goal. Distinguish compatibility with existing behavior, transfer of
only the needed subset, and an intentional change of requirements. State the
relevant input/state domain, preserved behavior, allowed differences and unknowns;
include units, identity, error behavior or effects only where the task needs them.

Use available source, specifications, a callable original and retained observations
as appropriate. Do not withhold usable source or invent a runtime restriction to
force reverse engineering. Loss of the original is one research condition, not a
prerequisite. A Python-to-JavaScript workflow-cost port is an optional example,
not a selected implementation, required runtime or public-release change.

First inspect [ordinary experience use](../../../scripts/companion-experience-use.mjs)
and the [existing changed-goal/version example](../../../scripts/companion-experience-use.md).
Connect the smallest sufficient implementation through ordinary source/material,
work and successor paths; use existing host/model judgment and specialist tools
when needed. A no-change finding is valid. No new selector, executor, universal
module format, registry, schema or REA dependency is presumed.

## Retained option: outcome-informed method and checker reuse

Reusable assets may include an investigation or checking method improved after
an observed failure, not just the task's output code. Preserve the earlier and
revised assets, the missed distinction, supported applicability and unresolved
limits. A later consumer should actually use the relevant improvement or retain
its current method for a supported reason. A warning note or stored use flag alone
is not that outcome.

Inspect the [selective-report consumer](../../../scripts/external-response-selective-report.mjs)
and [external material/correction path](../../EXTERNAL_RESPONSE_LOCAL.md) first.
Their bounded input-correction behavior is not a demonstrated defect or general
checker-revision capability. A newly discovered checker weakness does not prove
that every earlier result is wrong, and an old pass does not establish newly
claimed coverage. Reconsider affected claims/results while preserving independently
supported work; do not introduce a global revalidation service for this option.

## Evidence questions for a separately selected task

Declare the claimed functional scope and a task-appropriate comparison basis.
Distinguish recorded-response replay, behavior on new inputs, and state-transition
reproduction. Where a revised checker is the claimed contribution, show the
relevant defect or deliberately changed implementation it can now distinguish,
then inspect real successor use. Test success supports only the tested scope.
Original-observation limits, deliberate requirement changes, human assistance and
unavailable evidence remain visible.

Apply 04 rather than creating another evaluation framework. Functional correctness,
actual later use, the contribution of prior experience and Augnes's added value
against equally informed strong adaptive memo/code are separate claims. A baseline
may derive its own contracts, code and checks using the same relevant tools and
budgets. Account for initial preparation, transfer, verification, repair and later
use; leave unmeasured burden unknown. No fixed trial count or all-options gate is
introduced. Preserve the bounded P4.6/#1459/#1464 negative/tie and SIMPLIFY findings;
they neither establish this option nor prohibit separately approved capability work.

## REA source boundary and coordination

The reviewed [REA agent-environment documentation](https://github.com/morluto/rea/blob/074768901f3cdc8205b61773fb1faf6f6c7b3ca8/docs/agent-environments.md)
describes recorded-response replay, not emulation: unmatched calls may return a
record with `exact_match: false`, and supplied write bodies do not change state.
That observation motivates a claim boundary, not an Augnes benchmark result.
REA execution, broad reconstruction performance and independent productivity
benefit were not audited here; their status is **NOT_RUN / NOT_ESTABLISHED**.

The reviewed #1491 reading, #1487 method-asset and #1473 changed-context proposals
retain their own review status; this note does not adopt them. #1498 role replacement
and #1495/#1496 budget diagnostics keep their assigned scope. Do not turn role
replacement into mandatory tool reconstruction or expand their acceptance criteria.
Public entry and contribution work continue independently. This reference allocates
no model observations, experiments, execution, outreach, installation or release,
and changes no Core, grant, recovery, publication or merge authority.
