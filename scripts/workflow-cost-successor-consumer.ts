/** Engineered continuation consumer: no fixture values, oracle or prior conversation.
 * Inputs are one authorized persisted project and its ordinary work/result readers. */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readVNextLocalOperatorPilotConfigV01, openVNextLocalOperatorDatabaseV01,
  readVNextLocalOperatorCredentialFromRequestV01, authenticateVNextLocalOperatorCurrentCredentialV01 } from "../lib/vnext/runtime/local-operator-session";
import { readProjectWorkInitializationSnapshotV01 } from "../lib/vnext/runtime/project-work-initialization";
import { readProjectRunResultOverviewV01, readProjectRunResultSourceBindingV01 } from "../lib/vnext/runtime/project-run-result-read-model";
import { readSelectedWorkSources, selectedWorkSourceInput } from "../lib/intake/selected-work-source-comparison";
import { workflowCostSelectionFromPacket, WORKFLOW_COST_CRITERIA } from "../lib/vnext/native-host/workflow-cost-verification-adapter";
import { WORKFLOW_COST_CHECKS, WORKFLOW_COST_PROFILE, workflowCostRequire as check } from "../lib/vnext/workflow-cost-verifier";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../lib/vnext/protocol-primitives";
import { guardWorkflowCostProcess } from "./workflow-cost-process-guard.mjs";

const [sessionFile, output] = process.argv.slice(2);
check(sessionFile && output && process.argv.length === 4, "consumer_arguments_invalid");
const config = readVNextLocalOperatorPilotConfigV01(process.env);
const isolation = guardWorkflowCostProcess(path.dirname(config.database_path));
const db = openVNextLocalOperatorDatabaseV01(config);
try {
  const credential = readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie: readFileSync(sessionFile, "utf8") } }));
  authenticateVNextLocalOperatorCurrentCredentialV01(db, { config, credential });
  const current = readProjectWorkInitializationSnapshotV01(db, config);
  check(current.packet, "consumer_current_work_unavailable");
  const selection = workflowCostSelectionFromPacket(current.packet);
  const latest = readProjectRunResultOverviewV01(db, config).latest_result;
  check(latest, "consumer_result_unavailable");
  const binding = readProjectRunResultSourceBindingV01(db, { ...config, receipt_id: latest.receipt_ref });
  const readReport = (summary: string) => { try { return JSON.parse(summary); } catch { return null; } };
  const report = readReport(binding.receipt.result_summary.summary);
  if (report) check(report.profile === WORKFLOW_COST_PROFILE && report.criteria === WORKFLOW_COST_CRITERIA, "consumer_result_profile_invalid");
  const sourceCurrent = report?.selection === hash(canonical(selection));
  const fixedChecksPassed = WORKFLOW_COST_CHECKS.every(id => binding.receipt.checks.some(c => c.check_id === id && c.status === "passed")) &&
    !binding.receipt.skipped_checks.some(c => WORKFLOW_COST_CHECKS.includes(c.check_id as typeof WORKFLOW_COST_CHECKS[number]));
  const usable = sourceCurrent && report?.consistent === true && fixedChecksPassed && binding.receipt.execution.status === "completed" && binding.run?.metadata.reconciliation_required === false;
  const refs = current.packet.compatibility.source_refs.filter(r => r.ref_type === "run_receipt");
  const seen = new Set<string>(), history = [];
  while (refs.length) {
    const ref = refs.shift()!;
    if (seen.has(ref.external_id)) continue;
    seen.add(ref.external_id); check(seen.size <= 16 && refs.length <= 32, "consumer_history_bound");
    const priorBinding = readProjectRunResultSourceBindingV01(db, { ...config, receipt_id: ref.external_id });
    const prior = priorBinding.receipt;
    check(prior.integrity.fingerprint === ref.source_ref, "consumer_history_changed");
    history.push({ receipt: prior.receipt_id, fingerprint: prior.integrity.fingerprint, verification: prior.verification.status,
      report: readReport(prior.result_summary.summary), failed_checks: prior.checks.filter(c => c.status === "failed").map(c => c.check_id) });
    refs.push(...(priorBinding.packet?.compatibility.source_refs.filter(r => r.ref_type === "run_receipt") ?? []));
  }
  const decision = !usable ? "defer_unverified_or_changed_basis" : report.recomputed.comparison === "inspection_reduces_work" ? "optional_inspection"
    : report.recomputed.comparison === "inspection_adds_work" ? "direct" : report.recomputed.comparison === "equal_work" ? "tie_no_work_advantage" : "decline_non_completing_comparison";
  const artifact = { version: "workflow_cost_successor_artifact.v1", project: config.project_id, work: current.packet.work_ref,
    goal: current.packet.task.goal, decision, mandatory_verification: "retained_in_both_alternatives", source_current: sourceCurrent,
    source_currentness_basis: "ordinary_persisted_selection; original files not reread by this consumer", fixed_checks_passed: fixedChecksPassed,
    latest_receipt: binding.receipt.receipt_id, latest_receipt_fingerprint: binding.receipt.integrity.fingerprint,
    source_selection: selection, recomputed: report?.recomputed ?? null, current_report: report, history,
    selected_notes: readSelectedWorkSources(current.packet).map(selectedWorkSourceInput),
    unresolved_applicability: "Empirical probabilities and stationary applicability remain unresolved. No deadline, causal benefit or semantic acceptance follows from this arithmetic.",
    inherited_execution_authority: false, actual_human_or_model_semantic_use: "NOT_RUN", comparative_usefulness: "NOT_RUN" };
  const markdown = `# Conditional workflow plan\n\nDecision: **${decision}**. Mandatory verification remains required in both alternatives.\n\n${artifact.unresolved_applicability}\n\n` +
    "```json\n" + JSON.stringify(artifact, null, 2) + "\n```\n";
  writeFileSync(output, markdown, { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify({ status: "artifact_written", file: path.basename(output), sha256: hash(markdown), decision, reads: "authenticated_persisted_sources_and_results_only" }));
} finally { db.close(); isolation.finish(); }
