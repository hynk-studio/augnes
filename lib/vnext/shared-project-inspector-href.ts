import type {
  SharedProjectInspectorFingerprintTargetKindV01,
  SharedProjectInspectorTargetV01,
} from "@/types/vnext/shared-project-inspector";

export const SHARED_PROJECT_INSPECTOR_PATH_V01 =
  "/workbench/inspector" as const;

const SHA256_V01 = /^sha256:[a-f0-9]{64}$/u;
const IDENTIFIER_V01 = /^[A-Za-z0-9][A-Za-z0-9._:@~-]{0,255}$/u;
const MAX_QUERY_CHARACTERS_V01 = 4096;
const MAX_QUERY_KEYS_V01 = 16;

const FINGERPRINT_TARGETS_V01 = new Set<
  SharedProjectInspectorFingerprintTargetKindV01
>([
  "task_context_packet",
  "automation_work_item",
  "run_receipt",
  "evidence_record",
  "claim_record",
  "claim_evidence_relation",
  "episode_delta_proposal",
  "review_decision",
  "semantic_commit_gate",
  "state_transition_receipt",
  "semantic_state",
  "later_task_context_packet",
  "context_use_review",
  "capability_grant",
]);

export class SharedProjectInspectorTargetErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "SharedProjectInspectorTargetErrorV01";
  }
}

export function createSharedInspectorHrefV01(
  target: SharedProjectInspectorTargetV01,
): string {
  const query = new URLSearchParams();
  query.set("target", target.target_kind);
  switch (target.target_kind) {
    case "project_coordination":
      break;
    case "criterion":
      query.set("criterion_id", target.criterion_id);
      query.set("packet_id", target.packet_id);
      query.set("packet_fingerprint", target.packet_fingerprint);
      query.set("receipt_id", target.receipt_id);
      query.set("receipt_fingerprint", target.receipt_fingerprint);
      query.set("assessment_id", target.assessment_id);
      query.set("assessment_fingerprint", target.assessment_fingerprint);
      break;
    case "claim_family":
    case "relation_family":
      query.set("family_id", target.family_id);
      query.set("family_origin_fingerprint", target.family_origin_fingerprint);
      query.set(
        "applicability_scope_fingerprint",
        target.applicability_scope_fingerprint,
      );
      break;
    case "proposal_candidate":
      query.set("proposal_id", target.proposal_id);
      query.set("proposal_fingerprint", target.proposal_fingerprint);
      query.set("candidate_id", target.candidate_id);
      query.set("candidate_fingerprint", target.candidate_fingerprint);
      break;
    case "semantic_target_head":
      query.set("target_key", target.target_key);
      query.set("revision", String(target.revision));
      query.set("presence", target.presence);
      query.set("transition_receipt_id", target.transition_receipt_id);
      query.set(
        "transition_receipt_fingerprint",
        target.transition_receipt_fingerprint,
      );
      break;
    case "automation_policy":
      query.set("policy_id", target.policy_id);
      query.set("policy_fingerprint", target.policy_fingerprint);
      break;
    case "automation_cycle":
      query.set("cycle_id", target.cycle_id);
      break;
    case "automation_run":
      query.set("run_id", target.run_id);
      break;
    case "strategic_material":
      query.set("proposal_id", target.proposal_id);
      query.set("proposal_fingerprint", target.proposal_fingerprint);
      break;
    case "personal_perspective_inclusion":
      query.set("packet_id", target.packet_id);
      query.set("packet_fingerprint", target.packet_fingerprint);
      break;
    case "integration_health":
    case "capability_coverage":
      query.set("receipt_id", target.receipt_id);
      query.set("receipt_fingerprint", target.receipt_fingerprint);
      break;
    default:
      query.set("record_id", target.record_id);
      query.set("fingerprint", target.expected_fingerprint);
  }
  return `${SHARED_PROJECT_INSPECTOR_PATH_V01}?${query.toString()}`;
}

