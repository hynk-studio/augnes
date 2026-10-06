import Database from "better-sqlite3";
import { statSync } from "node:fs";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "./protocol-primitives";
import { assertReconstructionConformanceReportV01, buildReconstructionConformanceReportV01 } from "./reconstruction-conformance";
import { createCodexCurrentContinuitySnapshotBindingV01, readCodexCurrentContinuitySnapshotV01 } from "./codex-current-continuity/codex-current-continuity";
import { readProjectSelectionStateV02 } from "./persistence/project-lifecycle-registry";
import { isCurrentProjectSelectionRevision } from "./project-selection";
import { countVNextCoreRecordsV01, iterateVNextCoreRecordsV01 } from "./persistence/durable-semantic-store";
import { exportActivePortableProjectV01, MAX_PORTABLE_PROJECT_BYTES_V01, PORTABLE_PROJECT_SUPPORTED_RECORD_KINDS_V01 } from "./portability/portable-project";
import { readProjectVerifyLineageV01 } from "./runtime/project-verify-lineage";
import { readProjectVerifyReconciliationV01 } from "./runtime/project-verify-reconciliation";
import { projectVNextOperatorPilotContinuityV01, resolveVNextOperatorPilotPendingContextUseReviewV01 } from "./runtime/operator-pilot-project-continuity";
import type { VNextLocalOperatorPilotConfigV01 } from "./runtime/local-operator-session";
import type { PortableProjectV01 } from "@/types/vnext/portable-project";
import type { ReconstructionConformanceEnvironmentV01, ReconstructionConformanceInputV01 } from "@/types/vnext/reconstruction-conformance";
import { RECONSTRUCTION_CONFORMANCE_REPORT_VERSION_V02, RECONSTRUCTION_SELECTION_PROFILE_V01, type ReconstructionConformanceReportV02, type ReconstructionObservationCheckV02 } from "@/types/vnext/reconstruction-conformance-v02";

const fingerprint = (value: unknown) => createProtocolSha256V01(canonicalizeProtocolValueV01(value));
const equal = (a: unknown, b: unknown) => canonicalizeProtocolValueV01(a) === canonicalizeProtocolValueV01(b);
const ALLOWED_DIFFERENCES = Object.freeze([
  "continuity.project.selection_revision",
  "continuity.snapshot.binding",
  "private_snapshot_material.selection_revision",
]);
// Exhaustive owner shape: an owner extension requires a reviewed profile update,
// not an implicitly widened exception. All values except selection stay exact.
const MATERIAL_KEYS = ["workspace_id", "active_project_id", "selection_revision", "viewed_project_id", "project_id", "project_fingerprint", "root_binding_fingerprint", "root_availability", "current_packet", "current_work", "managed_run", "result", "review", "next_action_kind", "source_status"].sort();

interface CollectionInput {
  database_path: string;
  config: VNextLocalOperatorPilotConfigV01;
  environment: ReconstructionConformanceEnvironmentV01;
  reconstruction_input: PortableProjectV01;
}

/** Opaque process-local handles prevent JSON from posing as a reader invocation.
 * They confer no authority and cannot be serialized as a transferable attestation. */
export interface ReconstructionOwnerObservationV02 { readonly kind: "rc1_owner_observation.v0.2" }
export interface ReconstructionComparisonCaptureV02 { readonly kind: "rc1_comparison_capture.v0.2" }
interface Observation {
  identity: string;
  selection: ReturnType<typeof readProjectSelectionStateV02>;
  snapshot: Awaited<ReturnType<typeof readCodexCurrentContinuitySnapshotV01>>;
  portable: PortableProjectV01;
  reconciliation: ReconstructionConformanceEnvironmentV01["reconciliation"];
  lineages: ReconstructionConformanceEnvironmentV01["lineages"];
  feedback: ReconstructionConformanceEnvironmentV01["feedback_state"];
}
interface ObservationRead { observation: Observation | null; failure: string | null }
interface Collected extends ObservationRead { input: CollectionInput }
interface Captured { baseline?: Collected; reconstructed?: Collected; current: [boolean | null, boolean | null] }
const observations = new WeakMap<ReconstructionOwnerObservationV02, Collected>();
const captures = new WeakMap<ReconstructionComparisonCaptureV02, Captured>();

