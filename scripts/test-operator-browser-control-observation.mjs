import assert from "node:assert/strict";
import vm from "node:vm";
import { createBrowserControlObservation } from "./operator-browser-control-observation.mjs";

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
console.log("operator browser control observations: hidden/missing/actual click/setter and sanitized attribution PASS");
