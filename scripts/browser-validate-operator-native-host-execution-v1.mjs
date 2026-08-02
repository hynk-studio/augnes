#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry.ts";
import { runOperatorExecutionBrowserChildV1 } from "./operator-execution-browser-child-v1.mjs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const CHILD_ID = "operator-native-host-execution";
const VALIDATION_SCOPE = "operator-native-host-execution";
assert(
  ["operator-native-host-execution"].includes(VALIDATION_SCOPE),
  "unsupported operator native-host execution scope",
);
const LIVE_TIMEOUT_MS = 90_000;

await runOperatorExecutionBrowserChildV1({
  child_id: CHILD_ID,
  prepare: async ({ fixture, temporary_root }) => ({
    project_id: fixture.manifest.profile_project_id,
    approval_trace_path: path.join(
      temporary_root,
      "browser-approval-barriers.jsonl",
    ),
    second_approval_release_path: path.join(
      temporary_root,
      "browser-second-approval.release",
    ),
    terminal_release_path: path.join(
      temporary_root,
      "browser-terminal.release",
    ),
  }),
  console_allowlist: (entry) =>
    ([
      "first_work_definition_and_start",
      "live_native_host_approval_lifecycle",
    ].includes(entry.phase) &&
      entry.request_path === "/api/vnext/operator/session" &&
      entry.response_status === 401 &&
      entry.text ===
        "Failed to load resource: the server responded with a status of 401 (Unauthorized)") ||
    ([
      "first_work_definition_and_start",
      "direct_native_host_round_trip",
      "live_native_host_approval_lifecycle",
      "bounded_automation_execution",
    ].includes(entry.phase) &&
      entry.request_path === "/favicon.ico" &&
      entry.response_status === 404 &&
      entry.text ===
        "Failed to load resource: the server responded with a status of 404 (Not Found)"),
  request_failure_allowlist: (entry) =>
    entry.phase === "first_work_definition_and_start" &&
    entry.path === "/workbench/semantic-review" &&
    entry.error_text === "net::ERR_ABORTED",
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
    const firstWorkProjectId = fixture.manifest.profile_project_id;
    assert.match(firstWorkProjectId, /^project:/u);
    const firstWorkGoal =
      "Preserve exact packet and project-root binding through one explicit local operation.";
    const criteria = [
      "The saved definition creates no run",
      "Explicit activation admits one exact run",
    ];
    const nonGoals = [
      "Do not write project files",
      "Do not select or invoke an external provider",
    ];

    await lifecycle.runPhase("first_work_definition_and_start", async () => {
      await lifecycle.navigate(`${appOrigin}/workbench/semantic-review#first-work`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-operator-session="locked"]') !== null && document.querySelector('[data-first-work-composer]') === null`,
        "locked first-work operator state",
      );
      result.first_work_locked_operator_state = true;
      completeDetailedField("first_work_locked_operator_state");
      assert.equal(await lifecycle.authenticate(), true);
      result.credential_private_material_boundary = true;
      await lifecycle.waitForCondition(
        `document.querySelector('[data-first-work-composer="project_work_initialization.v0.1"][data-first-work-state="not_defined"]') !== null`,
        "first-work setup state",
      );
      const setupState = readFirstWorkState(
        fixture.writable_database_path,
        firstWorkProjectId,
      );
      assert.deepEqual(setupState, {
        packets: 0,
        receipts: 0,
        proposals: 0,
        decisions: 0,
        transitions: 0,
        semantic_state: 0,
        runs: 0,
      });
      result.first_work_setup_state = true;
      completeDetailedField("first_work_setup_state");
      await lifecycle.waitForCondition(
        `document.activeElement?.id === 'first-work-goal'`,
        "first-work goal focus",
      );
      assert.equal(
        await lifecycle.evaluateBoolean(
          `document.querySelector('[data-first-work-action="save"]')?.disabled === true`,
        ),
        true,
      );
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-goal"]',
        firstWorkGoal,
      );
      await lifecycle.waitForCondition(
        `document.body.textContent.includes('Add at least one success criterion.') && document.querySelector('[data-first-work-action="save"]')?.disabled === true`,
        "first-work criteria refusal",
      );
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-success-criteria"]',
        criteria.join("\n"),
      );
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-goal"]',
        "",
      );
      await lifecycle.waitForCondition(
        `document.body.textContent.includes('Enter the project goal before saving.') && document.querySelector('[data-first-work-action="save"]')?.disabled === true`,
        "first-work goal refusal",
      );
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-goal"]',
        "🚀".repeat(2_000),
      );
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-success-criteria"]',
        "The complete Unicode goal remains executable",
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-first-work-action="save"]:not(:disabled)') !== null`,
        "first-work Unicode boundary",
      );
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-goal"]',
        "🚀".repeat(2_001),
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-first-work-action="save"]')?.disabled === true && document.body.textContent.includes('Shorten the goal to 2,000 characters or fewer.')`,
        "first-work Unicode over-boundary refusal",
      );
      const exactDefinition = firstWorkDefinitionAtJsonBytes(12_000);
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-goal"]',
        exactDefinition.goal,
      );
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-success-criteria"]',
        exactDefinition.success_criteria.join("\n"),
      );
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-non-goals"]',
        exactDefinition.non_goals.join("\n"),
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-first-work-action="save"]:not(:disabled)') !== null`,
        "first-work exact byte boundary",
      );
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-non-goals"]',
        [
          ...exactDefinition.non_goals.slice(0, -1),
          `${exactDefinition.non_goals.at(-1)}x`,
        ].join("\n"),
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-first-work-action="save"]')?.disabled === true && document.body.textContent.includes('Shorten the complete definition')`,
        "first-work byte over-boundary refusal",
      );
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-goal"]',
        firstWorkGoal,
      );
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-success-criteria"]',
        criteria.join("\n"),
      );
      await lifecycle.setFormControlValue(
        'textarea[name="first-work-non-goals"]',
        nonGoals.join("\n"),
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-first-work-action="save"]:not(:disabled)') !== null`,
        "first-work valid definition",
      );
      assert.equal(
        await lifecycle.evaluateBoolean(`(() => {
          const goal = document.querySelector('textarea[name="first-work-goal"]');
          const criteria = document.querySelector('textarea[name="first-work-success-criteria"]');
          const nonGoals = document.querySelector('textarea[name="first-work-non-goals"]');
          const save = document.querySelector('[data-first-work-action="save"]');
          return [goal, criteria, nonGoals, save].every((entry) => entry instanceof HTMLElement) &&
            Boolean(goal.compareDocumentPosition(criteria) & Node.DOCUMENT_POSITION_FOLLOWING) &&
            Boolean(criteria.compareDocumentPosition(nonGoals) & Node.DOCUMENT_POSITION_FOLLOWING) &&
            Boolean(nonGoals.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING);
        })()`),
        true,
      );
      result.first_work_composer_validation = true;
      completeDetailedField("first_work_composer_validation");
      const saveRequestStart = lifecycle.requests.length;
      const saveResponseStart = lifecycle.responses.length;
      assert.equal(
        await lifecycle.evaluateBoolean(`(() => {
          const form = document.querySelector('[data-first-work-composer] form');
          if (!(form instanceof HTMLFormElement)) return false;
          form.requestSubmit(); form.requestSubmit(); return true;
        })()`),
        true,
      );
      await lifecycle.waitForHostCondition(
        () =>
          lifecycle.responses.slice(saveResponseStart).some(
            (entry) =>
              entry.path === "/api/vnext/operator/project-continuity" &&
              entry.method === "POST" &&
              entry.status === 201,
          ),
        "first-work save",
      );
      const saveResponse = lifecycle.responses
        .slice(saveResponseStart)
        .find(
          (entry) =>
            entry.path === "/api/vnext/operator/project-continuity" &&
            entry.method === "POST",
        );
      assert(saveResponse);
      const saveResponseBody = await lifecycle.cdp().send(
        "Network.getResponseBody",
        { requestId: saveResponse.request_id },
      );
      const savedBody = JSON.parse(saveResponseBody.body);
      assert.deepEqual(
        {
          status: savedBody.status,
          run_created: savedBody.run_created,
          execution_started: savedBody.execution_started,
          provider_called: savedBody.provider_called,
          project_files_written: savedBody.project_files_written,
          proposal_created: savedBody.proposal_created,
          review_decision_created: savedBody.review_decision_created,
          transition_created: savedBody.transition_created,
          semantic_state_changed: savedBody.semantic_state_changed,
        },
        {
          status: "inserted",
          run_created: false,
          execution_started: false,
          provider_called: false,
          project_files_written: false,
          proposal_created: false,
          review_decision_created: false,
          transition_created: false,
          semantic_state_changed: false,
        },
      );
      assert.equal(
        lifecycle.requests
          .slice(saveRequestStart)
          .filter(
            (entry) =>
              entry.path === "/api/vnext/operator/project-continuity" &&
              entry.method === "POST",
          ).length,
        1,
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-first-work-composer]') === null && document.body.textContent.includes('First work defined. No execution has started.') && document.querySelector('[data-delegated-work-action="start"]:not(:disabled)') !== null`,
        "first work saved without execution",
      );
      const saved = readFirstWorkState(
        fixture.writable_database_path,
        firstWorkProjectId,
      );
      assert.deepEqual(saved, {
        packets: 1,
        receipts: 0,
        proposals: 0,
        decisions: 0,
        transitions: 0,
        semantic_state: 0,
        runs: 0,
      });
      result.first_work_saved_without_execution = true;
      completeDetailedField("first_work_saved_without_execution");
      result.first_work_start_eligible = true;
      completeDetailedField("first_work_start_eligible");
      await lifecycle.cdp().send("Page.reload", { ignoreCache: true });
      await lifecycle.waitForCondition(
        `document.querySelector('[data-delegated-work-action="start"]:not(:disabled)') !== null && document.body.textContent.includes(${JSON.stringify(firstWorkGoal)})`,
        "first-work reload persistence",
      );
      result.first_work_reload_persisted = true;
      completeDetailedField("first_work_reload_persisted");
      await lifecycle.navigate(`${appOrigin}/`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-blank-state="v0.1"]')?.textContent?.includes(${JSON.stringify(firstWorkGoal)}) === true && document.querySelector('[data-blank-state-focus="first_work_not_defined"]') === null`,
        "Project Home saved first-work goal",
      );
      const guideGoal = await lifecycle.evaluateJson(`(async () => {
        const response = await fetch('/api/augnes/read/guide-brief?scope=project%3Aaugnes', {
          headers: { 'x-augnes-local-readonly': 'guide-brief-v0.2' }, cache: 'no-store'
        });
        const body = await response.json();
        return {
          coordinate: body.coordinate?.goal,
          chatgpt: body.projections?.chatgpt?.goal,
          codex: body.projections?.codex?.current_goal,
          workplane: body.projections?.ai_workplane?.current_goal
        };
      })()`);
      assert.deepEqual(new Set(Object.values(guideGoal)), new Set([firstWorkGoal]));
      result.first_work_goal_cross_surface = true;
      completeDetailedField("first_work_goal_cross_surface");
      await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-delegated-work-action="start"]:not(:disabled)') !== null`,
        "separate first-work host start action",
      );
      const firstWorkStartResponse = lifecycle.responses.length;
      assert.equal(
        await lifecycle.evaluateBoolean(`(() => {
          const button = document.querySelector('[data-delegated-work-action="start"]');
          if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
          button.click(); return true;
        })()`),
        true,
      );
      await lifecycle.waitForHostCondition(
        () =>
          lifecycle.responses.slice(firstWorkStartResponse).some(
            (entry) =>
              entry.path === "/api/vnext/operator/host-round-trip" &&
              entry.method === "POST" &&
              entry.status === 202,
          ),
        "first-work explicit start",
      );
      const firstRun = await waitForLiveState(
        fixture.writable_database_path,
        firstWorkProjectId,
        "waiting_for_approval",
        LIVE_TIMEOUT_MS,
      );
      assert.equal(firstRun.packet_lineage_kind, "initial_user_defined");
      assert.equal(firstRun.source_transition_receipt_id, null);
      assert.match(firstRun.first_work_definition_id, /^first-work-definition:/u);
      const initialTurnStart = traceEntries(prepared.approval_trace_path).find(
        (entry) =>
          entry.kind === "received" && entry.value?.method === "turn/start",
      );
      assert.deepEqual(
        {
          guide_brief_section: initialTurnStart?.value.guide_brief_section,
          guide_brief_version_v0_2:
            initialTurnStart?.value.guide_brief_version_v0_2,
          task_context_packet_section:
            initialTurnStart?.value.task_context_packet_section,
          guide_before_task_context_packet:
            initialTurnStart?.value.guide_before_task_context_packet,
        },
        {
          guide_brief_section: true,
          guide_brief_version_v0_2: true,
          task_context_packet_section: true,
          guide_before_task_context_packet: true,
        },
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-delegated-work-stage="waiting_for_approval"] [data-delegated-work-action="cancel"]:not(:disabled)') !== null`,
        "first-work admitted cancellation boundary",
      );
      result.first_work_explicit_start_admitted = true;
      completeDetailedField("first_work_explicit_start_admitted");
      await lifecycle.navigate("about:blank");
      await lifecycle.terminateRuntime();
    }, { request_quiet: false });

    selectFixtureActiveProject(
      fixture.writable_database_path,
      fixture.manifest.workspace_id,
      fixture.manifest.project_id,
    );
    await lifecycle.restartRuntime(fixture.manifest.project_id);
    await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
    assert.equal(await lifecycle.authenticate(), true);
    rmSync(prepared.approval_trace_path, { force: true });

    let directAfter;
    await lifecycle.runPhase("direct_native_host_round_trip", async () => {
      await lifecycle.navigate(
        `${appOrigin}/projects/${encodeURIComponent(fixture.manifest.project_id)}`,
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-blank-state="v0.1"]') !== null`,
        "native-host Project Home",
      );
      await activateProject(lifecycle);
      await lifecycle.waitForCondition(
        `Array.from(document.querySelectorAll('[data-blank-state="v0.1"][data-blank-state-active="true"][data-blank-state-project-management-hydrated="true"]')).some((entry) => entry.getBoundingClientRect().width > 0)`,
        "hydrated active native-host Project Home",
      );
      const managementShape = await lifecycle.evaluateJson(`(() => {
        const roots = Array.from(document.querySelectorAll('[data-blank-state="v0.1"]')).map((entry) => ({
          visible: entry.getBoundingClientRect().width > 0,
          active: entry.getAttribute('data-blank-state-active'),
          hydrated: entry.getAttribute('data-blank-state-project-management-hydrated'),
          presentation: entry.getAttribute('data-blank-state-presentation'),
          details_count: entry.querySelectorAll('details[data-blank-state-project-settings-recovery="true"]').length,
          options_count: entry.querySelectorAll('[data-blank-state-project-options="true"]').length,
          direct_host_count: entry.querySelectorAll('[data-direct-host-round-trip="v0.3"]').length
        }));
        return { roots };
      })()`);
      assert.equal(
        managementShape.roots.some(
          (entry) =>
            entry.visible &&
            entry.active === "true" &&
            entry.options_count === 1 &&
            entry.direct_host_count === 1,
        ),
        true,
        JSON.stringify(managementShape),
      );
      await openProjectOptions(lifecycle);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-direct-host-round-trip="v0.3"] [data-direct-host-action="deterministic"]') !== null`,
        "deterministic direct-host action",
      );
      result.direct_host_project_home_active = true;
      completeDetailedField("direct_host_project_home_active");
      const actionShape = await lifecycle.evaluateJson(`(() => {
        const root = document.querySelector('[data-direct-host-round-trip="v0.3"]');
        const labels = root
          ? Array.from(root.querySelectorAll('button, a')).map((entry) => entry.textContent?.trim() ?? '')
          : [];
        return {
          action_present: Boolean(root),
          form_field_count: root?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
          start_button_count: root?.querySelectorAll('[data-direct-host-action="deterministic"]').length ?? -1,
          live_control_count: root?.querySelectorAll('[data-delegated-work-action], [data-live-host-action]').length ?? -1,
          copy_or_paste_action: labels.some((label) => /copy|paste/i.test(label)),
          retired_control_count: Array.from(document.querySelectorAll('button, a')).filter((entry) =>
            /copy taskcontextpacket|handoff capsule|core handoff|launch card|paste result|result report/i.test(entry.textContent ?? '')
          ).length,
          result_textarea_count: document.querySelectorAll('textarea[name*="result" i], textarea[data-result-report], [data-result-paste]').length
        };
      })()`);
      assert.deepEqual(actionShape, {
        action_present: true,
        form_field_count: 0,
        start_button_count: 1,
        live_control_count: 0,
        copy_or_paste_action: false,
        retired_control_count: 0,
        result_textarea_count: 0,
      });
      result.direct_host_no_copy_paste = true;
      completeDetailedField("direct_host_no_copy_paste");
      const before = directState(
        fixture.writable_database_path,
        fixture.manifest.project_id,
      );
      const requestStart = lifecycle.requests.length;
      const responseStart = lifecycle.responses.length;
      await clickSelector(lifecycle, '[data-direct-host-action="deterministic"]');
      await lifecycle.waitForHostCondition(
        () =>
          lifecycle.responses.slice(responseStart).some(
            (entry) =>
              entry.path === "/api/vnext/operator/host-round-trip" &&
              entry.method === "POST",
          ),
        "deterministic direct-host response",
      );
      const request = lifecycle.requests
        .slice(requestStart)
        .find(
          (entry) =>
            entry.path === "/api/vnext/operator/host-round-trip" &&
            entry.method === "POST",
        );
      assert.equal(request?.post_data, "{}");
      result.direct_host_request_body_empty = true;
      completeDetailedField("direct_host_request_body_empty");
      const response = lifecycle.responses.find(
        (entry) => entry.request_id === request?.request_id,
      );
      result.direct_host_status = response?.status ?? null;
      completeDetailedField("direct_host_status");
      if (response?.status !== 201) {
        const responseBody = response?.request_id
          ? await lifecycle
              .cdp()
              .send("Network.getResponseBody", {
                requestId: response.request_id,
              })
              .catch(() => ({ body: "unavailable" }))
          : { body: "missing" };
        assert.equal(
          response?.status,
          201,
          `deterministic_direct_host_refused:${responseBody.body}`,
        );
      }
      await lifecycle.waitForCondition(
        `document.querySelector('[data-direct-host-round-trip-status="completed"]') !== null && document.body.textContent.includes('Result saved')`,
        "deterministic result persisted",
      );
      directAfter = directState(
        fixture.writable_database_path,
        fixture.manifest.project_id,
      );
      assert.equal(directAfter.direct_receipts, before.direct_receipts + 1);
      assert.equal(directAfter.runs, before.runs + 1);
      assert.deepEqual(directAfter.semantic_authority_counts, {
        ...before.semantic_authority_counts,
        proposals: before.semantic_authority_counts.proposals + 1,
      });
      assert(directAfter.latest_receipt);
      assert(directAfter.packet);
      assert.equal(directAfter.latest_receipt.workspace_id, fixture.manifest.workspace_id);
      assert.equal(directAfter.latest_receipt.project_id, fixture.manifest.project_id);
      assert.equal(
        directAfter.latest_receipt.task_context_packet_ref?.external_id,
        fixture.manifest.packet_id,
      );
      assert.equal(
        directAfter.latest_receipt.task_context_packet_ref?.source_ref,
        fixture.manifest.packet_fingerprint,
      );
      assert.equal(
        directAfter.latest_receipt.work_ref?.external_id,
        typeof directAfter.packet.work_ref === "string"
          ? directAfter.packet.work_ref
          : directAfter.packet.work_ref?.external_id,
      );
      assert.equal(
        directAfter.latest_receipt.source_refs.some(
          (entry) =>
            entry.ref_type === "state_transition_receipt" &&
            entry.external_id === fixture.manifest.transition_receipt_id &&
            entry.source_ref === fixture.manifest.transition_receipt_fingerprint,
        ),
        true,
      );
      assert.equal(
        directAfter.latest_receipt.compatibility.external_refs.some(
          (entry) =>
            entry.ref_type === "task_definition" &&
            entry.external_id === `${fixture.manifest.packet_id}:task`,
        ),
        true,
      );
      assert.equal(
        directAfter.latest_receipt.compatibility.external_refs.some(
          (entry) =>
            entry.ref_type === "project_root_scope" &&
            entry.external_id === fixture.manifest.project_id &&
            /^sha256:[a-f0-9]{64}$/u.test(entry.source_ref ?? ""),
        ),
        true,
      );
      assert.equal(
        directAfter.latest_receipt.execution_environment.runtime_labels.includes(
          "interactive",
        ),
        true,
      );
      assert.equal(directAfter.latest_receipt.result_summary.outcome, "completed");
      assert.deepEqual(
        {
          raw_prompt_persisted:
            directAfter.latest_receipt.privacy_egress.raw_prompt_persisted,
          raw_output_persisted:
            directAfter.latest_receipt.privacy_egress.raw_output_persisted,
          raw_transcript_persisted:
            directAfter.latest_receipt.privacy_egress.raw_transcript_persisted,
          secret_material_persisted:
            directAfter.latest_receipt.privacy_egress.secret_material_persisted,
        },
        {
          raw_prompt_persisted: false,
          raw_output_persisted: false,
          raw_transcript_persisted: false,
          secret_material_persisted: false,
        },
      );
      for (const [key, value] of Object.entries(
        directAfter.latest_receipt.authority_summary,
      )) {
        if (key !== "notes") assert.equal(value, false, key);
      }
      assert.equal(
        JSON.stringify(directAfter.latest_receipt).includes(
          directAfter.normalized_root,
        ),
        false,
      );
      result.direct_host_receipt_persisted = true;
      completeDetailedField("direct_host_receipt_persisted");
      result.direct_host_packet_bound = true;
      completeDetailedField("direct_host_packet_bound");
      record("active_project_direct_host_round_trip_persists_exact_packet_receipt");
      record("direct_host_round_trip_has_zero_copy_paste_or_internal_id_input");
    });

    await lifecycle.runPhase("live_native_host_approval_lifecycle", async () => {
      const aiWorkplaneMountRequestStart = lifecycle.requests.length;
      await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-delegated-work="delegated_work_projection.v0.1"]') !== null`,
        "live delegated work projection",
      );
      const initialReads = lifecycle.requests
        .slice(aiWorkplaneMountRequestStart)
        .filter(
        (entry) =>
          entry.path === "/api/vnext/operator/host-round-trip" &&
          entry.method === "GET",
      ).length;
      assert.equal(initialReads, 1);
      result.delegated_work_single_initial_read = true;
      completeDetailedField("delegated_work_single_initial_read");
      const liveRequestStart = lifecycle.requests.length;
      const responseStart = lifecycle.responses.length;
      await clickSelector(lifecycle, '[data-delegated-work-action="start"]');
      await lifecycle.waitForHostCondition(
        () =>
          lifecycle.responses.slice(responseStart).some(
            (entry) =>
              entry.path === "/api/vnext/operator/host-round-trip" &&
              entry.status === 202,
          ),
        "managed-live start",
      );
      const firstApproval = await waitForLiveState(
        fixture.writable_database_path,
        fixture.manifest.project_id,
        "waiting_for_approval",
        LIVE_TIMEOUT_MS,
      );
      assert(firstApproval.pending_approval);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-delegated-work-stage="waiting_for_approval"] [data-delegated-work-action="approve-once"]:not(:disabled)') !== null`,
        "first approval control",
      );
      const pendingShape = await lifecycle.evaluateJson(`(() => {
        const root = document.querySelector('[data-delegated-work="delegated_work_projection.v0.1"]');
        return {
          form_field_count: root?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
          approval_present: document.querySelector('[data-delegated-work-approval="pending"]') !== null,
          approve_once_present: document.querySelector('[data-delegated-work-action="approve-once"]') !== null,
          polling: root?.getAttribute('data-delegated-work-polling') ?? null,
          primary_action_count: document.querySelectorAll('[data-ai-workplane-primary-action]').length,
          raw_protocol_visible: /jsonrpc|OPENAI_API_KEY/u.test(document.body.textContent ?? '')
        };
      })()`);
      assert.deepEqual(pendingShape, {
        form_field_count: 0,
        approval_present: true,
        approve_once_present: true,
        polling: "false",
        primary_action_count: 1,
        raw_protocol_visible: false,
      });
      result.live_codex_waiting_for_approval = true;
      completeDetailedField("live_codex_waiting_for_approval");
      result.project_home_current_run_visible = true;
      completeDetailedField("project_home_current_run_visible");
      const pollingCount = lifecycle.requests.filter(
        (entry) =>
          entry.path === "/api/vnext/operator/host-round-trip" &&
          entry.method === "GET",
      ).length;
      const pollingObservedAt = Date.now();
      await lifecycle.waitForHostCondition(
        () => Date.now() - pollingObservedAt >= 900,
        "approval polling observation",
        2_000,
      );
      assert.equal(
        lifecycle.requests.filter(
          (entry) =>
            entry.path === "/api/vnext/operator/host-round-trip" &&
            entry.method === "GET",
        ).length,
        pollingCount,
      );
      result.live_codex_untouched_approval_polling_stopped = true;
      completeDetailedField("live_codex_untouched_approval_polling_stopped");
      const turnStartsBefore = traceMethodCount(prepared.approval_trace_path, "turn/start");
      await lifecycle.navigate(`${appOrigin}/`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-delegated-work-summary="waiting_for_approval"]') !== null`,
        "Project Home managed-live resumption",
      );
      await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-delegated-work-action="approve-once"]:not(:disabled)') !== null`,
        "same managed-live run after return",
      );
      assert.equal(traceMethodCount(prepared.approval_trace_path, "turn/start"), turnStartsBefore);
      assert.equal(
        readLatestLiveProjection(
          fixture.writable_database_path,
          fixture.manifest.project_id,
        ).run_ref,
        firstApproval.run_ref,
      );
      result.live_codex_leave_return_same_run = true;
      completeDetailedField("live_codex_leave_return_same_run");
      result.live_codex_leave_return_no_new_turn = true;
      completeDetailedField("live_codex_leave_return_no_new_turn");
      const firstApprovalResponseStart = lifecycle.responses.length;
      await clickSelector(lifecycle, '[data-delegated-work-action="approve-once"]');
      await lifecycle.waitForHostCondition(
        () =>
          lifecycle.responses.slice(firstApprovalResponseStart).some(
            (entry) =>
              entry.path === "/api/vnext/operator/host-round-trip" &&
              entry.method === "POST" &&
              entry.status === 200,
          ),
        "first approval response",
      );
      await waitForLiveState(
        fixture.writable_database_path,
        fixture.manifest.project_id,
        "running",
        LIVE_TIMEOUT_MS,
      );
      const runningAfterFirst = readLatestLiveProjection(
        fixture.writable_database_path,
        fixture.manifest.project_id,
      );
      assert.equal(runningAfterFirst.run_ref, firstApproval.run_ref);
      assert.equal(runningAfterFirst.pending_approval, null);
      assert.equal(
        runningAfterFirst.control_revision > firstApproval.control_revision,
        true,
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-delegated-work-stage="working"]') !== null && document.querySelector('[data-delegated-work-stage="working"]')?.querySelectorAll('[data-augnes-primary-action]').length === 0`,
        "managed-live working projection after first approval",
      );
      const turnStartsBeforeProgressVisit = traceMethodCount(
        prepared.approval_trace_path,
        "turn/start",
      );
      await lifecycle.navigate(`${appOrigin}/`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-blank-state="v0.1"]') !== null`,
        "Project Home while managed-live work continues",
      );
      await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-delegated-work-stage="working"]') !== null`,
        "managed-live Workplane after progress visit",
      );
      assert.equal(
        traceMethodCount(prepared.approval_trace_path, "turn/start"),
        turnStartsBeforeProgressVisit,
      );
      result.live_codex_approved_once = true;
      completeDetailedField("live_codex_approved_once");
      writeFileSync(prepared.second_approval_release_path, "released\n", {
        mode: 0o600,
      });
      await waitForTraceEntry(
        prepared.approval_trace_path,
        (entry) =>
          entry.kind === "browser_release_observed" &&
          entry.value?.label === "browser_second_approval",
        "second approval release observation",
        30_000,
      );
      await waitForTraceEntry(
        prepared.approval_trace_path,
        (entry) =>
          entry.kind === "approval_emitted" &&
          entry.value?.approval_index === 2,
        "second approval emission",
        30_000,
      );
      const secondApproval = await waitForDistinctApproval(
        fixture.writable_database_path,
        fixture.manifest.project_id,
        firstApproval.pending_approval.approval_ref,
        LIVE_TIMEOUT_MS,
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-delegated-work-stage="waiting_for_approval"] [data-delegated-work-action="approve-once"]:not(:disabled)') !== null`,
        "second approval control",
      );
      assert.notEqual(
        secondApproval.pending_approval.approval_ref,
        firstApproval.pending_approval.approval_ref,
      );
      assert.equal(secondApproval.run_ref, firstApproval.run_ref);
      assert.equal(
        secondApproval.control_revision > firstApproval.control_revision,
        true,
      );
      assert.equal(
        secondApproval.pending_approval.control_revision >
          firstApproval.pending_approval.control_revision,
        true,
      );
      result.live_codex_second_approval = true;
      completeDetailedField("live_codex_second_approval");
      result.ai_workplane_approval_refresh_count = 2;
      completeDetailedField("ai_workplane_approval_refresh_count");
      const secondApprovalResponseStart = lifecycle.responses.length;
      await clickSelector(lifecycle, '[data-delegated-work-action="approve-once"]');
      await lifecycle.waitForHostCondition(
        () =>
          lifecycle.responses.slice(secondApprovalResponseStart).some(
            (entry) =>
              entry.path === "/api/vnext/operator/host-round-trip" &&
              entry.method === "POST" &&
              entry.status === 200,
          ),
        "second approval response",
      );
      await waitForLiveState(
        fixture.writable_database_path,
        fixture.manifest.project_id,
        "running",
        LIVE_TIMEOUT_MS,
      );
      const runningAfterSecond = readLatestLiveProjection(
        fixture.writable_database_path,
        fixture.manifest.project_id,
      );
      assert.equal(runningAfterSecond.run_ref, firstApproval.run_ref);
      assert.equal(runningAfterSecond.pending_approval, null);
      assert.equal(
        runningAfterSecond.control_revision > secondApproval.control_revision,
        true,
      );
      writeFileSync(prepared.terminal_release_path, "released\n", {
        mode: 0o600,
      });
      await waitForLiveState(
        fixture.writable_database_path,
        fixture.manifest.project_id,
        "completed",
        LIVE_TIMEOUT_MS,
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-delegated-work-stage="result_ready"] [data-ai-workplane-primary-action="review-result"]') !== null`,
        "managed-live terminal result",
        LIVE_TIMEOUT_MS,
      );
      const liveAfter = directState(
        fixture.writable_database_path,
        fixture.manifest.project_id,
      );
      assert.equal(liveAfter.direct_receipts, directAfter.direct_receipts + 1);
      assert.equal(liveAfter.runs, directAfter.runs + 1);
      assert.deepEqual(liveAfter.semantic_authority_counts, {
        ...directAfter.semantic_authority_counts,
        proposals: directAfter.semantic_authority_counts.proposals + 1,
      });
      assert(liveAfter.latest_receipt);
      assert.equal(liveAfter.latest_receipt.result_summary.outcome, "completed");
      assert.equal(liveAfter.latest_receipt.privacy_egress.egress_status, "occurred");
      assert.equal(liveAfter.latest_receipt.privacy_egress.raw_prompt_persisted, false);
      assert.equal(liveAfter.latest_receipt.privacy_egress.raw_transcript_persisted, false);
      assert.equal(liveAfter.latest_receipt.model_invocations.length, 0);
      assert.equal(
        JSON.stringify(liveAfter.latest_receipt).includes(
          liveAfter.normalized_root,
        ),
        false,
      );
      result.live_codex_status = "completed";
      completeDetailedField("live_codex_status");
      result.live_codex_receipt_persisted = true;
      completeDetailedField("live_codex_receipt_persisted");
      result.live_codex_no_internal_id_input = true;
      completeDetailedField("live_codex_no_internal_id_input");
      const liveRequests = lifecycle.requests
        .slice(liveRequestStart)
        .filter(
          (entry) =>
            entry.path === "/api/vnext/operator/host-round-trip" &&
            entry.method === "POST",
        );
      assert.equal(liveRequests.length, 3);
      assert.deepEqual(JSON.parse(liveRequests[0].post_data), {
        action: "start_live",
      });
      const approvalBodies = liveRequests
        .slice(1)
        .map((entry) => JSON.parse(entry.post_data));
      for (const body of approvalBodies) {
        assert.deepEqual(Object.keys(body).sort(), [
          "action",
          "approval_ref",
          "control_revision",
          "run_ref",
        ]);
        assert.equal(body.action, "approve_once");
        assert.equal(
          ["packet_json", "handoff_text", "result_text", "result_paste"].some(
            (key) => Object.hasOwn(body, key),
          ),
          false,
        );
      }
      assert.notEqual(
        approvalBodies[0].approval_ref,
        approvalBodies[1].approval_ref,
      );
      assert.equal(
        approvalBodies[1].control_revision > approvalBodies[0].control_revision,
        true,
      );
      const timing = readApprovalTiming(prepared.approval_trace_path);
      result.approval_barrier_timing = timing;
      completeDetailedField("approval_barrier_timing");
      const timeline = await lifecycle.evaluateJson(`(() => {
        const root = document.querySelector('[aria-label="Delegated Codex work progress"]');
        const text = root?.textContent ?? '';
        return {
          present: Boolean(root),
          result_saved: text.includes('Result saved'),
          private_material: /jsonrpc|OPENAI_API_KEY|raw command output|provider output/i.test(text),
          checkpoints: root?.querySelectorAll('[data-delegated-work-timeline-kind^="checkpoint_"]').length ?? 0,
          primary_action_count: document.querySelectorAll('[data-ai-workplane-primary-action]').length
        };
      })()`);
      assert.equal(timeline.present, true);
      assert.equal(timeline.result_saved, true);
      assert.equal(timeline.private_material, false);
      assert.equal(timeline.checkpoints >= 2, true);
      assert.equal(timeline.primary_action_count, 1);
      result.delegated_work_timeline_public_safe = true;
      completeDetailedField("delegated_work_timeline_public_safe");
      await lifecycle.navigate(`${appOrigin}/`);
      const expectedReviewHref = `/workbench/results/${liveAfter.latest_receipt.receipt_id.replace(":", "~")}`;
      await lifecycle.waitForCondition(
        `document.querySelector('[data-latest-run-result="completed"] [data-review-result-link="true"]')?.getAttribute('href') === ${JSON.stringify(expectedReviewHref)} && document.querySelector('[data-current-host-run]') === null && document.querySelector('[data-delegated-work-summary="result_ready"]') !== null`,
        "Project Home latest terminal result",
      );
      const latestResultShape = await lifecycle.evaluateJson(`(() => {
        const root = document.querySelector('[data-latest-run-result="completed"]');
        const visibleText = document.querySelector('[data-blank-state="v0.1"]')?.innerText ?? '';
        return {
          present: Boolean(root),
          href: root?.querySelector('[data-review-result-link="true"]')?.getAttribute('href') ?? '',
          has_summary: root?.textContent?.includes('The deterministic fake App Server completed the bounded live lifecycle.') ?? false,
          form_field_count: root?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
          primary_action_count: document.querySelectorAll('[data-blank-state-primary-action]').length,
          protocol_vocabulary_absent: !/(TaskContextPacket|RunReceipt|CriterionAssessment|EpisodeDeltaProposal|ReviewDecision|StateTransitionReceipt|packet fingerprint)/iu.test(visibleText)
        };
      })()`);
      assert.deepEqual(latestResultShape, {
        present: true,
        href: expectedReviewHref,
        has_summary: true,
        form_field_count: 0,
        primary_action_count: 1,
        protocol_vocabulary_absent: true,
      });
      result.project_home_latest_result_visible = true;
      completeDetailedField("project_home_latest_result_visible");
      record("active_project_live_codex_refreshes_two_approval_boundaries_and_persists_one_receipt");
      record("live_codex_product_path_uses_zero_copy_paste_or_internal_id_entry");
      record("project_home_distinguishes_latest_terminal_result_with_server_generated_review_link");
    });

    assert(fixture.manifest.automation_project_id);
    assert(fixture.manifest.automation_packet_id);
    assert.match(
      fixture.manifest.automation_packet_fingerprint ?? "",
      /^sha256:[a-f0-9]{64}$/u,
    );
    selectFixtureActiveProject(
      fixture.writable_database_path,
      fixture.manifest.workspace_id,
      fixture.manifest.automation_project_id,
    );
    await lifecycle.restartRuntime(fixture.manifest.automation_project_id);
    await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
    assert.equal(await lifecycle.authenticate(), true);

    await lifecycle.runPhase("bounded_automation_execution", async () => {
      await lifecycle.navigate(
        `${appOrigin}/projects/${encodeURIComponent(fixture.manifest.automation_project_id)}`,
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"][data-blank-state-project-management-hydrated="true"]') !== null`,
        "bounded automation Project Home",
      );
      const beforeBoundedCycle = directState(
        fixture.writable_database_path,
        fixture.manifest.automation_project_id,
      );
      await openProjectOptions(lifecycle);
      await lifecycle.waitForCondition(
        `Array.from(document.querySelectorAll('[data-project-control-kind="automation"][data-project-controls-hydrated="true"]')).some((entry) => entry.getBoundingClientRect().width > 0 && Array.from(entry.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Pause') && !Array.from(entry.querySelectorAll('button')).some((button) => button.textContent?.trim() === 'Enable'))`,
        "fixture-owned enabled automation control",
      );
      await lifecycle.waitForCondition(
        `Array.from(document.querySelectorAll('[data-project-control-kind="automation"] button')).some((entry) => entry.textContent?.trim() === 'Queue bounded project verification')`,
        "bounded automation queue eligibility",
      );
      const queueResponseStart = lifecycle.responses.length;
      await clickVisibleButton(lifecycle, "Queue bounded project verification");
      await lifecycle.waitForHostCondition(
        () =>
          lifecycle.responses.slice(queueResponseStart).some(
            (entry) =>
              entry.path === "/api/vnext/operator/automation-cycle" &&
              entry.method === "POST",
          ),
        "bounded automation queue response",
      );
      const queueResponse = lifecycle.responses
        .slice(queueResponseStart)
        .find(
          (entry) =>
            entry.path === "/api/vnext/operator/automation-cycle" &&
            entry.method === "POST",
        );
      assert(queueResponse);
      if (queueResponse.status !== 202) {
        const responseBody = await lifecycle
          .cdp()
          .send("Network.getResponseBody", {
            requestId: queueResponse.request_id,
          })
          .then((entry) => JSON.parse(entry.body))
          .catch(() => ({ error_code: "unavailable" }));
        throw new Error(
          `bounded_automation_queue_refused:${queueResponse.status}:${responseBody.error_code ?? "unknown"}`,
        );
      }
      await lifecycle.waitForCondition(
        `Array.from(document.querySelectorAll('[data-project-control-kind="automation"] button')).some((entry) => entry.textContent?.trim() === 'Run one bounded cycle')`,
        "bounded automation cycle eligibility",
      );
      await openProjectOptions(lifecycle);
      const runResponseStart = lifecycle.responses.length;
      await clickVisibleButton(lifecycle, "Run one bounded cycle");
      await lifecycle.waitForHostCondition(
        () =>
          lifecycle.responses.slice(runResponseStart).some(
            (entry) =>
              entry.path === "/api/vnext/operator/automation-cycle" &&
              entry.method === "POST",
          ),
        "bounded automation run response",
      );
      const runResponse = lifecycle.responses
        .slice(runResponseStart)
        .find(
          (entry) =>
            entry.path === "/api/vnext/operator/automation-cycle" &&
            entry.method === "POST",
        );
      assert(runResponse);
      if (runResponse.status !== 202) {
        const responseBody = await lifecycle
          .cdp()
          .send("Network.getResponseBody", {
            requestId: runResponse.request_id,
          })
          .then((entry) => JSON.parse(entry.body))
          .catch(() => ({ error_code: "unavailable" }));
        throw new Error(
          `bounded_automation_run_refused:${runResponse.status}:${responseBody.error_code ?? "unknown"}`,
        );
      }
      await lifecycle.waitForHostCondition(
        async () => {
          const state = await lifecycle.evaluateJson(`(async () => {
            const response = await fetch('/api/vnext/operator/automation-cycle', { cache: 'no-store' });
            return { status: response.status, body: await response.json() };
          })()`);
          return (
            state.status === 200 &&
            state.body?.automation_cycle?.status === "review_needed"
          );
        },
        "bounded automation review-needed",
      );
      await lifecycle.cdp().send("Page.reload", { ignoreCache: true });
      await lifecycle.waitForCondition(
        `document.querySelector('[data-blank-state-automation-run="review_needed"]') !== null && document.querySelector('[data-blank-state-automation-stop="review_needed"]') !== null`,
        "bounded automation durable review-needed",
      );
      await openProjectOptions(lifecycle);
      await lifecycle.waitForCondition(
        `Array.from(document.querySelectorAll('a')).some((entry) => entry.textContent?.trim() === 'Review suggested change' && entry.getBoundingClientRect().width > 0) && Array.from(document.querySelectorAll('a')).some((entry) => entry.textContent?.trim() === 'Share outcome' && entry.getBoundingClientRect().width > 0)`,
        "bounded automation review actions",
      );
      const afterBoundedCycle = directState(
        fixture.writable_database_path,
        fixture.manifest.automation_project_id,
      );
      assert.equal(
        afterBoundedCycle.direct_receipts,
        beforeBoundedCycle.direct_receipts + 1,
      );
      assert.equal(afterBoundedCycle.runs, beforeBoundedCycle.runs + 1);
      assert.deepEqual(afterBoundedCycle.semantic_authority_counts, {
        ...beforeBoundedCycle.semantic_authority_counts,
        packets: beforeBoundedCycle.semantic_authority_counts.packets + 1,
        proposals: beforeBoundedCycle.semantic_authority_counts.proposals + 1,
      });
      assert.equal(
        afterBoundedCycle.latest_receipt.execution_environment.runtime_labels.includes(
          "policy_triggered",
        ),
        true,
      );
      const boundedPacket = readLatestBoundedAutomationPacket(
        fixture.writable_database_path,
        fixture.manifest.automation_project_id,
      );
      assert(boundedPacket);
      assert.equal(
        boundedPacket.compatibility.source_contracts.includes(
          "vnext_bounded_automation_context_compiler.v0.1",
        ),
        true,
      );
      result.bounded_automation_cycle_started = true;
      completeDetailedField("bounded_automation_cycle_started");
      result.bounded_automation_review_needed = true;
      completeDetailedField("bounded_automation_review_needed");
      const beforeBoundedReload = readDatabaseSnapshot(
        fixture.writable_database_path,
      );
      await lifecycle.cdp().send("Page.reload", { ignoreCache: true });
      await lifecycle.waitForCondition(
        `document.querySelector('[data-blank-state-automation-run="review_needed"]') !== null && document.querySelector('[data-project-automation-inspector="true"]') !== null`,
        "bounded automation idempotent reload",
      );
      assert.deepEqual(
        readDatabaseSnapshot(fixture.writable_database_path),
        beforeBoundedReload,
      );
      result.bounded_automation_reload_idempotent = true;
      completeDetailedField("bounded_automation_reload_idempotent");
      const inspectorHref = await lifecycle.evaluateString(
        `Array.from(document.querySelectorAll('[data-project-automation-inspector="true"]')).find((entry) => entry.getBoundingClientRect().width > 0)?.getAttribute('href') ?? ''`,
      );
      assert.match(inspectorHref, /^\/workbench\/inspector\?target=automation_run&/u);
      await lifecycle.navigate(new URL(inspectorHref, appOrigin).toString());
      await lifecycle.waitForCondition(
        `document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="automation_run"] [data-inspector-section="automation"]') !== null`,
        "bounded automation Inspector",
      );
      const inspectorShape = await lifecycle.evaluateJson(`(() => {
        const root = document.querySelector('[data-shared-project-inspector="v0.1"]');
        const text = root?.querySelector('[data-inspector-section="automation"]')?.textContent ?? '';
        return {
          exact: text.includes('Policy control revision') &&
            text.includes('Bounded CapabilityGrant') &&
            text.includes('Bounded automation cycle') &&
            text.includes('Bounded automation run') &&
            text.includes('Bounded RunReceipt') &&
            text.includes('Decision created') &&
            text.includes('Transition created') &&
            text.includes('false') &&
            text.includes('no automatic decision, gate, Transition, Evidence acceptance, or Perspective promotion'),
          read_only: root?.querySelectorAll('form, [data-vnext-transition-action]').length === 0
        };
      })()`);
      assert.deepEqual(inspectorShape, { exact: true, read_only: true });
      assert.equal(
        await lifecycle.evaluateString(
          `document.querySelector('[data-contextual-inspector-return="delegated_work"]')?.getAttribute('href') ?? ''`,
        ),
        "/workbench/semantic-review#delegated-work",
      );
      assert.deepEqual(
        readDatabaseSnapshot(fixture.writable_database_path),
        beforeBoundedReload,
      );
      result.bounded_automation_shared_inspector_complete = true;
      completeDetailedField("bounded_automation_shared_inspector_complete");
      await lifecycle.navigate(
        `${appOrigin}/projects/${encodeURIComponent(fixture.manifest.automation_project_id)}`,
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-blank-state-automation-run="review_needed"]') !== null`,
        "returned bounded automation Project Home",
      );
      await openProjectOptions(lifecycle);
      const contextUseFeedbackHref = await lifecycle.evaluateString(`(() => {
        const link = Array.from(document.querySelectorAll('a')).find(
          (entry) => entry.textContent?.trim() === 'Share outcome' && entry.getBoundingClientRect().width > 0
        );
        return link?.getAttribute('href') ?? '';
      })()`);
      const boundedReviewProposalHref = await lifecycle.evaluateString(`(() => {
        const link = Array.from(document.querySelectorAll('a')).find(
          (entry) => entry.textContent?.trim() === 'Review suggested change' && entry.getBoundingClientRect().width > 0
        );
        return link?.getAttribute('href') ?? '';
      })()`);
      assert.match(
        contextUseFeedbackHref,
        /^\/workbench\/semantic-review\/episode-delta-proposal~[a-f0-9]{24}$/u,
      );
      assert.match(
        boundedReviewProposalHref,
        /^\/workbench\/semantic-review\/episode-delta-proposal~[a-f0-9]{24}$/u,
      );
      const boundedResultHref = `/workbench/results/${afterBoundedCycle.latest_receipt.receipt_id.replace(":", "~")}`;
      const beforeBoundedResultRead = readDatabaseSnapshot(
        fixture.writable_database_path,
      );
      const boundedResultRequestStart = lifecycle.requests.length;
      await lifecycle.navigate(new URL(boundedResultHref, appOrigin).toString());
      await lifecycle.waitForCondition(
        `document.querySelector('[data-run-result-review="v0.1"] [data-task-success-criteria="available"][data-task-success-status="satisfied"]') !== null`,
        "bounded exact criterion result readback",
      );
      const exactResultRelationReadback = await lifecycle.evaluateJson(`(() => {
        const review = document.querySelector('[data-run-result-review="v0.1"]');
        const assessment = review?.querySelector('[data-task-success-criteria="available"][data-task-success-status="satisfied"]');
        return {
          read_only: review?.getAttribute('data-result-review-read-only') === 'true',
          semantic_mutation: review?.getAttribute('data-semantic-mutation') ?? null,
          form_field_count: review?.querySelectorAll('input, textarea, select, [contenteditable="true"]').length ?? -1,
          compact_criterion_summary: assessment?.querySelector('[data-result-criterion-summary="compact"]') !== null && assessment?.textContent?.includes('Satisfied4') === true,
          duplicate_criterion_details: assessment?.querySelectorAll('[data-criterion-status]').length ?? -1,
          shared_inspector_link: review?.querySelector('[data-result-to-shared-inspector="true"]') !== null
        };
      })()`);
      assert.deepEqual(exactResultRelationReadback, {
        read_only: true,
        semantic_mutation: "false",
        form_field_count: 0,
        compact_criterion_summary: true,
        duplicate_criterion_details: 0,
        shared_inspector_link: true,
      });
      assert.deepEqual(
        readDatabaseSnapshot(fixture.writable_database_path),
        beforeBoundedResultRead,
      );
      assert.equal(
        lifecycle.requests
          .slice(boundedResultRequestStart)
          .some((entry) => entry.method !== "GET"),
        false,
      );
      await clickSelector(lifecycle, '[data-result-to-shared-inspector="true"]');
      await lifecycle.waitForCondition(
        `document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="run_receipt"] [data-inspector-section="criterion_basis"]') !== null`,
        "bounded receipt criterion Inspector",
      );
      const receiptCriterionShape = await lifecycle.evaluateJson(`(() => {
        const section = document.querySelector('[data-inspector-section="criterion_basis"]');
        for (const details of section?.querySelectorAll('details') ?? []) details.open = true;
        const criteria = Array.from(section?.querySelectorAll('[data-inspector-item-status]') ?? []);
        const text = section?.textContent ?? '';
        return {
          criterion_count: criteria.length,
          all_satisfied: criteria.every((entry) => entry.getAttribute('data-inspector-item-status') === 'satisfied'),
          observed_basis: criteria.every((entry) => entry.textContent?.includes('observed') === true),
          exact_support_refs: text.includes('criterion assessment') && text.includes(${JSON.stringify(afterBoundedCycle.latest_receipt.integrity.fingerprint)}),
          read_only: document.querySelector('[data-shared-project-inspector="v0.1"]')?.getAttribute('data-inspector-read-only')
        };
      })()`);
      assert.deepEqual(receiptCriterionShape, {
        criterion_count: 4,
        all_satisfied: true,
        observed_basis: true,
        exact_support_refs: true,
        read_only: "true",
      });
      assert.deepEqual(
        readDatabaseSnapshot(fixture.writable_database_path),
        beforeBoundedResultRead,
      );
      const beforeBoundedProposalRead = readDatabaseSnapshot(
        fixture.writable_database_path,
      );
      const boundedProposalRequestStart = lifecycle.requests.length;
      await lifecycle.navigate(new URL(boundedReviewProposalHref, appOrigin).toString());
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-semantic-review-detail="v0.1"] [data-vnext-decision-workbench="v0.1"]') !== null`,
        "bounded proposal detail",
      );
      const proposalInspectorHref = await lifecycle.evaluateString(`(() => {
        const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
        return detail?.querySelector('[data-proposal-to-shared-inspector="true"]')?.getAttribute('href') ?? '';
      })()`);
      assert.match(
        proposalInspectorHref,
        /^\/workbench\/inspector\?target=episode_delta_proposal&record_id=[^&]+&fingerprint=sha256%3A[a-f0-9]{64}$/u,
      );
      await lifecycle.navigate(new URL(proposalInspectorHref, appOrigin).toString());
      await lifecycle.waitForCondition(
        `document.querySelector('[data-shared-project-inspector="v0.1"][data-inspector-target-kind="episode_delta_proposal"] [data-inspector-section="criterion_basis"]') !== null`,
        "bounded proposal criterion Inspector",
      );
      const proposalCriterionShape = await lifecycle.evaluateJson(`(() => {
        const section = document.querySelector('[data-inspector-section="criterion_basis"]');
        for (const details of section?.querySelectorAll('details') ?? []) details.open = true;
        const criteria = Array.from(section?.querySelectorAll('[data-inspector-item-status]') ?? []);
        const text = section?.textContent ?? '';
        return {
          present: Boolean(section),
          criterion_count: criteria.length,
          criteria_satisfied_observed: criteria.every((entry) => entry.getAttribute('data-inspector-item-status') === 'satisfied' && entry.textContent?.includes('observed') === true),
          exact_relation_refs: text.includes('criterion assessment') && text.includes(${JSON.stringify(afterBoundedCycle.latest_receipt.integrity.fingerprint)}),
          read_only: document.querySelector('[data-shared-project-inspector="v0.1"]')?.getAttribute('data-inspector-read-only')
        };
      })()`);
      assert.deepEqual(proposalCriterionShape, {
        present: true,
        criterion_count: 4,
        criteria_satisfied_observed: true,
        exact_relation_refs: true,
        read_only: "true",
      });
      assert.deepEqual(
        readDatabaseSnapshot(fixture.writable_database_path),
        beforeBoundedProposalRead,
      );
      assert.equal(
        lifecycle.requests
          .slice(boundedProposalRequestStart)
          .some((entry) => entry.method !== "GET"),
        false,
      );
      result.bounded_automation_exact_relation_readback = true;
      completeDetailedField("bounded_automation_exact_relation_readback");
      await lifecycle.navigate(new URL(contextUseFeedbackHref, appOrigin).toString());
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-context-use-feedback="available"] [data-vnext-context-use-review-form="v0.1"]') !== null`,
        "bounded context-use feedback form",
      );
      assert.equal(
        await lifecycle.evaluateBoolean(`(() => {
          const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
          const relationships = detail?.querySelector('[data-selected-work-relationships="selected_work_relationships.v0.1"]');
          return !['later_outcome_available', 'later_outcome_reviewed'].includes(detail?.getAttribute('data-selected-work-current-stage') ?? '') &&
            relationships?.querySelector('[data-selected-work-relationship-kind="used_by_later_work"], [data-selected-work-relationship-kind="reviewed_by_later_feedback"]') === null;
        })()`),
        true,
      );
      const beforeBoundedFeedback = directState(
        fixture.writable_database_path,
        fixture.manifest.automation_project_id,
      );
      assert.equal(
        await lifecycle.evaluateBoolean(`(() => {
          const form = document.querySelector('[data-vnext-context-use-review-form="v0.1"]');
          const selects = form?.querySelectorAll('select');
          if (!form || !selects || selects.length !== 2) return false;
          selects[0].value = 'yes';
          selects[0].dispatchEvent(new Event('change', { bubbles: true }));
          selects[1].value = 'helpful';
          selects[1].dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        })()`),
        true,
      );
      await clickVisibleButton(lifecycle, "Save feedback");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-context-use-review-actually-used-basis="user_declaration"][data-context-use-review-presentation-basis="direct_local_observation"]') !== null`,
        "bounded context-use provenance",
      );
      const afterBoundedFeedback = directState(
        fixture.writable_database_path,
        fixture.manifest.automation_project_id,
      );
      assert.deepEqual(afterBoundedFeedback.semantic_authority_counts, {
        ...beforeBoundedFeedback.semantic_authority_counts,
        context_use_reviews:
          beforeBoundedFeedback.semantic_authority_counts.context_use_reviews + 1,
      });
      result.bounded_automation_context_feedback_recorded = true;
      completeDetailedField("bounded_automation_context_feedback_recorded");
      record("bounded_policy_cycle_stops_at_one_pending_review_proposal");
      record("policy_triggered_exact_criterion_relations_render_and_reload_read_only");
      record("selected_work_relationship_suppresses_newer_packet_without_exact_transition_lineage");
      record("selected_work_relationship_keeps_mismatched_packet_feedback_out_of_selected_timeline");
      record("policy_triggered_later_receipt_uses_explicit_non_authoritative_feedback");
    });

    result.packet_root_run_result_proposal_decision_transition_identity = {
      first_work_project_id: firstWorkProjectId,
      execution_project_id: fixture.manifest.project_id,
      packet_id: fixture.manifest.packet_id,
      packet_fingerprint: fixture.manifest.packet_fingerprint,
      automation_project_id: fixture.manifest.automation_project_id,
      automation_packet_id: fixture.manifest.automation_packet_id,
      automation_packet_fingerprint:
        fixture.manifest.automation_packet_fingerprint,
      transition_receipt_id: fixture.manifest.transition_receipt_id,
    };
    result.credential_private_material_boundary = true;
  },
});

