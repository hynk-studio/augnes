import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  insertVNextCoreRecordV01,
  listVNextCoreRecordsV01,
  type VNextCoreRecordKindV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import {
  exportActivePortableProjectV01,
  importPortableProjectV01,
  parseAndValidatePortableProjectV01,
} from "../lib/vnext/portability/portable-project";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import { readProjectHomeProjectionV01 } from "../lib/vnext/project-home/project-home-projection";
import { buildProjectGuideBriefV02 } from "../lib/vnext/guide-brief/project-guide-brief";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "../lib/vnext/protocol-primitives";
import { validateTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import {
  buildInitialProjectWorkTaskContextPacketV01,
  inspectInitialProjectWorkPacketLineageV01,
  normalizeInitialProjectWorkDefinitionV01,
} from "../lib/vnext/runtime/initial-project-work-context";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "../lib/vnext/runtime/local-operator-session";
import {
  defineInitialProjectWorkV01,
  readProjectWorkInitializationV01,
} from "../lib/vnext/runtime/project-work-initialization";
import {
  buildDirectNativeHostRunIdentityV01,
  admitPersistedHostTaskContextPacketV01,
  runDirectNativeHostRoundTripV01,
  shouldAttachNativeHostTaskStartGuideV01,
  type PersistedHostPacketAdmissionV01,
} from "../lib/vnext/runtime/direct-native-host-round-trip";
import { createDeterministicCodexAdapterV01 } from "../lib/vnext/native-host/deterministic-codex-adapter";
import { projectVNextOperatorPilotContinuityV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage";
import { readSharedProjectInspectorV01 } from "../lib/vnext/runtime/shared-project-inspector";
import type { EpisodeDeltaProposalV01 } from "../types/vnext/episode-delta-proposal";
import type { NativeHostRequestV01 } from "../types/vnext/native-host-adapter";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import {
  INITIAL_PROJECT_WORK_LIMITS_V01,
  type DefineInitialProjectWorkRequestV01,
  type ProjectWorkDefinitionV01,
} from "../types/vnext/project-work-initialization";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";

const ROOT = mkdtempSync(path.join(tmpdir(), "augnes-first-work-"));
const T0 = "2026-08-01T00:00:00.000Z";
const T1 = "2026-08-01T00:00:01.000Z";
const T2 = "2026-08-01T00:00:02.000Z";

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  try {
    assertNormalizationAndCompilerV01();
    assertNativeHostRunIdentityCompatibilityV01();
    assertInitializationReadPolicyV01();
    assertMutationAndReplayV01();
    assertMutationRefusalsAndRollbackV01();
    assertInitialWorkPortabilityV01();
    await assertSeparateNativeHostStartV01();
    console.log(JSON.stringify({
      status: "pass",
      contract: "project_work_initialization.v0.1",
      states: [
        "not_defined",
        "defined_initial_work",
        "existing_history_without_current_packet",
        "unavailable",
      ],
      korean_and_unicode: true,
      exact_replay: true,
      authenticated_transaction: true,
      save_execution_started: false,
      separate_native_host_start: true,
      portability_round_trip: true,
      fake_transition_created: false,
      schema_migration_added: false,
    }, null, 2));
  } finally {
    rmSync(ROOT, { recursive: true, force: true });
  }
}

function assertInitialWorkPortabilityV01(): void {
  const source = createFixtureV01("portable-source");
  const destination = new Database(":memory:");
  const destinationBase = path.join(ROOT, "portable-destination");
  mkdirSync(destinationBase, { recursive: true });
  try {
    const inserted = defineInitialProjectWorkV01(source.db, {
      config: source.config,
      credential: authenticatedSessionV01(source, "portable"),
      request: requestV01(source, {
        goal: "포터블 첫 목표를 보존한다",
        success_criteria: ["Goal and criteria survive import", "초기 계보가 유지된다"],
        non_goals: ["자동 실행하지 않는다"],
      }),
      clock: fixedClock(T2),
    });
    const exported = exportActivePortableProjectV01(source.db, {
      include_personal_perspective: false,
      exported_at: "2026-08-01T00:00:03.000Z",
    });
    const parsed = parseAndValidatePortableProjectV01(exported.bytes);
    assert.equal(parsed.records.length, 1);
    assert.equal(parsed.operator_provenance_sessions.length, 1);
    assert.equal(new TextDecoder().decode(exported.bytes).includes(source.root), false);
    destination.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(destination);
    const imported = importPortableProjectV01(destination, {
      bytes: exported.bytes,
      destination_root_base: destinationBase,
      imported_at: "2026-08-01T00:00:04.000Z",
    });
    assert.equal(imported.status, "imported");
    const initialization = readProjectWorkInitializationV01(destination, {
      workspace_id: source.workspace_id,
      project_id: source.project_id,
    });
    assert.equal(initialization.state, "defined_initial_work");
    assert.deepEqual(initialization.current_work, inserted.definition);
    assert.equal(initialization.current_packet?.packet_id, inserted.packet.packet_id);
    assert.equal(
      importPortableProjectV01(destination, {
        bytes: exported.bytes,
        destination_root_base: destinationBase,
        imported_at: "2026-08-01T00:00:05.000Z",
      }).status,
      "exact_replay",
    );
    assert.equal(
      (destination.prepare("SELECT COUNT(*) AS count FROM autonomy_runs").get() as { count: number }).count,
      0,
    );
  } finally {
    source.db.close();
    destination.close();
  }
}

function assertNormalizationAndCompilerV01(): void {
  const normalized = normalizeInitialProjectWorkDefinitionV01({
    goal: "  첫 목표를 명확하게 완성한다  ",
    success_criteria: [" 결과가 검증된다 ", "결과가 검증된다", "영문 output works"],
    non_goals: [" 배포하지 않는다 ", ""],
  });
  assert.deepEqual(normalized, {
    goal: "첫 목표를 명확하게 완성한다",
    success_criteria: ["결과가 검증된다", "영문 output works"],
    non_goals: ["배포하지 않는다"],
  });
  assert.throws(
    () => normalizeInitialProjectWorkDefinitionV01({
      goal: "",
      success_criteria: ["done"],
      non_goals: [],
    }),
    errorCode("first_work_goal_invalid"),
  );
  assert.throws(
    () => normalizeInitialProjectWorkDefinitionV01({
      goal: "goal",
      success_criteria: [],
      non_goals: [],
    }),
    errorCode("first_work_success_criteria_invalid"),
  );
  assert.throws(
    () => normalizeInitialProjectWorkDefinitionV01({
      goal: "🙂".repeat(2_001),
      success_criteria: ["done"],
      non_goals: [],
    }),
    errorCode("first_work_goal_invalid"),
  );
  assert.throws(
    () => normalizeInitialProjectWorkDefinitionV01({
      goal: "가".repeat(2_000),
      success_criteria: Array.from({ length: 12 }, (_, index) =>
        `${index}${"나".repeat(497)}`,
      ),
      non_goals: [],
    }),
    errorCode("first_work_definition_too_large"),
  );

  const rocketDefinition = normalizeInitialProjectWorkDefinitionV01({
    goal: "🚀".repeat(2_000),
    success_criteria: ["The complete Unicode goal remains executable"],
    non_goals: [],
  });
  const maximalAscii = definitionAtCanonicalBytesV01(
    INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes,
    "ascii",
  );
  const maximalMixed = definitionAtCanonicalBytesV01(
    INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes,
    "mixed",
  );
  for (const definition of [rocketDefinition, maximalAscii, maximalMixed]) {
    const normalizedBoundary = normalizeInitialProjectWorkDefinitionV01({
      goal: definition.goal,
      success_criteria: definition.success_criteria,
      non_goals: definition.non_goals,
    });
    const builtBoundary = buildInitialProjectWorkTaskContextPacketV01({
      workspace_id: "workspace:11111111-1111-4111-8111-111111111111",
      project_id: "project:22222222-2222-4222-8222-222222222222",
      operator_id: "operator:first-work-boundary",
      session_id: "local-operator-session:boundary",
      expected_active_selection_revision: 1,
      definition: normalizedBoundary,
      generated_at: T2,
    });
    assert.equal(
      validateTaskContextPacketV01(builtBoundary.packet, {
        evaluated_at: T2,
      }).status,
      "valid",
    );
  }
  assert.equal(maximalAscii.goal.length, 2_000);
  assert.equal(maximalAscii.success_criteria.length, 12);
  assert(maximalAscii.non_goals.length > 0);
  assert.equal(
    Buffer.byteLength(canonicalizeProtocolValueV01(maximalAscii), "utf8"),
    INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes,
  );
  assert.equal(
    Buffer.byteLength(canonicalizeProtocolValueV01(maximalMixed), "utf8"),
    INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes,
  );
  assert.throws(
    () =>
      normalizeInitialProjectWorkDefinitionV01({
        ...maximalAscii,
        non_goals: [
          ...maximalAscii.non_goals.slice(0, -1),
          `${maximalAscii.non_goals.at(-1)}x`,
        ],
      }),
    errorCode("first_work_definition_too_large"),
  );

  const one = buildInitialProjectWorkTaskContextPacketV01({
    workspace_id: "workspace:11111111-1111-4111-8111-111111111111",
    project_id: "project:22222222-2222-4222-8222-222222222222",
    operator_id: "operator:first-work-test",
    session_id: "local-operator-session:test",
    expected_active_selection_revision: 1,
    definition: normalized,
    generated_at: T2,
  });
  const two = buildInitialProjectWorkTaskContextPacketV01({
    workspace_id: one.packet.workspace_id,
    project_id: one.packet.project_id,
    operator_id: "operator:first-work-test",
    session_id: "local-operator-session:later-request",
    expected_active_selection_revision: 1,
    definition: normalized,
    generated_at: "2026-08-01T00:00:10.000Z",
  });
  assert.equal(one.lineage.idempotency_key, two.lineage.idempotency_key);
  assert.equal(validateTaskContextPacketV01(one.packet, { evaluated_at: T2 }).status, "valid");
  assert.deepEqual(one.packet.task, normalized);
  assert.equal(one.packet.capability_grant, null);
  assert.deepEqual(one.packet.constraints.required_checks, []);
  assert.deepEqual(one.packet.return_contract.expected_artifacts, []);
  assert(one.packet.current_projection);
  assert.equal(one.packet.current_projection.canonical_state, false);
  assert.equal(one.packet.current_projection.projection_only, true);
  assert.equal(
    one.packet.selected_context.some((entry) => entry.entry_kind === "accepted_state_ref"),
    false,
  );
  const serialized = canonicalizeProtocolValueV01(one.packet);
  assert.equal(serialized.includes(ROOT), false);
  assert.equal(/credential|cookie|hidden_reasoning|transcript|provider_output/u.test(serialized), false);
}

function assertNativeHostRunIdentityCompatibilityV01(): void {
  assert.equal(
    shouldAttachNativeHostTaskStartGuideV01({
      adapter: { provider_egress: "forbidden" },
      resume_existing_run: false,
    }),
    false,
  );
  assert.equal(
    shouldAttachNativeHostTaskStartGuideV01({
      adapter: { provider_egress: "native_host_managed" },
      resume_existing_run: false,
    }),
    true,
  );
  assert.equal(
    shouldAttachNativeHostTaskStartGuideV01({
      adapter: { provider_egress: "native_host_managed" },
      resume_existing_run: true,
    }),
    false,
  );
  const ref = (refType: string, externalId: string) => ({
    ref_version: "external_ref.v0.1" as const,
    ref_type: refType,
    external_id: externalId,
    trust_class: "derived_interpretation" as const,
    observed_at: T1,
    source_ref: createProtocolSha256V01(externalId),
    compatibility_namespace: "identity-golden.v0.1",
  });
  const transitionRef = ref(
    "state_transition_receipt",
    "transition:identity-golden",
  );
  const baseAdmission = {
    admission_version: "persisted_host_packet_admission.v0.1",
    packet: {
      packet_id: "task-context-packet:identity-golden",
      integrity: {
        fingerprint: createProtocolSha256V01("packet:identity-golden"),
      },
    } as TaskContextPacketV01,
    packet_ref: ref("task_context_packet", "task-context-packet:identity-golden"),
    work_ref: ref("work", "work:identity-golden"),
    task_ref: ref("task", "task:identity-golden"),
    packet_lineage: {
      lineage_kind: "semantic_transition",
      source_transition_receipt_ref: transitionRef,
    },
    root_scope: {
      canonical_root: "/identity-golden-root",
      path_flavor: "posix",
      root_kind: "plain_folder",
      root_fingerprint: createProtocolSha256V01("root:identity-golden"),
      physical_root_identity: {
        identity_version: "native_host_physical_root_identity.v0.1",
        canonical_realpath_fingerprint: createProtocolSha256V01(
          "/identity-golden-root",
        ),
        device: "101",
        inode: "202",
      },
      root_scope_ref: ref("project_root_scope", "root:identity-golden"),
      repository_ref: null,
      selected_worktree_ref: null,
    },
  } satisfies PersistedHostPacketAdmissionV01;
  const config = {
    enabled: true as const,
    workspace_id: "workspace:11111111-1111-4111-8111-111111111111",
    project_id: "project:22222222-2222-4222-8222-222222222222",
    operator_id: "operator:identity-golden",
    database_path: ":memory:",
  };
  const adapter = createDeterministicCodexAdapterV01();
  const transition = buildDirectNativeHostRunIdentityV01({
    config,
    mode: "interactive",
    admission: baseAdmission,
    adapter,
    automation_context: null,
  });
  assert.deepEqual(transition, {
    run_id: "host-run:91e4f4dd44b89028e09acdcc",
    request_id: "host-request:91e4f4dd44b89028e09acdcc",
    idempotency_key:
      "sha256:91e4f4dd44b89028e09acdcca3de36aea562db72f2dfc558b06ae9b7bf189d7e",
  });
  const initial = buildDirectNativeHostRunIdentityV01({
    config,
    mode: "interactive",
    admission: {
      ...baseAdmission,
      packet_lineage: {
        lineage_kind: "initial_user_defined",
        first_work_definition_ref: ref(
          "first_work_definition",
          "first-work-definition:identity-golden",
        ),
        first_work_request_ref: ref(
          "first_work_request",
          "first-work-request:identity-golden",
        ),
        operator_action_ref: ref(
          "local_operator_session_action",
          "operator-action:identity-golden",
        ),
      },
    },
    adapter,
    automation_context: null,
  });
  assert.deepEqual(initial, {
    run_id: "host-run:1a06eb237240a656aac42dc0",
    request_id: "host-request:1a06eb237240a656aac42dc0",
    idempotency_key:
      "sha256:1a06eb237240a656aac42dc044a1b95d9228a556e200e49290cac8f140299059",
  });
  assert.notEqual(initial.idempotency_key, transition.idempotency_key);
}

function assertInitializationReadPolicyV01(): void {
  for (const kind of ["plain", "git"] as const) {
    const fixture = createFixtureV01(`new-${kind}`, kind === "git");
    try {
      const initialization = readProjectWorkInitializationV01(fixture.db, fixture.config);
      assert.equal(initialization.state, "not_defined");
      assert.equal(initialization.mutation_eligible, true);
    } finally {
      fixture.db.close();
    }
  }

  for (const recordKind of [
    "run_receipt",
    "episode_delta_proposal",
    "review_decision",
    "state_transition_receipt",
  ] as const) {
    const fixture = createFixtureV01(`history-${recordKind}`);
    try {
      insertHistoryRecordV01(fixture, recordKind);
      assert.equal(
        readProjectWorkInitializationV01(fixture.db, fixture.config).state,
        "existing_history_without_current_packet",
      );
    } finally {
      fixture.db.close();
    }
  }

  const runFixture = createFixtureV01("run-history");
  try {
    insertManagedRunV01(runFixture, {
      run_id: "run:first-work-history",
      scope: runFixture.project_id,
      metadata_json: "{}",
    });
    assert.equal(
      readProjectWorkInitializationV01(runFixture.db, runFixture.config).state,
      "existing_history_without_current_packet",
    );
  } finally {
    runFixture.db.close();
  }

  for (const [name, metadata] of [
    ["null-metadata", { workspace_id: null, project_id: null }],
    [
      "contradictory-metadata",
      { workspace_id: "workspace:other", project_id: "project:other" },
    ],
  ] as const) {
    const fixture = createFixtureV01(`run-${name}`);
    try {
      insertManagedRunV01(fixture, {
        run_id: `run:${name}`,
        scope: fixture.project_id,
        metadata_json: JSON.stringify(metadata),
      });
      assert.equal(
        readProjectWorkInitializationV01(fixture.db, fixture.config).state,
        "existing_history_without_current_packet",
      );
    } finally {
      fixture.db.close();
    }
  }

  const conflictFixture = createFixtureV01("run-metadata-scope-conflict");
  try {
    insertManagedRunV01(conflictFixture, {
      run_id: "run:metadata-scope-conflict",
      scope: "project:other-scope",
      metadata_json: JSON.stringify({
        workspace_id: conflictFixture.workspace_id,
        project_id: conflictFixture.project_id,
      }),
    });
    assert.equal(
      readProjectWorkInitializationV01(
        conflictFixture.db,
        conflictFixture.config,
      ).state,
      "unavailable",
    );
  } finally {
    conflictFixture.db.close();
  }

  const malformedFixture = createFixtureV01("run-malformed-metadata");
  try {
    insertManagedRunV01(malformedFixture, {
      run_id: "run:malformed-metadata",
      scope: "project:unrelated",
      metadata_json: "{not-json",
    });
    assert.equal(
      readProjectWorkInitializationV01(
        malformedFixture.db,
        malformedFixture.config,
      ).state,
      "unavailable",
    );
  } finally {
    malformedFixture.db.close();
  }

  const unrelatedFixture = createFixtureV01("run-unrelated");
  try {
    insertManagedRunV01(unrelatedFixture, {
      run_id: "run:unrelated",
      scope: "project:unrelated",
      metadata_json: JSON.stringify({
        workspace_id: "workspace:unrelated",
        project_id: "project:unrelated",
      }),
    });
    assert.equal(
      readProjectWorkInitializationV01(
        unrelatedFixture.db,
        unrelatedFixture.config,
      ).state,
      "not_defined",
    );
  } finally {
    unrelatedFixture.db.close();
  }

  const semanticFixture = createFixtureV01("semantic-history");
  try {
    semanticFixture.db.prepare(
      `INSERT INTO vnext_semantic_target_heads (
        workspace_id, project_id, target_key, revision, presence,
        current_state_fingerprint, source_transition_receipt_id,
        source_transition_receipt_fingerprint, updated_at
      ) VALUES (?, ?, ?, 1, 'absent', NULL, ?, ?, ?)`,
    ).run(
      semanticFixture.workspace_id,
      semanticFixture.project_id,
      createProtocolSha256V01("goal:historical"),
      "transition:historical",
      createProtocolSha256V01("historical-transition"),
      T1,
    );
    assert.equal(
      readProjectWorkInitializationV01(semanticFixture.db, semanticFixture.config).state,
      "existing_history_without_current_packet",
    );
  } finally {
    semanticFixture.db.close();
  }

  const rootFixture = createFixtureV01("root-unavailable");
  try {
    const unavailable = readProjectWorkInitializationV01(
      rootFixture.db,
      rootFixture.config,
      { root_available: () => false },
    );
    assert.equal(unavailable.state, "unavailable");
    assert.equal(unavailable.reason, "root_unavailable");
  } finally {
    rootFixture.db.close();
  }

  const sourceFixture = createFixtureV01("source-unavailable");
  try {
    sourceFixture.db.exec("DROP TABLE vnext_core_records");
    assert.equal(
      readProjectWorkInitializationV01(sourceFixture.db, sourceFixture.config).state,
      "unavailable",
    );
  } finally {
    sourceFixture.db.close();
  }
}

function assertMutationAndReplayV01(): void {
  const fixture = createFixtureV01("insert-and-replay");
  try {
    const beforeFiles = readdirSync(fixture.root);
    const session = authenticatedSessionV01(fixture, "insert");
    const request = requestV01(fixture, {
      goal: "한국어 첫 목표를 완성한다",
      success_criteria: ["  동작이 검증된다 ", "영문 criterion passes", "동작이 검증된다"],
      non_goals: ["배포하지 않는다"],
    });
    const inserted = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: session,
      request,
      clock: fixedClock(T2),
    });
    assert.equal(inserted.status, "inserted");
    assert.equal(inserted.execution_started, false);
    assert.equal(inserted.run_created, false);
    assert.equal(inserted.provider_called, false);
    assert.equal(inserted.project_files_written, false);
    assert.equal(inserted.proposal_created, false);
    assert.equal(inserted.review_decision_created, false);
    assert.equal(inserted.transition_created, false);
    assert.equal(inserted.semantic_state_changed, false);
    assert.deepEqual(readdirSync(fixture.root), beforeFiles);
    assert.equal(
      listVNextCoreRecordsV01(fixture.db, {
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        record_kinds: [
          "task_context_packet",
          "episode_delta_proposal",
          "review_decision",
          "state_transition_receipt",
          "run_receipt",
        ],
        limit: 32,
      }).length,
      1,
    );
    const state = readProjectWorkInitializationV01(fixture.db, fixture.config);
    assert.equal(state.state, "defined_initial_work");
    assert.equal(state.current_work?.goal, "한국어 첫 목표를 완성한다");
    assert.deepEqual(state.current_work?.success_criteria, [
      "동작이 검증된다",
      "영문 criterion passes",
    ]);
    const lineage = inspectInitialProjectWorkPacketLineageV01(fixture.db, {
      workspace_id: fixture.workspace_id,
      project_id: fixture.project_id,
      packet: inserted.packet,
    });
    assert.equal(lineage.lineage_kind, "initial_user_defined");
    assert.equal(lineage.projection_current, true);
    assert.equal(lineage.definition_ref.trust_class, "user_declaration");
    assert.equal(lineage.operator_action_ref.trust_class, "direct_local_observation");

    const replay = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: credentialFromCookieV01(inserted.session_admission.cookie_value),
      request,
      clock: fixedClock("2026-08-01T00:00:03.000Z"),
    });
    assert.equal(replay.status, "exact_replay");
    assert.equal(replay.packet.packet_id, inserted.packet.packet_id);
    assert.throws(
      () => defineInitialProjectWorkV01(fixture.db, {
        config: fixture.config,
        credential: credentialFromCookieV01(replay.session_admission.cookie_value),
        request: { ...request, goal: "A different first goal" },
        clock: fixedClock("2026-08-01T00:00:04.000Z"),
      }),
      errorCode("first_work_already_defined"),
    );

    const altered = structuredClone(inserted.packet);
    altered.compatibility.source_refs = altered.compatibility.source_refs.filter(
      (ref) => ref.ref_type !== "first_work_definition",
    );
    assert.throws(
      () => inspectInitialProjectWorkPacketLineageV01(fixture.db, {
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        packet: altered,
      }),
      errorCode("initial_project_work_lineage_ref_invalid"),
    );
    const accepted = structuredClone(inserted.packet);
    accepted.selected_context[0]!.entry_kind = "accepted_state_ref";
    assert.throws(
      () => inspectInitialProjectWorkPacketLineageV01(fixture.db, {
        workspace_id: fixture.workspace_id,
        project_id: fixture.project_id,
        packet: accepted,
      }),
      errorCode("initial_project_work_packet_binding_invalid"),
    );
  } finally {
    fixture.db.close();
  }

  for (const [name, boundary] of [
    [
      "rocket",
      normalizeInitialProjectWorkDefinitionV01({
        goal: "🚀".repeat(2_000),
        success_criteria: ["The complete Unicode goal remains executable"],
        non_goals: [],
      }),
    ],
    [
      "ascii",
      definitionAtCanonicalBytesV01(
        INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes,
        "ascii",
      ),
    ],
    [
      "mixed",
      definitionAtCanonicalBytesV01(
        INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes,
        "mixed",
      ),
    ],
  ] as const) {
    const boundaryFixture = createFixtureV01(`boundary-insert-${name}`);
    try {
      const request = requestV01(boundaryFixture, boundary);
      const inserted = defineInitialProjectWorkV01(boundaryFixture.db, {
        config: boundaryFixture.config,
        credential: authenticatedSessionV01(boundaryFixture, `boundary-${name}`),
        request,
        clock: fixedClock(T2),
      });
      assert.equal(inserted.status, "inserted");
      assert.deepEqual(inserted.definition, boundary);
      const replay = defineInitialProjectWorkV01(boundaryFixture.db, {
        config: boundaryFixture.config,
        credential: credentialFromCookieV01(
          inserted.session_admission.cookie_value,
        ),
        request,
        clock: fixedClock("2026-08-01T00:00:03.000Z"),
      });
      assert.equal(replay.status, "exact_replay");
      assert.equal(replay.packet.packet_id, inserted.packet.packet_id);
    } finally {
      boundaryFixture.db.close();
    }
  }
}

