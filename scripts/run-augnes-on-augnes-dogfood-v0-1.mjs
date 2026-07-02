#!/usr/bin/env node
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  AUGNES_DOGFOOD_VERSION,
  runAugnesDogfoodFixture,
} from "../lib/dogfood/augnes-on-augnes-dogfood.ts";

const explicitDbPath = process.env.AUGNES_DOGFOOD_DB_PATH;
const tempDir = mkdtempSync(join(tmpdir(), "augnes-on-augnes-dogfood-v0-1-"));
const dbPath = explicitDbPath ?? join(tempDir, "runner-ledger.sqlite");
const reportPath =
  process.env.AUGNES_DOGFOOD_REPORT_PATH ??
  join(tempDir, "augnes-on-augnes-dogfood-v0-1.report.json");

process.env.AUGNES_DB_PATH = dbPath;

const report = await runAugnesDogfoodFixture({
  dbPath,
  outputPath: reportPath,
  tempDir,
});

const evaluationSignalStatuses = Object.fromEntries(
  report.evaluation.signals.map((signal) => [signal.signal_id, signal.status]),
);

console.log(
  JSON.stringify(
    {
      dogfood_version: AUGNES_DOGFOOD_VERSION,
      status: report.status,
      temp_dir: tempDir,
      temp_db_path: dbPath,
      report_path: reportPath,
      run_id: report.runner_fixture_summary.run_id,
      recovered_batch_id: report.runner_fixture_summary.recovered_batch_id,
      recovered_delta_count:
        report.runner_fixture_summary.recovered_delta_count,
      metrics_status: report.metrics_snapshot.metrics_status,
      dogfood_readiness_status:
        report.metrics_snapshot.dogfood_readiness_status,
      evaluation_signal_statuses: evaluationSignalStatuses,
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
        can_write_temp_dogfood_artifact:
          report.authority_boundary.can_write_temp_dogfood_artifact,
        can_call_provider_openai:
          report.authority_boundary.can_call_provider_openai,
        can_call_github: report.authority_boundary.can_call_github,
        can_execute_codex: report.authority_boundary.can_execute_codex,
        can_create_branch_or_pr:
          report.authority_boundary.can_create_branch_or_pr,
        can_apply_project_perspective:
          report.authority_boundary.can_apply_project_perspective,
        can_apply_durable_memory:
          report.authority_boundary.can_apply_durable_memory,
        can_auto_apply_delta: report.authority_boundary.can_auto_apply_delta,
        can_record_proof: report.authority_boundary.can_record_proof,
        can_create_evidence: report.authority_boundary.can_create_evidence,
        can_delete_or_shrink_legacy_cockpit:
          report.authority_boundary.can_delete_or_shrink_legacy_cockpit,
      },
      recommended_next_review: report.recommended_next_review,
    },
    null,
    2,
  ),
);
