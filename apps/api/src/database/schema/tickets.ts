import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { TicketStatus } from '@tickethub/shared';
import { orders } from './orders';
import { users } from './users';
import { events } from './events';
import { ticketTypes } from './ticket-types';
import { seats } from './seats';
import { gates } from './gates';

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketCode: varchar('ticket_code', { length: 32 }).notNull().unique(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id),
  ticketTypeId: uuid('ticket_type_id')
    .notNull()
    .references(() => ticketTypes.id),
  seatId: uuid('seat_id').references(() => seats.id),
  status: varchar('status', { length: 20 })
    .notNull()
    .default(TicketStatus.SOLD)
    .$type<TicketStatus>(),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  gateId: uuid('gate_id').references(() => gates.id),
  checkedInBy: uuid('checked_in_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
