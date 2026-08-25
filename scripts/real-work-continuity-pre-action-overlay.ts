import { pathToFileURL } from "node:url";

import {
  aggregateRealWorkContinuityPreActionOverlayV01,
  createRealWorkContinuityPreActionOverlayV01,
} from "@/lib/vnext/real-work-continuity-pre-action-overlay";
import {
  readRealWorkContinuityPreActionOverlaysV01,
  writeRealWorkContinuityPreActionOverlayReportArtifactsV01,
  writeRealWorkContinuityPreActionOverlayV01,
} from "@/lib/vnext/real-work-continuity-pre-action-overlay-artifact-store";
import {
  readRealWorkPilotArtifactsV01,
  readRealWorkPilotEpisodeArtifactsV01,
} from "@/lib/vnext/real-work-continuity-benefit-pilot-artifact-store";

type CommandV01 = "record" | "report";

interface CliOptionsV01 {
  command: CommandV01;
  repository_root: string;
  pilot_id: string;
  episode_id: string | null;
  generated_at: string | null;
}

const MAX_STDIN_BYTES = 96 * 1_024;

export async function runRealWorkContinuityPreActionOverlayCliV01(
  argv: readonly string[],
  readInput: () => Promise<unknown> = readBoundedJsonStdinV01,
): Promise<Record<string, unknown>> {
  const options = parseCliV01(argv);
  if (options.command === "record") {
    const episode = readRealWorkPilotEpisodeArtifactsV01(
      options.repository_root,
      options.pilot_id,
      options.episode_id!,
    );
    if (episode.observation || episode.review) {
      throw new Error("real_work_pre_action_overlay_core_later_artifact_exists");
    }
    const overlay = createRealWorkContinuityPreActionOverlayV01(
      episode.freeze,
      await readInput(),
    );
    const artifactPath = writeRealWorkContinuityPreActionOverlayV01(
      options.repository_root,
      episode.freeze,
      overlay,
    );
    return {
      status: "pre_action_overlay_recorded",
      pilot_id: overlay.pilot_id,
      episode_id: overlay.episode_id,
      freeze_fingerprint: overlay.freeze_fingerprint,
      condition: overlay.condition,
      task_family: overlay.task_family,
      condition_integrity: overlay.condition_integrity,
      overlay_fingerprint: overlay.integrity.fingerprint,
      artifact_path: artifactPath,
      observed_before_first_meaningful_action: true,
      all_authority: false,
      overlay_owned_provider_calls: 0,
      overlay_owned_model_calls: 0,
      overlay_owned_network_calls: 0,
      overlay_owned_github_calls: 0,
    };
  }
  const core = readRealWorkPilotArtifactsV01(
    options.repository_root,
    options.pilot_id,
  );
  const overlays = readRealWorkContinuityPreActionOverlaysV01(
    options.repository_root,
    options.pilot_id,
  );
  const report = aggregateRealWorkContinuityPreActionOverlayV01({
    freezes: core.freezes,
    overlays,
    generated_at: options.generated_at!,
  });
  const paths = writeRealWorkContinuityPreActionOverlayReportArtifactsV01(
    options.repository_root,
    report,
  );
  return {
    status: "pre_action_overlay_report_written",
    pilot_id: report.pilot_id,
    report_fingerprint: report.integrity.fingerprint,
    authentic_frozen_episode_count:
      report.overlay_coverage.authentic_real_work.frozen_episode_count,
    authentic_overlay_count:
      report.overlay_coverage.authentic_real_work.overlay_count,
    synthetic_test_only_overlay_count:
      report.overlay_coverage.synthetic_test_only.overlay_count,
    task_mix_diagnostic: Object.fromEntries(
      Object.entries(report.task_mix_diagnostic).map(([family, value]) => [
        family,
        value.label,
      ]),
    ),
    ...paths,
    all_authority: false,
    overlay_owned_provider_calls: 0,
    overlay_owned_model_calls: 0,
    overlay_owned_network_calls: 0,
    overlay_owned_github_calls: 0,
  };
}

function parseCliV01(argv: readonly string[]): CliOptionsV01 {
  const [rawCommand, ...rest] = argv;
  if (rawCommand !== "record" && rawCommand !== "report") {
    throw new Error("real_work_pre_action_overlay_cli_command_invalid");
  }
  const values = new Map<string, string>();
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (!key?.startsWith("--") || !value || values.has(key)) {
      throw new Error("real_work_pre_action_overlay_cli_arguments_invalid");
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
    throw new Error("real_work_pre_action_overlay_cli_argument_unknown");
  }
  const repositoryRoot = values.get("--repository-root");
  const pilotId = values.get("--pilot-id");
  if (!repositoryRoot || !pilotId) {
    throw new Error(
      "real_work_pre_action_overlay_cli_repository_and_pilot_required",
    );
  }
  const actualKeys = [...values.keys()].sort().join(",");
  if (
    rawCommand === "record" &&
    actualKeys !==
      ["--episode-id", "--pilot-id", "--repository-root"].sort().join(",")
  ) {
    throw new Error("real_work_pre_action_overlay_cli_record_arguments_invalid");
  }
  if (
    rawCommand === "report" &&
    actualKeys !==
      ["--generated-at", "--pilot-id", "--repository-root"].sort().join(",")
  ) {
    throw new Error("real_work_pre_action_overlay_cli_report_arguments_invalid");
  }
  return {
    command: rawCommand,
    repository_root: repositoryRoot,
    pilot_id: pilotId,
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
      throw new Error("real_work_pre_action_overlay_cli_input_too_large");
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new Error("real_work_pre_action_overlay_cli_input_json_invalid");
  }
}

async function main(): Promise<void> {
  const result = await runRealWorkContinuityPreActionOverlayCliV01(
    process.argv.slice(2),
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "real_work_pre_action_overlay_cli_failed"}\n`,
    );
    process.exitCode = 1;
  });
}
