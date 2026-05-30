import { preflightAgWorkResumePacket as preflightCore } from "./ag-work-resume-packet-preflight-core.mjs";

export type AgWorkResumePacketPreflightCheckStatus = "pass" | "warn" | "fail";

export type AgWorkResumePacketPreflightCheck = {
  id: string;
  status: AgWorkResumePacketPreflightCheckStatus;
  message: string;
};

export type AgWorkResumePacketPreflightSummary = {
  input_mode: string;
  schema: string | null;
  packet_kind: string | null;
  has_packet_id: boolean;
  has_runtime_instance_id: boolean;
  has_scope: boolean;
  has_work_id: boolean;
  has_git_remote: boolean;
  has_expected_checks: boolean;
  preview_only_by_default: boolean;
};

export type AgWorkResumePacketPreflightResult = {
  ok: boolean;
  strict: boolean;
  summary: AgWorkResumePacketPreflightSummary;
  checks: AgWorkResumePacketPreflightCheck[];
  recommended_next_step: string;
};

export type AgWorkResumePacketPreflightOptions = {
  strict?: boolean;
  rawInput?: string;
  inputMode?: string;
};

export const preflightAgWorkResumePacket: (
  packet: unknown,
  options?: AgWorkResumePacketPreflightOptions,
) => AgWorkResumePacketPreflightResult = preflightCore;
