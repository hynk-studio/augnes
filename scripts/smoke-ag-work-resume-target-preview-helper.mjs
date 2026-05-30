import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const helperPath = path.join(__dirname, "ag-work-resume-target-preview.mjs");
const smokePath = path.join(__dirname, "smoke-ag-work-resume-target-preview-helper.mjs");
const helperDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_TARGET_PREVIEW_HELPER_V0_1.md",
);
const designDocPath = path.join(
  rootDir,
  "docs",
  "CROSS_LOCAL_AG_WORK_RESUME_DIRECT_CODE_V0_2.md",
);
const packagePath = path.join(rootDir, "package.json");
const tsxPath = path.join(rootDir, "apps", "augnes_apps", "node_modules", ".bin", "tsx");

assert.ok(existsSync(helperPath), "target preview helper must exist");
assert.ok(existsSync(helperDocsPath), "target preview helper docs must exist");
assert.ok(existsSync(tsxPath), "tsx runtime must exist for helper smoke");

const helperSource = readFileSync(helperPath, "utf8");
assertNoForbiddenHelperCalls(helperSource);

const helperDocs = readFileSync(helperDocsPath, "utf8");
for (const pattern of [
  /local helper is read-only/i,
  /No route/i,
  /No persistence/i,
  /No import/i,
  /No work item creation/i,
  /No proof\/evidence recording/i,
  /No session binding/i,
  /No Direct Resume Code route/i,
  /No relay/i,
  /No Codex execution/i,
  /No approval, publish, retry, replay, external posting, merge, auto-merge, or\s+committed-state mutation/i,
]) {
  assert.match(helperDocs, pattern, `helper docs must mention ${pattern}`);
}

const designDoc = readFileSync(designDocPath, "utf8");
assert.match(
  designDoc,
  /local target preview helper slice/i,
  "cross-local design doc should mention local target preview helper",
);

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
assert.equal(
  packageJson.scripts?.["ag:resume-target-preview"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-target-preview.mjs",
  "package.json must expose ag:resume-target-preview",
);
assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-target-preview-helper"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-target-preview-helper.mjs",
  "package.json must expose target preview helper smoke",
);

const { buildAgWorkResumePacketPreview } = await import("../lib/ag-work-resume-packet.ts");

const packet = buildAgWorkResumePacketPreview(buildFixtureInput());
const readyLocal = buildReadyLocalContext(packet);
const combinedInput = { packet, local: readyLocal, strict: false };

const envResult = runHelper({
  env: { AG_WORK_RESUME_TARGET_PREVIEW_INPUT: JSON.stringify(combinedInput) },
});
assert.equal(envResult.status, 0, envResult.stderr);
assert.equal(envResult.json.ok, true);
assert.equal(envResult.json.input_mode, "env");
assert.equal(envResult.json.preflight.ran, true);
assert.equal(envResult.json.preflight.ok, true);
assert.equal(envResult.json.preview.status, "ready_for_user_core_review");
assert.match(envResult.json.recommended_next_step, /User\/Core/);
assert.doesNotMatch(envResult.json.recommended_next_step, /execute Codex/i);
assert.equal(
  envResult.json.preview.packet_summary.foreign_refs.local_proof_records_created,
  false,
);
assert.equal(
  envResult.json.preview.packet_summary.foreign_refs.local_evidence_records_created,
  false,
);
assert.equal(
  envResult.json.preview.packet_summary.foreign_refs.local_sessions_bound,
  false,
);

