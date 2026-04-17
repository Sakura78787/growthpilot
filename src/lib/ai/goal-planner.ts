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

const LLM_TIMEOUT_MS = 15_000;

export async function generatePersonalizedGoalPlan(
  input: GoalRequest,
  options?: GoalPlannerOptions,
): Promise<PersonalizedGoalPlan> {
  const config = resolveLlmConfig(
    options?.llm ? { apiKey: options.llm.apiKey, baseUrl: options.llm.baseUrl, model: options.llm.model } : undefined,
  );

  if (!config) {
    return buildGoalPlannerFallback(input);
  }

  const prompt = [
    "你是中文产品成长教练。根据用户输入生成目标拆解，只输出一个合法 JSON 对象。",
    "里程碑 2～4 个，关键动作 3～6 个，结合用户基础、每日时长、主要阻碍决定拆解粒度。",
    "内容具体可开始，适合中国大陆大学生；suggestedDuration 为 15-120 的整数分钟。",
    "字段名：planReason、milestones、tasks。",
    '示例：{ "planReason": "一句解释", "milestones":[{"title":"...","targetDateLabel":"..."}], "tasks":[{"title":"...","bucket":"...","suggestedDuration":20}] }',
    `目标：${input.title}`,
    `类型：${input.category}`,
    `当前基础：${input.currentLevel}`,
    `每日可投入时长：${input.dailyMinutes} 分钟`,
    `主要阻碍：${input.mainBlocker}`,
  ].join("\n");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

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
          { role: "system", content: "只输出合法 JSON 对象，禁止 markdown 与任何非 JSON 内容。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("LLM API Error (goal-planner):", response.status, errorBody);
      return buildGoalPlannerFallback(input);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return buildGoalPlannerFallback(input);
    }

    const jsonSource = extractJsonObject(content);
    if (!jsonSource) {
      return buildGoalPlannerFallback(input);
    }

    const parsed = JSON.parse(jsonSource) as Record<string, unknown>;
    const fallback = buildGoalPlannerFallback(input);

    return {
      plan: normalizeGoalPlan(parsed, fallback.plan),
      planSource: "llm",
      planReason: normalizeTitle(parsed["planReason"], "模型已根据你的输入做了个性化拆解。"),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("LLM Fetch Exception (goal-planner):", error);
    return buildGoalPlannerFallback(input);
  }
}