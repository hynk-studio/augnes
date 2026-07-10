import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  genericCliBuilderInputFixture,
  invalidTaskContextPacketFixtureCases,
  legacyAgWorkResumePacketFixture,
  legacyCurrentWorkingPerspectiveFixture,
  legacyHandoffCapsuleFixture,
  legacyWorkBriefFixture,
  openAiExternalRefsFixture,
  TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT,
  TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT,
  TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
} from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  buildTaskContextPacketFromLegacyWorkV01,
  type LegacyTaskContextPacketInputV01,
} from "@/lib/vnext/compat/task-context-from-legacy-work";
import {
  buildTaskContextPacketV01,
  canonicalizeTaskContextValueV01,
  TASK_CONTEXT_PACKET_REQUIRED_CORE_FIELDS_V01,
  type TaskContextPacketBuilderInputV01,
  validateExternalRefV01,
  validateTaskContextPacketV01,
} from "@/lib/vnext/task-context-packet";
import { EXTERNAL_REF_VERSION_V01 } from "@/types/vnext/external-ref";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const legacyAdapterSourcePath =
  "lib/vnext/compat/task-context-from-legacy-work.ts";
const coreSourcePath = "lib/vnext/task-context-packet.ts";
const sourcePaths = [coreSourcePath, legacyAdapterSourcePath];

let fetchCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = (async () => {
  fetchCalls += 1;
  throw new Error("vNext protocol conformance must not call fetch");
}) as typeof fetch;

