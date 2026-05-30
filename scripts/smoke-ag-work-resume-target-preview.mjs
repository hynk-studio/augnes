import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const targetPreviewPath = path.join(rootDir, "lib", "ag-work-resume-target-preview.ts");
const builderPath = path.join(rootDir, "lib", "ag-work-resume-packet.ts");
const docsPath = path.join(rootDir, "docs", "AG_WORK_RESUME_TARGET_PREVIEW_V0_1.md");
const designDocPath = path.join(
  rootDir,
  "docs",
  "CROSS_LOCAL_AG_WORK_RESUME_DIRECT_CODE_V0_2.md",
);
const packagePath = path.join(rootDir, "package.json");
const preflightPath = path.join(__dirname, "ag-work-resume-packet-preflight.mjs");

assert.ok(existsSync(targetPreviewPath), "target preview module must exist");
assert.ok(existsSync(builderPath), "packet builder module must exist");
assert.ok(existsSync(docsPath), "target preview docs must exist");
assert.ok(existsSync(preflightPath), "packet preflight helper must exist");

const source = readFileSync(targetPreviewPath, "utf8");
assertNoForbiddenCheckerCalls(source);

const docs = readFileSync(docsPath, "utf8");
for (const pattern of [
  /no route/i,
  /no persistence/i,
  /no import/i,
  /no work item creation/i,
  /no proof\/evidence recording/i,
  /no Codex execution/i,
  /no approval, publish, retry, replay, external posting, merge, auto-merge, or\s+committed-state mutation/i,
]) {
  assert.match(docs, pattern, `target preview docs must mention ${pattern}`);
}

const designDoc = readFileSync(designDocPath, "utf8");
assert.match(
  designDoc,
  /Target Local B preview\/gap checker slice/i,
  "cross-local design doc should mention target preview/gap checker",
);

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-target-preview"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-target-preview.mjs",
  "package.json must expose target preview smoke through tsx",
);

const { buildAgWorkResumePacketPreview } = await import("../lib/ag-work-resume-packet.ts");
const { buildAgWorkResumeTargetPreview } = await import("../lib/ag-work-resume-target-preview.ts");

const packet = buildAgWorkResumePacketPreview(buildFixtureInput());
assertStrictPreflightPass(packet);

const readyPreview = buildAgWorkResumeTargetPreview({
  packet,
  local: buildReadyLocalContext(packet),
});
assert.equal(readyPreview.status, "ready_for_user_core_review");
assert.equal(readyPreview.ok_to_continue, true);
assertRecommendation(
  readyPreview,
  "User/Core must confirm the local mapping before any Codex start.",
);
assert.match(readyPreview.next_step, /User\/Core/i);
assert.equal(readyPreview.packet_summary.foreign_refs.local_proof_records_created, false);
assert.equal(readyPreview.packet_summary.foreign_refs.local_evidence_records_created, false);
assert.equal(readyPreview.packet_summary.foreign_refs.local_sessions_bound, false);

const noRuntimePreview = buildAgWorkResumeTargetPreview({
  packet,
  local: null,
});
assert.equal(noRuntimePreview.status, "context_only");
assert.equal(noRuntimePreview.ok_to_continue, false);
assert.match(findGap(noRuntimePreview, "local_runtime_context_missing").detail, /context only/i);
assert.match(findGap(noRuntimePreview, "local_runtime_context_missing").detail, /proof\/evidence/i);
assertRecommendation(
  noRuntimePreview,
  "Use packet as context only because local runtime context is missing.",
);

const missingMappingPreview = buildAgWorkResumeTargetPreview({
  packet,
  local: {
    runtime: {
      runtime_available: true,
      scope: packet.source_work.scope,
      work_item: null,
      work_brief_available: false,
      codex_read_brief_command_available: true,
    },
    repo: buildRepoContext(packet),
    known_local_work_mappings: [],
  },
});
assert.equal(missingMappingPreview.status, "needs_mapping");
assert.equal(missingMappingPreview.ok_to_continue, false);
assert.match(findGap(missingMappingPreview, "local_work_mapping_missing").detail, /Do not auto-create/i);
assertRecommendation(
  missingMappingPreview,
  "Do not create a local work item automatically from this packet.",
);

const conflictingWorkPreview = buildAgWorkResumeTargetPreview({
  packet,
  local: {
    runtime: buildRuntimeContext(packet, {
      work_item: {
        ...buildWorkItemFromPacket(packet),
        title: "Different local title",
        status: "blocked",
        next_action: "Investigate local conflict.",
      },
    }),
    repo: buildRepoContext(packet),
    known_local_work_mappings: [],
  },
});
assert.equal(conflictingWorkPreview.status, "conflict");
assert.equal(conflictingWorkPreview.ok_to_continue, false);
assert.deepEqual(
  findConflict(conflictingWorkPreview, "local_work_identity_conflict").fields,
  ["title", "status", "next_action"],
);

