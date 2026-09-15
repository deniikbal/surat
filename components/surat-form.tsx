"use client"

import { Fragment, useState } from "react"
import { CheckIcon } from "lucide-react"

import { LampiranField, type Lampiran } from "@/components/lampiran"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { klasifikasiArsip as klasifikasiTree, klasifikasiFlat } from "@/lib/klasifikasi-arsip"

export const KELASIFIKASI = klasifikasiFlat.map((k) => k.kode)
export const SIFAT = ["Biasa", "Penting", "Segera", "Rahasia"]
export const CARA_KIRIM = ["Biasa", "Registered", "Paket/Kargo", "Email", "Diantar Langsung"]
export const STATUS: Record<Jenis, string[]> = {
  masuk: ["Belum Diproses", "Dalam Proses", "Selesai"],
  keluar: ["Draft", "Dikirim", "Arsip"],
}

export type Jenis = "masuk" | "keluar"

export type Surat = {
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

function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date())
}

type FormState = {
  tgl_terima: string
  tgl_surat: string
  no_surat: string
  pengirim: string
  tujuan: string
  perihal: string
  kode_klasifikasi: string
  sifat: string
  tujuan_disposisi: string
  cara_kirim: string
  status: string
}

function emptyForm(jenis: Jenis): FormState {
  return {
    tgl_terima: today(),
    tgl_surat: today(),
    no_surat: "",
    pengirim: "",
    tujuan: "",
    perihal: "",
    kode_klasifikasi: jenis === "masuk" ? "TU.01.01" : "TU.01.02",
    sifat: SIFAT[0],
    tujuan_disposisi: "",
    cara_kirim: CARA_KIRIM[0],
    status: STATUS[jenis][0],
  }
}

function fromSurat(s: Surat, jenis: Jenis): FormState {
  return {
    tgl_terima: s.tgl_terima ?? today(),
    tgl_surat: s.tgl_surat ?? today(),
    no_surat: s.no_surat ?? "",
    pengirim: s.pengirim ?? "",
    tujuan: s.tujuan ?? "",
    perihal: s.perihal ?? "",
    kode_klasifikasi: s.kode_klasifikasi ?? (jenis === "masuk" ? "TU.01.01" : "TU.01.02"),
    sifat: s.sifat ?? SIFAT[0],
    tujuan_disposisi: s.tujuan_disposisi ?? "",
    cara_kirim: s.cara_kirim ?? CARA_KIRIM[0],
    status: s.status ?? STATUS[jenis][0],
  }
}

/**
 * Dialog form surat — satu komponen untuk create (tanpa `surat`) dan edit (dengan `surat`).
 * create: POST /api/surat (no. agenda dibuat server). edit: PUT /api/surat/:id.
 */
