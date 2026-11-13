export const STOCK_VERIFIER_RESULT_PREFIX = "AUGNES_STOCK_VERIFIER_RESULT ";

// An uncaught assertion can terminate Node before an asynchronous pipe write
// drains. Finish this bounded observation write before rethrowing the primary.
export function writeStockVerifierSummary(summary, output = process.stdout) {
  return new Promise((resolve, reject) => output.write(
    STOCK_VERIFIER_RESULT_PREFIX + JSON.stringify(summary) + "\n",
    error => error ? reject(error) : resolve(),
  ));
}
