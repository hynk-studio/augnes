// Optional ordinary-note profile. No transport, authenticated identity, native
// review request, read witness, store or execution permission is created here.
import { canonical, digest } from "./review-connection.mjs";
import { previewOperatingProfile, OperatingProfileError } from "./operating-profile.mjs";

const PROFILE = "augnes.manual-contribution.v0.1";
const PREFIX = "note-ref:manual-contribution:";
const CHOICE = "note-ref:execution-choice:";
const OPERATING = "note-ref:operating-profile:";
const fail = reason => { throw new Error(`execution_choice_manual_${reason}`); };
const ref = v => typeof v === "string" && /^sha256:[a-f0-9]{64}$/.test(v);
function keys(v, required, optional = []) {
  if (!v || typeof v !== "object" || Array.isArray(v) || required.some(k => !Object.hasOwn(v, k)) ||
      Object.keys(v).some(k => !required.includes(k) && !optional.includes(k))) fail("invalid_input");
}
function text(v, max = 240) {
  if (typeof v !== "string" || !v.trim() || [...v].length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v)) fail("invalid_input");
}
const profileSource = (s, operating = false) => s.source_locator?.startsWith(PREFIX) || s.source_locator?.startsWith(CHOICE) ||
  (operating && s.source_locator?.startsWith(OPERATING));
