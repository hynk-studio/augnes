import path from "node:path";
import { createRecoveryBackup, validateRecoveryBackup, writeRecoveryOperationResult, readRecoveryOperationResultsMetadata } from "./recovery-backup.mjs";
import { inspectRecoveryDatabaseFile } from "./runtime-database-bootstrap.mjs";
import { exactRecoveryTarget, readRecoveryBackupCatalog } from "./recovery-control-operation.mjs";
// Called only by the fixed IPC worker. Packaged mode loads this function from
// the existing verified in-memory supervisor bundle, including its validator.
export async function runRecoveryWorkerJob(input) {
    const { request, backupDirectory, databasePath, scope, validatorApplication, scenario } = input;
    if (input.check_package === true)
        return { package_verified: true };
    if (scenario === "sync_hold" || scenario === "sync_hold_long") {
        process.send?.({ test_phase: "holding" });
        const until = Date.now() + (scenario === "sync_hold_long" ? 5000 : 750);
        while (Date.now() < until) { /* deterministic child-only synchronous work */ }
    }
    if (scenario === "fail")
        throw new Error("injected_failure");
    let backup;
    if (request.action === "create_backup") {
        const installed = readRecoveryOperationResultsMetadata(backupDirectory).installed_package;
        if (input.distribution && installed === null)
            throw new Error("installed_package_identity_missing");
        const sourceApplication = installed ? {
            application_version: installed.application_version, build_identity: installed.build_identity,
            package_contract: installed.package_contract, package_contract_version: installed.package_contract_version,
            runtime_contract: installed.runtime_contract, runtime_schema_version: installed.runtime_schema_version,
        } : input.sourceApplication;
        backup = await createRecoveryBackup({ databasePath, backupDirectory, applicationScopeFingerprint: scope,
            sourceApplication, reason: "manual_recovery", inspectDatabase: inspectRecoveryDatabaseFile,
            protectedBackupIds: input.protectedBackupIds, operationUuid: request.request_id });
        if (scenario === "bookkeeping_fail")
            throw new Error("injected_bookkeeping_failure");
        writeRecoveryOperationResult({ backupDirectory, event: {
                operation_kind: "backup", outcome: "recovery_backup_created", reason_code: "manual_recovery_backup_verified", finished_at: new Date().toISOString(),
                application_version: sourceApplication.application_version, target_application_version: validatorApplication.application_version,
                target_build_identity: validatorApplication.build_identity, database_state: "current",
                protected_backup_id: backup.manifest.backup_id, protected_backup_identity: backup.manifest.backup_identity,
                backup_verified: true, safety_backup_created: false, data_preserved: true, next_action: "continue_with_current_data",
            } });
    }
    else if (request.action === "verify_backup") {
        const target = exactRecoveryTarget(backupDirectory, scope, request);
        if (target.name !== input.targetName)
            throw new Error("target_changed");
        backup = validateRecoveryBackup({ backupPath: path.join(backupDirectory, target.name), expectedApplicationScopeFingerprint: scope,
            expectedBackupId: request.backup_id, expectedBackupIdentity: request.backup_identity, inspectDatabase: inspectRecoveryDatabaseFile });
        exactRecoveryTarget(backupDirectory, scope, request);
    }
    else
        throw new Error("operation_invalid");
    const target = readRecoveryBackupCatalog(backupDirectory, scope).find(row => row.manifest.backup_id === backup.manifest.backup_id && row.manifest.backup_identity === backup.manifest.backup_identity);
    if (!target)
        throw new Error("target_changed");
    if (request.action === "create_backup") {
        // Bind the delivered result to the exact bytes/objects inspected here;
        // publication or the historical completion event alone is insufficient.
        validateRecoveryBackup({ backupPath: path.join(backupDirectory, target.name), expectedApplicationScopeFingerprint: scope,
            expectedBackupId: target.manifest.backup_id, expectedBackupIdentity: target.manifest.backup_identity, inspectDatabase: inspectRecoveryDatabaseFile });
        exactRecoveryTarget(backupDirectory, scope, { ...target.public });
    }
    return { request_id: request.request_id, fingerprint: input.fingerprint, result: {
            backup_id: backup.manifest.backup_id, backup_identity: backup.manifest.backup_identity, target_binding: target.target_binding,
            verified_at: new Date().toISOString(), validator_contract: "augnes.recovery-backup.v1",
            application_version: validatorApplication.application_version, build_identity: validatorApplication.build_identity,
            runtime_contract: validatorApplication.runtime_contract, runtime_schema_version: validatorApplication.runtime_schema_version,
            creation_completed: request.action === "create_backup",
        } };
}
