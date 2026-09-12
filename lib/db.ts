import { Pool } from "pg"

declare global {
  // eslint-disable-next-line no-var
  var __suratPool: Pool | undefined
}

export const pool = global.__suratPool ?? new Pool({ connectionString: process.env.DATABASE_URL })
if (process.env.NODE_ENV !== "production") global.__suratPool = pool