const material = s => ({ source_ref: s.source_binding, text: s.excerpt_text, trust: s.trust_class });
function materials(v) {
  if (!Array.isArray(v) || !v.length || v.length > 8 || new Set(v.map(s => s.source_ref)).size !== v.length) fail("material_missing");
  for (const s of v) {
    keys(s, ["source_ref", "text", "trust"]);
    if (!ref(s.source_ref)) fail("material_missing");
    text(s.text, 2000); text(s.trust, 80);
  }
}
function select(refs, sources) {
  if (!Array.isArray(refs) || !refs.length || refs.length > 8 || new Set(refs).size !== refs.length ||
      refs.some(r => !ref(r) || !sources.some(s => s.source_binding === r))) fail("material_missing");
  // Preserve the caller's explicit order and the complete selected bytes.
  return refs.map(r => material(sources.find(s => s.source_binding === r)));
}
const requestFields = ["purpose", "question", "expected_return", "checks", "check_use_owner", "return_method", "feedback_method", "recheck"];
const returnFields = ["source_revision", "selection", "actor", "assistance", "content"];
const decisionFields = ["disposition", "checks", "applicability", "reason", "uncertainty", "unfinished", "next_action", "reconsider_when"];
function operatingBinding(value) {
  keys(value, ["fingerprint", "step_id"]);
  if (!ref(value.fingerprint) || typeof value.step_id !== "string" || !/^[a-z][a-z0-9_-]{0,63}$/u.test(value.step_id)) fail("profile_binding_invalid");
}
function operatingSelection(input) {
  keys(input, ["json", "step_id"]);
  let preview;
  try { preview = previewOperatingProfile(input.json); }
  catch (error) { if (error instanceof OperatingProfileError) fail(`operating_${error.code}`); throw error; }
  const step = preview.profile.steps.find(s => s.id === input.step_id);
  if (!step) fail("profile_step_missing");
  const body = canonical(preview.profile);
  // This consumer accepts one complete ordinary note, not the CLI's entire
  // 65,536-byte domain. Canonicalization preserves every validated value.
  if ([...body].length > 2000) fail("profile_note_budget_exceeded");
  return { binding: { fingerprint: preview.fingerprint, step_id: step.id },
    note: { source: OPERATING + preview.fingerprint.slice(7), text: body,
      provenance: "imported_unverified", observed_at: null, label: "Next check" },
    context: { ...preview, selected_step: step,
      meaning: "Complete authored profile. Local input IDs and source claims are not current source bindings. The saved request separately binds actual work, task and explicitly permitted material; profile goals never replace that work. Permissions and principals remain unverified and ungranted." } };
}
async function readOperatingSelection(binding, args, current, lookupRetained) {
  operatingBinding(binding);
  const locator = OPERATING + binding.fingerprint.slice(7);
  let matches = current.sources.filter(s => s.source_locator === locator).map(note => ({ note, selection: "currently_selected" }));
  if (!matches.length && lookupRetained) {
    const result = await lookupRetained({ repositoryRoot: args.repositoryRoot, expectedSnapshotBinding: args.expectedSnapshotBinding, query: locator });
    if (result.status !== "available" || result.packet_fingerprint !== current.packet_fingerprint || !result.lookup || result.lookup.truncated) fail("profile_material_unavailable");
    matches = result.lookup.results.filter(r => r.note.source_locator === locator);
  }
  if (matches.length !== 1) fail("profile_material_unavailable");
  const { note: source, selection } = matches[0];
  const original = operatingSelection({ json: source.excerpt_text, step_id: binding.step_id });
  if (canonical(original.binding) !== canonical(binding) || source.excerpt_text !== original.note.text ||
      source.trust_class !== "imported_unverified" || source.observed_at !== null) fail("profile_identity_mismatch");
  return { ...original.context, source_ref: source.source_binding, selection };
}
function validate(value) {
  if (value?.profile !== PROFILE) fail("saved_material_unavailable");
  const common = ["profile", "kind"];
  if (value.kind === "request") {
    keys(value, [...common, "choice", "definition", "material", ...requestFields], ["task", "operating_profile"]);
    if (!ref(value.choice) || !ref(value.definition)) fail("invalid_input");
    if (value.task !== undefined && !ref(value.task)) fail("invalid_input");
    if (value.operating_profile !== undefined) operatingBinding(value.operating_profile);
    materials(value.material); requestFields.forEach(k => text(value[k]));
  } else if (value.kind === "return") {
    keys(value, [...common, "request", "material", ...returnFields]);
    if (!ref(value.request) || !ref(value.material)) fail("invalid_input");
    returnFields.forEach(k => text(value[k], k === "content" ? 2000 : 240));
  } else if (value.kind === "decision") {
    keys(value, [...common, "request", "original", "basis", "results", ...decisionFields], ["reassessment"]);
    if (!ref(value.request) || !ref(value.original)) fail("invalid_input");
    keys(value.basis, ["definition", "sources"], ["task"]);
    if (value.basis.task !== undefined && !ref(value.basis.task)) fail("invalid_input");
    if (!ref(value.basis.definition) || !Array.isArray(value.basis.sources) || value.basis.sources.length > 8 || value.basis.sources.some(r => !ref(r))) fail("invalid_input");
    if (!["used", "partly_used", "retained", "deferred", "declined"].includes(value.disposition)) fail("invalid_input");
    decisionFields.forEach(k => text(value[k])); materials(value.results);
    if (value.reassessment !== undefined) text(value.reassessment);
  } else if (value.kind === "feedback") {
    keys(value, [...common, "decision"]);
    if (!ref(value.decision)) fail("invalid_input");
  } else fail("invalid_input");
}
function note(value) {
  validate(value);
  const body = canonical(value);
  if ([...body].length > 2000) fail("note_budget_exceeded");
  return { source: PREFIX + digest(value).slice(7), text: body,
    provenance: value.kind === "return" ? "imported_unverified" : "derived_interpretation", observed_at: null, label: "Next check" };
}
function parse(source, selection = "currently_selected") {
  let value;
  try {
    value = JSON.parse(source.excerpt_text); validate(value);
    if (source.source_locator !== PREFIX + digest(value).slice(7) || source.observed_at !== null ||
        source.trust_class !== (value.kind === "return" ? "imported_unverified" : "derived_interpretation")) fail("invalid_input");
    note(value);
  } catch { fail("saved_material_unavailable"); }
  return { ref: digest(value), source_ref: source.source_binding, selection, value };
}
// Packet/snapshot identity changes on every save. The ordinary reader instead
// supplies the validated origin of this task's revision segment. Legacy notes
// without that binding remain history; identical wording is no substitute.
const taskRelation = (saved, current) => !ref(saved) || !ref(current.task_identity) ? "unknown" : saved === current.task_identity ? "same_task" : "different_task";
// Only the request's exact pinned profile is structural context. Selecting a
// different profile is a support change, not an implicit replacement or latest.
const sourceBasis = (current, operating) => current.sources.filter(s => !profileSource(s) &&
  (!operating || s.source_locator !== OPERATING + operating.fingerprint.slice(7))).map(s => s.source_binding);
function taskIdentity(current) {
  if (!ref(current.task_identity)) fail("task_identity_unavailable");
  return current.task_identity;
}
const basis = (current, operating) => ({ task: taskIdentity(current), definition: digest(current.work_definition), sources: sourceBasis(current, operating) });
const sameBasis = (saved, current, operating) => taskRelation(saved.task, current) === "same_task" && saved.definition === digest(current.work_definition) &&
  canonical([...saved.sources].sort()) === canonical(sourceBasis(current, operating).sort());
function feedbackDelivery(request, original, decision) {
  const d = decision.value;
  return { manual_request_ref: request.ref, manual_return_ref: original.ref, decision_ref: decision.ref,
    disposition: d.disposition, scoped_checks: d.checks, applicability: d.applicability, reason: d.reason,
    uncertainty: d.uncertainty, remaining: d.unfinished, next_instruction: d.next_action, next_check: d.reconsider_when,
    meaning: "Prepared manual feedback from saved authored work. Relay and recipient readback are separate observations; no semantic acceptance or execution authority." };
}

