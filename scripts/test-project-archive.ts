import { insertAutonomyRunLedgerRecord, hasUnsettledAutonomyRunLedgerRecords } from "../lib/autonomy/runner-ledger";
import { buildDefaultRunnerAuthorityBoundary, buildDefaultRunnerBudgetSnapshot, buildDefaultRunnerSourceRefs } from "../lib/autonomy/runner-state";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { createRecoveryBackup } from "./recovery-backup.mjs";
import { inspectRecoveryDatabaseFile, restoreRuntimeDatabase, prepareRuntimeDatabase, structuralSchemaContractSignature } from "./runtime-database-bootstrap.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { openPreparedDatabase } from "../lib/db/prepared-database.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readProjectOrganizationV01, readProjectSelectionStateV02 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { migrateProjectOrganizationV01 } from "../lib/vnext/persistence/project-lifecycle-schema.mjs";
import { defineInitialProjectWorkV01, readProjectWorkInitializationSnapshotV01 } from "../lib/vnext/runtime/project-work-initialization";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "../lib/vnext/runtime/local-operator-session";
import { declareAndInspectLocalProjectV01, confirmLocalProjectOnboardingV01, listRegisteredProjectsV02, declareAndInspectLocalProjectRecoveryV01, openRecoveredLocalProjectFromSelectionV01 } from "../lib/vnext/onboarding/local-project-onboarding";
import { GET, POST } from "../app/api/vnext/projects/route";

async function request(body?: unknown, query = "?view=registered", status = 200) {
  const response = await (body ? POST : GET)(new Request("http://127.0.0.1/api/vnext/projects" + (body ? "" : query), {
    method: body ? "POST" : "GET", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }));
  const value = await response.json(); assert.equal(response.status, status, JSON.stringify(value)); return value;
}
const selection = (db: Database.Database, workspace: string) => {
  const value = readProjectSelectionStateV02(db, workspace);
  return { expected_project_id: value?.project_id ?? null, expected_revision: value?.selection_revision ?? null };
};
const retained = (db: Database.Database) => Object.fromEntries(
  (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as {name: string}[])
    .filter(({name}) => !["vnext_project_organization", "vnext_recent_projects", "vnext_active_project_selections"].includes(name))
    .map(({name}) => [name, db.prepare('SELECT * FROM "' + name.replaceAll('"', '""') + '" ORDER BY rowid').all()]));
const history = (db: Database.Database) => ["vnext_core_records", "vnext_project_identities", "vnext_project_root_bindings", "vnext_project_direction_records", "autonomy_runs"]
  .map(table => db.prepare("SELECT * FROM " + table + " ORDER BY rowid").all());
