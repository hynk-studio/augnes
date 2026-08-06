import { NextResponse } from "next/server";

import { openDatabase } from "@/lib/db";
import {
  abandonPreparedLocalProjectOnboardingSelectionV01,
  abandonPreparedLocalProjectRecoverySelectionV01,
  ProjectOnboardingErrorV01,
  confirmLocalProjectOnboardingV01,
  declareAndInspectLocalProjectRecoveryV01,
  declareAndInspectLocalProjectV01,
  listRecentProjectsV01,
  openRecoveredLocalProjectFromSelectionV01,
  openRecentProjectV01,
  pickAndInspectLocalProjectRecoveryV01,
  pickAndInspectLocalProjectV01,
  previewLocalProjectRootRebindFromSelectionV01,
  readPreparedLocalProjectSelectionBindingV01,
  readProjectDestinationV01,
  renameActiveProjectDisplayNameV01,
  rebindLocalProjectRootFromSelectionV01,
  removeProjectFromRecentV01,
} from "@/lib/vnext/onboarding/local-project-onboarding";
import {
  abandonLocalProjectOnboardingSessionV01,
  confirmLocalProjectOnboardingFromBrowserSessionV01,
  issueLocalProjectOnboardingChallengeV01,
  issueLocalProjectOnboardingSessionV01,
  readLocalProjectOnboardingCredentialFromRequestV01,
  serializeLocalProjectOnboardingCookieV01,
} from "@/lib/vnext/onboarding/local-project-onboarding-decision";
import {
  LocalProjectPathDeclarationErrorV01,
  parseLocalProjectPathDeclarationV01,
} from "@/lib/vnext/onboarding/local-project-path-declaration";
import { ProjectLifecycleErrorV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import { ProjectIdentityRegistryErrorV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  VNextLocalOperatorSessionErrorV01,
  abandonVNextRecoveryRepositoryDecisionSessionV01,
  assertVNextLocalOperatorRequestBoundaryV01,
  isVNextRecoveryRepositoryDecisionCredentialV01,
  issueVNextRecoveryRepositoryDecisionSessionV01,
  issueVNextRepositoryDecisionChallengeV01,
  readVNextRecoveryRepositoryDecisionCredentialFromRequestV01,
  readVNextRepositoryDecisionCredentialFromRequestV01,
  serializeVNextRecoveryRepositoryDecisionSessionCookieV01,
  serializeVNextRepositoryDecisionSessionCookieV01,
  type VNextLocalOperatorSessionCredentialV01,
  type VNextLocalOperatorSessionMutationAdmissionV01,
} from "@/lib/vnext/runtime/local-operator-session";
import {
  authorizeRepositoryExecutionDecisionFromBrowserSessionInsideTransactionV01,
  grantRepositoryExecutionDecisionFromBrowserSessionV01,
  RepositoryExecutionErrorV01,
} from "@/lib/vnext/repository-execution/repository-execution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY" };
const MAX_BODY_BYTES = 16 * 1024;

export async function GET(request: Request) {
  let db = null;
  try {
    const url = assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: false });
    db = openDatabase();
    const projectId = url.searchParams.get("project_id");
    if (projectId) {
      const project = await readProjectDestinationV01(db, projectId);
      return project ? json({ ok: true, project }) : json({ ok: false, error_code: "not_found" }, 404);
    }
    return json({ ok: true, recent_projects: await listRecentProjectsV01(db) });
  } catch (error) { return routeError(error); }
  finally { db?.close(); }
}

