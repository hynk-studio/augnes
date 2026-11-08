import assert from "node:assert/strict";

// Real DOM input and genuine production fetch responses. No writer, successful
// payload, Next navigation or browser dialog is substituted here.
export function nativePreparationBrowser({ cdp, evaluate, waitForCondition }) {
  const json = JSON.stringify;
  async function click(selector) {
    await waitForCondition(`!!document.querySelector(${json(selector)})`, selector);
    const point = await evaluate(`(() => { const e=document.querySelector(${json(selector)}); e.scrollIntoView({block:'center',behavior:'instant'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  }
  async function input(selector, text) {
    await click(selector);
    await evaluate(`(() => { const e=document.querySelector(${json(selector)}); e.focus(); e.select(); })()`);
    await cdp.send("Input.insertText", { text });
  }
  async function hold(action, outcome = "return") {
    await evaluate(`(() => {
      const original = window.fetch;
      window.__nativePreparationResponse = { reached:false, released:false };
      window.fetch = async (...args) => {
        const request = args[1];
        let body;
        try { body = typeof request?.body === 'string' ? JSON.parse(request.body) : null; } catch { return original(...args); }
        if (body?.action !== ${json(action)}) return original(...args);
        window.fetch = original;
        const response = await original(...args);
        const gate = window.__nativePreparationResponse;
        gate.status = response.status;
        gate.reached = true;
        await new Promise(resolve => { gate.release = resolve; });
        gate.released = true;
        if (${json(outcome)} === 'lost') throw new TypeError('Controlled loss of a genuine committed response');
        if (${json(outcome)} === 'malformed') return new Response('{', { status:response.status });
        return response;
      };
    })()`);
  }
  const held = () => waitForCondition("window.__nativePreparationResponse?.reached === true", "genuine preparation response held");
  const release = () => evaluate("window.__nativePreparationResponse.release()");
  return { click, input, hold, held, release };
}

export async function checkInitialPreparationResponse(browser, definition) {
  const { evaluate, waitForCondition } = browser;
  const ui = nativePreparationBrowser(browser);
  await ui.input("#first-work-goal", definition.goal);
  await ui.input("#first-work-success-criteria", definition.success_criteria[0]);
  await ui.input("#first-work-non-goals", definition.non_goals[0]);
  assert.equal(await evaluate("document.querySelector('#first-work-goal').value"), definition.goal);
  assert.equal(await evaluate("document.querySelector('#first-work-success-criteria').value"), definition.success_criteria[0]);
  assert.equal(await evaluate("document.querySelector('#first-work-non-goals').value"), definition.non_goals[0]);
  await waitForCondition("!!document.querySelector('[data-first-work-action=save]:not(:disabled)')", "initial save enabled");
  if (browser.checkDeparture) await checkPreparationStay(browser);
  await ui.hold("define_initial_project_work");
  await ui.click('[data-first-work-action="save"]');
  await ui.held();
  const fields = ["#first-work-goal", "#first-work-success-criteria", "#first-work-non-goals"];
  const accepted = [];
  for (const field of fields) {
    const before = await evaluate(`document.querySelector(${JSON.stringify(field)}).value`);
    await ui.input(field, "Later accepted authorship must never disappear");
    accepted.push(await evaluate(`document.querySelector(${JSON.stringify(field)}).value`) !== before);
  }
  await ui.release();
  await waitForCondition("!!document.querySelector('[data-current-work-definition]')", "confirmed initial save");
  const readback = await evaluate(`fetch('/api/vnext/operator/semantic-review',{credentials:'same-origin',cache:'no-store',headers:{'Augnes-Project-Id':${JSON.stringify(browser.projectId)}}}).then(r=>r.json())`);
  assert.ok(readback.work_initialization, JSON.stringify({ status: readback.status, error_code: readback.error_code, accepted_later_input: accepted }));
  assert.deepEqual(readback.work_initialization.current_work, definition);
  console.log(JSON.stringify({ native_initial_response: { accepted_later_input: accepted, committed_definition: readback.work_initialization.current_work,
    editor_closed: await evaluate("!document.querySelector('#first-work-goal')"), actual_input: "Chrome Input events", actual_writer: "define_initial_project_work" } }));
  assert.deepEqual(accepted, [false, false, false], "Pending initial save must prevent all subsequent authoring before closing the editor");
}

const dialogOwners = new WeakMap();
export function preparationDialogs(cdp) {
  const events = [];
  const previous = dialogOwners.get(cdp);
  dialogOwners.set(cdp, events);
  let active = true, pending = null;
  cdp.on(event => {
    if (!active || dialogOwners.get(cdp) !== events || event.method !== "Page.javascriptDialogOpening") return;
    events.push({ type: event.params.type, message: event.params.message });
    const current = pending;
    pending = null;
    void cdp.send("Page.handleJavaScriptDialog", { accept: current?.accept ?? false })
      .then(() => current?.resolve(events.at(-1)), error => current?.reject(error));
  });
  return {
    events,
    async expect(action, accept = false) {
      assert.equal(pending, null);
      let timer;
      const dialog = new Promise((resolve, reject) => {
        pending = { accept, resolve, reject };
        timer = setTimeout(() => { pending = null; reject(new Error("Native departure dialog missing")); }, 10000);
      });
      try {
        const [, event] = await Promise.all([action(), dialog]);
        assert.equal(event.type, "beforeunload");
        return event;
      } finally { clearTimeout(timer); }
    },
    stop() { active = false; if (dialogOwners.get(cdp) === events) dialogOwners.set(cdp, previous); },
  };
}

export async function checkPreparationStay(browser) {
  const { cdp, evaluate } = browser;
  const ui = nativePreparationBrowser(browser), dialogs = preparationDialogs(cdp);
  const snapshot = `(() => { const form=document.querySelector('#first-work form, #work-revision form');
    return { values:[...form.querySelectorAll('input,textarea,select')].map(e=>[e.id,e.value,e.checked]),
      notes:[...form.querySelectorAll('[data-selected-source-action="exclude"]')].map(e=>e.parentElement.textContent),
      details:[...form.querySelectorAll('details')].map(e=>e.open) }; })()`;
  try {
    const before = await evaluate(snapshot);
    const url = await evaluate("location.href");
    await evaluate("void (window.__nativePreparationEditor = document.querySelector('#first-work, #work-revision'))");
    const navigation = await dialogs.expect(() => ui.click('a.product-brand'));
    assert.equal(await evaluate("location.href"), url);
    assert.deepEqual(await evaluate(snapshot), before, "Staying after real Native navigation retains every authored input");
    const reload = await dialogs.expect(() => cdp.send("Page.reload"));
    assert.deepEqual(await evaluate(snapshot), before, "Staying after browser reload retains exact draft and selected material");
    assert.equal(await evaluate("window.__nativePreparationEditor === document.querySelector('#first-work, #work-revision')"), true);
    // Generic browser messages cannot expose private fields after authorization loss.
    for (const value of before.values.flatMap(row => typeof row[1] === "string" && row[1].length > 20 ? [row[1]] : [])) {
      assert(!navigation.message.includes(value) && !reload.message.includes(value));
    }
    console.log(JSON.stringify({ native_preparation_stay: { navigation: navigation.type, reload: reload.type,
      exact_inputs_retained: true, same_editor: true, selected_notes: before.notes.length } }));
  } finally { dialogs.stop(); }
}

export async function checkPreparationPreviewResponse(browser, kind) {
  const { evaluate, waitForCondition } = browser;
  const ui = nativePreparationBrowser(browser);
  const fields = ['#new-work-goal', '#new-work-success-criteria', '#new-work-non-goals', '#selected-note-source',
    '#selected-note-time', '#selected-note-text', '#selected-note-provenance', '#selected-note-kind', 'input[maxlength="500"]'];
  const original = await evaluate("document.querySelector('#new-work-goal').value");
  await ui.hold(kind === "result" ? "preview_result_work" : "preview_new_project_work");
  await waitForCondition("!!document.querySelector('[data-augnes-primary-action=preview-new-work]:not(:disabled)')", "preparation preview enabled after source comparison");
  await ui.click('[data-augnes-primary-action="preview-new-work"]');
  await ui.held();
  for (const selector of fields) {
    if (!await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`)) continue;
    assert.equal(await evaluate(`document.querySelector(${JSON.stringify(selector)}).matches(':disabled')`), true, selector);
  }
  assert.equal(await evaluate("[...document.querySelectorAll('[data-selected-work-sources] button')].every(e=>e.disabled)"), true);
  await ui.input('#new-work-goal', 'This later input cannot be authorized by the older preview');
  assert.equal(await evaluate("document.querySelector('#new-work-goal').value"), original);
  await ui.release();
  const selector = kind === "result" ? '[data-result-work-preview]' : '[data-new-work-preview]';
  await waitForCondition(`!!document.querySelector(${JSON.stringify(selector)})`, "genuine preparation preview");
  assert.equal(await evaluate(`document.querySelector(${JSON.stringify(selector)}).textContent.includes(${JSON.stringify(original)})`), true);
  console.log(JSON.stringify({ native_preparation_preview: { kind, all_authored_fields_locked: true, exact_original_preview: true } }));
}