export function SuratFormDialog({
  jenis,
  surat,
  open,
  onOpenChange,
  onSaved,
}: {
  jenis: Jenis
  surat?: Surat | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: (m: { ok: boolean; text: string }) => void
}) {
  const isEdit = !!surat
  const isMasuk = jenis === "masuk"
  const [form, setForm] = useState<FormState>(
    surat ? fromSurat(surat, jenis) : emptyForm(jenis),
  )
  const [lampiran, setLampiran] = useState<Lampiran | null>(
    surat?.file_id ? { file_id: surat.file_id, file_name: surat.file_name || "Lampiran" } : null,
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    try {
      const payload = {
        ...form,
        jenis,
        file_id: lampiran?.file_id ?? "",
        file_name: lampiran?.file_name ?? "",
      }
      const res = isEdit
        ? await fetch(`/api/surat/${surat.id}?jenis=${jenis}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/surat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || "Gagal menyimpan")
        return
      }
      onSaved(
        isEdit
          ? { ok: true, text: `Perubahan surat ${surat.no_agenda} tersimpan.` }
          : { ok: true, text: `Surat ${jenis} dicatat! No. Agenda: ${data.no_agenda}` },
      )
      onOpenChange(false)
    } catch {
      setErr("Koneksi gagal, coba lagi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-0 overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-sm font-bold">
            {isEdit ? `Ubah Surat ${isMasuk ? "Masuk" : "Keluar"}` : `Catat Surat ${isMasuk ? "Masuk" : "Keluar"}`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit ? (
              <>No. Agenda <span className="font-mono font-bold text-primary">{surat?.no_agenda || "-"}</span> tetap (tidak diubah).</>
            ) : (
              <>Nomor agenda dibuat otomatis oleh sistem ({isMasuk ? "SM" : "SK"}-xxx).</>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          {/* grid 6 kolom: 3 kolom = span-2, 2 kolom = span-3, penuh = span-6 */}
          <div className="grid gap-4 py-2 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <Label htmlFor={`no_surat-${jenis}`}>Nomor Surat *</Label>
              <Input
                id={`no_surat-${jenis}`}
                value={form.no_surat}
                onChange={set("no_surat")}
                required
                className="mt-1.5"
                placeholder={isMasuk ? "mis. 001/SMANSA/VIII/2026" : "mis. 002/SMANSA/VIII/2026"}
              />
            </div>
            {isMasuk ? (
              <div className="sm:col-span-3">
                <Label htmlFor={`tgl_terima-${jenis}`}>Tanggal Diterima</Label>
                <Input id={`tgl_terima-${jenis}`} type="date" value={form.tgl_terima} onChange={set("tgl_terima")} className="mt-1.5" />
              </div>
            ) : (
              <div className="sm:col-span-3">
                <Label>Cara Kirim</Label>
                <NativeSelect value={form.cara_kirim} onChange={set("cara_kirim")} className="mt-1.5 w-full">
                  {CARA_KIRIM.map((k) => (<option key={k}>{k}</option>))}
                </NativeSelect>
              </div>
            )}

            {/* 1 baris 3 kolom: Tanggal Surat | Sifat | Kode Klasifikasi */}
            <div className="sm:col-span-2">
              <Label htmlFor={`tgl_surat-${jenis}`}>Tanggal Surat</Label>
              <Input id={`tgl_surat-${jenis}`} type="date" value={form.tgl_surat} onChange={set("tgl_surat")} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label>Sifat Surat</Label>
              <NativeSelect value={form.sifat} onChange={set("sifat")} className="mt-1.5 w-full">
                {SIFAT.map((k) => (<option key={k}>{k}</option>))}
              </NativeSelect>
            </div>
            <div className="sm:col-span-2">
              <Label>Kode Klasifikasi</Label>
              <select
                value={form.kode_klasifikasi}
                onChange={(e) => set("kode_klasifikasi")(e as React.ChangeEvent<HTMLSelectElement>)}
                className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {klasifikasiTree.map((root) => (
                  <optgroup key={root.kode} label={`${root.kode} — ${root.nama}`}>
                    {root.children?.length
                      ? root.children.map((sub) => (
                          sub.children?.length ? (
                            <Fragment key={sub.kode}>
                              {sub.children.map((leaf) => (
                                <option key={leaf.kode} value={leaf.kode}>
                                  {`    ${leaf.kode} — ${leaf.nama}`}
                                </option>
                              ))}
                            </Fragment>
                          ) : (
                            <option key={sub.kode} value={sub.kode}>
                              {`  ${sub.kode} — ${sub.nama}`}
                            </option>
                          )
                        ))
                      : (
                        <option key={root.kode} value={root.kode}>
                          {`${root.kode} — ${root.nama}`}
                        </option>
                      )}
                  </optgroup>
                ))}
                {/* kode lama yang tidak ada di daftar baru */}
                {form.kode_klasifikasi && !klasifikasiFlat.some((k) => k.kode === form.kode_klasifikasi) ? (
                  <optgroup label="(kode lama)">
                    <option value={form.kode_klasifikasi}>{form.kode_klasifikasi}</option>
                  </optgroup>
                ) : null}
              </select>
            </div>

            <div className="sm:col-span-6">
              <Label htmlFor={`pihak-${jenis}`}>{isMasuk ? "Pengirim / Instansi Asal" : "Tujuan / Alamat Yang Dituju"}</Label>
              <Input
                id={`pihak-${jenis}`}
                value={isMasuk ? form.pengirim : form.tujuan}
                onChange={set(isMasuk ? "pengirim" : "tujuan")}
                className="mt-1.5"
                placeholder={isMasuk ? "mis. Dinas Pendidikan Jawa Barat" : "mis. Cabang Dinas Pendidikan Wilayah IV"}
              />
            </div>

            <div className="sm:col-span-6">
              <Label htmlFor={`perihal-${jenis}`}>Perihal / Isi Ringkas</Label>
              <Textarea id={`perihal-${jenis}`} value={form.perihal} onChange={set("perihal")} rows={2} className="mt-1.5" placeholder="mis. Undangan rapat koordinasi" />
            </div>

            {isMasuk ? (
              <>
                <div className="sm:col-span-3">
                  <Label htmlFor={`disposisi-${jenis}`}>Tujuan Disposisi</Label>
                  <Input id={`disposisi-${jenis}`} value={form.tujuan_disposisi} onChange={set("tujuan_disposisi")} className="mt-1.5" placeholder="Kepala Sekolah / Wakasek / TU" />
                </div>
                <div className="sm:col-span-3">
                  <Label>Status</Label>
                  <NativeSelect value={form.status} onChange={set("status")} className="mt-1.5 w-full">
                    {[...new Set([...STATUS[jenis], form.status])].map((k) => (<option key={k}>{k}</option>))}
                  </NativeSelect>
                </div>
              </>
            ) : (
              <div className="sm:col-span-3">
                <Label>Status</Label>
                <NativeSelect value={form.status} onChange={set("status")} className="mt-1.5 w-full">
                  {[...new Set([...STATUS[jenis], form.status])].map((k) => (<option key={k}>{k}</option>))}
                </NativeSelect>
              </div>
            )}

            {/* Unggah langsung ke Drive (mode edit: dengan id → tautan tersimpan di baris ini). */}
            <div className="sm:col-span-6">
              <LampiranField
                value={lampiran}
                jenis={jenis}
                id={surat?.id}
                onChange={(l) => setLampiran(l)}
                label={isMasuk ? "Scan Surat Masuk (PDF / gambar)" : "Scan Surat Keluar (PDF / gambar)"}
              />
            </div>
          </div>

          {err ? <p className="text-xs font-medium text-destructive">{err}</p> : null}

          <Separator className="mt-4" />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner /> : <CheckIcon />}
              {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : `Simpan Surat ${isMasuk ? "Masuk" : "Keluar"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
