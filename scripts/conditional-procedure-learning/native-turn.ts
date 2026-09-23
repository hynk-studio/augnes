import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "../canonical-database-migrations.mjs";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "../canonical-test-environment.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01,
  normalizeLocalProjectRootRefV01 } from "@/lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01, readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import { defineInitialProjectWorkV01 } from "@/lib/vnext/runtime/project-work-initialization";
import { revisePreExecutionProjectWorkV01 } from "@/lib/vnext/runtime/project-work-revision";
import { buildSelectedWorkSourceEntry, compareSelectedWorkSources, readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, revokeVNextLocalOperatorSessionByIdV01,
  readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "@/lib/vnext/runtime/local-operator-session";
import { buildTaskStartGuideBriefCodexProjectionV02 } from "@/lib/vnext/guide-brief/project-guide-brief";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import { createCodexScopedTaskV01, createCodexFeasibilityWindowV01, releaseCodexScopedTaskV01,
  readCodexScopedSnapshotV01 } from "@/lib/vnext/native-host/codex-scoped-task";
import { createCodexAppServerAdapterV01, type CodexAppServerAdapterObservationV01 } from "@/lib/vnext/native-host/codex-app-server-adapter";
import { runDirectNativeHostRoundTripV01 } from "@/lib/vnext/runtime/direct-native-host-round-trip";
import { readProjectRunResultDetailV01 } from "@/lib/vnext/runtime/project-run-result-read-model";
import { readVNextOperatorPilotSemanticReviewV01 } from "@/lib/vnext/runtime/operator-pilot-review-material";
import { LIMITS, assertMemory, bytes, sha } from "./method";
import type { VNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";

const credentialFromCookie = (value: string) => readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1/", {
  headers: { cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${value}` },
}));
const containsText = (value: unknown, expected: string): boolean => value === expected ||
  Boolean(value && typeof value === "object" && Object.values(value).some(v => containsText(v, expected)));
export function approvedInstructions() {
  return ["AGENTS.md", "AGENTS.override.md"].map(name => path.join(process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex"), name))
    .filter(filename => existsSync(filename)).map(filename => ({ path: filename, sha256: sha(readFileSync(filename)) }));
}

/** Existing authenticated ordinary host, scoped read-only snapshot and normal
 * result readers. This helper cannot change host launch, model or permissions. */
export async function nativeTurn(input: {
  files: Record<string, string>; memory?: string; directory: string; approved_instruction_hashes?: string[];
  beforeStart: () => void; onEvent?: (kind: string) => void;
}) {
  const resource = createCanonicalTestResourceRoot("ag-c01-");
  const root = path.join(resource.root, "input"); mkdirSync(root);
  const databasePath = path.join(resource.root, "study.db");
  const db = new Database(databasePath);
  let config: VNextLocalOperatorPilotConfigV01 | undefined;
  let scope: Awaited<ReturnType<typeof createCodexScopedTaskV01>> | undefined;
  const sessions = new Set<string>();
  const observations: CodexAppServerAdapterObservationV01[] = [];
  const startedAt = performance.now();
  const audit: Record<string, unknown> = { started_at: new Date().toISOString(), study_initiated: false };
  const save = (name: string, value: unknown) => writeFileSync(path.join(input.directory, name), JSON.stringify(value, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  try {
    db.pragma("foreign_keys = ON"); applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
    const registration = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(root, { base_path: resource.root }), display_name: "Bounded procedure investigation" });
    const identity = { workspace_id: workspace.workspace_id, project_id: registration.project.project_id };
    config = { ...identity, enabled: true, operator_id: "operator:conditional-procedure", database_path: databasePath };
    selectActiveProjectV01(db, { ...identity, expected_project_id: null, expected_revision: null, now: new Date().toISOString() });
    const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config });
    let credential = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token }).credential;
    sessions.add(credential.session_id);
    const selection = readActiveProjectSelectionV01(db, identity.workspace_id)!;
    const definition = {
      goal: "Read TASK.md and the exact supplied source files. Complete only that bounded research task and return its requested content in the normal result summary.",
      success_criteria: ["Return a source-supported candidate response within TASK.md bounds; preserve uncertainty and authority."],
      non_goals: ["No source edits, external access, semantic acceptance, production action, or unlisted diagnostic execution."],
    };
    const defined = defineInitialProjectWorkV01(db, { config, credential, request: { action: "define_initial_project_work", ...identity,
      expected_active_project_id: identity.project_id, expected_active_selection_revision: selection.selection_revision,
      expected_initialization_state: "not_defined", ...definition } });
    credential = credentialFromCookie(defined.session_admission.cookie_value); sessions.add(credential.session_id);
    let packet = defined.packet;
    if (input.memory !== undefined) {
      assertMemory(input.memory);
      const entries = [buildSelectedWorkSourceEntry(identity, { source: `candidate-method:${sha(input.memory)}`,
        observed_at: null, provenance: "derived_interpretation", label: "New candidate", text: input.memory })];
      const revised = revisePreExecutionProjectWorkV01(db, { config, credential, request: {
        action: "revise_pre_execution_project_work", ...identity, expected_active_project_id: identity.project_id,
        expected_active_selection_revision: selection.selection_revision,
        expected_current_packet_id: packet.packet_id, expected_current_packet_fingerprint: packet.integrity.fingerprint,
        expected_current_lineage_kind: "initial_user_defined", ...definition, selected_source_context: entries,
        expected_source_comparison: compareSelectedWorkSources(packet, entries).fingerprint,
      } });
      packet = revised.packet;
      credential = credentialFromCookie(revised.session_admission.cookie_value); sessions.add(credential.session_id);
      assert.equal(readSelectedWorkSources(packet)[0]!.bounded_summary, input.memory, "exact method delivered without clipping");
      assert.equal(input.files["MEMORY.md"], input.memory);
    }
    const files = Object.entries(input.files).map(([relative_path, text]) => {
      assert(/^[A-Za-z0-9][A-Za-z0-9_-]*\.(md|txt|json)$/.test(relative_path));
      writeFileSync(path.join(root, relative_path), text, { flag: "wx", mode: 0o400 });
      return { relative_path, sha256: sha(text), bytes: bytes(text) };
    });
    const guide = buildTaskStartGuideBriefCodexProjectionV02({ packet, project_name: "Bounded procedure investigation" });
    const approved = approvedInstructions();
    if (input.approved_instruction_hashes) assert.deepEqual(approved.map(x => x.sha256), input.approved_instruction_hashes);
    scope = await createCodexScopedTaskV01({ stage: 1, canonical_root: root, packet_id: packet.packet_id,
      packet_fingerprint: packet.integrity.fingerprint,
      guide_brief_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(guide)),
      files: files.map(({ relative_path, sha256 }) => ({ relative_path, sha256 })), approved_instruction_files: approved });
    const snapshot = readCodexScopedSnapshotV01(scope);
    audit.preparation_ms = performance.now() - startedAt;
    audit.files = files; audit.packet_sha256 = sha(canonicalizeProtocolValueV01(packet));
    audit.packet_bytes = bytes(canonicalizeProtocolValueV01(packet)); audit.guide_bytes = bytes(canonicalizeProtocolValueV01(guide));
    audit.approved_instruction_hashes = approved.map(x => x.sha256);
    audit.snapshot_fingerprint = snapshot.fingerprint;
    save("input-audit.json", audit);
    const adapter = createCodexAppServerAdapterV01({ scoped_task: scope, observe(event) {
      // Public bounded lifecycle metadata only; no RPC payloads or reasoning.
      observations.push(event); input.onEvent?.(event.kind);
    } });
    const window = createCodexFeasibilityWindowV01();
    const attempt = window.begin(scope, LIMITS.turnMs, LIMITS.settleMs);
    input.beforeStart(); audit.study_initiated = true;
    const runStart = performance.now();
    let completed = false;
    try {
      const result = await runDirectNativeHostRoundTripV01(db, { config, mode: "interactive", operator_mutation: { credential } }, {
        adapter, scoped_task: scope, timeout_ms: attempt.timeout_ms, stop_settle_timeout_ms: attempt.stop_settle_timeout_ms,
        schedule_timeout: attempt.schedule((await import("@/lib/vnext/runtime/direct-native-host-round-trip")).scheduleNativeHostTimeoutV01),
        before_adapter_invoke: request => attempt.before_invoke(request), lifecycle_mode: "managed_live", live_host_egress_authorized: true,
        on_invocation_admitted: ({ request }) => {
          assert.deepEqual(request.packet, packet); assert.deepEqual(request.guide_brief, guide);
          audit.admitted_request_sha256 = sha(canonicalizeProtocolValueV01(request));
          audit.admitted_request_bytes = bytes(canonicalizeProtocolValueV01(request));
          audit.result_bound_bytes = request.result_return.max_result_bytes;
        },
        on_adapter_invocation_started: () => { audit.adapter_invoked = true; },
      });
      audit.execution_settlement_ms = performance.now() - runStart;
      if (result.session_admission) sessions.add(result.session_admission.credential.session_id);
      save("public-result.json", { host_result: result.host_result, receipt: result.receipt, proposal: result.proposal });
      const detail = readProjectRunResultDetailV01(db, { ...identity, receipt_id: result.receipt.receipt_id });
      assert.equal(detail.summary.summary, result.receipt.result_summary.summary);
      assert.equal(detail.summary.summary, result.host_result?.summary);
      audit.result_reader_exact = true;
      if (result.proposal.status === "available") {
        const review = readVNextOperatorPilotSemanticReviewV01(db, { config, proposal_id: result.proposal.proposal_id,
          authenticated_session_id: credential.session_id });
        audit.review_retains_summary = containsText(review, result.host_result?.summary ?? "");
        assert(audit.review_retains_summary, "authenticated reader must retain the exact method/result text");
      }
      audit.output_bytes = bytes(result.host_result); audit.host_outcome = result.host_result?.outcome;
      completed = result.host_result?.outcome === "completed";
      if (!completed) throw new Error(`study_host_${result.host_result?.outcome ?? "unavailable"}`);
      assert(!result.host_result!.changed_files.length && !result.host_result!.artifacts.length);
      return { summary: detail.summary.summary, outcome: result.host_result!.outcome,
        public_result: result.host_result!, receipt_id: result.receipt.receipt_id };
    } finally { attempt.finish(completed); }
  } finally {
    const cleanupStart = performance.now();
    let scopeReleased = !scope;
    try {
      if (scope) { await releaseCodexScopedTaskV01(scope); scopeReleased = true; }
      if (config) for (const session_id of sessions) revokeVNextLocalOperatorSessionByIdV01(db, { config, session_id });
    } finally {
      db.close();
      // Never remove the source root while a scope refuses consumer settlement.
      const cleanup: { completed: boolean; failure_count: number }[] = scopeReleased
        ? cleanupCanonicalTestResources([resource]) : [{ completed: false, failure_count: 1 }];
      audit.cleanup = cleanup.map(({ completed, failure_count }) => ({ completed, failure_count }));
      audit.cleanup_ms = performance.now() - cleanupStart; audit.total_ms = performance.now() - startedAt;
      save("lifecycle.json", { ...audit, observations });
      assert(cleanup.every(x => x.completed), "study resources must be completely removed");
    }
  }
}
