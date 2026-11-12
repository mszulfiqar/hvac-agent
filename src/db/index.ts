
import * as dotenv from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import WebSocket from "ws";

// Load environment variables for standalone Node.js scripts.
// Existing environment variables take precedence.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

neonConfig.webSocketConstructor = WebSocket;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing. Check your .env.local or .env file.",
  );
}

export const pool = new Pool({
  connectionString,
  max: 5,
});

export const db = drizzle({
  client: pool,
});

export type Database = typeof db;
