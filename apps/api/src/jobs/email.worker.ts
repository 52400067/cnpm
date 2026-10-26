import { Worker } from "bullmq";
import IORedis from "ioredis";
import { isDeepStrictEqual } from "node:util";
import { and, eq } from "drizzle-orm";
import { OutboxStatus } from "@tickethub/shared";

import { env } from "../config/env.config";
import { db, sqlClient } from "../database/db";
import { outbox } from "../database/schema";

import { sendRegistrationEmail, sendReviewEmail } from "./email.sender";

import {
  EMAIL_QUEUE_NAME,
  REVIEW_EVENT_TYPES,
  UserRegisteredPayloadSchema,
  parseReviewPayload,
} from "./email.types";

import type { EmailJobData, ReviewEventType } from "./email.types";

// Kết nối Redis cho BullMQ
const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const worker = new Worker<EmailJobData>(
  EMAIL_QUEUE_NAME,

  async (job) => {
    const { outboxId, eventType } = job.data;

    const isRegistration = eventType === "USER_REGISTERED";

    // 1. Kiểm tra loại công việc
    if (isRegistration) {
      if (job.name !== "user-registered") {
        throw new Error("Invalid registration job");
      }
    } else {
      if (
        job.name !== "admin-review" ||
        !REVIEW_EVENT_TYPES.includes(eventType as ReviewEventType)
      ) {
        throw new Error(`Unsupported job: ${job.name}`);
      }
    }

    console.log(`[Email Worker] Processing: ${outboxId}`);

    // 2. Lấy Outbox từ PostgreSQL
    const [event] = await db
      .select({
        id: outbox.id,
        eventType: outbox.eventType,
        payload: outbox.payload,
        status: outbox.status,
      })
      .from(outbox)
      .where(eq(outbox.id, outboxId))
      .limit(1);

    if (!event || event.eventType !== eventType) {
      throw new Error("Matching Outbox event not found");
    }

    // 3. Kiểm tra payload
    const reviewType = eventType as ReviewEventType;

    const jobPayload = isRegistration
      ? UserRegisteredPayloadSchema.parse(job.data.payload)
      : parseReviewPayload(reviewType, job.data.payload);

    const storedPayload = isRegistration
      ? UserRegisteredPayloadSchema.parse(event.payload)
      : parseReviewPayload(reviewType, event.payload);

    // Không sử dụng dữ liệu Redis nếu khác PostgreSQL
    if (!isDeepStrictEqual(jobPayload, storedPayload)) {
      throw new Error("Job payload does not match Outbox");
    }

    // 4. Chống xử lý lại sự kiện hoàn thành
    if (event.status === OutboxStatus.COMPLETED) {
      console.log("[Email Worker] Already completed");

      return { alreadyCompleted: true };
    }

    if (event.status !== OutboxStatus.PROCESSING) {
      throw new Error(`Unexpected Outbox status: ${event.status}`);
    }

    // 5. Kiểm tra chế độ gửi email
    const mode = process.env.EMAIL_WORKER_MODE ?? "mock";

    if (mode === "mock") {
      console.log("[Email Worker] Mock only - no email sent");

      // Giữ Outbox PROCESSING, không giả mạo đã gửi.
      // Chỉ sử dụng mock trên môi trường test cô lập.
      return { simulated: true };
    }

    if (mode === "live-test") {
      const testEmail = process.env.TEST_EMAIL_TO?.trim().toLowerCase();

      if (!testEmail || storedPayload.email.toLowerCase() !== testEmail) {
        throw new Error("Recipient is not TEST_EMAIL_TO");
      }
    } else if (mode === "live") {
      if (process.env.ENABLE_REAL_EMAIL !== "true") {
        throw new Error("Real email sending is disabled");
      }
    } else {
      throw new Error(`Unsupported mode: ${mode}`);
    }

    // 6. Gửi email theo loại event
    let emailId: string;

    if (isRegistration) {
      emailId = await sendRegistrationEmail(
        event.id,
        UserRegisteredPayloadSchema.parse(storedPayload),
      );
    } else {
      emailId = await sendReviewEmail(
        event.id,
        reviewType,
        parseReviewPayload(reviewType, storedPayload),
      );
    }

    // 7. Cập nhật Outbox sau khi Resend chấp nhận
    const [updated] = await db
      .update(outbox)
      .set({
        status: OutboxStatus.COMPLETED,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(outbox.id, event.id),
          eq(outbox.status, OutboxStatus.PROCESSING),
        ),
      )
      .returning({ id: outbox.id });

    if (!updated) {
      throw new Error("Email accepted but Outbox completion failed");
    }

    console.log(`[Email Worker] Outbox COMPLETED: ${updated.id}`);

    return {
      simulated: false,
      provider: "resend",
      emailId,
    };
  },

  {
    connection,
    concurrency: 1,
  },
);

// Theo dõi trạng thái Worker
worker.on("ready", () => {
  console.log("[Email Worker] Ready");
});

worker.on("completed", (job) => {
  console.log(`[Email Worker] Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`[Email Worker] Job ${job?.id} failed: ${error.message}`);
});

worker.on("error", (error) => {
  console.error("[Email Worker] Error:", error.message);
});

// Đóng kết nối khi dừng chương trình
async function shutdown() {
  await worker.close();
  await connection.quit();
  await sqlClient.end();
}

process.once("SIGINT", () => {
  void shutdown();
});

process.once("SIGTERM", () => {
  void shutdown();
});
