import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_USER_ID } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics/events";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { updateTaskById } from "@/lib/db/queries/tasks";
import { taskUpdateSchema } from "@/lib/validation/tasks";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const payload = taskUpdateSchema.parse(await request.json());
    const { taskId } = await context.params;
    const env = await getOptionalCloudflareEnv();
    const db = env?.DB ? getDb(env) : null;

    if (db) {
      const persisted = await runWithOptionalDbFallback(async () => {
        const result = await updateTaskById(db, taskId, payload, {
          userId: DEFAULT_USER_ID,
        });

        if (result.task) {
          await trackEvent(db, {
            userId: DEFAULT_USER_ID,
            eventName:
              payload.status === "doing"
                ? "task.started"
                : payload.status === "done"
                  ? "task.completed"
                  : "task.updated",
            eventPayload: {
              taskId,
              status: payload.status,
              mood: payload.mood,
              energyLevel: payload.energyLevel,
            },
          });
        }

        return result;
      }, null as Awaited<ReturnType<typeof updateTaskById>> | null);

      if (persisted) {
        return NextResponse.json({
          ok: true,
          log: persisted.logRecord,
          task: persisted.task ?? {
            id: taskId,
            ...payload,
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      log: {
        taskId,
        result: payload.status,
        mood: payload.mood ?? null,
        energyLevel: payload.energyLevel ?? null,
      },
      task: {
        id: taskId,
        ...payload,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          errors: error.issues.map((issue) => issue.message),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        errors: ["更新任务状态时出现了意外错误，请稍后再试。"],
      },
      { status: 500 },
    );
  }
}
