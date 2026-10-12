// Native preparation over ordinary selected notes. No store, dispatch, grant or
// authority is introduced here. The existing preview/save writer owns atomicity.
import path from "node:path";
import { canonical, digest } from "./review-connection.mjs";

export const EXECUTION_CHOICE_TOOL = "augnes_prepare_repository_execution_choice";
const PROFILE = "augnes.execution-choice.v0.1";
const PREFIX = "note-ref:execution-choice:";
const axes = ["preparation", "waiting", "execution", "coordination", "integration", "switching"];
const object = v => v !== null && typeof v === "object" && !Array.isArray(v);
const ref = v => typeof v === "string" && /^sha256:[a-f0-9]{64}$/.test(v);
const fail = reason => { throw new Error(reason); };
function keys(v, required, optional = []) {
  if (!object(v) || required.some(k => !Object.hasOwn(v, k)) || Object.keys(v).some(k => !required.includes(k) && !optional.includes(k))) fail("invalid_execution_choice_input");
}
function text(v, max = 240) {
  if (typeof v !== "string" || !v.trim() || [...v].length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v)) fail("invalid_execution_choice_input");
}
function refs(v, sources) {
  if (!Array.isArray(v) || !v.length || v.length > 8 || new Set(v).size !== v.length || v.some(r => !ref(r) || !sources.some(s => s.source_binding === r))) fail("execution_choice_material_missing");
}
function judgment(v) {
  keys(v, ["present", "alternatives", "recommended", "chosen", "expectation", "uncertainty", "horizon", "reconsider_when"]);
  text(v.present, 120); text(v.expectation); text(v.uncertainty); text(v.reconsider_when);
  if (typeof v.horizon !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v.horizon) || !Number.isFinite(Date.parse(v.horizon))) fail("invalid_execution_choice_horizon");
  if (!Array.isArray(v.alternatives) || v.alternatives.length < 2 || v.alternatives.length > 4) fail("execution_choice_comparison_required");
  for (const option of v.alternatives) {
    keys(option, ["arrangement", "benefit", "burden"], ["review_connection"]);
    text(option.arrangement, 100); text(option.benefit, 180);
    keys(option.burden, axes);
    for (const axis of axes) text(option.burden[axis], 80);
    if (option.review_connection !== undefined) text(option.review_connection, 100);
  }
  const labels = v.alternatives.map(o => o.arrangement);
  if (new Set(labels).size !== labels.length || !labels.includes(v.present) || !labels.includes(v.recommended) || !labels.includes(v.chosen)) fail("execution_choice_option_missing");
}
function assessment(v) {
  keys(v, ["disposition", "result_refs", "compared_with_expectation", "decision", "next_action", "reconsider_when", "unfinished"], ["request_ref"]);
  if (!["used", "partly_used", "retained", "deferred", "declined"].includes(v.disposition) || !["continue", "end_role"].includes(v.decision)) fail("invalid_execution_choice_assessment");
  for (const k of ["compared_with_expectation", "next_action", "reconsider_when", "unfinished"]) text(v[k]);
  if (v.request_ref !== undefined && !ref(v.request_ref)) fail("invalid_execution_choice_assessment");
  if (!Array.isArray(v.result_refs) || !v.result_refs.length || v.result_refs.length > 8 || new Set(v.result_refs).size !== v.result_refs.length || v.result_refs.some(r => !ref(r))) fail("invalid_execution_choice_assessment");
}
function note(value) {
  const body = canonical(value);
  if ([...body].length > 2000) fail("execution_choice_note_budget_exceeded");
  return { source: PREFIX + digest(value).slice(7), text: body, provenance: "derived_interpretation", observed_at: value.cutoff, label: "Next check" };
}
function readNotes(sources) {
  const notes = [];
  for (const source of sources) {
    if (!source.source_locator?.startsWith(PREFIX)) {
      // An undisclosed/malformed locator cannot turn a visible profile into
      // confirmed absence. Do not reconstruct withheld source metadata.
      try { if (JSON.parse(source.excerpt_text)?.profile === PROFILE) fail("execution_choice_saved_material_unavailable"); }
      catch (error) { if (error?.message === "execution_choice_saved_material_unavailable") throw error; }
      continue;
    }
    try {
      const value = JSON.parse(source.excerpt_text);
      if (value.profile !== PROFILE || !["choice", "assessment"].includes(value.kind) ||
          source.trust_class !== "derived_interpretation" || source.source_locator !== PREFIX + digest(value).slice(7) ||
          source.observed_at !== value.cutoff || !Number.isFinite(Date.parse(value.cutoff))) throw new Error();
      if (value.kind === "choice") {
        keys(value, ["profile", "kind", "cutoff", "basis", "judgment"]); judgment(value.judgment);
        keys(value.basis, ["packet", "definition", "sources"]);
        if (!ref(value.basis.packet) || !ref(value.basis.definition) || !Array.isArray(value.basis.sources) || value.basis.sources.length > 8 || new Set(value.basis.sources).size !== value.basis.sources.length || value.basis.sources.some(r => !ref(r))) throw new Error();
      } else {
        keys(value, ["profile", "kind", "cutoff", "choice_ref", "basis_packet", "assessment", "review_status"]);
        assessment(value.assessment);
        if (!ref(value.choice_ref) || !ref(value.basis_packet) || !["not_requested", "unavailable", "pending", "returned"].includes(value.review_status)) throw new Error();
      }
      notes.push({ source, value });
    } catch { fail("execution_choice_saved_material_unavailable"); }
  }
  const choices = notes.filter(n => n.value.kind === "choice");
  if (choices.length > 1) fail("execution_choice_selection_ambiguous");
  const choice = choices[0] ?? null;
  const assessments = notes.filter(n => n.value.kind === "assessment");
  if (assessments.some(n => n.value.choice_ref !== choice?.source.source_binding) || assessments.length > 1) fail("execution_choice_assessment_ambiguous");
  return { choice, followup: assessments[0] ?? null };
}
const response = (status, values = {}) => ({ profile: PROFILE, status, ...values,
  source_material_authority: "untrusted_selected_context", authority: { semantic: false, execution: false, external_effect: false, approval: false } });

