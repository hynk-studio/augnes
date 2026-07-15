"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ProjectHomeProjectionV01 } from "@/types/vnext/project-home";
import type { ProjectControlActionV01 } from "@/types/vnext/project-controls";

export function ProjectControls({
  projection,
  kind,
}: {
  projection: ProjectHomeProjectionV01;
  kind: "automation" | "personal_perspective";
}) {
  const router = useRouter();
  const [pending, setPending] = useState<ProjectControlActionV01 | null>(null);
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

function actionLabel(action: ProjectControlActionV01): string {
  return {
    enable_automation: "Enable",
    disable_automation: "Disable",
    pause_automation: "Pause",
    resume_automation: "Resume",
    include_personal_perspective: "Include Personal Perspective",
    exclude_personal_perspective: "Exclude Personal Perspective",
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
