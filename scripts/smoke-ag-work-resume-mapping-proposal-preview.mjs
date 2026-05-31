import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const helperPath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-mapping-proposal-preview.ts",
);
const builderPath = path.join(rootDir, "lib", "ag-work-resume-packet.ts");
const docsPath = path.join(
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
const preflightPath = path.join(__dirname, "ag-work-resume-packet-preflight.mjs");

assert.ok(existsSync(helperPath), "mapping proposal preview helper must exist");
assert.ok(existsSync(builderPath), "packet builder module must exist");
assert.ok(existsSync(docsPath), "mapping proposal preview docs must exist");
assert.ok(existsSync(preflightPath), "packet preflight helper must exist");

const helperSource = readFileSync(helperPath, "utf8");
assertNoForbiddenHelperCalls(helperSource);

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-mapping-proposal-preview"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-mapping-proposal-preview.mjs",
  "package.json must expose mapping proposal preview smoke through tsx",
);

const {
  buildAgWorkResumePacketPreview,
} = await import("../lib/ag-work-resume-packet.ts");
const {
  buildAgWorkResumeMappingProposalPreview,
} = await import("../lib/ag-work-resume-mapping-proposal-preview.ts");

const packet = buildAgWorkResumePacketPreview(buildFixtureInput());
assertStrictPreflightPass(packet);
const candidate = buildCandidateFromPacket(packet);

const readyPreview = buildAgWorkResumeMappingProposalPreview({
  packet,
  candidates: [candidate],
});
assert.equal(readyPreview.preview_kind, "ag_work_resume_mapping_proposal_preview");
assert.equal(
  readyPreview.schema,
  "augnes.ag_work_resume_mapping_proposal_preview.v0_1",
);
assert.equal(readyPreview.status, "candidate_review");
assert.equal(readyPreview.ok_for_user_core_review, true);
assert.equal(readyPreview.selected_candidate_summary?.candidate_id, candidate.candidate_id);
assert.match(readyPreview.proposal_preview_id, /^mapping-proposal-preview:/);
assert.doesNotMatch(JSON.stringify(readyPreview), /"mapping_id"|"import_id"/);
assert.equal(readyPreview.authority_boundary.read_only, true);
assert.equal(readyPreview.authority_boundary.proposal_only, true);
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
  assert.equal(readyPreview.authority_boundary[key], false, `${key} must be false`);
}
assert.equal(readyPreview.authority_boundary.durable_approval, "user/Core gated");
assert.match(readyPreview.authority_boundary.statement, /review metadata only/i);
assert.match(readyPreview.authority_boundary.statement, /not mapping confirmation/i);
assert.match(readyPreview.authority_boundary.statement, /not import/i);
assert.match(readyPreview.authority_boundary.statement, /not proof\/evidence/i);
assert.match(readyPreview.authority_boundary.statement, /not execution authority/i);
assertRecommendation(readyPreview, /user\/Core confirms mapping/i);
assertRecommendation(readyPreview, /Do not import or persist/i);
assertRecommendation(readyPreview, /Do not create mapping records/i);
assertRecommendation(readyPreview, /Do not record proof\/evidence, bind sessions, or start Codex/i);
assert.equal(readyPreview.foreign_refs_summary.local_proof_records_created, false);
assert.equal(readyPreview.foreign_refs_summary.local_evidence_records_created, false);
assert.equal(readyPreview.foreign_refs_summary.local_sessions_bound, false);
assert.match(readyPreview.foreign_refs_summary.note, /remain foreign/i);

const noCandidatePreview = buildAgWorkResumeMappingProposalPreview({
  packet,
  candidates: [],
});
assert.equal(noCandidatePreview.status, "needs_candidate");
assert.equal(noCandidatePreview.ok_for_user_core_review, false);
assert.match(findGap(noCandidatePreview, "local_candidate_missing").detail, /No explicit Local B candidate/i);
assertRecommendation(noCandidatePreview, /Provide explicit Local B candidate work item context/i);

