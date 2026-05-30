import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const routePath = path.join(
  rootDir,
  "app",
  "api",
  "ag-work-resume",
  "target-preview",
  "route.ts",
);
const preflightLibPath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-packet-preflight.ts",
);
const routeDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_TARGET_PREVIEW_ROUTE_V0_1.md",
);
const designDocPath = path.join(
  rootDir,
  "docs",
  "CROSS_LOCAL_AG_WORK_RESUME_DIRECT_CODE_V0_2.md",
);
const packagePath = path.join(rootDir, "package.json");

assert.ok(existsSync(routePath), "target preview route must exist");
assert.ok(existsSync(preflightLibPath), "pure packet preflight library must exist");
assert.ok(existsSync(routeDocsPath), "target preview route docs must exist");

const routeSource = readFileSync(routePath, "utf8");
assertNoForbiddenRouteCalls(routeSource);

const preflightLibSource = readFileSync(preflightLibPath, "utf8");
assertNoForbiddenPreflightCoreCalls(preflightLibSource);

const routeDocs = readFileSync(routeDocsPath, "utf8");
for (const pattern of [
  /read-only local route/i,
  /No DB\/schema changes/i,
  /No runtime discovery/i,
  /No persistence/i,
  /No import/i,
  /No work item creation/i,
  /No proof\/evidence recording/i,
  /No session binding/i,
  /No Direct Resume Code route/i,
  /No relay/i,
  /No Codex execution/i,
  /merge, auto-merge, or\s+committed-state mutation/i,
]) {
  assert.match(routeDocs, pattern, `route docs must mention ${pattern}`);
}

const designDoc = readFileSync(designDocPath, "utf8");
assert.match(
  designDoc,
  /read-only target preview route slice/i,
  "cross-local design doc should mention the read-only route slice",
);

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-target-preview-route"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-target-preview-route.mjs",
  "package.json must expose target preview route smoke through tsx",
);

const { buildAgWorkResumePacketPreview } = await import("../lib/ag-work-resume-packet.ts");
const { POST } = await import("../app/api/ag-work-resume/target-preview/route.ts");

const packet = buildAgWorkResumePacketPreview(buildFixtureInput());

const readyResult = await postJson({
  packet,
  local: buildReadyLocalContext(packet),
  strict: false,
});
assert.equal(readyResult.status, 200);
assert.equal(readyResult.json.ok, true);
assert.equal(readyResult.json.route, "ag_work_resume_target_preview.v0_1");
assert.equal(readyResult.json.strict, false);
assert.equal(readyResult.json.preflight.ran, true);
assert.equal(readyResult.json.preflight.ok, true);
assert.equal(readyResult.json.preflight.strict, true);
assert.equal(readyResult.json.preflight.status, "pass");
assert.deepEqual(readyResult.json.preflight.failures, []);
assert.equal(readyResult.json.preview.status, "ready_for_user_core_review");
assert.match(readyResult.json.recommended_next_step, /User\/Core/);
assert.doesNotMatch(readyResult.json.recommended_next_step, /execute Codex/i);