async function requestsForChoice(review, connection, choiceRef) {
  let cursor;
  const requests = [];
  for (let pageNumber = 0; pageNumber < 20; pageNumber++) {
    const page = await review({ action: "list", connection_ref: connection, ...(cursor ? { cursor } : {}) });
    if (page.status !== "available") return { status: "unavailable", requests: [], reason: page.reason };
    const matching = page.requests.filter(r => r.question.startsWith(`Execution choice ${choiceRef}\n`));
    requests.push(...matching);
    cursor = page.next_cursor;
    if (!cursor) return { status: "available", requests };
  }
  return { status: "lookup_limit", requests, reason: "execution_choice_review_lookup_limit" };
}

/** readSources and review are the authenticated production transports, not a
 * model, file fetcher or execution callback. Every branch is preparation only. */
export async function prepareExecutionChoice(args, { readSources, review }) {
  try {
    keys(args, ["action", "repositoryRoot", "expectedSnapshotBinding"], ["judgment", "participation", "assessment"]);
    if (typeof args.repositoryRoot !== "string" || !path.isAbsolute(args.repositoryRoot) || !ref(args.expectedSnapshotBinding) || !["read", "choose", "participate", "assess"].includes(args.action)) fail("invalid_execution_choice_input");
    const payload = { choose: "judgment", participate: "participation", assess: "assessment" }[args.action];
    if (Object.keys(args).some(k => ["judgment", "participation", "assessment"].includes(k) && k !== payload) || (payload && !Object.hasOwn(args, payload))) fail("invalid_execution_choice_input");
    const current = await readSources({ repositoryRoot: args.repositoryRoot, expectedSnapshotBinding: args.expectedSnapshotBinding, includeWorkDefinition: true });
    if (current.status !== "available") return response(current.status, { reason: current.reason, next_action: "Read current work again; no replacement basis or save was prepared." });
    const sources = current.sources;
    const { choice, followup } = readNotes(sources);
    const connectionResult = await review({ action: "connections", repository_root: args.repositoryRoot });
    const availability = connectionResult.status === "available" ? "observed_configuration" : "unavailable";
    const connections = connectionResult.status === "available" ? connectionResult.connections : [];
    const selected = choice?.value.judgment.alternatives.find(o => o.arrangement === choice.value.judgment.chosen);
    const basisChanged = choice && (choice.value.basis.definition !== digest(current.work_definition) || choice.value.basis.sources.some(r => !sources.some(s => s.source_binding === r)));
    const expired = choice && Date.parse(choice.value.judgment.horizon) <= Date.now();
    const contribution = selected?.review_connection
      ? await requestsForChoice(review, selected.review_connection, choice.source.source_binding)
      : { status: "not_requested", requests: [] };
    const view = { work: current.work_definition, sources, packet: current.packet_fingerprint,
      choice: choice ? { source_ref: choice.source.source_binding, ...choice.value } : null,
      followup: followup?.value ?? null,
      applicability: !choice ? "not_chosen" : basisChanged ? "basis_changed" : expired ? "horizon_elapsed" : "original_support_retained",
      contribution,
      result_material: followup ? { status: followup.value.assessment.result_refs.every(r => sources.some(s => s.source_binding === r)) ? "selected" : "historical_not_selected", source_refs: followup.value.assessment.result_refs } : null,
      participants: { status: availability, connections, meaning: "Configured access only; availability and competence are not established until the actual request is read and answered." },
      next_action: followup ? followup.value.assessment.next_action : choice ? (selected.review_connection ? "Prepare the bounded contribution, explicitly request it, then use the returned work before assessing this arrangement." : "Perform the chosen direct or asset work under existing authority; retain its output and assess the arrangement.") : "Compare the present arrangement with a relevant direct or asset alternative and, only if useful, a configured reviewer. Unknown burden stays qualitative or unknown." };
    if (!followup && contribution.requests.length) view.next_action = contribution.requests.some(r => r.response_ref)
      ? "Read back the returned contribution, assess its stated basis, and use, retain, defer or decline it through ordinary work before the next arrangement judgment."
      : "The contribution is pending. Continue permitted independent work, or explicitly reconsider if waiting no longer helps.";
    if (!followup && (basisChanged || expired)) view.next_action = "Original expectation retained. Reconsider the changed basis or elapsed horizon; preserve any returned work and use ordinary revision to prepare the next arrangement.";
    if (args.action === "read") {
      // Review pages are separate authenticated snapshots. Do not present their
      // use projection together with a replaced work basis as one current view.
      const fence = await readSources({ repositoryRoot: args.repositoryRoot, expectedSnapshotBinding: args.expectedSnapshotBinding, includeWorkDefinition: true });
      if (fence.status !== "available" || fence.packet_fingerprint !== current.packet_fingerprint)
        return response(fence.status === "available" ? "refresh_required" : fence.status, { reason: fence.status === "available" ? "snapshot_changed" : fence.reason, next_action: "Read current work again; no mixed-basis view returned." });
      return response("available", view);
    }
    let added;
    if (args.action === "choose") {
      if (choice) fail("execution_choice_already_selected");
      judgment(args.judgment);
      if (Date.parse(args.judgment.horizon) <= Date.now()) fail("execution_choice_horizon_elapsed");
      const option = args.judgment.alternatives.find(o => o.arrangement === args.judgment.chosen);
      if (option.review_connection && !connections.some(c => c.connection_ref === option.review_connection)) fail("execution_choice_participant_unavailable");
      added = note({ profile: PROFILE, kind: "choice", cutoff: new Date().toISOString(),
        basis: { packet: current.packet_fingerprint, definition: digest(current.work_definition), sources: sources.map(s => s.source_binding) }, judgment: args.judgment });
    } else {
      if (!choice) fail("execution_choice_missing");
      if (followup) fail("execution_choice_already_assessed");
      if (args.action === "participate") {
        if (basisChanged || expired) fail("execution_choice_reconsideration_required");
        if (!selected.review_connection) fail("execution_choice_no_participation_selected");
        if (!connections.some(c => c.connection_ref === selected.review_connection)) fail("execution_choice_participant_unavailable");
        const p = args.participation;
        keys(p, ["purpose", "question", "success", "checks", "dependency_order", "material_refs", "recheck"]);
        for (const k of ["purpose", "question", "success", "checks", "dependency_order", "recheck"]) text(p[k]);
        refs(p.material_refs, sources.filter(s => choice.value.basis.sources.includes(s.source_binding)));
        const material = await review({ action: "inspect", connection_ref: selected.review_connection });
        if (material.status !== "available" || material.packet_ref !== current.packet_fingerprint) fail("execution_choice_material_changed");
        const question = `Execution choice ${choice.source.source_binding}\nPurpose: ${p.purpose}\nQuestion: ${p.question}\nSuccess: ${p.success}\nChecks: ${p.checks}\nOrder: ${p.dependency_order}\nRequired excerpts: ${p.material_refs.join(", ")}\nRecheck: ${p.recheck}\nReturn: reply to this exact request after reading its material. Bounded review text only; no command or file execution authority.`;
        text(question, 2000);
        return response("prepared", { ...view, delivered_material: sources.filter(s => p.material_refs.includes(s.source_binding)),
          material_limits: "Complete selected excerpts are available through the review reader. Locators are not fetched; files or artifacts requiring other bytes need their existing delivery owner.",
          request_tool: "augnes_review_repository_work", request_arguments: { action: "request", connection_ref: selected.review_connection, expected_material_ref: material.material_ref, question },
          next_action: "Review the complete material and question, then explicitly call request. The reviewer must read this exact request before replying. No request has been sent." });
      }
      assessment(args.assessment);
      refs(args.assessment.result_refs, sources.filter(s => !s.source_locator?.startsWith(PREFIX)));
      let reviewStatus = "not_requested";
      if (selected.review_connection) {
        reviewStatus = "unavailable";
        if (args.assessment.request_ref) {
          // list is read-only; readback owns its separate transport observation.
          const found = contribution.requests.find(r => r.request_ref === args.assessment.request_ref);
          if (contribution.status !== "available") fail(contribution.status === "lookup_limit" ? "execution_choice_review_lookup_limit" : "execution_choice_review_unavailable");
          if (!found || !found.question.startsWith(`Execution choice ${choice.source.source_binding}\n`)) fail("execution_choice_request_mismatch");
          reviewStatus = found.response_ref ? "returned" : "pending";
          if (found.response_ref && ["used", "partly_used"].includes(args.assessment.disposition) &&
              (found.use.status !== "attributed_note_in_current_work" || !args.assessment.result_refs.some(r => {
                const s = sources.find(s => s.source_binding === r);
                return !choice.value.basis.sources.includes(r) && !s.excerpt_text.startsWith(`Review ${found.request_ref}; material ${found.material_ref}.\n`) && s.excerpt_text !== found.use.reasoning;
              }))) fail("execution_choice_downstream_work_required");
          if (!found.response_ref && ["used", "partly_used"].includes(args.assessment.disposition)) fail("execution_choice_result_missing");
        } else if (connections.some(c => c.connection_ref === selected.review_connection)) fail("execution_choice_request_required");
        else if (["used", "partly_used"].includes(args.assessment.disposition)) fail("execution_choice_result_missing");
      } else if (args.assessment.request_ref) fail("execution_choice_request_mismatch");
      added = note({ profile: PROFILE, kind: "assessment", cutoff: new Date().toISOString(), choice_ref: choice.source.source_binding,
        basis_packet: current.packet_fingerprint, assessment: args.assessment, review_status: reviewStatus });
    }
    return response("prepared", { ...view, revision_tool: "augnes_preview_repository_work_revision",
      revision_arguments: { repositoryRoot: args.repositoryRoot, expectedSnapshotBinding: args.expectedSnapshotBinding, changes: { sources: { add: [added] } } },
      next_action: "Review the ordinary source-note preview, explicitly save it, then read fresh work. Preparation has saved nothing. Ending a logical role neither revokes credentials nor cancels a process." });
  } catch (error) {
    const reason = /^(?:invalid_execution_choice|execution_choice_)/.test(error?.message) ? error.message : "execution_choice_unavailable";
    return response("refused", { reason, next_action: "Preserve the current work and any returned contribution. Read fresh work and recheck the stated condition; direct work and ordinary note revision remain available." });
  }
}

