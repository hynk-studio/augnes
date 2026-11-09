import {orchestrationTokens, validProjectExperienceConnection} from "./project-experience-connection.mjs";
import { parseBrowserUseLine } from "./local-canonical-browser-identity.mjs";
import { digest } from "./local-canonical-inputs.mjs";
import { inspectClassifiedEvidence } from "./local-canonical-receipt.mjs";
import { PROJECT_EXPERIENCE_SERIAL, PROJECT_EXPERIENCE_COMMITMENT, PROJECT_EXPERIENCE_ENVELOPE_MS, projectExperienceElapsed } from "./project-experience-serial-budget.mjs";
import { CANONICAL_NODE_VERSION } from "./local-canonical-environment.mjs";
import { settledIsolatedResources } from "./local-canonical-browser-revision.mjs";

export const SERIAL_AGGREGATE_ROUTE = "serial-aggregate-budget-v1";
export const isSerialAggregateRevision = p => p?.schema === "augnes.local-canonical-source-correction.v7" &&
  p.kind === "reviewed_revision" && p.commission?.route === SERIAL_AGGREGATE_ROUTE;
const equal = (a,b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const refuse = code => { throw Object.assign(new Error(code), { code }); };
export const SERIAL_HISTORY = "Original timeout, false stock, interrupted child UNKNOWN and all earlier lineage remain unchanged.";
export const serialReviewTarget = p => digest({ schema:p.schema, branch:p.branch, pull_request:p.pull_request,
  base:p.base, head:p.head, tree:p.tree, accepted:{head:p.accepted.head,tree:p.accepted.tree,base:p.accepted.base},
  prior:[p.prior_family_id,p.prior_number,p.prior_attempt_id,p.prior_receipt_fingerprint],
  originals:p.originals, inputs:p.inputs, source:p.source, focused:p.focused, incident:p.incident, commission:p.commission });

export function serialAuthorityScope(p, review, grant) {
  const first = body => body.split(/\r?\n/u).find(line => line.trim());
  const target = serialReviewTarget(p);
  return first(review.body) === "Source review decision: ACCEPT / RETAIN for prospective qualification." &&
    first(grant.body) === "Authorize one prospective serial-aggregate-budget-v1 invocation." &&
    [review.body,grant.body].every(body => [SERIAL_AGGREGATE_ROUTE,target,p.head,p.tree,p.base,
      p.prior_receipt_fingerprint,p.commission.envelope_sha256,p.inputs.inventory_sha256,SERIAL_HISTORY].every(s => body.includes(s))) &&
    [p.branch,p.prior_family_id,p.prior_attempt_id,String(p.prior_number),
      `https://github.com/hynk-studio/augnes/pull/${p.pull_request}#pullrequestreview-${p.accepted.review.id}`,
      "Exactly one admitted deciding invocation total; no ordinal two, recovery or unchanged-target retry.",
      "Reservation/interruption consumes the single grant.","Separate fresh-process stock and independent decision remain required."
    ].every(s => grant.body.includes(s)) && grant.created_at === grant.updated_at;
}

// Parse the closed pre-envelope declaration, never execute historical source.
// Unsupported registration forms need their own reviewed reader, not a guess.
export function legacySerialChildren(source) {
  const names = ["projectExperienceStep","projectClientBrowserStep","webPlanningBrowserStep","webPlanningDraftSafetyStep"];
  const tokens = orchestrationTokens(source);
  const registration = orchestrationTokens('"e2e-project-experience": [' + names.map(name => '{ ...' + name + ' }').join(', ') + ']');
  if (tokens.filter((_,i) => registration.every((v,j) => tokens[i+j] === v)).length !== 1)
    refuse("serial_original_inventory_unreadable");
  const children = [];
  for (const [index,name] of names.entries()) {
    let body = source.match(new RegExp(`const ${name} = \{([\\s\\S]*?)\\n\};`))?.[1];
    if (!body) refuse("serial_original_inventory_unreadable");
    const take = (pattern, convert = v => v) => {
      const match = body.match(pattern); if (!match) refuse("serial_original_inventory_unreadable");
      body = body.replace(match[0], ""); return convert(match[1]);
    };
    let child;
    if (index === 3) {
      take(/(\.\.\.webPlanningBrowserStep),/u);
      child = { ...children[2] };
    } else {
      child = { group:take(/group:\s*("[^"]+"),/u,JSON.parse),
        requirements:take(/requirements:\s*(\[[\s\S]*?\]),/u,v => JSON.parse(v.replace(/,\s*\]/gu,"]"))),
        requireNaturalExit:take(/requireNaturalExit:\s*(true),/u,v => v === "true") };
    }
    Object.assign(child, {
      id:take(/id:\s*("[^"]+"),/u,JSON.parse), label:take(/label:\s*("[^"]+"),/u,JSON.parse),
      args:["--import","tsx",...take(/\.\.\.rootNode\(("[^"]+"(?:,\s*"[^"]+")*)\),/u,v => JSON.parse('['+v+']'))],
      timeoutMs:take(/timeoutMs:\s*([0-9_]+),/u,v => Number(v.replaceAll("_",""))),
    });
    if (body.trim() || !equal(child,PROJECT_EXPERIENCE_SERIAL.children[index])) refuse("serial_original_inventory_changed");
    children.push(child);
  }
  return children;
}