try {
  assertPureProtocolSources();

  for (const ref of openAiExternalRefsFixture) {
    const validation = validateExternalRefV01(ref);
    assert.equal(validation.status, "valid", formatValidation(validation));
  }

  const workBriefCwpOnlyPacket = buildTaskContextPacketFromLegacyWorkV01(
    deepFreeze(buildWorkBriefCwpOnlyInput()),
  );
  const workBriefCwpOnlyValidation = validateTaskContextPacketV01(
    workBriefCwpOnlyPacket,
    { evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT },
  );
  assert.equal(
    workBriefCwpOnlyValidation.status,
    "valid",
    formatValidation(workBriefCwpOnlyValidation),
  );
  assert.deepEqual(workBriefCwpOnlyPacket.task.success_criteria, []);
  assert.deepEqual(workBriefCwpOnlyPacket.task.non_goals, []);
  assert.ok(
    workBriefCwpOnlyPacket.gaps.some(
      (gap: TaskContextPacketV01["gaps"][number]) =>
        gap.code === "missing_success_criteria",
    ),
    "missing Work Brief success criteria must remain an explicit gap",
  );
  assert.ok(
    workBriefCwpOnlyPacket.gaps.some(
      (gap: TaskContextPacketV01["gaps"][number]) =>
        gap.code === "missing_non_goals",
    ),
    "missing Work Brief non-goals must remain an explicit gap",
  );

  const unknownCurrentnessPacket = buildTaskContextPacketFromLegacyWorkV01(
    deepFreeze(buildMissingSourceTimestampInput()),
  );
  const unknownCurrentnessValidation = validateTaskContextPacketV01(
    unknownCurrentnessPacket,
    { evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT },
  );
  assert.equal(
    unknownCurrentnessValidation.status,
    "valid",
    formatValidation(unknownCurrentnessValidation),
  );
  assert.equal(unknownCurrentnessPacket.source_status.currentness.status, "unknown");
  assert.equal(unknownCurrentnessPacket.source_status.currentness.as_of, null);
  assert.equal(
    unknownCurrentnessPacket.selected_context.find(
      (entry) => entry.entry_kind === "work_ref",
    )?.currentness.status,
    "unknown",
    "Work Brief without a usable timestamp must remain unknown",
  );
  assert.ok(
    unknownCurrentnessPacket.compatibility.warnings.some((warning) =>
      warning.includes("no usable as_of timestamp"),
    ),
    "missing source time must remain an explicit compatibility warning",
  );

  const timestampOnlyPacket = buildTaskContextPacketFromLegacyWorkV01(
    deepFreeze(buildTimestampOnlyLegacyInput()),
  );
  const timestampOnlyValidation = validateTaskContextPacketV01(
    timestampOnlyPacket,
    { evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT },
  );
  assert.equal(
    timestampOnlyValidation.status,
    "valid",
    formatValidation(timestampOnlyValidation),
  );
  for (const refType of [
    "legacy_work_id",
    "legacy_work_event",
    "legacy_proof_action",
    "caller_timestamp_only_ref",
  ]) {
    const entry = timestampOnlyPacket.selected_context.find(
      (candidate) => candidate.external_ref?.ref_type === refType,
    );
    assert.ok(entry, `timestamp-only fixture must include ${refType}`);
    assert.equal(
      entry.currentness.status,
      "partial",
      `${refType} timestamp presence must not imply freshness`,
    );
  }
  assert.equal(
    timestampOnlyPacket.source_status.currentness.status,
    "partial",
    "timestamp-only Work Brief sources must aggregate as partial, not fresh",
  );

  const oldResumePacket = buildTaskContextPacketFromLegacyWorkV01(
    deepFreeze(buildOldResumeTimestampInput()),
  );
  const oldResumeValidation = validateTaskContextPacketV01(oldResumePacket, {
    evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT,
  });
  assert.equal(
    oldResumeValidation.status,
    "valid",
    formatValidation(oldResumeValidation),
  );
  const resumeExclusion = oldResumePacket.excluded_context.find(
    (entry) => entry.external_ref?.ref_type === "legacy_resume_packet",
  );
  assert.ok(resumeExclusion, "old resume fixture must preserve packet reference");
  assert.equal(
    resumeExclusion.currentness.status,
    "partial",
    "resume created_at must not imply freshness",
  );
  const foreignResumeAction = oldResumePacket.selected_context.find(
    (entry) => entry.external_ref?.ref_type === "foreign_proof_action_ref",
  );
  assert.ok(foreignResumeAction, "old resume fixture must preserve foreign action");
  assert.equal(foreignResumeAction.currentness.status, "partial");
  assert.notEqual(oldResumePacket.source_status.currentness.status, "fresh");

  const anonymousHandoffPacket = buildTaskContextPacketFromLegacyWorkV01(
    deepFreeze(buildAnonymousHandoffInput()),
  );
  const anonymousHandoffValidation = validateTaskContextPacketV01(
    anonymousHandoffPacket,
    { evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT },
  );
  assert.equal(
    anonymousHandoffValidation.status,
    "valid",
    formatValidation(anonymousHandoffValidation),
  );
  assert.ok(
    anonymousHandoffPacket.gaps.some(
      (gap) => gap.code === "missing_legacy_handoff_id",
    ),
    "a handoff-like input without handoff_id must preserve an explicit gap",
  );
  assert.equal(
    JSON.stringify(anonymousHandoffPacket).includes("legacy-handoff:anonymous"),
    false,
    "the adapter must not invent an anonymous handoff identity",
  );

  const legacyInput = buildLegacyInput();
  const legacyInputBefore = canonicalizeTaskContextValueV01(legacyInput);
  deepFreeze(legacyInput);
  const legacyPacket = buildTaskContextPacketFromLegacyWorkV01(legacyInput);
  assert.equal(
    canonicalizeTaskContextValueV01(legacyInput),
    legacyInputBefore,
    "legacy adapter must not mutate its input",
  );

  const legacyValidation = validateTaskContextPacketV01(legacyPacket, {
    evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT,
  });
  assert.equal(legacyValidation.status, "valid", formatValidation(legacyValidation));
  assert.equal(
    legacyValidation.normalized_protocol_version,
    "task_context_packet.v0.1",
  );
  assertLegacyMapping(legacyPacket);

  const staleCwpInput = buildLegacyInput();
  const staleCwp = staleCwpInput.current_working_perspective;
  assert.ok(staleCwp, "stale CWP fixture requires Current Working Perspective");
  staleCwp.staleness.status = "stale";
  const staleCwpPacket = buildTaskContextPacketFromLegacyWorkV01(
    deepFreeze(staleCwpInput),
  );
  const staleCwpValidation = validateTaskContextPacketV01(staleCwpPacket, {
    evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT,
  });
  assert.equal(
    staleCwpValidation.status,
    "valid",
    formatValidation(staleCwpValidation),
  );
  assert.equal(
    staleCwpPacket.source_status.status,
    legacyPacket.source_status.status,
    "changing freshness must not change source coverage",
  );
  assert.equal(staleCwpPacket.source_status.currentness.status, "stale");
  assert.equal(legacyPacket.source_status.currentness.status, "partial");

  const mixedOffsetPacket = buildTaskContextPacketFromLegacyWorkV01(
    deepFreeze(buildMixedOffsetLegacyInput()),
  );
  const mixedOffsetValidation = validateTaskContextPacketV01(
    mixedOffsetPacket,
    { evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT },
  );
  assert.equal(
    mixedOffsetValidation.status,
    "valid",
    formatValidation(mixedOffsetValidation),
  );
  assert.equal(
    mixedOffsetPacket.source_status.currentness.as_of,
    "2026-07-10T00:30:00+09:00",
    "aggregate currentness must compare mixed-offset timestamps by instant",
  );

  const collisionPacket = buildTaskContextPacketFromLegacyWorkV01(
    deepFreeze(buildExpectedArtifactCollisionInput()),
  );
  const collisionValidation = validateTaskContextPacketV01(collisionPacket, {
    evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT,
  });
  assert.equal(
    collisionValidation.status,
    "valid",
    formatValidation(collisionValidation),
  );
  const collisionEntryIds = collisionPacket.selected_context
    .filter(
      (entry) =>
        entry.entry_kind === "artifact_ref" &&
        (entry.external_ref?.external_id === "a/b" ||
          entry.external_ref?.external_id === "a-b"),
    )
    .map((entry) => entry.entry_id);
  assert.equal(collisionEntryIds.length, 2);
  assert.equal(
    new Set(collisionEntryIds).size,
    2,
    "distinct legacy refs must receive collision-resistant entry IDs",
  );

  const repeatedLegacyPacket = buildTaskContextPacketFromLegacyWorkV01(
    deepFreeze(buildLegacyInput()),
  );
  assert.deepEqual(
    repeatedLegacyPacket,
    legacyPacket,
    "identical explicit legacy input must build the same normalized packet",
  );
  assert.equal(
    repeatedLegacyPacket.integrity.fingerprint,
    legacyPacket.integrity.fingerprint,
    "identical explicit legacy input must build the same fingerprint",
  );

  const reorderedLegacyPacket = buildTaskContextPacketFromLegacyWorkV01(
    deepFreeze(buildReorderedLegacyInput()),
  );
  assert.deepEqual(
    reorderedLegacyPacket,
    legacyPacket,
    "semantically equivalent legacy arrays must normalize deterministically",
  );

  const genericInput = cloneValue<TaskContextPacketBuilderInputV01>(
    genericCliBuilderInputFixture,
  );
  const genericInputBefore = canonicalizeTaskContextValueV01(genericInput);
  deepFreeze(genericInput);
  const genericPacket = buildTaskContextPacketV01(genericInput);
  assert.equal(
    canonicalizeTaskContextValueV01(genericInput),
    genericInputBefore,
    "Core builder must not mutate Generic CLI input",
  );
  const genericValidation = validateTaskContextPacketV01(genericPacket, {
    evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT,
  });
  assert.equal(genericValidation.status, "valid", formatValidation(genericValidation));
  assertGenericCliPacket(genericPacket);

  const sourceAxisCases = [
    { coverage: "complete", currentness: "fresh" },
    { coverage: "complete", currentness: "stale" },
    { coverage: "complete", currentness: "partial" },
    { coverage: "partial", currentness: "fresh" },
    { coverage: "partial", currentness: "stale" },
    { coverage: "unknown", currentness: "unknown" },
  ] as const;
  for (const sourceAxisCase of sourceAxisCases) {
    const sourceAxisPacket = buildTaskContextPacketV01(
      deepFreeze(
        buildSourceAxisInput(
          sourceAxisCase.coverage,
          sourceAxisCase.currentness,
        ),
      ),
    );
    const sourceAxisValidation = validateTaskContextPacketV01(
      sourceAxisPacket,
      { evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT },
    );
    assert.equal(
      sourceAxisValidation.status,
      "valid",
      `${sourceAxisCase.coverage} + ${sourceAxisCase.currentness}: ${formatValidation(
        sourceAxisValidation,
      )}`,
    );
    assert.equal(sourceAxisPacket.source_status.status, sourceAxisCase.coverage);
    assert.equal(
      sourceAxisPacket.source_status.currentness.status,
      sourceAxisCase.currentness,
    );
    if (
      sourceAxisCase.coverage === "complete" &&
      sourceAxisCase.currentness === "fresh"
    ) {
      assert.equal(
        sourceAxisPacket.current_projection?.currentness.status,
        legacyCurrentWorkingPerspectiveFixture.staleness.status,
        "explicit CWP freshness must remain fresh when no weaker source changes the aggregate",
      );
    }
  }

  const proofSourceInput = cloneValue<TaskContextPacketBuilderInputV01>(
    genericCliBuilderInputFixture,
  );
  const proofSourceEntry = proofSourceInput.selected_context[0];
  assert.ok(proofSourceEntry, "proof source fixture requires selected context");
  proofSourceEntry.entry_kind = "evidence_ref";
  proofSourceEntry.source_ref = "legacy-proof:123";
  proofSourceEntry.external_ref = null;
  proofSourceEntry.compatibility_source_ref = null;
  const proofSourceValidation = validateTaskContextPacketV01(
    buildTaskContextPacketV01(proofSourceInput),
    { evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT },
  );
  assert.equal(proofSourceValidation.status, "blocked");
  assert.ok(
    proofSourceValidation.errors.some(
      (issue) => issue.code === "proof_promoted_to_evidence",
    ),
    "proof source_ref must not validate as Evidence",
  );

  const compatibilityActionInput = cloneValue<TaskContextPacketBuilderInputV01>(
    genericCliBuilderInputFixture,
  );
  const compatibilityActionEntry = compatibilityActionInput.selected_context[0];
  assert.ok(
    compatibilityActionEntry,
    "compatibility action fixture requires selected context",
  );
  compatibilityActionEntry.entry_kind = "evidence_ref";
  compatibilityActionEntry.source_ref = null;
  compatibilityActionEntry.compatibility_source_ref = {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: "legacy_action_id",
    external_id: "action:compatibility-only",
    trust_class: "imported_unverified",
  };
  const compatibilityActionValidation = validateTaskContextPacketV01(
    buildTaskContextPacketV01(compatibilityActionInput),
    { evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT },
  );
  assert.equal(compatibilityActionValidation.status, "blocked");
  assert.ok(
    compatibilityActionValidation.errors.some(
      (issue) => issue.code === "proof_promoted_to_evidence",
    ),
    "compatibility action ref must not validate as Evidence",
  );
  const independentFingerprintMaterial = cloneValue(genericPacket) as unknown as {
    integrity: Record<string, unknown>;
  };
  delete independentFingerprintMaterial.integrity.fingerprint;
  const independentFingerprint = `sha256:${createHash("sha256")
    .update(canonicalizeTaskContextValueV01(independentFingerprintMaterial))
    .digest("hex")}`;
  assert.equal(
    independentFingerprint,
    genericPacket.integrity.fingerprint,
    "fingerprint_scope must mean the fingerprint field is omitted",
  );

  const crossProviderInput = cloneValue<TaskContextPacketBuilderInputV01>(
    genericCliBuilderInputFixture,
  );
  const crossProviderRefs = [
    {
      ref_version: EXTERNAL_REF_VERSION_V01,
      ref_type: "worker_session",
      external_id: "shared-native-id",
      provider: "provider-a",
      trust_class: "host_attestation" as const,
    },
    {
      ref_version: EXTERNAL_REF_VERSION_V01,
      ref_type: "worker_session",
      external_id: "shared-native-id",
      provider: "provider-b",
      trust_class: "host_attestation" as const,
    },
  ];
  crossProviderInput.compatibility.source_refs.push(...crossProviderRefs);
  crossProviderInput.source_status.external_refs.push(...crossProviderRefs);
  const crossProviderPacket = buildTaskContextPacketV01(crossProviderInput);
  assert.equal(
    validateTaskContextPacketV01(crossProviderPacket, {
      evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT,
    }).status,
    "valid",
    "unnamespaced provider-scoped ExternalRefs must not collide",
  );

  const reorderedGenericPacket = buildTaskContextPacketV01(
    deepFreeze(buildReorderedGenericInput()),
  );
  assert.deepEqual(
    reorderedGenericPacket,
    genericPacket,
    "Core builder must normalize semantically unordered arrays",
  );
  assert.equal(
    reorderedGenericPacket.integrity.fingerprint,
    genericPacket.integrity.fingerprint,
  );

  const openAiPacket = buildTaskContextPacketV01(
    deepFreeze(buildOpenAiIntegratedInput()),
  );
  const openAiValidation = validateTaskContextPacketV01(openAiPacket, {
    evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT,
  });
  assert.equal(openAiValidation.status, "valid", formatValidation(openAiValidation));
  assertOpenAiRefsAreIsolated(openAiPacket);

  const requiredOpenAiSpecificCoreFields =
    TASK_CONTEXT_PACKET_REQUIRED_CORE_FIELDS_V01.filter((field) =>
      /openai/i.test(field),
    );
  const requiredChatGptSpecificCoreFields =
    TASK_CONTEXT_PACKET_REQUIRED_CORE_FIELDS_V01.filter((field) =>
      /chatgpt/i.test(field),
    );
  const requiredCodexSpecificCoreFields =
    TASK_CONTEXT_PACKET_REQUIRED_CORE_FIELDS_V01.filter((field) =>
      /codex/i.test(field),
    );
  const vendorSpecificRequiredCoreFields = [
    ...requiredOpenAiSpecificCoreFields,
    ...requiredChatGptSpecificCoreFields,
    ...requiredCodexSpecificCoreFields,
  ];
  assert.deepEqual(vendorSpecificRequiredCoreFields, []);

  for (const invalidCase of invalidTaskContextPacketFixtureCases) {
    const invalidPacket = invalidCase.mutate(genericPacket);
    const validation = validateTaskContextPacketV01(invalidPacket, {
      evaluated_at: TASK_CONTEXT_PACKET_FIXTURE_EVALUATED_AT,
    });
    assert.equal(
      validation.status,
      invalidCase.expected_status,
      `${invalidCase.name}: ${formatValidation(validation)}`,
    );
    const errorCodes = new Set(validation.errors.map((issue) => issue.code));
    for (const expectedCode of invalidCase.expected_error_codes) {
      assert.ok(
        errorCodes.has(expectedCode),
        `${invalidCase.name} must report ${expectedCode}; received ${[
          ...errorCodes,
        ].join(", ")}`,
      );
    }
  }

  assert.equal(fetchCalls, 0, "protocol conformance observed a fetch call");

  console.log(
    JSON.stringify(
      {
        suite: "vnext-protocol-conformance",
        status: "passed",
        positive_fixtures: [
          "legacy_work_brief_cwp_with_explicit_gaps",
          "legacy_work_brief_unknown_currentness",
          "legacy_timestamp_only_sources_are_partial",
          "legacy_resume_timestamp_only_is_partial",
          "source_coverage_currentness_independent_matrix",
          "explicit_cwp_freshness_evaluation",
          "cwp_open_question_projection_only",
          "legacy_handoff_missing_identity_gap",
          "legacy_work_brief_cwp_handoff_resume",
          "integrated_external_refs",
          "generic_cli_without_provider",
        ],
        negative_fixture_count: invalidTaskContextPacketFixtureCases.length,
        deterministic_packet_and_fingerprint: true,
        independent_fingerprint_scope_checked: true,
        cross_provider_external_ref_identity_checked: true,
        mixed_offset_currentness_checked: true,
        collision_resistant_entry_ids_checked: true,
        unknown_source_currentness_checked: true,
        timestamp_only_sources_partial_checked: true,
        source_coverage_currentness_axes_checked: sourceAxisCases.map(
          ({ coverage, currentness }) => `${coverage}+${currentness}`,
        ),
        legacy_adapter_coverage_independent_currentness_checked: true,
        explicit_cwp_freshness_preserved_checked: true,
        work_brief_mapping_checked: true,
        handoff_success_and_non_goal_mapping_checked: true,
        current_working_perspective_projection_boundary_checked: true,
        cwp_open_questions_not_promoted_to_tensions_checked: true,
        proof_evidence_separation_checked: true,
        proof_evidence_validator_fail_closed_checked: true,
        explicit_project_identity_checked: true,
        required_openai_specific_core_fields:
          requiredOpenAiSpecificCoreFields.length,
        required_chatgpt_specific_core_fields:
          requiredChatGptSpecificCoreFields.length,
        required_codex_specific_core_fields:
          requiredCodexSpecificCoreFields.length,
        generic_cli_valid_without_provider: true,
        static_forbidden_dependency_matches: 0,
        fetch_calls: fetchCalls,
        database_calls: 0,
        provider_calls: 0,
        network_calls: 0,
        external_side_effects: 0,
      },
      null,
      2,
    ),
  );
} finally {
  globalThis.fetch = originalFetch;
}

