import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  PROJECT_EXPERIENCE_FIXTURE_VERSION_V1,
  PROJECT_EXPERIENCE_PRESENTATION_RUN_ID_V1,
  admitExpiredProjectContextPresentationV1,
  admitProjectExperienceRenderedStateV1,
  buildProjectExperienceBrowserFixtureV1,
  projectExperienceFixtureFingerprintV1,
} from "./project-experience-browser-fixture-v1";

void main();

async function main() {
  const root = mkdtempSync(
    path.join(tmpdir(), "augnes-project-experience-fixture-v1-"),
  );

  try {
    const fixture = await buildProjectExperienceBrowserFixtureV1({
      output_directory: root,
      reference_time: "2026-08-01T00:00:00.000Z",
    });
    assert.equal(
      fixture.manifest.fixture_version,
      PROJECT_EXPERIENCE_FIXTURE_VERSION_V1,
    );
    assert.equal(
      projectExperienceFixtureFingerprintV1(fixture.manifest),
      fixture.manifest.fixture_fingerprint,
    );
    assert.notEqual(
      path.resolve(fixture.source_database_path),
      path.resolve(fixture.writable_database_path),
    );
    assert.equal(
      sha256(fixture.source_database_path),
      fixture.manifest.source_database_sha256,
    );
    assert.equal(
      sha256(fixture.writable_database_path),
      fixture.manifest.writable_seed_sha256,
    );
    assert.equal(fixture.manifest.source_bound, true);
    assert.equal(fixture.manifest.presentation_only, true);
    assert.equal(fixture.manifest.execution_capable, false);
    assert.equal(fixture.manifest.external_network_calls, 0);
    assert.equal(fixture.manifest.provider_calls, 0);
    assert.equal(fixture.manifest.credential_material_included, false);
    assert.equal(fixture.manifest.semantic_authority_granted, false);
    assert.equal(fixture.manifest.execution_authority_granted, false);
    assert.match(
      fixture.manifest.rendered_state_inputs.result_ready.review_href,
      /^\/workbench\/results\/run-receipt~/u,
    );
    assert.match(
      fixture.manifest.rendered_state_inputs.proposal_review.review_href,
      /^\/workbench\/semantic-review\/episode-delta-proposal~/u,
    );
    assert.match(
      fixture.manifest.rendered_state_inputs.inspector.href,
      /^\/workbench\/inspector\?target=episode_delta_proposal&/u,
    );

    const sourceBeforeAdmission = sha256(fixture.source_database_path);
    const admitted = admitProjectExperienceRenderedStateV1({
      database_path: fixture.writable_database_path,
      manifest: fixture.manifest,
      admitted_at: "2026-08-01T00:00:01.000Z",
    });
    assert.equal(
      admitted.delegated_run_id,
      PROJECT_EXPERIENCE_PRESENTATION_RUN_ID_V1,
    );
    const expired = admitExpiredProjectContextPresentationV1({
      database_path: fixture.writable_database_path,
      project_id: fixture.manifest.project_id,
      marker: "PROJECT EXPERIENCE EXPIRED CONTEXT FIXTURE",
    });
    assert.match(expired.packet_id, /^task-context-packet:/u);
    assert.equal(sha256(fixture.source_database_path), sourceBeforeAdmission);
    assert.notEqual(
      sha256(fixture.writable_database_path),
      sourceBeforeAdmission,
    );

    const database = new Database(fixture.writable_database_path, {
      readonly: true,
      fileMustExist: true,
    });
    try {
      assert.equal(database.pragma("integrity_check", { simple: true }), "ok");
      const run = database
        .prepare(
          "SELECT scope, status, metadata_json FROM autonomy_runs WHERE run_id = ?",
        )
        .get(PROJECT_EXPERIENCE_PRESENTATION_RUN_ID_V1) as {
        scope: string;
        status: string;
        metadata_json: string;
      };
      assert.equal(run.scope, fixture.manifest.project_id);
      assert.equal(run.status, "running");
      assert.deepEqual(
        JSON.parse(run.metadata_json),
        expectPresentationMetadata(JSON.parse(run.metadata_json)),
      );
    } finally {
      database.close();
    }

    console.log(
      JSON.stringify({
        test: "project-experience-browser-fixture-v1",
        status: "pass",
        fixture_version: fixture.manifest.fixture_version,
        immutable_source_unchanged: true,
        writable_database_independent: true,
        presentation_fixture_execution_capable: false,
      }),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    assert.equal(existsSync(root), false);
  }
}

function sha256(filePath: string): `sha256:${string}` {
  return `sha256:${createHash("sha256")
    .update(readFileSync(filePath))
    .digest("hex")}`;
}

function expectPresentationMetadata(value: Record<string, unknown>) {
  assert.equal(
    value.presentation_fixture_version,
    PROJECT_EXPERIENCE_FIXTURE_VERSION_V1,
  );
  assert.equal(value.execution_authority, false);
  assert.equal(value.presentation_only, true);
  assert.equal(value.automatic_retry, false);
  return value;
}
