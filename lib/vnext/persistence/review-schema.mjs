// Adapter linkage only. Native packets and ordinary authored notes remain the
// work/material/continuation owners. Preparation is lifecycle-only.
export const reviewSchemaSql = `
CREATE TABLE IF NOT EXISTS vnext_review_requests (
  request_ref TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  connection_ref TEXT NOT NULL,
  connection_binding TEXT NOT NULL,
  requester TEXT NOT NULL,
  reviewer TEXT NOT NULL,
  destination TEXT NOT NULL,
  packet_ref TEXT NOT NULL,
  project_binding TEXT NOT NULL,
  material_ref TEXT NOT NULL,
  question TEXT NOT NULL CHECK(length(question) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL,
  read_binding TEXT,
  response_json TEXT CHECK(response_json IS NULL OR length(response_json) <= 16000),
  response_ref TEXT,
  response_saved_at TEXT,
  readback_served_at TEXT,
  FOREIGN KEY(workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id)
);
CREATE INDEX IF NOT EXISTS idx_vnext_review_scope ON vnext_review_requests(workspace_id,project_id,connection_ref,created_at,request_ref);
CREATE TABLE IF NOT EXISTS vnext_review_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  connection_ref TEXT NOT NULL,
  connection_binding TEXT NOT NULL,
  principal TEXT NOT NULL,
  arguments_json TEXT NOT NULL,
  callback_envelope TEXT NOT NULL,
  verified_until INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  stopped INTEGER NOT NULL DEFAULT 0 CHECK(stopped IN (0,1)),
  generation INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS vnext_review_deliveries (
  subscription_id TEXT NOT NULL REFERENCES vnext_review_subscriptions(subscription_id),
  request_ref TEXT NOT NULL REFERENCES vnext_review_requests(request_ref),
  attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('pending','received','stopped','failed')),
  PRIMARY KEY(subscription_id,request_ref)
);
`;

export function invalidateRestoredReviewSubscriptions(db) {
  // Restore preserves unanswered requests/answers, never a live callback lease.
  db.exec("UPDATE vnext_review_subscriptions SET stopped=1; UPDATE vnext_review_deliveries SET status='stopped' WHERE status='pending'");
}
