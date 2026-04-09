import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { generatePersonalizedGoalPlan } from "@/lib/ai/goal-planner";
import { trackEvent } from "@/lib/analytics/events";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { buildGoalGraph } from "@/lib/db/mappers";
import { createGoalWithPlan } from "@/lib/db/queries/goals";
import { goalRequestSchema } from "@/lib/validation/goals";

export async function POST(request: NextRequest) {
  try {
    const payload = goalRequestSchema.parse(await request.json());
    const personalized = await generatePersonalizedGoalPlan(payload);

    const profileSnapshot = {
      currentLevel: payload.currentLevel,
      dailyMinutes: payload.dailyMinutes,
      mainBlocker: payload.mainBlocker,
      planSource: personalized.planSource,
      planReason: personalized.planReason,
    } as const;

    const env = await getOptionalCloudflareEnv();
    const db = env?.DB ? getDb(env) : null;

    const graph = db
      ? await runWithOptionalDbFallback(
          async () => {
            const created = await createGoalWithPlan(db, payload, {
              plan: personalized.plan,
              profileSnapshot,
            });

            await trackEvent(db, {
              userId: created.goal.userId,
              eventName: "goal.created",
              eventPayload: {
                goalId: created.goal.id,
                category: created.goal.category,
                planSource: personalized.planSource,
              },
            });

            return created;
          },
          buildGoalGraph(payload, {
            plan: personalized.plan,
            profileSnapshot,
          }),
        )
      : buildGoalGraph(payload, {
          plan: personalized.plan,
          profileSnapshot,
        });

    return NextResponse.json({
      ok: true,
      planSource: personalized.planSource,
      planReason: personalized.planReason,
      goal: {
        ...graph.goal,
        milestones: graph.milestones,
        tasks: graph.tasks,
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
        errors: ["生成计划时出现了意外错误，请稍后再试。"],
      },
      { status: 500 },
    );
  }
}
