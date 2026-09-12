"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckIcon,
  FileTextIcon,
  InboxIcon,
  Loader2Icon,
  PencilIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { Shell } from "@/components/shell"
import { LampiranField, type Lampiran } from "@/components/lampiran"
import { PreviewModal } from "@/components/preview"
import { Chip, formatDate, relativeDay } from "@/components/ui"
import { cn } from "@/lib/utils"

type Surat = {
  id: number
  no_agenda: string | null
  tgl_terima?: string | null
  no_surat: string | null
  tgl_surat: string | null
  pengirim?: string | null
  tujuan?: string | null
  perihal: string | null
  kode_klasifikasi: string | null
  sifat: string | null
  tujuan_disposisi?: string | null
  cara_kirim?: string | null
  file_id?: string | null
  file_name?: string | null
  status: string
}

type Jenis = "masuk" | "keluar"

const STATUS_FILTER: Record<Jenis, string[]> = {
  masuk: ["Semua", "Belum Diproses", "Dalam Proses", "Selesai"],
  keluar: ["Semua", "Draft", "Dikirim", "Arsip"],
}
const KELASIFIKASI = ["421.2 (SMA)", "421.3 (Kesiswaan)", "800 (Kepegawaian)", "005 (Undangan)"]
const SIFAT = ["Biasa", "Penting", "Segera", "Rahasia"]
const CARA_KIRIM = ["Biasa", "Registered", "Paket/Kargo", "Email", "Diantar Langsung"]
const STATUS: Record<Jenis, string[]> = {
  masuk: ["Belum Diproses", "Dalam Proses", "Selesai"],
  keluar: ["Draft", "Dikirim", "Arsip"],
}

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
const labelCls = "mb-1.5 block text-xs font-semibold text-foreground/80"