const tempDir = mkdtempSync(path.join(tmpdir(), "ag-target-preview-helper-"));
try {
  const combinedPath = path.join(tempDir, "combined.json");
  const packetPath = path.join(tempDir, "packet.json");
  const localPath = path.join(tempDir, "local-context.json");
  writeFileSync(combinedPath, JSON.stringify(combinedInput), "utf8");
  writeFileSync(packetPath, JSON.stringify(packet), "utf8");
  writeFileSync(localPath, JSON.stringify(readyLocal), "utf8");

  const fileResult = runHelper({ args: ["--file", combinedPath] });
  assert.equal(fileResult.status, 0, fileResult.stderr);
  assert.equal(fileResult.json.ok, true);
  assert.equal(fileResult.json.input_mode, "file");
  assert.equal(fileResult.json.preview.status, "ready_for_user_core_review");

  const separateFilesResult = runHelper({
    args: ["--packet-file", packetPath, "--local-context-file", localPath],
  });
  assert.equal(separateFilesResult.status, 0, separateFilesResult.stderr);
  assert.equal(separateFilesResult.json.ok, true);
  assert.equal(separateFilesResult.json.input_mode, "separate-files");
  assert.equal(separateFilesResult.json.preview.status, "ready_for_user_core_review");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

const stdinResult = runHelper({ input: JSON.stringify(combinedInput) });
assert.equal(stdinResult.status, 0, stdinResult.stderr);
assert.equal(stdinResult.json.ok, true);
assert.equal(stdinResult.json.input_mode, "stdin");
assert.equal(stdinResult.json.preview.status, "ready_for_user_core_review");

const missingMappingResult = runHelper({
  env: {
    AG_WORK_RESUME_TARGET_PREVIEW_INPUT: JSON.stringify({
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
    }),
  },
});
assert.equal(missingMappingResult.status, 0, missingMappingResult.stderr);
assert.equal(missingMappingResult.json.ok, true);
assert.equal(missingMappingResult.json.preview.status, "needs_mapping");
assert.match(missingMappingResult.json.recommended_next_step, /User\/Core/);
assert.match(missingMappingResult.json.recommended_next_step, /do not auto-create/i);

const contextOnlyResult = runHelper({
  env: {
    AG_WORK_RESUME_TARGET_PREVIEW_INPUT: JSON.stringify({ packet, local: null }),
  },
});
assert.equal(contextOnlyResult.status, 0, contextOnlyResult.stderr);
assert.equal(contextOnlyResult.json.ok, true);
assert.equal(contextOnlyResult.json.preview.status, "context_only");

const conflictResult = runHelper({
  env: {
    AG_WORK_RESUME_TARGET_PREVIEW_INPUT: JSON.stringify({
      packet,
      local: buildReadyLocalContext(packet, {
        repo: { remote: "https://github.com/example/not-augnes.git" },
      }),
    }),
  },
});
assert.notEqual(conflictResult.status, 0);
assert.equal(conflictResult.json.ok, false);
assert.equal(conflictResult.json.preview.status, "conflict");

const blockedResult = runHelper({
  env: {
    AG_WORK_RESUME_TARGET_PREVIEW_INPUT: JSON.stringify({
      packet,
      local: buildReadyLocalContext(packet, {
        repo: {
          expected_files_present: [],
          expected_files_missing: ["docs/AG_WORK_RESUME_TARGET_PREVIEW_HELPER_V0_1.md"],
        },
      }),
    }),
  },
});
assert.notEqual(blockedResult.status, 0);
assert.equal(blockedResult.json.ok, false);
assert.equal(blockedResult.json.preview.status, "blocked");

const unsafePacket = cloneJson(packet);
unsafePacket.target_runtime_policy.may_execute_codex = true;
const preflightFailureResult = runHelper({
  env: {
    AG_WORK_RESUME_TARGET_PREVIEW_INPUT: JSON.stringify({
      packet: unsafePacket,
      local: buildReadyLocalContext(unsafePacket),
    }),
  },
});
assert.notEqual(preflightFailureResult.status, 0);
assert.equal(preflightFailureResult.json.ok, false);
assert.equal(preflightFailureResult.json.preflight.ok, false);
assert.equal(preflightFailureResult.json.preflight.status, "fail");
assert.equal(preflightFailureResult.json.preview, null);
assert.doesNotMatch(
  preflightFailureResult.json.recommended_next_step,
  /execute Codex/i,
);

const skipPreflightResult = runHelper({
  args: ["--skip-preflight"],
  env: {
    AG_WORK_RESUME_TARGET_PREVIEW_INPUT: JSON.stringify(combinedInput),
  },
});
assert.equal(skipPreflightResult.status, 0, skipPreflightResult.stderr);
assert.equal(skipPreflightResult.json.ok, true);
assert.equal(skipPreflightResult.json.preflight.ran, false);
assert.equal(skipPreflightResult.json.preflight.status, "skipped");
assert.match(skipPreflightResult.json.recommended_next_step, /Run ag:resume-preflight/);

const invalidJsonResult = runHelper({
  env: { AG_WORK_RESUME_TARGET_PREVIEW_INPUT: "{ invalid json" },
});
assert.notEqual(invalidJsonResult.status, 0);
assert.equal(invalidJsonResult.json.ok, false);
assert.match(invalidJsonResult.json.error, /invalid/i);

const dirtyDefaultResult = runHelper({
  env: {
    AG_WORK_RESUME_TARGET_PREVIEW_INPUT: JSON.stringify({
      packet,
      local: buildReadyLocalContext(packet, {
        repo: { dirty_worktree: true },
      }),
    }),
  },
});
assert.equal(dirtyDefaultResult.status, 0, dirtyDefaultResult.stderr);
assert.equal(dirtyDefaultResult.json.ok, true);
assert.equal(dirtyDefaultResult.json.preview.status, "ready_for_user_core_review");
assert.ok(
  dirtyDefaultResult.json.preview.warnings.some(
    (warning) => warning.id === "repo_dirty_worktree",
  ),
);

const dirtyStrictResult = runHelper({
  args: ["--strict"],
  env: {
    AG_WORK_RESUME_TARGET_PREVIEW_INPUT: JSON.stringify({
      packet,
      local: buildReadyLocalContext(packet, {
        repo: { dirty_worktree: true },
      }),
    }),
  },
});
assert.notEqual(dirtyStrictResult.status, 0);
assert.equal(dirtyStrictResult.json.ok, false);
assert.equal(dirtyStrictResult.json.strict, true);
assert.equal(dirtyStrictResult.json.preview.status, "conflict");

assert.deepEqual(envResult.json.preview.packet_summary.foreign_refs.foreign_action_ref_ids, [
  "action:proof-only-1",
  "action:from-id-only",
]);
assert.deepEqual(envResult.json.preview.packet_summary.foreign_refs.foreign_evidence_refs, [
  "evidence:foreign-public-safe",
]);
assert.deepEqual(envResult.json.preview.packet_summary.foreign_refs.foreign_session_refs, [
  "session:foreign-public-safe",
]);
assert.equal(envResult.json.preview.packet_summary.foreign_refs.local_proof_records_created, false);
assert.equal(envResult.json.preview.packet_summary.foreign_refs.local_evidence_records_created, false);
assert.equal(envResult.json.preview.packet_summary.foreign_refs.local_sessions_bound, false);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-target-preview-helper",
      cases: [
        "helper source guard passes with preflight-only spawnSync",
        "package scripts are present",
        "docs guard mentions read-only and forbidden authority changes",
        "combined env input returns ready_for_user_core_review",
        "combined --file input returns ready_for_user_core_review",
        "separate packet/context files return ready_for_user_core_review",
        "stdin input returns ready_for_user_core_review",
        "missing mapping exits zero with needs_mapping",
        "context-only exits zero",
        "conflict exits non-zero",
        "blocked exits non-zero",
        "preflight failure exits non-zero before preview reliance",
        "--skip-preflight emits skipped warning",
        "invalid JSON exits non-zero with parse failure",
        "dirty worktree warns by default and conflicts in strict mode",
        "foreign refs remain foreign",
      ],
    },
    null,
    2,
  ),
);