function buildLegacyInput(): LegacyTaskContextPacketInputV01 {
  return cloneValue({
    workspace_id: "workspace-augnes-fixture",
    project_id: "project-augnes-canonical-fixture",
    generated_at: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
    expires_at: TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT,
    work_brief: legacyWorkBriefFixture,
    current_working_perspective: legacyCurrentWorkingPerspectiveFixture,
    handoff_capsule: legacyHandoffCapsuleFixture,
    resume_packet: legacyAgWorkResumePacketFixture,
    external_refs: [],
  } satisfies LegacyTaskContextPacketInputV01);
}

function buildWorkBriefCwpOnlyInput(): LegacyTaskContextPacketInputV01 {
  return cloneValue({
    workspace_id: "workspace-augnes-fixture",
    project_id: "project-augnes-canonical-fixture",
    generated_at: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
    expires_at: TASK_CONTEXT_PACKET_FIXTURE_EXPIRES_AT,
    work_brief: legacyWorkBriefFixture,
    current_working_perspective: legacyCurrentWorkingPerspectiveFixture,
    external_refs: [],
  } satisfies LegacyTaskContextPacketInputV01);
}

function buildAnonymousHandoffInput(): LegacyTaskContextPacketInputV01 {
  const input = buildWorkBriefCwpOnlyInput();
  input.handoff = {
    expected_files: ["README.md"],
    expected_checks: ["npm run typecheck"],
    forbidden_surfaces: ["database writes"],
  };
  return input;
}

