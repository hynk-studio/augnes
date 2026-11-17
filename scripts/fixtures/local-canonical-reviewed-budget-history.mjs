// Fixed disposable source projection for legacy admission-reader controls.
// This is synthetic protocol data, never a rewrite of retained source/evidence.
export function historicalReviewedFixtureSource(source) {
  return source
    .replace(/(review(?:Revision|SerialAggregate|SerialMaterial)?FixtureMs:) [0-9_]+,/gu, "$1 120_000,")
    .replace(/(review(?:SerialAggregate|SerialMaterial)?ControlMs:) [0-9_]+,/gu, "$1 180_000,");
}