export default function DataSuratPage() {
  const [jenis, setJenis] = useState<Jenis>("masuk")
  const [rows, setRows] = useState<Surat[] | null>(null)
  const [status, setStatus] = useState("Semua")
  const [q, setQ] = useState("")
  const [edit, setEdit] = useState<Surat | null>(null)
  const [del, setDel] = useState<Surat | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [preview, setPreview] = useState<Surat | null>(null)

  const load = useCallback(async () => {
    const params = new URLSearchParams({ jenis })
    if (status !== "Semua") params.set("status", status)
    if (q.trim()) params.set("q", q.trim())
    try {
      const res = await fetch(`/api/surat?${params}`)
      const data = await res.json()
      setRows(Array.isArray(data.surat) ? data.surat : [])
    } catch {
      setRows([])
    }
  }, [jenis, status, q])

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  function switchJenis(j: Jenis) {
    setJenis(j)
    setStatus("Semua")
    setRows(null)
    setEdit(null)
    setDel(null)
  }

  const isMasuk = jenis === "masuk"
  const counts = useMemo(() => {
    const map: Record<string, number> = { Semua: rows?.length ?? 0 }
    for (const s of rows ?? []) map[s.status] = (map[s.status] ?? 0) + 1
    return map
  }, [rows])

  async function saveEdit(form: Surat) {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/surat/${form.id}?jenis=${jenis}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Gagal menyimpan perubahan" })
        return
      }
      setMsg({ ok: true, text: `Perubahan surat ${form.no_agenda} tersimpan.` })
      setEdit(null)
      load()
    } catch {
      setMsg({ ok: false, text: "Koneksi gagal, coba lagi" })
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!del) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/surat/${del.id}?jenis=${jenis}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Gagal menghapus" })
        return
      }
      setMsg({ ok: true, text: `Surat ${del.no_agenda} dihapus.` })
      setDel(null)
      load()
    } catch {
      setMsg({ ok: false, text: "Koneksi gagal, coba lagi" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell title="Register Surat" subtitle="Cari, filter, ubah, dan hapus agenda surat.">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex w-fit gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
            {(["masuk", "keluar"] as const).map((j) => {
              const Icon = j === "masuk" ? InboxIcon : SendIcon
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => switchJenis(j)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                    jenis === j ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-4" />
                  Surat {j === "masuk" ? "Masuk" : "Keluar"}
                </button>
              )
            })}
          </div>

          <div className="relative w-full md:max-w-xs">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nomor surat, pihak, perihal..."
              className="h-10 w-full rounded-lg border border-border bg-card pr-9 pl-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Bersihkan pencarian"
              >
                <XIcon className="size-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTER[jenis].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                status === s
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {s}
              {rows !== null && counts[s] !== undefined ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 font-mono text-[10px] tabular-nums",
                    status === s ? "bg-white/20" : "bg-muted",
                  )}
                >
                  {counts[s]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {msg ? (
          <p
            className={cn(
              "rounded-lg px-4 py-3 text-sm font-medium ring-1 ring-inset",
              msg.ok ? "bg-success/10 text-success ring-success/20" : "bg-destructive/10 text-destructive ring-destructive/20",
            )}
          >
            {msg.text}
          </p>
        ) : null}

        <div className="card overflow-hidden">
          {rows === null ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" /> Memuat data...
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-muted">
                <SearchIcon className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Tidak ada surat yang cocok</p>
              <p className="text-xs text-muted-foreground">Ubah kata kunci atau filter status.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">Agenda</th>
                    <th className="px-4 py-3">Nomor &amp; Tanggal</th>
                    <th className="px-4 py-3">{isMasuk ? "Pengirim" : "Tujuan"}</th>
                    <th className="px-4 py-3">Perihal</th>
                    <th className="px-4 py-3">Klasifikasi</th>
                    <th className="px-4 py-3">Sifat</th>
                    <th className="px-4 py-3">{isMasuk ? "Disposisi" : "Cara Kirim"}</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Berkas</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {rows.map((s) => (
                    <tr key={s.id} className="align-top transition hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-primary/5 px-2 py-1 font-mono text-xs font-bold text-primary">
                          {s.no_agenda || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs">{s.no_surat || "-"}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {isMasuk ? `Diterima ${relativeDay(s.tgl_terima)}` : formatDate(s.tgl_surat)}
                        </p>
                      </td>
                      <td className="max-w-44 px-4 py-3">
                        <p className="truncate font-medium" title={(isMasuk ? s.pengirim : s.tujuan) || ""}>
                          {(isMasuk ? s.pengirim : s.tujuan) || "-"}
                        </p>
                      </td>
                      <td className="max-w-64 px-4 py-3">
                        <p className="line-clamp-2" title={s.perihal || ""}>{s.perihal || "-"}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.kode_klasifikasi || "-"}</td>
                      <td className="px-4 py-3">{s.sifat ? <Chip label={s.sifat} kind="sifat" /> : "-"}</td>
                      <td className="max-w-36 px-4 py-3 text-xs text-muted-foreground">
                        <p className="truncate">{(isMasuk ? s.tujuan_disposisi : s.cara_kirim) || "-"}</p>
                      </td>
                      <td className="px-4 py-3"><Chip label={s.status} /></td>
                      <td className="px-4 py-3">
                        {s.file_id ? (
                          <button
                            type="button"
                            onClick={() => setPreview(s)}
                            title={s.file_name || "Pratinjau lampiran"}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/5 px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
                          >
                            <FileTextIcon className="size-3.5" /> Lihat
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEdit(s)}
                            title="Ubah surat"
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                          >
                            <PencilIcon className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDel(s)}
                            title="Hapus surat"
                            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2Icon className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {rows !== null && rows.length > 0 ? (
          <p className="text-center text-[11px] text-muted-foreground">
            Menampilkan {rows.length} surat {jenis} terbaru (maks. 500). Nomor agenda tidak berubah saat surat diubah.
          </p>
        ) : null}
      </div>

      {edit ? (
        <EditDialog
          key={`${jenis}-${edit.id}`}
          surat={edit}
          jenis={jenis}
          busy={busy}
          onClose={() => !busy && setEdit(null)}
          onSave={saveEdit}
        />
      ) : null}

      {preview && preview.file_id ? (
        <PreviewModal
          item={{ fileId: preview.file_id, fileName: preview.file_name || "Lampiran" }}
          onClose={() => setPreview(null)}
        />
      ) : null}

      {del ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => !busy && setDel(null)}>
          <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
                <Trash2Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Hapus surat ini?</p>
                <p className="text-xs text-muted-foreground">Tindakan ini tidak bisa dibatalkan.</p>
              </div>
            </div>
            <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
              <span className="font-mono font-bold text-primary">{del.no_agenda}</span>
              <span className="mx-1.5 text-muted-foreground">•</span>
              {del.perihal || del.no_surat || "(tanpa perihal)"}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDel(null)}
                disabled={busy}
                className="h-9 rounded-lg border px-4 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-destructive px-4 text-sm font-semibold text-white transition hover:bg-destructive/90 disabled:opacity-50"
              >
                {busy ? <Loader2Icon className="size-4 animate-spin" /> : <Trash2Icon className="size-4" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  )
}

function EditDialog({
  surat, jenis, busy, onClose, onSave,
}: {
  surat: Surat
  jenis: Jenis
  busy: boolean
  onClose: () => void
  onSave: (s: Surat) => void
}) {
  const [form, setForm] = useState<Surat>({ ...surat })
  const [lampiran, setLampiran] = useState<Lampiran | null>(
    surat.file_id ? { file_id: surat.file_id, file_name: surat.file_name || "Lampiran" } : null,
  )
  const isMasuk = jenis === "masuk"
  const set = (k: keyof Surat) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          onSave(form)
        }}
        className="card my-auto w-full max-w-2xl p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">Ubah Surat {isMasuk ? "Masuk" : "Keluar"}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              No. Agenda <span className="font-mono font-bold text-primary">{surat.no_agenda || "-"}</span> tetap (tidak diubah).
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Tutup">
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Nomor Surat</label>
            <input value={form.no_surat ?? ""} onChange={set("no_surat")} className={inputCls} />
          </div>
          {isMasuk ? (
            <>
              <div>
                <label className={labelCls}>Tanggal Diterima</label>
                <input type="date" value={form.tgl_terima ?? ""} onChange={set("tgl_terima")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tanggal Surat</label>
                <input type="date" value={form.tgl_surat ?? ""} onChange={set("tgl_surat")} className={inputCls} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={labelCls}>Tanggal Surat</label>
                <input type="date" value={form.tgl_surat ?? ""} onChange={set("tgl_surat")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cara Kirim</label>
                <select value={form.cara_kirim ?? ""} onChange={set("cara_kirim")} className={inputCls}>
                  {CARA_KIRIM.map((k) => (<option key={k}>{k}</option>))}
                </select>
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <label className={labelCls}>{isMasuk ? "Pengirim / Instansi Asal" : "Tujuan / Alamat"}</label>
            <input
              value={(isMasuk ? form.pengirim : form.tujuan) ?? ""}
              onChange={set(isMasuk ? "pengirim" : "tujuan")}
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>Perihal</label>
            <textarea value={form.perihal ?? ""} onChange={set("perihal")} rows={2} className={cn(inputCls, "h-auto resize-y py-2")} />
          </div>

          <div>
            <label className={labelCls}>Kode Klasifikasi</label>
            <select value={form.kode_klasifikasi ?? ""} onChange={set("kode_klasifikasi")} className={inputCls}>
              {[...new Set([...KELASIFIKASI, form.kode_klasifikasi].filter(Boolean))].map((k) => (<option key={k}>{k}</option>))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Sifat</label>
            <select value={form.sifat ?? ""} onChange={set("sifat")} className={inputCls}>
              {[...new Set([...SIFAT, form.sifat].filter(Boolean))].map((k) => (<option key={k}>{k}</option>))}
            </select>
          </div>

          {isMasuk ? (
            <div>
              <label className={labelCls}>Tujuan Disposisi</label>
              <input value={form.tujuan_disposisi ?? ""} onChange={set("tujuan_disposisi")} className={inputCls} />
            </div>
          ) : null}

          <div className={isMasuk ? "" : "sm:col-span-2"}>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={set("status")} className={inputCls}>
              {[...new Set([...STATUS[jenis], form.status])].map((k) => (<option key={k}>{k}</option>))}
            </select>
          </div>

          {/* Unggah langsung ke Drive (dengan id → tautan tersimpan di baris ini). */}
          <LampiranField
            value={lampiran}
            jenis={jenis}
            id={surat.id}
            label={isMasuk ? "Lampiran / Scan Surat" : "Lampiran / Konsep Surat"}
            onChange={(l) => {
              setLampiran(l)
              setForm((f) => ({ ...f, file_id: l?.file_id ?? "", file_name: l?.file_name ?? "" }))
            }}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t pt-4">
          <button type="button" onClick={onClose} disabled={busy} className="h-9 rounded-lg border px-4 text-sm font-semibold transition hover:bg-muted disabled:opacity-50">
            Batal
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? <Loader2Icon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  )
}
