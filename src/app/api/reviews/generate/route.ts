import { NextRequest, NextResponse } from "next/server";

import { generateWeeklyReview } from "@/lib/ai/review-generator";
import { trackEvent } from "@/lib/analytics/events";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { buildReviewSourceFromTasks, createReviewRecord } from "@/lib/db/queries/reviews";
import { listAllTasks, listTaskLogs } from "@/lib/db/queries/tasks";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as {
    completionRate?: number;
    topDelayReason?: string;
    bestFocusPeriod?: string;
    dominantMoodLabel?: string;
    averageEnergyLevel?: number;
  };

  const env = await getOptionalCloudflareEnv();
  const db = env?.DB ? getDb(env) : null;

  if (db) {
    const persistedReview = await runWithOptionalDbFallback(async () => {
      const [taskRows, taskLogRows] = await Promise.all([listAllTasks(db), listTaskLogs(db)]);
      const source = buildReviewSourceFromTasks(taskRows, taskLogRows);
      const merged = {
        completionRate: payload.completionRate ?? source.completionRate,
        topDelayReason: payload.topDelayReason ?? source.topDelayReason,
        bestFocusPeriod: payload.bestFocusPeriod ?? source.bestFocusPeriod,
        dominantMoodLabel: payload.dominantMoodLabel ?? source.dominantMoodLabel,
        averageEnergyLevel: payload.averageEnergyLevel ?? source.averageEnergyLevel,
      };
      const review = await generateWeeklyReview(merged);

      await createReviewRecord(db, {
        ...merged,
        summary: review.summary,
        advice: review.advice,
      });

      await trackEvent(db, {
        userId: "growthpilot-demo-user",
        eventName: "review.generated",
        eventPayload: merged,
      });

      return review;
    }, null as Awaited<ReturnType<typeof generateWeeklyReview>> | null);

    if (persistedReview) {
      return NextResponse.json(persistedReview);
    }
  }

  return NextResponse.json(await generateWeeklyReview(payload));
}
