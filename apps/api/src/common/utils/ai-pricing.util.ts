export type AiProvider = 'claude' | 'deepseek' | 'unknown';

// USD per 1M tokens. Only models actually in use by the scraper need an entry;
// usage from unrecognized models is reported with a null cost instead of guessed.
const MODEL_PRICING_PER_MILLION_TOKENS: Record<
  string,
  { input: number; output: number }
> = {
  'claude-haiku-4-5': { input: 1.0, output: 5.0 },
  // Placeholder figure — verify against DeepSeek's current pricing page.
  'deepseek-v4-pro': { input: 0.28, output: 0.42 },
};

const PROVIDER_PREFIXES: Record<string, AiProvider> = {
  claude: 'claude',
  deepseek: 'deepseek',
};

export function getModelPricing(model: string) {
  const key = Object.keys(MODEL_PRICING_PER_MILLION_TOKENS).find((prefix) =>
    model.startsWith(prefix),
  );
  return key ? MODEL_PRICING_PER_MILLION_TOKENS[key] : undefined;
}

export function getProviderForModel(model: string | null): AiProvider {
  if (!model) return 'unknown';
  const key = Object.keys(PROVIDER_PREFIXES).find((prefix) =>
    model.startsWith(prefix),
  );
  return key ? PROVIDER_PREFIXES[key] : 'unknown';
}

export function computeCostUsd(
  model: string | null,
  inputTokens: number | null,
  outputTokens: number | null,
): number | null {
  if (!model) return null;
  const pricing = getModelPricing(model);
  if (!pricing) return null;

  return (
    ((inputTokens ?? 0) / 1_000_000) * pricing.input +
    ((outputTokens ?? 0) / 1_000_000) * pricing.output
  );
}
