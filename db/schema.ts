// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { pgTable, text } from 'drizzle-orm/pg-core';
export const inquiries = pgTable('inquiries', { id: text('id').primaryKey(), name: text('name').notNull(), contact: text('contact').notNull(), message: text('message').notNull(), createdAt: text('created_at').notNull() });
