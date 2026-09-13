"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function formatDate(v: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!v) return "-"
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(new Date(`${v}T00:00:00+07:00`))
}

export function relativeDay(v: string | null | undefined) {
  if (!v) return "-"
  const tgl = new Date(`${v}T00:00:00+07:00`)
  return Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(tgl)
}

const STATUS_COLOR: Record<string, string> = {
  "Belum Diproses": "bg-destructive/10 text-destructive border-transparent",
  "Dalam Proses": "bg-warning/10 text-warning border-transparent",
  Selesai: "bg-success/10 text-success border-transparent",
  Draft: "bg-warning/10 text-warning border-transparent",
  Dikirim: "bg-success/10 text-success border-transparent",
  Arsip: "bg-muted text-muted-foreground border-transparent",
}
const SIFAT_COLOR: Record<string, string> = {
  Biasa: "bg-muted text-muted-foreground border-transparent",
  Penting: "bg-warning/10 text-warning border-transparent",
  Segera: "bg-destructive/10 text-destructive border-transparent",
  Rahasia: "bg-primary/10 text-primary border-transparent",
}

export function Chip({ label, kind = "status" }: { label: string; kind?: "status" | "sifat" }) {
  const map = kind === "status" ? STATUS_COLOR : SIFAT_COLOR
  return (
    <Badge className={cn("border", map[label] ?? "bg-muted text-muted-foreground border-transparent")}>
      {label}
    </Badge>
  )
}
