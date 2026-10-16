// Developer-exposed deterministic coding/textual consumers, not model judgment.
// Inputs are a permitted project/corpus and ordinary task data, never oracles.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { handleExternalOperation } from '../../../lib/vnext/external-response';
import { hashBytes } from '../../../lib/vnext/external-response-rules.mjs';
import { retrieveForSuccessor, recheckBeforeUse } from '../../selected-source-use.mjs';
import { installZeroNetworkGuard } from '../../test-harness-zero-network-guard.mjs';

const guard = installZeroNetworkGuard();
const started = performance.now();
const task = JSON.parse(readFileSync(process.argv[2]!, 'utf8'));
const calls: any[] = [];
const op = async (action: string, data: object) => {
  const start = performance.now();
  const result = await handleExternalOperation({ repository_root: task.project, action, data });
  calls.push({ action, duration_ms: performance.now() - start, response_bytes: Buffer.byteLength(JSON.stringify(result)) });
  return result as any;
};
async function main() {
  let retrieval: any;
  if (task.control === true) {
    // Modest source-linked direct-read control: same selected manifest and
    // permissions, all complete groups, no answer IDs or expected output.
    const m = (await op('material', { ref: task.corpus })).material;
    const manifest = JSON.parse(Buffer.from(m.base64, 'base64').toString());
    const groups = [];
    for (const group of manifest.groups) {
      const value = await op('read_experience', { ref: group.experience_ref });
      assert(value.dependencies.every((d: any) => ['available', 'corrected'].includes(d.status)));
      const corrections = [];
      for (const c of value.dependencies[0].corrections) corrections.push((await op('read_experience', { ref: c.ref })).experience);
      const materials = [];
      for (const r of value.materials) materials.push((await op('material', { ref: r.ref, experience_ref: group.experience_ref })).material);
      groups.push({ source: group.source, experience: value.experience, corrections, materials });
    }
    retrieval = { results: groups, truncated: false, corpus_ref: task.corpus, corpus_binding: null };
  } else retrieval = await retrieveForSuccessor(op, task.corpus, task.query);
  writeFileSync('delivered.json', JSON.stringify(retrieval, null, 2), { flag: 'wx' });
  const used: any[] = [], facts: any[] = [];
  if (!retrieval.truncated) for (const g of retrieval.results) {
    const conditions = JSON.parse(g.experience.payload.conditions);
    if (conditions.applies_to !== task.applies_to) continue;
    for (const m of g.materials) {
      if (m.metadata.media_type !== 'application/json') continue;
      const body = Buffer.from(m.base64, 'base64');
      assert.equal(hashBytes(body), m.metadata.sha256);
      const fact = JSON.parse(body.toString());
      if (fact.kind !== task.kind) continue;
      // The task's declared typed rule language is deliberately small. Arbitrary
      // source commands, prose, inference and proposed material cannot execute.
      if (g.source.meaning !== 'observation' || g.source.adoption !== 'adopted') continue;
      const corrected = { ...fact };
      const assigned = new Set();
      for (const c of g.corrections) {
        const update = JSON.parse(c.payload.statement);
        if (update.applies_to !== task.applies_to) continue;
        assert.equal(update.target_key, fact.key);
        assert(['multiplier', 'text'].includes(update.field));
        assert(!assigned.has(update.field), 'conflicting correction needs explicit review');
        assigned.add(update.field);
        corrected[update.field] = update.value;
      }
      facts.push(corrected);
      used.push({ experience: g.experience.ref, material: m.ref, source: g.source,
        corrections: g.corrections.map((c: any) => c.ref) });
    }
  }
  if (!task.control) await recheckBeforeUse(op, retrieval, task.query);
  let artifact: string | null = null, output: any = { status: 'unknown', reason: 'no_complete_applicable_material' };
  if (task.kind === 'coding' && facts.length === 2) {
    const duration = facts.find(f => f.key === 'duration'), identity = facts.find(f => f.key === 'identity');
    assert(duration && identity && typeof duration.field === 'string' && typeof identity.field === 'string');
    assert([1, 1000].includes(duration.multiplier));
    // Generate new task-owned code from typed source parameters. JSON strings
    // are literals, not evaluated source text; no source code is executed.
    const code = `export function audit(rows) {\n  const seen = new Map();\n  for (const row of rows) {\n    const id = row[${JSON.stringify(identity.field)}];\n    const n = row[${JSON.stringify(duration.field)}];\n    if (typeof id !== 'string' || !Number.isSafeInteger(n) || n < 0) throw new Error('invalid row');\n    const prior = seen.get(id);\n    if (prior && JSON.stringify(prior) !== JSON.stringify(row)) throw new Error('conflicting duplicate');\n    seen.set(id, row);\n  }\n  const total_ms = [...seen.values()].reduce((sum, row) => sum + row[${JSON.stringify(duration.field)}] * ${duration.multiplier}, 0);\n  if (!Number.isSafeInteger(total_ms)) throw new Error('overflow');\n  return { attempts: seen.size, total_ms };\n}\n`;
    writeFileSync('audit.mjs', code, { flag: 'wx' });
    const implementation = await import(pathToFileURL(path.resolve('audit.mjs')).href);
    output = { status: 'completed', ...implementation.audit(task.rows) };
    artifact = 'audit.mjs';
  } else if (task.kind === 'textual' && facts.length === 2) {
    artifact = 'bulletin.txt';
    const prose = facts.sort((a, b) => a.key.localeCompare(b.key)).map(f => {
      assert.equal(typeof f.text, 'string'); return f.text;
    }).join('\n') + '\n';
    writeFileSync(artifact, prose, { flag: 'wx' });
    output = { status: 'completed', text: prose };
  }
  if (!task.control) await recheckBeforeUse(op, retrieval, task.query);
  const result = { ...output, artifact, used, corpus_ref: task.corpus,
    corpus_binding: retrieval.corpus_binding, method: task.control ? 'direct_read_control' : 'shared_selected_retrieval',
    calls, elapsed_ms: performance.now() - started, runtime: process.version,
    authority: 'scripted_output_only_no_semantic_acceptance' };
  writeFileSync('output.json', JSON.stringify(result, null, 2), { flag: 'wx' });
  console.log(JSON.stringify(result));
}
void main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => guard.restore());
