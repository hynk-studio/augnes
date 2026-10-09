#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { canonicalizeProtocolValueV01 } from "../lib/vnext/protocol-primitives";
import { runOperatorExecutionBrowserChildV1 } from "./operator-execution-browser-child-v1.mjs";
import {
  activateProject,
  openProjectOptions,
  clickSelector,
  saveBrowserExpectation,
  reportBrowserExpectation,
} from "./operator-work-expectation-browser-actions-v1.mjs";

const Database = createRequire(import.meta.url)("better-sqlite3");
let expectedCapacityRefusal = null;
let capacityConsoleDeliveries = 0;

await runOperatorExecutionBrowserChildV1({
  child_id: "operator-work-expectation",
  prepare: async ({ fixture }) => ({ project_id: fixture.manifest.expectation_project_id }),
  console_allowlist: entry => entry.phase === "work_expectation_recording" && (
    (entry.request_path === "/api/vnext/operator/session" && entry.response_status === 401 && entry.text === "Failed to load resource: the server responded with a status of 401 (Unauthorized)") ||
    (entry.request_path === "/favicon.ico" && entry.response_status === 404 && entry.text === "Failed to load resource: the server responded with a status of 404 (Not Found)") ||
    (expectedCapacityRefusal !== null && entry.network_request_id === expectedCapacityRefusal && entry.request_path === "/api/vnext/operator/project-continuity" &&
      entry.response_status === 422 &&
      entry.text === "Failed to load resource: the server responded with a status of 422 (Unprocessable Entity)" && ++capacityConsoleDeliveries === 1)
  ),
  console_allowlist_finalize: () => { assert.notEqual(expectedCapacityRefusal, null); assert.equal(capacityConsoleDeliveries, 1); },
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
      const prospective = (await readProtectedJson(lifecycle, fixture.manifest.expectation_project_id, '/api/vnext/operator/work-expectations')).history;
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
      const resultUrl = `${appOrigin}/workbench/results/${completedReceipt.receipt_id.replace(":", "~")}?project_id=${encodeURIComponent(fixture.manifest.expectation_project_id)}`;
      await lifecycle.navigate(resultUrl);
      await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="unassessed"]') !== null`, "normal result consumer has original expectation");
      assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-expectation-comparison="unassessed"]').getBoundingClientRect().height > 0`), true, "The comparison is visible in normal result review");
      await reportBrowserExpectation(lifecycle, "unsatisfied", "This exact result did not establish the criterion.");
      await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="match"]') !== null`, "expected criterion failure matches without task success");
      assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-task-success-status="satisfied"]') === null`), true);
      await reportBrowserExpectation(lifecycle, "satisfied", "R2_REPORT_ONLY_RESELECT: Correction: the operator now attests that the criterion was met.");
      await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="mismatch"]') !== null`, "report correction preserves expectation and changes comparison");
      const comparison = (await readProtectedJson(lifecycle, fixture.manifest.expectation_project_id, '/api/vnext/operator/run-results?' + new URLSearchParams({ receipt_ref: completedReceipt.receipt_id }))).result.expectation;
      assert.deepEqual(comparison.expectation, prospective[0], "Outcome reports preserve the original prospective record");
      assert.equal(comparison.attempt.run_id, completedReceipt.run_id);
      assert.equal(comparison.expectation.packet_ref.external_id, completedReceipt.task_context_packet_ref.external_id);
      assert.equal(comparison.expectation.packet_ref.source_ref, completedReceipt.task_context_packet_ref.source_ref);
      assert.equal(comparison.reports.length, 2);
      assert.equal(comparison.reports[1].previous_ref.external_id, comparison.reports[0].record_id);
      await lifecycle.navigate(resultUrl + '&expectation-reload=1');
      await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="mismatch"]') !== null && document.body.textContent.includes('corrections (2)')`, "comparison and report history survived reload");
      const sourceHref = await lifecycle.evaluateString(`document.querySelector('[data-expectation-source="packet"]').getAttribute('href')`);
      const sourceUrl = new URL(sourceHref, appOrigin);
      assert.equal(sourceUrl.pathname, "/workbench/inspector");
      assert.deepEqual(sourceUrl.searchParams.getAll("project_id"), [fixture.manifest.expectation_project_id]);
      assert.equal(sourceUrl.searchParams.get("target"), "task_context_packet");
      await lifecycle.navigate(sourceUrl.toString());
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
  const resultUrl = `${appOrigin}/workbench/results/${aReceipt.receipt_id.replace(":", "~")}?project_id=${encodeURIComponent(projectId)}`;
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
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-reviewed-outcome-source]')?.textContent.includes('Correction: the operator now attests that the criterion was met.') === true`), true, 'Latest R2 is offered without retyping');
  await clickSelector(lifecycle, '[data-reviewed-outcome-action="select"]');
  await clickSelector(lifecycle, '[data-selected-source-action="compare"]');
  await lifecycle.waitForCondition(`document.querySelector('[data-selected-work-sources] [role="status"]')?.textContent.includes('2 selected')`, 'explicit report and original conditions selection');
  await clickSelector(lifecycle, '[data-reviewed-outcome-action="author"]');
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('#selected-note-source').value.startsWith('New authored note based on ')`), true, 'Edited reuse is authored material, not an unchanged saved report');
  await lifecycle.setFormControlValue('#selected-note-source', '');
  await lifecycle.setFormControlValue('#selected-note-text', '');
  await clickSelector(lifecycle, '[data-augnes-primary-action="preview-new-work"]');
  await lifecycle.waitForCondition(`document.querySelector('[data-result-work-preview]') !== null`, 'ordinary B preview');
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-result-work-preview]').textContent.includes('Historical operator-attested outcome report v2') && document.querySelector('[data-result-work-preview]').textContent.includes('Original applicability conditions:')`), true);
  await clickSelector(lifecycle, '[data-result-work-action="save"]');
  await lifecycle.waitForCondition(`document.querySelector('[data-result-work-saved]') !== null`, 'ordinary B saved');
  assert.equal(await lifecycle.evaluateString(`document.querySelector('[data-result-work-saved] a').getAttribute('href')`),
    `/workbench/semantic-review?project_id=${encodeURIComponent(projectId)}`);
  await clickSelector(lifecycle, '[data-result-work-saved] a');
  await lifecycle.waitForCondition(`document.querySelector('[data-current-work-goal]')?.textContent === 'Inspect the cold observation'`, 'saved B fresh Browser read');
  // Bind responsive checks to the actual saved pair, before exclusion/reselection.
  const retainedExpected = (await readProtectedJson(lifecycle, fixture.manifest.expectation_project_id, '/api/vnext/operator/project-continuity')).work_initialization.selected_source_context;
  await lifecycle.navigate(`${appOrigin}/workbench/semantic-review?successor-expectation=reopen`);
  await saveBrowserExpectation(lifecycle, 'satisfied', 'P33_B_FORECAST_ONLY');
  const bForecast = (await readProtectedJson(lifecycle, fixture.manifest.expectation_project_id, '/api/vnext/operator/work-expectations')).history[0];
  // Close the completed optional reader before revising its work. Its mounted
  // draft retains B's binding; B1 still needs an explicit review below.
  await lifecycle.evaluateBoolean(`(() => { document.querySelector('[data-work-expectation="preparation"]').open = false; return true; })()`);
  await lifecycle.waitForCondition(`document.querySelector('[data-work-expectation="preparation"]').open === false`, 'saved B expectation panel closed');
  await clickSelector(lifecycle, '[data-work-revision-action="open"]');
  await lifecycle.waitForCondition(`document.querySelector('#work-revision-goal') !== null`, 'reopen saved B');
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-selected-work-sources]').textContent.includes('Historical operator-attested outcome report v2')`), true, 'Reopened work preserves selected R2 identity');
  await lifecycle.evaluateBoolean(`(() => { document.querySelector('[data-selected-work-sources]').open = true; return true; })()`);
  await clickSelector(lifecycle, '[data-selected-source-action="exclude"]');
  await clickSelector(lifecycle, '[data-selected-source-action="compare"]');
  await lifecycle.waitForCondition(`document.querySelector('[data-selected-work-sources] [role="status"]')?.textContent.includes('0 selected')`, 'B1 explicitly excludes the complete historical group');
  await lifecycle.setFormControlValue('#work-revision-goal', 'Inspect the cold observation with its uncertainty');
  await clickSelector(lifecycle, '[data-augnes-primary-action="save-work-revision"]');
  await lifecycle.waitForCondition(`document.querySelector('#work-revision-goal') === null`, 'B1 saved without historical notes');
  assert.equal((await readProtectedJson(lifecycle, fixture.manifest.expectation_project_id, '/api/vnext/operator/work-expectations')).history.length, 0, 'B prediction did not transfer to B1');
  await saveBrowserExpectation(lifecycle, 'satisfied', 'P33_B1_FORECAST_ONLY', {
    previousGoal: 'Inspect the cold observation', currentGoal: 'Inspect the cold observation with its uncertainty',
  });
  const b1Forecast = (await readProtectedJson(lifecycle, fixture.manifest.expectation_project_id, '/api/vnext/operator/work-expectations')).history[0];
  assert.notEqual(b1Forecast.packet_ref.external_id, bForecast.packet_ref.external_id, 'The reviewed forecast is saved only for B1');
  await lifecycle.navigate(resultUrl);
  await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="mismatch"]') !== null`, 'A review reopened after B1');
  await reportBrowserExpectation(lifecycle, 'unknown', 'R3_LATER_UNSELECTED: a later report does not replace the historical selection.');
  await lifecycle.navigate(`${appOrigin}/workbench/semantic-review?reviewed-reselection=reopen`);
  await lifecycle.waitForCondition(`document.querySelector('[data-work-revision-action="open"]') !== null`, 'fresh B1 after later A correction');
  await clickSelector(lifecycle, '[data-work-revision-action="open"]');
  await lifecycle.waitForCondition(`document.querySelector('#work-revision-goal') !== null`, 'reopen saved B1');
  await lifecycle.evaluateBoolean(`(() => { document.querySelector('[data-selected-work-sources]').open = true; return true; })()`);
  await exerciseReviewedOutcomeReselection(lifecycle, retainedExpected);
  await lifecycle.setFormControlValue('#selected-note-source', 'Explicit correction');
  await lifecycle.setFormControlValue('#selected-note-provenance', 'user_declaration');
  await lifecycle.setFormControlValue('#selected-note-kind', 'Changed assumption / user correction');
  await lifecycle.setFormControlValue('#selected-note-text', 'Cold observations do not establish warm behavior. Warm remains unknown.');
  await clickSelector(lifecycle, '[data-selected-source-action="add"]');
  const sourceTime = await lifecycle.evaluateString(`new Date('2026-09-29T00:00').toISOString()`);
  const capacityNotes = Array.from({ length: 5 }, (_, index) => ({
    source: `Capacity success ${index}`, text: 'Bounded draft note. '.repeat(10).trim(),
    observed_at: sourceTime, provenance: 'user_declaration', label: 'Open question',
  }));
  for (const note of capacityNotes) {
    await lifecycle.setFormControlValue('#selected-note-source', note.source);
    await lifecycle.setFormControlValue('#selected-note-time', '2026-09-29T00:00');
    await lifecycle.setFormControlValue('#selected-note-provenance', note.provenance);
    await lifecycle.setFormControlValue('#selected-note-kind', note.label);
    await lifecycle.setFormControlValue('#selected-note-text', note.text);
    await clickSelector(lifecycle, '[data-selected-source-action="add"]');
  }
  const comparisonStart = lifecycle.responses.length;
  await clickSelector(lifecycle, '[data-selected-source-action="compare"]');
  await lifecycle.waitForCondition(`Array.from(document.querySelectorAll('[data-selected-work-sources] [role="status"]')).some(node => node.textContent.includes('8 selected;'))`, 'expanded B2 comparison retains the complete historical snapshot');
  const comparisons = lifecycle.responses.slice(comparisonStart).filter(entry => entry.path === '/api/vnext/operator/project-continuity' && entry.method === 'POST');
  assert.equal(comparisons.length, 1); assert.equal(comparisons[0].status, 200);
  const comparedBody = await lifecycle.cdp().send('Network.getResponseBody', { requestId: comparisons[0].request_id });
  assert.equal(comparedBody.base64Encoded, false);
  const compared = JSON.parse(comparedBody.body).comparison;
  const selectedBytes = Buffer.byteLength(canonicalizeProtocolValueV01(compared.entries), 'utf8');
  assert(selectedBytes > 12_000 && selectedBytes <= 32_000, 'The UI selection exercises newly admitted canonical bytes');
  for (const note of capacityNotes) {
    const entry = compared.entries.find(entry => entry.compatibility_source_ref.external_id === note.source);
    assert(entry); assert.equal(entry.bounded_summary, note.text);
    assert.equal(entry.external_ref.observed_at, note.observed_at);
    assert.equal(entry.currentness.as_of, note.observed_at);
    assert.equal(entry.trust_class, note.provenance); assert.equal(entry.why_included, note.label);
  }
  for (const entry of retainedExpected) assert.deepEqual(compared.entries.find(saved => saved.entry_id === entry.entry_id), entry);
  await clickSelector(lifecycle, '[data-augnes-primary-action="save-work-revision"]');
  await lifecycle.waitForCondition(`document.querySelector('#work-revision-goal') === null`, 'note-only B2 saved');
  assert.equal((await readProtectedJson(lifecycle, fixture.manifest.expectation_project_id, '/api/vnext/operator/work-expectations')).history.length, 0, 'B1 prediction did not transfer to B2');
  await lifecycle.navigate(`${appOrigin}/workbench/semantic-review?successor-expectation=final`);
  await lifecycle.waitForCondition(`document.querySelector('[data-work-revision-action="open"]') !== null`, 'fresh saved B2');
  await clickSelector(lifecycle, '[data-work-revision-action="open"]');
  await lifecycle.waitForCondition(`document.querySelector('#work-revision-goal') !== null`, 'reopened B2');
  await clickSelector(lifecycle, '[data-selected-work-sources] > summary');
  const reopened = (await readProtectedJson(lifecycle, fixture.manifest.expectation_project_id, '/api/vnext/operator/project-continuity')).work_initialization;
  assert.deepEqual(reopened.selected_source_context, compared.entries, 'Save and fresh read preserve every full entry, timestamp, provenance and fingerprint');
  assert.equal(await lifecycle.evaluateBoolean(`(() => {
    const text = document.querySelector('[data-selected-work-sources]').textContent;
    return ${JSON.stringify(compared.entries)}.every(entry => text.includes(entry.bounded_summary) &&
      text.includes(entry.compatibility_source_ref.external_id) && text.includes(entry.trust_class.replaceAll('_', ' ')) &&
      (entry.external_ref.observed_at == null || text.includes(entry.external_ref.observed_at)));
  })()`), true, 'Reopened controls show every complete note with its source time and provenance');
  console.log(JSON.stringify({ expanded_capacity_browser: 'pass', canonical_selected_bytes: selectedBytes,
    selected_entries: compared.entries.length, comparison_fingerprint: compared.fingerprint,
    saved_packet_fingerprint: reopened.current_packet.packet_fingerprint, complete_save_reopen: true,
    historical_pair_identity_preserved: true, input_path: 'UI add/select/compare/save/reopen' }));
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-selected-work-sources]').textContent.includes('R2_REPORT_ONLY_RESELECT') && document.querySelector('[data-selected-work-sources]').textContent.includes('P32_FORECAST_ONLY_RESULT') && !document.querySelector('[data-selected-work-sources]').textContent.includes('R3_LATER_UNSELECTED')`), true, 'Fresh saved-work UI reconstructs R2 and its forecast, not R3');
  await clickSelector(lifecycle, '[data-work-revision-action="cancel"]');
  await saveBrowserExpectation(lifecycle, 'unsatisfied', 'P33_B2_FORECAST_ONLY');
  const finalForecast = (await readProtectedJson(lifecycle, fixture.manifest.expectation_project_id, '/api/vnext/operator/work-expectations')).history[0];
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
  const bResultUrl = `${appOrigin}/workbench/results/${receipt.receipt_id.replace(":", "~")}?project_id=${encodeURIComponent(projectId)}`;
  await lifecycle.navigate(bResultUrl);
  await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="unassessed"]') !== null`, 'B2 result reads exact prospective binding');
  await reportBrowserExpectation(lifecycle, 'unsatisfied', 'The bounded observation did not establish the cold criterion.');
  await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="match"]') !== null`, 'B2 prediction matches reported failure');
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-task-success-status="satisfied"]') === null`), true);
  await reportBrowserExpectation(lifecycle, 'unknown', 'Correction: the observation is incomplete.');
  await lifecycle.waitForCondition(`document.querySelector('[data-expectation-comparison="unknown"]') !== null`, 'B2 correction preserves unknown');
  const comparison = (await readProtectedJson(lifecycle, fixture.manifest.expectation_project_id, '/api/vnext/operator/run-results?' + new URLSearchParams({ receipt_ref: receipt.receipt_id }))).result.expectation;
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
  console.log(JSON.stringify({ saved_successor_expectation_ui: 'pass', revisions: ['definition', 'note'], silent_transfer: false, actual_attempt_bound: true, restart_comparison: 'unknown',
    reviewed_outcome_reuse: 'saved_R2_and_original_conditions', review_text_retyped: false, selected_snapshot_notes: 2, initial_review_selection_actions: 1,
    reselection: 'one_member_search_to_visible_complete_pair', reopened_R2_after_R3: true, capacity_refusal: 'one_slot_or_serialized_bytes', comparison_and_preview_retained: true }));
}

