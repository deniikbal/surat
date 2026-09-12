"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRightIcon,
  ClockIcon,
  InboxIcon,
  Loader2Icon,
  MailMinusIcon,
  MailPlusIcon,
  SendIcon,
  TimerIcon,
} from "lucide-react"

import { Shell } from "@/components/shell"
import { Chip, formatDate, relativeDay } from "@/components/ui"

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

  useEffect(() => {
    fetch("/api/surat")
      .then((r) => r.json())
      .then((d) => setMasuk(Array.isArray(d.surat) ? d.surat : []))
      .catch(() => setMasuk([]))
    fetch("/api/surat?jenis=keluar")
      .then((r) => r.json())
      .then((d) => setKeluar(Array.isArray(d.surat) ? d.surat : []))
      .catch(() => setKeluar([]))
  }, [])

  const c = (rows: Surat[] | null, fn: (s: Surat) => boolean) => (rows ?? []).filter(fn).length
  const belum = c(masuk, (s) => s.status === "Belum Diproses")
  const proses = c(masuk, (s) => s.status === "Dalam Proses")
  const draft = c(keluar, (s) => s.status === "Draft")
  const urgent = c(masuk, (s) => s.sifat === "Penting" || s.sifat === "Segera") + c(keluar, (s) => s.sifat === "Penting" || s.sifat === "Segera")

  // gabungan terbaru masuk+keluar utk timeline
  const recent: Array<Surat & { _jenis: "masuk" | "keluar" }> = [
    ...(masuk ?? []).map((s) => ({ ...s, _jenis: "masuk" as const })),
    ...(keluar ?? []).map((s) => ({ ...s, _jenis: "keluar" as const })),
  ]
    .sort((a, b) => (b.tgl_terima || b.tgl_surat || "").localeCompare(a.tgl_terima || a.tgl_surat || ""))
    .slice(0, 6)

  const loading = masuk === null || keluar === null

  return (
    <Shell title="Dashboard" subtitle="Ringkasan arus surat sekolah hari ini.">
      {loading ? (
        <div className="flex items-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" /> Memuat data...
        </div>
      ) : (
        <div className="space-y-5">
          {/* Kartu statistik */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat icon={MailMinusIcon} label="Surat Masuk" value={masuk?.length ?? 0} note="Total tercatat" href="/data" tone="primary" />
            <Stat icon={MailPlusIcon} label="Surat Keluar" value={keluar?.length ?? 0} note="Total tercatat" href="/data" tone="info" />
            <Stat icon={TimerIcon} label="Perlu Diproses" value={belum + proses + draft} note={`${belum} masuk · ${proses} proses · ${draft} draft`} href="/data" tone="warning" />
            <Stat icon={SendIcon} label="Sifat Penting/Segera" value={urgent} note="Perlu perhatian" href="/data" tone="destructive" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            {/* Timeline terbaru */}
            <section className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold">Aktivitas Surat Terbaru</h2>
                <Link href="/data" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  Lihat semua <ArrowUpRightIcon className="size-3" />
                </Link>
              </div>
              {recent.length === 0 ? (
                <EmptyState />
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
            </section>

            {/* Kolom kanan */}
            <div className="space-y-5">
              <section className="card p-5">
                <h2 className="mb-3 text-sm font-bold">Status Surat Masuk</h2>
                <Bar label="Belum Diproses" value={belum} total={masuk?.length ?? 0} tone="bg-destructive" />
                <Bar label="Dalam Proses" value={proses} total={masuk?.length ?? 0} tone="bg-warning" />
                <Bar label="Selesai" value={c(masuk, (s) => s.status === "Selesai")} total={masuk?.length ?? 0} tone="bg-success" />
              </section>

              <section className="card p-5">
                <h2 className="mb-3 text-sm font-bold">Status Surat Keluar</h2>
                <Bar label="Draft" value={draft} total={keluar?.length ?? 0} tone="bg-warning" />
                <Bar label="Dikirim" value={c(keluar, (s) => s.status === "Dikirim")} total={keluar?.length ?? 0} tone="bg-success" />
                <Bar label="Arsip" value={c(keluar, (s) => s.status === "Arsip")} total={keluar?.length ?? 0} tone="bg-muted-foreground/40" />
              </section>

              <Link href="/input" className="card flex items-center gap-3 p-4 transition hover:border-primary/40 hover:shadow-md">
                <div className="grid size-10 place-items-center rounded-lg bg-primary text-white">
                  <MailPlusIcon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Catat surat baru</p>
                  <p className="text-xs text-muted-foreground">No. agenda dibuat otomatis (SM/SK-xxx)</p>
                </div>
                <ArrowUpRightIcon className="ml-auto size-4 text-muted-foreground" />
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
    <Link href={href} className="card group p-4 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`grid size-9 place-items-center rounded-lg ${toneCls}`}>
          <Icon className="size-4.5" />
        </div>
        <ArrowUpRightIcon className="size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
      </div>
      <p className="mt-3 font-mono text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>
    </Link>
  )
}

function Bar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold tabular-nums">{value}<span className="text-muted-foreground/60"> ({pct}%)</span></span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted">
        <InboxIcon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Belum ada surat tercatat</p>
      <p className="text-xs text-muted-foreground">Mulai dari menu Input Surat.</p>
    </div>
  )
}
