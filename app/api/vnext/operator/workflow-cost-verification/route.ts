import { NextResponse } from "next/server";
import {
  assertVNextLocalOperatorRequestBoundaryV01, readBoundedVNextLocalOperatorBodyV01,
  readVNextLocalOperatorCredentialFromRequestV01, resolveVNextLocalReviewConfigV01,
  openVNextLocalOperatorDatabaseV01, authenticateVNextLocalOperatorCurrentCredentialV01,
  serializeVNextLocalOperatorSessionCookieV01, VNextLocalOperatorSessionErrorV01,
} from "@/lib/vnext/runtime/local-operator-session";
import { admitPersistedHostTaskContextPacketV01, inspectPersistedHostProjectRootV01, runDirectNativeHostRoundTripV01, DirectNativeHostRoundTripErrorV01 } from "@/lib/vnext/runtime/direct-native-host-round-trip";
import { readProjectWorkRevisionEligibilityV01, revisePreExecutionProjectWorkV01, ProjectWorkRevisionErrorV01 } from "@/lib/vnext/runtime/project-work-revision";
import { readProjectRunResultDetailV01, readProjectRunResultOverviewV01 } from "@/lib/vnext/runtime/project-run-result-read-model";
import { readProjectWorkInitializationSnapshotV01 } from "@/lib/vnext/runtime/project-work-initialization";
import { readProjectWorkBindingV01 } from "@/lib/vnext/runtime/project-work-binding";
import { buildSelectedWorkSourceEntry, compareSelectedWorkSources, readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "@/lib/vnext/protocol-primitives";
import { createWorkflowCostVerificationAdapter, prepareWorkflowCostSelection, workflowCostPath,
  workflowCostSelectionFromPacket, WORKFLOW_COST_SELECTION_SOURCE, WORKFLOW_COST_CRITERIA } from "@/lib/vnext/native-host/workflow-cost-verification-adapter";
import { WORKFLOW_COST_LIMITS, WorkflowCostError, workflowCostRequire as check, exactObject } from "@/lib/vnext/workflow-cost-verifier";
import { WORKFLOW_COST_VERIFIER_SOURCE } from "@/lib/vnext/workflow-cost-verifier-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
const identityKeys = ["action", "packet_id", "packet_fingerprint", "root_fingerprint"];

/** Authenticated discovery of the exact current work/root; no file selection. */
export async function GET(request: Request): Promise<NextResponse> {
  let db: ReturnType<typeof openVNextLocalOperatorDatabaseV01> | undefined;
  try {
    const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: false });
    check(!url.search, "workflow_cost_query_forbidden");
    const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
    const config = resolveVNextLocalReviewConfigV01({ environment: process.env, credential });
    db = openVNextLocalOperatorDatabaseV01(config);
    authenticateVNextLocalOperatorCurrentCredentialV01(db, { config, credential });
    const current = readProjectWorkInitializationSnapshotV01(db, config);
    check(current.packet, "workflow_cost_current_work_required");
    const root = await inspectPersistedHostProjectRootV01(db, { config, evaluated_at: new Date().toISOString(), require_active_project: false });
    return NextResponse.json({ ok: true, workspace_id: config.workspace_id, project_id: config.project_id, work_ref: current.packet.work_ref,
      goal: current.packet.task.goal, canonical_root: root.canonical_root,
      identity: { packet_id: current.packet.packet_id, packet_fingerprint: current.packet.integrity.fingerprint, root_fingerprint: root.root_fingerprint },
      limits: WORKFLOW_COST_LIMITS, criteria_binding: WORKFLOW_COST_CRITERIA, verifier_source: WORKFLOW_COST_VERIFIER_SOURCE,
      selection_eligibility: readProjectWorkRevisionEligibilityV01(db, config), run_results: readProjectRunResultOverviewV01(db, config),
      execution_started: false }, { headers });
  } catch (error) {
    const recognized = error instanceof WorkflowCostError || error instanceof VNextLocalOperatorSessionErrorV01 || error instanceof DirectNativeHostRoundTripErrorV01;
    return NextResponse.json({ ok: false, error_code: recognized ? error.code : "workflow_cost_verification_unavailable" },
      { status: recognized ? error.status : 500, headers });
  } finally { db?.close(); }
}