function definitionAtCanonicalBytesV01(
  targetBytes: number,
  variant: "ascii" | "mixed",
): ProjectWorkDefinitionV01 {
  const goal =
    variant === "ascii"
      ? "g".repeat(2_000)
      : `${"한글".repeat(500)}${"g".repeat(500)}`;
  const successCriteria = Array.from({ length: 12 }, (_, index) => {
    const prefix = `criterion-${String(index).padStart(2, "0")}:`;
    return `${prefix}${"c".repeat(500 - prefix.length)}`;
  });
  const nonGoals: string[] = [];
  const value = (): ProjectWorkDefinitionV01 => ({
    goal,
    success_criteria: successCriteria,
    non_goals: [...nonGoals],
  });
  while (
    Buffer.byteLength(canonicalizeProtocolValueV01(value()), "utf8") <
    targetBytes
  ) {
    const current = nonGoals.at(-1);
    if (current === undefined || [...current].length >= 500) {
      const prefix = `non-goal-${String(nonGoals.length).padStart(2, "0")}:`;
      nonGoals.push(prefix);
    } else {
      nonGoals[nonGoals.length - 1] = `${current}n`;
    }
    const bytes = Buffer.byteLength(
      canonicalizeProtocolValueV01(value()),
      "utf8",
    );
    if (bytes > targetBytes) {
      throw new Error(`unable_to_construct_exact_definition:${bytes}`);
    }
  }
  return value();
}

