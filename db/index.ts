import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { parseEnv } from "@/lib/env";
export function getDb() {
  const { DATABASE_URL } = parseEnv(process.env);
  if (!DATABASE_URL) throw new Error("DATABASE_URL is required for database access.");
  return drizzle(neon(DATABASE_URL), { schema });
}
