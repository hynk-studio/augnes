import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const builderPath = path.join(rootDir, "lib", "ag-work-resume-packet.ts");
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PACKET_BUILDER_PREVIEW_V0_1.md",
);
const designDocPath = path.join(
  rootDir,
  "docs",
  "CROSS_LOCAL_AG_WORK_RESUME_DIRECT_CODE_V0_2.md",
);
const packagePath = path.join(rootDir, "package.json");
const preflightPath = path.join(__dirname, "ag-work-resume-packet-preflight.mjs");

assert.ok(existsSync(builderPath), "builder module must exist");
assert.ok(existsSync(docsPath), "builder preview docs must exist");
assert.ok(existsSync(preflightPath), "packet preflight helper must exist");

const builderSource = readFileSync(builderPath, "utf8");
assertNoForbiddenBuilderCalls(builderSource);

const docs = readFileSync(docsPath, "utf8");
for (const pattern of [
  /no route/i,
  /no persistence/i,
  /no Direct Resume Code route/i,
  /no relay/i,
  /not approval/i,
  /not\s+Codex execution authority/i,
]) {
  assert.match(docs, pattern, `docs must mention ${pattern}`);
}

const designDoc = readFileSync(designDocPath, "utf8");
assert.match(designDoc, /Packet builder preview/i, "cross-local design doc should mention builder preview");

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-packet-builder-preview"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-packet-builder-preview.mjs",
  "package.json must expose builder preview smoke through tsx",
);

const {
  AG_WORK_RESUME_PACKET_SCHEMA_V0_2,
  buildAgWorkResumePacketPreview,
} = await import("../lib/ag-work-resume-packet.ts");

const completeInput = buildFixtureInput();
const packet = buildAgWorkResumePacketPreview(completeInput);
const repeatedPacket = buildAgWorkResumePacketPreview(completeInput);

assert.equal(packet.schema, AG_WORK_RESUME_PACKET_SCHEMA_V0_2);
assert.equal(packet.packet_kind, "ag_work_resume_packet");
assert.equal(packet.packet_id, "resume-packet:preview:project-augnes:AG-BUILDER-001");
assert.equal(packet.expires_at, null);
assert.equal(packet.issuer.runtime, "augnes");
assert.equal(packet.issuer.runtime_instance_id, "runtime-instance:builder-smoke");
assert.equal(packet.source_work.scope, "project:augnes");
assert.equal(packet.source_work.work_id, "AG-BUILDER-001");
assert.equal(packet.source_work.title, completeInput.workBrief.work.title);
assert.equal(packet.source_work.status, completeInput.workBrief.work.status);
assert.equal(packet.source_work.priority, completeInput.workBrief.work.priority);
assert.equal(packet.source_work.next_action, completeInput.workBrief.work.next_action);
assert.deepEqual(packet.target_runtime_policy, {
  preview_only_by_default: true,
  may_map_to_existing_local_work_item: "requires explicit user/Core approval",
  may_create_local_work_item: false,
  may_record_evidence: "requires explicit user/Core approval and known local work_id",
  may_record_proof: "requires explicit user/Core approval and known local work_id",
  may_bind_session: false,
  may_commit_or_reject_state: false,
  may_execute_codex: false,
  may_merge: false,
  may_publish_or_replay: false,
});
assert.deepEqual(
  {
    raw_db_paths_included: packet.redaction.raw_db_paths_included,
    secrets_included: packet.redaction.secrets_included,
    tunnel_urls_included: packet.redaction.tunnel_urls_included,
    local_absolute_paths_included: packet.redaction.local_absolute_paths_included,
    screenshots_or_media_included: packet.redaction.screenshots_or_media_included,
    raw_openai_responses_included: packet.redaction.raw_openai_responses_included,
  },
  {
    raw_db_paths_included: false,
    secrets_included: false,
    tunnel_urls_included: false,
    local_absolute_paths_included: false,
    screenshots_or_media_included: false,
    raw_openai_responses_included: false,
  },
);
assert.equal(packet.bounds.max_recent_work_events, 10);
assert.equal(packet.bounds.max_foreign_evidence_refs, 20);
assert.equal(packet.bounds.summaries_only, true);
assert.equal(packet.bounds.raw_logs_included, false);
assert.equal(packet.continuity.recent_work_events.length, 10);
assert.ok(
  packet.continuity.recent_work_events.every((event) => !Object.hasOwn(event, "raw_logs")),
  "recent work event summaries must not include raw logs",
);
assert.deepEqual(
  packet.continuity.foreign_action_refs.map((ref) => ref.id),
  ["action:proof-only-1", "action:from-id-only"],
);
assert.equal(packet.continuity.foreign_action_refs[0].ref_kind, "foreign_action_ref");
assert.equal(packet.continuity.foreign_evidence_refs.length, 1);
assert.equal(packet.continuity.foreign_session_refs.length, 1);
assert.equal(packet.continuity.foreign_evidence_pack_ref, "evidence-pack:foreign-public-safe");
assert.equal(packet.packet_id, repeatedPacket.packet_id);
assert.equal(packet.integrity.payload_hash, repeatedPacket.integrity.payload_hash);
assert.equal(
  packet.integrity.redaction_report_hash,
  repeatedPacket.integrity.redaction_report_hash,
);
assert.match(packet.integrity.payload_hash, /^sha256:[a-f0-9]{64}$/);
assert.match(packet.integrity.redaction_report_hash, /^sha256:[a-f0-9]{64}$/);
assertNoUnsafeContent(packet);
assertStrictPreflightPass(packet);

