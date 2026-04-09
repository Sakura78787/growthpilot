import { asc, desc, eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db/client";
import { buildGoalGraph } from "@/lib/db/mappers";
import { goals, milestones, tasks, users } from "@/lib/db/schema";
import type { GoalCategory, GoalPlanSeed } from "@/lib/mock/seed-data";
import type { GoalRequest } from "@/lib/validation/goals";

export type GoalGraph = ReturnType<typeof buildGoalGraph>;

export const goalCategoryLabels = {
  discipline: "自律",
  study: "学习",
  job: "求职",
} as const;

type DashboardGoalSummary = {
  goal: {
    id: string;
    title: string;
    category: string;
  };
  tasks: Array<{ id: string; title: string; status: string }>;
};

type GoalDetailGoal = {
  id: string;
  title: string;
  category: string;
};

type GoalDetailMilestoneRecord = {
  id: string;
  goalId: string;
  title: string;
  targetDate: string;
  status: string;
};

type GoalDetailTaskRecord = {
  id: string;
  goalId: string;
  milestoneId: string | null;
  title: string;
  plannedDate: string;
  plannedDuration: number;
  status: string;
  delayReason: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  completionNote: string | null;
};

export type GoalTimelineTaskView = {
  id: string;
  title: string;
  meta: string;
  statusLabel: string;
  note?: string;
};

export type GoalTimelineMilestoneView = {
  id: string;
  title: string;
  targetDateLabel: string;
  statusLabel: string;
  tasks: GoalTimelineTaskView[];
};

export type GoalDetailViewModel = {
  goalId: string;
  goalTitle: string;
  categoryLabel: string;
  progressLabel: string;
  totalTaskCount: number;
  completedTaskCount: number;
  nextAction: {
    title: string;
    meta: string;
  } | null;
  milestones: GoalTimelineMilestoneView[];
  looseTasks: GoalTimelineTaskView[];
};

const goalMilestoneStatusLabels = {
  doing: "当前推进中",
  done: "阶段完成",
  skipped: "暂时放缓",
  todo: "接下来推进",
} as const;

const goalTaskStatusLabels = {
  doing: "正在推进",
  done: "已经完成",
  skipped: "暂时搁置",
  todo: "尚未开始",
} as const;

export function buildDashboardViewModel(input: DashboardGoalSummary) {
  const categoryKey = (input.goal.category in goalCategoryLabels
    ? input.goal.category
    : "job") as keyof typeof goalCategoryLabels;

  return {
    goalId: input.goal.id,
    goalTitle: input.goal.title,
    goalCategory: categoryKey,
    goalCategoryLabel: goalCategoryLabels[categoryKey],
    tasks: input.tasks.slice(0, 3).map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status as "todo" | "doing" | "done" | "skipped",
    })),
  };
}

function formatGoalDateLabel(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return value;
  }

  return `${Number(match[2])} 月 ${Number(match[3])} 日前`;
}

function getMilestoneStatusLabel(status: string) {
  return goalMilestoneStatusLabels[status as keyof typeof goalMilestoneStatusLabels] ?? "接下来推进";
}

function getTaskStatusLabel(status: string) {
  return goalTaskStatusLabels[status as keyof typeof goalTaskStatusLabels] ?? "尚未开始";
}

function buildGoalTaskView(task: GoalDetailTaskRecord): GoalTimelineTaskView {
  const statusLabel = getTaskStatusLabel(task.status);
  const note = task.delayReason
    ? `卡点：${task.delayReason}`
    : task.completionNote
      ? `收获：${task.completionNote}`
      : undefined;

  return {
    id: task.id,
    title: task.title,
    meta: `预计 ${task.plannedDuration} 分钟 · ${statusLabel}`,
    statusLabel,
    note,
  };
}

function getNextAction(tasksInput: GoalDetailTaskRecord[]) {
  const sortedTasks = [...tasksInput].sort((left, right) => {
    const leftWeight = left.status === "doing" ? 0 : left.status === "todo" ? 1 : left.status === "done" ? 2 : 3;
    const rightWeight = right.status === "doing" ? 0 : right.status === "todo" ? 1 : right.status === "done" ? 2 : 3;

    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }

    return left.plannedDate.localeCompare(right.plannedDate);
  });

  const nextTask = sortedTasks[0];
  if (!nextTask) {
    return null;
  }

  return {
    title: nextTask.title,
    meta: `预计 ${nextTask.plannedDuration} 分钟 · ${getTaskStatusLabel(nextTask.status)}`,
  };
}

