import { desc } from "drizzle-orm";

import type { AppDb } from "@/lib/db/client";
import { goalCategoryLabels } from "@/lib/db/queries/goals";
import { goals, reviews, taskLogs, tasks } from "@/lib/db/schema";

type ProfileGoalRecord = {
  title: string;
  category: string;
};

type ProfileTaskRecord = {
  title: string;
  status: string;
  plannedDate: string;
  actualStartTime: string | null;
};

type ProfileTaskLogRecord = {
  mood: string | null;
  energyLevel: number | null;
  loggedAt: string;
  delayReason: string | null;
};

type ProfileReviewRecord = {
  completionRate: number;
  bestFocusPeriod: string | null;
  nextWeekAdvice: string;
};

export type ProfileViewModel = {
  headline: string;
  badges: string[];
  streakLabel: string;
  preferredWindowLabel: string;
  recentHighlight: string;
  nextAdvice: string;
  recentMoments: string[];
};

function computeActionStreak(tasksInput: ProfileTaskRecord[]) {
  const activeDates = Array.from(
    new Set(tasksInput.filter((task) => task.status === "doing" || task.status === "done").map((task) => task.plannedDate)),
  ).sort();

  if (activeDates.length === 0) {
    return 0;
  }

  let streak = 1;
  for (let index = activeDates.length - 1; index > 0; index -= 1) {
    const current = new Date(activeDates[index] ?? "");
    const previous = new Date(activeDates[index - 1] ?? "");
    const diff = (current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000);

    if (diff === 1) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

function buildPreferredWindow(reviewsInput: ProfileReviewRecord[], tasksInput: ProfileTaskRecord[]) {
  const preferredWindow = reviewsInput[0]?.bestFocusPeriod;
  if (preferredWindow) {
    return preferredWindow;
  }

  return tasksInput.some((task) => Boolean(task.actualStartTime)) ? "20:00 - 22:00" : "19:00 - 21:00";
}

function buildBadges(goalsInput: ProfileGoalRecord[], streak: number, reviewsInput: ProfileReviewRecord[]) {
  const primaryGoal = goalsInput[0];
  const categoryKey = (primaryGoal && primaryGoal.category in goalCategoryLabels
    ? primaryGoal.category
    : "job") as keyof typeof goalCategoryLabels;
  const badges = [`${goalCategoryLabels[categoryKey]}推进型`];

  if (streak >= 3) {
    badges.push("连续行动中");
  } else {
    badges.push("轻量起步派");
  }

  badges.push("持续积累");
  return badges;
}

function buildRecentHighlight(tasksInput: ProfileTaskRecord[], preferredWindowLabel: string) {
  const doneCount = tasksInput.filter((task) => task.status === "done").length;
  const doingCount = tasksInput.filter((task) => task.status === "doing").length;

  if (doneCount > 0) {
    return `已完成 ${doneCount} 个关键动作，${doingCount} 个正在推进。`;
  }

  return `建议在 ${preferredWindowLabel} 安排一个核心动作。`;
}

function buildRecentMoments(tasksInput: ProfileTaskRecord[], reviewsInput: ProfileReviewRecord[]) {
  const activeMoments = tasksInput
    .filter((task) => task.status !== "todo")
    .slice(0, 2)
    .map((task) => `${task.status === "done" ? "最近完成" : "当前推进"}：${task.title}`);

  if (reviewsInput[0]) {
    activeMoments.push(`复盘记录：本周完成率 ${reviewsInput[0].completionRate}%`);
  }

  return activeMoments;
}

export function buildProfileViewFromRecords(input: {
  goals: ProfileGoalRecord[];
  tasks: ProfileTaskRecord[];
  taskLogs: ProfileTaskLogRecord[];
  reviews: ProfileReviewRecord[];
}): ProfileViewModel {
  const headline = input.goals[0]?.title ?? "先设定一个值得长期推进的目标";
  const streak = computeActionStreak(input.tasks);
  const preferredWindowLabel = buildPreferredWindow(input.reviews, input.tasks);
  const firstDelayReason = input.taskLogs.find((log) => Boolean(log.delayReason))?.delayReason;
  const fallbackAdvice = firstDelayReason
    ? `下周优先处理「${firstDelayReason || "阻碍"}」相关任务。`
    : `下周建议在 ${preferredWindowLabel} 安排一个可启动的核心动作。`;

  return {
    headline,
    badges: buildBadges(input.goals, streak, input.reviews),
    streakLabel: `连续行动 ${streak} 天`,
    preferredWindowLabel,
    recentHighlight: buildRecentHighlight(input.tasks, preferredWindowLabel),
    nextAdvice: input.reviews[0]?.nextWeekAdvice ?? fallbackAdvice,
    recentMoments: buildRecentMoments(input.tasks, input.reviews),
  };
}

export async function getProfileViewFromDb(db: AppDb) {
  const [goalRows, taskRows, taskLogRows, reviewRows] = await Promise.all([
    db
      .select({
        title: goals.title,
        category: goals.category,
      })
      .from(goals)
      .orderBy(desc(goals.createdAt)),
    db
      .select({
        title: tasks.title,
        status: tasks.status,
        plannedDate: tasks.plannedDate,
        actualStartTime: tasks.actualStartTime,
      })
      .from(tasks)
      .orderBy(desc(tasks.plannedDate)),
    db
      .select({
        mood: taskLogs.mood,
        energyLevel: taskLogs.energyLevel,
        loggedAt: taskLogs.loggedAt,
        delayReason: taskLogs.delayReason,
      })
      .from(taskLogs)
      .orderBy(desc(taskLogs.loggedAt)),
    db
      .select({
        completionRate: reviews.completionRate,
        bestFocusPeriod: reviews.bestFocusPeriod,
        nextWeekAdvice: reviews.nextWeekAdvice,
      })
      .from(reviews)
      .orderBy(desc(reviews.weekStart)),
  ]);

  return buildProfileViewFromRecords({
    goals: goalRows,
    tasks: taskRows,
    taskLogs: taskLogRows,
    reviews: reviewRows,
  });
}
