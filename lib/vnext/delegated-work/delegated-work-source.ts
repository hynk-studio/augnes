import type Database from "better-sqlite3";

import { readLatestManagedLiveDelegatedWorkLedgerSliceV01 } from "@/lib/autonomy/runner-ledger";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import { readVNextCoreRecordV01 } from "@/lib/vnext/persistence/durable-semantic-store";
import { buildDelegatedWorkProjectionV01 } from "@/lib/vnext/delegated-work/delegated-work-projection";
import { projectVNextOperatorPilotContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import type {
  LiveNativeHostRunProjectionV01,
} from "@/lib/vnext/runtime/live-native-host-run-service";
import type { VNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import type { DelegatedWorkProjectionV01 } from "@/types/vnext/delegated-work";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type { RepositoryRunResumeEligibilityV01 } from "@/types/vnext/repository-run-resume";

export function readDelegatedWorkProjectionV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    live_run: LiveNativeHostRunProjectionV01;
    now?: () => string;
    resume_eligibility?: RepositoryRunResumeEligibilityV01 | null;
  },
): DelegatedWorkProjectionV01 {
  const ledger = readLatestManagedLiveDelegatedWorkLedgerSliceV01(
    {
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
    },
    db,
  );
  const run = ledger.run;
  let packet: TaskContextPacketV01 | null = null;
  let projectionRun = run;
  let startEligible = false;
  let startBlocker: string | null = null;
  let sourceStatus: DelegatedWorkProjectionV01["source_status"] = "available";
  try {
    const continuity = projectVNextOperatorPilotContinuityV01(db, {
      config: input.config,
      clock: input.now ? { now: input.now } : undefined,
    });
    packet = readCurrentPacketV01(
      db,
      input.config,
      continuity.latest_compiled_packet?.packet_id ??
        run?.metadata.packet_id,
    );
    const currentPacketDiffersFromTerminalRun =
      run != null &&
      isTerminalRunnerStatus(run.status) &&
      continuity.latest_compiled_packet != null &&
      (continuity.latest_compiled_packet.packet_id !==
        run.metadata.packet_id ||
        continuity.latest_compiled_packet.packet_fingerprint !==
          run.metadata.packet_fingerprint);
    if (currentPacketDiffersFromTerminalRun) {
      projectionRun = null;
    }
    startEligible =
      projectionRun == null &&
      continuity.packet_currentness === "fresh" &&
      continuity.latest_compiled_packet != null;
    if (!startEligible && projectionRun == null) {
      startBlocker =
        continuity.latest_compiled_packet == null
          ? "Current work instructions are not available yet."
          : "Current work instructions must be refreshed before Codex can start.";
    }
  } catch {
    sourceStatus = "partial";
    startBlocker = "Current work eligibility could not be confirmed.";
    packet = readCurrentPacketV01(db, input.config, run?.metadata.packet_id);
  }

  return buildDelegatedWorkProjectionV01({
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    run: projectionRun,
    events: projectionRun ? ledger.events : [],
    source_omitted_event_count:
      projectionRun ? ledger.source_omitted_event_count : 0,
    live_run: input.live_run,
    current_goal: packet?.task.goal ?? null,
    start_eligible: startEligible,
    start_blocker: startBlocker,
    source_status: sourceStatus,
    resume_eligibility: input.resume_eligibility ?? null,
  });
}

function readCurrentPacketV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  preferredPacketId: unknown,
): TaskContextPacketV01 | null {
  const packetId =
    typeof preferredPacketId === "string" && preferredPacketId.length > 0
      ? preferredPacketId
      : latestPacketIdV01(db, config);
  if (!packetId) return null;
  const record = readVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: packetId,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
  });
  if (!record) return null;
  const packet = record.payload as TaskContextPacketV01;
  return validateTaskContextPacketV01(packet, {
    evaluated_at: packet.generated_at,
  }).status === "valid"
    ? packet
    : null;
}

function latestPacketIdV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
): string | null {
  const row = db
    .prepare(
      `SELECT record_id
       FROM vnext_core_records
       WHERE record_kind = 'task_context_packet'
         AND workspace_id = ?
         AND project_id = ?
       ORDER BY created_at DESC, record_id DESC
       LIMIT 1`,
    )
    .get(config.workspace_id, config.project_id) as
    | { record_id: string }
    | undefined;
  return row?.record_id ?? null;
}
