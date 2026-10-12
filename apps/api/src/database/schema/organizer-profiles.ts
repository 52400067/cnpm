import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { OrganizerStatus } from '@tickethub/shared';
import { users } from './users';

export const organizerProfiles = pgTable('organizer_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationName: varchar('organization_name', { length: 255 }).notNull(),
  taxCode: varchar('tax_code', { length: 50 }).notNull(),
  businessLicenseUrl: varchar('business_license_url', { length: 500 }).notNull(),
  representativeName: varchar('representative_name', { length: 150 }).notNull(),
  status: varchar('status', { length: 25 })
    .notNull()
    .default(OrganizerStatus.PENDING_VERIFICATION)
    .$type<OrganizerStatus>(),
  rejectionReason: text('rejection_reason'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
