const closeout = {
  empirical_objective: "not_achieved",
  scientific_disposition: "not_tested",
  track_disposition: "terminal_history",
  execution_available: false,
} as const;

process.stderr.write(
  `${JSON.stringify({
    status: "refused",
    reason: "cw1_historical_live_training_cli_retired",
    ...closeout,
  })}\n`,
);
process.exitCode = 2;