async function exerciseReviewedOutcomeReselection(lifecycle, retainedExpected) {
  await lifecycle.evaluateBoolean(`(() => { document.querySelector('[data-retained-work-sources]').open = true; return true; })()`);
  const observations = [];
  for (const query of ['R2_REPORT_ONLY_RESELECT', 'P32_FORECAST_ONLY_RESULT']) {
    await lifecycle.setFormControlValue('#retained-source-query', query);
    await clickSelector(lifecycle, '[data-retained-source-action="search"]');
    await lifecycle.waitForCondition(`document.querySelector('[data-retained-source-results]') !== null`, `${query} lookup`);
    const returned = await lifecycle.evaluateJson(`Array.from(document.querySelectorAll('[data-retained-source-hit]')).map(node => node.textContent)`);
    await clickSelector(lifecycle, '[data-retained-source-action="select"]');
    await lifecycle.waitForCondition(`document.querySelector('[data-selected-source-action="exclude"]') !== null`, 'lookup selection added');
    await clickSelector(lifecycle, '[data-selected-source-action="compare"]');
    await lifecycle.waitForCondition(`Array.from(document.querySelectorAll('[data-selected-work-sources] [role="status"]')).some(node => node.textContent.includes(' selected;')) || document.querySelector('[data-selected-work-sources] [role="alert"]') !== null`, 'lookup selection compared or explicitly refused');
    const compared = await lifecycle.evaluateBoolean(`Array.from(document.querySelectorAll('[data-selected-work-sources] [role="status"]')).some(node => node.textContent.includes('2 selected;'))`);
    observations.push({ query, returned_notes: returned.length, complete_visible_group: returned.some(text => text.includes('R2_REPORT_ONLY_RESELECT')) && returned.some(text => text.includes('P32_FORECAST_ONLY_RESULT')), compared });
    await clickSelector(lifecycle, '[data-selected-source-action="exclude"]');
    assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-selected-source-action="exclude"]') === null`), true, 'Exclusion removes the whole group');
  }
  console.log(JSON.stringify({ reviewed_outcome_reselection_ui: observations }));
  assert(observations.every(o => o.returned_notes === 2 && o.complete_visible_group && o.compared), 'Single-member searches must visibly select and compare the complete historical pair');
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-retained-source-action="select"]').textContent.includes('Select both historical notes')`), true, 'The user explicitly selects both displayed notes');
  await observeRetainedGroupViewports(lifecycle, retainedExpected);
  await lifecycle.cdp().send('Emulation.clearDeviceMetricsOverride');
  for (let index = 0; index < 7; index++) {
    await lifecycle.setFormControlValue('#selected-note-source', `Capacity ${index}`);
    await lifecycle.setFormControlValue('#selected-note-text', 'Bounded draft note. '.repeat(10));
    await clickSelector(lifecycle, '[data-selected-source-action="add"]');
  }
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-retained-source-action="select"]').disabled && document.querySelector('[data-retained-source-capacity]').textContent.includes('2 note slots; 1 remain')`), true, 'One remaining slot refuses the group before selection');
  await clickSelector(lifecycle, '[data-selected-source-action="exclude"]');
  assert.equal(await lifecycle.evaluateBoolean(`!document.querySelector('[data-retained-source-action="select"]').disabled && document.querySelectorAll('[data-selected-source-action="exclude"]').length === 6`), true, 'Two remaining slots allow checking the complete pair');
  for (let index = 0; index < 6; index++) await clickSelector(lifecycle, '[data-selected-source-action="exclude"]');
  for (let index = 0; index < 6; index++) {
    await lifecycle.setFormControlValue('#selected-note-source', `Byte capacity ${index}`);
    await lifecycle.setFormControlValue('#selected-note-text', '한'.repeat(1250));
    await clickSelector(lifecycle, '[data-selected-source-action="add"]');
  }
  const responseStart = lifecycle.responses.length;
  const draftAndSelection = `(() => ({
    draft: ['source', 'time', 'provenance', 'kind', 'text'].map(key => document.querySelector('#selected-note-' + key).value),
    selected: Array.from(document.querySelectorAll('[data-selected-source-action="exclude"]')).map(button => button.parentElement.textContent),
  }))()`;
  const beforeRefusal = await lifecycle.evaluateJson(draftAndSelection);
  await clickSelector(lifecycle, '[data-retained-source-action="select"]');
  await lifecycle.waitForCondition(`document.querySelector('[data-selected-work-sources] [role="alert"]')?.textContent.includes('32,000-byte') === true`, 'Byte capacity refuses the pair before adding it');
  const refusals = lifecycle.responses.slice(responseStart).filter(entry => entry.path === '/api/vnext/operator/project-continuity' && entry.method === 'POST');
  assert.equal(refusals.length, 1); assert.equal(refusals[0].status, 422);
  const refusedBody = await lifecycle.cdp().send('Network.getResponseBody', { requestId: refusals[0].request_id });
  assert.equal(refusedBody.base64Encoded, false);
  assert.equal(JSON.parse(refusedBody.body).error_code, 'selected_source_context_budget_exceeded');
  expectedCapacityRefusal = refusals[0].request_id;
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelectorAll('[data-selected-source-action="exclude"]').length === 6`), true, 'Byte refusal leaves selection intact');
  assert.deepEqual(await lifecycle.evaluateJson(draftAndSelection), beforeRefusal, 'Byte refusal preserves the complete draft and selection');
  for (let index = 0; index < 6; index++) await clickSelector(lifecycle, '[data-selected-source-action="exclude"]');
  await clickSelector(lifecycle, '[data-retained-source-action="select"]');
  await lifecycle.waitForCondition(`document.querySelectorAll('[data-selected-source-action="exclude"]').length === 2`, 'complete historical pair reselected');
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-retained-source-action="select"]').disabled`), true, 'Duplicate group selection is disabled');
  assert.equal(await lifecycle.evaluateBoolean(`document.querySelector('[data-selected-work-sources]').textContent.includes('R3_LATER_UNSELECTED')`), false, 'R3 does not replace explicitly reselected R2');
}

