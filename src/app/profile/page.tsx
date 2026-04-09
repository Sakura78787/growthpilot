import { SiteShell } from "@/components/layout/site-shell";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { getProfileViewFromDb } from "@/lib/db/queries/profile";
import { getFallbackProfileOverview } from "@/lib/mock/profile-overview";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const env = await getOptionalCloudflareEnv();
  const view = env?.DB
    ? await runWithOptionalDbFallback(() => getProfileViewFromDb(getDb(env)), getFallbackProfileOverview())
    : getFallbackProfileOverview();

  return (
    <SiteShell
      title="我的成长档案"
      description="把你的行动风格、节奏偏好和最近亮点整理成一页可讲故事的成长快照。"
    >
      <ProfileSummary {...view} />
    </SiteShell>
  );
}