const needsMappingResult = await postJson({
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
assert.equal(needsMappingResult.status, 200);
assert.equal(needsMappingResult.json.ok, true);
assert.equal(needsMappingResult.json.preview.status, "needs_mapping");
assert.match(needsMappingResult.json.recommended_next_step, /User\/Core/);
assert.match(needsMappingResult.json.recommended_next_step, /do not auto-create/i);

const contextOnlyResult = await postJson({ packet, local: null });
assert.equal(contextOnlyResult.status, 200);
assert.equal(contextOnlyResult.json.ok, true);
assert.equal(contextOnlyResult.json.preview.status, "context_only");

const conflictResult = await postJson({
  packet,
  local: buildReadyLocalContext(packet, {
    repo: { remote: "https://github.com/example/not-augnes.git" },
  }),
});
assert.equal(conflictResult.status, 409);
assert.equal(conflictResult.json.ok, false);
assert.equal(conflictResult.json.preview.status, "conflict");

const blockedResult = await postJson({
  packet,
  local: buildReadyLocalContext(packet, {
    repo: {
      expected_files_present: [],
      expected_files_missing: ["docs/AG_WORK_RESUME_TARGET_PREVIEW_ROUTE_V0_1.md"],
    },
  }),
});
assert.equal(blockedResult.status, 422);
assert.equal(blockedResult.json.ok, false);
assert.equal(blockedResult.json.preview.status, "blocked");

const unsafePacket = cloneJson(packet);
unsafePacket.target_runtime_policy.may_execute_codex = true;
const preflightFailureResult = await postJson({
  packet: unsafePacket,
  local: buildReadyLocalContext(unsafePacket),
});
assert.equal(preflightFailureResult.status, 422);
assert.equal(preflightFailureResult.json.ok, false);
assert.equal(preflightFailureResult.json.preflight.ok, false);
assert.equal(preflightFailureResult.json.preflight.status, "fail");
assert.equal(preflightFailureResult.json.preview, null);
assert.doesNotMatch(
  preflightFailureResult.json.recommended_next_step,
  /execute Codex/i,
);

const skipPreflightResult = await postJson({
  packet,
  local: buildReadyLocalContext(packet),
  skip_preflight: true,
});
assert.equal(skipPreflightResult.status, 200);
assert.equal(skipPreflightResult.json.ok, true);
assert.equal(skipPreflightResult.json.preflight.ran, false);
assert.equal(skipPreflightResult.json.preflight.status, "skipped");
assert.ok(
  skipPreflightResult.json.preflight.warnings.includes(
    "Packet preflight was skipped; run ag:resume-preflight before relying on this target preview.",
  ),
);
assert.match(
  skipPreflightResult.json.recommended_next_step,
  /Run ag:resume-preflight before relying on this target preview\./,
);

const invalidJsonResult = await postRaw("{ invalid json");
assert.equal(invalidJsonResult.status, 400);
assert.equal(invalidJsonResult.json.ok, false);
assert.match(invalidJsonResult.json.error, /Invalid JSON/i);

const missingPacketResult = await postJson({ local: null });
assert.equal(missingPacketResult.status, 400);
assert.equal(missingPacketResult.json.ok, false);
assert.match(missingPacketResult.json.error, /packet object/i);

const wrongLocalShapeResult = await postJson({ packet, local: "not-local-context" });
assert.equal(wrongLocalShapeResult.status, 400);
assert.equal(wrongLocalShapeResult.json.ok, false);
assert.match(wrongLocalShapeResult.json.error, /Local B context/i);

const dirtyDefaultResult = await postJson({
  packet,
  local: buildReadyLocalContext(packet, {
    repo: { dirty_worktree: true },
  }),
});
assert.equal(dirtyDefaultResult.status, 200);
assert.equal(dirtyDefaultResult.json.ok, true);
assert.equal(dirtyDefaultResult.json.preview.status, "ready_for_user_core_review");
assert.ok(
  dirtyDefaultResult.json.preview.warnings.some(
    (warning) => warning.id === "repo_dirty_worktree",
  ),
);

const dirtyStrictResult = await postJson({
  packet,
  local: buildReadyLocalContext(packet, {
    repo: { dirty_worktree: true },
  }),
  strict: true,
});
assert.equal(dirtyStrictResult.status, 409);
assert.equal(dirtyStrictResult.json.ok, false);
assert.equal(dirtyStrictResult.json.strict, true);
assert.equal(dirtyStrictResult.json.preview.status, "conflict");

assert.deepEqual(
  readyResult.json.preview.packet_summary.foreign_refs.foreign_action_ref_ids,
  ["action:proof-only-1", "action:from-id-only"],
);
assert.deepEqual(
  readyResult.json.preview.packet_summary.foreign_refs.foreign_evidence_refs,
  ["evidence:foreign-public-safe"],
);
assert.deepEqual(
  readyResult.json.preview.packet_summary.foreign_refs.foreign_session_refs,
  ["session:foreign-public-safe"],
);
assert.equal(
  readyResult.json.preview.packet_summary.foreign_refs.local_proof_records_created,
  false,
);
assert.equal(
  readyResult.json.preview.packet_summary.foreign_refs.local_evidence_records_created,
  false,
);
assert.equal(
  readyResult.json.preview.packet_summary.foreign_refs.local_sessions_bound,
  false,
);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-target-preview-route",
      cases: [
        "route source guard forbids DB/runtime/network/shell/persistence calls",
        "pure preflight core guard forbids DB/fs/child_process/network/runtime helpers",
        "package script is present",
        "docs guard mentions read-only route and forbidden authority changes",
        "happy path returns 200 ready_for_user_core_review",
        "needs_mapping returns 200",
        "context_only returns 200",
        "conflict returns 409",
        "blocked returns 422",
        "preflight failure returns 422 with null preview",
        "skip_preflight returns skipped warning",
        "invalid JSON returns 400",
        "missing packet returns 400",
        "wrong local shape returns 400",
        "dirty worktree warns by default and conflicts in strict mode",
        "foreign refs remain foreign",
      ],
    },
    null,
    2,
  ),
);

async function postJson(body) {
  return postRaw(JSON.stringify(body));
}

