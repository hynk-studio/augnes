import type Database from "better-sqlite3";
import { NextResponse } from "next/server";

import {
  VNextLocalOperatorSessionErrorV01,
  assertVNextLocalOperatorRequestBoundaryV01,
  authenticateVNextLocalOperatorSessionV01,
  openVNextLocalOperatorDatabaseV01,
  readBoundedVNextLocalOperatorBodyV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  readVNextLocalOperatorPilotConfigV01,
  serializeVNextLocalOperatorSessionCookieV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import {
  VNextOperatorPilotReviewErrorV01,
  listVNextOperatorPilotSemanticReviewsV01,
  readVNextOperatorPilotSemanticReviewV01,
  recordVNextOperatorPilotReviewDecisionV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import {
  VNextOperatorPilotProposalRevisionErrorV01,
  recordVNextOperatorPilotProposalRevisionV01,
} from "@/lib/vnext/runtime/operator-pilot-proposal-revision";
import {
  VNextOperatorPilotWorkbenchLineageErrorV01,
  readVNextOperatorPilotProposalDurableLineageV01,
} from "@/lib/vnext/runtime/operator-pilot-workbench-lineage";
import { projectVNextOperatorPilotContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  VNextOperatorStrategicAdvantageTransferErrorV01,
  requestVNextOperatorStrategicAdvantageTransferV01,
  type VNextOperatorStrategicAdvantageTransferDependenciesV01,
} from "@/lib/vnext/runtime/operator-pilot-strategic-advantage-transfer";
import { readDefaultModelGatewayLocalCapabilityV01 } from "@/lib/vnext/model-gateway/model-gateway";
import { createCanonicalTestStrategicTransportDependenciesV01 } from "@/lib/vnext/model-gateway/canonical-test-strategic-transport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_VERSION = "vnext_operator_semantic_review_route.v0.1" as const;
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
  open_database?: (
    config: VNextLocalOperatorPilotConfigV01,
  ) => Database.Database;
  strategic_dependencies?: VNextOperatorStrategicAdvantageTransferDependenciesV01;
}

export function createVNextOperatorSemanticReviewHandlersV01(
  options: HandlerOptionsV01 = {},
) {
  const openDatabase =
    options.open_database ?? openVNextLocalOperatorDatabaseV01;

  async function getSemanticReview(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertPilotEnabled(environment);
      const requestUrl = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: false,
      });
      assertReadQuery(requestUrl);
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      db = openDatabase(config);
      const authentication = authenticateVNextLocalOperatorSessionV01(db, {
        config,
        credential,
        clock: options.clock,
      });
      const proposalId = requestUrl.searchParams.get("proposal_id");
      const modelCapability =
        options.strategic_dependencies?.read_model_capability?.() ??
        readDefaultModelGatewayLocalCapabilityV01();
      if (proposalId) {
        const proposal = readVNextOperatorPilotSemanticReviewV01(db, {
          config,
          proposal_id: proposalId,
          authenticated_session_id: authentication.session.session_id,
          model_capability: modelCapability,
        });
        return jsonResponse({
          ok: true,
          route_version: ROUTE_VERSION,
          status: "proposal_detail",
          project: {
            workspace_id: config.workspace_id,
            project_id: config.project_id,
          },
          proposal: {
            ...proposal,
            durable_lineage:
              readVNextOperatorPilotProposalDurableLineageV01(db, {
                config,
                proposal: proposal.proposal,
                clock: options.clock,
              }),
            project_continuity: projectVNextOperatorPilotContinuityV01(db, {
              config,
              clock: options.clock,
            }),
          },
          authentication_boundary:
            "local_secret_possession_only_not_external_identity",
          semantic_authority_granted: false,
        });
      }
      return jsonResponse({
        ok: true,
        route_version: ROUTE_VERSION,
        status: "proposal_list",
        project: {
          workspace_id: config.workspace_id,
          project_id: config.project_id,
        },
        proposals: listVNextOperatorPilotSemanticReviewsV01(db, {
          config,
          authenticated_session_id: authentication.session.session_id,
          model_capability: modelCapability,
        }),
        authentication_boundary:
          "local_secret_possession_only_not_external_identity",
        semantic_authority_granted: false,
      });
    } catch (error) {
      return routeErrorResponse(error);
    } finally {
      db?.close();
    }
  }

  async function postSemanticReview(request: Request): Promise<NextResponse> {
    let db: Database.Database | null = null;
    try {
      const environment = options.environment ?? process.env;
      assertPilotEnabled(environment);
      const requestUrl = assertVNextLocalOperatorRequestBoundaryV01(request, {
        mutating: true,
      });
      if ([...requestUrl.searchParams.keys()].length > 0) {
        throw new VNextOperatorPilotReviewErrorV01(
          "operator_pilot_decision_query_forbidden",
          400,
        );
      }
      const config = readVNextLocalOperatorPilotConfigV01(environment);
      const credential = readVNextLocalOperatorCredentialFromRequestV01(request);
      const body = await readBoundedVNextLocalOperatorBodyV01(request);
      db = openDatabase(config);
      if (
        body &&
        typeof body === "object" &&
        !Array.isArray(body) &&
        (body as Record<string, unknown>).action === "revise"
      ) {
        const result = recordVNextOperatorPilotProposalRevisionV01(db, {
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
            proposal: result.proposal,
            proposal_id: result.proposal.proposal_id,
            proposal_fingerprint: result.proposal.integrity.fingerprint,
            source_proposal_unchanged: true,
            transition_applied: false,
            authentication_boundary:
              "local_secret_possession_only_not_external_identity",
            semantic_authority_granted: false,
          },
          result.status === "inserted" ? 201 : 200,
          serializeVNextLocalOperatorSessionCookieV01({
            value: result.session_cookie.value,
            expires_at: result.session_cookie.expires_at,
            max_age_seconds: result.session_cookie.max_age_seconds,
            secure: requestUrl.protocol === "https:",
          }),
        );
      }
      if (
        body &&
        typeof body === "object" &&
        !Array.isArray(body) &&
        (body as Record<string, unknown>).action ===
          "request_strategic_advantage_transfer"
      ) {
        const result =
          await requestVNextOperatorStrategicAdvantageTransferV01(db, {
            config,
            credential,
            request: body,
            signal: request.signal,
            clock: options.clock,
            secret_source: options.secret_source,
            dependencies: {
              ...options.strategic_dependencies,
              open_gateway_database:
                options.strategic_dependencies?.open_gateway_database ??
                (() => openVNextLocalOperatorDatabaseV01(config)),
            },
          });
        return jsonResponse(
          {
            ok: true,
            route_version: ROUTE_VERSION,
            status: result.status,
            proposal: result.proposal,
            proposal_id: result.proposal?.proposal_id ?? null,
            proposal_fingerprint:
              result.proposal?.integrity.fingerprint ?? null,
            reason: "reason" in result ? result.reason : null,
            retryable: "retryable" in result ? result.retryable : false,
            model_invocation_count: result.model_invocation_count,
            source_proposal_unchanged: true,
            transition_applied: false,
            authentication_boundary:
              "local_secret_possession_only_not_external_identity",
            semantic_authority_granted: false,
          },
          result.status === "inserted" ? 201 : 200,
          result.session_cookie
            ? serializeVNextLocalOperatorSessionCookieV01({
                value: result.session_cookie.value,
                expires_at: result.session_cookie.expires_at,
                max_age_seconds: result.session_cookie.max_age_seconds,
                secure: requestUrl.protocol === "https:",
              })
            : undefined,
        );
      }
      const result = recordVNextOperatorPilotReviewDecisionV01(db, {
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
          decision: result.decision,
          transition_requested: result.transition_requested,
          transition_applied: false,
          authentication_boundary:
            "local_secret_possession_only_not_external_identity",
          semantic_authority_granted: false,
        },
        result.status === "inserted" ? 201 : 200,
        serializeVNextLocalOperatorSessionCookieV01({
          value: result.session_cookie.value,
          expires_at: result.session_cookie.expires_at,
          max_age_seconds: result.session_cookie.max_age_seconds,
          secure: requestUrl.protocol === "https:",
        }),
      );
    } catch (error) {
      return routeErrorResponse(error);
    } finally {
      db?.close();
    }
  }

  return { GET: getSemanticReview, POST: postSemanticReview };
}

