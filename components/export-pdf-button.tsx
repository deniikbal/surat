"use client"

import { useState } from "react"
import { DownloadIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { exportPdf, type Jenis } from "@/lib/export-pdf"

type Row = Record<string, string | number | null>

export function ExportPdfButton({
  jenis, status, q, rows,
}: {
  jenis: Jenis
  status: string
  q: string
  rows: Row[] | null
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const total = rows?.length ?? 0
  async function go() {
    if (!rows?.length) {
      setErr("Tidak ada data untuk diekspor.")
      return
    }
    setBusy(true)
    setErr(null)
    try {
      await exportPdf(jenis, rows, { filter: status, search: q })
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal membuat PDF.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex flex-col items-stretch">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={go}
        disabled={busy || !total}
        className="gap-1.5"
        title={`Ekspor ${total} baris ke PDF`}
      >
        {busy ? <Loader2Icon className="size-3.5 animate-spin" /> : <DownloadIcon className="size-3.5" />}
        PDF
      </Button>
      {err ? <span className="mt-1 text-[10px] text-destructive">{err}</span> : null}
    </div>
  )
}
