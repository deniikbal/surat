"use client"

import { DownloadIcon, FileTextIcon, Loader2Icon, XIcon } from "lucide-react"
import { useState } from "react"

export type PreviewItem = { fileId: string; fileName: string }

const isImage = (name: string) => /\.(jpe?g|png|webp|gif)$/i.test(name)

// Pratinjau berkas Drive dalam modal: gambar = <img>, PDF/dokumen = iframe /preview.
export function PreviewModal({ item, onClose }: { item: PreviewItem | null; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  if (!item) return null

  const img = isImage(item.fileName)
  const src = img
    ? `https://drive.google.com/thumbnail?id=${item.fileId}&sz=w1600`
    : `https://drive.google.com/file/d/${item.fileId}/preview`

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-label={`Pratinjau ${item.fileName}`}
    >
      <div
        className="flex h-[70vh] max-h-[640px] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-3 border-b px-4 py-2.5">
          <FileTextIcon className="size-4 shrink-0 text-primary" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold" title={item.fileName}>
            {item.fileName}
          </p>
          <a
            href={`https://drive.google.com/uc?export=download&id=${item.fileId}`}
            target="_blank"
            rel="noreferrer"
            title="Unduh berkas"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <DownloadIcon className="size-4" /> Unduh
          </a>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Tutup pratinjau"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-muted/30">
          {loading ? (
            <div className="absolute inset-0 grid place-items-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : null}
          {img ? (
            <img
              src={src}
              alt={item.fileName}
              className="h-full w-full object-contain"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          ) : (
            <iframe
              src={src}
              title={item.fileName}
              className="h-full w-full border-0"
              onLoad={() => setLoading(false)}
              allow="autoplay"
            />
          )}
        </div>
      </div>
    </div>
  )
}
