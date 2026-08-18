#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  assertOperationalReentryMatchedCohortReplacementAuthorizationNotConsumedV01,
  beginOperationalReentryMatchedCohortReplacementAttemptV01,
  validateOperationalReentryMatchedCohortReplacementArtifactsV01,
} from "@/lib/vnext/operational-reentry-matched-cohort-replacement-artifact-store";
import {
  ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01,
  buildOperationalReentryMatchedCohortReplacementV01,
  readOperationalReentryMatchedCohortReplacementCompatibilityGateV01,
  revalidateOperationalReentryMatchedCohortReplacementCompatibilityGateBeforeAttemptV01,
  runOperationalReentryMatchedCohortReplacementV01,
} from "@/lib/vnext/operational-reentry-matched-cohort-replacement";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV01,
  readDefaultModelGatewayLocalCapabilityV01,
  readModelGatewayInteractiveAdmissionForRootV01,
} from "@/lib/vnext/model-gateway/model-gateway";

const AUTHORIZED_ORIGINS_V01 = new Set([
  "https://github.com/hynk-studio/augnes-perspective-lab.git",
  "git@github.com:hynk-studio/augnes-perspective-lab.git",
]);

if (
  process.argv[1] &&
  pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url
) {
  void main().catch((error) => {
    console.error("operational_reentry_replacement_matched_cohort_failed");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

async function main(): Promise<void> {
  const options = parseArgumentsV01(process.argv.slice(2));
  const repositoryRoot = realpathSync(
    options.repository_root ?? process.cwd(),
  );
  const authorization = JSON.parse(
    readFileSync(options.authorization_file, "utf8"),
  ) as unknown;
  const sourceHead = readAuthorizationSourceHeadV01(authorization);
  preflightOperationalReentryMatchedCohortReplacementRepositoryV01(
    repositoryRoot,
    sourceHead,
  );

  const capability = readDefaultModelGatewayLocalCapabilityV01();
  if (capability.status !== "available") {
    failV01(`operational_reentry_replacement_gateway_${capability.status}`);
  }
  const admission =
    readModelGatewayInteractiveAdmissionForRootV01(repositoryRoot);
  const compatibilityGate =
    readOperationalReentryMatchedCohortReplacementCompatibilityGateV01({
      repository_root: repositoryRoot,
      probe_run_root: options.compatibility_probe_root,
    });
  const route =
    await prepareOperationalReentryMatchedCohortModelGatewayRouteV01();
  if (!route) failV01("operational_reentry_replacement_route_unavailable");
  const evaluatedAt = new Date().toISOString();
  const prepared = buildOperationalReentryMatchedCohortReplacementV01({
    authorization,
    admission,
    route,
    compatibility_gate: compatibilityGate,
    evaluated_at: evaluatedAt,
  });
  if (
    prepared.pricing.aggregate_worst_case_cost_nano_usd >
      ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01
  ) {
    failV01("operational_reentry_replacement_aggregate_cost_exceeded");
  }
  assertOperationalReentryMatchedCohortReplacementAuthorizationNotConsumedV01({
    repository_root: repositoryRoot,
    authorization_fingerprint:
      prepared.authorization.integrity.fingerprint,
  });
  preflightOperationalReentryMatchedCohortReplacementRepositoryV01(
    repositoryRoot,
    sourceHead,
  );
  const finalAdmission =
    readModelGatewayInteractiveAdmissionForRootV01(repositoryRoot);
  if (
    finalAdmission.workspace_id !== admission.workspace_id ||
    finalAdmission.project_id !== admission.project_id ||
    finalAdmission.expected_active_selection_revision !==
      admission.expected_active_selection_revision ||
    finalAdmission.project_root.path_flavor !==
      admission.project_root.path_flavor ||
    finalAdmission.project_root.normalized_path !==
      admission.project_root.normalized_path
  ) {
    failV01("operational_reentry_replacement_admission_changed");
  }

  const finalCompatibilityGate =
    revalidateOperationalReentryMatchedCohortReplacementCompatibilityGateBeforeAttemptV01(
      {
        repository_root: repositoryRoot,
        probe_run_root: options.compatibility_probe_root,
        prepared,
      },
    );
  const finalEvaluatedAt = new Date().toISOString();
  const finalPrepared = buildOperationalReentryMatchedCohortReplacementV01({
    authorization,
    admission: finalAdmission,
    route,
    compatibility_gate: finalCompatibilityGate,
    evaluated_at: finalEvaluatedAt,
  });
  if (
    finalPrepared.authorization.integrity.fingerprint !==
      prepared.authorization.integrity.fingerprint ||
    finalPrepared.manifest.integrity.fingerprint !==
      prepared.manifest.integrity.fingerprint ||
    finalPrepared.compatibility_gate.integrity.fingerprint !==
      prepared.compatibility_gate.integrity.fingerprint ||
    finalPrepared.pricing.integrity.fingerprint !==
      prepared.pricing.integrity.fingerprint
  ) {
    failV01("operational_reentry_replacement_frozen_identity_changed");
  }

  const journal =
    beginOperationalReentryMatchedCohortReplacementAttemptV01({
      repository_root: repositoryRoot,
      prepared: finalPrepared,
    });
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    const result =
      await runOperationalReentryMatchedCohortReplacementV01(
        {
          authorization,
          admission: finalAdmission,
          route,
          compatibility_gate: finalCompatibilityGate,
          evaluated_at: finalEvaluatedAt,
        },
        {
          cancellation_signal: cancellation.signal,
          assert_source_unchanged() {
            preflightOperationalReentryMatchedCohortReplacementRepositoryV01(
              repositoryRoot,
              sourceHead,
            );
          },
          on_attempt_prepared(identity) {
            if (
              identity.manifest.integrity.fingerprint !==
                finalPrepared.manifest.integrity.fingerprint ||
              identity.authorization.integrity.fingerprint !==
                finalPrepared.authorization.integrity.fingerprint ||
              identity.compatibility_gate.integrity.fingerprint !==
                finalPrepared.compatibility_gate.integrity.fingerprint ||
              identity.call_plan.integrity.fingerprint !==
                finalPrepared.call_plan.integrity.fingerprint ||
              identity.pricing.integrity.fingerprint !==
                finalPrepared.pricing.integrity.fingerprint
            ) {
              failV01("operational_reentry_replacement_frozen_identity_changed");
            }
          },
          on_first_egress_attempt(consumption) {
            journal.consume_authorization(consumption);
          },
          on_call_terminal(call) {
            journal.append_call(call);
          },
          on_block_evaluation(block) {
            journal.append_block(block);
          },
        },
      );
    const artifacts = journal.finalize(result);
    const validated =
      validateOperationalReentryMatchedCohortReplacementArtifactsV01({
        repository_root: repositoryRoot,
        run_root: journal.run_root,
      });
    console.log(
      JSON.stringify({
        status:
          result.result_kind === "complete"
            ? "operational_reentry_replacement_matched_cohort_complete"
            : "operational_reentry_replacement_matched_cohort_truthful_incomplete",
        future_live_issue_number:
          result.authorization.future_live_issue_number,
        source_repository_head_sha:
          result.authorization.exact_merged_source_head,
        replacement_cohort_id:
          result.manifest.replacement_cohort_id,
        replacement_cohort_fingerprint:
          result.manifest.integrity.fingerprint,
        authorization_fingerprint:
          result.authorization.integrity.fingerprint,
        lineage_fingerprint: result.lineage.integrity.fingerprint,
        compatibility_gate_fingerprint:
          result.compatibility_gate.integrity.fingerprint,
        compatibility_report_fingerprint:
          result.compatibility_gate.report_fingerprint,
        compatibility_artifact_index_fingerprint:
          result.compatibility_gate.artifact_index_fingerprint,
        case_fingerprint: result.case.integrity.fingerprint,
        rubric_fingerprint: result.rubric.integrity.fingerprint,
        call_plan_fingerprint: result.call_plan.integrity.fingerprint,
        request_family_kind: result.manifest.request_family_kind,
        request_family_trace_id:
          result.manifest.request_family_trace_id,
        route_fingerprint:
          result.manifest.route.integrity_fingerprint,
        provider_contract_fingerprint:
          result.provider_contract.integrity.fingerprint,
        pricing_fingerprint: result.pricing.integrity.fingerprint,
        pricing_authority_fingerprint:
          result.pricing.gateway_cost_budget.authority.pricing_fingerprint,
        planned_calls: result.report.planned_calls,
        terminal_calls: result.report.terminal_calls,
        terminal_category_counts:
          result.report.terminal_category_counts,
        accounting: result.report.accounting,
        exact_case_dispositions:
          result.report.exact_case_dispositions,
        authority_ledger: result.report.authority_ledger,
        report_fingerprint: result.report.integrity.fingerprint,
        artifact_index_fingerprint:
          artifacts.artifact_index_fingerprint,
        artifact_count: artifacts.artifact_count,
        relative_artifact_root: artifacts.relative_run_root,
        post_run_artifact_validation: validated,
      }),
    );
  } finally {
    process.removeListener("SIGINT", cancel);
    process.removeListener("SIGTERM", cancel);
  }
}

function parseArgumentsV01(args: string[]): {
  authorization_file: string;
  compatibility_probe_root: string;
  repository_root: string | null;
} {
  let authorizationFile: string | null = null;
  let compatibilityProbeRoot: string | null = null;
  let repositoryRoot: string | null = null;
  let confirmed = false;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--confirm-future-live-replacement-cohort") {
      confirmed = true;
    } else if (value === "--authorization-file") {
      authorizationFile = args[++index] ?? null;
    } else if (value === "--compatibility-probe-root") {
      compatibilityProbeRoot = args[++index] ?? null;
    } else if (value === "--repository-root") {
      repositoryRoot = args[++index] ?? null;
    } else {
      failV01("operational_reentry_replacement_argument_invalid");
    }
  }
  if (!confirmed) {
    failV01("operational_reentry_replacement_explicit_confirmation_required");
  }
  if (!authorizationFile) {
    failV01("operational_reentry_replacement_authorization_file_required");
  }
  if (!compatibilityProbeRoot) {
    failV01("operational_reentry_replacement_compatibility_root_required");
  }
  return {
    authorization_file: authorizationFile,
    compatibility_probe_root: compatibilityProbeRoot,
    repository_root: repositoryRoot,
  };
}