export function buildFallbackGoalDetail(input: {
  goalId: string;
  title: string;
  category: GoalCategory;
  plan: GoalPlanSeed;
}) {
  const mappedMilestones: GoalDetailMilestoneRecord[] = input.plan.milestones.map((milestone, index) => ({
    id: `${input.goalId}-milestone-${index + 1}`,
    goalId: input.goalId,
    title: milestone.title,
    targetDate: milestone.targetDateLabel,
    status: index === 0 ? "doing" : "todo",
  }));

  const mappedTasks: GoalDetailTaskRecord[] = input.plan.tasks.map((task, index) => ({
    id: `${input.goalId}-task-${index + 1}`,
    goalId: input.goalId,
    milestoneId: mappedMilestones[Math.min(index, mappedMilestones.length - 1)]?.id ?? null,
    title: task.title,
    plannedDate: mappedMilestones[Math.min(index, mappedMilestones.length - 1)]?.targetDate ?? "本周内",
    plannedDuration: task.suggestedDuration,
    status: index === 0 ? "doing" : "todo",
    delayReason: null,
    actualStartTime: null,
    actualEndTime: null,
    completionNote: null,
  }));

  return {
    goal: {
      id: input.goalId,
      title: input.title,
      category: input.category,
    },
    milestones: mappedMilestones,
    tasks: mappedTasks,
  };
}

export function buildGoalDetailViewModel(input: {
  goal: GoalDetailGoal;
  milestones: GoalDetailMilestoneRecord[];
  tasks: GoalDetailTaskRecord[];
}): GoalDetailViewModel {
  const categoryKey = (input.goal.category in goalCategoryLabels
    ? input.goal.category
    : "job") as keyof typeof goalCategoryLabels;
  const completedTaskCount = input.tasks.filter((task) => task.status === "done").length;
  const milestoneTaskMap = new Map<string, GoalTimelineTaskView[]>();

  for (const task of input.tasks) {
    if (!task.milestoneId) {
      continue;
    }

    const bucket = milestoneTaskMap.get(task.milestoneId) ?? [];
    bucket.push(buildGoalTaskView(task));
    milestoneTaskMap.set(task.milestoneId, bucket);
  }

  const looseTasks = input.tasks.filter((task) => !task.milestoneId).map(buildGoalTaskView);

  return {
    goalId: input.goal.id,
    goalTitle: input.goal.title,
    categoryLabel: goalCategoryLabels[categoryKey],
    progressLabel: `已完成 ${completedTaskCount} / ${input.tasks.length} 个关键动作`,
    totalTaskCount: input.tasks.length,
    completedTaskCount,
    nextAction: getNextAction(input.tasks),
    milestones: input.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      targetDateLabel: formatGoalDateLabel(milestone.targetDate),
      statusLabel: getMilestoneStatusLabel(milestone.status),
      tasks: milestoneTaskMap.get(milestone.id) ?? [],
    })),
    looseTasks,
  };
}

export async function createGoalWithPlan(db: AppDb, input: GoalRequest) {
  const graph = buildGoalGraph(input);

  await db.insert(users).values(graph.user).onConflictDoNothing();
  await db.insert(goals).values(graph.goal);
  await db.insert(milestones).values(graph.milestones);
  await db.insert(tasks).values(graph.tasks);

  return graph;
}

export async function getGoalDetail(db: AppDb, goalId: string) {
  const goalRows = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  const milestoneRows = await db
    .select()
    .from(milestones)
    .where(eq(milestones.goalId, goalId))
    .orderBy(asc(milestones.targetDate));
  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.goalId, goalId))
    .orderBy(asc(tasks.plannedDate));

  return {
    goal: goalRows[0] ?? null,
    milestones: milestoneRows,
    tasks: taskRows,
  };
}

export async function getLatestGoalDetail(db: AppDb) {
  const rows = await db.select({ id: goals.id }).from(goals).orderBy(desc(goals.createdAt)).limit(1);

  if (!rows[0]?.id) {
    return null;
  }

  return getGoalDetail(db, rows[0].id);
}
