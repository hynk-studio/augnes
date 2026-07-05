import { existsSync } from "node:fs";
import { resolve } from "node:path";

import Database from "better-sqlite3";

import {
  buildCurrentWorkingPerspectiveRouteIntegrationReadV01,
} from "@/lib/perspective/current-working-perspective-route-integration-read";
import {
  readAppliedCurrentWorkingPerspectiveForWebV01,
  type AppliedCurrentWorkingPerspectiveRead,
} from "@/lib/perspective/read-applied-current-working-perspective-for-web";
import {
  currentWorkingPerspectiveRouteIntegrationContractWriteSchemaExistsV01,
  listCurrentWorkingPerspectiveRouteIntegrationContractRecordsV01,
  type CurrentWorkingPerspectiveRouteIntegrationContractWriteDbLike,
} from "@/lib/workplane/current-working-perspective-route-integration-contract-write";
import type {
  CurrentWorkingPerspectiveRouteIntegrationRead,
  CurrentWorkingPerspectiveRouteIntegrationReadMode,
} from "@/types/current-working-perspective-route-integration-read";
import type {
  CurrentWorkingPerspectiveRouteIntegrationContractRecord,
  CurrentWorkingPerspectiveRouteIntegrationContractStoreResult,
} from "@/types/current-working-perspective-route-integration-contract-write";

export function readCurrentWorkingPerspectiveRouteIntegrationForWebV01(
  input: {
    runtime_current_working_perspective_read?: unknown;
    runtime_current_working_perspective?: unknown;
    route_integration_contract_store_result?: CurrentWorkingPerspectiveRouteIntegrationContractStoreResult | null;
    route_integration_contract_record?: CurrentWorkingPerspectiveRouteIntegrationContractRecord | null;
    applied_current_working_perspective_read?: AppliedCurrentWorkingPerspectiveRead | null;
    route_integration_contract_db_path?: string | null;
    applied_snapshot_db_path?: string | null;
    requested_route_integration_mode?: CurrentWorkingPerspectiveRouteIntegrationReadMode | null;
    scope?: string;
    as_of?: string;
    source_refs?: string[];
  } = {},
): CurrentWorkingPerspectiveRouteIntegrationRead {
  const warnings: string[] = [];
  const refusalReasons: string[] = [];
  let contractStoreResult =
    input.route_integration_contract_store_result ?? null;
  let contractRecord = input.route_integration_contract_record ?? null;
  let appliedRead = input.applied_current_working_perspective_read ?? null;

  if (input.route_integration_contract_db_path) {
    if (
      !isSafeCurrentWorkingPerspectiveRouteIntegrationReadContractDbPathV01(
        input.route_integration_contract_db_path,
      )
    ) {
      refusalReasons.push("unsafe_route_integration_contract_db_path");
    } else {
      const resolvedPath = resolve(
        process.cwd(),
        input.route_integration_contract_db_path,
      );
      if (!existsSync(resolvedPath)) {
        warnings.push("route_integration_contract_db_missing");
      } else {
        const db = new Database(resolvedPath, {
          readonly: true,
          fileMustExist: true,
        }) as Database.Database &
          CurrentWorkingPerspectiveRouteIntegrationContractWriteDbLike;
        try {
          if (
            currentWorkingPerspectiveRouteIntegrationContractWriteSchemaExistsV01(
              db,
            )
          ) {
            contractStoreResult =
              listCurrentWorkingPerspectiveRouteIntegrationContractRecordsV01({
                db,
                limit: 10,
              });
            contractRecord =
              contractStoreResult.record ??
              contractStoreResult.records[0] ??
              contractRecord;
          } else {
            warnings.push("route_integration_contract_schema_missing");
          }
        } finally {
          db.close();
        }
      }
    }
  }

  if (input.applied_snapshot_db_path) {
    if (
      !isSafeCurrentWorkingPerspectiveRouteIntegrationReadAppliedSnapshotDbPathV01(
        input.applied_snapshot_db_path,
      )
    ) {
      refusalReasons.push("unsafe_applied_snapshot_db_path");
    } else {
      appliedRead = readAppliedCurrentWorkingPerspectiveForWebV01({
        db_path: input.applied_snapshot_db_path,
      });
    }
  }

  const read = buildCurrentWorkingPerspectiveRouteIntegrationReadV01({
    runtime_current_working_perspective_read:
      input.runtime_current_working_perspective_read,
    runtime_current_working_perspective:
      input.runtime_current_working_perspective,
    route_integration_contract_store_result: contractStoreResult,
    route_integration_contract_record: contractRecord,
    applied_current_working_perspective_read: appliedRead,
    requested_route_integration_mode:
      input.requested_route_integration_mode ?? undefined,
    scope: input.scope,
    as_of: input.as_of,
    source_refs: input.source_refs,
  });

  if (warnings.length === 0 && refusalReasons.length === 0) return read;
  return {
    ...read,
    status:
      read.status === "runtime_only" && refusalReasons.length > 0
        ? "fallback_to_runtime"
        : read.status,
    warnings: uniqueStrings([...read.warnings, ...warnings]),
    refusal_reasons: uniqueStrings([
      ...read.refusal_reasons,
      ...refusalReasons,
    ]),
    fallback_metadata: {
      ...read.fallback_metadata,
      used_runtime_fallback: true,
      fallback_reason:
        read.fallback_metadata.fallback_reason ??
        refusalReasons[0] ??
        warnings[0] ??
        "route_integration_material_unavailable",
    },
  };
}

export function isSafeCurrentWorkingPerspectiveRouteIntegrationReadContractDbPathV01(
  value: unknown,
): value is string {
  return isSafeLocalDbPath(value, [
    "tmp/current-working-perspective-route-integration-contracts/",
    ".tmp/current-working-perspective-route-integration-contracts/",
  ]);
}

export function isSafeCurrentWorkingPerspectiveRouteIntegrationReadAppliedSnapshotDbPathV01(
  value: unknown,
): value is string {
  return isSafeLocalDbPath(value, [
    "tmp/current-working-perspective-applies/",
    ".tmp/current-working-perspective-applies/",
  ]);
}

function isSafeLocalDbPath(
  value: unknown,
  allowedPrefixes: string[],
): value is string {
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (
    value.includes("\\") ||
    value.includes("//") ||
    value.includes("..") ||
    value.includes("\0")
  ) {
    return false;
  }
  if (!allowedPrefixes.some((prefix) => value.startsWith(prefix))) {
    return false;
  }
  return !/token|secret|password|private|credential|key/i.test(value);
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
