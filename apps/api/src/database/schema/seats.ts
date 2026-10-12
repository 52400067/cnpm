import { pgTable, uuid, varchar, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { SeatStatus } from '@tickethub/shared';
import { events } from './events';
import { ticketTypes } from './ticket-types';
import { orders } from './orders';

export const seats = pgTable(
  'seats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    ticketTypeId: uuid('ticket_type_id')
      .notNull()
      .references(() => ticketTypes.id),
    zoneName: varchar('zone_name', { length: 50 }).notNull(),
    rowLabel: varchar('row_label', { length: 20 }).notNull(),
    seatNumber: varchar('seat_number', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 })
      .notNull()
      .default(SeatStatus.AVAILABLE)
      .$type<SeatStatus>(),
    holdOrderId: uuid('hold_order_id').references(() => orders.id),
    holdExpiresAt: timestamp('hold_expires_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_seats_unique_position').on(
      table.eventId,
      table.zoneName,
      table.rowLabel,
      table.seatNumber,
    ),
    index('idx_seats_event_status').on(table.eventId, table.status),
    index('idx_seats_hold_expiry').on(table.status, table.holdExpiresAt),
  ],
);