function assertMutationRefusalsAndRollbackV01(): void {
  const fixture = createFixtureV01("rollback");
  try {
    const credential = authenticatedSessionV01(fixture, "rollback");
    const request = requestV01(fixture);
    assert.throws(
      () => defineInitialProjectWorkV01(fixture.db, {
        config: fixture.config,
        credential,
        request: { ...request, expected_active_selection_revision: 999 },
        clock: fixedClock(T2),
      }),
      errorCode("first_work_active_selection_conflict"),
    );
    assert.throws(
      () => defineInitialProjectWorkV01(fixture.db, {
        config: fixture.config,
        credential,
        request,
        clock: fixedClock(T2),
      }, { root_available: () => false }),
      errorCode("first_work_root_unavailable"),
    );
    fixture.db.exec(
      `CREATE TRIGGER test_first_work_rollback
       BEFORE INSERT ON vnext_core_records
       WHEN NEW.record_kind = 'task_context_packet'
       BEGIN SELECT RAISE(ABORT, 'test_first_work_rollback'); END`,
    );
    assert.throws(
      () => defineInitialProjectWorkV01(fixture.db, {
        config: fixture.config,
        credential,
        request,
        clock: fixedClock(T2),
      }),
      errorCode("first_work_write_failed"),
    );
    assert.equal(readProjectWorkInitializationV01(fixture.db, fixture.config).state, "not_defined");
    fixture.db.exec("DROP TRIGGER test_first_work_rollback");
    const retry = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential,
      request,
      clock: fixedClock(T2),
    });
    assert.equal(retry.status, "inserted");
    assert.throws(
      () => defineInitialProjectWorkV01(fixture.db, {
        config: fixture.config,
        credential,
        request,
        clock: fixedClock(T2),
      }),
      errorCode("operator_action_nonce_invalid"),
    );
  } finally {
    fixture.db.close();
  }

  const isolation = createFixtureV01("isolation");
  try {
    const otherRoot = path.join(ROOT, "isolation-other");
    mkdirSync(otherRoot, { recursive: true });
    const other = getOrCreateCanonicalProjectForLocalRootV01(isolation.db, {
      workspace_id: isolation.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(otherRoot, {
        base_path: ROOT,
      }),
      display_name: "Other",
    });
    assert.equal(
      readProjectWorkInitializationV01(isolation.db, {
        workspace_id: isolation.workspace_id,
        project_id: other.project.project_id,
      }).mutation_eligible,
      false,
    );
    const current = readActiveProjectSelectionV01(isolation.db, isolation.workspace_id)!;
    selectActiveProjectV01(isolation.db, {
      workspace_id: isolation.workspace_id,
      project_id: other.project.project_id,
      expected_project_id: isolation.project_id,
      expected_revision: current.selection_revision,
      now: T2,
    });
    const credential = authenticatedSessionV01(isolation, "inactive");
    assert.throws(
      () => defineInitialProjectWorkV01(isolation.db, {
        config: isolation.config,
        credential,
        request: requestV01(isolation),
        clock: fixedClock("2026-08-01T00:00:03.000Z"),
      }),
      errorCode("first_work_active_selection_conflict"),
    );
    assert.equal(
      readProjectWorkInitializationV01(isolation.db, {
        workspace_id: isolation.workspace_id,
        project_id: other.project.project_id,
      }).state,
      "not_defined",
    );
  } finally {
    isolation.db.close();
  }

  const genesisHistory = createFixtureV01("genesis-history");
  try {
    insertManagedRunV01(genesisHistory, {
      run_id: "run:genesis-history",
      scope: genesisHistory.project_id,
      metadata_json: "{}",
    });
    assert.throws(
      () =>
        defineInitialProjectWorkV01(genesisHistory.db, {
          config: genesisHistory.config,
          credential: authenticatedSessionV01(genesisHistory, "history"),
          request: requestV01(genesisHistory),
          clock: fixedClock(T2),
        }),
      errorCode("first_work_state_changed"),
    );
    assert.equal(
      listVNextCoreRecordsV01(genesisHistory.db, {
        workspace_id: genesisHistory.workspace_id,
        project_id: genesisHistory.project_id,
        record_kinds: ["task_context_packet"],
        limit: 1,
      }).length,
      0,
    );
  } finally {
    genesisHistory.db.close();
  }

  const recoveryHistory = createFixtureV01("recovery-genesis-history");
  try {
    defineInitialProjectWorkV01(recoveryHistory.db, {
      config: recoveryHistory.config,
      credential: authenticatedSessionV01(recoveryHistory, "recovery"),
      request: requestV01(recoveryHistory),
      clock: fixedClock(T2),
    });
    insertManagedRunV01(recoveryHistory, {
      run_id: "run:predated-genesis-history",
      scope: recoveryHistory.project_id,
      metadata_json: "{}",
      created_at: T1,
    });
    assert.equal(
      validateRecoveryCanonicalDatabaseV01(recoveryHistory.db).status,
      "invalid",
    );
  } finally {
    recoveryHistory.db.close();
  }
}