export function verifySerialAggregateRemedy(p, prior, focused, {parse,bytes,git}) {
  const control=focused.serial_control, driver="scripts/test-project-experience-serial-budget.mjs";
  const owners=["scripts/project-experience-serial-budget.mjs","scripts/canonical-child-runner.mjs",
    "scripts/run-canonical-test-suite.mjs","scripts/run-local-canonical-verification.mjs",
    "scripts/canonical-test-environment.mjs","scripts/test-harness-process-lifecycle.mjs","scripts/project-experience-connection.mjs"];
  if (!control || control.driver?.path!==driver || control.driver.sha256!==digest(git(["show",`${p.head}:${driver}`])) ||
      !equal(control.owners,owners.map(name=>({path:name,sha256:digest(git(["show",`${p.head}:${name}`]))})))) refuse("serial_control_source_invalid");
  const witness=parse(control.record), output=JSON.parse(bytes(control.stdout).toString());
  if (witness.command!=="node "+driver || witness.tested_source_head!==p.head || witness.node_version!==CANONICAL_NODE_VERSION ||
      witness.runtime_inputs_sha256!==p.inputs.identity_sha256 || witness.driver_sha256!==control.driver.sha256 ||
      !equal(witness.owners,control.owners) || !focused.commands.some(c=>equal(c.record,control.record) && equal(c.stdout,control.stdout)) ||
      output.contract!=="serial-aggregate-budget-controls.v1" || output.synthetic_only!==true || output.cleanup_complete!==true ||
      !equal(output.old,{result:"interrupted",cleanup_complete:true,completed_children:2,interrupted_child:"web-planning-browser",still_eligible:true}) ||
      !equal(output.controls,["child_failure","child_timeout","forced_cleanup","incomplete_cleanup","coordinator_excess","inventory_mismatch","no_child_borrowing","settlement_excess","parent_ipc","caller_connection"]) ||
      output.corrected?.commitment!==PROJECT_EXPERIENCE_COMMITMENT || output.corrected.complete!==true || output.corrected.completed_children!==PROJECT_EXPERIENCE_SERIAL.children.length ||
      output.corrected.failure_code!==null || output.corrected.execution_ms?.length!==PROJECT_EXPERIENCE_SERIAL.children.length || output.corrected.execution_ms.some((n,i)=>!Number.isFinite(n)||n<=0||n>PROJECT_EXPERIENCE_SERIAL.children[i].timeoutMs) ||
      output.corrected.natural_settlement_ms?.length!==PROJECT_EXPERIENCE_SERIAL.children.length || output.corrected.natural_settlement_ms.some(n=>!Number.isFinite(n)||n<0||n>10000) ||
      !Number.isFinite(output.corrected.coordinator_ms) || output.corrected.coordinator_ms<0 || output.corrected.coordinator_ms>30000 ||
      output.corrected.envelope_elapsed_ms!==projectExperienceElapsed(output.corrected))
    refuse("serial_control_behavior_invalid");
  const suite=git(["show",`${p.head}:scripts/run-canonical-test-suite.mjs`]).toString();
  const parent=git(["show",`${p.head}:scripts/run-local-canonical-verification.mjs`]).toString();
  if (!validProjectExperienceConnection(suite,parent))
    refuse("serial_owning_contract_unconnected");
  if (git(["diff","--ignore-all-space","--ignore-blank-lines",prior.head,p.head,"--",owners[2],owners[3]]).length===0)
    refuse("serial_owning_contract_unchanged");
}

