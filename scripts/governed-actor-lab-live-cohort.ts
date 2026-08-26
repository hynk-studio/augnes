#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";

import { matchCanonicalMigrationBridgeIdentity } from "./canonical-repository-migration-bridge.mjs";
import { governedActorLabLiveCasebookFixture } from "@/fixtures/vnext/protocol/governed-actor-lab-live-v0-1";
import { createGovernedActorLabManifestV01 } from "@/fixtures/vnext/protocol/governed-actor-lab-v0-1";
import {
  beginGovernedActorLabLiveCohortAttemptV01,
} from "@/lib/vnext/governed-actor-lab-artifact-store";
import {
  buildGovernedActorLabLiveCohortManifestV01,
  createGovernedActorLabLiveReplacementAuthorizationV01,
  runGovernedActorLabLiveCohortV01,
} from "@/lib/vnext/governed-actor-lab-live";
import { canonicalizeGovernedActorLabValueV01 } from "@/lib/vnext/governed-actor-lab";
import {
  prepareGovernedActorLabModelGatewayRouteV01,
  readDefaultModelGatewayLocalCapabilityV01,
  readModelGatewayInteractiveAdmissionForRootV01,
} from "@/lib/vnext/model-gateway/model-gateway";

void main().catch((error) => {
  console.error("governed_actor_lab_live_cohort_failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  const options = parseArgumentsV01(process.argv.slice(2));
  const repositoryRoot = realpathSync(options.repositoryRoot ?? process.cwd());
  if (realpathSync(gitV01(repositoryRoot, ["rev-parse", "--show-toplevel"])) !== repositoryRoot) {
    failV01("live_cohort_repository_root_mismatch");
  }
  try {
    matchCanonicalMigrationBridgeIdentity({
      resolvedRoot: repositoryRoot,
      originUrl: gitV01(repositoryRoot, ["remote", "get-url", "origin"]),
    });
  } catch {
    failV01("live_cohort_repository_identity_mismatch");
  }
  if (!/^[0-9a-f]{40}$/u.test(options.sourceHead)) {
    failV01("live_cohort_source_head_invalid");
  }
  const currentHead = gitV01(repositoryRoot, ["rev-parse", "HEAD"]);
  if (currentHead !== options.sourceHead) failV01("live_cohort_source_head_mismatch");
  if (gitV01(repositoryRoot, ["status", "--porcelain", "--untracked-files=no"]) !== "") {
    failV01("live_cohort_tracked_worktree_not_clean");
  }
  const capability = readDefaultModelGatewayLocalCapabilityV01();
  if (capability.status !== "available") {
    failV01(`live_cohort_model_gateway_${capability.status}`);
  }
  const admission = readModelGatewayInteractiveAdmissionForRootV01(repositoryRoot);
  const route = await prepareGovernedActorLabModelGatewayRouteV01();
  if (!route) failV01("live_cohort_provider_route_unavailable");
  const c1Manifest = createGovernedActorLabManifestV01();
  const casebook = structuredClone(governedActorLabLiveCasebookFixture);
  const prepared = buildGovernedActorLabLiveCohortManifestV01({
    source_repository_head_sha: options.sourceHead,
    authorization_lineage: options.authorizationLineage,
    c1_manifest: c1Manifest,
    casebook,
    route,
  });
  if (
    prepared.call_plan.entries.length !== 140 ||
    prepared.call_plan.aggregate_provider_call_ceiling !== 140 ||
    prepared.call_plan.max_parallel_provider_calls !== 1 ||
    prepared.call_plan.retries !== 0
  ) failV01("live_cohort_call_plan_invalid");
  const preHoldoutMaterial = canonicalizeGovernedActorLabValueV01({
    manifest: prepared.manifest,
    call_plan: prepared.call_plan,
  });
  for (const holdout of casebook.hidden_holdout.cases) {
    if (
      preHoldoutMaterial.includes(holdout.actor_visible.task_text) ||
      preHoldoutMaterial.includes(holdout.evaluator_only.expected_result_token) ||
      holdout.evaluator_only.required_support_relations.some((relation) =>
        preHoldoutMaterial.includes(relation.claim_token),
      )
    ) failV01("live_cohort_holdout_pre_freeze_leakage");
  }
  const attempt = beginGovernedActorLabLiveCohortAttemptV01({
    repository_root: repositoryRoot,
    run_label: options.runLabel,
    result_identity: prepared,
  });
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    const result = await runGovernedActorLabLiveCohortV01(
      {
        source_repository_head_sha: options.sourceHead,
        authorization_lineage: options.authorizationLineage,
        c1_manifest: c1Manifest,
        casebook,
        route,
        admission,
      },
      {
        cancellation_signal: cancellation.signal,
        on_attempt_prepared(identity) {
          if (
            identity.manifest.integrity.fingerprint !==
              prepared.manifest.integrity.fingerprint ||
            identity.call_plan.integrity.fingerprint !==
              prepared.call_plan.integrity.fingerprint
          ) {
            failV01("live_cohort_attempt_identity_changed");
          }
        },
        on_binding_finalized(binding) {
          attempt.append_binding(binding);
        },
        on_checkpoint_finalized(checkpoint) {
          attempt.append_checkpoint(checkpoint);
        },
      },
    );
    const finalHead = gitV01(repositoryRoot, ["rev-parse", "HEAD"]);
    const finalTrackedStatus = gitV01(repositoryRoot, [
      "status",
      "--porcelain",
      "--untracked-files=no",
    ]);
    if (finalHead !== options.sourceHead || finalTrackedStatus !== "") {
      failV01("live_cohort_source_head_changed_after_egress");
    }
    const artifacts = attempt.finalize(result);
    console.log(JSON.stringify({
      status: result.result_kind === "complete"
        ? "live_cohort_complete"
        : "live_cohort_truthful_incomplete",
      source_repository_head_sha: result.manifest.source_repository_head_sha,
      cohort_id: result.manifest.cohort_id,
      cohort_fingerprint: result.manifest.integrity.fingerprint,
      call_plan_fingerprint: result.call_plan.integrity.fingerprint,
      provider_ref: result.manifest.route.provider_ref,
      model_ref: result.manifest.route.model_ref,
      adapter_implementation_id:
        result.manifest.route.adapter_implementation_id,
      adapter_implementation_version:
        result.manifest.route.adapter_implementation_version,
      planned_calls: result.report.accounting.planned_calls,
      attempted_provider_calls:
        result.report.accounting.attempted_provider_calls,
      completed_live_calls: result.report.accounting.completed_live_calls,
      provider_rejected: result.report.accounting.provider_rejected,
      malformed_response: result.report.accounting.malformed_response,
      timed_out: result.report.accounting.timed_out,
      cancelled: result.report.accounting.cancelled,
      transport_failed: result.report.accounting.transport_failed,
      refused: result.report.accounting.refused,
      dependency_missing: result.report.accounting.dependency_missing,
      usage: {
        input_bytes: result.report.accounting.input_bytes,
        input_tokens_provider_reported:
          result.report.accounting.input_tokens_provider_reported,
        output_tokens_provider_reported:
          result.report.accounting.output_tokens_provider_reported,
        total_tokens_provider_reported:
          result.report.accounting.total_tokens_provider_reported,
      },
      latency: {
        total_ms: result.report.accounting.latency_ms_total,
        min_ms: result.report.accounting.latency_ms_min,
        max_ms: result.report.accounting.latency_ms_max,
      },
      pricing_status: result.report.accounting.pricing_status,
      exact_cost: result.report.accounting.exact_cost,
      stochastic_repeatability: result.report.stochastic_repeatability,
      non_dominance: result.report.non_dominance,
      comparisons: result.report.comparisons,
      report_fingerprint: result.report.integrity.fingerprint,
      artifact_index_fingerprint: artifacts.artifact_index_fingerprint,
      artifact_count: artifacts.artifact_count,
      relative_artifact_root: artifacts.relative_run_root,
      attempt_fingerprint: attempt.attempt_fingerprint,
      product_database_writes: artifacts.product_database_writes,
      core_writes: artifacts.core_writes,
      tracked_repository_files_written:
        artifacts.tracked_repository_files_written,
      authority_boundary: result.report.authority_boundary,
    }));
  } finally {
    process.removeListener("SIGINT", cancel);
    process.removeListener("SIGTERM", cancel);
  }
}

function parseArgumentsV01(args: string[]) {
  let sourceHead: string | null = null;
  let runLabel: string | null = null;
  let repositoryRoot: string | null = null;
  let confirmed = false;
  let authorizationKind: string | null = null;
  let historicalSourceHead: string | null = null;
  let historicalCohortId: string | null = null;
  let historicalResult: string | null = null;
  let historicalTerminalReason: string | null = null;
  let authorizedReplacementCount: number | null = null;
  let retryOfHistoricalCohort: boolean | null = null;
  let historicalArtifactsRewritten: boolean | null = null;
  let furtherCohortAuthorized: boolean | null = null;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--source-head") sourceHead = args[++index] ?? null;
    else if (value === "--run-label") runLabel = args[++index] ?? null;
    else if (value === "--repository-root") repositoryRoot = args[++index] ?? null;
    else if (value === "--confirm-authorized-cohort") confirmed = true;
    else if (value === "--authorization-kind") authorizationKind = args[++index] ?? null;
    else if (value === "--historical-source-head") historicalSourceHead = args[++index] ?? null;
    else if (value === "--historical-cohort-id") historicalCohortId = args[++index] ?? null;
    else if (value === "--historical-result") historicalResult = args[++index] ?? null;
    else if (value === "--historical-terminal-reason") {
      historicalTerminalReason = args[++index] ?? null;
    } else if (value === "--authorized-replacement-count") {
      authorizedReplacementCount = Number(args[++index] ?? Number.NaN);
    } else if (value === "--retry-of-historical-cohort") {
      retryOfHistoricalCohort = parseFalseBooleanV01(args[++index]);
    } else if (value === "--historical-artifacts-rewritten") {
      historicalArtifactsRewritten = parseFalseBooleanV01(args[++index]);
    } else if (value === "--further-cohort-authorized") {
      furtherCohortAuthorized = parseFalseBooleanV01(args[++index]);
    } else if (value === "--confirm-first-cohort") {
      failV01("live_cohort_first_cohort_confirmation_retired");
    }
    else failV01("live_cohort_argument_invalid");
  }
  if (!sourceHead || !confirmed || !authorizationKind) {
    failV01("live_cohort_explicit_authorization_required");
  }
  if (authorizationKind === "initial_authorized_cohort") {
    failV01("live_cohort_initial_authorization_already_consumed");
  }
  if (authorizationKind !== "authorized_replacement_after_historical_incomplete") {
    failV01("live_cohort_authorization_kind_invalid");
  }
  const authorizationLineage = createGovernedActorLabLiveReplacementAuthorizationV01({
    replacement_source_head: sourceHead,
    historical_source_head: historicalSourceHead ?? "",
    historical_cohort_id: historicalCohortId ?? "",
    historical_result: historicalResult ?? "",
    historical_terminal_reason: historicalTerminalReason ?? "",
    authorized_replacement_count: authorizedReplacementCount ?? Number.NaN,
    retry_of_historical_cohort: retryOfHistoricalCohort ?? true,
    historical_artifacts_rewritten: historicalArtifactsRewritten ?? true,
    further_cohort_authorized: furtherCohortAuthorized ?? true,
  });
  const label = runLabel ?? `replacement-cohort-${sourceHead.slice(0, 12)}`;
  if (!/^[A-Za-z0-9._-]{1,200}$/u.test(label) || label === "." || label === "..") {
    failV01("live_cohort_run_label_invalid");
  }
  return { sourceHead, runLabel: label, repositoryRoot, authorizationLineage };
}

function parseFalseBooleanV01(value: string | undefined): false {
  if (value !== "false") failV01("live_cohort_authorization_boolean_invalid");
  return false;
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
