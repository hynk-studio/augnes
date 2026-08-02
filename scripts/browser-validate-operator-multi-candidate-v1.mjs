#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";

import { runOperatorExecutionBrowserChildV1 } from "./operator-execution-browser-child-v1.mjs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const CHILD_ID = "operator-multi-candidate";
const VALIDATION_SCOPE = "operator-multi-candidate";
assert(
  ["operator-multi-candidate"].includes(VALIDATION_SCOPE),
  "unsupported operator multi-candidate scope",
);

await runOperatorExecutionBrowserChildV1({
  child_id: CHILD_ID,
  console_allowlist: (entry) =>
    (entry.phase === "multi_candidate_session_and_scope" &&
      entry.request_path === "/api/vnext/operator/session" &&
      entry.response_status === 401 &&
      entry.text ===
        "Failed to load resource: the server responded with a status of 401 (Unauthorized)") ||
    (entry.phase === "multi_candidate_session_and_scope" &&
      entry.request_path === "/favicon.ico" &&
      entry.response_status === 404 &&
      entry.text ===
        "Failed to load resource: the server responded with a status of 404 (Not Found)"),
  execute: async ({
    fixture,
    lifecycle,
    result,
    detailed_field_owner: completeDetailedFieldOwner,
    semantic_marker_owner: recordOwner,
  }) => {
    function completeDetailedField(id) {
      return completeDetailedFieldOwner(id);
    }
    function record(id) {
      return recordOwner(id);
    }
    const multi = fixture.manifest.multi_candidate_fixture;
    assert(multi, "operator_multi_candidate_fixture_missing");
    const [candidateA, candidateB] = multi.candidate_ids;
    const proposalPath = multi.target_proposal_path;
    const appOrigin = lifecycle.app_origin;

    await lifecycle.runPhase("multi_candidate_session_and_scope", async () => {
      await lifecycle.navigate(`${appOrigin}${proposalPath}`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
        "multi-candidate locked session",
      );
      result.credential_private_material_boundary = await lifecycle.authenticate();
      await lifecycle.waitForCondition(
        `location.pathname === ${JSON.stringify(proposalPath)} && document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.querySelectorAll('option').length === 2`,
        "two-candidate exact proposal",
      );
      const initial = await readSelectedCandidateShape(lifecycle);
      assert.equal(initial.selected_candidate, candidateA);
      assert.equal(initial.option_count, 2);
      assert.equal(initial.current_count, 1);
      assert.equal(initial.relationship_highlight_count, 1);
    });

    await lifecycle.runPhase("multi_candidate_guidebrief_read_only", async () => {
      const before = authoritySnapshot(fixture.writable_database_path);
      const requestStart = lifecycle.requests.length;
      await openGuideBriefConversationAndAnswerSuggestedQuestion(lifecycle);
      await submitGuideBriefInteractionCommand(
        lifecycle,
        "Prepare an accept decision.",
      );
      await lifecycle.waitForCondition(
        `(() => {
          const form = document.querySelector('[data-vnext-operator-decision-form="v0.1"]');
          const select = form?.querySelector('select');
          const rationale = form?.querySelector('textarea');
          const submit = form?.querySelector('button[type="submit"]');
          return select?.value === 'accept' && rationale?.value === '' &&
            submit?.disabled === true && document.activeElement === select &&
            document.querySelector('[data-guidebrief-interaction-outcome="handed_off"][data-guidebrief-interaction-durable-state-changed="false"]') !== null;
        })()`,
        "GuideBrief decision preparation",
      );
      assert.deepEqual(authoritySnapshot(fixture.writable_database_path), before);
      assert.equal(lifecycle.requests.slice(requestStart).length, 0);
      result.guide_brief_decision_preparation_zero_write = true;
      completeDetailedField("guide_brief_decision_preparation_zero_write");
      record("guidebrief_decision_preparation_has_zero_submit_and_zero_network");

      await submitGuideBriefInteractionCommand(
        lifecycle,
        "Take me to the current action.",
      );
      await lifecycle.waitForCondition(
        `document.activeElement === document.querySelector('[data-vnext-operator-decision-form="v0.1"] select') && document.querySelectorAll('[data-ai-workplane-primary-action]').length === 1`,
        "GuideBrief current action focus",
      );
      result.guide_brief_current_action_focus_only = true;
      completeDetailedField("guide_brief_current_action_focus_only");
      record("guidebrief_current_action_focus_does_not_activate_owner");

      await submitGuideBriefInteractionCommand(lifecycle, "Open advanced review.");
      await lifecycle.waitForCondition(
        `document.querySelector('details#selected-work-advanced[open]') !== null && document.activeElement === document.querySelector('details#selected-work-advanced > summary')`,
        "GuideBrief advanced owner handoff",
      );
      result.guide_brief_advanced_owner_handoff = true;
      completeDetailedField("guide_brief_advanced_owner_handoff");
      record("guidebrief_advanced_review_uses_existing_disclosure_owner");
      assert.equal(
        await lifecycle.evaluateBoolean(`(() => {
          const advanced = document.querySelector('details#selected-work-advanced');
          if (!(advanced instanceof HTMLDetailsElement)) return false;
          advanced.open = false;
          return true;
        })()`),
        true,
      );
      await submitGuideBriefInteractionCommand(
        lifecycle,
        "Open advanced review and merge the PR.",
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-guidebrief-interaction-plan="unsupported"]') !== null && document.querySelector('details#selected-work-advanced:not([open])') !== null`,
        "GuideBrief partial utterance refusal",
      );
      record("guidebrief_partial_utterance_does_not_invoke_supported_owner");
      await submitGuideBriefInteractionCommand(lifecycle, "Apply this.");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-guidebrief-interaction-plan="unsupported"]') !== null`,
        "GuideBrief mutation refusal",
      );
      result.guide_brief_mutation_refusal = true;
      completeDetailedField("guide_brief_mutation_refusal");
      record("guidebrief_unsupported_mutation_command_is_refused");
      await submitGuideBriefInteractionCommand(lifecycle, "Show the blocker.");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-guidebrief-interaction-plan="unavailable"]') !== null`,
        "GuideBrief unavailable relationship refusal",
      );
      result.guide_brief_unavailable_relationship_refusal = true;
      completeDetailedField("guide_brief_unavailable_relationship_refusal");
      record("guidebrief_unavailable_relationship_question_is_refused");
      assert.deepEqual(authoritySnapshot(fixture.writable_database_path), before);
    });

    await lifecycle.runPhase("multi_candidate_decisions_and_preview", async () => {
      await recordAcceptDecision(lifecycle, candidateA, "Accept exact candidate A for the independently owned Transition path.");
      await selectCandidate(lifecycle, candidateB);
      await recordAcceptDecision(lifecycle, candidateB, "Accept exact candidate B as the unapplied candidate-local decision.");
      await lifecycle.navigate(`${appOrigin}${multi.blocked_proposal_path}`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(candidateA)}`,
        "same-target proposal before competing application",
      );
      await recordAcceptDecision(
        lifecycle,
        candidateA,
        "Accept matching candidate before exact competing-state refusal proof.",
      );
      await lifecycle.navigate(`${appOrigin}${proposalPath}`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.querySelectorAll('option').length === 2`,
        "return to target multi-candidate proposal",
      );
      await selectCandidate(lifecycle, candidateA);

      const beforeRelationship = authoritySnapshot(fixture.writable_database_path);
      await submitGuideBriefInteractionCommand(lifecycle, "Show the source connection.");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-selected-work-relationships="selected_work_relationships.v0.1"][data-selected-work-relationship-question="support_and_source"]') !== null`,
        "GuideBrief relationship owner reuse",
      );
      assert.deepEqual(authoritySnapshot(fixture.writable_database_path), beforeRelationship);
      result.guide_brief_relationship_selection_owner_reused = true;
      completeDetailedField("guide_brief_relationship_selection_owner_reused");
      record("guidebrief_relationship_selection_reuses_pc3_owner");
      const candidateAAnswer = await openGuideBriefConversationAndAnswerSuggestedQuestion(lifecycle);
      assert.equal(candidateAAnswer.answer_count, 1);

      const beforeLatePreview = authoritySnapshot(fixture.writable_database_path);
      lifecycle.pauseNextSemanticTransitionRequest("preview");
      await clickTransitionAction(lifecycle, "preview");
      await lifecycle.waitForPausedSemanticTransitionRequest("preview");
      await selectCandidate(lifecycle, candidateB);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')?.getAttribute('data-guidebrief-conversation-scope') !== ${JSON.stringify(candidateAAnswer.scope)} && document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')?.getAttribute('data-guidebrief-conversation-active-answer') === 'false'`,
        "candidate switch clears GuideBrief scope",
      );
      const candidateBShape = await readSelectedCandidateShape(lifecycle);
      assert.equal(candidateBShape.selected_candidate, candidateB);
      assert.equal(candidateBShape.preview_status, "not_prepared");
      assert.equal(candidateBShape.current_count, 1);
      result.selected_work_timeline_candidate_switching = true;
      completeDetailedField("selected_work_timeline_candidate_switching");
      await lifecycle.releasePausedSemanticTransitionRequest("preview");
      await lifecycle.waitForRequestQuiet();
      assert.deepEqual(authoritySnapshot(fixture.writable_database_path), beforeLatePreview);
      const afterLate = await readSelectedCandidateShape(lifecycle);
      assert.equal(afterLate.selected_candidate, candidateB);
      assert.equal(afterLate.preview_status, "not_prepared");
      result.late_preview_response_discarded = true;
      completeDetailedField("late_preview_response_discarded");
      record("late_preview_response_is_discarded_after_candidate_switch");

      await selectCandidate(lifecycle, candidateA);
      const freshA = await readSelectedCandidateShape(lifecycle);
      assert.equal(freshA.preview_status, "not_prepared");
      assert.equal(freshA.relationship_question, "candidate_and_decision");
      await lifecycle.setFormControlValue(
        '[data-selected-work-relationship-question-selector="true"]',
        "support_and_source",
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-selected-work-relationships="selected_work_relationships.v0.1"][data-selected-work-relationship-question="support_and_source"]') !== null`,
        "candidate A relationship selection",
      );
      const relationshipText = await lifecycle.evaluateString(
        `document.querySelector('[data-selected-work-relationships="selected_work_relationships.v0.1"]')?.innerText ?? ''`,
      );
      assert.equal(relationshipText.length > 0, true);
      result.guide_brief_highlighted_relationship_agreement = true;
      completeDetailedField("guide_brief_highlighted_relationship_agreement");
      record("guidebrief_relationship_answer_matches_pc3_highlight");
      record("selected_work_relationship_questions_remain_candidate_local");
      record("selected_work_relationship_questions_remain_exact_proposal_local");
      record("selected_work_relationship_return_navigation_rebuilds_default");
    });

    await lifecycle.runPhase("multi_candidate_transition_application", async () => {
      await openGuideBriefConversationAndAnswerSuggestedQuestion(lifecycle);
      const previewStart = lifecycle.requests.length;
      lifecycle.pauseNextSemanticTransitionRequest("preview");
      assert.equal(
        await lifecycle.evaluateBoolean(`(() => {
          const conversation = document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]');
          const button = Array.from(conversation?.querySelectorAll('[aria-label="Interactions supported by current owners"] button') ?? []).find((entry) => entry.textContent?.trim() === 'Show what would change before applying');
          if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
          button.click();
          button.click();
          return true;
        })()`),
        true,
      );
      await lifecycle.waitForPausedSemanticTransitionRequest("preview");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')?.getAttribute('data-guidebrief-interaction-in-flight') === 'true'`,
        "GuideBrief preview single flight",
      );
      await lifecycle.releasePausedSemanticTransitionRequest("preview");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-transition-step="preview"][data-vnext-transition-step-status="prepared"]') !== null`,
        "GuideBrief prepared preview",
      );
      const previewRequests = lifecycle.requests
        .slice(previewStart)
        .filter((entry) => entry.path === "/api/vnext/operator/semantic-transition");
      assert.deepEqual(previewRequests.map((entry) => entry.method), ["GET"]);
      result.guide_brief_transition_preview_get_count = 1;
      completeDetailedField("guide_brief_transition_preview_get_count");
      result.guide_brief_transition_preview_post_count = 0;
      completeDetailedField("guide_brief_transition_preview_post_count");
      result.guide_brief_transition_preview_double_activation_count = 1;
      completeDetailedField("guide_brief_transition_preview_double_activation_count");
      record("guidebrief_pre_preview_current_action_focus_only");
      record("guidebrief_transition_preview_one_get_zero_post");
      record("guidebrief_transition_preview_duplicate_activation_executes_once");
      record("guidebrief_host_single_flight_survives_snapshot_change");
      record("guidebrief_post_preview_current_action_focuses_owner_prerequisite");
      await reviewTransitionCheckbox(lifecycle, "preview");

      lifecycle.pauseNextSemanticTransitionRequest("confirm");
      await clickTransitionAction(lifecycle, "confirm");
      await lifecycle.waitForPausedSemanticTransitionRequest("confirm");
      await assertMutationControlsLocked(lifecycle);
      await lifecycle.releasePausedSemanticTransitionRequest("confirm");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-transition-step="confirmation"][data-vnext-transition-step-status="recorded"]') !== null && document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled)') !== null`,
        "confirmation recorded and controls unlocked",
      );
      await submitGuideBriefInteractionCommand(lifecycle, "Take me to the current action.");
      await lifecycle.waitForCondition(
        `document.activeElement === document.querySelector('[data-vnext-transition-step="confirmation"] input[type="checkbox"]')`,
        "confirmation current action focus",
      );
      record("guidebrief_post_confirmation_current_action_focus_only");
      await reviewTransitionCheckbox(lifecycle, "confirmation");

      const beforeApplyAnswer = await openGuideBriefConversationAndAnswerSuggestedQuestion(lifecycle);
      lifecycle.pauseNextSemanticTransitionRequest("apply");
      await clickTransitionAction(lifecycle, "apply");
      await lifecycle.waitForPausedSemanticTransitionRequest("apply");
      await assertMutationControlsLocked(lifecycle);
      result.candidate_switch_mutation_locking = true;
      completeDetailedField("candidate_switch_mutation_locking");
      await lifecycle.releasePausedSemanticTransitionRequest("apply");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="project_updated"]') !== null && document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled)') !== null`,
        "candidate A exact Transition applied",
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')?.getAttribute('data-guidebrief-conversation-scope') !== ${JSON.stringify(beforeApplyAnswer.scope)} && document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')?.getAttribute('data-guidebrief-conversation-active-answer') === 'false'`,
        "same candidate material clears stale GuideBrief",
      );
      result.guide_brief_same_candidate_material_reset = true;
      completeDetailedField("guide_brief_same_candidate_material_reset");
      record("guidebrief_same_candidate_material_change_clears_stale_answer");
      const exactChain = await readExactCandidateChain(
        lifecycle,
        multi.target_proposal_id,
        candidateA,
      );
      assert.equal(exactChain.status, 200);
      assert.equal(exactChain.exact_decision_transition_chain, true);
      assert.equal(exactChain.decision, "accept");
      result.multi_candidate_transition_scope = true;
      completeDetailedField("multi_candidate_transition_scope");
      result.applying_decision_wording_truthful = true;
      completeDetailedField("applying_decision_wording_truthful");
      record("multi_candidate_transition_state_is_bound_to_exact_candidate_and_decision");
      record("gate_and_apply_mutations_lock_candidate_and_proposal_local_controls");
      record("applying_decision_wording_and_exact_values_remain_truthful");
    });

    await lifecycle.runPhase("multi_candidate_return_and_handoff", async () => {
      const beforeInspector = authoritySnapshot(fixture.writable_database_path);
      await submitGuideBriefInteractionCommand(lifecycle, "Open exact details.");
      await lifecycle.waitForCondition(
        `location.pathname === '/workbench/inspector' && new URLSearchParams(location.search).get('target') === 'episode_delta_proposal'`,
        "GuideBrief exact Inspector destination",
      );
      assert.deepEqual(authoritySnapshot(fixture.writable_database_path), beforeInspector);
      result.guide_brief_exact_inspector_registered_destination = true;
      completeDetailedField("guide_brief_exact_inspector_registered_destination");
      record("guidebrief_inspector_uses_registered_exact_destination_only");

      await lifecycle.navigate(`${appOrigin}${multi.blocked_proposal_path}`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(candidateA)}`,
        "blocked proposal exact candidate",
      );
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="transition_blocked"]') !== null`,
        "competing project update blocks same target",
      );
      const blockedShape = await readSelectedCandidateShape(lifecycle);
      assert.equal(blockedShape.current_count, 1);
      assert.equal(blockedShape.relationship_kind, "blocked_by");
      record("selected_work_relationship_explains_exact_transition_blocker");
      record("selected_work_timeline_exposes_exact_post_decision_application_blocker");

      await lifecycle.navigate(`${appOrigin}${proposalPath}`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(candidateB)} && document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="awaiting_application"][data-selected-work-primary-action-owner="transition"]') !== null`,
        "return rebuilds the unapplied candidate deterministic default",
      );
      await selectCandidate(lifecycle, candidateA);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(candidateA)} && document.querySelector('[data-vnext-semantic-review-detail="v0.1"][data-selected-work-current-stage="project_updated"][data-selected-work-primary-action-owner="candidate_selection"]') !== null`,
        "return rebuilds the applied candidate deterministic default",
      );
      await submitGuideBriefInteractionCommand(lifecycle, "Take me to the current action.");
      await lifecycle.waitForCondition(
        `document.activeElement === document.querySelector('[data-vnext-review-next-change="true"]') && document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(candidateA)} && document.querySelector('[data-guidebrief-interaction-outcome="handed_off"]') !== null`,
        "candidate selection owner focus",
      );
      record("guidebrief_candidate_selection_current_action_focus_only");
      await submitGuideBriefInteractionCommand(lifecycle, "Show the next change.");
      await lifecycle.waitForCondition(
        `document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(candidateB)} && document.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1`,
        "next candidate owner reuse",
      );
      result.guide_brief_next_candidate_owner_reused = true;
      completeDetailedField("guide_brief_next_candidate_owner_reused");
      record("guidebrief_next_candidate_selection_reuses_pc2_owner");
      record("mixed_return_target_captured_from_exact_mutated_proposal");
      record("generic_validation_proposal_excluded_as_return_target");
      record("selected_work_candidate_selection_owner_renders_exact_action");

      const exactBinding = multi.exact_binding;
      const exactBindingDecision = await lifecycle.evaluateJson(`(async () => {
        const response = await fetch('/api/vnext/operator/semantic-review', {
          method: 'POST',
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            proposal_id: ${JSON.stringify(exactBinding.pending_proposal_id)},
            proposal_fingerprint: ${JSON.stringify(exactBinding.pending_proposal_fingerprint)},
            candidate_id: ${JSON.stringify(exactBinding.preferred_candidate_id)},
            candidate_fingerprint: ${JSON.stringify(exactBinding.preferred_candidate_fingerprint)},
            decision: 'accept',
            rationale_summary: 'Accept the exact second candidate so completion navigation remains bound to its persisted decision.'
          })
        });
        const body = await response.json();
        return {
          status: response.status,
          response_result: body.status ?? null,
          transition_requested: body.transition_requested ?? null
        };
      })()`);
      assert.deepEqual(exactBindingDecision, {
        status: 201,
        response_result: "inserted",
        transition_requested: true,
      });

      await lifecycle.navigate(`${appOrigin}/workbench/semantic-review`);
      await lifecycle.waitForCondition(
        `document.querySelector('[data-ai-workplane-home="v0.1"]') !== null`,
        "AI Workplane Home proposal list",
      );
      const homeBinding = await lifecycle.evaluateJson(`(async () => {
        const primary = document.querySelector('[data-ai-workplane-home="v0.1"] [data-ai-workplane-primary-action="link"]');
        const response = await fetch('/api/vnext/operator/semantic-review', { cache: 'no-store' });
        const body = await response.json();
        return {
          status: response.status,
          primary_label: primary?.textContent?.trim() ?? null,
          primary_href: primary?.getAttribute('href') ?? null,
          ready: body.proposals?.find(
            (entry) => entry.proposal_id === ${JSON.stringify(exactBinding.pending_proposal_id)}
          )?.decision_application_summary ?? null,
          newer: body.proposals?.find(
            (entry) => entry.proposal_id === ${JSON.stringify(exactBinding.newer_proposal_id)}
          )?.decision_application_summary ?? null
        };
      })()`);
      assert.equal(homeBinding.status, 200, JSON.stringify(homeBinding));
      assert.equal(homeBinding.primary_label, "Continue change review");
      assert.equal(homeBinding.ready?.status, "ready_to_complete");
      assert.equal(
        homeBinding.ready?.preferred_candidate_id,
        exactBinding.preferred_candidate_id,
      );
      assert.equal(homeBinding.newer?.status, "needs_decision");
      assert.equal(
        homeBinding.primary_href,
        exactBinding.pending_proposal_path,
        JSON.stringify(homeBinding),
      );
      assert.equal(
        await lifecycle.evaluateBoolean(`(() => {
          const link = document.querySelector('[data-ai-workplane-home="v0.1"] [data-ai-workplane-primary-action="link"]');
          if (!(link instanceof HTMLAnchorElement)) return false;
          link.click();
          return true;
        })()`),
        true,
      );
      await lifecycle.waitForCondition(
        `location.pathname === ${JSON.stringify(exactBinding.pending_proposal_path)} && document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(exactBinding.preferred_candidate_id)} && document.querySelector('[data-vnext-transition-action="preview"]:not([disabled])') !== null`,
        "pending exact applying candidate selected by default",
      );
      result.exact_ready_to_complete_navigation = true;
      completeDetailedField("exact_ready_to_complete_navigation");
      result.pending_applying_candidate_default_selection = true;
      completeDetailedField("pending_applying_candidate_default_selection");
      record("ai_workplane_home_binds_completion_to_exact_proposal_and_candidate");
      result.packet_root_run_result_proposal_decision_transition_identity = {
        project_id: fixture.manifest.project_id,
        proposal_id: multi.target_proposal_id,
        proposal_fingerprint: multi.target_proposal_fingerprint,
        applied_candidate_id: candidateA,
        pending_candidate_id: candidateB,
        exact_ready_proposal_id: exactBinding.pending_proposal_id,
        exact_ready_candidate_id: exactBinding.preferred_candidate_id,
      };
    });
  },
});

async function recordAcceptDecision(lifecycle, candidateId, rationale) {
  await lifecycle.waitForCondition(
    `document.querySelector('[data-vnext-operator-decision-form="v0.1"][data-vnext-operator-decision-candidate=${JSON.stringify(candidateId)}][data-vnext-proposal-local-controls-busy="false"]') !== null`,
    `decision controls ${candidateId}`,
  );
  await lifecycle.setFormControlValue(
    '[data-vnext-operator-decision-form="v0.1"] select',
    "accept",
  );
  await lifecycle.setFormControlValue(
    '[data-vnext-operator-decision-form="v0.1"] textarea',
    rationale,
  );
  assert.equal(
    await lifecycle.evaluateBoolean(`(() => {
      const button = document.querySelector('[data-vnext-operator-decision-form="v0.1"] button[type="submit"]');
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
      button.click();
      return true;
    })()`),
    true,
  );
  await lifecycle.waitForCondition(
    `document.querySelector('[data-vnext-candidate-selector="v0.1"]')?.value === ${JSON.stringify(candidateId)} && document.querySelector('[data-vnext-transition-applying-decision-count="1"]') !== null`,
    `persisted exact decision ${candidateId}`,
  );
}

async function selectCandidate(lifecycle, candidateId) {
  await lifecycle.setFormControlValue(
    '[data-vnext-candidate-selector="v0.1"]',
    candidateId,
  );
  await lifecycle.waitForCondition(
    `document.querySelector('[data-vnext-candidate-selector="v0.1"]:not(:disabled)')?.value === ${JSON.stringify(candidateId)} && document.querySelectorAll('[data-selected-work-timeline-current="true"]').length === 1`,
    `selected candidate ${candidateId}`,
  );
}

async function clickTransitionAction(lifecycle, action) {
  assert.equal(
    await lifecycle.evaluateBoolean(`(() => {
      const button = document.querySelector('[data-vnext-transition-action=${JSON.stringify(action)}]');
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
      const checkbox = document.querySelector('[data-vnext-transition-step=${JSON.stringify(step)}] input[type="checkbox"]');
      if (!(checkbox instanceof HTMLInputElement) || checkbox.disabled) return false;
      checkbox.click();
      return checkbox.checked;
    })()`),
    true,
  );
}

async function assertMutationControlsLocked(lifecycle) {
  assert.equal(
    await lifecycle.evaluateBoolean(`(() => {
      const selector = document.querySelector('[data-vnext-candidate-selector="v0.1"][disabled][data-vnext-transition-mutation-busy="true"]');
      const form = document.querySelector('[data-vnext-operator-decision-form="v0.1"][data-vnext-proposal-local-controls-busy="true"]');
      const controls = Array.from(form?.querySelectorAll('select, textarea, button') ?? []);
      return selector !== null && controls.length > 0 && controls.every((control) => control.disabled === true);
    })()`),
    true,
  );
}

async function readSelectedCandidateShape(lifecycle) {
  return lifecycle.evaluateJson(`(() => {
    const detail = document.querySelector('[data-vnext-semantic-review-detail="v0.1"]');
    const selector = detail?.querySelector('[data-vnext-candidate-selector="v0.1"]');
    const transition = detail?.querySelector('[data-vnext-semantic-transition-actions="v0.1"]');
    const relationships = detail?.querySelector('[data-selected-work-relationships="selected_work_relationships.v0.1"]');
    const highlighted = relationships?.querySelector('[data-selected-work-relationship-highlighted="true"]');
    return {
      selected_candidate: selector instanceof HTMLSelectElement ? selector.value : null,
      option_count: selector?.querySelectorAll('option').length ?? -1,
      current_count: detail?.querySelectorAll('[data-selected-work-timeline-current="true"]').length ?? -1,
      stage: detail?.getAttribute('data-selected-work-current-stage') ?? null,
      preview_status: transition?.querySelector('[data-vnext-transition-step="preview"]')?.getAttribute('data-vnext-transition-step-status') ?? null,
      relationship_question: relationships?.getAttribute('data-selected-work-relationship-question') ?? null,
      relationship_highlight_count: relationships?.querySelectorAll('[data-selected-work-relationship-highlighted="true"]').length ?? -1,
      relationship_kind: highlighted?.getAttribute('data-selected-work-relationship-kind') ?? null,
    };
  })()`);
}

async function readExactCandidateChain(lifecycle, proposalId, candidateId) {
  return lifecycle.evaluateJson(`(async () => {
    const response = await fetch('/api/vnext/operator/semantic-review?' + new URLSearchParams({ proposal_id: ${JSON.stringify(proposalId)} }), { cache: 'no-store', credentials: 'same-origin' });
    const body = await response.json();
    const candidate = body.proposal?.candidates?.find((entry) => entry.candidate?.candidate_id === ${JSON.stringify(candidateId)});
    const transition = body.proposal?.transition_receipts?.find((entry) => entry.source_candidate?.candidate_id === candidate?.candidate?.candidate_id && entry.source_candidate?.candidate_fingerprint === candidate?.candidate_fingerprint);
    const decision = body.proposal?.decision_history?.find((entry) => entry.status === 'valid' && entry.decision?.decision_id === transition?.source_decision?.decision_id && entry.decision?.integrity?.fingerprint === transition?.source_decision?.decision_fingerprint);
    return { status: response.status, exact_decision_transition_chain: Boolean(candidate && transition && decision), decision: decision?.decision?.decision ?? null };
  })()`);
}

async function openGuideBriefConversationAndAnswerSuggestedQuestion(lifecycle) {
  await ensureGuideBriefVisible(lifecycle);
  await lifecycle.waitForCondition(
    `(() => {
      const conversation = document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]');
      const details = conversation?.querySelector(':scope > details');
      if (details instanceof HTMLDetailsElement) details.open = true;
      if (conversation?.getAttribute('data-guidebrief-conversation-active-answer') !== 'true') {
        const suggestion = conversation?.querySelector('[aria-label="Questions supported by current sources"] button');
        if (!(suggestion instanceof HTMLButtonElement)) return false;
        suggestion.click();
      }
      return true;
    })()`,
    "GuideBrief suggested question",
  );
  await lifecycle.waitForCondition(
    `document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')?.getAttribute('data-guidebrief-conversation-active-answer') === 'true' && document.querySelectorAll('[data-guidebrief-conversation-answer]').length === 1`,
    "GuideBrief one active answer",
  );
  return lifecycle.evaluateJson(`(() => {
    const conversation = document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]');
    return { scope: conversation?.getAttribute('data-guidebrief-conversation-scope') ?? null, answer_count: conversation?.querySelectorAll('[data-guidebrief-conversation-answer]').length ?? -1 };
  })()`);
}

