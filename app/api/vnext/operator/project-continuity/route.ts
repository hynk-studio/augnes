import type Database from "better-sqlite3";
import { NextResponse } from "next/server";
import { buildSelectedWorkSourceEntry, compareSelectedWorkSources, SelectedWorkSourceError } from "@/lib/intake/selected-work-source-comparison";
import { recallRetainedWorkSources, resolveRetainedWorkSources } from "@/lib/intake/retained-work-source-recall";

import {
  VNextLocalOperatorSessionErrorV01,
  assertVNextLocalOperatorRequestBoundaryV01,
  authenticateVNextLocalOperatorSessionV01,
  openVNextLocalOperatorDatabaseV01,
  readBoundedVNextLocalOperatorBodyV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  assertVNextLocalReviewEnabledV01,
  readVNextLocalReviewProfileV01,
  resolveVNextLocalReviewConfigV01,
  serializeVNextLocalOperatorSessionCookieV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
} from "@/lib/vnext/runtime/local-operator-session";
import { readVNextLocalRuntimeClockNowV01, type VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import { buildHostedResearchProjectionV02, HostedResearchProjectionErrorV02 } from "@/lib/vnext/adapters/hosted-research-projection";
import { readCanonicalProjectIdentityV01 } from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  VNextOperatorPilotContinuityErrorV01,
  projectVNextOperatorPilotContinuityV01,
  inspectVNextOperatorPilotPacketLineageV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  VNextOperatorPilotContextUseReviewErrorV01,
  recordVNextOperatorPilotContextUseReviewV01,
} from "@/lib/vnext/runtime/operator-pilot-context-use-review";
import {
  defineInitialProjectWorkV01,
  isProjectWorkInitializationErrorV01,
  readProjectWorkInitializationV01,
} from "@/lib/vnext/runtime/project-work-initialization";
import {
  ProjectWorkRevisionErrorV01,
  revisePreExecutionProjectWorkV01,
  readProjectWorkRevisionEligibilityStrictV01,
} from "@/lib/vnext/runtime/project-work-revision";
import { PreExecutionProjectWorkRevisionErrorV01, inspectPreExecutionProjectWorkRevisionChainV01 } from "@/lib/vnext/runtime/pre-execution-project-work-revision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_operator_project_continuity_route.v0.1" as const;
const SECURITY_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
} as const;

interface HandlerOptionsV01 {
  environment?: NodeJS.ProcessEnv;
  clock?: VNextLocalRuntimeClockV01;
  secret_source?: VNextLocalOperatorSecretSourceV01;
  open_database?: (config: VNextLocalOperatorPilotConfigV01) => Database.Database;
}

export function createVNextOperatorProjectContinuityHandlerV01(
  options: HandlerOptionsV01 = {},
) {
  return async function GET(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertVNextLocalReviewEnabledV01(environment);
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: false,
      });
      if ([...url.searchParams.keys()].length > 0) {
        throw new VNextOperatorPilotContinuityErrorV01(
          "operator_pilot_continuity_query_forbidden",
          400,
        );
      }
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      const config = resolveVNextLocalReviewConfigV01({
        environment,
        credential,
        clock: options.clock,
      });
      db = (options.open_database ?? openVNextLocalOperatorDatabaseV01)(config);
      // All consumers of this current read share one SQLite snapshot. The
      // existing owners still determine scope, selection and packet lineage.
      const { continuity, work_initialization } = db.transaction(() => {
        authenticateVNextLocalOperatorSessionV01(db!, { config, credential, clock: options.clock });
        return {
          continuity: projectVNextOperatorPilotContinuityV01(db!, { config, clock: options.clock }),
          work_initialization: readProjectWorkInitializationV01(db!, config),
        };
      })();
      return jsonResponse({
        ok: true,
        route_version: ROUTE_VERSION,
        status: "project_continuity",
        project: {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
        },
        continuity,
        work_initialization,
        projection_is_read_only: true,
        authentication_boundary:
          "local_secret_possession_only_not_external_identity",
        semantic_authority_granted: false,
      });
    } catch (error) {
      return errorResponse(error);
    } finally {
      db?.close();
    }
  };
}

export const GET = createVNextOperatorProjectContinuityHandlerV01();

