"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircleIcon, ArrowRightIcon, FileTextIcon, Loader2Icon } from "lucide-react"

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

  const inputCls =
    "h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"

  return (
    <main className="flex min-h-svh">
      {/* Panel kiri (desktop) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-primary p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-lg bg-white/15">
            <FileTextIcon className="size-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Persuratan</p>
            <p className="text-[11px] text-white/60">SMAN 1 Bantarujeg</p>
          </div>
        </div>

        <div className="max-w-sm">
          <h2 className="text-2xl font-bold leading-snug text-white">
            Kelola agenda surat masuk &amp; keluar dalam satu tempat.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-white/75">
            {[
              "Nomor agenda otomatis (SM-001, SK-001, ...)",
              "Register bisa dicari & difilter per status",
              "Dashboard ringkas: surat perlu diproses, sifat penting",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-white/50" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-white/40">Sistem Informasi Persuratan Sekolah</p>
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
            <p className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3.5 py-3 text-sm font-medium text-destructive ring-1 ring-destructive/20 ring-inset">
              <AlertCircleIcon className="size-4 shrink-0" />
              {error}
            </p>
          ) : null}

          {needsSetup && !checking ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
              autoComplete="name"
              className={inputCls}
            />
          ) : null}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground/80">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="tu@smansaba.sch.id"
              autoComplete="email"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground/80">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={8}
              placeholder="Minimal 8 karakter"
              autoComplete={needsSetup ? "new-password" : "current-password"}
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={loading || checking}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <>
                {needsSetup ? "Buat Akun & Masuk" : "Masuk"}
                <ArrowRightIcon className="size-4" />
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-muted-foreground lg:text-left">
            Akses khusus petugas TU &amp; pimpinan sekolah.
          </p>
        </form>
      </div>
    </main>
  )
}
