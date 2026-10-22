// A local declarative input and preview, not a Core record or an execution owner.
import { canonical, digest } from './external-response-rules.mjs';

export const OPERATING_PROFILE_VERSION = 'OperatingProfile.v0.1';
export const OPERATING_PREVIEW_VERSION = 'OperatingProfilePreview.v0.1';
export const OPERATING_PROFILE_LIMITS = Object.freeze({
  input_bytes: 65536, output_bytes: 196608, depth: 12, values: 4096,
  collection_items: 32, string_characters: 4096,
});

export class OperatingProfileError extends Error {
  constructor(code, at = '$') { super(code); this.code = code; this.at = at; }
}
const fail = (code, at) => { throw new OperatingProfileError(code, at); };
const limits = OPERATING_PROFILE_LIMITS;

// JSON.parse alone discards duplicate keys, including escaped-key aliases.
// Keep this parser local to this input contract; existing reader parsers are unchanged.
export function parseOperatingProfileJson(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text, 'utf8') > limits.input_bytes)
    fail('profile_input_limit');
  let position = 0, count = 0;
  const whitespace = () => { while (/[\x20\t\r\n]/u.test(text[position] ?? '') && position < text.length) position++; };
  const syntax = () => fail('profile_invalid_json');
  function string() {
    const start = position++;
    let escaped = false;
    while (position < text.length) {
      const char = text[position++];
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '"') {
        let result;
        try { result = JSON.parse(text.slice(start, position)); } catch { syntax(); }
        if (!result.isWellFormed()) fail('profile_invalid_unicode');
        if ([...result].length > limits.string_characters) fail('profile_string_limit');
        return result;
      }
    }
    syntax();
  }
  function value(depth) {
    if (depth > limits.depth || ++count > limits.values) fail('profile_structure_limit');
    whitespace();
    const char = text[position];
    if (char === '"') return string();
    if (char === '{' || char === '[') {
      const object = char === '{', close = object ? '}' : ']';
      const result = object ? Object.create(null) : [];
      position++; whitespace();
      if (text[position] === close) { position++; return result; }
      let members = 0;
      while (position < text.length) {
        if (++members > limits.collection_items) fail('profile_collection_limit');
        whitespace();
        if (object) {
          if (text[position] !== '"') syntax();
          const key = string();
          if (Object.hasOwn(result, key)) fail('profile_duplicate_key');
          whitespace();
          if (text[position++] !== ':') syntax();
          result[key] = value(depth + 1);
        } else result.push(value(depth + 1));
        whitespace();
        const delimiter = text[position++];
        if (delimiter === close) return result;
        if (delimiter !== ',') syntax();
      }
      syntax();
    }
    for (const [word, result] of [['true', true], ['false', false], ['null', null]]) {
      if (text.startsWith(word, position)) { position += word.length; return result; }
    }
    const number = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/u.exec(text.slice(position));
    if (!number) syntax();
    position += number[0].length;
    // This contract only has integer budgets. Reject fractional/exponent
    // spellings before Number can silently round them to a valid integer.
    if (!/^-?(?:0|[1-9][0-9]*)$/u.test(number[0]) || number[0] === '-0')
      fail('profile_integer_lexeme');
    const result = Number(number[0]);
    if (!Number.isSafeInteger(result)) fail('profile_invalid_number');
    return result;
  }
  const result = value(0);
  whitespace();
  if (position !== text.length) syntax();
  return result;
}

function fields(value, names, at) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      names.some(name => !Object.hasOwn(value, name)) ||
      Object.keys(value).some(name => !names.includes(name))) fail('profile_fields', at);
}
function text(value, at, max = limits.string_characters, allowEmpty = false) {
  if (typeof value !== 'string' || !value.isWellFormed() || (!allowEmpty && !value.trim()) ||
      [...value].length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value))
    fail('profile_text', at);
}
function optionalText(value, at, max = 256) { if (value !== null) text(value, at, max); }
function list(value, at, check, min = 0, max = limits.collection_items) {
  if (!Array.isArray(value) || value.length < min || value.length > max) fail('profile_collection', at);
  value.forEach((item, index) => check(item, `${at}[${index}]`));
}
const texts = (value, at, min = 0, max = limits.collection_items, width = 1000) =>
  list(value, at, (item, itemAt) => text(item, itemAt, width), min, max);
