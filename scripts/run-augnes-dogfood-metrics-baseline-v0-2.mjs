#!/usr/bin/env node
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import http from "node:http";
import https from "node:https";

import {
  AUGNES_DOGFOOD_BASELINE_AGGREGATE_REPORT_FILENAME,
  AUGNES_DOGFOOD_BASELINE_DEFAULT_ITERATIONS,
  AUGNES_DOGFOOD_METRICS_BASELINE_VERSION,
  runAugnesDogfoodMetricsBaseline,
} from "../lib/dogfood/augnes-dogfood-metrics-baseline.ts";

const requestedIterations = parseIterationCount(
  process.env.AUGNES_BASELINE_ITERATIONS,
);
const outputDir =
  process.env.AUGNES_BASELINE_OUTPUT_DIR ??
  mkdtempSync(join(tmpdir(), "augnes-dogfood-metrics-baseline-v0-2-"));
const browserRegressionUrl = process.env.AUGNES_BASELINE_BROWSER_REGRESSION_URL;
const skipBrowserRegression = parseBoolean(
  process.env.AUGNES_BASELINE_SKIP_BROWSER_REGRESSION,
);

mkdirSync(outputDir, { recursive: true });

const browserRegressionHtml =
  browserRegressionUrl && !skipBrowserRegression
    ? await getHtml(browserRegressionUrl)
    : undefined;

const report = await runAugnesDogfoodMetricsBaseline({
  iteration_count: requestedIterations,
  output_dir: outputDir,
  browser_regression_url: browserRegressionUrl,
  browser_regression_html: browserRegressionHtml,
  skip_browser_regression: skipBrowserRegression,
});

const aggregateReportPath = join(
  outputDir,
  AUGNES_DOGFOOD_BASELINE_AGGREGATE_REPORT_FILENAME,
);
const bySignal = Object.fromEntries(
  report.aggregate.signals.map((signal) => [signal.signal_id, signal]),
);

console.log(
  JSON.stringify(
    {
      version: AUGNES_DOGFOOD_METRICS_BASELINE_VERSION,
      status: report.status,
      iteration_count: report.iterations.length,
      output_dir: outputDir,
      aggregate_report_path: aggregateReportPath,
      iteration_report_paths: report.iterations.map(
        (iteration) => iteration.report_path,
      ),
      recovered_batch_ids: report.aggregate.recovered_batch_ids,
      recovered_delta_counts: report.aggregate.recovered_delta_counts,
      metrics_status_sequence: report.aggregate.metrics_status_sequence,
      dogfood_readiness_sequence: report.aggregate.dogfood_readiness_sequence,
      cockpit_shrink_readiness_sequence:
        report.aggregate.cockpit_shrink_readiness_sequence,
      resume_latency: {
        status: bySignal.resume_latency.status,
        trend: bySignal.resume_latency.trend,
      },
      review_burden: {
        status: bySignal.review_burden.status,
        trend: bySignal.review_burden.trend,
      },
      browser_regression_status: report.aggregate.browser_regression_status,
      browser_regression_recommendation:
        report.aggregate.browser_regression_recommendation,
      recommendation: report.aggregate.recommended_next_reviews[0],
      authority_boundary_summary: {
        product_workbench_render_remains_read_only:
          report.authority_boundary.product_workbench_render_remains_read_only,
        temp_fixture_writes_are_script_smoke_only:
          report.authority_boundary.temp_fixture_writes_are_script_smoke_only,
        can_create_temp_runner_fixture:
          report.authority_boundary.can_create_temp_runner_fixture,
        can_tick_temp_runner_fixture:
          report.authority_boundary.can_tick_temp_runner_fixture,
        can_recover_temp_delta_batch_fixture:
          report.authority_boundary.can_recover_temp_delta_batch_fixture,
        can_write_temp_baseline_artifact:
          report.authority_boundary.can_write_temp_baseline_artifact,
        can_write_product_db: report.authority_boundary.can_write_product_db,
        can_delete_legacy_cockpit:
          report.authority_boundary.can_delete_legacy_cockpit,
        can_shrink_legacy_cockpit:
          report.authority_boundary.can_shrink_legacy_cockpit,
        can_hide_legacy_cockpit:
          report.authority_boundary.can_hide_legacy_cockpit,
        can_change_product_ui_behavior:
          report.authority_boundary.can_change_product_ui_behavior,
        can_add_product_route:
          report.authority_boundary.can_add_product_route,
        can_add_api_write_route:
          report.authority_boundary.can_add_api_write_route,
        can_add_server_action:
          report.authority_boundary.can_add_server_action,
        can_call_provider_openai:
          report.authority_boundary.can_call_provider_openai,
        can_call_github: report.authority_boundary.can_call_github,
        can_actuate_github: report.authority_boundary.can_actuate_github,
        can_execute_codex: report.authority_boundary.can_execute_codex,
        can_execute_runner_in_product:
          report.authority_boundary.can_execute_runner_in_product,
        can_tick_runner_in_product:
          report.authority_boundary.can_tick_runner_in_product,
        can_recover_delta_batch_in_product:
          report.authority_boundary.can_recover_delta_batch_in_product,
        can_schedule_runner_in_product:
          report.authority_boundary.can_schedule_runner_in_product,
        can_record_proof: report.authority_boundary.can_record_proof,
        can_create_evidence: report.authority_boundary.can_create_evidence,
        can_apply_durable_memory:
          report.authority_boundary.can_apply_durable_memory,
        can_apply_perspective:
          report.authority_boundary.can_apply_perspective,
        can_auto_apply_delta: report.authority_boundary.can_auto_apply_delta,
        can_merge_publish_retry_replay_deploy:
          report.authority_boundary.can_merge_publish_retry_replay_deploy,
        can_absorb_local_write_control_without_contract:
          report.authority_boundary
            .can_absorb_local_write_control_without_contract,
      },
    },
    null,
    2,
  ),
);

function parseIterationCount(value) {
  if (!value) return AUGNES_DOGFOOD_BASELINE_DEFAULT_ITERATIONS;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`AUGNES_BASELINE_ITERATIONS must be an integer: ${value}`);
  }
  return parsed;
}

function parseBoolean(value) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

async function getHtml(targetUrl) {
  const parsed = new URL(targetUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(
      `AUGNES_BASELINE_BROWSER_REGRESSION_URL must be http(s): ${targetUrl}`,
    );
  }

  if (typeof fetch === "function") {
    const response = await fetch(targetUrl, { method: "GET" });
    if (!response.ok) {
      throw new Error(`GET ${targetUrl} returned ${response.status}`);
    }
    return await response.text();
  }

  return await new Promise((resolve, reject) => {
    const client = parsed.protocol === "https:" ? https : http;
    const request = client.request(
      parsed,
      {
        method: "GET",
        headers: {
          accept: "text/html",
        },
      },
      (response) => {
        if (
          !response.statusCode ||
          response.statusCode < 200 ||
          response.statusCode >= 300
        ) {
          reject(new Error(`GET ${targetUrl} returned ${response.statusCode}`));
          response.resume();
          return;
        }
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => resolve(body));
      },
    );
    request.on("error", reject);
    request.end();
  });
}