const digest = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
const valueDigest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export async function testProjectArchive() {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-archive-"))), previous = process.env.AUGNES_DB_PATH;
  const databasePath = path.join(root, "work.db"), backupDirectory = path.join(root, "backups"), repositoryRoot = process.cwd();
  const fingerprint = createHash("sha256").update(repositoryRoot).digest("hex");
  process.env.AUGNES_DB_PATH = databasePath;
  let db = new Database(databasePath);
  try {
    db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db).workspace_id;
    const projects = [];
    for (const name of ["A", "B"]) {
      const folder = path.join(root, name); mkdirSync(folder); writeFileSync(path.join(folder, "source.txt"), "Retain exact source " + name);
      const selected=await declareAndInspectLocalProjectV01(folder);
      projects.push(await confirmLocalProjectOnboardingV01(db,{selection_token:selected.selection_token,
        inspection_fingerprint:selected.inspection.inspection_fingerprint,selection_origin:"declared_path",display_name:name}));
    }
    const a = projects[0]!.project.project_id, b = projects[1]!.project.project_id;
    const scope = (project: string) => ({ workspace_id: workspace, project_id: project });
    const organization = (project = a) => readProjectOrganizationV01(db, scope(project));
    const open = (project_id: string) => request({ action: "open", project_id, ...selection(db, workspace) });
    const change = (action: "archive" | "unarchive", project_id = a) => ({ action, project_id, ...selection(db, workspace), expected_organization_revision: organization(project_id).revision });
    const bind = (project: string) => {
      const config = { enabled: true as const, ...scope(project), operator_id: "operator:archive-fixture", database_path: databasePath };
      const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config });
      const session = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token });
      const credential = readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie: VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 + "=" + session.cookie_value } }));
      return { config, credential };
    };
    const define = (project: string, bound: ReturnType<typeof bind>, observed: ReturnType<typeof selection>) =>
      defineInitialProjectWorkV01(db, { ...bound, request: { action: "define_initial_project_work", ...scope(project),
        expected_active_project_id: project, expected_active_selection_revision: observed.expected_revision!, expected_initialization_state: "not_defined",
        goal: "Inspect retained source " + project, success_criteria: ["The source still needs independent checking"], non_goals: ["Do not execute or mark this work complete"] } });
    await open(a); define(a, bind(a), selection(db, workspace));
    const at=new Date().toISOString();
    insertAutonomyRunLedgerRecord({run_id:"run:archive-synthetic-unresolved",scope:a,autonomy_contract_ref:null,title:"Constructed unknown external effect",
      status:"stopped",scheduled_for:null,started_at:at,finished_at:at,created_at:at,updated_at:at,stop_reason:"unknown_external_effect",
      source_refs:buildDefaultRunnerSourceRefs(),authority_boundary:buildDefaultRunnerAuthorityBoundary(),budget_snapshot:buildDefaultRunnerBudgetSnapshot(),
      metadata:{reconciliation_required:true,external_effect:"unknown",synthetic:true}},[],[],{db});
    assert(hasUnsettledAutonomyRunLedgerRecords({db,scope:a}));
    const aWork = readProjectWorkInitializationSnapshotV01(db, scope(a)).packet;
    assert(aWork);
    await open(b); const bSelection = selection(db, workspace), bBound = bind(b);
    const before = retained(db), originalFile = digest(path.join(root, "A", "source.txt"));
    const heldWorking = change("archive");
    await request(heldWorking);
    assert.deepEqual(retained(db), before, "archive preserves every other storage table, including credentials, work, direction, counters and unresolved obligations");
    assert.deepEqual(selection(db, workspace), bSelection, "inactive A does not change B selection");
    console.log(JSON.stringify({archive_retention_comparison:{project_a:a,project_b:b,table_count:Object.keys(before).length,
      before_sha256:valueDigest(before),after_sha256:valueDigest(retained(db)),source_file_sha256:originalFile,
      saved_work_sha256:valueDigest(aWork),unresolved_effect:hasUnsettledAutonomyRunLedgerRecords({db,scope:a}),B_selection_unchanged:true}}));
    define(b, bBound, bSelection); // Actual independently bound, already-authorized B write.
    const beforeCycles = retained(db);
    const heldArchived = change("unarchive");
    await request(heldArchived); await request(change("archive"));
    await request(heldArchived, "", 409); await request(heldWorking, "", 409);
    assert.deepEqual(retained(db), beforeCycles, "archive-unarchive-archive does not alter retained data");
    assert.deepEqual(selection(db, workspace), bSelection);
    assert(hasUnsettledAutonomyRunLedgerRecords({db,scope:a}), "organization must not resolve the unknown external effect");
    assert(!(await request(undefined, "")).recent_projects.some((p: any) => p.project.project_id === a));
    assert.deepEqual((await request(undefined, "?view=registered&organization=working")).projects.map((p: any) => p.project.project_id), [b]);
    const archived = await request(undefined, "?view=registered&organization=archived");
    assert.equal(archived.complete, true); assert.equal(archived.projects[0].project.project_id, a);
    assert.equal((await request()).projects.length, 2, "legacy complete all-registered includes archived projects");
    assert.equal((await request(undefined, "?project_id=" + encodeURIComponent(a))).project.organization.state, "archived");
    await request({ action: "open", project_id: a, ...selection(db, workspace) }, "", 409);
    const inspection = await declareAndInspectLocalProjectV01(path.join(root, "A"));
    await confirmLocalProjectOnboardingV01(db, { selection_token: inspection.selection_token, inspection_fingerprint: inspection.inspection.inspection_fingerprint, selection_origin: "declared_path", display_name: "A" });
    assert.equal(organization().state, "archived"); assert.deepEqual(selection(db, workspace), bSelection);
    const locatedEntry=(await listRegisteredProjectsV02(db,null,"archived")).projects[0]!;
    const recoveryScope={project_id:a,expected_old_root_binding_fingerprint:locatedEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:locatedEntry.physical_root_baseline_fingerprint,
      expected_active_project_id:locatedEntry.active_project_id,expected_active_selection_revision:locatedEntry.active_selection_revision};
    const located=await declareAndInspectLocalProjectRecoveryV01(path.join(root,"A"),recoveryScope);
    assert.equal(located.recovery_action,"open_project");
    await assert.rejects(openRecoveredLocalProjectFromSelectionV01(db,{...recoveryScope,selection_token:located.selection_token,
      inspection_fingerprint:located.inspection.inspection_fingerprint}),/project_archived/);
    assert.equal(organization().state,"archived");assert.deepEqual(selection(db,workspace),bSelection);
    // An uncertain transport is reconciled through the production exact reader.
    await POST(new Request("http://127.0.0.1/api/vnext/projects", { method: "POST", headers: { host:"127.0.0.1", origin:"http://127.0.0.1", "content-type":"application/json" }, body: JSON.stringify(change("unarchive")) }));
    assert.equal((await request(undefined, "?project_id=" + encodeURIComponent(a))).project.organization.state, "working");
    const concurrent = change("archive");
    const responses = await Promise.all([0, 1].map(() => POST(new Request("http://127.0.0.1/api/vnext/projects", { method:"POST", headers:{host:"127.0.0.1",origin:"http://127.0.0.1","content-type":"application/json"},body:JSON.stringify(concurrent) }))));
    assert.deepEqual(responses.map(r => r.status).sort(), [200,409]);
    // Missing roots stay discoverable and organization does not require root I/O.
    rmSync(path.join(root, "A"), {recursive:true});
    assert.equal((await request(undefined, "?view=registered&organization=archived")).projects[0].root_availability, "missing");
    await request(change("unarchive")); await request({action:"open",project_id:a,...selection(db,workspace)}, "",409); await request(change("archive"));
    mkdirSync(path.join(root,"A")); writeFileSync(path.join(root,"A","source.txt"),"Retain exact source A");
    assert.equal(digest(path.join(root,"A","source.txt")),originalFile);
    assert.deepEqual(readProjectWorkInitializationSnapshotV01(db,scope(a)).packet,aWork);
    await testOrganizationMigration(db, root);
    const originalHistory=history(db), savedOrganization=organization(), held=change("unarchive");
    const backup=await createRecoveryBackup({databasePath,backupDirectory,applicationScopeFingerprint:fingerprint,
      sourceApplication:{application_version:null,build_identity:null,package_contract:null,package_contract_version:null,runtime_contract:null,runtime_schema_version:null},
      reason:"manual_recovery",inspectDatabase:inspectRecoveryDatabaseFile} as unknown as Parameters<typeof createRecoveryBackup>[0]);
    const backupDigest=digest(backup.payloadPath);
    await request(change("unarchive")); const movedOrganization=organization(); db.close();
    const restore={databasePath,backupDirectory,repositoryRoot,instanceId:"archive-recovery",repositoryFingerprint:fingerprint,runtimeOwnershipGeneration:"archive-fixture",databaseOverrideActive:true,selectedBackupId:backup.manifest.backup_id} as unknown as NonNullable<Parameters<typeof restoreRuntimeDatabase>[0]>;
    await assert.rejects(restoreRuntimeDatabase({...restore,dependencies:{verifyPreparedDatabase:()=>{throw new Error("injected_stage_refusal");}}}),/database_integrity_failed/);
    db=new Database(databasePath);assert.deepEqual(organization(),movedOrganization);db.close();
    const revisions=new Set([savedOrganization.revision,movedOrganization.revision]);
    for(let attempt=0;attempt<2;attempt++){
      assert.equal((await restoreRuntimeDatabase(restore)).databaseState,"restored");db=new Database(databasePath);
      assert.equal(organization().state,"archived");assert(!revisions.has(organization().revision));revisions.add(organization().revision);
      assert.deepEqual(history(db),originalHistory);assert.equal(digest(backup.payloadPath),backupDigest);
      assert(hasUnsettledAutonomyRunLedgerRecords({db,scope:a}), "restore preserves the unresolved obligation");
      console.log(JSON.stringify({archive_restore_comparison:{attempt,backup_sha256:backupDigest,
        before_history_sha256:valueDigest(originalHistory),after_history_sha256:valueDigest(history(db)),
        classification:organization().state,fresh_revision:organization().revision,unresolved_effect:true}}));
      // Refresh selection deliberately: the independent organization observation
      // must still reject a request held before either restoration.
      await request({...held,...selection(db,workspace)},"",409);
      const input=path.join(root,"readback-"+attempt+".json");
      writeFileSync(input,JSON.stringify({databasePath,workspace,a,b,held,current:selection(db,workspace),organization:organization(),aWork}));
      db.close();
      const result=await runCanonicalChild({resourceOwner:undefined,suite:"project-archive",label:"fresh restore "+attempt,command:process.execPath,args:["--import","tsx","scripts/test-project-archive.ts","--readback",input],cwd:repositoryRoot,env:process.env,timeoutMs:15000});
      assert.equal(canonicalChildAcceptanceFailure(result,{suite:"project-archive",timeoutMs:15000,requireNaturalExit:true}),null);
    }
    console.log(JSON.stringify({project_archive:"pass",same_work:true,retained_table_comparison:true,unresolved_effect_preserved:true,independent_B_write:"accepted",ABA:"refused",concurrent_winners:1,uncertain_readback:true,missing_root:true,locate_does_not_unarchive:true,forward_migration:true,repeated_restore:true,fresh_process:true,provider_calls:0}));
  } finally {if(db.open)db.close();if(previous===undefined)delete process.env.AUGNES_DB_PATH;else process.env.AUGNES_DB_PATH=previous;rmSync(root,{recursive:true,force:true});}
}

