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
  "mapping-proposal-preview",
  "route.ts",
);
const routeDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_ROUTE_V0_1.md",
);
const proposalDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_V0_1.md",
);
const gateDocPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");

assert.ok(existsSync(routePath), "mapping proposal preview route must exist");
assert.ok(existsSync(routeDocsPath), "mapping proposal preview route docs must exist");
assert.ok(existsSync(proposalDocsPath), "mapping proposal preview docs must exist");
assert.ok(existsSync(gateDocPath), "mapping/import authority gate docs must exist");

const routeSource = readFileSync(routePath, "utf8");
assertNoForbiddenRouteCalls(routeSource);

const routeDocs = readFileSync(routeDocsPath, "utf8");
for (const pattern of [
  /read-only route/i,
  /Proposal-only/i,
  /No DB\/schema/i,
  /No runtime discovery/i,
  /No persistence/i,
  /No import/i,
  /No mapping record creation/i,
  /No import record creation/i,
  /No work item creation/i,
  /No proof\/evidence recording/i,
  /No session binding/i,
  /No Direct Resume Code route/i,
  /No relay/i,
  /No Codex execution/i,
  /No approval, publish, retry, replay, external posting, merge, auto-merge, or\s+committed-state mutation/i,
  /packet preflight[\s\S]*should already have run/i,
]) {
  assert.match(routeDocs, pattern, `route docs must mention ${pattern}`);
}

const proposalDocs = readFileSync(proposalDocsPath, "utf8");
assert.match(
  proposalDocs,
  /mapping-proposal-preview/i,
  "mapping proposal docs should mention the read-only route",
);

const gateDoc = readFileSync(gateDocPath, "utf8");
assert.match(
  gateDoc,
  /read-only route for this Stage A mapping proposal preview only/i,
  "authority gate docs must mention the Stage A read-only route",
);

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-mapping-proposal-preview-route"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-mapping-proposal-preview-route.mjs",
  "package.json must expose mapping proposal preview route smoke",
);
assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-mapping-proposal-preview-helper"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-mapping-proposal-preview-helper.mjs",
  "package.json must keep mapping proposal helper smoke",
);
assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-mapping-proposal-preview"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-mapping-proposal-preview.mjs",
  "package.json must keep pure mapping proposal preview smoke",
);

const { buildAgWorkResumePacketPreview } = await import("../lib/ag-work-resume-packet.ts");
const { POST } = await import(
  "../app/api/ag-work-resume/mapping-proposal-preview/route.ts"
);

const packet = buildAgWorkResumePacketPreview(buildFixtureInput());
const candidate = buildCandidateFromPacket(packet);
const readyBody = {
  packet,
  candidates: [candidate],
  selected_candidate_id: candidate.candidate_id,
  strict: false,
  source: {
    reviewed_by_surface: "route",
    reviewed_at: "2026-05-31T00:00:00.000Z",
  },
};

const readyResult = await postJson(readyBody);
assert.equal(readyResult.status, 200);
assert.equal(readyResult.json.ok, true);
assert.equal(readyResult.json.route, "ag_work_resume_mapping_proposal_preview.v0_1");
assert.equal(readyResult.json.strict, false);
assert.equal(readyResult.json.preview.status, "candidate_review");
assert.equal(readyResult.json.preview.ok_for_user_core_review, true);
assert.match(readyResult.json.recommended_next_step, /User\/Core should review/);
assert.match(readyResult.json.recommended_next_step, /Do not create a mapping record/i);
assert.match(readyResult.json.recommended_next_step, /import context/i);
assert.doesNotMatch(readyResult.json.recommended_next_step, /Codex can execute/i);
assertBoundaryFalse(readyResult.json.preview);
assertForeignRefsRemainForeign(readyResult.json.preview);
assert.doesNotMatch(JSON.stringify(readyResult.json.preview), /"mapping_id"|"import_id"/);

const needsCandidateResult = await postJson({ packet, candidates: [] });
assert.equal(needsCandidateResult.status, 200);
assert.equal(needsCandidateResult.json.ok, true);
assert.equal(needsCandidateResult.json.preview.status, "needs_candidate");
assert.match(needsCandidateResult.json.recommended_next_step, /explicit Local B candidate/i);

const omittedCandidatesResult = await postJson({ packet });
assert.equal(omittedCandidatesResult.status, 200);
assert.equal(omittedCandidatesResult.json.ok, true);
assert.equal(omittedCandidatesResult.json.preview.status, "needs_candidate");

