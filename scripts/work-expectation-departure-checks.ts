import assert from "node:assert/strict";
import { acceptWorkPreparationFields, hasUnsavedWorkPreparation, observeWorkPreparationField, trackWorkPreparation } from "../components/workbench/semantic-review/work-preparation-departure";

export function assertOptionalExpectationDeparture() {
  const initial = { expectationCriterion: "A", expectationPrediction: "satisfied", expectationReason: "", expectationConditions: "",
    reportOutcome: "unknown", reportObservation: "", reportApplied: false };
  const draft = new Map<string, unknown>(Object.entries(initial));
  trackWorkPreparation(draft);
  for (const [key, value] of draft) observeWorkPreparationField(draft, key, value);
  assert.equal(hasUnsavedWorkPreparation(draft), false, "Opening pristine optional editors needs no prompt");
  for (const [key, value] of Object.entries({ expectationCriterion: "B", expectationPrediction: "unsatisfied", expectationReason: "Reason", expectationConditions: "Conditions",
    reportOutcome: "satisfied", reportObservation: "Observation", reportApplied: true })) {
    draft.set(key, value);
    assert.equal(hasUnsavedWorkPreparation(draft), true, `${key} alone is meaningful authorship`);
    draft.set(key, initial[key as keyof typeof initial]);
    assert.equal(hasUnsavedWorkPreparation(draft), false, `${key}: exactly undoing the edit is clean`);
  }
  const submitted = { expectationCriterion: "A", expectationPrediction: "unsatisfied", expectationReason: "Submitted", expectationConditions: "Observed" };
  for (const [key, value] of Object.entries(submitted)) draft.set(key, value);
  draft.set("expectationPrediction", "satisfied");
  acceptWorkPreparationFields(draft, submitted);
  assert.equal(hasUnsavedWorkPreparation(draft), true, "A successful pending POST cannot accept a later selector edit");
  draft.set("expectationPrediction", "unsatisfied");
  assert.equal(hasUnsavedWorkPreparation(draft), false, "Returning to the confirmed submitted values is clean");
  const cleared = { ...submitted, expectationReason: "", expectationConditions: "" };
  for (const [key, value] of Object.entries(cleared)) draft.set(key, value);
  acceptWorkPreparationFields(draft, cleared);
  assert.equal(hasUnsavedWorkPreparation(draft), false, "Normal save clears text and accepts retained selectors");
  const report = { reportOutcome: "satisfied", reportObservation: "Saved observation", reportApplied: true };
  for (const [key, value] of Object.entries(report)) draft.set(key, value);
  draft.set("reportApplied", false);
  acceptWorkPreparationFields(draft, report);
  assert.equal(hasUnsavedWorkPreparation(draft), true, "A successful history refresh cannot accept a later checkbox edit");
  draft.set("reportObservation", "");
  acceptWorkPreparationFields(draft, { ...report, reportObservation: "", reportApplied: false });
  assert.equal(hasUnsavedWorkPreparation(draft), false, "A confirmed normal report is clean");
  console.log("Optional forecast/report departure: pristine, seven authored fields, exact undo, pending selector/checkbox and confirmed-save baselines passed");
}