/** Ordinary authenticated local operator entry. No adapter/test-mode override. */
export async function POST(request: Request): Promise<NextResponse> {
  let db: ReturnType<typeof openVNextLocalOperatorDatabaseV01> | undefined;
  const responseHeaders = new Headers(headers);
  try {
    const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: true });
    check(!url.search, "workflow_cost_query_forbidden");
    const body = await readBoundedVNextLocalOperatorBodyV01(request);
    check(["preview", "select", "verify"].includes(String(body.action)), "workflow_cost_action_invalid");
    exactObject(body, [...identityKeys, ...(body.action === "verify" ? ["selection_binding", "criteria_binding", "verifier_source"]
      : ["basis_path", "report_path", ...(body.action === "select" ? ["preview_binding"] : [])])]);
    check(typeof body.packet_id === "string" && typeof body.packet_fingerprint === "string" && typeof body.root_fingerprint === "string", "workflow_cost_identity_required");
    let credential = readVNextLocalOperatorCredentialFromRequestV01(request);
    const config = resolveVNextLocalReviewConfigV01({ environment: process.env, credential });
    db = openVNextLocalOperatorDatabaseV01(config);
    const store = db, started = performance.now();
    const workBinding = readProjectWorkBindingV01(store, config);
    const guard = async () => {
      check(!request.signal.aborted && performance.now() - started < WORKFLOW_COST_LIMITS.timeout_ms, "workflow_cost_cancelled_or_timed_out");
      authenticateVNextLocalOperatorCurrentCredentialV01(store, { config, credential });
      check(workBinding && readProjectWorkBindingV01(store, config) === workBinding, "workflow_cost_work_changed");
    };
    const admit = async () => {
      await guard();
      const admission = await admitPersistedHostTaskContextPacketV01(store, { config,
        packet_id: body.packet_id as string, packet_fingerprint: body.packet_fingerprint as string, evaluated_at: new Date().toISOString(), require_active_project: false });
      check(admission.root_scope.root_fingerprint === body.root_fingerprint, "workflow_cost_root_changed");
      return admission;
    };
    const admitted = await admit();
    const cookie = (admission: { cookie_value: string; cookie_expires_at: string; cookie_max_age_seconds: number } | null) => {
      if (admission) responseHeaders.set("Set-Cookie", serializeVNextLocalOperatorSessionCookieV01({ request,
        value: admission.cookie_value, expires_at: admission.cookie_expires_at, max_age_seconds: admission.cookie_max_age_seconds, secure: url.protocol === "https:" }));
    };
    if (body.action === "verify") {
      const selection = workflowCostSelectionFromPacket(admitted.packet);
      check(body.selection_binding === hash(canonical(selection)) && body.criteria_binding === WORKFLOW_COST_CRITERIA && body.verifier_source === WORKFLOW_COST_VERIFIER_SOURCE,
        "workflow_cost_selection_or_criteria_changed");
      // Even duplicate delivery must not present a historical result as a fresh
      // check of changed bytes. The adapter checks again after the run claim.
      const currentSelection = await prepareWorkflowCostSelection(admitted.root_scope,
        [selection.basis.path, selection.report.path], async () => { await guard(); });
      check(canonical(currentSelection) === canonical(selection), "workflow_cost_sources_changed");
      const result = await runDirectNativeHostRoundTripV01(store, { config, mode: "interactive", operator_mutation: { credential } }, {
        adapter: createWorkflowCostVerificationAdapter(guard, async () => { await admit(); }),
        timeout_ms: WORKFLOW_COST_LIMITS.timeout_ms, stop_settle_timeout_ms: WORKFLOW_COST_LIMITS.settle_ms,
        cancellation_signal: request.signal,
        resolve_packet_selection: () => ({ packet_id: body.packet_id as string, packet_fingerprint: body.packet_fingerprint as string }),
        on_invocation_admitted: ({ session_admission }) => { if (session_admission) { credential = session_admission.credential; cookie(session_admission); } },
      });
      cookie(result.session_admission);
      return NextResponse.json({ ok: true, status: result.status,
        result: readProjectRunResultDetailV01(store, { ...config, receipt_id: result.receipt.receipt_id }),
        semantic_acceptance: false, model_calls: 0 }, { headers: responseHeaders });
    }
    const eligibility = readProjectWorkRevisionEligibilityV01(store, config);
    check(eligibility.eligible && eligibility.current_lineage_kind, "workflow_cost_unstarted_work_required");
    const selection = await prepareWorkflowCostSelection(admitted.root_scope,
      [workflowCostPath(body.basis_path), workflowCostPath(body.report_path)], async () => { await guard(); });
    // Observation timestamps change between preview and selection. Bind the
    // existing physical root fingerprint, not its observation time.
    const previewBinding = hash(canonical({ packet: admitted.packet.integrity.fingerprint, root: admitted.root_scope.root_fingerprint, selection }));
    if (body.action === "preview") return NextResponse.json({ ok: true, preview_binding: previewBinding, selection,
      selection_binding: hash(canonical(selection)), required_checks_fixed: true, writes: 0 }, { headers });
    check(body.preview_binding === previewBinding, "workflow_cost_preview_changed");
    await admit();
    const source = buildSelectedWorkSourceEntry(config, { source: WORKFLOW_COST_SELECTION_SOURCE, observed_at: new Date().toISOString(),
      provenance: "user_declaration", label: "Unclassified / needs review", text: canonical(selection) });
    const comparison = compareSelectedWorkSources(admitted.packet,
      [...readSelectedWorkSources(admitted.packet).filter(e => e.compatibility_source_ref?.external_id !== WORKFLOW_COST_SELECTION_SOURCE), source]);
    const saved = revisePreExecutionProjectWorkV01(store, { config, credential, request: {
      action: "revise_pre_execution_project_work", workspace_id: config.workspace_id, project_id: config.project_id,
      expected_project_work_binding: eligibility.project_work_binding,
      expected_active_project_id: config.project_id, expected_active_selection_revision: eligibility.active_selection_revision,
      expected_current_packet_id: admitted.packet.packet_id, expected_current_packet_fingerprint: admitted.packet.integrity.fingerprint,
      expected_current_lineage_kind: eligibility.current_lineage_kind, ...admitted.packet.task,
      selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint } });
    cookie(saved.session_admission);
    return NextResponse.json({ ok: true, status: saved.status, packet_id: saved.packet.packet_id, packet_fingerprint: saved.packet.integrity.fingerprint,
      root_fingerprint: admitted.root_scope.root_fingerprint, selection_binding: hash(canonical(selection)), criteria_binding: WORKFLOW_COST_CRITERIA,
      verifier_source: WORKFLOW_COST_VERIFIER_SOURCE, execution_started: false }, { headers: responseHeaders });
  } catch (error) {
    const recognized = error instanceof WorkflowCostError || error instanceof VNextLocalOperatorSessionErrorV01 ||
      error instanceof DirectNativeHostRoundTripErrorV01 || error instanceof ProjectWorkRevisionErrorV01;
    return NextResponse.json({ ok: false, error_code: recognized ? error.code : "workflow_cost_verification_unavailable",
      next_action: "Read current work and persisted run results before any new action; no automatic retry.", semantic_acceptance: false },
    { status: recognized ? error.status : 500, headers: responseHeaders });
  } finally { db?.close(); }
}
