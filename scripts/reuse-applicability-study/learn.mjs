import { equalFields } from './model.mjs';
import { sha } from '../hypothesis-cache-study/io.mjs';

// A small, explicit hypothesis language: conjunctions of equal observed fields.
// Search is generic; field names, outcome labels and selected rules come from experience.
export function fit(records) {
  if (!records.some(x => x.valid) || !records.some(x => !x.valid))
    throw new Error('contrasting_outcomes_required');
  const rows = records.map(row => ({ ...row, features: equalFields(row.prior, row.current) }));
  const names = Object.keys(rows[0].features).filter(name => rows.filter(x => x.valid).every(x => x.features[name]));
  if (names.length > 24) throw new Error('feature_budget_exceeded');
  const negatives = rows.filter(x => !x.valid);
  // Exact minimum cover over this bounded feature language, deterministic lexical ties.
  function search(start, chosen, remaining) {
    if (!remaining.length) return chosen;
    if (!start.length) return null;
    let best = null;
    for (let i = 0; i < start.length; i++) {
      const name = start[i], uncovered = remaining.filter(x => x.features[name]);
      if (uncovered.length === remaining.length) continue;
      const answer = search(start.slice(i + 1), [...chosen, name], uncovered);
      if (answer && (!best || answer.length < best.length)) best = answer;
    }
    return best;
  }
  const equal = search(names.sort(), [], negatives);
  if (!equal) throw new Error('unexpressible_experience');
  return { schema: 'reuse-equalities.v1', equal };
}

export function selectContrasts(records) {
  const positives = records.filter(x => x.valid), negatives = records.filter(x => !x.valid);
  const pairs = negatives.map(negative => {
    const a = equalFields(negative.prior, negative.current);
    const ranked = positives.map(positive => ({ positive, distance: Object.entries(a).filter(([key, value]) =>
      value !== equalFields(positive.prior, positive.current)[key]).length }));
    ranked.sort((a, b) => a.distance - b.distance || a.positive.id.localeCompare(b.positive.id));
    if (!ranked.length) throw new Error('positive_witness_missing');
    return { positive: ranked[0].positive.id, negative: negative.id, distance: ranked[0].distance };
  });
  const ids = new Set(pairs.flatMap(x => [x.positive, x.negative]));
  return { pairs, selected: records.filter(x => ids.has(x.id)) };
}

export function acquire(records, strategy = 'contrastive') {
  const selection = strategy === 'contrastive' ? selectContrasts(records) :
    { pairs: [], selected: records };
  let selected = [...selection.selected], program = fit(selected), repairs = [];
  // Replay every permitted record. A discarded positive may refute an overstrict guard.
  // Add only the first execution-grounded counterexample at a time; finite dataset bound.
  for (let i = 0; i <= records.length; i++) {
    const failures = records.filter(row => program.equal.every(key => equalFields(row.prior, row.current)[key]) !== row.valid);
    if (!failures.length) return { program, selected_ids: selected.map(x => x.id), pairs: selection.pairs, repairs,
      evidence_sha256: sha(records) };
    const counterexample = failures[0];
    if (selected.some(x => x.id === counterexample.id)) throw new Error('unexpressible_counterexample');
    const before = program;
    selected.push(counterexample); program = fit(selected);
    repairs.push({ evidence_id: counterexample.id, before, after: program });
  }
  throw new Error('repair_budget_exhausted');
}
