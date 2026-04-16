import { DEFAULT_USER_ID } from "@/lib/constants";
import type { GoalPlanSeed } from "@/lib/mock/seed-data";
import { buildGoalPlan } from "@/lib/mock/seed-data";
import type { GoalRequest } from "@/lib/validation/goals";

export type GoalProfileSnapshot = {
  currentLevel: GoalRequest["currentLevel"];
  dailyMinutes: number;
  mainBlocker: string;
  planSource?: "llm" | "rules";
  planReason?: string;
};

type BuildGoalGraphOptions = {
  now?: Date;
  userId?: string;
  nickname?: string;
  grade?: string;
  preferredFocusTime?: string;
  plan?: GoalPlanSeed;
  profileSnapshot?: GoalProfileSnapshot;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * DAY_IN_MS);
}

function parseDeadline(deadline: string, fallbackStart: Date) {
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) {
    return addDays(fallbackStart, 21);
  }

  return parsed;
}

export function buildGoalGraph(input: GoalRequest, options: BuildGoalGraphOptions = {}) {
  const now = options.now ?? new Date();
  const nowDate = new Date(now);
  const userId = options.userId ?? DEFAULT_USER_ID;
  const goalId = crypto.randomUUID();
  const deadlineDate = parseDeadline(input.deadline, nowDate);
  const goalPlan = options.plan ?? buildGoalPlan({ title: input.title, category: input.category });
  const totalDays = Math.max(1, Math.ceil((deadlineDate.getTime() - nowDate.getTime()) / DAY_IN_MS));

  const snapshot: GoalProfileSnapshot = options.profileSnapshot ?? {
    currentLevel: input.currentLevel,
    dailyMinutes: input.dailyMinutes,
    mainBlocker: input.mainBlocker,
  };

  const user = {
    id: userId,
    nickname: options.nickname ?? "成长试用生",
    grade: options.grade ?? "大三下",
    primaryGoalType: input.category,
    preferredFocusTime: options.preferredFocusTime ?? "20:00 - 22:00",
    createdAt: nowDate,
  };

  const goal = {
    id: goalId,
    userId,
    title: input.title,
    category: input.category,
    deadline: input.deadline,
    profileSnapshot: JSON.stringify(snapshot),
    priority: input.category === "discipline" ? "medium" : "high",
    status: "active",
    createdAt: nowDate,
  };

  const milestones = goalPlan.milestones.map((milestone, index) => {
    const ratio = (index + 1) / goalPlan.milestones.length;
    const daysFromStart = Math.max(index + 1, Math.round(totalDays * ratio));

    return {
      id: crypto.randomUUID(),
      goalId,
      title: milestone.title,
      targetDate: formatDate(addDays(nowDate, daysFromStart)),
      status: index === 0 ? "doing" : "todo",
    };
  });

  const tasks = goalPlan.tasks.map((task, index) => ({
    id: crypto.randomUUID(),
    goalId,
    milestoneId: milestones[Math.min(index, milestones.length - 1)]?.id ?? null,
    title: task.title,
    plannedDate: formatDate(addDays(nowDate, index)),
    plannedDuration: task.suggestedDuration,
    status: index === 0 ? "doing" : "todo",
    delayReason: null,
    actualStartTime: index === 0 ? nowDate.toISOString() : null,
    actualEndTime: null,
  }));

  return {
    user,
    goal,
    milestones,
    tasks,
  };
}