async function activateProject(lifecycle) {
  if (
    await lifecycle.evaluateBoolean(
      `Array.from(document.querySelectorAll('[data-blank-state="v0.1"][data-blank-state-active="false"]')).some((entry) => entry.getBoundingClientRect().width > 0)`,
    )
  ) {
    assert.equal(
      await lifecycle.evaluateBoolean(`(() => {
        const root = Array.from(document.querySelectorAll('[data-blank-state="v0.1"][data-blank-state-active="false"]')).find((entry) => entry.getBoundingClientRect().width > 0);
        const button = root?.querySelector('button[data-blank-state-primary-action="make_active"]');
        if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
        button.click();
        return true;
      })()`),
      true,
    );
    await lifecycle.waitForCondition(
      `Array.from(document.querySelectorAll('[data-blank-state="v0.1"][data-blank-state-active="true"]')).some((entry) => entry.getBoundingClientRect().width > 0)`,
      "active execution project",
    );
  }
}

async function openProjectOptions(lifecycle) {
  await lifecycle.waitForCondition(
    `(() => {
      const directOptions = Array.from(document.querySelectorAll('[data-blank-state-project-options="true"]')).find((entry) => entry.getBoundingClientRect().width > 0);
      if (directOptions) return true;
      const details = Array.from(document.querySelectorAll('details[data-blank-state-project-settings-recovery="true"]')).find((entry) => entry.closest('[data-blank-state-project-management-hydrated="true"]'));
      if (!(details instanceof HTMLDetailsElement)) return false;
      details.open = true;
      return details.querySelector('[data-blank-state-project-options="true"]')?.getBoundingClientRect().width > 0;
    })()`,
    "visible native-host project options",
  );
}

