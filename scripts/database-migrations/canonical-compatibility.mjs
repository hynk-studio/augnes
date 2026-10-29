import { externalSchemaSql } from "../../lib/vnext/persistence/external-response-store.mjs";
import { reviewSchemaSql, prepareReviewCallbackGeneration } from "../../lib/vnext/persistence/review-schema.mjs";
import {
  prepareHistoricalCompatibilityBeforeSchema,
  prepareHistoricalCompatibilityAfterSchema,
} from "./historical-compatibility.mjs";
import { prepareNativeProductMigrations } from "./native-product.mjs";
import { prepareReviewEvidenceMigrations } from "./review-evidence.mjs";
import { prepareResearchCandidateMigrations } from "./research-candidate.mjs";
import { prepareAutonomyAutohuntMigrations } from "./autonomy-autohunt.mjs";
import { preparePerspectiveMemoryMigrations } from "./perspective-memory.mjs";

// The one closed canonical composition. Every supported family is mandatory.
// Keep these calls sequential: each migration retains its own transaction and
// failure boundary, including committed partial progress before a later failure.
export function applyCanonicalCompatibility(db, schema) {
  const preSchemaResult = prepareHistoricalCompatibilityBeforeSchema(db);
  const nativeResults = prepareNativeProductMigrations(db);

  db.exec(schema);
  db.exec(reviewSchemaSql);
  db.transaction(() => db.exec(externalSchemaSql))();
  prepareReviewCallbackGeneration(db);
  const { result, ...historicalResults } =
    prepareHistoricalCompatibilityAfterSchema(db, schema, preSchemaResult);
  const reviewResults = prepareReviewEvidenceMigrations(db);
  const researchResults = prepareResearchCandidateMigrations(db);
  const autonomyResults = prepareAutonomyAutohuntMigrations(db);
  const perspectiveResults = preparePerspectiveMemoryMigrations(db);

  return {
    result,
    ...nativeResults,
    ...historicalResults,
    ...reviewResults,
    ...researchResults,
    ...autonomyResults,
    ...perspectiveResults,
  };
}
