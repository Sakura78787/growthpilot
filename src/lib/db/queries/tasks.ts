import { asc, eq, or } from "drizzle-orm";

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
    userId: options.userId ?? "growthpilot-demo-user",
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

export async function getFocusTask(db: AppDb) {
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      plannedDuration: tasks.plannedDuration,
      status: tasks.status,
      plannedDate: tasks.plannedDate,
    })
    .from(tasks)
    .where(or(eq(tasks.status, "doing"), eq(tasks.status, "todo")))
    .orderBy(asc(tasks.plannedDate));

  return rows.find((task) => task.status === "doing") ?? rows[0] ?? null;
}