function buildMissingSourceTimestampInput(): LegacyTaskContextPacketInputV01 {
  const input = buildWorkBriefCwpOnlyInput();
  input.work_brief.as_of = "";
  input.current_working_perspective = null;
  return input;
}

function buildTimestampOnlyLegacyInput(): LegacyTaskContextPacketInputV01 {
  const input = buildWorkBriefCwpOnlyInput();
  input.current_working_perspective = null;
  input.work_brief.as_of = "2001-01-01T00:00:00.000Z";
  const workEvent = input.work_brief.recent_events[0];
  assert.ok(workEvent, "timestamp-only fixture requires a Work Brief event");
  workEvent.created_at = "2000-01-01T00:00:00.000Z";
  const proofAction = input.work_brief.related_proof.action_records[0];
  assert.ok(proofAction, "timestamp-only fixture requires a proof action");
  proofAction.created_at = "1999-01-01T00:00:00.000Z";
  input.external_refs = [
    {
      ref_version: EXTERNAL_REF_VERSION_V01,
      ref_type: "caller_timestamp_only_ref",
      external_id: "caller-ref:timestamp-only",
      observed_at: "1998-01-01T00:00:00.000Z",
      trust_class: "imported_unverified",
    },
  ];
  return input;
}

function buildOldResumeTimestampInput(): LegacyTaskContextPacketInputV01 {
  const input = buildLegacyInput();
  const resumePacket = input.resume_packet;
  assert.ok(resumePacket, "old resume fixture requires resume packet");
  resumePacket.created_at = "2001-01-01T00:00:00.000Z";
  const foreignAction = resumePacket.continuity.foreign_action_refs[0];
  assert.ok(foreignAction, "old resume fixture requires a foreign action");
  foreignAction.created_at = "2000-01-01T00:00:00.000Z";
  return input;
}

