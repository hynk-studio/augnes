#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  beginOperationalReentryParserClosedCleanControlCohortAttemptV01,
  validateOperationalReentryParserClosedCleanControlCohortArtifactsV01,
} from "@/lib/vnext/operational-reentry-parser-closed-clean-control-cohort-artifact-store";
import {
  OperationalReentryParserClosedCleanControlCohortDriftErrorV01,
  buildOperationalReentryParserClosedCleanControlCohortV01,
  runOperationalReentryParserClosedCleanControlCohortV01,
} from "@/lib/vnext/operational-reentry-parser-closed-clean-control-cohort";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV03,
  readDefaultModelGatewayLocalCapabilityV01,
  readModelGatewayInteractiveAdmissionForRootV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";

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
      "operational_reentry_parser_closed_clean_control_cohort_failed",
    );
    console.error(boundedErrorCodeV01(error));
    process.exitCode = 1;
  });
}

async function main(): Promise<void> {
  const options = parseArgumentsV01(process.argv.slice(2));
  const repositoryRoot = realpathSync(options.repository_root ?? process.cwd());
  const authorizationPackage = readAuthorizationPackageV01(
    options.authorization_file,
  );
  const identity = readAuthorizationIdentityV01(
    authorizationPackage.authorization,
  );
  preflightOperationalReentryParserClosedCleanControlCohortRepositoryV01(
    repositoryRoot,
    identity,
  );
  const capability = readDefaultModelGatewayLocalCapabilityV01();
  if (capability.status !== "available") {
    failV01(`parser_closed_clean_control_gateway_${capability.status}`);
  }
  const admission = readModelGatewayInteractiveAdmissionForRootV01(repositoryRoot);
  const route = await prepareOperationalReentryMatchedCohortModelGatewayRouteV03();
  if (!route) failV01("parser_closed_clean_control_route_unavailable");
  const buildInput = {
    authorization: authorizationPackage.authorization,
    pricing: authorizationPackage.pricing,
    admission,
    route,
    repository_identity: {
      repository_slug: AUTHORIZED_REPOSITORY_SLUG_V01,
      origin: identity.authorized_origin,
    },
    evaluated_at: new Date().toISOString(),
  };
  const prepared =
    buildOperationalReentryParserClosedCleanControlCohortV01(buildInput);
  const journal =
    beginOperationalReentryParserClosedCleanControlCohortAttemptV01({
      repository_root: repositoryRoot,
      prepared,
    });
  const cancellation = new AbortController();
  const cancel = () => cancellation.abort();
  process.once("SIGINT", cancel);
  process.once("SIGTERM", cancel);
  try {
    const result =
      await runOperationalReentryParserClosedCleanControlCohortV01(
        buildInput,
        {
          cancellation_signal: cancellation.signal,
          async assert_execution_state() {
            preflightOperationalReentryParserClosedCleanControlCohortRepositoryV01(
              repositoryRoot,
              identity,
            );
            const currentAdmission =
              readModelGatewayInteractiveAdmissionForRootV01(repositoryRoot);
            if (
              canonicalizeProtocolValueV01(currentAdmission) !==
              canonicalizeProtocolValueV01(admission)
            ) {
              throw new OperationalReentryParserClosedCleanControlCohortDriftErrorV01(
                "admission",
              );
            }
            if (
              Date.now() >=
              Date.parse(
                readAuthorizationExpiryV01(
                  authorizationPackage.authorization,
                ),
              )
            ) {
              throw new OperationalReentryParserClosedCleanControlCohortDriftErrorV01(
                "authorization",
              );
            }
            const currentRoute =
              await prepareOperationalReentryMatchedCohortModelGatewayRouteV03();
            if (
              !currentRoute ||
              currentRoute.integrity_fingerprint !== route.integrity_fingerprint
            ) {
              throw new OperationalReentryParserClosedCleanControlCohortDriftErrorV01(
                "route",
              );
            }
          },
          consume_authorization(consumption) {
            journal.consume_authorization({
              authorization_fingerprint:
                consumption.authorization.integrity.fingerprint,
              cohort_id: consumption.cohort_id,
            });
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
      validateOperationalReentryParserClosedCleanControlCohortArtifactsV01({
        repository_root: repositoryRoot,
        run_root: journal.run_root,
      });
    console.log(
      JSON.stringify({
        status:
          result.report.completion_status === "complete"
            ? "operational_reentry_parser_closed_clean_control_cohort_complete"
            : "operational_reentry_parser_closed_clean_control_cohort_incomplete",
        future_live_issue_number:
          result.manifest.future_live_issue_number,
        source_repository_head_sha:
          result.manifest.source_repository_head_sha,
        cohort_id: result.manifest.cohort_id,
        authorization_fingerprint:
          result.authorization.integrity.fingerprint,
        plan_fingerprint: result.plan.integrity.fingerprint,
        evaluator_bridge_fingerprint:
          result.evaluator_bridge.integrity.fingerprint,
        route_fingerprint: result.manifest.route.integrity_fingerprint,
        provider_contract_fingerprint:
          result.provider_contract.integrity.fingerprint,
        adapter_request_route_fingerprint:
          result.manifest.adapter_request_route_fingerprint,
        terminal_call_records: result.report.terminal_call_records,
        attempted_provider_calls: result.report.attempted_provider_calls,
        complete_blocks: result.report.complete_blocks,
        incomplete_blocks: result.report.incomplete_blocks,
        terminal_category_counts:
          result.report.terminal_category_counts,
        authorization_consumed: result.report.authorization_consumed,
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
    if (value === "--confirm-parser-closed-clean-control-cohort") {
      confirmed = true;
    } else if (value === "--authorization-file") {
      authorizationFile = args[++index] ?? null;
    } else if (value === "--repository-root") {
      repositoryRoot = args[++index] ?? null;
    } else {
      failV01("parser_closed_clean_control_argument_invalid");
    }
  }
  if (!confirmed) {
    failV01("parser_closed_clean_control_explicit_confirmation_required");
  }
  if (!authorizationFile) {
    failV01("parser_closed_clean_control_authorization_file_required");
  }
  return { authorization_file: authorizationFile, repository_root: repositoryRoot };
}

function readAuthorizationPackageV01(file: string): {
  authorization: unknown;
  pricing: unknown;
} {
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch {
    failV01("parser_closed_clean_control_authorization_file_invalid");
  }
  if (
    typeof value !== "object" ||
    value === null ||
    !("authorization" in value) ||
    !("pricing" in value)
  ) {
    failV01("parser_closed_clean_control_authorization_package_required");
  }
  return { authorization: value.authorization, pricing: value.pricing };
}

function readAuthorizationIdentityV01(value: unknown): {
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
    failV01("parser_closed_clean_control_authorization_identity_invalid");
  }
  return {
    exact_merged_source_head: value.exact_merged_source_head,
    repository_slug: AUTHORIZED_REPOSITORY_SLUG_V01,
    authorized_origin: value.authorized_origin,
  };
}

function readAuthorizationExpiryV01(value: unknown): string {
  if (
    typeof value !== "object" ||
    value === null ||
    !("expires_at" in value) ||
    typeof value.expires_at !== "string"
  ) {
    failV01("parser_closed_clean_control_authorization_expiry_invalid");
  }
  return value.expires_at;
}

export function preflightOperationalReentryParserClosedCleanControlCohortRepositoryV01(
  repositoryRoot: string,
  identity: {
    exact_merged_source_head: string;
    repository_slug: string;
    authorized_origin: string;
  },
): void {
  if (
    identity.repository_slug !== AUTHORIZED_REPOSITORY_SLUG_V01 ||
    !AUTHORIZED_ORIGINS_V01.has(identity.authorized_origin)
  ) {
    throw new OperationalReentryParserClosedCleanControlCohortDriftErrorV01(
      "source",
    );
  }
  if (
    realpathSync(gitV01(repositoryRoot, ["rev-parse", "--show-toplevel"])) !==
      repositoryRoot ||
    gitV01(repositoryRoot, ["remote", "get-url", "origin"]) !==
      identity.authorized_origin ||
    gitV01(repositoryRoot, ["rev-parse", "HEAD"]) !==
      identity.exact_merged_source_head ||
    gitV01(repositoryRoot, [
      "rev-parse",
      "--verify",
      "refs/remotes/origin/main^{commit}",
    ]) !== identity.exact_merged_source_head ||
    gitV01(repositoryRoot, [
      "status",
      "--porcelain",
      "--untracked-files=all",
    ]) !== ""
  ) {
    throw new OperationalReentryParserClosedCleanControlCohortDriftErrorV01(
      "source",
    );
  }
}

function gitV01(repositoryRoot: string, args: string[]): string {
  return execFileSync("git", ["-C", repositoryRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function boundedErrorCodeV01(error: unknown): string {
  if (
    error instanceof Error &&
    /^[a-z0-9_]{1,160}$/u.test(error.message)
  ) {
    return error.message;
  }
  return "parser_closed_clean_control_runtime_failed";
}

function failV01(code: string): never {
  throw new Error(code);
}
