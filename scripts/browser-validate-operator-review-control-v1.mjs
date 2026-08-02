#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  CANONICAL_TEST_STRATEGIC_TRANSPORT_COUNTER_FILE_V01,
  CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_FILE_V01,
  CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_VERSION_V01,
} from "../lib/vnext/model-gateway/canonical-test-strategic-transport.ts";
import { runOperatorExecutionBrowserChildV1 } from "./operator-execution-browser-child-v1.mjs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const CHILD_ID = "operator-review-control";
const VALIDATION_SCOPE = "operator-review-control";
const expectedInspectorConsoleDeliveries = new Map();
const consumedInspectorConsoleDeliveries = new Map();
assert(
  ["operator-review-control"].includes(VALIDATION_SCOPE),
  "unsupported operator review and control scope",
);

await runOperatorExecutionBrowserChildV1({
  child_id: CHILD_ID,
  prepare: async ({ fixture, temporary_root }) => {
    const strategicFixturePath = path.join(
      temporary_root,
      CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_FILE_V01,
    );
    const strategicCounterPath = path.join(
      temporary_root,
      CANONICAL_TEST_STRATEGIC_TRANSPORT_COUNTER_FILE_V01,
    );
    writeFileSync(
      strategicFixturePath,
      `${JSON.stringify({
        fixture_version:
          CANONICAL_TEST_STRATEGIC_TRANSPORT_FIXTURE_VERSION_V01,
        workspace_id: fixture.manifest.workspace_id,
        project_id: fixture.manifest.project_id,
        working_frame_fingerprint:
          fixture.manifest.strategic_working_frame_fingerprint,
        source_catalog_fingerprint:
          fixture.manifest.strategic_source_catalog_fingerprint,
      })}\n`,
      { encoding: "utf8", flag: "wx", mode: 0o600 },
    );
    return {
      project_id: fixture.manifest.project_id,
      strategic_fixture_path: strategicFixturePath,
      strategic_fixture_retired_path: `${strategicFixturePath}.retired`,
      strategic_counter_path: strategicCounterPath,
    };
  },
  console_allowlist: (entry) =>
    ([
      "operator_session_bootstrap",
      "result_review_and_inspector",
    ].includes(entry.phase) &&
      entry.request_path === "/api/vnext/operator/session" &&
      entry.response_status === 401 &&
      entry.text ===
        "Failed to load resource: the server responded with a status of 401 (Unauthorized)") ||
    (entry.phase === "operator_session_bootstrap" &&
      entry.request_path === "/api/vnext/operator/session" &&
      entry.response_status === 409 &&
      entry.text ===
        "Failed to load resource: the server responded with a status of 409 (Conflict)") ||
    (entry.phase === "operator_session_refusal_recovery" &&
      entry.request_path === "/api/vnext/operator/session" &&
      entry.response_status === 403 &&
      entry.text ===
        "Failed to load resource: the server responded with a status of 403 (Forbidden)") ||
    (entry.phase === "project_controls_and_automation" &&
      entry.request_path === "/api/vnext/project-controls" &&
      entry.response_status === 409 &&
      entry.text ===
        "Failed to load resource: the server responded with a status of 409 (Conflict)") ||
    allowExpectedInspectorConsoleDelivery(entry) ||
    ([
      "project_controls_and_automation",
      "strategic_analysis_and_proposal_review",
      "result_review_and_inspector",
      "review_decision_and_transition",
    ].includes(entry.phase) &&
      entry.request_path === "/favicon.ico" &&
      entry.response_status === 404 &&
      entry.text ===
        "Failed to load resource: the server responded with a status of 404 (Not Found)"),
  console_allowlist_finalize: () => {
    assert.equal(expectedInspectorConsoleDeliveries.size, 2);
    assert.deepEqual(
      [...consumedInspectorConsoleDeliveries].sort(([left], [right]) =>
        left.localeCompare(right),
      ),
      [...expectedInspectorConsoleDeliveries]
        .map(([requestId, expected]) => [
          requestId,
          expected.expected_delivery_count,
        ])
        .sort(([left], [right]) => left.localeCompare(right)),
    );
  },
  request_failure_allowlist: (entry) =>
    entry.error_text === "net::ERR_ABORTED" &&
    ((entry.phase === "strategic_analysis_and_proposal_review" &&
      entry.path === "/api/augnes/read/guide-brief") ||
      (entry.phase === "result_review_and_inspector" &&
        entry.path === "/workbench/inspector") ||
      (entry.phase === "review_decision_and_transition" &&
        entry.path === "/api/augnes/read/guide-brief")),
  execute: async ({
    fixture,
    lifecycle,
    result,
    detailed_field_owner: completeDetailedFieldOwner,
    semantic_marker_owner: recordOwner,
    prepared,
  }) => {
    function completeDetailedField(id) {
      return completeDetailedFieldOwner(id);
    }
    function record(id) {
      return recordOwner(id);
    }
    const appOrigin = lifecycle.app_origin;
    const projectId = fixture.manifest.project_id;
    const encodedProjectId = encodeURIComponent(projectId);
    const observedTimelineStates = new Set();

    await lifecycle.runPhase("project_controls_and_automation", async () => {
      await lifecycle.navigate(`${appOrigin}/projects/${encodedProjectId}`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-blank-state="v0.1"]') !== null`,
        "review control Project Home",
      );
      await activateCurrentProject(lifecycle, projectId);
      await openProjectOptions(lifecycle);
      await lifecycle.waitForCondition(
        `document.querySelectorAll('[data-project-controls-hydrated="true"]').length === 2`,
        "review control settings hydration",
      );
      const initial = await lifecycle.evaluateJson(`(() => ({
        not_configured: document.body.textContent.includes('Project automation is not configured.'),
        policy: document.body.textContent.includes('One automated run at a time') &&
          document.body.textContent.includes('No automatic retry') &&
          document.body.textContent.includes('Review required before semantic change') &&
          document.body.textContent.includes('External actions not authorized'),
        enable_count: Array.from(document.querySelectorAll('button')).filter((entry) => entry.textContent?.trim() === 'Enable').length
      }))()`);
      assert.deepEqual(initial, {
        not_configured: true,
        policy: true,
        enable_count: 1,
      });
      result.project_automation_default_not_configured = true;
      completeDetailedField("project_automation_default_not_configured");
      result.project_automation_policy_summary_visible = true;
      completeDetailedField("project_automation_policy_summary_visible");

      await clickButton(lifecycle, "Enable");
      await lifecycle.waitForCondition(
        `Array.from(document.querySelectorAll('button')).some((entry) => entry.textContent?.trim() === 'Pause') && document.body.textContent.includes('Control layer eligible')`,
        "automation enabled",
      );
      result.project_automation_enabled = true;
      completeDetailedField("project_automation_enabled");
      const enabledState = readControlState(
        fixture.writable_database_path,
        projectId,
      );
      assert.deepEqual(enabledState, { enabled: 1, paused: 0, revision: 1 });
      const directPause = await lifecycle.evaluateJson(`(async () => {
        const current = await (await fetch('/api/vnext/projects')).json();
        const active = current.recent_projects.find((entry) => entry.is_active);
        const response = await fetch('/api/vnext/project-controls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'pause_automation',
            project_id: ${JSON.stringify(projectId)},
            expected_active_project_id: active.active_project_id,
            expected_active_selection_revision: active.active_selection_revision,
            expected_control_revision: 1
          })
        });
        return { status: response.status, body: await response.json() };
      })()`);
      assert.equal(directPause.status, 200);
      await clickButton(lifecycle, "Pause");
      await lifecycle.waitForCondition(
        `document.body.textContent.includes('Automation settings changed in another view. Refresh and try again.')`,
        "stale automation conflict",
      );
      result.project_automation_stale_conflict_visible = true;
      completeDetailedField("project_automation_stale_conflict_visible");
      await lifecycle.navigate(`${appOrigin}/projects/${encodedProjectId}`);
      await openProjectOptions(lifecycle);
      await lifecycle.waitForCondition(
        `document.body.textContent.includes('Project automation is paused for new policy-triggered work.') && Array.from(document.querySelectorAll('button')).some((entry) => entry.textContent?.trim() === 'Resume')`,
        "automation paused after conflict refresh",
      );
      result.project_automation_paused = true;
      completeDetailedField("project_automation_paused");
      await clickButton(lifecycle, "Resume");
      await lifecycle.waitForCondition(
        `document.body.textContent.includes('Control layer eligible') && Array.from(document.querySelectorAll('button')).some((entry) => entry.textContent?.trim() === 'Pause')`,
        "automation resumed",
      );
      result.project_automation_resumed = true;
      completeDetailedField("project_automation_resumed");
      assert.deepEqual(
        readControlState(fixture.writable_database_path, projectId),
        { enabled: 1, paused: 0, revision: 3 },
      );
      assert.equal(
        readControlRows(fixture.writable_database_path).filter(
          (entry) => entry.project_id !== projectId,
        ).length,
        0,
      );
      assert.deepEqual(
        readProjectControlIsolation(
          fixture.writable_database_path,
          projectId,
          fixture.manifest.profile_project_id,
        ),
        {
          registered_project_count: 2,
          active_project_id: projectId,
          primary_control_count: 1,
          foreign_control_count: 0,
        },
      );
      result.project_controls_two_project_isolation = true;
      completeDetailedField("project_controls_two_project_isolation");
      result.control_mutation_grants_created = 0;
      completeDetailedField("control_mutation_grants_created");
      result.control_mutation_runs_created = 0;
      completeDetailedField("control_mutation_runs_created");
      result.control_mutation_semantic_rows_created = 0;
      completeDetailedField("control_mutation_semantic_rows_created");
      result.control_mutation_personal_content_created = 0;
      completeDetailedField("control_mutation_personal_content_created");
      record("project_controls_enable_pause_resume_scope_restart_conflict_and_isolation");
    });

    await lifecycle.runPhase("operator_session_bootstrap", async () => {
      await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
        "locked review control session",
      );
      const privateBoundary = await lifecycle.authenticate({
        audit_bootstrap_replay: true,
      });
      assert.equal(privateBoundary, true);
      result.credential_material_in_dom = false;
      completeDetailedField("credential_material_in_dom");
      result.credential_material_in_server_log = false;
      completeDetailedField("credential_material_in_server_log");
      result.credential_private_material_boundary = true;
      record("bootstrap_token_absent_from_dom_and_server_log");
    });

    let strategicPath;
    await lifecycle.runPhase(
      "strategic_analysis_and_proposal_review",
      async () => {
        const sourcePath = `/workbench/semantic-review/${fixture.manifest.strategic_source_proposal_id.replace(":", "~")}`;
        await lifecycle.navigate(`${appOrigin}${sourcePath}`);
        await lifecycle.waitForCondition(
          `document.querySelector('[data-vnext-semantic-review-detail="v0.1"]') !== null && document.querySelector('[data-vnext-strategic-request="true"]') !== null`,
          "strategic source proposal detail",
        );
        const before = coreCounts(fixture.writable_database_path);
        const sourceShape = await lifecycle.evaluateJson(`(() => {
          const panel = document.querySelector('[data-vnext-strategic-advantage-transfer]');
          return {
            optional: panel?.getAttribute('data-vnext-strategic-optional') === 'true',
            request: panel?.querySelector('[data-vnext-strategic-request="true"]')?.textContent?.includes('Request bounded strategic analysis') === true,
            internal_inputs: panel?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
            load_copy: panel?.textContent?.includes('Nothing runs on page load') === true
          };
        })()`);
        assert.deepEqual(sourceShape, {
          optional: true,
          request: true,
          internal_inputs: 0,
          load_copy: true,
        });
        const responseStart = lifecycle.responses.length;
        assert.equal(
          await lifecycle.evaluateBoolean(`(() => {
            const button = document.querySelector('[data-vnext-strategic-request="true"]');
            if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
            button.click();
            return true;
          })()`),
          true,
        );
        await lifecycle.waitForHostCondition(
          () =>
            lifecycle.responses.slice(responseStart).some(
              (entry) =>
                entry.path === "/api/vnext/operator/semantic-review" &&
                entry.method === "POST" &&
                entry.status === 201,
            ),
          "strategic analysis admission",
        );
        await lifecycle.waitForCondition(
          `location.pathname.startsWith('/workbench/semantic-review/episode-delta-proposal~') && document.querySelector('[data-vnext-strategic-advantage-transfer="proposal"]') !== null`,
          "strategic proposal material",
        );
        strategicPath = await lifecycle.evaluateString("location.pathname");
        const strategicShape = await lifecycle.evaluateJson(`(() => {
          const panel = document.querySelector('[data-vnext-strategic-advantage-transfer="proposal"]');
          const text = panel?.textContent ?? '';
          return {
            pending: text.includes('pending review'),
            complete: ['Applicability','Expected effect','Transfer cost','Falsifier','Uncertainty','Stop conditions'].every((value) => text.includes(value)),
            non_authoritative: panel?.getAttribute('data-vnext-strategic-authoritative') === 'false',
            internal_inputs: panel?.querySelectorAll('input, textarea, [contenteditable="true"]').length ?? -1
          };
        })()`);
        assert.deepEqual(strategicShape, {
          pending: true,
          complete: true,
          non_authoritative: true,
          internal_inputs: 0,
        });
        const counter = JSON.parse(readFileSync(prepared.strategic_counter_path, "utf8"));
        assert.equal(counter.transport_calls, 1);
        assert.equal(coreCounts(fixture.writable_database_path).proposals, before.proposals + 1);
        result.strategic_profile_explicit_request = true;
        completeDetailedField("strategic_profile_explicit_request");
        result.strategic_model_gateway_fake_transport_calls = 1;
        completeDetailedField("strategic_model_gateway_fake_transport_calls");
        result.strategic_source_to_proposal_navigation = true;
        completeDetailedField("strategic_source_to_proposal_navigation");
        result.strategic_proposal_pending_unknown_non_authoritative = true;
        completeDetailedField("strategic_proposal_pending_unknown_non_authoritative");
        result.strategic_proposal_material_visible = true;
        completeDetailedField("strategic_proposal_material_visible");
        await lifecycle.waitForRequestQuiet();
        const inspectorHref = await lifecycle.evaluateString(
          `document.querySelector('[data-strategic-to-shared-inspector="true"]')?.getAttribute('href') ?? ''`,
        );
        assert.match(inspectorHref, /^\/workbench\/inspector\?/u);
        await lifecycle.navigate(new URL(inspectorHref, appOrigin).toString());
        await lifecycle.waitForCondition(
          `document.querySelector('[data-shared-project-inspector="v0.1"] [data-inspector-section="strategic_perspective"]') !== null`,
          "strategic exact Inspector",
        );
        result.strategic_shared_inspector_complete = true;
        completeDetailedField("strategic_shared_inspector_complete");
        await lifecycle.navigate(`${appOrigin}${strategicPath}`);
        await lifecycle.waitForCondition(
          `document.querySelector('[data-vnext-operator-decision-form="v0.1"]') !== null`,
          "strategic decision form",
        );
        const decisionBefore = coreCounts(fixture.writable_database_path);
        const strategicDecisionRoot =
          '[data-vnext-candidate-accept-eligible="false"] [data-vnext-operator-decision-form="v0.1"]';
        await lifecycle.setFormControlValue(
          `${strategicDecisionRoot} textarea`,
          "Defer this optional local transfer until a reviewer can supply stronger exact support.",
          0,
        );
        await lifecycle.setFormControlValue(
          `${strategicDecisionRoot} textarea`,
          "Revisit only when the accepted plan and exact source catalog remain current and stronger source material is available.",
          1,
        );
        const decisionResponseStart = lifecycle.responses.length;
        assert.equal(
          await lifecycle.evaluateBoolean(`(() => {
            const button = document.querySelector(${JSON.stringify(`${strategicDecisionRoot} button[type="submit"]`)});
            if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
            button.click();
            return true;
          })()`),
          true,
        );
        await lifecycle.waitForHostCondition(
          () =>
            lifecycle.responses.slice(decisionResponseStart).some(
              (entry) =>
                entry.path === "/api/vnext/operator/semantic-review" &&
                entry.method === "POST" &&
                (entry.status === 200 || entry.status === 201),
            ),
          "strategic defer decision response",
        );
        await lifecycle.waitForCondition(
          `document.querySelector('[data-vnext-decision-history="v0.1"]')?.textContent?.includes('defer') === true && document.querySelector('[data-vnext-semantic-transition-actions="v0.1"]') === null`,
          "strategic defer without Transition",
        );
        assert.equal(
          coreCounts(fixture.writable_database_path).decisions,
          decisionBefore.decisions + 1,
        );
        result.strategic_candidate_defer_no_transition = true;
        completeDetailedField("strategic_candidate_defer_no_transition");
        const reloadBefore = databaseFingerprint(fixture.writable_database_path);
        await lifecycle.cdp().send("Page.reload", { ignoreCache: true });
        await lifecycle.waitForCondition(
          `document.querySelector('[data-vnext-strategic-advantage-transfer="proposal"]') !== null`,
          "strategic proposal reload",
        );
        assert.equal(databaseFingerprint(fixture.writable_database_path), reloadBefore);
        assert.equal(
          JSON.parse(readFileSync(prepared.strategic_counter_path, "utf8"))
            .transport_calls,
          1,
        );
        result.strategic_proposal_reload_idempotent = true;
        completeDetailedField("strategic_proposal_reload_idempotent");
        record("strategic_source_explicitly_admits_exact_pending_unknown_proposal_without_internal_input");
        record("strategic_proposal_full_material_lineage_and_non_authority_render");
        record("strategic_candidate_defer_records_decision_without_transition_or_packet_change");
        record("strategic_proposal_reload_creates_no_model_or_semantic_write");
      },
    );

    renameSync(
      prepared.strategic_fixture_path,
      prepared.strategic_fixture_retired_path,
    );
    await lifecycle.restartRuntime(projectId);

    let resultProposalHref;
    await lifecycle.runPhase("result_review_and_inspector", async () => {
      await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
      assert.equal(await lifecycle.authenticate(), true);
      const resultIdentity = readLatestResultIdentity(
        fixture.writable_database_path,
        projectId,
      );
      const resultHref = `/workbench/results/${resultIdentity.receipt_id.replace(":", "~")}`;
      const before = databaseFingerprint(fixture.writable_database_path);
      const resultNavigationStart = lifecycle.responses.length;
      await lifecycle.navigate(`${appOrigin}${resultHref}`);
      await lifecycle.waitForHostCondition(
        () =>
          lifecycle.responses.slice(resultNavigationStart).some(
            (entry) =>
              entry.path === resultHref &&
              entry.type === "Document",
          ),
        "result review document response",
      );
      const resultDocumentResponse = lifecycle.responses
        .slice(resultNavigationStart)
        .find(
          (entry) =>
            entry.path === resultHref && entry.type === "Document",
        );
      assert.equal(
        resultDocumentResponse?.status,
        200,
        `result_review_document_status:${resultDocumentResponse?.status ?? "missing"}`,
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-run-result-review="v0.1"][data-result-review-read-only="true"][data-semantic-mutation="false"]') !== null`,
        "read-only result review",
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-run-result-proposal="available"] [data-result-to-proposal-link="true"]') !== null && document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"][data-ai-workplane-guide-status="available"][data-ai-workplane-guide-loading="false"]') !== null`,
        "result proposal and GuideBrief settlement",
      );
      const shape = await lifecycle.evaluateJson(`(() => {
        const review = document.querySelector('[data-run-result-review="v0.1"]');
        const assessment = review?.querySelector('[data-task-success-criteria="available"]');
        const text = review?.textContent ?? '';
        const assessmentText = assessment?.textContent ?? '';
        return {
          shell: document.querySelector('[data-ai-workplane-shell="v0.1"]') !== null,
          read_only: review?.getAttribute('data-result-review-read-only') === 'true',
          proposal_link: review?.querySelector('[data-result-to-proposal-link="true"]')?.getAttribute('href') ?? null,
          assessment: assessment !== null &&
            assessment?.getAttribute('data-assessment-authoritative') === 'false',
          execution_and_success:
            assessment?.getAttribute('data-task-success-status') === 'unknown' &&
            assessmentText.includes('Execution completed / task success unknown'),
          internal_input_count: review?.querySelectorAll('input, textarea, [contenteditable="true"]').length ?? -1,
          copy_paste_count: Array.from(document.querySelectorAll('button, a, textarea')).filter((entry) => /copy|paste|handoff capsule|launch card/i.test(entry.textContent ?? '')).length
        };
      })()`);
      const shapeDiagnostic = JSON.stringify(shape);
      assert.equal(shape.shell, true, shapeDiagnostic);
      assert.equal(shape.read_only, true, shapeDiagnostic);
      assert.match(shape.proposal_link ?? "", /^\/workbench\/semantic-review\//u);
      assert.equal(shape.assessment, true, shapeDiagnostic);
      assert.equal(shape.execution_and_success, true, shapeDiagnostic);
      assert.equal(shape.internal_input_count, 0, shapeDiagnostic);
      assert.equal(shape.copy_paste_count, 0, shapeDiagnostic);
      resultProposalHref = shape.proposal_link;
      assert.equal(databaseFingerprint(fixture.writable_database_path), before);
      result.workbench_result_review_read_only = true;
      completeDetailedField("workbench_result_review_read_only");
      result.shared_semantic_workbench_shell = true;
      completeDetailedField("shared_semantic_workbench_shell");
      result.task_success_criterion_assessment = true;
      completeDetailedField("task_success_criterion_assessment");
      result.execution_task_success_separated = true;
      completeDetailedField("execution_task_success_separated");
      result.result_review_semantic_authority_unchanged = true;
      completeDetailedField("result_review_semantic_authority_unchanged");
      result.packet_copy_actions = 0;
      completeDetailedField("packet_copy_actions");
      result.handoff_capsule_copy_actions = 0;
      completeDetailedField("handoff_capsule_copy_actions");
      result.core_handoff_copy_actions = 0;
      completeDetailedField("core_handoff_copy_actions");
      result.launch_card_copy_actions = 0;
      completeDetailedField("launch_card_copy_actions");
      result.result_paste_actions = 0;
      completeDetailedField("result_paste_actions");
      result.result_report_textarea_interactions = 0;
      completeDetailedField("result_report_textarea_interactions");
      result.native_host_clipboard_calls = 0;
      completeDetailedField("native_host_clipboard_calls");
      result.internal_id_entry_actions = 0;
      completeDetailedField("internal_id_entry_actions");
      result.work_closures_created = 0;
      completeDetailedField("work_closures_created");
      const inspectorHref = await lifecycle.evaluateString(
        `document.querySelector('[data-run-result-to-shared-inspector="true"], [data-result-to-shared-inspector="true"], [data-run-result-inspector-forwarding] a')?.getAttribute('href') ?? ''`,
      );
      assert.match(inspectorHref, /^\/workbench\/inspector\?/u);
      await lifecycle.navigate(new URL(inspectorHref, appOrigin).toString());
      await lifecycle.waitForCondition(
        `document.querySelector('[data-shared-project-inspector="v0.1"]') !== null`,
        "result shared Inspector",
      );
      const inspector = await lifecycle.evaluateJson(`(() => {
        const root = document.querySelector('[data-shared-project-inspector="v0.1"]');
        const text = root?.textContent ?? '';
        const visibleText = root?.innerText ?? '';
        const sections = Array.from(root?.querySelectorAll('[data-inspector-section]') ?? []);
        const identities = Array.from(root?.querySelectorAll('[data-contextual-inspector-exact-identity]') ?? []);
        const primary = Array.from(root?.querySelectorAll('[data-contextual-inspector-primary-section-count] > [data-inspector-section]') ?? []);
        const additional = root?.querySelector('[data-contextual-inspector-additional-records="true"]');
        return {
          contextual_version: root?.getAttribute('data-contextual-inspector'),
          read_only: root?.getAttribute('data-inspector-read-only'),
          semantic_mutation: root?.getAttribute('data-inspector-semantic-mutation'),
          target_kind: root?.getAttribute('data-inspector-target-kind'),
          section_count: sections.length,
          primary_section_kinds: primary.map((entry) => entry.getAttribute('data-inspector-section')),
          primary_section_count: primary.length,
          additional_closed: additional instanceof HTMLDetailsElement && !additional.open,
          return_href: root?.querySelector('[data-contextual-inspector-return="result"]')?.getAttribute('href') ?? null,
          h1_count: root?.querySelectorAll('h1').length ?? -1,
          contextual_first_view: root?.querySelector('[data-contextual-inspector-heading]') !== null &&
            root?.querySelector('[data-contextual-inspector-about="true"]') !== null &&
            root?.getAttribute('data-contextual-inspector-exact-status') !== null,
          first_view_identity_absent: !visibleText.includes('sha256:') &&
            !visibleText.includes(${JSON.stringify(resultIdentity.receipt_id)}),
          visible_protocol_absent: !/Shared Inspector|RunReceipt|TaskContextPacket|ReviewDecision|StateTransitionReceipt|packet fingerprint|exact lineage/iu.test(visibleText),
          forms: root?.querySelectorAll('form').length ?? -1,
          semantic_controls: root ? Array.from(root.querySelectorAll('button, input, textarea, select')).filter((entry) =>
            /decision|accept|reject|defer|supersede|retract|gate|transition|apply|evidence/iu.test(entry.getAttribute('aria-label') ?? entry.textContent ?? '')
          ).length : -1,
          exact_identity_collapsed: identities.length > 0 && identities.every((entry) => !entry.open),
          authority: text.includes('These details are read-only') &&
            text.includes('No model, provider, filesystem mutation, or external action is available here.'),
          private_root_visible: text.includes(${JSON.stringify(readProjectRoot(fixture.writable_database_path, projectId))}),
          raw_secret_visible: /OPENAI_API_KEY|sk-proj-|raw diff must never be persisted|jsonrpc/iu.test(text),
          server_scoped: root?.getAttribute('data-inspector-server-scoped') !== 'false'
        };
      })()`);
      assert.deepEqual(inspector, {
        contextual_version: "contextual_inspector_view.v0.1",
        read_only: "true",
        semantic_mutation: "false",
        target_kind: "run_receipt",
        section_count: 13,
        primary_section_kinds: [
          "run_receipt",
          "criterion_basis",
          "integration_capability",
          "timeline",
        ],
        primary_section_count: 4,
        additional_closed: true,
        return_href: resultHref,
        h1_count: 1,
        contextual_first_view: true,
        first_view_identity_absent: true,
        visible_protocol_absent: true,
        forms: 0,
        semantic_controls: 0,
        exact_identity_collapsed: true,
        authority: true,
        private_root_visible: false,
        raw_secret_visible: false,
        server_scoped: true,
      });
      result.result_inspector_complete = true;
      completeDetailedField("result_inspector_complete");
      result.shared_inspector_read_only = true;
      completeDetailedField("shared_inspector_read_only");
      result.shared_inspector_server_scoped = true;
      completeDetailedField("shared_inspector_server_scoped");
      result.applied_inspector_lineage_complete = true;
      completeDetailedField("applied_inspector_lineage_complete");
      await lifecycle.cdp().send("Page.reload", { ignoreCache: true });
      await lifecycle.waitForCondition(
        `document.querySelector('[data-shared-project-inspector="v0.1"]') !== null`,
        "Inspector reload",
      );
      assert.equal(databaseFingerprint(fixture.writable_database_path), before);
      result.shared_inspector_reload_idempotent = true;
      completeDetailedField("shared_inspector_reload_idempotent");
      const liveInspectorRead = await lifecycle.evaluateJson(`(async () => {
        const response = await fetch('/api/vnext/operator/inspector' + location.search, {
          method: 'GET', cache: 'no-store', credentials: 'same-origin'
        });
        return { status: response.status, body: await response.json() };
      })()`);
      assert.equal(liveInspectorRead.status, 200);
      assert.equal(liveInspectorRead.body?.status, "inspector_read");
      assert.equal(liveInspectorRead.body?.project_activity, "active");
      assert.equal(
        liveInspectorRead.body?.inspector?.target?.target_kind,
        "run_receipt",
      );
      const renderProductionInspectorState = async ({
        href,
        status,
        body_classification,
        condition,
        label,
        expected_console_error = false,
      }) => {
        const requestStart = lifecycle.requests.length;
        const responseStart = lifecycle.responses.length;
        const consoleStart = lifecycle.console_errors.length;
        await lifecycle.navigate(new URL(href, appOrigin).toString());
        await lifecycle.waitForCondition(condition, label);
        await lifecycle.waitForRequestQuiet();
        await lifecycle.waitForHostCondition(
          () =>
            lifecycle.responses
              .slice(responseStart)
              .some(
                (entry) =>
                  entry.path === "/api/vnext/operator/inspector" &&
                  entry.body_classification !== null,
              ),
          `${label} response classification`,
        );
        const requests = lifecycle.requests.slice(requestStart).filter(
          (entry) =>
            entry.path === "/api/vnext/operator/inspector" &&
            entry.method === "GET",
        );
        const responses = lifecycle.responses.slice(responseStart).filter(
          (entry) =>
            entry.path === "/api/vnext/operator/inspector" &&
            entry.method === "GET",
        );
        assert.equal(requests.length, 1);
        assert.equal(responses.length, 1);
        assert.equal(responses[0].request_id, requests[0].request_id);
        assert.equal(responses[0].phase, "result_review_and_inspector");
        assert.equal(responses[0].status, status);
        assert.deepEqual(
          responses[0].body_classification,
          body_classification,
        );
        const matchingConsole = lifecycle.console_errors
          .slice(consoleStart)
          .filter(
            (entry) => entry.network_request_id === responses[0].request_id,
          );
        assert.equal(matchingConsole.length, expected_console_error ? 1 : 0);
        if (expected_console_error) {
          expectedInspectorConsoleDeliveries.set(responses[0].request_id, {
            phase: "result_review_and_inspector",
            route: "/api/vnext/operator/inspector",
            status,
            body_classification,
            expected_delivery_count: 1,
          });
        }
        return responses[0];
      };
      const missingInspectorUrl = new URL(inspectorHref, appOrigin);
      missingInspectorUrl.searchParams.set(
        "record_id",
        "run-receipt:operator-inspector-production-missing",
      );
      await renderProductionInspectorState({
        href: missingInspectorUrl.toString(),
        status: 404,
        body_classification: {
          classification: "inspector_error",
          error_code: "shared_inspector_target_missing",
        },
        condition:
          `document.querySelector('[data-contextual-inspector-state="missing"] h1')?.textContent?.trim() === 'The exact target is no longer available'`,
        label: "Inspector missing exact state",
        expected_console_error: true,
      });
      assert.equal(
        await lifecycle.evaluateBoolean(`(() => {
          const state = document.querySelector('[data-contextual-inspector-state="missing"]');
          const text = state?.innerText ?? '';
          return text.includes('The requested exact record could not be resolved. No substitute record was selected.') &&
            !text.includes('Exact details could not be read');
        })()`),
        true,
      );
      const conflictInspectorUrl = new URL(inspectorHref, appOrigin);
      conflictInspectorUrl.searchParams.set(
        "fingerprint",
        `sha256:${"0".repeat(64)}`,
      );
      await renderProductionInspectorState({
        href: conflictInspectorUrl.toString(),
        status: 409,
        body_classification: {
          classification: "inspector_error",
          error_code: "shared_inspector_target_fingerprint_conflict",
        },
        condition:
          `document.querySelector('[data-contextual-inspector-state="conflict"] h1')?.textContent?.trim() === 'The saved exact sources no longer agree'`,
        label: "Inspector conflicting exact state",
        expected_console_error: true,
      });
      assert.equal(
        await lifecycle.evaluateBoolean(`(() => {
          const state = document.querySelector('[data-contextual-inspector-state="conflict"]');
          const text = state?.innerText ?? '';
          return text.includes('The exact source conflict was preserved.') &&
            !text.includes('no longer available') && state?.querySelectorAll('form').length === 0 &&
            !Array.from(state?.querySelectorAll('button') ?? []).some((entry) => /make active|switch project|repair/i.test(entry.textContent ?? ''));
        })()`),
        true,
      );
      const inspectorRouteFixture = fixture.manifest.inspector_route_fixture;
      assert(inspectorRouteFixture);
      assert.equal(
        inspectorRouteFixture.unavailable_browser_disposition,
        "pure_presentation_contract_only_no_production_failure_seam",
      );
      await lifecycle.restartRuntime(inspectorRouteFixture.project_id);
      await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
      assert.equal(await lifecycle.authenticate(), true);
      const boundedInspectorUrl = new URL("/workbench/inspector", appOrigin);
      boundedInspectorUrl.searchParams.set("target", "run_receipt");
      boundedInspectorUrl.searchParams.set(
        "record_id",
        inspectorRouteFixture.bounded_receipt_id,
      );
      boundedInspectorUrl.searchParams.set(
        "fingerprint",
        inspectorRouteFixture.bounded_receipt_fingerprint,
      );
      await renderProductionInspectorState({
        href: boundedInspectorUrl.toString(),
        status: 200,
        body_classification: {
          classification: "inspector_read",
          status: "inspector_read",
          project_activity: "inactive_read_only",
          target_kind: "run_receipt",
          target_status: "bounded_incomplete",
          completeness: "bounded_incomplete",
        },
        condition:
          `document.querySelector('[data-shared-project-inspector="v0.1"][data-contextual-inspector-exact-status="bounded_incomplete"][data-contextual-inspector-project-activity="inactive_read_only"]') !== null`,
        label: "production Inspector bounded inactive projection",
      });
      const projectionShape = await lifecycle.evaluateJson(`(() => {
          const root = document.querySelector('[data-shared-project-inspector="v0.1"]');
          const status = root?.querySelector('[data-contextual-inspector-status-block]');
          const notice = root?.querySelector('[data-contextual-inspector-activity-notice="true"]');
          const text = root?.innerText ?? '';
          return {
            exact_status: root?.getAttribute('data-contextual-inspector-exact-status') ?? null,
            project_activity: root?.getAttribute('data-contextual-inspector-project-activity') ?? null,
            status_label: status?.querySelector('h2')?.textContent?.trim() ?? null,
            status_role: status?.getAttribute('role') ?? null,
            activity_notice_count: root?.querySelectorAll('[data-contextual-inspector-activity-notice="true"]').length ?? -1,
            activity_copy: notice?.textContent?.replace(/\\s+/g, ' ').trim() ?? null,
            contradictory_availability_absent: !text.includes('The exact detail remains available as a read-only view.'),
            mutation_control_absent: !Array.from(root?.querySelectorAll('button, form') ?? []).some((entry) => /make active|switch project|repair/i.test(entry.textContent ?? ''))
          };
        })()`);
      assert.deepEqual(projectionShape, {
        exact_status: "bounded_incomplete",
        project_activity: "inactive_read_only",
        status_label: "This is a bounded exact view",
        status_role: "status",
        activity_notice_count: 1,
        activity_copy:
          "This project is not current. These details remain read-only, and opening them did not switch projects.",
        contradictory_availability_absent: true,
        mutation_control_absent: true,
      });
      assert.equal(databaseFingerprint(fixture.writable_database_path), before);
      await lifecycle.restartRuntime(projectId);
      await lifecycle.navigate(`${appOrigin}${resultHref}`);
      assert.equal(await lifecycle.authenticate(), true);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-run-result-review="v0.1"]') !== null`,
        "result reload durability",
      );
      observedTimelineStates.add("result_ready");
      result.workbench_result_reload_durable = true;
      completeDetailedField("workbench_result_reload_durable");
      const beforeProposalReview = databaseFingerprint(
        fixture.writable_database_path,
      );
      const proposalRequestStart = lifecycle.requests.length;
      await lifecycle.navigate(new URL(resultProposalHref, appOrigin).toString());
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-semantic-review-detail="v0.1"] [data-vnext-decision-workbench="v0.1"]') !== null`,
        "result-linked proposal review",
      );
      const proposalReviewShape = await lifecycle.evaluateJson(`(() => {
        const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
        const canonical = detail?.querySelector('[data-vnext-decision-workbench="v0.1"]');
        const strategic = detail?.querySelector('[data-vnext-strategic-advantage-transfer="unavailable"]');
        const visibleText = detail?.innerText ?? '';
        const strategicText = strategic?.textContent ?? '';
        const criteria = Array.from(canonical?.querySelectorAll('[data-criterion-status]') ?? []);
        return {
          decision_centered: Boolean(canonical) &&
            canonical?.getAttribute('data-project-verify-reconciliation-version') === 'project_verify_reconciliation.v0.1' &&
            canonical?.textContent?.includes('What was intended and which context was selected') &&
            canonical?.textContent?.includes('What happened, and what was observed versus reported') &&
            canonical?.textContent?.includes('Success criteria and their exact basis') &&
            canonical?.textContent?.includes('Evidence, Claims, contradiction, qualification, and uncertainty'),
          canonical_reconciliation: criteria.length > 0 &&
            criteria.some((entry) => entry.getAttribute('data-criterion-status') === 'satisfied' && entry.getAttribute('data-criterion-basis') === 'observed') &&
            criteria.some((entry) => entry.getAttribute('data-criterion-status') === 'unknown' && entry.getAttribute('data-criterion-basis') === 'insufficient') &&
            canonical?.querySelector('[data-evidence-authentication="verified"]') !== null &&
            canonical?.querySelector('[data-relation-kind="supports"]') !== null &&
            canonical?.textContent?.includes('Acceptance: not accepted by record existence') &&
            canonical?.textContent?.includes('truth not established') &&
            canonical?.textContent?.includes('relation is not proof'),
          protocol_hidden: !visibleText.includes('sha256:') &&
            !visibleText.includes('Confirmation digest') &&
            !visibleText.includes('Gate record ID'),
          timeline_first: detail?.getAttribute('data-selected-work-timeline') === 'selected_work_timeline.v0.1' &&
            detail?.querySelector('[aria-label="Selected work meaningful timeline"]') !== null &&
            detail?.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1 &&
            detail?.querySelector('[data-selected-work-next-step="review_focused"]') !== null,
          timeline_non_authoritative: detail?.querySelector('[data-selected-work-projection-only="true"][data-selected-work-semantic-authority="false"]') !== null &&
            Array.from(detail?.querySelectorAll('[data-selected-work-timeline-item]') ?? []).every((entry) => entry.getAttribute('data-selected-work-timeline-authority') === 'false'),
          pending_review: detail?.getAttribute('data-vnext-proposal-status') === 'pending_review',
          no_decision_or_transition: detail?.getAttribute('data-vnext-selected-decision-count') === '0' &&
            detail?.getAttribute('data-vnext-transition-status') === 'not_applied',
          primary_action_count: detail?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? -1,
          exact_lineage_handoff: detail?.querySelector('[data-workbench-to-shared-inspector="true"]') !== null &&
            detail?.querySelector('[data-receipt-to-shared-inspector="true"]') !== null,
          protocol_details_disclosed: Array.from(detail?.querySelectorAll('details') ?? []).some((entry) => entry.querySelector('summary')?.textContent?.includes('Advanced review') === true && entry.open === false),
          strategic_optional_unavailable:
            strategic?.getAttribute('data-vnext-strategic-optional') === 'true' &&
            strategic?.getAttribute('data-vnext-strategic-authoritative') === 'false' &&
            strategic?.getAttribute('data-vnext-strategic-readback-status') === 'unavailable' &&
            strategicText.includes('Bounded strategic local transfer'),
          strategic_no_analysis_on_load:
            strategicText.includes('Nothing runs on page load') &&
            strategic?.querySelector('[data-vnext-strategic-request="true"]') === null &&
            strategic?.querySelector('[data-vnext-strategic-review-link="true"]') === null,
          strategic_no_internal_inputs:
            strategic?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length === 0,
          strategic_zero_model_review_preserved:
            strategicText.includes('source proposal remains available for normal zero-model review') &&
            strategicText.includes('grants no decision, Transition') &&
            strategicText.includes('later-context') &&
            strategicText.includes('authority')
        };
      })()`);
      assert.deepEqual(proposalReviewShape, {
        decision_centered: true,
        canonical_reconciliation: true,
        protocol_hidden: true,
        timeline_first: true,
        timeline_non_authoritative: true,
        pending_review: true,
        no_decision_or_transition: true,
        primary_action_count: 1,
        exact_lineage_handoff: true,
        protocol_details_disclosed: true,
        strategic_optional_unavailable: true,
        strategic_no_analysis_on_load: true,
        strategic_no_internal_inputs: true,
        strategic_zero_model_review_preserved: true,
      });
      assert.equal(
        databaseFingerprint(fixture.writable_database_path),
        beforeProposalReview,
      );
      assert.equal(
        lifecycle.requests
          .slice(proposalRequestStart)
          .some(
            (entry) =>
              entry.method === "POST" &&
              entry.path === "/api/vnext/operator/semantic-review",
          ),
        false,
      );
      observedTimelineStates.add("proposal_pending");
      result.strategic_profile_optional_unavailable = true;
      completeDetailedField("strategic_profile_optional_unavailable");
      result.strategic_profile_no_analysis_on_load = true;
      completeDetailedField("strategic_profile_no_analysis_on_load");
      result.strategic_profile_no_internal_id_input = true;
      completeDetailedField("strategic_profile_no_internal_id_input");
      result.strategic_profile_zero_model_review_preserved = true;
      completeDetailedField("strategic_profile_zero_model_review_preserved");
      result.result_to_proposal_navigation = true;
      completeDetailedField("result_to_proposal_navigation");
      result.proposal_verify_summary = true;
      completeDetailedField("proposal_verify_summary");
      result.decision_centered_workbench = true;
      completeDetailedField("decision_centered_workbench");
      result.canonical_reconciliation_visible = true;
      completeDetailedField("canonical_reconciliation_visible");
      result.protocol_details_progressively_disclosed = true;
      completeDetailedField("protocol_details_progressively_disclosed");
      result.selected_work_timeline_first = true;
      completeDetailedField("selected_work_timeline_first");
      result.semantic_proposals_created = 3;
      completeDetailedField("semantic_proposals_created");
      result.review_decisions_created = 1;
      completeDetailedField("review_decisions_created");
      result.semantic_transitions_created = 1;
      completeDetailedField("semantic_transitions_created");
      record("workbench_result_review_and_inspector_reload_from_immutable_durable_state");
      record("result_links_to_exact_pending_run_assessment_proposal_without_manual_ids");
      record("result_review_creates_no_proposal_decision_transition_evidence_or_work_closure");
      record("optional_strategic_profile_load_is_read_only_unavailable_and_zero_model_safe");
      record("contextual_inspector_route_errors_preserve_missing_conflict_and_unavailable");
      record("contextual_inspector_exact_status_remains_primary_for_inactive_projects");
    });

    await lifecycle.runPhase("review_decision_and_transition", async () => {
      assert.match(resultProposalHref, /^\/workbench\/semantic-review\//u);
      await lifecycle.navigate(`${appOrigin}${resultProposalHref}`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-semantic-review-detail="v0.1"]') !== null`,
        "operation-aware proposal",
      );
      const before = coreCounts(fixture.writable_database_path);
      const sourceProposalPath = await lifecycle.evaluateString("location.pathname");
      const operationShape = await lifecycle.evaluateJson(`(() => {
        const form = document.querySelector('[data-vnext-operation-revision-form="v0.1"]');
        const decisionRoot = document.querySelector('[data-vnext-candidate-id="selected-decision"]');
        const decisionForm = decisionRoot?.querySelector('[data-vnext-operator-decision-form="v0.1"]');
        const accept = decisionForm?.querySelector('option[value="accept"]');
        return {
          revision_form_present: Boolean(form),
          validation_lane_locked: Boolean(form?.querySelector('[data-vnext-server-selected-delta-lane="validation_delta"]')),
          unrestricted_lane_absent: !Array.from(form?.querySelectorAll('select') ?? []).some((select) => Array.from(select.options).some((option) => option.value === 'memory_delta')),
          original_accept_eligible: decisionRoot?.getAttribute('data-vnext-candidate-accept-eligible') ?? null,
          original_accept_disabled: accept instanceof HTMLOptionElement ? accept.disabled : null,
          internal_identifier_inputs: form?.querySelectorAll('input[name*="id" i], input[name*="fingerprint" i], input[name*="nonce" i], input[name*="gate" i], input[name*="checksum" i]').length ?? -1
        };
      })()`);
      assert.deepEqual(operationShape, {
        revision_form_present: true,
        validation_lane_locked: true,
        unrestricted_lane_absent: true,
        original_accept_eligible: "false",
        original_accept_disabled: true,
        internal_identifier_inputs: 0,
      });
      await lifecycle.setFormControlValue(
        '[data-vnext-operation-revision-form="v0.1"] textarea',
        "Create an explicit bounded validation-state operation while preserving the immutable unknown assessment.",
        1,
      );
      assert.equal(
        await lifecycle.evaluateBoolean(`(() => {
          const button = document.querySelector('[data-vnext-operation-revision-form="v0.1"] button[type="submit"]');
          if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
          button.click();
          return true;
        })()`),
        true,
      );
      await lifecycle.waitForCondition(
        `location.pathname !== ${JSON.stringify(sourceProposalPath)} && document.querySelector('[data-vnext-operation-revision="v0.1"]') !== null && document.querySelector('[data-vnext-candidate-accept-eligible="true"] [data-vnext-operator-decision-form="v0.1"]') !== null`,
        "immutable operation-aware revision detail",
      );
      assert.equal(coreCounts(fixture.writable_database_path).proposals, before.proposals + 1);
      result.operation_aware_revision_created = true;
      completeDetailedField("operation_aware_revision_created");
      record("workbench_creates_immutable_operation_aware_revision_without_internal_ids");

      const eligibleDecisionRoot =
        '[data-vnext-candidate-accept-eligible="true"] [data-vnext-operator-decision-form="v0.1"]';
      await lifecycle.setFormControlValue(`${eligibleDecisionRoot} select`, "accept");
      await lifecycle.setFormControlValue(
        `${eligibleDecisionRoot} textarea`,
        "Accept this separately reviewable create operation; application remains subject to independent gate and state checks.",
      );
      assert.equal(
        await lifecycle.evaluateBoolean(`(() => {
          const button = document.querySelector(${JSON.stringify(`${eligibleDecisionRoot} button[type="submit"]`)});
          if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
          button.click();
          return true;
        })()`),
        true,
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-transition-action="preview"]:not([disabled])') !== null && document.querySelector('[data-vnext-decision-history="v0.1"] li') !== null`,
        "persisted explicit ReviewDecision",
      );
      result.explicit_review_decision_created = true;
      completeDetailedField("explicit_review_decision_created");
      observedTimelineStates.add("decision_recorded");
      assert.equal(coreCounts(fixture.writable_database_path).decisions, before.decisions + 1);
      assert.equal(coreCounts(fixture.writable_database_path).transitions, before.transitions);
      record("workbench_records_explicit_decision_without_applying_transition");
      const relationshipShape = await lifecycle.evaluateJson(`(() => {
        const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
        const relationships = detail?.querySelector('[data-selected-work-relationships="selected_work_relationships.v0.1"]');
        const selector = relationships?.querySelector('[data-selected-work-relationship-question-selector="true"]');
        return {
          stage: detail?.getAttribute('data-selected-work-current-stage') ?? null,
          question: relationships?.getAttribute('data-selected-work-relationship-question') ?? null,
          selected_question: selector instanceof HTMLSelectElement ? selector.value : null,
          highlighted_count: relationships?.querySelectorAll('[data-selected-work-relationship-highlighted="true"]').length ?? -1,
          relationship_primary_actions: relationships?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? -1,
          detail_primary_actions: detail?.querySelectorAll('[data-ai-workplane-primary-action]').length ?? -1
        };
      })()`);
      assert.deepEqual(relationshipShape, {
        stage: "awaiting_application",
        question: "candidate_and_decision",
        selected_question: "candidate_and_decision",
        highlighted_count: 1,
        relationship_primary_actions: 0,
        detail_primary_actions: 1,
      });
      record("selected_work_relationship_explains_awaiting_application_decision");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"][data-ai-workplane-guide-loading="false"]') !== null`,
        "GuideBrief settled before transition preview",
      );
      const guideBefore = await lifecycle.evaluateJson(`(() => {
        const shell = document.querySelector('[data-ai-workplane-shell="v0.1"]');
        const rail = document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"]');
        return {
          request_count: Number(shell?.getAttribute('data-ai-workplane-guide-request-count') ?? '-1'),
          focus: rail?.querySelector('[data-guide-brief-review-focus="true"]')?.textContent?.trim() ?? ''
        };
      })()`);
      assert.equal(Number.isSafeInteger(guideBefore.request_count), true);
      assert.equal(guideBefore.request_count >= 2, true);
      assert.notEqual(guideBefore.focus, "");
      const beforePreview = databaseFingerprint(fixture.writable_database_path);
      const transitionRequestStart = lifecycle.requests.length;
      await clickTransitionAction(lifecycle, "preview");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-transition-step="preview"][data-vnext-transition-step-status="prepared"][data-vnext-transition-preview-write="false"]') !== null`,
        "read-only operation-aware transition preview",
      );
      assert.equal(databaseFingerprint(fixture.writable_database_path), beforePreview);
      assert.equal(
        await lifecycle.evaluateJson(`Number(document.querySelector('[data-ai-workplane-shell="v0.1"]')?.getAttribute('data-ai-workplane-guide-request-count') ?? '-1')`),
        guideBefore.request_count,
      );
      const guideAfterImpactCount = await lifecycle.evaluateJson(
        `Number(document.querySelector('[data-ai-workplane-shell="v0.1"]')?.getAttribute('data-ai-workplane-guide-request-count') ?? '-1')`,
      );
      result.transition_preview_read_only = true;
      completeDetailedField("transition_preview_read_only");
      await reviewTransitionCheckbox(lifecycle, "preview");
      await clickTransitionAction(lifecycle, "confirm");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-transition-step="confirmation"][data-vnext-transition-step-status="recorded"][data-vnext-transition-confirm-state-applied="false"] input[type="checkbox"]:not(:disabled)') !== null`,
        "separate semantic gate confirmation",
      );
      assert.equal(coreCounts(fixture.writable_database_path).gates, before.gates + 1);
      assert.equal(coreCounts(fixture.writable_database_path).transitions, before.transitions);
      const guideAfterConfirmationCount = await lifecycle.evaluateJson(
        `Number(document.querySelector('[data-ai-workplane-shell="v0.1"]')?.getAttribute('data-ai-workplane-guide-request-count') ?? '-1')`,
      );
      result.semantic_gate_separate_from_transition = true;
      completeDetailedField("semantic_gate_separate_from_transition");
      record("semantic_gate_persists_without_transition_state_or_packet");
      await reviewTransitionCheckbox(lifecycle, "confirmation");
      await clickTransitionAction(lifecycle, "apply");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="project_updated"]') !== null && document.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1`,
        "atomic semantic Transition and later packet",
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-ai-workplane-shell="v0.1"]')?.getAttribute('data-ai-workplane-guide-request-count') === ${JSON.stringify(String(guideBefore.request_count + 1))} && document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"][data-ai-workplane-guide-loading="false"]') !== null`,
        "GuideBrief refreshed once after project application",
      );
      const afterApplyCounts = coreCounts(fixture.writable_database_path);
      assert.equal(afterApplyCounts.transitions, before.transitions + 1);
      assert.equal(afterApplyCounts.packets, before.packets + 1);
      const transitionRequests = lifecycle.requests
        .slice(transitionRequestStart)
        .filter(
          (entry) =>
            entry.path === "/api/vnext/operator/semantic-transition",
        );
      const transitionRequestCounts = {
        preview_get: transitionRequests.filter((entry) => entry.method === "GET")
          .length,
        confirm_post: transitionRequests.filter(
          (entry) =>
            entry.method === "POST" &&
            JSON.parse(entry.post_data ?? "{}").action === "confirm",
        ).length,
        apply_post: transitionRequests.filter(
          (entry) =>
            entry.method === "POST" &&
            JSON.parse(entry.post_data ?? "{}").action === "apply",
        ).length,
      };
      assert.deepEqual(transitionRequestCounts, {
        preview_get: 1,
        confirm_post: 1,
        apply_post: 1,
      });
      result.semantic_transition_applied = true;
      completeDetailedField("semantic_transition_applied");
      observedTimelineStates.add("transition_applied");
      result.later_packet_compiled = true;
      completeDetailedField("later_packet_compiled");
      const guideAfter = await lifecycle.evaluateJson(`(() => {
        const shell = document.querySelector('[data-ai-workplane-shell="v0.1"]');
        const rail = document.querySelector('[data-ai-workplane-guide="guide_brief.v0.2"]');
        return {
          request_count: Number(shell?.getAttribute('data-ai-workplane-guide-request-count') ?? '-1'),
          project: rail?.querySelector('strong')?.textContent?.trim() ?? '',
          focus: rail?.querySelector('[data-guide-brief-review-focus="true"]')?.textContent?.trim() ?? ''
        };
      })()`);
      assert.equal(guideAfter.request_count, guideBefore.request_count + 1);
      assert.notEqual(guideAfter.project, "");
      assert.notEqual(guideAfter.focus, "");
      result.guide_brief_transition_request_counts = {
        before_impact: guideBefore.request_count,
        after_impact: guideAfterImpactCount,
        after_confirmation: guideAfterConfirmationCount,
        after_application: guideAfter.request_count,
        application_delta: 1,
      };
      assert.deepEqual(result.guide_brief_transition_request_counts, {
        before_impact: guideBefore.request_count,
        after_impact: guideBefore.request_count,
        after_confirmation: guideBefore.request_count,
        after_application: guideBefore.request_count + 1,
        application_delta: 1,
      });
      completeDetailedField("guide_brief_transition_request_counts");
      result.guide_brief_post_application_consistent = true;
      completeDetailedField("guide_brief_post_application_consistent");
      const afterApply = databaseFingerprint(fixture.writable_database_path);
      await lifecycle.cdp().send("Page.reload", { ignoreCache: true });
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-semantic-review-detail="v0.1"]') !== null`,
        "applied proposal reload",
      );
      assert.equal(databaseFingerprint(fixture.writable_database_path), afterApply);
      result.semantic_transition_reload_idempotent = true;
      completeDetailedField("semantic_transition_reload_idempotent");
      result.selected_work_timeline_state_coverage = [
        "result_ready",
        "proposal_pending",
        "decision_recorded",
        "transition_applied",
      ];
      assert.deepEqual(
        new Set(result.selected_work_timeline_state_coverage),
        observedTimelineStates,
      );
      completeDetailedField("selected_work_timeline_state_coverage");
      record("reviewed_create_transition_receipt_and_later_packet_apply_atomically");
      record("selected_work_relationship_explains_exact_project_update");
      record("workbench_reload_reads_durable_lineage_without_duplicate_writes");
    });

    await lifecycle.runPhase(
      "operator_session_refusal_recovery",
      async () => {
        assert.match(fixture.manifest.profile_project_id, /^project:/u);
        const responseStart = lifecycle.responses.length;
        const consoleStart = lifecycle.console_errors.length;
        await lifecycle.restartRuntimePreservingBrowserSession(
          fixture.manifest.profile_project_id,
        );
        await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
        await lifecycle.waitForCondition(
          `document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
          "mixed-project stale session locked",
        );
        const staleRefusals = lifecycle.responses
          .slice(responseStart)
          .filter(
            (entry) =>
              entry.path === "/api/vnext/operator/session" &&
              entry.method === "GET" &&
              entry.status === 403,
          );
        assert.equal(staleRefusals.length, 1);
        const staleRefusal = staleRefusals[0];
        await lifecycle.waitForHostCondition(
          () =>
            lifecycle.console_errors.slice(consoleStart).some(
              (entry) =>
                entry.network_request_id === staleRefusal.request_id &&
                entry.text ===
                  "Failed to load resource: the server responded with a status of 403 (Forbidden)",
            ),
          "exact mixed-project stale session console refusal",
        );
        const recovered = await lifecycle.authenticate();
        assert.equal(recovered, true);
        const authenticated = await lifecycle.evaluateJson(`(async () => {
          const response = await fetch('/api/vnext/operator/session', {
            cache: 'no-store', credentials: 'same-origin'
          });
          return { status: response.status, body: await response.json() };
        })()`);
        assert.equal(authenticated.status, 200);
        assert.equal(authenticated.body.ok, true);
        assert.equal(authenticated.body.status, "authenticated");
        const authenticatedResponse = lifecycle.responses
          .slice(responseStart)
          .find(
            (entry) =>
              entry.path === "/api/vnext/operator/session" &&
              entry.method === "GET" &&
              entry.status === 200,
          );
        assert(authenticatedResponse);
        assert.notEqual(staleRefusal.request_id, authenticatedResponse.request_id);
        result.expected_refusal_accounting_complete = true;
        completeDetailedField("expected_refusal_accounting_complete");
        result.expected_stale_session_refusal_response_count = 1;
        completeDetailedField("expected_stale_session_refusal_response_count");
        result.expected_stale_session_refusal_log_count = 1;
        completeDetailedField("expected_stale_session_refusal_log_count");
        result.expected_refusal_duplicate_delivery_count = 0;
        completeDetailedField("expected_refusal_duplicate_delivery_count");
        result.authenticated_session_recovery_response_count = 1;
        completeDetailedField("authenticated_session_recovery_response_count");
        result.expected_refusal_accounting_summary = {
          raw_console_events_preserved: true,
          tokens: [
            {
              token_id: "operator-review-control-stale-session",
              refusal_status: staleRefusal.status,
              refusal_request_id: staleRefusal.request_id,
              refusal_response_count: 1,
              refusal_log_count: 1,
              authenticated_request_id: authenticatedResponse.request_id,
              authenticated_recovery_response_count: 1,
            },
          ],
          duplicate_deliveries: [],
        };
        completeDetailedField("expected_refusal_accounting_summary");
        result.credential_private_material_boundary = true;
        record("expected_refusal_accounting_tracks_exact_request_identity");
        record("stale_session_refusal_recovers_as_separate_authenticated_request");
        record("raw_console_events_preserved_for_global_audit");
      },
      { request_quiet: false },
    );

    result.packet_root_run_result_proposal_decision_transition_identity = {
      packet_id: fixture.manifest.packet_id,
      packet_fingerprint: fixture.manifest.packet_fingerprint,
      result_proposal_href: resultProposalHref,
      strategic_proposal_path: strategicPath,
      project_id: fixture.manifest.project_id,
    };
  },
});

function allowExpectedInspectorConsoleDelivery(entry) {
  const expected = expectedInspectorConsoleDeliveries.get(
    entry.network_request_id,
  );
  if (!expected) return false;
  const deliveryCount =
    (consumedInspectorConsoleDeliveries.get(entry.network_request_id) ?? 0) + 1;
  consumedInspectorConsoleDeliveries.set(entry.network_request_id, deliveryCount);
  return (
    deliveryCount === expected.expected_delivery_count &&
    entry.phase === expected.phase &&
    entry.request_path === expected.route &&
    entry.response_status === expected.status &&
    entry.response_body_classification?.classification ===
      expected.body_classification.classification &&
    entry.response_body_classification?.error_code ===
      expected.body_classification.error_code &&
    entry.text ===
      `Failed to load resource: the server responded with a status of ${entry.response_status} (${entry.response_status === 404 ? "Not Found" : entry.response_status === 409 ? "Conflict" : "Internal Server Error"})`
  );
}

async function activateCurrentProject(lifecycle, projectId) {
  if (
    await lifecycle.evaluateBoolean(
      `document.querySelector('[data-blank-state-active="false"]') !== null`,
    )
  ) {
    assert.equal(
      await lifecycle.evaluateBoolean(`(() => {
        const button = Array.from(document.querySelectorAll('button[data-blank-state-primary-action="make_active"]')).find((entry) => entry.getBoundingClientRect().width > 0);
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click(); return true;
      })()`),
      true,
    );
    await lifecycle.waitForCondition(
      `document.querySelector('[data-blank-state-active="true"]') !== null`,
      `active project ${projectId}`,
    );
  }
}

async function openProjectOptions(lifecycle) {
  await lifecycle.waitForCondition(
    `(() => {
      const details = Array.from(document.querySelectorAll('details[data-blank-state-project-settings-recovery="true"]')).find((entry) => entry.closest('[data-blank-state-project-management-hydrated="true"]'));
      if (!(details instanceof HTMLDetailsElement)) return false;
      details.open = true;
      return details.querySelector('[data-blank-state-project-options="true"]')?.getBoundingClientRect().width > 0;
    })()`,
    "visible project control options",
  );
}

async function clickButton(lifecycle, text) {
  assert.equal(
    await lifecycle.evaluateBoolean(`(() => {
      const button = Array.from(document.querySelectorAll('button')).find((entry) => entry.textContent?.trim() === ${JSON.stringify(text)} && entry.getBoundingClientRect().width > 0);
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
      button.click(); return true;
    })()`),
    true,
  );
}

async function clickTransitionAction(lifecycle, action) {
  assert.equal(
    await lifecycle.evaluateBoolean(`(() => {
      const button = document.querySelector('[data-vnext-transition-action=${action}]');
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
      button.click();
      return true;
    })()`),
    true,
  );
}

async function reviewTransitionCheckbox(lifecycle, step) {
  assert.equal(
    await lifecycle.evaluateBoolean(`(() => {
      const checkbox = document.querySelector('[data-vnext-transition-step="${step}"] input[type="checkbox"]');
      if (!(checkbox instanceof HTMLInputElement) || checkbox.disabled) return false;
      checkbox.click();
      return checkbox.checked;
    })()`),
    true,
  );
}

function readControlState(databasePath, projectId) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    return database
      .prepare(
        "SELECT enabled, paused, revision FROM vnext_project_automation_controls WHERE project_id = ?",
      )
      .get(projectId);
  } finally {
    database.close();
  }
}

function readControlRows(databasePath) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    return database
      .prepare("SELECT project_id, enabled, paused, revision FROM vnext_project_automation_controls ORDER BY project_id")
      .all();
  } finally {
    database.close();
  }
}

function readProjectControlIsolation(
  databasePath,
  primaryProjectId,
  foreignProjectId,
) {
  assert.match(foreignProjectId, /^project:/u);
  assert.notEqual(foreignProjectId, primaryProjectId);
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    return {
      registered_project_count: Number(
        database
          .prepare("SELECT COUNT(*) AS count FROM vnext_project_identities")
          .get().count,
      ),
      active_project_id: String(
        database
          .prepare(
            "SELECT project_id FROM vnext_active_project_selections LIMIT 1",
          )
          .get()?.project_id ?? "",
      ),
      primary_control_count: Number(
        database
          .prepare(
            "SELECT COUNT(*) AS count FROM vnext_project_automation_controls WHERE project_id = ?",
          )
          .get(primaryProjectId).count,
      ),
      foreign_control_count: Number(
        database
          .prepare(
            "SELECT COUNT(*) AS count FROM vnext_project_automation_controls WHERE project_id = ?",
          )
          .get(foreignProjectId).count,
      ),
    };
  } finally {
    database.close();
  }
}

function coreCounts(databasePath) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const count = (kind) =>
      Number(
        database
          .prepare("SELECT COUNT(*) AS count FROM vnext_core_records WHERE record_kind = ?")
          .get(kind).count,
      );
    return {
      packets: count("task_context_packet"),
      proposals: count("episode_delta_proposal"),
      decisions: count("review_decision"),
      gates: count("semantic_commit_gate"),
      transitions: count("state_transition_receipt"),
    };
  } finally {
    database.close();
  }
}

function readLatestResultIdentity(databasePath, projectId) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const row = database
      .prepare(
        `SELECT record_id FROM vnext_core_records
          WHERE project_id = ? AND record_kind = 'run_receipt'
          ORDER BY created_at DESC, record_id DESC LIMIT 1`,
      )
      .get(projectId);
    assert(row);
    return { receipt_id: row.record_id };
  } finally {
    database.close();
  }
}

function readProjectRoot(databasePath, projectId) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const root = String(
      database
        .prepare(
          "SELECT normalized_root FROM vnext_project_root_bindings WHERE project_id = ?",
        )
        .get(projectId)?.normalized_root ?? "",
    );
    assert.notEqual(root, "");
    return root;
  } finally {
    database.close();
  }
}

function databaseFingerprint(databasePath) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const rows = database
      .prepare(
        "SELECT record_kind, record_id, fingerprint FROM vnext_core_records ORDER BY record_kind, record_id",
      )
      .all();
    return JSON.stringify(rows);
  } finally {
    database.close();
  }
}