const conflictResult = await postJson({
  ...readyBody,
  candidates: [
    {
      ...candidate,
      title: "Different local title",
      status: "blocked",
      next_action: "Resolve another local task.",
    },
  ],
});
assert.equal(conflictResult.status, 409);
assert.equal(conflictResult.json.ok, false);
assert.equal(conflictResult.json.preview.status, "conflict");
assert.match(conflictResult.json.recommended_next_step, /Conflicts must be resolved/i);

const repoConflictResult = await postJson({
  ...readyBody,
  candidates: [
    {
      ...candidate,
      repo_match: {
        ...candidate.repo_match,
        remote_matches: false,
      },
    },
  ],
});
assert.equal(repoConflictResult.status, 409);
assert.equal(repoConflictResult.json.ok, false);
assert.equal(repoConflictResult.json.preview.status, "conflict");

const unsafePacket = cloneJson(packet);
unsafePacket.target_runtime_policy.may_execute_codex = true;
const blockedResult = await postJson({
  packet: unsafePacket,
  candidates: [candidate],
  selected_candidate_id: candidate.candidate_id,
});
assert.equal(blockedResult.status, 422);
assert.equal(blockedResult.json.ok, false);
assert.equal(blockedResult.json.preview.status, "blocked");
assert.match(blockedResult.json.recommended_next_step, /Unsafe packet policy/i);

const unsafeMergePacket = cloneJson(packet);
unsafeMergePacket.target_runtime_policy.may_merge = true;
const mergeBlockedResult = await postJson({
  packet: unsafeMergePacket,
  candidates: [candidate],
  selected_candidate_id: candidate.candidate_id,
});
assert.equal(mergeBlockedResult.status, 422);
assert.equal(mergeBlockedResult.json.ok, false);
assert.equal(mergeBlockedResult.json.preview.status, "blocked");

const invalidJsonResult = await postRaw("{ invalid json");
assert.equal(invalidJsonResult.status, 400);
assert.equal(invalidJsonResult.json.ok, false);
assert.match(invalidJsonResult.json.error, /Invalid JSON/i);

const missingPacketResult = await postJson({ candidates: [candidate] });
assert.equal(missingPacketResult.status, 400);
assert.equal(missingPacketResult.json.ok, false);
assert.match(missingPacketResult.json.error, /packet object/i);

const invalidCandidatesResult = await postJson({
  packet,
  candidates: "not-an-array",
});
assert.equal(invalidCandidatesResult.status, 400);
assert.equal(invalidCandidatesResult.json.ok, false);
assert.match(invalidCandidatesResult.json.error, /candidates must be an array/i);

const invalidSelectedCandidateResult = await postJson({
  packet,
  candidates: [candidate],
  selected_candidate_id: 123,
});
assert.equal(invalidSelectedCandidateResult.status, 400);
assert.equal(invalidSelectedCandidateResult.json.ok, false);
assert.match(invalidSelectedCandidateResult.json.error, /selected_candidate_id/i);

const nonJsonContentTypeResult = await postRaw(JSON.stringify(readyBody), {
  "content-type": "text/plain",
});
assert.equal(nonJsonContentTypeResult.status, 400);
assert.equal(nonJsonContentTypeResult.json.ok, false);
assert.match(nonJsonContentTypeResult.json.error, /application\/json/i);

const dirtyDefaultResult = await postJson({
  ...readyBody,
  candidates: [
    {
      ...candidate,
      repo_match: {
        ...candidate.repo_match,
        dirty_worktree: true,
        expected_files_missing: ["docs/missing.md"],
      },
    },
  ],
});
assert.equal(dirtyDefaultResult.status, 200);
assert.equal(dirtyDefaultResult.json.ok, true);
assert.equal(dirtyDefaultResult.json.strict, false);
assert.equal(dirtyDefaultResult.json.preview.status, "candidate_review");
assert.ok(hasGap(dirtyDefaultResult.json.preview, "repo_dirty_worktree"));
assert.ok(hasGap(dirtyDefaultResult.json.preview, "expected_files_missing"));

