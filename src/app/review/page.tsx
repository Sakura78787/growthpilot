import { SiteShell } from "@/components/layout/site-shell";
import { ReviewSummary } from "@/components/review/review-summary";
import { generateWeeklyReview } from "@/lib/ai/review-generator";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { buildReviewSourceFromTasks, buildReviewViewModel, getLatestReview } from "@/lib/db/queries/reviews";
import { listAllTasks, listTaskLogs } from "@/lib/db/queries/tasks";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const env = await getOptionalCloudflareEnv();
  const db = env?.DB ? getDb(env) : null;

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
      const review = await generateWeeklyReview(source);

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

  const review = await generateWeeklyReview();

  return (
    <SiteShell
      title="本周复盘"
      description="把执行感受翻译成中文结论和下周建议，让复盘这件事不再像写检讨。"
    >
      <ReviewSummary summary={review.summary} advice={review.advice} highlights={review.highlights} />
    </SiteShell>
  );
}