function id(value, at) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9_-]{0,63}$/u.test(value)) fail('profile_local_id', at);
}
function ids(value, at) {
  list(value, at, id);
  if (new Set(value).size !== value.length) fail('profile_duplicate_reference', at);
}
function enumeration(value, choices, at) {
  if (!choices.includes(value)) fail('profile_unsupported_value', at);
}
function integer(value, at, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail('profile_integer', at);
}
function time(value, at) {
  if (value !== null && (typeof value !== 'string' || !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString() !== value)) fail('profile_time', at);
}
function namedList(value, at, check, min = 0) {
  const seen = new Set();
  list(value, at, (item, itemAt) => {
    check(item, itemAt); id(item.id, `${itemAt}.id`);
    if (seen.has(item.id)) fail('profile_duplicate_id', itemAt);
    seen.add(item.id);
  }, min);
  return seen;
}

// The only public input is bounded JSON text: no mutable object with getters,
// prototype behavior, file loaders or authority-bearing runtime objects.
export function validateOperatingProfile(textInput) {
  const p = parseOperatingProfileJson(textInput);
  fields(p, ['version', 'name', 'mode', 'work', 'scope', 'accountability', 'roles',
    'inputs', 'explanations', 'steps', 'arrangements', 'separation',
    'requested_permissions', 'budget', 'reconsider_when', 'revision_basis'], '$');
  if (p.version !== OPERATING_PROFILE_VERSION) fail('profile_unsupported_version', '$.version');
  if (p.mode !== 'observe_recommend') fail('profile_mode_unavailable', '$.mode');
  text(p.name, '$.name', 200);
  fields(p.work, ['goal', 'success_criteria', 'non_goals'], '$.work');
  // Same bounded work-definition shape as initial project work. This does not
  // invoke its persistence normalizer (which sorts lists) or admit a work record.
  text(p.work.goal, '$.work.goal', 2000);
  texts(p.work.success_criteria, '$.work.success_criteria', 1, 12, 500);
  texts(p.work.non_goals, '$.work.non_goals', 0, 12, 500);
  if (Buffer.byteLength(canonical(p.work)) > 12000) fail('profile_work_limit', '$.work');
  fields(p.scope, ['environment', 'targets', 'conditions'], '$.scope');
  text(p.scope.environment, '$.scope.environment', 1000);
  texts(p.scope.targets, '$.scope.targets', 1); texts(p.scope.conditions, '$.scope.conditions');
  fields(p.accountability, ['owner_role', 'sponsor_role'], '$.accountability');
  const roles = namedList(p.roles, '$.roles', (r, at) => {
    fields(r, ['id', 'responsibility', 'executor', 'principal', 'counterpart_assumptions'], at);
    text(r.responsibility, `${at}.responsibility`, 1000);
    optionalText(r.executor, `${at}.executor`); optionalText(r.principal, `${at}.principal`);
    texts(r.counterpart_assumptions, `${at}.counterpart_assumptions`);
  }, 1);
  const inputs = namedList(p.inputs, '$.inputs', (input, at) => {
    fields(input, ['id', 'purpose', 'required', 'availability', 'source', 'content', 'limitations'], at);
    text(input.purpose, `${at}.purpose`, 1000);
    if (typeof input.required !== 'boolean') fail('profile_boolean', `${at}.required`);
    enumeration(input.availability, ['observed', 'checked_absent', 'channel_unavailable',
      'conflicting', 'not_supplied'], `${at}.availability`);
    fields(input.source, ['identity', 'revision', 'observed_at', 'event_time'], `${at}.source`);
    optionalText(input.source.identity, `${at}.source.identity`, 1000);
    optionalText(input.source.revision, `${at}.source.revision`);
    time(input.source.observed_at, `${at}.source.observed_at`);
    time(input.source.event_time, `${at}.source.event_time`);
    if (['observed', 'conflicting'].includes(input.availability)) {
      text(input.content, `${at}.content`, limits.string_characters, input.availability === 'observed');
    } else if (input.content !== null) fail('profile_missing_input_content', `${at}.content`);
    text(input.limitations, `${at}.limitations`, 1000);
  });
  namedList(p.explanations, '$.explanations', (explanation, at) => {
    fields(explanation, ['id', 'description', 'basis_inputs', 'uncertainties'], at);
    text(explanation.description, `${at}.description`, 2000);
    ids(explanation.basis_inputs, `${at}.basis_inputs`);
    texts(explanation.uncertainties, `${at}.uncertainties`);
  });
  const steps = namedList(p.steps, '$.steps', (step, at) => {
    fields(step, ['id', 'kind', 'purpose', 'role', 'requires_inputs', 'depends_on',
      'returns', 'check_role', 'use_role'], at);
    enumeration(step.kind, ['observe', 'recommend'], `${at}.kind`);
    text(step.purpose, `${at}.purpose`, 1000); id(step.role, `${at}.role`);
    ids(step.requires_inputs, `${at}.requires_inputs`); ids(step.depends_on, `${at}.depends_on`);
    text(step.returns, `${at}.returns`, 1000);
    for (const key of ['check_role', 'use_role']) if (step[key] !== null) id(step[key], `${at}.${key}`);
  }, 1);
  namedList(p.arrangements, '$.arrangements', (arrangement, at) => {
    fields(arrangement, ['id', 'kind', 'description', 'roles', 'assumptions'], at);
    enumeration(arrangement.kind, ['direct', 'existing_asset', 'delegated', 'non_use'], `${at}.kind`);
    text(arrangement.description, `${at}.description`, 1000); ids(arrangement.roles, `${at}.roles`);
    texts(arrangement.assumptions, `${at}.assumptions`);
  }, 1);
  list(p.separation, '$.separation', (requirement, at) => {
    fields(requirement, ['roles', 'reason'], at); ids(requirement.roles, `${at}.roles`);
    if (requirement.roles.length < 2) fail('profile_separation_roles', at);
    text(requirement.reason, `${at}.reason`, 1000);
  });
  namedList(p.requested_permissions, '$.requested_permissions', (permission, at) => {
    fields(permission, ['id', 'description', 'for_steps'], at);
    text(permission.description, `${at}.description`, 1000); ids(permission.for_steps, `${at}.for_steps`);
  });
  fields(p.budget, ['max_steps', 'max_observations', 'max_rounds', 'max_minutes'], '$.budget');
  integer(p.budget.max_steps, '$.budget.max_steps', p.steps.length, 128);
  integer(p.budget.max_observations, '$.budget.max_observations', p.steps.filter(s => s.kind === 'observe').length, 128);
  integer(p.budget.max_rounds, '$.budget.max_rounds', 1, 8);
  integer(p.budget.max_minutes, '$.budget.max_minutes', 1, 1440);
  texts(p.reconsider_when, '$.reconsider_when', 1);
  fields(p.revision_basis, ['previous_fingerprint', 'reason'], '$.revision_basis');
  if (p.revision_basis.previous_fingerprint !== null &&
      (typeof p.revision_basis.previous_fingerprint !== 'string' ||
       !/^sha256:[a-f0-9]{64}$/u.test(p.revision_basis.previous_fingerprint)))
    fail('profile_fingerprint', '$.revision_basis.previous_fingerprint');
  text(p.revision_basis.reason, '$.revision_basis.reason', 1000);

  const reference = (value, set, at) => { if (value !== null && !set.has(value)) fail('profile_unresolved_reference', at); };
  for (const key of ['owner_role', 'sponsor_role']) reference(p.accountability[key], roles, `$.accountability.${key}`);
  p.explanations.forEach((e, i) => e.basis_inputs.forEach(r => reference(r, inputs, `$.explanations[${i}].basis_inputs`)));
  p.steps.forEach((s, i) => {
    for (const key of ['role', 'check_role', 'use_role']) reference(s[key], roles, `$.steps[${i}].${key}`);
    s.requires_inputs.forEach(r => reference(r, inputs, `$.steps[${i}].requires_inputs`));
    s.depends_on.forEach(r => reference(r, steps, `$.steps[${i}].depends_on`));
  });
  p.arrangements.forEach((a, i) => a.roles.forEach(r => reference(r, roles, `$.arrangements[${i}].roles`)));
  p.separation.forEach((s, i) => s.roles.forEach(r => reference(r, roles, `$.separation[${i}].roles`)));
  p.requested_permissions.forEach((r, i) => r.for_steps.forEach(s => reference(s, steps, `$.requested_permissions[${i}].for_steps`)));
  dependencyOrder(p.steps);
  return p;
}