export async function checkPreparationSaveResponse(browser, kind) {
  const { evaluate, waitForCondition } = browser;
  const ui = nativePreparationBrowser(browser);
  await ui.hold(kind === "result" ? "prepare_result_work" : "prepare_new_project_work");
  await ui.click(kind === "result" ? '[data-result-work-action="save"]' : '[data-new-work-action="save"]');
  await ui.held();
  assert.equal(await evaluate("[...document.querySelectorAll('#work-revision input, #work-revision textarea, #work-revision select')].every(e=>e.matches(':disabled'))"), true);
  const preview = kind === "result" ? '[data-result-work-preview]' : '[data-new-work-preview]';
  assert.equal(await evaluate(`[...document.querySelectorAll('${preview} button')].every(e=>e.disabled)`), true);
  await ui.release();
  await waitForCondition(kind === "result" ? "!!document.querySelector('[data-result-work-saved]')" : "!!document.querySelector('[data-current-work-definition]')", "genuine next-work save");
  console.log(JSON.stringify({ native_preparation_save: { kind, pending_preview_actions_locked: true, actual_writer: true } }));
}

export async function checkPreparationDepartureControls(browser) {
  const { cdp, evaluate, waitForCondition } = browser;
  const ui = nativePreparationBrowser(browser);
  const current = () => evaluate(`fetch('/api/vnext/operator/semantic-review',{credentials:'same-origin',cache:'no-store',headers:{'Augnes-Project-Id':${JSON.stringify(browser.projectId)}}}).then(r=>r.json()).then(r=>r.work_initialization.current_work)`);
  const saved = await current(), url = await evaluate('location.href');
  const ready = () => waitForCondition("!!document.querySelector('[data-work-revision-action=open]')", 'fresh saved work');
  const dialogs = preparationDialogs(cdp);
  try {
    await cdp.send('Page.reload'); await ready();
    assert.equal(dialogs.events.length, 0, 'Confirmed save needs no departure prompt');
    await ui.click('[data-work-revision-action=open]');
    await waitForCondition("!!document.querySelector('#work-revision-goal')", 'clean revision');
    await cdp.send('Page.reload'); await ready();
    assert.equal(dialogs.events.length, 0, 'Clean editor needs no departure prompt');
    await evaluate("[...document.querySelectorAll('button')].find(e=>e.textContent==='Prepare a different task').click()");
    await ui.input('#new-work-goal', 'Undo this edit'); await ui.input('#new-work-goal', '');
    if (await evaluate('!!document.querySelector(\'input[maxlength="500"]\')')) {
      await ui.input('input[maxlength="500"]', 'Undo this reason'); await ui.input('input[maxlength="500"]', '');
    }
    await cdp.send('Page.reload'); await ready();
    assert.equal(dialogs.events.length, 0, 'Exactly undone edits do not leave a redundant warning');
    await evaluate("[...document.querySelectorAll('button')].find(e=>e.textContent==='Prepare a different task').click()");
    await ui.input('#new-work-goal', 'Unsaved different task');
    await ui.input('#new-work-success-criteria', 'Keep this exact preparation on stay');
    // Deliberately leave the selected notes uncarried, retaining an omission
    // reason as well as an unfinished note. Neither may silently enter a save.
    if (await evaluate('!!document.querySelector(\'input[maxlength="500"]\')'))
      await ui.input('input[maxlength="500"]', 'This historical note does not apply');
    await evaluate("document.querySelector('[data-selected-work-sources]').open=true");
    await ui.input('#selected-note-source', 'Unfinished source and revision');
    await ui.input('#selected-note-text', 'Keep the exact unfinished note');
    await checkPreparationStay(browser);
    // Nested stay temporarily owns the dialog handler for the same CDP session.
    const prior = dialogs.events.length;
    await evaluate("document.querySelector('a.product-skip-link').focus()");
    await ui.click('a.product-skip-link');
    assert.equal(dialogs.events.length, prior, 'Same-document navigation is harmless');
    assert.equal(await evaluate("document.querySelector('#new-work-goal').value"), 'Unsaved different task');
    await ui.click('[data-work-revision-action=cancel]');
    await cdp.send('Page.reload'); await ready();
    assert.equal(dialogs.events.length, prior, 'Explicit discard needs no redundant prompt');
    assert.deepEqual(await current(), saved);
    await ui.click('[data-work-revision-action=open]');
    await ui.input('#work-revision-goal', 'Unsaved reload discard');
    await dialogs.expect(() => cdp.send('Page.reload'), true); await ready();
    assert.deepEqual(await current(), saved, 'Deliberate reload discards only the unsaved editor');
    await ui.click('[data-work-revision-action=open]');
    const committed = { ...saved, goal: saved.goal + ' — committed before deliberate departure' };
    await ui.input('#work-revision-goal', committed.goal);
    await ui.hold('revise_pre_execution_project_work');
    await ui.click('[data-work-revision-action=save]'); await ui.held();
    assert.deepEqual(await current(), committed, 'The held response belongs to an actual committed revision');
    await dialogs.expect(() => ui.click('a.product-brand'), true);
    await waitForCondition("location.pathname === '/' && !document.querySelector('#work-revision-goal')", 'deliberate Native departure');
    await cdp.send('Page.navigate', { url }); await ready();
    assert.deepEqual(await current(), committed, 'Leaving did not cancel or roll back the pending acknowledgement');
    console.log(JSON.stringify({ native_preparation_departure: { clean_editor_no_prompt: true, confirmed_save_no_prompt: true,
      harmless_anchor_no_prompt: true, explicit_discard_no_prompt: true, real_reload_discard: true,
      pending_response_native_leave: true, fresh_committed_readback: committed } }));
  } finally { dialogs.stop(); }
}
