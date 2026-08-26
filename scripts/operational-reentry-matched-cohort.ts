#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";

import {
  beginOperationalReentryMatchedCohortAttemptV01,
  validateOperationalReentryMatchedCohortArtifactsV01,
} from "@/lib/vnext/operational-reentry-matched-cohort-artifact-store";
import {
  ACGC_E2_COST_CEILING_NANO_USD_V01,
  buildOperationalReentryMatchedCohortV01,
  runOperationalReentryMatchedCohortV01,
} from "@/lib/vnext/operational-reentry-matched-cohort";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV01,
  readDefaultModelGatewayLocalCapabilityV01,
  readModelGatewayInteractiveAdmissionForRootV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { matchCanonicalRepositoryIdentity } from "./canonical-repository-identity.mjs";

const AUTHORIZED_ORIGINS = new Set([
  "https://github.com/hynk-studio/augnes.git",
]);
const AUTHORIZED_BRANCH = "codex/acgc-e2-live-matched-reentry-cohort";

void main().catch((error) => {
  console.error("operational_reentry_matched_cohort_failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  const options = parseArgumentsV01(process.argv.slice(2));
  const repositoryRoot = realpathSync(options.repositoryRoot ?? process.cwd());
  matchCanonicalRepositoryIdentity({
    resolvedRoot: repositoryRoot,
    originUrl: gitV01(repositoryRoot, ["remote", "get-url", "origin"]),
  });
  preflightRepositoryV01(repositoryRoot, options.sourceHead);
  const capability = readDefaultModelGatewayLocalCapabilityV01();
  if (capability.status !== "available") {
    failV01(`operational_reentry_cohort_gateway_${capability.status}`);
  }
  const admission = readModelGatewayInteractiveAdmissionForRootV01(repositoryRoot);
  const route = await prepareOperationalReentryMatchedCohortModelGatewayRouteV01();
  if (!route) failV01("operational_reentry_cohort_route_unavailable");
  const evaluatedAt = new Date().toISOString();
  const prepared = buildOperationalReentryMatchedCohortV01({
    source_head: options.sourceHead,
    admission,
    route,
    evaluated_at: evaluatedAt,
  });
  validateZeroEgressPreflightV01(prepared);

  const journal = beginOperationalReentryMatchedCohortAttemptV01({
    repository_root: repositoryRoot,
    manifest: prepared.manifest,
    call_plan: prepared.call_plan,
    pricing: prepared.pricing,
  });
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    const result = await runOperationalReentryMatchedCohortV01(
      {
        source_head: options.sourceHead,
        admission,
        route,
        evaluated_at: evaluatedAt,
      },
      {
        cancellation_signal: cancellation.signal,
        on_attempt_prepared(identity) {
          if (
            identity.manifest.integrity.fingerprint !== prepared.manifest.integrity.fingerprint ||
            identity.call_plan.integrity.fingerprint !== prepared.call_plan.integrity.fingerprint ||
            identity.case.integrity.fingerprint !== prepared.case.integrity.fingerprint ||
            identity.rubric.integrity.fingerprint !== prepared.rubric.integrity.fingerprint ||
            identity.pricing.integrity.fingerprint !== prepared.pricing.integrity.fingerprint
          ) failV01("operational_reentry_cohort_frozen_identity_changed");
        },
        assert_source_unchanged() {
          preflightRepositoryV01(repositoryRoot, options.sourceHead);
        },
        on_first_egress_attempt() {
          journal.consume_authorization();
        },
        on_call_terminal(call) {
          journal.append_call(call);
        },
        on_block_evaluation(block) {
          journal.append_block(block);
        },
      },
    );
    const artifactSummary = journal.finalize(result);
    const validatedArtifacts = validateOperationalReentryMatchedCohortArtifactsV01({
      repository_root: repositoryRoot,
      run_root: journal.run_root,
    });
    console.log(JSON.stringify({
      status: result.result_kind === "complete"
        ? "operational_reentry_matched_cohort_complete"
        : "operational_reentry_matched_cohort_truthful_incomplete",
      issue_number: 185,
      source_repository_head_sha: result.manifest.source_repository_head_sha,
      cohort_id: result.manifest.cohort_id,
      cohort_fingerprint: result.manifest.integrity.fingerprint,
      case_fingerprint: result.case.integrity.fingerprint,
      rubric_fingerprint: result.rubric.integrity.fingerprint,
      call_plan_fingerprint: result.call_plan.integrity.fingerprint,
      route_fingerprint: result.manifest.route.integrity_fingerprint,
      pricing_fingerprint: result.pricing.integrity.fingerprint,
      provider_ref: result.manifest.route.provider_ref,
      model_ref: result.manifest.route.model_ref,
      adapter_implementation_id: result.manifest.route.adapter_implementation_id,
      adapter_implementation_version: result.manifest.route.adapter_implementation_version,
      planned_calls: result.report.planned_calls,
      terminal_calls: result.report.terminal_calls,
      terminal_category_counts: result.report.terminal_category_counts,
      accounting: result.report.accounting,
      blocks: result.report.block_evaluations.map((block) => ({
        repeat_block: block.repeat_block,
        status: block.status,
        e1_conditioning_relation: block.e1_conditioning_relation,
        e1_reset_relation: block.e1_reset_relation,
        pairwise_relations: block.pairwise_relations,
      })),
      repeatability: result.report.repeatability,
      exact_case_dispositions: result.report.exact_case_dispositions,
      authority_ledger: result.report.authority_ledger,
      report_fingerprint: result.report.integrity.fingerprint,
      artifact_index_fingerprint: artifactSummary.artifact_index_fingerprint,
      artifact_count: artifactSummary.artifact_count,
      relative_artifact_root: artifactSummary.relative_run_root,
      attempt_fingerprint: journal.attempt_fingerprint,
      post_live_artifact_validation: validatedArtifacts,
    }));
  } finally {
    process.removeListener("SIGINT", cancel);
    process.removeListener("SIGTERM", cancel);
  }
}

function parseArgumentsV01(args: string[]) {
  let sourceHead: string | null = null;
  let authorizationIssue: string | null = null;
  let maximumCost: string | null = null;
  let repositoryRoot: string | null = null;
  let confirmed = false;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--confirm-authorized-cohort") confirmed = true;
    else if (value === "--authorization-issue") authorizationIssue = args[++index] ?? null;
    else if (value === "--source-head") sourceHead = args[++index] ?? null;
    else if (value === "--max-total-cost-usd") maximumCost = args[++index] ?? null;
    else if (value === "--repository-root") repositoryRoot = args[++index] ?? null;
    else failV01("operational_reentry_cohort_argument_invalid");
  }
  if (!confirmed) failV01("operational_reentry_cohort_confirmation_required");
  if (authorizationIssue !== "185") failV01("operational_reentry_cohort_issue_authorization_invalid");
  if (!sourceHead || !/^[0-9a-f]{40}$/u.test(sourceHead)) {
    failV01("operational_reentry_cohort_source_head_invalid");
  }
  if (maximumCost !== "5.00") failV01("operational_reentry_cohort_cost_ceiling_invalid");
  return { sourceHead, repositoryRoot, maximumCost };
}

