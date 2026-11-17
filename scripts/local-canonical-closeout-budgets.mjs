// Adopted orchestration limits for the live executor and receipt harnesses.
// Product deadlines, intentional timeout scenarios and lifecycle safeguards
// remain owned by their existing registrations.
export const CLOSEOUT_EXECUTION_BUDGETS = Object.freeze({
  executorHarnessMs: 120_000,
  receiptHarnessMs: 90_000,
  authorityPhaseMs: 21_600_000,
});

// Shared limits still consumed by current observation and child-result checks.
// Retired qualification-specific limits remain available in Git history.
export const AUXILIARY_EXECUTION_BUDGETS = Object.freeze({
  ordinaryChildMs: 10_000,
  reviewHarnessMs: 300_000,
  observerControlsMs: 20_000,
  reviewAcceptanceFixtureMs: 30_000,
  // Fixed permissive whole-workload policy: Bazel's largest built-in test
  // timeout (eternal, 60 minutes), plus five minutes for enclosing settlement.
  // These are hang/resource ceilings, never per-incident latency thresholds.
  // Named registrations remain for immutable historical protocol projections.
  verificationOperationMs: 3_600_000,
  reviewFixtureMs: 3_600_000,
  reviewControlMs: 3_900_000,
  reviewRevisionFixtureMs: 3_600_000,
  reviewSerialAggregateFixtureMs: 3_600_000,
  reviewSerialAggregateControlMs: 3_900_000,
  reviewSerialMaterialFixtureMs: 3_600_000,
  reviewSerialMaterialControlMs: 3_900_000,
  reviewAdverseFixtureMs: 12_000,
  reviewChildResultHarnessMs: 60_000,
});