// Read once after each metrics command: layout failures are never polled away.
async function observeRetainedGroupViewports(lifecycle, expected) {
  assert.equal(expected.length, 2, 'The saved producer contains the exact historical pair');
  const groupKeys = expected.map(entry => JSON.stringify([entry.compatibility_source_ref.external_id, entry.compatibility_source_ref.source_ref]));
  assert.equal(new Set(groupKeys).size, 1, 'The saved pair has one exact group identity');
  const fingerprint = value => createHash('sha256').update(value).digest('hex');
  const identity = { group: fingerprint(groupKeys[0]), notes: expected.map(entry => fingerprint(entry.entry_id)), count: 2 };
  const capture = `(() => {
    const expected = ${JSON.stringify(expected.map(entry => ({ id: entry.entry_id, summary: entry.bounded_summary })))};
    const hits = Array.from(document.querySelectorAll('[data-retained-source-hit]'));
    const groups = Array.from(document.querySelectorAll('[data-retained-source-group]'));
    const geometry = node => {
      const r = node.getBoundingClientRect(), s = getComputedStyle(node);
      return { x:r.x, width:r.width, height:r.height, right:r.right, client:node.clientWidth, scroll:node.scrollWidth,
        display:s.display, visibility:s.visibility, content_visibility:s.contentVisibility, overflow_wrap:s.overflowWrap };
    };
    return { inner_width:innerWidth, document_client:document.documentElement.clientWidth, document_scroll:document.documentElement.scrollWidth,
      document_client_height:document.documentElement.clientHeight, document_scroll_height:document.documentElement.scrollHeight,
      visual_viewport:visualViewport?{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale}:null,
      retained_count:hits.length, group_count:groups.length,
      exact_expected_group:groups.length===1 && expected.every(entry => hits.some(hit => hit.getAttribute('data-retained-source-hit')===entry.id && hit.parentElement===groups[0])),
      notes:expected.map((entry,index) => {
        const node=hits.find(hit => hit.getAttribute('data-retained-source-hit')===entry.id);
        return {expected_index:index,present:!!node,full_summary:node?.textContent.includes(entry.summary)??false,...(node?geometry(node):{})};
      }),
      selected_details_open:document.querySelector('[data-selected-work-sources]')?.open??null,
      retained_details_open:document.querySelector('[data-retained-work-sources]')?.open??null,
      lookup:geometry(document.querySelector('[data-retained-work-sources]')),
      document_ready:document.readyState,fonts_status:document.fonts.status };
  })()`;
  for (const width of [390, 768, 1280]) {
    const requested = { width, height:844, deviceScaleFactor:1, mobile:width===390 };
    await lifecycle.cdp().send('Emulation.setDeviceMetricsOverride', requested);
    const observed = await lifecycle.evaluateJson(capture);
    console.log(JSON.stringify({ retained_group_viewport: { requested, expected:identity, observed } }));
    assertRetainedGroupViewport(observed, requested);
    if (requested.mobile || width === 768) {
      // Mutate only this disposable rendered page, restoring each mutation in the
      // same browser task. These exercise real geometry, not fixture measurements.
      const negatives = await lifecycle.evaluateJson(`(() => {
        const snapshots=[];
        const note=document.querySelector('[data-retained-source-hit]');
        const group=note.parentElement, next=note.nextSibling;
        const groupParent=group.parentElement, groupNext=group.nextSibling;
        const lookup=document.querySelector('[data-retained-work-sources]');
        const noteStyle=note.getAttribute('style'), lookupStyle=lookup.getAttribute('style');
        const restoreStyle=(node,value)=>value===null?node.removeAttribute('style'):node.setAttribute('style',value);
        const observe=(name,change,restore)=>{try{change();snapshots.push({name,observed:${capture}});}finally{restore();}};
        observe('missing_member',()=>note.remove(),()=>group.insertBefore(note,next));
        observe('missing_group',()=>group.remove(),()=>groupParent.insertBefore(group,groupNext));
        observe('zero_height_member',()=>{note.style.height='0px';note.style.minHeight='0px';},()=>restoreStyle(note,noteStyle));
        observe('real_overflow',()=>{lookup.style.minWidth='${width+64}px';},()=>restoreStyle(lookup,lookupStyle));
        return {snapshots,restored:${capture}};
      })()`);
      const reasons = { missing_member:/Retained note count/, missing_group:/Retained group count/,
        zero_height_member:/Retained note 0 has positive height/, real_overflow:/Document fits requested viewport/ };
      for (const { name, observed:negative } of negatives.snapshots) {
        assert.throws(() => assertRetainedGroupViewport(negative, requested), reasons[name], `Reject ${name} at ${width}`);
        if (name === 'real_overflow' && requested.mobile) {
          assert.equal(negative.document_client, width, 'Mobile requested width remains applied during overflow');
          assert(negative.inner_width > width, 'Mobile overflow inflates innerWidth');
          assert(negative.document_scroll <= negative.inner_width, 'The old innerWidth-only predicate falsely accepts this mobile overflow');
        }
      }
      assert.equal(negatives.snapshots.length, 4);
      assertRetainedGroupViewport(negatives.restored, requested);
      console.log(JSON.stringify({ retained_group_viewport_negatives:{ requested, ...negatives } }));
    }
  }
}

