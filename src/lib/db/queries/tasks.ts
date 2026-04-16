import { and, asc, eq, or } from "drizzle-orm";

import { DEFAULT_USER_ID } from "@/lib/constants";
import type { AppDb } from "@/lib/db/client";
import { taskLogs, tasks } from "@/lib/db/schema";
import type { TaskUpdateInput } from "@/lib/validation/tasks";

export { taskLogs, tasks } from "@/lib/db/schema";

export const taskStatuses = ["todo", "doing", "done", "skipped"] as const;

export type TaskStatus = (typeof taskStatuses)[number];

type BuildTaskUpdateArtifactsInput = {
  taskId: string;
  userId: string;
  payload: TaskUpdateInput;
  now?: string;
  idGenerator?: () => string;
};

export function buildTaskUpdateArtifacts(input: BuildTaskUpdateArtifactsInput) {
  const now = input.now ?? new Date().toISOString();

  return {
    taskPatch: {
      status: input.payload.status,
      delayReason: input.payload.delayReason ?? null,
      actualStartTime: input.payload.status === "doing" ? now : undefined,
      actualEndTime: input.payload.status === "done" ? now : undefined,
      completionNote: input.payload.completionNote ?? null,
    },
    logRecord: {
      id: input.idGenerator?.() ?? crypto.randomUUID(),
      taskId: input.taskId,
      userId: input.userId,
      result: input.payload.status,
      delayReason: input.payload.delayReason ?? null,
      mood: input.payload.mood ?? null,
      energyLevel: input.payload.energyLevel ?? null,
      loggedAt: now,
    },
  };
}

export async function updateTaskById(
  db: AppDb,
  taskId: string,
  payload: TaskUpdateInput,
  options: { userId?: string } = {},
) {
  const { taskPatch, logRecord } = buildTaskUpdateArtifacts({
    taskId,
    userId: options.userId ?? DEFAULT_USER_ID,
    payload,
  });

  await db
    .update(tasks)
    .set(taskPatch)
    .where(eq(tasks.id, taskId));

  await db.insert(taskLogs).values(logRecord);

  const rows = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  return {
    task: rows[0] ?? null,
    logRecord,
  };
}

export async function listAllTasks(db: AppDb) {
  return db.select().from(tasks);
}

export async function listTaskLogs(db: AppDb) {
  return db
    .select({
      result: taskLogs.result,
      delayReason: taskLogs.delayReason,
      mood: taskLogs.mood,
      energyLevel: taskLogs.energyLevel,
      loggedAt: taskLogs.loggedAt,
    })
    .from(taskLogs);
}

async function selectFocusTaskRow(
  db: AppDb,
  options: { goalId?: string } = {},
) {
  const statusActive = or(eq(tasks.status, "doing"), eq(tasks.status, "todo"));
  const whereClause = options.goalId ? and(eq(tasks.goalId, options.goalId), statusActive) : statusActive;

  const rows = await db
    .select({
      id: tasks.id,
      goalId: tasks.goalId,
      title: tasks.title,
      plannedDuration: tasks.plannedDuration,
      status: tasks.status,
      plannedDate: tasks.plannedDate,
    })
    .from(tasks)
    .where(whereClause)
    .orderBy(asc(tasks.plannedDate));

  return rows.find((task) => task.status === "doing") ?? rows[0] ?? null;
}

/** 优先返回 doing，其次最早待办的 todo。若传入 goalId 则只在该目标下查找；无结果时可回退到全局。 */
export async function getFocusTask(db: AppDb, options: { goalId?: string } = {}) {
  const goalId = options.goalId?.trim();
  if (goalId) {
    const scoped = await selectFocusTaskRow(db, { goalId });
    if (scoped) {
      return scoped;
    }
  }

  return selectFocusTaskRow(db, {});
}
