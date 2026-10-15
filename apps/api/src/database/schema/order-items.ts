import {
  pgTable,
  uuid,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { ticketTypes } from "./ticket-types";
import { seats } from "./seats";

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  ticketTypeId: uuid("ticket_type_id")
    .notNull()
    .references(() => ticketTypes.id),
  seatId: uuid("seat_id").references(() => seats.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
