import { and, asc, eq, lte } from "drizzle-orm";
import { OutboxStatus } from "@tickethub/shared";

import { db, sqlClient } from "../database/db";
import { outbox } from "../database/schema";
import { emailQueue } from "./email.queue";

// Chỉ kiểm tra, chưa thay đổi dữ liệu.
const STALE_AFTER_MS = 5 * 60 * 1000;

async function main() {
  console.log("[Recovery] Checking stuck Outbox events...");

  const cutoff = new Date(Date.now() - STALE_AFTER_MS);

  const events = await db
    .select({
      id: outbox.id,
      eventType: outbox.eventType,
      status: outbox.status,
      retryCount: outbox.retryCount,
      updatedAt: outbox.updatedAt,
    })
    .from(outbox)
    .where(
      and(
        eq(outbox.status, OutboxStatus.PROCESSING),
        eq(outbox.eventType, "USER_REGISTERED"),
        lte(outbox.updatedAt, cutoff),
      ),
    )
    .orderBy(asc(outbox.updatedAt))
    .limit(20);

  console.log(`[Recovery] Found ${events.length} stale events`);

  for (const event of events) {
    const jobId = `outbox_${event.id}`;

    const job = await emailQueue.getJob(jobId);

    const jobState = job ? await job.getState() : "missing";

    console.log({
      outboxId: event.id,
      status: event.status,
      retryCount: event.retryCount,
      jobState,
      updatedAt: event.updatedAt,
    });

    // Tuyệt đối chưa tự động đổi trạng thái.
    // Job completed hiện chỉ là email giả lập.
  }

  console.log("[Recovery] Inspection finished");
}

main()
  .catch((error: unknown) => {
    console.error("[Recovery] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await emailQueue.close();
    await sqlClient.end();
  });