/** Own read-only connections, bounded history and the actual private snapshot
 * reader. There is deliberately no injected snapshot/material/hash provider. */
async function observe(input: CollectionInput): Promise<ObservationRead> {
  let db: Database.Database | undefined;
  let stage = "scope";
  const incomplete = (): ObservationRead => ({ observation: null, failure: stage });
  try {
    const env = input.environment, scope = { workspace_id: env.source_boundary.workspace_id, project_id: env.source_boundary.project_id };
    if (input.config.workspace_id !== scope.workspace_id || input.config.project_id !== scope.project_id ||
        input.config.database_path !== input.database_path || !input.config.enabled) return incomplete();
    stage = "lineage_scope";
    if (env.lineages.length === 0 || env.lineages.length > 64) return incomplete();
    stage = "portable_input";
    const portableInput = input.reconstruction_input;
    if (Buffer.byteLength(canonicalizeProtocolValueV01(portableInput)) > MAX_PORTABLE_PROJECT_BYTES_V01) return incomplete();
    // The supported importer already owns semantic reconstruction. A comparison
    // must not repeat its shadow-database writes. The builder instead requires
    // this entire artifact to equal the actual baseline export, with identical
    // input on both sides; owner-derived bytes/fingerprints validate it there.
    stage = "database";
    const file = statSync(input.database_path);
    db = new Database(input.database_path, { readonly: true, fileMustExist: true });
    db.pragma("query_only = ON");
    db.pragma("busy_timeout = 5000");
    const dataVersion = db.pragma("data_version", { simple: true });
    db.exec("BEGIN");
    stage = "selection";
    const selection = readProjectSelectionStateV02(db, scope.workspace_id);
    // This prospective RC1 profile is the active portable project comparison.
    // Cleared/never-selected restore safety remains with the recovery owner.
    if (!selection || selection.project_id !== scope.project_id) return incomplete();
    stage = "history_count";
    const records = [];
    let total = 0;
    for (const record_kind of PORTABLE_PROJECT_SUPPORTED_RECORD_KINDS_V01) {
      const query = { ...scope, record_kind };
      const expected = countVNextCoreRecordsV01(db, query);
      total += expected;
      if (total > 4096) return incomplete();
      const page = [];
      for (const record of iterateVNextCoreRecordsV01(db, query)) {
        page.push(record);
        if (page.length > expected) return incomplete();
      }
      if (page.length !== expected || new Set(page.map(row => row.record_id)).size !== expected) return incomplete();
      records.push(...page);
    }
    stage = "portable_history";
    const portable = exportActivePortableProjectV01(db, {
      include_personal_perspective: portableInput.manifest.personal_perspective.consented,
      exported_at: portableInput.manifest.exported_at,
    }).package;
    // No silently excluded history in this bounded RC1 fixture profile.
    const byId = (a: { record_kind: string; record_id: string }, b: { record_kind: string; record_id: string }) =>
      a.record_kind < b.record_kind ? -1 : a.record_kind > b.record_kind ? 1 : a.record_id < b.record_id ? -1 : a.record_id > b.record_id ? 1 : 0;
    if (!equal(records.sort(byId), [...portable.records].sort(byId))) return incomplete();
    stage = "snapshot_owner";
    let liveReads = 0;
    const snapshot = await readCodexCurrentContinuitySnapshotV01(db, {
      viewed_project_id: scope.project_id, generated_at: env.decision_time_cutoff,
    }, {
      read_operator_config: () => input.config,
      managed_start_available: () => true,
      read_live_projection: () => { liveReads += 1; throw new Error("rc1_live_execution_read_forbidden"); },
    });
    const material = snapshot.binding_material as Record<string, unknown> | null;
    if (liveReads !== 0 || !material || !equal(Object.keys(material).sort(), MATERIAL_KEYS) ||
        snapshot.projection.source_status !== "exact" || snapshot.projection.snapshot.status !== "exact" ||
        snapshot.projection.snapshot.binding !== createCodexCurrentContinuitySnapshotBindingV01(material) ||
        material.workspace_id !== scope.workspace_id || material.project_id !== scope.project_id ||
        material.active_project_id !== selection.project_id || material.viewed_project_id !== scope.project_id ||
        material.selection_revision !== selection.selection_revision ||
        snapshot.projection.project.selection_revision !== selection.selection_revision) return incomplete();
    stage = "verify_owners";
    const reconciliation = readProjectVerifyReconciliationV01(db, { ...scope, observed_at: env.decision_time_cutoff });
    const lineages = env.lineages.map(({ lookup }) => readProjectVerifyLineageV01(db!, { ...scope, observed_at: env.decision_time_cutoff, lookup }));
    // Retain the original RC1 fixture owner's required applied lineage. Equal
    // empty/irrelevant query collections are not evidence of this relationship.
    stage = "lineage_scope";
    if (!lineages.some(lineage =>
      lineage.nodes.some(node => node.node_kind === "state_transition_receipt_effect") &&
      lineage.nodes.some(node => node.node_kind === "later_task_context_packet"))) return incomplete();
    stage = "feedback_owner";
    const continuity = projectVNextOperatorPilotContinuityV01(db, { config: input.config, clock: { now: () => env.decision_time_cutoff } });
    const pending = resolveVNextOperatorPilotPendingContextUseReviewV01(db, { config: input.config, continuity });
    // RC1's source-authenticated chain specifically requires its unresolved feedback.
    if (!pending) return incomplete();
    const feedback = { status: "feedback_pending" as const, ...pending };
    stage = "observation_changed";
    if (!equal(selection, readProjectSelectionStateV02(db, scope.workspace_id))) return incomplete();
    db.exec("COMMIT");
    if (db.pragma("data_version", { simple: true }) !== dataVersion) return incomplete();
    const after = statSync(input.database_path);
    if (file.dev !== after.dev || file.ino !== after.ino) return incomplete();
    return { observation: { identity: `${file.dev}:${file.ino}`, selection, snapshot, portable, reconciliation, lineages, feedback }, failure: null };
  } catch {
    // Missing/partial/failed reads are explicit incompleteness, never equality.
    // Paths and underlying database errors stay private.
    return incomplete();
  } finally { if (db?.open) db.close(); }
}

