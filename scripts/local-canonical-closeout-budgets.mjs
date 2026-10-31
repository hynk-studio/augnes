// Fixed prospective orchestration budgets authorized by #1560 comment 6541370652.
// These apply only to closeout auxiliary controls and their enclosing harnesses;
// product deadlines, intentional timeout scenarios and lifecycle safeguards remain
// owned by their existing registrations. No adaptive extension or retry is added.
export const CLOSEOUT_EXECUTION_BUDGETS = Object.freeze({
  groupMs: 12_000,
  nestedChildMs: 6_000,
  executorHarnessMs: 120_000,
  receiptHarnessMs: 90_000,
  reviewHarnessMs: 180_000,
});

// Fixed auxiliary hierarchy authorized by #1560 comment 6542798089. The older
// closeout table above remains stable for retained proof interpretation. These
// selectors cover orchestration only; deliberate timeout scenarios, product
// registrations, authority validity and lifecycle settlement stay unchanged.
export const AUXILIARY_EXECUTION_BUDGETS = Object.freeze({
  groupMs: 20_000,
  nestedChildMs: 10_000,
  ordinaryChildMs: 10_000,
  reviewHarnessMs: 300_000,
  companionHarnessMs: 240_000,
  timeoutHarnessMs: 180_000,
  conditionHarnessMs: 120_000,
  guideHarnessMs: 150_000,
  observerSuccessionMs: 60_000,
  observerControlsMs: 20_000,
  reviewAcceptanceFixtureMs: 30_000,
  reviewAdverseFixtureMs: 12_000,
  reviewChildResultHarnessMs: 60_000,
});