const dirtyStrictResult = await postJson({
  ...readyBody,
  strict: true,
  candidates: [
    {
      ...candidate,
      repo_match: {
        ...candidate.repo_match,
        dirty_worktree: true,
        expected_files_missing: ["docs/missing.md"],
      },
    },
  ],
});
assert.equal(dirtyStrictResult.status, 409);
assert.equal(dirtyStrictResult.json.ok, false);
assert.equal(dirtyStrictResult.json.strict, true);
assert.equal(dirtyStrictResult.json.preview.status, "conflict");

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-mapping-proposal-preview-route",
      cases: [
        "package script is present",
        "route source guard forbids DB/runtime/network/shell/persistence calls",
        "docs guard preserves read-only route and authority boundary",
        "happy path returns 200 candidate_review",
        "needs_candidate returns 200",
        "omitted candidates defaults to needs_candidate",
        "work-field conflict returns 409",
        "repo remote mismatch returns 409",
        "unsafe packet policy returns 422 blocked",
        "unsafe merge policy returns 422 blocked",
        "invalid JSON returns 400",
        "missing packet returns 400",
        "invalid candidates shape returns 400",
        "invalid selected_candidate_id shape returns 400",
        "non-JSON content-type returns 400",
        "dirty worktree and missing files warn by default and conflict in strict mode",
        "foreign refs remain foreign",
        "authority booleans remain false and no mapping/import ids exist",
        "existing helper and pure smokes remain wired for PR verification",
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
    new Request("http://localhost/api/ag-work-resume/mapping-proposal-preview", {
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
  const workId = "AG-MAPPING-ROUTE-001";
  const scope = "project:augnes";
  return {
    workBrief: {
      runtime: "augnes",
      scope,
      work_id: workId,
      as_of: "2026-05-31T00:00:00.000Z",
      framing: {
        work_id: "Trace anchor only.",
        state_authority: "Augnes committed state remains authority.",
        execution_proof: "Action records remain proof.",
        temporal_proof: "Temporal graph remains proof over time.",
      },
      work: {
        work_id: workId,
        scope,
        title: "Review AG resume mapping proposal route",
        status: "in_progress",
        priority: "now",
        summary: "Create a read-only mapping proposal preview route.",
        next_action: "Compare one explicit Local B candidate work item.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_mapping"],
        links: {
          docs: ["docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_ROUTE_V0_1.md"],
        },
        created_at: "2026-05-31T00:00:00.000Z",
        updated_at: "2026-05-31T00:00:00.000Z",
      },
      next_action: "Compare one explicit Local B candidate work item.",
      user_attention_required: false,
      recent_events: [
        {
          id: "work-event:mapping-route-1",
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Prepared mapping proposal route smoke fixture.",
          result_status: "completed",
          result_kind: "verification",
          related_action_id: "action:proof-only-1",
          related_pr: "https://github.com/hynk-studio/augnes/pull/293",
          related_state_keys: ["coordination.ag_resume_mapping"],
          created_at: "2026-05-31T00:00:00.000Z",
        },
      ],
      related_state_keys: ["coordination.ag_resume_mapping"],
      related_proof: {
        action_ids: ["action:from-id-only"],
        action_records: [
          {
            id: "action:proof-only-1",
            title: "Proof-only source action",
            status: "completed",
            state_key: null,
            proof_marker_type: "proof_only",
            linked_work_event_ids: ["work-event:mapping-route-1"],
            created_at: "2026-05-31T00:00:00.000Z",
          },
        ],
        docs: ["docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_ROUTE_V0_1.md"],
        note: "Action records with state_key:null are proof-only.",
      },
      codex_handoff: {
        task_brief: "Implement read-only mapping proposal preview route.",
        constraints: ["No persistence.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-mapping-proposal-preview-route",
        ],
      },
    },
    stateBrief: {
      runtime: "augnes",
      scope,
      as_of: "2026-05-31T00:00:00.000Z",
      generated_at: "2026-05-31T00:00:00.000Z",
      agent_instructions: ["Keep AG Resume mapping/import authority gated."],
      agent_handoff: {
        current_status: {
          notable_state_keys: ["coordination.ag_resume_mapping"],
        },
        next_recommended_action: {
          related_state_keys: ["coordination.ag_resume_mapping"],
        },
        codex_handoff: {
          task_brief: "Implement read-only mapping proposal preview route.",
          constraints: ["No persistence.", "No Codex execution."],
          likely_files: [
            "app/api/ag-work-resume/mapping-proposal-preview/route.ts",
            "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_ROUTE_V0_1.md",
            "scripts/smoke-ag-work-resume-mapping-proposal-preview-route.mjs",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-mapping-proposal-preview-route",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: "handoff:mapping-proposal-route-smoke",
      status: "ready",
      expected_files: [
        "app/api/ag-work-resume/mapping-proposal-preview/route.ts",
        "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_ROUTE_V0_1.md",
        "scripts/smoke-ag-work-resume-mapping-proposal-preview-route.mjs",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-mapping-proposal-preview-route",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["runtime discovery", "runtime writes", "Codex execution"],
      stop_conditions: ["Mapping/import authority appears in route output."],
      safety_boundaries: ["Mapping proposal route output is read-only."],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "33b8e40",
      working_branch: "codex/ag-resume-mapping-proposal-preview-route",
      head_commit: "route-preview",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: "runtime-instance:mapping-proposal-route-smoke",
      source_local_label: "source-local-mapping-route-smoke",
      created_by_surface: "route-smoke",
      export_event_id: null,
    },
    foreign_evidence_refs: ["evidence:foreign-public-safe"],
    foreign_session_refs: ["session:foreign-public-safe"],
    foreign_evidence_pack_ref: "evidence-pack:foreign-public-safe",
  };
}

function buildCandidateFromPacket(packet) {
  return {
    candidate_id: "candidate:local-work",
    local_scope: packet.source_work.scope,
    local_work_id: packet.source_work.work_id,
    title: packet.source_work.title,
    status: packet.source_work.status,
    next_action: packet.source_work.next_action,
    related_state_keys: [...packet.source_work.related_state_keys],
    summary: packet.source_work.summary,
    priority: packet.source_work.priority,
    source: "explicit_user_input",
    work_brief_available: true,
    codex_read_brief_available: true,
    repo_match: {
      remote_matches: true,
      base_commit_reachable: true,
      expected_files_present: [...packet.handoff.expected_files],
      expected_files_missing: [],
      dirty_worktree: false,
    },
  };
}

function assertBoundaryFalse(preview) {
  assert.equal(preview.authority_boundary.read_only, true);
  assert.equal(preview.authority_boundary.proposal_only, true);
  for (const key of [
    "creates_mapping_record",
    "creates_import_record",
    "creates_work_item",
    "records_proof",
    "records_evidence",
    "binds_session",
    "executes_codex",
    "approval_authority",
    "publish_retry_replay_authority",
    "merge_authority",
    "state_mutation",
  ]) {
    assert.equal(preview.authority_boundary[key], false, `${key} must be false`);
  }
}

function assertForeignRefsRemainForeign(preview) {
  assert.deepEqual(preview.foreign_refs_summary.foreign_action_ref_ids, [
    "action:proof-only-1",
    "action:from-id-only",
  ]);
  assert.deepEqual(preview.foreign_refs_summary.foreign_evidence_refs, [
    "evidence:foreign-public-safe",
  ]);
  assert.deepEqual(preview.foreign_refs_summary.foreign_session_refs, [
    "session:foreign-public-safe",
  ]);
  assert.equal(
    preview.foreign_refs_summary.foreign_evidence_pack_ref,
    "evidence-pack:foreign-public-safe",
  );
  assert.equal(preview.foreign_refs_summary.local_proof_records_created, false);
  assert.equal(preview.foreign_refs_summary.local_evidence_records_created, false);
  assert.equal(preview.foreign_refs_summary.local_sessions_bound, false);
  assert.match(preview.foreign_refs_summary.note, /remain foreign/i);
}

function hasGap(preview, id) {
  return preview.gaps.some((gap) => gap.id === id);
}

function assertNoForbiddenRouteCalls(sourceText) {
  const forbiddenPatterns = [
    /from\s+["'][^"']*(?:db|database)[^"']*["']/i,
    /from\s+["']node:child_process["']/,
    /from\s+["']child_process["']/,
    /from\s+["']node:fs["']/,
    /from\s+["']fs["']/,
    /from\s+["']node:http["']/,
    /from\s+["']node:https["']/,
    /from\s+["']node:net["']/,
    /from\s+["']node:tls["']/,
    /from\s+["']node:dgram["']/,
    /from\s+["'][^"']*\/route(?:\.ts)?["']/,
    /ag-work-resume-packet-preflight/i,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bopenDatabase\s*\(/,
    /\bbuildWorkBrief\s*\(/,
    /\bbuildStateBrief\s*\(/,
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
    /\bcreate(?:Mapping|Import|Work|Proof|Evidence|Session)[A-Z]\w*\s*\(/,
    /\brecord(?:Proof|Evidence|Action|Work|Session)[A-Z]\w*\s*\(/,
    /\bbindSession\s*\(/,
    /\bexecuteCodex\s*\(/,
    /localStorage|sessionStorage|indexedDB/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(
      sourceText,
      pattern,
      `route must stay read-only/no-runtime-write: ${pattern}`,
    );
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