async function clickSelector(lifecycle, selector) {
  assert.equal(
    await lifecycle.evaluateBoolean(`(() => {
      const candidates = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
      const element = candidates.find((entry) => entry.getBoundingClientRect().width > 0);
      if (!(element instanceof HTMLElement)) return false;
      element.click(); return true;
    })()`),
    true,
  );
}

async function visibleButton(lifecycle, text) {
  return await lifecycle.evaluateBoolean(
    `Array.from(document.querySelectorAll('button')).some((entry) => entry.textContent?.trim() === ${JSON.stringify(text)} && entry.getBoundingClientRect().width > 0 && !entry.disabled)`,
  );
}

async function clickVisibleButton(lifecycle, text) {
  assert.equal(
    await lifecycle.evaluateBoolean(`(() => {
      const button = Array.from(document.querySelectorAll('button')).find((entry) => entry.textContent?.trim() === ${JSON.stringify(text)} && entry.getBoundingClientRect().width > 0);
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
      button.click(); return true;
    })()`),
    true,
  );
}

function firstWorkDefinitionAtJsonBytes(targetBytes) {
  const goal = "g".repeat(2_000);
  const successCriteria = Array.from({ length: 12 }, (_, index) => {
    const prefix = `criterion-${String(index).padStart(2, "0")}:`;
    return `${prefix}${"c".repeat(500 - prefix.length)}`;
  });
  const nonGoals = [];
  const value = () => ({
    goal,
    success_criteria: successCriteria,
    non_goals: [...nonGoals],
  });
  while (Buffer.byteLength(JSON.stringify(value()), "utf8") < targetBytes) {
    const current = nonGoals.at(-1);
    if (current === undefined || [...current].length >= 500) {
      nonGoals.push(`non-goal-${String(nonGoals.length).padStart(2, "0")}:`);
    } else {
      nonGoals[nonGoals.length - 1] = `${current}n`;
    }
    const bytes = Buffer.byteLength(JSON.stringify(value()), "utf8");
    assert.equal(bytes <= targetBytes, true, "first_work_exact_bytes_overflow");
  }
  return value();
}

