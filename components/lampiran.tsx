"use client"

import { useRef, useState } from "react"
import { EyeIcon, FileTextIcon, Loader2Icon, PaperclipIcon, XIcon } from "lucide-react"

import { PreviewModal } from "@/components/preview"
import { cn } from "@/lib/utils"

export type Lampiran = { file_id: string; file_name: string }

export function driveViewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`
}

// Unggah lampiran ke Drive. `id` > 0 → sekalian simpan tautan ke baris surat.
export async function uploadLampiran(jenis: "masuk" | "keluar", file: File, id?: number) {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch(`/api/surat/upload?jenis=${jenis}${id ? `&id=${id}` : ""}`, {
    method: "POST",
    body: fd,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Gagal mengunggah berkas")
  return data as Lampiran
}

// Hapus file Drive yang belum tertaut surat (dibatalkan user di form).
export async function hapusLampiranDrive(fileId: string) {
  await fetch(`/api/surat/upload?fileId=${encodeURIComponent(fileId)}`, { method: "DELETE" }).catch(
    () => undefined,
  )
}

export function LampiranField({
  value,
  onChange,
  jenis,
  id,
  label = "Lampiran Berkas (PDF / gambar)",
}: {
  value: Lampiran | null
  onChange: (l: Lampiran | null) => void
  jenis: "masuk" | "keluar"
  id?: number
  label?: string
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setErr(null)
    try {
      onChange(await uploadLampiran(jenis, file, id))
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Gagal mengunggah berkas")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="sm:col-span-2">
      <label className="mb-1.5 block text-xs font-semibold text-foreground/80">{label}</label>
      {value ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <FileTextIcon className="size-4" />
          </span>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-primary hover:underline"
            title={`Pratinjau ${value.file_name}`}
          >
            <span className="truncate">{value.file_name}</span>
            <EyeIcon className="size-3.5 shrink-0" />
          </button>
          {preview ? (
            <PreviewModal item={{ fileId: value.file_id, fileName: value.file_name }} onClose={() => setPreview(false)} />
          ) : null}
          <button
            type="button"
            onClick={() => {
              // Lampiran dari form Input (belum tertaut surat) → hapus dari Drive juga.
              if (!id) hapusLampiranDrive(value.file_id)
              onChange(null)
            }}
            title="Hapus lampiran"
            className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            "flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed text-sm font-medium transition",
            busy ? "opacity-60" : "hover:border-primary/50 hover:bg-muted/50",
            err ? "border-destructive/50 text-destructive" : "text-muted-foreground",
          )}
        >
          {busy ? <Loader2Icon className="size-4 animate-spin" /> : <PaperclipIcon className="size-4" />}
          {busy ? "Mengunggah ke Drive..." : "Pilih berkas (maks. 15 MB)"}
        </button>
      )}
      {err ? <p className="mt-1.5 text-xs font-medium text-destructive">{err}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
        onChange={pick}
        className="hidden"
      />
    </div>
  )
}
