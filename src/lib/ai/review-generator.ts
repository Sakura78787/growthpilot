import { extractJsonObject } from "@/lib/ai/extract-json-object";
import { resolveLlmConfig, type LlmConfig } from "@/lib/ai/llm-config";
import {
  buildWeeklyReviewFallback,
  type WeeklyReviewFallback,
  type WeeklyReviewFallbackInput,
} from "@/lib/ai/rules";

export type ReviewGeneratorOptions = {
  llm?: LlmConfig;
};

const defaultReviewInput: WeeklyReviewFallbackInput = {
  completionRate: 68,
  topDelayReason: "任务太大",
  bestFocusPeriod: "20:00 - 22:00",
  dominantMoodLabel: "稳稳推进",
  averageEnergyLevel: 3,
  recentNotes: [],
};

function mergeWeeklyReviewInput(
  input: Partial<WeeklyReviewFallbackInput>,
): WeeklyReviewFallbackInput {
  return {
    completionRate: input.completionRate ?? defaultReviewInput.completionRate,
    topDelayReason: input.topDelayReason ?? defaultReviewInput.topDelayReason,
    bestFocusPeriod: input.bestFocusPeriod ?? defaultReviewInput.bestFocusPeriod,
    dominantMoodLabel: input.dominantMoodLabel ?? defaultReviewInput.dominantMoodLabel,
    averageEnergyLevel: input.averageEnergyLevel ?? defaultReviewInput.averageEnergyLevel,
    recentNotes: input.recentNotes ?? defaultReviewInput.recentNotes,
  };
}

function normalizeReviewField(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function normalizeHighlights(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const items = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : String(entry)))
    .filter((entry) => entry.length > 0);
  return items.length > 0 ? items.slice(0, 8) : fallback;
}

async function generatePersonalizedReview(
  input: WeeklyReviewFallbackInput,
  options?: ReviewGeneratorOptions,
): Promise<WeeklyReviewFallback> {
  const fallback = buildWeeklyReviewFallback(input);
  const config = resolveLlmConfig(
    options?.llm ? { apiKey: options.llm.apiKey, baseUrl: options.llm.baseUrl, model: options.llm.model } : undefined,
  );

  if (!config) {
    return fallback;
  }

  const recentNotesText = (input.recentNotes ?? [])
    .map((n) => n.trim())
    .filter((n) => n.length > 0)
    .slice(0, 5)
    .join("；");
  const notesLine = recentNotesText.length > 0 ? recentNotesText : "（无近期记录）";

  const userPayload = [
    "以下是用户本周的执行与记录摘要，请据此生成本周复盘 JSON。",
    `完成率（%）：${input.completionRate}`,
    `主要拖延/阻碍原因：${input.topDelayReason}`,
    `最易专注时段：${input.bestFocusPeriod}`,
    `主导状态：${input.dominantMoodLabel ?? "未标注"}`,
    `平均精力（1-5）：${input.averageEnergyLevel ?? "未标注"}`,
    `近期记录要点：${notesLine}`,
  ].join("\n");

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "system",
            content:
              "你是面向中国大学生的成长教练，语气克制、具体、可执行。只输出合法 JSON 对象，不要 markdown。字段：summary（一段中文周报摘要）、advice（1-3 条可执行建议，合并为一段文字）、highlights（字符串数组，3-6 条要点，每条不超过 40 字）。请根据数据差异给出不同角度的观察，避免每次重复「拆小任务、20 分钟起步」这类套话。",
          },
          { role: "user", content: userPayload },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("LLM API Error (review-generator):", response.status, errorBody);
      return fallback;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return fallback;
    }

    const jsonSource = extractJsonObject(content);
    if (!jsonSource) {
      return fallback;
    }

    const parsed = JSON.parse(jsonSource) as {
      summary?: unknown;
      advice?: unknown;
      highlights?: unknown;
    };

    return {
      summary: normalizeReviewField(parsed.summary, fallback.summary),
      advice: normalizeReviewField(parsed.advice, fallback.advice),
      highlights: normalizeHighlights(parsed.highlights, fallback.highlights),
    };
  } catch (error) {
    console.error("LLM Fetch Exception (review-generator):", error);
    return fallback;
  }
}

export async function generateWeeklyReview(
  input: Partial<WeeklyReviewFallbackInput> = {},
  options?: ReviewGeneratorOptions,
): Promise<WeeklyReviewFallback> {
  const merged = mergeWeeklyReviewInput(input);
  return generatePersonalizedReview(merged, options);
}