function readFirstWorkState(databasePath, projectId) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const core = (kind) =>
      Number(
        database
          .prepare("SELECT COUNT(*) AS count FROM vnext_core_records WHERE project_id = ? AND record_kind = ?")
          .get(projectId, kind).count,
      );
    return {
      packets: core("task_context_packet"),
      receipts: core("run_receipt"),
      proposals: core("episode_delta_proposal"),
      decisions: core("review_decision"),
      transitions: core("state_transition_receipt"),
      semantic_state: Number(
        database
          .prepare(
            "SELECT COUNT(*) AS count FROM vnext_semantic_state_entries WHERE project_id = ?",
          )
          .get(projectId).count,
      ),
      runs: Number(
        database
          .prepare("SELECT COUNT(*) AS count FROM autonomy_runs WHERE scope = ?")
          .get(projectId).count,
      ),
    };
  } finally {
    database.close();
  }
}

function selectFixtureActiveProject(databasePath, workspaceId, projectId) {
  const database = new Database(databasePath, { fileMustExist: true });
  try {
    database.pragma("foreign_keys = ON");
    const current = readActiveProjectSelectionV01(database, workspaceId);
    selectActiveProjectV01(database, {
      workspace_id: workspaceId,
      project_id: projectId,
      now: new Date().toISOString(),
      expected_project_id: current?.project_id ?? null,
      expected_revision: current?.selection_revision ?? null,
    });
  } finally {
    database.close();
  }
}

