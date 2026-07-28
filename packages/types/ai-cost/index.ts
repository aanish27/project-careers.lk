export interface ClaudeUsageByModel {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface ClaudeUsageResponse {
  configured: boolean;
  error?: boolean;
  totalCostUsd: number | null;
  byModel: ClaudeUsageByModel[];
}

export interface DeepSeekBalanceInfo {
  currency: string;
  totalBalance: string;
  grantedBalance: string;
  toppedUpBalance: string;
}

export interface DeepSeekBalanceResponse {
  configured: boolean;
  error?: boolean;
  isAvailable: boolean | null;
  balances: DeepSeekBalanceInfo[];
}
