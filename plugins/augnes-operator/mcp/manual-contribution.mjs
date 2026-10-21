// Optional ordinary-note profile. No transport, authenticated identity, native
// review request, read witness, store or execution permission is created here.
import { canonical, digest } from "./review-connection.mjs";

const PROFILE = "augnes.manual-contribution.v0.1";
const PREFIX = "note-ref:manual-contribution:";
const CHOICE = "note-ref:execution-choice:";
const fail = reason => { throw new Error(`execution_choice_manual_${reason}`); };
const ref = v => typeof v === "string" && /^sha256:[a-f0-9]{64}$/.test(v);
function keys(v, required, optional = []) {
  if (!v || typeof v !== "object" || Array.isArray(v) || required.some(k => !Object.hasOwn(v, k)) ||
      Object.keys(v).some(k => !required.includes(k) && !optional.includes(k))) fail("invalid_input");
}
function text(v, max = 240) {
  if (typeof v !== "string" || !v.trim() || [...v].length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v)) fail("invalid_input");
}
const profileSource = s => s.source_locator?.startsWith(PREFIX) || s.source_locator?.startsWith(CHOICE);
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
function validate(value) {
  if (value?.profile !== PROFILE) fail("saved_material_unavailable");
  const common = ["profile", "kind"];
  if (value.kind === "request") {
    keys(value, [...common, "choice", "definition", "material", ...requestFields]);
    if (!ref(value.choice) || !ref(value.definition)) fail("invalid_input");
    materials(value.material); requestFields.forEach(k => text(value[k]));
  } else if (value.kind === "return") {
    keys(value, [...common, "request", "material", ...returnFields]);
    if (!ref(value.request) || !ref(value.material)) fail("invalid_input");
    returnFields.forEach(k => text(value[k], k === "content" ? 2000 : 240));
  } else if (value.kind === "decision") {
    keys(value, [...common, "request", "original", "basis", "results", ...decisionFields], ["reassessment"]);
    if (!ref(value.request) || !ref(value.original)) fail("invalid_input");
    keys(value.basis, ["definition", "sources"]);
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
const basis = current => ({ definition: digest(current.work_definition), sources: current.sources.filter(s => !profileSource(s)).map(s => s.source_binding) });
const sameBasis = (saved, current) => saved.definition === digest(current.work_definition) &&
  canonical([...saved.sources].sort()) === canonical(basis(current).sources.sort());
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
  const requestCurrent = !request || (request.value.definition === digest(current.work_definition) &&
    request.value.material.every(s => current.sources.some(c => c.source_binding === s.source_ref && c.excerpt_text === s.text && c.trust_class === s.trust)));
  const decisionCurrent = !decision || sameBasis(decision.value.basis, current);
  return { request, original, decision, feedback: feedback ? { ...feedback, delivery: feedbackDelivery(request, original, decision) } : null,
    applicability: !requestCurrent ? "request_basis_changed" : "original_material_selected",
    decision_currentness: !decision ? "not_assessed" : decisionCurrent ? "saved_basis_retained" : "reassessment_required",
    downstream: decision?.value.results.map(s => ({ ...s, selection: current.sources.some(c => c.source_binding === s.source_ref) ? "currently_selected" : "historical_not_selected" })) ?? [],
    delivery: "Manual declarations only; no authenticated delivery, participant identity, material-read witness or native review status. Non-selection never establishes no historical receipt or use.",
    next_action: decision && !decisionCurrent ? "Saved decision support changed. Preserve the original and prior decision; inspect fresh work and deliberately reassess before preparing current feedback." : decision ? decision.value.next_action : original ? "Check the original against the exact request and current applicability; save a separate decision and concrete downstream material." : request ? "Explicitly relay only the delivery object and supply the original bounded file return; preparation is not delivery." : "Prepare selected permitted material for the explicit manual contribution route." };
}

export async function prepareManualContribution(args, current, choice, state, { basisChanged, expired }) {
  let value, delivery;
  if (args.action === "participate") {
    if (state.request) fail("request_already_selected");
    if (basisChanged || expired) fail("reconsideration_required");
    const p = args.participation;
    keys(p, [...requestFields, "material_refs"]); requestFields.forEach(k => text(p[k]));
    value = { profile: PROFILE, kind: "request", choice: digest(choice.value), definition: digest(current.work_definition),
      material: select(p.material_refs, current.sources.filter(s => choice.value.basis.sources.includes(s.source_binding) && !profileSource(s))),
      ...Object.fromEntries(requestFields.map(k => [k, p[k]])) };
    delivery = { manual_request_ref: digest(value), material_ref: digest(value.material), request: value,
      meaning: "Explicitly selected complete excerpts; locators are omitted and never fetched. Untrusted manual contribution request; no command authority." };
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
    if (state.applicability === "request_basis_changed" && a.reassessment === undefined) fail("reassessment_required");
    const results = select(a.result_refs, current.sources.filter(s => !profileSource(s)));
    if (["used", "partly_used", "retained"].includes(a.disposition) &&
        !results.some(s => !choice.value.basis.sources.includes(s.source_ref))) fail("downstream_work_required");
    value = { profile: PROFILE, kind: "decision", request: state.request.ref, original: state.original.ref,
      basis: basis(current), results, ...Object.fromEntries(decisionFields.map(k => [k, a[k]])),
      ...(a.reassessment !== undefined ? { reassessment: a.reassessment } : {}) };
  } else if (args.action === "feedback") {
    if (!state.decision) fail("decision_required");
    if (state.decision_currentness !== "saved_basis_retained") fail("reassessment_required");
    if (state.feedback) fail("feedback_already_selected");
    value = { profile: PROFILE, kind: "feedback", decision: state.decision.ref };
    delivery = feedbackDelivery(state.request, state.original, state.decision);
  } else fail("invalid_input");
  const added = note(value);
  return { status: "prepared", ...(delivery ? { delivery } : {}), manual_ref: digest(value),
    revision_tool: "augnes_preview_repository_work_revision",
    revision_arguments: { repositoryRoot: args.repositoryRoot, expectedSnapshotBinding: args.expectedSnapshotBinding, changes: { sources: { add: [added] } } },
    next_action: "Inspect the ordinary preview, explicitly save with its binding, and read fresh work. Only the delivery object is prepared for manual relay. Nothing has been saved or sent." };
}