export async function collectReconstructionOwnerObservationV02(input: CollectionInput): Promise<ReconstructionOwnerObservationV02> {
  const owned = structuredClone(input);
  const handle = Object.freeze({ kind: "rc1_owner_observation.v0.2" as const });
  observations.set(handle, { input: owned, ...await observe(owned) });
  return handle;
}

/** Re-observe at use, then freeze the bounded observation point. Pure replay of
 * this capture is historical evidence; a new live evaluation requires this step. */
export async function captureReconstructionComparisonV02(baseline: ReconstructionOwnerObservationV02, reconstructed: ReconstructionOwnerObservationV02): Promise<ReconstructionComparisonCaptureV02> {
  const pair = [observations.get(baseline), observations.get(reconstructed)] as const;
  const current: Captured["current"] = [null, null];
  // Missing reads, different reconstruction inputs, or a shared physical
  // database already forbid qualification.
  // Do not spend another full owner read on an impossible comparison.
  if (pair[0]?.observation && pair[1]?.observation &&
      pair[0].observation.identity !== pair[1].observation.identity &&
      equal(pair[0].input.reconstruction_input, pair[1].input.reconstruction_input)) {
    for (const [index, side] of pair.entries()) {
      if (!side?.observation) continue;
      const latest = await observe(side.input);
      current[index as 0 | 1] = latest.observation ? equal(latest.observation, side.observation) : null;
    }
  }
  const handle = Object.freeze({ kind: "rc1_comparison_capture.v0.2" as const });
  captures.set(handle, { baseline: pair[0], reconstructed: pair[1], current });
  return handle;
}

