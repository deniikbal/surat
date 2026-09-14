"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircleIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { signIn, signUp } from "@/lib/auth-client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [needsSetup, setNeedsSetup] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/setup-status")
      .then((r) => r.json())
      .then((d) => setNeedsSetup(Boolean(d.needsSetup)))
      .catch(() => undefined)
      .finally(() => setChecking(false))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (needsSetup) {
        const r = await signUp.email({ email, password, name: name || email.split("@")[0] })
        if (r.error) {
          setError("Gagal membuat akun: " + (r.error.message ?? "coba lagi"))
          return
        }
        setNeedsSetup(false)
      }
      const r = await signIn.email({ email, password })
      if (r.error) {
        setError("Email atau password salah")
        return
      }
      router.push("/dashboard")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Form (kiri) */}
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-14">
        <Link href="/" className="flex w-fit items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeftIcon className="size-3.5" /> Kembali ke halaman depan
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <form onSubmit={submit} className="w-full max-w-sm space-y-4">
            <div className="space-y-1.5">
              <BrandLogo className="size-11 rounded-xl" />
              <h1 className="pt-2 text-xl font-bold tracking-tight">
                {checking ? "Memuat..." : needsSetup ? "Buat Akun Administrator" : "Selamat datang kembali"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {checking
                  ? " "
                  : needsSetup
                    ? "Belum ada akun — akun pertama menjadi administrator."
                    : "Masuk untuk mengelola persuratan SMAN 1 Bantarujeg."}
              </p>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {needsSetup && !checking ? (
              <div>
                <Label htmlFor="name">Nama lengkap</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-1.5 h-10" />
              </div>
            ) : null}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="tu@smansaba.sch.id"
                autoComplete="email"
                className="mt-1.5 h-10"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={8}
                placeholder="Minimal 8 karakter"
                autoComplete={needsSetup ? "new-password" : "current-password"}
                className="mt-1.5 h-10"
              />
            </div>

            <Button type="submit" size="lg" disabled={loading || checking} className="h-10 w-full">
              {loading ? <Spinner /> : <ArrowRightIcon />}
              {needsSetup ? "Buat Akun & Masuk" : "Masuk"}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              Akses khusus petugas TU &amp; pimpinan sekolah.
            </p>
          </form>
        </div>
      </div>

      {/* Hero (kanan) — hanya desktop */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="size-9 rounded-lg" />
          <div>
            <p className="text-sm font-bold">Persuratan</p>
            <p className="text-[11px] text-foreground/60">SMAN 1 Bantarujeg</p>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-snug">
            Kelola agenda surat masuk &amp; keluar dalam satu tempat.
          </h2>
          <ul className="mt-7 space-y-3.5 text-sm text-foreground/75">
            {[
              "Nomor agenda otomatis (SM-001, SK-001, ...)",
              "Register bisa dicari & difilter per status",
              "Lampiran scan tersimpan digital di Google Drive",
              "Dashboard ringkas: surat menunggu & sifat penting",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-foreground/50" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-foreground/40">Sistem Informasi Persuratan Sekolah</p>
      </div>
    </main>
  )
}