async function postRaw(rawBody, headers = { "content-type": "application/json" }) {
  const response = await POST(
    new Request("http://localhost/api/ag-work-resume/target-preview", {
      method: "POST",
      headers,
      body: rawBody,
    }),
  );
  let json;
  try {
    json = await response.json();
  } catch (error) {
    assert.fail(
      `route did not return parseable JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  return { status: response.status, json };
}

function buildFixtureInput() {
  const workId = "AG-TARGET-ROUTE-001";
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
        title: "Build AG resume target preview route",
        status: "in_progress",
        priority: "now",
        summary: "Create a read-only local route over target preview.",
        next_action: "Run deterministic route smoke coverage.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_packet"],
        links: {
          docs: ["docs/AG_WORK_RESUME_TARGET_PREVIEW_ROUTE_V0_1.md"],
        },
        created_at: "2026-05-30T00:00:00.000Z",
        updated_at: "2026-05-30T00:00:00.000Z",
      },
      next_action: "Run deterministic route smoke coverage.",
      user_attention_required: false,
      recent_events: [
        {
          id: "work-event:target-route-1",
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Built target preview helper in a prior slice.",
          result_status: "completed",
          result_kind: "verification",
          related_action_id: "action:proof-only-1",
          related_pr: "https://github.com/hynk-studio/augnes/pull/283",
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
            title: "Proof-only route smoke",
            status: "completed",
            state_key: null,
            proof_marker_type: "proof_only",
            linked_work_event_ids: ["work-event:target-route-1"],
            created_at: "2026-05-30T00:01:00.000Z",
          },
        ],
        prs: ["https://github.com/hynk-studio/augnes/pull/283"],
        docs: ["docs/AG_WORK_RESUME_TARGET_PREVIEW_ROUTE_V0_1.md"],
        links: {},
        note: "Action records with state_key:null are proof-only.",
      },
      codex_handoff: {
        task_brief: "Build read-only AG resume target preview route.",
        constraints: ["Do not add runtime discovery."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-target-preview-route",
        ],
        work_event_template: {
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Summarize route result.",
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
          task_brief: "Build read-only AG resume target preview route.",
          constraints: ["Do not add direct Codex orchestration."],
          likely_files: [
            "app/api/ag-work-resume/target-preview/route.ts",
            "docs/AG_WORK_RESUME_TARGET_PREVIEW_ROUTE_V0_1.md",
            "scripts/smoke-ag-work-resume-target-preview-route.mjs",
          ],
          verification_commands: ["npm run typecheck", "git diff --check"],
        },
      },
    },
    handoffDraft: {
      handoff_id: "handoff:target-preview-route",
      status: "ready",
      expected_files: [
        "app/api/ag-work-resume/target-preview/route.ts",
        "docs/AG_WORK_RESUME_TARGET_PREVIEW_ROUTE_V0_1.md",
        "scripts/smoke-ag-work-resume-target-preview-route.mjs",
      ],
      expected_checks: ["npm run smoke:ag-work-resume-target-preview-route"],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["runtime discovery", "UI controls"],
      stop_conditions: ["User/Core mapping is missing."],
      safety_boundaries: ["Generated target route preview is read-only context."],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "a0ee4ba",
      working_branch: "codex/ag-resume-target-preview-route",
      head_commit: "abcdef1",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: "runtime-instance:target-route-smoke",
      source_local_label: "target-route-smoke-local-a",
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

function assertNoForbiddenRouteCalls(sourceText) {
  const forbiddenPatterns = [
    /from ["'][^"']*(?:db|database)[^"']*["']/i,
    /from ["']node:child_process["']/,
    /from ["']node:fs["']/,
    /from ["']fs["']/,
    /from ["']node:https?["']/,
    /from ["']node:net["']/,
    /from ["'][^"']*\/route(?:\.ts)?["']/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bopenDatabase\s*\(/,
    /\bbuildWorkBrief\s*\(/,
    /\bbuildStateBrief\s*\(/,
    /\bcreateHandoff\s*\(/,
    /\bspawn(?:Sync)?\s*\(/,
    /\bexec(?:File|Sync)?\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bappendFile(?:Sync)?\s*\(/,
    /\bmkdir(?:Sync)?\s*\(/,
    /\brm(?:Sync)?\s*\(/,
    /\bunlink(?:Sync)?\s*\(/,
    /\binsert[A-Z]\w*\s*\(/,
    /\bupdate[A-Z]\w*\s*\(/,
    /\bdelete[A-Z]\w*\s*\(/,
    /\bupsert[A-Z]\w*\s*\(/,
    /\bpersist[A-Z]\w*\s*\(/,
    /\brecord[A-Z]\w*\s*\(/,
    /\bbindSession\s*\(/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(sourceText, pattern, `route must stay read-only: ${pattern}`);
  }
}

function assertNoForbiddenPreflightCoreCalls(sourceText) {
  const forbiddenPatterns = [
    /^import\s+.*from\s+["'][^"']+["']/m,
    /from ["'][^"']*(?:db|database|runtime|work|state|handoff)[^"']*["']/i,
    /from ["']node:child_process["']/,
    /from ["']node:fs["']/,
    /from ["']fs["']/,
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
    /\bspawn(?:Sync)?\s*\(/,
    /\bexec(?:File|Sync)?\s*\(/,
    /\breadFile(?:Sync)?\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(
      sourceText,
      pattern,
      `pure preflight core must stay local and side-effect-free: ${pattern}`,
    );
  }
}
