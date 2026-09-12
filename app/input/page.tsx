"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2Icon, InboxIcon, Loader2Icon, SendIcon } from "lucide-react"

import { Shell } from "@/components/shell"
import { LampiranField, type Lampiran } from "@/components/lampiran"
import { cn } from "@/lib/utils"

const KELASIFIKASI = ["421.2 (SMA)", "421.3 (Kesiswaan)", "800 (Kepegawaian)", "005 (Undangan)"]
const SIFAT = ["Biasa", "Penting", "Segera", "Rahasia"]
const CARA_KIRIM = ["Biasa", "Registered", "Paket/Kargo", "Email", "Diantar Langsung"]
const STATUS: Record<Jenis, string[]> = {
  masuk: ["Belum Diproses", "Dalam Proses", "Selesai"],
  keluar: ["Draft", "Dikirim", "Arsip"],
}

type Jenis = "masuk" | "keluar"

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date())
}

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
const labelCls = "mb-1.5 block text-xs font-semibold text-foreground/80"

export default function InputSuratPage() {
  const router = useRouter()
  const [jenis, setJenis] = useState<Jenis>("masuk")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [form, setForm] = useState({
    tgl_terima: today(),
    no_surat: "",
    tgl_surat: today(),
    pengirim: "",
    tujuan: "",
    perihal: "",
    kode_klasifikasi: KELASIFIKASI[0],
    sifat: SIFAT[0],
    tujuan_disposisi: "",
    cara_kirim: "Biasa",
    status: STATUS.masuk[0],
  })
  const [lampiran, setLampiran] = useState<Lampiran | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  function switchJenis(j: Jenis) {
    setJenis(j)
    setMsg(null)
    setLampiran(null)
    setForm((f) => ({ ...f, status: STATUS[j][0] }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch("/api/surat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, jenis, file_id: lampiran?.file_id ?? "", file_name: lampiran?.file_name ?? "" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Gagal menyimpan" })
        return
      }
      setMsg({ ok: true, text: `Surat ${jenis} dicatat! No. Agenda: ${data.no_agenda}` })
      setForm((f) => ({ ...f, no_surat: "", pengirim: "", tujuan: "", perihal: "", tujuan_disposisi: "" }))
      setLampiran(null)
      router.refresh()
    } catch {
      setMsg({ ok: false, text: "Koneksi gagal, coba lagi" })
    } finally {
      setSaving(false)
    }
  }

  const isMasuk = jenis === "masuk"

  return (
    <Shell title="Input Surat" subtitle="Catat surat masuk atau keluar. Nomor agenda dibuat otomatis oleh sistem.">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Segmen jenis */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1.5 shadow-sm">
          {(["masuk", "keluar"] as const).map((j) => {
            const Icon = j === "masuk" ? InboxIcon : SendIcon
            const active = jenis === j
            return (
              <button
                key={j}
                type="button"
                onClick={() => switchJenis(j)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition",
                  active ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4" />
                Surat {j === "masuk" ? "Masuk" : "Keluar"}
              </button>
            )
          })}
        </div>

        {msg ? (
          <p
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ring-1 ring-inset",
              msg.ok ? "bg-success/10 text-success ring-success/20" : "bg-destructive/10 text-destructive ring-destructive/20",
            )}
          >
            {msg.ok ? <CheckCircle2Icon className="size-4 shrink-0" /> : null}
            {msg.text}
          </p>
        ) : null}

        <form onSubmit={submit} className="card space-y-5 p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nomor Agenda</label>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-3 text-sm text-muted-foreground">
                <span className="font-mono font-semibold text-foreground/70">{isMasuk ? "SM" : "SK"}-xxx</span>
                Otomatis — tidak dapat diubah
              </div>
            </div>

            <div>
              <label className={labelCls}>Nomor Surat *</label>
              <input value={form.no_surat} onChange={set("no_surat")} required className={inputCls} placeholder={isMasuk ? "mis. 421.2/123/DISDIK" : "mis. 005/SMANSA/IX/2026"} />
            </div>
            <div>
              <label className={labelCls}>{isMasuk ? "Tanggal Diterima" : "Tanggal Surat"}</label>
              <input
                type="date"
                value={isMasuk ? form.tgl_terima : form.tgl_surat}
                onChange={set(isMasuk ? "tgl_terima" : "tgl_surat")}
                className={inputCls}
              />
            </div>

            {isMasuk ? (
              <div>
                <label className={labelCls}>Tanggal Surat</label>
                <input type="date" value={form.tgl_surat} onChange={set("tgl_surat")} className={inputCls} />
              </div>
            ) : (
              <div>
                <label className={labelCls}>Cara Kirim</label>
                <select value={form.cara_kirim} onChange={set("cara_kirim")} className={inputCls}>
                  {CARA_KIRIM.map((k) => (<option key={k}>{k}</option>))}
                </select>
              </div>
            )}

            <div>
              <label className={labelCls}>Sifat Surat</label>
              <select value={form.sifat} onChange={set("sifat")} className={inputCls}>
                {SIFAT.map((k) => (<option key={k}>{k}</option>))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>{isMasuk ? "Pengirim / Instansi Asal" : "Tujuan / Alamat Yang Dituju"}</label>
              <input
                value={isMasuk ? form.pengirim : form.tujuan}
                onChange={set(isMasuk ? "pengirim" : "tujuan")}
                className={inputCls}
                placeholder={isMasuk ? "mis. Dinas Pendidikan Jawa Barat" : "mis. Cabang Dinas Pendidikan Wilayah IV"}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Perihal / Isi Ringkas</label>
              <textarea value={form.perihal} onChange={set("perihal")} rows={3} className={cn(inputCls, "h-auto resize-y py-2")} placeholder="mis. Undangan rapat koordinasi" />
            </div>

            <div>
              <label className={labelCls}>Kode Klasifikasi</label>
              <select value={form.kode_klasifikasi} onChange={set("kode_klasifikasi")} className={inputCls}>
                {KELASIFIKASI.map((k) => (<option key={k}>{k}</option>))}
              </select>
            </div>

            {isMasuk ? (
              <div>
                <label className={labelCls}>Tujuan Disposisi</label>
                <input value={form.tujuan_disposisi} onChange={set("tujuan_disposisi")} className={inputCls} placeholder="Kepala Sekolah / Wakasek / TU" />
              </div>
            ) : null}

            <div className={isMasuk ? "" : "sm:col-span-2"}>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set("status")} className={inputCls}>
                {STATUS[jenis].map((k) => (<option key={k}>{k}</option>))}
              </select>
            </div>

            <LampiranField value={lampiran} onChange={setLampiran} jenis={jenis} label={isMasuk ? "Scan Surat Masuk (PDF / gambar)" : "Scan Surat Keluar (PDF / gambar)"} />
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-[11px] text-muted-foreground">* wajib diisi</p>
            <button
              type="submit"
              disabled={saving}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2Icon className="size-4 animate-spin" /> : <CheckCircle2Icon className="size-4" />}
              {saving ? "Menyimpan..." : `Simpan Surat ${isMasuk ? "Masuk" : "Keluar"}`}
            </button>
          </div>
        </form>
      </div>
    </Shell>
  )
}