function readAuthorizationSourceHeadV01(value: unknown): string {
  if (
    typeof value !== "object" ||
    value === null ||
    !("exact_merged_source_head" in value) ||
    typeof value.exact_merged_source_head !== "string" ||
    !/^[0-9a-f]{40}$/u.test(value.exact_merged_source_head)
  ) {
    failV01("operational_reentry_replacement_authorization_source_head_invalid");
  }
  return value.exact_merged_source_head;
}

export function preflightOperationalReentryMatchedCohortReplacementRepositoryV01(
  repositoryRoot: string,
  sourceHead: string,
): void {
  if (
    realpathSync(gitV01(repositoryRoot, ["rev-parse", "--show-toplevel"])) !==
    repositoryRoot
  ) {
    failV01("operational_reentry_replacement_repository_root_mismatch");
  }
  if (
    !AUTHORIZED_ORIGINS_V01.has(
      gitV01(repositoryRoot, ["remote", "get-url", "origin"]),
    )
  ) {
    failV01("operational_reentry_replacement_repository_origin_mismatch");
  }
  if (gitV01(repositoryRoot, ["rev-parse", "HEAD"]) !== sourceHead) {
    failV01("operational_reentry_replacement_dirty_or_mismatched_head");
  }
  let originMain: string;
  try {
    originMain = gitV01(repositoryRoot, [
      "rev-parse",
      "--verify",
      "refs/remotes/origin/main^{commit}",
    ]);
  } catch {
    failV01("operational_reentry_replacement_origin_main_unavailable");
  }
  if (originMain !== sourceHead) {
    failV01("operational_reentry_replacement_source_not_exact_origin_main");
  }
  if (
    gitV01(repositoryRoot, [
      "status",
      "--porcelain",
      "--untracked-files=all",
    ]) !== ""
  ) {
    failV01("operational_reentry_replacement_dirty_or_mismatched_head");
  }
}

function gitV01(repositoryRoot: string, args: string[]): string {
  return execFileSync("git", ["-C", repositoryRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function failV01(code: string): never {
  throw new Error(code);
}
