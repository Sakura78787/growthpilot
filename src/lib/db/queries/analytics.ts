import { desc } from "drizzle-orm";

import type { AppDb } from "@/lib/db/client";
import { events, goals, reviews, taskLogs, tasks } from "@/lib/db/schema";

export type DelayReasonRow = {
  delayReason: string | null;
  count: number;
};

export type DelayReasonSummary = {
  reason: string;
  count: number;
};

export type ConsoleTaskRecord = {
  plannedDate: string;
  status: string;
  delayReason: string | null;
};

export type ConsoleTaskLogRecord = {
  delayReason: string | null;
  mood: string | null;
  energyLevel: number | null;
  loggedAt: string;
};

export type ConsoleGoalRecord = {
  category: string;
};

export type ConsoleReviewRecord = {
  completionRate: number;
};

export type ConsoleEventRecord = {
  eventName: string;
  eventPayload: string | null;
};

type MetricItem = {
  label: string;
  value: string | number;
};

type FunnelItem = {
  label: string;
  value: number;
};

type UserSegmentItem = {
  label: string;
  value: number;
  note: string;
};

const ACTIVE_STATUSES = new Set(["doing", "done"]);
const WEEKDAY_ORDER = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const;

const segmentMeta = {
  discipline: {
    label: "自律重建型",
    note: "围绕作息、专注和稳定节奏持续修复",
  },
  study: {
    label: "学习稳进型",
    note: "围绕知识吸收、刷题和阶段复盘持续推进",
  },
  job: {
    label: "求职冲刺型",
    note: "围绕作品集、简历和投递持续推进",
  },
} as const;

const moodLabelMap = {
  steady: "稳稳推进",
  tired: "有点疲惫",
  anxious: "有些焦虑",
  motivated: "很有干劲",
} as const;

function toWeekdayLabel(dateString: string) {
  const day = new Date(dateString).getUTCDay();
  return WEEKDAY_ORDER[(day + 6) % 7] ?? "周一";
}

