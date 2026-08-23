#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  assertOperationalReentryV04StaleResetIsolationAuthorizationUnusedV01,
  assertOperationalReentryV04StaleResetIsolationIdentityAvailableV01,
  beginOperationalReentryV04StaleResetIsolationAttemptV01,
  validateOperationalReentryV04StaleResetIsolationArtifactsV01,
} from "@/lib/vnext/operational-reentry-v0-4-stale-reset-isolation-artifact-store";
import {
  buildOperationalReentryV04StaleResetIsolationCohortV01,
  runOperationalReentryV04StaleResetIsolationCohortV01,
} from "@/lib/vnext/operational-reentry-v0-4-stale-reset-isolation-cohort";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV04,
  readDefaultModelGatewayLocalCapabilityV01,
  readModelGatewayInteractiveAdmissionForRootV01,
} from "@/lib/vnext/model-gateway/model-gateway";

const AUTHORIZED_REPOSITORY_SLUG_V01 =
  "hynk-studio/augnes-perspective-lab" as const;
const AUTHORIZED_ORIGINS_V01 = new Set([
  "https://github.com/hynk-studio/augnes-perspective-lab.git",
  "git@github.com:hynk-studio/augnes-perspective-lab.git",
]);

if (
  process.argv[1] &&
  pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url
) {
  void main().catch((error) => {
    console.error(
      "operational_reentry_v04_stale_reset_isolation_cohort_failed",
    );
    console.error(boundedErrorCodeV01(error));
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
  const pricing = JSON.parse(
    readFileSync(options.pricing_file, "utf8"),
  ) as unknown;
  const authorizationIdentity = readAuthorizationRepositoryIdentityV01(
    authorization,
  );
  preflightOperationalReentryV04StaleResetIsolationRepositoryV01(
    repositoryRoot,
    authorizationIdentity,
  );

  const capability = readDefaultModelGatewayLocalCapabilityV01();
  if (capability.status !== "available") {
    failV01(
      `operational_reentry_v04_stale_reset_gateway_${capability.status}`,
    );
  }
  const admission = readModelGatewayInteractiveAdmissionForRootV01(
    repositoryRoot,
  );
  const route =
    await prepareOperationalReentryMatchedCohortModelGatewayRouteV04();
  if (!route) {
    failV01("operational_reentry_v04_stale_reset_route_unavailable");
  }
  const evaluatedAt = new Date().toISOString();
  const buildInput = {
    authorization,
    pricing,
    admission,
    route,
    repository_identity: {
      repository_slug: AUTHORIZED_REPOSITORY_SLUG_V01,
      origin: authorizationIdentity.authorized_origin,
    },
    evaluated_at: evaluatedAt,
  };
  const prepared =
    buildOperationalReentryV04StaleResetIsolationCohortV01(buildInput);
  assertOperationalReentryV04StaleResetIsolationAuthorizationUnusedV01({
    repository_root: repositoryRoot,
    authorization_fingerprint:
      prepared.authorization.integrity.fingerprint,
  });
  assertOperationalReentryV04StaleResetIsolationIdentityAvailableV01({
    repository_root: repositoryRoot,
    cohort_id: prepared.manifest.cohort_id,
    future_live_issue_number: prepared.manifest.future_live_issue_number,
  });

  const journal =
    beginOperationalReentryV04StaleResetIsolationAttemptV01({
      repository_root: repositoryRoot,
      authorization: prepared.authorization,
      manifest: prepared.manifest,
      plan: prepared.plan,
      pricing: prepared.pricing,
    });
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    const result =
      await runOperationalReentryV04StaleResetIsolationCohortV01(
        buildInput,
        {
          cancellation_signal: cancellation.signal,
          assert_execution_state() {
            preflightOperationalReentryV04StaleResetIsolationRepositoryV01(
              repositoryRoot,
              authorizationIdentity,
            );
          },
          consume_authorization(consumption) {
            if (
              consumption.authorization.integrity.fingerprint !==
                prepared.authorization.integrity.fingerprint ||
              consumption.cohort_id !== prepared.manifest.cohort_id
            ) {
              failV01(
                "operational_reentry_v04_stale_reset_consumption_identity_drift",
              );
            }
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
    const artifacts = journal.finalize(result);
    const validated =
      validateOperationalReentryV04StaleResetIsolationArtifactsV01({
        repository_root: repositoryRoot,
        run_root: journal.run_root,
      });
    console.log(
      JSON.stringify({
        status:
          result.report.completion_status === "complete"
            ? "operational_reentry_v04_stale_reset_isolation_complete"
            : "operational_reentry_v04_stale_reset_isolation_incomplete",
        future_live_issue_number:
          result.manifest.future_live_issue_number,
        source_repository_head_sha:
          result.manifest.source_repository_head_sha,
        cohort_id: result.manifest.cohort_id,
        cohort_fingerprint: result.manifest.integrity.fingerprint,
        authorization_fingerprint:
          result.authorization.integrity.fingerprint,
        plan_fingerprint: result.plan.integrity.fingerprint,
        gate_contract_fingerprint:
          result.gate_contract.integrity.fingerprint,
        evaluator_fingerprint:
          result.evaluator_contract.integrity.fingerprint,
        route_fingerprint: result.manifest.route.integrity_fingerprint,
        provider_contract_fingerprint:
          result.manifest.provider_contract_fingerprint,
        attempted_provider_calls: result.report.attempted_provider_calls,
        real_provider_calls: result.report.real_provider_calls,
        complete_blocks: result.report.complete_blocks,
        all_six_pair_records: result.report.all_six_pair_records,
        retries: result.report.retries,
        replacement_calls: result.report.replacement_calls,
        report_fingerprint: result.report.integrity.fingerprint,
        artifact_index_fingerprint:
          artifacts.artifact_index_fingerprint,
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
  pricing_file: string;
  repository_root: string | null;
} {
  let authorizationFile: string | null = null;
  let pricingFile: string | null = null;
  let repositoryRoot: string | null = null;
  let confirmed = false;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (
      value ===
      "--confirm-operational-reentry-v04-stale-reset-isolation-cohort"
    ) {
      confirmed = true;
    } else if (value === "--authorization-file") {
      authorizationFile = args[++index] ?? null;
    } else if (value === "--pricing-file") {
      pricingFile = args[++index] ?? null;
    } else if (value === "--repository-root") {
      repositoryRoot = args[++index] ?? null;
    } else {
      failV01("operational_reentry_v04_stale_reset_argument_invalid");
    }
  }
  if (!confirmed) {
    failV01(
      "operational_reentry_v04_stale_reset_explicit_confirmation_required",
    );
  }
  if (!authorizationFile) {
    failV01("operational_reentry_v04_stale_reset_authorization_file_required");
  }
  if (!pricingFile) {
    failV01("operational_reentry_v04_stale_reset_pricing_file_required");
  }
  return {
    authorization_file: authorizationFile,
    pricing_file: pricingFile,
    repository_root: repositoryRoot,
  };
}

function readAuthorizationRepositoryIdentityV01(value: unknown): {
  exact_merged_source_head: string;
  repository_slug: typeof AUTHORIZED_REPOSITORY_SLUG_V01;
  authorized_origin: string;
} {
  if (
    typeof value !== "object" ||
    value === null ||
    !("exact_merged_source_head" in value) ||
    typeof value.exact_merged_source_head !== "string" ||
    !/^[0-9a-f]{40}$/u.test(value.exact_merged_source_head) ||
    !("repository_slug" in value) ||
    value.repository_slug !== AUTHORIZED_REPOSITORY_SLUG_V01 ||
    !("authorized_origin" in value) ||
    typeof value.authorized_origin !== "string" ||
    !AUTHORIZED_ORIGINS_V01.has(value.authorized_origin)
  ) {
    failV01(
      "operational_reentry_v04_stale_reset_authorization_repository_identity_invalid",
    );
  }
  return {
    exact_merged_source_head: value.exact_merged_source_head,
    repository_slug: AUTHORIZED_REPOSITORY_SLUG_V01,
    authorized_origin: value.authorized_origin,
  };
}

export function preflightOperationalReentryV04StaleResetIsolationRepositoryV01(
  repositoryRoot: string,
  authorizationIdentity: {
    exact_merged_source_head: string;
    repository_slug: string;
    authorized_origin: string;
  },
): void {
  if (
    authorizationIdentity.repository_slug !==
      AUTHORIZED_REPOSITORY_SLUG_V01 ||
    !AUTHORIZED_ORIGINS_V01.has(authorizationIdentity.authorized_origin)
  ) {
    failV01("operational_reentry_v04_stale_reset_repository_identity_mismatch");
  }
  if (
    realpathSync(gitV01(repositoryRoot, ["rev-parse", "--show-toplevel"])) !==
    repositoryRoot
  ) {
    failV01("operational_reentry_v04_stale_reset_repository_root_mismatch");
  }
  const observedOrigin = gitV01(repositoryRoot, [
    "remote",
    "get-url",
    "origin",
  ]);
  if (
    observedOrigin !== authorizationIdentity.authorized_origin ||
    !AUTHORIZED_ORIGINS_V01.has(observedOrigin)
  ) {
    failV01("operational_reentry_v04_stale_reset_repository_origin_mismatch");
  }
  if (
    gitV01(repositoryRoot, ["rev-parse", "HEAD"]) !==
    authorizationIdentity.exact_merged_source_head
  ) {
    failV01("operational_reentry_v04_stale_reset_head_mismatch");
  }
  let exactOriginMain: string;
  try {
    exactOriginMain = gitV01(repositoryRoot, [
      "rev-parse",
      "--verify",
      "refs/remotes/origin/main^{commit}",
    ]);
  } catch {
    failV01("operational_reentry_v04_stale_reset_origin_main_unavailable");
  }
  if (exactOriginMain !== authorizationIdentity.exact_merged_source_head) {
    failV01("operational_reentry_v04_stale_reset_head_not_exact_origin_main");
  }
  if (
    gitV01(repositoryRoot, [
      "status",
      "--porcelain",
      "--untracked-files=all",
    ]) !== ""
  ) {
    failV01("operational_reentry_v04_stale_reset_worktree_not_clean");
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

function boundedErrorCodeV01(error: unknown): string {
  if (
    error instanceof Error &&
    /^[a-z0-9_]{1,180}$/u.test(error.message)
  ) {
    return error.message;
  }
  return "operational_reentry_v04_stale_reset_runtime_failed";
}
