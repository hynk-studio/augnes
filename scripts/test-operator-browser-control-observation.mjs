import assert from "node:assert/strict";
import vm from "node:vm";
import { createBrowserControlObservation } from "./operator-browser-control-observation.mjs";
import { saveBrowserExpectation } from "./operator-work-expectation-browser-actions-v1.mjs";

class HTMLElement {
  tagName = "BUTTON"; isConnected = true; disabled = false; width = 1;
  getBoundingClientRect() { return { width: this.width }; }
  click() { this.clicked = true; }
  dispatchEvent(event) { (this.events ??= []).push(event.type); }
}
class HTMLDetailsElement extends HTMLElement { open = false; }
class HTMLInputElement extends HTMLElement { type = "text"; set value(value) { this.saved = value; } }
class HTMLTextAreaElement extends HTMLInputElement {}
class HTMLSelectElement extends HTMLInputElement {}
const panel = new HTMLDetailsElement(), control = new HTMLElement();
control.parentElement = panel;
const nodes = new Map([["#control", [control]]]);
const rows = [];
const observe = createBrowserControlObservation({
  evaluate: async expression => vm.runInNewContext(expression, {
    HTMLElement, HTMLDetailsElement, HTMLInputElement, HTMLTextAreaElement, HTMLSelectElement,
    Event: class { constructor(type) { this.type = type; } },
    document: { querySelectorAll: selector => nodes.get(selector) ?? [],
      querySelector: selector => selector.includes("preparation") ? panel : null },
  }), emit: row => rows.push(JSON.parse(row.slice(row.indexOf("{") ))),
});
control.width = 0;
await assert.rejects(observe({ selector: "#control", kind: "click", scope: "changed-work.refresh" }), /operator_control_failed:1:changed-work.refresh:#control/u);
assert.equal(control.clicked, undefined);
assert.deepEqual([rows.at(-1).facts.closed_details, rows.at(-1).facts.visible, rows.at(-1).facts.preparation_open], [1, false, false]);
await assert.rejects(observe({ selector: "#missing", kind: "set_value", value: "secret-value" }), /operator_control_failed/u);
panel.open = true; control.width = 10;
await observe({ selector: "#control", kind: "click" });
assert.equal(control.clicked, true);
const input = new HTMLInputElement(); nodes.set("#control", [input]);
await observe({ selector: "#control", kind: "set_value", value: "secret-value" });
assert.equal(input.saved, "secret-value"); assert.deepEqual(input.events, ["input", "change"]);
assert.equal(JSON.stringify(rows).includes("secret-value"), false);
assert.equal(JSON.stringify(rows).includes(process.cwd()), false);
assert.ok(rows.at(-1).call_sites.every(site => /^scripts\/[\w.-]+:\d+:\d+$/u.test(site)));
await assert.rejects(observe({ selector: "#control\nsecret", kind: "inspect" }), /match/u);
for (let i = 0; i < 300; i++) await observe({ selector: "#control", kind: "set_value", value: "last" });
assert.equal(input.saved, "last");
assert.equal(rows.filter(row => row.stage === "retention_limit").length, 1);
assert.equal(rows.filter(row => row.stage === "finish").length, 256);

// The actual action owner must wait for a usable control, while retaining the
// changed-work assertions. This structural scheduler is not a Browser witness.
async function expectationControl(stuck = false) {
  const form = new HTMLDetailsElement(), refresh = new HTMLElement(), review = new HTMLElement(), save = new HTMLElement();
  refresh.width = 0; review.width = 0; save.disabled = true;
  const reason = new HTMLInputElement(); reason.width = 0;
  const selected = new Map([
    ['[data-work-expectation="preparation"]', form], ['#expectation-reason', reason],
    ['[data-expectation-draft-conflict]', { textContent: 'Original task: before; Current task: after' }],
    ...[['refresh', refresh], ['review', review], ['save', save]].map(([name, node]) => [`[data-expectation-action="${name}"]`, node]),
  ]);
  const evaluated = expression => vm.runInNewContext(expression, { HTMLButtonElement: HTMLElement, document: { querySelector: selector => selected.get(selector) ?? null } });
  const calls = [], waits = [];
  const lifecycle = {
    evaluateBoolean: async expression => evaluated(expression),
    async waitForCondition(expression, label) {
      for (let tick = 0; tick < 3; tick++) {
        if (evaluated(expression)) { waits.push({ label, tick }); return; }
        if (!stuck) {
          if (form.open) reason.width = 1;
          if (!refresh.clicked) refresh.width = 1;
          else review.width = 1;
        }
      }
      throw Error('bounded structural condition unavailable');
    },
    async clickVisibleControl(selector) {
      const control = selected.get(selector);
      assert.ok(control.width > 0 && !control.disabled && form.open);
      calls.push(selector); control.click();
      if (control === review) { selected.delete('[data-expectation-draft-conflict]'); save.disabled = false; }
      if (control === save) selected.set('[data-expectation-history="1"]', {});
    },
    async setFormControlValue() { assert.equal(selected.has('[data-expectation-draft-conflict]'), false); },
    async observeControl() {},
  };
  await saveBrowserExpectation(lifecycle, 'prediction', 'reason', { previousGoal: 'before', currentGoal: 'after' });
  assert.deepEqual(calls, ['refresh', 'review', 'save'].map(name => `[data-expectation-action="${name}"]`));
  assert.ok(waits.some(value => value.tick > 0));
}
await expectationControl();
await assert.rejects(expectationControl(true), /bounded structural condition unavailable/u);
console.log("operator browser control observations: hidden/missing/actual click/setter, bounded readiness, changed-work assertions and sanitized attribution PASS");
