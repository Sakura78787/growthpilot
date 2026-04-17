import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { generatePersonalizedGoalPlan } from "@/lib/ai/goal-planner";
import { resolveAiOptionsFromEnv } from "@/lib/ai/resolve-ai-options";
import { trackEvent } from "@/lib/analytics/events";
import { getOptionalCloudflareEnv } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { buildGoalGraph } from "@/lib/db/mappers";
import { createGoalWithPlan } from "@/lib/db/queries/goals";
import { goalRequestSchema } from "@/lib/validation/goals";

export async function POST(request: NextRequest) {
  try {
    const payload = goalRequestSchema.parse(await request.json());
    const env = await getOptionalCloudflareEnv();
    const aiOptions = resolveAiOptionsFromEnv(env);
    const personalized = await generatePersonalizedGoalPlan(payload, aiOptions);

    const profileSnapshot = {
      currentLevel: payload.currentLevel,
      dailyMinutes: payload.dailyMinutes,
      mainBlocker: payload.mainBlocker,
      planSource: personalized.planSource,
      planReason: personalized.planReason,
    } as const;

    const graph = buildGoalGraph(payload, {
      plan: personalized.plan,
      profileSnapshot,
    });

    const db = env?.DB ? getDb(env) : null;
    if (db) {
      createGoalWithPlan(db, payload, {
        plan: personalized.plan,
        profileSnapshot,
      })
        .then((created) => {
          trackEvent(db, {
            userId: created.goal.userId,
            eventName: "goal.created",
            eventPayload: {
              goalId: created.goal.id,
              category: created.goal.category,
              planSource: personalized.planSource,
            },
          }).catch(() => {});
        })
        .catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      planSource: personalized.planSource,
      planReason: personalized.planReason,
      planSeed: personalized.plan,
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