async function assertSeparateNativeHostStartV01(): Promise<void> {
  const fixture = createFixtureV01("native-host-start");
  try {
    const beforeFiles = readdirSync(fixture.root);
    const inserted = defineInitialProjectWorkV01(fixture.db, {
      config: fixture.config,
      credential: authenticatedSessionV01(fixture, "host"),
      request: requestV01(fixture, {
        goal: "Execute the explicitly saved first goal",
        success_criteria: ["The bounded host returns a structured result"],
        non_goals: ["Do not deploy"],
      }),
      clock: fixedClock(T2),
    });
    assert.equal(
      (fixture.db.prepare("SELECT COUNT(*) AS count FROM autonomy_runs").get() as { count: number }).count,
      0,
    );
    const projectHome = await readProjectHomeProjectionV01(
      fixture.db,
      fixture.config,
      {
        now: () => "2026-08-01T00:00:03.000Z",
        read_root_availability: async () => "available",
        read_capability_statuses: () => [],
        operator_config: fixture.config,
      },
    );
    assert.equal(projectHome.coordination.task_frame.goal, inserted.definition.goal);
    assert.deepEqual(
      projectHome.coordination.task_frame.success_criteria,
      inserted.definition.success_criteria,
    );
    const initialization = readProjectWorkInitializationV01(fixture.db, fixture.config);
    const guide = buildProjectGuideBriefV02({
      source: {
        route_mode: "canonical",
        requested_project_id: null,
        active_project_id: fixture.project_id,
        recent_projects: [],
        projection: projectHome,
        project_resolution: "resolved",
        direct_host_round_trip_available: true,
        delegated_work: null,
        work_initialization: initialization,
      },
      generated_at: "2026-08-01T00:00:03.000Z",
    });
    assert.equal(guide.coordinate.goal, inserted.definition.goal);
    const admission = await admitPersistedHostTaskContextPacketV01(fixture.db, {
      config: fixture.config,
      packet_id: inserted.packet.packet_id,
      packet_fingerprint: inserted.packet.integrity.fingerprint,
      evaluated_at: "2026-08-01T00:00:03.000Z",
    });
    assert.equal(admission.packet_lineage.lineage_kind, "initial_user_defined");
    const requests: NativeHostRequestV01[] = [];
    const times = timestampSequenceV01("2026-08-01T00:00:03.000Z");
    const result = await runDirectNativeHostRoundTripV01(
      fixture.db,
      {
        config: fixture.config,
        mode: "interactive",
        operator_mutation: {
          credential: credentialFromCookieV01(inserted.session_admission.cookie_value),
          clock: fixedClock("2026-08-01T00:00:03.000Z"),
        },
      },
      {
        now: times,
        on_invocation_admitted: (observed) => {
          requests.push(observed.request);
        },
      },
    );
    assert.equal(result.status, "inserted");
    assert.equal(requests.length, 1);
    const request = requests[0]!;
    assert("lineage_kind" in request.packet_lineage);
    assert.equal(request.packet_lineage.lineage_kind, "initial_user_defined");
    assert.equal("source_transition_receipt_ref" in request.packet_lineage, false);
    assert.deepEqual(Object.keys(request.packet_lineage).sort(), [
      "first_work_definition_ref",
      "first_work_request_ref",
      "lineage_kind",
      "operator_action_ref",
      "packet_source_refs",
      "selected_context_refs",
    ]);
    assert.equal(request.guide_brief, undefined);
    assert.equal(
      result.receipt.external_refs.some((ref) => ref.ref_type === "first_work_definition"),
      true,
    );
    assert.equal(result.transition_created, false);
    assert.equal(result.decision_created, false);
    assert.equal(result.semantic_state_changed, false);
    assert.equal(result.proposal.status, "available");
    assert.deepEqual(readdirSync(fixture.root), beforeFiles);
    const continuity = projectVNextOperatorPilotContinuityV01(fixture.db, {
      config: fixture.config,
      clock: fixedClock("2026-08-01T00:00:20.000Z"),
    });
    assert.equal(continuity.latest_compiled_packet?.lineage_kind, "initial_user_defined");
    const proposalRecord = listVNextCoreRecordsV01(fixture.db, {
      workspace_id: fixture.workspace_id,
      project_id: fixture.project_id,
      record_kinds: ["episode_delta_proposal"],
      limit: 1,
    })[0]!;
    const proposal = proposalRecord.payload as EpisodeDeltaProposalV01;
    readVNextOperatorPilotProposalDurableLineageV01(fixture.db, {
      config: fixture.config,
      proposal,
      clock: fixedClock("2026-08-01T00:00:20.000Z"),
    });
    readSharedProjectInspectorV01(fixture.db, {
      config: fixture.config,
      authenticated_session_id: "session:first-work-recovery",
      observed_at: "2026-08-01T00:00:20.000Z",
      target: {
        target_kind: "episode_delta_proposal",
        record_id: proposal.proposal_id,
        expected_fingerprint: proposal.integrity.fingerprint,
      },
    });
    const recovery = validateRecoveryCanonicalDatabaseV01(fixture.db);
    assert.equal(recovery.status, "valid", recovery.code);
  } finally {
    fixture.db.close();
  }
}

