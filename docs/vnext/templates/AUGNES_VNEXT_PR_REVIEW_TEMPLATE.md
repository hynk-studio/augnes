# Augnes vNext PR Review Template

## 1. Summary

```text
PR:
Target work/milestone:
Claimed maturity move:
Reviewer:
```

## 2. What Now Works

-

## 3. Requirement Progress

```text
Which user/workflow friction was reduced?
What real behavior changed?
What real input and consumer exist?
What next-loop signal was produced?
```

## 4. Architecture Fit

- [ ] Classified as Native / Adapter / Core / Projection / Lab
- [ ] Core meaning is provider-neutral
- [ ] Native host UX is not unnecessarily duplicated
- [ ] Existing concept was reused or intentionally retired
- [ ] No unexplained new top-level contract

## 5. Semantic and Authority Review

- [ ] Observation, attestation, inference and proposal are separated
- [ ] Receipt does not imply approval
- [ ] Decision and transition are separate
- [ ] Native permission is not treated as Augnes approval
- [ ] External effect and semantic commit have separate gates
- [ ] Coverage is not overstated

## 6. Data and Temporal Review

- [ ] Project scope is explicit
- [ ] External IDs remain ExternalRefs
- [ ] source refs and trust classes are preserved
- [ ] event/observed/recorded time semantics are not lost
- [ ] Claim revision/supersession is preserved
- [ ] no raw secret/transcript/hidden reasoning persistence

## 7. Complexity Review

```text
New concepts:
New aggregates/tables:
New routes:
New UI surfaces:
New scripts/smokes:
Removed/absorbed items:
Net complexity:
```

- [ ] A new table is justified as a stable aggregate
- [ ] A new UI surface is justified over Inspector/native UX reuse
- [ ] One-off smoke did not replace behavior/invariant tests

## 8. Verification

```text
Tests passed:
Replay/fault cases:
Skipped checks and reasons:
Real data vs fixture distinction:
Cross-project isolation:
Migration/restore status:
```

## 9. Outcome Evidence

```text
Dogfood/external project use:
Metric change:
Known insufficiency:
Why this is more than a panel/type/record existing:
```

## 10. Decision

```text
APPROVE / REQUEST CHANGES / COMMENT

Merge authority remains with the user/operator.
Semantic adoption remains a separate Augnes ReviewDecision when applicable.
```
