import { SiteShell } from "@/components/layout/site-shell";
import { ReviewSummary } from "@/components/review/review-summary";
import { generateWeeklyReview } from "@/lib/ai/review-generator";
import { resolveAiOptionsFromEnv } from "@/lib/ai/resolve-ai-options";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { buildReviewSourceFromTasks, buildReviewViewModel, getLatestReview } from "@/lib/db/queries/reviews";
import { listAllTasks, listTaskLogs } from "@/lib/db/queries/tasks";

export const dynamic = "force-dynamic";

let pendingReviewCache: Promise<{
  summary: string;
  advice: string;
  highlights: string[];
  description: string;
}> | null = null;

export default async function ReviewPage() {
  const env = await getOptionalCloudflareEnv();
  const db = env?.DB ? getDb(env) : null;
  const aiOptions = resolveAiOptionsFromEnv(env);

  if (db) {
    const reviewPayload = await runWithOptionalDbFallback(async () => {
      const latestReview = await getLatestReview(db);

      if (latestReview) {
        return {
          summary: buildReviewViewModel(latestReview).summary,
          advice: buildReviewViewModel(latestReview).advice,
          highlights: buildReviewViewModel(latestReview).highlights,
          description: "这页优先展示已经写入数据库的最近一次复盘记录。",
        };
      }

      const [taskRows, taskLogRows] = await Promise.all([listAllTasks(db), listTaskLogs(db)]);
      const source = buildReviewSourceFromTasks(taskRows, taskLogRows);
      const review = await generateWeeklyReview(source, aiOptions);

      return {
        ...review,
        description: "当前还没有数据库里的复盘记录，所以先根据已记录的任务状态和执行感受即时生成一版中文复盘。",
      };
    }, null as {
      summary: string;
      advice: string;
      highlights: string[];
      description: string;
    } | null);

    if (reviewPayload) {
      return (
        <SiteShell title="本周复盘" description={reviewPayload.description}>
          <ReviewSummary
            summary={reviewPayload.summary}
            advice={reviewPayload.advice}
            highlights={reviewPayload.highlights}
          />
        </SiteShell>
      );
    }
  }

  if (!pendingReviewCache) {
    pendingReviewCache = generateWeeklyReview(undefined, aiOptions).then((review) => ({
      ...review,
      description: "当前没有数据库里的复盘记录，所以先根据已记录的任务状态和执行感受即时生成一版中文复盘。",
    }));
  }
  const review = await pendingReviewCache;

  return (
    <SiteShell title="本周复盘" description={review.description}>
      <ReviewSummary summary={review.summary} advice={review.advice} highlights={review.highlights} />
    </SiteShell>
  );
}
