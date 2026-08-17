#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";

import {
  beginOperationalReentryProviderCompatibilityProbeAttemptV01,
  validateOperationalReentryProviderCompatibilityProbeArtifactsV01,
} from "@/lib/vnext/operational-reentry-provider-compatibility-probe-artifact-store";
import {
  buildOperationalReentryProviderCompatibilityProbeV01,
  runOperationalReentryProviderCompatibilityProbeV01,
} from "@/lib/vnext/operational-reentry-provider-compatibility-probe";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV01,
  readDefaultModelGatewayLocalCapabilityV01,
  readModelGatewayInteractiveAdmissionForRootV01,
} from "@/lib/vnext/model-gateway/model-gateway";

const AUTHORIZED_ORIGINS_V01 = new Set([
  "https://github.com/hynk-studio/augnes-perspective-lab.git",
  "git@github.com:hynk-studio/augnes-perspective-lab.git",
]);

void main().catch((error) => {
  console.error("operational_reentry_provider_compatibility_probe_failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const options = parseArgumentsV01(process.argv.slice(2));
  const repositoryRoot = realpathSync(
    options.repository_root ?? process.cwd(),
  );
  const authorization = JSON.parse(
    readFileSync(options.authorization_file, "utf8"),
  ) as unknown;
  const sourceHead = readAuthorizationSourceHeadV01(authorization);
  preflightRepositoryV01(repositoryRoot, sourceHead);

  const capability = readDefaultModelGatewayLocalCapabilityV01();
  if (capability.status !== "available") {
    failV01(`operational_reentry_probe_gateway_${capability.status}`);
  }
  const admission =
    readModelGatewayInteractiveAdmissionForRootV01(repositoryRoot);
  const route =
    await prepareOperationalReentryMatchedCohortModelGatewayRouteV01();
  if (!route) failV01("operational_reentry_probe_route_unavailable");
  const evaluatedAt = new Date().toISOString();
  const prepared =
    buildOperationalReentryProviderCompatibilityProbeV01({
      authorization,
      admission,
      route,
      evaluated_at: evaluatedAt,
    });
  const journal =
    beginOperationalReentryProviderCompatibilityProbeAttemptV01({
      repository_root: repositoryRoot,
      prepared,
    });
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    const result =
      await runOperationalReentryProviderCompatibilityProbeV01(
        {
          authorization,
          admission,
          route,
          evaluated_at: evaluatedAt,
        },
        {
          cancellation_signal: cancellation.signal,
          assert_source_unchanged() {
            preflightRepositoryV01(repositoryRoot, sourceHead);
          },
          consume_authorization(consumption) {
            journal.consume_authorization({
              authorization_fingerprint:
                consumption.authorization.integrity.fingerprint,
              probe_id: consumption.probe_id,
            });
          },
          on_shape_terminal(shape) {
            journal.append_shape(shape);
          },
        },
      );
    const artifacts = journal.finalize(result);
    const validated =
      validateOperationalReentryProviderCompatibilityProbeArtifactsV01({
        repository_root: repositoryRoot,
        run_root: journal.run_root,
      });
    console.log(
      JSON.stringify({
        status:
          result.report.outcome === "accepted_all_shapes"
            ? "operational_reentry_provider_compatibility_probe_accepted_all_shapes"
            : "operational_reentry_provider_compatibility_probe_terminal",
        future_live_issue_number:
          result.manifest.future_live_issue_number,
        source_repository_head_sha:
          result.manifest.source_repository_head_sha,
        probe_id: result.manifest.probe_id,
        probe_fingerprint: result.manifest.integrity.fingerprint,
        authorization_fingerprint:
          result.authorization.integrity.fingerprint,
        plan_fingerprint: result.plan.integrity.fingerprint,
        request_family_kind: result.plan.request_family_kind,
        request_family_trace_id: result.plan.request_family_trace_id,
        route_fingerprint:
          result.manifest.route.integrity_fingerprint,
        provider_contract_fingerprint:
          result.provider_contract.integrity.fingerprint,
        pricing_fingerprint: result.pricing.integrity.fingerprint,
        pricing_authority_fingerprint:
          result.pricing.gateway_cost_budget.authority.pricing_fingerprint,
        planned_shapes: result.report.planned_shapes,
        terminal_shape_count: result.report.terminal_shape_count,
        attempted_provider_calls: result.report.attempted_provider_calls,
        outcome: result.report.outcome,
        terminal_category_counts:
          result.report.terminal_category_counts,
        exact_cost: result.report.exact_cost,
        authority_ledger: result.report.authority_ledger,
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
  repository_root: string | null;
} {
  let authorizationFile: string | null = null;
  let repositoryRoot: string | null = null;
  let confirmed = false;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--confirm-future-live-compatibility-probe") {
      confirmed = true;
    } else if (value === "--authorization-file") {
      authorizationFile = args[++index] ?? null;
    } else if (value === "--repository-root") {
      repositoryRoot = args[++index] ?? null;
    } else {
      failV01("operational_reentry_probe_argument_invalid");
    }
  }
  if (!confirmed) {
    failV01("operational_reentry_probe_explicit_confirmation_required");
  }
  if (!authorizationFile) {
    failV01("operational_reentry_probe_authorization_file_required");
  }
  return {
    authorization_file: authorizationFile,
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
    failV01("operational_reentry_probe_authorization_source_head_invalid");
  }
  return value.exact_merged_source_head;
}

function preflightRepositoryV01(
  repositoryRoot: string,
  sourceHead: string,
): void {
  if (
    realpathSync(gitV01(repositoryRoot, ["rev-parse", "--show-toplevel"])) !==
    repositoryRoot
  ) {
    failV01("operational_reentry_probe_repository_root_mismatch");
  }
  if (
    !AUTHORIZED_ORIGINS_V01.has(
      gitV01(repositoryRoot, ["remote", "get-url", "origin"]),
    )
  ) {
    failV01("operational_reentry_probe_repository_origin_mismatch");
  }
  if (gitV01(repositoryRoot, ["rev-parse", "HEAD"]) !== sourceHead) {
    failV01("operational_reentry_probe_dirty_or_mismatched_head");
  }
  if (
    gitV01(repositoryRoot, [
      "status",
      "--porcelain",
      "--untracked-files=all",
    ]) !== ""
  ) {
    failV01("operational_reentry_probe_dirty_or_mismatched_head");
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