function readLatestLiveProjection(databasePath, projectId) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const row = database
      .prepare(
        `SELECT run_id, status, metadata_json
         FROM autonomy_runs
         WHERE scope = ?
           AND autonomy_contract_ref = 'direct_native_host_round_trip.v0.1'
           AND json_extract(metadata_json, '$.lifecycle_mode') = 'managed_live'
         ORDER BY created_at DESC, run_id DESC
         LIMIT 1`,
      )
      .get(projectId);
    assert(row);
    const metadata = JSON.parse(row.metadata_json);
    const pendingApproval =
      metadata.pending_approval &&
      typeof metadata.pending_approval === "object" &&
      !Array.isArray(metadata.pending_approval)
        ? metadata.pending_approval
        : null;
    return {
      run_ref: row.run_id,
      status: row.status,
      pending_approval: pendingApproval
        ? {
            approval_ref: String(pendingApproval.approval_id ?? ""),
            control_revision: Number(
              pendingApproval.control_revision ?? 0,
            ),
            decision_submitted:
              pendingApproval.decision_submitted === true,
          }
        : null,
      control_revision: metadata.control_revision ?? null,
      packet_lineage_kind: metadata.packet_lineage_kind ?? null,
      first_work_definition_id: metadata.first_work_definition_id ?? null,
      source_transition_receipt_id:
        metadata.source_transition_receipt_id ?? null,
    };
  } finally {
    database.close();
  }
}

