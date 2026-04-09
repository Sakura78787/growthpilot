import { NextResponse } from "next/server";

import { getOptionalCloudflareEnv, runWithOptionalDbFallback } from "@/lib/cloudflare/env";
import { getDb } from "@/lib/db/client";
import { getConsoleOverviewFromDb } from "@/lib/db/queries/analytics";
import { getFallbackConsoleOverview } from "@/lib/mock/console-overview";

export async function GET() {
  const env = await getOptionalCloudflareEnv();
  const overview = env?.DB
    ? await runWithOptionalDbFallback(() => getConsoleOverviewFromDb(getDb(env)), getFallbackConsoleOverview())
    : getFallbackConsoleOverview();

  return NextResponse.json(overview);
}
