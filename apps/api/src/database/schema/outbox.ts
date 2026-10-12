import { pgTable, uuid, varchar, jsonb, integer, timestamp, text, index } from 'drizzle-orm/pg-core';
import { OutboxStatus } from '@tickethub/shared';

export const outbox = pgTable(
  'outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull(),
    status: varchar('status', { length: 20 })
      .notNull()
      .default(OutboxStatus.PENDING)
      .$type<OutboxStatus>(),
    retryCount: integer('retry_count').notNull().default(0),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }).notNull().defaultNow(),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_outbox_fetch').on(table.status, table.nextRetryAt),
  ],
);
