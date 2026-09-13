"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  InboxIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  Trash2Icon,
  TimerIcon,
  XIcon,
} from "lucide-react"

import { PreviewModal } from "@/components/preview"
import { Shell } from "@/components/shell"
import { SuratFormDialog, STATUS, type Jenis, type Surat } from "@/components/surat-form"
import { Chip } from "@/components/ui"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const PER_PAGE = 15

function relativeDay(v: string | null | undefined) {
  if (!v) return "-"
  return Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${v}T00:00:00+07:00`),
  )
}

export function SuratHalaman({ jenis }: { jenis: Jenis }) {
  const isMasuk = jenis === "masuk"
  const judul = isMasuk ? "Surat Masuk" : "Surat Keluar"

  const [rows, setRows] = useState<Surat[] | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [status, setStatus] = useState("Semua")
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [edit, setEdit] = useState<Surat | null>(null)
  const [del, setDel] = useState<Surat | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [preview, setPreview] = useState<Surat | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    const params = new URLSearchParams({ jenis, page: String(page), per_page: String(PER_PAGE) })
    if (status !== "Semua") params.set("status", status)
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim())
    try {
      const res = await fetch(`/api/surat?${params}`)
      const data = await res.json()
      setRows(Array.isArray(data.surat) ? data.surat : [])
      setTotal(data.total ?? 0)
      setStats(data.stats ?? {})
    } catch {
      setRows([])
    }
  }, [jenis, status, debouncedQ, page])

  useEffect(() => {
    setRows(null)
    load()
  }, [load])

  // Modal "Catat Surat" di navbar bisa menyimpan dari halaman mana pun.
  useEffect(() => {
    function onSaved() {
      load()
    }
    window.addEventListener("surat-saved", onSaved)
    return () => window.removeEventListener("surat-saved", onSaved)
  }, [load])

  function resetFilter(fn: () => void) {
    fn()
    setPage(1)
  }

  async function confirmDelete() {
    if (!del) return
    setBusy(true)
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

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  // kartu statistik per status + total
  const statCards = [
    { label: "Total", value: stats.total ?? 0, icon: isMasuk ? InboxIcon : SendIcon, tone: "bg-primary/10 text-primary" },
    ...STATUS[jenis].map((s) => ({
      label: s,
      value: stats[s] ?? 0,
      icon: s === "Selesai" || s === "Dikirim" ? CheckCircle2Icon : TimerIcon,
      tone:
        s === "Selesai" || s === "Dikirim"
          ? "bg-success/10 text-success"
          : s === "Belum Diproses" || s === "Draft"
            ? "bg-warning/10 text-warning"
            : "bg-info/10 text-info",
    })),
  ]

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header + tombol create */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={cn("grid size-9 place-items-center rounded-lg", statCards[0].tone)}>
              {isMasuk ? <InboxIcon className="size-4.5" /> : <SendIcon className="size-4.5" />}
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight">{judul}</h1>
              <p className="text-xs text-muted-foreground">
                Agenda {isMasuk ? "SM" : "SK"} otomatis • {total} surat terdaftar
              </p>
            </div>
          </div>
          <Button onClick={() => { setEdit(null); setFormOpen(true) }}>
            <PlusIcon /> Catat {judul}
          </Button>
        </div>

        {/* Kartu statistik */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {statCards.map((c) => (
            <Card key={c.label} className="p-4">
              <div className={cn("mb-2 grid size-8 place-items-center rounded-lg", c.tone)}>
                <c.icon className="size-4" />
              </div>
              <p className="font-mono text-2xl font-bold tabular-nums">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <ToggleGroup
            value={[status]}
            onValueChange={(v) => v[0] && resetFilter(() => setStatus(v[0] as string))}
            variant="outline"
            size="sm"
            spacing={2}
            className="flex-wrap"
          >
            {["Semua", ...STATUS[jenis]].map((s) => (
              <ToggleGroupItem key={s} value={s} className="gap-1.5 rounded-full px-3 text-xs font-semibold data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                {s}
                <Badge variant={status === s ? "secondary" : "outline"} className="h-4 px-1.5 font-mono text-[10px] tabular-nums">
                  {s === "Semua" ? (stats.total ?? 0) : (stats[s] ?? 0)}
                </Badge>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <InputGroup className="w-full md:max-w-xs">
            <InputGroupAddon><SearchIcon /></InputGroupAddon>
            <InputGroupInput
              value={q}
              onChange={(e) => resetFilter(() => setQ(e.target.value))}
              placeholder={isMasuk ? "Cari nomor, pengirim, perihal..." : "Cari nomor, tujuan, perihal..."}
            />
            {q ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" variant="ghost" onClick={() => resetFilter(() => setQ(""))} title="Bersihkan pencarian">
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </div>

        {msg ? (
          <Alert variant={msg.ok ? "default" : "destructive"} className={msg.ok ? "border-success/30 bg-success/10 text-success" : undefined}>
            <AlertDescription>{msg.text}</AlertDescription>
          </Alert>
        ) : null}

        {/* Tabel */}
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
                <EmptyMedia variant="icon"><SearchIcon /></EmptyMedia>
                <EmptyTitle>Tidak ada surat yang cocok</EmptyTitle>
                <EmptyDescription>Ubah kata kunci atau filter status, atau catat surat baru.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
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
                          <span className="rounded-md bg-primary/5 px-2 py-1 font-mono text-xs font-bold text-primary">{s.no_agenda || "-"}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <p className="font-mono text-xs">{s.no_surat || "-"}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {isMasuk ? `Diterima ${relativeDay(s.tgl_terima)}` : relativeDay(s.tgl_surat)}
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
                            <Button type="button" variant="ghost" size="xs" onClick={() => setPreview(s)} title={s.file_name || "Pratinjau lampiran"} className="bg-primary/5 font-semibold text-primary hover:bg-primary/10 hover:text-primary">
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
                                    <Button variant="ghost" size="icon" onClick={() => { setEdit(s); setFormOpen(true) }} className="text-muted-foreground hover:bg-primary/10 hover:text-primary">
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

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Halaman {page} dari {totalPages} • {total} surat
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeftIcon /> Prev
                  </Button>
                  <span className="rounded-lg border border-primary bg-primary px-3 py-1.5 font-mono text-sm font-semibold text-primary-foreground tabular-nums">
                    {page}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next <ChevronRightIcon />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {formOpen ? (
        <SuratFormDialog
          key={`${jenis}-${edit?.id ?? "new"}`}
          jenis={jenis}
          surat={edit}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSaved={(m) => { setMsg(m); load() }}
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
              {busy ? <Trash2Icon className="animate-pulse" /> : <Trash2Icon />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  )
}