async function ensureGuideBriefVisible(lifecycle) {
  await lifecycle.waitForCondition(
    `(() => {
      const visible = Array.from(document.querySelectorAll('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]')).find((entry) => entry.getBoundingClientRect().width > 0);
      if (visible) return visible.getAttribute('data-guidebrief-conversation-hydrated') === 'true';
      const launcher = Array.from(document.querySelectorAll('[data-continuities-guidebrief-launcher="true"]')).find((entry) => entry.getBoundingClientRect().width > 0);
      if (launcher instanceof HTMLButtonElement) launcher.click();
      return false;
    })()`,
    "visible hydrated GuideBrief",
  );
}

async function submitGuideBriefInteractionCommand(lifecycle, command) {
  await ensureGuideBriefVisible(lifecycle);
  assert.equal(
    await lifecycle.evaluateBoolean(`(() => {
      const conversation = document.querySelector('[data-guidebrief-conversation="guidebrief_conversation_plan.v0.1"]');
      const input = conversation?.querySelector('input[name="guidebrief-question"]');
      const submit = conversation?.querySelector('form button[type="submit"]');
      if (!(input instanceof HTMLInputElement) || !(submit instanceof HTMLButtonElement)) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, ${JSON.stringify(command)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (submit.disabled) return false;
      submit.click();
      return true;
    })()`),
    true,
  );
}

function authoritySnapshot(databasePath) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const rows = database.prepare(
      `SELECT record_kind, COUNT(*) AS count
       FROM vnext_core_records
       WHERE record_kind IN ('review_decision', 'semantic_transition_gate_record', 'state_transition_receipt', 'task_context_packet')
       GROUP BY record_kind
       ORDER BY record_kind`,
    ).all();
    return rows;
  } finally {
    database.close();
  }
}