function parseEventPayload(payload: string | null) {
  if (!payload) {
    return {};
  }

  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function buildFunnel(eventRows: ConsoleEventRecord[]): FunnelItem[] {
  let goalCreated = 0;
  let taskStarted = 0;
  let taskCompleted = 0;
  let reviewGenerated = 0;

  for (const event of eventRows) {
    const payload = parseEventPayload(event.eventPayload);
    const status = payload.status;

    if (event.eventName === "goal.created") {
      goalCreated += 1;
      continue;
    }

    if (event.eventName === "task.started" || (event.eventName === "task.updated" && status === "doing")) {
      taskStarted += 1;
      continue;
    }

    if (event.eventName === "task.completed" || (event.eventName === "task.updated" && status === "done")) {
      taskCompleted += 1;
      continue;
    }

    if (event.eventName === "review.generated") {
      reviewGenerated += 1;
    }
  }

  return [
    { label: "创建目标", value: goalCreated },
    { label: "开始行动", value: taskStarted },
    { label: "完成动作", value: taskCompleted },
    { label: "生成复盘", value: reviewGenerated },
  ];
}

function buildUserSegments(goalRows: ConsoleGoalRecord[]): UserSegmentItem[] {
  const goalCategoryMap = new Map<string, number>();
  for (const goal of goalRows) {
    goalCategoryMap.set(goal.category, (goalCategoryMap.get(goal.category) ?? 0) + 1);
  }

  const items: UserSegmentItem[] = [];
  for (const [category, value] of goalCategoryMap.entries()) {
    const meta = segmentMeta[category as keyof typeof segmentMeta];
    if (!meta) {
      continue;
    }

    items.push({
      label: meta.label,
      value,
      note: meta.note,
    });
  }

  items.sort((left, right) => right.value - left.value);

  if (items.length > 0) {
    return items;
  }

  return [
    {
      label: "探索起步型",
      value: 0,
      note: "先写下第一个目标，系统就能开始识别你的成长节奏",
    },
  ];
}

function buildReviewUsage(reviewRows: ConsoleReviewRecord[]): MetricItem[] {
  const totalReviews = reviewRows.length;
  const averageCompletionRate =
    totalReviews === 0 ? 0 : Math.round(reviewRows.reduce((sum, review) => sum + review.completionRate, 0) / totalReviews);

  return [
    { label: "累计复盘次数", value: totalReviews },
    { label: "平均复盘完成率", value: `${averageCompletionRate}%` },
  ];
}

function buildSessionSignals(taskLogRows: ConsoleTaskLogRecord[]): MetricItem[] {
  const moodCountMap = new Map<string, number>();
  const energyValues: number[] = [];

  for (const log of taskLogRows) {
    if (log.mood && moodLabelMap[log.mood as keyof typeof moodLabelMap]) {
      moodCountMap.set(log.mood, (moodCountMap.get(log.mood) ?? 0) + 1);
    }

    if (typeof log.energyLevel === "number") {
      energyValues.push(log.energyLevel);
    }
  }

  const dominantMoodKey = Array.from(moodCountMap.entries()).sort((left, right) => right[1] - left[1])[0]?.[0];
  const dominantMoodLabel = dominantMoodKey
    ? moodLabelMap[dominantMoodKey as keyof typeof moodLabelMap]
    : "暂无记录";
  const averageEnergyLevel =
    energyValues.length > 0
      ? `${Math.round((energyValues.reduce((sum, value) => sum + value, 0) / energyValues.length) * 10) / 10}/5`
      : "暂无记录";

  return [
    { label: "主导状态", value: dominantMoodLabel },
    { label: "平均精力", value: averageEnergyLevel },
  ];
}

function buildDelayReasonRows(taskRows: ConsoleTaskRecord[], taskLogRows: ConsoleTaskLogRecord[]) {
  const delayReasonMap = new Map<string, number>();
  const delaySources =
    taskLogRows.some((log) => Boolean(log.delayReason))
      ? taskLogRows.map((log) => log.delayReason)
      : taskRows.map((task) => task.delayReason);

  for (const delayReason of delaySources) {
    if (!delayReason) {
      continue;
    }

    delayReasonMap.set(delayReason, (delayReasonMap.get(delayReason) ?? 0) + 1);
  }

  return Array.from(delayReasonMap.entries()).map(([delayReason, count]) => ({
    delayReason,
    count,
  }));
}

export function summarizeDelayReasons(rows: DelayReasonRow[]): DelayReasonSummary[] {
  return [...rows]
    .filter((row) => Boolean(row.delayReason))
    .sort((left, right) => right.count - left.count)
    .map((row) => ({
      reason: row.delayReason as string,
      count: row.count,
    }));
}

export function buildConsoleOverviewFromRecords(input: {
  tasks: ConsoleTaskRecord[];
  taskLogs: ConsoleTaskLogRecord[];
  goals: ConsoleGoalRecord[];
  reviews: ConsoleReviewRecord[];
  events: ConsoleEventRecord[];
}) {
  const activeTasks = input.tasks.filter((task) => ACTIVE_STATUSES.has(task.status));
  const totalTasks = input.tasks.length;
  const uniqueActiveDays = new Set(activeTasks.map((task) => task.plannedDate)).size;
  const quickStartRate = totalTasks === 0 ? 0 : Math.round((activeTasks.length / totalTasks) * 100);

  const trendMap = new Map<string, number>();
  for (const task of activeTasks) {
    const day = toWeekdayLabel(task.plannedDate);
    trendMap.set(day, (trendMap.get(day) ?? 0) + 1);
  }

  return {
    northStar: [
      { label: "周有效行动次数", value: activeTasks.length },
      { label: "周复盘完成率", value: `${input.reviews[0]?.completionRate ?? 0}%` },
      { label: "本周连续行动天数", value: uniqueActiveDays },
      { label: "20 分钟动作启动率", value: `${quickStartRate}%` },
    ],
    delayReasons: summarizeDelayReasons(buildDelayReasonRows(input.tasks, input.taskLogs)),
    actionTrend: WEEKDAY_ORDER.map((day) => ({
      day,
      count: trendMap.get(day) ?? 0,
    })),
    funnel: buildFunnel(input.events),
    reviewUsage: buildReviewUsage(input.reviews),
    sessionSignals: buildSessionSignals(input.taskLogs),
    userSegments: buildUserSegments(input.goals),
  };
}

export async function getConsoleOverviewFromDb(db: AppDb) {
  const [taskRows, taskLogRows, goalRows, reviewRows, eventRows] = await Promise.all([
    db
      .select({
        plannedDate: tasks.plannedDate,
        status: tasks.status,
        delayReason: tasks.delayReason,
      })
      .from(tasks),
    db
      .select({
        delayReason: taskLogs.delayReason,
        mood: taskLogs.mood,
        energyLevel: taskLogs.energyLevel,
        loggedAt: taskLogs.loggedAt,
      })
      .from(taskLogs),
    db
      .select({
        category: goals.category,
      })
      .from(goals),
    db
      .select({
        completionRate: reviews.completionRate,
      })
      .from(reviews)
      .orderBy(desc(reviews.weekStart)),
    db
      .select({
        eventName: events.eventName,
        eventPayload: events.eventPayload,
      })
      .from(events),
  ]);

  return buildConsoleOverviewFromRecords({
    tasks: taskRows,
    taskLogs: taskLogRows,
    goals: goalRows,
    reviews: reviewRows,
    events: eventRows,
  });
}
