import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { ensureSuratTables, JENIS, type JenisKey } from "@/lib/server/surat"

async function requireSession() {
  const { headers } = await import("next/headers")
  const session = await auth.api.getSession({ headers: await headers() })
  return session
}

function getJenis(raw: string | null): JenisKey | null {
  if (raw === "keluar") return "keluar"
  if (!raw || raw === "masuk") return "masuk"
  return null
}

// GET /api/surat?jenis=masuk|keluar&status=&q=
export async function GET(request: NextRequest) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureSuratTables()
    const sp = request.nextUrl.searchParams
    const jenis = getJenis(sp.get("jenis"))
    if (!jenis) return NextResponse.json({ error: "jenis tidak valid" }, { status: 400 })
    const cfg = JENIS[jenis]

    const status = sp.get("status")?.trim() || ""
    const q = sp.get("q")?.trim() || ""

    const where: string[] = []
    const params: unknown[] = []
    if (status && (cfg.statuses as readonly string[]).includes(status)) {
      params.push(status)
      where.push(`status = $${params.length}`)
    }
    if (q) {
      params.push(`%${q}%`)
      where.push(`(${cfg.searchCols.map((c) => `${c} ILIKE $${params.length}`).join(" OR ")})`)
    }

    // Statistik tanpa filter (dipakai kartu), hasil tabel dengan filter + pagination.
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1)
    const perPage = Math.min(100, Math.max(5, parseInt(sp.get("per_page") || "15", 10) || 15))
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""

    const [statRows, sifatRows, countRes, result] = await Promise.all([
      pool.query(`SELECT status, COUNT(*)::int AS n FROM ${cfg.table} GROUP BY status`),
      pool.query(`SELECT sifat, COUNT(*)::int AS n FROM ${cfg.table} GROUP BY sifat`),
      pool.query(`SELECT COUNT(*)::int AS count FROM ${cfg.table} ${whereSql}`, params),
      pool.query(
        `SELECT ${cfg.columns}
         FROM ${cfg.table}
         ${whereSql}
         ORDER BY (${cfg.dateOrder}::date) DESC NULLS LAST, id DESC
         LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`,
        params,
      ),
    ])
    const stats: Record<string, number> = { total: 0 }
    for (const r of statRows.rows) {
      stats[r.status] = r.n
      stats.total += r.n
    }
    for (const r of sifatRows.rows) stats[`sifat:${r.sifat}`] = r.n
    return NextResponse.json({ jenis, surat: result.rows, total: countRes.rows[0]?.count ?? 0, page, per_page: perPage, stats })
  } catch (error) {
    console.error("GET /api/surat:", error)
    return NextResponse.json({ error: "Gagal memuat data surat" }, { status: 500 })
  }
}

// POST /api/surat — body: { jenis, ...field }. No. agenda otomatis (SM/SK).
export async function POST(request: NextRequest) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureSuratTables()
    const body = await request.json().catch(() => ({}))
    const jenis = getJenis(String(body.jenis ?? ""))
    if (!jenis) return NextResponse.json({ error: "jenis tidak valid" }, { status: 400 })
    const cfg = JENIS[jenis]

    const pick = (k: string, max = 500) => {
      const v = String(body[k] ?? "").trim()
      return v ? v.slice(0, max) : null
    }
    const date = (k: string) => {
      const v = pick(k, 10)
      return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
    }

    // Nilai per kolom, urutan sama dengan cfg.insertCols (no_agenda diisi server).
    const values: Record<string, string | null> = {
      tgl_terima: date("tgl_terima"),
      no_surat: pick("no_surat", 100),
      tgl_surat: date("tgl_surat"),
      pengirim: pick("pengirim", 200),
      perihal: pick("perihal", 1000),
      kode_klasifikasi: pick("kode_klasifikasi", 100),
      sifat: pick("sifat", 50),
      tujuan_disposisi: pick("tujuan_disposisi", 200),
      tujuan: pick("tujuan", 200),
      cara_kirim: pick("cara_kirim", 50),
      file_id: pick("file_id", 200),
      file_name: pick("file_name", 200),
    }
    const status = (cfg.statuses as readonly string[]).includes(String(body.status))
      ? String(body.status)
      : cfg.statuses[0]

    const cols = cfg.insertCols.split(", ").filter((c) => c !== "no_agenda" && c !== "status")
    const params: unknown[] = [...cols.map((c) => values[c] ?? null), status]
    const placeholders = params.map((_, i) => `$${i + 1}`).join(",")

    if (!values.no_surat && !values.pengirim && !values.tujuan && !values.perihal) {
      return NextResponse.json({ error: "Isi minimal nomor surat, tujuan/pengirim, atau perihal" }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO ${cfg.table} (no_agenda, ${cols.join(", ")}, status)
       VALUES ('${cfg.prefix}-' || lpad(nextval('${cfg.seq}')::text, 3, '0'), ${placeholders})
       RETURNING id, no_agenda`,
      params,
    )
    return NextResponse.json({ ok: true, id: result.rows[0].id, no_agenda: result.rows[0].no_agenda })
  } catch (error) {
    console.error("POST /api/surat:", error)
    return NextResponse.json({ error: "Gagal menyimpan surat" }, { status: 500 })
  }
}