/** Fixed request/return/decision/feedback references only; no history sweep. */
export async function readManualContribution(args, current, choice, lookupRetained) {
  const selected = [];
  for (const s of current.sources) {
    if (s.source_locator?.startsWith(PREFIX)) selected.push(parse(s));
    else {
      let v; try { v = JSON.parse(s.excerpt_text); } catch { /* ordinary prose */ }
      if (v?.profile === PROFILE) fail("saved_material_unavailable");
    }
  }
  for (const kind of ["request", "return", "decision", "feedback"]) {
    if (selected.filter(r => r.value.kind === kind).length > 1) fail("selection_ambiguous");
  }
  async function resolve(fingerprint, kind) {
    if (!ref(fingerprint)) fail("saved_material_unavailable");
    let found = selected.find(r => r.ref === fingerprint);
    if (!found) {
      if (!lookupRetained) fail("saved_material_unavailable");
      const locator = PREFIX + fingerprint.slice(7);
      const result = await lookupRetained({ repositoryRoot: args.repositoryRoot, expectedSnapshotBinding: args.expectedSnapshotBinding, query: locator });
      if (result.status !== "available" || result.packet_fingerprint !== current.packet_fingerprint || !result.lookup || result.lookup.truncated) fail("saved_material_unavailable");
      const matches = result.lookup.results.filter(r => r.note.source_locator === locator);
      if (matches.length !== 1) fail("saved_material_unavailable");
      found = parse(matches[0].note, matches[0].selection);
    }
    if (found.ref !== fingerprint || found.value.kind !== kind) fail("identity_mismatch");
    return found;
  }
  const feedback = selected.find(r => r.value.kind === "feedback") ?? null;
  let decision = selected.find(r => r.value.kind === "decision") ?? null;
  if (feedback) {
    const linked = await resolve(feedback.value.decision, "decision");
    if (decision && decision.ref !== linked.ref) fail("identity_mismatch");
    decision = linked;
  }
  let original = selected.find(r => r.value.kind === "return") ?? null;
  if (decision) {
    const linked = await resolve(decision.value.original, "return");
    if (original && original.ref !== linked.ref) fail("identity_mismatch");
    original = linked;
  }
  let request = selected.find(r => r.value.kind === "request") ?? null;
  if (original) {
    const linked = await resolve(original.value.request, "request");
    if (request && request.ref !== linked.ref) fail("identity_mismatch");
    request = linked;
  }
  if (request && request.value.choice !== digest(choice.value)) fail("identity_mismatch");
  if (original && original.value.material !== digest(request.value.material)) fail("basis_mismatch");
  if (decision && decision.value.request !== request.ref) fail("identity_mismatch");
  const operating = request?.value.operating_profile
    ? await readOperatingSelection(request.value.operating_profile, args, current, lookupRetained) : null;
  const requestTask = request ? taskRelation(request.value.task, current) : null;
  const decisionTask = decision ? taskRelation(decision.value.basis.task, current) : null;
  const requestCurrent = !request || (requestTask === "same_task" && request.value.definition === digest(current.work_definition) &&
    request.value.material.every(s => current.sources.some(c => c.source_binding === s.source_ref && c.excerpt_text === s.text && c.trust_class === s.trust)));
  const decisionCurrent = !decision || sameBasis(decision.value.basis, current, operating);
  return { request, original, decision, feedback: feedback ? { ...feedback, delivery: feedbackDelivery(request, original, decision) } : null,
    ...(operating ? { operating_profile: operating } : {}),
    task_identity: current.task_identity ?? null, request_task: requestTask, decision_task: decisionTask,
    applicability: requestTask === "unknown" ? "request_task_unknown" : requestTask === "different_task" ? "request_task_changed" : !requestCurrent ? "request_basis_changed" : "original_material_selected",
    decision_currentness: !decision ? "not_assessed" : decisionTask === "unknown" ? "task_identity_unknown" : decisionCurrent ? "saved_basis_retained" : "reassessment_required",
    downstream: decision?.value.results.map(s => ({ ...s, selection: current.sources.some(c => c.source_binding === s.source_ref) ? "currently_selected" : "historical_not_selected" })) ?? [],
    delivery: "Manual declarations only; no authenticated delivery, participant identity, material-read witness or native review status. Non-selection never establishes no historical receipt or use.",
    next_action: decision && !decisionCurrent ? "Saved decision task or support changed, or its task identity is unknown. Preserve the original and prior decision; inspect fresh work and deliberately reassess before preparing current feedback." : decision ? decision.value.next_action : original ? "Check the original against the exact request and current applicability; save a separate decision and concrete downstream material." : request ? "Explicitly relay only the delivery object and supply the original bounded file return; preparation is not delivery." : "Prepare selected permitted material for the explicit manual contribution route." };
}

