import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";

const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-codex-evidence-helper-"));
process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");

let postEvidenceCalls = 0;
let unexpectedRequests = 0;
let server;

try {
  const { resetDatabase, openDatabase } = await import("./db-common.mjs");
  const db = resetDatabase();
  seedWorkItem(db);
  db.close();

  const evidenceRecordsRoute = await import("../app/api/evidence/records/route.ts");
  const evidencePackRoute = await import("../app/api/evidence-pack/route.ts");

  server = http.createServer(async (request, response) => {
    try {
      const routeResponse = await routeLocalRequest({
        request,
        evidenceRecordsRoute,
        evidencePackRoute,
      });
      await writeWebResponse(response, routeResponse);
    } catch (error) {
      unexpectedRequests += 1;
      response.writeHead(500, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : "local smoke server failed",
        }),
      );
    }
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const apiBaseUrl = `http://127.0.0.1:${address.port}`;

  const beforeMutationSnapshot = readMutationSnapshot(openDatabase);

  const commonEnv = {
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_SCOPE: "project:augnes",
    CODEX_WORK_ID: "AG-EVIDENCE",
    CODEX_SOURCE_SURFACE: "codex",
    CODEX_CREATED_BY: "codex-smoke",
  };

  const commandResult = await runHelper({
    ...commonEnv,
    CODEX_EVIDENCE_KIND: "command_run",
    CODEX_EVIDENCE_STATUS: "passed",
    CODEX_EVIDENCE_LABEL: "Root typecheck",
    CODEX_COMMAND: "npm run typecheck",
    CODEX_RESULT_SUMMARY: "Typecheck passed in helper smoke.",
    CODEX_METADATA_JSON: '{"cwd":"repo root"}',
  });
  assertEqual(commandResult.code, 0, "command_run helper should pass");
  assert(
    commandResult.stdout.includes("evidence_kind: command_run"),
    "command_run helper summary should include evidence kind",
  );
  assert(
    commandResult.stdout.includes("evidence_id:"),
    "command_run helper summary should include evidence id",
  );
  assert(
    commandResult.stdout.includes("evidence_records_url:") &&
      commandResult.stdout.includes(`${apiBaseUrl}/api/evidence/records?scope=project%3Aaugnes`),
    "command_run helper summary should include scoped evidence records URL",
  );
  assert(
    commandResult.stdout.includes("work_brief_url:") &&
      commandResult.stdout.includes(`${apiBaseUrl}/api/work/AG-EVIDENCE/brief?scope=project%3Aaugnes`),
    "command_run helper summary should include work brief URL when work id is present",
  );
  assert(
    commandResult.stdout.includes("evidence_pack_url:") &&
      commandResult.stdout.includes(
        `${apiBaseUrl}/api/evidence-pack?scope=project%3Aaugnes&work_id=AG-EVIDENCE`,
      ),
    "command_run helper summary should include work-filtered Evidence Pack URL",
  );
  assert(
    commandResult.stdout.includes(
      "This helper records observation evidence only; it does not call GitHub/OpenAI, execute replay, publish, approve, or mutate state authority rows.",
    ),
    "command_run helper summary should preserve no-authority boundary line",
  );

  const checkPassedResult = await runHelper({
    ...commonEnv,
    CODEX_EVIDENCE_KIND: "check_passed",
    CODEX_EVIDENCE_STATUS: "passed",
    CODEX_EVIDENCE_LABEL: "Evidence Pack smoke",
    CODEX_RESULT_SUMMARY: "Evidence Pack helper smoke passed with local API route adapter.",
  });
  assertEqual(checkPassedResult.code, 0, "check_passed helper should pass");

  const checkSkippedResult = await runHelper({
    ...commonEnv,
    CODEX_EVIDENCE_KIND: "check_skipped",
    CODEX_EVIDENCE_STATUS: "skipped",
    CODEX_EVIDENCE_LABEL: "Browser screenshot check",
    CODEX_RESULT_SUMMARY: "Browser screenshot check was not run.",
    CODEX_SKIPPED_REASON: "No browser runtime was available in this environment.",
  });
  assertEqual(checkSkippedResult.code, 0, "check_skipped helper should pass");

  const targetRefOnlyResult = await runHelper({
    AUGNES_API_BASE_URL: apiBaseUrl,
    CODEX_SCOPE: "project:augnes",
    CODEX_SOURCE_SURFACE: "codex",
    CODEX_CREATED_BY: "codex-smoke",
    CODEX_TARGET_REF: "github:pull/201",
    CODEX_EVIDENCE_KIND: "check_passed",
    CODEX_EVIDENCE_STATUS: "passed",
    CODEX_EVIDENCE_LABEL: "Target ref Evidence Pack filter",
    CODEX_RESULT_SUMMARY: "Target-ref-only Evidence Pack review ref was printed.",
  });
  assertEqual(targetRefOnlyResult.code, 0, "target_ref-only helper should pass");
  assert(
    targetRefOnlyResult.stdout.includes("evidence_pack_url:") &&
      targetRefOnlyResult.stdout.includes(
        `${apiBaseUrl}/api/evidence-pack?scope=project%3Aaugnes&target_ref=github%3Apull%2F201`,
      ),
    "target_ref-only helper summary should include target_ref-filtered Evidence Pack URL",
  );
  assertEqual(postEvidenceCalls, 4, "four valid helper runs should POST four records");

  const invalidMissingResult = await runHelper({
    ...commonEnv,
    CODEX_EVIDENCE_KIND: "command_run",
    CODEX_EVIDENCE_STATUS: "passed",
    CODEX_RESULT_SUMMARY: "Missing label should fail before POST.",
  });
  assertNotEqual(invalidMissingResult.code, 0, "missing label should fail");
  assert(
    invalidMissingResult.stderr.includes("CODEX_EVIDENCE_LABEL is required"),
    "missing label should fail with local validation error",
  );
  assertEqual(postEvidenceCalls, 4, "missing label should fail before POST");

  const invalidMetadataResult = await runHelper({
    ...commonEnv,
    CODEX_EVIDENCE_KIND: "check_passed",
    CODEX_EVIDENCE_STATUS: "passed",
    CODEX_EVIDENCE_LABEL: "Invalid metadata",
    CODEX_RESULT_SUMMARY: "Invalid metadata should fail before POST.",
    CODEX_METADATA_JSON: "[]",
  });
  assertNotEqual(invalidMetadataResult.code, 0, "invalid metadata should fail");
  assert(
    invalidMetadataResult.stderr.includes("CODEX_METADATA_JSON must be a JSON object string"),
    "invalid metadata should fail with object validation error",
  );
  assertEqual(postEvidenceCalls, 4, "invalid metadata should fail before POST");

  const listResponse = await fetch(
    `${apiBaseUrl}/api/evidence/records?scope=project:augnes&work_id=AG-EVIDENCE`,
  );
  const listJson = await listResponse.json();
  assertEqual(listResponse.status, 200, "GET evidence records should pass");
  assertEqual(listJson.records.length, 3, "GET should return three helper records");
  assertKinds(listJson.records, ["check_passed", "check_skipped", "command_run"]);

  const evidencePackResponse = await fetch(
    `${apiBaseUrl}/api/evidence-pack?scope=project:augnes&work_id=AG-EVIDENCE`,
  );
  const evidencePack = await evidencePackResponse.json();
  assertEqual(evidencePackResponse.status, 200, "Evidence Pack by work should pass");
  assertEqual(
    evidencePack.verification_trace.commands_run.length,
    1,
    "Evidence Pack should include helper command_run record",
  );
  assertEqual(
    evidencePack.verification_trace.checks_passed.length,
    1,
    "Evidence Pack should include helper check_passed record",
  );
  assertEqual(
    evidencePack.verification_trace.skipped_checks.length,
    1,
    "Evidence Pack should include helper check_skipped record",
  );

  const afterMutationSnapshot = readMutationSnapshot(openDatabase);
  assertDeepEqual(
    afterMutationSnapshot,
    beforeMutationSnapshot,
    "helper should not mutate publication, approval, readiness, delivery, mailbox, or state rows",
  );

  assertEqual(unexpectedRequests, 0, "smoke server should see no unexpected local requests");

  console.log(
    JSON.stringify(
      {
        smoke: "codex-record-evidence-helper",
        db_path: process.env.AUGNES_DB_PATH,
        helper_records_created: listJson.records.length,
        post_evidence_calls: postEvidenceCalls,
        target_ref_review_ref_checked: true,
        invalid_input_failed_before_post: true,
        metadata_object_validation: true,
        evidence_pack_commands_run: evidencePack.verification_trace.commands_run.length,
        evidence_pack_checks_passed: evidencePack.verification_trace.checks_passed.length,
        evidence_pack_skipped_checks: evidencePack.verification_trace.skipped_checks.length,
        github_calls: 0,
        openai_calls: 0,
        tokens_required: false,
        authority_rows_mutated: false,
        limitation:
          "Uses a local HTTP adapter around the real Next route handlers instead of starting next dev.",
      },
      null,
      2,
    ),
  );
} finally {
  if (server) {
    server.close();
    await once(server, "close").catch(() => undefined);
  }
  rmSync(tempDir, { recursive: true, force: true });
}

