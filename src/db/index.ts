import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let client: ReturnType<typeof createClient> | undefined;

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url), { schema, casing: "snake_case" });
}

// Created lazily so pages that don't touch the database build without DATABASE_URL.
export function db() {
  client ??= createClient();
  return client;
}
