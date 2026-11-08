// Exercise adjacent millisecond reads while constructing acquisition fixture
// records. Only the synthetic fixture's time() helper advances; production
// reader clocks, child deadlines and real GitHub records keep the native clock.
const nativeNow = Date.now;
let previous = nativeNow();
Date.now = () => {
  const stack = new Error().stack;
  if (stack.includes("at time (") &&
      stack.includes("fixtures/local-canonical-reviewed-revision.mjs") &&
      stack.includes("acquisitionProposalControls")) {
    previous = Math.max(nativeNow(), previous + 1);
    return previous;
  }
  return nativeNow();
};