export async function POST(request: Request) {
  let db: ReturnType<typeof openDatabase> | null = null;
  try {
    assertVNextLocalOperatorRequestBoundaryV01(request, { mutating: true });
    const body = await readBoundedBody(request);
    if (body.action === "choose_folder") {
      return json({
        ok: true,
        picker: await pickAndInspectLocalProjectV01({ signal: request.signal }),
      });
    }
    if (body.action === "declare_path") {
      const declaration = parseLocalProjectPathDeclarationV01(body.path);
      const picker = await declareAndInspectLocalProjectV01(
        declaration.absolute_path,
      );
      const binding = readPreparedLocalProjectSelectionBindingV01(
        picker.selection_token,
      );
      if (binding.selection_purpose !== "connect_new_project") {
        throw new ProjectOnboardingErrorV01("project_scope_conflict", 409);
      }
      const session = issueLocalProjectOnboardingSessionV01({
        selection_token: picker.selection_token,
        inspection_fingerprint: picker.inspection.inspection_fingerprint,
        expected_active_project_id: binding.expected_active_project_id,
        expected_active_selection_revision:
          binding.expected_active_selection_revision,
      });
      return json(
        { ok: true, picker },
        200,
        serializeLocalProjectOnboardingCookieV01({
          credential: session.credential,
          expires_at: session.expires_at,
          secure: new URL(request.url).protocol === "https:",
        }),
      );
    }
    if (body.action === "choose_recovery_folder") {
      return json({
        ok: true,
        picker: await pickAndInspectLocalProjectRecoveryV01(
          requiredRecoveryScope(body),
          { signal: request.signal },
        ),
      });
    }
    if (body.action === "declare_recovery_path") {
      const declaration = parseLocalProjectPathDeclarationV01(body.path);
      return json({
        ok: true,
        picker: await declareAndInspectLocalProjectRecoveryV01(
          declaration.absolute_path,
          requiredRecoveryScope(body),
        ),
      });
    }
    if (body.action === "abandon_selection") {
      const selectionToken = requiredString(body.selection_token);
      abandonPreparedLocalProjectOnboardingSelectionV01(selectionToken);
      let credential = null;
      try {
        credential = readLocalProjectOnboardingCredentialFromRequestV01(
          request,
        );
      } catch {}
      abandonLocalProjectOnboardingSessionV01(credential, selectionToken);
      return json({ ok: true, abandoned: true });
    }
    if (body.action === "abandon_recovery_selection") {
      const selectionToken = requiredString(body.selection_token);
      const projectId = requiredString(body.project_id);
      try {
        const binding = readPreparedLocalProjectSelectionBindingV01(
          selectionToken,
        );
        if (
          binding.selection_purpose !== "recover_existing_project" ||
          binding.recovery_project_id !== projectId
        ) {
          throw new ProjectOnboardingErrorV01(
            "project_scope_conflict",
            409,
          );
        }
        db = openDatabase();
        abandonVNextRecoveryRepositoryDecisionSessionV01(
          db,
          binding.selection_binding_fingerprint,
        );
      } catch (error) {
        if (
          !(error instanceof ProjectOnboardingErrorV01) ||
          error.code !== "inspection_stale"
        ) {
          throw error;
        }
      }
      abandonPreparedLocalProjectRecoverySelectionV01(selectionToken, projectId);
      return json({ ok: true, abandoned: true });
    }
    db = openDatabase();
    if (body.action === "confirm") {
      return json({ ok: true, result: await confirmLocalProjectOnboardingV01(db, {
        selection_token: requiredString(body.selection_token),
        inspection_fingerprint: requiredString(body.inspection_fingerprint),
        display_name: requiredText(body.display_name),
        selection_origin: "native_picker",
      }) });
    }
    if (body.action === "prepare_onboarding_confirmation") {
      assertBrowserUserConfirmationV01(request);
      const selectionToken = requiredString(body.selection_token);
      const inspectionFingerprint = requiredString(
        body.inspection_fingerprint,
      );
      const displayName = requiredText(body.display_name);
      const binding = readPreparedLocalProjectSelectionBindingV01(
        selectionToken,
      );
      if (
        binding.selection_origin !== "declared_path" ||
        binding.selection_purpose !== "connect_new_project" ||
        binding.inspection_fingerprint !== inspectionFingerprint
      ) {
        throw new ProjectOnboardingErrorV01(
          "selection_origin_mismatch",
          409,
        );
      }
      const issued = issueLocalProjectOnboardingChallengeV01({
        selection_token: selectionToken,
        inspection_fingerprint: inspectionFingerprint,
        display_name: displayName,
        expected_active_project_id: binding.expected_active_project_id,
        expected_active_selection_revision:
          binding.expected_active_selection_revision,
        credential:
          readLocalProjectOnboardingCredentialFromRequestV01(request),
      });
      return json(
        { ok: true, confirmation: issued.confirmation },
        200,
        serializeLocalProjectOnboardingCookieV01({
          credential: issued.credential,
          expires_at: issued.confirmation.expires_at,
          secure: new URL(request.url).protocol === "https:",
        }),
      );
    }
    if (body.action === "confirm_declared_path") {
      assertBrowserUserConfirmationV01(request);
      const selectionToken = requiredString(body.selection_token);
      const inspectionFingerprint = requiredString(
        body.inspection_fingerprint,
      );
      const displayName = requiredText(body.display_name);
      const result =
        await confirmLocalProjectOnboardingFromBrowserSessionV01(
          {
            selection_token: selectionToken,
            inspection_fingerprint: inspectionFingerprint,
            display_name: displayName,
            challenge_fingerprint: requiredString(
              body.challenge_fingerprint,
            ),
            credential:
              readLocalProjectOnboardingCredentialFromRequestV01(request),
          },
          () => confirmLocalProjectOnboardingV01(db!, {
            selection_token: selectionToken,
            inspection_fingerprint: inspectionFingerprint,
            display_name: displayName,
            selection_origin: "declared_path",
          }),
        );
      return json({ ok: true, result });
    }
    if (body.action === "rename") {
      return json({ ok: true, result: renameActiveProjectDisplayNameV01(db, {
        project_id: requiredString(body.project_id),
        expected_active_project_id: requiredString(body.expected_active_project_id),
        expected_active_selection_revision: requiredRevision(body.expected_active_selection_revision),
        expected_current_display_name: requiredNullableString(body, "expected_current_display_name"),
        requested_display_name: requiredText(body.requested_display_name),
      }) });
    }
    if (body.action === "open") {
      return json({ ok: true, result: await openRecentProjectV01(db, {
        project_id: requiredString(body.project_id),
        expected_project_id: requiredNullableString(body, "expected_project_id"),
        expected_revision: requiredNullableRevision(body, "expected_revision"),
      }) });
    }
    if (body.action === "open_recovery_selection") {
      return json({
        ok: true,
        result: await openRecoveredLocalProjectFromSelectionV01(db, {
          project_id: requiredString(body.project_id),
          selection_token: requiredString(body.selection_token),
          inspection_fingerprint: requiredString(body.inspection_fingerprint),
          expected_old_root_binding_fingerprint: requiredString(
            body.expected_old_root_binding_fingerprint,
          ),
          expected_old_baseline_fingerprint: requiredNullableString(
            body,
            "expected_old_baseline_fingerprint",
          ),
        }),
      });
    }
    if (body.action === "remove") {
      return json({ ok: true, result: removeProjectFromRecentV01(db, {
        project_id: requiredString(body.project_id),
        expected_project_id: requiredNullableString(body, "expected_project_id"),
        expected_revision: requiredNullableRevision(body, "expected_revision"),
      }) });
    }
    if (body.action === "prepare_repository_execution_rebind_confirmation") {
      assertBrowserUserConfirmationV01(request);
      const selectionToken = requiredString(body.selection_token);
      const preview = await previewLocalProjectRootRebindFromSelectionV01(db, {
        project_id: requiredString(body.project_id),
        selection_token: selectionToken,
        inspection_fingerprint: requiredString(body.inspection_fingerprint),
        expected_old_root_binding_fingerprint: requiredString(body.expected_old_root_binding_fingerprint),
        expected_old_baseline_fingerprint: requiredNullableString(body, "expected_old_baseline_fingerprint"),
      });
      const binding = readExactRecoveryRebindBindingV01(
        selectionToken,
        preview.project_id,
      );
      const generalConfirmation = tryIssueGeneralRepositoryDecisionChallengeV01(
        db,
        request,
        preview.workspace_id,
        preview.project_id,
        preview.decision_request!.request_fingerprint,
      );
      if (generalConfirmation) {
        return json({
          ok: true,
          decision_request_fingerprint:
            preview.decision_request!.request_fingerprint,
          confirmation: generalConfirmation,
        });
      }
      const recoverySession =
        issueVNextRecoveryRepositoryDecisionSessionV01(db, {
          scope: {
            workspace_id: preview.workspace_id,
            project_id: preview.project_id,
            action: "rebind_root",
            selection_binding_fingerprint:
              binding.selection_binding_fingerprint,
            decision_request_fingerprint:
              preview.decision_request!.request_fingerprint,
            expected_old_root_binding_fingerprint:
              binding.expected_old_root_binding_fingerprint,
            expected_old_baseline_fingerprint:
              binding.expected_old_baseline_fingerprint,
            expected_new_physical_observation_fingerprint:
              binding.physical_root_observation_fingerprint,
            expected_active_project_id:
              binding.expected_active_project_id,
            expected_active_selection_revision:
              binding.expected_active_selection_revision,
            candidate_expires_at: binding.expires_at,
          },
        });
      const confirmation = issueVNextRepositoryDecisionChallengeV01(db, {
        request_fingerprint: preview.decision_request!.request_fingerprint,
        workspace_id: preview.workspace_id,
        project_id: preview.project_id,
        credential: recoverySession.admission.credential,
      });
      return json({
        ok: true,
        decision_request_fingerprint:
          preview.decision_request!.request_fingerprint,
        confirmation,
      }, 200, serializeVNextRecoveryRepositoryDecisionSessionCookieV01({
        selection_binding_fingerprint:
          binding.selection_binding_fingerprint,
        value: recoverySession.admission.cookie_value,
        expires_at: recoverySession.admission.cookie_expires_at,
        max_age_seconds: recoverySession.admission.cookie_max_age_seconds,
        secure: new URL(request.url).protocol === "https:",
      }));
    }
    if (body.action === "confirm_rebind") {
      assertBrowserUserConfirmationV01(request);
      const selectionToken = requiredString(body.selection_token);
      const binding = readExactRecoveryRebindBindingV01(
        selectionToken,
        requiredString(body.project_id),
      );
      const decisionRequestFingerprint = requiredString(
        body.decision_request_fingerprint,
      );
      const challengeFingerprint = requiredString(
        body.challenge_fingerprint,
      );
      let credential: VNextLocalOperatorSessionCredentialV01;
      try {
        credential = readMatchingRepositoryDecisionCredentialV01(
          db,
          request,
          binding,
          decisionRequestFingerprint,
          challengeFingerprint,
        );
      } catch (error) {
        abandonVNextRecoveryRepositoryDecisionSessionV01(
          db,
          binding.selection_binding_fingerprint,
        );
        throw error;
      }
      const recoveryScopedCredential =
        isVNextRecoveryRepositoryDecisionCredentialV01(credential);
      const sessionHolder: {
        current: VNextLocalOperatorSessionMutationAdmissionV01 | null;
      } = { current: null };
      let result;
      try {
        result = await rebindLocalProjectRootFromSelectionV01(db, {
          project_id: binding.recovery_project_id,
          selection_token: selectionToken,
          inspection_fingerprint: requiredString(body.inspection_fingerprint),
          expected_old_root_binding_fingerprint: requiredString(body.expected_old_root_binding_fingerprint),
          expected_old_baseline_fingerprint: requiredNullableString(body, "expected_old_baseline_fingerprint"),
          decision_request_fingerprint: decisionRequestFingerprint,
        }, {
          authorize_decision_inside_transaction: (decision) => {
            const authorized =
              authorizeRepositoryExecutionDecisionFromBrowserSessionInsideTransactionV01(
                db!,
                {
                  request_fingerprint: decision.request_fingerprint,
                  workspace_id: decision.workspace_id,
                  project_id: decision.project_id,
                  challenge_fingerprint: challengeFingerprint,
                  credential,
                },
              );
            sessionHolder.current = authorized.session_admission;
            if (!authorized.decision.grant_fingerprint) {
              throw new RepositoryExecutionErrorV01(
                "repository_execution_decision_not_granted",
                409,
              );
            }
            return {
              grant_fingerprint: authorized.decision.grant_fingerprint,
            };
          },
        });
      } finally {
        if (recoveryScopedCredential) {
          abandonVNextRecoveryRepositoryDecisionSessionV01(
            db,
            binding.selection_binding_fingerprint,
          );
        }
      }
      const sessionAdmission = sessionHolder.current;
      if (!sessionAdmission) {
        throw new RepositoryExecutionErrorV01(
          "repository_execution_decision_not_granted",
          409,
        );
      }
      return recoveryScopedCredential
        ? json({ ok: true, result })
        : json(
            { ok: true, result },
            200,
            serializeVNextRepositoryDecisionSessionCookieV01({
              value: sessionAdmission.cookie_value,
              expires_at: sessionAdmission.cookie_expires_at,
              max_age_seconds: sessionAdmission.cookie_max_age_seconds,
              secure: new URL(request.url).protocol === "https:",
            }),
          );
    }
    if (body.action === "prepare_repository_execution_decision_confirmation") {
      assertBrowserUserConfirmationV01(request);
      const credential = readVNextRepositoryDecisionCredentialFromRequestV01(
        request,
      );
      return json({ ok: true, confirmation:
        issueVNextRepositoryDecisionChallengeV01(db, {
          request_fingerprint: requiredString(body.request_fingerprint),
          workspace_id: requiredString(body.workspace_id),
          project_id: requiredString(body.project_id),
          credential,
        }) });
    }
    if (body.action === "confirm_repository_execution_decision") {
      assertBrowserUserConfirmationV01(request);
      const credential = readVNextRepositoryDecisionCredentialFromRequestV01(
        request,
      );
      const authorized = grantRepositoryExecutionDecisionFromBrowserSessionV01(db, {
        request_fingerprint: requiredString(body.request_fingerprint),
        workspace_id: requiredString(body.workspace_id),
        project_id: requiredString(body.project_id),
        challenge_fingerprint: requiredString(body.challenge_fingerprint),
        credential,
      });
      return json(
        { ok: true, result: authorized.decision },
        200,
        serializeVNextRepositoryDecisionSessionCookieV01({
          value: authorized.session_admission.cookie_value,
          expires_at: authorized.session_admission.cookie_expires_at,
          max_age_seconds:
            authorized.session_admission.cookie_max_age_seconds,
          secure: new URL(request.url).protocol === "https:",
        }),
      );
    }
    throw new ProjectOnboardingErrorV01("selection_invalid", 400);
  } catch (error) { return routeError(error); }
  finally { db?.close(); }
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || !value) throw new ProjectOnboardingErrorV01("selection_invalid");
  return value;
}
function requiredText(value: unknown): string {
  if (typeof value !== "string") throw new ProjectOnboardingErrorV01("selection_invalid");
  return value;
}
async function readBoundedBody(request: Request): Promise<Record<string, unknown>> {
  const declaredLengthValue = request.headers.get("content-length");
  if (declaredLengthValue !== null) {
    if (!/^(0|[1-9]\d*)$/.test(declaredLengthValue)) {
      throw new ProjectOnboardingErrorV01("selection_invalid", 400);
    }
    const declaredLength = Number(declaredLengthValue);
    if (!Number.isSafeInteger(declaredLength)) {
      throw new ProjectOnboardingErrorV01("selection_invalid", 400);
    }
    if (declaredLength > MAX_BODY_BYTES) {
      throw new ProjectOnboardingErrorV01("selection_invalid", 413);
    }
  }
  if (!request.body) throw new ProjectOnboardingErrorV01("selection_invalid", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const remainingWithDetectionByte = MAX_BODY_BYTES + 1 - total;
      if (value.byteLength >= remainingWithDetectionByte) {
        total += remainingWithDetectionByte;
        try { await reader.cancel(); } catch {}
        throw new ProjectOnboardingErrorV01("selection_invalid", 413);
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("invalid");
    }
    return value as Record<string, unknown>;
  } catch {
    throw new ProjectOnboardingErrorV01("selection_invalid", 400);
  }
}
function requiredNullableString(record: Record<string, unknown>, key: string): string | null {
  if (!Object.hasOwn(record, key)) throw new ProjectOnboardingErrorV01("selection_invalid");
  const value = record[key];
  if (value === null || (typeof value === "string" && value.length > 0)) return value;
  throw new ProjectOnboardingErrorV01("selection_invalid");
}
function requiredNullableRevision(record: Record<string, unknown>, key: string): number | null {
  if (!Object.hasOwn(record, key)) throw new ProjectOnboardingErrorV01("selection_invalid");
  const value = record[key];
  if (value === null || (typeof value === "number" && Number.isSafeInteger(value) && value > 0)) return value;
  throw new ProjectOnboardingErrorV01("selection_invalid");
}
function requiredRevision(value: unknown): number {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
  throw new ProjectOnboardingErrorV01("selection_invalid");
}
function requiredRecoveryScope(
  body: Record<string, unknown>,
) {
  return {
    project_id: requiredString(body.project_id),
    expected_old_root_binding_fingerprint: requiredString(
      body.expected_old_root_binding_fingerprint,
    ),
    expected_old_baseline_fingerprint: requiredNullableString(
      body,
      "expected_old_baseline_fingerprint",
    ),
    expected_active_project_id: requiredNullableString(
      body,
      "expected_active_project_id",
    ),
    expected_active_selection_revision: requiredNullableRevision(
      body,
      "expected_active_selection_revision",
    ),
  };
}
function readExactRecoveryRebindBindingV01(
  selectionToken: string,
  projectId: string,
) {
  const binding = readPreparedLocalProjectSelectionBindingV01(selectionToken);
  if (
    binding.selection_purpose !== "recover_existing_project" ||
    binding.recovery_action !== "rebind" ||
    binding.recovery_project_id !== projectId ||
    !binding.expected_workspace_id ||
    !binding.expected_old_root_binding_fingerprint ||
    !binding.expected_old_baseline_fingerprint ||
    !binding.physical_root_observation_fingerprint
  ) {
    throw new ProjectOnboardingErrorV01("project_scope_conflict", 409);
  }
  return {
    ...binding,
    expected_workspace_id: binding.expected_workspace_id,
    recovery_project_id: binding.recovery_project_id,
    expected_old_root_binding_fingerprint:
      binding.expected_old_root_binding_fingerprint,
    expected_old_baseline_fingerprint:
      binding.expected_old_baseline_fingerprint,
    physical_root_observation_fingerprint:
      binding.physical_root_observation_fingerprint,
  };
}
function tryIssueGeneralRepositoryDecisionChallengeV01(
  db: NonNullable<ReturnType<typeof openDatabase>>,
  request: Request,
  workspaceId: string,
  projectId: string,
  requestFingerprint: string,
) {
  try {
    return issueVNextRepositoryDecisionChallengeV01(db, {
      workspace_id: workspaceId,
      project_id: projectId,
      request_fingerprint: requestFingerprint,
      credential: readVNextRepositoryDecisionCredentialFromRequestV01(
        request,
      ),
    });
  } catch (error) {
    if (error instanceof VNextLocalOperatorSessionErrorV01) return null;
    throw error;
  }
}
function readMatchingRepositoryDecisionCredentialV01(
  db: NonNullable<ReturnType<typeof openDatabase>>,
  request: Request,
  binding: ReturnType<typeof readExactRecoveryRebindBindingV01>,
  requestFingerprint: string,
  challengeFingerprint: string,
): VNextLocalOperatorSessionCredentialV01 {
  const readers = [
    () => readVNextRepositoryDecisionCredentialFromRequestV01(request),
    () => readVNextRecoveryRepositoryDecisionCredentialFromRequestV01(
      request,
      binding.selection_binding_fingerprint,
    ),
  ];
  for (const readCredential of readers) {
    try {
      const credential = readCredential();
      const challenge = issueVNextRepositoryDecisionChallengeV01(db, {
        workspace_id: binding.expected_workspace_id,
        project_id: binding.recovery_project_id,
        request_fingerprint: requestFingerprint,
        credential,
      });
      if (challenge.challenge_fingerprint === challengeFingerprint) {
        return credential;
      }
    } catch (error) {
      if (!(error instanceof VNextLocalOperatorSessionErrorV01)) throw error;
    }
  }
  throw new VNextLocalOperatorSessionErrorV01(
    "operator_session_cookie_missing",
    401,
  );
}
function assertBrowserUserConfirmationV01(request: Request): void {
  if (
    request.headers.get("sec-fetch-site") !== "same-origin" ||
    request.headers.get("sec-fetch-mode") !== "cors" ||
    request.headers.get("sec-fetch-dest") !== "empty"
  ) {
    throw new ProjectOnboardingErrorV01("selection_invalid", 403);
  }
}
function routeError(error: unknown) {
  if (error instanceof ProjectOnboardingErrorV01) return json({ ok: false, error_code: error.code }, error.status);
  if (error instanceof LocalProjectPathDeclarationErrorV01) return json({ ok: false, error_code: error.code }, error.status);
  if (error instanceof ProjectLifecycleErrorV01) return json({ ok: false, error_code: error.code }, error.code === "active_selection_conflict" ? 409 : 404);
  if (error instanceof ProjectIdentityRegistryErrorV01) {
    const status = error.code.includes("conflict")
      ? 409
      : error.code === "project_identity_scope_mismatch"
        ? 404
        : 400;
    return json({ ok: false, error_code: error.code }, status);
  }
  if (error instanceof VNextLocalOperatorSessionErrorV01) return json({ ok: false, error_code: error.code }, error.status);
  if (error instanceof RepositoryExecutionErrorV01) return json({ ok: false, error_code: error.code }, error.status);
  return json({ ok: false, error_code: "onboarding_unavailable" }, 500);
}
function json(body: unknown, status = 200, setCookie?: string) {
  const headers = new Headers(HEADERS);
  if (setCookie) headers.set("Set-Cookie", setCookie);
  return NextResponse.json(body, { status, headers });
}
