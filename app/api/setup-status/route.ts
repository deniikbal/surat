import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// GET /api/setup-status → { needsSetup: boolean } (publik, read-only, tanpa data sensitif)
export async function GET() {
  try {
    const r = await pool.query(`SELECT to_regclass('public."user"') AS t`)
    if (!r.rows[0]?.t) {
      return NextResponse.json({ needsSetup: true })
    }
    const c = await pool.query(`SELECT count(*)::int AS n FROM "user"`)
    return NextResponse.json({ needsSetup: c.rows[0].n === 0 })
  } catch {
    return NextResponse.json({ needsSetup: true })
  }
}
