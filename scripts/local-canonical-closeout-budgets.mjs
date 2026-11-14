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
  // Revision now includes the acquisition controls (~4.35s observed) before
  // the original serial workload. Keep its former 15s plus 5s for that work;
  // the suite's 30s bound and intentional inner deadlines are unchanged.
  // Git-successor also serializes two behavior/stock executions and substantive
  // proof/refusal checks (~10.15s focused, ~6.99s parent synchronous work plus
  // ~2.22s inside cold readers). Its retained Full exhausted 15s at reader two;
  // the measured reader-two start still preceded ~3.47s of reader/parent work.
  // A 5s aggregate reserve covers that observed tail with ~1.53s headroom, not
  // a claim about the old unknown delay. Keep each reader's 15s bound, behavior's
  // 5s bound, the 30s outer owner and every other group unchanged.
  reviewRevisionFixtureMs: 20_000,
  // The complete current serial fixture measured 19.143s naturally, including
  // imports, substantive controls, the 0.731s final lineage/export/refusal tail
  // and cleanup. Add a prospective 5s reserve to its former 20s allowance.
  // This does not explain the retained timeout or establish reliable latency;
  // individual child limits and product serial/Browser budgets stay fixed.
  reviewSerialAggregateFixtureMs: 25_000,
  // Leave 20s outside the inner deadline for its existing 8s TERM / 5s KILL
  // settlement, process observations and wrapper cleanup. These are bounded
  // owners, not a universal wall-clock guarantee or permission to retry.
  reviewSerialAggregateControlMs: 45_000,
  // Complete material fixture: observed 58.343s prefix, existing 15s reader
  // and about 2.857s other work leave 3.8s within this prospective allowance.
  // The outer owner retains 8s TERM / 5s KILL / 2s parent settlement margin.
  reviewSerialMaterialFixtureMs: 80_000,
  reviewSerialMaterialControlMs: 95_000,
  reviewAdverseFixtureMs: 12_000,
  reviewChildResultHarnessMs: 60_000,
});
