import {
  ClaudeUsageByModel,
  ClaudeUsageResponse,
  DeepSeekBalanceResponse,
} from '@careerslk/types';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Anthropic Admin API response shapes are unverified against a live Admin key
// this session — parsing is best-effort against the documented format and
// must be smoke-tested once a real `sk-ant-admin01-...` key is available.
interface ClaudeUsageReportResult {
  model?: string;
  uncached_input_tokens?: number;
  output_tokens?: number;
}
interface ClaudeUsageReportBucket {
  results?: ClaudeUsageReportResult[];
}
interface ClaudeUsageReportResponse {
  data?: ClaudeUsageReportBucket[];
}

interface ClaudeCostReportResult {
  amount?: string;
  currency?: string;
}
interface ClaudeCostReportBucket {
  results?: ClaudeCostReportResult[];
}
interface ClaudeCostReportResponse {
  data?: ClaudeCostReportBucket[];
}

// DeepSeek's documented /user/balance shape — not verified live this session.
interface DeepSeekBalanceInfoApi {
  currency: string;
  total_balance: string;
  granted_balance: string;
  topped_up_balance: string;
}
interface DeepSeekBalanceApiResponse {
  is_available?: boolean;
  balance_infos?: DeepSeekBalanceInfoApi[];
}

@Injectable()
export class AiCostService {
  private readonly logger = new Logger(AiCostService.name);

  constructor(private readonly config: ConfigService) {}

  async getClaudeUsage(): Promise<ClaudeUsageResponse> {
    const apiKey = this.config.get<string>('CLAUDE_ADMIN_API_KEY');
    if (!apiKey) {
      return { configured: false, totalCostUsd: null, byModel: [] };
    }

    const baseUrl =
      this.config.get<string>('CLAUDE_BASE_URL') ?? 'https://api.anthropic.com';
    const startingAt = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();
    const headers = {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };

    try {
      const [usageRes, costRes] = await Promise.all([
        fetch(
          `${baseUrl}/v1/organizations/usage_report/messages?starting_at=${encodeURIComponent(startingAt)}`,
          { headers },
        ),
        fetch(
          `${baseUrl}/v1/organizations/cost_report?starting_at=${encodeURIComponent(startingAt)}`,
          { headers },
        ),
      ]);

      if (!usageRes.ok || !costRes.ok) {
        this.logger.error(
          `Claude admin API error: usage=${usageRes.status} cost=${costRes.status}`,
        );
        return {
          configured: true,
          error: true,
          totalCostUsd: null,
          byModel: [],
        };
      }

      const usageJson = (await usageRes.json()) as ClaudeUsageReportResponse;
      const costJson = (await costRes.json()) as ClaudeCostReportResponse;

      return {
        configured: true,
        totalCostUsd: extractTotalCost(costJson),
        byModel: extractUsageByModel(usageJson),
      };
    } catch (error) {
      this.logger.error('Failed to fetch Claude admin usage/cost', error);
      return { configured: true, error: true, totalCostUsd: null, byModel: [] };
    }
  }

  async getDeepSeekBalance(): Promise<DeepSeekBalanceResponse> {
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) {
      return { configured: false, isAvailable: null, balances: [] };
    }

    const baseUrl =
      this.config.get<string>('DEEPSEEK_BASE_URL') ??
      'https://api.deepseek.com';

    try {
      const res = await fetch(`${baseUrl}/user/balance`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        this.logger.error(`DeepSeek balance API error: ${res.status}`);
        return {
          configured: true,
          error: true,
          isAvailable: null,
          balances: [],
        };
      }

      const json = (await res.json()) as DeepSeekBalanceApiResponse;

      return {
        configured: true,
        isAvailable: json.is_available ?? null,
        balances: (json.balance_infos ?? []).map((b) => ({
          currency: b.currency,
          totalBalance: b.total_balance,
          grantedBalance: b.granted_balance,
          toppedUpBalance: b.topped_up_balance,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to fetch DeepSeek balance', error);
      return { configured: true, error: true, isAvailable: null, balances: [] };
    }
  }
}

function extractUsageByModel(
  json: ClaudeUsageReportResponse,
): ClaudeUsageByModel[] {
  const totals = new Map<
    string,
    { inputTokens: number; outputTokens: number }
  >();

  for (const bucket of json.data ?? []) {
    for (const result of bucket.results ?? []) {
      if (!result.model) continue;
      const entry = totals.get(result.model) ?? {
        inputTokens: 0,
        outputTokens: 0,
      };
      entry.inputTokens += result.uncached_input_tokens ?? 0;
      entry.outputTokens += result.output_tokens ?? 0;
      totals.set(result.model, entry);
    }
  }

  return Array.from(totals.entries()).map(([model, tokens]) => ({
    model,
    inputTokens: tokens.inputTokens,
    outputTokens: tokens.outputTokens,
  }));
}

function extractTotalCost(json: ClaudeCostReportResponse): number | null {
  let total = 0;
  let found = false;

  for (const bucket of json.data ?? []) {
    for (const result of bucket.results ?? []) {
      const amount = result.amount !== undefined ? Number(result.amount) : NaN;
      if (!Number.isNaN(amount)) {
        total += amount;
        found = true;
      }
    }
  }

  return found ? Math.round(total * 1e6) / 1e6 : null;
}
