import type { LlmConfig } from "@/lib/ai/llm-config";
import type { CloudflareEnv } from "@/lib/cloudflare/env";

const DEFAULT_BASE_URL = "https://opencode.ai/zen/go/v1";
const DEFAULT_MODEL = "qwen3.5-plus";

export function resolveAiOptionsFromEnv(env: Partial<CloudflareEnv> | undefined): {
  llm?: LlmConfig;
} {
  const apiKey = (env?.LLM_API_KEY as string | undefined) || process.env.LLM_API_KEY;
  if (!apiKey?.trim()) {
    return {};
  }

  return {
    llm: {
      apiKey: apiKey.trim(),
      baseUrl:
        (env?.LLM_BASE_URL as string | undefined)?.trim() ||
        process.env.LLM_BASE_URL?.trim() ||
        DEFAULT_BASE_URL,
      model:
        (env?.LLM_MODEL as string | undefined)?.trim() ||
        process.env.LLM_MODEL?.trim() ||
        DEFAULT_MODEL,
    },
  };
}
