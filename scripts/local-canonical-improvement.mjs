// One evidence case in v2, not a replacement approval or execution system.
// This module performs reads only. The attempts owner owns the exclusive edge.
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { digest, validCanonicalRuntimeInputs, preparedDependencyIdentity } from "./local-canonical-inputs.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { createGitHubObserverAuthorizationTransport } from "./github-main-branch-transport.mjs";
import { createCanonicalRevisionReader } from "./canonical-revision-reader.mjs";
import { createRequire } from "node:module";
import { isUtf8 } from "node:buffer";
import { gunzipSync } from "node:zlib";

export const IMPROVEMENT_KIND = "behavior_preserving_improvement";
export const IMPROVEMENT_SCHEMA = "augnes.local-canonical-source-correction.v2";
export const IMPROVEMENT_CLAIMS = Object.freeze([
  "behavior_preserved_in_stated_corpus", "less_measured_repeated_work",
  "historical_cause_unknown", "no_latency_or_reliability_guarantee", "qualification_not_yet_run",
]);
export const IMPROVEMENT_ACCEPT = "Accept this prospective improvement candidate and its evidence.";
export const IMPROVEMENT_GRANT = "Authorize one prospective qualification of this behavior-preserving improvement.";
const authorizations = new WeakMap();
const fail = code => { throw Object.assign(new Error(`improvement_${code}`), { code: `improvement_${code}` }); };
const equal = (a, b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const sha = x => typeof x === "string" && /^[0-9a-f]{64}$/u.test(x);
const gitId = x => typeof x === "string" && /^[0-9a-f]{40}$/u.test(x);
const id = x => Number.isSafeInteger(x) && x > 0;
const count = x => Number.isSafeInteger(x) && x >= 0;
const text = x => typeof x === "string" && x.length > 0 && x.length <= 4096;
const safePath = x => typeof x === "string" && /^[A-Za-z0-9_./-]+$/u.test(x) && !x.startsWith("/") && !x.split("/").some(p => !p || p === "." || p === "..");
// Repository/dependency names include literal route brackets and scoped packages.
// Artifact references retain the narrower predicate above; production scope is
// still exclusively ordinaryV2SourceModule, never this manifest predicate.
const manifestPath = x => typeof x === "string" && x.length > 0 && x.length <= 4096 &&
  !/[\\\u0000-\u001f\u007f:]/u.test(x) && !x.startsWith("/") &&
  !x.split("/").some(p => !p || p === "." || p === "..");
const utc = x => typeof x === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/u.test(x) && Number.isFinite(Date.parse(x)) &&
  new Date(x).toISOString() === (x.includes(".") ? x : x.replace("Z", ".000Z")) && Date.parse(x) <= Date.now();
const sortedUnique = (xs, predicate = text) => Array.isArray(xs) && xs.length > 0 && xs.length <= 200 && xs.every(predicate) && equal(xs, [...new Set(xs)].sort());
function keys(value, names, code = "shape_invalid") {
  if (!value || typeof value !== "object" || Array.isArray(value) || !equal(Object.keys(value).sort(), names.split(" ").sort())) fail(code);
}
function requireThat(value, code) { if (!value) fail(code); }
export const isImprovement = p => p?.schema === IMPROVEMENT_SCHEMA && p.kind === IMPROVEMENT_KIND;
export function hasImprovementMarker(value) {
  return [value, value?.source_correction, value?.recovery, value?.attempt, value?.attempt?.source_correction, value?.attempt?.recovery]
    .some(v => v && (v.kind === IMPROVEMENT_KIND || Object.hasOwn(v, "improvement_authority") || Object.hasOwn(v, "improvement_consumed") || v.evidence_kind === IMPROVEMENT_KIND));
}

// This is the existing ordinary-v2 predicate, including its literal exceptions.
// Do not normalize: aliases, traversal and alternate separators gain no scope.
export function ordinaryV2SourceModule(proof) {
  const p = proof?.source_module ?? "";
  return /^(?:next\.config\.ts|components\/blank-state\/blank-state-client\.tsx|(?:scripts|app|lib|plugins|apps|src)\/[a-zA-Z0-9_./-]+\.(?:mjs|cjs|js|ts|tsx))$/u.test(p) && !p.split("/").includes("..") ||
    proof?.kind === "source_revision" && ["components/workbench/semantic-review/selected-work-source-editor.tsx",
      "apps/web_planning/src/client.js.txt", "apps/web_planning/src/exchange-client.js.txt",
      "apps/web_planning/src/history-client.js.txt", "apps/web_planning/src/search-client.js.txt"].includes(p);
}

// Canonical bytes reject duplicate keys, whitespace tricks and extra decisions.
// Use the existing digest's sorted-object domain, without importing receipts.
export function parseImprovementJSON(bytes, maximum = 64 * 1024) {
  requireThat(!Buffer.isBuffer(bytes) || isUtf8(bytes),"utf8_required");
  const raw = Buffer.isBuffer(bytes) ? bytes.toString("utf8") : bytes;
  requireThat(typeof raw === "string" && Buffer.byteLength(raw) <= maximum, "record_unbounded");
  let value; try { value = JSON.parse(raw); } catch { fail("json_invalid"); }
  const payload = raw.endsWith("\n") ? raw.slice(0, -1) : raw;
  requireThat(equal(digest(payload), digest(value)), "canonical_bytes_required");
  return value;
}
export function artifactReader(folder, remember = () => {}) {
  return (ref, { json = true, maximum = 64 * 1024, canonical = true } = {}) => {
    keys(ref, "artifact sha256");
    requireThat(safePath(ref.artifact) && sha(ref.sha256), "artifact_reference_invalid");
    const file = path.join(folder, ref.artifact), s = lstatSync(file);
    requireThat(realpathSync(file) === file && s.isFile() && !s.isSymbolicLink() && s.nlink === 1 && !(s.mode & 0o022) && s.size <= maximum, "artifact_unsafe");
    const bytes = readFileSync(file);
    requireThat(digest(bytes) === ref.sha256 && bytes.length === s.size, "artifact_changed");
    remember(file, bytes);
    if (!json) return bytes;
    if (canonical) return parseImprovementJSON(bytes, maximum);
    try { return JSON.parse(bytes.toString("utf8")); } catch { fail("original_json_invalid"); }
  };
}
const targetFields = "repository origin pull_request branch base head tree prior_family_id prior_number prior_attempt_id prior_receipt_fingerprint";
function target(p) { return Object.fromEntries(targetFields.split(" ").map(k => [k, k === "repository" ? "hynk-studio/augnes" : k === "origin" ? "https://github.com/hynk-studio/augnes.git" : p[k]])); }
function validTarget(t) {
  keys(t, targetFields);
  requireThat(t.repository === "hynk-studio/augnes" && t.origin === "https://github.com/hynk-studio/augnes.git" && id(t.pull_request) &&
    typeof t.branch === "string" && /^[A-Za-z0-9_./-]{1,200}$/u.test(t.branch) && !t.branch.split("/").includes("..") &&
    [t.base,t.head,t.tree].every(gitId) && [t.prior_family_id,t.prior_receipt_fingerprint].every(sha) && [1,2].includes(t.prior_number) &&
    typeof t.prior_attempt_id === "string" && /^[A-Za-z0-9_-]{1,200}$/u.test(t.prior_attempt_id), "target_invalid");
}
export function validateImprovementProof(p, { authorizationRequired = true } = {}) {
  keys(p, "schema kind branch base head tree pull_request prior_family_id prior_number prior_attempt_id prior_receipt_fingerprint prior_receipt_path campaign review authorization");
  requireThat(isImprovement(p), "kind_invalid"); validTarget(target(p));
  requireThat(p.prior_receipt_path === `.augnes-local-verification/receipts/${p.prior_attempt_id}.json`, "receipt_path_invalid");
  for (const ref of [p.campaign,p.review]) { keys(ref,"artifact sha256"); requireThat(safePath(ref.artifact) && sha(ref.sha256),"artifact_reference_invalid"); }
  if (p.authorization === null && !authorizationRequired) return;
  keys(p.authorization,"acceptance_review_id acceptance_review_sha256 grant_comment_id grant_comment_sha256");
  requireThat(id(p.authorization.acceptance_review_id) && id(p.authorization.grant_comment_id) &&
    p.authorization.acceptance_review_id !== p.authorization.grant_comment_id &&
    sha(p.authorization.acceptance_review_sha256) && sha(p.authorization.grant_comment_sha256), "authorization_invalid");
}
function manifest(read, ref, allowEmpty = false) {
  const entries = read(ref, { maximum: 2 * 1024 * 1024 });
  requireThat(Array.isArray(entries) && (allowEmpty || entries.length > 0) && entries.length <= 65536, "manifest_invalid");
  let last = "";
  for (const e of entries) {
    keys(e,"path sha256 bytes");
    requireThat(manifestPath(e.path) && e.path > last && sha(e.sha256) && count(e.bytes), "manifest_invalid"); last = e.path;
  }
  return entries;
}
function childResult(r) {
  keys(r, "exit_code signal timed_out cancelled cleanup_completed exit_observed streams_closed remaining_owned_processes termination_reason duration_ms");
  requireThat(r.exit_code === 0 && r.signal === null && r.timed_out === false && r.cancelled === false && r.cleanup_completed === true &&
    r.exit_observed === true && r.streams_closed === true && r.remaining_owned_processes === 0 && r.termination_reason === "natural_exit" && count(r.duration_ms), "natural_pass_required");
}
function assertInventory(items) {
  requireThat(Array.isArray(items) && items.length > 0 && items.length <= 200, "coverage_invalid");
  let previous = "";
  for (const item of items) {
    keys(item, "id category expectation");
    requireThat(text(item.id) && item.id > previous && ["positive","refusal","write","no_write","isolation","fresh_public","fresh_standalone","fresh_process","history_boundary"].includes(item.category) && text(item.expectation), "coverage_invalid"); previous = item.id;
  }
  for (const category of ["positive","refusal","write","no_write","isolation","fresh_public","fresh_standalone","fresh_process","history_boundary"])
    requireThat(items.some(x => x.category === category), "coverage_missing_category");
}

// Only literal, named repository-owned rootNode registrations are supported.
// No eval, guessed timeout, label substring or proof-provided command is used.
export function readImprovementOwnerRegistration(source, ownerId) {
  const ts=createRequire(import.meta.url)("typescript"), ast=ts.createSourceFile("suite.mjs",source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  requireThat(ast.parseDiagnostics.length===0,"registration_parse_invalid");
  let suites,launcher;const locate=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==="suites")suites=node.initializer;if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==="rootNode")launcher=node.initializer;ts.forEachChild(node,locate);};locate(ast);
  requireThat(suites&&ts.isObjectLiteralExpression(suites),"registration_inventory_missing");
  requireThat(launcher&&ts.isArrowFunction(launcher),"registration_launcher_missing");
  const matches=[];
  for(const suite of suites.properties){if(!ts.isPropertyAssignment(suite)||!ts.isArrayLiteralExpression(suite.initializer))continue;
    for(const entry of suite.initializer.elements){if(!ts.isObjectLiteralExpression(entry))continue;
      const ids=entry.properties.filter(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast)==="id");
      if(ids.length!==1||!ts.isStringLiteral(ids[0].initializer)||ids[0].initializer.text!==ownerId)continue;
      const props=new Map(),spreads=[];
      for(const prop of entry.properties){if(ts.isSpreadAssignment(prop)){spreads.push(prop.expression);continue;}
        requireThat(ts.isPropertyAssignment(prop)&&ts.isIdentifier(prop.name)&&!props.has(prop.name.text),"registration_ambiguous");props.set(prop.name.text,prop.initializer);}
      const timeout=props.get("timeoutMs"),label=props.get("label"),natural=props.get("requireNaturalExit");
      requireThat(timeout&&ts.isNumericLiteral(timeout)&&label&&ts.isStringLiteral(label)&&natural?.kind===ts.SyntaxKind.TrueKeyword&&spreads.length===1,"registration_nonliteral");
      const call=spreads[0];requireThat(ts.isCallExpression(call)&&call.expression.getText(ast)==="rootNode"&&call.arguments.length>0&&call.arguments.every(ts.isStringLiteral),"registration_command_invalid");
      matches.push({id:ownerId,suite:suite.name.getText(ast).replace(/^['"]|['"]$/gu,""),label:label.text,command:["node","--import","tsx",...call.arguments.map(a=>a.text)],bound_ms:Number(timeout.text),require_natural_exit:true,launcher_sha256:digest(launcher.getText(ast))});
    }
  }
  requireThat(matches.length===1&&id(matches[0].bound_ms),"registration_owner_missing");return matches[0];
}

export function readImprovementEvidence(file, p, repositoryRoot, { remember, authorizationRequired = true } = {}) {
  validateImprovementProof(p, { authorizationRequired });
  const read = artifactReader(path.dirname(file), remember), c = read(p.campaign), r = read(p.review);
  keys(c,"target originals source runtime driver corpus observations coverage work claims");
  keys(c.target,"identity checkout_fingerprint planner"); validTarget(c.target.identity);
  requireThat(equal(c.target.identity,target(p)) && sha(c.target.checkout_fingerprint), "campaign_target_mismatch");
  const planner = read(c.target.planner);
  keys(planner,"base head selected_plan phases owners");
  requireThat(planner.base === p.base && planner.head === p.head && planner.selected_plan === "full-canonical" &&
    sortedUnique(planner.owners) && Array.isArray(planner.phases) && planner.phases.length === 16 && new Set(planner.phases).size === 16, "planner_invalid");
  keys(c.originals,"attempt completion receipt stock logs historical_index receiving_review failed_owner cause consumed_authority");
  const prior = read(c.originals.attempt,{canonical:false}), completion = read(c.originals.completion,{canonical:false});
  const receipt = read(c.originals.receipt,{canonical:false,maximum:512*1024});
  // Keep the complete original npm/validator stream; never substitute a JSON
  // projection. The existing stock owner emits exactly one decision JSON line.
  const stockLines=read(c.originals.stock,{json:false}).toString("utf8").split("\n").filter(line=>line.startsWith("{"));
  requireThat(stockLines.length===1,"stock_original_invalid");
  let stock;try{stock=JSON.parse(stockLines[0]);}catch{fail("stock_original_invalid");}
  const withoutIntegrity = {...receipt}; delete withoutIntegrity.integrity;
  requireThat(prior.source_correction?.schema === IMPROVEMENT_SCHEMA && prior.source_correction.kind === "source_revision" && !hasImprovementMarker(prior) &&
    prior.family_id === p.prior_family_id && prior.number === p.prior_number && prior.attempt_id === p.prior_attempt_id &&
    completion.attempt_id === prior.attempt_id && completion.disposition === "product_failure" && completion.cleanup_complete === true && utc(completion.finished_at) &&
    completion.receipt_fingerprint === p.prior_receipt_fingerprint && receipt.integrity?.content_fingerprint === p.prior_receipt_fingerprint &&
    digest(withoutIntegrity) === p.prior_receipt_fingerprint && receipt.run?.id === prior.attempt_id && receipt.repository?.head_sha === prior.head && receipt.repository?.tree_sha === prior.tree &&
    receipt.outcome?.disposition === "product_failure" && receipt.cleanup?.completed === true && stock.valid_deciding_evidence === false && stock.content_fingerprint === p.prior_receipt_fingerprint && Array.isArray(stock.issues) && stock.issues.length > 0 &&
    c.originals.cause === "UNKNOWN" && text(c.originals.consumed_authority), "predecessor_invalid");
  requireThat(Array.isArray(c.originals.logs) && c.originals.logs.length > 0, "original_logs_missing");
  const originalLogs=c.originals.logs.map(ref=>read(ref,{json:false,maximum:2*1024*1024}));
  const historical = read(c.originals.historical_index);
  const receiving = read(c.originals.receiving_review,{canonical:false});
  keys(historical,"original_index receiving_review_sha256 observations adverse");
  const minimum=read(historical.original_index,{canonical:false,maximum:2*1024*1024});
  requireThat(Array.isArray(historical.observations) && historical.observations.length > 0 && typeof receiving.body==="string" && receiving.body.length>0 && Buffer.byteLength(receiving.body)<=64*1024 &&
    historical.receiving_review_sha256===c.originals.receiving_review.sha256 && Array.isArray(minimum.observations) && minimum.observations.length>0,"historical_inventory_invalid");
  const historyIds=new Set();
  for(const row of historical.observations){keys(row,"id role original adverse");requireThat(text(row.id)&&!historyIds.has(row.id)&&
      ["supporting_original","recovered_derivative","refused_start","authoring_failure"].includes(row.role)&&typeof row.adverse==="boolean","historical_row_invalid");historyIds.add(row.id);
    read(row.original,{json:false,maximum:2*1024*1024});}
  requireThat(minimum.observations.every(row=>text(row.name)&&historyIds.has(row.name)) && new Set(minimum.observations.map(row=>row.name)).size===minimum.observations.length &&
    equal(historical.adverse,historical.observations.filter(row=>row.adverse).map(row=>row.id).sort()),"minimum_history_omitted");
  keys(c.source,"predecessor_head predecessor_tree delta_sha256 changed_paths production partitions integration");
  const s = c.source;
  requireThat(s.predecessor_head === prior.head && s.predecessor_tree === prior.tree && prior.head !== p.head && prior.tree !== p.tree && sha(s.delta_sha256) && sortedUnique(s.changed_paths,manifestPath), "source_invalid");
  keys(s.partitions,"production focused contract integration");
  const partitionPaths = Object.values(s.partitions);
  requireThat(partitionPaths.every(xs => Array.isArray(xs) && (xs.length === 0 || sortedUnique(xs,manifestPath))) &&
    equal(partitionPaths.flat().sort(),s.changed_paths), "delta_partition_invalid");
  requireThat(Array.isArray(s.production) && s.production.length > 0 && equal(s.production.map(x=>x.path),s.partitions.production),"production_missing");
  const git = args => execFileSync("git",["--no-replace-objects",...args],{cwd:repositoryRoot,timeout:10000,maxBuffer:16*1024*1024,stdio:["ignore","pipe","pipe"]});
  const sourceReader=createCanonicalRevisionReader(repositoryRoot);
  git(["merge-base","--is-ancestor",prior.head,p.head]); git(["merge-base","--is-ancestor",p.base,p.head]);
  requireThat(git(["rev-parse",`${p.head}^{tree}`]).toString().trim() === p.tree &&
    digest(git(["diff","--binary","--no-ext-diff","--no-textconv",prior.head,p.head,"--"])) === s.delta_sha256 &&
    equal(git(["diff","--name-only",prior.head,p.head,"--"]).toString().trim().split("\n").sort(),s.changed_paths), "source_delta_changed");
  for (const module of s.production) {
    keys(module,"path before_blob after_blob before_sha256 after_sha256");
    requireThat(safePath(module.path) && ordinaryV2SourceModule({kind:"source_revision",source_module:module.path}) &&
      gitId(module.before_blob) && gitId(module.after_blob) && sha(module.before_sha256) && sha(module.after_sha256) && module.before_sha256 !== module.after_sha256, "production_path_invalid");
    for (const side of ["before","after"]) {
      const head = side === "before" ? prior.head : p.head;
      requireThat(git(["rev-parse",`${head}:${module.path}`]).toString().trim() === module[`${side}_blob`] && digest(git(["show",`${head}:${module.path}`])) === module[`${side}_sha256`],"module_changed");
    }
  }
  if (s.integration !== null) {
    keys(s.integration,"previous_base accepted_base delta_sha256 changed_paths");
    requireThat(s.integration.previous_base === receipt.repository.base_sha && s.integration.accepted_base === p.base &&
      digest(git(["diff","--binary","--no-ext-diff","--no-textconv",s.integration.previous_base,p.base,"--"])) === s.integration.delta_sha256 &&
      equal(git(["diff","--name-only",s.integration.previous_base,p.base,"--"]).toString().trim().split("\n").sort(),s.integration.changed_paths),"integration_changed");
  } else requireThat(s.partitions.integration.length === 0 && p.base === receipt.repository.base_sha,"integration_missing");
  keys(c.runtime,"node_version inputs dependencies dependency_observation locks environment compiler");
  const runtime = read(c.runtime.inputs);
  requireThat(c.runtime.node_version === CANONICAL_NODE_VERSION && validCanonicalRuntimeInputs(runtime), "runtime_invalid");
  const dependencies=manifest(read,c.runtime.dependencies),locks=manifest(read,c.runtime.locks),compiler=manifest(read,c.runtime.compiler);
  const dependencyObservation=preparedDependencyIdentity(read(c.runtime.dependency_observation));
  requireThat(dependencyObservation.phase_id==="dependencies-root" && dependencyObservation.sources.every(source=>locks.some(row=>row.path===source.name&&row.sha256===source.sha256&&row.bytes===source.bytes)),"dependency_source_unbound");
  requireThat(dependencies.every(row=>row.path.startsWith("node_modules/")) && compiler.every(row=>dependencies.some(entry=>equal(entry,row))),"compiler_dependency_unbound");
  for(const row of locks){
    requireThat(/(?:^|\/)package(?:-lock)?\.json$/u.test(row.path),"lock_path_invalid");
    const bytes=git(["show",`${p.head}:${row.path}`]);requireThat(bytes.length===row.bytes&&digest(bytes)===row.sha256,"lock_source_changed");
  }
  const environment = read(c.runtime.environment);
  requireThat(environment && typeof environment === "object" && !Array.isArray(environment) && Object.keys(environment).every(k=>/^[A-Z][A-Z0-9_]*$/u.test(k) && !/TOKEN|SECRET|KEY|AUTH/u.test(k) && typeof environment[k]==="string"),"environment_invalid");
  keys(c.driver,"executable manifest plan");
  const driver = manifest(read,c.driver.manifest), driverBytes = read(c.driver.executable,{json:false});
  for (const entry of driver) requireThat(read({artifact:entry.path,sha256:entry.sha256},{json:false,maximum:2*1024*1024}).length===entry.bytes,"driver_helper_changed");
  requireThat(driver.some(x=>x.path===c.driver.executable.artifact && x.sha256 === digest(driverBytes) && x.bytes===driverBytes.length),"driver_unbound");
  const plan = read(c.driver.plan);
  keys(plan,"frozen_at implementation_actor command bound_ms owners assertions metric normalization source_before source_after runtime_sha256 driver_sha256 corpus_sha256 capture");
  requireThat(utc(plan.frozen_at) && Date.parse(plan.frozen_at) > Date.parse(completion.finished_at) && text(plan.implementation_actor) &&
    Array.isArray(plan.command) && plan.command.length > 0 && plan.command.every(text) && id(plan.bound_ms) && plan.bound_ms <= 120000 &&
    plan.source_before === prior.head && plan.source_after === p.head && plan.runtime_sha256 === digest(c.runtime) && plan.driver_sha256 === c.driver.manifest.sha256 &&
    plan.corpus_sha256 === digest(c.corpus), "collection_plan_invalid");
  keys(c.corpus,"manifest seed initial_database cases");
  const corpus=manifest(read,c.corpus.manifest);
  for(const entry of corpus) requireThat(read({artifact:entry.path,sha256:entry.sha256},{json:false,maximum:2*1024*1024}).length===entry.bytes,"corpus_input_changed");
  for(const ref of [c.corpus.seed,c.corpus.initial_database]) {
    const bytes=read(ref,{json:false,maximum:2*1024*1024});
    requireThat(corpus.some(row=>row.path===ref.artifact&&row.sha256===ref.sha256&&row.bytes===bytes.length),"corpus_input_unbound");
  }
  requireThat(sortedUnique(c.corpus.cases),"corpus_invalid");
  keys(plan.capture,"input_cases fresh_reader file_owners");
  keys(plan.capture.fresh_reader,"command bound_ms cases");
  requireThat(sortedUnique(plan.capture.input_cases) && sortedUnique(plan.capture.fresh_reader.cases) &&
    plan.capture.fresh_reader.cases.every(id=>plan.capture.input_cases.includes(id)) &&
    Array.isArray(plan.capture.fresh_reader.command) && plan.capture.fresh_reader.command.length>0 && plan.capture.fresh_reader.command.every(text) &&
    id(plan.capture.fresh_reader.bound_ms) && plan.capture.fresh_reader.bound_ms<=15000,"capture_plan_invalid");
  keys(c.coverage,"assertions owners equivalence"); assertInventory(c.coverage.assertions);
  requireThat(equal(plan.assertions,c.coverage.assertions) && equal(plan.owners,c.coverage.owners) && equal(plan.normalization,c.coverage.equivalence),"collection_plan_drift");
  requireThat(Array.isArray(c.coverage.equivalence) && c.coverage.equivalence.every(x => ["temporary_root","port","process_id","generated_id","generated_timestamp"].includes(x)) &&
    new Set(c.coverage.equivalence).size === c.coverage.equivalence.length,"normalization_invalid");
  requireThat(Array.isArray(c.coverage.owners) && c.coverage.owners.length > 0,"owners_missing");
  for (const o of c.coverage.owners) {
    keys(o,"id command bound_ms assertions registration");
    requireThat(text(o.id) && Array.isArray(o.command) && o.command.every(text) && id(o.bound_ms) && o.bound_ms <= plan.bound_ms &&
      sortedUnique(o.assertions) && o.assertions.every(x=>c.coverage.assertions.some(a=>a.id===x)),"owner_invalid");
    const registration=read(o.registration);keys(registration,"source owner assertions");
    const registrationBytes=read(registration.source,{json:false,maximum:2*1024*1024});
    requireThat(digest(registrationBytes)===digest(git(["show",`${p.head}:scripts/run-canonical-test-suite.mjs`])),"registration_source_changed");
    const actual=readImprovementOwnerRegistration(registrationBytes.toString("utf8"),o.id);
    requireThat(equal(actual,registration.owner)&&equal(o.command,actual.command)&&o.bound_ms===actual.bound_ms&&equal(o.assertions,registration.assertions),"registration_contract_changed");
    if(o.id===c.originals.failed_owner){
      const previous=readImprovementOwnerRegistration(git(["show",`${prior.head}:scripts/run-canonical-test-suite.mjs`]).toString("utf8"),o.id);
      requireThat(equal(previous,actual)&&originalLogs.some(bytes=>bytes.toString("utf8").split("\n").some(line=>
        line.startsWith(`[canonical:${previous.suite}] child_result label=${JSON.stringify(previous.label)} `)&&!line.includes(" exit_code=0 "))),"failed_owner_changed");
    }
  }
  requireThat(c.coverage.owners.some(o=>o.id===c.originals.failed_owner)&&new Set(c.coverage.owners.map(o=>o.id)).size===c.coverage.owners.length &&
    c.coverage.assertions.every(a=>c.coverage.owners.some(o=>o.assertions.includes(a.id))),"whole_owner_coverage_incomplete");
  keys(c.observations,"historical qualifying adverse");
  requireThat(Array.isArray(c.observations.historical) && equal(c.observations.historical,historical.observations) &&
    Array.isArray(c.observations.adverse) && equal(c.observations.adverse,historical.adverse),"known_observations_omitted");
  requireThat(c.observations.qualifying?.length === 2,"pair_required");
  const witnesses = c.observations.qualifying.map(ref=>read(ref,{maximum:2*1024*1024}));
  for (const [index,w] of witnesses.entries()) {
    keys(w,"role source_head source_manifest overlay_manifest runtime_sha256 driver_sha256 corpus_sha256 command bound_ms started_at finished_at start_identity end_identity stdout stderr result assertions owners trace captures");
    requireThat(w.role === ["before","after"][index] && w.source_head === [prior.head,p.head][index] &&
      w.runtime_sha256 === digest(c.runtime) && w.driver_sha256 === c.driver.manifest.sha256 && w.corpus_sha256 === digest(c.corpus) &&
      equal(w.command,plan.command) && w.bound_ms === plan.bound_ms && utc(w.started_at) && utc(w.finished_at) &&
      Date.parse(w.started_at) > Date.parse(index ? witnesses[0].finished_at : plan.frozen_at) && Date.parse(w.finished_at) >= Date.parse(w.started_at) &&
      equal(w.start_identity,w.end_identity),"witness_binding_invalid");
    keys(w.start_identity,"source_manifest_sha256 overlay_manifest_sha256 runtime_sha256 driver_sha256 corpus_sha256 dependency_manifest_sha256 environment_sha256");
    requireThat(equal(w.start_identity,{source_manifest_sha256:w.source_manifest.sha256,overlay_manifest_sha256:w.overlay_manifest.sha256,runtime_sha256:w.runtime_sha256,
      driver_sha256:w.driver_sha256,corpus_sha256:w.corpus_sha256,dependency_manifest_sha256:c.runtime.dependencies.sha256,environment_sha256:c.runtime.environment.sha256}),"execution_identity_unbound");
    const modules = manifest(read,w.source_manifest), overlay=manifest(read,w.overlay_manifest,true);
    requireThat(overlay.every(row=>modules.some(x=>equal(row,x)) && !s.production.some(m=>m.path===row.path)),"overlay_invalid");
    const requests=modules.map(row=>({revision:overlay.some(x=>x.path===row.path)?p.head:w.source_head,file:row.path}));
    for(let offset=0;offset<requests.length;offset+=64){
      sourceReader.prefetch(requests.slice(offset,offset+64));
      for(let i=offset;i<Math.min(offset+64,modules.length);i++){
      const row=modules[i];
      const treeEntry=sourceReader.tree(requests[i].revision).get(row.path);
      requireThat(treeEntry?.type==="blob" && ["100644","100755"].includes(treeEntry.mode) && treeEntry.size===row.bytes &&
        digest(sourceReader.read(requests[i].revision,row.path))===row.sha256,"execution_source_changed");
      }
    }
    requireThat(s.production.every(m=>modules.some(row=>row.path===m.path && row.sha256===m[index?"after_sha256":"before_sha256"])),"witness_source_invalid");
    read(w.stdout,{json:false,maximum:2*1024*1024}); read(w.stderr,{json:false,maximum:2*1024*1024});
    childResult(w.result); requireThat(w.result.duration_ms <= w.bound_ms,"witness_bound_exceeded");
    requireThat(Array.isArray(w.assertions) && equal(w.assertions.map(a=>a.id),c.coverage.assertions.map(a=>a.id)),"witness_coverage_missing");
    for (const a of w.assertions) { keys(a,"id outcome output_sha256 observation"); requireThat(a.outcome === "pass" && sha(a.output_sha256) && a.observation.sha256===a.output_sha256,"assertion_failed"); read(a.observation,{json:false,maximum:2*1024*1024}); }
    requireThat(Array.isArray(w.owners) && equal(w.owners.map(o=>o.id),c.coverage.owners.map(o=>o.id)),"whole_owner_missing");
    for (const [i,o] of w.owners.entries()) {
      keys(o,"id command bound_ms assertions result stdout stderr"); const expected = c.coverage.owners[i];
      requireThat(equal(o.command,expected.command) && o.bound_ms === expected.bound_ms && equal(o.assertions,expected.assertions),"owner_coverage_changed");
      childResult(o.result); requireThat(o.result.duration_ms <= o.bound_ms,"registered_bound_exceeded");
      read(o.stdout,{json:false,maximum:2*1024*1024}); read(o.stderr,{json:false,maximum:2*1024*1024});
    }
    const captures=read(w.captures,{maximum:2*1024*1024});
    keys(captures,"role corpus_sha256 plan_sha256 inputs observations fresh_reader files");
    requireThat(captures.role===w.role&&captures.corpus_sha256===w.corpus_sha256&&captures.plan_sha256===c.driver.plan.sha256&&
      Array.isArray(captures.inputs)&&equal(captures.inputs.map(v=>v.id),plan.capture.input_cases)&&
      Array.isArray(captures.observations)&&equal(captures.observations.map(v=>v.id),plan.capture.fresh_reader.cases),"concrete_capture_missing");
    const captured=new Map();
    for(const entry of captures.inputs){
      keys(entry,"id observation");const input=read(entry.observation,{maximum:2*1024*1024});
      keys(input,"case_id captured_at database uncompressed_sha256 uncompressed_bytes config schema counts selector");
      requireThat(entry.id.endsWith(":"+input.case_id)&&utc(input.captured_at)&&Date.parse(input.captured_at)>=Date.parse(w.started_at)&&Date.parse(input.captured_at)<=Date.parse(w.finished_at)&&
        sha(input.uncompressed_sha256)&&id(input.uncompressed_bytes)&&input.uncompressed_bytes<=16*1024*1024&&Array.isArray(input.schema)&&input.schema.length>0&&Array.isArray(input.counts),"concrete_input_invalid");
      const bounded=ref=>{keys(ref,"artifact sha256 bytes");requireThat(count(ref.bytes)&&safePath(ref.artifact),"concrete_input_invalid");const bytes=read({artifact:path.posix.join(path.posix.dirname(entry.observation.artifact),ref.artifact),sha256:ref.sha256},{json:false,maximum:2*1024*1024});requireThat(bytes.length===ref.bytes,"concrete_input_changed");return bytes;};
      const database=gunzipSync(bounded(input.database),{maxOutputLength:16*1024*1024});
      requireThat(database.length===input.uncompressed_bytes&&digest(database)===input.uncompressed_sha256,"concrete_database_changed");
      parseImprovementJSON(bounded(input.config));captured.set(entry.id,input);
    }
    requireThat(Array.isArray(plan.capture.file_owners)&&equal(plan.capture.file_owners.map(v=>v.owner_id),c.coverage.owners.map(v=>v.id))&&
      Array.isArray(captures.files)&&equal(captures.files.map(v=>v.owner_id),plan.capture.file_owners.map(v=>v.owner_id)),"file_capture_invalid");
    for(const group of captures.files){keys(group,"owner_id observations");requireThat(c.coverage.owners.some(o=>o.id===group.owner_id),"file_capture_owner_invalid");
      const required=plan.capture.file_owners.find(v=>v.owner_id===group.owner_id);keys(required,"owner_id required");
      requireThat(Array.isArray(required.required)&&required.required.length>0&&new Set(required.required.map(v=>v.path)).size===required.required.length,"file_capture_requirements_invalid");
      const observed=new Map();
      const lines=read(group.observations,{json:false,maximum:2*1024*1024}).toString("utf8").trim().split("\n");requireThat(lines.length<=4096,"file_capture_unbounded");
      for(const line of lines){let row;try{row=JSON.parse(line);}catch{fail("file_capture_invalid");}keys(row,"operation path artifact sha256 bytes at");
        requireThat(["read","write"].includes(row.operation)&&safePath(row.path)&&safePath(row.artifact)&&count(row.bytes)&&utc(row.at)&&Date.parse(row.at)>=Date.parse(w.started_at)&&Date.parse(row.at)<=Date.parse(w.finished_at),"file_capture_invalid");
        const bytes=read({artifact:path.posix.join(path.posix.dirname(group.observations.artifact),row.artifact),sha256:row.sha256},{json:false,maximum:2*1024*1024});requireThat(bytes.length===row.bytes,"file_capture_changed");
        const key=row.path+":"+row.operation;if(!observed.has(key))observed.set(key,new Set());observed.get(key).add(row.sha256);
      }
      for(const item of required.required){keys(item,"path operations versions");requireThat(safePath(item.path)&&sortedUnique(item.operations,v=>["read","write"].includes(v))&&id(item.versions)&&item.versions<=200,"file_capture_requirements_invalid");
        const sets=item.operations.map(op=>[...(observed.get(item.path+":"+op)??[])].sort());requireThat(sets.every(values=>values.length===item.versions&&equal(values,sets[0])),"file_capture_required_input_missing");}
    }
    keys(captures.fresh_reader,"command bound_ms result stdout stderr inputs_sha256");
    const fresh=captures.fresh_reader;
    requireThat(equal(fresh.command,plan.capture.fresh_reader.command)&&fresh.bound_ms===plan.capture.fresh_reader.bound_ms&&fresh.inputs_sha256===digest(captures.inputs),"fresh_reader_binding_invalid");
    childResult(fresh.result);requireThat(fresh.result.duration_ms<=fresh.bound_ms,"fresh_reader_bound_exceeded");
    const output=read(fresh.stdout,{json:false,maximum:2*1024*1024}).toString("utf8").trim().split("\n").map(line=>{try{return JSON.parse(line);}catch{fail("fresh_reader_output_invalid");}});
    read(fresh.stderr,{json:false});
    requireThat(output.length===captures.observations.length,"fresh_reader_coverage_missing");
    for(const [i,entry]of captures.observations.entries()){
      keys(entry,"id observation");const observed=read(entry.observation,{maximum:2*1024*1024}),input=captured.get(entry.id),actual=output[i];
      keys(observed,"outcome standalone result");keys(actual,"fresh_process_read input_sha256 config_sha256 outcome standalone writes result");
      requireThat(["available","empty","refused"].includes(observed.outcome)&&["available","refused","not_applicable"].includes(observed.standalone)&&
        actual.fresh_process_read===input.case_id&&actual.input_sha256===input.uncompressed_sha256&&actual.config_sha256===input.config.sha256&&actual.writes===0&&
        equal(observed,{outcome:actual.outcome,standalone:actual.standalone,result:actual.result}),"fresh_reader_behavior_changed");
    }
  }
  requireThat(equal(...witnesses.map(w=>w.assertions.map(({id,outcome,output_sha256})=>({id,outcome,output_sha256})))),"behavior_changed");
  keys(c.work,"operation call_sites cases before_count after_count rationale");
  requireThat(text(c.work.operation) && text(c.work.rationale) && sortedUnique(c.work.call_sites) && sortedUnique(c.work.cases) &&
    c.work.cases.every(x=>c.corpus.cases.includes(x)) && count(c.work.before_count) && count(c.work.after_count) && c.work.before_count > c.work.after_count &&
    equal(plan.metric,{operation:c.work.operation,call_sites:c.work.call_sites,cases:c.work.cases}),"work_reduction_missing");
  for (const [i,w] of witnesses.entries()) {
    const trace = read(w.trace,{maximum:2*1024*1024});
    requireThat(Array.isArray(trace) && trace.length > 0 && trace.length <= 65536,"trace_invalid");
    let total = 0; const cases = new Set();
    for (const row of trace) {
      keys(row,"case_id operation call_site sequence");
      requireThat(c.work.cases.includes(row.case_id) && row.operation === c.work.operation && c.work.call_sites.includes(row.call_site) && row.sequence === total + 1,"trace_invalid");
      total++; cases.add(row.case_id);
    }
    requireThat(equal([...cases].sort(),c.work.cases) && total === c.work[i?"after_count":"before_count"],"trace_arithmetic_invalid");
  }
  requireThat(equal(c.claims,IMPROVEMENT_CLAIMS),"claims_invalid");
  keys(r,"target delta_sha256 campaign_sha256 report reviewer implementation_actor no_write reviewed_at source_review disposition judgments gaps");
  requireThat(equal(r.target,target(p)) && r.delta_sha256 === s.delta_sha256 && r.campaign_sha256 === digest(c) && text(r.reviewer) &&
    r.implementation_actor === plan.implementation_actor && r.reviewer !== r.implementation_actor && r.no_write === true && utc(r.reviewed_at) &&
    Date.parse(r.reviewed_at) > Date.parse(witnesses[1].finished_at) && r.source_review === "complete" && r.disposition === "accept", "independent_review_invalid");
  keys(r.judgments,"connected_material_production_delta complete_delta preserved_behavior real_work_reduction complete_known_campaign limited_claims no_weakened_contract");
  requireThat(Object.values(r.judgments).every(v=>v===true) && Array.isArray(r.gaps),"review_judgment_missing");
  for(const gap of r.gaps){keys(gap,"id kind detail");requireThat(text(gap.id)&&gap.kind==="nonblocking_limitation"&&text(gap.detail),"mandatory_gap_unresolved");}
  const report = read(r.report,{json:false});
  requireThat(report.includes(digest(c)) && report.includes(p.head) && report.includes(s.delta_sha256),"review_report_unbound");
  return { campaign:c,review:r,prior,completion,receipt,stock,witnesses,runtime,planner,read };
}

function operative(body, first, fields) {
  requireThat(typeof body === "string" && body.startsWith(first + "\n") && Buffer.byteLength(body) <= 64*1024,"operative_authority_required");
  const payload = parseImprovementJSON(body.slice(first.length + 1)); keys(payload,fields); return payload;
}
export function improvementAuthorityObservation(record, role) {
  return {id:record.id,author:record.user?.login,author_id:record.user?.id,body_sha256:digest(record.body),
    timestamp:role === "prospective_grant" ? record.updated_at : record.submitted_at,role,commit_id:role === "prospective_grant" ? null : record.commit_id};
}
const authorityCommon = "target campaign_sha256 review_sha256";
export function validateImprovementAuthorityRecords(p,e,records,{current = true} = {}) {
  keys(records,"acceptance grant acceptance_permission grant_permission pull_request");
  const {acceptance:a,grant:g} = records;
  const av = operative(a.body,IMPROVEMENT_ACCEPT,authorityCommon + " independent_report_sha256 scope claims");
  const gv = operative(g.body,IMPROVEMENT_GRANT,authorityCommon + " acceptance_sha256 planner_sha256 maximum_invocations recovery unchanged_retry stop_on_failure_or_interruption fresh_validation independent_result_audit owned_cleanup timing_risk_decision");
  for (const v of [av,gv]) requireThat(equal(v.target,target(p)) && v.campaign_sha256 === digest(e.campaign) && v.review_sha256 === digest(e.review),"authority_binding_invalid");
  const observations = {accepted_improvement:improvementAuthorityObservation(a,"accepted_improvement"),prospective_grant:improvementAuthorityObservation(g,"prospective_grant")};
  requireThat(av.independent_report_sha256 === e.review.report.sha256 && av.scope === IMPROVEMENT_KIND && equal(av.claims,IMPROVEMENT_CLAIMS) &&
    gv.acceptance_sha256 === digest(observations.accepted_improvement) && gv.planner_sha256 === digest(e.planner) &&
    gv.maximum_invocations === 1 && gv.recovery === 0 && gv.unchanged_retry === 0 && gv.stop_on_failure_or_interruption === true &&
    gv.fresh_validation === true && gv.independent_result_audit === true && gv.owned_cleanup === true && gv.timing_risk_decision === "proceed_once_under_unchanged_bounds", "authority_scope_invalid");
  const baseURL = "https://api.github.com/repos/hynk-studio/augnes";
  requireThat(a.id === p.authorization.acceptance_review_id && g.id === p.authorization.grant_comment_id && a.id !== g.id &&
    a.commit_id === p.head && a.pull_request_url === `${baseURL}/pulls/${p.pull_request}` && ["COMMENTED","APPROVED"].includes(a.state) &&
    g.issue_url === `${baseURL}/issues/${p.pull_request}` && g.created_at === g.updated_at &&
    [a,g].every(x=>x.user?.type === "User" && id(x.user.id) && /^[A-Za-z0-9-]{1,39}$/u.test(x.user.login) && ["OWNER","MEMBER","COLLABORATOR"].includes(x.author_association)) &&
    utc(a.submitted_at) && utc(g.created_at) && Date.parse(a.submitted_at) > Date.parse(e.review.reviewed_at) &&
    Date.parse(g.created_at) > Date.parse(a.submitted_at) && Date.parse(g.created_at) > Date.parse(e.completion.finished_at) &&
    digest(observations.accepted_improvement) === p.authorization.acceptance_review_sha256 && digest(observations.prospective_grant) === p.authorization.grant_comment_sha256,"authenticated_record_invalid");
  for (const [record,permission] of [[a,records.acceptance_permission],[g,records.grant_permission]])
    requireThat(permission.user?.login === record.user.login && permission.user?.id === record.user.id && ["admin","maintain"].includes(permission.permission), current ? "current_authorization_refused" : "historical_permission_invalid");
  const pr = records.pull_request;
  requireThat(pr.number === p.pull_request && pr.base?.repo?.full_name === "hynk-studio/augnes" && pr.head?.repo?.full_name === "hynk-studio/augnes", "authority_repository_invalid");
  requireThat(pr.state === "open" && pr.draft === true && pr.auto_merge === null && pr.head.sha === p.head && pr.head.ref === p.branch && pr.base.sha === p.base && pr.base.ref === "main", current ? "current_applicability_refused" : "historical_target_invalid");
  return observations;
}

// Read-only preparation cannot construct or return an admission capability.
export function prepareImprovementEvidence(file,p,root,options = {}) {
  const e = readImprovementEvidence(file,p,root,{...options,authorizationRequired:false});
  return {eligible_evidence:true,authorization_present:p.authorization !== null,admission:false,reserved:false,
    campaign_sha256:digest(e.campaign),review_sha256:digest(e.review),missing:p.authorization === null ? ["authenticated_candidate_acceptance","prospective_one_shot_grant"] : []};
}
export async function authorizeImprovement(p,e,transport = createGitHubObserverAuthorizationTransport(p.pull_request)) {
  const value = await observeImprovementAuthority(p,e,transport);
  authorizations.set(value,{proof:digest(p),records:digest(value.records),observations:digest(value.observations)}); return value;
}
export async function observeImprovementAuthority(p,e,transport = createGitHubObserverAuthorizationTransport(p.pull_request)) {
  validateImprovementProof(Object.fromEntries(Object.entries(p).filter(([k])=>k!=="local_relative_path")));
  const acceptance = await transport.review(p.authorization.acceptance_review_id), grant = await transport.grant(p.authorization.grant_comment_id);
  const received = {acceptance,grant,acceptance_permission:await transport.permission(acceptance.user?.login),grant_permission:await transport.permission(grant.user?.login),pull_request:await transport.pullRequest()};
  const observations = validateImprovementAuthorityRecords(p,e,received);
  // Store only the exact authenticated fields used by this case. Full PR bodies,
  // avatars, unrelated descriptions and API metadata are not receipt authority.
  const user=u=>({login:u.login,id:u.id,type:u.type});
  const record=(v,role)=>({id:v.id,user:user(v.user),body:v.body,author_association:v.author_association,
    ...(role==="review"?{state:v.state,commit_id:v.commit_id,pull_request_url:v.pull_request_url,submitted_at:v.submitted_at}:{issue_url:v.issue_url,created_at:v.created_at,updated_at:v.updated_at})});
  const permission=v=>({permission:v.permission,user:user(v.user)});
  const branch=v=>({sha:v.sha,ref:v.ref,repo:{full_name:v.repo.full_name}});
  const pr=received.pull_request;
  const records={acceptance:record(acceptance,"review"),grant:record(grant,"grant"),acceptance_permission:permission(received.acceptance_permission),grant_permission:permission(received.grant_permission),
    pull_request:{number:pr.number,state:pr.state,draft:pr.draft,auto_merge:pr.auto_merge,base:branch(pr.base),head:branch(pr.head)}};
  requireThat(Buffer.byteLength(JSON.stringify(records))<=16*1024,"authority_projection_unbounded");
  const value = Object.freeze({observations,records});
  return value;
}
export function assertImprovementAuthorization(p,e,capability) {
  const state = authorizations.get(capability);
  requireThat(state && state.proof === digest(p) && state.records === digest(capability.records) && state.observations === digest(capability.observations),"authenticated_capability_required");
  requireThat(equal(validateImprovementAuthorityRecords(p,e,capability.records),capability.observations),"authority_changed");
}
export function validImprovementAttempt(a) {
  try {
    requireThat(isImprovement(a?.source_correction) && a.number === 1 && a.budget?.initial === 1 && a.budget?.recovery === 0 &&
      a.recovery === null && a.prior_attempt_id === null && a.prior_receipt_fingerprint === null && !Object.hasOwn(a,"revision_authority"),"attempt_invalid");
    keys(a.improvement_authority,"observations records");
    for (const role of ["accepted_improvement","prospective_grant"]) {
      const o=a.improvement_authority.observations[role];keys(o,"id author author_id body_sha256 timestamp role commit_id");
      requireThat(o.role===role && id(o.id) && id(o.author_id) && sha(o.body_sha256) && utc(o.timestamp) && text(o.author) && (role==="prospective_grant"?o.commit_id===null:o.commit_id===a.head),"attempt_authority_invalid");
    }
    return true;
  } catch { return false; }
}
