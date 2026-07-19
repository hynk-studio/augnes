"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ProjectHomeProjectionV01 } from "@/types/vnext/project-home";
import type { ProjectControlActionV01 } from "@/types/vnext/project-controls";

type AutomationCycleActionV01 =
  | "run_one_bounded_cycle"
  | "cancel_bounded_cycle"
  | "retry_bounded_cycle";

export function ProjectControls({
  projection,
  kind,
}: {
  projection: ProjectHomeProjectionV01;
  kind: "automation" | "personal_perspective";
}) {
  const router = useRouter();
  const [pending, setPending] = useState<
    ProjectControlActionV01 | AutomationCycleActionV01 | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const active = projection.project_summary.is_active;
  const activeSelection = projection.project_summary.active_selection;

  useEffect(() => setHydrated(true), []);

  async function mutate(
    action: ProjectControlActionV01,
    expectedControlRevision: number | null,
  ) {
    if (!active || !activeSelection) return;
    setPending(action);
    setMessage(null);
    try {
      const response = await fetch("/api/vnext/project-controls", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          project_id: projection.project_id,
          expected_active_project_id: activeSelection.project_id,
          expected_active_selection_revision:
            activeSelection.selection_revision,
          expected_control_revision: expectedControlRevision,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error_code?: string;
      };
      if (!response.ok || !payload.ok) {
        setMessage(conflictMessage(payload.error_code));
        return;
      }
      setMessage("Project controls saved.");
      router.refresh();
    } catch {
      setMessage("Project controls could not be saved. Try again.");
    } finally {
      setPending(null);
    }
  }

  async function mutateCycle(action: AutomationCycleActionV01) {
    setPending(action);
    setMessage(null);
    try {
      const response = await fetch("/api/vnext/operator/automation-cycle", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "run_one_bounded_cycle"
            ? {
                expected_control_revision:
                  projection.automation.control_revision,
              }
            : {}),
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error_code?: string;
      };
      if (!response.ok || !payload.ok) {
        setMessage(cycleConflictMessage(payload.error_code));
        return;
      }
      setMessage(
        action === "cancel_bounded_cycle"
          ? "Cancellation requested. Terminal status appears only after the owned host settles."
          : action === "retry_bounded_cycle"
            ? "Proposal settlement retry admitted without rerunning the host."
            : "One bounded policy-triggered cycle started.",
      );
      router.refresh();
    } catch {
      setMessage("The bounded automation action could not be admitted. Try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div
      className="project-control-actions"
      data-project-controls-hydrated={hydrated ? "true" : "false"}
      data-project-control-kind={kind}
    >
      {!active ? (
        <p className="project-control-readonly">
          Make this project active before changing its controls.
        </p>
      ) : (
        <>
          {kind === "automation" ? (
            <div className="project-control-button-row" aria-label="Automation controls">
              {automationActions(projection.automation.status).map((action) => (
              <button
                key={action}
                type="button"
                disabled={!hydrated || pending !== null}
                onClick={() =>
                  mutate(action, projection.automation.control_revision)
                }
              >
                {pending === action ? "Saving…" : actionLabel(action)}
              </button>
              ))}
              {automationCycleActions(projection).map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={!hydrated || pending !== null}
                  onClick={() => mutateCycle(action)}
                >
                  {pending === action ? "Working…" : actionLabel(action)}
                </button>
              ))}
            </div>
          ) : (
            <div className="project-control-button-row" aria-label="Personal Perspective controls">
              {personalPerspectiveActions(
                projection.personal_perspective.status,
              ).map((action) => (
              <button
                key={action}
                type="button"
                disabled={!hydrated || pending !== null}
                onClick={() =>
                  mutate(
                    action,
                    projection.personal_perspective.scope_revision,
                  )
                }
              >
                {pending === action ? "Saving…" : actionLabel(action)}
              </button>
              ))}
            </div>
          )}
        </>
      )}
      <p className="project-control-message" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

function automationActions(
  status: ProjectHomeProjectionV01["automation"]["status"],
): ProjectControlActionV01[] {
  if (status === "not_configured" || status === "disabled") {
    return ["enable_automation"];
  }
  if (status === "enabled") {
    return ["pause_automation", "disable_automation"];
  }
  return ["resume_automation", "disable_automation"];
}

function personalPerspectiveActions(
  status: ProjectHomeProjectionV01["personal_perspective"]["status"],
): ProjectControlActionV01[] {
  if (status === "included") return ["exclude_personal_perspective"];
  if (status === "excluded") return ["include_personal_perspective"];
  return ["include_personal_perspective", "exclude_personal_perspective"];
}

function automationCycleActions(
  projection: ProjectHomeProjectionV01,
): AutomationCycleActionV01[] {
  if (projection.automation.cycle.next_action === "run_one_bounded_cycle") {
    return ["run_one_bounded_cycle"];
  }
  if (projection.automation.cycle.next_action === "cancel") {
    return ["cancel_bounded_cycle"];
  }
  if (
    projection.automation.cycle.next_action ===
    "retry_proposal_settlement"
  ) {
    return ["retry_bounded_cycle"];
  }
  return [];
}

function actionLabel(
  action: ProjectControlActionV01 | AutomationCycleActionV01,
): string {
  return {
    enable_automation: "Enable",
    disable_automation: "Disable",
    pause_automation: "Pause",
    resume_automation: "Resume",
    include_personal_perspective: "Include Personal Perspective",
    exclude_personal_perspective: "Exclude Personal Perspective",
    run_one_bounded_cycle: "Run one bounded cycle",
    cancel_bounded_cycle: "Request cancellation",
    retry_bounded_cycle: "Retry proposal settlement",
  }[action];
}

function conflictMessage(errorCode?: string): string {
  if (errorCode === "active_project_conflict") {
    return "The active project changed. Refresh and try again.";
  }
  if (errorCode === "automation_revision_conflict") {
    return "Automation settings changed in another view. Refresh and try again.";
  }
  if (errorCode === "personal_perspective_revision_conflict") {
    return "Personal Perspective scope changed in another view. Refresh and try again.";
  }
  if (
    errorCode === "automation_transition_invalid" ||
    errorCode === "personal_perspective_transition_invalid"
  ) {
    return "These project controls changed in another view. Refresh and try again.";
  }
  return "Project controls could not be saved. Refresh and try again.";
}

function cycleConflictMessage(errorCode?: string): string {
  if (errorCode === "bounded_automation_control_revision_conflict") {
    return "Automation settings changed in another view. Refresh and try again.";
  }
  if (errorCode?.includes("review_needed")) {
    return "Automation already stopped for human review.";
  }
  if (errorCode === "bounded_automation_retry_not_allowed") {
    return "This failure is not retryable without changing its source or control state.";
  }
  return "The bounded automation gate refused this action. Refresh for the current reason.";
}
