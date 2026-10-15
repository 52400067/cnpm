import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { events } from "./events";

export const gates = pgTable("gates", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  name: varchar("name", { length: 100 }).notNull(),
  locationDesc: varchar("location_desc", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