function buildMixedOffsetLegacyInput(): LegacyTaskContextPacketInputV01 {
  const input = buildLegacyInput();
  input.work_brief.as_of = "2026-07-10T00:30:00+09:00";
  const currentWorkingPerspective = input.current_working_perspective;
  assert.ok(currentWorkingPerspective, "mixed-offset fixture requires CWP");
  currentWorkingPerspective.as_of = "2026-07-09T16:00:00.000Z";
  return input;
}

function buildExpectedArtifactCollisionInput(): LegacyTaskContextPacketInputV01 {
  const input = buildLegacyInput();
  const resumePacket = input.resume_packet;
  assert.ok(resumePacket, "collision fixture requires resume packet");
  resumePacket.handoff.expected_files = ["a/b", "a-b"];
  return input;
}

function buildReorderedLegacyInput(): LegacyTaskContextPacketInputV01 {
  const input = buildLegacyInput();
  const handoffCapsule = input.handoff_capsule;
  const resumePacket = input.resume_packet;
  assert.ok(handoffCapsule, "reordered fixture requires HandoffCapsule");
  assert.ok(resumePacket, "reordered fixture requires resume packet");
  input.work_brief.related_state_keys.reverse();
  input.work_brief.work.related_state_keys.reverse();
  input.work_brief.codex_handoff.constraints.reverse();
  input.work_brief.codex_handoff.suggested_verification.reverse();
  handoffCapsule.constraints.non_goals.reverse();
  handoffCapsule.forbidden_actions.reverse();
  handoffCapsule.validation_expectations.required_checks.reverse();
  handoffCapsule.validation_expectations.success_criteria.reverse();
  resumePacket.handoff.expected_checks.reverse();
  resumePacket.source_work.related_state_keys.reverse();
  input.external_refs?.reverse();
  return input;
}