export function createVNextOperatorContextUseReviewHandlerV01(
  options: HandlerOptionsV01 = {},
) {
  return async function POST(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertVNextLocalReviewEnabledV01(environment);
      const url = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: true,
      });
      if ([...url.searchParams.keys()].length > 0) {
        throw new VNextOperatorPilotContextUseReviewErrorV01(
          "operator_pilot_context_use_review_query_forbidden",
          400,
        );
      }
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      const config = resolveVNextLocalReviewConfigV01({
        environment,
        credential,
        clock: options.clock,
      });
      db = (options.open_database ?? openVNextLocalOperatorDatabaseV01)(config);
      const body = await readBoundedVNextLocalOperatorBodyV01(request);
      const companionPreparation = readVNextLocalReviewProfileV01(environment) === "companion_first_work_v1";
      if (companionPreparation && ![
        "define_initial_project_work",
        "compare_selected_work_sources",
        "lookup_retained_work_sources",
        "revise_pre_execution_project_work",
        "export_hosted_snapshot",
      ].includes(body.action as string)) {
        throw new VNextLocalOperatorSessionErrorV01("operator_pilot_disabled", 404);
      }
      if (body.action === "export_hosted_snapshot") {
        const keys = ["action", "expected_active_project_id", "expected_active_selection_revision",
          "expected_current_packet_id", "expected_current_packet_fingerprint"];
        if (Object.keys(body).sort().join(",") !== keys.sort().join(",") ||
          typeof body.expected_active_project_id !== "string" ||
          !Number.isSafeInteger(body.expected_active_selection_revision) ||
          (body.expected_active_selection_revision as number) < 1 ||
          typeof body.expected_current_packet_id !== "string" ||
          typeof body.expected_current_packet_fingerprint !== "string") {
          throw new VNextOperatorPilotContinuityErrorV01("hosted_snapshot_request_invalid", 400);
        }
        // One SQLite read snapshot, including authentication. These existing
        // owners determine currentness; never mix captures or retry a subset.
        const projection = db.transaction(() => {
          authenticateVNextLocalOperatorSessionV01(db!, { config, credential, clock: options.clock });
          const project = readCanonicalProjectIdentityV01(db!, config);
          const initialization = readProjectWorkInitializationV01(db!, config);
          const active_selection = readActiveProjectSelectionV01(db!, config.workspace_id);
          if (!initialization.current_packet || !initialization.current_work) {
            throw new HostedResearchProjectionErrorV02("current_work_unavailable");
          }
          if (body.expected_active_project_id !== config.project_id ||
            active_selection?.project_id !== body.expected_active_project_id ||
            active_selection.selection_revision !== body.expected_active_selection_revision ||
            initialization.current_packet.packet_id !== body.expected_current_packet_id ||
            initialization.current_packet.packet_fingerprint !== body.expected_current_packet_fingerprint) {
            throw new HostedResearchProjectionErrorV02("current_read_binding_mismatch");
          }
          const packet_lineage = inspectVNextOperatorPilotPacketLineageV01(db!, {
            config, ...initialization.current_packet,
          });
          return buildHostedResearchProjectionV02({
            project, initialization, active_selection, packet_lineage,
            captured_at: readVNextLocalRuntimeClockNowV01(options.clock, "hosted_snapshot_capture"),
          });
        })();
        // Construct the complete file only after admission. No server-side file,
        // export record, session rotation, or product write is involved.
        return new NextResponse(`${JSON.stringify(projection, null, 2)}\n`, {
          headers: {
            ...SECURITY_HEADERS,
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": 'attachment; filename="augnes-hosted-research-projection.v0.2.json"',
          },
        });
      }
      if (body.action === "compare_selected_work_sources" || body.action === "lookup_retained_work_sources") {
        authenticateVNextLocalOperatorSessionV01(db, { config, credential, clock: options.clock });
        const lookup = body.action === "lookup_retained_work_sources";
        const retained = lookup || body.retained_source_refs !== undefined;
        const selectionBound = retained || companionPreparation;
        const keys = ["action", "expected_current_packet_fingerprint", "expected_current_packet_id",
          ...(lookup ? ["query"] : ["notes"]),
          ...(selectionBound ? ["expected_active_project_id", "expected_active_selection_revision"] : []),
          ...(!lookup && retained ? ["retained_source_refs"] : [])];
        if (Object.keys(body).sort().join(",") !== keys.sort().join(",") ||
          (!lookup && (!Array.isArray(body.notes) || body.notes.length > 8))) {
          throw new ProjectWorkRevisionErrorV01("selected_source_context_invalid", 400);
        }
        const result = db.transaction(() => {
          if (selectionBound) {
            const eligibility = readProjectWorkRevisionEligibilityStrictV01(db!, config);
            if (!eligibility.eligible || eligibility.active_project_id !== body.expected_active_project_id ||
              eligibility.active_selection_revision !== body.expected_active_selection_revision) {
              throw new ProjectWorkRevisionErrorV01("retained_source_work_selection_changed_or_unavailable", 409);
            }
          }
          const chain = inspectPreExecutionProjectWorkRevisionChainV01(db!, config);
          if (!chain.projection_current || chain.tip_packet.packet_id !== body.expected_current_packet_id ||
            chain.tip_packet.integrity.fingerprint !== body.expected_current_packet_fingerprint) {
            throw new ProjectWorkRevisionErrorV01("work_revision_current_packet_changed", 409);
          }
          if (lookup) return { recall: recallRetainedWorkSources(chain, body.query) };
          const sources = resolveRetainedWorkSources(chain, body.retained_source_refs ?? []);
          return { comparison: compareSelectedWorkSources(chain.tip_packet,
            [...(body.notes as unknown[]).map((note) => buildSelectedWorkSourceEntry(config, note)), ...sources.entries], sources.refs) };
        })();
        return jsonResponse({ ok: true, status: lookup ? "retained_source_recall" : "selected_source_comparison", ...result, projection_is_read_only: true });
      }
      if (body.action === "define_initial_project_work") {
        const result = defineInitialProjectWorkV01(db, {
          config,
          credential,
          request: body,
          clock: options.clock,
          secret_source: options.secret_source,
        });
        return jsonResponse(
          {
            ok: true,
            route_version: ROUTE_VERSION,
            status: result.status,
            work_initialization: readProjectWorkInitializationV01(db, config),
            definition: result.definition,
            run_created: result.run_created,
            execution_started: result.execution_started,
            provider_called: result.provider_called,
            project_files_written: result.project_files_written,
            proposal_created: result.proposal_created,
            review_decision_created: result.review_decision_created,
            transition_created: result.transition_created,
            semantic_state_changed: result.semantic_state_changed,
            semantic_authority_granted: false,
            execution_authority_granted: false,
          },
          result.status === "inserted" ? 201 : 200,
          serializeVNextLocalOperatorSessionCookieV01({
            value: result.session_admission.cookie_value,
            expires_at: result.session_admission.cookie_expires_at,
            max_age_seconds:
              result.session_admission.cookie_max_age_seconds,
            secure: url.protocol === "https:",
          }),
        );
      }
      if (body.action === "revise_pre_execution_project_work") {
        const result = revisePreExecutionProjectWorkV01(db, {
          config,
          credential,
          request: body,
          clock: options.clock,
          secret_source: options.secret_source,
        });
        return jsonResponse(
          {
            ok: true,
            route_version: ROUTE_VERSION,
            status: result.status,
            work_initialization: readProjectWorkInitializationV01(db, config),
            definition: result.definition,
            run_created: result.run_created,
            execution_started: result.execution_started,
            provider_called: result.provider_called,
            project_files_written: result.project_files_written,
            proposal_created: result.proposal_created,
            review_decision_created: result.review_decision_created,
            transition_created: result.transition_created,
            semantic_state_changed: result.semantic_state_changed,
            semantic_authority_granted: false,
            execution_authority_granted: false,
          },
          result.status === "inserted" ? 201 : 200,
          serializeVNextLocalOperatorSessionCookieV01({
            value: result.session_admission.cookie_value,
            expires_at: result.session_admission.cookie_expires_at,
            max_age_seconds:
              result.session_admission.cookie_max_age_seconds,
            secure: url.protocol === "https:",
          }),
        );
      }
      const result = recordVNextOperatorPilotContextUseReviewV01(db, {
        config,
        credential,
        request: body,
        clock: options.clock,
        secret_source: options.secret_source,
      });
      return jsonResponse(
        {
          ok: true,
          route_version: ROUTE_VERSION,
          status: result.status,
          review: result.review,
          semantic_state_changed: false,
          transition_created: false,
          packet_created: false,
          authentication_boundary:
            "local_secret_possession_only_not_external_identity",
          semantic_authority_granted: false,
        },
        result.status === "inserted" ? 201 : 200,
        serializeVNextLocalOperatorSessionCookieV01({
          value: result.session_admission.cookie_value,
          expires_at: result.session_admission.cookie_expires_at,
          max_age_seconds: result.session_admission.cookie_max_age_seconds,
          secure: url.protocol === "https:",
        }),
      );
    } catch (error) {
      return errorResponse(error);
    } finally {
      db?.close();
    }
  };
}

