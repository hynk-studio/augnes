import { readPacketDirectionInterpretation } from "../persistence/project-direction-store";
import type Database from "better-sqlite3";
import { closeSync, constants, fstatSync, fsyncSync, lstatSync, openSync, realpathSync, writeSync } from "node:fs";
import path from "node:path";

import { listAutonomyRunLedgerRecords, readAutonomyRunLedgerRecord } from "@/lib/autonomy/runner-ledger";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import { readProjectRunResultSourceBindingV01, readProjectRunResultDetailV01 } from "./project-run-result-read-model";
import { readVNextOperatorPilotSemanticReviewV01, recordVNextOperatorPilotReviewDecisionV01 } from "./operator-pilot-review-material";
import { recordVNextOperatorPilotProposalRevisionV01 } from "./operator-pilot-proposal-revision";
import { prepareVNextOperatorPilotSemanticCommitPreviewV01, confirmVNextOperatorPilotSemanticCommitV01, applyVNextOperatorPilotReviewedSemanticTransitionV01 } from "./operator-pilot-semantic-transition";
import { admitPersistedHostTaskContextPacketV01, buildDirectNativeHostRunIdentityV01, type PersistedHostPacketAdmissionV01 } from "./direct-native-host-round-trip";
import { loadValidatedVNextSemanticTransitionRelationV01 } from "./durable-semantic-transition";
import { resolveImmediatePersistedSemanticPriorPacketV01 } from "./persisted-semantic-context-compiler";
import { buildTaskStartGuideBriefCodexProjectionV02 } from "@/lib/vnext/guide-brief/project-guide-brief";
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import { projectVNextOperatorPilotContinuityV01 } from "./operator-pilot-project-continuity";
import type { VNextLocalOperatorPilotConfigV01 } from "./local-operator-session";
import type { NativeHostRequestV01, NativeHostRootScopeV01 } from "@/types/vnext/native-host-adapter";

export const PERSISTED_CODEX_CONTINUATION_V01 = "persisted_completed_x_continuation.v0.1" as const;
export class PersistedCodexContinuationErrorV01 extends Error {
  constructor(readonly code: string) { super(code); this.name = "PersistedCodexContinuationErrorV01"; }
}
function requireBound(value: unknown, reason: string): asserts value {
  if (!value) throw new PersistedCodexContinuationErrorV01(`codex_continuation_${reason}`);
}
const equal = (a: unknown, b: unknown) => canonicalizeProtocolValueV01(a) === canonicalizeProtocolValueV01(b);
function stableRoot(root: NativeHostRootScopeV01) {
  // Only the external reference's observation time is refreshed by admission.
  const { observed_at: _observation, ...reference } = root.root_scope_ref;
  return { ...root, root_scope_ref: reference };
}
type LocalInput<F extends (...args: never[]) => unknown> = Omit<Parameters<F>[1], "config">;
export interface PersistedCodexContinuationInputV01 {
  config: VNextLocalOperatorPilotConfigV01;
  receipt_id: string;
  proposal_id: string;
}

/** Internal persisted-material owner for the scoped coordinator. No window,
 * execution grant, credential, or caller-supplied completion assertion is read
 * from JSON. All material is re-read through the normal result/review owners. */
