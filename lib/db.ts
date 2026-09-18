import "server-only";
import postgres from "postgres";

declare global {
  var __bosSql: ReturnType<typeof postgres> | undefined;
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function db() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!global.__bosSql) {
    global.__bosSql = postgres(process.env.DATABASE_URL, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return global.__bosSql;
}
