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
