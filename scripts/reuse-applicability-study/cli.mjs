#!/usr/bin/env node
// Ordinary filesystem operations, no model launcher or provider integration.
import { execute } from './execute.mjs';
import { acquire } from './learn.mjs';
import { check } from './oracle.mjs';
import { read, save } from './files.mjs';
const [command, ...args] = process.argv.slice(2);
if (command === 'run' && args.length === 3) console.log(JSON.stringify(execute(...args), null, 2));
else if (command === 'learn' && args.length === 4) {
  const [records, program, trace, strategy] = args;
  if (!['contrastive', 'all'].includes(strategy)) throw new Error('unknown_learning_strategy');
  const result = acquire(read(records), strategy); save(program, result.program); save(trace, result);
  console.log(JSON.stringify(result, null, 2));
} else if (command === 'check' && args.length === 2) {
  const result = check(...args); console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === 'PASS' ? 0 : 1;
}
else throw new Error('usage: learn EXPERIENCE PROGRAM TRACE contrastive|all | run INPUTS METHOD OUT | check OUT INPUTS');
