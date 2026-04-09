import { buildConsoleOverviewFromRecords } from "@/lib/db/queries/analytics";

const fallbackTasks = [
  { plannedDate: "2026-04-07", status: "done", delayReason: null },
  { plannedDate: "2026-04-08", status: "doing", delayReason: "任务太大" },
  { plannedDate: "2026-04-08", status: "todo", delayReason: "任务太大" },
  { plannedDate: "2026-04-09", status: "done", delayReason: "状态差" },
  { plannedDate: "2026-04-10", status: "doing", delayReason: null },
];

const fallbackTaskLogs = [
  { delayReason: null, mood: "motivated", energyLevel: 4, loggedAt: "2026-04-07T13:10:00.000Z" },
  { delayReason: "任务太大", mood: "motivated", energyLevel: 5, loggedAt: "2026-04-08T13:30:00.000Z" },
  { delayReason: null, mood: "steady", energyLevel: 3, loggedAt: "2026-04-09T12:45:00.000Z" },
];

const fallbackGoals = [
  { category: "job" },
  { category: "job" },
  { category: "study" },
  { category: "discipline" },
];

const fallbackReviews = [
  { completionRate: 72 },
  { completionRate: 68 },
];

const fallbackEvents = [
  { eventName: "goal.created", eventPayload: "{\"goalId\":\"goal-demo-1\"}" },
  { eventName: "goal.created", eventPayload: "{\"goalId\":\"goal-demo-2\"}" },
  { eventName: "task.updated", eventPayload: "{\"status\":\"doing\"}" },
  { eventName: "task.updated", eventPayload: "{\"status\":\"doing\"}" },
  { eventName: "task.updated", eventPayload: "{\"status\":\"done\"}" },
  { eventName: "review.generated", eventPayload: "{\"weekStart\":\"2026-04-07\"}" },
];

export function getFallbackConsoleOverview() {
  return buildConsoleOverviewFromRecords({
    tasks: fallbackTasks,
    taskLogs: fallbackTaskLogs,
    goals: fallbackGoals,
    reviews: fallbackReviews,
    events: fallbackEvents,
  });
}
