import type { AnalyticsEventV1, ValidationResult } from "../contracts/event-v1";

export type AnalyticsCollectorInput = AnalyticsEventV1 | AnalyticsEventV1[];

export interface CollectorItemError {
  index: number;
  code: string;
  fields: string[];
}

export interface CollectorResult {
  accepted: number;
  rejected: number;
  errors?: CollectorItemError[];
}
