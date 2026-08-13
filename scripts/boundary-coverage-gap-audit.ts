import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const BOUNDARY_COVERAGE_AUDIT_VERSION_V01 =
  "boundary_coverage_gap_audit.v0.1" as const;

export const BOUNDARY_COVERAGE_STATUS_DEFINITIONS_V01 = Object.freeze({
  enforced:
    "An exact current blocking, admission, or refusal owner exists and the audit identifies concrete owner and test evidence.",
  observed:
    "An exact current observation exists, but the observation is not a blocking guarantee.",
  advisory:
    "The material is descriptive or recommendational only and creates no enforcement claim.",
  outside_coverage:
    "Current owners do not establish the property, or the capability does not currently exist.",
} as const);

export type BoundaryCoverageStatusV01 =
  keyof typeof BOUNDARY_COVERAGE_STATUS_DEFINITIONS_V01;

type BoundaryEvidenceKindV01 =
  | "gate"
  | "refusal"
  | "observation"
  | "advice";

export interface BoundaryCoverageSourceRefV01 {
  path: string;
  owner_or_symbol: string;
  marker: string;
  evidence_kind: BoundaryEvidenceKindV01;
}

export interface BoundaryCoverageTestRefV01 {
  path: string;
  marker: string;
}

export const BOUNDARY_COVERAGE_AUDIT_AUTHORITY_V01 = Object.freeze({
  semantic_authority: false,
  product_authority: false,
  execution_authority: false,
  merge_authority: false,
} as const);

export interface BoundaryCoverageAuditRowV01 {
  row_id: string;
  effect_or_question_family: string;
  canonical_current_owner: string | null;
  reachable_channels: readonly string[];
  exact_sources: readonly BoundaryCoverageSourceRefV01[];
  coverage_status: BoundaryCoverageStatusV01;
  platform_applicability: readonly string[];
  exact_test_or_fixture_evidence: readonly BoundaryCoverageTestRefV01[];
  known_limitation_or_gap: string | null;
  acgc3d_changed_owner: false;
  audit_output_authority: typeof BOUNDARY_COVERAGE_AUDIT_AUTHORITY_V01;
}

const row = (
  input: Omit<
    BoundaryCoverageAuditRowV01,
    "acgc3d_changed_owner" | "audit_output_authority"
  >,
): BoundaryCoverageAuditRowV01 => Object.freeze({
  ...input,
  reachable_channels: Object.freeze([...input.reachable_channels]),
  exact_sources: Object.freeze(input.exact_sources.map((source) => Object.freeze({ ...source }))),
  platform_applicability: Object.freeze([...input.platform_applicability]),
  exact_test_or_fixture_evidence: Object.freeze(
    input.exact_test_or_fixture_evidence.map((evidence) => Object.freeze({ ...evidence })),
  ),
  acgc3d_changed_owner: false,
  audit_output_authority: BOUNDARY_COVERAGE_AUDIT_AUTHORITY_V01,
});

const testRef = (
  pathValue: string,
  marker: string,
): BoundaryCoverageTestRefV01 => ({ path: pathValue, marker });

const sourceRef = (
  pathValue: string,
  ownerOrSymbol: string,
  marker: string,
  evidenceKind: BoundaryEvidenceKindV01,
): BoundaryCoverageSourceRefV01 => ({
  path: pathValue,
  owner_or_symbol: ownerOrSymbol,
  marker,
  evidence_kind: evidenceKind,
});

