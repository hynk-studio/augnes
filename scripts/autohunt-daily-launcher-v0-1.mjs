#!/usr/bin/env node
import { readAutohuntSupervisedExecutionContracts } from "../lib/autonomy/read-autohunt-supervised-execution-contracts.ts";
import { writeAutohuntDailyLauncherRun } from "../lib/autonomy/autohunt-daily-launcher-run-write.ts";
import {
  findForbiddenRawMaterialFields,
  fingerprint,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";

const args = parseArgs(process.argv.slice(2));

if (process.env.AUGNES_AUTOHUNT_DAILY_LAUNCHER_CONFIRM !== "1") {
  exitWithRefusal([
    "missing_env:AUGNES_AUTOHUNT_DAILY_LAUNCHER_CONFIRM=1",
  ]);
}

if (!args.confirmationRef) {
  exitWithRefusal(["missing_confirmation_ref"]);
}

const unsafeConfirmationFields = findForbiddenRawMaterialFields({
  confirmation_ref: args.confirmationRef,
});
if (unsafeConfirmationFields.length > 0) {
  exitWithRefusal(["unsafe_confirmation_ref"]);
}

const contractReadback = readAutohuntSupervisedExecutionContracts({
  scope: "project:augnes",
  contract_status: "ready_for_future_limited_launcher",
});
const contract = contractReadback.selected_contract;
if (!contract) {
  exitWithRefusal(["latest_ready_execution_contract_missing"]);
}

const confirmedAt = args.confirmedAt ?? new Date().toISOString();
const confirmationFingerprint = fingerprint({
  confirmation_ref: args.confirmationRef,
  confirmed_by: args.confirmedBy,
  confirmed_at: confirmedAt,
  launcher: "autohunt-daily-launcher-v0-1",
});

const result = writeAutohuntDailyLauncherRun({
  scope: "project:augnes",
  source_execution_contract: contract,
  mode: args.fixtureResult
    ? "prepare_handoff_and_record_fixture_result"
    : "prepare_handoff_only",
  daily_confirmation: {
    confirmation_ref: args.confirmationRef,
    confirmed_by: args.confirmedBy,
    confirmed_at: confirmedAt,
    confirmation_fingerprint: confirmationFingerprint,
    raw_confirmation_text_persisted: false,
  },
});

if (!result.ok || !result.launcher_run) {
  exitWithRefusal(result.refusal_reasons);
}

const linkedIntake = result.launcher_run.linked_result_intake;
console.log(
  JSON.stringify(
    {
      launcher: "autohunt-daily-launcher-v0-1",
      ok: true,
      mode: args.fixtureResult
        ? "prepare_handoff_and_record_fixture_result"
        : "prepare_handoff_only",
      launcher_run_id: result.launcher_run.launcher_run_id,
      source_execution_contract_id:
        result.launcher_run.source_execution_contract.contract_id,
      handoff_packet_id: result.launcher_run.handoff_packet.handoff_packet_id,
      launcher_run_status: result.launcher_run.launcher_run_status,
      linked_result_intake_id: linkedIntake?.result_intake_id ?? null,
      expected_observed_delta_fingerprint:
        linkedIntake?.expected_observed_delta_fingerprint ?? null,
      reuse_outcome_fingerprint:
        linkedIntake?.reuse_outcome_fingerprint ?? null,
      residual_diagnostic_fingerprint:
        linkedIntake?.residual_diagnostic_fingerprint ?? null,
      boundary_flags: result.launcher_run.launcher_run_boundary,
      authority_boundary: result.launcher_run.authority_boundary,
      raw_material_persisted: result.raw_material_persisted,
      next_recommended_step: args.fixtureResult
        ? "Review the linked result intake readback; do not execute Codex, call GitHub, create branches or PRs, fetch sources, run retrieval, or mutate product state from this launcher."
        : "Manually inspect the handoff packet; external Codex execution remains outside this launcher and requires separate operator action.",
    },
    null,
    2,
  ),
);

function parseArgs(argv) {
  const parsed = {
    confirmationRef: null,
    confirmedBy: "operator:local",
    confirmedAt: null,
    fixtureResult: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--fixture-result") {
      parsed.fixtureResult = true;
      continue;
    }
    if (arg === "--confirmation-ref") {
      parsed.confirmationRef = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
    if (arg === "--confirmed-by") {
      parsed.confirmedBy = argv[index + 1] ?? "operator:local";
      index += 1;
      continue;
    }
    if (arg === "--confirmed-at") {
      parsed.confirmedAt = argv[index + 1] ?? null;
      index += 1;
      continue;
    }
  }
  return parsed;
}

function exitWithRefusal(refusalReasons) {
  console.error(
    JSON.stringify(
      {
        launcher: "autohunt-daily-launcher-v0-1",
        ok: false,
        refusal_reasons: refusalReasons.length > 0 ? refusalReasons : ["refused"],
        writes_attempted: false,
        codex_executed: false,
        github_called: false,
        branch_or_pr_created: false,
        provider_openai_called: false,
        sources_fetched: false,
        retrieval_run: false,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