const unsafePacket = buildAgWorkResumePacketPreview(buildUnsafeFixtureInput());
const unsafePacketJson = JSON.stringify(unsafePacket);
for (const unsafeText of [
  "http://localhost",
  "AUGNES_API_BASE_URL=",
  "/tmp/augnes",
  ".db",
  "trycloudflare.com",
  "/Users/alice",
  "/home/alice",
  "C:\\\\Users\\\\Alice",
  "OPENAI_API_KEY=",
  "GITHUB_TOKEN=",
  "sk-test",
  "ghp_",
  "BEGIN OPENSSH PRIVATE KEY",
]) {
  assert.equal(
    unsafePacketJson.includes(unsafeText),
    false,
    `builder output must omit raw unsafe value ${unsafeText}`,
  );
}
assert.ok(
  unsafePacket.redaction.notes.includes(
    "omitted local-runtime endpoint-specific verification command",
  ),
);
assert.ok(unsafePacket.redaction.notes.includes("omitted tunnel URL reference"));
assert.ok(unsafePacket.redaction.notes.includes("omitted raw DB path reference"));
assert.ok(
  unsafePacket.redaction.notes.includes("omitted unsafe local path reference"),
);
assert.ok(
  unsafePacket.redaction.notes.includes("omitted secret-like verification content"),
);
assertStrictPreflightPass(unsafePacket);

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-packet-builder-preview",
      cases: [
        "builder module exists and avoids runtime/network/fs/shell calls",
        "docs mention no route/no persistence/no Direct Resume Code route/no relay/no authority expansion",
        "package script is present",
        "generated packet shape matches v0.2",
        "deterministic packet_id and hashes repeat for same input",
        "target policy is safe",
        "redaction flags are false",
        "bounds are enforced",
        "recent_work_events is bounded to 10",
        "foreign refs stay foreign",
        "unsafe endpoint/tunnel/secret/local-path values are omitted",
        "happy-path packet passes strict preflight",
        "sanitized unsafe fixture packet passes strict preflight",
      ],
    },
    null,
    2,
  ),
);

