import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleMinus,
  IconCircleX,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

export type StatusVariant = "success" | "warning" | "destructive" | "secondary";

export interface StatusMeta {
  variant: StatusVariant;
  icon: ComponentType<{ className?: string }>;
}

const SUCCESS: StatusMeta = { variant: "success", icon: IconCircleCheck };
const WARNING: StatusMeta = { variant: "warning", icon: IconAlertTriangle };
const DESTRUCTIVE: StatusMeta = { variant: "destructive", icon: IconCircleX };
const NEUTRAL: StatusMeta = { variant: "secondary", icon: IconCircleMinus };

export function companyStatusMeta(status: string): StatusMeta {
  return status === "ACTIVE" ? SUCCESS : NEUTRAL;
}

export function jobStatusMeta(status: string): StatusMeta {
  return status === "ACTIVE" ? SUCCESS : NEUTRAL;
}

/** Company.scrapeStatus — health of a company's scrape configuration. */
export function companyScrapeStatusMeta(status: string): StatusMeta {
  switch (status) {
    case "ACTIVE":
      return SUCCESS;
    case "ERROR":
      return DESTRUCTIVE;
    case "CHECK": // suspected failure, needs review
      return WARNING;
    default: // EMPTY, SKIPPED
      return NEUTRAL;
  }
}

/** ScrapeLog.status — outcome of a single scrape run. */
export function scrapeLogStatusMeta(status: string): StatusMeta {
  switch (status) {
    case "SUCCESS":
      return SUCCESS;
    case "ERROR":
      return DESTRUCTIVE;
    case "SUSPECTED_FAILURE":
      return WARNING;
    default: // EMPTY
      return NEUTRAL;
  }
}

/** AiLog.status — free-text call outcome from Claude/DeepSeek. */
export function aiLogStatusMeta(status: string): StatusMeta {
  const normalized = status.toLowerCase();
  if (["succeeded", "completed", "success"].includes(normalized))
    return SUCCESS;
  if (["errored", "failed", "error"].includes(normalized)) return DESTRUCTIVE;
  if (["expired", "canceled", "cancelled"].includes(normalized)) return WARNING;
  return NEUTRAL;
}

/** AiBatchLog.status — Anthropic Message Batch processing_status. */
export function aiBatchStatusMeta(status: string): StatusMeta {
  const normalized = status.toLowerCase();
  if (normalized === "ended" || normalized === "completed") return SUCCESS;
  if (normalized === "errored" || normalized === "failed") return DESTRUCTIVE;
  if (normalized.startsWith("cancel")) return WARNING;
  return NEUTRAL; // in_progress, etc.
}

/** BullMQ job state, for queue snapshots. */
export function queueJobStateMeta(state: string): StatusMeta {
  switch (state) {
    case "completed":
      return SUCCESS;
    case "failed":
      return DESTRUCTIVE;
    case "active":
      return WARNING;
    default: // waiting, delayed
      return NEUTRAL;
  }
}