// A capped phase file cannot prove absence of a later child result. Require the
// complete original wrapper capture, bound separately to its physical file,
// and recover only this parent's uniquely delimited output. Never change the
// receipt's truncation flag or accept a caller-selected excerpt as completeness.
export function serialIncidentLog(incident, original, capped, bytes) {
  const phase = original.phases.find(v => v.id === "e2e-project-experience");
  if (!phase.log.truncated) {
    if (incident.capture || incident.capture_identity) refuse("serial_capture_unexpected");
    return capped.toString();
  }
  const capture = bytes(incident.capture, 8*1024*1024), text = capture.toString();
  if (phase.log.bytes !== 2*1024*1024 || !Buffer.from(text).equals(capture) ||
      !equal(incident.capture_identity, {path:incident.capture_identity?.path,bytes:capture.length,sha256:digest(capture)}))
    refuse("serial_capture_identity_invalid");
  const prefix = `[canonical:local-${original.evidence.mode}] `;
  const label = 'label="Canonical project experience Browser owner"';
  const lines = text.split(/(?<=\n)/u);
  const unique = value => {
    const matches = lines.flatMap((line,i) => line.startsWith(value) ? [i] : []);
    if (matches.length !== 1) refuse("serial_capture_boundary_invalid");
    return matches[0];
  };
  const start = unique(prefix + "child_start " + label + " ");
  const phaseStart = unique("[local-canonical] phase_start id=e2e-project-experience timeout_ms=480000\n");
  const spawn = unique(prefix + "child_spawn " + label + " ");
  const end = unique(prefix + "child_result " + label + " ");
  if (start !== phaseStart+1 || spawn !== start+1 || end <= spawn ||
      lines[start] !== prefix + "child_start " + label + " timeout_ms=480000\n" ||
      !/^pid=[1-9]\d* wait=process_exit\n$/u.test(lines[spawn].slice((prefix+"child_spawn "+label+" ").length)) ||
      lines[end] !== prefix + "child_result " + label + ` duration_ms=${phase.duration_ms} exit_code=null signal=SIGTERM timed_out=true exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=bounded_timeout\n`)
    refuse("serial_capture_boundary_invalid");
  const receipt = unique(`[local-canonical] receipt=.augnes-local-verification/receipts/${original.run.id}.json fingerprint=${original.integrity.content_fingerprint}\n`);
  const phaseResult = unique(`[local-canonical] phase_result id=e2e-project-experience status=failure duration_ms=${phase.duration_ms}\n`);
  const final = unique("[local-canonical] final result=failure deciding=false duration_ms=");
  if (phaseResult !== end+1 || receipt !== phaseResult+4 || final !== receipt+1 || final !== lines.length-1 ||
      lines[phaseResult+1] !== "[local-canonical] failure phase=e2e-project-experience code=phase_timed_out\n" ||
      lines[phaseResult+2] !== "[local-canonical] cleanup_start\n" ||
      lines[phaseResult+3] !== "[local-canonical] cleanup_result completed=true remaining_owned_processes=0 generated_next_present_after_execution_cleanup=false generated_next_present_after_service_restore=false generated_windows_helper_present=false\n" ||
      lines[final] !== `[local-canonical] final result=failure deciding=false duration_ms=${original.run.duration_ms}\n` ||
      lines.some((line,i) => (i<=spawn || i>=end) && line.startsWith("[canonical:e2e-project-experience] ")) ||
      !equal(text.split("\n").map(parseBrowserUseLine).filter(Boolean),original.phases.flatMap(v=>v.browser_use)))
    refuse("serial_capture_boundary_invalid");
  const phaseLines = [], outer = []; let lastElapsed = 0;
  for (const line of lines.slice(spawn+1,end)) {
    if (!line.startsWith(prefix)) { phaseLines.push(line); continue; }
    const rest = line.slice(prefix.length);
    const elapsed = Number(rest.match(/ elapsed_ms=(\d+) /u)?.[1]);
    if (!Number.isSafeInteger(elapsed) || elapsed < lastElapsed || elapsed > phase.duration_ms) refuse("serial_capture_boundary_invalid");
    lastElapsed = elapsed;
    if (rest.startsWith("child_active "+label+" ") && /^elapsed_ms=\d+ timeout_ms=480000 exit_observed=false stdout_closed=false stderr_closed=false wait=process_exit\n$/u.test(rest.slice(("child_active "+label+" ").length))) continue;
    if (rest.startsWith("child_cleanup_start "+label+" ") && elapsed >= 480000 && /^elapsed_ms=\d+ reason=bounded_timeout exit_observed=false stdout_closed=false stderr_closed=false\n$/u.test(rest.slice(("child_cleanup_start "+label+" ").length))) outer.push("start");
    else if (rest.startsWith("child_cleanup_result "+label+" ") && /^elapsed_ms=\d+ reason=bounded_timeout streams_closed=true remaining_owned_processes=0\n$/u.test(rest.slice(("child_cleanup_result "+label+" ").length))) outer.push("result");
    else refuse("serial_capture_boundary_invalid");
  }
  const log = phaseLines.join("");
  if (!equal(outer,["start","result"]) || Buffer.byteLength(log) <= capped.length || !Buffer.from(log).subarray(0,capped.length).equals(capped))
    refuse("serial_capture_prefix_invalid");
  return log;
}