export const BOUNDARY_COVERAGE_AUDIT_ROWS_V01: readonly BoundaryCoverageAuditRowV01[] =
  Object.freeze([
    row({
      row_id: "repository_attachment_identity_and_stale_refusal",
      effect_or_question_family: "Repository attachment identity, freshness, and one-run consumption",
      canonical_current_owner: "repository-execution",
      reachable_channels: ["Browser preparation", "Operator/MCP proxy", "local repository-execution route"],
      exact_sources: [
        sourceRef("lib/vnext/repository-execution/repository-execution.ts", "validateRepositoryExecutionAttachmentV01", "validateRepositoryExecutionAttachmentV01", "gate"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["macOS source runtime", "supported Windows 11 x64 source runtime"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-repository-execution-attachment.ts", "repository_execution_attachment"),
      ],
      known_limitation_or_gap: "Non-Git roots and unsupported platforms are not eligible for managed repository delegation.",
    }),
    row({
      row_id: "managed_start_effect_channel_convergence",
      effect_or_question_family: "Managed Start admission through every reachable local transport",
      canonical_current_owner: "repository-managed-delegation",
      reachable_channels: ["Browser-confirmed Start", "Operator/MCP proxy", "local repository-execution route"],
      exact_sources: [
        sourceRef("app/api/augnes/repository-execution/route.ts", "dispatchV01 start action", "startRepositoryManagedDelegationV01", "gate"),
        sourceRef("lib/vnext/repository-execution/repository-managed-delegation.ts", "startRepositoryManagedDelegationV01", "start_repository_managed_delegation", "gate"),
        sourceRef("plugins/augnes-operator/mcp/companion-proxy.mjs", "callRepositoryExecutionV01", "callRepositoryExecutionV01", "gate"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["macOS source runtime", "supported Windows 11 x64 source runtime"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-repository-managed-delegation.ts", "attachment_consumed_once"),
      ],
      known_limitation_or_gap: "The proxy is a transport and creates no independent Start authority.",
    }),
    row({
      row_id: "explicit_resume_effect_channel_convergence",
      effect_or_question_family: "Explicit same-run Resume admission through every reachable local transport",
      canonical_current_owner: "repository-managed-resume",
      reachable_channels: ["Browser-confirmed Resume", "Operator/MCP proxy", "local repository-execution route"],
      exact_sources: [
        sourceRef("app/api/augnes/repository-execution/route.ts", "dispatchV01 resume_run action", "resumeRepositoryManagedDelegationV01", "gate"),
        sourceRef("lib/vnext/repository-execution/repository-managed-resume.ts", "resumeRepositoryManagedDelegationV01", "resume_repository_managed_delegation", "gate"),
        sourceRef("plugins/augnes-operator/mcp/companion-proxy.mjs", "callRepositoryExecutionV01", "resume_run", "gate"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["macOS source runtime", "supported Windows 11 x64 source runtime"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-repository-managed-delegation.ts", "explicit_same_run_resume"),
      ],
      known_limitation_or_gap: "No alternate transport can create a Resume effect without the same owner and exact Browser decision grant.",
    }),
    row({
      row_id: "start_and_resume_grant_family_separation",
      effect_or_question_family: "Start grant and Resume grant non-interchangeability",
      canonical_current_owner: "repository-execution-decision plus Start and Resume owners",
      reachable_channels: ["Browser decision session", "managed Start", "explicit same-run Resume"],
      exact_sources: [
        sourceRef("lib/vnext/repository-execution/repository-managed-delegation.ts", "Start decision assertion", "decision.action !== \"start_repository_managed_delegation\"", "refusal"),
        sourceRef("lib/vnext/repository-execution/repository-managed-resume.ts", "Resume decision assertion", "decision.action !== \"resume_repository_managed_delegation\"", "refusal"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["managed execution supported platforms"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-repository-managed-delegation.ts", "consumed_resume_decision_mismatch_structured"),
      ],
      known_limitation_or_gap: null,
    }),
    row({
      row_id: "grant_replay_and_target_drift_no_second_effect",
      effect_or_question_family: "Consumed or stale grant replay and cross-target drift",
      canonical_current_owner: "repository-managed-delegation and repository-managed-resume",
      reachable_channels: ["managed Start replay", "explicit Resume replay"],
      exact_sources: [
        sourceRef("lib/vnext/repository-execution/repository-managed-delegation.ts", "consumedStartReplayV01", "repository_delegation_replay_conflict", "refusal"),
        sourceRef("lib/vnext/repository-execution/repository-managed-resume.ts", "resume replay validation", "repository_managed_resume_replay_conflict", "refusal"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["managed execution supported platforms"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-repository-managed-delegation.ts", "exact replay must not launch a second worker"),
      ],
      known_limitation_or_gap: "Exact replay returns the same admitted result; any changed target binding fails closed.",
    }),
    row({
      row_id: "resume_monotonic_same_run_envelope_and_lineage",
      effect_or_question_family: "Resume monotonicity across run, attachment, envelope, provider thread, checkpoint, root, and controller generation",
      canonical_current_owner: "repository-managed-resume and repository-run-resume",
      reachable_channels: ["resume eligibility read", "Browser Resume decision", "same-run provider thread/resume"],
      exact_sources: [
        sourceRef("lib/vnext/repository-execution/repository-managed-resume.ts", "expectedStateV01", "resume_mode: \"explicit_same_run\"", "gate"),
        sourceRef("lib/vnext/repository-execution/repository-run-resume.ts", "resume checkpoint validation", "repository_execution_envelope_fingerprint", "gate"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["managed execution supported platforms"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-repository-managed-delegation.ts", "resume_checkpoint_exact_replay_and_monotonicity"),
      ],
      known_limitation_or_gap: "Resume preserves the existing capability family; it does not add a new Start grant or broaden repository, command, network, or external-effect scope.",
    }),
    row({
      row_id: "operation_approval_and_direct_command_refusal",
      effect_or_question_family: "Operation approval, refusal, and attempted direct repository command effects",
      canonical_current_owner: "native-host command classifier and live-native-host approval owner",
      reachable_channels: ["managed controller command", "operation approval response"],
      exact_sources: [
        sourceRef("lib/vnext/native-host/codex-app-server-adapter.ts", "classifyRepositoryEnvelopeCommandV01", "classifyRepositoryEnvelopeCommandV01", "refusal"),
        sourceRef("lib/vnext/runtime/live-native-host-run-service.ts", "repositoryEnvelopeDecisionV01", "repositoryEnvelopeDecisionV01", "gate"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["managed execution supported platforms"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-repository-managed-delegation.ts", "repository_envelope_classification"),
      ],
      known_limitation_or_gap: "Approval is operation-local and remains separate from semantic acceptance, ReviewDecision, and Transition.",
    }),
    row({
      row_id: "owned_cancellation_and_reconciliation",
      effect_or_question_family: "Risk-reducing cancellation and ambiguous-effect reconciliation",
      canonical_current_owner: "repository-managed-delegation cancellation and managed Resume reconciliation",
      reachable_channels: ["local cancel route", "owned controller cancellation", "Resume reconciliation"],
      exact_sources: [
        sourceRef("lib/vnext/repository-execution/repository-managed-delegation.ts", "cancelRepositoryManagedDelegationV01", "repository_delegation_cancel_binding_mismatch", "refusal"),
        sourceRef("lib/vnext/repository-execution/repository-managed-resume.ts", "Resume attempt reconciliation", "repository_managed_resume_invocation_marker_conflict", "refusal"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["managed execution supported platforms"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-repository-managed-delegation.ts", "reconciliation_required"),
      ],
      known_limitation_or_gap: "Cancellation does not claim provider stop, close work, create a Decision, or apply a Transition.",
    }),
    row({
      row_id: "guidebrief_proposal_to_fresh_pc5_activation",
      effect_or_question_family: "GuideBrief PC6 interpretation or PC5 proposal versus actual fresh PC5 activation",
      canonical_current_owner: "guide-brief-interaction-plan",
      reachable_channels: ["model interpretation", "deterministic PC5 proposal", "fresh PC5 activation"],
      exact_sources: [
        sourceRef("lib/vnext/guide-brief/guide-brief-interaction-plan.ts", "executeGuideBriefInteractionPlanV01", "executeGuideBriefInteractionPlanV01", "gate"),
        sourceRef("lib/vnext/guide-brief/guide-brief-interaction-plan.ts", "single-use activation result check", "result.durable_state_changed !== false", "refusal"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["server-side GuideBrief interaction"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-vnext-guide-brief-interpretation.ts", "one fresh activation invokes one owner once"),
        testRef("scripts/test-vnext-guide-brief-interaction.ts", "consumedAgain"),
      ],
      known_limitation_or_gap: "Model selection remains proposal-only; only a fresh exact PC5 plan can activate one existing projection-only capability.",
    }),
    row({
      row_id: "model_gateway_host_owned_route_material",
      effect_or_question_family: "Provider, model, endpoint, tool/function, response schema, and credential control",
      canonical_current_owner: "model-gateway",
      reachable_channels: ["GuideBrief Gateway request", "Governed Actor Lab Gateway request", "injected test adapter"],
      exact_sources: [
        sourceRef("lib/vnext/model-gateway/model-gateway.ts", "assertNoProviderControlFields", "PROVIDER_CONTROL_KEYS", "refusal"),
        sourceRef("lib/vnext/model-gateway/model-gateway.ts", "validateModelInvocationEnvelopeV01", "validateModelInvocationEnvelopeV01", "gate"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["server-side model invocation"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-model-gateway.ts", "max_provider_calls"),
      ],
      known_limitation_or_gap: "Caller material cannot choose or override provider routing or turn model output into project authority.",
    }),
    row({
      row_id: "model_gateway_local_only_and_secret_pre_egress_refusal",
      effect_or_question_family: "local_only and secret classification refusal before model egress",
      canonical_current_owner: "model-gateway envelope validator",
      reachable_channels: ["all live Model Gateway purposes"],
      exact_sources: [
        sourceRef("lib/vnext/model-gateway/model-gateway.ts", "validateModelInvocationEnvelopeV01", "dataClassification === \"local_only\" || dataClassification === \"secret\"", "refusal"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["server-side live model invocation"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-model-gateway.ts", "CREDENTIAL_SENTINEL"),
      ],
      known_limitation_or_gap: "This gate does not imply universal refusal of private material; private is admitted only for exact current host-owned purposes and envelopes.",
    }),
    row({
      row_id: "model_gateway_per_invocation_budget",
      effect_or_question_family: "Per-invocation provider-call, input, output, and cost bounds",
      canonical_current_owner: "model-gateway invocation envelope",
      reachable_channels: ["one admitted Gateway invocation"],
      exact_sources: [
        sourceRef("lib/vnext/model-gateway/model-gateway.ts", "invokeLiveAdapter", "mark_egress_attempted()", "gate"),
        sourceRef("lib/vnext/model-gateway/model-gateway.ts", "budget refusal", "model_gateway_budget_refused", "refusal"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["server-side model invocation"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-model-gateway.ts", "max_provider_calls: 1"),
      ],
      known_limitation_or_gap: "This is one-invocation enforcement, not a global or cross-invocation aggregate budget.",
    }),
    row({
      row_id: "governed_actor_lab_product_authority_firewall",
      effect_or_question_family: "Governed Actor Lab separation from product, semantic, execution, memory, policy, and merge authority",
      canonical_current_owner: "governed-actor-lab-live validator and artifact store",
      reachable_channels: ["zero-provider conformance", "injected fake Gateway transport", "ignored file-only Lab artifacts"],
      exact_sources: [
        sourceRef("lib/vnext/governed-actor-lab-live.ts", "createGovernedActorLabLiveAuthorityBoundaryV01", "createGovernedActorLabLiveAuthorityBoundaryV01", "gate"),
        sourceRef("lib/vnext/governed-actor-lab-live.ts", "validateGovernedActorLabLiveCohortResultV01", "result.report.authority_boundary.semantic_authority !== false", "refusal"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["research-only Lab path"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-governed-actor-lab-live.ts", "real_provider_calls: 0"),
      ],
      known_limitation_or_gap: "Lab output is research evidence material only and creates no product actor identity, Core record, TaskContextPacket, EpisodeDeltaProposal, ReviewDecision, Transition, Personal Perspective mutation, policy activation, execution grant, or publication/merge authority.",
    }),
    row({
      row_id: "managed_execution_platform_refusal",
      effect_or_question_family: "Managed repository execution platform applicability",
      canonical_current_owner: "repository-managed platform capability",
      reachable_channels: ["attachment preparation", "managed Start", "explicit Resume"],
      exact_sources: [
        sourceRef("lib/vnext/repository-execution/repository-execution.ts", "readRepositoryManagedPlatformCapabilityV01", "if (platform !== \"win32\")", "refusal"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["macOS source runtime", "supported Windows 11 x64 source runtime", "Linux refusal"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-repository-managed-delegation.ts", "linux_status: \"non_product_no_run\""),
      ],
      known_limitation_or_gap: "No new platform claim is made; native Windows exact-head proof remains separate from macOS deterministic/source-owned coverage.",
    }),
    row({
      row_id: "automatic_resume_remains_unsupported",
      effect_or_question_family: "Automatic Resume prohibition",
      canonical_current_owner: "repository-managed-resume",
      reachable_channels: ["explicit Browser Resume only"],
      exact_sources: [
        sourceRef("lib/vnext/repository-execution/repository-managed-resume.ts", "Resume lifecycle admission", "automatic_retry: false", "gate"),
        sourceRef("lib/vnext/repository-execution/repository-managed-resume.ts", "expectedStateV01", "resume_mode: \"explicit_same_run\"", "gate"),
      ],
      coverage_status: "enforced",
      platform_applicability: ["managed execution supported platforms"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-repository-managed-delegation.ts", "explicit_same_run_resume"),
      ],
      known_limitation_or_gap: "Companion startup and ordinary runtime observation do not authorize Resume.",
    }),
    row({
      row_id: "model_invocation_receipt_is_observation",
      effect_or_question_family: "ModelInvocationReceipt route, budget, and outcome observation",
      canonical_current_owner: "model-invocation-receipt",
      reachable_channels: ["Model Gateway result and refusal receipts"],
      exact_sources: [
        sourceRef("lib/vnext/model-gateway/model-invocation-receipt.ts", "validateModelInvocationReceiptV02", "receipt_is_semantic_authority", "observation"),
      ],
      coverage_status: "observed",
      platform_applicability: ["server-side model invocation"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-model-gateway.ts", "receipt_is_semantic_authority, false"),
      ],
      known_limitation_or_gap: "A receipt observes one invocation; it is not semantic acceptance, provider attestation, or a cross-invocation budget gate.",
    }),
    row({
      row_id: "current_role_and_jurisdiction_projection",
      effect_or_question_family: "Current capability, blocker, owner-adjacent state, and next-action honesty",
      canonical_current_owner: "codex-current-continuity read model",
      reachable_channels: ["local exact current-continuity read", "Operator repository continuity"],
      exact_sources: [
        sourceRef("lib/vnext/codex-current-continuity/codex-current-continuity.ts", "readCodexCurrentContinuityV01", "CODEX_CURRENT_CONTINUITY_AUTHORITY_V01", "observation"),
      ],
      coverage_status: "observed",
      platform_applicability: ["local canonical runtime"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-vnext-codex-current-continuity.ts", "resume_or_reconcile_work"),
      ],
      known_limitation_or_gap: "The projection truthfully exposes current states and reasons but not an explicit canonical-owner identity field; it does not itself block, approve, start, resume, decide, or transition.",
    }),
    row({
      row_id: "runtime_operability_owner_mapping",
      effect_or_question_family: "Runtime-operability responsibility and platform applicability mapping",
      canonical_current_owner: "runtime-operability-ownership",
      reachable_channels: ["Local Canonical planner", "operability shards"],
      exact_sources: [
        sourceRef("scripts/runtime-operability-ownership.mjs", "RUNTIME_OPERABILITY_OWNERS", "RUNTIME_OPERABILITY_OWNERS", "observation"),
      ],
      coverage_status: "observed",
      platform_applicability: ["darwin", "linux", "win32 with responsibility-specific applicability"],
      exact_test_or_fixture_evidence: [
        testRef("scripts/test-runtime-operability-ownership.mjs", "validateRuntimeOperabilityOwnership"),
      ],
      known_limitation_or_gap: "Ownership coverage is a planner observation; it does not fabricate native Windows exact-head evidence or extend Linux managed execution.",
    }),
    row({
      row_id: "acgc_stage4_research_direction",
      effect_or_question_family: "Future operational-policy activation and compounding direction",
      canonical_current_owner: "ACGC research program document",
      reachable_channels: ["research sequencing only"],
      exact_sources: [
        sourceRef("docs/vnext/research/AUGNES_ADAPTIVE_CONTINUITY_AND_GOVERNED_COMPOUNDING_RND_PROGRAM_V0_1.md", "Stage 4 research section", "Stage 4", "advice"),
      ],
      coverage_status: "advisory",
      platform_applicability: ["research only"],
      exact_test_or_fixture_evidence: [],
      known_limitation_or_gap: "Stage 4 remains separately unauthorized and creates no current policy activation owner.",
    }),
    row({
      row_id: "managed_execution_cross_operation_aggregate_budget",
      effect_or_question_family: "Cross-operation cumulative repository effect budget",
      canonical_current_owner: null,
      reachable_channels: ["sequence of individually admissible managed operations"],
      exact_sources: [],
      coverage_status: "outside_coverage",
      platform_applicability: ["managed execution supported platforms"],
      exact_test_or_fixture_evidence: [],
      known_limitation_or_gap: "The current envelope classifies and gates each operation; no global cumulative repository-effect budget owner was found or is claimed.",
    }),
    row({
      row_id: "model_gateway_cross_invocation_aggregate_budget",
      effect_or_question_family: "Cross-invocation cumulative model/provider budget",
      canonical_current_owner: null,
      reachable_channels: ["sequence of separately admitted Gateway invocations"],
      exact_sources: [],
      coverage_status: "outside_coverage",
      platform_applicability: ["server-side model invocation"],
      exact_test_or_fixture_evidence: [],
      known_limitation_or_gap: "Per-invocation bounds exist, but no global cross-invocation aggregate budget owner was found or is claimed.",
    }),
    row({
      row_id: "model_gateway_universal_private_material_refusal",
      effect_or_question_family: "Universal refusal of private-classified material before provider egress",
      canonical_current_owner: null,
      reachable_channels: ["purpose-bound live Model Gateway invocations"],
      exact_sources: [],
      coverage_status: "outside_coverage",
      platform_applicability: ["server-side model invocation"],
      exact_test_or_fixture_evidence: [],
      known_limitation_or_gap: "Current routing policy allows private-classified material for exact host-owned purposes with explicit egress and retention bounds; no universal private-material refusal is claimed, and ACGC3D does not change routing policy.",
    }),
    row({
      row_id: "safe_partial_plan_progress",
      effect_or_question_family: "Remove or refuse one forbidden plan effect while continuing an otherwise safe decomposed plan",
      canonical_current_owner: null,
      reachable_channels: [],
      exact_sources: [],
      coverage_status: "outside_coverage",
      platform_applicability: ["not applicable"],
      exact_test_or_fixture_evidence: [],
      known_limitation_or_gap: "No canonical plan-decomposition or safe-partial-progress owner exists; ACGC3D adds none.",
    }),
    row({
      row_id: "child_run_or_dag_orchestration",
      effect_or_question_family: "Child-run or DAG orchestration authority",
      canonical_current_owner: null,
      reachable_channels: [],
      exact_sources: [],
      coverage_status: "outside_coverage",
      platform_applicability: ["not applicable"],
      exact_test_or_fixture_evidence: [],
      known_limitation_or_gap: "No child-run, DAG, or multi-agent orchestration capability exists in the audited owner graph; ACGC3D adds none.",
    }),
  ]);

export interface BoundaryCoverageGapAuditReportV01 {
  audit_version: typeof BOUNDARY_COVERAGE_AUDIT_VERSION_V01;
  coverage_vocabulary: typeof BOUNDARY_COVERAGE_STATUS_DEFINITIONS_V01;
  row_count: number;
  status_distribution: Record<BoundaryCoverageStatusV01, number>;
  rows: readonly BoundaryCoverageAuditRowV01[];
  findings: {
    concrete_owner_defects_found: readonly string[];
    owner_local_corrections: readonly string[];
    effect_equivalent_channel_result: string;
    resume_monotonicity_result: string;
    cumulative_budget_result: string;
    safe_partial_progress_result: string;
    current_role_and_jurisdiction_result: string;
    model_gateway_result: string;
    governed_actor_lab_result: string;
    platform_result: string;
  };
  real_provider_calls: 0;
  authority: typeof BOUNDARY_COVERAGE_AUDIT_AUTHORITY_V01;
}

export function buildBoundaryCoverageGapAuditReportV01(options: {
  verify_sources?: boolean;
  repository_root?: string;
} = {}): BoundaryCoverageGapAuditReportV01 {
  validateBoundaryCoverageRowsV01(BOUNDARY_COVERAGE_AUDIT_ROWS_V01, options);
  const statusDistribution: Record<BoundaryCoverageStatusV01, number> = {
    enforced: 0,
    observed: 0,
    advisory: 0,
    outside_coverage: 0,
  };
  for (const auditRow of BOUNDARY_COVERAGE_AUDIT_ROWS_V01) {
    statusDistribution[auditRow.coverage_status] += 1;
  }
  return Object.freeze({
    audit_version: BOUNDARY_COVERAGE_AUDIT_VERSION_V01,
    coverage_vocabulary: BOUNDARY_COVERAGE_STATUS_DEFINITIONS_V01,
    row_count: BOUNDARY_COVERAGE_AUDIT_ROWS_V01.length,
    status_distribution: Object.freeze(statusDistribution),
    rows: BOUNDARY_COVERAGE_AUDIT_ROWS_V01,
    findings: Object.freeze({
      concrete_owner_defects_found: Object.freeze([]),
      owner_local_corrections: Object.freeze([]),
      effect_equivalent_channel_result: "Reachable Start and explicit Resume transports converge on their exact canonical admission owners; no alternate effect path was found.",
      resume_monotonicity_result: "Current explicit Resume preserves the same run, consumed attachment, envelope, provider thread, checkpoint lineage, root/baseline scope, and admits one exact controller-generation increment without a new Start grant.",
      cumulative_budget_result: "Per-operation envelope and per-invocation Gateway bounds are enforced; no global cross-operation or cross-invocation aggregate budget owner exists, so those properties remain outside_coverage.",
      safe_partial_progress_result: "No canonical plan-decomposition or safe-partial-progress owner exists; the capability is outside_coverage.",
      current_role_and_jurisdiction_result: "Current continuity observes exact blocked, approval-pending, reconciliation, unavailable, and next-action states without executing or granting them; it does not project an explicit canonical-owner identity field, so owner naming remains an audit limitation.",
      model_gateway_result: "Host-owned route material, local_only/secret refusal, purpose-bound private admission, one-call envelope budget, and non-authoritative receipts remain separated; no routing policy changed.",
      governed_actor_lab_result: "The Lab validator keeps all product, Core, semantic, memory, policy, execution, publication, and merge authority absent.",
      platform_result: "No platform support changed; Linux managed execution remains unavailable and native Windows exact-head evidence is not inferred from macOS coverage.",
    }),
    real_provider_calls: 0,
    authority: BOUNDARY_COVERAGE_AUDIT_AUTHORITY_V01,
  });
}

export function validateBoundaryCoverageRowsV01(
  rows: readonly BoundaryCoverageAuditRowV01[],
  options: { verify_sources?: boolean; repository_root?: string } = {},
): void {
  const rowIds = new Set<string>();
  for (const auditRow of rows) {
    if (rowIds.has(auditRow.row_id)) throw new Error("boundary_coverage_row_duplicate");
    rowIds.add(auditRow.row_id);
    if (!(auditRow.coverage_status in BOUNDARY_COVERAGE_STATUS_DEFINITIONS_V01)) {
      throw new Error("boundary_coverage_status_invalid");
    }
    if (
      auditRow.acgc3d_changed_owner !== false ||
      Object.values(auditRow.audit_output_authority).some((value) => value !== false)
    ) {
      throw new Error("boundary_coverage_authority_invalid");
    }
    const enforcementEvidence = auditRow.exact_sources.filter(
      (source) => source.evidence_kind === "gate" || source.evidence_kind === "refusal",
    );
    if (auditRow.coverage_status === "enforced") {
      if (
        !auditRow.canonical_current_owner ||
        enforcementEvidence.length === 0 ||
        auditRow.exact_test_or_fixture_evidence.length === 0
      ) {
        throw new Error("boundary_coverage_enforced_owner_or_evidence_missing");
      }
    } else if (enforcementEvidence.length > 0) {
      throw new Error("boundary_coverage_non_enforced_resealed");
    }
    if (
      auditRow.coverage_status === "observed" &&
      auditRow.exact_sources.some((source) => source.evidence_kind !== "observation")
    ) {
      throw new Error("boundary_coverage_observation_promoted");
    }
    if (
      auditRow.coverage_status === "advisory" &&
      auditRow.exact_sources.some((source) => source.evidence_kind !== "advice")
    ) {
      throw new Error("boundary_coverage_advice_promoted");
    }
    if (
      auditRow.coverage_status === "outside_coverage" &&
      (auditRow.canonical_current_owner !== null || auditRow.exact_sources.length !== 0)
    ) {
      throw new Error("boundary_coverage_outside_coverage_resealed");
    }
  }
  if (options.verify_sources) {
    const root = path.resolve(options.repository_root ?? process.cwd());
    for (const auditRow of rows) {
      for (const evidence of [
        ...auditRow.exact_sources.map(({ path: evidencePath, marker }) => ({ path: evidencePath, marker })),
        ...auditRow.exact_test_or_fixture_evidence,
      ]) {
        verifyRepositoryEvidenceV01(root, evidence);
      }
    }
  }
}

function verifyRepositoryEvidenceV01(
  repositoryRoot: string,
  evidence: { path: string; marker: string },
): void {
  if (path.isAbsolute(evidence.path) || evidence.path.split("/").includes("..")) {
    throw new Error("boundary_coverage_source_path_invalid");
  }
  const absolutePath = path.resolve(repositoryRoot, evidence.path);
  if (!existsSync(absolutePath)) throw new Error(`boundary_coverage_source_missing:${evidence.path}`);
  if (!readFileSync(absolutePath, "utf8").includes(evidence.marker)) {
    throw new Error(`boundary_coverage_source_marker_missing:${evidence.path}:${evidence.marker}`);
  }
}

export function renderBoundaryCoverageGapAuditMarkdownV01(
  report: BoundaryCoverageGapAuditReportV01,
): string {
  const lines = [
    "# ACGC3D boundary coverage gap audit",
    "",
    `Rows: ${report.row_count}. Statuses: enforced=${report.status_distribution.enforced}, observed=${report.status_distribution.observed}, advisory=${report.status_distribution.advisory}, outside_coverage=${report.status_distribution.outside_coverage}.`,
    "",
    "| Row | Status | Current owner | Platforms | Limitation or gap |",
    "| --- | --- | --- | --- | --- |",
    ...report.rows.map((auditRow) =>
      `| ${escapeMarkdownV01(auditRow.row_id)} | ${auditRow.coverage_status} | ${escapeMarkdownV01(auditRow.canonical_current_owner ?? "none")} | ${escapeMarkdownV01(auditRow.platform_applicability.join(", "))} | ${escapeMarkdownV01(auditRow.known_limitation_or_gap ?? "none")} |`,
    ),
    "",
    "Audit output semantic/product/execution/merge authority = false.",
    "real_provider_calls=0",
  ];
  return `${lines.join("\n")}\n`;
}

function escapeMarkdownV01(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function runCliV01(): void {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args[0] !== undefined && !["--json", "--markdown"].includes(args[0]))) {
    throw new Error("usage: npm run audit:boundary-coverage -- [--json|--markdown]");
  }
  const report = buildBoundaryCoverageGapAuditReportV01({ verify_sources: true });
  process.stdout.write(
    args[0] === "--markdown"
      ? renderBoundaryCoverageGapAuditMarkdownV01(report)
      : `${JSON.stringify(report, null, 2)}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  runCliV01();
}
