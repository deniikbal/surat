"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircleIcon, ArrowRightIcon, CheckIcon, FileTextIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
      router.push("/")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh">
      {/* Panel kiri (desktop) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-lg bg-white/15">
            <FileTextIcon className="size-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Persuratan</p>
            <p className="text-[11px] text-foreground/60">SMAN 1 Bantarujeg</p>
          </div>
        </div>

        <div className="max-w-sm">
          <h2 className="text-2xl font-bold leading-snug text-foreground">
            Kelola agenda surat masuk &amp; keluar dalam satu tempat.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-foreground/70">
            {[
              "Nomor agenda otomatis (SM-001, SK-001, ...)",
              "Register bisa dicari & difilter per status",
              "Dashboard ringkas: surat perlu diproses, sifat penting",
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

      {/* Form */}
      <div className="flex w-full items-center justify-center bg-background px-4 py-10 lg:w-1/2">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div className="space-y-1.5 text-center lg:text-left">
            <div className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/10 text-primary lg:hidden">
              <FileTextIcon className="size-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {checking ? "Memuat..." : needsSetup ? "Buat Akun Administrator" : "Masuk"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {checking
                ? " "
                : needsSetup
                  ? "Belum ada akun — akun pertama menjadi administrator."
                  : "Silakan masuk untuk mengelola persuratan."}
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
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="mt-1.5 h-10"
              />
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

          <p className="text-center text-[11px] text-muted-foreground lg:text-left">
            Akses khusus petugas TU &amp; pimpinan sekolah.
          </p>
        </form>
      </div>
    </main>
  )
}