const multipleCandidatePreview = buildAgWorkResumeMappingProposalPreview({
  packet,
  candidates: [
    candidate,
    { ...candidate, candidate_id: "candidate:other", local_work_id: "AG-OTHER" },
  ],
});
assert.equal(multipleCandidatePreview.status, "needs_candidate");
assert.equal(multipleCandidatePreview.ok_for_user_core_review, false);
assert.match(
  findQuestion(multipleCandidatePreview, "which_candidate_should_be_reviewed").text,
  /Which local work item/i,
);

const missingSelectedCandidatePreview = buildAgWorkResumeMappingProposalPreview({
  packet,
  candidates: [candidate],
  selected_candidate_id: "candidate:missing",
});
assert.equal(missingSelectedCandidatePreview.status, "needs_candidate");
assert.equal(missingSelectedCandidatePreview.ok_for_user_core_review, false);
assert.match(findGap(missingSelectedCandidatePreview, "selected_candidate_not_found").detail, /does not match/i);

const identityConflictPreview = buildAgWorkResumeMappingProposalPreview({
  packet,
  selected_candidate_id: "candidate:conflict",
  candidates: [
    {
      ...candidate,
      candidate_id: "candidate:conflict",
      local_scope: "project:other",
      local_work_id: "AG-DIFFERENT",
      title: "Different local title",
      status: "blocked",
      next_action: "Resolve a different local task.",
    },
  ],
});
assert.equal(identityConflictPreview.status, "conflict");
assert.equal(identityConflictPreview.ok_for_user_core_review, false);
assert.deepEqual(findConflict(identityConflictPreview, "candidate_work_fields_differ").fields, [
  "scope",
  "work_id",
  "title",
  "status",
  "next_action",
]);
assert.match(findQuestion(identityConflictPreview, "are_work_differences_expected").text, /differences expected/i);
assert.equal(
  identityConflictPreview.comparison.match_confidence_label,
  "conflict_requires_resolution",
);

const repoRemoteConflictPreview = buildAgWorkResumeMappingProposalPreview({
  packet,
  candidates: [
    {
      ...candidate,
      repo_match: { ...candidate.repo_match, remote_matches: false },
    },
  ],
});
assert.equal(repoRemoteConflictPreview.status, "conflict");
assert.match(findConflict(repoRemoteConflictPreview, "repo_remote_mismatch").detail, /remote/i);

const repoGapPreview = buildAgWorkResumeMappingProposalPreview({
  packet,
  candidates: [
    {
      ...candidate,
      repo_match: {
        ...candidate.repo_match,
        base_commit_reachable: false,
        dirty_worktree: true,
        expected_files_missing: ["docs/missing.md"],
      },
    },
  ],
});
assert.equal(repoGapPreview.status, "candidate_review");
assert.match(findGap(repoGapPreview, "repo_base_commit_unreachable").detail, /base commit/i);
assert.match(findGap(repoGapPreview, "repo_dirty_worktree").detail, /dirty/i);
assert.deepEqual(findGap(repoGapPreview, "expected_files_missing").refs, [
  "docs/missing.md",
]);

const repoStrictConflictPreview = buildAgWorkResumeMappingProposalPreview({
  packet,
  strict: true,
  candidates: [
    {
      ...candidate,
      repo_match: {
        ...candidate.repo_match,
        base_commit_reachable: false,
        dirty_worktree: true,
        expected_files_missing: ["docs/missing.md"],
      },
    },
  ],
});
assert.equal(repoStrictConflictPreview.status, "conflict");
assert.match(findConflict(repoStrictConflictPreview, "repo_base_commit_unreachable").detail, /Strict mode/i);
assert.match(findConflict(repoStrictConflictPreview, "repo_dirty_worktree").detail, /Strict mode/i);
assert.deepEqual(findConflict(repoStrictConflictPreview, "expected_files_missing").refs, [
  "docs/missing.md",
]);