async function testOrganizationMigration(source: Database.Database, root: string) {
  const file=path.join(root,"pre-archive.db");writeFileSync(file,source.serialize());
  const old=new Database(file);
  try {
    old.exec("DROP TRIGGER trg_vnext_project_organization_initialize; DROP TABLE vnext_project_organization;");
    assert.equal(structuralSchemaContractSignature(old),"fd83e333e228cd9be4eee70ed575ec4079a80ea4781348026987cc5343ae7b41");
    const before=old.serialize();assert.throws(()=>openPreparedDatabase(file),/preparation/);assert(before.equals(old.serialize()),"read must not migrate");
    const failed=new Database(old.serialize());
    try {const exec=failed.exec.bind(failed);failed.exec=(sql:string)=>{if(sql.includes("INSERT INTO vnext_project_organization"))throw new Error("injected migration refusal");return exec(sql);};
      assert.throws(()=>migrateProjectOrganizationV01(failed),/injected migration refusal/);assert.equal(structuralSchemaContractSignature(failed),structuralSchemaContractSignature(old));
    }finally{failed.close();}
  }finally{old.close();}
  const result=await prepareRuntimeDatabase({databasePath:file,backupDirectory:path.join(root,"migration-backups"),repositoryRoot:process.cwd(),instanceId:"archive-upgrade",databaseOverrideActive:true} as unknown as Parameters<typeof prepareRuntimeDatabase>[0]);
  assert.equal(result.databaseState,"migrated");assert.equal(result.recoveryBackupCreated,true);
  const current=openPreparedDatabase(file);
  try {assert.deepEqual(history(current),history(source));assert((current.prepare("SELECT * FROM vnext_project_organization").all() as any[]).every(row=>row.organization_state==="working"),"nonrecent legacy project is working");
    const before=current.serialize();migrateProjectOrganizationV01(current);assert(before.equals(current.serialize()),"migration replay preserves classifications and revisions");
  }finally{current.close();}
}

