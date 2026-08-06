"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { DirectHostRoundTripAction } from "@/components/direct-host-round-trip-action";
import {
  GuideBriefConversation,
  type GuideBriefInteractionHostV01,
} from "@/components/guide/guide-brief-conversation";
import { ProjectControls } from "@/components/project-controls";
import {
  PROJECT_SETTINGS_ACTIVATION_EVENT,
} from "@/components/project-settings-link";
import {
  ContinuityPinAction,
  ContinuityPinFeedback,
  MobilePinnedContinuities,
} from "@/components/continuity-pins/continuity-pins-ui";
import {
  blankStatePresentationModeV01,
  blankStateAttentionLabelV01,
  projectFolderPickerMessageV01,
  projectFolderSelectionErrorMessageV01,
  publicBlankStateTextV01,
  type ProjectFolderSelectionMessageV01,
} from "@/lib/vnext/blank-state/blank-state-view";
import {
  createOpaqueGuideBriefInteractionTargetHandleV01,
} from "@/lib/vnext/guide-brief/guide-brief-interaction-plan";
import {
  buildGuideBriefConversationScopeKeyV01,
} from "@/lib/vnext/guide-brief/guide-brief-conversation-plan";
import {
  SEMANTIC_SURFACE_ROLE,
  SEMANTIC_VISUAL_PRIORITY,
} from "@/lib/vnext/semantic-visual/semantic-visual-contract";
import type {
  BlankStateContinuityItemV01,
  BlankStatePresentationModeV01,
  BlankStatePrimaryActionV01,
  BlankStateSourceV01,
  BlankStateViewV01,
  ContinuitiesTemporalContextV01,
} from "@/types/vnext/blank-state";
import type {
  LocalFolderPickerOutcomeV01,
  LocalProjectRecoverySelectionOutcomeV01,
  ProjectOnboardingErrorCodeV01,
  RecentProjectEntryV01,
} from "@/types/vnext/project-onboarding";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";
import type { ManagementSafetyViewV01 } from "@/types/vnext/management-safety";
import { PROJECT_DISPLAY_NAME_MAX_LENGTH_V01 } from "@/types/vnext/project-identity";

type ProjectRecoveryStateV01 = {
  entry: RecentProjectEntryV01;
  mode: "picker" | "path";
  picker: LocalProjectRecoverySelectionOutcomeV01 | null;
  picker_pending: boolean;
  declared_path: string;
  message: ProjectFolderSelectionMessageV01 | null;
};

function infoMessage(text: string): ProjectFolderSelectionMessageV01 {
  return { tone: "info", text };
}

function errorMessage(text: string): ProjectFolderSelectionMessageV01 {
  return { tone: "error", text };
}

function recoverySelectionErrorMessageV01(
  error: unknown,
): ProjectFolderSelectionMessageV01 {
  const code = error instanceof Error
    ? error.message
    : "project_management_unavailable";
  return errorMessage(
    code === "path_declaration_empty"
      ? "Enter an absolute folder path."
      : code === "path_declaration_relative"
        ? "Enter the full absolute path to the folder."
        : code === "path_declaration_url"
          ? "Enter a local folder path, not a URL."
          : code === "path_declaration_too_large"
            ? "That folder path is too long to review."
            : code === "path_declaration_control_character"
              ? "That folder path contains unsupported characters."
              : code === "path_declaration_unsupported"
                ? "That kind of local path is not supported here."
                : code === "selection_missing"
                  ? "That folder could not be found. Check the path and try again."
                  : code === "selection_inaccessible"
                    ? "Augnes cannot read that folder. Check its permissions and try again."
                    : code === "selection_not_directory"
                      ? "That path points to a file, not a folder."
                      : code === "physical_identity_unsupported"
                        ? "That folder is on an unsupported filesystem or location."
                        : code === "physical_identity_ambiguous"
                          ? "Augnes cannot determine one exact local folder for that path."
                          : code === "physical_identity_unavailable"
                            ? "Augnes could not verify that folder at this time. Try again."
                            : code === "active_selection_conflict"
                              ? "The current project changed. Refresh before locating this folder again."
                              : code === "project_scope_conflict"
                                ? "That folder is already connected to another project, or this saved project changed. Nothing was changed."
                                : code === "inspection_stale"
                                  ? "The saved project or selected folder changed. Review the folder again."
                                  : "That folder could not be reviewed. Check it and try again.",
  );
}

function recoveryConfirmationErrorMessageV01(
  error: unknown,
): ProjectFolderSelectionMessageV01 {
  const code = error instanceof Error
    ? error.message
    : "project_management_unavailable";
  return errorMessage(
    code === "active_selection_conflict"
      ? "The current project changed. Refresh before reviewing the folder again."
      : code === "operator_session_expired" ||
          code === "operator_action_nonce_expired"
        ? "Local confirmation access expired. Review the folder again."
      : code === "operator_session_scope_mismatch" ||
          code === "operator_decision_challenge_invalid"
        ? "The recovery request changed. Review the folder again."
      : code.startsWith("operator_")
        ? "Augnes could not establish local confirmation access. Nothing was changed; review the folder again."
        : code === "project_scope_conflict" ||
            code === "project_root_rebind_conflict"
          ? "That folder belongs to another project, or the saved project changed. Nothing was changed."
          : "The folder or saved project changed during confirmation. Nothing was changed; review the folder again.",
  );
}

function projectMutationErrorCode(error: unknown):
  | ProjectOnboardingErrorCodeV01
  | "project_management_unavailable" {
  if (!(error instanceof Error)) return "project_management_unavailable";
  const errorCode = error.message as
    | ProjectOnboardingErrorCodeV01
    | "project_management_unavailable";
  return errorCode;
}