const handlers = createVNextOperatorSemanticReviewHandlersV01({
  strategic_dependencies:
    createCanonicalTestStrategicTransportDependenciesV01(process.env),
});
export const GET = handlers.GET;
export const POST = handlers.POST;

function assertPilotEnabled(environment: NodeJS.ProcessEnv): void {
  if (environment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED !== "1") {
    throw new VNextLocalOperatorSessionErrorV01(
      "operator_pilot_disabled",
      404,
    );
  }
}

function assertReadQuery(url: URL): void {
  const keys = [...url.searchParams.keys()];
  if (keys.some((key) => key !== "proposal_id")) {
    throw new VNextOperatorPilotReviewErrorV01(
      "operator_pilot_review_query_invalid",
      400,
    );
  }
  if (url.searchParams.getAll("proposal_id").length > 1) {
    throw new VNextOperatorPilotReviewErrorV01(
      "operator_pilot_review_query_invalid",
      400,
    );
  }
}

function routeErrorResponse(error: unknown): NextResponse {
  if (error instanceof VNextLocalOperatorSessionErrorV01) {
    if (error.code === "operator_pilot_disabled") {
      return jsonResponse(
        {
          ok: false,
          route_version: ROUTE_VERSION,
          status: "not_found",
          error_code: "not_found",
          semantic_authority_granted: false,
        },
        404,
      );
    }
    return jsonResponse(
      {
        ok: false,
        route_version: ROUTE_VERSION,
        status: "error",
        error_code: error.code,
        semantic_authority_granted: false,
      },
      error.status,
    );
  }
  if (
    error instanceof VNextOperatorPilotReviewErrorV01 ||
    error instanceof VNextOperatorStrategicAdvantageTransferErrorV01 ||
    error instanceof VNextOperatorPilotProposalRevisionErrorV01
  ) {
    return jsonResponse(
      {
        ok: false,
        route_version: ROUTE_VERSION,
        status: "error",
        error_code: error.code,
        semantic_authority_granted: false,
      },
      error.status,
    );
  }
  if (error instanceof VNextOperatorPilotWorkbenchLineageErrorV01) {
    return jsonResponse(
      {
        ok: false,
        route_version: ROUTE_VERSION,
        status: "error",
        error_code: error.code,
        semantic_authority_granted: false,
      },
      error.status,
    );
  }
  return jsonResponse(
    {
      ok: false,
      route_version: ROUTE_VERSION,
      status: "error",
      error_code: "operator_pilot_review_request_failed",
      semantic_authority_granted: false,
    },
    500,
  );
}

function jsonResponse(
  body: unknown,
  status = 200,
  setCookie?: string,
): NextResponse {
  const headers = new Headers(SECURITY_HEADERS);
  if (setCookie) headers.set("Set-Cookie", setCookie);
  return NextResponse.json(body, { status, headers });
}
