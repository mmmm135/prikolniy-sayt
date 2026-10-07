// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const inquiries = sqliteTable('inquiries', { id: text('id').primaryKey(), name: text('name').notNull(), contact: text('contact').notNull(), message: text('message').notNull(), createdAt: text('created_at').notNull() });
