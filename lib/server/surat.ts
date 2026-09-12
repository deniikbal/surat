import { pool } from "@/lib/db"

let ready = false

export async function ensureSuratTables() {
  if (ready) return
  await pool.query(`
    CREATE SEQUENCE IF NOT EXISTS surat_agenda_seq START 1;
    CREATE SEQUENCE IF NOT EXISTS surat_keluar_seq START 1;
    CREATE TABLE IF NOT EXISTS surat_masuk (
      id SERIAL PRIMARY KEY,
      no_agenda TEXT,
      tgl_terima DATE,
      no_surat TEXT,
      tgl_surat DATE,
      pengirim TEXT,
      perihal TEXT,
      kode_klasifikasi TEXT,
      sifat TEXT,
      tujuan_disposisi TEXT,
      file_id TEXT,
      file_name TEXT,
      status TEXT NOT NULL DEFAULT 'Belum Diproses',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS surat_keluar (
      id SERIAL PRIMARY KEY,
      no_agenda TEXT,
      no_surat TEXT,
      tgl_surat DATE,
      tujuan TEXT,
      perihal TEXT,
      kode_klasifikasi TEXT,
      sifat TEXT,
      cara_kirim TEXT,
      file_id TEXT,
      file_name TEXT,
      status TEXT NOT NULL DEFAULT 'Draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  // Tabel yang sudah ada sebelum fitur lampiran.
  await pool.query(`
    ALTER TABLE surat_masuk ADD COLUMN IF NOT EXISTS file_id TEXT;
    ALTER TABLE surat_masuk ADD COLUMN IF NOT EXISTS file_name TEXT;
    ALTER TABLE surat_keluar ADD COLUMN IF NOT EXISTS file_id TEXT;
    ALTER TABLE surat_keluar ADD COLUMN IF NOT EXISTS file_name TEXT;
  `)
  ready = true
}

// Satu endpoint dua jenis surat — tabel, sekuens, kolom, dan status beda.
export const JENIS = {
  masuk: {
    table: "surat_masuk",
    seq: "surat_agenda_seq",
    prefix: "SM",
    statuses: ["Belum Diproses", "Dalam Proses", "Selesai"],
    columns: "id, no_agenda, tgl_terima::text, no_surat, tgl_surat::text, pengirim, perihal, kode_klasifikasi, sifat, tujuan_disposisi, file_id, file_name, status, created_at",
    insertCols: "no_agenda, tgl_terima, no_surat, tgl_surat, pengirim, perihal, kode_klasifikasi, sifat, tujuan_disposisi, file_id, file_name, status",
    searchCols: ["no_surat", "pengirim", "perihal"],
    dateOrder: "tgl_terima",
  },
  keluar: {
    table: "surat_keluar",
    seq: "surat_keluar_seq",
    prefix: "SK",
    statuses: ["Draft", "Dikirim", "Arsip"],
    columns: "id, no_agenda, no_surat, tgl_surat::text, tujuan, perihal, kode_klasifikasi, sifat, cara_kirim, file_id, file_name, status, created_at",
    insertCols: "no_agenda, no_surat, tgl_surat, tujuan, perihal, kode_klasifikasi, sifat, cara_kirim, file_id, file_name, status",
    searchCols: ["no_surat", "tujuan", "perihal"],
    dateOrder: "tgl_surat",
  },
} as const

export type JenisKey = keyof typeof JENIS

export const SURAT_STATUSES = ["Belum Diproses", "Dalam Proses", "Selesai"] as const
export const KELASIFIKASI = [
  "421.2 (SMA)",
  "421.3 (Kesiswaan)",
  "800 (Kepegawaian)",
  "005 (Undangan)",
]
export const SIFAT = ["Biasa", "Penting", "Segera", "Rahasia"]

export type SuratRow = {
  id: number
  no_agenda: string | null
  tgl_terima: string | null
  no_surat: string | null
  tgl_surat: string | null
  pengirim: string | null
  perihal: string | null
  kode_klasifikasi: string | null
  sifat: string | null
  tujuan_disposisi: string | null
  status: string
}
