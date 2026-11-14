import assert from "node:assert/strict";

// Only structural facts leave the disposable page. Never collect values,
// text, markup, URLs, errors or application identifiers from a control.
export function createBrowserControlObservation({ evaluate, emit = console.log }) {
  let sequence = 0;
  return async ({ selector, kind, value, index = 0, scope = "control" }) => {
    assert.match(selector, /^[\w #.[\]="':>_-]{1,180}$/u);
    assert.match(scope, /^[\w.-]{1,80}$/u);
    assert.ok(["click", "set_value", "inspect"].includes(kind));
    assert.ok(Number.isSafeInteger(index) && index >= 0);
    sequence++;
    // A full diagnostic buffer cannot change the Browser workload's outcome.
    const retain = sequence <= 256;
    if (sequence === 257) emit('[operator-browser-control] {"stage":"retention_limit","subsequent_observations":"omitted"}');
    const call_sites = (new Error().stack ?? "").split("\n").flatMap(line => {
      const match = line.match(/\/scripts\/([\w.-]+\.[cm]?[jt]s):(\d+):(\d+)/u);
      return match ? [`scripts/${match[1]}:${match[2]}:${match[3]}`] : [];
    }).slice(1, 4);
    const identity = { operation: sequence, kind, scope, selector, call_sites };
    if (retain) emit(`[operator-browser-control] ${JSON.stringify({ ...identity, stage: "start" })}`);
    const result = await evaluate(`(() => {
      const controls = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
      const visible = element => element.getBoundingClientRect().width > 0;
      const selected = ${kind === "click" ? "controls.find(visible)" : `controls[${index}]`};
      const element = selected ?? controls[${index}];
      const ancestors = []; for (let node = element?.parentElement; node; node = node.parentElement) {
        if (node instanceof HTMLDetailsElement) ancestors.push(node.open);
      }
      const preparation = document.querySelector('[data-work-expectation="preparation"]');
      const formControl = selected instanceof HTMLInputElement || selected instanceof HTMLTextAreaElement || selected instanceof HTMLSelectElement;
      const setter = formControl ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(selected), 'value')?.set : null;
      const facts = { count: controls.length, selected: Boolean(selected), tag: element?.tagName ?? null,
        type: element instanceof HTMLInputElement ? element.type : null,
        visible: Boolean(element && visible(element)), disabled: element ? Boolean(element.disabled) : null,
        connected: element?.isConnected ?? false, closed_details: ancestors.filter(open => !open).length,
        preparation_open: preparation instanceof HTMLDetailsElement ? preparation.open : null,
        review_required: Boolean(document.querySelector('[data-expectation-draft-conflict]')),
        setter_available: Boolean(setter) };
      let performed = false;
      ${kind === "click" ? "if (selected instanceof HTMLElement) { selected.click(); performed = true; }" : kind === "set_value" ? `if (formControl) { setter?.call(selected, ${JSON.stringify(value)}); selected.dispatchEvent(new Event('input', { bubbles: true })); selected.dispatchEvent(new Event('change', { bubbles: true })); performed = true; }` : "performed = true;"}
      return { facts, performed };
    })()`);
    if (retain) emit(`[operator-browser-control] ${JSON.stringify({ ...identity, stage: "finish", ...result })}`);
    assert.equal(result?.performed, true, `operator_control_failed:${sequence}:${scope}:${selector}`);
    return result.facts;
  };
}