// Full originals are mandatory here. A sanitized export only carries the
// incident reference and contract commitment; it cannot call this causal proof.
export function readSerialAggregateIncident(p, original, prior, completion, { parse, bytes, git, phases, stock }) {
  const incident = parse(p.incident), plan = parse(incident.original_plan);
  const serial = PROJECT_EXPERIENCE_SERIAL, id = "e2e-project-experience", at = phases.indexOf(id);
  const phase = original.phases?.[at];
  if (!settledIsolatedResources(original) || !["changed","full"].includes(original.evidence?.mode) || original.evidence.selected_plan!=="full-canonical" ||
      original.evidence.deciding!==false || original.verification_context?.kind!=="isolated-worktree" ||
      original.repository.worktree_before!=="clean" || original.repository.worktree_after!=="clean" ||
      original.final?.result!=="failure" || original.final.exit_status!==1 || !equal(original.final.reason_codes,["phase_timed_out","selected_phases_incomplete"]) ||
      original.historical_inputs?.required!==true || prior.attempt_id!==original.run?.id || prior.contract_fingerprint!==original.inputs?.fingerprint ||
      prior.source_correction?.schema !== "augnes.local-canonical-source-correction.v2" || prior.source_correction.kind !== "source_revision" ||
      prior.revision_authority || completion.disposition !== "unclassified_timeout" || completion.infrastructure_code !== null ||
      original.inputs?.first_fault !== null || original.inputs.secondary_faults?.length !== 0 ||
      !equal(original.phases?.map(x => x.id),phases) || incident.contract !== SERIAL_AGGREGATE_ROUTE ||
      incident.predecessor !== p.prior_receipt_fingerprint || incident.interrupted_outcome !== "UNKNOWN" ||
      incident.envelope_sha256 !== p.commission.envelope_sha256 || p.commission.envelope_sha256 !== PROJECT_EXPERIENCE_COMMITMENT ||
      digest(plan) !== original.inputs.binding.phase_inventory || !equal(plan.map(x=>x.id),phases)) refuse("serial_incident_binding_invalid");
  const suitePath = "scripts/run-canonical-test-suite.mjs", parentPath = "scripts/run-local-canonical-verification.mjs";
  const suite = git(["show",`${prior.head}:${suitePath}`]), parent = git(["show",`${prior.head}:${parentPath}`]);
  if (!equal(incident.source, {head:prior.head,tree:prior.tree,suite_sha256:digest(suite),parent_sha256:digest(parent)}) ||
      !equal(legacySerialChildren(suite.toString()),serial.children)) refuse("serial_original_source_invalid");
  const declared = parent.toString().match(/"e2e-project-experience":\s*\{\s*label:\s*"[^"]+",\s*suite:\s*"e2e-project-experience",\s*timeoutMs:\s*([0-9_]+),/u);
  const deadline = Number(declared?.[1]?.replaceAll("_",""));
  if (!Number.isSafeInteger(deadline) || deadline <= 0 || deadline >= PROJECT_EXPERIENCE_ENVELOPE_MS || plan[at].timeoutMs !== deadline ||
      plan[at].display !== phase.command || !equal(plan[at].args,[suitePath,id]) ||
      phase.status !== "failure" || phase.failure_code !== "phase_timed_out" || phase.timed_out !== true ||
      phase.exit_status !== null || phase.spawn_error_code !== null || phase.duration_ms < deadline ||
      phase.cleanup?.termination_reason !== "bounded_timeout" || phase.cleanup.completed !== true ||
      phase.cleanup.remaining_owned_processes !== 0 || !phase.cleanup.exit_observed || !phase.cleanup.streams_closed ||
      ![true,false].includes(phase.log?.truncated)) refuse("serial_parent_interruption_unproven");
  for (let i=0;i<original.phases.length;i++) {
    const v=original.phases[i];
    if (i<at && (v.status!=="pass" || v.exit_status!==0 || v.timed_out!==false || v.failure_code!==null ||
      v.cleanup?.completed!==true || v.cleanup.remaining_owned_processes!==0 || v.cleanup.termination_reason!=="natural_exit" || !v.cleanup.exit_observed || !v.cleanup.streams_closed))
      refuse("serial_other_phase_failure");
    if (i>at && (v.status!=="not_run" || v.failure_code!=="phase_not_run" || [v.started_at,v.finished_at,v.duration_ms,v.exit_status].some(x=>x!==null) ||
      v.timed_out!==false || v.browser_use?.length || Object.hasOwn(v,"environment_fingerprint") ||
      !equal(v.cleanup,{completed:false,remaining_owned_processes:null,termination_reason:null,exit_observed:false,streams_closed:false,listener_residue_count:null}) ||
      !equal(v.log,{relative_path:null,bytes:0,truncated:false}))) refuse("serial_placeholder_invalid");
    if (v.head_sha !== null && v.head_sha !== prior.head || v.base_sha !== null && v.base_sha !== original.repository.base_sha)
      refuse("serial_phase_source_invalid");
  }
  const logBytes = bytes(incident.log, 4*1024*1024);
  if (logBytes.length !== phase.log.bytes || !equal(incident.log_identity,{relative_path:phase.log.relative_path,bytes:phase.log.bytes,sha256:digest(logBytes)}))
    refuse("serial_log_identity_invalid");
  const log = serialIncidentLog(incident, original, logBytes, bytes);
  if (!equal(log.split("\n").map(parseBrowserUseLine).filter(Boolean),phase.browser_use)) refuse("serial_log_browser_disagreement");
  const starts = [...log.matchAll(/^\[canonical:e2e-project-experience\] child_start label=("[^"]+") timeout_ms=(\d+)$/gmu)];
  const results = [...log.matchAll(/^\[canonical:e2e-project-experience\] child_result label=("[^"]+") duration_ms=(\d+) exit_code=0 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit$/gmu)];
  const allResults = [...log.matchAll(/^\[canonical:e2e-project-experience\] child_result /gmu)];
  const interruptedLabel = JSON.stringify(serial.children[2].label);
  if (serial.children.slice(3).some(child => log.split("\n").some(line =>
      line.startsWith("[canonical:e2e-project-experience] ") && line.includes(`label=${JSON.stringify(child.label)} `))))
    refuse("serial_following_child_observed");
  if (log.split("\n").some(line => line.startsWith("[canonical:e2e-project-experience] ") &&
      line.includes(`label=${interruptedLabel} `) && /\b(?:child_exit|child_cleanup_start|child_cleanup_result|child_result)\b/u.test(line)))
    refuse("serial_interrupted_child_already_settling");
  if (starts.length!==3 || results.length!==2 || allResults.length!==2 ||
      starts.some((m,i)=>JSON.parse(m[1])!==serial.children[i].label || Number(m[2])!==serial.children[i].timeoutMs) ||
      results.some((m,i)=>JSON.parse(m[1])!==serial.children[i].label || Number(m[2])>serial.children[i].timeoutMs || m.index<starts[i].index || m.index>starts[i+1].index) ||
      /^\[canonical:e2e-project-experience\].*(?:reason=bounded_timeout|reason=operator_cancelled|term_sent=true)/mu.test(log))
    refuse("serial_child_natural_history_unproven");
  const remaining = deadline - results.reduce((n,m)=>n+Number(m[2]),0);
  if (remaining<=0 || remaining>=serial.children[2].timeoutMs) refuse("serial_child_eligibility_unproven");
  const issues=[];
  inspectClassifiedEvidence(original,issues,{phase:id,consumers:{"project-experience":1,"project-client":2}});
  if (issues.length) refuse("serial_executed_evidence_invalid");
  // Only after proving each actual field above do these known missing records
  // explain the original stock refusal. Other stock errors remain unsupported.
  const consequences=["receipt_classified_outcome_not_passing","receipt_final_result_not_pass","receipt_non_deciding",
    "receipt_phase_environment_binding_invalid","receipt_browser_identity_invalid:"+id,
    ...original.phases.slice(at).map(v=>"phase_not_passing:"+v.id)].sort();
  if (!Array.isArray(stock?.issues) || !equal([...stock.issues].sort(),consequences) || stock.valid_deciding_evidence!==false)
    refuse("serial_stock_unexplained");
  // Useful child code and each individual bound are retained. A timeout alone
  // does not establish a product defect or authorize editing those assertions.
  for (const child of serial.children) if (!git(["show",`${prior.head}:${child.args[2]}`]).equals(git(["show",`${p.head}:${child.args[2]}`])))
    refuse("serial_useful_coverage_changed");
  for (const name of [suitePath,parentPath]) if (!git(["diff","--ignore-all-space","--ignore-blank-lines",prior.head,p.head,"--",name]).length)
    refuse("serial_owning_contract_unchanged");
  return {contract:SERIAL_AGGREGATE_ROUTE,predecessor:p.prior_receipt_fingerprint,source:incident.source,
    phase_inventory:original.inputs.binding.phase_inventory,log_sha256:digest(logBytes),
    ...(incident.capture ? {capture_sha256:incident.capture.sha256,complete_phase_log_sha256:digest(log)} : {}),
    completed_children:2,interrupted_child:serial.children[2].id,interrupted_outcome:"UNKNOWN",
    remaining_upper_bound_ms:remaining,envelope_sha256:PROJECT_EXPERIENCE_COMMITMENT};
}
