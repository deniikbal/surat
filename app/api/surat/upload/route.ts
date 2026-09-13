import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { ensureSuratTables, JENIS, type JenisKey } from "@/lib/server/surat"
import { deleteLampiran, uploadLampiran } from "@/lib/server/drive"

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

// POST /api/surat/upload?jenis=&id= — formData: file
// Tanpa id → hanya unggah (dipakai form input, link ditahan di client).
// Dengan id → unggah + simpan tautan ke baris surat.
export async function POST(request: NextRequest) {
  const { headers } = await import("next/headers")
  if (!(await auth.api.getSession({ headers: await headers() }))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureSuratTables()
    const sp = request.nextUrl.searchParams
    const jenis: JenisKey = sp.get("jenis") === "keluar" ? "keluar" : "masuk"
    const id = Number(sp.get("id") || 0)

    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "File belum dipilih" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Ukuran file maksimal 2 MB" }, { status: 400 })
    }
    if (file.type && !ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Format harus PDF, gambar, atau Word" }, { status: 400 })
    }

    const { fileId, name } = await uploadLampiran(file)

    let oldFileId: string | null = null
    if (id > 0) {
      const cfg = JENIS[jenis]
      const prev = await pool.query<{ file_id: string | null }>(
        `SELECT file_id FROM ${cfg.table} WHERE id = $1`,
        [id],
      )
      if (!prev.rows.length) return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 })
      oldFileId = prev.rows[0].file_id

      await pool.query(
        `UPDATE ${cfg.table} SET file_id = $1, file_name = $2, updated_at = now() WHERE id = $3`,
        [fileId, name, id],
      )
    }

    // Gagal hapus file lama tidak boleh menggagalkan simpan.
    if (oldFileId) await deleteLampiran(oldFileId).catch((e) => console.error("hapus lampiran lama:", e))

    return NextResponse.json({ ok: true, file_id: fileId, file_name: name })
  } catch (error) {
    console.error("POST /api/surat/upload:", error)
    const msg = error instanceof Error ? error.message : "Gagal mengunggah berkas"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/surat/upload?fileId= — bersihkan file yang sudah diunggah tapi
// dibatalkan user di form (belum sempat tertaut ke baris surat).
export async function DELETE(request: NextRequest) {
  const { headers } = await import("next/headers")
  if (!(await auth.api.getSession({ headers: await headers() }))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const fileId = request.nextUrl.searchParams.get("fileId")?.trim()
  if (!fileId) return NextResponse.json({ error: "fileId wajib" }, { status: 400 })
  try {
    await deleteLampiran(fileId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/surat/upload:", error)
    return NextResponse.json({ error: "Gagal menghapus berkas" }, { status: 500 })
  }
}