const mappedWorkItem = {
  ...buildWorkItemFromPacket(packet),
  work_id: "AG-LOCAL-777",
};
const mappedPreview = buildAgWorkResumeTargetPreview({
  packet,
  local: {
    runtime: buildRuntimeContext(packet, { work_item: mappedWorkItem }),
    repo: buildRepoContext(packet),
    known_local_work_mappings: [
      {
        foreign_scope: packet.source_work.scope,
        foreign_work_id: packet.source_work.work_id,
        local_scope: packet.source_work.scope,
        local_work_id: "AG-LOCAL-777",
        mapping_status: "confirmed",
        confirmed_by: "user-core-smoke",
      },
    ],
  },
});
assert.equal(mappedPreview.status, "ready_for_user_core_review");
assert.equal(mappedPreview.ok_to_continue, true);
assert.equal(mappedPreview.conflicts.length, 0);
assert.equal(mappedPreview.local_context_summary.mapping.local_work_id, "AG-LOCAL-777");
assert.match(mappedPreview.next_step, /User\/Core/i);

const remoteMismatchPreview = buildAgWorkResumeTargetPreview({
  packet,
  local: buildReadyLocalContext(packet, {
    repo: { remote: "https://github.com/example/other.git" },
  }),
});
assert.equal(remoteMismatchPreview.status, "conflict");
assert.equal(remoteMismatchPreview.ok_to_continue, false);
assert.match(findConflict(remoteMismatchPreview, "repo_remote_mismatch").detail, /packet\.git\.remote/);

const unreachableBasePreview = buildAgWorkResumeTargetPreview({
  packet,
  local: buildReadyLocalContext(packet, {
    repo: { base_commit_reachable: false },
  }),
});
assert.equal(unreachableBasePreview.status, "blocked");
assert.equal(unreachableBasePreview.ok_to_continue, false);
assert.match(findGap(unreachableBasePreview, "repo_base_commit_unreachable").detail, /base_commit/);

const dirtyDefaultPreview = buildAgWorkResumeTargetPreview({
  packet,
  local: buildReadyLocalContext(packet, {
    repo: { dirty_worktree: true },
  }),
});
assert.equal(dirtyDefaultPreview.status, "ready_for_user_core_review");
assert.equal(dirtyDefaultPreview.ok_to_continue, true);
assert.match(findWarning(dirtyDefaultPreview, "repo_dirty_worktree").detail, /dirty/i);

const dirtyStrictPreview = buildAgWorkResumeTargetPreview({
  packet,
  strict: true,
  local: buildReadyLocalContext(packet, {
    repo: { dirty_worktree: true },
  }),
});
assert.equal(dirtyStrictPreview.status, "conflict");
assert.equal(dirtyStrictPreview.ok_to_continue, false);
assert.match(findConflict(dirtyStrictPreview, "repo_dirty_worktree").detail, /Strict mode/i);

const missingFilesPreview = buildAgWorkResumeTargetPreview({
  packet,
  local: buildReadyLocalContext(packet, {
    repo: {
      expected_files_present: [],
      expected_files_missing: [
        "docs/AG_WORK_RESUME_TARGET_PREVIEW_V0_1.md",
        "lib/ag-work-resume-target-preview.ts",
      ],
    },
  }),
});
assert.equal(missingFilesPreview.status, "blocked");
assert.equal(missingFilesPreview.ok_to_continue, false);
assert.deepEqual(findGap(missingFilesPreview, "expected_files_missing").refs, [
  "docs/AG_WORK_RESUME_TARGET_PREVIEW_V0_1.md",
  "lib/ag-work-resume-target-preview.ts",
]);

const unsafePolicyPacket = cloneJson(packet);
unsafePolicyPacket.target_runtime_policy.may_execute_codex = true;
const unsafePolicyPreview = buildAgWorkResumeTargetPreview({
  packet: unsafePolicyPacket,
  local: buildReadyLocalContext(unsafePolicyPacket),
});
assert.equal(unsafePolicyPreview.status, "blocked");
assert.equal(unsafePolicyPreview.ok_to_continue, false);
assert.deepEqual(
  findConflict(unsafePolicyPreview, "unsafe_target_runtime_policy").fields,
  ["may_execute_codex"],
);

assert.deepEqual(readyPreview.packet_summary.foreign_refs.foreign_action_ref_ids, [
  "action:proof-only-1",
  "action:from-id-only",
]);
assert.deepEqual(readyPreview.packet_summary.foreign_refs.foreign_evidence_refs, [
  "evidence:foreign-public-safe",
]);
assert.deepEqual(readyPreview.packet_summary.foreign_refs.foreign_session_refs, [
  "session:foreign-public-safe",
]);
assert.equal(
  readyPreview.packet_summary.foreign_refs.foreign_evidence_pack_ref,
  "evidence-pack:foreign-public-safe",
);
assert.match(readyPreview.packet_summary.foreign_refs.note, /remain foreign/i);