function assertRetainedGroupViewport(observed, { width, mobile }) {
  if (mobile) {
    // Mobile innerWidth can grow with overflow; clientWidth retains the requested
    // layout width and must not be replaced by that inflated measurement.
    assert.equal(observed.document_client, width, `Requested mobile viewport ${width} is applied`);
  } else {
    // Desktop innerWidth includes a vertical scrollbar; clientWidth excludes it.
    assert.equal(observed.inner_width, width, `Requested desktop viewport ${width} is applied`);
    assert(observed.document_client <= observed.inner_width, `Desktop client width fits inner viewport ${width}`);
  }
  assert(observed.document_scroll <= observed.document_client, `Document fits requested viewport ${width}: scroll=${observed.document_scroll}, client=${observed.document_client}, inner=${observed.inner_width}`);
  // Preserve the original comparison too; mobile innerWidth alone can inflate to
  // the overflow width and incorrectly accept horizontal scrolling.
  assert(observed.document_scroll <= observed.inner_width, `Document fits inner viewport ${width}`);
  assert.equal(observed.group_count, 1, `Retained group count at ${width}`);
  assert.equal(observed.retained_count, 2, `Retained note count at ${width}`);
  assert.equal(observed.exact_expected_group, true, `Exact saved group at ${width}`);
  assert.equal(observed.selected_details_open, true, `Selected-source details open at ${width}`);
  assert.equal(observed.retained_details_open, true, `Retained-source details open at ${width}`);
  assert.equal(observed.notes.length, 2, `Expected note geometry count at ${width}`);
  for (const note of observed.notes) {
    assert.equal(note.present, true, `Retained note ${note.expected_index} present at ${width}`);
    assert(note.height > 0, `Retained note ${note.expected_index} has positive height at ${width}`);
    assert(note.width > 0, `Retained note ${note.expected_index} has positive width at ${width}`);
    assert.notEqual(note.display, 'none', `Retained note ${note.expected_index} displayed at ${width}`);
    assert.equal(note.visibility, 'visible', `Retained note ${note.expected_index} visible at ${width}`);
    assert.notEqual(note.content_visibility, 'hidden', `Retained note ${note.expected_index} content visible at ${width}`);
    assert.equal(note.full_summary, true, `Retained note ${note.expected_index} complete at ${width}`);
  }
}

async function readProtectedJson(lifecycle, projectId, route) {
  return lifecycle.evaluateJson(`(async () => {
    const response = await fetch(${JSON.stringify(route)}, { cache: 'no-store', credentials: 'same-origin', headers: { 'Augnes-Project-Id': ${JSON.stringify(projectId)} } });
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
