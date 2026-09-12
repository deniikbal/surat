import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { ensureSuratTables, JENIS, type JenisKey } from "@/lib/server/surat"
import { deleteLampiran } from "@/lib/server/drive"

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

// PUT /api/surat/[id]?jenis= — update field surat (no_agenda tetap, tidak diubah).
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureSuratTables()
    const { id: rawId } = await params
    const id = Number(rawId)
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id tidak valid" }, { status: 400 })

    const sp = request.nextUrl.searchParams
    const jenis = getJenis(sp.get("jenis"))
    if (!jenis) return NextResponse.json({ error: "jenis tidak valid" }, { status: 400 })
    const cfg = JENIS[jenis]

    const body = await request.json().catch(() => ({}))
    const pick = (k: string, max = 500) => {
      const v = String(body[k] ?? "").trim()
      return v ? v.slice(0, max) : null
    }
    const date = (k: string) => {
      const v = pick(k, 10)
      return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
    }

    // Kolom yang boleh diedit (no_agenda & id tidak pernah).
    const editable = cfg.insertCols
      .split(", ")
      .filter((c) => c !== "no_agenda")
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
      status: (cfg.statuses as readonly string[]).includes(String(body.status))
        ? String(body.status)
        : null,
    }

    const sets: string[] = []
    const sqlParams: unknown[] = []
    for (const col of editable) {
      // lampiran hanya ditulis kalau client mengirimkan fieldnya (bisa dikosongkan).
      if (col === "file_id" || col === "file_name") {
        if (!(col in body)) continue
        sqlParams.push(pick(col, 200))
        sets.push(`${col} = $${sqlParams.length}`)
        continue
      }
      if (!(col in values)) continue
      // status hanya ditulis kalau nilainya valid (kolom NOT NULL).
      if (col === "status" && !values.status) continue
      sqlParams.push(values[col])
      sets.push(`${col} = $${sqlParams.length}`)
    }
    if (!sets.length) return NextResponse.json({ error: "Tidak ada field untuk diubah" }, { status: 400 })
    sqlParams.push(id)

    // Nilai file_id lama dibaca SEBELUM update, untuk bersih-bersih Drive setelahnya.
    const oldId =
      "file_id" in body
        ? ((await pool.query<{ file_id: string | null }>(
            `SELECT file_id FROM ${cfg.table} WHERE id = $1`,
            [id],
          )).rows[0]?.file_id ?? null)
        : null

    const result = await pool.query(
      `UPDATE ${cfg.table} SET ${sets.join(", ")}, updated_at = now()
       WHERE id = $${sqlParams.length} RETURNING id, no_agenda`,
      sqlParams,
    )
    if (!result.rows.length) return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 })

    // Bila lampiran diganti/dikosongkan lewat form, hapus file lama di Drive
    // (upload endpoint biasa sudah menghapus sendiri saat replace).
    const newFileId = "file_id" in body ? pick("file_id", 200) : null
    if (oldId && oldId !== newFileId) {
      await deleteLampiran(oldId).catch((e) => console.error(`hapus lampiran lama ${oldId}:`, e))
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("PUT /api/surat/[id]:", error)
    return NextResponse.json({ error: "Gagal mengubah surat" }, { status: 500 })
  }
}

// DELETE /api/surat/[id]?jenis=
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureSuratTables()
    const { id: rawId } = await params
    const id = Number(rawId)
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id tidak valid" }, { status: 400 })

    const jenis = getJenis(request.nextUrl.searchParams.get("jenis"))
    if (!jenis) return NextResponse.json({ error: "jenis tidak valid" }, { status: 400 })
    const cfg = JENIS[jenis]

    // Ambil file_id dulu supaya lampiran Drive ikut terhapus (jangan jadi sampah).
    const result = await pool.query(
      `DELETE FROM ${cfg.table} WHERE id = $1 RETURNING id, no_agenda, file_id`,
      [id],
    )
    if (!result.rows.length) return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 })
    const { file_id: fileId } = result.rows[0]
    if (fileId) {
      await deleteLampiran(fileId).catch((e) =>
        console.error(`hapus lampiran ${fileId} gagal:`, e),
      )
    }
    return NextResponse.json({ ok: true, deleted: result.rows[0].no_agenda })
  } catch (error) {
    console.error("DELETE /api/surat/[id]:", error)
    return NextResponse.json({ error: "Gagal menghapus surat" }, { status: 500 })
  }
}