const authorityText = JSON.stringify(readyPreview.authority_boundary);
for (const pattern of [
  /read-only/i,
  /does not import or persist/i,
  /does not record proof or evidence/i,
  /does not bind sessions/i,
  /does not execute Codex/i,
  /publish, retry, replay/i,
  /merge, auto-merge, or mutate committed state/i,
]) {
  assert.match(authorityText, pattern, `authority boundary must mention ${pattern}`);
}

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-target-preview",
      cases: [
        "checker module exists and avoids runtime/network/fs/shell/git calls",
        "docs mention no route/no persistence/no import/no work item creation/no proof/evidence/no Codex execution/no merge/state mutation",
        "package script is present",
        "happy-path packet passes strict preflight before target preview",
        "complete happy path is ready_for_user_core_review",
        "no local runtime is context_only",
        "runtime without local work item/mapping needs_mapping",
        "conflicting same-id local work item reports field conflicts",
        "confirmed mapping to different local work id is accepted",
        "repo remote mismatch conflicts",
        "base commit unreachable blocks",
        "dirty worktree warns by default and conflicts in strict mode",
        "missing expected files block",
        "unsafe target policy blocks",
        "foreign action/evidence/session refs remain foreign",
        "authority boundary is explicit",
      ],
    },
    null,
    2,
  ),
);

function buildFixtureInput() {
  const workId = "AG-TARGET-001";
  const scope = "project:augnes";
  return {
    workBrief: {
      runtime: "augnes",
      scope,
      work_id: workId,
      as_of: "2026-05-30T00:00:00.000Z",
      framing: {
        work_id: "Trace anchor only.",
        state_authority: "Augnes committed state remains authority.",
        execution_proof: "Action records remain proof.",
        temporal_proof: "Temporal graph remains proof over time.",
      },
      work: {
        work_id: workId,
        scope,
        title: "Build AG resume target preview",
        status: "in_progress",
        priority: "now",
        summary: "Create a pure Local B target preview and gap checker.",
        next_action: "Inspect target preview gaps before implementation.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_packet"],
        links: {
          docs: ["docs/AG_WORK_RESUME_TARGET_PREVIEW_V0_1.md"],
        },
        created_at: "2026-05-30T00:00:00.000Z",
        updated_at: "2026-05-30T00:00:00.000Z",
      },
      next_action: "Inspect target preview gaps before implementation.",
      user_attention_required: false,
      recent_events: [
        {
          id: "work-event:target-1",
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Built packet builder preview in a prior slice.",
          result_status: "completed",
          result_kind: "verification",
          related_action_id: "action:proof-only-1",
          related_pr: "https://github.com/hynk-studio/augnes/pull/281",
          related_state_keys: ["coordination.ag_resume_packet"],
          created_at: "2026-05-30T00:01:00.000Z",
        },
      ],
      related_state_keys: ["coordination.ag_resume_packet"],
      related_proof: {
        action_ids: ["action:proof-only-1", "action:from-id-only"],
        action_records: [
          {
            id: "action:proof-only-1",
            title: "Proof-only builder smoke",
            status: "completed",
            state_key: null,
            proof_marker_type: "proof_only",
            linked_work_event_ids: ["work-event:target-1"],
            created_at: "2026-05-30T00:01:00.000Z",
          },
        ],
        prs: ["https://github.com/hynk-studio/augnes/pull/281"],
        docs: ["docs/AG_WORK_RESUME_TARGET_PREVIEW_V0_1.md"],
        links: {},
        note: "Action records with state_key:null are proof-only.",
      },
      codex_handoff: {
        task_brief: "Build pure AG resume target preview.",
        constraints: ["Do not add runtime routes."],
        suggested_verification: ["npm run smoke:ag-work-resume-target-preview"],
        work_event_template: {
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Summarize target preview result.",
          related_action_id: null,
          related_pr: null,
          related_state_keys: ["coordination.ag_resume_packet"],
        },
      },
    },
    stateBrief: {
      runtime: "augnes",
      scope,
      as_of: "2026-05-30T00:00:00.000Z",
      generated_at: "2026-05-30T00:00:00.000Z",
      agent_instructions: ["Treat committed state as source of truth."],
      agent_handoff: {
        current_status: {
          notable_state_keys: ["coordination.ag_resume_packet"],
        },
        next_recommended_action: {
          related_state_keys: ["coordination.ag_resume_packet"],
        },
        codex_handoff: {
          task_brief: "Build pure AG resume target preview.",
          constraints: ["Do not add direct Codex orchestration."],
          likely_files: [
            "lib/ag-work-resume-target-preview.ts",
            "docs/AG_WORK_RESUME_TARGET_PREVIEW_V0_1.md",
            "scripts/smoke-ag-work-resume-target-preview.mjs",
          ],
          verification_commands: ["npm run typecheck", "git diff --check"],
        },
      },
    },
    handoffDraft: {
      handoff_id: "handoff:target-preview",
      status: "ready",
      expected_files: [
        "lib/ag-work-resume-target-preview.ts",
        "docs/AG_WORK_RESUME_TARGET_PREVIEW_V0_1.md",
        "scripts/smoke-ag-work-resume-target-preview.mjs",
      ],
      expected_checks: ["npm run smoke:ag-work-resume-target-preview"],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["runtime routes", "UI controls"],
      stop_conditions: ["User/Core mapping is missing."],
      safety_boundaries: ["Generated target preview is read-only context."],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "043ec93",
      working_branch: "codex/ag-resume-target-preview",
      head_commit: "abcdef1",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: "runtime-instance:target-smoke",
      source_local_label: "target-smoke-local-a",
      created_by_surface: "codex-smoke",
      export_event_id: null,
    },
    foreign_evidence_refs: ["evidence:foreign-public-safe"],
    foreign_session_refs: ["session:foreign-public-safe"],
    foreign_evidence_pack_ref: "evidence-pack:foreign-public-safe",
  };
}

