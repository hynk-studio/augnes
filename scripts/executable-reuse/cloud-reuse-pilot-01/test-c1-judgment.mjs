// Structural controls only; these synthetic values are not a B3 assessment.
import assert from 'node:assert/strict';
import { bindingHash, validateJudgment } from './c1-judgment.mjs';
const material={current:{work_id:'synthetic-control',fingerprint:'synthetic-fingerprint',sources:[{source_ref:'synthetic-reference'}]}};
const checkpoint={material,binding_hash:bindingHash(material),observed_at:'2026-01-01T00:00:00.000Z'};
const sample={input_commit:'4a1d2137d126247645f8598df842d9b5e2bbc61b',input_export_sha256:'797fc35751add728b3b70914ddf8eac5fcfadb3bb4589ff0a956553504edde19',work_id:'synthetic-control',revision:4,fingerprint:'synthetic-fingerprint',checkpoint_hash:checkpoint.binding_hash,conclusion:'insufficient-context',reasons:['synthetic structural control'],recovered_refs:['synthetic-reference'],observed_at:checkpoint.observed_at,authored_at:'2026-01-01T00:00:01.000Z',attribution:{synthetic:true},exposure_limits:{synthetic:true},uncertainties:[]};
for(const conclusion of ['reuse','non-use','insufficient-context'])assert.equal(validateJudgment({...sample,conclusion},checkpoint).conclusion,conclusion);
for(const change of [{input_commit:'wrong'},{input_export_sha256:'wrong'},{work_id:'wrong'},{revision:5},{fingerprint:'wrong'},{checkpoint_hash:'wrong'},{recovered_refs:['unseen']},{observed_at:'wrong'},{authored_at:'2025-01-01T00:00:00Z'}])assert.throws(()=>validateJudgment({...sample,...change},checkpoint));
assert.throws(()=>validateJudgment(sample,{...checkpoint,material:{...material,extra:true}}));
assert.equal(bindingHash({b:2,a:{y:2,x:1}}),bindingHash({a:{x:1,y:2},b:2}));
console.log('C1 binding controls passed: all 3 conclusions allowed; 10 wrong bindings/times rejected.');