const check = (name: string, value: boolean | null): ReconstructionObservationCheckV02 => ({
  check: name, status: value === null ? "incomplete" : value ? "match" : "mismatch", non_compensable: true,
});
function lane(checks: ReconstructionObservationCheckV02[]) {
  return checks.some(row => row.status === "mismatch") ? "non_conformant" as const :
    checks.some(row => row.status === "incomplete") ? "incomplete" as const : "conformant" as const;
}
function preservedProjection(env: ReconstructionConformanceEnvironmentV01) {
  const value = structuredClone(env.continuity);
  value.project.selection_revision = null;
  value.snapshot.binding = null;
  return value;
}
function preservedMaterial(observation: Observation) {
  const { selection_revision: _selection, ...rest } = observation.snapshot.binding_material as Record<string, unknown>;
  return rest;
}
function immutablePortable(portable: PortableProjectV01) {
  return { records: portable.records, workspace: portable.manifest.workspace, project: portable.manifest.project,
    personal_perspective_scope: portable.personal_perspective_scope,
    provenance: portable.operator_provenance_sessions.map(({ source_revoked_at: _revocation, ...historical }) => historical) };
}

/** Pure and deterministic. All private evidence is accessed through a capture
 * issued by the collector, never through caller-supplied seals or JSON. */