interface FixtureV01 {
  db: Database.Database;
  root: string;
  workspace_id: string;
  project_id: string;
  config: VNextLocalOperatorPilotConfigV01;
}

function insertManagedRunV01(
  fixture: FixtureV01,
  input: {
    run_id: string;
    scope: string;
    metadata_json: string;
    created_at?: string;
  },
): void {
  const createdAt = input.created_at ?? T1;
  fixture.db
    .prepare(
      `INSERT INTO autonomy_runs (
        run_id, scope, title, status, created_at, updated_at,
        source_refs_json, authority_boundary_json, budget_snapshot_json,
        metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, '[]', '{}', '{}', ?)`,
    )
    .run(
      input.run_id,
      input.scope,
      "Historical managed work",
      "completed",
      createdAt,
      createdAt,
      input.metadata_json,
    );
}

function createFixtureV01(name: string, git = false): FixtureV01 {
  const root = path.join(ROOT, name);
  mkdirSync(root, { recursive: true });
  if (git) mkdirSync(path.join(root, ".git"));
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(db);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
  const registration = getOrCreateCanonicalProjectForLocalRootV01(db, {
    workspace_id: workspace.workspace_id,
    local_root: normalizeLocalProjectRootRefV01(root, { base_path: ROOT }),
    display_name: `First work ${name}`,
  });
  selectActiveProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: registration.project.project_id,
    expected_project_id: null,
    expected_revision: null,
    now: T0,
  });
  return {
    db,
    root,
    workspace_id: workspace.workspace_id,
    project_id: registration.project.project_id,
    config: {
      enabled: true,
      workspace_id: workspace.workspace_id,
      project_id: registration.project.project_id,
      operator_id: `operator:first-work:${name}`,
      database_path: ":memory:",
    },
  };
}

