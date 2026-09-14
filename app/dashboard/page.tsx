"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  InboxIcon,
  MailMinusIcon,
  MailPlusIcon,
  SendIcon,
  TimerIcon,
  TrendingUpIcon,
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
  const [bulan, setBulan] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch("/api/surat?per_page=6")
      .then((r) => r.json())
      .then((d) => {
        setMasuk(Array.isArray(d.surat) ? d.surat : [])
        setStatsMasuk(d.stats ?? {})
        setBulan((b) => ({ ...b, masuk: d.month_count ?? 0 }))
      })
      .catch(() => setMasuk([]))
    fetch("/api/surat?jenis=keluar&per_page=6")
      .then((r) => r.json())
      .then((d) => {
        setKeluar(Array.isArray(d.surat) ? d.surat : [])
        setStatsKeluar(d.stats ?? {})
        setBulan((b) => ({ ...b, keluar: d.month_count ?? 0 }))
      })
      .catch(() => setKeluar([]))
  }, [])

  // statistik dari API (tidak terpengaruh pagination)
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
  const masukBulan = bulan.masuk ?? 0
  const keluarBulan = bulan.keluar ?? 0

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
          {/* Baris 1 — ringkasan utama */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={MailMinusIcon}
              label="Surat Masuk"
              value={totalMasuk}
              sub={`${masukBulan} bulan ini`}
              trend={`${belum} perlu diproses`}
              subPct={totalMasuk ? Math.round((belum / totalMasuk) * 100) : 0}
              href="/surat-masuk"
              tone="primary"
            />
            <Stat
              icon={MailPlusIcon}
              label="Surat Keluar"
              value={totalKeluar}
              sub={`${keluarBulan} bulan ini`}
              trend={`${draft} masih draft`}
              subPct={totalKeluar ? Math.round((draft / totalKeluar) * 100) : 0}
              href="/surat-keluar"
              tone="info"
            />
            <Stat
              icon={TimerIcon}
              label="Belum Tuntas"
              value={belum + proses + draft}
              sub={`${belum} masuk · ${proses} proses · ${draft} draft`}
              trend={`${Math.round(((belum + proses + draft) / Math.max(totalMasuk + totalKeluar, 1)) * 100)}% total`}
              href="/surat-masuk"
              tone="warning"
            />
            <Stat
              icon={SendIcon}
              label="Sifat Penting/Segera"
              value={urgent}
              sub="Butuh perhatian lebih"
              trend={`${totalMasuk + totalKeluar > 0 ? Math.round((urgent / (totalMasuk + totalKeluar)) * 100) : 0}% dari total`}
              href="/surat-masuk"
              tone="destructive"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
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
                      <EmptyMedia variant="icon"><InboxIcon /></EmptyMedia>
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

            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm font-bold">
                    <span>Status Surat Masuk</span>
                    <span className="font-mono text-xs text-muted-foreground">{totalMasuk} total</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Bar label="Belum Diproses" value={belum} total={totalMasuk} tone="bg-destructive" />
                  <Bar label="Dalam Proses" value={proses} total={totalMasuk} tone="bg-warning" />
                  <Bar label="Selesai" value={selesai} total={totalMasuk} tone="bg-success" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm font-bold">
                    <span>Status Surat Keluar</span>
                    <span className="font-mono text-xs text-muted-foreground">{totalKeluar} total</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Bar label="Draft" value={draft} total={totalKeluar} tone="bg-warning" />
                  <Bar label="Dikirim" value={dikirim} total={totalKeluar} tone="bg-success" />
                  <Bar label="Arsip" value={arsip} total={totalKeluar} tone="bg-muted-foreground/40" />
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <CheckCircle2Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Tingkat penyelesaian</p>
                    <p className="text-xs text-muted-foreground">
                      {totalMasuk ? Math.round((selesai / totalMasuk) * 100) : 0}% surat masuk sudah selesai
                    </p>
                    <Progress value={totalMasuk ? (selesai / totalMasuk) * 100 : 0} className="mt-1.5 gap-0">
                      <ProgressTrack className="h-1.5">
                        <ProgressIndicator className="bg-success" />
                      </ProgressTrack>
                    </Progress>
                  </div>
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
  icon: Icon, label, value, sub, trend, subPct, href, tone,
}: {
  icon: typeof InboxIcon; label: string; value: number;
  sub: string; trend: string; subPct?: number; href: string;
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
      <Card className="group relative overflow-hidden p-4 transition hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className={`grid size-9 place-items-center rounded-lg ${toneCls}`}>
            <Icon className="size-4" />
          </div>
          <ArrowUpRightIcon className="size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
        </div>
        <p className="mt-3 font-mono text-2xl font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-1 text-sm font-medium">{label}</p>
        <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <TrendingUpIcon className="size-3" />
          {sub}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">{trend}</p>
        {typeof subPct === "number" ? (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-muted">
            <div
              className={`h-full ${tone === "primary" ? "bg-primary" : tone === "info" ? "bg-info" : tone === "warning" ? "bg-warning" : "bg-destructive"}`}
              style={{ width: `${Math.min(100, Math.max(0, subPct))}%` }}
            />
          </div>
        ) : null}
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
