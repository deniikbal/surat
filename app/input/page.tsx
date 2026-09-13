"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2Icon, InboxIcon, SendIcon } from "lucide-react"

import { Shell } from "@/components/shell"
import { LampiranField, type Lampiran } from "@/components/lampiran"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

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
    <Shell>
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Segmen jenis */}
        <ToggleGroup
          className="w-full"
          value={[jenis]}
          onValueChange={(v) => v[0] && switchJenis(v[0] as Jenis)}
          variant="default"
          size="lg"
          spacing={2}
        >
          {(["masuk", "keluar"] as const).map((j) => {
            const Icon = j === "masuk" ? InboxIcon : SendIcon
            return (
              <ToggleGroupItem key={j} value={j} className="flex-1 py-2 text-sm font-semibold">
                <Icon />
                Surat {j === "masuk" ? "Masuk" : "Keluar"}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>

        {msg ? (
          <Alert variant={msg.ok ? "default" : "destructive"} className={msg.ok ? "border-success/30 bg-success/10 text-success [&_svg]:text-success" : undefined}>
            {msg.ok ? <CheckCircle2Icon /> : undefined}
            <AlertDescription>{msg.text}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={submit}>
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nomor Agenda</Label>
                <div className="mt-1.5 flex h-8 items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-2.5 text-sm text-muted-foreground">
                  <span className="font-mono font-semibold text-foreground/70">{isMasuk ? "SM" : "SK"}-xxx</span>
                  Otomatis — tidak dapat diubah
                </div>
              </div>

              <div>
                <Label htmlFor="no_surat">Nomor Surat *</Label>
                <Input id="no_surat" value={form.no_surat} onChange={set("no_surat")} required className="mt-1.5" placeholder={isMasuk ? "mis. 421.2/123/DISDIK" : "mis. 005/SMANSA/IX/2026"} />
              </div>
              <div>
                <Label htmlFor="tgl1">{isMasuk ? "Tanggal Diterima" : "Tanggal Surat"}</Label>
                <Input
                  id="tgl1"
                  type="date"
                  value={isMasuk ? form.tgl_terima : form.tgl_surat}
                  onChange={set(isMasuk ? "tgl_terima" : "tgl_surat")}
                  className="mt-1.5"
                />
              </div>

              {isMasuk ? (
                <div>
                  <Label htmlFor="tgl_surat">Tanggal Surat</Label>
                  <Input id="tgl_surat" type="date" value={form.tgl_surat} onChange={set("tgl_surat")} className="mt-1.5" />
                </div>
              ) : (
                <div>
                  <Label>Cara Kirim</Label>
                  <NativeSelect value={form.cara_kirim} onChange={set("cara_kirim")} className="mt-1.5">
                    {CARA_KIRIM.map((k) => (<option key={k}>{k}</option>))}
                  </NativeSelect>
                </div>
              )}

              <div>
                <Label>Sifat Surat</Label>
                <NativeSelect value={form.sifat} onChange={set("sifat")} className="mt-1.5">
                  {SIFAT.map((k) => (<option key={k}>{k}</option>))}
                </NativeSelect>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="pihak">{isMasuk ? "Pengirim / Instansi Asal" : "Tujuan / Alamat Yang Dituju"}</Label>
                <Input
                  id="pihak"
                  value={isMasuk ? form.pengirim : form.tujuan}
                  onChange={set(isMasuk ? "pengirim" : "tujuan")}
                  className="mt-1.5"
                  placeholder={isMasuk ? "mis. Dinas Pendidikan Jawa Barat" : "mis. Cabang Dinas Pendidikan Wilayah IV"}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="perihal">Perihal / Isi Ringkas</Label>
                <Textarea id="perihal" value={form.perihal} onChange={set("perihal")} rows={3} className="mt-1.5" placeholder="mis. Undangan rapat koordinasi" />
              </div>

              <div>
                <Label>Kode Klasifikasi</Label>
                <NativeSelect value={form.kode_klasifikasi} onChange={set("kode_klasifikasi")} className="mt-1.5">
                  {KELASIFIKASI.map((k) => (<option key={k}>{k}</option>))}
                </NativeSelect>
              </div>

              {isMasuk ? (
                <div>
                  <Label htmlFor="disposisi">Tujuan Disposisi</Label>
                  <Input id="disposisi" value={form.tujuan_disposisi} onChange={set("tujuan_disposisi")} className="mt-1.5" placeholder="Kepala Sekolah / Wakasek / TU" />
                </div>
              ) : null}

              <div>
                <Label>Status</Label>
                <NativeSelect value={form.status} onChange={set("status")} className="mt-1.5">
                  {STATUS[jenis].map((k) => (<option key={k}>{k}</option>))}
                </NativeSelect>
              </div>

              <LampiranField value={lampiran} onChange={setLampiran} jenis={jenis} label={isMasuk ? "Scan Surat Masuk (PDF / gambar)" : "Scan Surat Keluar (PDF / gambar)"} />
            </CardContent>

            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-[11px] text-muted-foreground">* wajib diisi</p>
              <Button type="submit" size="lg" disabled={saving}>
                {saving ? <Spinner /> : <CheckCircle2Icon />}
                {saving ? "Menyimpan..." : `Simpan Surat ${isMasuk ? "Masuk" : "Keluar"}`}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </Shell>
  )
}
