import { Pool } from "pg";
import { sql } from "@vercel/postgres";

// The NextAuth pg adapter needs a direct (non-pooled) connection.
// Neon's pooled POSTGRES_URL goes through PgBouncer in transaction mode,
// which breaks advisory locks that some adapter operations require.
export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: true },
});

export { sql };
