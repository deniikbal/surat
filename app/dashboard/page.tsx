"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRightIcon,
  ClockIcon,
  InboxIcon,
  MailMinusIcon,
  MailPlusIcon,
  SendIcon,
  TimerIcon,
} from "lucide-react"

import { Shell } from "@/components/shell"
import { Chip, relativeDay } from "@/components/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"

type Surat = {
  id: number
  status: string
  sifat: string | null
  pengirim?: string | null
  tujuan?: string | null
  perihal: string | null
  tgl_terima?: string | null
  tgl_surat: string | null
  no_agenda: string | null
}

export default function DashboardPage() {
  const [masuk, setMasuk] = useState<Surat[] | null>(null)
  const [keluar, setKeluar] = useState<Surat[] | null>(null)

  const [statsMasuk, setStatsMasuk] = useState<Record<string, number>>({})
  const [statsKeluar, setStatsKeluar] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch("/api/surat?per_page=6")
      .then((r) => r.json())
      .then((d) => {
        setMasuk(Array.isArray(d.surat) ? d.surat : [])
        setStatsMasuk(d.stats ?? {})
      })
      .catch(() => setMasuk([]))
    fetch("/api/surat?jenis=keluar&per_page=6")
      .then((r) => r.json())
      .then((d) => {
        setKeluar(Array.isArray(d.surat) ? d.surat : [])
        setStatsKeluar(d.stats ?? {})
      })
      .catch(() => setKeluar([]))
  }, [])

  // statistik dari API (tidak terpengaruh pagination); baris hanya utk timeline
  const belum = statsMasuk["Belum Diproses"] ?? 0
  const proses = statsMasuk["Dalam Proses"] ?? 0
  const selesai = statsMasuk["Selesai"] ?? 0
  const draft = statsKeluar["Draft"] ?? 0
  const dikirim = statsKeluar["Dikirim"] ?? 0
  const arsip = statsKeluar["Arsip"] ?? 0
  const totalMasuk = statsMasuk.total ?? 0
  const totalKeluar = statsKeluar.total ?? 0
  const urgent =
    (statsMasuk["sifat:Penting"] ?? 0) + (statsMasuk["sifat:Segera"] ?? 0) +
    (statsKeluar["sifat:Penting"] ?? 0) + (statsKeluar["sifat:Segera"] ?? 0)

  // gabungan terbaru masuk+keluar utk timeline
  const recent: Array<Surat & { _jenis: "masuk" | "keluar" }> = [
    ...(masuk ?? []).map((s) => ({ ...s, _jenis: "masuk" as const })),
    ...(keluar ?? []).map((s) => ({ ...s, _jenis: "keluar" as const })),
  ]
    .sort((a, b) => (b.tgl_terima || b.tgl_surat || "").localeCompare(a.tgl_terima || a.tgl_surat || ""))
    .slice(0, 6)

  const loading = masuk === null || keluar === null

  return (
    <Shell>
      {loading ? (
        <div className="flex items-center gap-2 py-20 text-sm text-muted-foreground">
          <Spinner /> Memuat data...
        </div>
      ) : (
        <div className="space-y-5">
          {/* Kartu statistik */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat icon={MailMinusIcon} label="Surat Masuk" value={totalMasuk} note="Total tercatat" href="/surat-masuk" tone="primary" />
            <Stat icon={MailPlusIcon} label="Surat Keluar" value={totalKeluar} note="Total tercatat" href="/surat-keluar" tone="info" />
            <Stat icon={TimerIcon} label="Perlu Diproses" value={belum + proses + draft} note={`${belum} masuk · ${proses} proses · ${draft} draft`} href="/surat-masuk" tone="warning" />
            <Stat icon={SendIcon} label="Sifat Penting/Segera" value={urgent} note="Perlu perhatian" href="/surat-masuk" tone="destructive" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            {/* Timeline terbaru */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold">Aktivitas Surat Terbaru</CardTitle>
                <Link href="/surat-masuk" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  Lihat semua <ArrowUpRightIcon className="size-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {recent.length === 0 ? (
                  <Empty className="border-0 py-8">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <InboxIcon />
                      </EmptyMedia>
                      <EmptyTitle>Belum ada surat tercatat</EmptyTitle>
                      <EmptyDescription>Mulai dari menu Input Surat.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <ul className="space-y-1">
                    {recent.map((s) => (
                      <li key={`${s._jenis}-${s.id}`} className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition hover:bg-muted/60">
                        <div className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${s._jenis === "masuk" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"}`}>
                          {s._jenis === "masuk" ? <InboxIcon className="size-4" /> : <SendIcon className="size-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{s.perihal || "(tanpa perihal)"}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                            <span className="font-mono">{s.no_agenda}</span>
                            <span>•</span>
                            <span className="truncate">{s._jenis === "masuk" ? s.pengirim : s.tujuan}</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <ClockIcon className="size-3" /> {relativeDay(s.tgl_terima || s.tgl_surat)}
                          </span>
                          <Chip label={s.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Kolom kanan */}
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Status Surat Masuk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Bar label="Belum Diproses" value={belum} total={totalMasuk} tone="bg-destructive" />
                  <Bar label="Dalam Proses" value={proses} total={totalMasuk} tone="bg-warning" />
                  <Bar label="Selesai" value={selesai} total={totalMasuk} tone="bg-success" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Status Surat Keluar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Bar label="Draft" value={draft} total={totalKeluar} tone="bg-warning" />
                  <Bar label="Dikirim" value={dikirim} total={totalKeluar} tone="bg-success" />
                  <Bar label="Arsip" value={arsip} total={totalKeluar} tone="bg-muted-foreground/40" />
                </CardContent>
              </Card>

              <Link href="/surat-masuk">
                <Card className="flex items-center gap-3 p-4 transition hover:border-primary/40 hover:shadow-md">
                  <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <MailPlusIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Catat surat baru</p>
                    <p className="text-xs text-muted-foreground">No. agenda dibuat otomatis (SM/SK-xxx)</p>
                  </div>
                  <ArrowUpRightIcon className="ml-auto size-4 text-muted-foreground" />
                </Card>
              </Link>
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}

function Stat({
  icon: Icon, label, value, note, href, tone,
}: {
  icon: typeof InboxIcon; label: string; value: number; note: string; href: string;
  tone: "primary" | "info" | "warning" | "destructive"
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  }[tone]
  return (
    <Link href={href}>
      <Card className="group flex items-center gap-3 p-3 transition hover:shadow-md">
        <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${toneCls}`}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-mono text-xl font-bold leading-tight tabular-nums">{value}</p>
          <p className="truncate text-[11px] text-muted-foreground/80">{note}</p>
        </div>
        <ArrowUpRightIcon className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
      </Card>
    </Link>
  )
}

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <Progress value={pct} className="gap-0">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold tabular-nums">
          {value}
          <span className="text-muted-foreground/60"> ({pct}%)</span>
        </span>
      </div>
      <ProgressTrack className="h-1.5">
        <ProgressIndicator className={tone} />
      </ProgressTrack>
    </Progress>
  )
}