function runHelper({ args = [], env = {}, input = null } = {}) {
  const result = spawnSync(
    tsxPath,
    ["--tsconfig", "tsconfig.json", helperPath, ...args],
    {
      cwd: rootDir,
      env: { ...process.env, ...env },
      input,
      encoding: "utf8",
    },
  );
  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch (error) {
    assert.fail(
      `helper did not print parseable JSON: ${error instanceof Error ? error.message : String(error)}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
  return { ...result, json };
}

function buildFixtureInput() {
  const workId = "AG-TARGET-HELPER-001";
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
        title: "Build AG resume target preview helper",
        status: "in_progress",
        priority: "now",
        summary: "Create a local read-only helper over target preview.",
        next_action: "Run deterministic helper smoke coverage.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_packet"],
        links: {
          docs: ["docs/AG_WORK_RESUME_TARGET_PREVIEW_HELPER_V0_1.md"],
        },
        created_at: "2026-05-30T00:00:00.000Z",
        updated_at: "2026-05-30T00:00:00.000Z",
      },
      next_action: "Run deterministic helper smoke coverage.",
      user_attention_required: false,
      recent_events: [
        {
          id: "work-event:target-helper-1",
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Built target preview checker in a prior slice.",
          result_status: "completed",
          result_kind: "verification",
          related_action_id: "action:proof-only-1",
          related_pr: "https://github.com/hynk-studio/augnes/pull/282",
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
            title: "Proof-only target preview smoke",
            status: "completed",
            state_key: null,
            proof_marker_type: "proof_only",
            linked_work_event_ids: ["work-event:target-helper-1"],
            created_at: "2026-05-30T00:01:00.000Z",
          },
        ],
        prs: ["https://github.com/hynk-studio/augnes/pull/282"],
        docs: ["docs/AG_WORK_RESUME_TARGET_PREVIEW_HELPER_V0_1.md"],
        links: {},
        note: "Action records with state_key:null are proof-only.",
      },
      codex_handoff: {
        task_brief: "Build local read-only AG resume target preview helper.",
        constraints: ["Do not add runtime routes."],
        suggested_verification: ["npm run smoke:ag-work-resume-target-preview-helper"],
        work_event_template: {
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Summarize helper result.",
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
          task_brief: "Build local read-only AG resume target preview helper.",
          constraints: ["Do not add direct Codex orchestration."],
          likely_files: [
            "scripts/ag-work-resume-target-preview.mjs",
            "docs/AG_WORK_RESUME_TARGET_PREVIEW_HELPER_V0_1.md",
            "scripts/smoke-ag-work-resume-target-preview-helper.mjs",
          ],
          verification_commands: ["npm run typecheck", "git diff --check"],
        },
      },
    },
    handoffDraft: {
      handoff_id: "handoff:target-preview-helper",
      status: "ready",
      expected_files: [
        "scripts/ag-work-resume-target-preview.mjs",
        "docs/AG_WORK_RESUME_TARGET_PREVIEW_HELPER_V0_1.md",
        "scripts/smoke-ag-work-resume-target-preview-helper.mjs",
      ],
      expected_checks: ["npm run smoke:ag-work-resume-target-preview-helper"],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["runtime routes", "UI controls"],
      stop_conditions: ["User/Core mapping is missing."],
      safety_boundaries: ["Generated target helper preview is read-only context."],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "730c86e",
      working_branch: "codex/ag-resume-target-preview-helper",
      head_commit: "abcdef1",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: "runtime-instance:target-helper-smoke",
      source_local_label: "target-helper-smoke-local-a",
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

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoForbiddenHelperCalls(sourceText) {
  const forbiddenPatterns = [
    /from ["']node:https?["']/,
    /from ["']node:net["']/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bopenDatabase\s*\(/,
    /\bbuildWorkBrief\s*\(/,
    /\bbuildStateBrief\s*\(/,
    /\bcreateHandoff\s*\(/,
    /\bexecSync\s*\(/,
    /\bexecFileSync\s*\(/,
    /\bexec\s*\(/,
    /\bshell\s*:\s*true\b/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(sourceText, pattern, `helper must stay local/read-only: ${pattern}`);
  }
  assert.match(
    sourceText,
    /spawnSync\(process\.execPath,\s*\[preflightPath,\s*"--strict"\]/,
    "helper may use spawnSync only for the local preflight helper",
  );
}