function dependencyOrder(steps) {
  const ordered = [], active = new Set(), visited = new Set(), byId = new Map(steps.map(s => [s.id, s]));
  function visit(step) {
    if (active.has(step.id)) fail('profile_prerequisite_cycle', '$.steps');
    if (visited.has(step.id)) return;
    active.add(step.id); step.depends_on.forEach(id => visit(byId.get(id))); active.delete(step.id);
    visited.add(step.id); ordered.push(step.id);
  }
  steps.forEach(visit); return ordered;
}

export function previewOperatingProfile(textInput) {
  const p = validateOperatingProfile(textInput);
  const roles = new Map(p.roles.map(r => [r.id, r])), inputs = new Map(p.inputs.map(i => [i.id, i]));
  const result = {
    version: OPERATING_PREVIEW_VERSION,
    status: 'previewed',
    fingerprint: digest(p),
    fingerprint_scope: 'Entire validated input; object keys sorted, array order and exact strings retained. No authorship or trust claim.',
    execution_ready: false,
    authority: { grants_issued: false, work_started: false, accepted_state_changed: false },
    interpretation: 'All observations, conditions, bindings and explanations below are authored declarations. No source was resolved, applicability inferred or capability verified.',
    profile: p,
    review: {
      prerequisite_order: dependencyOrder(p.steps),
      repeated_rounds: { declared_maximum: p.budget.max_rounds,
        meaning: 'Bounded reconsideration may repeat observation/recommendation; prerequisite cycles are invalid. This preview executes no round or recovery.' },
      inputs: p.inputs.map(input => ({ id: input.id, declared_availability: input.availability,
        content_supplied: input.content !== null,
        missing_provenance: Object.entries(input.source).filter(([, value]) => value === null).map(([key]) => key),
        requirement_satisfied: 'not_checked', actual_availability: 'not_checked', current_applicability: 'not_checked' })),
      roles: p.roles.map(role => ({ id: role.id, executor_binding: role.executor === null ? 'unbound' : 'declared_unverified',
        principal_binding: role.principal === null ? 'unbound' : 'declared_unverified' })),
      accountability: Object.fromEntries(Object.entries(p.accountability).map(([key, value]) => [key, value === null ? 'unbound' : 'declared_unverified'])),
      steps: p.steps.map(step => ({ id: step.id,
        unsupplied_inputs: step.requires_inputs.filter(id => ['not_supplied', 'channel_unavailable'].includes(inputs.get(id).availability)),
        declared_absent_inputs: step.requires_inputs.filter(id => inputs.get(id).availability === 'checked_absent'),
        conflicting_inputs: step.requires_inputs.filter(id => inputs.get(id).availability === 'conflicting'),
        input_requirements_satisfied: 'not_checked',
        return_role: step.role, check_role: step.check_role, use_role: step.use_role,
        unresolved_responsibilities: ['check_role', 'use_role'].filter(key => step[key] === null) })),
      separation: p.separation.map(requirement => {
        const principals = requirement.roles.map(id => roles.get(id).principal);
        return { roles: requirement.roles, status: principals.includes(null) ? 'unresolved' :
          new Set(principals).size !== principals.length ? 'same_declared_principal' : 'declared_distinct_unverified',
        independent_verification_established: false };
      }),
      permissions: p.requested_permissions.map(permission => ({ id: permission.id, status: 'not_granted_or_checked' })),
      arrangement_selection: 'not_selected',
    },
  };
  boundedOutput(canonical(result));
  return result;
}