async function waitForLiveState(databasePath, projectId, status, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const state = readLatestLiveProjection(databasePath, projectId);
    if (state.status === status) return state;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`operator_live_state_timeout:${status}`);
}

async function waitForDistinctApproval(
  databasePath,
  projectId,
  priorApprovalRef,
  timeoutMs,
) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const state = readLatestLiveProjection(databasePath, projectId);
    if (
      state.status === "waiting_for_approval" &&
      state.pending_approval?.approval_ref &&
      state.pending_approval.approval_ref !== priorApprovalRef
    ) {
      return state;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("operator_second_approval_timeout");
}

function readLatestRunStatus(databasePath, projectId) {
  return readLatestLiveProjection(databasePath, projectId).status;
}

function directState(databasePath, projectId) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const receipts = database
      .prepare(
        "SELECT payload_json FROM vnext_core_records WHERE project_id = ? AND record_kind = 'run_receipt' ORDER BY created_at, record_id",
      )
      .all(projectId)
      .map((entry) => JSON.parse(entry.payload_json))
      .filter((entry) =>
        entry.compatibility?.source_contracts?.includes(
          "direct_native_host_round_trip.v0.1",
        ),
      );
    const root = database
      .prepare(
        "SELECT normalized_root FROM vnext_project_root_bindings WHERE project_id = ?",
      )
      .get(projectId)?.normalized_root;
    const coreCount = (kind) =>
      Number(
        database
          .prepare(
            "SELECT COUNT(*) AS count FROM vnext_core_records WHERE project_id = ? AND record_kind = ?",
          )
          .get(projectId, kind).count,
      );
    const latestReceipt = receipts.at(-1) ?? null;
    const packetRow = latestReceipt?.task_context_packet_ref?.external_id
      ? database
          .prepare(
            "SELECT payload_json FROM vnext_core_records WHERE project_id = ? AND record_kind = 'task_context_packet' AND record_id = ?",
          )
          .get(
            projectId,
            latestReceipt.task_context_packet_ref.external_id,
          )
      : null;
    return {
      direct_receipts: receipts.length,
      runs: Number(
        database
          .prepare("SELECT COUNT(*) AS count FROM autonomy_runs WHERE scope = ?")
          .get(projectId).count,
      ),
      semantic_authority_counts: {
        semantic_state: Number(
          database
            .prepare(
              "SELECT COUNT(*) AS count FROM vnext_semantic_state_entries WHERE project_id = ?",
            )
            .get(projectId).count,
        ),
        proposals: coreCount("episode_delta_proposal"),
        decisions: coreCount("review_decision"),
        commit_gates: coreCount("semantic_commit_gate"),
        transitions: coreCount("state_transition_receipt"),
        packets: coreCount("task_context_packet"),
        context_use_reviews: coreCount("context_use_review"),
      },
      latest_receipt: latestReceipt,
      packet: packetRow ? JSON.parse(packetRow.payload_json) : null,
      normalized_root: String(root ?? ""),
    };
  } finally {
    database.close();
  }
}

