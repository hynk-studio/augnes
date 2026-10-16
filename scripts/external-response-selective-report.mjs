// Ordinary, deterministic consumer of one declared A -> B -> C lineage and D.
// This profile interprets content; it adds no Core record, graph or authority.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { independentCostOracle } from "./external-response-report.mjs";
import { canonical, hashBytes, ref, keys } from "../lib/vnext/external-response-rules.mjs";

const PROFILE = "selective-worker-report.v1";
const refuse = (reason) => { throw Object.assign(new Error(reason), { reason }); };
const requireThat = (condition, reason) => { if (!condition) refuse(reason); };
const json = (bytes) => JSON.parse(bytes.toString("utf8"));
const bytes = (value) => Buffer.from(JSON.stringify(value, null, 2) + "\n");
const binding = (value) => hashBytes(canonical(value));

export async function selectiveExternalReport(repositoryRoot, directory) {
  const actions = [], observations = new Map(), previousJudgments = new Map();
  let id = 0, arithmeticChecks = 0;
  const op = async (action, data, expected_material_ref) => {
    const reply = await handleMessageV01({
      jsonrpc: "2.0", id: ++id, method: "tools/call",
      params: { name: "augnes_external_repository_work", arguments: {
        repository_root: repositoryRoot, action,
        ...(data ? { data } : {}), ...(expected_material_ref ? { expected_material_ref } : {}),
      } },
    });
    const value = reply.result?.structuredContent;
    actions.push({ action, status: value?.status ?? "unavailable" });
    requireThat(value && ["available", "saved", "exact_replay"].includes(value.status),
      value?.reason ?? "selective_entry_unavailable");
    return value;
  };
  const experience = async (r, track = true) => {
    ref(r);
    const value = await op("read_experience", { ref: r });
    requireThat(value.experience.kind === "experience" && value.dependencies.length === 1 &&
      value.dependencies[0].status !== "unavailable", "selective_dependency_unknown");
    if (track) observations.set(r, binding({ experience: value.experience, dependencies: value.dependencies }));
    return value;
  };
  const read = async (r, experience_ref) => {
    ref(r);
    const { material } = await op("material", { ref: r, ...(experience_ref ? { experience_ref } : {}) });
    const body = Buffer.from(material.base64, "base64");
    requireThat(material.ref === r && body.length === material.metadata.size &&
      hashBytes(body) === material.metadata.sha256, "selective_material_integrity_failed");
    return { ...material, body, value: json(body) };
  };
  const initial = await op("read");
  const selected = initial.sources.filter(s => s.source_locator === "note-ref:selective-report-contract");
  requireThat(selected.length === 1, "selective_contract_required");
  const contract = JSON.parse(selected[0].excerpt_text);
  keys(contract, ["version", "intermediate_query", "independent_query", "repetitions", "period", "output"]);
  requireThat(contract.version === PROFILE && Number.isSafeInteger(contract.repetitions) &&
    contract.repetitions > 0 && contract.repetitions <= 1000 &&
    /^[a-z0-9-]+\.json$/.test(contract.output) && typeof contract.period === "string", "selective_contract_invalid");
  const find = async (query, profile) => {
    const found = await op("discover", { query });
    const candidates = [];
    for (const item of found.experiences) {
      const e = await op("read_experience", { ref: item.ref });
      let conditions;
      try { conditions = JSON.parse(e.experience.payload.conditions); } catch { continue; }
      if (conditions.version === profile) candidates.push({ e, conditions });
    }
    requireThat(candidates.length === 1, "selective_source_ambiguous_or_absent");
    requireThat(candidates[0].e.experience.kind === "experience" && candidates[0].e.dependencies.length === 1 &&
      candidates[0].e.dependencies[0].status === "available", "selective_direct_correction_requires_review");
    const chosen = candidates[0].e;
    observations.set(chosen.experience.ref, binding({ experience: chosen.experience, dependencies: chosen.dependencies }));
    return candidates[0];
  };
  const { e: b, conditions: lineage } = await find(contract.intermediate_query, "worker-report-lineage.v1");
  keys(lineage, ["version", "period", "population", "upstream", "input_ref", "result_ref", "report_ref"]);
  requireThat(lineage.period === contract.period && lineage.population === "all", "selective_basis_mismatch");
  keys(lineage.upstream, ["experience_ref", "material_ref", "version", "sha256"]);
  const originalA = await experience(lineage.upstream.experience_ref);
  const originalInput = await read(lineage.upstream.material_ref, originalA.experience.ref);
  requireThat(originalInput.metadata.version === lineage.upstream.version &&
    originalInput.metadata.sha256 === lineage.upstream.sha256 &&
    originalInput.metadata.applicability === contract.period &&
    originalInput.metadata.dependencies.length === 0, "selective_basis_mismatch");
  const bInput = await read(lineage.input_ref, b.experience.ref);
  const bResult = await read(lineage.result_ref, b.experience.ref);
  const bReport = await read(lineage.report_ref, b.experience.ref);
  requireThat(bInput.body.equals(originalInput.body) &&
    canonical(bInput.metadata.dependencies) === canonical([originalInput.ref]) &&
    canonical(bResult.metadata.dependencies) === canonical([bInput.ref]) &&
    bResult.value.version === "build-cost-result.v1" &&
    bResult.value.input_ref === bInput.ref && bResult.value.population === "all" &&
    bReport.value.input_material === bInput.ref && bReport.value.result_material === bResult.ref &&
    canonical(bReport.metadata.dependencies) === canonical([bResult.ref]), "selective_intermediate_binding_invalid");
  ref(bReport.value.check_ref);
  const { e: d, conditions: independent } = await find(contract.independent_query, "reservation-invoice.v1");
  keys(independent, ["version", "material_ref", "period"]);
  const invoice = await read(independent.material_ref, d.experience.ref);
  keys(invoice.value, ["version", "period", "units", "unit_cents"]);
  requireThat(invoice.value.version === "reservation-invoice.v1" &&
    invoice.value.period === contract.period && independent.period === contract.period &&
    invoice.metadata.applicability === contract.period &&
    invoice.metadata.dependencies.length === 0 &&
    [invoice.value.units, invoice.value.unit_cents].every(n => Number.isSafeInteger(n) && n >= 0),
  "selective_independent_basis_invalid");

  // Follow only the producer's explicit replacement chain, never titles, dates,
  // graph reachability, a guessed latest version or an evaluator's correction ID.
  const pending = originalA.dependencies[0].corrections.map(c => ({ ...c, change: JSON.parse(c.statement) }));
  requireThat(pending.length <= 8, "selective_inspection_limit");
  let current = originalInput;
  const inspectedInputs = new Map([[originalInput.ref, originalInput]]);
  const correctionRefs = [];
  while (pending.length) {
    const next = pending.filter(c => c.change.previous_material_ref === current.ref);
    requireThat(next.length === 1, "selective_correction_chain_ambiguous");
    const correction = next[0], change = correction.change;
    keys(change, ["version", "previous_material_ref", "replacement_experience_ref", "replacement_material_ref", "replacement_version", "replacement_sha256"]);
    requireThat(change.version === "worker-input-replacement.v1", "selective_correction_profile_unknown");
    const replacement = await experience(change.replacement_experience_ref);
    requireThat(replacement.dependencies[0].status === "available", "selective_replacement_correction_requires_review");
    const nextInput = await read(change.replacement_material_ref, replacement.experience.ref);
    requireThat(nextInput.metadata.version === change.replacement_version &&
      nextInput.metadata.sha256 === change.replacement_sha256 &&
      nextInput.metadata.applicability === originalInput.metadata.applicability &&
      canonical(nextInput.metadata.dependencies) === canonical([current.ref]), "selective_replacement_binding_invalid");
    current = nextInput;
    inspectedInputs.set(current.ref, current);
    correctionRefs.push(correction.ref);
    pending.splice(pending.indexOf(correction), 1);
  }
  // Only annotation may vary without changing the calculation. Unknown fields
  // are not silently classified as harmless metadata.
  for (const input of [originalInput, current]) {
    keys(input.value, ["schema_version", "events"], ["annotation"]);
    requireThat(input.value.schema_version === "build-events.v1" && Array.isArray(input.value.events), "selective_input_invalid");
  }
  const calculationBinding = binding({ version: PROFILE, contract: selected[0].source_binding,
    intermediate: bReport.ref, independent: invoice.ref, events: current.value.events,
    schema: current.value.schema_version, repetitions: contract.repetitions, period: contract.period });
  const cached = initial.materials.filter(m => m.metadata.name === contract.output &&
    m.metadata.version === PROFILE && m.metadata.source === calculationBinding);
  requireThat(cached.length <= 1, "selective_cached_output_ambiguous");
  let output, outputRef, derivedRef, decision;
  if (cached.length) {
    const old = await read(cached[0].ref);
    keys(old.value, ["version", "calculation_binding", "period", "repetitions", "projected_worker_ms", "reservation_fee_cents",
      "original_intermediate", "original_check_ref", "independent_material", "source_material", "derived_material"]);
    requireThat(old.value.calculation_binding === calculationBinding &&
      old.value.version === PROFILE && old.value.period === contract.period && old.value.repetitions === contract.repetitions &&
      old.value.original_intermediate === bReport.ref && old.value.independent_material === invoice.ref &&
      old.value.original_check_ref === bReport.value.check_ref &&
      canonical(inspectedInputs.get(old.value.source_material)?.value.events) === canonical(current.value.events) &&
      old.metadata.dependencies.includes(invoice.ref) && old.metadata.dependencies.includes(bReport.ref), "selective_cached_output_invalid");
    // Reuse needs the earlier attributable check, not just a name or a caller's
    // matching material metadata. Its historical observation remains historical.
    const prior = await op("discover", { query: "Selective worker report applicability" });
    let attested = false;
    for (const item of prior.experiences) {
      const previous = await op("read_experience", { ref: item.ref });
      const e = previous.experience;
      let declaration;
      try { declaration = JSON.parse(e.payload.conditions); } catch { continue; }
      if (declaration.version !== PROFILE || declaration.output_ref !== old.ref) continue;
      requireThat(previous.dependencies.length === 1 && previous.dependencies[0].status === "available",
        "selective_previous_judgment_requires_review");
      // Recheck cache authority without making a replay depend on its own
      // previous publication (which would generate a new judgment forever).
      previousJudgments.set(e.ref, binding({ experience: e, dependencies: previous.dependencies }));
      const retained = await read(declaration.assessment_ref);
      if (e.payload.materials.includes(old.ref) && e.payload.materials.includes(retained.ref) &&
          retained.value.calculation_binding === calculationBinding && retained.value.output_ref === old.ref &&
          retained.value.original_check_ref === bReport.value.check_ref &&
          retained.value.current_input_ref === old.value.source_material) attested = true;
    }
    if (attested) {
      output = old.body; outputRef = old.ref; derivedRef = old.value.derived_material;
      decision = "retain";
    }
    // A prior invocation may have saved material but failed before publication.
    // This explicit new invocation checks it again instead of treating an orphan
    // as checked output or retrying an uncertain write inside the failed call.
  }
  if (!outputRef) {
    const original = independentCostOracle(originalInput.value, "all"); arithmeticChecks++;
    for (const [k, v] of Object.entries(original)) assert.equal(bResult.value[k], v, `B independent check: ${k}`);
    assert.equal(bReport.value.total_worker_ms, original.total_ms);
    assert.equal(bReport.value.failed_worker_ms, original.failed_ms);
    const sameCalculation = canonical(originalInput.value.events) === canonical(current.value.events);
    const corrected = sameCalculation ? original : independentCostOracle(current.value, "all");
    if (!sameCalculation) arithmeticChecks++;
    const projected = BigInt(sameCalculation ? bReport.value.total_worker_ms : corrected.total_ms) * BigInt(contract.repetitions);
    const fee = BigInt(invoice.value.units) * BigInt(invoice.value.unit_cents);
    requireThat(projected <= BigInt(Number.MAX_SAFE_INTEGER) && fee <= BigInt(Number.MAX_SAFE_INTEGER), "selective_result_out_of_bounds");
    derivedRef = sameCalculation ? bReport.ref : null;
    output = { version: PROFILE, calculation_binding: calculationBinding, period: contract.period,
      repetitions: contract.repetitions, projected_worker_ms: Number(projected), reservation_fee_cents: Number(fee),
      original_intermediate: bReport.ref, original_check_ref: bReport.value.check_ref,
      independent_material: invoice.ref, source_material: current.ref, derived_material: derivedRef };
    decision = sameCalculation ? "use_original" : "revise";
    // Hold all prospective writes until the bounded read is coherent.
    output.corrected = corrected;
  }

  for (const [r, observed] of [...observations, ...previousJudgments]) {
    const fresh = await op("read_experience", { ref: r });
    requireThat(binding({ experience: fresh.experience, dependencies: fresh.dependencies }) === observed,
      "selective_dependencies_changed_during_read");
  }
  requireThat((await op("read")).material_basis === initial.material_basis, "selective_work_basis_changed");
  const observedAt = new Date().toISOString();
  const put = async (name, body, dependencies, source, version) => (await op("put_material", {
    metadata: { name, media_type: "application/json", version, source, applicability: contract.period,
      dependencies, sha256: hashBytes(body), size: body.length }, base64: body.toString("base64"),
  }, initial.material_basis)).material_ref;
  if (!outputRef) {
    const corrected = output.corrected; delete output.corrected;
    if (!derivedRef) derivedRef = await put("rechecked-intermediate.json", bytes({
      version: "rechecked-worker-total.v1", source_material: current.ref,
      original_intermediate: bReport.ref, original_check_ref: bReport.value.check_ref, ...corrected,
    }), [current.ref, bReport.ref], calculationBinding, "rechecked-worker-total.v1");
    // C consumes the checked B bytes (or the newly written and reacquired B'),
    // not an evaluator's expected answer or a mere dependency declaration.
    const usedTotal = derivedRef === bReport.ref ? bReport.value.total_worker_ms
      : (await read(derivedRef)).value.total_ms;
    output.projected_worker_ms = Number(BigInt(usedTotal) * BigInt(contract.repetitions));
    output.derived_material = derivedRef;
    output = bytes(output);
    outputRef = await put(contract.output, output, [...new Set([bReport.ref, invoice.ref, current.ref, derivedRef])], calculationBinding, PROFILE);
  }
  const assessment = { version: PROFILE, calculation_binding: calculationBinding, output_ref: outputRef,
    original_check_ref: bReport.value.check_ref, current_input_ref: current.ref, correction_refs: correctionRefs,
    observations: [...observations].map(([ref, binding]) => ({ ref, binding })),
    reason: "Build-duration changes affect the projected worker total. The separately sourced invoice alone supports the reservation fee. Equal event bytes retain the prior calculation; annotation is not an arithmetic input.",
    limitation: "Bounded scripted observation at read time; publication is not a transaction over other projects, semantic acceptance or execution authority." };
  const assessmentBinding = binding(assessment);
  const assessmentMaterial = await put("selective-applicability.json", bytes(assessment),
    [outputRef, current.ref], assessmentBinding, PROFILE);
  const published = await op("publish", { key: `selective:${assessmentBinding.slice(7)}`, title: "Selective worker report applicability",
    source_refs: [selected[0].source_binding], conditions: canonical({ version: PROFILE, assessment_ref: assessmentMaterial, output_ref: outputRef }),
    association: { endpoint: "none", account: "unresolved", operator: "scripted consumer", confidence: "bounded arithmetic" },
    assessment: assessment.reason, materials: [outputRef, assessmentMaterial], targets: [],
  }, initial.material_basis);
  writeFileSync(path.join(directory, contract.output), output, { flag: "wx" });
  return { status: "completed", decision, arithmetic_checks: arithmeticChecks, output: contract.output,
    output_ref: outputRef, sha256: hashBytes(output), derived_ref: derivedRef,
    assessment_ref: published.record.ref, assessment_material_ref: assessmentMaterial,
    assessment_status: published.status, observed_at: observedAt,
    correction_refs: correctionRefs, actions, process: process.pid, runtime: process.version };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  selectiveExternalReport(process.argv[2], process.cwd()).then(value => console.log(JSON.stringify(value))).catch(error => {
    console.log(JSON.stringify({ status: "stopped", reason: error.reason ?? "selective_profile_or_check_failed", process: process.pid, runtime: process.version }));
    process.exitCode = 1;
  });
}
