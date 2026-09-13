"use client"

import { DownloadIcon, FileTextIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

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
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl gap-0 p-0 sm:max-w-[min(calc(100%-2rem),768px)]">
        <DialogHeader className="flex-row items-center gap-3 border-b px-4 py-2.5 pr-12 text-left">
          <FileTextIcon className="size-4 shrink-0 text-primary" />
          <DialogTitle className="min-w-0 flex-1 truncate text-sm" title={item.fileName}>
            {item.fileName}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            render={
              <a
                href={`https://drive.google.com/uc?export=download&id=${item.fileId}`}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <DownloadIcon /> Unduh
          </Button>
        </DialogHeader>

        <div className="relative h-[60vh] max-h-[560px] min-h-0 flex-1 bg-muted/30">
          {loading ? (
            <div className="absolute inset-0 grid place-items-center">
              <Spinner className="size-6 text-muted-foreground" />
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
      </DialogContent>
    </Dialog>
  )
}
