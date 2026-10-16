// Coordinator/evaluator fixtures. Never delivered to native consumers.
export function fixture(kind, prefix = 'dev') {
  const first = kind === 'first';
  const definitions = first ? [
    ['folio', 'utf16le', 'east', [[120, 2], [30, 3]], true],
    ['sheet', 'utf8', 'west', [[45, 4], [-10, 1]], true],
    ['note', 'utf8', 'east', [[80, 2]], false],
  ] : [
    ['dock', 'utf16le', 'north', [[75, 3], [-5, 2]], false],
    ['store', 'utf8', 'south', [[110, 2]], false],
    ['depot', 'utf16le', 'north', [[60, 5]], false],
    ['stall', 'utf8', 'south', [[45, 6]], false],
    ['hub', 'utf16le', 'south', [[100, 4]], false],
    ['post', 'utf8', 'north', [[90, 1], [15, 2]], false],
  ];
  const inputs = {};
  const jobs = definitions.map(([id, encoding, group, pairs, pending]) => {
    const text = JSON.stringify(pairs.map(([cents, units]) => ({ cents, units })));
    inputs[id] = encoding === 'utf8' ? Buffer.from(text) : Buffer.concat([Buffer.from([255, 254]), Buffer.from(text, 'utf16le')]);
    return { id, encoding, group, pending };
  });
  return { contract: { schema: 'processing-task.v1', id: `${prefix}-${kind}`, kind: first ? 'settlement' : 'regional',
    title: first ? 'Finish the interrupted settlement' : 'Regional recurring allocation',
    budget: first ? 20 : 30, jobs, limits: first ? { east: 500, west: 200 } : { north: 600, south: 850 } }, inputs };
}