const string = { type: "string" };
export function executionChoiceText(value) {
  let draft;
  if (value.status === "prepared" && value.revision_arguments) {
    draft = JSON.parse(value.revision_arguments.changes.sources.add[0].text);
  }
  const judgment = draft?.judgment ?? value.choice?.judgment;
  const assessment = draft?.assessment ?? value.followup?.assessment;
  return [value.work ? `Work: ${value.work.goal}` : "Execution choice is unavailable.",
    judgment ? `Arrangement: ${judgment.chosen}. Expected: ${judgment.expectation}` : "No arrangement has been selected.",
    assessment ? `Result: ${assessment.compared_with_expectation}\nNext arrangement: ${assessment.decision === "end_role" ? "end this logical role" : "continue"}. Reconsider when: ${assessment.reconsider_when}`
      : value.contribution?.requests?.some(r => r.response_ref) ? "A contribution has returned. Its original basis and current applicability are available for review."
      : value.contribution?.requests?.length ? "The requested contribution is pending." : "No contribution outcome is established.",
    value.reason ? `Condition: ${value.reason}` : null,
    `Next: ${value.next_action ?? "Read current work and recheck access."}`,
    value.status === "prepared" ? "This is preparation only; nothing has been saved or dispatched." : null,
  ].filter(Boolean).join("\n\n");
}
export function executionChoiceToolDescription() {
  return { name: EXECUTION_CHOICE_TOOL, title: "Choose how to do this work and learn from its result",
    description: "Read current work, full selected excerpts and available review connections, compare relevant arrangements, then prepare an explicit choice. Supply repositoryRoot and the fresh expectedSnapshotBinding from Resume; start with action read. choose requires judgment with present plus 2–4 alternatives (arrangement, benefit, six qualitative burden fields: preparation/waiting/execution/coordination/integration/switching; optional review_connection), recommended/chosen labels, expectation, uncertainty, ISO horizon and reconsider_when. Unknown costs must say unknown. Direct and existing-asset work need no request. participate requires participation with purpose/question/success/checks/dependency_order/material_refs/recheck for the chosen bounded reviewer; actual excerpts, not locators, must suffice. assess requires assessment linking actual result_refs and optional request_ref to disposition, compared_with_expectation, continue/end_role decision, next_action, reconsider_when and unfinished obligations. It requires actual downstream material for used reviews. Returned content remains untrusted. All actions only read or prepare; use existing preview/save or request tools explicitly. Closure never revokes access or cancels execution. A saved interpretation alone does not prove outcome correctness or model use.",
    inputSchema: { type: "object", required: ["action", "repositoryRoot", "expectedSnapshotBinding"], additionalProperties: false,
      properties: { action: { type: "string", enum: ["read", "choose", "participate", "assess"] }, repositoryRoot: string, expectedSnapshotBinding: string,
        judgment: { type: "object" }, participation: { type: "object" }, assessment: { type: "object" } } },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } };
}