async function routeLocalRequest({ request, evidenceRecordsRoute, evidencePackRoute }) {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const body = method === "GET" || method === "HEAD" ? undefined : await readRequestBody(request);
  const webRequest = new Request(url, {
    method,
    headers: request.headers,
    body,
  });

  if (url.pathname === "/api/evidence/records" && method === "GET") {
    return evidenceRecordsRoute.GET(webRequest);
  }

  if (url.pathname === "/api/evidence/records" && method === "POST") {
    postEvidenceCalls += 1;
    return evidenceRecordsRoute.POST(webRequest);
  }

  if (url.pathname === "/api/evidence-pack" && method === "GET") {
    return evidencePackRoute.GET(webRequest);
  }

  unexpectedRequests += 1;
  return Response.json({ error: `Unexpected ${method} ${url.pathname}` }, { status: 404 });
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function writeWebResponse(nodeResponse, webResponse) {
  nodeResponse.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => {
    nodeResponse.setHeader(key, value);
  });
  nodeResponse.end(Buffer.from(await webResponse.arrayBuffer()));
}

function runHelper(env) {
  const childEnv = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    npm_config_cache: process.env.npm_config_cache ?? path.join(tempDir, "npm-cache"),
    ...env,
  };

  delete childEnv.GITHUB_TOKEN;
  delete childEnv.OPENAI_API_KEY;

  return new Promise((resolve) => {
    const child = spawn(
      "npm",
      ["--prefix", "apps/augnes_apps", "run", "--silent", "codex:record-evidence"],
      {
        cwd: process.cwd(),
        env: childEnv,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

function readMutationSnapshot(openDatabase) {
  const db = openDatabase();
  try {
    return {
      publications: db
        .prepare(
          `
            SELECT publication_id, status, approved_by, sent_at, updated_at
            FROM publication_drafts
            ORDER BY publication_id
          `,
        )
        .all(),
      approval_requests: db
        .prepare(
          `
            SELECT approval_request_id, publication_id, status, updated_at
            FROM publication_approval_requests
            ORDER BY approval_request_id
          `,
        )
        .all(),
      approval_decisions: db
        .prepare(
          `
            SELECT approval_decision_id, publication_id, decision
            FROM publication_approval_decisions
            ORDER BY approval_decision_id
          `,
        )
        .all(),
      readiness_checks: db
        .prepare(
          `
            SELECT readiness_check_id, publication_id, status
            FROM publication_readiness_checks
            ORDER BY readiness_check_id
          `,
        )
        .all(),
      deliveries: db
        .prepare(
          `
            SELECT delivery_id, publication_id, status, sent_at, acknowledged_at, error_message, updated_at
            FROM delivery_ledger
            ORDER BY delivery_id
          `,
        )
        .all(),
      mailbox_count: db
        .prepare("SELECT COUNT(*) AS count FROM mailbox_messages")
        .get().count,
      state_entry_count: db
        .prepare("SELECT COUNT(*) AS count FROM state_entries")
        .get().count,
    };
  } finally {
    db.close();
  }
}

function seedWorkItem(db) {
  db.prepare(
    `
      INSERT INTO agents (id, name, kind, created_at)
      VALUES ('codex-smoke', 'Codex Smoke', 'codex', '2026-01-01T00:00:00.000Z')
    `,
  ).run();
  db.prepare(
    `
      INSERT INTO work_items (
        work_id,
        scope,
        title,
        status,
        priority,
        summary,
        next_action,
        user_attention_required,
        related_state_keys,
        links,
        created_at,
        updated_at
      )
      VALUES (
        'AG-EVIDENCE',
        'project:augnes',
        'Codex evidence helper smoke work',
        'in_progress',
        'now',
        'Seeded local work trace for the Codex evidence helper smoke.',
        'Review helper-created verification evidence records.',
        0,
        '["coordination.evidence_pack"]',
        '{}',
        '2026-01-01T00:00:00.000Z',
        '2026-01-01T00:00:00.000Z'
      )
    `,
  ).run();
}

function assertKinds(records, expectedKinds) {
  const actualKinds = records.map((record) => record.evidence_kind).sort();
  assertDeepEqual(actualKinds, expectedKinds, "GET should return expected evidence kinds");
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertNotEqual(actual, expected, message) {
  if (actual === expected) {
    throw new Error(`${message}: expected value different from ${expected}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${message}: expected ${expectedJson}, got ${actualJson}`);
  }
}
