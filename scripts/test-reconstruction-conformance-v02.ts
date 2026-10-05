import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { collectReconstructionOwnerObservationV02, captureReconstructionComparisonV02, buildReconstructionConformanceReportV02, assertReconstructionConformanceReport, type ReconstructionOwnerObservationV02 } from "../lib/vnext/reconstruction-conformance-v02";
import { readCodexCurrentContinuitySnapshotV01, createCodexCurrentContinuitySnapshotBindingV01 } from "../lib/vnext/codex-current-continuity/codex-current-continuity";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "../lib/vnext/protocol-primitives";
import type { ReconstructionConformanceInputV01 } from "../types/vnext/reconstruction-conformance";
import type { ReconstructionConformanceReportV02 } from "../types/vnext/reconstruction-conformance-v02";
import type { VNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";
import type { PortableProjectV01 } from "../types/vnext/portable-project";
import { readProjectSelectionStateV02 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { POST } from "../app/api/vnext/projects/route";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

const hash = (value: unknown) => createProtocolSha256V01(canonicalizeProtocolValueV01(value));
const bytes = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
function requireCheck(report: ReconstructionConformanceReportV02, id: string, status: "mismatch" | "incomplete") {
  assert.equal([...report.preservation.checks, ...report.local_observations.checks].find(row => row.check === id)?.status, status, id);
  assert.notEqual(report.status, "conformant", id);
}
async function snapshot(databasePath: string, config: VNextLocalOperatorPilotConfigV01, generatedAt: string) {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    db.pragma("query_only = ON");
    return await readCodexCurrentContinuitySnapshotV01(db, { viewed_project_id: config.project_id, generated_at: generatedAt }, {
      read_operator_config: () => config, managed_start_available: () => true,
      read_live_projection: () => { throw new Error("unexpected_live_projection"); },
    });
  } finally { db.close(); }
}

export async function testReconstructionConformanceV02(options: {
  input: ReconstructionConformanceInputV01; portable: PortableProjectV01;
  baseline_path: string; reconstructed_path: string; operator_id: string; temporary_root: string;
  reconstruct: (databasePath: string) => void;
}) {
  const input = structuredClone(options.input);
  let destinationPath = options.reconstructed_path;
  const config = (side: "baseline" | "reconstructed"): VNextLocalOperatorPilotConfigV01 => ({
    enabled: true, workspace_id: input[side].source_boundary.workspace_id, project_id: input[side].source_boundary.project_id,
    operator_id: options.operator_id, database_path: side === "baseline" ? options.baseline_path : destinationPath,
  });
  const collect = (side: "baseline" | "reconstructed") => collectReconstructionOwnerObservationV02({
    database_path: config(side).database_path!, config: config(side), environment: input[side], reconstruction_input: options.portable,
  });
  const before = [bytes(options.baseline_path), bytes(options.reconstructed_path)];
  console.log(JSON.stringify({ rc1_v02_stage: "collect_independent_owners" }));
  const baseline = await collect("baseline"), destination = await collect("reconstructed");
  const capture = await captureReconstructionComparisonV02(baseline, destination);
  const report = buildReconstructionConformanceReportV02(input, capture);
  assert.equal(report.status, "conformant", JSON.stringify(report.local_observations.checks));
  assert.equal(report.preservation.status, "conformant");
  assert.equal(report.legacy.exact_integrity.status, "non_conformant");
  assert.deepEqual(report.legacy.exact_integrity.checks.filter(row => row.status !== "match").map(row => row.check), ["codex_current_continuity_projection"]);
  assert.equal(report.legacy.relational_semantic.status, "conformant");
  assert.deepEqual(buildReconstructionConformanceReportV02(input, capture), report);
  assert.deepEqual(assertReconstructionConformanceReport(JSON.parse(JSON.stringify(report)), input, capture), report);
  assert.deepEqual(assertReconstructionConformanceReport(report.legacy, input), report.legacy);
  assert(!JSON.stringify(report).includes(options.temporary_root));
  assert(!JSON.stringify(report).includes(String(input.reconstructed.continuity.project.selection_revision)));
  console.log(JSON.stringify({ rc1_v02_stage: "positive_and_replay_pass" }));

  const cases: Array<[string, (value: ReconstructionConformanceInputV01) => void, string]> = [
    ["copied selection", value => { value.reconstructed.continuity.project.selection_revision = value.baseline.continuity.project.selection_revision; }, "reconstructed_continuity_owner_binding"],
    ["copied seal", value => { value.reconstructed.continuity.snapshot = structuredClone(value.baseline.continuity.snapshot); }, "reconstructed_continuity_owner_binding"],
    ["arbitrary well formed seal", value => { value.reconstructed.continuity.snapshot.binding = hash("random"); }, "reconstructed_continuity_owner_binding"],
    ["root drift", value => { value.reconstructed.source_boundary.root_binding_fingerprint = hash("wrong-root"); }, "reconstructed_source_owner_bindings"],
    ["historical fingerprint", value => { value.reconstructed.source_boundary.source_records[0]!.record_fingerprint = hash("changed-history"); }, "canonical_source_record_manifest"],
    ["rule drift", value => { value.reconstructed.source_boundary.portable_rebuild_binding_version = "unknown"; }, "portable_contract_and_rc1_rebuild_binding"],
    ["cutoff drift", value => {
      const env = value.reconstructed, later = new Date(Date.parse(env.decision_time_cutoff) + 1000).toISOString();
      env.decision_time_cutoff = later; env.continuity.generated_at = later;
      for (const projection of [env.reconciliation, ...env.lineages]) {
        projection.observed_at = later;
        const { projection_fingerprint: _prior, ...material } = projection;
        projection.projection_fingerprint = hash(material);
      }
    }, "decision_time_cutoff"],
    ["changed work", value => { value.reconstructed.continuity.current_work.currentness = "stale"; }, "continuity_preserved_fields"],
    ["changed obligation", value => { value.reconstructed.feedback_state.status = "feedback_recorded"; }, "later_context_feedback_state"],
    ["decision for transition", value => { const decision = value.reconstructed.source_boundary.source_records.find(row => row.record_kind === "review_decision")!; value.reconstructed.feedback_state.transition_receipt_id = decision.record_id; value.reconstructed.feedback_state.transition_receipt_fingerprint = decision.record_fingerprint; }, "reconstructed_verify_owner_bindings"],
    ["symmetric fabricated work", value => { for (const side of [value.baseline, value.reconstructed]) side.continuity.current_work.currentness = "stale"; }, "baseline_continuity_owner_binding"],
  ];
  for (const [label, mutate, obligation] of cases) {
    const changed = structuredClone(input); mutate(changed);
    requireCheck(buildReconstructionConformanceReportV02(changed, capture), obligation, "mismatch");
    assert(label);
  }
  // A self-consistent private material/hash pairing still cannot stand in for
  // an actual observation. Private test material is neither output nor persisted.
  const actual = await snapshot(options.reconstructed_path, config("reconstructed"), input.reconstructed.decision_time_cutoff);
  for (const field of ["selection_revision", "root_binding_fingerprint", "next_action_kind", "current_work"]) {
    const material = structuredClone(actual.binding_material) as Record<string, unknown>;
    material[field] = field === "selection_revision" ? input.baseline.continuity.project.selection_revision : hash(`forged-${field}`);
    const forged = structuredClone(input);
    forged.reconstructed.continuity.snapshot.binding = createCodexCurrentContinuitySnapshotBindingV01(material);
    requireCheck(buildReconstructionConformanceReportV02(forged, capture), "reconstructed_continuity_owner_binding", "mismatch");
  }
  requireCheck(buildReconstructionConformanceReportV02(input), "baseline_owner_read_complete", "incomplete");
  requireCheck(buildReconstructionConformanceReportV02(input, { kind: "rc1_comparison_capture.v0.2" }), "baseline_owner_read_complete", "incomplete");
  const omittedLineages = structuredClone(input);
  omittedLineages.baseline.lineages = []; omittedLineages.reconstructed.lineages = [];
  const omitted = [];
  for (const side of ["baseline", "reconstructed"] as const) {
    omitted.push(await collectReconstructionOwnerObservationV02({ database_path: config(side).database_path!,
      config: config(side), environment: omittedLineages[side], reconstruction_input: options.portable }));
  }
  const omittedReport = buildReconstructionConformanceReportV02(omittedLineages, await captureReconstructionComparisonV02(omitted[0]!, omitted[1]!));
  requireCheck(omittedReport, "baseline_incomplete_lineage_scope", "incomplete");
  requireCheck(omittedReport, "reconstructed_incomplete_lineage_scope", "incomplete");
  const missingSource = structuredClone(input);
  missingSource.reconstructed.source_boundary.source_records = missingSource.reconstructed.source_boundary.source_records.filter(row => row.record_id !== missingSource.reconstructed.source_boundary.current_packet_ref?.record_id);
  assert.throws(() => buildReconstructionConformanceReportV02(missingSource, capture), /current_packet_source_missing/);
  const wrongPacket = structuredClone(input);
  wrongPacket.reconstructed.source_boundary.current_packet_ref!.record_id = "packet:wrong";
  assert.throws(() => buildReconstructionConformanceReportV02(wrongPacket, capture), /current_packet_binding_invalid/);
  const copiedHandle = structuredClone(destination) as ReconstructionOwnerObservationV02;
  requireCheck(buildReconstructionConformanceReportV02(input, await captureReconstructionComparisonV02(baseline, copiedHandle)), "reconstructed_owner_read_complete", "incomplete");
  const sameDb = await captureReconstructionComparisonV02(baseline, baseline);
  requireCheck(buildReconstructionConformanceReportV02(input, sameDb), "independent_databases", "mismatch");
  requireCheck(buildReconstructionConformanceReportV02(input, sameDb), "fresh_destination_selection", "mismatch");
  const wrongScope = await collectReconstructionOwnerObservationV02({ database_path: options.reconstructed_path,
    config: { ...config("reconstructed"), project_id: "project:wrong" }, environment: input.reconstructed, reconstruction_input: options.portable });
  requireCheck(buildReconstructionConformanceReportV02(input, await captureReconstructionComparisonV02(baseline, wrongScope)), "reconstructed_owner_read_complete", "incomplete");
  const forgedPortable = structuredClone(options.portable);
  forgedPortable.manifest.warnings = ["Fabricated comparison metadata"];
  const { integrity: _oldSeal, ...forgedBody } = forgedPortable;
  forgedPortable.integrity.fingerprint = hash(forgedBody);
  const forgedBoundary = await collectReconstructionOwnerObservationV02({ database_path: options.baseline_path,
    config: config("baseline"), environment: input.baseline, reconstruction_input: forgedPortable });
  const forgedBoundaryReport = buildReconstructionConformanceReportV02(input, await captureReconstructionComparisonV02(forgedBoundary, destination));
  requireCheck(forgedBoundaryReport, "baseline_portable_input_preserved", "mismatch");
  requireCheck(forgedBoundaryReport, "identical_reconstruction_input", "mismatch");

  // Truncate the actual storage page while preserving its independent COUNT.
  // This is a test-only observation fault, not a production injection interface.
  const prepare = Database.prototype.prepare;
  try {
    Database.prototype.prepare = function(this: Database.Database, sql: string) {
      const statement = prepare.call(this, sql);
      if (this.name === options.reconstructed_path && /SELECT \* FROM vnext_core_records/u.test(sql) && /LIMIT \?/u.test(sql)) {
        const all = statement.all.bind(statement);
        statement.all = ((...args: unknown[]) => (all as (...args: unknown[]) => unknown[])(...args).slice(1)) as typeof statement.all;
      }
      return statement;
    } as typeof Database.prototype.prepare;
    const partial = await collect("reconstructed");
    const incomplete = buildReconstructionConformanceReportV02(input, await captureReconstructionComparisonV02(baseline, partial));
    requireCheck(incomplete, "reconstructed_owner_read_complete", "incomplete");
    requireCheck(incomplete, "reconstructed_incomplete_history_count", "incomplete");
    assert.equal(incomplete.local_observations.checks.find(row => row.check === "baseline_owner_read_complete")?.status, "match");
  } finally { Database.prototype.prepare = prepare; }
  for (const mutate of [
    (value: ReconstructionConformanceReportV02) => { value.status = "incomplete"; },
    (value: ReconstructionConformanceReportV02) => { value.local_observations.baseline_binding = hash("forged-evidence"); },
    (value: ReconstructionConformanceReportV02) => { value.allowed_differences = [...value.allowed_differences, "continuity.current_work"]; },
    (value: ReconstructionConformanceReportV02) => { value.legacy.exact_integrity.status = "conformant"; },
  ]) {
    const tampered = structuredClone(report); mutate(tampered);
    const { integrity: _integrity, ...body } = tampered; tampered.integrity.fingerprint = hash(body);
    assert.throws(() => assertReconstructionConformanceReport(tampered, input, capture), /derived_material_invalid/);
  }
  assert.deepEqual([bytes(options.baseline_path), bytes(options.reconstructed_path)], before, "comparison must not write either database");
  console.log(JSON.stringify({ rc1_v02_stage: "negative_controls_and_read_only_pass" }));

  // Separate fixture mutation stage: supported handlers, then fresh read-only
  // capture. No row repair, imported seal, or comparison-owned mutation.
  const previous = process.env.AUGNES_DB_PATH;
  process.env.AUGNES_DB_PATH = options.reconstructed_path;
  const selection = () => {
    const db = new Database(destinationPath, { readonly: true });
    try { const state = readProjectSelectionStateV02(db, config("reconstructed").workspace_id)!;
      return { expected_project_id: state.project_id, expected_revision: state.selection_revision };
    } finally { db.close(); }
  };
  const request = async (action: "open" | "remove", observation: ReturnType<typeof selection>, status: number) => {
    const response = await POST(new Request("http://127.0.0.1/api/vnext/projects", { method: "POST",
      headers: { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json" },
      body: JSON.stringify({ action, project_id: config("reconstructed").project_id, ...observation }) }));
    assert.equal(response.status, status, JSON.stringify(await response.json()));
  };
  try {
    await request("open", { expected_project_id: config("baseline").project_id, expected_revision: String(input.baseline.continuity.project.selection_revision) }, 409);
    const held = selection();
    await request("remove", held, 200); await request("open", selection(), 200);
    await request("open", held, 409);
    requireCheck(buildReconstructionConformanceReportV02(input, await captureReconstructionComparisonV02(baseline, destination)), "reconstructed_current_at_capture", "mismatch");
    const prior = selection();
    // A second supported import proves independent reconstruction evidence can
    // differ while preservation remains identical. Repeated atomic restore and
    // selected/cleared/never-selected safety stay with the existing focused
    // test-project-selection-recovery owner, not a duplicate full-graph matrix.
    destinationPath = path.join(options.temporary_root, "data", "second-reconstruction.db");
    options.reconstruct(destinationPath);
    process.env.AUGNES_DB_PATH = destinationPath;
    const fresh = selection();
    assert(!new Set([held.expected_revision, prior.expected_revision, String(input.baseline.continuity.project.selection_revision)]).has(fresh.expected_revision));
    await request("open", prior, 409); await request("open", held, 409);
    input.reconstructed.continuity = (await snapshot(destinationPath, config("reconstructed"), input.reconstructed.decision_time_cutoff)).projection;
    const readback = path.join(options.temporary_root, "rc1-readback.json");
    writeFileSync(readback, JSON.stringify({ config: config("reconstructed"), expected: input.reconstructed.continuity }));
    const child = await runCanonicalChild({ resourceOwner: undefined, suite: "rc1-selection", label: "fresh process snapshot owner", command: process.execPath,
      args: ["--import", "tsx", "scripts/test-reconstruction-conformance-v02.ts", "--readback", readback], cwd: process.cwd(), env: process.env, timeoutMs: 60_000 });
    assert.equal(canonicalChildAcceptanceFailure(child, { suite: "rc1-selection", timeoutMs: 60_000, requireNaturalExit: true }), null);
    const readBefore = bytes(destinationPath);
    const rebuilt = buildReconstructionConformanceReportV02(input, await captureReconstructionComparisonV02(baseline, await collect("reconstructed")));
    assert.equal(rebuilt.status, "conformant", JSON.stringify(rebuilt));
    assert.equal(rebuilt.preservation.status, report.preservation.status);
    assert.notEqual(rebuilt.integrity.fingerprint, report.integrity.fingerprint);
    assert.equal(bytes(destinationPath), readBefore);
    await request("open", fresh, 200);
  } finally { if (previous === undefined) delete process.env.AUGNES_DB_PATH; else process.env.AUGNES_DB_PATH = previous; }
  // Identical captured input still replays after later fixture changes; it does
  // not claim to be a current observation or authorize any mutation.
  assert.deepEqual(buildReconstructionConformanceReportV02(options.input, capture), report);
  assert.equal(bytes(options.baseline_path), before[0]);
  return { profile: report.profile, status: report.status, preservation: report.preservation.status,
    local_observations: report.local_observations.status, legacy: report.legacy.exact_integrity.status,
    fingerprint: report.integrity.fingerprint, deterministic_replay: true, read_only_comparison: true,
    independent_import_fresh_observations: true, fresh_process_snapshot_owner: true, negative_controls: "pass" };
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url) && process.argv[2] === "--readback") {
  void (async () => {
    const network = installZeroNetworkGuard({ allowLoopback: false, errorPrefix: "rc1_snapshot_network_forbidden" });
    try {
      const input = JSON.parse(readFileSync(process.argv[3]!, "utf8"));
      const actual = await snapshot(input.config.database_path, input.config, input.expected.generated_at);
      assert.deepEqual(actual.projection, input.expected);
      assert.equal(actual.projection.snapshot.binding, createCodexCurrentContinuitySnapshotBindingV01(actual.binding_material));
      assert.equal(network.attempts.length, 0);
      console.log(JSON.stringify({ fresh_process_snapshot_owner: "pass", network_attempts: 0 }));
    } finally { network.restore(); }
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
