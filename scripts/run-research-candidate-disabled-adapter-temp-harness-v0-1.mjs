import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ARTIFACT_DIR = "/tmp/augnes-disabled-adapter-temp-harness-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const CONTRACT_REVIEW_PATH = path.join(ARTIFACT_DIR, "contract-review.json");
const TEMP_HARNESS_PATH = path.join(ARTIFACT_DIR, "temp-harness.json");
const READINESS_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-disabled-promotion-write-adapter-readiness.sample.v0.1.json";

const readiness = JSON.parse(await readFile(READINESS_FIXTURE_PATH, "utf8"));
const contractReview = buildContractReview(readiness);
const tempHarness = buildTempHarness(readiness, contractReview);
const report = {
  run_name: "research-candidate-disabled-adapter-temp-harness-v0-1",
  source_fixture: READINESS_FIXTURE_PATH,
  artifact_dir: ARTIFACT_DIR,
  artifact_paths: {
    report: REPORT_PATH,
    contract_review: CONTRACT_REVIEW_PATH,
    temp_harness: TEMP_HARNESS_PATH,
  },
  contract_review: contractReview,
  temp_harness: tempHarness,
  preserved_boundaries: {
    temp_harness_only: true,
    normal_product_write_enabled: false,
    product_db_write: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    durable_persistence: false,
    browser_persistence: false,
  },
  final_status:
    contractReview.contract_status === "ready_for_temp_harness" &&
    tempHarness.harness_status === "temp_harness_ready"
      ? "pass"
      : "fail",
};

await mkdir(ARTIFACT_DIR, { recursive: true });
await writeFile(CONTRACT_REVIEW_PATH, `${JSON.stringify(contractReview, null, 2)}\n`);
await writeFile(TEMP_HARNESS_PATH, `${JSON.stringify(tempHarness, null, 2)}\n`);
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      harness: "research-candidate-disabled-adapter-temp-harness-v0-1",
      final_status: report.final_status,
      artifact_paths: report.artifact_paths,
    },
    null,
    2,
  ),
);

if (report.final_status !== "pass") {
  process.exitCode = 1;
}

function buildContractReview(source) {
  const checks = {
    disabled_adapter_status_present: source.adapter_status === "disabled_by_default",
    write_execution_status_not_executable:
      source.write_execution_status === "not_executable",
    normal_product_write_disabled:
      source.disabled_write_contract?.normal_product_write_enabled === false &&
      source.execution_boundary?.normal_product_write_enabled === false,
    actual_promotion_false:
      source.execution_boundary?.actual_promotion_performed === false &&
      source.local_copy_packet?.actual_promotion_allowed === false,
    proof_evidence_write_false:
      source.execution_boundary?.proof_or_evidence_writes === false,
    perspective_canonical_write_false:
      source.execution_boundary?.perspective_or_canonical_writes === false,
    canonical_graph_write_false:
      source.execution_boundary?.canonical_graph_write === false,
    work_item_creation_false: source.execution_boundary?.work_item_creation === false,
    provider_retrieval_source_fetch_false:
      source.execution_boundary?.provider_or_openai_calls === false &&
      source.execution_boundary?.retrieval_or_rag === false &&
      source.execution_boundary?.source_fetching === false,
    external_handoff_false:
      source.execution_boundary?.external_handoff_sent === false,
    persistence_false:
      source.execution_boundary?.adapter_readiness_persisted === false &&
      source.execution_boundary?.browser_persistence === false &&
      source.local_copy_packet?.packet_persisted === false,
    idempotency_skeleton_present:
      source.idempotency_skeleton?.idempotency_required === true,
    rollback_skeleton_present:
      source.rollback_skeleton?.rollback_required === true,
    review_audit_skeleton_present:
      source.review_audit_skeleton?.audit_record_required === true,
    write_target_mapping_skeleton_present:
      Boolean(source.write_target_mapping_skeleton) &&
      Array.isArray(source.write_target_mapping_skeleton.claim_write_targets) &&
      Array.isArray(source.write_target_mapping_skeleton.evidence_write_targets) &&
      Array.isArray(source.write_target_mapping_skeleton.perspective_write_targets) &&
      Array.isArray(source.write_target_mapping_skeleton.source_verification_targets) &&
      Array.isArray(source.write_target_mapping_skeleton.work_item_targets),
  };
  const gaps = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([checkId]) => ({
      check_id: checkId,
      severity: "blocker",
      message: `${checkId} failed; temp harness simulation remains blocked.`,
    }));
  const review = {
    review_kind: "manual_note_disabled_adapter_contract_review",
    review_version: "manual_note_disabled_adapter_contract_review.v0.1",
    preview_draft_id: source.preview_draft_id,
    temp_harness_label: "Fixture-backed temp harness script",
    source_readiness: {
      adapter_kind: source.adapter_kind,
      adapter_version: source.adapter_version,
      adapter_status: source.adapter_status,
      write_execution_status: source.write_execution_status,
      local_copy_fingerprint: source.local_copy_packet.fingerprint,
      source_authority_design_packet_fingerprint:
        source.source_authority_design.packet_fingerprint,
    },
    contract_status:
      gaps.length === 0 ? "ready_for_temp_harness" : "blocked_by_contract_gap",
    contract_summary:
      gaps.length === 0
        ? "Disabled adapter readiness preserves the required no product write contract for a temp harness simulation."
        : "Disabled adapter readiness has contract gaps and cannot move into the temp harness simulation.",
    required_contract_checks: checks,
    contract_gaps: gaps,
    preserved_boundaries: preservedBoundaries(),
    next_recommended_slice:
      "temp_harness_review_and_fixture_only_write_adapter_contract",
  };
  return {
    ...review,
    review_fingerprint: fingerprint({
      review_kind: review.review_kind,
      review_version: review.review_version,
      preview_draft_id: review.preview_draft_id,
      readiness_local_copy_fingerprint: source.local_copy_packet.fingerprint,
      false_boundary_flags: review.preserved_boundaries,
    }),
  };
}

