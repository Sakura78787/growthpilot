import { extractJsonObject } from "@/lib/ai/extract-json-object";
import { resolveLlmConfig, type LlmConfig } from "@/lib/ai/llm-config";
import type { GoalPlanSeed } from "@/lib/mock/seed-data";
import { buildGoalPlan } from "@/lib/mock/seed-data";
import type { GoalRequest } from "@/lib/validation/goals";

export type PersonalizedGoalPlan = {
  plan: GoalPlanSeed;
  planSource: "llm" | "rules";
  planReason: string;
};

export type GoalPlannerOptions = {
  llm?: LlmConfig;
};

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
    milestone?: Array<{ title?: unknown; targetDateLabel?: unknown }>;
    tasks?: Array<{ title?: unknown; bucket?: unknown; suggestedDuration?: unknown }>;
    task?: Array<{ title?: unknown; bucket?: unknown; suggestedDuration?: unknown }>;
  };

  const milestoneSource = candidate.milestones ?? candidate.milestone;
  const taskSource = candidate.tasks ?? candidate.task;
  const rawMilestones = (Array.isArray(milestoneSource) ? milestoneSource : []).slice(0, 4);
  const rawTasks = (Array.isArray(taskSource) ? taskSource : []).slice(0, 6);

  if (rawMilestones.length < 2 || rawMilestones.length > 4 || rawTasks.length < 3 || rawTasks.length > 6) {
    return fallback;
  }

  const milestones = rawMilestones.map((item, index) => ({
    title: normalizeTitle(
      item?.title,
      fallback.milestones[Math.min(index, fallback.milestones.length - 1)]?.title ?? `阶段 ${index + 1}`,
    ),
    targetDateLabel: normalizeTitle(
      item?.targetDateLabel,
      fallback.milestones[Math.min(index, fallback.milestones.length - 1)]?.targetDateLabel ?? `第 ${index + 1} 周`,
    ),
  }));

  const tasks = rawTasks.map((item, index) => ({
    title: normalizeTitle(
      item?.title,
      fallback.tasks[Math.min(index, fallback.tasks.length - 1)]?.title ?? `关键动作 ${index + 1}`,
    ),
    bucket: normalizeTitle(
      item?.bucket,
      fallback.tasks[Math.min(index, fallback.tasks.length - 1)]?.bucket ?? "action",
    ),
    suggestedDuration: normalizeDuration(
      item?.suggestedDuration,
      fallback.tasks[Math.min(index, fallback.tasks.length - 1)]?.suggestedDuration ?? 20,
    ),
  }));

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

export async function generatePersonalizedGoalPlan(
  input: GoalRequest,
  options?: GoalPlannerOptions,
): Promise<PersonalizedGoalPlan> {
  const fallback = buildGoalPlannerFallback(input);
  const config = resolveLlmConfig(
    options?.llm ? { apiKey: options.llm.apiKey, baseUrl: options.llm.baseUrl, model: options.llm.model } : undefined,
  );

  if (!config) {
    return fallback;
  }

  const prompt = [
    "你是中文产品成长教练。请根据用户输入，生成可执行的目标拆解。",
    "里程碑数量须在 2～4 个之间；关键动作数量须在 3～6 个之间（按难度与周期自行决定，不要机械凑数）。",
    "请结合用户的当前基础、每日可用时长、主要阻碍，决定拆解粒度：零基础可更细，有经验可更偏产出。",
    "要求：内容具体、可开始、适合中国大陆大学生；每个动作的 suggestedDuration 为 15-120 之间的整数（分钟）。",
    "只输出一个 JSON 对象：不要使用 markdown、不要代码围栏、不要前后解释或多余文字。",
    "字段名必须为 planReason、milestones、tasks；milestones 为 2～4 项数组，tasks 为 3～6 项数组。",
    "示例结构（请替换为你的内容）：",
    '{ "planReason": "一句解释", "milestones":[{"title":"...","targetDateLabel":"..."}], "tasks":[{"title":"...","bucket":"...","suggestedDuration":20}] }',
    `目标：${input.title}`,
    `类型：${input.category}`,
    `当前基础：${input.currentLevel}`,
    `每日可投入时长：${input.dailyMinutes} 分钟`,
    `主要阻碍：${input.mainBlocker}`,
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
          { role: "system", content: "你只输出合法 JSON 对象一行或多行均可，禁止 markdown 与任何非 JSON 内容。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("LLM API Error (goal-planner):", response.status, errorBody);
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

    const parsed = JSON.parse(jsonSource) as Record<string, unknown>;

    return {
      plan: normalizeGoalPlan(parsed, fallback.plan),
      planSource: "llm",
      planReason: normalizeTitle(parsed["planReason"], "模型已根据你的输入做了轻量个性化改写。"),
    };
  } catch (error) {
    console.error("LLM Fetch Exception (goal-planner):", error);
    return fallback;
  }
}
