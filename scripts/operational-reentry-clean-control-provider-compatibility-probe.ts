#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  beginOperationalReentryCleanControlProviderCompatibilityProbeAttemptV02,
  validateOperationalReentryCleanControlProviderCompatibilityProbeArtifactsV02,
} from "@/lib/vnext/operational-reentry-clean-control-provider-compatibility-probe-artifact-store";
import {
  buildOperationalReentryCleanControlProviderCompatibilityProbeV02,
  runOperationalReentryCleanControlProviderCompatibilityProbeV02,
} from "@/lib/vnext/operational-reentry-clean-control-provider-compatibility-probe";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV02,
  readDefaultModelGatewayLocalCapabilityV01,
  readModelGatewayInteractiveAdmissionForRootV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import { matchCanonicalRepositoryIdentity } from "./canonical-repository-identity.mjs";

const AUTHORIZED_REPOSITORY_SLUG_V02 =
  "hynk-studio/augnes" as const;
const AUTHORIZED_ORIGINS_V02 = new Set([
  "https://github.com/hynk-studio/augnes.git",
]);

if (
  process.argv[1] &&
  pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url
) {
  void main().catch((error) => {
    console.error(
      "operational_reentry_clean_control_provider_compatibility_probe_failed",
    );
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

async function main(): Promise<void> {
  const options = parseArgumentsV02(process.argv.slice(2));
  const repositoryRoot = realpathSync(
    options.repository_root ?? process.cwd(),
  );
  matchCanonicalRepositoryIdentity({
    resolvedRoot: repositoryRoot,
    originUrl: gitV02(repositoryRoot, ["remote", "get-url", "origin"]),
  });
  const authorization = JSON.parse(
    readFileSync(options.authorization_file, "utf8"),
  ) as unknown;
  const authorizationIdentity = readAuthorizationRepositoryIdentityV02(
    authorization,
  );
  preflightOperationalReentryCleanControlProviderCompatibilityProbeRepositoryV02(
    repositoryRoot,
    authorizationIdentity,
  );

  const capability = readDefaultModelGatewayLocalCapabilityV01();
  if (capability.status !== "available") {
    failV02(`clean_control_probe_gateway_${capability.status}`);
  }
  const admission = readModelGatewayInteractiveAdmissionForRootV01(
    repositoryRoot,
  );
  const route =
    await prepareOperationalReentryMatchedCohortModelGatewayRouteV02();
  if (!route) failV02("clean_control_probe_route_unavailable");
  const evaluatedAt = new Date().toISOString();
  const buildInput = {
    authorization,
    admission,
    route,
    repository_identity: {
      repository_slug: AUTHORIZED_REPOSITORY_SLUG_V02,
      origin: authorizationIdentity.authorized_origin,
    },
    evaluated_at: evaluatedAt,
  };
  const prepared =
    buildOperationalReentryCleanControlProviderCompatibilityProbeV02(
      buildInput,
    );
  const journal =
    beginOperationalReentryCleanControlProviderCompatibilityProbeAttemptV02({
      repository_root: repositoryRoot,
      prepared,
    });
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    const result =
      await runOperationalReentryCleanControlProviderCompatibilityProbeV02(
        buildInput,
        {
          cancellation_signal: cancellation.signal,
          assert_source_unchanged() {
            preflightOperationalReentryCleanControlProviderCompatibilityProbeRepositoryV02(
              repositoryRoot,
              authorizationIdentity,
            );
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
      validateOperationalReentryCleanControlProviderCompatibilityProbeArtifactsV02(
        {
          repository_root: repositoryRoot,
          run_root: journal.run_root,
        },
      );
    console.log(
      JSON.stringify({
        status:
          result.report.outcome === "accepted_all_shapes"
            ? "operational_reentry_clean_control_provider_compatibility_probe_accepted_all_shapes"
            : "operational_reentry_clean_control_provider_compatibility_probe_terminal",
        future_live_issue_number:
          result.manifest.future_live_issue_number,
        source_repository_head_sha:
          result.manifest.source_repository_head_sha,
        probe_id: result.manifest.probe_id,
        probe_fingerprint: result.manifest.integrity.fingerprint,
        authorization_fingerprint:
          result.authorization.integrity.fingerprint,
        common_task_evidence_fingerprint:
          result.manifest.common_task_evidence_fingerprint,
        representative_shape_plan_fingerprint:
          result.representative_shape_plan.integrity.fingerprint,
        plan_fingerprint: result.plan.integrity.fingerprint,
        request_family_kind: result.plan.request_family_kind,
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
        compatibility_scope_boundary:
          result.report.compatibility_scope_boundary,
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

function parseArgumentsV02(args: string[]): {
  authorization_file: string;
  repository_root: string | null;
} {
  let authorizationFile: string | null = null;
  let repositoryRoot: string | null = null;
  let confirmed = false;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (
      value ===
      "--confirm-future-live-clean-control-compatibility-probe"
    ) {
      confirmed = true;
    } else if (value === "--authorization-file") {
      authorizationFile = args[++index] ?? null;
    } else if (value === "--repository-root") {
      repositoryRoot = args[++index] ?? null;
    } else {
      failV02("clean_control_probe_argument_invalid");
    }
  }
  if (!confirmed) {
    failV02("clean_control_probe_explicit_confirmation_required");
  }
  if (!authorizationFile) {
    failV02("clean_control_probe_authorization_file_required");
  }
  return {
    authorization_file: authorizationFile,
    repository_root: repositoryRoot,
  };
}

function readAuthorizationRepositoryIdentityV02(value: unknown): {
  exact_merged_source_head: string;
  repository_slug: typeof AUTHORIZED_REPOSITORY_SLUG_V02;
  authorized_origin: string;
} {
  if (
    typeof value !== "object" ||
    value === null ||
    !("exact_merged_source_head" in value) ||
    typeof value.exact_merged_source_head !== "string" ||
    !/^[0-9a-f]{40}$/u.test(value.exact_merged_source_head) ||
    !("repository_slug" in value) ||
    value.repository_slug !== AUTHORIZED_REPOSITORY_SLUG_V02 ||
    !("authorized_origin" in value) ||
    typeof value.authorized_origin !== "string" ||
    !AUTHORIZED_ORIGINS_V02.has(value.authorized_origin)
  ) {
    failV02("clean_control_probe_authorization_repository_identity_invalid");
  }
  return {
    exact_merged_source_head: value.exact_merged_source_head,
    repository_slug: AUTHORIZED_REPOSITORY_SLUG_V02,
    authorized_origin: value.authorized_origin,
  };
}

export function preflightOperationalReentryCleanControlProviderCompatibilityProbeRepositoryV02(
  repositoryRoot: string,
  authorizationIdentity: {
    exact_merged_source_head: string;
    repository_slug: string;
    authorized_origin: string;
  },
): void {
  if (
    authorizationIdentity.repository_slug !==
      AUTHORIZED_REPOSITORY_SLUG_V02 ||
    !AUTHORIZED_ORIGINS_V02.has(authorizationIdentity.authorized_origin)
  ) {
    failV02("clean_control_probe_repository_identity_mismatch");
  }
  if (
    realpathSync(gitV02(repositoryRoot, ["rev-parse", "--show-toplevel"])) !==
    repositoryRoot
  ) {
    failV02("clean_control_probe_repository_root_mismatch");
  }
  const observedOrigin = gitV02(repositoryRoot, [
    "remote",
    "get-url",
    "origin",
  ]);
  if (
    observedOrigin !== authorizationIdentity.authorized_origin ||
    !AUTHORIZED_ORIGINS_V02.has(observedOrigin)
  ) {
    failV02("clean_control_probe_repository_origin_mismatch");
  }
  if (
    gitV02(repositoryRoot, ["rev-parse", "HEAD"]) !==
    authorizationIdentity.exact_merged_source_head
  ) {
    failV02("clean_control_probe_dirty_or_mismatched_head");
  }
  let exactOriginMain: string;
  try {
    exactOriginMain = gitV02(repositoryRoot, [
      "rev-parse",
      "--verify",
      "refs/remotes/origin/main^{commit}",
    ]);
  } catch {
    failV02("clean_control_probe_origin_main_unavailable");
  }
  if (exactOriginMain !== authorizationIdentity.exact_merged_source_head) {
    failV02("clean_control_probe_source_head_not_exact_origin_main");
  }
  if (
    gitV02(repositoryRoot, [
      "status",
      "--porcelain",
      "--untracked-files=all",
    ]) !== ""
  ) {
    failV02("clean_control_probe_dirty_or_mismatched_head");
  }
}

function gitV02(repositoryRoot: string, args: string[]): string {
  return execFileSync("git", ["-C", repositoryRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function failV02(code: string): never {
  throw new Error(code);
}