function buildTempHarness(source, contractReview) {
  const intents = buildSimulatedIntents(source);
  const harness = {
    harness_kind: "manual_note_disabled_adapter_temp_harness",
    harness_version: "manual_note_disabled_adapter_temp_harness.v0.1",
    preview_draft_id: source.preview_draft_id,
    source_contract_review_fingerprint: contractReview.review_fingerprint,
    temp_harness_label: "Fixture-backed temp harness script",
    harness_status:
      contractReview.contract_status === "ready_for_temp_harness"
        ? "temp_harness_ready"
        : "blocked_by_contract_gap",
    execution_mode: "temp_non_product_simulation",
    product_write_mode: "disabled",
    temp_execution_summary:
      "Sandbox simulation produced temp-only write intents and performed no product write.",
    simulated_write_intents: intents,
    idempotency_temp_harness: {
      idempotency_required: true,
      idempotency_key_generated_now: true,
      idempotency_key_kind: "temp_harness_only",
      idempotency_storage_added: false,
      product_idempotency_storage_added: false,
      future_contract_required: true,
    },
    rollback_temp_harness: {
      rollback_required: true,
      rollback_simulated: true,
      rollback_storage_added: false,
      product_rollback_performed: false,
      future_contract_required: true,
    },
    review_audit_temp_harness: {
      audit_required: true,
      audit_simulated: true,
      audit_record_created_now: false,
      approval_history_created_now: false,
      product_audit_storage_added: false,
      future_contract_required: true,
    },
    temp_harness_boundary: {
      temp_harness_only: true,
      normal_product_write_enabled: false,
      product_db_write: false,
      actual_promotion_performed: false,
      proof_or_evidence_writes: false,
      perspective_or_canonical_writes: false,
      canonical_graph_write: false,
      work_item_creation: false,
      provider_or_openai_calls: false,
      retrieval_or_rag: false,
      source_fetching: false,
      external_handoff_sent: false,
      durable_persistence: false,
      browser_persistence: false,
    },
    next_recommended_slice: "fixture_only_disabled_write_adapter_contract_tests",
  };
  const harnessFingerprint = fingerprint({
    harness_kind: harness.harness_kind,
    harness_version: harness.harness_version,
    preview_draft_id: harness.preview_draft_id,
    contract_review_fingerprint: contractReview.review_fingerprint,
    simulated_intent_ids: Object.values(intents)
      .flat()
      .map((intent) => intent.simulated_intent_id)
      .sort(),
    false_boundary_flags: harness.temp_harness_boundary,
  });
  return {
    ...harness,
    harness_fingerprint: harnessFingerprint,
    local_copy_packet: {
      markdown: [
        "# Manual Note Disabled Adapter Temp Harness",
        "",
        "Temp harness only.",
        "This does not perform normal product writes.",
        `harness_status: ${harness.harness_status}`,
        `product_write_mode: ${harness.product_write_mode}`,
      ].join("\n"),
      json: JSON.stringify(
        {
          harness_status: harness.harness_status,
          product_write_mode: harness.product_write_mode,
          product_db_write: false,
        },
        null,
        2,
      ),
      fingerprint: harnessFingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted: false,
      product_write_authority_granted: false,
      actual_promotion_allowed: false,
    },
  };
}

function buildSimulatedIntents(source) {
  const mapping = source.write_target_mapping_skeleton;
  return {
    claim_intents: mapping.claim_write_targets.map((target, index) =>
      intent("claim", index, {
        source_candidate_id: target.source_claim_candidate_id,
        target_kind: target.target_table_or_kind_placeholder,
      }),
    ),
    evidence_intents: mapping.evidence_write_targets.map((target, index) =>
      intent("evidence", index, {
        source_candidate_id: target.source_evidence_candidate_id,
        target_kind: target.target_table_or_kind_placeholder,
      }),
    ),
    perspective_intents: mapping.perspective_write_targets.map((target, index) =>
      intent("perspective", index, {
        source_candidate_id: target.source_perspective_delta_candidate_id,
        target_kind: target.target_table_or_kind_placeholder,
      }),
    ),
    source_verification_intents: mapping.source_verification_targets.map(
      (target, index) =>
        intent("source", index, {
          source_ref_id: target.source_ref_id,
          target_kind: target.target_table_or_kind_placeholder,
        }),
    ),
    work_item_intents: mapping.work_item_targets.map((target, index) =>
      intent("work", index, {
        source_candidate_id: target.source_follow_up_work_candidate_id,
        target_kind: target.target_table_or_kind_placeholder,
      }),
    ),
  };
}

function intent(kind, index, values) {
  return {
    simulated_intent_id: `temp-intent:${kind}:${String(index + 1).padStart(3, "0")}`,
    ...values,
    product_record_id: null,
    canonical_id: null,
    proof_id: null,
    evidence_id: null,
    work_item_id: null,
    write_performed_now: false,
    product_write_allowed: false,
    temp_harness_only: true,
  };
}

function preservedBoundaries() {
  return {
    normal_product_write_enabled: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    durable_persistence: false,
    browser_persistence: false,
  };
}

function fingerprint(value) {
  const canonical = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  return `{${Object.entries(value)
    .filter(([key]) => key !== "generated_at" && key !== "selected_at")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}
