import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const helperPath = path.join(
  __dirname,
  "ag-work-resume-mapping-proposal-preview.mjs",
);
const smokePath = path.join(
  __dirname,
  "smoke-ag-work-resume-mapping-proposal-preview-helper.mjs",
);
const helperDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_HELPER_V0_1.md",
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
const tsxPath = path.join(rootDir, "apps", "augnes_apps", "node_modules", ".bin", "tsx");

assert.ok(existsSync(helperPath), "mapping proposal preview local helper must exist");
assert.ok(existsSync(smokePath), "mapping proposal preview local helper smoke must exist");
assert.ok(existsSync(helperDocsPath), "mapping proposal preview helper docs must exist");
assert.ok(existsSync(proposalDocsPath), "mapping proposal preview pure docs must exist");
assert.ok(existsSync(gateDocPath), "mapping/import authority gate docs must exist");
assert.ok(existsSync(tsxPath), "tsx runtime must exist for helper smoke");

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
assert.equal(
  packageJson.scripts?.["ag:resume-mapping-preview"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-mapping-proposal-preview.mjs",
  "package.json must expose ag:resume-mapping-preview",
);
assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-mapping-proposal-preview-helper"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-mapping-proposal-preview-helper.mjs",
  "package.json must expose mapping proposal preview helper smoke",
);
assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-mapping-proposal-preview"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-mapping-proposal-preview.mjs",
  "package.json must keep existing pure mapping proposal preview smoke",
);

const helperSource = readFileSync(helperPath, "utf8");
assertNoForbiddenHelperCalls(helperSource);

