"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckIcon,
  FileTextIcon,
  InboxIcon,
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
    <Shell>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs value={jenis} onValueChange={(v) => switchJenis(v as Jenis)} className="w-auto">
            <TabsList className="h-10 gap-1 border bg-card p-1 shadow-sm">
              {(["masuk", "keluar"] as const).map((j) => {
                const Icon = j === "masuk" ? InboxIcon : SendIcon
                return (
                  <TabsTrigger key={j} value={j} className="px-4 font-semibold">
                    <Icon />
                    Surat {j === "masuk" ? "Masuk" : "Keluar"}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>

          <InputGroup className="w-full md:max-w-xs">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nomor surat, pihak, perihal..."
            />
            {q ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" variant="ghost" onClick={() => setQ("")} title="Bersihkan pencarian">
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </div>

        <ToggleGroup
          value={[status]}
          onValueChange={(v) => v[0] && setStatus(v[0] as string)}
          variant="outline"
          size="sm"
          spacing={2}
          className="flex-wrap"
        >
          {STATUS_FILTER[jenis].map((s) => (
            <ToggleGroupItem key={s} value={s} className="gap-1.5 rounded-full px-3 text-xs font-semibold">
              {s}
              {rows !== null && counts[s] !== undefined ? (
                <Badge variant={status === s ? "secondary" : "outline"} className="h-4 px-1.5 font-mono text-[10px] tabular-nums">
                  {counts[s]}
                </Badge>
              ) : null}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {msg ? (
          <Alert variant={msg.ok ? "default" : "destructive"} className={msg.ok ? "border-success/30 bg-success/10 text-success" : undefined}>
            <AlertDescription>{msg.text}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="overflow-hidden py-0">
          {rows === null ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Empty className="border-0 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon />
                </EmptyMedia>
                <EmptyTitle>Tidak ada surat yang cocok</EmptyTitle>
                <EmptyDescription>Ubah kata kunci atau filter status.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[920px] text-sm">
                <TableHeader className="bg-muted/50 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase [&_th]:h-auto [&_th]:px-4 [&_th]:py-3">
                  <TableRow>
                    <TableHead>Agenda</TableHead>
                    <TableHead>Nomor &amp; Tanggal</TableHead>
                    <TableHead>{isMasuk ? "Pengirim" : "Tujuan"}</TableHead>
                    <TableHead>Perihal</TableHead>
                    <TableHead>Klasifikasi</TableHead>
                    <TableHead>Sifat</TableHead>
                    <TableHead>{isMasuk ? "Disposisi" : "Cara Kirim"}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Berkas</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/70">
                  {rows.map((s) => (
                    <TableRow key={s.id} className="align-top transition hover:bg-muted/40">
                      <TableCell className="px-4 py-3">
                        <span className="rounded-md bg-primary/5 px-2 py-1 font-mono text-xs font-bold text-primary">
                          {s.no_agenda || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <p className="font-mono text-xs">{s.no_surat || "-"}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {isMasuk ? `Diterima ${relativeDay(s.tgl_terima)}` : formatDate(s.tgl_surat)}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-44 px-4 py-3">
                        <p className="truncate font-medium" title={(isMasuk ? s.pengirim : s.tujuan) || ""}>
                          {(isMasuk ? s.pengirim : s.tujuan) || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-64 px-4 py-3">
                        <p className="line-clamp-2" title={s.perihal || ""}>{s.perihal || "-"}</p>
                      </TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.kode_klasifikasi || "-"}</TableCell>
                      <TableCell className="px-4 py-3">{s.sifat ? <Chip label={s.sifat} kind="sifat" /> : "-"}</TableCell>
                      <TableCell className="max-w-36 px-4 py-3 text-xs text-muted-foreground">
                        <p className="truncate">{(isMasuk ? s.tujuan_disposisi : s.cara_kirim) || "-"}</p>
                      </TableCell>
                      <TableCell className="px-4 py-3"><Chip label={s.status} /></TableCell>
                      <TableCell className="px-4 py-3">
                        {s.file_id ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => setPreview(s)}
                            title={s.file_name || "Pratinjau lampiran"}
                            className="bg-primary/5 font-semibold text-primary hover:bg-primary/10 hover:text-primary"
                          >
                            <FileTextIcon /> Lihat
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button variant="ghost" size="icon" onClick={() => setEdit(s)} className="text-muted-foreground hover:bg-primary/10 hover:text-primary">
                                    <PencilIcon />
                                  </Button>
                                }
                              >
                                <span className="sr-only">Ubah surat</span>
                              </TooltipTrigger>
                              <TooltipContent>Ubah surat</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button variant="ghost" size="icon" onClick={() => setDel(s)} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                    <Trash2Icon />
                                  </Button>
                                }
                              >
                                <span className="sr-only">Hapus surat</span>
                              </TooltipTrigger>
                              <TooltipContent>Hapus surat</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

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

      <AlertDialog open={!!del} onOpenChange={(o) => !o && !busy && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus surat ini?</AlertDialogTitle>
            <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          {del ? (
            <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
              <span className="font-mono font-bold text-primary">{del.no_agenda}</span>
              <span className="mx-1.5 text-muted-foreground">•</span>
              {del.perihal || del.no_surat || "(tanpa perihal)"}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busy ? <Spinner /> : <Trash2Icon />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl gap-0 sm:max-w-[calc(100%-2rem)]">
        <DialogHeader className="pr-12 text-left">
          <DialogTitle className="text-sm font-bold">Ubah Surat {isMasuk ? "Masuk" : "Keluar"}</DialogTitle>
          <DialogDescription className="text-xs">
            No. Agenda <span className="font-mono font-bold text-primary">{surat.no_agenda || "-"}</span> tetap (tidak diubah).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave(form)
          }}
        >
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div>
              <Label>Nomor Surat</Label>
              <Input value={form.no_surat ?? ""} onChange={set("no_surat")} className="mt-1.5" />
            </div>
            {isMasuk ? (
              <>
                <div>
                  <Label>Tanggal Diterima</Label>
                  <Input type="date" value={form.tgl_terima ?? ""} onChange={set("tgl_terima")} className="mt-1.5" />
                </div>
                <div>
                  <Label>Tanggal Surat</Label>
                  <Input type="date" value={form.tgl_surat ?? ""} onChange={set("tgl_surat")} className="mt-1.5" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Tanggal Surat</Label>
                  <Input type="date" value={form.tgl_surat ?? ""} onChange={set("tgl_surat")} className="mt-1.5" />
                </div>
                <div>
                  <Label>Cara Kirim</Label>
                  <NativeSelect value={form.cara_kirim ?? ""} onChange={set("cara_kirim")} className="mt-1.5">
                    {CARA_KIRIM.map((k) => (<option key={k}>{k}</option>))}
                  </NativeSelect>
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <Label>{isMasuk ? "Pengirim / Instansi Asal" : "Tujuan / Alamat"}</Label>
              <Input
                value={(isMasuk ? form.pengirim : form.tujuan) ?? ""}
                onChange={set(isMasuk ? "pengirim" : "tujuan")}
                className="mt-1.5"
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Perihal</Label>
              <Textarea value={form.perihal ?? ""} onChange={set("perihal")} rows={2} className="mt-1.5" />
            </div>

            <div>
              <Label>Kode Klasifikasi</Label>
              <NativeSelect value={form.kode_klasifikasi ?? ""} onChange={set("kode_klasifikasi")} className="mt-1.5">
                {[...new Set([...KELASIFIKASI, form.kode_klasifikasi].filter(Boolean))].map((k) => (<option key={k}>{k}</option>))}
              </NativeSelect>
            </div>
            <div>
              <Label>Sifat</Label>
              <NativeSelect value={form.sifat ?? ""} onChange={set("sifat")} className="mt-1.5">
                {[...new Set([...SIFAT, form.sifat].filter(Boolean))].map((k) => (<option key={k}>{k}</option>))}
              </NativeSelect>
            </div>

            {isMasuk ? (
              <div>
                <Label>Tujuan Disposisi</Label>
                <Input value={form.tujuan_disposisi ?? ""} onChange={set("tujuan_disposisi")} className="mt-1.5" />
              </div>
            ) : null}

            <div>
              <Label>Status</Label>
              <NativeSelect value={form.status} onChange={set("status")} className="mt-1.5">
                {[...new Set([...STATUS[jenis], form.status])].map((k) => (<option key={k}>{k}</option>))}
              </NativeSelect>
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

          <Separator />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner /> : <CheckIcon />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
