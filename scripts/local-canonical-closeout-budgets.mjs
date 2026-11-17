// Adopted orchestration limits for the live executor and receipt harnesses.
// Product deadlines, intentional timeout scenarios and lifecycle safeguards
// remain owned by their existing registrations.
export const CLOSEOUT_EXECUTION_BUDGETS = Object.freeze({
  executorHarnessMs: 120_000,
  receiptHarnessMs: 90_000,
});

// Shared limits still consumed by current observation and child-result checks.
// Retired qualification-specific limits remain available in Git history.
export const AUXILIARY_EXECUTION_BUDGETS = Object.freeze({
  ordinaryChildMs: 10_000,
  reviewHarnessMs: 300_000,
  observerControlsMs: 20_000,
  reviewAcceptanceFixtureMs: 30_000,
  // Synthetic reviewed-fixture watchdogs are hang bounds, not performance
  // requirements. Allow two minutes for the complete setup/assertion/cleanup
  // workload and three minutes for its enclosing control. The one-minute
  // difference includes the existing 8s TERM / 5s KILL settlement and wrapper
  // cleanup. Keep the named registrations for source-bound historical readers;
  // their former near-observed allowances remain in Git history.
  reviewRevisionFixtureMs: 120_000,
  reviewSerialAggregateFixtureMs: 120_000,
  reviewSerialAggregateControlMs: 180_000,
  reviewSerialMaterialFixtureMs: 120_000,
  reviewSerialMaterialControlMs: 180_000,
  reviewAdverseFixtureMs: 12_000,
  reviewChildResultHarnessMs: 60_000,
});
