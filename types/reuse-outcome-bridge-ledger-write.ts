import type {
  HandoffReuseOutcomeLedgerRecord,
  HandoffReuseOutcomeLedgerStoreResult,
  HandoffReuseOutcomeLedgerWriteReceipt,
  HandoffReuseOutcomeLedgerWriteStatus,
} from "./handoff-reuse-outcome-ledger";
import type { ReuseOutcomeBridgeOperatorDecisionPreview } from "./reuse-outcome-bridge-decision";

export const REUSE_OUTCOME_BRIDGE_LEDGER_WRITE_ADAPTER_VERSION =
  "reuse_outcome_bridge_ledger_write_adapter.v0.1" as const;

export interface ReuseOutcomeBridgeLedgerOperatorApproval {
  operator_decision: "approve_for_reuse_outcome_ledger_write";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface ReuseOutcomeBridgeLedgerWriteInput {
  decision_preview: ReuseOutcomeBridgeOperatorDecisionPreview;
  operator_approval: ReuseOutcomeBridgeLedgerOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface ReuseOutcomeBridgeLedgerNoSideEffects {
  reuse_outcome_ledger_written: boolean;
  handoff_reuse_outcome_ledger_record_written: boolean;
  handoff_reuse_outcome_ledger_receipt_written: boolean;
  dogfood_metrics_written: false;
  work_episode_written: false;
  expected_observed_delta_written: false;
  memory_mutated: false;
  current_working_perspective_updated: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
  provider_called: false;
  github_called: false;
  codex_executed: false;
  pr_created: false;
  pr_merged: false;
  autonomous_action_run: false;
  graph_or_vector_store_created: false;
  rag_stack_created: false;
  crawler_or_browser_observer_created: false;
}

export interface ReuseOutcomeBridgeLedgerValidationResult {
  ok: boolean;
  refusal_reasons: string[];
  input: ReuseOutcomeBridgeLedgerWriteInput | null;
  idempotency_key: string | null;
}

export interface ReuseOutcomeBridgeLedgerStoreResult {
  adapter_version: typeof REUSE_OUTCOME_BRIDGE_LEDGER_WRITE_ADAPTER_VERSION;
  status: HandoffReuseOutcomeLedgerWriteStatus;
  ok: boolean;
  record: HandoffReuseOutcomeLedgerRecord | null;
  records: HandoffReuseOutcomeLedgerRecord[];
  receipt: HandoffReuseOutcomeLedgerWriteReceipt;
  ledger_store_result: HandoffReuseOutcomeLedgerStoreResult | null;
  error_code: HandoffReuseOutcomeLedgerWriteStatus | null;
  refusal_reasons: string[];
  no_side_effects: ReuseOutcomeBridgeLedgerNoSideEffects;
}
