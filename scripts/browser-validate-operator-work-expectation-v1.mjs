#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { runOperatorExecutionBrowserChildV1 } from "./operator-execution-browser-child-v1.mjs";
import {
  activateProject,
  openProjectOptions,
  clickSelector,
  saveBrowserExpectation,
  reportBrowserExpectation,
} from "./operator-work-expectation-browser-actions-v1.mjs";

const Database = createRequire(import.meta.url)("better-sqlite3");

await runOperatorExecutionBrowserChildV1({
  child_id: "operator-work-expectation",
  prepare: async ({ fixture }) => ({ project_id: fixture.manifest.expectation_project_id }),
  console_allowlist: entry => entry.phase === "work_expectation_recording" && (
    (entry.request_path === "/api/vnext/operator/session" && entry.response_status === 401 && entry.text === "Failed to load resource: the server responded with a status of 401 (Unauthorized)") ||
    (entry.request_path === "/favicon.ico" && entry.response_status === 404 && entry.text === "Failed to load resource: the server responded with a status of 404 (Not Found)")
  ),
  request_failure_allowlist: entry => entry.phase === "work_expectation_recording" && entry.error_text === "net::ERR_ABORTED" && entry.method === "GET" && entry.path === "/api/augnes/read/guide-brief" && entry.request_type === "Fetch" && entry.response_status === null,
  execute: async ({ fixture, lifecycle, result, detailed_field_owner: completeDetailedField }) => {
    const appOrigin = lifecycle.app_origin;
    const initial = readExpectationState(fixture.writable_database_path, fixture.manifest.expectation_project_id);
    assert.equal(initial.runs, 0);
    assert.equal(initial.receipts.length, 0);
    assert.equal(initial.expectations, 0, "The child begins without a forecast or outcome in its own project");
    await lifecycle.runPhase("work_expectation_recording", async () => {
      await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
      assert.equal(await lifecycle.authenticate(), true);
      await lifecycle.waitForCondition(`document.querySelector('[data-first-work-composer]') !== null`, "expectation fixture first work");
      await lifecycle.setFormControlValue('#first-work-goal', 'Inspect the exact disposable result');
      await lifecycle.setFormControlValue('#first-work-success-criteria', 'The result establishes the requested criterion');
      await clickSelector(lifecycle, '[data-first-work-action="save"]');
      await lifecycle.waitForCondition(`document.querySelector('[data-current-work-definition]') !== null`, "expectation work prepared");
      await saveBrowserExpectation(lifecycle, "unsatisfied", "P32_FORECAST_ONLY_RESULT");
      const prospective = (await readProtectedJson(lifecycle, '/api/vnext/operator/work-expectations')).history;
      assert.equal(prospective.length, 1);
      assert.equal(readExpectationState(fixture.writable_database_path, fixture.manifest.expectation_project_id).runs, 0);
      await lifecycle.navigate(`${appOrigin}/workbench/semantic-review?expectation-reload=1`);
      await lifecycle.waitForCondition(`document.querySelector('[data-work-expectation="preparation"]') !== null`, "reloaded expectation preparation");
      await lifecycle.evaluateBoolean(`(() => { document.querySelector('[data-work-expectation="preparation"]').open = true; return true; })()`);
      await lifecycle.waitForCondition(`document.querySelector('[data-expectation-history="1"]')?.textContent.includes('P32_FORECAST_ONLY_RESULT') === true`, "saved expectation survived reload");
      await lifecycle.navigate(`${appOrigin}/projects/${encodeURIComponent(fixture.manifest.expectation_project_id)}`);
      await lifecycle.waitForCondition(`document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"][data-blank-state-project-management-hydrated="true"]') !== null`, "hydrated expectation Project Home");
      await openProjectOptions(lifecycle);
      await clickSelector(lifecycle, '[data-direct-host-action="deterministic"]');
      await lifecycle.waitForCondition(`document.querySelector('[data-direct-host-round-trip-status="completed"]') !== null`, "normal deterministic attempt completed");
      const completedState = readExpectationState(fixture.writable_database_path, fixture.manifest.expectation_project_id);
      assert.equal(completedState.receipts.length, 1);
      const completedReceipt = completedState.receipts[0];
      assert(completedReceipt);
      const resultUrl = `${appOrigin}/workbench/results/${completedReceipt.receipt_id.replace(":", "~")}`;
      await lifecycle.navigate(resultUrl);
      await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="unassessed"]') !== null`, "normal result consumer has original expectation");
      assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-expectation-comparison="unassessed"]').getBoundingClientRect().height > 0`), true, "The comparison is visible in normal result review");
      await reportBrowserExpectation(lifecycle, "unsatisfied", "This exact result did not establish the criterion.");
      await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="match"]') !== null`, "expected criterion failure matches without task success");
      assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-task-success-status="satisfied"]') === null`), true);
      await reportBrowserExpectation(lifecycle, "satisfied", "Correction: the operator now attests that the criterion was met.");
      await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="mismatch"]') !== null`, "report correction preserves expectation and changes comparison");
      const comparison = (await readProtectedJson(lifecycle, '/api/vnext/operator/run-results?' + new URLSearchParams({ receipt_ref: completedReceipt.receipt_id }))).result.expectation;
      assert.deepEqual(comparison.expectation, prospective[0], "Outcome reports preserve the original prospective record");
      assert.equal(comparison.attempt.run_id, completedReceipt.run_id);
      assert.equal(comparison.expectation.packet_ref.external_id, completedReceipt.task_context_packet_ref.external_id);
      assert.equal(comparison.expectation.packet_ref.source_ref, completedReceipt.task_context_packet_ref.source_ref);
      assert.equal(comparison.reports.length, 2);
      assert.equal(comparison.reports[1].previous_ref.external_id, comparison.reports[0].record_id);
      await lifecycle.navigate(resultUrl + '?expectation-reload=1');
      await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="mismatch"]') !== null && document.body.textContent.includes('corrections (2)')`, "comparison and report history survived reload");
      const sourceHref = await lifecycle.evaluateString(`document.querySelector('[data-expectation-source="packet"]').getAttribute('href')`);
      await lifecycle.navigate(new URL(sourceHref, appOrigin).toString());
      await lifecycle.waitForCondition(`document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="task_context_packet"]') !== null`, "expectation exact source navigation");
      await lifecycle.navigate(resultUrl);
      await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="mismatch"]') !== null`, "return to original comparison");
      for (const width of [390, 768, 1280]) {
        await lifecycle.cdp().send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width === 390 });
        assert.equal(await lifecycle.evaluateBoolean(`document.documentElement.scrollWidth <= window.innerWidth`), true, `expectation viewport ${width}`);
      }
      await lifecycle.cdp().send('Emulation.clearDeviceMetricsOverride');
      await lifecycle.navigate('about:blank');
      await lifecycle.terminateRuntime();
      await lifecycle.restartRuntimePreservingBrowserSession(fixture.manifest.expectation_project_id);
      await lifecycle.navigate(resultUrl);
      await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="mismatch"]') !== null`, "comparison survives runtime restart");
      await exerciseSavedSuccessorExpectation(fixture, lifecycle);
      result.work_expectation_preparation_result_reload_source = true;
      completeDetailedField('work_expectation_preparation_result_reload_source');
      await lifecycle.navigate(`${appOrigin}/projects/${encodeURIComponent(fixture.manifest.project_id)}`);
      await lifecycle.waitForCondition(`document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="false"][data-blank-state-project-management-hydrated="true"]') !== null`, "normal project selection is available");
      await activateProject(lifecycle);
      assert.equal(await lifecycle.evaluateBoolean(`!document.body.textContent.includes('P32_FORECAST_ONLY_RESULT') && document.querySelector('[data-expectation-comparison]') === null`), true, "Normal project activation leaves no other work's expectation on screen");
      await lifecycle.navigate('about:blank');
      await lifecycle.terminateRuntime();
      await lifecycle.restartRuntime(fixture.manifest.project_id);
      await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
      assert.equal(await lifecycle.authenticate(), true);
      await lifecycle.waitForCondition(`document.querySelector('[data-current-work-definition]') !== null`, "primary project after expectation selection");
      assert.equal(await lifecycle.evaluateBoolean(`!document.body.textContent.includes('P32_FORECAST_ONLY_RESULT') && document.querySelector('[data-expectation-comparison]') === null`), true);
      result.work_expectation_selection_isolated = true;
      completeDetailedField('work_expectation_selection_isolated');
      // Both child-local bootstraps checked token absence in the DOM and log.
      result.credential_private_material_boundary = true;
    });
  },
});