const unsafePolicyPacket = cloneJson(packet);
unsafePolicyPacket.target_runtime_policy.may_execute_codex = true;
const unsafePolicyPreview = buildAgWorkResumeMappingProposalPreview({
  packet: unsafePolicyPacket,
  candidates: [candidate],
});
assert.equal(unsafePolicyPreview.status, "blocked");
assert.equal(unsafePolicyPreview.ok_for_user_core_review, false);
assert.deepEqual(findConflict(unsafePolicyPreview, "unsafe_packet_target_policy").fields, [
  "may_execute_codex",
]);
assert.match(findGap(unsafePolicyPreview, "unsafe_packet_policy_blocks_preview").detail, /unsafe packet policy/i);

const unsafeMergePacket = cloneJson(packet);
unsafeMergePacket.target_runtime_policy.may_merge = true;
const unsafeMergePreview = buildAgWorkResumeMappingProposalPreview({
  packet: unsafeMergePacket,
  candidates: [candidate],
});
assert.equal(unsafeMergePreview.status, "blocked");
assert.deepEqual(findConflict(unsafeMergePreview, "unsafe_packet_target_policy").fields, [
  "may_merge",
]);

assert.deepEqual(readyPreview.foreign_refs_summary.foreign_action_ref_ids, [
  "action:proof-only-1",
  "action:from-id-only",
]);
assert.deepEqual(readyPreview.foreign_refs_summary.foreign_evidence_refs, [
  "evidence:foreign-public-safe",
]);
assert.deepEqual(readyPreview.foreign_refs_summary.foreign_session_refs, [
  "session:foreign-public-safe",
]);
assert.equal(
  readyPreview.foreign_refs_summary.foreign_evidence_pack_ref,
  "evidence-pack:foreign-public-safe",
);

assert.deepEqual(
  buildAgWorkResumeMappingProposalPreview({ packet, candidates: [candidate] }),
  buildAgWorkResumeMappingProposalPreview({ packet, candidates: [candidate] }),
);

const docs = readFileSync(docsPath, "utf8");
for (const pattern of [
  /read-only/i,
  /proposal-only/i,
  /No mapping record/i,
  /No import record/i,
  /No persistence/i,
  /No work item creation/i,
  /No proof\/evidence recording/i,
  /No session binding/i,
  /No Codex execution/i,
  /No approval, publish, retry, replay, merge, or committed-state mutation/i,
  /Foreign refs remain foreign/i,
  /ok_for_user_core_review.*not mapping confirmation/is,
  /later PR may add a local helper/i,
  /later PR may add a read-only route/i,
  /persistence\/schema design/i,
]) {
  assert.match(docs, pattern, `mapping proposal preview docs must mention ${pattern}`);
}

const gateDoc = readFileSync(gateDocPath, "utf8");
if (gateDoc.includes("AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_V0_1.md")) {
  assert.match(
    gateDoc,
    /Stage A mapping proposal preview only/i,
    "authority gate pointer must say Stage A mapping proposal preview only",
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-mapping-proposal-preview",
      cases: [
        "package script is present",
        "helper source has no runtime/db/fs/network/route/write/persistence calls",
        "happy path candidate review is proposal-only and read-only",
        "no candidate reports needs_candidate",
        "multiple candidates require selected candidate id",
        "missing selected candidate reports needs_candidate",
        "identity/work differences report conflict",
        "repo remote mismatch conflicts",
        "repo gaps warn by default and conflict in strict mode",
        "unsafe packet policy blocks preview",
        "foreign refs remain foreign",
        "repeated calls are deterministic",
        "docs guard preserves read-only/proposal-only authority",
        "authority gate pointer is valid when present",
      ],
    },
    null,
    2,
  ),
);