function buildFixtureInput() {
  const workId = "AG-BUILDER-001";
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
        title: "Build AG resume packet preview",
        status: "in_progress",
        priority: "now",
        summary: "Create a pure packet preview over provided context.",
        next_action: "Run deterministic builder smoke coverage.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_packet"],
        links: {
          docs: ["docs/AG_WORK_RESUME_PACKET_BUILDER_PREVIEW_V0_1.md"],
        },
        created_at: "2026-05-30T00:00:00.000Z",
        updated_at: "2026-05-30T00:00:00.000Z",
      },
      next_action: "Run deterministic builder smoke coverage.",
      user_attention_required: false,
      recent_events: Array.from({ length: 12 }, (_, index) => ({
        id: `work-event:${index + 1}`,
        work_id: workId,
        scope,
        actor: index % 2 === 0 ? "codex" : "user",
        event_type: "implementation",
        summary: `Bounded event summary ${index + 1}.`,
        result_status: index === 0 ? "completed" : null,
        result_kind: index === 0 ? "verification" : null,
        related_action_id: index === 0 ? "action:proof-only-1" : null,
        related_pr: index === 0 ? "https://github.com/hynk-studio/augnes/pull/280" : null,
        related_state_keys: ["coordination.ag_resume_packet"],
        created_at: `2026-05-30T00:${String(index).padStart(2, "0")}:00.000Z`,
      })),
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
            linked_work_event_ids: ["work-event:1"],
            created_at: "2026-05-30T00:01:00.000Z",
          },
        ],
        prs: ["https://github.com/hynk-studio/augnes/pull/280"],
        docs: ["docs/AG_WORK_RESUME_PACKET_BUILDER_PREVIEW_V0_1.md"],
        links: {},
        note: "Action records with state_key:null are proof-only.",
      },
      codex_handoff: {
        task_brief: "Build pure AG resume packet preview.",
        constraints: ["Do not add runtime routes."],
        suggested_verification: ["npm run smoke:ag-work-resume-packet-builder-preview"],
        work_event_template: {
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Summarize result.",
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
          task_brief: "Build pure AG resume packet preview.",
          constraints: ["Do not add direct Codex orchestration."],
          likely_files: [
            "lib/ag-work-resume-packet.ts",
            "scripts/smoke-ag-work-resume-packet-builder-preview.mjs",
          ],
          verification_commands: ["npm run typecheck", "git diff --check"],
        },
      },
    },
    handoffDraft: {
      handoff_id: "handoff:builder-preview",
      status: "ready",
      expected_files: ["docs/AG_WORK_RESUME_PACKET_BUILDER_PREVIEW_V0_1.md"],
      expected_checks: ["npm run smoke:ag-work-resume-packet-builder-preview"],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["runtime routes", "UI controls"],
      stop_conditions: ["User/Core mapping is missing."],
      safety_boundaries: ["Generated packet is read-only context."],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "e463103",
      working_branch: "codex/ag-resume-packet-builder-preview",
      head_commit: "abcdef1",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: "runtime-instance:builder-smoke",
      source_local_label: "builder-smoke-local",
      created_by_surface: "codex-smoke",
      export_event_id: null,
    },
    foreign_evidence_refs: ["evidence:foreign-public-safe"],
    foreign_session_refs: ["session:foreign-public-safe"],
    foreign_evidence_pack_ref: "evidence-pack:foreign-public-safe",
  };
}

function buildUnsafeFixtureInput() {
  const input = buildFixtureInput();
  input.workBrief.codex_handoff.suggested_verification.push(
    'curl -s "http://localhost:3000/api/state/brief?scope=project:augnes"',
    "AUGNES_API_BASE_URL=http://localhost:3000 npm run codex:read-brief",
    "sqlite path /tmp/augnes-local.db",
    "open tunnel https://unsafe.trycloudflare.com",
    "inspect /Users/alice/dev/augnes",
    "inspect /home/alice/augnes",
    "inspect C:\\Users\\Alice\\augnes",
    "OPENAI_API_KEY=sk-test",
    "GITHUB_TOKEN=ghp_secret",
    "BEGIN OPENSSH PRIVATE KEY",
  );
  input.workBrief.related_proof.docs.push("/Users/alice/dev/augnes/notes.md");
  input.stateBrief.agent_handoff.codex_handoff.verification_commands.push(
    "npm run typecheck",
  );
  return input;
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

function assertNoUnsafeContent(packet) {
  const serialized = JSON.stringify(packet);
  for (const pattern of [
    /http:\/\/localhost/i,
    /AUGNES_API_BASE_URL=/i,
    /\/tmp\/augnes/i,
    /trycloudflare\.com|ngrok-free\.app|ngrok\.io|loca\.lt/i,
    /\/Users\/|\/home\/|\b[A-Za-z]:\\/i,
    /OPENAI_API_KEY=|GITHUB_TOKEN=|\bsk-[A-Za-z0-9_-]*|\bghp_/i,
    /BEGIN OPENSSH PRIVATE KEY/i,
  ]) {
    assert.doesNotMatch(serialized, pattern, `packet should not leak ${pattern}`);
  }
}

function assertNoForbiddenBuilderCalls(source) {
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
    /\bcreateHandoff\s*\(/,
    /\/api\//,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `builder must stay pure: ${pattern}`);
  }
}