export function buildReconstructionConformanceReportV02(input: ReconstructionConformanceInputV01, capture?: ReconstructionComparisonCaptureV02): ReconstructionConformanceReportV02 {
  const legacy = buildReconstructionConformanceReportV01(input);
  const captured = capture && captures.get(capture);
  const left = captured?.baseline?.observation, right = captured?.reconstructed?.observation;
  const preservation = legacy.exact_integrity.checks.filter(row => row.check !== "codex_current_continuity_projection")
    .map(({ check, status, non_compensable }) => ({ check, status, non_compensable }));
  preservation.push(check("continuity_preserved_fields", equal(preservedProjection(input.baseline), preservedProjection(input.reconstructed))));
  preservation.push(check("actual_historical_records_and_provenance", left && right ? equal(immutablePortable(left.portable), immutablePortable(right.portable)) : null));
  preservation.push(check("identical_reconstruction_input", captured?.baseline && captured.reconstructed ? equal(captured.baseline.input.reconstruction_input, captured.reconstructed.input.reconstruction_input) : null));
  preservation.push(check("actual_snapshot_preserved_material", left && right ? equal(preservedMaterial(left), preservedMaterial(right)) : null));
  const local: ReconstructionObservationCheckV02[] = [];
  for (const [index, side] of (["baseline", "reconstructed"] as const).entries()) {
    const collected = captured?.[side], actual = collected?.observation, env = input[side], source = env.source_boundary;
    local.push(check(`${side}_owner_read_complete`, actual ? true : null));
    if (collected?.failure) local.push(check(`${side}_incomplete_${collected.failure}`, null));
    local.push(check(`${side}_current_at_capture`, captured?.current[index as 0 | 1] ?? null));
    local.push(check(`${side}_continuity_owner_binding`, actual ? equal(env.continuity, actual.snapshot.projection) : null));
    local.push(check(`${side}_verify_owner_bindings`, actual ? equal([env.reconciliation, env.lineages, env.feedback_state], [actual.reconciliation, actual.lineages, actual.feedback]) : null));
    const material = actual?.snapshot.binding_material as Record<string, unknown> | undefined;
    const packet = actual?.portable.records.find(row => row.record_kind === "task_context_packet" && row.record_id === source.current_packet_ref?.record_id);
    local.push(check(`${side}_source_owner_bindings`, actual ?
      source.workspace_id === actual.portable.manifest.workspace.workspace_id && source.project_id === actual.portable.manifest.project.project_id &&
      source.root_binding_fingerprint === material?.root_binding_fingerprint && equal(env.current_packet, packet?.payload ?? null) &&
      equal(source.source_records, actual.portable.records.map(row => ({ record_kind: row.record_kind, record_id: row.record_id, record_fingerprint: row.fingerprint }))) : null));
    const boundary = collected?.input.reconstruction_input;
    local.push(check(`${side}_portable_input_preserved`, actual && boundary ? equal(immutablePortable(boundary), immutablePortable(actual.portable)) &&
      source.reconstruction_input_content_fingerprint === boundary.manifest.content_fingerprint && source.reconstruction_input_integrity_fingerprint === boundary.integrity.fingerprint &&
      (side === "baseline" ? equal(boundary, actual.portable) : actual.portable.operator_provenance_sessions.every(session => session.source_revoked_at !== null)) : null));
    // Bind all remaining submitted fields (cutoff, rules, environmental role,
    // obligations, scope) to the validated capture, including unknown additions.
    local.push(check(`${side}_captured_input`, collected ? equal(env, collected.input.environment) : null));
  }
  local.push(check("independent_databases", left && right ? left.identity !== right.identity : null));
  local.push(check("fresh_destination_selection", left && right ?
    isCurrentProjectSelectionRevision(left.selection?.selection_revision) && isCurrentProjectSelectionRevision(right.selection?.selection_revision) &&
    left.selection?.workspace_id === right.selection?.workspace_id && left.selection?.project_id === right.selection?.project_id &&
    left.selection?.selection_revision !== right.selection?.selection_revision &&
    left.snapshot.projection.snapshot.binding !== right.snapshot.projection.snapshot.binding : null));
  const preservationStatus = lane(preservation), observationStatus = lane(local);
  const all = [preservationStatus, observationStatus, legacy.relational_semantic.status];
  const status = all.includes("non_conformant") ? "non_conformant" : all.includes("incomplete") ? "incomplete" : "conformant";
  const body = {
    report_version: RECONSTRUCTION_CONFORMANCE_REPORT_VERSION_V02, profile: RECONSTRUCTION_SELECTION_PROFILE_V01,
    legacy, allowed_differences: ALLOWED_DIFFERENCES, preservation: { status: preservationStatus, checks: preservation },
    local_observations: { status: observationStatus, checks: local, baseline_binding: left?.snapshot.projection.snapshot.binding ?? null, reconstructed_binding: right?.snapshot.projection.snapshot.binding ?? null },
    status,
  } as const;
  const report: ReconstructionConformanceReportV02 = { ...body, integrity: { algorithm: "sha256", canonicalization: "augnes-json-c14n-v0_1", fingerprint_scope: "reconstruction_conformance_report_without_integrity", fingerprint: fingerprint(body) } };
  if (Buffer.byteLength(canonicalizeProtocolValueV01(report)) > 8 * 1024 * 1024) throw new Error("rc1_v02_report_bound_exceeded");
  return report;
}

export function assertReconstructionConformanceReportV02(report: ReconstructionConformanceReportV02, input: ReconstructionConformanceInputV01, capture?: ReconstructionComparisonCaptureV02): ReconstructionConformanceReportV02 {
  if (!equal(report, buildReconstructionConformanceReportV02(input, capture))) throw new Error("rc1_v02_report_derived_material_invalid");
  return report;
}

/** Explicit dispatch retains v0.1 parsing/replay without reinterpreting verdicts. */
export function assertReconstructionConformanceReport(report: ReconstructionConformanceReportV02 | ReturnType<typeof buildReconstructionConformanceReportV01>, input: ReconstructionConformanceInputV01, capture?: ReconstructionComparisonCaptureV02) {
  if (report.report_version === "reconstruction_conformance_report.v0.1") return assertReconstructionConformanceReportV01(report, input);
  if (report.report_version === RECONSTRUCTION_CONFORMANCE_REPORT_VERSION_V02) return assertReconstructionConformanceReportV02(report, input, capture);
  throw new Error("rc1_report_version_unsupported");
}
