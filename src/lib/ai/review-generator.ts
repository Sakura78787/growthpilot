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
    "本周数据如下，请据此写周报 JSON。",
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
              "Act as an empathetic Growth Coach for a Chinese college student. Return ONLY a valid JSON object with two fields: summary (a warm, brief paragraph summarizing the week) and advice (1-2 actionable tips for next week based on the delay reasons). Write summary and advice in Chinese.",
          },
          { role: "user", content: userPayload },
        ],
        temperature: 0,
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
    };

    return {
      summary: normalizeReviewField(parsed.summary, fallback.summary),
      advice: normalizeReviewField(parsed.advice, fallback.advice),
      highlights: fallback.highlights,
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