export const POST = createVNextOperatorContextUseReviewHandlerV01();

function errorResponse(error: unknown): NextResponse {
  if (error instanceof HostedResearchProjectionErrorV02) {
    return jsonResponse({
      ok: false, route_version: ROUTE_VERSION, status: "error",
      error_code: `hosted_snapshot_${error.code}`,
      semantic_authority_granted: false,
      execution_authority_granted: false,
    }, 409);
  }
  const known =
    error instanceof VNextLocalOperatorSessionErrorV01 ||
    error instanceof VNextOperatorPilotContinuityErrorV01 ||
    error instanceof VNextOperatorPilotContextUseReviewErrorV01 ||
    error instanceof ProjectWorkRevisionErrorV01 ||
    error instanceof SelectedWorkSourceError ||
    error instanceof PreExecutionProjectWorkRevisionErrorV01 ||
    isProjectWorkInitializationErrorV01(error);
  const disabled =
    error instanceof VNextLocalOperatorSessionErrorV01 &&
    error.code === "operator_pilot_disabled";
  return jsonResponse(
    {
      ok: false,
      route_version: ROUTE_VERSION,
      status: disabled ? "not_found" : "error",
      error_code: disabled
        ? "not_found"
        : known
          ? error.code
          : "operator_pilot_continuity_read_failed",
      semantic_authority_granted: false,
    },
    disabled ? 404 : known ? error.status : 500,
  );
}

function jsonResponse(
  body: unknown,
  status = 200,
  cookie?: string,
): NextResponse {
  const headers = new Headers(SECURITY_HEADERS);
  if (cookie) headers.append("Set-Cookie", cookie);
  return NextResponse.json(body, {
    status,
    headers,
  });
}
