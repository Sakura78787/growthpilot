import { desc } from "drizzle-orm";

import { DEFAULT_USER_ID } from "@/lib/constants";
import type { AppDb } from "@/lib/db/client";
import { reviews } from "@/lib/db/schema";

export { reviews } from "@/lib/db/schema";

export type ReviewSnapshot = {
  summary: string;
  advice: string;
  completionRate: number;
};

export type ReviewTaskSource = {
  status: string;
  delayReason: string | null;
  actualStartTime: string | null;
  completionNote?: string | null;
};

export type ReviewTaskLogSource = {
  result: string;
  delayReason: string | null;
  mood: string | null;
  energyLevel: number | null;
  loggedAt: string;
};

export type ReviewSource = {
  completionRate: number;
  topDelayReason: string;
  bestFocusPeriod: string;
  dominantMoodLabel?: string;
  averageEnergyLevel?: number;
  recentNotes?: string[];
};

const moodLabelMap = {
  steady: "稳稳推进",
  tired: "有点疲惫",
  anxious: "有些焦虑",
  motivated: "很有干劲",
} as const;

function toChinaHour(value: string) {
  const date = new Date(value);
  return (date.getUTCHours() + 8) % 24;
}

function mapHourToPeriod(hour: number) {
  if (hour >= 8 && hour < 12) {
    return "08:00 - 10:00";
  }

  if (hour >= 14 && hour < 18) {
    return "14:00 - 16:00";
  }

  return "20:00 - 22:00";
}

function buildTopDelayReason(tasks: ReviewTaskSource[], taskLogs: ReviewTaskLogSource[]) {
  const delayReasonMap = new Map<string, number>();
  const delaySources =
    taskLogs.some((log) => Boolean(log.delayReason))
      ? taskLogs.map((log) => log.delayReason)
      : tasks.map((task) => task.delayReason);

  for (const delayReason of delaySources) {
    if (!delayReason) {
      continue;
    }

    delayReasonMap.set(delayReason, (delayReasonMap.get(delayReason) ?? 0) + 1);
  }

  return Array.from(delayReasonMap.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "暂无明显拖延原因";
}

function buildBestFocusPeriod(tasks: ReviewTaskSource[]) {
  const focusPeriodMap = new Map<string, number>();
  for (const task of tasks) {
    if (!task.actualStartTime) {
      continue;
    }

    const period = mapHourToPeriod(toChinaHour(task.actualStartTime));
    focusPeriodMap.set(period, (focusPeriodMap.get(period) ?? 0) + 1);
  }

  return Array.from(focusPeriodMap.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "20:00 - 22:00";
}

function buildMoodSignals(taskLogs: ReviewTaskLogSource[]) {
  const moodCountMap = new Map<string, number>();
  const energyValues: number[] = [];

  for (const log of taskLogs) {
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
    : undefined;

  const averageEnergyLevel =
    energyValues.length > 0
      ? Math.round((energyValues.reduce((sum, value) => sum + value, 0) / energyValues.length) * 10) / 10
      : undefined;

  return {
    dominantMoodLabel,
    averageEnergyLevel,
  };
}

function buildRecentNotes(tasks: ReviewTaskSource[]) {
  const notes = tasks
    .filter((task) => task.status === "done")
    .map((task) => task.completionNote?.trim() ?? "")
    .filter((note) => note.length > 0);

  return notes.slice(0, 2);
}

export function buildReviewSourceFromTasks(
  tasks: ReviewTaskSource[],
  taskLogs: ReviewTaskLogSource[] = [],
): ReviewSource {
  const doneCount = tasks.filter((task) => task.status === "done").length;
  const completionRate = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  const moodSignals = buildMoodSignals(taskLogs);

  return {
    completionRate,
    topDelayReason: buildTopDelayReason(tasks, taskLogs),
    bestFocusPeriod: buildBestFocusPeriod(tasks),
    dominantMoodLabel: moodSignals.dominantMoodLabel,
    averageEnergyLevel: moodSignals.averageEnergyLevel,
    recentNotes: buildRecentNotes(tasks),
  };
}

export function buildReviewViewModel(review: {
  completionRate: number;
  topDelayReason: string | null;
  bestFocusPeriod: string | null;
  aiSummary: string;
  nextWeekAdvice: string;
}) {
  return {
    summary: review.aiSummary,
    advice: review.nextWeekAdvice,
    highlights: [
      `本周完成率 ${review.completionRate}%`,
      `最稳时段：${review.bestFocusPeriod ?? "20:00 - 22:00"}`,
      `优先处理：${review.topDelayReason ?? "暂无明显拖延原因"}`,
    ],
  };
}

export async function createReviewRecord(
  db: AppDb,
  input: ReviewSource & {
    summary: string;
    advice: string;
    userId?: string;
    weekStart?: string;
  },
) {
  const now = new Date();
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + mondayOffset);

  const row = {
    id: crypto.randomUUID(),
    userId: input.userId ?? DEFAULT_USER_ID,
    weekStart: input.weekStart ?? monday.toISOString().slice(0, 10),
    completionRate: input.completionRate,
    topDelayReason: input.topDelayReason,
    bestFocusPeriod: input.bestFocusPeriod,
    aiSummary: input.summary,
    nextWeekAdvice: input.advice,
  };

  await db.insert(reviews).values(row);
  return row;
}

export async function getLatestReview(db: AppDb) {
  const rows = await db.select().from(reviews).orderBy(desc(reviews.weekStart)).limit(1);
  return rows[0] ?? null;
}