export function BlankStateClient({
  source,
  view,
  guide,
  temporalContext,
  managementSafety,
}: {
  source: BlankStateSourceV01;
  view: BlankStateViewV01;
  guide: ProjectGuideBriefV02;
  temporalContext: ContinuitiesTemporalContextV01;
  managementSafety: ManagementSafetyViewV01;
}) {
  const [recent, setRecent] = useState(source.recent_projects);
  const [picker, setPicker] = useState<LocalFolderPickerOutcomeV01 | null>(null);
  const [busy, setBusy] = useState(false);
  const [pickerPending, setPickerPending] = useState(false);
  const [onboardingMode, setOnboardingMode] =
    useState<"picker" | "path">("picker");
  const [declaredPath, setDeclaredPath] = useState("");
  const [message, setMessage] =
    useState<ProjectFolderSelectionMessageV01 | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [recovery, setRecovery] = useState<ProjectRecoveryStateV01 | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<RecentProjectEntryV01 | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [renameMessage, setRenameMessage] =
    useState<ProjectFolderSelectionMessageV01 | null>(null);
  const [continuityFilter, setContinuityFilter] = useState("");
  const [continuityMode, setContinuityMode] = useState<"all" | "attention">(
    "all",
  );
  const [guideOpen, setGuideOpen] = useState(false);
  const guideDialogRef = useRef<HTMLDialogElement>(null);
  const guideLauncherRef = useRef<HTMLButtonElement>(null);
  const projectSettingsRef = useRef<HTMLDetailsElement>(null);
  const projectIdentityRef = useRef<HTMLElement>(null);
  const pickerAttemptRef = useRef(0);
  const pickerAbortRef = useRef<AbortController | null>(null);

  useEffect(() => setHydrated(true), []);
  useEffect(() => setRecent(source.recent_projects), [source.recent_projects]);
  useEffect(() => {
    const openAndFocusProjectSettings = () => {
      const settings = projectSettingsRef.current;
      const identity = projectIdentityRef.current;
      if (!settings && !identity) return;
      const wasOpen = settings?.open ?? true;
      if (settings) settings.open = true;
      window.requestAnimationFrame(() => {
        const identityInput = identity?.querySelector<HTMLElement>(
          'input[name="current-project-display-name"]',
        );
        const summary = settings?.querySelector<HTMLElement>(":scope > summary");
        (settings && !wasOpen ? summary : identityInput ?? summary ?? identity)
          ?.focus();
      });
    };
    const openFromHash = () => {
      if (window.location.hash === "#project-settings") {
        openAndFocusProjectSettings();
      }
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    window.addEventListener(
      PROJECT_SETTINGS_ACTIVATION_EVENT,
      openAndFocusProjectSettings,
    );
    return () => {
      window.removeEventListener("hashchange", openFromHash);
      window.removeEventListener(
        PROJECT_SETTINGS_ACTIVATION_EVENT,
        openAndFocusProjectSettings,
      );
    };
  }, []);
  useEffect(() => {
    const dialog = guideDialogRef.current;
    if (!dialog) return;
    if (guideOpen && !dialog.open) {
      dialog.showModal();
    } else if (!guideOpen && dialog.open) {
      dialog.close();
    }
  }, [guideOpen]);

  async function mutate(body: Record<string, unknown>, signal?: AbortSignal) {
    const response = await fetch("/api/vnext/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const value = await response.json();
    if (!response.ok || !value.ok) {
      throw new Error(value.error_code ?? "project_management_unavailable");
    }
    return value;
  }

  async function choose() {
    pickerAbortRef.current?.abort();
    const attempt = ++pickerAttemptRef.current;
    const controller = new AbortController();
    pickerAbortRef.current = controller;
    setOnboardingMode("picker");
    setPickerPending(true);
    setMessage(null);
    setRenameMessage(null);
    try {
      const value = await mutate({ action: "choose_folder" }, controller.signal);
      if (attempt !== pickerAttemptRef.current || controller.signal.aborted) return;
      setPicker(value.picker);
      setMessage(projectFolderPickerMessageV01(value.picker));
    } catch (error) {
      if (attempt !== pickerAttemptRef.current || controller.signal.aborted) return;
      setMessage(
        projectFolderSelectionErrorMessageV01(
          projectMutationErrorCode(error),
        ),
      );
    } finally {
      if (attempt === pickerAttemptRef.current) {
        pickerAbortRef.current = null;
        setPickerPending(false);
      }
    }
  }

  function cancelPickerAttempt(nextMode: "picker" | "path") {
    pickerAttemptRef.current += 1;
    pickerAbortRef.current?.abort();
    pickerAbortRef.current = null;
    setPickerPending(false);
    setOnboardingMode(nextMode);
    setMessage(nextMode === "path"
      ? infoMessage("Enter the folder path from the computer running Augnes.")
      : infoMessage("The folder picker was cancelled. Nothing changed."));
  }

  async function reviewDeclaredPath() {
    setBusy(true);
    setMessage(null);
    try {
      const value = await mutate({ action: "declare_path", path: declaredPath });
      setPicker(value.picker);
      setMessage(projectFolderPickerMessageV01(value.picker));
    } catch (error) {
      const code = projectMutationErrorCode(error);
      setMessage(errorMessage(
        code === "path_declaration_empty"
          ? "Enter an absolute folder path."
          : code === "path_declaration_relative"
            ? "Enter the full absolute path to the folder."
            : code === "path_declaration_url"
              ? "Enter a local folder path, not a URL."
              : code === "path_declaration_too_large"
                ? "That folder path is too long to review."
                : code === "path_declaration_control_character"
                  ? "That folder path contains unsupported characters."
                  : code === "selection_missing"
                    ? "That folder could not be found. Check the path and try again."
                    : code === "selection_inaccessible"
                      ? "Augnes cannot read that folder. Check its permissions and try again."
                      : code === "selection_not_directory"
                        ? "That path points to a file, not a folder."
                        : code === "physical_identity_unsupported"
                          ? "That folder is on an unsupported filesystem or location."
                          : code === "physical_identity_ambiguous"
                            ? "Augnes cannot determine one exact local folder for that path."
                            : code === "physical_identity_unavailable"
                              ? "Augnes could not verify that folder at this time. Try again."
                          : "That folder could not be reviewed. Check the path and try again.",
      ));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(displayName: string) {
    if (!picker || picker.status !== "selected") return;
    setBusy(true);
    try {
      const common = {
        selection_token: picker.selection_token,
        inspection_fingerprint: picker.inspection.inspection_fingerprint,
        display_name: displayName,
      };
      const value = picker.selection_origin === "declared_path"
        ? await (async () => {
            const prepared = await mutate({
              action: "prepare_onboarding_confirmation",
              ...common,
            });
            return mutate({
              action: "confirm_declared_path",
              ...common,
              challenge_fingerprint:
                prepared.confirmation.challenge_fingerprint,
            });
          })()
        : await mutate({ action: "confirm", ...common });
      window.location.assign(value.result.destination);
    } catch (error) {
      setMessage(error instanceof Error && error.message === "active_selection_conflict"
        ? errorMessage("The current project changed. Refresh and choose the folder again.")
        : error instanceof Error && error.message === "inspection_stale"
          ? errorMessage("The folder changed. Choose it again before confirming.")
          : errorMessage("The project could not be added."));
      setPicker(null);
    } finally {
      setBusy(false);
    }
  }

  function cancelInspection() {
    if (picker?.status === "selected") {
      void mutate({
        action: "abandon_selection",
        selection_token: picker.selection_token,
      }).catch(() => undefined);
    }
    setPicker(null);
    setMessage(null);
    setOnboardingMode("picker");
  }

  async function renameProject(displayName: string) {
    const activeEntry = recent.find((entry) => entry.is_active);
    if (
      !activeEntry ||
      !activeEntry.active_project_id ||
      !activeEntry.active_selection_revision
    ) {
      setRenameMessage(errorMessage(
        "The current project changed. Refresh before renaming it.",
      ));
      return;
    }
    setBusy(true);
    setRenameMessage(null);
    try {
      await mutate({
        action: "rename",
        project_id: activeEntry.project.project_id,
        expected_active_project_id: activeEntry.active_project_id,
        expected_active_selection_revision:
          activeEntry.active_selection_revision,
        expected_current_display_name: activeEntry.project.display_name,
        requested_display_name: displayName,
      });
      if (window.location.pathname === "/") {
        window.history.replaceState(null, "", "/#project-settings");
        window.location.reload();
      } else {
        window.location.assign("/#project-settings");
      }
    } catch (error) {
      setRenameMessage(
        error instanceof Error && error.message === "project_display_name_conflict"
          ? errorMessage(
            "The project name changed in another view. Refresh and try again.",
          )
          : error instanceof Error && error.message === "active_selection_conflict"
            ? errorMessage(
              "The current project changed. Refresh before renaming it.",
            )
            : error instanceof Error && error.message === "project_display_name_invalid"
              ? errorMessage(
                `Enter a project name between 1 and ${PROJECT_DISPLAY_NAME_MAX_LENGTH_V01} characters.`,
              )
              : errorMessage(
                "The project name could not be saved. Nothing else changed.",
              ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmRepositoryExecutionDecision(entry: RecentProjectEntryV01) {
    const decision = entry.repository_execution_decision;
    if (!decision || decision.status !== "pending") return;
    setBusy(true);
    setRenameMessage(null);
    try {
      const prepared = await mutate({
        action: "prepare_repository_execution_decision_confirmation",
        workspace_id: decision.workspace_id,
        project_id: decision.project_id,
        request_fingerprint: decision.request_fingerprint,
      });
      const value = await mutate({
        action: "confirm_repository_execution_decision",
        workspace_id: decision.workspace_id,
        project_id: decision.project_id,
        request_fingerprint: decision.request_fingerprint,
        challenge_fingerprint:
          prepared.confirmation.challenge_fingerprint,
      });
      setRecent((items) => items.map((item) =>
        item.project.project_id === entry.project.project_id
          ? { ...item, repository_execution_decision: value.result }
          : item));
      setRenameMessage(infoMessage(
        decision.action === "start_repository_managed_delegation"
          ? "Start confirmed. The exact prepared attachment can be consumed into one managed run."
          : decision.action === "resume_repository_managed_delegation"
            ? "Resume confirmed. Augnes can consume this one-time grant for the exact same run."
          : "Decision confirmed. Augnes can finish the exact requested repository change.",
      ));
    } catch (error) {
      setRenameMessage(errorMessage(
        error instanceof Error && error.message === "repository_execution_decision_expired"
          ? "This decision expired. Ask Augnes to prepare a fresh request."
          : error instanceof Error && error.message.startsWith("operator_")
            ? "Confirm this change from an authenticated local review session."
          : "The repository decision changed or could not be confirmed. Refresh and try again.",
      ));
    } finally {
      setBusy(false);
    }
  }

  async function open(entry: RecentProjectEntryV01) {
    if (entry.root_availability !== "available") {
      setMessage(errorMessage("Locate the folder before opening this project."));
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const value = await mutate({
        action: "open",
        project_id: entry.project.project_id,
        expected_project_id: entry.active_project_id,
        expected_revision: entry.active_selection_revision,
      });
      window.location.assign(value.result.destination);
    } catch {
      setMessage(errorMessage("The current project changed. Refresh and try again."));
    } finally {
      setBusy(false);
    }
  }

  async function activate(projectId: string) {
    setBusy(true);
    setMessage(null);
    try {
      await mutate({
        action: "open",
        project_id: projectId,
        expected_project_id: source.active_project_id,
        expected_revision: source.recent_projects.find((entry) => entry.is_active)
          ?.active_selection_revision ?? null,
      });
      window.location.reload();
    } catch {
      setMessage(errorMessage("The current project changed. Refresh and try again."));
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemoval() {
    if (!pendingRemoval) return;
    const entry = pendingRemoval;
    setBusy(true);
    setMessage(null);
    setDialogError(null);
    try {
      await mutate({
        action: "remove",
        project_id: entry.project.project_id,
        expected_project_id: entry.active_project_id,
        expected_revision: entry.active_selection_revision,
      });
      setRecent((items) => items
        .filter((item) => item.project.project_id !== entry.project.project_id)
        .map((item) => entry.is_active
          ? { ...item, is_active: false, active_project_id: null, active_selection_revision: null }
          : item));
      setMessage(infoMessage("Removed from recent projects. Project data remains stored."));
      setPendingRemoval(null);
    } catch (error) {
      setDialogError(error instanceof Error && error.message === "active_selection_conflict"
        ? "The current project changed. Refresh before retrying this removal."
        : "The project could not be removed from recents. Nothing was removed; you can retry or cancel.");
    } finally {
      setBusy(false);
    }
  }

  function locate(entry: RecentProjectEntryV01) {
    pickerAttemptRef.current += 1;
    pickerAbortRef.current?.abort();
    pickerAbortRef.current = null;
    if (picker?.status === "selected") {
      void mutate({
        action: "abandon_selection",
        selection_token: picker.selection_token,
      }).catch(() => undefined);
    }
    setPicker(null);
    setPickerPending(false);
    setMessage(null);
    setDialogError(null);
    setRecovery({
      entry,
      mode: "picker",
      picker: null,
      picker_pending: false,
      declared_path: "",
      message: null,
    });
  }

  function recoveryScope(entry: RecentProjectEntryV01) {
    return {
      project_id: entry.project.project_id,
      expected_old_root_binding_fingerprint:
        entry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        entry.physical_root_baseline_fingerprint,
      expected_active_project_id: entry.active_project_id,
      expected_active_selection_revision:
        entry.active_selection_revision,
    };
  }

  async function chooseRecoveryFolder() {
    if (!recovery) return;
    pickerAbortRef.current?.abort();
    const attempt = ++pickerAttemptRef.current;
    const controller = new AbortController();
    pickerAbortRef.current = controller;
    const entry = recovery.entry;
    setRecovery((current) => current && current.entry.project.project_id === entry.project.project_id
      ? { ...current, mode: "picker", picker: null, picker_pending: true, message: null }
      : current);
    try {
      const value = await mutate({
        action: "choose_recovery_folder",
        ...recoveryScope(entry),
      }, controller.signal);
      if (attempt !== pickerAttemptRef.current || controller.signal.aborted) return;
      const chosen = value.picker as
        | LocalProjectRecoverySelectionOutcomeV01
        | Exclude<LocalFolderPickerOutcomeV01, { status: "selected" }>;
      setRecovery((current) => current && current.entry.project.project_id === entry.project.project_id
        ? {
            ...current,
            picker: chosen.status === "selected" ? chosen : null,
            picker_pending: false,
            message: projectFolderPickerMessageV01(chosen),
          }
        : current);
    } catch (error) {
      if (attempt !== pickerAttemptRef.current || controller.signal.aborted) return;
      setRecovery((current) => current && current.entry.project.project_id === entry.project.project_id
        ? {
            ...current,
            picker: null,
            picker_pending: false,
            message: recoverySelectionErrorMessageV01(error),
          }
        : current);
    } finally {
      if (attempt === pickerAttemptRef.current) {
        pickerAbortRef.current = null;
        setRecovery((current) => current && current.entry.project.project_id === entry.project.project_id
          ? { ...current, picker_pending: false }
          : current);
      }
    }
  }

  function changeRecoveryMode(mode: "picker" | "path") {
    pickerAttemptRef.current += 1;
    pickerAbortRef.current?.abort();
    pickerAbortRef.current = null;
    setRecovery((current) => current
      ? {
          ...current,
          mode,
          picker: null,
          picker_pending: false,
          message: mode === "path"
            ? infoMessage("Enter the folder path from the computer running Augnes.")
            : null,
        }
      : current);
  }

  async function reviewRecoveryDeclaredPath() {
    if (!recovery) return;
    const entry = recovery.entry;
    setBusy(true);
    setRecovery((current) => current ? { ...current, message: null } : current);
    try {
      const value = await mutate({
        action: "declare_recovery_path",
        path: recovery.declared_path,
        ...recoveryScope(entry),
      });
      setRecovery((current) => current && current.entry.project.project_id === entry.project.project_id
        ? {
            ...current,
            picker: value.picker as LocalProjectRecoverySelectionOutcomeV01,
            message: null,
          }
        : current);
    } catch (error) {
      setRecovery((current) => current && current.entry.project.project_id === entry.project.project_id
        ? { ...current, picker: null, message: recoverySelectionErrorMessageV01(error) }
        : current);
    } finally {
      setBusy(false);
    }
  }

  function abandonRecoverySelection(
    current: ProjectRecoveryStateV01,
  ) {
    if (!current.picker) return;
    void mutate({
      action: "abandon_recovery_selection",
      project_id: current.entry.project.project_id,
      selection_token: current.picker.selection_token,
    }).catch(() => undefined);
  }

  function cancelRecoveryReview() {
    if (!recovery) return;
    abandonRecoverySelection(recovery);
    setRecovery({
      ...recovery,
      mode: recovery.picker?.selection_origin === "declared_path"
        ? "path"
        : "picker",
      picker: null,
      message: null,
    });
  }

  function cancelRecovery() {
    if (!recovery) return;
    const projectId = recovery.entry.project.project_id;
    pickerAttemptRef.current += 1;
    pickerAbortRef.current?.abort();
    pickerAbortRef.current = null;
    abandonRecoverySelection(recovery);
    setRecovery(null);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(
        `[data-project-locate=${JSON.stringify(projectId)}]`,
      )?.focus();
    });
  }

  async function confirmRecovery() {
    if (!recovery?.picker) return;
    const { entry, picker: chosen } = recovery;
    setBusy(true);
    setRecovery((current) => current ? { ...current, message: null } : current);
    try {
      const common = {
        project_id: entry.project.project_id,
        selection_token: chosen.selection_token,
        inspection_fingerprint: chosen.inspection.inspection_fingerprint,
        expected_old_root_binding_fingerprint: entry.root_binding_fingerprint,
        expected_old_baseline_fingerprint:
          entry.physical_root_baseline_fingerprint,
      };
      const value = chosen.recovery_action === "open_project"
        ? await mutate({ action: "open_recovery_selection", ...common })
        : await (async () => {
            const prepared = await mutate({
              action: "prepare_repository_execution_rebind_confirmation",
              ...common,
            });
            return mutate({
              action: "confirm_rebind",
              ...common,
              decision_request_fingerprint:
                prepared.decision_request_fingerprint,
              challenge_fingerprint:
                prepared.confirmation.challenge_fingerprint,
            });
          })();
      window.location.assign(value.result.destination);
    } catch (error) {
      setRecovery((current) => current && current.entry.project.project_id === entry.project.project_id
        ? {
            ...current,
            mode: chosen.selection_origin === "declared_path" ? "path" : "picker",
            picker: null,
            message: recoveryConfirmationErrorMessageV01(error),
          }
        : current);
    } finally {
      setBusy(false);
    }
  }

  const projection = source.projection;
  const presentationMode = blankStatePresentationModeV01(view);
  const activeContinuities = presentationMode === "active_continuities";
  const projectSelection =
    presentationMode === "local_project_onboarding" ||
    presentationMode === "project_choice";
  const primaryEntry = primaryRecentEntry(view.primary_action, recent);
  const blankInteraction = useMemo<GuideBriefInteractionHostV01>(() => {
    const scopeKey = buildGuideBriefConversationScopeKeyV01({
      guide,
      question: "",
      conversation_context: null,
    });
    const exactDestination =
      view.primary_action?.kind === "link"
        ? view.primary_action.href
        : null;
    const targetHandle =
      exactDestination === null
          ? null
          : createOpaqueGuideBriefInteractionTargetHandleV01([
            guide.identity.workspace_id ?? "no-workspace",
            guide.identity.project_id ?? "no-project",
            scopeKey,
            exactDestination,
          ]);
    return {
      context: {
        pc4_scope_key: scopeKey,
        workspace_id: guide.identity.workspace_id,
        project_id: guide.identity.project_id,
        project_context: guide.identity.project_context,
        active_project_id: guide.identity.active_project_id,
        proposal_id: null,
        proposal_fingerprint: null,
        candidate_id: null,
        candidate_fingerprint: null,
        pc2: null,
        pc3: null,
        owner_state: {
          busy,
          decision_applying_kind: null,
          decision_eligible: false,
          transition_preview_available: false,
        },
      },
      capabilities:
        exactDestination && targetHandle
          ? [{
              capability_version: "browser_action_capability.v0.1",
              action_key: "surface.open_current_action",
              target_handle: targetHandle,
              public_label: "Take me to the current action",
              public_effect_preview:
                "Open the exact current destination without activating its action.",
              owner: "pc2_current_action_surface",
              effect_class: "navigation",
              availability: busy ? "blocked" : "available",
              unavailable_reason: busy
                ? "The current action owner is busy."
                : null,
              interaction_scope_key: scopeKey,
              owner_actionability_identity: [
                view.primary_action?.kind,
                exactDestination,
                busy ? "busy" : "available",
              ].join(":"),
              confirmation_policy: "immediate_current_scope",
              destination: exactDestination,
              may_propose: !busy,
              may_execute_immediately: !busy,
              route_key: "current_action",
              target_scope: {
                workspace_id: guide.identity.workspace_id,
                project_id: guide.identity.project_id,
                proposal_id: null,
                proposal_fingerprint: null,
                candidate_id: null,
                candidate_fingerprint: null,
              },
              authority: {
                projection_only: true,
                durable: false,
                semantic_authority: false,
                transition_authority: false,
                execution_authority: false,
                external_action_authority: false,
              },
            }]
          : [],
      adapters:
        exactDestination && targetHandle
          ? [{
              action_key: "surface.open_current_action",
              target_handle: targetHandle,
              owner: "pc2_current_action_surface",
              effect_class: "navigation",
              invoke: async () => {
                window.location.assign(exactDestination);
                return {
                  status: "completed",
                  public_observed_effect:
                    "The existing current-action destination is now open. No project action was performed.",
                  durable_state_changed: false,
                  exact_result_ref: null,
                };
              },
            }]
          : [],
    };
  }, [busy, guide, view.primary_action]);
  const projectManagement = recovery ? (
    <ProjectRecovery
      recovery={recovery}
      busy={busy}
      onChoose={() => void chooseRecoveryFolder()}
      onEnterPath={() => changeRecoveryMode("path")}
      onCancelPicker={() => changeRecoveryMode("picker")}
      onReturnToPicker={() => changeRecoveryMode("picker")}
      onDeclaredPathChange={(value) => setRecovery((current) => current
        ? { ...current, declared_path: value }
        : current)}
      onReviewDeclaredPath={() => void reviewRecoveryDeclaredPath()}
      onConfirm={() => void confirmRecovery()}
      onCancelReview={cancelRecoveryReview}
      onCancel={cancelRecovery}
    />
  ) : (
    <ProjectManagement
      presentationMode={presentationMode}
      projectManagementEmphasized={view.project_management_emphasized}
      recent={recent}
      picker={picker}
      busy={busy}
      pickerPending={pickerPending}
      onboardingMode={onboardingMode}
      declaredPath={declaredPath}
      message={message}
      primaryAction={view.primary_action}
      onChoose={() => void choose()}
      onEnterPath={() => cancelPickerAttempt("path")}
      onCancelPicker={() => cancelPickerAttempt("picker")}
      onReturnToPicker={() => {
        setPicker(null);
        setMessage(null);
        setOnboardingMode("picker");
      }}
      onDeclaredPathChange={setDeclaredPath}
      onReviewDeclaredPath={() => void reviewDeclaredPath()}
      onConfirm={(displayName) => void confirm(displayName)}
      onOpen={(entry) => void open(entry)}
      onLocate={(entry) => void locate(entry)}
      onRemove={(entry) => {
        setMessage(null);
        setDialogError(null);
        setPendingRemoval(entry);
      }}
      onCancelInspection={cancelInspection}
    />
  );
  const activeProjectEntry = recent.find((entry) => entry.is_active) ?? null;
  const projectIdentityManagement = activeProjectEntry ? (
    <ProjectIdentityManagement
      ownerId={
        activeContinuities && view.project_management_emphasized
          ? "project-settings"
          : undefined
      }
      ownerRef={projectIdentityRef}
      entry={activeProjectEntry}
      busy={busy}
      message={renameMessage}
      onSave={(displayName) => void renameProject(displayName)}
      onConfirmRepositoryDecision={(entry) =>
        void confirmRepositoryExecutionDecision(entry)}
    />
  ) : null;
  const normalizedContinuityFilter = continuityFilter.trim().toLocaleLowerCase();
  const shownContinuityItems = [
    view.highlighted_item,
    ...view.continuity_items,
  ];
  const attentionContinuityCount = shownContinuityItems.filter(
    (item) => item.requires_human_attention,
  ).length;
  const itemMatchesCurrentFilters = (item: BlankStateContinuityItemV01) =>
    (continuityMode === "all" || item.requires_human_attention) &&
    continuityItemMatchesV01(item, normalizedContinuityFilter);
  const highlightedVisible = itemMatchesCurrentFilters(view.highlighted_item);
  const visibleContinuityItems = view.continuity_items.filter((item) =>
    itemMatchesCurrentFilters(item)
  );
  const firstWorkSetup = view.focus === "first_work_not_defined";

  function closeGuide() {
    const dialog = guideDialogRef.current;
    setGuideOpen(false);
    if (dialog?.open) dialog.close();
    window.requestAnimationFrame(() => guideLauncherRef.current?.focus());
  }

  const guideSupportText =
    presentationMode === "active_continuities"
      ? "Get context on the current project and what comes next."
      : presentationMode === "local_project_onboarding" ||
          presentationMode === "project_choice"
        ? "Learn how to begin with a local project."
        : "Get context on this project and the next available step.";
  const guideRailTarget =
    hydrated && typeof document !== "undefined"
      ? document.getElementById("continuities-guide-rail-support")
      : null;
  const guideLauncher = (
    <section
      className="continuities-guide-launcher"
      data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.guideBrief}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <p className="blank-state-region-label">Contextual support</p>
      <h2>Ask GuideBrief</h2>
      <p>{guideSupportText}</p>
      <button
        ref={guideLauncherRef}
        type="button"
        aria-haspopup="dialog"
        aria-controls="continuities-guide-dialog"
        aria-expanded={guideOpen}
        data-continuities-guidebrief-launcher="true"
        aria-label="Open GuideBrief"
        onClick={() => setGuideOpen(true)}
      >
        <span className="continuities-action-label-full">
          Open GuideBrief
        </span>
        <span
          className="continuities-action-label-compact"
          aria-hidden="true"
        >
          GuideBrief
        </span>
      </button>
    </section>
  );

  return (
    <>
      <main
        className="blank-state-shell"
        data-blank-state="v0.1"
        data-blank-state-focus={view.focus}
        data-guide-brief-version={guide.guide_version}
        data-guide-brief-source-status={guide.source_status}
        data-guide-brief-project-context={guide.identity.project_context}
        data-blank-state-active={projection?.project_summary.is_active ? "true" : "false"}
        data-blank-state-project-management-hydrated={hydrated ? "true" : "false"}
        data-blank-state-presentation={presentationMode}
        data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.blankState}
      >
        <div className="continuities-layout">
          <div className="continuities-workstream">
            <section
              className="blank-state-focus"
              aria-labelledby="blank-state-title"
              data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
            >
              <h1 id="blank-state-title">Continuities</h1>
              <p className="continuities-tagline">
                Work and perspective you carry forward.
              </p>
              {!projectSelection ? (
                <div className="continuities-current-situation">
                  {view.project_name ? (
                    <p className="blank-state-project-context">
                      {view.project_context_label} ·{" "}
                      <strong>{view.project_name}</strong>
                    </p>
                  ) : null}
                  <div className="continuities-current-situation-copy">
                    <p className="blank-state-region-label">Current situation</p>
                    <h2>{view.heading}</h2>
                    <p className="blank-state-situation">{view.situation}</p>
                  </div>
                  {view.material_note ? (
                    <p
                      className="blank-state-material-note"
                      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.risk}
                    >
                      {view.material_note}
                    </p>
                  ) : null}
                  {activeContinuities &&
                  view.why_this_is_next.observed.length ? (
                    <details
                      className="blank-state-guide-disclosure"
                      data-guide-brief-disclosure="v0.2"
                      data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.guideBrief}
                      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.aiSummary}
                    >
                      <summary>Why this is next</summary>
                      <div>
                        <p>{view.why_this_is_next.observed[0]}</p>
                        {view.why_this_is_next.inferred[0] ? (
                          <p>
                            {view.why_this_is_next.inferred[0].statement}{" "}
                            <span>
                              {view.why_this_is_next.inferred[0].caveats[0]}
                            </span>
                          </p>
                        ) : null}
                        {view.why_this_is_next.needs_user_judgment[0] ? (
                          <p>
                            Waiting for your judgment:{" "}
                            {view.why_this_is_next.needs_user_judgment[0]}
                          </p>
                        ) : null}
                        <p>
                          This guidance is read-only and does not make the
                          decision for you.
                        </p>
                      </div>
                    </details>
                  ) : null}
                  {!activeContinuities && view.primary_action && !recovery ? (
                    <div className="continuities-focused-actions">
                      <PrimaryAction
                        action={view.primary_action}
                        item={view.highlighted_item}
                        busy={busy}
                        recentEntry={primaryEntry}
                        onChoose={() => void choose()}
                        onOpen={(entry) => void open(entry)}
                        onLocate={(entry) => void locate(entry)}
                        onActivate={(projectId) => void activate(projectId)}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
              {!projectSelection && message ? (
                <p
                  className="blank-state-message"
                  role={message.tone === "error" ? "alert" : "status"}
                  data-project-message-tone={message.tone}
                >
                  {message.text}
                </p>
              ) : null}
            </section>

            {recovery || projectSelection ? projectManagement : null}

            {activeContinuities ? (
              <>
                <ContinuityPinFeedback />
                <MobilePinnedContinuities />

            {!firstWorkSetup ? (
            <div className="continuities-filter-controls">
              <label className="continuities-filter">
                <span className="continuities-visually-hidden">
                  Search shown continuities
                </span>
                <input
                  type="search"
                  value={continuityFilter}
                  onChange={(event) => setContinuityFilter(event.target.value)}
                  placeholder="Search shown continuities"
                  aria-describedby="continuities-filter-boundary"
                  data-continuities-filter="shown-items"
                />
                <small
                  id="continuities-filter-boundary"
                  className="continuities-visually-hidden"
                >
                  Searches this bounded current-project presentation only.
                </small>
              </label>
              <div
                className="continuities-filter-chips"
                aria-label="Filter shown continuities"
              >
                <button
                  type="button"
                  aria-pressed={continuityMode === "all"}
                  data-continuities-filter-chip="all"
                  onClick={() => setContinuityMode("all")}
                >
                  All <span>{shownContinuityItems.length}</span>
                </button>
                <button
                  type="button"
                  aria-pressed={continuityMode === "attention"}
                  data-continuities-filter-chip="attention"
                  onClick={() => setContinuityMode("attention")}
                >
                  Attention <span>{attentionContinuityCount}</span>
                </button>
              </div>
            </div>
            ) : null}

            <section
              className="blank-state-continuity"
              aria-labelledby="continuity-list-title"
              data-blank-state-continuity-list="v0.1"
              data-blank-state-known-attention-count={view.known_attention_count}
              data-blank-state-attention-count-status={view.attention_count_status}
              data-blank-state-source-omitted-attention-count={
                view.source_omitted_attention_count ?? "unknown"
              }
              data-augnes-independent-surface={
                firstWorkSetup ? "first-work-setup" : "continuous-work"
              }
              data-augnes-visual-priority={
                view.known_attention_count > 0 ||
                (view.source_omitted_attention_count ?? 0) > 0
                  ? SEMANTIC_VISUAL_PRIORITY.risk
                  : SEMANTIC_VISUAL_PRIORITY.aiSummary
              }
            >
              <div className="blank-state-continuity-heading">
                <div>
                  <p className="blank-state-region-label">
                    {firstWorkSetup ? "Project setup" : "Continuity stream"}
                  </p>
                  <h2 id="continuity-list-title">
                    {firstWorkSetup ? "Define the first work" : "Work carrying forward"}
                  </h2>
                </div>
                <p
                  className="blank-state-attention-summary"
                  data-blank-state-attention-summary="true"
                >
                  {view.continuity_summary}
                </p>
              </div>
              {highlightedVisible ? (
                <ContinuityItem
                  item={view.highlighted_item}
                  highlighted
                  source={source}
                  primaryAction={view.primary_action}
                  primaryEntry={primaryEntry}
                  busy={busy}
                  onChoose={() => void choose()}
                  onOpen={(entry) => void open(entry)}
                  onLocate={(entry) => void locate(entry)}
                  onActivate={(projectId) => void activate(projectId)}
                />
              ) : null}
              {visibleContinuityItems.length ? (
                <ol className="blank-state-continuity-list">
                  {visibleContinuityItems.map((item) => (
                    <li key={item.item_id}>
                      <ContinuityItem
                        item={item}
                        highlighted={false}
                        source={source}
                        primaryAction={null}
                        primaryEntry={null}
                        busy={busy}
                        onChoose={() => void choose()}
                        onOpen={(entry) => void open(entry)}
                        onLocate={(entry) => void locate(entry)}
                        onActivate={(projectId) => void activate(projectId)}
                      />
                    </li>
                  ))}
                </ol>
              ) : null}
              {!highlightedVisible && visibleContinuityItems.length === 0 ? (
                <p className="continuities-filter-empty" role="status">
                  No shown continuities match this filter.
                </p>
              ) : null}
              {view.locally_omitted_item_count > 0 ? (
                <p className="blank-state-meta">
                  {view.locally_omitted_item_count} additional{" "}
                  {view.locally_omitted_item_count === 1 ? "item is" : "items are"}{" "}
                  available from the existing project destinations.
                </p>
              ) : null}
              {view.source_attention_destination &&
              view.attention_count_status !== "complete" ? (
                <p
                  className="blank-state-meta"
                  data-blank-state-source-attention-omitted="true"
                >
                  {view.attention_count_status === "lower_bound" &&
                  view.source_omitted_attention_count !== null
                    ? `${view.source_omitted_attention_count} additional project ${
                        view.source_omitted_attention_count === 1
                          ? "attention item exists"
                          : "attention items exist"
                      } outside this view. `
                    : "Additional project attention may exist outside this view. "}
                  <a href={view.source_attention_destination.href}>
                    {view.source_attention_destination.label}
                  </a>
                </p>
              ) : null}
              </section>
              </>
            ) : null}
          </div>

          {activeContinuities && !firstWorkSetup ? (
            <aside
              className="continuities-supporting-rail"
              aria-label="Project temporal context"
            >
              <ContinuitiesTemporalContext view={temporalContext} />
            </aside>
          ) : null}
        </div>

        {guideRailTarget
          ? createPortal(guideLauncher, guideRailTarget)
          : null}

        <dialog
          ref={guideDialogRef}
          id="continuities-guide-dialog"
          className="continuities-guide-dialog"
          aria-labelledby="continuities-guide-title"
          data-continuities-guidebrief-dialog="true"
          onCancel={(event) => {
            event.preventDefault();
            closeGuide();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            closeGuide();
          }}
          onClose={() => {
            setGuideOpen(false);
            window.requestAnimationFrame(() =>
              guideLauncherRef.current?.focus()
            );
          }}
        >
          <div className="continuities-guide-dialog-heading">
            <div>
              <p className="blank-state-region-label">Current context</p>
              <h2 id="continuities-guide-title">Ask GuideBrief</h2>
            </div>
            <button
              type="button"
              aria-label="Close GuideBrief"
              data-continuities-guidebrief-close="true"
              onClick={closeGuide}
            >
              Close
            </button>
          </div>
          <GuideBriefConversation
            guide={guide}
            surface="blank_state"
            interaction={blankInteraction}
            presentation="embedded"
          />
        </dialog>

        {activeContinuities ? (
          view.project_management_emphasized ? (
            <>
              {projectIdentityManagement}
              {projectManagement}
              <ManagementSafety view={managementSafety} />
              {projection ? (
                <ProjectOptions
                  projection={projection}
                  directHostRoundTripAvailable={
                    source.direct_host_round_trip_available
                  }
                />
              ) : null}
            </>
          ) : (
            <details
              ref={projectSettingsRef}
              id="project-settings"
              className="blank-state-disclosure blank-state-project-settings"
              data-blank-state-project-settings-recovery="true"
              data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.management}
              data-augnes-visual-priority={
                SEMANTIC_VISUAL_PRIORITY.supporting
              }
            >
              <summary>Project settings and recovery</summary>
              <div className="blank-state-project-settings-content">
                {projectIdentityManagement}
                {projectManagement}
                <ManagementSafety view={managementSafety} embedded />
                {projection ? (
                  <ProjectOptions
                    projection={projection}
                    directHostRoundTripAvailable={
                      source.direct_host_round_trip_available
                    }
                    embedded
                  />
                ) : null}
              </div>
            </details>
          )
        ) : null}
      </main>

      <ConfirmationDialog
        open={pendingRemoval !== null}
        title={`Remove ${pendingRemoval?.project.display_name ?? "this project"} from recents?`}
        description="This removes the shortcut only. Stored project data and local files are not deleted."
        confirmLabel="Remove from recents"
        tone="attention"
        busy={busy}
        error={dialogError}
        onCancel={() => {
          setDialogError(null);
          setPendingRemoval(null);
        }}
        onConfirm={confirmRemoval}
      />
    </>
  );
}

function ContinuitiesTemporalContext({
  view,
}: {
  view: ContinuitiesTemporalContextV01;
}) {
  return (
    <section
      className="continuities-temporal-context"
      aria-labelledby="continuities-temporal-title"
      data-continuities-temporal-context={view.temporal_context_version}
      data-continuities-temporal-projection-only={String(view.projection_only)}
      data-continuities-temporal-semantic-authority={String(
        view.semantic_authority_granted,
      )}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <p className="blank-state-region-label">Project context</p>
      <h2 id="continuities-temporal-title">Recent and next</h2>
      <p className="continuities-temporal-intro">
        Source-backed movement around the current project. No future time is
        inferred.
      </p>
      <div className="continuities-temporal-track">
        <div className="continuities-temporal-group">
          <p className="continuities-temporal-label">Next</p>
          {view.next_items.length ? (
            <ol>
              {view.next_items.map((item) => (
                <li key={item.item_id}>
                  <span aria-hidden="true" />
                  <div>
                    {item.href ? (
                      <a
                        className="continuities-temporal-title"
                        href={item.href}
                        title={item.label}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <strong
                        className="continuities-temporal-title"
                        title={item.label}
                      >
                        {item.label}
                      </strong>
                    )}
                    <p>{item.reason}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="continuities-temporal-empty">
              No next action is asserted by the current source.
            </p>
          )}
        </div>
        <div className="continuities-temporal-now">
          <span aria-hidden="true" />
          <div>
            <p className="continuities-temporal-label">Now</p>
            <strong>{view.current.label}</strong>
            <p>{view.current.summary}</p>
          </div>
        </div>
        <div className="continuities-temporal-group">
          <p className="continuities-temporal-label">Recent</p>
          {view.recent_items.length ? (
            <ol>
              {view.recent_items.map((item) => (
                <li key={item.item_id}>
                  <span aria-hidden="true" />
                  <div>
                    {item.href ? (
                      <a
                        className="continuities-temporal-title"
                        href={item.href}
                        title={item.summary}
                      >
                        {item.summary}
                      </a>
                    ) : (
                      <strong
                        className="continuities-temporal-title"
                        title={item.summary}
                      >
                        {item.summary}
                      </strong>
                    )}
                    <time dateTime={item.occurred_at}>
                      {formatTimestamp(item.occurred_at)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="continuities-temporal-empty">
              No source-backed recent change is available in this projection.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function ContinuityItem({
  item,
  highlighted,
  source,
  primaryAction,
  primaryEntry,
  busy,
  onChoose,
  onOpen,
  onLocate,
  onActivate,
}: {
  item: BlankStateContinuityItemV01;
  highlighted: boolean;
  source: BlankStateSourceV01;
  primaryAction: BlankStatePrimaryActionV01 | null;
  primaryEntry: RecentProjectEntryV01 | null;
  busy: boolean;
  onChoose: () => void;
  onOpen: (entry: RecentProjectEntryV01) => void;
  onLocate: (entry: RecentProjectEntryV01) => void;
  onActivate: (projectId: string) => void;
}) {
  const delegatedStage = item.source_family === "delegated_work"
    ? source.delegated_work?.stage
    : undefined;
  const currentRunStatus = item.source_family === "current_run"
    ? source.projection?.run_results.current_run?.status
    : undefined;
  const resultEntryHref =
    source.projection?.run_results.workbench_entry?.href ?? null;
  const itemDestination =
    item.next_action?.kind === "link"
      ? item.next_action.href
      : item.secondary_action?.href ?? null;
  const isResultItem = item.source_family === "saved_result" ||
    (delegatedStage === "result_ready") ||
    Boolean(resultEntryHref && resultEntryHref === itemDestination);
  const resultOutcome = isResultItem
    ? source.projection?.run_results.latest_result?.outcome ?? "unknown"
    : undefined;
  const secondaryAction =
    item.secondary_action ??
    (!highlighted && item.next_action?.kind === "link"
      ? {
          label: item.next_action.label,
          href: item.next_action.href,
        }
      : null);
  const attentionLabel = blankStateAttentionLabelV01(item);

  return (
    <article
      className={
        highlighted
          ? "blank-state-continuity-item blank-state-continuity-item--highlighted"
          : "blank-state-continuity-item"
      }
      data-blank-state-continuity-item={item.item_id}
      data-blank-state-continuity-highlighted={highlighted ? "true" : "false"}
      data-blank-state-human-attention={
        item.requires_human_attention ? "true" : "false"
      }
      data-blank-state-attention-category={item.attention_category ?? "none"}
      data-continuities-recommended={highlighted ? "true" : "false"}
      data-continuities-tone={continuityToneV01(item)}
      data-delegated-work-summary={delegatedStage}
      data-current-host-run={currentRunStatus}
      data-latest-run-result={resultOutcome}
    >
      {highlighted ? (
        <p className="continuities-recommendation-label">
          Recommended next
        </p>
      ) : null}
      <div className="continuities-item-row">
        <span className="continuities-item-indicator" aria-hidden="true" />
        <div className="continuities-item-copy">
          <p
            className={
              item.requires_human_attention
                ? "blank-state-attention-label blank-state-attention-label--required"
                : "blank-state-attention-label"
            }
          >
            {attentionLabel}
          </p>
          <h3 title={item.work_name}>{item.work_name}</h3>
          <p
            className="blank-state-continuity-state"
            title={item.meaningful_state}
          >
            {item.meaningful_state}
          </p>
        </div>
        <div className="continuities-item-entry">
          {item.last_meaningful_change ? (
            <time dateTime={item.last_meaningful_change.occurred_at}>
              {formatTimestamp(item.last_meaningful_change.occurred_at)}
            </time>
          ) : null}
          {highlighted && primaryAction ? (
            <div className="blank-state-continuity-actions">
              <PrimaryAction
                action={primaryAction}
                item={item}
                busy={busy}
                recentEntry={primaryEntry}
                onChoose={onChoose}
                onOpen={onOpen}
                onLocate={onLocate}
                onActivate={onActivate}
              />
            </div>
          ) : secondaryAction ? (
            <a
              className="blank-state-secondary-link"
              href={secondaryAction.href}
              aria-label={secondaryAction.label}
              data-blank-state-delegated-work-link={
                item.source_family === "delegated_work" ? "true" : undefined
              }
              data-review-result-link={isResultItem ? "true" : undefined}
            >
              <span className="continuities-action-label-full">
                {secondaryAction.label}
              </span>
              <span
                className="continuities-action-label-compact"
                aria-hidden="true"
              >
                Open
              </span>
            </a>
          ) : null}
        </div>
      </div>
      {item.consequential_detail ||
      item.last_meaningful_change ||
      item.verification ||
      item.pinning.status ||
      (highlighted && secondaryAction) ||
      (item.exact_detail_href &&
        item.exact_detail_href !== secondaryAction?.href) ? (
        <details className="continuities-item-details">
          <summary>More context</summary>
          <div>
            {item.consequential_detail ? (
              <p className="blank-state-continuity-detail">
                {item.consequential_detail}
              </p>
            ) : null}
            {item.last_meaningful_change ? (
              <p className="blank-state-continuity-change">
                <span>Meaningfully changed</span>{" "}
                {item.last_meaningful_change.summary}{" "}
                <time dateTime={item.last_meaningful_change.occurred_at}>
                  {formatTimestamp(item.last_meaningful_change.occurred_at)}
                </time>
              </p>
            ) : null}
            {item.verification ? (
              <p
                className="blank-state-meta"
                data-blank-state-verification="true"
              >
                Verification: {item.verification.passed} passed,{" "}
                {item.verification.failed} failed,{" "}
                {item.verification.skipped} skipped.
              </p>
            ) : null}
            {highlighted && secondaryAction ? (
              <a
                className="blank-state-secondary-link"
                href={secondaryAction.href}
                aria-label={secondaryAction.label}
                data-blank-state-delegated-work-link={
                  item.source_family === "delegated_work" ? "true" : undefined
                }
                data-review-result-link={isResultItem ? "true" : undefined}
              >
                <span className="continuities-action-label-full">
                  {secondaryAction.label}
                </span>
                <span
                  className="continuities-action-label-compact"
                  aria-hidden="true"
                >
                  Open
                </span>
              </a>
            ) : null}
            {item.exact_detail_href &&
            item.exact_detail_href !== secondaryAction?.href ? (
              <a
                className="blank-state-exact-detail-link"
                href={item.exact_detail_href}
                data-blank-state-exact-detail="true"
              >
                View exact details
              </a>
            ) : null}
            <ContinuityPinAction item={item} />
          </div>
        </details>
      ) : null}
    </article>
  );
}

function ManagementSafety({
  view,
  embedded = false,
}: {
  view: ManagementSafetyViewV01;
  embedded?: boolean;
}) {
  const items = [
    view.project_management,
    view.project_transfer,
    view.local_recovery,
  ];
  const content = (
    <div className="blank-state-management-safety">
      <p>
        Move local project continuity or review application-data safety
        without changing the current work.
      </p>
      <ul>
        {items.map((item) => (
          <li key={item.kind}>
            <a href={item.href}>{item.label}</a>
            <p>{item.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
  if (embedded) {
    return (
      <section
        className="blank-state-management-section"
        aria-labelledby="management-safety-title"
        data-management-safety={view.view_version}
        data-management-safety-project-context={view.project_context}
        data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.management}
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
      >
        <h2 id="management-safety-title">Management and safety</h2>
        {content}
      </section>
    );
  }
  return (
    <details
      className="blank-state-disclosure"
      data-management-safety={view.view_version}
      data-management-safety-project-context={view.project_context}
      data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.management}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <summary>Manage and protect</summary>
      {content}
    </details>
  );
}

function PrimaryAction({
  action,
  item,
  busy,
  recentEntry,
  onChoose,
  onOpen,
  onLocate,
  onActivate,
}: {
  action: BlankStatePrimaryActionV01;
  item: BlankStateContinuityItemV01;
  busy: boolean;
  recentEntry: RecentProjectEntryV01 | null;
  onChoose: () => void;
  onOpen: (entry: RecentProjectEntryV01) => void;
  onLocate: (entry: RecentProjectEntryV01) => void;
  onActivate: (projectId: string) => void;
}) {
  if (action.kind === "link") {
    return (
      <a
        className="blank-state-primary-action"
        href={action.href}
        aria-label={action.label}
        data-blank-state-primary-action={action.kind}
        data-workbench-entry-state={action.entry_state ?? undefined}
        data-blank-state-delegated-work-link={
          item.source_family === "delegated_work" ? "true" : undefined
        }
        data-review-result-link={
          item.attention_category === "result_review" ? "true" : undefined
        }
        data-augnes-primary-action={action.kind}
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
      >
        <span className="continuities-action-label-full">{action.label}</span>
        <span
          className="continuities-action-label-compact"
          aria-hidden="true"
        >
          Open
        </span>
      </a>
    );
  }
  const callback = action.kind === "choose_folder"
    ? onChoose
    : action.kind === "make_active"
      ? () => onActivate(action.project_id)
      : recentEntry
        ? action.kind === "open_recent"
          ? () => onOpen(recentEntry)
          : () => onLocate(recentEntry)
        : () => undefined;
  return (
    <button
      type="button"
      className="blank-state-primary-action"
      aria-label={busy ? "Working…" : action.label}
      data-blank-state-primary-action={action.kind}
      data-project-locate={
        action.kind === "locate_folder"
          ? recentEntry?.project.project_id
          : undefined
      }
      data-augnes-primary-action={action.kind}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
      onClick={callback}
      disabled={busy || (action.kind !== "choose_folder" && action.kind !== "make_active" && !recentEntry)}
    >
      {busy ? (
        "Working…"
      ) : (
        <>
          <span className="continuities-action-label-full">{action.label}</span>
          <span
            className="continuities-action-label-compact"
            aria-hidden="true"
          >
            {action.kind === "choose_folder"
              ? "Choose"
              : action.kind === "locate_folder"
                ? "Locate"
                : action.kind === "make_active"
                  ? "Activate"
                  : "Open"}
          </span>
        </>
      )}
    </button>
  );
}

function ProjectRecovery({
  recovery,
  busy,
  onChoose,
  onEnterPath,
  onCancelPicker,
  onReturnToPicker,
  onDeclaredPathChange,
  onReviewDeclaredPath,
  onConfirm,
  onCancelReview,
  onCancel,
}: {
  recovery: ProjectRecoveryStateV01;
  busy: boolean;
  onChoose: () => void;
  onEnterPath: () => void;
  onCancelPicker: () => void;
  onReturnToPicker: () => void;
  onDeclaredPathChange: (value: string) => void;
  onReviewDeclaredPath: () => void;
  onConfirm: () => void;
  onCancelReview: () => void;
  onCancel: () => void;
}) {
  const chooseButtonRef = useRef<HTMLButtonElement>(null);
  const pathInputRef = useRef<HTMLInputElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const selectedToken = recovery.picker?.selection_token ?? null;
  useEffect(() => {
    window.requestAnimationFrame(() => {
      if (selectedToken) confirmButtonRef.current?.focus();
      else if (recovery.mode === "path") pathInputRef.current?.focus();
      else chooseButtonRef.current?.focus();
    });
  }, [recovery.mode, selectedToken]);
  const selected = recovery.picker;
  return (
    <section
      id="project-recovery"
      className="blank-state-project-management blank-state-project-management--focused project-recovery"
      aria-labelledby="project-recovery-title"
      aria-busy={busy || recovery.picker_pending}
      data-project-recovery="verified-folder-selection.v0.1"
      data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.management}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        if (selected) onCancelReview();
        else if (recovery.picker_pending) onCancelPicker();
        else if (recovery.mode === "path") onReturnToPicker();
        else onCancel();
      }}
    >
      <div className="blank-state-region-heading">
        <div>
          <p className="blank-state-region-label">Local project recovery</p>
          <h2 id="project-recovery-title">
            Locate folder for {recovery.entry.project.display_name ?? "this project"}
          </h2>
        </div>
      </div>
      {!selected ? (
        <div className="project-onboarding-copy">
          <dl className="project-recovery-summary">
            <div>
              <dt>Saved project</dt>
              <dd>{recovery.entry.project.display_name ?? "Unnamed project"}</dd>
            </div>
            <div>
              <dt>Previous folder</dt>
              <dd className="project-inspection-path">
                {recovery.entry.local_root.normalized_path}
              </dd>
            </div>
          </dl>
          <p>
            The project record and its stored history remain in Augnes. Nothing
            changes until you confirm a reviewed folder.
          </p>
          <p>
            Choose a folder on the computer running Augnes. The folder is not
            uploaded.
          </p>
          {recovery.mode === "picker" ? (
            <div className="project-onboarding-entry-actions">
              <button
                ref={chooseButtonRef}
                type="button"
                className="blank-state-primary-action project-onboarding-action"
                data-blank-state-primary-action="choose_recovery_folder"
                data-augnes-primary-action="choose_recovery_folder"
                data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
                onClick={onChoose}
                disabled={busy || recovery.picker_pending}
              >
                {recovery.picker_pending
                  ? "Waiting for folder picker…"
                  : "Choose a folder"}
              </button>
              <button
                type="button"
                className="blank-state-secondary-button"
                onClick={onEnterPath}
                disabled={busy}
              >
                Enter the folder path instead
              </button>
              {recovery.picker_pending ? (
                <button
                  type="button"
                  className="blank-state-tertiary-button"
                  onClick={onCancelPicker}
                >
                  Cancel attempt
                </button>
              ) : null}
              <button
                type="button"
                className="blank-state-tertiary-button"
                onClick={onCancel}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          ) : (
            <form
              className="project-path-entry"
              onSubmit={(event) => {
                event.preventDefault();
                onReviewDeclaredPath();
              }}
            >
              <label htmlFor="local-project-recovery-path">
                <span>Folder path</span>
                <input
                  ref={pathInputRef}
                  id="local-project-recovery-path"
                  name="local-project-recovery-path"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={recovery.declared_path}
                  onChange={(event) => onDeclaredPathChange(event.target.value)}
                  disabled={busy}
                  aria-describedby="local-project-recovery-path-help"
                />
              </label>
              <p id="local-project-recovery-path-help">
                Enter the full path as it appears on the computer running
                Augnes. The folder is not uploaded.
              </p>
              <div className="project-actions">
                <button
                  type="submit"
                  className="blank-state-primary-action"
                  data-blank-state-primary-action="review_recovery_folder_path"
                  data-augnes-primary-action="review_recovery_folder_path"
                  disabled={busy}
                >
                  {busy ? "Reviewing…" : "Review folder"}
                </button>
                <button
                  type="button"
                  className="blank-state-secondary-button"
                  onClick={onReturnToPicker}
                  disabled={busy}
                >
                  Choose a folder instead
                </button>
                <button
                  type="button"
                  className="blank-state-tertiary-button"
                  onClick={onCancel}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}
      {recovery.message ? (
        <p
          className="project-selector-message"
          role={recovery.message.tone === "error" ? "alert" : "status"}
          data-project-message-tone={recovery.message.tone}
        >
          {recovery.message.text}
        </p>
      ) : null}
      {selected ? (
        <div className="project-inspection project-recovery-review" aria-live="polite">
          <p className="blank-state-region-label">Recovery review</p>
          <h3>{recovery.entry.project.display_name ?? "Unnamed project"}</h3>
          <dl>
            <div>
              <dt>Previous folder</dt>
              <dd className="project-inspection-path">
                {recovery.entry.local_root.normalized_path}
              </dd>
            </div>
            <div>
              <dt>Selected folder</dt>
              <dd className="project-inspection-path">
                {selected.inspection.local_root.normalized_path}
              </dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>
                {selected.inspection.folder_kind === "git_repository"
                  ? "Git repository"
                  : "Plain folder"}
              </dd>
            </div>
            <div>
              <dt>Repository</dt>
              <dd>
                {selected.inspection.repository_display ??
                  (selected.inspection.folder_kind === "git_repository"
                    ? "No remote configured"
                    : "Not a repository")}
              </dd>
            </div>
            <div>
              <dt>Already connected</dt>
              <dd>
                {selected.inspection.existing_project?.project_id ===
                recovery.entry.project.project_id
                  ? "This saved project"
                  : "No"}
              </dd>
            </div>
            <div>
              <dt>Folder binding</dt>
              <dd>
                {selected.recovery_action === "open_project"
                  ? "The saved folder stays unchanged."
                  : "The saved folder will change to the selected folder."}
              </dd>
            </div>
            <div>
              <dt>Stored continuity</dt>
              <dd>The project name and stored history remain unchanged.</dd>
            </div>
          </dl>
          <p>
            {selected.recovery_action === "open_project"
              ? "This folder resolves to the project’s exact current folder. Opening it keeps the saved folder and baseline unchanged."
              : "Augnes will use this folder for the existing project. The project’s stored history remains attached to it."}
          </p>
          <p className="project-selector-safety">
            This step does not run Codex or change project files.
          </p>
          <div className="project-actions">
            <button
              ref={confirmButtonRef}
              type="button"
              className="blank-state-primary-action"
              data-blank-state-primary-action="confirm_recovery_folder"
              data-augnes-primary-action="confirm_recovery_folder"
              data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy
                ? "Working…"
                : selected.recovery_action === "open_project"
                  ? "Open project"
                  : "Use this folder"}
            </button>
            <button
              type="button"
              className="blank-state-tertiary-button"
              onClick={onCancelReview}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ProjectManagement({
  presentationMode,
  projectManagementEmphasized,
  recent,
  picker,
  busy,
  pickerPending,
  onboardingMode,
  declaredPath,
  message,
  primaryAction,
  onChoose,
  onEnterPath,
  onCancelPicker,
  onReturnToPicker,
  onDeclaredPathChange,
  onReviewDeclaredPath,
  onConfirm,
  onOpen,
  onLocate,
  onRemove,
  onCancelInspection,
}: {
  presentationMode: BlankStatePresentationModeV01;
  projectManagementEmphasized: boolean;
  recent: RecentProjectEntryV01[];
  picker: LocalFolderPickerOutcomeV01 | null;
  busy: boolean;
  pickerPending: boolean;
  onboardingMode: "picker" | "path";
  declaredPath: string;
  message: ProjectFolderSelectionMessageV01 | null;
  primaryAction: BlankStatePrimaryActionV01 | null;
  onChoose: () => void;
  onEnterPath: () => void;
  onCancelPicker: () => void;
  onReturnToPicker: () => void;
  onDeclaredPathChange: (value: string) => void;
  onReviewDeclaredPath: () => void;
  onConfirm: (displayName: string) => void;
  onOpen: (entry: RecentProjectEntryV01) => void;
  onLocate: (entry: RecentProjectEntryV01) => void;
  onRemove: (entry: RecentProjectEntryV01) => void;
  onCancelInspection: () => void;
}) {
  const onboarding = presentationMode === "local_project_onboarding";
  const choosingProject = presentationMode === "project_choice";
  const connectionEntryAvailable =
    onboarding || choosingProject || projectManagementEmphasized;
  const selectedFolder = picker?.status === "selected";
  const selectedToken = picker?.status === "selected"
    ? picker.selection_token
    : null;
  const [projectName, setProjectName] = useState("");
  const chooseButtonRef = useRef<HTMLButtonElement>(null);
  const pathInputRef = useRef<HTMLInputElement>(null);
  const previousModeRef = useRef(onboardingMode);
  const previousSelectedTokenRef = useRef<string | null>(selectedToken);
  useEffect(() => {
    if (!picker || picker.status !== "selected") {
      return;
    }
    setProjectName((current) =>
      picker.selection_origin === "declared_path" && current.trim()
        ? current
        : picker.inspection.existing_project?.display_name ??
          picker.inspection.display_name,
    );
  }, [picker, selectedToken]);
  useEffect(() => {
    if (previousModeRef.current === onboardingMode) return;
    previousModeRef.current = onboardingMode;
    window.requestAnimationFrame(() => {
      if (onboardingMode === "path") pathInputRef.current?.focus();
      else chooseButtonRef.current?.focus();
    });
  }, [onboardingMode]);
  useEffect(() => {
    const previous = previousSelectedTokenRef.current;
    previousSelectedTokenRef.current = selectedToken;
    if (!previous || selectedToken) return;
    window.requestAnimationFrame(() => {
      if (onboardingMode === "path") pathInputRef.current?.focus();
      else chooseButtonRef.current?.focus();
    });
  }, [onboardingMode, selectedToken]);
  const normalizedProjectName = projectName.trim();
  const projectNameError = !normalizedProjectName
    ? "Enter a project name."
    : normalizedProjectName.length > PROJECT_DISPLAY_NAME_MAX_LENGTH_V01
      ? `Project names can be up to ${PROJECT_DISPLAY_NAME_MAX_LENGTH_V01} characters.`
      : null;
  return (
    <section
      id="project-management"
      className={
        onboarding || choosingProject
          ? "blank-state-project-management blank-state-project-management--focused"
          : "blank-state-project-management"
      }
      aria-labelledby="project-management-title"
      aria-busy={busy || pickerPending}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        const target = event.target as HTMLElement;
        if (!target.closest(".project-onboarding-copy, .project-inspection")) {
          return;
        }
        event.preventDefault();
        if (selectedFolder) onCancelInspection();
        else if (pickerPending) onCancelPicker();
        else if (onboardingMode === "path") onReturnToPicker();
      }}
      data-project-selection-presentation={presentationMode}
      data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.management}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <div className="blank-state-region-heading">
        <div>
          <p className="blank-state-region-label">
            {onboarding ? "Local project" : "Project options"}
          </p>
          <h2 id="project-management-title">
            {onboarding
              ? "Open a local project folder"
              : choosingProject
                ? "Choose a local project"
                : "Choose or manage a local project"}
          </h2>
        </div>
        {!connectionEntryAvailable && primaryAction?.kind !== "choose_folder" ? (
          <button type="button" className="blank-state-secondary-button" onClick={onChoose} disabled={busy}>
            Choose another folder
          </button>
        ) : null}
      </div>
      {connectionEntryAvailable && !selectedFolder ? (
        <div className="project-onboarding-copy">
          <p id="local-project-onboarding-description">
            Select an existing folder on the computer running Augnes. Augnes
            links it as the local project root; this step does not upload the
            folder.
          </p>
          <p id="local-project-onboarding-support">
            Use a regular folder or a Git repository.
          </p>
          <p id="local-project-onboarding-cancellation">
            Cancelling the folder picker leaves the workspace unchanged.
          </p>
          {onboardingMode === "picker" ? (
            <div className="project-onboarding-entry-actions">
              <button
                ref={chooseButtonRef}
                type="button"
                className="blank-state-primary-action project-onboarding-action"
                aria-label={pickerPending ? "Waiting for folder picker…" : "Choose a folder"}
                aria-describedby={[
                  "local-project-onboarding-description",
                  "local-project-onboarding-support",
                  "local-project-onboarding-cancellation",
                ].join(" ")}
                data-blank-state-primary-action="choose_folder"
                data-augnes-primary-action="choose_folder"
                data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
                onClick={onChoose}
                disabled={busy || pickerPending}
              >
                {pickerPending ? "Waiting for folder picker…" : "Choose a folder"}
              </button>
              <button
                type="button"
                className="blank-state-secondary-button"
                onClick={onEnterPath}
                disabled={busy}
              >
                Enter the folder path instead
              </button>
              {pickerPending ? (
                <button
                  type="button"
                  className="blank-state-tertiary-button"
                  onClick={onCancelPicker}
                >
                  Cancel attempt
                </button>
              ) : null}
            </div>
          ) : null}
          {onboardingMode === "path" ? (
            <form
              className="project-path-entry"
              onSubmit={(event) => {
                event.preventDefault();
                onReviewDeclaredPath();
              }}
            >
              <label htmlFor="local-project-declared-path">
                <span>Folder path</span>
                <input
                  ref={pathInputRef}
                  id="local-project-declared-path"
                  name="local-project-declared-path"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={declaredPath}
                  onChange={(event) =>
                    onDeclaredPathChange(event.target.value)}
                  disabled={busy}
                  aria-describedby="local-project-path-help"
                />
              </label>
              <p id="local-project-path-help">
                Enter the full path as it appears on the computer running
                Augnes. The folder is not uploaded.
              </p>
              <div className="project-actions">
                <button
                  type="submit"
                  className="blank-state-primary-action"
                  data-blank-state-primary-action="review_folder_path"
                  data-augnes-primary-action="review_folder_path"
                  disabled={busy}
                >
                  {busy ? "Reviewing…" : "Review folder"}
                </button>
                <button
                  type="button"
                  className="blank-state-secondary-button"
                  onClick={onReturnToPicker}
                  disabled={busy}
                >
                  Choose a folder instead
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
      {message ? (
        <p
          className="project-selector-message"
          role={message.tone === "error" ? "alert" : "status"}
          data-project-message-tone={message.tone}
        >
          {message.text}
        </p>
      ) : null}
      {selectedFolder ? (
        <div className="project-inspection" aria-live="polite">
          <p className="blank-state-region-label">Folder review</p>
          <h3>
            {picker.inspection.existing_project?.display_name ??
              picker.inspection.display_name}
          </h3>
          {picker.inspection.already_added ? (
            <div className="project-inspection-saved-name">
              <span>Project name</span>
              <strong>
                {picker.inspection.existing_project?.display_name ??
                  "Unnamed project"}
              </strong>
            </div>
          ) : (
            <label className="project-name-field">
              <span>Project name</span>
              <input
                type="text"
                name="project-display-name"
                value={projectName}
                aria-invalid={projectNameError ? "true" : undefined}
                aria-describedby="project-name-help project-name-error"
                onChange={(event) => setProjectName(event.target.value)}
                disabled={busy}
              />
            </label>
          )}
          <p id="project-name-help" className="blank-state-meta">
            The Augnes project name does not rename the local folder.
          </p>
          {!picker.inspection.already_added && projectNameError ? (
            <p id="project-name-error" className="project-field-error" role="alert">
              {projectNameError}
            </p>
          ) : null}
          <dl>
            <div><dt>Local folder</dt><dd className="project-inspection-path">{picker.inspection.local_root.normalized_path}</dd></div>
            <div><dt>Type</dt><dd>{picker.inspection.folder_kind === "git_repository" ? "Git repository" : "Plain folder"}</dd></div>
            <div><dt>Repository</dt><dd>{picker.inspection.repository_display ?? (picker.inspection.folder_kind === "git_repository" ? "No remote configured" : "Not a repository")}</dd></div>
          </dl>
          {picker.inspection.already_added ? (
            <p className="project-selector-notice">This folder is already connected. Opening it keeps its saved project name and path.</p>
          ) : null}
          <p>
            {picker.inspection.already_added
              ? "Opening makes this the current local project and shows its Continuities."
              : "Connecting makes this the current local project and opens Continuities."}
          </p>
          <p className="project-selector-safety">
            Connecting this folder does not run Codex or change any files.
          </p>
          <div className="project-actions">
            <button
              type="button"
              className="blank-state-primary-action"
              data-blank-state-primary-action="confirm_folder"
              data-augnes-primary-action="confirm_folder"
              data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
              onClick={() => onConfirm(normalizedProjectName)}
              disabled={busy || (!picker.inspection.already_added && projectNameError !== null)}
            >
              {busy
                ? "Working…"
                : picker.inspection.already_added
                  ? "Open project"
                  : "Connect project"}
            </button>
            <button type="button" className="blank-state-tertiary-button" onClick={onCancelInspection} disabled={busy}>Cancel</button>
          </div>
        </div>
      ) : null}

      {!onboarding || recent.length > 0 ? (
      <div id="recent-projects">
        <h3>Recent projects</h3>
        {recent.length === 0 ? (
          <p className="blank-state-empty">No recent projects yet.</p>
        ) : (
          <ul className="recent-project-list">
            {recent.map((entry) => (
              <li key={entry.project.project_id} className={entry.is_active ? "is-active" : undefined}>
                <div>
                  <strong>{entry.project.display_name ?? "Unnamed project"}</strong>
                  {entry.is_active ? (
                    <span
                      className="active-project-badge"
                      data-augnes-state-badge="current-project"
                    >
                      Current
                    </span>
                  ) : null}
                  <p>{entry.local_root.normalized_path}</p>
                  <p className={`root-status root-status--${entry.root_availability}`}>
                    {entry.root_availability === "available" ? "Folder available" : "Folder needs to be located"}
                  </p>
                </div>
                <div className="project-actions">
                  {entry.root_availability === "available" ? (
                    <button
                      type="button"
                      className="blank-state-secondary-button"
                      data-blank-state-primary-action={
                        !selectedFolder &&
                        primaryAction?.kind === "open_recent" &&
                        primaryAction.project_id === entry.project.project_id
                          ? "open_recent"
                          : undefined
                      }
                      data-augnes-primary-action={
                        !selectedFolder &&
                        primaryAction?.kind === "open_recent" &&
                        primaryAction.project_id === entry.project.project_id
                          ? "open_recent"
                          : undefined
                      }
                      onClick={() => onOpen(entry)}
                      disabled={busy}
                    >
                      {entry.is_active ? "Open" : "Make current and open"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="blank-state-secondary-button"
                      data-project-locate={entry.project.project_id}
                      onClick={() => onLocate(entry)}
                      disabled={busy}
                    >
                      Locate folder
                    </button>
                  )}
                  <button type="button" className="blank-state-tertiary-button" onClick={() => onRemove(entry)} disabled={busy}>Remove from recents</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      ) : null}
    </section>
  );
}

function ProjectIdentityManagement({
  ownerId,
  ownerRef,
  entry,
  busy,
  message,
  onSave,
  onConfirmRepositoryDecision,
}: {
  ownerId?: string;
  ownerRef: RefObject<HTMLElement | null>;
  entry: RecentProjectEntryV01;
  busy: boolean;
  message: ProjectFolderSelectionMessageV01 | null;
  onSave: (displayName: string) => void;
  onConfirmRepositoryDecision: (entry: RecentProjectEntryV01) => void;
}) {
  const savedName = entry.project.display_name ?? "";
  const [name, setName] = useState(savedName);
  useEffect(() => setName(savedName), [savedName]);
  const normalizedName = name.trim();
  const validationMessage = !normalizedName
    ? "Enter a project name."
    : normalizedName.length > PROJECT_DISPLAY_NAME_MAX_LENGTH_V01
      ? `Project names can be up to ${PROJECT_DISPLAY_NAME_MAX_LENGTH_V01} characters.`
      : null;
  const unchanged = normalizedName === savedName;
  return (
    <section
      id={ownerId}
      ref={ownerRef}
      className="blank-state-management-section project-identity-management"
      aria-labelledby="project-identity-title"
      data-project-identity-management="true"
      data-project-settings-owner={ownerId ? "emphasized" : undefined}
    >
      <p className="blank-state-region-label">Current project</p>
      <h2 id="project-identity-title">Project identity</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!validationMessage && !unchanged && !busy) onSave(normalizedName);
        }}
      >
        <label className="project-name-field">
          <span>Project name</span>
          <input
            type="text"
            name="current-project-display-name"
            value={name}
            aria-invalid={validationMessage ? "true" : undefined}
            aria-describedby="current-project-name-help current-project-name-error"
            onChange={(event) => setName(event.target.value)}
            disabled={busy}
          />
        </label>
        <p id="current-project-name-help" className="blank-state-meta">
          Renaming the Augnes project does not rename the local folder.
        </p>
        {validationMessage ? (
          <p id="current-project-name-error" className="project-field-error" role="alert">
            {validationMessage}
          </p>
        ) : null}
        {message ? (
          <p
            className="project-selector-message"
            role={message.tone === "error" ? "alert" : "status"}
            data-project-message-tone={message.tone}
          >
            {message.text}
          </p>
        ) : null}
        <button
          type="submit"
          className="blank-state-secondary-button"
          data-project-name-save="true"
          disabled={busy || validationMessage !== null || unchanged}
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
      <dl className="blank-state-detail-list project-identity-details">
        <div>
          <dt>Local folder</dt>
          <dd>{entry.local_root.normalized_path}</dd>
        </div>
        <div>
          <dt>Root availability</dt>
          <dd>{entry.root_availability === "available" ? "Available" : "Needs attention"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>Current project</dd>
        </div>
      </dl>
      {entry.repository_execution_decision ? (
        <div
          className="project-inspection"
          data-repository-execution-decision={entry.repository_execution_decision.action}
          data-repository-execution-decision-status={entry.repository_execution_decision.status}
        >
          <p className="blank-state-region-label">Repository decision</p>
          <h3>
            {entry.repository_execution_decision.action === "start_repository_managed_delegation"
              ? "Start this exact repository work"
              : entry.repository_execution_decision.action === "resume_repository_managed_delegation"
                ? "Resume this exact managed run"
              : "Confirm this identity change"}
          </h3>
          <p>{entry.repository_execution_decision.ordinary_text}</p>
          <p className="blank-state-meta">
            {entry.repository_execution_decision.action === "start_repository_managed_delegation"
              ? "This confirmation is separate from the assistant request and authorizes one exact managed run. It does not approve later external effects or accept the result."
              : entry.repository_execution_decision.action === "resume_repository_managed_delegation"
                ? "This one-time confirmation authorizes only the same run at its exact safe checkpoint. It is not operation approval and does not accept the result."
              : "This confirmation is separate from the assistant request and grants no execution authority."}
          </p>
          {entry.repository_execution_decision.status === "pending" ? (
            <button
              type="button"
              className="blank-state-primary-action"
              data-repository-execution-decision-confirm="true"
              disabled={busy}
              onClick={() => onConfirmRepositoryDecision(entry)}
            >
              {busy
                ? "Confirming…"
                : entry.repository_execution_decision.action === "start_repository_managed_delegation"
                  ? "Start one managed run"
                  : entry.repository_execution_decision.action === "resume_repository_managed_delegation"
                    ? "Resume managed run"
                  : "Confirm repository decision"}
            </button>
          ) : (
            <p role="status">
              {entry.repository_execution_decision.action === "start_repository_managed_delegation"
                ? "Confirmed. The exact prepared attachment can start once."
                : entry.repository_execution_decision.action === "resume_repository_managed_delegation"
                  ? "Confirmed. The exact same run can resume once."
                : "Confirmed. Augnes can finish this exact requested change."}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ProjectOptions({
  projection,
  directHostRoundTripAvailable,
  embedded = false,
}: {
  projection: NonNullable<BlankStateSourceV01["projection"]>;
  directHostRoundTripAvailable: boolean;
  embedded?: boolean;
}) {
  const active = projection.project_summary.is_active;
  const content = (
    <div className="blank-state-options-grid">
      <section aria-labelledby="automation-options-title">
        <h2 id="automation-options-title">Automation</h2>
        <p>{automationSummary(projection.automation.status)}</p>
          <p>{projection.automation.state.message}</p>
          <p className="blank-state-meta">
            {projection.automation.policy_control_eligible ? "Control layer eligible" : "Control layer unavailable"}
            {` · ${projection.automation.admission_status === "grant_required" ? "Admission grant required" : projection.automation.admission_status.replaceAll("_", " ")}`}
          </p>
          <p className="blank-state-meta">{projection.automation.policy_summary.title}</p>
          <ul className="blank-state-compact-list">
            {projection.automation.policy_summary.boundaries.map((boundary) => <li key={boundary}>{publicBlankStateTextV01(boundary)}</li>)}
          </ul>
          {projection.automation.cycle.work_source ? (
            <p className="blank-state-meta">
              Available work: {publicBlankStateTextV01(projection.automation.cycle.work_source.label)} · bounded local verification · model and network denied.
            </p>
          ) : null}
          {projection.automation.cycle.run ? (
            <p className="blank-state-meta" data-blank-state-automation-run={projection.automation.cycle.status}>
              Automated work {projection.automation.cycle.run.status.replaceAll("_", " ")} · attempt {projection.automation.cycle.run.attempt}.
            </p>
          ) : null}
          {projection.automation.cycle.stop_reason ? (
            <p data-blank-state-automation-stop={projection.automation.cycle.stop_reason}>
              Automation stopped: {projection.automation.cycle.stop_reason.replaceAll("_", " ")}.
            </p>
          ) : null}
          {projection.automation.cycle.run?.result_href ? <a href={projection.automation.cycle.run.result_href}>Open automated result</a> : null}
          {projection.automation.cycle.run?.proposal_href ? <a href={projection.automation.cycle.run.proposal_href}>Review suggested change</a> : null}
          {projection.automation.cycle.feedback_href ? <a href={projection.automation.cycle.feedback_href}>Share outcome</a> : null}
          {active && projection.automation.inspector_href ? <a href={projection.automation.inspector_href} data-project-automation-inspector="true">View exact automation details</a> : null}
          <ProjectControls projection={projection} kind="automation" />
        </section>

        <section aria-labelledby="perspective-options-title">
          <h2 id="perspective-options-title">Personal Perspective</h2>
          <p>{personalPerspectiveSummary(projection.personal_perspective.status)}</p>
          <p>{projection.personal_perspective.explanation}</p>
          <p className="blank-state-meta">Task-selected material {projection.personal_perspective.task_selected_count}</p>
          {projection.personal_perspective.task_basis ? (
            <div data-personal-perspective-task-basis="present">
              <p>{projection.personal_perspective.task_basis.selected_count} reviewed items contributed to the current work.</p>
              <ul className="blank-state-compact-list">
                {projection.personal_perspective.task_basis.items.map((item, index) => (
                  <li key={`${item.why_included}:${index}`}>{publicBlankStateTextV01(item.summary ?? "Selected reviewed material")} · {publicBlankStateTextV01(item.why_included)}</li>
                ))}
              </ul>
              {active ? <a href={projection.personal_perspective.task_basis.inspector_href} data-personal-perspective-inspector="true">View exact inclusion details</a> : null}
            </div>
          ) : (
            <p className="blank-state-meta" data-personal-perspective-task-basis="absent">No reviewed Personal Perspective material is shown as part of the current work.</p>
          )}
          <ProjectControls projection={projection} kind="personal_perspective" />
        </section>

        {directHostRoundTripAvailable ? (
          <section aria-labelledby="local-work-controls-title">
            <h2 id="local-work-controls-title">Advanced local test work</h2>
            <p>
              Run the deterministic compatibility check. Live Codex work,
              progress, approval, cancellation, and resume are owned by AI
              Workplane.
            </p>
            <DirectHostRoundTripAction />
          </section>
        ) : null}

        <section aria-labelledby="project-details-title">
          <h2 id="project-details-title">Project details</h2>
          <dl className="blank-state-detail-list">
            <div><dt>Folder</dt><dd>{projection.project_summary.root_binding.local_root.normalized_path}</dd></div>
            <div><dt>Repository</dt><dd>{projection.project_summary.repository?.display ?? "No repository remote"}</dd></div>
          </dl>
          <ul className="blank-state-capabilities">
            {projection.capabilities.items.map((item) => (
              <li key={item.capability}><strong>{capabilityLabel(item.capability)}</strong><span>{item.status.replaceAll("_", " ")}</span></li>
            ))}
          </ul>
      </section>
    </div>
  );
  if (embedded) {
    return (
      <section
        className="blank-state-management-section blank-state-management-section--technical"
        aria-labelledby="project-options-title"
        data-blank-state-project-options="true"
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.rawRecord}
      >
        <h2 id="project-options-title">Project options</h2>
        {content}
      </section>
    );
  }
  return (
    <details
      className="blank-state-disclosure"
      data-blank-state-project-options="true"
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.rawRecord}
    >
      <summary>Project options</summary>
      {content}
    </details>
  );
}

function primaryRecentEntry(
  action: BlankStatePrimaryActionV01 | null,
  recent: RecentProjectEntryV01[],
): RecentProjectEntryV01 | null {
  if (!action || (action.kind !== "open_recent" && action.kind !== "locate_folder")) return null;
  return recent.find((entry) => entry.project.project_id === action.project_id) ?? null;
}

function automationSummary(status: string): string {
  if (status === "not_configured" || status === "disabled") return "Automated work is off for this project.";
  if (status === "paused") return "Automated work is paused for new tasks.";
  return "Automated work is available within the saved project limits.";
}

function personalPerspectiveSummary(status: string): string {
  if (status === "included") return "Eligible reviewed Personal Perspective material may be considered for this project.";
  if (status === "excluded") return "Personal Perspective is excluded for this project.";
  return "Personal Perspective is excluded until you choose otherwise.";
}

function capabilityLabel(value: string): string {
  return ({
    openai: "OpenAI",
    codex_native_host: "Codex native host",
    github: "GitHub",
    mcp: "MCP",
    scheduler: "Scheduler",
  } as Record<string, string>)[value] ?? value;
}

function continuityItemMatchesV01(
  item: BlankStateContinuityItemV01,
  normalizedFilter: string,
): boolean {
  if (!normalizedFilter) return true;
  return [
    item.work_name,
    item.meaningful_state,
    item.last_meaningful_change?.summary,
    item.consequential_detail,
  ].some((value) => value?.toLocaleLowerCase().includes(normalizedFilter));
}

function continuityToneV01(
  item: BlankStateContinuityItemV01,
): "amber" | "blue" | "quiet" {
  if (item.requires_human_attention) return "amber";
  if (item.source_family === "recent_change") return "quiet";
  return "blue";
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