async function exerciseSavedSuccessorExpectation(fixture, lifecycle) {
  const appOrigin = lifecycle.app_origin;
  const projectId = fixture.manifest.expectation_project_id;
  const initial = readExpectationState(fixture.writable_database_path, projectId);
  const aReceipt = initial.receipts[0];
  const resultUrl = `${appOrigin}/workbench/results/${aReceipt.receipt_id.replace(":", "~")}`;
  await lifecycle.navigate(resultUrl);
  await lifecycle.waitForCondition(`document.querySelector('[data-result-work-action="open"]') !== null`, 'settled A can prepare ordinary B');
  await clickSelector(lifecycle, '[data-result-work-action="open"]');
  await lifecycle.waitForCondition(`document.querySelector('#new-work-goal') !== null`, 'ordinary successor composer');
  await lifecycle.setFormControlValue('#new-work-goal', 'Inspect the cold observation');
  await lifecycle.setFormControlValue('#new-work-success-criteria', 'The cold condition is established');
  await lifecycle.setFormControlValue('#new-work-non-goals', 'Do not infer warm behavior');
  await lifecycle.evaluateBoolean(`(() => { document.querySelector('[data-selected-work-sources]').open = true; return true; })()`);
  await clickSelector(lifecycle, '[data-selected-source-action="compare"]');
  await lifecycle.waitForCondition(`document.querySelector('[data-selected-work-sources] [role="status"]')?.textContent.includes('0 selected')`, 'explicit empty selection');
  await clickSelector(lifecycle, '[data-augnes-primary-action="preview-new-work"]');
  await lifecycle.waitForCondition(`document.querySelector('[data-result-work-preview]') !== null`, 'ordinary B preview');
  await clickSelector(lifecycle, '[data-result-work-action="save"]');
  await lifecycle.waitForCondition(`document.querySelector('[data-result-work-saved]') !== null`, 'ordinary B saved');
  await clickSelector(lifecycle, '[data-result-work-saved] a');
  await lifecycle.waitForCondition(`document.querySelector('[data-current-work-goal]')?.textContent === 'Inspect the cold observation'`, 'saved B fresh Browser read');
  await lifecycle.navigate(`${appOrigin}/workbench/semantic-review?successor-expectation=reopen`);
  await saveBrowserExpectation(lifecycle, 'satisfied', 'P33_B_FORECAST_ONLY');
  const bForecast = (await readProtectedJson(lifecycle, '/api/vnext/operator/work-expectations')).history[0];
  await clickSelector(lifecycle, '[data-work-revision-action="open"]');
  await lifecycle.waitForCondition(`document.querySelector('#work-revision-goal') !== null`, 'reopen saved B');
  await lifecycle.setFormControlValue('#work-revision-goal', 'Inspect the cold observation with its uncertainty');
  await clickSelector(lifecycle, '[data-augnes-primary-action="save-work-revision"]');
  await lifecycle.waitForCondition(`document.querySelector('#work-revision-goal') === null`, 'definition-only B1 saved');
  assert.equal((await readProtectedJson(lifecycle, '/api/vnext/operator/work-expectations')).history.length, 0, 'B prediction did not transfer to B1');
  await saveBrowserExpectation(lifecycle, 'satisfied', 'P33_B1_FORECAST_ONLY');
  const b1Forecast = (await readProtectedJson(lifecycle, '/api/vnext/operator/work-expectations')).history[0];
  await clickSelector(lifecycle, '[data-work-revision-action="open"]');
  await lifecycle.waitForCondition(`document.querySelector('#work-revision-goal') !== null`, 'reopen saved B1');
  await lifecycle.evaluateBoolean(`(() => { document.querySelector('[data-selected-work-sources]').open = true; return true; })()`);
  await lifecycle.setFormControlValue('#selected-note-source', 'Explicit correction');
  await lifecycle.setFormControlValue('#selected-note-provenance', 'user_declaration');
  await lifecycle.setFormControlValue('#selected-note-kind', 'Changed assumption / user correction');
  await lifecycle.setFormControlValue('#selected-note-text', 'Cold observations do not establish warm behavior. Warm remains unknown.');
  await clickSelector(lifecycle, '[data-selected-source-action="add"]');
  await clickSelector(lifecycle, '[data-selected-source-action="compare"]');
  await lifecycle.waitForCondition(`document.querySelector('[data-selected-work-sources] [role="status"]')?.textContent.includes('1 selected')`, 'note-only B2 comparison');
  await clickSelector(lifecycle, '[data-augnes-primary-action="save-work-revision"]');
  await lifecycle.waitForCondition(`document.querySelector('#work-revision-goal') === null`, 'note-only B2 saved');
  assert.equal((await readProtectedJson(lifecycle, '/api/vnext/operator/work-expectations')).history.length, 0, 'B1 prediction did not transfer to B2');
  await lifecycle.navigate(`${appOrigin}/workbench/semantic-review?successor-expectation=final`);
  await saveBrowserExpectation(lifecycle, 'unsatisfied', 'P33_B2_FORECAST_ONLY');
  const finalForecast = (await readProtectedJson(lifecycle, '/api/vnext/operator/work-expectations')).history[0];
  assert.notEqual(finalForecast.packet_ref.external_id, bForecast.packet_ref.external_id);
  assert.notEqual(finalForecast.packet_ref.external_id, b1Forecast.packet_ref.external_id);
  assert.equal(readExpectationState(fixture.writable_database_path, projectId).runs, 1, 'Authoring and revision create no execution');
  await lifecycle.navigate(`${appOrigin}/projects/${encodeURIComponent(projectId)}`);
  await lifecycle.waitForCondition(`document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"][data-blank-state-project-management-hydrated="true"]') !== null`, 'hydrated B2 Project Home');
  await openProjectOptions(lifecycle);
  await clickSelector(lifecycle, '[data-direct-host-action="deterministic"]');
  await lifecycle.waitForCondition(`document.querySelector('[data-direct-host-round-trip-status="completed"], [data-direct-host-round-trip-status="error"]') !== null`, 'normal B2 deterministic execution');
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-direct-host-round-trip-status="completed"]') !== null`), true,
    await lifecycle.evaluateString(`document.querySelector('[data-direct-host-round-trip-status="error"] [role="alert"]')?.textContent ?? 'B2 execution did not complete'`));
  const state = readExpectationState(fixture.writable_database_path, projectId);
  assert.equal(state.receipts.length, 2);
  const receipt = state.receipts.find(r => r.task_context_packet_ref.external_id === finalForecast.packet_ref.external_id);
  assert(receipt);
  const bResultUrl = `${appOrigin}/workbench/results/${receipt.receipt_id.replace(":", "~")}`;
  await lifecycle.navigate(bResultUrl);
  await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="unassessed"]') !== null`, 'B2 result reads exact prospective binding');
  await reportBrowserExpectation(lifecycle, 'unsatisfied', 'The bounded observation did not establish the cold criterion.');
  await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="match"]') !== null`, 'B2 prediction matches reported failure');
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-task-success-status="satisfied"]') === null`), true);
  await reportBrowserExpectation(lifecycle, 'unknown', 'Correction: the observation is incomplete.');
  await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="unknown"]') !== null`, 'B2 correction preserves unknown');
  const comparison = (await readProtectedJson(lifecycle, '/api/vnext/operator/run-results?' + new URLSearchParams({ receipt_ref: receipt.receipt_id }))).result.expectation;
  assert.deepEqual(comparison.expectation, finalForecast); assert.equal(comparison.attempt.run_id, receipt.run_id);
  assert.equal(comparison.attempt.chronology, 'same_transaction_as_first_local_interactive_ordinary_preparation_attempt.v0.1');
  assert.equal(comparison.history.length, 1); assert.equal(comparison.reports.length, 2);
  await lifecycle.navigate('about:blank'); await lifecycle.terminateRuntime();
  await lifecycle.restartRuntimePreservingBrowserSession(projectId);
  await lifecycle.navigate(bResultUrl);
  await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="unknown"]') !== null && document.body.textContent.includes('P33_B2_FORECAST_ONLY')`, 'B2 binding and comparison survive restart');
  for (const width of [390, 768, 1280]) {
    await lifecycle.cdp().send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width === 390 });
    assert.equal(await lifecycle.evaluateBoolean(`document.documentElement.scrollWidth <= window.innerWidth`), true, `successor expectation viewport ${width}`);
  }
  await lifecycle.cdp().send('Emulation.clearDeviceMetricsOverride');
  console.log(JSON.stringify({ saved_successor_expectation_ui: 'pass', revisions: ['definition', 'note'], silent_transfer: false, actual_attempt_bound: true, restart_comparison: 'unknown' }));
}

async function readProtectedJson(lifecycle, route) {
  return lifecycle.evaluateJson(`(async () => {
    const response = await fetch(${JSON.stringify(route)}, { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error('protected expectation read refused');
    return response.json();
  })()`);
}

function readExpectationState(databasePath, projectId) {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    return {
      runs: db.prepare("SELECT COUNT(*) AS count FROM autonomy_runs WHERE scope = ?").get(projectId).count,
      expectations: db.prepare("SELECT COUNT(*) AS count FROM vnext_core_records WHERE project_id = ? AND record_kind = 'work_expectation_record'").get(projectId).count,
      receipts: db.prepare("SELECT payload_json FROM vnext_core_records WHERE project_id = ? AND record_kind = 'run_receipt' ORDER BY created_at, record_id").all(projectId).map(row => JSON.parse(row.payload_json)),
    };
  } finally { db.close(); }
}
