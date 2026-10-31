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