function buildReadyLocalContext(packet, overrides = {}) {
  const runtime = {
    ...buildRuntimeContext(packet),
    ...(overrides.runtime ?? {}),
  };
  const repo = {
    ...buildRepoContext(packet),
    ...(overrides.repo ?? {}),
  };
  return {
    runtime,
    repo,
    known_local_work_mappings:
      overrides.known_local_work_mappings ??
      [
        {
          foreign_scope: packet.source_work.scope,
          foreign_work_id: packet.source_work.work_id,
          local_scope: packet.source_work.scope,
          local_work_id: packet.source_work.work_id,
          mapping_status: "confirmed",
          confirmed_by: "user-core-smoke",
        },
      ],
  };
}

function buildRuntimeContext(packet, overrides = {}) {
  return {
    runtime_available: true,
    scope: packet.source_work.scope,
    work_item: buildWorkItemFromPacket(packet),
    work_brief_available: true,
    codex_read_brief_command_available: true,
    evidence_recording_authorized: false,
    proof_recording_authorized: false,
    session_binding_authorized: false,
    ...overrides,
  };
}

function buildRepoContext(packet, overrides = {}) {
  return {
    repo_available: true,
    remote: packet.git.remote,
    base_branch: packet.git.base_branch,
    base_commit_reachable: true,
    current_branch: packet.git.working_branch,
    head_commit: packet.git.head_commit,
    dirty_worktree: false,
    expected_files_present: [...packet.handoff.expected_files],
    expected_files_missing: [],
    ...overrides,
  };
}

function buildWorkItemFromPacket(packet) {
  return {
    work_id: packet.source_work.work_id,
    scope: packet.source_work.scope,
    title: packet.source_work.title,
    status: packet.source_work.status,
    next_action: packet.source_work.next_action,
    related_state_keys: [...packet.source_work.related_state_keys],
  };
}

function assertStrictPreflightPass(packet) {
  const result = spawnSync(
    process.execPath,
    [preflightPath, "--strict"],
    {
      env: { ...process.env, AG_WORK_RESUME_PACKET: JSON.stringify(packet) },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.ok, true);
}

function assertRecommendation(preview, expectedText) {
  assert.ok(
    preview.recommendations.some((recommendation) => recommendation.text === expectedText),
    `missing recommendation: ${expectedText}`,
  );
}

function findGap(preview, id) {
  const gap = preview.gaps.find((entry) => entry.id === id);
  assert.ok(gap, `missing gap ${id}`);
  return gap;
}

function findWarning(preview, id) {
  const warning = preview.warnings.find((entry) => entry.id === id);
  assert.ok(warning, `missing warning ${id}`);
  return warning;
}

function findConflict(preview, id) {
  const conflict = preview.conflicts.find((entry) => entry.id === id);
  assert.ok(conflict, `missing conflict ${id}`);
  return conflict;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoForbiddenCheckerCalls(sourceText) {
  const forbiddenPatterns = [
    /from ["']node:fs["']/,
    /from ["']node:child_process["']/,
    /from ["']node:https?["']/,
    /from ["']node:net["']/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bexec(?:File|Sync)?\s*\(/,
    /\bspawn(?:Sync)?\s*\(/,
    /\breadFile(?:Sync)?\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bopenDatabase\s*\(/,
    /\bbuildWorkBrief\s*\(/,
    /\bbuildStateBrief\s*\(/,
    /\/api\//,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(sourceText, pattern, `checker must stay pure: ${pattern}`);
  }
}
