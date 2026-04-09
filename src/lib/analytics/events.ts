import type { AppDb } from "@/lib/db/client";
import { events } from "@/lib/db/schema";

type TrackEventInput = {
  userId: string;
  eventName: string;
  eventPayload: Record<string, unknown>;
};

export async function trackEvent(db: AppDb, input: TrackEventInput) {
  await db.insert(events).values({
    id: crypto.randomUUID(),
    userId: input.userId,
    eventName: input.eventName,
    eventPayload: JSON.stringify(input.eventPayload),
    createdAt: new Date(),
  });
}