export async function preparePersistedCodexContinuationV01(db: Database.Database, input: PersistedCodexContinuationInputV01) {
  const config = Object.freeze({ ...input.config });
  const databasePath = realpathSync(config.database_path);
  requireBound(databasePath === realpathSync(db.name), "database_binding");
  const databaseIdentity = lstatSync(databasePath);
  requireBound(databaseIdentity.isFile() && !databaseIdentity.isSymbolicLink(), "database_binding");
  const initial = readProjectRunResultSourceBindingV01(db, { ...config, receipt_id: input.receipt_id });
  requireBound(initial.packet && initial.run, "predecessor_missing");
  const packet = initial.packet, run = initial.run, receipt = initial.receipt;
  const original = readVNextOperatorPilotSemanticReviewV01(db, { config, proposal_id: input.proposal_id, authenticated_session_id: null }).proposal;
  const projected = readProjectRunResultDetailV01(db, { ...config, receipt_id: receipt.receipt_id }).proposal;
  requireBound(projected.status === "available" && projected.proposal_id === original.proposal_id &&
    projected.proposal_fingerprint === original.integrity.fingerprint, "original_proposal");
  requireBound(!original.operation_revision && original.source_assessment &&
    original.source_assessment.receipt_ref.external_id === receipt.receipt_id &&
    original.source_assessment.receipt_ref.source_ref === receipt.integrity.fingerprint &&
    original.source_assessment.run_ref.external_id === run.run_id &&
    original.source_assessment.packet_ref.external_id === packet.packet_id &&
    original.source_assessment.packet_ref.source_ref === packet.integrity.fingerprint &&
    equal(original.source_assessment.assessment, initial.criterion_assessment.status === "available" ? initial.criterion_assessment.assessment : null), "proposal_source");
  const admission = await admitPersistedHostTaskContextPacketV01(db, { config, packet_id: packet.packet_id,
    packet_fingerprint: packet.integrity.fingerprint, evaluated_at: new Date().toISOString(), require_active_project: true });
  const databaseRelative = path.relative(admission.root_scope.canonical_root, databasePath);
  requireBound(databaseRelative.startsWith(`..${path.sep}`) || path.isAbsolute(databaseRelative), "disposition_inside_task_root");
  // Recompute the original producer's identity using its persisted adapter
  // versions, never this implementation's version or the newly selected host.
  requireBound(typeof run.metadata.adapter_version === "string" && typeof run.metadata.capability_version === "string", "producer_identity");
  const identity = buildDirectNativeHostRunIdentityV01({ config, admission, mode: "interactive", automation_context: null,
    adapter: { adapter_version: run.metadata.adapter_version, capability_version: run.metadata.capability_version } });
  requireBound(identity.run_id === receipt.run_id && identity.request_id === run.metadata.request_id &&
    receipt.source_refs.some(ref => ref.ref_type === "project_root_scope" && ref.source_ref === admission.root_scope.root_fingerprint), "producer_identity");
  const predecessor = Object.freeze({ profile: PERSISTED_CODEX_CONTINUATION_V01, receipt_id: receipt.receipt_id,
    receipt_fingerprint: receipt.integrity.fingerprint, proposal_id: original.proposal_id, proposal_fingerprint: original.integrity.fingerprint,
    run_id: run.run_id, request_id: identity.request_id, packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint,
    work_ref: structuredClone(packet.work_ref), workspace_id: config.workspace_id, project_id: config.project_id,
    root_fingerprint: admission.root_scope.root_fingerprint, producer_adapter_version: run.metadata.adapter_version,
    producer_capability_version: run.metadata.capability_version, verification_status: receipt.verification.status });
  const dispositionPath = `${databasePath}.codex-continuation-${createProtocolSha256V01(canonicalizeProtocolValueV01(predecessor)).slice(7)}.jsonl`;
  let dispositionIdentity: ReturnType<typeof lstatSync> | undefined, records = 0;
  let revised: ReturnType<typeof recordVNextOperatorPilotProposalRevisionV01>["proposal"] | undefined;
  let decision: ReturnType<typeof recordVNextOperatorPilotReviewDecisionV01>["decision"] | undefined;
  let applied: ReturnType<typeof applyVNextOperatorPilotReviewedSemanticTransitionV01> | undefined;
  function assertDatabase() {
    const current = lstatSync(databasePath);
    requireBound(db.open && realpathSync(db.name) === databasePath && !current.isSymbolicLink() && current.dev === databaseIdentity.dev && current.ino === databaseIdentity.ino, "database_changed");
  }
  function assertPredecessor(allowNewRun = false) {
    assertDatabase();
    const current = readProjectRunResultSourceBindingV01(db, { ...config, receipt_id: receipt.receipt_id });
    requireBound(current.run?.status === "completed" && current.run.metadata.reconciliation_required === false &&
      current.run.metadata.terminal_receipt_persisted === true && current.receipt.execution.status === "completed" &&
      current.receipt.integrity.fingerprint === receipt.integrity.fingerprint && current.packet?.integrity.fingerprint === packet.integrity.fingerprint, "predecessor_unsettled_or_changed");
    requireBound(readVNextOperatorPilotSemanticReviewV01(db, { config, proposal_id: original.proposal_id, authenticated_session_id: null }).proposal_fingerprint === original.integrity.fingerprint, "proposal_changed");
    if (!allowNewRun) {
      const latest = listAutonomyRunLedgerRecords({ db, scope: config.project_id, limit: 1 })[0];
      requireBound(latest?.run_id === run.run_id, "later_run_or_unresolved_consumption");
    }
  }
  function append(kind: "armed" | "semantic_action" | "start_attempt" | "completed" | "stopped") {
    assertDatabase();
    requireBound(records < 32, "disposition_bound");
    let fd: number | undefined;
    try {
      fd = openSync(dispositionPath, constants.O_WRONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK |
        (kind === "armed" ? constants.O_CREAT | constants.O_EXCL : constants.O_APPEND), 0o600);
      const st = fstatSync(fd), named = lstatSync(dispositionPath);
      requireBound(st.isFile() && st.nlink === 1 && st.dev === named.dev && st.ino === named.ino &&
        (kind === "armed" || (st.dev === dispositionIdentity?.dev && st.ino === dispositionIdentity?.ino)), "disposition_changed");
      dispositionIdentity ??= st;
      const text = JSON.stringify({ profile: PERSISTED_CODEX_CONTINUATION_V01, kind, sequence: records,
        observed_at: new Date().toISOString(), ...(kind === "armed" ? { predecessor } : {}) }) + "\n";
      requireBound(writeSync(fd, text) === Buffer.byteLength(text), "disposition_write_failed");
      fsyncSync(fd); records += 1;
    } catch (error) {
      if (error instanceof PersistedCodexContinuationErrorV01) throw error;
      throw new PersistedCodexContinuationErrorV01("codex_continuation_disposition_refused");
    } finally { if (fd !== undefined) closeSync(fd); }
  }
  assertPredecessor();
  try { lstatSync(dispositionPath); throw new PersistedCodexContinuationErrorV01("codex_continuation_disposition_exists"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  function assertRequest(request: unknown, expected: { proposal_id: string; proposal_fingerprint: string }) {
    requireBound(request && typeof request === "object" && !Array.isArray(request), "semantic_request");
    const r = request as Record<string, unknown>;
    requireBound(r.proposal_id === expected.proposal_id && r.proposal_fingerprint === expected.proposal_fingerprint, "semantic_source");
    if (decision) requireBound(r.decision_id === decision.decision_id && r.decision_fingerprint === decision.integrity.fingerprint, "decision_source");
  }
  function assertTransition() {
    assertPredecessor();
    requireBound(applied && revised && decision, "transition_required");
    const relation = loadValidatedVNextSemanticTransitionRelationV01(db, { ...config,
      transition_receipt_id: applied.transition_receipt.transition_receipt_id,
      transition_receipt_fingerprint: applied.transition_receipt.integrity.fingerprint });
    requireBound(relation.proposal.integrity.fingerprint === revised.integrity.fingerprint &&
      relation.proposal.operation_revision?.source.proposal_id === original.proposal_id &&
      relation.proposal.operation_revision.source.proposal_fingerprint === original.integrity.fingerprint &&
      relation.decision.integrity.fingerprint === decision.integrity.fingerprint && relation.decision.decision === "accept", "transition_source");
    const current = projectVNextOperatorPilotContinuityV01(db, { config });
    requireBound(current.packet_currentness === "fresh" &&
      current.latest_compiled_packet?.packet_id === applied.later_packet.packet_id &&
      current.latest_compiled_packet.packet_fingerprint === applied.later_packet.integrity.fingerprint, "transition_superseded");
    return applied;
  }
  async function admitB() {
    const committed = assertTransition();
    const later = await admitPersistedHostTaskContextPacketV01(db, { config, packet_id: committed.later_packet.packet_id,
      packet_fingerprint: committed.later_packet.integrity.fingerprint, evaluated_at: new Date().toISOString(), require_active_project: true });
    requireBound(later.packet.packet_id !== packet.packet_id && later.packet.integrity.fingerprint !== packet.integrity.fingerprint &&
      equal(later.packet.work_ref, packet.work_ref) && equal(later.packet.task, packet.task) &&
      equal(stableRoot(later.root_scope), stableRoot(admission.root_scope)) &&
      later.packet_lineage.lineage_kind === "semantic_transition" &&
      later.packet_lineage.source_transition_receipt_ref.external_id === committed.transition_receipt.transition_receipt_id &&
      later.packet_lineage.source_transition_receipt_ref.source_ref === committed.transition_receipt.integrity.fingerprint &&
      resolveImmediatePersistedSemanticPriorPacketV01({ packet: later.packet, prior_packets: [packet] }).status === "resolved", "later_packet_lineage");
    const project = readCanonicalProjectWithRootV01(db, config);
    requireBound(project, "project_missing");
    return { admission: later, guide: buildTaskStartGuideBriefCodexProjectionV02({ packet: later.packet, project_name: project.project.display_name,
      direction: readPacketDirectionInterpretation(db, later.packet, new Date().toISOString()) }) };
  }
  return {
    predecessor, dispositionPath, assertPredecessor, append, admitB,
    revise(input: LocalInput<typeof recordVNextOperatorPilotProposalRevisionV01>) {
      requireBound(!revised, "revision_already_recorded");
      assertRequest(input.request, { proposal_id: original.proposal_id, proposal_fingerprint: original.integrity.fingerprint });
      const result = recordVNextOperatorPilotProposalRevisionV01(db, { ...input, config }); revised = structuredClone(result.proposal); return result;
    },
    decide(input: LocalInput<typeof recordVNextOperatorPilotReviewDecisionV01>) {
      requireBound(revised && !decision, "revision_required");
      assertRequest(input.request, { proposal_id: revised.proposal_id, proposal_fingerprint: revised.integrity.fingerprint });
      const result = recordVNextOperatorPilotReviewDecisionV01(db, { ...input, config }); decision = structuredClone(result.decision); return result;
    },
    preview(input: LocalInput<typeof prepareVNextOperatorPilotSemanticCommitPreviewV01>) {
      requireBound(revised && decision, "decision_required");
      assertRequest(input.request, { proposal_id: revised.proposal_id, proposal_fingerprint: revised.integrity.fingerprint });
      return prepareVNextOperatorPilotSemanticCommitPreviewV01(db, { ...input, config });
    },
    confirm(input: LocalInput<typeof confirmVNextOperatorPilotSemanticCommitV01>) {
      requireBound(revised && decision, "decision_required");
      assertRequest(input.request, { proposal_id: revised.proposal_id, proposal_fingerprint: revised.integrity.fingerprint });
      return confirmVNextOperatorPilotSemanticCommitV01(db, { ...input, config });
    },
    apply(input: LocalInput<typeof applyVNextOperatorPilotReviewedSemanticTransitionV01>) {
      requireBound(revised && decision && !applied, "decision_required");
      assertRequest(input.request, { proposal_id: revised.proposal_id, proposal_fingerprint: revised.integrity.fingerprint });
      const request = input.request as Record<string, unknown>;
      requireBound(request.prior_packet_id === packet.packet_id && request.prior_packet_fingerprint === packet.integrity.fingerprint, "prior_packet");
      const result = applyVNextOperatorPilotReviewedSemanticTransitionV01(db, { ...input, config }); applied = structuredClone(result); return result;
    },
    assertBStart(prepared: PersistedHostPacketAdmissionV01) {
      const committed = assertTransition();
      requireBound(prepared.packet.integrity.fingerprint === committed.later_packet.integrity.fingerprint, "prepared_packet");
      append("start_attempt");
    },
    async assertBRequest(request: NativeHostRequestV01, prepared: PersistedHostPacketAdmissionV01) {
      // A new B run may now be claimed by the normal service, but X itself must
      // remain settled and immutable. Fresh packet admission checks currentness.
      assertPredecessor(true);
      requireBound(applied, "transition_required");
      loadValidatedVNextSemanticTransitionRelationV01(db, { ...config, transition_receipt_id: applied.transition_receipt.transition_receipt_id,
        transition_receipt_fingerprint: applied.transition_receipt.integrity.fingerprint });
      const actual = await admitPersistedHostTaskContextPacketV01(db, { config, packet_id: prepared.packet.packet_id,
        packet_fingerprint: prepared.packet.integrity.fingerprint, evaluated_at: new Date().toISOString(), require_active_project: true });
      const claimed = readAutonomyRunLedgerRecord(request.run_id, { db });
      requireBound(request.project_id === config.project_id && request.workspace_id === config.workspace_id &&
        claimed && claimed.run_id !== predecessor.run_id && claimed.scope === config.project_id &&
        claimed.metadata.request_id === request.request_id && claimed.metadata.packet_fingerprint === actual.packet.integrity.fingerprint &&
        equal(request.packet, actual.packet) && actual.packet_lineage.lineage_kind === "semantic_transition" &&
        equal(request.packet_lineage, {
          source_transition_receipt_ref: actual.packet_lineage.source_transition_receipt_ref,
          packet_source_refs: actual.packet.compatibility.source_refs,
          selected_context_refs: actual.packet.selected_context.flatMap(entry => entry.external_ref ? [entry.external_ref] : []),
        }) &&
        equal(request.work_ref, actual.work_ref) && equal(request.task_ref, actual.task_ref) &&
        equal(request.task_context_packet_ref, actual.packet_ref) &&
        equal(stableRoot(request.root_scope), stableRoot(actual.root_scope)) &&
        equal(stableRoot(actual.root_scope), stableRoot(admission.root_scope)), "request_lineage");
    },
  };
}
