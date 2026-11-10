import assert from "node:assert/strict";
import { assessNativeViewportFit, assertNativeViewportFit } from "./operator-native-viewport-fit.mjs";

const request = { width: 390, height: 844, mobile: true, deviceScaleFactor: 1 };
const fitting = { inner_width: 390, inner_height: 844, client_width: 390, client_height: 844,
  scroll_width: 390, scroll_height: 1800, visual_width: 390, visual_height: 844,
  visual_scale: 1, device_pixel_ratio: 1 };
const assess = sample => assessNativeViewportFit(request, sample);
assert.equal(assess(fitting).status, "fit");
assert.equal(assess({ ...fitting, visual_width: 389.99997, visual_height: 843.99997 }).status, "fit");
assert.equal(assess({ ...fitting, scroll_width: 391 }).status, "fit");
assert.equal(assess({ ...fitting, scroll_width: 392 }).status, "document_overflow");
// Client geometry can exclude a scrollbar while innerWidth still establishes
// the requested viewport. These quantities need not all be identical.
assert.equal(assess({ ...fitting, client_width: 375, scroll_width: 375, visual_width: 375 }).status, "fit");
const recorded = { ...fitting, inner_width: 739, inner_height: 1600, scroll_width: 739,
  scroll_height: 5852, visual_width: 739, visual_height: 1599.2718505859375, visual_scale: 0.5277401804924011 };
assert.equal(recorded.scroll_width <= recorded.inner_width + 1, true);
assert.equal(assess(recorded).status, "viewport_mismatch");
const wrongButFitting = { ...fitting, inner_width: 768, inner_height: 1024, client_width: 768,
  client_height: 1024, scroll_width: 768, visual_width: 768, visual_height: 1024 };
assert.equal(assess(wrongButFitting).original_predicate, true);
assert.equal(assess(wrongButFitting).status, "viewport_mismatch");
assert.equal(assess({ ...fitting, visual_scale: 2 }).status, "viewport_mismatch");
assert.equal(assess({ ...fitting, device_pixel_ratio: 2 }).status, "viewport_mismatch");
for (const key of Object.keys(fitting)) {
  for (const value of [undefined, null, NaN, Infinity, -1, 0, "390"]) {
    assert.equal(assess({ ...fitting, [key]: value }).status, "measurement_invalid", `${key}:${value}`);
  }
}
assert.equal(assess(null).status, "measurement_invalid");
for (const change of [{ client_width: 400 }, { client_height: 900 }, { scroll_width: 389 },
  { scroll_height: 843 }, { visual_width: 450 }, { visual_height: 900 }]) {
  assert.equal(assess({ ...fitting, ...change }).status, "measurement_inconsistent");
}
assert.throws(() => assessNativeViewportFit({ ...request, mobile: undefined }, fitting), /request_invalid/u);
assert.throws(() => assessNativeViewportFit({ ...request, deviceScaleFactor: 2 }, fitting), /request_invalid/u);
let calls = 0;
const changing = { evaluateJson: async () => (++calls === 1 ? recorded : fitting) };
let firstFailure;
await assert.rejects(assertNativeViewportFit(changing, request, "recorded-control"), error => {
  firstFailure = error;
  return error.evidence.status === "viewport_mismatch" && error.evidence.actual.scroll_width === 739;
});
assert.equal(calls, 1, "The deciding measurement never waits or retries");
await assertNativeViewportFit(changing, request, "later-independent-control");
assert.equal(firstFailure.evidence.actual.scroll_width, 739);
assert.equal(firstFailure.evidence.status, "viewport_mismatch");
assert(Object.isFrozen(firstFailure.evidence.actual));
console.log(JSON.stringify({ native_viewport_numeric_controls: "pass", recorded_390_739: "rejected",
  missing_invalid_contradictory: "rejected", one_pixel_allowance: "preserved", first_failure: "retained" }));