export function parseSharedInspectorTargetV01(
  value: URL | URLSearchParams,
): SharedProjectInspectorTargetV01 {
  const params = value instanceof URL ? value.searchParams : value;
  const serialized = params.toString();
  if (
    serialized.length === 0 ||
    serialized.length > MAX_QUERY_CHARACTERS_V01
  ) {
    refuseV01("shared_inspector_query_size_invalid");
  }
  const keys = [...params.keys()];
  if (keys.length > MAX_QUERY_KEYS_V01 || new Set(keys).size !== keys.length) {
    refuseV01("shared_inspector_query_keys_invalid");
  }
  for (const key of keys) {
    if (key.length > 64 || params.getAll(key).length !== 1) {
      refuseV01("shared_inspector_query_keys_invalid");
    }
  }
  const targetKind = requiredIdentifierV01(params, "target");
  if (FINGERPRINT_TARGETS_V01.has(targetKind as SharedProjectInspectorFingerprintTargetKindV01)) {
    assertExactKeysV01(params, ["target", "record_id", "fingerprint"]);
    return {
      target_kind:
        targetKind as SharedProjectInspectorFingerprintTargetKindV01,
      record_id: requiredIdentifierV01(params, "record_id"),
      expected_fingerprint: requiredFingerprintV01(params, "fingerprint"),
    };
  }
  switch (targetKind) {
    case "project_coordination":
      assertExactKeysV01(params, ["target"]);
      return { target_kind: targetKind };
    case "criterion":
      assertExactKeysV01(params, [
        "target",
        "criterion_id",
        "packet_id",
        "packet_fingerprint",
        "receipt_id",
        "receipt_fingerprint",
        "assessment_id",
        "assessment_fingerprint",
      ]);
      return {
        target_kind: targetKind,
        criterion_id: requiredIdentifierV01(params, "criterion_id"),
        packet_id: requiredIdentifierV01(params, "packet_id"),
        packet_fingerprint: requiredFingerprintV01(
          params,
          "packet_fingerprint",
        ),
        receipt_id: requiredIdentifierV01(params, "receipt_id"),
        receipt_fingerprint: requiredFingerprintV01(
          params,
          "receipt_fingerprint",
        ),
        assessment_id: requiredIdentifierV01(params, "assessment_id"),
        assessment_fingerprint: requiredFingerprintV01(
          params,
          "assessment_fingerprint",
        ),
      };
    case "claim_family":
    case "relation_family":
      assertExactKeysV01(params, [
        "target",
        "family_id",
        "family_origin_fingerprint",
        "applicability_scope_fingerprint",
      ]);
      return {
        target_kind: targetKind,
        family_id: requiredIdentifierV01(params, "family_id"),
        family_origin_fingerprint: requiredFingerprintV01(
          params,
          "family_origin_fingerprint",
        ),
        applicability_scope_fingerprint: requiredFingerprintV01(
          params,
          "applicability_scope_fingerprint",
        ),
      };
    case "proposal_candidate":
      assertExactKeysV01(params, [
        "target",
        "proposal_id",
        "proposal_fingerprint",
        "candidate_id",
        "candidate_fingerprint",
      ]);
      return {
        target_kind: targetKind,
        proposal_id: requiredIdentifierV01(params, "proposal_id"),
        proposal_fingerprint: requiredFingerprintV01(
          params,
          "proposal_fingerprint",
        ),
        candidate_id: requiredIdentifierV01(params, "candidate_id"),
        candidate_fingerprint: requiredFingerprintV01(
          params,
          "candidate_fingerprint",
        ),
      };
    case "semantic_target_head": {
      assertExactKeysV01(params, [
        "target",
        "target_key",
        "revision",
        "presence",
        "transition_receipt_id",
        "transition_receipt_fingerprint",
      ]);
      const revision = Number(requiredIdentifierV01(params, "revision"));
      const presence = requiredIdentifierV01(params, "presence");
      if (!Number.isSafeInteger(revision) || revision < 1 || revision > 1_000_000) {
        refuseV01("shared_inspector_revision_invalid");
      }
      if (presence !== "present" && presence !== "absent") {
        refuseV01("shared_inspector_presence_invalid");
      }
      return {
        target_kind: targetKind,
        target_key: requiredIdentifierV01(params, "target_key"),
        revision,
        presence,
        transition_receipt_id: requiredIdentifierV01(
          params,
          "transition_receipt_id",
        ),
        transition_receipt_fingerprint: requiredFingerprintV01(
          params,
          "transition_receipt_fingerprint",
        ),
      };
    }
    case "automation_policy":
      assertExactKeysV01(params, ["target", "policy_id", "policy_fingerprint"]);
      return {
        target_kind: targetKind,
        policy_id: requiredIdentifierV01(params, "policy_id"),
        policy_fingerprint: requiredFingerprintV01(
          params,
          "policy_fingerprint",
        ),
      };
    case "automation_cycle":
      assertExactKeysV01(params, ["target", "cycle_id"]);
      return {
        target_kind: targetKind,
        cycle_id: requiredIdentifierV01(params, "cycle_id"),
      };
    case "automation_run":
      assertExactKeysV01(params, ["target", "run_id"]);
      return {
        target_kind: targetKind,
        run_id: requiredIdentifierV01(params, "run_id"),
      };
    case "strategic_material":
      assertExactKeysV01(params, [
        "target",
        "proposal_id",
        "proposal_fingerprint",
      ]);
      return {
        target_kind: targetKind,
        proposal_id: requiredIdentifierV01(params, "proposal_id"),
        proposal_fingerprint: requiredFingerprintV01(
          params,
          "proposal_fingerprint",
        ),
      };
    case "personal_perspective_inclusion":
      assertExactKeysV01(params, [
        "target",
        "packet_id",
        "packet_fingerprint",
      ]);
      return {
        target_kind: targetKind,
        packet_id: requiredIdentifierV01(params, "packet_id"),
        packet_fingerprint: requiredFingerprintV01(
          params,
          "packet_fingerprint",
        ),
      };
    case "integration_health":
    case "capability_coverage":
      assertExactKeysV01(params, [
        "target",
        "receipt_id",
        "receipt_fingerprint",
      ]);
      return {
        target_kind: targetKind,
        receipt_id: requiredIdentifierV01(params, "receipt_id"),
        receipt_fingerprint: requiredFingerprintV01(
          params,
          "receipt_fingerprint",
        ),
      };
    default:
      refuseV01("shared_inspector_target_kind_unknown");
  }
}

function assertExactKeysV01(
  params: URLSearchParams,
  expected: readonly string[],
): void {
  const actual = [...params.keys()].sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length ||
    actual.some((key, index) => key !== required[index])
  ) {
    refuseV01("shared_inspector_target_fields_invalid");
  }
}

function requiredIdentifierV01(params: URLSearchParams, key: string): string {
  const value = params.get(key) ?? "";
  if (!IDENTIFIER_V01.test(value)) {
    refuseV01(`shared_inspector_${key}_invalid`);
  }
  return value;
}

function requiredFingerprintV01(params: URLSearchParams, key: string): string {
  const value = params.get(key) ?? "";
  if (!SHA256_V01.test(value)) {
    refuseV01(`shared_inspector_${key}_invalid`);
  }
  return value;
}

function refuseV01(code: string): never {
  throw new SharedProjectInspectorTargetErrorV01(code);
}
