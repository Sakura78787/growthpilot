import { drizzle } from "drizzle-orm/d1";

import { assertEnv, type CloudflareEnv } from "@/lib/cloudflare/env";
import * as schema from "@/lib/db/schema";

export function getDb(env: Partial<CloudflareEnv> | undefined) {
  return drizzle(assertEnv(env).DB, { schema });
}

export type AppDb = ReturnType<typeof getDb>;
