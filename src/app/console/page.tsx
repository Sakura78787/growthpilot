import Link from "next/link";

import { ActionTrendChart } from "@/components/charts/action-trend-chart";
import { DelayReasonChart } from "@/components/charts/delay-reason-chart";
import { ConversionFunnel } from "@/components/console/conversion-funnel";
import { MetricGrid } from "@/components/console/metric-grid";
import { SegmentCards } from "@/components/console/segment-cards";
import { SiteShell } from "@/components/layout/site-shell";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { getConsoleOverviewFromDb } from "@/lib/db/queries/analytics";
import { getFallbackConsoleOverview } from "@/lib/mock/console-overview";

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  const env = await getOptionalCloudflareEnv();
  const overview = env?.DB
    ? await runWithOptionalDbFallback(() => getConsoleOverviewFromDb(getDb(env)), getFallbackConsoleOverview())
    : getFallbackConsoleOverview();

  return (
    <SiteShell
      title="PM 数据后台"
      description="把行动、复盘和拖延原因翻译成能讲故事的数据面板，这样你的项目不只是好看，也更像一个产品。"
    >
      <section className="console-stack">
        <article className="shell-panel shell-panel-strong">
          <div className="detail-banner">
            <div>
              <p className="section-chip">北极星指标</p>
              <h2 className="panel-title">先看有没有形成稳定行为，再谈增长</h2>
              <p className="panel-copy">
                这一页会帮助你在作品集里讲清楚：用户为什么能坚持、卡在哪里、闭环是否形成，以及你做了什么优化。
              </p>
            </div>
            <Link href="/review" className="secondary-link">
              查看本周复盘
            </Link>
          </div>
        </article>

        <MetricGrid items={overview.northStar} />

        <div className="chart-grid">
          <DelayReasonChart data={overview.delayReasons} />
          <ActionTrendChart data={overview.actionTrend} />
        </div>

        <ConversionFunnel items={overview.funnel} />

        <div className="profile-grid">
          <section className="shell-panel shell-panel-soft">
            <p className="section-chip">复盘使用情况</p>
            <MetricGrid items={overview.reviewUsage} eyebrow="复盘使用情况" />
          </section>

          <section className="shell-panel shell-panel-soft">
            <p className="section-chip">执行感受</p>
            <MetricGrid items={overview.sessionSignals} eyebrow="执行感受" />
          </section>
        </div>

        <SegmentCards items={overview.userSegments} />
      </section>
    </SiteShell>
  );
}
