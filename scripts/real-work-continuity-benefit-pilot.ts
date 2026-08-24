import { pathToFileURL } from "node:url";

import {
  aggregateRealWorkContinuityBenefitPilotV01,
  freezeRealWorkPilotEpisodeV01,
  recordImmediateRealWorkPilotObservationV01,
  recordLaterRealWorkPilotOutcomeReviewV01,
} from "@/lib/vnext/real-work-continuity-benefit-pilot";
import {
  readRealWorkPilotArtifactsV01,
  readRealWorkPilotEpisodeArtifactsV01,
  writeRealWorkPilotEpisodeFreezeV01,
  writeRealWorkPilotImmediateObservationV01,
  writeRealWorkPilotLaterOutcomeReviewV01,
  writeRealWorkPilotReportArtifactsV01,
} from "@/lib/vnext/real-work-continuity-benefit-pilot-artifact-store";

type CommandV01 = "freeze" | "observe" | "review" | "report";

interface CliOptionsV01 {
  command: CommandV01;
  repository_root: string;
  pilot_id: string | null;
  episode_id: string | null;
  generated_at: string | null;
}

const MAX_STDIN_BYTES = 128 * 1_024;

export async function runRealWorkContinuityBenefitPilotCliV01(
  argv: readonly string[],
  readInput: () => Promise<unknown> = readBoundedJsonStdinV01,
): Promise<Record<string, unknown>> {
  const options = parseCliV01(argv);
  if (options.command === "freeze") {
    const freeze = freezeRealWorkPilotEpisodeV01(await readInput());
    const artifactPath = writeRealWorkPilotEpisodeFreezeV01(
      options.repository_root,
      freeze,
    );
    return {
      status: "frozen",
      pilot_id: freeze.pilot_id,
      episode_id: freeze.episode_id,
      task_family: freeze.task_family,
      family_episode_index: freeze.family_episode_index,
      condition: freeze.condition,
      authenticity: freeze.authenticity,
      freeze_fingerprint: freeze.integrity.fingerprint,
      artifact_path: artifactPath,
      outcome_known_at_freeze: false,
      all_authority: false,
      harness_owned_real_provider_calls: 0,
    };
  }
  if (
    !options.pilot_id ||
    (!options.episode_id && options.command !== "report")
  ) {
    throw new Error("real_work_pilot_cli_identity_required");
  }
  if (options.command === "observe") {
    const episode = readRealWorkPilotEpisodeArtifactsV01(
      options.repository_root,
      options.pilot_id!,
      options.episode_id!,
    );
    if (episode.observation) {
      throw new Error("real_work_pilot_cli_observation_already_exists");
    }
    const observation = recordImmediateRealWorkPilotObservationV01(
      episode.freeze,
      await readInput(),
    );
    const artifactPath = writeRealWorkPilotImmediateObservationV01(
      options.repository_root,
      episode.freeze,
      observation,
    );
    return {
      status: "immediate_observation_recorded",
      pilot_id: observation.pilot_id,
      episode_id: observation.episode_id,
      observation_fingerprint: observation.integrity.fingerprint,
      artifact_path: artifactPath,
      harness_owned_real_provider_calls: 0,
    };
  }
  if (options.command === "review") {
    const episode = readRealWorkPilotEpisodeArtifactsV01(
      options.repository_root,
      options.pilot_id!,
      options.episode_id!,
    );
    if (!episode.observation) {
      throw new Error("real_work_pilot_cli_observation_required_before_review");
    }
    if (episode.review) {
      throw new Error("real_work_pilot_cli_review_already_exists");
    }
    const review = recordLaterRealWorkPilotOutcomeReviewV01(
      episode.freeze,
      episode.observation,
      await readInput(),
    );
    const artifactPath = writeRealWorkPilotLaterOutcomeReviewV01(
      options.repository_root,
      episode.freeze,
      episode.observation,
      review,
    );
    return {
      status: "later_outcome_review_recorded",
      pilot_id: review.pilot_id,
      episode_id: review.episode_id,
      label: review.label,
      review_fingerprint: review.integrity.fingerprint,
      artifact_path: artifactPath,
      causal_contribution: "not_inferred_from_presence_or_reference",
      all_authority: false,
      harness_owned_real_provider_calls: 0,
    };
  }
  if (!options.pilot_id || !options.generated_at) {
    throw new Error("real_work_pilot_cli_report_identity_and_timestamp_required");
  }
  const artifacts = readRealWorkPilotArtifactsV01(
    options.repository_root,
    options.pilot_id,
  );
  const report = aggregateRealWorkContinuityBenefitPilotV01({
    ...artifacts,
    generated_at: options.generated_at,
  });
  const paths = writeRealWorkPilotReportArtifactsV01(
    options.repository_root,
    report,
  );
  return {
    status: "descriptive_report_written",
    pilot_id: report.pilot_id,
    report_fingerprint: report.integrity.fingerprint,
    disposition: report.disposition,
    disposition_authority: "review_material_only",
    authentic_episode_count: report.authentic_episode_count,
    synthetic_test_only_excluded_count:
      report.synthetic_test_only_excluded_count,
    pilot_complete: report.pilot_complete,
    ...paths,
    harness_owned_real_provider_calls: 0,
  };
}

function parseCliV01(argv: readonly string[]): CliOptionsV01 {
  const [rawCommand, ...rest] = argv;
  if (!["freeze", "observe", "review", "report"].includes(rawCommand ?? "")) {
    throw new Error("real_work_pilot_cli_command_invalid");
  }
  const values = new Map<string, string>();
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (!key?.startsWith("--") || !value || values.has(key)) {
      throw new Error("real_work_pilot_cli_arguments_invalid");
    }
    values.set(key, value);
  }
  const allowed = new Set([
    "--repository-root",
    "--pilot-id",
    "--episode-id",
    "--generated-at",
  ]);
  if ([...values.keys()].some((key) => !allowed.has(key))) {
    throw new Error("real_work_pilot_cli_argument_unknown");
  }
  const repositoryRoot = values.get("--repository-root");
  if (!repositoryRoot) {
    throw new Error("real_work_pilot_cli_repository_root_required");
  }
  if (rawCommand === "freeze" && values.size !== 1) {
    throw new Error("real_work_pilot_cli_freeze_arguments_invalid");
  }
  if (
    (rawCommand === "observe" || rawCommand === "review") &&
    ([...values.keys()].sort().join(",") !==
      ["--episode-id", "--pilot-id", "--repository-root"].sort().join(","))
  ) {
    throw new Error("real_work_pilot_cli_episode_arguments_invalid");
  }
  if (
    rawCommand === "report" &&
    ([...values.keys()].sort().join(",") !==
      ["--generated-at", "--pilot-id", "--repository-root"].sort().join(","))
  ) {
    throw new Error("real_work_pilot_cli_report_arguments_invalid");
  }
  return {
    command: rawCommand as CommandV01,
    repository_root: repositoryRoot,
    pilot_id: values.get("--pilot-id") ?? null,
    episode_id: values.get("--episode-id") ?? null,
    generated_at: values.get("--generated-at") ?? null,
  };
}

async function readBoundedJsonStdinV01(): Promise<unknown> {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of process.stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_STDIN_BYTES) {
      throw new Error("real_work_pilot_cli_input_too_large");
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new Error("real_work_pilot_cli_input_json_invalid");
  }
}

async function main(): Promise<void> {
  const result = await runRealWorkContinuityBenefitPilotCliV01(
    process.argv.slice(2),
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "real_work_pilot_cli_failed"}\n`,
    );
    process.exitCode = 1;
  });
}
