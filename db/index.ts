import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;
let ready: Promise<void> | undefined;

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Inquiry storage is not configured");
  client ??= postgres(url, {
    max: 5,
    connect_timeout: 10,
    idle_timeout: 20,
    ssl: process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA?.replace(/\\n/g, "\n") }
      : undefined,
  });
  return client;
}

export function getDb() {
  return drizzle(getClient(), { schema });
}

export async function saveInquiry(inquiry: { name: string; contact: string; message: string }) {
  const sql = getClient();
  ready ??= sql`
    CREATE TABLE IF NOT EXISTS inquiries (
      id text PRIMARY KEY,
      name text NOT NULL,
      contact text NOT NULL,
      message text NOT NULL,
      created_at text NOT NULL
    )
  `.then(() => undefined).catch(error => {
    ready = undefined;
    throw error;
  });
  await ready;
  await sql`
    INSERT INTO inquiries (id, name, contact, message, created_at)
    VALUES (${crypto.randomUUID()}, ${inquiry.name}, ${inquiry.contact},
            ${inquiry.message}, ${new Date().toISOString()})
  `;
}