function buildReorderedGenericInput(): TaskContextPacketBuilderInputV01 {
  const input = cloneValue<TaskContextPacketBuilderInputV01>(
    genericCliBuilderInputFixture,
  );
  input.source_status.external_refs.reverse();
  input.compatibility.source_refs.reverse();
  input.task.success_criteria.reverse();
  input.task.non_goals.reverse();
  input.constraints.required_checks.reverse();
  input.constraints.forbidden_actions.reverse();
  return input;
}

function buildSourceAxisInput(
  coverage: TaskContextPacketV01["source_status"]["status"],
  currentness: TaskContextPacketV01["source_status"]["currentness"]["status"],
): TaskContextPacketBuilderInputV01 {
  const input = cloneValue<TaskContextPacketBuilderInputV01>(
    genericCliBuilderInputFixture,
  );
  const explicitCwpCurrentness = {
    status: legacyCurrentWorkingPerspectiveFixture.staleness.status,
    as_of: legacyCurrentWorkingPerspectiveFixture.as_of,
    basis: "CurrentWorkingPerspective.staleness.status is an explicit freshness evaluation.",
    source_ref: null,
  } as const;
  input.current_projection = {
    projection_kind: "current_working_perspective",
    projection_only: true,
    canonical_state: false,
    perspective_ref: null,
    bounded_summary:
      legacyCurrentWorkingPerspectiveFixture.current_frame.summary,
    as_of: legacyCurrentWorkingPerspectiveFixture.as_of,
    items: [
      {
        item_kind: "frame",
        summary: legacyCurrentWorkingPerspectiveFixture.current_frame.summary,
        source_refs: [],
        external_refs: [],
        currentness: cloneValue(explicitCwpCurrentness),
      },
    ],
    source_refs: [],
    external_refs: [],
    currentness: cloneValue(explicitCwpCurrentness),
    warnings: ["Explicit CWP freshness fixture."],
  };
  input.gaps = [];

  const aggregateSourceRef = input.source_status.external_refs[0] ?? null;
  input.source_status.status = coverage;
  input.source_status.currentness = {
    status: currentness,
    as_of:
      currentness === "unknown"
        ? null
        : TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
    basis: `Explicit source-axis fixture: ${coverage} coverage with ${currentness} currentness.`,
    source_ref:
      currentness === "unknown" ? null : cloneValue(aggregateSourceRef),
  };

  if (coverage === "partial") {
    input.gaps = [
      {
        code: "fixture_partial_source_coverage",
        summary: "One fixture source is intentionally unavailable.",
        severity: "medium",
        missing_fields: ["fixture.optional_source"],
        source_refs: [],
        external_refs: [],
      },
    ];
  } else if (coverage === "unknown") {
    input.work_ref = null;
    input.current_projection = null;
    input.selected_context = [];
    input.gaps = [
      {
        code: "missing_current_projection",
        summary: "No projection source is known in the unknown-coverage fixture.",
        severity: "medium",
        missing_fields: ["current_projection"],
        source_refs: [],
        external_refs: [],
      },
      {
        code: "missing_selected_context",
        summary: "No selected source is known in the unknown-coverage fixture.",
        severity: "medium",
        missing_fields: ["selected_context"],
        source_refs: [],
        external_refs: [],
      },
    ];
    input.source_status.source_refs = [];
    input.source_status.external_refs = [];
    input.compatibility.source_refs = [];
    input.return_contract.return_ref = null;
  }
  return input;
}

function buildOpenAiIntegratedInput(): TaskContextPacketBuilderInputV01 {
  const input = cloneValue<TaskContextPacketBuilderInputV01>(
    genericCliBuilderInputFixture,
  );
  input.workspace_id = "workspace-reference-adapter-fixture";
  input.project_id = "project-reference-adapter-fixture";
  input.work_ref = openAiExternalRefsFixture[1];
  input.compatibility.source_contracts = [
    "reference_adapter.integrated_profile.v0.1",
  ];
  input.compatibility.source_refs = cloneValue(openAiExternalRefsFixture);
  input.source_status.external_refs = cloneValue(openAiExternalRefsFixture);
  input.selected_context = openAiExternalRefsFixture.map((externalRef, index) => ({
    entry_id: `context:integrated-ref-${index + 1}`,
    entry_kind: "source_ref",
    source_ref: null,
    external_ref: cloneValue(externalRef),
    why_included: "Preserve a host-native compatibility identifier as ExternalRef.",
    currentness: {
      status: "fresh",
      as_of: TASK_CONTEXT_PACKET_FIXTURE_GENERATED_AT,
      basis: "Explicit host observation supplied by the caller.",
      source_ref: cloneValue(externalRef),
    },
    trust_class: externalRef.trust_class,
    compatibility_source_ref: cloneValue(externalRef),
    bounded_summary: "Host-native compatibility reference.",
  }));
  input.current_projection = null;
  input.gaps = [
    {
      code: "missing_current_projection",
      summary: "The integrated reference fixture has no perspective projection.",
      severity: "low",
      missing_fields: ["current_projection"],
      source_refs: [],
      external_refs: [],
    },
  ];
  return input;
}