function readLatestBoundedAutomationPacket(databasePath, projectId) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    for (const row of database
      .prepare(
        "SELECT payload_json FROM vnext_core_records WHERE project_id = ? AND record_kind = 'task_context_packet' ORDER BY created_at DESC, record_id DESC",
      )
      .all(projectId)) {
      const packet = JSON.parse(row.payload_json);
      if (
        packet.compatibility?.source_contracts?.includes(
          "vnext_bounded_automation_context_compiler.v0.1",
        )
      ) {
        return packet;
      }
    }
    return null;
  } finally {
    database.close();
  }
}

function readDatabaseSnapshot(databasePath) {
  const database = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const tables = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((row) => row.name);
    const rows = Object.fromEntries(
      tables.map((table) => {
        const serialized = database
          .prepare(`SELECT * FROM ${quoteIdentifier(table)}`)
          .all()
          .map((row) => JSON.stringify(row))
          .sort();
        return [
          table,
          {
            count: serialized.length,
            row_hash: createHash("sha256")
              .update(JSON.stringify(serialized))
              .digest("hex"),
          },
        ];
      }),
    );
    return {
      integrity_check: database.pragma("integrity_check", { simple: true }),
      table_row_hash: createHash("sha256")
        .update(JSON.stringify(rows))
        .digest("hex"),
      rows,
    };
  } finally {
    database.close();
  }
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function traceEntries(tracePath) {
  if (!existsSync(tracePath)) return [];
  return readFileSync(tracePath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function traceMethodCount(tracePath, method) {
  return traceEntries(tracePath).filter(
    (entry) => entry.kind === "received" && entry.value?.method === method,
  ).length;
}

async function waitForTraceEntry(
  tracePath,
  predicate,
  label,
  timeoutMs,
) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const entries = traceEntries(tracePath);
    const handlerError = entries.find((entry) => entry.kind === "handler_error");
    assert.equal(
      handlerError,
      undefined,
      `${label}:${handlerError?.value?.code ?? "handler_error"}`,
    );
    if (entries.some(predicate)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`operator_trace_timeout:${label.replaceAll(" ", "_")}`);
}

function readApprovalTiming(tracePath) {
  const entries = traceEntries(tracePath);
  const allowedKinds = new Set([
    "approval_emitted",
    "approval_decision_received",
    "browser_release_requested",
    "browser_release_observed",
    "terminal_state_emitted",
  ]);
  const fixtureStartedAt = Date.parse(
    entries.find((entry) => entry.kind === "fixture_started")?.at ?? "",
  );
  assert.equal(Number.isFinite(fixtureStartedAt), true);
  const publicEntries = entries
    .filter((entry) => allowedKinds.has(entry.kind))
    .map((entry) => ({
      event: entry.kind,
      elapsed_ms: Math.max(0, Date.parse(entry.at) - fixtureStartedAt),
      approval_index: Number.isSafeInteger(entry.value?.approval_index)
        ? entry.value.approval_index
        : null,
      label: ["browser_second_approval", "browser_terminal"].includes(
        entry.value?.label,
      )
        ? entry.value.label
        : null,
      observation: [
        "preexisting",
        "post_registration",
        "watcher",
        "poll_fallback",
      ].includes(entry.value?.observation)
        ? entry.value.observation
        : null,
    }));
  assert.equal(
    publicEntries.filter((entry) => entry.event === "approval_emitted").length,
    2,
  );
  assert.equal(
    publicEntries.filter(
      (entry) => entry.event === "approval_decision_received",
    ).length,
    2,
  );
  assert.equal(
    publicEntries.filter(
      (entry) => entry.event === "browser_release_observed",
    ).length,
    2,
  );
  assert.equal(
    publicEntries.filter(
      (entry) => entry.event === "terminal_state_emitted",
    ).length,
    1,
  );
  return {
    timing_version: "browser_approval_barriers.v0.1",
    events: publicEntries,
  };
}