function authenticatedSessionV01(
  fixture: FixtureV01,
  suffix: string,
): VNextLocalOperatorSessionCredentialV01 {
  const config = { ...fixture.config, operator_id: `${fixture.config.operator_id}:${suffix}` };
  fixture.config.operator_id = config.operator_id;
  const issue = issueVNextLocalOperatorBootstrapV01(fixture.db, {
    config,
    clock: fixedClock(T0),
  });
  return consumeVNextLocalOperatorBootstrapV01(fixture.db, {
    config,
    bootstrap_token: issue.bootstrap_token,
    clock: fixedClock(T1),
  }).credential;
}

function requestV01(
  fixture: FixtureV01,
  definition: Pick<
    DefineInitialProjectWorkRequestV01,
    "goal" | "success_criteria" | "non_goals"
  > = {
    goal: "Define one bounded first project goal",
    success_criteria: ["The exact result is verified"],
    non_goals: [],
  },
): DefineInitialProjectWorkRequestV01 {
  const selection = readActiveProjectSelectionV01(fixture.db, fixture.workspace_id)!;
  return {
    action: "define_initial_project_work",
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    expected_active_project_id: fixture.project_id,
    expected_active_selection_revision: selection.selection_revision,
    expected_initialization_state: "not_defined",
    ...definition,
  };
}

function insertHistoryRecordV01(
  fixture: FixtureV01,
  recordKind: VNextCoreRecordKindV01,
): void {
  const payload = { historical: recordKind, workspace_id: fixture.workspace_id, project_id: fixture.project_id };
  insertVNextCoreRecordV01(fixture.db, {
    record_kind: recordKind,
    record_id: `${recordKind}:historical`,
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(payload)),
    idempotency_key: null,
    payload,
    created_at: T1,
  });
}

function credentialFromCookieV01(value: string): VNextLocalOperatorSessionCredentialV01 {
  return readVNextLocalOperatorCredentialFromRequestV01(
    new Request("http://127.0.0.1/api/vnext/operator/project-continuity", {
      headers: { cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${value}` },
    }),
  );
}

function fixedClock(timestamp: string) {
  return { now: () => timestamp };
}

function timestampSequenceV01(start: string): () => string {
  let value = Date.parse(start);
  return () => {
    const next = new Date(value).toISOString();
    value += 100;
    return next;
  };
}

function errorCode(code: string): (error: unknown) => boolean {
  return (error) =>
    Boolean(error && typeof error === "object" && "code" in error && error.code === code);
}
