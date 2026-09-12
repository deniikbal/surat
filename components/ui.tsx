import { cn } from "@/lib/utils"

export function formatDate(v: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!v) return "-"
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(new Date(`${v}T00:00:00+07:00`))
}

export function relativeDay(v: string | null | undefined): string {
  if (!v) return "-"
  const d = new Date(`${v}T00:00:00+07:00`)
  const today = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date())}T00:00:00+07:00`)
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000)
  if (diff === 0) return "Hari ini"
  if (diff === 1) return "Kemarin"
  if (diff > 1 && diff < 7) return `${diff} hari lalu`
  if (diff < 0 && diff > -7) return `${-diff} hari lagi`
  return formatDate(v)
}

const TONES: Record<string, string> = {
  // selesai / terkirim
  Selesai: "bg-success/10 text-success ring-success/20",
  Dikirim: "bg-success/10 text-success ring-success/20",
  Arsip: "bg-muted text-muted-foreground ring-border",
  // berjalan
  "Dalam Proses": "bg-warning/10 text-warning ring-warning/20",
  Draft: "bg-warning/10 text-warning ring-warning/20",
  // perlu tindakan
  "Belum Diproses": "bg-destructive/10 text-destructive ring-destructive/20",
  // sifat
  Biasa: "bg-muted text-muted-foreground ring-border",
  Penting: "bg-info/10 text-info ring-info/20",
  Segera: "bg-warning/10 text-warning ring-warning/20",
  Rahasia: "bg-destructive/10 text-destructive ring-destructive/20",
}

export function Chip({ label, kind = "status" }: { label: string; kind?: "status" | "sifat" }) {
  const tone = TONES[label] || "bg-muted text-muted-foreground ring-border"
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap",
        tone,
        kind === "sifat" && "font-medium",
      )}
    >
      {label}
    </span>
  )
}