const isEntry=path.resolve(process.argv[1]??"")===fileURLToPath(import.meta.url);
if(isEntry&&process.argv[2]==="--readback")void(async()=>{
  const input=JSON.parse(readFileSync(process.argv[3]!,"utf8"));process.env.AUGNES_DB_PATH=input.databasePath;
  const db=openPreparedDatabase(input.databasePath);
  try{
    assert.deepEqual(readProjectOrganizationV01(db,{workspace_id:input.workspace,project_id:input.a}),input.organization);
    assert(hasUnsettledAutonomyRunLedgerRecords({db,scope:input.a}));
    assert.deepEqual(readProjectWorkInitializationSnapshotV01(db,{workspace_id:input.workspace,project_id:input.a}).packet,input.aWork);
    await request({...input.held,...input.current},"",409);
    await request({action:"unarchive",project_id:input.a,...input.current,expected_organization_revision:input.organization.revision});
    await request({action:"open",project_id:input.a,...input.current});
    assert.deepEqual(readProjectWorkInitializationSnapshotV01(db,{workspace_id:input.workspace,project_id:input.a}).packet,input.aWork);
    const observed=readProjectOrganizationV01(db,{workspace_id:input.workspace,project_id:input.a});
    await request({action:"archive",project_id:input.a,...selection(db,input.workspace),expected_organization_revision:observed.revision});
    assert.equal(selection(db,input.workspace).expected_project_id,null,"archiving selected A clears only selection");
    assert(hasUnsettledAutonomyRunLedgerRecords({db,scope:input.a}), "deliberate return and archive retain unknown effects");
    console.log(JSON.stringify({archive_restore_readback:"pass",same_work:true,deliberate_return:true,selected_archive_cleared:true}));
  }finally{db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
else if(isEntry)void testProjectArchive().catch(error=>{console.error(error);process.exitCode=1;});
