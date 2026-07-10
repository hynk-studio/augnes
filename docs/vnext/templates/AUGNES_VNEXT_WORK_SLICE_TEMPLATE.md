# Augnes vNext Work Slice Template

> 이 템플릿은 Codex 작업 분해와 vertical slice 설계에 사용한다.

## 1. Identity

```text
Title:
Target milestone:
Target maturity move:
Project:
Work ID:
Owner/operator:
Target worker/adapter:
```

## 2. Problem

```text
User/workflow problem:
Why now:
Which of Resume / Verify / Decide improves:
Observed current friction:
```

## 3. Architecture Classification

```text
Primary class:
- Native Host
- Adapter
- Core
- Projection / Inspector
- Lab

Secondary classes:
Existing concepts absorbed or retired:
Why this is not a new standalone surface:
```

## 4. Inputs and Outputs

```text
Real inputs:
Source refs:
Trust classes:
Output contract:
Consumer:
Next-loop signal:
```

## 5. Authority and Data

```text
Can read:
Can write:
Cannot write:
External side effects:
Semantic transition:
Data classification:
Retention:
Coverage level:
```

## 6. Implementation Boundary

```text
Expected files/modules:
Persistent aggregates touched:
Routes/tools touched:
UI surfaces touched:
Compatibility paths:
Migration required:
```

## 7. Tests

```text
Domain behavior:
Protocol validation:
Success path:
Refusal/fail-closed path:
Idempotency:
Cross-project isolation:
Replay/fault case:
No-side-effect assertion:
```

## 8. Evaluation

```text
Dogfood or external-project scenario:
Metric expected to change:
Baseline:
Minimum evidence:
What would falsify the value claim:
```

## 9. Complexity Delta

```text
New top-level concepts:
New aggregates:
New routes:
New UI surfaces:
New status values:
Removed/absorbed concepts:
Net complexity judgment:
```

## 10. Explicit Non-Goals

-
-
-

## 11. Result Report Requirements

```text
Changed files:
Checks run:
Skipped checks with reasons:
Observed outcome:
Unexpected changes:
Remaining friction:
RunReceipt ref:
PR ref:
Suggested next bounded slice:
```