function boundedOutput(output) {
  if (Buffer.byteLength(output, 'utf8') > limits.output_bytes) fail('profile_output_limit');
  return output;
}

export function renderOperatingProfilePreview(preview, format = 'text') {
  if (format === 'json') return boundedOutput(`${canonical(preview)}\n`);
  if (format !== 'text') fail('profile_output_format');
  // Render every value in the same preview, retaining null/empty and list order.
  // JSON quoting makes authored terminal/control-like text visible as data.
  const p = preview.profile, quote = value => JSON.stringify(value);
  const lines = ['Operating profile preview — read only', '',
    `Purpose: ${quote(p.work.goal)}`,
    `Scope: ${quote(p.scope.environment)}`,
    'All evidence and bindings are supplied declarations; actual availability and applicability are not checked.',
    'No work starts, no permission is granted, and this is not execution readiness.', '',
    'Supplied and missing inputs:'];
  p.inputs.forEach(input => lines.push(`  ${input.id}: ${input.availability}; ${input.content === null ? 'no content supplied' : 'content supplied'}; ${input.required ? 'required' : 'optional'}`));
  if (!p.inputs.length) lines.push('  No inputs declared.');
  lines.push('', 'Proposed next observations (not executed):');
  const observations = p.steps.filter(step => step.kind === 'observe');
  observations.forEach(step => lines.push(`  ${step.id}: ${quote(step.purpose)}`));
  if (!observations.length) lines.push('  No observation step declared.');
  lines.push('', 'Explanations supplied by the author:');
  p.explanations.forEach(explanation => lines.push(`  ${explanation.id}: ${quote(explanation.description)}`));
  if (!p.explanations.length) lines.push('  None declared.');
  lines.push('', 'Executor and principal bindings:');
  p.roles.forEach(role => lines.push(`  ${role.id}: executor ${role.executor === null ? 'UNBOUND' : quote(role.executor) + ' (unverified)'}; principal ${role.principal === null ? 'UNBOUND' : quote(role.principal) + ' (unverified)'}`));
  preview.review.separation.forEach(requirement => lines.push(`  Separate principals for ${requirement.roles.join(', ')}: ${requirement.status}; independence not established.`));
  lines.push('', 'Requested permissions (all ungranted and unchecked):');
  p.requested_permissions.forEach(permission => lines.push(`  ${permission.id}: ${quote(permission.description)}`));
  if (!p.requested_permissions.length) lines.push('  No permission request declared.');
  lines.push('', 'Return / check / use responsibilities:');
  p.steps.forEach(step => lines.push(`  ${step.id}: return ${step.role}; check ${step.check_role ?? 'UNBOUND'}; use ${step.use_role ?? 'UNBOUND'}. Return: ${quote(step.returns)}`));
  lines.push('', 'Arrangement alternatives (none selected):');
  p.arrangements.forEach(arrangement => lines.push(`  ${arrangement.id} (${arrangement.kind}): ${quote(arrangement.description)}`));
  lines.push('', 'Complete preserved input and review:');
  function render(value, label, depth) {
    const prefix = '  '.repeat(depth);
    if (value === null || typeof value !== 'object') { lines.push(`${prefix}${label}: ${JSON.stringify(value)}`); return; }
    const entries = Array.isArray(value) ? value.map((item, index) => [`[${index}]`, item]) : Object.entries(value);
    if (!entries.length) { lines.push(`${prefix}${label}: ${Array.isArray(value) ? '[]' : '{}'}`); return; }
    lines.push(`${prefix}${label}:`);
    entries.forEach(([key, item]) => render(item, key, depth + 1));
  }
  Object.entries(preview).forEach(([key, value]) => render(value, key, 0));
  return boundedOutput(`${lines.join('\n')}\n`);
}
