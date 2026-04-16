/** OpenCode Go (OpenAI-compatible): https://opencode.ai/docs/zh-cn/go/ — Qwen3.5 Plus → /zen/go/v1/chat/completions */
const DEFAULT_BASE_URL = "https://opencode.ai/zen/go/v1";
const DEFAULT_MODEL = "qwen3.5-plus";

export type LlmConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export function resolveLlmConfig(options?: {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): LlmConfig | null {
  const apiKey = options?.apiKey?.trim() || process.env.LLM_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const baseUrl = options?.baseUrl?.trim() || process.env.LLM_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const model = options?.model?.trim() || process.env.LLM_MODEL?.trim() || DEFAULT_MODEL;

  return { apiKey, baseUrl, model };
}
