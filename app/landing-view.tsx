"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  FileTextIcon,
  InboxIcon,
  LockIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react"

import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const FITUR = [
  {
    icon: InboxIcon,
    judul: "Surat Masuk",
    isi: "Catat surat dari instansi luar lengkap dengan tanggal diterima, pengirim, disposisi, dan status proses.",
  },
  {
    icon: SendIcon,
    judul: "Surat Keluar",
    isi: "Registrasi surat yang dikirim sekolah — lengkap dengan cara kirim (Biasa, Registered, Email, dan lainnya).",
  },
  {
    icon: FileTextIcon,
    judul: "Lampiran Terpusat",
    isi: "Scan surat tersimpan aman di Google Drive sekolah. Pratinjau langsung, tanpa repot cari berkas fisik.",
  },
  {
    icon: CheckCircle2Icon,
    judul: "Pantau Proses",
    isi: "Dashboard menampilkan surat yang belum diproses, dalam proses, selesai, dan yang bersifat penting/segera.",
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-svh bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 md:px-6">
          <BrandLogo className="size-8 rounded-lg" />
          <div className="ml-2.5 leading-tight">
            <span className="block text-sm font-bold">Persuratan</span>
            <span className="block text-[10px] text-muted-foreground">SMAN 1 Bantarujeg</span>
          </div>
          <div className="ml-auto">
            <Button render={<Link href="/login" />} size="sm" className="h-9">
              Masuk <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 text-center md:px-6 md:pt-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <SparklesIcon className="size-3.5 text-primary" />
          Sistem Informasi Persuratan Sekolah
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          Kelola surat masuk &amp; keluar sekolah{" "}
          <span className="text-primary">tanpa buku agenda manual</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
          Nomor agenda dibuat otomatis, register bisa dicari &amp; difilter, lampiran tersimpan
          digital di Google Drive. Semua rekam jejak surat SMAN 1 Bantarujeg dalam satu tempat.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/login" />} size="lg" className="h-11 px-6">
            Masuk Sekarang <ArrowRightIcon />
          </Button>
          <Button render={<Link href="/login" />} variant="outline" size="lg" className="h-11 px-6">
            <LockIcon /> Akses Khusus Petugas
          </Button>
        </div>
      </section>

      {/* Fitur */}
      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FITUR.map((f) => (
            <Card key={f.judul} className="p-5">
              <div className="flex items-start gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">{f.judul}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.isi}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Alur 3 langkah */}
      <section className="border-y bg-muted/40 py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-center text-xl font-bold md:text-2xl">Sederhana dalam 3 langkah</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { n: "1", t: "Catat Surat", d: "Isi nomor surat, pengirim/tujuan, perihal. Nomor agenda SM-/SK- dibuat otomatis oleh sistem." },
              { n: "2", t: "Lampirkan Scan", d: true, teks: "Unggah scan PDF/gambar (maks. 2 MB) — langsung tersimpan di Drive sekolah." },
              { n: "3", t: "Pantau Status", teks: "Ubah status tiap surat — Belum Diproses, Dalam Proses, Selesai — dari register." },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <span className={cn("mx-auto grid size-11 place-items-center rounded-full text-lg font-bold", s.d ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary")}>
                  {s.n}
                </span>
                <p className="mt-3 text-sm font-bold">{s.t}</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{s.teks}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-xs text-muted-foreground md:flex-row md:px-6">
        <p>Sistem Informasi Persuratan — SMAN 1 Bantarujeg</p>
        <p>© {new Date().getFullYear()} SMAN 1 Bantarujeg</p>
      </footer>
    </main>
  )
}