function buildFixtureInput() {
  const workId = "AG-MAPPING-001";
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
        title: "Review AG resume mapping proposal",
        status: "in_progress",
        priority: "now",
        summary: "Create a pure read-only mapping proposal preview.",
        next_action: "Compare one candidate local work item.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_mapping"],
        links: {
          docs: ["docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_V0_1.md"],
        },
        created_at: "2026-05-31T00:00:00.000Z",
        updated_at: "2026-05-31T00:00:00.000Z",
      },
      next_action: "Compare one candidate local work item.",
      user_attention_required: false,
      recent_events: [
        {
          id: "work-event:1",
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Prepared read-only proposal preview helper.",
          result_status: "completed",
          result_kind: "verification",
          related_action_id: "action:proof-only-1",
          related_pr: "https://github.com/hynk-studio/augnes/pull/290",
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
            proof_marker_type: "proof_only",
            created_at: "2026-05-31T00:00:00.000Z",
          },
        ],
        docs: ["docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_V0_1.md"],
      },
      codex_handoff: {
        task_brief: "Implement read-only mapping proposal preview helper.",
        constraints: ["No persistence.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-mapping-proposal-preview",
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
          task_brief: "Implement read-only mapping proposal preview helper.",
          constraints: ["No persistence.", "No Codex execution."],
          likely_files: ["lib/ag-work-resume-mapping-proposal-preview.ts"],
          verification_commands: [
            "npm run smoke:ag-work-resume-mapping-proposal-preview",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: "handoff:mapping-proposal-smoke",
      status: "ready",
      expected_files: ["lib/ag-work-resume-mapping-proposal-preview.ts"],
      expected_checks: ["npm run smoke:ag-work-resume-mapping-proposal-preview"],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["runtime writes", "Codex execution"],
      stop_conditions: ["Mapping/import authority appears in preview helper."],
      safety_boundaries: ["Mapping proposal preview is read-only."],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "71aa296",
      working_branch: "codex/ag-resume-mapping-proposal-preview",
      head_commit: "preview",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: "runtime-instance:mapping-proposal-smoke",
      source_local_label: "source-local-smoke",
      created_by_surface: "local_helper",
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

function assertStrictPreflightPass(packet) {
  const result = spawnSync(process.execPath, [preflightPath, "--strict"], {
    input: JSON.stringify(packet),
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `expected strict preflight to pass\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
}

function assertNoForbiddenHelperCalls(source) {
  const forbiddenPatterns = [
    /from\s+["']node:fs["']/,
    /from\s+["']fs["']/,
    /from\s+["']node:child_process["']/,
    /from\s+["']child_process["']/,
    /from\s+["']node:http["']/,
    /from\s+["']node:https["']/,
    /from\s+["']node:net["']/,
    /from\s+["']node:tls["']/,
    /from\s+["']node:dgram["']/,
    /openDatabase/i,
    /better-sqlite3|sqlite/i,
    /\bfetch\s*\(/,
    /app\/api|pages\/api|route\.ts|route\.js/i,
    /buildWorkBrief|buildStateBrief/,
    /\b(writeFile|readFile|appendFile|mkdir|rm|unlink)\b/,
    /(?:^|[^\w.])(insert|update|delete|upsert|persist|save|write)\w*\s*\(/i,
    /\.(insert|update|delete|upsert|persist|save|write)\w*\s*\(/i,
    /createMappingRecord|createImportRecord|createWorkItem|recordEvidence|recordProof|bindSession/i,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(
      source,
      pattern,
      `helper source must not include forbidden pattern ${pattern}`,
    );
  }
}

function findGap(preview, id) {
  const gap = preview.gaps.find((item) => item.id === id);
  assert.ok(gap, `expected gap ${id}`);
  return gap;
}

function findConflict(preview, id) {
  const conflict = preview.conflicts.find((item) => item.id === id);
  assert.ok(conflict, `expected conflict ${id}`);
  return conflict;
}

function findQuestion(preview, id) {
  const question = preview.questions.find((item) => item.id === id);
  assert.ok(question, `expected question ${id}`);
  return question;
}

function assertRecommendation(preview, pattern) {
  assert.ok(
    preview.recommendations.some((recommendation) =>
      pattern.test(recommendation.text),
    ),
    `expected recommendation matching ${pattern}`,
  );
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
