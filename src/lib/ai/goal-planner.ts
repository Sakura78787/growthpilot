import { extractJsonObject } from "@/lib/ai/extract-json-object";
import type { GoalPlanSeed } from "@/lib/mock/seed-data";
import { buildGoalPlan } from "@/lib/mock/seed-data";
import type { GoalRequest } from "@/lib/validation/goals";

export type PersonalizedGoalPlan = {
  plan: GoalPlanSeed;
  planSource: "llm" | "rules";
  planReason: string;
};

const defaultModel = "tongyi-xiaomi-analysis-flash";

function normalizeTitle(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const title = value.trim();
  return title.length > 0 ? title.slice(0, 80) : fallback;
}

function normalizeDuration(value: unknown, fallback: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  const rounded = Math.round(numeric);
  return Math.max(15, Math.min(120, rounded));
}

function normalizeGoalPlan(input: unknown, fallback: GoalPlanSeed): GoalPlanSeed {
  if (!input || typeof input !== "object") {
    return fallback;
  }

  const candidate = input as {
    milestones?: Array<{ title?: unknown; targetDateLabel?: unknown }>;
    tasks?: Array<{ title?: unknown; bucket?: unknown; suggestedDuration?: unknown }>;
  };

  const milestones = (candidate.milestones ?? []).slice(0, 3).map((item, index) => ({
    title: normalizeTitle(item?.title, fallback.milestones[index]?.title ?? `阶段 ${index + 1}`),
    targetDateLabel: normalizeTitle(item?.targetDateLabel, fallback.milestones[index]?.targetDateLabel ?? `第 ${index + 1} 周`),
  }));

  const tasks = (candidate.tasks ?? []).slice(0, 3).map((item, index) => ({
    title: normalizeTitle(item?.title, fallback.tasks[index]?.title ?? `关键动作 ${index + 1}`),
    bucket: normalizeTitle(item?.bucket, fallback.tasks[index]?.bucket ?? "action"),
    suggestedDuration: normalizeDuration(item?.suggestedDuration, fallback.tasks[index]?.suggestedDuration ?? 20),
  }));

  if (milestones.length !== 3 || tasks.length !== 3) {
    return fallback;
  }

  return {
    milestones,
    tasks,
  };
}

function buildFallbackReason(input: GoalRequest) {
  if (input.currentLevel === "zero") {
    return "按规则模板生成：当前基础为零基础，先保证每天能稳定开始。";
  }
  if (input.currentLevel === "experienced") {
    return "按规则模板生成：你已有积累，计划更强调产出和节奏。";
  }

  return "按规则模板生成：先把大目标拆成可开始的小动作。";
}

export function buildGoalPlannerFallback(input: GoalRequest): PersonalizedGoalPlan {
  const plan = buildGoalPlan(input);
  return {
    plan,
    planSource: "rules",
    planReason: buildFallbackReason(input),
  };
}

export async function generatePersonalizedGoalPlan(input: GoalRequest): Promise<PersonalizedGoalPlan> {
  const fallback = buildGoalPlannerFallback(input);
  const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
  const model = process.env.DASHSCOPE_MODEL?.trim() || defaultModel;

  if (!apiKey) {
    return fallback;
  }

  const prompt = [
    "你是中文产品成长教练，请基于输入生成 3 个阶段里程碑和 3 个关键动作。",
    "要求：内容具体、可开始、适合中国大陆大学生，且动作时长控制在 15-120 分钟。",
    "只返回 JSON，不要解释：",
    '{ "planReason": "一句解释", "milestones":[{"title":"...","targetDateLabel":"..."}], "tasks":[{"title":"...","bucket":"...","suggestedDuration":20}] }',
    `目标：${input.title}`,
    `类型：${input.category}`,
    `当前基础：${input.currentLevel}`,
    `每日可投入时长：${input.dailyMinutes} 分钟`,
    `主要阻碍：${input.mainBlocker}`,
  ].join("\n");

  try {
    const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "你输出必须是合法 JSON。" },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        top_k: 1,
        result_format: "message",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("DashScope API Error (goal-planner):", response.status, errorBody);
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
      planReason?: unknown;
      milestones?: unknown;
      tasks?: unknown;
    };

    return {
      plan: normalizeGoalPlan(
        {
          milestones: parsed.milestones,
          tasks: parsed.tasks,
        },
        fallback.plan,
      ),
      planSource: "llm",
      planReason: normalizeTitle(parsed.planReason, "模型已根据你的输入做了轻量个性化改写。"),
    };
  } catch (error) {
    console.error("Fetch Exception (goal-planner):", error);
    return fallback;
  }
}
