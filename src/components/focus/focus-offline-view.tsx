"use client";

import { useEffect, useState } from "react";

import { FocusSessionCard } from "@/components/focus/focus-session-card";
import { readLastGoalId, readOfflineGoalPlan } from "@/lib/client/offline-goal-plan";
import { buildGoalPlan, type GoalCategory } from "@/lib/mock/seed-data";

type FocusOfflineViewProps = {
  fallbackGoalTitle?: string;
  fallbackCategory?: GoalCategory;
};

export function FocusOfflineView({
  fallbackGoalTitle = "完成 20 分钟简历优化",
  fallbackCategory = "job",
}: FocusOfflineViewProps) {
  const [taskInfo, setTaskInfo] = useState<{
    id: string;
    title: string;
    duration: number;
  } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const lastGoalId = readLastGoalId();
    if (lastGoalId) {
      const stored = readOfflineGoalPlan(lastGoalId);
      if (stored?.planSeed) {
        const firstTask = stored.planSeed.tasks[0];
        if (firstTask) {
          setTaskInfo({
            id: `${lastGoalId}-task-1`,
            title: firstTask.title,
            duration: firstTask.suggestedDuration,
          });
        }
      }
    }
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  if (taskInfo) {
    return (
      <FocusSessionCard
        taskId={taskInfo.id}
        taskTitle={taskInfo.title}
        plannedDuration={taskInfo.duration}
      />
    );
  }

  const plan = buildGoalPlan({ title: fallbackGoalTitle, category: fallbackCategory });
  const firstTask = plan.tasks[0];

  return (
    <FocusSessionCard
      taskId="task-demo-1"
      taskTitle={firstTask?.title ?? fallbackGoalTitle}
      plannedDuration={firstTask?.suggestedDuration ?? 20}
    />
  );
}
