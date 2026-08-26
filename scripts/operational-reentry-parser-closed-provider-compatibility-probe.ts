#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  beginOperationalReentryParserClosedProviderCompatibilityProbeAttemptV01,
  validateOperationalReentryParserClosedProviderCompatibilityProbeArtifactsV01,
} from "@/lib/vnext/operational-reentry-parser-closed-provider-compatibility-probe-artifact-store";
import {
  buildOperationalReentryParserClosedProviderCompatibilityProbeV01,
  runOperationalReentryParserClosedProviderCompatibilityProbeV01,
} from "@/lib/vnext/operational-reentry-parser-closed-provider-compatibility-probe";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV03,
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
      "operational_reentry_parser_closed_provider_compatibility_probe_failed",
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
  const authorizationIdentity = readAuthorizationRepositoryIdentityV01(
    authorization,
  );
  preflightOperationalReentryParserClosedProviderCompatibilityProbeRepositoryV01(
    repositoryRoot,
    authorizationIdentity,
  );

  const capability = readDefaultModelGatewayLocalCapabilityV01();
  if (capability.status !== "available") {
    failV01(`parser_closed_probe_gateway_${capability.status}`);
  }
  const admission = readModelGatewayInteractiveAdmissionForRootV01(
    repositoryRoot,
  );
  const route =
    await prepareOperationalReentryMatchedCohortModelGatewayRouteV03();
  if (!route) failV01("parser_closed_probe_route_unavailable");
  const evaluatedAt = new Date().toISOString();
  const buildInput = {
    authorization,
    admission,
    route,
    repository_identity: {
      repository_slug: AUTHORIZED_REPOSITORY_SLUG_V01,
      origin: authorizationIdentity.authorized_origin,
    },
    evaluated_at: evaluatedAt,
  };
  const prepared =
    buildOperationalReentryParserClosedProviderCompatibilityProbeV01(
      buildInput,
    );
  const journal =
    beginOperationalReentryParserClosedProviderCompatibilityProbeAttemptV01({
      repository_root: repositoryRoot,
      prepared,
    });
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    const result =
      await runOperationalReentryParserClosedProviderCompatibilityProbeV01(
        buildInput,
        {
          cancellation_signal: cancellation.signal,
          assert_source_unchanged() {
            preflightOperationalReentryParserClosedProviderCompatibilityProbeRepositoryV01(
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
      validateOperationalReentryParserClosedProviderCompatibilityProbeArtifactsV01(
        {
          repository_root: repositoryRoot,
          run_root: journal.run_root,
        },
      );
    console.log(
      JSON.stringify({
        status:
          result.report.outcome === "accepted_all_shapes"
            ? "operational_reentry_parser_closed_provider_compatibility_probe_accepted_all_shapes"
            : "operational_reentry_parser_closed_provider_compatibility_probe_terminal",
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

function parseArgumentsV01(args: string[]): {
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
      "--confirm-future-live-parser-closed-compatibility-probe"
    ) {
      confirmed = true;
    } else if (value === "--authorization-file") {
      authorizationFile = args[++index] ?? null;
    } else if (value === "--repository-root") {
      repositoryRoot = args[++index] ?? null;
    } else {
      failV01("parser_closed_probe_argument_invalid");
    }
  }
  if (!confirmed) {
    failV01("parser_closed_probe_explicit_confirmation_required");
  }
  if (!authorizationFile) {
    failV01("parser_closed_probe_authorization_file_required");
  }
  return {
    authorization_file: authorizationFile,
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
    failV01("parser_closed_probe_authorization_repository_identity_invalid");
  }
  return {
    exact_merged_source_head: value.exact_merged_source_head,
    repository_slug: AUTHORIZED_REPOSITORY_SLUG_V01,
    authorized_origin: value.authorized_origin,
  };
}

export function preflightOperationalReentryParserClosedProviderCompatibilityProbeRepositoryV01(
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
    failV01("parser_closed_probe_repository_identity_mismatch");
  }
  if (
    realpathSync(gitV01(repositoryRoot, ["rev-parse", "--show-toplevel"])) !==
    repositoryRoot
  ) {
    failV01("parser_closed_probe_repository_root_mismatch");
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
    failV01("parser_closed_probe_repository_origin_mismatch");
  }
  if (
    gitV01(repositoryRoot, ["rev-parse", "HEAD"]) !==
    authorizationIdentity.exact_merged_source_head
  ) {
    failV01("parser_closed_probe_dirty_or_mismatched_head");
  }
  let exactOriginMain: string;
  try {
    exactOriginMain = gitV01(repositoryRoot, [
      "rev-parse",
      "--verify",
      "refs/remotes/origin/main^{commit}",
    ]);
  } catch {
    failV01("parser_closed_probe_origin_main_unavailable");
  }
  if (exactOriginMain !== authorizationIdentity.exact_merged_source_head) {
    failV01("parser_closed_probe_source_head_not_exact_origin_main");
  }
  if (
    gitV01(repositoryRoot, [
      "status",
      "--porcelain",
      "--untracked-files=all",
    ]) !== ""
  ) {
    failV01("parser_closed_probe_dirty_or_mismatched_head");
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
    /^[a-z0-9_]{1,160}$/u.test(error.message)
  ) {
    return error.message;
  }
  return "parser_closed_probe_runtime_failed";
}
