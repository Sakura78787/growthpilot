import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AnyD1Database } from "drizzle-orm/d1";

export type CloudflareEnv = {
  DB: AnyD1Database;
  DASHSCOPE_API_KEY?: string;
  DASHSCOPE_MODEL?: string;
};

export function assertEnv(env: Partial<CloudflareEnv> | undefined): CloudflareEnv {
  if (!env?.DB) {
    throw new Error("Cloudflare D1 binding `DB` is required.");
  }

  return env as CloudflareEnv;
}

export async function getOptionalCloudflareEnv() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env as Partial<CloudflareEnv>;
  } catch {
    return undefined;
  }
}

export async function runWithOptionalDbFallback<T>(
  operation: () => Promise<T>,
  fallbackValue: T,
) {
  try {
    return await operation();
  } catch {
    return fallbackValue;
  }
}