function assertLegacyMapping(packet: TaskContextPacketV01) {
  assert.equal(packet.workspace_id, "workspace-augnes-fixture");
  assert.equal(packet.project_id, "project-augnes-canonical-fixture");
  assert.notEqual(packet.project_id, legacyWorkBriefFixture.scope);
  assert.equal(
    packet.task.goal,
    legacyWorkBriefFixture.codex_handoff.task_brief,
  );
  assert.deepEqual(
    packet.task.success_criteria,
    [...legacyHandoffCapsuleFixture.validation_expectations.success_criteria].sort(),
  );
  assert.deepEqual(
    packet.task.non_goals,
    [...legacyHandoffCapsuleFixture.constraints.non_goals].sort(),
  );
  for (const requiredCheck of [
    ...legacyWorkBriefFixture.codex_handoff.suggested_verification,
    ...legacyHandoffCapsuleFixture.validation_expectations.required_checks,
    ...legacyAgWorkResumePacketFixture.handoff.expected_checks,
  ]) {
    assert.ok(
      packet.constraints.required_checks.includes(requiredCheck),
      `missing mapped required check: ${requiredCheck}`,
    );
  }
  for (const forbiddenSurface of
    legacyAgWorkResumePacketFixture.handoff.forbidden_surfaces) {
    assert.ok(
      packet.constraints.forbidden_actions.includes(
        `Do not use compatibility surface: ${forbiddenSurface}`,
      ),
      `missing mapped resume forbidden surface: ${forbiddenSurface}`,
    );
  }
  for (const expectedFile of
    legacyAgWorkResumePacketFixture.handoff.expected_files) {
    assert.ok(
      packet.selected_context.some(
        (entry) =>
          entry.entry_kind === "artifact_ref" &&
          entry.external_ref?.external_id === expectedFile,
      ),
      `missing mapped resume expected artifact: ${expectedFile}`,
    );
  }
  assert.equal(
    packet.source_status.currentness.as_of,
    legacyCurrentWorkingPerspectiveFixture.as_of,
    "aggregate currentness must use the earliest supplied source timestamp",
  );
  assert.equal(packet.current_projection?.projection_only, true);
  assert.equal(packet.current_projection?.canonical_state, false);
  assert.equal(
    packet.authority_summary.current_projection_is_source_of_truth,
    false,
  );
  assert.ok(
    packet.current_projection?.items.some(
      (item) =>
        item.item_kind === "frame" &&
        item.summary === legacyCurrentWorkingPerspectiveFixture.current_frame.summary,
    ),
  );
  assert.ok(
    packet.current_projection?.items.some(
      (item) =>
        item.item_kind === "thesis" &&
        item.summary === legacyCurrentWorkingPerspectiveFixture.current_thesis.summary,
    ),
  );
  assert.ok(
    packet.current_projection?.items.some((item) => item.item_kind === "risk"),
  );
  assert.ok(
    packet.current_projection?.items.some(
      (item) => item.item_kind === "open_question",
    ),
  );
  for (const openQuestion of legacyCurrentWorkingPerspectiveFixture.open_questions) {
    assert.equal(
      packet.tensions.some(
        (tension) => tension.summary === openQuestion.summary,
      ),
      false,
      "CWP open questions must remain projection items and must not be promoted to tensions",
    );
  }
  assert.equal(
    packet.compatibility.legacy_scope_ref?.external_id,
    legacyWorkBriefFixture.scope,
  );
  assert.equal(
    packet.compatibility.legacy_scope_ref?.ref_type,
    "legacy_scope",
  );
  assert.ok(
    packet.selected_context.every(
      (entry) =>
        entry.why_included.trim().length > 0 &&
        entry.currentness.basis.trim().length > 0,
    ),
    "every selected context entry must preserve rationale and currentness",
  );
  const proofEntry = packet.selected_context.find(
    (entry) =>
      entry.entry_kind === "proof_ref" &&
      (entry.source_ref === "action:vnext-context-proof-only" ||
        entry.external_ref?.external_id === "action:vnext-context-proof-only"),
  );
  assert.ok(proofEntry, "legacy proof action must remain a proof_ref");
  assert.equal(
    packet.selected_context.some(
      (entry) =>
        entry.entry_kind === "evidence_ref" &&
        (entry.source_ref === "action:vnext-context-proof-only" ||
          entry.external_ref?.external_id === "action:vnext-context-proof-only"),
    ),
    false,
    "proof must not be promoted to Evidence",
  );
  assert.equal(packet.return_contract.compatibility_only, true);
  assert.equal(packet.return_contract.return_kind, "compatibility_result_report");
  assert.equal(packet.authority_summary.is_command, false);
  assert.equal(packet.authority_summary.is_canonical_project_state, false);
  assert.equal(packet.authority_summary.is_approval, false);
  assert.equal(packet.authority_summary.performs_durable_transition, false);
}

function assertGenericCliPacket(packet: TaskContextPacketV01) {
  const serialized = JSON.stringify(packet).toLowerCase();
  for (const vendorTerm of ["openai", "chatgpt", "codex"]) {
    assert.equal(
      serialized.includes(vendorTerm),
      false,
      `Generic CLI packet unexpectedly contains ${vendorTerm}`,
    );
  }
  assert.equal(
    packet.compatibility.source_refs.every(
      (ref) => ref.provider === undefined && ref.provider !== null,
    ),
    true,
    "Generic CLI provider must be absent",
  );
  assert.ok(
    packet.compatibility.source_refs.some((ref) => ref.host === "local-shell"),
  );
  assert.equal(packet.authority_summary.provider_refs_are_canonical, false);
}