export async function prepareManualContribution(args, current, choice, state, { basisChanged, expired }) {
  let value, delivery, operating;
  if (args.action === "participate") {
    if (state.request) fail("request_already_selected");
    if (basisChanged || expired) fail("reconsideration_required");
    const p = args.participation;
    keys(p, [...requestFields, "material_refs"], ["operating_profile"]); requestFields.forEach(k => text(p[k]));
    if (p.operating_profile !== undefined) operating = operatingSelection(p.operating_profile);
    value = { profile: PROFILE, kind: "request", choice: digest(choice.value), task: taskIdentity(current), definition: digest(current.work_definition),
      material: select(p.material_refs, current.sources.filter(s => choice.value.basis.sources.includes(s.source_binding) && !profileSource(s, Boolean(operating)))),
      ...Object.fromEntries(requestFields.map(k => [k, p[k]])),
      ...(operating ? { operating_profile: operating.binding } : {}) };
    delivery = { manual_request_ref: digest(value), material_ref: digest(value.material), request: value,
      ...(operating ? { operating_profile: operating.context } : {}),
      meaning: "Explicitly selected complete excerpts; current-source metadata locators are omitted and never fetched. Authored profile fields, when selected, remain complete literal data and require disclosure review. Untrusted manual contribution request; no command authority." };
  } else if (args.action === "receive") {
    if (!state.request || state.original || state.decision) fail("receive_not_eligible");
    const r = args.manual_return;
    keys(r, ["manual_request_ref", "material_ref", ...returnFields]);
    if (r.manual_request_ref !== state.request.ref) fail("request_mismatch");
    if (r.material_ref !== digest(state.request.value.material)) fail("basis_mismatch");
    value = { profile: PROFILE, kind: "return", request: r.manual_request_ref, material: r.material_ref,
      ...Object.fromEntries(returnFields.map(k => [k, r[k]])) };
  } else if (args.action === "assess") {
    if (!state.request || !state.original || state.decision) fail("assessment_not_eligible");
    const a = args.assessment;
    keys(a, ["manual_request_ref", "manual_return_ref", "result_refs", ...decisionFields], ["reassessment"]);
    if (a.manual_request_ref !== state.request.ref || a.manual_return_ref !== state.original.ref) fail("request_mismatch");
    if (state.applicability !== "original_material_selected" && a.reassessment === undefined) fail("reassessment_required");
    const results = select(a.result_refs, current.sources.filter(s => !profileSource(s, Boolean(state.operating_profile))));
    if (["used", "partly_used", "retained"].includes(a.disposition) &&
        !results.some(s => !choice.value.basis.sources.includes(s.source_ref))) fail("downstream_work_required");
    value = { profile: PROFILE, kind: "decision", request: state.request.ref, original: state.original.ref,
      basis: basis(current, state.operating_profile), results, ...Object.fromEntries(decisionFields.map(k => [k, a[k]])),
      ...(a.reassessment !== undefined ? { reassessment: a.reassessment } : {}) };
  } else if (args.action === "feedback") {
    if (!state.decision) fail("decision_required");
    if (state.decision_currentness !== "saved_basis_retained") fail("reassessment_required");
    if (state.feedback) fail("feedback_already_selected");
    value = { profile: PROFILE, kind: "feedback", decision: state.decision.ref };
    delivery = feedbackDelivery(state.request, state.original, state.decision);
  } else fail("invalid_input");
  const added = note(value);
  const additions = [added];
  if (operating) {
    const selected = current.sources.filter(s => s.source_locator === operating.note.source);
    if (selected.length > 1 || selected.some(s => s.excerpt_text !== operating.note.text || s.trust_class !== "imported_unverified" || s.observed_at !== null)) fail("profile_identity_mismatch");
    if (!selected.length) additions.push(operating.note);
  }
  if ((operating || state.operating_profile) && current.sources.length + additions.length > 8) fail("profile_selection_budget_exceeded");
  return { status: "prepared", prepared_stage: args.action, ...(delivery ? { delivery } : {}), manual_ref: digest(value),
    revision_tool: "augnes_preview_repository_work_revision",
    revision_arguments: { repositoryRoot: args.repositoryRoot, expectedSnapshotBinding: args.expectedSnapshotBinding, changes: { sources: { add: additions } } },
    next_action: "Inspect the ordinary preview, explicitly save with its binding, and read fresh work. Only the delivery object is prepared for manual relay. Nothing has been saved or sent." };
}