function preflightRepositoryV01(repositoryRoot: string, sourceHead: string): void {
  if (realpathSync(gitV01(repositoryRoot, ["rev-parse", "--show-toplevel"])) !== repositoryRoot) {
    failV01("operational_reentry_cohort_repository_root_mismatch");
  }
  if (!AUTHORIZED_ORIGINS.has(gitV01(repositoryRoot, ["remote", "get-url", "origin"]))) {
    failV01("operational_reentry_cohort_repository_origin_mismatch");
  }
  if (gitV01(repositoryRoot, ["branch", "--show-current"]) !== AUTHORIZED_BRANCH) {
    failV01("operational_reentry_cohort_branch_mismatch");
  }
  if (gitV01(repositoryRoot, ["rev-parse", "HEAD"]) !== sourceHead) {
    failV01("operational_reentry_cohort_source_head_mismatch");
  }
  if (gitV01(repositoryRoot, ["status", "--porcelain", "--untracked-files=all"]) !== "") {
    failV01("operational_reentry_cohort_tracked_worktree_not_clean");
  }
}

function validateZeroEgressPreflightV01(
  prepared: ReturnType<typeof buildOperationalReentryMatchedCohortV01>,
): void {
  if (
    prepared.call_plan.planned_calls !== 16 ||
    prepared.call_plan.entries.length !== 16 ||
    prepared.call_plan.max_parallel_provider_calls !== 1 ||
    prepared.call_plan.retries !== 0 ||
    prepared.call_plan.replacement_calls !== 0 ||
    prepared.call_plan.adaptive_stopping !== false ||
    prepared.pricing.aggregate_worst_case_cost_nano_usd >
      ACGC_E2_COST_CEILING_NANO_USD_V01
  ) failV01("operational_reentry_cohort_preflight_invalid");
  const providerVisible = canonicalizeProtocolValueV01(
    prepared.call_plan.entries.map((entry) => entry.model_input),
  );
  for (const forbidden of [
    "evaluator_only",
    "model_as_judge_calls",
    "aggregate_rules",
    "bounded_positive_min_better",
    "bounded_positive_min_structured_delta",
    "left_arm",
    "right_arm",
  ]) {
    if (providerVisible.includes(forbidden)) {
      failV01("operational_reentry_cohort_evaluator_material_leakage");
    }
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