const helperDocs = readFileSync(helperDocsPath, "utf8");
for (const pattern of [
  /local read-only/i,
  /proposal-only/i,
  /Packet preflight[\s\S]*should already have run/i,
  /does not run packet preflight/i,
  /does not spawn\s+`ag:resume-preflight`/i,
  /No route/i,
  /No DB\/schema changes/i,
  /No persistence/i,
  /No import/i,
  /No mapping record creation/i,
  /No import record creation/i,
  /No work item creation/i,
  /No proof\/evidence recording/i,
  /No session binding/i,
  /No Direct Resume Code/i,
  /No relay/i,
  /No Codex execution/i,
  /No approval, publish, retry, replay, external posting, merge, auto-merge, or\s+committed-state mutation/i,
  /No localStorage, sessionStorage, indexedDB persistence/i,
  /No telemetry or analytics/i,
  /not mapping confirmation/i,
  /not import\s+authorization/i,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(helperDocs, pattern, `helper docs must mention ${pattern}`);
}

const proposalDocs = readFileSync(proposalDocsPath, "utf8");
assert.match(
  proposalDocs,
  /local helper/i,
  "mapping proposal preview docs should mention the local helper",
);

const gateDoc = readFileSync(gateDocPath, "utf8");
assert.match(
  gateDoc,
  /Stage A mapping proposal preview only/i,
  "authority gate docs must preserve Stage A proposal-only wording",
);

const { buildAgWorkResumePacketPreview } = await import("../lib/ag-work-resume-packet.ts");

const packet = buildAgWorkResumePacketPreview(buildFixtureInput());
const candidate = buildCandidateFromPacket(packet);
const combinedInput = {
  packet,
  candidates: [candidate],
  selected_candidate_id: candidate.candidate_id,
  strict: false,
  source: {
    reviewed_by_surface: "local_helper",
    reviewed_at: "2026-05-31T00:00:00.000Z",
  },
};

const envResult = runHelper({
  env: { AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT: JSON.stringify(combinedInput) },
});
assert.equal(envResult.status, 0, envResult.stderr);
assert.equal(envResult.json.ok, true);
assert.equal(envResult.json.helper, "ag_work_resume_mapping_proposal_preview.v0_1");
assert.equal(envResult.json.strict, false);
assert.equal(envResult.json.input_mode, "env");
assert.equal(envResult.json.preview.status, "candidate_review");
assert.match(envResult.json.recommended_next_step, /User\/Core should review/);
assert.match(envResult.json.recommended_next_step, /Do not create a mapping record/i);
assert.doesNotMatch(envResult.json.recommended_next_step, /Codex can execute/i);
assertBoundaryFalse(envResult.json.preview);
assertForeignRefsRemainForeign(envResult.json.preview);
assert.doesNotMatch(JSON.stringify(envResult.json.preview), /"mapping_id"|"import_id"/);

const tempDir = mkdtempSync(path.join(tmpdir(), "ag-mapping-preview-helper-"));
try {
  const combinedPath = path.join(tempDir, "combined.json");
  writeFileSync(combinedPath, JSON.stringify(combinedInput), "utf8");

  const fileResult = runHelper({ args: ["--file", combinedPath] });
  assert.equal(fileResult.status, 0, fileResult.stderr);
  assert.equal(fileResult.json.ok, true);
  assert.equal(fileResult.json.input_mode, "file");
  assert.equal(fileResult.json.preview.status, "candidate_review");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

const stdinResult = runHelper({ input: JSON.stringify(combinedInput) });
assert.equal(stdinResult.status, 0, stdinResult.stderr);
assert.equal(stdinResult.json.ok, true);
assert.equal(stdinResult.json.input_mode, "stdin");
assert.equal(stdinResult.json.preview.status, "candidate_review");

const dirtyDefaultResult = runHelper({
  env: {
    AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT: JSON.stringify({
      ...combinedInput,
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
    }),
  },
});
assert.equal(dirtyDefaultResult.status, 0, dirtyDefaultResult.stderr);
assert.equal(dirtyDefaultResult.json.ok, true);
assert.equal(dirtyDefaultResult.json.strict, false);
assert.equal(dirtyDefaultResult.json.preview.status, "candidate_review");
assert.ok(hasGap(dirtyDefaultResult.json.preview, "repo_dirty_worktree"));
assert.ok(hasGap(dirtyDefaultResult.json.preview, "expected_files_missing"));

const dirtyStrictResult = runHelper({
  args: ["--strict"],
  env: {
    AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT: JSON.stringify({
      ...combinedInput,
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
    }),
  },
});
assert.notEqual(dirtyStrictResult.status, 0);
assert.equal(dirtyStrictResult.json.ok, false);
assert.equal(dirtyStrictResult.json.strict, true);
assert.equal(dirtyStrictResult.json.preview.status, "conflict");
assert.match(dirtyStrictResult.json.recommended_next_step, /Conflicts must be resolved/i);

const inputStrictResult = runHelper({
  env: {
    AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT: JSON.stringify({
      ...combinedInput,
      strict: true,
      candidates: [
        {
          ...candidate,
          repo_match: {
            ...candidate.repo_match,
            dirty_worktree: true,
          },
        },
      ],
    }),
  },
});
assert.notEqual(inputStrictResult.status, 0);
assert.equal(inputStrictResult.json.strict, true);
assert.equal(inputStrictResult.json.preview.status, "conflict");

const noCandidateResult = runHelper({
  env: {
    AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT: JSON.stringify({
      packet,
      candidates: [],
    }),
  },
});
assert.equal(noCandidateResult.status, 0, noCandidateResult.stderr);
assert.equal(noCandidateResult.json.ok, true);
assert.equal(noCandidateResult.json.preview.status, "needs_candidate");
assert.match(noCandidateResult.json.recommended_next_step, /explicit Local B candidate/i);

const conflictResult = runHelper({
  env: {
    AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT: JSON.stringify({
      ...combinedInput,
      candidates: [
        {
          ...candidate,
          title: "Different local title",
          status: "blocked",
          next_action: "Resolve another local task.",
        },
      ],
    }),
  },
});
assert.notEqual(conflictResult.status, 0);
assert.equal(conflictResult.json.ok, false);
assert.equal(conflictResult.json.preview.status, "conflict");
assert.match(conflictResult.json.recommended_next_step, /Conflicts must be resolved/i);

const unsafePacket = cloneJson(packet);
unsafePacket.target_runtime_policy.may_execute_codex = true;
const blockedResult = runHelper({
  env: {
    AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT: JSON.stringify({
      packet: unsafePacket,
      candidates: [candidate],
      selected_candidate_id: candidate.candidate_id,
    }),
  },
});
assert.notEqual(blockedResult.status, 0);
assert.equal(blockedResult.json.ok, false);
assert.equal(blockedResult.json.preview.status, "blocked");
assert.match(blockedResult.json.recommended_next_step, /Unsafe packet policy/i);

const invalidJsonResult = runHelper({
  env: { AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT: "{ invalid json" },
});
assert.notEqual(invalidJsonResult.status, 0);
assert.equal(invalidJsonResult.json.ok, false);
assert.match(invalidJsonResult.json.error, /invalid JSON|JSON is invalid/i);

const missingPacketResult = runHelper({
  env: {
    AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT: JSON.stringify({
      candidates: [candidate],
    }),
  },
});
assert.notEqual(missingPacketResult.status, 0);
assert.equal(missingPacketResult.json.ok, false);
assert.equal(missingPacketResult.json.preview, null);
assert.match(missingPacketResult.json.error, /packet object/i);

const invalidCandidatesResult = runHelper({
  env: {
    AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT: JSON.stringify({
      packet,
      candidates: "not-an-array",
    }),
  },
});
assert.notEqual(invalidCandidatesResult.status, 0);
assert.equal(invalidCandidatesResult.json.ok, false);
assert.equal(invalidCandidatesResult.json.preview, null);
assert.match(invalidCandidatesResult.json.error, /candidates must be an array/i);

const missingInputResult = runHelper();
assert.equal(missingInputResult.status, 2);
assert.equal(missingInputResult.json.ok, false);
assert.match(missingInputResult.json.error, /Missing AG Resume Mapping Proposal Preview input/i);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-mapping-proposal-preview-helper",
      cases: [
        "package scripts are present",
        "helper source guard blocks runtime/db/route/network/shell/write APIs",
        "docs guard preserves helper authority boundary",
        "environment input returns candidate_review",
        "--file input returns candidate_review",
        "stdin input returns candidate_review",
        "dirty worktree and missing files warn by default",
        "--strict forces repo gaps to conflicts",
        "JSON strict true remains strict without flag",
        "no candidate exits zero with needs_candidate",
        "work-field conflict exits non-zero",
        "unsafe packet policy exits non-zero with blocked",
        "invalid JSON exits non-zero",
        "missing packet exits non-zero",
        "invalid candidates shape exits non-zero",
        "authority booleans remain false and no mapping/import ids exist",
        "foreign refs remain foreign",
        "existing pure helper smoke script remains wired for PR verification",
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
      env: {
        ...process.env,
        AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT: "",
        ...env,
      },
      input,
      encoding: "utf8",
    },
  );
  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch (error) {
    assert.fail(
      `helper did not print parseable JSON: ${
        error instanceof Error ? error.message : String(error)
      }\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );
  }
  return { ...result, json };
}

function buildFixtureInput() {
  const workId = "AG-MAPPING-HELPER-001";
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
        title: "Review AG resume mapping proposal helper",
        status: "in_progress",
        priority: "now",
        summary: "Create a local read-only mapping proposal preview helper.",
        next_action: "Compare one explicit Local B candidate work item.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_mapping"],
        links: {
          docs: ["docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_HELPER_V0_1.md"],
        },
        created_at: "2026-05-31T00:00:00.000Z",
        updated_at: "2026-05-31T00:00:00.000Z",
      },
      next_action: "Compare one explicit Local B candidate work item.",
      user_attention_required: false,
      recent_events: [
        {
          id: "work-event:mapping-helper-1",
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Prepared mapping proposal helper smoke fixture.",
          result_status: "completed",
          result_kind: "verification",
          related_action_id: "action:proof-only-1",
          related_pr: "https://github.com/hynk-studio/augnes/pull/292",
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
            linked_work_event_ids: ["work-event:mapping-helper-1"],
            created_at: "2026-05-31T00:00:00.000Z",
          },
        ],
        docs: ["docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_HELPER_V0_1.md"],
        note: "Action records with state_key:null are proof-only.",
      },
      codex_handoff: {
        task_brief: "Implement local read-only mapping proposal preview helper.",
        constraints: ["No persistence.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-mapping-proposal-preview-helper",
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
          task_brief: "Implement local read-only mapping proposal preview helper.",
          constraints: ["No persistence.", "No Codex execution."],
          likely_files: [
            "scripts/ag-work-resume-mapping-proposal-preview.mjs",
            "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_HELPER_V0_1.md",
            "scripts/smoke-ag-work-resume-mapping-proposal-preview-helper.mjs",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-mapping-proposal-preview-helper",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: "handoff:mapping-proposal-helper-smoke",
      status: "ready",
      expected_files: [
        "scripts/ag-work-resume-mapping-proposal-preview.mjs",
        "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_HELPER_V0_1.md",
        "scripts/smoke-ag-work-resume-mapping-proposal-preview-helper.mjs",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-mapping-proposal-preview-helper",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["runtime writes", "Codex execution"],
      stop_conditions: ["Mapping/import authority appears in helper output."],
      safety_boundaries: ["Mapping proposal helper output is read-only."],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "2bed292",
      working_branch: "codex/ag-resume-mapping-proposal-preview-helper",
      head_commit: "preview-helper",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: "runtime-instance:mapping-proposal-helper-smoke",
      source_local_label: "source-local-mapping-helper-smoke",
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

function assertNoForbiddenHelperCalls(sourceText) {
  const forbiddenPatterns = [
    /from\s+["']node:child_process["']/,
    /from\s+["']child_process["']/,
    /from\s+["']node:http["']/,
    /from\s+["']node:https["']/,
    /from\s+["']node:net["']/,
    /from\s+["']node:tls["']/,
    /from\s+["']node:dgram["']/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bopenDatabase\s*\(/,
    /better-sqlite3|sqlite/i,
    /from\s+["'][^"']*(?:app\/api|pages\/api|route\.(?:ts|js))["']/i,
    /\bbuildWorkBrief\s*\(/,
    /\bbuildStateBrief\s*\(/,
    /\b(writeFile|appendFile|mkdir|rm|unlink)\b/,
    /(?:^|[^\w.])(insert|update|delete|upsert|persist|save)\w*\s*\(/i,
    /\.(insert|update|delete|upsert|persist|save)\w*\s*\(/i,
    /localStorage|sessionStorage|indexedDB/,
    /createMappingRecord|createImportRecord|createWorkItem|recordEvidence|recordProof|bindSession|executeCodex/i,
    /spawnSync|execSync|execFileSync|exec\(/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(
      sourceText,
      pattern,
      `helper must stay local/read-only and no-runtime-write: ${pattern}`,
    );
  }
  assert.doesNotMatch(
    sourceText,
    /ag-work-resume-packet-preflight\.mjs|preflightPath|AG_WORK_RESUME_PACKET/,
    "helper must not run or spawn packet preflight",
  );
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