function assertOpenAiRefsAreIsolated(packet: TaskContextPacketV01) {
  const identifiers = new Set(
    openAiExternalRefsFixture.map((ref) => ref.external_id),
  );
  assertIdentifiersOnlyInsideExternalRefs(packet, identifiers);
  assertNoVendorSpecificCoreKeys(packet);
  for (const ref of openAiExternalRefsFixture) {
    assert.ok(
      packet.compatibility.source_refs.some(
        (candidate) =>
          candidate.ref_version === EXTERNAL_REF_VERSION_V01 &&
          candidate.external_id === ref.external_id &&
          candidate.provider === ref.provider &&
          candidate.host === ref.host,
      ),
      `missing isolated ExternalRef ${ref.external_id}`,
    );
  }
}

function assertIdentifiersOnlyInsideExternalRefs(
  value: unknown,
  identifiers: Set<string>,
  path = "$",
  insideExternalRef = false,
) {
  if (typeof value === "string") {
    if (identifiers.has(value)) {
      assert.ok(insideExternalRef, `${value} escaped ExternalRef at ${path}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertIdentifiersOnlyInsideExternalRefs(
        item,
        identifiers,
        `${path}[${index}]`,
        insideExternalRef,
      ),
    );
    return;
  }
  if (!isRecord(value)) return;
  const currentIsExternalRef =
    value.ref_version === EXTERNAL_REF_VERSION_V01;
  for (const [key, child] of Object.entries(value)) {
    assertIdentifiersOnlyInsideExternalRefs(
      child,
      identifiers,
      `${path}.${key}`,
      insideExternalRef || currentIsExternalRef,
    );
  }
}

function assertNoVendorSpecificCoreKeys(
  value: unknown,
  path = "$",
  insideExternalRef = false,
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoVendorSpecificCoreKeys(
        item,
        `${path}[${index}]`,
        insideExternalRef,
      ),
    );
    return;
  }
  if (!isRecord(value)) return;
  const currentIsExternalRef =
    value.ref_version === EXTERNAL_REF_VERSION_V01;
  for (const [key, child] of Object.entries(value)) {
    if (!insideExternalRef && !currentIsExternalRef) {
      assert.doesNotMatch(
        key,
        /^(?:openai|chatgpt|codex)(?:_|$)|^(?:provider|host|model|session|thread|task|run)_id$/i,
        `provider-specific Core key found at ${path}.${key}`,
      );
    }
    assertNoVendorSpecificCoreKeys(
      child,
      `${path}.${key}`,
      insideExternalRef || currentIsExternalRef,
    );
  }
}

function assertPureProtocolSources() {
  const forbiddenPatterns: Array<{ label: string; pattern: RegExp }> = [
    {
      label: "filesystem dependency",
      pattern: /from\s+["'](?:node:fs|fs)["']/,
    },
    {
      label: "child process dependency",
      pattern: /from\s+["'](?:node:child_process|child_process)["']/,
    },
    {
      label: "network dependency",
      pattern: /from\s+["'](?:node:http|node:https|node:http2|node:net|node:tls)["']/,
    },
    {
      label: "database dependency",
      pattern:
        /from\s+["'](?:better-sqlite3|@\/lib\/(?:db|database)(?:["'/]))|\bnew\s+Database\s*\(/,
    },
    {
      label: "provider dependency",
      pattern:
        /from\s+["'][^"']*(?:openai|anthropic|google-generative|bedrock|vertex|provider-sdk)[^"']*["']/i,
    },
    { label: "fetch", pattern: /\bfetch\s*\(/ },
    { label: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
    { label: "WebSocket", pattern: /\bWebSocket\b/ },
    { label: "EventSource", pattern: /\bEventSource\b/ },
    {
      label: "filesystem write",
      pattern: /\b(?:writeFile|writeFileSync|appendFile|appendFileSync)\s*\(/,
    },
    {
      label: "shell execution",
      pattern: /\b(?:exec|execFile|execSync|spawn|spawnSync)\s*\(/,
    },
    {
      label: "runtime Work Brief builder",
      pattern: /\bbuildWorkBrief\s*\(/,
    },
    {
      label: "runtime Current Working Perspective builder",
      pattern: /\bbuildCurrentWorkingPerspective(?:Result)?\s*\(/,
    },
    {
      label: "runtime resume packet builder",
      pattern: /\bbuildAgWorkResumePacketPreview\s*\(/,
    },
    {
      label: "runtime handoff builder",
      pattern:
        /\b(?:buildHandoffCapsule|buildGeneratedHandoffDraft|createGeneratedHandoff|createHandoff)\s*\(/,
    },
    {
      label: "state mutation helper",
      pattern:
        /\b(?:appendWorkEvent|appendCoordinationEvent|recordProof|createEvidenceRecord|commitState|rejectState)\s*\(/,
    },
    { label: "environment read", pattern: /\bprocess\.env\b/ },
    { label: "implicit Date.now clock", pattern: /\bDate\.now\s*\(/ },
    { label: "implicit Date constructor clock", pattern: /\bnew\s+Date\s*\(\s*\)/ },
    { label: "random UUID", pattern: /\brandomUUID\s*\(/ },
    { label: "random number", pattern: /\bMath\.random\s*\(/ },
  ];

  for (const sourcePath of sourcePaths) {
    const source = readFileSync(sourcePath, "utf8");
    for (const { label, pattern } of forbiddenPatterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `${sourcePath} must remain pure: ${label}`,
      );
    }
  }
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return Object.freeze(value);
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatValidation(value: {
  status: string;
  errors: Array<{ code: string; path: string | null; message: string }>;
  warnings: Array<{ code: string; path: string | null; message: string }>;
}) {
  return JSON.stringify(value, null, 2);
}
